// S9 · Lights on again, both figures lift their heads towards us; the camera pulls out of the box: the paper lamp on a
// bedside table in a dark room, its warm spill on the wood, a phone beside it whose screen lights up.
import * as THREE from 'three';
import { stage, aim } from '../stage.js';
import { buildHome, pose, BOX } from '../home.js';
import { setLit } from '../bits.js';
import { setMoon } from '../paper.js';
import { seg, ss, eio, eo, lerp, clamp } from '../lib.js';

function room(S) {
  const g = new THREE.Group(); S.scene.add(g);
  const wood = new THREE.MeshStandardMaterial({ color: '#3b2414', roughness: .55 });
  const fw = .025, D = BOX.d + .03, W = BOX.w, H = BOX.h;
  // the box: a frame around the cavity, a back panel, black lining inside
  for (const [w, h, x, y] of [[W + 2 * fw, fw, 0, H / 2 + fw / 2], [W + 2 * fw, fw, 0, -H / 2 - fw / 2], [fw, H, -W / 2 - fw / 2, 0], [fw, H, W / 2 + fw / 2, 0]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, D), wood); m.position.set(x, y, -D / 2 + .005); m.castShadow = m.receiveShadow = true; g.add(m);
  }
  const back = new THREE.Mesh(new THREE.BoxGeometry(W + 2 * fw, H + 2 * fw, .01), wood); back.position.set(0, 0, -D - .0); g.add(back);
  // the bedside table, the wall
  const table = new THREE.Mesh(new THREE.BoxGeometry(.9, .03, .5), new THREE.MeshStandardMaterial({ color: '#4a2e1a', roughness: .45 }));
  table.position.set(0, -H / 2 - fw - .015, -.05); table.receiveShadow = true; g.add(table);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.MeshStandardMaterial({ color: '#1c140e', roughness: .95 })); wall.position.set(0, .4, -.32); wall.receiveShadow = true; g.add(wall);
  // the phone on the table, screen up, tilted towards us
  const phone = new THREE.Group(); phone.position.set(.2, -H / 2 - fw + .006, .08); phone.rotation.set(-Math.PI / 2 + .12, 0, -.35); g.add(phone);
  phone.add(new THREE.Mesh(new THREE.BoxGeometry(.075, .155, .008), new THREE.MeshStandardMaterial({ color: '#0c0c10', roughness: .3, metalness: .2 })));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.068, .146), new THREE.MeshBasicMaterial({ color: '#000' })); scr.position.z = .0045; phone.add(scr);
  // spill: the lamp's warm light falling forward onto the table, plus a little room fill
  const spill = new THREE.SpotLight('#ffc98a', 0, 1.6, .9, .8, 1.5); spill.position.set(0, 0, .02); spill.target.position.set(0, -.4, .6); g.add(spill, spill.target);
  const fill = new THREE.HemisphereLight('#3a3040', '#120c08', 0); g.add(fill);
  const glow = new THREE.PointLight('#9fd8ff', 0, .5, 2); glow.position.set(.2, -H / 2 - fw + .06, .1); g.add(glow);
  return { g, scr, spill, fill, glow };
}

export function build(E) {
  const S = stage({ light: [-.075, .2, -.15], lightR: .22, lightCol: '#ffe2b0', key: 1.6, amb: .35, keyPos: [0, .5, .35], keyTarget: [0, -.02, -.08], fov: 30 });
  const H = buildHome(S), Rm = room(S);
  const order = [...S.layers].sort((a, b) => a.position.z - b.position.z);   // back first: the light comes back from behind
  const tOn = E.HIT.flood - E.T0, tLook = E.HIT.look - E.T0, tOut = E.HIT.look - E.T0 + .4, tPhone = E.HIT.send - E.T0;
  return {
    S,
    update(t) {
      const lk = eio(seg(t, tLook, tLook + .7));
      for (const f of [H.nearRoom.fig, H.farRoom.fig]) pose(f, { bow: 1 - lk, look: lk });
      setLit(order, (i) => ss(seg(t, tOn + Math.min(i, 30) * .03, tOn + Math.min(i, 30) * .03 + .5)));
      setMoon(H.mn, ss(seg(t, tOn - .2, tOn + .5)));
      const on = ss(seg(t, tOn - .2, tOn + .6));
      S.key.intensity = 1.6 * on; S.amb.intensity = .35 * on;
      Rm.spill.intensity = 5 * on; Rm.fill.intensity = .25 * on;
      const ph = ss(seg(t, tPhone, tPhone + .3)); Rm.scr.material.color.set('#9fd8ff').multiplyScalar(1.4 * ph); Rm.glow.intensity = .25 * ph;
      const u = eio(seg(t, tOut, E.dur - .3));
      aim(S.cam, [lerp(0, .05, u), lerp(-.005, .0, u), lerp(.84, 1.5, u), 0, lerp(-.02, -.1, u), -.08], t, { hand: lerp(.0006, .002, u) });
    },
    post(t) { const u = eio(seg(t, tOut, E.dur - .3)); return { focus: S.cam.position.z - lerp(-.064, .0, u), aper: lerp(26, 18, u), maxCoc: 12, bloom: { strength: .45, radius: .6, threshold: 1.0 } }; },
    grade(t) { return { expo: 1.05, vig: .5, fade: ss(seg(t, tOn - .25, tOn + .3)) }; },
  };
}
