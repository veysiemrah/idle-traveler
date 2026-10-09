// Takımyıldızlar: gece belirir (gündüz belirmez), yıldızlara dokununca birleşir ve haritaya işlenir, bulunanlar gökyüzünde kalır,
// sekizincide Yıldız Haritacısı kıyafeti açılır; telefonda konum kartının arkasında kalmaz
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
  const open = async (save, vp, sky) => {
    const p = await b.newPage({ locale: 'tr-TR', viewport: vp || { width: 1280, height: 860 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(hook);
    await p.addInitScript(s => localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)),
      Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50, letters: 12, settings: { sky: sky || 'night', zoom: 1 } }, save));
    await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => window.__sc, null, { timeout: 15000 }); await p.waitForTimeout(1500);
    return p;
  };
  const toasts = async p => (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();
  // aktif takımyıldızın i. yıldızına sayfa koordinatıyla dokunur
  const tapStar = async (p, i) => {
    const pt = await p.evaluate(i => { const s = __sc.constStarPos(__sc.constel, i), r = __sc.canvas.getBoundingClientRect(), z = __sc.zoom; return { x: r.left + s.x * z, y: r.top + s.y * z }; }, i);
    await p.mouse.click(pt.x, pt.y);
  };

  // 1) Gündüz gelmez, gece 60–100 sn içinde gelir
  let p = await open({}, null, 'day');
  let seen = await p.evaluate(() => new Promise(r => { let n = 0; const id = setInterval(() => { n++; if (__sc.constel || n > 20) { clearInterval(id); r(!!__sc.constel); } }, 200); }));
  console.log('gündüz (4 sn içinde) takımyıldız:', seen, '(sayaç gündüz işlemez)');
  await p.close();
  p = await open({}, null, 'night');
  seen = 0;
  for (let i = 0; i < 110 && !seen; i++) { await p.waitForTimeout(1000); if (await p.evaluate(() => !!__sc.constel)) seen = i + 1; }
  console.log('gece takımyıldız geldi (sn):', seen, '·', await toasts(p));
  await p.screenshot({ path: process.env.SP + '/const_active.png' });
  // yıldızlara dokun: ilk dokunuşta bir yıldız yanar, hepsi yanınca tamamlanır
  const n = await p.evaluate(() => __sc.constel.c.s.length);
  await tapStar(p, 0); await p.waitForTimeout(150);
  console.log('ilk dokunuş: yanan', await p.evaluate(() => __sc.constel.n), '/', n);
  // sahnenin boş bir yerine dokunmak yıldız yakmaz (adım sayılır)
  const clicksBefore = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks || 0);
  await p.mouse.click(400, 600); await p.waitForTimeout(100);
  console.log('boş yere dokununca yanan yıldız değişmedi mi:', (await p.evaluate(() => __sc.constel.n)) === 1);
  for (let i = 1; i < n; i++) { await tapStar(p, i); await p.waitForTimeout(120); }
  await p.waitForTimeout(600);
  await p.screenshot({ path: process.env.SP + '/const_done.png' });
  console.log('tamamlandı:', await toasts(p));
  let saved = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).consts);
  console.log('kayıt:', JSON.stringify(saved));
  await p.waitForTimeout(4500);
  console.log('solduktan sonra aktif takımyıldız:', await p.evaluate(() => !!__sc.constel), '· gökyüzünde bulunan:', await p.evaluate(() => __sc.constFound.join(',')));
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
  console.log('defter:', (await p.$eval('.keeps.consts', e => e.previousElementSibling.innerText + ' | ' + e.querySelectorAll('.keep.const.on').length + ' bulundu, ' + e.querySelectorAll('.keep.const:not(.on)').length + ' kapalı')).replace(/\s+/g, ' '));
  await p.$eval('.keeps.consts', e => e.scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: process.env.SP + '/const_journal.png', clip: { x: 890, y: 55, width: 390, height: 805 } });
  await p.close();

  // 2) Yedi takımyıldız bulunmuş: gökyüzü haritası çizilir; sekizinci tamamlanınca kıyafet açılır (rokette, uzayda da gelir)
  const seven = Object.fromEntries(['ursa', 'cassiopeia', 'orion', 'lyra', 'cygnus', 'aquila', 'minor'].map(k => [k, 1]));
  p = await open({ consts: seven, owned: { walk: 1, rocket: 1 }, active: 'rocket', distance: 1e9, regionIdx: 5, msIdx: 99 }, null, 'day');
  await p.waitForTimeout(2500);
  await p.screenshot({ path: process.env.SP + '/const_skymap.png' });
  seen = 0;
  for (let i = 0; i < 110 && !seen; i++) { await p.waitForTimeout(1000); if (await p.evaluate(() => !!__sc.constel)) seen = i + 1; }
  console.log('uzayda sekizinci geldi (sn):', seen, '· ilk ipucu tekrar mı:', /parlak/.test(await toasts(p)));
  const m = await p.evaluate(() => __sc.constel.c.s.length);
  for (let i = 0; i < m; i++) { await tapStar(p, i); await p.waitForTimeout(100); }
  await p.waitForTimeout(1400);
  console.log('sekizinci:', await toasts(p));
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
  console.log('kıyafet açık mı:', await p.$eval('.outfit[data-id="stargazer"]', e => !e.disabled + ' · ' + e.innerText.replace(/\s+/g, ' ')));
  await p.close();

  // 3) Telefonda (320 px) takımyıldız konum kartının arkasında kalmaz; kilitli kıyafet satırı
  p = await open({}, { width: 320, height: 640 }, 'night');
  await p.evaluate(() => __sc.spawnConst(IT.CONSTELLATIONS[0]));
  await p.waitForTimeout(1500);
  const under = await p.evaluate(() => {
    const hr = document.querySelector('.hud-card').getBoundingClientRect(), cr = __sc.canvas.getBoundingClientRect(), a = __sc.constel;
    return a.c.s.map((_, i) => __sc.constStarPos(a, i)).filter(s => { const x = cr.left + s.x * __sc.zoom, y = cr.top + s.y * __sc.zoom; return x > hr.left && x < hr.right && y > hr.top && y < hr.bottom; }).length;
  });
  console.log('telefonda kartın arkasındaki yıldız:', under);
  await p.screenshot({ path: process.env.SP + '/const_phone.png' });
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
  console.log('kilitli kıyafet:', await p.$eval('.outfit[data-id="stargazer"]', e => e.innerText.replace(/\s+/g, ' ')));
  await p.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
