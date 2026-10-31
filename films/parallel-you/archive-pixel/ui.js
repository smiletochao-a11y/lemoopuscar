// ui.js — windows (16-bit skin), the dialog box that carries the subtitles, the hand cursor
import { W, H, C, T, GBI, bayer, sprFromRows } from './px.js';
import { text, textW, wrap, LINE_H } from './font.js';

// Windows: skin snes = blue gradient + white/silver border; nes = black background with white frame; gb = light background with dark frame (pass in 4-colour indices)
export function win(fb, x, y, w, h, skin = 'snes') {
  if (skin === 'gb') {
    const [K, D, Lg, Wt] = GBI;
    fb.rect(x + 1, y, w - 2, h, K); fb.rect(x, y + 1, w, h - 2, K);
    fb.rect(x + 1, y + 1, w - 2, h - 2, D); fb.rect(x + 2, y + 2, w - 4, h - 4, Wt); return;
  }
  if (skin === 'nes') {
    fb.rect(x + 1, y, w - 2, h, C.ink); fb.rect(x, y + 1, w, h - 2, C.ink);
    fb.rect(x + 2, y + 2, w - 4, h - 4, C.white); fb.rect(x + 4, y + 4, w - 8, h - 8, C.ink); fb.px(x + 2, y + 2, C.ink); fb.px(x + w - 3, y + 2, C.ink); fb.px(x + 2, y + h - 3, C.ink); fb.px(x + w - 3, y + h - 3, C.ink); return;
  }
  fb.rect(x + 2, y, w - 4, h, C.ink); fb.rect(x, y + 2, w, h - 4, C.ink); fb.rect(x + 1, y + 1, w - 2, h - 2, C.ink);
  fb.rect(x + 2, y + 1, w - 4, h - 2, C.white); fb.rect(x + 1, y + 2, w - 2, h - 4, C.white);
  fb.rect(x + 2, y + 2, w - 4, h - 4, C.silver);
  fb.gradV(x + 3, y + 3, w - 6, h - 6, [C.blue, C.navy, C.navy, C.night]);
  fb.hline(x + 3, x + w - 4, y + 3, C.blue);
}

// —— Hand cursor ——
const HAND = sprFromRows([
  '.kk......',
  'kwwk.....',
  'kwwwkkkk.',
  'kwwwwwwwk',
  'kwwwwkkk.',
  'kwwwwk...',
  '.kkkk....',
], { k: C.ink, w: C.white });
export function hand(fb, x, y, t, bob = true) { fb.blit(HAND, x + (bob && Math.floor(t * 4) % 2 ? 1 : 0), y); }

