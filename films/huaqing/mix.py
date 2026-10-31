"""Score, foley and voice for 《华清池 · 她还剩两百多天》 (Chinese ink wash) -> out/mix.wav (48 kHz stereo) + out/stems/.
Palette (STYLE.md §7): guqin (core/audio/pluck.py: open and stopped strings, slides, vibrato, harmonics), a low breathy xiao
(flute samples, low-passed, breath noise), pipa strums and a wooden clapper for the feast, frame drum (hooves), big drum and
timpani for the turn, a small gong for the seals. D gong pentatonic (D E F# A B); the aftermath in B yu.
Two literal silences (31–33.5 before the turn; 53.3–55.2 before 0), one sound inside each (a drip; one harmonic).
Foley follows the material: hot-spring water, brush air, paper, seals, hooves, rain, a phone shutter.
usage: python mix.py"""
import os, sys, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, lp, hp, bp, noise, t_, compress
from scipy.signal import resample_poly, lfilter
from scipy.ndimage import minimum_filter1d

S.seed(11); np.random.seed(11)
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
DUR, SH, HIT, LINES = TL['DUR'], TL['SH'], TL['HIT'], TL['LINES']
L = {l['id']: l['t'] for l in LINES}
VD = json.load(open(os.path.join(HERE, 'voice/dur.json')))
N = int(DUR * SR) + SR
rng = np.random.default_rng(7)
buf = lambda: np.zeros((N, 2), np.float32)
music, foley, amb, voice = buf(), buf(), buf(), buf()
def st(x, pan=0.):
    x = np.asarray(x, np.float32)
    return x if x.ndim == 2 else np.stack([x * np.sqrt((1 - pan) / 2), x * np.sqrt((1 + pan) / 2)], 1)
def place(b, x, at, g=1., pan=0.):
    x = st(x, pan); i = int(at * SR)
    if i < 0: x = x[-i:]; i = 0
    if i >= N: return
    n = min(len(x), N - i); b[i:i + n] += x[:n] * g
def env(n, a, r): e = np.ones(n); na, nr = min(n, int(a * SR)), min(n, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[len(e) - nr:] *= np.linspace(1, 0, nr); return e

# ------------------------------------------------------------------ instruments
def G(t, p, d=3., v=.7, pan=0., g=1., **k): place(music, P.pluck('guqin', p, d, v, **k), t, g, pan)
def Hm(t, p, v=.55, pan=0., g=1., d=2.): G(t, p, d, v, pan, g, harmonic=True)
def pipa(t, p, d=1.2, v=.6, pan=.3, g=1.): place(music, P.pluck('pipa', p, d, v), t, g, pan)
def xiao(t, p, d, v=.55, pan=-.15, g=1., att=.5):
    x = S.note('flute', p, d, v, release=.6, attack=att).astype(np.float64)
    x = lp(x, 2600); e = np.convolve(np.abs(x), np.ones(960) / 960, 'same')
    place(music, (x + bp(rng.standard_normal(len(x)), 800, 3000) * e * 1.6).astype(np.float32), t, g, pan)
def drum(t, inst, var, v=.8, g=1., pan=0., b=None): place(b if b is not None else music, S.hit(inst, var, v), t, g, pan)

# ------------------------------------------------------------------ foley (procedural)
def water(d, v=1.):            # hot spring: low bubbling, no hiss
    n = lp(noise(d), 700) * .6; out = n.copy()
    for k in range(int(d * 6)):
        i = int(rng.random() * (d - .1) * SR); f = 300 + rng.random() * 500; tt = t_(.06)
        out[i:i + len(tt)] += np.sin(2 * np.pi * f * (1 + 2 * tt) * tt) * np.exp(-tt / .015) * .5
    return (out * env(len(out), .8, .8) * v).astype(np.float32)
def wind(d, v=1.): n = lp(noise(d), 500) * (.6 + .4 * np.abs(lp(noise(d), 1.2)) * 6); return (n * env(len(n), 1, 1) * v).astype(np.float32)
def drip(v=1.): tt = t_(.25); return ((np.sin(2 * np.pi * (1400 - 900 * tt / .25) * tt) * np.exp(-tt / .035) + .3 * lp(noise(.25), 400) * np.exp(-tt / .02)) * v).astype(np.float32)
def brush(d=.5, v=1.): n = noise(d); return (bp(n, 600, 3500) * env(len(n), .05, .2) * (.6 + .4 * np.abs(lp(noise(d), 30)) * 4) * v * .5).astype(np.float32)
def seal(v=1.): d = .4; tt = t_(d); return ((np.sin(2 * np.pi * 120 * tt) * np.exp(-tt / .05) + .5 * lp(noise(d), 1200) * np.exp(-tt / .02) + .15 * bp(noise(d), 2000, 6000) * np.exp(-tt / .08)) * v).astype(np.float32)
def splash(v=1.): d = .8; tt = t_(d); return (lp(noise(d), 1800) * np.exp(-tt / .18) * v).astype(np.float32)
def rain(d, v=1.): n = bp(noise(d), 900, 4500) * .5 + lp(noise(d), 300) * .3; return (n * env(len(n), .6, .6) * v).astype(np.float32)
def shutter(v=1.): d = .12; tt = t_(d); a = bp(noise(d), 1500, 6000) * np.exp(-tt / .006); b = np.roll(a, int(.055 * SR)) * .7; return ((a + b) * v).astype(np.float32)
def murmur(d, v=1.): n = bp(noise(d), 250, 1200) * (.5 + .5 * np.abs(lp(noise(d), 4)) * 5); return (n * env(len(n), 1, 1) * v).astype(np.float32)
def gallop(t0, t1, v0, v1, rate=2.4, b=None):
    t = t0
    while t < t1:
        k = (t - t0) / max(.01, t1 - t0); v = v0 + (v1 - v0) * k
        for j, dt in enumerate((0, .08, .17)): drum(t + dt, 'frame_drum', 'large_muted', min(1, v * (.8 + .2 * j)), g=1, pan=-.1, b=b)
        t += 1 / rate

# ================================================================== the score
# A · 0–5.4: the pool; open-string D, harmonics on the hand and the stamp
G(.15, 'D2', 5, .55)
Hm(HIT['hand'] + .05, 'A4', .5, .2); Hm(2.2, 'D5', .45, -.2); Hm(HIT['stamp'], 'F#5', .5, .1)
drum(HIT['stamp'], 'gong2', 'small', .35, g=.5)
# B · 5.4–11: the hanging scroll; xiao long tones over a slow guqin line
xiao(5.6, 'A4', 2.6, .5); xiao(8.0, 'D5', 2.8, .5)
for t, p in ((5.8, 'D3'), (7.1, 'A3'), (8.4, 'B3'), (9.6, 'A3')): G(t, p, 3, .55, -.1)
# C · 11–18: the bath; the guqin theme in free time (D E F# A | B A F# E D), slides and vibrato
th = [(11.2, 'D4', 1.2), (12.0, 'E4', 1), (12.7, 'F#4', 1.2), (13.5, 'A4', 1.8), (14.9, 'B4', 1.2), (15.6, 'A4', 1), (16.3, 'F#4', 1.2), (17.0, 'E4', 1)]
for t, p, d in th: G(t, p, 2.6, .62, .05, vib=(4.5, .15, 1.0) if d > 1.5 else None)
G(11.2, 'D2', 6, .45); Hm(HIT['pin'], 'D6', .5, .3)
# D · 18–31: the feast at 72 BPM, a clapper on the beat, pipa strums; then the hooves arrive under it
beat = 60 / 72
mel = ['A4', 'B4', 'D5', 'B4', 'A4', 'F#4', 'E4', 'F#4', 'A4', 'B4', 'A4', 'F#4', 'E4', 'D4', 'E4', 'F#4']
for k in range(int((SH['s6'] - 17.9) / beat)):
    t = 17.9 + k * beat
    drum(t, 'woodblock', 'a' if k % 2 else 'b', .45 if k % 4 else .6, g=.7, pan=.25)
    if k % 2 == 0: pipa(t, ['D3', 'A3', 'B3', 'A3'][(k // 2) % 4], 1.2, .55)
    G(t, mel[k % len(mel)], 1.6, .55, -.05)
    if k % 4 == 0: drum(t, 'frame_drum', 'small', .4, g=.5, pan=-.2)
gallop(HIT['rider'] + .4, SH['s6'] - .05, .25, .95, rate=2.2)
# E · 33.5–43: the turn
place(foley, brush(.35, 1.6), HIT['stroke'] - .05, 1.)
drum(HIT['stroke'] + .1, 'gran_cassa', 'hit', 1.0); drum(HIT['stroke'] + .1, 'timpani', 'drum1', .9)
gallop(HIT['hoof'], SH['s8'] - .2, 1., 1., rate=2.6)
drum(36.0, 'gran_cassa', 'cresc', .8)
for k in range(4): place(foley, brush(.3, 1.2), HIT['fan'] + k * .3, 1.)
drum(HIT['fan'] + 1.25, 'gran_cassa', 'hit', 1.0); drum(HIT['fan'] + 1.25, 'timpani', 'drum2', 1.0)
G(HIT['look'], 'A2', 3.5, .7, bend=[(0, 0), (.4, 0), (1.4, -2)])
Hm(HIT['fall'] + .1, 'B5', .45, .2)
# F · 43–53: aftermath, xiao alone (B yu: B D E F# A); the road west with quickening plucks
xiao(43.6, 'B4', 2.2, .5); xiao(45.9, 'A4', 1.4, .45); xiao(47.2, 'F#4', 1.4, .45)
for k in range(14):
    t = 48.3 + 4.6 * (1 - (1 - k / 14) ** 1.6); G(t, ['B3', 'A3', 'F#3', 'E3', 'D3'][k % 5], 1.2, .45 + .02 * k, .1)
# G · 55.2: one harmonic in the silence
Hm(HIT['zero'], 'E5', .55, 0, g=1.2)
# H · 57–70: the theme returns, twice as slow; ends unresolved on E (the second degree) over A
for i, (t, p, d) in enumerate(th[:6]): G(57.4 + (t - 11.2) * 1.9, p, 3.2, .55, .05)
G(57.4, 'D2', 7, .4); xiao(62.5, 'A4', 3, .4)
Hm(HIT['wide'], 'A4', .4, -.2); Hm(HIT['wide'] + 1.2, 'E5', .45, .2)
drum(HIT['seal'], 'gong2', 'small', .45, g=.6)
G(HIT['seal'] + .1, 'A2', 3, .45)

# ================================================================== foley and ambience
place(amb, water(SH['s2'] + 1), 0, 1.)
place(foley, splash(.5), HIT['hand'] + .05, 1.); place(foley, seal(1), HIT['stamp'], 1.)
place(amb, wind(SH['s3'] - SH['s2'] + 1, .7), SH['s2'], 1.)
place(amb, water(SH['s4'] - SH['s3'] + 1, .8), SH['s3'], 1.)
for k in range(14): place(foley, brush(.25, .45), 11.6 + k * .32, 1., (k % 2 - .5) * .4)
place(amb, murmur(SH['s6'] - SH['s4'], .5), SH['s4'], 1.)
place(amb, wind(SH['s6'] - SH['s5'], .5), SH['s5'], 1.)
place(foley, drip(1), HIT['drip'], 1.)
place(amb, wind(SH['s9'] - HIT['hoof'], .9), HIT['hoof'], 1.)
place(foley, brush(.5, .8), HIT['scroll'], 1.); place(foley, seal(1.1), HIT['stamp206'], 1.)
place(amb, water(SH['s10'] - SH['s9'], .5), SH['s9'], 1.)
place(amb, rain(SH['s11'] - SH['s10'] + .2, .8), SH['s10'], 1.)
for k in range(7): place(foley, brush(.35, .5), HIT['poem'] + k * 1.0, 1.)
place(amb, murmur(DUR - HIT['today'], .35), HIT['today'], 1.)
place(foley, shutter(1.2), HIT['shutter'], 1.)
place(foley, seal(.9), HIT['seal'], 1.)

# the two silences: zero every bus except the one sound inside each, with short fades
def silence(a, b, keep=()):
    m = np.ones(N); ia, ib = int(a * SR), int(b * SR); f = int(.12 * SR)
    m[ia:ib] = 0; m[ia - f:ia] = np.linspace(1, 0, f); m[ib:ib + f] = np.linspace(0, 1, f)
    for bb in (music, amb): bb *= m[:, None].astype(np.float32)
    fm = m.copy()
    for k in keep: fm[int((k - .02) * SR):int((k + .6) * SR)] = 1
    foley[:] *= fm[:, None].astype(np.float32)
silence(SH['s6'], HIT['stroke'] - .06, keep=[HIT['drip']])
silence(53.3, HIT['zero'] - .02)
music[int(HIT['zero'] * SR) - 10:] += 0  # (the harmonic at 'zero' starts right after the silence)

tail = np.clip((DUR - np.arange(N) / SR) / 2.0, 0, 1)[:, None]
for b in (music, foley, amb): b *= tail
music = S.room(music, size=.6, mix=.22).astype(np.float32)[:N]

# ------------------------------------------------------------------ voice
vm = np.zeros(N, np.float32)
for l in LINES:
    x, sr = sf.read(os.path.join(HERE, 'voice', l['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = resample_poly(x, SR, sr).astype(np.float32)
    x = hp(x, 70); x = compress(x / max(1e-6, np.abs(x).max()) * .8, thr=.2, ratio=3.)
    place(voice, x, l['t'], 1.)
    a = int((l['t'] - .15) * SR); vm[max(0, a):min(N, a + len(x) + int(.4 * SR))] = 1
vm = np.convolve(vm, np.ones(int(.25 * SR)) / int(.25 * SR), 'same')[:, None]

# ------------------------------------------------------------------ mix: voice RMS -18 dB, music ~ -26 dB ducked 8 dB, ambience ducked too
rms = lambda x: float(np.sqrt(np.mean(x ** 2) + 1e-12))
db = lambda d: 10 ** (d / 20)
active = lambda x: x[np.abs(x).max(1) > 1e-4] if (np.abs(x).max(1) > 1e-4).any() else x
voice *= db(-18) / rms(voice[vm[:, 0] > .5])
music *= db(-26) / rms(active(music)); music *= 1 - (1 - db(-8)) * vm
foley *= db(-28) / rms(active(foley))
amb *= db(-40) / rms(active(amb)); amb *= 1 - (1 - db(-6)) * vm
mix = (music + foley + amb + voice)[:int(DUR * SR)].astype(np.float64)
os.makedirs(os.path.join(HERE, 'out/stems'), exist_ok=True)
for n, x in (('music', music), ('foley', foley), ('amb', amb), ('voice', voice)): sf.write(os.path.join(HERE, f'out/stems/{n}.wav'), x[:int(DUR * SR)], SR, subtype='FLOAT')

# ------------------------------------------------------------------ master: BS.1770 loudness to -14 LUFS, true-peak limit at -3.5 dBTP (AAC adds a little)
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
json.dump(S.credits(['flute', 'woodblock', 'frame_drum', 'gran_cassa', 'timpani', 'gong2']), open(os.path.join(HERE, 'out/instrument_credits.json'), 'w'), ensure_ascii=False, indent=1)
print('wrote out/mix.wav')
