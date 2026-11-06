// Timing for 《一锅饭的一生》 (80s cel anime), seconds. Cuts land on the 112 BPM bar grid where it matters (beat = .536 s).
export const FPS = 30, DUR = 73, BPM = 112, BEAT = 60 / 112;
export const SHOTS = [
  [0, 5.6, 'pot'], [5.6, 11.2, 'inn'], [11.2, 15.6, 'pillow'], [15.6, 19, 'dive'],
  [19, 21.4, 'wedding'], [21.4, 23.4, 'board'], [23.4, 27.4, 'robes'],
  [27.4, 29.1, 'rival'], [29.1, 31.4, 'exile'], [31.4, 35.2, 'run'],
  [35.2, 37.2, 'prison'], [37.2, 38.2, 'eyes'], [38.2, 39.0, 'knife'], [39.0, 40.8, 'grip'], [40.8, 42.2, 'tears'],
  [42.2, 45.4, 'peak'], [45.4, 47.6, 'family'], [47.6, 50.2, 'old'], [50.2, 55, 'end'],
  [55, 60, 'rewind'], [60, 62, 'wake'], [62, 63.6, 'lid'], [63.6, 65, 'react'], [65, 66.4, 'lvsmile'], [66.4, 73, 'dawn'],
];
export const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
export const HIT = {
  flashes: [1.3, 1.65, 2.0, 2.35], title: 2.9, titleOff: 5.4,
  sigh: 8.0, offer: 12.6, glowHole: 14.0, white: 18.6,
  board: 22.2, robeQ: 23.7, robeL: 24.8, robeF: 26.0,
  impact1: 29.0, hush: 35.2, draw: 38.3, impact2: 38.9, grab: 39.2,
  crown: 42.3, harmony: 42.6, old: 47.6, close: 51.0, freeze: 52.4, blue: 53.0, static: 54.0,
  rew: 55.0, wakeOpen: 60.3, lid: 62.4, react: 64.1, bow: 67.6, walk: 68.8, freezeEnd: 71.0,
};
export const LINES = [
  { id: 'v01', at: .3, zh: '一锅黄米饭煮熟之前，他当了宰相，坐了大牢，儿孙满堂，然后老死。', ctx: '说书人口吻，开门见山，带点神秘，节奏紧凑' },
  { id: 'v02', at: 6.0, zh: '开元七年，邯郸道。穷书生卢生叹气：这辈子，太不得意了。我只想出将入相。', ctx: '娓娓道来，“太不得意了”带点怨气，“出将入相”带着不甘和向往', rate: 5 },
  { id: 'v03', at: 12.2, zh: '老道士递给他一个青瓷枕：枕上它，你想要的，都会有。', ctx: '神秘、低沉，后半句像耳语' },
  { id: 'v04', at: 19.2, zh: '他娶了名门崔家的女儿，考中进士，官越做越大。', ctx: '轻快、得意，越来越快', rate: 10 },
  { id: 'v05', at: 27.6, zh: '有人眼红，一句谗言，他被贬到千里之外。', ctx: '语气一沉，冷' },
  { id: 'v06', at: 31.6, zh: '他又一步步，爬了回来。', ctx: '咬牙、有劲' },
  { id: 'v07', at: 36.0, zh: '第二次，他被诬下狱。他拔刀要自刎，妻子拦住了他。', ctx: '紧张、压低，“拦住了他”一字一顿' },
  { id: 'v08', at: 42.6, zh: '后来，他官至中书令，封燕国公，儿孙满堂，活过八十。', ctx: '高亢、风光，最后半句渐慢渐轻', rate: 5 },
  { id: 'v09', at: 56.0, zh: '原来这一生，只在一个枕头里。', ctx: '轻声，像揭开谜底' },
  { id: 'v10', at: 60.6, zh: '他醒了。店家锅里的黄米饭，还没熟。', ctx: '平静，“还没熟”稍停顿后说出' },
  { id: 'v11', at: 67.2, zh: '换作是你，醒来以后，还会去赶考吗？', ctx: '轻声发问，留有余味' },
];
