const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [locale, lvl] of [['tr-TR', 0], ['tr-TR', 4], ['en-US', 10], ['tr-TR', 14], ['de-DE', 13], ['fr-FR', 12], ['es-ES', 16]]) {
    const p = await b.newPage({ locale, viewport: { width: 1280, height: 860 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(l => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50, credits: 60000, owned: { walk: 1, skates: 1, board: 1 }, levels: { board: l }, active: 'board' })); } }, lvl);
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
    const info = async () => p.$eval('[data-act="buyVeh"][data-id="bike"]', bt => bt.closest('.card').querySelector('.trade').textContent + ' | düğme ' + bt.querySelector('b').textContent);
    console.log(locale, 'kaykay Sv.' + lvl, '→', await info());
    if (lvl === 4) {
      await p.$eval('[data-act="upgrade"][data-id="board"]', e => e.scrollIntoView({ block: 'center' }));
      await p.click('[data-act="upgrade"][data-id="board"]'); await p.waitForTimeout(250);
      console.log('   bir yükseltme sonra →', await info());
      await p.$eval('[data-act="buyVeh"][data-id="bike"]', e => e.scrollIntoView({ block: 'center' }));
      await p.screenshot({ path: process.env.SP + '/trade.png', clip: { x: 890, y: 55, width: 390, height: 805 } });
    }
    if (lvl === 14) {
      await p.$eval('[data-act="buyVeh"][data-id="bike"]', e => e.scrollIntoView({ block: 'center' }));
      await p.screenshot({ path: process.env.SP + '/floor.png', clip: { x: 890, y: 55, width: 390, height: 805 } });
      await p.click('[data-act="upgrade"][data-id="board"]'); await p.waitForTimeout(250);
      console.log('   bir yükseltme sonra →', await info());
      await p.click('[data-act="buyVeh"][data-id="bike"]'); await p.waitForTimeout(250);
      console.log('   satın alındı mı:', await p.evaluate(() => !!document.querySelector('[data-act="upgrade"][data-id="bike"]')));
    }
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
