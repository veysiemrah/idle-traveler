// Fiyat dengesi simülasyonu. Kullanım: node sim_price.js <data.js yolu> '<json param>' <saat>
// param: up (upBase oranı), walk (yürüyüş upBase), step, max, floor (taban katsayısı; 0 = yok), costs ({id: fiyat}), native (data.js'deki Econ.vehCost'u kullan)
const P = JSON.parse(process.argv[3] || '{}'), hours = +(process.argv[4] || 12);
require(process.argv[2]); const IT = globalThis.IT; const { Econ, VEHICLES, BUFFS, VEH } = IT;
if (P.mul) for (const v of VEHICLES) v.cost *= P.mul;
if (P.costs) for (const v of VEHICLES) if (P.costs[v.id]) v.cost = P.costs[v.id];
if (P.up) VEHICLES.forEach((v, i) => v.upBase = i === 0 ? (P.walk || 8) : Math.round(v.cost * P.up));
const step = P.step ?? 0, max = P.max ?? 0, floorK = P.floor ?? 0;
function price(s, v) {
  if (P.native) return Econ.vehCost(s, v);
  const prev = VEHICLES[v.index - 1];
  const l = prev && s.owned[prev.id] ? s.levels[prev.id] || 0 : 0;
  let c = Math.ceil(v.cost * (1 - Math.min(max, step * l)));
  if (floorK) for (const o of VEHICLES) if (o.index < v.index && s.owned[o.id]) c = Math.max(c, Math.ceil(floorK * Econ.upgradeCost(o, s.levels[o.id] || 0)));
  return c;
}
function run(strategy) {
  const s = { distance: 0, credits: 0, owned: { walk: true }, levels: { walk: 0 }, buffs: Object.fromEntries(BUFFS.map(b => [b.id, 0])), regionIdx: 0, badges: {}, memories: 0 };
  const out = [];
  // araç yükseltmesi bir sonraki aracı pahalandırıyorsa oyuncu o yükseltmeyi yapmaz, araca biriktirir
  const raises = (nxt, id) => { if (!nxt) return false; const p0 = price(s, nxt); s.levels[id]++; const p1 = price(s, nxt); s.levels[id]--; return p1 > p0 && !(step && id === VEHICLES[nxt.index - 1].id && s.levels[id] < max / step); };
  for (let t = 0; t < hours * 3600; t++) {
    const b = Econ.base(s), d = b.idle + 1 * b.click * 1.5; s.distance += d; s.credits += d * b.cpm;
    const ri = IT.regionIndexFor(s.distance); if (ri > s.regionIdx) s.regionIdx = ri;
    for (let k = 0; k < 60; k++) {
      const nxt = VEHICLES.find(v => !s.owned[v.id]);
      const prev = nxt && VEHICLES[nxt.index - 1];
      const pc = nxt && price(s, nxt);
      const wantUpgrade = strategy === 'patient' && prev && step && s.levels[prev.id] < max / step && !raises(nxt, prev.id);
      if (nxt && !wantUpgrade && s.credits >= pc) { const l = s.levels[prev.id]; s.credits -= pc; s.owned[nxt.id] = true; s.levels[nxt.id] = 0; out.push(`${(t / 60).toFixed(0)}dk ${nxt.id}@${l}${pc > Math.ceil(nxt.cost * (1 - Math.min(max, step * l))) + 1 ? '*' : ''}`); continue; }
      const opts = [];
      for (const o of VEHICLES) if (s.owned[o.id] && !raises(nxt, o.id) && (o.id === Econ.lead(s) || o.index === VEHICLES.length - 1 || !s.owned[VEHICLES[o.index + 1].id] || (wantUpgrade && o.id === prev.id))) opts.push({ c: Econ.upgradeCost(o, s.levels[o.id]), f: () => s.levels[o.id]++ });
      for (const bf of BUFFS) { const l = s.buffs[bf.id]; if (bf.max && l >= bf.max) continue; opts.push({ c: Econ.buffCost(bf, l), f: () => s.buffs[bf.id]++ }); }
      opts.sort((a, b) => a.c - b.c);
      if (opts.length && opts[0].c <= s.credits) { s.credits -= opts[0].c; opts[0].f(); } else break;
    }
  }
  return out.join(' | ');
}
console.log('greedy :', run('greedy'));
if (step || P.native) console.log('patient:', run('patient'));
