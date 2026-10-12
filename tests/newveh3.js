// Yeni araçlar (v1.46): Yıldız Gemisi'nden sonra Yıldız Balinası, Samanyolu Treni ve Anka Kuşu. Garajda sırayla görünür,
// satın alınınca hemen binilir; görünüm aşamaları sahnede gündüz ve gece çizilir; garaj simgeleri; yükseltme adları 320 px
// telefonda beş dilde de kesilmez. Ekran görüntüleri: sahne, garaj, telefon.
const { chromium } = require('./lib/pw');
const ALL = { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, moto: 1, car: 1, van: 1, train: 1, balloon: 1, plane: 1, jet: 1, rocket: 1, sail: 1, comet: 1, warp: 1 };
const NEW = ['whale', 'startrain', 'anka'];
const save = extra => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, credits: 9e18, distance: 5e15,
  regionIdx: 27, msIdx: 99, unitTip: 2, harvestDay: new Date().toLocaleDateString('sv-SE'), owned: ALL, levels: { warp: 60 }, active: 'warp' }, extra || {}));
async function open(b, extra, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(extra));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
  return p;
}
(async () => {
  const b = await chromium.launch(); const errs = [];
  // 1) satın alma: sırayla üç yeni araç
  const p = await open(b);
  console.log('sıradaki:', await p.$$eval('[data-act="buyVeh"]', l => l.map(e => e.dataset.id).join(',')), '| gizli:', (await p.textContent('.card.mystery')).replace(/\s+/g, ' ').trim());
  for (const id of NEW) {
    await p.$eval(`[data-act="buyVeh"][data-id="${id}"]`, e => e.scrollIntoView({ block: 'center' }));
    await p.click(`[data-act="buyVeh"][data-id="${id}"]`); await p.waitForTimeout(400);
    console.log(id, 'alındı · binilen:', await p.textContent('#hudVehicle'), '| bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-70));
  }
  console.log('gizli kart kaldı mı:', !!(await p.$('.card.mystery')));
  await p.$eval('[data-act="upgrade"][data-id="whale"]', e => e.scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: process.env.SP + '/newveh3_garage.png', clip: { x: 700, y: 55, width: 400, height: 705 } });
  errs.push(...p.errs); await p.close();
  // 2) görünüm aşamaları: gündüz ve gece (Sv. 0, 25, 50, 100, 200)
  const owned = Object.assign({}, ALL, { whale: 1, startrain: 1, anka: 1 });
  for (const veh of NEW) for (const [lvl, dark] of [[0, false], [25, true], [50, false], [100, true], [200, false]]) {
    const q = await open(b, { owned, levels: { [veh]: lvl }, active: veh }, dark ? { colorScheme: 'dark' } : {});
    await q.waitForTimeout(2600);
    await q.screenshot({ path: `${process.env.SP}/newveh3_${veh}${lvl}${dark ? '_night' : ''}.png`, clip: { x: 0, y: 55, width: 700, height: 460 } });
    errs.push(...q.errs); await q.close();
  }
  // 3) telefon: yükseltme adları kesilmez; araç sahnede tam görünür
  for (const loc of ['tr-TR', 'en-US', 'de-DE', 'es-ES', 'fr-FR']) {
    const q = await open(b, { owned, levels: { warp: 60, whale: 9, startrain: 9, anka: 9 }, active: 'anka' }, { locale: loc, viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
    const cut = await q.$$eval('.upname', l => l.filter(e => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
    console.log(loc, '320: kesilen ad:', cut.join(' | ') || 'yok');
    if (loc === 'tr-TR' || loc === 'de-DE') {
      await q.waitForTimeout(2000);
      await q.screenshot({ path: `${process.env.SP}/newveh3_phone_${loc}.png` });
      await q.$eval('[data-act="upgrade"][data-id="anka"]', e => e.scrollIntoView({ block: 'center' }));
      await q.screenshot({ path: `${process.env.SP}/newveh3_phone_garage_${loc}.png` });
    }
    errs.push(...q.errs); await q.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
