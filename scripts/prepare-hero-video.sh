#!/usr/bin/env bash
# Turn a downloaded stock clip into the hero background video.
#
#   scripts/prepare-hero-video.sh ~/Downloads/clip.mp4 [start_seconds] [duration_seconds]
#
# Produces, ready for the site to pick up automatically:
#   assets/video/hero.mp4   H.264, 1920x1080, no audio, ~3 Mbps
#   assets/video/hero.webm  VP9,   1920x1080, no audio, ~2 Mbps
#   assets/img/hero-poster.jpg  first frame, used while the video buffers
#
# Requires ffmpeg (https://ffmpeg.org/download.html; `brew install ffmpeg`
# on macOS, `sudo apt install ffmpeg` on Debian/Ubuntu).
set -euo pipefail

SRC="${1:-}"
START="${2:-0}"
DURATION="${3:-14}"

if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "Usage: $0 <downloaded-clip.mp4> [start_seconds] [duration_seconds]" >&2
  exit 1
fi
command -v ffmpeg >/dev/null || { echo "ffmpeg is not installed." >&2; exit 1; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/assets/video" "$ROOT/assets/img"

# Never ask for more than the clip holds, or the fade-out would be lost.
SRC_LEN="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")"
AVAILABLE="$(awk "BEGIN{print $SRC_LEN - $START}")"
if awk "BEGIN{exit !($DURATION > $AVAILABLE)}"; then
  DURATION="$(awk "BEGIN{printf \"%.2f\", $AVAILABLE}")"
  echo "Clip is ${SRC_LEN}s long; using ${DURATION}s from ${START}s."
fi

# Scale to cover 1920x1080, centre-crop, drop audio, fade the loop point.
FILTER="scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=25,\
fade=t=in:st=0:d=0.6,fade=t=out:st=$(awk "BEGIN{print $DURATION-0.6}"):d=0.6"

echo "Encoding MP4 (H.264)…"
ffmpeg -y -loglevel error -ss "$START" -t "$DURATION" -i "$SRC" \
  -vf "$FILTER" -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -b:v 3000k -maxrate 3600k -bufsize 6000k -movflags +faststart \
  "$ROOT/assets/video/hero.mp4"

echo "Encoding WebM (VP9)…"
ffmpeg -y -loglevel error -ss "$START" -t "$DURATION" -i "$SRC" \
  -vf "$FILTER" -an -c:v libvpx-vp9 -b:v 2000k -row-mt 1 -deadline good -cpu-used 2 \
  "$ROOT/assets/video/hero.webm"

echo "Extracting poster frame…"
ffmpeg -y -loglevel error -ss "$START" -i "$SRC" -frames:v 1 \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" -q:v 3 \
  "$ROOT/assets/img/hero-poster.jpg"

ls -lh "$ROOT/assets/video/hero.mp4" "$ROOT/assets/video/hero.webm" "$ROOT/assets/img/hero-poster.jpg"
echo "Done. Reload the site: the hero will fade from the canvas to the video."
