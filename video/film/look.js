/* Smart Paese — habillage « maquette » du village, appliqué par-dessus la scène de l'artéfact.
   Référence visuelle : village corse aux façades enduites claires, toits de tuile, campanile blanc,
   maquis arrondi, rochers, mer à l'horizon. La géométrie des équipements n'est pas modifiée. */
window.Look = function (X, THREE) {
"use strict";
const rnd = X.rnd, V = (x, y, z) => new THREE.Vector3(x, y, z);
function tex(w, fn, rep) { const c = document.createElement("canvas"); c.width = c.height = w; fn(c.getContext("2d"), w); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.encoding = THREE.sRGBEncoding; t.anisotropy = 2; return t; }

const strip = g => { Object.keys(g.attributes).forEach(k => { if (["position", "normal", "color"].indexOf(k) < 0) g.deleteAttribute(k); }); return g; };
const merge = a => THREE.BufferGeometryUtils.mergeBufferGeometries(a.map(strip));
/* ---------- façades enduites, volets, tuiles ---------- */
const plaster = tex(256, (g, w) => { g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, w, w); for (let i = 0; i < 2600; i++) { const v = 225 + Math.random() * 30; g.fillStyle = `rgba(${v},${v - 3},${v - 10},.25)`; g.fillRect(Math.random() * w, Math.random() * w, 2 + Math.random() * 14, 1 + Math.random() * 5); }
  g.fillStyle = "rgba(120,100,80,.10)"; g.fillRect(0, w - 26, w, 26); }, 1);
const WALLS = [0xfaf6ec, 0xf4e4c0, 0xfbf7f0, 0xeccf9c, 0xf8f1e4, 0xf3dfca, 0xfdfaf3, 0xf7ecd8], SHUT = [0x9a86a8, 0x5f8a63, 0x8fa3b5, 0xa9887a, 0x6d8f86];
X.mRoof.color.set(0xd48f66); X.mRoofB.color.set(0xc77f5c); X.mRoofL.color.set(0xdca27c);
[X.mRoof, X.mRoofB, X.mRoofL].forEach(m => { m.roughness = .8; });
let nb = 0;
X.scene.children.forEach(g => { if (!g.isGroup || !g.userData.body) return; const k = nb++, turb = g === X.turb;
  const wall = new THREE.MeshStandardMaterial({ color: turb ? 0xe6dfd0 : WALLS[(k * 3 + 1) % WALLS.length], map: plaster, roughness: .95 });
  const shut = new THREE.MeshStandardMaterial({ color: SHUT[(k * 2) % SHUT.length], roughness: .7 });
  const base = new THREE.MeshStandardMaterial({ color: 0xcfc6b4, roughness: 1 });
  g.traverse(o => { if (!o.isMesh) return; const m = o.material;
    if (m === X.mShut) o.material = shut;
    else if (m === X.mWall || m === X.mStone || (X.shells.hydro && X.shells.hydro.indexOf(o) >= 0 && o === g.userData.body)) { const p = o.geometry.parameters; o.material = p && p.height === 1.2 ? base : (o === g.userData.body && X.shells.hydro && X.shells.hydro.indexOf(o) >= 0 ? Object.assign(wall.clone(), { transparent: true }) : wall); } }); });
/* fenêtres et volets sur les pignons (l'artéfact n'en pose que sur deux façades).
   Toutes ces pièces sont fusionnées en trois maillages : des centaines d'objets séparés ralentiraient le rendu. */
{ const gw = [], gr = [], gs = [], m4 = new THREE.Matrix4(), tmp = new THREE.Object3D(), cS = new THREE.Color();
  const put = (list, geo, parent, x, y, z, ry, color) => { tmp.position.set(x, y, z); tmp.rotation.set(0, ry, 0); tmp.updateMatrix(); m4.multiplyMatrices(parent.matrixWorld, tmp.matrix); const g = geo.clone().applyMatrix4(m4).toNonIndexed();
    if (color) { const n = g.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = color.r; c[i * 3 + 1] = color.g; c[i * 3 + 2] = color.b; } g.setAttribute("color", new THREE.BufferAttribute(c, 3)); } list.push(g); };
  const gWin = new THREE.PlaneGeometry(1.3, 1.9), gSh = new THREE.BoxGeometry(.55, 1.9, .08); X.scene.updateMatrixWorld(true);
  X.scene.children.forEach(g => { if (!g.isGroup || !g.userData.body || g === X.turb) return; const p = g.userData.body.geometry.parameters; if (!p || p.width < 7.5) return;
    let ref = false, sm = null; g.traverse(o => { if (o.isMesh && o.material === X.mWinRef) ref = true; if (o.isMesh && o.geometry.parameters && o.geometry.parameters.width === .08) sm = o.material; });
    for (let f = 0; 2.6 + f * 3.6 + 1.2 < p.height; f++) [-1, 1].forEach(sx => [-1, 1].forEach(sz => { if (f === 0 && sz > 0 && p.width < 9) return; const x = sx * p.width * .27, y = 2.6 + f * 3.6;
      put(ref ? gr : gw, gWin, g, x, y, sz * (p.depth / 2 + .03), sz < 0 ? Math.PI : 0);
      if (sm) [-1, 1].forEach(sd => put(gs, gSh, g, x + sd * .98, y, sz * (p.depth / 2 + .06), 0, cS.copy(sm.color))); })); });
  const mesh = (list, mat, shadow) => { if (!list.length) return; const m = new THREE.Mesh(merge(list), mat); m.castShadow = !!shadow; m.receiveShadow = true; X.scene.add(m); };
  mesh(gw, X.mWin); mesh(gr, X.mWinRef); mesh(gs, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .7 }), true); }
/* campanile : fût blanc, corniche, lanternon à coupole */
const white = new THREE.MeshStandardMaterial({ color: 0xfbf9f3, map: plaster, roughness: .9 });
X.tw.material = white; X.cap.visible = false; X.bellM.material = new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: .8 }); X.bellM.scale.set(.72, 1, 1.02);
const cg = X.camp, add = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; cg.add(m); return m; };
const b2 = add(new THREE.Mesh(new THREE.BoxGeometry(5.3, 3.4, 3.8), X.bellM.material), 0, 20, 0); b2.scale.set(1.02, 1, .72);
[[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]].forEach(q => add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.6, 1.1), white), q[0], 20, q[1]));
add(new THREE.Mesh(new THREE.BoxGeometry(6.4, .7, 6.4), white), 0, 17.9, 0); add(new THREE.Mesh(new THREE.BoxGeometry(6.6, .8, 6.6), white), 0, 22.2, 0);
[[-2.7, -2.7], [2.7, -2.7], [-2.7, 2.7], [2.7, 2.7]].forEach(q => add(new THREE.Mesh(new THREE.BoxGeometry(.8, 1.5, .8), white), q[0], 23.3, q[1]));
add(new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 2.6, 8), white), 0, 23.9, 0);
add(new THREE.Mesh(new THREE.SphereGeometry(2.25, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), white), 0, 25.2, 0);

/* ---------- maquis : arbres et buissons arrondis, ombrés par la base ---------- */
function blob(r, det, amp, seed, cy, dark) { const g = new THREE.IcosahedronGeometry(r, det), p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + amp * (rnd(Math.round(x * 7) + seed, Math.round(y * 7 + z * 13)) - .5); p.setXYZ(i, x * k, y * k * .82 + cy, z * k);
    const s = dark + (1 - dark) * Math.min(1, Math.max(0, (y / r + 1) / 1.7)); col[i * 3] = s; col[i * 3 + 1] = s; col[i * 3 + 2] = s * .95; }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g.index ? g.toNonIndexed() : g; }
function trunk(h, r) { const g = new THREE.CylinderGeometry(r * .7, r, h, 6).toNonIndexed(); g.translate(0, h / 2, 0); const n = g.attributes.position.count, col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { col[i * 3] = .55; col[i * 3 + 1] = .38; col[i * 3 + 2] = .26; } g.setAttribute("color", new THREE.BufferAttribute(col, 3)); return g; }
const b1 = blob(3.1, 1, .34, 1, 6.2, .42), b2g = blob(2.3, 0, .3, 2, 5.0, .42), b3 = blob(2.1, 1, .34, 3, 5.3, .42); b2g.translate(1.9, 0, .8); b3.translate(-1.5, .4, -1.3);
X.pines.geometry = merge([trunk(4.4, .5), b1, b2g]);       // deux masses de feuillage : assez pour la silhouette, deux fois moins de triangles
X.pines.material = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .95 });
const tint = new THREE.Color(); for (let i = 0; i < X.pines.count; i++) { tint.setHSL(.23 + rnd(i, 6) * .07, .34 + rnd(i, 7) * .16, .13 + rnd(i, 8) * .08); X.pines.setColorAt(i, tint); } X.pines.instanceColor.needsUpdate = true;
X.bush.geometry = strip(blob(1.8, 1, .4, 5, 0, .5)); X.bush.castShadow = false; X.bush.material = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 1 });
for (let i = 0; i < X.bush.count; i++) { tint.setHSL(.2 + rnd(i, 25) * .09, .32 + rnd(i, 26) * .16, .17 + rnd(i, 27) * .1); X.bush.setColorAt(i, tint); } X.bush.instanceColor.needsUpdate = true;
X.orchard.geometry = strip(blob(2.5, 1, .3, 9, 0, .5)); X.orchard.material = new THREE.MeshStandardMaterial({ color: 0x7c8a58, vertexColors: true, roughness: 1 });
/* rochers clairs dans le maquis */
const NR = 520, rocks = new THREE.InstancedMesh(strip(blob(1, 0, .5, 11, 0, .7)), new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, flatShading: true }), NR), m4 = new THREE.Matrix4(), qt = new THREE.Quaternion();
let ri = 0; for (let i = 0; i < 9000 && ri < NR; i++) { const x = (rnd(i, 71) - .5) * 640, z = (rnd(i, 72) - .5) * 640, r = Math.hypot(x, z); if (r < 62 || r > 320 || X.clear(x, z)) continue; if (X.fbm(x * .02 + 70, z * .02 + 3) < .52) continue; const h = X.height(x, z); if (h < 2) continue;
  const sc = .7 + rnd(i, 73) * 1.6; qt.setFromEuler(new THREE.Euler(rnd(i, 74) * 3, rnd(i, 75) * 6, rnd(i, 76) * 3)); m4.compose(V(x, h + sc * .25, z), qt, V(sc * (1 + rnd(i, 77) * .6), sc * .7, sc)); rocks.setMatrixAt(ri, m4); tint.setHSL(.1, .08, .72 + rnd(i, 78) * .18); rocks.setColorAt(ri, tint); ri++; }
rocks.count = ri; rocks.castShadow = rocks.receiveShadow = true; X.scene.add(rocks); X.rocks = rocks;

/* ---------- sol, mer, lointain ---------- */
X.terrain.material.map = tex(512, (g, w) => { g.fillStyle = "#c9cdb6"; g.fillRect(0, 0, w, w); for (let i = 0; i < 5200; i++) { const v = 150 + Math.random() * 90, r = 2 + Math.random() * 13; g.fillStyle = `rgba(${v * .86},${v},${v * .7},.28)`; g.beginPath(); g.arc(Math.random() * w, Math.random() * w, r, 0, 6.3); g.fill(); }
  for (let i = 0; i < 9000; i++) { const v = 120 + Math.random() * 120; g.fillStyle = `rgba(${v},${v},${v * .8},.35)`; g.fillRect(Math.random() * w, Math.random() * w, 1.5, 1.5); } }, 46);
X.terrain.material.color.set(0xb9bfa2); X.terrain.material.needsUpdate = true;
const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshBasicMaterial({ color: 0x3d9fbe })); sea.rotation.x = -Math.PI / 2; sea.position.y = -8; X.scene.add(sea); X.sea = sea;
X.camera.far = 7000; X.camera.updateProjectionMatrix();
};
