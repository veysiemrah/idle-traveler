// Sabit fiyatlarla üç oyuncu: rush (hep sıradaki araca biriktir), greedy (en ucuz alımı yap), patient G (lider Sv.G olmadan araç alma)
// Kullanım: node sim_static.js <data.js> '{"mul":2,"up":0.018,"walk":2}' <saat>
const P = JSON.parse(process.argv[3] || '{}'), hours = +(process.argv[4] || 10);
require(process.argv[2]); const IT = globalThis.IT; const { Econ, VEHICLES, BUFFS, VEH } = IT;
if (P.mul) for (const v of VEHICLES) v.cost *= P.mul;
if (P.costs) for (const v of VEHICLES) if (P.costs[v.id]) v.cost = P.costs[v.id];
if (P.up) VEHICLES.forEach((v, i) => v.upBase = i === 0 ? (P.walk || 8) : Math.round(v.cost * P.up));
function run(strategy, G) {
  const s = { distance: 0, credits: 0, owned: { walk: true }, levels: { walk: 0 }, buffs: Object.fromEntries(BUFFS.map(b => [b.id, 0])), regionIdx: 0, badges: {}, memories: 0 };
  const out = []; let dist = 0;
  for (let t = 0; t < hours * 3600; t++) {
    const b = Econ.base(s), d = b.idle + 1 * b.click * 1.5; s.distance += d; s.credits += d * b.cpm; dist += d;
    const ri = IT.regionIndexFor(s.distance); if (ri > s.regionIdx) s.regionIdx = ri;
    for (let k = 0; k < 80; k++) {
      const nxt = VEHICLES.find(v => !s.owned[v.id]);
      const lead = Econ.lead(s), top = VEHICLES.filter(v => s.owned[v.id]).pop();
      const ready = strategy === 'patient' ? (s.levels[top.id] || 0) >= G : true;
      if (nxt && ready && s.credits >= nxt.cost) { s.credits -= nxt.cost; s.owned[nxt.id] = true; s.levels[nxt.id] = 0; out.push(`${(t / 60).toFixed(0)}dk ${nxt.id}@${s.levels[top.id]}`); continue; }
      if (strategy === 'rush' && nxt) break; // sıradaki araca biriktir
      const opts = [];
      for (const o of VEHICLES) if (s.owned[o.id] && (o.id === lead || o.id === top.id)) opts.push({ c: Econ.upgradeCost(o, s.levels[o.id]), f: () => s.levels[o.id]++ });
      for (const bf of BUFFS) { const l = s.buffs[bf.id]; if (bf.max && l >= bf.max) continue; opts.push({ c: Econ.buffCost(bf, l), f: () => s.buffs[bf.id]++ }); }
      // greedy: araç da seçeneklerden biri (en ucuz olan alınır)
      opts.sort((a, b) => a.c - b.c);
      if (opts[0].c <= s.credits) { s.credits -= opts[0].c; opts[0].f(); } else break;
    }
  }
  return out.join(' ');
}
console.log('rush      :', run('rush'));
console.log('greedy    :', run('greedy'));
for (const G of (P.G || [5, 10, 15])) console.log(`patient ${G}:`.padEnd(11), run('patient', G));
