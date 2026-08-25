(function(global){'use strict';
class TurnManager{constructor(rules){this.rules=rules;this.current=null;this.lastTeam=null}set(team){this.current=team}noteThrow(team){this.lastTeam=team}resolve({holdingTeam,remaining}){this.current=this.rules.getNextTeamToPlay({holdingTeam,lastTeam:this.lastTeam,remaining});return this.current}}
global.PetanqueTurnManager=TurnManager;})(window);