const { chromium } = require('./lib/pw');
const key = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const now = Date.now(), D = 86400e3;
  const cases = [
    ['dün geldi, seri 6', { last: key(now - D), streak: 6, best: 6 }],
    ['iki gün ara', { last: key(now - 2 * D), streak: 4, best: 4 }],
    ['saat geri alınmış', { last: key(now + D), streak: 3, best: 3 }],
    ['bugün zaten geldi', { last: key(now), streak: 2, best: 5 }],
    ['eski kayıt (gün yok)', undefined],
    ['bozuk', { last: 'xx', streak: -4, best: 'a' }],
  ];
  for (const [label, day] of cases) {
    const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1280, height: 860 } });
    p.on('pageerror', e => errs.push(label + ': ' + e.message));
    await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); const s = { intro: true, lastSeen: Date.now(), credits: 0, clicks: 50, owned: { walk: 1, skates: 1 }, active: 'skates' }; if (d) s.day = d; localStorage.setItem('idle-traveler-save-v1', JSON.stringify(s)); } }, day);
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(600);
    const toasts = (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim();
    await p.click('.tab[data-id="journal"]'); await p.waitForTimeout(200);
    const st = await p.evaluate(() => [...document.querySelectorAll('.statgrid div')].map(d => d.textContent).find(t => /Üst üste/.test(t)));
    console.log(`${label.padEnd(22)} | kredi ${await p.textContent('#credits')} | ${st} | bildirim: ${toasts.slice(0, 110) || '-'}`);
    await p.close();
  }
  // oyun açıkken gece yarısı geçer
  const p = await b.newPage({ locale: 'en-US', viewport: { width: 1280, height: 860 } });
  p.on('pageerror', e => errs.push('midnight: ' + e.message));
  const t0 = new Date(); t0.setHours(23, 59, 50, 0);
  await p.clock.install({ time: t0 });
  await p.addInitScript(k => localStorage.setItem('idle-traveler-save-v1', JSON.stringify({ intro: true, lastSeen: Date.now(), credits: 0, clicks: 50, day: { last: k, streak: 6, best: 6 } })), key(t0.getTime()));
  await p.goto('http://localhost:8765/index.html'); await p.clock.runFor(3000);
  console.log('23:59:53 →', await p.textContent('#credits'), '|', (await p.textContent('#toasts')).trim() || '-');
  await p.clock.runFor(12000);
  console.log('00:00:05 →', await p.textContent('#credits'), '|', (await p.textContent('#toasts')).replace(/\s+/g, ' ').trim().slice(0, 160));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
