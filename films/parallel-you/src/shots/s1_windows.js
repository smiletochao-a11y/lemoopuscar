// S1–S2 · Two windows, one light: the near window and the far one hold the same figure doing the same thing.
// Already lit on the first frame; slow push; at HIT.sync both thumbs lift together; focus racks to the far window
// while the camera leans towards it; a near-plane curtain closes at the end.
import { stage, aim } from '../stage.js';
import { buildHome, pose, FAR_WIN } from '../home.js';
import { strip, curtain } from '../bits.js';
import { seg, ss, eio, lerp, clamp } from '../lib.js';

export function build(E) {
  const S = stage({ light: [-.075, .2, -.15], lightR: .22, lightCol: '#ffe2b0', key: 1.6, amb: .35, keyPos: [0, .5, .35], keyTarget: [0, -.02, -.08], fov: 30 });
  const H = buildHome(S);
  const title = strip(S, { s: '另一个你', size: .02, x: -.075, y: .2, z: -.03, font: '"MaShanZheng"', weight: 400 });
  const cur = curtain(S);
  const tSync = E.HIT.sync - E.T0, tRack = 4.4 - E.T0;
  return {
    S,
    update(t) {
      const th = Math.max(0, 1 - Math.abs(t - tSync) / .35) + Math.max(0, 1 - Math.abs(t - tSync - 1.8) / .35);
      for (const f of [H.nearRoom.fig, H.farRoom.fig]) pose(f, { bow: 1, thumb: th });
      title.userData.reveal(eio(seg(t, .3, 1.5)));
      const u = eio(clamp(t / E.dur)), r = eio(seg(t, tRack, tRack + 2.2));
      aim(S.cam, [lerp(0, FAR_WIN.x * .55, r), lerp(.0, FAR_WIN.y - .07, r), lerp(.9, .8, u) - .26 * r, lerp(0, FAR_WIN.x * .7, r), lerp(-.01, FAR_WIN.y - .05, r), -.1], t);
      cur(seg(t, E.dur - .6, E.dur));
    },
    post(t) {
      const r = ss(seg(t, tRack, tRack + 1.6));
      return { focus: S.cam.position.z - lerp(-.064, -.117, r), aper: 30, maxCoc: 14, bloom: { strength: .45, radius: .6, threshold: 1.0 } };
    },
    grade() { return { expo: 1.05, vig: .45 }; },
  };
}
