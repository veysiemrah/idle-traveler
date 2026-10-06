const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ locale: 'tr-TR' });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.addInitScript(() => { if (!localStorage.getItem('seed2')) { localStorage.setItem('seed2', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ intro: true, lastSeen: Date.now(), credits: 100, clicks: 50 })); } });
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../public/index.html')).href); await p.waitForTimeout(500);
  const get = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('idle-traveler-save-v1')); return JSON.stringify(s.settings) + ' seed2=' + localStorage.getItem('seed2'); });
  console.log('başta:', await get());
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
  await p.click('#btnSettings'); await p.waitForTimeout(200);
  await p.selectOption('#setLang', 'en'); await p.waitForTimeout(400);
  console.log('seçimden sonra:', await get());
  await p.click('[data-act="units"][data-id="imperial"]'); await p.waitForTimeout(300);
  console.log('birimden sonra:', await get());
  await p.reload(); await p.waitForTimeout(500);
  console.log('yüklemeden sonra:', await get(), '| sekme:', await p.textContent('.tab[data-id="garage"]'));
  await b.close();
})();
