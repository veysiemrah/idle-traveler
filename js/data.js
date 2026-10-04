/* Idle Traveler — oyun verisi, ekonomi formülleri ve biçimlendirme yardımcıları.
   Tarayıcıda window.IT altında, Node'da (denge simülasyonu için) globalThis.IT altında yayınlanır. */
(function (root) {
  'use strict';

  /* ---------- Araçlar ---------- */
  // idle: otomatik hız (m/sn), click: tıklama başına mesafe (m), alt: kameranın yükseldiği irtifa (0 = yer)
  const VEHICLES = [
    { id: 'walk',   name: 'Yürüyüş',       cost: 0,       idle: 0.35,  click: 0.8,   upName: 'Rahat Ayakkabılar', road: 'path',    alt: 0,
      tagline: 'Sırt çantan ve iki ayağın. Her yolculuk böyle başlar.' },
    { id: 'skates', name: 'Paten',         cost: 150,     idle: 1.5,   click: 2.5,   upName: 'Bilyeli Rulmanlar', road: 'path',    alt: 0,
      tagline: 'Tekerlekler tıkırdıyor, rüzgâr yüzüne vuruyor.' },
    { id: 'bike',   name: 'Bisiklet',      cost: 5000,    idle: 6,     click: 8,     upName: 'Karbon Kadro',      road: 'path',    alt: 0,
      tagline: 'Pedal çevir, tepeler birer birer geride kalsın.' },
    { id: 'moto',   name: 'Motosiklet',    cost: 2.0e5,   idle: 24,    click: 28,    upName: 'Turbo Egzoz',       road: 'asphalt', alt: 0,
      tagline: 'Virajlar seni çağırıyor.' },
    { id: 'car',    name: 'Araba',         cost: 8.0e6,   idle: 95,    click: 100,   upName: 'V6 Motor',          road: 'asphalt', alt: 0,
      tagline: 'Camı aç, sevdiğin şarkıyı aç. Yol uzun.' },
    { id: 'train',  name: 'Tren',          cost: 2.0e8,   idle: 380,   click: 380,   upName: 'Manyetik Raylar',   road: 'rail',    alt: 0,
      tagline: 'Raylarda ritmik bir ninni, pencerede akan manzara.' },
    { id: 'plane',  name: 'Uçak',          cost: 4.0e9,   idle: 2000,  click: 1800,  upName: 'Jet Motorları',     road: 'asphalt', alt: 0.55,
      tagline: 'Bulutların arasından dünyaya yukarıdan bak.' },
    { id: 'rocket', name: 'Roket',         cost: 1.0e11,  idle: 10000, click: 8000,  upName: 'İyon İticiler',     road: 'asphalt', alt: 1,
      tagline: 'Gökyüzü artık bir sınır değil.' },
    { id: 'sail',   name: 'Güneş Yelkeni', cost: 2.5e12,  idle: 50000, click: 40000, upName: 'Foton Aynaları',    road: 'asphalt', alt: 1.15,
      tagline: 'Işığın kendisiyle yelken aç, yıldızlara doğru süzül.' },
  ];
  VEHICLES.forEach((v, i) => { v.index = i; v.upBase = i === 0 ? 8 : Math.round(v.cost * 0.05); });
  const VEH = Object.fromEntries(VEHICLES.map(v => [v.id, v]));

  /* ---------- Kalıcı güçlendirmeler ---------- */
  const BUFFS = [
    { id: 'stride',   name: 'Güçlü Adımlar',          base: 20,   growth: 2.2,
      desc: l => `Her tıklama %${25 * l} daha uzağa taşır.`, next: '+%25 tıklama mesafesi' },
    { id: 'breeze',   name: 'Arkadan Esen Rüzgâr',    base: 35,   growth: 2.2,
      desc: l => `Otomatik hız +%${25 * l}.`, next: '+%25 otomatik hız' },
    { id: 'postcard', name: 'Kartpostal Koleksiyonu', base: 120,  growth: 2.6,
      desc: l => `Metre başına kredi +%${25 * l}.`, next: '+%25 kredi' },
    { id: 'rhythm',   name: 'Yolun Ritmi',            base: 150,  growth: 3.0, max: 10,
      desc: l => `Seri tıklama bonusu en fazla %${Math.round((0.5 + 0.1 * l) * 100)}.`, next: '+%10 ritim tavanı' },
    { id: 'luck',     name: 'Şanslı Adım',            base: 250,  growth: 3.0, max: 10,
      desc: l => `Tıklamaların %${1.5 * l} ihtimalle 10 kat uzun.`, next: '+%1,5 şans' },
    { id: 'dream',    name: 'Rüyada Yolculuk',        base: 400,  growth: 2.4, max: 10,
      desc: l => `Oyun kapalıyken ilerleme hızı: otomatik hızın %${30 + 6 * l} kadarı.`, next: '+%6 çevrimdışı hız' },
    { id: 'camp',     name: 'Uzun Mola',              base: 600,  growth: 2.1, max: 20,
      desc: l => `Çevrimdışı ilerleme en fazla ${8 + 2 * l} saat sürer.`, next: '+2 saat çevrimdışı süre' },
    { id: 'butterfly', name: 'Kelebek Dostu',         base: 900,  growth: 2.5, max: 10,
      desc: l => `Altın kelebekler %${10 * l} daha sık gelir, etkileri %${15 * l} uzun sürer.`, next: 'daha sık kelebek' },
  ];
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
  };

  /* ---------- Bölgeler: geometrik olarak uzayan eşikler ---------- */
  const REGIONS = [
    { name: 'Sabah Köyü',          biome: 'meadow',     at: 0 },
    { name: 'Lavanta Tarlaları',   biome: 'lavender',   at: 250 },
    { name: 'Çam Ormanı',          biome: 'pine',       at: 1500 },
    { name: 'Altın Buğday Ovası',  biome: 'wheat',      at: 7000 },
    { name: 'Ege Sahil Yolu',      biome: 'coast',      at: 30000 },
    { name: 'Kızıl Kanyon',        biome: 'canyon',     at: 120000 },
    { name: 'Kiraz Çiçeği Vadisi', biome: 'sakura',     at: 500000 },
    { name: 'Sonbahar Korusu',     biome: 'autumn',     at: 2.0e6 },
    { name: 'Vaha Yolu',           biome: 'desert',     at: 8.0e6 },
    { name: 'Karlı Geçit',         biome: 'snow',       at: 3.2e7 },
    { name: 'Kuzey Işıkları',      biome: 'aurora',     at: 1.3e8 },
    { name: 'Rize Çay Bahçeleri',  biome: 'tea',        at: 5.0e8 },
    { name: 'Peri Bacaları',       biome: 'cappadocia', at: 2.0e9 },
  ];
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  function regionAt(i) {
    if (i < REGIONS.length) return REGIONS[i];
    const loop = REGIONS.length - 1;
    const k = i - REGIONS.length;
    const base = REGIONS[(k % loop) + 1];
    const lap = Math.floor(k / loop) + 2;
    return { name: `${base.name} ${ROMAN[lap] || lap}`, biome: base.biome, at: REGIONS[REGIONS.length - 1].at * Math.pow(4, k + 1) };
  }
  function regionIndexFor(dist) {
    let i = 0;
    while (regionAt(i + 1).at <= dist) i++;
    return i;
  }

  /* ---------- Gerçek dünyadan mesafe durakları ---------- */
  const MILESTONES = [
    { at: 100,      name: 'İlk yüz metre' },
    { at: 1000,     name: 'İlk kilometre' },
    { at: 5000,     name: 'Bir sabah koşusu' },
    { at: 21097,    name: 'Yarı maraton' },
    { at: 42195,    name: 'Maraton' },
    { at: 1.6e5,    name: 'İzmir – Çeşme, gidiş dönüş' },
    { at: 4.5e5,    name: 'İstanbul – Ankara' },
    { at: 1.0e6,    name: 'Bin kilometre' },
    { at: 1.7e6,    name: 'Edirne – Kars, boydan boya' },
    { at: 2.5e6,    name: 'İstanbul – Londra' },
    { at: 9.0e6,    name: 'İstanbul – Tokyo' },
    { at: 2.0e7,    name: 'Dünyanın yarısı' },
    { at: 4.0075e7, name: 'Dünya turu' },
    { at: 1.0e8,    name: 'Ekvatoru iki buçuk kez' },
    { at: 3.844e8,  name: "Ay'a varış" },
    { at: 7.688e8,  name: "Ay'a gidiş dönüş" },
    { at: 5.46e10,  name: "Mars'a en yakın an" },
    { at: 1.496e11, name: "Güneş'e kadar (1 AB)" },
    { at: 7.78e11,  name: "Jüpiter'in yörüngesi" },
    { at: 4.5e12,   name: "Neptün'ün yörüngesi" },
    { at: 2.5e13,   name: "Voyager 1'in izinde" },
    { at: 9.46e15,  name: 'Bir ışık yılı' },
    { at: 4.01e16,  name: 'Proxima Centauri' },
  ];

  /* ---------- Ekonomi ---------- */
  const Econ = {
    vehicleMult(lvl) {
      let m = 1 + 0.25 * lvl;
      for (const t of [10, 25, 50, 100, 150, 200]) if (lvl >= t) m *= 2;
      return m;
    },
    upgradeCost(v, lvl) { return Math.ceil(v.upBase * Math.pow(1.55, lvl)); },
    buffCost(b, lvl) { return Math.ceil(b.base * Math.pow(b.growth, lvl)); },
    discoveryMult(regionIdx) { return 1 + 0.06 * regionIdx; },
    rhythmCap(lvl) { return 0.5 + 0.1 * lvl; },
    offlineRate(lvl) { return Math.min(0.9, 0.3 + 0.06 * lvl); },
    offlineCapHours(lvl) { return 8 + 2 * lvl; },
    luckChance(lvl) { return 0.015 * lvl; },
    // Kalıcı değerler (geçici kelebek etkileri hariç)
    base(state) {
      const v = VEH[state.active];
      const b = state.buffs;
      const vm = Econ.vehicleMult(state.levels[v.id] || 0) * Econ.discoveryMult(state.regionIdx);
      return {
        idle: v.idle * vm * (1 + 0.25 * b.breeze),
        click: v.click * vm * (1 + 0.25 * b.stride),
        cpm: 1 + 0.25 * b.postcard,
      };
    },
  };

  /* ---------- Biçimlendirme (tr-TR) ---------- */
  const nf0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const SUFFIX = [[1e21, 'Sk'], [1e18, 'Kn'], [1e15, 'Ka'], [1e12, 'Tn'], [1e9, 'Mr'], [1e6, 'Mn']];
  function fmtNum(n) {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + fmtNum(-n);
    if (n >= 1e24) return n.toExponential(2).replace('.', ',');
    for (const [v, s] of SUFFIX) if (n >= v) {
      const x = n / v;
      return (x >= 100 ? nf0.format(x) : x >= 10 ? nf1.format(Math.floor(x * 10) / 10) : nf2.format(Math.floor(x * 100) / 100)) + ' ' + s;
    }
    return nf0.format(Math.floor(n));
  }
  function fmtSmall(n) { // tıklama metinleri için: küçük değerlerde ondalık göster
    if (n < 10) return nf1.format(n);
    return fmtNum(n);
  }
  const AU = 1.496e11, LY = 9.4607e15;
  function fmtDist(m) {
    if (m < 1000) return nf0.format(Math.floor(m)) + ' m';
    if (m < 1e5) return nf2.format(Math.floor(m / 10) / 100) + ' km';
    if (m < 1e9) return nf0.format(Math.floor(m / 1000)) + ' km';
    if (m < 0.5 * AU) return fmtNum(m / 1000) + ' km';
    if (m < 0.1 * LY) return nf2.format(m / AU) + ' AB';
    return nf2.format(m / LY) + ' ışık yılı';
  }
  function fmtSpeed(ms) {
    const kmh = ms * 3.6;
    if (kmh < 100) return nf1.format(kmh) + ' km/sa';
    return fmtNum(kmh) + ' km/sa';
  }
  function fmtDuration(sec) {
    sec = Math.floor(sec);
    const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (d) return `${d} g ${h} sa`;
    if (h) return `${h} sa ${m} dk`;
    if (m) return `${m} dk ${s} sn`;
    return `${s} sn`;
  }

  root.IT = Object.assign(root.IT || {}, {
    VEHICLES, VEH, BUFFS, BUFF, BIOMES, REGIONS, MILESTONES, regionAt, regionIndexFor, Econ,
    fmtNum, fmtSmall, fmtDist, fmtSpeed, fmtDuration,
  });
})(typeof window !== 'undefined' ? window : globalThis);
