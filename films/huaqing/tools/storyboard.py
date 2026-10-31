"""Storyboard sheet: key frames rendered by the film's own code (vertical), 5 per row, with shot number, time, framing and line.
usage: python -I tools/storyboard.py <film_dir>   (frames in <film_dir>/storyboard/t_<time>.jpg)"""
import sys, os, re, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1]
SHOTS = [
    ('2.5', '1', '0–4.5 s', '俯视特写 · 锁定', '她伸手试水，印章盖下「246 天」'),
    ('7.5', '2', '4.5–11 s', '立轴下摇', '雪中骊山 → 山脚华清宫'),
    ('14.6', '3', '11–18 s', '中景背影 · 缓推', '别上红海棠；逐笔写出诗句'),
    ('20.5', '4', '18–22 s', '手卷横摇', '宫灯、乐人、长袖舞，她在笑'),
    ('27', '5', '22–31 s', '上下分屏（签名镜头）', '上：快马逼近；下：歌舞继续；210…'),
    ('32.5', '6', '31–33.5 s', '回到第 1 镜 · 静默', '池面静止，只有一滴水'),
    ('35', '7', '33.5–37 s', '一笔飞白 → 硬切', '快马冲入骊山'),
    ('39.6', '8a', '37–41.4 s', '大特写 · 军报', '焦墨写出「反」，印章「206」'),
    ('42.4', '8b', '41.4–43 s', '中景 · 她抬头', '花瓣从发间滑落'),
    ('45', '9', '43–48 s', '回到第 3 镜', '热气倒着被擦去，人影淡出'),
    ('51', '10', '48–53 s', '手卷横摇 · 雨', '一路向西，数字越跳越快'),
    ('55.8', '11', '53–57 s', '满屏留白', '红花瓣落地，印章「0」：马嵬坡'),
    ('63', '12', '57–65 s', '锁定 · 书写', '诗句写满留白，盖住她的身影'),
    ('69', '13', '65–70 s', '俯视 · 回到第 1 镜', '今天的海棠汤，游客举着手机'),
]
chars = ''.join(sorted(set(''.join(''.join(s[2:]) for s in SHOTS) + '华清池她还剩两百多天中国水墨分镜真实渲染帧竖屏—ab')))
font_path = os.path.join(D, 'storyboard', '.font.ttf')
if not os.path.exists(font_path):
    css = urllib.request.urlopen(urllib.request.Request('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@500&text=' + urllib.parse.quote(chars + '0123456789–→+…·（）%.^ s'), headers={'User-Agent': 'curl/8'}), timeout=60).read().decode()
    open(font_path, 'wb').write(urllib.request.urlopen(re.findall(r'url\((https://[^)]+)\)', css)[0], timeout=60).read())
F1 = ImageFont.truetype(font_path, 21); F2 = ImageFont.truetype(font_path, 18)
C, w, h, cap, pad = 5, 330, 587, 92, 14
rows = (len(SHOTS) + C - 1) // C
S = Image.new('RGB', (C * w + (C + 1) * pad, rows * (h + cap) + (rows + 1) * pad + 52), (14, 14, 18)); d = ImageDraw.Draw(S)
d.text((pad, 14), '华清池 · 她还剩两百多天 — 中国水墨分镜（真实渲染帧，竖屏）', font=F1, fill=(242, 236, 224))
for k, (t, n, span, frame, line) in enumerate(SHOTS):
    x = pad + (k % C) * (w + pad); y = 52 + pad + (k // C) * (h + cap + pad)
    S.paste(Image.open(os.path.join(D, 'storyboard', f't_{t}.jpg')).convert('RGB').resize((w, h), Image.LANCZOS), (x, y))
    d.text((x, y + h + 6), f'{n} · {span}', font=F1, fill=(230, 120, 100))
    d.text((x, y + h + 34), frame, font=F2, fill=(240, 220, 190))
    d.text((x, y + h + 60), line, font=F2, fill=(225, 225, 228))
out = os.path.join(D, 'storyboard', 'storyboard.jpg'); S.save(out, quality=90); print(out, S.size)
