#!/bin/sh
# 《另一个你》 one command: fonts -> voice (Doubao TTS 2.0, needs DOUBAO_TTS_API_KEY) -> speech check -> picture (30 fps) -> mix -> master -> subtitles -> poster.
# Needs `setup.sh deps voice` (speech check), `setup.sh deps music` (music box), sample packs vsco2ce and vcsl.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
cd "$HERE"
"$PY" -I tools/fonts.py .
node tools/export.mjs .
[ -n "$REVOICE" ] && "$PY" tools/tts_doubao.py voice/lines.json voice --speaker zh_male_jieshuoxiaoming_uranus_bigtts
"$PY" "$LIB/core/tts/asr_check.py" voice/lines.json voice --lang zh
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --q 'ssaa=1' --out "$HERE/out/video.mp4"
cd "$HERE"
"$PY" mix.py
sh "$LIB/core/render/mux.sh" out/video.mp4 out/mix.wav parallel-you.mp4 30 1
"$PY" -I tools/cues.py .
"$PY" "$LIB/core/render/srt.py" cues.json parallel-you.srt
ffmpeg -v error -y -ss 1.5 -i parallel-you.mp4 -frames:v 1 -q:v 2 poster.jpg
# covers (frame without subtitles + text)
(cd "$LIB" && node core/render/still.mjs "$HERE" 0.35 --q 'ssaa=1.5&nosub=1' --size 1080x1920 --out "$HERE/cover" --prefix bg_)
"$PY" -I tools/covers.py .
echo "done: $HERE/parallel-you.mp4"
