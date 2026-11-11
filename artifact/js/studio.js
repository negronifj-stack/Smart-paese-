/* Smart Paese — ateliers 3D : on entre dans un équipement, animé et piloté.
   Expose window.Studio.create(renderer, dom) → { scene, camera, controls, open, close, update, active, def, state, goStep }. */
(function () {
"use strict";
window.Studio = { create: function (renderer, dom) {
const THREE = window.THREE, V = (x, y, z) => new THREE.Vector3(x, y, z);
const COL = { ambre: 0xF9B23D, corail: 0xF08363, rose: 0xE9426C, h2: 0x9fd8ff, eau: 0x4fa3dc, data: 0xffffff, grid: 0xc9ccc7, ok: 0x55c08f };
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = (n, d = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030405); scene.fog = new THREE.Fog(0x030405, 45, 120);
const camera = new THREE.PerspectiveCamera(40, 1, .1, 400); camera.position.set(10, 8, 16);
const controls = new THREE.OrbitControls(camera, dom); controls.enableDamping = true; controls.dampingFactor = .08; controls.maxPolarAngle = Math.PI * .49; controls.minDistance = 4; controls.maxDistance = 46; controls.enabled = false; controls.autoRotateSpeed = .55;
scene.add(new THREE.HemisphereLight(0xdfe8f2, 0x20242a, .55));
const key = new THREE.DirectionalLight(0xfff0dc, 2.3); key.position.set(9, 17, 11); key.shadow.radius = 3; key.shadow.normalBias = .03; key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 }); key.shadow.bias = -.0005; scene.add(key);
const rim = new THREE.DirectionalLight(0x8fb8ff, 1.1); rim.position.set(-10, 7, -9); scene.add(rim); const rim2 = new THREE.DirectionalLight(0xE9426C, .22); rim2.position.set(12, 4, -10); scene.add(rim2);
try { if (THREE.RoomEnvironment) { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new THREE.RoomEnvironment(), .04).texture; pm.dispose(); } } catch (e) {}
function concreteTex(rep, joints) { const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d"); g.fillStyle = "#8d8f8d"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 26000; i++) { const v = 120 + Math.random() * 60; g.fillStyle = `rgba(${v},${v},${v},.35)`; g.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5); } for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(40,40,40,${Math.random() * .08})`; g.beginPath(); g.arc(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 70, 0, 6.3); g.fill(); } if (joints) { g.strokeStyle = "rgba(30,30,30,.55)"; g.lineWidth = 3; g.strokeRect(0, 0, 512, 512); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
const floor = new THREE.Mesh(new THREE.CircleGeometry(70, 64), new THREE.MeshStandardMaterial({ color: 0x1b1f24, map: concreteTex(26, true), roughness: .78, metalness: 0, envMapIntensity: .06 })); floor.material.color.convertSRGBToLinear(); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const pad = new THREE.Mesh(new THREE.BoxGeometry(30, .16, 19), new THREE.MeshStandardMaterial({ color: 0x3c4046, map: concreteTex(5, false), roughness: .88, envMapIntensity: .08 })); pad.material.color.convertSRGBToLinear(); pad.position.set(0, -.07, 0); pad.receiveShadow = true; scene.add(pad);
[[0, 9.3, 30, .18], [0, -9.3, 30, .18], [14.9, 0, .18, 18.8], [-14.9, 0, .18, 18.8]].forEach(q => { const l = new THREE.Mesh(new THREE.BoxGeometry(q[2], .02, q[3]), new THREE.MeshStandardMaterial({ color: 0xd9a514, roughness: .6 })); l.material.color.convertSRGBToLinear(); l.position.set(q[0], .02, q[1]); scene.add(l); });
const grid = { position: {} };
function glowTex() { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.25, "rgba(255,255,255,.7)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
const GLOW = glowTex();
function cellTex() { const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d"); g.fillStyle = "#16263a"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "rgba(200,220,240,.5)"; for (let x = 0; x <= 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); } for (let y = 0; y <= 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } g.strokeStyle = "rgba(220,230,240,.25)"; for (let y = 8; y < 128; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }

/* ---------- outils de construction ---------- */
const M = {
  steel: () => new THREE.MeshStandardMaterial({ color: 0xb4b9bd, roughness: .32, metalness: .85 }),
  dark: () => new THREE.MeshStandardMaterial({ color: 0x2b3035, roughness: .5, metalness: .55 }),
  paint: c => new THREE.MeshStandardMaterial({ color: c, roughness: .45, metalness: .3 }),
  copper: () => new THREE.MeshStandardMaterial({ color: 0xc8773a, roughness: .35, metalness: .9 }),
  glass: (c, o) => new THREE.MeshStandardMaterial({ color: c || 0xbfd6e6, roughness: .03, metalness: .0, transparent: true, opacity: (o || .18) * .8, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.6 }),
  lit: (c, i) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i == null ? 1 : i, roughness: .4 }),
  stone: () => new THREE.MeshStandardMaterial({ color: 0x57554e, roughness: 1, flatShading: true }),
  water: () => new THREE.MeshStandardMaterial({ color: 0x3f8fc8, roughness: .08, metalness: .3, transparent: true, opacity: .85, emissive: 0x0b2c44, emissiveIntensity: .6 })
};
function ctx(g) { const C = { g: g, flows: [], spin: [] };
  C.add = (m, x, y, z, p) => { m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; (p || g).add(m); return m; };
  C.box = (w, h, d, m, x, y, z, p) => { const mn = Math.min(w, h, d); let geo; if (mn >= .3 && !(m.map)) { const r = Math.min(.07, mn / 7), sh = new THREE.Shape(); sh.moveTo(-w / 2 + r, -h / 2 + r); sh.lineTo(w / 2 - r, -h / 2 + r); sh.lineTo(w / 2 - r, h / 2 - r); sh.lineTo(-w / 2 + r, h / 2 - r); sh.lineTo(-w / 2 + r, -h / 2 + r); geo = new THREE.ExtrudeGeometry(sh, { depth: d - 2 * r, bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 3, steps: 1 }); geo.translate(0, 0, -(d - 2 * r) / 2); } else geo = new THREE.BoxGeometry(w, h, d); return C.add(new THREE.Mesh(geo, m), x, y, z, p); };
  C.label = (txt, w, x, y, z, ry, p, dark) => { const c = document.createElement("canvas"); c.width = 512; c.height = 128; const q = c.getContext("2d"); q.fillStyle = dark ? "#16191c" : "#f4f4f0"; q.fillRect(0, 0, 512, 128); q.strokeStyle = dark ? "#F9B23D" : "#16191c"; q.lineWidth = 6; q.strokeRect(6, 6, 500, 116); q.fillStyle = dark ? "#f4f4f0" : "#16191c"; q.font = "600 54px Montserrat, Arial, sans-serif"; q.textAlign = "center"; q.textBaseline = "middle"; q.fillText(txt, 256, 68, 470); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshStandardMaterial({ map: t, roughness: .5, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .22 })); m.userData.keep = 1; m.position.set(x, y, z); m.rotation.y = ry || 0; (p || g).add(m); return m; };
  C.sign = (txt, w, x, z) => { C.cyl(.03, .5, M.steel(), x, .25, z, "y"); C.label(txt, w, x, .62, z + .012, 0, null, true); C.label(txt, w, x, .62, z - .012, Math.PI, null, true); };
  C.person = (x, z, ry) => { const h = new THREE.Group(); const leg = M.paint(0x27303a), vest = M.paint(0xe8862a), skin = M.paint(0xd9a98a); [-.12, .12].forEach(dx => C.cyl(.09, .85, leg, dx, .43, 0, "y", h)); C.cyl(.2, .62, vest, 0, 1.17, 0, "y", h, .24); C.box(.5, .08, .06, M.lit(0xe8e8e0, .5), 0, 1.2, .2, h).castShadow = false; [-.3, .3].forEach(dx => C.cyl(.06, .6, vest, dx, 1.15, 0, "y", h)); C.sph(.13, skin, 0, 1.64, 0, h); const hat = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 10, 0, 6.3, 0, 1.6), M.paint(0xf2f2ee)); C.add(hat, 0, 1.67, 0, h); h.position.set(x, 0, z); h.rotation.y = ry || 0; g.add(h); return h; };
  C.bollard = (x, z) => { C.cyl(.09, .9, M.paint(0xd9a514), x, .45, z, "y"); C.cyl(.095, .12, M.dark(), x, .7, z, "y"); };
  C.cyl = (r, h, m, x, y, z, ax, p, r2) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r2 == null ? r : r2, r, h, 28), m); if (ax === "x") o.rotation.z = Math.PI / 2; if (ax === "z") o.rotation.x = Math.PI / 2; return C.add(o, x, y, z, p); };
  C.sph = (r, m, x, y, z, p) => C.add(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), m), x, y, z, p);
  C.curve = pts => new THREE.CatmullRomCurve3(pts.map(q => V(q[0], q[1], q[2])), false, "catmullrom", .2);
  C.pipe = (pts, r, m) => { const c = C.curve(pts); const o = new THREE.Mesh(new THREE.TubeGeometry(c, 80, r, 14), m); o.castShadow = true; g.add(o); if (r >= .07 && !m.transparent) [0, 1].forEach(u => { const f = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.6, r * 1.6, r * .55, 20), M.steel()); f.position.copy(c.getPoint(u)); f.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.getTangent(u)); f.castShadow = true; g.add(f); }); return c; };
  C.cable = pts => C.pipe(pts, .045, M.dark());
  C.flow = (c, n, color, size, speed) => { if (Array.isArray(c)) c = C.curve(c); const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: GLOW, color: color, size: size || .32, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); pts.frustumCulled = false; g.add(pts);
    const f = { c: c, n: n, pts: pts, on: 1, speed: speed || .25, dir: 1, a: 0, ph: 0 }; C.flows.push(f); return f; };
  C.glow = (color, size, x, y, z, p) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 })); s.scale.set(size, size, 1); s.position.set(x, y, z); (p || g).add(s); return s; };
  C.cabinet = (x, y, z, w, h, d, col) => { const b = C.box(w, h, d, M.paint(col || 0x3a4148), x, y + h / 2, z); const scr = C.box(w * .55, h * .22, .02, M.lit(COL.ok, .9), 0, h * .22, d / 2 + .01, b); scr.castShadow = false; b.userData.scr = scr; C.box(.03, h * .86, .015, M.dark(), w * .02, 0, d / 2 + .012, b).castShadow = false; C.box(.04, h * .16, .05, M.steel(), w * .36, -h * .05, d / 2 + .03, b); for (let i = 0; i < 4; i++) C.box(w * .5, .018, .012, M.dark(), -w * .02, -h * .3 - i * .05, d / 2 + .012, b).castShadow = false; return b; };
  C.house = (x, z, s, roof) => { const h = new THREE.Group(); C.box(1.4, 1, 1.2, M.paint(0xe2ded4), 0, .5, 0, h); const r = new THREE.Mesh(new THREE.ConeGeometry(1.15, .7, 4), M.paint(roof || 0x8d5a48)); r.rotation.y = Math.PI / 4; C.add(r, 0, 1.35, 0, h); const w = C.box(.35, .35, .02, M.lit(0xffc27a, 0), 0, .55, .61, h); w.castShadow = false; h.userData.win = w; h.scale.setScalar(s || 1); h.position.set(x, 0, z); g.add(h); return h; };
  C.post = (x, z) => { C.cyl(.09, 3.2, M.steel(), x, 1.6, z); C.box(1.2, .08, .08, M.steel(), x, 3.1, z); return [x, 3, z]; };
  return C; }

/* ====================== TORRENT ====================== */
function hydro(C) {
  const st = { Q: 10.5, H: 60, ilot: 0 }; const ph = () => { const v = .97 * Math.sqrt(2 * 9.81 * st.H), u = .47 * v; return { v: v, u: u, N: 60 * u / (Math.PI * .3), p: 9.81 * st.Q * st.H * .8 / 1000 }; };
  const rk = M.stone(), rnd = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5; return v - Math.floor(v); };
  for (let i = 0; i < 46; i++) { const u = rnd(i, 1), x = -13 + u * 10.6, top = 7.2 - (x + 12.4) * .62, y = rnd(i, 2) * Math.max(.6, top - .4), z = -4.4 + rnd(i, 3) * 3.4, sc = .9 + rnd(i, 4) * 1.3; const o = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), rk); o.scale.set(sc * 1.25, sc * .85, sc); o.rotation.set(rnd(i, 5) * 3, rnd(i, 6) * 3, 0); C.add(o, x, y, z); }
  for (let i = 0; i < 14; i++) { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(.45 + rnd(i, 9) * .5, 0), rk); C.add(o, -2 + rnd(i, 7) * 9, .12, -6.4 + rnd(i, 8) * 2.2); }
  const wtex = (function () { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const q = c.getContext("2d"); q.fillStyle = "#3f86b4"; q.fillRect(0, 0, 64, 256); for (let i = 0; i < 70; i++) { q.fillStyle = `rgba(235,246,255,${.1 + Math.random() * .35})`; q.fillRect(Math.random() * 64, Math.random() * 256, 1.5 + Math.random() * 5, 8 + Math.random() * 34); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); t.encoding = THREE.sRGBEncoding; return t; })();
  const rg = new THREE.PlaneGeometry(1.7, 12.6, 1, 1); rg.rotateX(-Math.PI / 2); rg.rotateY(Math.PI / 2); const river = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: wtex, roughness: .3, metalness: 0, transparent: true, opacity: .95, envMapIntensity: .4 })); river.rotation.z = -.56; river.position.set(-7.4, 4.45, -2.5); river.userData.keep = 1; C.g.add(river);
  C.box(.5, 1.1, 2.4, M.paint(0x6f6c64), -10.6, 6.9, -2.2);                                   // seuil
  C.box(1.1, .9, 2.4, M.paint(0x5d625e), -10.2, 6.75, -.4); C.box(.9, 6.3, .9, M.paint(0x4a4e4b), -10.2, 3.15, .2);   // chambre de mise en charge
  [[-8, 5.5, .5], [-5, 3.6, .5], [-3, 2.0, .2]].forEach(q => C.box(.5, q[1] - .25, .6, M.paint(0x4a4e4b), q[0], (q[1] - .25) / 2, q[2]));
  const pen = C.pipe([[-10, 6.6, .3], [-8, 5.5, .5], [-5, 3.6, .5], [-3, 2.0, .2], [-2.2, 1.25, 0]], .22, M.steel());
  const noz = new THREE.Mesh(new THREE.ConeGeometry(.24, .9, 20), M.copper()); noz.rotation.z = -Math.PI / 2; C.add(noz, -1.75, 1.25, 0);
  const needle = new THREE.Mesh(new THREE.ConeGeometry(.07, .5, 12), M.steel()); needle.rotation.z = -Math.PI / 2; C.add(needle, -1.5, 1.25, 0);
  const wheel = new THREE.Group(); wheel.position.set(.2, 2.5, 0); C.g.add(wheel);
  C.cyl(.95, .22, M.steel(), 0, 0, 0, "z", wheel);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(.27, 12, 8, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd9b25a, roughness: .28, metalness: .9, side: THREE.DoubleSide })); b.position.set(Math.cos(a) * 1.2, Math.sin(a) * 1.2, .15); b.rotation.z = a + Math.PI; b.scale.set(1, 1, .55); b.castShadow = true; wheel.add(b); const b2 = b.clone(); b2.position.z = -.15; wheel.add(b2); const sp = new THREE.Mesh(new THREE.BoxGeometry(.5, .03, .04), b.material); sp.position.set(Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0); sp.rotation.z = a; wheel.add(sp); }
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 1.1, 40, 1, true, Math.PI * .5, Math.PI), M.glass(0xcfe0ea, .16)); shell.rotation.x = Math.PI / 2; shell.position.set(.2, 2.5, 0); C.g.add(shell);
  C.box(4.2, .5, 5.6, M.paint(0x50565b), .4, .25, 1.4);
  C.cyl(.1, 3.4, M.steel(), .2, 2.5, 1.7, "z");
  const stator = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.3, 36, 1, true), M.glass(0x9fb4c4, .22)); stator.rotation.x = Math.PI / 2; stator.position.set(.2, 2.5, 3); C.g.add(stator);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; C.box(.34, .22, 1.1, M.copper(), .2 + Math.cos(a) * .88, 2.5 + Math.sin(a) * .88, 3).rotation.z = a; }
  const rotor = new THREE.Group(); rotor.position.set(.2, 2.5, 3); C.g.add(rotor); C.cyl(.42, 1.1, M.dark(), 0, 0, 0, "z", rotor);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; C.box(.26, .16, 1, M.paint(i % 2 ? 0xd4504a : 0x4a78d4), Math.cos(a) * .5, Math.sin(a) * .5, 0, rotor).rotation.z = a; }
  C.box(1.6, 1.2, 1.5, M.paint(0x50565b), .2, 1.1, 3);
  C.pipe([[.4, .7, -.3], [1.6, .35, -2], [3.5, .2, -4.2], [6.5, .14, -6]], .3, M.water());
  const cab = C.cabinet(4.4, 0, 3.4, 1.5, 2.3, .8); C.label("RÉGULATION", 1.1, 4.4, 2.05, 3.82); C.label("PICO-CENTRALE 5 kW", 2.2, .2, .62, 4.22, 0, null, true); C.person(2.6, 5.4, -.5); [[-2.6, 2.2], [2.9, -1.6], [8.6, 5]].forEach(q => C.bollard(q[0], q[1]));
  const spray = C.flow([[.3, .9, .3], [.9, 1.5, .5], [1.6, .4, .6]], 10, 0xdff2ff, .3, 1.1), spray2 = C.flow([[.1, .9, -.3], [-.5, 1.4, -.5], [-1.1, .4, -.6]], 8, 0xdff2ff, .3, 1.3);
  const bal = C.box(1.3, .9, .9, M.lit(COL.corail, 0), 6.8, .75, 3.4); for (let i = 0; i < 6; i++) C.box(.04, 1, 1, M.steel(), -.55 + i * .22, 0, 0, bal);
  const P = C.post(9.6, 3.4);
  C.cable([[.2, 2.5, 3.7], [1.4, .6, 4.2], [3.4, .5, 3.9], [4.2, 1.2, 3.4]]); C.cable([[5.1, 1.4, 3.4], [6.2, 1.2, 3.4]]); C.cable([[4.6, 2.3, 3.4], [6.5, 3.2, 3.6], P]);
  const fw = C.flow(pen, 30, COL.eau, .5, .35), fj = C.flow([[-1.3, 1.25, 0], [-.4, 1.25, 0], [.2, 1.3, 0]], 8, 0xd8efff, .42, 1.6), ft = C.flow([[.4, .9, -.2], [1.6, .6, -2], [3.5, .5, -4.2], [6.5, .45, -6]], 14, COL.eau, .5, .3);
  const fe = C.flow([[.2, 2.5, 3.7], [1.4, .7, 4.2], [3.4, .6, 3.9], [4.2, 1.3, 3.4]], 12, COL.ambre, .36, .5), fo = C.flow([[4.6, 2.4, 3.4], [6.5, 3.3, 3.6], P], 14, COL.ambre, .36, .5), fb = C.flow([[5.1, 1.5, 3.4], [6.2, 1.3, 3.4]], 5, COL.corail, .36, .8);
  const fr = C.flow([[-11.5, 7.3, -2.4], [-7, 4.3, -2.4], [-2.6, 1.5, -2.4]], 16, 0xbfe2ff, .4, .22);
  return { st: st, title: "Torrent : la pico-centrale", sub: "Une partie du débit est dérivée, mise en pression par la chute, projetée sur une roue. L'alternateur produit jour et nuit ; l'armoire règle le jet.",
    home: [[9, 7.5, 15], [-1, 2.6, .6]],
    steps: [
      ["Prise d'eau", "Un seuil dérive une partie du torrent vers la chambre de mise en charge. Le reste, le débit réservé, continue dans le lit.", [-13, 10, 8], [-9.5, 6, -.5], [-10.2, 7.6, .2]],
      ["Conduite forcée", "L'eau descend dans la conduite. Chaque mètre de chute ajoute de la pression : c'est l'énergie de la centrale.", [-4, 7, 10], [-6, 4, .4], [-6, 4.6, .5]],
      ["Injecteur et roue Pelton", "L'injecteur transforme la pression en un jet rapide. Le jet frappe les augets et fait tourner la roue. Un pointeau règle le débit.", [-4.8, 2.9, 2.6], [-.3, 2, 0], [-1.6, 1.9, 0]],
      ["Alternateur", "La roue entraîne le rotor et ses aimants. En tournant devant les bobines de cuivre, ils y créent le courant.", [4.2, 4.4, 7.4], [.2, 2.4, 3], [.2, 3.9, 3]],
      ["Régulation", "L'armoire mesure la tension et la fréquence. Elle commande le pointeau et, en îlot, dérive les à-coups vers une résistance de délestage.", [8, 4, 9], [5.4, 1.4, 3.4], [4.4, 2.8, 3.4]],
      ["Restitution", "L'eau turbinée retourne au torrent par le canal de fuite. Rien n'est consommé.", [7, 4, -9], [3, .4, -3.6], [3.5, 1, -4.2]]],
    ui: [{ t: "range", k: "Q", label: "Débit turbiné", min: 2, max: 12, step: .5, f: v => fmt(v, 1) + " L/s" }, { t: "range", k: "H", label: "Hauteur de chute", min: 20, max: 120, step: 5, f: v => fmt(v) + " m" }, { t: "seg", k: "ilot", opts: [[0, "Raccordé"], [1, "En îlot"]] }],
    eq: ["v = Cv · √(2 · g · H)          vitesse du jet, Cv = 0,97", "u = 0,47 · v ;  N = 60 · u / (π · D)   roue de 0,30 m", "P = ρ · g · Q · H · η           η = 0,80 de l'eau au réseau"],
    plotCap: "Rendement théorique de la roue selon le rapport entre la vitesse des augets et celle du jet. Le régulateur tient la roue près du sommet.",
    plot: pl => { pl.frame(0, 1, 0, 1, "u / v", "rendement"); pl.line(k => 3.932 * k * (1 - k), "#5fa8d6", 2); pl.dot(.47, 3.932 * .47 * .53, "#F9B23D", "point de marche"); },
    pilot: ["Raccordé : le réseau fixe la fréquence, la turbine produit tout ce que le débit permet.", "En îlot : la batterie fixe la fréquence. Si la production dépasse le besoin et que la batterie est pleine, le pointeau referme le jet ; la résistance absorbe l'écart pendant la manœuvre."],
    read: () => { const f = ph(), need = 3, ex = st.ilot ? Math.max(0, f.p - need) : 0; return [["Vitesse du jet", fmt(f.v, 1) + " m/s"], ["Rotation", fmt(f.N) + " tr/min"], ["Puissance", fmt(f.p, 1) + " kW"], [st.ilot ? "Délestée" : "Fréquence", st.ilot ? fmt(ex, 1) + " kW" : "50,00 Hz"]]; },
    keys: ["Référence du modèle : 5 kW, soit 10,5 L/s sous 60 m de chute", "Dans le modèle annuel : pleine puissance de novembre à mai, 20 % à l'étiage", "Sans le torrent, la tenue à 72 heures tombe de 97 % à 66 %"],
    warn: ["Autorisation au titre de la loi sur l'eau, débit réservé, continuité écologique", "Tous les villages n'ont pas la ressource : c'est un critère de choix", "La turbine peut aussi se placer sur l'adduction d'eau potable, comme à Cozzano"],
    update: (dt) => { const q = Math.min(1, st.Q / 12), f = ph(), w = 2 + f.N / 110; wheel.rotation.z += dt * w; rotor.rotation.z += dt * w; needle.position.x = -1.5 - .22 * (1 - q);
      fw.speed = .15 + .3 * q; fj.speed = .5 + f.v / 22; fe.speed = fo.speed = .15 + f.p / 10; const ex = st.ilot && f.p > 3; fb.on = ex ? 1 : 0; bal.material.emissiveIntensity += ((ex ? 1.2 : 0) - bal.material.emissiveIntensity) * .08; fr.speed = .22; wtex.offset.y += dt * (.5 + q); spray.on = spray2.on = q > .25 ? .8 : .3; } };
}

/* ====================== SOLAIRE ====================== */
function solaire(C) {
  const st = { sun: .9, T: 45, ilot: 0 };
  const tex = cellTex(), mp = new THREE.MeshStandardMaterial({ map: tex, roughness: .15, metalness: .55, emissive: 0x2a4a7a, emissiveIntensity: 0 });
  const arr = new THREE.Group(); arr.position.set(-5.2, 2.06, .28); arr.rotation.x = .62; C.g.add(arr);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { C.box(2, .07, 1.15, mp, (i - 1) * 2.08, 0, (j - .5) * 1.22, arr); }
  C.box(6.4, .08, .1, M.steel(), 0, -.1, 1.2, arr); C.box(6.4, .08, .1, M.steel(), 0, -.1, -1.2, arr);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const cx = (i - 1) * 2.08, cz = (j - .5) * 1.22; [[0, .59, 2.04, .05], [0, -.59, 2.04, .05], [1.01, 0, .05, 1.2], [-1.01, 0, .05, 1.2]].forEach(q => C.box(q[2], .09, q[3], M.steel(), cx + q[0], .005, cz + q[1], arr)); }
  const wallM = new THREE.MeshStandardMaterial({ color: 0xd8d0c0, map: concreteTex(2, false), roughness: .95 }), roofM = new THREE.MeshStandardMaterial({ color: 0xa8644a, roughness: .85 });
  C.box(7.6, 1.5, 3.4, wallM, -5.2, .75, -.2); const rf = C.box(8, .14, 4.1, roofM, -5.2, 1.86, .25); rf.rotation.x = .62; const rf2 = C.box(8, .14, 2.2, roofM, -5.2, 2.5, -1.9); rf2.rotation.x = -.62;
  [-7.4, -5.2, -3].forEach(x => { C.box(.9, .9, .05, M.dark(), x, .8, 1.52); }); C.label("ÉCOLE", 1.4, -5.2, 1.34, 1.53); C.person(-1.2, 2.6, .6);
  /* panneau éclaté */
  const ex = new THREE.Group(); ex.position.set(-5.2, 5.2, .4); ex.rotation.x = .62; C.g.add(ex);
  const l1 = C.box(2, .04, 1.15, M.glass(0xd8ecf8, .28), 0, .5, 0, ex), l2 = C.box(2, .04, 1.15, mp, 0, 0, 0, ex), l3 = C.box(2, .04, 1.15, M.paint(0xf1f1ec), 0, -.5, 0, ex); l1.castShadow = false;
  const sun = C.glow(0xffe2a0, 9, 4, 12.5, 7);
  const ph = []; for (let i = 0; i < 6; i++) ph.push(C.flow([[4 - i * .3, 12, 7], [-7.2 + i * .8, 2.4 + (i % 2) * .5, .6 + (i % 2) * .5]], 7, 0xffe6a8, .26, .5 + i * .03));
  C.box(3.4, 3.2, .2, new THREE.MeshStandardMaterial({ color: 0xcfc9bb, map: concreteTex(1.5, false), roughness: .95 }), 1.6, 1.6, -.5); C.label("ONDULEUR", .9, 1.6, 2.62, -.38); C.label("TABLEAU", .8, 4.6, 2.1, .27);
  const inv = C.cabinet(1.6, .6, -.15, 1.3, 1.7, .5, 0xdfe3e6); for (let i = 0; i < 7; i++) C.box(.05, .5, .3, M.steel(), -.5 + i * .17, -.95, 0, inv);
  const tab = C.cabinet(4.6, 0, 0, 1, 1.9, .5, 0x3a4148);
  const bat = C.box(2.2, 1.1, 1, M.paint(0x3b4046), 8, .55, 2.4); C.box(2.22, .1, 1.02, M.lit(COL.ambre, .8), 0, .35, 0, bat);
  const hs = C.house(8, -2.2, 1.1);
  C.cable([[-5.2, 1.0, 1.4], [-3, .12, 1.6], [0, .12, .8], [1.6, .7, .1]]); C.cable([[2.2, 1.4, -.1], [3.4, 1.6, 0], [4.1, 1.2, 0]]); C.cable([[5.1, 1, 0], [6.4, .15, 1.2], [7.2, .6, 2.4]]); C.cable([[5.1, 1, 0], [6.4, .15, -1.2], [7.3, .5, -2.2]]);
  const dc = C.flow([[-5.2, 1.1, 1.4], [-3, .22, 1.6], [0, .22, .8], [1.6, .8, .1]], 16, COL.h2, .32, .35), ac = C.flow([[2.2, 1.5, -.1], [3.4, 1.7, 0], [4.1, 1.3, 0]], 6, COL.ambre, .36, .7);
  const fb = C.flow([[5.1, 1.1, 0], [6.4, .25, 1.2], [7.2, .7, 2.4]], 8, COL.ambre, .34, .5), fh = C.flow([[5.1, 1.1, 0], [6.4, .25, -1.2], [7.3, .6, -2.2]], 8, COL.ambre, .34, .5);
  const A = .075, voc = (G, T) => (1 + .06 * Math.log(Math.max(G, .02))) * (1 - .003 * (T - 25));
  const iv = (v, G, T) => { const vo = voc(G, T), i0 = G / (Math.exp(vo / A) - 1); return Math.max(0, G - i0 * (Math.exp(v / A) - 1)); };
  const mpp = (G, T) => { let b = 0, bv = 0; for (let v = 0; v <= 1.15; v += .004) { const q = v * iv(v, G, T); if (q > b) { b = q; bv = v; } } return { p: b, v: bv }; };
  const KW = 120 / mpp(1, 25).p;
  const calc = () => { const m = mpp(st.sun, st.T), dispo = m.p * KW, need = 26; let p = dispo, v = m.v; if (st.ilot && dispo > need) { p = need; for (v = voc(st.sun, st.T); v > m.v; v -= .002) if (v * iv(v, st.sun, st.T) * KW >= need) break; } return { dispo: dispo, p: p, v: v, vm: m.v, cut: dispo > 0 ? 1 - p / dispo : 0 }; };
  return { st: st, title: "Solaire : du rayon au réseau", sub: "La lumière libère des charges dans les cellules. Les panneaux en série fournissent un courant continu que l'onduleur convertit et règle.",
    home: [[6, 8, 15], [0, 2.4, .4]],
    steps: [
      ["La lumière", "Le rayonnement arrive sur les panneaux inclinés. La puissance suit l'ensoleillement : faites varier le curseur.", [-2, 9, 13], [-3, 4, 1], [-1.2, 7, 3.6]],
      ["La cellule", "Sous le verre, des cellules de silicium. Chaque grain de lumière absorbé libère une charge électrique : c'est l'effet photovoltaïque.", [-8.6, 7.4, 4.6], [-5.2, 5, .4], [-5.2, 6.2, .1]],
      ["Le courant continu", "Les panneaux sont reliés en série. Leurs tensions s'ajoutent et un courant continu descend vers l'onduleur.", [-5, 3.2, 8], [-2.6, .8, 1], [-3, .7, 1.6]],
      ["L'onduleur", "Il cherche en permanence la tension où les panneaux donnent le plus, puis convertit le courant continu en courant alternatif.", [3.4, 3, 6], [1.8, 1.4, 0], [1.6, 2.7, .1]],
      ["Le pilotage", "En îlot, quand la batterie est pleine, son convertisseur élève légèrement la fréquence. Les onduleurs solaires le détectent et réduisent d'eux-mêmes leur puissance.", [6.4, 4.4, 8.4], [4, 1.2, .4], [4.6, 2.3, 0]],
      ["Le partage", "Le courant sert d'abord les bâtiments communaux, puis les habitants, puis la batterie.", [12, 5, 6], [7, .8, 0], [8, 2.2, -2.2]]],
    ui: [{ t: "range", k: "sun", label: "Éclairement", min: 0, max: 1, step: .05, f: v => fmt(v * 1000) + " W/m²" }, { t: "range", k: "T", label: "Température des cellules", min: 10, max: 70, step: 5, f: v => fmt(v) + " °C" }, { t: "seg", k: "ilot", opts: [[0, "Raccordé"], [1, "Îlot, batterie pleine"]] }],
    eq: ["I = Iph − I₀ · (exp(V / (n · Ns · Vt)) − 1)", "P = V · I            maximale au point MPP", "Tension à vide : − 0,3 % par degré (valeur typique)"],
    plotCap: "Puissance du champ selon la tension de chaîne. L'onduleur se place au sommet ; en îlot, batterie pleine, il s'en écarte vers la tension à vide pour ne fournir que le besoin.",
    plot: pl => { const c = calc(); pl.frame(0, 900, 0, 130, "V", "kW"); pl.line(V => { const v = V / 800; return v * iv(v, st.sun, st.T) * KW; }, "#F9B23D", 2); pl.dot(c.vm * 800, c.dispo, "#ecece8", c.cut > .01 ? "" : "MPP"); if (c.cut > .01) pl.dot(c.v * 800, c.p, "#E9426C", "écrêté"); },
    pilot: ["Raccordé : l'onduleur se cale sur le réseau et produit le maximum disponible.", "En îlot : la fréquence sert de signal. Elle monte quand la batterie est pleine, les onduleurs écrêtent ; elle redescend, ils reprennent. Aucune liaison de commande n'est nécessaire."],
    read: () => { const c = calc(); return [["Disponible", fmt(c.dispo) + " kW"], ["Produite", fmt(c.p) + " kW" + (c.cut > .01 ? " (− " + fmt(c.cut * 100) + " %)" : "")], ["Tension de chaîne", fmt(c.v * 800) + " V"], ["Fréquence", st.ilot && c.cut > .01 ? "> 50,2 Hz" : "50,0 Hz"]]; },
    keys: ["Référence du modèle : 120 kWc sur les toits publics et une ombrière", "1 300 kWh par kWc et par an, repère relevé à Prunelli-di-Fiumorbo", "Plafond de 0,5 MW pour une opération d'autoconsommation collective en Corse"],
    warn: ["Masque du relief et de la végétation à relever site par site", "Toitures : état de la charpente et de la couverture avant pose", "Onduleurs à choisir compatibles avec le fonctionnement en îlot"],
    update: (dt, sec) => { const c = calc(), k = c.p / 120; sun.material.opacity = .25 + .7 * st.sun; mp.emissiveIntensity = .5 * st.sun; ph.forEach(f => f.on = st.sun > .03 ? .35 + .65 * st.sun : 0);
      dc.on = ac.on = k > .01 ? 1 : 0; dc.speed = .12 + .5 * k; ac.speed = .3 + .8 * k; fh.on = k > .01 ? 1 : 0; fb.on = k > .01 && !st.ilot ? 1 : 0; hs.userData.win.material.emissiveIntensity = k > .01 ? 1 : .1;
      inv.userData.scr.material.color.setHex(st.ilot && c.cut > .01 ? COL.ambre : COL.ok); inv.userData.scr.material.emissive.setHex(st.ilot && c.cut > .01 ? COL.ambre : COL.ok); l1.position.y = .5 + .06 * Math.sin(sec * 1.2); l3.position.y = -.5 - .06 * Math.sin(sec * 1.2); } };
}

/* ====================== BATTERIE ====================== */
function batterie(C) {
  const st = { mode: 0, soc: .55, load: 7 }; const pw = () => st.mode === 0 ? (st.soc < .979 ? -60 : 0) : st.mode === 1 ? (st.soc > .401 ? 40 : 0) : st.load;
  C.box(9.4, .3, 3, M.paint(0x3b4046), 0, .15, 0); C.box(9.4, 2.9, .12, M.paint(0x4a5057), 0, 1.75, -1.44); C.box(.12, 2.9, 3, M.paint(0x4a5057), -4.64, 1.75, 0);
  for (let i = 0; i < 30; i++) C.box(.07, 2.8, .06, M.paint(0x566069), -4.5 + i * .31, 1.75, -1.52);
  C.box(.1, 2.9, 1.5, M.paint(0x566069), 4.7, 1.75, 2.1).rotation.y = .5; C.box(.1, 2.9, 1.5, M.paint(0x566069), 4.7, 1.75, -2.1).rotation.y = -.5;
  C.label("BATTERIE 200 kWh", 2.6, -1.4, 2.5, -1.36); C.label("CONVERTISSEUR", 1.3, 3.3, 2.75, .93); C.person(6.2, 2.8, -.9); [[8, 2.4], [8, -2.4], [-6.6, 2.4]].forEach(q => C.bollard(q[0], q[1]));
  const roof = C.box(9.4, .12, 3, M.glass(0x9fb4c4, .2), 0, 3.24, 0); roof.castShadow = false; const front = C.box(9.4, 2.9, .06, M.glass(0xcfe0ea, .1), 0, 1.75, 1.46); front.castShadow = false;
  const mods = [];
  for (let i = 0; i < 5; i++) { const x = -3.9 + i * 1.22; C.box(1.06, 2.7, .08, M.dark(), x, 1.65, -.55);
    for (let j = 0; j < 9; j++) { const m = C.box(.98, .23, 1.1, new THREE.MeshStandardMaterial({ color: 0x2f353b, roughness: .5, metalness: .4, emissive: COL.ambre, emissiveIntensity: 0 }), x, .48 + j * .275, 0); mods.push({ m: m, lv: (j + .5) / 9 }); C.box(.08, .08, .02, M.lit(COL.ok, 1), .38, 0, .56, m).castShadow = false; }
    C.box(.9, .12, .5, M.paint(0x1f6fb5), x, 3.02, 0); }
  C.box(6.2, .08, .16, M.copper(), -1.45, 3.14, .7);
  const pcs = C.cabinet(3.3, .3, 0, 1.7, 2.6, 1.8, 0x2c3238); [-.5, 0, .5].forEach(z => C.cyl(.22, .9, M.copper(), 3.3, 1.2, z, "y"));
  const hv = C.box(1.2, 1.5, 1.6, M.paint(0xd9dde0), -5.5, 1.2, 0), fan = new THREE.Group(); fan.position.set(-.61, 0, 0); hv.add(fan); for (let i = 0; i < 4; i++) { const b = C.box(.03, .6, .16, M.dark(), 0, 0, 0, fan); b.rotation.x = i * Math.PI / 2; b.position.set(0, Math.cos(i * Math.PI / 2) * .3, Math.sin(i * Math.PI / 2) * .3); }
  const tr = C.box(1.5, 1.6, 1.2, M.paint(0x5d646b), 6.6, .8, 0); for (let i = 0; i < 6; i++) C.box(.06, 1.2, 1.4, M.steel(), -.6 + i * .24, 0, 0, tr); [-.35, 0, .35].forEach(z => C.cyl(.07, .5, M.paint(0x8a4b2e), 6.6, 1.85, z, "y"));
  const P = C.post(9.4, 0); C.cable([[4.2, 1.6, 0], [5.2, 1.9, 0], [5.9, 1.5, 0]]); C.cable([[6.6, 2.1, 0], [8, 3, 0], P]);
  const res = C.box(6.3, .03, 1.3, M.lit(COL.rose, .9), -1.45, .34 + 2.48 * .4, 0); res.castShadow = false; res.material.transparent = true; res.material.opacity = .5;
  const fa = C.flow([P, [8, 3.1, 0], [6.6, 2.2, 0], [5.2, 2, 0], [4.2, 1.7, 0]], 16, COL.ambre, .36, .5), fd = C.flow([[3.3, 3, .7], [1, 3.25, .7], [-2, 3.25, .7], [-4.4, 3.25, .7]], 14, COL.rose, .34, .5);
  const wave = C.glow(COL.rose, 5, 3.3, 3.6, 0);
  return { st: st, title: "Batterie communale", sub: "Des modules au lithium stockent le solaire de midi. Un convertisseur les relie au réseau ; en coupure, c'est lui qui reforme le courant du village.",
    home: [[7, 6.5, 13], [0, 1.7, 0]],
    steps: [
      ["Les modules", "Cinq baies de modules au lithium. Leur niveau monte à la charge et descend à la décharge.", [-3, 3.6, 8], [-1.6, 1.7, 0], [-1.5, 3.6, .2]],
      ["La surveillance", "Chaque baie mesure tension et température de ses cellules. Elle isole un module au moindre écart : c'est la première sécurité.", [-5, 4.6, 5.4], [-3, 2.6, 0], [-3.9, 3.5, 0]],
      ["Le convertisseur", "Il transforme le courant alternatif du réseau en courant continu pour charger, et l'inverse pour restituer.", [6.4, 3.4, 6.4], [3.6, 1.6, 0], [3.3, 3.3, 0]],
      ["La réserve de coupure", "En marche normale, la batterie ne descend pas sous 40 % : cette part est gardée pour le refuge. Le trait rose marque ce plancher.", [0, 2.6, 8.6], [-1.4, 1.4, 0], [1.9, 1.5, .8]],
      ["La formation du réseau", "Quand la ligne tombe, le convertisseur ne suit plus le réseau : il fabrique lui-même la tension et la fréquence. Les autres sources se calent sur lui.", [9, 5, 8], [4.6, 2, 0], [3.3, 3.6, 0]],
      ["Le froid et la sécurité", "Une climatisation tient les modules à température. Détection incendie et coupure d'urgence complètent l'ensemble.", [-10, 4, 6], [-5, 1.4, 0], [-5.5, 2.4, 0]]],
    ui: [{ t: "seg", k: "mode", opts: [[0, "Charge"], [1, "Décharge"], [2, "Îlot"]] }, { t: "range", k: "load", label: "En îlot : puissance demandée", min: -60, max: 60, step: 1, f: v => (v < 0 ? "− " : "") + fmt(Math.abs(v)) + " kW" }],
    eq: ["f = f₀ − k · P        statisme : 1 Hz pour 100 kW", "U = U₀ − kq · Q       même loi pour la tension", "dSOC/dt = − P / (η · E)    E = 200 kWh"],
    plotCap: "Loi de statisme du convertisseur en îlot. Une demande fait baisser la fréquence ; un surplus solaire la fait monter, et au-delà de 50,2 Hz les onduleurs solaires écrêtent. La fréquence sert de signal commun.",
    plot: pl => { const P = pw(); pl.frame(-100, 100, 48.8, 51.2, "kW", "Hz"); pl.hline(50.2, "rgba(249,178,61,.8)", "écrêtage solaire"); if (st.mode === 2) { pl.line(x => 50 - x / 100, "#E9426C", 2); pl.dot(P, 50 - P / 100, "#ecece8", "îlot"); } else { pl.line(x => 50 - x / 100, "rgba(233,66,108,.35)", 1.5, [4, 4]); pl.line(() => 50, "#ecece8", 2); pl.dot(P, 50, "#ecece8", "réseau"); } },
    pilot: ["Ordre de priorité à la charge : le surplus solaire va d'abord à la batterie.", "À la décharge, elle s'arrête à la réserve de 40 %. En îlot, elle descend jusqu'à 10 % et forme le réseau à 50 Hz."],
    read: () => { const P = pw(); return [["Charge", fmt(st.soc * 100) + " %"], ["Puissance", P === 0 ? "0 kW" : (P < 0 ? "reçoit " : "fournit ") + fmt(Math.abs(P)) + " kW"], ["Fréquence", st.mode === 2 ? fmt(50 - P / 100, 2) + " Hz" : "50,00 Hz, réseau"], ["Régime", fmt(Math.abs(P) / 200, 2) + " C"]]; },
    keys: ["Référence du modèle : 200 kWh utiles, convertisseur de 100 kW", "Rendement de 95 % à la charge et à la décharge", "Sous 100 kWh, la tenue à 72 heures tombe à 75 %"],
    warn: ["Emplacement : accès pompiers, distance aux bâtiments, ventilation", "Convertisseur capable de former le réseau : à exiger au cahier des charges", "Fin de vie : reprise des modules à prévoir au marché"],
    update: (dt, sec) => { const P = pw(), lo = st.mode === 1 ? .4 : .1; st.soc = Math.min(.98, Math.max(lo, st.soc - P / 1200 * dt)); if (st.mode === 0 && st.soc >= .979) st.soc = .2; if (st.mode === 2 && st.soc <= .101) st.soc = .9; if (st.mode === 2 && st.soc >= .979 && P < 0) st.soc = .45;
      const act = Math.abs(P) > .5; mods.forEach(o => { const on = o.lv < st.soc; o.m.material.emissiveIntensity += ((on ? .85 : 0) - o.m.material.emissiveIntensity) * .1; o.m.material.emissive.setHex(o.lv < .4 ? COL.rose : COL.ambre); });
      fa.on = fd.on = act ? 1 : 0; fa.dir = fd.dir = P < 0 ? 1 : -1; fa.speed = fd.speed = .15 + Math.abs(P) / 120; fan.rotation.x += dt * 9; wave.material.opacity = st.mode === 2 ? .35 + .35 * Math.sin(sec * 6) : 0; } };
}

/* ====================== HYDROGÈNE ====================== */
function hydrogene(C) {
  const st = { mode: 0, kg: 8, pw: 1 }; const ue = j => 1.42 + .05 * Math.log(1 + j / .01) + .12 * j, uf = j => 1 - .05 * Math.log(1 + j / .01) - .25 * j;
  C.cyl(.8, 2.2, M.water(), -9, 1.1, 0, "y"); C.cyl(.84, .12, M.steel(), -9, 2.25, 0, "y");
  const cs = C.box(2.6, 2.3, 1.7, M.glass(0xcfe0ea, .14), -5.6, 1.5, 0); cs.castShadow = false; C.box(2.8, .35, 1.9, M.paint(0x50565b), -5.6, .18, 0);
  for (let i = 0; i < 16; i++) C.box(.08, 1.5, 1.3, M.paint(i % 2 ? 0x8fa4b8 : 0xdfe5ea), -6.65 + i * .14, 1.25, 0); [-6.8, -4.4].forEach(x => C.box(.16, 1.8, 1.5, M.steel(), x, 1.3, 0));
  const eg = C.glow(COL.h2, 4.5, -5.6, 1.6, 0);
  const s1 = C.cyl(.4, 2.4, M.glass(0x9fd8ff, .3), -2.6, 1.5, .8, "y"), s2 = C.cyl(.4, 2.4, M.glass(0xffffff, .22), -2.6, 1.5, -.8, "y"); s1.castShadow = s2.castShadow = false;
  C.box(1.5, 1.2, 1.2, M.paint(0x3f464d), 0, .6, .8); const cy = C.cyl(.32, 1, M.steel(), 0, 1.7, .8, "y"); const piston = C.cyl(.2, .7, M.copper(), 0, 2.3, .8, "y");
  const bottles = []; for (let i = 0; i < 6; i++) { const x = 2.6 + (i % 3) * .95, z = i < 3 ? .5 : -.5; C.cyl(.38, 3, M.paint(0xf1f3f4), x, 1.6, z, "y"); C.sph(.38, M.paint(0xf1f3f4), x, 3.1, z); const lv = C.cyl(.4, 1, M.lit(COL.h2, .9), x, .6, z, "y"); lv.castShadow = false; bottles.push(lv); }
  C.box(3.4, .2, 1.8, M.dark(), 3.55, .1, 0);
  const fcs = C.box(1.9, 1.9, 1.5, M.glass(0xffe3b0, .14), 6.9, 1.3, 0); fcs.castShadow = false; C.box(2.1, .35, 1.7, M.paint(0x50565b), 6.9, .18, 0); for (let i = 0; i < 11; i++) C.box(.08, 1.3, 1.1, M.paint(i % 2 ? 0xe2a04a : 0x4a4f55), 6.2 + i * .14, 1.15, 0);
  const fg = C.glow(COL.ambre, 4, 6.9, 1.5, 0);
  C.label("ÉLECTROLYSEUR", 1.9, -5.6, 2.95, .86, 0, null, true); C.label("H₂", .8, 3.55, 3.75, .95, 0, null, true); C.label("PILE À COMBUSTIBLE", 1.9, 6.9, 2.55, .76, 0, null, true); C.label("EAU", .7, -9, 1.3, .82);
  [[-1.4, .62, .8], [2, .62, .45], [5, .62, 0]].forEach(q => { C.cyl(.05, .35, M.steel(), q[0], q[1] + .2, q[2], "y"); const w = new THREE.Mesh(new THREE.TorusGeometry(.14, .025, 8, 20), M.paint(0xc8322c)); w.rotation.x = Math.PI / 2; C.add(w, q[0], q[1] + .4, q[2]); });
  C.person(.2, 3.2, .2); [[-10.4, 2], [-3.6, 2.6], [5, 2.6], [10.2, 2]].forEach(q => C.bollard(q[0], q[1]));
  const inv = C.cabinet(9.1, 0, 0, 1, 1.9, .7), P = C.post(11, 0), Pin = C.post(-7.6, 3.2);
  C.pipe([[-8.2, 1, 0], [-7.4, .6, 0], [-6.8, .8, 0]], .1, M.water());
  C.pipe([[-5.2, 2.6, .5], [-4, 3.1, .8], [-2.6, 2.7, .8]], .08, M.steel()); C.pipe([[-5.2, 2.6, -.5], [-4, 3.1, -.8], [-2.6, 2.7, -.8]], .08, M.steel()); C.pipe([[-2.6, 2.7, -.8], [-2.6, 4.4, -.8]], .08, M.steel());
  C.pipe([[-2.2, 1, .8], [-1.2, .5, .8], [-.75, .7, .8]], .08, M.steel()); C.pipe([[.75, .7, .8], [1.6, .5, .6], [2.6, .45, .2], [4.5, .45, 0]], .08, M.steel()); C.pipe([[4.5, .45, 0], [5.4, .5, 0], [5.95, 1, 0]], .08, M.steel());
  C.cable([Pin, [-6.6, 2.8, 1.6], [-5.6, 2.7, .7]]); C.cable([[7.8, 1.3, 0], [8.6, 1.2, 0]]); C.cable([[9.6, 1.6, 0], [10.4, 2.8, 0], P]);
  const fin = C.flow([Pin, [-6.6, 2.9, 1.6], [-5.6, 2.8, .7]], 9, COL.ambre, .36, .6), fwt = C.flow([[-8.2, 1.1, 0], [-7.4, .7, 0], [-6.8, .9, 0]], 5, COL.eau, .34, .5);
  const fh = C.flow([[-5.2, 2.7, .5], [-4, 3.2, .8], [-2.6, 2.8, .8], [-2.6, 1.2, .8], [-1.2, .6, .8], [-.75, .8, .8]], 16, COL.h2, .34, .3), fo = C.flow([[-5.2, 2.7, -.5], [-4, 3.2, -.8], [-2.6, 2.8, -.8], [-2.6, 5.4, -.8]], 12, 0xffffff, .28, .3);
  const fst = C.flow([[.75, .8, .8], [1.6, .6, .6], [2.6, .55, .2], [4.5, .55, 0]], 10, COL.h2, .34, .4), ffc = C.flow([[4.5, .55, 0], [5.4, .6, 0], [5.95, 1.1, 0]], 6, COL.h2, .34, .5);
  const fel = C.flow([[7.8, 1.4, 0], [8.6, 1.3, 0], [9.6, 1.7, 0], [10.4, 2.9, 0], P], 14, COL.ambre, .36, .5), fht = C.flow([[6.9, 2.3, 0], [7.1, 3.6, .2], [6.8, 5, 0]], 8, COL.corail, .5, .3), fdr = C.flow([[6.9, .4, .9], [6.9, .2, 1.6], [6.9, .05, 2.2]], 4, COL.eau, .3, .5);
  const bub1 = C.flow([[-2.6, .5, .8], [-2.6, 2.6, .8]], 9, COL.h2, .2, .7), bub2 = C.flow([[-2.6, .5, -.8], [-2.6, 2.6, -.8]], 7, 0xffffff, .2, .7);
  return { st: st, title: "Hydrogène : le stock de longue durée", sub: "Tranche conditionnelle. Le surplus sépare l'eau en hydrogène et oxygène. L'hydrogène, comprimé, se garde des semaines ; une pile le reconvertit en électricité.",
    home: [[3, 8, 17], [1, 1.8, 0]],
    steps: [
      ["Le surplus", "L'électrolyseur ne démarre que si la batterie est pleine et que le solaire produit encore. Il ne soutire jamais au réseau.", [-10, 5, 8], [-6.6, 2, .8], [-7.6, 3.8, 3.2]],
      ["L'électrolyse", "Entre les plaques, le courant casse la molécule d'eau. L'hydrogène sort d'un côté, l'oxygène de l'autre.", [-6.4, 3.2, 5.6], [-5.6, 1.4, 0], [-5.6, 3, 0]],
      ["La séparation", "Deux colonnes retirent l'eau entraînée par les gaz. L'oxygène est rejeté à l'air ; l'hydrogène est séché.", [-1, 4, 6], [-2.8, 2, 0], [-2.6, 3.2, .8]],
      ["La compression et le stockage", "Un compresseur porte le gaz sous pression dans les bouteilles. Ce stock ne se décharge pas avec le temps.", [3, 4.4, 7.6], [2, 1.4, .3], [3.55, 3.8, 0]],
      ["La pile à combustible", "L'hydrogène se recombine avec l'oxygène de l'air. La réaction donne de l'électricité, de la chaleur et de l'eau.", [9.4, 3.6, 6.4], [7, 1.4, 0], [6.9, 2.7, 0]],
      ["Le pilotage", "La pile ne démarre qu'en îlot, quand la batterie atteint son plancher. Elle tient la charge critique et laisse la batterie former le réseau.", [13, 5.4, 8], [8.6, 1.6, 0], [9.1, 2.3, 0]]],
    ui: [{ t: "seg", k: "mode", opts: [[0, "Stocker"], [1, "Restituer"]] }, { t: "range", k: "pw", label: "Niveau de charge", min: .2, max: 1, step: .05, f: v => fmt(v * 100) + " %" }],
    eq: ["Faraday : débit H₂ = I · N / (2 · F)", "Énergie = U cellule × 26,6 kWh par kg, + 6 % d'auxiliaires", "Rendement de la pile = U cellule / 1,25 V"],
    plotCap: "Courbe de polarisation de principe : la tension d'une cellule selon la densité de courant. Plus on pousse le courant, plus les pertes augmentent. Courbes à remplacer par celles mesurées sur MYRTE.",
    plot: pl => { if (st.mode === 0) { const j = 1.5 * st.pw; pl.frame(0, 2, 1.2, 2.1, "A/cm²", "V"); pl.hline(1.48, "rgba(159,216,255,.8)", "seuil thermoneutre 1,48 V"); pl.line(ue, "#9fd8ff", 2); pl.dot(j, ue(j), "#ecece8", "électrolyseur"); } else { const j = .6 * st.pw; pl.frame(0, 1.2, .4, 1.1, "A/cm²", "V"); pl.line(uf, "#F9B23D", 2); pl.dot(j, uf(j), "#ecece8", "pile"); } },
    pilot: ["Priorités à la charge : la consommation, puis la batterie, puis l'électrolyseur, enfin l'injection.", "Priorités en îlot : le solaire et le torrent, puis la batterie, puis la pile. L'hydrogène est le dernier recours, parce qu'il rend un tiers de ce qu'il a reçu."],
    read: () => { if (st.mode === 0) { const u = ue(1.5 * st.pw), e = u * 26.59 * 1.06, P = 20 * st.pw * u / ue(1.5); return [["Stock", fmt(st.kg, 1) + " kg sur 30"], ["Tension de cellule", fmt(u, 2) + " V"], ["Consommation", fmt(e, 1) + " kWh/kg"], ["Débit", fmt(P / e * 1000) + " g/h"]]; }
      const u = uf(.6 * st.pw); return [["Stock", fmt(st.kg, 1) + " kg sur 30"], ["Tension de cellule", fmt(u, 2) + " V"], ["Rendement de la pile", fmt(u / 1.253 * 100) + " %"], ["Réserve du refuge", fmt(st.kg * 33.3 * u / 1.253 / 6) + " h"]]; },
    keys: ["52 kWh d'électricité par kilogramme produit ; 33,3 kWh contenus dans un kilogramme", "Pile à 50 % de rendement électrique dans le modèle", "30 kg stockés tiennent la charge critique de 6 kW pendant environ 83 heures"],
    warn: ["Environ 660 000 € études comprises : le poste le plus coûteux par kWh restitué", "À n'engager qu'après la première campagne de mesure, sur avis du conseil scientifique", "Installation classée : distances de sécurité et détection à instruire"],
    update: (dt, sec) => { const store = st.mode === 0; st.kg = Math.min(30, Math.max(0, st.kg + (store ? 1.6 : -1.3) * st.pw * dt)); if (store && st.kg >= 30) st.kg = 3; if (!store && st.kg <= 0) st.kg = 27;
      [fin, fwt, fh, fo, fst, bub1, bub2].forEach(f => f.on = store ? 1 : 0); [ffc, fel, fht, fdr].forEach(f => f.on = store ? 0 : 1); fst.dir = 1;
      eg.material.opacity = store ? .55 + .2 * Math.sin(sec * 3) : 0; fg.material.opacity = store ? 0 : .55 + .2 * Math.sin(sec * 3); piston.position.y = 2.3 + (store ? .25 * Math.sin(sec * 7) : 0);
      const lv = st.kg / 30; bottles.forEach(b => { b.scale.y = Math.max(.02, lv * 2.9); b.position.y = .12 + lv * 1.45; }); } };
}

/* ====================== ÎLOTAGE ET PILOTAGE ====================== */
function ilotage(C) {
  const st = { ph: 0, auto: 1 };
  const P1 = C.post(-13, 0), P2 = C.post(-9.6, 0); const line = M.paint(0xc9ccc7); line.emissive = new THREE.Color(COL.rose); line.emissiveIntensity = 0;
  C.pipe([P1, [-11.3, 2.7, 0], P2], .04, line); C.pipe([P2, [-8.4, 2.9, 0], [-7.4, 2.6, 0]], .04, line);
  /* organe de coupure */
  C.cyl(.1, 2.6, M.steel(), -7.4, 1.3, 0, "y"); C.cyl(.1, 2.6, M.steel(), -6.2, 1.3, 0, "y"); [-7.4, -6.2].forEach(x => C.cyl(.13, .4, M.paint(0x8a4b2e), x, 2.75, 0, "y"));
  const blade = new THREE.Group(); blade.position.set(-7.4, 2.95, 0); C.g.add(blade); C.box(1.2, .07, .1, M.copper(), .6, 0, 0, blade);
  /* poste */
  const cab = C.box(2.6, 2.6, 2.4, M.glass(0xd9d6cd, .16), -4, 1.3, 0); cab.castShadow = false; C.box(2.8, .14, 2.6, M.dark(), -4, 2.68, 0); C.box(2.8, .2, 2.6, M.paint(0x50565b), -4, .1, 0);
  const tr = C.box(1.3, 1.3, 1, M.paint(0x5d646b), -4, .9, 0); for (let i = 0; i < 6; i++) C.box(.05, 1, 1.2, M.steel(), -.5 + i * .2, 0, 0, tr); [-.3, 0, .3].forEach(z => C.cyl(.06, .45, M.paint(0x8a4b2e), -4, 1.8, z, "y"));
  C.cable([[-6.2, 2.95, 0], [-5.2, 2.5, 0], [-4, 2.05, 0]]);
  /* jeu de barres */
  C.box(13, .12, .22, M.copper(), 3.6, 1.6, 0); [-2.6, 3.6, 9.8].forEach(x => C.cyl(.07, 1.6, M.steel(), x, .8, 0, "y")); C.cable([[-3.3, 1.2, 0], [-2.9, 1.6, 0]]);
  /* départs et charges */
  const LX = [-1.4, 2, 5.4, 8.8], LN = ["Refuge", "Eau et télécoms", "Éclairage", "Habitations"], brk = [], ff = [], loads = [];
  LX.forEach((x, i) => { const b = C.box(.5, .5, .5, M.lit(COL.ok, .8), x, 1.6, 1.3); brk.push(b); C.cable([[x, 1.6, .1], [x, 1.6, 1.05]]); C.cable([[x, 1.6, 1.55], [x, .2, 2.6], [x, .2, 4]]); ff.push(C.flow([[x, 1.7, .1], [x, 1.7, 1.3], [x, .3, 2.6], [x, .3, 4]], 9, COL.ambre, .32, .5)); });
  LN.forEach((n, i) => C.sign(n.toUpperCase(), 2, LX[i] + 1.2, 3.2));
  ["SOLAIRE", "BATTERIE", "TORRENT"].forEach((n, i) => C.sign(n, 1.6, [.2, 3.8, 7.4][i] + 1.3, -5.4));
  C.label("AUTOMATE", 1.1, 11.6, 2.1, -2.18); C.label("POSTE HTA / BT", 2, -4, 2.2, 1.24, 0, null, true); C.person(-5.6, 3, .9);
  const refuge = C.house(-1.4, 5, 1.5, 0xc0563e); loads.push([refuge]);
  const mast = C.cyl(.06, 3, M.steel(), 1.6, 1.5, 5, "y"), tip = C.sph(.14, M.lit(COL.rose, 1), 1.6, 3.05, 5), tank = C.cyl(.6, 1.2, M.paint(0x7c8a92), 2.6, .6, 5, "y"); loads.push([]);
  const lamps = []; [4.9, 5.9].forEach(x => { C.cyl(.05, 2.4, M.dark(), x, 1.2, 5, "y"); lamps.push(C.sph(.16, M.lit(0xffd9a0, 0), x, 2.45, 5)); }); loads.push([]);
  const hs = [C.house(8, 5, .9), C.house(9.6, 5.3, .9), C.house(8.8, 6.6, .9)]; loads.push(hs);
  /* sources */
  const pv = C.box(1.8, .06, 1.1, new THREE.MeshStandardMaterial({ map: cellTex(), roughness: .2, metalness: .5 }), .2, 1, -4.4); pv.rotation.x = .6; C.cyl(.05, 1, M.steel(), .2, .5, -4.4, "y");
  const bat = C.box(2, 1, 1, M.paint(0x3b4046), 3.8, .5, -4.4), bs = C.box(2.02, .1, 1.02, M.lit(COL.ambre, .8), 0, .3, 0, bat);
  const wh = new THREE.Group(); wh.position.set(7.4, .9, -4.4); C.g.add(wh); C.cyl(.6, .14, M.steel(), 0, 0, 0, "z", wh); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; C.sph(.13, M.paint(0xd9b25a), Math.cos(a) * .7, Math.sin(a) * .7, 0, wh); } C.box(1.4, .3, .8, M.paint(0x50565b), 7.4, .15, -4.4);
  const SX = [.2, 3.8, 7.4], fs = SX.map((x, i) => { C.cable([[x, .9, -3.8], [x, .2, -2.6], [x, 1.5, -.1]]); return C.flow([[x, 1, -3.8], [x, .3, -2.6], [x, 1.6, -.1]], 9, [COL.ambre, COL.rose, COL.eau][i], .34, .5); });
  /* automate */
  const ems = C.cabinet(11.6, 0, -2.6, 1.3, 2.3, .8, 0x23282d); const ant = C.glow(COL.data, 1.6, 11.6, 2.7, -2.6);
  const fdat = [...LX.map(x => [x, 2, 1.3]), ...SX.map(x => [x, 1.4, -4.2]), [-6.8, 3.3, 0]].map(q => C.flow([[11.6, 2.5, -2.6], [(11.6 + q[0]) / 2, 4.6, (q[2] - 2.6) / 2], q], 6, COL.data, .2, .55));
  const fl = C.flow([P1, [-11.3, 2.8, 0], P2, [-8.4, 3, 0], [-7.4, 3.05, 0], [-6.2, 3.05, 0], [-5.2, 2.6, 0], [-4, 2.1, 0], [-3.3, 1.3, 0], [-2.6, 1.7, 0]], 22, COL.grid, .34, .3);
  const fbus = C.flow([[-2.8, 1.75, 0], [10, 1.75, 0]], 16, COL.ambre, .26, .25);
  /* états : ligne, coupure ouverte, départs fermés, sources (pv, bat: -1 décharge, 1 charge, hyd) */
  const PH = [
    { line: 1, open: 0, fd: [1, 1, 1, 1], pv: 1, bat: 0, hy: 1, f: "50,0 Hz", s: "Réseau raccordé", kw: 38 },
    { line: 0, open: 0, fd: [0, 0, 0, 0], pv: 0, bat: 0, hy: 0, f: "–", s: "Défaut sur la ligne", kw: 0 },
    { line: 0, open: 1, fd: [0, 0, 0, 0], pv: 0, bat: 0, hy: 0, f: "–", s: "Village isolé", kw: 0 },
    { line: 0, open: 1, fd: [1, 1, 0, 0], pv: 0, bat: -1, hy: 0, f: "50,0 Hz", s: "Réseau reformé", kw: 5 },
    { line: 0, open: 1, fd: [1, 1, 1, 0], pv: 1, bat: 1, hy: 1, f: "50,2 Hz", s: "Îlot stable", kw: 6 },
    { line: 1, open: 1, fd: [1, 1, 1, 0], pv: 1, bat: 1, hy: 1, f: "49,98 → 50,00 Hz", s: "Synchronisation", kw: 6 },
    { line: 1, open: 0, fd: [1, 1, 1, 1], pv: 1, bat: 1, hy: 1, f: "50,0 Hz", s: "Réseau raccordé", kw: 38 }];
  return { st: st, title: "Îlotage : la séquence de pilotage", sub: "Un automate surveille la ligne. Quand elle tombe, il isole le village, déleste, laisse la batterie reformer le réseau, puis reconnecte au retour du courant.",
    home: [[4, 13, 19], [1.6, 1, .6]], seq: true,
    steps: [
      ["Marche normale", "La ligne alimente le poste, le transformateur et le jeu de barres. Les quatre départs sont fermés ; le solaire et le torrent produisent.", [-6, 9, 16], [0, 1.4, .6], [-4, 3.4, 0]],
      ["Le défaut", "La ligne tombe : arbre, incendie, tempête. Tout s'éteint. Les onduleurs se déconnectent d'eux-mêmes : c'est leur protection.", [-14, 6, 9], [-9, 2.4, 0], [-11.3, 3.6, 0]],
      ["L'isolement", "L'automate ouvre l'organe de coupure. Le village est séparé de la ligne : aucun courant ne peut y remonter, les équipes de dépannage travaillent en sécurité. Les départs non prioritaires sont ouverts.", [-10, 5.4, 6.4], [-6.4, 2.4, 0], [-6.8, 3.7, 0]],
      ["La reformation", "Le convertisseur de la batterie remet le jeu de barres sous tension, à 50 Hz. Le refuge, l'eau et les télécoms repartent après une coupure brève.", [1, 7, -13], [2.4, 1.2, -1], [3.8, 1.9, -4.4]],
      ["L'îlot stable", "Le solaire et le torrent se recalent sur la batterie et la rechargent. L'éclairage revient au minimum. Les habitations restent délestées.", [13, 9, 13], [4, 1, 1.4], [5.4, 3.2, 5]],
      ["Le retour du réseau", "La ligne est de nouveau sous tension. L'automate attend qu'elle soit stable, puis aligne la fréquence et la phase de l'îlot sur celles du réseau.", [16, 6, -8], [9, 1.6, -1.6], [11.6, 3.1, -2.6]],
      ["La reconnexion", "L'organe de coupure se referme sans à-coup. Les départs sont refermés un à un ; la batterie se recharge.", [-8, 8, 13], [-2, 1.6, .4], [-6.8, 3.7, 0]]],
    ui: [],
    eq: ["Ouverture : tension < 80 % pendant plus de 0,2 s", "Reformation : coupure confirmée, départs non prioritaires ouverts", "Reconnexion : écarts < 0,1 Hz, < 5 % en tension, < 10° en phase"],
    plotCap: "Tension du jeu de barres (trait clair) et fréquence au fil des sept étapes. Les seuils ci-dessous sont des ordres de grandeur usuels, à fixer avec EDF.",
    plot: pl => { const U = [1, 0, 0, 1, 1, 1, 1], F = ["50,0", "–", "–", "50,0", "50,2", "50,0", "50,0"]; pl.frame(0, 7, 0, 1.4, "étape", "U / Un"); pl.band(st.ph, st.ph + 1, "rgba(233,66,108,.22)"); const a = []; U.forEach((u, i) => { a.push([i, u], [i + 1, u]); }); pl.pts(a, "#ecece8", 2); F.forEach((f, i) => pl.text(i + .5, 1.25, f, i === st.ph ? "#fff" : "#a2a4a0")); },
    pilot: ["Ordre de priorité des départs : le refuge, l'eau et les télécoms, l'éclairage minimal, puis les habitations.", "La séquence présentée est un principe. Les seuils, les temporisations et les protections sont à définir avec EDF, gestionnaire du réseau."],
    read: () => { const p = PH[st.ph]; return [["État", p.s], ["Fréquence", p.f], ["Puissance servie", p.kw + " kW"], ["Départs fermés", p.fd.reduce((a, b) => a + b, 0) + " sur 4"]]; },
    keys: ["Charge critique du modèle : 6 kW, sur 38 kW consommés un jour d'été", "Solution de repli si l'îlotage du réseau public n'est pas autorisé : îloter le seul refuge, en aval de son compteur", "Essais prévus sur la plateforme PAGLIA ORBA avant le terrain"],
    warn: ["Accord d'EDF indispensable : c'est le premier verrou du projet", "Durée de la coupure brève à spécifier : de quelques secondes à quelques minutes selon l'équipement", "Protection des personnes en îlot : régime de neutre et courants de défaut à étudier"],
    update: (dt, sec) => { const p = PH[st.ph];
      blade.rotation.z += ((p.open ? .95 : 0) - blade.rotation.z) * .08; line.emissiveIntensity = !p.line ? .5 + .5 * Math.sin(sec * 8) : 0; line.color.setHex(p.line ? 0xc9ccc7 : 0x7a3a48);
      fl.on = p.line && !p.open ? 1 : 0; const live = p.fd[0];
      brk.forEach((b, i) => { const on = p.fd[i]; b.position.y += ((on ? 1.6 : 2.3) - b.position.y) * .1; b.material.color.setHex(on ? COL.ok : 0x8a8f94); b.material.emissive.setHex(on ? COL.ok : 0x000000); ff[i].on = on ? 1 : 0; });
      refuge.userData.win.material.emissiveIntensity = p.fd[0] ? 1.4 : 0; tip.material.emissiveIntensity = p.fd[1] ? .6 + .6 * Math.sin(sec * 6) : 0; lamps.forEach(l => l.material.emissiveIntensity = p.fd[2] ? (p.open ? .5 : 1.4) : 0); hs.forEach(h => h.userData.win.material.emissiveIntensity = p.fd[3] ? 1.2 : 0);
      fs[0].on = p.pv; fs[2].on = p.hy; fs[1].on = p.bat ? 1 : 0; fs[1].dir = p.bat > 0 ? -1 : 1; bs.material.emissiveIntensity = p.bat < 0 ? 1.6 : .7; wh.rotation.z += dt * (p.hy ? 6 : .4);
      fbus.on = live ? 1 : 0; fdat.forEach(f => f.on = 1); ant.material.opacity = .4 + .4 * Math.sin(sec * 5); ems.userData.scr.material.color.setHex(p.open ? COL.rose : COL.ok); ems.userData.scr.material.emissive.setHex(p.open ? COL.rose : COL.ok); } };
}

/* ---------- moteur ---------- */
const BUILD = { hydro: hydro, pv: solaire, batt: batterie, h2: hydrogene, ilot: ilotage }, cache = {};
const v3 = new THREE.Vector3(); let tween = null, cur = null, stepI = 0;
function fly(p, t, dur) { tween = { f: camera.position.clone(), to: V(p[0], p[1], p[2]), tf: controls.target.clone(), tt: V(t[0], t[1], t[2]), t0: performance.now(), dur: reduce ? 1 : dur }; }
const api = { scene: scene, camera: camera, controls: controls, active: false, def: null, pin: null, has: k => !!BUILD[k],
  open(k) { if (!cache[k]) { const g = new THREE.Group(); scene.add(g); const C = ctx(g); const d = BUILD[k](C); d.C = C; d.g = g; cache[k] = d; g.traverse(o => { const m = o.material; if (!m || m.userData.lin) return; m.userData.lin = 1; if (m.color && !o.userData.keep) m.color.convertSRGBToLinear(); if (m.emissive && !o.userData.keep) m.emissive.convertSRGBToLinear(); if (m.isMeshStandardMaterial && m.envMapIntensity === 1) m.envMapIntensity = m.metalness > .6 ? 1 : .45; }); }
    Object.keys(cache).forEach(n => cache[n].g.visible = n === k); cur = cache[k]; api.def = cur; api.active = true; controls.enabled = true;
    const narrow = camera.aspect < 1; camera.fov = narrow ? 56 : 40; camera.updateProjectionMatrix();
    camera.position.set(cur.home[0][0] * 1.5, cur.home[0][1] * 1.5, cur.home[0][2] * 1.5); controls.target.set(cur.home[1][0], cur.home[1][1], cur.home[1][2]); return cur; },
  close() { api.active = false; controls.enabled = false; cur = null; api.def = null; },
  goStep(i) { if (!cur) return; stepI = i; if (i < 0) { const kh = camera.aspect < 1 ? 1.5 : 1; fly(cur.home[0].map(v => v * kh), cur.home[1], 1400); api.pin = null; return; } const s = cur.steps[i], kz = camera.aspect < 1 ? 1.9 : 1.4; fly([s[3][0] + (s[2][0] - s[3][0]) * kz, s[3][1] + (s[2][1] - s[3][1]) * kz, s[3][2] + (s[2][2] - s[3][2]) * kz], s[3], 1500); api.pin = V(s[4][0], s[4][1], s[4][2]); if (cur.seq) cur.st.ph = i; },
  update(dt, sec) { if (!cur) return;
    if (tween) { const k = Math.min(1, (performance.now() - tween.t0) / tween.dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; camera.position.lerpVectors(tween.f, tween.to, e); controls.target.lerpVectors(tween.tf, tween.tt, e); if (k >= 1) tween = null; }
    cur.update(dt, sec);
    cur.C.flows.forEach(f => { f.a += (f.on - f.a) * Math.min(1, dt * 5); f.pts.visible = f.a > .02; f.pts.material.opacity = f.a; if (!f.pts.visible) return; f.ph += dt * f.speed * f.dir; const a = f.pts.geometry.attributes.position.array; for (let i = 0; i < f.n; i++) { const u = (((f.ph + i / f.n) % 1) + 1) % 1; f.c.getPoint(u, v3); a[i * 3] = v3.x; a[i * 3 + 1] = v3.y; a[i * 3 + 2] = v3.z; } f.pts.geometry.attributes.position.needsUpdate = true; });
    controls.update(); } };
return api;
} };
})();
