# V2.33 — MATIÈRES DES BOULES

## Point traité (1/N, sur demande explicite : "les couleurs/matières ne font pas vrai")
Uniquement l'apparence des boules. Rien d'autre n'a été touché : physique, règles, tours,
score, caméra, décor, terrain restent strictement identiques à la V2.32.

## Fichiers modifiés
- `match-core-career-v2-4/index.html` (texture `metal` + `ballMaterial()` + environnement de reflet)
- `src/app.js` (cache-buster uniquement, v232 → v233)
- `index.html` (cache-buster uniquement, v232 → v233)

## Ce qui ne « faisait pas vrai » avant
1. Texture des boules : rayures aléatoires sur fond gris plat. Aucune boule réelle n'a cet aspect.
2. Environnement de reflet : cube à 3 couleurs plates, non filtré → reflets bruités façon plastique.
3. Matériau : metalness 1 / roughness très basse / clearcoat élevé → rendu chromé façon boule de billard,
   trop poli pour de l'acier de compétition (satin/mat).
4. Couleurs des deux équipes : gris très clair vs quasi noir → lisible mais pas réaliste.

## Changements
- Texture `metal` : stries de tournage concentriques (comme une boule usinée au tour), micro-grain
  circonférentiel dense à faible contraste (aspect « brossé »), quelques micro-marques d'usure.
- Environnement de reflet : dégradé ciel/sol/horizon plus riche, **passé au PMREM** (préfiltrage
  physique standard en rendu 3D) pour des reflets doux et cohérents plutôt que crus.
- `ballMaterial()` : metalness 0.92–0.94, roughness relevée (0.34–0.46 selon équipe/mobile),
  clearcoat réduit. Teintes rapprochées d'un acier satiné réel (argenté chaud / graphite),
  au lieu du blanc/noir façon snooker.

## Non modifié
Physique (Rapier), règles, tours, score, caméra, décor, terrain, sauvegarde, carrière.

## À tester sur ton téléphone
Recharge la page (le cache-buster a été augmenté) et regarde les boules tourner pendant un lancer :
elles doivent avoir un aspect satiné avec des reflets doux, pas un aspect chromé/plastique.
