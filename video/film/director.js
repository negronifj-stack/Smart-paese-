/* Smart Paese — réalisateur du film.
   Pilote la scène 3D de l'artéfact image par image : état du village (issu du modèle horaire),
   caméra, ateliers 3D, annotations, panneaux de mesure, sous-titres et transitions.
   Tout est fonction pure du temps du film : Film.renderAt(t) peut être appelé dans n'importe quel ordre. */
(function () {
"use strict";
const THREE = window.THREE, TL = window.TIMELINE, M = window.Model, $ = id => document.getElementById(id);
const T0 = 20000;                      // décalage de l'horloge virtuelle, en ms
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, u) => a + (b - a) * u;
const sstep = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const env = (t, i, o, fi, fo) => sstep(ramp(t, i, i + (fi == null ? .5 : fi))) * (1 - sstep(ramp(t, o - (fo == null ? .45 : fo), o)));
const fmt = (n, d) => n.toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });

/* ---------- scène de l'artéfact ---------- */
const scene = window.Scene.create($("stage"), function () {}), X = scene.x;
const studio = window.Studio.create(scene.renderer, scene.dom); scene.studio = studio;
scene.start();
[X.controls, studio.controls].forEach(c => { c.enabled = false; c.enableDamping = false; c.autoRotate = false; c.minDistance = 0; c.maxDistance = Infinity; c.maxPolarAngle = Math.PI; c.minPolarAngle = 0; });
scene.noDraw = true; window.VClock.step(6000); window.VClock.step(12000); scene.noDraw = false;   // laisse finir le travelling d'ouverture de l'artéfact
window.__x = X;
window.Look(X, THREE);                // habillage du village : enduits, tuiles, maquis, mer
const gl = scene.dom, snap = $("snap"), snapC = snap.getContext("2d");

/* ---------- modèle : mêmes hypothèses que l'artéfact ---------- */
const SIM = M.simulate(M.DEFAULTS), RES = M.resilience(SIM);
function simAt(day, clock) {
  const h = Math.floor(clock), f = clock - h, i = (day * 24 + h) % M.H, j = (i + 1) % M.H, o = {};
  ["pv", "hyd", "load", "soc", "bat", "imp", "exp", "elz"].forEach(k => { o[k] = lerp(SIM[k][i], SIM[k][j], f); });
  return o;
}
function islandAt(isl, x) { const n = clamp(Math.floor(x), 0, isl.soc.length - 2), f = clamp(x - n, 0, 1), o = {}; ["pv", "hyd", "load", "soc", "bat"].forEach(k => { o[k] = lerp(isl[k][n], isl[k][n + 1], f); }); return o; }

/* ---------- plans ---------- */
const S = id => TL.sentences.find(s => s.id === id).start, E = id => TL.sentences.find(s => s.id === id).end;
const cue = (sid, n) => TL.cues.filter(c => c.sid === sid)[n].start;
const g = (x, z, dy) => [x, X.height(x, z) + (dy || 0), z];
const ctx = { TL, S, E, cue, g, X, M, SIM, RES, simAt, islandAt, studio, scene, lerp, clamp, sstep, ramp, env, fmt, THREE };
const shots = window.SHOTS(ctx);
shots.forEach((s, i) => { s.start = s.at; s.end = i + 1 < shots.length ? shots[i + 1].at : TL.duration; s.i = i; });
TL.sequences.forEach(q => { const s = shots.find(s => s.seq === q.n); q.vstart = s ? s.start : q.start; });
TL.titleAt = E("6b") + 1.0;
const shotAt = t => { let k = 0; for (let i = 0; i < shots.length; i++) if (shots[i].start <= t + 1e-6) k = i; return shots[k]; };

const SCALED = ["battG", "h2", "omb", "borne", "vig", "pvField", "wtank", "ws"];
const pvMeshes = []; X.scene.traverse(o => { if (o.isMesh && o.material === X.mPV) pvMeshes.push(o); });
X.mPV.transparent = true;
/* « bare » : le village avant le programme, sans les équipements Smart Paese */
const EQUIP = [X.omb, X.borne, X.vig, X.pvField, X.wtank, X.ws, X.beam].concat(pvMeshes, X.waves, X.fnodes, X.sensors.map(s => s.g));
function resetVillage(bare) {
  SCALED.forEach(k => { X[k].scale.setScalar(1); });
  EQUIP.forEach(o => { o.visible = !bare; }); X.mPV.opacity = 1;
  X.setCut(null); X.terrain.material.wireframe = false; X.pines.visible = X.bush.visible = true; if (X.rocks) X.rocks.visible = true; if (X.sea) X.sea.visible = true;
}
/* Lumière et atmosphère du film, par-dessus les réglages de l'artéfact : brume de distance (perspective aérienne),
   soleil rasant plus chaud, clair de lune pour lire les scènes de nuit. « look » affine plan par plan. */
X.water.material.emissiveIntensity = .05;
const cA = new THREE.Color(), cB = new THREE.Color();
function applyLook(sh, lt, u) {
  const L = sh.look ? (typeof sh.look === "function" ? sh.look(lt, u) : sh.look) : {}, fog = X.scene.fog, S = X.sun;
  const day = clamp((S.intensity - .5) / 2.1, 0, 1), night = S.intensity === 0;
  fog.near = L.fogNear != null ? L.fogNear : night ? 300 : 420; fog.far = L.fogFar != null ? L.fogFar : night ? 1800 : 3400;
  if (night) {                                   // clair de lune : une directionnelle froide remplace le soleil couché
    S.intensity = L.moon != null ? L.moon : .34; S.color.set(0x9db4e6); S.position.set(-150, 260, 120);
    X.hemi.intensity = .16; fog.color.set(0x0c1220); X.renderer.toneMappingExposure = .7;
  } else {
    const low = 1 - sstep(ramp(day, .05, .5));   // soleil bas : plus chaud, plus contrasté
    S.intensity *= 1 + .5 * low; cA.set(0xffc27a); S.color.lerp(cA, low * .6);
    X.renderer.toneMappingExposure *= .96 + .4 * low;
    cA.setRGB(.72, .84, .93); cB.set(0xdcc0aa); fog.color.copy(cA).lerp(cB, low * .55);
    if (L.fogNear == null) { fog.near += 90 * low; fog.far += 350 * low; }
  }
  if (L.fogColor) fog.color.set(L.fogColor);
  if (L.sunI != null) S.intensity = L.sunI; if (L.sunColor) S.color.set(L.sunColor);
  if (L.hemiI != null) X.hemi.intensity = L.hemiI;
  if (L.expo) X.renderer.toneMappingExposure *= L.expo;
  X.scan.visible = !!sh.scan; X.waves.forEach(w => { w.visible = !!sh.waves; });
  X.water.material.emissiveIntensity = night ? .02 : .05;
}
const v3 = new THREE.Vector3();
function setCam(cam, ctl, c) { cam.position.set(c.p[0], c.p[1], c.p[2]); ctl.target.set(c.t[0], c.t[1], c.t[2]); const f = c.fov || 38; if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }

function drawShot(sh, t) {
  const lt = t - sh.start, d = sh.end - sh.start, u = lt / d;
  if (sh.studio) {
    if (studio.def == null || studio._k !== sh.studio) { studio.open(sh.studio); studio._k = sh.studio; }
    studio.active = true;
    if (sh.st) Object.assign(studio.def.st, sh.st(lt, u));
    setCam(studio.camera, studio.controls, sh.cam(u, lt));
  } else {
    studio.active = false; resetVillage(!!sh.bare);
    scene.set(Object.assign({ fire: 0, clock: 13, day: 195, cut: false, pv: 0, hyd: 0, bat: 0, imp: 0, exp: 0, elz: 0, fc: 0, soc: .6, h2on: true, pvK: 120, batK: 200, hydK: 5 }, sh.state(lt, u), sh.bare ? { h2on: false, batK: 0, hydK: 0 } : null));
    if (sh.bare) X.flows.forEach(f => { f.target = 0; });
    if (sh.bare && X.cutG.visible) X.mWinRef.emissiveIntensity = 0;      // avant le programme, rien ne tient pendant la coupure : la mairie s'éteint aussi
    if (sh.setup) sh.setup(lt, u);
    const fl = sh.flows ? sh.flows(lt, u) : null;
    X.flows.forEach(f => { let v = f.target; if (fl) v = fl[f.k] != null ? fl[f.k] : (fl._rest != null ? fl._rest * f.target : f.target); f.on = f.target = v; });
    applyLook(sh, lt, u);
    setCam(X.camera, X.controls, sh.cam(u, lt));
    { /* tampon de profondeur peu précis en rendu logiciel : on éloigne le plan proche quand la caméra recule */
      const dn = Math.max(.5, (X.camera.position.distanceTo(X.controls.target) - 60) / 22); if (X.camera.near !== dn) { X.camera.near = dn; X.camera.updateProjectionMatrix(); } }
  }
  window.VClock.step(T0 + t * 1000);
}

/* ---------- habillage ---------- */
const el = { black: $("black"), tag: $("tag"), chapter: $("chapter"), co: $("callouts"), panel: $("panel"), note: $("note"), badge: $("badge"), sup: $("super"), subs: $("subs"), title: $("title") };
let ovShot = null, coEls = [];
function buildOverlays(sh) {
  ovShot = sh; el.co.innerHTML = ""; coEls = [];
  (sh.callouts || []).forEach(c => {
    const d = document.createElement("div"); d.className = "co" + (c.hyp ? " hyp" : "");
    const dx = c.dx == null ? 74 : c.dx, dy = c.dy == null ? -78 : c.dy, left = dx < 0;
    const ex = dx * .5, L = Math.hypot(ex, dy) + Math.abs(dx - ex);
    d.innerHTML = '<svg width="2" height="2"><polyline points="0,0 ' + ex + ',' + dy + ' ' + dx + ',' + dy + '" stroke-dasharray="' + L + '"/></svg><i class="dot"></i><div class="lb"><b></b>' + (c.sub ? "<span></span>" : "") + "</div>";
    const lb = d.querySelector(".lb"); lb.querySelector("b").textContent = c.label; if (c.sub) lb.querySelector("span").textContent = c.sub;
    lb.style.left = (dx + (left ? -8 : 8)) + "px"; lb.style.top = dy + "px"; lb.style.transform = "translate(" + (left ? "-100%" : "0") + ",-50%)";
    el.co.appendChild(d); coEls.push({ c, d, line: d.querySelector("polyline"), lb, L });
  });
  el.panel.innerHTML = ""; if (sh.panel) sh.panel.build(el.panel);
  el.note.textContent = sh.note ? sh.note.text : "";
  if (sh.sup) { el.sup.querySelector(".k").textContent = sh.sup.k; el.sup.querySelector(".h").textContent = sh.sup.h; }
}
function overlays(sh, t, k) {
  if (ovShot !== sh) buildOverlays(sh);
  const lt = t - sh.start, d = sh.end - sh.start, cam = sh.studio ? studio.camera : X.camera;
  cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  coEls.forEach(o => {
    const c = o.c, i0 = c.in == null ? .7 : c.in, o0 = c.out == null ? d - .25 : c.out, a = env(lt, i0, o0, .25, .35) * k;
    const p = typeof c.p === "function" ? c.p(lt) : c.p; v3.set(p[0], p[1], p[2]).project(cam);
    const vis = a > .003 && v3.z < 1 && Math.abs(v3.x) < 1.02 && Math.abs(v3.y) < 1.02;
    o.d.style.display = vis ? "block" : "none"; if (!vis) return;
    o.d.style.transform = "translate(" + ((v3.x + 1) / 2 * 1920).toFixed(2) + "px," + ((1 - v3.y) / 2 * 1080).toFixed(2) + "px)"; o.d.style.opacity = a.toFixed(3);
    o.line.setAttribute("stroke-dashoffset", (o.L * (1 - sstep(ramp(lt, i0, i0 + .5)))).toFixed(1));
    o.lb.style.opacity = sstep(ramp(lt, i0 + .28, i0 + .7)).toFixed(3);
  });
  if (sh.panel) { const a = env(lt, sh.panel.in == null ? .6 : sh.panel.in, sh.panel.out == null ? d - .2 : sh.panel.out, .5, .4) * k; el.panel.style.opacity = a.toFixed(3); if (a > 0) sh.panel.update(el.panel, lt, lt / d); } else el.panel.style.opacity = 0;
  el.note.style.opacity = sh.note ? (env(lt, sh.note.in == null ? .8 : sh.note.in, sh.note.out == null ? d - .2 : sh.note.out) * k).toFixed(3) : 0;
  el.sup.style.opacity = sh.sup ? (env(lt, sh.sup.in == null ? .8 : sh.sup.in, sh.sup.out == null ? d - .3 : sh.sup.out, .7, .6) * k).toFixed(3) : 0;
  const b = sh.badge ? (typeof sh.badge === "function" ? sh.badge(lt) : sh.badge) : null;
  if (b) { el.badge.style.opacity = (env(lt, b.in == null ? .4 : b.in, b.out == null ? d - .15 : b.out, .4, .3) * k).toFixed(3); el.badge.querySelector("i").style.background = b.color || "#55c08f"; el.badge.querySelector("span").innerHTML = b.text; } else el.badge.style.opacity = 0;

  /* repère de séquence */
  const q = TL.sequences.filter(s => s.vstart <= t + 1e-6).pop(), tEnd = TL.titleAt;
  const tagA = q ? sstep(ramp(t, TL.sequences[0].vstart + .4, TL.sequences[0].vstart + 1.2)) * (1 - sstep(ramp(t, tEnd - .6, tEnd))) : 0;
  el.tag.style.opacity = (tagA * .92).toFixed(3);
  if (q) {
    el.tag.innerHTML = "Smart Paese&ensp;·&ensp;<b>" + String(q.n).padStart(2, "0") + "</b> / 06";
    const ls = t - q.vstart, a = env(ls, .35, 5.2, .6, .7) * (t < tEnd ? 1 : 0);
    el.chapter.style.opacity = a.toFixed(3); el.chapter.style.transform = "translateY(" + ((1 - sstep(ramp(ls, .35, 1.1))) * 14).toFixed(1) + "px)";
    el.chapter.querySelector(".n").textContent = "Séquence " + q.n; el.chapter.querySelector(".t").textContent = q.title;
    el.chapter.querySelector("i").style.transform = "scaleX(" + sstep(ramp(ls, .6, 1.6)).toFixed(3) + ")";
  } else el.chapter.style.opacity = 0;

  /* sous-titres */
  const c = TL.cues.find(c => t >= c.start - .02 && t < c.end);
  if (c) { el.subs.firstChild.textContent = c.text; el.subs.style.opacity = Math.min(ramp(t, c.start - .02, c.start + .1), 1 - ramp(t, c.end - .1, c.end)).toFixed(3); } else el.subs.style.opacity = 0;

  /* noir d'ouverture, titre de fin, noir final */
  const fin = sstep(ramp(t, tEnd, tEnd + 1.4)), out = sstep(ramp(t, TL.duration - 1.3, TL.duration - .15));
  // pas de noir d'ouverture quand le film est précédé de l'ouverture cartographique : le montage enchaîne en fondu
  el.black.style.opacity = Math.max(TL.intro ? 0 : 1 - sstep(ramp(t, .15, 1.9)), fin * .66, out).toFixed(3);
  el.title.style.opacity = (sstep(ramp(t, tEnd + .5, tEnd + 1.9)) * (1 - out)).toFixed(3);
  el.title.style.transform = "translateY(" + ((1 - sstep(ramp(t, tEnd + .5, tEnd + 2.2))) * 10).toFixed(1) + "px)";
}

function renderAt(t) {
  const sh = shotAt(t), lt = t - sh.start; let k = 1;
  if (sh.i > 0 && sh.xf > 0 && lt < sh.xf) {          // fondu enchaîné : le plan sortant est rendu, figé dans #snap, puis recouvert
    k = lt / sh.xf; drawShot(shots[sh.i - 1], t);
    if (!scene.noDraw) snapC.drawImage(gl, 0, 0, 1920, 1080);
    snap.style.opacity = (1 - k).toFixed(4);
  } else snap.style.opacity = 0;
  drawShot(sh, t); overlays(sh, t, k);
  return sh.id;
}
/* avant un rendu partiel : quelques images à blanc pour stabiliser les grandeurs lissées de la scène */
function preroll(t) { scene.noDraw = true; for (let i = 12; i > 0; i--) renderAt(Math.max(0, t - i / TL.fps)); scene.noDraw = false; }

/* repérage : rend un point de vue libre sur le village (node scripts/render.mjs --probe fichier.json) */
function probe(q) { const sh = { id: "probe", start: 0, end: 1, i: 0, bare: q.bare, state: () => Object.assign({ day: q.day == null ? 195 : q.day, clock: q.clock == null ? 13 : q.clock }, simAt(q.day == null ? 195 : q.day, q.clock == null ? 13 : q.clock), q.state || {}), cam: () => ({ p: q.p, t: q.t, fov: q.fov || 38 }), look: q.look, scan: q.scan, waves: q.waves };
  [el.tag, el.chapter, el.subs, el.panel, el.note, el.badge, el.sup, el.title, el.co].forEach(e => { e.style.opacity = 0; }); el.black.style.opacity = 0; drawShot(sh, q.time || 5); drawShot(sh, (q.time || 5) + .033); }
window.Film = { renderAt, preroll, probe, shots: shots.map(s => ({ id: s.id, start: s.start, end: s.end, seq: s.seq || null, studio: s.studio || null, xf: s.xf || 0 })), duration: TL.duration, fps: TL.fps,
  ready: (document.fonts && document.fonts.load ? Promise.all(["500 31px Montserrat", "600 23px Montserrat", "700 40px Montserrat", "800 92px Montserrat", "400 16px 'IBM Plex Mono'", "500 15px 'IBM Plex Mono'", "600 21px 'IBM Plex Mono'"].map(f => document.fonts.load(f))) : Promise.resolve()).then(() => true) };
})();
