#!/usr/bin/env bash
# Prepare the edited class masters for Bunny Stream.
#
# The masters are ProRes 422 at 4K 10-bit — around 560 Mbps, so a 22-minute class
# is ~90GB. That is a mastering codec, not a delivery one: Bunny re-transcodes to
# its own HLS ladder on ingest and discards the rest, so uploading ProRes buys
# nothing and costs a full day of upload time per class.
#
# Output is 1080p H.264. Deliberately not 4K: Bunny bandwidth is metered and 4K
# costs roughly 4x per view, for footage that is a locked-off camera, slow
# movement and a plain cream wall. Keep the 4K masters on D: for re-grades.
#
# Encoder settings match scripts/process_class.py in the edit-class skill
# (libx264, CRF 20, preset medium, +faststart) so anything graded through that
# pipeline and anything converted here look like the same channel.
#
#   bash scripts/prepare-bunny.sh
#
set -uo pipefail

SRC="/d/Yoga for Runners/Final Videos"
OUT="/c/yin-site/processed_videos"
mkdir -p "$OUT"

# master filename :: output slug (named for the practice it belongs to, so the
# Bunny upload is unambiguous)
MAP="
Yoga for Runners - Hams & Glutes (Final).mov::hamstrings-glutes
Yoga for Runners - hips & flexors.mov::hips-hip-flexors
Yoga for Runners - Full Body Reset.mov::express-reset
"
# "Full Body Reset" is the master of the class already free on YouTube as the
# Post-Run Reset. It goes to Bunny anyway so MEMBERS get the clean player on
# /practices/express-reset, while the free page keeps the YouTube embed.

echo "$MAP" | while IFS= read -r line; do
  [ -z "$line" ] && continue
  file="${line%%::*}"
  slug="${line##*::}"
  in="$SRC/$file"
  out="$OUT/$slug-1080p.mp4"

  if [ ! -f "$in" ]; then echo "!! missing: $file"; continue; fi
  if [ -f "$out" ]; then echo "-- exists, skipping: $slug"; continue; fi

  echo ">> $slug  <-  $file"
  # lanczos for the 4K->1080p downscale (sharper than bilinear on fine detail
  # like the mat weave); bt709 tags carried through so the grade doesn't shift.
  ffmpeg -hide_banner -loglevel error -stats -y -i "$in" \
    -vf "scale=-2:1080:flags=lanczos" \
    -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -c:a aac -b:a 192k -ac 2 \
    -movflags +faststart \
    "$out"

  if [ -f "$out" ]; then
    echo "   done: $(du -h "$out" | cut -f1)"
  else
    echo "   FAILED: $slug"
  fi
done

echo
echo "=== ready to upload ==="
ls -la "$OUT" 2>/dev/null
