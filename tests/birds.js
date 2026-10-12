// Kuş Defteri: her bölgenin kuşu gündüz/gece/telefonda gökyüzünden geçer, dokununca deftere yazılır (aynı kuşa ikinci dokunuş
// sayılmaz), defterde bulunanlar renkli ve bulunmayanlar siluet, yedinci kuşta Kuş Gözlemcisi kıyafeti, kilitli kıyafetin
// ipucu, eski kayıt (birds alanı yok), kendiliğinden gelmesi ve yağmurda gelmemesi
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
  // Anadolu Yolu'nda her kuşun bir bölgesi (bölge sırası ve eşiği)
  const AT = { stork: [0, 10], beeeater: [1, 30], woodpecker: [2, 200], flamingo: [4, 3500], eagle: [5, 13000], owl: [9, 3.3e6], kingfisher: [11, 5.1e7] };
  const open = async (save, vp, sky, dark) => {
    const p = await b.newPage({ locale: 'tr-TR', viewport: vp || { width: 1280, height: 860 }, colorScheme: dark ? 'dark' : 'light' });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(hook);
    await p.addInitScript(s => localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)),
      Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50, msIdx: 99,
        settings: { sky: sky || 'day', zoom: 1 } }, save));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
    return p;
  };
  const at = id => ({ regionIdx: AT[id][0], distance: AT[id][1] });
  const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  // kuşu ekranın ortasına getirir (kendiliğinden gelen olayları durdurur)
  const spawnMid = async (p, id) => p.evaluate(id => {
    const c = document.querySelector('.hud-card').getBoundingClientRect(), r = __sc.canvas.getBoundingClientRect();
    __sc.spawnBird(id, (c.bottom - r.top) / __sc.zoom); const bd = __sc.bird; bd.t = 3; bd.x = __sc.W * 0.5;
  }, id);
  // lider kuşa (sanal koordinat → sayfa) dokunur
  const where = p => p.evaluate(() => {
    const bd = __sc.bird, q = __sc.birdPos(bd, 0), r = __sc.canvas.getBoundingClientRect(), z = __sc.zoom;
    return { x: r.left + (q.x + q.dir * 4 * q.k) * z, y: r.top + (q.y - 2 * q.k) * z };
  });
  const tap = async p => { const pt = await where(p); await p.mouse.click(pt.x, pt.y); };
  const toasts = async p => (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();

  // 1) Her kuş kendi bölgesinde, gündüz ve gece; telefonda da (gece) birkaçı; dokununca dürbün halkası
  for (const id of process.env.ONLY ? [] : Object.keys(AT)) {
    for (const [name, vp, sky] of [['day', null, 'day'], ['night', null, 'night'], ['phone', { width: 320, height: 640 }, 'night']]) {
      if (name === 'phone' && !['stork', 'flamingo', 'owl'].includes(id)) continue;
      const p = await open(at(id), vp, sky);
      await spawnMid(p, id); await p.waitForTimeout(120);
      const pt = await where(p);
      const clip = vp ? { x: 0, y: Math.max(0, pt.y - 90), width: vp.width, height: 170 } : { x: pt.x - 210, y: pt.y - 90, width: 420, height: 170 };
      await p.screenshot({ path: `${process.env.SP}/birds_${id}_${name}.png`, clip });
      await tap(p); await p.waitForTimeout(220);
      await p.screenshot({ path: `${process.env.SP}/birds_${id}_${name}_noted.png`, clip });
      const s = await saved(p);
      console.log(id, name, 'deftere yazıldı mı:', JSON.stringify(s.birds), '·', await toasts(p));
      await p.close();
    }
  }

  // 2) Aynı kuşa ikinci dokunuş sayılmaz; defter bölümü (açık ve koyu tema, telefon); yedinci kuşta kıyafet
  const p = await open(Object.assign({ birds: {} }, at('stork')));
  const outfit = async () => p.$eval('.outfit[data-id="birder"]', e => ({ txt: e.innerText.replace(/\s+/g, ' '), dis: e.disabled }));
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
  console.log('kıyafet (hiç kuş yok):', JSON.stringify(await outfit()), '· defter bölümü var mı:', !!(await p.$('.keeps.birds')));
  await spawnMid(p, 'stork'); await tap(p); await p.waitForTimeout(150); await tap(p); await p.waitForTimeout(250);
  console.log('ikinci dokunuş sayıldı mı:', (await saved(p)).birds.stork !== 1, '· kıyafet (1 kuş):', JSON.stringify(await outfit()));
  await p.$eval('.keeps.birds', e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(150);
  await p.screenshot({ path: `${process.env.SP}/birds_journal_one.png`, clip: { x: 890, y: 55, width: 390, height: 805 } });
  for (const id of Object.keys(AT).slice(1)) {
    await p.evaluate(() => { __sc.bird = null; });
    await spawnMid(p, id); await tap(p); await p.waitForTimeout(250);
  }
  await p.waitForTimeout(1200);
  console.log('7 kuş:', await toasts(p));
  console.log('kıyafet (açıldı):', JSON.stringify(await outfit()));
  await p.$eval('.keeps.birds', e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(150);
  await p.screenshot({ path: `${process.env.SP}/birds_journal_all.png`, clip: { x: 890, y: 55, width: 390, height: 805 } });
  // defterdeki kuşa dokununca sallanır (adım sayılmaz)
  const clicks0 = (await saved(p)).clicks;
  await p.click('.keep.bird[data-id="owl"]'); await p.waitForTimeout(200);
  console.log('defterdeki kuş sallandı mı:', await p.$eval('.keep.bird[data-id="owl"]', e => e.classList.contains('wiggle')));
  await p.click('.outfit[data-id="birder"]'); await p.waitForTimeout(300);
  const pos = await p.evaluate(() => ({ x: __sc.travelerX * __sc.zoom, y: __sc.riderY() * __sc.zoom }));
  await p.screenshot({ path: `${process.env.SP}/birds_birder.png`, clip: { x: Math.max(0, pos.x - 120), y: Math.max(55, pos.y - 90), width: 240, height: 200 } });
  console.log('giyilen kıyafet:', (await saved(p)).settings.outfit, '· adım sayısı değişti mi:', (await saved(p)).clicks !== clicks0);
  await p.close();

  // 2b) Koyu temada ve telefonda defter: siluetler seçiliyor, ipuçları taşmıyor
  for (const [name, vp, dark] of [['dark', null, true], ['phone', { width: 320, height: 640 }, false], ['phone_dark', { width: 360, height: 740 }, true]]) {
    const q = await open({ birds: { stork: 3, flamingo: 1 }, dolphins: 0 }, vp, dark ? 'night' : 'day', dark);
    await q.click('.tab[data-id="journal"]'); await q.waitForTimeout(200);
    await q.$eval('.keeps.birds', e => e.scrollIntoView({ block: 'center' })); await q.waitForTimeout(150);
    await q.screenshot({ path: `${process.env.SP}/birds_journal_${name}.png`, clip: vp ? undefined : { x: 890, y: 55, width: 390, height: 805 } });
    console.log(name, 'taşan yazı:', await q.$$eval('.keep.bird b, .keep.bird small, .outfit[data-id="birder"] small', es => es.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent).join('|') || 'yok'),
      '· kıyafet:', await q.$eval('.outfit[data-id="birder"]', e => e.innerText.replace(/\s+/g, ' ')));
    await q.close();
  }

  // 3) Eski kayıt (birds alanı yok) sorunsuz açılır, kıyafet kilitli; bozuk değerler temizlenir
  const o = await open({ birds: { stork: 'x', eagle: -4, owl: 2.7, nope: 5 } });
  await o.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  console.log('bozuk kayıt:', JSON.stringify((await saved(o)).birds), '· kıyafet kilitli mi:', await o.$eval('.outfit[data-id="birder"]', e => e.disabled));
  await o.close();
  const old = await open({ distance: 50 });
  await old.click('.tab[data-id="journal"]'); await old.waitForTimeout(200);
  await old.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  console.log('eski kayıt: birds:', JSON.stringify((await saved(old)).birds), '· kıyafet kilitli mi:', await old.$eval('.outfit[data-id="birder"]', e => e.disabled), '· defter bölümü gizli mi:', !(await old.$('.keeps.birds')));
  await old.close();

  // 4) Sabah Köyü'nde kendiliğinden gelir (ilki 40–70 sn); yağmurda gelmez
  const w = await open(at('stork'));
  let seen = 0;
  for (let i = 0; i < 80 && !seen; i++) { await w.waitForTimeout(1000); if (await w.evaluate(() => !!__sc.bird)) seen = i + 1; }
  console.log('köyde kuş çıktı mı (sn):', seen, '· tür:', await w.evaluate(() => __sc.bird && __sc.bird.id), '·', await toasts(w));
  await w.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
