// Yenilikler penceresi (v1.62): en yeni üç sürüm açık, öncekiler "Önceki sürümler (n)" altında katlı ve içlerindeki yeni
// sürüm sayısı yazar; uzun pencerede düğme hep görünür (yapışık). Telefon (320 px, Almanca) ve masaüstü.
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [name, vp, loc, seen] of [['p320', { width: 320, height: 640 }, 'de-DE', '1.55'], ['d1280', { width: 1280, height: 800 }, 'tr-TR', '1.20']]) {
    const p = await b.newPage({ locale: loc, viewport: vp, isMobile: vp.width < 500, hasTouch: vp.width < 500 });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } }, { v: 3, intro: true, lastSeen: Date.now(), seenVer: seen, clicks: 50, distance: 900, regionIdx: 3, msIdx: 99 });
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500); await p.click('#btnNews'); await p.waitForTimeout(600);
    const info = await p.evaluate(() => { const m = document.querySelector('#modal'); const body = document.querySelector('#modalBody'); return { open: !m.hidden, title: (document.querySelector('#modalTitle') || {}).textContent, items: body ? body.querySelectorAll('ol.news > li').length : 0, fresh: body ? body.querySelectorAll('ol.news > li.fresh').length : 0, old: ((body.querySelector('.news-old summary') || {}).textContent || '').replace(/\s+/g, ' ').trim(), oldN: body.querySelectorAll('.news-old ol.news > li').length, h: body.scrollHeight, btn: (() => { const r = document.querySelector('#modalBtn').getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; })() }; });
    console.log(name, 'açık sürüm:', info.items - (info.oldN || 0), '· katlı satır:', info.old, '· yükseklik:', info.h, '· düğme görünür mü:', info.btn);
    await p.screenshot({ path: `${process.env.SP}/news_${name}.png` });
    await p.click('.news-old summary'); await p.waitForTimeout(500); await p.$eval('.modal-card', e => e.scrollTop = 2400); await p.waitForTimeout(200);
    await p.screenshot({ path: `${process.env.SP}/news_${name}_old.png` });
    console.log(name, 'açılınca düğme hâlâ görünür mü:', await p.evaluate(() => { const r = document.querySelector('#modalBtn').getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; }), '· eski sürümler açıldı mı:', await p.$eval('.news-old', e => e.open));
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
