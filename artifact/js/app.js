/* Smart Paese — application : scénarios, résultats du modèle, dossier, budget, calendrier. */
(function () {
"use strict";
const M = window.Model, PROC = window.PROC, $ = id => document.getElementById(id);
const fmt = (n, d = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const eur = n => Math.abs(n) >= 1e6 ? fmt(n / 1e6, 2) + " M€" : fmt(n / 1000, 0) + " k€";
const pct = (x, d = 0) => fmt(x * 100, d) + " %";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"], MD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function dateOf(d) { d = ((d % 365) + 365) % 365; let m = 0; while (d >= MD[m]) { d -= MD[m]; m++; } return (d + 1) + (d === 0 ? "er" : "") + " " + MONTHS[m]; }
function hhmm(t) { t = ((t % 24) + 24) % 24; const h = Math.floor(t), m = Math.floor((t - h) * 60); return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"); }
const SEAS = [{ n: "Hiver", d: 14 }, { n: "Printemps", d: 104 }, { n: "Été", d: 195 }, { n: "Automne", d: 287 }];
let CUT_START = 17, fire = false;

/* ---------- état ---------- */
let p = Object.assign({}, M.DEFAULTS), sim, res, cap, eco, isl = null;
let mode = "n", season = 2, x = 13, playing = false, V = {};
const REF = (function () { const s = M.simulate(M.DEFAULTS), c = M.capex(M.DEFAULTS); return { sim: s, res: M.resilience(s), cap: c, eco: M.economics(s, c, .7), noHyd: M.resilience(M.simulate(Object.assign({}, M.DEFAULTS, { hyd: 0 }))) }; })();

/* ---------- scène ---------- */
let scene = null;
try { if (window.THREE && window.THREE.OrbitControls) scene = window.Scene.create($("stage"), onPick); } catch (e) { scene = null; }
if (!scene) $("nogl").style.display = "grid";
let studio = null; try { if (scene && window.Studio) { studio = window.Studio.create(scene.renderer, scene.dom); scene.studio = studio; scene.pinEl = $("pin"); } } catch (e) { studio = null; }

/* ---------- calcul ---------- */
function recompute() { sim = M.simulate(p); res = M.resilience(sim); cap = M.capex(p); eco = M.economics(sim, cap, .7); isl = null; renderAnnual(); refresh(); }
let pending = false; function schedule() { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; recompute(); }); }

function instant() {
  const day = SEAS[season].d;
  if (mode === "n") { const i = day * 24 + Math.floor(x); return { clock: x, day: day, pv: sim.pv[i], hyd: sim.hyd[i], load: sim.load[i], soc: sim.soc[i], bat: sim.bat[i], imp: sim.imp[i], exp: sim.exp[i], elz: sim.elz[i], fc: 0, h2: sim.h2[i], ok: true }; }
  if (!isl) isl = M.island(sim, day * 24 + CUT_START, 96, fire ? .98 : null);
  const n = Math.min(95, Math.floor(x)), ok = isl.ok[n];
  return { clock: CUT_START + x, day: day + Math.floor((CUT_START + x) / 24), pv: isl.pv[n], hyd: isl.hyd[n], load: ok ? isl.load[n] : 0, soc: isl.soc[n], bat: ok ? isl.bat[n] : 0, imp: 0, exp: 0, elz: 0, fc: ok ? isl.fc[n] : 0, h2: isl.h2[n], ok: ok };
}

function refresh() {
  V = instant(); const cut = mode === "c";
  $("ck-h").textContent = hhmm(V.clock); $("ck-d").textContent = dateOf(V.day) + (cut ? " · coupure + " + Math.floor(x) + " h" : "");
  $("clock").className = "hud glass" + (cut ? (V.ok ? " cut" : " down") : "");
  $("ck-s").textContent = !cut ? "Réseau raccordé" : fire && x < 1 ? "Feu détecté : îlot préventif" : V.ok ? "Îlot : le refuge tient" : "Îlot : refuge éteint";
  $("in-when").textContent = dateOf(V.day) + ", " + hhmm(V.clock);
  const kw = v => fmt(v, v < 10 ? 1 : 0) + "<small>kW</small>";
  $("k-pv").innerHTML = kw(V.pv); $("k-hy").innerHTML = kw(V.hyd);
  $("k-load-l").textContent = cut ? "Charge critique" : "Consommation"; $("k-load").innerHTML = kw(V.load);
  $("k-soc").innerHTML = p.bat > 0 ? fmt(V.soc * 100) + "<small>%</small>" : "–"; $("k-socbar").style.width = (p.bat > 0 ? V.soc * 100 : 0) + "%";
  $("k-grid-l").textContent = cut ? "Réseau" : V.exp > .5 ? "Injecté" : "Soutiré"; $("k-grid").innerHTML = cut ? "coupé" : kw(V.exp > .5 ? V.exp : V.imp);
  if (p.h2) { $("k-x-l").textContent = "Hydrogène"; $("k-x").innerHTML = fmt(V.h2, 1) + "<small>kg</small>"; }
  else if (cut) { $("k-x-l").textContent = "Tenue"; $("k-x").innerHTML = isl.hours >= 96 ? "> 96<small>h</small>" : isl.hours + "<small>h</small>"; }
  else { const h = p.bat > 0 ? Math.max(0, V.soc - M.K.socMin) * p.bat * M.K.etaD / p.crit : 0; $("k-x-l").textContent = "Réserve refuge"; $("k-x").innerHTML = fmt(h, 0) + "<small>h</small>"; }
  $("sc-note").textContent = !cut ? "Journée du " + dateOf(SEAS[season].d) + ", heure par heure." :
    (fire ? "15 h, le " + dateOf(SEAS[season].d) + " : un feu démarre sous la ligne. La vigie le détecte, la batterie est chargée à 98 % par anticipation, puis le village s'isole avant la mise hors tension de la ligne. " : "La ligne tombe le " + dateOf(SEAS[season].d) + " à " + CUT_START + " h. ") + (isl.hours >= 96 ? "Le refuge tient les 96 heures simulées." : "Le refuge s'éteint après " + isl.hours + " heures.");
  drawDay();
  if (scene) scene.set({ fire: cut && fire ? Math.max(0, Math.min(1, 1 - (x - 30) / 20)) : 0, clock: V.clock % 24, day: V.day % 365, cut: cut, pv: V.pv, hyd: V.hyd, bat: V.bat, imp: V.imp, exp: V.exp, elz: V.elz, fc: V.fc, soc: V.soc, h2on: p.h2, pvK: p.pv, batK: p.bat, hydK: p.hyd });
  if (openKey === "conso" && DEF && DEF.flat) renderConso();
}

/* ---------- courbe de la période ---------- */
const dayC = $("day"), dx = dayC.getContext("2d");
function drawDay() {
  const w = dayC.clientWidth, h = dayC.clientHeight; if (!w) return; const dpr = Math.min(2, devicePixelRatio || 1);
  if (dayC.width !== w * dpr) { dayC.width = w * dpr; dayC.height = h * dpr; } dx.setTransform(dpr, 0, 0, dpr, 0, 0); dx.clearRect(0, 0, w, h);
  const cut = mode === "c", n = cut ? 96 : 24, i0 = SEAS[season].d * 24, A = { pv: [], hyd: [], load: [], soc: [], ok: [] };
  for (let k = 0; k < n; k++) { if (cut) { A.pv.push(isl.pv[k]); A.hyd.push(isl.hyd[k]); A.load.push(isl.ok[k] ? isl.load[k] : 0); A.soc.push(isl.soc[k]); A.ok.push(isl.ok[k]); } else { A.pv.push(sim.pv[i0 + k]); A.hyd.push(sim.hyd[i0 + k]); A.load.push(sim.load[i0 + k]); A.soc.push(sim.soc[i0 + k]); A.ok.push(true); } }
  const top = Math.max(10, ...A.pv, ...A.load) * 1.1, L = 30, R = 8, T = 10, B = 20, X = k => L + k / n * (w - L - R), Y = v => T + (1 - v / top) * (h - T - B);
  dx.font = "10px IBM Plex Mono, monospace"; dx.fillStyle = "#a2a4a0"; dx.strokeStyle = "rgba(255,255,255,.08)"; dx.lineWidth = 1;
  [0, .5, 1].forEach(f => { const y = T + f * (h - T - B); dx.beginPath(); dx.moveTo(L, y); dx.lineTo(w - R, y); dx.stroke(); dx.fillText(fmt(top * (1 - f)) + (f ? "" : " kW"), 2, y + 3); });
  const stepL = cut ? 24 : 6; for (let k = 0; k <= n; k += stepL) dx.fillText(cut ? "+" + k + " h" : k + " h", Math.min(X(k) - 6, w - 34), h - 6);
  if (cut) { const f = A.ok.indexOf(false); if (f >= 0) { dx.fillStyle = "rgba(233,66,108,.22)"; dx.fillRect(X(f), T, X(n) - X(f), h - T - B); } }
  const path = (arr, map) => { dx.beginPath(); arr.forEach((v, k) => { const px = X(k + .5), py = map(v); k ? dx.lineTo(px, py) : dx.moveTo(px, py); }); };
  path(A.pv, Y); dx.lineTo(X(n - .5), Y(0)); dx.lineTo(X(.5), Y(0)); dx.closePath(); dx.fillStyle = "rgba(249,178,61,.2)"; dx.fill();
  path(A.pv, Y); dx.strokeStyle = "#F9B23D"; dx.lineWidth = 2; dx.stroke();
  path(A.hyd, Y); dx.strokeStyle = "#5fa8d6"; dx.lineWidth = 1.6; dx.stroke();
  path(A.load, Y); dx.strokeStyle = "#ecece8"; dx.lineWidth = 1.4; dx.setLineDash([3, 3]); dx.stroke(); dx.setLineDash([]);
  if (p.bat > 0) { path(A.soc, v => T + (1 - v) * (h - T - B)); dx.strokeStyle = "#E9426C"; dx.lineWidth = 1.6; dx.stroke(); }
  dx.strokeStyle = "#fff"; dx.lineWidth = 1; dx.beginPath(); dx.moveTo(X(x), T - 4); dx.lineTo(X(x), h - B); dx.stroke();
}

/* ---------- résultats annuels ---------- */
function renderAnnual() {
  $("a-p72").innerHTML = pct(res.p72) ; $("a-p5").innerHTML = (res.p5 >= 96 ? "> 96" : res.p5) + "<small>h</small>";
  $("a-ap").innerHTML = pct(sim.autoprod, 1); $("a-ac").innerHTML = pct(sim.autoconso, 1);
  $("a-cap").innerHTML = eur(cap.total); $("a-gain").innerHTML = eur(eco.net) + "<small>/an</small>";
  const W = 380, H = 170, L = 34, R = 10, T = 12, B = 26, X = h => L + h / 96 * (W - L - R), Y = v => T + (1 - v) * (H - T - B);
  let s = '<defs><linearGradient id="sg" x1="0" x2="1"><stop offset="0" stop-color="#F9B23D"/><stop offset=".5" stop-color="#F08363"/><stop offset="1" stop-color="#E9426C"/></linearGradient></defs>';
  [0, .5, 1].forEach(v => { s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#d9d9d5"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v * 100} %</text>`; });
  [0, 24, 48, 72, 96].forEach(h => { s += `<text x="${X(h)}" y="${H - 8}" text-anchor="middle">${h} h</text>`; });
  s += `<line x1="${L}" x2="${W - R}" y1="${Y(.95)}" y2="${Y(.95)}" stroke="#151615" stroke-dasharray="3 4"/><text x="${W - R}" y="${Y(.95) - 5}" text-anchor="end">cible 95 %</text>`;
  s += `<polyline fill="none" stroke="url(#sg)" stroke-width="3" stroke-linejoin="round" points="${res.curve.map(c => X(c.h) + "," + Y(c.p)).join(" ")}"/>`;
  s += `<circle cx="${X(72)}" cy="${Y(res.p72)}" r="5" fill="#151615"/><text x="${X(72) - 8}" y="${Y(res.p72) + (res.p72 > .3 ? 18 : -10)}" text-anchor="end" style="font-weight:600;fill:#151615">${pct(res.p72)} à 72 h</text>`;
  $("surv").innerHTML = s;
  const weak = res.season72.indexOf(Math.min(...res.season72)), sn = ["l'hiver", "le printemps", "l'été", "l'automne"][weak];
  $("verdict").textContent = p.bat === 0 ? "Sans batterie, rien ne peut reformer le réseau du village : le refuge s'éteint avec la ligne." :
    res.p72 >= .95 ? "Objectif tenu. Le refuge passe 72 heures dans " + pct(res.p72) + " des coupures simulées" + (res.p72 < .999 ? " ; la saison la plus fragile est " + sn + " (" + pct(res.season72[weak]) + ")." : ", en toute saison.") :
    "Objectif non tenu : " + pct(res.p72) + " à 72 heures, pour une cible de 95 %. La saison la plus fragile est " + sn + " (" + pct(res.season72[weak]) + "). Leviers : plus de batterie, le torrent, ou une charge critique réduite.";
}

/* ---------- commandes ---------- */
const tIn = $("t");
function setMode(m, fr) { fire = !!fr; CUT_START = fire ? 15 : 17; if (fire && season !== 2) selSeason(2); mode = m; $("m-n").setAttribute("aria-pressed", m === "n"); $("m-c").setAttribute("aria-pressed", m === "c" && !fire); $("m-f").setAttribute("aria-pressed", fire); isl = null; tIn.max = m === "c" ? 95.99 : 23.99; tIn.step = m === "c" ? .25 : .05; x = m === "c" ? 0 : 13; tIn.value = x; tIn.setAttribute("aria-label", m === "c" ? "Heures écoulées depuis la coupure" : "Heure"); refresh(); }
$("m-n").onclick = () => setMode("n"); $("m-c").onclick = () => { setMode("c"); if (!reduce) setPlay(true); }; $("m-f").onclick = () => { setMode("c", true); if (scene) scene.shot([-40, 70, 60], [-110, 20, -70], 2600, 0); if (!reduce) setPlay(true); };
SEAS.forEach((s, i) => { const b = document.createElement("button"); b.type = "button"; b.textContent = s.n; b.setAttribute("aria-pressed", i === season); b.onclick = () => selSeason(i); $("seasons").appendChild(b); });
function selSeason(i) { season = i; isl = null; [...$("seasons").children].forEach((c, j) => c.setAttribute("aria-pressed", j === i)); refresh(); }
tIn.addEventListener("input", () => { setPlay(false); x = +tIn.value; refresh(); });
function setPlay(on) { playing = on; $("play").textContent = on ? "❚❚" : "▶"; $("play").setAttribute("aria-label", on ? "Mettre en pause" : "Lancer la lecture"); }
$("play").onclick = () => setPlay(!playing);
let acc = 0;
function tick(dt) { if (!playing) return; x += dt * (mode === "c" ? 6 : 1.6); const max = +tIn.max; if (x > max) { if (mode === "c") { x = max; setPlay(false); } else x -= max; } tIn.value = x; acc += dt; if (acc > .06) { acc = 0; refresh(); } }
if (scene) scene.onTick = tick; else { let t0 = performance.now(); (function loop(now) { tick(Math.min(.05, (now - t0) / 1000)); t0 = now; requestAnimationFrame(loop); })(t0); }

const PARAMS = [["pv", " kWc"], ["bat", " kWh"], ["hyd", " kW"], ["crit", " kW"], ["abo", ""]];
function syncInputs() { PARAMS.forEach(([k, u]) => { $("p-" + k).value = p[k]; $("o-" + k).textContent = fmt(p[k], k === "crit" ? 1 : 0) + u; }); $("p-h2").checked = p.h2; $("p-pred").checked = p.pred; }
PARAMS.forEach(([k, u]) => $("p-" + k).addEventListener("input", e => { p[k] = +e.target.value; if (k === "bat") p.pbat = Math.max(50, p.bat / 2); $("o-" + k).textContent = fmt(p[k], k === "crit" ? 1 : 0) + u; schedule(); }));
$("p-h2").addEventListener("change", e => { p.h2 = e.target.checked; schedule(); }); $("p-pred").addEventListener("change", e => { p.pred = e.target.checked; schedule(); });
$("reset").onclick = () => { p = Object.assign({}, M.DEFAULTS); syncInputs(); recompute(); };

/* ---------- points de la scène ---------- */
const CARDS = {
  mairie: () => ["Mairie refuge", "En coupure, elle reste alimentée : accueil, éclairage, recharge des téléphones, communications de crise. Avec les relais et la pompe à eau, elle forme la charge critique de " + fmt(p.crit, 1) + " kW."],
  vigie: () => ["Vigie incendie", "Un mât autonome, alimenté par son panneau, porte une caméra qui balaie le versant. Des capteurs de fumée et de température sont répartis dans le maquis. Une analyse d'image automatique lève l'alerte ; l'automate du village charge alors la batterie et prépare l'îlotage. Lancez le scénario « Feu de forêt »."],
  borne: () => ["Borne de recharge", "Alimentée en priorité par l'ombrière. En coupure, elle est réservée aux véhicules de secours et de la commune."]
};
function onPick(h) { if (h.proc) { $("card").style.display = "none"; openComp(h.k); } else { closeComp(); const c = CARDS[h.k](); $("card").querySelector("h3").textContent = c[0]; $("card").querySelector("p").textContent = c[1]; $("card").style.display = "block"; } markDock(h.k); }
$("card-x").onclick = () => { $("card").style.display = "none"; };
const dock = $("dock"), ATL = { ilot: "Îlotage et pilotage", pv: "Solaire", hydro: "Torrent", batt: "Batterie", h2: "Hydrogène" }, PC = { bois: ["Bois", "#F08363"], conso: ["Consommations", "#ecece8"], telecom: ["Télécoms", "#E9426C"], agri: ["Agriculture", "#55c08f"] };
function markDock(k) { [...dock.querySelectorAll("button[data-k]")].forEach(b => b.classList.toggle("on", b.dataset.k === k)); }
const mk = (txt, k, col) => { const b = document.createElement("button"); b.type = "button"; if (k) b.dataset.k = k; if (col) { b.style.setProperty("--c", col); b.innerHTML = "<i></i>"; } b.appendChild(document.createTextNode(txt)); dock.appendChild(b); return b; };
const sepEl = () => { const e = document.createElement("span"); e.className = "sep"; dock.appendChild(e); };
const bHome = mk("Vue d'ensemble"); sepEl();
Object.keys(ATL).forEach(k => { mk(ATL[k], k, "linear-gradient(90deg,#F9B23D,#E9426C)").onclick = () => { stopTour(); pick(k); }; }); sepEl();
Object.keys(PC).forEach(k => { mk(PC[k][0], k, PC[k][1]).onclick = () => { stopTour(); pick(k); }; }); sepEl();
const bTour = mk("Visite guidée");
function pick(k) { if (scene && !(studio && studio.active)) scene.focus(k); else { onPick({ k: k, proc: true }); } }
bHome.onclick = () => { stopTour(); closeComp(); $("card").style.display = "none"; markDock(null); if (scene) scene.home(); };
let tourT = null, tourI = 0; const TOUR = ["ilot", "pv", "hydro", "batt", "h2"];
function stopTour() { if (tourT) { clearInterval(tourT); tourT = null; bTour.textContent = "Visite guidée"; } }
bTour.onclick = () => { if (tourT) { stopTour(); return; } bTour.textContent = "Arrêter la visite"; tourI = 0; onPick({ k: TOUR[0], proc: true }); tourT = setInterval(() => { tourI = (tourI + 1) % TOUR.length; onPick({ k: TOUR[tourI], proc: true }); }, 30000); };

/* ---------- panneau d'un équipement : atelier 3D ou schéma ---------- */
let openKey = null, step = 0, stepTimer = null, readT = null, DEF = null, presOn = false;
const ul = a => "<ul>" + a.map(t => "<li>" + t + "</li>").join("") + "</ul>", show = (id, on) => { $(id).style.display = on ? "" : "none"; };
function openComp(k) {
  const is3d = !!(studio && studio.has(k)); if (!is3d && !PROC[k]) return;
  stopSteps(); openKey = k; $("cmd").hidden = true; $("comp").hidden = presOn; setPlay(false);
  if (is3d) { DEF = studio.open(k); scene.enter(true); $("clock").style.display = "none"; $("atl").style.display = "block"; $("atl-t").textContent = ATL[k]; }
  else { if (studio && studio.active) leave3d(); DEF = Object.assign({ flat: true }, PROC[k], { steps: PROC[k].steps.map(q => [q[0], q[1]]) }); }
  $("c-eye").textContent = is3d ? "Atelier 3D" : "Schéma de principe"; $("d-title").textContent = DEF.title; $("d-sub").textContent = DEF.sub;
  show("d-schema", !is3d); show("d-calc", !is3d); show("d-fin", !is3d); show("d-pilot", is3d);
  if (!is3d) { $("d-schema").innerHTML = DEF.svg; $("d-fin").innerHTML = "<h3>Appuis et références</h3>" + ul(DEF.fin); renderCalc(); }
  const ss = $("d-steps"); ss.innerHTML = DEF.steps.map((q, i) => `<button type="button" class="s" data-i="${i}" aria-label="Étape ${i + 1}">${i + 1}</button>`).join("") + '<span class="nv"><button type="button" id="d-all">Vue entière</button><button type="button" id="d-next">Suivant ›</button></span>';
  ss.querySelectorAll("button.s").forEach(b => b.onclick = () => { stopSteps(); stopTour(); goStep(+b.dataset.i); });
  $("d-next").onclick = () => { stopSteps(); stopTour(); goStep((step + 1) % DEF.steps.length); }; $("d-all").onclick = () => { stopSteps(); stopTour(); goStep(-1); };
  $("d-keys").innerHTML = "<h3>Repères</h3>" + ul(DEF.keys); $("d-warn").innerHTML = "<h3>Points de vigilance</h3>" + ul(DEF.warn);
  if (is3d) renderPilot();
  goStep(0); if (!reduce) stepTimer = setInterval(() => goStep((step + 1) % DEF.steps.length), is3d ? 6000 : 4500);
  if (is3d) readT = setInterval(readouts, 250);
  $("deck").scrollTop = 0; if (innerWidth <= 900) $("main").scrollTop = 0; }
function leave3d() { studio.close(); scene.enter(false); $("atl").style.display = "none"; $("pin").style.display = "none"; $("clock").style.display = ""; }
function stopSteps() { if (stepTimer) { clearInterval(stepTimer); stepTimer = null; } }
function goStep(i) { step = Math.max(0, i);
  if (DEF.flat) { const sch = $("d-schema"); sch.classList.toggle("stepping", i >= 0); sch.querySelectorAll("[data-s]").forEach(g => g.classList.toggle("dim", i >= 0 && g.dataset.s !== String(i + 1))); }
  else { studio.goStep(i); const pe = $("pin"); if (i >= 0) { pe.querySelector("b").textContent = i + 1; pe.querySelector("span").textContent = DEF.steps[i][0]; } readouts(); }
  $("d-steps").querySelectorAll("button.s").forEach((b, j) => b.setAttribute("aria-pressed", j === i));
  $("d-stept").innerHTML = "<b></b><p></p>"; $("d-stept").querySelector("b").textContent = i < 0 ? "Vue entière" : (i + 1) + ". " + DEF.steps[i][0]; $("d-stept").querySelector("p").textContent = i < 0 ? DEF.sub : DEF.steps[i][1]; }
function renderPilot() { const box = $("d-pilot"); let h = "<h3>Pilotage</h3>";
  DEF.ui.forEach(u => { if (u.t === "range") h += `<div class="row" style="margin-top:0"><label for="u-${u.k}">${u.label}</label><output id="uo-${u.k}"></output><input type="range" id="u-${u.k}" min="${u.min}" max="${u.max}" step="${u.step}" value="${DEF.st[u.k]}"></div>`;
    else h += `<div class="seg sm" role="group" id="u-${u.k}">` + u.opts.map(o => `<button type="button" data-v="${o[0]}" aria-pressed="${DEF.st[u.k] === o[0]}">${o[1]}</button>`).join("") + "</div>"; });
  h += '<div class="res four" id="u-read"></div>';
  if (DEF.plot) h += '<canvas class="chart" id="u-plot" style="height:160px;margin-top:8px" aria-label="Courbe de fonctionnement"></canvas><p class="note" style="margin-top:6px">' + DEF.plotCap + "</p>";
  if (DEF.eq) h += '<div class="eq sm">' + DEF.eq.join("\n") + "</div>";
  h += ul(DEF.pilot); box.innerHTML = h; box.querySelector("ul").style.marginTop = "10px";
  DEF.ui.forEach(u => { if (u.t === "range") { const el = $("u-" + u.k), o = $("uo-" + u.k); o.textContent = u.f(DEF.st[u.k]); el.addEventListener("input", () => { DEF.st[u.k] = +el.value; o.textContent = u.f(DEF.st[u.k]); readouts(); }); }
    else $("u-" + u.k).querySelectorAll("button").forEach(b => b.onclick = () => { DEF.st[u.k] = +b.dataset.v; $("u-" + u.k).querySelectorAll("button").forEach(c => c.setAttribute("aria-pressed", c === b)); readouts(); }); });
  readouts(); }
function readouts() { const e = $("u-read"); if (!e || !DEF || DEF.flat) return; e.innerHTML = DEF.read().map(r => `<div><div class="k">${r[0]}</div><div class="v">${r[1]}</div></div>`).join(""); drawPlot(); }
function drawPlot() { const c = $("u-plot"); if (!c || !DEF || !DEF.plot) return; const w = c.clientWidth, h = c.clientHeight; if (!w) return; const dpr = Math.min(2, devicePixelRatio || 1);
  if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); } const g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.font = "10px IBM Plex Mono, monospace";
  const L = 36, R = 10, T = 14, B = 22; let X, Y, fx, dec;
  const clip = fn => { g.save(); g.beginPath(); g.rect(L, T - 4, w - L - R, h - T - B + 8); g.clip(); fn(); g.restore(); };
  const pl = {
    frame(x0, x1, y0, y1, xl, yl) { fx = [x0, x1]; X = v => L + (v - x0) / (x1 - x0) * (w - L - R); Y = v => T + (1 - (v - y0) / (y1 - y0)) * (h - T - B); g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; g.fillStyle = "#a2a4a0";
      const dy = y1 - y0 < 5 ? (y1 - y0 < 1.5 ? 2 : 1) : 0, dxd = x1 - x0 < 5 ? 1 : 0;
      [0, .5, 1].forEach(f => { const yv = y0 + (y1 - y0) * f, xv = x0 + (x1 - x0) * f; g.beginPath(); g.moveTo(L, Y(yv)); g.lineTo(w - R, Y(yv)); g.stroke(); g.fillText(fmt(yv, dy), 2, Y(yv) + 3); g.fillText(fmt(xv, dxd), Math.min(X(xv) - 6, w - 30), h - 7); });
      g.fillStyle = "#70736f"; g.fillText(yl, L + 4, T + 6); g.fillText(xl, w - R - g.measureText(xl).width - 2, h - B - 5); },
    line(fn, col, lw, dash) { clip(() => { g.beginPath(); for (let i = 0; i <= 90; i++) { const xv = fx[0] + (fx[1] - fx[0]) * i / 90, yv = fn(xv); i ? g.lineTo(X(xv), Y(yv)) : g.moveTo(X(xv), Y(yv)); } g.strokeStyle = col; g.lineWidth = lw || 2; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]); }); },
    pts(a, col, lw) { clip(() => { g.beginPath(); a.forEach((q, i) => i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1]))); g.strokeStyle = col; g.lineWidth = lw || 2; g.stroke(); }); },
    hline(yv, col, label) { g.strokeStyle = col; g.lineWidth = 1; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(L, Y(yv)); g.lineTo(w - R, Y(yv)); g.stroke(); g.setLineDash([]); if (label) { g.fillStyle = col; g.fillText(label, w - R - g.measureText(label).width - 2, Y(yv) - 4); } },
    band(x0, x1, col) { g.fillStyle = col; g.fillRect(X(x0), T, X(x1) - X(x0), h - T - B); },
    text(xv, yv, t, col) { g.fillStyle = col; g.fillText(t, X(xv) - g.measureText(t).width / 2, Y(yv)); },
    dot(xv, yv, col, label) { const px = X(xv), py = Y(yv); g.fillStyle = col; g.beginPath(); g.arc(px, py, 4.5, 0, 6.3); g.fill(); g.strokeStyle = "#141615"; g.lineWidth = 1.5; g.stroke(); if (label) { g.fillStyle = col; const tw = g.measureText(label).width; g.fillText(label, px + 8 + tw > w - R ? px - 8 - tw : px + 8, py < T + 14 ? py + 14 : py - 7); } } };
  DEF.plot(pl); }
function renderCalc() { const c = DEF.calc, box = $("d-calc");
  if (c.live) { renderConso(); return; }
  if (c.list) { box.innerHTML = "<h3>" + c.title + "</h3>" + ul(c.list); return; }
  box.innerHTML = "<h3>" + c.title + "</h3>" + c.inputs.map(q => `<div class="row"><label for="ci-${q[0]}">${q[1]}</label><output id="co-${q[0]}"></output><input type="range" id="ci-${q[0]}" min="${q[2]}" max="${q[3]}" step="${q[4]}" value="${q[5]}"></div>`).join("") + '<div class="res" id="cres"></div><p class="note">Ordres de grandeur.</p>';
  const run = () => { const v = {}; c.inputs.forEach(q => { v[q[0]] = +$("ci-" + q[0]).value; $("co-" + q[0]).textContent = fmt(v[q[0]]) + " " + q[6]; }); $("cres").innerHTML = c.out(v).map(r => `<div><div class="k">${r[0]}</div><div class="v">${r[1]}</div></div>`).join(""); };
  c.inputs.forEach(q => $("ci-" + q[0]).addEventListener("input", run)); run(); }
function renderConso() { const box = $("d-calc"), t = V.clock % 24, night = t < 7 || t > 19;
  const parts = mode === "n" ? [["Logements", V.load * .78], ["Mairie", V.load * .07], ["École", V.load * (t > 8 && t < 17 ? .1 : .03)], ["Éclairage", night ? V.load * .05 : 0]] : [["Mairie refuge", V.load * .55], ["Pompe à eau", V.load * .2], ["Télécoms", V.load * .12], ["Éclairage minimal", night ? V.load * .13 : 0]];
  const max = Math.max(...parts.map(q => q[1]), .1);
  box.innerHTML = "<h3>Le village à " + hhmm(V.clock) + "</h3>" + parts.map(q => `<div style="display:grid;grid-template-columns:110px 1fr 62px;gap:8px;align-items:center;margin:6px 0;font-size:13px"><span>${q[0]}</span><span style="height:8px;border-radius:4px;background:#e2e2de;overflow:hidden"><i style="display:block;height:100%;width:${q[1] / max * 100}%;background:var(--grad)"></i></span><span class="mono" style="text-align:right">${fmt(q[1], 1)} kW</span></div>`).join("") + '<p class="note">Répartition illustrative ; elle suit l\'heure et le scénario choisis.</p>'; }
function closeComp() { if (!openKey) return; openKey = null; DEF = null; stopSteps(); if (readT) { clearInterval(readT); readT = null; } if (studio && studio.active) leave3d(); $("comp").hidden = true; $("cmd").hidden = presOn; requestAnimationFrame(drawDay); }
$("close").onclick = () => { stopTour(); closeComp(); markDock(null); if (scene) scene.home(); };
addEventListener("keydown", e => { if (e.key === "Escape" && openKey && !presOn) { stopTour(); closeComp(); markDock(null); } });

/* ---------- dossier : valeurs issues du modèle ---------- */
const BUD = (function () {
  const d = REF.cap.total, r = M.capex(M.DEFAULTS, { noInstr: true }).total;
  const G = [
    ["Travaux", [["Village démonstrateur, configuration de référence", d], ["Deux villages répliques", 2 * r]]],
    ["Recherche", [["Thèse Cifre, coût employeur sur 36 mois", 135000], ["Thèse sur contrat doctoral, 36 mois", 120000], ["Post-doctorat en sciences sociales, 18 mois", 90000], ["Ingénieur de recherche, 36 mois", 180000], ["Essais sur plateformes et petits équipements", 80000], ["Fonctionnement, missions, publications, données ouvertes", 70000]]],
    ["Pilotage", [["Chef de projet du syndicat, mi-temps sur cinq ans", 160000], ["Assistance à maîtrise d'ouvrage, étude d'îlotage, conseil juridique", 180000], ["Concertation, évaluation, communication", 80000]]]];
  const total = G.reduce((s, g) => s + g[1].reduce((a, l) => a + l[1], 0), 0);
  return { G: G, total: total, h2: M.COST.h2 * (1 + M.COST.moe + M.COST.alea) };
})();
/* ---------- présentation : un film en onze chapitres ---------- */
const scen = (m, se, xx, play, shot) => () => { closeComp(); markDock(null); selSeason(se); setMode(m); if (xx != null) { x = xx; tIn.value = x; } refresh(); setPlay(!!play && !reduce); if (scene) { if (shot) scene.shot(shot[0], shot[1], 3200, shot[2] || .25); else scene.home(); } };
const atel = (k, i, st) => () => { if (!studio) { scen("n", 2, 13)(); return; } onPick({ k: k, proc: true }); stopSteps(); if (st) Object.assign(DEF.st, st); goStep(i); studio.controls.autoRotate = !reduce; };
const R72 = pct(REF.res.p72);
const FILM = [
  ["Haute-Corse", "Smart Paese", "Le village qui tient, qui veille et qui anticipe. Il garde sa lumière, son eau et son téléphone quand le réseau tombe, surveille son versant contre le feu, et prépare la coupure avant qu'elle n'arrive.", [], scen("n", 2, 18.9, false, [[118, 46, 150], [0, 12, 0], .35])],
  ["Le problème", "17 heures, en janvier. La ligne tombe.", "Un village de montagne tient à une seule ligne à haute tension. Un arbre, la neige, un incendie : l'eau, le téléphone et le chauffage s'arrêtent avec elle, parfois pendant des jours.", [], scen("c", 0, 0, false, [[-150, 62, 30], [-60, 16, -40], .2])],
  ["La promesse", "Ici, le village tient.", "La mairie devient un refuge chauffé et éclairé. La pompe à eau et le relais de téléphonie continuent. Le village se sépare du réseau et vit sur ses propres ressources.", [["72 h", "sans réseau, c'est l'objectif"], [R72, "des coupures tenues sur une année simulée"]], scen("c", 0, 5, true, [[46, 30, 78], [-6, 9, 6], .3])],
  ["Le soleil", "Les toits publics produisent.", "École, mairie, ombrière : 120 kWc de panneaux. En temps normal, cette électricité sert d'abord les bâtiments communaux, puis les habitants qui la partagent.", [[pct(REF.sim.autoprod), "de la consommation du village"], [pct(REF.sim.autoconso), "de la production consommée sur place"]], atel("pv", -1)],
  ["L'eau", "Le torrent ne dort jamais.", "Une petite turbine sur le torrent tourne jour et nuit. L'hiver, quand le soleil manque plusieurs jours de suite, c'est elle qui tient le village.", [[pct(REF.res.season72[0]), "des coupures d'hiver tenues avec le torrent"], [pct(REF.noHyd.season72[0]), "sans lui"]], atel("hydro", -1)],
  ["La réserve", "Une batterie garde le village debout.", "Elle stocke le soleil de midi pour le soir et garde toujours une part en réserve. Quand la ligne tombe, c'est elle qui recrée le courant du village.", [["200 kWh", "de batterie communale"], ["40 %", "gardés pour la coupure"]], atel("batt", 4, { mode: 2, load: 7 })],
  ["L'intelligence", "Un pilotage qui anticipe.", "L'automate isole le village, coupe ce qui peut attendre et rallume l'essentiel. Il lit aussi la météo du lendemain : avant un passage couvert, il garde davantage de batterie en réserve.", [["7", "étapes, de la panne à la reconnexion"], ["6 kW", "de services vitaux protégés"]], atel("ilot", -1, { ph: 4 })],
  ["Demain", "L'hydrogène, pour tenir plus longtemps.", "Le surplus d'été peut devenir un stock de très longue durée. C'est une option, que la recherche tranchera sur des mesures réelles.", [["30 kg", "soit environ 80 heures de refuge"], ["2030", "décision après un an de mesures"]], atel("h2", -1)],
  ["La vigie", "Le village veille sur son versant.", "Une caméra sur un mât autonome et des capteurs dans le maquis repèrent un départ de feu. L'alerte part aux secours ; la batterie se charge et le village s'isole avant que la ligne ne soit coupée.", [["98 %", "de batterie au moment de l'îlotage préventif"], ["> 96 h", "de refuge tenu dans ce scénario d'été"]], () => { closeComp(); markDock(null); setMode("c", true); x = 2; tIn.value = x; refresh(); setPlay(!reduce); if (scene) scene.shot([-30, 76, 70], [-112, 22, -66], 3200, .15); }],
  ["Le chemin", "Trois villages d'ici 2031.", "Un premier village en service début 2029, puis deux autres. Ensuite, une méthode pour les 234 communes du syndicat. Le budget reste à réunir : aucun financement n'est acquis à ce jour.", [["2029", "premier village en service"], [fmt(BUD.total / 1e6, 1) + " M€", "sur cinq ans, à financer"]], scen("n", 2, 13, false, [[230, 150, 250], [20, 8, 20], .3])],
  ["L'invitation", "Un village pilote cherche ses partenaires.", "Communes, Università di Corsica, CNRS, services de secours, financeurs : le projet se construit maintenant. Première étape, une lettre d'intention commune en février 2027.", [], scen("n", 2, 19.9, false, [[70, 36, 96], [-4, 10, 4], .4])]
];
const DUR = 12000; let ch = 0, fPlay = !reduce, fT0 = 0, fRaf = 0, fK = 0;
FILM.forEach((q, i) => { const d = document.createElement("i"); d.innerHTML = "<b></b>"; d.title = q[0]; d.onclick = () => showCh(i); $("f-dots").appendChild(d); });
function showCh(i) { ch = (i + FILM.length) % FILM.length; const q = FILM[ch], f = $("film");
  $("f-k").textContent = String(ch + 1).padStart(2, "0") + " / " + FILM.length + " · " + q[0]; $("f-t").textContent = q[1]; $("f-p").textContent = q[2];
  $("f-f").innerHTML = q[3].map(v => `<div><b>${v[0]}</b><span>${v[1]}</span></div>`).join(""); $("f-cta").style.display = ch === FILM.length - 1 ? "block" : "none";
  [...$("f-dots").children].forEach((d, j) => { d.firstChild.style.width = j < ch ? "100%" : "0"; });
  f.classList.remove("in"); void f.offsetWidth; f.classList.add("in"); q[4](); fK = 0; }
function filmTick(now) { if (!presOn) return; fRaf = requestAnimationFrame(filmTick); const dtf = Math.min(120, now - (fT0 || now)); fT0 = now; if (!fPlay) return; fK = Math.min(1, fK + dtf / DUR); const d = $("f-dots").children[ch]; if (d) d.firstChild.style.width = (fK * 100) + "%"; if (fK >= 1) { if (ch === FILM.length - 1) setFPlay(false); else showCh(ch + 1); } }
function setFPlay(on) { fPlay = on; $("f-play").textContent = on ? "❚❚" : "▶"; $("f-play").setAttribute("aria-label", on ? "Mettre en pause" : "Reprendre la lecture"); }
$("f-prev").onclick = () => showCh(ch - 1); $("f-next").onclick = () => showCh(ch + 1); $("f-play").onclick = () => { if (!fPlay && ch === FILM.length - 1 && fK >= 1) showCh(0); setFPlay(!fPlay); };
$("f-fs").onclick = () => { try { const d = document; if (d.fullscreenElement) d.exitFullscreen(); else d.documentElement.requestFullscreen().catch(() => {}); } catch (e) {} };
function startPres() { stopTour(); presOn = true; $("v-jumeau").classList.add("film"); $("cmd").hidden = true; $("comp").hidden = true; if (scene) { scene.filmOn = true; scene.resize(); } showCh(ch); cancelAnimationFrame(fRaf); fRaf = requestAnimationFrame(filmTick); }
function stopPres() { if (!presOn) return; presOn = false; cancelAnimationFrame(fRaf); $("v-jumeau").classList.remove("film"); if (studio) studio.controls.autoRotate = false; closeComp(); $("cmd").hidden = false; setPlay(false); if (scene) { scene.filmOn = false; scene.resize(); scene.home(); } }
addEventListener("keydown", e => { if (!presOn) return; if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); showCh(ch + 1); } if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); showCh(ch - 1); } if (e.key === " ") { e.preventDefault(); $("f-play").click(); } });

/* ---------- navigation ---------- */
function route() { const pv = location.hash.replace("#", "") !== "village";
  $("v-jumeau").classList.add("on");
  document.querySelectorAll("#top nav a").forEach(a => { if (a.getAttribute("href") === (pv ? "#presentation" : "#village")) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  $("main").scrollTop = 0; if (scene) scene.start();
  if (pv) startPres(); else { stopPres(); requestAnimationFrame(() => { if (scene) scene.resize(); drawDay(); }); } }
addEventListener("hashchange", route);
addEventListener("resize", () => { if (scene) scene.resize(); drawDay(); });

syncInputs(); recompute(); route();
})();
