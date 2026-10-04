/* Idle Traveler — oyun durumu, döngü, kayıt, çevrimdışı ilerleme ve arayüz. */
(function () {
  'use strict';
  const IT = window.IT;
  const { VEHICLES, VEH, BUFFS, BUFF, MILESTONES, BADGES, BADGE_BONUS, CONVOY, HOME, Econ, Sound, fmtNum, fmtDist, fmtSpeed, fmtDuration } = IT;

  const SAVE_KEY = 'idle-traveler-save-v1';
  const BY = { walk: 'yürüyerek', skates: 'patenle', board: 'kaykayla', bike: 'bisikletle', horse: 'atıyla', moto: 'motosikletle', car: 'arabayla', van: 'karavanıyla',
    train: 'trenle', balloon: 'balonuyla', plane: 'uçakla', jet: 'jetiyle', rocket: 'roketle', sail: 'güneş yelkeniyle' };
  const GIFTS = [
    { id: 'gust',     name: 'Rüzgâr Hortumu',   text: 'hız ×3',            dur: 30, speed: 3, w: 3 },
    { id: 'harvest',  name: 'Bereket',          text: 'kredi ×2',          dur: 45, credit: 2, w: 3 },
    { id: 'zeal',     name: 'Coşku',            text: 'tıklama ×5',        dur: 25, click: 5, w: 2 },
    { id: 'postcard', name: 'Kayıp Kartpostal', text: 'anında kredi',      instant: true, w: 2 },
    { id: 'rainbow',  name: 'Gökkuşağı',        text: 'kredi ×1,5',        dur: 40, credit: 1.5, w: 0 }, // hava olayıyla gelir
  ];
  const GIFT = Object.fromEntries(GIFTS.map(g => [g.id, g]));
  const BULKS = [1, 10, 'max'];
  // Gökyüzü: tarayıcı temasını izle ya da gündüz/gece sabitle
  const SKIES = ['auto', 'day', 'night'];
  const SKY_NAME = { auto: 'Otomatik', day: 'Gündüz', night: 'Gece' };
  const DOUBLINGS = [10, 25, 50, 100, 150, 200];
  // Yağmur yağabilen biyomlar (kar, çöl ve kanyonda yağmur yağmaz)
  const RAINY = { meadow: 1, lavender: 1, pine: 1, wheat: 1, coast: 1, sakura: 1, autumn: 1, tea: 1, tulip: 1, olive: 1 };
  // Eve dönüşte korunan alanlar: istatistikler, rozetler, hatıralar ve ayarlar
  const KEEP = ['created', 'clicks', 'playTime', 'best', 'gifts', 'crits', 'rainbows', 'nightTime', 'totalCredits',
    'badges', 'settings', 'intro', 'memories', 'trips', 'lifeDist'];

  const $ = sel => document.querySelector(sel);
  const nf1 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtGain = m => (m < 10 ? nf1.format(m) + ' m' : m < 1000 ? Math.floor(m) + ' m' : fmtDist(m));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Durum ---------- */
  function defaultState() {
    return {
      v: 1, created: Date.now(), lastSeen: Date.now(),
      distance: 0, credits: 0, totalCredits: 0, clicks: 0, playTime: 0, best: 0, gifts: 0,
      crits: 0, rainbows: 0, nightTime: 0,
      memories: 0, trips: 0, lifeDist: 0, homeReady: false,
      active: 'walk', owned: { walk: true }, levels: { walk: 0 },
      buffs: Object.fromEntries(BUFFS.map(b => [b.id, 0])),
      regionIdx: 0, msIdx: 0, effects: [], badges: {},
      settings: { sfx: true, music: true, bulk: 1, sky: 'auto' }, intro: false,
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return sanitize(JSON.parse(raw));
    } catch (e) { return null; }
  }
  const isObj = o => o && typeof o === 'object' && !Array.isArray(o);
  const count = (x, max) => { x = Math.floor(+x); return isFinite(x) && x > 0 ? Math.min(x, max === undefined ? Infinity : max) : 0; };
  // Bozuk ya da eski sürümden kalan kayıtları güvenli değerlere çeker
  function sanitize(d) {
    if (!isObj(d)) return null;
    const s = defaultState();
    for (const key of Object.keys(s)) if (d[key] !== undefined) s[key] = d[key];
    for (const k of ['distance', 'credits', 'totalCredits', 'playTime', 'best', 'nightTime', 'lifeDist']) if (typeof s[k] !== 'number' || !isFinite(s[k]) || s[k] < 0) s[k] = 0;
    for (const k of ['clicks', 'gifts', 'crits', 'rainbows', 'regionIdx', 'memories', 'trips']) s[k] = count(s[k]);
    // Bölge ve durak sayısı kat edilen yoldan fazla olamaz (bozuk kayıt hız bonusunu şişirmesin)
    s.regionIdx = Math.min(s.regionIdx, IT.regionIndexFor(s.distance));
    s.msIdx = Math.min(count(s.msIdx, MILESTONES.length), MILESTONES.filter(m => m.at <= s.distance).length);
    const buffs = isObj(d.buffs) ? d.buffs : {};
    s.buffs = Object.fromEntries(BUFFS.map(b => [b.id, count(buffs[b.id], b.max)]));
    const owned = isObj(d.owned) ? d.owned : {}, levels = isObj(d.levels) ? d.levels : {};
    s.owned = { walk: true }; s.levels = {};
    for (const v of VEHICLES) {
      if (owned[v.id]) s.owned[v.id] = true;
      if (s.owned[v.id]) s.levels[v.id] = count(levels[v.id]);
    }
    if (!VEH[s.active] || !s.owned[s.active]) s.active = 'walk';
    s.badges = {};
    if (isObj(d.badges)) for (const b of BADGES) if (d.badges[b.id]) s.badges[b.id] = +d.badges[b.id] || Date.now();
    // Etki süresi, kelebek güçlendirmesiyle ulaşılabilecek en uzun süreyi aşamaz
    const maxFx = Date.now() + 3600e3;
    s.effects = Array.isArray(s.effects) ? s.effects.filter(e => isObj(e) && GIFT[e.id] && isFinite(e.until)).map(e => ({ id: e.id, until: Math.min(e.until, maxFx) })) : [];
    s.settings = Object.assign(defaultState().settings, isObj(d.settings) ? d.settings : {});
    if (!BULKS.includes(s.settings.bulk)) s.settings.bulk = 1;
    s.settings.sfx = s.settings.sfx !== false; s.settings.music = s.settings.music !== false;
    if (!SKIES.includes(s.settings.sky)) s.settings.sky = 'auto';
    if (typeof s.lastSeen !== 'number' || !isFinite(s.lastSeen) || s.lastSeen > Date.now()) s.lastSeen = Date.now();
    s.intro = !!s.intro; s.homeReady = !!s.homeReady;
    return s;
  }
  function save() {
    S.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* depolama kapalı: oyun yine çalışır */ }
  }

  let S = null;
  let scene = null;

  /* ---------- Hesaplar ---------- */
  function tempMult() {
    const now = Date.now(), m = { speed: 1, credit: 1, click: 1 };
    for (const e of S.effects) if (e.until > now) {
      const g = GIFT[e.id];
      if (g.speed) m.speed *= g.speed;
      if (g.credit) m.credit *= g.credit;
      if (g.click) m.click *= g.click;
    }
    return m;
  }
  function current() {
    const b = Econ.base(S), t = tempMult();
    return { idle: b.idle * t.speed, click: b.click * t.speed * t.click, cpm: b.cpm * t.credit, base: b, temp: t };
  }

  /* ---------- Çalışma zamanı değişkenleri ---------- */
  let combo = 0, lastClick = 0;
  let rateEma = 0, creditEma = 0;
  let giftIn = 25;
  // Hava: bahar yağmuru, ardından gökkuşağı
  let weather = 'clear', weatherT = 0, weatherIn = 150 + Math.random() * 120;
  let uiDirty = { garage: true, buffs: true, journal: true };
  let uiTimer = 0, saveTimer = 0;
  let lastFrame = performance.now();

  function comboMult() {
    return 1 + Econ.rhythmCap(S.buffs.rhythm) * Math.min(combo, 20) / 20;
  }

  /* ---------- İlerleme ---------- */
  function addDistance(d, cpm) {
    S.distance += d;
    const c = d * cpm;
    S.credits += c; S.totalCredits += c;
    return c;
  }
  function grant(c) { S.credits += c; S.totalCredits += c; }
  // Ödüller son gelire göre ölçeklenir. Çevrimdışıyken ortalama sıfır olduğundan otomatik gelir esas alınır.
  function incomeRate() {
    const b = Econ.base(S);
    return Math.max(creditEma, b.idle * b.cpm);
  }

  function checkProgress(silent) {
    const found = [];
    const idx = IT.regionIndexFor(S.distance);
    while (S.regionIdx < idx) {
      S.regionIdx++;
      const r = IT.regionAt(S.regionIdx);
      const bonus = Math.max(20, incomeRate() * 20);
      grant(bonus);
      found.push({ r, bonus });
    }
    if (found.length) {
      const last = found[found.length - 1];
      scene.setBiome(last.r.biome);
      if (!silent) {
        showBanner(last.r.name, `+${fmtNum(last.bonus)} kredi · Keşif bonusu: kalıcı hız +%6`);
        Sound.region();
      }
      uiDirty.garage = uiDirty.journal = true;
    }
    const ms = [];
    while (S.msIdx < MILESTONES.length && S.distance >= MILESTONES[S.msIdx].at) {
      const m = MILESTONES[S.msIdx];
      const bonus = Math.max(15, incomeRate() * 15);
      grant(bonus);
      ms.push({ m, bonus });
      S.msIdx++;
      uiDirty.journal = true;
    }
    if (!silent) for (const { m, bonus } of ms) { toast(`<b>Durak: ${esc(m.name)}</b> · +${fmtNum(bonus)} kredi`, 'gold'); Sound.milestone(); }
    if (!S.homeReady && Econ.memoryGain(S.distance) > 0) {
      S.homeReady = true; uiDirty.buffs = true;
      if (!silent) toast('<b>Eve dönüş yolu açıldı</b> · Güçlendirmeler sekmesinde hatıralarını topla', 'gold');
    }
    return { regions: found, milestones: ms };
  }

  function checkBadges(silent) {
    const got = [];
    for (const b of BADGES) {
      if (S.badges[b.id] || !b.test(S, { combo })) continue;
      S.badges[b.id] = Date.now();
      got.push(b);
    }
    if (got.length) {
      uiDirty.journal = true;
      if (!silent) for (const b of got) { toast(`<b>Rozet: ${esc(b.name)}</b> · kalıcı +%${Math.round(BADGE_BONUS * 100)} kredi`, 'gold'); Sound.milestone(); }
    }
    return got;
  }

  function step() {
    Sound.unlock();
    const now = performance.now();
    combo = now - lastClick < 650 ? combo + 1 : Math.max(1, combo * 0.5);
    lastClick = now;
    const cur = current();
    const crit = Math.random() < Econ.luckChance(S.buffs.luck);
    const d = cur.click * comboMult() * (crit ? Econ.luckMult : 1);
    addDistance(d, cur.cpm);
    S.clicks++;
    if (crit) S.crits++;
    scene.onStep(crit);
    scene.addFloat(crit ? `Şanslı adım! +${fmtGain(d)}` : `+${fmtGain(d)}`, crit ? { color: '#ffd56b', big: true } : null);
    Sound.step(S.active, crit);
    if (S.clicks === 6) $('#hint').classList.add('gone');
    checkProgress();
    checkBadges();
  }

  function catchGift() {
    Sound.unlock();
    S.gifts++;
    const pool = GIFTS.filter(x => x.w > 0);
    const total = pool.reduce((a, x) => a + x.w, 0);
    let r = Math.random() * total, g = pool[0];
    for (const x of pool) { r -= x.w; if (r <= 0) { g = x; break; } }
    Sound.gift();
    if (g.instant) {
      const bonus = Math.max(40, incomeRate() * 60);
      grant(bonus);
      toast(`<b>Altın kelebek: ${g.name}</b> · +${fmtNum(bonus)} kredi`, 'gold');
      scene.addFloat(`+${fmtNum(bonus)} kredi`, { color: '#ffd56b', big: true });
    } else {
      const dur = addEffect(g, g.dur * (1 + 0.15 * S.buffs.butterfly));
      toast(`<b>Altın kelebek: ${g.name}</b> · ${Math.round(dur)} sn boyunca ${g.text}`, 'gold');
      scene.addFloat(`${g.name}!`, { color: '#ffd56b', big: true });
    }
    checkBadges();
  }
  function addEffect(g, dur) {
    const ex = S.effects.find(e => e.id === g.id && e.until > Date.now());
    if (ex) ex.until += dur * 1000; else S.effects.push({ id: g.id, until: Date.now() + dur * 1000, dur });
    return dur;
  }

  /* ---------- Hava ---------- */
  function updateWeather(dt) {
    const biome = IT.regionAt(S.regionIdx).biome;
    const canRain = RAINY[biome] && scene.alt < 0.3;
    if (weather === 'clear') {
      weatherIn -= dt;
      if (weatherIn <= 0) {
        weatherIn = 360 + Math.random() * 360;
        if (canRain) {
          weather = 'rain'; weatherT = 30 + Math.random() * 15;
          scene.setWeather(1, 0);
          toast('Bir bahar yağmuru başladı. Damlalar yolu serinletiyor.', 'teal');
        }
      }
    } else {
      weatherT -= dt;
      if (weather === 'rain' && (weatherT <= 0 || !canRain)) {
        // Gökkuşağı yalnızca gündüz ve yerdeyken çıkar
        if (canRain && (scene.nightAmt || 0) < 0.5) {
          weather = 'rainbow'; weatherT = GIFT.rainbow.dur;
          scene.setWeather(0, 1);
          addEffect(GIFT.rainbow, GIFT.rainbow.dur);
          S.rainbows++;
          toast(`<b>Gökkuşağı çıktı!</b> · ${GIFT.rainbow.dur} sn boyunca ${GIFT.rainbow.text}`, 'gold');
          Sound.region();
          checkBadges();
        } else { weather = 'clear'; scene.setWeather(0, 0); }
      } else if (weather === 'rainbow' && (weatherT <= 0 || scene.alt >= 0.3)) {
        weather = 'clear'; scene.setWeather(0, 0);
      }
    }
  }

  /* ---------- Çevrimdışı ---------- */
  function applyOffline(sec) {
    const cap = Econ.offlineCapHours(S.buffs.camp) * 3600;
    const counted = Math.min(sec, cap);
    const rate = Econ.offlineRate(S.buffs.dream);
    const b = Econ.base(S);
    const d = b.idle * rate * counted;
    const credits = addDistance(d, b.cpm);
    S.effects = S.effects.filter(e => e.until > Date.now());
    const res = checkProgress(true);
    res.badges = checkBadges(true);
    return { sec, counted, capped: sec > cap, rate, d, credits, res, cap };
  }

  // Uzak kalınan süreyi say ve bildir: kısa aralar bildirimle, uzunlar pencereyle
  function resume(gap) {
    if (gap <= 10) return;
    const off = applyOffline(gap);
    if (gap > 60) showOffline(off); else if (off.d > 0) toast(`Sen yokken +${fmtGain(off.d)} yol alındı.`, 'teal');
  }

  // Yeni bir yolculuk: keep verilirse bu alanlar eski durumdan taşınır
  function newTrip(keep) {
    const fresh = defaultState();
    if (keep) for (const k of keep) fresh[k] = S[k];
    S = fresh;
    scene.setBiome('meadow', true); scene.setVehicle('walk', true);
    combo = 0; rateEma = 0; creditEma = 0; giftIn = 25; scene.gift = null;
    weather = 'clear'; weatherIn = 150 + Math.random() * 120; scene.setWeather(0, 0);
    uiDirty = { garage: true, buffs: true, journal: true };
  }
  function disarm(el, label) {
    setTimeout(() => { if (el.isConnected) { el.dataset.armed = ''; el.textContent = label; el.classList.remove('armed'); } }, 4000);
  }

  /* ---------- Satın almalar ---------- */
  function spend(cost) {
    if (S.credits + 1e-9 < cost) { Sound.deny(); return false; }
    S.credits -= cost; Sound.buy(); return true;
  }
  const actions = {
    buyVeh(id) {
      const v = VEH[id];
      if (S.owned[id] || !spend(v.cost)) return;
      S.owned[id] = true; S.levels[id] = 0;
      uiDirty.garage = true;
      // Yeni araca hemen binilir (hız garajdaki en güçlü araca göre hesaplandığı için düşmez).
      // Sonradan eklenen ara bir araç, daha ileri bir araçtayken alınırsa yalnızca garaja katılır.
      const forward = v.index > VEH[S.active].index;
      if (forward) actions.ride(id);
      const lead = Econ.lead(S);
      toast(!forward
        ? `<b>${v.name} garaja katıldı</b> · ${esc(v.tagline)} Garajdan istediğin an binebilirsin.`
        : lead === id
          ? `<b>Yeni araç: ${v.name}</b> · ${esc(v.tagline)}`
          : `<b>Yeni araç: ${v.name}</b> · Hızını şimdilik ${VEH[lead].name} belirliyor. Birkaç yükseltmeyle ${v.name} öne geçer.`, 'teal');
      checkBadges();
    },
    ride(id) {
      if (!S.owned[id] || S.active === id) return;
      S.active = id; scene.setVehicle(id);
      uiDirty.garage = true;
    },
    upgrade(id) {
      const v = VEH[id], lvl = S.levels[id] || 0;
      if (!S.owned[id]) return;
      const q = Econ.upgradeQuote(v, lvl, S.settings.bulk, S.credits);
      if (!spend(q.cost)) return;
      S.levels[id] = lvl + q.n;
      const crossed = DOUBLINGS.filter(t => t > lvl && t <= lvl + q.n).length;
      if (crossed) toast(`<b>${v.upName} Sv. ${lvl + q.n}</b> · ${v.name} hızı ${crossed > 1 ? crossed + ' kez ' : ''}ikiye katlandı!`, 'teal');
      uiDirty.garage = true;
      checkBadges();
    },
    bulk(id) {
      const n = id === 'max' ? 'max' : +id;
      if (!BULKS.includes(n)) return;
      S.settings.bulk = n; uiDirty.garage = true;
    },
    buff(id) {
      const b = BUFF[id], lvl = S.buffs[id];
      if (b.max && lvl >= b.max) return;
      if (!spend(Econ.buffCost(b, lvl))) return;
      S.buffs[id]++;
      uiDirty.buffs = uiDirty.garage = uiDirty.journal = true;
    },
    tab(id) {
      document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.id === id)));
      document.querySelectorAll('.tabpane').forEach(p => { p.hidden = p.id !== 'pane-' + id; });
      $('.panes').scrollTop = 0;
      try { localStorage.setItem('idle-traveler-tab', id); } catch (e) { /* yok say */ }
    },
    sky(id) {
      if (!SKIES.includes(id) || S.settings.sky === id) return;
      S.settings.sky = id; applySky();
      uiDirty.journal = true;
    },
    sfx() { S.settings.sfx = !S.settings.sfx; Sound.setSfx(S.settings.sfx); uiDirty.journal = true; syncSoundBtn(); },
    music() { S.settings.music = !S.settings.music; Sound.unlock(); Sound.setMusic(S.settings.music); uiDirty.journal = true; syncSoundBtn(); },
    home(_, el) {
      const gain = Econ.memoryGain(S.distance);
      if (gain < 1) return;
      if (el.dataset.armed !== '1') {
        el.dataset.armed = '1'; el.textContent = 'Emin misin? Onaylamak için tekrar dokun';
        el.classList.add('armed');
        disarm(el, 'Eve dön');
        return;
      }
      const trip = { dist: S.distance, regions: S.regionIdx + 1, gain, before: S.memories };
      S.memories += gain; S.trips++; S.lifeDist += S.distance;
      newTrip(KEEP);
      save();
      Sound.region();
      showHome(trip);
      checkBadges();
    },
    reset(_, el) {
      if (el.dataset.armed !== '1') {
        el.dataset.armed = '1'; el.textContent = 'Emin misin? Tüm ilerleme silinir. Onaylamak için tekrar dokun';
        el.classList.add('armed');
        disarm(el, 'Yolculuğu sıfırla');
        return;
      }
      try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* yok say */ }
      newTrip(['settings', 'intro']);
      $('#hint').classList.remove('gone');
      save();
      toast('Yeni bir yolculuk başladı. İyi yolculuklar!', 'teal');
    },
  };

  /* ---------- Döngü ---------- */
  function frame(now) {
    const dt = Math.min(0.25, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;

    // Sekme gizliyken ya da cihaz uykudayken geçen süre: çevrimdışı hızla say
    resume((Date.now() - S.lastSeen) / 1000);
    S.lastSeen = Date.now();

    const cur = current();
    if (performance.now() - lastClick > 900) combo = Math.max(0, combo - dt * 10);
    const before = S.distance;
    addDistance(cur.idle * dt, cur.cpm);
    S.playTime += dt;
    if (scene.mode === 'dark') S.nightTime += dt;
    checkProgress();
    S.effects = S.effects.filter(e => e.until > Date.now());
    updateWeather(dt);

    const gained = S.distance - before + clickBuffer;
    clickBuffer = 0;
    if (dt > 0) {
      const a = 1 - Math.exp(-dt / 0.9);
      rateEma += (gained / dt - rateEma) * a;
      creditEma += (gained * cur.cpm / dt - creditEma) * a;
    }
    if (rateEma > S.best) S.best = rateEma;

    // altın kelebek (pencere açıkken yakalanamayacağı için gelmez)
    if ($('#modal').hidden) giftIn -= dt;
    if (giftIn <= 0) {
      if (!scene.gift) scene.spawnGift(14);
      giftIn = (40 + Math.random() * 45) / (1 + 0.1 * S.buffs.butterfly);
    }

    scene.update(dt, Math.max(rateEma, cur.idle), scene.nightAmt || 0);
    scene.draw();
    Sound.tick(dt, Math.min(1, scene.vs / 700), scene.rain || 0);

    uiTimer += dt;
    if (uiTimer > 0.12) { uiTimer = 0; checkBadges(); refreshUI(); }
    saveTimer += dt;
    if (saveTimer > 5) { saveTimer = 0; save(); }
    requestAnimationFrame(frame);
  }
  // Tıklamalarla gelen mesafe, hız ortalamasına bir sonraki karede eklenir
  let clickBuffer = 0;

  /* ---------- Arayüz ---------- */
  function toast(html, tone) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (tone || '');
    el.innerHTML = html;
    box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 3600);
  }
  let bannerTimer = 0;
  function showBanner(name, sub) {
    const b = $('#banner');
    $('#bannerName').textContent = name;
    $('#bannerSub').textContent = sub;
    b.hidden = false; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    $('#stage').classList.add('banner-on');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => { b.hidden = true; $('#stage').classList.remove('banner-on'); }, 4600);
  }
  // Pencereler sıraya girer: biri açıkken gelen yenisi öncekinin yerine geçmez
  const modalQueue = [];
  function openModal(html, btn, onClose) {
    if (!$('#modal').hidden) { modalQueue.push([html, btn, onClose]); return; }
    $('#modalBody').innerHTML = html;
    const b = $('#modalBtn');
    b.textContent = btn;
    $('#modal').hidden = false;
    b.focus({ preventScroll: true });
    b.onclick = () => {
      $('#modal').hidden = true; Sound.unlock();
      if (onClose) onClose();
      if (modalQueue.length) openModal(...modalQueue.shift());
    };
  }
  function showOffline(o) {
    const v = VEH[S.active];
    const regions = o.res.regions.map(x => x.r.name);
    const ms = o.res.milestones.map(x => x.m.name);
    const badges = (o.res.badges || []).map(b => b.name);
    openModal(`
      <p class="eyebrow">Tekrar hoş geldin</p>
      <h2>Yol seni bekledi, sen de yolu</h2>
      <p class="lead">Sen yokken <b>${fmtDuration(o.sec)}</b> geçti. Yolcun ${BY[v.id]} yola devam etti. Çevrimdışı hızın: otomatik hızın <b>%${Math.round(o.rate * 100)}</b> kadarı.</p>
      <div class="gains">
        <div><span>Kat edilen yol</span><b>+${fmtGain(o.d)}</b></div>
        <div><span>Kazanılan kredi</span><b class="cr">+${fmtNum(o.credits)}</b></div>
      </div>
      ${regions.length ? `<p class="small">Yeni bölgeler: <b>${regions.map(esc).join(', ')}</b></p>` : ''}
      ${ms.length ? `<p class="small">Geçilen duraklar: <b>${ms.map(esc).join(', ')}</b></p>` : ''}
      ${badges.length ? `<p class="small">Kazanılan rozetler: <b>${badges.map(esc).join(', ')}</b></p>` : ''}
      ${o.capped ? `<p class="small muted">Yalnızca ${Econ.offlineCapHours(S.buffs.camp)} saat sayıldı. <i>Uzun Mola</i> ile bu sınırı uzatabilirsin.</p>` : ''}
      ${o.rate < 0.9 ? `<p class="small muted"><i>Rüyada Yolculuk</i> güçlendirmesi çevrimdışı hızını artırır.</p>` : ''}
    `, 'Yola devam et', () => { if (regions.length) showBanner(regions[regions.length - 1], 'Sen yokken buraya vardın'); });
  }
  function showHome(t) {
    const pct = m => Math.round(HOME.bonus * m * 100);
    openModal(`
      <p class="eyebrow">${S.trips}. yolculuk tamamlandı</p>
      <h2>Eve hoş geldin</h2>
      <p class="lead">Sırt çantanı boşalttın, kartpostalları duvara astın. ${fmtDist(t.dist)} yol ve ${t.regions} bölge artık birer hatıra.</p>
      <div class="gains">
        <div><span>Yeni hatıra</span><b>+${fmtNum(t.gain)}</b></div>
        <div><span>Kalıcı hız bonusu</span><b class="cr">%${fmtNum(pct(t.before))} → %${fmtNum(pct(S.memories))}</b></div>
      </div>
      <p class="small muted">Rozetlerin, istatistiklerin ve ayarların seninle. Araçlar ve güçlendirmeler yeniden alınacak; bu kez yol daha hızlı akacak.</p>
    `, 'Yeniden yola çık');
  }
  function showIntro() {
    openModal(`
      <p class="eyebrow">Uzun ve sakin bir yolculuk</p>
      <h2>Idle Traveler</h2>
      <p class="lead">Sırt çantan hazır, yol önünde. Ekrana her dokunuşun bir adım. Kat ettiğin her metre kredi kazandırır.</p>
      <ul class="intro-list">
        <li><b>Garaj</b>: yeni araçlar al, onları yükselt. Her yeni araç yolculuğu başka bir yere taşır.</li>
        <li><b>Güçlendirmeler</b>: daha uzun adımlar, arkadan esen rüzgâr, şanslı adımlar.</li>
        <li><b>Altın kelebekleri</b> yakala. Her biri küçük bir sürpriz getirir.</li>
        <li>Garajdaki her araç hızının yarısını yolculuğuna katar. Hiçbir yükseltme boşa gitmez.</li>
        <li><b>Rozetler</b> topla. Her rozet kalıcı olarak daha fazla kredi kazandırır.</li>
        <li>Oyunu kapatsan da yolcun daha yavaş bir tempoda yürümeye devam eder.</li>
        <li>Uzun bir yolculuktan sonra <b>eve dönebilirsin</b>. Topladığın hatıralar sonraki yolculukları hızlandırır.</li>
      </ul>
    `, 'Yola çık', () => { S.intro = true; save(); });
  }

  // Gökyüzü ayarı sayfanın data-theme özniteliğini yönetir; sahne ve arayüz bu özniteliği zaten izler.
  // Otomatik modda yalnızca kendi koyduğumuz özniteliği kaldırırız (dışarıdan gelen tema korunur).
  let skyOwned = false;
  const metaColors = [...document.querySelectorAll('meta[name="theme-color"]')].map(m => [m, m.content]);
  function applySky() {
    const el = document.documentElement, t = { day: 'light', night: 'dark' }[S.settings.sky];
    if (t) { el.setAttribute('data-theme', t); skyOwned = true; } else if (skyOwned) { el.removeAttribute('data-theme'); skyOwned = false; }
    for (const [m, c] of metaColors) m.content = t ? (t === 'dark' ? '#1e2140' : '#eef0f8') : c;
  }
  function syncSkyBtn() {
    const night = scene.mode === 'dark';
    const btn = $('#btnSky');
    btn.title = night ? 'Gündüze geç' : 'Geceye geç';
    btn.setAttribute('aria-label', btn.title);
    btn.querySelector('.ico-sun').hidden = night;
    btn.querySelector('.ico-moon').hidden = !night;
  }

  function syncSoundBtn() {
    const on = S.settings.sfx || S.settings.music;
    const btn = $('#btnSound');
    btn.setAttribute('aria-pressed', String(on));
    btn.title = on ? 'Sesi kapat' : 'Sesi aç';
    btn.querySelector('.ico-on').hidden = !on;
    btn.querySelector('.ico-off').hidden = on;
  }

  const coin = '<i class="coin" aria-hidden="true"></i>';
  function costBtn(act, id, cost, label) {
    return `<button class="buy" data-act="${act}" data-id="${id}" data-cost="${cost}"><span>${label}</span><b>${coin}${fmtNum(cost)}</b></button>`;
  }

  function renderGarage() {
    const pane = $('#pane-garage');
    const firstLocked = VEHICLES.findIndex(v => !S.owned[v.id]);
    const base = Econ.base(S), bulk = S.settings.bulk, lead = Econ.lead(S);
    let html = `<div class="garage-top">
      <p class="tag">Hızını garajdaki en güçlü araç belirler: <b>${VEH[lead].name}</b>.${base.convoy > 0
        ? ` Diğer araçlar <b>+${fmtSpeed(base.convoy)}</b> katıyor.`
        : ` Diğer araçlar hızlarının %${Math.round(CONVOY * 100)} kadarını katar.`} Hangi araca bindiğin yalnızca görünümü değiştirir.</p>
      <div class="seg" role="group" aria-label="Yükseltme miktarı">${BULKS.map(n =>
        `<button class="seg-btn" data-act="bulk" data-id="${n}" aria-pressed="${bulk === n}">${n === 'max' ? 'Maks' : '×' + n}</button>`).join('')}</div>
    </div>`;
    // Sıradaki araç hedef olarak görünür; ondan sonrakiler resim ya da isim vermeden tek bir kapalı kapının ardında bekler
    let hidden = 0;
    for (const v of VEHICLES) {
      const owned = !!S.owned[v.id];
      if (!owned && firstLocked !== -1 && v.index > firstLocked) { hidden++; continue; }
      const st = Econ.own(S, v.id);
      const active = S.active === v.id;
      const lvl = S.levels[v.id] || 0;
      html += `<article class="card veh${active ? ' active' : ''}${owned ? '' : ' locked'}">
        <canvas class="icon" data-icon="${v.id}" width="72" height="56"></canvas>
        <div class="body">
          <div class="row"><h3>${v.name}${owned && v.id === lead ? ' <span class="lvl" title="Hızını bu araç belirliyor">En güçlü</span>' : ''}</h3>${active ? '<span class="chip on">Yolda</span>' : owned ? `<button class="chip ride" data-act="ride" data-id="${v.id}">Bin</button>` : ''}</div>
          <p class="tag">${esc(v.tagline)}</p>
          <p class="stats"><span>Otomatik <b>${fmtSpeed(st.idle)}</b></span><span>Tık başına <b>${fmtGain(st.click)}</b></span></p>
          ${owned
            ? `<div class="up"><div><span class="upname">${v.upName}</span> <span class="lvl">Sv. ${lvl}</span><small>${nextDoubling(lvl)}</small></div>${upgradeBtn(v)}</div>`
            : `<div class="up">${costBtn('buyVeh', v.id, v.cost, 'Satın al')}</div><div class="progress"><i data-prog="${v.cost}"></i></div>`}
        </div></article>`;
    }
    if (hidden) html += `<article class="card veh mystery"><canvas class="icon" data-icon="mystery" width="72" height="56"></canvas>
      <div class="body"><h3>???</h3><p class="tag">Garaj kapısının ardında ${hidden} araç daha var. Ne olduklarını sıradaki aracı alınca göreceksin.</p></div></article>`;
    pane.innerHTML = html;
    pane.querySelectorAll('canvas[data-icon]').forEach(c => IT.drawIcon(c, c.dataset.icon, c.dataset.locked === '1'));
  }
  function upgradeBtn(v) {
    const q = Econ.upgradeQuote(v, S.levels[v.id] || 0, S.settings.bulk, S.credits);
    return costBtn('upgrade', v.id, q.cost, q.n > 1 ? `Yükselt ×${q.n}` : 'Yükselt');
  }
  function nextDoubling(lvl) {
    const t = DOUBLINGS.find(x => x > lvl);
    return t ? `Her seviye +%25 hız · Sv. ${t} olunca hız ×2` : 'Her seviye +%25 hız';
  }

  function renderBuffs() {
    const pane = $('#pane-buffs');
    pane.innerHTML = BUFFS.map(b => {
      const lvl = S.buffs[b.id], maxed = b.max && lvl >= b.max;
      return `<article class="card buff">
        <div class="body">
          <div class="row"><h3>${b.name}</h3><span class="lvl">Sv. ${lvl}${b.max ? ' / ' + b.max : ''}</span></div>
          <p class="tag">${lvl ? b.desc(lvl) : 'Henüz alınmadı.'}</p>
          <div class="up"><small>Sonraki seviye: ${b.next}</small>${maxed ? '<span class="chip on">Tamamlandı</span>' : costBtn('buff', b.id, Econ.buffCost(b, lvl), 'Al')}</div>
        </div></article>`;
    }).join('') + homeCard();
  }
  function homeCard() {
    const gain = Econ.memoryGain(S.distance), pct = Math.round(HOME.bonus * 100);
    const now = S.memories ? `Hatıraların: <b>${fmtNum(S.memories)}</b> · kalıcı hız +%${fmtNum(pct * S.memories)}.` : 'Henüz hatıran yok.';
    return `<article class="card home">
      <div class="body">
        <div class="row"><h3>Eve Dönüş</h3><span class="lvl">${S.trips ? S.trips + '. yolculuk tamam' : 'İlk yolculuk'}</span></div>
        <p class="tag">Yolculuğunu tamamla ve eve dön. Kredi, araçlar, yükseltmeler, güçlendirmeler ve bölgeler sıfırlanır; rozetler ve istatistikler kalır.
          Her hatıra sonraki yolculuklarda kalıcı olarak +%${pct} hız verir. ${now}</p>
        ${gain || S.homeReady
          ? `<p class="tag">Şimdi dönersen: <b class="mem" id="homeGain"></b> · sıradaki hatıra <span id="homeNext"></span></p>`
          : `<p class="tag">Eve dönüş yolu <b>${fmtDist(HOME.min)}</b> yolculuktan sonra açılır.</p><div class="progress"><i id="homeProg"></i></div>`}
        <div class="up"><small>Uzun yolculuk, çok hatıra: mesafe 8 katına çıkınca hatıralar 2 katına çıkar.</small><button class="buy home-btn" data-act="home" ${gain ? '' : 'disabled'}>Eve dön</button></div>
      </div></article>`;
  }

  function renderJournal() {
    const pane = $('#pane-journal');
    const stamps = [];
    for (let i = 0; i <= S.regionIdx; i++) {
      const r = IT.regionAt(i);
      stamps.push(`<li class="stamp s-${r.biome}" style="--r:${((i * 37) % 11) - 5}deg"><span>${esc(r.name)}</span><small>${i === 0 ? 'Başlangıç' : fmtDist(r.at)}</small></li>`);
    }
    const nr = IT.regionAt(S.regionIdx + 1);
    stamps.push(`<li class="stamp next"><span>?</span><small>${fmtDist(nr.at)}</small></li>`);
    const msDone = MILESTONES.slice(0, S.msIdx).slice(-6).reverse();
    const nBadges = Object.keys(S.badges).length;
    const badges = BADGES.map(b => {
      const on = !!S.badges[b.id];
      return `<li class="badge${on ? ' on' : ''}" title="${esc(b.desc)}"><span class="medal" aria-hidden="true">${on ? '★' : '?'}</span><b>${on ? esc(b.name) : '???'}</b><small>${esc(b.desc)}</small></li>`;
    }).join('');
    pane.innerHTML = `
      <h3 class="sec">Yolculuk</h3>
      <dl class="statgrid">
        <div><dt>${S.trips ? 'Bu yolculuk' : 'Toplam yol'}</dt><dd id="jDist"></dd></div>
        <div><dt>Toplam kredi</dt><dd id="jCred"></dd></div>
        <div><dt>Atılan adım</dt><dd id="jClicks"></dd></div>
        <div><dt>Yolda geçen süre</dt><dd id="jTime"></dd></div>
        <div><dt>Rekor hız</dt><dd id="jBest"></dd></div>
        <div><dt>Yakalanan kelebek</dt><dd id="jGifts"></dd></div>
        <div><dt>Şanslı adım</dt><dd id="jCrits"></dd></div>
        <div><dt>Görülen gökkuşağı</dt><dd id="jRainbows"></dd></div>
        ${S.trips ? `<div><dt>Tüm yolculuklar</dt><dd id="jLife"></dd></div>
        <div><dt>Hatıralar</dt><dd>${fmtNum(S.memories)} · hız +%${fmtNum(Math.round(HOME.bonus * S.memories * 100))}</dd></div>` : ''}
      </dl>
      <h3 class="sec">Pasaport damgaları <small>${S.regionIdx + 1} bölge · her biri kalıcı +%6 hız</small></h3>
      <ul class="stamps">${stamps.join('')}</ul>
      <h3 class="sec">Rozetler <small>${nBadges} / ${BADGES.length} · kredi +%${Math.round(nBadges * BADGE_BONUS * 100)}</small></h3>
      <ul class="badges">${badges}</ul>
      <h3 class="sec">Geçilen duraklar</h3>
      <ul class="mslist">${msDone.length ? msDone.map(m => `<li><span>${esc(m.name)}</span><b>${fmtDist(m.at)}</b></li>`).join('') : '<li class="muted">Henüz bir durak geçilmedi. İlk yüz metre çok yakın.</li>'}</ul>
      <h3 class="sec">Çevrimdışı yolculuk</h3>
      <p class="tag">Oyun kapalıyken otomatik hızın <b>%${Math.round(Econ.offlineRate(S.buffs.dream) * 100)}</b> kadarıyla ilerlersin. Sınır: <b>${Econ.offlineCapHours(S.buffs.camp)} saat</b>.</p>
      <h3 class="sec">Ayarlar</h3>
      <div class="settings">
        <button class="toggle" data-act="sfx" aria-pressed="${S.settings.sfx}">Ses efektleri <b>${S.settings.sfx ? 'Açık' : 'Kapalı'}</b></button>
        <button class="toggle" data-act="music" aria-pressed="${S.settings.music}">Ortam sesi <b>${S.settings.music ? 'Açık' : 'Kapalı'}</b></button>
        <div class="toggle sky"><span>Gökyüzü</span><div class="seg" role="group" aria-label="Gökyüzü">${SKIES.map(k =>
          `<button class="seg-btn" data-act="sky" data-id="${k}" aria-pressed="${S.settings.sky === k}">${SKY_NAME[k]}</button>`).join('')}</div></div>
        <button class="danger" data-act="reset">Yolculuğu sıfırla</button>
      </div>
      <p class="tag muted small">İlerleme bu tarayıcıda otomatik kaydedilir.</p>`;
  }

  function refreshUI() {
    if (uiDirty.garage) { renderGarage(); uiDirty.garage = false; }
    if (uiDirty.buffs) { renderBuffs(); uiDirty.buffs = false; }
    if (uiDirty.journal) { renderJournal(); uiDirty.journal = false; }
    const cur = current();
    const region = IT.regionAt(S.regionIdx);
    setText('#hudRegion', region.name);
    setText('#hudDist', fmtDist(S.distance));
    setText('#hudSpeed', fmtSpeed(Math.max(rateEma, cur.idle)));
    setText('#hudVehicle', VEH[S.active].name);
    setText('#credits', fmtNum(S.credits));
    setText('#income', `+${IT.fmtSmall(Math.max(creditEma, cur.idle * cur.cpm))} / sn`);
    const cm = comboMult();
    setText('#rhythmVal', '×' + nf2.format(cm));
    $('#rhythmFill').style.transform = `scaleX(${Math.min(combo, 20) / 20})`;
    // sıradaki durak
    const m = MILESTONES[S.msIdx];
    if (m) {
      const prev = S.msIdx ? MILESTONES[S.msIdx - 1].at : 0;
      setText('#msName', m.name);
      setText('#msProg', `${fmtDist(S.distance)} / ${fmtDist(m.at)}`);
      $('#msFill').style.transform = `scaleX(${Math.max(0, Math.min(1, (S.distance - prev) / (m.at - prev)))})`;
    } else {
      setText('#msName', 'Bilinmeyen yıldızlar'); setText('#msProg', fmtDist(S.distance));
      $('#msFill').style.transform = 'scaleX(1)';
    }
    // etkiler
    const now = Date.now();
    const fx = S.effects.filter(e => e.until > now).map(e => `<span class="fx fx-${e.id}"><b>${GIFT[e.id].name}</b> ${GIFT[e.id].text} · ${Math.ceil((e.until - now) / 1000)} sn</span>`).join('');
    const fxBox = $('#effects');
    if (fxBox.dataset.html !== fx) { fxBox.innerHTML = fx; fxBox.dataset.html = fx; }
    // butonlar ('Maks' modunda miktar bütçeyle değişir)
    if (S.settings.bulk === 'max') document.querySelectorAll('#pane-garage [data-act="upgrade"]').forEach(b => {
      const v = VEH[b.dataset.id], q = Econ.upgradeQuote(v, S.levels[v.id] || 0, 'max', S.credits);
      if (+b.dataset.cost === q.cost) return;
      b.dataset.cost = q.cost;
      b.innerHTML = `<span>${q.n > 1 ? `Yükselt ×${q.n}` : 'Yükselt'}</span><b>${coin}${fmtNum(q.cost)}</b>`;
    });
    document.querySelectorAll('[data-cost]').forEach(b => {
      const ok = S.credits + 1e-9 >= +b.dataset.cost;
      if (b.disabled === ok) b.disabled = !ok;
    });
    document.querySelectorAll('[data-prog]').forEach(i => { i.style.transform = `scaleX(${Math.min(1, S.credits / +i.dataset.prog)})`; });
    // sekme rozeti: alınabilir bir şey var mı
    const canGarage = !!document.querySelector('#pane-garage [data-cost]:not(:disabled)');
    const canBuffs = !!document.querySelector('#pane-buffs [data-cost]:not(:disabled)');
    $('.tab[data-id="garage"]').classList.toggle('dot', canGarage);
    $('.tab[data-id="buffs"]').classList.toggle('dot', canBuffs);
    if (!$('#pane-buffs').hidden) {
      const gain = Econ.memoryGain(S.distance);
      setText('#homeGain', `+${fmtNum(gain)} hatıra`);
      setText('#homeNext', fmtDist(Econ.memoryNext(S.distance)));
      const hp = $('#homeProg'); if (hp) hp.style.transform = `scaleX(${Math.min(1, S.distance / HOME.min)})`;
      const hb = $('.home-btn'); if (hb && hb.disabled !== !gain) hb.disabled = !gain;
    }
    if (!$('#pane-journal').hidden) {
      setText('#jDist', fmtDist(S.distance)); setText('#jCred', fmtNum(S.totalCredits));
      setText('#jClicks', fmtNum(S.clicks)); setText('#jTime', fmtDuration(S.playTime));
      setText('#jBest', fmtSpeed(S.best)); setText('#jGifts', fmtNum(S.gifts));
      setText('#jCrits', fmtNum(S.crits)); setText('#jRainbows', fmtNum(S.rainbows));
      if (S.trips) setText('#jLife', `${fmtDist(S.lifeDist + S.distance)} · ${S.trips + 1}. yolculuk`);
    }
  }
  function setText(sel, t) { const el = $(sel); if (el && el.textContent !== t) el.textContent = t; }

  /* ---------- Başlatma ---------- */
  function start(hotSave) {
    S = (hotSave && sanitize(hotSave)) || load() || defaultState();
    scene = new IT.Scene($('#scene'));
    applySky();
    // Sahne tarayıcı temasını izler: açık tema gündüz, koyu tema gece
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const themeMode = () => {
      const t = document.documentElement.getAttribute('data-theme');
      if (t === 'dark' || t === 'light') return t;
      return mq && mq.matches ? 'dark' : 'light';
    };
    scene.setMode(themeMode(), true);
    const onTheme = () => {
      const m = themeMode();
      if (m === scene.mode) return;
      scene.setMode(m);
      syncSkyBtn();
      toast(m === 'dark' ? 'Akşam iniyor. Fenerler yanıyor, yıldızlar çıkıyor.' : 'Gün doğuyor. Yol yeniden aydınlanıyor.', 'teal');
    };
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', onTheme); else if (mq.addListener) mq.addListener(onTheme); }
    if (window.MutationObserver) new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    scene.setBiome(IT.regionAt(S.regionIdx).biome, true);
    scene.setVehicle(S.active, true);
    scene.signText = () => {
      const n = IT.regionAt(S.regionIdx + 1);
      return { title: n.name, sub: fmtDist(Math.max(0, n.at - S.distance)) };
    };
    scene.fill(true);
    Sound.sfxOn = S.settings.sfx; Sound.musicOn = S.settings.music;
    syncSoundBtn(); syncSkyBtn();
    if (S.clicks >= 6) $('#hint').classList.add('gone');

    const stage = $('#stage');
    stage.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button > 0) return;
      if (e.target.closest('button, a, .hud-tools')) return;
      const r = scene.canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (scene.hitGift(x, y)) { catchGift(); return; }
      const before = S.distance;
      step();
      clickBuffer += S.distance - before;
    });
    document.addEventListener('keydown', e => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        const t = e.target;
        if (t && t.closest && t.closest('button, input, a, [role="tab"]')) return;
        if (!$('#modal').hidden) return;
        e.preventDefault();
        const before = S.distance;
        step();
        clickBuffer += S.distance - before;
      }
    });
    $('#panel').addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el || el.disabled) return;
      Sound.unlock();
      actions[el.dataset.act](el.dataset.id, el);
      // Fareyle/dokunarak basıldıysa odağı bırak: yoksa Boşluk tuşu adım yerine aynı düğmeye tekrar basar
      if (e.detail > 0 && document.activeElement && document.activeElement.blur) document.activeElement.blur();
      refreshUI();
    });
    $('#btnSound').addEventListener('click', e => {
      Sound.unlock();
      if (e.detail > 0) e.currentTarget.blur();
      const on = !(S.settings.sfx || S.settings.music);
      S.settings.sfx = on; S.settings.music = on;
      Sound.setSfx(on); Sound.setMusic(on);
      uiDirty.journal = true; syncSoundBtn();
    });
    $('#btnSky').addEventListener('click', e => {
      if (e.detail > 0) e.currentTarget.blur();
      S.settings.sky = scene.mode === 'dark' ? 'day' : 'night';
      applySky(); uiDirty.journal = true;
    });
    window.addEventListener('resize', () => { scene.resize(); });
    if (window.ResizeObserver) new ResizeObserver(() => scene.resize()).observe(stage);
    document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else lastFrame = performance.now(); });
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);

    let tab = 'garage';
    try { tab = localStorage.getItem('idle-traveler-tab') || 'garage'; } catch (e) { /* yok say */ }
    actions.tab(['garage', 'buffs', 'journal'].includes(tab) ? tab : 'garage');

    // İlk açılış ya da çevrimdışı dönüş
    if (!S.intro) showIntro();
    else resume((Date.now() - S.lastSeen) / 1000);
    S.lastSeen = Date.now();

    const hot = window.claude && window.claude.hot;
    if (hot && hot.snapshot) { try { hot.snapshot(() => { save(); return { save: S }; }); } catch (e) { /* yok say */ } }

    refreshUI();
    lastFrame = performance.now();
    requestAnimationFrame(frame);
  }

  function boot() {
    const hot = window.claude && window.claude.hot;
    const run = data => start(data && data.save);
    if (hot && hot.ready) hot.ready(run); else run(hot && hot.data || {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
