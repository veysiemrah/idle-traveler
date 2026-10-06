// Yolcular görsel denetimi: gece/koyu tema, uzun adlar, sıkışık etiketler, telefon
const { chromium } = require('./lib/pw');
const BASE = 'http://127.0.0.1:8787', crypto = require('crypto');
const hello = b => fetch(BASE + '/api/hello', { method: 'POST', body: JSON.stringify(Object.assign({ id: crypto.randomUUID(), key: crypto.randomBytes(32).toString('hex'), trip: 1, route: 'anatolia', tier: 0, outfit: 'classic', pal: '' }, b)) }).then(r => r.json());
(async () => {
  for (const f of [
    { name: 'Uzun İsimli Gezgin Ali', dist: 1020, veh: 'walk' }, { name: 'Maximilian Lindqvist', dist: 1450, veh: 'skates', outfit: 'lavender', pal: 'bird' },
    { name: 'Zeynep', dist: 1700, veh: 'board', tier: 1 }, { name: 'Jo', dist: 700, veh: 'walk', pal: 'dog' }, { name: 'Ömer Faruk Çelik', dist: 400, veh: 'walk', outfit: 'gold', tier: 4 },
  ]) await hello(f);
  const b = await chromium.launch(); const errs = [];
  const shot = async (name, opts, sky, extra) => {
    const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1280, height: 760 } }, opts));
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([sky, ex]) => { localStorage.setItem('idle-traveler-save-v1', JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 1000, credits: 50,
      owned: { walk: 1, skates: 1 }, levels: { walk: 6 }, active: 'walk', settings: { sky },
      player: { id: '22222222-2222-4333-8444-' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0'), key: '9'.repeat(64), name: 'Ben' } }, ex))); }, [sky, extra || {}]);
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(4000);
    await p.screenshot({ path: `${process.env.SP}/audit_${name}.png` });
    return p;
  };
  await shot('night', { colorScheme: 'dark' }, 'night');
  await shot('day1000', { viewport: { width: 1000, height: 700 } }, 'day');
  const m = await shot('mob_dark', { viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true }, 'night');
  await m.click('.tab[data-id="travelers"]'); await m.waitForTimeout(300);
  await m.evaluate(() => document.querySelector('#pane-travelers').scrollIntoView());
  await m.screenshot({ path: `${process.env.SP}/audit_tab_dark.png`, fullPage: false });
  const n = await shot('name_dark', { viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true }, 'night', { player: { id: '33333333-2222-4333-8444-000000000001', key: '8'.repeat(64), name: '' } });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
