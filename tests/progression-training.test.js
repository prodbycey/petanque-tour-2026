
global.window=global;
require('../src/career-engine.js');
const assert=require('assert');
const db={
  players:{eliteTop30:[],generatedTestPlayers:[],starterLocalPartners:[]},
  teams:{teams:[]},
  tournaments:{tournaments:[]}
};
const e=new global.PetanqueCareerEngine(db);
const c={
  player:{role:'POINTEUR',stats:{appoint:50,precision:50,tir:10,regularite:30,experience:10},xp:{appoint:0,precision:0,tir:0,regularite:0,experience:0},energy:100,form:70},
  progression:{},palmares:[],trainingHistory:[],activeTournament:null
};
c.player.progression={level:1,totalXP:0,developmentPoints:0,levelsGained:0};
let r=e.train(c,'POINTAGE');
assert.equal(r.ok,true);
assert.equal(c.player.stats.appoint,51);
assert.equal(c.player.energy,75);
assert(c.player.progression.totalXP>0);
for(let i=0;i<8;i++)e.awardPlayerXP(c,40,'TEST');
const ps=e.progressionState(c);
assert(ps.level>1);
assert(c.player.progression.developmentPoints>0);
const before=c.player.stats.tir;
assert.equal(e.spendDevelopmentPoint(c,'tir').ok,true);
assert.equal(c.player.stats.tir,before+1);
console.log('PROGRESSION TRAINING TEST PASS');
