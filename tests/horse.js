// Araç animasyonu film şeridi: sahneden art arda kareler alıp tek görüntüde birleştirir.
// Kullanım: node horse.js [araç]   (varsayılan: horse). Düz (Sv. 0) ve tüm süsleriyle (Sv. 100), gündüz ve gece.
// Çıktı: out/<araç>_strip_*.png
const { chromium } = require('./lib/pw');
const VEH = process.argv[2] || 'horse';
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [name, lvl, scheme] of [['plain_day', 0, 'light'], ['gold_night', 100, 'dark']]) {
    const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 900, height: 700 }, colorScheme: scheme, deviceScaleFactor: 2 });
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.addInitScript(([l, v]) => { localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50,
      owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, [v]: 1 }, levels: { [v]: l }, active: v })); }, [lvl, VEH]);
    await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); });
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
    // 10 kare, ~60 ms arayla: yolcunun çevresi büyük bir tuvale yan yana kopyalanır
    await p.evaluate(async () => {
      const sc = window.__sc, src = sc.canvas, dpr = src.width / sc.W, k = sc.k;
      const w = 130 * k * dpr, h = 120 * k * dpr, sx = (sc.travelerX - 60 * k) * dpr, sy = (sc.groundY() - 105 * k) * dpr;
      const out = document.createElement('canvas'); out.width = w * 5; out.height = h * 2; out.id = '__strip';
      const ctx = out.getContext('2d');
      for (let i = 0; i < 10; i++) { await new Promise(r => setTimeout(r, 60)); ctx.drawImage(src, sx, sy, w, h, (i % 5) * w, Math.floor(i / 5) * h, w, h); }
      Object.assign(out.style, { position: 'fixed', left: '0', top: '0', width: (w * 5 / dpr) + 'px', height: (h * 2 / dpr) + 'px', zIndex: 9999, background: '#000' });
      document.body.appendChild(out);
    });
    await p.locator('#__strip').screenshot({ path: `${process.env.SP}/${VEH}_strip_${name}.png` });
    // toz bulutları
    const dust = await p.evaluate(async () => { let n = 0; for (let i = 0; i < 20; i++) { await new Promise(r => setTimeout(r, 50)); n = Math.max(n, window.__sc.parts.filter(x => x.type === 'dust').length); } return n; });
    console.log(name, '| toz parçacığı (en çok):', dust);
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
