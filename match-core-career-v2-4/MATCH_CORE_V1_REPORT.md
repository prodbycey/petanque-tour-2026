# PÉTANQUE TOUR — MATCH CORE V1

## BACKUP CRÉÉ
`GAMEPLAY_CORE_VALIDATED_BACKUP` — SHA-256 `bba9454f6870ed4128340edd738e5ed0437f9cff7b3900a9f0ffa15bb87cf959` (copie exacte V3.10).

## MENU
Menu principal ajouté : Carrière, Partie rapide, Entraînement, Joueur/Équipe, Classement. Seule Partie rapide est fonctionnelle.

## PARTIE RAPIDE
Tête-à-tête fonctionnel : 3 boules joueur / 3 boules IA, 13 points. Doublette et Triplette visibles mais verrouillées.

## PILE OU FACE
Choix PILE/FACE + pièce 3D animée. Le gagnant obtient le cochonnet et la première boule.

## LANCER DU COCHONNET
Swipe réel pour le joueur, lancer réel IA, contrôle 6,00–10,00 m, un seul essai. Si invalide : l'adversaire place le but et l'équipe initiale conserve la première boule.

## RULES ENGINE
`src/rules-engine.js` : validité du but, boule morte après franchissement complet, but mort, équipe au point, prochain joueur, égalité, score de mène, but mort, victoire.

## MATCH ENGINE
`src/match-engine.js` : format, score, mène, boules restantes.

## TURN MANAGER
`src/turn-manager.js` : l'équipe qui n'a pas le point joue.

## IA
Même moteur de mouvement/collision pour les boules. IA 40–65 % conservée. Lancer du cochonnet ajouté.

## RÈGLES DE SORTIE
Une boule qui chevauche encore la ligne reste valide. Elle est morte seulement après l'avoir entièrement franchie. Les bordures bois restent visuelles.

## SCORE / MÈNES / 13 POINTS
Score de mène, gagnant de mène qui engage la suivante, victoire à 13 ou plus.

## TESTS EFFECTUÉS
```
PASS 1 coin toss mapping
PASS 2 5.9 invalid
PASS 3 6.0 valid
PASS 4 10.0 valid
PASS 5 10.1 invalid
PASS 6 invalid jack placement retains starter
PASS 7 blue holds -> red
PASS 8 red fails -> red again
PASS 9 red takes point -> blue
PASS 10 exhausted side -> other
PASS 11 +2 scoring
PASS 12 overlap line valid
PASS 13 fully out dead
PASS 14 dead remains dead
PASS 15 moved jack used
PASS 16 jack >10 after impact may live
PASS 17 dead jack both have balls void
PASS 18 dead jack one side +2
PASS 19 exact tie last team replays
PASS 20 previous winner starts next
PASS 21 12+2 victory
PASS 22 13+ accepted
TOTAL PASS 22/22
```
Syntaxe inline : OK
Scripts : {"state-machine.js": "OK", "turn-manager.js": "OK", "match-engine.js": "OK", "rules-engine.js": "OK"}

## RÉGRESSIONS GAMEPLAY
Aucune calibration de `launchBody()` (POINTER/TIRER, angles, vitesses, spin, roulement) n'a été recalibrée. Le cœur V3.10 est conservé.

## BUGS / LIMITES
- déplacement réglementaire du cercle aux mènes suivantes encore simplifié ;
- restauration d'un objet déplacé par une boule déjà morte non implémentée ;
- visibilité du but considérée vraie sur ce terrain sans obstacle ;
- statistiques tirs réussis/carreaux encore rudimentaires ;
- tests WebGL/gestuels/audio/coin 3D à valider sur ton Mac.

## VERSION À TESTER
Lancer `START.command`.
