// Turna Yolu (v1.35): 9. eve dönüş onuncu rotayı açar; bu rotada gökyüzünden ara sıra V düzeninde turna sürüsü geçer,
// dokununca Turna Rüzgârı (hız ×3) gelir ve Yol Defteri'nde sayılır. Başka rotada turna gelmez.
// Ekran görüntüleri: gündüz, gece, telefon (320 px), rota seçimi.
const { chromium } = require('./lib/pw');
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
const save = extra => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 30,
  trips: 9, memories: 120, route: 'crane', player: undefined }, extra || {}));
async function open(b, extra, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(hook);
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(extra));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(900);
  return p;
}
// sürünün ortasındaki bir turnaya dokun
const tap = async p => {
  const c = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), q = __sc.cranePos(__sc.cranes, 1); return { x: r.left + (q.x + 6 * q.k) * __sc.zoom, y: r.top + q.y * __sc.zoom }; });
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(300);
};
(async () => {
  const b = await chromium.launch(); const errs = [];
  // 1) gündüz: kendiliğinden gelir (ilk sürü 35–65 sn)
  const p = await open(b, { settings: { sky: 'day' } });
  let seen = false;
  for (let i = 0; i < 90 && !seen; i++) { await p.waitForTimeout(1000); seen = await p.evaluate(() => !!__sc.cranes); }
  console.log('turnalar kendiliğinden geldi mi:', seen, '· bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-60));
  if (!seen) await p.evaluate(() => __sc.spawnCranes());
  await p.waitForTimeout(6000);
  await p.screenshot({ path: process.env.SP + '/cranes_day.png', clip: { x: 0, y: 55, width: 760, height: 520 } });
  await tap(p);
  console.log('bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-100));
  console.log('etki:', await p.evaluate(() => (document.querySelector('[data-fx="crane"]') || {}).textContent || '(yok)'));
  await p.waitForTimeout(400);
  await p.screenshot({ path: process.env.SP + '/cranes_caught.png', clip: { x: 0, y: 55, width: 760, height: 520 } });
  await p.waitForTimeout(1500);
  console.log('sürü gitti mi:', await p.evaluate(() => !__sc.cranes), '· ikinci dokunuş sayılmaz');
  await p.waitForTimeout(5000);
  console.log('turna sayısı (kayıt):', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).cranes));
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
  console.log('defter:', await p.$$eval('#pane-journal .statgrid div', l => l.map(d => d.textContent.trim()).filter(x => /Turna/.test(x)).join(' | ') || '(yok)'));
  errs.push(...p.errs); await p.close();
  // 2) gece ve koyu tema
  const n = await open(b, { settings: { sky: 'night' } }, { colorScheme: 'dark' });
  await n.evaluate(() => __sc.spawnCranes()); await n.waitForTimeout(7000);
  await n.screenshot({ path: process.env.SP + '/cranes_night.png', clip: { x: 0, y: 55, width: 760, height: 520 } });
  errs.push(...n.errs); await n.close();
  // 3) telefon (320 px)
  const q = await open(b, { settings: { sky: 'day' } }, { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  await q.evaluate(() => __sc.spawnCranes()); await q.waitForTimeout(7000);
  await q.screenshot({ path: process.env.SP + '/cranes_phone.png' });
  await q.click('.tab[data-id="buffs"]'); await q.waitForTimeout(300);
  await q.$eval('.card.home', e => e.scrollIntoView({ block: 'center' })); await q.waitForTimeout(200);
  await q.screenshot({ path: process.env.SP + '/cranes_routes_phone.png' });
  errs.push(...q.errs); await q.close();
  // 4) başka rotada turna gelmez
  const o = await open(b, { route: 'anatolia', settings: { sky: 'day' } });
  await o.evaluate(() => { let c = 0; const f = __sc.spawnCranes.bind(__sc); __sc.spawnCranes = () => { c++; f(); }; window.__cn = () => c; });
  await o.waitForTimeout(75000);
  console.log('Anadolu Yolu’nda turna (75 sn):', await o.evaluate(() => window.__cn()));
  errs.push(...o.errs); await o.close();
  // 5) 9. eve dönüş onuncu rotayı açar
  const h = await open(b, { trips: 8, route: 'lighthouse', distance: 7e11, regionIdx: 0 });
  await h.click('.tab[data-id="buffs"]'); await h.waitForTimeout(300);
  await h.$eval('.home-btn', e => e.scrollIntoView({ block: 'center' }));
  await h.click('.home-btn'); await h.waitForTimeout(200); await h.click('.home-btn'); await h.waitForTimeout(500);
  console.log('dönüş penceresi:', ((await h.textContent('#modalBody')).replace(/\s+/g, ' ').trim().match(/Yeni rota açıldı: [^.]*\./) || ['(yok)'])[0]);
  console.log('rotalar:', await h.$$eval('#modalBody .route-btn b', l => l.map(x => x.textContent).join(' | ')));
  await h.screenshot({ path: process.env.SP + '/cranes_home.png' });
  errs.push(...h.errs); await h.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
