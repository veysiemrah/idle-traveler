// Kayıt yedeği: okunamayan kayıt yeni oyunla ezilmez, sağlam yedekten sürülür; bildirimler solarak kaybolur
const { chromium } = require('./lib/pw');
const KEY = 'idle-traveler-save-v1', BAK = KEY + '-bak';
(async () => {
  const b = await chromium.launch(); const errs = [];
  const good = credits => JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50, credits });
  const page = async (store, breakData) => {
    const ctx = await b.newContext({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => { if (!breakData) errs.push(e.message); });
    await p.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', 1); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); } }, store);
    // yayın sırasında eski ve yeni dosyaların karışmasını taklit eder: data.js mektupları tanımıyor
    if (breakData) {
      p.broken = true;
      await p.route('**/js/data.js', async r => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()) + (p.broken ? '\nIT.LETTERS = undefined;' : '') }); });
    }
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1200);
    return p;
  };
  const read = p => p.evaluate(([k, bk]) => ({ main: localStorage.getItem(k), bak: localStorage.getItem(bk) }), [KEY, BAK]);
  const credits = s => { try { return Math.round(JSON.parse(s).credits); } catch (e) { return 'bozuk'; } };

  // 1) JSON sağlam, kod okuyamıyor: kayda hiç yazılmaz
  let p = await page({ [KEY]: good(123456) }, true);
  console.log('kilitli oturum: bildirim var mı:', /okunamadı/.test(await p.textContent('#toasts')), '· pencere kapalı mı:', await p.isHidden('#modal'));
  await p.evaluate(() => { dispatchEvent(new Event('pagehide')); dispatchEvent(new Event('beforeunload')); });
  await p.waitForTimeout(5600);
  let s = await read(p);
  console.log('kod uyuşmazlığında ana kayıt korundu mu:', credits(s.main) === 123456, '· yedek:', credits(s.bak));
  p.broken = false; await p.reload(); await p.waitForTimeout(1200);
  s = await read(p);
  console.log('dosyalar düzelince kayıt açıldı mı:', credits(s.main) >= 123456, '· yedek silindi mi:', s.bak === null);
  await p.context().close();

  // 2) Bozuk JSON, sağlam yedek: oyun yedekten sürer; ana kayıt düzelince yedek silinir
  p = await page({ [KEY]: '{bozuk', [BAK]: good(777) });
  s = await read(p);
  console.log('yedekten açıldı mı:', credits(s.bak) === 777, '· kredi:', (await p.textContent('#credits')).trim());
  await p.evaluate(() => dispatchEvent(new Event('pagehide')));
  await p.reload(); await p.waitForTimeout(1200);
  s = await read(p);
  console.log('ana kayıt yedekten yazıldı mı:', credits(s.main) >= 777, '· yedek silindi mi:', s.bak === null);
  await p.context().close();

  // 3) Bozuk JSON, yedek yok: bozuk kopya yedeğe konur; yedek varsa (okunamasa da) ezilmez
  p = await page({ [KEY]: '{ilk-bozuk' });
  console.log('bozuk kopya yedekte mi:', (await read(p)).bak === '{ilk-bozuk');
  await p.context().close();
  p = await page({ [KEY]: '{ikinci-bozuk', [BAK]: '{eski-yedek' });
  console.log('ikinci hata eski yedeği ezdi mi:', (await read(p)).bak !== '{eski-yedek');
  await p.context().close();

  // 4) Bildirimler: en çok üçü görünür; fazlası birden silinmez, solarak (out) yerini bırakır
  p = await page({ [KEY]: JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', clicks: 50, distance: 2e11, lifeDist: 2e11, unitTip: 2 }) });
  await p.waitForTimeout(800);
  for (let i = 0; i < 4 && await p.isVisible('#modal'); i++) { console.log('pencere:', (await p.textContent('#modal')).replace(/\s+/g, ' ').slice(0, 80)); await p.click('#modalBtn'); await p.waitForTimeout(400); }
  await p.evaluate(() => { for (const x of [...document.querySelector('#toasts').children]) x.remove(); });
  // AB ile yazılan mesafeye her dokunuş bir açıklama bildirimi açar
  for (let i = 0; i < 5; i++) { await p.click('#hudDist.unit-tip'); await p.waitForTimeout(60); }
  const st = () => p.$$eval('#toasts .toast', a => a.map(x => x.classList.contains('out') ? 'out' : 'live').join(','));
  console.log('bildirimler hemen:', await st());
  await p.waitForTimeout(700);
  console.log('bildirimler 0,7 sn sonra:', await st());
  await p.context().close();

  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
