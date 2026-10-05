/* Idle Traveler — Worker: statik site + "Yolcular" API'si (D1).
   /api/* dışındaki her istek public/ klasöründeki statik dosyalara gider.

   POST /api/hello   { id, key, name, dist, trip, veh, route, tier, outfit, pal } → kaydı günceller, yolcu listesini döner
   GET  /api/players                                           → yalnızca yolcu listesi */

const VEHICLES = ['walk', 'skates', 'board', 'bike', 'horse', 'moto', 'car', 'van', 'train', 'balloon', 'plane', 'jet', 'rocket', 'sail'];
const ROUTES = ['anatolia', 'coast', 'north', 'bloom', 'silk'];
const OUTFITS = ['classic', 'sky', 'forest', 'lavender', 'sunset', 'night', 'gold'];
const PALS = ['', 'dog', 'bird', 'cat'];
const ONLINE_MS = 3 * 60e3;      // son 3 dakikada haber veren yolcu "yolda" sayılır
const LIST_MS = 24 * 3600e3;     // listede son 24 saatte oynayanlar görünür
const LIST_MAX = 50;
const MIN_GAP_MS = 5e3;          // aynı yolcunun kaydı en sık 5 saniyede bir yazılır
const PRUNE_MS = 30 * 24 * 3600e3; // 30 gün görünmeyen kayıtlar silinir

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

// İsim: 2–20 karakter; harf, rakam, boşluk ve . _ ' - (en az bir harf ya da rakam)
export function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  const n = [...s].length;
  if (n < 2 || n > 20) return null;
  if (!/^[\p{L}\p{M}\p{N} ._'-]+$/u.test(s) || !/[\p{L}\p{N}]/u.test(s)) return null;
  return s;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Yolcu listesi: son 24 saatte oynayanlar, yola göre sıralı. me: isteği yapanın satırı (ilk 50'de değilse sırasıyla eklenir)
// pub: gizli kimliği açık etmeyen kısa, kalıcı bir anahtar (sahnede aynı gezgini tanımak için)
const pubOf = async id => (await sha256('pub:' + id)).slice(0, 12);
const COLS = 'id, name, dist, trip, veh, tier, outfit, pal, seen';
async function listPlayers(db, id, now) {
  const since = now - LIST_MS, onlineSince = now - ONLINE_MS;
  const [rows, counts] = await db.batch([
    db.prepare(`SELECT ${COLS} FROM players WHERE seen > ?1 ORDER BY dist DESC LIMIT ?2`).bind(since, LIST_MAX),
    db.prepare('SELECT COUNT(*) AS total, SUM(seen > ?2) AS online FROM players WHERE seen > ?1').bind(since, onlineSince),
  ]);
  const map = async r => ({
    pub: await pubOf(r.id), name: r.name, dist: r.dist, trip: r.trip, veh: r.veh, tier: r.tier, outfit: r.outfit, pal: r.pal,
    online: r.seen > onlineSince, ago: Math.max(0, now - r.seen), me: r.id === id,
  });
  const players = await Promise.all(rows.results.map(async (r, i) => Object.assign(await map(r), { rank: i + 1 })));
  let me = players.find(p => p.me) || null;
  if (!me && id) {
    const r = await db.prepare(`SELECT ${COLS} FROM players WHERE id = ?1 AND seen > ?2`).bind(id, since).first();
    if (r) {
      const above = await db.prepare('SELECT COUNT(*) AS n FROM players WHERE seen > ?1 AND dist > ?2').bind(since, r.dist).first();
      me = Object.assign(await map(r), { rank: (above ? above.n : 0) + 1 });
    }
  }
  const c = counts.results[0] || {};
  return { now, online: c.online || 0, total: c.total || 0, players, me };
}

async function hello(request, env) {
  let b;
  try { b = await request.json(); } catch (e) { return json({ error: 'bad-json' }, 400); }
  if (!b || typeof b !== 'object') return json({ error: 'bad-body' }, 400);
  const id = typeof b.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(b.id) ? b.id : null;
  const key = typeof b.key === 'string' && /^[0-9a-f]{64}$/.test(b.key) ? b.key : null;
  const name = cleanName(b.name);
  const dist = Number(b.dist), trip = Number(b.trip);
  if (!id || !key) return json({ error: 'bad-id' }, 400);
  if (!name) return json({ error: 'bad-name' }, 400);
  if (!isFinite(dist) || dist < 0 || dist > 1e22) return json({ error: 'bad-dist' }, 400);
  if (!Number.isInteger(trip) || trip < 1 || trip > 1e5 + 1) return json({ error: 'bad-trip' }, 400);
  const veh = VEHICLES.includes(b.veh) ? b.veh : 'walk';
  const route = ROUTES.includes(b.route) ? b.route : 'anatolia';
  const tier = Number.isInteger(b.tier) && b.tier >= 0 && b.tier <= 4 ? b.tier : 0;
  const outfit = OUTFITS.includes(b.outfit) ? b.outfit : 'classic';
  const pal = PALS.includes(b.pal) ? b.pal : '';
  const now = Date.now(), hash = await sha256(key);
  // Yeni kimlik eklenir; var olan kimlik yalnızca anahtar tutuyorsa ve son yazımdan 5 sn geçtiyse güncellenir
  const res = await env.DB.prepare(`INSERT INTO players (id, key, name, dist, trip, veh, route, created, seen, tier, outfit, pal) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8, ?10, ?11, ?12)
    ON CONFLICT (id) DO UPDATE SET name = excluded.name, dist = excluded.dist, trip = excluded.trip, veh = excluded.veh, route = excluded.route, seen = excluded.seen,
      tier = excluded.tier, outfit = excluded.outfit, pal = excluded.pal
    WHERE players.key = excluded.key AND players.seen < excluded.seen - ?9`).bind(id, hash, name, dist, trip, veh, route, now, MIN_GAP_MS, tier, outfit, pal).run();
  if (!res.meta.changes) {
    const row = await env.DB.prepare('SELECT key FROM players WHERE id = ?1').bind(id).first();
    if (row && row.key !== hash) return json({ error: 'not-yours' }, 403);
  }
  // Ara sıra eski kayıtları temizle
  if (Math.random() < 0.01) await env.DB.prepare('DELETE FROM players WHERE seen < ?1').bind(now - PRUNE_MS).run();
  return json(await listPlayers(env.DB, id, now));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      if (url.pathname === '/api/hello' && request.method === 'POST') return await hello(request, env);
      if (url.pathname === '/api/players' && request.method === 'GET') return json(await listPlayers(env.DB, null, Date.now()));
      return json({ error: 'not-found' }, 404);
    } catch (e) {
      return json({ error: 'server' }, 500);
    }
  },
};
