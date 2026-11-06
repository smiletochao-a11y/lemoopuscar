"""Platform covers: a frame of the film (no subtitles) + the chrome title (Noto Sans SC 900, OFL) as in the film's title card.
usage: node core/render/still.mjs films/huangliang 44 --q nosub=1 --size 1080x1920 --out films/huangliang/cover --prefix bg_
       python3 -I films/huangliang/tools/covers.py films/huangliang"""
import sys, os, re, io, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
D = sys.argv[1]; C = os.path.join(D, 'cover')
T1, T2, SUB, TAG = '一锅饭', '的一生', '饭还没熟，他已经过完了一辈子', '黄粱一梦'
def font(w, text):
    css = urllib.request.urlopen('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@' + str(w) + '&text=' + urllib.parse.quote(text), timeout=60).read().decode()
    data = urllib.request.urlopen(re.findall(r'url\((https://[^)]+)\)', css)[0], timeout=60).read()
    return lambda s: ImageFont.truetype(io.BytesIO(data), s)
ALL = T1 + T2 + SUB + TAG + '—，'
F9, F7 = font(900, ALL), font(700, ALL)
def grad(w, h, stops):
    g = Image.new('RGB', (w, h)); d = ImageDraw.Draw(g)
    for y in range(h):
        u = y / max(1, h - 1)
        for i in range(len(stops) - 1):
            a, ca = stops[i]; b, cb = stops[i + 1]
            if a <= u <= b: k = (u - a) / (b - a); d.line((0, y, w, y), fill=tuple(int(ca[j] + (cb[j] - ca[j]) * k) for j in range(3))); break
    return g
def chrome(im, text, cx, cy, size):
    f = F9(size); W, H = im.size
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).text((cx, cy), text, font=f, fill=255, anchor='mm')
    sk = lambda x: x.transform(x.size, Image.AFFINE, (1, .18, -.18 * cy, 0, 1, 0), Image.BICUBIC)
    m = sk(m)
    glow = m.filter(ImageFilter.MaxFilter(27)).filter(ImageFilter.GaussianBlur(10))
    im.paste(Image.new('RGB', (W, H), (255, 79, 168)), (0, 0), glow.point(lambda v: int(v * .9)))
    im.paste(Image.new('RGB', (W, H), (26, 10, 42)), (0, 0), m.filter(ImageFilter.MaxFilter(15)))
    box = m.getbbox(); g = grad(W, box[3] - box[1], [(0, (127, 216, 255)), (.42, (255, 255, 255)), (.47, (122, 74, 176)), (.7, (255, 122, 176)), (1, (255, 210, 106))])
    full = Image.new('RGB', (W, H)); full.paste(g, (0, box[1])); im.paste(full, (0, 0), m)
def outlined(im, text, cx, cy, size, fill=(255, 240, 160)):
    d = ImageDraw.Draw(im); d.text((cx, cy), text, font=F7(size), fill=fill, anchor='mm', stroke_width=max(4, size // 9), stroke_fill=(18, 10, 30))
def fit(src, W, H, oy=.5):
    s = max(W / src.width, H / src.height); im = src.resize((round(src.width * s), round(src.height * s)), Image.LANCZOS)
    x, y = (im.width - W) // 2, int((im.height - H) * oy); return im.crop((x, y, x + W, y + H))
bg = Image.open(os.path.join(C, 'bg_44.jpg')).convert('RGB')
def vertical(W, H, oy, ty=.68, ks=1.0, sc=1.0):
    if sc < 1:      # shrink the frame into a blurred copy of itself so the crown and the face both fit above the title
        im = fit(bg, W, H, oy).filter(ImageFilter.GaussianBlur(30)); sm = bg.resize((int(bg.width * sc), int(bg.height * sc)), Image.LANCZOS)
        im.paste(sm, ((W - sm.width) // 2, -int(sm.height * .06)))
    else: im = fit(bg, W, H, oy)
    k = W / 1080 * ks
    shade = Image.new('L', (W, H)); ImageDraw.Draw(shade).rectangle((0, int(H * .55), W, H), fill=150); shade = shade.filter(ImageFilter.GaussianBlur(120))
    im.paste(Image.new('RGB', (W, H), (14, 6, 22)), (0, 0), shade)
    chrome(im, T1, W // 2, int(H * ty), int(190 * k)); chrome(im, T2, W // 2, int(H * ty) + int(210 * k), int(190 * k))
    outlined(im, '— ' + TAG + ' —', W // 2, int(H * ty) + int(360 * k), int(50 * k), (255, 210, 106))
    outlined(im, SUB, W // 2, int(H * ty) + int(450 * k), int(52 * k))
    return im
vertical(1080, 1920, .5).save(os.path.join(C, 'douyin_9x16.jpg'), quality=92)
x = vertical(1080, 1440, .05, .72, .82, .8); x.save(os.path.join(C, 'xiaohongshu_3x4.jpg'), quality=92); x.save(os.path.join(C, 'shipinhao_3x4.jpg'), quality=92)
W, H = 1920, 1080; im = fit(bg, W, H, .25).filter(ImageFilter.GaussianBlur(26)); im = Image.blend(im, Image.new('RGB', (W, H), (14, 6, 22)), .4)
im.paste(fit(bg, 608, 1080, .3), (160, 0))
chrome(im, T1, 1330, 330, 180); chrome(im, T2, 1330, 530, 180); outlined(im, '— ' + TAG + ' —', 1330, 690, 52, (255, 210, 106)); outlined(im, SUB, 1330, 790, 50)
im.save(os.path.join(C, 'shipinhao_16x9.jpg'), quality=92)
print('ok')
