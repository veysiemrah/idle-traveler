// Yeni sürüm yayınlanınca sayfa kendiliğinden yenilenir: önce kaydeder, pencere açıkken beklemeye geçer,
// aynı sürüm için yalnızca bir kez dener (önbellekten eski dosya gelirse döngüye girmez).
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1000, height: 760 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, credits: 1234,
    player: { id: '00000000-0000-4000-8000-000000000002', key: 'c'.repeat(64), name: 'Sürüm' } })); } });
  // sayfa yüklendikten sonraki changelog istekleri "yayınlanmış" yeni sürümü döner
  let bump = false, loads = 0;
  await p.route('**/js/changelog.js*', async route => {
    const res = await route.fetch(); let body = await res.text();
    if (bump) body = body.replace(/IT\.VERSION = '([\d.]+)'/, "IT.VERSION = '99.0'");
    route.fulfill({ response: res, body });
  });
  p.on('load', () => loads++);
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(800);
  const v0 = await p.evaluate(() => IT.VERSION);
  // aynı sürüm: yenilenmez
  await p.evaluate(() => IT.checkUpdate()); await p.waitForTimeout(1500);
  console.log('aynı sürümde yenilendi mi:', loads > 1);
  // pencere açıkken yeni sürüm: pencere kapanana kadar bekler
  bump = true;
  await p.click('#btnSettings'); await p.waitForTimeout(200);
  await p.evaluate(() => IT.checkUpdate()); await p.waitForTimeout(800);
  console.log('bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-90));
  await p.waitForTimeout(5000);
  console.log('pencere açıkken yenilendi mi:', loads > 1);
  await p.screenshot({ path: process.env.SP + '/update_wait.png' });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(6000);
  console.log('pencere kapanınca yenilendi mi:', loads > 1, '| sürüm', v0, '→', await p.evaluate(() => IT.VERSION));
  console.log('kredi korundu mu:', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).credits >= 1234));
  // yenilemeden sonra yine aynı (önbellekteki) eski sürüm gelirse ikinci kez denemez
  bump = true; const l1 = loads;
  await p.evaluate(() => { IT.VERSION = '1.0'; IT.checkUpdate(); }); await p.waitForTimeout(6500);
  console.log('aynı sürüm için ikinci kez yenilendi mi:', loads > l1);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
