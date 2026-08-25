(function(global){'use strict';
class RulesEngine{
 constructor(o={}){this.tieTolerance=o.tieTolerance??.004;this.jackInitialMinM=6;this.jackInitialMaxM=10;this.jackMovedMinM=3;this.jackMovedMaxM=20;this.minObstacleM=.50}
 distance2D(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
 isJackThrowValid({distanceM,insidePlay=true,visible=true,obstacleDistanceM=Infinity}){return distanceM>=6&&distanceM<=10&&insidePlay&&visible&&obstacleDistanceM>=.50}
 isBallDead(p,r,l){return p.x+r<l.xMin||p.x-r>l.xMax||p.z+r<l.zMin||p.z-r>l.zMax}
 isJackDead({position,radius,lineBounds,circlePosition,worldPerMeter}){if(this.isBallDead(position,radius,lineBounds))return true;const d=this.distance2D(position,circlePosition)/worldPerMeter;return d<3||d>20}
 getTeamHoldingPoint({balls,jack}){const best={};for(const b of balls){if(!b.played||b.dead||b.valid===false)continue;const d=this.distance2D(b.position,jack);if(best[b.team]===undefined||d<best[b.team])best[b.team]=d}const t=Object.keys(best);if(!t.length)return null;if(t.length===1)return t[0];const[a,b]=t;if(Math.abs(best[a]-best[b])<=this.tieTolerance)return'tie';return best[a]<best[b]?a:b}
 resolveEqualDistance({lastTeam,remaining}){const other=lastTeam==='blue'?'red':'blue';if((remaining[lastTeam]||0)>0)return lastTeam;if((remaining[other]||0)>0)return other;return null}
 getNextTeamToPlay({holdingTeam,lastTeam,remaining}){let next=holdingTeam==='blue'?'red':holdingTeam==='red'?'blue':holdingTeam==='tie'?this.resolveEqualDistance({lastTeam,remaining}):(lastTeam==='blue'?'red':'blue');if(next&&(remaining[next]||0)<=0){const other=next==='blue'?'red':'blue';next=(remaining[other]||0)>0?other:null}return next}
 calculateEndScore({balls,jack}){const team=this.getTeamHoldingPoint({balls,jack});if(!team||team==='tie')return{team:null,points:0};const own=balls.filter(b=>b.team===team&&b.played&&!b.dead&&b.valid!==false).map(b=>this.distance2D(b.position,jack)).sort((a,b)=>a-b);const opp=balls.filter(b=>b.team!==team&&b.played&&!b.dead&&b.valid!==false).map(b=>this.distance2D(b.position,jack)).sort((a,b)=>a-b);const th=opp.length?opp[0]:Infinity;return{team,points:own.filter(d=>d<th).length}}
 handleDeadJack({remaining}){const b=remaining.blue||0,r=remaining.red||0;if(b>0&&r===0)return{team:'blue',points:b,endVoid:false};if(r>0&&b===0)return{team:'red',points:r,endVoid:false};return{team:null,points:0,endVoid:true}}
 checkMatchVictory(scores,target=13){if(scores.blue>=target)return'blue';if(scores.red>=target)return'red';return null}
}
global.PetanqueRulesEngine=RulesEngine;})(window);