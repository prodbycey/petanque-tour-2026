# V2.34 — PHASE 1 : LE TERRAIN INFLUENCE ENFIN LA PHYSIQUE

## Contexte
Suite au QCM de refonte complète, la priorité n°1 validée est : **la sensation physique réaliste**,
avec un terrain qui doit **vraiment influencer le jeu** (stratégie selon le sol), pas juste l'ambiance visuelle.

## Constat (audit du code existant)
Le moteur Rapier (intégré en V2.32) tournait avec **un seul jeu de valeurs physiques fixes**,
identique quel que soit le terrain affiché :
- friction du sol : 0.72 partout
- restitution du sol : 0.055 partout
- résistance au roulement : dépendait uniquement du *type de tir* (roulée, portée, tir au fer...),
  jamais du *type de terrain* (terre compacte, sable, terrain rocheux, terre humide...)

Résultat : le terrain était magnifique visuellement (6 styles procéduraux bien différenciés :
terre compacte, gravier fin, sable dur, rocheux, terre rouge, terre humide) mais **zéro impact réel
sur le jeu**. Une boule se comportait exactement pareil sur du sable dur ou de la terre compacte.

## Changement
Ajout d'un profil physique réel par type de terrain (`PHYSICS_SURFACE_PROFILES`), branché sur
le même identifiant que le rendu visuel (`VISUAL_SURFACE`) — donc aucune donnée de carrière/tournoi
à changer, le lien est automatique.

| Terrain | Frottement | Restitution | Résistance au roulement | Effet en jeu |
|---|---|---|---|---|
| Terre compacte | 0.60 | 0.045 | ×0.72 | Ça roule loin et droit — terrain de pointeurs |
| Gravier fin (référence) | 0.72 | 0.055 | ×1.00 | Comportement historique inchangé |
| Sable dur | 0.94 | 0.020 | ×1.45 | La boule s'arrête vite — favorise la portée haute |
| Rocheux | 0.66 | 0.095 | ×1.18 | Trajectoire moins fiable, petits rebonds |
| Terre rouge | 0.70 | 0.050 | ×0.95 | Proche du compact, un peu plus vive |
| Terre humide | 0.92 | 0.015 | ×1.35 | La boule colle, quasiment pas de rebond |

Ces valeurs s'appliquent :
1. Au collider du sol Rapier (friction/restitution du contact boule-sol).
2. Au calcul de résistance au roulement après contact (module la valeur déjà définie par le type
   de tir, ne la remplace pas — un tir roulé reste un tir roulé, mais son comportement change selon le sol).

## Non modifié
Règles, tours, score, POINTER/TIRER, swipe, types de lancer, carrière, tournois, sauvegarde,
caméra, décor, matériaux des boules (V2.33).

## Conséquence gameplay attendue
- Sur terrain compact/terre rouge (souvent communal/départemental) : les boules roulées vont loin,
  jouer la pétanque "classique" au pointeur est efficace.
- Sur sable dur (certains terrains régionaux) : mieux vaut jouer la portée, la boule roulée s'arrête trop vite.
- Sur terrain rocheux : moins prévisible, le tir au fer devient plus fiable qu'une roulée hasardeuse.
- Sur terre humide : terrain lent et collant, les tirs perdent en portée effective.

C'est la première brique concrète vers une IA qui devra, en Phase 2, choisir son type de tir
*en tenant compte du terrain* — actuellement l'IA existante ne le fait pas encore.

## À tester sur le téléphone
Joue la même mène deux fois sur des venues différentes (ex. terrain communal terreux vs terrain
international sur sable) et compare la distance parcourue par une roulée à puissance égale.
