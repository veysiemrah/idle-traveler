// Hasat mevsimi: ekim–kasımda tarla bölgelerinin yol kenarında balkabağı öbeği, saman balyası ve korkuluk (gündüz/gece/telefon),
// gece oyulmuş balkabağı yanar ve ay turuncuya çalar; dokununca hoplar, günün ilk dokunuşu hasat payı verir (ikincisi vermez),
// mevsim dışında ve çölde balkabağı çıkmaz, bozuk kayıt temizlenir
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
  const open = async (save, vp, sky, dark) => {
    const p = await b.newPage({ locale: 'tr-TR', viewport: vp || { width: 1280, height: 860 }, colorScheme: dark ? 'dark' : 'light' });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(hook);
    await p.addInitScript(s => localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)),
      Object.assign({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50, msIdx: 99, credits: 0, settings: { sky: sky || 'day', zoom: 1 } }, save));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
    return p;
  };
  const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1')));
  const toasts = async p => (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();
  // yol kenarını hasatla yeniden doldurur ve ekranın ortasına üç türü de koyar
  const stage = (p, fest) => p.evaluate(fest => {
    const s = __sc; s.festival = fest; const L = s.layers.road; L.items = []; L.next = 0; s.fill(true);
    if (fest) {
      const k = s.k, base = s.scroll + s.travelerX;
      L.items = L.items.filter(it => Math.abs(it.x - base - 150 * k) > 260 * k);
      L.items.push({ type: 'pumpkin', kind: 'patch', pk: [[0, 0, 7.5], [13, 0, 5.2], [-11, 0, 4.4]], s: 1.2, seed: 1, lamp: true, hopAt: -9, x: base + 60 * k },
        { type: 'pumpkin', kind: 'bale', pk: [[3, -15, 6.5], [21, 0, 5]], s: 1.2, seed: 2, lamp: true, hopAt: -9, x: base + 150 * k },
        { type: 'pumpkin', kind: 'scare', pk: [[13, 0, 5.5]], s: 1.2, seed: 3, lamp: true, hopAt: -9, x: base + 250 * k });
      L.items.sort((a, c) => a.x - c.x);
    }
    return L.items.filter(it => it.type === 'pumpkin').length;
  }, fest);
  // ekrandaki ilk balkabağı öbeğine dokunur (sanal → sayfa koordinatı)
  const tapAt = async (p, kind) => {
    const pt = await p.evaluate(kind => {
      const s = __sc, it = s.layers.road.items.find(i => i.type === 'pumpkin' && i.kind === kind), r = s.canvas.getBoundingClientRect();
      const x = it.x - s.scroll, y = s.H * 0.79 + s.shift(0.66) + 2;
      return { x: r.left + (x + 6 * s.k) * s.zoom, y: r.top + (y - 10 * s.k) * s.zoom };
    }, kind);
    await p.mouse.click(pt.x, pt.y);
  };
  const shot = async (p, name, vp) => {
    const y = await p.evaluate(() => { const s = __sc, r = s.canvas.getBoundingClientRect(); return r.top + (s.H * 0.79 + s.shift(0.66)) * s.zoom; });
    await p.screenshot({ path: `${process.env.SP}/harvest_${name}.png`, clip: vp ? { x: 0, y: Math.max(0, y - 130), width: vp.width, height: 170 } : { x: 300, y: y - 120, width: 600, height: 160 } });
  };

  // 1) Gündüz, gece (fener ve hasat ayı), telefonda
  for (const [name, vp, sky, dark] of [['day', null, 'day'], ['night', null, 'night', true], ['phone', { width: 320, height: 640 }, 'night', true], ['phone_day', { width: 360, height: 740 }, 'day']]) {
    const p = await open({ distance: 800, regionIdx: 3 }, vp, sky, dark);
    console.log(name, 'yol kenarındaki balkabağı öbekleri:', await stage(p, 'harvest'));
    await p.evaluate(() => { __sc.speedVis = 0; });
    await p.waitForTimeout(120);
    await shot(p, name, vp);
    if (name === 'night') await p.screenshot({ path: `${process.env.SP}/harvest_night_full.png` });
    await p.close();
  }

  // 2) Dokunuş: hoplar, günün ilk dokunuşu hasat payı verir, ikincisi vermez; adım sayılmaz
  const p = await open({ distance: 10, regionIdx: 0, credits: 0 });
  await stage(p, 'harvest');
  const c0 = (await saved(p)).clicks;
  await tapAt(p, 'bale'); await p.waitForTimeout(250);
  await shot(p, 'hop');
  await p.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  const s1 = await saved(p);
  console.log('ilk dokunuş: kredi', Math.round(s1.credits), '· gün', s1.harvestDay, '·', await toasts(p), '· adım sayıldı mı:', s1.clicks !== c0);
  await p.waitForTimeout(400);
  await tapAt(p, 'patch'); await p.waitForTimeout(250);
  await p.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  const s2 = await saved(p);
  console.log('ikinci dokunuş pay verdi mi:', s2.credits > s1.credits + 1, '· hopladı mı:', await p.evaluate(() => __sc.layers.road.items.some(i => i.type === 'pumpkin' && __sc.t - i.hopAt < 1)));
  await p.close();

  // 3) Dün pay alınmışsa bugün yeniden verilir; bozuk değer temizlenir
  const q = await open({ distance: 10, regionIdx: 0, credits: 0, harvestDay: '2000-01-01' });
  await stage(q, 'harvest'); await tapAt(q, 'scare'); await q.waitForTimeout(250);
  await q.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  console.log('eski günden sonra pay:', Math.round((await saved(q)).credits) > 0);
  await q.close();
  const bad = await open({ harvestDay: { x: 1 } });
  await bad.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  console.log('bozuk gün:', JSON.stringify((await saved(bad)).harvestDay));
  await bad.close();

  // 4) Mevsim dışında ve çölde balkabağı yok
  const o = await open({ distance: 10, regionIdx: 0 });
  console.log('mevsim dışı balkabağı:', await stage(o, null));
  await o.close();
  const d = await open({ distance: 900000, regionIdx: 8 });
  console.log('çölde balkabağı:', await d.evaluate(() => { const s = __sc; s.festival = 'harvest'; const L = s.layers.road; L.items = []; L.next = 0; s.fill(true); return L.items.filter(i => i.type === 'pumpkin').length; }));
  await d.close();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
