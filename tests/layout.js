// Telefon yerleşimi: dikeyde ritim, durak, yakınlaştırma ve konuşma düğmesi sahnenin altındaki şeritte (sahnenin üstünde düğme yok),
// şeride dokunmak adım saymaz; yatayda sahne ve panel yan yana (panel görünür, sayfa taşmaz); telefonda sıkı garaj ve güçlendirme kartları
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const save = { v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 500, distance: 5e5, regionIdx: 7, msIdx: 99, credits: 5e6,
    owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1 }, levels: { walk: 30, skates: 22, board: 12, bike: 5, horse: 1 }, active: 'horse',
    buffs: { power: 5, wind: 3, pal: 2 }, settings: { sky: 'day', zoom: 1 } };
  const rect = (p, sel) => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; });
  for (const [name, vp, sky] of [['p320', { width: 320, height: 640 }, 'night'], ['p390', { width: 390, height: 844 }, 'day'], ['tab768', { width: 768, height: 1024 }, 'day'],
    ['land844', { width: 844, height: 390 }, 'day'], ['land667', { width: 667, height: 375 }, 'night']]) {
    const p = await b.newPage({ locale: 'tr-TR', viewport: vp, hasTouch: true, isMobile: true });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)), Object.assign({}, save, { settings: { sky, zoom: 1 } }));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
    const cv = await rect(p, '#scene'), tr = await rect(p, '.trail'), zc = await rect(p, '#zoomCtl'), ch = await rect(p, '#btnChat'), pn = await rect(p, '.panel');
    const over = await p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight + (document.scrollingElement.scrollWidth - innerWidth));
    if (name.startsWith('land')) {
      console.log(name, 'panel yanında mı:', pn.l >= cv.r - 1 && pn.t < 80, '· panel yüksekliği:', Math.round(pn.h), '· sayfa taşıyor mu:', over > 0);
    } else {
      const below = [tr, zc, ch].every(r => r.t >= cv.b - 1);
      const inBar = [zc, ch].every(r => r.r <= vp.width + 0.5 && r.t < tr.b && r.b > tr.t);
      console.log(name, 'düğmeler sahnenin altında mı:', below, '· aynı şeritte mi:', inBar, '· sahne:', `${Math.round(cv.w)}x${Math.round(cv.h)}`, '· sayfa taşıyor mu:', over > 0);
      // şeride dokununca adım atılmaz (yalnızca sahneye dokununca)
      await p.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      const c0 = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks);
      await p.mouse.click(tr.l + 30, tr.t + tr.h / 2); await p.mouse.click(tr.r - 30, tr.t + tr.h / 2);
      await p.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      const c1 = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks);
      await p.mouse.click(cv.l + cv.w * 0.6, cv.t + cv.h * 0.5);
      await p.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      const c2 = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks);
      console.log('  şeride dokunuş adım saydı mı:', c1 !== c0, '· sahneye dokunuş adım saydı mı:', c2 > c1);
      // konuşma seçici şeridin üstünde açılır, ekranın içinde kalır
      await p.click('#btnChat'); await p.waitForTimeout(350);
      const cp = await rect(p, '#chatPop');
      console.log('  konuşma seçici şeridin üstünde mi:', cp.b <= tr.t + 4 && cp.t >= 0 && cp.r <= vp.width, `(${Math.round(cp.t)}–${Math.round(cp.b)}, şerit ${Math.round(tr.t)})`);
      await p.click('.wallet'); await p.waitForTimeout(250);
    }
    await p.screenshot({ path: `${process.env.SP}/layout_${name}_garage.png` });
    // telefonda güçlendirme kartı: düğme sağda, kart alçak; garaj kuralı tek satır, dokununca açılır
    await p.evaluate(() => document.querySelector('.tab[data-id="buffs"]').click()); await p.waitForTimeout(250);
    const bc = await rect(p, '#pane-buffs .card.buff'), bb = await rect(p, '#pane-buffs .card.buff .buy');
    console.log('  güçlendirme kartı yüksekliği:', Math.round(bc.h), '· düğme sağda mı:', bb.r > bc.r - 20 && bb.t > bc.t + 2);
    await p.screenshot({ path: `${process.env.SP}/layout_${name}_buffs.png` });
    await p.evaluate(() => document.querySelector('.tab[data-id="garage"]').click()); await p.waitForTimeout(250);
    const h0 = (await rect(p, '.g-rule')).h; await p.click('.g-rule'); await p.waitForTimeout(600);
    const h1 = (await rect(p, '.g-rule')).h;
    console.log('  garaj kuralı:', Math.round(h0), '→', Math.round(h1), 'px (dokununca açıldı mı:', h1 > h0 + 4, ')');
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
