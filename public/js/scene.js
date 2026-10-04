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
    drawLeg(legs[1], true); drawArm(arms[0], true);
    backpack(ctx, sx, sy, k, lean);
    torso(ctx, hx, hy, sx, sy, k);
    head(ctx, sx + 3 * k, sy - 9 * k, k);
    drawLeg(legs[0], false); drawArm(arms[1], false);
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

  function drawBike(ctx, x, y, k, st) {
    const r = 14 * k, wy = y - r;
    const rx = x - 22 * k, fx = x + 22 * k;
    const bb = [x - 2 * k, y - 12 * k], seat = [x - 8 * k, y - 35 * k], headT = [x + 14 * k, y - 33 * k], bar = [x + 15 * k, y - 40 * k];
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // arka bacak
    const hip = [x - 8 * k, y - 39 * k], sh = [x + 6 * k, y - 62 * k];
    const cr = 6.5 * k;
    const pedal = q => [bb[0] + Math.cos(q) * cr, bb[1] + Math.sin(q) * cr];
    const p1 = pedal(st.phase), p2 = pedal(st.phase + Math.PI);
    const kn2 = ik(hip[0], hip[1], p2[0], p2[1], 16 * k, 16 * k, 1);
    line(ctx, [hip[0], hip[1], kn2[0], kn2[1], p2[0], p2[1]], 7 * k, P.pantsDark); shoe(ctx, p2[0] - 2 * k, p2[1] + 2 * k, k);
    wheel(ctx, rx, wy, r, st.wheel, k); wheel(ctx, fx, wy, r, st.wheel, k);
    line(ctx, [rx, wy, bb[0], bb[1], headT[0], headT[1], seat[0], seat[1], rx, wy], 3 * k, P.teal);
    line(ctx, [seat[0], seat[1], bb[0], bb[1]], 3 * k, P.teal);
    line(ctx, [headT[0], headT[1], fx, wy], 3 * k, P.teal);
    line(ctx, [headT[0], headT[1], bar[0], bar[1], bar[0] + 5 * k, bar[1] + 1 * k], 2.4 * k, P.dark);
    ctx.fillStyle = P.dark; rrect(ctx, seat[0] - 6 * k, seat[1] - 3 * k, 11 * k, 3.6 * k, 1.8 * k); ctx.fill();
    // basket
    ctx.fillStyle = '#c99a5b'; rrect(ctx, fx - 4 * k, y - 46 * k, 12 * k, 8 * k, 2 * k); ctx.fill();
    ctx.fillStyle = '#ff9fb4'; circle(ctx, fx, y - 47 * k, 2.4 * k); ctx.fillStyle = '#ffd25e'; circle(ctx, fx + 4 * k, y - 48 * k, 2.2 * k);
    backpack(ctx, sh[0], sh[1], k, 0.5);
    torso(ctx, hip[0], hip[1], sh[0], sh[1], k);
    head(ctx, sh[0] + 5 * k, sh[1] - 8 * k, k);
    const kn1 = ik(hip[0], hip[1], p1[0], p1[1], 16 * k, 16 * k, 1);
    line(ctx, [hip[0], hip[1], kn1[0], kn1[1], p1[0], p1[1]], 7 * k, P.pants); shoe(ctx, p1[0] - 2 * k, p1[1] + 2 * k, k);
    const el = ik(sh[0], sh[1] + 2 * k, bar[0] + 3 * k, bar[1], 11 * k, 11 * k, -1);
    line(ctx, [sh[0], sh[1] + 2 * k, el[0], el[1], bar[0] + 3 * k, bar[1]], 5.6 * k, P.jacket);
    ctx.fillStyle = P.skin; circle(ctx, bar[0] + 3 * k, bar[1], 2.6 * k);
  }

  function drawMoto(ctx, x, y, k, st) {
    const r = 15 * k, wy = y - r, rx = x - 27 * k, fx = x + 27 * k;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    line(ctx, [x - 16 * k, y - 15 * k, x - 36 * k, y - 18 * k], 4 * k, '#8e95a6'); // egzoz
    wheel(ctx, rx, wy, r, st.wheel, k, '#22262f', '#6d7486'); wheel(ctx, fx, wy, r, st.wheel, k, '#22262f', '#6d7486');
    line(ctx, [fx, wy, x + 18 * k, y - 44 * k], 3.4 * k, '#8e95a6');
    ctx.fillStyle = '#596173'; rrect(ctx, x - 12 * k, y - 26 * k, 20 * k, 13 * k, 3 * k); ctx.fill();
    ctx.fillStyle = P.jacket; ctx.beginPath();
    ctx.moveTo(x - 28 * k, y - 30 * k); ctx.quadraticCurveTo(x - 10 * k, y - 36 * k, x + 4 * k, y - 38 * k);
    ctx.quadraticCurveTo(x + 18 * k, y - 40 * k, x + 22 * k, y - 30 * k); ctx.lineTo(x + 10 * k, y - 24 * k);
    ctx.lineTo(x - 24 * k, y - 24 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ellipse(ctx, x + 6 * k, y - 34 * k, 8 * k, 2 * k, -0.15);
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
    ctx.fillStyle = P.jacket; rrect(ctx, x - 46 * k, by - 25 * k, 92 * k, 21 * k, 9 * k); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; rrect(ctx, x - 40 * k, by - 22 * k, 80 * k, 3 * k, 1.5 * k); ctx.fill();
    ctx.fillStyle = P.jacketDark; rrect(ctx, x - 46 * k, by - 10 * k, 92 * k, 6 * k, 3 * k); ctx.fill();
    ctx.fillStyle = '#fff3c4'; ellipse(ctx, x + 43 * k, by - 17 * k, 3 * k, 3.6 * k);
    ctx.fillStyle = '#ff6b6b'; ellipse(ctx, x - 44 * k, by - 18 * k, 2 * k, 3 * k);
    ctx.fillStyle = P.dark; rrect(ctx, x - 6 * k, by - 18 * k, 7 * k, 2 * k, 1 * k); ctx.fill();
    // portbagaj ve valiz
    ctx.fillStyle = '#7a5a43'; rrect(ctx, x - 22 * k, by - 50 * k, 26 * k, 7 * k, 2 * k); ctx.fill();
    ctx.fillStyle = P.pack; rrect(ctx, x - 20 * k, by - 55 * k, 20 * k, 6 * k, 2 * k); ctx.fill();
    wheel(ctx, x - 28 * k, y - 11 * k, 11 * k, st.wheel, k, '#22262f', '#c7ccd8');
    wheel(ctx, x + 28 * k, y - 11 * k, 11 * k, st.wheel, k, '#22262f', '#c7ccd8');
  }

  function drawTrain(ctx, x, y, k, st) {
    const top = y - 58 * k, bot = y - 9 * k;
    const lit = st.night > 0.35;
    const winCol = lit ? '#ffe7a8' : '#b8dcee';
    // vagonlar (sola doğru)
    for (let c = 0; c < 3; c++) {
      const x1 = x - 52 * k - (c + 1) * 96 * k, x2 = x1 + 92 * k;
      ctx.fillStyle = '#e9e1d2'; rrect(ctx, x1, top + 4 * k, x2 - x1, bot - top - 4 * k, 7 * k); ctx.fill();
      ctx.fillStyle = P.teal; ctx.fillRect(x1, bot - 16 * k, x2 - x1, 7 * k);
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
    ctx.fillStyle = '#fff3c4'; circle(ctx, x + 54 * k, bot - 10 * k, 2.8 * k);
    for (const wx of [x - 36 * k, x - 20 * k, x + 22 * k, x + 38 * k]) wheel(ctx, wx, bot + 2 * k, 6.5 * k, st.wheel, k * 0.7, '#2b2f3a', '#6d7486');
  }

  function drawPlane(ctx, x, y, k, st) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(st.t * 0.9) * 0.03 - 0.02);
    ctx.fillStyle = '#c9c2b4'; ellipse(ctx, -2 * k, 7 * k, 30 * k, 5 * k, 0.05); // arka kanat
    ctx.fillStyle = P.cream; ctx.beginPath();
    ctx.moveTo(-50 * k, -4 * k); ctx.quadraticCurveTo(-30 * k, -14 * k, 10 * k, -13 * k);
    ctx.quadraticCurveTo(40 * k, -12 * k, 46 * k, 0); ctx.quadraticCurveTo(40 * k, 12 * k, 10 * k, 12 * k);
    ctx.quadraticCurveTo(-30 * k, 10 * k, -50 * k, 2 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.jacket; ctx.beginPath(); // kuyruk
    ctx.moveTo(-50 * k, -3 * k); ctx.lineTo(-56 * k, -26 * k); ctx.lineTo(-44 * k, -26 * k); ctx.lineTo(-30 * k, -8 * k); ctx.closePath(); ctx.fill();
    ctx.fillRect(-46 * k, 0, 86 * k, 3.5 * k);
    ctx.fillStyle = st.night > 0.5 ? '#ffe7a8' : P.glass;
    for (let w = 0; w < 4; w++) circle(ctx, -24 * k + w * 9 * k, -4 * k, 2.6 * k);
    ctx.fillStyle = P.glass; ctx.beginPath(); ctx.moveTo(18 * k, -12 * k); ctx.quadraticCurveTo(32 * k, -11 * k, 38 * k, -4 * k);
    ctx.lineTo(20 * k, -4 * k); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(16 * k, -14 * k, 24 * k, 10 * k); ctx.clip(); head(ctx, 26 * k, -6 * k, k * 0.7); ctx.restore();
    ctx.fillStyle = '#e2d9c8'; ellipse(ctx, 2 * k, 5 * k, 26 * k, 4.5 * k, 0.12); // ön kanat
    ctx.fillStyle = P.jacket; ellipse(ctx, 24 * k, 5 * k, 4 * k, 3 * k, 0.12);
    ctx.fillStyle = P.dark; circle(ctx, 46 * k, 0, 3 * k);
    ctx.fillStyle = 'rgba(60,66,82,0.35)'; ellipse(ctx, 48 * k, 0, 2.2 * k, 17 * k * (0.75 + 0.25 * Math.sin(st.t * 60)));
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
    ctx.restore();
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
    ctx.restore();
  }

  // Kaykay: ön ayak tahtada, arka ayak yere basıp iter
  function drawBoard(ctx, x, y, k, st) {
    const by = y - 6 * k, q = st.phase;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = '#7d8496'; ctx.fillRect(x - 15 * k, by + 1 * k, 6 * k, 2 * k); ctx.fillRect(x + 9 * k, by + 1 * k, 6 * k, 2 * k);
    ctx.fillStyle = '#ffd56b'; circle(ctx, x - 12 * k, y - 2.4 * k, 2.4 * k); circle(ctx, x + 12 * k, y - 2.4 * k, 2.4 * k);
    ctx.strokeStyle = '#c96f3b'; ctx.lineWidth = 3.4 * k;
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
    head(ctx, sx + 3 * k, sy - 9 * k, k);
    const kf = ik(hx, hy, frontFoot[0], frontFoot[1], L, L, 1);
    line(ctx, [hx, hy, kf[0], kf[1], frontFoot[0], frontFoot[1]], 7 * k, P.pants); shoe(ctx, frontFoot[0], frontFoot[1], k);
    const af = [sx + 15 * k, sy + 10 * k], ef = ik(sx, sy + 2 * k, af[0], af[1], 11.5 * k, 11.5 * k, -1);
    line(ctx, [sx, sy + 2 * k, ef[0], ef[1], af[0], af[1]], 5.6 * k, P.jacket);
    ctx.fillStyle = P.skin; circle(ctx, af[0], af[1], 2.6 * k); circle(ctx, ab[0], ab[1], 2.6 * k);
  }

  // At: dört nala koşan doru at, yolcu eyerde
  function drawHorse(ctx, x, y, k, st) {
    const q = st.phase, bob = Math.abs(Math.sin(q)) * 2 * k;
    const coat = '#a8703f', dark = '#7d4f2a', mane = '#3d2a22';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (lx, off, back) => {
      const a = Math.sin(q + off) * 0.55, top = [lx, y - 26 * k - bob];
      const knee = [top[0] + Math.sin(a) * 11 * k, top[1] + Math.cos(a) * 11 * k];
      const bend = Math.max(0, Math.cos(q + off)) * 0.9 * (back ? -1 : 1);
      const hoof = [knee[0] + Math.sin(a + bend) * 12 * k, Math.min(y - 1 * k, knee[1] + Math.cos(a + bend) * 12 * k)];
      line(ctx, [top[0], top[1], knee[0], knee[1], hoof[0], hoof[1]], 4.2 * k, back ? dark : coat);
      ctx.fillStyle = '#2f2722'; ellipse(ctx, hoof[0] + 1 * k, hoof[1], 2.6 * k, 1.6 * k);
    };
    leg(x - 16 * k, 0.6, true); leg(x + 12 * k, 2.2, true);
    // kuyruk
    ctx.strokeStyle = mane; ctx.lineWidth = 4 * k;
    ctx.beginPath(); ctx.moveTo(x - 23 * k, y - 36 * k - bob);
    ctx.quadraticCurveTo(x - 34 * k, y - 34 * k - bob + Math.sin(q * 2) * 2 * k, x - 33 * k, y - 20 * k - bob + Math.sin(q * 2) * 3 * k); ctx.stroke();
    // gövde ve boyun
    ctx.fillStyle = coat; ellipse(ctx, x, y - 33 * k - bob, 25 * k, 10.5 * k);
    ctx.beginPath(); ctx.moveTo(x + 13 * k, y - 40 * k - bob); ctx.quadraticCurveTo(x + 22 * k, y - 52 * k - bob, x + 27 * k, y - 58 * k - bob);
    ctx.lineTo(x + 33 * k, y - 50 * k - bob); ctx.quadraticCurveTo(x + 26 * k, y - 38 * k - bob, x + 20 * k, y - 28 * k - bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = coat; ellipse(ctx, x + 34 * k, y - 53 * k - bob, 9 * k, 4.6 * k, 0.55);
    ctx.fillStyle = dark; circle(ctx, x + 39 * k, y - 49 * k - bob, 1.3 * k);
    ctx.fillStyle = coat; ctx.beginPath(); ctx.moveTo(x + 27 * k, y - 59 * k - bob); ctx.lineTo(x + 28 * k, y - 65 * k - bob); ctx.lineTo(x + 31 * k, y - 59 * k - bob); ctx.fill();
    ctx.fillStyle = P.dark; circle(ctx, x + 32 * k, y - 56 * k - bob, 1.1 * k);
    ctx.strokeStyle = mane; ctx.lineWidth = 3.4 * k;
    ctx.beginPath(); ctx.moveTo(x + 27 * k, y - 59 * k - bob); ctx.quadraticCurveTo(x + 20 * k, y - 50 * k - bob, x + 14 * k, y - 42 * k - bob); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ellipse(ctx, x - 4 * k, y - 38 * k - bob, 14 * k, 3 * k, -0.05);
    leg(x - 12 * k, 3.6, false); leg(x + 16 * k, 5.2, false);
    // eyer ve yolcu
    ctx.fillStyle = P.teal; rrect(ctx, x - 12 * k, y - 45 * k - bob, 18 * k, 9 * k, 3 * k); ctx.fill();
    ctx.fillStyle = '#5a3d2a'; rrect(ctx, x - 10 * k, y - 47 * k - bob, 14 * k, 4 * k, 2 * k); ctx.fill();
    const hip = [x - 3 * k, y - 47 * k - bob], sh = [x + 3 * k, y - 70 * k - bob];
    backpack(ctx, sh[0], sh[1], k, 0.2);
    torso(ctx, hip[0], hip[1], sh[0], sh[1], k);
    const knee = [x + 7 * k, y - 37 * k - bob], foot = [x + 4 * k, y - 26 * k - bob];
    line(ctx, [hip[0], hip[1], knee[0], knee[1], foot[0], foot[1]], 7 * k, P.pants); shoe(ctx, foot[0], foot[1], k);
    head(ctx, sh[0] + 3 * k, sh[1] - 9 * k, k);
    const hand = [x + 17 * k, y - 50 * k - bob], el = ik(sh[0], sh[1] + 2 * k, hand[0], hand[1], 11.5 * k, 11.5 * k, -1);
    line(ctx, [sh[0], sh[1] + 2 * k, el[0], el[1], hand[0], hand[1]], 5.6 * k, P.jacket);
    ctx.strokeStyle = '#3a2c2a'; ctx.lineWidth = 1 * k; ctx.beginPath(); ctx.moveTo(hand[0], hand[1]); ctx.lineTo(x + 35 * k, y - 51 * k - bob); ctx.stroke();
    ctx.fillStyle = P.skin; circle(ctx, hand[0], hand[1], 2.6 * k);
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
    if (lit) { ctx.fillStyle = 'rgba(255,214,140,0.35)'; ctx.fillRect(x - 40 * k, by - 49 * k, 44 * k, 12 * k); }
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1 * k; ctx.beginPath(); ctx.moveTo(x + 8 * k, by - 30 * k); ctx.lineTo(x + 8 * k, by - 6 * k); ctx.stroke();
    ctx.fillStyle = '#fff3c4'; circle(ctx, x + 44 * k, by - 18 * k, 3 * k);
    ctx.fillStyle = '#ff6b6b'; ellipse(ctx, x - 45 * k, by - 16 * k, 1.8 * k, 3 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; rrect(ctx, x - 42 * k, by - 28 * k, 70 * k, 2.5 * k, 1.2 * k); ctx.fill();
    wheel(ctx, x - 28 * k, y - 11 * k, 11 * k, st.wheel, k, '#22262f', '#c7ccd8');
    wheel(ctx, x + 28 * k, y - 11 * k, 11 * k, st.wheel, k, '#22262f', '#c7ccd8');
  }

  // Sıcak hava balonu: çizgili zarf, hasır sepet, brülör alevi
  function drawHotAir(ctx, x, y, k, st) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(st.t * 0.7) * 0.04);
    const env = new Path2D();
    env.moveTo(-12 * k, 6 * k);
    env.bezierCurveTo(-46 * k, -18 * k, -40 * k, -66 * k, 0, -66 * k);
    env.bezierCurveTo(40 * k, -66 * k, 46 * k, -18 * k, 12 * k, 6 * k);
    env.closePath();
    ctx.fillStyle = P.jacket; ctx.fill(env);
    ctx.save(); ctx.clip(env);
    const cols = ['#fbf4e6', '#f0b445', '#2f9e8f', '#fbf4e6'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = cols[i]; ctx.beginPath();
      const x0 = -40 * k + i * 22 * k;
      ctx.ellipse(x0 + 9 * k, -30 * k, 5 * k, 40 * k, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(14 * k, -70 * k, 40 * k, 80 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ellipse(ctx, -16 * k, -46 * k, 6 * k, 12 * k, -0.3);
    ctx.restore();
    ctx.fillStyle = '#c9553d'; rrect(ctx, -12 * k, 3 * k, 24 * k, 5 * k, 2 * k); ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,40,0.8)'; ctx.lineWidth = 1 * k;
    ctx.beginPath(); ctx.moveTo(-11 * k, 8 * k); ctx.lineTo(-9 * k, 20 * k); ctx.moveTo(11 * k, 8 * k); ctx.lineTo(9 * k, 20 * k);
    ctx.moveTo(-4 * k, 8 * k); ctx.lineTo(-4 * k, 20 * k); ctx.moveTo(4 * k, 8 * k); ctx.lineTo(4 * k, 20 * k); ctx.stroke();
    const fl = 5 + 2 * Math.sin(st.t * 23);
    ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, 10 * k, 14 * k, hex('#ffb060'), 0.7); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffd56b'; ctx.beginPath(); ctx.moveTo(-2.5 * k, 14 * k); ctx.quadraticCurveTo(0, (14 - fl * 2) * k, 2.5 * k, 14 * k); ctx.fill();
    head(ctx, -3 * k, 16 * k, k * 0.85);
    ctx.fillStyle = '#b98a55'; rrect(ctx, -10 * k, 19 * k, 20 * k, 13 * k, 2.5 * k); ctx.fill();
    ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 1 * k;
    ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(-10 * k, 19 * k + i * 3.2 * k); ctx.lineTo(10 * k, 19 * k + i * 3.2 * k); } ctx.stroke();
    ctx.restore();
  }

  // Süpersonik jet: iğne burunlu, delta kanatlı
  function drawJet(ctx, x, y, k, st) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(st.t * 0.9) * 0.02 - 0.03);
    const fl = 12 + 5 * Math.sin(st.t * 37);
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
    ctx.restore();
  }

  const FLYING = { balloon: true, plane: true, jet: true, rocket: true, sail: true };
  // Uçan araçların gökyüzündeki yüksekliği (sahne yüksekliğine oran). Kamera yerde kalır, yol hep görünür.
  const FLY_Y = { balloon: 0.4, plane: 0.42, jet: 0.38, rocket: 0.34, sail: 0.3 };
  function drawVehicle(ctx, id, x, y, k, st) {
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
      this.gift = null;
      this.stars = Array.from({ length: 170 }, () => ({ x: Math.random(), y: Math.random() * 0.75, r: Math.random() * 1.3 + 0.3, p: Math.random() * TAU }));
      this.nextBird = 8; this.nextBalloon = 2; this.signEvery = 2400;
      this.rain = 0; this.rainTarget = 0; this.rainbow = 0; this.rainbowTarget = 0;
      this.signText = () => null;
      this.resize();
      for (let i = 0; i < 7; i++) this.spawnCloud(Math.random() * this.W);
      this.fill(true);
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.W = Math.max(1, r.width); this.H = Math.max(1, r.height);
      this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.k = clamp(Math.min(this.H / 640, this.W / 560), 0.55, 1.35);
      this.travelerX = Math.round(this.W * (this.W < 640 ? 0.36 : 0.32));
    }

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
      if (instant) { this.anchor = this.anchorFrom = this.anchorTo = target; this.anchorT = 1; }
      else { this.anchorFrom = this.anchor; this.anchorTo = target; this.anchorT = 0; }
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
    setWeather(rain, rainbow) { this.rainTarget = rain; this.rainbowTarget = rainbow; }

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
      this.floats.push({ text, x: this.travelerX + jitter + 10 * this.k, y: this.riderY() - (opts.big ? 96 : 80) * this.k, life: 0, max: opts.big ? 1.8 : 1.15, color: opts.color || '#ffffff', big: !!opts.big });
      if (this.floats.length > 24) this.floats.shift();
    }
    spawnGift(duration) {
      this.gift = { x: this.W + 40, y: this.H * 0.3, t: 0, dur: duration || 14, caught: false };
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
      return fly ? lerp(this.groundY() - 40 * this.k, this.H * FLY_Y[this.vehicle], this.flyT()) : this.groundY();
    }

    /* --- Güncelleme --- */
    update(dt, speedMs, night) {
      this.t += dt;
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
      this.tod = ((this.anchor + 0.12 * Math.sin(this.drift * TAU / 600)) % 1 + 1) % 1;
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
      // kuzey ışıkları
      const auroraA = pal.aurora * night;
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
        glow(ctx, mx, my, 70 * k, hex('#dfe8ff'), 0.25 * night + 0.05);
        ctx.fillStyle = '#f1f0e6'; circle(ctx, mx, my, 15 * k);
        ctx.fillStyle = 'rgba(180,184,200,0.45)'; circle(ctx, mx - 5 * k, my - 3 * k, 3.4 * k); circle(ctx, mx + 4 * k, my + 5 * k, 2.4 * k);
      }

      // gökkuşağı (uzak dağların arkasında)
      const bowA = this.rainbow * (1 - night) * (1 - space);
      if (bowA > 0.01) this.drawRainbow(ctx, bowA, horizon);

      // güneş yelkeninde uzak halkalı gezegen
      if (this.vehicle === 'sail' && space > 0.05) this.drawRingedPlanet(ctx, space / 0.6);

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

      // orta tepeler
      const midBase = H * 0.712 + this.shift(0.5), midAmp = H * 0.075;
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

      // yolcu
      const st0 = { phase: this.phase, wheel: this.wheel, t: this.t, night };
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
      drawVehicle(ctx, this.vehicle, this.travelerX, ry, k, st0);
      ctx.restore();

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
        for (const it of this.layers.near.items) {
          if (it.type !== 'house' && it.type !== 'windmill') continue;
          const x = it.x - offNear;
          if (x < -100 || x > W + 100) continue;
          const wy = it.type === 'windmill' ? 34 : 14;
          glow(ctx, x, nearY(it.x) - wy * k * it.s, 34 * k * it.s, hex('#ffcf7a'), 0.28 * night);
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      this.drawParts(ctx, true);
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
      const a = (0.55 + 0.35 * c.depth) * (1 - space * 0.4);
      if (a < 0.02) return;
      const y = c.y * this.H + this.shift(0.3 * c.depth);
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

    drawRainbow(ctx, a, horizon) {
      const W = this.W, H = this.H, k = this.k;
      const cx = W * 0.64, cy = horizon + H * 0.18, R = Math.min(W * 0.55, H * 0.72);
      const band = 6 * k;
      const cols = ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#9775fa'];
      ctx.save();
      ctx.lineWidth = band + 0.6;
      cols.forEach((c, i) => {
        ctx.strokeStyle = css(hex(c), 0.32 * a);
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
        const size = Math.round((f.big ? 22 : 15) * Math.max(this.k, 0.8));
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
  function drawIcon(canvas, id, locked) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 72, h = canvas.clientHeight || 56;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (id === 'mystery') return drawGarageDoor(ctx, w, h, getComputedStyle(canvas).color);
    const sizes = { walk: [0.62, 0.5, 0.93], skates: [0.6, 0.5, 0.93], board: [0.6, 0.5, 0.93], bike: [0.56, 0.5, 0.93], horse: [0.5, 0.44, 0.96],
      moto: [0.5, 0.52, 0.93], car: [0.48, 0.5, 0.85], van: [0.46, 0.5, 0.88], train: [0.36, 0.5, 0.86], balloon: [0.46, 0.5, 0.62],
      plane: [0.52, 0.48, 0.5], jet: [0.5, 0.46, 0.55], rocket: [0.56, 0.42, 0.5], sail: [0.38, 0.62, 0.62] };
    const [k, xf, yf] = sizes[id];
    const st = { phase: 0.9, wheel: 0.3, t: 1.2, night: 0 };
    ctx.save();
    if (id === 'train') { ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); }
    drawVehicle(ctx, id, w * xf, h * yf, k * (h / 56), st);
    ctx.restore();
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

  IT.Scene = Scene;
  IT.drawIcon = drawIcon;
})();
