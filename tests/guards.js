// Kayıt ve zaman korumaları: iki sekme birbirinin kaydını ezmez, korunan kayıt sıfırlamayla silinmez, saat geri alınınca
// etkiler uzamaz ve çevrimdışı ilerleme tekrar alınamaz, iki dilek (kayan yıldız + karahindiba) ×100 değil ×10 sayılır
const { chromium } = require('./lib/pw');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const KEY = 'idle-traveler-save-v1';
  const base = { v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50, settings: { sky: 'day', zoom: 1 } };
  const page = async ctx => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); return p; };
  const saved = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);

  // 1) İki sekme: başka sekme kaydı yazınca bu sekme kaydetmeyi bırakır (ilerlemeyi ezmez) ve sıfırlama da kayda dokunmaz
  {
    const ctx = await b.newContext({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
    await ctx.addInitScript(([k, s]) => { if (!localStorage.getItem('seeded')) { localStorage.setItem('seeded', 1); localStorage.setItem(k, JSON.stringify(s)); } }, [KEY, Object.assign({ credits: 100 }, base)]);
    const B = await page(ctx); await B.goto('http://localhost:8765/index.html'); await B.waitForTimeout(1200);
    // "öteki sekme": aynı kökenden oyunsuz bir sayfa kayda bir işaret yazar
    const C = await page(ctx); await C.goto('http://localhost:8765/css/style.css');
    await C.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); s.treasures = 77; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
    await B.waitForTimeout(300);
    console.log('B bildirimi:', (await B.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(0, 80));
    await B.evaluate(() => { window.dispatchEvent(new Event('pagehide')); });
    await B.waitForTimeout(5500);
    console.log('öteki sekmenin kaydı korundu mu:', (await saved(C)).treasures === 77);
    await B.evaluate(() => document.getElementById('btnSettings').click());
    await B.waitForTimeout(400);
    const rs = await B.$('#modalBody [data-act="reset"]');
    if (!rs) console.log('pencere:', await B.isVisible('#modal'), (await B.textContent('#modalBody')).replace(/\s+/g, ' ').slice(0, 100));
    if (rs) { await rs.click(); await B.waitForTimeout(100); await rs.click(); await B.waitForTimeout(300); }
    const after = await saved(C);
    console.log('sıfırlama düğmesi bulundu mu:', !!rs, '· sıfırlamadan sonra kayıt yerinde mi:', !!after && after.treasures === 77);
    await ctx.close();
  }

  // 1b) İki dilek birlikte: kredi geliri yalnız dilekle aynı (×10), ×100 değil
  {
    const inc = async fx => {
      const ctx = await b.newContext({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
      const now = Date.now();
      await ctx.addInitScript(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, Object.assign({}, base, { distance: 3000, owned: { walk: 1, skates: 1 }, active: 'skates',
        effects: fx.map(id => ({ id, until: now + 60e3, stack: 1 })) })]);
      const p = await page(ctx); await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(4000);
      const txt = await p.textContent('#income'); await ctx.close();
      return txt.replace(/\s+/g, ' ').trim();
    };
    console.log('gelir: yalnız dilek', await inc(['wish']), '· dilek + karahindiba', await inc(['wish', 'seed']), '· dileksiz', await inc([]));
  }

  // 2) Saat geri alınınca etki kalan süresini korur; kayıttaki gelecek lastSeen sıfırlanmaz
  {
    const ctx = await b.newContext({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
    const now = Date.now();
    await ctx.addInitScript(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, Object.assign({}, base, {
      effects: [{ id: 'rainbow', until: now + 20e3, stack: 1 }, { id: 'wish', until: now + 20e3, stack: 1 }, { id: 'seed', until: now + 20e3, stack: 1 }] })]);
    const p = await page(ctx); await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
    await p.evaluate(() => { const real = Date.now; window.__realNow = real; Date.now = () => real() - 86400e3; });
    await p.waitForTimeout(1500);
    await p.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    const s1 = await saved(p);
    const rb = s1.effects.find(e => e.id === 'rainbow');
    const remain = rb ? (rb.until - (Date.now() - 86400e3)) / 1000 : -1;
    console.log('saat bir gün geri: gökkuşağının kalan süresi (sn):', remain.toFixed(1), '· makul mü:', remain > 10 && remain < 20);
    console.log('kayıttaki lastSeen gerçek zamandan geride kalmadı mı:', s1.lastSeen >= Date.now() - 5000);
    await ctx.close();
  }

  // 3) Gelecekteki lastSeen ile açılış: çevrimdışı ilerleme verilmez, lastSeen geleceğe kalır
  {
    const ctx = await b.newContext({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
    await ctx.addInitScript(([k, s]) => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem(k, JSON.stringify(s)); } },
      [KEY, Object.assign({}, base, { lastSeen: Date.now() + 10 * 3600e3, distance: 500 })]);
    const p = await page(ctx); await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
    console.log('gelecekteki kayıtta çevrimdışı pencere açıldı mı:', await p.isVisible('#modal'));
    await p.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    const s = await saved(p);
    console.log('lastSeen gelecekte kaldı mı (saat):', ((s.lastSeen - Date.now()) / 3600e3).toFixed(1));
    await ctx.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
