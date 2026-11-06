"""Storyboard sheet: key frames rendered by the film's own code (vertical), 5 per row, with shot number, time, framing and line.
usage: python -I tools/storyboard.py <film_dir>   (frames in <film_dir>/storyboard/t_<time>.jpg)"""
import sys, os, re, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1]
SHOTS = [
    ('.05', '1', '0–1.3 s', '插入特写 · 锅（首帧即画面）', '锅盖在跳，金色蒸汽逆光'),
    ('1.4', '1b', '1.3–2.7 s', '闪回 ×4（各 9 帧）', '紫袍金冠 / 牢狱 / 刀光 / 白发'),
    ('3.6', '1c', '2.9–5.4 s', '片名在上，字幕在中', '镀铬字《一锅饭的一生》'),
    ('9', '2', '5.6–11.2 s', '近景 · 叹气', '"我只想出将入相"'),
    ('13.4', '3', '11.2–15.6 s', '插入 · 青瓷枕', '老道士掌心托枕，两端孔透光'),
    ('17.2', '4', '15.6–19 s', '推进枕孔', '光从孔里涌出，速度线，白闪'),
    ('22', '5', '21.4–22.2 s', '插入 · 进士榜', '榜上"卢生"二字'),
    ('22.8', '5b', '22.2–23.4 s', '速度线 · 惊喜', '瞳孔放大，眼中星芒'),
    ('25.6', '5c', '23.4–27.4 s', '光带扫过 · 换袍', '官袍 青 → 绿 → 绯'),
    ('28.2', '6', '27.4–29.1 s', '紫色夜景', '三角眼的对头半脸藏在阴影里耳语'),
    ('37.6', '8', '37.2–38.2 s', '眼睛大特写', '牢中，他下了决心'),
    ('40', '8b', '39–40.8 s', '双手特写', '他握刀，妻子的手扣住他的手腕'),
    ('46.9', '9', '45.4–47.6 s', '计数式群像', '五个儿子逐个登场，孙辈一排举手'),
    ('56.5', '11', '55–60 s', '倒带', '白发→紫袍→刀→金榜→婚礼→枕孔'),
    ('64.6', '12', '63.6–65 s', '反应特写', '掀锅：饭还生；他先愣住，再苦笑'),
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
