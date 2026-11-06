// Timing for 《一锅饭的一生》 (80s cel anime), seconds. Cuts land on the 112 BPM bar grid where it matters (beat = .536 s).
export const FPS = 30, DUR = 67, BPM = 112, BEAT = 60 / 112;
export const SHOTS = [
  [0, 5.6, 'pot'], [5.6, 11.2, 'inn'], [11.2, 15.6, 'pillow'], [15.6, 19, 'dive'],
  [19, 21.4, 'wedding'], [21.4, 23.4, 'board'], [23.4, 26.2, 'robes'],
  [26.2, 27.9, 'rival'], [27.9, 30.2, 'exile'], [30.2, 34.0, 'run'],
  [34.0, 36.0, 'prison'], [36.0, 37.0, 'eyes'], [37.0, 37.8, 'knife'], [37.8, 39.6, 'grip'], [39.6, 41.0, 'tears'],
  [41.0, 44.2, 'peak'], [44.2, 46.4, 'family'], [46.4, 48.2, 'old'], [48.2, 50.4, 'end'],
  [50.4, 55, 'rewind'], [55, 57, 'wake'], [57, 58.6, 'lid'], [58.6, 60, 'react'], [60, 61.4, 'lvsmile'], [61.4, 67, 'dawn'],
];
export const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
export const HIT = {
  flashes: [1.3, 1.65, 2.0, 2.35], title: 2.9, titleOff: 5.4,
  sigh: 8.0, offer: 12.6, glowHole: 14.0, white: 18.6,
  board: 22.2, robeQ: 23.6, robeL: 24.4, robeF: 25.2,
  impact1: 27.8, hush: 34.0, draw: 37.1, impact2: 37.7, grab: 38.0,
  crown: 41.1, harmony: 41.4, old: 46.4, close: 48.4, freeze: 49.0, blue: 49.2, static: 50.0,
  rew: 50.4, rewEnd: 55.0, wakeOpen: 55.3, lid: 57.4, react: 59.1, bow: 62.6, walk: 63.8, freezeEnd: 65.2,
};
export const LINES = [
  { id: 'v01', at: .3, zh: '一锅黄米饭煮熟之前，他当了宰相，坐了大牢，儿孙满堂，然后老死。', ctx: '说书人口吻，开门见山，带点神秘，节奏紧凑' },
  { id: 'v02', at: 6.3, zh: '开元七年，邯郸道。穷书生卢生叹气：这辈子，太不得意了。我只想出将入相。', ctx: '娓娓道来，“太不得意了”带点怨气，“出将入相”带着不甘和向往', rate: 5 },
  { id: 'v03', at: 13.3, zh: '老道士递给他一个青瓷枕：枕上它，你想要的，都会有。', ctx: '神秘、低沉，后半句像耳语' },
  { id: 'v04', at: 19.2, zh: '他娶了名门崔家的女儿，考中进士，官越做越大。', ctx: '轻快、得意，越来越快', rate: 10 },
  { id: 'v05', at: 26.4, zh: '有人眼红，一句谗言，他被贬到千里之外。', ctx: '语气一沉，冷' },
  { id: 'v06', at: 30.4, zh: '他又一步步，爬了回来。', ctx: '咬牙、有劲' },
  { id: 'v07', at: 34.8, zh: '第二次，他被诬下狱。他拔刀要自刎，妻子拦住了他。', ctx: '紧张、压低，“拦住了他”一字一顿' },
  { id: 'v08', at: 41.4, zh: '后来，他官至中书令，封燕国公，儿孙满堂，活过八十。', ctx: '高亢、风光，最后半句渐慢渐轻', rate: 5 },
  { id: 'v09', at: 50.6, zh: '原来这一生，只在一个枕头里。', ctx: '轻声，像揭开谜底' },
  { id: 'v10', at: 55.6, zh: '他醒了。店家锅里的黄米饭，还没熟。', ctx: '平静，“还没熟”稍停顿后说出' },
  { id: 'v11', at: 62.2, zh: '换作是你，醒来以后，还会去赶考吗？', ctx: '轻声发问，留有余味' },
];
