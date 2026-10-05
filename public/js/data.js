/* Idle Traveler — oyun verisi, ekonomi formülleri ve biçimlendirme yardımcıları.
   Tarayıcıda window.IT altında, Node'da (denge simülasyonu için) globalThis.IT altında yayınlanır. */
(function (root) {
  'use strict';
  // Çeviri: tarayıcıda IT.t, Node'daki denge simülasyonunda anahtarın kendisi
  const T = (k, v) => (root.IT && root.IT.t ? root.IT.t(k, v) : k);


  /* ---------- Araçlar ---------- */
  // idle: otomatik hız (m/sn), click: tıklama başına mesafe (m), alt: kameranın yükseldiği irtifa (0 = yer)
  // (v1.11'de bütün mesafeler 1/10'a indi; metre başına kredi CREDITS_PER_M ile 10 katına çıktığı için tempo aynı kaldı)
  const VEHICLES = [
    { id: 'walk',   cost: 0,       idle: 0.035,  click: 0.04,   road: 'path',    alt: 0 },
    { id: 'skates', cost: 150,     idle: 0.15,   click: 0.125,   road: 'path',    alt: 0 },
    { id: 'board',  cost: 900,     idle: 0.3,     click: 0.22,   road: 'path',    alt: 0 },
    { id: 'bike',   cost: 5000,    idle: 0.6,     click: 0.4,     road: 'path',    alt: 0 },
    { id: 'horse',  cost: 3.2e4,   idle: 1.2,    click: 0.75,   road: 'path',    alt: 0 },
    { id: 'moto',   cost: 2.0e5,   idle: 2.4,    click: 1.4,    road: 'asphalt', alt: 0 },
    { id: 'car',    cost: 8.0e6,   idle: 9.5,    click: 5,   road: 'asphalt', alt: 0 },
    { id: 'van',    cost: 4.0e7,   idle: 19,   click: 9.5,    road: 'asphalt', alt: 0 },
    { id: 'train',  cost: 2.0e8,   idle: 38,   click: 19,   road: 'rail',    alt: 0 },
    { id: 'balloon', cost: 9.0e8, idle: 87, click: 41,   road: 'asphalt', alt: 0.4 },
    { id: 'plane',  cost: 4.0e9,   idle: 200,  click: 90,  road: 'asphalt', alt: 0.55 },
    { id: 'jet',    cost: 2.0e10, idle: 450,  click: 190,  road: 'asphalt', alt: 0.55 },
    { id: 'rocket', cost: 1.0e11,  idle: 1000, click: 400,  road: 'asphalt', alt: 1 },
    { id: 'sail',   cost: 2.5e12,  idle: 5000, click: 2000, road: 'asphalt', alt: 1.15 },
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
    // Yol arkadaşı Karabaş: 10 seviye, eve dönüşte de kalır; 2, 4, 7 ve 10. seviyede görünümü gelişir
    { id: 'pal',      base: 2500, growth: 3.2, max: 10,  vals: l => ({ p: fmtPct(Econ.palBonus(l) * 100) }),   step: () => ({}) },
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

  /* ---------- Gün döngüsü: her bölgenin mevsimi ---------- */
  // day: günün aydınlık payı (yazın geceler kısa, kışın uzun). dusk: alacakaranlığın hızı
  // (artı: çölde olduğu gibi hızlı gün batımı, eksi: kuzeyde olduğu gibi uzun, yavaş alacakaranlık).
  const SEASON_DAY = { spring: 0.56, summer: 0.68, autumn: 0.44, winter: 0.32 };
  const BIOME_SEASON = {
    meadow: ['spring', 0], lavender: ['summer', 0], pine: ['spring', -0.15], wheat: ['summer', 0], coast: ['summer', 0.1],
    canyon: ['summer', 0.35], sakura: ['spring', 0], autumn: ['autumn', -0.1], desert: ['summer', 0.45],
    snow: ['winter', -0.4], aurora: ['winter', -0.6, 0.24], tea: ['summer', 0], cappadocia: ['autumn', 0.2],
    tulip: ['spring', 0], olive: ['autumn', 0.1],
  };
  for (const [id, [season, dusk, day]] of Object.entries(BIOME_SEASON)) Object.assign(BIOMES[id], { season, dusk, day: day || SEASON_DAY[season] });

  /* ---------- Bölgeler: geometrik olarak uzayan eşikler ---------- */
  const REGIONS = [
    { biome: 'meadow',     at: 0 },
    { biome: 'lavender',   at: 25 },
    { biome: 'pine',       at: 150 },
    { biome: 'wheat',      at: 700 },
    { biome: 'coast',      at: 3000 },
    { biome: 'canyon',     at: 12000 },
    { biome: 'sakura',     at: 50000 },
    { biome: 'autumn',     at: 200000 },
    { biome: 'desert',     at: 800000 },
    { biome: 'snow',       at: 3.2e6 },
    { biome: 'aurora',     at: 1.3e7 },
    { biome: 'tea',        at: 5e7 },
    { biome: 'cappadocia', at: 2e8 },
    { biome: 'tulip',      at: 6e8 },
    { biome: 'olive',      at: 1.8e9 },
  ];
  REGIONS.forEach((r, i) => Object.defineProperty(r, 'name', { get: () => T(`region.${i}`) }));

  /* ---------- Seyahat rotaları ----------
     Her eve dönüş yeni bir rota açar. Rotalar aynı mesafe eşiklerini kullanır (tempo değişmez) ama bölgeleri
     farklı sırayla gezer; her rotanın küçük bir ayrıcalığı var. Bölge adı bölgenin biyomundan gelir. */
  const NAME_OF = Object.fromEntries(REGIONS.map((r, i) => [r.biome, i]));
  const ROUTES = [
    { id: 'anatolia', perk: null,        biomes: REGIONS.map(r => r.biome) },
    { id: 'coast',    perk: 'rain',      biomes: ['meadow', 'coast', 'olive', 'tulip', 'lavender', 'sakura', 'wheat', 'tea', 'canyon', 'cappadocia', 'autumn', 'pine', 'desert', 'snow', 'aurora'] },
    { id: 'north',    perk: 'stars',     biomes: ['meadow', 'pine', 'autumn', 'tea', 'snow', 'aurora', 'lavender', 'wheat', 'coast', 'olive', 'tulip', 'sakura', 'canyon', 'cappadocia', 'desert'] },
    { id: 'bloom',    perk: 'butterfly', biomes: ['meadow', 'lavender', 'tulip', 'sakura', 'tea', 'olive', 'wheat', 'autumn', 'coast', 'pine', 'cappadocia', 'canyon', 'desert', 'snow', 'aurora'] },
    { id: 'silk',     perk: 'gold',      biomes: ['meadow', 'wheat', 'cappadocia', 'canyon', 'desert', 'olive', 'coast', 'tea', 'sakura', 'lavender', 'tulip', 'autumn', 'pine', 'snow', 'aurora'] },
  ];
  ROUTES.forEach(rt => {
    Object.defineProperties(rt, { name: { get: () => T(`route.${rt.id}.name`) }, perkText: { get: () => T(`route.${rt.id}.perk`) } });
    rt.regions = rt.biomes.map((biome, i) => { const r = { biome, at: REGIONS[i].at }; Object.defineProperty(r, 'name', { get: () => T(`region.${NAME_OF[biome]}`) }); return r; });
  });
  const ROUTE = Object.fromEntries(ROUTES.map(r => [r.id, r]));
  let route = ROUTES[0];
  function setRoute(id) { route = ROUTE[id] || ROUTES[0]; }
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  // Liste bitince bölgeler ikinci tura girer; her yeni bölge öncekinin bu kadar katı uzakta.
  // (4 kat, son araçtan sonra hız artışı yetişemediği için yolu fiilen durduruyordu.)
  const LOOP_GROWTH = 3;
  function regionAt(i) {
    const list = route.regions;
    if (i < list.length) return list[i];
    const loop = list.length - 1;
    const k = i - list.length;
    const base = list[(k % loop) + 1];
    const lap = Math.floor(k / loop) + 2;
    return { get name() { return `${base.name} ${ROMAN[lap] || lap}`; }, biome: base.biome, at: REGIONS[REGIONS.length - 1].at * Math.pow(LOOP_GROWTH, k + 1) };
  }
  function regionIndexFor(dist) {
    let i = 0;
    while (regionAt(i + 1).at <= dist) i++;
    return i;
  }

  /* ---------- Gerçek dünyadan mesafe durakları ---------- */
  // key: çeviri anahtarı (ms.<key>). Sonradan eklenen duraklar sıra numarası yerine adla anılır.
  const MILESTONES = [
    { at: 10, key: 'door' },
    { at: 100 },
    { at: 400, key: 'track' },
    { at: 1000 },
    { at: 5000 },
    { at: 21097 },
    { at: 42195 },
    { at: 1.0e5, key: 'ultra' },
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
  { let n = 0; MILESTONES.forEach(m => { const k = m.key || n++; Object.defineProperty(m, 'name', { get: () => T(`ms.${k}`) }); }); }

  /* ---------- Rozetler: her ailenin 8 kademesi (plastikten elmasa) ---------- */
  // Her kademe kalıcı kredi bonusu verir; değerli kademeler daha çok. Bir ailenin bütün kademeleri: +%10.
  // Yeni kademe eklemek için TIERS'e bir satır ve her ailenin at listesine bir eşik ekle.
  const TIERS = [
    { id: 'plastic', bonus: 0.005, c1: '#f4f7fb', c2: '#9fb6cf', ink: '#33465c' },
    { id: 'wood',    bonus: 0.005, c1: '#e8bd86', c2: '#93592c', ink: '#3f230d' },
    { id: 'metal',   bonus: 0.01,  c1: '#e3e7ec', c2: '#6f7883', ink: '#262b31' },
    { id: 'bronze',  bonus: 0.01,  c1: '#f6c597', c2: '#a35d27', ink: '#45210a' },
    { id: 'silver',  bonus: 0.015, c1: '#ffffff', c2: '#a9b3c1', ink: '#363d4a' },
    { id: 'gold',    bonus: 0.015, c1: '#fff1c2', c2: '#d99a2b', ink: '#6a4510' },
    { id: 'platinum', bonus: 0.02, c1: '#fbfaff', c2: '#9b97cf', ink: '#2c2a52' },
    { id: 'diamond', bonus: 0.02,  c1: '#f2feff', c2: '#6cc9e4', ink: '#174d5e' },
  ];
  TIERS.forEach(x => Object.defineProperty(x, 'name', { get: () => T(`tier.${x.id}`) }));
  // at: her kademenin eşiği; stat: oyuncunun ömür boyu değeri; fmt: açıklamadaki biçim
  const lifeDist = s => Math.max((s.lifeDist || 0) + (s.distance || 0), s.legacyDist || 0);
  const BADGES = [
    { id: 'steps',     at: [50, 250, 1000, 5000, 20000, 50000, 100000, 250000], stat: s => s.clicks },
    { id: 'rhythm',    at: [10, 20, 30, 50, 75, 100, 150, 250],               stat: s => s.bestCombo },
    { id: 'lucky',     at: [1, 10, 50, 150, 400, 1000, 2500, 6000],            stat: s => s.crits },
    { id: 'butterfly', at: [1, 5, 15, 40, 100, 250, 500, 1000],                stat: s => s.gifts },
    { id: 'rainbow',   at: [1, 3, 8, 20, 50, 100, 200, 400],                  stat: s => s.rainbows },
    { id: 'night',     at: [5, 10, 30, 60, 180, 600, 1440, 4320],              stat: s => (s.nightTime || 0) / 60 },
    { id: 'region',    at: [3, 5, 8, 11, 15, 21, 31, 45],                    stat: s => Math.max(s.bestRegion || 0, s.regionIdx || 0) + 1 },
    { id: 'dist',      at: [5000, 42195, 1e6, 4.0075e7, 3.844e8, 1.496e11, 4.5e12, 9.4607e15], stat: lifeDist, fmt: 'dist' },
    { id: 'garage',    at: [2, 4, 6, 8, 10, 12, 13, 14],                     stat: s => Math.max(s.bestGarage || 0, VEHICLES.filter(v => s.owned && s.owned[v.id]).length) },
    { id: 'tuned',     at: [10, 25, 50, 100, 150, 200, 300, 500],             stat: s => Math.max(s.bestLevel || 0, ...Object.values(s.levels || {})) },
    { id: 'home',      at: [1, 2, 3, 5, 8, 12, 20, 30],                      stat: s => s.trips },
    { id: 'memory',    at: [10, 30, 100, 300, 1000, 3000, 10000, 30000],        stat: s => s.memories },
    { id: 'photo',     at: [1, 3, 10, 25, 50, 100, 250, 500],                 stat: s => s.photos },
    { id: 'wish',      at: [1, 3, 10, 25, 50, 100, 200, 400],                 stat: s => s.wishes },
    { id: 'streak',    at: [2, 3, 5, 7, 14, 30, 60, 100],                     stat: s => s.day ? s.day.best : 0 },
  ];
  BADGES.forEach(b => {
    Object.defineProperty(b, 'name', { get: () => T(`badge.${b.id}.name`) });
    // kademe k'nin (0'dan) hedefi
    b.desc = k => { const n = b.at[Math.min(k, b.at.length - 1)]; return T(`badge.${b.id}.desc`, { n, v: b.fmt === 'dist' ? fmtDist(n) : fmtNum(n) }); };
    // durumun hak ettiği kademe sayısı (0..7)
    b.tierFor = s => { const v = +b.stat(s) || 0; let k = 0; while (k < b.at.length && v >= b.at[k]) k++; return k; };
  });
  const BADGE_TIERS = BADGES.length * TIERS.length;
  // Kazanılmış kademe sayısı ve toplam kredi bonusu
  const badgeCount = state => BADGES.reduce((a, b) => a + ((state.badges || {})[b.id] || 0), 0);
  const badgeBonus = state => BADGES.reduce((a, b) => { const k = (state.badges || {})[b.id] || 0; for (let i = 0; i < k; i++) a += TIERS[i].bonus; return a; }, 0);

  /* ---------- Yolcunun kıyafetleri: rozet topladıkça açılır ---------- */
  // need: gereken rozet kademesi sayısı. Ceket rengi araçların vurgu renklerinde de kullanılır.
  const OUTFITS = [
    { id: 'classic',  need: 0,  jacket: '#e7694e', jacketDark: '#c9553d', hat: '#2f9e8f', hatDark: '#237c70', pack: '#f0b445' },
    { id: 'sky',      need: 3,  jacket: '#4f8fd6', jacketDark: '#3b73b4', hat: '#f0b445', hatDark: '#c99330', pack: '#e7694e' },
    { id: 'forest',   need: 8,  jacket: '#4c9a5f', jacketDark: '#3a7a4a', hat: '#c9553d', hatDark: '#a3402d', pack: '#e9d3a1' },
    { id: 'lavender', need: 15, jacket: '#9a7fe0', jacketDark: '#7b62bf', hat: '#ffd56b', hatDark: '#d9b24c', pack: '#6fd3c1' },
    { id: 'sunset',   need: 25, jacket: '#f2a03d', jacketDark: '#cf8228', hat: '#7b4fa8', hatDark: '#5f3b85', pack: '#2f9e8f' },
    { id: 'night',    need: 40, jacket: '#3d4380', jacketDark: '#2b2f5e', hat: '#ffd56b', hatDark: '#d9b24c', pack: '#cfe0ff' },
    { id: 'gold',     need: 60, jacket: '#e8b93c', jacketDark: '#c4962a', hat: '#fbf4e6', hatDark: '#d9cfbb', pack: '#c9553d' },
  ];
  OUTFITS.forEach(o => Object.defineProperty(o, 'name', { get: () => T(`outfit.${o.id}`) }));
  const OUTFIT = Object.fromEntries(OUTFITS.map(o => [o.id, o]));

  /* ---------- Eve dönüş ve hatıralar ---------- */
  // Uzun bir yolculuğun sonunda eve dönülür: araçlar, yükseltmeler, güçlendirmeler ve kredi sıfırlanır.
  // Yolculuğun uzunluğuna göre hatıra kazanılır; her hatıra sonraki yolculuklarda kalıcı hız verir.
  const HOME = { min: 5.0e7, unit: 1.0e8, per: 10, exp: 1 / 3, bonus: 0.1 };

  /* ---------- Ekonomi ---------- */
  // Yol tecrübesi: binilmeyen araçlar da hızlarının bu kadarını yolculuğa katar.
  // Böylece yeni araç almak hızı hiç düşürmez, eski araçlara yapılan yükseltmeler de boşa gitmez.
  const CONVOY = 0.5;
  // Metre başına kredi. Mesafeler 1/10'a inince kredi kazanımı aynı kalsın diye 10.
  const CREDITS_PER_M = 10;
  // Sahnenin kayma hızı mesafe ölçeğinden bağımsız: eski görsel tempo korunur
  const SPEED_VIS = 10;
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
    // Aracın görsel aşaması: bu seviyelerde araç yeni bir parça kazanır (0–4)
    looks: [10, 25, 50, 100],
    lookTier(lvl) { return Econ.looks.filter(t => (lvl || 0) >= t).length; },
    // Yol arkadaşı: ilk seviye +%10 kredi, sonraki her seviye +%5; görünüm 2, 4, 7 ve 10. seviyede değişir
    palBonus(lvl) { return lvl > 0 ? 0.1 + 0.05 * (lvl - 1) : 0; },
    palLooks: [2, 4, 7, 10],
    palTier(lvl) { return Econ.palLooks.filter(t => (lvl || 0) >= t).length; },
    // Seçilebilir yol arkadaşları ve açıldıkları Yol Arkadaşı seviyesi
    pals: [{ id: 'dog', need: 1 }, { id: 'bird', need: 3 }, { id: 'cat', need: 5 }],
    badgeMult(state) { return 1 + badgeBonus(state); },
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
        cpm: CREDITS_PER_M * (1 + 0.25 * b.postcard) * (1 + Econ.palBonus(b.pal)) * Econ.badgeMult(state),
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
    // bir metreden (yarddan) kısa adımlar santimetre ya da inç olarak
    if (imperial() ? m < YD : m < 1) return imperial() ? nf(0).format(Math.max(1, Math.round(m / 0.0254))) + ' ' + unit('in') : nf(0).format(Math.max(1, Math.round(m * 100))) + ' ' + unit('cm');
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
    VEHICLES, VEH, BUFFS, BUFF, BIOMES, REGIONS, ROUTES, ROUTE, setRoute, getRoute: () => route, MILESTONES, BADGES, TIERS, BADGE_TIERS, badgeCount, badgeBonus, OUTFITS, OUTFIT, CONVOY, CREDITS_PER_M, SPEED_VIS, HOME, regionAt, regionIndexFor, Econ,
    fmtNum, fmtSmall, fmtDist, fmtGain, fmtSpeed, fmtDuration, fmtPct, fmtHours,
  });
})(typeof window !== 'undefined' ? window : globalThis);
