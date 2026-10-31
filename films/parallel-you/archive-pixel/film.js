// 《另一个你》 — Tegmark's level-I argument told as a two-player game, 180×320 indexed pixels ×6 = 1080×1920.
// render(t) is a pure function of t. Key text and the dialog box stay inside the platforms' safe band (y 40–235, x 6–174).
import { W, H, FB, C, T, LUT, makeOut, mosaic, bayer, hash, clamp, eio, eo } from './px.js';
import { win, hand } from './ui.js';
import { initFont, text, textW, textOutlined, wrap } from './font.js';
import { you } from './you.js';
import { DUR, HIT, LINES } from './timeline.js';

const q = new URLSearchParams(location.search);
const fb = new FB(), out = makeOut(document.getElementById('c'));
let VDUR = {};
const room1 = new FB(W, 64);
let TX = [];                       // texts on screen at t (for readcheck), in output pixels

// ------------------------------------------------------------------ subtitles: the dialog box (one box, the next cuts the previous)
function spans() {
  return LINES.map((L, i) => {
    const next = LINES[i + 1] ? LINES[i + 1].t : DUR;
    const d = VDUR[L.id] ?? 2;
    return { id: L.id, t0: L.t - .05, t1: Math.min(next - .05, L.t + Math.max(1.8, d + .65)), text: L.zh };
  });
}
const GOLDCH = new Set('0123456789×^%');
function dialog(t) {
  const s = spans().find(s => t >= s.t0 && t < s.t1); if (!s) return;
  const X = 6, Y = 190, Wd = 168, Hd = 44;
  win(fb, X, Y, Wd, Hd);
  const lines = wrap(s.text, Wd - 18);
  const n = Math.floor((t - s.t0) * 38);
  let used = 0;
  lines.slice(0, 2).forEach((ln, i) => {
    let x = X + 9; const y = Y + 7 + i * 15;
    for (const ch of ln) { if (used++ >= n) return; x += text(fb, ch, x, y, GOLDCH.has(ch) ? C.goldL : C.white, C.night); }
  });
  if (n >= s.text.length && Math.floor(t * 3) % 2 === 0) text(fb, '▼', X + Wd - 14, Y + Hd - 14, C.white);
}
// a labelled window (system messages); reports its text for readcheck
function label(s, x, y, t, col = C.white, id = s, minW = 0) {
  const w = Math.max(minW, textW(s) + 14);
  win(fb, x, y, w, 20);
  text(fb, s, x + 7, y + 4, col, C.night);
  TX.push({ id, text: s, x0: x * 6, y0: y * 6, x1: (x + w) * 6, y1: (y + 20) * 6 });
  return w;
}
function caption(s, x, y, col = C.white, id = s, sc = 1, outlineC = C.ink) {
  const w = sc > 1 ? textOutlined(fb, s, x, y, col, outlineC, sc) : text(fb, s, x, y, col, C.ink);
  TX.push({ id, text: s, x0: x * 6, y0: y * 6, x1: (x + w) * 6, y1: (y + 14 * sc) * 6 });
}

// ------------------------------------------------------------------ the room (identical for 1P and 2P)
function stars(f, x0, y0, w, h, n, seed, t) {
  for (let k = 0; k < n; k++) {
    const x = x0 + Math.floor(hash(k, seed) * w), y = y0 + Math.floor(hash(k, seed + 7) * h);
    const tw = Math.floor(t * 4 + k) % 7 === 0;
    f.px(x, y, tw ? C.steel : C.white);
  }
}
function drawRoom(f, t, o = {}) {
  const w = f.w, h = f.h;
  f.gradV(0, 0, w, h - 10, [C.dslate, C.night, C.night]);
  for (let x = 0; x < w; x++) for (let y = h - 10; y < h; y++) f.px(x, y, (x + (y % 2) * 7) % 14 === 0 ? C.umber : y === h - 10 ? C.brown : C.dbrown);
  // window with the night sky
  f.rect(10, 8, 34, 26, C.ink); f.rect(11, 9, 32, 24, C.steel); f.gradV(12, 10, 30, 22, [C.night, C.navy]);
  stars(f, 12, 10, 30, 22, 9, 3, t); f.disc(36, 15, 3, C.sand); f.disc(37, 14, 2.5, C.navy);
  f.vline(27, 10, 31, C.steel); f.hline(12, 41, 21, C.steel);
  // a lamp and its warm pool on the wall (index stepping: two Bayer rings)
  f.rect(54, h - 22, 8, 12, C.dbrown); f.rect(52, h - 30, 12, 6, C.amber); f.rect(53, h - 24, 10, 1, C.orange);
  for (let y = h - 46; y < h - 10; y++) for (let x = 36; x < 82; x++) { const d = Math.hypot(x - 58, (y - (h - 28)) * 1.3); if (d < 20 && bayer(x, y) < .5 * (1 - d / 20)) { const c = f.get(x, y); if (c === C.night) f.px(x, y, C.dslate); else if (c === C.dslate) f.px(x, y, C.slate); } }
  // the bed
  f.rect(98, h - 26, 74, 16, C.ink); f.rect(99, h - 25, 72, 14, C.white); f.rect(99, h - 20, 72, 9, C.plum);
  for (let x = 99; x < 171; x++) for (let y = h - 20; y < h - 11; y++) if (bayer(x, y) < .25) f.px(x, y, C.rose);
  f.rect(150, h - 31, 18, 7, C.ink); f.rect(151, h - 30, 16, 5, C.white); f.rect(151, h - 26, 16, 1, C.silver);
  f.rect(100, h - 11, 3, 3, C.dbrown); f.rect(167, h - 11, 3, 3, C.dbrown);
  // a poster: a star chart
  f.rect(66, 8, 22, 26, C.ink); f.rect(67, 9, 20, 24, C.navy); stars(f, 68, 10, 18, 22, 7, 11, t * 0); f.line(70, 14, 76, 20, C.blue); f.line(76, 20, 83, 16, C.blue);
  // you, on the bed edge; the phone lights the face a little
  const blink = (t % 3.1) < .12, thumb = Math.floor(t * 4) % 6 === 0;
  const s = you({ look: o.look || 'down', blink, thumb: thumb ? 1 : 0, wave: o.wave || 0 });
  f.blit(s, 112, h - 40);
}
function blitScaled(dst, src, sx, sy, sw, sh, dx, dy, sc) {
  for (let y = 0; y < sh * sc; y++) for (let x = 0; x < sw * sc; x++) { const c = src.get(sx + Math.floor(x / sc), sy + Math.floor(y / sc)); if (c !== T) dst.px(dx + x, dy + y, c); }
}
function divider(y) { fb.hline(0, W - 1, y, C.ink); fb.hline(0, W - 1, y + 1, C.white); fb.hline(0, W - 1, y + 2, C.ink); }
function skyBG(t, seed = 1) { fb.gradV(0, 0, W, H, [C.ink, C.night, C.night, C.ink]); stars(fb, 0, 0, W, H, 90, seed, t); }

// ------------------------------------------------------------------ shots
function shotSplit(t, end = false) {
  fb.clear(C.ink);
  drawRoom(room1, t, { look: end && t > HIT.look ? 'front' : 'down', wave: end && t > HIT.look + .6 ? 1 : 0 });
  const close = !end && t >= HIT.close;
  const shake = !end && t < .35 ? [3, 3, 2, 2, 1, 1, 0, 0][Math.floor(t * 24)] || 0 : 0;
  for (const [y0, who] of [[58, '1P'], [126, '2P']]) {
    if (close) blitScaled(fb, room1, 84, 18, 90, 32, 0, y0, 2);
    else fb.copy(room1, 0, 0, W, 64, 0, y0 + (who === '2P' ? -shake : shake));
  }
  divider(122); divider(190 - 1 - 0);
  // labels: 1P / 2P · 另一个你 (gold)
  label('1P', 4, 62, t, C.white, 'p1');
  label('2P · 另一个你', 4, 130, t, C.goldL, 'p2');
  // the system banner: 2P has joined
  const bannerOn = end || t < 7.6;
  if (bannerOn) {
    const y = end ? 36 : Math.round(-24 + 60 * eo(clamp(t / .3, 0, 1)));
    const s = end ? '2P 也在看这条视频' : '2P 已连接 ✓';
    const w = textW(s) + 16, x = Math.round((W - w) / 2);
    win(fb, x, y, w, 20); text(fb, s, x + 8, y + 4, end ? C.white : C.goldL, C.night);
    TX.push({ id: 'banner' + (end ? 'E' : ''), text: s, x0: x * 6, y0: Math.max(0, y) * 6, x1: (x + w) * 6, y1: (y + 20) * 6 });
  }
  if (end && t >= HIT.send) {      // the prompt: [ 发送 ]
    const x = 108, y = 162; win(fb, x, y, 60, 22); text(fb, '发送', x + 26, y + 5, C.white, C.night); hand(fb, x + 8, y + 7, t);
    TX.push({ id: 'send', text: '发送', x0: x * 6, y0: y * 6, x1: (x + 60) * 6, y1: (y + 22) * 6 });
  }
}
function shotMenu(t) {
  skyBG(t, 2);
  const x = 22, y = 70, w = 136, h = 92;
  win(fb, x, y, w, h);
  caption('谜题', x + 12, y + 10, C.goldL, 'm-title');
  caption('2P 是从哪来的？', x + 12, y + 30, C.white, 'm-q');
  const sel = t >= HIT.select;
  caption('开始解谜', x + 34, y + 54, sel && Math.floor(t * 12) % 2 ? C.goldL : C.white, 'm-a');
  caption('跳过', x + 34, y + 70, C.steel, 'm-b');
  hand(fb, x + 14, y + 57, t, !sel);
}
// 3×3 grid: pattern number k (0..511) drawn as cells
function grid3(x0, y0, cell, bits, frame = true) {
  if (frame) { fb.rect(x0 - 3, y0 - 3, cell * 3 + 6, cell * 3 + 6, C.ink); fb.rect(x0 - 2, y0 - 2, cell * 3 + 4, cell * 3 + 4, C.steel); }
  for (let i = 0; i < 9; i++) {
    const cx = x0 + (i % 3) * cell, cy = y0 + Math.floor(i / 3) * cell, on = (bits >> i) & 1;
    fb.rect(cx, cy, cell, cell, C.ink);
    fb.rect(cx + 1, cy + 1, cell - 2, cell - 2, on ? C.white : C.night);
    if (on) { fb.rect(cx + 1, cy + cell - 3, cell - 2, 2, C.silver); }
  }
}
const ORDER = (() => { const a = [...Array(512).keys()]; for (let i = 511; i > 0; i--) { const j = Math.floor(hash(i, 77) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; })();
const REPEAT_OF = 137;             // the 513th pattern equals the 137th
function gridCount(t) {            // how many patterns have been shown: slow, then faster and faster, 512 at HIT.full
  const u = clamp((t - (HIT.grid + .4)) / (HIT.full - HIT.grid - .4), 0, 1);
  return Math.min(512, Math.floor(1 + 511 * (0.1 * u + 0.9 * u ** 3.2)));
}
function shotGrid(t) {
  skyBG(t, 3);
  const k = gridCount(t), rep = t >= HIT.repeat;
  if (!rep) {
    const bits = ORDER[k - 1];
    grid3(54, 84, 24, bits);
    caption('图案', 40, 52, C.white, 'g-l');
    const n = String(k).padStart(3, '0');
    caption(n + ' / 512', 76, 52, k >= 512 ? C.goldL : C.white, 'g-n', 1);
    if (k >= 512) caption('全部用完', 62, 166, C.goldL, 'g-full');
  } else {
    // side by side: the 513th = the 137th
    const sh = t - HIT.repeat < .33 ? [2, -2, 1, -1, 0][Math.floor((t - HIT.repeat) * 15)] || 0 : 0;
    grid3(20 + sh, 96, 14, ORDER[REPEAT_OF - 1]); grid3(118 + sh, 96, 14, ORDER[REPEAT_OF - 1]);
    caption('第 137 次', 16, 72, C.white, 'g-a'); caption('第 513 次', 112, 72, C.goldL, 'g-b');
    caption('=', 86, 108, C.white, 'g-eq', 2);
    const flash = Math.floor((t - HIT.repeat) * 8) % 2 === 0 || t - HIT.repeat > .8;
    if (flash) { const w = textW('重复！') * 2 + 8; fb.rect(90 - w / 2 - 2, 152, w + 4, 32, C.ink); caption('重复！', 90 - w / 2 + 4, 154, C.red, 'g-rep', 2, C.ink); }
  }
}
function shotAtoms(t) {
  const f = new FB(W, 150); drawRoom(f, t); fb.clear(C.ink); fb.copy(f, 0, 0, W, 150, 0, 38);
  // the region around you: dotted circle, atoms flicker inside at 12 fps
  const cx = 128, cy = 38 + 150 - 22, R = Math.round(10 + 26 * eo(clamp((t - HIT.circle) / .6, 0, 1)));
  if (t >= HIT.circle) {
    const fr = Math.floor(t * 12);
    for (let k = 0; k < 70; k++) { const a = hash(k, fr) * 6.283, r = Math.sqrt(hash(k, fr + 999)) * (R - 2); fb.px(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * .9), k % 3 ? C.cyan : C.white); }
    for (let a = 0; a < 6.283; a += .045) if (Math.floor(a / .045) % 3) fb.px(Math.round(cx + Math.cos(a + t * .4) * R), Math.round(cy + Math.sin(a + t * .4) * R * .9), C.white);
  }
  label('排列方式：多到吓人', 8, 44, t, C.white, 'a-1');
  if (t >= HIT.finite) { label('但是：有限', 8, 66, t, C.goldL, 'a-2'); }
}
// universe tiles: each tile is a 3×3 star pattern; ours and one far away share the same pattern
const TS = 24, OURS = 0b101011010, FAR = [17, 9];
function tileBits(i, j) {
  if ((i === 0 && j === 0) || (i === FAR[0] && j === FAR[1])) return OURS;
  let b = Math.floor(hash(i + 300, j + 500) * 512); if (b === OURS) b ^= 1; return b;
}
function drawTile(x0, y0, bits, gold) {
  fb.rect(x0, y0, TS, TS, C.ink); fb.rect(x0 + 1, y0 + 1, TS - 2, TS - 2, C.night);
  for (let k = 0; k < 9; k++) if ((bits >> k) & 1) {
    const sx = x0 + 4 + (k % 3) * 8, sy = y0 + 4 + Math.floor(k / 3) * 8;
    fb.px(sx, sy, C.white); fb.px(sx - 1, sy, C.steel); fb.px(sx + 1, sy, C.steel); fb.px(sx, sy - 1, C.steel); fb.px(sx, sy + 1, C.steel);
  }
  if (gold) { fb.rect(x0 - 1, y0 - 1, TS + 2, 1, C.gold); fb.rect(x0 - 1, y0 + TS, TS + 2, 1, C.gold); fb.rect(x0 - 1, y0 - 1, 1, TS + 2, C.gold); fb.rect(x0 + TS, y0 - 1, 1, TS + 2, C.gold); }
}
function shotUniverse(t) {
  fb.clear(C.ink);
  if (t < HIT.galaxy) {            // the planet, with you as a gold dot
    skyBG(t, 4);
    const cx = 90, cy = 112, r = 40;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      const land = hash(Math.floor((x + 100 + t * 3) / 6), Math.floor((y + 100) / 6)) > .62;
      const lit = (x * -.6 + y * -.8) / r;
      let c = land ? (lit > .2 ? C.lime : C.green) : (lit > .3 ? C.blue : C.navy);
      if (lit < -.55 && bayer(cx + x, cy + y) < -lit - .4) c = C.ink;
      fb.px(cx + x, cy + y, c);
    }
    fb.disc(cx - 12, cy - 6, 2, C.gold); caption('你', cx - 30, cy - 18, C.goldL, 'u-you');
    label('地球', 66, 160, t, C.white, 'u-earth');
  } else if (t < HIT.tiles) {      // the galaxy
    skyBG(t, 5);
    const cx = 90, cy = 112;
    for (let k = 0; k < 900; k++) { const arm = k % 2, r = 4 + hash(k, 1) * 62, a = r * .085 + arm * Math.PI + (hash(k, 2) - .5) * .9; fb.px(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * .6), r < 14 ? C.sand : hash(k, 3) > .7 ? C.white : C.steel); }
    fb.disc(cx + 30, cy + 8, 1.5, C.gold);
    label('银河系', 64, 160, t, C.white, 'u-mw');
  } else {                          // the map of tiles, then a pan to the far tile with the same pattern
    const u = eio(clamp((t - (HIT.tiles + .4)) / (HIT.other - HIT.tiles - .4), 0, 1));
    const camx = Math.round(FAR[0] * TS * u), camy = Math.round(FAR[1] * TS * u);
    const ox = 90 - TS / 2 - camx, oy = 110 - TS / 2 - camy;
    for (let j = -6; j < 20; j++) for (let i = -6; i < 26; i++) {
      const x = ox + i * TS, y = oy + j * TS; if (x < -TS || y < -TS || x > W || y > H) continue;
      drawTile(x, y, tileBits(i, j), (i === 0 && j === 0) || (i === FAR[0] && j === FAR[1] && t >= HIT.other));
    }
    if (u < .25) caption('我们这块宇宙', ox - 10, oy - 16, C.goldL, 'u-ours');
    if (t >= HIT.other) { const x = ox + FAR[0] * TS, y = oy + FAR[1] * TS; caption('另一个你', x - 12, y + TS + 4, C.goldL, 'u-far', 1); }
    label('一格 = 一块宇宙', 8, 44, t, C.white, 'u-key');
  }
}
function shotNumber(t) {
  skyBG(t, 6);
  const a = clamp((t - HIT.number) / .25, 0, 1);
  if (a > 0) {
    // 10^(10^29) m: base at 3x, exponent "10" at 2x raised, "29" at 1x raised again, then the unit on the baseline
    const y = 70, x0 = 22;
    const wb = textW('10') * 3, we = textW('10') * 2, w2 = textW('29');
    caption('10', x0, y, C.goldL, 'n-10', 3, C.ink);
    caption('10', x0 + wb + 3, y - 16, C.goldL, 'n-e1', 2, C.ink);
    caption('29', x0 + wb + we + 5, y - 24, C.goldL, 'n-e2', 1);
    caption('米', x0 + wb + we + w2 + 10, y + 14, C.white, 'n-m', 2, C.ink);
    caption('最近的另一个你，在', 36, 34, C.white, 'n-lab');
  }
  if (t >= HIT.zeros) {
    const scroll = Math.floor((t - HIT.zeros) * 60);
    const s = '0'.repeat(40);
    fb.rect(0, 106, W, 16, C.night);
    text(fb, s, 4 - (scroll % 8), 107, C.white);
    const yrs = clamp((t - HIT.zeros) / (HIT.ly - HIT.zeros), 0, 1);
    const v = yrs < 1 ? Math.floor(106 * yrs ** 3) : 106;
    caption('每毫米写一个零', 46, 126, C.steel, 'n-mm');
    caption('已写 ' + v + ' 亿光年', 44, 140, v >= 106 ? C.goldL : C.white, 'n-ly');
  }
  if (t >= HIT.drop1 + .3) { label('前提：宇宙无限？', 6, 154, t, C.white, 'n-premise'); label('状态：未知', 6, 172, t, C.white, 'n-state'); }
}
function lutAt(t) {
  if (t < HIT.drop1 || t >= HIT.flood) return LUT.full;
  if (t < HIT.drop2) return LUT.c16; if (t < HIT.drop3) return LUT.c8; if (t < HIT.faded) return LUT.c4; return LUT.faded;
}

// ------------------------------------------------------------------ the frame
function render(t) {
  TX = [];
  let pre = null;
  if (t < HIT.mosaic1 + .4) shotSplit(t);
  else if (t < HIT.grid) shotMenu(t);
  else if (t < HIT.atoms) shotGrid(t);
  else if (t < HIT.zoom) shotAtoms(t);
  else if (t < HIT.number) shotUniverse(t);
  else if (t < HIT.flood) shotNumber(t);
  else shotSplit(t, true);
  dialog(t);
  // present: palette steps; colour floods back through a dither wave from the centre
  if (t >= HIT.flood && t < HIT.flood + 1.0) {
    const f = (t - HIT.flood) / 1.0;
    out.present(fb, LUT.faded, LUT.full, (x, y) => bayer(x, y) < f * 1.6 - Math.hypot(x - 90, y - 150) / 240);
  } else out.present(fb, lutAt(t));
  // mosaic transitions at the cuts (block 1 → 12 → 1 over 0.8 s)
  for (const c of [HIT.mosaic1 + .4, HIT.grid, HIT.atoms, HIT.zoom, HIT.galaxy, HIT.tiles, HIT.number, HIT.flood]) {
    const d = Math.abs(t - c); if (d < .4) { out.post(u => mosaic(u, Math.max(1, Math.round(12 * (1 - d / .4))))); break; }
  }
  out.show();
  return TX;
}

// ------------------------------------------------------------------ events (sound) and subtitles
function events() {
  const E = [], ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  ev(0, 'join'); ev(.05, 'shake');
  for (let s = .6; s < 7.6; s += 1.5) ev(s, 'scroll', { pan: -.6 }), ev(s, 'scroll', { pan: .6 });
  ev(HIT.close, 'cut');
  for (const c of [HIT.mosaic1 + .4, HIT.grid, HIT.atoms, HIT.zoom, HIT.galaxy, HIT.tiles, HIT.number, HIT.flood]) ev(c - .4, 'mosaic');
  ev(9.6, 'cursor'); ev(HIT.select, 'select');
  let prev = 0; for (let t = HIT.grid + .4; t < HIT.full + .01; t += 1 / 48) { const k = gridCount(t); if (k !== prev && (k < 40 || k % 6 === 0 || k === 512)) ev(t, 'tick', { k }); prev = k; }
  ev(HIT.full, 'full'); ev(HIT.repeat, 'repeat'); ev(HIT.repeat + .05, 'shake');
  ev(HIT.circle, 'circle'); ev(HIT.finite, 'stamp');
  ev(HIT.zoom, 'whoosh'); ev(HIT.tiles + .4, 'pan', { t1: HIT.other }); ev(HIT.other, 'found');
  ev(HIT.number, 'levelup');
  for (let t = HIT.zeros; t < HIT.ly; t += .1) ev(t, 'zero');
  ev(HIT.ly, 'land');
  ev(HIT.drop1 + .3, 'window');
  [HIT.drop1, HIT.drop2, HIT.drop3, HIT.faded].forEach((t, i) => ev(t, 'bitdrop', { k: i }));
  ev(HIT.faded + .9, 'heartbeat'); ev(HIT.flood, 'flood'); ev(HIT.look, 'look'); ev(HIT.send, 'select');
  for (const L of LINES) ev(L.t, 'voice', { id: L.id });
  return E.sort((a, b) => a.t - b.t);
}

async function init() {
  try { VDUR = await (await fetch('voice/dur.json')).json(); } catch (e) { VDUR = {}; }
  await initFont();
  window.EV = events();
  window.SUBS = spans();
  window.READY = true;
}
window.DUR = DUR;
window.render = t => { render(t); };
window.TEXTS = t => render(t);
init().catch(e => { console.error(e); throw e; });
