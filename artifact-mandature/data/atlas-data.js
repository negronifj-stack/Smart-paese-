/* =====================================================================
   ATLAS DES PROJETS ÉNERGÉTIQUES DU SDE2B — DONNÉES
   Ce fichier est le seul à modifier pour mettre à jour les sites, les
   statuts, les fiches et les hypothèses. Le moteur 3D (index.html) le lit
   au chargement. Voir NOTICE.md.

   Conventions
   - Coordonnées : longitude et latitude en degrés décimaux (WGS 84).
   - statut : "documente" | "a_confirmer" | "simule"
   - fictif : true pour tout site, partenaire ou exemple inventé pour la démonstration.
   - sources : identifiants de la liste SOURCES ci-dessous.
   - Un champ chiffré inconnu se laisse à null : l'interface affiche « à renseigner ».
   ===================================================================== */
window.ATLAS_DATA = {

meta: {
  titre: "Projet de mandature 2026-2032",
  organisme: "Syndicat Départemental d'Énergie de Haute-Corse",
  service: "Direction générale des services",
  version: "Version de présentation",
  date: "2026-11-03",
  avertissement: "Exemples de projets proposés par la direction générale. Les sites, implantations et chiffres sont des illustrations, à préciser avec les communes et les partenaires."
},

/* ---------------------------------------------------------------- SOURCES */
sources: {
  communes:   { titre: "Contours des communes de Haute-Corse, france-geojson (dérivé d'IGN Admin Express)", url: "https://github.com/gregoiredavid/france-geojson", date: "consulté le 2026-11-03", statut: "documente" },
  naturalearth:{ titre: "Terres émergées Natural Earth 1:50m (domaine public), via world-atlas", url: "https://github.com/topojson/world-atlas", date: "consulté le 2026-11-03", statut: "documente" },
  cre164:     { titre: "CRE, délibération n° 2026-164 du 23 juillet 2026, appel d'offres photovoltaïque ZNI, période 5", url: "https://www.cre.fr/fileadmin/Documents/Deliberations/2026/260723_2026-164_CdC_AO_PV_ZNI_P5.pdf", date: "2026-07-23", statut: "documente" },
  cre237:     { titre: "CRE, délibération n° 2024-237, cadres de compensation MDE 2025-2028", url: "https://cre.fr/fileadmin/Documents/Deliberations/2024/241219_2024-237_Nouveaux_cadres_compensation_MDE.pdf", date: "2024-12-19", statut: "documente" },
  face2026:   { titre: "Localtis, montants des aides à l'électrification rurale (FACÉ) 2026", url: "https://www.banquedesterritoires.fr/aides-lelectrification-rurale-les-montants-daides-pour-2026-sont-fixes", date: "2026-03-26", statut: "documente" },
  te:         { titre: "Localtis, les territoires d'électrification dévoilés", url: "https://www.banquedesterritoires.fr/les-territoires-delectrification-enfin-devoiles", date: "2026-09-11", statut: "documente" },
  advenir:    { titre: "Projet d'arrêté de prolongation du programme ADVENIR jusqu'en 2030", url: "https://www.consultations-publiques.developpement-durable.gouv.fr/IMG/pdf/arrete_prolongation_programme_cee_advenir_2030_vsd5_clean.pdf", date: "2026", statut: "a_confirmer" },
  te83:       { titre: "Banatic, fiche du syndicat Territoire d'énergie Var – Symielec", url: "https://www.banatic.interieur.gouv.fr/intercommunalite/258302744-territoire-d-energie-var---symielec", date: "mise à jour du 2025-07-17", statut: "documente" },
  maritime_zone:{ titre: "keep.eu, programme Interreg VI-A Italie-France Maritime 2021-2027 : zone éligible", url: "https://keep.eu/programmes/355", date: "consulté le 2026-11-03", statut: "documente" },
  maritime_ctc: { titre: "Collectivité de Corse, rapport 2025/363 CP sur le programme Interreg Italie-France Maritime", url: "https://www.isula.corsica/assemblea/docs/RapportCP/2025363CP.pdf", date: "2025", statut: "documente" },
  maritime_appel:{ titre: "Appel à projets Interreg Maritime 2021-2027 : secteurs ciblés dont les énergies renouvelables", url: "https://nosalpes.eu/?p=3978", date: "consulté le 2026-11-03", statut: "documente" },
  sardaigne:  { titre: "Région Sardaigne, soutien aux communautés d'énergie des communes", url: "https://www.meteoweb.eu/2024/10/fonti-rinnovabili-sardegna-comunita-energetiche/1001652810/", date: "2024-10", statut: "documente" },
  greenhysland:{titre: "Clean Hydrogen Partnership, Green Hysland (Majorque)", url: "https://www.clean-hydrogen.europa.eu/system/files/2023-12/12_Hydrogen%20Valleys_Encinas_Green%20Hysland.pdf", date: "2023-12", statut: "documente" },
  invece:     { titre: "Projet INVECE (Interreg Maritime), communautés énergétiques", url: "https://lepetitjournal.com/milan/actualites/france-italie-nouvelles-energies-transfrontalieres-cooperation-innovation-433805", date: "2026-02-02", statut: "documente" },
  myrte:      { titre: "Plateforme MYRTE, Università di Corsica (Vignola)", url: "https://www.corsenetinfos.corsica/Vignola-Delphine-Batho-visite-la-plateforme-MYRTE_a3516.html", date: "2012", statut: "documente" },
  sidelec:    { titre: "SIDELEC Réunion, présentation du projet de station hydrogène", url: "https://frh2.cnrs.fr/wp-content/uploads/2023/07/P4-SIDELEC.pdf", date: "2023-05-25", statut: "documente" },
  cozzano:    { titre: "AUE, Troph'énergies : Cozzano, autoconsommation collective", url: "https://www.corsenetinfos.corsica/Troph-energies-de-l-AUE-de-Corse-les-laureats-recompenses-a-Ajaccio_a74279.html", date: "consulté le 2026-11-03", statut: "documente" },
  bdt_sem:    { titre: "Banque des Territoires, livre blanc des SEM EnR", url: "https://www.banquedesterritoires.fr/sites/default/files/2022-10/Livre_Blanc_Accompagnement_ENR_Sep2022.pdf", date: "2022-09", statut: "documente" },
  avergies:   { titre: "Caisse des dépôts, dossier de presse Avergies (TE 47)", url: "https://www.caissedesdepots.fr/sites/cdc.fr/files/2025-09/Dossier%20de%20presse%20CDC%20Avergies_accessible.pdf", date: "2025-09", statut: "documente" },
  sde35:      { titre: "SDE 35, rapport d'activité", url: "https://www.redon.fr/fichiers/p4/f8914-2024-106-rapport-sde-35-exercice.pdf", date: "2024", statut: "documente" },
  sde65:      { titre: "SDE 65, rapport d'activité 2025", url: "https://www.sde-65.com/wp-content/uploads/2026/04/SDE65-RA2025.pdf", date: "2026-04", statut: "documente" },
  dg_ep:      { titre: "Direction générale du SDE2B, estimation du parc d'éclairage public : au moins 30 000 points lumineux", url: null, date: "2026-11", statut: "documente" },
  tactis:     { titre: "Tactis, stratégie de déploiement, montage contractuel et plan d'affaires du service public de recharge, phase 2 (version de travail)", url: null, date: "2026-10-16", statut: "documente" },
  euromed_eeas:{ titre: "SEAE, « Interreg Euro-MED and 69 Mediterranean regions across 14 countries » (budget de 295 M€)", url: "https://eeas.europa.eu/delegations/montenegro/interreg-euro-med-and-69-mediterranean-regions-across-14-countries-improving-lives-and-creating_en", date: "consulté le 2026-11-03", statut: "documente" },
  euromed_appel:{ titre: "FASI, appel Euro-MED04 : partenariats d'au moins cinq pays de l'espace de coopération", url: "https://fasi.eu/en/grants/2e449948-6e54-49b5-b651-44424c347e4b", date: "consulté le 2026-11-03", statut: "documente" },
  tilos:      { titre: "Climate Action, « A tiny Greek island to become the first energy independent island in the Mediterranean » (projet TILOS, 11 M€ Horizon 2020)", url: "https://www.climateaction.org/news/a-tiny-greek-island-to-become-the-first-energy-independent-island-in-the-me", date: "2017-08-02", statut: "documente" },
  cei_malte:  { titre: "Bioenergy International, lancement de « Clean Energy for EU Islands » à La Valette par la Commission et 14 États membres", url: "https://bioenergyinternational.com/?p=6795", date: "2017-05", statut: "documente" },
  cei_crete:  { titre: "IENE, premier forum Clean Energy for EU Islands à Chania (Crète)", url: "https://www.iene.eu/in-crete-eu-strives-for-clean-energy-transition-on-islands-p3692.html", date: "2017-09-26", statut: "documente" },
  cei_26:     { titre: "Secrétariat Clean energy for EU islands, « 26 islands launch clean energy transition » (Hvar, Brač, Pantelleria, Crète…)", url: "https://clean-energy-islands.ec.europa.eu/news/26-islands-launch-clean-energy-transition-eu-islands-secretariat-support", date: "2019-02-15", statut: "documente" },
  eu30:       { titre: "Commission européenne, participants de l'initiative « 30 îles renouvelables pour 2030 »", url: "https://energy.ec.europa.eu/news/commission-confirms-participants-30-renewable-islands-2030-initiative-2023-11-30_en", date: "2023-11-30", statut: "documente" },
  follower:   { titre: "Secrétariat Clean energy for EU islands, « follower islands »", url: "https://clean-energy-islands.ec.europa.eu/news/exciting-news-eu-islands-secretariat-follower-islands-announced", date: "consulté le 2026-11-03", statut: "documente" },
  sieep_ep:   { titre: "SIEEP, périmètre de la compétence éclairage public (111 communes, environ 11 000 points lumineux), octobre 2026", url: null, date: "2026-10", statut: "documente" },
  aue_ep:     { titre: "AUE, aide à la rénovation de l'éclairage public", url: "https://aue.corsica/aide-accompagnement/renovation-de-leclairage-public/", date: "mise à jour du 2026-10-06", statut: "documente" },
  te_bdt:     { titre: "Banque des Territoires, « Les territoires d'électrification enfin dévoilés » (109 lauréats, dont la Corse entière)", url: "https://www.banquedesterritoires.fr/les-territoires-delectrification-enfin-devoiles", date: "2026-09-11", statut: "documente" },
  hypotheses: { titre: "Hypothèses de dimensionnement de la direction générale, à valider par les services", url: null, date: "2026-11-03", statut: "simule" }
},

/* ---------------------------------------------------------------- POLITIQUES (onglets) */
politiques: {
  ensemble: { titre: "Vue d'ensemble", accent: "#F9B23D", texte: "#151615" , onglet: "Ensemble" },
  villages: { titre: "Smart Paese · villages résilients", accent: "#4FA82E", texte: "#151615" , onglet: "Smart Paese" },
  ep:       { titre: "Éclairage public · 100 % LED", accent: "#2A86C8", texte: "#151615", onglet: "Éclairage" },
  irve:     { titre: "Mobilité électrique · IRVE", accent: "#F08363", texte: "#151615" , onglet: "Mobilité" },
  coop:     { titre: "Coopération internationale", accent: "#F9B23D", texte: "#151615" , onglet: "Coopération" },
  sem:      { titre: "SEM · projets structurants", accent: "#E9426C", texte: "#151615" , onglet: "SEM EnR" }
},

/* ---------------------------------------------------------------- RELIEF DE DÉMONSTRATION
   Sommets (longitude, latitude, altitude en m) utilisés pour modeler un relief lisible.
   À remplacer par un modèle numérique de terrain (par exemple IGN RGE ALTI ou BD ALTI)
   lorsque les données et les droits d'usage seront disponibles. */
relief: {
  exageration: 2.2,
  sommets: [
    [8.946, 42.380, 2706, 0.11], [8.885, 42.345, 2525, 0.09], [9.052, 42.217, 2622, 0.10], [9.112, 42.130, 2389, 0.09],
    [8.980, 42.470, 2390, 0.08], [8.830, 42.480, 1938, 0.07], [9.330, 42.420, 1767, 0.07], [9.170, 42.580, 1535, 0.07],
    [9.410, 42.790, 1307, 0.06], [9.250, 42.050, 1500, 0.08], [9.150, 42.300, 1300, 0.09], [9.060, 42.290, 2000, 0.10]
  ]
},

/* ---------------------------------------------------------------- 1. VILLAGES RÉSILIENTS */
villages: {
  sites: [
    { id: "vA", nom: "Smart Paese", secteur: "Village pilote de Castagniccia", lon: 9.385, lat: 42.405, statut: "simule", fictif: true, sources: ["hypotheses"], date: "2026-11-03", annee: 2027,
      resume: "Le village démonstrateur du SDE2B : il produit, stocke, partage et pilote son énergie, et garde sa mairie ouverte comme refuge quand le réseau tombe. Un modèle à reproduire dans les villages de bout de ligne.",
      atouts: ["Toitures solaires et batterie communale", "Torrent et chaufferie bois", "Hydrogène vert pour la longue durée", "Pilotage et suivi des consommations"] }
  ],
  /* Trois épreuves jouées sur le même village */
  scenarios: [
    { id: "tempete", titre: "Tempête d'hiver", recit: "Une tempête couche la ligne HTA un soir de janvier. Le village bascule en îlot à 18 h et tient trois jours : torrent, batterie puis hydrogène gardent la mairie refuge ouverte.", debut: 18, duree: 72, hyp: { pv_saison: .45, charge_facteur: 1.2 } },
    { id: "canicule", titre: "Canicule d'août", recit: "Un 14 août, un incident coupe le réseau à 14 h, pour six heures, alors que le village a triplé avec les visiteurs. Le solaire et la batterie tiennent : la mairie rafraîchie accueille les personnes fragiles.", debut: 14, duree: 6, hyp: { pv_saison: 1.1, charge_facteur: 2.2 } },
    { id: "feu", titre: "Feu de forêt", recit: "Un feu de maquis impose de couper la ligne à 13 h pour une journée. Les télécommunications et la mairie refuge restent alimentées pour coordonner les secours.", debut: 13, duree: 24, hyp: { pv_saison: 1, charge_facteur: 1 } }
  ],
  /* Hypothèses de calcul de la maquette (toutes simulées) */
  hypotheses: {
    pv_kwc: 120, hydro_kw: 4, batterie_kwh: 200, soc_initial: 0.55, reserve_refuge: 0.35, plancher_ilot: 0.05,
    h2_initial_kg: 12, electrolyseur_kw: 30, kwh_par_kg_electrolyse: 52, pci_kwh_kg: 33.3, rendement_pac: 0.5, pac_max_kw: 10,
    charge_max_kw: 60, decharge_max_kw: 40
  },
  /* Usages dans l'ordre de priorité de service en îlot */
  usages: [
    { id: "refuge",   nom: "Mairie refuge",            kw: 8,   priorite: 1 },
    { id: "telecom",  nom: "Télécommunications",       kw: 0.4, priorite: 1 },
    { id: "eclairage",nom: "Éclairage minimal (nuit)", kw: 1,   priorite: 2, nuit: true },
    { id: "borne",    nom: "Borne de recharge",        kw: 7,   priorite: 3 },
    { id: "logements",nom: "Logements",                kw: null, priorite: 4, profil: true }
  ],
  financeurs: ["FACÉ, volet résilience aux aléas climatiques (30 M€ au national en 2026)", "FACÉ, programme spécial ZNI et sites isolés", "FEDER Corse", "LIFE (communautés d'énergie)", "Interreg Italie-France Maritime"]
},

/* ---------------------------------------------------------------- ÉCLAIRAGE PUBLIC · 100 % LED EN 2030
   Tranches de travaux par secteur (pôles du bloc irve.poles). Ratios de calcul modifiables. */
ep: {
  objectif: "100 % de l'éclairage public en LED piloté en 2030",
  parc_pl: 30000, parc_adherent_pl: 11000, communes_adherentes: 111,
  ratios: { puissance_avant_w: 110, puissance_apres_w: 40, heures_an: 4100, prix_kwh: 0.20 },
  abaissement: "Abaissement de 50 % entre 23 h et 5 h, extinction possible au cœur de la nuit selon le choix de chaque commune",
  /* part du parc passée en LED chaque fin d'année : les chantiers avancent partout en même temps.
     2026 : quelques communes sont déjà passées au LED (part estimée, à confirmer par l'inventaire des services) */
  trajectoire: { 2026: 0.08, 2027: 0.22, 2028: 0.48, 2029: 0.76, 2030: 1 },
  tranches: [
    { annee: 2027, nom: "Cap Corse et Nebbiu", poles: ["cap", "nebbiu"] },
    { annee: 2028, nom: "Balagne", poles: ["ilerousse", "calvi"] },
    { annee: 2029, nom: "Casinca, Castagniccia et Costa Verde", poles: ["casinca", "moriani"] },
    { annee: 2030, nom: "Centre Corse et plaine orientale", poles: ["ponte", "venaco", "aleria", "ghiso"] }
  ],
  financeurs: ["AUE, aide à la rénovation de l'éclairage public", "Certificats d'économies d'énergie", "FEDER Corse", "Contribution des communes par point lumineux"],
  sources: ["dg_ep", "sieep_ep", "aue_ep"]
},

/* ---------------------------------------------------------------- 2. MOBILITÉ ÉLECTRIQUE */
irve: {
  /* Pôles des bassins de démonstration */
  poles: [
    { id: "bastia", nom: "Bastia", lon: 9.450, lat: 42.700, hors: true }, { id: "cap", nom: "Cap Corse", lon: 9.450, lat: 42.960 },
    { id: "nebbiu", nom: "Nebbiu", lon: 9.300, lat: 42.680 }, { id: "ilerousse", nom: "L'Île-Rousse", lon: 8.940, lat: 42.633 },
    { id: "calvi", nom: "Calvi", lon: 8.760, lat: 42.568 }, { id: "ponte", nom: "Ponte-Leccia", lon: 9.210, lat: 42.460 },
    { id: "corte", nom: "Corte", lon: 9.150, lat: 42.306, hors: true }, { id: "casinca", nom: "Casinca", lon: 9.470, lat: 42.500 },
    { id: "moriani", nom: "Costa Verde", lon: 9.530, lat: 42.370 }, { id: "aleria", nom: "Aléria", lon: 9.510, lat: 42.105 },
    { id: "ghiso", nom: "Fium'Orbu", lon: 9.405, lat: 42.017 }, { id: "venaco", nom: "Venacais", lon: 9.170, lat: 42.230 }
  ],
  axes: [
    { id: "a1", nom: "Bastia – plaine orientale", pts: [[9.450,42.700],[9.420,42.650],[9.440,42.520],[9.500,42.470],[9.530,42.370],[9.540,42.290],[9.520,42.180],[9.510,42.105],[9.405,42.017],[9.330,41.900]] },
    { id: "a2", nom: "Casamozza – Ponte-Leccia – Corte", pts: [[9.440,42.520],[9.370,42.500],[9.290,42.480],[9.210,42.460],[9.190,42.390],[9.150,42.306],[9.170,42.230],[9.170,42.165]] },
    { id: "a3", nom: "Ponte-Leccia – Balagne – Calvi", pts: [[9.210,42.460],[9.180,42.540],[9.090,42.580],[9.020,42.590],[8.940,42.633],[8.830,42.580],[8.760,42.568]] },
    { id: "a4", nom: "Bastia – Saint-Florent – Agriates", pts: [[9.450,42.700],[9.390,42.710],[9.360,42.700],[9.300,42.680],[9.150,42.660],[9.050,42.660],[8.940,42.633]] },
    { id: "a5", nom: "Tour du Cap Corse", pts: [[9.450,42.700],[9.470,42.770],[9.460,42.880],[9.450,42.960],[9.350,42.960],[9.340,42.890],[9.350,42.790],[9.300,42.680]] }
  ],
  /* Stations de démonstration (toutes simulées). usage : "bourg" | "passage" | "destination".
     etat : "etude" (site à l'étude) | "proposition" (proposée par un scénario).
     scenarios : ["A"] bourgs-centres, ["B"] axes et destinations, ou les deux. kw : null si inconnue. */
  stations: [
    { id: "s01", annee: 2028, nom: "Place du village, Cap Corse", lon: 9.452, lat: 42.950, usage: "bourg", kw: 22, etat: "etude", scenarios: ["A","B"] },
    { id: "s02", annee: 2029, nom: "Port de plaisance, Cap Corse", lon: 9.455, lat: 42.962, usage: "destination", kw: 22, etat: "proposition", scenarios: ["B"] },
    { id: "s03", annee: 2030, nom: "Bourg-centre, Nebbiu", lon: 9.305, lat: 42.682, usage: "bourg", kw: 22, etat: "etude", scenarios: ["A","B"] },
    { id: "s04", annee: 2027, nom: "Plage, golfe du Nebbiu", lon: 9.285, lat: 42.690, usage: "destination", kw: 22, etat: "proposition", scenarios: ["B"] },
    { id: "s05", annee: 2028, nom: "Aire de passage, Agriates", lon: 9.100, lat: 42.660, usage: "passage", kw: 150, etat: "proposition", scenarios: ["B"] },
    { id: "s06", annee: 2029, nom: "Bourg-centre, L'Île-Rousse", lon: 8.945, lat: 42.630, usage: "bourg", kw: 50, etat: "etude", scenarios: ["A","B"] },
    { id: "s07", annee: 2030, nom: "Village perché, Balagne", lon: 8.990, lat: 42.575, usage: "bourg", kw: 22, etat: "proposition", scenarios: ["A"] },
    { id: "s08", annee: 2027, nom: "Site de visite, Balagne", lon: 8.880, lat: 42.590, usage: "destination", kw: 22, etat: "proposition", scenarios: ["B"] },
    { id: "s09", annee: 2028, nom: "Entrée de Calvi", lon: 8.770, lat: 42.565, usage: "passage", kw: 150, etat: "etude", scenarios: ["A","B"] },
    { id: "s10", annee: 2029, nom: "Carrefour de Ponte-Leccia", lon: 9.212, lat: 42.462, usage: "passage", kw: 150, etat: "etude", scenarios: ["A","B"] },
    { id: "s11", annee: 2030, nom: "Bourg-centre, Casinca", lon: 9.470, lat: 42.495, usage: "bourg", kw: 22, etat: "proposition", scenarios: ["A"] },
    { id: "s12", annee: 2027, nom: "Aire de passage, Casamozza", lon: 9.440, lat: 42.525, usage: "passage", kw: 150, etat: "proposition", scenarios: ["B"] },
    { id: "s13", annee: 2028, nom: "Village de Castagniccia", lon: 9.350, lat: 42.440, usage: "bourg", kw: 22, etat: "proposition", scenarios: ["A"] },
    { id: "s14", annee: 2029, nom: "Station balnéaire, Costa Verde", lon: 9.535, lat: 42.365, usage: "destination", kw: 22, etat: "proposition", scenarios: ["B"] },
    { id: "s15", annee: 2030, nom: "Bourg-centre, Costa Verde", lon: 9.520, lat: 42.380, usage: "bourg", kw: 50, etat: "etude", scenarios: ["A","B"] },
    { id: "s16", annee: 2027, nom: "Aire de passage, plaine orientale", lon: 9.535, lat: 42.240, usage: "passage", kw: 150, etat: "proposition", scenarios: ["B"] },
    { id: "s17", annee: 2028, nom: "Bourg-centre, Aléria", lon: 9.512, lat: 42.105, usage: "bourg", kw: 50, etat: "etude", scenarios: ["A","B"] },
    { id: "s18", annee: 2029, nom: "Site antique, Aléria", lon: 9.515, lat: 42.115, usage: "destination", kw: 22, etat: "proposition", scenarios: ["B"] },
    { id: "s19", annee: 2030, nom: "Bourg-centre, Fium'Orbu", lon: 9.405, lat: 42.020, usage: "bourg", kw: 50, etat: "etude", scenarios: ["A","B"] },
    { id: "s20", annee: 2027, nom: "Village de montagne, Fium'Orbu", lon: 9.300, lat: 42.050, usage: "bourg", kw: 22, etat: "proposition", scenarios: ["A"] },
    { id: "s21", annee: 2028, nom: "Bourg-centre, Venacais", lon: 9.172, lat: 42.232, usage: "bourg", kw: 22, etat: "proposition", scenarios: ["A"] },
    { id: "s22", annee: 2029, nom: "Col et forêt, Venacais", lon: 9.168, lat: 42.170, usage: "destination", kw: 22, etat: "proposition", scenarios: ["B"] },
    { id: "s23", annee: 2030, nom: "Village du Boziu", lon: 9.270, lat: 42.330, usage: "bourg", kw: 22, etat: "proposition", scenarios: ["A"] },
    { id: "s24", annee: 2027, nom: "Aire de passage, Balagne", lon: 9.060, lat: 42.590, usage: "passage", kw: 50, etat: "proposition", scenarios: ["B"] }
  ],
  scenarios: {
    A: { nom: "Scénario A · bourgs-centres", description: "Une station par bourg-centre et village pôle, au service des habitants." },
    B: { nom: "Scénario B · axes et destinations", description: "Recharge rapide sur les axes et recharge de destination sur les sites de visite." }
  },
  scenes: {
    bourg:       { titre: "Station de bourg", description: "Place de village : deux points de recharge 22 kW, accès piéton à la mairie et aux commerces." },
    passage:     { titre: "Station de passage", description: "Aire sur un axe : recharge rapide sous auvent, entrée et sortie sans manœuvre." },
    destination: { titre: "Borne de destination", description: "Parking de site de visite : recharge lente pendant la visite, sous ombrière." }
  },
  /* Schéma IRVE, phase 2 (Tactis, version de travail d'octobre 2026) : points de charge (PdC) publics à créer par le syndicat, par intercommunalité */
  pdc_existants: 404, pdc_publics_2030: 168, pdc_ac: 68, pdc_dc: 100, pdc_total_2030: 605, pdc_prives_2030: 437, bornes_publiques: 134,
  cadence: { 2027: 42, 2028: 84, 2029: 126, 2030: 168 }, investissement_meur: 2.66, advenir_meur: 0.24, ve_2026: 6666, communes_sans_borne: 114,
  epci: [
    { code: "242000354", nom: "CA de Bastia (hors Bastia)", existants: 39, deployer: 4, ac: 2, dc: 2 },
    { code: "242020105", nom: "CC de Calvi Balagne", existants: 73, deployer: 7, ac: 3, dc: 4 },
    { code: "200033827", nom: "CC de Fium'Orbu Castellu", existants: 60, deployer: 18, ac: 7, dc: 11 },
    { code: "200073252", nom: "CC de la Castagniccia-Casinca", existants: 28, deployer: 14, ac: 6, dc: 8 },
    { code: "200034205", nom: "CC de la Costa Verde", existants: 25, deployer: 11, ac: 4, dc: 7 },
    { code: "200073104", nom: "CC de l'Île-Rousse-Balagne", existants: 45, deployer: 7, ac: 3, dc: 4 },
    { code: "200015162", nom: "CC de l'Oriente", existants: 20, deployer: 11, ac: 4, dc: 7 },
    { code: "200036499", nom: "CC de Marana-Golo", existants: 63, deployer: 41, ac: 17, dc: 24 },
    { code: "200042943", nom: "CC du Cap Corse", existants: 15, deployer: 11, ac: 4, dc: 7 },
    { code: "242020071", nom: "CC du Centre Corse (hors Corte)", existants: 0, deployer: 8, ac: 3, dc: 5 },
    { code: "200073120", nom: "CC Nebbiu-Conca d'Oro", existants: 15, deployer: 12, ac: 5, dc: 7 },
    { code: "200073138", nom: "CC Pasquale Paoli", existants: 21, deployer: 24, ac: 10, dc: 14 }
  ],
  te: { titre: "100 territoires d'électrification", texte: "La Corse entière fait partie des 109 lauréats du programme national, dévoilés le 11 septembre 2026. L'État accompagne les lauréats jusqu'en 2030 et leur ouvre en priorité ses dispositifs, dont ADVENIR pour les bornes.",
    axes: ["Électrifier les mobilités", "Sortir du fioul", "Sortir du gaz", "Électrifier l'agriculture, l'artisanat et l'industrie"],
    jalons: [["1er décembre 2026", "Feuille de route pluriannuelle du territoire"], ["Fin 2026", "Début de la mise en œuvre"], ["2026 à 2030", "Référent ADEME et référents de l'État aux côtés du territoire"]],
    role: "Le SDE2B porte le volet recharge de la feuille de route : 168 points de charge publics là où l'initiative privée n'ira pas, et la coordination des 437 points de charge privés attendus, avec l'Agence du tourisme de la Corse.", sources: ["te_bdt"] },
  rayon_km_defaut: 15,

  objectif: "605 nouveaux points de charge d'ici 2030, dont 168 portés par le SDE2B",
  financeurs: ["ADVENIR (CEE) : 200 M€ jusqu'à fin 2027, prolongation jusqu'en 2030 en projet", "Territoires d'électrification : accès prioritaire, feuille de route avant le 1er décembre 2026", "FEDER Corse", "Délégation de service public, avec une dotation du syndicat (ordre de grandeur : 200 k€ par an sur 5 ans)"]
},

/* ---------------------------------------------------------------- 3. COOPÉRATION INTERNATIONALE
   statut_coop : "contact" | "envisagee" | "confirmee"   (aucun partenariat n'est confirmé à ce jour) */
coop: {
  programme: "Interreg Italie-France Maritime 2021-2027",
  programme_texte: "Programme européen de coopération transfrontalière cofinancé par le FEDER. La Corse en est membre ; la Collectivité de Corse en est l'autorité nationale. Il couvre la Sardaigne, la Ligurie, la Toscane littorale, la Corse, le Var et les Alpes-Maritimes, soit plus de 7 millions d'habitants. Les énergies renouvelables font partie de ses secteurs cibles.",
  programme_sources: ["maritime_zone","maritime_ctc","maritime_appel"],
  corse: { lon: 9.10, lat: 42.15 },
  programmes: [
    { id: "maritime", nom: "Interreg Italie-France Maritime", cercle: "Le partenariat de proximité", texte: "Corse, Sardaigne, Ligurie, Toscane littorale, Var et Alpes-Maritimes : plus de 7 millions d'habitants ; les énergies renouvelables font partie des secteurs ciblés.", sources: ["maritime_zone", "maritime_appel"] },
    { id: "euromed", nom: "Interreg Euro-MED", cercle: "Le bassin méditerranéen", texte: "69 régions de 14 pays de la rive nord de la Méditerranée, 295 M€ sur 2021-2027 pour une société neutre en carbone et résiliente ; chaque projet réunit des partenaires d'au moins cinq pays.", sources: ["euromed_eeas", "euromed_appel"] },
    { id: "iles", nom: "Clean energy for EU islands", cercle: "Le réseau des îles européennes", texte: "Le secrétariat européen accompagne les îles dans leur agenda de transition. La Corse ne figure encore ni parmi les « 30 îles pour 2030 » ni parmi les îles suiveuses : une place à prendre.", sources: ["eu30", "follower", "cei_26"] }
  ],
  corse_sud: { nom: "Corse-du-Sud · SDE2A", lon: 8.74, lat: 41.93, texte: "Le syndicat d'énergie de Corse-du-Sud déploie 300 points de charge publics dès 2026 ; avec les 168 du SDE2B, la Corse disposera de 468 points de charge publics de nouvelle génération et d'une même grille tarifaire.", sources: ["tactis"] },
  bassin: [
    { id: "maj", nom: "Majorque", pays: "Espagne", lon: 2.65, lat: 39.57, titre: "Green Hysland", texte: "Une vallée de l'hydrogène insulaire : électrolyse à partir du solaire, usages dans la mobilité et la chaleur, avec 10 M€ du Clean Hydrogen Partnership.", lecon: "Le volet hydrogène de Smart Paese", sources: ["greenhysland"] },
    { id: "til", nom: "Tilos", pays: "Grèce", lon: 27.38, lat: 36.43, titre: "TILOS", texte: "Une île du Dodécanèse alimentée par une éolienne, une centrale solaire et une batterie pilotées, avec 11 M€ du programme européen Horizon 2020.", lecon: "Le pilotage et le stockage de Smart Paese", sources: ["tilos"] },
    { id: "cre", nom: "Crète", pays: "Grèce", lon: 24.02, lat: 35.51, titre: "Le forum des îles", texte: "Chania a accueilli en 2017 le premier forum Clean Energy for EU Islands ; la Crète fait partie des îles engagées dans un agenda de transition.", lecon: "La méthode de l'agenda de transition", sources: ["cei_crete", "cei_26"] },
    { id: "mlt", nom: "Malte", pays: "Malte", lon: 14.51, lat: 35.90, titre: "La déclaration de La Valette", texte: "L'initiative européenne pour les îles est née à La Valette en mai 2017, signée par la Commission et 14 États membres, dont la France.", lecon: "Le cadre politique des îles", sources: ["cei_malte"] },
    { id: "pan", nom: "Pantelleria", pays: "Italie", lon: 11.95, lat: 36.83, titre: "Île pilote", texte: "Parmi les 26 premières îles accompagnées par le secrétariat européen des îles en 2019.", lecon: "Une île italienne en avance", sources: ["cei_26"] },
    { id: "hvar", nom: "Hvar", pays: "Croatie", lon: 16.65, lat: 43.17, titre: "Île pilote", texte: "Parmi les 26 premières îles accompagnées en 2019, avec sa voisine Brač.", lecon: "Des communes insulaires qui coopèrent", sources: ["cei_26"] }
  ],
  partenaires: [
    { id: "sard", nom: "Sardaigne", lon: 9.00, lat: 40.10, perimetre: "Provinces de Sassari, Nuoro, Oristano, Cagliari et Sud Sardegna",
      interlocuteur: "Région autonome de Sardaigne", atout: "Programme régional de communautés d'énergie : 249 communes aidées pour leurs études.",
      apport: "Un village pilote équivalent à Smart Paese, la méthode des communautés d'énergie, une évaluation croisée.", exemple: "ex1", sources: ["sardaigne","maritime_zone"] },
    { id: "tosc", nom: "Toscane littorale", lon: 10.75, lat: 43.30, perimetre: "Provinces de Massa-Carrara, Lucca, Pisa, Livorno et Grosseto, dont l'île d'Elbe",
      interlocuteur: "Région Toscane", atout: "Projet INVECE du programme Maritime sur les communautés énergétiques ; îles touristiques à forte saisonnalité.",
      apport: "Retour d'expérience sur la recharge des sites touristiques et la saisonnalité des usages.", exemple: "ex2", sources: ["invece","maritime_zone"] },
    { id: "lig", nom: "Ligurie", lon: 8.93, lat: 44.41, perimetre: "Provinces d'Imperia, Savona, Genova et La Spezia",
      interlocuteur: "Région Ligurie", atout: "Villages de l'arrière-pays littoral comparables aux nôtres.",
      apport: "Partage de méthodes sur l'éclairage public et la sobriété des petites communes.", sources: ["maritime_zone"] },
    { id: "paca", nom: "Var et Alpes-Maritimes", lon: 6.75, lat: 43.55, perimetre: "Départements du Var et des Alpes-Maritimes (Région Sud)",
      interlocuteur: "Territoire d'énergie Var – Symielec, et son homologue des Alpes-Maritimes", atout: "Syndicats d'énergie de même nature que le SDE2B : contrôle de concession, éclairage public, bornes de recharge.",
      apport: "Échanges entre syndicats d'énergie sur la mobilité électrique et la production solaire publique.", sources: ["maritime_zone","te83"] }
  ],
  exemples: [
    { id: "ex1", titre: "Paesi resilienti : des villages qui tiennent", partenaires: ["sard"],
      objectif: "Comparer Smart Paese avec un village sarde équivalent et construire ensemble le modèle du village qui tient une coupure longue.",
      contributions: { "SDE2B": "Smart Paese, son pilotage énergétique et son retour d'expérience.", "Sardaigne": "Un village pilote équivalent, la méthode des communautés d'énergie, une évaluation croisée." },
      livrable: "Guide commun de conception d'un village résilient et tableau de bord comparé.",
      prochaine_etape: "Prendre contact avec la Région autonome de Sardaigne avant le prochain appel à projets du programme.",
      instrument: "Interreg Italie-France Maritime", sources: ["sardaigne","maritime_zone"], demonstrateur: { onglet: "villages", site: "vA" } },
    { id: "ex2", titre: "Recharge des saisons : la mobilité électrique touristique", partenaires: ["tosc"],
      objectif: "Dimensionner la recharge des sites de visite pour la pointe d'été sans surinvestir pour l'hiver.",
      contributions: { "SDE2B": "Bornes de destination et données d'usage anonymisées.", "Toscane": "Retour d'expérience des îles et du littoral toscans à forte saisonnalité." },
      livrable: "Méthode de dimensionnement saisonnier et recommandations tarifaires.",
      prochaine_etape: "Identifier un partenaire toscan avant le prochain appel à projets du programme.",
      instrument: "Interreg Italie-France Maritime", sources: ["invece","maritime_zone"], demonstrateur: { onglet: "irve", scene: "destination" } },
    { id: "ex3", titre: "Isule luminose : l'éclairage public des îles en LED", partenaires: ["maj", "cre", "mlt", "hvar"],
      objectif: "Passer l'éclairage public des communes insulaires en LED piloté, en protégeant le ciel nocturne et la biodiversité.",
      contributions: { "SDE2B": "Le programme 100 % LED de la Haute-Corse et sa télégestion.", "Îles partenaires": "Leurs programmes communaux, leurs données de consommation et leurs choix d'extinction nocturne." },
      livrable: "Un référentiel commun de l'éclairage public insulaire et un tableau de bord des économies.",
      prochaine_etape: "Constituer un partenariat d'au moins cinq pays pour un prochain appel Euro-MED.",
      instrument: "Interreg Euro-MED", sources: ["euromed_eeas", "euromed_appel"], demonstrateur: { onglet: "ep" } },
    { id: "ex4", titre: "Isula in rete : la Corse dans le réseau des îles", partenaires: ["til"],
      objectif: "Faire entrer la Corse dans le réseau européen des îles et apprendre des îles qui fonctionnent déjà en micro-réseau.",
      contributions: { "SDE2B": "Smart Paese comme village démonstrateur et la feuille de route énergétique de la Haute-Corse.", "Tilos": "Près de dix ans de retour d'expérience sur une île pilotée par le solaire, l'éolien et la batterie." },
      livrable: "Un agenda de transition de la Haute-Corse, rédigé avec le secrétariat européen des îles.",
      prochaine_etape: "Proposer la candidature de la Corse au réseau des îles, avec la Collectivité de Corse.",
      instrument: "Clean energy for EU islands", sources: ["follower", "tilos"], demonstrateur: { onglet: "villages", site: "vA" } }
  ]
},

/* ---------------------------------------------------------------- MANDATURE : jalons affichés sur la frise */
mandature: { debut: 2026, fin: 2032, jalons: [
  { annee: 2026, t: "Statuts du SDE2B et compétence mobilité électrique ; feuille de route des territoires d'électrification ; programme LED arrêté" },
  { annee: 2027, t: "Création de la SEM EnR ; Smart Paese, le village démonstrateur ; 42 premiers points de charge publics ; candidature Interreg Maritime" },
  { annee: 2028, t: "Premiers projets solaires de la SEM ; 84 points de charge publics en service" },
  { annee: 2029, t: "126 points de charge publics en service ; trois points lumineux sur quatre en LED" },
  { annee: 2030, t: "100 % LED ; 605 nouveaux points de charge, dont 168 publics du SDE2B ; centrale solaire sur site dégradé" },
  { annee: 2032, t: "Bilan de mandature : le SDE2B, syndicat d'énergie de la transition en Haute-Corse ; Smart Paese essaimé" } ] },

/* ---------------------------------------------------------------- 4. SEM · PROJETS STRUCTURANTS
   Les champs chiffrés à null s'affichent « à renseigner ». */
sem: {
  projets: [
    { id: "p1", annee: 2028, scene: "toitures", fictif: true, statut: "simule", nom: "Grappe de toitures photovoltaïques publiques", secteur: "Balagne", lon: 8.965, lat: 42.610,
      stade: "Projet proposé", porteur: "SEM EnR du SDE2B, à constituer", foncier: "Toitures communales, sous convention d'occupation",
      puissance_kwc: 1000, production_mwh: 1300, investissement_eur: 1300000, detail_taille: "une dizaine de toitures publiques d'environ 100 kWc",
      dependances: ["Création de la SEM", "Diagnostic des toitures : structure, orientation, amiante", "Appel d'offres CRE PV ZNI (famille 1, toitures agrégées)", "Raccordement EDF SEI"],
      decision: "Lancer l'inventaire des toitures publiques (DST).", raccordement: "Injection par bâtiment ou autoconsommation collective, avec EDF SEI.",
      emprise: "Toitures d'écoles, de mairies et de salles communales.", sources: ["cre164","bdt_sem"] },
    { id: "p2", annee: 2028, scene: "ombriere", fictif: true, statut: "simule", nom: "Ombrière photovoltaïque et recharge", secteur: "Nebbiu", lon: 9.310, lat: 42.676,
      stade: "Projet proposé", porteur: "SEM EnR du SDE2B, à constituer, avec la commune", foncier: "Parking public communal",
      puissance_kwc: 250, production_mwh: 330, investissement_eur: 450000, detail_taille: "ombrières sur un parking de 40 places, hors bornes",
      dependances: ["Création de la SEM", "Schéma départemental de recharge", "ADVENIR pour les bornes", "Raccordement EDF SEI"],
      decision: "Retenir un parking candidat avec la commune.", raccordement: "Poste de livraison en limite de parking, raccordé au réseau d'EDF SEI.",
      emprise: "Parking public de 40 places couvert d'ombrières.", sources: ["cre164","advenir"] },
    { id: "p3", annee: 2030, scene: "centrale", fictif: true, statut: "simule", nom: "Centrale solaire sur site dégradé", secteur: "Plaine orientale", lon: 9.470, lat: 42.210,
      stade: "Projet proposé", porteur: "SEM EnR du SDE2B, à constituer", foncier: "Ancienne décharge ou délaissé",
      puissance_kwc: 5000, production_mwh: 7000, investissement_eur: 4500000, detail_taille: "environ 5 hectares",
      dependances: ["Création de la SEM", "Identification d'un site dégradé et maîtrise foncière", "Appel d'offres CRE PV ZNI (famille 2)", "Étude d'impact et avis de l'autorité environnementale", "Raccordement HTA EDF SEI"],
      decision: "Faire recenser les sites dégradés éligibles (DGA, DST).", raccordement: "Raccordement HTA au poste source le plus proche, avec EDF SEI.",
      emprise: "Environ 5 hectares de terrain dégradé, sans conflit d'usage agricole ou naturel.", sources: ["cre164"] }
  ],
  references: [
    { nom: "Avergies (TE 47)", texte: "SEM au capital de 24,6 M€ ; plan de 270 M€ ; Banque des Territoires à 16 %.", source: "avergies" },
    { nom: "Énerg'iV (SDE 35)", texte: "50 M€ investis, 67 toitures photovoltaïques.", source: "sde35" },
    { nom: "Ha-Py Énergies (SDE 65)", texte: "37 MW sur 13 installations.", source: "sde65" }
  ],
  cadre: "Appel d'offres CRE PV ZNI : 50 MWc appelés en Corse à la période 5 (dépôt du 27 octobre au 7 novembre 2026).",
  cadre_sources: ["cre164"]
}
};

/* ---------------------------------------------------------------------
   VERSION FINALE (10 novembre 2026) : calendrier aligné sur le projet
   Smart Paese, vigie incendie et pilotage prédictif, moyens et décisions.
   --------------------------------------------------------------------- */
(function (D) {
  D.meta.version = "Version finale de présentation";
  D.meta.date = "2026-11-10";
  D.meta.smart_paese_url = "https://claude.ai/artifact/1KjN3xNcQXarQv6tYHXnHL";
  var v = D.villages.sites[0];
  v.annee = 2029; v.date = "2026-11-10";
  v.resume = "Le village démonstrateur du syndicat : il produit, stocke et partage son énergie, garde sa mairie ouverte comme refuge quand le réseau tombe, veille sur son versant contre le feu et prépare les coupures grâce à la météo du lendemain. Un modèle à reproduire dans les villages de bout de ligne.";
  v.atouts = ["Toitures solaires, torrent et batterie communale", "Vigie incendie : caméra, capteurs et alerte automatique", "Pilotage prédictif sur la météo du lendemain", "Hydrogène en option pour la longue durée"];
  var feu = D.villages.scenarios.filter(function (s) { return s.id === "feu"; })[0];
  if (feu) feu.recit = "Un départ de feu est repéré à 13 h par la vigie du village. La batterie se charge par anticipation et le village s'isole avant la mise hors tension de la ligne, pour une journée. Les télécommunications et la mairie refuge restent alimentées pour coordonner les secours.";
  D.mandature.jalons = [
    { annee: 2026, t: "Statuts du SDE2B et compétence mobilité électrique ; feuille de route des territoires d'électrification ; programme LED arrêté" },
    { annee: 2027, t: "Création de la SEM EnR ; lettre d'intention Smart Paese avec l'Università di Corsica et le CNRS ; 42 premiers points de charge publics ; candidature Interreg Maritime" },
    { annee: 2028, t: "Premiers projets solaires de la SEM ; travaux du premier Smart Paese ; 84 points de charge publics en service" },
    { annee: 2029, t: "Smart Paese : premier village en service ; 126 points de charge publics ; trois points lumineux sur quatre en LED" },
    { annee: 2030, t: "100 % LED ; 605 nouveaux points de charge, dont 168 publics du SDE2B ; centrale solaire sur site dégradé" },
    { annee: 2031, t: "Trois Smart Paese en service ; une méthode pour les communes du syndicat" },
    { annee: 2032, t: "Bilan de mandature : le SDE2B, syndicat d'énergie de la transition en Haute-Corse" }
  ];
  /* moyens : montants connus à ce stade ; statut = origine du chiffre */
  D.mandature.moyens = [
    { k: "villages", nom: "Smart Paese", montant: "3,4 M€", detail: "Trois villages, recherche et pilotage sur cinq ans. Estimation du modèle de simulation, à consolider par les études.", statut: "simule" },
    { k: "irve", nom: "Mobilité électrique", montant: "2,66 M€", detail: "168 points de charge publics, dont 0,24 M€ attendus d'ADVENIR. Chiffrage du schéma de recharge.", statut: "documente" },
    { k: "sem", nom: "SEM EnR", montant: "6,25 M€", detail: "6,25 MWc en trois projets types, portés par la société et ses partenaires, hors budget du syndicat.", statut: "simule" },
    { k: "ep", nom: "Éclairage public", montant: "à chiffrer", detail: "Investissement à arrêter après l'inventaire du parc. Économie visée à 100 % LED : environ 1,7 M€ par an.", statut: "a_confirmer" },
    { k: "coop", nom: "Coopération", montant: "selon appels", detail: "Cofinancements européens, à la candidature.", statut: "a_confirmer" }
  ];
  D.mandature.decisions = [
    "Arrêter les statuts du SDE2B et la compétence mobilité électrique",
    "Remettre la feuille de route des territoires d'électrification avant le 1er décembre 2026",
    "Lancer l'inventaire du parc d'éclairage et des toitures publiques",
    "Engager la création de la SEM EnR",
    "Signer la lettre d'intention Smart Paese avec l'Università di Corsica et le CNRS, en février 2027",
    "Déposer une candidature au programme Interreg Italie-France Maritime"
  ];
})(window.ATLAS_DATA);
