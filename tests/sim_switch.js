// Verimli oyuncu: her an kredi başına en çok gelir getiren alımı seçer (gerekirse ona biriktirir).
// Hangi seviyede yeni araca geçildiğini, araçlara ulaşma sürelerini ve saatlik yolu gösterir.
// Kullanım: node sim_switch.js [saat] [tık/sn] ['{"R":4,"C0":600,"Q":6,"f":0.01,"g":1.12,"gain":0.1,"dbl":[25,50]}']
// (ayar verilmezse data.js'teki değerler kullanılır)
const hours = +(process.argv[2] || 12), cps = +(process.argv[3] || 1), P = JSON.parse(process.argv[4] || '{}');
require(require('path').resolve(__dirname, '../public/js/data.js')); const IT = globalThis.IT; const { Econ, VEHICLES, BUFFS } = IT;
if (P.R) VEHICLES.forEach((v, i) => { const r = v.click / v.idle; v.idle = 0.035 * Math.pow(P.R, i); v.click = v.idle * r * (P.click || 1); });
if (P.C0) VEHICLES.forEach((v, i) => { if (i) v.cost = Math.round(P.C0 * Math.pow(P.Q, i - 1) * Math.pow(P.S || 1, (i - 1) * (i - 2) / 2)); });
if (P.f) VEHICLES.forEach((v, i) => { v.upBase = i ? Math.max(1, Math.round(v.cost * P.f)) : (P.w || v.upBase); });
if (P.g) Econ.upgradeCost = (v, l) => Math.ceil(v.upBase * Math.pow(P.g, l));
if (P.gain) Econ.vehicleMult = l => { let m = 1 + P.gain * l; for (const t of P.dbl) if (l >= t) m *= 2; return m; };
const s = { distance: 0, credits: 0, owned: { walk: true }, levels: { walk: 0 }, buffs: Object.fromEntries(BUFFS.map(b => [b.id, 0])), regionIdx: 0, badges: {}, memories: 0, trips: 0 };
const inc = st => { const b = Econ.base(st); return (b.idle + b.click * cps) * b.cpm; };
const clone = st => ({ ...st, owned: { ...st.owned }, levels: { ...st.levels }, buffs: { ...st.buffs } });
const out = [], marks = {};
let goal = null;
for (let t = 0; t < hours * 3600; t++) {
  const b = Econ.base(s), d = b.idle + b.click * cps; s.distance += d; s.credits += d * b.cpm;
  const ri = IT.regionIndexFor(s.distance); if (ri > s.regionIdx) s.regionIdx = ri;
  if ((t + 1) % 3600 === 0) marks[(t + 1) / 3600 + 'sa'] = `${IT.fmtDist(s.distance)}/b${s.regionIdx}/${Econ.lead(s)}@${s.levels[Econ.lead(s)]}`;
  for (let k = 0; k < 200; k++) {
    if (!goal) {
      const base = inc(s), opts = [];
      const nxt = VEHICLES.find(v => !s.owned[v.id]);
      if (nxt) opts.push({ c: nxt.cost, f: st => { st.owned[nxt.id] = true; st.levels[nxt.id] = 0; }, veh: nxt.id });
      for (const o of VEHICLES) if (s.owned[o.id]) opts.push({ c: Econ.upgradeCost(o, s.levels[o.id]), f: st => { st.levels[o.id]++; } });
      for (const bf of BUFFS) { const l = s.buffs[bf.id]; if (bf.max && l >= bf.max) continue; opts.push({ c: Econ.buffCost(bf, l), f: st => { st.buffs[bf.id]++; } }); }
      for (const o of opts) { const c = clone(s); o.f(c); o.v = (inc(c) - base) / o.c; }
      opts.sort((a, b) => b.v - a.v);
      goal = opts[0];
    }
    if (s.credits < goal.c) break;
    s.credits -= goal.c; goal.f(s);
    if (goal.veh) { const prev = VEHICLES[VEHICLES.findIndex(v => v.id === goal.veh) - 1]; out.push(`${(t / 60).toFixed(0)}dk ${goal.veh}(önceki Sv.${s.levels[prev.id]})`); }
    goal = null;
  }
}
console.log(out.join('\n'));
console.log(JSON.stringify(marks));
