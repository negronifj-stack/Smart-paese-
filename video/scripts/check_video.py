#!/usr/bin/env python3
"""Contrôle du fichier final : format, durée, synchronisation image/son, fluidité.
La fluidité est vérifiée image par image : une image identique à la précédente (gel) ou un saut
en dehors des coupes prévues par le découpage est signalé."""
import json, subprocess, sys
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parent.parent
src = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "out" / "smart-paese-film.mp4")
TL = json.loads((ROOT / "build" / "timeline.json").read_text(encoding="utf-8"))
SHOTS = json.loads((ROOT / "build" / "shots.json").read_text(encoding="utf-8"))
INTRO = float(json.loads((ROOT / "narration.json").read_text(encoding="utf-8")).get("intro", 0))
TL["duration"] += INTRO
for s_ in SHOTS: s_["start"] += INTRO
SHOTS.insert(0, {"id": "ouverture", "start": INTRO, "xf": 0})     # raccord au noir entre l'ouverture et le film
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", src], capture_output=True, text=True, check=True).stdout)
v = next(s for s in info["streams"] if s["codec_type"] == "video"); a = next(s for s in info["streams"] if s["codec_type"] == "audio")
size = int(info["format"]["size"]) / 1e6
print(f"vidéo : {v['codec_name']} {v['width']}×{v['height']}, {v['r_frame_rate']} i/s, {v['nb_frames']} images, {float(v['duration']):.2f} s")
print(f"son   : {a['codec_name']} {a['sample_rate']} Hz, {a['channels']} canaux, {float(a['duration']):.2f} s")
print(f"fichier : {size:.1f} Mo, {float(info['format']['bit_rate']) / 1e6:.2f} Mbit/s ; écart image/son : {abs(float(v['duration']) - float(a['duration'])) * 1000:.0f} ms")
ok = v["width"] == 1920 and v["height"] == 1080 and abs(float(v["duration"]) - TL["duration"]) < .1 and abs(float(v["duration"]) - float(a["duration"])) < .1
W, H = 320, 180
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2)); fps = TL["fps"]; tt = (np.arange(len(d)) + 1) / fps
cuts = [s["start"] for s in SHOTS if s["xf"] == 0 and s["start"] > 0]
lum = fr.mean(axis=(1, 2))
frozen = [t for t, x, l in zip(tt, d, lum[1:]) if x < .02 and l > 6]
med = np.median(d); jumps = [(t, x) for t, x in zip(tt, d) if x > max(8 * med, 6) and not any(abs(t - c) < 1.5 / fps for c in cuts)]
print(f"fluidité : variation médiane entre images {med:.2f}/255 ; {len(frozen)} image(s) gelée(s) ; {len(jumps)} saut(s) hors coupes prévues ({len(cuts)} coupes franches, {sum(1 for s in SHOTS if s['xf'] > 0)} fondus)")
for t, x in jumps[:12]: print(f"  saut à {t:.2f} s (variation {x:.1f})")
for t in frozen[:12]: print(f"  gel à {t:.2f} s")
print("luminance moyenne : début %.0f, milieu %.0f, fin %.0f (fondus d'entrée et de sortie)" % (lum[0], lum[len(lum) // 2], lum[-1]))
sys.exit(0 if ok and not frozen and not jumps else 1)
