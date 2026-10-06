const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); });
  await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', credits: 2e7, clicks: 300, owned: { walk: 1, skates: 1, board: 1, bike: 1 }, levels: { bike: 24, walk: 3 }, active: 'bike' })); } });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  const hint = await p.$eval('[data-act="upgrade"][data-id="bike"]', b => b.closest('.up').querySelector('small').textContent);
  console.log('ipucu (sv 24):', hint, '| sahne aşaması:', await p.evaluate(() => __sc.vehTier), '| simge aşaması:', await p.$eval('canvas[data-icon="bike"]', c => c.dataset.tier));
  await p.$eval('[data-act="upgrade"][data-id="bike"]', e => e.scrollIntoView({ block: 'center' }));
  await p.click('[data-act="upgrade"][data-id="bike"]'); await p.waitForTimeout(400);
  console.log('bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(0, 140));
  console.log('sv 25 → sahne aşaması:', await p.evaluate(() => __sc.vehTier), '| simge:', await p.$eval('canvas[data-icon="bike"]', c => c.dataset.tier), '| ipucu:', await p.$eval('[data-act="upgrade"][data-id="bike"]', b => b.closest('.up').querySelector('small').textContent));
  await p.screenshot({ path: process.env.SP + '/lookgame.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
