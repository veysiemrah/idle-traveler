// Kartpostal Albümü: çekilen kartpostal albüme eklenir (en yenisi başta, en çok 12), Yol Defteri'nde küçük kartpostallar
// (açık/koyu tema, 320 px telefon), dokununca büyük açılır, yolculuğu sıfırlamak albümü siler, bozuk albüm yok sayılır
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const today = new Date().toLocaleDateString('sv-SE');
  const open = async (save, vp, opts, album) => {
    const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: vp || { width: 1280, height: 860 } }, opts || {}));
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([s, a]) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); if (a !== null) localStorage.setItem('idle-traveler-album', a); } },
      [Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, msIdx: 99, harvestDay: today, distance: 800, regionIdx: 3, settings: { sky: 'day', zoom: 1 } }, save), album === undefined ? null : album]);
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1300);
    return p;
  };
  const album = p => p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-album') || '[]'));
  const shoot = async p => { await p.click('#btnPhoto'); await p.waitForTimeout(500); const saved = await p.$$eval('.pc-saved', l => l.map(e => e.textContent).join()); await p.click('#modalBtn'); await p.waitForTimeout(250); return saved; };

  // 1) İlk kartpostal albüme girer; defterde görünür; 14 çekimde en çok 12 kalır, en yenisi başta
  const p = await open({});
  console.log('ilk çekim penceresi:', await shoot(p), '· albüm:', (await album(p)).length);
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
  console.log('defter bölümü:', (await p.$eval('.album', e => e.closest('.tabpane').innerText.match(/Kartpostal Albümü[^\n]*/)[0])).trim(), '· kart:', await p.$$eval('.album-pc', l => l.length));
  for (let i = 0; i < 13; i++) await shoot(p);
  const a = await album(p);
  console.log('14 çekimden sonra:', a.length, '· en yenisi başta mı:', a[0].at >= a[1].at, '· boyut (kB):', Math.round(JSON.stringify(a).length / 1024));
  await p.$eval('.album', e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(200);
  await p.screenshot({ path: `${process.env.SP}/album_journal.png`, clip: { x: 890, y: 55, width: 390, height: 805 } });
  await p.click('.album-pc[data-id="2"]'); await p.waitForTimeout(400);
  console.log('büyük açıldı:', (await p.textContent('#modalBody')).replace(/\s+/g, ' ').slice(0, 90));
  await p.screenshot({ path: `${process.env.SP}/album_view.png` });
  await p.click('#modalBtn'); await p.waitForTimeout(200);
  // 2) sıfırlama albümü siler
  await p.click('#btnSettings'); await p.waitForTimeout(300);
  p.once('dialog', d => d.accept());
  await p.click('#modalBody [data-act="reset"]'); await p.waitForTimeout(400);
  const confirm = await p.$('#modalBody [data-act="reset"]');
  if (confirm) { await confirm.click(); await p.waitForTimeout(400); }
  console.log('sıfırlamadan sonra albüm:', (await album(p)).length);
  await p.close();

  // 3) bozuk albüm yok sayılır; koyu tema ve telefonda görünüm
  const bad = await open({}, null, null, '{"x":1');
  await bad.click('.tab[data-id="journal"]'); await bad.waitForTimeout(300);
  console.log('bozuk albüm: bölüm var mı:', !!(await bad.$('.album')));
  await bad.close();
  for (const [name, vp, dark] of [['dark', null, true], ['phone', { width: 320, height: 640 }, false]]) {
    const q = await open({ settings: { sky: dark ? 'night' : 'day', zoom: 1 } }, vp, { colorScheme: dark ? 'dark' : 'light', isMobile: !!vp, hasTouch: !!vp });
    for (let i = 0; i < 4; i++) await shoot(q);
    await q.click('.tab[data-id="journal"]'); await q.waitForTimeout(300);
    await q.$eval('.album', e => e.scrollIntoView({ block: 'center' })); await q.waitForTimeout(200);
    await q.screenshot({ path: `${process.env.SP}/album_${name}.png`, clip: vp ? undefined : { x: 890, y: 55, width: 390, height: 805 } });
    console.log(name, 'taşan:', await q.$$eval('.album-pc small', l => l.filter(e => e.scrollWidth > e.clientWidth + 1).length));
    await q.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
