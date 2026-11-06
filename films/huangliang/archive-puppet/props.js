// Carved hide set pieces for 《一锅饭的一生》. Each is a pre-rendered piece; drawn with multiply onto the transmission canvas.
import { piece, drawPiece, fill, cut, cutLine, ink, within, smooth, poly, lattice, coin, cloud, beadLine, plum, meander, strata, flameTongue, cutTaper, DYE } from './carve.js';

let P = null;
export function buildProps() {
  if (P) return P;
  P = {};
  // the inn stove (brick, carved courses) with a fire mouth and a pot with a lid
  P.stove = piece([-150, -60, 150, 230], g => {
    const S = q => poly(q, [[-140, 0], [140, 0], [130, 220], [-130, 220]]);
    fill(g, DYE.hide2, S);
    within(g, S, () => { for (let y = 20; y < 220; y += 26) { cutLine(g, 2.2, q => { q.moveTo(-136, y); q.lineTo(136, y); }); for (let x = -130 + ((y / 26) % 2) * 26; x < 136; x += 52) cutLine(g, 2, q => { q.moveTo(x, y); q.lineTo(x, y + 24); }); } });
    const mouth = q => { q.moveTo(-50, 220); q.lineTo(-50, 150); q.quadraticCurveTo(0, 100, 50, 150); q.lineTo(50, 220); q.closePath(); };
    fill(g, DYE.ink, mouth);
    ink(g, 2.4, S);
    fill(g, DYE.brown, q => poly(q, [[-150, -6], [150, -6], [150, 6], [-150, 6]]));
  }, { seed: 71 });
  P.fire = [0, 1, 2].map(v => piece([-60, -80, 60, 4], g => {
    g.save(); g.translate(0, 0);
    for (const [x, h, w, d] of [[-30, 60 + v * 8, 30, 1], [0, 74 - v * 6, 34, -1], [28, 56 + v * 5, 28, 1]]) {
      g.save(); g.translate(x, 0); fill(g, DYE.orange, q => flameTongue(q, h, w, v % 2 ? -d : d)); within(g, q => flameTongue(q, h, w, d), () => fill(g, DYE.yellow, q => flameTongue(q, h * .55, w * .5, -d))); ink(g, 1.3, q => flameTongue(q, h, w, d)); g.restore();
    }
    g.restore();
  }, { seed: 72 + v }));
  P.pot = piece([-110, -70, 110, 10], g => {
    const body = q => { q.moveTo(-100, -40); q.quadraticCurveTo(-96, 6, 0, 8); q.quadraticCurveTo(96, 6, 100, -40); q.closePath(); };
    fill(g, DYE.ink, body); within(g, body, () => { meander(g, -86, -22, 86, 5, 1.6); });
    fill(g, DYE.ink, q => poly(q, [[-108, -46], [108, -46], [108, -38], [-108, -38]]));
  }, { seed: 75 });
  P.lid = piece([-100, -40, 100, 4], g => {
    const L = q => { q.moveTo(-96, 0); q.quadraticCurveTo(0, -46, 96, 0); q.closePath(); };
    fill(g, DYE.brown, L); within(g, L, () => { for (let x = -70; x <= 70; x += 20) cutLine(g, 2, q => { q.moveTo(x, -2); q.lineTo(x * .9, -18 + Math.abs(x) * .16); }); }); ink(g, 2, L);
    fill(g, DYE.ink, q => q.rect(-10, -36, 20, 10));
  }, { seed: 76 });
  P.millet = piece([-90, -26, 90, 4], g => { const M = q => { q.moveTo(-88, 0); q.quadraticCurveTo(0, -30, 88, 0); q.closePath(); }; fill(g, DYE.yellow, M); for (let k = 0; k < 40; k++) cut(g, q => q.arc(-80 + (k % 20) * 8.4, -4 - Math.floor(k / 20) * 9 - Math.sin(k) * 2, 2.2, 0, 7)); ink(g, 1.4, M); }, { seed: 77 });
  // steam: carved wisp pieces swapped at 12 fps (never particles)
  P.steam = [0, 1, 2].map(v => piece([-90, -330, 90, 0], g => {
    for (let k = 0; k < 3; k++) {
      const x0 = -50 + k * 50, ph = v * 2.1 + k * 1.7, pts = [];
      for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([x0 + Math.sin(u * 5 + ph) * 22 * u, -u * (260 + k * 30)]); }
      const L = [], Rr = [];
      for (let i = 0; i < pts.length; i++) { const w = 10 * (1 - i / pts.length) + 2; L.push([pts[i][0] - w, pts[i][1]]); Rr.push([pts[i][0] + w, pts[i][1]]); }
      const S = q => { q.moveTo(...L[0]); for (const p of L) q.lineTo(...p); for (let i = Rr.length - 1; i >= 0; i--) q.lineTo(...Rr[i]); q.closePath(); };
      fill(g, '#d8c7a6', S); within(g, S, () => { for (let i = 1; i < 9; i += 2) cutLine(g, 2.4, q => { q.moveTo(pts[i][0] - 6, pts[i][1]); q.lineTo(pts[i][0] + 6, pts[i][1] - 8); }); }); ink(g, 1.2, S);
      cloud(g, pts[10][0], pts[10][1] + 14, 10, ph, 1.2, k % 2 ? 1 : -1);
    }
  }, { seed: 78 + v, tex: true }));
  // bench (the sleeper lies on it) and a low table
  P.bench = piece([-240, -30, 240, 120], g => {
    const top = q => poly(q, [[-236, -24], [236, -24], [230, 4], [-230, 4]]);
    fill(g, DYE.brown, top); within(g, top, () => meander(g, -220, -2, 220, 6, 1.8)); ink(g, 2, top);
    for (const x of [-200, 200]) { const l = q => poly(q, [[x - 14, 4], [x + 14, 4], [x + 18, 116], [x - 18, 116]]); fill(g, DYE.brown, l); cut(g, q => q.ellipse(x, 60, 6, 28, 0, 0, 7)); ink(g, 1.8, l); }
  }, { seed: 79 });
  // the celadon pillow, open at both ends (窍其两端)
  P.pillow = piece([-110, -60, 110, 20], g => {
    const B = q => { q.moveTo(-100, 10); q.quadraticCurveTo(-110, -46, -80, -52); q.quadraticCurveTo(0, -38, 80, -52); q.quadraticCurveTo(110, -46, 100, 10); q.closePath(); };
    fill(g, DYE.jade, B);
    within(g, B, () => { cloud(g, -30, -20, 12, 0, 1.6, 1); cloud(g, 26, -18, 10, 2, 1.4, -1); beadLine(g, -80, 2, 80, 2, 2, 10); });
    cut(g, q => q.ellipse(-86, -22, 12, 20, 0, 0, 7)); cut(g, q => q.ellipse(86, -22, 12, 20, 0, 0, 7));
    ink(g, 2.2, B); ink(g, 1.6, q => q.ellipse(-86, -22, 13, 21, 0, 0, 7)); ink(g, 1.6, q => q.ellipse(86, -22, 13, 21, 0, 0, 7));
  }, { seed: 80 });
  // red lantern
  P.lantern = piece([-40, -100, 40, 90], g => {
    const L = q => q.ellipse(0, 0, 34, 44, 0, 0, 7);
    fill(g, DYE.red, L); within(g, L, () => { for (let x = -24; x <= 24; x += 12) cutLine(g, 2.2, q => { q.moveTo(x, -40); q.quadraticCurveTo(x * 1.25, 0, x, 40); }); plum(g, 0, 0, 8); });
    ink(g, 1.8, L);
    fill(g, DYE.gold, q => q.rect(-16, -50, 32, 8)); fill(g, DYE.gold, q => q.rect(-16, 42, 32, 8));
    ink(g, 2.2, q => { q.moveTo(0, -50); q.lineTo(0, -96); });
    for (let k = -2; k <= 2; k++) ink(g, 1.6, q => { q.moveTo(k * 5, 50); q.lineTo(k * 6, 86); }, DYE.red);
  }, { seed: 81 });
  // the bridal sedan chair
  P.sedan = piece([-140, -230, 140, 40], g => {
    const roof = q => smooth(q, [[-130, -150], [-90, -190], [0, -220], [90, -190], [130, -150], [100, -158], [0, -176], [-100, -158]]);
    fill(g, DYE.yellow, roof); within(g, roof, () => meander(g, -110, -158, 110, 5, 1.6)); ink(g, 2, roof);
    const box = q => poly(q, [[-96, -156], [96, -156], [96, 20], [-96, 20]]);
    fill(g, DYE.red, box);
    within(g, box, () => { lattice(g, -86, -146, 86, -60, 14, 2.6); for (let x = -70; x <= 70; x += 35) coin(g, x, -24, 9); plum(g, 0, 0, 7); });
    ink(g, 2.2, box);
    fill(g, DYE.brown, q => poly(q, [[-140, -6], [140, -6], [140, 6], [-140, 6]]));
    fill(g, DYE.gold, q => q.arc(0, -226, 9, 0, 7));
  }, { seed: 82 });
  // the gold placard of passed candidates (cut-out characters)
  P.bang = piece([-180, -130, 180, 130], g => {
    const B = q => poly(q, [[-170, -120], [170, -120], [170, 120], [-170, 120]]);
    fill(g, DYE.yellow, B);
    within(g, B, () => { meander(g, -160, -104, 160, 5, 1.8); meander(g, 160 - 320, 112, 160, 5, 1.8); });
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.font = '400 120px "Ma Shan Zheng"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('金榜', 0, -18); g.font = '400 40px "Ma Shan Zheng"'; g.fillText('进士及第', 0, 72); g.restore();
    ink(g, 3, B); fill(g, DYE.red, q => poly(q, [[-180, -130], [180, -130], [180, -118], [-180, -118]]));
  }, { seed: 83 });
  // a palace hall (roof, brackets, pillars) for the court scenes
  P.hall = piece([-420, -300, 420, 260], g => {
    const roof = q => smooth(q, [[-410, -110], [-330, -170], [-180, -230], [0, -260], [180, -230], [330, -170], [410, -110], [330, -130], [180, -168], [0, -186], [-180, -168], [-330, -130]]);
    fill(g, DYE.teal, roof);
    within(g, roof, () => { for (let x = -380; x < 380; x += 26) cutLine(g, 4, q => { q.moveTo(x, -120 - Math.max(0, 140 - Math.abs(x) * .3)); q.lineTo(x * .97, -110 - Math.max(0, 70 - Math.abs(x) * .17)); }); });
    ink(g, 2.4, roof);
    fill(g, DYE.ink, q => poly(q, [[-60, -270], [60, -270], [70, -256], [-70, -256]]));
    for (const s of [-1, 1]) fill(g, DYE.yellow, q => smooth(q, [[s * 60, -272], [s * 92, -300], [s * 100, -280], [s * 74, -262]]));
    const band = q => poly(q, [[-340, -130], [340, -130], [340, -96], [-340, -96]]);
    fill(g, DYE.red, band); within(g, band, () => { for (let x = -320; x < 330; x += 40) cloud(g, x, -113, 9, 0, 1.6, 1); }); ink(g, 1.8, band);
    for (let i = 0; i < 6; i++) { const x = -300 + i * 120, col = q => poly(q, [[x - 14, -96], [x + 14, -96], [x + 14, 220], [x - 14, 220]]); fill(g, DYE.red, col); within(g, col, () => beadLine(g, x, -80, x, 210, 3, 18)); ink(g, 1.6, col); }
    for (let i = 0; i < 5; i++) { const x = -240 + i * 120, d = q => poly(q, [[x - 44, -80], [x + 44, -80], [x + 44, 220], [x - 44, 220]]); within(g, d, () => lattice(g, x - 44, -80, x + 44, 220, 18, 3.4)); }
    const base = q => poly(q, [[-400, 220], [400, 220], [420, 256], [-420, 256]]); fill(g, DYE.hide2, base); within(g, base, () => meander(g, -400, 248, 400, 7, 2)); ink(g, 2, base);
  }, { seed: 84 });
  // prison bars (dark frame with square holes)
  P.bars = piece([-260, -320, 260, 320], g => {
    const F = q => poly(q, [[-250, -310], [250, -310], [250, 310], [-250, 310]]);
    fill(g, '#3a2414', F);
    cut(g, q => { for (let x = -230; x < 230; x += 60) for (let y = -290; y < 290; y += 120) q.rect(x + 12, y + 10, 36, 100); });
    ink(g, 3, F);
  }, { seed: 85 });
  // a short sword
  P.knife = piece([-10, -12, 170, 12], g => {
    const blade = q => poly(q, [[40, -5], [160, -3], [168, 0], [160, 3], [40, 5]]); fill(g, DYE.white, blade); cutLine(g, 1, q => { q.moveTo(46, 0); q.lineTo(150, 0); }); ink(g, 1.4, blade);
    fill(g, DYE.gold, q => poly(q, [[32, -10], [40, -10], [40, 10], [32, 10]])); fill(g, DYE.ink, q => poly(q, [[0, -4], [32, -4], [32, 4], [0, 4]])); fill(g, DYE.red, q => q.arc(-2, 0, 5, 0, 7));
  }, { seed: 86 });
  // the dream border: a band of carved clouds dividing the dream (above) from the inn (below)
  P.clouds = piece([-560, -80, 560, 80], g => {
    const B = q => { q.moveTo(-560, 40); for (let x = -560; x <= 560; x += 70) q.quadraticCurveTo(x + 35, -70 - 20 * Math.sin(x), x + 70, 30); q.lineTo(560, 70); q.lineTo(-560, 70); q.closePath(); };
    fill(g, DYE.teal, B); within(g, B, () => { for (let x = -520; x < 560; x += 70) cloud(g, x + 20, 0, 22, x * .01, 3, (x / 70) % 2 ? 1 : -1); beadLine(g, -550, 52, 550, 52, 3, 16); }); ink(g, 2.4, B);
  }, { seed: 87 });
  // the inn's door and a hanging sign
  P.door = piece([-110, -320, 110, 10], g => {
    const F = q => poly(q, [[-100, -300], [100, -300], [100, 0], [-100, 0]]); fill(g, DYE.brown, F); cut(g, q => q.rect(-80, -280, 160, 280)); ink(g, 2.4, F);
    const sign = q => poly(q, [[-50, -260], [50, -260], [50, -200], [-50, -200]]); fill(g, DYE.yellow, sign);
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.font = '400 44px "Ma Shan Zheng"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('客店', 0, -230); g.restore(); ink(g, 1.8, sign);
  }, { seed: 88 });
  // a small bed for old age / death
  P.bed = piece([-260, -150, 260, 100], g => {
    const back = q => poly(q, [[-250, -140], [-220, -140], [-220, 30], [-250, 30]]); fill(g, DYE.brown, back); ink(g, 1.8, back);
    const top = q => poly(q, [[-250, 0], [250, 0], [250, 30], [-250, 30]]); fill(g, DYE.red, top); within(g, top, () => meander(g, -240, 24, 240, 6, 1.8)); ink(g, 2, top);
    for (const x of [-230, 230]) { const l = q => poly(q, [[x - 12, 30], [x + 12, 30], [x + 12, 96], [x - 12, 96]]); fill(g, DYE.brown, l); ink(g, 1.6, l); }
    const cov = q => smooth(q, [[-180, 2], [-120, -40], [80, -46], [200, -20], [220, 2]]); fill(g, DYE.yellow, cov); within(g, cov, () => { for (let x = -150; x < 200; x += 40) plum(g, x, -16, 7); }); ink(g, 1.8, cov);
  }, { seed: 89 });
  return P;
}
export function dp(g, Cam, pc, x, y, s = 1, rot = 0, opt = {}) {
  const c = Math.cos(rot), si = Math.sin(rot), fx = s * (opt.flip || 1);
  const M = [Cam[0] * c * fx, Cam[3] * si * fx, -Cam[0] * si * s, Cam[3] * c * s, Cam[0] * x + Cam[4], Cam[3] * y + Cam[5]];
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = opt.alpha ?? 1; if (opt.blur) g.filter = `blur(${opt.blur}px)`;
  g.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]); drawPiece(g, pc); g.restore();
}
