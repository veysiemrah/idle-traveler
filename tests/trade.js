// Garaj (v1.27): araç kartlarında ipucu satırı yok; yükseltme satırı sıradaki eşiği (görünüm ya da hız ×2) söyler,
// Sv. 10 yeni görünüm, Sv. 25 ve 50 hızı ikiye katlar. Fiyatlar sabittir, kilit yoktur: sıradaki araç her zaman alınabilir.
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [locale, lvl] of [['tr-TR', 0], ['en-US', 9], ['tr-TR', 49], ['de-DE', 24], ['fr-FR', 30], ['es-ES', 60]]) {
    const p = await b.newPage({ locale, viewport: { width: 1280, height: 860 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(l => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, credits: 2e5, owned: { walk: 1, skates: 1, board: 1 }, levels: { board: l }, active: 'board' })); } }, lvl);
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
    const line = () => p.$eval('[data-act="upgrade"][data-id="board"]', bt => bt.closest('.card').querySelector('.up small').textContent);
    console.log(locale, 'kaykay Sv.' + lvl, '→', await line(), '| ipucu satırı:', await p.$$eval('.card .trade', l => l.length), '| bisiklet düğmesi açık mı:', await p.$eval('[data-act="buyVeh"][data-id="bike"]', bt => !bt.disabled));
    if (lvl === 9 || lvl === 49 || lvl === 24) {
      await p.$eval('[data-act="upgrade"][data-id="board"]', e => e.scrollIntoView({ block: 'center' }));
      await p.click('[data-act="upgrade"][data-id="board"]'); await p.waitForTimeout(300);
      console.log('   bir yükseltme sonra →', await line(), '| bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-90));
    }
    if (lvl === 49) {
      await p.$eval('[data-act="buyVeh"][data-id="bike"]', e => e.scrollIntoView({ block: 'center' }));
      await p.screenshot({ path: process.env.SP + '/trade.png', clip: { x: 890, y: 55, width: 390, height: 805 } });
      await p.click('[data-act="buyVeh"][data-id="bike"]'); await p.waitForTimeout(250);
      console.log('   satın alındı mı:', await p.evaluate(() => !!document.querySelector('[data-act="upgrade"][data-id="bike"]')));
    }
    await p.close();
  }
  // 320 piksellik telefonda kart
  const q = await b.newPage({ locale: 'de-DE', viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  q.on('pageerror', e => errs.push(e.message));
  await q.addInitScript(() => { localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, credits: 5000, owned: { walk: 1, skates: 1 }, levels: { walk: 52, skates: 7 }, active: 'skates' })); });
  await q.goto('http://localhost:8765/index.html'); await q.waitForTimeout(500);
  await q.$eval('[data-act="buyVeh"][data-id="board"]', e => e.scrollIntoView({ block: 'center' }));
  await q.screenshot({ path: process.env.SP + '/trade_phone.png' });
  console.log('telefon taşma:', await q.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
