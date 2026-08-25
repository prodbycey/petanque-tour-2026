(function(global){
'use strict';
class DataService{
  async json(path){
    const r=await fetch(path,{cache:'no-store'});
    if(!r.ok)throw new Error(`${path}: ${r.status}`);
    return await r.json();
  }
  async loadAll(){
    const [players,teams,tournaments,terrains,equipment,clubs]=await Promise.all([
      this.json('./data/players.json'),
      this.json('./data/teams.json'),
      this.json('./data/tournaments.json'),
      this.json('./data/terrains.json'),
      this.json('./data/equipment.json'),
      this.json('./data/clubs.json')
    ]);
    return{players,teams,tournaments,terrains,equipment,clubs};
  }
}
global.PetanqueDataService=DataService;
})(window);
