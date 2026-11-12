// Ezgi Yolu (v1.66): 14. eve dönüş on beşinci rotayı açar; bu rotada rüzgâr ara sıra dört notalık bir şerit taşır.
// Dokunulan nota yanar ve şerit bekler; dördü de yanınca ezgi çalar, Yol Türküsü (kredi ×2, tıklama ×3) gelir ve ezgi
// Yol Defteri'ndeki Ezgi Defteri'ne yazılır (dokununca yeniden çalar). Altısı öğrenilince türküler 1,5 kat uzun sürer.
// Ekran görüntüleri: gündüz şerit, yarısı yanmış, ezgi çalarken, gece, telefon (320 px, koyu), defter.
const pw = require('./lib/pw'), { chromium } = pw;
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
const save = extra => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 30,
  trips: 14, memories: 140, route: 'melody', routeMax: 14, player: undefined }, extra || {}));
async function open(b, extra, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(hook);
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(extra));
  await p.goto(pw.url()); await p.waitForFunction(() => window.__sc, null, { timeout: 45000 }); await p.waitForTimeout(900);
  return p;
}
const quiet = p => p.evaluate(() => { window.__testSpeed && __testSpeed(1); __sc.bird = __sc.cranes = __sc.gift = __sc.star = __sc.seed = __sc.constel = __sc.plane = null; });
const spawn = (p, id) => p.evaluate(id => {
  const c = IT.TUNES.find(x => x.id === id); let at = 0.55;
  __sc.spawnTune(id, c.n.slice(0, 4), c.d.map(b => { const w = at; at += b * 0.27; return w; }));
  __sc.tune.x = __sc.W * 0.55; __sc.tune.t = 2;
}, id);
const tapNote = async (p, i) => {
  const c = await p.evaluate(i => { const r = __sc.canvas.getBoundingClientRect(), u = __sc.tune, q = __sc.tunePos(u, u.n[i]); return { x: r.left + q.x * __sc.zoom, y: r.top + (q.y - 6 * u.s) * __sc.zoom }; }, i);
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(250);
};
const saved = p => p.evaluate(() => { window.dispatchEvent(new Event('pagehide')); return JSON.parse(localStorage.getItem('idle-traveler-save-v1')); });
const toasts = async p => (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();
(async () => {
  const b = await chromium.launch(); const errs = [];
  pw.speed(20); // olay zamanlayıcıları 20 kat hızlı (doğal geliş beklenir)
  // 1) gündüz: şerit kendiliğinden gelir, ipucu bildirimi çıkar
  const p = await open(b, { settings: { sky: 'day' } });
  await p.waitForFunction(() => __sc.tune, null, { timeout: 30000 });
  await quiet(p);
  console.log('şerit kendiliğinden geldi:', await p.evaluate(() => __sc.tune.n.length), 'nota · ipucu:', /nota taşıyor/.test(await toasts(p)));
  await p.evaluate(() => { __sc.tune.x = __sc.W * 0.55; __sc.tune.t = 2; }); await p.waitForTimeout(400);
  await p.screenshot({ path: process.env.SP + '/tunes_day.png' });
  // 2) notalara dokun: ilk dokunuşta nota yanar, şerit bekler; adım sayılmaz
  const id = await p.evaluate(() => __sc.tune.id), clicks0 = (await saved(p)).clicks;
  await tapNote(p, 1);
  const x1 = await p.evaluate(() => __sc.tune.x); await p.waitForTimeout(1500);
  const x2 = await p.evaluate(() => __sc.tune.x);
  console.log('ilk nota yandı:', await p.evaluate(() => __sc.tune.n.filter(q => q.lit).length), '· şerit bekliyor:', Math.abs(x1 - x2) < 3,
    '· etki henüz yok:', !(await saved(p)).effects.some(e => e.id === 'tune'), '· adım sayıldı mı:', (await saved(p)).clicks !== clicks0);
  await tapNote(p, 1); // yanmış notaya yeniden dokunmak yalnızca notayı çalar
  await tapNote(p, 0);
  await p.screenshot({ path: process.env.SP + '/tunes_half.png' });
  console.log('yanan nota (aynısına iki kez dokununca):', await p.evaluate(() => __sc.tune.n.filter(q => q.lit).length));
  await tapNote(p, 2); await tapNote(p, 3);
  const st = await saved(p), fx = st.effects.find(e => e.id === 'tune');
  console.log('ezgi öğrenildi:', st.tunes[id] === 1, '· etki:', !!fx, fx ? Math.round((fx.until - Date.now()) / 1000) + ' sn' : '', '· bildirim:', /Yeni bir ezgi/.test(await toasts(p)));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: process.env.SP + '/tunes_play.png' });
  console.log('etki rozeti:', await p.$$eval('.fx-tune', e => e.length));
  await p.waitForTimeout(4500);
  console.log('şerit solup gitti:', await p.evaluate(() => !__sc.tune));
  // 3) defter: Ezgi Defteri, öğrenilen ezgi ve beş "?"; dokununca çalar
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(400);
  const cards = await p.$$eval('.keeps.tunes .keep', els => ({ n: els.length, on: els.filter(e => e.classList.contains('on')).length }));
  await p.$eval('.keeps.tunes', e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
  await p.click('.keeps.tunes .keep.on'); await p.waitForTimeout(350);
  console.log('defter:', cards.on + '/' + cards.n, '· dokununca çalıyor:', await p.$eval('.keeps.tunes .keep.on', e => e.classList.contains('play')),
    '· sayaç satırı:', /Çalınan ezgiler/.test(await p.textContent('#pane-journal')));
  await p.screenshot({ path: process.env.SP + '/tunes_journal.png' });
  errs.push(...p.errs); await p.close();
  pw.speed(0);

  // 4) altıncı ezgi: türküler 1,5 kat uzun; gece görünümü
  const n = await open(b, { settings: { sky: 'night' }, tunes: { dawn: 1, meadow: 2, lullaby: 1, sea: 1, steppe: 1 } });
  await quiet(n); await spawn(n, 'star'); await n.waitForTimeout(500);
  await tapNote(n, 0); await tapNote(n, 3);
  await n.screenshot({ path: process.env.SP + '/tunes_night.png' });
  await tapNote(n, 1); await tapNote(n, 2);
  const ns = await saved(n), nfx = ns.effects.find(e => e.id === 'tune');
  await n.waitForTimeout(3900);
  console.log('altıncı ezgi:', ns.tunes.star === 1, '· süre:', nfx ? Math.round((nfx.until - Date.now()) / 1000 + 4.2) + ' sn' : 'yok', '· bildirim:', /Bütün ezgileri/.test(await toasts(n)));
  errs.push(...n.errs); await n.close();

  // 5) telefon (320 px), koyu tema: şerit ekrana sığar, notalara dokunulur, defterde taşma yok
  const q = await open(b, { settings: { sky: 'day' }, tunes: { dawn: 1, meadow: 2, lullaby: 1, sea: 1, steppe: 1, star: 3 } },
    { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  await quiet(q); await spawn(q, 'sea'); await q.evaluate(() => { __sc.tune.x = __sc.W * 0.5; }); await q.waitForTimeout(500);
  const span = await q.evaluate(() => { const u = __sc.tune, a = __sc.tunePos(u, u.n[0]), z = __sc.tunePos(u, u.n[3]); return { l: Math.round(a.x * __sc.zoom), r: Math.round(z.x * __sc.zoom), w: innerWidth }; });
  await q.screenshot({ path: process.env.SP + '/tunes_phone.png' });
  for (const i of [0, 1, 2, 3]) await tapNote(q, i);
  console.log('telefon: şerit', span.l, '–', span.r, '/', span.w, '· ezgi çaldı:', (await saved(q)).tunes.sea === 2);
  await q.waitForTimeout(900);
  await q.click('.tab[data-id="journal"]'); await q.waitForTimeout(500);
  await q.$eval('.keeps.tunes', e => e.scrollIntoView({ block: 'center' })); await q.waitForTimeout(400);
  const over = await q.$$eval('.keeps.tunes .keep b', els => els.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim()).join(' | ') || 'yok');
  console.log('telefon defter taşma:', over, '· sayfa taşıyor mu:', await q.evaluate(() => document.scrollingElement.scrollWidth > innerWidth));
  await q.screenshot({ path: process.env.SP + '/tunes_phone_journal.png' });
  errs.push(...q.errs); await q.close();

  // 6) başka rotada şerit gelmez; bozuk ve eski kayıt; rota seçicide açık/kilitli
  pw.speed(20);
  const o = await open(b, { route: 'cloud', settings: { sky: 'day' }, tunes: { dawn: 'x', bogus: 3, sea: -2, star: 4.7 } });
  await o.waitForTimeout(6000);
  const os = await saved(o);
  console.log('başka rotada şerit:', await o.evaluate(() => !!__sc.tune), '· bozuk kayıt temizlendi:', JSON.stringify(os.tunes));
  errs.push(...o.errs); await o.close();
  pw.speed(0);
  for (const trips of [13, 14]) {
    const r = await open(b, { route: 'anatolia', trips, routeMax: 13, distance: 0, regionIdx: 0, tunes: undefined });
    await r.click('.tab[data-id="buffs"]').catch(() => {}); await r.waitForTimeout(400);
    console.log(`${trips} dönüşte rota seçicide Ezgi Yolu:`, await r.evaluate(() => { const b = document.querySelector('[data-act="route"][data-id="melody"]'); return b ? (b.disabled ? 'kilitli' : 'açık') : '(yok)'; }),
      '· eski kayıtta alan:', JSON.stringify((await saved(r)).tunes));
    errs.push(...r.errs); await r.close();
  }
  console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'no errors');
  await b.close();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
