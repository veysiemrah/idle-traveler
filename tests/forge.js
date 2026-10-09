// Tüm zamanlar sahteciliğine karşı makullük sınırı (Worker, yerel D1 ile 8787): bildirilen toplam yol kaydın yaşına göre
// tavana kırpılır (yeni kayıt: 100 × REACH[0] = 7,7e8 m); kısa aralıklı istekler tavanı büyütmez; dürüst değer aynen saklanır; toplam hiç azalmaz.
const BASE = 'http://127.0.0.1:8787';
const post = async (path, body) => (await fetch(BASE + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const hex = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), x => x.toString(16).padStart(2, '0')).join('');
(async () => {
  const errs = [];
  const me = { id: crypto.randomUUID(), key: hex(32), name: 'Hileci', trip: 1, veh: 'walk', spd: 1 };
  const life = async () => { const d = await post('/api/top', { id: me.id }); return (d.me || {}).life; };
  await post('/api/hello', Object.assign({}, me, { dist: 10, life: 1e23 }));
  const l1 = await life();
  console.log('yeni kayıt 1e23 bildirdi →', l1.toExponential(2), '| tavanın altında mı:', l1 <= 7.71e8);
  await sleep(5200);
  await post('/api/hello', Object.assign({}, me, { dist: 10, life: 1e23 }));
  const l2 = await life();
  console.log('5 sn sonra yine 1e23 →', l2.toExponential(2), '| büyüdü mü:', l2 > l1 * 1.0001);
  // dürüst oyuncu: gerçek değer aynen saklanır, sonra azalmaz
  const ok = { id: crypto.randomUUID(), key: hex(32), name: 'Dürüst', trip: 2, veh: 'car', spd: 20 };
  await post('/api/hello', Object.assign({}, ok, { dist: 3e6, life: 4.2e7 }));
  const d1 = (await post('/api/top', { id: ok.id })).me;
  await sleep(5200);
  await post('/api/hello', Object.assign({}, ok, { dist: 100, life: 1e5 }));
  const d2 = (await post('/api/top', { id: ok.id })).me;
  console.log('dürüst değer aynen mi:', d1.life === 4.2e7, '| daha küçük bildirince azaldı mı:', d2.life < d1.life);
  // eski istemci (life göndermez): bu yolculuğun mesafesi kullanılır
  const old = { id: crypto.randomUUID(), key: hex(32), name: 'Eski', trip: 1, veh: 'walk', spd: 1 };
  await post('/api/hello', Object.assign({}, old, { dist: 5000 }));
  console.log('eski istemci toplamı:', (await post('/api/top', { id: old.id })).me.life);
  // hız da aynı tavana bağlı: sahte 9e14 m/sn, yeni kayıtta tavanın 1/30'una (≈2,6e7) kırpılır; listede tahmini mesafe şişmez
  const fast = { id: crypto.randomUUID(), key: hex(32), name: 'Jet', trip: 1, veh: 'walk', spd: 9e14 };
  const fl = await post('/api/hello', Object.assign({}, fast, { dist: 1 }));
  const fr = fl.players.find(p => p.me);
  console.log('sahte hız 9e14 →', fr.spd.toExponential(2), '| tavanın altında mı:', fr.spd <= 7.71e8 / 30 + 1);
  if (!(l1 <= 7.71e8) || l2 > l1 * 1.0001 || d1.life !== 4.2e7 || d2.life < d1.life || !(fr.spd <= 7.71e8 / 30 + 1)) errs.push('beklenmeyen sonuç');
  console.log(errs.join('\n') || 'no errors');
})().catch(e => console.log('error:', e.message));
