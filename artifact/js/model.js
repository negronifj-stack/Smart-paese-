/* Smart Paese — modèle énergétique horaire d'un village (8 760 h).
   Fonctions pures : aucune dépendance au navigateur, vérifiable sous Node. */
(function (root) {
  "use strict";
  var H = 8760, LAT = 42.3 * Math.PI / 180;

  /* Configuration de référence : village de montagne d'environ 250 habitants. */
  var DEFAULTS = {
    pv: 120,        // kWc, toits publics et ombrière
    bat: 200,       // kWh utiles
    pbat: 100,      // kW, convertisseur
    hyd: 5,         // kW, pico-centrale sur torrent ou adduction
    abo: 140,       // points de livraison
    kwhAbo: 4500,   // kWh par abonné et par an
    pub: 60000,     // kWh par an, bâtiments publics et éclairage
    crit: 6,        // kW, charge critique en îlot (refuge, télécoms, eau, éclairage minimal)
    reserve: 0.40,  // part de batterie gardée pour la coupure
    h2: false, elz: 20, h2kg: 30, fc: 10, pred: false,
    yieldPV: 1300   // kWh/kWc/an
  };
  var K = { etaC: 0.95, etaD: 0.95, socMin: 0.10, socMax: 0.98, kwhKg: 52, pci: 33.3, etaFC: 0.50 };

  /* Coûts unitaires hors taxes (hypothèses, à consolider par consultation). */
  var COST = {
    pv: 1500,        // €/kWc
    bat: 600,        // €/kWh
    pcs: 250,        // €/kW, convertisseur capable de former le réseau
    hyd: 8000,       // €/kW
    hydFix: 30000,   // études et dossier loi sur l'eau
    ilot: 160000,    // organe de coupure télécommandé, protections, contrôle-commande
    refuge: 45000,   // tableau secouru, deux points de recharge, wifi de crise
    instr: 90000,    // capteurs, comptage, radio, station météo, plateforme de données
    h2: 550000,      // électrolyseur, stockage, pile, sécurité
    moe: 0.12, alea: 0.08,
    om: 0.015,       // exploitation annuelle, part de l'investissement
    vAuto: 0.18,     // €/kWh évité
    vSurplus: 0.05   // €/kWh injecté
  };

  function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* Profils normalisés, calculés une fois. */
  var SHAPE = (function () {
    var sun = new Float64Array(H), load = new Float64Array(H), hyd = new Float64Array(H), sky = new Float64Array(365);
    var r = rng(20261110), k = 0.8, d, h, i;
    for (d = 0; d < 365; d++) {
      var winter = 0.5 + 0.5 * Math.cos(2 * Math.PI * (d - 15) / 365);   // 1 en janvier, 0 en juillet
      var target = r() < (0.18 + 0.34 * winter) ? 0.18 + 0.3 * r() : 0.78 + 0.22 * r();
      k = 0.45 * k + 0.55 * target;                                        // persistance : les passages couverts durent
      sky[d] = k;
    }
    var sSun = 0, sLoad = 0;
    for (d = 0; d < 365; d++) {
      var decl = 23.45 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + d + 1) / 365);
      var season = 1 + 0.45 * Math.cos(2 * Math.PI * (d - 15) / 365) + 0.25 * Math.exp(-Math.pow((d - 225) / 18, 2));
      var hf = Math.min(1, Math.max(0.2, 0.6 + 0.4 * Math.cos(2 * Math.PI * (d - 45) / 365)));
      for (h = 0; h < 24; h++) {
        i = d * 24 + h;
        var w = (h + 0.5 - 12) * 15 * Math.PI / 180;
        var se = Math.sin(LAT) * Math.sin(decl) + Math.cos(LAT) * Math.cos(decl) * Math.cos(w);
        sun[i] = Math.pow(Math.max(0, se), 1.2) * sky[d]; sSun += sun[i];
        var daily = 0.55 + 0.5 * Math.exp(-Math.pow((h - 8) / 1.5, 2)) + 0.95 * Math.exp(-Math.pow((h - 19.5) / 2.2, 2)) + (h > 9 && h < 17 ? 0.15 : 0);
        load[i] = season * daily; sLoad += load[i];
        hyd[i] = hf;
      }
    }
    for (i = 0; i < H; i++) { sun[i] /= sSun; load[i] /= sLoad; }
    return { sun: sun, load: load, hyd: hyd, sky: sky };
  })();

  function simulate(p) {
    var pv = new Float32Array(H), hy = new Float32Array(H), ld = new Float32Array(H), soc = new Float32Array(H), h2 = new Float32Array(H),
        imp = new Float32Array(H), exp = new Float32Array(H), bat = new Float32Array(H), elz = new Float32Array(H);
    var Epv = p.pv * p.yieldPV, Eload = p.abo * p.kwhAbo + p.pub, i;
    var s = p.bat > 0 ? 0.6 : 0, kg = p.h2 ? p.h2kg * 0.5 : 0, pass, T = {};
    /* Deux passes : la première ne sert qu'à trouver l'état de départ du 1er janvier. */
    for (pass = 0; pass < 2; pass++) {
      T = { pv: 0, hyd: 0, load: 0, imp: 0, exp: 0, dis: 0, h2in: 0 };
      for (i = 0; i < H; i++) {
        var a = SHAPE.sun[i] * Epv, b = SHAPE.hyd[i] * p.hyd, c = SHAPE.load[i] * Eload, net = a + b - c, x = 0, e = 0, g = 0, y = 0;
        if (net > 0) {
          if (p.bat > 0) { x = Math.min(net, p.pbat, (K.socMax - s) * p.bat / K.etaC); x = Math.max(0, x); s += x * K.etaC / p.bat; }
          var rest = net - x;
          if (p.h2 && rest > 0) { e = Math.min(rest, p.elz, (p.h2kg - kg) * K.kwhKg); e = Math.max(0, e); kg += e / K.kwhKg; rest -= e; }
          y = rest;
        } else if (net < 0) {
          var rsv = p.pred ? (SHAPE.sky[(Math.floor(i / 24) + 1) % 365] < .55 ? .9 : .4) : p.reserve;
          if (p.bat > 0) { x = -Math.min(-net, p.pbat, Math.max(0, s - Math.max(K.socMin, rsv)) * p.bat * K.etaD); s += x / K.etaD / p.bat; }
          g = -net + x;
        }
        pv[i] = a; hy[i] = b; ld[i] = c; soc[i] = s; h2[i] = kg; imp[i] = g; exp[i] = y; bat[i] = x; elz[i] = e;
        T.pv += a; T.hyd += b; T.load += c; T.imp += g; T.exp += y; T.h2in += e; if (x < 0) T.dis -= x;
      }
    }
    var prod = T.pv + T.hyd;
    return { p: p, pv: pv, hyd: hy, load: ld, soc: soc, h2: h2, imp: imp, exp: exp, bat: bat, elz: elz, tot: T,
      autoprod: 1 - T.imp / T.load, autoconso: prod > 0 ? 1 - T.exp / prod : 0, cycles: p.bat > 0 ? T.dis / p.bat : 0 };
  }

  /* Îlotage à partir de l'heure i0 : seule la charge critique est servie. Renvoie la trajectoire sur nH heures. */
  function island(sim, i0, nH, soc0) {
    var p = sim.p, s = soc0 != null && p.bat > 0 ? soc0 : sim.soc[i0], kg = sim.h2[i0], out = { soc: [], h2: [], pv: [], hyd: [], load: [], bat: [], fc: [], ok: [], hours: nH }, alive = true, n;
    for (n = 0; n < nH; n++) {
      var i = (i0 + n) % H, hr = i % 24, c = p.crit * (hr < 7 || hr >= 19 ? 1.15 : 0.95), a = sim.pv[i], b = sim.hyd[i], net = a + b - c, x = 0, f = 0, e = 0;
      if (net >= 0) {
        if (p.bat > 0) { x = Math.max(0, Math.min(net, p.pbat, (K.socMax - s) * p.bat / K.etaC)); s += x * K.etaC / p.bat; }
        if (p.h2) { e = Math.max(0, Math.min(net - x, p.elz, (p.h2kg - kg) * K.kwhKg)); kg += e / K.kwhKg; }
      } else {
        if (p.bat > 0) { x = -Math.min(-net, p.pbat, Math.max(0, s - K.socMin) * p.bat * K.etaD); s += x / K.etaD / p.bat; }
        var miss = -net + x;
        if (miss > 1e-6 && p.h2) { f = Math.min(miss, p.fc, kg * K.pci * K.etaFC); kg -= f / (K.pci * K.etaFC); miss -= f; }
        if (miss > 0.05 && alive) { alive = false; out.hours = n; }
      }
      out.soc.push(s); out.h2.push(kg); out.pv.push(a); out.hyd.push(b); out.load.push(c); out.bat.push(x); out.fc.push(f); out.ok.push(alive);
    }
    return out;
  }

  /* Tenue de la charge critique : une coupure démarre toutes les 3 heures de l'année. */
  function resilience(sim, maxH) {
    maxH = maxH || 96;
    var T = [], bySeason = [[], [], [], []], i;
    for (i = 0; i < H; i += 3) { var t = island(sim, i, maxH).hours; T.push(t); var m = Math.floor(i / 24 / 30.42); bySeason[m < 2 || m >= 11 ? 0 : m < 5 ? 1 : m < 8 ? 2 : 3].push(t); }
    var curve = [], d; for (d = 0; d <= maxH; d += 6) curve.push({ h: d, p: share(T, d) });
    var sorted = T.slice().sort(function (a, b) { return a - b; });
    return { curve: curve, p24: share(T, 24), p72: share(T, 72), p5: sorted[Math.floor(sorted.length * 0.05)], min: sorted[0],
      season72: bySeason.map(function (a) { return share(a, 72); }), maxH: maxH };
    function share(a, d) { var k = 0, j; for (j = 0; j < a.length; j++) if (a[j] >= d) k++; return k / a.length; }
  }

  function capex(p, opt) {
    opt = opt || {};
    var L = [
      ["Solaire, toits publics et ombrière", p.pv * COST.pv],
      ["Batterie et convertisseur", p.bat * COST.bat + (p.bat > 0 ? p.pbat * COST.pcs : 0)],
      ["Pico-centrale hydraulique", p.hyd > 0 ? p.hyd * COST.hyd + COST.hydFix : 0],
      ["Îlotage : coupure, protections, contrôle-commande", COST.ilot],
      ["Bâtiment refuge", COST.refuge],
      ["Instrumentation de recherche", opt.noInstr ? 0 : COST.instr],
      ["Hydrogène, stockage de longue durée", p.h2 ? COST.h2 : 0]
    ];
    var base = L.reduce(function (s, l) { return s + l[1]; }, 0);
    L.push(["Maîtrise d'œuvre et études (12 %)", base * COST.moe], ["Aléas (8 %)", base * COST.alea]);
    return { lines: L, total: base * (1 + COST.moe + COST.alea) };
  }

  function economics(sim, cap, subsidy) {
    var T = sim.tot, auto = T.pv + T.hyd - T.exp - T.h2in;
    var gain = auto * COST.vAuto + T.exp * COST.vSurplus, om = cap.total * COST.om, net = gain - om;
    return { gain: gain, om: om, net: net, payback: net > 0 ? cap.total / net : Infinity, paybackSub: net > 0 ? cap.total * (1 - subsidy) / net : Infinity };
  }

  function monthly(sim) {
    var M = [], m, i; for (m = 0; m < 12; m++) M.push({ pv: 0, hyd: 0, load: 0, imp: 0 });
    for (i = 0; i < H; i++) { m = Math.min(11, Math.floor(i / 24 / 30.42)); M[m].pv += sim.pv[i]; M[m].hyd += sim.hyd[i]; M[m].load += sim.load[i]; M[m].imp += sim.imp[i]; }
    return M;
  }

  root.Model = { DEFAULTS: DEFAULTS, K: K, COST: COST, simulate: simulate, island: island, resilience: resilience, capex: capex, economics: economics, monthly: monthly, sky: SHAPE.sky, H: H };
})(typeof window !== "undefined" ? window : globalThis);
