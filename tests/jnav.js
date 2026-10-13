// Yol Defteri gezinme şeridi (v1.53): yapışkan çipler yalnızca var olan bölümler için, ilerleme sayılarıyla; dokununca o
// bölüme kayar ve şerit üstte kalır; defter yeniden çizilince sayfanın ve şeridin kaydırması korunur; telefonda (320 px)
// ve koyu temada görünüm
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const today = new Date().toLocaleDateString('sv-SE');
  const open = async (save, vp, opts) => {
    const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: vp || { width: 1280, height: 860 } }, opts || {}));
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } },
      Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, msIdx: 99, harvestDay: today, distance: 800, regionIdx: 3, letters: 2, birds: { stork: 1 }, settings: { sky: 'day' } }, save));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
    await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
    return p;
  };
  for (const [name, vp, dark] of [['desk', null, false], ['phone', { width: 320, height: 640 }, false], ['dark', { width: 390, height: 780 }, true]]) {
    const p = await open(dark ? { settings: { sky: 'night' } } : {}, vp, { colorScheme: dark ? 'dark' : 'light', isMobile: !!vp, hasTouch: !!vp });
    const chips = await p.$$eval('.jnav-chip', l => l.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
    console.log(name, 'çipler:', chips.join(' | '));
    // Kuş Defteri çipine dokun: başlık şeridin altında görünür mü
    const i = chips.findIndex(c => /Kuş/.test(c));
    await p.$eval(`.jnav-chip[data-id="${i}"]`, e => e.scrollIntoView({ inline: 'center', block: 'nearest' }));
    await p.click(`.jnav-chip[data-id="${i}"]`); await p.waitForTimeout(900);
    const pos = await p.evaluate(i => { const n = document.querySelector('.jnav').getBoundingClientRect(), h = document.getElementById('jsec' + i).getBoundingClientRect(); return { nav: Math.round(n.bottom), head: Math.round(h.top) }; }, i);
    console.log(name, 'kuş başlığı şeridin altında mı:', pos.head >= pos.nav - 1 && pos.head < pos.nav + 60, JSON.stringify(pos));
    // yeniden çizim: kaydırma korunur
    const before = await p.$eval('.panes', e => e.scrollTop), navX = await p.$eval('.jnav', e => e.scrollLeft);
    await p.evaluate(() => { document.querySelector('#btnPhoto').click(); });
    await p.waitForTimeout(500); await p.click('#modalBtn'); await p.waitForTimeout(500);
    console.log(name, 'yeniden çizimde kaydırma korundu mu:', Math.abs((await p.$eval('.panes', e => e.scrollTop)) - before) < 400, '· şerit:', Math.abs((await p.$eval('.jnav', e => e.scrollLeft)) - navX) < 2);
    await p.screenshot({ path: `${process.env.SP}/jnav_${name}.png`, clip: vp ? undefined : { x: 890, y: 55, width: 390, height: 805 } });
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
