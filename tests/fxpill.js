const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  p.on('pageerror', e => errs.push(e.message));
  // biri 14 sn, biri 60 sn kalmış iki etki
  await p.addInitScript(() => localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50,
    effects: [{ id: 'gust', until: Date.now() + 14000 }, { id: 'harvest', until: Date.now() + 60000 }] })));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelectorAll('#effects .fx').forEach(e => { e.__mark = 1; }));
  const snap = () => p.$$eval('#effects .fx', els => els.map(e => `${e.dataset.fx}: "${e.textContent}" aynı öğe=${!!e.__mark} bitiyor=${e.classList.contains('ending')} anim=${e.getAnimations().map(a => a.animationName + ':' + a.playState).join(',') || '-'}`).join(' | '));
  console.log('t+0  :', await snap());
  await p.waitForTimeout(2200);
  console.log('t+2s :', await snap());
  await p.waitForTimeout(3000);
  console.log('t+5s :', await snap());
  // nabız sırasında saydamlık örnekleri
  const ops = []; for (let i = 0; i < 8; i++) { ops.push(await p.$eval('[data-fx="gust"]', e => (+getComputedStyle(e).opacity).toFixed(2))); await p.waitForTimeout(150); }
  console.log('gust saydamlık (son 10 sn):', ops.join(' '));
  await p.waitForTimeout(9500);
  console.log('t+15s:', await snap());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
