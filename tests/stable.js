const { chromium } = require('./lib/pw');
// Butonların konumu değerler değiştikçe sabit kalıyor mu?
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [locale, vw] of [['tr-TR', [1280, 860]], ['de-DE', [390, 844]], ['en-US', [1024, 700]]]) {
    const p = await b.newPage({ locale, viewport: { width: vw[0], height: vw[1] } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1);
      localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ intro: true, lastSeen: Date.now(), credits: 3e7, distance: 9e5, regionIdx: 6, clicks: 50,
        owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1 }, levels: { walk: 9, skates: 3, bike: 8, horse: 0 }, active: 'horse', buffs: {} })); } });
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(700);
    const pos = () => p.$$eval('#panel [data-act]:not(.tab)', els => Object.fromEntries(els.filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [e.dataset.act + ':' + (e.dataset.id || ''), [Math.round(r.left), Math.round(r.top), Math.round(r.width)]]; })));
    const diff = (a, c) => Object.keys(a).filter(k => c[k] && (a[k][0] !== c[k][0] || a[k][1] !== c[k][1] || a[k][2] !== c[k][2])).map(k => `${k} ${a[k]}→${c[k]}`);
    const report = [];
    const check = async (label, fn) => { const a = await pos(); await fn(); await p.waitForTimeout(250); const c = await pos(); const d = diff(a, c); report.push(`${label}: ${d.length ? 'KAYDI ' + d.slice(0, 3).join(' | ') : 'sabit'}`); };
    const scroll = sel => p.$eval(sel, e => e.scrollIntoView({ block: 'center' }));
    await scroll('[data-act="upgrade"][data-id="bike"]');
    for (let i = 0; i < 4; i++) await check('bisiklet ×1 yükselt #' + (i + 1), () => p.click('[data-act="upgrade"][data-id="bike"]'));
    await scroll('[data-act="upgrade"][data-id="horse"]'); await check('at yükselt (en güçlü değişir)', () => p.click('[data-act="upgrade"][data-id="horse"]'));
    await scroll('[data-act="upgrade"][data-id="walk"]'); await check('yürüyüş 9→10 (katlanma)', () => p.click('[data-act="upgrade"][data-id="walk"]'));
    await p.click('[data-act="bulk"][data-id="max"]'); await p.waitForTimeout(200);
    await check('Maks: zaman geçer (kredi artar)', () => p.waitForTimeout(1500));
    await scroll('[data-act="upgrade"][data-id="horse"]'); await check('Maks: at yükselt', () => p.click('[data-act="upgrade"][data-id="horse"]'));
    await p.click('[data-act="bulk"][data-id="1"]');
    await p.click('.tab[data-id="buffs"]'); await p.waitForTimeout(200);
    for (const id of ['stride', 'stride', 'luck', 'dream', 'camp', 'butterfly']) { await scroll(`[data-act="buff"][data-id="${id}"]`); await check('güçlendirme ' + id, () => p.click(`[data-act="buff"][data-id="${id}"]`)); }
    await p.click('.tab[data-id="garage"]'); await p.waitForTimeout(200);
    await p.screenshot({ path: `${process.env.SP}/stable_${locale}.png` });
    console.log(`== ${locale} ${vw.join('x')}\n  ` + report.join('\n  '));
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
