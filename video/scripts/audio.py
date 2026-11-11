#!/usr/bin/env python3
"""Bande-son du film : voix off + ambiance sobre, entièrement synthétisée (aucun échantillon externe).

  - nappe harmonique lente, un accord par séquence (plus sombre sur les vulnérabilités et la coupure,
    résolue en ré majeur sur la conclusion) ;
  - quelques notes de piano feutré, très en retrait, dans une réverbération longue ;
  - air de montagne (bruit filtré) sur les extérieurs, eau sur les plans du torrent et de la turbine,
    crépitement lointain sur le départ de feu, chute de tension à l'instant de la coupure ;
  - la musique s'efface automatiquement sous la voix.

Entrées : build/timeline.json, build/shots.json, build/voice/*.wav. Sortie : build/audio.wav (48 kHz stéréo).
"""
import json, wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
SR = 48000
rng = np.random.default_rng(2026)

TL = json.loads((BUILD / "timeline.json").read_text(encoding="utf-8"))
SHOTS = json.loads((BUILD / "shots.json").read_text(encoding="utf-8"))
DUR = TL["duration"]; N = int(DUR * SR); t = np.arange(N) / SR
shot = {s["id"]: s for s in SHOTS}
seq_start = {s["seq"]: s["start"] for s in SHOTS if s.get("seq")}
TITLE = TL["sentences"][-1]["end"] + 1.0


def band(x, lo, hi, order=2):
    if lo and hi: sos = butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    elif lo: sos = butter(order, lo, btype="high", fs=SR, output="sos")
    else: sos = butter(order, hi, btype="low", fs=SR, output="sos")
    return sosfilt(sos, x)


def env(t0, t1, a=1.0, r=1.0):
    """Enveloppe 0→1→0 entre t0 et t1 avec attaque et relâchement en demi-cosinus."""
    e = np.clip((t - t0) / a, 0, 1) * np.clip((t1 - t) / r, 0, 1)
    return 0.5 - 0.5 * np.cos(np.pi * e)


def note(name):
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    return 440.0 * 2 ** ((names[name[:-1]] + 12 * (int(name[-1]) + 1) - 69) / 12)


# ---------- nappe ----------
CHORDS = [  # (début, accord, notes de piano possibles)
    (0.0,                ["B1", "F#2", "B2", "D3", "F#3"],        ["F#4", "B4", "D5", "A4"]),
    (seq_start[2] - 1.0, ["G1", "D2", "G2", "A2", "B2", "D3"],    ["B4", "D5", "A4", "G4"]),
    (seq_start[3] - 1.0, ["D2", "A2", "D3", "E3", "F#3"],         ["A4", "E5", "F#4", "D5"]),
    (shot["3-batterie"]["start"], ["A1", "E2", "A2", "B2", "E3"], ["E4", "B4", "C#5", "A4"]),
    (seq_start[4] - 1.0, ["B1", "F#2", "B2", "C#3", "D3"],        ["F#4", "C#5", "B4"]),
    (shot["4-72h"]["start"], ["G1", "D2", "G2", "B2", "D3"],      ["D5", "B4", "G4"]),
    (seq_start[5] - 1.0, ["E2", "B2", "E3", "G3", "A3"],          ["B4", "E5", "G4", "A4"]),
    (shot["5-agriculture"]["start"], ["A1", "E2", "A2", "C#3", "E3"], ["E5", "C#5", "A4"]),
    (seq_start[6] - 1.0, ["D2", "A2", "D3", "F#3", "A3"],         ["F#4", "A4", "D5", "E5", "F#5"]),
]


def pad_voice(f, pan):
    L = np.zeros(N); R = np.zeros(N)
    for cents in (-5, 0, 6):
        ff = f * 2 ** (cents / 1200)
        for h, amp in ((1, 1.0), (2, .42), (3, .2), (4, .09), (5, .04)):
            ph = rng.uniform(0, 2 * np.pi); lfo = 1 + .18 * np.sin(2 * np.pi * rng.uniform(.05, .13) * t + rng.uniform(0, 6))
            s = amp * lfo * np.sin(2 * np.pi * ff * h * t + ph)
            p = np.clip(pan + cents / 30, -1, 1)
            L += s * (1 - p) / 2; R += s * (1 + p) / 2
    return L, R


padL = np.zeros(N); padR = np.zeros(N); cache = {}
for i, (t0, names, _) in enumerate(CHORDS):
    t1 = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else DUR
    e = env(t0 - 1.8, t1 + 1.8, 3.6, 3.6)
    for j, nm in enumerate(names):
        if nm not in cache: cache[nm] = pad_voice(note(nm), (j / (len(names) - 1) - .5) * 1.2)
        g = (1.0 if j == 0 else .6) / len(names)
        padL += cache[nm][0] * e * g; padR += cache[nm][1] * e * g
padL = band(padL, 35, 2600); padR = band(padR, 35, 2600)

# ---------- piano feutré ----------
pno = np.zeros(N)
for i, (t0, _, notes) in enumerate(CHORDS):
    t1 = min(CHORDS[i + 1][0] if i + 1 < len(CHORDS) else TITLE + 5.0, DUR - 3)
    k = 0; tt = t0 + 1.6
    while tt < t1 - 1.0:
        if tt > 1.5 and rng.random() > .22:
            f = note(notes[k % len(notes)]); n0 = int(tt * SR); L = min(int(4.5 * SR), N - n0); x = np.arange(L) / SR
            v = rng.uniform(.55, 1.0)
            tone = sum(a * np.exp(-x / d) * np.sin(2 * np.pi * f * h * x) for h, a, d in ((1, 1, 1.5), (2, .32, .9), (3, .1, .5), (4, .03, .3)))
            pno[n0:n0 + L] += v * tone * np.clip(x / .012, 0, 1)
            k += 1 + int(rng.integers(0, 2))
        tt += rng.choice([2.4, 2.4, 3.2, 1.6])
pno = band(pno, 120, 3200)

# réverbération : réponse impulsionnelle de bruit décroissant, décorrélée entre les deux canaux
def ir(T, seed):
    r = np.random.default_rng(seed); n = int(T * SR); x = np.arange(n) / SR
    return band(r.standard_normal(n) * np.exp(-x * 6.9 / T), 150, 5000) * np.clip(x / .01, 0, 1)
pL = pno * .45 + fftconvolve(pno, ir(3.2, 1))[:N] * .06; pR = pno * .45 + fftconvolve(pno, ir(3.2, 2))[:N] * .06

# ---------- ambiances ----------
def noise():
    return rng.standard_normal(N)

outdoor = np.zeros(N)
for s in SHOTS:
    outdoor += env(s["start"] - .5, s["end"] + .5, 1.0, 1.0) * (.25 if s.get("studio") else 1.0)
outdoor = np.clip(outdoor, 0, 1)
gust = .6 + .4 * np.sin(2 * np.pi * .07 * t + 1) * np.sin(2 * np.pi * .023 * t)
windL = band(noise(), 180, 1400) * gust * outdoor; windR = band(noise(), 180, 1400) * np.roll(gust, SR) * outdoor

def spot(ids, lo, hi, level, a=1.2, r=1.2):
    e = np.zeros(N)
    for i in ids:
        e += env(shot[i]["start"] - .3, shot[i]["end"] + .3, a, r)
    e = np.clip(e, 0, 1) * level
    return band(noise(), lo, hi) * e, band(noise(), lo, hi) * e

waterL, waterR = spot(["3-torrent", "3-turbine"], 900, 6000, 1.0)
fire = shot["1-feu"]; fe = env(fire["start"], fire["end"] + .6, 1.5, 1.5)
crack = (rng.random(N) > .9993) * rng.uniform(.3, 1, N); crack = band(fftconvolve(crack, np.exp(-np.arange(400) / 60))[:N], 1200, 7000) * fe
rumble = band(noise(), 40, 160) * fe

cut = shot["4-coupure"]["start"] + 2.3        # instant où la ligne tombe
x = np.clip(t - cut, 0, None); on = (t >= cut) & (t < cut + 1.6)
drop = np.where(on, np.sin(2 * np.pi * (95 * x - 22 * x ** 2)) * np.exp(-x * 2.4), 0.0) + np.where(on, band(noise(), 60, 400), 0) * np.exp(-x * 9) * .6
hum = np.sin(2 * np.pi * 50 * t) * .5 + np.sin(2 * np.pi * 100 * t) * .3      # ronflement du réseau, qui s'arrête à la coupure
hum *= env(shot["4-coupure"]["start"], cut + .05, 1.2, .08)

swell = np.zeros(N)                            # souffle très discret aux changements de séquence
for n_, ts in seq_start.items():
    if n_ > 1: swell += np.clip((t - (ts - 1.3)) / 1.3, 0, 1) ** 2 * (t < ts) + np.exp(-np.clip(t - ts, 0, None) * 3.5) * (t >= ts)
swellS = band(noise(), 500, 4000) * swell

# ---------- voix ----------
voice = np.zeros(N)
for s in TL["sentences"]:
    with wave.open(str(BUILD / "voice" / (s["id"] + ".wav"))) as f:
        w = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    n0 = int(s["start"] * SR); voice[n0:n0 + len(w)] += w[:N - n0]
voice = band(voice, 75, None)
venv = np.sqrt(fftconvolve(voice ** 2, np.ones(int(.25 * SR)) / int(.25 * SR), mode="same").clip(0))
duck = 1 - .6 * np.clip(venv / (venv.max() * .25), 0, 1)
duck = fftconvolve(duck, np.ones(int(.4 * SR)) / int(.4 * SR), mode="same")

# ---------- mixage ----------
def rms(x): return np.sqrt(np.mean(x ** 2)) + 1e-12
def lvl(x, db): return x / rms(x[np.abs(x) > 1e-5] if np.any(np.abs(x) > 1e-5) else x) * 10 ** (db / 20)

music_gain = 1 + .7 * env(-2, TL["sentences"][0]["start"] + .5, .5, 1.5) + .9 * env(TITLE - .5, DUR + 3, 2.0, 1.0)   # plus présente sur l'ouverture et le titre
bedL = (lvl(padL, -30) + lvl(pL, -33)) * music_gain; bedR = (lvl(padR, -30) + lvl(pR, -33)) * music_gain
fxL = lvl(windL, -40) + lvl(waterL, -47) + lvl(crack, -44) + lvl(rumble, -44) + lvl(drop, -40) + lvl(hum, -52) + lvl(swellS, -47)
fxR = lvl(windR, -40) + lvl(waterR, -47) + lvl(np.roll(crack, 211), -44) + lvl(rumble, -44) + lvl(drop, -40) + lvl(hum, -52) + lvl(swellS, -47)
v = lvl(voice, -20)
L = v + (bedL + fxL) * duck; R = v + (bedR + fxR) * duck
fade = np.clip(t / 1.2, 0, 1) * np.clip((DUR - t) / 1.6, 0, 1)
mix = np.stack([L, R], 1) * fade[:, None]
mix = np.tanh(mix / np.abs(mix).max() * 1.15) / np.tanh(1.15) * 10 ** (-1.0 / 20)
with wave.open(str(BUILD / "audio.wav"), "wb") as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mix * 32767).astype(np.int16).tobytes())
print(f"build/audio.wav : {DUR:.1f} s, crête {20 * np.log10(np.abs(mix).max()):.1f} dBFS, coupure à {cut:.2f} s, titre à {TITLE:.2f} s")
