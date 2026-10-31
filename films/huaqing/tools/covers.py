"""Platform covers from a frame of the film's own renderer (no subtitles) + ink calligraphy (Ma Shan Zheng) + the vermilion seal.
usage: node core/render/still.mjs films/huaqing 11.5 --q nosub=1 --size 1080x1920 --out films/huaqing/cover --prefix bg_
       python3 -I films/huaqing/tools/covers.py films/huaqing"""
import sys, os, re, io, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D = sys.argv[1]; C = os.path.join(D, 'cover')
TITLE, SUB, NUM = '她还剩两百多天', '杨贵妃 · 华清池', '246'
def font(fam, w, text):
    css = urllib.request.urlopen('https://fonts.googleapis.com/css2?family=' + urllib.parse.quote(fam) + f':wght@{w}&text=' + urllib.parse.quote(text), timeout=60).read().decode()
    data = urllib.request.urlopen(re.findall(r'url\((https://[^)]+)\)', css)[0], timeout=60).read()
    return lambda s: ImageFont.truetype(io.BytesIO(data), s)
brush = font('Ma Shan Zheng', 400, TITLE + SUB + '天'); serif = font('Noto Serif SC', 600, SUB + NUM + '天')
INK, VERM, PAPER = (24, 20, 17), (176, 46, 34), (243, 236, 222)
def vcol(im, x, y, text, f, fill=INK, gap=1.04):
    d = ImageDraw.Draw(im)
    for i, ch in enumerate(text):
        if ch in ' ·': y += f.size * .5; continue
        d.text((x, y), ch, font=f, fill=fill, anchor='mt'); y += f.size * gap
    return y
def seal(im, x, y, s, n):
    d = ImageDraw.Draw(im); d.rectangle((x, y, x + s, y + s), fill=VERM)
    d.text((x + s / 2, y + s * .44), n, font=serif(int(s * .5)), fill=PAPER, anchor='mm'); d.text((x + s / 2, y + s * .82), '天', font=serif(int(s * .17)), fill=PAPER, anchor='mm')
def fit(src, W, H, ox=.5, oy=.5):
    s = max(W / src.width, H / src.height); im = src.resize((round(src.width * s), round(src.height * s)), Image.LANCZOS)
    x, y = int((im.width - W) * ox), int((im.height - H) * oy); return im.crop((x, y, x + W, y + H))
bg = Image.open(os.path.join(C, 'bg_11.5.jpg')).convert('RGB')
def vertical(W, H, oy):
    im = fit(bg, W, H, .5, oy); k = W / 1080
    vcol(im, int(W * .82), int(H * .07), TITLE, brush(int(150 * k)))
    seal(im, int(W * .7), int(H * .07) + int(150 * k * 7.4), int(120 * k), NUM)
    vcol(im, int(W * .1), int(H * .08), SUB, serif(int(44 * k)), (70, 62, 55))
    return im
vertical(1080, 1920, .5).save(os.path.join(C, 'douyin_9x16.jpg'), quality=92)
x = vertical(1080, 1440, .62); x.save(os.path.join(C, 'xiaohongshu_3x4.jpg'), quality=92); x.save(os.path.join(C, 'shipinhao_3x4.jpg'), quality=92)
# 16:9: the painting on the left, the title written across the blank paper on the right
W, H = 1920, 1080; im = Image.new('RGB', (W, H), PAPER); im.paste(fit(bg, 640, 1080, .5, .62), (180, 0))
paper = bg.crop((640, 0, 1080, 432)).resize((1100, 1080), Image.LANCZOS).filter(ImageFilter.GaussianBlur(3)); im.paste(paper, (820, 0))
vcol(im, 1560, 90, TITLE, brush(120)); seal(im, 1340, 120, 110, NUM); vcol(im, 1250, 300, SUB, serif(42), (70, 62, 55))
im.save(os.path.join(C, 'shipinhao_16x9.jpg'), quality=92)
print('ok')
