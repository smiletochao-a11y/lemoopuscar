// 《另一个你》 master: shots scheduled on the shared timeline (timeline.js), dissolves, the subtitle line, window.render(t).
// Vertical 1080×1920; every shot's camera is portrait (aspect 9/16).
import * as THREE from 'three';
import { Pipe } from './post.js';
import { dispose } from './stage.js';
import { ss, seg, clamp } from './lib.js';
import { SHOTS } from './shots/index.js';
import { DUR, HIT, LINES } from '../timeline.js';

const Q = new URLSearchParams(location.search), SSAA = +(Q.get('ssaa') || 1.5), W = 1080, H = 1920;
let dur = {}; try { dur = await (await fetch('voice/dur.json')).json(); } catch (e) { dur = {}; }
const C = {}; for (const L of LINES) C[L.id] = { at: L.t, dur: dur[L.id] ?? 2, end: L.t + (dur[L.id] ?? 2), text: L.zh };
window.DUR = DUR;

const plan = SHOTS(C, HIT, DUR);
plan.forEach((s, i) => { s.end = i + 1 < plan.length ? plan[i + 1].start : DUR; s.dur = s.end - s.start; });
window.PLAN = plan.map(s => [s.id, +s.start.toFixed(2), +s.end.toFixed(2)]);

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(SSAA); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const pipe = new Pipe(renderer, W, H, SSAA);
await Promise.all(['MaShanZheng', 'NotoSerifSC'].map(f => document.fonts.load(`600 40px ${f}`, '另一个你重复有限未知')));

const live = new Map();
async function get(i) {
  const p = plan[i];
  if (!live.has(i)) {
    const s = await p.build({ dur: p.dur, T0: p.start, C, HIT, cue: id => C[id].at - p.start, at: t => t - p.start });
    s.S.cam.aspect = W / H; s.S.cam.updateProjectionMatrix();
    live.set(i, s);
  }
  return live.get(i);
}
function gc(keep) { for (const [i, s] of live) if (!keep.includes(i)) { dispose(s.S.scene); live.delete(i); } }
async function drawShot(i, t, target) {
  const s = await get(i), tl = t - plan[i].start;
  s.update(tl);
  pipe.shot(s.S.scene, s.S.cam, s.post(tl), target);
  return s.grade(tl);
}
const sub = document.getElementById('sub');
if (new URLSearchParams(location.search).get('nosub')) sub.style.display = 'none';
function subtitle(t) {
  let txt = '', a = 0;
  LINES.forEach((L, i) => {
    const c = C[L.id], next = LINES[i + 1] ? LINES[i + 1].t : DUR;
    const t1 = Math.min(next - .1, Math.max(c.end + .6, c.at + 1.8));
    if (t > c.at - .15 && t < t1) { txt = L.zh; a = Math.min(ss(seg(t, c.at - .15, c.at + .05)), 1 - ss(seg(t, t1 - .2, t1))); }
  });
  let st = txt.replace(/[，。：—]+$/, '');
  if ([...st].length > 14) {   // two lines, split at the comma nearest the middle
    const cs = [...st.matchAll(/[，。：]/g)].map(m => m.index), mid = st.length / 2;
    const k = cs.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
    if (k !== undefined) st = st.slice(0, k) + '\n' + st.slice(k + 1);
  }
  sub.textContent = st.replace(/[，。：]/g, '　'); sub.style.opacity = a;
}
window.render = async (t) => {
  let i = plan.findIndex(p => t >= p.start && t < p.end); if (i < 0) i = plan.length - 1;
  const p = plan[i], tl = t - p.start, tr = p.in || { type: 'cut', dur: 0 };
  let mixB = 0, g;
  if (i > 0 && tr.type !== 'cut' && tl < tr.dur) {
    await drawShot(i - 1, t, pipe.rtA);
    g = await drawShot(i, t, pipe.rtB);
    mixB = (tr.ease || ss)(tl / tr.dur);
    gc([i - 1, i]);
  } else { g = await drawShot(i, t, pipe.rtA); gc([i]); }
  pipe.final({ ...g, mixB, mode: tr.type === 'iris' ? 1 : 0, center: tr.center, time: t, fade: (g.fade ?? 1) * ss(clamp(t / .25)) });
  subtitle(t);
};
window.EV = plan.flatMap(s => (s.sfx || []));
window.READY = true;
