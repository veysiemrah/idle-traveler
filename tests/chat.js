// Hazır mesajlar uçtan uca: B gönderir, A sahnesinde balon görür
const { chromium } = require('./lib/pw');
const BASE = 'http://127.0.0.1:8787';
(async () => {
  const b = await chromium.launch(); const errs = [];
  const base = 5e6 + Math.random() * 1e6;
  const open = async (name, dist, opts, veh) => {
    const ctx = await b.newContext(Object.assign({ locale: 'tr-TR', viewport: { width: 1280, height: 760 } }, opts));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.addInitScript(([name, dist, veh]) => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: dist, regionIdx: 6,
      owned: { walk: 1, skates: 1, board: 1, bike: 1 }, levels: { bike: 5 }, active: veh || 'bike', buffs: { pal: 3 }, palPick: 'bird',
      player: { id: crypto.randomUUID(), key: Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join(''), name } })); }, [name, dist, veh]);
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(1500);
    return p;
  };
  const A = await open('Ayşe', base);
  const B = await open('Bora', base + 60, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, 'walk');
  await A.evaluate(() => IT.Online.now()); await B.evaluate(() => IT.Online.now()); await A.waitForTimeout(1500);
  // B mesaj seçiciyi açar
  await B.tap('#btnChat'); await B.waitForTimeout(400);
  await B.screenshot({ path: process.env.SP + '/chat_pop390.png' });
  console.log('seçici açık:', await B.isVisible('#chatPop'), '| mesaj sayısı:', await B.locator('#chatPop .msg').count());
  await B.tap('#chatPop [data-msg="hi"]'); await B.waitForTimeout(500);
  console.log('seçici kapandı:', await B.isHidden('#chatPop'), '| bekleme:', await B.evaluate(() => document.querySelector('#btnChat').classList.contains('cool')));
  await B.screenshot({ path: process.env.SP + '/chat_mine390.png' });
  // hemen ikinci mesaj: bekleme
  await B.tap('#btnChat'); await B.tap('#chatPop [data-msg="race"]'); await B.waitForTimeout(300);
  // A en geç 6 sn içinde görür
  let seen = false;
  for (let i = 0; i < 16 && !seen; i++) { await A.waitForTimeout(500); seen = await A.evaluate(() => [...document.querySelectorAll('#pane-travelers .tr-say')].some(x => /Merhaba/.test(x.textContent)) || false); if (!seen) await A.evaluate(() => 0); }
  await A.click('.tab[data-id="travelers"]'); await A.waitForTimeout(300);
  console.log('A listesinde mesaj:', await A.$$eval('.tr-say', x => x.map(e => e.textContent)));
  await A.screenshot({ path: process.env.SP + '/chat_seen1280.png' });
  // dar ekranda seçici
  const N = await open('Nil', base - 50, { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }, 'walk');
  await N.tap('#btnChat'); await N.waitForTimeout(400); await N.screenshot({ path: process.env.SP + '/chat_pop320.png' });
  // sahneye dokununca kapanır, adım atılmaz
  const d0 = await N.evaluate(() => IT && JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks);
  await N.tap('#scene', { position: { x: 8, y: 250 } }); await N.waitForTimeout(200);
  console.log('dokununca kapandı:', await N.isHidden('#chatPop'));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
