// El sallama uçtan uca: B, A'ya el sallar; A bildirimi ve B'nin başında 👋'yi görür. Ayrıca A gezgine dokununca yeni metin
const { chromium } = require('./lib/pw');
const BASE = 'http://127.0.0.1:8787';
(async () => {
  const b = await chromium.launch(); const errs = [];
  const base = 7e6 + Math.random() * 1e6;
  const open = async (name, dist, w) => {
    const ctx = await b.newContext({ locale: 'tr-TR', viewport: { width: w || 1280, height: 760 } });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.addInitScript(([name, dist]) => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: dist, regionIdx: 6,
      owned: { walk: 1 }, levels: { walk: 3 }, active: 'walk',
      player: { id: crypto.randomUUID(), key: Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join(''), name } })); }, [name, dist]);
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(1500);
    return p;
  };
  const A = await open('Ayşe', base), B = await open('Bora', base + 40);
  await A.evaluate(() => IT.Online.now()); await B.evaluate(() => IT.Online.now()); await A.waitForTimeout(1500);
  // B, A'ya el sallar (dokunmanın gönderdiği istekle aynısı). Alıcı adla değil anahtarla bulunur:
  // yerel test veritabanında önceki çalıştırmalardan kalan başka "Ayşe"ler de olabilir.
  const aPub = await A.evaluate(() => IT.Online.myPub());
  const r = await B.evaluate(async to => { const s = JSON.parse(localStorage.getItem('idle-traveler-save-v1')); return IT.Online.say('wave', s.player.id, s.player.key, to); }, aPub);
  console.log('gönderim:', r);
  let toastTxt = '';
  for (let i = 0; i < 16 && !/el salladı/.test(toastTxt); i++) { await A.waitForTimeout(500); toastTxt = await A.textContent('#toasts'); }
  console.log('A bildirimi:', (toastTxt.match(/Bora[^!]*![^.]*\./) || [toastTxt.slice(-80)])[0]);
  await A.screenshot({ path: process.env.SP + '/wave_recv.png', clip: { x: 0, y: 380, width: 890, height: 330 } });
  // A, sahnede Bora'ya dokunur: yeni metin
  const box = await A.evaluate(() => { const c = document.querySelector('#scene').getBoundingClientRect(); return { x: c.left, y: c.top, w: c.width, h: c.height }; });
  let hit = '';
  for (let x = box.w * 0.35; x < box.w * 0.95 && !/El salladın/.test(hit); x += 12) { await A.mouse.click(box.x + x, box.y + box.h * 0.8); await A.waitForTimeout(60); hit = await A.textContent('#toasts'); }
  console.log('A dokundu:', (hit.match(/El salladın[^.]*\./) || ['(bulunamadı)'])[0]);
  await A.waitForTimeout(300);
  await A.screenshot({ path: process.env.SP + '/wave_send.png', clip: { x: 0, y: 380, width: 890, height: 330 } });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
