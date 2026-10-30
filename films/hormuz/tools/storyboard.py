"""Storyboard sheet: key stills rendered by the film's own code, 3 x 3, each with shot number,
framing, time and the narration under it. usage: python -I tools/storyboard.py <film_dir>"""
import sys, os, re, urllib.request, urllib.parse, io
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1]
SHOTS = [
    ('6', '1', '特写 · 正射 · 扫描刷出 + 缓推', '0–9 s', '海峡里的一艘船，长约 320 米。满载约 200 万桶原油。'),
    ('19', '2', '特写 → 大远景 · 对数爬升（签名镜头）', '9–22 s', '每天经过这里的石油，能装满约 10 艘这样的船……霍尔木兹海峡。'),
    ('32', '3', '远景 · 测距线 · 跟拍尖端后拉开', '22–36 s', '最窄处，在大昆岛和拉腊克岛之间，宽 38.6 公里。'),
    ('45', '4', '中景 · 锁定 · 静默后航道印出，颜色回来', '36–48 s', '进、出各一条航道，每条只有约 3 公里宽。'),
    ('55', '5a', '远景 · 锁定画面 + 慢转', '48–57 s', '每天 2000 万桶……约占全球石油消费的五分之一。'),
    ('59.5', '5b', '甩镜至卡塔尔 · 远景', '57–61 s', '全球约五分之一的液化天然气，也走这条路。'),
    ('72', '6', '大远景 · 爬升到区域 · 管道虚线', '61–80 s', '绕开海峡的管道，可调用余量只有约 260 万桶，约为日常运量的 13%。'),
    ('99', '7', '斜视轨道 · 真彩回归 · 航线伸向亚洲', '80–101 s', '84% 运往亚洲……它只是一个点。'),
    ('108', '8', '斜视轨道 · 准星张开成片名', '101–112 s', '（片名卡）窄门 · 霍尔木兹海峡'),
]
chars = ''.join(sorted(set(''.join(''.join(s[2:]) for s in SHOTS) + '镜头分镜窄门霍尔木兹海峡—真实渲染帧ab')))
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
font_path = os.path.join(D, 'storyboard', '.font.ttf')
if not os.path.exists(font_path):
    css = urllib.request.urlopen(urllib.request.Request('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@500&text=' + urllib.parse.quote(chars + '0123456789–→+…·（）%. sm'), headers={'User-Agent': 'curl/8'}), timeout=60).read().decode()
    url = re.findall(r'url\((https://[^)]+)\)', css)[0]
    open(font_path, 'wb').write(urllib.request.urlopen(url, timeout=60).read())
F1 = ImageFont.truetype(font_path, 22); F2 = ImageFont.truetype(font_path, 19)
w, h = 620, 349; cap = 92; pad = 14
S = Image.new('RGB', (3 * w + 4 * pad, 3 * (h + cap) + 4 * pad + 50), (14, 17, 20)); d = ImageDraw.Draw(S)
d.text((pad, 14), '窄门 · 霍尔木兹海峡 — 分镜（真实渲染帧）', font=F1, fill=(242, 245, 246))
for k, (t, n, frame, span, line) in enumerate(SHOTS):
    x = pad + (k % 3) * (w + pad); y = 50 + pad + (k // 3) * (h + cap + pad)
    im = Image.open(os.path.join(D, 'storyboard', f't_{t}.jpg')).convert('RGB').resize((w, h), Image.LANCZOS)
    S.paste(im, (x, y))
    d.text((x, y + h + 8), f'{n}  ·  {span}  ·  {frame}', font=F1, fill=(255, 190, 85))
    d.text((x, y + h + 40), line, font=F2, fill=(222, 226, 228))
out = os.path.join(D, 'storyboard', 'storyboard.jpg'); S.save(out, quality=90); print(out, S.size)
