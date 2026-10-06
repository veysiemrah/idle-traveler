// Yolcular: ad penceresi, liste, ad değiştirme, sunucusuz durum. Kullanım: SP=... node mp.js [taban adres]
const { chromium } = require('./lib/pw');
const BASE = process.argv[2] || 'http://127.0.0.1:8787';
(async () => {
  const b = await chromium.launch(); const errs = [];
  const page = async (opts, seed) => {
    const ctx = await b.newContext(Object.assign({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } }, opts));
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    if (seed) await p.addInitScript(s => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } }, seed);
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(600);
    return p;
  };
  const modalText = p => p.evaluate(() => document.querySelector('#modal').hidden ? '(kapalı)' : document.querySelector('#modalBody h2').textContent);

  // 1) Yeni oyuncu: tanıtım → ad penceresi
  const a = await page({});
  console.log('ilk pencere:', await modalText(a));
  await a.click('#modalBtn'); await a.waitForTimeout(200);
  console.log('ikinci pencere:', await modalText(a));
  await a.click('#modalBtn'); await a.waitForTimeout(200);
  console.log('boş adla:', await modalText(a), '|', await a.textContent('#nameMsg'));
  await a.click('[data-act="nameDice"]'); await a.waitForTimeout(150);
  console.log('zar:', await a.inputValue('#nameInput'));
  await a.fill('#nameInput', '  Veysi   Emrah  '); await a.press('#nameInput', 'Enter'); await a.waitForTimeout(1500);
  console.log('Enter sonrası:', await modalText(a), '| ad:', await a.evaluate(() => JSON.parse(localStorage.getItem('idle-traveler-save-v1') || '{}').player));
  await a.screenshot({ path: process.env.SP + '/mp_named.png' });

  // 2) Eski oyuncu (tanıtımı görmüş, adı yok) + daha uzun yol
  const seed = { v: 3, intro: true, lastSeen: Date.now(), seenVer: '9', distance: 52000, trips: 2, route: 'coast', owned: { walk: 1, skates: 1, board: 1, bike: 1, horse: 1 }, levels: {}, active: 'horse' };
  const c = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, seed);
  console.log('eski oyuncu pencere:', await modalText(c));
  await c.fill('#nameInput', 'Deniz'); await c.click('#modalBtn'); await c.waitForTimeout(1500);
  await c.click('.tab[data-id="travelers"]'); await c.waitForTimeout(300);
  const rows = p => p.$$eval('.tr-row', r => r.map(x => x.querySelector('.tr-rank').textContent + ' ' + x.querySelector('.tr-name b').textContent + ' | ' + x.querySelector('.tr-sub').textContent + ' | ' + x.querySelector('.tr-dist').textContent));
  console.log('Deniz listesi:', await rows(c), '| sekme sayısı:', await c.textContent('#trCount'));
  await c.screenshot({ path: process.env.SP + '/mp_list390.png' });
  // a sayfası listeyi yenilesin
  await a.evaluate(() => IT.Online.now()); await a.waitForTimeout(800);
  await a.click('.tab[data-id="travelers"]'); await a.waitForTimeout(300);
  console.log('Veysi listesi:', await rows(a));
  // 3) Ad değiştirme (Ayarlar)
  await a.click('#btnSettings'); await a.waitForTimeout(200);
  await a.fill('#setName', 'x'); await a.click('[data-act="rename"]'); await a.waitForTimeout(200);
  console.log('geçersiz ad sonrası:', await a.inputValue('#setName'));
  await a.fill('#setName', 'Yolcu Veysi'); await a.click('[data-act="rename"]'); await a.waitForTimeout(1200);
  await a.click('#modalBtn'); await a.waitForTimeout(200);
  console.log('ad değişti:', await rows(a));
  await a.screenshot({ path: process.env.SP + '/mp_list1280.png' });
  // yoldakiler başta: ayırıcının üstünde yalnızca yolda olanlar, altında yalnızca yolda olmayanlar; sıra numaraları kesintisiz
  const order = await a.$$eval('#pane-travelers .tr-list > li', l => l.map(x => x.classList.contains('tr-sep') ? 'SEP' : x.classList.contains('tr-gap') ? 'GAP'
    : (x.querySelector('.tr-dot.on') ? 'on' : 'off') + ':' + x.querySelector('.tr-rank').textContent));
  const sep = order.indexOf('SEP'), above = order.slice(0, sep < 0 ? order.length : sep), below = sep < 0 ? [] : order.slice(sep + 1);
  console.log('sıralama: yoldaki', above.filter(x => x.startsWith('on')).length, '| ayırıcı', sep >= 0, '| üstte yolda olmayan', above.filter(x => x.startsWith('off')).length,
    '| altta yoldaki', below.filter(x => x.startsWith('on')).length, '| numaralar sıralı mı', order.filter(x => x.includes(':')).every((x, i) => +x.split(':')[1] === i + 1));
  if (sep >= 0) { await a.$eval('#pane-travelers .tr-sep', e => e.scrollIntoView({ block: 'center' })); await a.waitForTimeout(150); await a.screenshot({ path: process.env.SP + '/mp_list_sep.png', clip: { x: 890, y: 55, width: 390, height: 600 } }); }
  // 4) dar ekran
  const n = await page({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }, Object.assign({}, seed, { player: undefined }));
  await n.screenshot({ path: process.env.SP + '/mp_name320.png' });
  await n.fill('#nameInput', 'Çağrı Öztürk-Ünal'); await n.click('#modalBtn'); await n.waitForTimeout(1200);
  await n.click('.tab[data-id="travelers"]'); await n.waitForTimeout(300);
  await n.screenshot({ path: process.env.SP + '/mp_list320.png' });
  const sw = await n.evaluate(() => document.documentElement.scrollWidth);
  console.log('320 yatay taşma:', sw > 320, '| satırlar:', (await rows(n)).length);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
