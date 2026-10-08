const { chromium } = require('./lib/pw');
// Rastgele etkileşim: hata, NaN, undefined, ∞ ya da sızan anahtar ara
(async () => {
  const b = await chromium.launch(); const errs = new Set();
  const seeds = [
    { intro: true, lastSeen: Date.now(), credits: 1e13, distance: 2e10, regionIdx: 14, msIdx: 16, clicks: 5000, owned: Object.fromEntries(['walk','skates','board','bike','horse','moto','car','van','train','balloon','plane','jet','rocket'].map(k => [k, 1])), levels: { rocket: 40 }, active: 'rocket' },
    { intro: false },
    { intro: true, lastSeen: Date.now() - 30 * 86400e3, credits: 200, distance: 100 },
  ];
  for (let si = 0; si < seeds.length; si++) for (const [locale, vw] of [['tr-TR', [1280, 860]], ['fr-FR', [390, 844]]]) {
    const p = await b.newPage({ locale, viewport: { width: vw[0], height: vw[1] } });
    p.on('pageerror', e => errs.add(`${si}/${locale}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|net::|501 \(Unsupported/.test(m.text())) errs.add(`${si}/${locale}: ${m.text()}`); });
    await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } }, seeds[si]);
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
    let bad = new Set();
    for (let i = 0; i < 260; i++) {
      const r = Math.random();
      try {
        if (!(await p.isHidden('#modal'))) { if (r < 0.4) { await p.click('#modalBtn', { timeout: 500 }); continue; } const ms = await p.$$('#modalBody [data-act]:not([disabled])'); if (ms.length && r < 0.8) { await ms[Math.floor(Math.random() * ms.length)].click({ timeout: 500 }); continue; } }
        if (r < 0.45) await p.mouse.click(vw[0] < 500 ? 50 + Math.random() * 300 : 100 + Math.random() * 700, vw[0] < 500 ? 100 + Math.random() * 250 : 100 + Math.random() * 600);
        else if (r < 0.75) { const els = await p.$$('#panel [data-act]:not([disabled])'); if (els.length) { const e = els[Math.floor(Math.random() * els.length)]; await e.scrollIntoViewIfNeeded({ timeout: 500 }); await e.click({ timeout: 500 }); } }
        else if (r < 0.82) await p.click(`.tab[data-id="${['garage', 'buffs', 'journal'][Math.floor(Math.random() * 3)]}"]`, { timeout: 500 });
        else if (r < 0.86) await p.click(['#btnSky', '#btnSound', '#btnPhoto', '#btnSettings', '#btnNews'][Math.floor(Math.random() * 5)], { timeout: 500 });
        else if (r < 0.89) await p.evaluate(l => { const s = document.querySelector('.lang-select'); if (s) { s.value = l; s.dispatchEvent(new Event('change', { bubbles: true })); } }, ['tr', 'en', 'de', 'es', 'fr', 'auto'][Math.floor(Math.random() * 6)]);
        else if (r < 0.93) await p.keyboard.press('Space');
        else await p.waitForTimeout(400);
      } catch (e) { /* tıklanamayan öğe */ }
      if (i % 20 === 0) {
        const txt = await p.evaluate(() => document.body.innerText);
        for (const m of txt.match(/NaN|undefined|Infinity|∞|null|\b(?:ui|veh|buff|gift|badge|toast|garage|j|off|home|homecard|intro|pc|float)\.[a-zA-Z0-9]+/g) || []) bad.add(m);
      }
    }
    await p.screenshot({ path: `${process.env.SP}/fuzz_${si}_${locale}.png` });
    console.log(`seed ${si} ${locale}: şüpheli metin: ${[...bad].join(', ') || 'yok'}`);
    await p.close();
  }
  console.log([...errs].join('\n') || 'no errors'); await b.close();
})();
