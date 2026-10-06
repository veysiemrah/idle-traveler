const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const all = { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, moto: 1, car: 1, van: 1, train: 1, balloon: 1, plane: 1, jet: 1, rocket: 1, sail: 1 };
  const cases = [['dog', 1, 'walk'], ['dog', 10, 'bike'], ['cat', 7, 'walk'], ['cat', 10, 'car'], ['dog', 4, 'van'], ['dog', 7, 'train'], ['bird', 3, 'walk'], ['bird', 10, 'plane'], ['bird', 7, 'rocket'], ['cat', 5, 'balloon']];
  const shots = [];
  for (const [pick, lvl, veh] of cases) {
    const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); });
    await p.addInitScript(([pick, lvl, veh, all]) => localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50, owned: all, active: veh, palPick: pick, buffs: { pal: lvl } })), [pick, lvl, veh, all]);
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2600);
    const pos = await p.evaluate(() => ({ x: __sc.travelerX, y: __sc.riderY() }));
    const file = `${process.env.SP}/pal_${pick}${lvl}_${veh}.png`;
    await p.screenshot({ path: file, clip: { x: Math.max(0, pos.x - 190), y: Math.max(55, pos.y + 55 - 200), width: 330, height: 220 } });
    shots.push(file);
    await p.close();
  }
  // Güçlendirme kartı
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50, credits: 1e7, buffs: { pal: 3 } })));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.click('.tab[data-id="buffs"]'); await p.waitForTimeout(200);
  await p.$eval('.pals', e => e.scrollIntoView({ block: 'center' }));
  const card = await p.$eval('.pals', e => e.closest('.card').innerText.replace(/\s+/g, ' '));
  console.log('kart:', card);
  await p.click('[data-act="palPick"][data-id="bird"]'); await p.waitForTimeout(200);
  console.log('seçili:', await p.$eval('.pal-btn.on', e => e.dataset.id));
  await p.click('[data-act="buff"][data-id="pal"]'); await p.waitForTimeout(200);
  await p.click('[data-act="buff"][data-id="pal"]'); await p.waitForTimeout(300);
  console.log('bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim());
  await p.$eval('.pals', e => e.scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: process.env.SP + '/pal_card.png', clip: { x: 890, y: 55, width: 390, height: 805 } });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
