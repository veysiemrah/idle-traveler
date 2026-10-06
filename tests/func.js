const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ locale: 'tr-TR', viewport: { width: 1280, height: 760 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('CERT')) errs.push(m.text()); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../public/index.html')).href);
  await p.waitForTimeout(500);
  console.log('intro visible:', await p.isVisible('#modal'));
  await p.click('#modalBtn');
  // click until 800+ credits (Paten'in fiyatı; v1.27'de tıklama etkisi yarıya indi)
  let n = 0;
  while (n < 1800) { await p.mouse.click(300, 300); n++; if (n % 20 === 0) { const txt = await p.textContent('#credits'); if (parseInt(txt.replace(/\./g,'')) >= 800) break; } await p.waitForTimeout(40); }
  console.log('clicks', n, 'credits', await p.textContent('#credits'), 'dist', await p.textContent('#hudDist'));
  await p.waitForTimeout(300);
  const btn = p.locator('[data-act="buyVeh"][data-id="skates"]');
  console.log('skates btn disabled?', await btn.isDisabled());
  await btn.click();
  await p.waitForTimeout(400);
  console.log('vehicle now', await p.textContent('#hudVehicle'));
  // buff tab
  await p.click('.tab[data-id="buffs"]');
  console.log('buff cards', await p.locator('#pane-buffs .card').count());
  // gift
  await p.evaluate(() => {});
  await p.keyboard.press('Space');
  // force gift by waiting? emulate via exposing: spawn via timers is internal; instead fast-forward giftIn not accessible -> wait 26s
  await p.waitForTimeout(27000);
  const giftPos = await p.evaluate(() => null);
  // scan clicks along likely path region to catch butterfly
  let caught = false;
  for (let t = 0; t < 30 && !caught; t++) {
    for (let x = 100; x < 890; x += 30) for (let y = 160; y < 300; y += 25) { await p.mouse.click(x, y); }
    const fx = await p.textContent('#toasts');
    if (/Altın kelebek/.test(fx)) caught = true;
  }
  console.log('gift caught:', caught, (await p.textContent('#toasts')).slice(0, 120));
  // offline
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('idle-traveler-save-v1')); });
  await p.close();
  const p2 = await ctx.newPage();
  p2.on('pageerror', e => errs.push('PAGEERR2 ' + e.message));
  await p2.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); } });
  await p2.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../public/index.html')).href);
  await p2.waitForTimeout(300);
  await p2.evaluate(() => { const s = JSON.parse(localStorage.getItem('idle-traveler-save-v1')); s.lastSeen = Date.now() - 3 * 3600 * 1000; localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); });
  // block saving on unload overwriting: reload quickly
  await p2.evaluate(() => { window.addEventListener('beforeunload', e => e.stopImmediatePropagation(), true); window.addEventListener('pagehide', e => e.stopImmediatePropagation(), true); });
  await p2.reload();
  await p2.waitForTimeout(800);
  console.log('offline modal:', await p2.isVisible('#modal'), (await p2.textContent('#modalBody')).replace(/\s+/g, ' ').slice(0, 260));
  await p2.screenshot({ path: process.env.SP + '/offline.png' });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
