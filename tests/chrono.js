// Zaman Makinesi (v1.50): Anka Kuşu'ndan sonra garajda; satın alınınca (hangi araca binilirse binilsin) yolcunun yerine
// otomatik adım atar, seviye arttıkça daha sık (Sv. 0: 1/sn, Sv. 100: 6/sn); otomatik adımlar elle atılan adım, ritim ya
// da not sayılmaz; garaj kartında hız satırı, defterde sayaç; görünüm aşamaları gündüz/gece; telefonda kart taşmaz
const { chromium } = require('./lib/pw');
const ALL = { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, moto: 1, car: 1, van: 1, train: 1, balloon: 1, plane: 1, jet: 1, rocket: 1, sail: 1, comet: 1, warp: 1, whale: 1, startrain: 1, anka: 1 };
const today = new Date().toLocaleDateString('sv-SE');
const save = extra => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, credits: 1e20, distance: 5e15,
  regionIdx: 27, msIdx: 99, unitTip: 2, harvestDay: today, owned: ALL, levels: { anka: 30 }, active: 'anka' }, extra || {}));
async function open(b, extra, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(extra));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
  return p;
}
const saved = async p => { await p.evaluate(() => window.dispatchEvent(new Event('pagehide'))); return p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1'))); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  // 1) satın alma ve Sv. 0'da otomatik adım (≈1/sn); elle adım sayılmaz
  const p = await open(b);
  console.log('sıradaki:', await p.$$eval('[data-act="buyVeh"]', l => l.map(e => e.dataset.id).join(',')));
  const card = () => p.$eval('[data-act="buyVeh"][data-id="chrono"], [data-act="upgrade"][data-id="chrono"]', e => e.closest('.card').innerText.replace(/\s+/g, ' '));
  console.log('kart (alınmadan):', (await card()).slice(0, 160));
  await p.$eval('[data-act="buyVeh"][data-id="chrono"]', e => e.scrollIntoView({ block: 'center' }));
  await p.click('[data-act="buyVeh"][data-id="chrono"]'); await p.waitForTimeout(300);
  const s0 = await saved(p);
  await p.waitForTimeout(5000);
  const s1 = await saved(p);
  console.log('Sv. 0, 5 sn: otomatik adım', s1.autoSteps - s0.autoSteps, '· elle adım değişti mi:', s1.clicks !== s0.clicks, '· binilen:', s1.active);
  console.log('kart (alındı):', (await card()).slice(0, 220));
  await p.$eval('[data-act="upgrade"][data-id="chrono"]', e => e.scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: process.env.SP + '/chrono_garage.png', clip: { x: 700, y: 55, width: 400, height: 705 } });
  errs.push(...p.errs); await p.close();

  // 2) Sv. 100: ≈6/sn; başka araca binerken de çalışır
  const q = await open(b, { owned: Object.assign({}, ALL, { chrono: 1 }), levels: { chrono: 100 }, active: 'walk' });
  const q0 = await saved(q); await q.waitForTimeout(5000); const q1 = await saved(q);
  console.log('Sv. 100, 5 sn (yürürken): otomatik adım', q1.autoSteps - q0.autoSteps, '· yol arttı mı:', q1.distance > q0.distance);
  await q.click('.tab[data-id="journal"]'); await q.waitForTimeout(300);
  console.log('defter:', await q.evaluate(() => [...document.querySelectorAll('dt')].filter(e => /Otomatik/.test(e.textContent)).map(e => e.textContent + ' ' + e.nextElementSibling.textContent).join()));
  errs.push(...q.errs); await q.close();

  // 3) görünüm aşamaları: gündüz ve gece
  for (const [lvl, dark] of [[0, false], [25, true], [50, false], [100, true], [200, false]]) {
    const r = await open(b, { owned: Object.assign({}, ALL, { chrono: 1 }), levels: { chrono: lvl }, active: 'chrono' }, dark ? { colorScheme: 'dark' } : {});
    await r.waitForTimeout(2600);
    await r.screenshot({ path: `${process.env.SP}/chrono${lvl}${dark ? '_night' : ''}.png`, clip: { x: 0, y: 55, width: 700, height: 460 } });
    errs.push(...r.errs); await r.close();
  }
  // 4) telefon: yükseltme adı ve kart satırları taşmaz (beş dil)
  for (const loc of ['tr-TR', 'en-US', 'de-DE', 'es-ES', 'fr-FR']) {
    const r = await open(b, { owned: Object.assign({}, ALL, { chrono: 1 }), levels: { chrono: 9 }, active: 'chrono' }, { locale: loc, viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
    await r.$eval('[data-act="upgrade"][data-id="chrono"]', e => e.scrollIntoView({ block: 'center' }));
    const cut = await r.$$eval('.upname, .card .stats', l => l.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
    console.log(loc, '320: taşan:', cut.join(' | ') || 'yok');
    if (loc === 'tr-TR' || loc === 'fr-FR') await r.screenshot({ path: `${process.env.SP}/chrono_phone_${loc}.png` });
    errs.push(...r.errs); await r.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
