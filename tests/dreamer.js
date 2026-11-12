// Hayalperest (v1.66): Bulut Yolu'nda altı biçimin hepsi görülünce kıyafet açılır; defterde adı, ipucu ve
// giyme durumu görünür. Onuncu Özel An bulut süzülürken kartpostala girer; altın çerçeve korunur.
// Ekran görüntüleri: defterde kıyafet, kartpostal, telefon (320 px, koyu).
const pw = require('./lib/pw'), { chromium } = pw;
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
const ALL6 = { rabbit: 1, whale: 2, heart: 1, sheep: 1, bird: 1, ship: 1 };
const ALL10 = { butterfly: 1, bird: 1, rainbow: 1, star: 1, plane: 1, dolphins: 1, fox: 1, aurora: 1, fireflies: 1, dream: 1 };
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
const spawn = (p, id) => p.evaluate(id => { __sc.spawnDream(id); __sc.dream.x = __sc.W * 0.55; __sc.dream.y = 150; __sc.dream.t = 2; }, id);
const tap = async p => {
  const c = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), d = __sc.dream; return { x: r.left + d.x * __sc.zoom, y: r.top + d.y * __sc.zoom }; });
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(300);
};
const saved = p => p.evaluate(() => { window.dispatchEvent(new Event('pagehide')); return JSON.parse(localStorage.getItem('idle-traveler-save-v1')); });
const toasts = async p => (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();
(async () => {
  const b = await chromium.launch(); const errs = [];

  // 1) Altıncı biçim: kıyafet açılır, defterde görünür ve giyilebilir
  const p = await open(b, { settings: { sky: 'day', outfit: 'classic' }, dreams: { rabbit: 1, whale: 1, heart: 1, sheep: 1, bird: 1 } });
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(400);
  const lockedHint = await p.$eval('[data-act="outfit"][data-id="dreamer"] small', e => e.textContent.trim());
  if (lockedHint !== 'Bulutlar: 5/6') throw new Error(`kıyafet ipucu yanlış: ${lockedHint}`);
  console.log('kilitli ipucu:', lockedHint);
  await p.click('.tab[data-id="garage"]'); await p.waitForTimeout(300);
  await quiet(p); await spawn(p, 'ship'); await p.waitForTimeout(1200); await tap(p); await p.waitForTimeout(1300);
  const st = await saved(p);
  console.log('altıncı biçim:', st.dreams.ship === 1, '· kıyafet bildirimi:', /Hayalperest/.test(await toasts(p)));
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(400);
  const card = await p.$eval('[data-act="outfit"][data-id="dreamer"]', e => ({
    open: !e.disabled, name: e.querySelector('b').textContent.trim(), on: e.classList.contains('on'),
  }));
  console.log('defterde kıyafet:', card.open, '·', card.name, '· seçili:', card.on);
  await p.click('[data-act="outfit"][data-id="dreamer"]'); await p.waitForTimeout(300);
  const worn = await saved(p);
  console.log('giyildi:', worn.settings.outfit === 'dreamer');
  await p.$eval('[data-act="outfit"][data-id="dreamer"]', e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
  await p.screenshot({ path: process.env.SP + '/dreamer_journal.png' });
  errs.push(...p.errs); await p.close();

  // 2) Onuncu Özel An: bulut karedeyken kartpostal; altın çerçeve ve 10/10
  const m = await open(b, { photos: 4, moments: Object.assign({}, ALL10, { dream: undefined }), momentGold: 1, settings: { sky: 'day' } });
  await quiet(m);
  await m.evaluate(() => { __sc.spawnDream('whale'); __sc.dream.x = __sc.W * 0.5; __sc.dream.y = 150; __sc.dream.t = 2; });
  await m.waitForTimeout(150); await m.click('#btnPhoto'); await m.waitForTimeout(950);
  const ms = await saved(m);
  console.log('onuncu an:', ms.moments.dream === 1, '· toplam:', Object.keys(ms.moments).length, '· altın çerçeve:', ms.momentGold,
    '· bildirim:', /Bütün özel anlar/.test(await toasts(m)));
  await m.screenshot({ path: process.env.SP + '/dreamer_postcard.png' });
  await m.click('#modalBtn'); await m.waitForTimeout(300);
  errs.push(...m.errs); await m.close();

  // 3) Telefon (320 px), koyu tema: kıyafet ve an adları taşmadan görünür
  const q = await open(b, { settings: { sky: 'day' }, dreams: ALL6, moments: ALL10, momentGold: 1, photos: 3 },
    { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  await q.click('.tab[data-id="journal"]'); await q.waitForTimeout(500);
  await q.$eval('[data-act="outfit"][data-id="dreamer"]', e => e.scrollIntoView({ block: 'center' })); await q.waitForTimeout(400);
  const qcard = await q.$eval('[data-act="outfit"][data-id="dreamer"]', e => ({ open: !e.disabled, name: e.querySelector('b').textContent.trim() }));
  const fit = await q.evaluate(() => {
    const c = document.querySelector('[data-act="outfit"][data-id="dreamer"]').getBoundingClientRect();
    const tb = document.querySelector('.dock .tabs').getBoundingClientRect();
    const pa = document.querySelector('.panes').getBoundingClientRect();
    return { cardBottom: Math.round(c.bottom), tabsTop: Math.round(tb.top), paneBottom: Math.round(pa.bottom) };
  });
  if (fit.cardBottom > fit.paneBottom || fit.cardBottom > fit.tabsTop) throw new Error(`kıyafet kartı panelin altında: ${JSON.stringify(fit)}`);
  const over = await q.$$eval('#pane-journal .outfits .outfit b, #pane-journal .outfits .outfit small, #pane-journal .keeps.moments .keep b, #pane-journal .keeps.moments .keep small',
    els => els.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim()).join(' | ') || 'yok');
  console.log('telefon:', qcard.open, '·', qcard.name, '· taşma:', over, '· sayfa taşıyor mu:', await q.evaluate(() => document.scrollingElement.scrollWidth > innerWidth));
  await q.screenshot({ path: process.env.SP + '/dreamer_phone.png' });
  errs.push(...q.errs); await q.close();

  console.log(errs.length ? errs : 'no errors');
  await b.close();
})();
