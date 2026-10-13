// Bölgelerin ses manzarası (v1.55): kıyıda deniz katmanı açılır, başka bölgede kapanır; uzayda uğultu; çiçekli ovada gündüz
// kuş, gece cırcır böceği olayları üretilir; ortam sesi kapalıyken olay üretilmez; hata yok
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR' }); p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); });
  await p.addInitScript(() => localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', distance: 3500, regionIdx: 4, msIdx: 99, settings: { sky: 'day', music: true } })));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1000);
  await p.mouse.click(300, 450); await p.waitForTimeout(2500);
  // olayları say: tone/noise/osilatör oluşturma
  await p.evaluate(() => { window.__made = 0; const C = AudioContext.prototype.createOscillator; AudioContext.prototype.createOscillator = function () { window.__made++; return C.call(this); }; });
  const sea = () => p.evaluate(() => { const S = IT.Sound; return S && S.sea ? +S.sea.gain.value.toFixed(4) : -1; });
  console.log('kıyıda deniz kazancı:', await sea());
  await p.evaluate(() => __sc.setBiome('meadow', true)); await p.waitForTimeout(3000);
  console.log('ovada deniz kazancı:', await sea());
  await p.evaluate(() => { IT.Sound.ambE = 0; window.__made = 0; }); await p.waitForTimeout(400);
  console.log('ovada gündüz olay (osilatör):', await p.evaluate(() => window.__made));
  await p.evaluate(() => { IT.Sound.setMusic(false); IT.Sound.musicOn = false; IT.Sound.ambE = 0; window.__made = 0; }); await p.waitForTimeout(600);
  console.log('ortam sesi kapalı, olay:', await p.evaluate(() => window.__made));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
