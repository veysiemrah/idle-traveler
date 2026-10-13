// Telefon yerleşimi (v1.56): telefonda sahnenin üstünde yazı yok. Dikeyde durum satırı, etkiler, ritim şeridi, yakınlaştırma,
// konuşma ve sekmeler sahnenin altındaki panoda; panoya dokunmak adım saymaz; bildirim durum satırında akar; panel alttan
// açılan sayfadır (sekmeyle açılır, başka sekmeye geçilebilir, karartmaya dokununca kapanır, açıkken üst çubuk çalışır).
// Yatayda pano panelin üstünde, panel sahnenin yanında. Katlanır kartlar açılıp kapanır. Sayfa hiçbir yerde taşmaz.
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const save = { v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 500, distance: 5e5, regionIdx: 7, msIdx: 99, credits: 5e6,
    owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1 }, levels: { walk: 30, skates: 22, board: 12, bike: 5, horse: 1 }, active: 'horse',
    effects: [{ id: 'gust', until: Date.now() + 90000, stack: 1 }], buffs: { stride: 5, breeze: 3, pal: 2 }, settings: { sky: 'day', zoom: 1 } };
  const rect = (p, sel) => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; });
  const clicks = async p => { await p.evaluate(() => window.dispatchEvent(new Event('pagehide'))); return p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks); };
  for (const [name, vp, sky] of [['p320', { width: 320, height: 640 }, 'night'], ['p390', { width: 390, height: 844 }, 'day'], ['tab768', { width: 768, height: 1024 }, 'day'],
    ['land844', { width: 844, height: 390 }, 'day'], ['land667', { width: 667, height: 375 }, 'night']]) {
    const p = await b.newPage({ locale: 'tr-TR', viewport: vp, hasTouch: true, isMobile: true });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)), Object.assign({}, save, { settings: { sky, zoom: 1 } }));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
    const cv = await rect(p, '#scene');
    const over = await p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight + (document.scrollingElement.scrollWidth - innerWidth));
    // sahnenin üstünde yazı yok: konum kartı, etkiler, bildirimler ve ritim şeridi tuvalle kesişmez
    const texts = [];
    for (const sel of ['.hud-card', '#effects .fx', '.trail', '#hint:not(.gone)']) {
      const r = await p.$(sel) && await rect(p, sel);
      if (r && r.w > 0 && r.h > 0 && r.l < cv.r - 1 && r.r > cv.l + 1 && r.t < cv.b - 1 && r.b > cv.t + 1) texts.push(sel);
    }
    const textless = await p.evaluate(() => document.documentElement.classList.contains('m-phone'));
    console.log(name, 'telefon yerleşimi:', textless, '· sahnenin üstündeki yazılar:', texts.join(',') || 'yok', '· sayfa taşıyor mu:', over > 0);
    if (name.startsWith('land')) {
      const pn = await rect(p, '.panel'), dk = await rect(p, '#dock');
      console.log(name, 'panel yanında mı:', pn.l >= cv.r - 1, '· pano panelin üstünde mi:', dk.l >= pn.l - 1 && dk.t <= pn.t + 70);
      // panele taşınan durak kutusu dar: etiket ve mesafe gizlenir, durağın adı görünür ve kutudan taşmaz
      const ms = await p.evaluate(() => { const n = document.querySelector('#msName'), m = document.querySelector('.milestone'); return { w: n.clientWidth, over: m.scrollWidth > m.clientWidth + 1, prog: getComputedStyle(document.querySelector('#msProg')).display }; });
      console.log(name, 'durak adı görünüyor mu:', ms.w > 60, '· durak kutusu taşıyor mu:', ms.over, '· mesafe gizli mi:', ms.prog === 'none');
    } else {
      // pano sahnenin altında; panoya dokunmak adım saymaz, sahneye dokunmak sayar
      const dk = await rect(p, '#dock'), tr = await rect(p, '.trail');
      const c0 = await clicks(p);
      await p.mouse.click(tr.l + 20, tr.t + tr.h / 2); await p.mouse.click(dk.l + 40, dk.t + 20);
      const c1 = await clicks(p);
      await p.mouse.click(cv.l + cv.w * 0.6, cv.t + cv.h * 0.5);
      const c2 = await clicks(p);
      console.log(name, 'pano tam genişlikte mi (içeriğe göre daralmaz):', Math.abs(dk.w - vp.width) <= 1);
      console.log(name, 'pano sahnenin altında mı:', dk.t >= cv.b - 1, '· panoya dokunmak adım saydı mı:', c1 !== c0, '· sahneye dokunmak saydı mı:', c2 > c1);
      // bildirim durum satırında
      await p.click('#btnSky'); await p.waitForTimeout(500);
      console.log(name, 'bildirim panoda mı:', await p.evaluate(() => !!document.querySelector('#dock #toasts .toast') && document.querySelector('#dockStatus').classList.contains('ticking')));
      await p.screenshot({ path: `${process.env.SP}/layout_${name}.png` });
      await p.click('#btnSky'); await p.waitForTimeout(3600);
      // sayfa: sekmeyle açılır, başka sekmeye geçilir, karartmayla kapanır
      const vis = () => p.$eval('.panel', e => getComputedStyle(e).visibility === 'visible' && e.getBoundingClientRect().top < innerHeight - 80);
      console.log(name, 'sayfa başta kapalı mı:', !(await vis()));
      await p.click('.tab[data-id="garage"]'); await p.waitForTimeout(450);
      const tabs = await rect(p, '.dock .tabs'), pn = await rect(p, '.panel');
      console.log(name, 'sayfa açıldı mı:', await vis(), '· sekmeler görünür mü:', pn.b <= tabs.t + 1);
      // katlanır kart: aç, kapa
      const h0 = (await rect(p, '.card.veh[data-fold="v:walk"]')).h;
      await p.click('.fold-btn[data-id="v:walk"]'); await p.waitForTimeout(450);
      const h1 = (await rect(p, '.card.veh[data-fold="v:walk"]')).h;
      await p.screenshot({ path: `${process.env.SP}/layout_${name}_sheet.png` });
      await p.click('.fold-btn[data-id="v:walk"]'); await p.waitForTimeout(450);
      const h2 = (await rect(p, '.card.veh[data-fold="v:walk"]')).h;
      console.log(name, 'kart kapalı/açık/kapalı:', Math.round(h0), '/', Math.round(h1), '/', Math.round(h2));
      await p.click('.tab[data-id="buffs"]'); await p.waitForTimeout(400);
      console.log(name, 'başka sekmeye geçince açık kaldı mı:', await vis(), '· güçlendirmeler görünür mü:', await p.$eval('#pane-buffs', e => !e.hidden));
      await p.click('#btnSettings'); await p.waitForTimeout(300);
      console.log(name, 'sayfa açıkken ayarlar açıldı mı:', await p.$eval('#modal', e => !e.hidden));
      await p.click('#modalBtn'); await p.waitForTimeout(300);
      await p.mouse.click(vp.width / 2, 120); await p.waitForTimeout(450);
      console.log(name, 'karartmaya dokununca kapandı mı:', !(await vis()));
    }
    if (name.startsWith('land')) await p.screenshot({ path: `${process.env.SP}/layout_${name}.png` });
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
