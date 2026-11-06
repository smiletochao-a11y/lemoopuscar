// Painted plates (colour + emissive pair, painted once) and one function per shot, vertical 1080×1920.
import { canvas, path, poly, cel, line, ribbon, flutter, airbrush, vgrad, rng, rgba, mix, TAU, W, H, LWK } from './cel.js';
import { head80 } from './head.js';
import { pal, CAST, ROBES } from './cast.js';
import { speedLines, flare, lamp } from './fx.js';
import { HIT } from './timeline.js';

const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const lerp = (a, b, u) => a + (b - a) * u;
const eo = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const st12 = t => Math.floor(t * 12) / 12, st8 = t => Math.floor(t * 8) / 8;

// ================= characters =================
let SCR = null; const SCRATCH = () => (SCR = SCR || canvas(W, H)[1]);
let EG = null; export const setE = e => { EG = e; };
export function bust(g, id, light, x, y, s, o = {}) {
  const c = CAST[id], P = pal(id, light);
  g.save(); g.translate(x, y); g.scale(s * (o.flip || 1), s); LWK.k = Math.min(1, 1.6 / s) * (o.lw || 1);
  const O = { view: 'q', ponytail: false, headset: false, male: c.male, lady: c.lady, hat: c.hat, beard: c.beard, wind: .3, light: o.light || [-1, -.8], blush: c.male ? 0 : undefined, ...o };
  head80(g, P, O);
  LWK.k = 1; g.restore();
  if (EG && g !== EG && !o.noStamp) { EG.save(); EG.translate(x, y); EG.scale(s * (o.flip || 1), s); EG.filter = 'brightness(0)'; head80(EG, P, O); EG.restore(); }
}
// full figure: long robe to the feet, hanging sleeves, the bust on top (body off). pose: down | raise | bow | run | kneel | walk
export function figure(g, id, light, x, y, s, o = {}) {
  const c = CAST[id], P = pal(id, light), R = P.robe, pose = o.pose || 'down', ph = o.ph || 0, f = o.flip || 1;
  g.save(); g.translate(x, y); g.scale(s * f, s); g.rotate(o.rot || 0); LWK.k = 1.5;
  const lean = pose === 'bow' ? .45 : pose === 'run' ? .16 : 0;
  g.save(); g.rotate(lean * .5);
  // legs (only when running or walking): two boots under the hem
  if (pose === 'run' || pose === 'walk') { const a = Math.sin(ph * TAU) * (pose === 'run' ? 1 : .5); for (const k of [-1, 1]) cel(g, [[-20 + k * a * 50, 860], [30 + k * a * 70, 860], [40 + k * a * 80, 900], [-20 + k * a * 60, 900]], { f: '#2a2630', l: '#08060c', lw: 3 }); }
  // robe
  const hem = pose === 'kneel' ? 600 : 870, flare = pose === 'run' ? 60 : 30;
  cel(g, [[-120, 150], [-150, 300], [-170 - flare, hem], [190 + flare * .4, hem], [160, 300], [120, 150], [40, 120], [-40, 120]], { f: R.f, s: R.s, so: [-36, -10], h: R.h, ho: [10, 6], l: R.l, lw: 3,
    clipFn: gg => { gg.fillStyle = R.s; gg.fillRect(-200, 380, 400, 22); if (P.robePat) { gg.fillStyle = R.h; for (let k = 0; k < 10; k++) { gg.beginPath(); gg.arc(-140 + (k % 5) * 70, 480 + Math.floor(k / 5) * 180, 14, 0, TAU); gg.fill(); } } } });
  line(g, [[-160, hem], [190, hem]], R.l, 3);
  // sleeves by pose
  const arm = (side, ang, len = 300) => {
    const sx = side * 120, sy = 170, ex = sx + Math.sin(ang) * len * side, ey = sy + Math.cos(ang) * len;
    cel(g, [[sx - 30, sy], [sx + 30, sy], [ex + 60 * side, ey], [ex - 10 * side, ey + 70], [ex - 50 * side, ey]], { f: R.f, s: R.s, so: [-14, -6], l: R.l, lw: 3 });
    const Hd = new Path2D(); Hd.ellipse(ex + 4 * side, ey - 6, 22, 26, 0, 0, TAU); cel(g, Hd, { f: P.skin.f, s: P.skin.s, so: [-4, -3], l: P.skin.l, lw: 2 });
  };
  if (pose === 'raise') { arm(-1, 2.6 + Math.sin(ph * TAU) * .1); arm(1, 2.7 - Math.sin(ph * TAU) * .1); }
  else if (pose === 'bow') { arm(-1, -.5, 220); arm(1, .7, 220); }
  else if (pose === 'run') { arm(-1, .9 * Math.sin(ph * TAU)); arm(1, -.9 * Math.sin(ph * TAU)); }
  else { arm(-1, .12); arm(1, .14); }
  g.save(); g.translate(0, -230); g.scale(1.25, 1.25);
  head80(g, P, { view: o.view || 'q', ponytail: false, headset: false, body: false, neck: true, male: c.male, lady: c.lady, hat: c.hat, beard: c.beard, wind: .4, ph, expr: o.expr || 'neutral', light: [-1, -.8] });
  g.restore();
  g.restore();
  LWK.k = 1; g.restore();
}

// ================= plates =================
const P2 = () => canvas(W, H);
function stars(g, n, seed, a = .7) { const R = rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = rgba('#ffffff', a * R()); g.fillRect(R() * W, R() * H * .5, 2, 2); } }
function hills(g, y, amp, col, seed, step = 60) { const R = rng(seed); g.fillStyle = col; g.beginPath(); g.moveTo(0, H); let x = 0; g.lineTo(0, y); while (x <= W + step) { g.lineTo(x, y - R() * amp - Math.sin(x * .004 + seed) * amp * .6); x += step; } g.lineTo(W, H); g.closePath(); g.fill(); }
function roof(g, x, y, w, col, dark) {   // a Tang roof, eaves curving up
  g.fillStyle = col; g.beginPath(); g.moveTo(x - w * .55, y + 6); g.quadraticCurveTo(x - w * .35, y - 10, x - w * .25, y - w * .22); g.lineTo(x + w * .25, y - w * .22); g.quadraticCurveTo(x + w * .35, y - 10, x + w * .55, y + 6); g.quadraticCurveTo(x, y - 6, x - w * .55, y + 6); g.fill();
  g.strokeStyle = dark; g.lineWidth = 3; for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(x + k * w * .04, y - w * .2); g.lineTo(x + k * w * .075, y); g.stroke(); }
}
function lanternGlow(g, e, x, y, r, col = '#ff6a3c') {
  cel(g, (() => { const p = new Path2D(); p.ellipse(x, y, r, r * 1.25, 0, 0, TAU); return p; })(), { f: '#ff5a3a', s: '#c8302a', so: [-r * .2, 0], h: '#ffd0a0', ho: [r * .15, -r * .1], l: '#5a1010', lw: 2 });
  g.fillStyle = '#3a1a10'; g.fillRect(x - r * .5, y - r * 1.3, r, r * .18); g.fillRect(x - r * .5, y + r * 1.12, r, r * .18);
  airbrush(e, x, y, r * 2.4, r * 2.6, col, .75); airbrush(e, x, y, r * .9, r * 1.1, '#ffd9a0', .9);
}
export function makePlates() {
  const A = {};
  // dusk at the inn on the Handan road (exterior)
  { const [c, g] = P2(), [ce, e] = P2(); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    vgrad(g, 0, 0, W, H, [[0, '#3a2a6a'], [.28, '#a0507a'], [.46, '#f08a5a'], [.56, '#ffc078'], [1, '#6a3a3a']]);
    airbrush(g, 760, 1000, 380, 160, '#fff0b0', .55); airbrush(e, 760, 1010, 260, 90, '#ffd27a', .7);
    hills(g, 1080, 90, '#7a4a7a', 3); hills(g, 1180, 70, '#5a3460', 5); hills(g, 1290, 40, '#3e2448', 7, 40);
    // the inn: wall, roof, glowing paper windows and lantern
    g.fillStyle = '#4a2c2a'; g.fillRect(120, 1180, 640, 360); roof(g, 440, 1180, 820, '#2e1c24', '#1a0e14');
    for (const x of [200, 340, 480, 620]) { g.fillStyle = '#ffcf7a'; g.fillRect(x, 1260, 90, 120); g.strokeStyle = '#3a2016'; g.lineWidth = 6; for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(x + k * 30, 1260); g.lineTo(x + k * 30, 1380); g.stroke(); } g.beginPath(); g.moveTo(x, 1320); g.lineTo(x + 90, 1320); g.stroke(); e.fillStyle = '#ffb04a'; e.fillRect(x, 1260, 90, 120); }
    lanternGlow(g, e, 820, 1250, 34);
    g.fillStyle = '#5a3e30'; g.beginPath(); g.moveTo(0, 1540); g.lineTo(W, 1500); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    vgrad(g, 0, 1540, W, 380, [[0, 'rgba(240,170,110,.35)'], [1, 'rgba(60,30,30,.0)']]);
    // a willow at the right edge
    g.strokeStyle = '#2a1a1e'; g.lineWidth = 26; g.beginPath(); g.moveTo(1010, 1560); g.quadraticCurveTo(980, 1200, 1040, 860); g.stroke();
    const R = rng(4); for (let i = 0; i < 60; i++) { const x0 = 880 + R() * 200, y0 = 820 + R() * 200; g.strokeStyle = rgba('#3a3a2a', .8); g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 - 20, y0 + 200, x0 - 10 + R() * 20, y0 + 300 + R() * 260); g.stroke(); }
    stars(g, 60, 9, .5); A.innExt = c; A.innExtE = ce; }
  // inside the inn (dusk light through the window, the stove's fire)
  { const [c, g] = P2(), [ce, e] = P2(); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    vgrad(g, 0, 0, W, H, [[0, '#4a2e30'], [.6, '#6a3e34'], [1, '#2a1a1c']]);
    for (let x = 0; x < W; x += 120) { g.fillStyle = rgba('#000000', .12); g.fillRect(x, 0, 6, H); }
    g.fillStyle = '#ffb46a'; g.fillRect(620, 300, 300, 380); g.strokeStyle = '#2a1612'; g.lineWidth = 10; g.strokeRect(620, 300, 300, 380); for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(620 + k * 75, 300); g.lineTo(620 + k * 75, 680); g.stroke(); } e.fillStyle = '#ff9a4a'; e.fillRect(620, 300, 300, 380);
    g.fillStyle = rgba('#ffb46a', .18); g.beginPath(); g.moveTo(620, 680); g.lineTo(920, 680); g.lineTo(700, 1600); g.lineTo(100, 1600); g.fill();
    g.fillStyle = '#3a2420'; g.fillRect(0, 1500, W, 420);
    A.innInt = c; A.innIntE = ce; }
  // the wedding: a wall of red lanterns as bokeh
  { const [c, g] = P2(), [ce, e] = P2(); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    vgrad(g, 0, 0, W, H, [[0, '#3a0e2a'], [.5, '#7a1a2a'], [1, '#2a0814']]);
    const R = rng(12); for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * H, r = 30 + R() * 90; airbrush(g, x, y, r, r, R() > .5 ? '#ff5a3a' : '#ffb04a', .35 + R() * .3, .4); airbrush(e, x, y, r, r, '#ff7a3a', .3 * R(), .5); }
    A.wedding = c; A.weddingE = ce; }
  // night palace (purple) for the slander
  { const [c, g] = P2(), [ce, e] = P2(); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    vgrad(g, 0, 0, W, H, [[0, '#120a2a'], [.5, '#2a1648'], [1, '#0a0614']]);
    for (let i = 0; i < 5; i++) { g.fillStyle = '#1e1234'; g.fillRect(80 + i * 220, 600, 60, 1320); }
    roof(g, 540, 600, 1400, '#160c26', '#0a0614');
    for (const [x, y] of [[200, 820], [880, 760]]) { airbrush(e, x, y, 120, 160, '#ff8a4a', .35); airbrush(g, x, y, 60, 80, '#ff8a4a', .3); }
    A.night = c; A.nightE = ce; }
  // exile: a vast mountain landscape, a road, a tiny figure is drawn by the shot
  { const [c, g] = P2(), [ce, e] = P2(); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    vgrad(g, 0, 0, W, H, [[0, '#2a3a6a'], [.4, '#7a8ab0'], [.55, '#c0b0b8'], [1, '#4a4a5a']]);
    hills(g, 700, 300, '#5a6a8a', 21, 80); hills(g, 980, 260, '#3e4c6a', 22, 70); hills(g, 1260, 200, '#2c3650', 23, 60); hills(g, 1480, 120, '#1e2438', 24, 50);
    g.strokeStyle = '#9a8a8a'; g.lineWidth = 10; g.beginPath(); g.moveTo(540, 1920); g.quadraticCurveTo(300, 1700, 560, 1560); g.quadraticCurveTo(760, 1460, 600, 1380); g.stroke();
    A.exile = c; A.exileE = ce; }
  // prison: dark stone, a barred window with a shaft of light
  { const [c, g] = P2(), [ce, e] = P2(); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    vgrad(g, 0, 0, W, H, [[0, '#1a1824'], [1, '#0a0a10']]);
    const R = rng(31); for (let y = 0; y < H; y += 90) for (let x = (y / 90 % 2) * 70; x < W; x += 140) { g.fillStyle = rgba('#2a2834', .5 + R() * .4); g.fillRect(x + 4, y + 4, 132, 82); }
    g.fillStyle = '#a8b8e0'; g.fillRect(380, 260, 320, 220); e.fillStyle = '#8aa0ff'; e.fillRect(380, 260, 320, 220);
    g.fillStyle = '#0c0a12'; for (let k = 0; k < 5; k++) g.fillRect(400 + k * 64, 260, 18, 220);
    g.fillStyle = rgba('#a8b8ff', .12); g.beginPath(); g.moveTo(380, 480); g.lineTo(700, 480); g.lineTo(980, 1800); g.lineTo(220, 1800); g.fill();
    A.prison = c; A.prisonE = ce; }
  // the peak: gold hall, a sea of lanterns
  { const [c, g] = P2(), [ce, e] = P2(); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    vgrad(g, 0, 0, W, H, [[0, '#2a0e2a'], [.4, '#7a2a3a'], [.7, '#d0703a'], [1, '#5a2a1a']]);
    for (let i = 0; i < 4; i++) { g.fillStyle = '#9a2a1a'; g.fillRect(60 + i * 300, 500, 70, 1420); g.fillStyle = '#e0a040'; g.fillRect(60 + i * 300, 500, 70, 20); }
    roof(g, 540, 520, 1500, '#e0a040', '#7a4a10');
    const R = rng(41); for (let i = 0; i < 46; i++) { const x = R() * W, y = 640 + R() * 900, r = 14 + R() * 26 * (y / 1500); lanternGlow(g, e, x, y, r, '#ff8a3a'); }
    A.peak = c; A.peakE = ce; }
  // dawn road
  { const [c, g] = P2(), [ce, e] = P2(); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    vgrad(g, 0, 0, W, H, [[0, '#6a7ac0'], [.35, '#e0a0b0'], [.5, '#ffd8a0'], [.62, '#ffe8c0'], [1, '#8a7a6a']]);
    airbrush(g, 540, 1180, 260, 120, '#fff6d0', .9); airbrush(e, 540, 1190, 220, 80, '#ffe0a0', .9);
    hills(g, 1200, 60, '#8a7aa0', 51); hills(g, 1290, 40, '#6a5a7a', 52, 40);
    g.fillStyle = '#b09a80'; g.beginPath(); g.moveTo(400, 1300); g.lineTo(680, 1300); g.lineTo(1080, 1920); g.lineTo(0, 1920); g.fill();
    A.dawn = c; A.dawnE = ce; }
  return A;
}
const bg = (S, k) => { S.g.drawImage(S.A[k], 0, 0); S.e.drawImage(S.A[k + 'E'], 0, 0); };
const bgPan = (S, k, dx, dy, s = 1) => { for (const [ctx, img] of [[S.g, S.A[k]], [S.e, S.A[k + 'E']]]) { ctx.save(); ctx.translate(W / 2 + dx, H / 2 + dy); ctx.scale(s, s); ctx.drawImage(img, -W / 2, -H / 2); ctx.restore(); } };
const stamp = (S, fn) => { S.e.save(); S.e.globalCompositeOperation = 'source-over'; S.e.filter = 'brightness(0)'; fn(S.e); S.e.restore(); };

// ================= inserts =================
function potInsert(S, t, o = {}) {
  const { g, e } = S;
  vgrad(g, 0, 0, W, H, [[0, '#2a1418'], [1, '#4a2420']]);
  airbrush(g, 540, 1500, 700, 300, '#ff7a2a', .5); airbrush(e, 540, 1600, 600, 220, '#ff6a1a', .6);    // fire below
  // pot body
  cel(g, [[120, 1100], [960, 1100], [920, 1420], [700, 1560], [380, 1560], [160, 1420]], { f: '#3a3036', s: '#1e1820', so: [-60, -20], h: '#7a6a70', ho: [20, 10], l: '#0c0a0e', lw: 5 });
  if (o.millet) { cel(g, [[150, 1100], [930, 1100], [880, 1060], [200, 1060]], { f: '#e8c050', s: '#b88a30', l: '#5a3a10', lw: 3 }); const R = rng(5); for (let i = 0; i < 220; i++) { g.fillStyle = R() > .5 ? '#f8dc78' : '#c89a40'; g.beginPath(); g.arc(170 + R() * 740, 1062 + R() * 40, 5, 0, TAU); g.fill(); } }
  // lid (jumps)
  const jump = o.lidUp ?? Math.max(0, Math.sin(t * 22)) * 14 * (o.boil ?? 1);
  g.save(); g.translate(540 + (o.lidX || 0), 1090 - jump - (o.lidY || 0)); g.rotate((o.lidR || 0) + Math.sin(t * 17) * .02 * (o.boil ?? 1));
  cel(g, [[-430, 10], [-300, -90], [0, -130], [300, -90], [430, 10]], { f: '#8a6a50', s: '#5a4030', so: [-30, -10], h: '#d0a880', ho: [12, 8], l: '#2a1a10', lw: 5 });
  cel(g, [[-50, -126], [50, -126], [40, -170], [-40, -170]], { f: '#5a4030', l: '#2a1a10', lw: 4 });
  g.restore();
  // steam, backlit gold (on twos)
  const ts = st12(t);
  for (let k = 0; k < 6; k++) { const sp = flutter(260 + k * 110, 1050 - jump, -Math.PI / 2 + (k - 2.5) * .08, 700 + k * 40, 14, 40, 1.2, ts * 3 + k); cel(g, ribbon(sp, u => 70 * Math.sin(Math.PI * Math.min(1, u * 1.2)) + 6), { f: rgba('#ffe6b0', .28) }); S.e.fillStyle = rgba('#ffcf7a', .16); S.e.fill(path(ribbon(sp, u => 70 * Math.sin(Math.PI * Math.min(1, u * 1.2)) + 6))); }
}
function pillowInsert(S, t, lt) {
  const { g, e } = S;
  vgrad(g, 0, 0, W, H, [[0, '#2a1a2a'], [1, '#4a2a2a']]);
  for (let i = 0; i < 18; i++) { const R = rng(i + 3); airbrush(g, R() * W, R() * H, 60 + R() * 80, 60 + R() * 80, '#ffb070', .18); }
  // the celadon pillow, open at both ends; its holes glow
  const y = 1020, hl = (lt * .35) % 1.4 - .2;
  cel(g, [[150, y + 120], [120, y - 60], [200, y - 170], [540, y - 130], [880, y - 170], [960, y - 60], [930, y + 120], [540, y + 160]], { f: '#7ac0a8', s: '#3e8a72', so: [-40, -16], h: '#c8f0e0', ho: [14, 10], l: '#14402e', lw: 5,
    clipFn: gg => { gg.fillStyle = rgba('#ffffff', .55); gg.beginPath(); gg.moveTo(100 + hl * 900, y - 200); gg.lineTo(180 + hl * 900, y - 200); gg.lineTo(120 + hl * 900, y + 200); gg.lineTo(40 + hl * 900, y + 200); gg.fill(); } });
  for (const x of [190, 890]) { const glow = ss(seg(t, HIT.glowHole - .6, HIT.glowHole + .4)); const p = new Path2D(); p.ellipse(x, y - 20, 50, 80, 0, 0, TAU); cel(g, p, { f: mix('#1a2a24', '#fff4d0', glow), l: '#14402e', lw: 5 }); airbrush(e, x, y - 20, 140, 200, '#ffe6a0', .9 * glow); }
  // the old Taoist's hand underneath, palm up, offering (wide jade sleeve, thin old fingers)
  const hx = 560, hy = y + 210;
  cel(g, [[hx - 330, 1920], [hx - 300, hy + 220], [hx - 160, hy + 90], [hx + 60, hy + 120], [hx + 120, hy + 260], [hx + 60, 1920]], { f: ROBES.dao.f, s: ROBES.dao.s, so: [-40, -10], h: ROBES.dao.h, ho: [10, 6], l: ROBES.dao.l, lw: 5 });
  cel(g, [[hx - 170, hy + 100], [hx - 120, hy + 40], [hx + 60, hy + 30], [hx + 80, hy + 110], [hx - 60, hy + 130]], { f: ROBES.hemp.f, s: ROBES.hemp.s, l: ROBES.hemp.l, lw: 3 });   // white inner cuff
  cel(g, [[hx - 120, hy + 40], [hx - 140, hy - 20], [hx - 40, hy - 70], [hx + 140, hy - 66], [hx + 170, hy - 30], [hx + 60, hy + 34]], { f: '#f0caa8', s: '#c89a80', so: [-10, -10], h: '#ffe8d8', ho: [4, 4], l: '#5a2e2e', lw: 4 });
  for (let k = 0; k < 4; k++) cel(g, [[hx + 40 + k * 26, hy - 64], [hx + 120 + k * 22, hy - 98 + k * 4], [hx + 136 + k * 22, hy - 86 + k * 4], [hx + 60 + k * 26, hy - 50]], { f: '#f0caa8', s: '#c89a80', l: '#5a2e2e', lw: 3 });
  cel(g, [[hx - 130, hy - 10], [hx - 190, hy - 70], [hx - 170, hy - 90], [hx - 100, hy - 46]], { f: '#f0caa8', s: '#c89a80', l: '#5a2e2e', lw: 3 });
}
function boardInsert(S, t, lt) {
  const { g, e } = S;
  vgrad(g, 0, 0, W, H, [[0, '#d8b070'], [1, '#8a5a30']]);
  cel(g, [[60, 200], [1020, 200], [1020, 1500], [60, 1500]], { f: '#f0d890', s: '#c8a860', l: '#5a3a10', lw: 6 });
  g.fillStyle = '#c8302a'; g.fillRect(60, 200, 960, 110); g.font = '900 80px "Noto Sans SC"'; g.textAlign = 'center'; g.fillStyle = '#fff0c0'; g.fillText('进士榜', 540, 285);
  const names = ['王守仁', '李延年', '张承宗', '卢生', '赵文远', '刘季方', '孙敬德', '周子安'];
  g.font = '700 64px "Noto Sans SC"';
  names.forEach((n, i) => { const x = 950 - i * 118; [...n].forEach((ch, k) => { g.fillStyle = n === '卢生' ? '#c8302a' : '#2a1a10'; g.fillText(ch, x, 420 + k * 78); }); });
  // his name lights up (backlit), the camera pushes on it
  const k = ss(seg(t, HIT.board, HIT.board + .3));
  if (k > 0) { airbrush(e, 950 - 3 * 118, 470, 120, 200, '#ffd27a', .9 * k); }
}

// ================= shots =================
export const SH = {};
SH.pot = S => {
  const { t } = S;
  // hook flashes: 4 drawings of 6 frames each, framed by impact frames
  const fi = HIT.flashes.findIndex(f => t >= f && t < f + .42);
  if (fi >= 0) {
    const k = t - HIT.flashes[fi];
    if (k < .07) return impact(S, ['luZi', 'luPrison', 'luPrison', 'luOld'][fi]);
    if (fi === 0) { bg(S, 'peak'); bust(S.g, 'luZi', 'day', 540, 820, 3.2, { expr: 'smile', E: { brow: [-2, 2, 3] } }); }
    else if (fi === 1) { bg(S, 'prison'); bust(S.g, 'luPrison', 'prison', 540, 860, 3.2, { expr: 'panting', E: { brow: [-8, 6, 1] } }); S.g.fillStyle = '#0c0a12'; for (let x = 0; x < W; x += 180) S.g.fillRect(x, 0, 40, H); }
    else if (fi === 2) { knifeShot(S, .5); }
    else { bg(S, 'peak'); bust(S.g, 'luOld', 'dusk', 540, 820, 3.2, { expr: 'closed' }); }
    return { flick: .05 };
  }
  potInsert(S, t, { boil: 1 });
  if (t > HIT.title) title(S, t - HIT.title);
  return {};
};
function impact(S, id) {      // 2 frames: monochrome silhouette over radial lines
  const { g, e } = S; g.fillStyle = '#fff4e0'; g.fillRect(0, 0, W, H);
  speedLines(g, 0, { type: 'radial', cx: 540, cy: 900, n: 120, col: '#2a0a1a', a: .9, r0: 240 });
  g.save(); g.filter = 'brightness(0)'; bust(g, id, 'day', 540, 900, 3, {}); g.restore();
  return { flash: 0 };
}
function title(S, lt) {
  const { g, e } = S;
  const on = Math.floor(lt * 12) / 12, a = Math.min(1, on * 3) * (1 - ss(seg(lt, HIT.titleOff - HIT.title - .3, HIT.titleOff - HIT.title)));
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.translate(540, 560); g.transform(1, 0, -.18, 1, 0, 0);
  g.font = '900 150px "Noto Sans SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = '#ff4fa8'; g.lineWidth = 26; g.strokeText('一锅饭', 0, -90); g.strokeText('的一生', 0, 90);
  g.strokeStyle = '#1a0a2a'; g.lineWidth = 14; g.strokeText('一锅饭', 0, -90); g.strokeText('的一生', 0, 90);
  const gr = g.createLinearGradient(0, -170, 0, 170); gr.addColorStop(0, '#7fd8ff'); gr.addColorStop(.42, '#ffffff'); gr.addColorStop(.47, '#7a4ab0'); gr.addColorStop(.7, '#ff7ab0'); gr.addColorStop(1, '#ffd26a');
  g.fillStyle = gr; g.fillText('一锅饭', 0, -90); g.fillText('的一生', 0, 90);
  g.font = '700 46px "Noto Sans SC"'; g.fillStyle = '#ffd26a'; g.fillText('— 黄 粱 一 梦 —', 0, 230);
  g.restore();
  e.save(); e.globalAlpha = a * .8; e.translate(540, 560); e.transform(1, 0, -.18, 1, 0, 0); e.font = '900 150px "Noto Sans SC"'; e.textAlign = 'center'; e.textBaseline = 'middle'; e.strokeStyle = '#ff4fa8'; e.lineWidth = 18; e.strokeText('一锅饭', 0, -90); e.strokeText('的一生', 0, 90); e.restore();
  const sweep = seg(lt, .4, 1.1); if (sweep > 0 && sweep < 1) flare(e, 200 + sweep * 700, 470, 1.2, '#ffffff');
}
SH.inn = S => {
  const { t, lt } = S;
  if (lt < 2.2) {      // crane down over the dusk inn, tiny figures at the door
    const u = ss(lt / 2.2); bgPan(S, 'innExt', 0, lerp(260, -60, u), 1.12);
    figure(S.g, 'lv', 'dusk', 300, 1500 + lerp(260, -60, u) * 1.12 * 0, .26, { pose: 'down' });
    figure(S.g, 'lu', 'dusk', 640, 1520, .26, { pose: 'down', flip: -1, view: 'q' });
    return {};
  }
  // bust: Lu Sheng sighs (8 fps lid drop, brows up at the inner ends)
  bgPan(S, 'innInt', 0, 0, 1.05);
  S.g.save(); S.g.filter = 'blur(6px)'; figure(S.g, 'lv', 'dusk', 160, 1150, .55, { pose: 'down' }); S.g.restore();
  const sigh = st8(t) > HIT.sigh ? 1 : 0;
  bust(S.g, 'lu', 'dusk', 600, 860, 2.9, { flip: -1, expr: 'neutral', E: { open: sigh ? .45 : .8, lid: .4, brow: [-8, 4, 1], mouth: sigh ? 'talk' : 'closed', look: [0, .3] }, light: [1, -.6] });
  return {};
};
SH.pillow = S => {
  const { t, lt } = S;
  if (lt < 2.6) { pillowInsert(S, t, lt); return {}; }
  bgPan(S, 'innInt', -60, 0, 1.08);
  bust(S.g, 'lv', 'dusk', 520, 880, 2.8, { expr: 'smile', E: { open: .5, lid: .35, brow: [-2, 0, 2] }, light: [1, -.6] });
  return {};
};
SH.dive = S => {
  const { t } = S;
  const u = seg(t, 15.6, HIT.white), z = Math.pow(1 + u * 4, 2.3);
  S.g.save(); S.g.translate(W / 2, H / 2); S.g.scale(z, z); S.g.translate(-890, -1000);
  const T = { ...S, e: SCRATCH() };
  pillowInsert(T, HIT.glowHole + 1, 0);
  S.g.restore();
  // the hole's light grows to fill the frame (bounded glow)
  const r = Math.min(700, 90 * z); airbrush(S.e, 540, 960, r, r * 1.4, '#ffe6a0', .55 * (1 - .5 * u));
  speedLines(S.g, Math.floor(t * 12), { type: 'radial', cx: 540, cy: 960, n: 80, col: '#fff4d0', a: .55 * seg(t, 16.4, HIT.white), r0: 200 });
  const wf = ss(seg(t, HIT.white - .5, HIT.white));
  S.g.fillStyle = rgba('#fff8e8', wf); S.g.fillRect(0, 0, W, H);
  return {};
};
SH.wedding = S => {
  const { t, lt } = S; bg(S, 'wedding');
  if (lt < 1.2) {       // the bride's eyes under the veil, close
    bust(S.g, 'cui', 'dusk', 540, 1040, 4.2, { expr: 'smile', E: { open: .6, lid: .2, look: [-.4, .2] }, blush: .5, light: [1, -.4] });
    S.g.fillStyle = rgba('#d82a3a', .35); S.g.fillRect(0, 0, W, 520);
  } else {              // two-shot: bride and groom, lanterns
    figure(S.g, 'cui', 'dusk', 690, 1200, .55, { flip: -1, view: 'q', expr: 'smile' });
    figure(S.g, 'lu', 'dusk', 380, 1200, .58, { view: 'q', expr: 'smileopen' });
  }
  return {};
};
SH.board = S => {
  const { t, lt } = S;
  if (lt < 1.1) { const z = 1 + ss(seg(t, HIT.board, HIT.board + .5)) * .5; S.g.save(); S.g.translate(W / 2, H / 2); S.g.scale(z, z); S.g.translate(-W / 2 + (950 - 3 * 118 - 540) * -.6 * (z - 1), -H / 2); boardInsert(S, t, lt); S.g.restore(); return {}; }
  bgPan(S, 'wedding', 0, 0, 1.2);
  speedLines(S.g, Math.floor(t * 12), { type: 'radial', cx: 540, cy: 860, n: 90, col: '#fff0c0', a: .45, r0: 300 });
  bust(S.g, 'lu', 'day', 540, 880, 3.3, { expr: 'surprised', E: { iris: .62, open: 1.15 }, light: [-1, -.8] });
  flare(S.e, 480, 958, .28, '#ffffff');
  return {};
};
SH.robes = S => {
  const { t, lt } = S;
  const id = t < HIT.robeQ ? 'lu' : t < HIT.robeL ? 'luQing' : t < HIT.robeF ? 'luLv' : 'luFei';
  bgPan(S, 'peak', 0, 200, 1.1);
  const bump = [HIT.robeQ, HIT.robeL, HIT.robeF].some(h => t >= h && t < h + .08);
  bust(S.g, id, 'day', 540, 860 + (bump ? -14 : 0), 2.7, { expr: 'determined', E: { look: [.2, -.1] }, light: [-1, -.8] });
  // light band sweeps across the held cel
  const sw = ((t - 23.4) * 1.6) % 1;
  S.g.save(); S.g.globalCompositeOperation = 'source-atop'; S.g.fillStyle = rgba('#fff4d0', .3); S.g.beginPath(); S.g.moveTo(-300 + sw * 1700, 0); S.g.lineTo(-100 + sw * 1700, 0); S.g.lineTo(-500 + sw * 1700, H); S.g.lineTo(-700 + sw * 1700, H); S.g.fill(); S.g.restore();
  if (bump) { S.g.fillStyle = rgba('#ffffff', .45); S.g.fillRect(0, 0, W, H); }
  return {};
};
SH.rival = S => {
  const { t } = S; bg(S, 'night');
  bust(S.g, 'luFei', 'night', 330, 1180, 2.2, { expr: 'neutral', E: { look: [.6, 0] }, light: [1, -.4] });
  bust(S.g, 'rival', 'night', 800, 720, 2.6, { flip: -1, expr: 'smile', E: { open: .3, lid: .7, iris: .7, brow: [10, -10, -1], mouth: st8(t) % .25 < .125 ? 'talk' : 'smile', look: [.8, .1] }, light: [-1, .3], rim: { c: '#ff4fa8', d: [6, 0] } });
  S.g.save(); S.g.globalCompositeOperation = 'source-atop'; S.g.fillStyle = 'rgba(10,4,24,.55)'; S.g.fillRect(800, 0, 280, 1300); S.g.restore();
  return { tint: [.9, .86, 1.06] };
};
SH.exile = S => {
  const { t, lt } = S;
  if (t < HIT.impact1 + .2 && t >= S.t0) { if (lt < .07) return impact(S, 'luFei'); }
  bgPan(S, 'exile', 0, lerp(0, -40, lt / 2.3), 1.04);
  airbrush(S.g, 600, 1400, 120, 40, '#ffd8b0', .5);
  figure(S.g, 'luFei', 'dusk', lerp(560, 600, lt / 2.3), 1430 - lt * 20, .18, { pose: 'walk', ph: t * 1.4, view: 'side', flip: 1 });
  return {};
};
SH.run = S => {
  const { t, lt } = S;
  // side tracking with parallax: far hills, mid trees, near grass; the palace gate appears at the end
  const v = lt * 900;
  vgrad(S.g, 0, 0, W, H, [[0, '#4a6ac0'], [.5, '#ffd0a0'], [1, '#8a6a50']]);
  for (const [sp, y, col, amp, sd] of [[.15, 1100, '#8a7ab0', 160, 61], [.4, 1260, '#5a5a80', 120, 62]]) { S.g.save(); S.g.translate(-(v * sp) % 600, 0); hills(S.g, y, amp, col, sd, 70); S.g.restore(); }
  const gate = ss(seg(lt, 2.4, 3.8));
  if (gate > 0) { S.g.fillStyle = '#9a2a1a'; S.g.fillRect(1180 - gate * 520, 900, 80, 700); S.g.fillRect(1180 - gate * 520 + 360, 900, 80, 700); roof(S.g, 1180 - gate * 520 + 220, 900, 700, '#e0a040', '#7a4a10'); }
  S.g.fillStyle = '#6a5a3a'; S.g.fillRect(0, 1600, W, 320);
  const R = rng(7); for (let i = 0; i < 26; i++) { const x = ((R() * 3000 - v * 1.4) % 1600 + 1600) % 1600 - 200; S.g.strokeStyle = '#3a4a2a'; S.g.lineWidth = 8; S.g.beginPath(); S.g.moveTo(x, 1920); S.g.lineTo(x + 30, 1640 + R() * 80); S.g.stroke(); }
  speedLines(S.g, Math.floor(t * 12), { type: 'horizontal', y0: 0, y1: H, n: 40, col: '#ffffff', a: .35 });
  figure(S.g, 'luFei', 'day', 460, 1180, .42, { pose: 'run', ph: st12(t) * 2.2, view: 'side', expr: 'determined' });
  return {};
};
SH.prison = S => {
  const { t, lt } = S; bg(S, 'prison');
  figure(S.g, 'luPrison', 'prison', 540, 1240, .5, { pose: 'kneel', view: 'q', expr: 'neutral', E: {} });
  return { tint: [.88, .9, 1.08] };
};
SH.eyes = S => {
  const { t } = S; bg(S, 'prison');
  bust(S.g, 'luPrison', 'prison', 600, 1100, 7.2, { expr: 'determined', E: { open: .8, lid: .45, brow: [8, -4, 0], look: [.2, 0] }, light: [1, -.8], lw: .6 });
  return { tint: [.88, .9, 1.08] };
};
function knifeShot(S, k) {
  const { g, e } = S; bg(S, 'prison');
  g.save(); g.translate(540, 1000); g.rotate(-.5);
  cel(g, [[-60, 300], [60, 300], [50, 520], [-50, 520]], { f: '#5a3a2a', s: '#3a2418', l: '#1a0e08', lw: 4 });
  cel(g, [[-120, 290], [120, 290], [120, 320], [-120, 320]], { f: '#c8a050', s: '#8a6a30', l: '#3a2a10', lw: 4 });
  cel(g, [[-40, 290], [40, 290], [30, -500], [0, -560], [-30, -500]], { f: '#dfe7f3', s: '#8a98b8', so: [-14, 0], h: '#ffffff', ho: [6, 0], l: '#2b3350', lw: 4 });
  g.restore();
  flare(e, 540 + Math.sin(-.5) * -520, 1000 - Math.cos(-.5) * 520, 1.6 * (k || 1), '#ffffff');
}
SH.knife = S => { if (S.lt < .07 || (S.t >= HIT.impact2 && S.t < HIT.impact2 + .07)) return impact(S, 'luPrison'); knifeShot(S, seg(S.t, HIT.draw, HIT.draw + .3) + .3); return {}; };
SH.grip = S => {
  const { g, t, lt } = S; bg(S, 'prison');
  const shake = Math.sin(t * 60) * 6 * (1 - seg(lt, 0, 1.2));
  const SK = { f: '#f0caa8', s: '#c89a80', so: [-10, -8], h: '#ffe8d8', ho: [3, 3], l: '#5a2e2e', lw: 4 };
  g.save(); g.translate(shake, 0);
  // his hemp sleeve and forearm from the lower left; the fist around the hilt; the blade rising out of frame
  cel(g, [[-120, 1920], [-160, 1560], [300, 1250], [420, 1330], [80, 1920]], { f: ROBES.hemp.f, s: ROBES.hemp.s, so: [-24, -10], h: ROBES.hemp.h, ho: [6, 4], l: ROBES.hemp.l, lw: 5 });
  cel(g, [[300, 1250], [380, 1190], [470, 1230], [430, 1330]], SK);
  cel(g, [[500, 1060], [560, 1060], [560, 1330], [500, 1330]], { f: '#5a3a2a', s: '#3a2418', l: '#1a0e08', lw: 4 });           // hilt
  cel(g, [[460, 1040], [600, 1040], [600, 1066], [460, 1066]], { f: '#c8a050', s: '#8a6a30', l: '#3a2a10', lw: 4 });           // guard
  cel(g, [[510, 1040], [550, 1040], [544, 200], [530, 150], [516, 200]], { f: '#dfe7f3', s: '#8a98b8', so: [-8, 0], h: '#ffffff', ho: [3, 0], l: '#2b3350', lw: 4 });
  for (let k = 0; k < 4; k++) cel(g, [[440, 1120 + k * 52], [600, 1110 + k * 52], [612, 1150 + k * 52], [600, 1166 + k * 52], [450, 1170 + k * 52]], SK);   // his four fingers wrapped round the hilt
  cel(g, [[420, 1150], [480, 1080], [520, 1096], [470, 1170]], SK);                                                             // thumb
  // her hand closes round his wrist from the right: a red sleeve with a gold cuff, slim fingers
  const k = eo(seg(t, HIT.grab, HIT.grab + .25));
  g.save(); g.translate(lerp(520, 0, k), lerp(160, 0, k));
  cel(g, [[1200, 1180], [760, 1300], [700, 1440], [1200, 1560]], { f: ROBES.bride.f, s: ROBES.bride.s, so: [-24, -10], h: ROBES.bride.h, ho: [6, 4], l: ROBES.bride.l, lw: 5 });
  cel(g, [[760, 1300], [730, 1290], [690, 1440], [720, 1450]], { f: '#e0b050', s: '#a07830', l: '#4a3010', lw: 3 });
  cel(g, [[720, 1320], [560, 1290], [420, 1300], [400, 1360], [560, 1420], [700, 1430]], { f: '#ffdcc8', s: '#e0a898', so: [-8, -6], h: '#fff2ea', ho: [3, 3], l: '#5a2e2e', lw: 4 });
  for (let i = 0; i < 4; i++) cel(g, [[440 - i * 6, 1300 + i * 22], [330 - i * 4, 1290 + i * 26], [320 - i * 4, 1312 + i * 26], [430 - i * 6, 1326 + i * 22]], { f: '#ffdcc8', s: '#e0a898', l: '#5a2e2e', lw: 3 });
  g.restore(); g.restore();
  return { tint: [.92, .9, 1.04] };
};
SH.tears = S => {
  const { t, lt } = S; bg(S, 'prison');
  bust(S.g, 'luPrison', 'prison', 560, 900, 3.4, { expr: 'neutral', E: { open: .5, lid: .3, brow: [-10, 6, 1], mouth: 'talk', tear: Math.min(1, lt / 1.2) }, light: [1, -.6] });
  return { tint: [.9, .9, 1.06] };
};
SH.peak = S => {      // a painted harmony still, slow pan; the crown
  const { t, lt } = S; const u = lt / 3.2;
  bgPan(S, 'peak', 0, lerp(80, -40, u), 1.12);
  bust(S.g, 'luZi', 'day', 540, lerp(940, 900, u), 3.0, { expr: 'smile', E: { look: [.3, -.2], brow: [-2, 1, 3] }, light: [-1, -.9], rim: { c: '#ffd27a', d: [5, 0] } });
  if (lt < .12) { S.g.fillStyle = rgba('#ffffff', .6 * (1 - lt / .12)); S.g.fillRect(0, 0, W, H); }
  return { bloom: .9, halo: .24 };
};
SH.family = S => {
  const { t, lt } = S; bg(S, 'peak');
  figure(S.g, 'luZi', 'day', 540, 820, .42, { view: 'q', expr: 'smile' });
  figure(S.g, 'cui', 'day', 760, 850, .38, { view: 'q', flip: -1, expr: 'smile' });
  for (let i = 0; i < 5; i++) { const k = eo(seg(lt, .15 + i * .18, .35 + i * .18)); if (k <= 0) continue; figure(S.g, i % 2 ? 'luLv' : 'luFei', 'day', 140 + i * 200, 1260 - (1 - k) * 60, .3 * (.6 + .4 * k), { view: 'q', flip: i < 2 ? 1 : -1, expr: 'smileopen' }); }
  for (let i = 0; i < 8; i++) { const k = eo(seg(lt, 1.1 + i * .08, 1.25 + i * .08)); if (k <= 0) continue; figure(S.g, 'luQing', 'day', 80 + i * 132, 1560 - (1 - k) * 40, .19, { view: 'q', flip: i % 2 ? -1 : 1, expr: 'smileopen', pose: 'raise', ph: st12(t) * 2 + i }); }
  return { bloom: .7 };
};
SH.old = S => {       // the same composition repainted: white hair, lying down
  const { t, lt } = S; bgPan(S, 'peak', 0, -40, 1.12);
  S.g.fillStyle = rgba('#2a1030', .35 * seg(lt, 0, 2)); S.g.fillRect(0, 0, W, H);
  bust(S.g, 'luOld', 'dusk', 540, 900, 3.0, { expr: 'smile', E: { open: .45, lid: .4, look: [.2, .2] }, light: [-1, -.9] });
  return { bloom: .9 };
};
SH.end = S => {       // the old eyes close (3 drawings), the picture freezes, blue screen, static
  const { t, lt } = S;
  if (t < HIT.blue) {
    bgPan(S, 'peak', 0, -40, 1.3); S.g.fillStyle = rgba('#1a0a20', .5); S.g.fillRect(0, 0, W, H);
    const k = seg(st8(t), HIT.close, HIT.close + .6);
    bust(S.g, 'luOld', 'dusk', 560, 1060, 5.2, { expr: 'neutral', E: { open: lerp(.5, 0, k), lid: .4, brow: [-4, 2, 1] }, light: [-1, -.9], lw: .7 });
    const fr = t > HIT.freeze; return fr ? { track: .35, fade: .2 } : {};
  }
  if (t < HIT.static) { S.g.fillStyle = '#1a2ad8'; S.g.fillRect(0, 0, W, H); osd(S.g, '■ STOP', '00:00:00'); return { noiseA: .03 }; }
  S.g.fillStyle = '#5a5a5a'; S.g.fillRect(0, 0, W, H); return { noiseA: .55, track: .8 };
};
function osd(g, a, b) { g.save(); g.font = '700 64px "Noto Sans SC"'; g.fillStyle = '#ffffff'; g.shadowColor = '#000'; g.shadowBlur = 0; g.shadowOffsetX = 4; g.shadowOffsetY = 4; g.fillText(a, 80, 200); if (b) g.fillText(b, 80, 1780); g.restore(); }
export const REWIND = ['old', 'family', 'peak', 'tears', 'grip', 'eyes', 'prison', 'run', 'exile', 'rival', 'robes', 'board', 'wedding', 'dive'];
SH.end.osd = osd;
SH.lid = S => {
  const { t, lt } = S;
  const up = eo(seg(t, HIT.lid, HIT.lid + .4));
  potInsert(S, t, { boil: .3, lidUp: up * 360, lidX: up * 200, lidR: up * .35, millet: up > .05 });
  return {};
};
SH.wake = S => {
  const { t } = S; bgPan(S, 'innInt', 0, 0, 1.05);
  const k = seg(st8(t), HIT.wakeOpen, HIT.wakeOpen + .4);
  bust(S.g, 'lu', 'dusk', 560, 980, 4.6, { flip: -1, expr: 'surprised', E: { open: lerp(0, 1.1, k), iris: .7 }, light: [1, -.6], lw: .8 });
  return {};
};
SH.react = S => {      // he stares, then a wry smile: he understands
  const { t } = S; bgPan(S, 'innInt', 0, 0, 1.05);
  const sm = t > HIT.react;
  bust(S.g, 'lu', 'dusk', 560, 900, 3.6, { flip: -1, expr: sm ? 'smile' : 'surprised', E: sm ? { open: .5, lid: .3, brow: [-6, 3, 1], look: [0, .3] } : { open: 1, iris: .66 }, light: [1, -.6], lw: .9 });
  return {};
};
SH.lvsmile = S => { bgPan(S, 'innInt', -60, 0, 1.08); bust(S.g, 'lv', 'dusk', 520, 880, 2.8, { expr: 'smileopen', E: { open: .4, lid: .4 }, light: [1, -.6] }); return {}; };
SH.dawn = S => {
  const { t, lt } = S; bg(S, 'dawn');
  const walk = seg(t, HIT.walk, 73);
  const bow = t > HIT.bow && t < HIT.walk;
  figure(S.g, 'lv', 'dawn', 220, 1460, .3, { view: 'q' });
  figure(S.g, 'lu', 'dawn', lerp(560, 600, walk), lerp(1520, 1320, walk), lerp(.34, .16, walk), { pose: bow ? 'bow' : walk > 0 ? 'walk' : 'down', ph: t * 1.6, view: walk > 0 ? 'side' : 'q', flip: walk > 0 ? -1 : -1 });
  if (t > HIT.freezeEnd) { const k = Math.min(1, (t - HIT.freezeEnd) * 4); S.g.fillStyle = rgba('#fff4e0', .18 * k); S.g.fillRect(0, 0, W, H); S.freeze = true; }
  return {};
};
