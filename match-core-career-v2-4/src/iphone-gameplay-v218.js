/* Pétanque Tour 2026 — V2.18 iPhone gameplay patch.
   Loaded only by the career wrapper. Original validated backup remains untouched. */
(function(){
  'use strict';
  const isIPhone=/iPhone|iPod/i.test(navigator.userAgent)||((navigator.maxTouchPoints||0)>1&&/Macintosh/i.test(navigator.userAgent));

  // iPhone rendering: preserve scene and physics, lower GPU cost for steadier frame pacing.
  try{
    if(isIPhone){
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.28));
      if(typeof sun!=='undefined'&&sun.shadow){
        sun.shadow.mapSize.set(1024,1024);
        if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
      }
      gameCanvas.style.touchAction='none';
      document.documentElement.style.touchAction='none';
      document.body.style.touchAction='none';
    }
  }catch(e){console.warn('V2.18 render tuning',e)}

  // Faster visual simulation on mobile without altering the physical trajectory itself.
  try{
    const basePhysicsStep=physicsStep;
    physicsStep=function(dt){return basePhysicsStep(isIPhone?Math.min(.032,dt*1.18):dt)};
  }catch(e){console.warn('V2.18 physics pacing',e)}

  // Always make the two teams immediately readable: bright steel vs graphite steel.
  try{
    const baseMakeBall=makeBall;
    const userMat=ballMaterial(false);
    userMat.color.setHex(0xd8dde4); userMat.roughness=.20; userMat.clearcoat=.26;
    const oppMat=ballMaterial(true);
    oppMat.color.setHex(0x20262d); oppMat.roughness=.34; oppMat.clearcoat=.10;
    makeBall=function(team,role=null){
      const b=baseMakeBall(team,role);
      b.mesh.material=(team==='red'?oppMat:userMat);
      return b;
    };
  }catch(e){console.warn('V2.18 team balls',e)}

  // No dark interstitial / previous-end overlay between mènes.
  try{
    showPreviousMene=function(){ if(previousMeneEl) previousMeneEl.classList.remove('visible'); };
    startNewMene=function(){
      showOnlyScreen(null);
      resetBlueControlQueue();removeTeamBalls();gameState.mene++;
      gameState.blueRemaining=BALLS_PER_TEAM;gameState.redRemaining=BALLS_PER_TEAM;
      gameState.blueRoles.pointer=BLUE_ROLE_BALLS.pointer;gameState.blueRoles.shooter=BLUE_ROLE_BALLS.shooter;
      gameState.lastThrowTeam=null;gameState.resolving=false;gameState.deadJackResolving=false;gameState.ended=false;
      const starter=gameState.lastMeneWinner||coinWinner||'blue';
      gameState.meneStarter=starter;updateHUD();
      setMatchState(PetanqueStates.END_SETUP);
      showToast(`MÈNE ${gameState.mene}`,520);
      setTimeout(()=>{showOnlyScreen(null);startJackThrow(starter)},420);
    };
  }catch(e){console.warn('V2.18 mène transition',e)}

  // Stronger, progressive pointing AI. Local is already competitive; elite becomes very precise.
  try{
    rollAIPointOutcome=function(){
      const s=Math.max(0,Math.min(100,CURRENT_AI_POINT_SKILL));
      const level=String(CURRENT_AI_LEVEL||'LOCAL').toUpperCase();
      const eliteBoost=level==='INTERNATIONAL'?.12:level==='NATIONAL'?.08:(level==='REGIONAL'||level==='RÉGIONAL')?.04:0;
      const excellent=Math.min(.48,.16+s*.0022+eliteBoost);
      const good=Math.min(.67,.48+s*.0012+eliteBoost*.45);
      const miss=Math.max(.008,.055-s*.00035-eliteBoost*.12);
      const r=Math.random();
      if(r<excellent)return'EXCELLENT';
      if(r<excellent+good*(1-excellent))return'GOOD';
      if(r>1-miss)return'MISS';
      return'CORRECT';
    };

    const baseAIPlan=makeAIThrowPlan;
    makeAIThrowPlan=function(team,outcome,profileOverride=null){
      const plan=baseAIPlan(team,outcome,profileOverride);
      if(team!=='red'||plan.mode!=='POINTER'||!jackBody||jackBody.dead)return plan;

      const level=String(CURRENT_AI_LEVEL||'LOCAL').toUpperCase();
      const skill=Math.max(35,Math.min(100,CURRENT_AI_POINT_SKILL));
      const ranges={
        LOCAL:[.10,.30],REGIONAL:[.075,.23],'RÉGIONAL':[.075,.23],NATIONAL:[.045,.17],INTERNATIONAL:[.025,.12]
      };
      const range=ranges[level]||ranges.LOCAL;
      const skillT=Math.max(0,Math.min(1,(skill-35)/65));
      let minM=range[0]*(1-.28*skillT),maxM=range[1]*(1-.34*skillT);
      if(plan.outcome==='EXCELLENT'){minM*=.45;maxM*=.55}
      else if(plan.outcome==='GOOD'){minM*=.72;maxM*=.82}
      else if(plan.outcome==='CORRECT'){minM*=1.02;maxM*=1.10}
      else {minM*=1.55;maxM*=1.85}

      const desiredRadiusM=minM+Math.random()*Math.max(.01,maxM-minM);
      const ang=Math.random()*Math.PI*2;
      const desired=jackBody.mesh.position.clone();
      desired.x+=Math.cos(ang)*desiredRadiusM*WORLD_PER_METER;
      desired.z+=Math.sin(ang)*desiredRadiusM*WORLD_PER_METER;

      const startPos=new THREE.Vector3(THROW_START.x,0,THROW_START.z);
      const dir=new THREE.Vector3(desired.x-startPos.x,0,desired.z-startPos.z).normalize();
      const travelM=Math.max(1,horizontalDist(startPos,desired)/WORLD_PER_METER);
      let rollCompM=plan.type==='ROULÉE'?(1.20+travelM*.070):plan.type==='PORTÉE'?(.12+travelM*.018):(.40+travelM*.036);
      const exp=Math.max(0,Math.min(100,CURRENT_AI_EXPERIENCE))/100;
      rollCompM*=.94+exp*.08;
      plan.target=desired.clone().addScaledVector(dir,-rollCompM*WORLD_PER_METER);
      plan.power=Math.max(58,Math.min(74,plan.power));
      return plan;
    };
  }catch(e){console.warn('V2.18 AI pointing',e)}

  // iPhone aiming aid: keeps the throw under the finger but removes tiny touchscreen noise.
  // Shooting gets a modest magnetic precision zone only when the swipe already finishes close to the selected boule.
  try{
    const baseLaunchBlue=launchBlue;
    launchBlue=function(powerPct,swipeTarget=null){
      let target=swipeTarget?swipeTarget.clone():null;
      if(isIPhone&&target){
        target.x=Math.round(target.x/.006)*.006;
        target.z=Math.round(target.z/.008)*.008;
        if(selectedMode()==='TIRER'){
          const shot=currentShootTarget?.();
          if(shot&&shot.mesh&&shot.played&&!shot.dead){
            const d=horizontalDist(target,shot.mesh.position);
            if(d<.34) target.lerp(shot.mesh.position,.62);
          }
        }
      }
      return baseLaunchBlue(powerPct,target);
    };
  }catch(e){console.warn('V2.18 touch precision',e)}

  // One single centered "PILE OU FACE" button, directly over the game.
  try{
    if(coinScreenEl){
      coinScreenEl.innerHTML=`<button id="simpleCoinToss" class="menuBtn primary" style="min-width:190px;padding:18px 24px;font-size:20px">PILE OU FACE</button><div id="simpleCoinResult" style="min-height:30px;margin-top:15px;font-weight:950;color:#ffd52b"></div>`;
      coinScreenEl.style.background='rgba(4,8,13,.35)';
      coinScreenEl.style.backdropFilter='blur(2px)';
      const btn=document.getElementById('simpleCoinToss');
      const resultEl=document.getElementById('simpleCoinResult');
      btn?.addEventListener('click',()=>{
        if(!matchFSM.is(PetanqueStates.COIN_TOSS))return;
        btn.disabled=true;resultEl.textContent='TIRAGE…';
        const playerWins=Math.random()<.5;
        setTimeout(()=>{
          audio.clack(.34);
          coinWinner=playerWins?'blue':'red';gameState.meneStarter=coinWinner;
          resultEl.textContent=playerWins?'TU COMMENCES':`${CURRENT_AI_NAME.toUpperCase()} COMMENCE`;
          setMatchState(PetanqueStates.END_SETUP);
          setTimeout(()=>{showOnlyScreen(null);btn.disabled=false;startJackThrow(coinWinner)},520);
        },380);
      });
    }
  }catch(e){console.warn('V2.18 coin toss',e)}

  document.documentElement.dataset.ptGameplay='v218';
})();
