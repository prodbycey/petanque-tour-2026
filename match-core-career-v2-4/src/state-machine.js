(function(global){'use strict';
const S=Object.freeze({MATCH_INTRO:'MATCH_INTRO',COIN_TOSS:'COIN_TOSS',END_SETUP:'END_SETUP',JACK_THROW:'JACK_THROW',JACK_PLACEMENT:'JACK_PLACEMENT',PLAYER_AIMING:'PLAYER_AIMING',BALL_MOVING:'BALL_MOVING',MEASURE:'MEASURE',AI_THINKING:'AI_THINKING',AI_THROWING:'AI_THROWING',END_RESULT:'END_RESULT',MATCH_RESULT:'MATCH_RESULT'});
class FSM{constructor(s=S.MATCH_INTRO){this.state=s}set(s){this.state=s}is(...s){return s.includes(this.state)}}
global.PetanqueStates=S;global.PetanqueStateMachine=FSM;})(window);