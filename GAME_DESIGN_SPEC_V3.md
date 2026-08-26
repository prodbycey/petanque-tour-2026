# PÉTANQUE TOUR 2026 — SPEC DE REFONTE (issue du QCM du 26/08/2026)

## A. Identité
- Style : réaliste / simulation.
- Durée : partie longue et réaliste, 13 points complets.
- Priorité n°1 : sensation physique réaliste des boules.

## B. Pointer
- Contrôle : swipe direct sur écran (conservé).
- Précision influencée par : compétence du joueur (stat carrière) + précision du geste + système d'effets (lift, vitesse, rétro) — les trois combinés.
- Feedback visuel : ligne de visée simple.
- Aide à la visée : activable dans les options (off par défaut suggéré).

## C. Tirer
- Types de tirs : système complet, tous les tirs réels (fer, carreau, demi-portée, plombée, etc.).
- Sensation d'impact : les deux — fort/arcade (vibration, flash, slow-mo) ET discret/réaliste — activable en réglages.

## D. Cochonnet
- Anecdotique : sert uniquement à lancer la mène, pas de couche stratégique dessus (contrairement à l'existant qui a un système de précision 6-10 m — à simplifier).

## E. Contrôles
- Swipe libre conservé comme mécanique principale (Pointer et Tirer).
- Aide/assistant activable en options.

## F. Caméra
- Vue principale : rasante à hauteur de boule (immersive), pas de vue de dessus stratégique par défaut.
- Cinématique : ralenti + zoom façon sport TV après un beau coup (carreau, etc.).

## G. Physique & terrain
- La physique actuelle ne convainc pas : refonte complète (déjà amorcée avec Rapier 3D en V2.32, mais le ressenti doit être revalidé de zéro : roulement, rebonds/collisions, résistance selon le sol).
- Le terrain doit influencer fortement le jeu (stratégie selon le type de sol : terre battue, gravier, sable, etc.), pas juste visuel.

## H. IA adverse
- Difficulté : mix progression automatique (communal → international) + réglage manuel possible.
- Comportement : l'IA doit raisonner une vraie stratégie (choix pointer/tirer selon la situation sur le terrain), pas juste être plus précise avec le niveau.

## I. Formats
- Les trois formats officiels : tête-à-tête, doublette, triplette.

## J. Mode carrière
- Structure : combinaison de progression linéaire (communal → international) + ramifications (choix de tournois/calendrier) + gestion façon manager (équipe, sponsors, argent).
- Éléments carrière : stats joueur (précision, tir, mental) + argent/équipement + réputation/fans/sponsors — tout combiné.
- Pas de système de fatigue/forme (jugé trop complexe pour l'instant).

## K. Personnalisation
- Apparence + style de jeu (pointeur/tireur/milieu) + équipement (boules, tenue).

## L. Terrains/lieux
- Grande variété selon le niveau : du communal terreux au stade international, avec une identité visuelle propre à chaque palier.

## M. Interface (HUD)
- Minimal : score + nombre de boules restantes. Pas de surcharge d'infos pendant le match.

## N. Audio
- Ambiance réaliste : bruits de boules, murmures de foule.
- Commentateur vocal réservé aux grands tournois / finales importantes (pas sur les matchs courants).

## O. Boucle de progression / rétention
- Système de tournois (existant) à conserver et enrichir.
- Ajout d'un championnat prestige : **Masters de Pétanque**, sommet de la carrière.

## P. Multijoueur
- Multi local uniquement : deux joueurs sur le même téléphone (pass-and-play), pas de online pour l'instant.

## Q. Monétisation / plateforme
- Gratuit avec publicités.
- Cible : iPhone + Android (donc attention à toute dépendance iOS-only dans le code actuel).

---

## Conséquences techniques directes sur le code existant
- Le moteur Rapier (V2.32) reste la bonne base technique, mais le *tuning* (frottements, restitution, résistance au roulement selon sol) doit être repensé avec le terrain comme variable stratégique — pas juste esthétique.
- Les patchs empilés `iphone-gameplay-v218/v219` (spécifiques iPhone) sont à reprendre pour être compatibles Android nativement, pas seulement patchés a posteriori.
- Le système de cochonnet (actuellement précis 6-10m) est à simplifier fonctionnellement.
- L'IA doit passer d'un système de probabilités de résultat (EXCELLENT/GOOD/MISS tirés au sort pondérés) à un système qui évalue la situation du terrain (boules en présence, points, risques) avant de choisir pointer ou tirer.
- Les formats doublette/triplette (actuellement verrouillés dans le menu) sont à développer.
- Le mode carrière doit intégrer un module manager (sponsors/argent/équipe) en plus du module joueur existant.
- Prévoir un mode local 2 joueurs (pass-and-play) sur l'écran de match.
