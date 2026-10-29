#!/usr/bin/env bash
# Cuts the 60s demo clip (Example 3, 36:44-37:44) from Thầy Nguyễn Phan Tiến's lecture
# into backend/assets/clips/. Needs yt-dlp and ffmpeg on PATH.
set -euo pipefail
cd "$(dirname "$0")/../backend/assets/clips"
yt-dlp --no-playlist \
  -f "bv*[height<=480][ext=mp4]+ba[ext=m4a]/b[height<=480]" \
  --download-sections "*36:44-37:44" --force-keyframes-at-cuts \
  --merge-output-format mp4 -o "tien-vecto12-ex3-60s.%(ext)s" \
  "https://www.youtube.com/watch?v=phvpqxLNTUQ"
