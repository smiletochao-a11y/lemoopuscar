"""Subtitle cues, the same spans the page shows (src/main.js subtitle()): from each line's start to
min(next start - .1, max(end + .6, start + 1.8)) -> cues.json"""
import json, os, sys
D = sys.argv[1]
TL = json.load(open(os.path.join(D, 'timeline.json'))); dur = json.load(open(os.path.join(D, 'voice/dur.json')))
L = TL['LINES']; out = []
for i, l in enumerate(L):
    nxt = L[i + 1]['t'] if i + 1 < len(L) else TL['DUR']
    out.append({'id': l['id'], 't0': l['t'], 't1': round(min(nxt - .1, max(l['t'] + dur[l['id']] + .6, l['t'] + 1.8)), 3), 'text': l['zh']})
json.dump(out, open(os.path.join(D, 'cues.json'), 'w'), ensure_ascii=False, indent=1)
print(len(out), 'cues; shortest', min(round(c['t1'] - c['t0'], 2) for c in out), 's')
