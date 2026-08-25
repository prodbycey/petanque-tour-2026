(function(global){
'use strict';
const STORAGE_KEY='petanqueTour2026_APP_CAREER_V1';

class SaveManager{
  constructor(){
    this.memory={};
    try{
      const k='__pt_storage_test__';
      window.localStorage.setItem(k,'1');
      window.localStorage.removeItem(k);
      this.storage=window.localStorage;
    }catch(e){
      this.storage={
        getItem:(k)=>Object.prototype.hasOwnProperty.call(this.memory,k)?this.memory[k]:null,
        setItem:(k,v)=>{this.memory[k]=String(v)},
        removeItem:(k)=>{delete this.memory[k]}
      };
    }
  }
  hasSave(){return !!this.storage.getItem(STORAGE_KEY)}
  load(){
    try{
      const raw=this.storage.getItem(STORAGE_KEY);
      if(!raw)return null;
      return migrate(JSON.parse(raw));
    }catch(e){return null}
  }
  save(career,reason='MANUAL'){
    career=migrate(career);
    career.meta=career.meta||{};
    career.meta.updatedAt=new Date().toISOString();
    career.meta.lastSaveReason=reason;
    this.storage.setItem(STORAGE_KEY,JSON.stringify(career));
    return career;
  }
  reset(){this.storage.removeItem(STORAGE_KEY)}
  createCareer(form,equipmentId,starterTeam){
    const now=new Date().toISOString();
    const team=[...starterTeam];
    return migrate({
      version:2,
      id:'career-'+Date.now(),
      meta:{createdAt:now,updatedAt:now,lastSaveReason:'NEW_CAREER'},
      player:{
        id:'career-player',
        firstName:form.firstName||'Alex',
        lastName:form.lastName||'Martin',
        sex:form.sex||'HOMME',
        ageVisual:Number(form.ageVisual||28),
        bodyType:form.bodyType||'MOYEN',
        hair:'DEFAULT',beard:'DEFAULT',outfit:'STARTER',
        handedness:form.handedness||'DROITIER',
        role:form.role||'MILIEU',
        portrait:null,
        stats:starterStats(form.role||'MILIEU'),
        xp:{appoint:0,precision:0,tir:0,regularite:0,experience:0},
        progression:{
          level:1,
          totalXP:0,
          developmentPoints:0,
          levelsGained:0
        },
        energy:100,form:70
      },
      club:{id:'club-fr-001',name:'Pétanque Club du Vieux-Port',country:'FR',region:'Provence-Alpes-Côte d’Azur',city:'Marseille'},
      stage:'LOCAL',
      ranking:2500,
      rankingPoints:0,
      money:120,
      season:{year:2026,month:'MARS',completedTournamentIds:[]},
      team,
      roster:[...new Set(team)],
      affinities:{},
      inventory:{ownedEquipmentIds:[equipmentId,'jersey-starter-club','shoes-starter-court'],equippedBallId:equipmentId,equippedJerseyId:'jersey-starter-club',equippedShoesId:'shoes-starter-court',cosmetics:[]},
      economy:{balance:120,transactions:[{type:'START_BUDGET',amount:120,date:now}]},
      tournamentEntries:[],
      activeTournament:null,
      tournamentHistory:[],
      palmares:[],
      trainingHistory:[],
      history:[],
      careerStats:{matches:0,wins:0,losses:0,tournaments:0,titles:0},
      aiWorld:{players:{},teamChanges:[],tournamentsSimulated:0},
      notifications:[]
    });
  }
}
function starterStats(role){
  if(role==='POINTEUR')return{appoint:50,precision:50,tir:10,regularite:30,experience:10};
  if(role==='TIREUR')return{appoint:10,precision:50,tir:50,regularite:30,experience:10};
  return{appoint:30,precision:30,tir:30,regularite:50,experience:10};
}
function migrate(c){
  if(!c)return c;
  c.version=2;
  c.player=c.player||{};
  if(c.player.portrait===undefined)c.player.portrait=null;
  c.player.stats=c.player.stats||starterStats(c.player.role||'MILIEU');
  c.player.xp=c.player.xp||{appoint:0,precision:0,tir:0,regularite:0,experience:0};
  for(const key of ['appoint','precision','tir','regularite','experience']){
    c.player.xp[key]=Number(c.player.xp[key]||0);
    c.player.stats[key]=Math.max(0,Math.min(100,Number(c.player.stats[key]||0)));
  }
  c.player.progression=c.player.progression||{level:1,totalXP:0,developmentPoints:0,levelsGained:0};
  c.player.progression.level=Math.max(1,Number(c.player.progression.level||1));
  c.player.progression.totalXP=Math.max(0,Number(c.player.progression.totalXP||0));
  c.player.progression.developmentPoints=Math.max(0,Number(c.player.progression.developmentPoints||0));
  c.player.progression.levelsGained=Math.max(0,Number(c.player.progression.levelsGained||0));
  c.player.energy=Math.max(0,Math.min(100,Number(c.player.energy??100)));
  c.settings=c.settings||{};
  if(!c.settings.defaultTournamentMode)c.settings.defaultTournamentMode='PLAY';
  c.club=c.club||{id:'club-fr-001',name:'Pétanque Club du Vieux-Port',country:'FR',region:'Provence-Alpes-Côte d’Azur',city:'Marseille'};
  if(!c.club.country)c.club.country='FR';
  if(!c.club.region)c.club.region='Provence-Alpes-Côte d’Azur';
  if(!c.club.city)c.club.city='Marseille';
  c.rankingPoints=Number(c.rankingPoints||0);
  c.roster=Array.isArray(c.roster)?c.roster:[...new Set(c.team||['career-player'])];
  if(!c.roster.includes('career-player'))c.roster.unshift('career-player');
  c.affinities=c.affinities&&typeof c.affinities==='object'&&!Array.isArray(c.affinities)?c.affinities:{};
  c.tournamentEntries=Array.isArray(c.tournamentEntries)?c.tournamentEntries:[];
  c.economy=c.economy||{balance:Number(c.money||120),transactions:[]};
  c.economy.transactions=Array.isArray(c.economy.transactions)?c.economy.transactions:[];
  c.inventory=c.inventory||{ownedEquipmentIds:[],equippedBallId:null,cosmetics:[]};
  c.inventory.ownedEquipmentIds=Array.isArray(c.inventory.ownedEquipmentIds)?c.inventory.ownedEquipmentIds:[];
  const legacyEquipmentMap={
    'starter-obout-point':'starter-azur-point',
    'starter-jb-middle':'starter-riviera-middle',
    'starter-arcenciel-shot':'starter-vektor-shot'
  };
  c.inventory.ownedEquipmentIds=c.inventory.ownedEquipmentIds.map(id=>legacyEquipmentMap[id]||id);
  c.inventory.equippedBallId=legacyEquipmentMap[c.inventory.equippedBallId]||c.inventory.equippedBallId;
  const starterBall=({POINTEUR:'starter-azur-point',MILIEU:'starter-riviera-middle',TIREUR:'starter-vektor-shot'})[c.player.role]||'starter-riviera-middle';
  if(!c.inventory.equippedBallId)c.inventory.equippedBallId=starterBall;
  for(const id of [starterBall,'jersey-starter-club','shoes-starter-court']){
    if(!c.inventory.ownedEquipmentIds.includes(id))c.inventory.ownedEquipmentIds.push(id);
  }
  c.inventory.equippedJerseyId=c.inventory.equippedJerseyId||'jersey-starter-club';
  c.inventory.equippedShoesId=c.inventory.equippedShoesId||'shoes-starter-court';
  c.inventory.cosmetics=Array.isArray(c.inventory.cosmetics)?c.inventory.cosmetics:[];
  c.tournamentHistory=Array.isArray(c.tournamentHistory)?c.tournamentHistory:[];
  c.palmares=Array.isArray(c.palmares)?c.palmares:[];
  c.trainingHistory=Array.isArray(c.trainingHistory)?c.trainingHistory:[];
  c.history=Array.isArray(c.history)?c.history:[];
  c.notifications=Array.isArray(c.notifications)?c.notifications:[];
  c.activeTournament=c.activeTournament||null;
  c.aiWorld=c.aiWorld||{players:{},teamChanges:[],tournamentsSimulated:0};
  c.aiWorld.players=c.aiWorld.players||{};
  c.aiWorld.teamChanges=c.aiWorld.teamChanges||[];
  c.aiWorld.tournamentsSimulated=Number(c.aiWorld.tournamentsSimulated||0);
  c.careerStats=c.careerStats||{matches:0,wins:0,losses:0,tournaments:0,titles:0};
  c.economy.balance=Number(c.economy.balance??c.money??120);
  c.season=c.season||{year:2026,month:'MARS',completedTournamentIds:[]};
  c.season.completedTournamentIds=c.season.completedTournamentIds||[];
  return c;
}
global.PetanqueSaveManager=SaveManager;
})(window);
