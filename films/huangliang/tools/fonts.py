"""Fonts (OFL, Google Fonts) subset to the characters the film uses: Noto Serif SC 500/600 (subtitles, seal digits) and
Ma Shan Zheng (calligraphy). usage: python -I tools/fonts.py <film_dir>"""
import sys, os, re, glob, urllib.request, urllib.parse
D = sys.argv[1]
src = ''.join(open(f, encoding='utf-8').read() for f in glob.glob(os.path.join(D, '**/*.js'), recursive=True) if '/node_modules/' not in f and '/archive-' not in f)
cjk = sorted(set(re.findall(r'[　-〿一-鿿＀-￯“”·]', src)))
text = ''.join(cjk) + '0123456789%.,:;-+()/ 说■◀▶—…STOP'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': UA}), timeout=60).read()
os.makedirs(os.path.join(D, 'fonts'), exist_ok=True)
for fam, w, out in (('Noto Sans SC', 700, 'NotoSansSC-700.woff2'), ('Noto Sans SC', 900, 'NotoSansSC-900.woff2')):
    css = get('https://fonts.googleapis.com/css2?family=' + urllib.parse.quote(fam) + f':wght@{w}&text=' + urllib.parse.quote(text)).decode()
    url = re.findall(r'url\((https://[^)]+)\)', css)[0]
    open(os.path.join(D, 'fonts', out), 'wb').write(get(url)); print(out, len(cjk), 'CJK chars')
