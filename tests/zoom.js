// Sahne yakınlaştırma (v1.30): düğmeler, tekerlek ve tuşlar; kademe sınırları; yakınken dokunuşun doğru nesneyi bulması;
// seçimin kayıtta saklanması. Ekran görüntüleri: masaüstü (her kademe), 320 px telefon, yatay telefon, gece.
const { chromium } = require('./lib/pw');
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
const SAVE = JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 3000,
  owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1 }, levels: { horse: 30 }, active: 'horse' });
async function open(b, opts) {
  const p = await b.newPage(opts); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(hook);
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, SAVE);
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(900);
  return p;
}
const state = p => p.evaluate(() => ({ z: __sc.zoom, W: Math.round(__sc.W), inDis: document.querySelector('#btnZoomIn').disabled, outDis: document.querySelector('#btnZoomOut').disabled, pip: document.querySelector('#zoomCtl').dataset.zoom }));
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await open(b, { locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  console.log('başlangıç:', JSON.stringify(await state(p)));
  await p.screenshot({ path: process.env.SP + '/zoom_1.png', clip: { x: 0, y: 55, width: 890, height: 700 } });
  for (const [n, name] of [[1, 'zoom_125'], [1, 'zoom_160']]) { await p.click('#btnZoomIn'); await p.waitForTimeout(900); await p.screenshot({ path: `${process.env.SP}/${name}.png`, clip: { x: 0, y: 55, width: 890, height: 700 } }); }
  console.log('en yakın:', JSON.stringify(await state(p)));
  // yakınken yadigâr kabarcığına dokun: sanal koordinat × zoom + tuval konumu
  await p.evaluate(() => __sc.spawnKeep('lavender')); await p.waitForTimeout(700);
  const c = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), q = __sc.keepPos(); return { x: r.left + q.x * __sc.zoom, y: r.top + q.y * __sc.zoom }; });
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(300);
  console.log('yakınken dokunuş yadigârı buldu mu:', await p.evaluate(() => !__sc.keep), '|', (await p.textContent('#toasts')).includes('Lavanta'));
  // tekerlek ve tuşlar
  const box = await p.$eval('#scene', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(box.x, box.y); await p.mouse.wheel(0, 120); await p.waitForTimeout(350); await p.mouse.wheel(0, 120); await p.waitForTimeout(350); await p.mouse.wheel(0, 120); await p.waitForTimeout(900);
  console.log('tekerlekle en uzak:', JSON.stringify(await state(p)));
  await p.screenshot({ path: process.env.SP + '/zoom_080.png', clip: { x: 0, y: 55, width: 890, height: 700 } });
  await p.keyboard.press('+'); await p.waitForTimeout(400); await p.keyboard.press('+'); await p.waitForTimeout(900);
  console.log('+ tuşu (iki kez):', JSON.stringify(await state(p)));
  await p.waitForTimeout(5500);
  console.log('kayıttaki seviye:', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).settings.zoom));
  await p.reload(); await p.waitForTimeout(900);
  console.log('yeniden açılınca:', JSON.stringify(await state(p)));
  errs.push(...p.errs);
  // telefon (320 px), gece; yatay telefon
  for (const [name, opts] of [['zoom_phone', { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, colorScheme: 'dark' }],
                              ['zoom_land', { viewport: { width: 740, height: 360 }, isMobile: true, hasTouch: true }]]) {
    const q = await open(b, Object.assign({ locale: 'de-DE' }, opts));
    await q.tap('#btnZoomIn'); await q.waitForTimeout(900);
    await q.screenshot({ path: `${process.env.SP}/${name}.png` });
    console.log(name, JSON.stringify(await state(q)), '| taşma:', await q.evaluate(() => document.documentElement.scrollWidth > innerWidth));
    errs.push(...q.errs); await q.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
