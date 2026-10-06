const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__itScene = s; s.__speed = 1; return s; }; }); });
  await p.addInitScript(() => { if (!localStorage.getItem('seed')) { localStorage.setItem('seed', 1);
    localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ intro: true, lastSeen: Date.now(), credits: 5000, clicks: 50, settings: { sky: 'night' }, photos: 2 })); } });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2500);
  // sahneyi yakalayıp yıldızı doğrudan çağır: test kancası yok, canvas üzerinden bul
  const box = await p.$eval('#scene', c => { const r = c.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  // yıldızın doğmasını bekle (gece, modal kapalı) — zamanlayıcı 20–45 sn; hızlandırmak için birkaç kez dene
  let pos = null;
  for (let i = 0; i < 70 && !pos; i++) {
    await p.waitForTimeout(1000);
    pos = await p.evaluate(() => window.__star ? null : null);
    // görünür yıldızı ekran görüntüsünden değil, sahne nesnesinden oku
    pos = await p.evaluate(() => { const s = window.__itScene && window.__itScene.star; return s ? { x: s.x, y: s.y } : null; });
  }
  console.log('yıldız doğdu:', !!pos, pos && JSON.stringify(pos));
  if (pos) {
    await p.screenshot({ path: process.env.SP + '/star.png' });
    const now = await p.evaluate(() => { const s = window.__itScene.star; return { x: s.x, y: s.y }; });
    await p.mouse.click(box.x + now.x, box.y + now.y);
    await p.waitForTimeout(400);
    console.log('bildirim:', (await p.textContent('#toasts')).trim().slice(0, 200));
    console.log('etkiler:', (await p.textContent('#effects')).trim());
    await p.screenshot({ path: process.env.SP + '/star_caught.png' });
  }
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
  console.log('defter dilek:', await p.textContent('#jWishes'), '| kartpostal:', await p.textContent('#jPhotos'));
  console.log('rozet:', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).badges));
  // Boşluk tuşu dil kutusunda adım atmamalı
  const c0 = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks);
  await p.click('#btnSettings'); await p.waitForTimeout(200);
  await p.focus('#setLang'); await p.keyboard.press('Space'); await p.keyboard.press('Escape'); await p.waitForTimeout(5600);
  const c1 = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).clicks);
  console.log('boşluk (select odaklı) adım attı mı:', c1 !== c0, c0, c1);
  // kartpostal penceresi açıkken dil değişirse pencere yeni dile geçmeli
  await p.click('#modalBtn'); await p.waitForTimeout(200);
  await p.click('#btnPhoto'); await p.waitForTimeout(400);
  console.log('kartpostal tr:', (await p.textContent('#modalBody')).replace(/\s+/g, ' ').trim().slice(0, 60), '|', await p.textContent('#modalBtn'));
  await p.evaluate(() => IT.setLang && document.dispatchEvent(Object.assign(new Event('change', { bubbles: true }), {})));
  await p.evaluate(() => { const s = document.createElement('select'); s.className = 'lang-select'; s.innerHTML = '<option value="en" selected>en</option>'; document.body.appendChild(s); s.dispatchEvent(new Event('change', { bubbles: true })); s.remove(); });
  await p.waitForTimeout(400);
  console.log('kartpostal en:', (await p.textContent('#modalBody')).replace(/\s+/g, ' ').trim().slice(0, 60), '|', await p.textContent('#modalBtn'), '| paylaş bağlı:', await p.evaluate(() => !document.querySelector('#pcShare') || typeof document.querySelector('#pcShare').onclick === 'function'));
  await p.click('#modalBtn');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
