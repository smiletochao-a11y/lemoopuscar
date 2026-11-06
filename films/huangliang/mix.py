"""Voice + score + foley for 《一锅饭的一生》 -> out/mix.wav (48 kHz stereo) + out/stems/.
Foley is synthesised: the pot lid rattling, a crackling stove, firecrackers at the wedding, footsteps, a sword drawn,
a teardrop, cassette clicks, the blue-screen hum, tape static, the lid lifted. Music ducked ~9 dB under the voice.
usage: python mix.py   (after music/score.py)"""
import os, sys, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, LIB)
from core.audio.sfx import SR, lp, hp, bp, noise, t_, compress
from scipy.signal import resample_poly, lfilter
from scipy.ndimage import minimum_filter1d

TL = json.load(open(os.path.join(HERE, 'timeline.json')))
DUR, HIT, LINES = TL['DUR'], TL['HIT'], TL['LINES']
N = int(DUR * SR)
rng = np.random.default_rng(9)
buf = lambda: np.zeros((N, 2), np.float32)
music, foley, voice = buf(), buf(), buf()
def st(x, pan=0.):
    x = np.asarray(x, np.float32)
    return x if x.ndim == 2 else np.stack([x * np.sqrt((1 - pan) / 2), x * np.sqrt((1 + pan) / 2)], 1)
def place(b, x, at, g=1., pan=0.):
    x = st(x, pan); i = int(at * SR)
    if i < 0: x = x[-i:]; i = 0
    if i >= N: return
    n = min(len(x), N - i); b[i:i + n] += x[:n] * g
def env(n, a, r): e = np.ones(n); na, nr = min(n, int(a * SR)), min(n, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[len(e) - nr:] *= np.linspace(1, 0, nr); return e

# ------------------------------------------------------------------ foley
def clank(v=1., f=420):
    d = .35; t = t_(d); x = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t / (.06 / k)) for k in (1, 2.7, 4.1)) * .4 + bp(noise(d), 1500, 5000) * np.exp(-t / .01)
    return (x * v).astype(np.float32)
def rattle(d, v=1.):
    out = np.zeros(int(d * SR) + SR, np.float32); t = 0
    while t < d: place_ = int(t * SR); c = clank(.25 + .2 * rng.random(), 380 + rng.random() * 120); out[place_:place_ + len(c)] += c; t += .06 + rng.random() * .08
    return out
def crackle(d, v=1.):
    n = int(d * SR); x = lp(noise(d), 600) * .15
    for _ in range(int(d * 18)): i = rng.integers(0, n - 600); x[i:i + 300] += bp(noise(300 / SR), 1500, 6000) * np.exp(-np.arange(300) / 60) * (.3 + rng.random())
    return (x * env(n, .3, .3) * v).astype(np.float32)
def pop(v=1.): d = .12; t = t_(d); return ((bp(noise(d), 800, 5000) * np.exp(-t / .012) + np.sin(2 * np.pi * 90 * t) * np.exp(-t / .03)) * v).astype(np.float32)
def step(v=1.): d = .12; t = t_(d); return (lp(noise(d), 900) * np.exp(-t / .02) * v).astype(np.float32)
def draw_sword(v=1.):
    d = .9; t = t_(d); scrape = bp(noise(d), 2500, 7000) * env(len(t), .02, .5) * (t < .4)
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / .5) for f in (2300, 3550, 5100)) * .25 * (t > .3)
    return ((scrape * .6 + ring) * v).astype(np.float32)
def drop(v=1.): d = .3; t = t_(d); return (np.sin(2 * np.pi * (1600 - 1200 * t / d) * t) * np.exp(-t / .05) * v).astype(np.float32)
def click(v=1.): d = .08; t = t_(d); return ((bp(noise(d), 1200, 6000) * np.exp(-t / .006) + np.sin(2 * np.pi * 160 * t) * np.exp(-t / .02)) * v).astype(np.float32)
def hum(d, v=1.): t = t_(d); return ((np.sin(2 * np.pi * 60 * t) + .4 * np.sin(2 * np.pi * 120 * t)) * env(len(t), .05, .05) * v * .3).astype(np.float32)
def static(d, v=1.): x = bp(noise(d), 300, 6000); return (x * env(len(x), .02, .1) * v * .5).astype(np.float32)
def whoosh(d=.5, v=1.): n = noise(d); return (bp(n, 400, 3000) * env(len(n), d * .6, d * .3) * v * .6).astype(np.float32)

place(foley, rattle(5.4, 1), .05, .8)                     # the lid dances on the boiling pot
place(foley, crackle(5.5, 1), 0, .6)
for f in HIT['flashes']: place(foley, whoosh(.25, 1), f - .05, .7)
place(foley, crackle(10, .6), 5.6, .5)                    # the inn: the stove
place(foley, whoosh(1.2, 1), 15.8, .8); place(foley, whoosh(1.4, 1.2), 17.4, .9)
for k in range(18): place(foley, pop(.5 + .5 * rng.random()), 19.1 + k * .11 + rng.random() * .05, .6, rng.uniform(-.7, .7))   # wedding firecrackers
for t in (23.7, 24.8, 26.0): place(foley, whoosh(.3, .8), t - .05, .6)
for k in range(14): place(foley, step(.8), 31.5 + k * .27, .7, .2 * (-1) ** k)          # running back
place(foley, draw_sword(1), HIT['draw'] - .1, 1.0)
place(foley, drop(.8), 41.6, .8)
place(foley, click(1), HIT['freeze'], .9)                 # the tape stops
place(foley, hum(1.0, 1), HIT['blue'], .5)
place(foley, static(1.0, 1), HIT['static'], .7)
place(foley, click(1), HIT['rew'], 1.0); place(foley, click(1), 59.95, 1.0)
place(foley, crackle(13, .6), 60.0, .5)
place(foley, clank(1, 330), HIT['lid'], .9); place(foley, whoosh(.6, .8), HIT['lid'], .5)
for k in range(8): place(foley, step(.6), HIT['walk'] + k * .45, .5)

# ------------------------------------------------------------------ score
x, sr = sf.read(os.path.join(HERE, 'music/score.wav'), dtype='float32')
if sr != SR: x = resample_poly(x, SR, sr, axis=0).astype(np.float32)
music[:min(N, len(x))] = x[:N]

# ------------------------------------------------------------------ voice (a little room)
vm = np.zeros(N, np.float32)
for l in LINES:
    v, sr = sf.read(os.path.join(HERE, 'voice', l['id'] + '.wav'), dtype='float32')
    if v.ndim > 1: v = v.mean(1)
    if sr != SR: v = resample_poly(v, SR, sr).astype(np.float32)
    v = hp(v, 70); v = compress(v / max(1e-6, np.abs(v).max()) * .8, thr=.2, ratio=3.)
    place(voice, v, l['t'], 1.)
    a = int((l['t'] - .15) * SR); vm[max(0, a):min(N, a + len(v) + int(.35 * SR))] = 1
vm = np.convolve(vm, np.ones(int(.2 * SR)) / int(.2 * SR), 'same')[:, None]

# ------------------------------------------------------------------ levels: voice RMS -17 dB; music -24 dB ducked 9 dB; foley -27 ducked 3 dB
rms = lambda x: float(np.sqrt(np.mean(x ** 2) + 1e-12))
db = lambda d: 10 ** (d / 20)
active = lambda x: x[np.abs(x).max(1) > 1e-4]
voice *= db(-17) / rms(voice[vm[:, 0] > .5])
music *= db(-24) / rms(active(music)); music *= 1 - (1 - db(-9)) * vm
foley *= db(-27) / rms(active(foley)); foley *= 1 - (1 - db(-3)) * vm
mix = (music + foley + voice).astype(np.float64)
os.makedirs(os.path.join(HERE, 'out/stems'), exist_ok=True)
for n, s in (('music', music), ('foley', foley), ('voice', voice)): sf.write(os.path.join(HERE, f'out/stems/{n}.wav'), s, SR, subtype='FLOAT')

# ------------------------------------------------------------------ master: BS.1770 to -14 LUFS, true-peak limit -3.5 dBTP
def kw(x):
    x = lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, .73248077421585], x, axis=0)
    return lfilter([1.0, -2.0, 1.0], [1.0, -1.99004745483398, .99007225036621], x, axis=0)
def lufs(x):
    y = kw(x); b, h = int(.4 * SR), int(.1 * SR)
    ms = np.array([np.mean(y[i:i + b] ** 2, 0).sum() for i in range(0, len(y) - b, h)]); l = -.691 + 10 * np.log10(ms + 1e-12)
    g = ms[l > -70]; rel = -.691 + 10 * np.log10(g.mean()) - 10
    return -.691 + 10 * np.log10(ms[(l > -70) & (l > rel)].mean())
def limiter(x, ceil, look=.004, rel=.08):
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(1).reshape(-1, 4).max(1)[:len(x)]
    g = minimum_filter1d(np.minimum(1, ceil / np.maximum(up, 1e-9)), 2 * int(look * SR) + 1)
    a = np.exp(-1 / (rel * SR)); out = np.empty_like(g); c = 1.
    for i in range(len(g)): c = g[i] if g[i] < c else a * c + (1 - a) * g[i]; out[i] = c
    return x * out[:, None]
for _ in range(3): mix *= 10 ** ((-14 - lufs(mix)) / 20); mix = limiter(mix, db(-3.5))
print(f'loudness {lufs(mix):.2f} LUFS, peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS')
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('wrote out/mix.wav')
