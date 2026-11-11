/* Smart Paese — découpage du film : 6 séquences, 23 plans.
   Chaque plan est calé sur la voix off (S("3b") = début de la phrase 3b, en secondes).
     at       instant de début du plan ; il dure jusqu'au plan suivant
     xf       durée du fondu enchaîné d'entrée (0 = coupe franche)
     state    état du village transmis à la scène de l'artéfact (heure, jour, coupure, flux du modèle)
     studio   atelier 3D de l'artéfact (hydro, batt, h2, ilot) ; st = son état
     cam      caméra : fonction de u (0→1 sur le plan)
     callouts annotations ancrées en 3D ; panel, badge, note : habillage
   Coordonnées du village : mairie (-8, 4), école (26, -14), campanile (-30, -20), batterie (-2, 23),
   ombrière (26, 36), hydrogène (52, 54), poste (-46, -30), turbine (-96, 44), vigie (-150, -36), ferme (150, 92). */
window.SHOTS = function (c) {
"use strict";
const { S, E, cue, g, X, M, SIM, RES, simAt, islandAt, lerp, clamp, sstep, ramp, fmt } = c;
const l3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const soft = u => u + (sstep(u) - u) * .35;                       // départ et arrivée à peine amortis
const orbit = o => u => { u = soft(u); const az = lerp(o.az[0], o.az[1], u) * Math.PI / 180, r = lerp(o.r[0], o.r[1], u), ce = o.c2 ? l3(o.c, o.c2, u) : o.c;
  return { p: [ce[0] + Math.cos(az) * r, ce[1] + lerp(o.h[0], o.h[1], u), ce[2] + Math.sin(az) * r], t: ce, fov: o.fov ? lerp(o.fov[0], o.fov[1], u) : 38 }; };
const move = o => u => { u = soft(u); return { p: l3(o.p[0], o.p[1], u), t: l3(o.t[0], o.t[1], u), fov: o.fov ? lerp(o.fov[0], o.fov[1], u) : 38 }; };
const ETE = 195, HIVER = 14;
const day = (d, clock, extra) => Object.assign({ day: d, clock: clock }, simAt(d, clock), extra || {});
const kw = (v, d) => fmt(v, d == null ? (v < 10 ? 1 : 0) : d) + "<small>kW</small>";

/* coupure d'hiver : la ligne tombe le 14 janvier à 16 h 30 ; trajectoire issue du modèle */
const CUT0 = 16.5, ISL = M.island(SIM, HIVER * 24 + 17, 96);
const cutState = x => { const v = islandAt(ISL, x); return { day: HIVER + Math.floor((CUT0 + x) / 24), clock: (CUT0 + x) % 24, cut: true, pv: v.pv, hyd: v.hyd, bat: v.bat, soc: v.soc, imp: 0, exp: 0 }; };

/* ---------- graphiques ---------- */
function canvas(el) { const cv = el.querySelector("canvas"); cv.width = 852; cv.height = 340; const q = cv.getContext("2d"); q.setTransform(2, 0, 0, 2, 0, 0); return q; }
function axes(q, W, H, L, R, T, B, top, unit, xl) {
  q.clearRect(0, 0, W, H); q.font = "12.5px 'IBM Plex Mono'"; q.fillStyle = "#a2a4a0"; q.strokeStyle = "rgba(255,255,255,.12)"; q.lineWidth = 1;
  [0, .5, 1].forEach(f => { const y = T + f * (H - T - B); q.beginPath(); q.moveTo(L, y); q.lineTo(W - R, y); q.stroke(); q.fillText(fmt(top * (1 - f)) + (f ? "" : " " + unit), 0, y + 4); });
  xl.forEach(a => q.fillText(a[1], a[0] - 10, H - 4));
}
function dayChart(q, d, hour) {
  const W = 426, H = 170, L = 44, R = 6, T = 10, B = 22, i0 = d * 24, top = 110, X0 = k => L + k / 24 * (W - L - R), Y = v => T + (1 - v / top) * (H - T - B);
  axes(q, W, H, L, R, T, B, top, "kW", [0, 6, 12, 18, 24].map(k => [Math.min(X0(k), W - 26), k + " h"]));
  const path = (key, map) => { q.beginPath(); for (let k = 0; k < 24; k++) { const px = X0(k + .5), py = map(SIM[key][i0 + k]); k ? q.lineTo(px, py) : q.moveTo(px, py); } };
  path("pv", Y); q.lineTo(X0(23.5), Y(0)); q.lineTo(X0(.5), Y(0)); q.closePath(); q.fillStyle = "rgba(249,178,61,.2)"; q.fill();
  path("pv", Y); q.strokeStyle = "#F9B23D"; q.lineWidth = 2.2; q.stroke();
  path("hyd", Y); q.strokeStyle = "#5fa8d6"; q.lineWidth = 2; q.stroke();
  path("load", Y); q.strokeStyle = "#ecece8"; q.lineWidth = 1.7; q.setLineDash([4, 4]); q.stroke(); q.setLineDash([]);
  path("soc", v => T + (1 - v) * (H - T - B)); q.strokeStyle = "#E9426C"; q.lineWidth = 2; q.stroke();
  q.strokeStyle = "#fff"; q.lineWidth = 1.2; q.beginPath(); q.moveTo(X0(hour), T - 4); q.lineTo(X0(hour), H - B); q.stroke();
}
function islandChart(q, x) {
  const W = 426, H = 170, L = 44, R = 8, T = 10, B = 22, X0 = k => L + k / 96 * (W - L - R), Y = v => T + (1 - v) * (H - T - B);
  axes(q, W, H, L, R, T, B, 100, "%", [0, 24, 48, 72, 96].map(k => [Math.min(X0(k), W - 34), "+" + k + " h"]));
  q.fillStyle = "rgba(255,255,255,.07)"; q.fillRect(X0(0), T, X0(72) - X0(0), H - T - B);
  q.strokeStyle = "rgba(255,255,255,.55)"; q.setLineDash([3, 4]); q.beginPath(); q.moveTo(X0(72), T - 2); q.lineTo(X0(72), H - B); q.stroke(); q.setLineDash([]);
  q.fillStyle = "#ecece8"; q.fillText("objectif 72 h", X0(72) - 98, T + 14);
  q.beginPath(); const n = Math.min(95, x); for (let k = 0; k <= Math.floor(n); k++) { const px = X0(k), py = Y(ISL.soc[k]); k ? q.lineTo(px, py) : q.moveTo(px, py); }
  q.lineTo(X0(n), Y(islandAt(ISL, n).soc)); q.strokeStyle = "#E9426C"; q.lineWidth = 2.4; q.stroke();
  q.fillStyle = "#fff"; q.beginPath(); q.arc(X0(n), Y(islandAt(ISL, n).soc), 4, 0, 6.3); q.fill();
}
const hhmm = t => { t = ((t % 24) + 24) % 24; const h = Math.floor(t), m = Math.floor((t - h) * 60); return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"); };

/* ---------- équipements qui s'installent (séquence 2) ---------- */
const rise = (obj, lt, t0) => { const k = sstep(ramp(lt, t0, t0 + 1.1)); obj.scale.setScalar(Math.max(.0001, k)); };
const N = X.N, tip = [X.antTip.position.x, X.antTip.position.y, X.antTip.position.z];
const cutP = [X.cutG.position.x, X.cutG.position.y + 4, X.cutG.position.z];
const PH = ["Marche normale", "Défaut sur la ligne", "Isolement du village", "Reformation du réseau", "Îlot stable", "Retour du réseau", "Reconnexion"];
const stepsPanel = ph => ({ in: .5,
  build(el) { el.innerHTML = "<h3>Séquence d’îlotage <span>principe</span></h3><div class='steps'>" + PH.map((p, i) => "<div><em>" + (i + 1) + "</em>" + p + "</div>").join("") + "</div><p>Schéma de principe issu du jumeau numérique. Comportement à valider sur plateforme d’essai, puis sur site.</p>"; },
  update(el, lt) { const p = ph(lt); el.querySelectorAll(".steps div").forEach((d, i) => { d.className = i === p ? "on" : i < p ? "done" : ""; }); } });

const t5b = S("5b");
return [
/* ================= 1 · LE TERRITOIRE ET SES VULNÉRABILITÉS ================= */
{ id: "1-aube", seq: 1, bare: true, at: 0, xf: 0,
  state: (lt, u) => day(ETE, lerp(7.45, 8.05, u)),
  cam: orbit({ c: [12, 24, 22], r: [262, 228], az: [-176, -162], h: [124, 96], fov: [38, 38] }),
  sup: { k: "Castagniccia · Haute-Corse", h: "Maquette numérique d’un village type", in: 1.6, out: 5.2 } },
{ id: "1-ligne", bare: true, at: S("1a") + 2.0, xf: 0,
  state: (lt, u) => day(ETE, 9.2 + u * .2),
  cam: move({ p: [g(-236, -150, 40), g(-186, -108, 34)], t: [g(-110, -70, 10), g(-60, -34, 10)], fov: [40, 40] }),
  callouts: [{ p: g(-150, -120, 22), label: "Ligne à haute tension", sub: "alimentation unique du village", in: .5, dx: 80, dy: -70 }] },
{ id: "1-feu", bare: true, at: S("1b") + .9, xf: .7,
  state: (lt, u) => day(225, 15.4 + u * .3, { fire: 1 }),
  cam: move({ p: [[-22, 78, 74], [-34, 70, 58]], t: [[-112, 22, -72], [-116, 20, -78]], fov: [38, 36] }),
  callouts: [{ p: [X.FIRE.x, X.FIRE.y + 10, X.FIRE.z], label: "Départ de feu sous la ligne", sub: "scénario d’été — simulation", in: .9, dx: 90, dy: -96 }] },
{ id: "1-hiver", bare: true, at: cue("1b", 2) - .5, xf: .9,
  state: (lt, u) => Object.assign(cutState(.4 + u * .5), { soc: .39 }),
  cam: move({ p: [[-168, 70, 44], [-150, 62, 30]], t: [[-66, 18, -44], [-58, 16, -38]], fov: [38, 38] }),
  callouts: [{ p: cutP, label: "Ligne coupée", sub: "neige, vent, chute d’arbre", in: .9, dx: -70, dy: -70 },
             { p: g(8, -6, 26), label: "Eau · communications · services essentiels", sub: "dépendants du même réseau", in: 1.9, dx: -70, dy: -84 }] },

/* ================= 2 · LE CONCEPT ================= */
{ id: "2-concept", seq: 2, at: S("2a") - .9, xf: 1.0,
  state: (lt, u) => day(ETE, 10.6 + u * .5),
  setup(lt) { rise(X.battG, lt, 3.4); rise(X.omb, lt, 2.2); rise(X.borne, lt, 2.6); rise(X.h2, lt, 4.6); rise(X.vig, lt, 6.6); rise(X.pvField, lt, 7.6); rise(X.wtank, lt, 7.8); rise(X.ws, lt, 8.0); },
  flows: (lt) => ({ _rest: sstep(ramp(lt, 5.5, 8.5)) }),
  cam: orbit({ c: [14, 12, 14], r: [252, 226], az: [-152, -122], h: [130, 114], fov: [38, 38] }),
  callouts: [
    { p: g(26, -14, 14), label: "Photovoltaïque", in: 1.4, out: 5.6, dx: 60, dy: -90 },
    { p: g(-2, 26, 8), label: "Batterie", in: 3.6, out: 7.6, dx: -64, dy: -96 },
    { p: [X.H2P.x, X.H2P.y + 8, X.H2P.z], label: "Hydrogène", in: 4.9, out: 9.0, dx: 70, dy: -60 },
    { p: g(-96, 44, 10), label: "Pico-centrale hydraulique", in: 5.9, out: 10.0, dx: -60, dy: -70 },
    { p: [X.VIG.x, X.VIG.y + 28, X.VIG.z], label: "Vigie incendie", in: 7.0, out: 11.0, dx: -50, dy: -64 },
    { p: g(150, 96, 12), label: "Agriculture instrumentée", in: 8.0, out: 12.0, dx: 56, dy: -70 }] },
{ id: "2-plateforme", at: cue("2b", 1) - .3, xf: .9,
  state: (lt, u) => day(ETE, 11.6 + u * .6),
  cam: orbit({ c: [6, 10, 8], r: [138, 120], az: [-120, -90], h: [60, 50], fov: [38, 38] }), waves: true,
  callouts: [
    { p: tip, label: "Réseau radio et capteurs", in: .8, dx: -70, dy: -60 },
    { p: g(-8, 4, 20), label: "Mairie-refuge", in: 1.6, dx: 70, dy: -74 },
    { p: g(22, 31, 7), label: "Recharge des véhicules", in: 2.4, dx: -84, dy: 64 }],
  note: { text: "Plateforme d’expérimentation : chaque équipement est instrumenté et mesuré", in: 1.2 } },

/* ================= 3 · L'ÉNERGIE ================= */
{ id: "3-pv", seq: 3, at: S("3a") - .9, xf: 1.0,
  state: (lt, u) => day(ETE, 12.2 + u * .3),
  flows: () => ({ pv1: 1, pv2: 1, pv4: 1, pv3: 1, _rest: 0 }),
  cam: orbit({ c: [14, 9, -6], r: [92, 80], az: [-18, 12], h: [44, 38], fov: [34, 34] }),
  callouts: [{ p: g(29, -14, 13), label: "Toits publics — école, mairie", sub: "120 kWc au total · hypothèse de référence", in: 2.0, dx: 76, dy: -92 }] },
{ id: "3-ombriere", at: cue("3a", 1) + .5, xf: .6,
  state: (lt, u) => day(ETE, 12.6 + u * .2),
  flows: () => ({ pv3: 1, pv2: 1, _rest: 0 }),
  cam: orbit({ c: [24, 4, 33], r: [50, 44], az: [38, 66], h: [22, 19], fov: [34, 34] }),
  callouts: [{ p: g(26, 36, 6.5), label: "Ombrière photovoltaïque", sub: "production au plus près des usages", in: .7, dx: -80, dy: -84 }] },
{ id: "3-torrent", at: S("3b") - .4, xf: .8,
  state: (lt, u) => day(100, 10.5 + u * .2),
  setup() { X.setCut("hydro"); },
  flows: () => ({ hyd: 1, hyd2: 1, _rest: 0 }),
  cam: move({ p: [g(-62, -14, 32), g(-66, 66, 15)], t: [g(-120, -34, 2), g(-97, 43, 3)], fov: [38, 36] }),
  callouts: [{ p: g(-112, -18, 3), label: "Conduite forcée", sub: "60 m de chute · hypothèse", in: .6, out: 2.9, dx: -80, dy: -80 }] },
{ id: "3-turbine", studio: "hydro", at: cue("3b", 1) - .25, xf: .7,
  st: () => ({ Q: 10.5, H: 60, ilot: 0 }),
  cam: move({ p: [[-6.6, 3.5, 4.8], [-2.4, 5.8, 10.2]], t: [[-.7, 2.0, 0], [.2, 2.3, 1.7]], fov: [38, 38] }),
  callouts: [{ p: [-1.7, 1.45, 0], label: "Injecteur", sub: "la pression devient un jet", in: .5, out: 3.0, dx: -60, dy: 78 },
             { p: [.2, 3.75, 0], label: "Roue Pelton", in: .9, out: 4.3, dx: -66, dy: -70 },
             { p: [.2, 3.6, 3], label: "Alternateur", sub: "5 kW · référence du modèle", in: 2.6, dx: 80, dy: -64 }] },
{ id: "3-batterie", studio: "batt", at: S("3c") - .4, xf: .7,
  st: (lt, u) => ({ mode: 0, soc: lerp(.44, .93, sstep(u * 1.05)), load: 7 }),
  cam: move({ p: [[-4.4, 3.4, 9.4], [5.4, 4.6, 10.4]], t: [[-1.9, 1.75, 0], [.6, 1.7, 0]], fov: [38, 38] }),
  callouts: [{ p: [-1.5, 3.4, .2], label: "Batterie communale", sub: "200 kWh utiles · hypothèse de référence", in: .6, dx: -40, dy: -84 },
             { p: [1.7, 1.34, .7], label: "Réserve de sécurité", sub: "40 % conservés pour la coupure", in: 2.9, dx: 96, dy: 66, hyp: 1 }] },
{ id: "3-hydrogene", studio: "h2", at: S("3d") - .4, xf: .7,
  st: (lt, u) => ({ mode: 0, kg: lerp(9, 17, u), pw: 1 }),
  cam: move({ p: [[-8.5, 4.4, 10.5], [8.8, 4.6, 10.5]], t: [[-4.6, 1.7, 0], [5.4, 1.7, 0]], fov: [38, 38] }),
  callouts: [{ p: [-5.6, 2.9, 0], label: "Électrolyseur", in: .5, out: 3.3, dx: -40, dy: -80 },
             { p: [3.55, 3.6, 0], label: "Stockage sous pression", in: 1.9, out: 5.0, dx: -30, dy: -84 },
             { p: [6.9, 2.6, 0], label: "Pile à combustible", in: 3.4, dx: 50, dy: -90 }],
  badge: { text: "Tranche conditionnelle<small>à l’étude</small>", color: "#9fd8ff" } },
{ id: "3-pilotage", at: S("3e") - .5, xf: .9,
  state: (lt, u) => day(ETE, lerp(8.4, 18.6, u)),
  cam: orbit({ c: [4, 6, 12], r: [128, 128], az: [58, 88], h: [150, 142], fov: [38, 38] }),
  panel: { in: .7,
    build(el) { el.innerHTML = "<h3>Journée d’été simulée <b></b></h3><div class='rows'>" +
      "<div class='r' style='--c:#F9B23D'><i></i>Photovoltaïque<b id='p1'></b></div><div class='r' style='--c:#5fa8d6'><i></i>Torrent<b id='p2'></b></div>" +
      "<div class='r' style='--c:#ecece8'><i></i>Consommation<b id='p3'></b></div><div class='r' style='--c:#E9426C'><i></i>Batterie<b id='p4'></b></div></div>" +
      "<canvas></canvas><div class='leg'><span style='--c:#F9B23D'>solaire</span><span style='--c:#5fa8d6'>torrent</span><span style='--c:#ecece8'>consommation</span><span style='--c:#E9426C'>batterie, %</span></div>" +
      "<p>Modèle horaire d’un village type : consommations, météo et dimensionnement sont des hypothèses.</p>"; el._q = canvas(el); },
    update(el, lt, u) { const h = lerp(8.4, 18.6, u), v = simAt(ETE, h); el.querySelector("h3 b").textContent = hhmm(h);
      el.querySelector("#p1").innerHTML = kw(v.pv, 0); el.querySelector("#p2").innerHTML = kw(v.hyd, 1); el.querySelector("#p3").innerHTML = kw(v.load, 0); el.querySelector("#p4").innerHTML = fmt(v.soc * 100) + "<small>%</small>"; dayChart(el._q, ETE, h); } } },

/* ================= 4 · LA RÉSILIENCE FACE AUX CRISES ================= */
{ id: "4-coupure", seq: 4, at: S("4a") - .9, xf: 1.0,
  state: (lt) => lt < 2.3 ? Object.assign(day(HIVER, 16.3 + lt * .02), { soc: .4 }) : Object.assign(cutState(.02 * (lt - 2.3)), { soc: .39 }),
  cam: move({ p: [[-128, 64, 26], [-112, 56, 30]], t: [[-62, 16, -40], [-50, 14, -30]], fov: [36, 36] }),
  callouts: [{ p: cutP, label: "Interruption de la ligne", sub: "14 janvier, 16 h 30 — scénario simulé", in: 2.5, dx: -70, dy: -76 }],
  badge: lt => lt < 2.3 ? { text: "Réseau raccordé", color: "#55c08f", out: 2.3 } : { text: "Ligne interrompue", color: "#E9426C", in: 2.3 } },
{ id: "4-normal", studio: "ilot", at: S("4b") - .35, xf: .7,
  st: () => ({ ph: 0, auto: 0 }),
  cam: orbit({ c: [1.2, 1.4, .6], r: [23, 21], az: [108, 96], h: [11, 10], fov: [38, 38] }),
  badge: { text: "Fonctionnement normal<small>réseau raccordé</small>", color: "#55c08f" },
  panel: stepsPanel(() => 0) },
{ id: "4-degrade", studio: "ilot", at: S("4c") - .35, xf: 0,
  st: lt => ({ ph: lt < 1.5 ? 1 : lt < 3.1 ? 2 : lt < 5.3 ? 3 : 4, auto: 0 }),
  cam: orbit({ c: [1.2, 1.4, .6], r: [21, 18], az: [96, 62], h: [10, 8.6], fov: [38, 38] }),
  badge: { text: "Fonctionnement dégradé<small>îlotage</small>", color: "#E9426C" },
  panel: Object.assign(stepsPanel(lt => lt < 1.5 ? 1 : lt < 3.1 ? 2 : lt < 5.3 ? 3 : 4), { in: 0 }) },
{ id: "4-prioritaires", at: S("4d") - .35, xf: .8,
  state: (lt, u) => cutState(2.6 + u * .5),
  flows: () => ({ bat: 1, bat2: 1, hyd2: 1, dat1: .6, dat4: .6, _rest: 0 }),
  cam: orbit({ c: [-10, 12, 2], r: [104, 90], az: [58, 92], h: [40, 34], fov: [36, 36] }), waves: true,
  callouts: [{ p: g(-8, 4, 21), label: "Mairie-refuge", sub: "accueil, éclairage, recharge", in: 2.6, dx: 76, dy: -86 },
             { p: tip, label: "Communications", sub: "relais radio secouru", in: 3.9, dx: -80, dy: 64 },
             { p: g(36, 10, 7.2), label: "Éclairage de sécurité", sub: "niveau réduit", in: 6.3, dx: -76, dy: -56 }],
  badge: { text: "Fonctionnement dégradé<small>îlotage</small>", color: "#E9426C" },
  panel: { in: 1.4,
    build(el) { const P = [["Mairie-refuge", .55], ["Alimentation en eau", .2], ["Communications", .12], ["Éclairage de sécurité", .13]];
      el.innerHTML = "<h3>Charge critique <b>6 kW</b></h3><div class='rows'>" + P.map(q => "<div class='r' style='--c:#E9426C;grid-template-columns:1fr auto'><span>" + q[0] + "<div class='bar'><u style='width:" + (q[1] / .55 * 100) + "%'></u></div></span><b>" + fmt(6 * 1.15 * q[1], 1) + "<small>kW</small></b></div>").join("") + "</div><p>Répartition illustrative de la charge maintenue en îlot. Hypothèse de dimensionnement, à mesurer sur site.</p>"; },
    update() {} } },
{ id: "4-72h", at: S("4e") - .35, xf: .9,
  state: (lt, u) => cutState(lerp(15.7, 19.6, u)),          // lendemain matin de la coupure : le solaire et le torrent rechargent
  cam: orbit({ c: [0, 14, 4], r: [215, 240], az: [34, 18], h: [70, 84], fov: [38, 38] }),
  badge: { text: "Fonctionnement dégradé<small>îlotage</small>", color: "#E9426C" },
  panel: { in: .5,
    build(el) { el.innerHTML = "<h3>Coupure simulée <b></b></h3><div class='big'>" + fmt(RES.p72 * 100) + " %<small>des coupures simulées tenues 72 h</small></div><canvas></canvas><div class='leg'><span style='--c:#E9426C'>charge de la batterie pendant la coupure</span></div><p>Résultat du modèle horaire (8 760 heures, village type). Performance non démontrée : elle reste à vérifier par l’expérimentation.</p>"; el._q = canvas(el); },
    update(el, lt, u) { const x = lerp(0, 96, sstep(ramp(u, .08, .92))); el.querySelector("h3 b").textContent = "+ " + fmt(Math.min(96, x)) + " h"; islandChart(el._q, x); } } },

/* ================= 5 · DONNÉES, IA, INFRASTRUCTURES CONNECTÉES ================= */
{ id: "5-vigie", seq: 5, scan: true, at: S("5a") - .9, xf: 1.0,
  state: (lt, u) => day(ETE, 9.6 + u * .2),
  flows: () => ({ _rest: 0 }),
  cam: move({ p: [g(-92, 0, 40), g(-104, 16, 34)], t: [g(-150, -52, 18), g(-150, -46, 16)], fov: [38, 38] }),
  callouts: [{ p: [X.VIG.x, X.VIG.y + 28, X.VIG.z], label: "Vigie incendie", sub: "caméra sur mât autonome", in: 2.3, dx: 70, dy: -70 },
             { p: g(-140, -70, 6), label: "Capteurs environnementaux", sub: "fumée · température · humidité", in: 3.2, dx: -80, dy: -66 }] },
{ id: "5-radio", at: cue("5a", 2) - .3, xf: .7,
  state: (lt, u) => day(ETE, 10.2 + u * .2),
  flows: () => ({ dat1: 1, dat2: 1, dat3: 1, dat4: 1, _rest: 0 }),
  cam: orbit({ c: [-6, 16, -4], r: [98, 86], az: [52, 80], h: [34, 30], fov: [36, 36] }), waves: true,
  callouts: [{ p: tip, label: "Réseau radio secouru", sub: "relais sur le campanile", in: .5, dx: -76, dy: -52 },
             { p: g(40, 18, 11), label: "Suivi des consommations", sub: "comptage par bâtiment", in: 1.5, dx: 70, dy: -78 }] },
{ id: "5-jumeau", at: cue("5a", 3) - .5, xf: 1.3,
  state: (lt, u) => Object.assign(day(ETE, 21.6), { soc: .72 }),
  setup(lt) { X.terrain.material.wireframe = true; X.pines.visible = false; X.bush.visible = false; },
  flows: () => ({ dat1: 1, dat2: 1, dat3: 1, dat4: 1, pv1: .5, pv4: .5, hyd2: .7, bat: .7, bat3: .5, agri: .5, _rest: 0 }),
  look: { moon: .2, expo: 1.25, fogNear: 300, fogFar: 1600 }, waves: true,
  cam: orbit({ c: [10, 6, 14], r: [236, 206], az: [-150, -112], h: [128, 110], fov: [38, 38] }),
  panel: { in: 1.5,
    build(el) { el.innerHTML = "<h3>Jumeau numérique <span>aide à la décision</span></h3><div class='steps'><div><em>1</em>Anticiper — prévision météo à J+1</div><div><em>2</em>Optimiser — réserve de batterie ajustée</div><div><em>3</em>Décider — consigne proposée à l’exploitant</div></div>" +
      "<div class='rows' style='margin-top:14px'><div class='r' style='--c:#5fa8d6'><i></i>Ciel prévu demain<b id='j1'></b></div><div class='r' style='--c:#E9426C'><i></i>Réserve de batterie<b id='j2'></b></div></div><p>Illustration du pilotage prédictif étudié dans le modèle : avant un passage couvert, la réserve est relevée.</p>"; },
    update(el, lt) { const t = c.S("5b") - (c.cue("5a", 3) - .5), a = lt - t, st = a < 2.0 ? -1 : a < 4.3 ? 0 : a < 6.6 ? 1 : 2;
      el.querySelectorAll(".steps div").forEach((d, i) => { d.className = i === st ? "on" : i < st ? "done" : ""; });
      el.querySelector("#j1").textContent = st >= 0 ? "couvert" : "—"; el.querySelector("#j2").innerHTML = st >= 1 ? fmt(lerp(40, 90, sstep(ramp(a, 4.3, 5.6)))) + "<small>%</small>" : "40<small>%</small>"; } } },
{ id: "5-agriculture", at: S("5c") - .35, xf: .9,
  state: (lt, u) => day(ETE, 16.4 + u * .2),
  flows: () => ({ agri: 1, dat2: 1, dat3: 1, _rest: 0 }),
  cam: orbit({ c: [150, 8, 100], r: [96, 84], az: [-58, -30], h: [40, 34], fov: [36, 36] }),
  callouts: [{ p: g(146, 72, 5), label: "Gestion de l’eau", sub: "pompage solaire, réserve", in: .5, dx: -70, dy: -70 },
             { p: g(156, 118, 4), label: "Agriculture instrumentée", sub: "sondes de sol, station météo", in: 1.2, dx: 76, dy: -60 }] },
{ id: "5-recharge", at: cue("5c", 1) + .1, xf: .6,
  state: (lt, u) => day(ETE, 17.0 + u * .2),
  flows: () => ({ pv3: 1, _rest: 0 }),
  cam: orbit({ c: [24, 3, 32], r: [42, 37], az: [150, 178], h: [16, 14], fov: [36, 36] }),
  callouts: [{ p: g(22, 30, 4.2), label: "Recharge des véhicules", sub: "alimentée en priorité par l’ombrière", in: .5, dx: -70, dy: -80 }] },

/* ================= 6 · UNE PLATEFORME DE RECHERCHE REPRODUCTIBLE ================= */
{ id: "6-final", seq: 6, at: S("6a") - .9, xf: 1.2,
  state: (lt, u) => day(ETE, lerp(17.9, 19.25, Math.min(1, u * 1.1))),
  look: { fogNear: 280, fogFar: 1700 },
  cam: orbit({ c: [8, 18, 12], r: [132, 330], az: [66, 42], h: [30, 104], fov: [38, 38] }) }
];
};
