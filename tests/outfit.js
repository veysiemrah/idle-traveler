const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  p.on('pageerror', e => errs.push(e.message));
  const badges = { steps: 3, garage: 4, region: 4, dist: 4 }; // 15 kademe
  await p.addInitScript(bd => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), credits: 5e5, clicks: 120, distance: 1e5, regionIdx: 4, owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1 }, active: 'bike', badges: bd })); } }, badges);
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
  const list = () => p.$$eval('.outfit', bs => bs.map(b => `${b.querySelector('b').textContent}${b.disabled ? '(kilit: ' + b.querySelector('small').textContent + ')' : b.classList.contains('on') ? '*' : ''}`).join(' | '));
  console.log('başta:', await list());
  await p.click('.outfit[data-id="lavender"]'); await p.waitForTimeout(300);
  console.log('lavanta seçildi:', await list());
  await p.$eval('.outfits', e => e.scrollIntoView());
  await p.screenshot({ path: process.env.SP + '/outfit_journal.png' });
  await p.click('.tab[data-id="garage"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: process.env.SP + '/outfit_scene.png' });
  await p.click('.outfit[data-id="gold"]', { timeout: 300 }).catch(() => {});
  await p.waitForTimeout(5500); await p.reload(); await p.waitForTimeout(500);
  console.log('yeniden yükle → kayıt:', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).settings.outfit));
  // sıfırla → rozetler gider, klasik
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
  await p.click('#btnSettings'); await p.waitForTimeout(200); await p.click('[data-act="reset"]'); await p.click('[data-act="reset"]'); await p.waitForTimeout(300); await p.click('#modalBtn'); await p.waitForTimeout(200);
  console.log('sıfırlama sonrası:', await list());
  await p.close();
  // kilit açma bildirimi: 2 rozet + 100. adım
  const q = await b.newPage({ locale: 'en-US', viewport: { width: 1280, height: 860 } });
  q.on('pageerror', e => errs.push(e.message));
  await q.addInitScript(() => localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), clicks: 49, badges: { butterfly: 1, lucky: 1 } })));
  await q.goto('http://localhost:8765/index.html'); await q.waitForTimeout(400);
  await q.mouse.click(400, 300); await q.waitForTimeout(300);
  console.log('bildirim:', (await q.textContent('#toasts')).replace(/\s+/g, ' ').trim());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
