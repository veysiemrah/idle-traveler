// Gelire bağlı ödüller (v1.37): kalıcı gelirle ölçeklenir. Dilek (kredi ×10) ya da gökkuşağı (hız ×10) açıkken açılan sandık,
// etkisiz açılan sandıkla aynı ödülü verir (önceden on kat veriyordu). Beklenen: ≈ 6000 sn × otomatik gelir.
const { chromium } = require('./lib/pw');
const hook = () => { document.addEventListener('DOMContentLoaded', () => { const S0 = window.IT.Scene; window.IT.Scene = function (...a) { const s = new S0(...a); window.__sc = s; return s; }; }); };
const save = fx => JSON.stringify({ v: 3, intro: true, lastSeen: Date.now(), seenVer: '99', clicks: 50, distance: 3000, regionIdx: 4, msIdx: 99,
  owned: { walk: 1, skates: 1, board: 1 }, levels: { board: 20 }, active: 'board', mapPieces: 4,
  effects: fx ? [{ id: fx, until: Date.now() + 60e3, stack: 1 }] : [] });
const num = s => +s.replace(/[^\d,]/g, '').replace(',', '.');
(async () => {
  const b = await chromium.launch(); const errs = []; const got = {};
  for (const fx of ['', 'wish', 'rainbow']) {
    const p = await b.newPage({ locale: 'tr-TR', viewport: { width: 1100, height: 760 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(hook);
    await p.addInitScript(d => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', 1); localStorage.setItem('idle-traveler-save-v1', d); } }, save(fx));
    await p.goto('http://localhost:8765/index.html');
    for (let i = 0; i < 40 && !(await p.evaluate(() => !!__sc.chest)); i++) await p.waitForTimeout(300);
    const c = await p.evaluate(() => { const r = __sc.canvas.getBoundingClientRect(), q = __sc.chestPos(); return { x: r.left + q.x * __sc.zoom, y: r.top + (q.y - 14 * __sc.k) * __sc.zoom }; });
    await p.mouse.click(c.x, c.y); await p.waitForTimeout(300);
    const t = (await p.textContent('#toasts')).replace(/\s+/g, ' ');
    const m = /Hazine[^+]*\+([\d.,]+)/.exec(t);
    got[fx || 'etkisiz'] = m ? num(m[1]) : NaN;
    console.log((fx || 'etkisiz').padEnd(8), 'etki:', (await p.textContent('#effects')).trim() || '-', '| sandık:', m ? '+' + m[1] : '(bildirim yok) ' + t.slice(-80));
    await p.close();
  }
  console.log('dilek / etkisiz:', (got.wish / got.etkisiz).toFixed(2), '| gökkuşağı / etkisiz:', (got.rainbow / got.etkisiz).toFixed(2), '(beklenen ≈ 1)');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
