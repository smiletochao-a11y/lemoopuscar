"""Storyboard sheet: key frames rendered by the film's own code (vertical), 5 per row, with shot number, time, framing and line.
usage: python -I tools/storyboard.py <film_dir>   (frames in <film_dir>/storyboard/t_<time>.jpg)"""
import sys, os, re, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1]
SHOTS = [
    ('2', '1', '0–5 s', '锁定 · 客店', '醒木一拍，片名牌贴幕；一口锅冒着热气'),
    ('7.5', '2', '5–10 s', '轻推', '穷书生卢生对老道士叹气'),
    ('12.5', '3', '10–15 s', '中近景', '老道士递出两头有孔的青瓷枕'),
    ('17.6', '4', '15–19 s', '推进枕孔', '他躺下，镜头钻进枕头的孔，光铺满幕'),
    ('21', '5', '19–27 s', '全景 · 上梦下店', '娶崔家千金；下方他在睡，锅在煮'),
    ('24', '5b', '22.6 s', '换片', '金榜题名，灯又亮一盏'),
    ('29', '6', '27–31 s', '两人间空幕', '黑脸对头进谗言，灯灭两盏'),
    ('33', '7', '31–35 s', '换片加速', '他又一步步爬了回来'),
    ('39.8', '8', '35–42 s', '静默 → 急推 → 定格', '狱中拔刀自刎，妻子扑上拦住'),
    ('46', '9', '42–50 s', '满台灯火', '中书令、燕国公，儿孙满堂'),
    ('52.5', '10', '50–55 s', '锁定', '他老死，灯一盏盏熄灭'),
    ('57.5', '11', '55–60 s', '绕到幕后', '握着竹签的，是老道士的手'),
    ('63.8', '12', '60–66 s', '回到客店', '他醒了，掀开锅盖：饭还没熟'),
    ('69', '13', '66–72 s', '跟拍 · 灯被提走', '他一拜而去；换作是你，还会赶考吗？'),
]
chars = ''.join(sorted(set(''.join(''.join(s[2:]) for s in SHOTS) + '一锅饭的一生黄粱梦皮影戏分镜真实渲染帧竖屏—ab')))
font_path = os.path.join(D, 'storyboard', '.font.ttf')
if not os.path.exists(font_path):
    css = urllib.request.urlopen(urllib.request.Request('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@500&text=' + urllib.parse.quote(chars + '0123456789–→+…·（）%.^ s'), headers={'User-Agent': 'curl/8'}), timeout=60).read().decode()
    open(font_path, 'wb').write(urllib.request.urlopen(re.findall(r'url\((https://[^)]+)\)', css)[0], timeout=60).read())
F1 = ImageFont.truetype(font_path, 21); F2 = ImageFont.truetype(font_path, 18)
C, w, h, cap, pad = 5, 330, 587, 92, 14
rows = (len(SHOTS) + C - 1) // C
S = Image.new('RGB', (C * w + (C + 1) * pad, rows * (h + cap) + (rows + 1) * pad + 52), (14, 14, 18)); d = ImageDraw.Draw(S)
d.text((pad, 14), '一锅饭的一生 · 黄粱一梦 — 皮影戏分镜（真实渲染帧，竖屏）', font=F1, fill=(242, 236, 224))
for k, (t, n, span, frame, line) in enumerate(SHOTS):
    x = pad + (k % C) * (w + pad); y = 52 + pad + (k // C) * (h + cap + pad)
    S.paste(Image.open(os.path.join(D, 'storyboard', f't_{t}.jpg')).convert('RGB').resize((w, h), Image.LANCZOS), (x, y))
    d.text((x, y + h + 6), f'{n} · {span}', font=F1, fill=(230, 120, 100))
    d.text((x, y + h + 34), frame, font=F2, fill=(240, 220, 190))
    d.text((x, y + h + 60), line, font=F2, fill=(225, 225, 228))
out = os.path.join(D, 'storyboard', 'storyboard.jpg'); S.save(out, quality=90); print(out, S.size)
