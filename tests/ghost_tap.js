const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 760 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 50000, regionIdx: 3,
    owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1 }, levels: { horse: 12 }, active: 'horse', player: { id: '11111111-2222-4333-8444-999999999999', key: 'f'.repeat(64), name: 'Dokunan' } })); });
  await p.goto('http://127.0.0.1:8787/index.html'); await p.waitForTimeout(6000);
  const before = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).distance);
  await p.mouse.click(480, 610); await p.waitForTimeout(400);
  const after = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).distance);
  console.log('bildirim:', (await p.textContent('#toasts')).slice(-120));
  await p.screenshot({ path: process.env.SP + '/ghost_tap.png', clip: { x: 300, y: 380, width: 590, height: 300 } });
  // ayar kapalı: gezginler kaybolur
  await p.click('#btnSettings'); await p.click('[data-act="others"]'); await p.click('#modalBtn'); await p.waitForTimeout(1800);
  await p.screenshot({ path: process.env.SP + '/ghost_off.png', clip: { x: 0, y: 380, width: 890, height: 300 } });
  console.log('ayar:', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).settings.others));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
