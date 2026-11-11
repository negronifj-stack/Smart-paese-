/* Smart Paese — ouverture du film (8 s) : logo du syndicat, puis zoom cartographique
   Méditerranée occidentale → Haute-Corse → village pilote.
   Les contours viennent de l'artéfact « Projet de mandature » (artifact-mandature/data/geo.js) ;
   l'emplacement du village est celui de son atlas : Castagniccia, 9,385° E, 42,405° N (site indicatif). */
(function () {
"use strict";
const G = window.ATLAS_GEO, DUR = 8, FPS = 25, VILLAGE = { lon: 9.385, lat: 42.405 };
const $ = id => document.getElementById(id), cv = $("map"), q = cv.getContext("2d");
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, u) => a + (b - a) * u;
const sstep = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }, ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const env = (t, i, o, f) => sstep(ramp(t, i, i + f)) * (1 - sstep(ramp(t, o - f, o)));

/* tout est ramené dans un même repère de Mercator (radians) */
const un = (p, pr) => [(p[0] - pr.tx) / pr.k, (p[1] - pr.ty) / pr.k];
const med = G.med.rings.map(r => r.map(p => un(p, G.med.proj)));
const sud = G.hc.sud.map(r => r.map(p => un(p, G.hc.proj)));
const com = G.hc.communes.map(c => ({ hors: c.hors, r: c.r.map(r => r.map(p => un(p, G.hc.proj))) }));
const V = [VILLAGE.lon * Math.PI / 180, -Math.log(Math.tan(Math.PI / 4 + VILLAGE.lat * Math.PI / 360))];
let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; com.forEach(c => c.r.forEach(r => r.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); })));
const HC = [(x0 + x1) / 2 - (x1 - x0) * .55, (y0 + y1) / 2], sHC = 880 / (y1 - y0);      // la Haute-Corse tient dans la hauteur, décalée à droite du texte
const KEYS = [                                   // [instant, centre, échelle en px par radian]
  [2.6, [HC[0] - .012, HC[1] + .02], sHC * .2],
  [4.9, HC, sHC],
  [5.5, HC, sHC * 1.04],
  [7.5, V, sHC * 9] ];
function cam(t) { let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++; const a = KEYS[i], b = KEYS[i + 1], u = sstep(ramp(t, a[0], b[0]));
  const s = Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), u)), w = a[2] === b[2] ? u : (1 / a[2] - 1 / s) / (1 / a[2] - 1 / b[2]);      // le centre suit l'échelle : zoom sans dérive
  return { c: [lerp(a[1][0], b[1][0], w), lerp(a[1][1], b[1][1], w)], s }; }
function path(rings) { q.beginPath(); rings.forEach(r => { r.forEach((p, i) => i ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1])); q.closePath(); }); }

function draw(t) {
  const { c, s } = cam(t), px = 1 / s, zoomIn = sstep(ramp(t, 3.4, 4.9));
  q.setTransform(1, 0, 0, 1, 0, 0); const bg = q.createRadialGradient(960, 520, 100, 960, 540, 1200); bg.addColorStop(0, "#131a20"); bg.addColorStop(1, "#090c0f"); q.fillStyle = bg; q.fillRect(0, 0, 1920, 1080);
  q.setTransform(s, 0, 0, s, 960 - c[0] * s, 540 - c[1] * s); q.lineJoin = "round";
  path(med); q.fillStyle = "#1c232a"; q.fill(); q.strokeStyle = "rgba(255,255,255,.16)"; q.lineWidth = px; q.stroke();
  path(sud); q.fillStyle = "#222a31"; q.fill(); q.strokeStyle = "rgba(255,255,255,.22)"; q.lineWidth = px; q.stroke();
  const gr = q.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, "#F9B23D"); gr.addColorStop(.5, "#F08363"); gr.addColorStop(1, "#E9426C");
  com.forEach(k => { path(k.r); q.fillStyle = "#252d34"; q.fill(); });
  q.globalAlpha = .1 + .08 * zoomIn; com.forEach(k => { if (!k.hors) { path(k.r); q.fillStyle = gr; q.fill(); } }); q.globalAlpha = 1;
  q.strokeStyle = gr; q.lineWidth = px * lerp(.5, 1.25, zoomIn); q.globalAlpha = lerp(.35, .95, zoomIn); com.forEach(k => { path(k.r); q.stroke(); }); q.globalAlpha = 1;
  /* village pilote */
  const a = sstep(ramp(t, 5.3, 6.1)); if (a > 0) { q.setTransform(1, 0, 0, 1, 0, 0); const X = 960 + (V[0] - c[0]) * s, Y = 540 + (V[1] - c[1]) * s;
    for (let i = 0; i < 2; i++) { const u = ((t - 5.3) * .55 + i / 2) % 1; q.beginPath(); q.arc(X, Y, 10 + u * 70, 0, 6.3); q.strokeStyle = "rgba(255,255,255," + (.5 * (1 - u) * a).toFixed(3) + ")"; q.lineWidth = 2; q.stroke(); }
    q.beginPath(); q.arc(X, Y, 9, 0, 6.3); q.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")"; q.fill(); q.beginPath(); q.arc(X, Y, 17, 0, 6.3); q.strokeStyle = "rgba(255,255,255," + (.35 * a).toFixed(3) + ")"; q.lineWidth = 5; q.stroke(); }
}
const sup = $("super"), LAB = [[3.3, 5.4, "Syndicat départemental d’énergie", "Haute-Corse"], [5.7, 7.5, "Castagniccia", "Village pilote — localisation indicative"]];
function renderAt(t) {
  draw(Math.max(t, 2.6));
  $("logo").style.opacity = (1 - sstep(ramp(t, 2.5, 3.3))).toFixed(3);
  $("black").style.opacity = Math.max(1 - sstep(ramp(t, .1, .9)), sstep(ramp(t, DUR - .6, DUR - .05))).toFixed(3);
  const l = LAB.find(l => t >= l[0] && t <= l[1]); sup.style.opacity = l ? env(t, l[0], l[1], .45).toFixed(3) : 0;
  if (l) { sup.querySelector(".k").textContent = l[2]; sup.querySelector(".h").textContent = l[3]; }
  return "intro";
}
window.Film = { renderAt, preroll() {}, shots: [], duration: DUR, fps: FPS,
  ready: Promise.all([document.fonts.load("600 28px Montserrat"), document.fonts.load("500 15px 'IBM Plex Mono'"), new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = "assets/logo-sde2b.jpg"; })]).then(() => true) };
})();
