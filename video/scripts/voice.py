#!/usr/bin/env python3
"""Voix off : synthétise chaque phrase de narration.json, mesure sa durée, cale les sous-titres.

Sorties (dans build/) :
  voice/<id>.wav   une phrase par fichier, 48 kHz mono, silences de bord retirés
  timeline.json    instant de début et de fin de chaque phrase et de chaque sous-titre

Moteurs : Kokoro (voix ff_siwis, par défaut), Piper (fr_FR-tom-medium, fr_FR-siwis-medium...),
ou « files » : voix enregistrée par un comédien, un WAV 48 kHz mono 16 bits par phrase dans build/voice/.
Les modèles sont cherchés dans $SP_TTS_DIR (par défaut ./models).
  kokoro : kokoro-v1.0.onnx + voices-v1.0.bin   (huggingface.co/fastrtc/kokoro-onnx)
  piper  : <voix>.onnx + <voix>.onnx.json       (huggingface.co/rhasspy/piper-voices)
"""
import json, os, sys, wave, subprocess, hashlib
from pathlib import Path
import numpy as np
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
VOICE = BUILD / "voice"
MODELS = Path(os.environ.get("SP_TTS_DIR", ROOT / "models"))
SR = 48000


def synth_kokoro(texts, cfg):
    from kokoro_onnx import Kokoro
    k = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    out = []
    import re
    for t in texts:
        # Le texte est d'abord converti en phonèmes, puis corrigé : le phonémiseur ajoute des liaisons fautives
        # (« capteurs‿et », « intelligent‿arbitre », « consommations‿alimentent ») qui trahissent la voix de synthèse.
        ph = k.tokenizer.phonemize(t, cfg.get("lang", "fr-fr"))
        ph = re.sub(r"(\S)z e ", r"\1 e ", ph)                 # jamais de liaison devant « et »
        for a, b in cfg.get("phonemes", []): ph = ph.replace(a, b)
        s, sr = k.create(ph, voice=cfg["name"], speed=cfg.get("speed", 1.0), lang=cfg.get("lang", "fr-fr"), is_phonemes=True)
        out.append(resample_poly(np.asarray(s, dtype=np.float64), SR, sr))
    return out


def synth_piper(texts, cfg):
    out = []
    model = MODELS / (cfg["name"] + ".onnx")
    for i, t in enumerate(texts):
        tmp = VOICE / "_piper.wav"
        subprocess.run([sys.executable, "-m", "piper", "-m", str(model), "-f", str(tmp),
                        "--length-scale", str(1.0 / cfg.get("speed", 1.0)), "--", t], check=True, capture_output=True)
        with wave.open(str(tmp)) as w:
            sr = w.getframerate()
            s = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        tmp.unlink()
        out.append(resample_poly(s, SR, sr))
    return out


def envelope(s, win=0.02):
    n = int(SR * win)
    pad = np.pad(s ** 2, (n // 2, n - n // 2 - 1), mode="edge")
    return np.sqrt(np.convolve(pad, np.ones(n) / n, mode="valid"))


def trim(s):
    """Retire les silences de bord, garde 60 ms de garde, applique un fondu de 8 ms."""
    env = envelope(s)
    idx = np.where(env > env.max() * 0.02)[0]
    a = max(0, idx[0] - int(0.06 * SR)); b = min(len(s), idx[-1] + int(0.10 * SR))
    s = s[a:b].copy()
    f = int(0.008 * SR); ramp = np.linspace(0, 1, f)
    s[:f] *= ramp; s[-f:] *= ramp[::-1]
    return s


def cue_bounds(s, subs):
    """Découpe la phrase en sous-titres : estimation au prorata des caractères,
    puis recalage sur le creux d'énergie le plus proche (la respiration de la voix)."""
    dur = len(s) / SR
    if len(subs) == 1:
        return [(0.0, dur)]
    weights = [len(x.replace("\n", " ")) for x in subs]
    total = float(sum(weights)); env = envelope(s, 0.03); cuts = []; acc = 0
    for w in weights[:-1]:
        acc += w
        guess = acc / total * dur
        lo = int(max(0.15, guess - 0.7) * SR); hi = int(min(dur - 0.15, guess + 0.7) * SR)
        seg = env[lo:hi]
        # pénalise l'éloignement de l'estimation pour ne pas sauter au mauvais silence
        pen = seg / (env.max() + 1e-9) + 0.12 * np.abs(np.arange(lo, hi) / SR - guess)
        cuts.append((lo + int(np.argmin(pen))) / SR)
    edges = [0.0] + cuts + [dur]
    return [(edges[i], edges[i + 1]) for i in range(len(subs))]


def main():
    VOICE.mkdir(parents=True, exist_ok=True)
    nar = json.loads((ROOT / "narration.json").read_text(encoding="utf-8"))
    cfg = nar["voice"]
    sents = nar["sentences"]
    for s in sents:
        assert "".join(x.replace("\n", " ") + " " for x in s["subs"]).strip() == s["text"], "sous-titres ≠ phrase : " + s["id"]
    texts = [s.get("tts", s["text"]) for s in sents]
    key = hashlib.sha1(json.dumps([cfg, texts], ensure_ascii=False).encode()).hexdigest()
    stamp = VOICE / "_key"
    if cfg["engine"] == "files":      # voix enregistrée : un WAV mono par phrase, déposé dans build/voice/ (1a.wav, 1b.wav…)
        missing = [s["id"] for s in sents if not (VOICE / (s["id"] + ".wav")).exists()]
        assert not missing, "fichiers de voix manquants dans build/voice/ : " + ", ".join(missing)
    elif not (stamp.exists() and stamp.read_text() == key and all((VOICE / (s["id"] + ".wav")).exists() for s in sents)):
        waves = (synth_piper if cfg["engine"] == "piper" else synth_kokoro)(texts, cfg)
        peak = max(np.abs(w).max() for w in waves)
        for s, w in zip(sents, waves):
            w = trim(w / peak * 0.89)
            with wave.open(str(VOICE / (s["id"] + ".wav")), "wb") as f:
                f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
                f.writeframes((np.clip(w, -1, 1) * 32767).astype(np.int16).tobytes())
        stamp.write_text(key)

    t = float(nar["lead"]); tl = {"fps": 25, "sentences": [], "cues": [], "sequences": []}
    for s in sents:
        with wave.open(str(VOICE / (s["id"] + ".wav"))) as f:
            assert f.getframerate() == SR and f.getnchannels() == 1 and f.getsampwidth() == 2, s["id"] + ".wav : attendu 48 kHz, mono, 16 bits"
            w = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        dur = len(w) / SR
        tl["sentences"].append({"id": s["id"], "seq": s["seq"], "start": round(t, 3), "end": round(t + dur, 3), "text": s["text"]})
        for (a, b), txt in zip(cue_bounds(w, s["subs"]), s["subs"]):
            tl["cues"].append({"start": round(t + a, 3), "end": round(t + b, 3), "text": txt, "sid": s["id"]})
        t += dur + float(s["gap"])
    # un sous-titre reste affiché jusqu'au suivant s'il le touche presque ; sinon il s'efface 0,25 s après la voix
    for i, c in enumerate(tl["cues"]):
        nxt = tl["cues"][i + 1]["start"] if i + 1 < len(tl["cues"]) else 1e9
        c["end"] = round(min(c["end"] + 0.25, nxt - 0.04) if nxt - c["end"] > 0.3 else nxt - 0.04, 3)
    last = tl["sentences"][-1]["end"]
    tl["duration"] = round(last + float(nar["tail"]), 2)
    for q in nar["sequences"]:
        ss = [x for x in tl["sentences"] if x["seq"] == q["n"]]
        tl["sequences"].append({"n": q["n"], "title": q["title"], "start": ss[0]["start"], "end": ss[-1]["end"]})
    (BUILD / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding="utf-8")
    words = sum(len(s["text"].split()) for s in sents)
    spoken = sum(x["end"] - x["start"] for x in tl["sentences"])
    print(f"{len(sents)} phrases, {words} mots, {spoken:.1f} s de voix ({words / spoken * 60:.0f} mots/min), film : {tl['duration']:.1f} s")
    for x in tl["sentences"]:
        print(f"  {x['id']}  {x['start']:7.2f} → {x['end']:7.2f}  ({x['end'] - x['start']:.2f} s)")


if __name__ == "__main__":
    main()
