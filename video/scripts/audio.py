#!/usr/bin/env python3
"""Bande-son du film : voix off + ambiance sobre, entièrement synthétisée (aucun échantillon externe).

  - ensemble de cordes tenues et piano feutré, à 60 à la noire : une grille par partie du film
    (pensive sur le territoire, plus sombre et sans piano pendant la coupure, ample et résolue en ré majeur sur la conclusion) ;
  - une musique enregistrée peut la remplacer : il suffit de déposer un WAV dans video/music/ ;
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
INTRO = float(json.loads((ROOT / "narration.json").read_text(encoding="utf-8")).get("intro", 0))   # ouverture placée avant le film
for s_ in TL["sentences"]: s_["start"] += INTRO; s_["end"] += INTRO
for s_ in SHOTS: s_["start"] += INTRO; s_["end"] += INTRO
DUR = TL["duration"] + INTRO; N = int(DUR * SR); t = np.arange(N) / SR
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


# ---------- musique ----------
# Registre institutionnel : ensemble de cordes tenues à quatre voix et piano feutré, 60 à la noire, en ré majeur.
# Un accord toutes les deux mesures (8 s), enchaînés par mouvement conjoint ; le piano pose l'accord et une note
# de chant par mesure. Plus sombre et sans piano pendant la coupure, plus ample sur la conclusion.
# SP_MUSIC=aucune : voix et ambiances seules. Un WAV déposé dans video/music/ remplace la musique de synthèse.
import os
BAR = 4.0; M0 = 0.6
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
#          basse, ténor, alto, soprano          chant du piano (deux notes par accord)
VOI = {"D":    ([38, 57, 62, 66], [69, 74]),  "Bm":  ([35, 54, 62, 66], [71, 74]),
       "G":    ([31, 55, 62, 67], [71, 74]),  "A":   ([33, 57, 61, 64], [73, 76]),
       "Asus": ([33, 57, 62, 64], [74, 76]),  "Em":  ([40, 55, 59, 64], [67, 71]),
       "F#m":  ([42, 54, 61, 66], [69, 73]),  "D/F#": ([42, 57, 62, 66], [74, 78]),
       "Dfin": ([38, 57, 62, 69], [74, 78])}
PARTS = [  # (début, grille, piano, intensité des cordes)
    (0.0,                ["Bm", "G", "D", "Asus"],      .6, .8),
    (seq_start[2] - 1.0, ["D", "Bm", "G", "A"],         1.0, 1.0),
    (seq_start[3] - 1.0, ["D/F#", "G", "Bm", "Asus"],   1.0, 1.0),
    (seq_start[4] - 1.0, ["Bm", "Em", "G", "F#m"],      0.0, .85),
    (shot["4-72h"]["start"], ["G", "A", "Bm", "Asus"],  .7, .9),
    (seq_start[5] - 1.0, ["G", "D/F#", "Em", "A"],      1.0, 1.0),
    (seq_start[6] - 1.0, ["D", "A", "Bm", "G"],         1.0, 1.15),
]

def strings(m, dur, gain, pan):
    """Pupitre de cordes : cinq instruments légèrement désaccordés, vibrato retardé, attaque lente."""
    n = int(dur * SR); x = np.arange(n) / SR; L = np.zeros(n); R = np.zeros(n); f0 = hz(m)
    nh = int(min(14, 5200 / f0))
    for v in range(5):
        f = f0 * 2 ** (rng.uniform(-9, 9) / 1200); vib = 1 + .004 * np.clip((x - .5) / 1.2, 0, 1) * np.sin(2 * np.pi * rng.uniform(4.8, 5.8) * x + rng.uniform(0, 6))
        ph = 2 * np.pi * np.cumsum(f * vib) / SR; s_ = np.zeros(n)
        for h in range(1, nh + 1): s_ += np.sin(h * ph + rng.uniform(0, 6)) / h ** 1.25
        p = np.clip(pan + rng.uniform(-.25, .25), -1, 1); L += s_ * (1 - p) / 2; R += s_ * (1 + p) / 2
    e = np.clip(x / 1.1, 0, 1) ** 1.5 * np.clip((dur - x) / 1.3, 0, 1) * (1 + .06 * np.sin(2 * np.pi * .11 * x + rng.uniform(0, 6)))
    return L * e * gain, R * e * gain

def piano(m, dur, vel):
    n = int(dur * SR); x = np.arange(n) / SR; f = hz(m)
    return vel * sum(a * np.exp(-x / d) * np.sin(2 * np.pi * f * h * x) for h, a, d in ((1, 1, 2.2), (2, .3, 1.3), (3, .09, .7), (4, .03, .4))) * np.clip(x / .01, 0, 1)

strL = np.zeros(N); strR = np.zeros(N); pno = np.zeros(N)
def add(buf, n0, w):
    if n0 >= N: return
    L = min(len(w), N - n0); buf[n0:n0 + L] += w[:L]
nch = int((DUR - 5 - M0) / (2 * BAR)); TITLE_CH = int((TITLE - M0) / (2 * BAR))
for c in range(nch + 1):
    tc = M0 + c * 2 * BAR; part = [p for p in PARTS if p[0] <= tc + .01][-1]; _, grid, pn, inten = part
    name = grid[c % 4] if c <= TITLE_CH else "Dfin"; notes, chant = VOI[name]; last = c == nch
    hold = 2 * BAR + (4.0 if last else 1.2)
    for j, m in enumerate(notes):
        w = strings(m, hold, inten * (1.0 if j == 0 else .7), (-.7, -.25, .25, .7)[j]); add(strL, int(tc * SR), w[0]); add(strR, int(tc * SR), w[1])
    if c >= TITLE_CH - 1:                                      # conclusion : une octave grave de plus sous les cordes
        w = strings(notes[0] - 12 if notes[0] > 36 else notes[0] + 12, hold, .5, 0); add(strL, int(tc * SR), w[0]); add(strR, int(tc * SR), w[1])
    if pn > 0 and tc > 2.2:
        add(pno, int(tc * SR), piano(notes[0] + 12, 6, .8 * pn)); add(pno, int((tc + .02) * SR), piano(notes[2], 6, .5 * pn))
        add(pno, int((tc + 2.0) * SR), piano(chant[0], 5, .55 * pn)); add(pno, int((tc + BAR) * SR), piano(notes[1], 5, .45 * pn)); add(pno, int((tc + BAR + 2.0) * SR), piano(chant[1], 5, .6 * pn))
strL = band(strL, 45, 3800); strR = band(strR, 45, 3800); pno = band(pno, 70, 3000)

def ir(T, seed):
    r = np.random.default_rng(seed); n = int(T * SR); x = np.arange(n) / SR
    return band(r.standard_normal(n) * np.exp(-x * 6.9 / T), 200, 6000) * np.clip(x / .01, 0, 1)
k1 = ir(2.8, 1); k2 = ir(2.8, 2)
pk = np.abs(strL).max()
pL = strL + fftconvolve(strL, k1)[:N] * .03 + (pno * .55 + fftconvolve(pno, k1)[:N] * .03) * pk * .5 / np.abs(pno).max()
pR = strR + fftconvolve(strR, k2)[:N] * .03 + (pno * .45 + fftconvolve(pno, k2)[:N] * .03) * pk * .5 / np.abs(pno).max()
padL = padR = np.zeros(N) + 1e-9
if os.environ.get("SP_MUSIC") == "aucune": pL = pR = np.zeros(N) + 1e-9

# musique enregistrée : si video/music/ contient un WAV (48 kHz, 16 bits), il remplace la musique de synthèse
ext = sorted((ROOT / "music").glob("*.wav")) if (ROOT / "music").exists() else []
if ext:
    with wave.open(str(ext[0])) as f:
        assert f.getframerate() == SR and f.getsampwidth() == 2, "musique : attendu 48 kHz, 16 bits"
        x = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).reshape(-1, f.getnchannels()).astype(np.float64) / 32768
    x = np.tile(x, (int(np.ceil(N / len(x))), 1))[:N]; pL = x[:, 0]; pR = x[:, -1]
    print("musique :", ext[0].name)

# ---------- ambiances ----------
def noise():
    return rng.standard_normal(N)

outdoor = np.zeros(N)                         # pas d'air de montagne sur le logo et la carte
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

music_gain = 1 + .8 * env(-2, TL["sentences"][0]["start"] + .5, .5, 1.5) + .9 * env(TITLE - .5, DUR + 3, 2.0, 1.0)   # plus présente sur l'ouverture et le titre
bedL = lvl(pL, -29) * music_gain if np.abs(pL).max() > 1e-6 else pL; bedR = lvl(pR, -29) * music_gain if np.abs(pR).max() > 1e-6 else pR
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
