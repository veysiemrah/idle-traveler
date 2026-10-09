// Mektuplar (v1.39): kâğıt uçak kendiliğinden gelir, dokununca mektup açılır; Yol Defteri'nde zarflar, okunan mektup yeniden açılır;
// eşiği gelmemiş mektup gelmez; son mektup imzayı yolcunun adıyla atar ve Zamansız Gezgin kıyafetini açar.
// Ekran görüntüleri: gündüz/gece uçak, mektup penceresi (açık/koyu), telefon (320 px), defter.
const { chromium } = require('./lib/pw');
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
const save = o => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 30,
  player: { id: '11111111-2222-4333-8444-555555555555', key: 'a'.repeat(64), name: 'Deniz' }, settings: { sky: 'day' } }, o));
async function open(b, o, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(hook);
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(o));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => window.__sc, null, { timeout: 15000 }); await p.waitForTimeout(900);
  return p;
}
const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
const tap = async p => {
  const c = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), s = __sc.plane; return { x: r.left + s.x * __sc.zoom, y: r.top + s.y * __sc.zoom }; });
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(900);
};
const modal = p => p.evaluate(() => document.getElementById('modal').hidden ? '(kapalı)' : document.getElementById('modalBody').innerText.replace(/\s+/g, ' ').trim());
(async () => {
  const b = await chromium.launch(); const errs = [];
  // 1) kendiliğinden gelir (ilk mektup her zaman hazır) ve eşiği gelmemiş mektup gelmez
  const p = await open(b, {});
  const q = await open(b, { letters: 8, trips: 0, lifeDist: 0, distance: 5e7 });
  let seen = false, early = false;
  for (let i = 0; i < 125 && !seen; i++) { await p.waitForTimeout(1000); seen = await p.evaluate(() => !!__sc.plane); early = early || await q.evaluate(() => !!__sc.plane); }
  console.log('uçak kendiliğinden geldi mi:', seen, '· eşiği gelmemiş mektup geldi mi:', early);
  if (!seen) await p.evaluate(() => __sc.spawnPlane());
  await p.waitForTimeout(6500);
  await p.screenshot({ path: process.env.SP + '/letter_plane_day.png', clip: { x: 0, y: 55, width: 760, height: 520 } });
  await tap(p);
  console.log('pencere:', (await modal(p)).slice(0, 140));
  await p.screenshot({ path: process.env.SP + '/letter_modal_light.png' });
  console.log('okunan:', (await saved(p)).letters);
  await p.click('#modalBtn'); await p.waitForTimeout(400);
  // defter: zarflar, okunan mektup yeniden açılır
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(400);
  console.log('defter zarfları:', await p.evaluate(() => [...document.querySelectorAll('.keep.env')].map(e => e.classList.contains('on') ? 'açık' : 'kapalı').join(',')));
  await p.locator('.keep.env.on').first().scrollIntoViewIfNeeded();
  await p.screenshot({ path: process.env.SP + '/letter_journal.png' });
  await p.click('.keep.env.on'); await p.waitForTimeout(500);
  console.log('yeniden açılan:', (await modal(p)).slice(0, 60));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  console.log('Esc ile kapandı mı:', await p.evaluate(() => document.getElementById('modal').hidden));
  errs.push(...p.errs, ...q.errs); await p.close(); await q.close();
  // 2) gece, koyu tema: uçak ve son mektup (adla imza, kıyafet)
  const n = await open(b, { letters: 11, trips: 3, settings: { sky: 'night' } }, { colorScheme: 'dark' });
  await n.evaluate(() => __sc.spawnPlane()); await n.waitForTimeout(5000);
  await n.screenshot({ path: process.env.SP + '/letter_plane_night.png', clip: { x: 0, y: 55, width: 760, height: 520 } });
  await tap(n);
  console.log('son mektup:', (await modal(n)).slice(-80));
  await n.screenshot({ path: process.env.SP + '/letter_modal_dark.png' });
  await n.click('#modalBtn'); await n.waitForTimeout(600);
  console.log('bildirim:', (await n.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-80));
  await n.click('.tab[data-id="journal"]'); await n.waitForTimeout(400);
  console.log('kıyafet açık mı:', await n.evaluate(() => !document.querySelector('[data-act="outfit"][data-id="timeless"]').disabled));
  await n.click('[data-act="outfit"][data-id="timeless"]'); await n.waitForTimeout(300);
  console.log('giyilen:', (await saved(n)).settings.outfit, '· sonraki uçak:', await n.evaluate(() => !!__sc.plane));
  errs.push(...n.errs); await n.close();
  // 3) telefon (320 px): uzun Almanca mektup taşmasın
  const m = await open(b, { letters: 6, distance: 5e7, settings: { sky: 'day', lang: 'de' } }, { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, locale: 'de-DE' });
  await m.evaluate(() => __sc.spawnPlane()); await m.waitForTimeout(4500);
  await m.screenshot({ path: process.env.SP + '/letter_plane_phone.png' });
  await tap(m);
  console.log('telefon taşma:', await m.evaluate(() => { const c = document.querySelector('.modal-card'); return c.scrollWidth > c.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1; }));
  await m.screenshot({ path: process.env.SP + '/letter_modal_phone.png' });
  errs.push(...m.errs); await m.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
