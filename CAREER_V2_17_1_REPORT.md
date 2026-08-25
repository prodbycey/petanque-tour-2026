# PÉTANQUE TOUR 2026 — V2.17.1

Correctif de démarrage uniquement.

Cause trouvée :
- app.js essayait de brancher un clic sur #dashboardPlayerCard ;
- cet élément n'existait pas dans index.html ;
- bind() plantait donc avant la fin de init() ;
- résultat : écran de présentation uniquement, sans accès au jeu.

Corrections :
- ajout de #dashboardPlayerCard sur la carte joueur du tableau de bord ;
- binding rendu défensif avec optional chaining ;
- contrôle automatique : tous les sélecteurs DOM directs de app.js existent dans index.html.

Aucun changement :
- gameplay ;
- Match Core ;
- physique ;
- IA ;
- tournois ;
- ranking ;
- équipement V2.17 ;
- progression / carrière.
