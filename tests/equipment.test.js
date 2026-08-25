
global.window=global;
global.careerCardFromSave=(career)=>({overall:45});
require('../src/career-engine.js');
const assert=require('assert');
const db={equipment:require('../data/equipment.json'),players:{eliteTop30:[],generatedTestPlayers:[],starterLocalPartners:[]},teams:{teams:[]},tournaments:{tournaments:[]}};
const e=new global.PetanqueCareerEngine(db);
const c={
  player:{role:'POINTEUR',stats:{appoint:50,precision:50,tir:10,regularite:30,experience:10},xp:{},progression:{level:6,totalXP:2000,developmentPoints:0},form:70,energy:100},
  ranking:1400,team:['career-player'],economy:{balance:1000,transactions:[]},
  inventory:{ownedEquipmentIds:['starter-azur-point','jersey-starter-club','shoes-starter-court'],equippedBallId:'starter-azur-point',equippedJerseyId:'jersey-starter-club',equippedShoesId:'shoes-starter-court'},
  palmares:[],trainingHistory:[]
};
let u=e.equipmentUnlockState(c,e.equipmentItem('azur-precision-p74'));
assert.equal(u.unlocked,true);
let b=e.buyEquipment(c,'azur-precision-p74');
assert.equal(b.ok,true);
assert(c.economy.balance<1000);
let q=e.equipEquipment(c,'azur-precision-p74');
assert.equal(q.ok,true);
assert.equal(c.inventory.equippedBallId,'azur-precision-p74');
assert(e.equipmentSimulationBonus(c)>0);
console.log('EQUIPMENT TEST PASS');
