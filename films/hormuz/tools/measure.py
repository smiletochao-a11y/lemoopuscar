"""Narrowest crossing of the strait, measured on the Landsat 'narrows' composite (2025-01-24/25).
Water = MNDWI (green, swir16) > 0; land components are given to Oman (Musandam and its islands)
or Iran by their centroid; the shortest land-to-land distance between the two sides is the reading.
usage: python -I tools/measure.py <film_dir>  -> assets/measure.json"""
import sys, os, json, math
import numpy as np
from scipy import ndimage
from scipy.spatial import cKDTree
D = sys.argv[1]
z = np.load(os.path.join(D, 'assets/raw/landsat/narrows.npz'), allow_pickle=False)
meta = json.loads(str(z['meta'])); b = z['bands'].astype(np.float32); valid = z['valid']
bi = {k: i for i, k in enumerate(meta['bands'])}
g, s = b[bi['green']], b[bi['swir16']]
mndwi = (g - s) / np.maximum(g + s, 1e-4)
land = (mndwi < 0) & valid
land = ndimage.binary_opening(land, iterations=1)
lab, n = ndimage.label(land)
w, so, e, nn = meta['plate']; W, H = meta['W'], meta['H']
sizes = ndimage.sum(land, lab, range(1, n + 1))
com = ndimage.center_of_mass(land, lab, range(1, n + 1))
lat0 = 26.5
kx = 111.32 * math.cos(math.radians(lat0)) * meta['dlon']; ky = 110.57 * meta['dlat']
oman, iran = [], []
for i, (sz, (cy, cx)) in enumerate(zip(sizes, com)):
    if sz < 150: continue                                 # < ~13 ha: ships (a 330 m tanker with its wake is < 80 px), rocks, noise
    lat = nn - cy * meta['dlat']; lon = w + cx * meta['dlon']
    (oman if lat < 26.65 else iran).append(i + 1)
edge = land & ~ndimage.binary_erosion(land)
def pts(ids):
    m = np.isin(lab, ids) & edge
    y, x = np.nonzero(m); return np.stack([x * kx, y * ky], 1), np.stack([w + x * meta['dlon'], nn - y * meta['dlat']], 1)
po, lo = pts(oman); pi, li = pts(iran)
d, j = cKDTree(pi).query(po)
k = int(d.argmin())
A, B = lo[k].tolist(), li[j[k]].tolist()
# great-circle check
R = 6371.0088
p1, p2 = math.radians(A[1]), math.radians(B[1]); dl = math.radians(B[0] - A[0])
gc = R * math.acos(math.sin(p1) * math.sin(p2) + math.cos(p1) * math.cos(p2) * math.cos(dl))
out = {'oman_point': A, 'iran_point': B, 'km_plane': float(d[k]), 'km_great_circle': gc,
       'scenes': meta['scenes'], 'method': 'MNDWI(green,swir16)>0 water on Landsat C2 L2 composite, land components >= 150 px (13 ha), nearest land-to-land'}
json.dump(out, open(os.path.join(D, 'assets/measure.json'), 'w'), indent=1)
print(json.dumps({k: v for k, v in out.items() if k != 'scenes'}, indent=1))
if '--list' in sys.argv:
    for i, (sz, (cy, cx)) in enumerate(zip(sizes, com)):
        lat = nn - cy * meta['dlat']; lon = w + cx * meta['dlon']
        if sz >= 3 and 26.35 < lat < 27.0 and 56.25 < lon < 56.95: print(i + 1, int(sz), round(lon, 4), round(lat, 4), 'oman' if lat < 26.65 else 'iran')
