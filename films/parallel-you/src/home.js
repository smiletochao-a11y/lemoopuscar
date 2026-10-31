// The night stack shared by the two-window shots: sky and moon (the one light), far block with a small lit window,
// mid rooftops, the near wall with a big lit window, foreground branches. Inside each window: a warm room and "you",
// a jointed silhouette (body, head on the neck pivot, arm on the shoulder pivot with the phone).
import * as THREE from 'three';
import { sheet, skyPanel, moon } from './paper.js';
import { xiangyun } from './art.js';
import { mulberry, TAU } from './lib.js';

export const BOX = { w: .33, h: .56, d: .16 };
export const FW = .328, FH = .558;              // full-bleed sheet size: never larger than the cavity
export const LADDER = { sky0: '#0b1534', sky1: '#1b2c5c', far: '#6f8cc8', mid: '#40598f', near: '#18224a', front: '#070b1c', glow: '#ffb862', phone: '#9fd8ff', seal: '#c8322a', fig: '#0a0f22' };
export const NEAR_WIN = { x: -.025, y: -.045, w: .15, h: .105 };   // the big window on the near wall
export const FAR_WIN = { x: .085, y: .135, w: .05, h: .036 };    // the small window on the far block
const NECK = [.002, .049], SHOULDER = [.002, .043];

// ---- the figure, in metres, seat point at the origin, facing right; s scales it
function bodyPath(x) {
  const P = [[-.011, 0], [-.013, .02], [-.012, .037], [-.008, .046], [-.002, .05], [.006, .049], [.0105, .044], [.0115, .03], [.012, .013], [.016, .0045], [.044, .006], [.048, .0015], [.047, -.03], [.056, -.033], [.057, -.037], [.04, -.037], [.041, -.005], [.0, -.006]];
  x.beginPath(); x.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i <= P.length; i++) { const p = P[i % P.length], q = P[(i + 1) % P.length]; x.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  x.closePath(); x.fill();
}
function headPath(x) {     // relative to the neck pivot: head, a cap of hair a little fuller at the back, a short fringe, the neck
  x.fillRect(-.0025, -.003, .0055, .008);
  x.beginPath(); x.arc(.0055, .0105, .0085, 0, TAU); x.fill();
  x.beginPath(); x.ellipse(.004, .0135, .0095, .0072, -.25, Math.PI * .95, Math.PI * 2.15); x.fill();
  x.beginPath(); x.moveTo(.011, .017); x.quadraticCurveTo(.017, .016, .0155, .011); x.lineTo(.012, .013); x.closePath(); x.fill();
}
function armPath(x) {      // relative to the shoulder pivot: upper arm down to the elbow, forearm up to the phone
  x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = .0058; x.strokeStyle = x.fillStyle;
  x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(.002, -.012, .005, -.019); x.lineTo(.018, -.012); x.stroke();
  x.save(); x.translate(.021, -.0095); x.rotate(.95); x.fillRect(-.0035, -.0065, .007, .013); x.restore();   // the phone
}
export function figure(S, o) {
  const U = S.U, s = o.s ?? 1, col = o.col || LADDER.fig, z = o.z;
  const g = new THREE.Group(); g.position.set(o.x, o.y, z); g.scale.setScalar(s); S.scene.add(g);
  const mk = (draw, w, h, ax, ay, glow) => sheet({ U, w, h, ax, ay, z: 0, trans: .02, ppm: 9000 / Math.max(.4, s), shadow: o.shadow ?? true, recv: false, finish: { rim: .18, under: .2, rimPx: 2, underPx: 2 },
    draw: x => { x.fillStyle = col; draw(x); }, ...(glow ? { glowDraw: glow, glow: o.phoneGlow ?? 2.2, glowCol: LADDER.phone, glowRes: 1 } : {}) });
  const body = mk(bodyPath, .14, .12, 0, 0); g.add(body);
  const head = mk(headPath, .05, .07, 0, 0); head.position.set(...NECK, .0004); g.add(head);
  const arm = mk(armPath, .08, .06, 0, 0, x => { x.fillStyle = '#fff'; x.save(); x.translate(.021, -.0095); x.rotate(.95); x.fillRect(-.0025, -.0055, .005, .011); x.restore(); });
  arm.position.set(...SHOULDER, .0008); g.add(arm);
  [body, head, arm].forEach(m => S.layers.push(m));
  return { g, body, head, arm };
}
// pose: bow 0..1 (head down over the phone), thumb 0..1 (a small lift), look 0..1 (head up, towards us)
export function pose(f, p) {
  f.head.rotation.z = -.38 * (p.bow ?? 1) + .46 * (p.look ?? 0);
  f.arm.rotation.z = .06 * (p.thumb ?? 0) + .1 * (p.look ?? 0);
}

// ---- a lit room seen through a window: warm wall (emissive), a bed edge, the figure on it
function room(S, o) {
  const U = S.U, { x, y, w, h, z, s } = o;
  const wall = S.add(sheet({ U, w: w * 1.3, h: h * 1.3, x, y, z: z - .006, trans: .6, shadow: false, recv: true,
    draw: c => { c.fillStyle = '#b07a48'; c.fillRect(-w * .65, -h * .65, w * 1.3, h * 1.3); },
    glowDraw: c => { const g = c.createRadialGradient(-w * .15, h * .1, 0, 0, 0, w * .75); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,.35)'); c.fillStyle = g; c.fillRect(-w * .65, -h * .65, w * 1.3, h * 1.3); },
    glow: o.glow ?? 1.4, glowCol: LADDER.glow }));
  const bed = S.add(sheet({ U, w: w * 1.2, h: h * .5, x, y: y - h * .38, z: z - .003, trans: .1,
    draw: c => { c.fillStyle = '#3a2232'; c.fillRect(-w * .6, -h * .25, w * 1.2, h * .2); c.fillRect(w * .42, -h * .25, w * .05, h * .34); } }));
  // a curtain tied back on the left and a small lamp on a shelf, both in the room's darker brown
  S.add(sheet({ U, w: w * 1.3, h: h * 1.3, x, y, z: z - .002, trans: .25, draw: c => {
    c.fillStyle = '#5a3420'; c.beginPath(); c.moveTo(-w * .5, h * .5); c.lineTo(-w * .3, h * .5); c.quadraticCurveTo(-w * .36, h * .05, -w * .42, -h * .05); c.quadraticCurveTo(-w * .46, -h * .3, -w * .5, -h * .5); c.closePath(); c.fill();
    c.fillRect(w * .26, h * .02, w * .2, h * .02); c.fillRect(w * .33, h * .04, w * .05, h * .1); c.beginPath(); c.moveTo(w * .29, h * .2); c.lineTo(w * .42, h * .2); c.lineTo(w * .39, h * .13); c.lineTo(w * .32, h * .13); c.closePath(); c.fill();
  } }));
  const fig = figure(S, { x: x + w * .02, y: y - h * .2, z: z - .001, s });
  return { wall, bed, fig };
}

export function buildHome(S, o = {}) {
  const U = S.U, R = mulberry(4);
  S.add(skyPanel({ w: FW, h: FH, z: -.155, stops: [[0, LADDER.sky0], [.55, LADDER.sky1], [1, '#33497c']], stars: 160, seed: 3, ppm: 2400 }));
  const mn = S.add(moon({ x: -.075, y: .2, z: -.15, r: .026, gain: 2.0, halo: 5, haloGain: .4 }));
  S.add(sheet({ U, w: FW, h: .2, y: .16, z: -.138, trans: .85, draw: x => { x.fillStyle = '#c3cbe8'; xiangyun(x, .07, .03, .028, 1); xiangyun(x, -.1, -.04, .022, -1); xiangyun(x, .12, -.06, .018, 1); } }));
  // far block with the small window (and the other you)
  const farBlock = S.add(sheet({ U, w: FW, h: FH, z: -.115, trans: .7, draw: x => {
    x.fillStyle = LADDER.far;
    x.fillRect(.035, -.28, .1, .45); x.fillRect(.05, .17, .07, .02); x.fillRect(-.164, -.28, .09, .3);
    x.fillRect(-.07, -.28, .05, .22);
    x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
    x.fillRect(FAR_WIN.x - FAR_WIN.w / 2, FAR_WIN.y - FAR_WIN.h / 2, FAR_WIN.w, FAR_WIN.h);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) if (!(i === 0 && j === 1)) { const wx = .048 + j * .028, wy = .095 - i * .045; x.fillRect(wx, wy, .012, .018); }
    x.restore();
    x.fillStyle = '#5770a8'; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) if (!(i === 0 && j === 1)) x.fillRect(.048 + j * .028, .095 - i * .045, .012, .018);
  } }));
  const farRoom = room(S, { x: FAR_WIN.x, y: FAR_WIN.y, w: FAR_WIN.w, h: FAR_WIN.h, z: -.117, s: .3, glow: 1.1 });
  // mid rooftops
  S.add(sheet({ U, w: FW, h: FH, z: -.09, trans: .45, draw: x => {
    x.fillStyle = LADDER.mid; x.beginPath(); x.moveTo(-.165, -.28);
    let px = -.165; while (px < .165) { const w = .03 + R() * .04, h = -.02 + R() * .05; x.lineTo(px, h); x.lineTo(px + w * .5, h + .02); x.lineTo(px + w, h); px += w; }
    x.lineTo(.165, -.28); x.closePath(); x.fill();
  } }));
  // near wall with the big window
  const wall = S.add(sheet({ U, w: FW, h: FH, z: -.06, trans: .18, draw: x => {
    x.fillStyle = LADDER.near; x.fillRect(-.164, -.28, .328, .26);
    x.beginPath(); x.moveTo(-.164, -.02); x.lineTo(-.1, .03); x.lineTo(.07, .03); x.lineTo(.164, -.02); x.closePath(); x.fill();   // eave
    x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
    x.beginPath(); x.roundRect(NEAR_WIN.x - NEAR_WIN.w / 2, NEAR_WIN.y - NEAR_WIN.h / 2, NEAR_WIN.w, NEAR_WIN.h, .006); x.fill(); x.restore();
    x.fillRect(NEAR_WIN.x - NEAR_WIN.w / 2 - .008, NEAR_WIN.y - NEAR_WIN.h / 2 - .008, NEAR_WIN.w + .016, .006);   // sill
  } }));
  const nearRoom = room(S, { x: NEAR_WIN.x, y: NEAR_WIN.y, w: NEAR_WIN.w, h: NEAR_WIN.h, z: -.064, s: 1, glow: 1.5 });
  // foreground: a branch from the top right, the ground and a railing at the bottom
  const front = S.add(sheet({ U, w: FW, h: FH, z: -.018, trans: .04, draw: x => {
    x.fillStyle = LADDER.front; x.fillRect(-.164, -.28, .328, .11);
    x.fillRect(-.164, -.17, .328, .006); for (let i = 0; i < 12; i++) x.fillRect(-.16 + i * .029, -.17, .004, .03);
    x.lineCap = 'round'; x.strokeStyle = LADDER.front;
    const br = (ax, ay, bx, by, w) => { x.lineWidth = w; x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + .01, bx, by); x.stroke(); };
    br(.17, .25, .06, .21, .007); br(.11, .235, .08, .27, .003); br(.09, .222, .03, .23, .003);
    for (let i = 0; i < 26; i++) { const lx = .04 + R() * .13, ly = .2 + R() * .07; x.beginPath(); x.ellipse(lx, ly, .007, .0028, R() * TAU, 0, TAU); x.fill(); }
  } }));
  return { mn, farBlock, farRoom, wall, nearRoom, front };
}
