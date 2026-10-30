"""Plates for the page (assets/plates/): Blue Marble world + Middle East (NASA, public domain),
Landsat 'strait' (~80 m) and 'narrows' (~30 m) composites (USGS, public domain), and the Sentinel-2
detail around the tanker (Copernicus, ~8 m). Landsat and Sentinel are colour-matched to Blue Marble
on land so the nested plates dissolve into each other. Also writes ships.json: ships detected on the
Landsat narrows composite (bright NIR blobs on water), used to place the lanes.
usage: python -I tools/plates.py <film_dir>"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage
D = sys.argv[1]; RAW = os.path.join(D, 'assets/raw'); PL = os.path.join(D, 'assets/plates'); os.makedirs(PL, exist_ok=True)
Image.MAX_IMAGE_PIXELS = None
info = {}
world = Image.open(os.path.join(RAW, 'gibs/world.jpg')).convert('RGB'); world.save(os.path.join(PL, 'world.jpg'), quality=92)
info['world'] = {'bbox': [-180, -90, 180, 90], 'src': 'NASA Blue Marble: Next Generation (NASA GIBS)'}
me = Image.open(os.path.join(RAW, 'gibs/me.jpg')).convert('RGB'); me.save(os.path.join(PL, 'me.jpg'), quality=92)
MEB = [30, 8, 75, 38]
info['me'] = {'bbox': MEB, 'src': 'NASA Blue Marble: Next Generation (NASA GIBS)'}
mea = np.asarray(me, np.float32) / 255

def sample_ref(lon, lat):
    x = ((lon - MEB[0]) / (MEB[2] - MEB[0]) * mea.shape[1]).astype(int).clip(0, mea.shape[1] - 1)
    y = ((MEB[3] - lat) / (MEB[3] - MEB[1]) * mea.shape[0]).astype(int).clip(0, mea.shape[0] - 1)
    return mea[y, x]

def fit(rgb_lin, lon, lat, ok, ref=None):
    """per-channel gain on linear reflectance so that gamma(gain*r) matches the reference on land"""
    ref = sample_ref(lon, lat) if ref is None else ref
    g = []
    for c in range(3):
        a = rgb_lin[..., c][ok]; b = ref[..., c][ok] ** 2.2
        g.append(float(np.median(b) / max(np.median(a), 1e-4)))
    return np.array(g)

def landsat(name, ref=None):
    z = np.load(os.path.join(RAW, 'landsat', name + '.npz'), allow_pickle=False)
    meta = json.loads(str(z['meta'])); b = z['bands'].astype(np.float32); valid = z['valid']
    bi = {k: i for i, k in enumerate(meta['bands'])}
    rgb = np.stack([b[bi['red']], b[bi['green']], b[bi['blue']]], -1)
    w, s, e, n = meta['plate']; H, W = meta['H'], meta['W']
    lon = w + (np.arange(W) + .5) * meta['dlon']; lat = n - (np.arange(H) + .5) * meta['dlat']
    LO, LA = np.meshgrid(lon, lat)
    mndwi = (b[bi['green']] - b[bi['swir16']]) / np.maximum(b[bi['green']] + b[bi['swir16']], 1e-4)
    land = (mndwi < -0.1) & valid
    st = 4
    if ref is None:
        g = fit(rgb[::st, ::st], LO[::st, ::st], LA[::st, ::st], land[::st, ::st])
    else:
        g = fit(rgb[::st, ::st], None, None, land[::st, ::st], ref(LO[::st, ::st], LA[::st, ::st]))
    out = np.clip(rgb * g, 0, 1) ** (1 / 2.2)
    out[~valid] = sample_ref(LO, LA)[~valid] if ref is None else out[~valid]
    Image.fromarray((out * 255 + .5).astype(np.uint8)).save(os.path.join(PL, name + '.jpg'), quality=93)
    wm = ndimage.gaussian_filter(((mndwi > 0) & valid).astype(np.float32), 1.0)
    Image.fromarray((wm * 255).astype(np.uint8)).save(os.path.join(PL, name + '_w.png'))
    info[name] = {'bbox': [w, s, e, n], 'W': W, 'H': H, 'gain': g.round(3).tolist(), 'scenes': meta['scenes'], 'src': 'USGS Landsat 8/9 Collection 2 L2 (Planetary Computer)'}
    print(name, W, H, 'gain', g.round(2))
    return out, (w, s, e, n), (b, bi, valid, mndwi, meta)

strait, sb, _ = landsat('strait')
def ref_from(img, bb):
    def f(lon, lat):
        x = ((lon - bb[0]) / (bb[2] - bb[0]) * img.shape[1]).astype(int).clip(0, img.shape[1] - 1)
        y = ((bb[3] - lat) / (bb[3] - bb[1]) * img.shape[0]).astype(int).clip(0, img.shape[0] - 1)
        return img[y, x]
    return f
narrows, nb, (b, bi, valid, mndwi, meta) = landsat('narrows', ref_from(strait, sb))
landsat('qatar')

# ships on the narrows composite: small bright NIR blobs on open water
water = ndimage.binary_erosion((mndwi > 0.2) & valid, iterations=6)
nir = b[bi['nir08']]
bg = ndimage.median_filter(nir, 9)
blob = (nir - bg > 0.025) & water
lab, n = ndimage.label(blob)
sz = ndimage.sum(blob, lab, range(1, n + 1)); com = ndimage.center_of_mass(blob, lab, range(1, n + 1))
w, s, e, nn = meta['plate']
ships = [[round(w + cx * meta['dlon'], 5), round(nn - cy * meta['dlat'], 5), int(k)] for k, (cy, cx) in zip(sz, com) if 2 <= k <= 60]
json.dump({'date': '2025-01-24/25', 'ships': ships}, open(os.path.join(D, 'assets/ships.json'), 'w'))
print(len(ships), 'ships')

# Sentinel-2 detail around the tanker
z = np.load(os.path.join(RAW, 's2/det.npz')); a = z['arr'].astype(np.float32); bb = z['bbox'].tolist()
refl = np.clip((a[:3] - 1000) / 10000, 0, 1).transpose(1, 2, 0)
H, W = refl.shape[:2]
lon = bb[0] + (np.arange(W) + .5) * (bb[2] - bb[0]) / W; lat = bb[3] - (np.arange(H) + .5) * (bb[3] - bb[1]) / H
LO, LA = np.meshgrid(lon, lat)
nirs = (a[3] - 1000) / 10000
landd = nirs > 0.12
seaa = nirs < 0.02
rf = ref_from(narrows, nb)
st = 3
# affine per channel (display space) fitted on land and sea samples together: the frame is mostly sea
R = rf(LO[::st, ::st], LA[::st, ::st]); X = np.clip(refl[::st, ::st], 0, 1) ** (1 / 2.2)
ok = seaa[::st, ::st]
out = np.empty_like(refl)
for c in range(3):
    A = np.stack([X[..., c][ok], np.ones(ok.sum())], 1); k, o = np.linalg.lstsq(A, R[..., c][ok], rcond=None)[0]
    print('det fit', c, round(float(k), 3), round(float(o), 3))
    out[..., c] = np.clip((np.clip(refl[..., c], 0, 1) ** (1 / 2.2)) * k + o, 0, 1)
# land (the Quoin islands) keeps a plain gain on linear reflectance, blended in by a soft NIR land mask
gl = fit(refl[::st, ::st], None, None, landd[::st, ::st], R)
lm = ndimage.gaussian_filter(np.clip((nirs - 0.04) / 0.08, 0, 1), 1.2)[..., None]
out = out * (1 - lm) + np.clip(refl * gl, 0, 1) ** (1 / 2.2) * lm
print('det land gain', gl.round(2))
Image.fromarray((out * 255 + .5).astype(np.uint8)).save(os.path.join(PL, 'det.jpg'), quality=94)
info['det'] = {'bbox': bb, 'W': W, 'H': H, 'item': str(z['item']), 'src': 'Copernicus Sentinel-2 L2A (Planetary Computer)'}
json.dump(info, open(os.path.join(PL, 'plates.json'), 'w'), indent=1)
