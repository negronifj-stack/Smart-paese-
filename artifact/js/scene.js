/* Smart Paese — scène 3D du village. Expose window.Scene.create(stage, onPick). */
(function () {
"use strict";
window.Scene = { create: function (stage, onPick) {
const THREE = window.THREE;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = Math.min(innerWidth, innerHeight) < 700;
const COL = { ambre: 0xF9B23D, corail: 0xF08363, rose: 0xE9426C, wall: 0xe7e4dc, roof: 0x7d817d, grid: 0xb0b3ae, h2: 0x9fd8ff, eau: 0x5fa8d6, data: 0xffffff, heat: 0xF08363 };
const W = () => stage.clientWidth || 1, Hh = () => stage.clientHeight || 1;

/* ---------- rendu ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W(), Hh());
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = (THREE.EffectComposer && THREE.GammaCorrectionShader) ? THREE.LinearEncoding : THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
stage.insertBefore(renderer.domElement, stage.firstChild);
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x1b1d1c, 190, 560);
const camera = new THREE.PerspectiveCamera(38, W() / Hh(), .5, 2400); camera.position.set(300, 150, 330);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = .07; controls.maxPolarAngle = Math.PI * .47; controls.minDistance = 24; controls.maxDistance = 380; controls.target.set(10, 8, 10);
controls.autoRotate = !reduce; controls.autoRotateSpeed = .3; renderer.domElement.addEventListener("pointerdown", () => { controls.autoRotate = false; });
renderer.domElement.style.touchAction = "pan-y";

/* ciel */
const skyU = { top: { value: new THREE.Color(0x0e1116) }, bot: { value: new THREE.Color(0x3a3036) } };
const gradSky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: "varying vec3 vp;void main(){vp=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
  fragmentShader: "uniform vec3 top;uniform vec3 bot;varying vec3 vp;void main(){float h=clamp(vp.y*1.6+.05,0.,1.);gl_FragColor=vec4(mix(bot,top,pow(h,.7)),1.);}" })); scene.add(gradSky);
let sky = null, envDay = null; const sunDir = new THREE.Vector3();
function skyParams(k) { const u = k.material.uniforms; u.turbidity.value = 4; u.rayleigh.value = 1.1; u.mieCoefficient.value = .004; u.mieDirectionalG.value = .82; }
if (THREE.Sky) { try { sky = new THREE.Sky(); sky.scale.setScalar(2600); skyParams(sky); scene.add(sky); gradSky.visible = false;
  const pm = new THREE.PMREMGenerator(renderer), s2 = new THREE.Scene(), k2 = new THREE.Sky(); k2.scale.setScalar(2600); skyParams(k2); k2.material.uniforms.sunPosition.value.set(.3, .7, .5); s2.add(k2); envDay = pm.fromScene(s2).texture; pm.dispose(); } catch (e) { sky = null; gradSky.visible = true; } }
const starG = new THREE.BufferGeometry(); const sp = []; for (let i = 0; i < 1400; i++) { const u = Math.random() * Math.PI * 2, v = Math.random() * .9 + .08; sp.push(Math.cos(u) * Math.cos(v) * 1400, Math.sin(v) * 1400, Math.sin(u) * Math.cos(v) * 1400); } starG.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
const stars = new THREE.Points(starG, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); scene.add(stars);
/* lumières */
const hemi = new THREE.HemisphereLight(0xdfe6ee, 0x2a2722, .55); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 1.6); sun.castShadow = true; sun.shadow.mapSize.set(small ? 2048 : 4096, small ? 2048 : 4096); Object.assign(sun.shadow.camera, { left: -210, right: 210, top: 210, bottom: -210, near: 10, far: 900 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .5; sun.shadow.radius = 2; scene.add(sun); scene.add(sun.target);
const amb = new THREE.AmbientLight(0x404448, .35); scene.add(amb);
const lampLight = new THREE.PointLight(0xffcf8f, 0, 140, 1.6); lampLight.position.set(0, 30, 0); scene.add(lampLight);

/* textures */
function glowTex() { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.2, "rgba(255,255,255,.75)"); r.addColorStop(.5, "rgba(255,255,255,.18)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
const GLOW = glowTex();
function glow(color, size, parent, pos) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); s.scale.set(size, size, 1); if (pos) s.position.copy(pos); (parent || scene).add(s); return s; }
function pvTexture() { const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 256, 128); gr.addColorStop(0, "#1d2733"); gr.addColorStop(1, "#2a3a4c"); g.fillStyle = gr; g.fillRect(0, 0, 256, 128); g.strokeStyle = "rgba(190,210,230,.35)"; g.lineWidth = 1.2; for (let x = 0; x <= 256; x += 21.3) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); } for (let y = 0; y <= 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
function waterTex() { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d"); g.fillStyle = "#3f7fa6"; g.fillRect(0, 0, 64, 256); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(220,240,255,${.08 + Math.random() * .22})`; g.fillRect(Math.random() * 64, Math.random() * 256, 2 + Math.random() * 10, 8 + Math.random() * 26); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 30); return t; }

function noiseTex(base, spread, n, rep) { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"); g.fillStyle = `rgb(${base},${base},${base})`; g.fillRect(0, 0, 256, 256); for (let i = 0; i < n; i++) { const v = Math.round(base + (Math.random() - .5) * spread * 2); g.fillStyle = `rgba(${v},${v},${v},.5)`; const r = 1 + Math.random() * 5; g.fillRect(Math.random() * 256, Math.random() * 256, r, r); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
function stoneTex(rx, ry) { const c = document.createElement("canvas"); c.width = 256; c.height = 256; const g = c.getContext("2d"); g.fillStyle = "#b9b4a8"; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 22) { let x = -(y / 22 % 2) * 20; while (x < 256) { const w = 26 + Math.random() * 34, v = 200 + Math.round(Math.random() * 50); g.fillStyle = `rgb(${v},${v - 4},${v - 14})`; g.fillRect(x + 1.5, y + 1.5, w - 3, 19); x += w; } } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
function tileTex() { const c = document.createElement("canvas"); c.width = 128; c.height = 128; const g = c.getContext("2d"); g.fillStyle = "#e9e6e2"; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 16) { g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(0, y, 128, 2.5); for (let x = (y / 16 % 2) * 8; x < 128; x += 16) { g.fillStyle = `rgba(0,0,0,${.05 + Math.random() * .16})`; g.fillRect(x, y + 2, 15, 13); } } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(.35, .35); t.encoding = THREE.sRGBEncoding; return t; }
/* ---------- relief ---------- */
function rnd(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = rnd(xi, yi), b = rnd(xi + 1, yi), c = rnd(xi, yi + 1), d = rnd(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y) { let s = 0, a = 1, f = 1; for (let i = 0; i < 5; i++) { s += a * noise(x * f, y * f); a *= .5; f *= 2; } return s / 1.94; }
function height(x, z) { const r = Math.hypot(x, z * 1.1); const plateau = Math.max(0, r - 70); const dir = r > 0 ? (x * .66 + z * .75) / r : 0; const open = 1 - .85 * Math.min(1, Math.max(0, (dir + .1) / .7)); const mount = Math.pow(plateau / 150, 1.6) * 80 * open; const n = (fbm(x * .018 + 3, z * .018 + 7) - .5) * 26; const slope = -z * .03; return Math.max(-6, (r < 60 ? slope * .4 : slope) + mount + n * Math.min(1, plateau / 40 + .15)); }
const TS = 1600, TN = small ? 240 : 360; const tg = new THREE.PlaneGeometry(TS, TS, TN, TN); tg.rotateX(-Math.PI / 2);
const pos = tg.attributes.position; const cBase = new Float32Array(pos.count * 3), cSnow = new Float32Array(pos.count * 3), cNow = new Float32Array(pos.count * 3);
for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));
tg.computeVertexNormals(); const nrm = tg.attributes.normal;
for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), h = pos.getY(i); const t = Math.min(1, Math.max(0, h / 80)), dry = fbm(x * .03 + 11, z * .03 + 5);
  const c = new THREE.Color().setRGB(.24 + t * .14 + dry * .2, .33 + t * .03 + dry * .1, .16 + t * .08);
  const rock = Math.min(1, Math.max(0, (.9 - nrm.getY(i)) / .22)); c.lerp(new THREE.Color(.56, .53, .49), rock * .85);
  if (h < 4 && Math.hypot(x, z) < 70) c.setRGB(.5, .47, .4);
  if (x > 120 && x < 200 && z > 50 && z < 130) c.setRGB(.42, .52, .24);
  cBase[i * 3] = c.r; cBase[i * 3 + 1] = c.g; cBase[i * 3 + 2] = c.b;
  const sn = Math.min(1, Math.max(0, (h - 38 + (rnd(x * .05, z * .05) - .5) * 14) / 22)) * (1 - rock * .5); cSnow[i * 3] = c.r + (.95 - c.r) * sn; cSnow[i * 3 + 1] = c.g + (.96 - c.g) * sn; cSnow[i * 3 + 2] = c.b + (.98 - c.b) * sn; }
cNow.set(cBase); tg.setAttribute("color", new THREE.BufferAttribute(cNow, 3));
const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, map: noiseTex(205, 40, 9000, 90), roughness: .97, metalness: 0 })); terrain.receiveShadow = true; scene.add(terrain);
let snowNow = -1; function setSnow(w) { w = Math.round(w * 10) / 10; if (w === snowNow) return; snowNow = w; for (let i = 0; i < cNow.length; i++) cNow[i] = cBase[i] + (cSnow[i] - cBase[i]) * w; tg.attributes.color.needsUpdate = true; }
const mtx = new THREE.Matrix4(), tint = new THREE.Color();
const pineG = new THREE.LatheGeometry([[0, 9], [1.2, 6.6], [.6, 6.6], [1.9, 4.2], [.9, 4.2], [2.5, 1.6], [.3, 1.6], [.3, 0], [0, 0]].map(q => new THREE.Vector2(q[0], q[1])), 8);
const NP = small ? 1100 : 1900, pines = new THREE.InstancedMesh(pineG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .95, flatShading: true }), NP);
const clear = (x, z) => (x > 110 && x < 210 && z > 40 && z < 140) || (x > 62 && x < 132 && z > -72 && z < -18) || Math.abs(x + 96) < 9 && Math.abs(z - 44) < 9;
let mi = 0; for (let i = 0; i < 30000 && mi < NP; i++) { const x = (rnd(i, 1) - .5) * 900, z = (rnd(i, 2) - .5) * 900; const r = Math.hypot(x, z); if (r < 66 || r > 440) continue; if (clear(x, z)) continue; if (fbm(x * .012 + 40, z * .012 + 9) < .46) continue; const h = height(x, z); if (h > 95) continue; const sc = .45 + rnd(i, 3) * .6; mtx.compose(new THREE.Vector3(x, h - .3, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(i, 5) * 6.3), new THREE.Vector3(sc, sc * (.85 + rnd(i, 4) * .5), sc)); pines.setMatrixAt(mi, mtx); tint.setHSL(.27 + rnd(i, 6) * .07, .38 + rnd(i, 7) * .2, .1 + rnd(i, 8) * .08); pines.setColorAt(mi, tint); mi++; }
pines.count = mi; pines.castShadow = true; pines.receiveShadow = true; scene.add(pines);
const NB = small ? 700 : 1300, bush = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.7, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), NB);
let bi = 0; for (let i = 0; i < 20000 && bi < NB; i++) { const x = (rnd(i, 21) - .5) * 620, z = (rnd(i, 22) - .5) * 620; const r = Math.hypot(x, z); if (r < 58 || r > 300) continue; if (clear(x, z)) continue; const h = height(x, z); const sc = .5 + rnd(i, 23) * 1.2; mtx.compose(new THREE.Vector3(x, h + .5 * sc, z), new THREE.Quaternion(), new THREE.Vector3(sc * (1 + rnd(i, 24) * .6), sc * .75, sc)); bush.setMatrixAt(bi, mtx); tint.setHSL(.2 + rnd(i, 25) * .1, .34 + rnd(i, 26) * .2, .13 + rnd(i, 27) * .1); bush.setColorAt(bi, tint); bi++; }
bush.count = bi; bush.castShadow = true; scene.add(bush);

/* ---------- matériaux ---------- */
const mWall = new THREE.MeshStandardMaterial({ color: 0xeee6d6, map: stoneTex(2, 1.5), roughness: .9 });
const mStone = new THREE.MeshStandardMaterial({ color: 0xd9d0bf, map: stoneTex(3, 2.5), roughness: .92 });
const tT = tileTex(); const mRoof = new THREE.MeshStandardMaterial({ color: 0xb06a4e, map: tT, roughness: .85 }), mRoofB = new THREE.MeshStandardMaterial({ color: 0x8f6a5c, map: tT, roughness: .85 }), mRoofL = new THREE.MeshStandardMaterial({ color: 0x8a8d8b, map: tT, roughness: .8 }), mDoor = new THREE.MeshStandardMaterial({ color: 0x4a3526, roughness: .8 }), mShut = new THREE.MeshStandardMaterial({ color: 0x3f6a5c, roughness: .7 });
const mDark = new THREE.MeshStandardMaterial({ color: 0x2c2f2d, roughness: .6, metalness: .4 });
const mMetal = new THREE.MeshStandardMaterial({ color: 0xa6a9a4, roughness: .35, metalness: .8 });
const mWhite = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: .3, metalness: .2 });
const mWin = new THREE.MeshStandardMaterial({ color: 0x2a2a28, emissive: 0xffb562, emissiveIntensity: 0, roughness: .4 });
const mWinRef = new THREE.MeshStandardMaterial({ color: 0x2a2a28, emissive: 0xffb562, emissiveIntensity: 0, roughness: .4 });
const mPV = new THREE.MeshStandardMaterial({ map: pvTexture(), roughness: .22, metalness: .6, emissive: COL.corail, emissiveIntensity: 0 });
function shadowAll(o) { o.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } }); return o; }
function gable(w, d, h, mat) { const s = new THREE.Shape(); s.moveTo(-w / 2 - .6, 0); s.lineTo(0, h); s.lineTo(w / 2 + .6, 0); s.lineTo(-w / 2 - .6, 0); const g = new THREE.ExtrudeGeometry(s, { depth: d + 1.2, bevelEnabled: false }); g.translate(0, 0, -(d + 1.2) / 2); return new THREE.Mesh(g, mat); }
function building(o) { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(o.w, o.h, o.d), o.mat || mWall); body.position.y = o.h / 2; g.add(body);
  const roof = gable(o.w, o.d, o.rh || o.w * .32, o.roofMat || [mRoof, mRoofB, mRoofL][Math.floor(rnd(o.x, o.z) * 3)]); roof.position.y = o.h; g.add(roof);
  const chm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.4, 1.1), o.mat || mWall); chm.position.set(-o.w * .22, o.h + (o.rh || o.w * .32) * .75, o.d * .28); g.add(chm);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.6), mDoor); door.position.set(0, 1.3, o.d / 2 + .03); g.add(door); const base = new THREE.Mesh(new THREE.BoxGeometry(o.w + .5, 1.2, o.d + .5), mStone); base.position.y = .2; g.add(base);
  const wm = o.winMat || mWin; const nw = Math.max(1, Math.floor(o.d / 5)); for (let f = 0; f < (o.floors || 1); f++) for (let i = 0; i < nw; i++) { const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2), wm); win.position.set(o.w / 2 + .02, 2.6 + f * 3.6, -o.d / 2 + (i + .5) * o.d / nw); win.rotation.y = Math.PI / 2; g.add(win); [-1, 1].forEach(sd => { const sh = new THREE.Mesh(new THREE.BoxGeometry(.08, 2, .6), mShut); sh.position.set(o.w / 2 + .06, win.position.y, win.position.z + sd * 1.05); g.add(sh); }); const w2 = win.clone(); w2.position.x = -o.w / 2 - .02; w2.rotation.y = -Math.PI / 2; g.add(w2); }
  if (o.pv) { const rh = o.rh || o.w * .32; const slope = Math.atan2(rh, o.w / 2); const len = Math.hypot(o.w / 2, rh) * .82; const p = new THREE.Mesh(new THREE.BoxGeometry(len, .25, o.d * .86), mPV); p.position.set(o.w / 4 + .1, o.h + rh / 2 + .35, 0); p.rotation.z = -slope; g.add(p); }
  g.userData.body = body; g.userData.roof = roof; g.position.set(o.x, height(o.x, o.z) - .2, o.z); g.rotation.y = o.ry || 0; scene.add(shadowAll(g)); return g; }
const at = (x, z, dy) => new THREE.Vector3(x, height(x, z) + (dy || 0), z);
const shells = {};
function makeShell(key, meshes) { shells[key] = meshes.map(m => { m.material = m.material.clone(); m.material.transparent = true; return m; }); }
function setCut(key) { Object.entries(shells).forEach(([k, ms]) => ms.forEach(m => { m.material.opacity = k === key ? .12 : 1; m.material.depthWrite = k !== key; m.castShadow = k !== key; })); }

/* ---------- village ---------- */
building({ x: -8, z: 4, w: 16, d: 22, h: 10, floors: 2, rh: 5.5, pv: true, mat: mStone, winMat: mWinRef, ry: .08 });
const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 8), mMetal); flagPole.position.set(-8, height(-8, 4) + 19.5, -8); scene.add(flagPole);
const flag = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshStandardMaterial({ color: COL.rose, side: THREE.DoubleSide, emissive: COL.rose, emissiveIntensity: .15 })); flag.position.set(-6.5, height(-8, 4) + 22.4, -8); scene.add(flag);
building({ x: 26, z: -14, w: 14, d: 24, h: 7, rh: 4.4, pv: true, ry: -.25 });
const camp = new THREE.Group(); const tw = new THREE.Mesh(new THREE.BoxGeometry(5, 24, 5), mStone); tw.position.y = 12; camp.add(tw); const cap = new THREE.Mesh(new THREE.ConeGeometry(4.1, 6, 4), mRoof); cap.position.y = 27; cap.rotation.y = Math.PI / 4; camp.add(cap);
const bellM = new THREE.Mesh(new THREE.BoxGeometry(5.3, 3.4, 5.3), new THREE.MeshStandardMaterial({ color: 0x2c2f2d })); bellM.position.y = 20; camp.add(bellM); camp.position.set(-30, height(-30, -20), -20); scene.add(shadowAll(camp));
const CAMP = at(-30, -20, 0);
const mast = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 6), mMetal); mast.position.set(CAMP.x, CAMP.y + 33, CAMP.z); scene.add(mast);
const antTip = new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 12), new THREE.MeshBasicMaterial({ color: COL.rose })); antTip.position.set(CAMP.x, CAMP.y + 36.2, CAMP.z); scene.add(antTip);
const antGlow = glow(COL.rose, 6, scene, antTip.position.clone());
const waves = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .06, 6, 60), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); m.rotation.x = Math.PI / 2; m.position.copy(antTip.position); scene.add(m); return m; });
const hp = [[38, 26, 0], [52, 10, .3], [60, -8, .6], [12, 60, -.2], [-12, 54, .1], [-26, 30, -.3], [-44, 12, .4], [-48, -6, .2], [8, -34, -.4], [-10, -40, .2], [44, -40, .5], [64, 28, .1], [78, 6, .5], [-60, 30, -.2]];
const meters = [];
hp.forEach((p, i) => { const d = 10 + rnd(i, 8) * 4; const h = building({ x: p[0], z: p[1], ry: p[2], w: 8 + rnd(i, 9) * 3, d: d, h: 6 + Math.round(rnd(i, 7)) * 3.2, floors: 1 + Math.round(rnd(i, 7)), rh: 3.2 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(.6, .8, .3), new THREE.MeshBasicMaterial({ color: 0x55c08f })); m.position.set(0, 1.6, d / 2 + .2); h.add(m); meters.push(m); });
const mRoad = new THREE.MeshStandardMaterial({ color: 0x77736b, map: noiseTex(200, 30, 4000, 6), roughness: 1 });
const road = new THREE.Mesh(new THREE.RingGeometry(30, 36, 64, 1, 0, Math.PI * 1.6), mRoad); road.rotation.x = -Math.PI / 2; road.rotation.z = .4; road.position.y = .3; road.receiveShadow = true; scene.add(road);
(function () { const c = new THREE.CatmullRomCurve3([[30, -34], [48, -60], [40, -100], [70, -140], [60, -200], [110, -260], [100, -340], [150, -430]].map(q => new THREE.Vector3(q[0], 0, q[1]))), N = 160, P = [], I = [], tmp = new THREE.Vector3(), tan = new THREE.Vector3();
  for (let i = 0; i <= N; i++) { c.getPoint(i / N, tmp); c.getTangent(i / N, tan); const nx = -tan.z, nz = tan.x, hh = height(tmp.x, tmp.z) + .45; P.push(tmp.x + nx * 3, hh, tmp.z + nz * 3, tmp.x - nx * 3, hh, tmp.z - nz * 3); if (i < N) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x6b6a66, roughness: 1, side: THREE.DoubleSide })); m.receiveShadow = true; scene.add(m); })();
/* batteries : un conteneur par tranche de 200 kWh */
const battG = new THREE.Group(); const bLevels = [];
for (let k = 0; k < 3; k++) { const b = new THREE.Group(); const bb = new THREE.Mesh(new THREE.BoxGeometry(12, 5.2, 5), new THREE.MeshStandardMaterial({ color: 0x3b3f3c, roughness: .5, metalness: .5 })); bb.position.y = 2.6; b.add(bb);
  const st = new THREE.Mesh(new THREE.BoxGeometry(12.1, .5, 5.1), new THREE.MeshStandardMaterial({ color: COL.ambre, emissive: COL.ambre, emissiveIntensity: .8 })); st.position.y = 4.4; b.add(st);
  const lv = new THREE.Mesh(new THREE.BoxGeometry(.1, 3, 4), new THREE.MeshBasicMaterial({ color: COL.ambre })); lv.position.set(6.06, 2.4, 0); b.add(lv); bLevels.push(lv); b.position.z = k * 6.4; battG.add(b); }
battG.position.set(-2, height(-2, 23), 23); battG.rotation.y = .1; scene.add(shadowAll(battG));
/* borne et ombrière */
const borne = new THREE.Group(); const bo = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 1), new THREE.MeshStandardMaterial({ color: 0xe8e8e4, roughness: .5 })); bo.position.y = 1.6; borne.add(bo);
const scr = new THREE.Mesh(new THREE.PlaneGeometry(.9, .8), new THREE.MeshBasicMaterial({ color: COL.corail })); scr.position.set(0, 2.4, .51); borne.add(scr);
const car = new THREE.Group(); const cb = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.3, 8), new THREE.MeshStandardMaterial({ color: 0xd8dad6, roughness: .3, metalness: .5 })); cb.position.y = 1.1; car.add(cb); const ct = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 4.4), new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: .15, metalness: .7 })); ct.position.set(0, 2.2, -.4); car.add(ct);
[[-1.9, 2.6], [1.9, 2.6], [-1.9, -2.6], [1.9, -2.6]].forEach(w => { const wh = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .5, 16), mDark); wh.rotation.z = Math.PI / 2; wh.position.set(w[0], .7, w[1]); car.add(wh); });
car.position.set(4.2, 0, 1); borne.add(car); borne.position.set(22, height(22, 30), 30); borne.rotation.y = -.6; scene.add(shadowAll(borne));
const omb = new THREE.Group(); const ombP = new THREE.Mesh(new THREE.BoxGeometry(22, .3, 9), mPV); ombP.position.y = 5; ombP.rotation.x = -.12; omb.add(ombP); [[-9, 3.6], [9, 3.6], [-9, -3.6], [9, -3.6]].forEach(p => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 5), mMetal); c.position.set(p[0], 2.5, p[1]); omb.add(c); });
omb.position.set(26, height(26, 36), 36); omb.rotation.y = -.6; scene.add(shadowAll(omb));
/* tables solaires supplémentaires, affichées au-delà de 120 kWc */
const extra = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const x = 70 + c * 13, z = -62 + r * 11; const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.BoxGeometry(11, .2, 5), mPV); p.position.y = 2.4; p.rotation.x = -.42; g.add(p); [-4.5, 4.5].forEach(dx => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 2.4), mMetal); l.position.set(dx, 1.2, 0); g.add(l); }); g.position.copy(at(x, z, 0)); g.visible = false; scene.add(shadowAll(g)); extra.push(g); }
/* poste */
const poste = new THREE.Group(); const pb = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 4), new THREE.MeshStandardMaterial({ color: 0xd9d6cd, roughness: .8 })); pb.position.y = 2; poste.add(pb); const prr = new THREE.Mesh(new THREE.BoxGeometry(5.6, .4, 4.6), mDark); prr.position.y = 4.2; poste.add(prr);
const bolt = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ color: COL.ambre })); bolt.position.set(0, 2.2, 2.02); poste.add(bolt); poste.position.set(-46, height(-46, -30), -30); scene.add(shadowAll(poste));
/* ligne HTA */
const pyl = [[-210, -170], [-150, -120], [-100, -78], [-52, -38]]; const tops = [];
pyl.forEach(p => { const g = new THREE.Group(); const HH = 22; [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(q => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.18, .32, HH), mMetal); leg.position.set(q[0] * .6, HH / 2, q[1] * .6); g.add(leg); }); const arm = new THREE.Mesh(new THREE.BoxGeometry(9, .4, .4), mMetal); arm.position.y = HH - 1; g.add(arm);
  const y0 = height(p[0], p[1]); g.position.set(p[0], y0, p[1]); g.lookAt(0, y0, 0); scene.add(shadowAll(g)); tops.push(new THREE.Vector3(p[0], y0 + HH - 1.4, p[1])); });
const htaMat = new THREE.MeshBasicMaterial({ color: 0xb9bcb7, transparent: true, opacity: .85 });
const lineP = [...tops, at(-46, -30, 4)]; for (let i = 0; i < lineP.length - 1; i++) { const a = lineP[i], b = lineP[i + 1]; const m = a.clone().lerp(b, .5); m.y -= 2.6; scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, m, b), 24, .13, 6), htaMat)); }
const cutG = new THREE.Group(); cutG.add(new THREE.Mesh(new THREE.TorusGeometry(3.4, .35, 10, 40), new THREE.MeshBasicMaterial({ color: COL.rose }))); [1, -1].forEach(s => { const b = new THREE.Mesh(new THREE.BoxGeometry(5, .5, .5), new THREE.MeshBasicMaterial({ color: COL.rose })); b.rotation.z = s * Math.PI / 4; cutG.add(b); });
cutG.position.copy(tops[2].clone().lerp(tops[3], .5)); cutG.position.y -= 2; cutG.visible = false; scene.add(cutG);
/* lampadaires */
const lamps = []; [[-33, 8], [-30, -6], [-20, -30], [0, -36], [20, -30], [34, -12], [36, 10], [40, 30], [6, 44], [-18, 40]].forEach(p => { const y0 = height(p[0], p[1]); const g = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.14, .2, 7), mDark); pole.position.y = 3.5; g.add(pole); const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, .18, .18), mDark); arm.position.set(.7, 7, 0); g.add(arm);
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(.9, .25, .5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd9a0, emissiveIntensity: 0 })); bulb.position.set(1.4, 6.85, 0); g.add(bulb);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6.8, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); cone.position.set(1.4, 3.4, 0); g.add(cone);
  const gl = glow(0xffd29a, 7, g, new THREE.Vector3(1.4, 6.7, 0));
  g.position.set(p[0], y0, p[1]); g.rotation.y = Math.atan2(-p[1], p[0]) + Math.PI; scene.add(g); lamps.push({ bulb, cone, gl }); });

/* ---------- procédés ---------- */
/* hydrogène */
const H2P = at(52, 54, 0);
const h2 = new THREE.Group(); h2.position.copy(H2P); h2.rotation.y = -.75; scene.add(h2);
const cont = new THREE.Mesh(new THREE.BoxGeometry(13, 5.6, 5.4), new THREE.MeshStandardMaterial({ color: 0xf3f3ef, roughness: .45, metalness: .25 })); cont.position.y = 2.8; h2.add(cont);
const contBand = new THREE.Mesh(new THREE.BoxGeometry(13.05, .5, 5.45), new THREE.MeshStandardMaterial({ color: COL.h2, emissive: COL.h2, emissiveIntensity: .5 })); contBand.position.y = 4.9; h2.add(contBand);
makeShell("h2", [cont, contBand]);
const stack = new THREE.Group(); for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(.22, 2.4, 2.2), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xd8dde2 : 0x8fa4b8, metalness: .6, roughness: .3 })); c.position.x = i * .28; stack.add(c); }
[-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.BoxGeometry(.5, 2.9, 2.7), mMetal); e.position.x = s < 0 ? -.4 : 14 * .28 + .1; stack.add(e); });
stack.position.set(-4.6, 2.2, 0); h2.add(stack);
const stackGlow = glow(COL.h2, 9, h2, new THREE.Vector3(-2.6, 2.4, 0));
const sep = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 3.4, 16), mMetal); sep.position.set(.6, 2.3, -1.3); h2.add(sep); const sep2 = sep.clone(); sep2.position.z = 1.3; h2.add(sep2);
const comp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 2), new THREE.MeshStandardMaterial({ color: 0x4a4f55, metalness: .5, roughness: .4 })); comp.position.set(3.4, 1.2, 0); h2.add(comp);
const fc = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 2.4), new THREE.MeshStandardMaterial({ color: 0x2e3440, metalness: .4, roughness: .35 })); fc.position.set(5.4, 1.6, 0); h2.add(fc);
const fcGlow = glow(COL.ambre, 7, h2, new THREE.Vector3(5.4, 2.2, 0));
const tanks = new THREE.Group(); for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 8, 20), mWhite); t.rotation.z = Math.PI / 2; t.position.set(0, 1.8, (i - 1) * 2.6); tanks.add(t); [-4, 4].forEach(dx => { const e = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 12), mWhite); e.position.set(dx, 1.8, (i - 1) * 2.6); tanks.add(e); }); const b = new THREE.Mesh(new THREE.CylinderGeometry(1.13, 1.13, .5, 20), new THREE.MeshStandardMaterial({ color: COL.h2, emissive: COL.h2, emissiveIntensity: .35 })); b.rotation.z = Math.PI / 2; b.position.copy(t.position); b.position.x = 3; tanks.add(b); }
[-3.5, 3.5].forEach(x => { const cr = new THREE.Mesh(new THREE.BoxGeometry(.6, 1.2, 8.6), mDark); cr.position.set(x, .6, 0); tanks.add(cr); });
tanks.position.set(0, 0, -9); h2.add(tanks);
const fence = new THREE.Mesh(new THREE.BoxGeometry(24, 1.8, 22), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: .12 })); fence.position.set(0, .9, -3); h2.add(fence);
shadowAll(h2);
/* chaufferie bois */
const CHP = at(44, -14, 0);
const ch = new THREE.Group(); ch.position.copy(CHP); ch.rotation.y = -.25; scene.add(ch);
const chB = new THREE.Mesh(new THREE.BoxGeometry(9, 6, 9), new THREE.MeshStandardMaterial({ color: 0xd7d2c6, roughness: .9 })); chB.position.y = 3; ch.add(chB);
const chR = new THREE.Mesh(new THREE.BoxGeometry(9.6, .5, 9.6), mDark); chR.position.y = 6.2; ch.add(chR);
makeShell("bois", [chB, chR]);
const boiler = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.6, 3), new THREE.MeshStandardMaterial({ color: 0xb5462f, metalness: .3, roughness: .5 })); boiler.position.set(-1, 1.9, 0); ch.add(boiler);
const flameM = new THREE.Mesh(new THREE.ConeGeometry(.7, 1.8, 12), new THREE.MeshBasicMaterial({ color: 0xffa040 })); flameM.position.set(-1, 1.6, 1.55); ch.add(flameM);
const flameGlow = glow(0xff8a3c, 8, ch, new THREE.Vector3(-1, 2, 1.6));
const buffer = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 4.4, 20), new THREE.MeshStandardMaterial({ color: 0xc9ccc7, metalness: .6, roughness: .3 })); buffer.position.set(2.4, 2.2, -1.8); ch.add(buffer);
const screw = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 5, 10), mMetal); screw.rotation.z = Math.PI / 2; screw.position.set(-4.6, 1.2, 0); ch.add(screw);
const silo = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 9, 24), new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: .8 })); silo.position.set(-7.4, 4.5, 0); ch.add(silo);
const siloCap = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.6, 24), mDark); siloCap.position.set(-7.4, 9.8, 0); ch.add(siloCap);
const chim = new THREE.Mesh(new THREE.CylinderGeometry(.45, .55, 14, 16), mMetal); chim.position.set(3.4, 7, 2.6); ch.add(chim);
shadowAll(ch);
const smoke = []; for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xcfcfca, transparent: true, depthWrite: false, opacity: 0 })); ch.add(s); smoke.push({ s, ph: i / 14 }); }
/* torrent et pico-centrale */
const streamC = new THREE.CatmullRomCurve3([[-170, -120], [-150, -92], [-128, -60], [-108, -24], [-92, 8], [-84, 34], [-78, 62], [-70, 96], [-58, 140], [-44, 190]].map(p => at(p[0], p[1], .5)));
const wT = waterTex(); const water = new THREE.Mesh(new THREE.TubeGeometry(streamC, 260, 2.2, 8), new THREE.MeshStandardMaterial({ map: wT, color: 0x8fc4e2, roughness: .06, metalness: .35, emissive: 0x0b2233, emissiveIntensity: .35, transparent: true, opacity: .92 })); scene.add(water);
if (envDay) [mPV, mMetal, mWhite, water.material].forEach(m => { m.envMap = envDay; m.needsUpdate = true; });
const INT = streamC.getPoint(.1); const TUR = at(-96, 44, 0);
const hydG = new THREE.Group(); scene.add(hydG);
const weir = new THREE.Mesh(new THREE.BoxGeometry(6, 1.6, 1.2), mStone); weir.position.copy(INT); weir.position.y += .4; weir.lookAt(streamC.getPoint(.12)); hydG.add(shadowAll(weir));
const penC = new THREE.CatmullRomCurve3([INT.clone().add(new THREE.Vector3(3, 1, 0)), at(-128, -50, 1.2), at(-110, -14, 1.2), at(-96, 14, 1.2), TUR.clone().add(new THREE.Vector3(-3, 2, 0))]);
hydG.add(shadowAll(new THREE.Mesh(new THREE.TubeGeometry(penC, 120, .55, 10), mMetal)));
const turb = building({ x: -96, z: 44, w: 8, d: 8, h: 5, rh: 2.4, ry: .5, mat: mStone }); makeShell("hydro", [turb.userData.body, turb.userData.roof]);
const pelton = new THREE.Group(); const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .5, 24), mMetal); hub.rotation.x = Math.PI / 2; pelton.add(hub); for (let i = 0; i < 14; i++) { const bk = new THREE.Mesh(new THREE.SphereGeometry(.42, 8, 6, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd9b86a, metalness: .8, roughness: .3, side: THREE.DoubleSide })); const a = i / 14 * Math.PI * 2; bk.position.set(Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0); bk.rotation.z = a; pelton.add(bk); }
pelton.position.set(0, 2.6, 0); turb.add(pelton);
const gen = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 2, 16), new THREE.MeshStandardMaterial({ color: 0x2e3440, metalness: .5 })); gen.rotation.x = Math.PI / 2; gen.position.set(0, 2.6, 2); turb.add(gen);
const turbGlow = glow(COL.eau, 8, turb, new THREE.Vector3(0, 2.6, 0));
/* exploitation agricole */
building({ x: 150, z: 92, w: 12, d: 22, h: 6, rh: 4, pv: true, ry: .9 });
const orchard = new THREE.InstancedMesh(new THREE.SphereGeometry(2.4, 8, 6), new THREE.MeshStandardMaterial({ color: 0x5b6b38, roughness: 1, flatShading: true }), 60);
const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.3, .4, 3, 6), new THREE.MeshStandardMaterial({ color: 0x5a4330 }), 60);
let oi = 0; for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) { const x = 120 + c * 8 + (r % 2) * 4, z = 106 + r * 8; const y = height(x, z); mtx.compose(new THREE.Vector3(x, y + 4.2, z), new THREE.Quaternion(), new THREE.Vector3(1, .85, 1)); orchard.setMatrixAt(oi, mtx); mtx.compose(new THREE.Vector3(x, y + 1.5, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); trunks.setMatrixAt(oi, mtx); oi++; }
orchard.castShadow = trunks.castShadow = true; scene.add(orchard); scene.add(trunks);
const sensors = []; [[130, 110], [150, 118], [170, 108], [186, 122], [140, 128]].forEach(p => { const y = height(p[0], p[1]); const s = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.4), mMetal); s.position.set(p[0], y + 1.2, p[1]); scene.add(s); const tip = new THREE.Mesh(new THREE.SphereGeometry(.35, 10, 10), new THREE.MeshBasicMaterial({ color: 0x55c08f })); tip.position.set(p[0], y + 2.5, p[1]); scene.add(tip); sensors.push({ g: glow(0x55c08f, 3.5, scene, tip.position.clone()) }); });
const pvField = new THREE.Group(); for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(2.2, .12, 3.4), mPV); p.position.set(i * 2.6, 1.4, 0); p.rotation.x = -.5; pvField.add(p); const l = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.6), mMetal); l.position.set(i * 2.6, .7, 0); pvField.add(l); }
pvField.position.copy(at(128, 76, 0)); pvField.rotation.y = .3; scene.add(shadowAll(pvField));
const wtank = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 4, 20), new THREE.MeshStandardMaterial({ color: 0x7c8a92, metalness: .4, roughness: .5 })); wtank.position.copy(at(146, 72, 2)); scene.add(shadowAll(wtank));
const ws = new THREE.Group(); const wsm = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 6), mMetal); wsm.position.y = 3; ws.add(wsm); const anemo = new THREE.Group(); for (let i = 0; i < 3; i++) { const cup = new THREE.Mesh(new THREE.SphereGeometry(.25, 8, 6), mWhite); const a = i / 3 * Math.PI * 2; cup.position.set(Math.cos(a) * .8, 0, Math.sin(a) * .8); anemo.add(cup); } anemo.position.y = 6; ws.add(anemo); ws.position.copy(at(176, 88, 0)); scene.add(ws);

/* ---------- vigie incendie ---------- */
const VIG = at(-150, -36, 0), FIRE = at(-128, -100, 2);
const vig = new THREE.Group(); const vm = new THREE.Mesh(new THREE.CylinderGeometry(.35, .6, 26, 10), mMetal); vm.position.y = 13; vig.add(vm); const vh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 2.4), mWhite); vh.position.y = 26.6; vig.add(vh);
const vpv = new THREE.Mesh(new THREE.BoxGeometry(3.4, .15, 2.2), mPV); vpv.position.set(0, 22, 1.6); vpv.rotation.x = .5; vig.add(vpv);
const scan = new THREE.Mesh(new THREE.ConeGeometry(34, 110, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x55c08f, transparent: true, opacity: .06, depthWrite: false, side: THREE.DoubleSide })); scan.geometry.translate(0, -55, 0); scan.rotation.z = Math.PI / 2 - .12; const scanP = new THREE.Group(); scanP.position.y = 26.6; scanP.add(scan); vig.add(scanP);
vig.position.copy(VIG); scene.add(shadowAll(vig)); scan.castShadow = false; const vigGlow = glow(0x55c08f, 7, scene, VIG.clone().add(new THREE.Vector3(0, 28, 0)));
const fnodes = []; [[-190, -90], [-170, -130], [-140, -70], [-112, -120], [-96, -52], [-176, -20], [-124, 8], [-210, -40]].forEach(q => { const y = height(q[0], q[1]); const s = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 5), mMetal); s.position.set(q[0], y + 2.5, q[1]); scene.add(s); fnodes.push(glow(0x55c08f, 4.5, scene, new THREE.Vector3(q[0], y + 5.4, q[1]))); });
const fireG = new THREE.Group(); fireG.position.copy(FIRE); scene.add(fireG); const flames = [], fsmoke = [];
for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: i % 3 ? 0xff7a1a : 0xffc24a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); s.position.set((rnd(i, 31) - .5) * 30, 2 + rnd(i, 32) * 4, (rnd(i, 33) - .5) * 22); fireG.add(s); flames.push({ s, ph: rnd(i, 34) * 6, b: 13 + rnd(i, 35) * 15 }); }
for (let i = 0; i < 18; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x6a6660, transparent: true, depthWrite: false, opacity: 0 })); fireG.add(s); fsmoke.push({ s, ph: i / 18, ox: (rnd(i, 36) - .5) * 24, oz: (rnd(i, 37) - .5) * 16 }); }
const fireL = new THREE.PointLight(0xff7a1a, 0, 220, 1.4); fireL.position.set(0, 12, 0); fireG.add(fireL);
const beam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(VIG.clone().add(new THREE.Vector3(0, 26.6, 0)), FIRE.clone().add(new THREE.Vector3(0, 6, 0))), 2, .35, 6), new THREE.MeshBasicMaterial({ color: COL.rose, transparent: true, opacity: 0, depthWrite: false })); scene.add(beam);
/* ---------- flux ---------- */
function arc(a, b, lift) { const m = a.clone().lerp(b, .5); m.y += lift; return new THREE.QuadraticBezierCurve3(a, m, b); }
const N = { mairie: at(-8, 4, 14), ecole: at(26, -14, 10), omb: at(26, 36, 6), batt: at(-2, 23, 5), borne: at(22, 30, 3), poste: at(-46, -30, 5), houses: at(40, 18, 8), houses2: at(-30, 28, 8),
  h2in: H2P.clone().add(new THREE.Vector3(0, 5, 0)), tanks: H2P.clone().add(new THREE.Vector3(-6, 3, -6)), chauf: CHP.clone().add(new THREE.Vector3(0, 3, 0)), turb: at(-96, 44, 5), farm: at(150, 92, 8), camp: antTip.position.clone(), pump: at(146, 72, 4), pvf: at(132, 77, 3), sensorsC: at(156, 116, 3), extra: at(96, -45, 4) };
const flows = [
  ["pv1", arc(N.ecole, N.houses, 10), COL.ambre], ["pv2", arc(N.mairie, N.batt, 6), COL.ambre], ["pv3", arc(N.omb, N.borne, 4), COL.ambre], ["pv4", arc(N.ecole, N.batt, 14), COL.ambre], ["pv5", arc(N.extra, N.ecole, 12), COL.ambre],
  ["grid", arc(N.poste, N.houses2, 10), COL.grid], ["grid2", arc(N.poste, N.mairie, 12), COL.grid], ["exp", arc(N.mairie, N.poste, 16), COL.ambre],
  ["bat", arc(N.batt, N.mairie, 8), COL.rose], ["bat2", arc(N.batt, N.borne, 5), COL.rose], ["bat3", arc(N.batt, N.houses2, 6), COL.rose],
  ["elz", arc(N.batt, N.h2in, 16), COL.ambre], ["h2s", arc(N.h2in, N.tanks, 6), COL.h2], ["fcm", arc(N.h2in, N.mairie, 22), COL.ambre],
  ["heat1", arc(N.chauf, N.ecole, 2), COL.heat], ["heat2", arc(N.chauf, N.mairie, 4), COL.heat],
  ["hyd", arc(N.turb, N.poste, 10), COL.eau], ["hyd2", arc(N.turb, N.batt, 12), COL.eau],
  ["dat1", arc(N.houses, N.camp, 20), COL.data], ["dat2", arc(N.farm, N.camp, 40), COL.data], ["dat3", arc(N.sensorsC, N.farm, 6), COL.data], ["dat4", arc(N.ecole, N.camp, 16), COL.data],
  ["agri", arc(N.pvf, N.pump, 4), COL.ambre]
].map(([k, c, col]) => { const dat = k.startsWith("dat"); const n = dat ? 10 : 18; const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: GLOW, color: col, size: dat ? 2.4 : 3.4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); pts.frustumCulled = false; scene.add(pts);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(c, 48, .12, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false })); scene.add(tube);
  return { k, c, n, pts, tube, on: 0, target: 0, speed: dat ? .42 : .2 }; });

/* ---------- points d'intérêt ---------- */
const HS = [
  { k: "mairie", n: "Mairie refuge", p: at(-8, 4, 22), cam: [45, 60, 90] },
  { k: "pv", n: "Solaire", proc: 1, p: at(26, -14, 16), cam: [90, 60, 30] },
  { k: "batt", n: "Batterie", proc: 1, p: at(-2, 23, 10), cam: [36, 50, 90] },
  { k: "h2", n: "Hydrogène", proc: 1, p: H2P.clone().add(new THREE.Vector3(0, 9, 0)), cam: [40, 32, 40] },
  { k: "bois", n: "Chaufferie bois", proc: 1, p: CHP.clone().add(new THREE.Vector3(0, 12, 0)), cam: [36, 30, -30] },
  { k: "hydro", n: "Torrent", proc: 1, p: at(-96, 44, 10), cam: [-30, 28, 40] },
  { k: "conso", n: "Suivi des consommations", proc: 1, p: at(40, 18, 16), cam: [40, 70, 80] },
  { k: "telecom", n: "Télécommunications", proc: 1, p: antTip.position.clone().add(new THREE.Vector3(0, 3, 0)), cam: [-40, 30, 60] },
  { k: "agri", n: "Agriculture instrumentée", proc: 1, p: at(150, 96, 14), cam: [50, 50, 70] },
  { k: "borne", n: "Borne de recharge", p: at(22, 30, 9), cam: [50, 30, 90] },
  { k: "ilot", n: "Îlotage et pilotage", proc: 1, p: at(-46, -30, 9), cam: [-30, 40, 50] },
  { k: "vigie", n: "Vigie incendie", p: VIG.clone().add(new THREE.Vector3(0, 32, 0)), cam: [60, 46, 90] }];
const hots = HS.map((h, i) => { const b = document.createElement("button"); b.className = "hot" + (h.proc ? " proc" : ""); b.type = "button"; b.innerHTML = (i + 1) + '<span class="lbl"></span>'; b.querySelector(".lbl").textContent = h.n; b.setAttribute("aria-label", h.n); b.onclick = () => api.focus(h.k); stage.appendChild(b); return b; });

/* ---------- état ---------- */
let S = { fire: 0, clock: 12, day: 195, cut: false, pv: 0, hyd: 0, bat: 0, imp: 0, exp: 0, elz: 0, fc: 0, soc: .6, h2on: false, pvK: 120, batK: 200, hydK: 5 };
const DAY = { top: new THREE.Color(0x3f78b8), bot: new THREE.Color(0xb7cfe0) }, DUSK = { top: new THREE.Color(0x26283a), bot: new THREE.Color(0xc06a5a) }, NIGHT = { top: new THREE.Color(0x07090d), bot: new THREE.Color(0x1d2026) };
function apply() {
  const t = S.clock, decl = 23.45 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + S.day + 1) / 365), lat = 42.3 * Math.PI / 180, w = (t - 12) * 15 * Math.PI / 180;
  const el = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(w), day = Math.max(0, el), az = (t - 12) / 12 * Math.PI;
  sun.position.set(Math.sin(az) * 300, Math.max(8, el * 320), Math.cos(az) * -180 - 60); sun.intensity = day > 0 ? .5 + day * 2.1 : 0; sun.color.setHSL(.09, .5 + .4 * (1 - Math.min(1, day * 2.5)), .6 + .28 * Math.min(1, day * 2));
  hemi.intensity = .18 + day * .5; amb.intensity = .2 + day * .08; const ei = Math.min(1, day * 3); [mPV, mMetal, mWhite, water.material].forEach(m => { m.envMapIntensity = ei; });
  const dusk = Math.max(0, 1 - Math.abs(el) * 3.2), base = day > 0 ? DAY : NIGHT;
  skyU.top.value.copy(base.top).lerp(DUSK.top, dusk * .85); skyU.bot.value.copy(base.bot).lerp(DUSK.bot, dusk * .85);
  if (sky) { sunDir.set(Math.sin(az) * .85, el, -Math.cos(az) * .6 - .2).normalize(); sky.material.uniforms.sunPosition.value.copy(sunDir); scene.fog.color.setRGB(.05, .06, .08).lerp(new THREE.Color(.5, .64, .8), Math.min(1, day * 2.2)).lerp(DUSK.bot, dusk * .5); }
  else scene.fog.color.copy(skyU.bot.value).multiplyScalar(.8);
  scene.fog.near = 200 + day * 420; scene.fog.far = 620 + day * 1900;
  stars.material.opacity = Math.max(0, -el * 1.6); renderer.toneMappingExposure = sky ? .5 + day * .12 : .82 + day * .14;
  setSnow(Math.max(0, Math.cos(2 * Math.PI * (S.day - 20) / 365)));
  const dark = day < .12, ilot = S.cut, lvl = dark ? (ilot ? .15 : ((t > 23.5 || t < 5) ? .4 : 1)) : 0;
  lamps.forEach(L => { L.bulb.material.emissiveIntensity = lvl * 2.2; L.cone.material.opacity = lvl * .09; L.gl.material.opacity = lvl * .85; }); lampLight.intensity = lvl * 1.1;
  mWin.emissiveIntensity = dark ? (ilot ? 0 : .9) : 0; mWinRef.emissiveIntensity = dark ? 1.2 : (ilot ? .6 : 0); mPV.emissiveIntensity = day * .12;
  const pvOn = S.pv > 2, chg = S.bat > .5, dis = S.bat < -.5, heat = t > 5.5 && t < 22.5, hy = S.hydK > 0;
  const T = { pv1: pvOn && !ilot, pv2: pvOn && chg, pv3: pvOn, pv4: pvOn && chg, pv5: pvOn && S.pvK > 120, grid: !ilot && S.imp > 1, grid2: !ilot && S.imp > 1, exp: !ilot && S.exp > 1, bat: dis, bat2: ilot && dis, bat3: !ilot && dis,
    elz: S.elz > .5, h2s: S.elz > .5, fcm: S.fc > .1, heat1: heat, heat2: heat, hyd: !ilot && hy, hyd2: hy && (ilot || chg), dat1: true, dat2: true, dat3: true, dat4: true, agri: pvOn };
  flows.forEach(f => f.target = T[f.k] ? 1 : 0);
  stackGlow.material.opacity = S.elz > .5 ? .9 : 0; fcGlow.material.opacity = S.fc > .1 ? .9 : 0; flameGlow.material.opacity = heat ? .9 : .1; flameM.visible = heat; turbGlow.material.opacity = hy ? .5 : 0;
  bLevels.forEach(b => { b.scale.y = Math.max(.05, S.soc); b.position.y = .9 + 1.5 * S.soc; });
  battG.children.forEach((b, k) => b.visible = S.batK > k * 220 && S.batK > 0);
  h2.visible = S.h2on; hydG.visible = turb.visible = hy;
  const ne = Math.min(extra.length, Math.max(0, Math.round((S.pvK - 120) / 10))); extra.forEach((g, k) => g.visible = k < ne);
  htaMat.color.setHex(ilot ? COL.rose : 0xb9bcb7); htaMat.opacity = ilot ? .55 : .85; cutG.visible = ilot;
  hots[3].style.opacity = S.h2on ? 1 : .55;
  const fr = S.fire; vigGlow.material.color.setHex(fr ? COL.rose : 0x55c08f); scan.material.color.setHex(fr ? COL.rose : 0x55c08f); scan.material.opacity = fr ? .1 : .05; fnodes.forEach(g => g.material.color.setHex(fr ? 0xff5a3a : 0x55c08f)); beam.material.opacity = fr ? .55 : 0; fireL.intensity = fr * 2.4; fireG.userData.k = fr;
}

/* ---------- caméra ---------- */
let tween = null; function flyTo(p, target, dur) { tween = { from: camera.position.clone(), to: p, tf: controls.target.clone(), tt: target, t0: performance.now(), dur: reduce ? 1 : dur }; }
const HOME = { p: new THREE.Vector3(150, 96, 190), t: new THREE.Vector3(10, 10, 6) };

/* ---------- post-traitement ---------- */
let composer = null, rpass = null, fxaa = null, bloom = null;
try { if (THREE.EffectComposer && THREE.UnrealBloomPass && THREE.GammaCorrectionShader) { composer = new THREE.EffectComposer(renderer); rpass = new THREE.RenderPass(scene, camera); composer.addPass(rpass);
  bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W(), Hh()), .42, .7, .86); composer.addPass(bloom); composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
  if (THREE.FXAAShader) { fxaa = new THREE.ShaderPass(THREE.FXAAShader); composer.addPass(fxaa); } } } catch (e) { composer = null; }
if (!composer) renderer.outputEncoding = THREE.sRGBEncoding;
function draw(sc, cam, strength) { if (composer) { rpass.scene = sc; rpass.camera = cam; bloom.strength = strength; composer.render(); } else renderer.render(sc, cam); }
/* ---------- boucle ---------- */
const v3 = new THREE.Vector3(); let tPrev = performance.now(), running = false, raf = 0;
function frame(now) {
  if (!running) return; raf = requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - tPrev) / 1000); tPrev = now; const sec = now / 1000;
  if (api.onTick) api.onTick(dt, now);
  if (api.studio && api.studio.active) { api.studio.update(dt, sec); renderer.toneMappingExposure = 1.02; draw(api.studio.scene, api.studio.camera, .55); hots.forEach(b => b.style.display = "none");
    if (api.pinEl) { const pn = api.studio.pin; if (pn) { v3.copy(pn).project(api.studio.camera); api.pinEl.style.display = v3.z < 1 ? "flex" : "none"; api.pinEl.style.left = ((v3.x + 1) / 2 * W()) + "px"; api.pinEl.style.top = ((1 - v3.y) / 2 * Hh()) + "px"; } else api.pinEl.style.display = "none"; }
    return; }
  if (tween) { const k = Math.min(1, (now - tween.t0) / tween.dur); const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; camera.position.lerpVectors(tween.from, tween.to, e); controls.target.lerpVectors(tween.tf, tween.tt, e); if (k >= 1) tween = null; }
  flows.forEach(f => { f.on += (f.target - f.on) * Math.min(1, dt * 4); const vis = f.on > .01; f.pts.visible = f.tube.visible = vis; f.pts.material.opacity = f.on; f.tube.material.opacity = f.on * .14;
    if (vis) { const a = f.pts.geometry.attributes.position.array; for (let i = 0; i < f.n; i++) { const u = (sec * f.speed + i / f.n) % 1; f.c.getPoint(u, v3); a[i * 3] = v3.x; a[i * 3 + 1] = v3.y; a[i * 3 + 2] = v3.z; } f.pts.geometry.attributes.position.needsUpdate = true; } });
  wT.offset.y -= dt * .9; pelton.rotation.z -= dt * 6; anemo.rotation.y += dt * 3; flag.rotation.y = Math.sin(sec * 1.6) * .15;
  antTip.material.color.setHex(Math.floor(sec * 1.4) % 2 ? COL.rose : 0xffffff); antGlow.material.opacity = .5 + .4 * Math.sin(sec * 4.4);
  waves.forEach((w, i) => { const u = ((sec * .55) + i / 3) % 1; w.scale.setScalar(2 + u * 26); w.material.opacity = (1 - u) * .35; });
  smoke.forEach(s => { const u = (sec * .12 + s.ph) % 1; s.s.position.set(3.4 + u * 3, 14 + u * 16, 2.6 + u * 1.5); const sz = 2 + u * 7; s.s.scale.set(sz, sz, 1); s.s.material.opacity = (flameM.visible ? .3 : 0) * (1 - u); });
  flameM.scale.y = 1 + .15 * Math.sin(sec * 14);
  meters.forEach((m, i) => { m.material.color.setHex(Math.floor(sec * 1.2 + i * .37) % 3 === 0 ? 0xffffff : 0x55c08f); });
  sensors.forEach((s, i) => { s.g.material.opacity = Math.floor(sec * .8 + i * .5) % 2 === 0 ? .9 : .2; });
  cutG.scale.setScalar(1 + .12 * Math.sin(sec * 5.5));
  const fk = fireG.userData.k || 0; scanP.rotation.y = fk ? Math.atan2(-(FIRE.z - VIG.z), FIRE.x - VIG.x) : scanP.rotation.y + dt * .5; vigGlow.material.opacity = .5 + .4 * Math.sin(sec * (fk ? 9 : 2)); fnodes.forEach((g, i) => { g.material.opacity = fk ? .5 + .5 * Math.sin(sec * 8 + i) : (Math.floor(sec * .6 + i * .4) % 3 === 0 ? .8 : .15); });
  flames.forEach(f => { const w = .6 + .4 * Math.sin(sec * 7 + f.ph); f.s.material.opacity = fk * w; const z = f.b * (.8 + .5 * w); f.s.scale.set(z, z * 1.5, 1); });
  fsmoke.forEach(f => { const u = (sec * .07 + f.ph) % 1; f.s.position.set(f.ox + u * 46, 6 + u * 90, f.oz + u * 20); const z = 14 + u * 60; f.s.scale.set(z, z, 1); f.s.material.opacity = fk * .55 * (1 - u); });
  controls.update(); draw(scene, camera, S.clock > 6.5 && S.clock < 19.5 ? .16 : .5);
  const w = W(), h = Hh();
  HS.forEach((p, i) => { v3.copy(p.p).project(camera); const b = hots[i]; const vis = v3.z < 1 && Math.abs(v3.x) < .98 && Math.abs(v3.y) < .96; b.style.display = vis ? "grid" : "none"; if (vis) { b.style.left = ((v3.x + 1) / 2 * w) + "px"; b.style.top = ((1 - v3.y) / 2 * h) + "px"; } });
}

const api = {
  HS: HS, onTick: null, filmOn: false, studio: null, pinEl: null, renderer: renderer, dom: renderer.domElement,
  enter(on) { controls.enabled = !on; if (!on) apply(); if (api.studio) { api.studio.camera.aspect = W() / Hh(); api.studio.camera.updateProjectionMatrix(); } },
  set(o) { Object.assign(S, o); apply(); },
  focus(k) { const i = HS.findIndex(h => h.k === k); if (i < 0) return; const h = HS[i]; hots.forEach((b, j) => b.classList.toggle("on", j === i)); controls.autoRotate = false;
    const tgt = h.p.clone(); tgt.y -= 4; flyTo(tgt.clone().add(new THREE.Vector3(...h.cam).multiplyScalar(h.proc ? 1.25 : 1)), tgt, 1400); setCut(h.proc ? h.k : null); if (onPick) onPick(h); },
  home() { hots.forEach(b => b.classList.remove("on")); setCut(null); flyTo(HOME.p.clone(), HOME.t.clone(), 1500); },
  shot(p, t, dur, orbit) { hots.forEach(b => b.classList.remove("on")); setCut(null); flyTo(new THREE.Vector3(p[0], p[1], p[2]), new THREE.Vector3(t[0], t[1], t[2]), dur || 2600); controls.autoRotate = !!orbit && !reduce; controls.autoRotateSpeed = orbit || .3; },
  resize() { const w = W(), h = Hh(), pr = renderer.getPixelRatio(); camera.aspect = w / h; camera.fov = w < h ? 52 : 38; camera.updateProjectionMatrix(); renderer.setSize(w, h); if (composer) { composer.setSize(w, h); if (fxaa) fxaa.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr)); } const off = api.filmOn ? Math.round(h * (w < h ? .2 : .15)) : 0; [camera, api.studio && api.studio.camera].forEach(c => { if (!c) return; if (off) c.setViewOffset(w, h, 0, off, w, h); else c.clearViewOffset(); }); if (api.studio) { api.studio.camera.aspect = w / h; api.studio.camera.updateProjectionMatrix(); } },
  start() { if (running) return; running = true; tPrev = performance.now(); api.resize(); raf = requestAnimationFrame(frame); },
  stop() { running = false; cancelAnimationFrame(raf); }
};
apply(); flyTo(HOME.p.clone(), HOME.t.clone(), 3200);
return api;
} };
})();
