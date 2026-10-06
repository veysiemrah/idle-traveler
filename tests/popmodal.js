const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 760 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', player: { id: crypto.randomUUID(), key: 'a'.repeat(64), name: 'Test' } })); });
  await p.goto('http://127.0.0.1:8787/index.html'); await p.waitForTimeout(800);
  await p.click('#btnChat'); await p.waitForTimeout(200);
  const open1 = await p.isVisible('#chatPop');
  await p.click('#btnSettings'); await p.waitForTimeout(300);
  console.log('seçici açıldı:', open1, '| ayarlar açılınca kapandı:', await p.isHidden('#chatPop'), '| düğme:', await p.getAttribute('#btnChat', 'aria-expanded'));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
