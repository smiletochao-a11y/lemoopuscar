// S5 · Atoms: back at the near window, the camera pulls out; pinholes around you light up one by one (the particles
// of the space around you), a dashed paper ring draws the region, and the seal "有限" lands on "有限".
import { sheet } from '../paper.js';
import { stage, aim } from '../stage.js';
import { buildHome, pose, NEAR_WIN } from '../home.js';
import { seal } from '../bits.js';
import { seg, ss, eio, eo, lerp, clamp, mulberry, TAU } from '../lib.js';

export function build(E) {
  const S = stage({ light: [-.075, .2, -.15], lightR: .22, lightCol: '#ffe2b0', key: 1.6, amb: .35, keyPos: [0, .5, .35], keyTarget: [0, -.02, -.08], fov: 30 });
  const H = buildHome(S), U = S.U;
  const cx = NEAR_WIN.x + .005, cy = NEAR_WIN.y + .005, R0 = .1;
  // pinholes: a sheet just in front of the near wall, dark paper with tiny holes that glow when switched on (in reveal order)
  const R = mulberry(12), pins = [];
  for (let i = 0; i < 260; i++) { const a = R() * TAU, r = Math.sqrt(R()) * R0; const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * .95; if (Math.abs(px - NEAR_WIN.x) < NEAR_WIN.w / 2 + .004 && Math.abs(py - NEAR_WIN.y) < NEAR_WIN.h / 2 + .004) continue; pins.push([px, py, R()]); }
  const pinSheets = [0, 1, 2, 3].map(q => S.add(sheet({ U, w: .328, h: .558, z: -.05 + q * .0003, trans: 0, shadow: false, recv: false,
    draw: x => { x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, .001, .001); for (const [px, py, o] of pins) if (Math.floor(o * 4) === q) { x.fillStyle = '#20305e'; x.beginPath(); x.arc(px, py, .0019, 0, TAU); x.fill(); } },
    glowDraw: x => { x.fillStyle = '#fff'; for (const [px, py, o] of pins) if (Math.floor(o * 4) === q) { x.beginPath(); x.arc(px, py, .0013, 0, TAU); x.fill(); } }, glow: 2.6, glowCol: '#ffe0a0', glowRes: 1.5, finish: { grain: false, rim: 0, under: 0 } })));
  // the dashed ring
  const ring = S.add(sheet({ U, w: .26, h: .26, x: cx, y: cy, z: -.032, trans: .2, shadow: true, recv: false, ppm: 6000, draw: x => {
    x.strokeStyle = '#f1e2bf'; x.lineWidth = .0022; x.setLineDash([.008, .006]); x.beginPath(); x.ellipse(0, 0, R0 + .006, (R0 + .006) * .95, 0, 0, TAU); x.stroke();
  } }));
  const sl = seal(S, { s: '有限', x: cx + .09, y: cy + .085, z: -.026, size: .046, t0: E.HIT.finite - E.T0 });
  const tC = E.HIT.circle - E.T0;
  return {
    S,
    update(t) {
      for (const f of [H.nearRoom.fig, H.farRoom.fig]) pose(f, { bow: 1, thumb: 0 });
      const lit = seg(t, tC - .4, tC + 3.6);
      pinSheets.forEach((m, q) => { m.material.userData.u.uGlowLit.value = ss(clamp(lit * 4 - q)) * (1 + .15 * Math.sin(t * 9 + q * 2)); m.visible = lit > 0; });
      const rk = eo(seg(t, tC, tC + .7)); ring.scale.setScalar(Math.max(.001, rk)); ring.visible = rk > .01; ring.rotation.z = t * .05;
      sl.userData.at(t);
      const u = eio(clamp(t / E.dur));
      aim(S.cam, [lerp(cx, 0, u), lerp(cy, -.01, u), lerp(.42, .8, u), lerp(cx, 0, u), lerp(cy, -.02, u), -.08], t);
    },
    post() { return { focus: S.cam.position.z + .055, aper: 26, maxCoc: 14, bloom: { strength: .5, radius: .6, threshold: .95 } }; },
    grade() { return { expo: 1.05, vig: .45 }; },
  };
}
