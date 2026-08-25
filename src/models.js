(function(global){
'use strict';

const DataModels = Object.freeze({
  Player:{
    id:'string',name:'string',country:'string',role:'POINTEUR|MILIEU|TIREUR',
    ranking:'number',stats:'PlayerStats',personality:'PRUDENT|EQUILIBRE|OFFENSIF'
  },
  PlayerStats:{appoint:'0..100',precision:'0..100',tir:'0..100',regularite:'0..100',experience:'0..100'},
  Team:{id:'string',name:'string',players:'playerId[]',affinity:'0..100'},
  Career:{
    id:'string',player:'CareerPlayer',money:'number',ranking:'number',season:'Season',
    team:'playerId[]',affinities:'Affinity[]',inventory:'Inventory',
    economy:'Economy',history:'MatchResult[]'
  },
  Tournament:{
    id:'string',month:'MARS..OCTOBRE',format:'HEAD_TO_HEAD|DOUBLETTE|TRIPLETTE',
    terrainId:'string',requiredRankMax:'number',entryFee:'number',travelCost:'number',
    prizes:'object',rankingPoints:'object'
  },
  TournamentEntry:{tournamentId:'string',paid:'boolean',team:'playerId[]',status:'REGISTERED|ACTIVE|ELIMINATED|WINNER'},
  Ranking:{rank:'number',playerId:'string',points:'number',form:'number'},
  Season:{year:'number',month:'MARS..OCTOBRE',completedTournamentIds:'string[]'},
  Terrain:{id:'string',family:'string',pointing:'object',shooting:'object',ambience:'INDOOR|OUTDOOR'},
  Equipment:{id:'string',brand:'string',role:'string',weightG:'number',price:'number'},
  Inventory:{ownedEquipmentIds:'string[]',equippedBallId:'string|null',equippedJerseyId:'string|null',equippedShoesId:'string|null',cosmetics:'string[]'},
  Economy:{balance:'number',transactions:'Transaction[]'},
  Affinity:{playerA:'string',playerB:'string',value:'0..100'},
  MatchResult:{
    matchId:'string',winner:'blue|red',score:'object',tournamentId:'string|null',
    playerStats:'object',mvp:'string|null',timestamp:'ISO date'
  }
});

global.PetanqueDataModels=DataModels;
})(window);
