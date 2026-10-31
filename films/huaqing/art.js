// Drawing kit for this film, on top of the ink engine (ink.js): steam, Tang halls, lanterns, the palace lady, dancer, musicians,
// horse and rider, petal, the countdown seal, calligraphy written by ink bloom, the 反 character traced in stroke order, rain.
// All coordinates are in the caller's world units (set with L.xf). Red only for the petal and the seals.
import { mk, draw, mass, blot, TONE } from './ink.js';
import { clamp, lerp, mulberry, vnoise } from '/core/lib.js';

export const VERM = [176, 46, 34];
const curve = (a, c, b, n = 6) => { const o = []; for (let i = 0; i < n; i++) { const t = i / (n - 1), u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], a[2] == null ? 1 : lerp(a[2], b[2] ?? 1, t)]); } return o; };
const LOAD = (w, tone, dark, o = {}) => ({ w, tone, darkDir: dark, side: o.side ?? .85, brWet: true, body: o.body ?? .2, dry: o.dry ?? .4, wet: .9, prof: o.prof || 'robe', rough: .12, seed: o.seed });

// ---------- steam: rising S-shaped wisps of clear ink. keep ∈ [0,1] erases them in reverse drawing order ----------
export function steam(L, o) {
  const { x, y, w, h, t = 0, n = 14, seed = 1, am = 1, keep = 1, tone = .13 } = o;
  const R = mulberry(seed), N = Math.ceil(n * clamp(keep));
  for (let i = 0; i < n; i++) {
    const ph = R(), x0 = x + (R() - .5) * w, sp = .55 + R() * .5, amp = 40 + R() * 90, len = h * (.35 + R() * .45), wid = 34 + R() * 60;
    if (i >= N) continue;
    const life = (t * .09 * sp + ph) % 1, rise = life * h * .5, fade = Math.sin(Math.PI * life);
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const u = k / 6, yy = y - rise - u * len;
      pts.push([x0 + Math.sin(u * 3.2 + ph * 9 + t * .5 * sp) * amp * (.3 + u), yy, .5 + .7 * Math.sin(Math.PI * u)]);
    }
    const lastFade = i === N - 1 && keep < 1 ? (keep * n - (N - 1)) : 1;
    draw(L, mk(pts, { w: wid, tone, wet: 1, dry: .1, prof: 'lens', rough: .35, seed: seed * 100 + i, body: 1, bristle: 0 }), 1, am * fade * clamp(lastFade));
  }
}

// ---------- a Tang hall seen from the front: hip roof with eaves curving up, brackets, columns, platform ----------
export function hall(L, x, y, w, s = 1, o = {}) {
  const sd = o.seed || 3, am = o.am ?? 1, rh = w * .2, hw = w / 2;
  // roof body: a pale mass, darker at the eave
  mass(L.wet, [[x - hw * .62, y - rh], [x + hw * .62, y - rh], [x + hw * 1.04, y - rh * .12], [x + hw * 1.12, y - rh * .3], [x + hw * .98, y + rh * .1], [x - hw * .98, y + rh * .1], [x - hw * 1.12, y - rh * .3], [x - hw * 1.04, y - rh * .12]], .3 * am, 3 * s, sd, [x, y - rh, x, y + rh * .1, .5, 1.1]);
  // ridge (burnt ink) with two upturned ends
  draw(L, mk([[x - hw * .7, y - rh * 1.08, .8], [x, y - rh * 1.02, 1], [x + hw * .7, y - rh * 1.08, .8]], { w: 7 * s, tone: TONE.jiao, dry: .3, wet: .3, prof: 'even', seed: sd * 10 }), 1, am);
  for (const d of [-1, 1]) draw(L, mk([[x + d * hw * .68, y - rh * 1.05], [x + d * hw * .74, y - rh * 1.22]], { w: 5 * s, tone: TONE.jiao, dry: .3, prof: 'nail', seed: sd * 10 + d + 3 }), 1, am);
  // eave: one loaded stroke each side, the dark side down, flicking up at the corner
  for (const d of [-1, 1]) draw(L, mk([[x, y + rh * .08, .9], [x + d * hw * .6, y + rh * .1, 1], [x + d * hw * .98, y - rh * .02, .9], [x + d * hw * 1.14, y - rh * .34, .4]], LOAD(10 * s, .8, [0, 1], { dry: .35, prof: 'brush', seed: sd * 20 + d })), 1, am);
  // roof tiles: a few dry vertical strokes
  const R = mulberry(sd);
  for (let i = 0; i < 9; i++) { const u = (i + .5) / 9 - .5, xx = x + u * hw * 1.6; draw(L, mk([[xx * .97 + x * .03, y - rh * .9], [xx, y + rh * .02]], { w: 2.5 * s, tone: .45, dry: .7, prof: 'tip', seed: sd * 30 + i }), 1, am * (.5 + R() * .5)); }
  // bracket band + columns
  draw(L, mk([[x - hw * .9, y + rh * .32], [x + hw * .9, y + rh * .32]], { w: 9 * s, tone: .35, wet: .8, dry: .3, prof: 'even', seed: sd * 40 }), 1, am);
  for (let i = 0; i < 9; i++) blot(L.wet, x - hw * .85 + i * hw * .2125, y + rh * .3, 4 * s, .5 * am, 0, .6, sd + i);
  const ch = (o.colH ?? .9) * rh * 2;
  for (let i = 0; i < 6; i++) { const xx = x - hw * .8 + i * hw * .32; draw(L, mk([[xx, y + rh * .4], [xx, y + rh * .4 + ch]], { w: 4 * s, tone: TONE.zhong, dry: .5, prof: 'even', seed: sd * 50 + i }), 1, am); }
  // a lit gap between columns (doors) as paler wash; platform
  mass(L.wet, [[x - hw * .8, y + rh * .4], [x + hw * .8, y + rh * .4], [x + hw * .8, y + rh * .4 + ch], [x - hw * .8, y + rh * .4 + ch]], .1 * am, 2 * s, sd + 7);
  draw(L, mk([[x - hw * 1.02, y + rh * .4 + ch, .8], [x + hw * 1.02, y + rh * .4 + ch, .8]], { w: 6 * s, tone: .6, dry: .5, wet: .4, prof: 'even', seed: sd * 60 }), 1, am);
}

// ---------- palace lantern ----------
export function lantern(L, x, y, s = 1, am = 1, sd = 1) {
  mass(L.wet, Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return [x + Math.cos(a) * 11 * s, y + Math.sin(a) * 15 * s]; }), .14 * am, 1.5 * s, sd);
  draw(L, mk([[x - 7 * s, y - 15 * s], [x + 7 * s, y - 15 * s]], { w: 4 * s, tone: .85, dry: .3, prof: 'even', seed: sd * 3 }), 1, am);
  draw(L, mk([[x - 7 * s, y + 15 * s], [x + 7 * s, y + 15 * s]], { w: 4 * s, tone: .85, dry: .3, prof: 'even', seed: sd * 3 + 1 }), 1, am);
  draw(L, mk([[x, y - 15 * s], [x, y - 40 * s]], { w: 1.4 * s, tone: .7, dry: .4, prof: 'even', seed: sd * 3 + 2 }), 1, am);
  draw(L, mk([[x, y + 15 * s], [x + 1 * s, y + 30 * s]], { w: 2.2 * s, tone: .6, dry: .6, prof: 'tip', seed: sd * 3 + 4 }), 1, am);
}

// ---------- the palace lady (xieyi), seated, three-quarter back view facing right (profile just visible). 100 units = standing height ----------
// X: {x, y, s, arm (0 resting … 1 raised to the bun), look (0 … 1 head lifted), tilt (head roll), laugh, t, am, seed}
export function lady(L, X) {
  const sc = X.s ?? 1, am = X.am ?? 1, t = X.t ?? 0, x0 = X.x, y0 = X.y, sd = X.seed ?? 21, fl = X.flip ?? 1;
  const arm = X.arm ?? 0, look = X.look ?? 0, tilt = (X.tilt ?? 0) + (X.laugh ? Math.sin(t * 9) * .035 * X.laugh : 0);
  let idx = 0;
  const T = p => [x0 + p[0] * sc * fl, y0 + p[1] * sc, p[2] ?? 1];
  const S = (pts, o, a = 1) => { const oo = { ...o, w: o.w * sc, seed: sd * 1000 + (idx++) * 97, gapLen: 45 * sc }; if (o.darkDir) oo.darkDir = [o.darkDir[0] * fl, o.darkDir[1]]; draw(L, mk(pts.map(T), oo), 1, am * a); };
  const M = (poly, a, g) => mass(L.wet, poly.map(T), a * am, .5 * sc, sd + idx++, g ? [T(g[0])[0], T(g[0])[1], T(g[1])[0], T(g[1])[1], g[2], g[3]] : null);
  // head pivot at the nape; look tilts it back (up), tilt rolls it
  const NP = [4, -55], ang = -look * .55 + tilt;
  const H = p => { const dx = p[0] - NP[0], dy = p[1] - NP[1], c = Math.cos(ang), s = Math.sin(ang); return [NP[0] + dx * c - dy * s, NP[1] + dx * s + dy * c, p[2]]; };
  const ell = (cx, cy, rx, ry, n = 18, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n }, (_, i) => { const a = a0 + (a1 - a0) * i / (n - 1); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  // robe: back nearly upright, the volume spreading forward over the knees, the hem spilling right
  M([[2.5, -54], [-3.5, -50], [-7, -40], [-8.5, -26], [-11, -11], [-19, 1], [-6, 4.5], [14, 4.5], [32, 2], [29, -6], [23, -14], [15, -22], [12.5, -32], [10.5, -44], [7.5, -51]], .17, [[0, -55], [0, 5], .7, 1.3]);
  S([[2.5, -54], [-3.8, -50], [-7.2, -40], [-8.6, -26], [-11.4, -11], [-20, 1.5]], LOAD(7.5, .74, [-1, 0], { dry: .42 }));
  S([[13, -27], [19, -19], [26, -12], [30, -5], [32.5, 2]], LOAD(6, .58, [1, -.3], { dry: .5 }));
  S([[-19, 1.5], [-6, 5], [14, 5.2], [32, 2]], { w: 1.3, tone: TONE.zhong, dry: .7, prof: 'tip' });
  S([[-6.5, -37], [3, -38.5], [11.5, -37.5]], { w: 2.4, tone: TONE.jiao, dry: .3, wet: .2, prof: 'nail' });
  S([[-3, -30], [-4.5, -16], [-7, -4]], { w: .9, tone: TONE.zhong, dry: .75, prof: 'tip' }, .7);
  // the shawl (披帛): over the far shoulder, down the back in an S, trailing on the ground; moving a little
  const wv = Math.sin(t * 1.3) * 1.6;
  S([[8, -50.5], [1, -52], [-4.5, -47.5], [-9, -34], [-6.5, -22], [-11, -10], [-22 - wv, -2], [-38 - wv * 2, 2]], { w: 2.8, tone: .5, wet: .6, dry: .45, prof: 'even' });
  // near arm and its long sleeve hanging over the knee; or lifted to the bun
  {
    const sh = [8.5, -49], el = [lerp(14.5, 15.5, arm), lerp(-35, -58, arm)], hd = [lerp(22, 11, arm), lerp(-26, -71, arm)];
    const dr = [lerp(22, 21, arm), lerp(-12, -44, arm)], dr2 = [lerp(17, 17, arm), lerp(-10, -46, arm)];
    M([[sh[0] - 1.5, sh[1] - 1], [el[0] + 2.5, el[1] - 1], [hd[0] + 1, hd[1] + 1.5], dr, dr2, [el[0] - 3, el[1] + 4]], .1);
    S([sh, el, hd], LOAD(5.5, .55, [1, -.4], { dry: .45 }));
    S([[hd[0] - .5, hd[1] + 2], dr, dr2], LOAD(3, .5, [0, 1], { dry: .55, prof: 'tip' }));
    S([[hd[0], hd[1]], [hd[0] + 1.4, hd[1] - 2.2]], { w: 2.2, tone: .13, wet: .9, dry: .05, prof: 'lens' });
  }
  // neck
  S([[4.8, -55.5], [4.2, -50.5]], { w: 3.4, tone: .09, wet: 1, dry: 0, prof: 'even' });
  S([H([6.6, -55]), [6.4, -51.6]], { w: .5, tone: TONE.nong, dry: .4, prof: 'tip' });
  // hair and bun as one silhouette: the back of the skull rising into a tall rounded bun that leans forward
  const HB = [[2.6, -54.6], [.5, -56.6], [0, -60], [.7, -63.4], [1.2, -66.4], [2.4, -70], [5, -72.4], [8, -72], [9.4, -69.4], [8.4, -66.2], [7, -64.4], [6.7, -61.8], [7, -58.8], [6.3, -55.6]].map(H);
  M(HB, .6);
  S(HB.slice(0, 10), { w: 1.3, tone: TONE.jiao, dry: .28, wet: .35, prof: 'even' });
  S([H([7, -64.4]), H([6.7, -61.8]), H([7, -58.8]), H([6.3, -55.6])], { w: .7, tone: TONE.jiao, dry: .3, prof: 'tip' });   // hairline
  S([H([1.3, -64.2]), H([4.4, -65.6]), H([7.6, -66.4])], { w: .9, tone: .22, dry: .5, prof: 'tip' });                      // band between skull and bun
  S([H([3, -68.4]), H([5.2, -70.6]), H([7.6, -70.6])], { w: .5, tone: .3, dry: .6, prof: 'tip' });
  S([H([5.8, -66.2]), H([7.6, -67.6]), H([9, -67])], { w: .9, tone: TONE.nong, dry: .3, prof: 'even' });                  // comb
  // face in profile: a clear wash and one fine line
  S([H([7.3, -63.6]), H([8.5, -60]), H([7.3, -55.8])], { w: 2.6, tone: .08, wet: 1, dry: 0, prof: 'lens' });
  S([H([7.2, -63.6]), H([8.1, -61.4]), H([9.1, -60]), H([8.4, -59.4]), H([8.7, -58.4]), H([8.3, -57.7]), H([8.2, -56.8]), H([7.1, -55.4])], { w: .45, tone: TONE.nong, dry: .3, prof: 'tip' });
  S([H([7.4, -61.2]), H([8.2, -61.1])], { w: .45, tone: TONE.jiao, dry: .3, prof: 'tip' });
  return { bun: T(H([9.2, -69])), hand: T([lerp(20, 10, arm) + 1, lerp(-23, -72, arm) - 2]) };
}

// ---------- a hand and sleeve reaching down into the water (close-up); the sleeve comes from off-frame along -x of the local axis ----------
export function hand(L, x, y, s, o = {}) {
  const am = o.am ?? 1, sd = o.seed ?? 31, ang = o.ang ?? .9;
  const T = p => { const c = Math.cos(ang), si = Math.sin(ang); return [x + (p[0] * c - p[1] * si) * s, y + (p[0] * si + p[1] * c) * s, p[2] ?? 1]; };
  let i = 0; const S = (pts, op, a = 1) => { const oo = { ...op, w: op.w * s, seed: sd * 100 + i++ }; draw(L, mk(pts.map(T), oo), 1, am * a); };
  // wide sleeve: pale mass, loaded lower edge, a cuff band
  mass(L.wet, [[-300, -70], [-60, -34], [-46, 30], [-300, 90]].map(T), .15 * am, 3 * s, sd);
  S([[-300, 86], [-150, 52], [-50, 28]], LOAD(24, .68, [0, 1], { dry: .45 }));
  S([[-300, -64], [-150, -50], [-62, -34]], LOAD(16, .5, [0, -1], { dry: .5 }));
  S([[-62, -36], [-50, -2], [-50, 28]], { w: 5, tone: TONE.nong, dry: .45, prof: 'even' });
  // forearm and back of the hand: clear wash; contour lines
  S([[-52, -2], [-10, 0], [22, 2]], { w: 34, tone: .085, wet: 1, dry: 0, prof: 'even' });
  S([[-50, -17], [-10, -15], [20, -13]], { w: 1.8, tone: TONE.nong, dry: .45, prof: 'tip' });
  S([[-50, 16], [-10, 17], [20, 16]], { w: 1.6, tone: TONE.zhong, dry: .5, prof: 'tip' });
  // four fingers, slightly fanned, tips down; a thumb
  for (let k = 0; k < 4; k++) {
    const yy = -10 + k * 6.6, len = [34, 40, 37, 29][k], bend = 2 + k * .5;
    S([[18, yy], [18 + len * .55, yy + bend], [18 + len, yy + bend * 2.2]], { w: 6.4, tone: .08, wet: 1, dry: 0, prof: 'lens' });
    S([[18, yy - 3], [18 + len * .55, yy + bend - 3], [18 + len, yy + bend * 2.2 - 1.2]], { w: 1, tone: TONE.nong, dry: .45, prof: 'tip' }, .9);
  }
  S([[6, -14], [20, -22], [33, -22]], { w: 7, tone: .08, wet: 1, dry: 0, prof: 'lens' });
  S([[6, -17], [20, -25], [34, -24]], { w: 1.2, tone: TONE.nong, dry: .45, prof: 'tip' });
  return T([58, 12]);
}

// ---------- dancer with long water sleeves (front view). ph = dance phase ----------
export function dancer(L, x, y, s, ph, am = 1, sd = 41) {
  let i = 0;
  const T = p => [x + p[0] * s, y + p[1] * s, p[2] ?? 1];
  const S = (pts, o, a = 1) => draw(L, mk(pts.map(T), { ...o, w: o.w * s, seed: sd * 100 + i++, gapLen: 45 * s }), 1, am * a);
  const sw = Math.sin(ph), lean = sw * 3;
  // skirt flaring out at the hem, a turning body
  mass(L.wet, [[-4 + lean, -74], [4 + lean, -74], [7 + lean * .6, -52], [14, -18], [24, 0], [-22, 0], [-13, -18], [-7 + lean * .6, -52]].map(T), .15 * am, .6 * s, sd, [T([0, -74])[0], T([0, -74])[1], T([0, 0])[0], T([0, 0])[1], .7, 1.3]);
  S([[-4 + lean, -74], [-7 + lean * .6, -52], [-13, -18], [-23, 0]], LOAD(5, .66, [-1, 0], { dry: .45 }));
  S([[4 + lean, -74], [7 + lean * .6, -52], [14, -18], [25, 0]], LOAD(5, .6, [1, 0], { dry: .45 }));
  S([[-23, 0], [0, 3], [25, 0]], { w: 1.4, tone: TONE.zhong, dry: .7, prof: 'tip' });
  S([[-7 + lean * .6, -54], [lean * .8, -55.5], [7 + lean * .6, -54]], { w: 2.4, tone: TONE.jiao, dry: .3, prof: 'nail' });
  // head and bun
  mass(L.wet, [[-3.4, -84], [3.4, -84], [3.8, -78], [0, -75.5], [-3.8, -78]].map(p => T([p[0] + lean, p[1]])), .6 * am, .4 * s, sd + 3);
  S([[-2.8 + lean, -84], [-3 + lean, -90], [1 + lean, -92.5], [4 + lean, -89], [3.2 + lean, -84]], { w: 1.8, tone: TONE.jiao, dry: .25, wet: .4, prof: 'even' });
  // arms up, long sleeves streaming out and falling in S-curves (loaded strokes, dark underside)
  for (const d of [-1, 1]) {
    const k = Math.sin(ph + d * .9), sh = [d * 5 + lean, -72], hd = [d * (13 + 3 * k) + lean, -86 - 6 * k];
    S([sh, [d * 9 + lean, -80], hd], { w: 2.4, tone: .5, wet: .6, dry: .4, prof: 'even' });
    const p1 = [hd[0] + d * (14 + 8 * k), hd[1] - 10 - 8 * k], p2 = [hd[0] + d * (30 + 6 * k), hd[1] + 6], p3 = [hd[0] + d * (26 - 8 * k), hd[1] + 34], p4 = [hd[0] + d * (38 + 10 * k), hd[1] + 60 + 6 * k];
    S([hd, p1, p2, p3, p4], LOAD(9, .5, [0, 1], { dry: .5, body: .28 }));
    S([p1, p2, p3], { w: 1.2, tone: TONE.zhong, dry: .7, prof: 'tip' }, .8);
  }
}

// ---------- seated musician with a pipa (tiny, a few strokes) ----------
export function musician(L, x, y, s, t, am = 1, sd = 51) {
  let i = 0; const T = p => [x + p[0] * s, y + p[1] * s, p[2] ?? 1];
  const S = (pts, o) => draw(L, mk(pts.map(T), { ...o, w: o.w * s, seed: sd * 100 + i++ }), 1, am);
  mass(L.wet, [[-5, -40], [5, -40], [12, -12], [16, 0], [-16, 0], [-12, -12]].map(T), .16 * am, .5 * s, sd);
  S([[-5, -40], [-12, -14], [-17, 0]], LOAD(5, .6, [-1, 0], { dry: .5 }));
  blot(L.wet, ...T([0, -46]).slice(0, 2), 5 * s, .5 * am, 0, 1.1, sd);
  S([[-2, -52], [1, -56], [3, -51]], { w: 2.6, tone: TONE.jiao, dry: .3, prof: 'even' });
  // pipa: a pale pear body + neck
  mass(L.wet, Array.from({ length: 12 }, (_, k) => { const a = k / 12 * Math.PI * 2; return T([8 + Math.cos(a) * 7, -18 + Math.sin(a) * 9]); }), .3 * am, .5 * s, sd + 2);
  S([[6, -24], [-2, -40]], { w: 1.8, tone: TONE.nong, dry: .4, prof: 'even' });
  S([[12, -16 + Math.sin(t * 14) * 1.5], [15, -12]], { w: 1.6, tone: TONE.nong, dry: .5, prof: 'tip' });
}

// ---------- horse and rider, side view, flying gallop; dir -1 = to the left ----------
export function horse(L, x, y, s, ph, o = {}) {
  const am = o.am ?? 1, sd = o.seed ?? 61, dir = o.dir ?? -1;
  let i = 0; const T = p => [x + p[0] * s * dir, y + p[1] * s, p[2] ?? 1];
  const S = (pts, op, a = 1) => { const oo = { ...op, w: op.w * s, seed: sd * 100 + i++, gapLen: 40 * s }; if (op.darkDir) oo.darkDir = [op.darkDir[0] * dir, op.darkDir[1]]; draw(L, mk(pts.map(T), oo), 1, am * a); };
  const M = (poly, a) => mass(L.wet, poly.map(T), a * am, .5 * s, sd + i++);
  const g = Math.sin(ph * 2) * 1.2, c = Math.sin(ph);
  // body barrel, neck and head as wet masses; the back as one loaded stroke (dark side up)
  M([[-22, -42 + g], [-10, -47 + g], [8, -47 + g], [18, -44 + g], [22, -38 + g], [16, -32 + g], [-4, -31 + g], [-20, -34 + g], [-25, -38 + g]], .5);
  M([[14, -45 + g], [22, -52 + g], [29, -60 + g], [33, -59 + g], [27, -48 + g], [22, -37 + g]], .55);
  M([[28, -61 + g], [33, -63 + g], [43, -55 + g], [42, -52 + g], [35, -53 + g], [30, -56 + g]], .7);
  S([[-25, -39 + g], [-14, -46 + g], [4, -47.5 + g], [16, -45 + g], [24, -54 + g], [31, -62 + g]], LOAD(5, .85, [0, -1], { dry: .35, body: .25 }));
  S([[-18, -33 + g], [0, -31 + g], [16, -33 + g]], { w: 1.6, tone: TONE.nong, dry: .5, prof: 'tip' });
  S([[41, -55 + g], [43.5, -53 + g]], { w: 2.4, tone: TONE.jiao, dry: .3, prof: 'nail' });
  blot(L.wet, ...T([35, -58.5 + g]).slice(0, 2), .9 * s, .9 * am, 0, 1, sd);
  S([[29, -63 + g], [28, -66 + g]], { w: 1.4, tone: TONE.jiao, dry: .3, prof: 'tip' });                                          // ear
  for (let k = 0; k < 4; k++) S([[18 + k * 2.5, -50 + g - k * 2.4], [12 + k * 2.4, -54 + g - k * 2 - c * 2]], { w: 1.6, tone: TONE.jiao, dry: .6, prof: 'tip' });  // mane
  S([[-24, -41 + g], [-34, -44 + g + c * 2], [-46, -40 + g + c * 4], [-54, -34 + g + c * 3]], { w: 4, tone: .85, dry: .65, prof: 'tip' });           // tail
  // legs: flying gallop, front pair reaching forward, hind pair stretched back; small cycle
  const leg = (hip, k1, f1, w) => { S([hip, k1, f1], { w, tone: TONE.jiao, dry: .35, wet: .2, prof: 'cone' }); S([f1, [f1[0] + 2.2, f1[1] + .6]], { w: w * 1.1, tone: TONE.jiao, dry: .3, prof: 'nail' }); };
  leg([16, -34 + g], [26 + c * 3, -30 + g], [34 + c * 4, -24 + g], 2.6);
  leg([12, -34 + g], [21 + c * 2, -26 + g], [30 + c * 3, -22 + g], 2.3);
  leg([-17, -35 + g], [-26 - c * 3, -28 + g], [-36 - c * 3, -24 + g], 2.8);
  leg([-20, -36 + g], [-30 - c * 2, -31 + g], [-40 - c * 2, -27 + g], 2.5);
  // rider: bent forward, a cloak streaming back
  M([[-2, -46 + g], [4, -60 + g], [10, -62 + g], [8, -46 + g]], .55);
  blot(L.wet, ...T([11, -65 + g]).slice(0, 2), 3.2 * s, .8 * am, 0, 1, sd + 1);
  S([[11, -67.5 + g], [13, -66 + g]], { w: 2, tone: TONE.jiao, dry: .3, prof: 'even' });
  S([[5, -60 + g], [-8, -62 + g + c * 2], [-24, -57 + g + c * 3]], { w: 6, tone: .55, wet: .6, dry: .55, prof: 'tip' });
  S([[8, -56 + g], [18, -52 + g], [26, -55 + g]], { w: 1, tone: TONE.nong, dry: .5, prof: 'tip' });                              // reins
  if (o.dust) { const R = mulberry(sd + Math.floor(ph * 2)); for (let k = 0; k < 12; k++) { const p = T([-34 - R() * 60, -20 - R() * 12]); blot(L.wet, p[0], p[1], (2 + R() * 5) * s, .18 * am * o.dust, R() * 3, .6, k); } }
}

// ---------- big galloping legs (close-up for the hard cut) ----------
export function hooves(L, x, y, s, ph, am = 1) {
  const R = mulberry(9);
  for (let k = 0; k < 2; k++) {
    const a = ph + k * 1.8, hx = x + (k ? -180 : 120) * s, kx = hx + Math.sin(a) * 90 * s, ky = y - 260 * s, fx = hx + Math.sin(a) * 160 * s, fy = y - Math.max(0, Math.cos(a)) * 60 * s;
    draw(L, mk([[hx, y - 620 * s, 1], [kx, ky, .9], [fx, fy, .7]], LOAD(46 * s, .9, [1, 0], { dry: .45, body: .3, prof: 'press', seed: 70 + k })), 1, am);
    draw(L, mk([[fx - 30 * s, fy + 6 * s], [fx + 40 * s, fy + 10 * s]], { w: 30 * s, tone: TONE.jiao, dry: .3, prof: 'nail', seed: 80 + k }), 1, am);
  }
  for (let k = 0; k < 40; k++) blot(L.wet, x + (R() - .5) * 900 * s, y + (R() - .3) * 140 * s, (4 + R() * 18) * s, (.15 + R() * .4) * am, R() * 3, .5 + R() * .4, k);
  for (let k = 0; k < 18; k++) blot(L.dry, x + (R() - .5) * 1000 * s, y - R() * 300 * s, (2 + R() * 6) * s, .7 * am, R() * 3, .7, k + 50);
}

// ---------- petal of a crabapple flower (the only red in the world) ----------
export function petal(L, x, y, s, rot = 0, am = 1, sd = 1) {
  if (am <= 0) return;
  const c = Math.cos(rot), si = Math.sin(rot), T = p => [x + (p[0] * c - p[1] * si) * s, y + (p[0] * si + p[1] * c) * s, p[2] ?? 1];
  draw(L, mk([[-10, 0], [0, -3], [10, 0]].map(T), { w: 12 * s, tone: .9, prof: 'lens', color: VERM, dry: .05, seed: sd }), 1, am);
  draw(L, mk([[-7, .5], [1, -1.5], [8, 1]].map(T), { w: 5 * s, tone: .5, prof: 'lens', color: [120, 20, 16], dry: .1, seed: sd + 1 }), 1, am * .6);
}

// ---------- the countdown seal: a vermilion square with the number carved white (宋体) ----------
export function daySeal(c, x, y, size, n, am = 1, seed = 5) {
  if (am <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(x, y);
  const S = size, jit = S * .02;
  c.beginPath();
  for (let i = 0; i < 28; i++) {
    const tt = i / 28 * 4, side = Math.floor(tt), u = tt - side;
    let px, py; if (side === 0) { px = u * S; py = 0; } else if (side === 1) { px = S; py = u * S; } else if (side === 2) { px = S - u * S; py = S; } else { px = 0; py = S - u * S; }
    px += (vnoise(seed + i * 1.3) - .5) * jit * 2; py += (vnoise(seed + 40 + i * 1.3) - .5) * jit * 2;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath(); c.fillStyle = `rgba(${VERM.join(',')},${clamp(am)})`; c.fill();
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const str = String(n), fs = S * (str.length >= 3 ? .5 : str.length === 2 ? .62 : .72);
  c.font = `600 ${fs}px NotoSerifSC`; c.fillText(str, S / 2, S * .44);
  c.font = `600 ${S * .17}px NotoSerifSC`; c.fillText('天', S / 2, S * .82);
  for (let i = 0; i < 50; i++) { c.globalAlpha = .4 + .6 * vnoise(i * 1.1); c.beginPath(); c.arc(vnoise(seed + i * 3.7) * S, vnoise(seed + 91 + i * 2.9) * S, S * (.004 + .01 * vnoise(i * 5.3)), 0, 7); c.fill(); }
  c.restore();
}

// ---------- the title seal "华清" (朱文 red lines on a pale square) ----------
export function titleSeal(c, x, y, size, am = 1) {
  if (am <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(x, y); c.globalAlpha = clamp(am);
  c.fillStyle = `rgb(${VERM.join(',')})`;
  c.fillRect(0, 0, size, size);
  c.globalCompositeOperation = 'destination-out';
  c.fillRect(size * .07, size * .07, size * .86, size * .86);
  c.globalCompositeOperation = 'source-over';
  c.font = `${size * .4}px MaShanZheng`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('华', size * .5, size * .3); c.fillText('清', size * .5, size * .72);
  c.restore();
}

// ---------- calligraphy written by ink bloom: each character grows out of a spreading wet blot, then dries ----------
// cols: array of strings (vertical columns, right to left from x). prog ∈ [0,1] across all characters.
export function writeCols(A, TMP, cols, x, y, size, prog, o = {}) {
  const chars = []; cols.forEach((col, ci) => [...col].forEach((ch, k) => chars.push({ ch, x: x - ci * size * (o.colGap ?? 1.25), y: y + k * size * (o.rowGap ?? 1.08) })));
  const N = chars.length, am = o.am ?? 1;
  for (let i = 0; i < N; i++) {
    const u = clamp(prog * N - i); if (u <= 0) break;
    const c = chars[i];
    for (const [ctx, k] of [[A.cw, (1 - u) * .9 + .15], [A.cd, Math.min(1, u * 1.4)]]) {
      const t = TMP.cd; t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.globalAlpha = 1; t.clearRect(0, 0, TMP.W, TMP.H);
      t.font = `${size}px MaShanZheng`; t.textAlign = 'center'; t.textBaseline = 'middle'; t.fillStyle = '#000'; t.fillText(c.ch, c.x, c.y);
      // bloom mask: noisy disc growing from the first stroke's corner
      t.globalCompositeOperation = 'destination-in'; t.beginPath();
      const R = size * .85 * Math.pow(u, .6), cx = c.x - size * .2, cy = c.y - size * .3;
      for (let j = 0; j <= 24; j++) { const a = j / 24 * Math.PI * 2, rr = R * (.75 + .5 * vnoise(i * 9 + j * .8)); j ? t.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : t.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      t.fill();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(k * am * (o.tone ?? .95)); ctx.drawImage(TMP.dry, 0, 0); ctx.restore();
    }
  }
}

// ---------- the character 反, traced in stroke order from Ma Shan Zheng; four strokes in a 100×100 cell ----------
export const FAN = [
  [[70, 12, .7], [60, 16, .95], [45, 19, .9], [30, 21, .8], [24, 22, .6]],                                      // 1 平撇 (top)
  [[27, 18, .8], [28, 32, 1.0], [27, 50, .95], [23, 66, .85], [16, 80, .6], [8, 90, .2]],                         // 2 竖撇 (left)
  [[34, 40, .7], [52, 37, .95], [68, 36, 1.05], [70, 40, 1.0], [62, 54, .9], [50, 68, .75], [36, 82, .5], [24, 92, .15]],  // 3 横撇 (又)
  [[44, 52, .45], [52, 62, .7], [62, 72, .9], [74, 82, 1.1], [88, 89, 1.0], [96, 90, .3]],                        // 4 捺
];
const FAN_W = [8, 9, 9, 11];
export function fanStrokes(x, y, size, seed = 91) {
  const k = size / 100;
  return FAN.map((st, i) => mk(st.map(p => [x + p[0] * k, y + p[1] * k, 1]), { w: FAN_W[i] * k * 2.6, tone: TONE.jiao, dry: .14, wet: .4, prof: 'even', rough: .07, nb: 56, solid: true, seed: seed * 10 + i }));
}
const maskCache = {};
function glyphMask(ch, x, y, size, W, H) {
  const key = [ch, x, y, size].join(',');
  if (maskCache[key]) return maskCache[key];
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  c.font = `${size}px MaShanZheng`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const m = c.measureText(ch), yy = y + size / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  c.fillStyle = '#000'; c.fillText(ch, x + size / 2, yy);
  return (maskCache[key] = cv);
}
// prog: 0..4 (stroke i revealed while prog in [i, i+1]). The glyph itself is the ink; wide round strokes along the skeleton reveal it
// in stroke order, with bristle streaks from the brush engine laid inside for texture.
export function writeFan(A, TMP, x, y, size, prog, o = {}) {
  const k = size / 100, am = o.am ?? 1;
  const mask = glyphMask('反', x, y, size, TMP.W, TMP.H);
  const rv = document.createElement('canvas'); rv.width = TMP.W; rv.height = TMP.H; const r = rv.getContext('2d');
  r.lineCap = 'round'; r.lineJoin = 'round'; r.strokeStyle = '#000';
  FAN.forEach((st, i) => {
    const p = clamp(prog - i); if (p <= 0) return;
    const pts = st.map(q => [x + q[0] * k, y + q[1] * k]), n = pts.length - 1, m = n * p, j = Math.floor(m), f = m - j;
    r.lineWidth = size * .26; r.beginPath(); r.moveTo(pts[0][0], pts[0][1]);
    for (let q = 1; q <= j; q++) r.lineTo(pts[q][0], pts[q][1]);
    if (j < n) r.lineTo(lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f));
    r.stroke();
  });
  for (const [key, a] of [['dry', .93], ['wet', .3]]) {
    const c = key === 'wet' ? TMP.cw : TMP.cd; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, TMP.W, TMP.H);
    c.globalAlpha = a; c.drawImage(mask, 0, 0); c.globalAlpha = 1;
    if (key === 'dry') { const S = fanStrokes(x, y, size); S.forEach((s, i) => draw({ dry: c }, s, clamp(prog - i), .5)); }
    c.globalCompositeOperation = 'destination-in'; c.drawImage(rv, 0, 0); c.drawImage(mask, 0, 0); c.globalCompositeOperation = 'source-over';
    const d = key === 'wet' ? A.cw : A.cd; d.save(); d.setTransform(1, 0, 0, 1, 0, 0); d.globalAlpha = am; d.drawImage(TMP[key], 0, 0); d.restore();
  }
}

// ---------- rain: thin slanted dry strokes ----------
export function rain(L, W, H, t, am = 1, n = 140) {
  const R = mulberry(17);
  for (let i = 0; i < n; i++) {
    const x = R() * (W + 300), sp = 900 + R() * 500, y = ((R() * H + t * sp) % (H + 200)) - 100, len = 40 + R() * 70;
    draw(L, mk([[x, y], [x - len * .3, y + len]], { w: 1.4, tone: .35, dry: .6, prof: 'tip', seed: 500 + i }), 1, am * (.4 + R() * .6));
  }
}

// ---------- tiny xieyi figure standing (tourists, travellers): head dot + body stroke; phone = pale tick held up ----------
export function tiny(L, x, y, s, o = {}) {
  const am = o.am ?? 1, sd = o.seed ?? 1;
  draw(L, mk([[x, y - 30 * s], [x + s, y - 16 * s], [x, y]], { w: 9 * s, tone: .55, wet: .7, dry: .3, prof: 'lens', seed: sd }), 1, am);
  blot(L.wet, x, y - 36 * s, 3.6 * s, .8 * am, 0, 1, sd);
  if (o.phone) { draw(L, mk([[x + 3 * s, y - 26 * s], [x + 6 * s, y - 36 * s]], { w: 1.6 * s, tone: .7, dry: .3, prof: 'even', seed: sd + 3 }), 1, am); draw(L, mk([[x + 5 * s, y - 40 * s], [x + 6.5 * s, y - 46 * s]], { w: 4 * s, tone: .85, dry: .2, prof: 'even', seed: sd + 4 }), 1, am); }
}

// ---------- a present-day visitor (standing, back or front): straight trousers, a T-shirt, cap or ponytail, backpack, a phone held up ----------
// o: {cap, pack, phone (0 none, 1 held up), stick (selfie stick), flag (tour guide), front, am, seed}. 100 units = height
export function tourist(L, x, y, s, o = {}) {
  const am = o.am ?? 1, sd = o.seed ?? 1; let i = 0;
  const T = p => [x + p[0] * s, y + p[1] * s, p[2] ?? 1];
  const S = (pts, op, a = 1) => draw(L, mk(pts.map(T), { ...op, w: op.w * s, seed: sd * 100 + i++ }), 1, am * a);
  const M = (poly, a) => mass(L.wet, poly.map(T), a * am, .4 * s, sd + i++);
  // legs: two straight strokes (jeans), shoes
  S([[-3.5, -46], [-4, -24], [-4.2, -2]], { w: 5.5, tone: .62, wet: .5, dry: .35, prof: 'even' });
  S([[3.5, -46], [4, -24], [4.4, -2]], { w: 5.5, tone: .62, wet: .5, dry: .35, prof: 'even' });
  S([[-6.5, -1], [-2, -.5]], { w: 3, tone: TONE.jiao, dry: .3, prof: 'even' }); S([[2, -.5], [6.8, -1]], { w: 3, tone: TONE.jiao, dry: .3, prof: 'even' });
  // T-shirt: a boxy pale mass with straight sides
  M([[-8.5, -74], [8.5, -74], [9, -46], [-9, -46]], .2);
  S([[-8.6, -74], [-9, -46]], { w: 1.3, tone: TONE.nong, dry: .45, prof: 'even' }); S([[8.6, -74], [9, -46]], { w: 1.3, tone: TONE.nong, dry: .45, prof: 'even' });
  if (o.pack && !o.front) { M([[-6.5, -72], [6.5, -72], [7, -52], [-7, -52]], .5); S([[-6.5, -72], [-7, -52], [7, -52], [6.5, -72]], { w: 1.2, tone: TONE.jiao, dry: .4, prof: 'even' }); }
  // head, hair, cap
  blot(L.wet, ...T([0, -82]).slice(0, 2), 5.6 * s, .62 * am, 0, 1.12, sd);
  if (o.cap) { S([[-5.4, -85.5], [0, -88.5], [5.4, -85.5]], { w: 3, tone: TONE.jiao, dry: .3, prof: 'even' }); S([[2, -85], [10, -84]], { w: 1.8, tone: TONE.jiao, dry: .3, prof: 'nail' }); }
  else S([[-2, -86], [-6, -82], [-6.5, -74]], { w: 2.2, tone: TONE.jiao, dry: .4, prof: 'tip' });                   // ponytail
  // arms: down, or both raised holding a phone up in front of the face; the screen is blank paper in a dark frame
  if (o.phone || o.stick) {
    const ph = o.stick ? [14, -118] : [3, -96];
    S([[-8, -72], [-6, -84], [ph[0] - 2, ph[1] + 4]], { w: 2.4, tone: .55, wet: .4, dry: .4, prof: 'even' });
    S([[8, -72], [9, -84], [ph[0] + 2, ph[1] + 4]], { w: 2.4, tone: .55, wet: .4, dry: .4, prof: 'even' });
    if (o.stick) S([[ph[0], ph[1] + 4], [ph[0] + 10, ph[1] - 20]], { w: .9, tone: TONE.jiao, dry: .3, prof: 'even' });
    const q = o.stick ? [ph[0] + 10, ph[1] - 26] : ph;
    S([[q[0] - 3.4, q[1] - 5], [q[0] + 3.4, q[1] - 5], [q[0] + 3.4, q[1] + 5], [q[0] - 3.4, q[1] + 5], [q[0] - 3.4, q[1] - 5]], { w: 1.3, tone: TONE.jiao, dry: .2, prof: 'even' });
  } else {
    S([[-8.5, -72], [-11, -58], [-11, -46]], { w: 2.4, tone: .55, wet: .4, dry: .4, prof: 'even' });
    S([[8.5, -72], [11, -58], [11, -46]], { w: 2.4, tone: .55, wet: .4, dry: .4, prof: 'even' });
  }
  if (o.flag) { S([[11, -46], [12, -130]], { w: .9, tone: TONE.jiao, dry: .3, prof: 'even' }); M([[12, -130], [26, -125], [12, -120]], .45); }
}

// ---------- a phone held in a hand, seen over the shoulder: dark rounded frame, camera grid, shutter; the screen interior is drawn by the caller ----------
export function phoneFrame(L, x, y, w, h, o = {}) {
  const am = o.am ?? 1, r = w * .12;
  const P = []; const corner = (cx, cy, a0) => { for (let k = 0; k <= 4; k++) { const a = a0 + k / 4 * Math.PI / 2; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI); P.push(P[0]);
  draw(L, mk(P, { w: w * .07, tone: TONE.jiao, dry: .15, wet: .2, prof: 'even', rough: .05, nb: 30, seed: 901 }), 1, am);
  for (let k = 1; k < 3; k++) { draw(L, mk([[x + w * k / 3, y + h * .1], [x + w * k / 3, y + h * .84]], { w: 1.4, tone: .35, dry: .5, prof: 'even', seed: 910 + k }), 1, am * .7); draw(L, mk([[x + w * .08, y + h * (.1 + .74 * k / 3)], [x + w * .92, y + h * (.1 + .74 * k / 3)]], { w: 1.4, tone: .35, dry: .5, prof: 'even', seed: 920 + k }), 1, am * .7); }
  const sx = x + w / 2, sy = y + h * .92, sr = w * .07;
  draw(L, mk(Array.from({ length: 21 }, (_, k) => [sx + Math.cos(k / 20 * Math.PI * 2) * sr, sy + Math.sin(k / 20 * Math.PI * 2) * sr]), { w: 5, tone: TONE.nong, dry: .2, prof: 'even', seed: 930 }), 1, am);
}
