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


  /* -----------------------------------------------------------
     V2.18.1 — CLEAN MOBILE HUD
  ----------------------------------------------------------- */
  try{
    const style=document.createElement('style');
    style.id='pt-v219-mobile-hud';
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
  }catch(e){console.warn('V2.19 HUD',e)}

  /* -----------------------------------------------------------
     V2.19 — MOBILE-FIRST PERFORMANCE
     Desktop is untouched.
  ----------------------------------------------------------- */
  try{
    if(isIPhone){
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.05));
      renderer.shadowMap.enabled=false;

      scene.traverse(obj=>{
        if(obj?.isMesh){
          obj.castShadow=false;
          obj.receiveShadow=false;
        }
        const mats=obj?.material?(Array.isArray(obj.material)?obj.material:[obj.material]):[];
        mats.forEach(mat=>{
          for(const key of ['map','bumpMap','normalMap','roughnessMap']){
            if(mat?.[key]){
              try{mat[key].anisotropy=1;mat[key].needsUpdate=true}catch(e){}
            }
          }
        });
      });

      // Visual geometry only. Physical radius/mass are unchanged.
      const mobileBallGeometry=new THREE.SphereGeometry(.037,40,28);
      if(typeof ballMeshes!=='undefined'){
        ballMeshes.forEach(m=>{if(m)m.geometry=mobileBallGeometry});
      }

      const makeBallBeforeMobile=makeBall;
      makeBall=function(team,role=null){
        const body=makeBallBeforeMobile(team,role);
        if(body?.mesh)body.mesh.geometry=mobileBallGeometry;
        return body;
      };
    }
  }catch(e){console.warn('V2.19 mobile performance',e)}

  /* -----------------------------------------------------------
     V2.19 — AUDIO MIX
     Ambience down, boule/boule impact becomes the main game sound.
  ----------------------------------------------------------- */
  try{
    const makeLoopBeforeMix=audio.makeLoop.bind(audio);
    audio.makeLoop=function(url,volume){
      return makeLoopBeforeMix(url,Math.max(0,volume*.46));
    };
    if(audio.ambienceA)audio.ambienceA.volume*=.46;
    if(audio.ambienceB)audio.ambienceB.volume*=.46;

    let impactCtx=null;
    function syntheticSteelClack(k){
      try{
        const AC=window.AudioContext||window.webkitAudioContext;
        if(!AC)return;
        if(!impactCtx)impactCtx=new AC();
        if(impactCtx.state==='suspended')impactCtx.resume().catch(()=>{});
        const t=impactCtx.currentTime;

        const gain=impactCtx.createGain();
        const band=impactCtx.createBiquadFilter();
        band.type='bandpass';
        band.frequency.value=1450+900*k;
        band.Q.value=1.7;

        const length=Math.max(64,Math.floor(impactCtx.sampleRate*.055));
        const buffer=impactCtx.createBuffer(1,length,impactCtx.sampleRate);
        const d=buffer.getChannelData(0);
        for(let i=0;i<length;i++){
          const env=Math.exp(-i/(length*(.115+.11*k)));
          d[i]=(Math.random()*2-1)*env;
        }
        const noise=impactCtx.createBufferSource();
        noise.buffer=buffer;

        const body=impactCtx.createOscillator();
        const bodyGain=impactCtx.createGain();
        body.type='sine';
        body.frequency.setValueAtTime(360+90*k,t);
        body.frequency.exponentialRampToValueAtTime(220,t+.07);
        bodyGain.gain.setValueAtTime(.0001,t);
        bodyGain.gain.exponentialRampToValueAtTime(.035+.065*k,t+.002);
        bodyGain.gain.exponentialRampToValueAtTime(.0001,t+.085);

        gain.gain.setValueAtTime(.0001,t);
        gain.gain.exponentialRampToValueAtTime(.045+.12*k,t+.001);
        gain.gain.exponentialRampToValueAtTime(.0001,t+.070+.045*k);

        noise.connect(band).connect(gain).connect(impactCtx.destination);
        body.connect(bodyGain).connect(impactCtx.destination);
        noise.start(t);
        body.start(t);
        body.stop(t+.09);
      }catch(e){}
    }

    const clackBeforeMix=audio.clack.bind(audio);
    audio.clack=function(impactSpeed){
      const k=Math.min(1,Math.max(.03,Number(impactSpeed||0)/4.8));
      clackBeforeMix(impactSpeed);

      const pool=this.impactPool||[];
      if(pool.length){
        const used=pool[(this.impactIndex-1+pool.length)%pool.length];
        if(used){
          used.volume=Math.min(.32,.075+.235*k);
          used.playbackRate=1.06-.16*k;
        }
      }
      syntheticSteelClack(k);
    };

    const groundBeforeMix=audio.groundImpact.bind(audio);
    audio.groundImpact=function(strength){
      groundBeforeMix(strength);
      const pool=this.groundPool||[];
      if(pool.length){
        const used=pool[(this.groundIndex-1+pool.length)%pool.length];
        if(used)used.volume=Math.min(.035,used.volume*.72);
      }
    };
  }catch(e){console.warn('V2.19 audio',e)}

  /* -----------------------------------------------------------
     V2.19 — TACTICAL PÉTANQUE AI
     Uses only information visible to a real player:
     score, point holder, distances and remaining boules.
  ----------------------------------------------------------- */
  try{
    const planBeforeTactics=makeAIThrowPlan;

    const bodyDistanceM=body=>{
      if(!body||!jackBody||jackBody.dead)return Infinity;
      return horizontalDist(body.mesh.position,jackBody.mesh.position)/WORLD_PER_METER;
    };

    const liveTeamBalls=team=>bodies.filter(b=>
      b.team===team&&b.played&&!b.dead&&b.countsForPoint!==false
    );

    const sortedTeamDistances=team=>
      liveTeamBalls(team).map(bodyDistanceM).sort((a,b)=>a-b);

    function potentialPoints(team){
      const own=sortedTeamDistances(team);
      const opp=sortedTeamDistances(team==='red'?'blue':'red');
      if(!own.length)return 0;
      const limit=opp.length?opp[0]:Infinity;
      return own.filter(d=>d<limit).length;
    }

    function tacticalMaturity(){
      const level=String(CURRENT_AI_LEVEL||'LOCAL').toUpperCase();
      if(level==='INTERNATIONAL')return .97;
      if(level==='NATIONAL')return .93;
      if(level==='REGIONAL'||level==='RÉGIONAL')return .87;
      return .80;
    }

    function tacticalShotDecision(){
      if(pointOwner()!=='blue')return false;

      const blueBest=closestPlayed('blue');
      if(!blueBest)return false;

      const targetM=bodyDistanceM(blueBest);
      const redBest=closestPlayed('red');
      const redBestM=bodyDistanceM(redBest);
      const redLeft=Math.max(1,gameState.redRemaining);
      const dangerPoints=Math.max(1,potentialPoints('blue'));
      const aiLead=(gameState.redScore||0)-(gameState.blueScore||0);
      const matchThreat=(gameState.blueScore||0)+dangerPoints>=13;

      const shotAbility=Math.max(0,Math.min(1,
        (CURRENT_AI_POWER*.42+
         CURRENT_AI_PRECISION*.26+
         CURRENT_AI_REGULARITE*.18+
         CURRENT_AI_EXPERIENCE*.14)/100
      ));

      let shoot=0,point=0;

      // Leading boule distance.
      if(targetM<=.12)shoot+=4.6;
      else if(targetM<=.22)shoot+=3.4;
      else if(targetM<=.38)shoot+=2.2;
      else if(targetM<=.55)shoot+=1.0;
      else point+=1.5;

      // If several opposing boules are scoring, removing the head boule
      // becomes strategically valuable.
      shoot+=Math.min(3,dangerPoints-1)*.85;

      // Last boule: prefer the safer reprise de point except in real danger.
      if(redLeft<=1){
        point+=1.7;
        if(targetM<.16)shoot+=1.1;
        if(matchThreat)shoot+=2.1;
      }

      // More ammunition = lower tactical cost of a missed shot.
      if(redLeft>=3)shoot+=.65;
      if(redLeft>=4)shoot+=.35;

      // If our closest boule is only slightly too far, reprise de point is
      // usually the intelligent pétanque choice.
      if(isFinite(redBestM)&&redBestM-targetM<.16)point+=1.2;

      if(aiLead>=5)point+=.45;
      if(aiLead<=-4)shoot+=.45;
      if(matchThreat)shoot+=2.8;

      shoot+=(shotAbility-.50)*2.5;

      const logical=shoot>=point;
      return Math.random()<tacticalMaturity()?logical:!logical;
    }

    makeAIThrowPlan=function(team,outcome,profileOverride=null){
      const base=planBeforeTactics(team,outcome,profileOverride);
      if(team!=='red'||!jackBody||jackBody.dead)return base;

      const owner=pointOwner();

      // Opening / holding the point => point, never a meaningless meta-shot.
      if(owner!=='blue'){
        if(base.mode!=='TIRER')return base;

        const level=String(CURRENT_AI_LEVEL||'LOCAL').toUpperCase();
        const ranges={
          LOCAL:[.11,.32],REGIONAL:[.075,.24],'RÉGIONAL':[.075,.24],
          NATIONAL:[.045,.18],INTERNATIONAL:[.025,.13]
        };
        const r=ranges[level]||ranges.LOCAL;
        const radius=r[0]+Math.random()*(r[1]-r[0]);
        const ang=Math.random()*Math.PI*2;
        const desired=jackBody.mesh.position.clone();
        desired.x+=Math.cos(ang)*radius*WORLD_PER_METER;
        desired.z+=Math.sin(ang)*radius*WORLD_PER_METER;

        const start=new THREE.Vector3(THROW_START.x,0,THROW_START.z);
        const dir=new THREE.Vector3(desired.x-start.x,0,desired.z-start.z).normalize();
        const travelM=Math.max(1,horizontalDist(start,desired)/WORLD_PER_METER);
        const type=Math.random()<.30?'PORTÉE':'DEMI-PORTÉE';
        const rollCompM=type==='PORTÉE'?(.12+travelM*.018):(.40+travelM*.036);

        return{
          ...base,mode:'POINTER',type,
          power:Math.max(59,Math.min(72,64+(CURRENT_AI_POINT_SKILL-55)*.035+(Math.random()*2-1)*2.2)),
          target:desired.clone().addScaledVector(dir,-rollCompM*WORLD_PER_METER),
          shouldShoot:false
        };
      }

      if(!tacticalShotDecision()){
        // The V2.18 pointing layer is already tuned from local to elite.
        if(base.mode==='POINTER')return base;

        const level=String(CURRENT_AI_LEVEL||'LOCAL').toUpperCase();
        const ranges={
          LOCAL:[.10,.30],REGIONAL:[.075,.23],'RÉGIONAL':[.075,.23],
          NATIONAL:[.045,.17],INTERNATIONAL:[.025,.12]
        };
        const r=ranges[level]||ranges.LOCAL;
        const radius=r[0]+Math.random()*(r[1]-r[0]);
        const ang=Math.random()*Math.PI*2;
        const desired=jackBody.mesh.position.clone();
        desired.x+=Math.cos(ang)*radius*WORLD_PER_METER;
        desired.z+=Math.sin(ang)*radius*WORLD_PER_METER;

        const start=new THREE.Vector3(THROW_START.x,0,THROW_START.z);
        const dir=new THREE.Vector3(desired.x-start.x,0,desired.z-start.z).normalize();
        const travelM=Math.max(1,horizontalDist(start,desired)/WORLD_PER_METER);
        const type=Math.random()<.28?'PORTÉE':'DEMI-PORTÉE';
        const rollCompM=type==='PORTÉE'?(.12+travelM*.018):(.40+travelM*.036);

        return{
          ...base,mode:'POINTER',type,
          power:Math.max(59,Math.min(73,65+(CURRENT_AI_POINT_SKILL-55)*.032+(Math.random()*2-1)*2.2)),
          target:desired.clone().addScaledVector(dir,-rollCompM*WORLD_PER_METER),
          shouldShoot:false
        };
      }

      const targetBall=closestPlayed('blue');
      if(!targetBall)return base;

      const level=String(CURRENT_AI_LEVEL||'LOCAL').toUpperCase();
      const shotAbility=Math.max(.52,Math.min(.98,
        (CURRENT_AI_POWER*.42+
         CURRENT_AI_PRECISION*.26+
         CURRENT_AI_REGULARITE*.18+
         CURRENT_AI_EXPERIENCE*.14)/100
      ));

      const levelBonus=
        level==='INTERNATIONAL'?.06:
        level==='NATIONAL'?.035:
        (level==='REGIONAL'||level==='RÉGIONAL')?.015:0;

      const confidence=Math.min(.985,shotAbility+levelBonus);
      const errorScale=Math.max(.006,.040-(confidence-.52)*.055);
      const target=targetBall.mesh.position.clone();
      target.x+=(Math.random()*2-1)*errorScale*.72;
      target.z+=(Math.random()*2-1)*errorScale;

      const ferChance=.58+confidence*.30;
      const rr=Math.random();
      const type=rr<ferChance?'FER':rr<ferChance+.14?'DEVANT':'ROULÉ';
      const power=(type==='ROULÉ'?80:92)+(confidence-.70)*6+(Math.random()*2-1)*2.2;

      return{
        ...base,
        mode:'TIRER',
        type,
        power:Math.max(77,Math.min(98,power)),
        target,
        shouldShoot:true,
        outcome:confidence>.83?'GOOD':outcome
      };
    };
  }catch(e){console.warn('V2.19 tactical AI',e)}


  /* -----------------------------------------------------------
     V2.19.2 — IPHONE STABILITY HOTFIX
     No additional canvas texture, no extra terrain meshes.
  ----------------------------------------------------------- */
  try{
    const style=document.createElement('style');
    style.id='pt-v2192-scorebar';
    style.textContent=`
      #scorebar .team{
        display:grid!important;align-items:center!important;gap:7px!important;
        min-width:0!important;padding:0 10px!important;
      }
      #scorebar .team.blue{grid-template-columns:23px minmax(0,1fr) 34px!important}
      #scorebar .team.red{grid-template-columns:34px minmax(0,1fr) 23px!important}
      #scorebar .team>span:not(.flag):not(.score){
        width:100%!important;max-width:100%!important;
        text-align:center!important;justify-self:center!important;
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;
      }
      #scorebar .team .score{
        width:34px!important;min-width:34px!important;margin:0!important;
        justify-self:center!important;text-align:center!important;
      }
      #scorebar .team.red .score{order:0!important}
      #scorebar .team.blue .flag{justify-self:start!important}
      #scorebar .team.red .flag{justify-self:end!important}
    `;
    document.head.appendChild(style);
  }catch(e){console.warn('V2.19.2 HUD centering',e)}

  try{
    // Lightweight terrain contrast using ONLY already-existing materials.
    if(typeof ground!=='undefined'&&ground.material){
      const tint=
        VISUAL_SURFACE==='red-earth'?0xd9a083:
        VISUAL_SURFACE==='wet-earth'?0xb9afa0:
        VISUAL_SURFACE==='rocky'?0xc8b8a4:
        VISUAL_SURFACE==='hard-sand'?0xe1c18b:
        VISUAL_SURFACE==='compact-earth'?0xcbb08e:
        0xcdb391;
      ground.material.color.setHex(tint);
      ground.material.roughness=Math.min(1,(ground.material.roughness||.93)+.025);
      if(ground.material.bumpScale!==undefined)ground.material.bumpScale*=1.12;
      ground.material.needsUpdate=true;
    }

    if(typeof pebbles!=='undefined'&&pebbles.material){
      const pebble=
        VISUAL_SURFACE==='red-earth'?0x6b382d:
        VISUAL_SURFACE==='wet-earth'?0x4d4945:
        VISUAL_SURFACE==='rocky'?0x514d48:
        0x655748;
      pebbles.material.color.setHex(pebble);
      pebbles.material.roughness=.98;
      pebbles.material.needsUpdate=true;
    }

    if(typeof outsideGround!=='undefined'&&outsideGround.material){
      outsideGround.material.color.multiplyScalar(.82);
      outsideGround.material.needsUpdate=true;
    }

    if(typeof detailPlane!=='undefined'&&detailPlane.material){
      detailPlane.material.opacity=.88;
      detailPlane.material.needsUpdate=true;
    }

    // Slightly stronger scene contrast, very cheap for mobile.
    if(typeof renderer!=='undefined'&&isIPhone){
      renderer.toneMappingExposure=.93;
    }
  }catch(e){console.warn('V2.19.2 terrain contrast',e)}

  document.documentElement.dataset.ptGameplay='v2192';
  document.documentElement.dataset.ptV219='1';
  document.documentElement.dataset.ptV2192='1';
})();
