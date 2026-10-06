// Beş kişi aynı anda trende: sahne kalabalıklaşmamalı
const { chromium } = require('./lib/pw');
const BASE = 'http://127.0.0.1:8787', crypto = require('crypto');
const hello = b => fetch(BASE + '/api/hello', { method: 'POST', body: JSON.stringify(Object.assign({ id: crypto.randomUUID(), key: crypto.randomBytes(32).toString('hex'), trip: 3, route: 'anatolia', tier: 0, outfit: 'classic', pal: '' }, b)) }).then(r => r.json());
(async () => {
  const base = 3e7 + Math.random() * 1e6; // her çalıştırmada eski sahte gezginlerden uzak bir mesafe
  for (const f of [{ name: 'Tren Bir', dist: base + 4000, tier: 2 }, { name: 'Tren İki', dist: base + 9000, tier: 3 }, { name: 'Tren Üç', dist: base - 3000, tier: 4 }, { name: 'Tren Dört', dist: base - 8000 }])
    await hello(Object.assign({ veh: 'train' }, f));
  const b = await chromium.launch(); const errs = [];
  const shot = async (name, opts, veh) => {
    const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1280, height: 760 } }, opts));
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([veh, base]) => { localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: base, regionIdx: 8,
      owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, moto: 1, car: 1, van: 1, train: 1 }, levels: { train: 30 }, active: veh,
      player: { id: '44444444-2222-4333-8444-' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0'), key: '7'.repeat(64), name: 'Ben' } })); }, [veh, base]);
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(4500);
    await p.screenshot({ path: `${process.env.SP}/trains_${name}.png` });
    await p.close();
  };
  await shot('desk', {}, 'train');
  await shot('mob', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, 'train');
  await shot('desk_walk', {}, 'walk');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
