# PÉTANQUE TOUR 2026 — V2.40 — Physics Fix & Premium Visual Rebuild

## Statut de la livraison

Cette version est construite à partir de **V2.32 — Étape 2 Physique Rapier**. Elle conserve le Match Core validé, la carrière et les systèmes existants, et concentre la refonte sur la chaîne de simulation du match, le game feel et la présentation 3D.

## 1. Cause racine du défaut de collision

Le défaut principal n'était pas l'absence de rigid bodies Rapier : les boules possédaient déjà des rigid bodies dynamiques et des colliders sphériques.

La cause se trouvait dans la synchronisation après impact : une boule au repos pouvait être réveillée correctement par Rapier et recevoir une vitesse lors du contact, mais son état applicatif `body.moving` restait `false`. Au sous-pas physique suivant, le code exécutait alors `syncStoppedBodyToPhysics(body)`, remettait sa vitesse à zéro et la rendormait. Le transfert d'énergie réel était donc annulé presque immédiatement par la couche de jeu.

### Correction V2.40

- suppression de la resynchronisation systématique des corps marqués `!body.moving` avant chaque sous-pas ;
- Rapier devient la source de vérité pour une boule réveillée par un contact ;
- si un rigid body est réveillé avec une vitesse linéaire ou angulaire significative, `body.moving` repasse automatiquement à `true` ;
- les repositionnements explicites nécessaires au gameplay (ex. replacement légal du cochonnet) continuent de synchroniser Rapier volontairement ;
- les corps morts/cachés restent parqués proprement ;
- aucun recul artificiel, aucune téléportation et aucune vitesse imposée à la boule touchée n'ont été ajoutés.

## 2. Renforcement Rapier

- Rapier 3D compat **0.19.3** conservé ;
- monde physique interne ×10 conservé ;
- pas fixe **120 Hz** conservé ;
- `maxCcdSubsteps` porté de 4 à **8** ;
- CCD actif sur les corps rapides ;
- événements de collision/contact force activés sur les colliders ;
- `EventQueue` Rapier utilisée pour relier les impacts réels aux sons et aux effets ;
- friction/restitution boule et cochonnet recalibrées sans réintroduire de solveur manuel.

## 3. Banc de test physique V2.40

Fichier : `PHYSICS_V240_BENCH.html`

Le banc est isolé du gameplay et contient les 10 scénarios demandés :

1. tir parfaitement centré ;
2. tir légèrement décentré ;
3. tir rapide ;
4. tir lent ;
5. collision entre trois boules ;
6. boule contre cochonnet ;
7. réveil d'une boule endormie ;
8. collision avec rendu graphique simulé à 15 FPS ;
9. arrêt naturel après impact ;
10. tir haute vitesse / contrôle d'absence de traversée.

Pour chaque scénario, le banc collecte la vitesse avant impact, la vitesse après impact, le pic de vitesse de la cible, la position du contact, l'impulsion estimée depuis la force de contact Rapier, le temps d'arrêt et un ratio d'énergie cinétique.

### Limite de validation dans l'environnement de génération

Le banc et le jeu utilisent toujours les dépendances CDN du projet (`three.js` et `@dimforge/rapier3d-compat`). Le navigateur de validation disponible dans l'environnement de génération ne peut pas résoudre les domaines externes ; la simulation Rapier complète n'a donc pas pu être exécutée jusqu'au rendu ici. Les scripts ont été contrôlés syntaxiquement, les tests Node/statique passent, et le banc est livré pour exécution dans un navigateur connecté.

Cette limite est signalée volontairement : la V2.40 n'est pas déclarée "validée visuellement sur appareil" tant qu'elle n'a pas été jouée dans un navigateur disposant d'un accès réseau.

## 4. Recalibrage des lancers

Les profils sont davantage différenciés :

- **TIR — FER** : trajectoire plus tendue, angle diminuant avec la puissance, restitution acier/acier plus franche ;
- **TIR — DEVANT** : angle plus bas et perte au sol conservée avant la cible ;
- **TIR — ROULÉ** : angle très bas, vitesse sol augmentée, roulage plus agressif ;
- **POINT — ROULÉE** : prise de terrain plus rapide et transition vers le roulement ;
- **POINT — DEMI-PORTÉE** : arc intermédiaire, rebond modéré ;
- **POINT — PORTÉE** : arc plus haut, davantage de freinage après chute.

Les coefficients de roulement et de rotation ont été individualisés par type afin d'éviter que tous les lancers aient la même signature.

## 5. Effets et sound design liés à la physique

L'ancienne détection audio géométrique par proximité a été remplacée pour les impacts par les événements Rapier :

- choc acier/acier déclenché par un vrai contact ;
- intensité audio dérivée de la force/impulsion du contact et de la vitesse relative ;
- contact au sol déclenchant une poussière subtile selon l'énergie verticale ;
- pas de bruit de choc si aucune collision physique n'est détectée ;
- impulsion visuelle caméra très légère sur impact fort ;
- historique interne des impacts disponible pour diagnostic (`window.__PT_LAST_IMPACTS__`).

## 6. Refonte visuelle intermédiaire

Premier changement graphique majeur intégré dans le vrai Match Core :

- suppression des grands backplates photo plats comme décor principal ;
- conservation/renforcement du décor réellement 3D ;
- terrain mobile plus détaillé, avec davantage de gravillons visibles ;
- matériau de sol plus rugueux avec bump/roughness renforcés ;
- boules moins chromées, aspect acier brossé/usé et roughness non uniforme ;
- ajout de bancs de club en géométrie 3D ;
- végétation 3D renforcée ;
- poussière d'impact générée en temps réel.

Cette étape est volontairement une **première reconstruction visible**, pas la fin du travail artistique. Une vraie passe d'assets PBR dédiés (albedo/normal/roughness/AO produits comme assets) reste recommandée pour atteindre la cible commerciale finale.

## 7. Caméra

- FOV réduit et rendu moins "miniature" ;
- position de base remontée à une hauteur visuelle proche d'un joueur debout dans le rond ;
- cible de regard placée plus loin dans la profondeur du terrain ;
- accompagnement doux de la boule en mouvement ;
- retour interpolé à la caméra de préparation ;
- resserrement/vibration extrêmement courts sur impact fort pour renforcer le tir sans cinématique intrusive.

## 8. Systèmes préservés

Aucune reconstruction volontaire de la carrière ou des règles n'a été effectuée. Sont conservés : carrière, tournois, joueurs/stats, score, tours, modes de contrôle, POINTER/TIRER, types de lancer, sauvegarde, progression, raccord carrière-match et logo.

Le dossier `locked/MATCH_CORE_V1_VALIDATED_BACKUP` n'a pas été modifié par cette passe. Une comparaison complète avec le dossier verrouillé contenu dans le ZIP V2.32 source est **identique fichier par fichier** ; les fichiers critiques préalablement hashés sont également identiques bit pour bit.

## 9. Tests exécutés

- `tests/ai-control-mode.test.js` — PASS
- `tests/app-data.test.js` — PASS
- `tests/career-data-step.test.js` — PASS (attente mise à jour de 10 vers 40 tournois)
- `tests/career-engine.test.js` — PASS
- `tests/equipment.test.js` — PASS
- `tests/physics-step2-structural.test.js` — PASS
- `tests/physics-v240-regression.test.js` — PASS
- `tests/progression-training.test.js` — PASS
- `tests/registration-flow.test.js` — PASS
- `match-core-career-v2-4/tests/rules.test.js` — **22/22 PASS**
- syntaxe JavaScript du Match Core — PASS (`node --check`)
- syntaxe JavaScript du banc physique — PASS (`node --check`)

Le détail brut est disponible dans `V2_40_TEST_RESULTS.txt`.

## 10. Fichiers de lancement

- `index.html` : application complète carrière + match ;
- `PETANQUE_TOUR_2026_V2_40.html` : accès direct au Match Core V2.40 ;
- `PHYSICS_V240_BENCH.html` : banc de test Rapier déterministe ;
- `PHYSICS_STEP2_TEST.html` : ancien raccourci de test, repointé vers le cache-bust V2.40.

Les URLs internes ont été passées de `?v=232` à `?v=240` afin d'éviter de rejouer une version mise en cache.

## 11. Ce qui reste à finaliser après le premier playtest V2.40

1. exécuter le banc sur un navigateur connecté et conserver les mesures des 10 scénarios ;
2. tester sur téléphone réel la relation swipe → puissance → distance et ajuster les courbes ;
3. retoucher finement les couples friction/restitution/drag à partir du ressenti réel ;
4. compléter les assets PBR dédiés du terrain et des boules ;
5. enrichir le roulement audio continu et les variations de petits rebonds ;
6. valider les performances 60 FPS sur appareils mobiles cibles ;
7. effectuer une passe dédiée "carreau / recul / contre" après collecte des mesures du banc.

## Conclusion

V2.40 corrige la cause logique qui annulait le transfert d'énergie après un contact Rapier et fait passer les impacts/effets sur la vraie simulation. Elle ajoute simultanément une première passe visible de scène, caméra et matériaux tout en préservant le Match Core et la carrière.

La prochaine décision doit maintenant se faire **en jeu**, en évaluant surtout : tir centré, boule cible chassée, carreau/recul, vitesse de roulement, lisibilité à 6–10 m et confort du swipe.
