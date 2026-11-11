// Outil de repérage : altitude du terrain de l'artéfact le long d'une orbite de caméra.
// node scripts/ground.mjs cx cz r0 r1 az0 az1   → hauteur du sol sous la caméra, pour éviter de la faire passer sous le relief
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const src = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../artifact/js/scene.js"), "utf8").split("\n");
const code = src.filter(l => /^function (rnd|noise|fbm|height)\(/.test(l)).join("\n");
const height = new Function(code + "; return height;")();
const [cx, cz, r0, r1, a0, a1] = process.argv.slice(2).map(Number);
const out = []; for (let i = 0; i <= 8; i++) { const u = i / 8, r = r0 + (r1 - r0) * u, a = (a0 + (a1 - a0) * u) * Math.PI / 180, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; out.push(`${Math.round(height(x, z))}`); }
console.log(process.argv.slice(2).join(" "), "→ sol :", out.join(" "));
