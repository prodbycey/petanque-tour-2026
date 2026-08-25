(function(global){
'use strict';

const ROUND_NAMES={
  8:['QUARTS','DEMI-FINALES','FINALE'],
  16:['HUITIÈMES','QUARTS','DEMI-FINALES','FINALE'],
  32:['SEIZIÈMES','HUITIÈMES','QUARTS','DEMI-FINALES','FINALE']
};
const RANK_CURVE=[
  [0,2500],[200,1950],[450,1300],[650,1000],[900,700],[1200,500],
  [1600,300],[2100,150],[2700,50],[3600,15],[5000,1]
];

class CareerEngine{
  constructor(db){this.db=db}

  ensureProgression(career){
    const p=career.player;
    p.xp=p.xp||{appoint:0,precision:0,tir:0,regularite:0,experience:0};
    p.progression=p.progression||{level:1,totalXP:0,developmentPoints:0,levelsGained:0};
    p.energy=Math.max(0,Math.min(100,Number(p.energy??100)));
    career.palmares=Array.isArray(career.palmares)?career.palmares:[];
    career.trainingHistory=Array.isArray(career.trainingHistory)?career.trainingHistory:[];
    return p.progression;
  }

  xpRequiredForLevel(level){
    return 90+Math.max(0,level-1)*28;
  }

  progressionState(career){
    const prog=this.ensureProgression(career);
    let remaining=Math.max(0,Number(prog.totalXP||0));
    let level=1,start=0,need=this.xpRequiredForLevel(level);

    while(remaining>=need && level<100){
      remaining-=need;
      start+=need;
      level++;
      need=this.xpRequiredForLevel(level);
    }

    prog.level=level;
    return{
      level,
      totalXP:Number(prog.totalXP||0),
      xpIntoLevel:remaining,
      xpForNextLevel:need,
      percent:Math.max(0,Math.min(100,Math.round((remaining/need)*100))),
      developmentPoints:Number(prog.developmentPoints||0)
    };
  }

  awardPlayerXP(career,amount,source='MATCH'){
    const prog=this.ensureProgression(career);
    const before=this.progressionState(career);
    const gain=Math.max(0,Math.round(Number(amount||0)));
    prog.totalXP+=gain;
    const after=this.progressionState(career);
    const levelGain=Math.max(0,after.level-before.level);

    if(levelGain>0){
      prog.developmentPoints+=levelGain*2;
      prog.levelsGained=Number(prog.levelsGained||0)+levelGain;
    }

    return{
      source,
      amount:gain,
      oldLevel:before.level,
      newLevel:after.level,
      levelGain,
      developmentPointsGained:levelGain*2,
      state:this.progressionState(career)
    };
  }

  addStatXP(career,stat,amount){
    this.ensureProgression(career);
    if(!['appoint','precision','tir','regularite','experience'].includes(stat))return{stat,gained:0};
    const p=career.player;
    p.xp[stat]=Number(p.xp[stat]||0)+Math.max(0,Math.round(amount||0));
    let gained=0;

    while(p.xp[stat]>=100 && Number(p.stats[stat]||0)<100){
      p.xp[stat]-=100;
      p.stats[stat]=Math.min(100,Number(p.stats[stat]||0)+1);
      gained++;
    }
    if(Number(p.stats[stat]||0)>=100)p.xp[stat]=Math.min(99,p.xp[stat]);
    return{stat,gained,xp:p.xp[stat],value:p.stats[stat]};
  }

  spendDevelopmentPoint(career,stat){
    const prog=this.ensureProgression(career);
    if(!['appoint','precision','tir','regularite','experience'].includes(stat))return{ok:false,reason:'STAT'};
    if(Number(prog.developmentPoints||0)<=0)return{ok:false,reason:'POINTS'};
    if(Number(career.player.stats[stat]||0)>=100)return{ok:false,reason:'MAX'};

    career.player.stats[stat]=Math.min(100,Number(career.player.stats[stat]||0)+1);
    prog.developmentPoints--;
    return{ok:true,stat,value:career.player.stats[stat],remaining:prog.developmentPoints};
  }

  trainingCatalog(){
    return[
      {
        id:'POINTAGE',name:'Atelier pointage',icon:'🎯',energy:25,xp:18,
        primary:'appoint',secondary:'precision',secondaryXP:38,
        description:'Travail de dosage, direction et zone de chute.'
      },
      {
        id:'TIR_PRECISION',name:'Tir de précision',icon:'💥',energy:25,xp:18,
        primary:'tir',secondary:'precision',secondaryXP:34,
        description:'Travail du fer, de la ligne et de la régularité de tir.'
      },
      {
        id:'REGULARITE',name:'Régularité',icon:'📈',energy:25,xp:16,
        primary:'regularite',secondary:'experience',secondaryXP:36,
        description:'Séries répétées pour devenir plus constant sous pression.'
      }
    ];
  }

  train(career,type){
    this.ensureProgression(career);
    if(career.activeTournament)return{ok:false,reason:'ACTIVE_TOURNAMENT'};

    const session=this.trainingCatalog().find(x=>x.id===type);
    if(!session)return{ok:false,reason:'UNKNOWN'};
    if(career.player.energy<session.energy)return{ok:false,reason:'ENERGY',required:session.energy};

    const p=career.player;
    const beforePrimary=Number(p.stats[session.primary]||0);
    p.energy=Math.max(0,p.energy-session.energy);
    p.stats[session.primary]=Math.min(100,beforePrimary+1);

    const secondary=this.addStatXP(career,session.secondary,session.secondaryXP);
    const xp=this.awardPlayerXP(career,session.xp,'TRAINING');

    const entry={
      id:'training-'+Date.now()+'-'+Math.floor(Math.random()*9999),
      type:session.id,
      name:session.name,
      energyCost:session.energy,
      xpGain:xp.amount,
      primary:session.primary,
      primaryGain:p.stats[session.primary]>beforePrimary?1:0,
      secondary:session.secondary,
      secondaryGain:secondary.gained,
      date:new Date().toISOString()
    };
    career.trainingHistory.unshift(entry);
    career.trainingHistory=career.trainingHistory.slice(0,50);

    return{
      ok:true,
      session,
      xp,
      entry,
      energy:p.energy,
      primaryValue:p.stats[session.primary],
      secondaryValue:p.stats[session.secondary]
    };
  }

  awardMatchProgress(career,tournament,won){
    this.ensureProgression(career);
    const level=(tournament.level||'LOCAL').toUpperCase();
    const base={LOCAL:20,REGIONAL:25,'RÉGIONAL':25,NATIONAL:32,INTERNATIONAL:40}[level]||20;
    const xp=this.awardPlayerXP(career,base+(won?8:3),'MATCH');

    const role=career.player.role||'MILIEU';
    const statGains=[];
    if(role==='POINTEUR'){
      statGains.push(this.addStatXP(career,'appoint',won?24:17));
      statGains.push(this.addStatXP(career,'precision',won?14:10));
    }else if(role==='TIREUR'){
      statGains.push(this.addStatXP(career,'tir',won?24:17));
      statGains.push(this.addStatXP(career,'precision',won?14:10));
    }else{
      statGains.push(this.addStatXP(career,'regularite',won?18:13));
      statGains.push(this.addStatXP(career,'appoint',won?10:7));
      statGains.push(this.addStatXP(career,'tir',won?10:7));
    }
    statGains.push(this.addStatXP(career,'experience',won?16:12));
    career.player.energy=Math.min(100,Number(career.player.energy||0)+10);

    return{xp,statGains,energy:career.player.energy};
  }

  tournamentProgressBonus(career,tournament,status,placement){
    const level=(tournament.level||'LOCAL').toUpperCase();
    const base={LOCAL:28,REGIONAL:42,'RÉGIONAL':42,NATIONAL:62,INTERNATIONAL:88}[level]||28;
    let factor=.35;
    if(status==='WINNER')factor=1;
    else if(placement==='FINALISTE')factor=.72;
    else if(placement==='DEMI-FINALISTE')factor=.55;
    else if(placement==='QUART DE FINALISTE')factor=.44;
    else if(/^TOUR/.test(placement))factor=.38;

    const xp=this.awardPlayerXP(career,Math.round(base*factor),'TOURNAMENT');
    this.addStatXP(career,'experience',status==='WINNER'?34:placement==='FINALISTE'?25:16);
    career.player.energy=Math.min(100,Number(career.player.energy||0)+25);
    return{xp,energy:career.player.energy};
  }

  ensureInventory(career){
    career.inventory=career.inventory||{ownedEquipmentIds:[],equippedBallId:null,equippedJerseyId:null,equippedShoesId:null,cosmetics:[]};
    career.inventory.ownedEquipmentIds=Array.isArray(career.inventory.ownedEquipmentIds)?career.inventory.ownedEquipmentIds:[];
    return career.inventory;
  }

  equipmentItem(id){
    return (this.db.equipment?.equipment||[]).find(x=>x.id===id)||null;
  }

  equippedItems(career){
    const inv=this.ensureInventory(career);
    return{
      ball:this.equipmentItem(inv.equippedBallId),
      jersey:this.equipmentItem(inv.equippedJerseyId),
      shoes:this.equipmentItem(inv.equippedShoesId)
    };
  }

  equipmentUnlockState(career,item){
    const level=this.progressionState(career).level;
    const rank=Number(career.ranking||2500);
    const levelOK=level>=Number(item.requiredLevel||1);
    const rankOK=rank<=Number(item.requiredRankMax||2500);
    return{
      unlocked:levelOK&&rankOK,
      levelOK,rankOK,
      level,
      rank,
      requiredLevel:Number(item.requiredLevel||1),
      requiredRankMax:Number(item.requiredRankMax||2500)
    };
  }

  buyEquipment(career,id){
    const inv=this.ensureInventory(career);
    const item=this.equipmentItem(id);
    if(!item)return{ok:false,reason:'UNKNOWN'};
    if(inv.ownedEquipmentIds.includes(id))return{ok:false,reason:'OWNED'};
    const unlock=this.equipmentUnlockState(career,item);
    if(!unlock.unlocked)return{ok:false,reason:'LOCKED',unlock};
    const price=Math.max(0,Number(item.price||0));
    if(Number(career.economy.balance||0)<price)return{ok:false,reason:'MONEY',price};

    career.economy.balance-=price;
    inv.ownedEquipmentIds.push(id);
    career.economy.transactions.push({
      type:'EQUIPMENT_PURCHASE',
      equipmentId:id,
      label:`${item.brand} ${item.model}`,
      amount:-price,
      date:new Date().toISOString()
    });
    return{ok:true,item,balance:career.economy.balance};
  }

  equipEquipment(career,id){
    const inv=this.ensureInventory(career);
    const item=this.equipmentItem(id);
    if(!item)return{ok:false,reason:'UNKNOWN'};
    if(!inv.ownedEquipmentIds.includes(id))return{ok:false,reason:'NOT_OWNED'};

    if(item.category==='BALL')inv.equippedBallId=id;
    else if(item.category==='JERSEY')inv.equippedJerseyId=id;
    else if(item.category==='SHOES')inv.equippedShoesId=id;
    else return{ok:false,reason:'CATEGORY'};

    return{ok:true,item};
  }

  equipmentSimulationBonus(career){
    const ball=this.equippedItems(career).ball;
    return Math.max(0,Number(ball?.simulationPower||0));
  }

  levelFromRank(rank){
    if(rank<=50)return'INTERNATIONAL';
    if(rank<=300)return'NATIONAL';
    if(rank<=1000)return'RÉGIONAL';
    return'LOCAL';
  }

  rankFromPoints(points){
    points=Math.max(0,Number(points||0));
    for(let i=0;i<RANK_CURVE.length-1;i++){
      const [p1,r1]=RANK_CURVE[i],[p2,r2]=RANK_CURVE[i+1];
      if(points<=p2){
        const u=(points-p1)/(p2-p1);
        return Math.max(1,Math.round(r1+(r2-r1)*u));
      }
    }
    return 1;
  }

  formatTeamSize(format){
    return format==='TRIPLETTE'?3:format==='DOUBLETTE'?2:1;
  }

  ensureAIWorld(career){
    const world=career.aiWorld;
    const all=[
      ...this.db.players.eliteTop30,
      ...this.db.players.generatedTestPlayers,
      ...this.db.players.starterLocalPartners
    ];
    for(const p of all){
      if(!world.players[p.id]){
        const basePts=Number(p.rankingPoints ?? Math.max(10,3000-(p.ranking||2500)));
        world.players[p.id]={
          rankingPoints:basePts,
          form:Number(p.form||65),
          teamId:p.teamId||null,
          wins:0,losses:0,tournaments:0
        };
      }
    }
    return world;
  }

  playerState(career,p){
    this.ensureAIWorld(career);
    return career.aiWorld.players[p.id]||{};
  }

  playerPower(career,p){
    const state=this.playerState(career,p);
    const base=Number(p.overall||50);
    const form=Number(state.form||65);
    return base*.78+form*.22;
  }

  entrantPower(career,e){
    if(e.isUser){
      const cards=e.playerIds.map(id=>id==='career-player'?e.careerCard:this.findPlayer(id)).filter(Boolean);
      return cards.reduce((s,p)=>s+Number(p.overall||45),0)/Math.max(1,cards.length)+4;
    }
    const ps=e.playerIds.map(id=>this.findPlayer(id)).filter(Boolean);
    return ps.reduce((s,p)=>s+this.playerPower(career,p),0)/Math.max(1,ps.length);
  }

  findPlayer(id){
    return [
      ...this.db.players.eliteTop30,
      ...this.db.players.generatedTestPlayers,
      ...this.db.players.starterLocalPartners
    ].find(p=>p.id===id);
  }

  candidatePlayersForLevel(level){
    if(level==='INTERNATIONAL')return [...this.db.players.eliteTop30,...this.db.players.generatedTestPlayers.filter(p=>p.tier==='NATIONAL')];
    if(level==='NATIONAL')return this.db.players.generatedTestPlayers.filter(p=>p.tier==='NATIONAL'||p.tier==='REGIONAL');
    if(level==='REGIONAL')return this.db.players.generatedTestPlayers.filter(p=>p.tier==='REGIONAL'||p.tier==='LOCAL');
    return [...this.db.players.starterLocalPartners,...this.db.players.generatedTestPlayers.filter(p=>p.tier==='LOCAL')];
  }

  makeEntrants(career,tournament,selectedTeam){
    const size=tournament.teamCount;
    const teamSize=this.formatTeamSize(tournament.format);
    const userCards=selectedTeam.map(id=>id==='career-player'?careerCardFromSave(career):this.findPlayer(id)).filter(Boolean);
    const user={
      id:'USER',name:'MON ÉQUIPE',isUser:true,
      playerIds:selectedTeam.slice(0,teamSize),careerCard:careerCardFromSave(career)
    };

    const entrants=[user];
    const used=new Set(selectedTeam.filter(x=>x!=='career-player'));

    // Validated elite teams are used mainly for high-prestige events.
    if(tournament.level==='INTERNATIONAL'||tournament.level==='NATIONAL'){
      for(const team of this.db.teams.teams){
        if(entrants.length>=size)break;
        const ids=team.players.slice(0,teamSize);
        if(ids.some(id=>used.has(id)))continue;
        ids.forEach(id=>used.add(id));
        entrants.push({id:'TEAM-'+team.id,name:team.name,isUser:false,playerIds:ids,validatedTeam:true});
      }
    }

    const pool=this.candidatePlayersForLevel(tournament.level)
      .filter(p=>!used.has(p.id))
      .sort((a,b)=>(a.ranking||9999)-(b.ranking||9999));

    let cursor=0,serial=1;
    while(entrants.length<size){
      const ids=[];
      while(ids.length<teamSize && cursor<pool.length){
        const p=pool[cursor++];
        if(!used.has(p.id)){used.add(p.id);ids.push(p.id)}
      }
      if(ids.length<teamSize){
        // Recycle test population only if a 32-team field exceeds the local pool.
        const fallback=this.db.players.generatedTestPlayers[(serial*7)%this.db.players.generatedTestPlayers.length];
        if(fallback&&!ids.includes(fallback.id))ids.push(fallback.id);
      }
      const names=ids.map(id=>this.findPlayer(id)?.name||'Joueur').join(' / ');
      entrants.push({id:`FIELD-${tournament.id}-${serial++}`,name:names,isUser:false,playerIds:ids});
    }

    // Deterministic pseudo-shuffle from tournament id and career id.
    let seed=hash(`${tournament.id}-${career.id}-${career.tournamentHistory.length}`);
    for(let i=entrants.length-1;i>0;i--){
      seed=lcg(seed);const j=seed%(i+1);
      [entrants[i],entrants[j]]=[entrants[j],entrants[i]];
    }
    return entrants;
  }

  startTournament(career,tournament,selectedTeam){
    const before={
      ranking:career.ranking,
      rankingPoints:career.rankingPoints,
      money:career.economy.balance,
      accessibleTournamentIds:this.unlockedTournamentIds(career.ranking),
      recruitableIds:this.recruitableIds(career)
    };
    const entrants=this.makeEntrants(career,tournament,selectedTeam);
    const session={
      tournamentId:tournament.id,status:'ACTIVE',paid:true,
      selectedTeam:[...selectedTeam],
      entryCost:tournament.totalCost,
      before,
      roundIndex:0,
      rounds:[],
      userWins:0,userLoss:false,
      finished:false,
      startedAt:new Date().toISOString()
    };
    session.rounds.push(this.buildRound(career,tournament,entrants,0));
    career.activeTournament=session;
    return session;
  }

  buildRound(career,tournament,entrants,roundIndex){
    const names=ROUND_NAMES[tournament.teamCount]||[];
    const matches=[];
    for(let i=0;i<entrants.length;i+=2){
      const a=entrants[i],b=entrants[i+1];
      const m={id:`R${roundIndex+1}-M${i/2+1}`,a,b,status:'PENDING',winner:null,score:null};
      if(!a?.isUser&&!b?.isUser)this.simulateAIMatch(career,tournament,m);
      matches.push(m);
    }
    return {index:roundIndex,name:names[roundIndex]||`TOUR ${roundIndex+1}`,matches};
  }

  simulateAIMatch(career,tournament,match){
    const pa=this.entrantPower(career,match.a),pb=this.entrantPower(career,match.b);
    const seed=lcg(hash(`${tournament.id}-${match.id}-${career.aiWorld.tournamentsSimulated}-${match.a.id}-${match.b.id}`));
    const noise=((seed%1000)/1000-.5)*18;
    const winner=pa+noise>=pb?match.a:match.b;
    const loser=winner===match.a?match.b:match.a;
    const loseScore=Math.max(2,Math.min(12,Math.round(9-Math.abs(pa-pb)/8+((seed>>5)%5))));
    match.status='DONE';match.winner=winner.id;match.score=winner===match.a?`13 — ${loseScore}`:`${loseScore} — 13`;
    this.noteAIResult(career,winner,true,tournament);
    this.noteAIResult(career,loser,false,tournament);
  }

  noteAIResult(career,entrant,won,tournament){
    if(!entrant||entrant.isUser)return;
    this.ensureAIWorld(career);
    const gainBase=Math.max(3,Math.round((tournament.rankingPoints.winner||40)/(Math.log2(tournament.teamCount)+2)));
    for(const id of entrant.playerIds){
      const p=this.findPlayer(id);if(!p)continue;
      const s=career.aiWorld.players[id];
      s.tournaments+=0.15;
      if(won){s.wins++;s.rankingPoints+=gainBase;s.form=Math.min(100,s.form+2)}
      else{s.losses++;s.form=Math.max(35,s.form-1)}
    }
  }

  userCurrentPower(career,selectedTeam){
    const ids=Array.isArray(selectedTeam)&&selectedTeam.length?selectedTeam:(career.team||['career-player']);
    const cards=ids.map(id=>id==='career-player'?careerCardFromSave(career):this.findPlayer(id)).filter(Boolean);
    const teamOverall=cards.reduce((s,p)=>s+Number(p.overall||45),0)/Math.max(1,cards.length);

    // Ranking/stage progressively improves simulated competitiveness.
    const rank=Number(career.ranking||2500);
    const rankBonus =
      rank<=50?10:
      rank<=150?8:
      rank<=300?6:
      rank<=500?4:
      rank<=1000?2:0;

    const formBonus=(Number(career.player?.form||70)-70)*.10;
    return teamOverall+rankBonus+formBonus+this.equipmentSimulationBonus(career);
  }

  simulateUserMatch(career,tournament){
    const s=career.activeTournament;
    if(!s||s.finished)return null;
    const match=this.currentUserMatch(s);
    if(!match)return null;

    const opponent=match.a.isUser?match.b:match.a;
    const userPower=this.userCurrentPower(career,s.selectedTeam);
    const opponentPower=this.entrantPower(career,opponent);

    // Random result, but strongly influenced by the player's current level.
    const levelModifier={
      LOCAL:0,
      'RÉGIONAL':2,
      REGIONAL:2,
      NATIONAL:4,
      INTERNATIONAL:6
    }[career.stage]||0;

    let winChance=.50+(userPower-opponentPower)*.012+levelModifier*.01;
    winChance=Math.max(.18,Math.min(.88,winChance));

    const won=Math.random()<winChance;
    const margin=Math.max(1,Math.min(11,Math.round(3+Math.abs(userPower-opponentPower)/7+Math.random()*4)));
    const loserScore=Math.max(2,13-margin);
    const score=won?`13 — ${loserScore}`:`${loserScore} — 13`;

    return{
      won,
      score,
      winChance,
      userPower:Math.round(userPower),
      opponentPower:Math.round(opponentPower),
      opponentName:opponent.name
    };
  }

  currentUserMatch(session){
    const round=session.rounds[session.roundIndex];
    return round?.matches.find(m=>m.status==='PENDING'&&(m.a?.isUser||m.b?.isUser))||null;
  }

  userOpponent(session){
    const m=this.currentUserMatch(session);if(!m)return null;
    return m.a.isUser?m.b:m.a;
  }

  applyUserMatchResult(career,tournament,won,score){
    const s=career.activeTournament;if(!s||s.finished)return null;
    const m=this.currentUserMatch(s);if(!m)return null;
    m.status='DONE';m.score=score||'13 — 8';
    m.winner=won?(m.a.isUser?m.a.id:m.b.id):(m.a.isUser?m.b.id:m.a.id);

    career.careerStats.matches++;
    if(won){career.careerStats.wins++;s.userWins++}
    else{career.careerStats.losses++;s.userLoss=true}

    const progress=this.awardMatchProgress(career,tournament,won);

    if(!won){
      return this.finishTournament(career,tournament,'ELIMINATED',progress);
    }

    const round=s.rounds[s.roundIndex];
    const winners=round.matches.map(x=>x.a.id===x.winner?x.a:x.b).filter(Boolean);
    if(winners.length===1){
      return this.finishTournament(career,tournament,'WINNER',progress);
    }

    s.roundIndex++;
    s.rounds.push(this.buildRound(career,tournament,winners,s.roundIndex));
    return {type:'NEXT_ROUND',session:s,progress};
  }

  finishTournament(career,tournament,status,matchProgress=null){
    const s=career.activeTournament;
    s.status=status;s.finished=true;s.finishedAt=new Date().toISOString();

    const totalRounds=Math.log2(tournament.teamCount);
    const wins=s.userWins;
    let fraction=.02,placement=`Éliminé au 1er tour`;
    if(status==='WINNER'){fraction=1;placement='VAINQUEUR'}
    else if(wins===totalRounds-1){fraction=.55;placement='FINALISTE'}
    else if(wins===totalRounds-2){fraction=.30;placement='DEMI-FINALISTE'}
    else if(wins===totalRounds-3){fraction=.15;placement='QUART DE FINALISTE'}
    else if(wins>0){fraction=.08;placement=`TOUR ${wins+1}`}

    const tournamentProgress=this.tournamentProgressBonus(career,tournament,status,placement);

    const rankingGain=Math.max(1,Math.round((tournament.rankingPoints.winner||40)*fraction));
    let moneyGain=0;
    if(status==='WINNER')moneyGain=tournament.prizes.winner||0;
    else if(placement==='FINALISTE')moneyGain=tournament.prizes.finalist||0;
    else if(placement==='DEMI-FINALISTE')moneyGain=tournament.prizes.semifinalist||0;

    const oldRank=s.before.ranking;
    career.rankingPoints+=rankingGain;
    career.ranking=this.rankFromPoints(career.rankingPoints);
    career.stage=this.levelFromRank(career.ranking);

    if(moneyGain>0){
      career.economy.balance+=moneyGain;
      career.economy.transactions.push({type:'TOURNAMENT_PRIZE',tournamentId:tournament.id,amount:moneyGain,date:new Date().toISOString()});
    }

    career.careerStats.tournaments++;
    if(status==='WINNER')career.careerStats.titles++;
    if(!career.season.completedTournamentIds.includes(tournament.id))career.season.completedTournamentIds.push(tournament.id);

    this.simulateWorldAfterTournament(career,tournament);
    this.refreshEliteRanks(career);

    if(status==='WINNER'){
      career.palmares=Array.isArray(career.palmares)?career.palmares:[];
      if(!career.palmares.some(x=>x.tournamentId===tournament.id)){
        career.palmares.unshift({
          tournamentId:tournament.id,
          name:tournament.name,
          year:career.season?.year||2026,
          format:tournament.format,
          level:tournament.level,
          city:tournament.city,
          team:[...(s.selectedTeam||[])],
          prize:moneyGain,
          rankingGain,
          date:new Date().toISOString()
        });
      }
    }

    const newTournamentIds=this.unlockedTournamentIds(career.ranking).filter(id=>!s.before.accessibleTournamentIds.includes(id));
    const newRecruitIds=this.recruitableIds(career).filter(id=>!s.before.recruitableIds.includes(id));
    const summary={
      tournamentId:tournament.id,status,placement,rankingGain,moneyGain,
      oldRank,newRank:career.ranking,
      oldPoints:s.before.rankingPoints,newPoints:career.rankingPoints,
      oldMoney:s.before.money,newMoney:career.economy.balance,
      newTournamentIds,newRecruitIds,
      roundWins:wins,
      matchProgress,
      tournamentProgress,
      playerLevel:this.progressionState(career).level,
      developmentPoints:this.progressionState(career).developmentPoints,
      date:new Date().toISOString()
    };
    s.summary=summary;
    career.tournamentHistory.push(summary);
    career.activeTournament=null;
    return {type:'TOURNAMENT_END',summary};
  }

  unlockedTournamentIds(rank){
    return this.db.tournaments.tournaments.filter(t=>rank<=t.requiredRankMax).map(t=>t.id);
  }

  recruitThreshold(player){
    if(player.dataStatus==='VALIDATED_ELITE')return 50;
    if(player.tier==='NATIONAL'){
      if((player.ranking||9999)<=150)return 150;
      return 500;
    }
    if(player.tier==='REGIONAL')return 1000;
    return 3000;
  }

  recruitableIds(career){
    return this.recruitmentPool(career).filter(x=>x.unlocked).map(x=>x.player.id);
  }

  recruitmentPool(career){
    const roster=new Set(career.roster||[]);
    const pool=[
      ...this.db.players.starterLocalPartners,
      ...this.db.players.generatedTestPlayers,
      ...this.db.players.eliteTop30
    ];
    return pool
      .filter(p=>p.id!=='career-player'&&!roster.has(p.id))
      .map(p=>{
        const threshold=this.recruitThreshold(p);
        const unlocked=career.ranking<=threshold;
        return {player:p,threshold,unlocked,acceptance:this.acceptanceChance(career,p,threshold)}
      })
      .sort((a,b)=>{
        if(a.unlocked!==b.unlocked)return a.unlocked?-1:1;
        return (a.player.ranking||9999)-(b.player.ranking||9999);
      });
  }

  affinity(career,id){
    return Number(career.affinities?.[id]??30);
  }

  acceptanceChance(career,p,threshold){
    if(career.ranking>threshold)return 0;
    const winRate=career.careerStats.matches?career.careerStats.wins/career.careerStats.matches:.5;
    const affinity=this.affinity(career,p)/100;
    const prestige={LOCAL:0,REGIONAL:.08,NATIONAL:.15,INTERNATIONAL:.23}[career.stage]||0;
    const rankMargin=Math.max(0,Math.min(1,(threshold-career.ranking+1)/Math.max(80,threshold)));
    const teamPenalty=(p.teamAffinity||0)>=90?.20:(p.teamAffinity||0)>=75?.10:0;
    return clamp(.16+winRate*.22+affinity*.22+prestige+rankMargin*.18-teamPenalty,.08,.88);
  }

  tryRecruit(career,playerId){
    const item=this.recruitmentPool(career).find(x=>x.player.id===playerId);
    if(!item||!item.unlocked)return{ok:false,reason:'RANKING'};
    const chance=item.acceptance;
    const seed=lcg(hash(`${career.id}-${playerId}-${career.careerStats.matches}-${career.tournamentHistory.length}-${Math.floor(Date.now()/60000)}`));
    const roll=(seed%1000)/1000;
    if(roll<=chance){
      if(!career.roster.includes(playerId))career.roster.push(playerId);
      career.affinities[playerId]=Math.max(35,this.affinity(career,playerId));
      return{ok:true,chance};
    }
    return{ok:false,reason:'REFUS',chance};
  }

  simulateWorldAfterTournament(career,tournament){
    this.ensureAIWorld(career);
    career.aiWorld.tournamentsSimulated++;
    const pts=Math.max(2,Math.round((tournament.rankingPoints.winner||40)*.12));
    const ids=Object.keys(career.aiWorld.players);
    let seed=hash(`${tournament.id}-${career.aiWorld.tournamentsSimulated}`);
    for(let i=0;i<Math.min(38,ids.length);i++){
      seed=lcg(seed);
      const id=ids[seed%ids.length],s=career.aiWorld.players[id];
      const good=((seed>>7)%100)<48;
      s.form=clamp(s.form+(good?1:-1),35,100);
      if(good)s.rankingPoints+=pts;
    }

    // Rare career-life team movement. Initial validated team data remains untouched.
    seed=lcg(seed);
    if(career.aiWorld.tournamentsSimulated>=3 && seed%100<8){
      const generated=this.db.players.generatedTestPlayers;
      const p=generated[seed%generated.length];
      if(p){
        const s=career.aiWorld.players[p.id];
        const old=s.teamId||'club-local';
        const next=`dynamic-team-${1+(seed%12)}`;
        s.teamId=next;
        career.aiWorld.teamChanges.push({playerId:p.id,from:old,to:next,date:new Date().toISOString()});
      }
    }
  }

  refreshEliteRanks(career){
    const elite=[...this.db.players.eliteTop30];
    elite.sort((a,b)=>(career.aiWorld.players[b.id]?.rankingPoints||b.rankingPoints||0)-(career.aiWorld.players[a.id]?.rankingPoints||a.rankingPoints||0));
    elite.forEach((p,i)=>career.aiWorld.players[p.id].dynamicRank=i+1);
  }
}

function careerCardFromSave(career){
  const p=career.player,s=p.stats;
  return{id:'career-player',name:`${p.firstName} ${p.lastName}`,role:p.role,stats:s,
    overall:Math.round(Object.values(s).reduce((a,b)=>a+b,0)/5),country:'FR',flag:'🇫🇷'};
}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function lcg(x){return (Math.imul(1664525,x)+1013904223)>>>0}
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
global.PetanqueCareerEngine=CareerEngine;
})(window);
