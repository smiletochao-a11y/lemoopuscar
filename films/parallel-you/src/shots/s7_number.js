// S7 · The number: strips write out "最近的另一个你，在" and 10^(10^29) 米 on their words; then a long strip of zeros
// runs across the whole box while a counter strip grows to "106 亿光年". Night sky, clouds and far hills behind.
import * as THREE from 'three';
import { sheet, skyPanel, moon } from '../paper.js';
import { xiangyun, karst } from '../art.js';
import { stage, aim } from '../stage.js';
import { strip, liveStrip, CREAM, GOLD, INK } from '../bits.js';
import { seg, ss, eio, eo, lerp, clamp, mulberry } from '../lib.js';

export function build(E) {
  const S = stage({ light: [.06, .21, -.15], lightR: .24, lightCol: '#ffe2b0', key: 1.5, amb: .35, keyPos: [0, .5, .35], keyTarget: [0, .02, -.08], fov: 30 });
  const U = S.U, R = mulberry(5);
  S.add(skyPanel({ w: .328, h: .558, z: -.155, stops: [[0, '#0b1534'], [.6, '#1b2c5c'], [1, '#33497c']], stars: 180, seed: 5, ppm: 2400 }));
  S.add(moon({ x: .085, y: .215, z: -.15, r: .02, gain: 1.8, halo: 5, haloGain: .35 }));
  S.add(sheet({ U, w: .328, h: .3, y: .1, z: -.135, trans: .85, draw: x => { x.fillStyle = '#c3cbe8'; xiangyun(x, -.09, .06, .024, 1); xiangyun(x, .1, -.05, .02, -1); } }));
  const hills = S.add(sheet({ U, w: .9, h: .25, y: -.17, z: -.11, trans: .65, ppm: 3000, draw: x => { x.fillStyle = '#6f8cc8'; const pk = []; for (let u = -.45; u < .45; u += .05 + R() * .03) pk.push([u, .02 + R() * .05, .025]); karst(x, { x0: -.45, x1: .45, base: -.03, peaks: pk, carve: .0006 }); x.fillRect(-.45, -.125, .9, .095); } }));
  hills.material.map.wrapS = THREE.RepeatWrapping;
  const hills2 = S.add(sheet({ U, w: .9, h: .2, y: -.21, z: -.08, trans: .35, ppm: 3000, draw: x => { x.fillStyle = '#3a5288'; const pk = []; for (let u = -.45; u < .45; u += .06 + R() * .04) pk.push([u, .01 + R() * .03, .03]); karst(x, { x0: -.45, x1: .45, base: -.02, peaks: pk, carve: .0006 }); x.fillRect(-.45, -.1, .9, .08); } }));
  hills2.material.map.wrapS = THREE.RepeatWrapping;
  // the strips
  const z = -.045, t = id => E.C[id].at - E.T0;
  const lead = strip(S, { s: '最近的另一个你，在', size: .013, x: 0, y: .205, z });
  const base = strip(S, { s: '10', size: .05, w: .07, h: .07, x: -.062, y: .085, z, paper: GOLD });
  const exp1 = strip(S, { s: '10', size: .024, w: .038, h: .034, x: -.004, y: .128, z: z + .002, paper: GOLD });
  const exp2 = strip(S, { s: '29', size: .014, w: .024, h: .022, x: .029, y: .153, z: z + .004, paper: GOLD });
  const unit = strip(S, { s: '米', size: .026, w: .038, h: .038, x: .07, y: .072, z, paper: CREAM });
  // the zeros: one long strip whose texture scrolls (a repeat of "0"s), and the counter
  const zeros = S.add(sheet({ U, w: .34, h: .03, y: .025, z: z + .006, trans: .3, recv: false, ppm: 6000, draw: x => { x.fillStyle = CREAM; x.fillRect(-.17, -.015, .34, .03); x.fillStyle = INK; x.font = '600 21px NotoSerifSC'; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let i = 0; i < 20; i++) { x.save(); x.translate(-.161 + i * .017, -.0005); x.scale(.001, -.001); x.fillText('0', 0, 0); x.restore(); } } }));
  zeros.material.map.wrapS = THREE.RepeatWrapping;
  const counter = liveStrip(S, { s: '已写 0 亿光年', size: .013, w: .15, x: 0, y: -.018, z });
  const tZ = E.HIT.zeros - E.T0, tLY = E.HIT.ly - E.T0;
  return {
    S,
    update(tt) {
      lead.userData.reveal(eio(seg(tt, t('v13') - .1, t('v13') + .9)));
      base.userData.reveal(eio(seg(tt, t('v14') + .5, t('v14') + .9)));            // on 「1」 (whisper word times)
      exp1.userData.reveal(eio(seg(tt, t('v14') + 1.78, t('v14') + 2.08)));        // 「10」
      exp2.userData.reveal(eio(seg(tt, t('v14') + 2.32, t('v14') + 2.6)));         // 「29」
      unit.userData.reveal(eio(seg(tt, t('v14') + 4.44, t('v14') + 4.74)));        // 「米」
      const zr = eo(seg(tt, tZ, tZ + .6)); zeros.scale.x = Math.max(.001, zr); zeros.visible = zr > .01;
      zeros.material.map.offset.x = Math.max(0, tt - tZ) * 1.6;
      const v = Math.round(106 * Math.pow(clamp((tt - tZ) / (tLY - tZ)), 2.4));
      counter.visible = tt > tZ; counter.userData.set('已写 ' + v + ' 亿光年', v >= 106 ? '#8a2a1a' : undefined);
      // lateral travel after the zeros start: layers move at speeds by depth
      const pan = Math.max(0, tt - tZ);
      hills.material.map.offset.x = pan * .01; hills2.material.map.offset.x = pan * .025;
      const u = eio(clamp(tt / E.dur));
      aim(S.cam, [lerp(-.01, .01, u), lerp(.04, .03, u), lerp(.8, .7, u), 0, .04, -.07], tt);
    },
    post() { return { focus: S.cam.position.z + .045, aper: 22, maxCoc: 12, bloom: { strength: .45, radius: .6, threshold: 1.0 } }; },
    grade() { return { expo: 1.05, vig: .45 }; },
  };
}
