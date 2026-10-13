// Durak yolu (v1.63): sıradaki durak çubuğu küçük bir yol; ilerlemenin ucunda yolcu işareti (--p), sonda bayrak. Durağa
// %90 yaklaşınca bayrak altınlanıp dalgalanır (near); durağa varınca işaret geri koşmaz, geçişsiz başa döner (reset).
// Masaüstü/telefon, gündüz/gece ekran görüntüleri.
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [name, vp, dark, sky] of [['desk', { width: 1100, height: 760 }, false, 'day'], ['p320', { width: 320, height: 640 }, true, 'night']]) {
    const p = await b.newPage({ locale: 'tr-TR', viewport: vp, colorScheme: dark ? 'dark' : 'light', isMobile: vp.width < 500, hasTouch: vp.width < 500, deviceScaleFactor: 2 });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } },
      { v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 20500, regionIdx: 4, msIdx: 7, owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, moto: 1, car: 1, van: 1 }, levels: { van: 40 }, active: 'van', settings: { sky, zoom: 1 } });
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
    const st = () => p.evaluate(() => { const r = document.querySelector('#msRoad'), d = r.querySelector('.ms-dot').getBoundingClientRect(), q = r.getBoundingClientRect();
      return { p: +getComputedStyle(r).getPropertyValue('--p'), near: r.classList.contains('near'), name: document.querySelector('#msName').textContent, dot: Math.round((d.left + d.width / 2 - q.left) / q.width * 100) }; });
    const a = await st();
    console.log(name, 'yaklaşınca:', JSON.stringify(a));
    const r = await p.$eval('.milestone', e => { const q = e.getBoundingClientRect(); return { x: q.left, y: q.top, w: q.width, h: q.height }; });
    await p.screenshot({ path: `${process.env.SP}/msroad_${name}_near.png`, clip: { x: Math.max(0, r.x - 8), y: r.y - 8, width: Math.min(vp.width - Math.max(0, r.x - 8), r.w + 16), height: r.h + 16 } });
    // durağa varınca: işaret başa döner (reset sınıfı geçişi kapatır), bayrak sakinleşir
    let seen = false, c = a;
    for (let i = 0; i < 40 && c.name === a.name; i++) { await p.waitForTimeout(250); c = await st(); seen = seen || await p.evaluate(() => document.querySelector('#msRoad').classList.contains('reset')); }
    await p.waitForTimeout(300); c = await st();
    console.log(name, 'yeni durak:', c.name !== a.name, '· işaret başta mı:', c.p < 0.3 && c.dot < 35, '· bayrak sakin mi:', !c.near);
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
