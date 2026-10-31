// S6 · Depth as distance (signature): a stack of paper frames, each a block of universe holding a cut constellation
// on a 3×3 grid. The camera travels through them; the deepest one carries the same constellation as ours, and in it
// a small lit window with the same figure: "另一个你".
import * as THREE from 'three';
import { sheet, skyPanel } from '../paper.js';
import { stage, aim } from '../stage.js';
import { figure, pose, LADDER } from '../home.js';
import { strip, GOLD } from '../bits.js';
import { seg, ss, eio, eo, lerp, clamp, mulberry, TAU } from '../lib.js';

const OURS = 0b101011010, NL = 7;
const ZS = [...Array(NL).keys()].map(i => -.006 - i * .024);          // z of each frame, front to back
const COLS = ['#141c40', '#1b2652', '#253366', '#30437c', '#3d5590', '#4c67a4', '#6a86c2'];   // front dark → back light

function star(x, px, py, r) { x.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? r * .38 : r; x.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr); } x.closePath(); x.fill(); }
function frame(S, i, bits, extra) {
  const W = .3, H = .5, b = .014, sp = .07, cy = .02, z = ZS[i];
  const pos = k => [((k % 3) - 1) * sp, cy + (1 - Math.floor(k / 3)) * sp];
  return S.add(sheet({ U: S.U, w: .328, h: .558, z, trans: [.05, .1, .2, .3, .45, .6, .75][i], draw: x => {
    x.fillStyle = COLS[i];
    x.beginPath(); x.rect(-W / 2, -H / 2, W, H); x.rect(W / 2 - b, -H / 2 + b, -(W - 2 * b), H - 2 * b); x.fill('evenodd');
    // threads from the frame to the constellation, then the constellation: stars joined by thin cut lines
    x.lineWidth = .0012; x.strokeStyle = COLS[i];
    const on = [...Array(9).keys()].filter(k => (bits >> k) & 1);
    for (const k of on) { const [px, py] = pos(k); for (const j of on) { const [qx, qy] = pos(j); if (j > k && Math.abs(qx - px) + Math.abs(qy - py) <= sp * 1.01 + 1e-6) { x.beginPath(); x.moveTo(px, py); x.lineTo(qx, qy); x.stroke(); } } }
    { const top = on.reduce((a, k) => pos(k)[1] > pos(a)[1] ? k : a, on[0]); const [px, py] = pos(top); x.beginPath(); x.moveTo(px, H / 2 - b); x.lineTo(px, py); x.stroke(); }
    for (const k of on) { const [px, py] = pos(k); star(x, px, py, .011); }
    if (extra) extra.draw(x);
  }, glowDraw: x => { x.fillStyle = '#fff'; const on = [...Array(9).keys()].filter(k => (bits >> k) & 1); for (const k of on) { const [px, py] = pos(k); x.beginPath(); x.arc(px, py, .0035, 0, TAU); x.fill(); } if (extra?.glow) extra.glow(x); },
     glow: 2.0, glowCol: '#ffd27a', glowRes: 1 }));
}

export function build(E) {
  const S = stage({ light: [0, .03, -.17], lightR: .25, lightCol: '#dfe6ff', key: 1.2, amb: .3, keyPos: [0, .5, .4], keyTarget: [0, 0, -.1], fov: 30 });
  S.add(skyPanel({ w: .328, h: .558, z: -.175, stops: [[0, '#050a1c'], [.5, '#0b1534'], [1, '#18284e']], stars: 260, seed: 9, ppm: 2400 }));
  const R = mulberry(31), pats = [OURS];
  for (let i = 1; i < NL - 1; i++) { let b = Math.floor(R() * 512); if (b === OURS || (b & 0x1ff) === 0) b = (b ^ 0b100010001) || 0b11; pats.push(b); }
  pats.push(OURS);
  // the deepest frame: a small lit window under the constellation, with the figure inside
  const WIN = { x: 0, y: -.092, w: .056, h: .04 };
  const frames = pats.map((b, i) => frame(S, i, b, i === NL - 1 ? {
    draw: x => { x.fillRect(-.045, -.125, .09, .066); x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.fillRect(WIN.x - WIN.w / 2, WIN.y - WIN.h / 2, WIN.w, WIN.h); x.restore(); },
  } : null));
  const back = ZS[NL - 1];
  S.add(sheet({ U: S.U, w: WIN.w * 1.3, h: WIN.h * 1.3, x: WIN.x, y: WIN.y, z: back - .004, trans: .6, shadow: false, draw: x => { x.fillStyle = '#b07a48'; x.fillRect(-.04, -.03, .08, .06); }, glowDraw: x => { x.fillStyle = '#fff'; x.fillRect(-.04, -.03, .08, .06); }, glow: 1.4, glowCol: LADDER.glow }));
  const fig = figure(S, { x: WIN.x + .002, y: WIN.y - .008, z: back - .002, s: .4 });
  const tagOurs = strip(S, { s: '我们这一块宇宙', size: .011, x: 0, y: .165, z: ZS[0] + .003 });
  const tagFar = strip(S, { s: '另一个你', size: .011, x: 0, y: -.127, z: back + .003, paper: GOLD });
  const tOther = E.HIT.other - E.T0;
  return {
    S,
    update(t) {
      pose(fig, { bow: 1, thumb: Math.max(0, 1 - Math.abs(t - tOther - .6) / .3) });
      tagOurs.userData.reveal(eio(seg(t, .2, 1.0)) * (1 - seg(t, 2.6, 3.0)));
      tagFar.userData.reveal(eio(seg(t, tOther, tOther + .6)));
      // travel: from in front of the stack to just in front of the deepest frame, decelerating onto it
      const u = eio(seg(t, .6, tOther));
      const z = lerp(.66, back + .44, u);
      aim(S.cam, [0, lerp(.01, -.02, u), z, 0, lerp(.015, -.025, u), back], t);
    },
    post(t) {
      const u = eio(seg(t, .6, tOther));
      // focus on the next frame ahead, ending on the deepest one
      const zc = S.cam.position.z;
      return { focus: zc - lerp(ZS[0], back, u), aper: 24, maxCoc: 14, bloom: { strength: .55, radius: .65, threshold: .95 } };
    },
    grade() { return { expo: 1.05, vig: .5 }; },
  };
}
