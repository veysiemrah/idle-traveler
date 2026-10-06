const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50 })); } });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  const open = () => p.isVisible('#modal');
  await p.click('#btnNews'); await p.waitForTimeout(300);
  await p.click('#modalBody h2'); await p.waitForTimeout(150); const inside = await open();
  await p.mouse.click(30, 830); await p.waitForTimeout(200);
  console.log('yenilikler: içeri tık açık kaldı', inside, '| dışarı tık kapandı', !(await open()));
  await p.click('#btnSettings'); await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  console.log('ayarlar: Esc kapandı', !(await open()));
  await p.click('#btnPhoto'); await p.waitForTimeout(400);
  await p.mouse.click(1250, 20); await p.waitForTimeout(200);
  console.log('kartpostal: dışarı tık kapandı', !(await open()));
  const clicks0 = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks);
  await p.close();
  // tanıtım: dışarı tık kapatmaz
  const q = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  q.on('pageerror', e => errs.push(e.message));
  await q.goto('http://localhost:8765/index.html'); await q.waitForTimeout(400);
  await q.mouse.click(30, 830); await q.keyboard.press('Escape'); await q.waitForTimeout(200);
  console.log('tanıtım: açık kaldı', await q.isVisible('#modal'));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
