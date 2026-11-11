/* Smart Paese — ouverture du film : logo du syndicat, puis la Corse en relief 3D sur la mer.
   Les politiques du projet de mandature s'allument sur la Haute-Corse (éclairage public LED par tranches,
   stations de recharge, projets solaires de la SEM), puis la caméra plonge sur le village pilote et la vue
   s'enchaîne en fondu avec la maquette 3D du village.
   Contours, relief, sites, tranches et chiffres : artéfact « Projet de mandature » (artifact-mandature/data/). */
(function () {
"use strict";
const THREE = window.THREE, G = window.ATLAS_GEO, D = window.ATLAS_DATA, DUR = 20.4, FPS = 25, VILLAGE = D.villages.sites[0];
const $ = id => document.getElementById(id);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, u) => a + (b - a) * u;
const sstep = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }, ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const env = (t, i, o, f) => sstep(ramp(t, i, i + f)) * (1 - sstep(ramp(t, o - f, o)));
const T_LED = 6.6, T_IRVE = 10.2, T_SEM = 13.8, T_VIL = 17.0, T_ZOOM = 17.4;

/* ---------- repère : Mercator (radians) × K ; x vers l'est, z vers le sud ---------- */
const K = 6000, un = (p, pr) => [(p[0] - pr.tx) / pr.k * K, (p[1] - pr.ty) / pr.k * K];
const ll = (lon, lat) => [lon * Math.PI / 180 * K, -Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * K];
const com = G.hc.communes.map(c => ({ hors: c.hors, c: un([c.x, c.y], G.hc.proj), r: c.r.map(r => r.map(p => un(p, G.hc.proj))) }));
const sud = G.hc.sud.map(r => r.map(p => un(p, G.hc.proj))), med = G.med.rings.map(r => r.map(p => un(p, G.med.proj)));
let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; const grow = p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); };
com.forEach(c => c.r.forEach(r => r.forEach(grow))); const hc = { x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 };
sud.forEach(r => r.forEach(grow)); const M = 6; x0 -= M; x1 += M; z0 -= M; z1 += M;
const V = ll(VILLAGE.lon, VILLAGE.lat);

/* ---------- masque des terres et texture des communes, dessinés une fois en 2D ---------- */
const TW = 1024, TH = Math.round(TW * (z1 - z0) / (x1 - x0)), px = p => [(p[0] - x0) / (x1 - x0) * TW, (p[1] - z0) / (z1 - z0) * TH];
function cv2(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
function path(q, rings) { q.beginPath(); rings.forEach(r => { r.forEach((p, i) => { const a = px(p); i ? q.lineTo(a[0], a[1]) : q.moveTo(a[0], a[1]); }); q.closePath(); }); }
const mk = cv2(TW, TH), mq = mk.getContext("2d"); mq.fillStyle = "#000"; mq.fillRect(0, 0, TW, TH); mq.filter = "blur(7px)"; mq.fillStyle = "#fff"; path(mq, sud); mq.fill(); com.forEach(c => { path(mq, c.r); mq.fill(); });
const mask = mq.getImageData(0, 0, TW, TH).data;
const sharp = cv2(TW, TH), sq = sharp.getContext("2d"); sq.fillStyle = "#fff"; path(sq, sud); sq.fill(); com.forEach(c => { path(sq, c.r); sq.fill(); }); const land = sq.getImageData(0, 0, TW, TH).data;
const coast = (x, z) => { const u = clamp((x - x0) / (x1 - x0) * TW, 0, TW - 1.001), v = clamp((z - z0) / (z1 - z0) * TH, 0, TH - 1.001), i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, at = (a, b) => mask[(b * TW + a) * 4] / 255;
  return lerp(lerp(at(i, j), at(i + 1, j), fu), lerp(at(i, j + 1), at(i + 1, j + 1), fu), fv); };
const tx = cv2(TW * 2, TH * 2), tq = tx.getContext("2d"); tq.scale(2, 2); tq.fillStyle = "#ffffff"; tq.fillRect(0, 0, TW, TH);
tq.fillStyle = "rgba(150,156,150,.55)"; path(tq, sud); tq.fill();                                   // Corse-du-Sud : hors périmètre, désaturée
const gr = tq.createLinearGradient(0, px([0, hc.z0])[1], 0, px([0, hc.z1])[1]); gr.addColorStop(0, "#F9B23D"); gr.addColorStop(.5, "#F08363"); gr.addColorStop(1, "#E9426C");
tq.lineJoin = "round"; tq.lineWidth = 1.5; tq.strokeStyle = "rgba(70,46,34,.5)"; com.forEach(c => { path(tq, c.r); tq.stroke(); });
tq.lineWidth = .7; tq.strokeStyle = "rgba(255,236,200,.9)"; com.forEach(c => { path(tq, c.r); tq.stroke(); });
tq.lineWidth = 2.6; tq.strokeStyle = gr; tq.beginPath(); tq.globalAlpha = .0; tq.globalAlpha = 1;
const landTex = new THREE.CanvasTexture(tx); landTex.encoding = THREE.sRGBEncoding; landTex.anisotropy = 8;

/* ---------- relief ---------- */
const rnd = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = rnd(xi, yi), b = rnd(xi + 1, yi), c = rnd(xi, yi + 1), d = rnd(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const fbm = (x, y) => { let s = 0, a = 1, f = 1; for (let i = 0; i < 4; i++) { s += a * noise(x * f, y * f); a *= .5; f *= 2; } return s / 1.875; };
const peaks = D.relief.sommets.map(s => ({ p: ll(s[0], s[1]), h: s[2] / 1000, r: s[3] * Math.PI / 180 * K })), EX = 3.4;
/* dorsale de la Corse-du-Sud, pour que l'île ne s'aplatisse pas hors du périmètre (repères d'altitude approximatifs) */
[[9.2, 41.93, 2.1, .12], [9.13, 41.85, 1.9, .1], [9.22, 41.75, 1.6, .1], [9.0, 42.0, 1.5, .1]].forEach(s => peaks.push({ p: ll(s[0], s[1]), h: s[2], r: s[3] * Math.PI / 180 * K }));
function height(x, z) { const c = coast(x, z); if (c < .02) return -1; let h = 0, hs = 0; peaks.forEach(k => { const d2 = (x - k.p[0]) ** 2 + (z - k.p[1]) ** 2, e = k.h * Math.exp(-d2 / (2 * k.r * k.r)); h = Math.max(h, e); hs += e; }); h = h * .8 + Math.min(hs, 3) * .12;
  const ridge = .35 + fbm(x * .09 + 3, z * .09 + 8) * .9; return Math.pow(c, 1.6) * (.12 + (h * (.7 + .5 * fbm(x * .22, z * .22)) + ridge * .45) * EX * .55) - (1 - c) * .4; }
const NX = 230, NZ = Math.round(NX * (z1 - z0) / (x1 - x0)), geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, NX, NZ); geo.rotateX(-Math.PI / 2); geo.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
window.__dbg = { sea: null }; const P = geo.attributes.position, col = new Float32Array(P.count * 3), cc = new THREE.Color(), c2 = new THREE.Color();
for (let i = 0; i < P.count; i++) P.setY(i, height(P.getX(i), P.getZ(i)));
geo.computeVertexNormals(); const Nn = geo.attributes.normal;
for (let i = 0; i < P.count; i++) { const h = P.getY(i), x = P.getX(i), z = P.getZ(i), a = clamp(h / 6.4, 0, 1), dry = fbm(x * .3 + 5, z * .3 + 9);
  cc.setRGB(.36 + dry * .16, .5 + dry * .1, .24).lerp(c2.setRGB(.2, .34, .16), sstep(a * 2.4)).lerp(c2.setRGB(.5, .47, .4), sstep((a - .55) * 2.6)).lerp(c2.setRGB(.9, .9, .88), sstep((a - .9) * 8));
  cc.lerp(c2.setRGB(.5, .47, .4), clamp((.86 - Nn.getY(i)) * 1.4, 0, .5)); if (h < .12) cc.lerp(c2.setRGB(.86, .8, .64), 1 - h / .12);
  col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b; }
geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
/* on ne garde que les triangles de terre : pas de nappe sous la mer autour de l'île */
{ const idx = geo.index.array, keep = []; for (let i = 0; i < idx.length; i += 3) { const a = idx[i], b = idx[i + 1], c = idx[i + 2]; if (P.getY(a) > -.9 || P.getY(b) > -.9 || P.getY(c) > -.9) keep.push(a, b, c); } geo.setIndex(keep); }

/* ---------- scène ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(1920, 1080);
renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .72; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$("stage").appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xcfeaf3); scene.fog = new THREE.Fog(0xcfeaf3, 700, 3200);
const camera = new THREE.PerspectiveCamera(34, 16 / 9, 1, 6000);
scene.add(new THREE.HemisphereLight(0xe8f2fa, 0x55604a, .75));
const sun = new THREE.DirectionalLight(0xfff0dc, 1.9); sun.position.set(-140, 150, 40); sun.target.position.set(hc.cx, 0, hc.cz + 30); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 190, bottom: -190, near: 10, far: 600 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .25; scene.add(sun); scene.add(sun.target);
const island = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: landTex, roughness: .95 }));
{ const uv = geo.attributes.uv; for (let i = 0; i < P.count; i++) uv.setXY(i, (P.getX(i) - x0) / (x1 - x0), 1 - (P.getZ(i) - z0) / (z1 - z0)); }
island.castShadow = island.receiveShadow = true; scene.add(island);
const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshBasicMaterial({ color: 0x4fb2cf })); sea.rotation.x = -Math.PI / 2; sea.position.y = -.05; window.__dbg.sea = sea; window.__dbg.scene = scene; window.__dbg.r = renderer; sea.receiveShadow = true; scene.add(sea);
/* terres voisines (Sardaigne, côtes italienne et française) : à plat, en retrait */
const far = new THREE.MeshStandardMaterial({ color: 0x9fb090, roughness: 1 });
med.forEach(r => { if (r.length < 4) return; const cxm = r.reduce((s, p) => s + p[0], 0) / r.length, czm = r.reduce((s, p) => s + p[1], 0) / r.length;
  if (cxm > x0 - 4 && cxm < x1 + 4 && czm > z0 - 4 && czm < z1 + 4) return;                         // la Corse elle-même est déjà en relief
  const sh = new THREE.Shape(r.map(p => new THREE.Vector2(p[0], -p[1]))), g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, far); m.position.y = .25; m.receiveShadow = true; scene.add(m); });

/* ---------- marqueurs du projet de mandature ---------- */
function disc(draw) { const c = cv2(128, 128), q = c.getContext("2d"); draw(q); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }
const tGlow = disc(q => { const g = q.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.18, "rgba(214,236,255,.95)"); g.addColorStop(.45, "rgba(110,185,245,.45)"); g.addColorStop(1, "rgba(42,134,200,0)"); q.fillStyle = g; q.fillRect(0, 0, 128, 128); });
const tPin = disc(q => { q.beginPath(); q.arc(64, 64, 34, 0, 6.3); q.fillStyle = "#F08363"; q.fill(); q.lineWidth = 9; q.strokeStyle = "#fff"; q.stroke(); });
const tSq = disc(q => { q.fillStyle = "#E9426C"; q.fillRect(30, 30, 68, 68); q.lineWidth = 9; q.strokeStyle = "#fff"; q.strokeRect(30, 30, 68, 68); });
const tVil = disc(q => { q.beginPath(); q.arc(64, 64, 26, 0, 6.3); q.fillStyle = "#fff"; q.fill(); q.beginPath(); q.arc(64, 64, 48, 0, 6.3); q.lineWidth = 8; q.strokeStyle = "rgba(255,255,255,.75)"; q.stroke(); });
function marker(p, tex, size, t0, add) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 0, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })); s.position.set(p[0], Math.max(0, height(p[0], p[1])) + .6, p[1]); s.renderOrder = 5; scene.add(s); return { s, size, t: t0 }; }
const poles = {}; D.irve.poles.forEach(p => { poles[p.id] = ll(p.lon, p.lat); });
const tr = []; D.ep.tranches.forEach((t, i) => t.poles.forEach(id => tr.push({ p: poles[id], i })));
const led = com.filter(c => !c.hors).map((c, n) => { let b = tr[0], bd = 1e9; tr.forEach(q => { const d = Math.hypot(q.p[0] - c.c[0], q.p[1] - c.c[1]); if (d < bd) { bd = d; b = q; } }); return marker(c.c, tGlow, .014, T_LED + .3 + b.i * .62 + ((n * 37) % 20) / 50, true); });
const irve = D.irve.stations.map((s, n) => marker(ll(s.lon, s.lat), tPin, .017, T_IRVE + .3 + n * .08));
const sem = D.sem.projets.map((s, n) => marker(ll(s.lon, s.lat), tSq, .024, T_SEM + .4 + n * .6));
const vil = marker(V, tVil, .034, T_VIL);

/* ---------- caméra : une seule avancée continue, de l'île entière jusqu'au village ---------- */
function pchip(ts, vs, mEnd) { const n = ts.length, d = [], m = new Array(n); for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i])); m[0] = 0; m[n - 1] = mEnd == null ? 0 : d[n - 2] * mEnd;
  for (let i = 1; i < n - 1; i++) { const h0 = ts[i] - ts[i - 1], h1 = ts[i + 1] - ts[i]; m[i] = d[i - 1] * d[i] <= 0 ? 0 : (h0 + h1) * 3 / ((2 * h1 + h0) / d[i - 1] + (h1 + 2 * h0) / d[i]); }
  return t => { t = clamp(t, ts[0], ts[n - 1]); let i = 0; while (i < n - 2 && t > ts[i + 1]) i++; const h = ts[i + 1] - ts[i], u = (t - ts[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * vs[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * vs[i + 1] + (u3 - u2) * h * m[i + 1]; }; }
const KT = [2.6, 5.4, T_ZOOM, DUR], all = { cx: (x0 + x1) / 2 - 20, cz: (z0 + z1) / 2 - 6 }, hx = hc.cx - 34, hz = hc.cz + 4;
const fD = pchip(KT, [560, 250, 205, 16].map(Math.log), 1.5), fE = pchip(KT, [56, 50, 48, 80]), fA = pchip(KT, [6, 0, -7, -3]);
function cam(t) { const d = Math.exp(fD(t)), el = fE(t) * Math.PI / 180, az = fA(t) * Math.PI / 180; let tx_, tz_;
  if (t <= KT[1]) { const w = (1 / 560 - 1 / d) / (1 / 560 - 1 / 250); tx_ = lerp(all.cx, hx, w); tz_ = lerp(all.cz, hz, w); }
  else { const w = (1 / 250 - 1 / d) / (1 / 250 - 1 / 16); tx_ = lerp(hx, V[0], sstep(ramp(w, 0, .5)) * .0 + w ** .55); tz_ = lerp(hz, V[1], w ** .55); }
  const ty = Math.max(0, height(tx_, tz_)) * sstep(ramp(t, T_ZOOM, DUR));
  camera.position.set(tx_ + d * Math.cos(el) * Math.sin(az), ty + d * Math.sin(el), tz_ + d * Math.cos(el) * Math.cos(az)); camera.lookAt(tx_, ty, tz_); return d; }

function drawAt(t) { const d = cam(t), dz = sstep(ramp(t, T_ZOOM + .3, T_ZOOM + 1.6)), farK = 1 - .8 * dz;
  const show = (o, dim) => { const a = sstep(ramp(t, o.t, o.t + .35)) * dim, pop = 1 + .7 * (1 - sstep(ramp(t, o.t, o.t + .5))); o.s.material.opacity = a; o.s.visible = a > .004; const k = d * o.size * pop; o.s.scale.set(k, k, 1); };
  led.forEach(o => show(o, (1 - .55 * sstep(ramp(t, T_IRVE - .2, T_IRVE + .4))) * farK)); irve.forEach(o => show(o, (1 - .45 * sstep(ramp(t, T_SEM - .2, T_SEM + .4))) * farK));
  sem.forEach(o => show(o, (1 - .35 * sstep(ramp(t, T_VIL - .2, T_VIL + .4))) * farK)); show(vil, 1); vil.s.scale.multiplyScalar(1 + .12 * Math.sin((t - T_VIL) * 5));
  renderer.render(scene, camera); }
/* flou de mouvement pendant la plongée : moyenne de plusieurs instants de l'exposition */
const acc = $("acc"), aq = acc.getContext("2d");
function draw(t) { const N = Math.abs(fD(t + .02) - fD(t - .02)) / .04 > .35 ? 8 : 1; acc.style.display = N > 1 ? "block" : "none"; if (N === 1) { drawAt(t); return; }
  for (let k = 0; k < N; k++) { drawAt(t + (k - (N - 1) / 2) / N / FPS * .9); aq.globalAlpha = 1 / (k + 1); aq.drawImage(renderer.domElement, 0, 0); } }

/* ---------- habillage ---------- */
const sup = $("super"), LAB = [
  [3.3, T_LED - .15, "Syndicat départemental d’énergie de Haute-Corse", "Projet de mandature 2026-2032 : les politiques du syndicat sur le territoire"],
  [T_LED, T_IRVE - .1, "Éclairage public", D.ep.objectif + " — objectif"],
  [T_IRVE, T_SEM - .1, "Mobilité électrique", D.irve.pdc_publics_2030 + " points de charge publics en 2030 — objectif"],
  [T_SEM, T_VIL - .1, "SEM énergies renouvelables", "Projets solaires structurants"],
  [T_VIL, DUR - 1.0, "Smart Paese", VILLAGE.secteur + " — localisation indicative"]];
$("note").textContent = "Sites et chiffres illustratifs, à préciser avec les communes et les partenaires";
const LEG = [[T_LED, "led", "Éclairage public LED"], [T_IRVE, "irve", "Bornes de recharge"], [T_SEM, "sem", "Projets solaires de la SEM"], [T_VIL, "vil", "Smart Paese, village pilote"]];
$("legend").innerHTML = "<b>Projet de mandature 2026-2032</b>" + LEG.map(l => "<div class='" + l[1] + "'><i></i>" + l[2] + "</div>").join("");
function renderAt(t) {
  draw(Math.max(t, 2.6));
  $("logo").style.opacity = (1 - sstep(ramp(t, 2.5, 3.3))).toFixed(3);
  $("black").style.opacity = (1 - sstep(ramp(t, .1, .9))).toFixed(3);          // pas de noir en sortie : le film enchaîne en fondu
  const l = LAB.find(l => t >= l[0] && t <= l[1]); sup.style.opacity = l ? env(t, l[0], l[1], .3).toFixed(3) : 0;
  if (l) { sup.querySelector(".k").textContent = l[2]; sup.querySelector(".h").textContent = l[3]; }
  const out = 1 - sstep(ramp(t, T_ZOOM + .9, T_ZOOM + 1.6));
  $("note").style.opacity = (env(t, T_LED, DUR - 1.2, .5) * .9).toFixed(3);
  $("legend").style.opacity = (sstep(ramp(t, T_LED - .2, T_LED + .4)) * out).toFixed(3);
  [...$("legend").querySelectorAll("div")].forEach((e, i) => { e.style.opacity = sstep(ramp(t, LEG[i][0], LEG[i][0] + .5)).toFixed(3); });
  $("shade").style.opacity = (sstep(ramp(t, 3.0, 4.2)) * out).toFixed(3);
  return "intro";
}
window.Film = { renderAt, preroll() {}, shots: [], duration: DUR, fps: FPS,
  ready: Promise.all([document.fonts.load("600 28px Montserrat"), document.fonts.load("500 24px Montserrat"), document.fonts.load("500 15px 'IBM Plex Mono'"), document.fonts.load("400 15px 'IBM Plex Mono'"), new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = "assets/logo-sde2b.jpg"; })]).then(() => true) };
})();
