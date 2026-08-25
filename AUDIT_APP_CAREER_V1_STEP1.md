# PÉTANQUE TOUR 2026 — AUDIT APP_CAREER_V1 ÉTAPE 1

## MATCH CORE / PHYSICS — VERROUILLÉS

Source de référence :
`MATCH_CORE_V1_VALIDATED_BACKUP`

Le projet APP_CAREER_V1 contient une copie isolée :
`locked/MATCH_CORE_V1_VALIDATED_BACKUP/`

Vérification SHA-256 :
**11 fichiers sur 11 identiques.**

Aucun fichier de ce répertoire verrouillé n'a été modifié.

Le nouveau shell carrière n'importe PAS les moteurs du Match Core pour les réécrire.
Le match est ouvert depuis sa copie verrouillée dans un iframe.

## AUDIT DES SYSTÈMES EXISTANTS

MATCH CORE :
- `src/match-engine.js`
- `src/rules-engine.js`
- `src/turn-manager.js`
- `src/state-machine.js`

PHYSIQUE / RENDERING :
- présents dans le `index.html` verrouillé du Match Core ;
- non modifiés dans cette mission.

APP / CAREER :
- nouvelle application séparée ;
- navigation et données séparées du jeu jouable.

## ARCHITECTURE CRÉÉE

APP
→ CareerSave / SaveManager
→ DataService
→ Player / Team / Tournament / Terrain / Economy data
→ UI carrière
→ Match Core V1 verrouillé

Fichiers :
- `src/models.js`
- `src/data-service.js`
- `src/save-manager.js`
- `src/app.js`
- `styles/app.css`

Données :
- `data/players.json`
- `data/teams.json`
- `data/tournaments.json`
- `data/terrains.json`
- `data/equipment.json`

## MODÈLES PRINCIPAUX

Créés conceptuellement :
Player, PlayerStats, Team, Career, Tournament, TournamentEntry,
Ranking, Season, Terrain, Equipment, Inventory, Economy, Affinity,
MatchResult.

## DONNÉES JOUEURS

- Top 30 élite : données fournies et validées dans le cahier des charges.
- 6 partenaires locaux modestes au Club des Oliviers.
- population fictive supplémentaire de test pour alimenter Local / Régional / National.
- données non élite marquées comme remplaçables.

## CARRIÈRE / SAVE

Nouvelle carrière :
- classement #2500 ;
- 120 € ;
- Mars 2026 ;
- Club des Oliviers ;
- rôle choisi ;
- boule starter selon rôle ;
- groupe de départ de 3 joueurs.

Sauvegarde :
`localStorage`
clé :
`petanqueTour2026_APP_CAREER_V1`

## ÉCRANS CRÉÉS

- Splash
- Accueil / Continuer / Nouvelle carrière
- Création joueur V1
- Dashboard carrière
- Calendrier Mars → Octobre
- Mon équipe
- Classement : Top mondial / autour de moi
- Fiche tournoi
- Vue Match Core verrouillée

## TEMPORAIRE / ÉTAPE SUIVANTE

Pas encore connecté dans cette étape :
- paiement réel inscription + voyage ;
- génération du tableau 8/16/32 ;
- simulation des autres matchs ;
- retour automatique MatchResult → carrière ;
- gains argent / ranking ;
- recrutement avec acceptation ;
- boutique ;
- entraînement ;
- simulation saison IA.

Le bouton tournoi ouvre déjà le Match Core verrouillé sans le modifier.
