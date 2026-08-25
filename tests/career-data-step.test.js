const fs=require('fs'),assert=require('assert');
const p=JSON.parse(fs.readFileSync(__dirname+'/../data/players.json','utf8'));
const teams=JSON.parse(fs.readFileSync(__dirname+'/../data/teams.json','utf8'));
const t=JSON.parse(fs.readFileSync(__dirname+'/../data/tournaments.json','utf8'));
assert.equal(p.eliteTop30.length,30);
assert.equal(teams.teams.length,10);
assert.equal(t.tournaments.length,10);
for(const x of p.eliteTop30){
  assert(x.teamId);
  assert(x.teamName);
  assert(Number.isFinite(x.rankingPoints));
}
const months=new Set(t.tournaments.map(x=>x.month));
for(const m of ['MARS','AVRIL','MAI','JUIN','JUILLET','AOÛT','SEPTEMBRE','OCTOBRE']) assert(months.has(m));
console.log('CAREER DATA STEP PASS');
