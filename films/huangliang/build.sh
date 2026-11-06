#!/bin/sh
# Rebuild 《一锅饭的一生》: fonts → (voice) → ASR → score → mix → video → mux → subtitles → poster → covers
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
PY="$LIB/.venv/bin/python"
cd "$HERE"
python3 -I tools/fonts.py .
node tools/export.mjs
[ -n "$REVOICE" ] && "$PY" tools/tts_doubao.py voice/lines.json voice --speaker zh_male_jieshuoxiaoming_uranus_bigtts
"$PY" "$LIB/core/tts/asr_check.py" voice/lines.json voice --lang zh || true
"$PY" music/score.py
"$PY" mix.py
(cd "$LIB" && node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4")
sh "$LIB/core/render/mux.sh" out/video.mp4 out/mix.wav huangliang.mp4 30 0
python3 -I tools/cues.py .
python3 "$LIB/core/render/srt.py" cues.json huangliang.srt
ffmpeg -v error -y -ss 42.8 -i huangliang.mp4 -frames:v 1 -q:v 2 poster.jpg
(cd "$LIB" && node core/render/still.mjs "$HERE" 42.8 1.4 --q nosub=1 --size 1080x1920 --out "$HERE/cover" --prefix bg_)
python3 -I tools/covers.py .
echo "done: $HERE/huangliang.mp4"
