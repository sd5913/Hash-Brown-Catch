/* Pure game rules, multiplayer physics, and Fever countdown logic — kept separate from p5 rendering for coursework and checks. */
(function(root){
  'use strict';
  const PRESETS={
    easy:{speed:1.55,rate:.8,hazards:.07,bombShare:0,duration:60,ramp:.35,description:'A gentle warm-up. A few burnt bites, no chili bombs. Take your time and find your crunch.'},
    medium:{speed:2.4,rate:1.3,hazards:.15,bombShare:.3,duration:60,ramp:.45,description:'A balanced rush, with a few burnt bites and the occasional chili bomb.'},
    hard:{speed:3.25,rate:1.9,hazards:.23,bombShare:.4,duration:60,ramp:.5,description:'Faster falls, more bad bites. Keep your basket moving and your eyes on the golden ones.'},
    hell:{speed:4.4,rate:2.6,hazards:.32,bombShare:.5,duration:60,ramp:.5,description:'The fryer has gone rogue. Fast, crowded, spicy. You have been deliciously warned.'}
  };
  const PLAY_MODES={
    '1p':{id:'1p',label:'1P SOLO',short:'SOLO',rateScale:1,description:'Classic solo basket. Move with arrows, A/D, or drag.'},
    '2p-vs':{id:'2p-vs',label:'2P VS PK',short:'2P VS',rateScale:1.35,description:'Same-screen duel! P1 [A/D] vs P2 [Arrows/Mouse]. Bump rival baskets to steal golden bites!'},
    '2p-coop':{id:'2p-coop',label:'2P CO-OP',short:'CO-OP',rateScale:1.35,description:'Shared kitchen! Alternate catches (P1 ↔ P2) to trigger +5 Relay Crunch bonuses.'}
  };
  function normalizeMode(playMode){return PLAY_MODES[playMode]?playMode:'1p';}
  function config(level,custom){return {...(level==='custom'?{speed:2.4,rate:1.3,hazards:.15,bombShare:.4,duration:60,ramp:.4,...custom}:PRESETS[level]||PRESETS.medium)};}
  function chooseType(cfg,rng=Math.random,state=null){
    if(state&&state.feverRemaining>0)return 'golden';
    if(rng()>=cfg.hazards)return 'golden';
    return rng()<cfg.bombShare?'bomb':'burnt';
  }
  function makePlayer(){return {score:0,caught:0,missed:0,hazards:0,streak:0,bestStreak:0,shield:0};}
  function newState(cfg,playMode='1p'){
    const mode=normalizeMode(playMode);
    return {
      playMode:mode,
      remaining:cfg.duration,
      elapsed:0,
      score:0,
      caught:0,
      missed:0,
      hazards:0,
      streak:0,
      bestStreak:0,
      coins:0,
      coinMultiplier:1,
      dogCaught:false,
      slowRemaining:0,
      shield:0,
      clockBonus:0,
      feverRemaining:0,
      feverCount:0,
      lastCatcher:0,
      relayCount:0,
      bumpCount:0,
      lastRelayBonus:false,
      players:{p1:makePlayer(),p2:makePlayer()},
      done:false
    };
  }
  function resolve(state,type,caught,playerIndex=1){
    const mode=normalizeMode(state.playMode);
    const idx=playerIndex===2?2:1;
    const pk=idx===2?'p2':'p1';
    if(!state.players)state.players={p1:makePlayer(),p2:makePlayer()};
    const pl=state.players[pk];
    const inFever=(state.feverRemaining||0)>0;
    state.lastRelayBonus=false;
    let delta=0;
    if(type==='golden'){
      if(caught){
        const base=inFever?15:10;
        state.caught++;
        state.coins+=2*state.coinMultiplier;
        state.streak++;
        state.bestStreak=Math.max(state.bestStreak,state.streak);
        if(mode==='2p-vs'){
          delta=base;
          pl.score+=delta;
          pl.caught++;
          pl.streak++;
          pl.bestStreak=Math.max(pl.bestStreak,pl.streak);
        }else if(mode==='2p-coop'){
          const relay=state.lastCatcher!==0&&state.lastCatcher!==idx;
          delta=base+(relay?5:0);
          if(relay){state.relayCount++;state.lastRelayBonus=true;}
          state.lastCatcher=idx;
          pl.caught++;
          pl.score+=delta;
          pl.streak++;
          pl.bestStreak=Math.max(pl.bestStreak,pl.streak);
        }else{
          delta=base;
          pl.caught++;
          pl.streak++;
          pl.bestStreak=Math.max(pl.bestStreak,pl.streak);
        }
      }else{
        delta=-2;
        state.missed++;
        state.streak=0;
        state.lastCatcher=0;
        if(mode==='2p-vs'){
          for(const k of ['p1','p2']){
            state.players[k].score=Math.max(0,state.players[k].score-2);
            state.players[k].missed++;
            state.players[k].streak=0;
          }
        }else{
          pl.missed++;
          pl.streak=0;
        }
      }
    }else if(type==='dog'){
      if(caught&&!state.dogCaught){state.dogCaught=true;state.coinMultiplier=2;state.coins*=2;}
    }else if(type==='clock'){
      if(caught){
        if(state.clockBonus<15){state.remaining+=5;state.clockBonus+=5;}
        state.feverRemaining=5;
        state.feverCount=(state.feverCount||0)+1;
      }
    }else if(type==='coffee'){
      if(caught)state.slowRemaining=4;
    }else if(type==='cola'){
      if(caught){
        if(mode==='2p-vs'){
          pl.shield=1;
          state.shield=state.players.p1.shield+state.players.p2.shield;
        }else{
          state.shield=1;
          pl.shield=1;
        }
      }
    }else if(caught){
      if(mode==='2p-vs'){
        if(pl.shield>0){
          pl.shield=0;
          state.shield=state.players.p1.shield+state.players.p2.shield;
        }else{
          delta=type==='bomb'?-20:-10;
          pl.score=Math.max(0,pl.score+delta);
          pl.hazards++;
          pl.streak=0;
          state.hazards++;
          state.streak=0;
        }
      }else{
        if(state.shield){
          state.shield=0;
          state.players.p1.shield=0;
          state.players.p2.shield=0;
        }else{
          delta=type==='bomb'?-20:-10;
          state.hazards++;
          state.streak=0;
          state.lastCatcher=0;
          pl.hazards++;
          pl.streak=0;
        }
      }
    }
    if(mode==='2p-vs'){
      state.score=Math.max(state.players.p1.score,state.players.p2.score);
    }else{
      state.score=Math.max(0,state.score+delta);
      if(mode==='1p')state.players.p1.score=state.score;
    }
    return delta;
  }
  function tick(state,dt){
    if(state.done)return;
    state.remaining=Math.max(0,state.remaining-dt);
    state.elapsed+=dt;
    state.slowRemaining=Math.max(0,state.slowRemaining-dt);
    state.feverRemaining=Math.max(0,(state.feverRemaining||0)-dt);
    if(state.remaining<=0)state.done=true;
  }
  function bonusPlan(){return {willVisit:false,at:Infinity,variant:0};}
  function bonusType(){return null;}
  function difficultyAt(cfg,elapsed,state=null){
    const progress=Math.min(1,elapsed/cfg.duration);
    const modeScale=state?PLAY_MODES[normalizeMode(state.playMode)].rateScale:1;
    const feverBoost=state&&state.feverRemaining>0?2.2:1;
    return {
      speed:cfg.speed*(1+cfg.ramp*progress),
      rate:cfg.rate*(1+cfg.ramp*.55*progress)*modeScale*feverBoost
    };
  }
  function overlaps(item,basket,previousY){
    return item.x+item.w*.35>basket.x-basket.w/2&&item.x-item.w*.35<basket.x+basket.w/2&&previousY+item.h/2<=basket.y+12&&item.y+item.h/2>=basket.y;
  }
  function collideBaskets(b1,b2,playfieldW=960){
    const minGap=(b1.w+b2.w)*.45;
    const dx=b2.x-b1.x;
    if(Math.abs(dx)>=minGap)return {bumped:false,midX:(b1.x+b2.x)/2};
    const sign=dx>=0?1:-1;
    const mid=(b1.x+b2.x)/2;
    b1.x=mid-sign*(minGap/2+2);
    b2.x=mid+sign*(minGap/2+2);
    b1.vx=-sign*430;
    b2.vx=sign*430;
    b1.x=Math.max(b1.w/2+12,Math.min(playfieldW-b1.w/2-12,b1.x));
    b2.x=Math.max(b2.w/2+12,Math.min(playfieldW-b2.w/2-12,b2.x));
    return {bumped:true,midX:mid};
  }
  function bigCountdown(state){
    if((state.feverRemaining||0)>0){
      const sec=Math.max(1,Math.ceil(state.feverRemaining));
      const frac=state.feverRemaining-Math.floor(state.feverRemaining)||1;
      return {active:true,kind:'fever',number:sec,progress:Math.min(1,state.feverRemaining/5),pulse:frac,title:'CRUNCH FEVER!',subtitle:'+5s · GOLDEN RUSH · +15 PTS'};
    }
    if(state.remaining>0&&state.remaining<=5){
      const sec=Math.max(1,Math.ceil(state.remaining));
      const frac=state.remaining-Math.floor(state.remaining)||1;
      return {active:true,kind:'final',number:sec,progress:Math.min(1,state.remaining/5),pulse:frac,title:'FINAL COUNTDOWN',subtitle:'LAST SECONDS!'};
    }
    return {active:false,kind:'none',number:0,progress:0,pulse:0,title:'',subtitle:''};
  }
  function winnerSummary(state){
    const mode=normalizeMode(state.playMode);
    const p1=state.players?.p1||makePlayer(),p2=state.players?.p2||makePlayer();
    if(mode==='2p-vs'){
      let winner='tie';
      if(p1.score>p2.score)winner='p1';
      else if(p2.score>p1.score)winner='p2';
      else if(p1.caught>p2.caught)winner='p1';
      else if(p2.caught>p1.caught)winner='p2';
      const headline=winner==='p1'?'PLAYER 1 WINS!':winner==='p2'?'PLAYER 2 WINS!':'CRISPY TIE!';
      return {mode,winner,headline,p1Score:p1.score,p2Score:p2.score,bestScore:Math.max(p1.score,p2.score)};
    }
    if(mode==='2p-coop'){
      return {mode,winner:'coop',headline:'TEAMWORK DELICIOUS!',p1Score:p1.score,p2Score:p2.score,bestScore:state.score,relays:state.relayCount||0};
    }
    return {mode,winner:'1p',headline:'STAY GOLDEN.',p1Score:state.score,p2Score:0,bestScore:state.score};
  }
  function recordKey(level,cfg,playMode='1p'){
    const mode=normalizeMode(playMode);
    const base='crunch-course-stage-03-best:'+level+(level==='custom'?':'+[cfg.speed,cfg.rate,cfg.hazards,cfg.duration].join(','):'');
    return mode==='1p'?base:base+':'+mode;
  }
  const api={PRESETS,PLAY_MODES,normalizeMode,config,chooseType,newState,resolve,tick,difficultyAt,bonusPlan,bonusType,overlaps,collideBaskets,bigCountdown,winnerSummary,recordKey};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.CrunchRules=api;
})(typeof window!=='undefined'?window:globalThis);
