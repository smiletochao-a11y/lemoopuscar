// 《一锅饭的一生》 — 80s cel anime, vertical 1080×1920. A life plays like a videotape; when it runs out, it rewinds to the inn.
import { canvas, W, H } from './cel.js';
import { makePost } from './post.js';
import { DUR, SHOTS, shotAt, HIT, LINES } from './timeline.js';
import { makePlates, SH, REWIND } from './scenes.js';

const qs = new URLSearchParams(location.search);
const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H), [ovc, ov] = canvas(W, H);
const post = makePost(document.getElementById('gl'));
await document.fonts.load('900 60px "Noto Sans SC"', '一锅饭的一生进士榜'); await document.fonts.load('700 60px "Noto Sans SC"', '黄粱一梦卢生');
const A = makePlates();
let DURS = {}; try { const r = await fetch('voice/dur.json'); if (r.ok) DURS = await r.json(); } catch (x) { }
const SUBS = LINES.map((v, i) => { const d = DURS[v.id] ?? [...v.zh].length * .2, nx = LINES[i + 1]; let b = v.at + Math.max(1.8, d + .6); if (nx) b = Math.min(b, nx.at - .1); return { ...v, a: v.at, b }; });
window.SUBS = SUBS;
function wrap(s) { const out = []; let cur = ''; for (const ch of s) { cur += ch; const n = [...cur].length; if ((n >= 7 && '，、：；。？'.includes(ch)) || n >= 13) { out.push(cur); cur = ''; } } if (cur) out.push(cur); while (out.length > 1 && [...out[out.length - 1]].length <= 2) { const l = out.pop(); out[out.length - 1] += l; } return out; }
function subs(t) {
  ov.clearRect(0, 0, W, H);
  const v = SUBS.find(s => t >= s.a && t < s.b); if (!v) return;
  const L = wrap(v.zh.replace(/[。]$/, '')), y0 = H - 300 - (L.length - 1) * 74;
  ov.save(); ov.font = '700 60px "Noto Sans SC"'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  L.forEach((l, i) => { const y = y0 + i * 74; ov.shadowColor = 'rgba(0,0,0,.55)'; ov.shadowBlur = 10; ov.shadowOffsetY = 3; ov.strokeStyle = '#120a1e'; ov.lineWidth = 11; ov.strokeText(l, W / 2, y); ov.shadowColor = 'transparent'; ov.fillStyle = '#fff0a0'; ov.fillText(l, W / 2, y); });
  ov.restore();
}
function frameAt(t, extra = {}) {
  for (const x of [g, e]) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const [t0, t1, name] = shotAt(t);
  return SH[name]({ t, t0, lt: t - t0, u: (t - t0) / (t1 - t0), g, e, A, ...extra }) || {};
}
function render(t) {
  let over;
  if (t >= HIT.rew && t < 60) {          // rewind: earlier shots fly backwards, tracking noise, ◀◀
    const u = (t - HIT.rew) / 5, k = Math.min(REWIND.length - 1, Math.floor(Math.pow(u, .8) * REWIND.length));
    const S = SHOTS.find(s => s[2] === REWIND[k]), back = (Math.pow(u, .8) * REWIND.length - k);
    over = frameAt(S[1] - .05 - back * (S[1] - S[0]) * .95);
    SH.end.osd(g, '◀◀ 倒带', null);
    over = { ...over, track: .55 + .3 * Math.sin(t * 13), noiseA: .05 };
  } else over = frameAt(t);
  const fr = Math.round(t * 30);
  if (qs.get('nosub')) ov.clearRect(0, 0, W, H); else subs(t);
  const crt = { power: Math.min(1, t / .5) };
  post.render(sc, gc, fr, ovc, qs.get('raw') ? { bloom: 0, halo: 0, scan: 0, grille: 0, glow: 0, corner: 0, noiseA: 0, power: 1, track: 0 } : { ...crt, ...over });
}
window.render = render; window.DUR = DUR;
render(parseFloat(qs.get('t') ?? '24'));
window.READY = true;
