// Sv. 150 ve 200 görünümleri (v1.28): yıldız tozu izi ve gökkuşağı kuyruğu sahnede, gece, garaj simgelerinde ve telefonda;
// Sv. 149 → 150 yükseltmesinde "hız ×2 ve yeni görünüm" bildirimi; Fener Yolu'nda durak ödülü beş kat.
const { chromium } = require('./lib/pw');
const save = (veh, lvl, extra) => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, credits: 1e30,
  owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, moto: 1, car: 1, van: 1, train: 1, balloon: 1, plane: 1, jet: 1, rocket: 1, sail: 1 },
  levels: { walk: 200, car: 150, train: 200, plane: 150, sail: 200, [veh]: lvl }, active: veh }, extra || {}));
(async () => {
  const b = await chromium.launch(); const errs = [];
  const shot = async (name, veh, lvl, opts) => {
    const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(veh, lvl));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(veh === 'plane' || veh === 'sail' ? 3500 : 1500);
    await p.screenshot({ path: `${process.env.SP}/look_${name}.png`, clip: opts && opts.isMobile ? undefined : { x: 0, y: 300, width: 700, height: 420 } });
    return p;
  };
  await (await shot('walk200', 'walk', 200)).close();
  await (await shot('car150_night', 'car', 150, { colorScheme: 'dark' })).close();
  await (await shot('train200', 'train', 200)).close();
  const pl = await shot('plane150', 'plane', 150);
  await pl.screenshot({ path: `${process.env.SP}/look_plane150.png`, clip: { x: 0, y: 60, width: 700, height: 420 } }); await pl.close();
  const sl = await shot('sail200_night', 'sail', 200, { colorScheme: 'dark' });
  await sl.screenshot({ path: `${process.env.SP}/look_sail200_night.png`, clip: { x: 0, y: 60, width: 700, height: 420 } }); await sl.close();
  // garaj simgeleri ve 149 → 150 yükseltmesi
  const g = await shot('garage', 'car', 149);
  console.log('Sv.149 satırı:', await g.$eval('[data-act="upgrade"][data-id="car"]', bt => bt.closest('.card').querySelector('.up small').textContent));
  await g.$eval('[data-act="upgrade"][data-id="car"]', e => e.scrollIntoView({ block: 'center' }));
  await g.click('[data-act="upgrade"][data-id="car"]'); await g.waitForTimeout(300);
  console.log('bildirim:', (await g.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-90));
  console.log('simge aşamaları:', await g.$$eval('#pane-garage canvas[data-icon]', l => l.map(c => c.dataset.icon + ':' + c.dataset.tier).join(' ')));
  await g.screenshot({ path: `${process.env.SP}/look_garage.png`, clip: { x: 700, y: 55, width: 400, height: 700 } }); await g.close();
  // telefon (320 px)
  await (await shot('phone_walk200', 'walk', 200, { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true })).close();
  // Fener Yolu: durak ödülü beş kat (9 rota açık, 8 yolculuk tamamlanmış)
  const r = await b.newPage({ locale: 'tr-TR', viewport: { width: 1000, height: 760 } });
  r.on('pageerror', e => errs.push('route: ' + e.message));
  await r.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, trips: 8, memories: 90, route: 'lighthouse', distance: 9.9 })); } });
  await r.goto('http://localhost:8765/index.html'); await r.waitForTimeout(800);
  // durak bildirimi diğer bildirimlerle kutudan itilmeden yakalanır; beklenen ödül: max(15, gelir × 15) × 5
  let ms = '';
  for (let i = 0; i < 80 && !ms; i++) { await r.mouse.click(300, 300); ms = ((await r.textContent('#toasts')).match(/Durak: [^·]*· \+[\d.,]+ kredi/) || [''])[0]; }
  console.log('Fener Yolu durak bildirimi:', ms || '(yok)');
  await r.click('.tab[data-id="buffs"]'); await r.waitForTimeout(200);
  console.log('rotalar:', await r.$$eval('.route-btn b', l => l.map(x => x.textContent).join(' | ')));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
