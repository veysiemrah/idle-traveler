// Göç Yolu (12. rota): rota kartı, Hüdhüd gündüz/gece/telefonda (tepesi dokununca açılır), dokununca hız ve kredi ×2 etkisi,
// Kuş Defteri'nde altın kenarlı gizli sayfa (kıyafet sayısını değiştirmez), yalnızca bu rotada kendiliğinden gelmesi,
// on birinci dönüşte rotanın açılması
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
  const today = new Date().toLocaleDateString('sv-SE');
  const open = async (save, vp, sky, dark) => {
    const p = await b.newPage({ locale: 'tr-TR', viewport: vp || { width: 1280, height: 860 }, colorScheme: dark ? 'dark' : 'light' });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(hook);
    await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } },
      Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, msIdx: 99, harvestDay: today, trips: 11, routeMax: 11, memories: 300, route: 'migrate',
        distance: 10, regionIdx: 0, settings: { sky: sky || 'day', zoom: 1 } }, save));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1300);
    return p;
  };
  const saved = async p => { await p.evaluate(() => window.dispatchEvent(new Event('pagehide'))); return p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1'))); };
  const toasts = async p => (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();
  const spawnMid = p => p.evaluate(() => {
    const c = document.querySelector('.hud-card').getBoundingClientRect(), r = __sc.canvas.getBoundingClientRect();
    __sc.spawnBird('hoopoe', (c.bottom - r.top) / __sc.zoom); __sc.bird.t = 3; __sc.bird.x = __sc.W * 0.5;
  });
  const where = p => p.evaluate(() => {
    const bd = __sc.bird, q = __sc.birdPos(bd, 0), r = __sc.canvas.getBoundingClientRect(), z = __sc.zoom;
    return { x: r.left + (q.x + q.dir * 4 * q.k) * z, y: r.top + (q.y - 2 * q.k) * z };
  });

  // 1) Rota kartı ve Hüdhüd: gündüz, gece, telefonda
  for (const [name, vp, sky, dark] of [['day', null, 'day'], ['night', null, 'night', true], ['phone', { width: 320, height: 640 }, 'night', true]]) {
    const p = await open({}, vp, sky, dark);
    if (name === 'day') {
      await p.click('.tab[data-id="buffs"]'); await p.waitForTimeout(300);
      console.log('rota kartı:', (await p.textContent('.card.home')).replace(/\s+/g, ' ').match(/Göç Yolu[^.]*\./) || '(yok)');
    }
    await spawnMid(p); await p.waitForTimeout(120);
    const pt = await where(p);
    const clip = vp ? { x: 0, y: Math.max(0, pt.y - 90), width: vp.width, height: 170 } : { x: pt.x - 210, y: pt.y - 90, width: 420, height: 170 };
    await p.screenshot({ path: `${process.env.SP}/migrate_${name}.png`, clip });
    await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(260);
    await p.screenshot({ path: `${process.env.SP}/migrate_${name}_noted.png`, clip });
    const s = await saved(p);
    console.log(name, 'Hüdhüd:', s.birds.hoopoe, '· etki:', s.effects.map(e => e.id).join(','), '·', (await toasts(p)).slice(-110));
    if (name === 'day') {
      await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
      console.log('defter:', await p.$$eval('.keep.bird', l => l.map(e => e.className.replace('keep bird', '').trim() + ':' + e.innerText.replace(/\s+/g, ' ')).join(' | ')));
      await p.$eval('.keeps.birds', e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(150);
      await p.screenshot({ path: `${process.env.SP}/migrate_journal.png`, clip: { x: 890, y: 55, width: 390, height: 805 } });
      console.log('kıyafet:', await p.$eval('.outfit[data-id="birder"]', e => e.innerText.replace(/\s+/g, ' ')));
    }
    await p.close();
  }

  // 2) Kendiliğinden gelir (ilki 45–75 sn) yalnızca Göç Yolu'nda
  const w = await open({}), o = await open({ route: 'kite', trips: 10, routeMax: 10 });
  let seen = 0, other = false;
  for (let i = 0; i < 90 && !seen; i++) {
    await w.waitForTimeout(1000);
    if (await w.evaluate(() => __sc.bird && __sc.bird.id === 'hoopoe')) seen = i + 1;
    if (await o.evaluate(() => __sc.bird && __sc.bird.id === 'hoopoe')) other = true;
  }
  console.log('Göç Yolu\'nda Hüdhüd (sn):', seen, '·', (await toasts(w)).slice(-80), '· başka rotada geldi mi:', other);
  await w.close(); await o.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
