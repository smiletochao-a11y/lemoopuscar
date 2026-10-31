// you.js — "you": a small front-view figure in a gold hoodie, sitting on a bed edge with a phone. Built from primitives
// into a 32×40 buffer, then one global ink outline. Gold is protected: the same colour marks "the other you" everywhere.
import { C, T } from './px.js';

const SW = 32, SH = 40;
function buf() { return { w: SW, h: SH, d: new Uint8Array(SW * SH).fill(T) }; }
function put(b, x, y, c) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= SW || y >= SH) return; b.d[y * SW + x] = c; }
function rect(b, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(b, x + i, y + j, c); }
function disc(b, cx, cy, r, f) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= r * r + .4) put(b, x, y, f(dx, dy)); } }
function outline(b) {
  const o = b.d.slice();
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    if (b.d[y * SW + x] !== T) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < SW && Y < SH && b.d[Y * SW + X] !== T) { o[y * SW + x] = C.ink; break; } }
  }
  b.d = o; return b;
}
const cache = new Map();
// o: { look: 'down' | 'front', blink, thumb (0/1), wave (0..1 hand raised) }
export function you(o = {}) {
  const key = JSON.stringify(o); if (cache.has(key)) return cache.get(key);
  const b = buf(), look = o.look || 'down';
  // shoes and shins (sitting on the bed edge, legs down)
  rect(b, 10, 36, 5, 2, C.white); rect(b, 18, 36, 5, 2, C.white); rect(b, 10, 37, 5, 1, C.silver); rect(b, 18, 37, 5, 1, C.silver);
  rect(b, 11, 30, 4, 6, C.dslate); rect(b, 18, 30, 4, 6, C.dslate); rect(b, 14, 30, 1, 6, C.night); rect(b, 21, 30, 1, 6, C.night);
  // knees / thighs, foreshortened
  rect(b, 10, 27, 13, 3, C.slate); rect(b, 10, 29, 13, 1, C.dslate); put(b, 16, 28, C.dslate);
  // hoodie body: gold, light from the upper left
  for (let y = 14; y <= 27; y++) {
    const half = 6 + Math.floor((y - 14) / 6);
    for (let x = 16 - half; x <= 16 + half; x++) {
      const r = x - (16 - half), w = 2 * half;
      put(b, x, y, r < 2 && y < 22 ? C.goldL : r > w - 3 || y > 25 ? C.goldD : C.gold);
    }
  }
  rect(b, 12, 23, 9, 1, C.goldD);                                   // pocket
  put(b, 14, 15, C.white); put(b, 14, 16, C.white); put(b, 18, 15, C.white); put(b, 18, 16, C.white); put(b, 18, 17, C.white);   // drawstrings
  // hood behind the neck
  rect(b, 11, 12, 11, 2, C.goldD); rect(b, 12, 11, 9, 1, C.goldD);
  // arms: from the shoulders to the phone held at the chest; one hand raised to wave at the end
  const arm = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n); put(b, x, y, C.gold); put(b, x + 1, y, C.goldD); put(b, x, y + 1, C.goldD); } };
  arm(10, 15, 12, 21); arm(22, 15, 20, 21);
  // phone (cyan screen) between the hands
  rect(b, 13, 18, 7, 5, C.ink); rect(b, 14, 19, 5, 3, C.cyan); put(b, 14, 19, C.white);
  if (o.thumb) put(b, 17, 20, C.blue);
  rect(b, 12, 21, 2, 2, C.skin); rect(b, 19, 21, 2, 2, C.skin); put(b, 13, 22, C.skinS); put(b, 20, 22, C.skinS);
  if (o.wave) { rect(b, 23, 8, 2, 7, C.gold); put(b, 24, 9, C.goldD); rect(b, 23, 6, 3, 2, C.skin); }
  // head: skin disc, hair cap with a side-swept fringe (the silhouette mark: one spike up at the crown)
  disc(b, 16, 7.5, 6, (dx, dy) => dx > 2.5 && dy > 0 ? C.skinS : C.skin);
  disc(b, 16, 5.5, 6.2, (dx, dy) => dy < -.5 ? (dx < -2 && dy < -3 ? C.dslate : C.night) : T);
  for (let x = 10; x <= 22; x++) { const fy = 5 + (x < 15 ? 1 : x < 19 ? 2 : 1); for (let y = 2; y <= fy; y++) put(b, x, y, (x === 12 && y === 3) ? C.dslate : C.night); }
  put(b, 17, 0, C.night); put(b, 18, 0, C.night); put(b, 18, -1, C.night); put(b, 16, 1, C.night);
  put(b, 10, 6, C.night); put(b, 22, 6, C.night); put(b, 10, 7, C.night); put(b, 22, 7, C.night);
  // face
  if (look === 'down') { if (!o.blink) { put(b, 13, 9, C.ink); put(b, 14, 9, C.ink); put(b, 18, 9, C.ink); put(b, 19, 9, C.ink); } put(b, 16, 12, C.skinS); }
  else {
    if (o.blink) { put(b, 13, 8, C.ink); put(b, 14, 8, C.ink); put(b, 18, 8, C.ink); put(b, 19, 8, C.ink); }
    else { put(b, 13, 7, C.ink); put(b, 13, 8, C.ink); put(b, 19, 7, C.ink); put(b, 19, 8, C.ink); put(b, 14, 7, C.white); put(b, 20, 7, C.white); }
    put(b, 15, 11, C.brown); put(b, 16, 11, C.brown); put(b, 17, 11, C.brown);
    put(b, 11, 10, C.pink); put(b, 21, 10, C.pink);
  }
  const r = outline(b); cache.set(key, r); return r;
}
