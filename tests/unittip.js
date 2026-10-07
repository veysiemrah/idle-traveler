// Büyük birimlerin açıklaması (v1.34): mesafe AB'ye geçince bir kez bildirim (yeniden açılışta tekrarlamaz), sahnedeki mesafeye
// dokununca açıklama (adım sayılmaz), ışık yılında ayrı bildirim, imparatorluk biriminde mil. Masaüstü, telefon, koyu tema.
const { chromium } = require('./lib/pw');
const save = (dist, extra) => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: dist, msIdx: 99, regionIdx: 0 }, extra || {}));
async function open(b, data, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, data);
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
  return p;
}
const toasts = p => p.textContent('#toasts').then(x => x.replace(/\s+/g, ' ').trim());
(async () => {
  const b = await chromium.launch(); const errs = [];
  // 1) AB'ye yeni geçen oyuncu
  const p = await open(b, save(1.2e11));
  console.log('mesafe:', await p.textContent('#hudDist'), '| bildirim:', (await toasts(p)).match(/Yol artık AB[^.]*\./) ? 'var' : '(yok)');
  console.log('üstüne gelince:', await p.getAttribute('#hudDist', 'title'));
  await p.screenshot({ path: process.env.SP + '/unit_au.png', clip: { x: 0, y: 55, width: 760, height: 300 } });
  const c0 = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks);
  await p.waitForTimeout(4200);
  await p.click('#hudDist'); await p.waitForTimeout(300);
  const tapped = (await toasts(p)).includes('astronomi birimi');
  await p.waitForTimeout(5500);
  console.log('dokununca açıklama:', tapped, '| adım sayıldı mı:', (await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks)) !== c0,
    '| kayıt:', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).unitTip));
  await p.reload(); await p.waitForTimeout(1200);
  console.log('yeniden açılınca bildirim tekrarlandı mı:', (await toasts(p)).includes('Yol artık AB'));
  errs.push(...p.errs); await p.close();
  // 2) ışık yılı, ABD (mil), telefon, koyu tema
  const q = await open(b, save(1.2e15, { unitTip: 1 }), { locale: 'en-US', viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  console.log('mesafe:', await q.textContent('#hudDist'), '| bildirim:', ((await toasts(q)).match(/light-years · [^.]*\./) || ['(yok)'])[0]);
  await q.tap('#hudDist'); await q.waitForTimeout(400);
  console.log('dokununca:', ((await toasts(q)).match(/1 light-year is[^.]*\./) || ['(yok)'])[0]);
  await q.screenshot({ path: process.env.SP + '/unit_ly_phone.png' });
  errs.push(...q.errs); await q.close();
  // 3) küçük mesafede işaret ve dokunma yok
  const r = await open(b, save(5000));
  console.log('5 km: işaret var mı:', await r.$eval('#hudDist', e => e.classList.contains('unit-tip')), '| bildirim:', (await toasts(r)).includes('AB'));
  errs.push(...r.errs); await r.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
