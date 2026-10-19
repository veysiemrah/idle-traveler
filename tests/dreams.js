// Bulut Yolu (v1.64): 13. eve dönüş on dördüncü rotayı açar; bu rotada ara sıra bir şeye benzeyen bulut süzülür
// (tavşan, balina, kalp, kuzu, güvercin, yelkenli). Dokununca bulut canlanıp dağılır, Bulut Hayali (hız ×2, kredi ×2) gelir
// ve biçim Yol Defteri'ndeki Bulut Hayalleri'ne yazılır. Altısı görülünce hayaller kalıcı olarak 1,5 kat uzun sürer.
// Ekran görüntüleri: gündüz her biçim, canlanma, gece, telefon (320 px, koyu), defter.
const pw = require('./lib/pw'), { chromium } = pw;
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
const save = extra => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 30,
  trips: 13, memories: 130, route: 'cloud', player: undefined }, extra || {}));
async function open(b, extra, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(hook);
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(extra));
  await p.goto(pw.url()); await p.waitForFunction(() => window.__sc, null, { timeout: 45000 }); await p.waitForTimeout(900);
  return p;
}
const quiet = p => p.evaluate(() => { window.__testSpeed && __testSpeed(1); __sc.bird = __sc.cranes = __sc.gift = __sc.star = __sc.seed = __sc.constel = __sc.plane = null; });
const spawn = (p, id) => p.evaluate(id => { __sc.spawnDream(id); __sc.dream.x = __sc.W * 0.55; }, id);
const tap = async p => {
  const c = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), d = __sc.dream; return { x: r.left + d.x * __sc.zoom, y: r.top + d.y * __sc.zoom }; });
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(300);
};
const saved = p => p.evaluate(() => { window.dispatchEvent(new Event('pagehide')); return JSON.parse(localStorage.getItem('idle-traveler-save-v1')); });
const toasts = async p => (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();
const SHAPES = ['rabbit', 'whale', 'heart', 'sheep', 'bird', 'ship'];
(async () => {
  const b = await chromium.launch(); const errs = [];
  pw.speed(20); // olay zamanlayıcıları 20 kat hızlı (doğal geliş beklenir)
  // 1) gündüz: bulut kendiliğinden gelir; her biçimin ekran görüntüsü
  const p = await open(b, { settings: { sky: 'day' } });
  let seen = false;
  for (let i = 0; i < 60 && !seen; i++) { await p.waitForTimeout(500); seen = await p.evaluate(() => !!__sc.dream); }
  console.log('bulut kendiliğinden geldi mi:', seen, '· biçim:', await p.evaluate(() => __sc.dream && __sc.dream.id), '· bildirim:', (await toasts(p)).slice(-60));
  await quiet(p);
  for (const id of SHAPES) {
    await spawn(p, id); await p.waitForTimeout(1700);
    await p.screenshot({ path: `${process.env.SP}/dreams_${id}.png`, clip: { x: 0, y: 55, width: 760, height: 420 } });
  }
  const c0 = (await saved(p)).clicks;
  await tap(p);
  console.log('dokununca bildirim:', (await toasts(p)).slice(-90));
  await p.waitForTimeout(250);
  await p.screenshot({ path: process.env.SP + '/dreams_alive.png', clip: { x: 0, y: 55, width: 760, height: 420 } });
  await p.waitForTimeout(2400);
  const st = await saved(p);
  console.log('etki:', await p.evaluate(() => (document.querySelector('[data-fx="dream"]') || {}).textContent || '(yok)'), '· kayıt:', JSON.stringify(st.dreams),
    '· bulut gitti mi:', await p.evaluate(() => !__sc.dream), '· dokunuş adım saydı mı:', st.clicks > c0);
  // ikinci dokunuş sayılmaz (bulut yok); aynı biçim ikinci kez
  await spawn(p, 'ship'); await p.waitForTimeout(1000); await tap(p); await tap(p); await p.waitForTimeout(300);
  console.log('ikinci bulut bir kez mi sayıldı:', (await saved(p)).dreams.ship === 2, '· bildirim:', (await toasts(p)).slice(-60));
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(400);
  const jt = await p.textContent('#pane-journal');
  console.log('defter:', (jt.match(/Bulut Hayalleri\s*\d+\/\d+/) || ['(yok)'])[0].replace(/\s+/g, ' '), '· satır:', (jt.match(/Canlanan bulutlar\s*\d+/) || ['(yok)'])[0].replace(/\s+/g, ' '));
  await p.$eval('.dreams', e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
  await p.screenshot({ path: process.env.SP + '/dreams_journal.png' });
  errs.push(...p.errs); await p.close();
  // 2) gece
  const n = await open(b, { settings: { sky: 'night' } });
  await quiet(n); await spawn(n, 'whale'); await n.waitForTimeout(1700);
  await n.screenshot({ path: process.env.SP + '/dreams_night.png', clip: { x: 0, y: 55, width: 760, height: 420 } });
  errs.push(...n.errs); await n.close();
  // 3) telefon (320 px), koyu tema: bulut sahnede, dokunulabilir; altısı tamamlanınca süre uzar
  const q = await open(b, { settings: { sky: 'day' }, dreams: { rabbit: 1, whale: 2, heart: 1, sheep: 1, bird: 1 } }, { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  await quiet(q); await spawn(q, 'ship'); await q.waitForTimeout(1700);
  await q.screenshot({ path: process.env.SP + '/dreams_phone.png' });
  const inView = await q.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), d = __sc.dream, y = r.top + d.y * __sc.zoom; return y > r.top + 10 && y < r.bottom - 10; });
  await tap(q); await q.waitForTimeout(1400);
  const qs = await saved(q);
  const fx = qs.effects.find(e => e.id === 'dream');
  console.log('telefon: bulut sahnede mi:', inView, '· altısı tamam bildirimi:', /Bütün bulut biçimlerini gördün/.test(await toasts(q)),
    '· süre ~45 sn mi:', !!fx && Math.round((fx.until - Date.now()) / 1000) > 40, '· sayfa taşıyor mu:', await q.evaluate(() => document.scrollingElement.scrollWidth > innerWidth));
  await q.click('.tab[data-id="journal"]'); await q.waitForTimeout(500);
  await q.$eval('.dreams', e => e.scrollIntoView({ block: 'center' })); await q.waitForTimeout(400);
  console.log('defterde taşma:', await q.$$eval('.dreams .keep b, .dreams .keep small', l => l.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent).join(' | ') || 'yok'),
    '· ipucu:', (await q.textContent('#pane-journal')).includes('Bütün biçimler görüldü'));
  await q.screenshot({ path: process.env.SP + '/dreams_phone_journal.png' });
  errs.push(...q.errs); await q.close();
  // 4) başka rotada bulut yok
  const o = await open(b, { route: 'firefly' });
  await o.evaluate(() => { let c = 0; const f = __sc.spawnDream.bind(__sc); __sc.spawnDream = id => { c++; f(id); }; window.__cn = () => c; });
  await o.waitForTimeout(6000); /* hızlandırılmış: ~120 sn oyun zamanı */
  console.log('Ateşböceği Yolunda bulut (120 sn):', await o.evaluate(() => window.__cn()));
  errs.push(...o.errs); await o.close();
  pw.speed(0);
  // 5) eski kayıt (alan yok) ve bozuk alan; 13 dönüşlü kayıtta rota seçicide açık
  const e = await open(b, { route: 'anatolia', trips: 0, dreams: { rabbit: 'x', ghost: 3, whale: -2, heart: 2.7 } });
  console.log('bozuk alan temizlendi mi:', JSON.stringify((await saved(e)).dreams));
  errs.push(...e.errs); await e.close();
  const r = await open(b, { route: 'anatolia', trips: 13, routeMax: 12, distance: 0, regionIdx: 0 });
  await r.click('.tab[data-id="garage"]').catch(() => {}); await r.waitForTimeout(400);
  console.log('rota seçicide Bulut Yolu:', await r.evaluate(() => { const b = document.querySelector('[data-act="route"][data-id="cloud"]'); return b ? (b.disabled ? 'kilitli' : 'açık') : '(yok)'; }));
  errs.push(...r.errs); await r.close();
  console.log('sayfa hataları:', errs.length ? errs : 'yok');
  await b.close();
})();
