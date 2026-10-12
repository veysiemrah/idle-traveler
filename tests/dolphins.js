// Yunuslar: kıyı denizinde sıçrayan sürü (gündüz/gece/telefon), dokununca selam (bir kez sayılır), yedi selamda Denizci kıyafeti,
// kilitli kıyafetin ipucu, denizli bölgede kendiliğinden gelmesi ve denizsiz bölgede gelmemesi
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
  const COAST = { distance: 3500, regionIdx: 4, msIdx: 99 }, MEADOW = { distance: 10, regionIdx: 0, msIdx: 99 };
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
  // sürünün ortasına (sanal koordinat → sayfa) dokunur
  const tap = async p => {
    const pt = await p.evaluate(() => {
      const s = __sc.dolScale(), h = __sc.dolHead(), n = __sc.dolphins.n, r = __sc.canvas.getBoundingClientRect(), z = __sc.zoom;
      return { x: r.left + (h - (n - 1) * 17 * s) * z, y: r.top + (__sc.seaLine - 20 * s) * z };
    });
    await p.mouse.click(pt.x, pt.y);
  };
  // sürü ekranın ortasına gelene kadar ileri sarar (dokunmadan önce)
  const spawnMid = async p => { await p.evaluate(() => { __sc.spawnDolphins(); __sc.dolphins.t = 6.2; __sc.dolphins.ph = 0; }); await p.waitForTimeout(150); };
  const toasts = async p => (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();

  // 1) Gündüz, gece, telefonda (gece) ve Zeytin Bahçeleri'nde: sıçrayış ve selam taklası
  for (const [name, vp, sky, at] of [['day', null, 'day', COAST], ['night', null, 'night', COAST], ['phone', { width: 320, height: 640 }, 'night', COAST],
    ['olive_phone', { width: 360, height: 740 }, 'day', { distance: 2e9, regionIdx: 14, msIdx: 99 }]]) {
    const p = await open(at, vp, sky);
    await spawnMid(p);
    // ilk yunus havadayken
    await p.evaluate(() => { __sc.dolphins.t = 6.2 + 0.5; });
    await p.waitForTimeout(80);
    const box = await p.evaluate(() => ({ x: __sc.dolHead() * __sc.zoom, y: __sc.seaLine * __sc.zoom, W: __sc.RW }));
    const clip = vp ? { x: 0, y: Math.max(0, box.y - 60), width: vp.width, height: 130 } : { x: Math.max(0, box.x - 260), y: box.y - 40, width: 420, height: 150 };
    clip.y += 55; // başlık çubuğu
    await p.screenshot({ path: `${process.env.SP}/dolphins_${name}.png`, clip });
    await tap(p); await p.waitForTimeout(650);
    await p.screenshot({ path: `${process.env.SP}/dolphins_${name}_happy.png`, clip });
    if (name === 'day') await p.screenshot({ path: `${process.env.SP}/dolphins_${name}_full.png` });
    console.log(name, 'selam sayıldı mı:', await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).dolphins), '·', await toasts(p));
    await p.close();
  }

  // 2) Aynı sürüye ikinci dokunuş sayılmaz; kilitli kıyafetin ipucu; yedinci selamda Denizci kıyafeti
  const p = await open(Object.assign({ dolphins: 0 }, COAST));
  const outfit = async () => p.$eval('.outfit[data-id="sailor"]', e => ({ txt: e.innerText.replace(/\s+/g, ' '), dis: e.disabled }));
  await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
  console.log('kıyafet (hiç selam yok):', JSON.stringify(await outfit()));
  for (let i = 1; i <= 7; i++) {
    await spawnMid(p);
    await tap(p); await p.waitForTimeout(250);
    if (i === 1) {
      await tap(p); await p.waitForTimeout(250);
      const n = await p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')).dolphins);
      console.log('aynı sürüye ikinci dokunuş sayıldı mı:', n !== 1, '· kıyafet (1 selam):', JSON.stringify(await outfit()));
    }
    await p.evaluate(() => { __sc.dolphins = null; });
  }
  await p.waitForTimeout(1200);
  console.log('7 selam:', await toasts(p));
  console.log('kıyafet (açıldı):', JSON.stringify(await outfit()));
  await p.click('.outfit[data-id="sailor"]'); await p.waitForTimeout(300);
  const pos = await p.evaluate(() => ({ x: __sc.travelerX * __sc.zoom, y: __sc.riderY() * __sc.zoom }));
  await p.screenshot({ path: `${process.env.SP}/dolphins_sailor.png`, clip: { x: Math.max(0, pos.x - 120), y: Math.max(55, pos.y - 90), width: 240, height: 200 } });
  await p.$eval('.outfits', e => e.scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: `${process.env.SP}/dolphins_outfits.png`, clip: { x: 890, y: 55, width: 390, height: 805 } });
  console.log('Yol Defteri satırı:', await p.evaluate(() => [...document.querySelectorAll('dt')].filter(e => /Yunus/.test(e.textContent)).map(e => e.textContent + ' ' + e.nextElementSibling.textContent).join()));
  await p.close();

  // 2b) Telefonda kilitli kıyafetin ipucu taşmaz
  const ph = await open({ dolphins: 2 }, { width: 320, height: 640 });
  await ph.click('.tab[data-id="journal"]'); await ph.waitForTimeout(200);
  await ph.$eval('.outfit[data-id="sailor"]', e => e.scrollIntoView({ block: 'center' })); await ph.waitForTimeout(100);
  await ph.screenshot({ path: `${process.env.SP}/dolphins_outfits_phone.png` });
  console.log('telefonda ipucu taşıyor mu:', await ph.$eval('.outfit[data-id="sailor"] small', e => e.scrollWidth > e.clientWidth + 1));
  await ph.close();

  // 3) Ege Sahil Yolu'nda kendiliğinden gelir (ilki 30–60 sn), Sabah Köyü'nde gelmez
  const w = await open(COAST), m = await open(MEADOW);
  let seen = 0, meadow = false;
  for (let i = 0; i < 70 && !seen; i++) {
    await w.waitForTimeout(1000);
    if (await w.evaluate(() => !!__sc.dolphins)) seen = i + 1;
    if (await m.evaluate(() => !!__sc.dolphins)) meadow = true;
  }
  console.log('kıyıda yunus çıktı mı (sn):', seen, '·', await toasts(w), '· köyde çıktı mı:', meadow);
  await w.close(); await m.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
