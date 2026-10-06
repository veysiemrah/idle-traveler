const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [locale, w, h] of [['tr-TR', 1280, 860], ['de-DE', 390, 844], ['fr-FR', 320, 700]]) {
    const p = await b.newPage({ locale, viewport: { width: w, height: h } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 2, intro: true, lastSeen: Date.now(), credits: 500, clicks: 50, distance: 300, seenVer: '9.0' })); } });
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
    const tb = await p.$eval('.topbar', e => `${Math.round(e.getBoundingClientRect().height)}px sw${e.scrollWidth}/${e.clientWidth}`);
    await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
    const jHas = await p.$$eval('#pane-journal [data-act="sky"], #pane-journal .lang-select', x => x.length);
    await p.click('#btnSettings'); await p.waitForTimeout(300);
    console.log(`${locale} ${w} | topbar ${tb} | defterde ayar: ${jHas} | pencere: ${(await p.textContent('#modalBody')).replace(/\s+/g, ' ').trim().slice(0, 70)}`);
    await p.screenshot({ path: `${process.env.SP}/settings_${w}.png` });
    await p.click('#modalBody [data-act="sky"][data-id="cycle"]'); await p.waitForTimeout(200);
    await p.click('#modalBody [data-act="units"][data-id="imperial"]'); await p.waitForTimeout(200);
    await p.click('#modalBody [data-act="sfx"]'); await p.waitForTimeout(200);
    const pressed = await p.$$eval('#modalBody [aria-pressed="true"]', x => x.map(e => e.dataset.id || e.dataset.act).join(','));
    console.log(`   seçili: ${pressed} | döngü bilgisi: ${await p.isVisible('#modalBody .sky-info')} | HUD: ${await p.textContent('#hudDist')}`);
    await p.selectOption('#modalBody .lang-select', 'es'); await p.waitForTimeout(300);
    console.log(`   dil es → başlık: ${await p.textContent('#modalBody h2')} | düğme: ${await p.textContent('#modalBtn')}`);
    await p.click('#modalBody [data-act="reset"]'); const lbl = await p.textContent('#modalBody [data-act="reset"]');
    await p.click('#modalBody [data-act="reset"]'); await p.waitForTimeout(200);
    console.log(`   sıfırla: ilk dokunuş "${lbl}" → sonra "${await p.textContent('#modalBody [data-act="reset"]')}" | yol ${await p.textContent('#hudDist')}`);
    await p.click('#modalBtn'); await p.waitForTimeout(200);
    console.log(`   kapandı: ${await p.isHidden('#modal')}`);
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
