const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); });
  await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50, credits: 100, mapPieces: 3 })); } });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
  console.log('defter (önce):', (await p.$eval('.tmap', e => e.closest('#pane-journal').querySelector('.sec:has(+ .tmap)').textContent + ' | ' + e.textContent)).replace(/\s+/g, ' '));
  // kelebeği yakala, parça düşsün
  await p.evaluate(() => { __sc.spawnGift(14); window.__r = Math.random; Math.random = () => 0.01; });
  await p.waitForTimeout(1200);
  const g = await p.evaluate(() => { const c = __sc.canvas.getBoundingClientRect(); return { x: __sc.gift.x + c.left, y: __sc.gift.y + c.top }; });
  await p.mouse.click(g.x, g.y); await p.evaluate(() => { Math.random = window.__r; }); await p.waitForTimeout(300);
  console.log('bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(0, 160));
  await p.waitForTimeout(5000);
  console.log('sandık var mı:', await p.evaluate(() => !!__sc.chest));
  await p.screenshot({ path: process.env.SP + '/chest.png' });
  const c = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), q = __sc.chestPos(); return { x: q.x + r.left, y: q.y + r.top - 14 * __sc.k }; });
  const cr0 = await p.textContent('#credits');
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(400);
  console.log('sandık sonrası:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-120), '| kredi', cr0, '→', await p.textContent('#credits'));
  await p.waitForTimeout(300);
  console.log('defter (sonra):', (await p.$eval('.tmap', e => e.closest('#pane-journal').querySelector('.sec:has(+ .tmap)').textContent)).replace(/\s+/g, ' '));
  await p.$eval('.tmap', e => e.scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: process.env.SP + '/tmap.png', clip: { x: 890, y: 55, width: 390, height: 805 } });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
