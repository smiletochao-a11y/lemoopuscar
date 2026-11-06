// Jointed hide puppets for 《一锅饭的一生》: one rig, many characters (卢生 young / official / chief minister / old, 吕翁, 崔氏,
// the rival, the innkeeper, children). Profile facing right; flip = -1 faces left. Units = cloth px at camera 1×.
// Pieces: robe (pivot at the hip), head (pivot at the neck), back sleeve, front upper arm, front forearm + sleeve + hand, two boots.
import { piece, drawPiece, fill, cut, cutLine, ink, within, smooth, poly, lattice, coin, cloud, beadLine, plum, meander, scalesOpen, rivet, DYE } from './carve.js';

export const J = { neck: [6, -160], shB: [-4, -150], shF: [10, -148], elbow: [0, 58], rod: [4, -120] };

// ---------------- heads ----------------
const FACE = [[2, 0], [12, -6], [15, -14], [17, -20], [16, -24], [18, -27], [17, -30], [23, -35], [19, -39], [17, -46], [16, -54], [10, -61], [0, -63], [-10, -59], [-16, -48], [-17, -34], [-12, -18], [-6, -6]];
const INNER = [[6, -11], [12, -16], [14.5, -22], [15, -29], [18.5, -35], [15, -40], [13.5, -48], [9, -55], [4, -52], [2.5, -40], [3.5, -24]];
function head(c) {
  const HK = 1.42;
  return piece([-48 * HK, -110 * HK, 44 * HK, 75 * HK], g => {
    g.scale(HK, HK);
    const face = q => smooth(q, FACE);
    fill(g, DYE.skin, face);
    // hair at the back of the head (ink), carved with a few strands
    const hair = q => smooth(q, [[0, -63], [-10, -59], [-16, -48], [-17, -34], [-12, -18], [-6, -6], [-1, -6], [-3, -22], [1, -40], [6, -54], [10, -61]]);
    fill(g, c.hair || DYE.ink, hair);
    within(g, hair, () => { for (let k = 0; k < 4; k++) cutLine(g, .8, q => { q.moveTo(-2 - k * 3, -56); q.quadraticCurveTo(-12 - k, -36, -6 - k * 2, -10); }); });
    if (c.face === 'solid') {
      // the antagonist: a solid dark face with a sharp eye and a hooked brow
      fill(g, '#3a1c10', q => smooth(q, INNER));
      cut(g, q => { q.ellipse(12, -40, 3, 1.2, -.2, 0, 7); });
      ink(g, 1.6, q => { q.moveTo(6, -47); q.lineTo(16, -43); }, DYE.ink);
    } else {
      cut(g, q => smooth(q, INNER));
      ink(g, 1.5, q => { q.moveTo(5, -46); q.quadraticCurveTo(10, -48.5, 15.5, -46); });                        // brow
      ink(g, 1.3, q => { q.moveTo(8, -40.5); q.quadraticCurveTo(12, -42.5, 15.5, -40); q.quadraticCurveTo(12, -39, 8, -40.5); });   // long eye
      ink(g, 1.1, q => { q.moveTo(12.5, -28.5); q.lineTo(17, -28.5); });                                       // mouth
      if (c.lady) { fill(g, DYE.red, q => { q.ellipse(15.5, -28.6, 1.6, 1, 0, 0, 7); }); }
    }
    ink(g, 1.9, face);
    // beard
    if (c.beard) {
      const col = c.beard === 'white' ? DYE.white : DYE.ink, L = c.beard === 'white' ? 70 : 38;
      const bd = q => smooth(q, [[16, -26], [18, -18], [16, -6], [12, L * .5], [6, L], [2, L * .6], [4, -4], [8, -14], [10, -24]]);
      fill(g, col, bd); within(g, bd, () => { for (let k = 0; k < 4; k++) cutLine(g, .7, q => { q.moveTo(9 + k * 1.6, -14); q.quadraticCurveTo(10 + k, L * .3, 5 + k, L * .9); }); }); ink(g, 1.3, bd);
    }
    // headwear
    if (c.hat === 'futou') {                  // scholar's soft black cap with two hanging tails
      const cap = q => smooth(q, [[-14, -52], [-12, -66], [-2, -76], [10, -74], [17, -62], [16, -54], [4, -58]]);
      fill(g, DYE.ink, cap); within(g, cap, () => cutLine(g, 1, q => { q.moveTo(-10, -60); q.quadraticCurveTo(2, -66, 14, -60); }));
      for (const [dx, dy] of [[0, 0], [4, 6]]) fill(g, DYE.ink, q => smooth(q, [[-12, -58], [-26 - dx, -46 + dy], [-36 - dx, -22 + dy], [-32 - dx, -20 + dy], [-22 - dx, -42 + dy], [-10, -54]]));
    } else if (c.hat === 'official') {        // official's black hat with a gold band and a pin
      const cap = q => smooth(q, [[-16, -52], [-14, -70], [-4, -82], [10, -80], [18, -64], [17, -54], [2, -58]]);
      fill(g, DYE.ink, cap);
      const band = q => poly(q, [[-16, -56], [18, -56], [18, -62], [-16, -62]]);
      fill(g, DYE.gold, band); within(g, band, () => { for (let x = -12; x < 16; x += 7) coin(g, x, -59, 2.4); }); ink(g, 1.2, band);
      ink(g, 2.6, q => { q.moveTo(-26, -70); q.lineTo(26, -74); }, DYE.gold); ink(g, 1, q => { q.moveTo(-26, -70); q.lineTo(26, -74); });
      for (const s of [-1, 1]) fill(g, DYE.ink, q => smooth(q, [[s > 0 ? -14 : -16, -58], [s > 0 ? -46 : -40, -60 + s * 4], [s > 0 ? -48 : -42, -54 + s * 4], [-16, -52]]));
    } else if (c.hat === 'crown') {           // the chief minister's tall gold crown, carved
      const cr = q => smooth(q, [[-16, -52], [-18, -74], [-10, -100], [6, -104], [18, -88], [19, -66], [17, -54]]);
      fill(g, DYE.yellow, cr);
      within(g, cr, () => { for (let k = 0; k < 4; k++) cutLine(g, 2.2, q => { q.moveTo(-14 + k * 7, -58); q.quadraticCurveTo(-12 + k * 8, -82, -6 + k * 6, -98); }); cloud(g, 6, -80, 6, 0, 1.2, 1); });
      ink(g, 1.6, cr);
      ink(g, 3, q => { q.moveTo(-30, -84); q.lineTo(30, -90); }, DYE.red); ink(g, 1, q => { q.moveTo(-30, -84); q.lineTo(30, -90); });
      fill(g, DYE.red, q => q.arc(-32, -84, 4, 0, 7)); fill(g, DYE.red, q => q.arc(32, -90, 4, 0, 7));
    } else if (c.hat === 'daoji') {           // the Taoist: a topknot with a jade crown and a long pin
      fill(g, DYE.ink, q => smooth(q, [[-8, -60], [-6, -72], [4, -78], [12, -72], [12, -62]]));
      const cr = q => smooth(q, [[-6, -68], [-4, -82], [6, -86], [12, -76], [10, -68]]);
      fill(g, DYE.jade, cr); cut(g, q => q.arc(4, -76, 2.6, 0, 7)); ink(g, 1.2, cr);
      ink(g, 2, q => { q.moveTo(-14, -74); q.lineTo(20, -79); }, DYE.brown);
    } else if (c.hat === 'bun') {             // lady's high bun with flowers
      const bun = q => smooth(q, [[-14, -56], [-20, -74], [-12, -92], [4, -96], [14, -84], [12, -66], [4, -60]]);
      fill(g, DYE.ink, bun); within(g, bun, () => { for (let k = 0; k < 3; k++) cutLine(g, .9, q => { q.moveTo(-14 + k * 6, -62); q.quadraticCurveTo(-12 + k * 5, -84, 0 + k * 3, -92); }); });
      for (const [x, y, r] of [[8, -86, 5], [-4, -94, 4.5]]) { fill(g, DYE.red, q => q.arc(x, y, r, 0, 7)); plum(g, x, y, r * .45); ink(g, 1, q => q.arc(x, y, r, 0, 7)); }
      ink(g, 2, q => { q.moveTo(-22, -80); q.lineTo(14, -70); }, DYE.gold);
    } else if (c.hat === 'scarf') {           // innkeeper's head scarf
      fill(g, DYE.teal, q => smooth(q, [[-16, -50], [-12, -66], [2, -72], [14, -66], [16, -56], [2, -58]]));
      ink(g, 1.2, q => smooth(q, [[-16, -50], [-12, -66], [2, -72], [14, -66], [16, -56], [2, -58]]));
    }
  }, { seed: c.seed || 3 });
}
// ---------------- robe (pivot at the hip; shoulders at -150, hem at +190) ----------------
const ROBE = [[-8, -160], [14, -158], [24, -142], [28, -112], [24, -62], [24, -20], [34, 40], [44, 118], [54, 190], [-10, 196], [-44, 192], [-40, 140], [-30, 60], [-28, 0], [-26, -60], [-22, -120], [-16, -150]];
function robe(c) {
  return piece([-60, -170, 64, 204], g => {
    const R = q => smooth(q, ROBE);
    fill(g, c.robe, R);
    within(g, R, () => {
      if (c.patched) {                          // the poor scholar: plain hide with patches and tears
        for (const [x, y, w, h] of [[-20, 30, 22, 26], [8, 110, 26, 22], [-30, 150, 20, 18]]) { fill(g, DYE.hide2, q => q.rect(x, y, w, h)); ink(g, 1.2, q => q.rect(x, y, w, h)); for (let k = 0; k < 3; k++) cutLine(g, .8, q => { q.moveTo(x + 3, y + 4 + k * 6); q.lineTo(x + w - 3, y + 4 + k * 6); }); }
        for (const [x, y] of [[10, 40], [-14, 120]]) cutLine(g, 1.4, q => { q.moveTo(x, y); q.lineTo(x + 6, y + 20); });
        for (let k = 0; k < 5; k++) cutLine(g, 2.2, q => { q.moveTo(-18 + k * 11, -110); q.quadraticCurveTo(-22 + k * 13, 40, -30 + k * 18, 180); });   // long fold slits
        lattice(g, -46, 168, 58, 196, 10, 2.2);
      } else {
        scalesOpen(g, -30, -126, 30, -46, 6.5);                          // open fish-scale carving on the upper body
        lattice(g, -46, 96, 58, 196, 13, 2.6);                            // brocade hem band
        ink(g, 2.2, q => { q.moveTo(-40, 94); q.quadraticCurveTo(6, 88, 44, 94); });
        ink(g, 2.2, q => { q.moveTo(-30, -122); q.quadraticCurveTo(0, -126, 28, -120); });
        if (c.medal) { const m = q => q.arc(2, -84, 22, 0, 7); fill(g, c.medal, m); cloud(g, -4, -86, 10, 0, 1.8, 1); cloud(g, 10, -77, 7, 2, 1.5, -1); ink(g, 1.8, m); }
        for (let y = -12; y < 90; y += 30) for (let x = -26 + ((Math.round(y / 30)) % 2) * 14; x < 44; x += 28) { plum(g, x, y, 5.5); ink(g, 1, q => q.arc(x, y, 9, 0, 7)); }
      }
      // high belt (Tang) under the chest
      const belt = q => poly(q, [[-28, -40], [26, -40], [26, -28], [-28, -28]]);
      fill(g, c.belt || DYE.brown, belt); within(g, belt, () => { for (let x = -22; x < 22; x += 9) coin(g, x, -34, 3.3); }); ink(g, 1.4, belt);
      // collar
      const col = q => smooth(q, [[-8, -160], [14, -158], [18, -140], [6, -122], [-6, -132], [-14, -150]]);
      fill(g, c.collar || DYE.white, col); ink(g, 1.4, col);
    });
    ink(g, 2.3, R);
  }, { seed: (c.seed || 3) + 1 });
}
// sleeves: the back sleeve hangs wide from the shoulder; the front arm = upper arm + forearm/cuff with the hand
function sleeveB(c) {
  return piece([-34, -14, 40, 150], g => {
    const S = q => smooth(q, [[-10, -4], [12, -4], [20, 50], [30, 104], [26, 136], [-4, 142], [-22, 120], [-16, 60]]);
    fill(g, c.sleeve || c.robe, S); within(g, S, () => { cutLine(g, 1.2, q => { q.moveTo(-2, 10); q.quadraticCurveTo(8, 70, 2, 130); }); if (!c.patched) beadLine(g, -18, 122, 24, 132, 1.6, 7); }); ink(g, 2, S);
  }, { seed: (c.seed || 3) + 2 });
}
function upperArm(c) {
  return piece([-16, -8, 16, 66], g => { const S = q => smooth(q, [[-11, -4], [11, -4], [12, 30], [10, 62], [-10, 62], [-12, 30]]); fill(g, c.sleeve || c.robe, S); if (!c.patched) within(g, S, () => lattice(g, -12, 10, 12, 56, 9, 1.8)); ink(g, 1.8, S); }, { seed: (c.seed || 3) + 3 });
}
function foreArm(c) {
  return piece([-40, -8, 30, 120], g => {
    const S = q => smooth(q, [[-9, -4], [9, -4], [12, 36], [16, 56], [6, 104], [-14, 112], [-32, 90], [-20, 50], [-11, 36]]);
    fill(g, c.sleeve || c.robe, S); within(g, S, () => { cutLine(g, 1.1, q => { q.moveTo(-6, 52); q.quadraticCurveTo(-18, 80, -12, 104); }); }); ink(g, 1.8, S);
    const cuff = q => poly(q, [[-10, 48], [14, 48], [16, 58], [-12, 58]]); fill(g, c.collar || DYE.white, cuff); ink(g, 1.2, cuff);
    const hand = q => smooth(q, [[-6, 56], [8, 56], [11, 68], [8, 78], [-2, 80], [-7, 70]]); fill(g, DYE.skin, hand); cutLine(g, .8, q => { q.moveTo(1, 64); q.lineTo(6, 74); }); ink(g, 1.4, hand);
  }, { seed: (c.seed || 3) + 4 });
}
function boot() { return piece([-8, -10, 26, 10], g => { const b = q => smooth(q, [[-6, -8], [10, -8], [22, -4], [24, 2], [-6, 4]]); fill(g, DYE.ink, b); fill(g, DYE.white, q => q.rect(-6, 2, 30, 5)); ink(g, 1, b); }, { seed: 9 }); }

const CACHE = {};
function build(c) {
  const key = c.id;
  if (!CACHE[key]) CACHE[key] = { head: head(c), robe: robe(c), sb: sleeveB(c), ua: upperArm(c), fa: foreArm(c), boot: boot() };
  return CACHE[key];
}
// ---------------- characters ----------------
export const CH = {
  lu: { id: 'lu', robe: DYE.hide, patched: true, hat: 'futou', seed: 11 },
  luRed: { id: 'luRed', robe: DYE.red, sleeve: DYE.crim, hat: 'official', medal: DYE.yellow, belt: DYE.ink, seed: 12 },
  luGreen: { id: 'luGreen', robe: DYE.green, sleeve: DYE.jade, hat: 'official', belt: DYE.ink, seed: 13 },
  luCrown: { id: 'luCrown', robe: DYE.crim, sleeve: DYE.red, hat: 'crown', medal: DYE.gold, belt: DYE.yellow, collar: DYE.yellow, beard: 'black', seed: 14 },
  luOld: { id: 'luOld', robe: DYE.crim, sleeve: DYE.red, hat: 'crown', medal: DYE.gold, belt: DYE.yellow, collar: DYE.yellow, beard: 'white', hair: '#e8dcc0', seed: 15 },
  luPrison: { id: 'luPrison', robe: DYE.hide2, patched: true, hat: null, seed: 16 },
  lv: { id: 'lv', robe: DYE.teal, sleeve: DYE.jade, hat: 'daoji', beard: 'white', hair: '#e8dcc0', collar: DYE.white, belt: DYE.ink, seed: 21 },
  cui: { id: 'cui', robe: DYE.green, sleeve: DYE.red, hat: 'bun', lady: true, belt: DYE.yellow, collar: DYE.yellow, seed: 31 },
  bride: { id: 'bride', robe: DYE.red, sleeve: DYE.orange, hat: 'bun', lady: true, belt: DYE.yellow, collar: DYE.yellow, seed: 32 },
  rival: { id: 'rival', robe: DYE.ink, sleeve: DYE.brown, hat: 'official', face: 'solid', beard: 'black', belt: DYE.red, seed: 41 },
  keeper: { id: 'keeper', robe: DYE.brown, sleeve: DYE.hide2, hat: 'scarf', patched: true, seed: 51 },
  son: { id: 'son', robe: DYE.red, sleeve: DYE.orange, hat: 'futou', seed: 61 },
  kid: { id: 'kid', robe: DYE.yellow, sleeve: DYE.green, hat: null, seed: 62 },
};

// ---------------- matrices ----------------
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const T = (x, y) => [1, 0, 0, 1, x, y];
const R = a => { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0]; };
const Sc = (x, y = x) => [x, 0, 0, y, 0, 0];
export const ap = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
export { mul, T, R, Sc };
const set = (g, M) => g.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);

// pose: {x, y (hip), s (scale), flip, rot, head, aB (back sleeve), a1, a2 (front arm: upper, fore; 0 = hanging), step (0..1 walk phase), lie}
export function drawPuppet(g, Cam, c, pose, opt = {}) {
  const P = build(c), p = { s: 1, flip: 1, rot: 0, head: 0, aB: .15, a1: .25, a2: -.5, step: 0, ...pose };
  const W = mul(Cam, mul(T(p.x, p.y), mul(Sc(p.s * p.flip, p.s), R(p.rot))));
  const k = Math.hypot(Cam[0], Cam[1]) * p.s;
  const Mh = mul(W, mul(T(...J.neck), R(p.head)));
  const MsB = mul(W, mul(T(...J.shB), R(p.aB)));
  const Mu = mul(W, mul(T(...J.shF), R(p.a1))), Mf = mul(Mu, mul(T(...J.elbow), R(p.a2 - p.a1)));
  const st = Math.sin(p.step * Math.PI * 2) * 10;
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = opt.alpha ?? 1;
  if (opt.blur) g.filter = `blur(${opt.blur}px)`;
  const dp = (M, pc) => { set(g, M); drawPiece(g, pc); };
  dp(MsB, P.sb);
  dp(mul(W, T(-6 - st, 192)), P.boot); dp(mul(W, T(16 + st, 192)), P.boot);
  dp(W, P.robe); dp(Mh, P.head); dp(Mu, P.ua); dp(Mf, P.fa);
  g.restore();
  if (opt.rivets !== false && !opt.blur) { set(g, [1, 0, 0, 1, 0, 0]); for (const q of [ap(W, ...J.neck), ap(W, ...J.shF), ap(W, ...J.shB), ap(Mu, ...J.elbow)]) rivet(g, q[0], q[1], 3.2 * k); }
  return { rods: [ap(W, ...J.rod), ap(Mf, 2, 80)], hand: ap(Mf, 2, 74), head: ap(Mh, 4, -40), k };
}
// control rods (soft, off the cloth)
export function drawRods(g, pts, ends, blur = 2.5, alpha = .55) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.filter = `blur(${blur}px)`; g.globalAlpha = alpha;
  pts.forEach((p, i) => { const e = ends[i]; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(e[0], e[1]); g.strokeStyle = '#2a1a10'; g.lineWidth = i === 0 ? 4 : 2.8; g.stroke(); });
  g.restore();
}
