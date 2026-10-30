"""Subtitle cues from timeline.json + voice/dur.json, the same spans the page draws (film.js lineSpan) -> cues.json"""
import json, os, sys
D = sys.argv[1]
TL = json.load(open(os.path.join(D, 'timeline.json'))); dur = json.load(open(os.path.join(D, 'voice/dur.json')))
L = TL['LINES']; out = []
for i, l in enumerate(L):
    nxt = L[i + 1]['t'] if i + 1 < len(L) else TL['DUR']
    out.append({'id': l['id'], 't0': l['t'], 't1': round(min(nxt - .12, l['t'] + max(1.8, dur[l['id']] + .6)), 3), 'text': l['zh']})
json.dump(out, open(os.path.join(D, 'cues.json'), 'w'), ensure_ascii=False, indent=1)
print(len(out), 'cues; shortest', min(round(c['t1'] - c['t0'], 2) for c in out), 's')
