// Yeni araçlar (v1.36): Güneş Yelkeni'nden sonra Kuyruklu Yıldız ve Yıldız Gemisi. Garajda sıradaki araç olarak görünür,
// satın alınınca hemen binilir; görünüm aşamaları sahnede gündüz ve gece çizilir. Yükseltme adları 320 px telefonda
// beş dilde de kesilmez ve seviye artınca kart büyümez. Ekran görüntüleri: sahne, garaj, telefon.
const { chromium } = require('./lib/pw');
const ALL = { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, moto: 1, car: 1, van: 1, train: 1, balloon: 1, plane: 1, jet: 1, rocket: 1, sail: 1 };
const save = extra => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, credits: 6e15, distance: 5e15,
  regionIdx: 27, msIdx: 99, unitTip: 2, owned: ALL, levels: { sail: 60 }, active: 'sail' }, extra || {}));
async function open(b, extra, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(extra));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
  return p;
}
(async () => {
  const b = await chromium.launch(); const errs = [];
  // 1) satın alma: kuyruklu yıldız sıradaki araç, yıldız gemisi garaj kapısının ardında
  const p = await open(b);
  console.log('sıradaki:', await p.$$eval('[data-act="buyVeh"]', l => l.map(e => e.dataset.id).join(',')), '| gizli:', (await p.textContent('.card.mystery')).replace(/\s+/g, ' ').trim());
  for (const id of ['comet', 'warp']) {
    await p.$eval(`[data-act="buyVeh"][data-id="${id}"]`, e => e.scrollIntoView({ block: 'center' }));
    await p.click(`[data-act="buyVeh"][data-id="${id}"]`); await p.waitForTimeout(400);
    console.log(id, 'alındı · binilen:', await p.textContent('#hudVehicle'), '| bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-70));
  }
  await p.waitForTimeout(6000); // kayıt 5 sn'de bir yazılır
  console.log('gizli kart kaldı mı:', !!(await p.$('.card.mystery')), '| garaj rozeti (kademe):', await p.evaluate(() => (JSON.parse(localStorage.getItem('idle-traveler-save-v1')).badges || {}).garage));
  await p.screenshot({ path: process.env.SP + '/newveh_warp.png', clip: { x: 0, y: 55, width: 700, height: 460 } });
  await p.screenshot({ path: process.env.SP + '/newveh_garage.png', clip: { x: 700, y: 55, width: 400, height: 705 } });
  errs.push(...p.errs); await p.close();
  // 2) görünüm aşamaları: gündüz ve gece
  for (const [veh, lvl, dark] of [['comet', 0, false], ['comet', 100, true], ['warp', 50, false], ['warp', 200, true]]) {
    const q = await open(b, { owned: Object.assign({}, ALL, { comet: 1, warp: 1 }), levels: { [veh]: lvl }, active: veh }, dark ? { colorScheme: 'dark' } : {});
    await q.waitForTimeout(2500);
    await q.screenshot({ path: `${process.env.SP}/newveh_${veh}${lvl}${dark ? '_night' : ''}.png`, clip: { x: 0, y: 55, width: 700, height: 460 } });
    errs.push(...q.errs); await q.close();
  }
  // 3) telefon: yükseltme adları kesilmez, seviye artınca kart büyümez
  for (const loc of ['tr-TR', 'en-US', 'de-DE', 'es-ES', 'fr-FR']) {
    const q = await open(b, { owned: Object.assign({}, ALL, { comet: 1, warp: 1 }), levels: { sail: 60, warp: 9 } }, { locale: loc, viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
    const cut = await q.$$eval('.upname', l => l.filter(e => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
    const h = () => q.$eval('[data-act="upgrade"][data-id="warp"]', e => e.closest('.card').getBoundingClientRect().height);
    const h0 = await h();
    await q.$eval('[data-act="upgrade"][data-id="warp"]', e => e.scrollIntoView({ block: 'center' }));
    await q.click('[data-act="upgrade"][data-id="warp"]'); await q.waitForTimeout(250);
    const h1 = await h();
    console.log(loc, '320: kesilen ad:', cut.join(' | ') || 'yok', '| kart Sv.9 → Sv.10:', Math.round(h0), '→', Math.round(h1), h0 === h1 ? '(sabit)' : '(DEĞİŞTİ)');
    if (loc === 'tr-TR') await q.screenshot({ path: process.env.SP + '/newveh_phone.png' });
    errs.push(...q.errs); await q.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
