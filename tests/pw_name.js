// Eski testler için ön yükleme (node -r): kayıtta gezgin adı yoksa "Test" adı eklenir, böylece ad penceresi araya girmez.
// NODE_OPTIONS alt süreçlere geçmesin, yoksa ön yükleme her alt süreçte (ör. npm) yeniden çalışır
delete process.env.NODE_OPTIONS;
const pw = require('./lib/pw');
const init = () => {
  // Legacy suites exercise the Earth/garage experience explicitly. V2 onboarding is covered separately.
  try { if (!localStorage.getItem('idle-traveler-tab')) localStorage.setItem('idle-traveler-tab', 'garage'); } catch (e) { /* blocked-storage fixtures */ }
  window.IT = window.IT || {};
  let SceneConstructor;
  Object.defineProperty(window.IT, 'Scene', { configurable: true, get: () => SceneConstructor, set: Constructor => {
    if (typeof Constructor !== 'function') { SceneConstructor = Constructor; return; }
    const TracedScene = function (...args) { const instance = new Constructor(...args); window.__sc = instance; return instance; };
    TracedScene.prototype = Constructor.prototype; SceneConstructor = TracedScene;
  } });
  const get = Storage.prototype.getItem;
  let injectedPlayer;
  Storage.prototype.getItem = function (k) {
    const v = get.call(this, k);
    if (k !== 'idle-traveler-save-v1') return v;
    const pl = () => injectedPlayer || (injectedPlayer = { id: '00000000-0000-4000-8000-' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0'), key: 'd'.repeat(64), name: 'Test' });
    if (!v) return JSON.stringify({ player: pl(), v2: { worldId: 'earth', unlockedWorlds: ['earth'], onboardingSeen: true } });
    try {
      const d = JSON.parse(v);
      let changed = false;
      if (!d.player || !d.player.name) { d.player = pl(); changed = true; }
      if (!d.v2 && !(+d.v >= 4)) { d.v2 = { worldId: 'earth', unlockedWorlds: ['earth'], onboardingSeen: true }; changed = true; }
      if (changed) return JSON.stringify(d);
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
