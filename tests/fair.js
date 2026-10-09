// Uzun yolculuk ve tema adaleti (v1.42):
// - eve dönüş penceresi açıkken köy geçilse de rota seçilebilir; pencere kapanınca seçim yine köyle sınırlanır
// - eski kayıtta (10'dan çok dönüş) sonradan eklenen rota bir sonraki dönüşte duyurulur ve seçilir
// - açık temada uzayda Gece Kuşu sayacı işler ve kayan yıldız gelir
// - gece yağmurdan sonra soluk ay gökkuşağı çizilir (ekran görüntüsü)
const { chromium } = require('./lib/pw');
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
async function open(b, extra, opts) {
  const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(hook);
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } },
    JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, player: undefined }, extra || {})));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => window.__sc, null, { timeout: 15000 }); await p.waitForTimeout(900);
  return p;
}
const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
const goHome = async p => {
  await p.click('.tab[data-id="buffs"]'); await p.waitForTimeout(300);
  await p.$eval('.home-btn', e => e.scrollIntoView({ block: 'center' }));
  await p.click('.home-btn'); await p.waitForTimeout(200); await p.click('.home-btn'); await p.waitForTimeout(500);
};
(async () => {
  const b = await chromium.launch(); const errs = [];

  // 1) 14. dönüş: hatıralarla hız yüksek, köy pencere açıkken birkaç saniyede geçilir; rota yine seçilebilir
  const p = await open(b, { trips: 13, memories: 4000, route: 'crane', distance: 1e17, regionIdx: 0, routeMax: 10 });
  await goHome(p);
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); if ((await saved(p)).regionIdx > 0 || (await p.evaluate(() => __sc.biome)) !== 'meadow') break; }
  await p.evaluate(() => dispatchEvent(new Event('pagehide')));
  const before = await saved(p);
  console.log('pencere açıkken köy geçildi mi:', before.regionIdx > 0, '· rota:', before.route);
  const enabled = await p.$$eval('#modalBody .route-btn:not([disabled])', l => l.length);
  console.log('açık rota düğmesi (pencere açıkken):', enabled);
  await p.click('#modalBody .route-btn[data-id="silk"]'); await p.waitForTimeout(300);
  await p.evaluate(() => dispatchEvent(new Event('pagehide')));
  console.log('seçilen rota:', (await saved(p)).route);
  await p.click('#modalBtn'); await p.waitForTimeout(400);
  await p.click('.tab[data-id="buffs"]'); await p.waitForTimeout(300);
  console.log('pencere kapanınca rota düğmeleri kapalı mı:', await p.$$eval('.card.home .route-btn', l => l.length === 0 || l.every(x => x.disabled)));
  errs.push(...p.errs); await p.close();

  // 2) eski kayıt: 12 dönüş, routeMax yok (o zaman 10 rota vardı) → sıradaki dönüş on birinci rotayı açar
  const v = await open(b, { trips: 12, memories: 3000, route: 'north', distance: 1e17, regionIdx: 0 });
  await v.click('.tab[data-id="buffs"]'); await v.waitForTimeout(300);
  console.log('ev kartı ipucu:', /yeni bir rota açılır/.test(await v.textContent('.card.home')));
  await goHome(v);
  console.log('dönüş penceresi:', ((await v.textContent('#modalBody')).replace(/\s+/g, ' ').match(/Yeni rota açıldı: [^·]*/) || ['(yok)'])[0].trim());
  const sv = await saved(v);
  console.log('rota:', sv.route, '· routeMax:', sv.routeMax);
  errs.push(...v.errs); await v.close();

  // 3) açık tema, roket: uzayda Gece Kuşu sayacı işler ve kayan yıldız gelir
  const r = await open(b, { owned: { walk: 1, rocket: 1 }, active: 'rocket', distance: 2e6, regionIdx: 4, msIdx: 99, nightTime: 0, settings: { sky: 'day' } });
  let star = 0;
  for (let i = 0; i < 70 && !star; i++) { await r.waitForTimeout(1000); if (await r.evaluate(() => !!__sc.star)) star = i + 1; }
  await r.evaluate(() => dispatchEvent(new Event('pagehide')));
  const sr = await saved(r);
  console.log('uzay:', await r.evaluate(() => (__sc.space || 0).toFixed(2)), '· gece sayacı (sn):', Math.round(sr.nightTime), '· kayan yıldız (sn):', star);
  errs.push(...r.errs); await r.close();

  // 4) ay gökkuşağı (gece) ve gündüz gökkuşağı
  for (const [name, sky] of [['moonbow', 'night'], ['rainbow', 'day']]) {
    const m = await open(b, { settings: { sky } }, { colorScheme: sky === 'night' ? 'dark' : 'light' });
    await m.evaluate(moon => __sc.setWeather(0, 1, moon), sky === 'night');
    await m.waitForTimeout(3500);
    await m.screenshot({ path: `${process.env.SP}/fair_${name}.png`, clip: { x: 0, y: 55, width: 760, height: 520 } });
    errs.push(...m.errs); await m.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
