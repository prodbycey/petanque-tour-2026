(function(){
'use strict';

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const dataService=new PetanqueDataService();
const saveManager=new PetanqueSaveManager();

let db=null,engine=null,career=null;
let selectedMonth='MARS',rankingMode='TOP',selectedTournamentId=null;
let selectedTournamentTeam=[],matchPoll=null,selectedControlMode='TEAM',selectedTournamentMode='PLAY',equipmentCategory='BALL';

const views=['home','newCareer','dashboard','calendar','team','ranking','recruitment','training','equipment','profile','tournament','teamSelect','bracket','opponent','controlMode','matchCore','roundResult','tournamentResult'];

function showView(name){
  for(const v of views)document.getElementById('view-'+v)?.classList.toggle('active',v===name);
  const careerViews=['dashboard','calendar','team','ranking','recruitment','training','equipment','profile','tournament','teamSelect','bracket','opponent','controlMode','roundResult','tournamentResult'];
  $('#bottomNav')?.classList.toggle('show',careerViews.includes(name));
  $$('#bottomNav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  window.scrollTo(0,0);
}
function fmtMoney(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0)}
function roleLabel(r){return r==='POINTEUR'?'Pointeur':r==='TIREUR'?'Tireur':'Milieu'}
function initials(n){return (n||'?').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()}
function portraitMarkup(p,cls='miniPortrait'){
  if(p?.portrait){
    return `<img class="${cls} photoPortrait" src="${p.portrait}" alt="${p.name||'Joueur'}" referrerpolicy="no-referrer" onerror="this.outerHTML='<span class=&quot;${cls}&quot;>${initials(p?.name||'?')}</span>'">`;
  }
  return `<span class="${cls}">${initials(p?.name||'?')}</span>`;
}
function allPlayers(){return [...db.players.eliteTop30,...db.players.generatedTestPlayers,...db.players.starterLocalPartners]}
function playerById(id){return allPlayers().find(p=>p.id===id)}
function careerCard(){
  const p=career.player,s=p.stats;
  return{id:'career-player',name:`${p.firstName} ${p.lastName}`,country:'FR',flag:'🇫🇷',role:p.role,
    portrait:p.portrait||null,ranking:career.ranking,stats:s,overall:Math.round(Object.values(s).reduce((a,b)=>a+b,0)/5),isCareerPlayer:true};
}
function rosterPlayer(id){return id==='career-player'?careerCard():playerById(id)}
function selectedPlayers(ids){return ids.map(rosterPlayer).filter(Boolean)}
function star(v){return `${Math.max(.5,Math.min(5,Math.round((Number(v||0)/20)*2)/2)).toFixed(1).replace('.0','')}★`}
function tournament(id){return db.tournaments.tournaments.find(t=>t.id===id)}
function terrain(id){return db.terrains.terrains.find(t=>t.id===id)}
function save(reason){career.stage=engine.levelFromRank(career.ranking);career.money=career.economy.balance;saveManager.save(career,reason);renderGlobal()}
function starterBallForRole(role){return({POINTEUR:'starter-azur-point',MILIEU:'starter-riviera-middle',TIREUR:'starter-vektor-shot'})[role]||'starter-riviera-middle'}
function chooseStarterTeam(role){
  const team=['career-player'];
  const wanted=role==='POINTEUR'?['MILIEU','TIREUR']:role==='TIREUR'?['POINTEUR','MILIEU']:['POINTEUR','TIREUR'];
  for(const r of wanted){const p=db.players.starterLocalPartners.find(x=>x.role===r&&!team.includes(x.id));if(p)team.push(p.id)}
  return team;
}
function ensureCareer(){
  if(!career)return;
  engine.ensureAIWorld(career);
  career.ranking=engine.rankFromPoints(career.rankingPoints||0);
  career.stage=engine.levelFromRank(career.ranking);
  career.roster=career.roster||[...career.team];
  if(!career.roster.includes('career-player'))career.roster.unshift('career-player');
  for(const id of db.players.starterLocalPartners.slice(0,4).map(p=>p.id)){
    if(!career.roster.includes(id))career.roster.push(id);
    if(career.affinities[id]===undefined)career.affinities[id]=45;
  }
}
function renderGlobal(){
  if(!career)return;
  $$('.js-rank').forEach(x=>x.textContent=`#${career.ranking}`);
  $$('.js-money').forEach(x=>x.textContent=fmtMoney(career.economy.balance));
  $$('.js-month').forEach(x=>x.textContent=career.season.month);
}
function renderHome(){
  $('#continueBtn').disabled=!saveManager.hasSave();
  $('#continueBtn').classList.toggle('disabled',!saveManager.hasSave());
}
function renderDashboard(){
  ensureCareer();renderGlobal();
  const p=career.player;
  const dashAvatar=$('#dashInitials');
  if(p.portrait){
    dashAvatar.innerHTML=`<img src="${p.portrait}" alt="Mon profil">`;
    dashAvatar.classList.add('hasPhoto');
  }else{
    dashAvatar.textContent=initials(`${p.firstName} ${p.lastName}`);
    dashAvatar.classList.remove('hasPhoto');
  }
  $('#dashName').textContent=`${p.firstName} ${p.lastName}`;
  $('#dashRole').textContent=`${roleLabel(p.role)} · ${p.handedness.toLowerCase()}`;
  $('#dashRank').textContent=`#${career.ranking}`;
  $('#dashPoints').textContent=`${career.rankingPoints} pts`;
  $('#dashMoney').textContent=fmtMoney(career.economy.balance);
  const progress=engine.progressionState(career);
  $('#dashLevel').textContent=`LVL ${progress.level} · ${career.stage}`;
  $('#dashForm').textContent=`${p.form}%`;
  $('#dashClub').textContent=career.club.name;
  $('#dashXpText').textContent=`${progress.xpIntoLevel} / ${progress.xpForNextLevel} XP`;
  $('#dashXpBar').style.width=`${progress.percent}%`;
  $('#dashDevPoints').textContent=`${progress.developmentPoints} pt${progress.developmentPoints>1?'s':''} de progression`;
  $('#dashEnergy').textContent=`${Math.round(p.energy)}%`;
  const equippedBall=engine.equippedItems(career).ball;
  $('#dashEquipment').textContent=equippedBall?`${equippedBall.brand} · ${equippedBall.model}`:'Équipement starter';
  const next=getCalendar().find(x=>x.accessible&&!x.finished);
  if(next){
    $('#nextTournamentName').textContent=next.name;
    $('#nextTournamentMeta').textContent=`${next.month} · ${next.city} · ${next.format.replaceAll('_','-')} · ${fmtMoney(next.totalCost)}`;
    $('#nextTournamentBtn').disabled=false;$('#nextTournamentBtn').dataset.tournament=next.id;
  }else{$('#nextTournamentName').textContent='Aucun tournoi accessible';$('#nextTournamentMeta').textContent='Classement ou budget insuffisant.';$('#nextTournamentBtn').disabled=true}
  $('#objectiveText').textContent=career.ranking>1000?'Objectif : Top 1000 → niveau Régional.'
    :career.ranking>500?'Objectif : Top 500 → accès aux joueurs nationaux.'
    :career.ranking>300?'Objectif : Top 300 → niveau National.'
    :career.ranking>150?'Objectif : Top 150 → très grands joueurs recrutables.'
    :career.ranking>50?'Objectif : Top 50 → niveau International et élite recrutables.'
    :'Objectif : devenir numéro 1 mondial.';
  const active=career.activeTournament;
  $('#activeTournamentCard').style.display=active?'block':'none';
  if(active){
    const t=tournament(active.tournamentId);
    const cp=active.matchCheckpoint;
    $('#activeTournamentName').textContent=t?.name||'Tournoi en cours';
    const resumeBtn=$('#resumeTournament');
    if(cp){
      resumeBtn.textContent=`REPRENDRE LA PARTIE · ${cp.blueScore}—${cp.redScore} · MÈNE ${cp.mene}`;
    }else{
      resumeBtn.textContent='REPRENDRE';
    }
    resumeBtn.onclick=()=>resumeTournament();
  }
}
function getCalendar(){
  const done=new Set(career.season.completedTournamentIds||[]);
  return db.tournaments.tournaments.map(t=>{
    const registration=getTournamentRegistration(t.id);
    const registered=!!registration?.paid;
    return {...t,
      finished:done.has(t.id),
      registration,
      registered,
      rankOk:career.ranking<=t.requiredRankMax,
      moneyOk:career.economy.balance>=t.totalCost,
      accessible:career.ranking<=t.requiredRankMax&&(registered||career.economy.balance>=t.totalCost)
    };
  });
}
function clubCountries(){
  return db.clubs?.countries||[];
}
function clubsForCountry(code){
  return (db.clubs?.clubs||[]).filter(c=>c.country===code);
}
function clubRegions(code){
  return [...new Set(clubsForCountry(code).map(c=>c.region))].sort((a,b)=>a.localeCompare(b,'fr'));
}
function clubsForRegion(code,region){
  return clubsForCountry(code).filter(c=>c.region===region).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
}
function clubById(id){
  return (db.clubs?.clubs||[]).find(c=>c.id===id);
}
function updateClubPreview(){
  const selected=clubById($('#profileClub').value);
  if(!selected)return;
  const country=clubCountries().find(c=>c.code===selected.country);
  $('#profileClubPreview').innerHTML=`<b>${country?.flag||''} ${selected.name}</b><span>${selected.city} · ${selected.region}</span>`;
}
function renderClubSelectors(preferredClub=career.club){
  const countries=clubCountries();
  const countrySel=$('#profileClubCountry'),regionSel=$('#profileClubRegion'),clubSel=$('#profileClub');

  countrySel.innerHTML=countries.map(c=>`<option value="${c.code}">${c.flag} ${c.name}</option>`).join('');
  countrySel.value=countries.some(c=>c.code===preferredClub?.country)?preferredClub.country:'FR';

  const regions=clubRegions(countrySel.value);
  const targetRegion=regions.includes(preferredClub?.region)?preferredClub.region:regions[0];
  regionSel.innerHTML=regions.map(r=>`<option value="${r}">${r}</option>`).join('');
  regionSel.value=targetRegion||'';

  const rows=clubsForRegion(countrySel.value,regionSel.value);
  clubSel.innerHTML=rows.map(c=>`<option value="${c.id}">${c.name} · ${c.city}</option>`).join('');
  if(rows.some(c=>c.id===preferredClub?.id))clubSel.value=preferredClub.id;
  else if(rows[0])clubSel.value=rows[0].id;

  updateClubPreview();
}
function refreshClubRegions(){
  const regions=clubRegions($('#profileClubCountry').value);
  $('#profileClubRegion').innerHTML=regions.map(r=>`<option value="${r}">${r}</option>`).join('');
  $('#profileClubRegion').value=regions[0]||'';
  refreshClubList();
}
function refreshClubList(){
  const rows=clubsForRegion($('#profileClubCountry').value,$('#profileClubRegion').value);
  $('#profileClub').innerHTML=rows.map(c=>`<option value="${c.id}">${c.name} · ${c.city}</option>`).join('');
  if(rows[0])$('#profileClub').value=rows[0].id;
  updateClubPreview();
}

function equipmentList(){
  return db.equipment?.equipment||[];
}
function equipmentLabel(cat){
  return({BALL:'BOULES',JERSEY:'MAILLOTS',SHOES:'CHAUSSURES'})[cat]||cat;
}
function equipmentOwned(id){
  return career.inventory?.ownedEquipmentIds?.includes(id);
}
function isEquippedEquipment(item){
  if(item.category==='BALL')return career.inventory?.equippedBallId===item.id;
  if(item.category==='JERSEY')return career.inventory?.equippedJerseyId===item.id;
  if(item.category==='SHOES')return career.inventory?.equippedShoesId===item.id;
  return false;
}
function equipmentBallVisual(item){
  const roleClass=item.role==='POINTEUR'?'point':item.role==='TIREUR'?'shoot':'middle';
  return `<div class="equipmentBallVisual ${roleClass}">
    <i></i><i></i><i></i>
  </div>`;
}
function equipmentCardVisual(item){
  if(item.category==='BALL')return equipmentBallVisual(item);
  if(item.category==='JERSEY')return `<div class="jerseyVisual"><span></span><b>${item.color||''}</b></div>`;
  return `<div class="shoeVisual"><span>◒</span><b>${item.color||''}</b></div>`;
}
function renderEquipment(){
  ensureCareer();renderGlobal();
  const progress=engine.progressionState(career);
  const equipped=engine.equippedItems(career);

  $('#equipmentLevel').textContent=`LVL ${progress.level}`;
  $('#equipmentRank').textContent=`#${career.ranking}`;
  $('#equipmentMoney').textContent=fmtMoney(career.economy.balance);

  $('#equipmentCurrent').innerHTML=`
    <div class="equippedMain">
      ${equipped.ball?equipmentCardVisual(equipped.ball):''}
      <div><span>BOULE ÉQUIPÉE</span><b>${equipped.ball?`${equipped.ball.brand} · ${equipped.ball.model}`:'Aucune'}</b>
      <small>${equipped.ball?`${equipped.ball.weightG} g · Ø ${equipped.ball.diameterMM} mm · ${equipped.ball.hardness}`:''}</small></div>
    </div>
    <div class="equippedCosmetics">
      <div><span>MAILLOT</span><b>${equipped.jersey?.model||'Starter'}</b></div>
      <div><span>CHAUSSURES</span><b>${equipped.shoes?.model||'Starter'}</b></div>
    </div>`;

  $$('#equipmentTabs [data-equipment-category]').forEach(btn=>{
    btn.classList.toggle('selected',btn.dataset.equipmentCategory===equipmentCategory);
  });

  const rows=equipmentList().filter(x=>x.category===equipmentCategory);
  $('#equipmentList').innerHTML=rows.map(item=>{
    const owned=equipmentOwned(item.id),equippedNow=isEquippedEquipment(item);
    const unlock=engine.equipmentUnlockState(career,item);
    const bonusEntries=Object.entries(item.bonuses||{}).filter(([,v])=>Number(v)>0);
    const bonuses=bonusEntries.length?bonusEntries.map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(' · '):'COSMÉTIQUE / STANDARD';
    let action='';

    if(equippedNow){
      action='<button class="equipmentAction equipped" disabled>ÉQUIPÉ</button>';
    }else if(owned){
      action=`<button class="equipmentAction" data-equip-id="${item.id}">ÉQUIPER</button>`;
    }else if(!unlock.unlocked){
      const requirements=[];
      if(!unlock.levelOK)requirements.push(`LVL ${unlock.requiredLevel}`);
      if(!unlock.rankOK)requirements.push(`TOP ${unlock.requiredRankMax}`);
      action=`<button class="equipmentAction locked" disabled>🔒 ${requirements.join(' · ')}</button>`;
    }else{
      action=`<button class="equipmentAction buy" data-buy-id="${item.id}">${item.price===0?'DÉBLOQUER':`ACHETER · ${item.price} €`}</button>`;
    }

    const specs=item.category==='BALL'
      ? `${item.role} · ${item.weightG} g · Ø ${item.diameterMM} mm · ${item.hardness}`
      : `${item.color||''}`;

    return `<article class="equipmentCard ${owned?'owned':''} ${equippedNow?'active':''}">
      ${equipmentCardVisual(item)}
      <div class="equipmentInfo">
        <div class="equipmentBrand">${item.brand}</div>
        <h3>${item.model}</h3>
        <p>${item.description||''}</p>
        <div class="equipmentSpecs">${specs}</div>
        <div class="equipmentBonuses">${bonuses}</div>
      </div>
      <div class="equipmentSide">
        ${item.price?`<span>${item.price} €</span>`:'<span>STARTER</span>'}
        ${action}
      </div>
    </article>`;
  }).join('');

  $('#equipmentFeedback').textContent='';
  $('#equipmentFeedback').className='profileFeedback';
}
function buyEquipment(id){
  const r=engine.buyEquipment(career,id);
  if(!r.ok){
    $('#equipmentFeedback').textContent=r.reason==='MONEY'?'FONDS INSUFFISANTS':r.reason==='LOCKED'?'ÉQUIPEMENT ENCORE VERROUILLÉ':'ACHAT IMPOSSIBLE';
    $('#equipmentFeedback').className='profileFeedback error';
    return;
  }
  save('EQUIPMENT_PURCHASE');
  $('#equipmentFeedback').textContent=`${r.item.brand.toUpperCase()} ${r.item.model.toUpperCase()} ACHETÉ`;
  $('#equipmentFeedback').className='profileFeedback success';
  renderEquipment();
}
function equipEquipment(id){
  const r=engine.equipEquipment(career,id);
  if(!r.ok)return;
  save('EQUIPMENT_EQUIPPED');
  renderEquipment();
  $('#equipmentFeedback').textContent=`${r.item.model.toUpperCase()} ÉQUIPÉ`;
  $('#equipmentFeedback').className='profileFeedback success';
}

function renderProfile(){
  ensureCareer();renderGlobal();
  const p=career.player;
  $('#profileFirstName').value=p.firstName||'';
  $('#profileLastName').value=p.lastName||'';
  $('#profileRole').textContent=roleLabel(p.role);
  $('#profileHand').textContent=p.handedness||'DROITIER';
  $('#profileRank').textContent=`#${career.ranking}`;
  $('#profileLevel').textContent=career.stage;
  renderClubSelectors(career.club);

  const preview=$('#profilePhotoPreview');
  if(p.portrait){
    preview.innerHTML=`<img src="${p.portrait}" alt="Photo de profil">`;
    preview.classList.add('hasPhoto');
  }else{
    preview.textContent=initials(`${p.firstName||''} ${p.lastName||''}`);
    preview.classList.remove('hasPhoto');
  }

  const progress=engine.progressionState(career);
  $('#profilePlayerLevel').textContent=`NIVEAU ${progress.level}`;
  $('#profileXpText').textContent=`${progress.xpIntoLevel} / ${progress.xpForNextLevel} XP`;
  $('#profileXpBar').style.width=`${progress.percent}%`;
  $('#profileDevPoints').textContent=`${progress.developmentPoints}`;
  $('#profileEnergy').textContent=`${Math.round(p.energy)}%`;

  const statLabels={
    appoint:'APPOINT',precision:'PRÉCISION',tir:'TIR',regularite:'RÉGULARITÉ',experience:'EXPÉRIENCE'
  };
  $('#profileStats').innerHTML=Object.entries(statLabels).map(([key,label])=>{
    const value=Number(p.stats[key]||0),statXp=Math.round(Number(p.xp?.[key]||0));
    const can=progress.developmentPoints>0&&value<100;
    return `<div class="developmentRow">
      <div class="developmentStat"><span>${label}</span><strong>${value}</strong><small>${star(value)} · ${statXp}/100 XP STAT</small></div>
      <div class="developmentMeter"><i style="width:${Math.min(100,statXp)}%"></i></div>
      <button class="statPlus ${can?'':'disabled'}" data-upgrade-stat="${key}" ${can?'':'disabled'}>+1</button>
    </div>`;
  }).join('');

  $('#profileCareerStats').innerHTML=`
    <div><span>MATCHS</span><b>${career.careerStats.matches}</b></div>
    <div><span>VICTOIRES</span><b>${career.careerStats.wins}</b></div>
    <div><span>TOURNOIS</span><b>${career.careerStats.tournaments}</b></div>
    <div><span>TITRES</span><b>${career.careerStats.titles}</b></div>`;

  const titles=career.palmares||[];
  $('#profilePalmares').innerHTML=titles.length?titles.map(x=>{
    const tour=tournament(x.tournamentId);
    const teamNames=(x.team||[]).map(id=>rosterPlayer(id)?.name||playerById(id)?.name).filter(Boolean);
    return `<article class="palmaresCard">
      <div><b>🏆 ${x.name||tour?.name||'Tournoi remporté'}</b><span>${x.city||tour?.city||''} · ${x.year||2026}</span></div>
      <small>${(x.format||tour?.format||'').replaceAll('_','-')} · ${x.level||tour?.level||''}${teamNames.length?` · ${teamNames.join(' / ')}`:''}</small>
    </article>`;
  }).join(''):'<div class="emptyState">Ton premier trophée apparaîtra ici.</div>';
}

function saveProfile(){
  const first=$('#profileFirstName').value.trim();
  const last=$('#profileLastName').value.trim();
  if(!first||!last){
    $('#profileFeedback').textContent='PRÉNOM ET NOM OBLIGATOIRES';
    $('#profileFeedback').className='profileFeedback error';
    return;
  }
  career.player.firstName=first;
  career.player.lastName=last;

  const selectedClub=clubById($('#profileClub').value);
  if(selectedClub){
    career.club={
      id:selectedClub.id,
      name:selectedClub.name,
      country:selectedClub.country,
      region:selectedClub.region,
      city:selectedClub.city
    };
  }

  save('PROFILE_UPDATED');
  $('#profileFeedback').textContent='PROFIL ENREGISTRÉ';
  $('#profileFeedback').className='profileFeedback success';
  renderProfile();
}

function loadProfileImage(file){
  if(!file)return;
  if(!file.type.startsWith('image/')){
    $('#profileFeedback').textContent='FICHIER IMAGE UNIQUEMENT';
    $('#profileFeedback').className='profileFeedback error';
    return;
  }
  if(file.size>3_000_000){
    $('#profileFeedback').textContent='IMAGE TROP LOURDE · MAX 3 MO';
    $('#profileFeedback').className='profileFeedback error';
    return;
  }
  const reader=new FileReader();
  reader.onload=()=>{
    career.player.portrait=reader.result;
    save('PROFILE_PHOTO_UPDATED');
    $('#profileFeedback').textContent='PHOTO ENREGISTRÉE';
    $('#profileFeedback').className='profileFeedback success';
    renderProfile();
  };
  reader.readAsDataURL(file);
}

function renderTraining(){
  ensureCareer();renderGlobal();
  const p=career.player,progress=engine.progressionState(career);
  $('#trainingEnergy').textContent=`${Math.round(p.energy)}%`;
  $('#trainingEnergyBar').style.width=`${Math.round(p.energy)}%`;
  $('#trainingLevel').textContent=`LVL ${progress.level}`;
  $('#trainingXp').textContent=`${progress.xpIntoLevel}/${progress.xpForNextLevel} XP`;

  const blocked=!!career.activeTournament;
  $('#trainingNotice').textContent=blocked
    ? 'Entraînement indisponible pendant un tournoi en cours.'
    : p.energy<25
      ? 'Énergie trop basse pour une nouvelle séance. Joue des matchs pour récupérer.'
      : 'Chaque séance coûte 25% d’énergie et améliore réellement ton joueur.';

  $('#trainingCards').innerHTML=engine.trainingCatalog().map(s=>{
    const disabled=blocked||p.energy<s.energy;
    const primaryLabel={appoint:'Appoint',tir:'Tir',regularite:'Régularité'}[s.primary]||s.primary;
    const secondaryLabel={precision:'Précision',experience:'Expérience'}[s.secondary]||s.secondary;
    return `<article class="trainingCard ${disabled?'locked':''}">
      <div class="trainingIcon">${s.icon}</div>
      <div class="grow"><h3>${s.name}</h3><p>${s.description}</p>
      <small>+1 ${primaryLabel} · XP ${secondaryLabel} · +${s.xp} XP joueur</small></div>
      <button class="btn primary" data-training="${s.id}" ${disabled?'disabled':''}>S’ENTRAÎNER</button>
    </article>`;
  }).join('');

  const hist=career.trainingHistory||[];
  $('#trainingHistory').innerHTML=hist.length?hist.slice(0,8).map(h=>`
    <div class="trainingHistoryRow"><span>${h.name}</span><b>+${h.primaryGain||0} ${h.primary?.toUpperCase()||''} · +${h.xpGain} XP</b></div>
  `).join(''):'<div class="emptyState">Aucune séance effectuée pour le moment.</div>';
}

function runTraining(type){
  const result=engine.train(career,type);
  if(!result.ok){
    $('#trainingFeedback').textContent=result.reason==='ACTIVE_TOURNAMENT'
      ?'TERMINE D’ABORD TON TOURNOI'
      :result.reason==='ENERGY'?'ÉNERGIE INSUFFISANTE':'SÉANCE IMPOSSIBLE';
    $('#trainingFeedback').className='profileFeedback error';
    return;
  }

  save('TRAINING_COMPLETED');
  const levelText=result.xp.levelGain?` · NIVEAU +${result.xp.levelGain}`:'';
  $('#trainingFeedback').textContent=`${result.session.name.toUpperCase()} TERMINÉ · +1 ${result.session.primary.toUpperCase()} · +${result.xp.amount} XP${levelText}`;
  $('#trainingFeedback').className='profileFeedback success';
  renderTraining();
}

function spendStatPoint(stat){
  const r=engine.spendDevelopmentPoint(career,stat);
  if(!r.ok)return;
  save('DEVELOPMENT_POINT_SPENT');
  renderProfile();
}

function renderCalendar(){
  ensureCareer();renderGlobal();
  $('#monthTabs').innerHTML=db.tournaments.seasonMonths.map(m=>`<button class="${m===selectedMonth?'active':''}" data-month="${m}">${m.slice(0,3)}</button>`).join('');
  $('#monthTabs').onclick=e=>{const b=e.target.closest('[data-month]');if(b){selectedMonth=b.dataset.month;renderCalendar()}};
  const list=getCalendar().filter(t=>t.month===selectedMonth);
  $('#calendarList').innerHTML=list.map(t=>{
    const state=t.finished?'TERMINÉ':career.activeTournament?.tournamentId===t.id?'EN COURS':t.registered?'INSCRIT':t.accessible?'ACCESSIBLE':!t.rankOk?'RANKING REQUIS':'FONDS INSUFFISANTS';
    return `<button class="eventCard ${t.finished?'done':t.accessible?'open':'locked'}" data-tournament="${t.id}">
      <div class="eventStatus">${state}</div><div class="eventTop"><strong>${t.name}</strong><span>${t.day} ${t.month}</span></div>
      <div class="eventMeta">${t.city} · ${t.level} · ${t.format.replaceAll('_','-')} · ${t.teamCount} équipes</div>
      <div class="eventNumbers"><span>INSCR.<b>${fmtMoney(t.entryFee)}</b></span><span>VOYAGE<b>${fmtMoney(t.travelCost)}</b></span><span>TOTAL<b>${fmtMoney(t.totalCost)}</b></span><span>GAIN<b>${fmtMoney(t.prizes.winner)}</b></span><span>RANKING<b>+${t.rankingPoints.winner}</b></span></div>
    </button>`;
  }).join('')||'<div class="emptyState">Aucun tournoi ce mois-ci.</div>';
  $$('#calendarList [data-tournament]').forEach(b=>b.onclick=()=>openTournament(b.dataset.tournament));
}
function playerCardHtml(p,compact=false){
  return `<article class="playerCard ${compact?'compact':''}">
    <div class="playerIdentity">${portraitMarkup(p,'portrait')}<div><div class="playerCountry">${p.flag||''} ${p.country||''}</div><h3>${p.name}</h3><div class="rolePill">${roleLabel(p.role)}</div></div><div class="overall">${p.overall}<small>GEN</small></div></div>
    <div class="statGrid"><span>APPOINT<b>${star(p.stats.appoint)}</b></span><span>PRÉCISION<b>${star(p.stats.precision)}</b></span><span>TIR<b>${star(p.stats.tir)}</b></span><span>RÉGULARITÉ<b>${star(p.stats.regularite)}</b></span><span>EXPÉRIENCE<b>${star(p.stats.experience)}</b></span></div>
  </article>`;
}
function renderTeam(){
  ensureCareer();renderGlobal();
  $('#currentTeamCards').innerHTML=selectedPlayers(career.team).map(p=>playerCardHtml(p,true)).join('');
  $('#rosterList').innerHTML=selectedPlayers(career.roster).map(p=>{
    const active=career.team.includes(p.id);
    return `<button class="rosterRow ${active?'active':''}" data-roster="${p.id}">${portraitMarkup(p,'miniPortrait')}<span class="grow"><b>${p.name}</b><small>${p.flag||'🇫🇷'} ${roleLabel(p.role)} · GEN ${p.overall}</small></span><strong>${active?'ÉQUIPE':'ROSTER'}</strong></button>`;
  }).join('');
  $('#circuitTeams').innerHTML=db.teams.teams.map(t=>{
    const members=t.players.map(playerById).filter(Boolean);
    const stars=Math.max(1,Math.min(5,Math.round(t.affinity/20)));
    return `<button class="circuitTeamCard" data-team="${t.id}"><div><strong>${t.name}</strong><span>${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</span></div><small>${members.map(p=>p.name).join(' · ')}</small></button>`;
  }).join('');
  $$('#circuitTeams [data-team]').forEach(b=>b.onclick=()=>{const t=db.teams.teams.find(x=>x.id===b.dataset.team);alert(`${t.name}\nAffinité : ${Math.round(t.affinity/20)}★\n${t.players.map(id=>playerById(id)?.name).join('\n')}`)});
}
function dynamicElite(){
  engine.ensureAIWorld(career);
  return db.players.eliteTop30.map(p=>({...p,
    dynamicRank:career.aiWorld.players[p.id]?.dynamicRank||p.ranking,
    rankingPoints:career.aiWorld.players[p.id]?.rankingPoints||p.rankingPoints,
    form:career.aiWorld.players[p.id]?.form||p.form,
    teamName:p.teamName
  })).sort((a,b)=>a.dynamicRank-b.dynamicRank);
}
function renderRanking(){
  ensureCareer();engine.refreshEliteRanks(career);renderGlobal();
  $('#rankingTabs').innerHTML=`<button data-mode="TOP" class="${rankingMode==='TOP'?'active':''}">TOP 30</button><button data-mode="AROUND" class="${rankingMode==='AROUND'?'active':''}">AUTOUR DE MOI</button>`;
  $('#rankingTabs').onclick=e=>{const b=e.target.closest('[data-mode]');if(b){rankingMode=b.dataset.mode;renderRanking()}};
  let rows;
  if(rankingMode==='TOP')rows=dynamicElite().map(p=>({...p,ranking:p.dynamicRank}));
  else{
    const me={...careerCard(),ranking:career.ranking,rankingPoints:career.rankingPoints,teamName:career.club.name,isCareerPlayer:true};
    rows=db.players.generatedTestPlayers.filter(p=>Math.abs(p.ranking-career.ranking)<120).slice(0,12).map(p=>({...p,rankingPoints:Math.max(10,2800-p.ranking),teamName:'Circuit régional'}));
    rows=[...rows,me].sort((a,b)=>a.ranking-b.ranking);
  }
  $('#rankingTable').innerHTML=`<div class="rankingHeader"><span>RANG</span><span>JOUEUR</span><span>PAYS</span><span>RÔLE</span><span>POINTS</span><span>ÉQUIPE</span></div>`+
  rows.map(p=>`<button class="rankingLine ${p.isCareerPlayer?'me':''}"><b>#${p.ranking}</b><span class="rankPlayer">${portraitMarkup(p,'miniPortrait')}<strong>${p.name}</strong></span><span>${p.flag||'🇫🇷'} ${p.country||'FR'}</span><span>${roleLabel(p.role)}</span><span><b>${p.rankingPoints||0}</b></span><span>${p.teamName||'—'}</span></button>`).join('');
}
function renderRecruitment(){
  ensureCareer();renderGlobal();
  const pool=engine.recruitmentPool(career);
  $('#recruitmentSummary').textContent=`Classement #${career.ranking} · ${career.roster.length-1} partenaires dans le roster`;
  $('#recruitmentList').innerHTML=pool.slice(0,70).map(x=>{
    const p=x.player,chance=Math.round(x.acceptance*100);
    const lock=x.unlocked?'':'locked';
    return `<article class="recruitCard ${lock}">
      <div class="recruitMain">${portraitMarkup(p,'portrait')}<div class="grow"><b>${p.name}</b><small>${p.flag||''} ${roleLabel(p.role)} · #${p.ranking||'—'} · GEN ${p.overall}</small><span>${x.unlocked?`ACCORD ESTIMÉ ${chance}%`:`DÉBLOCAGE TOP ${x.threshold}`}</span></div></div>
      <button class="btn ${x.unlocked?'primary':'disabled'}" ${x.unlocked?'':'disabled'} data-recruit="${p.id}">${x.unlocked?'PROPOSER DE REJOINDRE L’ÉQUIPE':'VERROUILLÉ'}</button>
    </article>`;
  }).join('');
  $$('#recruitmentList [data-recruit]').forEach(b=>b.onclick=()=>{
    const p=playerById(b.dataset.recruit),r=engine.tryRecruit(career,p.id);
    if(r.ok){save('RECRUITMENT_ACCEPTED');alert(`${p.name} accepte de rejoindre ton roster !`);renderRecruitment()}
    else if(r.reason==='REFUS'){save('RECRUITMENT_REFUSED');alert(`${p.name} refuse pour le moment.\nTes résultats, ton prestige et votre affinité peuvent faire évoluer sa décision.`)}
  });
}
function venueProfileForTournament(t){
  const city=(t.city||'').toLowerCase(),country=(t.country||'FR').toUpperCase();
  if(country==='IT')return'italian-square';
  if(country==='ES')return'spanish-square';
  if(/nova arena|arena centrale/.test(city))return'international-arena';
  if(/grand boulodrome/.test(city))return'national-stadium';
  if(/port-azur|port-lumière|belle-dune/.test(city))return'seaside-cotedazur';
  if(/rivargent/.test(city))return'mountain-lake';
  if(/montbrun/.test(city))return'mountain-alps';
  if(/castelvieil/.test(city))return'provence-village';
  if(/valcros|aubecastel/.test(city))return'mediterranean-garden';
  if(/montélia|saint-romain/.test(city))return'city-square';
  if(/rocheval|belrive/.test(city))return'countryside';
  return'urban-park';
}

function visualSurfaceForTournament(t){
  const city=(t.city||'').toLowerCase();
  if(t.terrainId==='hard-rolling')return'compact-earth';
  if(t.terrainId==='soft-sandy')return'hard-sand';
  if(t.terrainId==='broken-rock')return'rocky';
  if(t.terrainId==='wet-heavy')return'wet-earth';
  if(/montélia|rocheval|castelvieil/.test(city))return'red-earth';
  return'fine-gravel';
}

function venueProfileLabel(t){
  const labels={
    'provence-village':'village provençal','mediterranean-garden':'jardin / colline méditerranéenne','urban-park':'parc urbain',
    'mountain-alps':'montagne / Alpes','mountain-lake':'lac de montagne',
    'seaside-cotedazur':'bord de mer / Côte d’Azur','city-square':'place de ville',
    'italian-square':'place italienne','spanish-square':'place espagnole',
    'countryside':'campagne','national-stadium':'grand boulodrome national',
    'international-arena':'grande compétition internationale'
  };
  return labels[venueProfileForTournament(t)]||'site extérieur';
}

function surfaceVisualLabel(t){
  return({
    'compact-earth':'terre compacte','fine-gravel':'gravier fin','hard-sand':'sable dur',
    'rocky':'terrain rocheux','red-earth':'terre rouge','wet-earth':'terrain humide'
  })[visualSurfaceForTournament(t)]||'gravier';
}

function aiPointProfileForOpponent(opp){
  const cards=(opp?.playerIds||[]).map(playerById).filter(Boolean);
  if(!cards.length)return{name:opp?.name||'Adversaire',role:'MILIEU',appoint:45,precision:45,regularite:45,experience:40};

  const scored=cards.map(p=>{
    const s=p.stats||{},role=(p.role||'MILIEU').toUpperCase();
    const roleBonus=role==='POINTEUR'?9:role==='MILIEU'?3:-4;
    const score=Number(s.appoint||40)*.43+Number(s.precision||40)*.25+
      Number(s.regularite||40)*.17+Number(s.experience||40)*.10+roleBonus;
    return{p,score};
  }).sort((a,b)=>b.score-a.score);

  const p=scored[0].p,s=p.stats||{};
  return{name:p.name,role:p.role||'MILIEU',appoint:Number(s.appoint||40),
    precision:Number(s.precision||40),regularite:Number(s.regularite||40),experience:Number(s.experience||40)};
}

function openTournament(id){
  selectedTournamentId=id;const t=getCalendar().find(x=>x.id===id);if(!t)return;
  const tr=terrain(t.terrainId);
  $('#tournamentTitle').textContent=t.name;$('#tournamentPlace').textContent=`${t.city} · ${t.day} ${t.month}`;
  $('#tournamentLevel').textContent=t.level;$('#tournamentFormat').textContent=t.format.replaceAll('_','-');$('#tournamentTeams').textContent=`${t.teamCount} équipes`;
  $('#tournamentTerrain').textContent=tr?.name||t.terrainId;
  $('#tournamentTerrainDesc').textContent=`${t.city} · ${venueProfileLabel(t)} · sol visuel : ${surfaceVisualLabel(t)}`;
  $('#tournamentEntry').textContent=fmtMoney(t.entryFee);$('#tournamentTravel').textContent=fmtMoney(t.travelCost);$('#tournamentTotal').textContent=fmtMoney(t.totalCost);$('#tournamentPrize').textContent=fmtMoney(t.prizes.winner);$('#tournamentRankingPts').textContent=`+${t.rankingPoints.winner}`;$('#tournamentRequirement').textContent=t.requiredRankMax>=9999?'OUVERT':`TOP ${t.requiredRankMax}`;
  const btn=$('#tournamentRegister');btn.dataset.tournament=id;
  const active=career.activeTournament?.tournamentId===id,done=career.season.completedTournamentIds.includes(id);
  const registration=getTournamentRegistration(id),registered=!!registration?.paid;
  setPaymentMessage(registered?'INSCRIT · PAIEMENT DÉJÀ ENREGISTRÉ':'',registered?'success':'info');
  btn.disabled=done||(!active&&!registered&&!t.rankOk);
  btn.textContent=done?'TOURNOI TERMINÉ'
    :active?'REPRENDRE LE TOURNOI'
    :registered?'INSCRIT · CHOISIR MON ÉQUIPE'
    :!t.rankOk?'RANKING INSUFFISANT'
    :!t.moneyOk?'FONDS INSUFFISANTS'
    :'PAYER ET S’INSCRIRE';
  showView('tournament');
}
function getTournamentRegistration(id){
  career.tournamentEntries=Array.isArray(career.tournamentEntries)?career.tournamentEntries:[];
  return career.tournamentEntries.find(e=>e.tournamentId===id)||null;
}
function setPaymentMessage(message,type='info'){
  const el=$('#paymentFeedback');
  if(!el)return;
  el.textContent=message;
  el.className=`paymentFeedback ${type}`;
}
function registerTournamentPayment(t){
  const existing=getTournamentRegistration(t.id);
  if(existing?.paid){
    return{ok:true,alreadyPaid:true,entry:existing};
  }

  const total=Number(t.totalCost||0);
  const balance=Number(career.economy?.balance||0);
  if(balance<total){
    return{ok:false,reason:'FUNDS_INSUFFISANTS',balance,total};
  }

  career.economy.balance=balance-total;
  career.money=career.economy.balance;

  const now=new Date().toISOString();
  const entry=existing||{
    tournamentId:t.id,
    status:'REGISTERED',
    paid:false,
    team:[],
    createdAt:now
  };
  entry.paid=true;
  entry.status='REGISTERED';
  entry.entryFee=Number(t.entryFee||0);
  entry.travelCost=Number(t.travelCost||0);
  entry.totalCost=total;
  entry.paidAt=now;
  if(!existing)career.tournamentEntries.push(entry);

  career.economy.transactions=Array.isArray(career.economy.transactions)?career.economy.transactions:[];
  if(!career.economy.transactions.some(tx=>tx.type==='TOURNAMENT_COST'&&tx.tournamentId===t.id)){
    career.economy.transactions.push({
      type:'TOURNAMENT_COST',
      tournamentId:t.id,
      amount:-total,
      entryFee:Number(t.entryFee||0),
      travelCost:Number(t.travelCost||0),
      date:now
    });
  }

  return{ok:true,alreadyPaid:false,entry};
}

function registerTournament(id){
  const t=getCalendar().find(x=>x.id===id);
  if(!t)return;

  if(career.activeTournament?.tournamentId===id){
    resumeTournament();
    return;
  }

  if(career.activeTournament){
    setPaymentMessage('TERMINE D’ABORD LE TOURNOI EN COURS','error');
    return;
  }

  if(!t.rankOk){
    setPaymentMessage('CLASSEMENT INSUFFISANT','error');
    return;
  }

  const payment=registerTournamentPayment(t);

  if(!payment.ok&&payment.reason==='FUNDS_INSUFFISANTS'){
    setPaymentMessage(
      `FONDS INSUFFISANTS · ${fmtMoney(payment.balance)} disponibles · ${fmtMoney(payment.total)} nécessaires`,
      'error'
    );
    return;
  }

  if(!payment.ok){
    setPaymentMessage('INSCRIPTION IMPOSSIBLE','error');
    return;
  }

  setPaymentMessage(
    payment.alreadyPaid ? 'DÉJÀ INSCRIT · AUCUN NOUVEAU PAIEMENT' : 'INSCRIPTION CONFIRMÉE · PAIEMENT EFFECTUÉ',
    'success'
  );

  selectedTournamentId=id;
  const needed=engine.formatTeamSize(t.format);
  const savedTeam=payment.entry?.team?.length ? payment.entry.team : career.team;
  selectedTournamentTeam=[...new Set(savedTeam)].slice(0,needed);

  if(!selectedTournamentTeam.includes('career-player')){
    selectedTournamentTeam.unshift('career-player');
    selectedTournamentTeam=[...new Set(selectedTournamentTeam)].slice(0,needed);
  }

  save(payment.alreadyPaid?'TOURNAMENT_REGISTRATION_RESUMED':'TOURNAMENT_REGISTERED');

  // Immediate transition: PAYER -> INSCRIT -> CHOISIR MON ÉQUIPE
  renderTeamSelection(t);
  showView('teamSelect');
}
function renderTeamSelection(t){
  const needed=engine.formatTeamSize(t.format);
  selectedTournamentTeam=[...new Set(selectedTournamentTeam)].slice(0,needed);
  if(!selectedTournamentTeam.includes('career-player'))selectedTournamentTeam.unshift('career-player');
  $('#teamSelectTitle').textContent=t.name;$('#teamSelectNeed').textContent=`${t.format.replaceAll('_','-')} · ${needed} joueur${needed>1?'s':''}`;
  $('#teamSelectRoster').innerHTML=selectedPlayers(career.roster).map(p=>{
    const selected=selectedTournamentTeam.includes(p.id),mandatory=p.id==='career-player';
    return `<button class="selectPlayer ${selected?'selected':''}" data-select-player="${p.id}" ${mandatory?'data-mandatory="1"':''}>
      ${portraitMarkup(p,'miniPortrait')}<span class="grow"><b>${p.name}</b><small>${roleLabel(p.role)} · GEN ${p.overall}</small></span><strong>${selected?'✓':'+'}</strong>
    </button>`;
  }).join('');
  $$('#teamSelectRoster [data-select-player]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.selectPlayer;if(id==='career-player')return;
    if(selectedTournamentTeam.includes(id))selectedTournamentTeam=selectedTournamentTeam.filter(x=>x!==id);
    else{
      if(selectedTournamentTeam.length>=needed)selectedTournamentTeam=selectedTournamentTeam.filter(x=>x==='career-player');
      selectedTournamentTeam.push(id);
    }
    renderTeamSelection(t);
  });
  $('#confirmTournamentTeam').disabled=selectedTournamentTeam.length!==needed;
  selectedTournamentMode=selectedTournamentMode||career.settings?.defaultTournamentMode||'PLAY';
  $$('#tournamentModeChoices [data-tournament-mode]').forEach(btn=>{
    btn.classList.toggle('selected',btn.dataset.tournamentMode===selectedTournamentMode);
  });
  $('#simulationModeHint').textContent=selectedTournamentMode==='SIMULATE'
    ? `Simulation activée · le résultat dépend de ton niveau actuel (#${career.ranking}, ${career.stage}) et de la force adverse.`
    : 'Tu joueras normalement les matchs du tournoi.';
}
function confirmTournamentTeam(){
  const t=tournament(selectedTournamentId);if(!t)return;
  if(selectedTournamentTeam.length!==engine.formatTeamSize(t.format))return;
  const reg=getTournamentRegistration(t.id);
  if(!reg?.paid){
    openTournament(t.id);
    setPaymentMessage('INSCRIPTION NON ENREGISTRÉE','error');
    return;
  }
  reg.team=[...selectedTournamentTeam];
  reg.status='TEAM_SELECTED';
  engine.startTournament(career,t,selectedTournamentTeam);
  career.activeTournament.playMode=selectedTournamentMode||'PLAY';
  career.settings.defaultTournamentMode=selectedTournamentMode||'PLAY';
  reg.status='ACTIVE';
  save('TOURNAMENT_STARTED');
  renderBracket();
  showView('bracket');
}
function roundName(session){return session.rounds[session.roundIndex]?.name||'TOUR'}
function renderBracket(){
  const s=career.activeTournament;if(!s){showView('calendar');return}
  const t=tournament(s.tournamentId),round=s.rounds[s.roundIndex];
  $('#bracketTournament').textContent=t.name;$('#bracketRound').textContent=round.name;
  $('#bracketProgress').textContent=`${s.roundIndex+1}/${Math.log2(t.teamCount)} · ${t.teamCount} équipes`;
  $('#bracketMatches').innerHTML=round.matches.map(m=>{
    const aWin=m.winner===m.a.id,bWin=m.winner===m.b.id;
    const user=m.a.isUser||m.b.isUser;
    return `<div class="bracketMatch ${user?'user':''}">
      <div class="${aWin?'winner':''}"><span>${m.a.isUser?'🔵':aWin?'✓':''}</span><b>${m.a.name}</b><em>${m.score?.split('—')[0]?.trim()||''}</em></div>
      <div class="${bWin?'winner':''}"><span>${m.b.isUser?'🔵':bWin?'✓':''}</span><b>${m.b.name}</b><em>${m.score?.split('—')[1]?.trim()||''}</em></div>
    </div>`;
  }).join('');
  const m=engine.currentUserMatch(s);
  $('#goOpponent').disabled=!m;
  $('#goOpponent').textContent=m?`VOIR L’ADVERSAIRE · ${round.name}`:'TOUR TERMINÉ';
}
function renderOpponent(){
  const s=career.activeTournament,t=tournament(s.tournamentId),opp=engine.userOpponent(s);
  $('#opponentTournament').textContent=t.name;$('#opponentRound').textContent=roundName(s);
  $('#opponentName').textContent=opp.name;
  $('#opponentCards').innerHTML=opp.playerIds.map(playerById).filter(Boolean).map(p=>playerCardHtml(p,true)).join('');
  const power=Math.round(engine.entrantPower(career,opp));
  $('#opponentPower').textContent=`FORCE ÉQUIPE ${power}`;
  const ts=selectedPlayers(s.selectedTeam);
  $('#ourMatchTeam').innerHTML=ts.map(p=>`<div class="tournamentPlayer">${portraitMarkup(p,'miniPortrait')}<span>${p.name}<small>${roleLabel(p.role)}</small></span></div>`).join('');
  const note=$('#formatCoreNote');
  const cp=s.matchCheckpoint;
  if(cp){
    note.textContent=`PARTIE SAUVEGARDÉE · SCORE ${cp.blueScore} — ${cp.redScore} · reprise au début de la mène ${cp.mene}.`;
    $('#playExistingMatch').textContent='REPRENDRE LA PARTIE';
  }else{
    note.textContent=t.format==='HEAD_TO_HEAD'
      ? 'Match Tête-à-tête.'
      : `${t.format.replaceAll('_','-')} · ${t.format==='DOUBLETTE'?'6 boules par équipe':'6 boules par équipe'}.`;
    $('#playExistingMatch').textContent=s.playMode==='SIMULATE'?'SIMULER LE MATCH':'JOUER';
  }
}
function simulateCurrentUserMatch(){
  const s=career.activeTournament;if(!s)return;
  const t=tournament(s.tournamentId);
  const sim=engine.simulateUserMatch(career,t);
  if(!sim)return;

  const pct=Math.round(sim.winChance*100);
  const result=engine.applyUserMatchResult(career,t,sim.won,sim.score);
  save('SIMULATED_MATCH_RESULT');

  if(result?.type==='NEXT_ROUND'){
    $('#roundResultTitle').textContent=sim.won?'VICTOIRE SIMULÉE':'DÉFAITE SIMULÉE';
    $('#roundResultTitle').className='resultTitle '+(sim.won?'win':'loss');
    $('#roundResultScore').textContent=sim.score;
    const xp=result.progress?.xp?.amount||0;
    const level=result.progress?.xp?.levelGain?` · NIVEAU +${result.progress.xp.levelGain}`:'';
    $('#roundResultText').textContent=`Simulation selon ton niveau actuel · chance estimée ${pct}% · puissance équipe ${sim.userPower} vs ${sim.opponentPower}. +${xp} XP${level} · Qualification pour ${roundName(career.activeTournament)}.`;
    $('#roundResultNext').textContent='VOIR LE TOUR SUIVANT';
    $('#roundResultNext').onclick=()=>{renderBracket();showView('bracket')};
    showView('roundResult');
  }else if(result?.type==='TOURNAMENT_END'){
    renderTournamentResult(result.summary);
    showView('tournamentResult');
  }
}

function renderControlMode(){
  const s=career.activeTournament;if(!s)return;
  const t=tournament(s.tournamentId);
  const humanBalls=t.format==='HEAD_TO_HEAD'?3:t.format==='DOUBLETTE'?3:2;
  $('#controlModeTournament').textContent=`${t.name} · ${roundName(s)}`;
  $('#controlTeamText').textContent=t.format==='HEAD_TO_HEAD'
    ? 'Tu contrôles les 3 boules de ton joueur.'
    : `Tu joues toutes les ${t.format==='DOUBLETTE'||t.format==='TRIPLETTE'?6:3} boules de ton équipe.`;
  $('#controlPlayerText').textContent=t.format==='HEAD_TO_HEAD'
    ? 'Identique en tête-à-tête : ton joueur possède les 3 boules.'
    : `Tu joues seulement les ${humanBalls} boules de ton joueur. Tes coéquipiers jouent automatiquement leurs propres boules.`;
}
function launchLockedMatch(mode=selectedControlMode){
  const s=career.activeTournament;if(!s)return;
  const t=tournament(s.tournamentId),opp=engine.userOpponent(s);
  selectedControlMode=mode||'TEAM';
  $('#matchCoreLabel').textContent=`${t.name} · ${roundName(s)} · vs ${opp?.name||'Adversaire'}`;
  const frame=$('#matchCoreFrame');
  clearInterval(matchPoll);
  frame.dataset.matchFormat=t.format;
  frame.dataset.aiLevel=t.level;
  frame.dataset.aiPower=String(Math.round(engine.entrantPower(career,opp)));
  frame.dataset.aiName=opp?.name||'Adversaire';
  frame.dataset.controlMode=selectedControlMode;
  frame.dataset.careerEmbedded='1';

  // Visual venue context — does not change match mode or rules.
  frame.dataset.terrainId=t.terrainId;
  frame.dataset.venueCity=t.city;
  frame.dataset.venueCountry=t.country||'FR';
  frame.dataset.tournamentId=t.id;
  frame.dataset.venueProfile=venueProfileForTournament(t);
  frame.dataset.surfaceVisual=visualSurfaceForTournament(t);
  frame.dataset.roundIndex=String(s.roundIndex);
  frame.dataset.roundName=roundName(s);
  frame.dataset.teamCount=String(t.teamCount);

  const pointAI=aiPointProfileForOpponent(opp);
  frame.dataset.aiPointerName=pointAI.name;
  frame.dataset.aiPointRole=pointAI.role;
  frame.dataset.aiAppoint=String(pointAI.appoint);
  frame.dataset.aiPrecision=String(pointAI.precision);
  frame.dataset.aiRegularity=String(pointAI.regularite);
  frame.dataset.aiExperience=String(pointAI.experience);
  if(s.matchCheckpoint){
    frame.dataset.resumeState=JSON.stringify(s.matchCheckpoint);
  }else{
    delete frame.dataset.resumeState;
  }
  frame.src='./match-core-career-v2-4/index.html?v=222';
  showView('matchCore');
  frame.onload=()=>{
    // V2.21: le Match Core carrière démarre lui-même, sans clic simulé.
    matchPoll=setInterval(()=>pollMatchResult(frame),650);
  };
}
function pollMatchResult(frame){
  try{
    const doc=frame.contentDocument;if(!doc)return;
    const end=doc.getElementById('matchEnd');
    if(!end?.classList.contains('showEnd'))return;
    clearInterval(matchPoll);matchPoll=null;
    const title=end.querySelector('.endTitle')?.textContent||'';
    const scoreText=end.querySelector('.endScore')?.textContent||'';
    const m=scoreText.match(/(\d+)\s*[—-]\s*(\d+)/);
    const score=m?`${m[1]} — ${m[2]}`:(title.includes('VICTOIRE')?'13 — 8':'8 — 13');
    handleMatchResult(title.includes('VICTOIRE'),score);
  }catch(e){}
}
function handleMatchResult(won,score){
  $('#matchCoreFrame').src='about:blank';
  const s=career.activeTournament,t=tournament(s.tournamentId);
  if(s?.matchCheckpoint)delete s.matchCheckpoint;
  const result=engine.applyUserMatchResult(career,t,won,score);
  save('MATCH_RESULT');
  if(result?.type==='NEXT_ROUND'){
    $('#roundResultTitle').textContent='VICTOIRE';
    $('#roundResultTitle').className='resultTitle win';
    $('#roundResultScore').textContent=score;
    const xp=result.progress?.xp?.amount||0;
    const level=result.progress?.xp?.levelGain?` · NIVEAU +${result.progress.xp.levelGain}`:'';
    $('#roundResultText').textContent=`+${xp} XP${level} · Qualification pour ${roundName(career.activeTournament)}. Les autres rencontres ont été simulées.`;
    $('#roundResultNext').textContent='VOIR LE TOUR SUIVANT';
    $('#roundResultNext').onclick=()=>{renderBracket();showView('bracket')};
    showView('roundResult');
  }else if(result?.type==='TOURNAMENT_END'){
    renderTournamentResult(result.summary);showView('tournamentResult');
  }
}
function renderTournamentResult(sum){
  const t=tournament(sum.tournamentId);
  $('#finalTournamentName').textContent=t.name;
  $('#finalPlacement').textContent=sum.placement;
  $('#finalPlacement').className='resultTitle '+(sum.status==='WINNER'?'win':'loss');
  $('#summaryMoney').textContent=`+${fmtMoney(sum.moneyGain)}`;
  $('#summaryRankingPts').textContent=`+${sum.rankingGain} pts`;
  $('#summaryRank').textContent=`#${sum.oldRank} → #${sum.newRank}`;
  $('#summaryBalance').textContent=fmtMoney(sum.newMoney);
  const tournamentXP=sum.tournamentProgress?.xp?.amount||0;
  const finalMatchXP=sum.matchProgress?.xp?.amount||0;
  $('#summaryXP').textContent=`+${tournamentXP+finalMatchXP} XP`;
  $('#summaryPlayerLevel').textContent=`LVL ${sum.playerLevel||engine.progressionState(career).level}`;
  $('#summaryUnlocks').innerHTML=[
    ...sum.newTournamentIds.map(id=>`<li>🏆 ${tournament(id)?.name||'Nouveau tournoi'} débloqué</li>`),
    ...sum.newRecruitIds.slice(0,8).map(id=>`<li>👤 ${playerById(id)?.name||'Nouveau joueur'} devient approchable</li>`)
  ].join('')||'<li>Aucun nouveau déblocage cette fois.</li>';
  $('#aiWorldInfo').textContent=`Le circuit IA a simulé ${career.aiWorld.tournamentsSimulated} tournoi${career.aiWorld.tournamentsSimulated>1?'s':''}. Formes et points ranking ont évolué.`;
}
function resumeTournament(){
  const s=career.activeTournament;if(!s)return;
  selectedTournamentId=s.tournamentId;
  selectedTournamentTeam=[...s.selectedTeam];
  if(s.matchCheckpoint&&s.playMode!=='SIMULATE'){
    selectedControlMode=s.matchCheckpoint.controlMode||'TEAM';
    launchLockedMatch(selectedControlMode);
    return;
  }
  renderBracket();showView('bracket');
}
function quitMatchCore(){clearInterval(matchPoll);matchPoll=null;$('#matchCoreFrame').src='about:blank';renderOpponent();showView('opponent')}
function bind(){
  $('#newCareerBtn').onclick=()=>showView('newCareer');
  $('#continueBtn').onclick=()=>{career=saveManager.load();ensureCareer();save('MIGRATE');renderDashboard();showView('dashboard')};
  $('#resetCareerBtn').onclick=()=>{if(confirm('Réinitialiser la carrière locale ?')){saveManager.reset();career=null;renderHome();showView('home')}};
  $('#careerForm').onsubmit=e=>{e.preventDefault();const form=Object.fromEntries(new FormData(e.currentTarget).entries());career=saveManager.createCareer(form,starterBallForRole(form.role),chooseStarterTeam(form.role));ensureCareer();save('NEW_CAREER');renderDashboard();showView('dashboard')};
  $$('[data-go]').forEach(b=>b.onclick=()=>{
    const v=b.dataset.go;
    if(v==='home'){showView('home');return}
    if(!career)return;
    if(v==='dashboard')renderDashboard();if(v==='calendar')renderCalendar();if(v==='team')renderTeam();if(v==='ranking')renderRanking();if(v==='recruitment')renderRecruitment();if(v==='training')renderTraining();if(v==='equipment')renderEquipment();if(v==='profile')renderProfile();
    showView(v);
  });
  $('#nextTournamentBtn').onclick=e=>openTournament(e.currentTarget.dataset.tournament);
  $('#tournamentBack').onclick=()=>{renderCalendar();showView('calendar')};
  $('#tournamentRegister').onclick=e=>registerTournament(e.currentTarget.dataset.tournament);
  $('#teamSelectBack').onclick=()=>openTournament(selectedTournamentId);
  $('#confirmTournamentTeam').onclick=confirmTournamentTeam;
  $('#goOpponent').onclick=()=>{renderOpponent();showView('opponent')};
  $('#opponentBack').onclick=()=>{renderBracket();showView('bracket')};
  $('#playExistingMatch').onclick=()=>{
    const s=career.activeTournament;
    if(!s)return;
    if(s.playMode==='SIMULATE'){
      simulateCurrentUserMatch();
      return;
    }
    if(s?.matchCheckpoint){
      selectedControlMode=s.matchCheckpoint.controlMode||'TEAM';
      launchLockedMatch(selectedControlMode);
    }else{
      renderControlMode();showView('controlMode');
    }
  };
  $('#controlModeBack').onclick=()=>{renderOpponent();showView('opponent')};
  $('#controlTeamBtn').onclick=()=>launchLockedMatch('TEAM');
  $('#controlPlayerBtn').onclick=()=>launchLockedMatch('PLAYER');
  $('#closeMatchCore').onclick=quitMatchCore;
  $('#finalBackCalendar').onclick=()=>{career.season.month=tournament(selectedTournamentId)?.month||career.season.month;save('TOURNAMENT_CLOSED');renderCalendar();showView('calendar')};
  $('#finalRecruitment').onclick=()=>{renderRecruitment();showView('recruitment')};
  $('#profileSave').onclick=saveProfile;
  $('#profileImageInput').onchange=e=>loadProfileImage(e.target.files?.[0]);
  $('#profileClubCountry').onchange=refreshClubRegions;
  $('#profileClubRegion').onchange=refreshClubList;
  $('#profileClub').onchange=updateClubPreview;
  $('#dashboardPlayerCard')?.addEventListener('click',e=>{
    if(!e.target.closest('button')){renderProfile();showView('profile')}
  });
  $('#profileStats').onclick=e=>{
    const b=e.target.closest('[data-upgrade-stat]');
    if(b)spendStatPoint(b.dataset.upgradeStat);
  };
  $('#trainingCards').onclick=e=>{
    const b=e.target.closest('[data-training]');
    if(b&&!b.disabled)runTraining(b.dataset.training);
  };
  $('#equipmentTabs').onclick=e=>{
    const b=e.target.closest('[data-equipment-category]');
    if(!b)return;
    equipmentCategory=b.dataset.equipmentCategory;
    renderEquipment();
  };
  $('#equipmentList').onclick=e=>{
    const buy=e.target.closest('[data-buy-id]');
    if(buy){buyEquipment(buy.dataset.buyId);return}
    const equip=e.target.closest('[data-equip-id]');
    if(equip)equipEquipment(equip.dataset.equipId);
  };
  $('#profileRemovePhoto').onclick=()=>{
    career.player.portrait=null;
    save('PROFILE_PHOTO_REMOVED');
    $('#profileFeedback').textContent='PHOTO SUPPRIMÉE';
    $('#profileFeedback').className='profileFeedback success';
    renderProfile();
  };
  $('#tournamentModeChoices').onclick=e=>{
    const btn=e.target.closest('[data-tournament-mode]');
    if(!btn)return;
    selectedTournamentMode=btn.dataset.tournamentMode;
    const t=tournament(selectedTournamentId);
    if(t)renderTeamSelection(t);
  };
}
window.addEventListener('message',e=>{
  if(e.data?.type!=='PT_MATCH_CHECKPOINT'||!career?.activeTournament)return;

  const cp=e.data.checkpoint;
  if(!cp||!Number.isFinite(Number(cp.blueScore))||!Number.isFinite(Number(cp.redScore)))return;

  const s=career.activeTournament;
  s.matchCheckpoint={
    blueScore:Number(cp.blueScore||0),
    redScore:Number(cp.redScore||0),
    mene:Math.max(1,Number(cp.mene||1)),
    meneStarter:cp.meneStarter==='red'?'red':'blue',
    coinWinner:cp.coinWinner==='red'?'red':'blue',
    controlMode:selectedControlMode||cp.controlMode||'TEAM',
    roundIndex:s.roundIndex,
    userMatchId:engine.currentUserMatch(s)?.id||null,
    savedAt:cp.savedAt||new Date().toISOString()
  };
  save('MATCH_MENE_CHECKPOINT');
});

async function init(){
  db=await dataService.loadAll();engine=new PetanqueCareerEngine(db);bind();
  career=saveManager.load();if(career){ensureCareer();save('LOAD')}
  renderHome();
  $('#splash').classList.add('hide');setTimeout(()=>$('#splash')?.remove(),450);showView('home');
}
init().catch(err=>{console.error(err);$('#loadingError').textContent='Erreur : '+err.message;$('#loadingError').style.display='block'});
})();