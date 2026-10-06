const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  // v2 kayıt: eski rozetler (ay, garage9, reg13, rhythm…), eve dönüş yapılmış
  const v2 = { v: 2, intro: true, lastSeen: Date.now(), seenVer: '9', credits: 5e5, clicks: 1200, gifts: 7, crits: 12, rainbows: 2, nightTime: 900, photos: 2, wishes: 1, trips: 1, memories: 15,
    distance: 2e4, lifeDist: 4e7, regionIdx: 3, owned: { walk: 1, skates: 1, board: 1 }, levels: { walk: 12 }, day: { last: '2026-10-04', streak: 2, best: 3 },
    badges: { steps100: 1, steps1k: 1, rhythm: 1, lucky: 1, fly1: 1, rainbow: 1, night: 1, reg5: 1, reg13: 1, marathon: 1, world: 1, moon: 1, garage3: 1, garage6: 1, garage9: 1, tuned25: 1, home1: 1, photo1: 1, mem100: 0, wish1: 1 },
    settings: { outfit: 'lavender' } };
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } }, v2);
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(600);
  console.log('açılış bildirimleri:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(0, 120) || '-');
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
  console.log('başlık:', (await p.textContent('.sec:has(+ .badges)')).replace(/\s+/g, ' ').trim());
  const cards = await p.$$eval('.badge', bs => bs.map(b => `${b.querySelector('b').textContent}${b.querySelector('em') ? '[' + b.querySelector('em').textContent + ']' : ''} ${b.querySelectorAll('.pips i.on').length}/8 · ${b.querySelector('small').textContent}`));
  console.log(cards.join('\n'));
  await p.$eval('.badges', e => e.scrollIntoView());
  await p.screenshot({ path: process.env.SP + '/tiers_journal.png' });
  // canlı kademe atlama: 50 adım daha → steps 3. kademe 1000 zaten; 5000 değil. kelebek 5 → 7 var (2. kademe). Bir kelebek eşiği: 15
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('idle-traveler-save-v1')); });
  const sv = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  console.log('kayıt v:', sv.v, '| rozetler:', JSON.stringify(sv.badges), '| rekorlar:', sv.bestRegion, sv.bestGarage, sv.bestLevel, sv.bestCombo, sv.legacyDist);
  await p.close();
  // yeni oyuncu: 50. adımda plastik rozet bildirimi
  const q = await b.newPage({ locale: 'es-ES', viewport: { width: 1280, height: 900 } });
  q.on('pageerror', e => errs.push(e.message));
  await q.addInitScript(() => localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), clicks: 49, seenVer: '9' })));
  await q.goto('http://localhost:8765/index.html'); await q.waitForTimeout(400);
  await q.mouse.click(400, 400); await q.waitForTimeout(300);
  console.log('es bildirim:', (await q.textContent('#toasts')).replace(/\s+/g, ' ').trim());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
