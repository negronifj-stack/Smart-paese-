#!/usr/bin/env python3
"""Sous-titres et texte de narration, à partir de build/timeline.json et de narration.json.
Sorties : out/smart-paese-film.srt, out/smart-paese-film.vtt, out/narration.md"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"; OUT.mkdir(exist_ok=True)
TL = json.loads((ROOT / "build" / "timeline.json").read_text(encoding="utf-8"))
NAR = json.loads((ROOT / "narration.json").read_text(encoding="utf-8"))
INTRO = float(NAR.get("intro", 0))               # ouverture (logo, carte) placée avant le film : tout est décalé d'autant
for c in TL["cues"]: c["start"] += INTRO; c["end"] += INTRO
for q in TL["sequences"]: q["start"] += INTRO
TL["duration"] += INTRO


def tc(x, sep):
    ms = round(x * 1000); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"


srt = []; vtt = ["WEBVTT", ""]
for i, c in enumerate(TL["cues"], 1):
    srt += [str(i), f"{tc(c['start'], ',')} --> {tc(c['end'], ',')}", c["text"], ""]
    vtt += [f"{tc(c['start'], '.')} --> {tc(c['end'], '.')}", c["text"], ""]
(OUT / "smart-paese-film.srt").write_text("\n".join(srt), encoding="utf-8")
(OUT / "smart-paese-film.vtt").write_text("\n".join(vtt), encoding="utf-8")

mmss = lambda x: f"{int(x // 60)}:{int(x % 60):02d}"
words = sum(len(s["text"].split()) for s in NAR["sentences"])
md = ["# Smart Paese — texte de la narration", "",
      f"Film institutionnel et scientifique · durée {mmss(TL['duration'])} · {words} mots · voix off en français.", "",
      "Les repères de temps indiquent le début de chaque séquence dans le film.", ""]
md += ["## Ouverture  ·  0:00", "", "*Sans voix : logo du Syndicat départemental d’énergie de Haute-Corse, puis zoom cartographique de la Méditerranée occidentale à la Haute-Corse et au village pilote.*", ""]
for q in TL["sequences"]:
    md += [f"## {q['n']}. {q['title']}  ·  {mmss(q['start'])}", ""]
    md += [" ".join(s["text"] for s in NAR["sentences"] if s["seq"] == q["n"]), ""]
md += ["## Titre de fin", "", "**SMART PAESE**  ", "Programme de recherche et d’expérimentation pour la résilience des territoires ruraux.", "",
       "---", "",
       "### Note sur les grandeurs citées à l’image", "",
       "Les valeurs affichées (120 kWc, 200 kWh, 5 kW, charge critique de 6 kW, tenue à 72 heures dans 97 % des coupures simulées) "
       "sont les hypothèses et les résultats du modèle horaire de l’artéfact Smart Paese, calculé sur un village type. "
       "Elles sont présentées comme telles dans le film et ne constituent pas des performances démontrées.", ""]
(OUT / "narration.md").write_text("\n".join(md), encoding="utf-8")
print(f"{len(TL['cues'])} sous-titres → out/smart-paese-film.srt, .vtt ; narration → out/narration.md")
