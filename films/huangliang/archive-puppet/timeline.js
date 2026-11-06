// Single source of timing for 《一锅饭的一生》 (seconds). Voice start times are placed by hand; durations come from voice/dur.json.
export const FPS = 30, DUR = 72;
export const SH = { s1: 0, s2: 5, s3: 10, s4: 15, s5: 19, s6: 27, s7: 31, s8: 35, s9: 42, s10: 50, s11: 55, s12: 60, s13: 66 };
export const HIT = {
  clap: .15, title: .4, titleOff: 4.4,
  offer: 11.6, lieDown: 14.6, hole: 16.2, flash: 18.6,
  wed: 19.2, bang: 22.6, robe1: 25.0, robe2: 26.0,
  rival: 27.4, snuff1: 29.0, exile: 29.6,
  back1: 31.2, back2: 33.0,
  hush: 35.0, bars: 36.0, knife: 38.2, stop: 39.4,
  crown: 42.6, sons: 44.6, kids: 46.0, old: 47.6, lie: 48.8,
  out0: 50.2, dark: 54.0,
  backstage: 55.0, wake: 60.6, lid: 62.6, bow: 66.6, leave: 68.0, clap2: 71.5,
};
export const LINES = [
  { id: 'v01', at: .6, zh: '一锅小米饭煮熟之前，他会当上宰相、蹲进大牢、儿孙满堂，然后老死。', ctx: '说书人口吻，开门见山，带点神秘，句尾放慢' },
  { id: 'v02', at: 5.6, zh: '开元七年，邯郸道上的客店。穷书生卢生对着一位老道士叹气：这辈子，太不得意了。', ctx: '说书人娓娓道来，"太不得意了"带点怨气' },
  { id: 'v03', at: 11.0, zh: '老道士递给他一个青瓷枕：枕上它，你想要的，都会有。', ctx: '神秘、低沉，后半句像耳语' },
  { id: 'v04', at: 19.4, zh: '他娶了名门崔家的女儿，考中进士，官越做越大。', ctx: '轻快、得意，节奏越来越快', rate: 10 },
  { id: 'v05', at: 27.4, zh: '有人眼红，一句谗言，他被贬到千里之外。', ctx: '语气一沉，冷' },
  { id: 'v06', at: 31.4, zh: '他又一步步，爬了回来。', ctx: '咬牙、有劲' },
  { id: 'v07', at: 36.2, zh: '第二次，他被诬下狱。他拔刀要自刎，妻子拦住了他。', ctx: '紧张、压低，"拦住了他"一字一顿' },
  { id: 'v08', at: 42.8, zh: '后来，他官至中书令，封燕国公。五个儿子，儿孙满堂，活过了八十岁。', ctx: '高亢、风光，最后半句渐慢渐轻', rate: 5 },
  { id: 'v09', at: 56.0, zh: '原来这一生，只在一个枕头里。', ctx: '轻声，像揭开谜底' },
  { id: 'v10', at: 61.0, zh: '他醒了。店家锅里的小米饭，还没熟。', ctx: '平静，"还没熟"稍停顿后说出' },
  { id: 'v11', at: 67.2, zh: '换作是你，醒来以后，还会去赶考吗？', ctx: '轻声发问，留有余味' },
];
