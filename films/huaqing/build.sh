#!/bin/sh
# Rebuild 《华清池 · 她还剩两百多天》 from source: fonts → voice (optional) → ASR → mix → video → mux → subtitles → poster → covers
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
cd "$HERE"
python3 -I tools/fonts.py .
node tools/export.mjs
# REVOICE=1 regenerates the narration with Doubao TTS 2.0 (needs DOUBAO_TTS_API_KEY)
[ -n "$REVOICE" ] && "$PY" tools/tts_doubao.py voice/lines.json voice --speaker zh_male_jieshuoxiaoming_uranus_bigtts
"$PY" "$LIB/core/tts/asr_check.py" voice/lines.json voice --lang zh || true
"$PY" mix.py
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
cd "$HERE"
sh "$LIB/core/render/mux.sh" out/video.mp4 out/mix.wav huaqing.mp4 30 0
python3 -I tools/cues.py .
python3 "$LIB/core/render/srt.py" cues.json huaqing.srt
ffmpeg -v error -y -ss 2.2 -i huaqing.mp4 -frames:v 1 -q:v 2 poster.jpg
echo "done: $HERE/huaqing.mp4"
