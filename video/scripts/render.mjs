#!/usr/bin/env node
/* Rendu image par image du film Smart Paese.
   Sert le dépôt en HTTP local, ouvre film/film.html dans Chromium (Playwright), fait avancer
   l'horloge virtuelle d'une image à la fois et envoie chaque capture à FFmpeg.

   node scripts/render.mjs                      film complet → build/picture.mp4 (par tranches de 5 s, reprises possibles)
   node scripts/render.mjs --redo 35-52         refait seulement les tranches qui recouvrent 35–52 s
   node scripts/render.mjs --stills 12,48.5     images fixes → build/stills/
   node scripts/render.mjs --contact            une image au milieu de chaque plan → build/stills/
   node scripts/render.mjs --from 30 --to 40 --out build/extrait.mp4
   node scripts/render.mjs --page intro.html --from 0 --to 8 --out build/intro.mp4   ouverture (logo et zoom cartographique)
   Options : --workers N, --crf N, --png (capture sans perte), --ss 1.5 (suréchantillonnage), --no-subs (sans sous-titres incrustés) */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const VIDEO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), ROOT = path.resolve(VIDEO, ".."), BUILD = path.join(VIDEO, "build");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true); };
const FMT = arg("png") ? "png" : "jpeg"; // capture JPEG qualité 97 par défaut (bien plus rapide) ; --png pour une capture sans perte
const SS = +arg("ss", 1);          // suréchantillonnage : rendu en 2880 × 1620, réduit en 1920 × 1080 par FFmpeg (anticrénelage)
const NAR = JSON.parse(fs.readFileSync(path.join(VIDEO, "narration.json"), "utf8"));
const TL = JSON.parse(fs.readFileSync(path.join(BUILD, "timeline.json"), "utf8")), FPS = TL.fps;

/* La scène de l'artéfact est servie telle quelle, à trois ajouts près :
   un rendu désactivable (images à blanc), et l'accès du réalisateur aux objets de la scène. */
function sceneForFilm() {
  let s = fs.readFileSync(path.join(ROOT, "artifact/js/scene.js"), "utf8");
  const rep = (a, b) => { if (!s.includes(a)) throw new Error("scene.js a changé, motif introuvable : " + a.slice(0, 50)); s = s.replace(a, b); };
  rep("function draw(sc, cam, strength) {", "function draw(sc, cam, strength) { if (api.noDraw) return;");
  rep("apply(); flyTo(HOME.p.clone(), HOME.t.clone(), 3200);\nreturn api;",
    "apply(); flyTo(HOME.p.clone(), HOME.t.clone(), 3200);\napi.x = { scene, camera, controls, renderer, flows, sun, hemi, amb, sky, stars, terrain, pines, bush, shells, setCut, apply, bloom, HS, N, height, at, cutG, htaMat, lamps, mWin, mWinRef, mPV, water, h2, hydG, turb, fireG, tops, pelton, battG, waves, scan, vig, extra, omb, borne, pvField, wtank, ws, poste, camp, antTip, sensors, fnodes, meters, lampLight, VIG, FIRE, H2P, CHP, TUR, COL, beam, antGlow, mRoad };\nreturn api;");
  return s;
}
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".woff2": "font/woff2", ".jpg": "image/jpeg", ".png": "image/png", ".woff": "font/woff" };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const u = decodeURIComponent(req.url.split("?")[0]);
      try {
        if (u === "/gen/scene.film.js") { rsp.writeHead(200, { "content-type": MIME[".js"] }); return rsp.end(sceneForFilm()); }
        if (u === "/gen/timeline.js") { rsp.writeHead(200, { "content-type": MIME[".js"] }); return rsp.end("window.TIMELINE = " + JSON.stringify(TL) + "; window.TIMELINE.intro = " + JSON.stringify(NAR.intro || 0) + ";"); }
        const f = path.join(ROOT, path.normalize(u)); if (!f.startsWith(ROOT)) throw 0;
        const b = fs.readFileSync(f); rsp.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); rsp.end(b);
      } catch (e) { rsp.writeHead(404); rsp.end("404"); }
    });
    srv.listen(0, "127.0.0.1", () => res(srv));
  });
}
async function open() {
  const { chromium } = require("playwright");
  const srv = await serve(), port = srv.address().port;
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-frame-rate-limit", "--hide-scrollbars", "--force-color-profile=srgb"] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: SS });
  page.on("pageerror", e => { console.error("[page]", e.message); process.exitCode = 1; });
  page.on("console", m => { if (m.type() === "error") console.error("[console]", m.text()); });
  await page.goto("http://127.0.0.1:" + port + "/video/film/" + arg("page", "film.html"));
  await page.waitForFunction(() => window.Film && window.Film.ready, null, { timeout: 120000 });
  await page.evaluate(() => window.Film.ready);
  if (arg("no-subs")) await page.addStyleTag({ content: "#subs{display:none!important}" });
  const cdp = await page.context().newCDPSession(page);
  const prof = { render: 0, capture: 0, n: 0 };
  const shot = async t => { const a = Date.now(); await page.evaluate(t => window.Film.renderAt(t), t); const b = Date.now(); const r = await cdp.send("Page.captureScreenshot", FMT === "png" ? { format: "png", optimizeForSpeed: true } : { format: "jpeg", quality: 97, optimizeForSpeed: true }); prof.render += b - a; prof.capture += Date.now() - b; prof.n++; return Buffer.from(r.data, "base64"); };
  return { page, shot, prof, close: async () => { await browser.close(); srv.close(); } };
}
const ffmpeg = (out, crf) => spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", FMT === "png" ? "png" : "mjpeg", "-i", "-",
  "-vf", (SS !== 1 ? "scale=1920:1080:flags=lanczos," : "") + "format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-g", String(FPS * 2), "-bf", "2",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });

async function range(R, f0, f1, out, crf, label) {
  const ff = ffmpeg(out, crf), t0 = Date.now();
  await R.page.evaluate(t => window.Film.preroll(t), f0 / FPS);
  for (let f = f0; f < f1; f++) {
    const img = await R.shot(f / FPS);
    if (!ff.stdin.write(img)) await new Promise(r => ff.stdin.once("drain", r));
  }
  ff.stdin.end(); await new Promise((r, j) => ff.on("close", c => c ? j(new Error("ffmpeg " + c)) : r()));
  console.log(`${label} ${(f0 / FPS).toFixed(1)}–${(f1 / FPS).toFixed(1)} s : ${f1 - f0} images, ${((Date.now() - t0) / (f1 - f0) / 1000).toFixed(2)} s/image`);
}

const crf = +arg("crf", 17), CH = 5, TOTAL = Math.round(TL.duration * FPS), PARTS = path.join(BUILD, "parts");
if (arg("shots")) {            // exporte le découpage (début et fin de chaque plan) pour la bande-son
  const R = await open(); fs.writeFileSync(path.join(BUILD, "shots.json"), JSON.stringify(await R.page.evaluate(() => window.Film.shots), null, 1)); await R.close(); console.log("build/shots.json");
} else if (arg("bench")) {            // mesure le coût des passes de rendu (mise au point)
  const R = await open(), cdp = await R.page.context().newCDPSession(R.page), t = +arg("bench");
  const run = async (name, js) => { await R.page.evaluate(js); let a = Date.now(); for (let i = 0; i < 4; i++) { await R.page.evaluate(t => window.Film.renderAt(t), t + i / 30); await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 97, optimizeForSpeed: true }); } console.log(name, ((Date.now() - a) / 4).toFixed(0) + " ms"); };
  await run("référence", "0"); await run("référence", "0");
  await run("sans filtre CSS", "document.querySelector('#stage canvas').style.filter='none'");
  await run("sans backdrop", "document.querySelectorAll('*').forEach(e=>{e.style.backdropFilter='none'})");
  await run("sans grade", "document.getElementById('grade').style.display='none'");
  await run("scène vide", "window.__x.scene.visible=false");
  await run("scène visible", "window.__x.scene.visible=true");
  await run("sans bloom", "window.__x.bloom.enabled=false"); await run("ombres 2048", "window.__x.bloom.enabled=true; window.__x.sun.shadow.mapSize.set(2048,2048); window.__x.sun.shadow.map && window.__x.sun.shadow.map.dispose(); window.__x.sun.shadow.map=null");
  await run("sans ombres", "window.__x.renderer.shadowMap.enabled=false; window.__x.scene.traverse(o=>{if(o.material)o.material.needsUpdate=true})");
  await run("sans ombres ni bloom", "window.__x.bloom.enabled=false");
  await R.close();
} else if (arg("probe")) {
  const R = await open(), dir = path.join(BUILD, "probe"); fs.mkdirSync(dir, { recursive: true });
  const list = JSON.parse(fs.readFileSync(arg("probe"), "utf8"));
  const cdp = await R.page.context().newCDPSession(R.page);
  for (const q of list) { await R.page.evaluate(q => window.Film.probe(q), q); const r = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 88 }); fs.writeFileSync(path.join(dir, q.name + ".jpg"), Buffer.from(r.data, "base64")); console.log(q.name); }
  await R.close();
} else if (arg("stills") || arg("contact")) {
  const R = await open(), dir = path.join(BUILD, "stills"); fs.mkdirSync(dir, { recursive: true });
  const shots = await R.page.evaluate(() => window.Film.shots);
  const frac = String(arg("at", "0.5")).split(",").map(Number);
  const only = arg("only") ? String(arg("only")).split(",") : null;
  const list = arg("contact") ? shots.filter(s => !only || only.some(o => s.id.startsWith(o))).flatMap(s => frac.map(f => ({ t: s.start + (s.end - s.start) * f, name: s.id + "_" + Math.round(f * 100) }))) : String(arg("stills")).split(",").map(Number).map(t => ({ t, name: "t" + t.toFixed(2).padStart(7, "0") }));
  for (const q of list) { const t0 = Date.now(); await R.page.evaluate(t => window.Film.preroll(t), q.t); fs.writeFileSync(path.join(dir, q.name + ".png"), await R.shot(q.t)); console.log(q.name, q.t.toFixed(2), (Date.now() - t0) + " ms"); }
  await R.close();
} else if (arg("worker")) {
  const R = await open();
  for (const k of String(arg("chunks")).split(",").map(Number)) {
    const out = path.join(PARTS, `c${String(k).padStart(3, "0")}.mp4`), tmp = out.replace(".mp4", ".tmp.mp4");
    await range(R, k * CH * FPS, Math.min(TOTAL, (k + 1) * CH * FPS), tmp, crf, arg("label", "")); fs.renameSync(tmp, out);
  }
  await R.close();
} else if (arg("from") !== undefined) {
  const R = await open();
  await range(R, Math.round(+arg("from", 0) * FPS), Math.round(+arg("to", TL.duration) * FPS), path.resolve(arg("out", path.join(BUILD, "extrait.mp4"))), crf, "extrait");
  await R.close();
} else {
  /* Film complet, par tranches de 5 s conservées dans build/parts : seules les tranches manquantes sont rendues.
     --redo 35-52,96-101 refait les tranches qui recouvrent ces intervalles (en secondes) ; --redo all refait tout. */
  const n = +arg("workers", 2), nCh = Math.ceil(TOTAL / (CH * FPS)), key = require("node:crypto").createHash("sha1").update(JSON.stringify(TL) + SS + FMT).digest("hex"), kf = path.join(PARTS, "_key");
  if (!fs.existsSync(kf) || fs.readFileSync(kf, "utf8") !== key) { fs.rmSync(PARTS, { recursive: true, force: true }); }
  fs.mkdirSync(PARTS, { recursive: true }); fs.writeFileSync(kf, key);
  const redo = arg("redo") ? String(arg("redo")).split(",").map(r => r === "all" ? [0, 1e9] : r.split("-").map(Number)) : [];
  const file = k => path.join(PARTS, `c${String(k).padStart(3, "0")}.mp4`);
  const todo = []; for (let k = 0; k < nCh; k++) if (!fs.existsSync(file(k)) || redo.some(r => r[0] < (k + 1) * CH && r[1] > k * CH)) todo.push(k);
  console.log(`${todo.length} tranche(s) à rendre sur ${nCh}`);
  const jobs = [];
  for (let i = 0; i < n; i++) { const mine = todo.filter((_, j) => j % n === i); if (!mine.length) continue;
    jobs.push(new Promise((r, j) => { const p = spawn(process.execPath, [fileURLToPath(import.meta.url), "--worker", "--chunks", mine.join(","), "--crf", String(crf), "--label", `[${i + 1}/${n}]`, "--ss", String(SS), ...(arg("png") ? ["--png"] : []), ...(arg("no-subs") ? ["--no-subs"] : [])], { stdio: "inherit" }); p.on("close", c => c ? j(new Error("processus " + i + " : code " + c)) : r()); })); }
  await Promise.all(jobs);
  fs.writeFileSync(path.join(PARTS, "list.txt"), Array.from({ length: nCh }, (_, k) => `file '${path.basename(file(k))}'`).join("\n"));
  await new Promise((r, j) => spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(PARTS, "list.txt"), "-c", "copy", path.join(BUILD, "picture.mp4")], { stdio: "inherit" }).on("close", c => c ? j(new Error("concat")) : r()));
  console.log("image : build/picture.mp4,", TOTAL, "images");
}
