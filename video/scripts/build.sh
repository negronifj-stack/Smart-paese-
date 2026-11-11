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
XF=$(python3 -c "import json;print(json.load(open('narration.json'))['intro_xf'])")
END=$(python3 -c "print($INTRO + $XF)")
node scripts/render.mjs --page intro.html --from 0 --to "$END" --out build/intro.mp4   # logo du syndicat, carte et zoom
python3 scripts/audio.py                       # build/audio.wav
python3 scripts/subs.py                        # out/*.srt, out/*.vtt, out/narration.md
# build/picture.mp4 est un intermédiaire de haute qualité (≈ 25 Mbit/s) ; l'export final vise un fichier diffusable (< 100 Mo).
# La fin de l'ouverture (plongée sur le village) et le début du film (vue 3D) sont enchaînés en fondu.
ffmpeg -y -loglevel error -i build/intro.mp4 -i build/picture.mp4 -i build/audio.wav \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=$XF:offset=$INTRO,format=yuv420p[v]" -map "[v]" -map 2:a \
  -c:v libx264 -preset slow -crf "${CRF:-25}" -maxrate 6M -bufsize 12M -pix_fmt yuv420p -g 50 -bf 2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart \
  -metadata title="Smart Paese — Programme de recherche et d’expérimentation pour la résilience des territoires ruraux" \
  -metadata language=fre out/smart-paese-film.mp4
python3 scripts/check_video.py out/smart-paese-film.mp4
