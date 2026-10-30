#!/bin/sh
# 《窄门》 one command: imagery -> plates -> measurement -> fonts -> voice -> checks -> picture -> mix -> master -> subtitles -> poster.
# The first run downloads ~550 MB of imagery into assets/raw/ (FETCH=1 forces it again); the score needs
# `sh tools/fetch.sh instruments vsco2ce|vcsl|freepats` and the voice `setup.sh deps voice` (edge-tts needs a connection).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
cd "$HERE"

# imagery and plates (public domain / Copernicus; every request is logged in assets/raw/manifest.jsonl)
if [ -n "$FETCH" ] || [ ! -f assets/raw/landsat/strait.npz ]; then
  "$PY" -I tools/fetch_gibs.py .
  for p in strait narrows qatar; do "$PY" -I tools/fetch_landsat.py . $p; done
  IT=S2C_MSIL2A_20250221T064931_R020_T40RDQ_20250221T122212
  "$PY" -I tools/fetch_s2.py . $IT 56.400,26.470,56.600,26.620 2400x2000 assets/raw/s2/det.npz
fi
"$PY" -I tools/plates.py .
"$PY" -I tools/measure.py .
[ -f fonts/NotoSansSC-500.woff2 ] && [ -z "$FETCH" ] || "$PY" -I tools/fonts.py .

# voice: timeline -> lines -> edge-tts -> speech check
node tools/export.mjs .
"$PY" tools/tts_proxy.py "$LIB" voice/lines.json voice
"$PY" "$LIB/core/tts/asr_check.py" voice/lines.json voice --lang zh

# picture
cd "$LIB"
node core/render/readcheck.mjs "$HERE" --step 0.1
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
cd "$HERE"

# sound: score, foley, beds, voice -> out/mix.wav (pre-mastered to -14 LUFS, true peak -3.5 dBTP in mix.py)
"$PY" mix.py
"$PY" -I tools/audiocheck.py .

# master: two-pass loudnorm to -14 LUFS, grain
sh "$LIB/core/render/mux.sh" out/video.mp4 out/mix.wav hormuz.mp4 24 2

# subtitles and poster
"$PY" -I tools/cues.py .
"$PY" "$LIB/core/render/srt.py" cues.json hormuz.srt
ffmpeg -v error -y -ss 99.5 -i hormuz.mp4 -frames:v 1 -q:v 2 poster.jpg
echo "done: $HERE/hormuz.mp4"
