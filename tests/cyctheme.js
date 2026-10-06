const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 }, colorScheme: 'light' });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); });
  await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 2, intro: true, lastSeen: Date.now(), clicks: 50, seenVer: '9', settings: { sky: 'cycle' } })); } });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  const st = async () => `ayar ${await p.evaluate(() => JSON.stringify((({ sky, page }) => ({ sky, page }))(JSON.parse(localStorage.getItem('idle-traveler-save-v1')).settings)))} | döngü ${await p.evaluate(() => __sc.cycle)} | sayfa ${await p.evaluate(() => document.documentElement.getAttribute('data-theme'))} | zemin ${await p.evaluate(() => getComputedStyle(document.body).backgroundColor)} | simge ${await p.isVisible('#btnSky .ico-moon') ? 'ay' : 'güneş'} | başlık "${await p.getAttribute('#btnSky', 'title')}"`;
  await p.evaluate(() => { __sc.cycTod = 0.5; }); await p.waitForTimeout(300);
  const tod0 = await p.evaluate(() => __sc.tod);
  console.log('başta  :', await st());
  await p.click('#btnSky'); await p.waitForTimeout(400);
  console.log('1. tık :', await st(), '| sahne saati değişti mi:', Math.abs(await p.evaluate(() => __sc.tod) - tod0) > 0.02);
  await p.click('#btnSky'); await p.waitForTimeout(400);
  console.log('2. tık :', await st());
  await p.click('#btnSky'); await p.reload(); await p.waitForTimeout(500);
  console.log('yükle  :', await st());
  // döngü dışı: düğme eskisi gibi gündüz/gece seçer
  await p.click('#btnSettings'); await p.click('#modalBody [data-act="sky"][data-id="auto"]'); await p.click('#modalBtn'); await p.waitForTimeout(300);
  console.log('otomatik:', await st());
  await p.click('#btnSky'); await p.waitForTimeout(300);
  console.log('tık    :', await st());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
