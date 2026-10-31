// Single source of timing. Times in seconds. Voice start times (at) are placed by hand to the picture; durations come from voice/dur.json once voiced.
export const FPS = 30, DUR = 70;
// shot starts
export const SH = { s1: 0, s2: 4.5, s3: 11, s4: 18, s5: 22, s6: 31, s7: 33.5, s8: 37, s9: 43, s10: 48, s11: 53, s12: 57, s13: 65 };
// key hits
export const HIT = {
  hand: .6, stamp: 2.6,                 // the hand enters the water; the seal "246" lands
  pin: 14.2,                            // she pins the petal into her bun
  rider: 22.6,                          // the rider appears on the mountain road
  hush: 31, drip: 32.2,                 // silence; one drip
  stroke: 33.5, hoof: 34.4,             // flying-white stroke; hard cut to the hoof
  scroll: 37.2, fan: 38.6, stamp206: 40.4, look: 41.4, fall: 41.9,
  erase: 43.4, west: 48, zero: 55.2,
  poem: 57.4, today: 65, seal: 68.6,
};
// days left, as shown on the seal; 246 at 755-11-12 (arrival), 206 at 755-12-22 (the news), 0 at 756-07-15 (Mawei)
export const DAYS = [[0, 246], [4.5, 240], [18, 226], [22, 214], [31, 207], [HIT.stamp206, 206], [48, 30], [53, 3], [HIT.zero, 0]];
export const LINES = [
  { id: 'v01', at: .3, zh: '755年冬天，华清池。', say: '七五五年冬天，华清池。', ctx: '用低沉、平静的语气，像在讲一个秘密' },
  { id: 'v02', at: 2.2, zh: '她不知道，自己只剩两百多天。', say: '她不知道，自己只剩两百多天。', ctx: '平静，略带惋惜，“两百多天”稍慢' },
  { id: 'v03', at: 5.2, zh: '那年冬天，唐玄宗照例带她来骊山泡温泉。', ctx: '舒缓、温和，像在描绘一幅画' },
  { id: 'v04', at: 11.6, zh: '春寒赐浴华清池，温泉水滑洗凝脂。', ctx: '吟诵古诗，舒缓，两句之间稍作停顿', rate: -10 },
  { id: 'v05', at: 18.2, zh: '有歌，有舞，有一年里最暖的水。', ctx: '温暖、轻快一点' },
  { id: 'v06', at: 23.4, zh: '她看不见的是，北边，一匹快马正在路上。', ctx: '压低声音，制造悬念，逐渐收紧' },
  { id: 'v07', at: 34.6, zh: '天宝十四载十一月，', ctx: '沉稳有力，一字一顿' },
  { id: 'v08', at: 37.4, zh: '安禄山起兵的消息，送到了华清宫。', ctx: '沉重、克制' },
  { id: 'v09', at: 43.8, zh: '热气散了。', ctx: '很轻，像叹气', rate: -15 },
  { id: 'v10', at: 48.4, zh: '第二年夏天，长安失守，他们一路向西。', ctx: '平静而快，像时间在加速' },
  { id: 'v11', at: 54.4, zh: '马嵬坡。', ctx: '非常轻，非常慢', rate: -20 },
  { id: 'v12', at: 57.6, zh: '后来的浪漫，都是别人写的。', ctx: '平静，像揭开一个事实' },
  { id: 'v13', at: 60.2, zh: '写“温泉水滑洗凝脂”的白居易，在她死后十六年才出生。', say: '写温泉水滑洗凝脂的白居易，在她死后十六年才出生。', ctx: '平静，略带讽刺' },
  { id: 'v14', at: 65.6, zh: '你记住的杨贵妃，是她本人，还是诗里的她？', ctx: '轻声发问，留有余味' },
];
export const POEM = ['春寒赐浴华清池', '温泉水滑洗凝脂'];
export function daysAt(t) {
  let v = DAYS[0][1];
  for (let i = 0; i < DAYS.length - 1; i++) { const [a, x] = DAYS[i], [b, y] = DAYS[i + 1]; if (t >= a && t < b) return Math.round(x + (y - x) * (t - a) / (b - a)); if (t >= b) v = y; }
  return v;
}
