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
     V2.19.1 — TERRAIN CONTRAST + NAME CENTERING
  ----------------------------------------------------------- */
  try{
    const style2191=document.createElement('style');
    style2191.id='pt-v2191-scorebar';
    style2191.textContent=`
      #scorebar .team{
        display:grid!important;align-items:center!important;gap:8px!important;
        min-width:0!important;padding:0 12px!important;
      }
      #scorebar .team.blue{grid-template-columns:23px minmax(0,1fr) auto!important}
      #scorebar .team.red{grid-template-columns:auto minmax(0,1fr) 23px!important}
      #scorebar .team>span:not(.flag):not(.score){
        width:100%!important;max-width:100%!important;text-align:center!important;
        justify-self:center!important;align-self:center!important;
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;
      }
      #scorebar .team.blue .flag{justify-self:start!important}
      #scorebar .team.red .flag{justify-self:end!important}
      #scorebar .team.blue .score{justify-self:end!important;margin:0!important}
      #scorebar .team.red .score{justify-self:start!important;margin:0!important;order:0!important}
      #scorebar .score{min-width:34px!important;text-align:center!important}
      #playercard .pcopy{display:flex!important;flex-direction:column!important;justify-content:center!important}
      #playercard .pname{text-align:left!important}
    `;
    document.head.appendChild(style2191);
  }catch(e){console.warn('V2.19.1 scorebar',e)}

  try{
    // The terrains were reading too pale on iPhone. Increase local contrast
    // directly on the pétanque surface without altering gameplay/physics.
    if(typeof ground!=='undefined' && ground.material){
      ground.material.color.set(0xead7bf);      // warmer, less white
      ground.material.roughness=Math.min(1,(ground.material.roughness||.92)+.02);
      if(ground.material.map)ground.material.map.needsUpdate=true;
      if(ground.material.bumpMap)ground.material.bumpMap.needsUpdate=true;
      ground.material.needsUpdate=true;
    }
    if(typeof pebbles!=='undefined' && pebbles.material){
      pebbles.material.color.set(0x695847);     // more visible mineral contrast
      pebbles.material.roughness=.96;
      pebbles.material.needsUpdate=true;
    }
    if(typeof outsideGround!=='undefined' && outsideGround.material){
      const col=(VENUE_PROFILE==='urban-park')?0x58624f:
        (VENUE_PROFILE==='countryside')?0x5f6b4a:
        (VENUE_PROFILE==='mountain-alps'||VENUE_PROFILE==='mountain-lake')?0x555d53:0x7a6b5c;
      outsideGround.material.color.set(col);
      outsideGround.material.needsUpdate=true;
    }
    if(typeof detailPlane!=='undefined' && detailPlane.material){
      detailPlane.material.opacity=.92;
      detailPlane.material.needsUpdate=true;
    }

    function makeContrastCourtTexture(seed){
      const c=document.createElement('canvas'); c.width=c.height=1024;
      const x=c.getContext('2d');
      const rand=(function(s){return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}})(seed>>>0);

      // compaction and traffic zones
      for(let i=0;i<34;i++){
        const px=rand()*1024, py=rand()*1024;
        const rx=28+rand()*140, ry=10+rand()*46;
        x.fillStyle=`rgba(45,34,24,${0.040+rand()*0.065})`;
        x.beginPath(); x.ellipse(px,py,rx,ry,rand()*Math.PI,0,Math.PI*2); x.fill();
      }
      // light dusty recoveries for tonal range
      for(let i=0;i<24;i++){
        const px=rand()*1024, py=rand()*1024;
        const rr=26+rand()*72;
        const g=x.createRadialGradient(px,py,1,px,py,rr);
        g.addColorStop(0,`rgba(255,246,222,${0.05+rand()*0.05})`);
        g.addColorStop(1,'rgba(255,246,222,0)');
        x.fillStyle=g; x.fillRect(px-rr,py-rr,rr*2,rr*2);
      }
      // boule traces / drags
      x.strokeStyle='rgba(54,40,29,.12)';
      for(let i=0;i<34;i++){
        x.lineWidth=.8+rand()*2.1;
        const px=rand()*1024, py=rand()*1024, length=16+rand()*58;
        x.beginPath();
        x.moveTo(px,py);
        x.quadraticCurveTo(px+length*.45,py+(rand()-.5)*12,px+length,py+(rand()-.5)*7);
        x.stroke();
      }
      // irregular small mineral specks / dark pebbles
      for(let i=0;i<850;i++){
        const v=50+rand()*85|0;
        x.fillStyle=`rgba(${v},${max(40,v-10)},${max(32,v-18)},${0.16+rand()*0.22})`;
        const s=.6+rand()*2.2;
        x.fillRect(rand()*1024, rand()*1024, s, s);
      }
      // subtle footprint impressions
      for(let i=0;i<32;i++){
        const px=rand()*1024, py=rand()*1024, a=rand()*Math.PI*2;
        x.save(); x.translate(px,py); x.rotate(a);
        x.fillStyle=`rgba(58,45,34,${0.05+rand()*0.05})`;
        x.beginPath(); x.ellipse(0,0,6+rand()*4,14+rand()*5,0,0,Math.PI*2); x.fill();
        x.restore();
      }
      const t=new THREE.CanvasTexture(c);
      t.wrapS=t.wrapT=THREE.RepeatWrapping;
      t.repeat.set(1.4,4.4);
      t.anisotropy=renderer.capabilities.getMaxAnisotropy();
      return t;
      function max(a,b){return a>b?a:b}
    }

    const contrastTex=makeContrastCourtTexture((typeof VENUE_SEED!=='undefined'?VENUE_SEED:1)+9119);
    const contrastPlane=new THREE.Mesh(
      new THREE.PlaneGeometry(2.92,8.45),
      new THREE.MeshBasicMaterial({map:contrastTex,transparent:true,opacity:.45,depthWrite:false,toneMapped:true})
    );
    contrastPlane.rotation.x=-Math.PI/2;
    contrastPlane.position.set(0,.0115,1.75);
    contrastPlane.renderOrder=4;
    scene.add(contrastPlane);

    // Slight tonal reinforcement on the main court only.
    const courtTint=new THREE.Mesh(
      new THREE.PlaneGeometry(2.92,8.45),
      new THREE.MeshBasicMaterial({color:0x7a664d,transparent:true,opacity:.08,depthWrite:false,toneMapped:false})
    );
    courtTint.rotation.x=-Math.PI/2;
    courtTint.position.set(0,.0105,1.75);
    courtTint.renderOrder=3;
    scene.add(courtTint);
  }catch(e){console.warn('V2.19.1 terrain contrast',e)}

  document.documentElement.dataset.ptGameplay='v2191';
  document.documentElement.dataset.ptV219='1';
  document.documentElement.dataset.ptV2191='1';
})();
