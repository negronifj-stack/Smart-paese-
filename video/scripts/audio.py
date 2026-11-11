#!/usr/bin/env python3
"""Bande-son du film : voix off + ambiance sobre, entièrement synthétisée (aucun échantillon externe).

  - arpèges de cordes pincées, basse douce et nappe légère, à 76 à la noire : une grille par partie du film
    (pensive sur le territoire, dépouillée et mineure pendant la coupure, résolue en ré majeur sur la conclusion) ;
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
# Arpèges de cordes pincées (synthèse de Karplus-Strong), basse douce et nappe légère, 76 à la noire, en ré majeur.
# Une grille par partie du film : pensive sur le territoire, pleine sur le concept et l'énergie,
# dépouillée et mineure pendant la coupure, résolue sur la conclusion.
# Pour utiliser une musique enregistrée à la place : déposer un fichier WAV dans video/music/ (voir plus bas).
BEAT = 60 / 76; BAR = 4 * BEAT; M0 = 2.4                     # la musique entre avec la carte
CH = {"D": [50, 57, 62, 66, 69], "A": [45, 52, 57, 61, 64], "Bm": [47, 54, 59, 62, 66], "G": [43, 50, 55, 59, 62], "Em": [40, 47, 52, 55, 59], "F#m": [42, 49, 54, 57, 61]}
PARTS = [  # (début, grille, densité des arpèges, basse, octave haute)
    (0.0,                ["Bm", "G", "D", "A"],        .75, .6, 0),
    (seq_start[2] - 1.0, ["D", "A", "Bm", "G"],        1.0, 1.0, 0),
    (seq_start[3] - 1.0, ["D", "G", "Bm", "A"],        1.0, 1.0, 1),
    (seq_start[4] - 1.0, ["Bm", "Em", "G", "F#m"],     .5, .5, 0),
    (shot["4-72h"]["start"], ["G", "A", "Bm", "D"],    .75, .8, 0),
    (seq_start[5] - 1.0, ["G", "D", "Em", "A"],        1.0, 1.0, 1),
    (seq_start[6] - 1.0, ["D", "A", "Bm", "G"],        1.0, 1.0, 1),
]
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)

def pluck(m, dur, vel):
    """Corde pincée : bruit filtré injecté dans une ligne à retard bouclée (Karplus-Strong), accordée au centième."""
    from scipy.signal import lfilter
    f = hz(m); d = SR / f - .5; n = int(d); fr = d - n; g = .9965 - .0012 * (m - 45) / 30
    a = np.zeros(n + 3); a[0] = 1; a[n] = -g * .5 * (1 - fr); a[n + 1] = -g * .5; a[n + 2] = -g * .5 * fr
    x = np.zeros(int(dur * SR)); b = rng.uniform(-1, 1, n + 2)
    k = .35 + .5 * vel; b = lfilter([k], [1, -(1 - k)], b)       # attaque plus ou moins brillante selon la nuance
    x[:n + 2] = b - b.mean()
    return lfilter([1], a, x) * vel

mus = np.zeros((N, 2)); bass = np.zeros(N); PAT = [0, 2, 3, 4, 2, 3, 4, 3]
nbar = int((DUR - 6 - M0) / BAR); TITLE_BAR = int((TITLE - M0) / BAR)
for b in range(nbar + 1):
    tb = M0 + b * BAR; part = [p for p in PARTS if p[0] <= tb + .01][-1]; _, grid, dens, bs, hi = part
    name = grid[b % 4] if b < TITLE_BAR + 1 else "D"; ch = CH[name]
    for k in range(8):
        if dens <= .5 and k % 2: continue                        # coupure : une note par temps
        if dens < 1 and k in (5,) : continue
        tt = tb + k * BEAT / 2 + rng.uniform(-.006, .006); vel = (.9 if k % 4 == 0 else .62 if k % 2 == 0 else .5) * rng.uniform(.9, 1.05)
        m = ch[PAT[k]] + 12; n0 = int(tt * SR); w = pluck(m, 2.6, vel); L = min(len(w), N - n0)
        if L <= 0: continue
        pan = (.5 + .35 * np.sin(k * 1.9 + b)) ; mus[n0:n0 + L, 0] += w[:L] * (1 - pan); mus[n0:n0 + L, 1] += w[:L] * pan
        if hi and k in (2, 6) and b % 2 == 1:                    # réponse à l'octave, une mesure sur deux
            w = pluck(ch[(k // 2) % 3 + 2] + 24, 2.2, vel * .45); L = min(len(w), N - n0); mus[n0:n0 + L, 0] += w[:L] * .6; mus[n0:n0 + L, 1] += w[:L] * .4
    for beat, lv in ((0, 1.0), (2, .55 * (bs >= 1))):
        if lv <= 0: continue
        n0 = int((tb + beat * BEAT) * SR); L = min(int(1.6 * SR), N - n0); x = np.arange(L) / SR; f = hz(ch[0] - 12 if ch[0] > 45 else ch[0])
        bass[n0:n0 + L] += lv * bs * (np.sin(2 * np.pi * f * x) + .25 * np.sin(4 * np.pi * f * x)) * np.exp(-x / .7) * np.clip(x / .01, 0, 1)
mus[:, 0] = band(mus[:, 0], 90, 5200); mus[:, 1] = band(mus[:, 1], 90, 5200); bass = band(bass, 35, 300)

def ir(T, seed):
    r = np.random.default_rng(seed); n = int(T * SR); x = np.arange(n) / SR
    return band(r.standard_normal(n) * np.exp(-x * 6.9 / T), 200, 6000) * np.clip(x / .01, 0, 1)
pL = mus[:, 0] + fftconvolve(mus[:, 0], ir(2.2, 1))[:N] * .035; pR = mus[:, 1] + fftconvolve(mus[:, 1], ir(2.2, 2))[:N] * .035
pL += bass * .55 * (np.abs(pL).max() / (np.abs(bass).max() + 1e-9)); pR += bass * .55 * (np.abs(pR).max() / (np.abs(bass).max() + 1e-9))

def pad_voice(f, pan):
    L = np.zeros(N); R = np.zeros(N)
    for cents in (-5, 0, 6):
        ff = f * 2 ** (cents / 1200)
        for h, amp in ((1, 1.0), (2, .35), (3, .14), (4, .05)):
            s_ = amp * (1 + .15 * np.sin(2 * np.pi * rng.uniform(.05, .13) * t + rng.uniform(0, 6))) * np.sin(2 * np.pi * ff * h * t + rng.uniform(0, 6))
            p = np.clip(pan + cents / 30, -1, 1); L += s_ * (1 - p) / 2; R += s_ * (1 + p) / 2
    return L, R
padL = np.zeros(N); padR = np.zeros(N); cache = {}
for b in range(-1, nbar + 1):                                  # la nappe tient chaque accord, en dessous des arpèges
    tb = M0 + b * BAR; part = [p for p in PARTS if p[0] <= max(tb, 0) + .01][-1]; name = part[1][b % 4] if b < TITLE_BAR + 1 else "D"
    e = env(tb - .9, tb + BAR + .9, 1.8, 1.8)
    for j, m in enumerate(CH[name][:4]):
        if m not in cache: cache[m] = pad_voice(hz(m), (j / 3 - .5) * 1.1)
        padL += cache[m][0] * e / 4; padR += cache[m][1] * e / 4
padL = band(padL, 60, 2200); padR = band(padR, 60, 2200)

# musique enregistrée : si video/music/ contient un WAV (48 kHz, 16 bits), il remplace la musique de synthèse
ext = sorted((ROOT / "music").glob("*.wav")) if (ROOT / "music").exists() else []
if ext:
    with wave.open(str(ext[0])) as f:
        assert f.getframerate() == SR and f.getsampwidth() == 2, "musique : attendu 48 kHz, 16 bits"
        x = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).reshape(-1, f.getnchannels()).astype(np.float64) / 32768
    x = np.tile(x, (int(np.ceil(N / len(x))), 1))[:N]; pL = x[:, 0]; pR = x[:, -1]; padL = padR = np.zeros(N) + 1e-9
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
bedL = (lvl(padL, -38) + lvl(pL, -29)) * music_gain; bedR = (lvl(padR, -38) + lvl(pR, -29)) * music_gain
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
