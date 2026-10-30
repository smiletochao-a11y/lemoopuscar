"""Sentinel-2 L2A (Copernicus, free and open with credit) through the Planetary Computer data API,
reprojected to a lon/lat bbox. usage: python -I tools/fetch_s2.py <film_dir> <item> w,s,e,n WxH <out.npz>
Logs the request URL to assets/raw/manifest.jsonl."""
import sys, os, io, json, datetime, urllib.request, urllib.parse, time
import numpy as np
D, item, bb, wh, out = sys.argv[1:6]
w, h = map(int, wh.split('x'))
qs = [('collection', 'sentinel-2-l2a'), ('item', item)] + [('assets', b) for b in ('B04', 'B03', 'B02', 'B08')] + [('resampling', 'bilinear'), ('reproject', 'bilinear')]
url = f'https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/{bb}/{w}x{h}.npy?' + urllib.parse.urlencode(qs)
for k in range(5):
    try:
        raw = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'film/1.0'}), timeout=300).read(); break
    except Exception as e:
        if k == 4: raise
        time.sleep(3 + 3 * k)
a = np.load(io.BytesIO(raw), allow_pickle=False)
np.savez_compressed(out, arr=a, bbox=np.array(list(map(float, bb.split(',')))), item=item)
open(os.path.join(D, 'assets/raw/manifest.jsonl'), 'a').write(json.dumps({'plate': 's2', 'item': item, 'url': url, 'accessed': datetime.date.today().isoformat()}) + '\n')
print('wrote', out, a.shape, a.dtype)
