# V2.32 — ÉTAPE 2 PHYSIQUE RAPIER

## Fichiers modifiés
- `match-core-career-v2-4/index.html`
- `src/app.js` (cache-buster uniquement)
- `index.html` (cache-buster uniquement)
- `tests/physics-step2-structural.test.js`
- `PHYSICS_STEP2_TEST.html`

## Changements physiques
- Rapier 3D compat 0.19.3 chargé avant le Match Core.
- Monde physique interne x10 pour améliorer la robustesse numérique sans modifier les coordonnées utilisées par les règles/caméra.
- pas fixe : 120 Hz.
- CCD activé sur chaque boule/cochonnet dynamique.
- sphères Rapier avec masse/densité, friction et restitution.
- sol physique fixe avec friction.
- vraies vitesses linéaires + vitesses angulaires.
- collisions et transferts d’énergie entièrement résolus par Rapier.
- suppression du solveur manuel `resolvePair`.
- suppression du freinage IA artificiel `rollDrag=20/16/8`.
- résistance au roulement progressive appliquée uniquement au contact du sol.
- sleep propre à très basse vitesse.
- détection audio séparée : elle ne modifie jamais le résultat physique.

## Non modifié
- règles de pétanque ;
- tours ;
- score ;
- POINTER/TIRER ;
- swipe ;
- types de lancer ;
- carrière ;
- tournois ;
- sauvegarde ;
- caméra et décor.

## Dépendance
Rapier compat est servi depuis jsDelivr, comme Three.js l’est déjà dans la base actuelle. Le package compat embarque le WASM dans le module JavaScript.
