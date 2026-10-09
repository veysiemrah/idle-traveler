// Kızıl (tilki): yabani tilki karşılaşması (gündüz/gece, telefon), üç dokunuşta yol arkadaşı olması,
// kilitli kartın ipucu ve pati izleri, araçlarda koşan/camdan bakan tilki görünümleri
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const all = { walk: 1, skates: 1, board: 1, bike: 1, horse: 1, moto: 1, car: 1, van: 1, train: 1, balloon: 1, plane: 1, jet: 1, rocket: 1, sail: 1 };
  const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
  const open = async (save, vp, sky) => {
    const p = await b.newPage({ locale: 'tr-TR', viewport: vp || { width: 1280, height: 860 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(hook);
    await p.addInitScript(s => localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)),
      Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50,
        settings: { sky: sky || 'day', zoom: 1 } }, save));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
    return p;
  };
  // sahnedeki (sanal) koordinatı sayfa koordinatına çevirir
  const tapFox = async p => {
    const pt = await p.evaluate(() => { const f = __sc.foxPos(), r = __sc.canvas.getBoundingClientRect(), z = __sc.zoom; return { x: r.left + (f.x - 4 * __sc.k) * z, y: r.top + (f.y - 14 * __sc.k) * z }; });
    await p.mouse.click(pt.x, pt.y);
  };
  const toasts = async p => (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();

  // 1) Yabani tilki gündüz, gece ve telefonda
  for (const [name, vp, sky] of [['day', null, 'day'], ['night', null, 'night'], ['phone', { width: 320, height: 640 }, 'night']]) {
    const p = await open({ buffs: { pal: 1 }, owned: { walk: 1 }, active: 'walk' }, vp, sky);
    await p.evaluate(() => __sc.spawnFox());
    await p.waitForTimeout(sky === 'night' ? 500 : 2400);
    if (sky === 'night') await p.screenshot({ path: `${process.env.SP}/fox_wild_${name}_eyes.png` });
    await p.waitForTimeout(sky === 'night' ? 2600 : 0);
    await p.screenshot({ path: `${process.env.SP}/fox_wild_${name}.png` });
    await p.close();
  }

  // 2) Üç karşılaşmada dokununca tilki yol arkadaşı olur
  const p = await open({ buffs: { pal: 3 }, credits: 1e6, palPick: 'bird' });
  await p.click('.tab[data-id="buffs"]'); await p.waitForTimeout(200);
  const card = async () => p.$eval('.pal-btn[data-id="fox"]', e => ({ txt: e.innerText.replace(/\s+/g, ' '), dis: e.disabled }));
  console.log('kilitli kart (hiç karşılaşmadan):', JSON.stringify(await card()));
  for (let i = 1; i <= 3; i++) {
    await p.evaluate(() => __sc.spawnFox());
    await p.waitForTimeout(1300);
    await tapFox(p); await p.waitForTimeout(i === 3 ? 900 : 300);
    console.log(`dokunuş ${i}:`, await toasts(p));
    if (i === 1) {
      // aynı karşılaşmada ikinci dokunuş sayılmaz
      await tapFox(p); await p.waitForTimeout(200);
      console.log('aynı tilkiye ikinci dokunuş sayıldı mı:', /selamlaştılar/.test(await toasts(p)));
      console.log('kart (1 karşılaşma):', JSON.stringify(await card()));
      await p.$eval('.pals', e => e.scrollIntoView({ block: 'center' }));
      await p.screenshot({ path: process.env.SP + '/fox_card_paws.png', clip: { x: 890, y: 55, width: 390, height: 805 } });
    }
    await p.waitForTimeout(1600);
  }
  console.log('kart (açıldı):', JSON.stringify(await card()));
  console.log('seçili:', await p.$eval('.pal-btn.on', e => e.dataset.id), '· sahnede:', await p.evaluate(() => __sc.companion));
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  console.log('kayıt: fox =', saved.fox, 'palPick =', saved.palPick);
  await p.waitForTimeout(1500);
  console.log('yeni karşılaşma gelir mi (açıldıktan sonra):', await p.evaluate(() => !!__sc.fox));
  await p.$eval('.pals', e => e.scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: process.env.SP + '/fox_card_open.png', clip: { x: 890, y: 55, width: 390, height: 805 } });
  await p.close();

  // 3) Bozuk kayıt: kilitli tilki seçilemez
  const q = await open({ buffs: { pal: 5 }, palPick: 'fox', fox: 1 });
  console.log('kilitliyken seçili tilki düzeltildi mi:', await q.evaluate(() => __sc.companion));
  await q.close();

  // 4) Araçlarda Kızıl (görünüm aşamaları)
  const shots = [];
  for (const [lvl, veh, sky] of [[1, 'walk', 'day'], [4, 'bike', 'day'], [7, 'horse', 'night'], [10, 'walk', 'night'], [10, 'car', 'day'], [7, 'balloon', 'day'], [4, 'train', 'day'], [10, 'van', 'night']]) {
    const r = await open({ owned: all, active: veh, palPick: 'fox', fox: 3, buffs: { pal: lvl } }, null, sky);
    await r.waitForTimeout(1000);
    const pos = await r.evaluate(() => ({ x: __sc.travelerX * __sc.zoom, y: __sc.riderY() * __sc.zoom }));
    const file = `${process.env.SP}/fox_pal${lvl}_${veh}.png`;
    await r.screenshot({ path: file, clip: { x: Math.max(0, pos.x - 190), y: Math.max(55, pos.y + 55 - 200), width: 330, height: 220 } });
    shots.push(file); await r.close();
  }
  console.log('görüntüler:', shots.length);

  // 5) Çam Ormanı'nda yol arkadaşıyla gezerken tilki kendiliğinden çıkar (ilk karşılaşma 50–90 sn)
  const w = await open({ distance: 200, regionIdx: 2, msIdx: 99, buffs: { pal: 1 } });
  let seen = 0;
  for (let i = 0; i < 100 && !seen; i++) { await w.waitForTimeout(1000); if (await w.evaluate(() => !!__sc.fox)) seen = i + 1; }
  console.log('çam ormanında tilki çıktı mı (sn):', seen, '·', await toasts(w));
  await w.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
