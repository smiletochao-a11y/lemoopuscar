// font.js — Fusion Pixel 12px (OFL) rasterised once per glyph into a 1-bit mask, then drawn into the indexed framebuffer.
// The browser draws the font at its native 12 px; alpha is thresholded, so every glyph lands on whole pixels.
const cache = new Map();
let g = null;
export const LINE_H = 13;
export async function initFont() {
  await document.fonts.load('12px FP', '宇宙里还有一个你0123');
  const c = document.createElement('canvas'); c.width = 64; c.height = 16;
  g = c.getContext('2d', { willReadFrequently: true });
}
function glyph(ch) {
  let m = cache.get(ch); if (m) return m;
  g.clearRect(0, 0, 64, 16); g.font = '12px FP'; g.textBaseline = 'top'; g.fillStyle = '#fff'; g.fillText(ch, 0, 1);
  const w = Math.max(1, Math.round(g.measureText(ch).width));
  const d = g.getImageData(0, 0, w, 14).data, bits = new Uint8Array(w * 14);
  for (let i = 0; i < w * 14; i++) bits[i] = d[i * 4 + 3] > 127 ? 1 : 0;
  m = { w, h: 14, bits }; cache.set(ch, m); return m;
}
export function textW(s, sc = 1) { let w = 0; for (const ch of s) w += glyph(ch).w * sc; return w; }
// draw at (x, y) = top-left; shadow: 1 px down-right in another index
export function text(fb, s, x, y, col, shadow = null, sc = 1) {
  let cx = Math.round(x); y = Math.round(y);
  for (const ch of s) {
    const m = glyph(ch);
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) if (m.bits[j * m.w + i]) {
      for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) {
        if (shadow !== null) fb.px(cx + i * sc + a + 1, y + j * sc + b + 1, shadow);
      }
    }
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) if (m.bits[j * m.w + i])
      for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) fb.px(cx + i * sc + a, y + j * sc + b, typeof col === 'function' ? col(j) : col);
    cx += m.w * sc;
  }
  return cx - x;
}
// big titles: scaled, 8-neighbour outline, optional row gradient (col may be a function of the glyph row)
export function textOutlined(fb, s, x, y, col, outline, sc = 2) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) text(fb, s, x + dx, y + dy, outline, null, sc);
  return text(fb, s, x, y, col, null, sc);
}
// wrap by width, character by character (CJK), keeping closing punctuation off the start of a line
const NOSTART = '，。、：；！？）》”’,.;:!?)';
export function wrap(s, maxW) {
  const lines = []; let cur = '';
  for (const ch of s) {
    if (textW(cur + ch) > maxW && cur && !NOSTART.includes(ch)) { lines.push(cur); cur = ch; } else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}
