const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 }, colorScheme: 'light' });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); });
  await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ intro: true, lastSeen: Date.now(), credits: 100, clicks: 50, seenVer: '1.10' })); } });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  // Seçenek
  await p.click('#btnSettings'); await p.waitForTimeout(200);
  console.log('gökyüzü seçenekleri:', (await p.$$eval('[data-act="sky"]', bs => bs.map(b => b.textContent))).join(' / '));
  await p.click('[data-act="sky"][data-id="cycle"]'); await p.waitForTimeout(300);
  console.log('bilgi:', await p.textContent('.sky-info'), '| data-theme:', await p.evaluate(() => document.documentElement.getAttribute('data-theme')), '| cycle:', await p.evaluate(() => __sc.cycle));
  // Ölçüm: her biyomda 2 tam gün simüle et
  const res = await p.evaluate(() => {
    const sc = __sc, out = {};
    for (const biome of ['meadow', 'wheat', 'desert', 'autumn', 'snow', 'aurora']) {
      sc.biome = biome; sc.dayFrac = IT.BIOMES[biome].day; sc.duskK = IT.BIOMES[biome].dusk;
      let day = 0, night = 0, twi = 0, T = 0; const dt = 0.25;
      while (T < 1200) { sc.update(dt, 5, 0); const e = Math.sin((sc.tod - 0.25) * Math.PI * 2); if (e > 0) day += dt; else night += dt; if (Math.abs(e) < 0.2) twi += dt; T += dt; sc.parts.length = 0; }
      out[biome] = `gündüz ${(day / 2 / 60).toFixed(1)} dk, gece ${(night / 2 / 60).toFixed(1)} dk, alacakaranlık ${(twi / 4).toFixed(0)} sn (her geçiş)`;
    }
    return out;
  });
  for (const [k, v] of Object.entries(res)) console.log('  ', k.padEnd(8), v);
  // gece ekran görüntüsü (sayfa açık tema)
  await p.evaluate(() => { __sc.biome = 'meadow'; __sc.cycTod = 0.95; });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: process.env.SP + '/cycle_night.png' });
  console.log('gece mi:', await p.evaluate(() => __sc.nightAmt.toFixed(2)), '| sayfa teması açık mı:', await p.evaluate(() => getComputedStyle(document.body).backgroundColor), '| düğme ay mı:', await p.isVisible('#btnSky .ico-moon'));
  // gece rozeti sayacı ilerliyor mu
  // düğmeyle döngüden çık
  await p.click('#modalBtn'); await p.waitForTimeout(200); await p.click('#btnSky'); await p.waitForTimeout(300);
  console.log('düğmeden sonra ayar:', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).settings.sky), '| cycle:', await p.evaluate(() => __sc.cycle));
  // tekrar döngü → otomatik: yumuşak dönüş, sıçrama yok
  await p.click('#btnSettings'); await p.waitForTimeout(200); await p.click('[data-act="sky"][data-id="cycle"]'); await p.waitForTimeout(300);
  const t0 = await p.evaluate(() => __sc.tod);
  await p.click('[data-act="sky"][data-id="auto"]');
  const t1 = await p.evaluate(() => { __sc.update(0.016, 5, 0); return __sc.tod; });
  console.log('döngü kapanınca saat sıçradı mı:', Math.abs(t1 - t0) > 0.02, t0.toFixed(3), t1.toFixed(3));
  // yeniden yükle: döngü kalıcı mı
  await p.click('[data-act="sky"][data-id="cycle"]'); await p.waitForTimeout(200);
  await p.reload(); await p.waitForTimeout(500);
  console.log('yeniden yükle → cycle:', await p.evaluate(() => __sc.cycle));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
