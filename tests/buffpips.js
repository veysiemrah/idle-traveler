// Güçlendirme eşik noktaları (v1.58): sınırsız üç güçlendirmenin rozetinde beş nokta (Sv. 25/50/100/150/200); eşiği geçen
// alım altın bildirim, kart parlaması ve yeni dolan noktanın büyümesiyle kutlanır, yalnızca o kartta. Sv. 200'de rozet altın.
// Uzun durak adı kırpılmaz, yavaşça kayar (Almanca 320 px). Gündüz/gece, açık/koyu tema, 320 px'te taşma yok.
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [name, loc, vp, dark, sky] of [['d1100', 'de-DE', { width: 1100, height: 760 }, false, 'day'], ['p320', 'fr-FR', { width: 320, height: 640 }, true, 'night'],
    ['p390', 'tr-TR', { width: 390, height: 800 }, false, 'day'], ['p320de', 'de-DE', { width: 320, height: 640 }, false, 'day']]) {
    const p = await b.newPage({ locale: loc, viewport: vp, colorScheme: dark ? 'dark' : 'light', hasTouch: vp.width < 500, isMobile: vp.width < 500 });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); localStorage.setItem('idle-traveler-open', '["b:stride","b:breeze","b:postcard"]'); } },
      { v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, credits: 1e40, distance: 5e9, regionIdx: 10, msIdx: 16, owned: { walk: 1 }, levels: { walk: 10 }, active: 'walk',
        buffs: { stride: 24, breeze: 50, postcard: 205 }, settings: { sky, zoom: 1 } });
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
    if (name === 'p320de') {
      const ms = () => p.$eval('#msName', e => [e.classList.contains('pan'), parseFloat(getComputedStyle(e).textIndent), e.scrollWidth > e.clientWidth]);
      const a = await ms(); await p.waitForTimeout(4500); const c = await ms();
      console.log(name, 'uzun durak adı kayıyor mu:', a[0] && a[2] && c[1] < -5, '· başta yerinde mi:', a[1] === 0);
      await p.close(); continue;
    }
    await p.click('.tab[data-id="buffs"]'); await p.waitForTimeout(500);
    const pips = () => p.$$eval('.card.buff .lvl', l => l.slice(0, 3).map(e => [...e.querySelectorAll('.pips i')].map(i => i.className || '-').join(' ') + (e.classList.contains('top') ? ' (altın)' : '')));
    console.log(name, 'noktalar (önce):', (await pips()).join(' | '));
    await p.click('[data-act="buff"][data-id="stride"]'); await p.waitForTimeout(450);
    const tst = (await p.textContent('#toasts')).replace(/\s+/g, ' ');
    console.log(name, 'eşik bildirimi:', /×2|2 katına/.test(tst), '· parlayan kartlar:', await p.$$eval('.card.surge', l => l.map(e => e.dataset.fold).join(',')), '· noktalar (sonra):', (await pips()).join(' | '));
    // eşik olmayan alım kutlanmaz
    await p.click('[data-act="buff"][data-id="breeze"]'); await p.waitForTimeout(450);
    console.log(name, 'eşiksiz alımda parlama var mı:', !!(await p.$('.card.surge')), '· eşik bildirimi yinelendi mi:', ((await p.textContent('#toasts')).match(/×2|2 katına/g) || []).length > 1);
    console.log(name, 'taşan satır:', await p.$$eval('#pane-buffs .card .row', l => l.filter(r => r.scrollWidth > r.clientWidth + 4).length));
    await p.screenshot({ path: `${process.env.SP}/buffpips_${name}.png` });
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
