const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  // eski (v1) kayıt: 900 km, bölge 6 (Kiraz Çiçeği), 8 durak geçilmiş
  const old = { intro: true, lastSeen: Date.now(), credits: 1e6, clicks: 300, distance: 9e5, lifeDist: 2e6, best: 400, regionIdx: 6, msIdx: 8, seenVer: '1.11',
    owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1 }, levels: { horse: 21 }, active: 'horse', badges: { marathon: 1 } };
  for (const [locale, seed] of [['tr-TR', old], ['en-US', old], ['tr-TR', { intro: true, lastSeen: Date.now(), clicks: 10, seenVer: '1.11' }]]) {
    const p = await b.newPage({ locale, viewport: { width: 1280, height: 860 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } }, seed);
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(600);
    const before = await p.textContent('#credits');
    for (let i = 0; i < 6; i++) { await p.mouse.click(400, 400); await p.waitForTimeout(90); }
    await p.waitForTimeout(150);
    const sv = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('idle-traveler-save-v1')); return s; });
    console.log(`${locale} | yol ${await p.textContent('#hudDist')} | hız ${await p.textContent('#hudSpeed')} | bölge ${await p.textContent('#hudRegion')} | durak ${await p.textContent('#msName')} ${await p.textContent('#msProg')} | kredi ${before} | gelir ${await p.textContent('#income')}`);
    console.log(`   bildirimler: ${(await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(0, 140) || '-'} | görsel hız vs: ${await p.evaluate(() => 0)}`);
    await p.screenshot({ path: `${process.env.SP}/scale_${locale}_${seed.distance ? 'old' : 'new'}.png` });
    await p.waitForTimeout(5200);
    const s2 = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
    console.log(`   kayıt: v${s2.v} mesafe ${s2.distance.toFixed(1)} ömür ${s2.lifeDist} rekor ${s2.best.toFixed(1)} msIdx ${s2.msIdx} bölge ${s2.regionIdx}`);
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
