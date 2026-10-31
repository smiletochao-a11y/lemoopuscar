// The 13 shots. Each shot draws into a layer set (screen space 1080×1920) and returns compositor parameters.
import { mk, draw, mass, blot, TONE } from './ink.js';
import { mountainLayer, ridgeFn, cun, pine, ripple } from './land.js';
import { steam, hall, lantern, lady, hand, dancer, musician, horse, hooves, petal, daySeal, titleSeal, writeCols, writeFan, rain, tiny, tourist, phoneFrame, VERM } from './art.js';
import { SH, HIT, POEM, daysAt, DUR } from './timeline.js';
import { clamp, lerp, seg, ss, eio, eo, mulberry } from '/core/lib.js';

export const W = 1080, H = 1920;
const st2 = (t, fps = 15) => Math.floor(t * fps) / fps;    // figures step on twos
const boil = t => Math.floor(t * 15) % 5;

// cached landscape layers
const CACHE = {};
export function init() {
  // S2: Lishan in snow (tall hanging-scroll world, 1080 × 3400): far ranges pale, near ridge textured; peaks left white
  const r1 = ridgeFn([[300, 520, 260], [640, 640, 300], [900, 480, 220]], 900, 3, 26);
  CACHE.lishanFar = mountainLayer({ W, H: 1500, ridge: x => r1(x) - 200, depth: 900, tone: .22, rim: .5, mist: 1.1, seed: 4 });
  const r2 = ridgeFn([[180, 420, 220], [520, 560, 260], [860, 380, 240]], 1200, 7, 30);
  CACHE.lishanNear = mountainLayer({ W, H: 1800, ridge: r2, depth: 800, tone: .55, rim: .9, mist: 1.4, seed: 8 });
  CACHE.r2 = r2;
  // S5 top: the far mountain road
  const r3 = ridgeFn([[150, 220, 180], [480, 300, 220], [820, 240, 200]], 560, 11, 20);
  CACHE.north = mountainLayer({ W, H: 900, ridge: r3, depth: 420, tone: .3, rim: .8, mist: 1.3, seed: 12 }); CACHE.r3 = r3;
  // S10: the road west, a long handscroll (3200 wide)
  const r4 = ridgeFn([[300, 380, 260], [900, 460, 300], [1500, 360, 260], [2100, 500, 320], [2800, 420, 280]], 1100, 15, 30);
  CACHE.west = mountainLayer({ W: 3200, H: 1700, ridge: r4, depth: 800, tone: .5, rim: .85, mist: 1.2, seed: 16 }); CACHE.r4 = r4;
  const r5 = ridgeFn([[600, 300, 400], [1700, 340, 420], [2700, 280, 380]], 900, 19, 18);
  CACHE.westFar = mountainLayer({ W: 3200, H: 1500, ridge: r5, depth: 700, tone: .14, rim: .5, mist: 1, seed: 20 });
}

// ---- the pool surface seen from above (S1, S6, S13 rhyme) ----
function poolTop(A, t, o = {}) {
  const c = A.cw; c.setTransform(1, 0, 0, 1, 0, 0);
  // stone edge along the bottom-left: a few heavy dry strokes; the water is blank paper
  for (let i = 0; i < 4; i++) draw(A.ink, mk([[-40, 1500 + i * 70], [300 + i * 40, 1640 + i * 60], [700 + i * 20, 1980]], { w: 60 - i * 8, tone: .5 - i * .08, dry: .6, wet: .6, prof: 'press', darkDir: [-1, 1], side: .8, brWet: true, body: .3, seed: 300 + i }), 1, o.am ?? 1);
  // faint streaks on the water
  for (let i = 0; i < 6; i++) { const y = 380 + i * 190 + Math.sin(t * .4 + i) * 6; draw(A.ink, mk([[180 + i * 40, y], [520 + i * 30, y + 6], [880, y - 4]], { w: 3, tone: .25, dry: .85, prof: 'tip', seed: 320 + i }), 1, .5); }
}

function sub(A, text, x, y, k, o = {}) {
  if (k <= 0) return;
  const size = o.size || 50, lines = text.split('\n'), wetK = clamp(1 - k) * .8;
  for (const [ctx, kk] of [[A.cw, wetK], [A.cd, 1 - wetK * .6]]) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(k * kk * .92); ctx.fillStyle = '#000';
    ctx.font = `500 ${size}px NotoSerifSC`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = o.align || 'left';
    lines.forEach((ln, i) => ctx.fillText(ln, x + (o.align === 'center' ? 0 : size * .62), y + i * size * 1.35));
    ctx.restore();
  }
  if (o.align !== 'center') { const s = size * .3, cc = A.cc; cc.save(); cc.setTransform(1, 0, 0, 1, 0, 0); cc.globalAlpha = clamp(k * .92); cc.fillStyle = `rgb(${VERM.join(',')})`; cc.fillRect(x, y - size * .36 - s / 2, s, s); cc.restore(); }
}
export { sub };

// ================= shots =================
const S = {};

// S1 · the hand tests the water; the seal 246 lands
S.s1 = (A, t, TMP) => {
  A.xf(1, 0, 0);
  poolTop(A, t);
  steam(A.ink, { x: 560, y: 1500, w: 900, h: 1300, t, n: 16, seed: 3, tone: .12 });
  const k = eo(seg(t, .2, HIT.hand));                      // the hand reaches in
  hand(A.ink, lerp(1300, 659, k), lerp(-160, 470, k), 5.5, { ang: Math.PI - .95, seed: 31 });
  const tr = Math.max(0, t - HIT.hand);
  for (let j = 0; j < 3; j++) { const a = tr - j * .55; if (a > 0) ripple(A.ink, 420, 690, 30 + Math.pow(a, .6) * 150, clamp(1 - a / 2.6), 7 + j, .32, 3.5); }
  const sk = seg(t, HIT.stamp, HIT.stamp + .18);
  if (sk > 0) { const sc = 1 + .25 * (1 - eo(sk)); daySeal(A.cc, 790 - 70 * (sc - 1), 150 - 70 * (sc - 1), 170 * sc, 246, clamp(sk * 1.5), 5); }
  return { paper: [0, 0, 1], bleed: 6, rim: .8, vig: .24 };
};
// S2 · hanging scroll: Lishan in snow, tilting down to the palace in steam
S.s2 = (A, t) => {
  const u = eio(seg(t, SH.s2, SH.s3)), ty = lerp(-150, -1700, u);
  A.xf(1, 0, ty);
  A.cw.drawImage(CACHE.lishanFar, 0, 300);
  A.cw.drawImage(CACHE.lishanNear, 0, 500);
  cun(A.ink, { x0: 60, x1: 1020, ridge: x => CACHE.r2(x) + 500, tone: .18, seed: 9, cun: 1.4, moss: 1.2 });
  pine(A.ink, 120, 1820, 1.1, 5, t, .3); pine(A.ink, 960, 1900, .9, 7, t, .3, -1);
  // palace halls stacked down the slope, half in mist
  hall(A.ink, 560, 2500, 520, 1.1, { seed: 3 }); hall(A.ink, 300, 2760, 360, .8, { seed: 5, am: .8 }); hall(A.ink, 820, 2820, 400, .85, { seed: 7, am: .8 });
  hall(A.ink, 540, 3120, 620, 1.25, { seed: 9 });
  steam(A.ink, { x: 540, y: 3500, w: 1000, h: 900, t, n: 18, seed: 11, tone: .14 });
  // snow: a few white gaps are the paper itself; falling flakes as tiny dry dots
  const R = mulberry(4); for (let i = 0; i < 80; i++) { const x = R() * W, y = (R() * 3400 + t * 60) % 3400; blot(A.cd, x, y, 1.5 + R() * 2, .25, 0, 1, i); }
  return { paper: [0, -ty, 1], bleed: 6, rim: .8 };
};
// S3 · she pins the petal into her bun; the poem is written
S.s3 = (A, t, TMP) => {
  const u = eio(seg(t, SH.s3, SH.s4)), sc = lerp(1, 1.06, u);
  A.xf(sc, (1 - sc) * 420, (1 - sc) * 1150);
  // pool edge, a pillar and a gauze curtain of steam in front
  draw(A.ink, mk([[0, 1430], [500, 1410], [1080, 1440]], { w: 26, tone: .5, dry: .55, wet: .6, prof: 'even', seed: 401 }), 1, 1);
  draw(A.ink, mk([[60, 1460], [60, 0]], LOADP(70, .55, [1, 0], 402)), 1, .9);
  const ts = st2(t), arm = ss(seg(ts, SH.s3 + 1.2, HIT.pin)) * (1 - ss(seg(ts, HIT.pin + .6, HIT.pin + 1.6)) * .9);
  const L = lady(A.ink, { x: 420, y: 1420, s: 9.5, arm, t: ts, seed: 21 });
  const pk = seg(t, HIT.pin - .2, HIT.pin + .2);
  const bun = L.bun;
  petal(A.ink, lerp(L.hand[0], bun[0], pk), lerp(L.hand[1], bun[1], pk), 2.2, -.5, 1, 7);
  steam(A.ink, { x: 480, y: 1700, w: 1100, h: 1400, t, n: 12, seed: 13, tone: .1 });
  writeCols(A, TMP, POEM, 960, 260, 104, seg(t, 11.6, 16.1), { colGap: 1.25 });
  return { paper: [0, 0, 1], bleed: 6, rim: .8 };
};
const LOADP = (w, tone, dark, seed) => ({ w, tone, darkDir: dark, side: .85, brWet: true, body: .25, dry: .45, wet: .9, prof: 'even', seed });
// S4 · handscroll pan: lanterns, musicians, dancer; she watches and laughs
S.s4 = (A, t) => {
  const u = eio(seg(t, SH.s4, SH.s5 + .8)), tx = lerp(0, -900, u);
  A.xf(1, tx, 0);
  for (let i = 0; i < 7; i++) lantern(A.ink, 120 + i * 300, 330 + (i % 2) * 40 + Math.sin(t * 1.2 + i) * 4, 2.2, 1, i + 1);
  draw(A.ink, mk([[-100, 1500], [2200, 1480]], { w: 14, tone: .45, dry: .6, prof: 'even', seed: 410 }), 1, 1);
  const ts = st2(t);
  musician(A.ink, 180, 1460, 4.2, ts, 1, 51); musician(A.ink, 380, 1470, 4, ts + .3, .9, 53);
  dancer(A.ink, 900, 1440, 6.5, ts * 2.4, 1, 41);
  const L4 = lady(A.ink, { x: 1560, y: 1460, s: 6.5, t: ts, look: .5, laugh: 1, seed: 21, flip: -1 });
  petal(A.ink, L4.bun[0], L4.bun[1], 1.5, -.4, 1, 7);
  steam(A.ink, { x: 1500, y: 1900, w: 1200, h: 900, t, n: 10, seed: 15, tone: .1 });
  return { paper: [-tx, 0, 1], bleed: 6, rim: .8 };
};
// S5 · split frame: the rider on the northern road (top) over the feast (bottom)
S.s5 = (A, t) => {
  A.xf(1, 0, 0);
  // top half: far mountains and a road zig-zagging toward us
  A.cw.drawImage(CACHE.north, 0, 0);
  const road = [[880, 520], [640, 600], [760, 690], [420, 780], [560, 860]];
  draw(A.ink, mk(road, { w: 6, tone: .45, dry: .75, prof: 'tip', seed: 420 }), 1, 1);
  const k = seg(t, HIT.rider, SH.s6), pos = Math.pow(k, 1.3) * (road.length - 1), i0 = Math.min(road.length - 2, Math.floor(pos)), f = pos - i0;
  const rx = lerp(road[i0][0], road[i0 + 1][0], f), ry = lerp(road[i0][1], road[i0 + 1][1], f);
  const dir = road[i0 + 1][0] < road[i0][0] ? -1 : 1;
  if (t > HIT.rider) horse(A.ink, rx, ry, .45 + .55 * k, st2(t) * 14, { dir, dust: 1, seed: 61 });
  // two album leaves: fine mounting lines around each half
  for (const [y0, y1, sd] of [[70, 900, 425], [990, 1850, 427]]) {
    const box = [[60, y0], [1020, y0], [1020, y1], [60, y1], [60, y0]];
    for (let k = 0; k < 4; k++) draw(A.ink, mk([box[k], box[k + 1]], { w: 3, tone: .55, dry: .55, prof: 'even', seed: sd * 10 + k }), 1, .9);
  }
  // bottom half: the feast continues
  for (let i = 0; i < 3; i++) lantern(A.ink, 180 + i * 360, 1120 + (i % 2) * 30 + Math.sin(t * 1.2 + i) * 4, 1.8, 1, i + 3);
  draw(A.ink, mk([[-50, 1760], [1130, 1745]], { w: 12, tone: .45, dry: .6, prof: 'even', seed: 421 }), 1, 1);
  const ts = st2(t);
  dancer(A.ink, 330, 1720, 4.4, ts * 2.4, 1, 41); musician(A.ink, 110, 1740, 2.8, ts, .9, 51);
  const L5 = lady(A.ink, { x: 760, y: 1740, s: 4.6, t: ts, look: .45, laugh: 1, seed: 21, flip: -1 });
  petal(A.ink, L5.bun[0], L5.bun[1], 1.1, -.4, 1, 7);
  const n = daysAt(t); daySeal(A.cc, 870, 1020, 120, n, 1, 5);
  return { paper: [0, 0, 1], bleed: 6, rim: .8 };
};
// S6 · silence: the pool again, still
S.s6 = (A, t) => {
  A.xf(1, 0, 0); poolTop(A, t);
  steam(A.ink, { x: 560, y: 1500, w: 900, h: 1300, t, n: 16, seed: 3, tone: .12 });
  const d = t - HIT.drip; if (d > 0) ripple(A.ink, 600, 900, 20 + Math.pow(d, .6) * 120, clamp(1 - d / 2), 3, .32, 3);
  return { paper: [0, 0, 1], bleed: 6, rim: .8 };
};
// S7 · one flying-white stroke = the horse bursts through; hard cut to the hooves
S.s7 = (A, t) => {
  A.xf(1, 0, 0);
  if (t < HIT.hoof) {
    poolTop(A, t, { am: .8 });
    const k = eo(seg(t, HIT.stroke, HIT.stroke + .14));
    const s = mk([[1180, 820, .6], [800, 900, 1], [400, 950, 1.1], [-120, 1010, .5]], { w: 230, tone: TONE.jiao, dry: .72, wet: .1, prof: 'even', rough: .2, nb: 60, seed: 777 });
    draw(A.ink, s, k, 1);
    return { paper: [0, 0, 1], bleed: 6, rim: .8, shake: k > 0 && k < 1 ? [8, -4] : [0, 0] };
  }
  horse(A.ink, 600, 1500, 15, st2(t) * 16, { dir: -1, dust: 2, seed: 61 });
  return { paper: [0, 0, 1], bleed: 7, rim: .9, shake: [Math.sin(t * 60) * 4, Math.cos(t * 50) * 3] };
};
// S8 · the dispatch: 反 written; seal 206; she looks up and the petal falls
S.s8 = (A, t, TMP) => {
  A.xf(1, 0, 0);
  if (t < HIT.look) {
    const open = eo(seg(t, HIT.scroll, HIT.scroll + .6));
    // a dispatch scroll: a pale paper band with dark rollers top and bottom
    const y0 = 360, h = 1200 * open;
    mass(A.cw, [[150, y0], [930, y0], [930, y0 + h], [150, y0 + h]], .07, 4, 8);
    for (const yy of [y0, y0 + h]) draw(A.ink, mk([[120, yy], [960, yy]], { w: 34, tone: .8, dry: .4, wet: .5, prof: 'even', seed: 430 + (yy > y0 ? 1 : 0) }), 1, 1);
    if (open > .9) writeFan(A, TMP, 190, 470, 700, seg(t, HIT.fan, HIT.fan + 1.2) * 4);
    // the ink of 反 bleeds outward and darkens
    const bl = seg(t, HIT.fan + 1.2, HIT.look);
    if (bl > 0) for (let i = 0; i < 6; i++) blot(A.cw, 540 + Math.cos(i * 1.7) * 180, 820 + Math.sin(i * 2.3) * 220, 60 + bl * 140, .1 * bl, i, .8, i);
    const sk = seg(t, HIT.stamp206, HIT.stamp206 + .18);
    if (sk > 0) { const sc = 1 + .25 * (1 - eo(sk)); daySeal(A.cc, 760 - 70 * (sc - 1), 1380 - 70 * (sc - 1), 170 * sc, 206, clamp(sk * 1.5), 6); }
    return { paper: [0, 0, 1], bleed: 7, rim: 1, vig: .3 };
  }
  // she looks up (medium, back view); the petal slides from her bun
  const ts = st2(t), lk = eo(seg(ts, HIT.look, HIT.look + .4));
  const L = lady(A.ink, { x: 540, y: 1600, s: 12, look: lk, t: ts, seed: 21 });
  const fk = seg(t, HIT.fall, SH.s9 + .6);
  petal(A.ink, L.bun[0] + Math.sin(fk * 6) * 40, L.bun[1] + fk * 900, 2.6, -.5 + fk * 4, 1, 7);
  steam(A.ink, { x: 540, y: 1900, w: 1100, h: 1400, t, n: 10, seed: 13, tone: .1 });
  return { paper: [0, 0, 1], bleed: 6, rim: .8 };
};
// S9 · the steam is un-painted stroke by stroke; she fades
S.s9 = (A, t) => {
  A.xf(1, 0, 0);
  const e = ss(seg(t, HIT.erase, SH.s10 - .3));
  draw(A.ink, mk([[0, 1430], [500, 1410], [1080, 1440]], { w: 26, tone: .5, dry: .55, wet: .6, prof: 'even', seed: 401 }), 1, 1 - e * .6);
  lady(A.ink, { x: 420, y: 1420, s: 9.5, t: st2(t), look: 1, seed: 21, am: 1 - ss(seg(t, HIT.erase + 1, SH.s10 - .5)) });
  steam(A.ink, { x: 480, y: 1700, w: 1100, h: 1400, t, n: 22, seed: 13, tone: .13, keep: 1 - e });
  return { paper: [0, 0, 1], bleed: 6, rim: .8 };
};
// S10 · handscroll westward in the rain; the seal counts down fast
S.s10 = (A, t) => {
  const u = eio(seg(t, SH.s10, SH.s11)), tx = lerp(-100, -2100, u);
  A.xf(1, tx, 0);
  A.cw.drawImage(CACHE.westFar, 0, 200); A.cw.drawImage(CACHE.west, 0, 500);
  cun(A.ink, { x0: 0, x1: 3200, ridge: x => CACHE.r4(x) + 500, tone: .16, seed: 21, cun: 1, moss: 1 });
  const road = x => 1660 + Math.sin(x * .002) * 40;
  draw(A.ink, mk(Array.from({ length: 12 }, (_, i) => [i * 300, road(i * 300)]), { w: 5, tone: .45, dry: .75, prof: 'tip', seed: 440 }), 1, 1);
  // the train of carts and riders moving west (left)
  for (let i = 0; i < 7; i++) { const x = -tx + 260 + i * 110 - (t - SH.s10) * 30; horse(A.ink, x, road(x) + 4, 1.1, st2(t) * 8 + i * .7, { dir: -1, seed: 61 + i, am: .9 }); }
  A.xf(1, 0, 0);
  rain(A.ink, W, H, t, 1, 220);
  daySeal(A.cc, 860, 140, 130, daysAt(t), 1, 7);
  return { paper: [-tx, 0, 1], bleed: 6, rim: .8, warm: .2 };
};
// S11 · blank paper, a tiny red petal falls; 0
S.s11 = (A, t) => {
  A.xf(1, 0, 0);
  const k = seg(t, SH.s11, HIT.zero);
  petal(A.ink, 560 + Math.sin(k * 5) * 60, lerp(300, 1240, ss(k)), 1.1, k * 6, 1, 9);
  if (t > HIT.zero) { draw(A.ink, mk([[380, 1262], [740, 1258]], { w: 2, tone: .25, dry: .85, prof: 'tip', seed: 450 }), 1, .6); daySeal(A.cc, 485, 1360, 110, 0, clamp((t - HIT.zero) / .15), 9); }
  return { paper: [0, 0, 1], bleed: 6, rim: .8, vig: .18 };
};
// S12 · the poem covers her: the romance was written by others
S.s12 = (A, t, TMP) => {
  A.xf(1, 0, 0);
  lady(A.ink, { x: 540, y: 1500, s: 10, t: 0, seed: 21, am: .35 });
  writeCols(A, TMP, ['春寒赐浴', '华清池', '温泉水滑', '洗凝脂'], 900, 380, 190, seg(t, HIT.poem, SH.s13 - 1.2), { colGap: 1.1, rowGap: 1.05 });
  return { paper: [0, 0, 1], bleed: 6, rim: .8 };
};
// S13 · today: the crabapple-shaped pool, empty; tourists with phones; title and seal
// the crabapple-shaped pool seen obliquely (used inside the phone and in the wide)
function haitang(A, cx, cy, R0, am = 1, sd = 460) {
  for (const [rr, w, tone, k0] of [[1, 9, .8, 0], [.8, 6, .55, 10]]) {
    const pts = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2, lobe = 1 + .14 * Math.cos(a * 5); pts.push([cx + Math.cos(a) * R0 * rr * lobe, cy + Math.sin(a) * R0 * .55 * rr * lobe]); }
    for (let k = 0; k < 5; k++) draw(A.ink, mk(pts.slice(k * 12, k * 12 + 13), { w: w * R0 / 330, tone, dry: .55, wet: .3, prof: 'brush', seed: sd + k0 + k }), 1, am);
  }
  mass(A.cw, Array.from({ length: 40 }, (_, i) => { const a = i / 40 * Math.PI * 2, lobe = 1 + .14 * Math.cos(a * 5); return [cx + Math.cos(a) * R0 * .8 * lobe, cy + Math.sin(a) * R0 * .44 * lobe]; }), .12 * am, 4, 11);
}
// S13 · today. a) over a visitor's shoulder: a phone frames the empty crabapple pool with the red petal; the shutter.
//              b) pull back: the shelter railing, visitors in caps and backpacks, phones held up, a guide's flag; title and seal.
S.s13 = (A, t, TMP) => {
  A.xf(1, 0, 0);
  if (t < HIT.wide) {
    haitang(A, 540, 1150, 520, .35);                                   // the real pool behind, out of focus (pale)
    const u = eio(seg(t, SH.s13, HIT.wide)), px = 250, py = lerp(380, 340, u), pw = 580, ph = 1080;
    // the screen shows its own picture: clear what lies behind it
    for (const c of [A.cw, A.cd]) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(px + 10, py + 10, pw - 20, ph - 20); c.restore(); }
    haitang(A, px + pw / 2, py + ph * .5, 230, 1);                     // the pool on the screen, sharp
    petal(A.ink, px + pw / 2 + 10, py + ph * .5 + 4, 1.3, .4, 1, 11);
    phoneFrame(A.ink, px, py, pw, ph);
    // the hand holding it from below: palm and thumb at the lower right corner, fingertips on the left edge, a sleeve
    mass(A.cw, [[px + pw - 140, py + ph + 10], [px + pw + 40, py + ph - 120], [px + pw + 140, py + ph + 120], [px + pw + 160, 1920], [px + pw - 200, 1920]], .1, 5, 13);
    draw(A.ink, mk([[px + pw - 200, 1920], [px + pw - 150, py + ph + 40], [px + pw - 60, py + ph - 20]], { w: 3, tone: TONE.nong, dry: .45, prof: 'tip', seed: 941 }), 1, 1);
    draw(A.ink, mk([[px + pw + 150, py + ph + 160], [px + pw + 60, py + ph - 110], [px + pw - 20, py + ph - 210]], { w: 54, tone: .2, wet: 1, dry: 0, prof: 'cone', seed: 940 }), 1, 1);
    draw(A.ink, mk([[px + pw + 170, py + ph + 140], [px + pw + 84, py + ph - 116], [px + pw - 18, py + ph - 236]], { w: 3, tone: TONE.nong, dry: .45, prof: 'tip', seed: 942 }), 1, 1);
    for (let k = 0; k < 3; k++) { const yy = py + ph * (.58 + k * .08); draw(A.ink, mk([[px - 46, yy + 10], [px - 10, yy], [px + 12, yy - 4]], { w: 30, tone: .2, wet: 1, dry: 0, prof: 'lens', seed: 950 + k }), 1, 1); draw(A.ink, mk([[px - 50, yy - 6], [px - 10, yy - 14], [px + 12, yy - 16]], { w: 2.2, tone: TONE.nong, dry: .45, prof: 'tip', seed: 960 + k }), 1, 1); }
    // sleeve: a dark loaded block at the bottom right
    mass(A.cw, [[px + pw + 100, 1920], [1080, 1920], [1080, py + ph + 280], [px + pw + 150, py + ph + 200]], .5, 6, 14);
    const fl = t > HIT.shutter ? Math.max(0, 1 - (t - HIT.shutter) / .25) : 0;
    return { paper: [0, 0, 1], bleed: 6, rim: .8, flash: fl * .85 };
  }
  const u = eio(seg(t, HIT.wide, DUR)), sc = lerp(1.15, 1, u);
  A.xf(sc, (1 - sc) * 540, (1 - sc) * 1100);
  haitang(A, 540, 1120, 300, 1);
  petal(A.ink, 560, 1130, 1.4, .4 + Math.sin(t) * .1, 1, 11);
  // the railing around the pool: posts and a top rail, an ellipse
  const rail = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; rail.push([540 + Math.cos(a) * 420, 1130 + Math.sin(a) * 250]); }
  for (let k = 0; k < 4; k++) draw(A.ink, mk(rail.slice(k * 10, k * 10 + 11).map(p => [p[0], p[1] - 46]), { w: 4, tone: .7, dry: .45, prof: 'even', seed: 980 + k }), 1, 1);
  for (let i = 0; i < 40; i += 2) draw(A.ink, mk([[rail[i][0], rail[i][1] - 46], [rail[i][0], rail[i][1] + 4]], { w: 3, tone: .6, dry: .4, prof: 'even', seed: 990 + i }), 1, .9);
  // visitors: behind the rail (small, front) and in front of it (larger, backs to us)
  const far = [[230, 870, { cap: 1, phone: 1 }], [380, 850, { phone: 1 }], [700, 850, { stick: 1 }], [860, 880, { flag: 1, cap: 1 }]];
  far.forEach(([x, y, o], i) => tourist(A.ink, x, y, 1.5, { ...o, front: 1, seed: 60 + i, am: .75 }));
  const near = [[150, 1560, { pack: 1, phone: 1, cap: 1 }], [470, 1600, { phone: 1 }], [800, 1580, { pack: 1, phone: 1 }], [980, 1640, { cap: 1 }]];
  near.forEach(([x, y, o], i) => tourist(A.ink, x, y, 3.2, { ...o, seed: 70 + i }));
  A.xf(1, 0, 0);
  writeCols(A, TMP, ['华清池'], 960, 210, 140, seg(t, HIT.wide + .3, HIT.wide + 1.8), {});
  if (t > HIT.seal) titleSeal(A.cc, 900, 690, 110, clamp((t - HIT.seal) / .15));
  return { paper: [0, 0, 1], bleed: 6, rim: .8 };
};

const ORDER = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12', 's13'];
// transitions into each shot: ink bloom [duration, cx, cy] or null for a cut
const BLOOM = { s2: [.8, 540, 600], s3: [.8, 540, 1300], s4: [.6, 900, 900], s5: [.8, 540, 960], s6: [.5, 540, 900], s9: [.6, 540, 900], s10: [.8, 900, 960], s11: [.8, 540, 1200], s12: [.8, 540, 900], s13: [.8, 540, 1050] };
export function shotAt(t) { let id = 's1'; for (const k of ORDER) if (t >= SH[k]) id = k; return id; }
export function frame(t, A, B, TMP) {
  const id = shotAt(t), bl = BLOOM[id];
  if (bl && t < SH[id] + bl[0]) {
    const prev = ORDER[ORDER.indexOf(id) - 1];
    const oa = S[prev](A, t, TMP), ob = S[id](B, t, TMP), u = (t - SH[id]) / bl[0];
    return { ...oa, paperB: ob.paper, bleedB: ob.bleed, rimB: ob.rim, trans: [bl[1], bl[2], 20 + 2600 * ss(u), 1], _id: id, _inB: true };
  }
  return { ...S[id](A, t, TMP), _id: id };
}
// subtitle spots per line [x, y, size]
export const SUBPOS = {
  v01: [150, 1620], v02: [150, 1620], v03: [150, 1180], v04: [120, 1700], v05: [150, 1780], v06: [120, 1010],
  v07: [150, 1680], v08: [150, 1700], v09: [150, 1700], v10: [150, 420], v11: [400, 1700], v12: [120, 1720], v13: [100, 1720], v14: [100, 1780],
};
