#!/bin/sh
# Mux for an ffmpeg older than 7: the audio is already mastered (mix.py: -14 LUFS, true peak -1.6 dBTP), so no loudnorm;
# film grain in ffmpeg as core/render/mux.sh does. usage: sh tools/mux_plain.sh video.mp4 mix.wav out.mp4 [grain=2]
set -e
V="$1"; A="$2"; O="$3"; GR="${4:-2}"
[ -f "$V" ] && [ -f "$A" ] && [ -n "$O" ] || { echo "usage: sh tools/mux_plain.sh video.mp4 mix.wav out.mp4 [grain]" >&2; exit 1; }
TMP="$O.part.mp4"
ffmpeg -v error -y -i "$V" -i "$A" -map 0:v:0 -map 1:a:0 \
  -vf "fps=24,noise=c0s=$GR:allf=t" -c:v libx264 -preset slow -crf 18 -tune grain -pix_fmt yuv420p \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$TMP"
mv "$TMP" "$O"
ffmpeg -hide_banner -nostats -i "$O" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | sed 's/^ */mux: /'
