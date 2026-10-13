// Ateşböceği Yolu (v1.59): 12. eve dönüş on üçüncü rotayı açar; bu rotada gece çimenlerde ateşböcekleri yanıp söner,
// ara sıra bir ateşböceği sürüsü toplanır (gece iki kat sık). Dokununca Ateşböceği Işığı (hız ×2, tıklama ×3) gelir, ışıklar
// etki süresince yolcunun omzunda bir bulut olur ve Yol Defteri'nde sayılır. Başka rotada ne sürü ne gece ışıkları var.
// Yedinci sürü Işık Taşıyıcı kıyafetini açar (v1.62). Ekran görüntüleri: gece, gündüz, telefon (320 px) ve uçan araç,
// kıyafet listesi, rota seçimi.
const pw = require('./lib/pw'), { chromium } = pw;
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
const save = extra => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 30,
  trips: 12, memories: 120, route: 'firefly', player: undefined }, extra || {}));
async function open(b, extra, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(hook);
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(extra));
  await p.goto(pw.url()); await p.waitForFunction(() => window.__sc, null, { timeout: 45000 }); await p.waitForTimeout(900);
  return p;
}
// sürünün ortasına dokun
const tap = async p => {
  const c = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), s = __sc.swarm; return { x: r.left + s.x * __sc.zoom, y: r.top + s.y * __sc.zoom }; });
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(300);
};
const saved = p => p.evaluate(() => { window.dispatchEvent(new Event('pagehide')); return JSON.parse(localStorage.getItem('idle-traveler-save-v1')); });
(async () => {
  const b = await chromium.launch(); const errs = [];
  pw.speed(20); // olay zamanlayıcıları 20 kat hızlı (doğal geliş beklenir)
  // 1) gece: çimenlerde ateşböcekleri, sürü kendiliğinden gelir
  const p = await open(b, { settings: { sky: 'night' } });
  let seen = false;
  for (let i = 0; i < 60 && !seen; i++) { await p.waitForTimeout(500); seen = await p.evaluate(() => !!__sc.swarm); }
  console.log('gece ışıkları açık mı:', await p.evaluate(() => __sc.fireflyAmb), '· sürü kendiliğinden geldi mi:', seen, '· bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-60));
  await p.evaluate(() => { window.__testSpeed && __testSpeed(1); __sc.bird = __sc.cranes = __sc.gift = __sc.star = __sc.seed = __sc.constel = __sc.plane = null; });
  if (!seen) await p.evaluate(() => __sc.spawnSwarm());
  await p.waitForTimeout(1500);
  await p.screenshot({ path: process.env.SP + '/fireflies_night.png', clip: { x: 0, y: 55, width: 760, height: 705 } });
  const c0 = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks);
  await tap(p);
  console.log('dokununca bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-70));
  await p.waitForTimeout(2200);
  const st = await saved(p);
  console.log('etki:', await p.evaluate(() => (document.querySelector('[data-fx="glow"]') || {}).textContent || '(yok)'), '· sayaç:', st.fireflies,
    '· omuzda ışık:', (await p.evaluate(() => __sc.glowA)) > 0.8, '· sürü gitti mi:', await p.evaluate(() => !__sc.swarm), '· dokunuş adım saydı mı:', st.clicks > c0);
  await p.screenshot({ path: process.env.SP + '/fireflies_glow.png', clip: { x: 0, y: 55, width: 760, height: 705 } });
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
  console.log('defter:', ((await p.textContent('#pane-journal')).match(/Eşlik eden ateşböcekleri\s*\d+/) || ['(yok)'])[0].replace(/\s+/g, ' '));
  // ikinci dokunuş sayılmaz (sürü yok)
  await p.evaluate(() => __sc.spawnSwarm()); await p.waitForTimeout(800); await tap(p); await tap(p); await p.waitForTimeout(300);
  console.log('ikinci sürü bir kez mi sayıldı:', (await saved(p)).fireflies === 2);
  errs.push(...p.errs); await p.close();
  // 2) gündüz: gece ışıkları yok, sürü yine gelebilir ve görünür
  const d = await open(b, { settings: { sky: 'day' } });
  await d.evaluate(() => { window.__testSpeed && __testSpeed(1); __sc.spawnSwarm(); }); await d.waitForTimeout(1500);
  console.log('gündüz gece ışıkları:', await d.evaluate(() => __sc.nightAmt < 0.3 ? 'gizli' : 'görünür'));
  await d.screenshot({ path: process.env.SP + '/fireflies_day.png', clip: { x: 0, y: 55, width: 760, height: 705 } });
  errs.push(...d.errs); await d.close();
  // 3) telefon (320 px), gece, uçan araç: omuzdaki ışık aracın üstünde
  const q = await open(b, { settings: { sky: 'night' }, owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, moto: 1, car: 1, van: 1, train: 1, balloon: 1 }, active: 'balloon',
    effects: [{ id: 'glow', until: Date.now() + 60000, stack: 1 }] }, { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  await q.evaluate(() => { window.__testSpeed && __testSpeed(1); __sc.spawnSwarm(); }); await q.waitForTimeout(2500);
  console.log('telefon: yeniden açılışta omuzda ışık:', (await q.evaluate(() => __sc.glowA)) > 0.8, '· sayfa taşıyor mu:', await q.evaluate(() => document.scrollingElement.scrollWidth > innerWidth));
  await q.screenshot({ path: process.env.SP + '/fireflies_phone.png' });
  errs.push(...q.errs); await q.close();
  // 4) başka rotada sürü ve gece ışıkları yok
  const o = await open(b, { route: 'crane', settings: { sky: 'night' } });
  await o.evaluate(() => { let c = 0; const f = __sc.spawnSwarm.bind(__sc); __sc.spawnSwarm = () => { c++; f(); }; window.__cn = () => c; });
  await o.waitForTimeout(6000); /* hızlandırılmış: ~120 sn oyun zamanı */
  console.log('Turna Yolu’nda sürü (120 sn):', await o.evaluate(() => window.__cn()), '· gece ışıkları:', await o.evaluate(() => __sc.fireflyAmb));
  errs.push(...o.errs); await o.close();
  pw.speed(0); // olay zamanlayıcıları normal
  // 5) eski kayıt (sayaç yok) ve bozuk sayaç
  const e = await open(b, { route: 'anatolia', trips: 0, fireflies: 'abc' });
  const es = await saved(e);
  console.log('bozuk sayaç:', es.fireflies, '· defterde satır var mı:', await e.evaluate(() => /ateşböce/i.test(document.querySelector('#pane-journal').textContent)));
  errs.push(...e.errs); await e.close();
  // 5b) yedinci sürü Işık Taşıyıcı kıyafetini açar; defterde sayaç ve 320 px'te kıyafet listesi
  const k = await open(b, { fireflies: 6, settings: { sky: 'night' } }, { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  await k.click('.tab[data-id="journal"]'); await k.waitForTimeout(400);
  const lock = await k.$eval('[data-act="outfit"][data-id="glow"]', e => e.innerText.replace(/\s+/g, ' '));
  await k.keyboard.press('Escape'); await k.waitForTimeout(500); // alttan açılan sayfa kapanır
  await k.evaluate(() => { __sc.bird = __sc.cranes = __sc.gift = __sc.star = __sc.seed = __sc.constel = __sc.plane = null; __sc.spawnSwarm(); }); await k.waitForTimeout(800);
  console.log('sayfa kapandı mı:', await k.evaluate(() => !document.documentElement.classList.contains('sheet-open')));
  await tap(k); await k.waitForTimeout(1300);
  console.log('kıyafet (6/7):', lock, '· yedinci sürü bildirimi:', /Ateşböcekleri seni tanıdı/.test(await k.textContent('#toasts')));
  await k.click('.tab[data-id="journal"]'); await k.waitForTimeout(400);
  console.log('kıyafet açıldı mı:', await k.$eval('[data-act="outfit"][data-id="glow"]', e => !e.disabled && e.innerText.replace(/\s+/g, ' ')));
  await k.click('[data-act="outfit"][data-id="glow"]'); await k.waitForTimeout(300);
  await k.$eval('[data-act="outfit"][data-id="glow"]', e => e.scrollIntoView({ block: 'center' })); await k.waitForTimeout(300);
  console.log('kıyafet listesinde taşma:', await k.$$eval('.outfit b, .outfit small', l => l.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent).join(' | ') || 'yok'));
  await k.screenshot({ path: process.env.SP + '/fireflies_outfit.png' });
  await k.keyboard.press('Escape'); await k.waitForTimeout(600);
  await k.screenshot({ path: process.env.SP + '/fireflies_outfit_scene.png' });
  errs.push(...k.errs); await k.close();
  // 6) 12. eve dönüş on üçüncü rotayı açar
  const h = await open(b, { trips: 11, route: 'migrate', routeMax: 11, distance: 5e13, regionIdx: 0 });
  await h.click('.tab[data-id="buffs"]'); await h.waitForTimeout(300);
  await h.$eval('.home-btn', e => e.scrollIntoView({ block: 'center' }));
  await h.click('.home-btn'); await h.waitForTimeout(200); await h.click('.home-btn'); await h.waitForTimeout(500);
  console.log('dönüş penceresi:', ((await h.textContent('#modalBody')).replace(/\s+/g, ' ').trim().match(/Yeni rota açıldı: [^.]*\./) || ['(yok)'])[0]);
  console.log('rotalar:', await h.$$eval('#modalBody .route-btn b', l => l.length + ' · son: ' + l[l.length - 1].textContent));
  await h.screenshot({ path: process.env.SP + '/fireflies_home.png' });
  errs.push(...h.errs); await h.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
