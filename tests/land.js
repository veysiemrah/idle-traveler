// Yatay telefon ve alçak ekranlar: sahne, HUD, sohbet düğmesi, seçici
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [w, h] of [[844, 390], [568, 320], [1024, 600]]) {
    const p = await b.newPage({ locale: 'tr-TR', viewport: { width: w, height: h }, isMobile: w < 900, hasTouch: w < 900 });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 3e5, regionIdx: 4,
      owned: { walk: 1, skates: 1, board: 1, bike: 1 }, levels: { bike: 8 }, active: 'bike', player: { id: crypto.randomUUID(), key: 'a'.repeat(64), name: 'Yatay' } })); });
    await p.goto('http://127.0.0.1:8787/index.html'); await p.waitForTimeout(1500);
    await p.screenshot({ path: `${process.env.SP}/land_${w}x${h}.png` });
    await p.click('#btnChat'); await p.waitForTimeout(400);
    await p.screenshot({ path: `${process.env.SP}/land_${w}x${h}_pop.png` });
    const r = await p.evaluate(() => { const st = document.querySelector('#stage').getBoundingClientRect(), pop = document.querySelector('#chatPop').getBoundingClientRect(); return { stage: [Math.round(st.width), Math.round(st.height)], popTop: Math.round(pop.top - st.top), popH: Math.round(pop.height), sw: document.documentElement.scrollWidth }; });
    console.log(w + 'x' + h, JSON.stringify(r));
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
