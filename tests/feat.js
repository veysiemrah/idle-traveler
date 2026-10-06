const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ locale: 'tr-TR', viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { if (!localStorage.getItem('seeded')) { localStorage.setItem('seeded', 1);
    localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ intro: true, lastSeen: Date.now(), distance: 1.5e9, credits: 1e6, clicks: 300, regionIdx: 11, msIdx: 15,
      owned: { walk: true, skates: true, board: true, bike: true }, active: 'walk' })); } });
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../public/index.html')).href); await p.waitForTimeout(800);
  // Karabaş
  await p.click('.tab[data-id="buffs"]');
  const card = p.locator('#pane-buffs .card', { hasText: 'Yol Arkadaşı' });
  console.log('kart:', (await card.textContent()).replace(/\s+/g, ' ').trim());
  const credBefore = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).credits);
  await card.locator('[data-act="buff"]').click(); await p.waitForTimeout(500);
  console.log('bildirim:', (await p.textContent('#toasts')).trim().slice(0, 80));
  console.log('kart sonra:', (await card.textContent()).replace(/\s+/g, ' ').trim().slice(0, 90));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${process.env.SP}/dog_walk.png`, clip: { x: 220, y: 560, width: 320, height: 180 } });
  await p.click('.tab[data-id="garage"]'); await p.click('[data-act="ride"][data-id="bike"]'); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${process.env.SP}/dog_bike.png`, clip: { x: 160, y: 540, width: 360, height: 200 } });
  // Kartpostal
  await p.click('#btnPhoto'); await p.waitForTimeout(800);
  console.log('kartpostal penceresi:', await p.isVisible('#modal'), '| görsel:', await p.$eval('.postcard', i => i.naturalWidth + 'x' + i.naturalHeight), '| paylaş düğmesi:', !!(await p.$('#pcShare')));
  await p.screenshot({ path: `${process.env.SP}/postcard_modal.png` });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.pc-btn[download]')]);
  await dl.saveAs(`${process.env.SP}/postcard.png`);
  console.log('indirilen dosya:', dl.suggestedFilename());
  await p.click('#modalBtn'); await p.waitForTimeout(400);
  console.log('rozet bildirimi:', (await p.textContent('#toasts')).includes('Kartpostalcı'));
  // Eve dönüş: Karabaş kalmalı
  await p.click('.tab[data-id="buffs"]');
  const hb = p.locator('[data-act="home"]'); await hb.click(); await hb.click(); await p.waitForTimeout(500);
  if (await p.isVisible('#modal')) await p.click('#modalBtn');
  const s = JSON.parse(await p.evaluate(() => localStorage.getItem('idle-traveler-save-v1')));
  console.log('eve dönüş sonrası: pal =', s.buffs.pal, '| tur', s.trips, '| foto', s.photos, '| araç', s.active);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${process.env.SP}/dog_after_home.png`, clip: { x: 220, y: 560, width: 320, height: 180 } });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
