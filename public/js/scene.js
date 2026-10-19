/* Idle Traveler — sahne çizimi.
   Paralaks katmanlar, gün/gece döngüsü, biyom geçişleri, araçlar, parçacıklar ve altın kelebek. */
(function () {
  'use strict';
  const IT = window.IT;
  const { BIOMES } = IT;

  /* ---------- Küçük matematik ve renk yardımcıları ---------- */
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const fract = x => x - Math.floor(x);
  // Ateşböceği Yolu: gece çimenlerdeki ateşböceği sayısı ve sürünün en uzun kalış süresi (sn)
  const FIREFLIES = 22, SWARM_LIFE = 40;
  // Bulut Yolu: bir şeye benzeyen bulutların topakları [dx, dy, r] (sağa bakar, ölçek 1'de ~120 px); eye: canlanınca kırpışan göz
  const CLOUD_SHAPES = {
    rabbit: { p: [[0, 0, 20], [-14, 4, 16], [14, 6, 13], [26, -12, 13], [32, -6, 8], [22, -30, 6], [21, -40, 5.5], [20, -49, 5], [31, -29, 6], [34, -38, 5.5], [37, -46, 5], [-30, -4, 8], [-6, 18, 7], [16, 18, 6]], eye: [30, -15] },
    whale: { p: [[-22, 2, 17], [-2, -4, 22], [20, 0, 19], [36, 6, 12], [6, 10, 16], [-40, -2, 10], [-52, -10, 8], [-62, -20, 7], [-54, 8, 7], [-64, 14, 6], [30, -30, 4], [25, -38, 5], [34, -39, 5], [29, -44, 4]], eye: [30, 4] },
    heart: { p: [[-13, -10, 15], [13, -10, 15], [-9, 6, 12], [9, 6, 12], [-4, 16, 9], [4, 16, 9], [0, 24, 6], [0, 31, 3]] },
    sheep: { p: [[-16, -2, 14], [0, -8, 16], [16, -2, 14], [-8, 8, 13], [10, 8, 13], [-24, 6, 9], [24, 4, 9], [34, -4, 9], [40, 2, 7], [-14, 22, 4.5], [-5, 23, 4.5], [8, 23, 4.5], [17, 22, 4.5]], eye: [37, -3] },
    bird: { p: [[0, 0, 14], [-14, 3, 12], [-26, 5, 8], [18, -8, 10], [28, -6, 4], [-4, -16, 11], [-12, -29, 9], [-20, -40, 7], [-26, -50, 5], [-36, 8, 6], [-44, 10, 4]], eye: [21, -10] },
    ship: { p: [[-30, 14, 6], [-18, 16, 8], [-4, 17, 9], [10, 17, 9], [24, 15, 7], [34, 11, 5], [-14, 2, 8], [-2, 2, 9], [8, 0, 8], [-6, -10, 8], [4, -12, 8], [0, -22, 7], [6, -24, 6], [4, -34, 5], [7, -43, 3.5]] },
  };
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mul = (a, f) => [a[0] * f, a[1] * f, a[2] * f];
  const css = (c, a) => (a === undefined || a >= 1)
    ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`
    : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, a).toFixed(3)})`;
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };
  const fbm = (x, o) => { let a = 0.5, s = 0, n = 0; for (let k = 0; k < o; k++) { s += a * vnoise(x); n += a; x *= 2.03; a *= 0.5; } return s / n; };
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  const NIGHT_SKY = [hex('#0b1431'), hex('#28366a')];
  const DUSK_SKY = [hex('#4a5799'), hex('#ff9d6c')];
  const SPACE_SKY = [hex('#03040d'), hex('#0d1430')];
  const NIGHT_TINT = hex('#1b2550');
  const DUSK_TINT = hex('#ff9466');
  const WHITE = [255, 255, 255];

  const TREE = {
    round: '#4f9a57', autumn: '#e59a3a', autumnRed: '#cc5a3c', sakura: '#f5b3c8', poplar: '#5c9a4c', poplarGold: '#e6b545',
    cypress: '#2f6a4d', pine: '#2e6a50', snowpine: '#2e6a5a', palm: '#4f9b4e', cactus: '#5b9a58', bush: '#4a8f52',
    rock: '#9b948c', teabush: '#3b8a4e', chimney: '#ead2ad', olive: '#93a87c',
  };
  const TREE_RGB = Object.fromEntries(Object.entries(TREE).map(([k, v]) => [k, hex(v)]));
  const TRUNK = hex('#7a5a43');

  // Yolcunun kıyafet paleti (sahne ışığından bağımsız sabit renkler; geceleri hafifçe kararır)
  const P = {
    skin: '#f2c6a0', hair: '#3d2a22', jacket: '#e7694e', jacketDark: '#c9553d', pants: '#2f4668', pantsDark: '#24374f',
    pack: '#f0b445', hat: '#2f9e8f', hatDark: '#237c70', shoe: '#3a2c2a', cream: '#fbf4e6', steel: '#5d6475', dark: '#2a2f3d',
    teal: '#2f9e8f', glass: '#a9d8ec',
  };
  // Seçilen kıyafeti palete uygular (yolcu, araç vurguları, garaj simgeleri ve kartpostal birlikte değişir)
  IT.setOutfit = id => {
    const o = (IT.OUTFIT && IT.OUTFIT[id]) || IT.OUTFIT.classic;
    for (const k of ['jacket', 'jacketDark', 'hat', 'hatDark', 'pack']) P[k] = o[k];
  };

  // Başka bir gezgini kendi kıyafetiyle çizmek için paleti geçici olarak değiştirir
  const OUTFIT_KEYS = ['jacket', 'jacketDark', 'hat', 'hatDark', 'pack'];
  function withOutfit(id, fn) {
    const keep = {};
    for (const k of OUTFIT_KEYS) keep[k] = P[k];
    IT.setOutfit(id);
    try { fn(); } finally { Object.assign(P, keep); }
  }

  /* ---------- Biyom paleti ---------- */
  function biomePal(id) {
    const b = BIOMES[id];
    return {
      sky0: hex(b.sky[0]), sky1: hex(b.sky[1]), far: hex(b.far), cap: hex(b.cap || b.far), capA: b.cap ? 1 : 0,
      mid: hex(b.mid), near: hex(b.near), ground: hex(b.ground), road: hex(b.road),
      aurora: b.aurora ? 1 : (id === 'snow' ? 0.35 : 0), sea: b.farShape === 'sea' ? 1 : 0,
    };
  }
  function blendPal(a, b, t) {
    const o = {};
    for (const k in a) o[k] = Array.isArray(a[k]) ? mixc(a[k], b[k], t) : lerp(a[k], b[k], t);
    return o;
  }
  function shapeH(shape, x) {
    switch (shape) {
      case 'mountain': {
        const r = 1 - Math.abs(2 * fbm(x * 0.0026 + 3.1, 4) - 1);
        const env = 0.35 + 0.65 * vnoise(x * 0.0009 + 5);
        return clamp(0.05 + Math.pow(r, 3) * env * 1.1, 0.03, 1);
      }
      case 'hills': return 0.12 + 0.48 * fbm(x * 0.0016 + 1.7, 2);
      case 'dunes': {
        const w = 0.5 + 0.5 * Math.sin(x * 0.0045 + 4 * vnoise(x * 0.0011));
        return 0.1 + 0.34 * w * (0.55 + 0.45 * vnoise(x * 0.0023 + 9));
      }
      case 'mesa': {
        const n = fbm(x * 0.0018 + 21, 3);
        return 0.08 + 0.5 * smooth(0.46, 0.5, n) + 0.24 * smooth(0.6, 0.62, n);
      }
      default: return 0.03; // deniz
    }
  }

  /* ---------- Çizim yardımcıları ---------- */
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.fill(); }
  function ellipse(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); ctx.fill(); }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function line(ctx, pts, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.stroke();
  }
  // İki kemikli ters kinematik: kalça/omuz → ayak/el, dirsek/diz konumu döner
  function ik(hx, hy, fx, fy, l1, l2, dir) {
    const dx = fx - hx, dy = fy - hy;
    const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
    const a = Math.atan2(dy, dx);
    const c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * Math.max(d, 0.01)), -1, 1);
    const ang = a - dir * Math.acos(c);
    return [hx + Math.cos(ang) * l1, hy + Math.sin(ang) * l1];
  }
  function glow(ctx, x, y, r, col, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, css(col, a)); g.addColorStop(1, css(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  /* ---------- Yolcu ve araçlar ---------- */
  function head(ctx, x, y, k, helmet) {
    if (helmet) {
      ctx.fillStyle = P.hat; circle(ctx, x, y, 8.6 * k);
      ctx.fillStyle = 'rgba(30,40,60,0.85)'; rrect(ctx, x + 1 * k, y - 3 * k, 8 * k, 5 * k, 2.5 * k); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ellipse(ctx, x - 3 * k, y - 4 * k, 3 * k, 2 * k, -0.5);
      return;
    }
    ctx.fillStyle = P.hair; circle(ctx, x - 1.5 * k, y + 0.5 * k, 7.6 * k);
    ctx.fillStyle = P.skin; circle(ctx, x + 0.6 * k, y + 0.8 * k, 7 * k);
    ctx.fillStyle = 'rgba(214,120,110,0.45)'; circle(ctx, x + 4.2 * k, y + 3 * k, 1.6 * k);
    ctx.fillStyle = P.dark; circle(ctx, x + 4.4 * k, y - 0.2 * k, 0.95 * k);
    // kova şapka
    ctx.fillStyle = P.hatDark; ellipse(ctx, x + 0.5 * k, y - 4.2 * k, 10.5 * k, 2.4 * k, -0.06);
    ctx.fillStyle = P.hat; ctx.beginPath();
    ctx.moveTo(x - 6.5 * k, y - 4.5 * k); ctx.quadraticCurveTo(x - 6 * k, y - 12.5 * k, x + 0.5 * k, y - 12.3 * k);
    ctx.quadraticCurveTo(x + 7 * k, y - 12.5 * k, x + 7.2 * k, y - 4.5 * k); ctx.closePath(); ctx.fill();
  }
  function backpack(ctx, sx, sy, k, lean) {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(lean);
    ctx.fillStyle = '#d99a32'; rrect(ctx, -14 * k, 1 * k, 10 * k, 20 * k, 4 * k); ctx.fill();
    ctx.fillStyle = P.pack; rrect(ctx, -13 * k, 0, 10 * k, 18 * k, 4 * k); ctx.fill();
    ctx.fillStyle = '#c9832a'; rrect(ctx, -12 * k, 7 * k, 8 * k, 4 * k, 1.5 * k); ctx.fill();
    ctx.fillStyle = '#7fb3d9'; rrect(ctx, -15 * k, -3 * k, 9 * k, 5 * k, 2.5 * k); ctx.fill(); // uyku tulumu
    ctx.restore();
  }
  function torso(ctx, hx, hy, sx, sy, k) {
    ctx.lineCap = 'round';
    line(ctx, [hx, hy, sx, sy], 12 * k, P.jacket);
    line(ctx, [hx + 1.5 * k, hy - 1 * k, sx + 1.5 * k, sy + 2 * k], 2 * k, 'rgba(255,255,255,0.25)');
  }
  function shoe(ctx, x, y, k) { ctx.fillStyle = P.shoe; ellipse(ctx, x + 2 * k, y - 1.6 * k, 4.6 * k, 2.3 * k); }

  /* ---------- Yükseltme görünümleri ----------
     st.tier: aracın görsel aşaması (0–10). Seviye 10, 25, 50 ve 100'de araç yeni bir parça kazanır, 4. aşamada altın
     süslemeler ve parıltı gelir; 5–6 (Sv. 150, 200) iz ve gökkuşağı kuyruğu (trail), 7 (Sv. 250) altın kelebekler, 8–10
     (Sv. 300, 400, 500) yörüngeler ve huzme (aura). */
  const GOLD = '#e8b93c', GOLD_HI = '#fff1c2';
  // dört köşeli küçük parıltılar (yerleri sabit, ışıkları yanıp söner)
  function sparkles(ctx, cx, cy, k, t, n, w, h) {
    for (let i = 0; i < n; i++) {
      const a = 0.5 + 0.5 * Math.sin(t * 3 + i * 2.1);
      if (a < 0.25) continue;
      const px = cx + (hash(i * 7.3) - 0.5) * w, py = cy + (hash(i * 3.1) - 0.5) * h, r = (1.6 + 1.6 * a) * k;
      ctx.fillStyle = `rgba(255,241,194,${(0.9 * a).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(px, py - r); ctx.quadraticCurveTo(px, py, px + r, py); ctx.quadraticCurveTo(px, py, px, py + r);
      ctx.quadraticCurveTo(px, py, px - r, py); ctx.quadraticCurveTo(px, py, px, py - r); ctx.fill();
    }
  }
  // boyundan geriye savrulan atkı
  function scarf(ctx, nx, ny, k, t) {
    // krem atkı, şapka renginde çizgili: her kıyafetin ceketinden ayrışır
    const w = Math.sin(t * 9) * 2.5 * k;
    ctx.fillStyle = '#f4ead2'; rrect(ctx, nx - 5 * k, ny - 2 * k, 11 * k, 5 * k, 2.5 * k); ctx.fill();
    ctx.strokeStyle = '#f4ead2'; ctx.lineWidth = 4 * k; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(nx - 3 * k, ny + 1 * k);
    ctx.quadraticCurveTo(nx - 11 * k, ny + 2 * k + w, nx - 19 * k, ny + 4 * k - w); ctx.stroke();
    ctx.strokeStyle = P.hat; ctx.lineWidth = 1.3 * k;
    ctx.beginPath(); ctx.moveTo(nx - 2 * k, ny - 2 * k); ctx.lineTo(nx - 2 * k, ny + 3 * k);
    ctx.moveTo(nx - 10 * k, ny + 0.5 * k + w * 0.5); ctx.lineTo(nx - 10 * k, ny + 4.5 * k + w * 0.5);
    ctx.moveTo(nx - 16 * k, ny + 2 * k - w * 0.6); ctx.lineTo(nx - 16 * k, ny + 6 * k - w * 0.6); ctx.stroke();
  }
  // şapkaya takılan tüy (head() ile aynı koordinatlar)
  function feather(ctx, hx, hy, k, t) {
    ctx.save(); ctx.translate(hx - 4 * k, hy - 10 * k); ctx.rotate(-0.9 + Math.sin(t * 4) * 0.08);
    ctx.fillStyle = '#f0b445'; ellipse(ctx, 0, -6 * k, 2.4 * k, 7 * k);
    ctx.strokeStyle = '#a5762a'; ctx.lineWidth = 0.7 * k; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -12 * k); ctx.stroke();
    ctx.restore();
  }
  // direğe bağlı dalgalanan üçgen flama
  function pennant(ctx, x, y, k, t, h, col) {
    ctx.strokeStyle = '#6d5a48'; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    const w = Math.sin(t * 7) * 2 * k;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.quadraticCurveTo(x - 7 * k, y - h + 2 * k + w, x - 14 * k, y - h + 4 * k + w);
    ctx.lineTo(x, y - h + 8 * k); ctx.closePath(); ctx.fill();
  }

  function drawWalker(ctx, x, y, k, st, skate) {
    const ph = st.phase;
    const bob = Math.abs(Math.cos(ph)) * 1.8 * k;
    const lean = skate ? 0.32 : 0.07;
    const hx = x, hy = y - 31 * k - bob;
    const sx = hx + Math.sin(lean) * 25 * k, sy = hy - Math.cos(lean) * 25 * k;
    const L = 16 * k, A = 11.5 * k;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const legs = [], arms = [];
    for (let i = 0; i < 2; i++) {
      const q = ph + i * Math.PI;
      const fx = x + Math.sin(q) * (skate ? 14 : 11) * k;
      const fy = y - Math.max(0, Math.cos(q)) * (skate ? 3 : 6.5) * k;
      legs.push([fx, fy, ...ik(hx, hy, fx, fy, L, L, 1)]);
      const hxp = sx - Math.sin(q) * (skate ? 15 : 9) * k, hyp = sy + 21 * k - (skate ? Math.abs(Math.sin(q)) * 5 * k : 0);
      arms.push([hxp, hyp, ...ik(sx, sy + 2 * k, hxp, hyp, A, A, -1)]);
    }
    const drawLeg = (l, back) => {
      line(ctx, [hx, hy, l[2], l[3], l[0], l[1]], 7 * k, back ? P.pantsDark : P.pants);
      if (skate) {
        ctx.fillStyle = back ? '#b84a5a' : '#e05a6c'; rrect(ctx, l[0] - 4 * k, l[1] - 7 * k, 10 * k, 6 * k, 2 * k); ctx.fill();
        ctx.fillStyle = P.dark; rrect(ctx, l[0] - 4.5 * k, l[1] - 2 * k, 11 * k, 1.6 * k, 0.8 * k); ctx.fill();
        ctx.fillStyle = '#ffd56b'; for (let w = 0; w < 3; w++) circle(ctx, l[0] - 2.5 * k + w * 3.8 * k, l[1] + 0.6 * k, 1.7 * k);
      } else shoe(ctx, l[0], l[1], k);
    };
    const drawArm = (a, back) => {
      line(ctx, [sx, sy + 2 * k, a[2], a[3], a[0], a[1]], 5.6 * k, back ? P.jacketDark : P.jacket);
      ctx.fillStyle = P.skin; circle(ctx, a[0], a[1], 2.6 * k);
    };
    const T = st.tier || 0;
    drawLeg(legs[1], true); drawArm(arms[0], true);
    backpack(ctx, sx, sy, k, lean);
    torso(ctx, hx, hy, sx, sy, k);
    if (T >= 2) scarf(ctx, sx + 2 * k, sy + 1 * k, k, st.t);
    head(ctx, sx + 3 * k, sy - 9 * k, k);
    if (T >= 3) feather(ctx, sx + 3 * k, sy - 9 * k, k, st.t);
    drawLeg(legs[0], false); drawArm(arms[1], false);
    if (T >= 1 && !skate) { // yürüyüş sopası
      const a = arms[1];
      line(ctx, [a[0], a[1] - 3 * k, a[0] + 5 * k, y], 1.8 * k, T >= 4 ? GOLD : '#6d5a48');
      ctx.fillStyle = P.dark; circle(ctx, a[0] - 0.3 * k, a[1] - 3.5 * k, 1.4 * k);
    }
    if (T >= 1 && skate) for (const l of legs) { // dizlik
      ctx.fillStyle = T >= 4 ? GOLD : P.hat; rrect(ctx, l[2] - 3 * k, l[3] - 3 * k, 6.5 * k, 6 * k, 2.4 * k); ctx.fill();
    }
    if (T >= 4) {
      if (skate) { ctx.globalCompositeOperation = 'lighter'; for (const l of legs) glow(ctx, l[0] + 1 * k, l[1], 10 * k, hex('#ffd56b'), 0.5); ctx.globalCompositeOperation = 'source-over'; }
      sparkles(ctx, x - 6 * k, y - 26 * k, k, st.t, 6, 46 * k, 56 * k);
    }
  }

  function wheel(ctx, x, y, r, ang, k, tire, rim) {
    ctx.strokeStyle = tire || P.dark; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rim || '#9aa3b5'; ctx.lineWidth = 1 * k;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = ang + i * Math.PI / 4;
      ctx.moveTo(x + Math.cos(a) * (r - 1.5 * k), y + Math.sin(a) * (r - 1.5 * k));
      ctx.lineTo(x - Math.cos(a) * (r - 1.5 * k), y - Math.sin(a) * (r - 1.5 * k));
    }
    ctx.stroke();
    ctx.fillStyle = '#c7ccd8'; circle(ctx, x, y, 2 * k);
  }

  // Bisiklet: pedallar aynakol dişlisine bağlı krank kollarında döner, zincir arka göbeğe uzanır;
  // binicinin omuzları ve başı her pedal vuruşunda hafifçe sallanır.
  function drawBike(ctx, x, y, k, st) {
    const r = 14 * k, wy = y - r;
    const rx = x - 22 * k, fx = x + 22 * k;
    const bb = [x - 2 * k, y - 12 * k], seat = [x - 8 * k, y - 35 * k], headT = [x + 14 * k, y - 33 * k], bar = [x + 15 * k, y - 40 * k];
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const T = st.tier || 0, frame = T >= 4 ? GOLD : P.teal, rim = T >= 2 ? '#ffd56b' : undefined, metal = T >= 4 ? GOLD : '#4a5060';
    // binici: kalça eyerde sabit, omuzlar pedal vuruşuyla (turda iki kez) hafifçe iner, yana salınır
    const push = Math.abs(Math.sin(st.phase)), sway = Math.sin(st.phase) * 0.9 * k;
    const hip = [x - 8 * k, y - 39 * k], sh = [x + 6 * k + sway, y - 62 * k + push * 1.2 * k];
    const cr = 6.5 * k;
    const pedal = q => [bb[0] + Math.cos(q) * cr, bb[1] + Math.sin(q) * cr];
    const p1 = pedal(st.phase), p2 = pedal(st.phase + Math.PI);
    // pedal: krank ucunda yatay duran küçük blok (ayakkabının altında)
    const pedalBlock = p => { ctx.fillStyle = '#2b2f3a'; rrect(ctx, p[0] - 3.4 * k, p[1] - 0.9 * k, 6.8 * k, 1.9 * k, 0.9 * k); ctx.fill(); };
    // uzak taraftaki krank ve bacak çerçevenin arkasında kalır
    line(ctx, [bb[0], bb[1], p2[0], p2[1]], 2 * k, '#3a3f4c'); pedalBlock(p2);
    const kn2 = ik(hip[0], hip[1], p2[0], p2[1], 16 * k, 16 * k, 1);
    line(ctx, [hip[0], hip[1], kn2[0], kn2[1], p2[0], p2[1]], 7 * k, P.pantsDark); shoe(ctx, p2[0] - 2 * k, p2[1] + 1 * k, k);
    if (T >= 1) pennant(ctx, rx - 6 * k, wy - 4 * k, k, st.t, 46 * k, P.hat);
    wheel(ctx, rx, wy, r, st.wheel, k, undefined, rim); wheel(ctx, fx, wy, r, st.wheel, k, undefined, rim);
    if (T >= 3) { // heybe
      ctx.fillStyle = '#b5532f'; rrect(ctx, rx - 9 * k, wy - 15 * k, 15 * k, 12 * k, 3 * k); ctx.fill();
      ctx.fillStyle = '#8e3f22'; rrect(ctx, rx - 9 * k, wy - 15 * k, 15 * k, 4 * k, 2 * k); ctx.fill();
    }
    line(ctx, [rx, wy, bb[0], bb[1], headT[0], headT[1], seat[0], seat[1], rx, wy], 3 * k, frame);
    line(ctx, [seat[0], seat[1], bb[0], bb[1]], 3 * k, frame);
    line(ctx, [headT[0], headT[1], fx, wy], 3 * k, frame);
    // zincir (aynakoldan arka göbeğe iki kol) ve dişli: dişler pedalla birlikte döner
    const ring = 4.6 * k;
    ctx.strokeStyle = 'rgba(58,63,76,0.85)'; ctx.lineWidth = 1.1 * k; ctx.beginPath();
    ctx.moveTo(bb[0], bb[1] - ring); ctx.lineTo(rx, wy - 2.2 * k); ctx.moveTo(bb[0], bb[1] + ring); ctx.lineTo(rx, wy + 2.2 * k); ctx.stroke();
    ctx.fillStyle = metal; circle(ctx, bb[0], bb[1], ring);
    ctx.fillStyle = T >= 4 ? GOLD_HI : '#9aa1b2';
    for (let i = 0; i < 8; i++) { const a = st.phase + i * Math.PI / 4; circle(ctx, bb[0] + Math.cos(a) * ring, bb[1] + Math.sin(a) * ring, 0.8 * k); }
    ctx.fillStyle = '#2b2f3a'; circle(ctx, bb[0], bb[1], 1.6 * k);
    line(ctx, [headT[0], headT[1], bar[0], bar[1], bar[0] + 5 * k, bar[1] + 1 * k], 2.4 * k, P.dark);
    ctx.fillStyle = P.dark; rrect(ctx, seat[0] - 6 * k, seat[1] - 3 * k, 11 * k, 3.6 * k, 1.8 * k); ctx.fill();
    // basket
    ctx.fillStyle = '#c99a5b'; rrect(ctx, fx - 4 * k, y - 46 * k, 12 * k, 8 * k, 2 * k); ctx.fill();
    const fb = Math.sin(st.phase * 2) * 0.7 * k;
    ctx.fillStyle = '#ff9fb4'; circle(ctx, fx + fb, y - 47 * k - push * 0.6 * k, 2.4 * k); ctx.fillStyle = '#ffd25e'; circle(ctx, fx + 4 * k - fb, y - 48 * k - (1 - push) * 0.6 * k, 2.2 * k);
    backpack(ctx, sh[0], sh[1], k, 0.5);
    torso(ctx, hip[0], hip[1], sh[0], sh[1], k);
    head(ctx, sh[0] + 5 * k, sh[1] - 8 * k, k);
    line(ctx, [bb[0], bb[1], p1[0], p1[1]], 2.4 * k, metal); pedalBlock(p1);
    const kn1 = ik(hip[0], hip[1], p1[0], p1[1], 16 * k, 16 * k, 1);
    line(ctx, [hip[0], hip[1], kn1[0], kn1[1], p1[0], p1[1]], 7 * k, P.pants); shoe(ctx, p1[0] - 2 * k, p1[1] + 1 * k, k);
    const el = ik(sh[0], sh[1] + 2 * k, bar[0] + 3 * k, bar[1], 11 * k, 11 * k, -1);
    line(ctx, [sh[0], sh[1] + 2 * k, el[0], el[1], bar[0] + 3 * k, bar[1]], 5.6 * k, P.jacket);
    ctx.fillStyle = P.skin; circle(ctx, bar[0] + 3 * k, bar[1], 2.6 * k);
    if (T >= 4) sparkles(ctx, x, y - 30 * k, k, st.t, 7, 70 * k, 56 * k);
  }

  function drawMoto(ctx, x, y, k, st) {
    const r = 15 * k, wy = y - r, rx = x - 27 * k, fx = x + 27 * k;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    line(ctx, [x - 16 * k, y - 15 * k, x - 36 * k, y - 18 * k], 4 * k, '#8e95a6'); // egzoz
    const T = st.tier || 0, mrim = T >= 4 ? GOLD : '#6d7486';
    if (T >= 3) { // arka çanta kutusu
      ctx.fillStyle = '#3b4252'; rrect(ctx, x - 40 * k, y - 46 * k, 15 * k, 12 * k, 3 * k); ctx.fill();
      ctx.fillStyle = P.hat; ctx.fillRect(x - 40 * k, y - 41 * k, 15 * k, 2 * k);
    }
    wheel(ctx, rx, wy, r, st.wheel, k, '#22262f', mrim); wheel(ctx, fx, wy, r, st.wheel, k, '#22262f', mrim);
    line(ctx, [fx, wy, x + 18 * k, y - 44 * k], 3.4 * k, '#8e95a6');
    ctx.fillStyle = '#596173'; rrect(ctx, x - 12 * k, y - 26 * k, 20 * k, 13 * k, 3 * k); ctx.fill();
    ctx.fillStyle = P.jacket; ctx.beginPath();
    ctx.moveTo(x - 28 * k, y - 30 * k); ctx.quadraticCurveTo(x - 10 * k, y - 36 * k, x + 4 * k, y - 38 * k);
    ctx.quadraticCurveTo(x + 18 * k, y - 40 * k, x + 22 * k, y - 30 * k); ctx.lineTo(x + 10 * k, y - 24 * k);
    ctx.lineTo(x - 24 * k, y - 24 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ellipse(ctx, x + 6 * k, y - 34 * k, 8 * k, 2 * k, -0.15);
    if (T >= 2) { ctx.fillStyle = T >= 4 ? GOLD_HI : '#fbf4e6'; ctx.beginPath(); ctx.moveTo(x - 20 * k, y - 29 * k); ctx.lineTo(x + 14 * k, y - 37 * k); ctx.lineTo(x + 16 * k, y - 34 * k); ctx.lineTo(x - 18 * k, y - 26 * k); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = P.dark; rrect(ctx, x - 24 * k, y - 36 * k, 20 * k, 5 * k, 2.5 * k); ctx.fill();
    ctx.fillStyle = '#fff3c4'; circle(ctx, x + 22 * k, y - 34 * k, 3.2 * k);
    const hip = [x - 12 * k, y - 38 * k], sh = [x - 2 * k, y - 60 * k], foot = [x - 2 * k, y - 18 * k];
    backpack(ctx, sh[0], sh[1], k, 0.42);
    const kn = ik(hip[0], hip[1], foot[0], foot[1], 15 * k, 15 * k, 1);
    torso(ctx, hip[0], hip[1], sh[0], sh[1], k);
    line(ctx, [hip[0], hip[1], kn[0], kn[1], foot[0], foot[1]], 7.4 * k, P.pants); shoe(ctx, foot[0], foot[1] + 2 * k, k);
    head(ctx, sh[0] + 4 * k, sh[1] - 9 * k, k, true);
    const hand = [x + 15 * k, y - 45 * k];
    const el = ik(sh[0], sh[1] + 2 * k, hand[0], hand[1], 12 * k, 12 * k, -1);
    line(ctx, [sh[0], sh[1] + 2 * k, el[0], el[1], hand[0], hand[1]], 5.6 * k, P.jacket);
    ctx.fillStyle = P.dark; circle(ctx, hand[0], hand[1], 2.8 * k);
    if (T >= 1) { // rüzgâr camı
      ctx.fillStyle = 'rgba(190,225,245,0.55)'; ctx.beginPath(); ctx.moveTo(x + 16 * k, y - 42 * k);
      ctx.quadraticCurveTo(x + 18 * k, y - 54 * k, x + 24 * k, y - 56 * k); ctx.lineTo(x + 22 * k, y - 42 * k); ctx.closePath(); ctx.fill();
    }
    if (T >= 4) sparkles(ctx, x, y - 32 * k, k, st.t, 7, 80 * k, 50 * k);
  }

  function drawCar(ctx, x, y, k, st) {
    const bounce = Math.sin(st.t * 9) * 0.6 * k;
    const by = y - 10 * k + bounce;
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#e9e1d2'; ctx.beginPath(); // tavan
    ctx.moveTo(x - 32 * k, by - 22 * k); ctx.quadraticCurveTo(x - 28 * k, by - 44 * k, x - 6 * k, by - 44 * k);
    ctx.lineTo(x + 8 * k, by - 44 * k); ctx.quadraticCurveTo(x + 20 * k, by - 43 * k, x + 28 * k, by - 22 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = st.night > 0.5 ? '#3d4a6b' : P.glass;
    ctx.beginPath(); ctx.moveTo(x - 27 * k, by - 23 * k); ctx.quadraticCurveTo(x - 24 * k, by - 39 * k, x - 7 * k, by - 39 * k);
    ctx.lineTo(x - 7 * k, by - 23 * k); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 3 * k, by - 23 * k); ctx.lineTo(x - 3 * k, by - 39 * k); ctx.lineTo(x + 7 * k, by - 39 * k);
    ctx.quadraticCurveTo(x + 17 * k, by - 38 * k, x + 22 * k, by - 23 * k); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(x - 3 * k, by - 40 * k, 30 * k, 18 * k); ctx.clip();
    head(ctx, x + 5 * k, by - 28 * k, k * 0.95); ctx.restore();
    if (st.pal) petHead(ctx, st.palKind, x - 17 * k, by - 28 * k, k * 0.95, st.t, st.pal - 1); // arka camdan Karabaş
    const T = st.tier || 0;
    ctx.fillStyle = P.jacket; rrect(ctx, x - 46 * k, by - 25 * k, 92 * k, 21 * k, 9 * k); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; rrect(ctx, x - 40 * k, by - 22 * k, 80 * k, 3 * k, 1.5 * k); ctx.fill();
    if (T >= 1) { ctx.fillStyle = T >= 4 ? GOLD : '#fbf4e6'; ctx.fillRect(x - 42 * k, by - 17 * k, 84 * k, 2.4 * k); ctx.fillRect(x - 42 * k, by - 13.5 * k, 84 * k, 1.2 * k); } // yarış şeridi
    ctx.fillStyle = P.jacketDark; rrect(ctx, x - 46 * k, by - 10 * k, 92 * k, 6 * k, 3 * k); ctx.fill();
    ctx.fillStyle = '#fff3c4'; ellipse(ctx, x + 43 * k, by - 17 * k, 3 * k, 3.6 * k);
    ctx.fillStyle = '#ff6b6b'; ellipse(ctx, x - 44 * k, by - 18 * k, 2 * k, 3 * k);
    ctx.fillStyle = P.dark; rrect(ctx, x - 6 * k, by - 18 * k, 7 * k, 2 * k, 1 * k); ctx.fill();
    // portbagaj ve valiz
    ctx.fillStyle = '#7a5a43'; rrect(ctx, x - 22 * k, by - 50 * k, 26 * k, 7 * k, 2 * k); ctx.fill();
    ctx.fillStyle = P.pack; rrect(ctx, x - 20 * k, by - 55 * k, 20 * k, 6 * k, 2 * k); ctx.fill();
    if (T >= 3) { // portbagajda sörf tahtası
      ctx.fillStyle = '#6fd3c1'; ellipse(ctx, x - 8 * k, by - 58 * k, 30 * k, 3 * k, -0.02);
      ctx.fillStyle = '#fbf4e6'; ctx.fillRect(x - 10 * k, by - 61 * k, 3 * k, 6 * k);
    }
    const crim = T >= 2 ? GOLD : '#c7ccd8';
    wheel(ctx, x - 28 * k, y - 11 * k, 11 * k, st.wheel, k, '#22262f', crim);
    wheel(ctx, x + 28 * k, y - 11 * k, 11 * k, st.wheel, k, '#22262f', crim);
    if (T >= 4) sparkles(ctx, x, by - 28 * k, k, st.t, 8, 100 * k, 50 * k);
  }

  function drawTrain(ctx, x, y, k, st) {
    const top = y - 58 * k, bot = y - 9 * k;
    const lit = st.night > 0.35;
    const winCol = lit ? '#ffe7a8' : '#b8dcee';
    // vagonlar (sola doğru); 3. aşamada dördüncü vagon eklenir. st.cars: vagon sayısını sabitler (sahnedeki diğer gezginlerin kısa treni)
    const T = st.tier || 0, band = T >= 2 ? GOLD : P.teal;
    const cars = st.cars !== undefined ? st.cars : T >= 3 ? 4 : 3;
    for (let c = 0; c < cars; c++) {
      const x1 = x - 52 * k - (c + 1) * 96 * k, x2 = x1 + 92 * k;
      ctx.fillStyle = '#e9e1d2'; rrect(ctx, x1, top + 4 * k, x2 - x1, bot - top - 4 * k, 7 * k); ctx.fill();
      ctx.fillStyle = band; ctx.fillRect(x1, bot - 16 * k, x2 - x1, 7 * k);
      ctx.fillStyle = winCol;
      for (let w = 0; w < 4; w++) { rrect(ctx, x1 + 8 * k + w * 21 * k, top + 13 * k, 14 * k, 14 * k, 3 * k); ctx.fill(); }
      ctx.fillStyle = '#3a3f4d'; ctx.fillRect(x2, bot - 14 * k, 4 * k, 4 * k);
      for (const wx of [x1 + 14 * k, x1 + 28 * k, x2 - 28 * k, x2 - 14 * k]) wheel(ctx, wx, bot + 2 * k, 6 * k, st.wheel, k * 0.7, '#2b2f3a', '#6d7486');
    }
    // lokomotif
    ctx.fillStyle = P.teal; ctx.beginPath();
    ctx.moveTo(x - 50 * k, top); ctx.lineTo(x + 24 * k, top);
    ctx.quadraticCurveTo(x + 52 * k, top + 4 * k, x + 58 * k, bot - 6 * k);
    ctx.lineTo(x + 58 * k, bot); ctx.lineTo(x - 50 * k, bot); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e9e1d2'; ctx.fillRect(x - 50 * k, bot - 17 * k, 106 * k, 6 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x - 50 * k, top + 4 * k, 80 * k, 3 * k);
    ctx.fillStyle = lit ? '#ffe7a8' : P.glass; ctx.beginPath();
    ctx.moveTo(x + 22 * k, top + 9 * k); ctx.quadraticCurveTo(x + 40 * k, top + 11 * k, x + 46 * k, top + 26 * k);
    ctx.lineTo(x + 22 * k, top + 26 * k); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(x + 20 * k, top + 8 * k, 30 * k, 18 * k); ctx.clip();
    head(ctx, x + 30 * k, top + 22 * k, k * 0.9); ctx.restore();
    ctx.fillStyle = winCol;
    for (let w = 0; w < 3; w++) { rrect(ctx, x - 44 * k + w * 20 * k, top + 10 * k, 13 * k, 13 * k, 3 * k); ctx.fill(); }
    if (st.pal) { ctx.save(); ctx.beginPath(); ctx.rect(x - 4 * k, top + 10 * k, 13 * k, 13 * k); ctx.clip(); petHead(ctx, st.palKind, x + 1 * k, top + 18 * k, k * 0.8, st.t, st.pal - 1); ctx.restore(); }
    ctx.fillStyle = '#fff3c4'; circle(ctx, x + 54 * k, bot - 10 * k, 2.8 * k);
    for (const wx of [x - 36 * k, x - 20 * k, x + 22 * k, x + 38 * k]) wheel(ctx, wx, bot + 2 * k, 6.5 * k, st.wheel, k * 0.7, '#2b2f3a', T >= 4 ? GOLD : '#6d7486');
    if (T >= 1) pennant(ctx, x - 40 * k, top, k, st.t, 18 * k, P.hat); // lokomotifte bayrak
    if (T >= 4) { ctx.fillStyle = GOLD; ctx.fillRect(x - 50 * k, bot - 17 * k, 106 * k, 2 * k); sparkles(ctx, x, top + 20 * k, k, st.t, 8, 110 * k, 40 * k); }
  }

  function drawPlane(ctx, x, y, k, st) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(st.t * 0.9) * 0.03 - 0.02);
    const T = st.tier || 0;
    if (T >= 3) { // kuyruktan sarkan pankart
      const w = Math.sin(st.t * 6) * 2 * k;
      ctx.strokeStyle = 'rgba(80,80,90,0.7)'; ctx.lineWidth = 0.8 * k; ctx.beginPath(); ctx.moveTo(-52 * k, -2 * k); ctx.lineTo(-70 * k, 2 * k + w); ctx.stroke();
      ctx.fillStyle = '#fbf4e6'; ctx.beginPath(); ctx.moveTo(-70 * k, -4 * k + w); ctx.lineTo(-120 * k, -3 * k - w); ctx.lineTo(-120 * k, 7 * k - w); ctx.lineTo(-70 * k, 8 * k + w); ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.jacket; ctx.font = `800 ${Math.round(7 * k)}px "Baloo 2", system-ui, sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('IDLE TRAVELER', -95 * k, 4.5 * k); ctx.textAlign = 'left';
    }
    ctx.fillStyle = '#c9c2b4'; ellipse(ctx, -2 * k, 7 * k, 30 * k, 5 * k, 0.05); // arka kanat
    ctx.fillStyle = P.cream; ctx.beginPath();
    ctx.moveTo(-50 * k, -4 * k); ctx.quadraticCurveTo(-30 * k, -14 * k, 10 * k, -13 * k);
    ctx.quadraticCurveTo(40 * k, -12 * k, 46 * k, 0); ctx.quadraticCurveTo(40 * k, 12 * k, 10 * k, 12 * k);
    ctx.quadraticCurveTo(-30 * k, 10 * k, -50 * k, 2 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.jacket; ctx.beginPath(); // kuyruk
    ctx.moveTo(-50 * k, -3 * k); ctx.lineTo(-56 * k, -26 * k); ctx.lineTo(-44 * k, -26 * k); ctx.lineTo(-30 * k, -8 * k); ctx.closePath(); ctx.fill();
    ctx.fillRect(-46 * k, 0, 86 * k, 3.5 * k);
    if (T >= 1) { ctx.fillStyle = T >= 4 ? GOLD : '#fbf4e6'; ctx.beginPath(); ctx.moveTo(-54 * k, -19 * k); ctx.lineTo(-45 * k, -19 * k); ctx.lineTo(-42 * k, -15 * k); ctx.lineTo(-53 * k, -15 * k); ctx.closePath(); ctx.fill(); }
    if (T >= 4) { ctx.fillStyle = GOLD; ctx.fillRect(-46 * k, 3.5 * k, 86 * k, 1.5 * k); }
    ctx.fillStyle = st.night > 0.5 ? '#ffe7a8' : P.glass;
    for (let w = 0; w < 4; w++) circle(ctx, -24 * k + w * 9 * k, -4 * k, 2.6 * k);
    ctx.fillStyle = P.glass; ctx.beginPath(); ctx.moveTo(18 * k, -12 * k); ctx.quadraticCurveTo(32 * k, -11 * k, 38 * k, -4 * k);
    ctx.lineTo(20 * k, -4 * k); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(16 * k, -14 * k, 24 * k, 10 * k); ctx.clip(); head(ctx, 26 * k, -6 * k, k * 0.7); ctx.restore();
    ctx.fillStyle = '#e2d9c8'; ellipse(ctx, 2 * k, 5 * k, 26 * k, 4.5 * k, 0.12); // ön kanat
    if (T >= 2) { ctx.fillStyle = T >= 4 ? GOLD : P.jacket; ctx.beginPath(); ctx.moveTo(-24 * k, 1 * k); ctx.lineTo(-27 * k, -6 * k); ctx.lineTo(-22 * k, 0); ctx.closePath(); ctx.fill(); } // kanatçık
    ctx.fillStyle = P.jacket; ellipse(ctx, 24 * k, 5 * k, 4 * k, 3 * k, 0.12);
    ctx.fillStyle = P.dark; circle(ctx, 46 * k, 0, 3 * k);
    ctx.fillStyle = 'rgba(60,66,82,0.35)'; ellipse(ctx, 48 * k, 0, 2.2 * k, 17 * k * (0.75 + 0.25 * Math.sin(st.t * 60)));
    if (T >= 4) sparkles(ctx, 0, 0, k, st.t, 8, 100 * k, 34 * k);
    ctx.restore();
  }

  function drawRocket(ctx, x, y, k, st) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.08 + Math.sin(st.t * 1.2) * 0.02);
    const fl = 24 + 10 * Math.sin(st.t * 31) + 6 * Math.sin(st.t * 17);
    const g = ctx.createLinearGradient(-40 * k, 0, (-40 - fl * 1.6) * k, 0);
    g.addColorStop(0, 'rgba(255,245,200,0.95)'); g.addColorStop(0.35, 'rgba(255,170,80,0.85)'); g.addColorStop(1, 'rgba(255,90,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-38 * k, -9 * k);
    ctx.quadraticCurveTo((-40 - fl) * k, -6 * k, (-40 - fl * 1.6) * k, 0); ctx.quadraticCurveTo((-40 - fl) * k, 6 * k, -38 * k, 9 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.jacket; ctx.beginPath(); // kanatçıklar
    ctx.moveTo(-26 * k, -12 * k); ctx.lineTo(-42 * k, -26 * k); ctx.lineTo(-38 * k, -11 * k); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-26 * k, 12 * k); ctx.lineTo(-42 * k, 26 * k); ctx.lineTo(-38 * k, 11 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.cream; rrect(ctx, -40 * k, -13 * k, 62 * k, 26 * k, 12 * k); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; rrect(ctx, -40 * k, 3 * k, 62 * k, 10 * k, 5 * k); ctx.fill();
    ctx.fillStyle = P.jacket; ctx.beginPath(); ctx.moveTo(18 * k, -13 * k); ctx.quadraticCurveTo(46 * k, -8 * k, 52 * k, 0);
    ctx.quadraticCurveTo(46 * k, 8 * k, 18 * k, 13 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.steel; circle(ctx, 2 * k, -1 * k, 8 * k);
    ctx.fillStyle = '#2b3550'; circle(ctx, 2 * k, -1 * k, 6.2 * k);
    ctx.save(); ctx.beginPath(); ctx.arc(2 * k, -1 * k, 6.2 * k, 0, TAU); ctx.clip(); head(ctx, 2 * k, 2 * k, k * 0.62); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ellipse(ctx, -1 * k, -4 * k, 2.4 * k, 1.4 * k, -0.6);
    ctx.fillStyle = P.teal; ctx.fillRect(-30 * k, -13 * k, 4 * k, 26 * k);
    const T = st.tier || 0;
    if (T >= 1) { ctx.fillStyle = T >= 4 ? GOLD : P.jacket; ctx.fillRect(-18 * k, -13 * k, 3 * k, 26 * k); ctx.fillRect(-12 * k, -13 * k, 1.5 * k, 26 * k); } // gövde şeritleri
    if (T >= 2) for (const sy of [-16, 16]) { // yan iticiler
      ctx.fillStyle = '#d9d2c4'; rrect(ctx, -36 * k, sy * k - 3.5 * k, 26 * k, 7 * k, 3.5 * k); ctx.fill();
      ctx.fillStyle = T >= 4 ? GOLD : P.jacket; ctx.beginPath(); ctx.moveTo(-10 * k, sy * k - 3.5 * k); ctx.lineTo(-3 * k, sy * k); ctx.lineTo(-10 * k, sy * k + 3.5 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,110,0.85)'; ellipse(ctx, -40 * k, sy * k, (5 + 2 * Math.sin(st.t * 29 + sy)) * k, 2.4 * k);
    }
    if (T >= 3) { // burunda anten
      ctx.strokeStyle = '#8e95a6'; ctx.lineWidth = 1 * k; ctx.beginPath(); ctx.moveTo(44 * k, -4 * k); ctx.lineTo(50 * k, -16 * k); ctx.stroke();
      ctx.fillStyle = (Math.sin(st.t * 6) > 0) ? '#ff6b6b' : '#ffd56b'; circle(ctx, 50 * k, -16 * k, 1.8 * k);
    }
    if (T >= 4) sparkles(ctx, 0, 0, k, st.t, 8, 100 * k, 44 * k);
    ctx.restore();
  }

  function drawSail(ctx, x, y, k, st) {
    ctx.save(); ctx.translate(x, y);
    const sway = Math.sin(st.t * 0.6) * 0.05;
    const s = 62 * k;
    ctx.save(); ctx.translate(-30 * k, -10 * k); ctx.rotate(-0.25 + sway);
    const g = ctx.createLinearGradient(-s, -s, s, s);
    const sh = (Math.sin(st.t * 0.8) + 1) / 2;
    g.addColorStop(0, 'rgba(255,214,140,0.95)'); g.addColorStop(0.3 + sh * 0.4, 'rgba(255,250,235,0.95)'); g.addColorStop(1, 'rgba(176,196,255,0.9)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-s, -s); ctx.lineTo(s, -s * 0.9); ctx.lineTo(s * 0.9, s); ctx.lineTo(-s * 0.95, s * 0.95); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1 * k;
    ctx.beginPath(); ctx.moveTo(-s, -s); ctx.lineTo(s * 0.9, s); ctx.moveTo(s, -s * 0.9); ctx.lineTo(-s * 0.95, s * 0.95); ctx.stroke();
    const T = st.tier || 0;
    if (T >= 2) { // gökkuşağı yanardöner kenar
      ctx.strokeStyle = `hsla(${(st.t * 40) % 360},85%,70%,0.7)`; ctx.lineWidth = 2.4 * k;
      ctx.beginPath(); ctx.moveTo(-s, -s); ctx.lineTo(s, -s * 0.9); ctx.lineTo(s * 0.9, s); ctx.lineTo(-s * 0.95, s * 0.95); ctx.closePath(); ctx.stroke();
    }
    if (T >= 1) { // yelkende yıldız arması
      ctx.fillStyle = T >= 4 ? GOLD : 'rgba(231,105,78,0.85)'; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const r = (i % 2 ? 6 : 14) * k, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    if (T >= 3) { // önde küçük ikinci yelken
      ctx.save(); ctx.translate(58 * k, -16 * k); ctx.rotate(-0.25 + sway * 1.4);
      ctx.fillStyle = 'rgba(255,236,200,0.85)'; ctx.beginPath(); ctx.moveTo(-14 * k, -14 * k); ctx.lineTo(14 * k, -12 * k); ctx.lineTo(12 * k, 14 * k); ctx.lineTo(-13 * k, 13 * k); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(230,236,255,0.55)'; ctx.lineWidth = 0.8 * k; ctx.beginPath(); ctx.moveTo(40 * k, 0); ctx.lineTo(48 * k, -4 * k); ctx.stroke();
    }
    // halatlar: yelkenin köşelerinden kapsüle
    const a = -0.25 + sway, ca = Math.cos(a), sa = Math.sin(a);
    ctx.strokeStyle = 'rgba(230,236,255,0.55)'; ctx.lineWidth = 0.8 * k; ctx.beginPath();
    for (const [cx, cy] of [[-s, -s], [s, -s * 0.9], [s * 0.9, s], [-s * 0.95, s * 0.95]]) {
      ctx.moveTo(4 * k, 0); ctx.lineTo(-30 * k + ca * cx - sa * cy, -10 * k + sa * cx + ca * cy);
    }
    ctx.stroke();
    ctx.fillStyle = P.cream; rrect(ctx, 0, -10 * k, 34 * k, 20 * k, 10 * k); ctx.fill();
    ctx.fillStyle = P.jacket; ctx.beginPath(); ctx.moveTo(28 * k, -10 * k); ctx.quadraticCurveTo(44 * k, -4 * k, 46 * k, 0); ctx.quadraticCurveTo(44 * k, 4 * k, 28 * k, 10 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b3550'; circle(ctx, 16 * k, -1 * k, 5.6 * k);
    ctx.save(); ctx.beginPath(); ctx.arc(16 * k, -1 * k, 5.6 * k, 0, TAU); ctx.clip(); head(ctx, 16 * k, 2 * k, k * 0.55); ctx.restore();
    if (T >= 4) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, -30 * k, -10 * k, 80 * k, hex('#ffd56b'), 0.18); ctx.globalCompositeOperation = 'source-over'; sparkles(ctx, -20 * k, -10 * k, k, st.t, 10, 140 * k, 120 * k); }
    ctx.restore();
  }

  // Kuyruklu yıldız: buzlu bir kaya çekirdeğin üstünde ata biner gibi oturan yolcu; arkada ışıktan bir kuyruk.
  // Aşamalar: 1 eyer örtüsü ve dizgin, 2 çekirdekte buz kristalleri, 3 ikinci (toz) kuyruk, 4 altın süsler ve parıltı
  function drawComet(ctx, x, y, k, st) {
    const T = st.tier || 0, t = st.t || 0, L = (st.icon ? 58 : 128) * k, wav = Math.sin(t * 1.6) * 3 * k;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.05 + Math.sin(t * 0.8) * 0.025);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // toz kuyruğu (3. aşama): biraz aşağı kıvrılan sıcak renkli ikinci kuyruk
    if (T >= 3) {
      const g = ctx.createLinearGradient(-4 * k, 0, -L * 0.85, 0);
      g.addColorStop(0, 'rgba(255,228,170,0.75)'); g.addColorStop(1, 'rgba(255,190,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-6 * k, 6 * k);
      ctx.quadraticCurveTo(-L * 0.45, 12 * k, -L * 0.85, 30 * k + wav); ctx.quadraticCurveTo(-L * 0.45, 22 * k, -6 * k, 16 * k); ctx.closePath(); ctx.fill();
    }
    // iyon kuyruğu: çekirdekten geriye açılan, uca doğru solan mavi-beyaz ışık
    const g = ctx.createLinearGradient(-2 * k, 0, -L, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.35, 'rgba(176,212,255,0.55)'); g.addColorStop(1, 'rgba(150,190,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-2 * k, -12 * k);
    ctx.quadraticCurveTo(-L * 0.5, -14 * k - wav, -L, -22 * k + wav); ctx.lineTo(-L, 12 * k + wav);
    ctx.quadraticCurveTo(-L * 0.5, 16 * k + wav * 0.5, -2 * k, 16 * k); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1 * k;
    for (const o of [-6, 2, 9]) { ctx.beginPath(); ctx.moveTo(-8 * k, o * k); ctx.quadraticCurveTo(-L * 0.4, (o * 1.3) * k - wav * 0.6, -L * 0.75, (o * 1.8) * k + wav); ctx.stroke(); }
    // koma: çekirdeğin çevresindeki soluk ışık
    glow(ctx, 2 * k, 8 * k, 50 * k, hex('#d6eaff'), 0.55);
    // çekirdek: girintili buzlu kaya
    ctx.fillStyle = '#8f9cb6'; ctx.beginPath();
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = 1 + 0.1 * Math.sin(i * 2.7) + 0.05 * Math.sin(i * 5.3); ctx.lineTo(2 * k + Math.cos(a) * 29 * k * r, 9 * k + Math.sin(a) * 17 * k * r); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(60,70,100,0.25)'; ellipse(ctx, 4 * k, 16 * k, 24 * k, 8 * k);
    ctx.fillStyle = '#76839f'; circle(ctx, -14 * k, 12 * k, 4 * k); circle(ctx, 16 * k, 14 * k, 3 * k); circle(ctx, 2 * k, 19 * k, 2.2 * k); circle(ctx, -22 * k, 4 * k, 1.8 * k);
    ctx.fillStyle = 'rgba(236,246,255,0.85)'; ellipse(ctx, 6 * k, -3 * k, 16 * k, 3.6 * k, -0.06); // buzlu parlak sırt
    ctx.fillStyle = '#9aa7c0'; ctx.beginPath(); ctx.moveTo(23 * k, -2 * k); ctx.lineTo(32 * k, -10 * k); ctx.lineTo(29 * k, 3 * k); ctx.closePath(); ctx.fill(); // önde dizginin bağlandığı sivri kaya
    if (T >= 2) for (const [cx, cy, r] of [[-16, 5, 2.8], [18, 6, 2.4], [-4, 16, 2], [26, 10, 1.7], [-24, 13, 1.6]]) { // buz kristalleri
      const a = 0.6 + 0.4 * Math.sin(t * 4 + cx), px = cx * k, py = cy * k, rr = r * k * (0.8 + 0.3 * a);
      ctx.fillStyle = `rgba(214,240,255,${a.toFixed(3)})`; ctx.beginPath();
      ctx.moveTo(px, py - rr * 1.6); ctx.lineTo(px + rr, py); ctx.lineTo(px, py + rr * 1.6); ctx.lineTo(px - rr, py); ctx.closePath(); ctx.fill();
    }
    // eyer örtüsü (1. aşama), 4. aşamada altın
    if (T >= 1) {
      ctx.fillStyle = T >= 4 ? GOLD : P.jacket; ctx.beginPath(); ctx.moveTo(-16 * k, -5 * k); ctx.quadraticCurveTo(-2 * k, -11 * k, 12 * k, -5 * k);
      ctx.lineTo(10 * k, 7 * k); ctx.lineTo(-14 * k, 7 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = T >= 4 ? GOLD_HI : P.hat; ctx.fillRect(-14 * k, 4 * k, 24 * k, 1.8 * k);
    }
    // yolcu: kayanın sırtında oturur, öne eğilip dizgini tutar
    const hip = [-2 * k, -9 * k], sh = [5 * k, -30 * k], foot = [5 * k, 9 * k];
    backpack(ctx, sh[0], sh[1], k, 0.32);
    const kn = ik(hip[0], hip[1], foot[0], foot[1], 9 * k, 9 * k, 1);
    torso(ctx, hip[0], hip[1], sh[0], sh[1], k);
    line(ctx, [hip[0], hip[1], kn[0], kn[1], foot[0], foot[1]], 7.4 * k, P.pants); shoe(ctx, foot[0], foot[1] + 2 * k, k);
    scarf(ctx, sh[0] + 1 * k, sh[1] - 1 * k, k, t);
    head(ctx, sh[0] + 4 * k, sh[1] - 9 * k, k);
    const hand = [17 * k, -18 * k];
    const el = ik(sh[0], sh[1] + 2 * k, hand[0], hand[1], 11 * k, 11 * k, -1);
    line(ctx, [sh[0], sh[1] + 2 * k, el[0], el[1], hand[0], hand[1]], 5.6 * k, P.jacket);
    ctx.fillStyle = P.skin; circle(ctx, hand[0], hand[1], 2.6 * k);
    if (T >= 1) { ctx.strokeStyle = T >= 4 ? GOLD : '#c9a46a'; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(hand[0], hand[1]); ctx.quadraticCurveTo(26 * k, -14 * k + wav * 0.3, 30 * k, -8 * k); ctx.stroke(); } // dizgin
    if (T >= 4) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, 0, 60 * k, hex('#ffd56b'), 0.16); ctx.globalCompositeOperation = 'source-over'; sparkles(ctx, -10 * k, -6 * k, k, t, 9, 110 * k, 60 * k); }
    ctx.restore();
  }

  // Yıldız gemisi: yuvarlak burunlu gövde, üstte ve altta pilonlara bağlı iki motor bölmesi, çevresinde ışıklı bükülme halkası.
  // Aşamalar: 1 gövde şeridi ve lomboz ışıkları, 2 ikinci halka, 3 üçüncü halka ve konum ışıkları, 4 altın süsler ve parıltı
  function drawStarship(ctx, x, y, k, st) {
    const T = st.tier || 0, t = st.t || 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.02 + Math.sin(t * 0.7) * 0.02);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // motor bölmelerinden ve gövdeden çıkan mor-mavi plazma
    const fl = (st.icon ? 12 : 26) + 6 * Math.sin(t * 23) + 4 * Math.sin(t * 13);
    const flame = (cy, h, len) => {
      const g = ctx.createLinearGradient(-48 * k, 0, (-48 - len) * k, 0);
      g.addColorStop(0, 'rgba(235,240,255,0.95)'); g.addColorStop(0.4, 'rgba(150,140,255,0.7)'); g.addColorStop(1, 'rgba(110,90,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-46 * k, (cy - h) * k); ctx.quadraticCurveTo((-48 - len * 0.6) * k, (cy - h * 0.6) * k, (-48 - len) * k, cy * k);
      ctx.quadraticCurveTo((-48 - len * 0.6) * k, (cy + h * 0.6) * k, -46 * k, (cy + h) * k); ctx.closePath(); ctx.fill();
    };
    flame(-21, 3, fl * 0.8); flame(21, 3, fl * 0.8); flame(0, 6, fl);
    // bükülme halkaları: arka yarısı gövdenin arkasında, ön yarısı önünde çizilir
    const rings = [-12, ...(T >= 2 ? [-26] : []), ...(T >= 3 ? [2] : [])];
    const ring = (rx, front) => {
      ctx.strokeStyle = `hsla(${(195 + 40 * Math.sin(t * 2 + rx)) | 0},90%,70%,${front ? 0.9 : 0.6})`; ctx.lineWidth = 2.6 * k;
      ctx.beginPath(); ctx.ellipse(rx * k, 0, 7 * k, 32 * k, 0, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : Math.PI * 1.5); ctx.stroke();
    };
    for (const rx of rings) ring(rx, false);
    // pilonlar ve motor bölmeleri
    ctx.strokeStyle = '#9aa1b3'; ctx.lineWidth = 3 * k;
    ctx.beginPath(); ctx.moveTo(-14 * k, -8 * k); ctx.lineTo(-24 * k, -19 * k); ctx.moveTo(-14 * k, 8 * k); ctx.lineTo(-24 * k, 19 * k); ctx.stroke();
    for (const sy of [-24.5, 17.5]) {
      ctx.fillStyle = '#c9ced9'; rrect(ctx, -48 * k, sy * k, 46 * k, 7 * k, 3.5 * k); ctx.fill();
      ctx.fillStyle = `rgba(140,200,255,${(0.7 + 0.3 * Math.sin(t * 5 + sy)).toFixed(3)})`; rrect(ctx, -42 * k, (sy + 2.3) * k, 34 * k, 2.4 * k, 1.2 * k); ctx.fill();
      ctx.fillStyle = T >= 4 ? GOLD : P.jacket; circle(ctx, -3 * k, (sy + 3.5) * k, 3.6 * k);
    }
    // gövde: yuvarlak burunlu kapsül ve arkada motor çanı
    ctx.fillStyle = '#9aa1b3'; ctx.beginPath(); ctx.moveTo(-40 * k, -7 * k); ctx.lineTo(-48 * k, -9 * k); ctx.lineTo(-48 * k, 9 * k); ctx.lineTo(-40 * k, 7 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.cream; ctx.beginPath();
    ctx.moveTo(-40 * k, -10 * k); ctx.lineTo(22 * k, -11 * k); ctx.quadraticCurveTo(52 * k, -10 * k, 54 * k, 0);
    ctx.quadraticCurveTo(52 * k, 10 * k, 22 * k, 11 * k); ctx.lineTo(-40 * k, 10 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath(); ctx.moveTo(-40 * k, 4 * k); ctx.lineTo(30 * k, 4 * k); ctx.quadraticCurveTo(48 * k, 5 * k, 52 * k, 4 * k);
    ctx.quadraticCurveTo(46 * k, 10 * k, 22 * k, 11 * k); ctx.lineTo(-40 * k, 10 * k); ctx.closePath(); ctx.fill();
    if (T >= 1) { // gövde şeridi ve lomboz ışıkları
      ctx.fillStyle = T >= 4 ? GOLD : P.jacket; ctx.fillRect(-40 * k, 0, 76 * k, 2.4 * k);
      for (const px of [-32, -22, 0, 10]) { ctx.fillStyle = '#fff3c4'; circle(ctx, px * k, -4.5 * k, 1.7 * k); }
    }
    for (const rx of rings) ring(rx, true);
    if (T >= 3) { // konum ışıkları
      ctx.fillStyle = Math.sin(t * 5) > 0 ? '#ff6b6b' : '#ffd56b'; circle(ctx, -46 * k, -21 * k, 1.8 * k);
      ctx.fillStyle = '#6fd3c1'; circle(ctx, -46 * k, 21 * k, 1.8 * k);
    }
    // kubbe kokpit
    const dome = () => { ctx.beginPath(); ctx.moveTo(14 * k, -10.5 * k); ctx.quadraticCurveTo(26 * k, -26 * k, 40 * k, -9 * k); ctx.closePath(); };
    ctx.fillStyle = P.glass; dome(); ctx.fill();
    ctx.save(); dome(); ctx.clip(); head(ctx, 26 * k, -10 * k, k * 0.7); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ellipse(ctx, 22 * k, -17 * k, 4 * k, 1.4 * k, -0.5);
    if (T >= 4) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, 0, 70 * k, hex('#ffd56b'), 0.14); ctx.globalCompositeOperation = 'source-over'; sparkles(ctx, 4 * k, 0, k, t, 9, 120 * k, 60 * k); }
    ctx.restore();
  }

  // Binici: hayvanın (ya da kayanın) sırtında oturur, öne eğilip ellerini öne uzatır. hip: kalça, sh: omuz, foot: ayak, hand: el
  function rider(ctx, k, t, hip, sh, foot, hand) {
    backpack(ctx, sh[0], sh[1], k, 0.32);
    const kn = ik(hip[0], hip[1], foot[0], foot[1], 9 * k, 9 * k, 1);
    torso(ctx, hip[0], hip[1], sh[0], sh[1], k);
    line(ctx, [hip[0], hip[1], kn[0], kn[1], foot[0], foot[1]], 7.4 * k, P.pants); shoe(ctx, foot[0], foot[1] + 2 * k, k);
    scarf(ctx, sh[0] + 1 * k, sh[1] - 1 * k, k, t);
    head(ctx, sh[0] + 4 * k, sh[1] - 9 * k, k);
    const el = ik(sh[0], sh[1] + 2 * k, hand[0], hand[1], 11 * k, 11 * k, -1);
    line(ctx, [sh[0], sh[1] + 2 * k, el[0], el[1], hand[0], hand[1]], 5.6 * k, P.jacket);
    ctx.fillStyle = P.skin; circle(ctx, hand[0], hand[1], 2.6 * k);
  }

  // Yıldız Balinası: lacivert, sırtı yıldız benekli kozmik bir balina; kuyruğu yavaşça iner kalkar, yolcu sırtında oturur.
  // Aşamalar: 1 eyer örtüsü, 2 sırttaki delikten yıldız tozu fıskiyesi, 3 yanlarında ışıldayan benek sırası, 4 altın eyer ve parıltı
  function drawWhale(ctx, x, y, k, st) {
    const T = st.tier || 0, t = st.t || 0, bob = Math.sin(t * 1.1) * 2 * k;
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(Math.sin(t * 0.55) * 0.03);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    glow(ctx, 0, 6 * k, 80 * k, hex('#9fb8ff'), 0.28);
    // kuyruk yüzgeci: gövdenin ucunda yavaşça iner kalkar
    ctx.save(); ctx.translate(-64 * k, 1 * k); ctx.rotate(Math.sin(t * 1.4) * 0.32);
    ctx.fillStyle = '#34428c';
    ctx.beginPath(); ctx.moveTo(2 * k, -2 * k); ctx.quadraticCurveTo(-6 * k, -10 * k, -20 * k, -19 * k); ctx.quadraticCurveTo(-15 * k, -6 * k, -6 * k, 1 * k); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(2 * k, 2 * k); ctx.quadraticCurveTo(-6 * k, 9 * k, -19 * k, 14 * k); ctx.quadraticCurveTo(-13 * k, 3 * k, -6 * k, -1 * k); ctx.closePath(); ctx.fill();
    ctx.restore();
    // gövde: sırtı koyu, karnı açık
    const g = ctx.createLinearGradient(0, -26 * k, 0, 24 * k);
    g.addColorStop(0, '#2c3a86'); g.addColorStop(0.55, '#4659b0'); g.addColorStop(1, '#6f84d0');
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(57 * k, 3 * k); ctx.quadraticCurveTo(56 * k, -21 * k, 22 * k, -24 * k); ctx.quadraticCurveTo(-18 * k, -26 * k, -46 * k, -9 * k);
    ctx.quadraticCurveTo(-58 * k, -3 * k, -66 * k, -1 * k); ctx.lineTo(-66 * k, 4 * k); ctx.quadraticCurveTo(-50 * k, 8 * k, -30 * k, 16 * k);
    ctx.quadraticCurveTo(8 * k, 27 * k, 40 * k, 19 * k); ctx.quadraticCurveTo(57 * k, 13 * k, 57 * k, 3 * k); ctx.closePath(); ctx.fill();
    // karın ve oluklar
    ctx.fillStyle = '#d6def7'; ctx.beginPath();
    ctx.moveTo(54 * k, 9 * k); ctx.quadraticCurveTo(46 * k, 19 * k, 30 * k, 21 * k); ctx.quadraticCurveTo(4 * k, 23 * k, -18 * k, 15 * k);
    ctx.quadraticCurveTo(6 * k, 15 * k, 30 * k, 13 * k); ctx.quadraticCurveTo(46 * k, 12 * k, 54 * k, 9 * k); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(70,90,160,0.45)'; ctx.lineWidth = 0.9 * k;
    for (const o of [0, 3, 6]) { ctx.beginPath(); ctx.moveTo(48 * k, (12 + o * 0.4) * k); ctx.quadraticCurveTo(26 * k, (16 + o) * k, 2 * k, (15 + o * 0.7) * k); ctx.stroke(); }
    // sırttaki yıldız benekleri (yavaşça ışıldar)
    for (const [sx, sy, r] of [[-30, -10, 1.5], [-16, -17, 1.2], [-2, -20, 1.7], [14, -21, 1.1], [30, -19, 1.4], [-40, -4, 1], [42, -12, 1.2], [-8, -12, 0.9], [22, -12, 1]]) {
      ctx.fillStyle = `rgba(255,250,225,${(0.55 + 0.45 * Math.sin(t * 2.4 + sx)).toFixed(3)})`; circle(ctx, sx * k, sy * k, r * k);
    }
    // yan yüzgeç, göz ve tatlı bir gülümseme
    ctx.save(); ctx.translate(16 * k, 15 * k); ctx.rotate(0.55 + Math.sin(t * 1.4 + 1) * 0.18);
    ctx.fillStyle = '#3a4a98'; ellipse(ctx, -2 * k, 6 * k, 5 * k, 11 * k); ctx.restore();
    ctx.fillStyle = '#ffffff'; circle(ctx, 40 * k, 2 * k, 3 * k);
    ctx.fillStyle = '#1d1f3a'; circle(ctx, 40.8 * k, 2.4 * k, 1.8 * k);
    ctx.fillStyle = '#ffffff'; circle(ctx, 41.4 * k, 1.6 * k, 0.6 * k);
    ctx.strokeStyle = '#1d1f3a'; ctx.lineWidth = 1.1 * k;
    ctx.beginPath(); ctx.moveTo(54 * k, 8 * k); ctx.quadraticCurveTo(46 * k, 12 * k, 36 * k, 10 * k); ctx.stroke();
    // ışıldayan benek sırası (3. aşama)
    if (T >= 3) for (let i = 0; i < 8; i++) {
      const px = (-44 + i * 11) * k, py = (2 + Math.sin(i * 0.9) * 2) * k + (i < 2 ? -3 * k : 0);
      ctx.globalCompositeOperation = 'lighter'; glow(ctx, px, py, 4 * k, hex('#8ff0ff'), 0.7 * (0.6 + 0.4 * Math.sin(t * 3 + i)));
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#c9fbff'; circle(ctx, px, py, 1 * k);
    }
    // yıldız tozu fıskiyesi (2. aşama)
    if (T >= 2) for (let i = 0; i < 9; i++) {
      const u = (t * 0.7 + i / 9) % 1, sp = (i % 3 - 1) * 9 * k;
      const px = 32 * k + sp * u, py = -24 * k - 30 * k * u + 22 * k * u * u;
      ctx.fillStyle = `rgba(${i % 2 ? '207,236,255' : '255,247,214'},${((1 - u) * 0.9).toFixed(3)})`; circle(ctx, px, py, (1.8 - u) * k);
    }
    // eyer örtüsü (1. aşama), 4. aşamada altın
    if (T >= 1) {
      ctx.fillStyle = T >= 4 ? GOLD : P.jacket; ctx.beginPath(); ctx.moveTo(-14 * k, -21 * k); ctx.quadraticCurveTo(0, -27 * k, 14 * k, -23 * k);
      ctx.lineTo(13 * k, -12 * k); ctx.lineTo(-13 * k, -11 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = T >= 4 ? GOLD_HI : P.hat; ctx.fillRect(-13 * k, -14 * k, 26 * k, 1.8 * k);
    }
    rider(ctx, k, t, [-2 * k, -25 * k], [5 * k, -46 * k], [7 * k, -9 * k], [17 * k, -33 * k]);
    if (T >= 4) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -6 * k, 70 * k, hex('#ffd56b'), 0.15); ctx.globalCompositeOperation = 'source-over'; sparkles(ctx, -6 * k, -10 * k, k, t, 9, 120 * k, 60 * k); }
    ctx.restore();
  }

  // Samanyolu Treni: ışıktan bir rayda giden lacivert, altın kuşaklı buharlı lokomotif ve bir vagon; bacadan yıldız tozu tüter.
  // Aşamalar: 1 vagonda kıyafet renginde kuşak ve altın kazan halkaları, 2 vagon damında renkli fener dizisi,
  // 3 ışıldayan tekerlekler ve daha parlak ray, 4 altın süsler ve parıltı
  function drawStarTrain(ctx, x, y, k, st) {
    const T = st.tier || 0, t = st.t || 0, ic = st.icon, a0 = ctx.globalAlpha; // diğer gezginlerde solma saydamlığı
    ctx.save(); ctx.translate(x, y + Math.sin(t * 1.3) * 1.5 * k);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // ışıktan ray: geriye doğru solar, traversler akar
    const L = (ic ? 110 : 190) * k, rg = ctx.createLinearGradient(62 * k, 0, -L, 0);
    rg.addColorStop(0, `rgba(191,227,255,${T >= 3 ? 1 : 0.85})`); rg.addColorStop(1, 'rgba(191,227,255,0)');
    ctx.strokeStyle = rg; ctx.lineWidth = 1.4 * k;
    for (const ry of [19, 22.5]) { ctx.beginPath(); ctx.moveTo(62 * k, ry * k); ctx.lineTo(-L, ry * k); ctx.stroke(); }
    ctx.lineWidth = 1.8 * k;
    const off = ic ? 0 : (t * 70) % 12;
    for (let sx = 60 - off; sx > -L / k; sx -= 12) { ctx.globalAlpha = a0 * clamp(1 + sx * k / L, 0, 1) * 0.7; ctx.beginPath(); ctx.moveTo(sx * k, 18 * k); ctx.lineTo((sx - 2) * k, 24 * k); ctx.stroke(); }
    ctx.globalAlpha = a0;
    if (T >= 3) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 10 * k, 22 * k, 60 * k, hex('#9fd4ff'), 0.25); ctx.globalCompositeOperation = 'source-over'; }
    // yıldız tozu dumanı
    for (let i = 0; i < 6; i++) {
      const u = ((ic ? 0.3 : t * 0.6) + i / 6) % 1, px = (30 - u * 52) * k, py = (-38 - u * 14 - Math.sin(u * 6 + i) * 3) * k;
      ctx.fillStyle = `rgba(222,232,255,${((1 - u) * 0.5).toFixed(3)})`; circle(ctx, px, py, (3 + 5 * u) * k);
      ctx.fillStyle = `rgba(255,245,200,${((1 - u) * 0.9).toFixed(3)})`; circle(ctx, px + 3 * k, py - 2 * k, 0.9 * k);
    }
    const ang = ic ? 0.4 : t * 7, tire = '#1a1d40', rim = T >= 3 ? '#8ff0ff' : '#c9a24a';
    // vagon
    ctx.strokeStyle = '#1a1d40'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(-50 * k, 8 * k); ctx.lineTo(-36 * k, 8 * k); ctx.stroke();
    ctx.fillStyle = '#2f3a7a'; rrect(ctx, -100 * k, -18 * k, 50 * k, 27 * k, 4 * k); ctx.fill();
    ctx.fillStyle = '#232b63'; rrect(ctx, -103 * k, -23 * k, 56 * k, 6 * k, 3 * k); ctx.fill();
    for (const wx of [-95, -80, -65]) {
      ctx.fillStyle = '#ffe9a8'; rrect(ctx, wx * k, -13 * k, 11 * k, 11 * k, 2 * k); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; circle(ctx, (wx + 7.5) * k, -10 * k, 0.9 * k); circle(ctx, (wx + 3) * k, -6 * k, 0.6 * k);
    }
    ctx.fillStyle = T >= 4 ? GOLD : T >= 1 ? P.jacket : '#c9a24a'; ctx.fillRect(-100 * k, 1 * k, 50 * k, 2.4 * k);
    if (T >= 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.6 * k;
      ctx.beginPath(); ctx.moveTo(-101 * k, -23 * k); ctx.quadraticCurveTo(-75 * k, -19 * k, -49 * k, -23 * k); ctx.stroke();
      ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#ff8fb1'].forEach((c, i) => {
        const u = (i + 0.5) / 6, px = (-101 + 52 * u) * k, py = (-23 + 4 * Math.sin(u * Math.PI)) * k;
        ctx.globalCompositeOperation = 'lighter'; glow(ctx, px, py, 4 * k, hex(c), 0.6 * (0.6 + 0.4 * Math.sin(t * 4 + i))); ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = c; circle(ctx, px, py, 1.2 * k);
      });
    }
    for (const wx of [-90, -60]) wheel(ctx, wx * k, 12 * k, 6 * k, ang, k, tire, rim);
    // lokomotif: şasi, kabin, kazan, baca, ön fener ve mahmuz
    ctx.fillStyle = '#1a1d40'; ctx.fillRect(-36 * k, 5 * k, 84 * k, 4 * k);
    ctx.fillStyle = '#3a4590'; rrect(ctx, -34 * k, -30 * k, 30 * k, 37 * k, 3 * k); ctx.fill();
    ctx.fillStyle = '#272f6b'; rrect(ctx, -37 * k, -35 * k, 36 * k, 6 * k, 3 * k); ctx.fill();
    const win = () => { rrect(ctx, -28 * k, -25 * k, 17 * k, 14 * k, 3 * k); };
    ctx.fillStyle = P.glass; win(); ctx.fill();
    ctx.save(); win(); ctx.clip(); head(ctx, -18 * k, -13 * k, k * 0.75); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ellipse(ctx, -23 * k, -21 * k, 3 * k, 1.2 * k, -0.4);
    ctx.fillStyle = '#2b3170'; rrect(ctx, -6 * k, -16 * k, 50 * k, 22 * k, 11 * k); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; rrect(ctx, -2 * k, -14 * k, 42 * k, 5 * k, 2.5 * k); ctx.fill();
    ctx.fillStyle = T >= 4 ? GOLD_HI : '#c9a24a';
    for (const bx of [4, 20, 34]) ctx.fillRect(bx * k, -16 * k, 2.4 * k, 22 * k);
    ctx.fillStyle = '#1f2456'; circle(ctx, 43 * k, -5 * k, 10.5 * k);
    ctx.fillStyle = T >= 4 ? GOLD : '#c9a24a'; circle(ctx, 43 * k, -5 * k, 3 * k);
    // baca
    ctx.fillStyle = '#1a1d40'; ctx.beginPath(); ctx.moveTo(26 * k, -15 * k); ctx.lineTo(34 * k, -15 * k); ctx.lineTo(37 * k, -33 * k); ctx.lineTo(23 * k, -33 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = T >= 4 ? GOLD : '#c9a24a'; ctx.fillRect(22 * k, -35 * k, 16 * k, 2.6 * k);
    // ön fener
    ctx.globalCompositeOperation = 'lighter'; glow(ctx, 51 * k, -15 * k, 18 * k, hex('#fff3c4'), 0.7); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fff3c4'; circle(ctx, 50 * k, -15 * k, 3.4 * k);
    // mahmuz (ön kalkan)
    ctx.fillStyle = '#b8453a'; ctx.beginPath(); ctx.moveTo(44 * k, 6 * k); ctx.lineTo(60 * k, 17 * k); ctx.lineTo(44 * k, 17 * k); ctx.closePath(); ctx.fill();
    for (const [wx, r] of [[-22, 8], [-4, 8], [16, 6], [32, 6]]) wheel(ctx, wx * k, (17 - r) * k + 3 * k, r * k, ang, k, tire, rim);
    ctx.strokeStyle = T >= 4 ? GOLD : '#c9a24a'; ctx.lineWidth = 1.6 * k;
    ctx.beginPath(); ctx.moveTo(-22 * k + Math.cos(ang) * 4 * k, 12 * k + Math.sin(ang) * 4 * k); ctx.lineTo(-4 * k + Math.cos(ang) * 4 * k, 12 * k + Math.sin(ang) * 4 * k); ctx.stroke(); // biyel
    if (T >= 4) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, -20 * k, -4 * k, 80 * k, hex('#ffd56b'), 0.14); ctx.globalCompositeOperation = 'source-over'; sparkles(ctx, -24 * k, -6 * k, k, t, 9, 150 * k, 60 * k); }
    ctx.restore();
  }

  // Anka Kuşu (Zümrüdüanka): zümrüt yeşili tüyleri, altın karnı ve ışıktan uzun kuyruk telleriyle efsane kuş; kanatlarını ağır ağır çırpar.
  // Aşamalar: 1 eyer örtüsü ve altın dizgin, 2 kuyruk tüylerinde göz benekleri ve iki tel daha, 3 kanat kenarlarında ışıldayan alev,
  // 4 altın süsler ve parıltı
  function drawAnka(ctx, x, y, k, st) {
    const T = st.tier || 0, t = st.t || 0, ic = st.icon;
    const w = ic ? 0.75 : 0.42 + 0.58 * Math.sin(t * 2.1), lift = ic ? 0 : -Math.sin(t * 2.1 - 0.6) * 2.5 * k;
    ctx.save(); ctx.translate(x, y + lift); ctx.rotate(-0.04 + Math.sin(t * 0.6) * 0.02);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -6 * k, 80 * k, hex('#7fe0b8'), 0.22); glow(ctx, -40 * k, 0, 60 * k, hex('#ffd56b'), 0.14);
    ctx.globalCompositeOperation = 'source-over';
    const wing = (bx, by, s, light) => {
      const tx = bx - 46 * k, ty = by - 58 * k * s;
      const g = ctx.createLinearGradient(bx, by, tx, ty);
      g.addColorStop(0, light ? '#23b083' : '#178563'); g.addColorStop(0.6, light ? '#3fd0b0' : '#2a9c86'); g.addColorStop(1, light ? '#ffd56b' : '#d9a83a');
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(bx + 12 * k, by); ctx.quadraticCurveTo(bx + 6 * k, by - 36 * k * s, tx, ty);
      // arka kenar: tüy uçları dalga dalga
      for (let i = 1; i <= 5; i++) {
        const u = i / 5, ex = lerp(tx, bx - 16 * k, u), ey = lerp(ty, by + 2 * k, u);
        ctx.quadraticCurveTo(ex - 6 * k, ey + (8 - 2 * u) * k * Math.max(0.3, Math.abs(s)) * Math.sign(s || 1) * 0.6, ex, ey);
      }
      ctx.closePath(); ctx.fill();
      if (T >= 3) {
        ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,200,90,${(0.5 + 0.3 * Math.sin(t * 9 + bx)).toFixed(3)})`; ctx.lineWidth = 2.4 * k;
        ctx.beginPath(); ctx.moveTo(bx + 10 * k, by - 2 * k); ctx.quadraticCurveTo(bx + 6 * k, by - 36 * k * s, tx, ty); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
    };
    wing(-4 * k, -6 * k, w * 0.85, false);
    // kuyruk telleri: zümrütten altına akıp solar
    const tails = T >= 2 ? [[-6, 1], [0, 1.12], [6, 0.94], [-12, 0.86], [11, 0.8]] : [[-5, 1], [1, 1.1], [7, 0.92]];
    const TL = (ic ? 62 : 128) * k;
    tails.forEach(([o, len], i) => {
      const wav = ic ? 0 : Math.sin(t * 1.8 + i * 0.9) * 7 * k, ex = -18 * k - TL * len, ey = (o * 1.6) * k + 8 * k + wav;
      const g = ctx.createLinearGradient(-18 * k, 0, ex, 0);
      g.addColorStop(0, '#1fa57a'); g.addColorStop(0.5, '#3fd0b0'); g.addColorStop(1, 'rgba(255,213,107,0.15)');
      ctx.strokeStyle = g; ctx.lineWidth = (3.6 - Math.abs(o) * 0.12) * k;
      ctx.beginPath(); ctx.moveTo(-16 * k, 2 * k + o * 0.3 * k); ctx.quadraticCurveTo(-18 * k - TL * len * 0.5, o * 0.6 * k - wav * 0.6, ex, ey); ctx.stroke();
      if (T >= 2) { // göz benekleri
        ctx.fillStyle = 'rgba(255,213,107,0.85)'; ellipse(ctx, ex + 6 * k, ey - wav * 0.05, 4 * k, 2.6 * k);
        ctx.fillStyle = 'rgba(31,120,150,0.9)'; ellipse(ctx, ex + 6 * k, ey - wav * 0.05, 2 * k, 1.3 * k);
      }
    });
    // gövde: zümrüt sırt, altın karın
    const bg = ctx.createLinearGradient(0, -14 * k, 0, 14 * k);
    bg.addColorStop(0, '#1d9a72'); bg.addColorStop(1, '#127356');
    ctx.fillStyle = bg; ellipse(ctx, 6 * k, 0, 30 * k, 12 * k, -0.08);
    ctx.fillStyle = '#f3c45a'; ellipse(ctx, 12 * k, 6 * k, 22 * k, 6 * k, -0.12);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ellipse(ctx, 4 * k, -8 * k, 18 * k, 2.6 * k, -0.08);
    // ön kanat: yolcunun arkasından yükselir (yolcu kanadın önünde oturur)
    wing(-6 * k, -6 * k, w, true);
    // boyun ve baş
    ctx.strokeStyle = '#1d9a72'; ctx.lineWidth = 9 * k;
    ctx.beginPath(); ctx.moveTo(28 * k, -4 * k); ctx.quadraticCurveTo(38 * k, -6 * k, 44 * k, -16 * k); ctx.stroke();
    ctx.fillStyle = '#22a87c'; circle(ctx, 45 * k, -18 * k, 7 * k);
    // tepe tüyleri: geriye kıvrılan, uçları altın
    for (const [a, l] of [[-2.4, 16], [-2.75, 14], [-2.1, 12]]) {
      const ex = 44 * k + Math.cos(a) * l * k, ey = -22 * k + Math.sin(a) * l * k + (ic ? 0 : Math.sin(t * 3 + a) * 1.2 * k);
      ctx.strokeStyle = '#2fc395'; ctx.lineWidth = 1.8 * k;
      ctx.beginPath(); ctx.moveTo(44 * k, -23 * k); ctx.quadraticCurveTo(44 * k + Math.cos(a) * l * 0.5 * k, -30 * k, ex, ey); ctx.stroke();
      ctx.fillStyle = '#ffd56b'; circle(ctx, ex, ey, 1.8 * k);
    }
    ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.moveTo(50 * k, -21 * k); ctx.quadraticCurveTo(58 * k, -20 * k, 57 * k, -14 * k); ctx.lineTo(50 * k, -15 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd56b'; circle(ctx, 47 * k, -20 * k, 1.9 * k);
    ctx.fillStyle = '#1d1716'; circle(ctx, 47.4 * k, -20 * k, 0.9 * k);
    // eyer örtüsü ve altın dizgin (1. aşama)
    if (T >= 1) {
      ctx.fillStyle = T >= 4 ? GOLD : P.jacket; ctx.beginPath(); ctx.moveTo(-10 * k, -10 * k); ctx.quadraticCurveTo(4 * k, -15 * k, 18 * k, -10 * k);
      ctx.lineTo(16 * k, 2 * k); ctx.lineTo(-8 * k, 2 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = T >= 4 ? GOLD_HI : P.hat; ctx.fillRect(-8 * k, -1 * k, 24 * k, 1.8 * k);
    }
    const hand = [20 * k, -24 * k];
    rider(ctx, k, t, [2 * k, -13 * k], [9 * k, -34 * k], [11 * k, 4 * k], hand);
    if (T >= 1) { ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(hand[0], hand[1]); ctx.quadraticCurveTo(32 * k, -22 * k, 41 * k, -14 * k); ctx.stroke(); }
    if (T >= 4) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -6 * k, 80 * k, hex('#ffd56b'), 0.16); ctx.globalCompositeOperation = 'source-over'; sparkles(ctx, -10 * k, -10 * k, k, t, 10, 140 * k, 70 * k); }
    ctx.restore();
  }

  // Zaman Makinesi: pirinç kızaklar, kadife koltuk ve arkada büyük, dönen kadranlı bir saat diski; ucu kristal kol her "tık"ta
  // hafifçe oynar (otomatik adımlar). tick: son otomatik adımdan beri geçen süre (sn; oyun verir, simgede yok).
  // Aşamalar: 1 pirinç fener ve kıyafet renginde koltuk minderi, 2 diskin altında dönen ikinci çark, 3 arkada dönen zaman
  // girdabı, 4 altın süsler ve parıltı
  function drawChrono(ctx, x, y, k, st) {
    const T = st.tier || 0, t = st.t || 0, ic = st.icon;
    const tick = ic ? 1 : Math.min(1, (st.tick === undefined ? 1 : st.tick) / 0.18);
    const brass = T >= 4 ? GOLD : '#c9a24a', brassDk = '#8f6e2c';
    ctx.save(); ctx.translate(x, y + (ic ? 0 : Math.sin(t * 1.2) * 1.5 * k));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // zaman girdabı (3. aşama): diskin arkasında dönen yarı saydam yaylar
    if (T >= 3) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(${i % 2 ? '143,240,255' : '196,160,255'},${0.35 - i * 0.08})`; ctx.lineWidth = (3 - i * 0.6) * k;
        ctx.beginPath(); ctx.arc(-30 * k, -14 * k, (34 + i * 8) * k, t * (1.4 - i * 0.3) + i, t * (1.4 - i * 0.3) + i + 2.2); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    // ikinci çark (2. aşama)
    const gear = (cx, cy, r, n, a, col) => {
      ctx.fillStyle = col; ctx.beginPath();
      for (let i = 0; i < n * 2; i++) { const aa = a + i * Math.PI / n, rr = i % 2 ? r : r * 0.82; ctx.lineTo(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = brassDk; circle(ctx, cx, cy, r * 0.3);
    };
    if (T >= 2) gear(-48 * k, 4 * k, 9 * k, 9, ic ? 0.3 : -t * 1.6, brass);
    // saat diski: pirinç çember, krem kadran, saat işaretleri, dönen akrep ve yelkovan
    const cx = -30 * k, cy = -14 * k, R = 25 * k;
    ctx.fillStyle = brassDk; circle(ctx, cx, cy, R + 2.4 * k);
    ctx.fillStyle = brass; circle(ctx, cx, cy, R);
    ctx.fillStyle = '#f3e6c4'; circle(ctx, cx, cy, R * 0.84);
    ctx.strokeStyle = '#6b5326'; ctx.lineWidth = 1.2 * k;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, r1 = R * (i % 3 ? 0.72 : 0.64), r2 = R * 0.8;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke();
    }
    const hand = (a, L, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); ctx.stroke(); };
    ctx.strokeStyle = '#3a2c1a';
    hand(ic ? -2.1 : t * 0.25 - 1.6, R * 0.45, 2 * k);
    hand(ic ? -0.6 : t * 3 - 1.6, R * 0.66, 1.3 * k);
    ctx.fillStyle = brass; circle(ctx, cx, cy, 2.4 * k);
    // kızaklar ve dikmeler
    ctx.strokeStyle = brass; ctx.lineWidth = 2.6 * k;
    ctx.beginPath(); ctx.moveTo(-50 * k, 16 * k); ctx.lineTo(34 * k, 16 * k); ctx.quadraticCurveTo(44 * k, 16 * k, 46 * k, 8 * k); ctx.stroke();
    ctx.strokeStyle = brassDk; ctx.lineWidth = 2 * k;
    ctx.beginPath(); ctx.moveTo(-46 * k, 12 * k); ctx.lineTo(30 * k, 12 * k); ctx.stroke();
    ctx.strokeStyle = brass; ctx.lineWidth = 1.8 * k;
    for (const sx of [-34, -8, 22]) { ctx.beginPath(); ctx.moveTo(sx * k, 16 * k); ctx.lineTo(sx * k, 4 * k); ctx.stroke(); }
    // koltuk: pirinç çerçeve, kadife minder (1. aşamada kıyafet renginde)
    ctx.fillStyle = '#7a2f3a'; rrect(ctx, -16 * k, -26 * k, 8 * k, 30 * k, 3 * k); ctx.fill();
    ctx.fillStyle = T >= 4 ? GOLD : T >= 1 ? P.jacket : '#9a3b48'; rrect(ctx, -14 * k, -2 * k, 26 * k, 7 * k, 3 * k); ctx.fill();
    ctx.fillStyle = brass; ctx.fillRect(-16 * k, 4 * k, 30 * k, 2.4 * k); ctx.fillRect(-17 * k, -28 * k, 10 * k, 2.4 * k);
    // kol ve kristal topuz: her tıkta geriye yatıp yerine döner
    const la = -0.35 - 0.35 * (1 - tick);
    const kx = 26 * k + Math.sin(la) * 22 * k, ky = 8 * k - Math.cos(la) * 22 * k;
    ctx.strokeStyle = brass; ctx.lineWidth = 2.2 * k;
    ctx.beginPath(); ctx.moveTo(26 * k, 8 * k); ctx.lineTo(kx, ky); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; glow(ctx, kx, ky, 12 * k, hex('#8ff0ff'), 0.4 + 0.5 * (1 - tick)); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#bff6ff'; circle(ctx, kx, ky, 3 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; circle(ctx, kx - 1 * k, ky - 1 * k, 1 * k);
    // fener (1. aşama)
    if (T >= 1) {
      ctx.strokeStyle = brass; ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.moveTo(40 * k, 10 * k); ctx.lineTo(40 * k, -6 * k); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; glow(ctx, 40 * k, -10 * k, 14 * k, hex('#ffcf7a'), 0.7); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = brass; rrect(ctx, 37 * k, -14 * k, 6 * k, 8 * k, 1.5 * k); ctx.fill();
      ctx.fillStyle = '#fff3c4'; rrect(ctx, 38.2 * k, -12.6 * k, 3.6 * k, 5 * k, 1 * k); ctx.fill();
    }
    // yolcu: koltukta oturur, eli kolun üstünde
    rider(ctx, k, t, [-4 * k, -4 * k], [2 * k, -25 * k], [14 * k, 10 * k], [Math.min(kx, 22 * k), Math.max(ky + 3 * k, -16 * k)]);
    if (T >= 4) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, -10 * k, -10 * k, 70 * k, hex('#ffd56b'), 0.15); ctx.globalCompositeOperation = 'source-over'; sparkles(ctx, -10 * k, -10 * k, k, t, 9, 120 * k, 60 * k); }
    ctx.restore();
  }

  // Karabaş: krem tüylü, kara maskeli Anadolu çoban köpeği; yolcunun yanında koşar.
  // tier: görünüm aşaması (1 tasma ve künye, 2 boyunluk, 3 sırtta heybe, 4 altın tasma ve parıltı)
  function drawDog(ctx, x, y, k, ph, t, tier) {
    const bob = Math.abs(Math.sin(ph)) * 1.8 * k;
    const body = '#ecdcb6', shade = '#cdb88e', dark = '#3b2d27';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (lx, off, col) => {
      const a = Math.sin(ph + off) * 0.65, top = [lx, y - 12 * k - bob];
      line(ctx, [top[0], top[1], top[0] + Math.sin(a) * 9 * k, y - 1.2 * k - Math.max(0, Math.cos(ph + off)) * 2.5 * k], 3.4 * k, col);
    };
    leg(x - 9 * k, 0.5, shade); leg(x + 7 * k, 2.1, shade);
    ctx.strokeStyle = body; ctx.lineWidth = 3.4 * k;
    const wag = Math.sin(t * 14) * 2.5 * k;
    ctx.beginPath(); ctx.moveTo(x - 12 * k, y - 18 * k - bob);
    ctx.quadraticCurveTo(x - 20 * k, y - 22 * k - bob, x - 15 * k + wag, y - 28 * k - bob); ctx.stroke();
    ctx.fillStyle = body; ellipse(ctx, x, y - 16.5 * k - bob, 13.5 * k, 6.8 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ellipse(ctx, x - 2 * k, y - 20 * k - bob, 8 * k, 2 * k);
    ctx.fillStyle = P.jacket; ellipse(ctx, x + 10 * k, y - 20 * k - bob, 2.2 * k, 4.2 * k, -0.4);
    ctx.fillStyle = body; ellipse(ctx, x + 14 * k, y - 24.5 * k - bob, 6.4 * k, 5.4 * k);
    ctx.fillStyle = dark; ellipse(ctx, x + 19.5 * k, y - 23 * k - bob, 3.6 * k, 2.8 * k);
    ctx.fillStyle = dark; ellipse(ctx, x + 11 * k, y - 27.5 * k - bob, 2.6 * k, 4.4 * k, 0.5);
    ctx.fillStyle = '#1d1716'; circle(ctx, x + 23 * k, y - 23.6 * k - bob, 1.3 * k); circle(ctx, x + 16 * k, y - 26 * k - bob, 1 * k);
    if (Math.sin(ph * 0.5) > 0) { ctx.fillStyle = '#e8838e'; ellipse(ctx, x + 20 * k, y - 20 * k - bob, 1.6 * k, 2.4 * k); }
    const T = tier || 0;
    if (T >= 3) { // sırtında küçük heybe
      ctx.fillStyle = '#b5532f'; rrect(ctx, x - 8 * k, y - 24 * k - bob, 12 * k, 8 * k, 2.5 * k); ctx.fill();
      ctx.fillStyle = P.pack; rrect(ctx, x - 7 * k, y - 25 * k - bob, 10 * k, 4 * k, 2 * k); ctx.fill();
    }
    if (T >= 2) { // boyunluk
      ctx.fillStyle = T >= 4 ? GOLD : P.hat; ctx.beginPath();
      ctx.moveTo(x + 6.5 * k, y - 23 * k - bob); ctx.lineTo(x + 14 * k, y - 21.5 * k - bob); ctx.lineTo(x + 9 * k, y - 13.5 * k - bob); ctx.closePath(); ctx.fill();
    }
    if (T >= 1) { // tasma ve künye
      ctx.fillStyle = T >= 4 ? GOLD : '#d9534f'; ellipse(ctx, x + 10.5 * k, y - 21.5 * k - bob, 1.8 * k, 4.8 * k, -0.35);
      ctx.fillStyle = T >= 4 ? GOLD_HI : '#ffd56b'; circle(ctx, x + 12 * k, y - 16.8 * k - bob, 1.5 * k);
    }
    leg(x - 6 * k, 3.7, body); leg(x + 10 * k, 5.3, body);
    if (T >= 4) sparkles(ctx, x + 4 * k, y - 18 * k, k, t, 5, 40 * k, 26 * k);
  }
  // Tekir: kır tekir kedi; Karabaş gibi yanında tıpış tıpış koşar
  function drawCat(ctx, x, y, k, ph, t, tier) {
    const bob = Math.abs(Math.sin(ph)) * 1.4 * k, fur = '#b9a58d', dark = '#6d5c4b', T = tier || 0;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (lx, off, col) => { const a = Math.sin(ph + off) * 0.7; line(ctx, [lx, y - 9 * k - bob, lx + Math.sin(a) * 7 * k, y - 1 * k - Math.max(0, Math.cos(ph + off)) * 2 * k], 2.6 * k, col); };
    leg(x - 7 * k, 0.5, dark); leg(x + 5 * k, 2.1, dark);
    ctx.strokeStyle = fur; ctx.lineWidth = 2.6 * k; // havaya kalkık kuyruk
    ctx.beginPath(); ctx.moveTo(x - 9 * k, y - 13 * k - bob); ctx.quadraticCurveTo(x - 17 * k, y - 16 * k - bob, x - 15 * k + Math.sin(t * 5) * 2 * k, y - 26 * k - bob); ctx.stroke();
    ctx.fillStyle = fur; ellipse(ctx, x, y - 12.5 * k - bob, 10.5 * k, 5.2 * k);
    ctx.strokeStyle = dark; ctx.lineWidth = 1.2 * k; ctx.beginPath(); // tekir çizgileri
    for (const sx of [-4, 0, 4]) { ctx.moveTo(x + sx * k, y - 17 * k - bob); ctx.lineTo(x + (sx - 1.5) * k, y - 13 * k - bob); }
    ctx.stroke();
    if (T >= 3) { ctx.fillStyle = '#7fb3d9'; rrect(ctx, x - 6 * k, y - 19.5 * k - bob, 9 * k, 6 * k, 2 * k); ctx.fill(); }
    catHead(ctx, x + 11 * k, y - 19 * k - bob, k, t, T);
    leg(x - 4 * k, 3.7, fur); leg(x + 8 * k, 5.3, fur);
    if (T >= 4) sparkles(ctx, x + 2 * k, y - 15 * k, k, t, 5, 36 * k, 22 * k);
  }
  function catHead(ctx, x, y, k, t, tier) {
    const fur = '#b9a58d', dark = '#6d5c4b', T = tier || 0;
    ctx.fillStyle = fur; ctx.beginPath(); ctx.moveTo(x - 4.5 * k, y - 2 * k); ctx.lineTo(x - 3.5 * k, y - 8.5 * k); ctx.lineTo(x - 0.5 * k, y - 4 * k); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 1 * k, y - 4 * k); ctx.lineTo(x + 4 * k, y - 8.5 * k); ctx.lineTo(x + 5 * k, y - 2 * k); ctx.fill();
    ellipse(ctx, x, y, 5.6 * k, 4.8 * k);
    ctx.strokeStyle = dark; ctx.lineWidth = 0.9 * k; ctx.beginPath(); ctx.moveTo(x - 1 * k, y - 4.5 * k); ctx.lineTo(x - 0.5 * k, y - 2 * k); ctx.moveTo(x + 1.5 * k, y - 4.5 * k); ctx.lineTo(x + 1.5 * k, y - 2 * k); ctx.stroke();
    ctx.fillStyle = '#3d6b3a'; circle(ctx, x + 1 * k, y - 0.4 * k, 1.1 * k); circle(ctx, x + 4 * k, y - 0.4 * k, 1.1 * k);
    ctx.fillStyle = '#e8838e'; circle(ctx, x + 4.6 * k, y + 1.8 * k, 0.8 * k);
    if (T >= 2) { ctx.fillStyle = T >= 4 ? GOLD : P.hat; ctx.beginPath(); ctx.moveTo(x - 4 * k, y + 3.6 * k); ctx.lineTo(x + 4 * k, y + 3.6 * k); ctx.lineTo(x, y + 8.5 * k); ctx.closePath(); ctx.fill(); }
    if (T >= 1) { ctx.fillStyle = T >= 4 ? GOLD : '#d9534f'; rrect(ctx, x - 4 * k, y + 3 * k, 8 * k, 1.8 * k, 0.9 * k); ctx.fill(); ctx.fillStyle = '#ffd56b'; circle(ctx, x, y + 5 * k, 1.2 * k); }
  }
  // Kızıl: kızıl tilki; Karabaş gibi yanında koşar, araçlarda camdan bakar. Gür kuyruğunun ucu beyaz, ayakları kara çoraplı.
  // tier: 1 tasma, 2 boyunluk, 3 sırtta minik fener, 4 altın süsler ve parıltı. look: başını geriye çevirme (0–1, yabani tilki)
  const FOX = { fur: '#df7a34', shade: '#b65b24', cream: '#fbf1e2', sock: '#3a2a24' };
  // Yunus: sağa bakan, burnu x = +11, kuyruğu x = -14 birimde; s ölçeğinde, ang açısıyla çizilir
  // yunusların olağan sıçrayışı: DOL_P saniyede bir, havada DOL_A saniye
  const DOL_P = 2.2, DOL_A = 1.05;
  function drawDolphin(ctx, x, y, s, ang, back, belly, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.globalAlpha *= a;
    ctx.fillStyle = back;
    ctx.beginPath(); // sırt yüzgeci
    ctx.moveTo(0.8, -3.5); ctx.quadraticCurveTo(-0.4, -6.2, -3.6, -6.5); ctx.quadraticCurveTo(-2.3, -4.9, -3.2, -3.1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); // kuyruk yüzgeci
    ctx.moveTo(-9.6, 0); ctx.quadraticCurveTo(-12.2, -3.2, -14.4, -3); ctx.quadraticCurveTo(-12.6, -0.2, -14.4, 2.8); ctx.quadraticCurveTo(-12, 3, -9.6, 0); ctx.fill();
    ctx.beginPath(); // gövde: gaga, alın çıkıntısı, sırt, kuyruk sapı, karın
    ctx.moveTo(11, 0.7); ctx.quadraticCurveTo(8.6, -0.5, 6.4, -1.4); ctx.quadraticCurveTo(3.4, -4.3, -2, -3.5);
    ctx.quadraticCurveTo(-7, -2.5, -10.4, -0.4); ctx.lineTo(-10.4, 0.5); ctx.quadraticCurveTo(-6.4, 1.8, -1.6, 2.8);
    ctx.quadraticCurveTo(4.6, 3.1, 8.4, 1.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); // yan yüzgeç
    ctx.moveTo(3.2, 1.6); ctx.quadraticCurveTo(1.6, 4.6, -0.6, 5); ctx.quadraticCurveTo(0.6, 2.8, 0.4, 1.9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = belly; ctx.beginPath(); // açık renk karın
    ctx.moveTo(10.2, 1); ctx.quadraticCurveTo(5, 1.3, 0.5, 1.4); ctx.quadraticCurveTo(-4, 1.5, -7, 1.3); ctx.quadraticCurveTo(-2, 2.9, 3, 2.8); ctx.quadraticCurveTo(7, 2.4, 10.2, 1); ctx.fill();
    ctx.fillStyle = '#1d2733'; circle(ctx, 5.6, -0.5, 0.5); // göz
    ctx.restore();
  }

  function drawFox(ctx, x, y, k, ph, t, tier, look) {
    const bob = Math.abs(Math.sin(ph)) * 1.5 * k, T = tier || 0;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // bacağın üstü kızıl, alt yarısı kara çorap
    const leg = (lx, off, col) => {
      const a = Math.sin(ph + off) * 0.7, top = y - 10 * k - bob;
      const fx = lx + Math.sin(a) * 7 * k, fy = y - 1 * k - Math.max(0, Math.cos(ph + off)) * 2.2 * k;
      line(ctx, [lx, top, fx, fy], 2.3 * k, col);
      line(ctx, [lerp(lx, fx, 0.5), lerp(top, fy, 0.5), fx, fy], 2.3 * k, FOX.sock);
    };
    leg(x - 7 * k, 0.5, FOX.shade); leg(x + 6 * k, 2.1, FOX.shade);
    // gür kuyruk: geriye ve hafifçe yukarı uzanır, koşarken salınır; ucu beyaz
    const sw = Math.sin(t * 4.2) * 1.8 * k + Math.sin(ph) * 1.2 * k, by = y - 13 * k - bob;
    ctx.fillStyle = FOX.shade; ctx.beginPath();
    ctx.moveTo(x - 8 * k, by - 3 * k);
    ctx.quadraticCurveTo(x - 19 * k, by - 10 * k + sw, x - 29 * k, by - 6 * k + sw);
    ctx.quadraticCurveTo(x - 22 * k, by + 4 * k + sw * 0.5, x - 8 * k, by + 3 * k);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = FOX.fur; ctx.beginPath();
    ctx.moveTo(x - 8 * k, by - 2.6 * k);
    ctx.quadraticCurveTo(x - 18 * k, by - 9 * k + sw, x - 26 * k, by - 6.4 * k + sw);
    ctx.quadraticCurveTo(x - 20 * k, by + 1.5 * k + sw * 0.5, x - 8 * k, by + 1.5 * k);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = FOX.cream; ellipse(ctx, x - 27 * k, by - 5.6 * k + sw, 3.4 * k, 2.6 * k, -0.3);
    // gövde: sırtı kızıl, karnı krem
    ctx.fillStyle = FOX.fur; ellipse(ctx, x, y - 13 * k - bob, 11 * k, 5.2 * k);
    ctx.fillStyle = FOX.cream; ellipse(ctx, x + 3 * k, y - 10 * k - bob, 7 * k, 2.2 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ellipse(ctx, x - 2 * k, y - 16.5 * k - bob, 7 * k, 1.6 * k);
    if (T >= 3) { // sırtında minik fener: gece yolunu aydınlatır
      ctx.strokeStyle = '#6d4c35'; ctx.lineWidth = 0.9 * k; ctx.beginPath(); ctx.moveTo(x - 3 * k, y - 18 * k - bob); ctx.lineTo(x - 3 * k, y - 21 * k - bob); ctx.stroke();
      ctx.fillStyle = '#6d4c35'; rrect(ctx, x - 5.5 * k, y - 21 * k - bob, 5 * k, 6 * k, 1.2 * k); ctx.fill();
      ctx.fillStyle = '#ffd56b'; rrect(ctx, x - 4.6 * k, y - 20 * k - bob, 3.2 * k, 4 * k, 0.8 * k); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; glow(ctx, x - 3 * k, y - 18 * k - bob, 9 * k, hex('#ffd56b'), 0.35 + 0.1 * Math.sin(t * 3)); ctx.globalCompositeOperation = 'source-over';
    }
    foxHead(ctx, x + 11 * k, y - 19 * k - bob, k, t, T, look);
    leg(x - 4 * k, 3.7, FOX.fur); leg(x + 9 * k, 5.3, FOX.fur);
    if (T >= 4) sparkles(ctx, x - 2 * k, y - 15 * k, k, t, 5, 40 * k, 22 * k);
  }
  // Tilki başı (sağa bakar); look > 0.5 iken başını geriye, yolcuya çevirir
  function foxHead(ctx, x, y, k, t, tier, look) {
    const T = tier || 0;
    ctx.save(); ctx.translate(x, y);
    if (look > 0.5) ctx.scale(-1, 1);
    const tw = Math.sin(t * 0.9) > 0.92 ? 0.25 : 0; // kulak ara sıra seğirir
    const ear = (ex, lean) => {
      ctx.fillStyle = FOX.fur; ctx.beginPath(); ctx.moveTo(ex - 2.8 * k, -2.5 * k); ctx.lineTo(ex + lean * k, -10 * k); ctx.lineTo(ex + 2.8 * k, -2.5 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = FOX.sock; ctx.beginPath(); ctx.moveTo(ex + (lean - 1.2) * k, -7.4 * k); ctx.lineTo(ex + lean * k, -10 * k); ctx.lineTo(ex + (lean + 1.2) * k, -7.4 * k); ctx.closePath(); ctx.fill();
    };
    ctx.save(); ctx.rotate(-tw); ear(-2.2 * k, -1.2); ctx.restore();
    ear(2.6 * k, 0.8);
    ctx.fillStyle = FOX.fur; ellipse(ctx, 0, 0, 5.4 * k, 4.6 * k);
    // sivri burun ve beyaz yanak
    ctx.beginPath(); ctx.moveTo(2 * k, -2.6 * k); ctx.quadraticCurveTo(7 * k, -1.2 * k, 10 * k, 0.8 * k); ctx.lineTo(3 * k, 3.6 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = FOX.cream; ctx.beginPath(); ctx.moveTo(-3 * k, 1.8 * k); ctx.quadraticCurveTo(2 * k, 1 * k, 9.6 * k, 1.2 * k); ctx.quadraticCurveTo(4 * k, 5.4 * k, -1.5 * k, 4.2 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1d1716'; circle(ctx, 10 * k, 0.7 * k, 1.1 * k);
    ctx.beginPath(); ctx.ellipse(3.2 * k, -1.4 * k, 1.3 * k, 0.8 * k, 0.35, 0, TAU); ctx.fill(); // badem göz
    if (T >= 2) { ctx.fillStyle = T >= 4 ? GOLD : P.hat; ctx.beginPath(); ctx.moveTo(-4.4 * k, 3.4 * k); ctx.lineTo(3.4 * k, 3.8 * k); ctx.lineTo(-1 * k, 8.6 * k); ctx.closePath(); ctx.fill(); }
    if (T >= 1) { ctx.fillStyle = T >= 4 ? GOLD : '#2f8f83'; rrect(ctx, -4.6 * k, 2.8 * k, 8 * k, 1.8 * k, 0.9 * k); ctx.fill(); ctx.fillStyle = '#ffd56b'; circle(ctx, -0.6 * k, 5 * k, 1.2 * k); }
    ctx.restore();
  }
  // Kanat: beyaz martı; uçan araçlar dahil her araçta yolcunun yanında süzülür
  function drawGull(ctx, x, y, k, t, tier) {
    const T = tier || 0, flap = Math.sin(t * 7), wy = flap * 6 * k;
    if (T >= 4) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, y, 22 * k, hex('#ffd56b'), 0.35); ctx.globalCompositeOperation = 'source-over'; }
    // arka kanat: ön kanatla aynı anda çırpar (biraz geride ve gölgede kaldığı için daha koyu)
    ctx.fillStyle = '#c9d0db'; ctx.beginPath(); ctx.moveTo(x - 3 * k, y - 1 * k); ctx.quadraticCurveTo(x - 9 * k, y - 7 * k - wy * 0.9, x - 20 * k, y - 7 * k - wy * 1.7); ctx.quadraticCurveTo(x - 11 * k, y - 1 * k, x - 1 * k, y); ctx.fill();
    ctx.fillStyle = '#ffffff'; ellipse(ctx, x, y, 9 * k, 4 * k);
    ctx.beginPath(); ctx.moveTo(x - 8 * k, y - 1 * k); ctx.lineTo(x - 14 * k, y - 4 * k); ctx.lineTo(x - 13 * k, y + 2 * k); ctx.closePath(); ctx.fill(); // kuyruk
    circle(ctx, x + 8 * k, y - 2.5 * k, 3.6 * k);
    ctx.fillStyle = '#f2b33d'; ctx.beginPath(); ctx.moveTo(x + 11 * k, y - 3 * k); ctx.lineTo(x + 16 * k, y - 2 * k); ctx.lineTo(x + 11 * k, y - 1 * k); ctx.fill();
    ctx.fillStyle = '#1d1716'; circle(ctx, x + 9.4 * k, y - 3.4 * k, 0.9 * k);
    if (T >= 3) { ctx.fillStyle = '#6d4c35'; rrect(ctx, x + 5.5 * k, y - 6.2 * k, 6 * k, 2 * k, 1 * k); ctx.fill(); ctx.fillStyle = '#9fd6ef'; circle(ctx, x + 9.6 * k, y - 5.2 * k, 1.3 * k); } // pilot gözlüğü
    if (T >= 2) { const w = Math.sin(t * 9) * 1.5 * k; ctx.strokeStyle = T >= 4 ? GOLD : P.hat; ctx.lineWidth = 1.8 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 6 * k, y); ctx.quadraticCurveTo(x, y + 3 * k + w, x - 6 * k, y + 2 * k - w); ctx.stroke(); }
    if (T >= 1) { ctx.fillStyle = T >= 4 ? GOLD : '#d9534f'; rrect(ctx, x + 5 * k, y - 1 * k, 4 * k, 2 * k, 1 * k); ctx.fill(); }
    ctx.fillStyle = '#e4e9f0'; ctx.beginPath(); ctx.moveTo(x - 1 * k, y - 1 * k); ctx.quadraticCurveTo(x - 6 * k, y - 9 * k - wy, x - 16 * k, y - 10 * k - wy * 1.9); ctx.quadraticCurveTo(x - 8 * k, y - 2 * k, x + 2 * k, y); ctx.fill(); // ön kanat
    if (T >= 4) sparkles(ctx, x - 14 * k, y, k, t, 4, 24 * k, 14 * k);
  }
  // Turna: açık gri gövde, siyah boyun ve kanat uçları, başında kırmızı tepe; ayakları geride uzanır. Sağa doğru uçar.
  // w: kanadın konumu (1 yukarıda, −0,6 aşağıda), night: gece karartması (0–1)
  function drawCrane(ctx, x, y, k, w, night) {
    const col = c => css(mixc(hex(c), hex('#3a4266'), night * 0.45));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const wing = (dx, s, c1, c2) => {
      const tx = x + dx - 7 * k, ty = y - 21 * k * s;
      ctx.fillStyle = col(c1); ctx.beginPath();
      ctx.moveTo(x + dx + 5 * k, y - 1 * k); ctx.quadraticCurveTo(x + dx + 3 * k, y - 13 * k * s, tx, ty);
      ctx.quadraticCurveTo(x + dx - 13 * k, y - 8 * k * s, x + dx - 6 * k, y - 0.5 * k); ctx.closePath(); ctx.fill();
      // kanat ucundaki siyah uçuş tüyleri
      ctx.fillStyle = col(c2); ctx.beginPath();
      ctx.moveTo(x + dx + 0.5 * k, y - 16.5 * k * s); ctx.lineTo(tx, ty); ctx.lineTo(x + dx - 10 * k, y - 14.5 * k * s); ctx.closePath(); ctx.fill();
    };
    wing(-2 * k, w * 0.85, '#aeb4c0', '#2c2e38'); // arka kanat (gölgede)
    // ayaklar ve kabarık kuyruk
    ctx.strokeStyle = col('#2c2a33'); ctx.lineWidth = 1.1 * k;
    ctx.beginPath(); ctx.moveTo(x - 7 * k, y + 1 * k); ctx.lineTo(x - 23 * k, y + 3 * k); ctx.moveTo(x - 7 * k, y + 1.6 * k); ctx.lineTo(x - 22 * k, y + 4.4 * k); ctx.stroke();
    ctx.fillStyle = col('#7d828d'); ellipse(ctx, x - 8.5 * k, y + 0.3 * k, 4.6 * k, 3 * k);
    ctx.fillStyle = col('#e6e9ef'); ellipse(ctx, x, y, 10 * k, 3.6 * k);
    // boyun: gövdeye yakın açık gri, sonra siyah; baş siyah, yanağında beyaz şerit, tepede kırmızı
    ctx.lineWidth = 2.6 * k; ctx.strokeStyle = col('#dfe2e8');
    ctx.beginPath(); ctx.moveTo(x + 7 * k, y - 0.8 * k); ctx.lineTo(x + 14 * k, y - 2 * k); ctx.stroke();
    ctx.strokeStyle = col('#24252c'); ctx.lineWidth = 2.2 * k;
    ctx.beginPath(); ctx.moveTo(x + 13 * k, y - 1.9 * k); ctx.lineTo(x + 20.5 * k, y - 3 * k); ctx.stroke();
    ctx.fillStyle = col('#24252c'); circle(ctx, x + 21 * k, y - 3.2 * k, 2.3 * k);
    ctx.fillStyle = col('#f4f5f8'); ellipse(ctx, x + 19.6 * k, y - 2.2 * k, 2 * k, 0.8 * k, -0.15);
    ctx.fillStyle = col('#d9473c'); circle(ctx, x + 21.4 * k, y - 5.1 * k, 1 * k);
    ctx.strokeStyle = col('#7c7466'); ctx.lineWidth = 1.1 * k;
    ctx.beginPath(); ctx.moveTo(x + 23 * k, y - 3.1 * k); ctx.lineTo(x + 28 * k, y - 2.4 * k); ctx.stroke();
    wing(0, w, '#d3d7df', '#24252c'); // ön kanat
  }
  /* ---------- Hasat mevsimi: balkabakları, saman balyası, korkuluk ----------
     Balkabağı: dilimli turuncu gövde, kıvrık sap. face: oyulmuş yüz (gündüz koyu oyuklar, gece içten yanar; glowA 0–1) */
  function drawPumpkin(ctx, x, y, r, lit, glowA, face) {
    ctx.fillStyle = css(lit(hex('#c4621c'))); ellipse(ctx, x - r * 0.45, y - r * 0.8, r * 0.6, r * 0.78); ellipse(ctx, x + r * 0.45, y - r * 0.8, r * 0.6, r * 0.78);
    ctx.fillStyle = css(lit(hex('#e8832e'))); ellipse(ctx, x, y - r * 0.82, r * 0.62, r * 0.82);
    ctx.fillStyle = css(lit(hex('#f7ad5a')), 0.55); ellipse(ctx, x - r * 0.2, y - r * 1.12, r * 0.15, r * 0.32, -0.2);
    ctx.strokeStyle = css(lit(hex('#6b7d35'))); ctx.lineWidth = Math.max(1, r * 0.22); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.5); ctx.quadraticCurveTo(x + r * 0.1, y - r * 1.85, x + r * 0.38, y - r * 1.9); ctx.stroke();
    if (!face) return;
    ctx.fillStyle = glowA > 0.05 ? css(mixc(hex('#4a2410'), hex('#ffd36b'), glowA)) : css(lit(hex('#5a2e10')));
    for (const sd of [-1, 1]) {
      const ex = x + sd * 0.3 * r;
      ctx.beginPath(); ctx.moveTo(ex - 0.14 * r, y - 0.92 * r); ctx.lineTo(ex + 0.14 * r, y - 0.92 * r); ctx.lineTo(ex, y - 1.16 * r); ctx.closePath(); ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(x - 0.44 * r, y - 0.68 * r); ctx.quadraticCurveTo(x, y - 0.2 * r, x + 0.44 * r, y - 0.68 * r);
    for (const [dx, dy] of [[0.26, 0.56], [0.13, 0.68], [0, 0.56], [-0.13, 0.68], [-0.26, 0.56]]) ctx.lineTo(x + dx * r, y - dy * r);
    ctx.closePath(); ctx.fill();
  }
  // Yuvarlak saman balyası: altın sarısı, saman çizgileri ve iki ip
  function drawBale(ctx, x, y, w, h, lit) {
    ctx.fillStyle = css(lit(hex('#d9b65c'))); rrect(ctx, x - w / 2, y - h, w, h, h * 0.28); ctx.fill();
    ctx.fillStyle = css(lit(hex('#ecd387')), 0.7); rrect(ctx, x - w / 2 + h * 0.12, y - h + h * 0.1, w - h * 0.24, h * 0.28, h * 0.14); ctx.fill();
    ctx.strokeStyle = css(lit(hex('#b8933e'))); ctx.lineWidth = Math.max(0.8, h * 0.05);
    for (let i = 0; i < 4; i++) { const yy = y - h * (0.25 + i * 0.17); ctx.beginPath(); ctx.moveTo(x - w * 0.42, yy); ctx.lineTo(x + w * 0.42, yy + h * 0.03); ctx.stroke(); }
    ctx.strokeStyle = css(lit(hex('#8a6a30'))); ctx.lineWidth = Math.max(1, h * 0.08);
    for (const f of [-0.22, 0.22]) { ctx.beginPath(); ctx.moveTo(x + f * w, y - h); ctx.lineTo(x + f * w, y); ctx.stroke(); }
  }
  // Korkuluk: tahta direk, ekoseli gömlek, saman kollar, çuval baş ve hasır şapka; rüzgârda hafifçe sallanır
  function drawScarecrow(ctx, x, y, s, lit, sway) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
    const wood = css(lit(hex('#8a6440'))), straw = css(lit(hex('#e6c56a')));
    ctx.strokeStyle = wood; ctx.lineCap = 'round'; ctx.lineWidth = 2.4 * s;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -46 * s); ctx.moveTo(-15 * s, -33 * s); ctx.lineTo(15 * s, -33 * s); ctx.stroke();
    ctx.strokeStyle = straw; ctx.lineWidth = 1.1 * s;
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sd * 15 * s, -33 * s); ctx.lineTo(sd * (19 + i) * s, (-36 + i * 3) * s); ctx.stroke(); }
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 2 * s, -19 * s); ctx.lineTo(i * 3 * s, -14 * s); ctx.stroke(); }
    // gömlek: kırmızı ekose, kollar direk boyunca
    ctx.fillStyle = css(lit(hex('#c8553d')));
    ctx.beginPath(); ctx.moveTo(-14 * s, -36 * s); ctx.lineTo(14 * s, -36 * s); ctx.lineTo(14 * s, -30 * s); ctx.lineTo(7 * s, -30 * s);
    ctx.lineTo(8 * s, -19 * s); ctx.lineTo(-8 * s, -19 * s); ctx.lineTo(-7 * s, -30 * s); ctx.lineTo(-14 * s, -30 * s); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(lit(hex('#8f3526')), 0.6); ctx.lineWidth = 0.9 * s;
    for (const xx of [-9, -3, 3, 9]) { ctx.beginPath(); ctx.moveTo(xx * s, -36 * s); ctx.lineTo(xx * s * 0.8, -19 * s); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-14 * s, -33 * s); ctx.lineTo(14 * s, -33 * s); ctx.moveTo(-8 * s, -25 * s); ctx.lineTo(8 * s, -25 * s); ctx.stroke();
    ctx.fillStyle = css(lit(hex('#6f8fb8'))); rrect(ctx, -3 * s, -31 * s, 6 * s, 4 * s, 1 * s); ctx.fill(); // yama
    // çuval baş: dikişli gülümseme
    ctx.fillStyle = css(lit(hex('#d9c49a'))); circle(ctx, 0, -42 * s, 5.6 * s);
    ctx.fillStyle = css(lit(hex('#3d2a1c'))); circle(ctx, -2 * s, -43 * s, 0.8 * s); circle(ctx, 2 * s, -43 * s, 0.8 * s);
    ctx.strokeStyle = css(lit(hex('#3d2a1c'))); ctx.lineWidth = 0.7 * s;
    ctx.beginPath(); ctx.moveTo(-2.6 * s, -40.2 * s); ctx.quadraticCurveTo(0, -38.4 * s, 2.6 * s, -40.2 * s); ctx.stroke();
    // hasır şapka
    ctx.fillStyle = css(lit(hex('#c9a04e'))); ellipse(ctx, 0, -46.5 * s, 9.5 * s, 2 * s);
    ctx.fillStyle = css(lit(hex('#b88c3c'))); rrect(ctx, -4.6 * s, -52 * s, 9.2 * s, 5.6 * s, 2 * s); ctx.fill();
    ctx.fillStyle = css(lit(hex('#c8553d'))); ctx.fillRect(-4.6 * s, -48.2 * s, 9.2 * s, 1.4 * s);
    ctx.restore();
  }
  /* ---------- Kuş Defteri kuşları ----------
     Hepsi sağa bakar; sola uçanlar dışarıda aynalanır. w: kanadın konumu (1 yukarıda, −0,6 aşağıda), night: gece karartması (0–1) */
  const tint = night => c => css(mixc(hex(c), hex('#3a4266'), night * 0.45));
  // Kanat: omuz (x, y); s: kanat konumu, L: kanat boyu (birim), c1: kanat, c2: uç tüyleri (yoksa çizilmez),
  // fingers: kartal gibi ayrık uç tüyleri. Kanat ucunun yerini döndürür (benek çizmek için).
  // ch: kanadın gövdeye bağlandığı yerin genişliği (1 = boyla orantılı; uzun kanatlı kuşlarda daha ince)
  function birdWing(ctx, x, y, k, s, L, c1, c2, fingers, ch) {
    const q = k * L / 21, c = q * (ch || 1), tx = x - 7 * q, ty = y - 21 * q * s;
    ctx.fillStyle = c1; ctx.beginPath();
    ctx.moveTo(x + 5 * c, y - 1 * k); ctx.quadraticCurveTo(x + 3 * c, y - 13 * q * s, tx, ty);
    ctx.quadraticCurveTo(x - 13 * c, y - 8 * q * s, x - 6 * c, y - 0.5 * k); ctx.closePath(); ctx.fill();
    if (c2) {
      ctx.fillStyle = c2; ctx.beginPath();
      ctx.moveTo(x + 0.5 * q, y - 16.5 * q * s); ctx.lineTo(tx, ty); ctx.lineTo(x - 10 * q, y - 14.5 * q * s); ctx.closePath(); ctx.fill();
    }
    if (fingers) {
      // uçtaki ayrık tüyler: kanadın ucundan dışarı doğru açılan dört kısa çizgi
      const ax = x + 0.5 * q, ay = y - 16.5 * q * s, cx = x - 10 * q, cy = y - 14.5 * q * s;
      const dx = tx - (ax + cx) / 2, dy = ty - (ay + cy) / 2;
      ctx.strokeStyle = c2; ctx.lineWidth = 1.5 * q; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const f = (i + 0.5) / 4, bx = lerp(ax, cx, f), by = lerp(ay, cy, f);
        ctx.beginPath(); ctx.moveTo(lerp(bx, tx, 0.6), lerp(by, ty, 0.6));
        ctx.lineTo(bx + dx * 1.05 + (f - 0.5) * 3 * q, by + dy * 1.05 + (f - 0.5) * 2 * q * Math.sign(s || 1)); ctx.stroke();
      }
    }
    return { tx, ty, sx: x, sy: y - 1 * k };
  }
  // Uzun boyunlu ve uzun bacaklı kuşlar (leylek, flamingo): boyun ileri uzanır, bacaklar geride
  const LONG_BIRD = {
    stork:    { wing: '#f3f2ee', back: '#c9c7c2', tip: '#1f1f24', body: '#fbfaf6', neck: '#fbfaf6', beak: '#e2483d', bill: null, legs: '#e2483d', neckLen: 19, neckW: 2.6 },
    flamingo: { wing: '#ef6f8e', back: '#cf5574', tip: '#1f1f24', body: '#f7aec2', neck: '#f7aec2', beak: '#f3ece4', bill: '#1f1f24', legs: '#ef86a2', neckLen: 23, neckW: 2 },
  };
  function drawLongBird(ctx, x, y, k, w, night, c) {
    const col = tint(night), hx = x + c.neckLen * k + 1 * k, hy = y - 2.8 * k;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    birdWing(ctx, x - 2 * k, y, k, w * 0.85, 21, col(c.back), col(c.tip));
    ctx.strokeStyle = col(c.legs); ctx.lineWidth = 1.2 * k;
    ctx.beginPath(); ctx.moveTo(x - 7 * k, y + 1 * k); ctx.lineTo(x - 25 * k, y + 3.4 * k); ctx.moveTo(x - 7 * k, y + 1.6 * k); ctx.lineTo(x - 24 * k, y + 4.6 * k); ctx.stroke();
    ctx.fillStyle = col(c.body); ellipse(ctx, x - 8.5 * k, y + 0.3 * k, 4.4 * k, 2.8 * k); ellipse(ctx, x, y, 10 * k, 3.8 * k);
    ctx.strokeStyle = col(c.neck); ctx.lineWidth = c.neckW * k;
    ctx.beginPath(); ctx.moveTo(x + 7 * k, y - 0.8 * k); ctx.quadraticCurveTo(x + (c.neckLen * 0.6 + 4) * k, y - 1.2 * k, hx - 1 * k, hy); ctx.stroke();
    ctx.fillStyle = col(c.neck); circle(ctx, hx, hy, 2.3 * k);
    if (c.bill) {
      // flamingo: kalın, ortasından aşağı kıvrılan gaga; ucu siyah
      ctx.strokeStyle = col(c.beak); ctx.lineWidth = 1.9 * k;
      ctx.beginPath(); ctx.moveTo(hx + 1.6 * k, hy); ctx.quadraticCurveTo(hx + 4.4 * k, hy - 0.4 * k, hx + 5 * k, hy + 1.8 * k); ctx.stroke();
      ctx.strokeStyle = col(c.bill); ctx.lineWidth = 1.6 * k;
      ctx.beginPath(); ctx.moveTo(hx + 4.9 * k, hy + 1.2 * k); ctx.lineTo(hx + 4.7 * k, hy + 2.6 * k); ctx.stroke();
    } else {
      ctx.strokeStyle = col(c.beak); ctx.lineWidth = 1.5 * k;
      ctx.beginPath(); ctx.moveTo(hx + 1.5 * k, hy + 0.1 * k); ctx.lineTo(hx + 9 * k, hy + 1.3 * k); ctx.stroke();
    }
    ctx.fillStyle = col('#1d1716'); circle(ctx, hx + 0.6 * k, hy - 0.6 * k, 0.6 * k);
    birdWing(ctx, x, y, k, w, 21, col(c.wing), col(c.tip));
  }
  // Arıkuşu: turkuaz karın, kestane sırt, sarı gerdan, siyah göz bandı, uzayan orta kuyruk tüyleri
  function drawBeeEater(ctx, x, y, k, w, night) {
    const col = tint(night);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    birdWing(ctx, x - 1 * k, y, k, w * 0.85, 13, col('#2f7f73'), col('#1f4f6e'));
    ctx.fillStyle = col('#3fa58f'); ctx.beginPath();
    ctx.moveTo(x - 5 * k, y - 1 * k); ctx.lineTo(x - 13 * k, y - 0.4 * k); ctx.lineTo(x - 12.5 * k, y + 1.6 * k); ctx.lineTo(x - 5 * k, y + 1.4 * k); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = col('#3fa58f'); ctx.lineWidth = 0.9 * k;
    ctx.beginPath(); ctx.moveTo(x - 12 * k, y + 0.5 * k); ctx.lineTo(x - 17.5 * k, y + 0.9 * k); ctx.stroke();
    ctx.fillStyle = col('#36b6c4'); ellipse(ctx, x, y + 0.3 * k, 7 * k, 3 * k);
    ctx.fillStyle = col('#a0532c'); ellipse(ctx, x + 1 * k, y - 1.4 * k, 6 * k, 1.7 * k); circle(ctx, x + 7 * k, y - 1.6 * k, 2.6 * k);
    ctx.fillStyle = col('#f7d33c'); ellipse(ctx, x + 7.7 * k, y + 0.5 * k, 2 * k, 1.4 * k);
    ctx.strokeStyle = col('#1d1716'); ctx.lineWidth = 0.9 * k;
    ctx.beginPath(); ctx.moveTo(x + 5 * k, y - 1.5 * k); ctx.lineTo(x + 9.6 * k, y - 1.2 * k); ctx.stroke();
    ctx.lineWidth = 0.8 * k;
    ctx.beginPath(); ctx.moveTo(x + 9.4 * k, y - 1.3 * k); ctx.quadraticCurveTo(x + 12 * k, y - 1.5 * k, x + 14 * k, y - 0.4 * k); ctx.stroke();
    birdWing(ctx, x + 1 * k, y - 0.5 * k, k, w, 14, col('#3a9a7e'), col('#24607e'));
  }
  // Alaca ağaçkakan: siyah sırt, beyaz omuz ve yanak, kırmızı ense ve kuyruk altı, kanatlarda beyaz benekler
  function drawWoodpecker(ctx, x, y, k, w, night) {
    const col = tint(night), spots = wg => {
      ctx.fillStyle = col('#f4f1ea');
      for (const f of [0.32, 0.52, 0.72]) circle(ctx, lerp(wg.sx, wg.tx, f) - 0.6 * k, lerp(wg.sy, wg.ty, f) + 0.4 * k, 0.75 * k);
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    spots(birdWing(ctx, x - 1 * k, y, k, w * 0.85, 14, col('#2a2a30'), null));
    ctx.fillStyle = col('#26262c'); ctx.beginPath();
    ctx.moveTo(x - 5.5 * k, y - 1.2 * k); ctx.lineTo(x - 13 * k, y - 0.4 * k); ctx.lineTo(x - 12.4 * k, y + 1.6 * k); ctx.lineTo(x - 5.5 * k, y + 1.2 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col('#f1ece2'); ellipse(ctx, x + 0.5 * k, y + 0.8 * k, 6.6 * k, 2.4 * k);
    ctx.fillStyle = col('#d6343a'); ellipse(ctx, x - 4.6 * k, y + 1.6 * k, 2.2 * k, 1.3 * k);
    ctx.fillStyle = col('#26262c'); ellipse(ctx, x, y - 0.8 * k, 7.4 * k, 2.6 * k); circle(ctx, x + 7 * k, y - 1.8 * k, 2.7 * k);
    ctx.fillStyle = col('#f4f1ea'); ellipse(ctx, x - 0.6 * k, y - 1.4 * k, 2.6 * k, 1.1 * k, -0.1); ellipse(ctx, x + 7.6 * k, y - 1.1 * k, 1.7 * k, 1.1 * k);
    ctx.fillStyle = col('#d6343a'); circle(ctx, x + 5.3 * k, y - 3.1 * k, 1.1 * k);
    ctx.fillStyle = col('#5b5d66'); ctx.beginPath(); ctx.moveTo(x + 9.3 * k, y - 2.5 * k); ctx.lineTo(x + 13.6 * k, y - 1.7 * k); ctx.lineTo(x + 9.3 * k, y - 1 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col('#ffffff'); circle(ctx, x + 7.8 * k, y - 2.3 * k, 0.55 * k);
    spots(birdWing(ctx, x + 0.5 * k, y - 0.6 * k, k, w, 15, col('#2a2a30'), null));
  }
  // Kartal: koyu kahverengi, altın ense, kancalı sarı gaga; geniş kanatlarının ucundaki tüyler parmak gibi ayrık
  function drawEagle(ctx, x, y, k, w, night) {
    const col = tint(night);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    birdWing(ctx, x - 2 * k, y, k, w * 0.9, 40, col('#4a2f1c'), col('#2c1c12'), true, 0.55);
    ctx.fillStyle = col('#5b3a22'); ctx.beginPath();
    ctx.moveTo(x - 8 * k, y - 1.4 * k); ctx.lineTo(x - 17 * k, y - 2.6 * k); ctx.lineTo(x - 17.5 * k, y + 2.8 * k); ctx.lineTo(x - 8 * k, y + 1.8 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col('#f2c14e'); ellipse(ctx, x - 3 * k, y + 3.4 * k, 2.2 * k, 1.1 * k);
    ctx.fillStyle = col('#5b3a22'); ellipse(ctx, x, y, 11 * k, 4.2 * k);
    ctx.fillStyle = col('#c99a4b'); ellipse(ctx, x + 8 * k, y - 2 * k, 3.8 * k, 2.5 * k, -0.2);
    ctx.fillStyle = col('#b8883f'); circle(ctx, x + 11 * k, y - 2.3 * k, 2.9 * k);
    ctx.fillStyle = col('#f2c14e'); ctx.beginPath();
    ctx.moveTo(x + 13 * k, y - 3.2 * k); ctx.quadraticCurveTo(x + 16.8 * k, y - 3.2 * k, x + 15.8 * k, y - 0.7 * k);
    ctx.lineTo(x + 13.2 * k, y - 1.4 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col('#1d1716'); circle(ctx, x + 12.1 * k, y - 3 * k, 0.75 * k);
    ctx.strokeStyle = col('#7a5428'); ctx.lineWidth = 0.8 * k;
    ctx.beginPath(); ctx.moveTo(x + 10.8 * k, y - 4 * k); ctx.lineTo(x + 13.2 * k, y - 3.7 * k); ctx.stroke();
    birdWing(ctx, x, y, k, w, 44, col('#5e3c22'), col('#2c1c12'), true, 0.55);
  }
  // Kar baykuşu: bembeyaz, yuvarlak; koyu benekler, öne bakan iri sarı gözler (gece hafifçe ışıldar)
  function drawOwl(ctx, x, y, k, w, night) {
    const col = tint(night * 0.6), dots = (wg, n) => {
      ctx.fillStyle = col('#6b7385');
      for (let i = 0; i < n; i++) { const f = 0.3 + i * 0.6 / n; circle(ctx, lerp(wg.sx, wg.tx, f) - 1 * k, lerp(wg.sy, wg.ty, f) + 0.8 * k, 0.55 * k); }
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    dots(birdWing(ctx, x - 1 * k, y, k, w * 0.85, 20, col('#dfe4ec'), null), 3);
    ctx.fillStyle = col('#eef1f5'); ctx.beginPath();
    ctx.moveTo(x - 7 * k, y - 1.6 * k); ctx.lineTo(x - 12 * k, y - 0.8 * k); ctx.lineTo(x - 11.5 * k, y + 2.2 * k); ctx.lineTo(x - 7 * k, y + 2 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col('#f6f8fb'); ellipse(ctx, x, y + 0.4 * k, 8.5 * k, 4.6 * k);
    ctx.fillStyle = col('#6b7385');
    for (const [dx, dy] of [[-3.4, -1.6], [-0.2, -2.6], [2.6, -1.2], [-1.4, 0.8], [1.6, 1.8], [-4.6, 1]]) circle(ctx, x + dx * k, y + dy * k, 0.55 * k);
    ctx.fillStyle = col('#f8fafc'); circle(ctx, x + 7.5 * k, y - 2.4 * k, 4.4 * k);
    if (night > 0.3) { ctx.globalCompositeOperation = 'lighter'; for (const ex of [5.8, 9.2]) glow(ctx, x + ex * k, y - 2.8 * k, 4 * k, hex('#ffd56b'), 0.5 * night); ctx.globalCompositeOperation = 'source-over'; }
    for (const ex of [5.8, 9.2]) {
      ctx.fillStyle = '#f5c518'; circle(ctx, x + ex * k, y - 2.8 * k, 1.35 * k);
      ctx.fillStyle = '#1d1716'; circle(ctx, x + ex * k, y - 2.8 * k, 0.7 * k);
    }
    ctx.fillStyle = col('#3a3f4a'); ctx.beginPath(); ctx.moveTo(x + 7 * k, y - 1.9 * k); ctx.lineTo(x + 8 * k, y - 1.9 * k); ctx.lineTo(x + 7.5 * k, y - 0.8 * k); ctx.closePath(); ctx.fill();
    dots(birdWing(ctx, x + 0.5 * k, y - 0.2 * k, k, w, 22, col('#f1f4f8'), null), 4);
  }
  // Yalıçapkını: parlak mavi sırt, turuncu karın, beyaz boyun lekesi, uzun hançer gaga
  function drawKingfisher(ctx, x, y, k, w, night) {
    const col = tint(night);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    birdWing(ctx, x - 1 * k, y, k, w * 0.85, 11, col('#1a6fa8'), null);
    ctx.fillStyle = col('#1e8fd6'); ctx.beginPath();
    ctx.moveTo(x - 5 * k, y - 1.2 * k); ctx.lineTo(x - 9.5 * k, y - 0.8 * k); ctx.lineTo(x - 9.2 * k, y + 1.2 * k); ctx.lineTo(x - 5 * k, y + 1.2 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col('#f08a3c'); ellipse(ctx, x + 0.5 * k, y + 0.9 * k, 5.8 * k, 2.4 * k);
    ctx.fillStyle = col('#1f9be0'); ellipse(ctx, x, y - 0.7 * k, 6.2 * k, 2.3 * k);
    ctx.fillStyle = col('#6fdcf7'); ellipse(ctx, x - 1 * k, y - 1.5 * k, 4 * k, 0.7 * k);
    ctx.fillStyle = col('#1a7fc4'); circle(ctx, x + 5.6 * k, y - 1.4 * k, 2.8 * k);
    ctx.fillStyle = col('#f08a3c'); ellipse(ctx, x + 5.8 * k, y - 0.6 * k, 1.6 * k, 0.9 * k);
    ctx.fillStyle = col('#ffffff'); ellipse(ctx, x + 4.2 * k, y + 0.3 * k, 1 * k, 0.7 * k);
    ctx.fillStyle = col('#1d1716'); circle(ctx, x + 6.6 * k, y - 1.9 * k, 0.6 * k);
    ctx.beginPath(); ctx.moveTo(x + 7.8 * k, y - 2.2 * k); ctx.lineTo(x + 14.5 * k, y - 0.9 * k); ctx.lineTo(x + 7.8 * k, y - 0.3 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col('#e2483d'); circle(ctx, x + 1 * k, y + 3.1 * k, 0.8 * k);
    birdWing(ctx, x + 0.5 * k, y - 0.4 * k, k, w, 12, col('#1a7fc4'), col('#145a8a'));
  }
  // Hüdhüd (ibibik): somon turuncusu gövde, siyah-beyaz çizgili geniş kanatlar, uzun kıvrık gaga ve ucu siyah tepe
  // tüyleri. fan: tepenin açıklığı (0 yatık, 1 yelpaze gibi açık; dokununca açılır)
  function drawHoopoe(ctx, x, y, k, w, night, fan) {
    const col = tint(night), f = fan === undefined ? 0.25 : fan;
    const bars = wg => {
      ctx.strokeStyle = col('#f6f1e6'); ctx.lineWidth = 1.3 * k;
      for (const u of [0.3, 0.5, 0.7]) {
        const px = lerp(wg.sx, wg.tx, u), py = lerp(wg.sy, wg.ty, u);
        ctx.beginPath(); ctx.moveTo(px + 2.4 * k, py + 0.4 * k); ctx.lineTo(px - 2 * k, py + 2.6 * k); ctx.stroke();
      }
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    bars(birdWing(ctx, x - 1 * k, y, k, w * 0.85, 15, col('#24242a'), null));
    // kuyruk: siyah, ortasında beyaz bant
    ctx.fillStyle = col('#24242a'); ctx.beginPath();
    ctx.moveTo(x - 5.5 * k, y - 1.2 * k); ctx.lineTo(x - 14 * k, y - 1 * k); ctx.lineTo(x - 13.6 * k, y + 2 * k); ctx.lineTo(x - 5.5 * k, y + 1.4 * k); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = col('#f6f1e6'); ctx.lineWidth = 1.2 * k;
    ctx.beginPath(); ctx.moveTo(x - 10.5 * k, y - 1 * k); ctx.lineTo(x - 10.2 * k, y + 1.8 * k); ctx.stroke();
    ctx.fillStyle = col('#e7a271'); ellipse(ctx, x, y, 7.6 * k, 3.3 * k);
    ctx.fillStyle = col('#f2c29a'); ellipse(ctx, x + 1 * k, y + 1.2 * k, 5.5 * k, 1.8 * k);
    // tepe tüyleri: başın üstünden geriye; açılınca yelpaze gibi kalkar
    for (let i = 0; i < 5; i++) {
      const a = lerp(-2.95 + i * 0.1, -2.75 + i * 0.42, f), L = (5.4 - Math.abs(i - 2) * 0.5) * k;
      const bx = x + 7 * k, by = y - 3.4 * k, ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L;
      ctx.strokeStyle = col('#e39a5f'); ctx.lineWidth = 1.7 * k;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = col('#24242a'); circle(ctx, ex, ey, 0.9 * k);
    }
    ctx.fillStyle = col('#e7a271'); circle(ctx, x + 7.4 * k, y - 1.6 * k, 2.7 * k);
    ctx.fillStyle = col('#1d1716'); circle(ctx, x + 8.3 * k, y - 2.1 * k, 0.6 * k);
    ctx.strokeStyle = col('#2a2420'); ctx.lineWidth = 0.9 * k;
    ctx.beginPath(); ctx.moveTo(x + 9.8 * k, y - 1.4 * k); ctx.quadraticCurveTo(x + 13.5 * k, y - 1.3 * k, x + 16 * k, y + 0.9 * k); ctx.stroke();
    bars(birdWing(ctx, x + 0.5 * k, y - 0.5 * k, k, w, 16, col('#2a2a30'), null));
  }
  const BIRD_ART = {
    stork: (c, x, y, k, w, n) => drawLongBird(c, x, y, k, w, n, LONG_BIRD.stork),
    flamingo: (c, x, y, k, w, n) => drawLongBird(c, x, y, k, w, n, LONG_BIRD.flamingo),
    beeeater: drawBeeEater, woodpecker: drawWoodpecker, eagle: drawEagle, owl: drawOwl, kingfisher: drawKingfisher, hoopoe: drawHoopoe,
  };
  // Uçuş biçimleri: dir 1 soldan sağa (yolcuyla aynı yöne), −1 sağdan sola; dur: ekranı geçme süresi (sn), y: gökyüzünde
  // yükseklik (ekranın oranı), n: sürü [en az, en çok], s: boy, fl: kanat çırpma hızı (rad/sn), amp: çırpış genliği,
  // bound: çırp-süzül dalgalı uçuş (arıkuşu, ağaçkakan), glide: süzülerek geçen zamanın oranı (leylek, kartal), gw: süzülürken kanadın duruşu,
  // gap: sürüdeki kuşlar arası (birim; varsayılan 26)
  const BIRD_FLY = {
    stork:      { dir: 1,  dur: 19, y: [0.27, 0.36], n: [1, 2], s: 1.4,  fl: 6,   amp: 1,   glide: 0.4, gw: 0.45, gap: 40 },
    beeeater:   { dir: -1, dur: 12, y: [0.32, 0.42], n: [2, 3], s: 1.75, fl: 22,  amp: 0.9, bound: 1 },
    woodpecker: { dir: -1, dur: 13, y: [0.33, 0.43], n: [1, 1], s: 1.75, fl: 24,  amp: 1,   bound: 1.5 },
    flamingo:   { dir: 1,  dur: 18, y: [0.27, 0.36], n: [3, 5], s: 1.3,  fl: 8,   amp: 0.9, gap: 40 },
    eagle:      { dir: -1, dur: 21, y: [0.24, 0.33], n: [1, 1], s: 1.55, fl: 5,   amp: 0.8, glide: 0.75, gw: 0.62 },
    owl:        { dir: -1, dur: 15, y: [0.32, 0.42], n: [1, 1], s: 1.65, fl: 6.5, amp: 1.1 },
    kingfisher: { dir: -1, dur: 10, y: [0.38, 0.46], n: [1, 1], s: 1.8,  fl: 34,  amp: 0.6 },
    // Hüdhüd: yolcuyla aynı yöne, çırpıp süzülerek, kelebek gibi dalgalanarak uçar
    hoopoe:     { dir: 1,  dur: 16, y: [0.3, 0.4],   n: [1, 1], s: 1.75, fl: 16,  amp: 1,   bound: 1.6 },
  };
  const BIRD_SPARK = {
    stork: ['#ffffff', '#f3f2ee', '#e2483d', '#ffd56b'], beeeater: ['#36b6c4', '#f7d33c', '#a0532c', '#ffffff'],
    woodpecker: ['#ffffff', '#d6343a', '#26262c', '#ffd56b'], flamingo: ['#f7aec2', '#ef6f8e', '#ffffff', '#ffd56b'],
    eagle: ['#c99a4b', '#f2c14e', '#ffffff', '#7a5428'], owl: ['#ffffff', '#e9f3ff', '#f5c518', '#cfe0ff'], kingfisher: ['#1f9be0', '#f08a3c', '#6fdcf7', '#ffffff'],
    hoopoe: ['#ffd56b', '#e7a271', '#fff1c2', '#ffffff'],
  };
  const KITE_COLS = [['#ff6b6b', '#ffd56b'], ['#4dabf7', '#fbf8ee'], ['#9775fa', '#6fd3c1'], ['#f2a03d', '#2f9e8f'], ['#e8638e', '#fff1c2']];
  // Uçurtma (Uçurtma Yolu): iki renkli baklava gövde, çapraz çıtalar, rüzgârda dalgalanan fiyonklu kuyruk.
  // s: boy ölçüsü, ang: yatma açısı, col: [renk1, renk2], night: gece karartması (0–1), dışarıda translate edilmez
  function drawKite(ctx, x, y, s, ang, col, t, night) {
    const tint = c => css(mixc(hex(c), hex('#3a4266'), night * 0.45));
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // kuyruk: alttan sarkar, ucuna doğru daha çok dalgalanır; arada iki renkli fiyonklar
    const N = 7, pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N; pts.push([Math.sin(t * 4.2 - i * 0.9) * s * 0.32 * u - Math.sin(ang) * s * 0.9 * u, s * 1.15 + i * s * 0.36]); }
    ctx.strokeStyle = tint('#5b5f73'); ctx.lineWidth = Math.max(0.8, s * 0.06);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= N; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    for (let i = 2; i <= N; i += 2) {
      const [bx, by] = pts[i], w = s * 0.26, h = s * 0.14;
      ctx.fillStyle = tint(col[(i / 2) % 2]);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - w, by - h); ctx.lineTo(bx - w, by + h); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + w, by - h); ctx.lineTo(bx + w, by + h); ctx.closePath(); ctx.fill();
    }
    // gövde: dört üçgen, çapraz renkler
    const T = [0, -s], R = [s * 0.72, -s * 0.12], B = [0, s * 1.15], L = [-s * 0.72, -s * 0.12], C = [0, -s * 0.12];
    const tri = (a, b, c, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); ctx.fill(); };
    tri(T, C, L, tint(col[0])); tri(T, R, C, tint(col[1])); tri(C, R, B, tint(col[0])); tri(L, C, B, tint(col[1]));
    // ışığın vurduğu üst yarıda hafif parlaklık
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.moveTo(T[0], T[1]); ctx.lineTo(R[0], R[1]); ctx.lineTo(L[0], L[1]); ctx.closePath(); ctx.fill();
    // çıtalar ve kenar
    ctx.strokeStyle = tint('#4a4256'); ctx.lineWidth = Math.max(0.7, s * 0.05);
    ctx.beginPath(); ctx.moveTo(T[0], T[1]); ctx.lineTo(B[0], B[1]); ctx.moveTo(L[0], L[1]); ctx.lineTo(R[0], R[1]); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,40,60,0.35)'; ctx.lineWidth = Math.max(0.6, s * 0.04);
    ctx.beginPath(); ctx.moveTo(T[0], T[1]); ctx.lineTo(R[0], R[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(L[0], L[1]); ctx.closePath(); ctx.stroke();
    // gece: ortada küçük sıcak bir fener
    if (night > 0.3) {
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, C[0], C[1], s * 1.1, hex('#ffd9a0'), 0.5 * night + 0.1 * Math.sin(t * 3));
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,240,200,0.95)'; circle(ctx, C[0], C[1], s * 0.1);
    }
    ctx.restore();
  }
  // Araç penceresinden ya da balon sepetinden başını uzatan yol arkadaşı
  function petHead(ctx, kind, x, y, k, t, tier) {
    if (kind === 'cat') catHead(ctx, x, y, k, t, tier);
    else if (kind === 'fox') foxHead(ctx, x - 1 * k, y + 1 * k, k * 0.95, t, tier);
    else dogHead(ctx, x, y, k, t, tier);
  }
  // Yerde yanında koşan yol arkadaşları (Kanat uçar)
  // (prototipsiz nesne: sunucudan gelen pal değeri "__proto__" gibi bir ad olsa da işlev sanılmaz)
  const RUNNER = Object.assign(Object.create(null), { dog: drawDog, cat: drawCat, fox: drawFox });
  // Araçta pencereden ya da sepetten başını uzatan Karabaş (tier: drawDog ile aynı)
  function dogHead(ctx, x, y, k, t, tier) {
    const body = '#ecdcb6', dark = '#3b2d27', flap = Math.sin(t * 12) * 0.25;
    ctx.fillStyle = dark; ellipse(ctx, x - 3 * k, y - 4 * k, 2.2 * k, 4 * k, 0.6 + flap); // kulak rüzgârda
    ctx.fillStyle = body; ellipse(ctx, x, y, 5.6 * k, 4.8 * k);
    ctx.fillStyle = dark; ellipse(ctx, x + 5 * k, y + 1.2 * k, 3.2 * k, 2.4 * k);
    ctx.fillStyle = '#1d1716'; circle(ctx, x + 8 * k, y + 0.6 * k, 1.1 * k); circle(ctx, x + 2 * k, y - 1.6 * k, 0.9 * k);
    if (Math.sin(t * 3) > 0) { ctx.fillStyle = '#e8838e'; ellipse(ctx, x + 5.6 * k, y + 4.2 * k, 1.3 * k, 2 * k); }
    if ((tier || 0) >= 1) { ctx.fillStyle = tier >= 4 ? GOLD : tier >= 2 ? P.hat : '#d9534f'; rrect(ctx, x - 4 * k, y + 3.6 * k, 8 * k, 2.2 * k, 1 * k); ctx.fill(); }
  }

  // Kaykay: ön ayak tahtada, arka ayak yere basıp iter
  function drawBoard(ctx, x, y, k, st) {
    const by = y - 6 * k, q = st.phase;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = '#7d8496'; ctx.fillRect(x - 15 * k, by + 1 * k, 6 * k, 2 * k); ctx.fillRect(x + 9 * k, by + 1 * k, 6 * k, 2 * k);
    ctx.fillStyle = '#ffd56b'; circle(ctx, x - 12 * k, y - 2.4 * k, 2.4 * k); circle(ctx, x + 12 * k, y - 2.4 * k, 2.4 * k);
    const T = st.tier || 0;
    if (T >= 3) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, x - 12 * k, y - 2.4 * k, 9 * k, hex(T >= 4 ? '#ffd56b' : '#6fd3c1'), 0.7); glow(ctx, x + 12 * k, y - 2.4 * k, 9 * k, hex(T >= 4 ? '#ffd56b' : '#6fd3c1'), 0.7); ctx.globalCompositeOperation = 'source-over'; }
    ctx.strokeStyle = T >= 4 ? GOLD : T >= 1 ? P.jacket : '#c96f3b'; ctx.lineWidth = 3.4 * k;
    ctx.beginPath(); ctx.moveTo(x - 24 * k, by - 4 * k); ctx.quadraticCurveTo(x - 21 * k, by, x - 16 * k, by);
    ctx.lineTo(x + 16 * k, by); ctx.quadraticCurveTo(x + 21 * k, by, x + 24 * k, by - 4 * k); ctx.stroke();
    ctx.strokeStyle = P.teal; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(x - 10 * k, by - 0.4 * k); ctx.lineTo(x + 10 * k, by - 0.4 * k); ctx.stroke();
    const push = Math.max(0, Math.sin(q));
    const hx = x - 1 * k, hy = by - 29 * k - push * 2 * k;
    const sx = hx + 6 * k, sy = hy - 24 * k;
    const L = 16 * k;
    const backFoot = [x - 8 * k - push * 14 * k, lerp(by - 1.5 * k, y, push)];
    const frontFoot = [x + 9 * k, by - 1.5 * k];
    const kb = ik(hx, hy, backFoot[0], backFoot[1], L, L, 1);
    line(ctx, [hx, hy, kb[0], kb[1], backFoot[0], backFoot[1]], 7 * k, P.pantsDark); shoe(ctx, backFoot[0], backFoot[1], k);
    const ab = [sx - 16 * k, sy + 12 * k], eb = ik(sx, sy + 2 * k, ab[0], ab[1], 11.5 * k, 11.5 * k, -1);
    line(ctx, [sx, sy + 2 * k, eb[0], eb[1], ab[0], ab[1]], 5.6 * k, P.jacketDark);
    backpack(ctx, sx, sy, k, 0.25);
    torso(ctx, hx, hy, sx, sy, k);
    if (T >= 2) scarf(ctx, sx + 2 * k, sy + 1 * k, k, st.t);
    head(ctx, sx + 3 * k, sy - 9 * k, k);
    const kf = ik(hx, hy, frontFoot[0], frontFoot[1], L, L, 1);
    line(ctx, [hx, hy, kf[0], kf[1], frontFoot[0], frontFoot[1]], 7 * k, P.pants); shoe(ctx, frontFoot[0], frontFoot[1], k);
    const af = [sx + 15 * k, sy + 10 * k], ef = ik(sx, sy + 2 * k, af[0], af[1], 11.5 * k, 11.5 * k, -1);
    line(ctx, [sx, sy + 2 * k, ef[0], ef[1], af[0], af[1]], 5.6 * k, P.jacket);
    ctx.fillStyle = P.skin; circle(ctx, af[0], af[1], 2.6 * k); circle(ctx, ab[0], ab[1], 2.6 * k);
    if (T >= 4) sparkles(ctx, x, y - 24 * k, k, st.t, 6, 54 * k, 52 * k);
  }

  // At: dört nala koşan doru at, yolcu eyerde
  // At: dörtnal (kanter). Her bacak yere basar (toynak yerde kalır, bacak geriye süpürülür) ve havada katlanıp öne gelir;
  // gövde adım başına bir kez yükselir, baş ve boyun adımla sallanır, yele ve kuyruk rüzgârda dalgalanır.
  // Bacak sırası (sağ öncü): uzak arka → yakın arka ile uzak ön birlikte → yakın ön.
  function drawHorse(ctx, x, y, k, st) {
    const q = st.phase, t = st.t || 0;
    const bob = (1 - Math.cos(q - 0.6)) * 1.6 * k;          // gövde: adım başına bir yükselme
    const nod = Math.sin(q - 1.3) * 2.4 * k;                 // baş ve boyun sallanışı
    const coat = '#a8703f', dark = '#7d4f2a', mane = '#3d2a22', ground = y - 1 * k;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (lx, off, front, near) => {
      const c = (((q + off) / TAU) % 1 + 1) % 1, top = [lx, y - 26 * k - bob], reach = (front ? 9 : 8) * k, stance = 0.46;
      let hx, hy;
      if (c < stance) { hx = top[0] + lerp(reach, -reach, c / stance); hy = ground; }
      else {
        const u = (c - stance) / (1 - stance), e = u * u * (3 - 2 * u);
        hx = top[0] + lerp(-reach, reach, e); hy = ground - Math.sin(Math.PI * u) * (front ? 10 : 7) * k;
      }
      // ön bacakta diz öne, arka bacakta diz eklemi geriye bükülür
      const kn = ik(top[0], top[1], hx, hy, 13.5 * k, 15 * k, front ? 1 : -1);
      line(ctx, [top[0], top[1], kn[0], kn[1], hx, hy], (near ? 4.4 : 4) * k, near ? coat : dark);
      ctx.fillStyle = '#2f2722'; ellipse(ctx, hx + 1 * k, hy, 2.7 * k, 1.6 * k);
    };
    leg(x - 16 * k, 0, false, false); leg(x + 12 * k, 1.4, true, false);
    // kuyruk: arkaya savrulur, adımla dalgalanır
    const tw = Math.sin(q * 1.0 + 0.4), tw2 = Math.sin(t * 7);
    ctx.strokeStyle = mane; ctx.lineWidth = 4.2 * k;
    ctx.beginPath(); ctx.moveTo(x - 23 * k, y - 37 * k - bob);
    ctx.bezierCurveTo(x - 32 * k, y - 38 * k - bob + tw * 2 * k, x - 38 * k, y - 32 * k - bob + tw * 3 * k, x - 41 * k + tw2 * 1.5 * k, y - 22 * k - bob + tw * 4 * k); ctx.stroke();
    ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(x - 30 * k, y - 35 * k - bob + tw * 2 * k);
    ctx.quadraticCurveTo(x - 38 * k, y - 34 * k - bob, x - 44 * k + tw2 * 2 * k, y - 27 * k - bob + tw * 3 * k); ctx.stroke();
    // gövde
    ctx.fillStyle = coat; ellipse(ctx, x, y - 33 * k - bob, 25 * k, 10.5 * k);
    // boyun ve baş: boyun ucu ve baş adımla öne-aşağı iner, yukarı kalkar
    const hy0 = y - bob + nod, hx0 = x + nod * 0.35;
    ctx.beginPath(); ctx.moveTo(x + 13 * k, y - 40 * k - bob); ctx.quadraticCurveTo(x + 22 * k, y - 52 * k - bob + nod * 0.5, hx0 + 27 * k, hy0 - 58 * k);
    ctx.lineTo(hx0 + 33 * k, hy0 - 50 * k); ctx.quadraticCurveTo(x + 26 * k, y - 38 * k - bob + nod * 0.4, x + 20 * k, y - 28 * k - bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = coat; ellipse(ctx, hx0 + 34 * k, hy0 - 53 * k, 9 * k, 4.6 * k, 0.55 + nod / k * 0.03);
    ctx.fillStyle = dark; circle(ctx, hx0 + 39 * k, hy0 - 49 * k, 1.3 * k); // burun deliği
    // kulak: ara sıra seğirir
    const flick = Math.max(0, Math.sin(t * 1.7) - 0.92) * 12;
    ctx.fillStyle = coat; ctx.beginPath(); ctx.moveTo(hx0 + 27 * k, hy0 - 59 * k); ctx.lineTo(hx0 + (28 - flick) * k, hy0 - 65 * k); ctx.lineTo(hx0 + 31 * k, hy0 - 59 * k); ctx.fill();
    ctx.fillStyle = P.dark; circle(ctx, hx0 + 32 * k, hy0 - 56 * k, 1.1 * k);
    // yele: boyun boyunca, telleri rüzgârda geriye dalgalanır
    ctx.strokeStyle = mane; ctx.lineWidth = 3.4 * k;
    ctx.beginPath(); ctx.moveTo(hx0 + 27 * k, hy0 - 59 * k); ctx.quadraticCurveTo(x + 20 * k, y - 50 * k - bob + nod * 0.5, x + 14 * k, y - 42 * k - bob); ctx.stroke();
    ctx.lineWidth = 1.6 * k;
    for (let i = 0; i < 4; i++) {
      const u = 0.15 + i * 0.22, mx = lerp(hx0 + 27 * k, x + 14 * k, u), my = lerp(hy0 - 59 * k, y - 42 * k - bob, u), w = Math.sin(t * 9 + i * 1.3) * 1.6 * k;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(mx - 4 * k, my - 1 * k + w, mx - 7 * k, my + 1.5 * k + w); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ellipse(ctx, x - 4 * k, y - 38 * k - bob, 14 * k, 3 * k, -0.05);
    leg(x - 12 * k, 1.4, false, true); leg(x + 16 * k, 2.6, true, true);
    // eyer ve yolcu
    const T = st.tier || 0;
    if (T >= 1) { // saçaklı eyer örtüsü
      ctx.fillStyle = T >= 4 ? GOLD : P.jacket; rrect(ctx, x - 16 * k, y - 44 * k - bob, 26 * k, 13 * k, 3 * k); ctx.fill();
      ctx.strokeStyle = T >= 4 ? GOLD_HI : '#fbf4e6'; ctx.lineWidth = 1 * k; ctx.beginPath();
      for (let i = 0; i < 9; i++) { const fx = x - 15 * k + i * 3 * k; ctx.moveTo(fx, y - 31 * k - bob); ctx.lineTo(fx, y - 28.5 * k - bob); }
      ctx.stroke();
    }
    if (T >= 3) { // heybe
      ctx.fillStyle = '#7a4a2a'; rrect(ctx, x - 25 * k, y - 43 * k - bob, 11 * k, 12 * k, 3 * k); ctx.fill();
      ctx.fillStyle = '#5a3520'; ctx.fillRect(x - 25 * k, y - 39 * k - bob, 11 * k, 2 * k);
    }
    ctx.fillStyle = P.teal; rrect(ctx, x - 12 * k, y - 45 * k - bob, 18 * k, 9 * k, 3 * k); ctx.fill();
    ctx.fillStyle = '#5a3d2a'; rrect(ctx, x - 10 * k, y - 47 * k - bob, 14 * k, 4 * k, 2 * k); ctx.fill();
    // binici atın hareketini biraz gecikmeyle izler: eyere doğru hafifçe çöker (havada kalmaz)
    const rb = bob - Math.max(0, Math.sin(q - 1.5)) * 1.2 * k;
    const hip = [x - 3 * k, y - 47 * k - rb], sh = [x + 3 * k, y - 70 * k - rb];
    backpack(ctx, sh[0], sh[1], k, 0.2);
    torso(ctx, hip[0], hip[1], sh[0], sh[1], k);
    const knee = [x + 7 * k, y - 37 * k - rb], foot = [x + 4 * k, y - 26 * k - bob];
    line(ctx, [hip[0], hip[1], knee[0], knee[1], foot[0], foot[1]], 7 * k, P.pants); shoe(ctx, foot[0], foot[1], k);
    head(ctx, sh[0] + 3 * k, sh[1] - 9 * k, k);
    const hand = [x + 17 * k, y - 50 * k - rb + nod * 0.25], el = ik(sh[0], sh[1] + 2 * k, hand[0], hand[1], 11.5 * k, 11.5 * k, -1);
    line(ctx, [sh[0], sh[1] + 2 * k, el[0], el[1], hand[0], hand[1]], 5.6 * k, P.jacket);
    ctx.strokeStyle = T >= 4 ? GOLD : '#3a2c2a'; ctx.lineWidth = 1 * k; ctx.beginPath(); ctx.moveTo(hand[0], hand[1]); ctx.quadraticCurveTo(hand[0] + 9 * k, hand[1] + 3 * k, hx0 + 35 * k, hy0 - 51 * k); ctx.stroke();
    ctx.fillStyle = P.skin; circle(ctx, hand[0], hand[1], 2.6 * k);
    if (T >= 2) { // yeleye örülmüş renkli kurdeleler (yeleyle birlikte sallanır)
      const cols = ['#e84a5f', '#ffd56b', '#6fd3c1'];
      for (let i = 0; i < 3; i++) {
        const u = 0.25 + i * 0.25, rx = lerp(hx0 + 27 * k, x + 14 * k, u) - 1 * k, ry = lerp(hy0 - 59 * k, y - 42 * k - bob, u);
        ctx.fillStyle = cols[i]; circle(ctx, rx, ry, 2.7 * k);
        ctx.strokeStyle = cols[i]; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 3 * k + Math.sin(st.t * 8 + i) * 1.5 * k, ry + 6 * k); ctx.stroke();
      }
    }
    if (T >= 4) sparkles(ctx, x, y - 40 * k, k, st.t, 8, 80 * k, 60 * k);
  }

  // Karavan: iki renkli, yuvarlak burunlu, portbagajında sörf tahtası olan eski usul kamp aracı
  function drawVan(ctx, x, y, k, st) {
    const by = y - 10 * k + Math.sin(st.t * 8) * 0.6 * k;
    const lit = st.night > 0.5;
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffd56b'; rrect(ctx, x - 38 * k, by - 62 * k, 62 * k, 5 * k, 2.5 * k); ctx.fill();
    ctx.fillStyle = '#7a5a43'; ctx.fillRect(x - 32 * k, by - 57 * k, 2 * k, 4 * k); ctx.fillRect(x + 16 * k, by - 57 * k, 2 * k, 4 * k);
    ctx.fillStyle = '#efe6d4'; ctx.beginPath();
    ctx.moveTo(x - 46 * k, by - 30 * k); ctx.lineTo(x - 46 * k, by - 48 * k); ctx.quadraticCurveTo(x - 46 * k, by - 54 * k, x - 40 * k, by - 54 * k);
    ctx.lineTo(x + 30 * k, by - 54 * k); ctx.quadraticCurveTo(x + 44 * k, by - 54 * k, x + 46 * k, by - 34 * k); ctx.lineTo(x + 46 * k, by - 30 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.teal; ctx.beginPath();
    ctx.moveTo(x - 46 * k, by - 31 * k); ctx.lineTo(x + 46 * k, by - 31 * k); ctx.lineTo(x + 46 * k, by - 12 * k);
    ctx.quadraticCurveTo(x + 46 * k, by - 4 * k, x + 38 * k, by - 4 * k); ctx.lineTo(x - 40 * k, by - 4 * k);
    ctx.quadraticCurveTo(x - 46 * k, by - 4 * k, x - 46 * k, by - 10 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#efe6d4'; ctx.beginPath(); ctx.moveTo(x + 30 * k, by - 31 * k); ctx.lineTo(x + 44 * k, by - 31 * k); ctx.lineTo(x + 37 * k, by - 22 * k); ctx.closePath(); ctx.fill();
    const win = lit ? '#ffe7a8' : P.glass;
    ctx.fillStyle = win;
    for (let i = 0; i < 3; i++) { rrect(ctx, x - 40 * k + i * 16 * k, by - 49 * k, 12 * k, 12 * k, 3 * k); ctx.fill(); }
    ctx.fillStyle = lit ? '#3d4a6b' : P.glass; ctx.beginPath();
    ctx.moveTo(x + 14 * k, by - 49 * k); ctx.lineTo(x + 30 * k, by - 49 * k); ctx.quadraticCurveTo(x + 40 * k, by - 48 * k, x + 42 * k, by - 35 * k); ctx.lineTo(x + 14 * k, by - 35 * k); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(x + 14 * k, by - 50 * k, 30 * k, 15 * k); ctx.clip(); head(ctx, x + 24 * k, by - 38 * k, k * 0.9); ctx.restore();
    if (st.pal) { ctx.save(); ctx.beginPath(); ctx.rect(x - 40 * k, by - 49 * k, 12 * k, 12 * k); ctx.clip(); petHead(ctx, st.palKind, x - 36 * k, by - 41 * k, k * 0.8, st.t, st.pal - 1); ctx.restore(); }
    if (lit) { ctx.fillStyle = 'rgba(255,214,140,0.35)'; ctx.fillRect(x - 40 * k, by - 49 * k, 44 * k, 12 * k); }
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1 * k; ctx.beginPath(); ctx.moveTo(x + 8 * k, by - 30 * k); ctx.lineTo(x + 8 * k, by - 6 * k); ctx.stroke();
    ctx.fillStyle = '#fff3c4'; circle(ctx, x + 44 * k, by - 18 * k, 3 * k);
    ctx.fillStyle = '#ff6b6b'; ellipse(ctx, x - 45 * k, by - 16 * k, 1.8 * k, 3 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; rrect(ctx, x - 42 * k, by - 28 * k, 70 * k, 2.5 * k, 1.2 * k); ctx.fill();
    const T = st.tier || 0;
    if (T >= 1) { // kapıda çiçek desenleri
      for (const [fx, fy, c] of [[-34, -18, '#ffd56b'], [-20, -14, '#ff8fb1'], [-6, -19, '#fbf4e6']]) {
        ctx.fillStyle = c; for (let i = 0; i < 5; i++) { const a = i * TAU / 5; circle(ctx, x + fx * k + Math.cos(a) * 2.6 * k, by + fy * k + Math.sin(a) * 2.6 * k, 1.8 * k); }
        ctx.fillStyle = '#e8834a'; circle(ctx, x + fx * k, by + fy * k, 1.4 * k);
      }
    }
    if (T >= 2) { // arkada bisiklet
      ctx.strokeStyle = '#3b4252'; ctx.lineWidth = 1.4 * k;
      for (const wx of [-60, -50]) { ctx.beginPath(); ctx.arc(x + wx * k, by - 22 * k, 5 * k, 0, TAU); ctx.stroke(); }
      line(ctx, [x - 60 * k, by - 22 * k, x - 55 * k, by - 28 * k, x - 50 * k, by - 22 * k], 1.4 * k, P.hat);
      line(ctx, [x - 47 * k, by - 26 * k, x - 52 * k, by - 26 * k], 1.4 * k, '#3b4252');
    }
    if (T >= 3) { // tavanda güneş paneli
      ctx.fillStyle = '#2f4a7a'; rrect(ctx, x - 12 * k, by - 60 * k, 30 * k, 4 * k, 1 * k); ctx.fill();
      ctx.strokeStyle = 'rgba(180,210,255,0.6)'; ctx.lineWidth = 0.6 * k; ctx.beginPath();
      for (let i = 1; i < 5; i++) { ctx.moveTo(x - 12 * k + i * 6 * k, by - 60 * k); ctx.lineTo(x - 12 * k + i * 6 * k, by - 56 * k); } ctx.stroke();
    }
    const vrim = T >= 4 ? GOLD : '#c7ccd8';
    wheel(ctx, x - 28 * k, y - 11 * k, 11 * k, st.wheel, k, '#22262f', vrim);
    wheel(ctx, x + 28 * k, y - 11 * k, 11 * k, st.wheel, k, '#22262f', vrim);
    if (T >= 4) { // tavan kenarında ışık zinciri
      const cols = ['#ffd56b', '#ff8fb1', '#6fd3c1', '#b9a2f0'];
      // diğer gezginlerde saydamlık üstten gelir: ışıklar onunla çarpılır
      const a0 = ctx.globalAlpha;
      for (let i = 0; i < 10; i++) {
        const lx = x - 42 * k + i * 8.4 * k, a = 0.55 + 0.45 * Math.sin(st.t * 3 + i);
        ctx.fillStyle = cols[i % 4]; ctx.globalAlpha = a0 * a; circle(ctx, lx, by - 53 * k + Math.sin(i * 1.3) * 0.8 * k, 1.5 * k);
      }
      ctx.globalAlpha = a0;
      sparkles(ctx, x, by - 30 * k, k, st.t, 6, 100 * k, 50 * k);
    }
  }

  // Sıcak hava balonu: çizgili zarf, hasır sepet, brülör alevi
  function drawHotAir(ctx, x, y, k, st) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(st.t * 0.7) * 0.04);
    const env = new Path2D();
    env.moveTo(-12 * k, 6 * k);
    env.bezierCurveTo(-46 * k, -18 * k, -40 * k, -66 * k, 0, -66 * k);
    env.bezierCurveTo(40 * k, -66 * k, 46 * k, -18 * k, 12 * k, 6 * k);
    env.closePath();
    const T = st.tier || 0;
    ctx.fillStyle = P.jacket; ctx.fill(env);
    ctx.save(); ctx.clip(env);
    const cols = T >= 2 ? ['#ff8fb1', '#ffd56b', '#6fd3c1', '#b9a2f0'] : ['#fbf4e6', '#f0b445', '#2f9e8f', '#fbf4e6'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = cols[i]; ctx.beginPath();
      const x0 = -40 * k + i * 22 * k;
      ctx.ellipse(x0 + 9 * k, -30 * k, 5 * k, 40 * k, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(14 * k, -70 * k, 40 * k, 80 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ellipse(ctx, -16 * k, -46 * k, 6 * k, 12 * k, -0.3);
    if (T >= 4) { ctx.fillStyle = GOLD; ctx.fillRect(-46 * k, -14 * k, 92 * k, 3 * k); }
    ctx.restore();
    if (T >= 1) { // zarfın altından sarkan renkli flamalar
      const cols2 = ['#e84a5f', '#ffd56b', '#6fd3c1', '#fbf4e6', '#b9a2f0'];
      for (let i = 0; i < 5; i++) {
        const px = -14 * k + i * 7 * k, py = 1 * k + Math.sin(i * 1.4) * 1.5 * k, w = Math.sin(st.t * 5 + i) * 1 * k;
        ctx.fillStyle = cols2[i]; ctx.beginPath(); ctx.moveTo(px - 3 * k, py); ctx.lineTo(px + 3 * k, py); ctx.lineTo(px + w, py + 6 * k); ctx.closePath(); ctx.fill();
      }
    }
    ctx.fillStyle = '#c9553d'; rrect(ctx, -12 * k, 3 * k, 24 * k, 5 * k, 2 * k); ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,40,0.8)'; ctx.lineWidth = 1 * k;
    ctx.beginPath(); ctx.moveTo(-11 * k, 8 * k); ctx.lineTo(-9 * k, 20 * k); ctx.moveTo(11 * k, 8 * k); ctx.lineTo(9 * k, 20 * k);
    ctx.moveTo(-4 * k, 8 * k); ctx.lineTo(-4 * k, 20 * k); ctx.moveTo(4 * k, 8 * k); ctx.lineTo(4 * k, 20 * k); ctx.stroke();
    const fl = 5 + 2 * Math.sin(st.t * 23);
    ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, 10 * k, 14 * k, hex('#ffb060'), 0.7); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffd56b'; ctx.beginPath(); ctx.moveTo(-2.5 * k, 14 * k); ctx.quadraticCurveTo(0, (14 - fl * 2) * k, 2.5 * k, 14 * k); ctx.fill();
    head(ctx, -3 * k, 16 * k, k * 0.85);
    if (st.pal) petHead(ctx, st.palKind, 5 * k, 18 * k, k * 0.7, st.t, st.pal - 1); // sepetin kenarından Karabaş
    ctx.fillStyle = '#b98a55'; rrect(ctx, -10 * k, 19 * k, 20 * k, 13 * k, 2.5 * k); ctx.fill();
    ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 1 * k;
    ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(-10 * k, 19 * k + i * 3.2 * k); ctx.lineTo(10 * k, 19 * k + i * 3.2 * k); } ctx.stroke();
    if (T >= 3) { // kum torbaları
      for (const sx of [-12, 12]) { ctx.strokeStyle = 'rgba(80,60,40,0.8)'; ctx.beginPath(); ctx.moveTo(sx * 0.85 * k, 24 * k); ctx.lineTo(sx * k, 30 * k); ctx.stroke();
        ctx.fillStyle = '#c9b38a'; ellipse(ctx, sx * k, 33 * k, 3.4 * k, 4 * k); }
    }
    if (T >= 4) sparkles(ctx, 0, -32 * k, k, st.t, 9, 90 * k, 80 * k);
    ctx.restore();
  }

  // Süpersonik jet: iğne burunlu, delta kanatlı
  function drawJet(ctx, x, y, k, st) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(st.t * 0.9) * 0.02 - 0.03);
    const T = st.tier || 0;
    const fl = (12 + 5 * Math.sin(st.t * 37)) * (T >= 3 ? 1.8 : 1); // 3. aşama: art yakıcı
    const g = ctx.createLinearGradient(-52 * k, 0, (-52 - fl) * k, 0);
    g.addColorStop(0, 'rgba(255,240,190,0.9)'); g.addColorStop(1, 'rgba(255,150,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-50 * k, -3 * k); ctx.lineTo((-52 - fl) * k, 0); ctx.lineTo(-50 * k, 3 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9c2b4'; ctx.beginPath(); ctx.moveTo(-14 * k, 4 * k); ctx.lineTo(-44 * k, 13 * k); ctx.lineTo(-34 * k, 4 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.cream; ctx.beginPath();
    ctx.moveTo(-50 * k, -4 * k); ctx.lineTo(20 * k, -6 * k); ctx.quadraticCurveTo(44 * k, -4 * k, 62 * k, 1 * k);
    ctx.quadraticCurveTo(44 * k, 5 * k, 20 * k, 5 * k); ctx.lineTo(-50 * k, 5 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.jacket; ctx.beginPath(); ctx.moveTo(-50 * k, -3 * k); ctx.lineTo(-46 * k, -22 * k); ctx.lineTo(-38 * k, -22 * k); ctx.lineTo(-30 * k, -4 * k); ctx.closePath(); ctx.fill();
    ctx.fillRect(-46 * k, 0, 70 * k, 2 * k);
    ctx.fillStyle = P.glass; ctx.beginPath(); ctx.moveTo(18 * k, -5.5 * k); ctx.quadraticCurveTo(30 * k, -12 * k, 38 * k, -4 * k); ctx.lineTo(18 * k, -4 * k); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.moveTo(18 * k, -5.5 * k); ctx.quadraticCurveTo(30 * k, -12 * k, 38 * k, -4 * k); ctx.lineTo(18 * k, -4 * k); ctx.closePath(); ctx.clip();
    head(ctx, 26 * k, -3 * k, k * 0.6); ctx.restore();
    ctx.fillStyle = '#e2d9c8'; ctx.beginPath(); ctx.moveTo(14 * k, 3 * k); ctx.lineTo(-30 * k, 16 * k); ctx.lineTo(-24 * k, 4 * k); ctx.closePath(); ctx.fill();
    if (T >= 1) { ctx.fillStyle = T >= 4 ? GOLD : '#e84a5f'; ctx.beginPath(); ctx.moveTo(50 * k, -2.2 * k); ctx.quadraticCurveTo(57 * k, -1 * k, 62 * k, 1 * k); ctx.quadraticCurveTo(57 * k, 3.2 * k, 50 * k, 3.6 * k); ctx.closePath(); ctx.fill(); } // burun ucu
    if (T >= 2) { ctx.strokeStyle = T >= 4 ? GOLD : P.jacket; ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.moveTo(8 * k, 5 * k); ctx.lineTo(-26 * k, 14 * k); ctx.stroke(); } // kanat şeridi
    if (T >= 4) sparkles(ctx, 0, 0, k, st.t, 8, 100 * k, 30 * k);
    ctx.restore();
  }

  const FLYING = { balloon: true, plane: true, jet: true, rocket: true, sail: true, comet: true, warp: true, whale: true, startrain: true, anka: true, chrono: true };
  // Uçan araçların gökyüzündeki yüksekliği (sahne yüksekliğine oran). Kamera yerde kalır, yol hep görünür.
  // uzayda uzak halkalı gezegenin göründüğü araçlar
  const RINGED = { sail: 1, comet: 1, warp: 1, whale: 1, startrain: 1, anka: 1, chrono: 1 };
  const FLY_Y = { balloon: 0.4, plane: 0.42, jet: 0.38, rocket: 0.34, sail: 0.3, comet: 0.33, warp: 0.34, whale: 0.36, startrain: 0.36, anka: 0.34, chrono: 0.36 };
  // Araçların çizim sınırları (k = 1, çizim noktasına göre; görünüm aşamalarının en genişi): [sol, sağ] ve üst yükseklik.
  // Değerler araçlar tek tek çizilip piksel piksel ölçülerek bulundu.
  const VEH_EXT = { walk: [-23, 15], skates: [-23, 21], board: [-26, 25], bike: [-42, 37], horse: [-35, 41], moto: [-44, 43], car: [-46, 45],
    van: [-66, 46], train: [-340, 57], balloon: [-34, 34], plane: [-125, 49], jet: [-65, 61], rocket: [-61, 51], sail: [-106, 72], comet: [-117, 47], warp: [-76, 55],
    // trenin ışık rayı ve Anka'nın kuyruk uçları solarak biter: yerleşimde vagonun ve kuyruğun gövdeye yakın kısmı sayılır
    whale: [-87, 61], startrain: [-104, 66], anka: [-120, 62], chrono: [-60, 52] };
  const VEH_TOP = { walk: 85, skates: 84, board: 82, bike: 83, horse: 93, moto: 78, car: 71, van: 72, train: 76, balloon: 72, plane: 27, jet: 22, rocket: 24, sail: 80, comet: 52, warp: 34, whale: 66, startrain: 56, anka: 72, chrono: 52 };
  // Karabaş, Tekir ve Kızıl'ın yavaş araçlarda koştuğu yer (aracın gerisinde)
  const PAL_BACK = { walk: 34, skates: 38, board: 40, bike: 52, horse: 62 };
  const GHOST_SCALE = 0.8;
  const MSG_LIFE = 8; // konuşma balonu saniye
  function vehExtent(veh, tier, pal, short) {
    let [l, r] = VEH_EXT[veh] || [-30, 30];
    if (veh === 'train') l = short ? -148 : tier >= 3 ? -436 : -340;
    const back = RUNNER[pal] && PAL_BACK[veh];
    if (back) l = Math.min(l, -(back + 16));
    return [l, r];
  }
  // Sv. 150 ve 200 görünümleri: aracın arkasından akan yıldız tozu izi ve gökkuşağı kuyruğu.
  // Bütün araçlarda aynı biçimde çizilir (sahnede, garaj simgelerinde ve diğer gezginlerde).
  const RIBBON = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'];
  function trail(ctx, id, x, y, k, st) {
    const T = st.tier || 0;
    if (T < 5 || st.icon) return;
    // trende iz lokomotifin bacasından çıkıp vagonların üstünden akar (vagonların arkası çoğu zaman ekranın dışında kalır)
    const train = id === 'train';
    const rear = x + (train ? 10 : (VEH_EXT[id] || [-30, 30])[0]) * k;
    const cy = train ? y - (VEH_TOP.train + 6) * k : y - (VEH_TOP[id] || 60) * 0.42 * k, L = (train ? 170 : 130) * k, t = st.t || 0;
    ctx.save();
    const a0 = ctx.globalAlpha; // diğer gezginlerde solma saydamlığı
    if (T >= 6) {
      // gökkuşağı kuyruğu: altı ince bant, uca doğru dalgalanıp solar
      ctx.lineCap = 'round'; ctx.lineWidth = 2.6 * k;
      RIBBON.forEach((c, j) => {
        ctx.strokeStyle = c; ctx.beginPath();
        for (let i = 0; i <= 16; i++) {
          const u = i / 16, px = rear - u * L, py = cy + (j - 2.5) * 2.3 * k + Math.sin(u * 5 - t * 3.2) * 5 * k * u;
          if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        const g = ctx.createLinearGradient(rear, 0, rear - L, 0);
        g.addColorStop(0, c); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g; ctx.globalAlpha = a0 * 0.7; ctx.stroke();
      });
      ctx.globalAlpha = a0;
    }
    // yıldız tozu: kıyafet renklerinde ve altın tonlarında küçük parıltılar geriye akar
    const cols = [P.hat, P.jacket, GOLD_HI, '#ffffff'];
    for (let i = 0; i < 9; i++) {
      const u = ((i / 9) + t * 0.45) % 1, a = (1 - u) * (0.55 + 0.45 * Math.sin(t * 5 + i));
      if (a <= 0.05) continue;
      const px = rear - u * L, py = cy + (hash(i * 5.7) - 0.5) * 16 * k + Math.sin(u * 6 + i) * 3 * k, r = (1.2 + 2.6 * (1 - u)) * k;
      ctx.globalAlpha = a0 * a; ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath(); ctx.moveTo(px, py - r); ctx.quadraticCurveTo(px, py, px + r, py); ctx.quadraticCurveTo(px, py, px, py + r);
      ctx.quadraticCurveTo(px, py, px - r, py); ctx.quadraticCurveTo(px, py, px, py - r); ctx.fill();
    }
    ctx.restore();
  }
  // Sv. 250 (7. aşama, v1.65): iki altın kelebek aracın çevresinde yatık bir sekiz çizerek dolanır (önünden ve arkasından
  // geçer, kanat çırpar). Sv. 300 (8. aşama): aracın çevresinde kıyafet ve altın renklerinde altı küçük yıldızın döndüğü bir
  // yörünge; yıldızlar aracın önünden ve arkasından geçer. Sv. 400 (9. aşama, v1.61): ilkine eğik ikinci bir yörüngede ters
  // yönde dönen dört küçük, kuyruklu ay. Sv. 500 (10. aşama): arkada yavaşça dönen yumuşak ışık huzmeleri, yıldızlar daha
  // iri ve kısa ışık kuyruklu. Bütün araçlarda aynı biçimde çizilir (sahne, garaj simgesi, diğer gezginler).
  function aura(ctx, id, x, y, k, st, front) {
    const T = st.tier || 0;
    if (T < 7) return;
    const [l, r] = VEH_EXT[id] || [-30, 30], top = VEH_TOP[id] || 60, t = st.t || 0, train = id === 'train';
    const cx = x + (train ? 10 : (l + r) / 2) * k, cy = y - top * 0.42 * k;
    // simgede yörünge daralır (geniş araçlarda yıldızlar simgenin kenarından taşmasın)
    const rx = (train ? 72 : Math.min(st.icon ? 56 : 92, (r - l) / 2 + 16)) * k * (st.icon ? 0.75 : 1), ry = Math.max(16, top * 0.34) * k;
    ctx.save();
    butterflies(ctx, cx, cy, rx, ry, k, st, front);
    if (T < 8) { ctx.restore(); return; }
    ctx.globalCompositeOperation = 'lighter';
    if (!front && T >= 10) {
      // ışık huzmeleri: merkezden dışa açılan, uca doğru solan on iki ince üçgen
      const R = rx * 1.45;
      for (let i = 0; i < 12; i++) {
        const a = t * 0.25 + i * TAU / 12, w = 0.09;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        g.addColorStop(0, `rgba(255,225,150,${((i % 2 ? 0.3 : 0.44) * (0.5 + 0.5 * (st.night || 0))).toFixed(3)})`); g.addColorStop(1, 'rgba(255,225,150,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R * 0.7); ctx.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R * 0.7);
        ctx.closePath(); ctx.fill();
      }
    }
    // yörünge çizgisi: arka yarısı aracın arkasında, ön yarısı önünde
    ctx.strokeStyle = 'rgba(255,240,200,0.4)'; ctx.lineWidth = 1.2 * k;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry * 0.55, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
    const cols = [GOLD_HI, P.hat, '#ffffff', P.jacket, GOLD, '#cfe0ff'], big = T >= 10 ? 1.45 : 1;
    for (let i = 0; i < 6; i++) {
      const ang = t * 0.9 + i * TAU / 6, depth = Math.sin(ang);
      if ((depth > 0) !== front) continue;
      const sx = cx + Math.cos(ang) * rx, sy = cy + depth * ry * 0.55, s = (2.7 + 0.8 * Math.sin(t * 4 + i)) * k * big * (0.85 + 0.15 * depth);
      if (T >= 10) for (let j = 1; j <= 4; j++) { // kısa ışık kuyruğu (yörüngede geride kalan noktalar)
        const aj = ang - j * 0.09, px = cx + Math.cos(aj) * rx, py = cy + Math.sin(aj) * ry * 0.55;
        ctx.fillStyle = `rgba(255,236,190,${(0.35 - j * 0.07).toFixed(3)})`; circle(ctx, px, py, s * (0.7 - j * 0.12));
      }
      glow(ctx, sx, sy, s * 4, hex(cols[i] && cols[i][0] === '#' && cols[i].length === 7 ? cols[i] : '#ffd56b'), 0.45);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = cols[i]; ctx.beginPath();
      ctx.moveTo(sx, sy - s * 1.8); ctx.quadraticCurveTo(sx, sy, sx + s * 1.8, sy); ctx.quadraticCurveTo(sx, sy, sx, sy + s * 1.8);
      ctx.quadraticCurveTo(sx, sy, sx - s * 1.8, sy); ctx.quadraticCurveTo(sx, sy, sx, sy - s * 1.8); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
    }
    if (T >= 9) {
      // ikinci yörünge (Sv. 400): eğik, ilkinden biraz dar; dört ay ters yönde döner, arkalarında soluk bir kuyruk
      const rot = -0.38, cr = Math.cos(rot), sr = Math.sin(rot), ax = rx * 0.84, ay = ry * 0.55 * 1.25;
      const at = (a, rr) => { const lx = Math.cos(a) * ax * rr, ly = Math.sin(a) * ay * rr; return [cx + lx * cr - ly * sr, cy + lx * sr + ly * cr]; };
      ctx.strokeStyle = 'rgba(190,245,235,0.32)'; ctx.lineWidth = 1 * k;
      ctx.beginPath(); ctx.ellipse(cx, cy, ax, ay, rot, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const ang = -t * 1.25 + i * TAU / 4 + 0.4, depth = Math.sin(ang);
        if ((depth > 0) !== front) continue;
        const s = (2.5 + 0.4 * Math.sin(t * 3 + i * 1.7)) * k * (0.85 + 0.15 * depth), [mx, my] = at(ang, 1);
        for (let j = 1; j <= 5; j++) { // kuyruk: dönüş yönünün tersinde, uca doğru incelir
          const [px, py] = at(ang + j * 0.07, 1);
          ctx.fillStyle = `rgba(200,250,240,${(0.3 - j * 0.05).toFixed(3)})`; circle(ctx, px, py, s * (0.8 - j * 0.12));
        }
        glow(ctx, mx, my, s * 3.6, [190, 245, 235], 0.5);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = i % 2 ? '#e6fbff' : '#bff3e6'; circle(ctx, mx, my, s);
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; circle(ctx, mx - s * 0.3, my - s * 0.3, s * 0.38);
        ctx.globalCompositeOperation = 'lighter';
      }
    }
    ctx.restore();
  }
  // Sv. 250: iki altın kelebek. Yol yatık bir sekiz (lemniskat): öndeki yarıda aracın önünden, arkadaki yarıda arkasından
  // geçer; ikincisi yarım tur geride ve biraz küçük. Kanatlar çırparken daralıp genişler, arkalarında soluk bir ışık kalır.
  function butterflies(ctx, cx, cy, rx, ry, k, st, front) {
    const t = st.t || 0, night = st.night || 0, ic = st.icon;
    for (let i = 0; i < 2; i++) {
      const a = t * 0.55 + i * Math.PI + 0.6, depth = Math.cos(a + 0.4);
      if ((depth > 0) !== front) continue;
      const bx = cx + Math.sin(a) * rx * (ic ? 0.95 : 1.12), by = cy - ry * (ic ? 0.55 : 0.9) + Math.sin(2 * a) * ry * 0.45 + Math.sin(t * 2.3 + i) * 2 * k;
      const s = (ic ? 2.4 : 5.2) * k * (i ? 0.82 : 1) * (0.85 + 0.15 * depth), flap = 0.2 + 0.8 * Math.abs(Math.sin(t * (7 + i * 1.3) + i));
      const tilt = Math.cos(a) * 0.3 + Math.sin(t * 1.7 + i) * 0.12;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, bx, by, s * 3.6, [255, 214, 120], 0.25 + 0.25 * night);
      ctx.globalCompositeOperation = 'source-over';
      ctx.translate(bx, by); ctx.rotate(tilt);
      // önden görünüş: gövdenin iki yanında üstte iri, altta küçük kanat; çırparken yatay genişlikleri daralır
      ctx.strokeStyle = 'rgba(120,70,10,0.6)'; ctx.lineWidth = Math.max(0.6, 0.16 * s);
      for (const sd of [-1, 1]) {
        ctx.fillStyle = '#ffd56b';
        ctx.beginPath(); ctx.ellipse(sd * 0.95 * s * flap, -0.45 * s, 0.95 * s * flap + 0.05 * s, 0.85 * s, sd * 0.45, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f2a93b';
        ctx.beginPath(); ctx.ellipse(sd * 0.62 * s * flap, 0.55 * s, 0.6 * s * flap + 0.05 * s, 0.55 * s, -sd * 0.5, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; circle(ctx, sd * 1.05 * s * flap, -0.6 * s, 0.22 * s);
      }
      ctx.fillStyle = '#5b3a12'; ctx.beginPath(); ctx.ellipse(0, 0.1 * s, 0.2 * s, 0.85 * s, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#5b3a12'; ctx.lineWidth = Math.max(0.5, 0.11 * s);
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -0.65 * s); ctx.quadraticCurveTo(sd * 0.2 * s, -1.3 * s, sd * 0.55 * s, -1.45 * s); ctx.stroke(); }
      ctx.restore();
    }
  }
  function drawVehicle(ctx, id, x, y, k, st) {
    trail(ctx, id, x, y, k, st);
    aura(ctx, id, x, y, k, st, false);
    drawVehicleBody(ctx, id, x, y, k, st);
    aura(ctx, id, x, y, k, st, true);
  }
  function drawVehicleBody(ctx, id, x, y, k, st) {
    switch (id) {
      case 'walk': return drawWalker(ctx, x, y, k, st, false);
      case 'skates': return drawWalker(ctx, x, y, k, st, true);
      case 'board': return drawBoard(ctx, x, y, k, st);
      case 'horse': return drawHorse(ctx, x, y, k, st);
      case 'bike': return drawBike(ctx, x, y, k, st);
      case 'moto': return drawMoto(ctx, x, y, k, st);
      case 'car': return drawCar(ctx, x, y, k, st);
      case 'van': return drawVan(ctx, x, y, k, st);
      case 'train': return drawTrain(ctx, x, y, k, st);
      case 'balloon': return drawHotAir(ctx, x, y, k, st);
      case 'plane': return drawPlane(ctx, x, y, k, st);
      case 'jet': return drawJet(ctx, x, y, k, st);
      case 'rocket': return drawRocket(ctx, x, y, k, st);
      case 'sail': return drawSail(ctx, x, y, k, st);
      case 'comet': return drawComet(ctx, x, y, k, st);
      case 'warp': return drawStarship(ctx, x, y, k, st);
      case 'whale': return drawWhale(ctx, x, y, k, st);
      case 'startrain': return drawStarTrain(ctx, x, y, k, st);
      case 'anka': return drawAnka(ctx, x, y, k, st);
      case 'chrono': return drawChrono(ctx, x, y, k, st);
    }
  }

  /* ---------- Ağaçlar ve dekor ---------- */
  function drawTree(ctx, type, x, y, u, c, seed, night, snowy) {
    const trunk = c.trunk;
    switch (type) {
      case 'round': case 'autumn': case 'autumnRed': case 'sakura': {
        ctx.fillStyle = trunk; ctx.fillRect(x - 2.5 * u, y - 26 * u, 5 * u, 26 * u);
        ctx.fillStyle = c.dark; circle(ctx, x - 11 * u, y - 31 * u, 14 * u); circle(ctx, x + 11 * u, y - 33 * u, 15 * u);
        ctx.fillStyle = c.base; circle(ctx, x, y - 42 * u, 19 * u); circle(ctx, x - 9 * u, y - 33 * u, 12 * u);
        ctx.fillStyle = c.light; circle(ctx, x - 6 * u, y - 49 * u, 9 * u);
        if (type === 'sakura') { ctx.fillStyle = '#fff1f5'; for (let i = 0; i < 6; i++) circle(ctx, x + (hash(seed + i) - 0.5) * 34 * u, y - 30 * u - hash(seed + i * 3) * 24 * u, 1.8 * u); }
        break;
      }
      case 'poplar': case 'poplarGold': {
        ctx.fillStyle = trunk; ctx.fillRect(x - 2 * u, y - 16 * u, 4 * u, 16 * u);
        ctx.fillStyle = c.base; ellipse(ctx, x, y - 44 * u, 10 * u, 32 * u);
        ctx.fillStyle = c.light; ellipse(ctx, x - 3 * u, y - 50 * u, 4 * u, 20 * u);
        break;
      }
      case 'cypress': {
        ctx.fillStyle = trunk; ctx.fillRect(x - 1.5 * u, y - 8 * u, 3 * u, 8 * u);
        ctx.fillStyle = c.base; ctx.beginPath(); ctx.moveTo(x, y - 70 * u);
        ctx.quadraticCurveTo(x + 11 * u, y - 30 * u, x + 6 * u, y - 6 * u); ctx.lineTo(x - 6 * u, y - 6 * u);
        ctx.quadraticCurveTo(x - 11 * u, y - 30 * u, x, y - 70 * u); ctx.fill();
        ctx.fillStyle = c.light; ellipse(ctx, x - 3 * u, y - 40 * u, 2.5 * u, 18 * u);
        break;
      }
      case 'pine': case 'snowpine': {
        ctx.fillStyle = trunk; ctx.fillRect(x - 2.5 * u, y - 12 * u, 5 * u, 12 * u);
        for (let i = 0; i < 3; i++) {
          const w = (20 - i * 5) * u, yb = y - (10 + i * 15) * u, h = 26 * u;
          ctx.fillStyle = c.base; ctx.beginPath(); ctx.moveTo(x - w, yb); ctx.lineTo(x, yb - h); ctx.lineTo(x + w, yb); ctx.closePath(); ctx.fill();
          ctx.fillStyle = c.dark; ctx.beginPath(); ctx.moveTo(x, yb - h); ctx.lineTo(x + w, yb); ctx.lineTo(x + w * 0.3, yb); ctx.closePath(); ctx.fill();
          if (type === 'snowpine' || snowy) {
            ctx.fillStyle = c.snow; ctx.beginPath(); ctx.moveTo(x - w * 0.45, yb - h * 0.55); ctx.lineTo(x, yb - h);
            ctx.lineTo(x + w * 0.45, yb - h * 0.55); ctx.quadraticCurveTo(x, yb - h * 0.45, x - w * 0.45, yb - h * 0.55); ctx.fill();
          }
        }
        break;
      }
      case 'palm': {
        ctx.strokeStyle = trunk; ctx.lineWidth = 4 * u; ctx.lineCap = 'round';
        const lean = (hash(seed) - 0.5) * 16 * u;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.2, y - 30 * u, x + lean, y - 56 * u); ctx.stroke();
        ctx.strokeStyle = c.base; ctx.lineWidth = 4 * u;
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (i - 2.5) * 0.62, tx = x + lean + Math.cos(a) * 26 * u, ty = y - 56 * u + Math.sin(a) * 12 * u + 12 * u;
          ctx.beginPath(); ctx.moveTo(x + lean, y - 56 * u); ctx.quadraticCurveTo(x + lean + Math.cos(a) * 16 * u, y - 66 * u + Math.sin(a) * 6 * u, tx, ty); ctx.stroke();
        }
        ctx.fillStyle = '#7a5a43'; circle(ctx, x + lean, y - 54 * u, 3 * u);
        break;
      }
      case 'cactus': {
        ctx.strokeStyle = c.base; ctx.lineCap = 'round'; ctx.lineWidth = 8 * u;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 42 * u); ctx.stroke();
        ctx.lineWidth = 5.5 * u; ctx.beginPath();
        ctx.moveTo(x, y - 18 * u); ctx.lineTo(x - 11 * u, y - 18 * u); ctx.lineTo(x - 11 * u, y - 30 * u);
        ctx.moveTo(x, y - 25 * u); ctx.lineTo(x + 10 * u, y - 25 * u); ctx.lineTo(x + 10 * u, y - 36 * u); ctx.stroke();
        ctx.strokeStyle = c.light; ctx.lineWidth = 1.4 * u; ctx.beginPath(); ctx.moveTo(x - 1.5 * u, y - 4 * u); ctx.lineTo(x - 1.5 * u, y - 40 * u); ctx.stroke();
        break;
      }
      case 'bush': case 'teabush': {
        ctx.fillStyle = c.dark; ellipse(ctx, x + 6 * u, y - 7 * u, 12 * u, 8 * u);
        ctx.fillStyle = c.base; ellipse(ctx, x - 4 * u, y - 9 * u, 13 * u, 10 * u);
        ctx.fillStyle = c.light; ellipse(ctx, x - 7 * u, y - 13 * u, 6 * u, 4 * u);
        break;
      }
      case 'rock': {
        ctx.fillStyle = c.dark; ellipse(ctx, x + 3 * u, y - 5 * u, 13 * u, 7 * u);
        ctx.fillStyle = c.base; ellipse(ctx, x - 1 * u, y - 7 * u, 11 * u, 8 * u);
        ctx.fillStyle = c.light; ellipse(ctx, x - 4 * u, y - 10 * u, 4 * u, 2.5 * u);
        break;
      }
      case 'olive': { // boğumlu gövdeli, gümüşi yapraklı zeytin ağacı
        ctx.strokeStyle = trunk; ctx.lineCap = 'round';
        const lean = (hash(seed) - 0.5) * 8 * u;
        ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.moveTo(x - 3 * u, y);
        ctx.bezierCurveTo(x - 6 * u, y - 10 * u, x + 4 * u + lean, y - 14 * u, x + lean, y - 24 * u); ctx.stroke();
        ctx.lineWidth = 3.4 * u; ctx.beginPath(); ctx.moveTo(x + 3 * u, y);
        ctx.bezierCurveTo(x + 7 * u, y - 9 * u, x - 2 * u + lean, y - 16 * u, x + 6 * u + lean, y - 26 * u); ctx.stroke();
        const cx = x + lean;
        ctx.fillStyle = c.dark; ellipse(ctx, cx - 12 * u, y - 30 * u, 13 * u, 8 * u); ellipse(ctx, cx + 13 * u, y - 31 * u, 12 * u, 8 * u);
        ctx.fillStyle = c.base; ellipse(ctx, cx, y - 37 * u, 18 * u, 10 * u); ellipse(ctx, cx - 7 * u, y - 31 * u, 11 * u, 7 * u);
        ctx.fillStyle = c.light; ellipse(ctx, cx - 5 * u, y - 42 * u, 9 * u, 4 * u);
        ctx.fillStyle = 'rgba(60,52,70,0.55)';
        for (let i = 0; i < 5; i++) circle(ctx, cx + (hash(seed + i) - 0.5) * 30 * u, y - 28 * u - hash(seed + i * 5) * 12 * u, 1.3 * u);
        break;
      }
      case 'chimney': { // peri bacası
        const h = (52 + hash(seed) * 30) * u;
        ctx.fillStyle = c.base; ctx.beginPath(); ctx.moveTo(x - 14 * u, y); ctx.quadraticCurveTo(x - 9 * u, y - h * 0.6, x - 5 * u, y - h);
        ctx.lineTo(x + 5 * u, y - h); ctx.quadraticCurveTo(x + 9 * u, y - h * 0.6, x + 14 * u, y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = c.dark; ctx.beginPath(); ctx.moveTo(x + 2 * u, y - h); ctx.lineTo(x + 5 * u, y - h);
        ctx.quadraticCurveTo(x + 9 * u, y - h * 0.6, x + 14 * u, y); ctx.lineTo(x + 6 * u, y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = c.cap; ellipse(ctx, x, y - h - 3 * u, 10 * u, 6 * u, -0.1);
        ctx.fillStyle = night > 0.45 ? 'rgba(255,214,140,0.95)' : 'rgba(80,60,50,0.55)';
        rrect(ctx, x - 2.5 * u, y - h * 0.45, 5 * u, 7 * u, 2.5 * u); ctx.fill();
        break;
      }
    }
  }

  /* ---------- Sahne sınıfı ---------- */
  class Scene {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.t = 0;
      this.tod = 0.49;           // günün saati (0..1): 0.25 gün doğumu, 0.5 öğle, 0.75 gün batımı
      this.mode = 'light'; this.drift = 0;
      // Gün döngüsü: sahne sayfa temasından bağımsız olarak kendi gününü yaşar
      this.cycle = false; this.cycTod = 0.49; this.dayFrac = 0.5; this.duskK = 0;
      this.anchor = this.anchorFrom = this.anchorTo = 0.49; this.anchorT = 1;
      this.scroll = Math.random() * 50000;
      this.vs = 30;              // görsel kayma hızı (px/sn)
      this.alt = 0; this.altTarget = 0;
      this.vehicle = 'walk';
      this.biome = 'meadow';
      this.palFrom = biomePal('meadow'); this.palTo = this.palFrom; this.blend = 1;
      this.shapeFrom = BIOMES.meadow; this.shapeTo = BIOMES.meadow;
      this.roadFrom = 'path'; this.roadTo = 'path'; this.roadBlend = 1;
      this.phase = 0; this.wheel = 0;
      this.stepKick = 0;
      this.layers = {
        mid:   { par: 0.22, items: [], next: 0 },
        near:  { par: 0.5,  items: [], next: 0 },
        road:  { par: 1.0,  items: [], next: 0 },
        lamps: { par: 1.0,  items: [], next: 0 },
        fg:    { par: 1.35, items: [], next: 0 },
      };
      this.clouds = []; this.birds = []; this.balloons = [];
      this.parts = []; this.floats = [];
      this.gift = null; this.star = null; this.seed = null; this.chest = null;
      // Turna sürüsü (Turna Yolu): V düzeninde soldan sağa, yolcuyla aynı yöne uçar
      this.cranes = null;
      // Ateşböceği Yolu: gece çimenlerdeki ateşböcekleri (fireflyAmb), yakalanabilir sürü (swarm) ve
      // etki süresince yolcuya eşlik eden ışık bulutu (glowOn: game.js verir, glowA: yumuşak beliriş/kayboluş)
      this.swarm = null; this.fireflyAmb = false; this.glowOn = false; this.glowA = 0;
      // Bulut Yolu: bir şeye benzeyen bulut (dream); dokununca kısa bir an canlanır ve dağılır
      this.dream = null;
      // Kâğıt uçak (mektup): soldan gelir, ortalarda bir takla atıp sağdan çıkar
      this.plane = null;
      // Yadigâr: bulunmamış bölge hatırası yol kenarında bir cam kabarcık içinde süzülür (keepOk: oyun "henüz bulunmadı" der)
      this.keep = null; this.keepOk = null;
      // Yabani tilki: ormanlık bölgelerde yolcunun önünde tırısla koşar (game.js sayar)
      this.fox = null;
      // Takımyıldız: gece gökyüzünde parlayan yıldızlar dokunarak birleştirilir (constel); bulunanlar (constFound) hep gökyüzünde kalır
      this.constel = null; this.constFound = [];
      // Uçurtma (Uçurtma Yolu): ipi kopmuş süzülür (free); dokununca yolcuya bağlanır (tied, game.js kiteOn verir);
      // etki bitince ipi bırakır ve uzaklaşarak solar (gone)
      this.kite = null; this.kiteOn = false;
      // Yunus sürüsü: denizli bölgelerde uzak denizden sıçrayarak yolcuyla aynı yöne yüzer (game.js sayar).
      // seaLine: deniz yüzeyinin y'si (her karede uzak katman çizilirken güncellenir)
      this.dolphins = null; this.seaLine = 0;
      // Kuş Defteri: bölgenin kuşu (ya da küçük sürüsü) gökyüzünden geçer; dokununca deftere yazılır (game.js sayar)
      this.bird = null;
      // Takvim: 'harvest' (ekim–kasım) olunca tarla bölgelerinin yol kenarında balkabakları belirir (game.js verir)
      this.festival = IT.festival(); this.pumpkinSeen = false;
      // Diğer gezginler (Yolcular): game.js listeyi verir, sahne yumuşakça ekler/çıkarır
      this.others = []; this.ghosts = new Map();
      // Hazır mesajlar: gezginin (ya da yolcunun) başının üstünde konuşma balonu
      this.msgs = new Map(); this.myMsg = null;
      this.stars = Array.from({ length: 170 }, () => ({ x: Math.random(), y: Math.random() * 0.75, r: Math.random() * 1.3 + 0.3, p: Math.random() * TAU }));
      this.nextBird = 8; this.nextBalloon = 2; this.signEvery = 2400;
      this.rain = 0; this.rainTarget = 0; this.rainbow = 0; this.rainbowTarget = 0;
      this.signText = () => null;
      // Yakınlaştırma: sahne gerçek boyutun 1/zoom katı bir "sanal ekrana" çizilip ölçeklenir. Gökyüzü, dağlar ve yolun yeri
      // ekranda sabit kalır; yakınlaşınca yolcu ve çevresi büyür, uzaklaşınca daha geniş bir manzara görünür. Geçiş yumuşaktır.
      this.zoom = 1; this.zoomTarget = 1;
      this.resize();
      for (let i = 0; i < 7; i++) this.spawnCloud(Math.random() * this.W);
      this.fill(true);
    }

    // Boyut değişmediyse tuvale dokunmaz (width/height atamak resmi siler, bir kare boş görünürdü); değiştiyse true döner
    resize() {
      const r = this.canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      const RW = Math.max(1, r.width), RH = Math.max(1, r.height), pw = Math.round(RW * dpr), ph = Math.round(RH * dpr);
      if (RW === this.RW && RH === this.RH && dpr === this.dpr && this.canvas.width === pw && this.canvas.height === ph) return false;
      this.dpr = dpr; this.RW = RW; this.RH = RH;
      this.canvas.width = pw; this.canvas.height = ph;
      // ölçek gerçek boyuttan gelir: sanal ekranda aynı kalır, ekranda zoom katı büyür
      this.k = clamp(Math.min(this.RH / 640, this.RW / 560), 0.55, 1.35);
      this.applyZoom();
      return true;
    }
    applyZoom() {
      const z = this.zoom;
      this.W = this.RW / z; this.H = this.RH / z;
      this.ctx.setTransform(this.dpr * z, 0, 0, this.dpr * z, 0, 0);
      this.travelerX = Math.round(this.W * (this.RW < 640 ? 0.36 : 0.32));
    }
    setZoom(z, instant) { this.zoomTarget = z; if (instant) { this.zoom = z; this.applyZoom(); } }
    // Yazılar (isim etiketleri, balonlar, uçan yazılar) uzaklaşınca küçülmesin: ekranda en az normal boyutta kalır
    tz() { return 1 / Math.min(1, this.zoom); }

    setBiome(id, instant) {
      if (id === this.biome && !instant) return;
      const cur = blendPal(this.palFrom, this.palTo, this.blend);
      this.palFrom = instant ? biomePal(id) : cur;
      this.palTo = biomePal(id);
      this.shapeFrom = instant ? BIOMES[id] : (this.blend > 0.5 ? this.shapeTo : this.shapeFrom);
      this.shapeTo = BIOMES[id];
      this.blend = instant ? 1 : 0;
      this.biome = id;
      if (instant) { for (const L of Object.values(this.layers)) { L.items = []; L.next = 0; } this.fill(true); }
    }

    // Açık tema: güneşli gündüz (sabah ↔ ikindi arası yavaşça salınır). Koyu tema: yıldızlı gece.
    setMode(mode, instant) {
      if (mode === this.mode && !instant) return;
      this.mode = mode;
      const center = mode === 'dark' ? 0.99 : 0.49;
      let target = Math.floor(this.anchor) + center;
      while (target < this.anchor + 0.05) target += 1;
      if (instant) { this.anchor = this.anchorFrom = this.anchorTo = target; this.anchorT = 1; this.tod = ((target % 1) + 1) % 1; }
      else { this.anchorFrom = this.anchor; this.anchorTo = target; this.anchorT = 0; }
    }

    // Gün döngüsünü aç/kapat. Kapanınca sahne o anki saatten temaya (gündüz ya da gece) yumuşakça döner.
    setCycle(on) {
      if (on === this.cycle) return;
      this.cycle = on;
      if (on) { this.cycTod = this.tod; return; }
      this.anchor = this.anchorFrom = this.anchorTo = this.cycTod; this.anchorT = 1; this.drift = 0;
      const m = this.mode; this.mode = null; this.setMode(m);
    }
    // Bir tam günün süresi (sn); gündüz ve gece payı bölgenin mevsimine göre değişir
    get cyclePeriod() { return 600; }
    dayLength(biome) {
      const b = BIOMES[biome || this.biome];
      return { day: b.day * this.cyclePeriod, night: (1 - b.day) * this.cyclePeriod, season: b.season };
    }

    // Dil ya da birim değişince yoldaki tabelaları yeni metinle yeniden yaz
    relabel() {
      for (const it of this.layers.road.items) if (it.type === 'sign') { const t = this.signText(); if (t) it.txt = t; }
    }

    setVehicle(id, instant) {
      const v = IT.VEH[id];
      if (id !== this.vehicle && !instant) this.burst(this.travelerX, this.riderY() - 30 * this.k, 26, ['#ffd56b', '#ffffff', '#ffb067']);
      this.vehicle = id;
      this.altTarget = v.alt;
      if (instant) this.alt = v.alt;
      if (v.road !== this.roadTo) { this.roadFrom = this.roadTo; this.roadTo = v.road; this.roadBlend = instant ? 1 : 0; }
    }

    // Hava: yağmur ve gökkuşağı yavaşça belirip kaybolur (0..1)
    // moon: gece yağmurdan sonra soluk ay gökkuşağı (renkleri beyaza çalar, gündüz değil gece görünür)
    setWeather(rain, rainbow, moon) { this.rainTarget = rain; this.rainbowTarget = rainbow; if (rainbow) this.moonbow = !!moon; }

    /* --- Katman nesneleri --- */
    fill(initial) {
      for (const [name, L] of Object.entries(this.layers)) {
        const off = this.scroll * L.par;
        if (initial || L.next === 0) L.next = off - 300;
        while (L.next < off + this.W + 300) {
          const it = this.spawn(name, L.next);
          if (it) { it.x = L.next; L.items.push(it); }
          L.next += it ? it.gap : 60;
        }
        L.items = L.items.filter(it => it.x - off > -420);
      }
    }
    spawn(layer, x) {
      const b = BIOMES[this.biome];
      const seed = Math.random() * 1000;
      switch (layer) {
        case 'mid': return { type: pick(b.midTrees), s: rand(0.32, 0.46), seed, gap: rand(18, 110) * (Math.random() < 0.2 ? 4 : 1) };
        case 'near': {
          const r = Math.random();
          if (b.windmills && r < 0.05) return { type: 'windmill', s: rand(0.62, 0.8), seed, gap: rand(140, 220) };
          if (b.houses && r < 0.07) return { type: 'house', s: rand(0.55, 0.7), seed, roof: pick(['#c8553d', '#b84a3a', '#d06a45', '#5b7fa8']), gap: rand(90, 160) };
          if (r < 0.22) return { type: pick(b.trees), tree: true, s: rand(0.5, 0.68), seed, gap: rand(30, 80) };
          return { type: b.deco, deco: true, s: rand(0.8, 1.2), seed, colors: b.flowers, gap: b.deco === 'lavender' || b.deco === 'tea' || b.deco === 'tulips' ? 34 : rand(22, 50) };
        }
        case 'road': {
          const r = Math.random();
          if (r < 0.1 && (x % this.signEvery) < 300) {
            const txt = this.signText();
            if (txt) return { type: 'sign', txt, seed, gap: rand(200, 300) };
          }
          if (r < 0.62) return { type: pick(b.trees), tree: true, s: rand(0.82, 1.08), seed, gap: rand(70, 260) };
          // hasat mevsimi: balkabağı öbeği, üstünde balkabağı olan saman balyası ya da (ova ve korularda) korkuluk.
          // pk: balkabakları [x, y, yarıçap] (birim); ilki oyulmuştur (lamp: gece yanar)
          if (r < 0.74 && this.festival === 'harvest' && IT.HARVEST_BIOMES[this.biome]) {
            const q = Math.random(), farm = this.biome === 'wheat' || this.biome === 'meadow' || this.biome === 'autumn';
            const kind = q < 0.22 && farm ? 'scare' : q < 0.55 ? 'bale' : 'patch';
            const pk = kind === 'scare' ? [[13, 0, 5.5]] : kind === 'bale' ? [[3, -15, 6.5], [21, 0, 5]]
              : [[0, 0, 7.5], [13, 0, 5.2]].concat(Math.random() < 0.5 ? [[-11, 0, 4.4]] : []);
            this.pumpkinSeen = true;
            return { type: 'pumpkin', kind, pk, s: rand(1.05, 1.3), seed, lamp: Math.random() < 0.75, hopAt: -9, gap: rand(150, 260) };
          }
          if (r < 0.78 && b.houses) return { type: 'fence', s: 1, seed, gap: rand(80, 140) };
          return { type: 'flowers', deco: true, s: 1.2, seed, colors: b.flowers, gap: rand(40, 120) };
        }
        case 'lamps': return { type: 'lamp', s: 1, seed, gap: rand(520, 760) };
        case 'fg': {
          const r = Math.random();
          if (b.deco === 'snow') return { type: 'drift', s: rand(0.8, 1.4), seed, gap: rand(60, 160) };
          if (b.deco === 'stones' || r < 0.15) return { type: 'pebbles', s: rand(0.8, 1.3), seed, gap: rand(50, 140) };
          return { type: 'tuft', s: rand(0.8, 1.4), seed, colors: b.flowers, flower: Math.random() < 0.3, gap: rand(30, 90) };
        }
      }
      return null;
    }

    spawnCloud(x) {
      const puffs = [];
      const n = 4 + (Math.random() * 4 | 0);
      for (let i = 0; i < n; i++) puffs.push({ dx: (i - n / 2) * rand(14, 20), dy: -rand(0, 14), r: rand(14, 26) });
      this.clouds.push({ x: x !== undefined ? x : this.W + 120, y: rand(0.06, 0.42), s: rand(0.7, 1.5), puffs, depth: rand(0.3, 1) });
    }

    /* --- Olaylar --- */
    onStep(crit) {
      this.stepKick = 1;
      const y = this.groundY();
      if (!FLYING[this.vehicle]) {
        for (let i = 0; i < (crit ? 10 : 4); i++) this.parts.push({ type: 'dust', x: this.travelerX - rand(0, 18) * this.k, y: y - rand(0, 4), vx: -rand(20, 60), vy: -rand(8, 26), life: 0, max: rand(0.5, 0.9), size: rand(2, 5) * this.k });
      }
      if (crit) this.burst(this.travelerX, this.riderY() - 40 * this.k, 18, ['#ffd56b', '#fff4c2', '#ffb067']);
    }
    burst(x, y, n, colors) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, sp = rand(40, 160);
        this.parts.push({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 0, max: rand(0.6, 1.2), size: rand(2, 4.5), color: pick(colors), rot: Math.random() * TAU });
      }
    }
    addFloat(text, opts) {
      opts = opts || {};
      const jitter = (Math.random() - 0.5) * 50 * this.k;
      const f = { text, x: this.travelerX + jitter + 10 * this.k, y: this.riderY() - (opts.big ? 96 : 80) * this.k, life: 0, max: opts.big ? 1.8 : 1.15, color: opts.color || '#ffffff', big: !!opts.big };
      // telefonda sahnenin üstünde yazı olmaz: harf ya da rakam içeren uçan yazılar çizilmez (yalnızca emoji uçar)
      if (this.textless && /[\p{L}\p{N}]/u.test(text)) return f;
      this.floats.push(f);
      if (this.floats.length > 24) this.floats.shift();
      return f;
    }
    spawnGift(duration) {
      this.gift = { x: this.W + 40, y: this.H * 0.3, t: 0, dur: duration || 14, caught: false };
    }
    // Kayan yıldız: gökyüzünün üst kısmında sağdan sola, aşağı doğru süzülür
    spawnStar() {
      const W = this.W, H = this.H, ang = rand(0.32, 0.52), sp = W * rand(0.15, 0.2);
      this.star = { x: W * rand(0.5, 1.02), y: H * rand(0.12, 0.24), vx: -Math.cos(ang) * sp, vy: Math.sin(ang) * sp, t: 0, dur: 4.2 };
    }
    hitStar(px, py) {
      const s = this.star;
      if (!s || s.t > s.dur) return false;
      if (Math.hypot(px - s.x, py - s.y) < 52 * Math.max(this.k, 0.8)) {
        this.burst(s.x, s.y, 30, ['#ffffff', '#cfe0ff', '#fff4c2', '#b9c8ff']);
        this.star = null;
        return true;
      }
      return false;
    }
    // Karahindiba tohumu: gündüz gökyüzünde sağdan sola rüzgârla süzülür, hafifçe dalgalanıp döner
    spawnSeed() { this.seed = { x: this.W + 30, y0: this.H * rand(0.2, 0.42), y: 0, t: 0, dur: 15, rot: 0, ph: Math.random() * TAU }; }
    hitSeed(px, py) {
      const s = this.seed;
      if (!s || s.t > s.dur) return false;
      if (Math.hypot(px - s.x, py - s.y) < 44 * Math.max(this.k, 0.8)) {
        // üflenen tohumun telleri dört bir yana savrulur
        for (let i = 0; i < 26; i++) { const a = Math.random() * TAU, sp = rand(30, 120); this.parts.push({ type: 'spark', x: s.x, y: s.y, vx: Math.cos(a) * sp - 30, vy: Math.sin(a) * sp - 40, life: 0, max: rand(0.8, 1.6), size: rand(1.4, 2.8), color: pick(['#ffffff', '#fbf8ee', '#fff8d6']), rot: 0 }); }
        this.seed = null;
        return true;
      }
      return false;
    }
    // Kâğıt uçak: yolcunun arkasından (soldan) süzülür, ortalarda yumuşak bir takla atar, sağdan çıkar
    // Dar telefonlarda takla konum kartının (sol üst) sağında ve biraz aşağıda atılır: kartın arkasında kalmasın
    spawnPlane() {
      const narrow = this.RW < 480;
      this.plane = { t: 0, dur: 16, y0: this.H * (narrow ? rand(0.4, 0.45) : rand(0.3, 0.4)), ph: Math.random() * TAU,
        loopAt: narrow ? rand(0.56, 0.62) : rand(0.36, 0.5), x: -60, y: 0, ang: 0 };
      this.planeMove(this.plane);
    }
    planeAt(p, t) {
      const k = Math.max(this.k, 0.8), u = t / p.dur, R = 30 * k;
      const lu = clamp((u - p.loopAt) / 0.14, 0, 1), a = TAU * lu * lu * (3 - 2 * lu);
      return { x: lerp(-50 * k, this.W + 50 * k, u) + R * Math.sin(a), y: p.y0 + Math.sin(t * 1.1 + p.ph) * 9 * k - R * (1 - Math.cos(a)) };
    }
    planeMove(p) {
      const a = this.planeAt(p, p.t), b = this.planeAt(p, p.t + 0.05);
      p.x = a.x; p.y = a.y; p.ang = Math.atan2(b.y - a.y, b.x - a.x);
    }
    hitPlane(px, py) {
      const p = this.plane;
      if (!p || p.t > p.dur) return false;
      if (Math.hypot(px - p.x, py - p.y) < 46 * Math.max(this.k, 0.8)) {
        // kâğıt açılır: krem ve altın kırpıntılar
        this.burst(p.x, p.y, 28, ['#fffdf6', '#f1e6c8', '#ffd56b', '#ffffff']);
        this.plane = null;
        return true;
      }
      return false;
    }
    // Turna sürüsü: önde bir lider, arkasında iki kola açılan V; gökyüzünün ortasında soldan sağa süzülür
    spawnCranes() {
      const n = pick([5, 7, 7, 9]);
      // konum kartının (sol üst) altından geçer; telefonda da görünsün diye çok küçülmez
      const k = Math.max(this.k, 0.8);
      this.cranes = { n, t: 0, x: -40 * k, y0: this.H * rand(0.36, 0.45), vx: (this.W + 300 * k) / 20, caught: 0, ph: Math.random() * TAU };
    }
    // i. turnanın yeri ve kanat konumu (lider 0; sonrakiler sırayla alt ve üst kolda geride)
    cranePos(c, i) {
      const k = Math.max(this.k, 0.8) * 1.1, rank = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
      const x = c.x - rank * 32 * k + Math.sin(c.t * 0.9 + i) * 2 * k;
      const y = c.y0 + Math.sin(c.t * 0.6 + c.ph) * 8 * k + side * rank * 12 * k + Math.sin(c.t * 1.3 + i * 1.7) * 1.5 * k;
      return { x, y, k, w: 0.2 + 0.8 * Math.sin(c.t * 9 - rank * 0.7 + c.ph) };
    }
    hitCranes(px, py) {
      const c = this.cranes;
      if (!c || c.caught) return false;
      const r = 30 * Math.max(this.k, 0.8);
      for (let i = 0; i < c.n; i++) {
        const p = this.cranePos(c, i);
        if (Math.hypot(px - (p.x + 6 * p.k), py - p.y) < r) {
          // sürü sevinçle kanat çırpıp yükselir; dokunulan yerden tüyler ve ışık dağılır
          c.caught = 0.001;
          this.burst(p.x, p.y, 26, ['#ffffff', '#e9f3ff', '#d3d7df', '#ffd56b']);
          return true;
        }
      }
      return false;
    }
    // Ateşböceği sürüsü: yolun ilerisinde, çimenlerin üstünde dönerek parlayan bir avuç ışık; yavaşça geride kalır
    spawnSwarm() {
      const k = Math.max(this.k, 0.8);
      this.swarm = { t: 0, x: this.W * rand(0.58, 0.84), y: this.groundY() - this.H * rand(0.1, 0.17), n: 13, caught: 0, ph: Math.random() * TAU, k };
    }
    // i. ateşböceğinin yeri: merkezin çevresinde basık bir halkada döner; yakalanınca omuzdaki bulutun yerine süzülür
    swarmPos(s, i) {
      const k = s.k, a = s.t * (1.1 + 0.25 * (i % 3)) + i * TAU / s.n + s.ph, r = (12 + 7 * Math.sin(s.t * 1.6 + i * 2.1)) * k;
      let x = s.x + Math.cos(a) * r, y = s.y + Math.sin(a) * r * 0.6 + Math.sin(s.t * 2.3 + i) * 3 * k;
      if (s.caught) { const f = this.glowHome(), q = clamp(s.caught / 1.1, 0, 1), e = q * q * (3 - 2 * q); x = lerp(x, f.x, e); y = lerp(y, f.y, e); }
      return { x, y };
    }
    // ışık bulutunun yeri: yolcunun omzunun üstü (uçan araçta da aracın üstünde kalır)
    glowHome() { return { x: this.travelerX - 26 * this.k, y: this.riderY() - 80 * this.k }; }
    hitSwarm(px, py) {
      const s = this.swarm;
      if (!s || s.caught || s.t < 0.5) return false;
      if (Math.hypot(px - s.x, py - s.y) < 44 * s.k) {
        s.caught = 0.001;
        this.burst(s.x, s.y, 22, ['#f4ff9e', '#d9ff7a', '#fff6c2', '#ffffff']);
        return true;
      }
      return false;
    }
    drawFireflies(ctx, night) {
      const k = this.k, t = this.t, sp = this.space || 0;
      const amb = this.fireflyAmb ? clamp((night - 0.35) / 0.3, 0, 1) * (1 - sp) : 0;
      if (amb <= 0 && !this.swarm && !(this.glowA > 0)) return;
      const day = 1 - night;
      ctx.save();
      // gece ışık eklenir (lighter); gündüz aynı ışık zeytin yeşili bir gövdeyle görünür kalır
      const dot = (x, y, a, r) => {
        if (a <= 0.01) return;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(210,255,120,${(0.16 * a).toFixed(3)})`; circle(ctx, x, y, r * 3.2);
        ctx.fillStyle = `rgba(248,255,200,${a.toFixed(3)})`; circle(ctx, x, y, r);
        if (day > 0.3) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(150,190,40,${(0.75 * a * day).toFixed(3)})`; circle(ctx, x, y, r * 0.95); }
      };
      if (amb > 0) {
        const gy = this.groundY(), W = this.W, H = this.H, span = W + 40;
        for (let i = 0; i < FIREFLIES; i++) {
          const h1 = fract(Math.sin(i * 12.9898) * 43758.5453), h2 = fract(Math.sin(i * 78.233) * 12543.1), h3 = fract(Math.sin(i * 39.37) * 9157.3);
          const x = (((h1 * span + t * (5 + 9 * h2) * (h3 > 0.5 ? 1 : -1) * k) % span) + span) % span - 20 + Math.sin(t * 0.7 + i) * 12 * k;
          // dörtte biri yolun önündeki çimenlerde, gerisi yolun ardındaki çayırda
          const y0 = i % 4 === 3 ? gy + H * 0.05 : gy - H * 0.2, y1 = i % 4 === 3 ? H - 8 * k : gy - H * 0.03;
          const y = y0 + (y1 - y0) * h2 + Math.sin(t * (0.9 + h3) + i * 1.7) * 7 * k;
          dot(x, y, amb * Math.pow(Math.max(0, Math.sin(t * (0.6 + 0.5 * h3) + i * 2.3)), 3), 1.3 * k);
        }
      }
      if (this.swarm) {
        const s = this.swarm, fade = Math.min(1, s.t) * clamp((SWARM_LIFE - s.t) / 2, 0, 1) * (s.caught ? clamp((1.2 - s.caught) / 0.35, 0, 1) : 1);
        if (!s.caught) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, s.x, s.y, 46 * s.k, [200, 255, 110], (0.08 + 0.1 * night) * fade); }
        for (let i = 0; i < s.n; i++) { const p = this.swarmPos(s, i); dot(p.x, p.y, fade * (0.55 + 0.45 * Math.sin(t * 5 + i * 1.9)), 1.6 * s.k); }
      }
      if (this.glowA > 0) {
        const f = this.glowHome(), a = this.glowA;
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, f.x, f.y + 34 * k, 72 * k, [200, 255, 110], 0.1 * a * (0.3 + 0.7 * night));
        for (let i = 0; i < 8; i++) {
          const ang = t * (1.4 + 0.2 * (i % 3)) + i * TAU / 8, r = (8 + 4 * Math.sin(t * 1.3 + i)) * k;
          dot(f.x + Math.cos(ang) * r, f.y + Math.sin(ang) * r * 0.7 + Math.sin(t * 2 + i) * 2 * k, a * (0.6 + 0.4 * Math.sin(t * 4 + i * 2)), 1.4 * k);
        }
      }
      ctx.restore();
    }
    // Bulut Yolu: sağdan bir şeye benzeyen bulut süzülür (sola, yolcuya doğru bakar). Göğün üst kısmında, bildirimlerin
    // üstünden geçer; geniş ekranda konum kartının arkasından da geçebilir (öbür bulutlar gibi)
    spawnDream(id) {
      const sh = CLOUD_SHAPES[id] || CLOUD_SHAPES.heart, k = Math.max(this.k, 0.8), narrow = this.RW < 480, s = k * (narrow ? 1.25 : 1.75);
      const y0 = Math.max(this.H * (narrow ? rand(0.17, 0.26) : rand(0.12, 0.2)), 56 * s);
      this.dream = { id, t: 0, x: this.W + 80 * s, y0, y: y0, s, caught: 0, pres: 0, ph: Math.random() * TAU,
        p: sh.p.map(([dx, dy, r], i) => ({ dx: -dx, dy, r, ph: i * 1.7 })), eye: sh.eye ? [-sh.eye[0], sh.eye[1]] : null };
    }
    hitDream(px, py) {
      const d = this.dream;
      if (!d || d.caught || d.t < 0.8) return false;
      if (Math.hypot(px - d.x, py - d.y) < 62 * d.s) {
        d.caught = 0.001;
        this.burst(d.x, d.y, 18, ['#ffffff', '#fff3d6', '#e3f0ff', '#ffe3ef']);
        return true;
      }
      return false;
    }
    // Bulut hayali: normal buluttan biraz parlak, kenarında ılık bir hale; yakalanınca zıplar, gözü kırpışır, sonra topakları
    // dışa doğru açılıp solar
    drawDream(ctx, d, col, night) {
      const s = d.s, c = d.caught;
      const fade = d.pres;
      if (fade <= 0.01) return;
      const hop = c && c < 0.9 ? Math.sin(Math.PI * c / 0.9) * 16 * s : 0, open = smooth(0.9, 2.2, c);
      const pos = p => {
        const w = Math.sin(this.t * 1.3 + p.ph) * 1.2 * s, len = Math.hypot(p.dx, p.dy) || 1;
        return { x: d.x + p.dx * s + p.dx / len * open * 30 * s, y: d.y - hop + p.dy * s + w + p.dy / len * open * 20 * s - open * 14 * s, r: p.r * s * (1 - 0.45 * open) * (1 + (c && c < 0.9 ? 0.06 * Math.sin(Math.PI * c / 0.9) : 0)) };
      };
      const pts = d.p.map(pos), body = mixc(col, WHITE, 0.4 + 0.12 * night), rim = night > 0.5 ? [200, 214, 255] : [255, 228, 196];
      const path = grow => { ctx.beginPath(); for (const q of pts) { ctx.moveTo(q.x + q.r + grow, q.y); ctx.arc(q.x, q.y, q.r + grow, 0, TAU); } };
      ctx.save();
      // ılık hale (gece ay ışığı mavisi): bulutu öbürlerinden ayırır ama dikkat çekecek kadar parlamaz
      ctx.shadowColor = css(rim, 0.75 * fade); ctx.shadowBlur = 16 * s;
      ctx.fillStyle = css(mixc(col, [128, 146, 192], 0.42 * (1 - night)), (0.6 - 0.25 * night) * fade); path(1.3 * s); ctx.fill();
      ctx.shadowBlur = 0;
      // alt gölge: gövde biraz yukarıda çizilir, topakların alt kenarında ince bir mavi-gri gölge kalır (biçim okunur)
      ctx.translate(0, -2.6 * s);
      ctx.fillStyle = css(body, 0.95 * fade); path(0); ctx.fill();
      // hacim: her topakta sol üste kaymış yumuşak bir parıltı
      ctx.fillStyle = css(WHITE, 0.32 * fade * (1 - night * 0.85));
      ctx.beginPath(); for (const q of pts) { ctx.moveTo(q.x - q.r * 0.2 + q.r * 0.55, q.y - q.r * 0.25); ctx.arc(q.x - q.r * 0.2, q.y - q.r * 0.25, q.r * 0.55, 0, TAU); } ctx.fill();
      // canlanınca göz: açılır, bir kez kırpışır
      if (d.eye && c && c < 1.2) {
        const ea = clamp(c / 0.15, 0, 1) * clamp((1.2 - c) / 0.25, 0, 1), blink = Math.abs(c - 0.55) < 0.07 ? 0.25 : 1;
        const ex = d.x + d.eye[0] * s, ey = d.y - hop + d.eye[1] * s;
        ctx.fillStyle = `rgba(60,70,100,${(0.8 * ea * fade).toFixed(3)})`;
        ctx.beginPath(); ctx.ellipse(ex, ey, 2.2 * s, 2.6 * s * blink, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    // Kuş Defteri: bölgenin kuşu (1–5 kuşluk küçük bir sürü) gökyüzünden geçer. Dokununca dürbün halkası belirir,
    // kuş sevinçle kanat çırpıp yükselir ve solar.
    // hudBottom: konum kartının alt kenarı (sanal px); kuş kartın arkasından geçmesin diye altından uçar
    spawnBird(id, hudBottom) {
      const f = BIRD_FLY[id];
      if (!f) return;
      const k = Math.max(this.k, 0.8) * f.s, n = f.n[0] + ((Math.random() * (f.n[1] - f.n[0] + 1)) | 0);
      if (hudBottom === undefined) hudBottom = this.RW < 480 ? 150 / this.zoom : 0;
      const y0 = Math.min(Math.max(this.H * rand(f.y[0], f.y[1]), hudBottom + (24 + rand(0, 30)) * k), this.H * 0.56);
      this.bird = { id, n, t: 0, fp: Math.random() * TAU, ph: Math.random() * TAU, y0, noted: 0, ring: null,
        x: f.dir > 0 ? -40 * k : this.W + 40 * k, vx: f.dir * (this.W + 80 * k + (n - 1) * (f.gap || 26) * k) / f.dur };
    }
    // i. kuşun yeri ve kanat konumu: sürü çapraz bir sıra halinde geride; dalgalı uçanlar çırpınca yükselir, süzülünce alçalır
    birdPos(b, i) {
      const f = BIRD_FLY[b.id], k = Math.max(this.k, 0.8) * f.s, t = b.t, calm = 1 - clamp(b.noted / 0.3, 0, 1);
      let y = b.y0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 6 * k + Math.sin(t * 0.55 + b.ph + i) * 7 * k;
      let w = 0.2 + 0.8 * f.amp * Math.sin(b.fp + i * 0.9);
      if (f.bound) {
        const cyc = (t * 1.1 + i * 0.3) % 1;
        w = lerp(w, 0.05, smooth(0.55, 0.62, cyc) * (1 - smooth(0.94, 1, cyc)) * calm);
        y += f.bound * 5 * k * Math.cos(cyc * TAU);
      } else if (f.glide) {
        const cyc = (t / 3.2 + i * 0.2) % 1, fp0 = 1 - f.glide;
        w = lerp(w, f.gw, (cyc < fp0 ? 0 : smooth(fp0, fp0 + 0.12, cyc) * (1 - smooth(0.9, 1, cyc))) * calm);
      }
      return { x: b.x - f.dir * i * (f.gap || 26) * k + Math.sin(t * 0.8 + i * 1.3) * 3 * k, y, k, w, dir: f.dir };
    }
    hitBird(px, py) {
      const b = this.bird;
      if (!b || b.noted || b.t < 0.5) return null;
      // büyük kuşlarda (kartal, baykuş) kanat uçlarına dokunmak da sayılır
      const r = 34 * Math.max(this.k, 0.8) * Math.max(1, BIRD_FLY[b.id].s * 0.8);
      for (let i = 0; i < b.n; i++) {
        const p = this.birdPos(b, i), cx = p.x + p.dir * 4 * p.k, cy = p.y - 2 * p.k;
        if (Math.hypot(px - cx, py - cy) < r) {
          b.noted = 0.001; b.ring = { x: cx, y: cy, t: 0, k: p.k };
          this.burst(cx, cy, 22, BIRD_SPARK[b.id]);
          return b.id;
        }
      }
      return null;
    }
    // Hasat mevsimi: oyulmuş balkabağının yeri (gece ışığı için) ve dokunuş
    pumpkinFace(it, x, y, k) {
      const s = it.s * k, p = it.pk[0];
      return { x: x + p[0] * s, y: y + p[1] * s - this.pumpkinHop(it) * s, r: p[2] * s };
    }
    pumpkinHop(it) { const u = (this.t - it.hopAt) / 0.7; return u >= 0 && u < 1 ? Math.abs(Math.sin(u * Math.PI * 2)) * 6 * (1 - u) : 0; }
    hitPumpkin(px, py) {
      const k = this.k, y = this.H * 0.79 + this.shift(0.66) + 2;
      for (const it of this.layers.road.items) {
        if (it.type !== 'pumpkin') continue;
        const x = it.x - this.scroll, s = it.s * k, tall = it.kind === 'scare';
        if (Math.hypot(px - (x + 6 * s), py - (y - (tall ? 24 : 10) * s)) < Math.max(tall ? 34 : 26, 22) * Math.max(s, 0.8)) {
          it.hopAt = this.t;
          this.burst(x + it.pk[0][0] * s, y - 8 * s, 16, ['#ffb347', '#ffd36b', '#e8832e', '#fff1c2']);
          return it;
        }
      }
      return null;
    }
    // Yabani tilki: çalılardan çıkar (gece önce gözleri parlar), bir süre yolcunun önünde koşup arada dönüp bakar,
    // sonra çalılara dalar. Dokununca sevinçle sıçrar ve uzaklaşır.
    spawnFox() { this.fox = { t: 0, dur: 15, ph: 0, happy: 0, out: 0 }; }
    foxPos() {
      const k = this.k, f = this.fox;
      const r = FLYING[this.vehicle] ? 40 : vehExtent(this.vehicle, this.vehTier || 0, null, false)[1];
      const run = f && f.out ? f.out * f.out * 260 * k : 0;
      const x = clamp(this.travelerX + (r + 120) * k, 60 * k, this.W - 50 * k) + run;
      // yolcuyla aynı şeritte (telefonda alt kutular yolun yakın kenarını örter)
      const gy = this.groundY() + 3 * k;
      // belirirken çalılardan hafifçe yükselir, sevinince sıçrar
      const rise = f ? (1 - clamp(f.t / 1.4, 0, 1)) * 8 * k : 0;
      const hop = f && f.happy ? Math.abs(Math.sin(Math.min(f.happy, 1.2) / 1.2 * Math.PI * 2)) * 14 * k : 0;
      return { x, y: gy + rise - hop, gy, k: k * 1.05 };
    }
    hitFox(px, py) {
      const f = this.fox;
      if (!f || f.happy || f.out || f.t < 0.8) return false;
      const p = this.foxPos(), k = Math.max(this.k, 0.8);
      if (Math.hypot(px - (p.x - 4 * k), py - (p.y - 14 * k)) < 42 * k) {
        f.happy = 0.001;
        this.burst(p.x + 8 * k, p.y - 24 * k, 22, ['#ffb27a', '#ffd56b', '#ffffff', '#fbf1e2']);
        return true;
      }
      return false;
    }
    // Yunuslar: 1–3 yunus soldan sağa yüzer, her biri arayla denizden sıçrayıp yeniden dalar (çıkışta ve dalışta su sıçrar).
    // Dokununca sürü sırayla yüksek bir taklayla sıçrar; selam bir kez sayılır.
    spawnDolphins() {
      const r = Math.random(), n = r < 0.25 ? 1 : r < 0.65 ? 2 : 3;
      this.dolphins = { t: 0, dur: 15, n, ph: Math.random() * 0.6, happy: 0, a: 0, air: [], drops: [], rings: [] };
    }
    dolScale() { return Math.max(this.k * 0.75, 0.62); }
    dolSpeed() { const d = this.dolphins, s = this.dolScale(); return (this.W + 120 * s + (d.n - 1) * 34 * s) / d.dur; }
    // sürünün başının x'i (yolcuyla aynı yöne, ekranı dur saniyede geçer)
    dolHead() { return -60 * this.dolScale() + this.dolSpeed() * this.dolphins.t; }
    // i. yunusun hâli: havadaysa yeri ve açısı (sudayken yalnızca x)
    dolPose(i) {
      const d = this.dolphins, s = this.dolScale(), sea = this.seaLine;
      const x0 = this.dolHead() - i * 34 * s, vx = this.dolSpeed();
      // selam: sırayla yüksek bir sıçrayış ve havada tam bir takla. Havadaki yunus önce o sıçrayışını bitirir (suya
      // birden düşmesin); selamdan sonra olağan sıçrayışlar sudan yeniden başlar (havada birden belirmesin)
      const hu = d.happy ? (d.happy - d.hs[i]) / 1.3 : -1;
      if (hu >= 0 && hu <= 1) {
        const h = 46 * s, fx = 22 * s;
        return { air: true, x: x0 + hu * fx, y: sea - Math.sin(hu * Math.PI) * h, ang: Math.atan2(-Math.PI * h * Math.cos(hu * Math.PI) / 1.3, vx + fx / 1.3) + hu * TAU };
      }
      const P = DOL_P, A = DOL_A;
      let tt = d.t - d.ph - i * 0.42;
      if (d.happy) {
        // taklanın hemen ardından kısa bir dalış, sonra sıçrayışlar baştan; selamı beklerken yeni sıçrayışa başlamaz
        if (hu > 1) { if (hu < 1.25) return { air: false, x: x0 }; tt = (hu - 1.25) * 1.3; }
        else if (tt >= 0 && d.t - (tt % P) > d.tapAt) return { air: false, x: x0 };
      }
      const u = tt < 0 ? -1 : (tt % P) / A;
      if (u < 0 || u > 1) return { air: false, x: x0 };
      const h = 26 * s, fx = 14 * s;
      return { air: true, x: x0 + u * fx, y: sea - Math.sin(u * Math.PI) * h, ang: Math.atan2(-Math.PI * h * Math.cos(u * Math.PI) / A, vx + fx / A) };
    }
    dolSplash(x, big) {
      const d = this.dolphins, s = this.dolScale(), sea = this.seaLine;
      for (let j = 0, m = big ? 12 : 7; j < m; j++) d.drops.push({ x: x + rand(-4, 4) * s, y: sea, vx: rand(-34, 34) * s, vy: -rand(36, big ? 110 : 80) * s, life: 0, max: rand(0.5, 0.85), r: rand(0.7, 1.5) * s });
      d.rings.push({ x, t: 0, w: big ? 1.4 : 1 });
    }
    hitDolphins(px, py) {
      const d = this.dolphins;
      // deniz solarken (denizsiz bölgeye geçiş, uzay) görünmeyen sürüye dokunulmaz
      if (!d || d.happy || d.t < 0.8 || !this.seaLine || !(d.vis > 0.4)) return false;
      const s = this.dolScale(), head = this.dolHead(), tail = head - (d.n - 1) * 34 * s;
      if (head < 10 * s || tail > this.W - 10 * s) return false;
      if (px > tail - 40 * s && px < head + 46 * s && py > this.seaLine - 80 * s && py < this.seaLine + 30 * s) {
        d.happy = 0.001; d.tapAt = d.t;
        // her yunus selama, havadaysa o sıçrayışı bitince başlar
        d.hs = Array.from({ length: d.n }, (_, i) => {
          const tt = d.t - d.ph - i * 0.42, u = tt < 0 ? -1 : (tt % DOL_P) / DOL_A;
          return Math.max(i * 0.18, u >= 0 && u <= 1 ? (1 - u) * DOL_A + 0.05 : 0);
        });
        return true;
      }
      return false;
    }
    // Uçurtma: rüzgârla sağdan sola süzülür, ipinin kopuk ucu altında sallanır. Dar telefonda konum kartının altından geçer.
    spawnKite() {
      const k = Math.max(this.k, 0.8), narrow = this.RW < 480;
      this.kite = { mode: 'free', t: 0, x: this.W + 40 * k, y: 0, y0: this.H * (narrow ? rand(0.42, 0.5) : rand(0.18, 0.32)),
        vx: -(this.W + 120 * k) / 18, ang: 0, ph: Math.random() * TAU, col: pick(KITE_COLS), a: 0 };
      this.kiteMove(this.kite, 0);
    }
    kiteFree() { return !!(this.kite && this.kite.mode === 'free'); }
    // Bağlı uçurtmanın ipinin tutulduğu yer (yolcunun eli ya da aracın penceresi) ve uçurtmanın durmak istediği yer
    kiteAnchor() {
      const k = this.k, top = VEH_TOP[this.vehicle] || 80;
      return { x: this.travelerX - 2 * k, y: this.riderY() - top * k * 0.55 };
    }
    kiteTarget(t) {
      const k = this.k, a = this.kiteAnchor(), fly = FLYING[this.vehicle] && this.flyT() > 0.5;
      // yerde arkada ve yukarıda uçar; uçan araçlarda aracın kuyruğunun gerisinde, biraz aşağıda süzülür
      const ext = fly ? -vehExtent(this.vehicle, this.vehTier || 0, null, false)[0] : 0;
      const dx = fly ? -(ext + 50) * k : (this.RW < 480 ? -50 : -95) * k, dy = fly ? 10 * k : -125 * k;
      return {
        x: clamp(a.x + dx + Math.sin(t * 0.8) * 10 * k, 24 * k, this.W - 24 * k),
        y: clamp(a.y + dy + Math.sin(t * 1.1 + 1) * 8 * k, this.H * 0.07, this.groundY() - 70 * k),
      };
    }
    kiteMove(c, dt) {
      const k = Math.max(this.k, 0.8);
      if (c.mode === 'free') {
        c.x += c.vx * dt;
        c.y = c.y0 + Math.sin(c.t * 0.9 + c.ph) * 14 * k + Math.sin(c.t * 2.3) * 4 * k;
        c.ang = -0.18 + Math.sin(c.t * 1.4 + c.ph) * 0.28;
      } else if (c.mode === 'tied') {
        // yolcunun gerisindeki yerine yumuşakça süzülür, orada rüzgârda hafifçe salınır
        const g = this.kiteTarget(c.t), e = 1 - Math.exp(-dt * 2.2);
        c.x += (g.x - c.x) * e; c.y += (g.y - c.y) * e;
        c.ang = -0.12 + Math.sin(c.t * 1.6 + c.ph) * 0.16;
      } else {
        // ipi bıraktı: rüzgâr onu geriye ve yukarıya alır
        c.x -= 70 * k * dt; c.y -= 34 * k * dt;
        c.ang = -0.3 + Math.sin(c.t * 2.2) * 0.3;
      }
    }
    // Yeniden açılışta etki sürüyorsa uçurtma doğrudan yerinde, solarak belirir
    tieKite() {
      const g = this.kiteTarget(0);
      this.kite = { mode: 'tied', t: 0, x: g.x, y: g.y, y0: g.y, vx: 0, ang: 0, ph: Math.random() * TAU, col: pick(KITE_COLS), a: 0 };
    }
    hitKite(px, py) {
      const c = this.kite;
      if (!c || c.mode !== 'free' || c.t < 0.6) return false;
      const s = 16 * Math.max(this.k, 0.8);
      if (Math.hypot(px - c.x, py - (c.y + 0.4 * s)) < 44 * Math.max(this.k, 0.8)) {
        c.mode = 'tied';
        this.burst(c.x, c.y, 24, [c.col[0], c.col[1], '#ffffff', '#fff4c2']);
        return true;
      }
      return false;
    }
    // Takımyıldız: gökyüzünün sağ üst bölgesinde (konum kartından uzak) 45 saniye boyunca parlar; yıldızları sırasız dokunulur,
    // ikisi de yanan yıldızların arası çizgiyle bağlanır. Hepsi yanınca tamamlanır ve 4 saniye parlayıp solar.
    // hud: konum kartının sağ kenarı (sanal px; game.js ölçer). Takımyıldız kartın sağında, dağların üstünde kalır.
    spawnConst(c, hud) {
      // kart ölçülmediyse dar telefonda varsayılan kart genişliği (~190 px)
      if (hud === undefined) hud = this.RW < 480 ? 190 / this.zoom : 0;
      const k = Math.max(this.k, 0.8), W = this.W, a = { minX: hud + 12 * k }, box = this.constBox(a);
      // dar telefonda kartın sağına yaslanır; geniş ekranda sağ yarıda rastgele
      const x0 = this.RW < 480 ? W - box.w - 10 * k : Math.max(W * 0.3, a.minX, W - box.w - 24 * k - Math.random() * W * 0.22);
      this.constel = Object.assign(a, { c, fx: x0 / W, fy: 0.05 + Math.random() * 0.12, t: 0, dur: 45, lit: c.s.map(() => 0), n: 0, done: 0 });
      // kartın yanında yer yoksa (uzun mesafe yazısı) kutu kartın altına taşar: game.js kartı soluklaştırır
      this.constel.over = this.constBox(this.constel).x < a.minX - 1;
    }
    // Kutu her çizimde yeniden kurulur: yakınlaştırma ya da döndürme sonrası da ekranın içinde ve uzak dağların
    // (~0,38H) üstünde kalır
    constBox(a) {
      const k = Math.max(this.k, 0.8), W = this.W, H = this.H, minX = a.minX || 0;
      const w = Math.max(60 * k, Math.min(220 * k, H * 0.3 / 0.62, this.RW < 480 ? Infinity : W * 0.42, W - minX - 10 * k)), h = w * 0.62;
      return { x: Math.min(Math.max((a.fx || 0) * W, minX), W - w - 10 * k), y: clamp((a.fy || 0) * H, H * 0.03, H * 0.34 - h), w, h };
    }
    constStarPos(a, i) {
      const b = this.constBox(a), s = a.c.s[i];
      return { x: b.x + s[0] * b.w, y: b.y + s[1] * b.h };
    }
    // En yakın sönük yıldıza dokunuş: { i, done } döner; aktif takımyıldız yoksa ya da süresi dolduysa null
    hitConst(px, py) {
      const a = this.constel;
      if (!a || a.done || a.t > a.dur) return null;
      const r = 30 * Math.max(this.k, 0.8);
      let best = -1, bd = r;
      for (let i = 0; i < a.c.s.length; i++) {
        if (a.lit[i]) continue;
        const p = this.constStarPos(a, i), d = Math.hypot(px - p.x, py - p.y);
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) return null;
      a.lit[best] = 0.001; a.n++;
      const p = this.constStarPos(a, best);
      this.burst(p.x, p.y, 10, ['#ffffff', '#cfe0ff', '#fff4c2']);
      if (a.n === a.c.s.length) { a.done = 0.001; this.burst(p.x, p.y, 30, ['#ffffff', '#cfe0ff', '#b9c8ff', '#fff4c2']); }
      return { i: best, n: a.n, done: !!a.done };
    }
    // Hazine sandığı: yolcunun önünde, yol kenarında 25 saniye parıldar
    spawnChest() { this.chest = { t: 0, dur: 25 }; }
    chestPos() {
      const k = this.k;
      return { x: Math.min(this.W - 50 * k, this.travelerX + 170 * k), y: this.groundY() - 4 * k };
    }
    hitChest(px, py) {
      const c = this.chest;
      if (!c) return false;
      const p = this.chestPos(), k = Math.max(this.k, 0.8);
      if (Math.hypot(px - p.x, py - (p.y - 14 * k)) < 46 * k) {
        this.burst(p.x, p.y - 16 * this.k, 40, ['#ffd56b', '#fff1c2', '#ffffff', '#e8b93c']);
        this.chest = null;
        return true;
      }
      return false;
    }
    // Yadigâr: aracın önünde, yolun biraz üstünde 20 saniye süzülür
    spawnKeep(id) {
      const k = IT.KEEP && IT.KEEP[id];
      if (!k || (this.keepOk && !this.keepOk(id))) return;
      this.keep = { id, e: k.e, t: 0, dur: 20, seed: Math.random() * TAU };
    }
    keepPos() {
      const k = this.k, c = this.keep, t = c ? c.t : 0, seed = c ? c.seed : 0;
      const r = FLYING[this.vehicle] ? 40 : vehExtent(this.vehicle, this.vehTier || 0, null, false)[1];
      const x = clamp(this.travelerX + (r + 64) * k, 40 * k, this.W - 40 * k) + Math.sin(t * 0.7 + seed) * 6 * k;
      return { x, y: this.groundY() - 50 * k + Math.sin(t * 1.6 + seed) * 5 * k };
    }
    hitKeep(px, py) {
      const c = this.keep;
      if (!c || c.t > c.dur) return null;
      const p = this.keepPos(), k = Math.max(this.k, 0.8);
      if (Math.hypot(px - p.x, py - p.y) < 40 * k) {
        this.burst(p.x, p.y, 36, ['#ffd56b', '#fff1c2', '#ffffff', '#cfe0ff']);
        this.keep = null;
        return c.id;
      }
      return null;
    }
    /* --- Diğer gezginler --- */
    // list: önceliğe göre sıralı (az önce konuşanlar, sonra en yakınlar) { pub, name, sub, veh, tier, outfit, pal, ahead }
    setOthers(list) { this.others = list || []; }
    // Gezginler aracının gerçek genişliğine göre dizilir: kendi aracından (vagonlar, köpek dahil) başlayıp aralarında boşluk
    // bırakarak öne ve geriye doğru. Yerde ve gökyüzünde iki ayrı sıra vardır; sığmayan gezgin gösterilmez (yumuşakça çekilir).
    ghostSlots() {
      const k = this.k, W = this.W, tx = this.travelerX, gap = 26 * k, sc = GHOST_SCALE;
      const nA = W < 640 ? 1 : W < 1000 ? 2 : 3, nB = W < 640 ? 1 : 2;
      const layer = v => (FLYING[v] ? 1 : 0), own = layer(this.vehicle);
      const [ol, or] = vehExtent(this.vehicle, this.vehTier || 0, this.companion, false);
      const ahead = [0, 1].map(L => (L === own ? tx + or * k + gap : tx + 30 * k));
      const behind = [0, 1].map(L => (L === own ? tx + ol * k - gap : tx - 30 * k));
      const out = [];
      let na = 0, nb = 0;
      for (const o of this.others) {
        if (o.ahead ? na >= nA : nb >= nB) continue;
        const L = layer(o.veh), [l, r] = vehExtent(o.veh, o.tier || 0, o.pal, true).map(v => v * k * sc);
        if (o.ahead) {
          const x = ahead[L] - l;
          if (x + r > W - 8) continue;
          ahead[L] = x + r + gap; out.push([o, x]); na++;
        } else {
          const x = behind[L] - r;
          if (x + l < 8) continue;
          behind[L] = x + l - gap; out.push([o, x]); nb++;
        }
      }
      return out;
    }
    updateGhosts(dt) {
      const seen = new Set();
      for (const [o, x] of this.ghostSlots()) {
        seen.add(o.pub);
        let g = this.ghosts.get(o.pub);
        // yeni gelen gezgin kendi tarafından süzülerek belirir
        if (!g) { g = { x: x + (o.ahead ? 70 : -70) * this.k, alpha: 0, phase: Math.random() * TAU, seed: Math.random() * TAU, wave: 0, lift: 0 }; this.ghosts.set(o.pub, g); }
        g.o = o; g.tx = x; g.gone = false;
      }
      for (const [pub, g] of this.ghosts) {
        if (!seen.has(pub)) g.gone = true;
        g.alpha = clamp(g.alpha + (g.gone ? -dt : dt) / 1.2, 0, 1);
        if (g.gone && g.alpha <= 0) { this.ghosts.delete(pub); continue; }
        g.x += (g.tx - g.x) * (1 - Math.exp(-dt * 1.4));
        g.phase += dt * 6.5;
        g.wave = Math.max(0, g.wave - dt);
      }
    }
    // Gezginin çizim noktası ve etiketin yüksekliği
    ghostPos(g) {
      const k = this.k, o = g.o, s = GHOST_SCALE;
      const x = g.x + Math.sin(this.t * 0.45 + g.seed) * 8 * k;
      const hop = g.wave > 0 ? Math.abs(Math.sin(g.wave * 9)) * 7 * k : 0;
      // uçan gezgin konum kartının altına denk gelirse (etiketi ve balonu da) kartın altında kalır; kartın kenarında
      // yumuşakça geçiş yapar (birden zıplamaz)
      const fy = this.flyY(o.veh, k) - 34 * k, under = clamp(((this.hudRight || 0) - (x - 120 * k)) / (60 * k), 0, 1);
      const y = FLYING[o.veh] ? lerp(fy, Math.max(fy, (this.hudB || 0) + ((VEH_TOP[o.veh] || 60) * s + 40) * k), under) + Math.sin(this.t * 0.8 + g.seed) * 4 * k : this.groundY() - 9 * k - hop;
      return { x, y, s, top: y - (VEH_TOP[o.veh] || 80) * k * s };
    }
    drawGhosts(ctx, night) {
      this.tags = [];
      if (!this.ghosts.size) return;
      const k = this.k;
      for (const g of this.ghosts.values()) {
        const o = g.o, p = this.ghostPos(g), ks = k * p.s;
        ctx.save();
        // uzaktaki gezgin: biraz saydam ve küçük
        ctx.globalAlpha = g.alpha * 0.72;
        if (!FLYING[o.veh]) { ctx.fillStyle = 'rgba(30,30,50,0.16)'; ellipse(ctx, p.x, p.y + 1, 22 * ks, 3 * ks); }
        const back = RUNNER[o.pal] && PAL_BACK[o.veh];
        if (back) RUNNER[o.pal](ctx, p.x - back * ks, p.y + 4 * ks, ks * 0.95, g.phase, this.t, 0);
        // tren kısa çizilir (lokomotif ve bir vagon): beş kişi trende olsa da yol kalabalıklaşmaz
        const st = { phase: g.phase, wheel: this.wheel, t: this.t + g.seed, night, tier: o.tier || 0, pal: 0, palKind: null, cars: o.veh === 'train' ? 1 : undefined };
        withOutfit(o.outfit, () => drawVehicle(ctx, o.veh, p.x, p.y, ks, st));
        if (o.pal === 'bird') drawGull(ctx, p.x - 20 * ks, p.top - 20 * ks + Math.sin(this.t * 1.6 + g.seed) * 4 * k, ks, this.t, 0);
        ctx.restore();
        // etiket gece örtüsünün üstünde çizilir (karanlıkta da okunsun)
        this.tags.push([p.x, p.top - 6 * k, o, g.alpha, g]);
      }
    }
    // Etiketler soldan sağa yerleşir; üst üste binen etiket yumuşakça yukarı kalkar ve ince bir çizgiyle gezgine bağlanır
    drawTags(ctx, night) {
      if (this.textless) return; // telefonda gezgin ad etiketleri çizilmez
      const k = Math.max(this.k, 0.85) * this.tz(), h = 30 * k, gap = 4 * k, placed = [];
      for (const [x, y, o, a, g] of (this.tags || []).slice().sort((p, q) => p[0] - q[0])) {
        const w = this.tagWidth(ctx, o), bx = clamp(x - w / 2, 4, this.W - w - 4);
        let top = y - h;
        for (let i = 0; i < 3; i++) {
          const hit = placed.find(r => bx < r.x + r.w + gap && bx + w + gap > r.x && top < r.y + r.h + gap && top + h + gap > r.y);
          if (!hit) break;
          top = hit.y - h - gap;
        }
        g.lift += ((y - h - top) - g.lift) * 0.18;
        placed.push({ x: bx, y: top, w, h });
        this.drawTag(ctx, x, y, o, a, night, bx, w, g.lift);
      }
    }
    tagWidth(ctx, o) {
      const k = Math.max(this.k, 0.85) * this.tz();
      ctx.font = `700 ${Math.round(11 * k)}px "Figtree", system-ui, sans-serif`;
      const w1 = ctx.measureText(o.name).width;
      ctx.font = `600 ${Math.round(9.5 * k)}px "Figtree", system-ui, sans-serif`;
      return Math.max(w1, ctx.measureText(o.sub).width) + 14 * k;
    }
    // İsim etiketi: ad ve senden ne kadar önde/geride olduğu
    // Gündüz beyaz, gece lacivert bir etiket; renkler gecenin derinliğine göre yumuşakça geçer
    // y: okun gösterdiği nokta; lift: komşu etikete değmemek için kalkma payı
    drawTag(ctx, x, y, o, a, night, bx, w, lift) {
      const k = Math.max(this.k, 0.85) * this.tz(), n = clamp(night || 0, 0, 1), h = 30 * k;
      const bg = css(mixc(hex('#ffffff'), hex('#262a48'), n), 0.86);
      ctx.save();
      ctx.globalAlpha = a * 0.92;
      if (lift > 1) { ctx.strokeStyle = bg; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - lift); ctx.stroke(); }
      y -= lift;
      ctx.fillStyle = bg; rrect(ctx, bx, y - h, w, h, 9 * k); ctx.fill();
      // küçük ok gezgini gösterir
      ctx.beginPath(); ctx.moveTo(x - 4 * k, y); ctx.lineTo(x + 4 * k, y); ctx.lineTo(x, y + 4 * k); ctx.closePath(); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = css(mixc(hex('#272b45'), hex('#eef0fb'), n)); ctx.font = `700 ${Math.round(11 * k)}px "Figtree", system-ui, sans-serif`;
      ctx.fillText(o.name, bx + w / 2, y - h + 10.5 * k);
      ctx.fillStyle = css(o.ahead ? mixc(hex('#10806e'), hex('#7fe0cd'), n) : mixc(hex('#6a6f8c'), hex('#aab0cc'), n)); ctx.font = `600 ${Math.round(9.5 * k)}px "Figtree", system-ui, sans-serif`;
      ctx.fillText(o.sub, bx + w / 2, y - h + 21.5 * k);
      ctx.restore();
    }
    /* --- Konuşma balonları --- */
    // life: balonun ömrü (el sallama kısa sürer)
    say(pub, text, life) { this.msgs.set(pub, { text, t: 0, life: life || MSG_LIFE }); }
    sayMine(text, life) { this.myMsg = { text, t: 0, life: life || MSG_LIFE }; }
    // El sallayan gezgin sahnede küçük bir sıçrayış yapar
    hop(pub) { const g = this.ghosts.get(pub); if (g) g.wave = 1.2; }
    drawBubbles(ctx) {
      const k = this.k;
      if (this.myMsg) {
        const top = this.riderY() - (VEH_TOP[this.vehicle] || 80) * k - this.stepKick * 2.5 * k;
        this.drawBubble(ctx, this.travelerX, top - 10 * k, this.myMsg);
      }
      for (const g of this.ghosts.values()) {
        const m = this.msgs.get(g.o.pub);
        if (!m || g.alpha <= 0.01) continue;
        const p = this.ghostPos(g), kk = Math.max(k, 0.85) * this.tz();
        // isim etiketinin üstünde (etiket yukarı kalktıysa o da kalkar)
        this.drawBubble(ctx, p.x, p.top - 6 * k - 30 * kk - (g.lift || 0) - 8 * k, m, g.alpha);
      }
    }
    // Balon küçük bir sıçrayışla açılır, hafifçe yükselir ve sonunda solar; kuyruğu konuşanı gösterir
    drawBubble(ctx, x, y, m, alpha) {
      // telefonda balonda yalnızca mesajın emojisi kalır (yazı panodaki durum satırında görünür)
      if (this.textless) {
        const e = (m.text.match(/^\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/u) || [''])[0];
        if (!e) return;
        m = Object.assign({}, m, { text: e });
      }
      const k = Math.max(this.k, 0.85) * this.tz(), t = m.t;
      const pop = t < 0.3 ? 1 + 2.7 * Math.pow(t / 0.3 - 1, 3) + 1.7 * Math.pow(t / 0.3 - 1, 2) : 1; // easeOutBack
      const a = (alpha === undefined ? 1 : alpha) * clamp(t / 0.15, 0, 1) * clamp((m.life - t) / 0.7, 0, 1);
      if (a <= 0) return;
      ctx.save();
      ctx.font = `700 ${Math.round(13 * k)}px "Figtree", system-ui, sans-serif`;
      const w = ctx.measureText(m.text).width + 22 * k, h = 28 * k;
      const by = y - Math.min(t, 1.2) * 4 * k;
      const bx = clamp(x - w / 2, 6, this.W - w - 6);
      ctx.translate(x, by); ctx.scale(pop, pop); ctx.translate(-x, -by);
      ctx.globalAlpha = a;
      ctx.shadowColor = 'rgba(20,20,50,0.25)'; ctx.shadowBlur = 10 * k; ctx.shadowOffsetY = 3 * k;
      ctx.fillStyle = '#ffffff';
      rrect(ctx, bx, by - h, w, h, 14 * k); ctx.fill();
      ctx.shadowColor = 'transparent';
      const tx = clamp(x, bx + 14 * k, bx + w - 14 * k);
      ctx.beginPath(); ctx.moveTo(tx - 6 * k, by - 1); ctx.lineTo(tx + 6 * k, by - 1); ctx.lineTo(x, by + 8 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#272b45'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.text, bx + w / 2, by - h / 2 + 0.5 * k);
      ctx.restore();
    }
    // Bir gezgine dokunulduysa onun verisini döner (el sallayan oyuncudur: 👋 kendi başında görünür)
    hitGhost(px, py) {
      const k = Math.max(this.k, 0.8);
      for (const g of this.ghosts.values()) {
        if (g.alpha < 0.4) continue;
        const p = this.ghostPos(g);
        if (Math.abs(px - p.x) < 34 * k && py > p.top - 34 * k && py < p.y + 8 * k) {
          return g.o;
        }
      }
      return null;
    }
    hitGift(px, py) {
      const g = this.gift;
      if (!g || g.caught) return false;
      if (Math.hypot(px - g.x, py - g.y) < 44 * Math.max(this.k, 0.8)) {
        g.caught = true;
        this.burst(g.x, g.y, 34, ['#ffd56b', '#fff4c2', '#ffb067', '#ffffff']);
        this.gift = null;
        return true;
      }
      return false;
    }

    /* --- Konumlar --- */
    // Kamera artık yükselmiyor: yer katmanları uçarken de yerinde kalır (eski irtifa kaydırması sıfır)
    shift() { return 0; }
    groundY() { return this.H * 0.842; }
    flyT() { return this.altTarget > 0 ? clamp(this.alt / this.altTarget, 0, 1) : 0; }
    riderY() {
      const fly = FLYING[this.vehicle];
      return fly ? lerp(this.groundY() - 40 * this.k, this.flyY(this.vehicle, this.k), this.flyT()) : this.groundY();
    }
    // Uçan aracın gökyüzündeki yeri: konum kartının altında kalır (dikey telefonda kart gökyüzünün üst yarısını kaplar,
    // araç kartın arkasında kalıyordu), yere de inmez. hudB: kartın alt kenarı (game.js verir, yumuşakça izlenir)
    flyY(veh, k) {
      const sky = this.H * FLY_Y[veh], low = this.groundY() - 70 * k;
      return Math.min(Math.max(sky, (this.hudB || 0) + (VEH_TOP[veh] || 60) * k * 0.9 + 4), Math.max(sky, low));
    }

    /* --- Güncelleme --- */
    update(dt, speedMs, night) {
      this.t += dt;
      // konum kartının alt kenarı değişince (ör. mesafe yazısı uzayınca, ekran dönünce) uçan araç yumuşakça yer değiştirir
      if (this.hudBottom !== undefined) this.hudB = this.hudB === undefined ? this.hudBottom : this.hudB + (this.hudBottom - this.hudB) * (1 - Math.exp(-dt * 3));
      if (this.zoom !== this.zoomTarget) {
        this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, dt * (this.reduced ? 30 : 7));
        if (Math.abs(this.zoomTarget - this.zoom) < 0.002) this.zoom = this.zoomTarget;
        this.applyZoom();
      }
      const target = Math.min(900, 34 * Math.log2(1 + 2 * Math.max(0, speedMs)));
      this.vs += (target - this.vs) * Math.min(1, dt * 2.5);
      this.alt += (this.altTarget - this.alt) * Math.min(1, dt * 0.9);
      if (Math.abs(this.altTarget - this.alt) < 0.001) this.alt = this.altTarget;
      // Roket ve yelkende gökyüzünün üstü koyulaşır, soluk yıldızlar çıkar; yer görünür kaldığı için etki kısmi
      this.space = clamp((this.alt - 0.45) / 0.5, 0, 1) * 0.6;
      // tema: gün saati her zaman ileri akar (koyu temaya geçiş = gün batımı, açığa geçiş = gün doğumu)
      this.drift += dt;
      if (this.anchorT < 1) {
        this.anchorT = Math.min(1, this.anchorT + dt / 6);
        const e = this.anchorT < 0.5 ? 2 * this.anchorT * this.anchorT : 1 - Math.pow(-2 * this.anchorT + 2, 2) / 2;
        this.anchor = lerp(this.anchorFrom, this.anchorTo, e);
      }
      if (this.cycle) {
        // Mevsime göre gündüz/gece payı ve alacakaranlık hızı; bölge değişince birkaç saniyede yumuşakça uyum sağlar
        const b = BIOMES[this.biome];
        this.dayFrac += (b.day - this.dayFrac) * Math.min(1, dt / 4);
        this.duskK += (b.dusk - this.duskK) * Math.min(1, dt / 4);
        const tod = ((this.cycTod % 1) + 1) % 1, isDay = tod >= 0.25 && tod < 0.75;
        // yarım gün (0,5 tod) gündüzde dayFrac, gecede 1 - dayFrac kadar sürer; ufka yakınken hız duskK ile değişir
        // 1/√(1−k²): hız çarpanı süreyi uzatmasın, yalnızca ufuk çevresine dağıtsın (gün yine cyclePeriod sürer)
        const rate = 0.5 / ((isDay ? this.dayFrac : 1 - this.dayFrac) * this.cyclePeriod) / Math.sqrt(1 - this.duskK * this.duskK);
        this.cycTod += dt * rate * (1 + this.duskK * Math.cos(4 * Math.PI * (tod - 0.25)));
        this.tod = ((this.cycTod % 1) + 1) % 1;
      } else this.tod = ((this.anchor + 0.12 * Math.sin(this.drift * TAU / 600)) % 1 + 1) % 1;
      this.blend = Math.min(1, this.blend + dt / 5);
      this.rain += clamp(this.rainTarget - this.rain, -dt / 4, dt / 4);
      this.rainbow += clamp(this.rainbowTarget - this.rainbow, -dt / 6, dt / 3);
      this.roadBlend = Math.min(1, this.roadBlend + dt / 0.8);
      const groundF = 1 - 0.35 * clamp(this.alt, 0, 1);
      const dx = this.vs * dt;
      this.scroll += dx * groundF;
      const k = this.k;
      // yürüyüş/teker fazları
      const stride = { walk: 23, skates: 34, board: 44, bike: 30, horse: 24, moto: 1, car: 1, van: 1, train: 1 }[this.vehicle] || 30;
      this.phase += dx / (stride * k) * (this.vehicle === 'bike' ? 1 : 1.1);
      this.wheel += dx / (13 * k);
      this.dogPhase = (this.dogPhase || 0) + dx / (11 * k);
      // At: toynaklar yere vurdukça (uzak arka ve yakın ön bacak) küçük toz bulutları kalkar
      if (this.vehicle === 'horse' && this.flyT() === 0) {
        const beat = Math.floor(this.phase / TAU) + Math.floor((this.phase + 2.6) / TAU);
        if (this.hoofBeat !== undefined && beat !== this.hoofBeat && !this.reduced) {
          const gx = this.travelerX + (beat % 2 ? 24 : -8) * k, gy = this.groundY();
          for (let i = 0; i < 3; i++) this.parts.push({ type: 'dust', x: gx + rand(-4, 4) * k, y: gy - rand(0, 3), vx: -rand(25, 60), vy: -rand(6, 20), life: 0, max: rand(0.4, 0.7), size: rand(1.6, 3.6) * k });
        }
        this.hoofBeat = beat;
      } else this.hoofBeat = undefined;
      this.stepKick = Math.max(0, this.stepKick - dt * 4);
      this.fill(false);

      // gökyüzü nesneleri
      const flyT = this.flyT();
      for (const c of this.clouds) c.x -= (this.vs * (0.05 + 0.5 * flyT) * c.depth + 6 * c.depth) * dt;
      this.clouds = this.clouds.filter(c => c.x > -260);
      if (this.clouds.length < (this.W > 900 ? 9 : 6)) this.spawnCloud();
      const b = BIOMES[this.biome];
      this.nextBird -= dt;
      if (this.nextBird <= 0) {
        this.nextBird = b.gulls ? rand(6, 14) : rand(18, 40);
        const n = 3 + (Math.random() * 4 | 0), y0 = rand(0.14, 0.34) * this.H;
        for (let i = 0; i < n; i++) this.birds.push({ x: this.W + 30 + i * rand(16, 30), y: y0 + rand(-18, 18), p: Math.random() * TAU, s: rand(0.7, 1.1) });
      }
      for (const bd of this.birds) { bd.x -= (this.vs * 0.12 + 28) * dt; bd.p += dt * 9; }
      this.birds = this.birds.filter(bd => bd.x > -40);
      this.nextBalloon -= dt;
      if (b.balloons && this.nextBalloon <= 0) {
        this.nextBalloon = rand(4, 9);
        this.balloons.push({ x: this.W + 60, y: rand(0.12, 0.5), s: rand(0.45, 1.1), c: pick(['#e7694e', '#f0b445', '#2f9e8f', '#8c79c4', '#ff8fb1', '#5b7fa8']), c2: pick(['#fbf4e6', '#ffd56b', '#ffffff']), p: Math.random() * TAU });
      }
      for (const bl of this.balloons) { bl.x -= (this.vs * 0.08 * bl.s + 4) * dt; bl.p += dt; }
      this.balloons = this.balloons.filter(bl => bl.x > -80);

      // ortam parçacıkları
      this.ambient(dt, night, b);
      for (const p of this.parts) {
        p.life += dt;
        if (p.type === 'firefly') {
          p.vx += (Math.random() - 0.5) * 60 * dt; p.vy += (Math.random() - 0.5) * 60 * dt;
          p.vx *= 0.98; p.vy *= 0.98;
          p.x += (p.vx - this.vs * 0.5 * groundF) * dt; p.y += p.vy * dt;
        } else if (p.type === 'petal' || p.type === 'leaf' || p.type === 'snow') {
          p.x += (p.vx - this.vs * 0.35) * dt + Math.sin(p.life * 2 + p.rot) * 10 * dt;
          p.y += p.vy * dt; p.rot += p.vr * dt;
        } else if (p.type === 'rain') {
          p.x += (p.vx - this.vs * 0.3) * dt; p.y += p.vy * dt;
        } else if (p.type === 'streak') {
          p.x -= (this.vs * 2.2 + 300) * dt;
        } else {
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.type === 'spark') p.vy += 120 * dt;
          if (p.type === 'dust' || p.type === 'smoke') { p.vx *= 0.96; p.vy *= 0.96; p.x -= this.vs * groundF * dt * 0.6; }
          if (p.type === 'puff') p.x -= this.vs * 0.6 * dt;
        }
      }
      this.parts = this.parts.filter(p => p.life < p.max && p.x > -60 && p.y < this.H + 40);
      this.updateGhosts(dt);
      for (const [pub, m] of this.msgs) { m.t += dt; if (m.t > m.life) this.msgs.delete(pub); }
      if (this.myMsg) { this.myMsg.t += dt; if (this.myMsg.t > this.myMsg.life) this.myMsg = null; }
      for (const f of this.floats) f.life += dt;
      this.floats = this.floats.filter(f => f.life < f.max);
      // kelebek
      if (this.gift) {
        const g = this.gift;
        g.t += dt;
        const u = g.t / g.dur;
        g.x = lerp(this.W + 40, -60, u);
        g.y = this.H * (0.26 + 0.07 * Math.sin(g.t * 1.1)) + Math.sin(g.t * 3.3) * 8;
        if (Math.random() < dt * 14) this.parts.push({ type: 'spark', x: g.x + rand(-6, 6), y: g.y + rand(-6, 6), vx: rand(10, 40), vy: rand(-10, 10), life: 0, max: rand(0.5, 1), size: rand(1.2, 2.6), color: pick(['#ffd56b', '#fff4c2']), rot: 0 });
        if (u >= 1) this.gift = null;
      }
      if (this.chest) {
        const c = this.chest; c.t += dt;
        if (Math.random() < dt * 6) { const p = this.chestPos(); this.parts.push({ type: 'spark', x: p.x + rand(-14, 14) * this.k, y: p.y - rand(10, 30) * this.k, vx: rand(-10, 10), vy: rand(-30, -10), life: 0, max: rand(0.6, 1.2), size: rand(1.2, 2.4), color: pick(['#ffd56b', '#fff1c2']), rot: 0 }); }
        if (c.t > c.dur) this.chest = null;
      }
      if (this.keep) {
        const c = this.keep; c.t += dt;
        if (Math.random() < dt * 5) { const p = this.keepPos(), a = Math.random() * TAU; this.parts.push({ type: 'spark', x: p.x + Math.cos(a) * 22 * this.k, y: p.y + Math.sin(a) * 22 * this.k, vx: rand(-8, 8), vy: rand(-26, -8), life: 0, max: rand(0.6, 1.1), size: rand(1.1, 2.2), color: pick(['#fff1c2', '#ffffff', '#cfe0ff']), rot: 0 }); }
        if (c.t > c.dur) this.keep = null;
      }
      if (!this.kite && this.kiteOn) this.tieKite();
      if (this.kite) {
        const c = this.kite;
        c.t += dt;
        if (c.mode === 'tied' && !this.kiteOn) { c.mode = 'gone'; c.goneT = 0; }
        if (c.mode === 'gone') c.goneT += dt;
        this.kiteMove(c, dt);
        c.a = c.mode === 'gone' ? clamp(1 - c.goneT / 2.6, 0, 1) : Math.min(1, c.a + dt / 0.8);
        if (c.mode === 'tied' && Math.random() < dt * 1.5) this.parts.push({ type: 'spark', x: c.x + rand(-8, 8) * this.k, y: c.y + rand(-6, 10) * this.k, vx: -rand(10, 26), vy: rand(-6, 8), life: 0, max: rand(0.5, 1), size: rand(1, 1.8), color: pick(['#ffffff', c.col[0], c.col[1]]), rot: 0 });
        if ((c.mode === 'free' && c.x < -60 * this.k) || (c.mode === 'gone' && c.goneT > 2.6)) this.kite = null;
      }
      if (this.constel) {
        const a = this.constel;
        a.t += dt;
        for (let i = 0; i < a.lit.length; i++) if (a.lit[i]) a.lit[i] += dt;
        if (a.done) { a.done += dt; if (a.done > 4) this.constel = null; }
        else {
          // gün ağarırsa (gün döngüsü ya da tema düğmesi) yıldızlar yumuşakça solar; solarken dokunulmaz
          if (Math.max(this.nightAmt || 0, this.space || 0) < 0.3) a.t = Math.max(a.t, a.dur);
          if (a.t > a.dur + 1.5) this.constel = null;
        }
      }
      if (this.dolphins && this.seaLine) {
        const d = this.dolphins, s = this.dolScale();
        d.t += dt; d.a = Math.min(1, d.a + dt / 0.6);
        if (d.happy) d.happy += dt;
        for (let i = 0; i < d.n; i++) {
          const p = this.dolPose(i);
          if (p.air !== !!d.air[i] && p.x > -20 * s && p.x < this.W + 20 * s) this.dolSplash(p.x, d.happy > 0);
          d.air[i] = p.air;
        }
        for (const q of d.drops) { q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 190 * s * dt; }
        d.drops = d.drops.filter(q => q.life < q.max && q.y <= this.seaLine + 2);
        for (const g of d.rings) g.t += dt;
        d.rings = d.rings.filter(g => g.t < 1.1);
        if (d.t > d.dur + 0.4 && !d.drops.length) this.dolphins = null;
      }
      if (this.fox) {
        const f = this.fox;
        f.t += dt; f.ph += dt * (f.out ? 16 : 9);
        if (f.happy) f.happy += dt;
        if (!f.out && (f.t > f.dur || f.happy > 1.3)) f.out = 0.001;
        if (f.out) { f.out += dt; if (f.out > 1.3) this.fox = null; }
      }
      if (this.seed) {
        const s = this.seed, k = this.k;
        s.t += dt;
        s.x = lerp(this.W + 30, -40, s.t / s.dur);
        s.y = s.y0 + Math.sin(s.t * 1.3 + s.ph) * 14 * k + Math.sin(s.t * 3.1) * 4 * k;
        s.rot = Math.sin(s.t * 1.7 + s.ph) * 0.35;
        if (Math.random() < dt * 2.5) this.parts.push({ type: 'spark', x: s.x + rand(-6, 6) * k, y: s.y - rand(4, 10) * k, vx: rand(10, 30), vy: rand(-12, 6), life: 0, max: rand(0.6, 1.1), size: rand(1, 1.8), color: '#ffffff', rot: 0 });
        if (s.t > s.dur) this.seed = null;
      }
      if (this.plane) {
        const p = this.plane, k = this.k;
        p.t += dt; this.planeMove(p);
        if (Math.random() < dt * 3) this.parts.push({ type: 'spark', x: p.x - Math.cos(p.ang) * 14 * k, y: p.y - Math.sin(p.ang) * 14 * k, vx: -Math.cos(p.ang) * 20, vy: rand(-6, 10), life: 0, max: rand(0.5, 1), size: rand(1, 1.8), color: pick(['#ffffff', '#fff4dc']), rot: 0 });
        if (p.t > p.dur) this.plane = null;
      }
      if (this.cranes) {
        const c = this.cranes;
        // dokunulunca hızlanıp yükselir ve yumuşakça solar
        if (c.caught) { c.caught += dt; c.y0 -= 40 * this.k * dt; }
        c.t += dt; c.x += c.vx * (c.caught ? 1 + Math.min(1.5, c.caught * 1.5) : 1) * dt;
        if (!c.caught && Math.random() < dt * 2.2) { const p = this.cranePos(c, (Math.random() * c.n) | 0); this.parts.push({ type: 'spark', x: p.x - 8 * p.k, y: p.y, vx: -rand(10, 30), vy: rand(-6, 10), life: 0, max: rand(0.6, 1.1), size: rand(1, 1.8), color: pick(['#ffffff', '#fff4c2']), rot: 0 }); }
        if (c.caught > 1.4 || c.x - (c.n >> 1) * 36 * Math.max(this.k, 0.8) > this.W + 60 * this.k) this.cranes = null;
      }
      if (this.swarm) {
        const s = this.swarm;
        s.t += dt;
        // yakalanınca ışıklar yolcunun omzunun üstüne süzülür; yakalanmazsa yavaşça geride kalır ya da söner
        if (s.caught) { s.caught += dt; if (s.caught > 1.2) this.swarm = null; }
        else { s.x -= this.W / 70 * dt; s.y += Math.sin(s.t * 0.7 + s.ph) * 6 * s.k * dt; if (s.x < -60 * s.k || s.t > SWARM_LIFE) this.swarm = null; }
      }
      if (this.dream) {
        const d = this.dream;
        d.t += dt;
        d.pres = clamp(d.t / 1.5, 0, 1) * (1 - smooth(1.0, 2.2, d.caught));
        // yakalanmadıkça rüzgârla yavaşça sola süzülür ve hafifçe iner kalkar; yakalanınca yerinde canlanıp dağılır
        if (d.caught) { d.caught += dt; if (d.caught > 2.3) this.dream = null; }
        else {
          d.x -= (this.W + 160 * d.s) / 46 * dt; d.y = d.y0 + Math.sin(d.t * 0.5 + d.ph) * 6 * d.s;
          if (Math.random() < dt * 0.9) this.parts.push({ type: 'spark', x: d.x + rand(-40, 40) * d.s, y: d.y + rand(-24, 20) * d.s, vx: -rand(4, 14), vy: rand(-8, 2), life: 0, max: rand(0.8, 1.4), size: rand(1, 1.7), color: pick(['#ffffff', '#fff3d6']), rot: 0 });
          if (d.x < -90 * d.s) this.dream = null;
        }
      }
      // ışık bulutu: sürü omza vardıktan sonra belirir, etki bitince yavaşça söner
      const glowIn = this.glowOn && !(this.swarm && this.swarm.caught);
      this.glowA = clamp(this.glowA + (glowIn ? dt * 1.4 : this.glowOn ? 0 : -dt * 0.7), 0, 1);
      if (this.bird) {
        const b = this.bird, f = BIRD_FLY[b.id], k = Math.max(this.k, 0.8) * f.s;
        // deftere yazılınca hızlanıp yükselir ve yumuşakça solar
        if (b.noted) { b.noted += dt; b.y0 -= 36 * k * dt; }
        b.t += dt; b.fp += dt * f.fl * (b.noted ? 1.6 : 1);
        b.x += b.vx * (b.noted ? 1 + Math.min(1.5, b.noted * 1.5) : 1) * dt;
        if (b.ring) b.ring.t += dt;
        if (b.noted && Math.random() < dt * 8) { const p = this.birdPos(b, (Math.random() * b.n) | 0); this.parts.push({ type: 'spark', x: p.x - p.dir * 8 * p.k, y: p.y, vx: -p.dir * rand(10, 30), vy: rand(-6, 10), life: 0, max: rand(0.5, 1), size: rand(1, 1.8), color: pick(BIRD_SPARK[b.id]), rot: 0 }); }
        const tail = b.x - f.dir * (b.n - 1) * (f.gap || 26) * k;
        if (b.noted > 1.6 || (f.dir > 0 ? tail > this.W + 60 * k : tail < -60 * k)) this.bird = null;
      }
      if (this.star) {
        const s = this.star;
        s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
        if (Math.random() < dt * 18) this.parts.push({ type: 'spark', x: s.x + rand(-3, 3), y: s.y + rand(-3, 3), vx: rand(-8, 8), vy: rand(4, 16), life: 0, max: rand(0.4, 0.9), size: rand(1, 2), color: pick(['#ffffff', '#cfe0ff']), rot: 0 });
        if (s.t > s.dur + 0.6 || s.x < -80) this.star = null;
      }
    }

    ambient(dt, night, b) {
      const W = this.W, H = this.H, mult = this.reduced ? 0.3 : 1;
      const count = type => { let n = 0; for (const p of this.parts) if (p.type === type) n++; return n; };
      const groundVisible = true;
      if (groundVisible && b.particles === 'petals' && Math.random() < dt * 4 * mult)
        this.parts.push({ type: 'petal', x: rand(0, W * 1.3), y: -10, vx: -rand(10, 30), vy: rand(20, 40), life: 0, max: 14, size: rand(2.5, 4), rot: Math.random() * TAU, vr: rand(-3, 3), color: pick(['#ffd0de', '#ffc2d4', '#fff0f4']) });
      if (groundVisible && b.particles === 'leaves' && Math.random() < dt * 2.5 * mult)
        this.parts.push({ type: 'leaf', x: rand(0, W * 1.3), y: -10, vx: -rand(15, 40), vy: rand(25, 45), life: 0, max: 14, size: rand(3, 5), rot: Math.random() * TAU, vr: rand(-4, 4), color: pick(['#e59a3a', '#cc5a3c', '#e6b545']) });
      if (groundVisible && b.particles === 'snow' && Math.random() < dt * 28 * mult)
        this.parts.push({ type: 'snow', x: rand(0, W * 1.4), y: -6, vx: -rand(5, 25), vy: rand(25, 55), life: 0, max: 16, size: rand(1, 2.6), rot: Math.random() * TAU, vr: 0, color: '#ffffff' });
      if (groundVisible && this.rain > 0.02) {
        const n = dt * 110 * this.rain * mult;
        for (let i = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0); i > 0; i--)
          this.parts.push({ type: 'rain', x: rand(0, W * 1.3), y: rand(-20, H * 0.2), vx: -rand(60, 90), vy: rand(520, 680), life: 0, max: 3, size: rand(9, 15), color: '#ffffff' });
      }
      if (groundVisible && b.particles === 'fireflies' && night > 0.45 && this.rain < 0.3 && count('firefly') < 22 * mult && Math.random() < dt * 6)
        this.parts.push({ type: 'firefly', x: rand(0, W * 1.2), y: rand(0.6, 0.8) * H + this.shift(0.58), vx: rand(-10, 10), vy: rand(-8, 8), life: 0, max: rand(5, 10), size: rand(1.4, 2.4), color: '#fff3a0' });
      if (!this.reduced && this.vs > 250 && Math.random() < dt * (this.vs - 250) / 25)
        this.parts.push({ type: 'streak', x: W + 20, y: rand(0.2, 0.98) * H, vx: 0, vy: 0, life: 0, max: 2, size: rand(30, 120), color: '#ffffff' });
      const v = this.vehicle;
      if (v === 'rocket' && Math.random() < dt * 40 * mult) {
        const ry = this.riderY();
        this.parts.push({ type: 'smoke', x: this.travelerX - 70 * this.k, y: ry + rand(-4, 4) + 6 * this.k, vx: -rand(80, 160), vy: rand(-12, 12), life: 0, max: rand(0.6, 1.3), size: rand(4, 9) * this.k, color: '#ffffff' });
      }
      // kuyruklu yıldızdan buz tozu, yıldız gemisinin motorundan, balinanın kuyruğundan, trenin rayından ve Anka'nın
      // kuyruğundan soluk ışık bulutçukları dökülür
      if ((v === 'comet' || v === 'warp' || v === 'whale' || v === 'startrain' || v === 'anka') && Math.random() < dt * 16 * mult) {
        const ry = this.riderY(), back = { warp: 60, whale: 80, startrain: 104, anka: 70 }[v] || 24;
        this.parts.push({ type: 'puff', x: this.travelerX - back * this.k, y: ry + rand(-8, 10) * this.k, vx: -rand(30, 70), vy: rand(-6, 6), life: 0, max: rand(0.8, 1.5), size: rand(1.4, 2.6) * this.k });
      }
      if ((v === 'plane' || v === 'jet') && Math.random() < dt * 22 * mult) {
        const ry = this.riderY();
        this.parts.push({ type: 'puff', x: this.travelerX - (v === 'jet' ? 66 : 50) * this.k, y: ry + rand(-2, 2), vx: -rand(20, 40), vy: 0, life: 0, max: rand(1.2, 2), size: rand(2, 4) * this.k, color: '#ffffff' });
      }
    }

    /* --- Çizim --- */
    draw(ui) {
      const ctx = this.ctx, W = this.W, H = this.H, k = this.k;
      const pal = blendPal(this.palFrom, this.palTo, this.blend);
      const e = Math.sin((this.tod - 0.25) * TAU);              // güneş yüksekliği
      const night = 1 - smooth(-0.32, 0.04, e);
      const dusk = Math.exp(-Math.pow(e / 0.2, 2));
      const dayAmt = smooth(-0.25, 0.25, e);
      const space = this.space || 0;
      this.nightAmt = night;
      const light = lerp(0.42, 1, smooth(-0.3, 0.25, e));

      // gökyüzü renkleri
      let top = mixc(NIGHT_SKY[0], pal.sky0, dayAmt), bot = mixc(NIGHT_SKY[1], pal.sky1, dayAmt);
      top = mixc(top, DUSK_SKY[0], dusk * 0.55); bot = mixc(bot, DUSK_SKY[1], dusk * 0.8);
      top = mixc(top, SPACE_SKY[0], space); bot = mixc(bot, SPACE_SKY[1], space * 0.25);
      const haze = bot;
      const lit = (c, h) => {
        let r = h ? mixc(c, haze, h) : c;
        r = mul(r, light);
        r = mixc(r, NIGHT_TINT, night * 0.32);
        return mixc(r, DUSK_TINT, dusk * 0.14);
      };
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.8);
      g.addColorStop(0, css(top)); g.addColorStop(1, css(bot));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // yağmur bulutları gökyüzünü griye çeker
      if (this.rain > 0.01) { ctx.fillStyle = css(mixc(hex('#8d95a8'), NIGHT_SKY[1], night), 0.55 * this.rain * (1 - space)); ctx.fillRect(0, 0, W, H); }

      // yıldızlar
      const starA = Math.max(night * 0.95, space);
      if (starA > 0.02) {
        for (const s of this.stars) {
          const tw = 0.6 + 0.4 * Math.sin(this.t * 2 + s.p);
          ctx.fillStyle = `rgba(255,255,240,${(starA * tw).toFixed(3)})`;
          const sx = ((s.x * W - this.scroll * 0.004 * (1 + space * 3)) % W + W) % W;
          ctx.fillRect(sx, s.y * H, s.r, s.r);
        }
      }
      // gökyüzü haritası: bulunan takımyıldızlar yıldızlarla birlikte kayar
      if (starA > 0.02 && this.constFound.length) this.drawSkyMap(ctx, starA, space);
      // kuzey ışıkları
      const auroraA = pal.aurora * night;
      this.auroraVis = auroraA; // Özel Anlar: kuzey ışıklarının gerçekten görünen yoğunluğu
      if (auroraA > 0.02) this.drawAurora(ctx, auroraA);

      // güneş ve ay
      const sunU = (this.tod - 0.25) / 0.5;
      const horizon = H * 0.66 + this.shift(0.35);
      if (sunU > -0.1 && sunU < 1.1) {
        const sx = W * (0.12 + 0.76 * sunU), sy = horizon - Math.sin(clamp(sunU, 0, 1) * Math.PI) * H * 0.52 + 20;
        const sunCol = mixc(hex('#fff3c4'), hex('#ffb070'), dusk);
        glow(ctx, sx, sy, 120 * k, sunCol, 0.45);
        ctx.fillStyle = css(sunCol); circle(ctx, sx, sy, 22 * k);
      }
      const moonU = ((this.tod + 0.25) % 1) / 0.5;
      if (moonU > -0.1 && moonU < 1.1) {
        const mx = W * (0.12 + 0.76 * moonU), my = horizon - Math.sin(clamp(moonU, 0, 1) * Math.PI) * H * 0.5 + 20;
        // hasat ayı (ekim–kasım): turuncuya çalan, biraz daha iri bir dolunay
        const hm = this.festival === 'harvest';
        glow(ctx, mx, my, (hm ? 84 : 70) * k, hex(hm ? '#ffc98a' : '#dfe8ff'), (hm ? 0.3 : 0.25) * night + 0.05);
        ctx.fillStyle = hm ? '#ffe2b0' : '#f1f0e6'; circle(ctx, mx, my, (hm ? 17 : 15) * k);
        ctx.fillStyle = 'rgba(180,184,200,0.45)'; circle(ctx, mx - 5 * k, my - 3 * k, 3.4 * k); circle(ctx, mx + 4 * k, my + 5 * k, 2.4 * k);
      }

      if (this.star) this.drawStar(ctx, this.star);

      // gökkuşağı (uzak dağların arkasında)
      const bowA = this.rainbow * (this.moonbow ? night : 1 - night) * (1 - space);
      this.bowVis = bowA; // Özel Anlar: gökkuşağının gerçekten görünen yoğunluğu
      if (bowA > 0.01) this.drawRainbow(ctx, bowA, horizon, this.moonbow);

      // güneş yelkeninde uzak halkalı gezegen
      if (RINGED[this.vehicle] && space > 0.05) this.drawRingedPlanet(ctx, space / 0.6);

      // balonlar ve kuşlar (uzak)
      for (const bl of this.balloons) this.drawBalloon(ctx, bl, light, night, 1);
      ctx.strokeStyle = css(lit(hex('#3a3f55')), 0.8); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (const bd of this.birds) {
        const f = Math.sin(bd.p) * 5 * bd.s;
        ctx.beginPath(); ctx.moveTo(bd.x - 7 * bd.s, bd.y - f); ctx.quadraticCurveTo(bd.x - 3 * bd.s, bd.y - 3, bd.x, bd.y);
        ctx.quadraticCurveTo(bd.x + 3 * bd.s, bd.y - 3, bd.x + 7 * bd.s, bd.y - f); ctx.stroke();
      }
      // uzak bulutlar
      const cloudCol = mixc(mixc(WHITE, hex('#ffc9a8'), dusk * 0.6), hex('#55608a'), night * 0.75);
      for (const c of this.clouds) if (c.depth < 0.65) this.drawCloud(ctx, c, cloudCol, space);

      // uzak sıradağ
      const step = 5;
      const sh = this.shapeFrom, st = this.shapeTo, bl = smooth(0, 1, this.blend);
      // en arkadaki soluk sıra
      {
        const bBase = H * 0.6 + this.shift(0.3), bAmp = H * 0.22, offB = this.scroll * 0.03 + 9000;
        ctx.fillStyle = css(lit(pal.far, 0.55));
        ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W + step; x += step) {
          const wx = x + offB;
          const h = lerp(shapeH(sh.farShape === 'sea' ? 'hills' : sh.farShape, wx) * sh.farH, shapeH(st.farShape === 'sea' ? 'hills' : st.farShape, wx) * st.farH, bl);
          ctx.lineTo(x, bBase - h * bAmp * (1 - pal.sea * 0.85));
        }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      }
      const farBase = H * 0.645 + this.shift(0.38), farAmp = H * 0.25;
      const offFar = this.scroll * 0.06;
      const farY = new Float32Array(Math.ceil(W / step) + 2);
      for (let i = 0; i < farY.length; i++) {
        const wx = i * step + offFar;
        const h = lerp(shapeH(sh.farShape, wx) * sh.farH, shapeH(st.farShape, wx) * st.farH, bl);
        farY[i] = farBase - h * farAmp;
      }
      const farCol = lit(pal.far, 0.22);
      ctx.fillStyle = css(farCol);
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let i = 0; i < farY.length; i++) ctx.lineTo(i * step, farY[i]);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      if (pal.capA > 0.02) {
        const capLine = farBase - farAmp * 0.42;
        ctx.fillStyle = css(lit(pal.cap, 0.15), pal.capA * 0.95);
        ctx.beginPath(); ctx.moveTo(0, Math.min(farY[0], capLine));
        for (let i = 0; i < farY.length; i++) ctx.lineTo(i * step, Math.min(farY[i], capLine));
        for (let i = farY.length - 1; i >= 0; i--) {
          const y = farY[i];
          const wob = Math.sin((i * step + offFar) * 0.08) * 2.5;
          ctx.lineTo(i * step, y < capLine ? Math.min(capLine, y + (capLine - y) * 0.55 + wob) : capLine);
        }
        ctx.closePath(); ctx.fill();
      }
      if (pal.sea > 0.02) {
        ctx.fillStyle = css(lerpWhite(lit(pal.far, 0.1), 0.6), pal.sea * (0.25 + 0.5 * dayAmt));
        for (let i = 0; i < 40; i++) {
          const sx = ((hash(i) * W * 1.4 - this.scroll * 0.08) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2;
          const sy = farBase + 4 + hash(i + 50) * H * 0.07;
          const w = (6 + hash(i + 9) * 20) * (0.5 + 0.5 * Math.sin(this.t * 1.5 + i));
          ctx.fillRect(sx, sy, w, 1.4);
        }
      }
      // yunuslar uzak denizde, orta tepelerin arkasında
      this.seaLine = farBase + H * 0.03;
      if (this.dolphins) this.drawDolphins(ctx, pal, night, space);

      // orta tepeler
      // kıyıda orta tepeler alçalır: deniz şeridi genişler (yunuslar orada sıçrar)
      const midBase = H * (0.712 + 0.02 * pal.sea) + this.shift(0.5), midAmp = H * 0.075 * (1 - 0.4 * pal.sea);
      const offMid = this.scroll * this.layers.mid.par;
      const midY = wx => midBase - (0.3 + 0.7 * fbm(wx * 0.0034 + 40, 3)) * midAmp;
      const midCol = lit(pal.mid, 0.18);
      for (const it of this.layers.mid.items) {
        const x = it.x - offMid;
        if (x < -80 || x > W + 80) continue;
        const c = this.treeCols(it.type, 0.3, lit, pal);
        drawTree(ctx, it.type, x, midY(it.x) + 6, it.s * k, c, it.seed, night);
      }
      ctx.fillStyle = css(midCol);
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W + step; x += step) ctx.lineTo(x, midY(x + offMid));
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

      // yakın bulutlar (uçarken öne geçenler)
      for (const c of this.clouds) if (c.depth >= 0.65) this.drawCloud(ctx, c, cloudCol, space);
      if (this.dream) this.drawDream(ctx, this.dream, cloudCol, night);
      // dokunulacak takımyıldız bulutların önünde (kutusu dağların üstünde kalır, tepeler onu örtmez)
      if (this.constel) this.drawConst(ctx, this.constel, clamp(starA / 0.55, 0, 1));

      // yakın tarla
      const nearBase = H * 0.752 + this.shift(0.58);
      const offNear = this.scroll * this.layers.near.par;
      const nearY = wx => nearBase - (0.5 + 0.5 * vnoise(wx * 0.006)) * H * 0.02;
      ctx.fillStyle = css(lit(pal.near, 0.05));
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W + step; x += step) ctx.lineTo(x, nearY(x + offNear));
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      for (const it of this.layers.near.items) {
        const x = it.x - offNear;
        if (x < -120 || x > W + 120) continue;
        const y = nearY(it.x) + 4;
        if (it.type === 'house') this.drawHouse(ctx, x, y, it.s * k, it, lit, night);
        else if (it.type === 'windmill') this.drawWindmill(ctx, x, y, it.s * k, it, lit, night);
        else if (it.tree) drawTree(ctx, it.type, x, y, it.s * k, this.treeCols(it.type, 0.1, lit, pal), it.seed, night);
        else this.drawDeco(ctx, it, x, y + 6 * k, k, lit, pal);
      }

      // yol kenarı zemin + yol
      const roadTop = H * 0.79 + this.shift(0.66), roadBot = H * 0.893 + this.shift(0.66);
      const offRoad = this.scroll;
      ctx.fillStyle = css(lit(pal.ground));
      ctx.fillRect(0, roadTop - H * 0.03, W, H - roadTop + H * 0.03 + 2);
      for (const it of this.layers.road.items) {
        const x = it.x - offRoad;
        if (x < -140 || x > W + 140) continue;
        if (it.type === 'sign') this.drawSign(ctx, x, roadTop + 2, k, it.txt, lit);
        else if (it.type === 'fence') this.drawFence(ctx, x, roadTop + 1, k, lit);
        else if (it.type === 'pumpkin') this.drawPumpkins(ctx, it, x, roadTop + 2, k, lit, night);
        else if (it.tree) drawTree(ctx, it.type, x, roadTop + 3, it.s * k, this.treeCols(it.type, 0, lit, pal), it.seed, night);
        else this.drawDeco(ctx, it, x, roadTop + 2, k, lit, pal);
      }
      this.drawRoad(ctx, roadTop, roadBot, lit, pal, night);
      // lambalar
      for (const it of this.layers.lamps.items) {
        const x = it.x - offRoad;
        if (x < -80 || x > W + 80) continue;
        this.drawLamp(ctx, x, roadTop + 2, k, night, lit);
      }

      // far ışığı
      if (night > 0.25 && (this.vehicle === 'car' || this.vehicle === 'van' || this.vehicle === 'moto' || this.vehicle === 'train') && this.alt < 0.3) {
        const gy = this.groundY();
        const hx = this.travelerX + (this.vehicle === 'car' ? 45 : this.vehicle === 'van' ? 46 : this.vehicle === 'moto' ? 24 : 56) * k;
        const hy = gy - (this.vehicle === 'moto' ? 34 : this.vehicle === 'car' ? 27 : this.vehicle === 'van' ? 28 : 19) * k;
        const lg = ctx.createLinearGradient(hx, hy, hx + 220 * k, hy);
        lg.addColorStop(0, `rgba(255,240,190,${(0.45 * night).toFixed(3)})`); lg.addColorStop(1, 'rgba(255,240,190,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(hx, hy - 3 * k); ctx.lineTo(hx + 220 * k, hy - 30 * k); ctx.lineTo(hx + 220 * k, hy + 34 * k); ctx.closePath(); ctx.fill();
      }

      // parçacıklar (arka)
      this.drawParts(ctx, false);

      // diğer gezginler: arka şeritte, yolcunun gerisinde çizilir
      this.drawGhosts(ctx, night);

      // yolcu
      // pal: Karabaş araçta yolculuk ediyorsa görünüm aşaması + 1 (0 = yok)
      const rider = !!RUNNER[this.companion];
      const st0 = { phase: this.phase, wheel: this.wheel, t: this.t, tick: this.t - (this.autoTick || -9), night, tier: this.vehTier || 0, pal: rider ? (this.palTier || 0) + 1 : 0, palKind: this.companion };
      const ry = this.riderY() - this.stepKick * 2.5 * k;
      ctx.save();
      // gölge
      if (!FLYING[this.vehicle]) {
        ctx.fillStyle = 'rgba(30,30,50,0.18)';
        const w = { walk: 16, skates: 18, board: 26, bike: 36, horse: 34, moto: 42, car: 54, van: 54, train: 70 }[this.vehicle] || 30;
        ellipse(ctx, this.travelerX, this.groundY() + 1, w * k, 3.5 * k);
      } else { // uçarken yola düşen yumuşak gölge; yükseldikçe solar ve yayılır
        const f = this.flyT();
        ctx.fillStyle = `rgba(30,30,50,${(0.18 - 0.1 * f).toFixed(3)})`;
        ellipse(ctx, this.travelerX + 6 * k, this.groundY() + 1, (40 + 18 * f) * k, (4 + 2 * f) * k);
      }
      // Karabaş, Tekir ve Kızıl yerde, yavaş araçlarda yanında koşar (hızlı araçlarda pencereden bakar)
      const dogBack = RUNNER[this.companion] && PAL_BACK[this.vehicle];
      if (dogBack && this.flyT() === 0) {
        const dx = this.travelerX - dogBack * k, gy = this.groundY() + 4 * k;
        ctx.fillStyle = 'rgba(30,30,50,0.16)'; ellipse(ctx, dx, gy + 1, 15 * k, 2.6 * k);
        RUNNER[this.companion](ctx, dx, gy, k * 0.95, this.dogPhase, this.t, this.palTier || 0);
      }
      drawVehicle(ctx, this.vehicle, this.travelerX, ry, k, st0);
      // Kanat (martı) her araçta yanında süzülür: yerde yolcunun üstünde, uçarken aracın yanında
      if (this.companion === 'bird') {
        const fly = FLYING[this.vehicle] && this.flyT() > 0.5;
        const bx = this.travelerX + (fly ? -74 : -26) * k + Math.sin(this.t * 0.7) * 6 * k;
        const by = (fly ? ry - 34 * k : ry - 96 * k) + Math.sin(this.t * 1.6) * 5 * k;
        drawGull(ctx, bx, by, k * 1.1, this.t, this.palTier || 0);
      }
      ctx.restore();
      // yabani tilki: yolcunun önünde, ön plan çimlerinin arkasında
      if (this.fox) this.drawWildFox(ctx, night);

      // ön plan
      const offFg = this.scroll * this.layers.fg.par;
      const fgY = H * 0.94 + this.shift(0.75);
      for (const it of this.layers.fg.items) {
        const x = it.x - offFg;
        if (x < -60 || x > W + 60) continue;
        this.drawFg(ctx, it, x, fgY + hash(it.seed) * H * 0.05, k, lit, pal);
      }

      // gece örtüsü (yolcuyu ve ön planı da sahne ışığına uydurur)
      if (night > 0.02) {
        ctx.fillStyle = css(NIGHT_TINT, night * 0.22);
        ctx.fillRect(0, 0, W, H);
      }
      // yağmurda sahne biraz kararır
      if (this.rain > 0.01) { ctx.fillStyle = css(hex('#3c4560'), 0.16 * this.rain * (1 - space)); ctx.fillRect(0, 0, W, H); }
      // lamba ışıkları (örtünün üstünde parlasın)
      if (night > 0.2) {
        ctx.globalCompositeOperation = 'lighter';
        for (const it of this.layers.lamps.items) {
          const x = it.x - offRoad;
          if (x < -100 || x > W + 100) continue;
          glow(ctx, x + 9 * k, roadTop - 56 * k, 70 * k, hex('#ffcf7a'), 0.32 * night);
        }
        // oyulmuş balkabakları fener gibi yanar
        for (const it of this.layers.road.items) {
          if (it.type !== 'pumpkin' || !it.lamp) continue;
          const x = it.x - offRoad;
          if (x < -100 || x > W + 100) continue;
          const f = this.pumpkinFace(it, x, roadTop + 2, k);
          glow(ctx, f.x, f.y - f.r * 0.85, f.r * 4.2, hex('#ffb347'), (0.4 + 0.06 * Math.sin(this.t * 7 + it.seed)) * night);
        }
        for (const it of this.layers.near.items) {
          if (it.type !== 'house' && it.type !== 'windmill') continue;
          const x = it.x - offNear;
          if (x < -100 || x > W + 100) continue;
          const wy = it.type === 'windmill' ? 34 : 14;
          glow(ctx, x, nearY(it.x) - wy * k * it.s, 34 * k * it.s, hex('#ffcf7a'), 0.28 * night);
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      this.drawTags(ctx, night);
      this.drawBubbles(ctx);
      this.drawParts(ctx, true);
      this.drawFireflies(ctx, night);
      if (this.fox) this.drawFoxEyes(ctx, night);
      if (this.chest) this.drawChest(ctx, this.chest);
      if (this.keep) this.drawKeep(ctx, this.keep);
      if (this.seed) this.drawSeed(ctx, this.seed);
      if (this.cranes) this.drawCranes(ctx, this.cranes, night);
      if (this.bird) this.drawBirds(ctx, this.bird, night);
      if (this.kite) this.drawKiteState(ctx, this.kite, night);
      if (this.plane) this.drawPlane(ctx, this.plane, night);
      if (this.gift) this.drawButterfly(ctx, this.gift);
      this.drawFloats(ctx);

      // yumuşak vinyet
      const vg = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.85);
      vg.addColorStop(0, 'rgba(20,20,45,0)'); vg.addColorStop(1, 'rgba(20,20,45,0.28)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }

    treeCols(type, h, lit, pal) {
      const base = TREE_RGB[type] || TREE_RGB.round;
      let b = base;
      if (type === 'bush' || type === 'rock') b = mixc(base, pal.near, 0.25);
      if (type === 'chimney') return { base: css(lit(b, h)), dark: css(lit(mul(b, 0.82), h)), light: css(lit(mixc(b, WHITE, 0.2), h)), cap: css(lit(hex('#9a7a5c'), h)), trunk: css(lit(TRUNK, h)), snow: '#fff' };
      return {
        base: css(lit(b, h)), dark: css(lit(mul(b, 0.8), h)), light: css(lit(mixc(b, WHITE, 0.22), h)),
        trunk: css(lit(TRUNK, h)), snow: css(lit(hex('#f4f8fc'), h)),
      };
    }

    drawCloud(ctx, c, col, space) {
      let a = (0.55 + 0.35 * c.depth) * (1 - space * 0.4);
      const y = c.y * this.H + this.shift(0.3 * c.depth);
      // Bulut Yolu: bir şeye benzeyen bulutun çevresi açılır; yakınındaki sıradan bulutlar yumuşakça seyrelir
      const d = this.dream;
      if (d && d.pres > 0) {
        const far = Math.max(Math.abs(c.x - d.x) / (120 * d.s + 50 * c.s), Math.abs(y - d.y) / (60 * d.s + 20 * c.s));
        a *= 1 - d.pres * 0.85 * (1 - smooth(0.7, 1.25, far));
      }
      if (a < 0.02) return;
      ctx.fillStyle = css(col, a);
      const x0 = c.x + c.puffs[0].dx * c.s, x1 = c.x + c.puffs[c.puffs.length - 1].dx * c.s;
      ctx.beginPath();
      for (const p of c.puffs) { ctx.moveTo(c.x + p.dx * c.s + p.r * c.s, y + p.dy * c.s); ctx.arc(c.x + p.dx * c.s, y + p.dy * c.s, p.r * c.s, 0, TAU); }
      ctx.ellipse((x0 + x1) / 2, y + 6 * c.s, (x1 - x0) / 2 + 14 * c.s, 12 * c.s, 0, 0, TAU);
      ctx.fill();
    }

    drawAurora(ctx, a) {
      const W = this.W, H = this.H;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let band = 0; band < 3; band++) {
        const y0 = H * (0.12 + band * 0.07);
        const g = ctx.createLinearGradient(0, y0 - 60, 0, y0 + 90);
        g.addColorStop(0, 'rgba(120,255,200,0)'); g.addColorStop(0.5, `rgba(110,255,190,${(0.22 * a).toFixed(3)})`); g.addColorStop(1, `rgba(170,110,255,0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, y0 + 90);
        for (let x = 0; x <= W + 10; x += 10) ctx.lineTo(x, y0 + Math.sin(x * 0.006 + this.t * 0.3 + band * 2) * 28 + Math.sin(x * 0.017 - this.t * 0.5) * 10);
        ctx.lineTo(W, y0 + 90); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    drawRainbow(ctx, a, horizon, moon) {
      const W = this.W, H = this.H, k = this.k;
      const cx = W * 0.64, cy = horizon + H * 0.18, R = Math.min(W * 0.55, H * 0.72);
      const band = 6 * k;
      const cols = ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#9775fa'];
      ctx.save();
      ctx.lineWidth = band + 0.6;
      // ay gökkuşağı: ay ışığında renkler soluk, yay gümüşi bir pusla parlar
      if (moon) { ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = band * 6; ctx.strokeStyle = css(hex('#dfe8ff'), 0.05 * a); ctx.beginPath(); ctx.arc(cx, cy, R - band * 2.5, Math.PI * 1.04, Math.PI * 1.96); ctx.stroke(); ctx.lineWidth = band + 0.6; }
      cols.forEach((c, i) => {
        ctx.strokeStyle = css(moon ? mixc(hex(c), hex('#f4f6ff'), 0.55) : hex(c), (moon ? 0.24 : 0.32) * a);
        ctx.beginPath(); ctx.arc(cx, cy, R - i * band, Math.PI * 1.04, Math.PI * 1.96); ctx.stroke();
      });
      ctx.restore();
    }

    drawRingedPlanet(ctx, a) {
      const W = this.W, H = this.H, px = W * 0.78, py = H * 0.2;
      ctx.save(); ctx.globalAlpha = clamp(a, 0, 1) * 0.9;
      ctx.fillStyle = '#e7c99a'; circle(ctx, px, py, 16 * this.k);
      ctx.strokeStyle = 'rgba(240,220,180,0.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(px, py, 30 * this.k, 7 * this.k, -0.3, 0, TAU); ctx.stroke();
      ctx.restore();
    }

    drawBalloon(ctx, bl, light, night, fade) {
      const k = this.k * bl.s, x = bl.x, y = bl.y * this.H + Math.sin(bl.p) * 6 + this.shift(0.2);
      const dim = lerp(0.5, 1, light);
      ctx.save(); ctx.globalAlpha = 0.95 * fade;
      ctx.fillStyle = bl.c; ctx.beginPath(); ctx.moveTo(x, y + 22 * k);
      ctx.bezierCurveTo(x - 26 * k, y + 2 * k, x - 22 * k, y - 30 * k, x, y - 30 * k);
      ctx.bezierCurveTo(x + 22 * k, y - 30 * k, x + 26 * k, y + 2 * k, x, y + 22 * k); ctx.fill();
      ctx.fillStyle = bl.c2; ctx.beginPath(); ctx.moveTo(x, y + 22 * k);
      ctx.bezierCurveTo(x - 9 * k, y + 2 * k, x - 8 * k, y - 30 * k, x, y - 30 * k);
      ctx.bezierCurveTo(x + 8 * k, y - 30 * k, x + 9 * k, y + 2 * k, x, y + 22 * k); ctx.fill();
      ctx.strokeStyle = 'rgba(80,60,40,0.7)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x - 6 * k, y + 19 * k); ctx.lineTo(x - 4 * k, y + 30 * k); ctx.moveTo(x + 6 * k, y + 19 * k); ctx.lineTo(x + 4 * k, y + 30 * k); ctx.stroke();
      ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x - 5 * k, y + 29 * k, 10 * k, 6 * k);
      if (night > 0.3) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, y + 26 * k, 14 * k, hex('#ffb060'), 0.6 * night); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = css(NIGHT_TINT, (1 - dim) * 0.7); ctx.beginPath(); ctx.arc(x, y - 6 * k, 25 * k, 0, TAU); ctx.fill();
      ctx.restore();
    }

    drawHouse(ctx, x, y, u, it, lit, night) {
      const wall = css(lit(hex('#f4eee2'))), wallD = css(lit(hex('#ddd3c2')));
      ctx.fillStyle = wall; ctx.fillRect(x - 22 * u, y - 30 * u, 44 * u, 30 * u);
      ctx.fillStyle = wallD; ctx.fillRect(x + 10 * u, y - 30 * u, 12 * u, 30 * u);
      ctx.fillStyle = css(lit(hex(it.roof))); ctx.beginPath();
      ctx.moveTo(x - 27 * u, y - 29 * u); ctx.lineTo(x - 14 * u, y - 46 * u); ctx.lineTo(x + 18 * u, y - 46 * u); ctx.lineTo(x + 27 * u, y - 29 * u); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css(lit(hex('#9a7a5c'))); ctx.fillRect(x + 8 * u, y - 52 * u, 5 * u, 9 * u);
      const win = night > 0.4 ? '#ffd889' : css(lit(hex('#7fa6c4')));
      ctx.fillStyle = win; ctx.fillRect(x - 16 * u, y - 22 * u, 8 * u, 8 * u); ctx.fillRect(x + 1 * u, y - 22 * u, 8 * u, 8 * u);
      ctx.fillStyle = css(lit(hex('#8a6448'))); ctx.fillRect(x - 4 * u, y - 13 * u, 6 * u, 13 * u);
    }

    // Lale bahçelerinin yel değirmeni: kanatlar rüzgârla yavaşça döner
    drawWindmill(ctx, x, y, u, it, lit, night) {
      ctx.fillStyle = css(lit(hex('#efe6d6'))); ctx.beginPath();
      ctx.moveTo(x - 13 * u, y); ctx.lineTo(x - 8 * u, y - 52 * u); ctx.lineTo(x + 8 * u, y - 52 * u); ctx.lineTo(x + 13 * u, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css(lit(hex('#d9cdb8'))); ctx.beginPath();
      ctx.moveTo(x + 4 * u, y); ctx.lineTo(x + 3 * u, y - 52 * u); ctx.lineTo(x + 8 * u, y - 52 * u); ctx.lineTo(x + 13 * u, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css(lit(hex('#7a4a3a'))); ctx.beginPath();
      ctx.moveTo(x - 11 * u, y - 51 * u); ctx.quadraticCurveTo(x, y - 66 * u, x + 11 * u, y - 51 * u); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css(lit(hex('#8a6448'))); rrect(ctx, x - 3.5 * u, y - 12 * u, 7 * u, 12 * u, 3 * u); ctx.fill();
      ctx.fillStyle = night > 0.4 ? '#ffd889' : css(lit(hex('#7fa6c4'))); rrect(ctx, x - 3 * u, y - 38 * u, 6 * u, 7 * u, 3 * u); ctx.fill();
      const hx = x, hy = y - 54 * u, ang = this.t * 0.9 + it.seed;
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = css(lit(hex('#6e5442'))); ctx.fillRect(-1 * u, 0, 2 * u, 34 * u);
        ctx.fillStyle = css(lit(hex('#f6f1e6')), 0.92); ctx.fillRect(1 * u, 8 * u, 7 * u, 25 * u);
      }
      ctx.restore();
      ctx.fillStyle = css(lit(hex('#4a3a30'))); circle(ctx, hx, hy, 2.4 * u);
    }

    drawDeco(ctx, it, x, y, k, lit, pal) {
      const s = it.s * k;
      switch (it.type) {
        case 'tulips': { // aynı renkte sıralı laleler, tarla şeritleri gibi
          const col = it.colors[(hash(it.seed) * it.colors.length) | 0];
          const stem = css(lit(hex('#4f8f4a'))), cup = css(lit(hex(col))), hi = css(lit(mixc(hex(col), WHITE, 0.35)));
          for (let i = 0; i < 4; i++) {
            const xx = x + i * 8 * s, h = (9 + hash(it.seed + i) * 4) * s;
            ctx.strokeStyle = stem; ctx.lineWidth = 1.3 * s;
            ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y - h); ctx.stroke();
            ctx.fillStyle = stem; ellipse(ctx, xx + 2 * s, y - 3 * s, 1.4 * s, 3.4 * s, 0.4);
            ctx.fillStyle = cup; ctx.beginPath();
            ctx.moveTo(xx - 3 * s, y - h - 4.5 * s); ctx.lineTo(xx - 1.5 * s, y - h - 2.5 * s); ctx.lineTo(xx, y - h - 5 * s);
            ctx.lineTo(xx + 1.5 * s, y - h - 2.5 * s); ctx.lineTo(xx + 3 * s, y - h - 4.5 * s);
            ctx.quadraticCurveTo(xx + 3.2 * s, y - h + 0.6 * s, xx, y - h + 0.6 * s); ctx.quadraticCurveTo(xx - 3.2 * s, y - h + 0.6 * s, xx - 3 * s, y - h - 4.5 * s);
            ctx.fill();
            ctx.fillStyle = hi; ellipse(ctx, xx - 1 * s, y - h - 2 * s, 0.8 * s, 1.6 * s);
          }
          break;
        }
        case 'lavender': {
          const c1 = css(lit(hex('#8a6fd1'))), c2 = css(lit(hex('#b49af0')));
          for (let i = 0; i < 2; i++) {
            const xx = x + i * 17 * s;
            ctx.fillStyle = c1; ellipse(ctx, xx, y - 5 * s, 9 * s, 6 * s);
            ctx.fillStyle = c2; ellipse(ctx, xx - 2 * s, y - 8 * s, 5 * s, 3 * s);
          }
          break;
        }
        case 'wheat': {
          ctx.strokeStyle = css(lit(hex('#e9c86b'))); ctx.lineWidth = 1.4 * s;
          ctx.beginPath();
          for (let i = 0; i < 7; i++) { const xx = x + i * 4 * s, h = (10 + hash(it.seed + i) * 7) * s; ctx.moveTo(xx, y); ctx.lineTo(xx + 2 * s, y - h); }
          ctx.stroke();
          ctx.fillStyle = css(lit(hex('#f2d47e')));
          for (let i = 0; i < 7; i++) { const h = (10 + hash(it.seed + i) * 7) * s; ellipse(ctx, x + i * 4 * s + 2 * s, y - h, 1.4 * s, 3 * s); }
          break;
        }
        case 'tea': {
          ctx.fillStyle = css(lit(hex('#3d8b4f'))); ellipse(ctx, x, y - 4 * s, 15 * s, 7 * s);
          ctx.fillStyle = css(lit(hex('#5aab62'))); ellipse(ctx, x - 3 * s, y - 7 * s, 9 * s, 3 * s);
          break;
        }
        case 'snow': {
          ctx.fillStyle = css(lit(hex('#ffffff'))); ellipse(ctx, x, y - 2 * s, 14 * s, 4 * s);
          ctx.fillStyle = css(lit(hex('#d5e1ee'))); ellipse(ctx, x + 4 * s, y - 1 * s, 9 * s, 2 * s);
          break;
        }
        case 'stones': {
          ctx.fillStyle = css(lit(mixc(pal.near, hex('#7a6a5c'), 0.5)));
          ellipse(ctx, x, y - 2 * s, 4 * s, 2.5 * s); ellipse(ctx, x + 8 * s, y - 1.5 * s, 2.5 * s, 1.8 * s);
          break;
        }
        default: { // çiçekler
          ctx.strokeStyle = css(lit(mul(pal.ground, 0.75))); ctx.lineWidth = 1.2 * s;
          const n = 3 + (hash(it.seed) * 4 | 0);
          for (let i = 0; i < n; i++) {
            const xx = x + (hash(it.seed + i) - 0.5) * 22 * s, h = (5 + hash(it.seed + i * 2) * 7) * s;
            ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y - h); ctx.stroke();
            ctx.fillStyle = css(lit(hex(it.colors[i % it.colors.length]))); circle(ctx, xx, y - h, 2.1 * s);
          }
        }
      }
    }

    drawFg(ctx, it, x, y, k, lit, pal) {
      const s = it.s * k;
      if (it.type === 'tuft') {
        ctx.strokeStyle = css(lit(mul(pal.ground, 0.72))); ctx.lineWidth = 2 * s; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = -2; i <= 2; i++) { ctx.moveTo(x + i * 3 * s, y); ctx.quadraticCurveTo(x + i * 4 * s, y - 8 * s, x + i * 6 * s, y - (12 + Math.abs(i) * -2) * s); }
        ctx.stroke();
        if (it.flower) { ctx.fillStyle = css(lit(hex(it.colors[0]))); circle(ctx, x + 2 * s, y - 13 * s, 2.6 * s); }
      } else if (it.type === 'drift') {
        ctx.fillStyle = css(lit(hex('#f6f9fd'))); ellipse(ctx, x, y, 22 * s, 6 * s);
      } else {
        ctx.fillStyle = css(lit(mixc(pal.ground, hex('#5b5048'), 0.45)));
        ellipse(ctx, x, y, 5 * s, 3 * s); ellipse(ctx, x + 9 * s, y + 1, 3 * s, 2 * s);
      }
    }

    drawRoad(ctx, top, bot, lit, pal, night) {
      const W = this.W, k = this.k;
      const styles = [[this.roadFrom, 1 - this.roadBlend], [this.roadTo, this.roadBlend]];
      for (const [style, a] of styles) {
        if (a <= 0.01) continue;
        ctx.save(); ctx.globalAlpha = a;
        if (style === 'path') {
          ctx.fillStyle = css(lit(mul(pal.road, 0.86))); ctx.fillRect(0, top, W, bot - top);
          ctx.fillStyle = css(lit(pal.road)); ctx.fillRect(0, top + 3, W, bot - top - 7);
          ctx.fillStyle = css(lit(mul(pal.road, 0.8)));
          for (let i = 0; i < 36; i++) {
            const x = ((hash(i) * W * 1.5 - this.scroll) % (W * 1.5) + W * 1.5) % (W * 1.5) - 20;
            ellipse(ctx, x, top + 8 + hash(i + 7) * (bot - top - 16), 2 + hash(i + 3) * 2.5, 1.2 + hash(i + 5));
          }
        } else if (style === 'asphalt') {
          ctx.fillStyle = css(lit(hex('#c9c3b6'))); ctx.fillRect(0, top, W, bot - top);
          ctx.fillStyle = css(lit(hex('#5d6170'))); ctx.fillRect(0, top + 4, W, bot - top - 8);
          ctx.fillStyle = css(lit(hex('#f4ecd9')), 0.9);
          const dash = 46 * k, gap = 34 * k, per = dash + gap;
          const off = this.scroll % per;
          for (let x = -off; x < W; x += per) ctx.fillRect(x, (top + bot) / 2 - 1.5, dash, 3);
        } else { // ray
          ctx.fillStyle = css(lit(hex('#a59a8e'))); ctx.fillRect(0, top + 2, W, bot - top - 2);
          ctx.fillStyle = css(lit(hex('#8e8378')));
          for (let i = 0; i < 60; i++) {
            const x = ((hash(i) * W * 1.5 - this.scroll) % (W * 1.5) + W * 1.5) % (W * 1.5) - 10;
            ellipse(ctx, x, top + 6 + hash(i + 2) * (bot - top - 10), 2, 1.3);
          }
          const per = 22 * k, off = this.scroll % per;
          ctx.fillStyle = css(lit(hex('#6e5442')));
          for (let x = -off; x < W; x += per) ctx.fillRect(x, top + (bot - top) * 0.36, 7 * k, (bot - top) * 0.42);
          ctx.fillStyle = css(lit(hex('#c4cad6')));
          const gy = this.groundY();
          ctx.fillRect(0, gy - 3, W, 3);
          ctx.fillStyle = css(lit(hex('#8a91a1'))); ctx.fillRect(0, top + (bot - top) * 0.72, W, 3);
        }
        ctx.restore();
      }
    }

    drawLamp(ctx, x, y, k, night, lit) {
      const col = css(lit(hex('#4a4f5e')));
      ctx.strokeStyle = col; ctx.lineWidth = 2.6 * k; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 56 * k); ctx.quadraticCurveTo(x, y - 62 * k, x + 7 * k, y - 62 * k); ctx.stroke();
      ctx.fillStyle = night > 0.3 ? '#ffe2a0' : css(lit(hex('#e8e2d0')));
      rrect(ctx, x + 4 * k, y - 62 * k, 10 * k, 5 * k, 2 * k); ctx.fill();
    }

    drawFence(ctx, x, y, k, lit) {
      ctx.fillStyle = css(lit(hex('#a07c5a')));
      for (let i = 0; i < 4; i++) ctx.fillRect(x + i * 18 * k, y - 16 * k, 3 * k, 16 * k);
      ctx.fillRect(x - 2 * k, y - 13 * k, 60 * k, 2.4 * k); ctx.fillRect(x - 2 * k, y - 7 * k, 60 * k, 2.4 * k);
    }

    drawSign(ctx, x, y, k, txt, lit) {
      if (this.textless) return; // telefonda yazılı yol tabelası çizilmez
      ctx.font = `700 ${Math.round(10.5 * k)}px "Figtree", system-ui, sans-serif`;
      const w1 = ctx.measureText(txt.title).width, w2 = ctx.measureText(txt.sub).width;
      const w = Math.max(w1, w2) + 16 * k, h = 32 * k;
      ctx.fillStyle = css(lit(hex('#5e636f'))); ctx.fillRect(x - 1.5 * k, y - 44 * k, 3 * k, 44 * k);
      ctx.fillStyle = css(lit(hex('#1f7a4d'))); rrect(ctx, x - w / 2, y - 44 * k - h, w, h, 4 * k); ctx.fill();
      ctx.strokeStyle = css(lit(hex('#f2f2ea'))); ctx.lineWidth = 1.2 * k; rrect(ctx, x - w / 2 + 2.5 * k, y - 44 * k - h + 2.5 * k, w - 5 * k, h - 5 * k, 3 * k); ctx.stroke();
      ctx.fillStyle = css(lit(hex('#ffffff'))); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt.title, x, y - 44 * k - h + 11 * k);
      ctx.fillText(txt.sub, x, y - 44 * k - h + 22.5 * k);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }

    drawParts(ctx, front) {
      for (const p of this.parts) {
        const isFront = p.type === 'spark' || p.type === 'petal' || p.type === 'leaf' || p.type === 'snow' || p.type === 'streak' || p.type === 'firefly' || p.type === 'rain';
        if (isFront !== front) continue;
        const u = p.life / p.max;
        switch (p.type) {
          case 'dust': ctx.fillStyle = `rgba(235,220,195,${(0.55 * (1 - u)).toFixed(3)})`; circle(ctx, p.x, p.y, p.size * (1 + u)); break;
          case 'smoke': ctx.fillStyle = `rgba(240,240,250,${(0.5 * (1 - u)).toFixed(3)})`; circle(ctx, p.x, p.y, p.size * (1 + u * 2)); break;
          case 'puff': ctx.fillStyle = `rgba(255,255,255,${(0.45 * (1 - u)).toFixed(3)})`; circle(ctx, p.x, p.y, p.size * (1 + u)); break;
          case 'spark': {
            ctx.fillStyle = p.color; ctx.globalAlpha = 1 - u;
            const s = p.size;
            ctx.beginPath(); ctx.moveTo(p.x, p.y - s * 1.8); ctx.lineTo(p.x + s * 0.5, p.y); ctx.lineTo(p.x, p.y + s * 1.8); ctx.lineTo(p.x - s * 0.5, p.y); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x - s * 1.8, p.y); ctx.lineTo(p.x, p.y + s * 0.5); ctx.lineTo(p.x + s * 1.8, p.y); ctx.lineTo(p.x, p.y - s * 0.5); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 1; break;
          }
          case 'petal': case 'leaf':
            ctx.fillStyle = p.color; ellipse(ctx, p.x, p.y, p.size, p.size * 0.55, p.rot); break;
          case 'snow': ctx.fillStyle = 'rgba(255,255,255,0.9)'; circle(ctx, p.x, p.y, p.size); break;
          case 'rain': {
            const f = p.size / p.vy;
            ctx.strokeStyle = `rgba(214,226,246,${(0.55 * Math.min(1, this.rain * 1.5)).toFixed(3)})`; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - (p.vx - this.vs * 0.3) * f, p.y - p.size); ctx.stroke();
            break;
          }
          case 'firefly': {
            const a = Math.min(1, p.life, (p.max - p.life)) * (0.5 + 0.5 * Math.sin(p.life * 5 + p.x));
            glow(ctx, p.x, p.y, 9, hex('#fff3a0'), 0.55 * a);
            ctx.fillStyle = `rgba(255,250,200,${a.toFixed(3)})`; circle(ctx, p.x, p.y, p.size);
            break;
          }
          case 'streak': {
            const a = clamp((this.vs - 250) / 500, 0, 0.35);
            ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; ctx.fillRect(p.x, p.y, p.size, 1.2);
            break;
          }
        }
      }
    }

    // Yabani tilki: gece önce yalnızca gözleri görünür, gövdesi sonra yavaşça belirir; çalılara dalarken solar.
    // Arada başını çevirip yolcuya bakar.
    drawDolphins(ctx, pal, night, space) {
      const d = this.dolphins, s = this.dolScale(), sea = this.seaLine, a = d.a * clamp(pal.sea, 0, 1) * (1 - space);
      d.vis = clamp(pal.sea, 0, 1) * (1 - space); // denizin görünürlüğü (beliriş solması hariç: dokunuş zaten 0,8 sn bekler)
      if (a < 0.02) return;
      // gece: ay ışığında gümüşi siluet, suyun değdiği yerler yeşilimsi mavi ışıldar (deniz ışıması)
      const back = css(mixc(hex('#5b81a3'), hex('#5a7596'), night)), belly = css(mixc(hex('#e3edf4'), hex('#b8c9db'), night));
      const glow = mixc(WHITE, hex('#7ff3e1'), night);
      ctx.save();
      // halkalar: suya değilen yerde yayılan ince elips
      ctx.lineWidth = 1.1 * s;
      for (const g of d.rings) {
        const u = g.t / 1.1;
        ctx.strokeStyle = css(glow, a * (1 - u) * (0.55 + 0.3 * night));
        ctx.beginPath(); ctx.ellipse(g.x, sea + 1.5 * s, (5 + 16 * u) * s * g.w, (1 + 2.2 * u) * s, 0, 0, TAU); ctx.stroke();
      }
      // gece suyun altında yüzen yunusun izi hafifçe ışıldar
      if (night > 0.2) for (let i = 0; i < d.n; i++) {
        const p = this.dolPose(i);
        if (p.air || p.x < -30 * s || p.x > this.W + 30 * s) continue;
        ctx.fillStyle = css(hex('#7ff3e1'), a * night * (0.16 + 0.08 * Math.sin(this.t * 6 + i)));
        ellipse(ctx, p.x - 6 * s, sea + 2.4 * s, 13 * s, 1.6 * s, 0);
      }
      // gövdeler: su çizgisinin altı görünmez
      ctx.beginPath(); ctx.rect(0, 0, this.W, sea); ctx.clip();
      for (let i = 0; i < d.n; i++) {
        const p = this.dolPose(i);
        if (p.air) drawDolphin(ctx, p.x, p.y, s, p.ang, back, belly, a);
      }
      for (const q of d.drops) {
        const f = 1 - q.life / q.max;
        if (night > 0.2) { ctx.fillStyle = css(glow, a * f * 0.25 * night); circle(ctx, q.x, q.y, q.r * 2.6); }
        ctx.fillStyle = css(glow, a * f * 0.9); circle(ctx, q.x, q.y, q.r);
      }
      ctx.restore();
    }
    drawWildFox(ctx, night) {
      const f = this.fox, p = this.foxPos(), k = p.k;
      const lag = night > 0.4 ? 1.2 : 0;
      const a = clamp((f.t - lag) / 1.2, 0, 1) * (f.out ? clamp(1 - f.out / 1.1, 0, 1) : 1);
      if (a <= 0) return;
      const look = f.happy ? 1 : f.out ? 0 : Math.sin(f.t * 0.75 + 1) > 0.55 ? 1 : 0;
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(30,30,50,0.16)'; ellipse(ctx, p.x, p.gy + 1, 15 * k, 2.6 * k);
      drawFox(ctx, p.x, p.y, k, f.ph, this.t, 0, look);
      ctx.restore();
    }
    // Gece tilkinin gözleri ışığı yansıtır: önce karanlıkta bir çift göz, sonra tek gözde hafif bir ışıltı
    drawFoxEyes(ctx, night) {
      const f = this.fox;
      if (night < 0.4) return;
      const p = this.foxPos(), k = p.k;
      const pre = 1 - clamp((f.t - 1.2) / 1.2, 0, 1);
      const a = night * clamp(f.t / 0.5, 0, 1) * (f.out ? clamp(1 - f.out / 0.6, 0, 1) : 1) * ((f.t % 3.1) < 0.12 ? 0.1 : 1);
      if (a <= 0.01) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (pre > 0.01) for (const dx of [-2.4, 2.4]) {
        glow(ctx, p.x + (12 + dx) * k, p.y - 19 * k, 4.2 * k, hex('#ffe08a'), 0.6 * pre * a);
        ctx.fillStyle = css(hex('#fff4c8'), 0.9 * pre * a); circle(ctx, p.x + (12 + dx) * k, p.y - 19 * k, 0.9 * k);
      }
      const look = f.happy ? 1 : f.out ? 0 : Math.sin(f.t * 0.75 + 1) > 0.55 ? 1 : 0;
      const bob = Math.abs(Math.sin(f.ph)) * 1.5 * k;
      glow(ctx, p.x + (11 + (look ? -3.2 : 3.2)) * k, p.y - 20.4 * k - bob, 4 * k, hex('#ffe08a'), 0.45 * (1 - pre) * a);
      ctx.restore();
    }
    drawChest(ctx, c) {
      const k = this.k, p = this.chestPos(), a = clamp(c.t / 0.5, 0, 1) * clamp((c.dur - c.t) / 1.5, 0, 1);
      const bob = Math.abs(Math.sin(c.t * 3)) * 4 * k, x = p.x, y = p.y - bob;
      ctx.save(); ctx.globalAlpha = a;
      ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, y - 14 * k, 46 * k, hex('#ffd56b'), 0.45 + 0.15 * Math.sin(c.t * 5)); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(30,30,50,0.18)'; ellipse(ctx, x, p.y + 2 * k, 18 * k, 3 * k);
      ctx.fillStyle = '#8a5a32'; rrect(ctx, x - 16 * k, y - 18 * k, 32 * k, 18 * k, 3 * k); ctx.fill(); // gövde
      const open = Math.min(1, Math.max(0, Math.sin(c.t * 1.3)) * 0.35);
      ctx.save(); ctx.translate(x - 16 * k, y - 18 * k); ctx.rotate(-open);
      ctx.fillStyle = '#a06a3c'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(16 * k, -14 * k, 32 * k, 0); ctx.closePath(); ctx.fill(); // kapak
      ctx.fillStyle = GOLD; ctx.fillRect(14 * k, -7 * k, 4 * k, 7 * k);
      ctx.restore();
      if (open > 0.05) { ctx.fillStyle = `rgba(255,236,160,${(open * 2).toFixed(3)})`; ellipse(ctx, x, y - 18 * k, 14 * k, 2.4 * k); }
      ctx.fillStyle = GOLD; ctx.fillRect(x - 16 * k, y - 12 * k, 32 * k, 3 * k); ctx.fillRect(x - 2 * k, y - 18 * k, 4 * k, 18 * k);
      ctx.fillStyle = '#5a3a20'; rrect(ctx, x - 3 * k, y - 11 * k, 6 * k, 5 * k, 1 * k); ctx.fill(); // kilit
      ctx.restore();
    }
    // Cam kabarcık: belirirken küçük bir sıçrayışla açılır, sonunda solar; arada bir halka yayarak dikkat çeker
    drawKeep(ctx, c) {
      const k = Math.max(this.k, 0.75), p = this.keepPos(), t = c.t;
      const a = clamp(t / 0.6, 0, 1) * clamp((c.dur - t) / 1.5, 0, 1);
      const u = clamp(t / 0.45, 0, 1), pop = u < 1 ? 1 + 2.7 * Math.pow(u - 1, 3) + 1.7 * Math.pow(u - 1, 2) : 1; // easeOutBack
      const r = 20 * k * pop;
      if (a <= 0 || r <= 0) return;
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(30,30,50,0.14)'; ellipse(ctx, p.x, this.groundY() - 2 * k, 14 * k, 2.6 * k);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, p.x, p.y, 48 * k, hex('#fff1c2'), 0.42 + 0.14 * Math.sin(t * 4));
      ctx.globalCompositeOperation = 'source-over';
      // her 2,4 saniyede yayılan ince halka
      const ring = (t % 2.4) / 2.4;
      if (!this.reduced) { ctx.strokeStyle = `rgba(255,241,194,${(0.55 * (1 - ring) * a).toFixed(3)})`; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.arc(p.x, p.y, r * (1 + ring * 0.9), 0, TAU); ctx.stroke(); }
      const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.1, p.x, p.y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.6, 'rgba(220,236,255,0.22)'); g.addColorStop(1, 'rgba(190,215,255,0.38)');
      ctx.fillStyle = g; circle(ctx, p.x, p.y, r);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `${Math.round(21 * k * pop)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.fillText(c.e, p.x, p.y + 1.5 * k);
      // camın parlak yansıması
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ellipse(ctx, p.x - r * 0.42, p.y - r * 0.45, r * 0.22, r * 0.12, -0.6);
      ctx.restore();
    }
    // Turna sürüsü: belirirken ve dokunulup uzaklaşırken yumuşakça görünür/solar; liderin çevresinde hafif bir ışık
    // Uçurtma ve ipi: serbestken kopuk ip altında sallanır, bağlıyken yolcunun eline hafifçe sarkarak uzanır,
    // bırakılınca ip uçurtmayla birlikte uzaklaşır
    drawKiteState(ctx, c, night) {
      if (c.a <= 0.01) return;
      const k = Math.max(this.k, 0.8), s = 16 * k;
      const ex = c.x - Math.sin(c.ang) * s * 1.15, ey = c.y + Math.cos(c.ang) * s * 1.15; // gövdenin alt ucu (ipin bağlandığı yer)
      ctx.save(); ctx.globalAlpha = c.a;
      ctx.lineCap = 'round';
      ctx.strokeStyle = night > 0.5 ? 'rgba(225,230,245,0.5)' : 'rgba(55,55,75,0.5)'; ctx.lineWidth = Math.max(0.8, 0.9 * this.k);
      ctx.beginPath(); ctx.moveTo(ex, ey);
      if (c.mode === 'tied') {
        const a = this.kiteAnchor(), mx = (ex + a.x) / 2, my = (ey + a.y) / 2 + 22 * k + Math.sin(c.t * 1.7) * 4 * k;
        ctx.quadraticCurveTo(mx, my, a.x, a.y);
      } else {
        // kopuk ip: aşağı sarkar ve rüzgârda geriye savrulur
        const sw = Math.sin(c.t * 2.1 + c.ph) * 10 * k;
        ctx.quadraticCurveTo(ex + 14 * k + sw, ey + 30 * k, ex + 26 * k + sw * 1.4, ey + 52 * k);
      }
      ctx.stroke();
      if (c.mode === 'free') {
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, c.x, c.y + 4 * k, 46 * k, hex(night > 0.5 ? '#cfe0ff' : '#fff8e0'), 0.16 + 0.06 * Math.sin(c.t * 3));
        ctx.globalCompositeOperation = 'source-over';
      }
      drawKite(ctx, c.x, c.y, s, c.ang, c.col, c.t + c.ph, night);
      ctx.restore();
    }
    drawCranes(ctx, c, night) {
      const a = clamp(c.t / 1, 0, 1) * (c.caught ? clamp(1 - c.caught / 1.4, 0, 1) : 1);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a;
      const lead = this.cranePos(c, 0);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, lead.x - 30 * lead.k, lead.y, 90 * lead.k, hex(night > 0.5 ? '#cfe0ff' : '#fff8e0'), (c.caught ? 0.4 : 0.16) + 0.06 * Math.sin(c.t * 3));
      ctx.globalCompositeOperation = 'source-over';
      // arkadakiler önce çizilir, lider en üstte
      for (let i = c.n - 1; i >= 0; i--) { const p = this.cranePos(c, i); drawCrane(ctx, p.x, p.y, p.k, c.caught ? Math.sin(c.t * 16 + i) : p.w, night); }
      ctx.restore();
    }
    drawPumpkins(ctx, it, x, y, k, lit, night) {
      const s = it.s * k, hop = this.pumpkinHop(it) * s, ga = it.lamp ? clamp((night - 0.2) / 0.5, 0, 1) : 0;
      if (it.kind === 'scare') drawScarecrow(ctx, x, y, s, lit, Math.sin(this.t * 0.9 + it.seed) * 0.035 + (hop ? Math.sin(this.t * 30) * 0.02 : 0));
      if (it.kind === 'bale') drawBale(ctx, x + 2 * s, y, 30 * s, 15 * s, lit);
      // küçükler önce (geride), oyulmuş büyük balkabağı en önde; dokununca hepsi sevinçle hoplar
      for (let i = it.pk.length - 1; i >= 0; i--) {
        const p = it.pk[i];
        if (i > 0 || it.pk.length === 1) { ctx.fillStyle = css(lit(hex('#5f8a3a'))); ellipse(ctx, x + (p[0] - p[2] * 0.9) * s, y + p[1] * s - 1 * s, p[2] * 0.5 * s, p[2] * 0.22 * s, -0.4); }
        drawPumpkin(ctx, x + p[0] * s, y + p[1] * s - hop * (i ? 0.7 : 1), p[2] * s, lit, ga, i === 0 && it.lamp);
      }
    }
    drawBirds(ctx, b, night) {
      const a = clamp(b.t / 1, 0, 1) * (b.noted ? clamp(1 - b.noted / 1.6, 0, 1) : 1);
      if (a > 0) {
        ctx.save(); ctx.globalAlpha = a;
        const lead = this.birdPos(b, 0);
        ctx.globalCompositeOperation = 'lighter';
        const rare = b.id === 'hoopoe';
        glow(ctx, lead.x, lead.y, (rare ? 80 : 60) * lead.k, hex(rare ? '#ffd56b' : night > 0.5 ? '#cfe0ff' : '#fff8e0'), (b.noted ? 0.4 : (rare ? 0.22 : 0.1) + 0.12 * night) + 0.05 * Math.sin(b.t * 3));
        ctx.globalCompositeOperation = 'source-over';
        for (let i = b.n - 1; i >= 0; i--) {
          const p = this.birdPos(b, i);
          ctx.save(); ctx.translate(p.x, p.y); if (p.dir < 0) ctx.scale(-1, 1);
          BIRD_ART[b.id](ctx, 0, 0, p.k, p.w, night, b.noted ? Math.min(1, b.noted * 3) : 0.25 + 0.15 * Math.sin(b.t * 2));
          ctx.restore();
        }
        ctx.restore();
      }
      // dürbün halkası: dokunulan yerde iki yuvarlak mercek büyüyerek solar
      const r = b.ring;
      if (r && r.t < 0.9) {
        const e = r.t / 0.9, rad = (12 + 16 * Math.sqrt(e)) * r.k, al = 1 - e;
        ctx.save(); ctx.lineWidth = 3.4 * r.k; ctx.strokeStyle = `rgba(40,50,90,${(0.22 * al).toFixed(3)})`;
        for (const d of [-0.62, 0.62]) { ctx.beginPath(); ctx.arc(r.x + d * rad, r.y, rad, 0, TAU); ctx.stroke(); }
        ctx.lineWidth = 1.8 * r.k; ctx.strokeStyle = `rgba(255,250,232,${(0.9 * al).toFixed(3)})`;
        for (const d of [-0.62, 0.62]) { ctx.beginPath(); ctx.arc(r.x + d * rad, r.y, rad, 0, TAU); ctx.stroke(); }
        ctx.restore();
      }
    }
    // Katlanmış kâğıt uçak: açık gökte ince bir kontur, gecede ve uzayda sıcak bir ışıltıyla seçilir
    drawPlane(ctx, p, night) {
      const k = Math.max(this.k, 0.8) * 1.45, a = clamp(p.t / 0.8, 0, 1) * clamp((p.dur - p.t) / 1, 0, 1), s = 13 * k;
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a;
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, p.x, p.y, 34 * k, hex('#fff1c8'), 0.22 + 0.25 * Math.max(night, (this.space || 0) / 0.6) + 0.08 * Math.sin(p.t * 4));
      ctx.globalCompositeOperation = 'source-over';
      ctx.translate(p.x, p.y); ctx.rotate(p.ang);
      // takla atarken ters dönmesin: uçak yön değiştirirken yumuşakça yan yatıp öbür yüzüne döner (birden sıçramaz)
      ctx.scale(1, clamp(Math.cos(p.ang) * 4 + 0.8, -1, 1) || 0.01);
      ctx.lineJoin = 'round'; ctx.lineWidth = 1.1 * k; ctx.strokeStyle = 'rgba(60,70,105,0.5)';
      const flap = Math.sin(p.t * 5 + p.ph) * 0.06 * s;
      // alt kanat (gölgeli), üst kanat (açık), orta kat çizgisi
      ctx.fillStyle = '#e6dcc4';
      ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-0.9 * s, 0.42 * s + flap); ctx.lineTo(-0.5 * s, 0.08 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fffdf6';
      ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s, -0.55 * s - flap); ctx.lineTo(-0.5 * s, 0.08 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(60,70,105,0.35)'; ctx.lineWidth = 0.8 * k;
      ctx.beginPath(); ctx.moveTo(s * 0.95, 0); ctx.lineTo(-0.72 * s, -0.2 * s); ctx.stroke();
      // kanatta küçük kırmızı bir mühür: mektup taşıdığı belli olsun
      ctx.fillStyle = '#d0533f'; circle(ctx, -0.35 * s, -0.16 * s, 0.11 * s);
      ctx.restore();
    }
    // Karahindiba tohumu: altta küçük kahverengi tohum, ince bir sap ve tepede ışınsal beyaz teller (paraşüt)
    drawSeed(ctx, s) {
      // açık gökyüzünde de seçilsin: biraz büyük, tellerin altında ince ve koyu bir kontur
      const k = Math.max(this.k, 0.8) * 1.35, a = clamp(s.t / 0.8, 0, 1) * clamp((s.dur - s.t) / 1.2, 0, 1);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a;
      ctx.globalCompositeOperation = 'lighter'; glow(ctx, s.x, s.y - 5 * k, 30 * k, hex('#fff8d6'), 0.32 + 0.12 * Math.sin(s.t * 4)); ctx.globalCompositeOperation = 'source-over';
      ctx.translate(s.x, s.y); ctx.rotate(s.rot);
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(150,130,100,0.95)'; ctx.lineWidth = 1.2 * k;
      ctx.beginPath(); ctx.moveTo(0, 8 * k); ctx.quadraticCurveTo(1.5 * k, 2 * k, 0, -4 * k); ctx.stroke();
      ctx.fillStyle = '#8a6a3f'; ellipse(ctx, 0, 9.5 * k, 1.4 * k, 2.7 * k);
      const rays = [];
      for (let i = 0; i < 15; i++) {
        const ang = -Math.PI + (i / 14) * Math.PI + Math.sin(s.t * 2 + i) * 0.04, len = (8.5 + (i % 3) * 0.8) * k;
        rays.push([Math.cos(ang) * len, -4 * k + Math.sin(ang) * len]);
      }
      for (const [w, col] of [[1.9 * k, 'rgba(70,80,110,0.28)'], [0.95 * k, 'rgba(255,255,255,0.98)']]) {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
        for (const [ex, ey] of rays) { ctx.moveTo(0, -4 * k); ctx.lineTo(ex, ey); }
        ctx.stroke();
      }
      for (const [ex, ey] of rays) { ctx.fillStyle = 'rgba(70,80,110,0.25)'; circle(ctx, ex, ey, 1.5 * k); ctx.fillStyle = '#ffffff'; circle(ctx, ex, ey, 1 * k); }
      ctx.restore();
    }
    // dört köşeli yıldız parıltısı
    spark(ctx, x, y, r) {
      ctx.beginPath();
      ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
    }
    // Aktif takımyıldız: sönük yıldızlar yumuşakça nabız atar, dokunulanlar parlayıp büyür, aralarındaki çizgi uzayarak çizilir.
    // Tamamlanınca bütün çizgiler parlar; süre dolunca solar.
    drawConst(ctx, a, vis) {
      const k = Math.max(this.k, 0.8), t = a.t;
      const fade = a.done ? clamp((4 - a.done) / 1.2, 0, 1) : t > a.dur ? clamp((a.dur + 1.5 - t) / 1.5, 0, 1) : 1;
      const al = clamp(t / 1.2, 0, 1) * fade * vis;
      if (al <= 0.01) return;
      const pts = a.c.s.map((_, i) => this.constStarPos(a, i));
      const litA = i => clamp(a.lit[i] / 0.5, 0, 1);
      ctx.save(); ctx.globalAlpha = al; ctx.globalCompositeOperation = 'lighter';
      // çizgiler: iki ucu da yanan kenarlar, önce yanan yıldızdan ötekine doğru uzar
      const glowL = a.done ? 0.6 + 0.4 * Math.sin(a.done * 6) : 0;
      ctx.lineCap = 'round'; ctx.lineWidth = (1.4 + glowL) * k;
      for (const [i, j] of a.c.e) {
        if (!a.lit[i] || !a.lit[j]) continue;
        const [p, q] = a.lit[i] >= a.lit[j] ? [pts[i], pts[j]] : [pts[j], pts[i]];
        const u = Math.min(litA(i), litA(j));
        ctx.strokeStyle = `rgba(207,224,255,${(0.75 + 0.25 * glowL).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(lerp(p.x, q.x, u), lerp(p.y, q.y, u)); ctx.stroke();
      }
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], L = litA(i);
        if (!a.lit[i]) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + i * 1.3);
          glow(ctx, p.x, p.y, (12 + 6 * pulse) * k, hex('#cfe0ff'), 0.35 + 0.25 * pulse);
          ctx.fillStyle = `rgba(255,255,255,${(0.75 + 0.25 * pulse).toFixed(3)})`; circle(ctx, p.x, p.y, 2.6 * k);
        } else {
          const pop = 1 + 0.9 * (1 - L);
          glow(ctx, p.x, p.y, 22 * k * pop, hex('#dfe8ff'), 0.55 + 0.3 * glowL);
          ctx.fillStyle = 'rgba(255,255,255,0.98)';
          this.spark(ctx, p.x, p.y, (5 + 1.2 * Math.sin(t * 5 + i)) * k * pop);
        }
      }
      ctx.restore();
    }
    // Bulunan takımyıldızlar: geniş bir şeritte (2 ekran) yıldızlarla aynı hızda kayar, ince çizgilerle hep gökyüzündedir
    drawSkyMap(ctx, starA, space) {
      const k = Math.max(this.k, 0.8), W = this.W, H = this.H, band = 2 * W;
      const off = this.scroll * 0.004 * (1 + space * 3), bw = 84 * k, bh = 52 * k;
      const all = IT.CONSTELLATIONS || [];
      ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 1 * k;
      const fade = this.mapFade || (this.mapFade = {});
      for (let j = 0; j < all.length; j++) {
        const c = all[j];
        // tamamlanıp henüz solmayan takımyıldız haritaya ancak solduktan sonra işlenir (iki kez görünmesin), sonra yumuşakça belirir
        if (this.constel && this.constel.c === c) { fade[c.id] = -1; continue; }
        if (!this.constFound.includes(c.id)) continue;
        if (fade[c.id] === -1) fade[c.id] = this.t;
        const a = starA * (fade[c.id] ? clamp((this.t - fade[c.id]) / 1.5, 0, 1) : 1);
        const px = (((j + 0.5) / all.length * band - off) % band + band) % band - W * 0.5, py = H * (0.05 + 0.3 * hash(j * 3.7 + 1));
        if (px < -bw - 20 || px > W + 20 || a < 0.01) continue;
        ctx.strokeStyle = `rgba(207,224,255,${(0.3 * a).toFixed(3)})`;
        ctx.fillStyle = `rgba(255,255,255,${(0.85 * a).toFixed(3)})`;
        ctx.beginPath();
        for (const [i, m] of c.e) { ctx.moveTo(px + c.s[i][0] * bw, py + c.s[i][1] * bh); ctx.lineTo(px + c.s[m][0] * bw, py + c.s[m][1] * bh); }
        ctx.stroke();
        for (const s of c.s) circle(ctx, px + s[0] * bw, py + s[1] * bh, 1.4 * k);
      }
      ctx.restore();
    }
    drawStar(ctx, s) {
      const k = Math.max(this.k, 0.8), fade = clamp((s.dur + 0.6 - s.t) / 0.6, 0, 1) * clamp(s.t / 0.25, 0, 1);
      const len = Math.hypot(s.vx, s.vy), ux = s.vx / len, uy = s.vy / len, tail = 130 * k;
      const g = ctx.createLinearGradient(s.x, s.y, s.x - ux * tail, s.y - uy * tail);
      g.addColorStop(0, `rgba(255,255,255,${(0.95 * fade).toFixed(3)})`);
      g.addColorStop(0.35, `rgba(207,224,255,${(0.45 * fade).toFixed(3)})`);
      g.addColorStop(1, 'rgba(207,224,255,0)');
      ctx.strokeStyle = g; ctx.lineCap = 'round'; ctx.lineWidth = 2.6 * k;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - ux * tail, s.y - uy * tail); ctx.stroke();
      glow(ctx, s.x, s.y, 22 * k, hex('#dfe8ff'), 0.55 * fade);
      ctx.fillStyle = `rgba(255,255,255,${fade.toFixed(3)})`;
      // dört köşeli parıltı
      const r = 5 * k * (1 + 0.15 * Math.sin(s.t * 18));
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - r); ctx.quadraticCurveTo(s.x, s.y, s.x + r, s.y); ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + r);
      ctx.quadraticCurveTo(s.x, s.y, s.x - r, s.y); ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - r); ctx.fill();
    }
    drawButterfly(ctx, g) {
      const k = Math.max(this.k, 0.8);
      const flap = 0.25 + 0.75 * Math.abs(Math.sin(g.t * 12));
      const pulse = 0.5 + 0.5 * Math.sin(g.t * 4);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, g.x, g.y, (46 + pulse * 10) * k, hex('#ffd56b'), 0.45);
      ctx.globalCompositeOperation = 'source-over';
      ctx.translate(g.x, g.y); ctx.rotate(Math.sin(g.t * 3.3) * 0.15);
      const wing = (sx, sy, rx, ry, rot, c1, c2) => {
        const gr = ctx.createRadialGradient(sx * 0.3, sy * 0.3, 1, sx, sy, Math.max(rx, ry) * 1.2);
        gr.addColorStop(0, c1); gr.addColorStop(1, c2); ctx.fillStyle = gr; ellipse(ctx, sx, sy, rx, ry, rot);
      };
      ctx.save(); ctx.scale(flap, 1);
      wing(-9 * k, -8 * k, 11 * k, 8 * k, -0.6, '#fff4c2', '#f0a93a');
      wing(9 * k, -8 * k, 11 * k, 8 * k, 0.6, '#fff4c2', '#f0a93a');
      wing(-7 * k, 6 * k, 7 * k, 6 * k, 0.5, '#ffe28a', '#e58f2e');
      wing(7 * k, 6 * k, 7 * k, 6 * k, -0.5, '#ffe28a', '#e58f2e');
      ctx.restore();
      ctx.fillStyle = '#5a3d2a'; ellipse(ctx, 0, 0, 2 * k, 9 * k);
      ctx.strokeStyle = '#5a3d2a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -8 * k); ctx.lineTo(-4 * k, -14 * k); ctx.moveTo(0, -8 * k); ctx.lineTo(4 * k, -14 * k); ctx.stroke();
      ctx.restore();
    }

    drawFloats(ctx) {
      for (const f of this.floats) {
        const u = f.life / f.max;
        const y = f.y - u * (f.big ? 60 : 44) * this.k;
        const a = u < 0.15 ? u / 0.15 : 1 - Math.max(0, (u - 0.55) / 0.45);
        const size = Math.round((f.big ? 22 : 15) * Math.max(this.k, 0.8) * this.tz());
        ctx.font = `800 ${size}px "Baloo 2", "Figtree", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 4; ctx.strokeStyle = `rgba(30,33,64,${(0.55 * a).toFixed(3)})`; ctx.lineJoin = 'round';
        ctx.strokeText(f.text, f.x, y);
        ctx.fillStyle = f.color; ctx.globalAlpha = a; ctx.fillText(f.text, f.x, y); ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
      }
    }
  }

  function lerpWhite(c, t) { return mixc(c, WHITE, t); }

  /* ---------- Mağaza simgeleri ---------- */
  function drawIcon(canvas, id, locked, tier) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 72, h = canvas.clientHeight || 56;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (id === 'mystery') return drawGarageDoor(ctx, w, h, getComputedStyle(canvas).color);
    const sizes = { walk: [0.62, 0.5, 0.93], skates: [0.6, 0.5, 0.93], board: [0.6, 0.5, 0.93], bike: [0.56, 0.5, 0.93], horse: [0.5, 0.44, 0.96],
      moto: [0.5, 0.52, 0.93], car: [0.48, 0.5, 0.85], van: [0.46, 0.5, 0.88], train: [0.36, 0.5, 0.86], balloon: [0.46, 0.5, 0.62],
      plane: [0.52, 0.48, 0.5], jet: [0.5, 0.46, 0.55], rocket: [0.56, 0.42, 0.5], sail: [0.38, 0.62, 0.62], comet: [0.5, 0.66, 0.66], warp: [0.48, 0.5, 0.56],
      whale: [0.48, 0.52, 0.66], startrain: [0.4, 0.66, 0.66], anka: [0.46, 0.62, 0.68], chrono: [0.58, 0.6, 0.66] };
    const [k, xf, yf] = sizes[id];
    const st = { phase: 0.9, wheel: 0.3, t: 1.2, night: 0, tier: tier || 0, icon: true };
    // Sv. 200: aracın arkasında minik bir gökkuşağı yayı (sahnedeki iz simgeye sığmaz)
    if (tier >= 6) {
      ctx.save(); ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
      RIBBON.forEach((c, j) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(w / 2, h * 0.98, h * (0.78 - j * 0.07), Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); });
      ctx.restore();
    }
    ctx.save();
    if (id === 'train') { ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); }
    drawVehicle(ctx, id, w * xf, h * yf, k * (h / 56), st);
    ctx.restore();
    // Sv. 150 ve üstü: simgenin çevresinde parıltılar
    if (tier >= 5) {
      // açık ve koyu kart zemininde de seçilsin diye ince koyu kenarlı altın yıldızlar
      for (const [px, py, r] of [[w * 0.1, h * 0.2, 4.2], [w * 0.88, h * 0.16, 3.4], [w * 0.92, h * 0.62, 2.8], [w * 0.16, h * 0.7, 2.6]]) {
        ctx.beginPath(); ctx.moveTo(px, py - r); ctx.quadraticCurveTo(px, py, px + r, py); ctx.quadraticCurveTo(px, py, px, py + r);
        ctx.quadraticCurveTo(px, py, px - r, py); ctx.quadraticCurveTo(px, py, px, py - r);
        ctx.fillStyle = GOLD; ctx.strokeStyle = 'rgba(90,60,10,0.45)'; ctx.lineWidth = 0.8; ctx.fill(); ctx.stroke();
      }
    }
    if (locked) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(40,44,82,0.92)'; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  // Kilitli araçlar için kapalı garaj kapısı: aracın biçimini ele vermez
  function drawGarageDoor(ctx, w, h, col) {
    const x = w * 0.18, y = h * 0.16, dw = w * 0.64, dh = h * 0.72;
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(x - 4, y + 6); ctx.lineTo(w / 2, y - 4); ctx.lineTo(x + dw + 4, y + 6); ctx.stroke();
    ctx.globalAlpha = 0.35;
    for (let i = 1; i < 6; i++) { const yy = y + 6 + (dh - 6) * i / 6; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + dw, yy); ctx.stroke(); }
    ctx.globalAlpha = 0.9;
    rrect(ctx, x, y + 6, dw, dh - 6, 3); ctx.stroke();
    ctx.font = `800 ${Math.round(h * 0.42)}px "Baloo 2", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', w / 2, y + 6 + (dh - 6) / 2 + 1);
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  // Kuş Defteri simgesi: kanatları açık kuş; bulunmamışsa yalnızca soluk silueti (kartın yazı rengiyle, temaya uyar).
  // [boy (yüksekliğe göre), x, y]: her kuş kendi biçimine göre kutuya sığdırılır
  const BIRD_ICON = { stork: [1.05, 0.47, 0.64], flamingo: [1.05, 0.47, 0.64], beeeater: [1.8, 0.55, 0.66], woodpecker: [1.9, 0.49, 0.7],
    eagle: [0.92, 0.5, 0.86], owl: [1.75, 0.5, 0.74], kingfisher: [2.15, 0.42, 0.65], hoopoe: [1.9, 0.47, 0.74] };
  function drawBirdIcon(canvas, id, locked) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 64, h = canvas.clientHeight || 44;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const ic = BIRD_ICON[id];
    if (!ic) return;
    const k = Math.min(ic[0] * h / 44, ic[0] * w / 64);
    BIRD_ART[id](ctx, w * ic[1], h * ic[2], k, 0.75, 0, 1);
    if (locked) {
      ctx.globalCompositeOperation = 'source-in';
      ctx.globalAlpha = 0.42; ctx.fillStyle = getComputedStyle(canvas).color; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
  }

  IT.Scene = Scene;
  IT.drawIcon = drawIcon;
  IT.drawBirdIcon = drawBirdIcon;
})();
