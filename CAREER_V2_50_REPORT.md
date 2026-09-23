# PÉTANQUE TOUR 2026 — V2.50 — GAME FEEL & DIRECT MATCH FLOW

## Base
V2.50 est construite sur la V2.40 « Physics Fix & Premium Visual Rebuild ». Le correctif Rapier de V2.40 est conservé : monde interne ×10, pas fixe 120 Hz, CCD, transferts d'énergie Rapier et événements de contact réels.

## Parcours avant le match
- Le tableau tournoi reste disponible, mais n'est plus imposé avant la première partie.
- Après inscription + composition d'équipe, le joueur arrive directement sur la présentation de l'adversaire.
- Le choix « ÉQUIPE / MON JOUEUR » est désormais intégré à cette page.
- Le bouton lance directement le Match Core.
- Le mode de contrôle choisi est mémorisé pour les matchs suivants.

## Physique des terrains
Six familles de surface possèdent désormais leurs propres paramètres de friction, restitution, freinage au roulement et micro-déviation :
- terre compacte ;
- gravier fin ;
- sable dur ;
- rocheux ;
- terre rouge ;
- terre humide.

Rapier reste le solveur principal. Les différences de piste modifient surtout la prise de sol, le rebond, la longueur de roulage et la petite irrégularité d'un impact.

## Impacts au sol
Chaque contact réel avec le sol peut maintenant produire :
- son de terrain adapté à la surface ;
- poussière colorée/quantifiée selon la piste ;
- marque de chute ;
- petits graviers projetés sur gravier/rocheux ;
- micro-déviation plus sensible sur piste pierreuse.

## Tirs : carreau / palet / recul
Un tir du joueur est suivi depuis le départ jusqu'à l'arrêt des boules.
Après stabilisation, le résultat est classé à partir de la vraie collision et des positions finales :
- CARREAU ;
- PALET ;
- RECUL ;
- TIR TOUCHÉ.

Le compteur de carreaux de fin de match est maintenant réellement alimenté. Les tirs touchés alimentent également les statistiques de réussite.

## Impact acier / acier
- halo très court sur le point de contact ;
- claque acier liée à l'événement Rapier ;
- impulsion caméra renforcée sur gros choc ;
- feedback spécial lors d'un carreau/palet/recul.

## Boules
- maillage desktop plus détaillé ;
- stries 3D visibles ajoutées ;
- variations de motifs pour améliorer la lecture des boules ;
- matériaux acier V2.40 conservés.

## Personnages et décor
- ajout de joueurs 3D légers en bord de piste ;
- animation d'attente très discrète ;
- aucun collider : ils n'influencent ni les règles ni les trajectoires.

## Règles conservées
La logique réglementaire existante n'a pas été reconstruite. Les tests officiels internes du Match Core restent à 22/22, notamment :
- cochonnet 6 à 10 m ;
- boules mortes ;
- ordre de jeu ;
- fin de mène ;
- cochonnet mort ;
- victoire à 13 points.

## Validation exécutée
- syntaxe `src/app.js` : PASS
- syntaxe JavaScript inline Match Core : PASS
- tous les tests `tests/*.test.js` : PASS
- `tests/v250-gamefeel-structural.test.js` : PASS
- `match-core-career-v2-4/tests/rules.test.js` : 22/22 PASS

## Limite de validation
Le navigateur headless local n'a pas pu terminer un rendu visuel complet de la scène, le Match Core conservant ses dépendances CDN Three.js/Rapier. La validation livrée est donc syntaxique, structurelle et réglementaire. Un playtest sur iPhone reste la prochaine validation utile pour régler finement : puissance du swipe, durée de roulage, seuil du carreau et équilibre entre les six sols.
