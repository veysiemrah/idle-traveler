// Tempo karşılaştırması (açgözlü oyuncu, 1 tık/sn). Kullanım: node sim_tempo.js '{"vmul":2,"upf":0.018,"walk":2,"bmul":2}' <saat>
const P = JSON.parse(process.argv[2] || '{}'), hours = +(process.argv[3] || 12);
require(require('path').resolve(__dirname, '../public/js/data.js')); const IT = globalThis.IT; const { Econ, VEHICLES, BUFFS, VEH } = IT;
if (P.vmul) for (const v of VEHICLES) v.cost *= P.vmul;
if (P.upf || P.walk) VEHICLES.forEach((v, i) => v.upBase = i === 0 ? (P.walk || v.upBase) : Math.round(v.cost * (P.upf || 0.018)));
if (P.bmul) for (const b of BUFFS) b.base *= P.bmul;
const s = { distance: 0, credits: 0, owned: { walk: true }, levels: { walk: 0 }, buffs: Object.fromEntries(BUFFS.map(b => [b.id, 0])), regionIdx: 0, badges: {}, memories: 0 };
const out = [], marks = {};
for (let t = 0; t < hours * 3600; t++) {
  const b = Econ.base(s), d = b.idle + b.click * 1.5; s.distance += d; s.credits += d * b.cpm;
  const ri = IT.regionIndexFor(s.distance); if (ri > s.regionIdx) { s.regionIdx = ri; }
  if ((t + 1) % 3600 === 0) marks[(t + 1) / 3600 + 'sa'] = `${IT.fmtDist(s.distance)}/b${s.regionIdx}`;
  for (let k = 0; k < 80; k++) {
    const nxt = VEHICLES.find(v => !s.owned[v.id]);
    const lead = Econ.lead(s), top = VEHICLES.filter(v => s.owned[v.id]).pop();
    const opts = [];
    if (nxt) opts.push({ c: nxt.cost, f: () => { s.owned[nxt.id] = true; s.levels[nxt.id] = 0; out.push(`${(t / 60).toFixed(0)}dk ${nxt.id}`); } });
    for (const o of VEHICLES) if (s.owned[o.id] && (o.id === lead || o.id === top.id)) opts.push({ c: Econ.upgradeCost(o, s.levels[o.id]), f: () => s.levels[o.id]++ });
    for (const bf of BUFFS) { const l = s.buffs[bf.id]; if (bf.max && l >= bf.max) continue; opts.push({ c: Econ.buffCost(bf, l), f: () => s.buffs[bf.id]++ }); }
    opts.sort((a, b) => a.c - b.c);
    if (opts[0].c <= s.credits) { s.credits -= opts[0].c; opts[0].f(); } else break;
  }
}
console.log(out.join(' '));
console.log(JSON.stringify(marks));
