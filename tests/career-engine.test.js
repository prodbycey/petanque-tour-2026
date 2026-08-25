const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../src/career-engine.js','utf8'),ctx);
const E=ctx.window.PetanqueCareerEngine;
const db={
 players:{eliteTop30:[],generatedTestPlayers:[],starterLocalPartners:[]},
 teams:{teams:[]},
 tournaments:{tournaments:[
  {id:'a',requiredRankMax:9999},
  {id:'b',requiredRankMax:1000},
  {id:'c',requiredRankMax:50}
 ]}
};
const e=new E(db);
assert.equal(e.rankFromPoints(0),2500);
assert(e.rankFromPoints(700)<=1000);
assert(e.rankFromPoints(2700)<=50);
assert.equal(e.formatTeamSize('HEAD_TO_HEAD'),1);
assert.equal(e.formatTeamSize('DOUBLETTE'),2);
assert.equal(e.formatTeamSize('TRIPLETTE'),3);
assert.deepEqual(e.unlockedTournamentIds(1200),['a']);
assert.deepEqual(e.unlockedTournamentIds(800),['a','b']);
console.log('CAREER ENGINE TESTS PASS');
