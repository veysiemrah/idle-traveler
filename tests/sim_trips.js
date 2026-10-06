// Art arda yolculuklar: verimli oyuncu (sim_switch ile aynı karar kuralı) eve dönüş açılınca hemen döner.
// Her yolculuğun süresini, mesafesini, kazanılan hatırayı ve yolculuk sonundaki aracı gösterir.
// Kullanım: node sim_trips.js [yolculuk sayısı] [tık/sn] ['{"grow":1.5}']
const trips = +(process.argv[2] || 8), cps = +(process.argv[3] || 0.5), P = JSON.parse(process.argv[4] || '{}');
require(require('path').resolve(__dirname, '../public/js/data.js')); const IT = globalThis.IT; const { Econ, VEHICLES, BUFFS, HOME } = IT;
if (P.grow) HOME.grow = P.grow;
const inc = st => { const b = Econ.base(st); return (b.idle + b.click * cps) * b.cpm; };
const clone = st => ({ ...st, owned: { ...st.owned }, levels: { ...st.levels }, buffs: { ...st.buffs } });
let memories = 0, pal = 0, total = 0;
for (let n = 0; n < trips; n++) {
  const s = { distance: 0, credits: 0, owned: { walk: true }, levels: { walk: 0 }, buffs: Object.fromEntries(BUFFS.map(b => [b.id, 0])), regionIdx: 0, badges: {}, memories, trips: n };
  s.buffs.pal = pal;
  let goal = null, t = 0;
  const min = Econ.homeMin(n);
  for (; s.distance < min && t < 200 * 3600; t++) {
    const b = Econ.base(s), d = b.idle + b.click * cps; s.distance += d; s.credits += d * b.cpm;
    const ri = IT.regionIndexFor(s.distance); if (ri > s.regionIdx) s.regionIdx = ri;
    for (let k = 0; k < 200; k++) {
      if (!goal) {
        const base = inc(s), opts = [];
        const nxt = VEHICLES.find(v => !s.owned[v.id]);
        if (nxt) opts.push({ c: nxt.cost, f: st => { st.owned[nxt.id] = true; st.levels[nxt.id] = 0; } });
        for (const o of VEHICLES) if (s.owned[o.id]) opts.push({ c: Econ.upgradeCost(o, s.levels[o.id]), f: st => { st.levels[o.id]++; } });
        for (const bf of BUFFS) { const l = s.buffs[bf.id]; if (bf.max && l >= bf.max) continue; opts.push({ c: Econ.buffCost(bf, l), f: st => { st.buffs[bf.id]++; } }); }
        for (const o of opts) { const c = clone(s); o.f(c); o.v = (inc(c) - base) / o.c; }
        opts.sort((a, b) => b.v - a.v); goal = opts[0];
      }
      if (s.credits < goal.c) break;
      s.credits -= goal.c; goal.f(s); goal = null;
    }
  }
  const gain = Econ.memoryGain(s.distance, n), lead = Econ.lead(s);
  total += t;
  console.log(`yolculuk ${n + 1}: ${(t / 3600).toFixed(1)} sa (toplam ${(total / 3600).toFixed(1)} sa) · ${IT.fmtDist(s.distance)} · +${gain} hatıra (önce ${memories}) · ${lead}@${s.levels[lead]} · bölge ${s.regionIdx + 1}`);
  memories += gain; pal = s.buffs.pal;
}
