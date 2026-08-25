# PÉTANQUE TOUR 2026 — V2.20 DIRECT MOBILE REBUILD

## Architecture
- suppression de l'empilement des loaders/patchs gameplay dans l'iframe ;
- modifications intégrées directement au Match Core carrière ;
- cache-buster `?v=220` ;
- backup Match Core validé inchangé : `bf9989de26ad1dce29377453478009f40bb8040992a7ca1ce39381a3faf4112d`.

## iPhone
- WebGL DPR = 1 ;
- antialias WebGL désactivé sur mobile ;
- ombres temps réel désactivées sur mobile ;
- textures procédurales plafonnées à 512 px ;
- textures architecturales redimensionnées avant création ;
- photo backplate distante désactivée sur mobile ;
- crowd photo désactivée sur mobile ;
- géométrie des boules/cochonnet/terrain allégée sur mobile ;
- rendu desktop complet conservé.

## Gameplay / entrée
- aucune apparition des menus Match Core en carrière ;
- entrée directe au bouton PILE OU FACE ;
- un seul bouton de tirage ;
- écran intermédiaire de mène supprimé ;
- transitions accélérées ;
- IA tactique et pointage compétitif intégrés directement ;
- sons d'ambiance reculés, impact acier mis en avant.

## Graphismes
- terrain plus chaud et beaucoup plus contrasté ;
- décor extérieur plus sombre ;
- éclairage mobile moins surexposé ;
- aucune couche texture supplémentaire ajoutée.

## Interface
- noms d'équipe/joueurs centrés dans leurs cases de score ;
- logo d'accueil de l'application centré en haut ;
- suppression des mentions visibles Match Core / V1 / V2 / pending à l'ouverture.

## Vérifications
- 3 scripts inline validés syntaxiquement ;
- `src/app.js` validé par Node.
