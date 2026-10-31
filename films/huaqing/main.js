import { makeComp, layerSet } from './comp.js';
import { DUR, LINES } from './timeline.js';
import * as S from './shots.js';
import { clamp } from '/core/lib.js';
const q = new URLSearchParams(location.search);
const comp = makeComp(document.getElementById('c'));
const A = layerSet(1080, 1920), B = layerSet(1080, 1920), TMP = layerSet(1080, 1920);
await document.fonts.load('500 40px NotoSerifSC', '华'); await document.fonts.load('600 40px NotoSerifSC', '0'); await document.fonts.load('40px MaShanZheng', '华');
const NOSUB = q.has('nosub');
let DURS = {}; try { DURS = await (await fetch('voice/dur.json')).json(); } catch (e) {}
S.init();
// subtitle windows: from the line start to max(start + 1.8, end + .6), cut .1 before the next line
const SUBS = LINES.map((v, i) => { const d = DURS[v.id] ?? [...v.zh].length * .21; const next = LINES[i + 1]?.at ?? DUR; return { ...v, a: v.at, b: Math.min(next - .1, Math.max(v.at + 1.8, v.at + d + .6)) }; });
const wrap = s => { if ([...s].length <= 14) return s; const m = [...s].length / 2; let best = -1, bd = 1e9; [...s].forEach((ch, i) => { if ('，、：'.includes(ch) && Math.abs(i - m) < bd) { bd = Math.abs(i - m); best = i; } }); return best < 0 ? s : [...s].slice(0, best + 1).join('') + '\n' + [...s].slice(best + 1).join(''); };
window.DUR = DUR;
const TEST = q.get('test');
if (TEST) {
  const art = await import('./art.js');
  window.render = t => {
    A.clear(); B.clear(); A.xf(1, 0, 0);
    if (TEST === 'lady') {
      art.lady(A.ink, { x: 300, y: 860, s: 9, t: 0, seed: 21 });
      art.lady(A.ink, { x: 760, y: 860, s: 9, t: 0, arm: 1, seed: 21 });
      art.lady(A.ink, { x: 300, y: 1780, s: 9, t: 0, look: 1, seed: 21 });
      art.lady(A.ink, { x: 760, y: 1780, s: 9, t: .4, look: .5, laugh: 1, flip: -1, seed: 21 });
    } else if (TEST === 'fan') art.writeFan(A, TMP, 190, 470, 700, t * 4);
    else if (TEST === 'horse') { art.horse(A.ink, 540, 700, 7, t * 3, { dir: -1, dust: 1 }); art.dancer(A.ink, 540, 1700, 7, t * 2.4, 1, 41); }
    comp(A, B, {});
  };
  window.READY = true;
} else
window.render = t => {
  A.clear(); B.clear();
  const o = S.frame(t, A, B, TMP) || {};
  if (!NOSUB) for (const v of SUBS) {
    if (t < v.a || t > v.b) continue;
    const k = Math.min(clamp((t - v.a) / .3), clamp((v.b - t) / .35)), p = S.SUBPOS[v.id] || [150, 1700];
    S.sub(o._inB ? B : A, wrap(v.zh.replace(/[。]$/, '')), p[0], p[1], k, { size: p[2] || 50 });
  }
  comp(A, B, o);
};
window.READY = true;
