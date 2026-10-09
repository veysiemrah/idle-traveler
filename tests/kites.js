// Uçurtma Yolu (v1.42): 10. eve dönüş on birinci rotayı açar; bu rotada ipi kopmuş bir uçurtma ara sıra gökyüzünde süzülür,
// dokununca Uçurtma Neşesi (kredi ×3) gelir ve uçurtma etki süresince yolcuya bağlı uçar; etki bitince ipi bırakıp uzaklaşır.
// Yeniden açılışta etki sürüyorsa uçurtma yerinde belirir. Başka rotada uçurtma gelmez.
// Ekran görüntüleri: gündüz (serbest ve bağlı), gece, telefon (320 px), uçan araçta, dönüş penceresi.
const { chromium } = require('./lib/pw');
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
const save = extra => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 30,
  trips: 10, memories: 140, route: 'kite', player: undefined }, extra || {}));
async function open(b, extra, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(hook);
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(extra));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => window.__sc, null, { timeout: 15000 }); await p.waitForTimeout(900);
  return p;
}
// uçurtmanın gövdesine dokun (sahne koordinatı → sayfa)
const tap = async p => {
  const c = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), q = __sc.kite, s = 16 * Math.max(__sc.k, 0.8); return { x: r.left + q.x * __sc.zoom, y: r.top + (q.y + 0.3 * s) * __sc.zoom }; });
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(300);
};
const mode = p => p.evaluate(() => __sc.kite ? __sc.kite.mode : '(yok)');
(async () => {
  const b = await chromium.launch(); const errs = [];
  // 1) gündüz: kendiliğinden gelir (ilk uçurtma 35–65 sn)
  const p = await open(b, { settings: { sky: 'day' } });
  let seen = false;
  for (let i = 0; i < 90 && !seen; i++) { await p.waitForTimeout(1000); seen = await p.evaluate(() => !!__sc.kite); }
  console.log('uçurtma kendiliğinden geldi mi:', seen, '· bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-60));
  if (!seen) await p.evaluate(() => __sc.spawnKite());
  await p.waitForTimeout(5000);
  await p.screenshot({ path: process.env.SP + '/kite_free.png', clip: { x: 0, y: 55, width: 760, height: 620 } });
  await tap(p);
  console.log('yakalandı mı:', await mode(p), '· bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-90));
  console.log('etki:', await p.evaluate(() => (document.querySelector('[data-fx="kite"]') || {}).textContent || '(yok)'));
  await p.waitForTimeout(3500);
  await p.screenshot({ path: process.env.SP + '/kite_tied.png', clip: { x: 0, y: 55, width: 760, height: 620 } });
  const near = await p.evaluate(() => { const a = __sc.kiteAnchor(), q = __sc.kite; return Math.round(Math.hypot(q.x - a.x, q.y - a.y) / __sc.k); });
  console.log('bağlı uçurtma yolcuya yakın mı (k=1 px):', near, near < 220);
  console.log('uçurtma sayısı (kayıt):', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).kites));
  // yeniden açılış: etki sürüyorsa uçurtma yerinde belirir
  await p.evaluate(() => dispatchEvent(new Event('pagehide')));
  await p.reload(); await p.waitForTimeout(1500);
  console.log('yeniden açılışta:', await mode(p));
  // süresi dolmuş etkiyle açılan oyunda uçurtma görünmez
  const x = await open(b, { settings: { sky: 'day' }, effects: [{ id: 'kite', until: Date.now() - 1000, stack: 1 }] });
  await x.waitForTimeout(600);
  console.log('süresi dolmuş etkiyle uçurtma:', await mode(x));
  errs.push(...x.errs); await x.close();
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
  console.log('defter:', await p.$$eval('#pane-journal .statgrid div', l => l.map(d => d.textContent.trim()).filter(x => /uçurtma/i.test(x)).join(' | ') || '(yok)'));
  errs.push(...p.errs); await p.close();

  // 2) bırakma animasyonu: bağlıyken etki biter → gone, birkaç saniyede kaybolur
  const g = await open(b, { settings: { sky: 'day' } });
  await g.evaluate(() => { __sc.spawnKite(); __sc.kite.t = 1; __sc.kite.x = __sc.W * 0.6; });
  await tap(g); await g.waitForTimeout(800);
  // etkinin bitişi: oyun her karede kiteOn verir; burada sahneye hep "etki yok" denir
  await g.evaluate(() => Object.defineProperty(__sc, 'kiteOn', { get: () => false, set: () => {} }));
  await g.waitForTimeout(300);
  console.log('etki bitince:', await mode(g));
  await g.waitForTimeout(1000);
  await g.screenshot({ path: process.env.SP + '/kite_gone.png', clip: { x: 0, y: 55, width: 760, height: 620 } });
  await g.waitForTimeout(2500);
  console.log('uzaklaştıktan sonra:', await mode(g));
  errs.push(...g.errs); await g.close();

  // 3) gece ve koyu tema; uçan araçta (balon) bağlı uçurtma
  const n = await open(b, { settings: { sky: 'night' } }, { colorScheme: 'dark' });
  await n.evaluate(() => __sc.spawnKite()); await n.waitForTimeout(5000);
  await n.screenshot({ path: process.env.SP + '/kite_night.png', clip: { x: 0, y: 55, width: 760, height: 620 } });
  await tap(n); await n.waitForTimeout(3500);
  await n.screenshot({ path: process.env.SP + '/kite_night_tied.png', clip: { x: 0, y: 55, width: 760, height: 620 } });
  errs.push(...n.errs); await n.close();
  const f = await open(b, { owned: { walk: 1, plane: 1 }, active: 'plane', settings: { sky: 'day' } });
  await f.waitForTimeout(2500);
  await f.evaluate(() => { __sc.spawnKite(); __sc.kite.t = 1; __sc.kite.x = __sc.W * 0.6; });
  await tap(f); await f.waitForTimeout(4000);
  await f.screenshot({ path: process.env.SP + '/kite_plane.png', clip: { x: 0, y: 55, width: 760, height: 620 } });
  errs.push(...f.errs); await f.close();

  // 4) telefon (320 px): serbest uçurtma konum kartının altından geçer; bağlı uçurtma kartın arkasında kalmaz
  const q = await open(b, { settings: { sky: 'day' } }, { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  const under = await q.evaluate(() => {
    const hr = document.querySelector('.hud-card').getBoundingClientRect(), cr = __sc.canvas.getBoundingClientRect(), z = __sc.zoom;
    const inCard = (x, y) => { const px = cr.left + x * z, py = cr.top + y * z; return px > hr.left && px < hr.right && py > hr.top && py < hr.bottom; };
    let worst = 0;
    for (let n = 0; n < 50; n++) { __sc.spawnKite(); const c = __sc.kite; let hid = 0, all = 0; for (let t = 0; t < 18; t += 0.2) { c.t = t; c.x = __sc.W + 40 * Math.max(__sc.k, 0.8) + c.vx * t; __sc.kiteMove(c, 0); all++; if (inCard(c.x, c.y)) hid++; } worst = Math.max(worst, hid / all); }
    __sc.spawnKite(); __sc.kite.mode = 'tied';
    const g = __sc.kiteTarget(0);
    return { free: Math.round(worst * 100), tied: inCard(g.x, g.y) };
  });
  console.log('telefonda serbest uçurtmanın kartın arkasındaki payı (%):', under.free, '· bağlı uçurtma kartın arkasında mı:', under.tied);
  await q.waitForTimeout(4000);
  await q.screenshot({ path: process.env.SP + '/kite_phone.png' });
  errs.push(...q.errs); await q.close();

  // 5) başka rotada uçurtma gelmez
  const o = await open(b, { route: 'crane', settings: { sky: 'day' } });
  await o.evaluate(() => { let c = 0; const f = __sc.spawnKite.bind(__sc); __sc.spawnKite = () => { c++; f(); }; window.__kn = () => c; });
  await o.waitForTimeout(70000);
  console.log('Turna Yolu’nda uçurtma (70 sn):', await o.evaluate(() => window.__kn()));
  errs.push(...o.errs); await o.close();

  // 6) 10. eve dönüş on birinci rotayı açar
  const h = await open(b, { trips: 9, route: 'crane', distance: 3e12, regionIdx: 0 });
  await h.click('.tab[data-id="buffs"]'); await h.waitForTimeout(300);
  await h.$eval('.home-btn', e => e.scrollIntoView({ block: 'center' }));
  await h.click('.home-btn'); await h.waitForTimeout(200); await h.click('.home-btn'); await h.waitForTimeout(500);
  console.log('dönüş penceresi:', ((await h.textContent('#modalBody')).replace(/\s+/g, ' ').trim().match(/Yeni rota açıldı: [^.]*\./) || ['(yok)'])[0]);
  console.log('rotalar:', await h.$$eval('#modalBody .route-btn b', l => l.map(x => x.textContent).join(' | ')));
  await h.screenshot({ path: process.env.SP + '/kite_home.png' });
  errs.push(...h.errs); await h.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
