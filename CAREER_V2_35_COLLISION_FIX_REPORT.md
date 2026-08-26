# V2.35 — PASSE CONSOLIDÉE : BUG DE COLLISION CRITIQUE + BILAN COMPLET

## Ce qui a motivé cette passe
Retour direct : "les boules quand elles se tapent entre elles, ça ne marche pas". Demande explicite
d'enchaîner plusieurs points sans attendre une validation à chaque étape, en tenant compte de
l'ensemble des réponses au QCM de refonte (V2.34 GAME_DESIGN_SPEC_V3.md).

## 🔴 BUG CRITIQUE CORRIGÉ : les collisions entre boules ne produisaient presque aucun effet

### Cause exacte trouvée dans le code
Dans `physicsStep()`, avant chaque micro-étape physique, ce code s'exécutait :
```js
if(!body.moving) syncStoppedBodyToPhysics(body);
```
`syncStoppedBodyToPhysics` **replace de force** une boule à sa position précédente, met sa vitesse
à zéro et **la rendort**. Le drame : cette ligne tournait pour **toute boule dont le flag interne
`moving` était `false`** — or ce flag ne redevient `true` QUE pour la boule explicitement lancée
par un joueur/l'IA (`launchBody`/`wake()`). Une boule déjà posée sur le terrain qui se faisait
percuter par une autre voyait bien Rapier lui donner une impulsion pendant `physicsWorld.step()`…
mais était **immédiatement re-figée à sa position d'avant l'impact dès la micro-étape suivante**,
avant d'avoir pu bouger visiblement. Résultat concret : les boules au sol semblaient "immunisées"
aux chocs.

### Correctif
- La boule n'est plus figée de force que si elle **n'a pas encore été jouée** (`!body.played`) —
  les boules déjà en jeu restent des corps physiques normaux, gérés entièrement par Rapier
  (y compris leur sommeil/réveil, ce que Rapier fait très bien nativement).
- Ajout d'une détection : une boule au repos qui vient d'être touchée (vitesse post-impact
  significative ou corps pas endormi côté Rapier) est **automatiquement remarquée comme "en
  mouvement"**, pour que la résistance au roulement/l'endormissement progressif s'applique à elle
  normalement — comme pour n'importe quelle boule lancée.

### Fichiers modifiés
- `match-core-career-v2-4/index.html` (uniquement la fonction `physicsStep`)

### Non modifié
Règles, tours, score, POINTER/TIRER, swipe, types de lancer, carrière, tournois, sauvegarde,
caméra, décor, matériaux (V2.33), profils de terrain (V2.34).

## ✅ Vérifié : formats doublette/triplette sont DÉJÀ fonctionnels
En auditant le moteur (`BALLS_PER_TEAM`, `blueControlQueue`, gestion des rôles par format) et les
données de carrière (`data/tournaments.json`), ces formats sont pleinement implémentés et déjà
présents dans le calendrier de carrière (21 tournois doublette, 14 triplette, 5 tête-à-tête).
Contrairement à un ancien rapport (V1, très antérieur), rien n'est verrouillé ici : aucune
correction nécessaire sur ce point.

## ✅ Déjà en place, mieux que prévu : logique stratégique de l'IA
L'IA (`makeBaseAIThrowPlan`) décide déjà de pointer ou tirer selon : qui tient le point, la
distance de la boule adverse la plus proche, et le niveau de difficulté. Elle ajuste déjà son
choix de type de tir (roulée/portée/demi-portée) selon le type de terrain (`VISUAL_SURFACE`).
Ce n'est pas la coquille vide qu'on pouvait craindre.

## Honnêteté sur les limites de cette passe
Je travaille par lecture et raisonnement sur le code, **sans navigateur pour tester
visuellement/en conditions réelles**. J'ai vérifié la cohérence logique et la syntaxe de chaque
changement, mais je ne peux pas garantir à 100% l'absence de tout effet de bord sur un fichier
de cette taille sans un test réel de ta part. C'est pour ça que chaque livraison doit repasser
par ton téléphone avant la suivante — pas par prudence excessive, mais parce que c'est la seule
vérification fiable disponible.

## Reste ouvert pour les prochaines passes (fixé lors du QCM, pas encore traité)
- IA : approfondir le raisonnement au-delà de pointer/tirer (gestion du score, de la mène, du
  nombre de boules restantes dans la main).
- Caméra rasante immersive + ralenti/zoom sport TV sur les beaux coups (actuellement caméra fixe).
- Mode manager (sponsors/argent/équipe) en plus du mode carrière joueur existant.
- Masters de Pétanque (championnat de fin de carrière).
- Multijoueur local (pass-and-play, 2 joueurs sur le même téléphone).
- Personnalisation équipement (boules, tenue).
- HUD allégé (score + boules restantes uniquement).
- Compatibilité Android (les patchs `iphone-gameplay-v218/v219` sont iPhone-only).

## À tester en priorité sur ton téléphone
Fais se percuter deux boules volontairement (tir au fer sur une boule adverse posée) : elle doit
maintenant être clairement repoussée, pas juste trembler sur place.
