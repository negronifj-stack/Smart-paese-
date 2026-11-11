#!/bin/bash
# Reconstruit le film de bout en bout : voix → découpage → image → bande-son → sous-titres → MP4 final.
# Usage : scripts/build.sh            (ne refait que les tranches d'image manquantes)
#         scripts/build.sh --redo all (refait toute l'image) · --redo 35-52 (refait un intervalle, en secondes)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build out
python3 scripts/voice.py                       # build/voice/*.wav, build/timeline.json
node scripts/render.mjs --shots                # build/shots.json
node scripts/render.mjs "$@"                   # build/picture.mp4
INTRO=$(python3 -c "import json;print(json.load(open('narration.json'))['intro'])")
node scripts/render.mjs --page intro.html --from 0 --to "$INTRO" --out build/intro.mp4   # logo du syndicat et zoom cartographique
printf "file 'intro.mp4'\nfile 'picture.mp4'\n" > build/film.txt
python3 scripts/audio.py                       # build/audio.wav
python3 scripts/subs.py                        # out/*.srt, out/*.vtt, out/narration.md
# build/picture.mp4 est un intermédiaire de haute qualité (≈ 25 Mbit/s) ; l'export final vise un fichier diffusable (< 100 Mo)
ffmpeg -y -loglevel error -f concat -safe 0 -i build/film.txt -i build/audio.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf "${CRF:-25}" -maxrate 6M -bufsize 12M -pix_fmt yuv420p -g 50 -bf 2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart \
  -metadata title="Smart Paese — Programme de recherche et d’expérimentation pour la résilience des territoires ruraux" \
  -metadata language=fre out/smart-paese-film.mp4
python3 scripts/check_video.py out/smart-paese-film.mp4
