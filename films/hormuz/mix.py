"""Score, foley, beds and voice for 《窄门》 from timeline.json + events.json -> out/mix.wav (48 kHz stereo)
and out/stems/. Palette (STYLE.md §7): dry telemetry (FM pings, ticks, noise scans, servo, ratchet), weight
(timpani, bass drum, gran cassa, low brass), a pulse bass with 2nd/3rd harmonics, detuned-saw pads under a
low-pass; one wet timbre (glass harp, bowed vibraphone) marks the turn at the lanes and returns at orbit.
usage: python mix.py   (from anywhere; LIB is the library root)"""
import os, sys, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, lp, hp, bp, noise, t_, env_exp, compress, whoosh, click, pop
from scipy.signal import sosfilt, butter, resample_poly

S.seed(7)
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
BEAT, BAR, DUR, SEC, HIT = TL['BEAT'], TL['BAR'], TL['DUR'], TL['SEC'], TL['HIT']
N = int(DUR * SR) + SR
rng = np.random.default_rng(11)
def buf(): return np.zeros((N, 2), np.float32)
music, pulse, foley, beds, voice, hits = buf(), buf(), buf(), buf(), buf(), buf()   # hits: the designed impacts, outside the bus normalisation
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def env(d, a=.01, r=.1):
    n = int(round(d * SR)); e = np.ones(n); na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def seg_gain(t0, t1, fi=.3, fo=.3):            # 0..1 envelope over the whole film
    t = np.arange(N) / SR
    return np.clip(np.minimum((t - t0) / max(fi, 1e-3), (t1 - t) / max(fo, 1e-3)), 0, 1)

# ------------------------------------------------------------------ synth voices
def fm_ping(f, d=1.2, v=1.0, idx=2.2):
    t = t_(d); m = np.sin(2 * np.pi * f * 1.41 * t) * idx * np.exp(-t / .12)
    return (np.sin(2 * np.pi * f * t + m) * np.exp(-t / .35) * v).astype(np.float32)
def pulse_note(f, d, v=1.0, cut=900):
    t = t_(d); x = np.sin(2 * np.pi * f * t) + .55 * np.sin(4 * np.pi * f * t) + .35 * np.sin(6 * np.pi * f * t) + .12 * np.sign(np.sin(2 * np.pi * f * t))
    return (lp(x, cut) * env(d, .006, .08) * np.exp(-t / (d * 1.6)) * v * .5).astype(np.float32)
def saw_pad(freqs, d, v=1.0, cut=1400, a=1.5, r=2.0):
    t = t_(d); x = np.zeros_like(t)
    for f in freqs:
        for det in (-.11, 0, .13):
            ph = rng.random()
            x += 2 * ((f * 2 ** (det / 12) * t + ph) % 1) - 1
    x = lp(lp(x / (len(freqs) * 3), cut), cut)
    return (x * env(d, a, r) * v).astype(np.float32)
def riser(d, v=1.0, f0=200, f1=4000):
    t = t_(d); n = noise(d); out = np.zeros_like(n); k = 8
    for i in range(k):
        a, b = int(i * len(n) / k), int((i + 1) * len(n) / k)
        fc = f0 * (f1 / f0) ** ((i + .5) / k)
        out[a:b] = bp(n, fc * .7, min(fc * 1.4, SR / 2 - 100))[a:b]
    return (out * (t / d) ** 2 * v).astype(np.float32)
def scan_noise(d, v=1.0, up=False):
    t = t_(d); n = noise(d); fc = np.linspace(600, 5000, 6) if up else np.linspace(5000, 600, 6)
    out = np.zeros_like(n)
    for i in range(6):
        a, b = int(i * len(n) / 6), int((i + 1) * len(n) / 6); out[a:b] = bp(n, fc[i] * .6, fc[i] * 1.5)[a:b]
    return (out * np.sin(np.pi * t / d) * v).astype(np.float32)
def servo(d, v=1.0, f0=420, f1=640):
    t = t_(d); f = np.linspace(f0, f1, len(t)); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + .3 * np.sin(2 * ph) + .2 * np.sin(3.01 * ph)
    return (x * env(d, .08, .2) * v * .25).astype(np.float32)
def tick(v=1.0, f=3200):
    d = .03; t = t_(d); return (bp(noise(d), f * .7, f * 1.3) * np.exp(-t / .004) * v).astype(np.float32)
def ratchet(v=1.0): return (click(1.6, v) * .6).astype(np.float32)
def tock(v=1.0):
    d = .25; t = t_(d); return ((np.sin(2 * np.pi * 820 * t) * np.exp(-t / .03) + .5 * bp(noise(d), 600, 1400) * np.exp(-t / .01)) * v).astype(np.float32)
def horn(d=3.2, v=1.0):                         # a distant ship horn: two detuned saws, filtered, slow swell
    t = t_(d); x = sum(2 * ((f * t) % 1) - 1 for f in (98.0, 98.7, 147.2))
    return (lp(lp(x, 600), 600) * env(d, .5, 1.2) * v * .2).astype(np.float32)
def reverse(x): return x[::-1].copy()
def room(x, size=.45, mix=.2): return S.room(x, size=size, mix=mix)
def st(x, pan=0.0):
    x = np.asarray(x, np.float32)
    if x.ndim == 2: return x
    return np.stack([x * np.sqrt((1 - pan) / 2), x * np.sqrt((1 + pan) / 2)], 1)
def place(b, x, at, g=1.0, pan=0.0):
    x = st(x, pan); i = int(at * SR)
    if i >= N: return
    n = min(len(x), N - i); b[i:i + n] += x[:n] * g
def sm(inst, pitch, dur, vel, **kw): return S.note(inst, pitch, dur, vel=vel, **kw)

D2, A2, D3, F3, A3, D4, E4, F4, A4, D5 = 38, 45, 50, 53, 57, 62, 64, 65, 69, 74

# ------------------------------------------------------------------ beds (the whole film)
hum = lp(noise(DUR + 1), 140) * .5 + np.sin(2 * np.pi * 55 * t_(DUR + 1)) * .12 + np.sin(2 * np.pi * 82.4 * t_(DUR + 1)) * .05
hiss = hp(noise(DUR + 1), 3500) * .08 * (1 + .3 * np.sin(2 * np.pi * .13 * t_(DUR + 1)))
bed = (hum + hiss)[:N - SR]
place(beds, bed, 0, .9, 0)
# data chatter: sparse soft ticks in the analysis sections
for t0, t1 in ((SEC['measure'][0], SEC['measure'][1]), (SEC['weight'][0], SEC['bypass'][1])):
    t = t0
    while t < t1:
        place(beds, tick(.25, 2400 + 3000 * rng.random()), t, 1, rng.uniform(-.6, .6)); t += rng.uniform(.08, .5)
# sea and wind, sparingly: J-cut of water under the climb, desert wind under the bypass
sea = lp(hp(noise(14), 150), 900) * (.6 + .4 * np.sin(2 * np.pi * .2 * t_(14))) * .5
place(beds, sea * np.concatenate([np.linspace(0, 1, SR * 3), np.ones(len(sea) - SR * 6), np.linspace(1, 0, SR * 3)]), HIT['climb'] - 1.2, .6)
wind = bp(noise(18), 200, 1400) * (.5 + .5 * np.sin(2 * np.pi * .09 * t_(18))) * .35
place(beds, wind * np.concatenate([np.linspace(0, 1, SR * 3), np.ones(len(wind) - SR * 6), np.linspace(1, 0, SR * 3)]), SEC['bypass'][0], .5)

# ------------------------------------------------------------------ A: lock (0-8)
place(foley, scan_noise(1.4, .5), HIT['scanIn'] - .1, .3)
place(music, fm_ping(hz(D5 + 12), 1.6, .55), HIT['lock'], 1, .1)
place(music, room(st(fm_ping(hz(D5 + 12), 1.6, .3)), .6, 1.0), HIT['lock'] + .02, .35)
place(foley, tick(.6, 4200), HIT['lock'] + .25, 1)
place(foley, pop(.35), HIT['shipLabel'], 1, .3)
for k in range(10): place(foley, tick(.18, 3600), HIT['shipLabel'] + k * .1, 1, .3)   # the counter rolling

# ------------------------------------------------------------------ B: climb (8-21.3): ticks divide, pulse bass enters, riser
t = SEC['climb'][0]
while t < SEC['climb'][1] - 1e-6:
    sub = 1 if t < 13.33 else 2 if t < 17.33 else 4
    place(music, tick(.45 if (round((t - SEC['climb'][0]) / BEAT * sub) % sub == 0) else .25, 5200), t, 1, .2)
    t += BEAT / sub
place(foley, riser(HIT['name'] - HIT['climb'] + .3, .5), HIT['climb'], .45)
t = 10.67
while t < SEC['measure'][1] - BEAT:
    if not (SEC['hush1'][0] - .1 < t < SEC['lanes'][0]):
        place(pulse, pulse_note(hz(D2 + 12 * (int((t - 10.67) / (BEAT / 2)) % 4 == 3)), BEAT / 2 * .9, .9, 700 + 500 * min(1, (t - 10.67) / 10)), t, 1)
    t += BEAT / 2
place(music, sm('timpani', 'D3', 2.5, .7), HIT['name'], .8)
place(music, S.hit('bass_drum', None, .45), HIT['name'], .6)
place(music, saw_pad([hz(D3), hz(A3), hz(F4)], SEC['measure'][1] - HIT['name'], .35, 900, 1.5, .4), HIT['name'], .9)
for k in range(int((HIT['alt'] - HIT['climb']) / .25)): place(foley, tick(.12, 2800), HIT['climb'] + k * .25, 1, -.4)   # the altitude counter

# ------------------------------------------------------------------ C: measure (21.3-34.7): ratchet with the range line, the landing
place(music, fm_ping(hz(A4 + 12), 1.0, .4), HIT['rangeStart'], 1, -.2)
r0, r1, km = HIT['rangeStart'] + .3, HIT['rangeLand'], 38.6
for k in range(1, 39):
    u = k / km   # eio(t) inverted roughly: ticks follow the eased tip
    lo, hi = 0.0, 1.0
    for _ in range(30):
        m = (lo + hi) / 2; e = 4 * m ** 3 if m < .5 else 1 - (-2 * m + 2) ** 3 / 2
        lo, hi = (m, hi) if e < u else (lo, m)
    place(foley, ratchet(.55 if k % 5 == 0 else .3), r0 + (r1 - r0) * lo, 1, -.3 + .6 * u)
land = HIT['rangeLand']
place(hits, sm('timpani', 'D3', 3, .9), land, 1.0)
place(hits, S.hit('bass_drum', None, .7), land, .8)
place(foley, tock(.6), land, 1, .3)
place(music, fm_ping(hz(D5), 1.4, .5), land + .02, 1, .3)
place(hits, sm('tuba', 'D2', 3.2, .55), land, .6)
place(hits, sm('trombone', 'A2', 3.2, .5), land, .45)
# suck-out into hush 1
music[int(SEC['hush1'][0] * SR):int(SEC['lanes'][0] * SR)] *= np.linspace(1, 0, int((SEC['lanes'][0] - SEC['hush1'][0]) * SR) // 4 + 1).repeat(4)[:int(SEC['lanes'][0] * SR) - int(SEC['hush1'][0] * SR), None]

# ------------------------------------------------------------------ D: lanes (36-48): the wet timbre appears; impact #1
place(foley, scan_noise(1.2, .35), HIT['lane1'] - .1, 1, -.2)
place(foley, scan_noise(1.2, .35), HIT['lane2'] - .1, 1, .2)
place(music, sm('vibraphone_bowed', 'D4', 5.5, .5, attack=.4), HIT['lane1'], .7, -.3)
place(music, S.hit('sus_cymbal', 'bow', .6), HIT['lane2'] - .2, .7, .3)
place(music, sm('vibraphone_bowed', 'A4', 4.5, .5, attack=.4), HIT['lane2'], .6, .3)
place(music, saw_pad([hz(D3), hz(A3), hz(E4), hz(F4)], SEC['lanes'][1] - SEC['lanes'][0] + 1, .45, 1100, 2.0, 1.2), SEC['lanes'][0], .9)
hit1 = HIT['laneRead']
music[int((hit1 - .3) * SR):int(hit1 * SR)] *= .06; pulse[int((hit1 - .3) * SR):int(hit1 * SR)] *= .06
for inst, p, v, g in (('trombone_stac', 'D2', 1.0, .9), ('tuba_stac', 'D2', 1.0, .9), ('horn_stac', 'A3', .9, .6), ('trombone_stac', 'A2', .95, .7)):
    place(hits, sm(inst, p, 1.2, v), hit1, g)
place(hits, S.hit('bass_drum', None, 1.0), hit1, 1.0)
place(hits, sm('timpani', 'D3', 3, 1.0), hit1, .9)
place(hits, S.hit('gran_cassa', 'hit', .9), hit1, .7)
place(foley, horn(4.0, .9), 45.0, .16, -.5)            # far horn, L-cut into the weight section

# ------------------------------------------------------------------ E: weight (48-61.3)
for b in range(int((SEC['weight'][1] - SEC['weight'][0]) / BEAT)):
    t = SEC['weight'][0] + b * BEAT
    if t >= HIT['whip'] - .1 and t < HIT['lng']: continue
    place(pulse, pulse_note(hz(D2 if b % 8 < 6 else 41), BEAT * .9, 1.0, 1100), t, 1)
    if b % 4 in (0, 2): place(music, S.hit('bass_drum', None, .38), t, .55)
    place(pulse, pulse_note(hz(D2 + 12), BEAT * .4, .5, 1400), t + BEAT / 2, 1)
for k in range(16): place(foley, tick(.2, 3800), HIT['count'] + k * .1, 1, .3)
place(foley, pop(.45), HIT['count'] + 1.6, 1, .3)
place(music, sm('timpani', 'A2', 2, .7), HIT['share'], .8)
place(foley, pop(.45), HIT['share'], 1, .3)
place(music, saw_pad([hz(D3), hz(F3), hz(A3), hz(D4)], SEC['weight'][1] - SEC['weight'][0], .3, 800, 2, 1.5), SEC['weight'][0], .8)
place(foley, whoosh(.7, 1.0), HIT['whip'] - .05, .45)
place(music, fm_ping(hz(A4 + 12), 1.2, .45), HIT['lng'], .6, .2)

# ------------------------------------------------------------------ F: bypass (61.3-77.3): sparse, servo with the pipes
place(foley, riser(1.4, .35, 300, 2500), SEC['bypass'][0] - 1.0, .5)
place(foley, servo(2.4, .9, 380, 560), HIT['pipes'], .22, -.3)
place(foley, servo(1.4, .8, 470, 610), HIT['pipes'] + 1.4, .2, .4)
for b in range(0, int((SEC['bypass'][1] - SEC['bypass'][0]) / BEAT), 2):
    t = SEC['bypass'][0] + b * BEAT
    place(pulse, pulse_note(hz(D2), BEAT * 1.2, .7, 800), t, 1)
    if b % 8 == 0: place(music, sm('timpani', 'D3', 1.5, .4), t, .45)
place(music, saw_pad([hz(D3), hz(A3), hz(60)], SEC['bypass'][1] - SEC['bypass'][0], .3, 700, 2, 2), SEC['bypass'][0], .8)
for k in range(14): place(foley, tick(.2, 3800), HIT['spare'] + k * .1, 1, .3)
place(foley, pop(.45), HIT['spare'] + 1.4, 1, .3)
place(hits, sm('timpani', 'D3', 3, .85), HIT['eighth'], .9)
place(hits, S.hit('bass_drum', None, .6), HIT['eighth'], .6)
place(hits, sm('tuba', 'D2', 2.6, .5), HIT['eighth'], .5)

# ------------------------------------------------------------------ hush 2 (77.3-80.5): bed only; G: orbit (80.5-101.3), D major, glass
o0 = HIT['colour']
motif = [(0, 'D5'), (1.5, 'A4'), (3, 'F#5'), (4.5, 'E5'), (6, 'D5'), (9, 'A5'), (10.5, 'F#5'), (12, 'E5'), (15, 'D5')]
for k, (b, p) in enumerate(motif):
    tt = o0 + b * BEAT * 2
    place(music, room(st(sm('glass', p, 3.0, .6), .1 * (k % 3 - 1)), .7, .45), tt, .75)
for i, ch in enumerate(([D3, A3, 66, 69], [47, 54, 62, 66], [43, 50, 59, 62], [45, 52, 61, 64])):   # D - Bm - G - A
    place(music, saw_pad([hz(m) for m in ch], BAR * 2 + 1.5, .45, 1500, 1.5, 1.5), o0 + i * BAR * 2, .85)
place(music, sm('horn', 'D3', 8, .45, attack=1.0), o0 + 1, .5, -.2)
place(music, sm('horn', 'A3', 8, .4, attack=1.0), o0 + 1, .45, .2)
for b in range(0, int((SEC['orbit'][1] - o0) / BEAT), 2):
    place(pulse, pulse_note(hz(D2 if b < 16 else 43 if b < 24 else 45), BEAT * 1.6, .55, 700), o0 + b * BEAT, 1)
    if b % 4 == 0: place(music, S.hit('bass_drum', None, .25), o0 + b * BEAT, .45)
place(music, sm('vibraphone_bowed', 'F#4', 6, .45, attack=.6), o0, .55)
place(music, fm_ping(hz(D5 + 12), 1.2, .3), o0, .8)
for k in range(4): place(music, room(st(sm('glass', ['A5', 'F#5', 'D6', 'E6'][k], 2.0, .45)), .6, .5), HIT['buyers'] + k * .5, .5, -.4 + .27 * k)
place(music, fm_ping(hz(D5 + 12), 1.6, .55), HIT['relock'], 1, .1)
place(music, room(st(fm_ping(hz(D5 + 12), 1.6, .3)), .7, 1.0), HIT['relock'] + .02, .4)

# ------------------------------------------------------------------ H: title (101.3-112): reversed gong into impact #2, long tail
g = S.hit('gong', None, .8); g = g[:int(2.6 * SR)]
place(music, reverse(g * np.linspace(1, .2, len(g))), HIT['open'] - len(g) / SR, .8)
op = HIT['open']
music[int((op - .25) * SR):int(op * SR)] *= .08; pulse[int((op - .25) * SR):int(op * SR)] *= .05
for inst, p, v, gg in (('trombone', 'D2', .95, .8), ('tuba', 'D2', .95, .8), ('horn', 'A3', .85, .55), ('horn', 'F#4', .8, .45), ('trombone', 'A2', .9, .6)):
    place(hits, sm(inst, p, 3.5, v), op, gg)
place(hits, S.hit('bass_drum', None, 1.0), op, 1.0)
place(hits, S.hit('gran_cassa', 'hit', 1.0), op, .8)
place(hits, sm('timpani', 'D3', 4, 1.0), op, .9)
place(music, room(st(sm('glass', 'D5', 5, .55)), .8, .5), op + 1.4, .6)
place(music, room(st(sm('vibraphone_bowed', 'A4', 6, .4, attack=.5)), .7, .4), op + 1.0, .5)
tail = np.clip((DUR - np.arange(N) / SR) / 3.0, 0, 1)[:, None] ** 1.5
for b in (music, pulse, foley, beds, hits): b *= tail

# ------------------------------------------------------------------ voice
lines = TL['LINES']
vdir = os.path.join(HERE, 'voice')
vmask = np.zeros(N, np.float32)
for L in lines:
    x, sr = sf.read(os.path.join(vdir, L['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = resample_poly(x, SR, sr).astype(np.float32)
    x = hp(x, 80)
    x = compress(x / max(1e-6, np.abs(x).max()) * .8, thr=.22, ratio=3.0)
    place(voice, x, L['t'], 1, 0)
    i0 = int((L['t'] - .15) * SR); i1 = min(N, i0 + len(x) + int(.45 * SR)); vmask[max(0, i0):i1] = 1
vm = np.convolve(vmask, np.ones(int(.12 * SR)) / int(.12 * SR), 'same')[:, None]

# ------------------------------------------------------------------ mix
def rms(x): return float(np.sqrt(np.mean(x ** 2) + 1e-12))
def sub_shelf(x):           # high-pass ~38 Hz and a -5 dB shelf below ~62 Hz, keeps 20-60 Hz well under the band
    x = sosfilt(butter(2, 38, 'high', fs=SR, output='sos'), x, axis=0)
    low = sosfilt(butter(2, 62, 'low', fs=SR, output='sos'), x, axis=0)
    return x - low * (1 - 10 ** (-5 / 20))
vr = rms(voice[vmask > 0]) if (vmask > 0).any() else .1
music_bus = sub_shelf(music * 1.0 + pulse * .55)
music_bus *= (vr / max(rms(music_bus), 1e-6)) * 10 ** (-10 / 20)       # music ~10 dB under the voice
music_bus *= 1 - .45 * vm                                               # duck ~5 dB under the lines
foley_bus = sub_shelf(foley) * (vr / max(rms(foley), 1e-6)) * 10 ** (-9 / 20)
beds_bus = sub_shelf(beds) * (vr / max(rms(beds), 1e-6)) * 10 ** (-19 / 20)
# hushes: the bed stays, everything else near silent
for a, b in (SEC['hush1'], SEC['hush2']):
    gm = 1 - seg_gain(a, b, .25, .15)[:, None] * .97
    music_bus *= gm; foley_bus *= 1 - (1 - gm) * .8
# the impacts: their loudest 400 ms sit ~4 dB over the voice; the heaviest (title, lanes) a little more
hb = sub_shelf(hits)
def win_rms(x, t):
    i = int(t * SR); return rms(x[i:i + int(.4 * SR)])
ref = max(win_rms(hb, HIT[k]) for k in ('laneRead', 'open'))
hits_bus = hb * (vr / max(ref, 1e-6)) * 10 ** (4 / 20)
for k, gdb in (('rangeLand', -3), ('eighth', -4), ('laneRead', +1.5)):   # the lighter landings
    i = int((HIT[k] - .05) * SR); j = int((HIT[k] + 3.5) * SR); hits_bus[i:j] *= 10 ** (gdb / 20)
mix = music_bus + foley_bus + beds_bus + voice + hits_bus
os.makedirs(os.path.join(HERE, 'out/stems'), exist_ok=True)
for n, x in (('music', music_bus), ('hits', hits_bus), ('foley', foley_bus), ('beds', beds_bus), ('voice', voice)):
    sf.write(os.path.join(HERE, f'out/stems/{n}.wav'), x[:int(DUR * SR)], SR, subtype='FLOAT')

# ------------------------------------------------------------------ master: BS.1770 loudness to -14 LUFS, true-peak limit
def kweight(x):
    # pre-filter (high shelf +4 dB @ ~1.68 kHz) and RLB high-pass (~38 Hz), coefficients for 48 kHz (ITU-R BS.1770-4)
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    from scipy.signal import lfilter
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)
def lufs(x):
    y = kweight(x); blk, hop = int(.4 * SR), int(.1 * SR)
    ms = np.array([np.mean(y[i:i + blk] ** 2, 0).sum() for i in range(0, len(y) - blk, hop)])
    l = -0.691 + 10 * np.log10(ms + 1e-12)
    g1 = ms[l > -70]; rel = -0.691 + 10 * np.log10(g1.mean()) - 10
    g2 = ms[(l > -70) & (l > rel)]
    return -0.691 + 10 * np.log10(g2.mean())
def true_peak(x): return float(np.abs(resample_poly(x, 4, 1, axis=0)).max())
def limiter(x, ceil, look=.004, rel=.08):
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(1).reshape(-1, 4).max(1)[:len(x)]
    need = np.minimum(1, ceil / np.maximum(up, 1e-9))
    L = int(look * SR)
    need = np.minimum.accumulate(np.concatenate([need[L:], np.ones(L)])[::-1])[::-1] if False else need
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, 2 * L + 1)
    a = np.exp(-1 / (rel * SR)); out = np.empty_like(g); cur = 1.0
    for i in range(len(g)):            # instant attack, exponential release
        cur = g[i] if g[i] < cur else a * cur + (1 - a) * g[i]; out[i] = cur
    return x * out[:, None]
mix = mix[:int(DUR * SR)].astype(np.float64)
for _ in range(3):
    mix *= 10 ** ((-14.0 - lufs(mix)) / 20)
    mix = limiter(mix, 10 ** (-1.6 / 20))
print(f'loudness {lufs(mix):.2f} LUFS, true peak {20 * np.log10(true_peak(mix)):.2f} dBTP')
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
json.dump(S.credits(['timpani', 'bass_drum', 'gran_cassa', 'trombone', 'trombone_stac', 'tuba', 'tuba_stac', 'horn', 'horn_stac', 'vibraphone_bowed', 'sus_cymbal', 'gong', 'glass']), open(os.path.join(HERE, 'out/instrument_credits.json'), 'w'), ensure_ascii=False, indent=1)
print('wrote out/mix.wav')
