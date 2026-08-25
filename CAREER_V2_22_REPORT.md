# PÉTANQUE TOUR 2026 — V2.22 PERFORMANCE FIRST MOBILE

Objectif : gameplay téléphone avant tout.

## GPU / mémoire iPhone
- WebGL DPR limité à 1.0 ;
- textures procédurales plafonnées à 320 px ;
- terrain mobile en Lambert, sans bump/roughness multi-textures ;
- sol extérieur mobile sans texture ;
- 140 cailloux maximum ;
- boules mobiles 28x18 segments ;
- cochonnet mobile 18x12 segments ;
- matériaux acier simplifiés ;
- cube environnement 64 px par face ;
- ombres toujours désactivées sur mobile.

## Décor
- backdrop procédural conservé et rendu plus présent ;
- photo distante toujours désactivée sur mobile ;
- quatre arbres low-poly + mur de fond léger ajoutés pour cadrer clairement le terrain ;
- décor 3D complexe, tribunes et infrastructures lourdes désactivés sur mobile ;
- desktop conserve le décor complet.

## Fluidité
- boucle d'affichage prioritaire pendant les mouvements/lancers ;
- réduction à ~30 FPS seulement quand la scène est totalement inactive ;
- pas de son de roulement calculé sur mobile ;
- délai de stabilisation réduit à 360 ms ;
- physique/règles/collisions conservées.

## Contraste
- exposition mobile encore réduite ;
- terrain brun/minéral et entourage plus sombre.

## Cache
- Match Core chargé avec ?v=222 ;
- app.js chargé avec ?v=222.
