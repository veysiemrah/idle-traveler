const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const scheme of ['light','dark']) {
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 760 }, colorScheme: scheme });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.addInitScript(() => {
    localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ intro: true, lastSeen: Date.now() - 5 * 3600 * 1000, distance: 200, credits: 40, active: 'skates', owned: { walk: true, skates: true }, levels: { walk: 2, skates: 1 }, regionIdx: 0, msIdx: 1, clicks: 50 }));
  });
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../public/index.html')).href);
  await p.waitForTimeout(1500);
  console.log(scheme, 'offline modal:', await p.isVisible('#modal'), (await p.textContent('#modalBody')).replace(/\s+/g, ' ').slice(0, 300));
  await p.screenshot({ path: process.env.SP + '/offline_' + scheme + '.png' });
  await p.click('#modalBtn'); await p.waitForTimeout(1200);
  await p.screenshot({ path: process.env.SP + '/after_' + scheme + '.png' });
  }
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
