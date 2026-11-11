#!/usr/bin/env python3
"""Contrôle de la bande-son : niveaux, puis retranscription automatique (faster-whisper) du mixage final
pour vérifier que la voix reste intelligible sous la musique et que chaque sous-titre démarre avec la voix."""
import json, sys, wave, re, unicodedata
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "build" / "timeline.json").read_text(encoding="utf-8"))
INTRO = float(json.loads((ROOT / "narration.json").read_text(encoding="utf-8")).get("intro", 0))
for s_ in TL["sentences"]: s_["start"] += INTRO; s_["end"] += INTRO
for c_ in TL["cues"]: c_["start"] += INTRO; c_["end"] += INTRO
src = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "build" / "audio.wav")
with wave.open(src) as f:
    sr = f.getframerate(); x = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).reshape(-1, f.getnchannels()).astype(np.float64) / 32768
m = x.mean(1); db = lambda v: 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)
sp = np.zeros(len(m), bool)
for s in TL["sentences"]: sp[int(s["start"] * sr):int(s["end"] * sr)] = True
print(f"niveau pendant la voix : {db(m[sp]):.1f} dBFS ; entre les phrases (musique seule) : {db(m[~sp]):.1f} dBFS ; crête {20 * np.log10(np.abs(x).max()):.1f} dBFS")
from faster_whisper import WhisperModel
from scipy.signal import resample_poly
segs, _ = WhisperModel("small", device="cpu", compute_type="int8").transcribe(resample_poly(m, 16000, sr).astype(np.float32), language="fr", word_timestamps=True)
words = [w for s in segs for w in s.words]
norm = lambda s: re.sub(r"[^a-z0-9 ]", " ", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()).split()
heard = [(norm(w.word), w.start) for w in words]; heard = [(a[0], t) for a, t in heard if a]
ref = [w for s in TL["sentences"] for w in norm(s["text"])]
hs = [h for h, _ in heard]
import difflib
r = difflib.SequenceMatcher(None, ref, hs).ratio()
print(f"retranscription : {len(hs)} mots entendus pour {len(ref)} écrits, concordance {r * 100:.0f} %")
print("texte entendu :", " ".join(w.word.strip() for w in words))
# calage : on aligne le texte écrit et le texte entendu, puis on compare le début de chaque sous-titre
# à l'instant où son premier mot est réellement prononcé
ref = []; first = []
for c in TL["cues"]:
    first.append(len(ref)); ref += norm(c["text"])
mp = {}
for a, b, n in difflib.SequenceMatcher(None, ref, hs, autojunk=False).get_matching_blocks():
    for k in range(n): mp[a + k] = heard[b + k][1]
offs = np.array([mp[i] - c["start"] for i, c in zip(first, TL["cues"]) if i in mp])
print(f"calage des sous-titres ({len(offs)}/{len(TL['cues'])} repérés) : écart moyen {offs.mean() * 1000:+.0f} ms, écart maximal {np.abs(offs).max() * 1000:.0f} ms, {int((np.abs(offs) < .35).sum())} à moins de 350 ms")
for i, c in zip(first, TL["cues"]):
    if i in mp and abs(mp[i] - c["start"]) >= .35: print(f"  écart {mp[i] - c['start']:+.2f} s : {c['start']:.2f} « {c['text'][:40]} »")
