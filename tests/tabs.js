// Dört sekme dar ekranlarda ve uzun dillerde sığıyor mu; garajdaki ipucu satırı
const { chromium } = require('./lib/pw');
const BASE = process.argv[2] || 'http://127.0.0.1:8787';
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [locale, w, lvl] of [['tr-TR', 390, 4], ['tr-TR', 320, 10], ['de-DE', 320, 4], ['fr-FR', 360, 12], ['es-ES', 1280, 3]]) {
    const p = await b.newPage({ locale, viewport: { width: w, height: w > 900 ? 860 : 760 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(l => { localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', credits: 900, owned: { walk: 1, skates: 1, board: 1 }, levels: { board: l }, active: 'board', player: { id: '11111111-2222-4333-8444-555555555555', key: 'c'.repeat(64), name: 'Test' } })); }, lvl);
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(800);
    const tabs = await p.$$eval('.tab', ts => ts.map(t => ({ txt: t.textContent.trim(), cut: t.scrollWidth > t.clientWidth + 1 })));
    const tip = await p.$eval('[data-act="buyVeh"]', bt => bt.closest('.card').querySelector('.trade').textContent + ' | ' + bt.dataset.cost);
    console.log(locale, w, JSON.stringify(tabs), '\n   ', tip);
    const panel = await p.$('#panel'); await panel.screenshot({ path: `${process.env.SP}/tabs_${locale}_${w}.png` });
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
