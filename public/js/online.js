/* Idle Traveler — Yolcular: diğer gezginlerle paylaşılan liste (Worker + D1, /api/hello).
   Oyun bağlantı olmadan da tam çalışır; sunucuya ulaşılamazsa liste "ulaşılamıyor" durumunda bekler ve yeniden dener. */
(function (root) {
  'use strict';
  const IT = root.IT = root.IT || {};
  const BEAT_MS = 30e3, RETRY_MS = 60e3, TIMEOUT_MS = 8e3;

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
    _get: null, _timer: 0, _busy: false,

    // get(): { id, key, name, dist, trip, veh, route } ya da isim yoksa null (o zaman yalnızca liste okunur)
    start(get) { this._get = get; this.now(); },
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
          if (d && Array.isArray(d.players)) { this.data = d; this.at = Date.now(); ok = true; }
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

  Object.assign(IT, { Online, cleanName, newId, newKey, validId, validKey });
})(typeof window !== 'undefined' ? window : globalThis);
