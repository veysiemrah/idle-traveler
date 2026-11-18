const assert = require('node:assert/strict');
require('../public/js/data.js');
const { VEHICLES, VEH } = globalThis.IT;
assert.deepEqual(VEHICLES.slice(-2).map(v => v.id), ['portal', 'cosmos']);
for (const id of ['portal', 'cosmos']) {
 const v = VEH[id], prev = VEHICLES[v.index - 1];
 assert.ok(v.cost > prev.cost && v.idle > prev.idle && v.click > prev.click);
 assert.ok(Math.abs(v.idle / prev.idle - 2.5) < 0.02);
}
console.log('New vehicle progression passed');
