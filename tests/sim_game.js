// Olay düzeyinde oyun simülasyonu: oyundaki bütün kazanç kaynaklarını saniye saniye işler ve oyuncunun araçlara,
// özellikle son araca (Yıldız Gemisi) ne zaman ulaştığını bulur. Tek yolculuk; oyuncu eve dönmez.
//
// Hesaba katılanlar (game.js'teki kurallarla aynı):
//   tıklama ve Ritim bonusu (art arda 650 ms'den kısa aralıklı dokunuşlar), Şanslı Adım (×5), otomatik hız ve yol tecrübesi,
//   altın kelebekler (Rüzgâr Hortumu ×3 hız, Bereket ×2 kredi, Coşku ×5 tıklama, anında kredi; 5 dk'yı aşınca kat artar),
//   bahar yağmuru ve gökkuşağı (×10 hız), kayan yıldız (gece, ×10 kredi), karahindiba tohumu (gündüz, ×10 kredi), hazine haritası ve sandık, bölge ve durak ödülleri,
//   keşif bonusu (+%6/bölge), yadigârlar (+%2 hız), rozet kademeleri (kredi), yol arkadaşı, güçlendirmeler.
//   Yükseltme/araç/güçlendirme alımları: kredi başına en çok kalıcı gelir getiren alım (gerekirse ona biriktirir).
//
// Kullanım: node sim_game.js ['{"profile":"lucky","hours":24}']
//   profile: casual | active | lucky (aktif + şanslı) ya da ayrı ayrı: cps (dokunuş/sn), catch (yakalama olasılığı),
//   luck (her zar atışı iki denemenin iyisi), night (gecenin payı, kayan yıldız için), seed, hours, runs (tekrar sayısı)
const path = require('path');
require(path.resolve(__dirname, '../public/js/data.js'));
const IT = globalThis.IT; const { Econ, VEHICLES, BUFFS, BADGES, MILESTONES, KEEPSAKES } = IT;
const PROFILES = {
  casual: { cps: 0.3, catch: 0.5, luck: false },
  active: { cps: 2.5, catch: 1, luck: false },
  lucky: { cps: 2.5, catch: 1, luck: true },
};
const A = JSON.parse(process.argv[2] || '{}');
const P = Object.assign({ night: 0.44, hours: 24, runs: 5, seed: 1 }, PROFILES[A.profile || 'lucky'], A);

// game.js sabitleri
const GIFTS = [
  { id: 'gust', dur: 30, speed: 3, w: 3 }, { id: 'harvest', dur: 45, credit: 2, w: 3 }, { id: 'zeal', dur: 25, click: 5, w: 2 }, { id: 'postcard', instant: true, w: 2 },
];
const RAINBOW = { id: 'rainbow', dur: 20, speed: 10 }, WISH = { id: 'wish', dur: 20, credit: 10 }, SEED = { id: 'seed', dur: 20, credit: 10 };
// Gelire bağlı ödüllerin süresi (sn; game.js'teki REWARD ile aynı). Denemek için: '{"rw":{"chest":1800}}'
const RW = Object.assign({ region: 40, ms: 30, instant: 600, chest: 6000 }, A.rw || {});
const STACK_AFTER = 300, STACK_MAX = 10, MAP_DROP = { gift: 0.2, star: 0.5 };
const RAINY = { meadow: 1, lavender: 1, pine: 1, wheat: 1, coast: 1, sakura: 1, autumn: 1, tea: 1, tulip: 1, olive: 1 };

function run(seed) {
  let x = seed * 2654435761 >>> 0;
  const rnd0 = () => { x = (x + 0x6D2B79F5) >>> 0; let t = x; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  // şanslı oyuncu: "iyi" yöndeki zar iki denemenin iyisidir (good: küçük mü büyük mü iyi)
  const roll = (good) => { const a = rnd0(); if (!P.luck) return a; const b = rnd0(); return good === 'low' ? Math.min(a, b) : Math.max(a, b); };
  const s = { distance: 0, credits: 0, totalCredits: 0, clicks: 0, crits: 0, gifts: 0, rainbows: 0, nightTime: 0, photos: 0, wishes: 0, treasures: 0,
    bestCombo: 0, bestRegion: 0, bestGarage: 1, bestLevel: 0, legacyDist: 0, lifeDist: 0, trips: 0, memories: 0, day: { best: 0 }, keeps: {},
    owned: { walk: true }, levels: { walk: 0 }, buffs: Object.fromEntries(BUFFS.map(b => [b.id, 0])), regionIdx: 0, msIdx: 0, badges: {} };
  const fx = []; // { e, until, stack }
  const tempMult = t => { const m = { speed: 1, credit: 1, click: 1 }; for (const f of fx) if (f.until > t) { const n = f.stack; for (const k of ['speed', 'credit', 'click']) if (f.e[k]) m[k] *= 1 + (f.e[k] - 1) * n; } return m; };
  const addFx = (e, dur, t, stackable) => {
    const ex = fx.find(f => f.e.id === e.id && f.until > t);
    if (ex && stackable && ex.until - t > STACK_AFTER && ex.stack < STACK_MAX) { ex.stack++; return; }
    if (ex) ex.until += dur; else fx.push({ e, until: t + dur, stack: 1 });
  };
  // dokunuş ritmi: aralık 650 ms'den kısaysa kombo büyür (en çok 20), değilse yarıya iner
  const interval = 1 / P.cps, combo = interval < 0.65 ? 20 : 1;
  const comboMult = () => 1 + Econ.rhythmCap(s.buffs.rhythm) * Math.min(combo, 20) / 20;
  const critEV = () => 1 + (Econ.luckMult - 1) * (P.luck ? 1 - Math.pow(1 - Econ.luckChance(s.buffs.luck), 2) : Econ.luckChance(s.buffs.luck));
  // kalıcı gelir (alım kararları için): otomatik + dokunuş (ritim ve şans beklentisiyle)
  const inc = st => { const b = Econ.base(st); return (b.idle + b.click * P.cps * (1 + Econ.rhythmCap(st.buffs.rhythm) * Math.min(combo, 20) / 20) * critEV()) * b.cpm; };
  const clone = st => ({ ...st, owned: { ...st.owned }, levels: { ...st.levels }, buffs: { ...st.buffs }, keeps: { ...st.keeps }, badges: { ...st.badges } });
  let rate = 0; // son gelir (kredi/sn), ödüller buna göre ölçeklenir
  const income = () => { const b = Econ.base(s); return Math.max(rate, b.idle * b.cpm); };
  const grant = c => { s.credits += c; s.totalCredits += c; };
  const reached = {}; let goal = null;
  // olay zamanlayıcıları (game.js'teki aralıklar; şanslı oyuncuda kısa ucu)
  let giftIn = 25, starIn = 20 + roll('low') * 25, weatherIn = 150 + roll('low') * 120, seedIn = 40 + roll('low') * 40, rain = 0, chestIn = Infinity, keepIn = 45 + roll('low') * 40, keepBiome = 'meadow';
  const T = P.hours * 3600;
  for (let t = 0; t < T; t++) {
    const night = (t % 600) / 600 >= 1 - P.night; // 10 dakikalık gün döngüsü
    const m = tempMult(t), b = Econ.base(s);
    const dIdle = b.idle * m.speed, dClick = b.click * m.speed * m.click * comboMult() * critEV() * P.cps;
    const d = dIdle + dClick, c = d * b.cpm * m.credit;
    // ödüller kalıcı gelirle ölçeklenir (v1.37): geçici kelebek, gökkuşağı ve dilek çarpanları sayılmaz
    s.distance += d; grant(c); rate = (b.idle + b.click * comboMult() * critEV() * P.cps) * b.cpm; s.clicks += P.cps; s.crits += P.cps * (critEV() - 1) / (Econ.luckMult - 1);
    s.bestCombo = Math.max(s.bestCombo, combo); if (night) s.nightTime++;
    // bölgeler, duraklar, yadigârlar
    const ri = IT.regionIndexFor(s.distance);
    while (s.regionIdx < ri) { s.regionIdx++; s.bestRegion = s.regionIdx; grant(Math.max(20, income() * RW.region)); }
    while (s.msIdx < MILESTONES.length && s.distance >= MILESTONES[s.msIdx].at) { s.msIdx++; grant(Math.max(15, income() * RW.ms)); }
    const biome = IT.regionAt(s.regionIdx).biome;
    if (biome !== keepBiome) { keepBiome = biome; keepIn = 45 + roll('low') * 40; }
    if (!s.keeps[biome] && --keepIn <= 0) { if (rnd0() < P.catch) s.keeps[biome] = 1; keepIn = 80 + roll('low') * 70; }
    // altın kelebek
    if (--giftIn <= 0) {
      giftIn = (40 + roll('low') * 45) / (1 + 0.1 * s.buffs.butterfly);
      if (rnd0() < P.catch) {
        s.gifts++;
        if (s.mapPieces === undefined) s.mapPieces = 0;
        if (s.mapPieces < 4 && roll('low') < MAP_DROP.gift) { s.mapPieces++; if (s.mapPieces === 4) chestIn = t + 4; }
        // tür: ağırlıklı seçim; şanslı oyuncu iki denemeden o an daha değerli olanı alır
        const pick = () => { let r = rnd0() * 10; for (const g of GIFTS) { r -= g.w; if (r <= 0) return g; } return GIFTS[0]; };
        // etkinin süresi boyunca getirdiği ek kredi: hız ve kredi bütün geliri, Coşku yalnızca dokunuşların payını büyütür
        const value = g => g.instant ? Math.max(40, income() * RW.instant)
          : g.dur * (1 + 0.15 * s.buffs.butterfly) * income() * (g.click ? (dClick / d) * (g.click - 1) : (g.speed || g.credit) - 1);
        let g = pick(); if (P.luck) { const h = pick(); if (value(h) > value(g)) g = h; }
        if (g.instant) grant(Math.max(40, income() * RW.instant)); else addFx(g, g.dur * (1 + 0.15 * s.buffs.butterfly), t, true);
      }
    }
    // yağmur ve gökkuşağı (gökkuşağı yalnızca gündüz)
    if (rain > 0) {
      if (--rain === 0 && !night && RAINY[biome]) { addFx(RAINBOW, RAINBOW.dur, t, false); s.rainbows++; }
    } else if (--weatherIn <= 0) { weatherIn = 360 + roll('low') * 360; if (RAINY[biome]) rain = Math.round(30 + rnd0() * 15); }
    // kayan yıldız: yalnızca gece ve yağmursuz gökyüzü
    if (night && rain === 0 && --starIn <= 0) {
      starIn = 50 + roll('low') * 70;
      if (rnd0() < P.catch) {
        s.wishes++; addFx(WISH, WISH.dur, t, false);
        if (s.mapPieces === undefined) s.mapPieces = 0;
        if (s.mapPieces < 4 && roll('low') < MAP_DROP.star) { s.mapPieces++; if (s.mapPieces === 4) chestIn = t + 4; }
      }
    }
    // karahindiba tohumu (v1.31): yalnızca gündüz ve yağmursuz gökyüzü; kayan yıldızdan seyrek, aynı etki (kredi ×10, 20 sn)
    if (!night && rain === 0 && --seedIn <= 0) {
      seedIn = 80 + roll('low') * 110;
      if (rnd0() < P.catch) {
        s.wishes++; addFx(SEED, SEED.dur, t, false);
        if (s.mapPieces === undefined) s.mapPieces = 0;
        if (s.mapPieces < 4 && roll('low') < MAP_DROP.star) { s.mapPieces++; if (s.mapPieces === 4) chestIn = t + 4; }
      }
    }
    // hazine sandığı (harita tamamken; kaçırılırsa 45 sn sonra yeniden)
    if (t >= chestIn) { if (rnd0() < P.catch) { grant(Math.max(500, income() * RW.chest)); s.treasures++; s.mapPieces = 0; chestIn = Infinity; } else chestIn = t + 70; }
    // rozet kademeleri (kalıcı kredi bonusu)
    if (t % 10 === 0) for (const bd of BADGES) s.badges[bd.id] = Math.max(s.badges[bd.id] || 0, bd.tierFor(s));
    // alımlar
    for (let k = 0; k < 300; k++) {
      if (!goal) {
        const base = inc(s), opts = [];
        const nxt = VEHICLES.find(v => !s.owned[v.id]);
        if (nxt) opts.push({ c: nxt.cost, veh: nxt.id, f: st => { st.owned[nxt.id] = true; st.levels[nxt.id] = 0; } });
        for (const o of VEHICLES) if (s.owned[o.id]) opts.push({ c: Econ.upgradeCost(o, s.levels[o.id]), f: st => { st.levels[o.id]++; } });
        for (const bf of BUFFS) { const l = s.buffs[bf.id]; if (bf.max && l >= bf.max) continue; opts.push({ c: Econ.buffCost(bf, l), f: st => { st.buffs[bf.id]++; } }); }
        for (const o of opts) { const cl = clone(s); o.f(cl); o.v = (inc(cl) - base) / o.c; }
        // kalıcı geliri değiştirmeyen güçlendirmeler (kelebek, şans dışı) ucuzsa yine de alınır
        opts.sort((p, q) => q.v - p.v); goal = opts[0];
      }
      if (s.credits < goal.c) break;
      s.credits -= goal.c; goal.f(s);
      if (goal.veh) { reached[goal.veh] = t; s.bestGarage = Object.keys(s.owned).length; }
      for (const id in s.levels) s.bestLevel = Math.max(s.bestLevel, s.levels[id]);
      goal = null;
    }
    // iz: gelirin nereden geldiğini görmek için (P.trace: kaç saniyede bir yazılacağı, P.until: dakika)
    if (P.trace && t % P.trace === 0 && t <= (P.until || 15) * 60) {
      const lead = Econ.lead(s);
      console.log(`${(t / 60).toFixed(1)}dk kredi ${IT.fmtNum(s.credits)} gelir/sn ${IT.fmtNum(c)} | otomatik ${dIdle.toFixed(3)} dokunuş ${dClick.toFixed(3)} m/sn | geçici hız×${m.speed.toFixed(1)} kredi×${m.credit.toFixed(1)} dokunuş×${m.click.toFixed(1)} | ${lead}@${s.levels[lead]} | cpm ${b.cpm.toFixed(1)} rozet ${IT.badgeCount(s)} hazine ${s.treasures} bölge ${s.regionIdx + 1} güç ${JSON.stringify(s.buffs)}`);
    }
    if (P.growth || P.reach) (s.track || (s.track = [])).push(s.distance);
    if (reached[VEHICLES[VEHICLES.length - 1].id] !== undefined && !P.reach) break;
  }
  return { reached, dist: s.distance, region: s.regionIdx + 1, keeps: Object.keys(s.keeps).length, badges: IT.badgeCount(s), treasures: s.treasures, track: s.track };
}

// P.reach: en hızlı oyuncunun belli sürelerde ulaştığı en uzak yol (son araçtan sonra da sürer). Sunucudaki
// toplam yol sınırı (Worker LIFE_CAP) bu eğrinin güvenli bir katıdır: kaydın yaşına göre, sık istekle büyümez.
if (P.reach) {
  const runs = Array.from({ length: P.runs }, (_, i) => run(P.seed + i));
  for (const T of [60, 300, 900, 1800, 3600, 7200, 4 * 3600, 8 * 3600, 16 * 3600, 24 * 3600, 48 * 3600]) {
    const ds = runs.map(r => r.track[Math.min(T, r.track.length) - 1]).filter(x => x !== undefined);
    if (ds.length && T <= runs[0].track.length) console.log(`${String(T).padStart(6)} sn: en uzak ${Math.max(...ds).toExponential(3)} m`);
  }
  process.exit(0);
}
// P.growth: sunucudaki toplam yol sınırını ayarlamak için en büyük büyüme oranları.
// Her aralık (sn) için en büyük (yol(t+Δ) + A) / (yol(t) + A) oranı; A = 1 km (oyunun ilk saniyelerindeki sıfıra bölmeyi yumuşatır)
if (P.growth) {
  const runs = Array.from({ length: P.runs }, (_, i) => run(P.seed + i)), A = 1000;
  for (const D of [30, 120, 600, 1800, 3600, 4 * 3600, 8 * 3600]) {
    let worst = 0;
    for (const r of runs) for (let t = 0; t + D < r.track.length; t += 5) worst = Math.max(worst, (r.track[t + D] + A) / (r.track[t] + A));
    console.log(`Δ ${String(D).padStart(6)} sn: en büyük oran ×${worst.toExponential(2)}  (saniye başına e^${(Math.log(worst) / D).toFixed(4)})`);
  }
  process.exit(0);
}

const mins = v => (v === undefined ? '—' : (v / 60).toFixed(0));
const res = Array.from({ length: P.runs }, (_, i) => run(P.seed + i));
console.log(`profil: ${A.profile || 'lucky'} · ${P.cps} dokunuş/sn · yakalama %${Math.round(P.catch * 100)} · şans ${P.luck ? 'iki denemenin iyisi' : 'normal'} · gece payı %${Math.round(P.night * 100)} · ${P.runs} deneme`);
for (const v of VEHICLES.slice(1)) {
  const ts = res.map(r => r.reached[v.id]).filter(x => x !== undefined).sort((a, b) => a - b);
  if (!ts.length) { console.log(`${v.id.padEnd(8)} ${P.hours} saatte ulaşılamadı`); continue; }
  console.log(`${v.id.padEnd(8)} ortanca ${mins(ts[ts.length >> 1]).padStart(5)} dk  (en hızlı ${mins(ts[0])}, en yavaş ${mins(ts[ts.length - 1])}${ts.length < res.length ? `, ${res.length - ts.length} denemede ulaşılamadı` : ''})`);
}
const r0 = res[0];
console.log(`ilk deneme sonunda: ${IT.fmtDist(r0.dist)} · bölge ${r0.region} · yadigâr ${r0.keeps} · rozet kademesi ${r0.badges} · hazine ${r0.treasures}`);
