// Covers for 《窄门》: the narrows from ~190 km, the measured crossing, the lanes in their own colour, the title.
// Laid out from the page size, so one page serves every platform:
//   node core/render/still.mjs films/hormuz/cover 0 --size 1080x1440   (小红书 / 视频号 3:4)
//   node core/render/still.mjs films/hormuz/cover 0 --size 1080x1920   (抖音 9:16)
//   node core/render/still.mjs films/hormuz/cover 0 --size 1920x1080   (横版 16:9)
import { Engine, makeCamera, project } from '../engine.js';
import { C, text, hair, readout } from '../overlay.js';

const W = innerWidth, H = innerHeight, S = Math.min(W, H) / 1080;
const gc = document.getElementById('gl'), oc = document.getElementById('ov');
gc.width = oc.width = W; gc.height = oc.height = H;
const gl = new Engine(gc), ctx = oc.getContext('2d');
const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(src)); i.src = src; });
const json = src => fetch(src).then(r => r.json());
const LANE = { lon0: 56.4, lat0: 26.571, slope: 0.06, half: 4.8 / 110.6 };
const laneLat = (lon, off) => LANE.lat0 + LANE.slope * (lon - LANE.lon0) + off / 110.6;
const P2 = (cam, ll) => project(cam, ll[1], ll[0]);

async function init() {
  const [P, M, S2] = await Promise.all([json('../assets/plates/plates.json'), json('../assets/measure.json'), json('../assets/s2ships.json')]);
  const names = ['world', 'me', 'strait', 'narrows', 'det', 'qatar'];
  const imgs = await Promise.all([...names.map(n => load(`../assets/plates/${n}.jpg`)), load('../assets/plates/narrows_w.png')]);
  names.forEach((n, i) => gl.upload(n, imgs[i])); gl.upload('narrows_w', imgs[6]);
  await Promise.all(['300 112px BC', '500 36px SC', '400 23px SC', '600 120px SS', '500 22px PM'].map(f => document.fonts.load(f, '窄门霍尔木兹海峡')));
  window.render = () => draw(P, M, S2);
  window.DUR = 1;
  window.READY = true;
}

function draw(P, M, S2) {
  const Q = M.oman_point, L = M.iran_point, km = M.km_great_circle;
  const portrait = H > W;
  // the crossing runs nearly north-south: in portrait it fills the middle of the frame; in landscape it sits left of centre
  const mid = [(Q[0] + L[0]) / 2, (Q[1] + L[1]) / 2];
  let cam = makeCamera({ lat: mid[1], lon: mid[0], d: 190, tilt: 0, heading: 0, sx: portrait ? -W * .08 : -W * .2, sy: 0, fov: 30 }, W, H);
  if (portrait) {   // fit: the crossing spans 34 % of the height, from 46 % (Larak) down to 80 % (Quoin)
    const span = () => P2(cam, Q)[1] - P2(cam, L)[1];
    const d = 190 * span() / (H * .34);
    cam = makeCamera({ lat: mid[1], lon: mid[0], d, tilt: 0, heading: 0, sx: -W * .08, sy: 0, fov: 30 }, W, H);
    const yl = P2(cam, L)[1];
    cam = makeCamera({ lat: mid[1], lon: mid[0], d, tilt: 0, heading: 0, sx: -W * .08, sy: H * .46 - yl, fov: 30 }, W, H);
  }
  gl.draw({ cam, a: [1, 1, 1, 0, 0], bbox: { me: P.me.bbox, strait: P.strait.bbox, narrows: P.narrows.bbox, det: P.det.bbox, qatar: P.qatar.bbox },
    grey: 1, laneCol: 1, lane: [LANE.lon0, LANE.lat0, LANE.slope, LANE.half], laneSpan: [55.9, 57.1], detail: .85, clarity: .45 });
  ctx.clearRect(0, 0, W, H);
  // legibility: a soft dark band where the title sits
  const g = portrait ? ctx.createLinearGradient(0, 0, 0, H * .45) : ctx.createLinearGradient(W, 0, W * .45, 0);
  g.addColorStop(0, 'rgba(4,7,9,.82)'); g.addColorStop(1, 'rgba(4,7,9,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const gb = ctx.createLinearGradient(0, H, 0, H * .78); gb.addColorStop(0, 'rgba(4,7,9,.7)'); gb.addColorStop(1, 'rgba(4,7,9,0)');
  ctx.fillStyle = gb; ctx.fillRect(0, H * .78, W, H * .22);

  // lanes (claim layer) and the ships of 2025-02-21
  for (const o of [-4.8, -1.6, 1.6, 4.8]) {
    hair(ctx, () => { let first = true; for (let lo = 55.95; lo <= 57.05; lo += .01) { const [x, y] = P2(cam, [lo, laneLat(lo, o)]); first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false; } }, { w: 2 * S, col: C.mapLine, alpha: .9, dash: [14 * S, 9 * S] });
  }
  for (const [lo, la] of S2.ships) { const [x, y] = P2(cam, [lo, la]); hair(ctx, () => ctx.arc(x, y, 5 * S, 0, 7), { w: 1.3 * S, alpha: .85 }); }
  // the measured crossing
  const [ax, ay] = P2(cam, Q), [bx, by] = P2(cam, L);
  hair(ctx, () => { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }, { w: 3 * S, halo: 5 * S });
  const len = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / len, ny = (bx - ax) / len;
  for (let k = 0; k <= Math.floor(km); k++) {
    const f = k / km, x = ax + (bx - ax) * f, y = ay + (by - ay) * f, r = (k % 5 === 0 ? 13 : 6) * S;
    hair(ctx, () => { ctx.moveTo(x - nx * r, y - ny * r); ctx.lineTo(x + nx * r, y + ny * r); }, { w: 1.5 * S });
  }
  for (const [x, y] of [[ax, ay], [bx, by]]) hair(ctx, () => { ctx.moveTo(x - nx * 18 * S, y - ny * 18 * S); ctx.lineTo(x + nx * 18 * S, y + ny * 18 * S); }, { w: 2.4 * S });
  text(ctx, '大昆岛 · 阿曼', ax + 24 * S, ay + 40 * S, { font: `500 ${Math.round(30 * S)}px SC`, track: 1 });
  text(ctx, '拉腊克岛 · 伊朗', bx + 24 * S, by - 22 * S, { font: `500 ${Math.round(30 * S)}px SC`, track: 1 });
  // the reading beside the line
  const rx = Math.max(ax, bx) + (portrait ? 60 : 90) * S, ry = (ay + by) / 2 + 40 * S;
  text(ctx, '最窄处 · 卫星实测', rx, ry - 118 * S, { font: `500 ${Math.round(30 * S)}px SC`, track: 1 });
  const w = text(ctx, km.toFixed(1), rx - 4 * S, ry, { font: `300 ${Math.round(150 * S)}px BC`, col: C.amber, halo: 14 * S, track: -1 });
  text(ctx, 'km', rx + w + 10 * S, ry, { font: `400 ${Math.round(54 * S)}px BC`, col: C.amber, halo: 8 * S });

  // title block
  const tx = portrait ? 72 * S : W * .58, ty = portrait ? H * .14 + 60 * S : 300 * S;
  text(ctx, '窄门', tx, ty, { font: `600 ${Math.round(190 * S)}px SS`, track: 30 * S, halo: 20 * S });
  text(ctx, '霍尔木兹海峡', tx + 6 * S, ty + 82 * S, { font: `500 ${Math.round(46 * S)}px SC`, track: 12 * S, halo: 10 * S });
  const hy = ty + (portrait ? 190 : 200) * S;
  text(ctx, '全世界 1/5 的石油', tx + 4 * S, hy, { font: `500 ${Math.round(60 * S)}px SC`, col: C.amber, track: 2 * S, halo: 12 * S });
  text(ctx, '每天挤过这扇门', tx + 4 * S, hy + 80 * S, { font: `500 ${Math.round(60 * S)}px SC`, col: C.amber, track: 2 * S, halo: 12 * S });
  // instruments
  text(ctx, 'Landsat 9 · USGS · 2025-01-25 · 航道依 2025-02-21 Sentinel-2 船只', W - 40 * S, H - 40 * S, { font: `400 ${Math.round(20 * S)}px SC`, col: 'rgba(242,245,246,.8)', align: 'right' });
}
init().catch(e => { console.error(e); throw e; });
