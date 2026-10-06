const { chromium } = require('./lib/pw');
// Ekranda çevrilmemiş anahtar kalmış mı? (ör. "ui.buy", "veh.walk.name")
const KEY_RE = /\b(?:ui|veh|buff|gift|region|ms|badge|html|tab|garage|toast|float|off|home|homecard|intro|j|sky|units|unit|meta)\.[A-Za-z0-9]+(?:\.[A-Za-z]+)?\b/g;
(async () => {
  const b = await chromium.launch(); const errs = [];
  const cases = [['tr-TR', 'loc_tr'], ['en-GB', 'loc_en'], ['en-US', 'loc_us']].concat((process.argv[2] || '').split(',').filter(Boolean).map(l => [l, 'loc_' + l]));
  for (const [locale, name] of cases) {
    const p = await b.newPage({ locale, viewport: { width: 1280, height: 860 } });
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/CERT|net::ERR_FILE_NOT_FOUND|net::ERR_CERT/.test(m.text())) errs.push(name + ': ' + m.text()); });
    await p.addInitScript(() => { if (!localStorage.getItem('seeded')) { localStorage.setItem('seeded', 1);
      localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ intro: true, lastSeen: Date.now() - 2 * 3600e3, distance: 5.2e5, credits: 3.2e6, clicks: 250, regionIdx: 6, msIdx: 6,
        owned: { walk: true, skates: true, board: true, bike: true }, levels: { bike: 4 }, active: 'bike', buffs: { stride: 2, luck: 3, camp: 1 }, badges: { steps100: 1, garage3: 1 } })); } });
    await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../public/index.html')).href); await p.waitForTimeout(900);
    const modal = (await p.textContent('#modalBody')).replace(/\s+/g, ' ').trim();
    await p.screenshot({ path: `${process.env.SP}/${name}_modal.png` });
    await p.click('#modalBtn'); await p.waitForTimeout(300);
    let all = '';
    for (const tab of ['garage', 'buffs', 'journal']) { await p.click(`.tab[data-id="${tab}"]`); await p.waitForTimeout(250); all += await p.textContent('#panel'); }
    all += await p.textContent('#stage') + modal;
    await p.screenshot({ path: `${process.env.SP}/${name}.png` });
    const leaks = [...new Set(all.match(KEY_RE) || [])];
    console.log(`${name.padEnd(9)} | html lang=${await p.getAttribute('html', 'lang')} | hız: ${await p.textContent('#hudSpeed')} | yol: ${await p.textContent('#hudDist')} | bölge: ${await p.textContent('#hudRegion')} | sekmeler: ${(await p.$$eval('.tab', ts => ts.map(t => t.textContent))).join(' / ')} | kredi: ${await p.textContent('#credits')}`);
    console.log(`          pencere: ${modal.slice(0, 150)}`);
    console.log(`          çevrilmemiş anahtar: ${leaks.length ? leaks.join(', ') : 'yok'}`);
    await p.close();
  }
  // Oyun içinden dil değiştirme
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  p.on('pageerror', e => errs.push('switch: ' + e.message));
  await p.addInitScript(() => { if (!localStorage.getItem('seed2')) { localStorage.setItem('seed2', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ intro: true, lastSeen: Date.now(), credits: 100, clicks: 50 })); } });
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../public/index.html')).href); await p.waitForTimeout(500);
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
  await p.click('#btnSettings'); await p.waitForTimeout(200);
  await p.selectOption('#setLang', 'en'); await p.waitForTimeout(400);
  await p.click('#modalBtn'); await p.waitForTimeout(200);
  console.log('oyun içinde en seçildi →', (await p.$$eval('.tab', ts => ts.map(t => t.textContent))).join(' / '), '|', await p.textContent('#hudRegion'), '|', await p.textContent('.hint span'), '|', (await p.textContent('#toasts')).trim());
  await p.click('#btnSettings'); await p.waitForTimeout(200); await p.click('[data-act="units"][data-id="imperial"]'); await p.waitForTimeout(300); await p.click('#modalBtn'); await p.waitForTimeout(200);
  console.log('mil seçildi →', await p.textContent('#hudSpeed'), '|', await p.textContent('#hudDist'));
  await p.reload(); await p.waitForTimeout(500);
  console.log('yeniden yükle →', await p.textContent('.tab[data-id="garage"]'), '|', await p.textContent('#hudSpeed'));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
