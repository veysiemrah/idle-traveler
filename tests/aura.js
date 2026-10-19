// Sv. 250, 300, 400 ve 500 görünümleri (v1.52, Sv. 400 v1.61, Sv. 250 v1.65: altın kelebekler): yıldız yörüngesi, ters dönen ikinci yörünge ve ışık huzmeleri; yerde,
// trende ve uçan araçta, gündüz ve gece; garaj simgeleri; Sv. 299 → 300 ve 399 → 400 yükseltmelerinde "yeni görünüm" bildirimi
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const today = new Date().toLocaleDateString('sv-SE');
  const open = async (save, opts) => {
    const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } }, opts || {}));
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } },
      Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, msIdx: 99, harvestDay: today, credits: 1e40, distance: 900, regionIdx: 3, settings: { bulk: 1 } }, save));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
    return p;
  };
  // 1) sahnede: bisiklet, tren, uçak ve Anka; Sv. 300 ve 500
  for (const [veh, lvl, dark] of [['bike', 250, false], ['walk', 250, true], ['plane', 250, false], ['train', 250, true], ['bike', 300, false], ['bike', 400, true], ['bike', 500, true], ['train', 400, false], ['train', 300, true], ['plane', 400, true], ['plane', 500, false], ['anka', 500, true], ['walk', 300, false], ['walk', 400, false]]) {
    const owned = { walk: 1, [veh]: 1 };
    const p = await open({ owned, levels: { [veh]: lvl }, active: veh, distance: veh === 'anka' ? 5e15 : 900, regionIdx: veh === 'anka' ? 27 : 3, msIdx: 99, best: 1e30, settings: { sky: dark ? 'night' : 'day', bulk: 1 } }, dark ? { colorScheme: 'dark' } : {});
    await p.waitForTimeout(2400);
    await p.screenshot({ path: `${process.env.SP}/aura_${veh}${lvl}${dark ? '_night' : ''}.png`, clip: { x: 0, y: 55, width: 700, height: 600 } });
    await p.close();
  }
  // 2) yükseltme: Sv. 299 → 300 ve 399 → 400 bildirimi; garaj simgeleri (Sv. 300, 400, 500)
  const p = await open({ owned: { walk: 1, skates: 1, board: 1, bike: 1 }, levels: { walk: 299, skates: 249, board: 500, bike: 399 }, active: 'walk' });
  const line = () => p.$eval('[data-act="upgrade"][data-id="walk"]', e => e.closest('.up').innerText.replace(/\s+/g, ' '));
  console.log('Sv. 299:', await line());
  await p.click('[data-act="upgrade"][data-id="walk"]'); await p.waitForTimeout(400);
  console.log('Sv. 300:', await line(), '|', (await p.textContent('#toasts')).replace(/\s+/g, ' ').slice(-90));
  const line25 = () => p.$eval('[data-act="upgrade"][data-id="skates"]', e => e.closest('.up').innerText.replace(/\s+/g, ' '));
  console.log('Sv. 249:', await line25());
  await p.$eval('[data-act="upgrade"][data-id="skates"]', e => e.scrollIntoView({ block: 'center' }));
  await p.click('[data-act="upgrade"][data-id="skates"]'); await p.waitForTimeout(400);
  console.log('Sv. 250:', await line25(), '|', (await p.textContent('#toasts')).replace(/\s+/g, ' ').slice(-90));
  const line4 = () => p.$eval('[data-act="upgrade"][data-id="bike"]', e => e.closest('.up').innerText.replace(/\s+/g, ' '));
  console.log('Sv. 399:', await line4());
  await p.$eval('[data-act="upgrade"][data-id="bike"]', e => e.scrollIntoView({ block: 'center' }));
  await p.click('[data-act="upgrade"][data-id="bike"]'); await p.waitForTimeout(400);
  console.log('Sv. 400:', await line4(), '|', (await p.textContent('#toasts')).replace(/\s+/g, ' ').slice(-90));
  console.log('garaj simge kademeleri:', await p.$$eval('canvas.icon[data-icon]', l => l.map(e => e.dataset.icon + ':' + e.dataset.tier).join(' ')));
  await p.$eval('canvas.icon[data-icon="walk"]', e => e.scrollIntoView({ block: 'start' })); await p.waitForTimeout(200);
  await p.screenshot({ path: `${process.env.SP}/aura_garage.png`, clip: { x: 700, y: 55, width: 400, height: 705 } });
  await p.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
