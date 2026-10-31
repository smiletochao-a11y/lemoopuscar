"""Platform covers from frames of the finished film + Ma Shan Zheng / Noto Serif SC (OFL, Google Fonts, subset to the
cover text). usage: python -I tools/covers.py <film_dir>   (needs cover/bg_0.35.jpg and cover/bg_47.5.png from the film)"""
import sys, os, re, io, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D = sys.argv[1]; C = os.path.join(D, 'cover')
TITLE, SUB, HOOK, NUM = '另一个你', '宇宙里，可能还有一个你', '他离你多远？', '10^10^29 米'
def font(fam, w, size, text):
    css = urllib.request.urlopen('https://fonts.googleapis.com/css2?family=' + urllib.parse.quote(fam) + f':wght@{w}&text=' + urllib.parse.quote(text), timeout=60).read().decode()
    return lambda s: ImageFont.truetype(io.BytesIO(urllib.request.urlopen(re.findall(r'url\((https://[^)]+)\)', css)[0], timeout=60).read()), s)
ALL = TITLE + SUB + HOOK + NUM + '0123456789^米平行世界'
brush = font('Ma Shan Zheng', 400, 0, ALL); serif = font('Noto Serif SC', 600, 0, ALL)
CREAM, INK, GOLD, SEAL = (240, 228, 200), (40, 28, 20), (224, 178, 98), (200, 50, 42)

def paper(d, box, fill=CREAM):
    x0, y0, x1, y1 = box; d.rounded_rectangle(box, radius=6, fill=fill)
def strip(im, cx, cy, text, f, fill=CREAM, ink=INK, pad=(0.5, 0.28)):
    d = ImageDraw.Draw(im); l, t, r, b = d.textbbox((0, 0), text, font=f); w, h = r - l, b - t
    px, py = int(f.size * pad[0]), int(f.size * pad[1])
    sh = Image.new('RGBA', im.size, 0); ImageDraw.Draw(sh).rounded_rectangle((cx - w / 2 - px + 8, cy - h / 2 - py + 12, cx + w / 2 + px + 8, cy + h / 2 + py + 12), 6, fill=(0, 0, 0, 150))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(im); d.rounded_rectangle((cx - w / 2 - px, cy - h / 2 - py, cx + w / 2 + px, cy + h / 2 + py), 6, fill=fill)
    d.text((cx - w / 2 - l, cy - h / 2 - t), text, font=f, fill=ink)
def number(im, x, y, s):   # 10^(10^29) 米, set like the film's strips: big 10, smaller 10, smallest 29
    f1, f2, f3, fu = serif(int(150 * s)), serif(int(72 * s)), serif(int(44 * s)), serif(int(80 * s))
    strip(im, x, y, '10', f1, GOLD, pad=(.25, .1)); strip(im, x + 150 * s, y - 100 * s, '10', f2, GOLD, pad=(.25, .1))
    strip(im, x + 240 * s, y - 160 * s, '29', f3, GOLD, pad=(.25, .1)); strip(im, x + 300 * s, y + 20 * s, '米', fu, CREAM, pad=(.3, .15))
def seal(im, x, y, text, s):
    d = ImageDraw.Draw(im); f = brush(int(s * .42)); d.rounded_rectangle((x, y, x + s, y + s), 8, fill=SEAL)
    for i, ch in enumerate(text): d.text((x + s * (.27 if i % 2 == 0 else .73), y + s * (.3 if i < 2 else .72)), ch, font=f, fill=CREAM, anchor='mm')
def fit(src, W, H, oy=.5):
    s = max(W / src.width, H / src.height); im = src.resize((round(src.width * s), round(src.height * s)), Image.LANCZOS)
    x, y = (im.width - W) // 2, int((im.height - H) * oy); return im.crop((x, y, x + W, y + H))
def grade(im):   # darken the bottom so text reads
    g = Image.new('RGBA', im.size, 0); dg = ImageDraw.Draw(g)
    for y in range(im.height): dg.line((0, y, im.width, y), fill=(6, 10, 26, int(140 * max(0, (y / im.height - .45) / .55))))
    im.alpha_composite(g); return im

bg = Image.open(os.path.join(C, 'bg_0.35.jpg')).convert('RGBA')
def vertical(W, H, oy):
    im = grade(fit(bg, W, H, oy)); k = W / 1080
    strip(im, W // 2, int(H * .13), TITLE, brush(int(170 * k)), pad=(.35, .12))
    strip(im, W // 2, int(H * .245), SUB, serif(int(52 * k)), pad=(.5, .35))
    yb = H - int(H * .075) - int(150 * k)   # bottom band, under the lit window
    strip(im, W // 2, yb - int(225 * k), HOOK, serif(int(56 * k)), (20, 30, 60), CREAM)
    number(im, W // 2 - int(150 * k), yb, k)
    seal(im, int(W * .80), int(H * .30), '平行世界', int(110 * k)); return im.convert('RGB')
vertical(1080, 1920, .5).save(os.path.join(C, 'douyin_9x16.jpg'), quality=92)
x = vertical(1080, 1440, 1.0); x.save(os.path.join(C, 'xiaohongshu_3x4.jpg'), quality=92); x.save(os.path.join(C, 'shipinhao_3x4.jpg'), quality=92)
# 16:9: the frame blurred as a backdrop, the sharp vertical frame on the left third, text on the right
W, H = 1920, 1080; im = fit(bg, W, H, .3).filter(ImageFilter.GaussianBlur(28)); im = Image.blend(im, Image.new('RGBA', im.size, (6, 10, 26, 255)), .45)
fr = fit(bg, 608, 1080, .5); im.alpha_composite(fr, (200, 0))
strip(im, 1360, 250, TITLE, brush(190), pad=(.35, .12)); strip(im, 1360, 420, SUB, serif(54), pad=(.5, .35))
strip(im, 1360, 560, HOOK, serif(54), (20, 30, 60), CREAM); number(im, 1180, 820, 1); seal(im, 1680, 680, '平行世界', 120)
im.convert('RGB').save(os.path.join(C, 'shipinhao_16x9.jpg'), quality=92)
print('ok')
