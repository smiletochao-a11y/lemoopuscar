"""Doubao speech synthesis 2.0 (Volcengine openspeech V3, HTTP unidirectional stream) -> one WAV per line + dur.json.
The API key is read from the environment (DOUBAO_TTS_API_KEY) and never printed.
usage: python tools/tts_doubao.py lines.json out_dir [--speaker ID] [--resource seed-tts-2.0] [--only id,id]
lines.json: [{id, text, say?, rate?, context?}]
  say      what is spoken when it differs from the subtitle text (numbers spelled out, homophones)
  rate     speech_rate, -50..100 (0 = normal)
  context  a short instruction for tone and rhythm (TTS 2.0 context_texts), e.g. "用平静、略带悬念的语气，句中逗号处稍作停顿"
Output: <id>.wav (24 kHz mono, leading/trailing silence trimmed to 20/120 ms) and dur.json (seconds)."""
import sys, os, json, base64, uuid, urllib.request
import numpy as np, soundfile as sf

URL = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
SR = 24000

def synth(text, speaker, resource, rate=0, context=None):
    add = {'disable_markdown_filter': True}
    if context: add['context_texts'] = [context]
    body = {'user': {'uid': 'film'}, 'req_params': {'text': text, 'speaker': speaker,
            'audio_params': {'format': 'pcm', 'sample_rate': SR, 'speech_rate': int(rate), 'loudness_rate': 0},
            'additions': json.dumps(add, ensure_ascii=False)}}
    req = urllib.request.Request(URL, data=json.dumps(body, ensure_ascii=False).encode(), method='POST', headers={
        'Content-Type': 'application/json', 'X-Api-Key': os.environ['DOUBAO_TTS_API_KEY'],
        'X-Api-Resource-Id': resource, 'X-Api-Request-Id': str(uuid.uuid4())})
    pcm = bytearray()
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            buf = b''
            for chunk in iter(lambda: r.read(65536), b''):
                buf += chunk
                while b'\n' in buf:
                    line, buf = buf.split(b'\n', 1)
                    if not line.strip(): continue
                    m = json.loads(line)
                    if m.get('data'): pcm += base64.b64decode(m['data'])
                    elif m.get('code') not in (0, 20000000, None): raise RuntimeError(f"code {m.get('code')}: {m.get('message')}")
            if buf.strip():
                m = json.loads(buf)
                if m.get('data'): pcm += base64.b64decode(m['data'])
                elif m.get('code') not in (0, 20000000, None): raise RuntimeError(f"code {m.get('code')}: {m.get('message')}")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'HTTP {e.code}: {e.read()[:300].decode(errors="replace")}')
    return np.frombuffer(bytes(pcm), '<i2').astype(np.float32) / 32768

def trim(x, pre=.02, post=.12):
    a = np.abs(x); thr = max(a.max() * .02, 1e-4); idx = np.nonzero(a > thr)[0]
    if not len(idx): return x
    return x[max(0, idx[0] - int(pre * SR)): min(len(x), idx[-1] + int(post * SR))]

def main():
    args = sys.argv[1:]
    opt = lambda k, d=None: (args[args.index(k) + 1] if k in args else d)
    lines = json.load(open(args[0])); out = args[1]; os.makedirs(out, exist_ok=True)
    speaker, resource = opt('--speaker'), opt('--resource', 'seed-tts-2.0')
    only = set(opt('--only', '').split(',')) - {''}
    dpath = os.path.join(out, 'dur.json'); dur = json.load(open(dpath)) if os.path.exists(dpath) else {}
    for L in lines:
        if only and L['id'] not in only: continue
        x = trim(synth(L.get('say') or L['text'], L.get('speaker', speaker), resource, L.get('rate', 0), L.get('context')))
        sf.write(os.path.join(out, L['id'] + '.wav'), x, SR)
        dur[L['id']] = round(len(x) / SR, 3); print(L['id'], dur[L['id']], L['text'])
    json.dump(dur, open(dpath, 'w'), indent=1, ensure_ascii=False)

if __name__ == '__main__':
    main()
