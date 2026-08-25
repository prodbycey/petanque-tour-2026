const assert=require('assert');
function register(c,t){
  c.tournamentEntries=Array.isArray(c.tournamentEntries)?c.tournamentEntries:[];
  c.economy.transactions=Array.isArray(c.economy.transactions)?c.economy.transactions:[];
  let existing=c.tournamentEntries.find(e=>e.tournamentId===t.id)||null;
  if(existing?.paid)return{ok:true,alreadyPaid:true};
  if(c.economy.balance<t.totalCost)return{ok:false,reason:'FUNDS_INSUFFISANTS'};
  c.economy.balance-=t.totalCost;
  const entry=existing||{tournamentId:t.id,status:'REGISTERED',paid:false,team:[]};
  entry.paid=true;entry.status='REGISTERED';
  if(!existing)c.tournamentEntries.push(entry);
  if(!c.economy.transactions.some(x=>x.type==='TOURNAMENT_COST'&&x.tournamentId===t.id))
    c.economy.transactions.push({type:'TOURNAMENT_COST',tournamentId:t.id,amount:-t.totalCost});
  return{ok:true,alreadyPaid:false};
}
const t={id:'tour',totalCost:15};
const c={economy:{balance:120,transactions:[]},tournamentEntries:[]};
let r=register(c,t);
assert.equal(r.ok,true);
assert.equal(c.economy.balance,105);
assert.equal(c.tournamentEntries[0].status,'REGISTERED');
assert.equal(c.economy.transactions.length,1);
r=register(c,t);
assert.equal(r.alreadyPaid,true);
assert.equal(c.economy.balance,105);
assert.equal(c.economy.transactions.length,1);
const poor={economy:{balance:4,transactions:[]},tournamentEntries:[]};
r=register(poor,t);
assert.equal(r.ok,false);
assert.equal(r.reason,'FUNDS_INSUFFISANTS');
assert.equal(poor.economy.balance,4);
console.log('REGISTRATION FLOW TEST PASS');