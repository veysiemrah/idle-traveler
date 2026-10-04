/* Idle Traveler — oyun verisi, ekonomi formülleri ve biçimlendirme yardımcıları.
   Tarayıcıda window.IT altında, Node'da (denge simülasyonu için) globalThis.IT altında yayınlanır. */
(function (root) {
  'use strict';
  // Çeviri: tarayıcıda IT.t, Node'daki denge simülasyonunda anahtarın kendisi
  const T = (k, v) => (root.IT && root.IT.t ? root.IT.t(k, v) : k);


  /* ---------- Araçlar ---------- */
  // idle: otomatik hız (m/sn), click: tıklama başına mesafe (m), alt: kameranın yükseldiği irtifa (0 = yer)
  const VEHICLES = [
    { id: 'walk',   cost: 0,       idle: 0.35,  click: 0.4,   road: 'path',    alt: 0 },
    { id: 'skates', cost: 150,     idle: 1.5,   click: 1.25,   road: 'path',    alt: 0 },
    { id: 'board',  cost: 900,     idle: 3,     click: 2.2,   road: 'path',    alt: 0 },
    { id: 'bike',   cost: 5000,    idle: 6,     click: 4,     road: 'path',    alt: 0 },
    { id: 'horse',  cost: 3.2e4,   idle: 12,    click: 7.5,   road: 'path',    alt: 0 },
    { id: 'moto',   cost: 2.0e5,   idle: 24,    click: 14,    road: 'asphalt', alt: 0 },
    { id: 'car',    cost: 8.0e6,   idle: 95,    click: 50,   road: 'asphalt', alt: 0 },
    { id: 'van',    cost: 4.0e7,   idle: 190,   click: 95,    road: 'asphalt', alt: 0 },
    { id: 'train',  cost: 2.0e8,   idle: 380,   click: 190,   road: 'rail',    alt: 0 },
    { id: 'balloon', cost: 9.0e8, idle: 870, click: 410,   road: 'asphalt', alt: 0.4 },
    { id: 'plane',  cost: 4.0e9,   idle: 2000,  click: 900,  road: 'asphalt', alt: 0.55 },
    { id: 'jet',    cost: 2.0e10, idle: 4500,  click: 1900,  road: 'asphalt', alt: 0.55 },
    { id: 'rocket', cost: 1.0e11,  idle: 10000, click: 4000,  road: 'asphalt', alt: 1 },
    { id: 'sail',   cost: 2.5e12,  idle: 50000, click: 20000, road: 'asphalt', alt: 1.15 },
  ];
  VEHICLES.forEach((v, i) => {
    v.index = i; v.upBase = i === 0 ? 8 : Math.round(v.cost * 0.05);
    // Metinler seçili dilden okunur
    Object.defineProperties(v, {
      name: { get: () => T(`veh.${v.id}.name`) },
      upName: { get: () => T(`veh.${v.id}.up`) },
      tagline: { get: () => T(`veh.${v.id}.tagline`) },
      by: { get: () => T(`veh.${v.id}.by`) },
    });
  });
  const VEH = Object.fromEntries(VEHICLES.map(v => [v.id, v]));

  /* ---------- Kalıcı güçlendirmeler ---------- */
  // vals: açıklamadaki yer tutucuların değerleri (seviyeye göre), step: bir sonraki seviyenin getirdiği
  const BUFFS = [
    { id: 'stride',   base: 20,   growth: 2.2,           vals: l => ({ p: fmtPct(20 * l) }),                    step: () => ({ p: fmtPct(20) }) },
    { id: 'breeze',   base: 35,   growth: 2.2,           vals: l => ({ p: fmtPct(25 * l) }),                    step: () => ({ p: fmtPct(25) }) },
    { id: 'postcard', base: 120,  growth: 2.6,           vals: l => ({ p: fmtPct(25 * l) }),                    step: () => ({ p: fmtPct(25) }) },
    { id: 'rhythm',   base: 150,  growth: 3.0, max: 10,  vals: l => ({ p: fmtPct(50 + 10 * l) }),               step: () => ({ p: fmtPct(10) }) },
    { id: 'luck',     base: 250,  growth: 3.0, max: 10,  vals: l => ({ p: fmtPct(l), x: Econ.luckMult }),       step: () => ({ p: fmtPct(1) }) },
    { id: 'dream',    base: 400,  growth: 2.4, max: 10,  vals: l => ({ p: fmtPct(30 + 6 * l) }),                step: () => ({ p: fmtPct(6) }) },
    { id: 'camp',     base: 600,  growth: 2.1, max: 20,  vals: l => ({ h: fmtHours(8 + 2 * l) }),               step: () => ({ h: fmtHours(2) }) },
    { id: 'butterfly', base: 900, growth: 2.5, max: 10,  vals: l => ({ p: fmtPct(10 * l), q: fmtPct(15 * l) }), step: () => ({}) },
    // Yol arkadaşı Karabaş: tek seferlik, eve dönüşte de kalır
    { id: 'pal',      base: 2500, growth: 1,   max: 1,   vals: l => ({ p: fmtPct(10 * l) }),                    step: () => ({}) },
  ];
  BUFFS.forEach(b => Object.defineProperties(b, {
    name: { get: () => T(`buff.${b.id}.name`) },
    next: { get: () => T(`buff.${b.id}.next`, b.step()) },
  }));
  BUFFS.forEach(b => { b.desc = l => T(`buff.${b.id}.desc`, b.vals(l)); });
  const BUFF = Object.fromEntries(BUFFS.map(b => [b.id, b]));

  /* ---------- Biyomlar (gündüz renk paletleri ve sahne dekoru) ---------- */
  const BIOMES = {
    meadow:     { sky: ['#6fb3e4', '#ffe7c4'], far: '#93a9d2', cap: '#e9eef9', mid: '#86bf7c', near: '#6db267', ground: '#62a65d', road: '#d9c39c',
                  farShape: 'mountain', farH: 0.9, trees: ['round', 'round', 'poplar', 'bush', 'bush'], midTrees: ['round', 'poplar'],
                  deco: 'flowers', flowers: ['#ffffff', '#ffd25e', '#ff9fb4'], houses: true, particles: 'fireflies' },
    lavender:   { sky: ['#8bb2e8', '#fde0e3'], far: '#a7a1d4', cap: null, mid: '#9cc488', near: '#8c79c4', ground: '#7aa86a', road: '#dcc7a6',
                  farShape: 'hills', farH: 0.8, trees: ['cypress', 'round', 'bush'], midTrees: ['cypress', 'round'],
                  deco: 'lavender', flowers: ['#b9a2f0', '#9a7fe0'], houses: true, particles: 'fireflies' },
    pine:       { sky: ['#78add6', '#e5f0e3'], far: '#7893b2', cap: '#eef3f9', mid: '#4d8865', near: '#5a986a', ground: '#55905e', road: '#cdb994',
                  farShape: 'mountain', farH: 1.15, trees: ['pine', 'pine', 'pine', 'bush'], midTrees: ['pine'],
                  deco: 'flowers', flowers: ['#ffffff', '#f4e7a1'], houses: false, particles: 'fireflies' },
    wheat:      { sky: ['#76b1e1', '#fff0c2'], far: '#b2b5d6', cap: null, mid: '#c8b05c', near: '#e2c268', ground: '#a6b55b', road: '#d9c39c',
                  farShape: 'hills', farH: 0.7, trees: ['poplar', 'poplar', 'round', 'bush'], midTrees: ['poplar'],
                  deco: 'wheat', flowers: ['#e84a4a', '#ffffff'], houses: true, particles: null },
    coast:      { sky: ['#5aaee6', '#e0f5fb'], far: '#3d9cc7', cap: null, mid: '#e8d5a4', near: '#b9d38a', ground: '#a9cb84', road: '#e2d2b0',
                  farShape: 'sea', farH: 0.2, trees: ['cypress', 'palm', 'bush'], midTrees: ['palm', 'cypress'],
                  deco: 'flowers', flowers: ['#ffffff', '#ff8fb1'], houses: true, particles: null, gulls: true },
    canyon:     { sky: ['#7caed8', '#ffd7ad'], far: '#c7765a', cap: null, mid: '#d68f5e', near: '#c58858', ground: '#b78259', road: '#d8b08a',
                  farShape: 'mesa', farH: 1.0, trees: ['cactus', 'rock', 'bush'], midTrees: ['cactus'],
                  deco: 'stones', flowers: ['#f7c66b'], houses: false, particles: null },
    sakura:     { sky: ['#98c3ec', '#ffe1ea'], far: '#a6b4db', cap: '#ffffff', mid: '#91c28c', near: '#7db676', ground: '#75ad6d', road: '#dcc6a6',
                  farShape: 'mountain', farH: 1.0, trees: ['sakura', 'sakura', 'round', 'bush'], midTrees: ['sakura'],
                  deco: 'flowers', flowers: ['#ffd0de', '#ffffff'], houses: true, particles: 'petals' },
    autumn:     { sky: ['#8cb0d4', '#ffd6b0'], far: '#a397b5', cap: null, mid: '#c8894a', near: '#b3773d', ground: '#9c894e', road: '#cfb48c',
                  farShape: 'hills', farH: 0.85, trees: ['autumn', 'autumnRed', 'poplarGold', 'bush'], midTrees: ['autumn', 'autumnRed'],
                  deco: 'flowers', flowers: ['#e8a33a', '#c9532f'], houses: true, particles: 'leaves' },
    desert:     { sky: ['#74b3e2', '#ffe8bf'], far: '#dfb078', cap: null, mid: '#e6bf89', near: '#eecd96', ground: '#e1be89', road: '#c9a77a',
                  farShape: 'dunes', farH: 0.75, trees: ['palm', 'cactus', 'rock'], midTrees: ['palm'],
                  deco: 'stones', flowers: ['#e7a76b'], houses: false, particles: null },
    snow:       { sky: ['#98bde1', '#edf3fa'], far: '#9bafca', cap: '#ffffff', mid: '#dde6f0', near: '#ecf2f7', ground: '#e4ebf3', road: '#b8b4ae',
                  farShape: 'mountain', farH: 1.3, trees: ['snowpine', 'snowpine', 'rock'], midTrees: ['snowpine'],
                  deco: 'snow', flowers: ['#ffffff'], houses: true, particles: 'snow' },
    aurora:     { sky: ['#5b7fb3', '#c8d6eb'], far: '#7b8db0', cap: '#f4f7fc', mid: '#cdd9e7', near: '#e1e9f2', ground: '#d9e3ee', road: '#aeb0b5',
                  farShape: 'mountain', farH: 1.1, trees: ['snowpine', 'rock'], midTrees: ['snowpine'],
                  deco: 'snow', flowers: ['#ffffff'], houses: false, particles: 'snow', aurora: true },
    tea:        { sky: ['#88bcde', '#e6f3e8'], far: '#6a988b', cap: null, mid: '#3e8c58', near: '#4c9c5c', ground: '#58a15d', road: '#c9b892',
                  farShape: 'mountain', farH: 1.05, trees: ['round', 'pine', 'teabush'], midTrees: ['pine', 'round'],
                  deco: 'tea', flowers: ['#ffffff'], houses: true, particles: null },
    cappadocia: { sky: ['#86b5e1', '#ffdfc2'], far: '#d8b28d', cap: null, mid: '#e3bf98', near: '#d6b188', ground: '#cdab82', road: '#bfa07c',
                  farShape: 'mesa', farH: 0.75, trees: ['chimney', 'chimney', 'bush', 'rock'], midTrees: ['chimney'],
                  deco: 'stones', flowers: ['#f2d6a2'], houses: false, particles: null, balloons: true },
    tulip:      { sky: ['#7fb6e6', '#fff0d8'], far: '#9fb3d8', cap: null, mid: '#8cc47e', near: '#7cbf6a', ground: '#6eae5f', road: '#d9c39c',
                  farShape: 'hills', farH: 0.55, trees: ['poplar', 'round', 'bush'], midTrees: ['poplar', 'round'],
                  deco: 'tulips', flowers: ['#e84a5f', '#ffd25e', '#ff8fb1', '#9a7fe0', '#ffffff'], houses: true, windmills: true, particles: 'fireflies' },
    olive:      { sky: ['#6aaee0', '#f3f0dc'], far: '#4a9cc2', cap: null, mid: '#b9b98c', near: '#a9b27a', ground: '#a3ab72', road: '#e0cfa8',
                  farShape: 'sea', farH: 0.2, trees: ['olive', 'olive', 'cypress', 'rock'], midTrees: ['olive', 'cypress'],
                  deco: 'flowers', flowers: ['#ffffff', '#f6d365', '#c9a4e8'], houses: true, particles: null, gulls: true },
  };

  /* ---------- Bölgeler: geometrik olarak uzayan eşikler ---------- */
  const REGIONS = [
    { biome: 'meadow',     at: 0 },
    { biome: 'lavender',   at: 250 },
    { biome: 'pine',       at: 1500 },
    { biome: 'wheat',      at: 7000 },
    { biome: 'coast',      at: 30000 },
    { biome: 'canyon',     at: 120000 },
    { biome: 'sakura',     at: 500000 },
    { biome: 'autumn',     at: 2.0e6 },
    { biome: 'desert',     at: 8.0e6 },
    { biome: 'snow',       at: 3.2e7 },
    { biome: 'aurora',     at: 1.3e8 },
    { biome: 'tea',        at: 5.0e8 },
    { biome: 'cappadocia', at: 2.0e9 },
    { biome: 'tulip',      at: 6.0e9 },
    { biome: 'olive',      at: 1.8e10 },
  ];
  REGIONS.forEach((r, i) => Object.defineProperty(r, 'name', { get: () => T(`region.${i}`) }));
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  // Liste bitince bölgeler ikinci tura girer; her yeni bölge öncekinin bu kadar katı uzakta.
  // (4 kat, son araçtan sonra hız artışı yetişemediği için yolu fiilen durduruyordu.)
  const LOOP_GROWTH = 3;
  function regionAt(i) {
    if (i < REGIONS.length) return REGIONS[i];
    const loop = REGIONS.length - 1;
    const k = i - REGIONS.length;
    const base = REGIONS[(k % loop) + 1];
    const lap = Math.floor(k / loop) + 2;
    return { get name() { return `${base.name} ${ROMAN[lap] || lap}`; }, biome: base.biome, at: REGIONS[REGIONS.length - 1].at * Math.pow(LOOP_GROWTH, k + 1) };
  }
  function regionIndexFor(dist) {
    let i = 0;
    while (regionAt(i + 1).at <= dist) i++;
    return i;
  }

  /* ---------- Gerçek dünyadan mesafe durakları ---------- */
  const MILESTONES = [
    { at: 100 },
    { at: 1000 },
    { at: 5000 },
    { at: 21097 },
    { at: 42195 },
    { at: 1.6e5 },
    { at: 4.5e5 },
    { at: 1.0e6 },
    { at: 1.7e6 },
    { at: 2.5e6 },
    { at: 9.0e6 },
    { at: 2.0e7 },
    { at: 4.0075e7 },
    { at: 1.0e8 },
    { at: 3.844e8 },
    { at: 7.688e8 },
    { at: 5.46e10 },
    { at: 1.496e11 },
    { at: 7.78e11 },
    { at: 4.5e12 },
    { at: 2.5e13 },
    { at: 9.46e15 },
    { at: 4.01e16 },
  ];
  MILESTONES.forEach((m, i) => Object.defineProperty(m, 'name', { get: () => T(`ms.${i}`) }));

  /* ---------- Rozetler: her biri kalıcı +%3 kredi ---------- */
  const maxLevel = s => Math.max(0, ...Object.values(s.levels || {}));
  const ownedCount = s => VEHICLES.filter(v => s.owned[v.id]).length;
  const BADGES = [
    { id: 'steps100',  n: 100, test: s => s.clicks >= 100 },
    { id: 'steps1k',   n: 1000, test: s => s.clicks >= 1000 },
    { id: 'steps10k',  n: 10000, test: s => s.clicks >= 10000 },
    { id: 'rhythm',    test: (s, rt) => rt && rt.combo >= 20 },
    { id: 'lucky',     test: s => s.crits >= 1 },
    { id: 'lucky100',  n: 100, test: s => s.crits >= 100 },
    { id: 'fly1',      test: s => s.gifts >= 1 },
    { id: 'fly25',     n: 25, test: s => s.gifts >= 25 },
    { id: 'rainbow',   test: s => s.rainbows >= 1 },
    { id: 'night',     n: 10, test: s => s.nightTime >= 600 },
    { id: 'reg5',      n: 5, test: s => s.regionIdx >= 4 },
    { id: 'reg13',     test: s => s.regionIdx >= REGIONS.length - 1 },
    { id: 'reg25',     n: 25, test: s => s.regionIdx >= 24 },
    { id: 'marathon',  test: s => s.distance >= 42195 },
    { id: 'world',     test: s => s.distance >= 4.0075e7 },
    { id: 'moon',      test: s => s.distance >= 3.844e8 },
    { id: 'sun',       test: s => s.distance >= 1.496e11 },
    { id: 'garage3',   n: 3, test: s => ownedCount(s) >= 3 },
    { id: 'garage6',   n: 6, test: s => ownedCount(s) >= 6 },
    { id: 'garage9',   test: s => ownedCount(s) >= VEHICLES.length },
    { id: 'tuned25',   n: 25, test: s => maxLevel(s) >= 25 },
    { id: 'tuned100',  n: 100, test: s => maxLevel(s) >= 100 },
    { id: 'home1',     test: s => s.trips >= 1 },
    { id: 'home5',     n: 5, test: s => s.trips >= 5 },
    { id: 'photo1',    test: s => s.photos >= 1 },
    { id: 'wish1',     test: s => s.wishes >= 1 },
    { id: 'wish10',    n: 10, test: s => s.wishes >= 10 },
    { id: 'mem100',    n: 100, test: s => s.memories >= 100 },
  ];
  BADGES.forEach(b => Object.defineProperties(b, {
    name: { get: () => T(`badge.${b.id}.name`) },
    desc: { get: () => T(`badge.${b.id}.desc`, { n: b.n !== undefined ? fmtNum(b.n) : '' }) },
  }));
  const BADGE_BONUS = 0.03;

  /* ---------- Eve dönüş ve hatıralar ---------- */
  // Uzun bir yolculuğun sonunda eve dönülür: araçlar, yükseltmeler, güçlendirmeler ve kredi sıfırlanır.
  // Yolculuğun uzunluğuna göre hatıra kazanılır; her hatıra sonraki yolculuklarda kalıcı hız verir.
  const HOME = { min: 5.0e8, unit: 1.0e9, per: 10, exp: 1 / 3, bonus: 0.1 };

  /* ---------- Ekonomi ---------- */
  // Yol tecrübesi: binilmeyen araçlar da hızlarının bu kadarını yolculuğa katar.
  // Böylece yeni araç almak hızı hiç düşürmez, eski araçlara yapılan yükseltmeler de boşa gitmez.
  const CONVOY = 0.5;
  const Econ = {
    vehicleMult(lvl) {
      let m = 1 + 0.25 * lvl;
      for (const t of [10, 25, 50, 100, 150, 200]) if (lvl >= t) m *= 2;
      return m;
    },
    upgradeCost(v, lvl) { return Math.ceil(v.upBase * Math.pow(1.55, lvl)); },
    // n seviyenin toplam maliyeti; n = 'max' ise bütçenin yettiği kadar (en az 1 seviye gösterilir)
    upgradeQuote(v, lvl, n, budget) {
      let cost = 0, k = 0;
      const limit = n === 'max' ? 1000 : n;
      while (k < limit) {
        const c = Econ.upgradeCost(v, lvl + k);
        if (n === 'max' && k > 0 && cost + c > budget) break;
        cost += c; k++;
      }
      return { n: k, cost };
    },
    buffCost(b, lvl) { return Math.ceil(b.base * Math.pow(b.growth, lvl)); },
    discoveryMult(regionIdx) { return 1 + 0.06 * regionIdx; },
    memoryGain(dist) { return dist < HOME.min ? 0 : Math.floor(HOME.per * Math.pow(dist / HOME.unit, HOME.exp) + 1e-9); },
    // Bir sonraki hatıra için gereken yolculuk mesafesi
    memoryNext(dist) {
      const g = Econ.memoryGain(dist);
      return g === 0 ? HOME.min : HOME.unit * Math.pow((g + 1) / HOME.per, 1 / HOME.exp);
    },
    memoryMult(memories) { return 1 + HOME.bonus * (memories || 0); },
    rhythmCap(lvl) { return 0.5 + 0.1 * lvl; },
    offlineRate(lvl) { return Math.min(0.9, 0.3 + 0.06 * lvl); },
    offlineCapHours(lvl) { return 8 + 2 * lvl; },
    luckChance(lvl) { return 0.01 * lvl; },
    luckMult: 5, // şanslı adım kaç kat uzun
    badgeMult(state) { return 1 + BADGE_BONUS * Object.keys(state.badges || {}).length; },
    // Hızı belirleyen araç: garajdaki en güçlü araç. Hangi araca binildiği yalnızca görünümü değiştirir.
    lead(state) {
      let best = null, bestIdle = -1;
      for (const v of VEHICLES) {
        if (!state.owned[v.id]) continue;
        const idle = v.idle * Econ.vehicleMult(state.levels[v.id] || 0);
        if (idle > bestIdle) { best = v.id; bestIdle = idle; }
      }
      return best || 'walk';
    },
    // Bir aracın tek başına hızı (yol tecrübesi ve geçici etkiler hariç); garaj kartlarında gösterilir.
    own(state, id) {
      const v = VEH[id], m = Econ.vehicleMult(state.levels[id] || 0) * Econ.discoveryMult(state.regionIdx) * Econ.memoryMult(state.memories);
      return { idle: v.idle * m * (1 + 0.25 * state.buffs.breeze), click: v.click * m * (1 + 0.2 * state.buffs.stride) };
    },
    // Kalıcı değerler (geçici kelebek etkileri hariç). convoy: diğer araçlardan gelen yol tecrübesi payı.
    base(state) {
      const b = state.buffs, lead = Econ.lead(state);
      let idle = 0, click = 0, cIdle = 0;
      for (const v of VEHICLES) {
        if (!state.owned[v.id]) continue;
        const m = Econ.vehicleMult(state.levels[v.id] || 0) * (v.id === lead ? 1 : CONVOY);
        idle += v.idle * m; click += v.click * m;
        if (v.id !== lead) cIdle += v.idle * m;
      }
      const d = Econ.discoveryMult(state.regionIdx) * Econ.memoryMult(state.memories), bi = 1 + 0.25 * b.breeze;
      return {
        idle: idle * d * bi,
        click: click * d * (1 + 0.2 * b.stride),
        cpm: (1 + 0.25 * b.postcard) * (1 + 0.1 * (b.pal || 0)) * Econ.badgeMult(state),
        convoy: cIdle * d * bi,
      };
    },
  };

  /* ---------- Biçimlendirme (seçili dile ve birim sistemine göre) ---------- */
  const L = () => (root.IT && root.IT.langDef ? root.IT.langDef() : null);
  const loc = () => (root.IT && root.IT.locale ? root.IT.locale() : 'tr-TR');
  const imperial = () => !!(root.IT && root.IT.units && root.IT.units() === 'imperial');
  const unit = k => { const d = L(); return (d && d.units && d.units[k]) || k; };
  const NF = {};
  function nf(digits) {
    const key = loc() + digits;
    return NF[key] || (NF[key] = new Intl.NumberFormat(loc(), { minimumFractionDigits: digits, maximumFractionDigits: digits }));
  }
  const DEFAULT_SUFFIX = ['M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  function fmtNum(n) {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + fmtNum(-n);
    const suf = (L() && L().suffixes) || DEFAULT_SUFFIX;
    if (n >= Math.pow(10, 6 + 3 * suf.length)) return n.toExponential(2).replace('.', nf(1).format(1.5).charAt(1));
    for (let i = suf.length - 1; i >= 0; i--) {
      const v = Math.pow(10, 6 + 3 * i);
      if (n < v) continue;
      const x = n / v;
      return (x >= 100 ? nf(0).format(Math.floor(x)) : x >= 10 ? nf(1).format(Math.floor(x * 10) / 10) : nf(2).format(Math.floor(x * 100) / 100)) + ' ' + suf[i];
    }
    return nf(0).format(Math.floor(n));
  }
  function fmtSmall(n) { // küçük değerlerde ondalık göster
    if (n < 10) return nf(1).format(n);
    return fmtNum(n);
  }
  // Yüzde: dile göre işaret yeri değişir (%25, 25%, 25 %)
  const PF = {};
  function fmtPct(n) {
    const key = loc();
    const f = PF[key] || (PF[key] = new Intl.NumberFormat(loc(), { style: 'percent', maximumFractionDigits: 1 }));
    return f.format(n / 100);
  }
  function fmtHours(h) { return T('unit.hours', { n: h }); }
  const AU = 1.496e11, LY = 9.4607e15, MI = 1609.344, YD = 0.9144;
  function fmtDist(m) {
    if (imperial()) {
      if (m < MI) return nf(0).format(Math.floor(m / YD)) + ' ' + unit('yd');
      const mi = m / MI;
      if (mi < 100) return nf(2).format(Math.floor(mi * 100) / 100) + ' ' + unit('mi');
      if (m < 1e9) return nf(0).format(Math.floor(mi)) + ' ' + unit('mi');
      if (m < 0.5 * AU) return fmtNum(mi) + ' ' + unit('mi');
    } else {
      if (m < 1000) return nf(0).format(Math.floor(m)) + ' ' + unit('m');
      if (m < 1e5) return nf(2).format(Math.floor(m / 10) / 100) + ' ' + unit('km');
      if (m < 1e9) return nf(0).format(Math.floor(m / 1000)) + ' ' + unit('km');
      if (m < 0.5 * AU) return fmtNum(m / 1000) + ' ' + unit('km');
    }
    if (m < 0.1 * LY) return nf(2).format(m / AU) + ' ' + unit('au');
    return nf(2).format(m / LY) + ' ' + unit('ly');
  }
  // Tıklama başına mesafe gibi küçük kazançlar
  function fmtGain(m) {
    const u = imperial() ? m / YD : m, lim = imperial() ? MI / YD : 1000, k = imperial() ? 'yd' : 'm';
    if (u < 10) return nf(1).format(u) + ' ' + unit(k);
    if (u < lim) return nf(0).format(Math.floor(u)) + ' ' + unit(k);
    return fmtDist(m);
  }
  function fmtSpeed(ms) {
    const v = imperial() ? ms * 3600 / MI : ms * 3.6, k = imperial() ? 'mph' : 'kmh';
    return (v < 100 ? nf(1).format(v) : fmtNum(v)) + ' ' + unit(k);
  }
  function fmtDuration(sec) {
    sec = Math.floor(sec);
    const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    const u = k => ' ' + unit(k);
    if (d) return `${d}${u('d')} ${h}${u('h')}`;
    if (h) return `${h}${u('h')} ${m}${u('min')}`;
    if (m) return `${m}${u('min')} ${s}${u('s')}`;
    return `${s}${u('s')}`;
  }

  root.IT = Object.assign(root.IT || {}, {
    VEHICLES, VEH, BUFFS, BUFF, BIOMES, REGIONS, MILESTONES, BADGES, BADGE_BONUS, CONVOY, HOME, regionAt, regionIndexFor, Econ,
    fmtNum, fmtSmall, fmtDist, fmtGain, fmtSpeed, fmtDuration, fmtPct, fmtHours,
  });
})(typeof window !== 'undefined' ? window : globalThis);
