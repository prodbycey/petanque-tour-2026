# V2.25 — MEDITERRANEAN PRO

## Cause réellement identifiée
La logique d'IA renforcée des versions précédentes était dans un second IIFE.
Elle ne pouvait pas accéder à makeAIThrowPlan, jackBody, bodies, gameState, etc.
Le try/catch masquait l'erreur : l'ancien comportement IA continuait à être utilisé.

V2.25 intègre l'IA directement dans le moteur principal.

## IA adversaire
- pointage compétitif réellement actif ;
- cible finale Local ~3 à 14,5 cm avant pondération stats ;
- Régional ~2 à 10,5 cm ;
- National ~1,2 à 7,5 cm ;
- International ~0,8 à 5 cm ;
- majorité de portées/demi-portées ;
- compensation de roulement réduite (ancienne IA finissait souvent trop courte) ;
- correction adaptative réellement connectée après chaque point terminé ;
- évite les secteurs déjà encombrés autour du cochonnet ;
- décisions de tir selon distance/menace/score ;
- tir plus précis selon niveau.

## Référence visuelle
Les deux photos fournies par l'utilisateur servent de cible :
- boulodrome méditerranéen ;
- oliviers ;
- végétation dense ;
- pots terre cuite ;
- mur pierre/enduit ;
- villa/toiture chaude ;
- bois brun crédible ;
- lumière chaude et naturelle.

## Mobile
- anciens arbres plats du backdrop retirés ;
- backdrop = villa, mur, relief et haie lointaine ;
- végétation principale en 3D ;
- oliviers avec tronc + branches + houppiers texturés ;
- pots et arbustes ;
- banc de jardin ;
- pierre / enduit / terre cuite ;
- texture bois renforcée ;
- acier des boules texturé ;
- caméra plus haute et plus plongeante.

## Verrouillage
- launchBody joueur strictement identique à la V2.24 / gameplay V3.10 ;
- swipe / physique joueur / collisions inchangés ;
- barre de puissance toujours supprimée ;
- backup validé inchangé.
