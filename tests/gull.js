// Kuşun kanat çırpışı: 8 kare yan yana (kanatlar birlikte inip kalkmalı)
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 200 } });
  // test için çizim işlevini dışarı aç (yalnızca bu sayfada)
  const src = require('fs').readFileSync(require('path').resolve(__dirname, '../public/js/scene.js'), 'utf8').replace('IT.drawIcon = drawIcon;', 'IT.drawIcon = drawIcon; IT._drawGull = drawGull;');
  await p.route('**/js/scene.js', r => r.fulfill({ body: src, contentType: 'text/javascript' }));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 200; c.id = 'gc';
    Object.assign(c.style, { position: 'fixed', left: 0, top: 0, zIndex: 9999, background: '#8fb8de' }); document.body.appendChild(c);
    const ctx = c.getContext('2d');
    for (let i = 0; i < 8; i++) { const t = i / 8 * (2 * Math.PI / 7); IT._drawGull(ctx, 60 + i * 110, 110, 3, t, 0); }
  });
  await p.screenshot({ path: process.env.SP + '/gull.png', clip: { x: 0, y: 0, width: 900, height: 200 } });
  await b.close();
})();
