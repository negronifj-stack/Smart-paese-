#!/usr/bin/env python3
"""Reprise de voix sans toucher au montage : resynthétise certaines phrases de narration.json et les loge
dans le créneau qu'elles occupaient déjà. Le minutage des autres phrases, donc l'image déjà rendue, ne bouge pas.

  python3 scripts/retake.py 2a 6a

Des phrases consécutives citées ensemble (2a 2b) sont replacées l'une après l'autre : la première peut s'allonger,
la suivante se décale, tant que la dernière tient avant la phrase suivante non reprise.
Si la nouvelle phrase est plus longue que son créneau (phrase + silence qui la suit), le débit est relevé
par petits pas, jusqu'à +12 % ; au-delà le script s'arrête : il faut raccourcir le texte ou refaire le minutage
complet (scripts/build.sh). Le texte et les sous-titres de la phrase sont mis à jour dans build/timeline.json."""
import json, sys, wave
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
import voice as V

ids = sys.argv[1:]
nar = json.loads((V.ROOT / "narration.json").read_text(encoding="utf-8"))
tl = json.loads((V.BUILD / "timeline.json").read_text(encoding="utf-8"))
ref = max(np.abs(np.frombuffer(wave.open(str(V.VOICE / (s["id"] + ".wav"))).readframes(10 ** 9), dtype=np.int16)).max() for s in nar["sentences"] if s["id"] not in ids) / 32768
for sid in ids:
    s = next(x for x in nar["sentences"] if x["id"] == sid); i = next(k for k, x in enumerate(tl["sentences"]) if x["id"] == sid); t = tl["sentences"][i]
    nxt = tl["sentences"][i + 1]["start"] if i + 1 < len(tl["sentences"]) else t["end"] + 2
    if i > 0 and tl["sentences"][i - 1]["id"] in ids:          # la phrase précédente vient d'être reprise : on se place juste après elle
        t["start"] = round(max(t["start"], tl["sentences"][i - 1]["end"] + .4), 3)
    chain = i + 1 < len(tl["sentences"]) and tl["sentences"][i + 1]["id"] in ids    # la suivante sera reprise aussi : elle se décalera
    room = (1e9 if chain else nxt - t["start"] - (0.22 if tl["sentences"][i + 1]["seq"] == t["seq"] else 0.8))
    assert "".join(x.replace("\n", " ") + " " for x in s["subs"]).strip() == s["text"], "sous-titres ≠ phrase : " + sid
    for k in range(7):
        cfg = dict(nar["voice"]); cfg["speed"] = cfg.get("speed", 1.0) * (1 + .02 * k)
        w = V.trim((V.synth_piper if cfg["engine"] == "piper" else V.synth_kokoro)([s.get("tts", s["text"])], cfg)[0])
        if len(w) / V.SR <= room: break
    else: sys.exit(f"{sid} : {len(w) / V.SR:.2f} s pour un créneau de {room:.2f} s — raccourcir le texte")
    w = w / np.abs(w).max() * ref
    with wave.open(str(V.VOICE / (sid + ".wav")), "wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(V.SR); f.writeframes((np.clip(w, -1, 1) * 32767).astype(np.int16).tobytes())
    dur = len(w) / V.SR; t["end"] = round(t["start"] + dur, 3); t["text"] = s["text"]
    first = next(k for k, c in enumerate(tl["cues"]) if c["sid"] == sid); old = [c for c in tl["cues"] if c["sid"] == sid]
    new = [{"start": round(t["start"] + a, 3), "end": round(min(t["start"] + b + .25, (1e9 if chain else nxt) - .04), 3), "text": txt, "sid": sid} for (a, b), txt in zip(V.cue_bounds(w, s["subs"]), s["subs"])]
    for a, b in zip(new, new[1:]): a["end"] = round(b["start"] - .04, 3)
    tl["cues"][first:first + len(old)] = new
    print(f"{sid} : {dur:.2f} s (créneau {room:.2f} s), débit ×{1 + .02 * k:.2f} — « {s['text']} »")
(V.BUILD / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding="utf-8")
