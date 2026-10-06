// Sahnede diğer gezginler: sahte gezginler kaydedilir, sahne ekran görüntüsü alınır, bir gezgine dokunulur
const { chromium } = require('./lib/pw');
const BASE = process.argv[2] || 'http://127.0.0.1:8787';
const crypto = require('crypto');
const hello = b => fetch(BASE + '/api/hello', { method: 'POST', body: JSON.stringify(Object.assign({ id: crypto.randomUUID(), key: crypto.randomBytes(32).toString('hex'), trip: 2, route: 'coast' }, b)) }).then(r => r.json());
(async () => {
  const fakes = [
    { name: 'Deniz', dist: 50900, veh: 'horse', tier: 1, outfit: 'sky', pal: 'dog' },
    { name: 'Ayşe Nur', dist: 53500, veh: 'bike', tier: 2, outfit: 'forest', pal: 'bird' },
    { name: 'Robin', dist: 48200, veh: 'walk', tier: 3, outfit: 'sunset', pal: 'cat' },
    { name: 'Kemal', dist: 39000, veh: 'moto', tier: 0, outfit: 'night', pal: '' },
    { name: 'Lea', dist: 61000, veh: 'car', tier: 4, outfit: 'gold', pal: 'dog' },
  ];
  for (const f of fakes) { const r = await hello(f); if (!r.players) console.log('kayıt hatası', r); }
  const b = await chromium.launch(); const errs = [];
  const shot = async (w, h, veh, name, extra) => {
    const p = await b.newPage({ locale: 'tr-TR', viewport: { width: w, height: h } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([veh, ex]) => { localStorage.setItem('idle-traveler-save-v1', JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 50000, regionIdx: 3,
      owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, moto: 1, car: 1, van: 1, train: 1, balloon: 1, plane: 1 }, levels: { horse: 12 }, active: veh,
      player: { id: '11111111-2222-4333-8444-' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0'), key: 'e'.repeat(64), name: 'Ben' } }, ex))); }, [veh, extra || {}]);
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(3500);
    await p.screenshot({ path: `${process.env.SP}/ghost_${name}.png` });
    return p;
  };
  const p1 = await shot(1280, 760, 'horse', 'desk');
  console.log('sahnedeki gezginler:', await p1.evaluate(() => [...document.defaultView.IT && []].length), await p1.evaluate(() => JSON.stringify(window.__s || null)));
  await shot(390, 844, 'walk', 'mob');
  await shot(1280, 760, 'plane', 'plane');
  // dokunma: en yakın öndeki gezgin
  const pos = await p1.evaluate(() => null);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
