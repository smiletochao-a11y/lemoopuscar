"""Score, foley and voice for 《另一个你》 (paper-cut lightbox) -> out/mix.wav (48 kHz stereo) + out/stems/.
Palette (STYLE.md §7): music box, felt (low-passed upright) piano, harp, glockenspiel and hand chimes, flute, soft strings;
single soft strokes only (woodblock, small gong). Foley is paper and light: switch clicks with a shimmer, paper taps and
rustles, seal thuds, a curtain whoosh. No continuous hiss: the only bed is a low room tone, and it is heard alone in the
dark before the lights come back.
D major, 72 BPM, 3/4 (a bar = 2.5 s); the opening motif plays on two music boxes an eighth apart (two of you, almost in
step) and returns in step at the end, stopping on the dominant (the question is left open).
usage: python mix.py"""
import os, sys, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, lp, hp, bp, noise, t_, compress, whoosh
from scipy.signal import sosfilt, butter, resample_poly, lfilter
from scipy.ndimage import minimum_filter1d

S.seed(3)
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
DUR, HIT, LINES = TL['DUR'], TL['HIT'], TL['LINES']
L = {l['id']: l['t'] for l in LINES}
VD = json.load(open(os.path.join(HERE, 'voice/dur.json')))
WORDS = json.load(open(os.path.join(HERE, 'voice/words.json')))
N = int(DUR * SR) + SR
rng = np.random.default_rng(5)
buf = lambda: np.zeros((N, 2), np.float32)
music, foley, bed, voice = buf(), buf(), buf(), buf()
BEAT, BAR = 60 / 72, 3 * 60 / 72
def st(x, pan=0.):
    x = np.asarray(x, np.float32)
    return x if x.ndim == 2 else np.stack([x * np.sqrt((1 - pan) / 2), x * np.sqrt((1 + pan) / 2)], 1)
def place(b, x, at, g=1., pan=0.):
    x = st(x, pan); i = int(at * SR)
    if i < 0: x = x[-i:]; i = 0
    if i >= N: return
    n = min(len(x), N - i); b[i:i + n] += x[:n] * g
def note(inst, p, d, v, **k): return S.note(inst, p, d, vel=v, **k)
def felt(p, d, v):                       # felt piano: the upright, softened and low-passed
    return lp(note('upright', p, d, v * .8), 1800).astype(np.float32)
def mbox(p, v=.6, d=2.2): return P.pluck('music_box', p, d, vel=v)
def room(x, size=.55, mix=.25): return S.room(st(x), size=size, mix=mix)

# ------------------------------------------------------------------ foley (procedural, paper and light)
def env(n, a, r): e = np.ones(n); na, nr = min(n, int(a * SR)), min(n, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[len(e) - nr:] *= np.linspace(1, 0, nr); return e
def click(v=1.): d = .05; t = t_(d); return (bp(noise(d), 1800, 6000) * np.exp(-t / .004) * v + np.sin(2 * np.pi * 900 * t) * np.exp(-t / .006) * v * .4).astype(np.float32)
def shimmer(d=1.2, v=1., up=True):
    out = np.zeros(int(d * SR) + SR, np.float32); ps = ['A5', 'D6', 'F#6', 'A6', 'D7'] if up else ['D7', 'A6', 'F#6', 'D6', 'A5']
    for k, p in enumerate(ps): x = note('glockenspiel', p, 1.0, .35 * v); i = int(k * d / 5 * SR); out[i:i + len(x)] += x[:len(out) - i]
    return out
def tap(v=1.): d = .06; t = t_(d); return (lp(noise(d), 2200) * np.exp(-t / .007) * v).astype(np.float32)
def rustle(d=.5, v=1.): n = noise(d); return (bp(n, 1500, 7000) * env(len(n), .08, .25) * (.5 + .5 * np.abs(lp(noise(d), 18))) * v * .5).astype(np.float32)
def thud(v=1.): d = .35; t = t_(d); return ((np.sin(2 * np.pi * 85 * t) * np.exp(-t / .07) + .4 * lp(noise(d), 600) * np.exp(-t / .03)) * v).astype(np.float32)
def buzz(d=.5, v=1.): t = t_(d); return (np.sin(2 * np.pi * 172 * t) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 9 * t))) * env(len(t), .01, .05) * v * .3).astype(np.float32)

# ------------------------------------------------------------------ the room tone (low, no hiss)
rt = lp(lp(noise(DUR + 1), 220), 220) * .5
place(bed, rt[:N], 0, 1.)

# ------------------------------------------------------------------ A: two windows (0–8.6)
MOTIF = [('D5', 0), ('F#5', 1), ('A5', 2), ('B5', 3), ('A5', 4), ('F#5', 5), ('E5', 6), ('F#5', 7), ('D5', 8)]
def motif(t0, offset=0., v=.6, g=1., pan=(-.5, .5), sync=False):
    for p, k in MOTIF:
        place(music, mbox(p, v), t0 + k * BEAT, g, pan[0])
        place(music, mbox(p, v * .92), t0 + k * BEAT + (0 if sync else BEAT / 2 * .25) + offset, g * .9, pan[1])
place(foley, shimmer(1.0, .8), -.1, .5)                      # the lamp is already lit: its shimmer on the first frame
motif(0.05, v=.62)
for i, (r, ch) in enumerate([('D2', ['D3', 'A3', 'F#4']), ('B1', ['B2', 'F#3', 'D4']), ('G1', ['G2', 'D3', 'B3'])]):
    place(music, felt(r, BAR * 1.1, .55), i * BAR, .9)
    for k, p in enumerate(ch): place(music, felt(p, BAR, .35), i * BAR + .02 + k * .03, .5)
for tt in (HIT['sync'], HIT['sync'] + 1.8): place(foley, tap(.5), tt, .5, -.2); place(foley, tap(.5), tt + .01, .45, .3)   # both thumbs, together
place(foley, whoosh(.6, .8), 8.0, .5)                        # the curtain closes...
place(foley, rustle(.6, .8), 8.6, .7)                        # ...and opens

# ------------------------------------------------------------------ B: the grid (8.6–23.6): taps speed up with the count
place(music, felt('A1', BAR * 1.5, .5), 8.6, .8)
t0g, tF = HIT['grid'] + .4, HIT['full']
kOf = lambda t: 1 + 511 * (.1 * min(1, max(0, (t - t0g) / (tF - t0g))) + .9 * min(1, max(0, (t - t0g) / (tF - t0g))) ** 3.2)
prev, last = 1, -1
for i in range(int((tF - t0g) * 200)):
    t = t0g + i / 200; k = int(kOf(t))
    if k != prev and t - last > .045:
        place(foley, tap(.55), t, .6, rng.uniform(-.3, .3)); last = t
        if k < 60 or k % 7 == 0: place(music, mbox(['A5', 'D6', 'F#6', 'E6', 'B5', 'C#6'][k % 6], .35, .8), t, .35, rng.uniform(-.4, .4))
    prev = k
ARP = ['D4', 'F#4', 'A4', 'D5', 'A4', 'F#4']
t = 9.4
while t < HIT['repeat'] - .3:
    sp = BEAT / 2 if t < 15 else BEAT / 3 if t < 18 else BEAT / 4
    place(music, note('harp', ARP[int((t - 9.4) / sp) % 6], .8, .38), t, .45, -.2); t += sp
for i, r in enumerate(['D2', 'E2', 'F#2', 'G2']): place(music, felt(r, BAR, .45), 11.0 + i * BAR, .75)
rep = HIT['repeat']
music[int((rep - .25) * SR):int(rep * SR)] *= .15                                      # a breath before the seal
place(music, felt('D2', 3.0, .75), rep, 1.0); place(music, felt('A2', 3.0, .6), rep, .7); place(music, felt('D3', 3, .55), rep, .6)
place(foley, thud(.9), rep, .8); place(foley, S.hit('woodblock', 'b', .5), rep + .02, .35)
place(foley, rustle(.5, .6), rep - .5, .5, .4)                                         # the second grid slides in

# ------------------------------------------------------------------ C: atoms (23.6–32.3)
place(foley, rustle(.8, .5), 23.6, .4)
for i, ch in enumerate([['D3', 'A3', 'D4', 'F#4'], ['B2', 'F#3', 'B3', 'D4'], ['G2', 'D3', 'G3', 'B3'], ['A2', 'E3', 'A3', 'C#4']]):
    for k, p in enumerate(ch * 2): place(music, note('harp', p if k < 4 else p[:-1] + str(int(p[-1]) + 1), 1.2, .4), 23.8 + i * BAR + k * BEAT / 3, .5, -.3 + k * .08)
    place(music, note('violas', ch[1], BAR + .5, .3, attack=.6), 23.8 + i * BAR, .35, .2)
    place(music, note('cellos', ch[0], BAR + .5, .3, attack=.6), 23.8 + i * BAR, .35, -.2)
for k in range(48): place(foley, click(.25), HIT['circle'] - .4 + k * 4.0 / 48 + rng.uniform(0, .05), .25, rng.uniform(-.7, .7))   # pinholes
place(foley, rustle(.7, .5), HIT['circle'], .45, .3)
place(foley, thud(.8), HIT['finite'], .7); place(foley, S.hit('woodblock', 'a', .55), HIT['finite'], .45)

# ------------------------------------------------------------------ D: the layers (32.3–40.2): flute over strings
FL = [('A5', 0, 1), ('F#5', 1, .5), ('A5', 1.5, .5), ('B5', 2, 1), ('D6', 3, 1.5), ('C#6', 4.5, .5), ('B5', 5, 1), ('A5', 6, 3)]
for p, b, d in FL: place(music, note('flute', p, d * BEAT, .45, attack=.08), 32.6 + b * BEAT, .5, .1)
for i, ch in enumerate([['D3', 'A3', 'F#4'], ['G2', 'D3', 'B3'], ['E3', 'B3', 'G4'], ['A2', 'E3', 'C#4']]):
    for k, p in enumerate(ch): place(music, note('violins' if k == 2 else 'violas' if k == 1 else 'cellos', p, BAR + .6, .32 + .05 * i, attack=.8), 32.4 + i * 2.0, .35)
for z in range(6): place(foley, rustle(.35, .35), 33.2 + z * .85, .25, rng.uniform(-.5, .5))   # passing paper layers
place(music, room(note('hand_chimes', 'A5', 3, .6)), HIT['other'], .7); place(music, room(note('hand_chimes', 'D6', 3, .5)), HIT['other'] + .25, .55)
place(music, felt('D3', 3, .5), HIT['other'], .6); place(music, felt('A3', 3, .45), HIT['other'], .5); place(music, felt('F#4', 3, .4), HIT['other'], .45)

# ------------------------------------------------------------------ E: the number (40.2–55.3)
def w(id, k): return L[id] + WORDS[id][k][1]
for i, (r, ch) in enumerate([('B1', ['B2', 'D3', 'F#3']), ('G1', ['G2', 'B2', 'D3']), ('D2', ['A2', 'D3', 'F#3']), ('A1', ['A2', 'C#3', 'E3']), ('B1', ['B2', 'D3', 'F#3']), ('G1', ['G2', 'B2', 'D3'])]):
    place(music, felt(r, BAR * 1.1, .5), 40.4 + i * BAR, .8)
    for k, p in enumerate(ch): place(music, felt(p, BAR * .9, .3), 40.4 + i * BAR + k * BEAT, .5)
for tt in (L['v13'] - .1, w('v14', 3), w('v14', 7), w('v14', 9), w('v14', 17)): place(foley, rustle(.4, .6), tt, .5, .2); place(music, note('harp', 'A4', 1.0, .45), tt, .45)
for k, (p, b) in enumerate([('D5', 0), ('E5', 1), ('F#5', 2), ('A5', 3), ('B5', 4.5), ('A5', 6)]): place(music, felt(p, BEAT * 1.5, .45), HIT['zeros'] + b * BEAT, .55)
for i in range(int((HIT['ly'] - HIT['zeros']) / .09)): place(foley, tap(.25), HIT['zeros'] + i * .09, .2, .3)   # the counter strip
place(music, room(S.hit('gong2', 'small', .6), .7, .4), HIT['ly'], .55); place(music, felt('D3', 3.5, .55), HIT['ly'], .7); place(music, felt('A3', 3.5, .45), HIT['ly'], .55)

# ------------------------------------------------------------------ F: the lights go out (55.3–60.8); music thins, then silence
place(foley, rustle(.5, .5), 55.3, .45)
for i, (r, ch) in enumerate([('G1', ['G2', 'B2', 'D3']), ('E2', ['E3', 'G3', 'B3'])]):
    place(music, felt(r, BAR * 1.2, .45), 55.3 + i * BAR, .7); [place(music, felt(p, BAR, .28), 55.3 + i * BAR + k * BEAT, .45) for k, p in enumerate(ch)]
for k, tt in enumerate([HIT['drop1'], HIT['drop2'], HIT['drop3'], HIT['faded']]): place(foley, click(.6 - k * .08), tt, .45, -.3 + .2 * k)
seal8 = L['v17'] + WORDS['v17'][6][1]
place(foley, thud(.7), seal8, .6); place(foley, S.hit('woodblock', 'c', .45), seal8, .35)
dark = HIT['flood'] - .35
fade = np.ones(N); i0, i1 = int((HIT['drop1']) * SR), int((dark - .3) * SR); fade[i0:i1] = np.linspace(1, .25, i1 - i0); fade[i1:int(HIT['flood'] * SR)] = 0
music *= fade[:, None]
bed[int((dark - .2) * SR):int((HIT['flood'] + .3) * SR)] *= 1.8                       # alone in the dark: only the room

# ------------------------------------------------------------------ G: lights on again (60.8–65.5)
fl = HIT['flood']
place(foley, click(.8), fl - .15, .55); place(foley, shimmer(1.0, 1.), fl - .1, .55)
motif(fl + .1, v=.62, sync=True)
place(music, felt('D2', BAR * 1.2, .5), fl + .1, .85); [place(music, felt(p, BAR, .32), fl + .12 + k * .03, .5) for k, p in enumerate(['D3', 'A3', 'F#4'])]
place(music, felt('G1', BAR * 1.2, .5), fl + .1 + BAR, .8); [place(music, felt(p, BAR, .3), fl + .12 + BAR + k * .03, .45) for k, p in enumerate(['G2', 'D3', 'B3'])]
place(music, room(note('hand_chimes', 'E5', 3, .5)), HIT['look'], .55)
endc = fl + .1 + 2 * BAR
place(music, felt('A1', 4.5, .55), endc, .85); [place(music, felt(p, 4.5, .35), endc + k * .04, .55) for k, p in enumerate(['A2', 'E3', 'C#4', 'G4'])]   # A7: left open
place(music, mbox('E6', .5, 3.0), endc + .02, .5, .3)
place(foley, buzz(.45, .9), HIT['send'], .5, .4); place(foley, buzz(.35, .9), HIT['send'] + .6, .45, .4)
tail = np.clip((DUR - np.arange(N) / SR) / 2.5, 0, 1)[:, None]
for b in (music, foley): b *= tail
music = room(music, .5, .18).astype(np.float32)[:N]

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

# ------------------------------------------------------------------ mix: voice RMS -18 dB, music ~ -27.5 dB ducked 5.5 dB, foley low, room tone very low
rms = lambda x: float(np.sqrt(np.mean(x ** 2) + 1e-12))
db = lambda d: 10 ** (d / 20)
active = lambda x: x[np.abs(x).max(1) > 1e-4] if (np.abs(x).max(1) > 1e-4).any() else x
voice *= db(-18) / rms(voice[vm[:, 0] > .5])
music *= db(-27.5) / rms(active(music)); music *= 1 - (1 - db(-5.5)) * vm
foley *= db(-30) / rms(active(foley))
bed *= db(-52) / rms(bed)
mix = (music + foley + bed + voice)[:int(DUR * SR)].astype(np.float64)
os.makedirs(os.path.join(HERE, 'out/stems'), exist_ok=True)
for n, x in (('music', music), ('foley', foley), ('bed', bed), ('voice', voice)): sf.write(os.path.join(HERE, f'out/stems/{n}.wav'), x[:int(DUR * SR)], SR, subtype='FLOAT')

# ------------------------------------------------------------------ master: BS.1770 loudness to -14 LUFS, true-peak limit (AAC adds a little, so -3.5 dBTP here)
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
json.dump(S.credits(['upright', 'harp', 'glockenspiel', 'hand_chimes', 'flute', 'violins', 'violas', 'cellos', 'woodblock', 'gong2']), open(os.path.join(HERE, 'out/instrument_credits.json'), 'w'), ensure_ascii=False, indent=1)
print('wrote out/mix.wav')
