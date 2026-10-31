// S3–S4 · The puzzle: a 3×3 paper grid in front of the lamp; nine shutters slide to show black-and-white patterns,
// faster and faster; the count reaches 512; the 513th equals the 137th: a second grid slides in beside it, the seal "重复".
import { sheet } from '../paper.js';
import { stage, aim } from '../stage.js';
import { strip, liveStrip, seal, curtain, GOLD } from '../bits.js';
import { seg, ss, eio, eo, lerp, clamp, mulberry } from '../lib.js';

const CELL = .056, GAP = .012, N3 = 3 * CELL + 2 * GAP;
export const ORDER = (() => { const R = mulberry(77), a = [...Array(512).keys()]; for (let i = 511; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; })();
export const REPEAT_OF = 137;

function grid(S, cx, cy, z) {
  const U = S.U, G = { shutters: [] };
  G.frame = S.add(sheet({ U, w: N3 + .05, h: N3 + .05, x: cx, y: cy, z, trans: .12, draw: x => {
    x.fillStyle = '#5a2f18'; x.beginPath(); x.roundRect(-(N3 + .05) / 2, -(N3 + .05) / 2, N3 + .05, N3 + .05, .006); x.fill();
    x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
    for (let i = 0; i < 9; i++) x.fillRect(-N3 / 2 + (i % 3) * (CELL + GAP), N3 / 2 - CELL - Math.floor(i / 3) * (CELL + GAP), CELL, CELL);
    x.restore();
  } }));
  for (let i = 0; i < 9; i++) {
    const sx = cx - N3 / 2 + CELL / 2 + (i % 3) * (CELL + GAP), sy = cy + N3 / 2 - CELL / 2 - Math.floor(i / 3) * (CELL + GAP);
    const m = S.add(sheet({ U, w: CELL + .006, h: CELL + .006, x: sx, y: sy, z: z - .008, trans: .05, draw: x => { x.fillStyle = '#26140a'; x.fillRect(-.031, -.031, .062, .062); x.fillStyle = '#3a2214'; x.fillRect(-.031, -.004, .062, .008); } }));
    m.userData.home = m.userData.home0 = sy; m.userData.x0 = sx; G.shutters.push(m);
  }
  G.set = (bits, open) => G.shutters.forEach((m, i) => { const on = (bits >> i) & 1; const k = open ? open(i, on) : on; m.position.y = m.userData.home + (CELL + GAP * .9) * k * m.scale.y; });
  // move/scale the whole grid about its centre (call before set)
  G.move = (dx, s) => { G.frame.position.x = cx + dx; G.frame.scale.setScalar(s); G.shutters.forEach(m => { m.position.x = cx + (m.userData.x0 - cx) * s + dx; m.userData.home = cy + (m.userData.home0 - cy) * s; m.scale.setScalar(s); }); };
  return G;
}

export function build(E) {
  const S = stage({ light: [0, .02, -.14], lightR: .2, lightCol: '#ffe6bb', key: 1.4, amb: .3, ambCol: '#c08a60', keyCol: '#ffd9ae', keyPos: [0, .5, .35], keyTarget: [0, 0, -.08], fov: 30 });
  const U = S.U;
  // the lamp behind: a bright cream panel (light only through the open cells), warm wall around
  S.add(sheet({ U, w: .328, h: .558, z: -.15, trans: 0, shadow: false, draw: x => { x.fillStyle = '#e8c48e'; x.fillRect(-.164, -.279, .328, .558); }, glowDraw: x => { const g = x.createRadialGradient(0, .02, 0, 0, .02, .26); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,.25)'); x.fillStyle = g; x.fillRect(-.164, -.279, .328, .558); }, glow: .55, glowCol: '#ffd590' }));
  S.add(sheet({ U, w: .328, h: .558, z: -.11, trans: .55, draw: x => { x.fillStyle = '#b08058'; x.fillRect(-.164, -.279, .328, .558); x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.beginPath(); x.roundRect(-.15, -.16, .3, .36, .02); x.fill(); x.restore(); } }));
  const GY = .07, A = grid(S, 0, GY, -.04), B = grid(S, 0, GY, -.04);
  B.frame.visible = false; B.shutters.forEach(m => m.visible = false);
  const count = liveStrip(S, { s: '第 1 种', size: .016, w: .17, x: 0, y: .225, z: -.03 });
  const tA = strip(S, { s: '第 137 种', size: .012, x: -.066, y: .15, z: -.028 }), tB = strip(S, { s: '第 513 种', size: .012, x: .066, y: .15, z: -.028 });
  const sl = seal(S, { s: '重复', x: 0, y: GY, z: -.022, size: .036, t0: E.HIT.repeat - E.T0 });
  // the front frame of the box: dark carved border with clouds at the corners
  S.add(sheet({ U, w: .328, h: .558, z: -.012, trans: .04, draw: x => { x.fillStyle = '#1a0d06'; x.fillRect(-.164, -.279, .328, .558); x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.beginPath(); x.roundRect(-.148, -.24, .296, .48, .03); x.fill(); x.restore(); } }));
  const cur = curtain(S);
  const t0 = E.HIT.grid + .4 - E.T0, tFull = E.HIT.full - E.T0, tRep = E.HIT.repeat - E.T0;
  const kOf = t => { const u = clamp((t - t0) / (tFull - t0)); return 1 + 511 * (.1 * u + .9 * Math.pow(u, 3.2)); };
  return {
    S,
    update(t) {
      cur(1 - seg(t, 0, .6));
      const kf = kOf(t), k = Math.min(512, Math.floor(kf)), frac = kf - Math.floor(kf);
      const cur1 = ORDER[k - 1], prev = ORDER[Math.max(0, k - 2)];
      const slow = (kOf(t + .1) - kf) < 1.5;           // slow: shutters glide; fast: they snap
      A.set(cur1, (i, on) => { if (!slow) return on; const p = (prev >> i) & 1; return lerp(p, on, ss(clamp(frac * 3))); });
      if (t < tRep) {
        count.userData.set(k >= 512 ? '512 种 · 全部用完' : '第 ' + k + ' 种', k >= 512 ? '#8a2a1a' : undefined);
        tA.visible = tB.visible = false;
      } else {
        // the 513th: the first grid moves left and shrinks, a second grid with the same pattern slides in on the right
        const u = eio(seg(t, tRep - .5, tRep));
        A.move(lerp(0, -.066, u), lerp(1, .48, u)); A.set(ORDER[REPEAT_OF - 1]);
        B.frame.visible = true; B.shutters.forEach(m => m.visible = true); B.move(lerp(.3, .066, u), .48); B.set(ORDER[REPEAT_OF - 1]);
        count.visible = false;
        tA.visible = tB.visible = true; tA.userData.reveal(eio(seg(t, tRep, tRep + .4))); tB.userData.reveal(eio(seg(t, tRep + .1, tRep + .5)));
      }
      sl.userData.at(t);
      aim(S.cam, [0, .04, lerp(.86, .8, eio(clamp(t / E.dur))), 0, .05, -.06], t);
    },
    post() { return { focus: S.cam.position.z + .04, aper: 22, maxCoc: 12, bloom: { strength: .3, radius: .5, threshold: 1.3 } }; },
    grade() { return { expo: .85, vig: .45, lift: [.012, .006, 0], gain: [1.03, 1, .95] }; },
  };
}
