"""Mix checks: sub-bass share, the loudest moments, levels at the designed impacts and in the hushes."""
import sys, json, os
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
D = sys.argv[1]; TL = json.load(open(os.path.join(D, 'timeline.json')))
x, sr = sf.read(os.path.join(D, 'out/mix.wav')); m = x.mean(1)
full = np.sqrt(np.mean(m ** 2)); low = np.sqrt(np.mean(sosfilt(butter(4, [20, 60], 'band', fs=sr, output='sos'), m) ** 2))
print('20-60 Hz vs full band: %.1f dB' % (20 * np.log10(low / full)))
w = int(.4 * sr); hop = int(.1 * sr)
db = 20 * np.log10(np.array([np.sqrt(np.mean(m[i:i + w] ** 2)) for i in range(0, len(m) - w, hop)]) + 1e-9)
order = np.argsort(-db)
print('loudest 400 ms windows:', [round(i * .1, 1) for i in order[:8]])
for k in ('rangeLand', 'laneRead', 'eighth', 'open'):
    t = TL['HIT'][k]; i = int(t * 10); pk = db[i:i + 5].max(); rank = int((db > pk).sum())
    print(f'{k:10s} {t:6.2f}s  {pk:6.1f} dB  rank {rank}')
med = np.median(db)
for a, b in (TL['SEC']['hush1'], TL['SEC']['hush2']):
    print(f'hush {a:.1f}-{b:.1f}: {db[int(a * 10) + 2:int(b * 10) - 2].mean() - med:+.1f} dB vs median')
