// 《窄门》 The Narrow Door — the Strait of Hormuz, Satellite Briefing.
// render(t) is a pure function of t: camera from keyframes, plates by altitude, every mark through
// the one camera (engine.project), so annotations stay glued to the ground.
import { clamp, lerp, seg, ss, eio, eo, ei, back } from '/core/lib.js';
import { Engine, makeCamera, project } from './engine.js';
import { C, text, measure, hair, pathLL, brackets, tick, readout, subtitle, SUB, beginTexts, endTexts } from './overlay.js';
import { BEAT, DUR, SEC, HIT, LINES, EST_CPS } from './timeline.js';

const W = 1920, H = 1080;
const gl = new Engine(document.getElementById('gl'));
const cv = document.getElementById('ov'), ctx = cv.getContext('2d');

const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('image ' + src)); i.src = src; });
const json = src => fetch(src).then(r => { if (!r.ok) throw new Error(src); return r.json(); });
let P, M, S2, VOICE = null;

// ------------------------------------------------------------------ places [lon, lat]
const SHIP = [56.4955, 26.5453];                 // tanker measured on Sentinel-2, 2025-02-21 (assets/raw/s2/det.npz)
let QUOIN, LARAK, KM;                            // narrowest crossing, from assets/measure.json
const STRAIT = [56.45, 26.45];
const RASLAFFAN = [51.55, 25.91];
const LANE = { lon0: 56.4, lat0: 26.571, slope: 0.06, half: 4.8 / 110.6 };   // separation zone centre (fitted to the ships of 2025-02-21) and half width of the lane band
const laneLat = (lon, off) => LANE.lat0 + LANE.slope * (lon - LANE.lon0) + off / 110.6;   // off in km north of the centre line
// pipelines (schematic routes between their real end points)
const PIPE_EW = [[49.68, 25.94], [48.2, 25.35], [46.6, 24.75], [44.6, 24.45], [42.0, 24.35], [39.8, 24.2], [38.06, 24.09]];
const PIPE_UAE = [[53.62, 23.83], [54.5, 24.15], [55.45, 24.62], [56.0, 24.92], [56.36, 25.12]];
// schematic sea routes to the four largest buyers
const R0 = [[56.55, 26.35], [57.4, 25.4], [58.6, 24.4]];
const ROUTES = {
  india: [...R0, [62.5, 23.4], [66.5, 22.6], [69.6, 22.45]],
  china: [...R0, [62, 21], [70, 14], [77.5, 7.0], [81, 5.6], [90, 5.8], [95.3, 6.0], [98.5, 4.3], [101.5, 2.4], [103.9, 1.3], [105.6, 2.8], [109, 8], [112.3, 13], [116, 19], [119.6, 23.6], [122.1, 27.8], [122.2, 29.9]],
  korea: [[119.6, 23.6], [122.1, 27.8], [124.6, 30.8], [127.6, 33.4], [129.4, 35.5]],
  japan: [[124.6, 30.8], [128.5, 31.2], [131.2, 31.4], [134.0, 33.1], [137.4, 34.3], [139.9, 35.4]],
};
const BUYERS = [['中国', [122.2, 29.9], 1], ['印度', [69.6, 22.45], 0], ['日本', [139.9, 35.4], 2], ['韩国', [129.4, 35.5], 3]];

// ------------------------------------------------------------------ camera
// keyframes: t, target [lon, lat], distance d (km, log-interpolated), tilt, heading, lens shift sx, sy
let KEYS;
function camKeys() {
  const mid = [(QUOIN[0] + LARAK[0]) / 2, (QUOIN[1] + LARAK[1]) / 2];
  return [
    { t: 0.0, ll: SHIP, d: 2.6, tilt: 0, hd: 0, sx: -200, sy: 10 },
    { t: HIT.climb, ll: SHIP, d: 2.25, tilt: 0, hd: 1.5, sx: -200, sy: 10, e: 'lin' },                 // slow push while the reading lands
    { t: 20.0, ll: [56.47, 26.55], d: 430, tilt: 0, hd: 0, sx: 0, sy: -30, e: 'climb' },               // signature: one climb, ship -> door
    { t: HIT.rangeStart, ll: QUOIN, d: 120, tilt: 0, hd: 0, sx: -330, sy: 190, e: 'io' },             // settle on the first island
    { t: HIT.rangeLand, ll: LARAK, d: 120, tilt: 0, hd: 0, sx: -330, sy: -170, e: 'track' },           // chase the tip north
    { t: SEC.hush1[1], ll: mid, d: 165, tilt: 0, hd: 0, sx: -330, sy: 0, e: 'io' },                    // the whole distance
    { t: 39.0, ll: [56.43, 26.57], d: 95, tilt: 0, hd: -3, sx: -120, sy: 40, e: 'io' },                // push to the lanes
    { t: SEC.lanes[1], ll: [56.45, 26.575], d: 84, tilt: 0, hd: -4, sx: -120, sy: 40, e: 'lin' },
    { t: 50.0, ll: STRAIT, d: 330, tilt: 0, hd: -2, sx: -260, sy: 0, e: 'io' },                        // locked frame on the door
    { t: HIT.whip, ll: [56.40, 26.44], d: 315, tilt: 0, hd: -4, sx: -260, sy: 0, e: 'lin' },           // creep + a slow turn
    { t: HIT.lng, ll: RASLAFFAN, d: 300, tilt: 0, hd: -4, sx: -260, sy: 0, e: 'whip' },                // whip west to Qatar
    { t: SEC.weight[1], ll: [51.53, 25.92], d: 285, tilt: 0, hd: -4, sx: -260, sy: 0, e: 'lin' },
    { t: 66.0, ll: [47.6, 25.2], d: 3000, tilt: 0, hd: 0, sx: -120, sy: 0, e: 'io' },                 // climb to the region: the bypass
    { t: SEC.hush2[1], ll: [47.8, 25.1], d: 2800, tilt: 0, hd: 0, sx: -120, sy: 0, e: 'lin' },
    { t: 89.0, ll: [98, 20], d: 9200, tilt: 20, hd: 0, sx: 0, sy: 40, e: 'io' },                     // back to orbit: the buyers
    { t: SEC.title[0], ll: [99, 20.5], d: 10200, tilt: 23, hd: 2, sx: 0, sy: 40, e: 'lin' },
    { t: DUR, ll: [98, 21], d: 12500, tilt: 26, hd: 4, sx: 0, sy: 40, e: 'lin' },
  ];
}
const EASE = { io: eio, lin: t => t, track: eio, whip: t => ss(ss(t)), climb: t => ss(t) };
function camAt(t) {
  let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const u = (EASE[b.e] || eio)(seg(t, a.t, b.t));
  const lg = Math.exp(lerp(Math.log(a.d), Math.log(b.d), u));
  const k = Math.abs(Math.log(b.d / a.d)) > 1.2 ? zoomFollow(a.d, b.d, lg) : u;   // big zooms: pan in step with the scale, the ground never skates
  return { lon: lerp(a.ll[0], b.ll[0], k), lat: lerp(a.ll[1], b.ll[1], k), d: lg, tilt: lerp(a.tilt, b.tilt, u), heading: lerp(a.hd, b.hd, u), sx: lerp(a.sx, b.sx, u), sy: lerp(a.sy, b.sy, u), fov: 30 };
}
function zoomFollow(d0, d1, d) { const s0 = 1 / d0, s1 = 1 / d1, s = 1 / d; return clamp((s - s0) / (s1 - s0)); }

// ------------------------------------------------------------------ loading
async function init() {
  [P, M, S2] = await Promise.all([json('assets/plates/plates.json'), json('assets/measure.json'), json('assets/s2ships.json')]);
  try { VOICE = await json('voice/dur.json'); } catch (e) { VOICE = null; }
  QUOIN = M.oman_point; LARAK = M.iran_point; KM = M.km_great_circle;
  const names = ['world', 'me', 'strait', 'narrows', 'det', 'qatar'];
  const imgs = await Promise.all([...names.map(n => load(`assets/plates/${n}.jpg`)), load('assets/plates/narrows_w.png')]);
  names.forEach((n, i) => gl.upload(n, imgs[i]));
  gl.upload('narrows_w', imgs[6]);
  KEYS = camKeys();
  await Promise.all(['300 112px BC', '400 40px BC', '400 22px PM', '500 22px PM', '500 36px SC', '400 23px SC', '500 28px SC', '600 120px SS'].map(f => document.fonts.load(f, '窄门霍尔木兹海峡0123')));
  window.EV = events();
  window.READY = true;
}

// ------------------------------------------------------------------ narration timing
function lineSpan(L, i) {
  const next = LINES[i + 1] ? LINES[i + 1].t : DUR;
  const dur = VOICE && VOICE[L.id] ? VOICE[L.id] : [...L.say].length / EST_CPS;
  return [L.t, Math.min(next - 0.12, L.t + Math.max(1.8, dur + 0.6))];
}
export function cues() { return LINES.map((L, i) => { const [t0, t1] = lineSpan(L, i); return { id: L.id, t0, t1, text: L.zh }; }); }

// ------------------------------------------------------------------ helpers
const P2 = (cam, ll) => project(cam, ll[1], ll[0]);
const fade = (t, a, b, fi = .35, fo = .35) => Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b));
function groundLabel(cam, ll, s, { dx = 18, dy = -18, alpha = 1, id, size = 30, col = C.ink, dot = true, align = 'left' } = {}) {
  const [x, y, vis] = P2(cam, ll); if (!vis || alpha <= 0.003) return;
  if (dot) hair(ctx, () => { ctx.arc(x, y, 4, 0, Math.PI * 2); }, { w: 1.6, alpha });
  if (dot) hair(ctx, () => { ctx.moveTo(x + 4, y - 4); ctx.lineTo(x + dx * .8, y + dy * .8); }, { w: 1.1, alpha: alpha * .8 });
  text(ctx, s, x + dx, y + dy, { font: `500 ${size}px SC`, col, track: 1, alpha, id, align });
}
function reticle(x, y, r, a, snap = 1) {
  const k = r * (1 + 0.5 * (1 - back(snap, 2.2)));
  brackets(ctx, x - k, y - k, x + k, y + k, { len: k * .42, w: 1.8, alpha: a });
  tick(ctx, x, y, 7, { alpha: a * .9 });
}
// a hairline from A to B (lon/lat), grown to fraction u, with ticks every `step` km
function rangeLine(cam, A, B, u, km, step, alpha) {
  const [ax, ay, va] = P2(cam, A), [bx, by] = P2(cam, B);
  if (!va) return [ax, ay];
  const x = lerp(ax, bx, u), y = lerp(ay, by, u);
  hair(ctx, () => { ctx.moveTo(ax, ay); ctx.lineTo(x, y); }, { w: 2.4, alpha, halo: 4 });
  const L = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / L, ny = (bx - ax) / L;
  for (let k = step; k < km * u; k += step) {
    const f = k / km, px = lerp(ax, bx, f), py = lerp(ay, by, f), big = k % (step * 5) === 0;
    hair(ctx, () => { ctx.moveTo(px - nx * (big ? 12 : 6), py - ny * (big ? 12 : 6)); ctx.lineTo(px + nx * (big ? 12 : 6), py + ny * (big ? 12 : 6)); }, { w: 1.3, alpha });
  }
  hair(ctx, () => { ctx.moveTo(ax - nx * 14, ay - ny * 14); ctx.lineTo(ax + nx * 14, ay + ny * 14); }, { w: 2, alpha });
  if (u >= 1) hair(ctx, () => { ctx.moveTo(bx - nx * 14, by - ny * 14); ctx.lineTo(bx + nx * 14, by + ny * 14); }, { w: 2, alpha });
  return [x, y];
}
function polyGrow(cam, line, u, style) {     // a lon/lat polyline drawn on to fraction u of its length
  if (u <= 0) return null;
  const pts = line.map(p => P2(cam, p));
  let tot = 0; const segs = [];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); tot += l; }
  let tip = pts[0];
  hair(ctx, () => {                            // called twice (halo, then line): keep the length local
    let left = tot * clamp(u);
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const f = Math.min(1, left / segs[i - 1]);
      tip = [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
      ctx.lineTo(tip[0], tip[1]); left -= segs[i - 1];
    }
  }, style);
  return tip;
}
const fmtInt = n => Math.round(n).toString();

// ------------------------------------------------------------------ instruments (screen space only)
function instruments(cam, t, a) {
  if (a <= 0.003) return;
  const alt = cam.alt;
  const s = alt < 10 ? alt.toFixed(2) : alt < 1000 ? alt.toFixed(0) : Math.round(alt).toLocaleString('en-US');
  text(ctx, 'ALT', 96, 92, { font: '500 22px PM', col: C.inkDim, alpha: a, track: 2 });
  text(ctx, s + ' km', 160, 92, { font: '500 22px PM', alpha: a, track: 1, id: 'alt', rep: 'ALT km' });
  // scale bar: a round length near 180 px at the target
  const kmpx = (cam.alt) / cam.F;
  const raw = 180 * kmpx, p10 = Math.pow(10, Math.floor(Math.log10(raw)));
  const nice = [1, 2, 5, 10].map(m => m * p10).reduce((b, v) => Math.abs(v - raw) < Math.abs(b - raw) ? v : b);
  const px = nice / kmpx;
  hair(ctx, () => { ctx.moveTo(96, 128); ctx.lineTo(96 + px, 128); ctx.moveTo(96, 121); ctx.lineTo(96, 135); ctx.moveTo(96 + px, 121); ctx.lineTo(96 + px, 135); }, { w: 1.6, alpha: a });
  const lab = nice < 1 ? Math.round(nice * 1000) + ' m' : nice + ' km';
  text(ctx, lab, 96 + px + 14, 136, { font: '400 22px PM', alpha: a, id: 'scale', rep: 'km' });
  // imagery credit, from the finest plate on screen
  const cr = alt < 14 ? 'Sentinel-2 · Contains modified Copernicus Sentinel data 2025' : alt < 900 ? 'Landsat 8/9 · USGS · 2025-01' : 'Blue Marble · NASA';
  text(ctx, cr, W - 96, H - 64, { font: '400 22px PM', col: 'rgba(242,245,246,.78)', alpha: a, align: 'right', id: 'credit', rep: 'credit' });
}

// ------------------------------------------------------------------ the frame
function render(t) {
  beginTexts();
  const k = camAt(t);
  const cam = makeCamera(k, W, H);
  const alt = cam.alt;
  // plates by altitude: detail below ~12 km, narrows below ~200 km
  const a4 = 1 - ss(seg(alt, 9, 16)), a3 = 1 - ss(seg(alt, 180, 320)), a5 = 1 - ss(seg(alt, 500, 900)), a2 = 1 - ss(seg(alt, 1600, 2600)), a1 = 1;
  // grade: grey in the analysis, true colour from the climb back to orbit
  const grey = 1 - ss(seg(t, HIT.colour, HIT.colour + 2.4));
  const laneCol = ss(seg(t, HIT.lane2, HIT.lane2 + 1.2)) * (1 - ss(seg(t, 47, 49)));
  const whip = seg(t, HIT.whip, HIT.lng);
  const blur = Math.sin(Math.PI * whip) * 70;
  gl.draw({
    cam, a: [a1, a2, a3, a4, a5], bbox: { me: P.me.bbox, strait: P.strait.bbox, narrows: P.narrows.bbox, det: P.det.bbox, qatar: P.qatar.bbox },
    grey, laneCol, lane: [LANE.lon0, LANE.lat0, LANE.slope, LANE.half], laneSpan: [56.18, 56.80],
    shade: ss(seg(alt, 1500, 6000)), expo: 1.0, detail: alt < 14 ? 0.5 : alt < 90 ? 0.35 : alt < 900 ? 0.85 : 0.4, clarity: alt < 14 ? 0.25 : alt < 90 ? 0.3 : alt < 900 ? 0.45 : 0.12, contrast: alt < 14 ? 1.15 : 1,
    blur, blurVec: [1, 0], dim: 0.55 * ss(seg(t, HIT.open, HIT.open + 1.2)),
    scan: t < 1.9 ? lerp(SHIP[1] + 0.03, SHIP[1] - 0.03, eo(seg(t, HIT.scanIn, 1.9))) : -90, scanGlow: 1 - seg(t, 1.6, 1.9),
    focus: [RASLAFFAN[0], RASLAFFAN[1], 0.32], focusDim: 0.6 * ss(seg(t, HIT.lng, HIT.lng + .8)) * (1 - ss(seg(t, SEC.bypass[0], SEC.bypass[0] + 1.5))),
  });
  ctx.clearRect(0, 0, W, H);
  const fadeIn = seg(t, 0.4, 1.4);

  // ---- 1. the ship: reticle locks, the length is read
  {
    const a = fade(t, HIT.lock - .2, 11.5, .2, 1.2);
    if (a > 0) {
      const [x, y] = P2(cam, SHIP);
      const r = Math.max(26, 230 * Math.min(1, 2.4 / alt));
      reticle(x, y, r, a, seg(t, HIT.lock, HIT.lock + .5));
    }
    const ra = fade(t, HIT.shipLabel, HIT.climb + 0.8, .3, .6);
    if (ra > 0) {
      const [x, y] = P2(cam, SHIP);
      const hl = 0.160 / (cam.alt / cam.F);          // half the ship, in px (320 m long, east-west)
      hair(ctx, () => { ctx.moveTo(x - hl, y + 70); ctx.lineTo(x + hl, y + 70); ctx.moveTo(x - hl, y + 60); ctx.lineTo(x - hl, y + 80); ctx.moveTo(x + hl, y + 60); ctx.lineTo(x + hl, y + 80); }, { w: 1.6, alpha: ra * eo(seg(t, HIT.shipLabel, HIT.shipLabel + .5)) });
      const v = 320 * eo(seg(t, HIT.shipLabel, HIT.shipLabel + 1.0));
      readout(ctx, 1270, 470, { label: '船长', value: fmtInt(v), unit: 'm', note: 'Sentinel-2 · 2025-02-21 · 实测', alpha: ra, id: 'r-ship', rep: '320' });
    }
  }
  // ---- 2. the climb: ships of that day, the door, its name
  {
    const a = fade(t, 11.0, 23.0, .8, .8) * ss(seg(alt, 6, 20));
    if (a > 0) for (const [lo, la] of S2.ships) {
      const [x, y, v] = project(cam, la, lo); if (!v) continue;
      hair(ctx, () => { ctx.arc(x, y, 6, 0, Math.PI * 2); }, { w: 1.3, alpha: a * .85 });
    }
    const na = fade(t, HIT.name, 22.8, .6, .6);
    groundLabel(cam, [56.78, 26.66], '霍尔木兹海峡', { dot: false, size: 40, alpha: na * eo(seg(t, HIT.name, HIT.name + .8)), id: 'g-name' });
    const ca = fade(t, 17.0, 22.8, .6, .6);
    groundLabel(cam, [57.05, 27.05], '伊朗', { dot: false, size: 30, alpha: ca, id: 'g-iran', col: C.inkDim });
    groundLabel(cam, [56.12, 26.05], '阿曼', { dot: false, size: 30, alpha: ca, id: 'g-oman', col: C.inkDim, align: 'right' });
    groundLabel(cam, [55.75, 26.95], '波斯湾', { dot: false, size: 26, alpha: ca, id: 'g-gulf', col: C.inkDim, align: 'right' });
    groundLabel(cam, [57.25, 25.9], '阿曼湾', { dot: false, size: 26, alpha: ca, id: 'g-goo', col: C.inkDim });
  }
  // ---- 3. the range line: Great Quoin -> Larak
  {
    const a = fade(t, HIT.rangeStart - .5, SEC.lanes[0] + 2.5, .4, .8);
    if (a > 0) {
      const u = eio(seg(t, HIT.rangeStart + .3, HIT.rangeLand));
      const [qx, qy] = P2(cam, QUOIN);
      reticle(qx, qy, 30, a * (1 - seg(t, HIT.rangeLand, HIT.rangeLand + 1)), seg(t, HIT.rangeStart - .4, HIT.rangeStart + .1));
      const tip = rangeLine(cam, QUOIN, LARAK, u, KM, 1, a);
      if (u > 0 && u < 1) reticle(tip[0], tip[1], 18, a, 1);
      groundLabel(cam, QUOIN, '大昆岛 · 阿曼', { dx: 26, dy: 40, alpha: a * seg(t, HIT.rangeStart, HIT.rangeStart + .5), id: 'g-quoin', size: 28 });
      groundLabel(cam, LARAK, '拉腊克岛 · 伊朗', { dx: 26, dy: -26, alpha: a * seg(t, HIT.rangeLand - .4, HIT.rangeLand), id: 'g-larak', size: 28 });
      const ra = a * seg(t, HIT.rangeStart + .3, HIT.rangeStart + .8);
      const v = KM * eo(seg(t, HIT.rangeStart + .3, HIT.rangeLand));
      readout(ctx, 1270, 470, { label: '最窄处', value: v.toFixed(1), unit: 'km', note: 'Landsat 9 · 2025-01-25 · 实测', alpha: ra * (1 - seg(t, SEC.lanes[0] - .3, SEC.lanes[0] + .2)), id: 'r-km', rep: KM.toFixed(1), dim: t < HIT.rangeLand ? 0.6 : 1 });
    }
  }
  // ---- 4. the lanes: the claim layer (blue, dashed), the ships of that day, the reading
  {
    const a = fade(t, HIT.lane1 - .2, SEC.weight[0] + 1.2, .3, .8);
    if (a > 0) {
      const lanes = [[-4.8, -1.6, HIT.lane1], [1.6, 4.8, HIT.lane2]];
      for (const [o0, o1, t0] of lanes) {
        const u = eio(seg(t, t0, t0 + 1.4));
        for (const o of [o0, o1]) {
          const L = []; for (let lo = 56.18; lo <= 56.80; lo += 0.01) L.push([lo, laneLat(lo, o)]);
          const n = Math.max(2, Math.round(L.length * u));
          hair(ctx, () => pathLL(ctx, cam, L.slice(0, n)), { w: 2, col: C.mapLine, alpha: a * .95, dash: [14, 9] });
        }
        // direction arrow in the middle of the lane
        const om = (o0 + o1) / 2, dir = om < 0 ? 1 : -1;     // southern lane outbound (east), northern inbound (west)
        const [x0, y0] = P2(cam, [56.62 - dir * .03, laneLat(56.62 - dir * .03, om)]), [x1, y1] = P2(cam, [56.62 + dir * .03, laneLat(56.62 + dir * .03, om)]);
        const aa = a * seg(t, t0 + 1.0, t0 + 1.5);
        hair(ctx, () => { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); const ang = Math.atan2(y1 - y0, x1 - x0); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 14 * Math.cos(ang - .5), y1 - 14 * Math.sin(ang - .5)); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 14 * Math.cos(ang + .5), y1 - 14 * Math.sin(ang + .5)); }, { w: 2, col: C.mapLine, alpha: aa });
        const [lx, ly] = P2(cam, [56.24, laneLat(56.24, om)]);
        text(ctx, om < 0 ? '出' : '进', lx, ly + 10, { font: '500 28px SC', col: C.mapLine, alpha: aa, id: 'lane' + (om < 0 ? 'out' : 'in') });
      }
      const sa = a * seg(t, HIT.lane1 + .6, HIT.lane1 + 1.4);
      for (const [lo, la] of S2.ships) {
        const [x, y, v] = project(cam, la, lo); if (!v) continue;
        hair(ctx, () => { ctx.arc(x, y, 5, 0, Math.PI * 2); }, { w: 1.3, alpha: sa * .9 });
      }
      const ra = a * seg(t, HIT.laneRead - .2, HIT.laneRead + .3);
      readout(ctx, 1270, 300, { label: '每条航道宽', value: '≈3', unit: 'km', note: '航道位置：2025-02-21 船只 · 宽度：EIA', alpha: ra * (1 - seg(t, SEC.weight[0] - .4, SEC.weight[0])), id: 'r-lane', col: C.amber });
    }
  }
  // ---- 5. the weight: one reading per screen, then the whip to Qatar
  {
    const ra = fade(t, HIT.count - .2, HIT.share - .1, .3, .3);
    const v = 2000 * eo(seg(t, HIT.count, HIT.count + 1.6));
    readout(ctx, 1270, 470, { label: '2024 年平均每天通过', value: fmtInt(v) + '万', unit: '桶', note: 'EIA, 2025-06', alpha: ra, id: 'r-flow', rep: '2000万', dim: t < HIT.count + 1.6 ? .6 : 1 });
    const sa = fade(t, HIT.share, HIT.whip + .1, .3, .25);
    readout(ctx, 1270, 470, { label: '约占全球石油消费', value: '1/5', note: 'EIA, 2025-06', alpha: sa, id: 'r-share' });
    const la = fade(t, HIT.lng + .3, SEC.bypass[0] + .3, .3, .4);
    readout(ctx, 1270, 470, { label: '全球液化天然气贸易', value: '≈1/5', note: 'EIA, 2025-06 · 主要来自卡塔尔', alpha: la, id: 'r-lng' });
    groundLabel(cam, RASLAFFAN, '拉斯拉凡 · 卡塔尔', { dx: 22, dy: -22, alpha: la, id: 'g-rl' });
    const lockA = fade(t, HIT.lng, SEC.bypass[0] + .3, .2, .4);
    if (lockA > 0) { const [x, y] = P2(cam, RASLAFFAN); reticle(x, y, 34, lockA, seg(t, HIT.lng, HIT.lng + .5)); }
  }
  // ---- 6. the bypass: two pipelines (schematic), the spare capacity
  {
    const a = fade(t, HIT.pipes - .2, SEC.hush2[1] + .6, .3, .8);
    if (a > 0) {
      const st = { w: 3, col: C.mapLine, alpha: a, dash: [12, 8] };
      const t1 = polyGrow(cam, PIPE_EW, eio(seg(t, HIT.pipes, HIT.pipes + 2.4)), st);
      const t2 = polyGrow(cam, PIPE_UAE, eio(seg(t, HIT.pipes + 1.4, HIT.pipes + 2.8)), st);
      const la = a * seg(t, HIT.pipes + 2.2, HIT.pipes + 2.8);
      groundLabel(cam, PIPE_EW[PIPE_EW.length - 1], '延布', { dx: -16, dy: 44, alpha: la, id: 'g-yanbu', align: 'right', size: 28 });
      groundLabel(cam, PIPE_EW[0], '阿布盖格', { dx: -18, dy: -22, alpha: la, id: 'g-abq', align: 'right', size: 28 });
      groundLabel(cam, PIPE_UAE[PIPE_UAE.length - 1], '富查伊拉', { dx: 20, dy: 34, alpha: la, id: 'g-fuj', size: 28 });
      text(ctx, '输油管道（示意走向）', 96, 200, { font: '400 23px SC', col: C.mapLine, alpha: la, id: 'pipe-legend' });
      const [hx, hy] = P2(cam, [56.45, 26.45]);
      reticle(hx, hy, 16, a * seg(t, HIT.pipes, HIT.pipes + .4), 1);
      groundLabel(cam, [56.45, 26.45], '海峡', { dx: 22, dy: -26, dot: false, alpha: la, id: 'g-door', size: 28 });
    }
    const ra = fade(t, HIT.spare - .2, SEC.hush2[0] + 1.2, .3, .6);
    const v = 260 * eo(seg(t, HIT.spare, HIT.spare + 1.4));
    readout(ctx, 1270, 800, { label: '断航时可调用的绕行余量', value: fmtInt(v) + '万', unit: '桶/天', note: 'EIA 估计 · 对比日均 2000 万桶', alpha: ra * (1 - seg(t, HIT.eighth - .3, HIT.eighth)), id: 'r-spare', rep: '260万', dim: t < HIT.spare + 1.4 ? .6 : 1 });
    const ea = fade(t, HIT.eighth, SEC.hush2[0] + 1.6, .25, .6);
    readout(ctx, 1270, 800, { label: '只够顶上日常运量的', value: '≈13%', note: '260 万 ÷ 2000 万', alpha: ea, id: 'r-eighth' });
  }
  // ---- 7. orbit: the routes to the buyers
  {
    const a = fade(t, HIT.routes - .2, SEC.title[0] + 1.0, .3, 1.0);
    if (a > 0) {
      const st = { w: 1.8, col: 'rgba(242,245,246,.9)', alpha: a * .9, dash: [10, 7] };
      const g = k2 => eio(seg(t, HIT.routes + k2, HIT.routes + k2 + 3.6));
      polyGrow(cam, ROUTES.india, g(0), st);
      polyGrow(cam, ROUTES.china, g(0.3), st);
      polyGrow(cam, ROUTES.korea, g(2.4), st);
      polyGrow(cam, ROUTES.japan, g(2.8), st);
      text(ctx, '航线示意', 96, 200, { font: '400 23px SC', col: C.inkDim, alpha: a * seg(t, HIT.routes, HIT.routes + .6), id: 'route-legend' });
      for (const [name, ll, i] of BUYERS) {
        const ba = a * seg(t, HIT.buyers + i * .5, HIT.buyers + i * .5 + .4);
        groundLabel(cam, ll, name, { dx: 16, dy: -16, alpha: ba, id: 'g-' + i, size: 32 });
      }
    }
    const ra = fade(t, HIT.routes + .2, HIT.relock - .1, .3, .5);
    readout(ctx, 1270, 470, { label: '经海峡的原油运往亚洲', value: '84%', note: 'EIA, 2024 年数据', alpha: ra, id: 'r-asia' });
  }
  // ---- 8. the relock and the title
  {
    const a = fade(t, HIT.relock, DUR + 1, .2, .1);
    if (a > 0) {
      const [x, y] = P2(cam, [56.45, 26.45]);
      const open = eio(seg(t, HIT.open, HIT.open + 1.3));
      const r = 26;
      if (open <= 0) reticle(x, y, r, a, seg(t, HIT.relock, HIT.relock + .5));
      else {   // the brackets open out into the title frame
        const fx0 = 600, fy0 = 330, fx1 = 1320, fy1 = 750;
        brackets(ctx, lerp(x - r, fx0, open), lerp(y - r, fy0, open), lerp(x + r, fx1, open), lerp(y + r, fy1, open), { len: lerp(11, 44, open), w: 1.8, alpha: a });
        const ta = seg(t, HIT.open + .9, HIT.open + 1.8);
        text(ctx, '窄门', 960, 548, { font: '600 120px SS', align: 'center', alpha: ta, track: 24, id: 'title', halo: 16 });
        text(ctx, '霍尔木兹海峡', 960, 622, { font: '500 36px SC', align: 'center', alpha: ta, track: 10, id: 'subtitle-card' });
        text(ctx, '数据：EIA（2025）· 影像：USGS Landsat，Copernicus Sentinel-2，NASA Blue Marble', 960, 700, { font: '400 22px SC', col: 'rgba(242,245,246,.75)', align: 'center', alpha: seg(t, HIT.open + 1.6, HIT.open + 2.4), id: 'sources' });
      }
      groundLabel(cam, [56.45, 26.45], '海峡', { dx: 22, dy: -24, dot: false, alpha: a * (1 - open) * seg(t, HIT.relock + .3, HIT.relock + .8), id: 'g-door2', size: 28 });
    }
  }
  instruments(cam, t, fadeIn * (1 - seg(t, HIT.open, HIT.open + .8)));
  // subtitles
  LINES.forEach((L, i) => { const [t0, t1] = lineSpan(L, i); const sa = fade(t, t0, t1, .15, .2); if (sa > 0) subtitle(ctx, L.zh, sa, L.id); });
  return endTexts();
}

// ------------------------------------------------------------------ sound and cue events
function events() {
  const E = [];
  for (const [k, v] of Object.entries(HIT)) E.push({ t: v, type: k });
  for (const L of LINES) E.push({ t: L.t, type: 'voice', id: L.id });
  return E.sort((a, b) => a.t - b.t);
}

window.DUR = DUR;
window.render = t => { render(t); };
window.TEXTS = t => render(t);
window.CUES = () => cues();
init().catch(e => { console.error(e); throw e; });
