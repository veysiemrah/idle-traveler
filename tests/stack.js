const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); });
  await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50,
    effects: [{ id: 'gust', until: Date.now() + 400000 }, { id: 'harvest', until: Date.now() + 120000 }] })); } });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(600);
  const pills = () => p.$$eval('#effects .fx', els => els.map(e => e.textContent).join(' | '));
  const catchOne = async (r) => {
    await p.evaluate(r => { __sc.spawnGift(14); window.__r = Math.random; Math.random = () => r; }, r);
    await p.waitForTimeout(1200);
    const g = await p.evaluate(() => { const c = __sc.canvas.getBoundingClientRect(); return { x: __sc.gift.x + c.left, y: __sc.gift.y + c.top }; });
    await p.mouse.click(g.x, g.y); await p.evaluate(() => { Math.random = window.__r; }); await p.waitForTimeout(300);
    return (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();
  };
  console.log('başta  :', await pills());
  console.log('rüzgâr (6 dk 40 sn kaldı) yakalandı →', (await catchOne(0.01)).slice(-90));
  console.log('etkiler:', await pills());
  console.log('rüzgâr tekrar →', (await catchOne(0.01)).slice(-70));
  console.log('etkiler:', await pills());
  // bereket 2 dk kaldı → süre uzar (çarpan değil). Ağırlık sırası: gust 3, harvest 3 → r=0.45 harvest
  console.log('bereket (2 dk kaldı) yakalandı →', (await catchOne(0.45)).slice(-80));
  console.log('etkiler:', await pills());
  const sv = await p.evaluate(() => { const S = JSON.parse(localStorage.getItem('idle-traveler-save-v1')); return 1; });
  await p.waitForTimeout(5200); await p.reload(); await p.waitForTimeout(500);
  console.log('yeniden yükle:', await pills());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
