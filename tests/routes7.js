const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  // 1) 7 yolculuk tamamlanmış: 8 rotanın hepsi açık, Yonca Yolu seçili
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', trips: 7, memories: 80, route: 'clover',
    player: { id: crypto.randomUUID(), key: 'a'.repeat(64), name: 'Rota' } })); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(800);
  await p.click('.tab[data-id="buffs"]'); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('.routes').scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: process.env.SP + '/routes7.png' });
  console.log('rotalar:', await p.$$eval('.route-btn', bs => bs.map(x => x.querySelector('b').textContent + (x.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' | ')));
  console.log('sahne bölgesi:', await p.textContent('#hudRegion'));
  // 2) yeni oyuncu: 8 maddeli giriş
  const q = await b.newPage({ locale: 'tr-TR', viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  q.on('pageerror', e => errs.push(e.message));
  await q.goto('http://localhost:8765/index.html'); await q.waitForTimeout(800);
  await q.screenshot({ path: process.env.SP + '/intro8.png', fullPage: false });
  console.log('giriş maddeleri:', await q.$$eval('.intro-list li', l => l.length), '| düğme görünür mü:', await q.isVisible('#modalBtn'));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
