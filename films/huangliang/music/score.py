# -*- coding: utf-8 -*-
"""《一锅饭的一生》 — original city-pop / anime-opening score, synthesised with numpy (instrument kit from the cel-anime-80s
style: FM electric piano, slap bass, gated snare, synth brass, chorus guitar, string pad, FM bell).
112 BPM, D major (the hook is a D-major pentatonic phrase: D E F# A B, an Eastern colour over 80s harmony);
the peak chorus goes up a semitone to E-flat. Written to the picture (timeline.js):
  0–5.6     cold open: brass hit on frame 1, toms under the four flashes, brass + crash on the title (2.9)
  5.6–15.6  the inn: electric piano and pad only, slow Bm9 – GM7, a bell hints at the hook
  15.6–19   the dive: riser + accelerating toms → crash on 19.0
  19–27.4   the rise: full groove, brass stabs on the board (22.2) and each robe change (23.7, 24.8, 26.0)
  27.4–31.4 the slander: minor, cassette quality, a heartbeat kick; boom on the impact (29.0)
  31.4–35   the climb back: groove returns, snare roll
  35–35.6   true silence
  35.6–42.2 prison: low pad and a pulse; boom on the knife (38.9); strings swell on the tears
  42.2–50.2 the peak: chorus, a semitone up, the hook on brass; thins as he grows old
  50.2–53   the tape slows to a stop (pitch drop), silence on the blue screen; static from the mix
  55–60     rewind: the peak chorus reversed, sped up (built in main())
  60–73     the inn again: electric piano returns to the opening motif; a last unresolved Asus chord
Run: .venv/bin/python films/huangliang/music/score.py → score.wav, stems/, score.json"""
import time
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *
from _kit import KICKS, BUS, SEND, STEMS
from scipy.signal import resample_poly

KN = [(0, 0), (23.4, 23.4), (27.4, 26.2), (47.6, 46.4), (50.2, 48.2), (52.4, 49.0), (53.0, 49.2), (54.0, 50.0), (55.0, 50.4), (60.0, 55.0), (66.4, 61.4), (73.0, 67.0)]
def Wp(t):   # old-cut time → new-cut time (piecewise linear)
    for (a, x), (b, y) in zip(KN, KN[1:]):
        if t <= b: return x + (y - x) * (t - a) / (b - a)
    return t - 6
def at(bus, sig, t, gain=1.0, pan=0.0, send=None): place(bus, sig, Wp(t) + hum(2), gain, pan, send)
def raw(bus, sig, t, gain=1.0, pan=0.0, send=None): place(bus, sig, t + hum(2), gain, pan, send)
D4 = 62
SNARES = [snare(1, .26) for _ in range(3)]
def chordm(root, q, center=62): return voicing(root, q, center)

# progressions (D major): royal road IVM7–V7–iii7–vi7 = GM7 A7 F#m7 Bm7
ROYAL = [('G', 'M9'), ('A', '13'), ('F#', 'm7'), ('B', 'm9')]
ROYAL_UP = [('Ab', 'M9'), ('Bb', '13'), ('G', 'm7'), ('C', 'm9')]
HOOK = [(0, 1, 74), (1, .5, 76), (1.5, .5, 78), (2, 1, 81), (3, 1, 78), (4, .5, 76), (4.5, .5, 74), (5, 1, 71), (6, 2, 74)]   # D E F# A F# E D B D

def groove(t0, t1, prog, dyn=1.0, up=0):
    t0, t1 = Wp(t0), Wp(t1); at = raw
    b = 0; t = t0
    while t < t1 - 1e-6:
        r, q = prog[b % len(prog)]
        for k in range(4):                                   # drums: four on the floor-ish city pop: kick 1 & 3, snare 2 & 4, 8th hats
            tb = t + k * BEAT
            if tb >= t1: break
            if k in (0, 2): at('drums', kick(.9 * dyn), tb); KICKS.append(tb)
            if k in (1, 3): at('drums', SNARES[k % 3] * .8 * dyn, tb)
            for h in (0, .5): at('drums', hat(.45 * dyn, open_=(h == .5 and k == 3)), tb + h * BEAT, pan=.3)
        root = bass_root(r) + up
        for k, (bt, d) in enumerate([(0, .5), (.75, .25), (1.5, .5), (2, .5), (2.75, .25), (3.5, .5)]):   # slap bass
            if t + bt * BEAT < t1: at('bass', bass(root + (12 if k in (1, 4) else 0), d * BEAT, .8 * dyn, 'P' if k in (1, 4) else 'T'), t + bt * BEAT)
        for bt in (0, 1.5, 2.5):                             # electric piano comping
            if t + bt * BEAT < t1:
                for m in chordm(r, q, 64): at('keys', epiano(m + up, .9 * BEAT, .45 * dyn), t + bt * BEAT, pan=-.2)
        for bt in (.5, 1.5, 2.5, 3.5):                       # chorus guitar chanks on the off-beats
            if t + bt * BEAT < t1:
                for m in chordm(r, q, 67)[-3:]: at('guitar', gtr(m + up, .2, .4 * dyn, mute=True), t + bt * BEAT, pan=.35)
        b += 1; t += BAR

def pads(t0, t1, prog, dyn=.6, up=0, center=60):
    t0, t1 = Wp(t0), Wp(t1); at = raw
    b = 0; t = t0
    while t < t1 - 1e-6:
        r, q = prog[b % len(prog)]; d = min(BAR, t1 - t)
        for m in chordm(r, q, center): at('pad', pad(m + up, d + .4, .4 * dyn), t)
        b += 1; t += BAR

def hook(t0, inst='brass', up=0, gain=1.0, oct=0):
    t0 = Wp(t0); at = raw
    for bt, d, m in HOOK:
        if inst == 'brass': at('brass', brass(m + up + oct, d * BEAT * .95, .8, 1.0), t0 + bt * BEAT, gain)
        elif inst == 'bell': at('lead', bell(m + up + oct, 2.0, .45), t0 + bt * BEAT, gain)
        else: at('keys', epiano(m + up + oct, d * BEAT, .55), t0 + bt * BEAT, gain)

def stab(t, prog_chord, up=0, gain=1.0):
    r, q = prog_chord
    for m in chordm(r, q, 70): at('brass', brass(m + up, .32, .9, 1.2, .006), t, gain)

def toms(t0, t1, n):
    t0, t1 = Wp(t0), Wp(t1); at = raw
    for i in range(n):
        u = i / max(1, n - 1); tt = t0 + (t1 - t0) * (u ** .8)
        at('drums', tom(180 - 90 * u, .5 + .5 * u), tt, pan=-.4 + .8 * u)

def build():
    # cold open
    stab(0.0, ('D', 'add9')); at('drums', crash(.9), 0.0)
    for f in (1.3, 1.65, 2.0, 2.35): at('drums', tom(140, .9), f); at('drums', boom(.5), f)
    stab(2.9, ('G', 'M9')); stab(2.9 + BEAT * .5, ('A', '13')); at('drums', crash(1.0), 2.9)
    pads(0.0, 5.6, [('D', 'M9'), ('G', 'M9')], .5)
    hook(3.4, 'bell', 0, .7)
    # the inn: Bm9 – GM7, electric piano arpeggios
    for i, (r, q) in enumerate([('B', 'm9'), ('G', 'M9'), ('B', 'm9'), ('G', 'M9'), ('E', 'm9')]):
        t = 5.6 + i * BAR
        for k, m in enumerate(chordm(r, q, 64) * 2): at('keys', epiano(m, BEAT * 1.5, .32), t + k * BEAT * .5, pan=-.2 + .1 * k)
    pads(5.6, 15.6, [('B', 'm9'), ('G', 'M9'), ('B', 'm9'), ('G', 'M9'), ('E', 'm9')], .45)
    hook(12.6, 'bell', 0, .5, 12)
    # the dive
    at('fx', riser(3.3, .9), 15.7); toms(16.6, 18.9, 14); at('drums', crash(1.0), 19.0); KICKS.append(19.0)
    # the rise
    groove(19.0, 27.4, ROYAL, 1.0)
    pads(19.0, 27.4, ROYAL, .45)
    stab(22.2, ('A', '13'), 0, 1.1); at('fx', bell(93, 2.4, .5), 22.25)
    for t in (23.6, 24.4, 25.2): raw('brass', brass(74, .3, .9, 1.2, .006), t); [raw('brass', brass(m, .32, .9, 1.2, .006), t) for m in chordm('G', 'M9', 70)]; raw('drums', crash(.6), t)
    hook(23.7, 'keys', 0, .8, 12)
    # the slander (cassette quality from LOFI0..LOFI1): minor pads + a heartbeat
    pads(27.4, 31.4, [('B', 'm9'), ('F#', 'm7')], .6, 0, 56)
    for k in range(8): raw('drums', kick(.7), Wp(27.4) + k * BEAT); raw('drums', kick(.4), Wp(27.4) + k * BEAT + .18)
    at('fx', boom(1.0), 29.0)
    # the climb back
    groove(31.4, 35.0, ROYAL, .9)
    for i in range(16): raw('drums', SNARES[i % 3] * (.3 + .04 * i), Wp(33.3) + i * (Wp(35.0) - Wp(33.3)) / 16)
    at('fx', riser(1.7, .7), 33.3)
    # prison
    pads(35.6, 42.2, [('B', 'm9'), ('G', 'M9'), ('E', 'm9')], .5, 0, 54)
    for k in range(int((Wp(42.2) - Wp(35.6)) / BEAT)): raw('bass', bass(bass_root('B'), BEAT * .6, .6, 'T'), Wp(35.6) + k * BEAT)
    at('fx', boom(1.1), 38.9); at('drums', crash(1.0), 38.9); stab(38.9, ('B', 'm9'), 0, 1.1)
    pads(40.8, 42.2, [('G', 'M9')], .9, 0, 66)
    # the peak: a semitone up, the hook on brass
    at('drums', crash(1.0), 42.2); groove(42.2, 47.6, ROYAL_UP, 1.0, 0)
    pads(42.2, 50.2, ROYAL_UP, .55)
    hook(42.6, 'brass', 1, 1.0); hook(42.6 + 4 * BEAT * 2, 'brass', 1, .9)
    for t in (45.4, 45.4 + BEAT, 45.4 + 2 * BEAT): at('fx', bell(98, 1.5, .4), t)
    # old age: groove drops, pad and electric piano only
    for i, (r, q) in enumerate(ROYAL_UP[:2]):
        for m in chordm(r, q, 64): raw('keys', epiano(m, BAR, .35), Wp(47.6) + i * BAR)
    # back at the inn
    for i, (r, q) in enumerate([('B', 'm9'), ('G', 'M9'), ('D', 'M9')]):
        t = Wp(60.0) + i * BAR
        for k, m in enumerate(chordm(r, q, 64) * 2): raw('keys', epiano(m, BEAT * 1.5, .3), t + k * BEAT * .5, pan=-.2 + .1 * k)
    pads(60.0, 66.4, [('B', 'm9'), ('G', 'M9'), ('D', 'M9')], .4)
    at('lead', bell(86, 2.4, .45), 64.1)
    # outro: the hook once more, gently, ending on Asus (unresolved)
    pads(66.4, 71.0, ROYAL, .45)
    hook(66.6, 'keys', 0, .7)
    for m in chordm('A', '7sus4', 62): at('pad', pad(m, 2.2, .45), 71.0); at('keys', epiano(m, 2.0, .4), 71.0)
    at('lead', bell(81, 2.2, .45), 71.0)

def tape_stop(st, t0, t1):
    """the tape slows to a stop between t0 and t1: time-stretch with falling speed (pitch drops)"""
    a, b = int(t0 * SR), int(t1 * SR); n = b - a
    speed = np.linspace(1, 0.05, n) ** 1.5; pos = a + np.cumsum(speed)
    out = st.copy()
    for c in range(2): out[a:b, c] = np.interp(pos, np.arange(len(st)), st[:, c])
    out[b:int(50.4 * SR)] = 0
    return out

def rewind(st, src0, src1, t0, t1):
    """the peak, reversed and sped up, with a whine — the tape rewinding"""
    seg = st[int(src0 * SR):int(src1 * SR)][::-1]
    n = int((t1 - t0) * SR); idx = np.linspace(0, len(seg) - 1, n) ** 1.0
    out = np.stack([np.interp(idx, np.arange(len(seg)), seg[:, c]) for c in range(2)], 1)
    out = hp(out, 900) * .5
    tt = ts(n); out += (np.sin(2 * np.pi * (1800 + 600 * np.sin(tt * 3)) * tt) * .05)[:, None]
    f = int(.05 * SR); out[:f] *= np.linspace(0, 1, f)[:, None]; out[-f:] *= np.linspace(1, 0, f)[:, None]
    st[int(t0 * SR):int(t0 * SR) + n] = out
    return st

def main():
    t0 = time.time(); build()
    t = ts(N); trem = .22 * np.sin(2 * np.pi * 3.4 * t)
    BUS['keys'][:, 0] *= 1 - trem; BUS['keys'][:, 1] *= 1 + trem
    BUS['keys'] = chorus_fx(BUS['keys'], .007, .0018, (.5, .63), .35)
    BUS['guitar'] = chorus_fx(hp(BUS['guitar'], 180), .010, .0032, (.8, 1.13), .6)
    BUS['pad'] = chorus_fx(BUS['pad'], .012, .004, (.25, .33), .5)
    pump = np.ones(N)
    for k in KICKS:
        s = int(k * SR); e = min(N, s + int(.3 * SR)); pump[s:e] = np.minimum(pump[s:e], 1 - .28 * np.exp(-ts(e - s) / .09))
    BUS['pad'] *= pump[:, None]; BUS['keys'] *= (1 - (1 - pump) * .5)[:, None]
    BUS['bass'] = hp(BUS['bass'], 32, 2)
    send = sum(SEND.values())
    wet = split_fx(send, lambda x: np.stack([fftconvolve(x, IR_HALL[:, c])[:N] for c in range(2)], 1))
    BUS['fx'] += hp(wet, 200) * .42
    c0, c1 = int(CUT0 * SR), int(CUT1 * SR)
    for k in STEMS: x = BUS[k]; x[c0:c1] = 0; BUS[k] = apply_lofi(x)
    BUS['drums'] *= .85
    mix = sum(BUS.values()); mix = hp(mix, 28, 2)
    mix = tape_stop(mix, 48.4, 49.0)
    mix = rewind(mix, 41.0, 48.2, 50.4, 54.9)
    pre = 1.0 / np.abs(mix).max(); mix *= pre
    det = uniform_filter1d(np.abs(mix).max(1), int(.005 * SR)); lv = env_follow(det, .012, .2); thr = .45; g = np.ones(N)
    over = lv > thr; g[over] = (thr * (lv[over] / thr) ** (1 / 2.0)) / lv[over]
    mix *= g[:, None]; mix /= np.abs(mix).max()
    mix = np.tanh(mix * 1.2) / np.tanh(1.2) * .89
    fade = np.ones(N); fe = int(1.2 * SR); fade[-fe:] = np.linspace(1, 0, fe) ** 2; mix *= fade[:, None]
    sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
    json.dump(dict(bpm=BPM, dur=DUR, key='D major, peak in E-flat', silence=[CUT0, CUT1], lofi=[LOFI0, LOFI1], tape_stop=[48.4, 49.0], rewind=[50.4, 54.9]), open(os.path.join(HERE, 'score.json'), 'w'), indent=1)
    print('done', round(time.time() - t0, 1), 's  peak', float(np.abs(mix).max()))

if __name__ == '__main__':
    main()
