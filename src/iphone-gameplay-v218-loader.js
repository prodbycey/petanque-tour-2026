/* Pétanque Tour 2026 V2.18.1 — career-side iPhone gameplay loader */
(function(){
  'use strict';
  const PATCH='/* Pétanque Tour 2026 — V2.18.1 iPhone gameplay patch.\n   Loaded only by the career wrapper. Original validated backup remains untouched. */\n(function(){\n  \'use strict\';\n  const isIPhone=/iPhone|iPod/i.test(navigator.userAgent)||((navigator.maxTouchPoints||0)>1&&/Macintosh/i.test(navigator.userAgent));\n\n  // iPhone rendering: preserve scene and physics, lower GPU cost for steadier frame pacing.\n  try{\n    if(isIPhone){\n      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.28));\n      if(typeof sun!==\'undefined\'&&sun.shadow){\n        sun.shadow.mapSize.set(1024,1024);\n        if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}\n      }\n      gameCanvas.style.touchAction=\'none\';\n      document.documentElement.style.touchAction=\'none\';\n      document.body.style.touchAction=\'none\';\n    }\n  }catch(e){console.warn(\'V2.18 render tuning\',e)}\n\n  // Faster visual simulation on mobile without altering the physical trajectory itself.\n  try{\n    const basePhysicsStep=physicsStep;\n    physicsStep=function(dt){return basePhysicsStep(isIPhone?Math.min(.032,dt*1.18):dt)};\n  }catch(e){console.warn(\'V2.18 physics pacing\',e)}\n\n  // Always make the two teams immediately readable: bright steel vs graphite steel.\n  try{\n    const baseMakeBall=makeBall;\n    const userMat=ballMaterial(false);\n    userMat.color.setHex(0xd8dde4); userMat.roughness=.20; userMat.clearcoat=.26;\n    const oppMat=ballMaterial(true);\n    oppMat.color.setHex(0x20262d); oppMat.roughness=.34; oppMat.clearcoat=.10;\n    makeBall=function(team,role=null){\n      const b=baseMakeBall(team,role);\n      b.mesh.material=(team===\'red\'?oppMat:userMat);\n      return b;\n    };\n  }catch(e){console.warn(\'V2.18 team balls\',e)}\n\n  // No dark interstitial / previous-end overlay between mènes.\n  try{\n    showPreviousMene=function(){ if(previousMeneEl) previousMeneEl.classList.remove(\'visible\'); };\n    startNewMene=function(){\n      showOnlyScreen(null);\n      resetBlueControlQueue();removeTeamBalls();gameState.mene++;\n      gameState.blueRemaining=BALLS_PER_TEAM;gameState.redRemaining=BALLS_PER_TEAM;\n      gameState.blueRoles.pointer=BLUE_ROLE_BALLS.pointer;gameState.blueRoles.shooter=BLUE_ROLE_BALLS.shooter;\n      gameState.lastThrowTeam=null;gameState.resolving=false;gameState.deadJackResolving=false;gameState.ended=false;\n      const starter=gameState.lastMeneWinner||coinWinner||\'blue\';\n      gameState.meneStarter=starter;updateHUD();\n      setMatchState(PetanqueStates.END_SETUP);\n      showToast(`MÈNE ${gameState.mene}`,520);\n      setTimeout(()=>{showOnlyScreen(null);startJackThrow(starter)},420);\n    };\n  }catch(e){console.warn(\'V2.18 mène transition\',e)}\n\n  // Stronger, progressive pointing AI. Local is already competitive; elite becomes very precise.\n  try{\n    rollAIPointOutcome=function(){\n      const s=Math.max(0,Math.min(100,CURRENT_AI_POINT_SKILL));\n      const level=String(CURRENT_AI_LEVEL||\'LOCAL\').toUpperCase();\n      const eliteBoost=level===\'INTERNATIONAL\'?.12:level===\'NATIONAL\'?.08:(level===\'REGIONAL\'||level===\'RÉGIONAL\')?.04:0;\n      const excellent=Math.min(.48,.16+s*.0022+eliteBoost);\n      const good=Math.min(.67,.48+s*.0012+eliteBoost*.45);\n      const miss=Math.max(.008,.055-s*.00035-eliteBoost*.12);\n      const r=Math.random();\n      if(r<excellent)return\'EXCELLENT\';\n      if(r<excellent+good*(1-excellent))return\'GOOD\';\n      if(r>1-miss)return\'MISS\';\n      return\'CORRECT\';\n    };\n\n    const baseAIPlan=makeAIThrowPlan;\n    makeAIThrowPlan=function(team,outcome,profileOverride=null){\n      const plan=baseAIPlan(team,outcome,profileOverride);\n      if(team!==\'red\'||plan.mode!==\'POINTER\'||!jackBody||jackBody.dead)return plan;\n\n      const level=String(CURRENT_AI_LEVEL||\'LOCAL\').toUpperCase();\n      const skill=Math.max(35,Math.min(100,CURRENT_AI_POINT_SKILL));\n      const ranges={\n        LOCAL:[.10,.30],REGIONAL:[.075,.23],\'RÉGIONAL\':[.075,.23],NATIONAL:[.045,.17],INTERNATIONAL:[.025,.12]\n      };\n      const range=ranges[level]||ranges.LOCAL;\n      const skillT=Math.max(0,Math.min(1,(skill-35)/65));\n      let minM=range[0]*(1-.28*skillT),maxM=range[1]*(1-.34*skillT);\n      if(plan.outcome===\'EXCELLENT\'){minM*=.45;maxM*=.55}\n      else if(plan.outcome===\'GOOD\'){minM*=.72;maxM*=.82}\n      else if(plan.outcome===\'CORRECT\'){minM*=1.02;maxM*=1.10}\n      else {minM*=1.55;maxM*=1.85}\n\n      const desiredRadiusM=minM+Math.random()*Math.max(.01,maxM-minM);\n      const ang=Math.random()*Math.PI*2;\n      const desired=jackBody.mesh.position.clone();\n      desired.x+=Math.cos(ang)*desiredRadiusM*WORLD_PER_METER;\n      desired.z+=Math.sin(ang)*desiredRadiusM*WORLD_PER_METER;\n\n      const startPos=new THREE.Vector3(THROW_START.x,0,THROW_START.z);\n      const dir=new THREE.Vector3(desired.x-startPos.x,0,desired.z-startPos.z).normalize();\n      const travelM=Math.max(1,horizontalDist(startPos,desired)/WORLD_PER_METER);\n      let rollCompM=plan.type===\'ROULÉE\'?(1.20+travelM*.070):plan.type===\'PORTÉE\'?(.12+travelM*.018):(.40+travelM*.036);\n      const exp=Math.max(0,Math.min(100,CURRENT_AI_EXPERIENCE))/100;\n      rollCompM*=.94+exp*.08;\n      plan.target=desired.clone().addScaledVector(dir,-rollCompM*WORLD_PER_METER);\n      plan.power=Math.max(58,Math.min(74,plan.power));\n      return plan;\n    };\n  }catch(e){console.warn(\'V2.18 AI pointing\',e)}\n\n  // iPhone aiming aid: keeps the throw under the finger but removes tiny touchscreen noise.\n  // Shooting gets a modest magnetic precision zone only when the swipe already finishes close to the selected boule.\n  try{\n    const baseLaunchBlue=launchBlue;\n    launchBlue=function(powerPct,swipeTarget=null){\n      let target=swipeTarget?swipeTarget.clone():null;\n      if(isIPhone&&target){\n        target.x=Math.round(target.x/.006)*.006;\n        target.z=Math.round(target.z/.008)*.008;\n        if(selectedMode()===\'TIRER\'){\n          const shot=currentShootTarget?.();\n          if(shot&&shot.mesh&&shot.played&&!shot.dead){\n            const d=horizontalDist(target,shot.mesh.position);\n            if(d<.34) target.lerp(shot.mesh.position,.62);\n          }\n        }\n      }\n      return baseLaunchBlue(powerPct,target);\n    };\n  }catch(e){console.warn(\'V2.18 touch precision\',e)}\n\n  // One single centered "PILE OU FACE" button, directly over the game.\n  try{\n    if(coinScreenEl){\n      coinScreenEl.innerHTML=`<button id="simpleCoinToss" class="menuBtn primary" style="min-width:190px;padding:18px 24px;font-size:20px">PILE OU FACE</button><div id="simpleCoinResult" style="min-height:30px;margin-top:15px;font-weight:950;color:#ffd52b"></div>`;\n      coinScreenEl.style.background=\'rgba(4,8,13,.35)\';\n      coinScreenEl.style.backdropFilter=\'blur(2px)\';\n      const btn=document.getElementById(\'simpleCoinToss\');\n      const resultEl=document.getElementById(\'simpleCoinResult\');\n      btn?.addEventListener(\'click\',()=>{\n        if(!matchFSM.is(PetanqueStates.COIN_TOSS))return;\n        btn.disabled=true;resultEl.textContent=\'TIRAGE…\';\n        const playerWins=Math.random()<.5;\n        setTimeout(()=>{\n          audio.clack(.34);\n          coinWinner=playerWins?\'blue\':\'red\';gameState.meneStarter=coinWinner;\n          resultEl.textContent=playerWins?\'TU COMMENCES\':`${CURRENT_AI_NAME.toUpperCase()} COMMENCE`;\n          setMatchState(PetanqueStates.END_SETUP);\n          setTimeout(()=>{showOnlyScreen(null);btn.disabled=false;startJackThrow(coinWinner)},520);\n        },380);\n      });\n    }\n  }catch(e){console.warn(\'V2.18 coin toss\',e)}\n\n  // V2.18.1 — cleaner iPhone HUD: no repeated turn text in the middle.
  try{
    const style=document.createElement('style');
    style.id='pt-v2181-hud';
    style.textContent=`
      #scorebar{
        left:12.5%!important;right:12.5%!important;top:1.35%!important;
        height:6.15%!important;border-radius:20px!important;
      }
      #scorebar .team{
        min-width:0!important;padding:0 10px!important;gap:6px!important;
        font-size:clamp(10px,1.55vh,16px)!important;
      }
      #scorebar .team>span:not(.flag):not(.score){
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;
        max-width:58%!important;
      }
      #scorebar .score{
        min-width:30px!important;text-align:center!important;
        font-size:clamp(23px,3.15vh,32px)!important;line-height:1!important;
        padding:5px 7px!important;border-radius:10px!important;
        background:rgba(0,0,0,.22)!important;
      }
      #scorebar .flag{width:23px!important;height:23px!important;border-width:1px!important}
      #vs{width:10%!important;border-width:2px!important;font-size:clamp(11px,1.8vh,18px)!important}
      #round{top:7.65%!important;left:19%!important;right:19%!important}
      #pointState{
        top:11.15%!important;max-width:76%!important;
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;
        padding:5px 11px!important;font-size:clamp(8px,1.1vh,11px)!important;
        background:rgba(7,10,15,.76)!important;
      }
      #toast{max-width:78%;text-align:center}
    `;
    document.head.appendChild(style);

    const baseShowToast=showToast;
    showToast=function(msg,ms=850){
      const text=String(msg||'');
      const aiName=String(CURRENT_AI_NAME||'').toUpperCase();
      const turnInfo=/BOULE(?:S)?(?:\s|$)/i.test(text) &&
        (/À TOI/i.test(text)||/JOUE/i.test(text)||/TON JOUEUR/i.test(text)||
         (aiName&&text.toUpperCase().includes(aiName)));
      if(turnInfo){
        if(pointStateEl){
          pointStateEl.textContent=text
            .replace(/\s*ÉQUIPE\s*$/i,'')
            .replace(/\s*APRÈS CELLE-CI\s*/i,' · ');
          pointStateEl.classList.remove('bluePoint','redPoint');
          if(gameState.turn==='blue')pointStateEl.classList.add('bluePoint');
          if(gameState.turn==='red')pointStateEl.classList.add('redPoint');
        }
        const toast=document.getElementById('toast');
        if(toast)toast.classList.remove('show');
        return;
      }
      return baseShowToast(msg,ms);
    };
  }catch(e){console.warn('V2.18.1 HUD cleanup',e)}

  document.documentElement.dataset.ptGameplay=\'v2181\';
})();
';
  function install(frame){
    try{
      const doc=frame.contentDocument;
      if(!doc||doc.documentElement?.dataset?.ptGameplay==='v2181')return;
      const s=doc.createElement('script');
      s.textContent=PATCH;
      doc.body.appendChild(s);
    }catch(e){console.warn('PT V2.18 loader',e)}
  }
  function bind(){
    const frame=document.getElementById('matchFrame');
    if(!frame||frame.dataset.v2181Bound)return;
    frame.dataset.v2181Bound='1';
    frame.addEventListener('load',()=>install(frame),true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();
