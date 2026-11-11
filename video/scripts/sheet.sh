#!/bin/bash
# Planche-contact : une vignette par image de build/stills → build/sheet_N.jpg
cd "$(dirname "$0")/../build/stills" && rm -f ../sheet_*.jpg
ls *.png | split -l ${1:-9} - /tmp/sheetlist_
n=0; for l in /tmp/sheetlist_*; do
  args=(); while read f; do args+=(-i "$f"); done < "$l"; c=$(wc -l < "$l")
  ffmpeg -y -loglevel error "${args[@]}" -filter_complex "$(for i in $(seq 0 $((c-1))); do printf "[%d:v]scale=640:360[v%d];" $i $i; done)$(for i in $(seq 0 $((c-1))); do printf "[v%d]" $i; done)xstack=inputs=$c:layout=$(python3 -c "print('|'.join(f'{(i%3)*640}_{(i//3)*360}' for i in range($c)))"):fill=black[o]" -map "[o]" -q:v 3 ../sheet_$n.jpg; n=$((n+1)); done; rm -f /tmp/sheetlist_*; ls ../sheet_*.jpg
