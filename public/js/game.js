/* Idle Traveler — oyun durumu, döngü, kayıt, çevrimdışı ilerleme ve arayüz. */
(function () {
  'use strict';
  const IT = window.IT;
  const { VEHICLES, VEH, BUFFS, BUFF, MILESTONES, BADGES, TIERS, BADGE_TIERS, OUTFITS, OUTFIT, CONVOY, HOME, Econ, Sound, fmtNum, fmtDist, fmtGain, fmtSpeed, fmtDuration, fmtPct, fmtHours, t } = IT;

  const SAVE_KEY = 'idle-traveler-save-v1';
  const GIFTS = [
    { id: 'gust',     dur: 30, speed: 3, w: 3 },
    { id: 'harvest',  dur: 45, credit: 2, w: 3 },
    { id: 'zeal',     dur: 25, click: 5, w: 2 },
    { id: 'postcard', instant: true, w: 2 },
    { id: 'rainbow',  dur: 20, speed: 10, w: 0 },  // hava olayıyla gelir: kısa ama güçlü
    { id: 'wish',     dur: 20, credit: 10, w: 0 }, // gece kayan yıldızla gelir: kısa ama güçlü
  ];
  GIFTS.forEach(g => Object.defineProperties(g, {
    name: { get: () => t(`gift.${g.id}.name`) },
    text: { get: () => t(`gift.${g.id}.text`) },
  }));
  const GIFT = Object.fromEntries(GIFTS.map(g => [g.id, g]));
  // Kelebek etkisi 5 dakikadan uzun sürerken aynı kelebek yeniden gelirse süre değil çarpan artar (en çok 10 kat)
  const STACK_AFTER = 300, STACK_MAX = 10;
  // Kat sayısına göre etkinin çarpanları: her kat temel artışı bir kez daha ekler (×3 → ×5 → ×7)
  const effMult = (g, stack) => {
    const n = stack || 1, f = x => (x ? 1 + (x - 1) * n : 1);
    return { speed: f(g.speed), credit: f(g.credit), click: f(g.click) };
  };
  const effText = (g, stack) => {
    const m = effMult(g, stack), nfx = new Intl.NumberFormat(IT.locale(), { maximumFractionDigits: 1 });
    return ['speed', 'credit', 'click'].filter(k => g[k]).map(k => t('fx.' + k, { m: nfx.format(m[k]) })).join(', ');
  };
  const BULKS = [1, 10, 'max'];
  // Gökyüzü: tarayıcı temasını izle ya da gündüz/gece sabitle
  // cycle: gün döngüsü, sahne sayfa temasından bağımsız olarak bölgenin mevsimine göre gündüz/gece yaşar
  const SKIES = ['auto', 'day', 'night', 'cycle'];
  const UNITS = ['auto', 'metric', 'imperial'];
  const DOUBLINGS = [10, 25, 50, 100, 150, 200];
  // Yağmur yağabilen biyomlar (kar, çöl ve kanyonda yağmur yağmaz)
  const RAINY = { meadow: 1, lavender: 1, pine: 1, wheat: 1, coast: 1, sakura: 1, autumn: 1, tea: 1, tulip: 1, olive: 1 };
  // Eve dönüşte korunan alanlar: istatistikler, rozetler, hatıralar ve ayarlar
  const KEEP = ['created', 'clicks', 'playTime', 'best', 'gifts', 'crits', 'rainbows', 'nightTime', 'totalCredits', 'photos', 'wishes', 'day', 'seenVer',
    'bestCombo', 'bestRegion', 'bestGarage', 'bestLevel', 'legacyDist', 'palPick',
    'badges', 'settings', 'intro', 'memories', 'trips', 'lifeDist'];

  const $ = sel => document.querySelector(sel);
  const fmt2 = n => new Intl.NumberFormat(IT.locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Durum ---------- */
  function defaultState() {
    return {
      v: 3, created: Date.now(), lastSeen: Date.now(),
      distance: 0, credits: 0, totalCredits: 0, clicks: 0, playTime: 0, best: 0, gifts: 0,
      crits: 0, rainbows: 0, nightTime: 0, photos: 0, wishes: 0,
      day: { last: '', streak: 0, best: 0 }, seenVer: '',
      // Ömür boyu rekorlar: rozetler eve dönüşte kaybolmasın diye
      bestCombo: 0, bestRegion: 0, bestGarage: 1, bestLevel: 0, legacyDist: 0,
      palPick: 'dog', // seçili yol arkadaşı: dog (Karabaş), bird (Kanat), cat (Tekir)
      route: 'anatolia', // bu yolculuğun rotası; her eve dönüş yeni bir rota açar
      memories: 0, trips: 0, lifeDist: 0, homeReady: false,
      active: 'walk', owned: { walk: true }, levels: { walk: 0 },
      buffs: Object.fromEntries(BUFFS.map(b => [b.id, 0])),
      regionIdx: 0, msIdx: 0, effects: [], badges: {},
      settings: { sfx: true, music: true, bulk: 1, sky: 'auto', lang: 'auto', units: 'auto', outfit: 'classic', page: 'auto' }, intro: false,
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
  // Açık rota sayısı: ilk yolculukta bir, her eve dönüşte bir tane daha
  const routesOpenFor = trips => Math.min(IT.ROUTES.length, (trips || 0) + 1);
  const perk = () => IT.getRoute().perk;
  const count = (x, max) => { x = Math.floor(+x); return isFinite(x) && x > 0 ? Math.min(x, max === undefined ? Infinity : max) : 0; };
  // Bozuk ya da eski sürümden kalan kayıtları güvenli değerlere çeker
  function sanitize(d) {
    if (!isObj(d)) return null;
    const s = defaultState();
    for (const key of Object.keys(s)) if (d[key] !== undefined) s[key] = d[key];
    // v1 → v2 (oyun v1.11): mesafeler 1/10'a indi. Kredi, araç ve bölge ilerlemesi aynı kalır.
    const v1 = !(+d.v >= 2), v2 = !(+d.v >= 3);
    if (v1) for (const k of ['distance', 'lifeDist', 'best']) if (typeof s[k] === 'number') s[k] /= 10;
    s.v = 3;
    for (const k of ['distance', 'credits', 'totalCredits', 'playTime', 'best', 'nightTime', 'lifeDist']) if (typeof s[k] !== 'number' || !isFinite(s[k]) || s[k] < 0) s[k] = 0;
    for (const k of ['clicks', 'gifts', 'crits', 'rainbows', 'regionIdx', 'photos', 'wishes']) s[k] = count(s[k]);
    s.memories = count(s.memories, 1e6); s.trips = count(s.trips, 1e5);
    // Bölge ve durak sayısı kat edilen yoldan fazla olamaz (bozuk kayıt hız bonusunu şişirmesin)
    s.regionIdx = Math.min(s.regionIdx, IT.regionIndexFor(s.distance));
    // Eski kayıtta durak listesi farklıydı (yeni duraklar eklendi): geçilmiş duraklar ödülsüz işaretlenir
    const passed = MILESTONES.filter(m => m.at <= s.distance).length;
    s.msIdx = v1 ? passed : Math.min(count(s.msIdx, MILESTONES.length), passed);
    const buffs = isObj(d.buffs) ? d.buffs : {};
    // Sınırsız güçlendirmelerde de makul bir tavan: bozuk kayıt sonsuz fiyat ve hız üretmesin
    s.buffs = Object.fromEntries(BUFFS.map(b => [b.id, count(buffs[b.id], b.max || 300)]));
    const owned = isObj(d.owned) ? d.owned : {}, levels = isObj(d.levels) ? d.levels : {};
    s.owned = { walk: true }; s.levels = {};
    for (const v of VEHICLES) {
      if (owned[v.id]) s.owned[v.id] = true;
      if (s.owned[v.id]) s.levels[v.id] = count(levels[v.id], 1000);
    }
    if (!VEH[s.active] || !s.owned[s.active]) s.active = 'walk';
    for (const k of ['bestCombo', 'bestRegion', 'bestGarage', 'bestLevel']) s[k] = count(s[k], 1e6);
    if (!Econ.pals.some(x => x.id === s.palPick)) s.palPick = 'dog';
    // rota açık değilse (bozuk kayıt) ilk rotaya dönülür
    const ri = IT.ROUTES.findIndex(r => r.id === s.route);
    if (ri < 0 || ri >= routesOpenFor(s.trips)) s.route = 'anatolia';
    if (typeof s.legacyDist !== 'number' || !isFinite(s.legacyDist) || s.legacyDist < 0) s.legacyDist = 0;
    // Rozetler v3'te kademeli: { aile: kazanılan kademe sayısı }. Kademeler bir kez kazanılınca düşmez.
    s.badges = {};
    const old = isObj(d.badges) ? d.badges : {};
    if (v2) {
      // Eski tek seferlik rozetler: eve dönüşte sıfırlanan değerlerin rekorlarına çevrilir, kademeler sonra hesaplanır
      const LEGACY = { reg5: ['bestRegion', 4], reg13: ['bestRegion', 14], reg25: ['bestRegion', 24], garage3: ['bestGarage', 3], garage6: ['bestGarage', 6],
        garage9: ['bestGarage', 14], tuned25: ['bestLevel', 25], tuned100: ['bestLevel', 100], rhythm: ['bestCombo', 20],
        marathon: ['legacyDist', 42195], world: ['legacyDist', 4.0075e7], moon: ['legacyDist', 3.844e8], sun: ['legacyDist', 1.496e11] };
      for (const [id, [k, v]] of Object.entries(LEGACY)) if (old[id]) s[k] = Math.max(s[k], v);
    } else for (const b of BADGES) s.badges[b.id] = count(old[b.id], TIERS.length);
    // Etki süresi, kelebek güçlendirmesiyle ulaşılabilecek en uzun süreyi aşamaz
    const maxFx = Date.now() + 3600e3;
    s.effects = Array.isArray(s.effects) ? s.effects.filter(e => isObj(e) && GIFT[e.id] && isFinite(e.until)).map(e => ({ id: e.id, until: Math.min(e.until, maxFx), stack: Math.max(1, count(e.stack, STACK_MAX)) })) : [];
    s.settings = Object.assign(defaultState().settings, isObj(d.settings) ? d.settings : {});
    if (!BULKS.includes(s.settings.bulk)) s.settings.bulk = 1;
    s.settings.sfx = s.settings.sfx !== false; s.settings.music = s.settings.music !== false;
    if (!SKIES.includes(s.settings.sky)) s.settings.sky = 'auto';
    if (s.settings.lang !== 'auto' && !IT.LANGS[s.settings.lang]) s.settings.lang = 'auto';
    if (!UNITS.includes(s.settings.units)) s.settings.units = 'auto';
    if (!OUTFIT[s.settings.outfit]) s.settings.outfit = 'classic';
    if (!['auto', 'light', 'dark'].includes(s.settings.page)) s.settings.page = 'auto';
    if (typeof s.lastSeen !== 'number' || !isFinite(s.lastSeen) || s.lastSeen > Date.now()) s.lastSeen = Date.now();
    s.intro = !!s.intro; s.homeReady = !!s.homeReady;
    const day = isObj(d.day) ? d.day : {};
    s.day = { last: /^\d{4}-\d{2}-\d{2}$/.test(day.last) ? day.last : '', streak: count(day.streak, 1e5), best: count(day.best, 1e5) };
    s.day.best = Math.max(s.day.best, s.day.streak);
    if (typeof s.seenVer !== 'string' || !/^\d+(\.\d+)*$/.test(s.seenVer)) s.seenVer = '';
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
      const em = effMult(GIFT[e.id], e.stack);
      m.speed *= em.speed; m.credit *= em.credit; m.click *= em.click;
    }
    return m;
  }
  function current() {
    const b = Econ.base(S), t = tempMult();
    return { idle: b.idle * t.speed, click: b.click * t.speed * t.click, cpm: b.cpm * t.credit, base: b, temp: t };
  }

  /* ---------- Çalışma zamanı değişkenleri ---------- */
  let combo = 0, lastClick = 0, stepFloat = null, cycNight = null;
  let rateEma = 0, creditEma = 0;
  let giftIn = 25;
  // Kayan yıldız: yalnızca gece gökyüzünde
  let starIn = 20 + Math.random() * 25;
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
      S.bestRegion = Math.max(S.bestRegion, S.regionIdx);
      const r = IT.regionAt(S.regionIdx);
      const bonus = Math.max(20, incomeRate() * 20);
      grant(bonus);
      found.push({ r, bonus });
    }
    if (found.length) {
      const last = found[found.length - 1];
      scene.setBiome(last.r.biome);
      if (!silent) {
        showBanner(last.r.name, t('toast.region', { c: fmtNum(last.bonus), p: fmtPct(6) }));
        Sound.region();
      }
      uiDirty.garage = uiDirty.journal = uiDirty.buffs = true; // Eve Dönüş kartındaki rota seçimi köyden çıkınca kapanır
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
    if (!silent) for (const { m, bonus } of ms) { toast(t('toast.milestone', { name: esc(m.name), c: fmtNum(bonus) }), 'gold'); Sound.milestone(); }
    if (!S.homeReady && Econ.memoryGain(S.distance) > 0) {
      S.homeReady = true; uiDirty.buffs = true;
      if (!silent) toast(t('toast.homeReady'), 'gold');
    }
    return { regions: found, milestones: ms };
  }

  const nBadges = () => IT.badgeCount(S);
  const outfitOpen = o => nBadges() >= o.need;
  // Seçili kıyafet kilitliyse (ör. sıfırlamadan sonra) klasik giyilir
  function applyRoute() {
    IT.setRoute(S.route);
    if (scene) { scene.setBiome(IT.regionAt(S.regionIdx).biome, true); scene.relabel(); }
    uiDirty = { garage: true, buffs: true, journal: true };
  }
  function routePicker() {
    const open = routesOpenFor(S.trips);
    return `<div class="routes" role="group">${IT.ROUTES.map((r, i) => {
      const on = S.route === r.id, ok = i < open;
      return `<button class="route-btn${on ? ' on' : ''}" data-act="route" data-id="${r.id}" aria-pressed="${on}" ${ok && S.regionIdx === 0 ? '' : 'disabled'}>
        <b>${ok ? esc(r.name) : '???'}</b><small>${ok ? esc(r.perkText) : t('homecard.routeLocked')}</small></button>`;
    }).join('')}</div>`;
  }
  function applyOutfit() { const o = OUTFIT[S.settings.outfit]; IT.setOutfit(o && outfitOpen(o) ? o.id : 'classic'); }
  // Rekorları güncelle, hak edilen yeni kademeleri ver. Birden çok kademe birden geçilirse en yükseği duyurulur.
  function checkBadges(silent) {
    const got = [], before = nBadges();
    S.bestCombo = Math.max(S.bestCombo, Math.floor(combo));
    for (const b of BADGES) {
      const have = S.badges[b.id] || 0, k = b.tierFor(S);
      if (k <= have) continue;
      let bonus = 0; for (let i = have; i < k; i++) bonus += TIERS[i].bonus;
      S.badges[b.id] = k;
      const tier = TIERS[k - 1];
      got.push({ b, k, bonus, get name() { return `${b.name} (${tier.name})`; } });
    }
    if (got.length) {
      uiDirty.journal = true;
      if (!silent) for (const g of got) {
        const tier = TIERS[g.k - 1];
        toast(t('toast.badge', { name: esc(g.b.name), tier: tier.name, tierLow: tier.name.toLocaleLowerCase(IT.locale()), p: fmtPct(g.bonus * 100) }), 'gold');
        Sound.milestone();
      }
      const opened = OUTFITS.filter(o => o.need > before && o.need <= nBadges());
      if (!silent) for (const o of opened) toast(t('toast.outfit', { name: esc(o.name) }), 'teal');
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
    // Hızlı art arda adımlar üst üste binmesin: hâlâ taze olan yazıya eklenir, toplam büyür
    const sf = stepFloat;
    if (!crit && sf && sf.life < 0.5 && scene.floats.includes(sf)) {
      sf.sum += d; sf.text = `+${fmtGain(sf.sum)}`; sf.life = 0.18; // tam görünür kalır
    } else if (crit) {
      scene.addFloat(t('float.lucky', { d: fmtGain(d) }), { color: '#ffd56b', big: true });
    } else {
      stepFloat = scene.addFloat(`+${fmtGain(d)}`); stepFloat.sum = d;
    }
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
      const bonus = Math.max(40, incomeRate() * 60) * (perk() === 'gold' ? 2 : 1);
      grant(bonus);
      toast(t('toast.giftInstant', { name: g.name, c: fmtNum(bonus) }), 'gold');
      scene.addFloat(t('ui.credits', { c: fmtNum(bonus) }), { color: '#ffd56b', big: true });
    } else {
      const r = addEffect(g, g.dur * (1 + 0.15 * S.buffs.butterfly) * (perk() === 'gold' ? 1.5 : 1), true);
      if (r.stacked) toast(t('toast.giftStack', { name: g.name, text: effText(g, r.stack) }), 'gold');
      else toast(t('toast.giftEffect', { name: g.name, dur: fmtDuration(r.dur), text: effText(g, r.stack) }), 'gold');
      scene.addFloat(t('float.gift', { name: g.name }), { color: '#ffd56b', big: true });
    }
    checkBadges();
  }
  // Gece kayan yıldızı yakalamak bir dilek tutmaktır: Yıldız Tozu etkisi
  function catchStar() {
    Sound.unlock();
    S.wishes++;
    const g = GIFT.wish, dur = addEffect(g, g.dur).dur;
    Sound.wish();
    toast(t('toast.wish', { name: g.name, dur: fmtDuration(dur), text: effText(g, 1) }), 'gold');
    scene.addFloat(t('float.wish'), { color: '#cfe0ff', big: true });
    checkBadges();
  }
  // stackable: kalan süre STACK_AFTER saniyeyi aşıyorsa süre yerine çarpan bir kat artar
  function addEffect(g, dur, stackable) {
    const now = Date.now(), ex = S.effects.find(e => e.id === g.id && e.until > now);
    if (ex && stackable && (ex.until - now) / 1000 > STACK_AFTER && (ex.stack || 1) < STACK_MAX) {
      ex.stack = (ex.stack || 1) + 1;
      return { dur, stacked: true, stack: ex.stack };
    }
    if (ex) ex.until += dur * 1000; else S.effects.push({ id: g.id, until: now + dur * 1000, dur, stack: 1 });
    return { dur, stacked: false, stack: ex ? ex.stack || 1 : 1 };
  }

  /* ---------- Günün hediyesi ---------- */
  // Yerel takvime göre gün anahtarı (YYYY-AA-GG)
  const dayKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  // Her yeni günün ilk ziyaretinde küçük bir hediye; üst üste gelinen günler hediyeyi 7 güne kadar büyütür.
  // Saat geri alınırsa (bugün < son gün) hediye verilmez.
  function checkDaily(silent) {
    const today = dayKey(Date.now());
    if (S.day.last && today <= S.day.last) return;
    const y = new Date(); y.setDate(y.getDate() - 1); // yaz saati geçişlerinde de doğru dün
    const yesterday = dayKey(y.getTime());
    S.day.streak = S.day.last === yesterday ? S.day.streak + 1 : 1;
    S.day.best = Math.max(S.day.best, S.day.streak);
    const first = !S.day.last;
    S.day.last = today;
    uiDirty.journal = true;
    if (first) return; // ilk gün tanıtımla başlar, hediye ertesi günden itibaren
    const days = Math.min(S.day.streak, 7);
    const gift = Math.max(100, incomeRate() * 120 * days);
    grant(gift);
    if (!silent) {
      toast(t(S.day.streak > 1 ? 'toast.daily' : 'toast.daily1', { c: fmtNum(gift), n: S.day.streak }), 'gold');
      Sound.gift();
    }
    checkBadges(silent);
  }

  /* ---------- Hava ---------- */
  function updateWeather(dt) {
    const biome = IT.regionAt(S.regionIdx).biome;
    const canRain = !!RAINY[biome]; // kamera uçarken de yerde kaldığı için yağmur her araçta yağabilir
    if (weather === 'clear') {
      weatherIn -= dt;
      if (weatherIn <= 0) {
        weatherIn = (360 + Math.random() * 360) * (perk() === 'rain' ? 0.5 : 1);
        if (canRain) {
          weather = 'rain'; weatherT = 30 + Math.random() * 15;
          scene.setWeather(1, 0);
          toast(t('toast.rain'), 'teal');
        }
      }
    } else {
      weatherT -= dt;
      if (weather === 'rain' && (weatherT <= 0 || !canRain)) {
        // Gökkuşağı yalnızca gündüz ve yerdeyken çıkar
        if (canRain && (scene.nightAmt || 0) < 0.5) {
          weather = 'rainbow'; weatherT = 40; // gökkuşağı gökte 40 sn kalır, etkisi 20 sn sürer
          scene.setWeather(0, 1);
          addEffect(GIFT.rainbow, GIFT.rainbow.dur);
          S.rainbows++;
          toast(t('toast.rainbow', { dur: fmtDuration(GIFT.rainbow.dur), text: effText(GIFT.rainbow, 1) }), 'gold');
          Sound.region();
          checkBadges();
        } else { weather = 'clear'; scene.setWeather(0, 0); }
      } else if (weather === 'rainbow' && weatherT <= 0) {
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
    if (gap > 60) showOffline(off); else if (off.d > 0) toast(t('toast.away', { d: fmtGain(off.d) }), 'teal');
  }

  // Yeni bir yolculuk: keep verilirse bu alanlar eski durumdan taşınır
  function newTrip(keep) {
    const fresh = defaultState();
    if (keep) for (const k of keep) fresh[k] = S[k];
    // Yol arkadaşı Karabaş eve dönüşte de yolcuyla kalır
    if (keep === KEEP) fresh.buffs.pal = S.buffs.pal || 0;
    S = fresh;
    scene.setBiome('meadow', true); scene.setVehicle('walk', true);
    combo = 0; rateEma = 0; creditEma = 0; giftIn = 25; scene.gift = null; scene.star = null;
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
      S.bestGarage = Math.max(S.bestGarage, VEHICLES.filter(x => S.owned[x.id]).length);
      uiDirty.garage = true;
      // Yeni araca hemen binilir (hız garajdaki en güçlü araca göre hesaplandığı için düşmez).
      // Sonradan eklenen ara bir araç, daha ileri bir araçtayken alınırsa yalnızca garaja katılır.
      const forward = v.index > VEH[S.active].index;
      if (forward) actions.ride(id);
      const lead = Econ.lead(S);
      const vars = { name: v.name, tagline: esc(v.tagline), lead: VEH[lead].name };
      toast(t(!forward ? 'toast.vehJoined' : lead === id ? 'toast.vehNew' : 'toast.vehNewLead', vars), 'teal');
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
      S.bestLevel = Math.max(S.bestLevel, S.levels[id]);
      const crossed = DOUBLINGS.filter(t => t > lvl && t <= lvl + q.n).length;
      const looked = Econ.lookTier(lvl + q.n) > Econ.lookTier(lvl);
      if (crossed) toast(t(looked ? 'toast.doubledLook' : crossed > 1 ? 'toast.doubledN' : 'toast.doubled', { up: v.upName, lvl: t('ui.lvl', { n: lvl + q.n }), name: v.name, n: crossed }), looked ? 'gold' : 'teal');
      // Araç yeni bir görünüm kazandı: sahnedeyse parıltıyla göster
      if (looked && S.active === id) { scene.burst(scene.travelerX, scene.riderY() - 30 * scene.k, 30, ['#ffd56b', '#fff1c2', '#ffffff', '#6fd3c1']); Sound.region(); }
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
      if (id === 'pal') {
        const n = S.buffs.pal, opened = Econ.pals.find(x => x.need === n && n > 1);
        if (n === 1) toast(t('toast.pal'), 'teal');
        else if (opened) toast(t('toast.palNew', { name: t(`pal.${opened.id}.name`) }), 'gold');
        else if (Econ.palLooks.includes(n)) toast(t('toast.palLook', { name: t(`pal.${S.palPick}.name`) }), 'gold');
        scene.burst(scene.travelerX - 34 * scene.k, scene.groundY() - 20 * scene.k, 18, ['#ffd56b', '#ffffff', '#ecdcb6']);
      }
      uiDirty.buffs = uiDirty.garage = uiDirty.journal = true;
    },
    // Rota yalnızca köyden çıkmadan (ilk bölgedeyken) değiştirilebilir
    route(id) {
      const i = IT.ROUTES.findIndex(r => r.id === id);
      if (i < 0 || i >= routesOpenFor(S.trips) || S.regionIdx > 0 || S.route === id) return;
      S.route = id; applyRoute(); save();
    },
    palPick(id) {
      const p = Econ.pals.find(x => x.id === id);
      if (!p || (S.buffs.pal || 0) < p.need || S.palPick === id) return;
      S.palPick = id; save(); uiDirty.buffs = true;
      scene.burst(scene.travelerX - 30 * scene.k, scene.riderY() - 30 * scene.k, 14, ['#ffd56b', '#ffffff', '#ecdcb6']);
    },
    tab(id) {
      document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.id === id)));
      document.querySelectorAll('.tabpane').forEach(p => { p.hidden = p.id !== 'pane-' + id; });
      $('.panes').scrollTop = 0;
      try { localStorage.setItem('idle-traveler-tab', id); } catch (e) { /* yok say */ }
    },
    sky(id) {
      if (!SKIES.includes(id) || S.settings.sky === id) return;
      S.settings.sky = id;
      if (id === 'cycle') S.settings.page = 'auto'; // döngü, sayfa teması tarayıcıyı izleyerek başlar
      applySky(); save();
      uiDirty.journal = true;
    },
    lang(id) {
      if (id !== 'auto' && !IT.LANGS[id]) return;
      S.settings.lang = id; IT.setLang(id); save();
      toast(t('toast.lang'), 'teal');
    },
    outfit(id) {
      const o = OUTFIT[id];
      if (!o || !outfitOpen(o) || S.settings.outfit === id) return;
      S.settings.outfit = id; applyOutfit(); save();
      uiDirty.garage = uiDirty.journal = true;
      scene.burst(scene.travelerX, scene.riderY() - 30 * scene.k, 16, [o.jacket, o.hat, o.pack, '#ffffff']);
    },
    units(id) {
      if (!UNITS.includes(id)) return;
      S.settings.units = id; IT.setUnits(id); save();
    },
    sfx() { S.settings.sfx = !S.settings.sfx; Sound.setSfx(S.settings.sfx); uiDirty.journal = true; syncSoundBtn(); },
    music() { S.settings.music = !S.settings.music; Sound.unlock(); Sound.setMusic(S.settings.music); uiDirty.journal = true; syncSoundBtn(); },
    home(_, el) {
      const gain = Econ.memoryGain(S.distance);
      if (gain < 1) return;
      if (el.dataset.armed !== '1') {
        el.dataset.armed = '1'; el.textContent = t('ui.confirmHome');
        el.classList.add('armed');
        disarm(el, t('ui.home'));
        return;
      }
      const trip = { dist: S.distance, regions: S.regionIdx + 1, gain, before: S.memories };
      S.memories += gain; S.trips++; S.lifeDist += S.distance;
      newTrip(KEEP);
      // Yeni yolculuk yeni rotayla başlar: henüz gezilmemiş rota açılır (hepsi açıksa sırayla dönülür)
      S.route = IT.ROUTES[S.trips % IT.ROUTES.length].id; trip.route = S.trips < IT.ROUTES.length;
      applyRoute();
      save();
      Sound.region();
      showHome(trip);
      checkBadges();
    },
    reset(_, el) {
      if (el.dataset.armed !== '1') {
        el.dataset.armed = '1'; el.textContent = t('ui.confirmReset');
        el.classList.add('armed');
        disarm(el, t('ui.reset'));
        return;
      }
      try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* yok say */ }
      newTrip(['settings', 'intro']);
      applyOutfit(); applyRoute();
      $('#hint').classList.remove('gone');
      save();
      toast(t('toast.reset'), 'teal');
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
    if ((scene.nightAmt || 0) > 0.5) S.nightTime += dt;
    // Gün döngüsünde akşam ve sabah kendiliğinden gelir
    if (scene.cycle) {
      const n = (scene.nightAmt || 0) > 0.5;
      if (cycNight !== null && n !== cycNight) toast(t(n ? 'toast.dusk' : 'toast.dawn'), 'teal');
      cycNight = n;
    } else cycNight = null;
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
      giftIn = (40 + Math.random() * 45) / (1 + 0.1 * S.buffs.butterfly) * (perk() === 'butterfly' ? 0.6 : 1);
    }
    // kayan yıldız: gece (ya da uzayda) ve yağmursuz gökyüzünde ara sıra kayar
    if ($('#modal').hidden && Math.max(scene.nightAmt || 0, scene.space || 0) > 0.6 && weather !== 'rain') starIn -= dt;
    if (starIn <= 0) {
      if (!scene.star) scene.spawnStar();
      starIn = (50 + Math.random() * 70) * (perk() === 'stars' ? 0.5 : 1);
    }

    scene.companion = S.buffs.pal > 0 ? S.palPick : null;
    scene.palTier = Econ.palTier(S.buffs.pal);
    scene.vehTier = Econ.lookTier(S.levels[S.active]);
    scene.update(dt, Math.max(rateEma, cur.idle) * IT.SPEED_VIS, scene.nightAmt || 0);
    scene.draw();
    Sound.tick(dt, Math.min(1, scene.vs / 700), scene.rain || 0);

    uiTimer += dt;
    if (uiTimer > 0.12) { uiTimer = 0; checkDaily(); checkBadges(); refreshUI(); }
    saveTimer += dt;
    if (saveTimer > 5) { saveTimer = 0; save(); }
    requestAnimationFrame(frame);
  }
  // Tıklamalarla gelen mesafe, hız ortalamasına bir sonraki karede eklenir
  let clickBuffer = 0;

  /* ---------- Kartpostal ---------- */
  // Sahnenin arayüzsüz görüntüsünden kenarlıklı, yazılı, pullu bir kartpostal üretir
  function makePostcard() {
    const src = scene.canvas, W = src.width, H = src.height;
    const pad = Math.round(Math.min(W, H) * 0.045), capH = Math.round(Math.max(H * 0.17, pad * 3.2));
    const c = document.createElement('canvas');
    c.width = W + pad * 2; c.height = H + pad * 2 + capH;
    const x = c.getContext('2d');
    x.fillStyle = '#fbf5e9'; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(src, pad, pad);
    x.strokeStyle = 'rgba(60,50,40,0.18)'; x.lineWidth = Math.max(1, pad * 0.08); x.strokeRect(pad, pad, W, H);
    const region = IT.regionAt(S.regionIdx).name, fs = capH * 0.3;
    x.fillStyle = '#2b2a45'; x.textBaseline = 'alphabetic';
    x.font = `800 ${Math.round(fs)}px "Baloo 2", system-ui, sans-serif`;
    // Sol sütun (başlık ve alt satır) sağdaki marka yazısına ve pula binmesin diye genişliği sınırlı
    const colW = W - capH * 0.78 - Math.max(W * 0.22, capH * 1.6) - pad;
    x.fillText(t('pc.greet', { region }), pad, H + pad + capH * 0.5, colW);
    x.fillStyle = '#6a6788'; x.font = `600 ${Math.round(fs * 0.5)}px "Figtree", system-ui, sans-serif`;
    const date = new Intl.DateTimeFormat(IT.locale(), { dateStyle: 'long' }).format(new Date());
    x.fillText(`${fmtDist(S.distance)} · ${VEH[S.active].name} · ${date}`, pad, H + pad + capH * 0.82, colW);
    // pul: dişli kenar, içinde günün renkleriyle küçük bir manzara
    const sw = capH * 0.78, sx = c.width - pad - sw, sy = H + pad + capH * 0.12;
    x.fillStyle = '#ffffff'; x.fillRect(sx, sy, sw, sw * 0.82);
    x.fillStyle = '#fbf5e9';
    for (let i = 0; i <= 8; i++) for (const [px, py] of [[sx + i * sw / 8, sy], [sx + i * sw / 8, sy + sw * 0.82], [sx, sy + i * sw * 0.82 / 8], [sx + sw, sy + i * sw * 0.82 / 8]]) {
      x.beginPath(); x.arc(px, py, sw * 0.035, 0, Math.PI * 2); x.fill();
    }
    x.drawImage(src, src.width * 0.18, src.height * 0.35, src.width * 0.3, src.height * 0.5, sx + sw * 0.1, sy + sw * 0.08, sw * 0.8, sw * 0.66);
    x.fillStyle = 'rgba(231,105,78,0.85)'; x.font = `800 ${Math.round(sw * 0.13)}px "Baloo 2", system-ui, sans-serif`;
    x.textAlign = 'right'; x.fillText('Idle Traveler', sx - pad * 0.4, sy + sw * 0.2);
    x.fillStyle = '#9a97b3'; x.font = `600 ${Math.round(sw * 0.1)}px "Figtree", system-ui, sans-serif`;
    x.fillText('idle-traveler.vebaban.com', sx - pad * 0.4, sy + sw * 0.36);
    x.textAlign = 'left';
    return c;
  }
  function takePostcard() {
    Sound.unlock(); Sound.gift();
    const c = makePostcard();
    const url = c.toDataURL('image/png');
    const name = `idle-traveler-${Date.now()}.png`;
    // Paylaşım metni fotoğrafın çekildiği anı anlatsın
    const dist = S.distance, region = IT.regionAt(S.regionIdx).name;
    S.photos++; checkBadges(); save();
    openModal(() => ({ btn: t('pc.close'), html: `
      <p class="eyebrow">${t('pc.eyebrow')}</p>
      <h2>${t('pc.title')}</h2>
      <img class="postcard" src="${url}" alt="${esc(t('pc.greet', { region: IT.regionAt(S.regionIdx).name }))}">
      <div class="pc-actions">
        <a class="buy pc-btn" href="${url}" download="${name}"><b>${t('pc.download')}</b></a>
        ${navigator.canShare ? `<button class="buy pc-btn" id="pcShare" type="button"><b>${t('pc.share')}</b></button>` : ''}
      </div>` }), null, () => {
      const sh = $('#pcShare');
      if (sh) sh.onclick = () => c.toBlob(blob => {
        const file = new File([blob], name, { type: 'image/png' });
        const data = { files: [file], title: 'Idle Traveler', text: t('pc.shareText', { d: fmtDist(dist), region }) };
        if (navigator.canShare(data)) navigator.share(data).catch(() => {}); else sh.hidden = true;
      });
    }, true);
  }

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
  // render: { html, btn } döndürür; dil değişince pencere yeni dilde yeniden çizilir. after: çizimden sonra (olay bağlama)
  // dismiss: pencere dışına basınca ya da Esc ile kapanabilir (Yenilikler, Ayarlar, Kartpostal)
  let modalDismiss = false;
  function openModal(render, onClose, after, dismiss) {
    if (!$('#modal').hidden) { modalQueue.push([render, onClose, after, dismiss]); return; }
    modalDismiss = !!dismiss;
    const b = $('#modalBtn');
    modalRender = () => {
      const r = render();
      $('#modalBody').innerHTML = r.html; b.textContent = r.btn;
      if (after) after();
    };
    modalRender();
    $('#modal').hidden = false;
    b.focus({ preventScroll: true });
    b.onclick = () => {
      $('#modal').hidden = true; modalRender = null; modalDismiss = false; Sound.unlock();
      if (onClose) onClose();
      if (modalQueue.length) openModal(...modalQueue.shift());
    };
  }
  function showOffline(o) {
    const v = VEH[S.active];
    // Uzun aralardan sonra listeler ekranı doldurmasın: son birkaç öğe ve kalan sayısı
    const list = a => a.slice(-6).map(esc).join(', ') + (a.length > 6 ? ' ' + t('off.more', { n: a.length - 6 }) : '');
    const names = () => [o.res.regions.map(x => x.r.name), o.res.milestones.map(x => x.m.name), (o.res.badges || []).map(b => b.name)];
    openModal(() => {
      const [regions, ms, badges] = names();
      return { btn: t('off.btn'), html: `
      <p class="eyebrow">${t('off.eyebrow')}</p>
      <h2>${t('off.title')}</h2>
      <p class="lead">${t('off.lead', { dur: fmtDuration(o.sec), by: v.by, p: fmtPct(o.rate * 100) })}</p>
      <div class="gains">
        <div><span>${t('off.dist')}</span><b>+${fmtGain(o.d)}</b></div>
        <div><span>${t('off.credits')}</span><b class="cr">+${fmtNum(o.credits)}</b></div>
      </div>
      ${regions.length ? `<p class="small">${t('off.regions', { list: list(regions) })}</p>` : ''}
      ${ms.length ? `<p class="small">${t('off.ms', { list: list(ms) })}</p>` : ''}
      ${badges.length ? `<p class="small">${t('off.badges', { list: list(badges) })}</p>` : ''}
      ${o.capped ? `<p class="small muted">${t('off.capped', { h: fmtHours(Econ.offlineCapHours(S.buffs.camp)), buff: BUFF.camp.name })}</p>` : ''}
      ${o.rate < 0.9 ? `<p class="small muted">${t('off.dream', { buff: BUFF.dream.name })}</p>` : ''}
    ` };
    }, () => { const r = o.res.regions; if (r.length) showBanner(r[r.length - 1].r.name, t('off.banner')); });
  }
  function showHome(trip) {
    const pct = m => fmtPct(HOME.bonus * m * 100);
    openModal(() => ({ btn: t('home.btn'), html: `
      <p class="eyebrow">${t('home.eyebrow', { n: S.trips })}</p>
      <h2>${t('home.title')}</h2>
      <p class="lead">${t('home.lead', { d: fmtDist(trip.dist), r: trip.regions, n: trip.regions })}</p>
      <div class="gains">
        <div><span>${t('home.gain')}</span><b>+${fmtNum(trip.gain)}</b></div>
        <div><span>${t('home.bonus')}</span><b class="cr">${pct(trip.before)} → ${pct(S.memories)}</b></div>
      </div>
      ${trip.route ? `<p class="lead">${t('home.newRoute', { name: esc(IT.getRoute().name), perk: esc(IT.getRoute().perkText) })}</p>` : ''}
      ${routesOpenFor(S.trips) > 1 ? `<p class="small">${t('homecard.pick')}</p>${routePicker()}` : ''}
      <p class="small muted">${t('home.note')}</p>
    ` }));
  }
  function showIntro() {
    // Yeni oyuncu eski sürüm notlarını "yeni" olarak görmesin
    openModal(() => ({ html: introHtml(), btn: t('intro.btn') }), () => { S.intro = true; S.seenVer = IT.VERSION; syncNews(); save(); });
  }

  /* ---------- Sürüm ve yenilikler ---------- */
  const hasNews = () => IT.verCmp(IT.VERSION, S.seenVer) > 0;
  function syncNews() {
    setText('#verNum', 'v' + IT.VERSION);
    $('.ver-dot').hidden = !hasNews();
  }
  function showNews() {
    // Daha önce görülen sürümden sonrakiler "yeni" işaretlenir (sürüm bilinmiyorsa yalnızca son sürüm)
    const seen = S.seenVer || IT.CHANGELOG[1].v;
    S.seenVer = IT.VERSION; syncNews(); save();
    openModal(() => {
      const df = new Intl.DateTimeFormat(IT.locale(), { dateStyle: 'long' });
      const items = c => c.items[IT.lang()] || c.items.en;
      return { btn: t('news.btn'), html: `
        <p class="eyebrow">${t('news.eyebrow', { v: IT.VERSION })}</p>
        <h2>${t('news.title')}</h2>
        <ol class="news">${IT.CHANGELOG.map(c => {
          const fresh = IT.verCmp(c.v, seen) > 0;
          return `<li${fresh ? ' class="fresh"' : ''}><h3>v${c.v} <small>${df.format(new Date(c.date + 'T12:00:00'))}</small>${fresh ? `<span class="tagnew">${t('news.new')}</span>` : ''}</h3>
            <ul>${items(c).map(x => `<li>${esc(x)}</li>`).join('')}</ul></li>`;
        }).join('')}</ol>` };
    }, null, null, true);
  }
  function introHtml() {
    return `
      <p class="eyebrow">${t('intro.eyebrow')}</p>
      <h2>Idle Traveler</h2>
      <p class="lead">${t('intro.lead')}</p>
      <ul class="intro-list">${[1, 2, 3, 4, 5, 6, 7].map(i => `<li>${t('intro.li' + i)}</li>`).join('')}</ul>
      <label class="intro-lang"><span>${t('j.lang')}</span>${langSelect('introLang')}</label>`;
  }
  let modalRender = null;
  function langSelect(id) {
    const cur = S.settings.lang;
    const auto = t('j.langAuto', { name: IT.LANGS[IT.detect()].name });
    const opts = [['auto', auto], ...Object.entries(IT.LANGS).map(([k, d]) => [k, d.name])];
    return `<select id="${id}" class="lang-select" aria-label="${t('j.lang')}">${opts.map(([k, n]) =>
      `<option value="${k}"${cur === k ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  }
  // Sayfadaki sabit metinler: data-i18n (metin), data-i18n-title, data-i18n-aria
  function applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    const md = document.querySelector('meta[name="description"]');
    if (md) md.content = t('meta.desc');
  }
  function onLanguage() {
    applyStatic();
    uiDirty = { garage: true, buffs: true, journal: true };
    $('#effects').replaceChildren(); // yeni dilde yeniden kurulur
    syncSoundBtn(); syncSkyBtn();
    if (!$('#modal').hidden && modalRender) modalRender();
    scene.relabel();
    refreshUI();
  }

  // Gökyüzü ayarı sayfanın data-theme özniteliğini yönetir; sahne ve arayüz bu özniteliği zaten izler.
  // Otomatik modda yalnızca kendi koyduğumuz özniteliği kaldırırız (dışarıdan gelen tema korunur).
  let skyOwned = false;
  const metaColors = [...document.querySelectorAll('meta[name="theme-color"]')].map(m => [m, m.content]);
  function applySky() {
    // Gün döngüsünde sayfanın açık/koyu teması ayrı tutulur (başlıktaki tema düğmesi yalnızca onu değiştirir)
    const sky = S.settings.sky, el = document.documentElement;
    const t = sky === 'cycle' ? { light: 'light', dark: 'dark' }[S.settings.page] : { day: 'light', night: 'dark' }[sky];
    if (t) { el.setAttribute('data-theme', t); skyOwned = true; } else if (skyOwned) { el.removeAttribute('data-theme'); skyOwned = false; }
    for (const [m, c] of metaColors) m.content = t ? (t === 'dark' ? '#1e2140' : '#eef0f8') : c;
    if (scene) { scene.setCycle(S.settings.sky === 'cycle'); syncSkyBtn(); }
  }
  // Tema düğmesi: normalde sahneyi gündüz/geceye çevirir; gün döngüsünde döngüye dokunmadan
  // yalnızca sayfanın açık/koyu temasını değiştirir. Simge her zaman sayfa temasını gösterir.
  function syncSkyBtn() {
    const night = scene.mode === 'dark', cyc = S.settings.sky === 'cycle';
    const btn = $('#btnSky');
    btn.title = cyc ? (night ? t('ui.toLight') : t('ui.toDark')) : (night ? t('ui.toDay') : t('ui.toNight'));
    btn.setAttribute('aria-label', btn.title);
    // SVG öğelerinde .hidden özelliği yok; öznitelik doğrudan değiştirilir
    btn.querySelector('.ico-sun').toggleAttribute('hidden', night);
    btn.querySelector('.ico-moon').toggleAttribute('hidden', !night);
  }

  function syncSoundBtn() {
    const on = S.settings.sfx || S.settings.music;
    const btn = $('#btnSound');
    btn.setAttribute('aria-pressed', String(on));
    btn.title = on ? t('ui.soundOff') : t('ui.soundOn');
    btn.querySelector('.ico-on').toggleAttribute('hidden', !on);
    btn.querySelector('.ico-off').toggleAttribute('hidden', on);
  }

  const coin = '<i class="coin" aria-hidden="true"></i>';
  function costBtn(act, id, cost, label) {
    return `<button class="buy" data-act="${act}" data-id="${id}" data-cost="${cost}"><span>${label}</span><b>${coin}${fmtNum(cost)}</b></button>`;
  }

  function renderGarage() {
    const pane = $('#pane-garage');
    const firstLocked = VEHICLES.findIndex(v => !S.owned[v.id]);
    const bulk = S.settings.bulk, lead = Econ.lead(S);
    // Açıklama sabit metindir; değişen değerler tek satırlık özet kutularında durur, böylece alttaki kartlar kaymaz
    let html = `<div class="garage-top">
      <p class="tag">${t('garage.rule')} ${t('garage.convoy0', { p: fmtPct(CONVOY * 100) })} ${t('garage.cosmetic')}</p>
      <div class="seg" role="group" aria-label="${t('ui.bulkLabel')}">${BULKS.map(n =>
        `<button class="seg-btn" data-act="bulk" data-id="${n}" aria-pressed="${bulk === n}">${n === 'max' ? t('ui.max') : '×' + n}</button>`).join('')}</div>
    </div>
    <dl class="garage-sum">
      <div><dt>${t('garage.sumLead')}</dt><dd id="gLead"></dd></div>
      <div><dt>${t('garage.sumConvoy')}</dt><dd id="gConvoy"></dd></div>
    </dl>`;
    // Sıradaki araç hedef olarak görünür; ondan sonrakiler resim ya da isim vermeden tek bir kapalı kapının ardında bekler
    let hidden = 0;
    for (const v of VEHICLES) {
      const owned = !!S.owned[v.id];
      if (!owned && firstLocked !== -1 && v.index > firstLocked) { hidden++; continue; }
      const st = Econ.own(S, v.id);
      const active = S.active === v.id;
      const lvl = S.levels[v.id] || 0;
      html += `<article class="card veh${active ? ' active' : ''}${owned ? '' : ' locked'}">
        <canvas class="icon" data-icon="${v.id}" data-tier="${owned ? Econ.lookTier(lvl) : 0}" width="72" height="56"></canvas>
        <div class="body">
          <div class="row"><h3>${v.name}${owned ? ` <span class="lvl${v.id === lead ? '' : ' ghost'}" title="${t('ui.strongestTip')}"${v.id === lead ? '' : ' aria-hidden="true"'}>${t('ui.strongest')}</span>` : ''}</h3>${active ? `<span class="chip on">${t('ui.riding')}</span>` : owned ? `<button class="chip ride" data-act="ride" data-id="${v.id}">${t('ui.ride')}</button>` : ''}</div>
          <p class="tag">${esc(v.tagline)}</p>
          <p class="stats"><span>${t('ui.auto')} <b>${fmtSpeed(st.idle)}</b></span><span>${t('ui.perClick')} <b>${fmtGain(st.click)}</b></span></p>
        </div>
        ${owned
          ? `<div class="up"><div><p class="upline"><span class="upname" title="${esc(v.upName)}">${v.upName}</span><span class="lvl">${t('ui.lvl', { n: lvl })}</span></p><small>${nextDoubling(lvl)}</small></div>${upgradeBtn(v)}</div>`
          : `<div class="up">${costBtn('buyVeh', v.id, v.cost, t('ui.buy'))}</div><div class="progress"><i data-prog="${v.cost}"></i></div>`}
        </article>`;
    }
    if (hidden) html += `<article class="card veh mystery"><canvas class="icon" data-icon="mystery" width="72" height="56"></canvas>
      <div class="body"><h3>???</h3><p class="tag">${t('garage.mystery', { n: hidden })}</p></div></article>`;
    pane.innerHTML = html;
    pane.querySelectorAll('canvas[data-icon]').forEach(c => IT.drawIcon(c, c.dataset.icon, false, +c.dataset.tier || 0));
  }
  function upgradeBtn(v) {
    const q = Econ.upgradeQuote(v, S.levels[v.id] || 0, S.settings.bulk, S.credits);
    return costBtn('upgrade', v.id, q.cost, q.n > 1 ? t('ui.upgradeN', { n: q.n }) : t('ui.upgrade'));
  }
  function nextDoubling(lvl) {
    const next = DOUBLINGS.find(x => x > lvl);
    if (!next) return t('ui.perLevel', { p: fmtPct(25) });
    // görünüm değiştiren eşiklerde merak uyandıran ipucu
    return t(Econ.looks.includes(next) ? 'ui.doublingLook' : 'ui.doubling', { p: fmtPct(25), t: next });
  }

  function renderBuffs() {
    const pane = $('#pane-buffs');
    pane.innerHTML = BUFFS.map(b => {
      const lvl = S.buffs[b.id], maxed = b.max && lvl >= b.max;
      let next = b.next, extra = '';
      if (b.id === 'pal' && lvl) {
        // Yol arkadaşının gelişimi: sonraki seviyede yeni hayvan ya da yeni görünüm var mı
        const opens = Econ.pals.find(x => x.need === lvl + 1);
        next = t(opens ? 'buff.pal.moreNew' : Econ.palLooks.includes(lvl + 1) ? 'buff.pal.moreLook' : 'buff.pal.more', { p: fmtPct(5) });
        extra = `<div class="pals" role="group" aria-label="${t('buff.pal.name')}">${Econ.pals.map(x => {
          const open = lvl >= x.need, on = S.palPick === x.id;
          return `<button class="pal-btn${on ? ' on' : ''}" data-act="palPick" data-id="${x.id}" aria-pressed="${on}" ${open ? '' : 'disabled'}>
            <b>${open ? t(`pal.${x.id}.name`) : '???'}</b><small>${open ? t(`pal.${x.id}.desc`) : t('ui.lvl', { n: x.need })}</small></button>`;
        }).join('')}</div>`;
      }
      return `<article class="card buff">
        <div class="body">
          <div class="row"><h3>${b.name}</h3><span class="lvl">${t('ui.lvl', { n: lvl })}${b.max ? ' / ' + b.max : ''}</span></div>
          <p class="tag">${lvl ? b.desc(lvl) : t('ui.notYet')}</p>${extra}
          <div class="up"><small>${t('ui.nextLevel', { x: next })}</small>${maxed ? `<span class="chip on">${t('ui.done')}</span>` : costBtn('buff', b.id, Econ.buffCost(b, lvl), t('ui.get'))}</div>
        </div></article>`;
    }).join('') + homeCard();
  }
  function homeCard() {
    const gain = Econ.memoryGain(S.distance), pct = HOME.bonus * 100;
    const now = S.memories ? t('homecard.mem', { n: fmtNum(S.memories), p: fmtPct(pct * S.memories) }) : t('homecard.none');
    return `<article class="card home">
      <div class="body">
        <div class="row"><h3>${t('homecard.title')}</h3><span class="lvl">${S.trips ? t('homecard.trips', { n: S.trips }) : t('homecard.first')}</span></div>
        <p class="tag">${t('homecard.desc', { p: fmtPct(pct) })} ${now}</p>
        <p class="tag">${t('homecard.route', { name: esc(IT.getRoute().name), perk: esc(IT.getRoute().perkText) })}
          ${routesOpenFor(S.trips) < IT.ROUTES.length ? t('homecard.nextRoute') : ''}</p>
        ${S.regionIdx === 0 && routesOpenFor(S.trips) > 1 ? `<p class="tag small">${t('homecard.pick')}</p>${routePicker()}` : ''}
        ${gain || S.homeReady
          ? `<p class="tag">${t('homecard.now', { gain: '<b class="mem" id="homeGain"></b>', next: '<span id="homeNext"></span>' })}</p>`
          : `<p class="tag">${t('homecard.locked', { d: fmtDist(HOME.min) })}</p><div class="progress"><i id="homeProg"></i></div>`}
        <div class="up"><small>${t('homecard.hint')}</small><button class="buy home-btn" data-act="home" ${gain ? '' : 'disabled'}>${t('ui.home')}</button></div>
      </div></article>`;
  }

  function renderJournal() {
    const pane = $('#pane-journal');
    const stamps = [];
    for (let i = 0; i <= S.regionIdx; i++) {
      const r = IT.regionAt(i);
      stamps.push(`<li class="stamp s-${r.biome}" style="--r:${((i * 37) % 11) - 5}deg"><span>${esc(r.name)}</span><small>${i === 0 ? t('j.start') : fmtDist(r.at)}</small></li>`);
    }
    const nr = IT.regionAt(S.regionIdx + 1);
    stamps.push(`<li class="stamp next"><span>?</span><small>${fmtDist(nr.at)}</small></li>`);
    const msDone = MILESTONES.slice(0, S.msIdx).slice(-6).reverse();
    const nBadges = IT.badgeCount(S);
    // Her aile tek kart: madalya o anki kademenin renginde, altında 8 kademe noktası ve bir sonraki hedef
    const badges = BADGES.map(b => {
      const k = S.badges[b.id] || 0, tier = k ? TIERS[k - 1] : null;
      const pips = TIERS.map((x, i) => `<i style="--c1:${x.c1};--c2:${x.c2}"${i < k ? ' class="on"' : ''} title="${esc(x.name)}"></i>`).join('');
      const next = k < TIERS.length ? t('j.badgeNext', { tier: TIERS[k].name, desc: b.desc(k) }) : t('j.badgeDone');
      return `<li class="badge${k ? ' on' : ''}" title="${esc(next)}"${tier ? ` style="--c1:${tier.c1};--c2:${tier.c2};--ink:${tier.ink}"` : ''}>
        <span class="medal" aria-hidden="true">${k ? '★' : '?'}</span>
        <b>${k ? esc(b.name) : '???'}</b>${k ? `<em>${esc(tier.name)}</em>` : ''}
        <span class="pips" aria-hidden="true">${pips}</span><small>${esc(next)}</small></li>`;
    }).join('');
    pane.innerHTML = `
      <h3 class="sec">${t('j.trip')}</h3>
      <dl class="statgrid">
        <div><dt>${S.trips ? t('j.thisTrip') : t('j.total')}</dt><dd id="jDist"></dd></div>
        <div><dt>${t('j.credits')}</dt><dd id="jCred"></dd></div>
        <div><dt>${t('j.clicks')}</dt><dd id="jClicks"></dd></div>
        <div><dt>${t('j.time')}</dt><dd id="jTime"></dd></div>
        <div><dt>${t('j.best')}</dt><dd id="jBest"></dd></div>
        <div><dt>${t('j.gifts')}</dt><dd id="jGifts"></dd></div>
        <div><dt>${t('j.crits')}</dt><dd id="jCrits"></dd></div>
        <div><dt>${t('j.rainbows')}</dt><dd id="jRainbows"></dd></div>
        <div><dt>${t('j.wishes')}</dt><dd id="jWishes"></dd></div>
        <div><dt>${t('j.photos')}</dt><dd id="jPhotos"></dd></div>
        <div><dt>${t('j.streak')}</dt><dd>${t('j.streakVal', { n: S.day.streak, best: S.day.best })}</dd></div>
        ${S.trips ? `<div><dt>${t('j.life')}</dt><dd id="jLife"></dd></div>
        <div><dt>${t('j.memories')}</dt><dd>${t('j.memVal', { n: fmtNum(S.memories), p: fmtPct(HOME.bonus * S.memories * 100) })}</dd></div>` : ''}
      </dl>
      <h3 class="sec">${t('j.stamps')} <small>${t('j.stampsSub', { n: S.regionIdx + 1, p: fmtPct(6) })} · ${esc(IT.getRoute().name)}</small></h3>
      <ul class="stamps">${stamps.join('')}</ul>
      <h3 class="sec">${t('j.badges')} <small>${t('j.badgesSub', { n: nBadges, m: BADGE_TIERS, p: fmtPct(IT.badgeBonus(S) * 100) })}</small></h3>
      <ul class="badges">${badges}</ul>
      <h3 class="sec">${t('j.ms')}</h3>
      <ul class="mslist">${msDone.length ? msDone.map(m => `<li><span>${esc(m.name)}</span><b>${fmtDist(m.at)}</b></li>`).join('') : `<li class="muted">${t('j.msNone')}</li>`}</ul>
      <h3 class="sec">${t('j.offline')}</h3>
      <p class="tag">${t('j.offlineDesc', { p: fmtPct(Econ.offlineRate(S.buffs.dream) * 100), h: fmtHours(Econ.offlineCapHours(S.buffs.camp)) })}</p>
      <h3 class="sec">${t('j.outfit')} <small>${t('j.outfitSub')}</small></h3>
      <ul class="outfits">${OUTFITS.map(o => {
        const open = outfitOpen(o), on = open && (S.settings.outfit === o.id || (!outfitOpen(OUTFIT[S.settings.outfit]) && o.id === 'classic'));
        return `<li><button class="outfit${on ? ' on' : ''}" data-act="outfit" data-id="${o.id}" aria-pressed="${on}" ${open ? '' : 'disabled'}
          style="--j:${o.jacket};--h:${o.hat};--p:${o.pack}"><span class="sw" aria-hidden="true"></span><b>${open ? esc(o.name) : '???'}</b>
          <small>${open ? (on ? t('j.wearing') : '&nbsp;') : t('ui.outfitLock', { n: o.need })}</small></button></li>`;
      }).join('')}</ul>`;
  }

  /* ---------- Ayarlar (başlık çubuğundaki dişli düğmesi) ---------- */
  function settingsHtml() {
    return `
      <p class="eyebrow">Idle Traveler</p>
      <h2>${t('j.settings')}</h2>
      <div class="settings">
        <label class="toggle select"><span>${t('j.lang')}</span>${langSelect('setLang')}</label>
        <div class="toggle sky"><span>${t('j.units')}</span><div class="seg" role="group" aria-label="${t('j.units')}">${UNITS.map(k =>
          `<button class="seg-btn" data-act="units" data-id="${k}" aria-pressed="${S.settings.units === k}">${t('units.' + k)}</button>`).join('')}</div></div>
        <button class="toggle" data-act="sfx" aria-pressed="${S.settings.sfx}">${t('j.sfx')} <b>${S.settings.sfx ? t('j.on') : t('j.off')}</b></button>
        <button class="toggle" data-act="music" aria-pressed="${S.settings.music}">${t('j.music')} <b>${S.settings.music ? t('j.on') : t('j.off')}</b></button>
        <div class="toggle sky"><span>${t('j.sky')}</span><div class="seg" role="group" aria-label="${t('j.sky')}">${SKIES.map(k =>
          `<button class="seg-btn" data-act="sky" data-id="${k}" aria-pressed="${S.settings.sky === k}">${t('sky.' + k)}</button>`).join('')}</div>
          ${S.settings.sky === 'cycle' ? (() => { const L = scene.dayLength(IT.regionAt(S.regionIdx).biome);
            return `<small class="sky-info">${t('j.cycleInfo', { season: t('season.' + L.season), d: fmtDuration(L.day), n: fmtDuration(L.night) })}</small>`; })() : ''}</div>
        <button class="danger" data-act="reset">${t('ui.reset')}</button>
      </div>
      <p class="tag muted small">${t('j.saved')}</p>`;
  }
  function showSettings() {
    openModal(() => ({ html: settingsHtml(), btn: t('pc.close') }), null, null, true);
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
    if (!$('#pane-garage').hidden) {
      const b = cur.base;
      setText('#gLead', VEH[Econ.lead(S)].name);
      setText('#gConvoy', b.convoy > 0 ? '+' + fmtSpeed(b.convoy) : '—');
    }
    setText('#credits', fmtNum(S.credits));
    setText('#income', t('ui.perSec', { c: IT.fmtSmall(Math.max(creditEma, cur.idle * cur.cpm)) }));
    const cm = comboMult();
    setText('#rhythmVal', '×' + fmt2(cm));
    $('#rhythmFill').style.transform = `scaleX(${Math.min(combo, 20) / 20})`;
    // sıradaki durak
    const m = MILESTONES[S.msIdx];
    if (m) {
      const prev = S.msIdx ? MILESTONES[S.msIdx - 1].at : 0;
      setText('#msName', m.name);
      setText('#msProg', `${fmtDist(S.distance)} / ${fmtDist(m.at)}`);
      $('#msFill').style.transform = `scaleX(${Math.max(0, Math.min(1, (S.distance - prev) / (m.at - prev)))})`;
    } else {
      setText('#msName', t('ms.unknown')); setText('#msProg', fmtDist(S.distance));
      $('#msFill').style.transform = 'scaleX(1)';
    }
    // etkiler
    const now = Date.now();
    // Her etki kalıcı bir öğe: yalnızca yazısı güncellenir (giriş animasyonu her saniye baştan oynamaz).
    // Son 10 saniyede yumuşakça yanıp söner.
    const fxBox = $('#effects'), live = new Set();
    for (const e of S.effects) {
      if (e.until <= now) continue;
      live.add(e.id);
      let el = fxBox.querySelector(`[data-fx="${e.id}"]`);
      if (!el) { el = document.createElement('span'); el.className = `fx fx-${e.id}`; el.dataset.fx = e.id; fxBox.appendChild(el); }
      const left = Math.ceil((e.until - now) / 1000);
      const html = t('ui.fx', { name: GIFT[e.id].name, text: effText(GIFT[e.id], e.stack), dur: fmtDuration(left) });
      if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
      el.classList.toggle('ending', left <= 10);
    }
    for (const el of [...fxBox.children]) if (!live.has(el.dataset.fx)) el.remove();
    // butonlar ('Maks' modunda miktar bütçeyle değişir)
    if (S.settings.bulk === 'max') document.querySelectorAll('#pane-garage [data-act="upgrade"]').forEach(b => {
      const v = VEH[b.dataset.id], q = Econ.upgradeQuote(v, S.levels[v.id] || 0, 'max', S.credits);
      if (+b.dataset.cost === q.cost) return;
      b.dataset.cost = q.cost;
      b.innerHTML = `<span>${q.n > 1 ? t('ui.upgradeN', { n: q.n }) : t('ui.upgrade')}</span><b>${coin}${fmtNum(q.cost)}</b>`;
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
      setText('#homeGain', t('homecard.gain', { n: gain, c: fmtNum(gain) }));
      setText('#homeNext', fmtDist(Econ.memoryNext(S.distance)));
      const hp = $('#homeProg'); if (hp) hp.style.transform = `scaleX(${Math.min(1, S.distance / HOME.min)})`;
      const hb = $('.home-btn'); if (hb && hb.disabled !== !gain) hb.disabled = !gain;
    }
    if (!$('#pane-journal').hidden) {
      setText('#jDist', fmtDist(S.distance)); setText('#jCred', fmtNum(S.totalCredits));
      setText('#jClicks', fmtNum(S.clicks)); setText('#jTime', fmtDuration(S.playTime));
      setText('#jBest', fmtSpeed(S.best)); setText('#jGifts', fmtNum(S.gifts));
      setText('#jCrits', fmtNum(S.crits)); setText('#jRainbows', fmtNum(S.rainbows));
      setText('#jWishes', fmtNum(S.wishes)); setText('#jPhotos', fmtNum(S.photos));
      if (S.trips) setText('#jLife', t('j.lifeVal', { d: fmtDist(S.lifeDist + S.distance), n: S.trips + 1 }));
    }
  }
  function setText(sel, t) { const el = $(sel); if (el && el.textContent !== t) el.textContent = t; }

  /* ---------- Başlatma ---------- */
  function start(hotSave) {
    S = (hotSave && sanitize(hotSave)) || load() || defaultState();
    checkBadges(true); // eski kayıtlardan gelen ya da sessizce hak edilen kademeler bildirimsiz verilir
    IT.setRoute(S.route);
    IT.setUnits(S.settings.units); IT.setLang(S.settings.lang);
    applyStatic();
    scene = new IT.Scene($('#scene'));
    applySky(); applyOutfit();
    // Sahne tarayıcı temasını izler: açık tema gündüz, koyu tema gece
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const themeMode = () => {
      const t = document.documentElement.getAttribute('data-theme');
      if (t === 'dark' || t === 'light') return t;
      return mq && mq.matches ? 'dark' : 'light';
    };
    scene.setMode(themeMode(), true);
    if (scene.cycle) scene.cycTod = scene.tod; // döngü, sayfa temasının saatinden başlar
    const onTheme = () => {
      const m = themeMode();
      if (m === scene.mode) return;
      scene.setMode(m);
      syncSkyBtn();
      // Gün döngüsünde sahne temayı izlemez; tema yalnızca döngü kapanınca dönülecek yer olarak saklanır
      if (scene.cycle) return;
      toast(t(m === 'dark' ? 'toast.dusk' : 'toast.dawn'), 'teal');
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
      if (e.target.closest('button, a')) return;
      const r = scene.canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (scene.hitGift(x, y)) { catchGift(); return; }
      if (scene.hitStar(x, y)) { catchStar(); return; }
      const before = S.distance;
      step();
      clickBuffer += S.distance - before;
    });
    document.addEventListener('keydown', e => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        const t = e.target;
        if (t && t.closest && t.closest('button, input, select, textarea, a, [role="tab"]')) return;
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
    IT.onLang(onLanguage);
    document.addEventListener('change', e => {
      if (e.target.matches && e.target.matches('.lang-select')) { Sound.unlock(); actions.lang(e.target.value); }
    });
    $('#btnSound').addEventListener('click', e => {
      Sound.unlock();
      if (e.detail > 0) e.currentTarget.blur();
      const on = !(S.settings.sfx || S.settings.music);
      S.settings.sfx = on; S.settings.music = on;
      Sound.setSfx(on); Sound.setMusic(on);
      uiDirty.journal = true; syncSoundBtn();
    });
    // Kapatılabilir pencereler: kartın dışına (karartılmış zemine) basınca ya da Esc ile kapanır
    $('#modal').addEventListener('click', e => { if (e.target === e.currentTarget && modalDismiss) $('#modalBtn').click(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalDismiss && !$('#modal').hidden) $('#modalBtn').click(); });
    $('#btnSettings').addEventListener('click', e => {
      if (e.detail > 0) e.currentTarget.blur();
      Sound.unlock(); showSettings();
    });
    // Pencere içindeki ayar düğmeleri: eylemden sonra pencere yeni durumla yeniden çizilir
    $('#modalBody').addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el || el.disabled || !actions[el.dataset.act]) return;
      Sound.unlock();
      const act = el.dataset.act, armed = el.dataset.armed === '1';
      actions[act](el.dataset.id, el);
      // Sıfırlama ilk dokunuşta onay ister: o anda yeniden çizilmez, yoksa onay yazısı kaybolur
      if ((act !== 'reset' || armed) && modalRender) modalRender();
      refreshUI();
    });
    $('#btnNews').addEventListener('click', e => {
      if (e.detail > 0) e.currentTarget.blur();
      Sound.unlock(); showNews();
    });
    $('#btnPhoto').addEventListener('click', e => {
      if (e.detail > 0) e.currentTarget.blur();
      takePostcard();
    });
    $('#btnSky').addEventListener('click', e => {
      if (e.detail > 0) e.currentTarget.blur();
      if (S.settings.sky === 'cycle') S.settings.page = scene.mode === 'dark' ? 'light' : 'dark';
      else S.settings.sky = scene.mode === 'dark' ? 'day' : 'night';
      applySky(); save(); uiDirty.journal = true;
    });
    window.addEventListener('resize', () => { scene.resize(); });
    if (window.ResizeObserver) new ResizeObserver(() => scene.resize()).observe(stage);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { save(); Sound.pause(); } else { lastFrame = performance.now(); Sound.resume(); }
    });
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);

    let tab = 'garage';
    try { tab = localStorage.getItem('idle-traveler-tab') || 'garage'; } catch (e) { /* yok say */ }
    actions.tab(['garage', 'buffs', 'journal'].includes(tab) ? tab : 'garage');

    // İlk açılış ya da çevrimdışı dönüş
    if (!S.intro) showIntro();
    else resume((Date.now() - S.lastSeen) / 1000);
    S.lastSeen = Date.now();
    checkDaily();
    syncNews();
    if (S.intro && hasNews()) toast(t('toast.newVersion', { v: IT.VERSION }), 'teal');

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
