'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('./lib/pw');
const base = process.env.WORLD_TEST_URL || 'http://127.0.0.1:8787';

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  try {
    const suffix = String(Date.now()).slice(-6);
    const open = async (name, world, width) => {
      const page = await browser.newPage({ locale: 'en-US', viewport: { width, height: 820 } });
      page.on('pageerror', e => errors.push(e.message));
      await page.route('https://**/*', route => route.abort());
      await page.addInitScript(({ name, world }) => {
        window.IT = window.IT || {};
        let Scene;
        Object.defineProperty(window.IT, 'Scene', { configurable: true, get: () => Scene, set: Constructor => {
          Scene = class extends Constructor { constructor(...args) { super(...args); window.testScene = this; } };
        }});
        if (!sessionStorage.seed) {
          sessionStorage.seed = '1';
          const player = { id: crypto.randomUUID(), key: 'a'.repeat(64), name };
          localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 4, intro: true, seenVer: '99', lastSeen: Date.now(), player,
            clicks: 10, distance: 1000, owned: { walk: true, balloon: true }, active: 'walk', settings: { sfx: false, music: false },
            v2: { worldId: world, unlockedWorlds: ['earth', 'cloud'], onboardingSeen: true } }));
        }
      }, { name, world });
      await page.goto(base);
      await page.waitForFunction(() => IT.Online.myPub());
      return page;
    };
    const a = await open('Ada ' + suffix, 'cloud', 1280);
    const b = await open('Bora ' + suffix, 'earth', 320);
    const aPub = await a.evaluate(() => IT.Online.myPub());
    const bPub = await b.evaluate(() => IT.Online.myPub());
    const snapshot = await (await fetch(base + '/api/players')).json();
    assert.equal(snapshot.players.find(p => p.pub === aPub)?.world, 'cloud', 'V2 world is visible in global presence');
    assert.equal(snapshot.players.find(p => p.pub === bPub)?.world, 'earth');
    const legacy = await fetch(base + '/api/hello', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: require('node:crypto').randomUUID(), key: 'c'.repeat(64), name: 'Legacy ' + suffix, dist: 0, trip: 1 }) });
    assert.equal((await legacy.json()).me?.world, 'earth', 'an older client still appears on Earth');

    await a.evaluate(() => IT.Online.now());
    await a.waitForFunction(pub => IT.Online.data?.players.some(p => p.pub === pub), bPub);
    assert.ok(await a.evaluate(pub => !testScene.others.some(p => p.pub === pub), bPub));
    await a.locator('.tab[data-id="travelers"]').click();
    const row = a.locator('.tr-row').filter({ hasText: 'Bora ' + suffix });
    assert.match(await row.innerText(), /Earth/);
    await row.getByRole('button', { name: /wave/i }).click();
    await b.locator('#toasts').getByText(/Ada .*waved/i).waitFor({ timeout: 12000 });
    await a.screenshot({ path: process.env.SP + '/presence-travelers.png' });

    await b.locator('.tab[data-id="atlas"]').click();
    await b.locator('[data-v2="selectWorld"][data-key="cloud"]').click();
    await b.waitForFunction(() => IT.Online.data?.me?.world === 'cloud', undefined, { timeout: 12000 });
    await a.evaluate(() => IT.Online.now());
    await a.waitForFunction(pub => testScene.tags.some(tag => tag[2].pub === pub && tag[3] > 0.9), bPub);
    await b.locator('[data-act="sheetClose"]').click();
    await b.waitForFunction(pub => !document.documentElement.classList.contains('sheet-open') && !testScene.worldFade && testScene.ghosts.get(pub)?.alpha > 0.9, aPub);
    await b.waitForTimeout(350);
    await a.screenshot({ path: process.env.SP + '/presence-cloud-desktop.png' });
    await b.screenshot({ path: process.env.SP + '/presence-cloud-mobile.png' });
    const position = await b.evaluate(pub => {
      const point = testScene.ghostPos(testScene.ghosts.get(pub));
      const rect = testScene.canvas.getBoundingClientRect();
      return { x: rect.left + point.x * testScene.zoom, y: rect.top + (point.top + point.y) * 0.5 * testScene.zoom };
    }, aPub);
    await b.mouse.click(position.x, position.y);
    await a.locator('#toasts').getByText(/Bora .*waved at you/i).waitFor({ timeout: 12000 });
    assert.deepEqual(errors, []);
    console.log('PASS world presence: distinct maps, cross-world wave, live world switch and shared V2 canvas');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
