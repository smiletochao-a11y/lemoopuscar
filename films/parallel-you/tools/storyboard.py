"""Storyboard sheet: key frames rendered by the film's own code (vertical), 3 per row, with shot number, framing, time and line.
usage: python -I tools/storyboard.py <film_dir>"""
import sys, os, re, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1]
SHOTS = [
    ('1.5', '1', '0–4.4 s', '全景 · 已亮灯 · 缓推', '两扇窗、同一个剪影、同一个动作。'),
    ('7.4', '2', '4.4–8.6 s', '焦点后移到远窗', '两人同时抬拇指；随后纸幕合上。'),
    ('16', '3', '8.6–20.5 s', '特写 · 3×3 纸格', '小纸门越翻越快：最多 512 种图案。'),
    ('21.5', '4', '20.5–23.6 s', '两格并排 · 红印', '第 513 种 = 第 137 种，盖印“重复”。'),
    ('31.5', '5', '23.6–32.3 s', '拉远 · 针孔亮起', '身边的粒子排列多到吓人，但“有限”。'),
    ('39.5', '6', '32.3–40.2 s', '穿过一层层宇宙（签名镜头）', '最深一层的星图和我们一样：另一个你。'),
    ('52.5', '7', '40.2–53.2 s', '纸条写出 10^(10^29) 米', '零字纸条横穿，读数长到 106 亿光年。'),
    ('57.4', '8', '53.2–58.5 s', '锁定 · 灯一层层熄灭', '“宇宙无限？”盖上红印“未知”，随后全黑。'),
    ('62.8', '9', '58.5–63.5 s', '重新亮灯 · 退出灯箱', '两人抬头；床头的纸雕灯，旁边手机亮起。'),
]
chars = ''.join(sorted(set(''.join(''.join(s[2:]) for s in SHOTS) + '另一个你分镜纸雕灯影真实渲染帧竖屏—')))
font_path = os.path.join(D, 'storyboard', '.font.ttf')
if not os.path.exists(font_path):
    css = urllib.request.urlopen(urllib.request.Request('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@500&text=' + urllib.parse.quote(chars + '0123456789–→+…·（）%.^ s'), headers={'User-Agent': 'curl/8'}), timeout=60).read().decode()
    open(font_path, 'wb').write(urllib.request.urlopen(re.findall(r'url\((https://[^)]+)\)', css)[0], timeout=60).read())
F1 = ImageFont.truetype(font_path, 21); F2 = ImageFont.truetype(font_path, 19)
w, h, cap, pad = 400, 711, 98, 16
S = Image.new('RGB', (3 * w + 4 * pad, 3 * (h + cap) + 4 * pad + 52), (14, 14, 18)); d = ImageDraw.Draw(S)
d.text((pad, 14), '另一个你 · 纸雕灯影 — 分镜（真实渲染帧，竖屏）', font=F1, fill=(242, 236, 224))
for k, (t, n, span, frame, line) in enumerate(SHOTS):
    x = pad + (k % 3) * (w + pad); y = 52 + pad + (k // 3) * (h + cap + pad)
    S.paste(Image.open(os.path.join(D, 'storyboard', f't_{t}.jpg')).convert('RGB').resize((w, h), Image.LANCZOS), (x, y))
    d.text((x, y + h + 6), f'{n} · {span}', font=F1, fill=(255, 196, 110))
    d.text((x, y + h + 34), frame, font=F2, fill=(255, 214, 160))
    d.text((x, y + h + 62), line, font=F2, fill=(225, 225, 228))
out = os.path.join(D, 'storyboard', 'storyboard.jpg'); S.save(out, quality=90); print(out, S.size)
