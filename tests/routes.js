const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50, distance: 1.2e8, regionIdx: 11, msIdx: 18, owned: { walk: 1, skates: 1 } })); } });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(600);
  await p.click('.tab[data-id="buffs"]'); await p.waitForTimeout(200);
  console.log('kart (yolculuk 1):', (await p.$eval('.card.home', e => e.innerText.replace(/\s+/g, ' '))).slice(0, 260));
  await p.$eval('.home-btn', e => e.scrollIntoView({ block: 'center' }));
  await p.click('.home-btn'); await p.click('.home-btn'); await p.waitForTimeout(500);
  console.log('pencere:', (await p.textContent('#modalBody')).replace(/\s+/g, ' ').trim().slice(0, 400));
  await p.screenshot({ path: process.env.SP + '/route_modal.png' });
  console.log('rota düğmeleri:', await p.$$eval('#modalBody .route-btn', bs => bs.map(b => `${b.querySelector('b').textContent}${b.classList.contains('on') ? '*' : ''}${b.disabled ? '(kapalı)' : ''}`).join(' | ')));
  await p.click('#modalBody [data-act="route"][data-id="anatolia"]'); await p.waitForTimeout(200);
  console.log('anatolia seçildi →', await p.$$eval('#modalBody .route-btn.on b', bs => bs.map(b => b.textContent).join()));
  await p.click('#modalBody [data-act="route"][data-id="coast"]'); await p.waitForTimeout(200);
  await p.click('#modalBtn'); await p.waitForTimeout(300);
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
  console.log('pasaport:', (await p.$eval('.sec:has(+ .stamps)', e => e.textContent)).replace(/\s+/g, ' '), '| sonraki bölge tabelası:', await p.evaluate(() => IT.regionAt(1).name + ', ' + IT.regionAt(2).name));
  // köyden çık → seçim kilitlenir
  for (let i = 0; i < 400; i++) await p.mouse.click(400, 400, { delay: 0 });
  await p.waitForTimeout(300);
  await p.click('.tab[data-id="buffs"]'); await p.waitForTimeout(200);
  console.log('bölge:', await p.textContent('#hudRegion'), '| kartta seçim var mı:', !!(await p.$('.card.home .routes')));
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('idle-traveler-save-v1')); });
  await p.waitForTimeout(5200); await p.reload(); await p.waitForTimeout(500);
  console.log('yeniden yükle → rota:', await p.evaluate(() => IT.getRoute().id), '| bölge:', await p.textContent('#hudRegion'));
  await p.close();
  // bozuk kayıt: açılmamış rota
  const q = await b.newPage({ locale: 'en-US', viewport: { width: 1280, height: 900 } });
  q.on('pageerror', e => errs.push(e.message));
  await q.addInitScript(() => localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', route: 'silk', trips: 0 })));
  await q.goto('http://localhost:8765/index.html'); await q.waitForTimeout(400);
  console.log('bozuk rota → ', await q.evaluate(() => IT.getRoute().id));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
