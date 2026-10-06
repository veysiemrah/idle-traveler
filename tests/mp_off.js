// Sunucusuz (statik) ortamda: ad penceresi çalışır, Yolcular "ulaşılamıyor" der, hata yok
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'en-US', viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.click('#modalBtn'); await p.waitForTimeout(200);
  await p.fill('#nameInput', 'Robin'); await p.click('#modalBtn'); await p.waitForTimeout(1500);
  await p.click('.tab[data-id="travelers"]'); await p.waitForTimeout(300);
  console.log('durum:', await p.evaluate(() => IT.Online.status), '|', await p.textContent('#pane-travelers .tr-note'));
  await p.screenshot({ path: process.env.SP + '/mp_off.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
