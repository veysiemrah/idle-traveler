// Karahindiba tohumu (v1.31): gündüz kendiliğinden belirir, dokununca dilek sayılır (Rüzgâr Dileği: kredi ×10, harita parçası
// düşebilir); gece belirmez. Ekran görüntüleri: gündüz masaüstü, telefon.
const { chromium } = require('./lib/pw');
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
const save = sky => JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 30, settings: { sky } });
async function open(b, sky, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(hook);
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(sky));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(900);
  return p;
}
const tap = async p => {
  const c = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), s = __sc.seed; return { x: r.left + s.x * __sc.zoom, y: r.top + s.y * __sc.zoom }; });
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(300);
};
(async () => {
  const b = await chromium.launch(); const errs = [];
  // 1) gündüz: kendiliğinden belirir
  const p = await open(b, 'day');
  let seen = false;
  for (let i = 0; i < 100 && !seen; i++) { await p.waitForTimeout(1000); seen = await p.evaluate(() => !!__sc.seed); }
  console.log('gündüz kendiliğinden belirdi mi:', seen);
  if (!seen) await p.evaluate(() => __sc.spawnSeed());
  await p.waitForTimeout(3000);
  await p.screenshot({ path: process.env.SP + '/seed_day.png', clip: { x: 0, y: 55, width: 760, height: 520 } });
  const w0 = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).wishes || 0);
  await tap(p);
  console.log('bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-90));
  console.log('etki:', await p.evaluate(() => (document.querySelector('[data-fx="seed"]') || {}).textContent || '(yok)'));
  await p.screenshot({ path: process.env.SP + '/seed_caught.png', clip: { x: 0, y: 55, width: 760, height: 520 } });
  await p.waitForTimeout(5500);
  console.log('dilek sayısı:', w0, '→', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).wishes));
  errs.push(...p.errs); await p.close();
  // 2) gece: belirmez (kayan yıldız gelebilir)
  const n = await open(b, 'night');
  await n.waitForTimeout(1500);
  const before = await n.evaluate(() => { let c = 0; const o = __sc.spawnSeed.bind(__sc); __sc.spawnSeed = () => { c++; o(); }; window.__seedCount = () => c; return 0; });
  await n.waitForTimeout(90000);
  console.log('gecede tohum sayısı (90 sn):', await n.evaluate(() => window.__seedCount()));
  errs.push(...n.errs); await n.close();
  // 3) telefon
  const q = await open(b, 'day', { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  await q.evaluate(() => __sc.spawnSeed()); await q.waitForTimeout(4500);
  await q.screenshot({ path: process.env.SP + '/seed_phone.png' });
  errs.push(...q.errs); await q.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
