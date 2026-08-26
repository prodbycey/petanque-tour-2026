# PÉTANQUE TOUR 2026 — V2.30 FINAL REBASE

Base réelle : V2.23 validée par l’utilisateur.

## Ce qui a été supprimé
- dérives V2.24 à V2.26 ;
- script IA détaché hors du moteur ;
- barre de puissance ;
- panneau de visée décoratif ;
- popups normaux de tour du type « joueur joue / reste X boules » ;
- popups de qualité IA et pourcentage après chaque lancer.

## Gameplay joueur
- `launchBody` strictement identique à la V2.23 validée / V3.10 ;
- swipe = puissance + point d’arrivée ;
- POINTER / TIRER et types de lancer conservés ;
- collisions et règles inchangées.

## IA réellement intégrée
- logique dans le même moteur lexical que `bodies`, `jackBody`, `gameState` ;
- LOCAL : 80 % de tentatives théoriques ciblées dans un rayon <= 22 cm avant erreur physique ;
- REGIONAL / NATIONAL / INTERNATIONAL progressivement plus forts ;
- 72 % de portées, 26 % demi-portées, 2 % roulées au point ;
- freinage spécifique IA simulant une boule bien tenue / rétro ;
- compensation de roulement recalibrée sur les équations exactes V3.10 ;
- cible de secteur libre autour du cochonnet pour éviter quatre boules identiques ;
- tir logique si une boule adverse est très forte ;
- correction adaptative de l’erreur réelle d’un point au suivant.

### Validation physique conservatrice LOCAL (5000 tirs virtuels)
- médiane finale ≈ 17 cm ;
- ≈ 75 % <= 25 cm ;
- ≈ 95 % <= 40 cm ;
- cette estimation ne compte pas la correction adaptative, donc elle est conservatrice.

## Rendu mobile
- caméra équilibrée entre V2.23 trop lointaine et V2.25 trop proche ;
- FOV 55°, position plus haute et légèrement reculée ;
- backplate locale dérivée de la référence visuelle fournie par l’utilisateur, uniquement pour le jardin lointain ;
- piste et objets jouables restent en vraie 3D ;
- vrais arbres 3D texturés sur les côtés au lieu des cônes ;
- bois procédural retravaillé ;
- métal des boules texturé ;
- relief du sol renforcé sans ajouter de grosses textures.

## Verrouillage
- backup MATCH_CORE_V1_VALIDATED_BACKUP inchangé ;
- `launchBody` V2.23 inchangé octet pour octet.
