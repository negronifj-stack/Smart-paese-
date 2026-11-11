/* Smart Paese — ouverture du film (13 s) : logo du syndicat, puis carte de la Haute-Corse sur laquelle
   s'allument les politiques du projet de mandature (éclairage public LED, bornes de recharge, projets
   solaires de la SEM), avant le zoom sur le village pilote. Sites, tranches et chiffres sont lus dans
   l'atlas de l'artéfact « Projet de mandature » (artifact-mandature/data/atlas-data.js).
   Les contours viennent de l'artéfact « Projet de mandature » (artifact-mandature/data/geo.js) ;
   l'emplacement du village est celui de son atlas : Castagniccia, 9,385° E, 42,405° N (site indicatif). */
(function () {
"use strict";
const G = window.ATLAS_GEO, D = window.ATLAS_DATA, DUR = 13, FPS = 25, VILLAGE = D.villages.sites[0];
const $ = id => document.getElementById(id), cv = $("map"), q = cv.getContext("2d");
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, u) => a + (b - a) * u;
const sstep = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }, ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const env = (t, i, o, f) => sstep(ramp(t, i, i + f)) * (1 - sstep(ramp(t, o - f, o)));

/* tout est ramené dans un même repère de Mercator (radians) */
const un = (p, pr) => [(p[0] - pr.tx) / pr.k, (p[1] - pr.ty) / pr.k];
const med = G.med.rings.map(r => r.map(p => un(p, G.med.proj)));
const sud = G.hc.sud.map(r => r.map(p => un(p, G.hc.proj)));
const com = G.hc.communes.map(c => ({ hors: c.hors, r: c.r.map(r => r.map(p => un(p, G.hc.proj))) }));
const ll = (lon, lat) => [lon * Math.PI / 180, -Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))];
const V = ll(VILLAGE.lon, VILLAGE.lat);
/* couches du projet de mandature */
const T_LED = 4.9, T_IRVE = 6.8, T_SEM = 8.6, T_VIL = 10.2, T_ZOOM = 10.4;
const poles = {}; D.irve.poles.forEach(p => { poles[p.id] = ll(p.lon, p.lat); });
const tr = []; D.ep.tranches.forEach((t, i) => t.poles.forEach(id => tr.push({ p: poles[id], i })));
const led = G.hc.communes.filter(c => !c.hors).map((c, n) => { const p = un([c.x, c.y], G.hc.proj); let b = tr[0], bd = 1e9; tr.forEach(q => { const d = Math.hypot(q.p[0] - p[0], q.p[1] - p[1]); if (d < bd) { bd = d; b = q; } });
  return { p, t: T_LED + .15 + b.i * .33 + ((n * 37) % 20) / 80 }; });               // les communes s'allument tranche par tranche, 2027 → 2030
const irve = D.irve.stations.map((s_, n) => ({ p: ll(s_.lon, s_.lat), t: T_IRVE + .15 + n * .045 }));
const sem = D.sem.projets.map((s_, n) => ({ p: ll(s_.lon, s_.lat), t: T_SEM + .2 + n * .3 }));
let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; com.forEach(c => c.r.forEach(r => r.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); })));
const HC = [(x0 + x1) / 2 - (x1 - x0) * .55, (y0 + y1) / 2], sHC = 880 / (y1 - y0);      // la Haute-Corse tient dans la hauteur, décalée à droite du texte
const KEYS = [                                   // [instant, centre, échelle en px par radian]
  [2.6, [HC[0] - .012, HC[1] + .02], sHC * .2],
  [4.4, HC, sHC],
  [T_ZOOM, HC, sHC * 1.05],
  [12.4, V, sHC * 9] ];
function cam(t) { let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++; const a = KEYS[i], b = KEYS[i + 1], u = sstep(ramp(t, a[0], b[0]));
  const s = Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), u)), w = a[2] === b[2] ? u : (1 / a[2] - 1 / s) / (1 / a[2] - 1 / b[2]);      // le centre suit l'échelle : zoom sans dérive
  return { c: [lerp(a[1][0], b[1][0], w), lerp(a[1][1], b[1][1], w)], s }; }
function path(rings) { q.beginPath(); rings.forEach(r => { r.forEach((p, i) => i ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1])); q.closePath(); }); }

function draw(t) {
  const { c, s } = cam(t), px = 1 / s, zoomIn = sstep(ramp(t, 3.2, 4.4));
  q.setTransform(1, 0, 0, 1, 0, 0); const bg = q.createRadialGradient(960, 520, 100, 960, 540, 1200); bg.addColorStop(0, "#131a20"); bg.addColorStop(1, "#090c0f"); q.fillStyle = bg; q.fillRect(0, 0, 1920, 1080);
  q.setTransform(s, 0, 0, s, 960 - c[0] * s, 540 - c[1] * s); q.lineJoin = "round";
  path(med); q.fillStyle = "#1c232a"; q.fill(); q.strokeStyle = "rgba(255,255,255,.16)"; q.lineWidth = px; q.stroke();
  path(sud); q.fillStyle = "#222a31"; q.fill(); q.strokeStyle = "rgba(255,255,255,.22)"; q.lineWidth = px; q.stroke();
  const gr = q.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, "#F9B23D"); gr.addColorStop(.5, "#F08363"); gr.addColorStop(1, "#E9426C");
  com.forEach(k => { path(k.r); q.fillStyle = "#252d34"; q.fill(); });
  q.globalAlpha = .1 + .08 * zoomIn; com.forEach(k => { if (!k.hors) { path(k.r); q.fillStyle = gr; q.fill(); } }); q.globalAlpha = 1;
  q.strokeStyle = gr; q.lineWidth = px * lerp(.5, 1.25, zoomIn); q.globalAlpha = lerp(.35, .95, zoomIn); com.forEach(k => { path(k.r); q.stroke(); }); q.globalAlpha = 1;
  q.setTransform(1, 0, 0, 1, 0, 0); const sx = p => 960 + (p[0] - c[0]) * s, sy = p => 540 + (p[1] - c[1]) * s, far = 1 - .75 * sstep(ramp(t, T_ZOOM, T_ZOOM + 1.2));
  /* éclairage public : un point lumineux par commune adhérente */
  const dimL = (1 - .6 * sstep(ramp(t, T_IRVE - .2, T_IRVE + .4))) * far;
  led.forEach(o => { const a = sstep(ramp(t, o.t, o.t + .35)) * dimL; if (a <= 0) return; const X = sx(o.p), Y = sy(o.p), g = q.createRadialGradient(X, Y, 0, X, Y, 11);
    g.addColorStop(0, "rgba(214,236,255," + (.95 * a).toFixed(3) + ")"); g.addColorStop(.3, "rgba(120,190,245," + (.45 * a).toFixed(3) + ")"); g.addColorStop(1, "rgba(42,134,200,0)"); q.fillStyle = g; q.beginPath(); q.arc(X, Y, 11, 0, 6.3); q.fill(); });
  /* mobilité électrique : stations de recharge */
  const dimI = (1 - .5 * sstep(ramp(t, T_SEM - .2, T_SEM + .4))) * far;
  irve.forEach(o => { const a = sstep(ramp(t, o.t, o.t + .3)) * dimI; if (a <= 0) return; const X = sx(o.p), Y = sy(o.p), k = 1 + .8 * (1 - sstep(ramp(t, o.t, o.t + .5)));
    q.beginPath(); q.arc(X, Y, 6 * k, 0, 6.3); q.fillStyle = "rgba(240,131,99," + a.toFixed(3) + ")"; q.fill(); q.beginPath(); q.arc(X, Y, 10.5 * k, 0, 6.3); q.strokeStyle = "rgba(240,131,99," + (.55 * a).toFixed(3) + ")"; q.lineWidth = 1.6; q.stroke(); });
  /* SEM : projets solaires structurants */
  const dimS = (1 - .4 * sstep(ramp(t, T_VIL - .2, T_VIL + .4))) * far;
  sem.forEach(o => { const a = sstep(ramp(t, o.t, o.t + .35)) * dimS; if (a <= 0) return; const X = sx(o.p), Y = sy(o.p);
    q.fillStyle = "rgba(233,66,108," + a.toFixed(3) + ")"; q.fillRect(X - 8, Y - 8, 16, 16); q.strokeStyle = "rgba(255,255,255," + (.8 * a).toFixed(3) + ")"; q.lineWidth = 1.6; q.strokeRect(X - 13, Y - 13, 26, 26); });
  /* légende qui se complète */
  q.font = "500 19px Montserrat"; q.textBaseline = "middle";
  [[T_LED, "#8cc6f5", "Éclairage public LED", 0], [T_IRVE, "#F08363", "Bornes de recharge", 0], [T_SEM, "#E9426C", "Projets solaires de la SEM", 1], [T_VIL, "#ffffff", "Smart Paese, village pilote", 2]].forEach((L, i) => {
    const a = sstep(ramp(t, L[0], L[0] + .5)) * (1 - sstep(ramp(t, T_ZOOM + .9, T_ZOOM + 1.6))); if (a <= 0) return; const Y = 78 + i * 36; q.globalAlpha = a; q.fillStyle = L[1];
    if (L[3] === 1) q.fillRect(64, Y - 7, 14, 14); else { q.beginPath(); q.arc(71, Y, 7, 0, 6.3); q.fill(); }
    if (L[3] === 2) { q.beginPath(); q.arc(71, Y, 11, 0, 6.3); q.strokeStyle = "rgba(255,255,255,.5)"; q.lineWidth = 2; q.stroke(); }
    q.fillStyle = "#f3f3ef"; q.fillText(L[2], 96, Y + 1); q.globalAlpha = 1; });
  /* village pilote */
  const a = sstep(ramp(t, T_VIL, T_VIL + .7)); if (a > 0) { const X = sx(V), Y = sy(V);
    for (let i = 0; i < 2; i++) { const u = ((t - T_VIL) * .55 + i / 2) % 1; q.beginPath(); q.arc(X, Y, 10 + u * 70, 0, 6.3); q.strokeStyle = "rgba(255,255,255," + (.5 * (1 - u) * a).toFixed(3) + ")"; q.lineWidth = 2; q.stroke(); }
    q.beginPath(); q.arc(X, Y, 9, 0, 6.3); q.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")"; q.fill(); q.beginPath(); q.arc(X, Y, 17, 0, 6.3); q.strokeStyle = "rgba(255,255,255," + (.35 * a).toFixed(3) + ")"; q.lineWidth = 5; q.stroke(); }
}
const sup = $("super"), LAB = [
  [3.3, T_LED - .1, "Syndicat départemental d’énergie de Haute-Corse", "Projet de mandature 2026-2032"],
  [T_LED, T_IRVE - .1, "Éclairage public", D.ep.objectif + " — objectif"],
  [T_IRVE, T_SEM - .1, "Mobilité électrique", D.irve.pdc_publics_2030 + " points de charge publics en 2030 — objectif"],
  [T_SEM, T_VIL - .1, "SEM énergies renouvelables", "Projets solaires structurants"],
  [T_VIL, 12.4, "Smart Paese", VILLAGE.secteur + " — localisation indicative"]];
$("note").textContent = "Sites et chiffres illustratifs, à préciser avec les communes et les partenaires";
function renderAt(t) {
  draw(Math.max(t, 2.6));
  $("logo").style.opacity = (1 - sstep(ramp(t, 2.5, 3.3))).toFixed(3);
  $("black").style.opacity = Math.max(1 - sstep(ramp(t, .1, .9)), sstep(ramp(t, DUR - .6, DUR - .05))).toFixed(3);
  const l = LAB.find(l => t >= l[0] && t <= l[1]); sup.style.opacity = l ? env(t, l[0], l[1], .3).toFixed(3) : 0;
  $("note").style.opacity = (env(t, T_LED, 12.4, .5) * .9).toFixed(3);
  if (l) { sup.querySelector(".k").textContent = l[2]; sup.querySelector(".h").textContent = l[3]; }
  return "intro";
}
window.Film = { renderAt, preroll() {}, shots: [], duration: DUR, fps: FPS,
  ready: Promise.all([document.fonts.load("600 28px Montserrat"), document.fonts.load("500 19px Montserrat"), document.fonts.load("400 15px 'IBM Plex Mono'"), document.fonts.load("500 15px 'IBM Plex Mono'"), new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = "assets/logo-sde2b.jpg"; })]).then(() => true) };
})();
