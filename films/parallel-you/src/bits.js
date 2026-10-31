// Shared paper pieces: text strips that grow from their anchor edge, strips whose text changes (counters),
// the seal, the near-plane curtain, light switching for a whole stack.
import * as THREE from 'three';
import { sheet, paint, finish, text, PPM } from './paper.js';
import { seg, ss, eo, back, clamp } from './lib.js';

export const SERIF = '"NotoSerifSC"', BRUSH = '"MaShanZheng"';
export const CREAM = '#f1e2bf', INK = '#2a1a10', SEAL = '#c8322a', GOLD = '#f3d27a';

// a cream strip with text; anchored at its left edge so it can "write itself" (reveal 0..1)
export function strip(S, o) {
  const size = o.size, w = o.w ?? (o.s.length * size * 1.05 + size * .9), h = o.h ?? size * 1.7;
  const m = S.add(sheet({ U: S.U, w, h, ax: -w / 2, x: o.x, y: o.y, z: o.z, trans: o.trans ?? .35, shadow: o.shadow ?? true, recv: o.recv ?? false, ppm: o.ppm ?? 7000,
    draw: x => { x.fillStyle = o.paper ?? CREAM; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, h * .12); x.fill(); text(x, o.s, 0, -size * .04, size, o.font ?? SERIF, { fill: o.ink ?? INK, weight: o.weight ?? 600 }); } }));
  m.userData.w = w;
  m.userData.reveal = k => { k = clamp(k, 1e-3, 1); m.scale.x = k; m.material.map.repeat.x = k; m.material.map.offset.x = 0; m.visible = k > .002; };
  m.userData.reveal(o.reveal ?? 0);
  return m;
}
// a strip whose text changes (a counter): the canvas is redrawn only when the text changes
export function liveStrip(S, o) {
  const size = o.size, w = o.w, h = o.h ?? size * 1.7, ppm = o.ppm ?? 6000;
  const draw = (x, s) => { x.fillStyle = o.paper ?? CREAM; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, h * .12); x.fill(); text(x, s, 0, -size * .04, size, o.font ?? SERIF, { fill: o.ink ?? INK, weight: o.weight ?? 600 }); };
  let cur = o.s;
  const m = S.add(sheet({ U: S.U, w, h, x: o.x, y: o.y, z: o.z, trans: o.trans ?? .35, shadow: o.shadow ?? true, recv: false, ppm, draw: x => draw(x, cur) }));
  m.userData.set = (s, ink) => {
    if (s === cur && !ink) return; cur = s;
    const c = m.userData.canvas, g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
    g.setTransform(ppm, 0, 0, -ppm, c.width / 2, c.height / 2);
    const keep = o.ink; if (ink) o.ink = ink; draw(g, s); o.ink = keep;
    g.setTransform(1, 0, 0, 1, 0, 0); finish(c, {}); m.material.map.needsUpdate = true;
  };
  return m;
}
// the seal: a red square, white characters (one or two), pressed down with a small overshoot at time t0
export function seal(S, o) {
  const s = o.size ?? .045, chars = [...o.s];
  const m = S.add(sheet({ U: S.U, w: s, h: s, x: o.x, y: o.y, z: o.z, trans: .3, shadow: true, recv: false, ppm: 9000,
    draw: x => {
      x.fillStyle = SEAL; x.beginPath(); x.roundRect(-s / 2, -s / 2, s, s, s * .08); x.fill();
      x.strokeStyle = '#f6e9d6'; x.lineWidth = s * .04; x.beginPath(); x.roundRect(-s * .42, -s * .42, s * .84, s * .84, s * .05); x.stroke();
      if (chars.length === 1) text(x, chars[0], 0, -s * .03, s * .62, BRUSH, { fill: '#f6e9d6' });
      else { text(x, chars[0], 0, s * .19, s * .4, BRUSH, { fill: '#f6e9d6' }); text(x, chars[1], 0, -s * .2, s * .4, BRUSH, { fill: '#f6e9d6' }); }
    } }));
  m.rotation.z = o.rot ?? -.08;
  m.userData.at = t => { const u = seg(t, o.t0, o.t0 + .28); m.visible = t >= o.t0; m.scale.setScalar(u < 1 ? 1.35 - .35 * back(u, 2.2) : 1); };
  m.userData.at(-1);
  return m;
}
// near-plane curtain: two dark paper halves that meet at their front edges; k = 0 open .. 1 closed
export function curtain(S, col = '#0c0a14') {
  const cam = S.cam; S.scene.add(cam);
  const mk = side => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.2, .3), new THREE.MeshBasicMaterial({ color: col }));
    m.position.set(side * .1, 0, -.06); m.renderOrder = 20; cam.add(m); return m;
  };
  const L = mk(-1), R = mk(1);
  // at .06 m in front of a 30° lens the frame is ~.018 × .032 m: .03 of travel takes each half fully out of view
  return k => { const off = .03 * (1 - ss(k)); L.position.x = -.1 - off; R.position.x = .1 + off; L.visible = R.visible = k > .001; };
}
// switch a stack's light: f(layer index from the front) → 0..1; windows and moon separately
export function setLit(layers, f) {
  layers.forEach((m, i) => { const u = m.material.userData.u; if (!u) return; if (u.base === undefined) u.base = u.uTrans.value; u.uTrans.value = u.base * f(i, m); u.uGlowLit.value = f(i, m); });
}
