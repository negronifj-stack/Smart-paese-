# Smart Paese — film institutionnel et scientifique

Film de présentation du dispositif Smart Paese, en Full HD (1920 × 1080, 25 images/s, 2 min 48),
avec voix off française, ambiance sonore et sous-titres. Il est produit à partir de l'artéfact HTML
Smart Paese : même scène 3D du village, mêmes ateliers 3D (pico-centrale, batterie, hydrogène, îlotage),
même modèle énergétique horaire.

## Livrables

| Fichier | Contenu |
| --- | --- |
| `out/smart-paese-film.mp4` | Le film : H.264 1080p, son AAC stéréo 48 kHz, sous-titres incrustés |
| `out/narration.md` | Texte complet de la narration, par séquence |
| `out/smart-paese-film.srt`, `out/smart-paese-film.vtt` | Sous-titres synchronisés |
| `narration.json`, `film/`, `scripts/` | Sources : tout le film se régénère à partir d'elles |

## L'ouverture et les six séquences

0. **Ouverture** (19 s, sans voix) — logo du Syndicat départemental d'énergie de Haute-Corse, puis carte de la Haute-Corse
   où s'allument les politiques du projet de mandature (éclairage public LED par tranches, stations de recharge, projets
   solaires de la SEM), dans un zoom continu qui plonge sur le village pilote, en Castagniccia, et s'enchaîne en fondu
   avec la vue 3D du village (la caméra 3D prolonge la plongée). Contours, sites et chiffres viennent de
   l'artéfact « Projet de mandature » (`../artifact-mandature/data/`) ; l'atlas les donne comme illustratifs, et l'écran le dit.

1. **Le territoire et ses vulnérabilités** — vue aérienne du village, ligne électrique unique, départ de feu, coupure d'hiver.
2. **Le concept Smart Paese** — les équipements s'installent un à un, puis leurs interconnexions apparaissent.
3. **L'énergie** — toits et ombrière photovoltaïques, conduite forcée et roue Pelton, batterie et réserve de sécurité, hydrogène (tranche conditionnelle), pilotage sur une journée simulée.
4. **La résilience face aux crises** — interruption de la ligne, fonctionnement normal puis dégradé (séquence d'îlotage), équipements prioritaires, objectif de 72 heures.
5. **Données, IA, infrastructures connectées** — vigie et capteurs, réseau radio, suivi des consommations, jumeau numérique et pilotage prédictif, eau, agriculture, recharge.
6. **Une plateforme de recherche reproductible** — retour à la vue générale, titre de fin.

## Comment le film est fabriqué

Ce n'est ni une capture d'écran ni un diaporama : chaque image est calculée séparément.

- `film/film.html` charge Three.js r128 et les fichiers de l'artéfact (`../artifact/js/`) : `model.js`, `scene.js`, `studio.js`.
  `scene.js` est servi tel quel par le serveur de rendu, avec deux ajouts faits à la volée (voir `sceneForFilm` dans
  `scripts/render.mjs`) : un rendu désactivable et l'accès du réalisateur aux objets de la scène.
- `film/clock.js` remplace l'horloge du navigateur par une horloge virtuelle : le film avance d'une image à la fois,
  et le générateur aléatoire est à graine fixe. Deux rendus donnent exactement les mêmes images.
- `film/shots.js` est le découpage : 24 plans, chacun avec son état du village (heure, saison, coupure, flux issus du
  modèle horaire), sa caméra, ses annotations ancrées en 3D et ses panneaux de mesure.
- `film/director.js` exécute le découpage : caméra, lumière et brume de distance, fondus enchaînés, sous-titres, titre.
- `scripts/render.mjs` pilote Chromium (Playwright), capture chaque image et l'envoie à FFmpeg.
- `scripts/voice.py` synthétise la voix off phrase par phrase et en déduit le minutage : **c'est la voix qui cale le montage**.
- `film/intro.html` et `film/intro.js` dessinent l'ouverture (logo dans `film/assets/`, carte en 2D).
- `scripts/audio.py` synthétise la musique (arpèges de cordes tenues et piano feutré) et les ambiances (air, eau,
  coupure), puis les mixe sous la voix. Pour une musique enregistrée, déposer un WAV (48 kHz, 16 bits) dans `music/` : il
  remplace la musique de synthèse. `SP_MUSIC=aucune python3 scripts/audio.py` donne un mixage voix et ambiances seules.

Les grandeurs affichées (120 kWc, 200 kWh, 5 kW, charge critique de 6 kW, 97 % des coupures simulées tenues 72 heures)
sont lues dans le modèle de l'artéfact ou calculées par lui au moment du rendu. Elles sont présentées à l'image comme des
hypothèses et des résultats de simulation, pas comme des performances démontrées.

## Régénérer le film

Prérequis : Node 20+, Python 3.10+, FFmpeg, Playwright avec Chromium.

```bash
cd video
npm install
pip install kokoro-onnx soundfile scipy numpy          # voix et bande-son
mkdir -p models && cd models                           # modèle de voix (≈ 350 Mo, non versionné)
curl -LO https://huggingface.co/fastrtc/kokoro-onnx/resolve/main/kokoro-v1.0.onnx
curl -LO https://huggingface.co/fastrtc/kokoro-onnx/resolve/main/voices-v1.0.bin
cd .. && scripts/build.sh
```

Le rendu de l'image prend environ 1 s par image sans carte graphique (un peu plus d'une heure pour le film).
Il est fait par tranches de 5 s conservées dans `build/parts/` : après une retouche, seules les tranches concernées sont refaites.

| Pour modifier… | Fichier | Puis |
| --- | --- | --- |
| le texte dit, les sous-titres, la voix ou son débit | `narration.json` | `scripts/build.sh` (le minutage change : toute l'image est refaite) |
| un cadrage, une annotation, un panneau | `film/shots.js` | `scripts/build.sh --redo 35-52` (intervalle en secondes) |
| la lumière, la brume, l'habillage | `film/director.js`, `film/film.css` | `scripts/build.sh --redo all` |
| la musique et le mixage | `scripts/audio.py` ou un WAV dans `music/` | `scripts/build.sh` (l'image n'est pas refaite) |
| une phrase de la voix, sans toucher au montage | `narration.json` | `python3 scripts/retake.py 2a 6a`, puis `scripts/build.sh --redo` sur les secondes concernées |
| l'ouverture (logo, carte, durée) | `film/intro.js`, `"intro"` dans `narration.json` | `scripts/build.sh` |

Outils de mise au point :

```bash
node scripts/render.mjs --contact --at 0.25,0.8     # deux images par plan → build/stills/
node scripts/render.mjs --stills 12,48.5            # images à des instants donnés
node scripts/render.mjs --from 30 --to 40 --out build/extrait.mp4
node scripts/render.mjs --no-subs                   # version sans sous-titres incrustés
python3 scripts/check_video.py                      # format, synchronisation, fluidité
python3 scripts/check_audio.py                      # niveaux, intelligibilité, calage des sous-titres (pip install faster-whisper)
```

Une autre voix : dans `narration.json`, `"voice": {"engine": "piper", "name": "fr_FR-tom-medium"}` (voix masculine,
modèle sur `huggingface.co/rhasspy/piper-voices`, `pip install piper-tts`). Pour une voix de comédien : déposer un
fichier WAV par phrase dans `build/voice/` (48 kHz, mono, 16 bits ; mêmes noms : `1a.wav`, `1b.wav`…) et indiquer
`"engine": "files"` ; le minutage, le montage et les sous-titres se recalent sur l'enregistrement.
