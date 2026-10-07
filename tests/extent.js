// Her aracın çizim sınırları (k = 1, x = 0 noktasına göre): sol, sağ, üst
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const src = require('fs').readFileSync(require('path').resolve(__dirname, '../public/js/scene.js'), 'utf8').replace('IT.drawIcon = drawIcon;', 'IT.drawIcon = drawIcon; IT._drawVehicle = drawVehicle;');
  await p.route('**/js/scene.js', r => r.fulfill({ body: src, contentType: 'text/javascript' }));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const out = {};
    for (const id of ['walk', 'skates', 'board', 'bike', 'horse', 'moto', 'car', 'van', 'train', 'balloon', 'plane', 'jet', 'rocket', 'sail', 'comet', 'warp']) for (const tier of [0, 4]) for (const cars of [undefined, 1]) {
      if (cars === 1 && id !== 'train') continue;
      const c = document.createElement('canvas'); c.width = 1200; c.height = 400; const ctx = c.getContext('2d');
      IT._drawVehicle(ctx, id, 800, 300, 1, { phase: 0.5, wheel: 0, t: 1, night: 0, tier, pal: 0, palKind: null, cars });
      const d = ctx.getImageData(0, 0, 1200, 400).data; let x0 = 1e9, x1 = -1, y0 = 1e9;
      for (let y = 0; y < 400; y++) for (let x = 0; x < 1200; x++) if (d[(y * 1200 + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; }
      out[id + (tier ? '/T4' : '') + (cars ? '/kısa' : '')] = [x0 - 800, x1 - 800, 300 - y0];
    }
    return out;
  });
  for (const [k, v] of Object.entries(r)) console.log(k.padEnd(14), v.join(' '));
  await b.close();
})();
