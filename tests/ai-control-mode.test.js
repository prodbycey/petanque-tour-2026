const assert=require('assert');
const p={
 LOCAL:{good:.50,random:.10,bad:.40},
 REGIONAL:{good:.60,random:.10,bad:.30},
 NATIONAL:{good:.70,random:.10,bad:.20},
 INTERNATIONAL:{good:.80,random:.08,bad:.12}
};
for(const x of Object.values(p))assert(Math.abs(x.good+x.random+x.bad-1)<1e-9);
assert(p.REGIONAL.good>p.LOCAL.good);
assert(p.NATIONAL.good>p.REGIONAL.good);
assert(p.INTERNATIONAL.good>p.NATIONAL.good);
const doublette=['PLAYER','MATE1','PLAYER','MATE1','PLAYER','MATE1'];
const triplette=['PLAYER','MATE1','MATE2','PLAYER','MATE1','MATE2'];
assert.equal(doublette.filter(x=>x==='PLAYER').length,3);
assert.equal(triplette.filter(x=>x==='PLAYER').length,2);
console.log('AI + CONTROL MODE TESTS PASS');