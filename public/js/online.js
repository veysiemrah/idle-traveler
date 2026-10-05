/* Idle Traveler — Yolcular: diğer gezginlerle paylaşılan liste (Worker + D1, /api/hello).
   Oyun bağlantı olmadan da tam çalışır; sunucuya ulaşılamazsa liste "ulaşılamıyor" durumunda bekler ve yeniden dener. */
(function (root) {
  'use strict';
  const IT = root.IT = root.IT || {};
  const BEAT_MS = 30e3, RETRY_MS = 60e3, TIMEOUT_MS = 8e3;
  // Hazır mesajlar (sunucudaki listeyle aynı); yolda başka gezgin varken mesajlar 6 sn'de bir yoklanır
  const MSGS = ['hi', 'view', 'go', 'wait', 'race', 'great', 'thanks', 'rest', 'bye'];
  const FEED_MS = 6e3, MSG_FRESH_MS = 9e3;

  // Sunucudakiyle aynı kural: 2–20 karakter; harf, rakam, boşluk ve . _ ' - (en az bir harf ya da rakam)
  function cleanName(raw) {
    if (typeof raw !== 'string') return null;
    const s = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
    const n = [...s].length;
    if (n < 2 || n > 20) return null;
    if (!/^[\p{L}\p{M}\p{N} ._'-]+$/u.test(s) || !/[\p{L}\p{N}]/u.test(s)) return null;
    return s;
  }
  const hex = bytes => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  const rand = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; };
  function newId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const h = hex(rand(16));
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
  }
  const newKey = () => hex(rand(32));
  const validId = id => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
  const validKey = k => typeof k === 'string' && /^[0-9a-f]{64}$/.test(k);

  const Online = {
    status: 'wait', // wait: ilk yanıt bekleniyor, ok: liste güncel, error: sunucuya ulaşılamıyor
    data: null,     // son yanıt: { online, total, players: [...], me }
    at: 0,          // son yanıtın geldiği an (Date.now)
    onUpdate: null, // liste ya da durum değişince çağrılır
    onConflict: null, // kimlik başkasına aitse (403) yeni kimlik istenir
    onMessage: null,  // yeni bir hazır mesaj gelince: { pub, msg, age }
    _get: null, _timer: 0, _busy: false, _feedTimer: 0, _seen: new Set(),
    // Bu tarayıcının sahnedeki anahtarı (kendi mesajını iki kez göstermemek için)
    myPub() { const d = this.data; const m = d && (d.me || d.players.find(p => p.me)); return m ? m.pub : null; },
    // Başka biri yoldaysa ve sekme açıksa mesaj akışı yoklanır; yoksa hiç istek atılmaz
    _feedNext() {
      clearTimeout(this._feedTimer);
      this._feedTimer = setTimeout(() => this._pollFeed(), FEED_MS);
    },
    async _pollFeed() {
      const visible = typeof document === 'undefined' || document.visibilityState === 'visible';
      if (visible && this.status === 'ok' && this.data && this.data.online > 1) {
        const r = await this._fetch('api/feed', { cache: 'no-store' });
        if (r && r.ok) { try { this._takeFeed(await r.json()); } catch (e) { /* yok say */ } }
      }
      this._feedNext();
    },
    // Akıştaki yeni mesajları bir kez bildirir (çok eskiyse sessizce geçer)
    _takeFeed(d) {
      if (!d || !Array.isArray(d.feed)) return;
      for (const m of d.feed) {
        const key = m.pub + ':' + m.at;
        if (this._seen.has(key) || !(MSGS.includes(m.msg) || m.msg === 'wave')) continue;
        this._seen.add(key);
        const age = Math.max(0, d.now - m.at);
        if (age < MSG_FRESH_MS && this.onMessage) this.onMessage({ pub: m.pub, msg: m.msg, age, to: m.to || '' });
      }
      if (this._seen.size > 500) this._seen = new Set([...this._seen].slice(-200));
    },
    async _fetch(url, opts) {
      if (!(typeof location !== 'undefined' && /^https?:$/.test(location.protocol))) return null;
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctl && setTimeout(() => ctl.abort(), TIMEOUT_MS);
      try { return await fetch(url, Object.assign({ signal: ctl && ctl.signal }, opts)); } catch (e) { return null; } finally { if (timer) clearTimeout(timer); }
    },
    // Hazır mesaj ya da el sallama (msg 'wave', to: alıcının pub'ı) gönderir: 'ok' | 'too-soon' | 'offline' | 'error'
    async say(msg, id, key, to) {
      if (!MSGS.includes(msg) && !(msg === 'wave' && to)) return 'error';
      const r = await this._fetch('api/say', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, key, msg, to }) });
      if (!r) return 'error';
      if (r.ok) { try { this._takeFeed(await r.json()); } catch (e) { /* yok say */ } return 'ok'; }
      try { const e = await r.json(); return e.error === 'too-soon' ? 'too-soon' : e.error === 'offline' || e.error === 'unknown' ? 'offline' : 'error'; } catch (e) { return 'error'; }
    },

    // get(): { id, key, name, dist, trip, veh, route } ya da isim yoksa null (o zaman yalnızca liste okunur)
    start(get) { this._get = get; this.now(); this._feedNext(); },
    // Hemen haber ver (isim değişince, sayfa yeniden görünür olunca)
    now() { clearTimeout(this._timer); this._beat(); },
    _next(ms) { clearTimeout(this._timer); this._timer = setTimeout(() => this._beat(), ms); },
    async _beat() {
      if (this._busy) return;
      this._busy = true;
      const body = this._get && this._get();
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctl && setTimeout(() => ctl.abort(), TIMEOUT_MS);
      let ok = false;
      // Dosyadan açılmış sayfada (file://) sunucu yoktur: istek atmadan "ulaşılamıyor" durumunda kalınır
      const web = typeof location !== 'undefined' && /^https?:$/.test(location.protocol);
      if (web) try {
        const res = await fetch(body ? 'api/hello' : 'api/players', body
          ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl && ctl.signal }
          : { signal: ctl && ctl.signal, cache: 'no-store' });
        if (res.status === 403 && this.onConflict) { this.onConflict(); this._busy = false; this._next(1000); return; }
        if (res.ok) {
          const d = await res.json();
          if (d && Array.isArray(d.players)) { this.data = d; this.at = Date.now(); ok = true; this._takeFeed(d); }
        }
      } catch (e) { /* çevrimdışı ya da sunucu yok */ }
      if (timer) clearTimeout(timer);
      this.status = ok ? 'ok' : 'error';
      this._busy = false;
      this._next(ok ? BEAT_MS : RETRY_MS);
      if (this.onUpdate) this.onUpdate();
    },
    // Sunucudan bu yana geçen süre de eklenmiş "en son görülme" (ms)
    ago(p) { return p.online ? 0 : p.ago + (Date.now() - this.at); },
  };

  Object.assign(IT, { Online, MSGS, cleanName, newId, newKey, validId, validKey });
})(typeof window !== 'undefined' ? window : globalThis);
