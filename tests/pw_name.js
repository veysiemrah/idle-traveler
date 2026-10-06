// Eski testler için ön yükleme (node -r): kayıtta gezgin adı yoksa "Test" adı eklenir, böylece ad penceresi araya girmez.
// NODE_OPTIONS alt süreçlere geçmesin, yoksa ön yükleme her alt süreçte (ör. npm) yeniden çalışır
delete process.env.NODE_OPTIONS;
const pw = require('./lib/pw');
const init = () => {
  const get = Storage.prototype.getItem;
  Storage.prototype.getItem = function (k) {
    const v = get.call(this, k);
    if (k !== 'idle-traveler-save-v1') return v;
    const pl = () => ({ id: '00000000-0000-4000-8000-' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0'), key: 'd'.repeat(64), name: 'Test' });
    if (!v) return JSON.stringify({ player: pl() });
    try {
      const d = JSON.parse(v);
      if (!d.player || !d.player.name) { d.player = pl(); return JSON.stringify(d); }
    } catch (e) { /* bozuk kayıt testleri */ }
    return v;
  };
};
const launch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (...a) => {
  const b = await launch(...a);
  const newContext = b.newContext.bind(b);
  b.newContext = async (...o) => { const c = await newContext(...o); await c.addInitScript(init); return c; };
  b.newPage = async (...o) => { const c = await b.newContext(...o); return c.newPage(); };
  return b;
};
