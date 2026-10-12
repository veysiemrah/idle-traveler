// Günün Notları: her gün herkese aynı üç not, Yol Defteri sekmesinde yeni not noktası, defterin başında ilerleme çubukları
// (açık/koyu tema, 320 px telefon, beş dilde taşma), adım/kelebek/kartpostal notlarının tamamlanması ve ödülleri, üçü
// birden tamamlanınca hediye, ertesi gün yeni notlar, eski ve bozuk kayıt
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
  const today = new Date().toLocaleDateString('sv-SE'), y = new Date(Date.now() - 864e5).toLocaleDateString('sv-SE');
  const open = async (save, vp, opts) => {
    const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: vp || { width: 1280, height: 860 } }, opts || {}));
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(hook);
    await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } },
      Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, msIdx: 99, credits: 0, harvestDay: today, day: { last: today, streak: 1, best: 1 }, settings: { sky: 'day', zoom: 1 } }, save));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1300);
    return p;
  };
  const saved = async p => { await p.evaluate(() => window.dispatchEvent(new Event('pagehide'))); return p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1'))); };
  const toasts = async p => (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();
  const dot = p => p.$eval('.tab[data-id="journal"]', e => e.classList.contains('dot'));

  // 1) Notlar oluşur, iki farklı oyuncuda aynıdır; sekme noktası defter açılınca söner
  const a = await open({}), c = await open({ distance: 900 });
  const la = (await saved(a)).notes, lc = (await saved(c)).notes;
  console.log('bugünün notları:', la.day, la.list.map(n => n.id).join(','), '· iki oyuncuda aynı mı:', la.list.map(n => n.id).join() === lc.list.map(n => n.id).join());
  console.log('defter noktası (önce):', await dot(a));
  await a.click('.tab[data-id="journal"]'); await a.waitForTimeout(300);
  console.log('defter noktası (açınca):', await dot(a), '· satırlar:', await a.$$eval('.note', l => l.map(e => e.innerText.replace(/\s+/g, ' ')).join(' | ')));
  await a.screenshot({ path: `${process.env.SP}/notes_journal.png`, clip: { x: 890, y: 55, width: 390, height: 420 } });
  await a.close(); await c.close();

  // 2) Adım, kelebek ve kartpostal notları tamamlanır; her biri ödül, üçü birden hediye verir
  const NOTES = { day: today, list: [{ id: 'steps', need: 20 }, { id: 'gift', need: 1 }, { id: 'photo', need: 1 }], prog: [0, 0, 0], done: [false, false, false], seen: true };
  const p = await open({ notes: NOTES });
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
  await p.mouse.move(300, 500);
  for (let i = 0; i < 20; i++) { await p.keyboard.press('Space'); await p.waitForTimeout(30); }
  await p.waitForTimeout(400);
  let s = await saved(p);
  console.log('adım notu:', s.notes.prog[0], s.notes.done[0], '· kredi:', Math.round(s.credits), '·', (await toasts(p)).slice(-60));
  await p.evaluate(() => { __sc.spawnGift(14); __sc.gift.x = __sc.W * 0.5; __sc.gift.y = __sc.H * 0.3; __sc.gift.t = 2; });
  await p.waitForTimeout(100);
  const g = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(); return { x: r.left + __sc.gift.x * __sc.zoom, y: r.top + __sc.gift.y * __sc.zoom }; });
  await p.mouse.click(g.x, g.y); await p.waitForTimeout(400);
  s = await saved(p);
  console.log('kelebek notu:', s.notes.done[1], '· satır:', await p.$$eval('.note.done', l => l.length));
  await p.screenshot({ path: `${process.env.SP}/notes_two.png`, clip: { x: 890, y: 55, width: 390, height: 420 } });
  const before = s.credits;
  await p.click('#btnPhoto'); await p.waitForTimeout(500);
  await p.click('#modalBtn'); await p.waitForTimeout(1400);
  s = await saved(p);
  console.log('kartpostal notu:', s.notes.done[2], '· hediye geldi mi:', s.credits > before + 1, '·', (await toasts(p)).slice(-90));
  await p.screenshot({ path: `${process.env.SP}/notes_done.png`, clip: { x: 890, y: 55, width: 390, height: 420 } });
  await p.close();

  // 3) Ertesi gün yeni notlar (dünkü kayıt), sekme noktası yanar; eski ve bozuk kayıt
  const q = await open({ notes: Object.assign({}, NOTES, { day: y, done: [true, true, true] }) });
  const sq = (await saved(q)).notes;
  console.log('ertesi gün:', sq.day === today, '· tamamlanmamış:', sq.done.join(), '· nokta:', await dot(q));
  await q.close();
  const bad = await open({ notes: { day: 'x', list: [{ id: 'nope', need: -1 }] } });
  const sb = (await saved(bad)).notes;
  console.log('bozuk kayıt yeniden kuruldu mu:', sb.day === today && sb.list.length === 3);
  await bad.close();

  // 4) Koyu tema ve telefon (beş dil): taşan yazı yok
  for (const [loc, vp, dark] of [['tr-TR', { width: 320, height: 640 }, false], ['de-DE', { width: 320, height: 640 }, true], ['fr-FR', { width: 320, height: 640 }, false], ['es-ES', { width: 360, height: 740 }, false], ['en-US', null, true]]) {
    const ph = await open({ settings: { sky: dark ? 'night' : 'day', zoom: 1 }, notes: Object.assign({}, NOTES, { list: [{ id: 'wish', need: 1 }, { id: 'upgrade', need: 5 }, { id: 'dist', need: 1234.5 }], prog: [0, 2, 300], done: [true, false, false] }) },
      vp, { locale: loc, colorScheme: dark ? 'dark' : 'light', isMobile: !!vp, hasTouch: !!vp });
    await ph.click('.tab[data-id="journal"]'); await ph.waitForTimeout(300);
    const over = await ph.$$eval('.note-t', l => l.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
    console.log(loc, vp ? vp.width : 'masaüstü', dark ? 'koyu' : 'açık', 'taşan:', over.join(' | ') || 'yok', '·', await ph.$$eval('.note-t', l => l.map(e => e.textContent).join(' | ')));
    if (vp) { await ph.$eval('.notes', e => e.scrollIntoView({ block: 'center' })); await ph.screenshot({ path: `${process.env.SP}/notes_phone_${loc}.png` }); }
    else await ph.screenshot({ path: `${process.env.SP}/notes_dark.png`, clip: { x: 890, y: 55, width: 390, height: 420 } });
    await ph.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
