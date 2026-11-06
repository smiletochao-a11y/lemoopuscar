"""Storyboard sheet: key frames rendered by the film's own code (vertical), 5 per row, with shot number, time, framing and line.
usage: python -I tools/storyboard.py <film_dir>   (frames in <film_dir>/storyboard/t_<time>.jpg)"""
import sys, os, re, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1]
SHOTS = [
    ('1', '1', '0–5.6 s', '插入特写 · 锅', '锅盖在跳，金色蒸汽逆光'),
    ('2', '1b', '1.5–3.3 s', '冲击帧闪回 ×4', '紫袍 / 牢狱 / 刀光 / 白发，各 6 帧'),
    ('4.5', '1c', '3.4–5.4 s', '片名', '镀铬字《一锅饭的一生》霓虹闪现'),
    ('9', '2', '5.6–11.2 s', '摇下 → 近景', '黄昏客店；卢生叹气'),
    ('13', '3', '11.2–15.6 s', '插入 · 青瓷枕', '高光滑过，两端的孔透光'),
    ('20', '5', '19–21.4 s', '眼睛特写 · 红灯笼', '娶崔家千金'),
    ('22.5', '5b', '21.4–23.4 s', '速度线 · 惊喜', '金榜上有他的名字'),
    ('25', '5c', '23.4–27.4 s', '光带扫过 · 换袍', '官袍 青 → 绿 → 绯，踩鼓点'),
    ('28', '6', '27.4–31.4 s', '紫色夜景', '对头耳语，冲击帧，贬到千里外'),
    ('37.6', '8', '35.2–42.2 s', '眼睛大特写', '牢中，他下了决心'),
    ('40', '8b', '39–40.8 s', '双手特写', '拔刀自刎，妻子抓住他的手腕'),
    ('44', '9', '42.2–45.4 s', '华丽定格 · 慢摇', '紫袍金冠，宫灯如海'),
    ('51.5', '10', '50.2–55 s', '特写 → 蓝屏', '老眼合上，带子放完'),
    ('57', '11', '55–60 s', '倒带', '◀◀ 一生飞速倒放'),
    ('63.5', '12', '60–66 s', '插入 · 掀锅盖', '他醒了：饭还是生的'),
]
chars = ''.join(sorted(set(''.join(''.join(s[2:]) for s in SHOTS) + '一锅饭的一生黄粱梦赛璐璐动画年代分镜真实渲染帧竖屏—abc')))
font_path = os.path.join(D, 'storyboard', '.font.ttf')
if not os.path.exists(font_path):
    css = urllib.request.urlopen(urllib.request.Request('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@500&text=' + urllib.parse.quote(chars + '0123456789–→+…·（）%.^ s'), headers={'User-Agent': 'curl/8'}), timeout=60).read().decode()
    open(font_path, 'wb').write(urllib.request.urlopen(re.findall(r'url\((https://[^)]+)\)', css)[0], timeout=60).read())
F1 = ImageFont.truetype(font_path, 21); F2 = ImageFont.truetype(font_path, 18)
C, w, h, cap, pad = 5, 330, 587, 92, 14
rows = (len(SHOTS) + C - 1) // C
S = Image.new('RGB', (C * w + (C + 1) * pad, rows * (h + cap) + (rows + 1) * pad + 52), (14, 14, 18)); d = ImageDraw.Draw(S)
d.text((pad, 14), '一锅饭的一生 · 黄粱一梦 — 80 年代赛璐璐动画分镜（真实渲染帧，竖屏）', font=F1, fill=(242, 236, 224))
for k, (t, n, span, frame, line) in enumerate(SHOTS):
    x = pad + (k % C) * (w + pad); y = 52 + pad + (k // C) * (h + cap + pad)
    S.paste(Image.open(os.path.join(D, 'storyboard', f't_{t}.jpg')).convert('RGB').resize((w, h), Image.LANCZOS), (x, y))
    d.text((x, y + h + 6), f'{n} · {span}', font=F1, fill=(230, 120, 100))
    d.text((x, y + h + 34), frame, font=F2, fill=(240, 220, 190))
    d.text((x, y + h + 60), line, font=F2, fill=(225, 225, 228))
out = os.path.join(D, 'storyboard', 'storyboard.jpg'); S.save(out, quality=90); print(out, S.size)
