// Kervan ve canlı mesafe: A ile B birbirine yakın; ikisinde de Kervan etkisi, etiketler geriye akmaz
const { chromium } = require('./lib/pw');
const BASE = 'http://127.0.0.1:8787';
(async () => {
  const b = await chromium.launch(); const errs = [];
  const base = 9e7 + Math.random() * 1e7;
  const open = async (name, dist, veh) => {
    const ctx = await b.newContext({ locale: 'tr-TR', viewport: { width: 1280, height: 760 } });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.addInitScript(([name, dist, veh]) => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: dist, regionIdx: 9,
      owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, moto: 1, car: 1 }, levels: { car: 20 }, active: veh,
      player: { id: crypto.randomUUID(), key: Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join(''), name } })); }, [name, dist, veh]);
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(1200);
    return p;
  };
  const A = await open('Ayşe', base, 'car'), B = await open('Bora', base + 1500, 'car');
  await B.evaluate(() => IT.Online.now()); await A.waitForTimeout(800); await A.evaluate(() => IT.Online.now()); await A.waitForTimeout(1500);
  const fx = p => p.evaluate(() => (document.querySelector('[data-fx="caravan"]') || {}).textContent || '(yok)');
  console.log('A etkisi:', await fx(A), '| bildirim:', /Kervana katıldın/.test(await A.textContent('#toasts')));
  await B.evaluate(() => IT.Online.now()); await B.waitForTimeout(1500);
  console.log('B etkisi:', await fx(B));
  // Bora'nın A'daki tahmini mesafe farkı 15 sn boyunca (bildirim arası) kaymamalı
  const diffs = [];
  for (let i = 0; i < 4; i++) {
    diffs.push(await A.evaluate(() => { const d = IT.Online.data; const p = d.players.find(x => x.name === 'Bora'); const s = JSON.parse(localStorage.getItem('idle-traveler-save-v1')); return Math.round(IT.Online.liveDist(p)); }));
    await A.waitForTimeout(5000);
  }
  console.log('Bora tahmini mesafe artışı (5 sn arayla):', diffs.slice(1).map((d, i) => Math.round(d - diffs[i])).join(', '), 'm');
  // v1.27: pencere yolun %15'i (en az 10 km). %10 öndeki Cem kervana katılır (eski %3'lük pencerede katılmazdı), %30 öndeki Deniz katılmaz.
  const C = await open('Cem', base * 1.1, 'car'), D = await open('Deniz', base * 1.3, 'car');
  await C.evaluate(() => IT.Online.now()); await D.evaluate(() => IT.Online.now()); await A.waitForTimeout(1200);
  await A.evaluate(() => IT.Online.now()); await A.waitForTimeout(1500);
  console.log('A etkisi (uzak gezginlerle):', await fx(A), '| beklenen: 2 gezgin');
  await A.screenshot({ path: process.env.SP + '/caravan.png', clip: { x: 0, y: 55, width: 890, height: 640 } });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
