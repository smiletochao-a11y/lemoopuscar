// 《一锅饭的一生》 — a shadow-puppet film after 沈既济《枕中记》. Vertical 1080×1920.
// The cloth: a dream (above a band of carved clouds) and the inn (below), where the sleeper lies and the pot steams like a clock.
import { makeGL } from './gl.js';
import { canvas, DYE, piece, fill, cut, ink, within, meander, cloud, coin } from './carve.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, vnoise } from '/core/lib.js';
import { drawPuppet, drawRods, CH } from './puppet.js';
import { buildProps, dp } from './props.js';
import { silhouette, fistHand, pinchHand, lampBody, flame, smoke } from './backstage.js';
import { DUR, SH, HIT, LINES } from './timeline.js';

const qs = new URLSearchParams(location.search);
const W = 1080, H = 1920;
const [trc, tr] = canvas(W, H), [frc, fr] = canvas(W, H);
const GL = makeGL(document.getElementById('gl'));
await document.fonts.load('600 40px NotoSerifSC', '说'); await document.fonts.load('400 40px "Ma Shan Zheng"', '一锅饭的生客店金榜进士及第');
const PR = buildProps();
let DURS = {}; try { const r = await fetch('voice/dur.json'); if (r.ok) DURS = await r.json(); } catch (e) { }
const E = (t, a, b) => ss(seg(t, a, b));
const tremor = (t, k = 1, sd = 0) => [(vnoise(t * 2.1 + sd) - .5) * 3 * k, (vnoise(t * 2.7 + 9 + sd) - .5) * 2.4 * k, (vnoise(t * 1.7 + 4 + sd) - .5) * .02 * k];

// ---------------- layout (cloth coordinates) ----------------
const FLOOR = 1830, BENCH_Y = 1700, STOVE = [850, 1600], CLOUD_Y = 1390, DREAM_FLOOR = 1290;
const LAMP0 = [540, 1520];
const DLAMPS = [[300, 420], [780, 420], [540, 260], [200, 800], [880, 800], [540, 640]];

// ---------------- title plaque (cut-out letters) ----------------
const TITLE = piece([-420, -150, 420, 150], g => {
  const B = q => { q.rect(-400, -130, 800, 260); };
  fill(g, '#3a1a10', B);
  const band = q => { q.rect(-400, -130, 800, 260); q.rect(-374, -104, 748, 208); };
  fill(g, DYE.red, band); within(g, band, () => { meander(g, -380, -112, 380, 5, 1.6); meander(g, -380, 122, 380, 5, 1.6); });
  for (const [x, y] of [[-387, -117], [387, -117], [-387, 117], [387, 117]]) { fill(g, DYE.green, q => q.arc(x, y, 20, 0, 7)); cloud(g, x, y, 12, 0, 2, 1); ink(g, 2, q => q.arc(x, y, 20, 0, 7)); }
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '400 118px "Ma Shan Zheng"'; g.fillText('一锅饭的一生', 0, -6); g.font = '400 34px "Ma Shan Zheng"'; g.fillText('黄 粱 一 梦', 0, 84); g.restore();
  ink(g, 2.4, B);
}, { ss: 2, seed: 99 });

// ---------------- lamps: the count is his fortune ----------------
function dreamLit(t) {           // how many dream lamps are lit (fractional)
  if (t < HIT.flash) return 0;
  const k = [[HIT.flash, 0], [HIT.flash + .4, 2], [HIT.bang, 2], [HIT.bang + .3, 3], [HIT.robe2, 3], [HIT.robe2 + .3, 4], [HIT.snuff1, 4], [HIT.snuff1 + .4, 2], [HIT.back1, 2], [HIT.back2, 4], [HIT.hush, 4], [HIT.bars, 1], [SH.s9, 1], [HIT.crown, 4], [HIT.crown + .3, 5], [HIT.sons, 5], [HIT.sons + .3, 6], [HIT.out0, 6], [HIT.dark, 0]];
  for (let i = 0; i < k.length - 1; i++) if (t >= k[i][0] && t < k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], ss((t - k[i][0]) / (k[i + 1][0] - k[i][0])));
  return t >= HIT.dark && t < SH.s12 ? 0 : 0;
}
function lampsAt(t) {
  const fl = k => 1 + .06 * (vnoise(t * 7 + k * 13) - .5) * 2 + .03 * Math.sin(t * 23 + k);
  const L = [];
  // lamp 0: the inn's lamp; dims during the dream, out at the backstage, carried away at the end
  let i0 = 1;
  if (t < HIT.clap + .1) i0 = 0; else if (t < HIT.clap + .5) i0 = eo(seg(t, HIT.clap + .1, HIT.clap + .5)) * 1.3;
  if (t > HIT.flash && t < SH.s12) i0 = .45;
  if (t > HIT.out0 && t < SH.s12) i0 = .45 * (1 - E(t, HIT.out0 + 2.6, HIT.dark));
  if (t >= SH.s12) i0 = E(t, SH.s12, SH.s12 + .4);
  let x0 = LAMP0[0];
  if (t > HIT.leave) { x0 = lerp(LAMP0[0], -300, ei(seg(t, HIT.leave + .6, DUR - .4))); i0 *= 1 - .7 * E(t, HIT.leave + 1.5, DUR); }
  L.push([x0, LAMP0[1], i0 * fl(0), 1]);
  const n = dreamLit(t);
  DLAMPS.forEach((p, k) => { let I = clamp(n - k); if (t > HIT.out0 && t < HIT.dark) I *= 1 - seg(t, HIT.out0 + (5 - k) * .55, HIT.out0 + (5 - k) * .55 + .4); if (I > 0) L.push([p[0], p[1], I * fl(k + 1), .9]); });
  return L;
}

// ---------------- the inn (below the cloud band) ----------------
function inn(C, t, o = {}) {
  dp(tr, C, PR.door, 120, FLOOR, 1, 0);
  dp(tr, C, PR.stove, STOVE[0], STOVE[1], 1, 0);
  dp(tr, C, PR.fire[Math.floor(t * 12) % 3], STOVE[0], STOVE[1] + 218, .8, 0);
  // the pot; steam grows through the dream (the clock)
  const lidUp = o.lid || 0;
  dp(tr, C, PR.pot, STOVE[0], STOVE[1] - 4, 1, 0);
  if (lidUp > 0) dp(tr, C, PR.millet, STOVE[0], STOVE[1] - 44, 1, 0);
  dp(tr, C, PR.lid, STOVE[0] + lidUp * 120, STOVE[1] - 48 - lidUp * 150, 1, lidUp * .5);
  const sk = o.steam ?? 1; if (sk > 0) dp(tr, C, PR.steam[Math.floor(t * 12) % 3], STOVE[0] - 10, STOVE[1] - 60, .55 + .45 * sk, 0, { alpha: clamp(sk * 1.4) });
  dp(tr, C, PR.bench, 470, BENCH_Y, 1, 0);
}

// ---------------- puppet helpers ----------------
function P(c, pose, t, C, opt = {}) {
  const [dx, dy, dr] = tremor(t, opt.tens || 1, opt.sd || 0);
  const r = drawPuppet(tr, C, CH[c], { ...pose, x: pose.x + dx, y: pose.y + dy, rot: (pose.rot || 0) + dr }, opt);
  if (!opt.noRods) { const k = Math.hypot(C[0], C[1]); drawRods(tr, r.rods, r.rods.map((q, j) => [q[0] - (60 - j * 30) * k * (pose.flip || 1), q[1] + 900 * k]), 2.2 * k, .5); }
  return r;
}
// press on (arrive large and blurred, snap sharp) / lift off (grow, blur, fade)
const press = (t, t0, d = .5) => { const u = eo(seg(t, t0, t0 + d)); return { s: 1 + (1 - u) * 1.4, blur: (1 - u) * 26, alpha: .3 + .7 * u, on: t >= t0 }; };
const lift = (t, t0, d = .9) => { const u = seg(t, t0, t0 + d); return { s: 1 + ei(u) * .9, blur: u * 30, alpha: 1 - ei(u), gone: u >= 1 }; };
function PP(c, pose, t, C, t0, t1, opt = {}) {    // a puppet that presses on at t0 and lifts off at t1
  if (t < t0 || (t1 != null && t > t1 + .9)) return null;
  const a = press(t, t0), b = t1 != null && t > t1 ? lift(t, t1) : { s: 1, blur: 0, alpha: 1 };
  const k = a.s * b.s, bl = a.blur + b.blur, al = a.alpha * b.alpha;
  return P(c, { ...pose, s: (pose.s || 1) * k }, t, C, { ...opt, blur: bl > .5 ? bl : 0, alpha: al, noRods: bl > 4 || opt.noRods });
}
function prop(pc, x, y, s, t, t0, t1, rot = 0, C) {
  if (t < t0 || (t1 != null && t > t1 + .9)) return;
  const a = press(t, t0), b = t1 != null && t > t1 ? lift(t, t1) : { s: 1, blur: 0, alpha: 1 };
  dp(tr, C, pc, x, y, s * a.s * b.s, rot, { blur: a.blur + b.blur > .5 ? a.blur + b.blur : 0, alpha: a.alpha * b.alpha });
}

// ---------------- the dream (above the clouds) ----------------
function dream(C, t) {
  const hip = DREAM_FLOOR - 196;
  // wedding (19–22.6)
  prop(PR.sedan, 800, DREAM_FLOOR - 10, 1.1, t, HIT.wed, HIT.bang - .2, 0, C);
  for (const [x, y] of [[180, 360], [900, 330]]) prop(PR.lantern, x, y, 1.2, t, HIT.wed + .2, HIT.bang - .2, Math.sin(t * 1.4 + x) * .05, C);
  PP('bride', { x: 560, y: hip, flip: -1, a1: -.1, a2: -.9, head: .06 }, t, C, HIT.wed + .3, HIT.bang - .2, { sd: 3 });
  // the groom: hide robe → official robes by piece swap; lifted at the slander, pressed again
  const groom = t < HIT.robe1 ? 'luGreen' : t < HIT.snuff1 ? 'luRed' : t < HIT.back2 ? 'luRed' : 'luRed';
  if (t >= HIT.wed && t < HIT.exile + .9) {
    const cheer = t > HIT.bang ? E(t, HIT.bang + .1, HIT.bang + .4) * (1 - E(t, HIT.robe1 - .3, HIT.robe1)) : 0;
    const bowd = t > HIT.rival ? E(t, HIT.rival + .6, HIT.snuff1) : 0;
    const swap = t >= HIT.robe1 && t < HIT.robe1 + .12 ? .92 : 1;
    PP(groom, { x: 330, y: hip, s: swap, a1: lerp(.25, -2.3, cheer), a2: lerp(-.5, -2.9, cheer), aB: lerp(.15, -.6, cheer), head: lerp(-.1 * cheer, .3, bowd), rot: .06 * bowd }, t, C, HIT.wed, HIT.exile, { sd: 1, tens: 1 + bowd });
  }
  prop(PR.bang, 560, 500, 1.15, t, HIT.bang, HIT.robe2 + .8, 0, C);
  prop(PR.hall, 540, DREAM_FLOOR - 260, 1.05, t, HIT.robe2, HIT.hush - .1, 0, C);
  // the rival leans in to whisper
  if (t > HIT.rival - .1 && t < HIT.exile + 1) PP('rival', { x: lerp(-120, 170, eo(seg(t, HIT.rival, HIT.rival + .8))), y: hip, flip: 1, a1: -1.2, a2: -1.9, head: .12, rot: .1 }, t, C, HIT.rival, HIT.exile, { sd: 5 });
  // back again (31–35): the official returns, higher and grander
  if (t >= HIT.back1 && t < HIT.hush + .9) PP('luRed', { x: lerp(820, 480, eo(seg(t, HIT.back1, HIT.back2))), y: hip, flip: 1, a1: -.4, a2: -1.2, head: -.08, step: (t - HIT.back1) * 1.4 * (t < HIT.back2 ? 1 : 0) }, t, C, HIT.back1, HIT.hush, { sd: 1 });
  // prison (36–42): bars, the knife, Lady Cui grabs his arm; freeze
  prop(PR.bars, 540, 860, 1.25, t, HIT.bars, SH.s9 - .1, 0, C);
  if (t >= HIT.bars && t < SH.s9 + .8) {
    const draw = E(t, HIT.knife - .6, HIT.knife), stop = E(t, HIT.stop - .25, HIT.stop);
    const r = PP('luPrison', { x: 600, y: hip + 30, flip: -1, a1: lerp(.2, -1.9, draw) + .5 * stop, a2: lerp(-.4, -3.4, draw) + .6 * stop, head: lerp(.25, -.15, draw), rot: -.05 }, t, C, HIT.bars + .2, SH.s9, { sd: 1, tens: 1 + 1.6 * draw * (1 - stop) });
    if (r && draw > 0) dp(tr, C, PR.knife, r.hand[0] / 1 - 0, 0, 0, 0, { alpha: 0 });
    if (r && draw > 0) { const hc = [(r.hand[0] - C[4]) / C[0], (r.hand[1] - C[5]) / C[3]]; dp(tr, C, PR.knife, hc[0], hc[1], .9, lerp(1.7, 2.9, draw) - .5 * stop, { flip: 1 }); }
    if (t > HIT.knife) PP('cui', { x: lerp(-100, 420, eo(seg(t, HIT.knife, HIT.stop))), y: hip, flip: 1, a1: -1.4, a2: -1.6, aB: -1.1, head: -.12, rot: .14 }, t, C, HIT.knife, SH.s9, { sd: 7, tens: 2 });
  }
  // the peak (42–50): crown, hall and lanterns, sons and grandchildren, old age, lying down
  if (t >= HIT.crown - .2 && t < HIT.dark) {
    prop(PR.hall, 540, DREAM_FLOOR - 300, 1.15, t, HIT.crown, HIT.out0 + 1.5, 0, C);
    for (const [x, y] of [[120, 300], [380, 220], [700, 220], [960, 300]]) prop(PR.lantern, x, y, 1.1, t, HIT.crown + .2, HIT.out0 + 1.5, Math.sin(t * 1.4 + x) * .05, C);
    const old = t > HIT.old, lie = E(t, HIT.lie, HIT.lie + .9);
    if (lie > 0) prop(PR.bed, 560, DREAM_FLOOR - 70, 1, t, HIT.lie - .2, HIT.dark - .8, 0, C);
    PP(old ? 'luOld' : 'luCrown', { x: lerp(540, 600, lie), y: lerp(hip, DREAM_FLOOR - 120, lie), s: lerp(1.05, .95, lie), flip: 1, rot: lerp(0, -Math.PI / 2 + .1, lie), a1: -.3, a2: -.9, head: old ? .25 : -.1 }, t, C, HIT.crown, HIT.dark - .8, { sd: 1 });
    for (let i = 0; i < 3; i++) PP('son', { x: 140 + i * 120, y: DREAM_FLOOR - 196 * .62, s: .62, flip: 1, a1: -.9, a2: -1.5, head: .1 }, t, C, HIT.sons + i * .35, HIT.dark - .8, { sd: 10 + i });
    for (let i = 0; i < 2; i++) PP('son', { x: 820 + i * 110, y: DREAM_FLOOR - 196 * .62, s: .62, flip: -1, a1: -.9, a2: -1.5, head: .1 }, t, C, HIT.sons + (3 + i) * .35, HIT.dark - .8, { sd: 20 + i });
    for (let i = 0; i < 4; i++) PP('kid', { x: 240 + i * 200, y: DREAM_FLOOR - 196 * .42 + 30, s: .42, flip: i % 2 ? -1 : 1, a1: -1.6, a2: -2.2, head: -.1 }, t, C, HIT.kids + i * .25, HIT.dark - .8, { sd: 30 + i, noRods: true });
  }
}

// ---------------- the stage frame (when the camera pulls back) and the storyteller's placard ----------------
function drawFrame(C, spill = 1) {
  fr.save(); fr.setTransform(C[0], 0, 0, C[3], C[4], C[5]);
  const lac = '#2a0d08', gold = '#8a6430';
  fr.fillStyle = lac; fr.fillRect(-400, -500, 1880, 500); fr.fillRect(-400, 1920, 1880, 500); fr.fillRect(-400, -500, 400, 2920); fr.fillRect(1080, -500, 400, 2920);
  fr.fillStyle = '#5a170d'; fr.fillRect(-300, -60, 1680, 40); fr.fillRect(-300, 1920, 1680, 40);
  fr.strokeStyle = gold; fr.lineWidth = 3; fr.strokeRect(-60, -60, 1200, 2040);
  fr.globalCompositeOperation = 'lighter';
  const sp = (x0, y0, w, h, gx0, gy0, gx1, gy1) => { const gr = fr.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, `rgba(255,170,90,${.3 * spill})`); gr.addColorStop(1, 'rgba(255,150,70,0)'); fr.fillStyle = gr; fr.fillRect(x0, y0, w, h); };
  sp(-100, -120, 1280, 120, 0, 0, 0, -120); sp(-100, 1920, 1280, 120, 0, 1920, 0, 2040); sp(-120, 0, 120, 1920, 0, 0, -120, 0); sp(1080, 0, 120, 1920, 1080, 0, 1200, 0);
  fr.restore();
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function wrap(s) { const out = []; let cur = ''; for (const ch of s) { cur += ch; const n = [...cur].length; if ((n >= 8 && '，、：；。'.includes(ch)) || n >= 15) { out.push(cur); cur = ''; } } if (cur) out.push(cur); while (out.length > 1 && [...out[out.length - 1]].length <= 2) { const l = out.pop(); out[out.length - 1] += l; } return out; }
function placard(text, a, slide, cy) {
  if (a <= 0) return;
  const g = fr, lines = wrap(text.replace(/[。]$/, '')), size = 48;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.font = `600 ${size}px NotoSerifSC`;
  const tw = Math.max(...lines.map(l => g.measureText(l).width)), seal = 50, padL = 22, padR = 34, gap = 18;
  const w = padL + seal + gap + tw + padR, h = 40 + lines.length * size * 1.3, x = 540 - w / 2, y = cy - h / 2 + slide * 18;
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 18; g.shadowOffsetY = 4;
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(46,22,14,.94)'); gr.addColorStop(1, 'rgba(22,10,7,.94)');
  g.fillStyle = gr; rr(g, x, y, w, h, 6); g.fill(); g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(168,129,63,.8)'; g.lineWidth = 1.5; rr(g, x + 6, y + 6, w - 12, h - 12, 3); g.stroke();
  const sx = x + padL, sy = y + (h - seal) / 2;
  g.fillStyle = '#b3261b'; rr(g, sx, sy, seal, seal, 4); g.fill();
  g.font = '400 36px "Ma Shan Zheng"'; g.fillStyle = '#f6dcc0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('说', sx + seal / 2, sy + seal / 2 + 2);
  g.font = `600 ${size}px NotoSerifSC`; g.fillStyle = '#f3e2bf'; g.textAlign = 'left';
  lines.forEach((l, i) => g.fillText(l, sx + seal + gap, y + 20 + size * 1.3 * (i + .5)));
  g.restore();
}
const SUBS = LINES.map((v, i) => { const d = DURS[v.id] ?? [...v.zh].length * .2, nxt = LINES[i + 1]; let t1 = v.at + Math.max(1.8, d + .6); if (nxt) t1 = Math.min(t1, nxt.at - .1); return { ...v, t0: v.at, t1 }; });
window.SUBS = SUBS;

// ---------------- camera ----------------
const camM = ([cx, cy, z], mir = 1) => [z * mir, 0, 0, z, 540 - cx * z * mir, 960 - cy * z];
const INN = [540, 1380, 1.6];
function camAt(t) {
  if (t < SH.s4) { const u = eio(seg(t, SH.s2, SH.s3)); return [lerp(540, 470, u), INN[1], lerp(INN[2], 1.75, u) + (t > SH.s3 ? E(t, HIT.offer, HIT.offer + .12) * .15 : 0)]; }
  if (t < HIT.flash) {   // lie down, then push into the pillow's hole (centre on the hole; the cloth clamp is lifted here)
    const hole = [620 + 64, BENCH_Y - 57], u = ei(seg(t, HIT.hole, HIT.flash));
    return [lerp(500, hole[0], u), lerp(INN[1] + 80, hole[1], u), lerp(1.75, 14, u)];
  }
  if (t < SH.s8) return [540, 960, lerp(1.04, 1.0, seg(t, HIT.flash, SH.s8))];
  if (t < SH.s9) { const z = 1.25 + .2 * E(t, HIT.knife - .2, HIT.knife) + back(seg(t, HIT.stop, HIT.stop + 5 / 30), 1.3) * .25 - E(t, HIT.stop + .3, SH.s9) * .2; return [540, 860, z]; }
  if (t < SH.s11) { const u = E(t, SH.s9, HIT.crown + .6); return [540, lerp(860, 900, u), lerp(1.25, .9, u) + .06 * E(t, HIT.out0, HIT.dark)]; }
  if (t < SH.s12) return [540, 960, 1];
  return [lerp(600, 560, seg(t, SH.s12, DUR)), INN[1], lerp(1.5, 1.42, seg(t, SH.s12, DUR))];
}
const clampCam = c => { if (c[2] >= 1) { c[0] = clamp(c[0], 540 / c[2], 1080 - 540 / c[2]); c[1] = clamp(c[1], 960 / c[2], 1920 - 960 / c[2]); } return c; };

// ---------------- one frame ----------------
function scene(t, C) {
  tr.setTransform(1, 0, 0, 1, 0, 0); tr.fillStyle = '#fff'; tr.fillRect(0, 0, W, H);
  const dreaming = t >= HIT.flash && t < SH.s12;
  const steam = t < HIT.flash ? 1 : t < SH.s12 ? 1 : 1 - .6 * E(t, HIT.lid, HIT.lid + .5);
  inn(C, t, { lid: t > HIT.lid ? eo(seg(t, HIT.lid, HIT.lid + .5)) * (1 - E(t, HIT.lid + 2.6, HIT.lid + 3.2)) : 0, steam });
  if (dreaming) dp(tr, C, PR.clouds, 540, CLOUD_Y, 1, 0, { alpha: E(t, HIT.flash, HIT.flash + .5) * (1 - E(t, HIT.dark - .5, HIT.dark)) });
  // the people of the inn
  const k = Math.hypot(C[0], C[1]);
  if (t < HIT.lieDown + .9 || t >= SH.s12) {      // Lü Weng (standing at left, facing right)
    const offer = t > HIT.offer ? E(t, HIT.offer, HIT.offer + .5) * (1 - E(t, HIT.lieDown - .6, HIT.lieDown)) : 0, bow = t > HIT.bow ? E(t, HIT.bow, HIT.bow + .5) * (1 - E(t, HIT.bow + 1, HIT.bow + 1.4)) : 0;
    const r = P('lv', { x: 250, y: FLOOR - 200, flip: 1, a1: lerp(.25, -1.3, offer), a2: lerp(-.6, -1.4, offer), head: .06 + .1 * bow }, t, C, { sd: 11 });
    if (offer > 0) { const hc = [(r.hand[0] - C[4]) / C[0], (r.hand[1] - C[5]) / C[3]]; dp(tr, C, PR.pillow, hc[0] + 40, hc[1] - 4, .7, 0); }
  }
  if (t < HIT.lieDown) {       // Lu Sheng sits on the bench and sighs
    const sigh = (Math.sin(t * 1.8) * .5 + .5) * (t > SH.s2 + .8 && t < SH.s3 ? 1 : 0);
    P('lu', { x: 540, y: BENCH_Y - 150, flip: -1, a1: .5, a2: -1 - .4 * sigh, head: .25 + .12 * sigh, rot: .05 }, t, C, { sd: 1 });
  } else if (t < SH.s12) {     // asleep on the bench, head on the pillow (the dream above)
    const u = E(t, HIT.lieDown, HIT.lieDown + .7);
    dp(tr, C, PR.pillow, 470 + 150, BENCH_Y - 40, .75, 0);
    P('lu', { x: lerp(540, 450, u), y: lerp(BENCH_Y - 150, BENCH_Y - 66, u), flip: -1, rot: lerp(.05, -(Math.PI / 2 - .02), u), a1: .1, a2: -.2, head: -.1 }, t, C, { sd: 1, noRods: u > .5 });
  } else {                     // waking
    const up = E(t, HIT.wake, HIT.wake + .8), bow = t > HIT.bow ? E(t, HIT.bow, HIT.bow + .5) * (1 - E(t, HIT.bow + 1, HIT.bow + 1.4)) : 0, go = E(t, HIT.leave, DUR);
    if (up < 1) dp(tr, C, PR.pillow, 470 + 150, BENCH_Y - 40, .75, 0);
    P('lu', { x: lerp(450, 540, up) - go * 700, y: lerp(BENCH_Y - 66, BENCH_Y - 150, up), flip: -1, rot: lerp(-(Math.PI / 2 - .02), .05 + .35 * bow, up), a1: -.6 * bow, a2: -1.4 * bow, head: .1 + .3 * bow, step: go * 6 }, t, C, { sd: 1 });
    if (t > HIT.lid - 1.2) P('keeper', { x: lerp(1200, 760, eo(seg(t, HIT.lid - 1.2, HIT.lid - .2))), y: FLOOR - 200, flip: -1, a1: -1.2 * E(t, HIT.lid - .3, HIT.lid + .2), a2: -2, head: .1 }, t, C, { sd: 13 });
  }
  if (dreaming) dream(C, t);
  // the title plaque on two rods
  if (t > HIT.title && t < HIT.titleOff + .9) {
    const a = press(t, HIT.title, .55), b = t > HIT.titleOff ? lift(t, HIT.titleOff) : { s: 1, blur: 0, alpha: 1 };
    dp(tr, C, TITLE, 540, 1150, .62 * a.s * b.s, 0, { blur: a.blur + b.blur > .5 ? a.blur + b.blur : 0, alpha: a.alpha * b.alpha });
  }
}
function render(t) {
  fr.setTransform(1, 0, 0, 1, 0, 0); fr.clearRect(0, 0, W, H); fr.globalAlpha = 1; fr.filter = 'none';
  if (qs.get('test') === 'model') return modelSheet();
  const L = lampsAt(t), nEff = L.reduce((a, l) => a + l[2], 0);
  const base = { lamps: L, sigB: 820, sigC: 140, amb: .32, time: t, vign: .45, sat: 1.1, contrast: .15, bloom: .3, rect: [0, 0, 1080, 1920] };
  let o;
  if (t >= SH.s11 && t < SH.s12) o = renderBack(t, base);
  else {
    const cam = clampCam(camAt(t)), C = camM(cam);
    scene(t, C);
    if (cam[2] < 1.01) drawFrame(C, clamp(nEff, 0, 3) / 1.5);
    o = { ...base, cam, expo: 1.3 / Math.pow(Math.max(1, nEff), .42), bloom: .28 + .2 * clamp((nEff - 1) / 6, 0, 1) };
    if (t >= HIT.hole && t < HIT.flash) { const u = seg(t, HIT.flash - .5, HIT.flash); o.fade = ei(u) * .95; o.fadeCol = [1, .86, .6]; }
    if (t >= HIT.flash && t < HIT.flash + .35) { o.fade = (1 - seg(t, HIT.flash, HIT.flash + .35)) * .95; o.fadeCol = [1, .86, .6]; }
    if (t > HIT.dark - .2 && t < SH.s11) { o.fade = E(t, HIT.dark - .2, HIT.dark + .3); o.fadeCol = [0, 0, 0]; }
    if (t > DUR - .6) { o.fade = E(t, DUR - .6, DUR - .05); o.fadeCol = [0, 0, 0]; }
  }
  if (!qs.get('nosub')) {
    const inInn = t < HIT.flash || t >= SH.s12 || (t >= SH.s11 && t < SH.s12);
    for (const s of SUBS) if (t >= s.t0 && t < s.t1) { const a = Math.min(E(t, s.t0, s.t0 + .2), 1 - E(t, s.t1 - .25, s.t1)); placard(s.zh, a, 1 - eo(seg(t, s.t0, s.t0 + .22)), inInn ? 250 : (t >= SH.s8 && t < SH.s9 ? 1560 : 1420)); }
  }
  GL.render(trc, frc, o);
}
// ---------------- backstage: who holds the rods ----------------
function renderBack(t, base) {
  const u = eo(seg(t, SH.s11, SH.s11 + 1.2)), push = eio(seg(t, SH.s11 + 1, SH.s12));
  const z = lerp(.95, 1.05, push), C = camM([540 + (1 - u) * 600, 1100, z], -1), k = z;
  // the screen from behind: the dream figure lying still (dim), the inn
  tr.setTransform(1, 0, 0, 1, 0, 0); tr.fillStyle = '#fff'; tr.fillRect(0, 0, W, H);
  inn(C, t, { steam: 1 });
  dp(tr, C, PR.pillow, 470 + 150, BENCH_Y - 40, .75, 0);
  const r = drawPuppet(tr, C, CH.lu, { x: 450, y: BENCH_Y - 66, flip: -1, rot: -(Math.PI / 2 - .02), a1: .1, a2: -.2, head: -.1 });
  // dark room, the back of the frame
  fr.save(); fr.setTransform(1, 0, 0, 1, 0, 0);
  const sr = [C[0] * 1080 + C[4], C[5], C[4], C[3] * 1920 + C[5]];
  fr.fillStyle = '#0d0705'; fr.beginPath(); fr.rect(0, 0, W, H); fr.rect(sr[0], sr[1], sr[2] - sr[0], sr[3] - sr[1]); fr.fill('evenodd');
  fr.strokeStyle = '#2a120a'; fr.lineWidth = 26 * k; fr.strokeRect(sr[0], sr[1], sr[2] - sr[0], sr[3] - sr[1]);
  fr.restore();
  // the lamp, the old hands on the rods, and over the shoulder the Taoist's head: topknot, long beard
  const lamp = [C[0] * LAMP0[0] + C[4], C[3] * LAMP0[1] + C[5] - 140 * k];
  silhouette(fr, g => lampBody(g, lamp[0], lamp[1], 1.1 * k), { dir: [0, -1], k: 3, rimA: .55, rim: '#ffb766' });
  flame(fr, lamp[0], lamp[1], 1.1 * k, t, 1);
  const hb = [700, 1820], hp = [330, 1860];
  silhouette(fr, g => {
    const a = fistHand(g, [1.6 * k, 0, 0, 1.6 * k, hb[0], hb[1]]);
    const b = pinchHand(g, [1.5 * k * Math.cos(-.2), 1.5 * k * Math.sin(-.2), -1.5 * k * Math.sin(-.2), 1.5 * k * Math.cos(-.2), hp[0], hp[1]], .2);
    const pts = r.rods; [a.grip, b.gripA].forEach((q, i) => { g.lineWidth = (i ? 4 : 6) * k; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke(); });
    // knuckles of an old man: a few wrinkle notches cut from the silhouette are not visible at this scale; the sleeve is wide (a Taoist's)
  }, { dir: [-.5, -.86], k: 5, rimA: .85 });
  silhouette(fr, g => {      // over the shoulder: topknot, crown pin, long beard
    const s = [930, 1250];
    g.beginPath(); g.ellipse(s[0], s[1], 120 * k, 150 * k, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(s[0] - 10, s[1] - 170 * k, 46 * k, 50 * k, 0, 0, 7); g.fill();
    g.lineWidth = 10 * k; g.beginPath(); g.moveTo(s[0] - 90 * k, s[1] - 190 * k); g.lineTo(s[0] + 80 * k, s[1] - 205 * k); g.stroke();
    g.beginPath(); g.moveTo(s[0] - 110 * k, s[1] + 40 * k); g.quadraticCurveTo(s[0] - 170 * k, s[1] + 220 * k, s[0] - 140 * k, s[1] + 420 * k); g.lineTo(s[0] - 80 * k, s[1] + 400 * k); g.quadraticCurveTo(s[0] - 90 * k, s[1] + 200 * k, s[0] - 40 * k, s[1] + 80 * k); g.fill();
    g.beginPath(); g.ellipse(s[0] + 60 * k, s[1] + 420 * k, 300 * k, 260 * k, -.2, 0, 7); g.fill();
  }, { dir: [-.85, -.5], k: 7, rimA: .7, blur: 4 });
  return { ...base, cam: [(540 - C[4]) / C[0], (960 - C[5]) / C[3], C[3]], mir: -1, expo: .9, lamps: [[LAMP0[0], LAMP0[1] - 100, .9 + .1 * Math.sin(t * 9), 1.3]], bloom: .38, vign: .55, fade: 1 - E(t, SH.s11, SH.s11 + .5), fadeCol: [0, 0, 0] };
}
// ---------------- model sheet ----------------
function modelSheet() {
  tr.setTransform(1, 0, 0, 1, 0, 0); tr.fillStyle = '#fff'; tr.fillRect(0, 0, W, H);
  const C = camM([540, 960, .62]);
  const L = [['lu', 0, 0], ['luGreen', 1, 0], ['luRed', 2, 0], ['luCrown', 3, 0], ['luOld', 0, 1], ['lv', 1, 1], ['cui', 2, 1], ['rival', 3, 1], ['bride', 0, 2], ['keeper', 1, 2], ['luPrison', 2, 2], ['son', 3, 2]];
  for (const [c, i, j] of L) drawPuppet(tr, C, CH[c], { x: -100 + i * 430, y: 260 + j * 900, a1: -.6, a2: -1.3, head: 0 });
  dp(tr, C, PR.pillow, 1500, 2700, 1); dp(tr, C, PR.lantern, -150, 2500, 1);
  GL.render(trc, frc, { lamps: [[540, 600, 1, 1], [540, 1500, 1, 1]], cam: [540, 960, 1], sigB: 900, sigC: 160, amb: .35, expo: 1.0, vign: .4, sat: 1.1, contrast: .15, bloom: .25, rect: [0, 0, 1080, 1920] });
}
window.render = render; window.DUR = DUR;
render(parseFloat(qs.get('t') ?? '20'));
window.READY = true;
