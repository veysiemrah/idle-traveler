// Özel Anlar (v1.54): kartpostal çekilirken sahnedeki olay (altın kelebek, kuş…) yakalanır, fotoğrafın köşesine altın mühür
// basılır, bildirim gelir ve Yol Defteri'nde işlenir; aynı an ikinci kez bildirilmez; sekizinci anla kartpostallar altın
// çerçeveli olur; albümün büyük görünümünde yakalanan anlar yazar; bozuk kayıt temizlenir
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
  const today = new Date().toLocaleDateString('sv-SE');
  const open = async (save, opts) => {
    const p = await b.newPage(Object.assign({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } }, opts || {}));
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(hook);
    await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } },
      Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, msIdx: 99, harvestDay: today, distance: 800, regionIdx: 3, settings: { sky: 'day' } }, save));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
    return p;
  };
  const saved = async p => { await p.evaluate(() => window.dispatchEvent(new Event('pagehide'))); return p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1'))); };
  const toasts = async p => (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();
  const shoot = async (p, shot) => { await p.click('#btnPhoto'); await p.waitForTimeout(900); if (shot) await p.screenshot({ path: `${process.env.SP}/${shot}.png` }); await p.click('#modalBtn'); await p.waitForTimeout(300); };

  // 1) Kelebek ve kuş birlikte: iki an, mühürler, bildirim; aynı anlar yeniden bildirilmez
  const p = await open({ photos: 0 });
  await p.evaluate(() => { __sc.spawnGift(30); __sc.gift.x = __sc.W * 0.6; __sc.gift.t = 2; __sc.spawnBird('stork', 0); __sc.bird.t = 3; __sc.bird.x = __sc.W * 0.4; });
  await p.waitForTimeout(100);
  await shoot(p, 'moments_card');
  let s = await saved(p);
  console.log('anlar:', JSON.stringify(s.moments), '·', (await toasts(p)).match(/Özel an[^·]*· \d\/\d/) || '(bildirim yok)');
  await p.evaluate(() => { __sc.spawnGift(30); __sc.gift.t = 2; });
  await shoot(p);
  console.log('aynı an ikinci kez bildirildi mi:', /Özel an yakalandı/.test((await toasts(p)).split('Özel an yakalandı').slice(2).join('')));
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(300);
  console.log('defter:', await p.$$eval('.keep.moment', l => l.map(e => (e.classList.contains('on') ? '✓' : '·') + e.innerText.replace(/\s+/g, ' ')).join(' | ')));
  await p.$eval('.keeps.moments', e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(150);
  await p.screenshot({ path: `${process.env.SP}/moments_journal.png`, clip: { x: 890, y: 55, width: 390, height: 805 } });
  await p.click('.album-pc[data-id="1"]'); await p.waitForTimeout(400);
  console.log('albüm büyük görünüm:', await p.$eval('#modalBody', e => (e.querySelector('.album-mo') || { textContent: '(yok)' }).textContent.trim()));
  await p.close();

  // 2) Sekizinci an: altın çerçeve ve bildirim; sonraki kartpostal altın çerçeveli
  const all7 = { butterfly: 1, bird: 1, rainbow: 1, star: 1, plane: 1, dolphins: 1, fox: 1 };
  const q = await open({ photos: 3, moments: all7, distance: 1.3e7, regionIdx: 10, settings: { sky: 'night' } }, { colorScheme: 'dark' });
  await q.waitForTimeout(1500);
  await shoot(q, 'moments_gold');
  console.log('sekizinci an:', JSON.stringify(Object.keys((await saved(q)).moments).length), '·', (await toasts(q)).match(/Bütün özel anlar[^·]*·[^·]*/) || '(yok)');
  await shoot(q, 'moments_gold2');
  await q.close();

  // 3) bozuk kayıt
  const r = await open({ moments: { rainbow: 1, nope: 1, star: 'x' } });
  console.log('bozuk kayıt:', JSON.stringify((await saved(r)).moments));
  await r.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
