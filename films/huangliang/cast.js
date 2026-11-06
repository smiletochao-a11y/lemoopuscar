// Colour models for the cast (色指定): daylight colours per character, converted per lighting set (dusk / night / backlit / dawn).
// Robe colours follow the Tang rank system: 青 (8–9th) → 绿 (6–7th) → 绯 (4–5th) → 紫 (3rd and above); plain hemp before and after the dream.
import { BASE, LIGHTS } from './pal.js';
import { hex } from './cel.js';
const mul = (c, m) => { const v = hex(c); return '#' + v.map((x, i) => Math.max(0, Math.min(255, Math.round(x * m[i]))).toString(16).padStart(2, '0')).join(''); };
export const ROBES = {
  hemp: { f: '#e9e2d0', s: '#b8ad96', h: '#fffaf0', l: '#5e5444' },
  qing: { f: '#3f74c4', s: '#284c8c', h: '#8cb4f0', l: '#142a52' },
  lv: { f: '#3f9a62', s: '#276a42', h: '#8edaa8', l: '#123a22' },
  fei: { f: '#d8443a', s: '#982624', h: '#ff9a84', l: '#4e1010' },
  zi: { f: '#7a46b0', s: '#4e2a7a', h: '#c4a0f0', l: '#26123e' },
  dao: { f: '#5aa69a', s: '#357468', h: '#a8e6da', l: '#173c36' },
  black: { f: '#3a3444', s: '#221e2a', h: '#6a6278', l: '#0c0a10' },
  bride: { f: '#e23a3a', s: '#a01e2a', h: '#ff9a8a', l: '#4e0a14' },
  apron: { f: '#a8784a', s: '#78502c', h: '#e0b48a', l: '#3a2410' },
};
const HAIR = { f: '#2e2436', s: '#1a1422', h: '#6e5a86', l: '#120c1a' };
const WHITE = { f: '#eceaf2', s: '#b4b0c4', h: '#ffffff', l: '#5a566e' };
const EYE = { f: '#6a4430', s: '#3a2216', h: '#c89a70', l: '#1c0e08' };
export const CAST = {
  lu: { robe: 'hemp', hat: 'futou', male: true },
  luQing: { robe: 'qing', hat: 'official', male: true },
  luLv: { robe: 'lv', hat: 'official', male: true },
  luFei: { robe: 'fei', hat: 'official', male: true, pat: true },
  luZi: { robe: 'zi', hat: 'crown', male: true, pat: true },
  luOld: { robe: 'zi', hat: 'crown', male: true, pat: true, hair: WHITE, beard: 'long', beardC: WHITE, old: true },
  luPrison: { robe: 'hemp', hat: null, male: true, messy: true },
  lv: { robe: 'dao', hat: 'daoji', male: true, hair: WHITE, beard: 'long', beardC: WHITE, old: true },
  cui: { robe: 'bride', hat: 'bun', lady: true, skirt: 'lv', shawl: 'qing' },
  rival: { robe: 'black', hat: 'official', male: true, beard: 'short', beardC: HAIR, sly: true },
  keeper: { robe: 'apron', hat: null, male: true },
};
export function pal(id, light = 'day') {
  const c = CAST[id], L = LIGHTS[light] || LIGHTS.day, out = {};
  const src = { ...BASE, hair: c.hair || HAIR, eye: EYE, robe: ROBES[c.robe], skirt: ROBES[c.skirt || 'lv'], shawl: ROBES[c.shawl || 'qing'], beardC: c.beardC || HAIR, white: WHITE, brow: (c.hair || HAIR).l, lash: '#1a1016' };
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === 'string') { out[k] = mul(v, L.lit); continue; }
    out[k] = {}; for (const [kk, col] of Object.entries(v)) out[k][kk] = mul(col, kk === 's' ? L.shade : kk === 'l' ? L.line : L.lit);
  }
  if (c.old) { out.skin = { ...out.skin, s: mul('#c89a8a', L.shade) }; }
  out.robePat = !!c.pat;
  return out;
}
export const LIGHTS2 = { ...LIGHTS, dusk: { lit: [1.02, .86, .78], shade: [.8, .6, .72], line: [1, .8, .85] }, prison: { lit: [.72, .74, .9], shade: [.46, .44, .66], line: [.8, .7, 1] } };
Object.assign(LIGHTS, LIGHTS2);
