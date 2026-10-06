// Yadigârlar: yol kenarında kendiliğinden belirir, dokununca rafa konur, hız bonusu verir, kayda yazılır;
// raf dolunca Kâşif kıyafeti açılır. Telefon (320 px), koyu tema ve eski kayıt da denenir.
const { chromium } = require('./lib/pw');
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
const save = extra => JSON.stringify(Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, credits: 100,
  player: { id: '00000000-0000-4000-8000-000000000001', key: 'b'.repeat(64), name: 'Raf' } }, extra));
async function page(b, opts, data) {
  const p = await b.newPage(opts);
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(hook);
  await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, data);
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(600);
  return p;
}
const tapKeep = async p => {
  const c = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), q = __sc.keepPos(); return { x: q.x + r.left, y: q.y + r.top }; });
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(400);
};
const shelf = p => p.$eval('.keeps', e => e.closest('#pane-journal').querySelector('.sec:has(+ .keeps)').textContent.replace(/\s+/g, ' ').trim());
(async () => {
  const b = await chromium.launch(); const errs = [];
  // 1) yeni yolcu: raf boş, yadigâr kendiliğinden belirir
  const p = await page(b, { locale: 'tr-TR', viewport: { width: 1280, height: 860 } }, save({}));
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
  console.log('raf (önce):', await shelf(p), '| kutu:', await p.$$eval('.keep', l => l.length));
  let seen = false;
  for (let i = 0; i < 110 && !seen; i++) { await p.waitForTimeout(1000); seen = await p.evaluate(() => !!__sc.keep); }
  console.log('kendiliğinden belirdi mi:', seen, '| bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-60));
  if (!seen) await p.evaluate(() => __sc.spawnKeep('meadow'));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: process.env.SP + '/keep_scene.png', clip: { x: 0, y: 300, width: 900, height: 420 } });
  await tapKeep(p);
  console.log('bildirim:', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-110));
  await p.waitForTimeout(300);
  console.log('raf (sonra):', await shelf(p), '| bulunan:', await p.$$eval('.keep.on', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()).join(', ')));
  await p.evaluate(() => document.querySelector('.keeps').scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: process.env.SP + '/keep_shelf.png', clip: { x: 880, y: 55, width: 400, height: 805 } });
  await p.waitForTimeout(5500);
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  console.log('kayıt:', JSON.stringify(st.keeps), '| hız çarpanı:', await p.evaluate(s => IT.Econ.keepMult(s), st));
  // bulunan bölgede bir daha belirmez
  await p.evaluate(() => __sc.spawnKeep('meadow')); await p.waitForTimeout(200);
  console.log('bulunmuş yadigâr yeniden çıktı mı:', await p.evaluate(() => !!__sc.keep));
  // rafa dokununca küçük bir karşılık
  await p.click('.keep.on'); await p.waitForTimeout(150);
  console.log('dokununca sallandı mı:', await p.$eval('.keep.on', e => e.classList.contains('wiggle')));
  errs.push(...p.errs);
  // 2) on dört yadigâr: sonuncusu Kâşif kıyafetini açar (telefon, koyu tema)
  const all = ['meadow', 'lavender', 'pine', 'wheat', 'coast', 'canyon', 'sakura', 'autumn', 'desert', 'snow', 'aurora', 'tea', 'cappadocia', 'tulip'];
  const q = await page(b, { locale: 'en-US', viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, colorScheme: 'dark' },
    save({ keeps: Object.fromEntries(all.map(k => [k, 1])) }));
  await q.click('.tab[data-id="journal"]'); await q.waitForTimeout(200);
  await q.evaluate(() => __sc.spawnKeep('olive')); await q.waitForTimeout(800);
  await q.screenshot({ path: process.env.SP + '/keep_phone_scene.png' });
  await tapKeep(q);
  console.log('son yadigâr:', (await q.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(-160));
  await q.waitForTimeout(300);
  console.log('raf:', await shelf(q), '| Kâşif açık mı:', await q.$eval('.outfit[data-id="explorer"]', e => !e.disabled));
  await q.evaluate(() => document.querySelector('.keeps').scrollIntoView({ block: 'start' }));
  await q.screenshot({ path: process.env.SP + '/keep_phone_shelf.png' });
  await q.evaluate(() => document.querySelector('.outfits').scrollIntoView({ block: 'center' }));
  await q.screenshot({ path: process.env.SP + '/keep_phone_outfits.png' });
  errs.push(...q.errs);
  // 3) bozuk / eski kayıt
  const r = await page(b, { locale: 'de-DE', viewport: { width: 800, height: 700 } }, save({ keeps: { meadow: 1, nope: 1, snow: 'x', tea: 5 }, settings: { outfit: 'explorer' } }));
  await r.click('.tab[data-id="journal"]'); await r.waitForTimeout(200);
  console.log('bozuk kayıt rafı:', await shelf(r), '| kıyafet:', await r.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).settings.outfit));
  errs.push(...r.errs);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
