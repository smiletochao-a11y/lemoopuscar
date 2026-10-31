// S8 · The premise: the same two windows; a strip "宇宙无限？" writes itself; the lights go out layer by layer from the
// front to the back (windows, then the moon); the seal "未知" lands on "还没人知道"; then darkness, only the room tone.
import { stage, aim } from '../stage.js';
import { buildHome, pose } from '../home.js';
import { strip, seal, setLit } from '../bits.js';
import { setMoon } from '../paper.js';
import { seg, ss, eio, lerp, clamp } from '../lib.js';

export function build(E) {
  const S = stage({ light: [-.075, .2, -.15], lightR: .22, lightCol: '#ffe2b0', key: 1.6, amb: .35, keyPos: [0, .5, .35], keyTarget: [0, -.02, -.08], fov: 30 });
  const H = buildHome(S);
  const q = strip(S, { s: '宇宙无限？', size: .018, x: -.075, y: .075, z: -.03 });
  const sl = seal(S, { s: '未知', x: .085, y: .085, z: -.026, size: .05, t0: E.C.v17.at - E.T0 + .9 });
  const tOff = E.HIT.drop1 - E.T0, tDark = E.HIT.flood - E.T0 - .35;
  // layers sorted by depth, front first: they go dark in that order, one step every .45 s
  const order = [...S.layers].sort((a, b) => b.position.z - a.position.z);
  return {
    S,
    update(t) {
      for (const f of [H.nearRoom.fig, H.farRoom.fig]) pose(f, { bow: 1 });
      q.userData.reveal(eio(seg(t, .3, 1.3)));
      sl.userData.at(t);
      setLit(order, (i, m) => 1 - ss(seg(t, tOff + Math.min(i, 30) * .06, tOff + Math.min(i, 30) * .06 + .5)));
      setMoon(H.mn, 1 - ss(seg(t, tOff + 2.2, tOff + 3.0)));
      const dark = ss(seg(t, tDark - .6, tDark));
      S.key.intensity = 1.6 * (1 - .85 * ss(seg(t, tOff + 2.4, tDark - .3))) * (1 - dark); S.amb.intensity = .35 * (1 - .9 * ss(seg(t, tOff, tDark)));
      aim(S.cam, [0, 0, lerp(.86, .84, clamp(t / E.dur)), 0, -.005, -.08], t);
    },
    post() { return { focus: S.cam.position.z + .05, aper: 26, maxCoc: 12, bloom: { strength: .45, radius: .6, threshold: 1.0 } }; },
    grade(t) { return { expo: 1.05, vig: .5, fade: 1 - ss(seg(t, tDark - .5, tDark)) }; },
  };
}
