const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [locale, w, h, scheme] of [['tr-TR', 1280, 860, 'light'], ['tr-TR', 390, 844, 'dark'], ['de-DE', 320, 700, 'light'], ['en-US', 1024, 700, 'dark']]) {
    const p = await b.newPage({ locale, viewport: { width: w, height: h }, colorScheme: scheme });
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|net::|501 \(Unsupported/.test(m.text())) errs.push(m.text()); });
    await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ intro: true, lastSeen: Date.now(), credits: 3e4, clicks: 50, distance: 9000, regionIdx: 3, owned: { walk: 1, skates: 1, board: 1 }, active: 'board', seenVer: '1.7' })); } });
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(700);
    const tb = await p.$eval('.topbar', e => { const r = e.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)} sw${e.scrollWidth}`; });
    console.log(`${locale} ${w} ${scheme} | topbar ${tb} | nokta: ${await p.isVisible('.ver-dot')} | sürüm: ${await p.textContent('#verNum')} | bildirim: ${(await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(0, 90)}`);
    await p.screenshot({ path: `${process.env.SP}/header_${w}_${scheme}.png` });
    // düğmeler çalışıyor mu
    const night0 = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await p.click('#btnSky'); await p.waitForTimeout(200);
    const night1 = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await p.click('#btnSound'); const snd = await p.getAttribute('#btnSound', 'aria-pressed');
    await p.click('#btnNews'); await p.waitForTimeout(300);
    const news = (await p.$$eval('.news > li', ls => ls.map(l => l.querySelector('h3').textContent.replace(/\s+/g, ' ').trim()))).slice(0, 4).join(' | ');
    console.log(`   tema ${night0}→${night1} | ses ${snd} | yenilikler: ${news} | nokta sonra: ${await p.isVisible('.ver-dot')}`);
    await p.screenshot({ path: `${process.env.SP}/news_${w}_${scheme}.png` });
    await p.click('#modalBtn'); await p.waitForTimeout(200);
    await p.click('#btnPhoto'); await p.waitForTimeout(400);
    console.log('   kartpostal penceresi:', await p.isVisible('.postcard'));
    await p.click('#modalBtn');
    await p.waitForTimeout(5300); await p.reload(); await p.waitForTimeout(500);
    console.log('   yeniden yükleme: nokta', await p.isVisible('.ver-dot'), '| kayıt seenVer', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).seenVer));
    await p.close();
  }
  // yeni oyuncu: tanıtım, nokta yok
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.click('#modalBtn'); await p.waitForTimeout(200);
  console.log('yeni oyuncu: nokta', await p.isVisible('.ver-dot'), '| bildirim:', (await p.textContent('#toasts')).trim() || '-');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
