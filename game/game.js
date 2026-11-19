/* Hash Brown Catch — p5.js Arcade & 6-Stage Fast-Food Career Sketch.
 * Features:
 * 1. 6-Stage Career Progression (Street Stall -> Wallace -> Burger King -> McD -> KFC -> Blue Frog) + 4-Track Upgrade Lab.
 * 2. Evolving Catcher Gear (Mini Spatula -> Paper Fry Box -> Wire Basket -> Jumbo Gold Tray) + AI Auto Sous-Chef Bot + Crispy Magnet.
 * 3. Universal file:// & http:// Scene/Flavour/Ghost/Bomb Skin Renderer (instant live application).
 * 4. Same-screen Multiplayer (2P VS Basket-Bump PK & 2P Co-op Relay), Pixel Potato Avatar Studio, Alarm Clock 5s Fever Countdown, Leaderboard & ESC Exit.
 */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const R=window.CrunchRules, E=window.CrunchEconomy, A=window.CrunchArcade;
  const STAGE_MUTE_KEY='crunch-stage-05-muted';
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let level='medium', playMode='career', career=A.loadCareer(), careerSpec=A.careerRuntimeSpec(career);
  let cfg=playMode==='career'?careerSpec.cfg:R.config(level);
  let state=R.newState(cfg,playMode,careerSpec), mode='menu';
  let muted=read(STAGE_MUTE_KEY)==='true', audio=null, sketch=null, lastBest=0;
  let baskets=[{id:1,x:480,y:485,w:96,toolId:'spatula',isBot:false,vx:0,catches:[],shake:0,flash:0}];
  let items=[], particles=[], splats=[], ghosts=[], labels=[], relayArc=null;
  let spawnTimer=.55, comboTime=0, pointer=null, dragging=false, lastHUD='', bumpCooldown=0, spawnSeq=0;
  let W=960, H=600, keyboard=new Set(), bgImg=null, sprites={};
  let profile=E.load(), avatars=A.loadAvatars(), roundId='', dogPlan=null, dogSpawned=false;
  let overlayPaused=false, changeScene=null, lastCountdownKey='', currentRoundSavedId='';
  let dialogCloseStamp=0, manualSceneOverride=read('crunch-manual-scene')==='true', celebratedPromotion=false, confirmCareerReset=false;
  const sceneImgCache={};

  const pad=n=>String(Math.max(0,Math.floor(n))).padStart(3,'0');
  function read(key){try{return localStorage.getItem(key);}catch{return null;}}
  function write(key,val){try{localStorage.setItem(key,String(val));}catch{}}
  function best(){
    if(playMode==='career'){
      const c=A.loadCareer();
      const st=A.CAREER_STAGES[c.selectedStage]||A.CAREER_STAGES[0];
      return c.stageBests[st.id]||0;
    }
    return Number(read(R.recordKey(level,cfg,playMode)))||0;
  }
  function announce(s){const el=$('announcer');if(el)el.textContent=s;}
  function formatTime(n){n=Math.max(0,Math.ceil(n));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
  function isTwoPlayer(){return playMode==='2p-vs'||playMode==='2p-coop';}
  function anyDialogOpen(){return Boolean(document.querySelector('dialog[open]'));}

  // ---------------- PROCEDURAL SPRITES + CUSTOM PIXEL PORTRAIT + LUSH FLAVOURS ----------------
  function drawFlavourTopping(g,flavour){
    if(!flavour||flavour==='original')return;
    if(flavour==='ketchup'){
      g.fillStyle='#b82518';
      g.fillRect(8,8,22,5);g.fillRect(10,13,6,3);g.fillRect(21,13,6,4);g.fillRect(15,12,5,2);
      g.fillStyle='#e53b28';
      g.fillRect(9,7,20,5);g.fillRect(11,12,4,3);g.fillRect(22,12,4,4);
      g.fillStyle='#ff9a80';
      g.fillRect(11,8,7,2);g.fillRect(22,9,3,2);
    }else if(flavour==='cream'){
      g.fillStyle='#d9ccb4';
      g.fillRect(8,8,22,6);g.fillRect(11,14,16,2);
      g.fillStyle='#fffdf7';
      g.fillRect(9,7,20,6);g.fillRect(13,5,12,3);g.fillRect(12,13,14,2);
      g.fillStyle='#4e9a3e';
      g.fillRect(12,9,2,2);g.fillRect(18,8,3,1);g.fillRect(23,10,2,2);g.fillRect(15,11,2,2);
    }else if(flavour==='maple'){
      g.fillStyle='#8c4914';
      g.fillRect(7,7,24,6);g.fillRect(9,13,4,6);g.fillRect(18,13,4,4);g.fillRect(26,13,4,7);
      g.fillStyle='#d47e24';
      g.fillRect(8,6,22,6);g.fillRect(10,12,3,6);g.fillRect(19,12,3,4);g.fillRect(27,12,2,7);
      g.fillStyle='#ffe891';
      g.fillRect(15,6,8,5);g.fillRect(16,7,6,3);
    }
  }

  function makePotato(frame=0,burnt=false,mascot=false,flavour='original',avatarHex=''){
    const c=document.createElement('canvas');c.width=40;c.height=52;const g=c.getContext('2d');
    const P=burnt?{b:'#4c382a',c:'#6a4e39',m:'#87664c',f:'#9a785c',h:'#b18f71'}:{b:'#7b4118',c:'#cd781e',m:'#efa632',f:'#ffc64c',h:'#ffe58f'};
    const rows=[[5,15,24],[6,11,28],[7,9,30],[8,7,32],[9,6,33],[10,6,33],[11,5,34],[12,5,34],[42,6,33],[43,6,33],[44,7,32],[45,9,30],[46,11,28],[47,15,24]];
    const shape=new Map(rows.map(([y,l,r])=>[y,[l,r]]));for(let y=13;y<=41;y++)shape.set(y,[4,35]);
    for(const [y,[l,r]] of shape){
      for(let x=l;x<=r;x++){
        const prev=shape.get(y-1),next=shape.get(y+1);
        const edge=!prev||!next||x<=l||x>=r||x<prev[0]||x>prev[1]||x<next[0]||x>next[1];
        const crust=!edge&&(x<=l+2||x>=r-2||y<=8||y>=44);
        g.fillStyle=edge?P.b:crust?P.c:(y<14&&x<24)?P.h:(y>38||x>30)?P.m:P.f;
        g.fillRect(x,y,1,1);
      }
    }
    if(mascot){
      g.fillStyle=P.b;
      const wave=frame%2?1:0;
      g.fillRect(1,26-wave,3,3);g.fillRect(36,25+wave,3,3);
      g.fillRect(12,48,4,3);g.fillRect(24,48,4,3);
      g.fillStyle=P.c;g.fillRect(2,27-wave,2,2);g.fillRect(36,26+wave,2,2);
    }

    const hasCustom=!burnt&&A.isHexStream(avatarHex);
    if(hasCustom){
      const yShift=frame===2?-1:0;
      for(let gy=0;gy<A.GRID;gy++){
        for(let gx=0;gx<A.GRID;gx++){
          if(!A.insidePotatoMask(gx,gy))continue;
          const py=13+gy+yShift,px=7+gx;
          const bounds=shape.get(py);
          if(!bounds||px<bounds[0]+2||px>=bounds[1]-2)continue;
          const off=(gy*A.GRID+gx)*6;
          g.fillStyle='#'+avatarHex.slice(off,off+6);
          g.fillRect(px,py,1,1);
        }
      }
      drawFlavourTopping(g,flavour);
      if(frame===1||frame===2){
        g.fillStyle='#fff8dd';g.fillRect(28,12,2,2);
      }
      return c;
    }

    if(!burnt){
      g.fillStyle='#efb13c';g.fillRect(17,14,4,2);g.fillRect(23,18,3,2);g.fillRect(11,21,3,1);g.fillRect(12,36,4,2);g.fillRect(23,38,3,1);
      g.fillStyle='#d98922';g.fillRect(4,17,2,4);g.fillRect(32,23,2,3);g.fillRect(8,39,3,2);
      g.fillStyle='#ffe290';g.fillRect(12,16,2,3);g.fillRect(25,15,2,2);g.fillRect(8,33,2,2);
      drawFlavourTopping(g,flavour);
      g.fillStyle='#f59673';g.fillRect(8,29,5,2);g.fillRect(26,29,5,2);
    }
    g.fillStyle=burnt?'#523825':'#60391e';
    if(burnt){
      for(const x of [12,24]){g.fillRect(x,24,2,2);g.fillRect(x+2,26,2,2);g.fillRect(x+2,24,2,2);g.fillRect(x,26,2,2);}
      g.fillRect(18,33,5,1);
    }else if(frame===2){
      g.fillRect(11,26,2,2);g.fillRect(13,24,2,2);g.fillRect(15,26,2,2);
      g.fillRect(24,26,2,2);g.fillRect(26,24,2,2);g.fillRect(28,26,2,2);
    }else if(frame===3){
      g.fillRect(12,26,4,1);g.fillRect(25,26,4,1);
    }else{
      g.fillRect(12,24,3,4);g.fillRect(25,24,3,4);
      g.fillStyle='#fff8dd';g.fillRect(12,24,1,1);g.fillRect(25,24,1,1);
    }
    if(!burnt){
      g.fillStyle='#754121';
      if(frame===1||frame===2){
        g.fillRect(18,31,6,3);g.fillRect(19,34,4,1);
        g.fillStyle='#f29279';g.fillRect(19,33,4,1);
      }else{
        g.fillRect(18,31,1,2);g.fillRect(19,33,4,1);g.fillRect(23,31,1,2);
      }
    }
    return c;
  }

  function makeBomb(frame=0,kind='chili'){
    const c=document.createElement('canvas');c.width=36;c.height=42;const g=c.getContext('2d');
    const block=(color,x,y,w,h)=>{const map=kind==='pepper'?{'#743027':'#463b32','#a92424':'#665343','#e24a2b':'#887057','#fb7550':'#b39870','#f9a06a':'#d4ba8a'}:{};g.fillStyle=map[color]||color;g.fillRect(x,y,w,h);};
    block('#60311f',16,7,7,7);block('#56813f',17,4,4,9);block('#80a04b',20,2,7,4);block('#743027',8,14,21,20);block('#743027',5,18,26,12);block('#a92424',8,16,20,17);block('#e24a2b',8,18,16,12);block('#fb7550',9,18,5,8);block('#f9a06a',10,17,4,4);block('#522921',12,25,3,3);block('#522921',23,25,3,3);block('#522921',17,30,5,2);block('#fcbb36',28,7,3,3);block('#ffe894',30,4+(frame%2)*2,3,3);block('#b85c25',26,10,2,5);block('#60311f',11,34,15,3);
    if(kind==='tomato'){g.clearRect(0,0,36,42);block('#8b2f23',8,13,22,21);block('#8b2f23',5,17,28,13);block('#e85735',8,16,22,16);block('#ff9d65',10,18,5,6);block('#668348',13,10,14,4);block('#79994f',17,6,4,12);block('#522921',13,23,3,3);block('#522921',24,23,3,3);block('#fff0b3',20,28,2,5);block('#f3b035',29,7,3,3);block('#fff0b3',31,4+frame%2,3,3);}
    return c;
  }
  function makePowerup(kind){
    const c=document.createElement('canvas');c.width=40;c.height=48;const g=c.getContext('2d');const b=(co,x,y,w,h)=>{g.fillStyle=co;g.fillRect(x,y,w,h);};
    if(kind==='clock'){b('#8a4932',7,12,26,24);b('#8a4932',4,17,32,14);b('#fff0bd',9,14,22,20);b('#f8d981',7,18,26,12);b('#fff6d7',10,16,20,15);b('#d34d35',6,7,10,6);b('#d34d35',25,7,10,6);b('#75492f',12,36,4,4);b('#75492f',26,36,4,4);b('#75492f',19,18,2,9);b('#75492f',20,25,8,2);}
    else if(kind==='coffee'){b('#71442b',6,18,25,19);b('#71442b',29,20,8,12);b('#fff4d9',8,20,21,15);b('#fff4d9',31,22,4,8);b('#7b4429',9,18,20,4);b('#e6bc7e',11,19,12,1);b('#d34d35',9,26,20,5);b('#a88660',4,38,31,3);b('#d8c2a2',12,5,2,8);b('#d8c2a2',22,7,2,8);}
    else{b('#65422e',15,4,12,5);b('#875b34',13,9,16,7);b('#65422e',10,16,22,25);b('#b86b38',12,17,18,22);b('#dc4e36',11,24,20,11);b('#fff0d1',13,27,16,5);b('#fff0d1',16,9,2,9);b('#e3a05d',13,18,3,6);}
    return c;
  }
  function makeDog(variant=0,frame=0){
    const c=document.createElement('canvas');c.width=56;c.height=58;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(makePotato(frame,false,false),8,3);const b=(co,x,y,w,h)=>{g.fillStyle=co;g.fillRect(x,y,w,h);};
    b('#8d4f2b',1,17,10,18);b('#8d4f2b',43,17,10,18);b('#b7753a',3,19,5,12);b('#b7753a',46,19,5,12);b('#8d4f2b',17,45,5,8);b('#8d4f2b',33,45,5,8);b('#e9a140',14,46,8,4);b('#e9a140',33,46,8,4);
    const accent=['#66519b','#c94e32','#4b9594'][variant%3];
    if(variant===0){b(accent,17,24,23,7);b('#fff3d0',20,26,4,2);b('#fff3d0',32,26,4,2);}
    else if(variant===1){b(accent,17,6,5,8);b(accent,34,6,5,8);b('#754121',20,26,5,2);b('#754121',31,26,5,2);}
    else{b(accent,12,11,34,5);b(accent,9,16,4,10);b(accent,43,16,4,10);b('#b8ece0',17,11,16,2);}
    b('#eec479',20,32,16,8);b('#573a26',25,32,6,3);b('#754121',23,38,11,2);b('#fff3d7',31,38,2,3);b(accent,22,44,12,3);return c;
  }
  function makeMash(){const c=document.createElement('canvas');c.width=50;c.height=23;const g=c.getContext('2d');const r=(co,x,y,w,h)=>{g.fillStyle=co;g.fillRect(x,y,w,h);};r('#88745c',4,14,42,5);r('#88745c',9,10,31,8);r('#88745c',15,6,22,10);r('#88745c',19,4,11,9);r('#c9b898',5,15,40,3);r('#dbcbab',10,12,29,5);r('#dbcbab',16,8,20,6);r('#dbcbab',20,6,9,6);r('#efe0bc',17,9,8,2);r('#5d4431',18,13,3,3);r('#5d4431',31,13,3,3);r('#5d4431',25,17,3,2);r('#5d4431',23,18,2,2);r('#5d4431',28,18,2,2);r('#cb9b86',13,16,4,2);r('#cb9b86',35,16,4,2);return c;}
  function makeGhost(frame=0,color='#fff8e7'){const c=document.createElement('canvas');c.width=16;c.height=24;const g=c.getContext('2d');const r=(co,x,y,w,h)=>{g.fillStyle=co==='#fff8e7'?color:co;g.fillRect(x,y,w,h);};r('#c9c0ac',5,1,7,2);r('#c9c0ac',2,3,12,11);r('#c9c0ac',4,13,8,4);r('#c9c0ac',6,17,5,4);r('#c9c0ac',4+frame%2,20,5,2);r('#fff8e7',4,4,8,9);r('#fff8e7',5,12,5,4);r('#fff8e7',7,16,3,3);r('#938576',5,6,2,3);r('#938576',10,6,2,3);r('#b0a18c',8,11,2,2);return c;}

  // Pixel preview icons for the 4 Upgrade Lab tracks
  function makeUpgradeIcon(trackId,level=1){
    const c=document.createElement('canvas');c.width=48;c.height=38;const g=c.getContext('2d');
    const b=(co,x,y,w,h)=>{g.fillStyle=co;g.fillRect(x,y,w,h);};
    if(trackId==='tool'){
      const tid=['spatula','carton','basket','tray'][Math.min(3,level)];
      if(tid==='spatula'){
        b('#58636d',8,16,24,7);b('#aeb9c4',9,17,22,4);
        b('#58636d',12,18,2,3);b('#58636d',17,18,2,3);b('#58636d',22,18,2,3);
        b('#6e7b85',32,14,5,3);b('#b63827',36,11,10,6);b('#ff9878',37,12,8,2);
      }else if(tid==='carton'){
        b('#8f241b',10,9,28,22);b('#d93829',12,10,24,20);
        for(let x=14;x<=32;x+=6)b('#fff6e5',x,11,3,18);
        b('#f5c547',10,8,28,3);
      }else if(tid==='basket'){
        b('#52473a',8,12,32,18);b('#d9d6c7',10,14,28,14);
        for(let x=13;x<=33;x+=5)b('#7d7567',x,14,2,14);
        b('#ae6034',2,9,7,5);b('#ae6034',39,9,7,5);
      }else{
        b('#7a4b14',4,15,40,12);b('#ffd454',6,16,36,9);b('#8c2323',9,17,30,4);
        b('#fff5be',10,15,12,2);b('#e89c25',1,12,5,5);b('#e89c25',42,12,5,5);
      }
    }else if(trackId==='bot'){
      b('#355263',12,15,24,14);b('#7cdbd5',14,17,20,10);
      b('#223845',17,19,4,4);b('#223845',27,19,4,4);
      b('#526c7a',23,7,2,8);b(level>=2?'#ffd24c':'#ff6b57',21,4,6,5);
      b('#c93829',8,26,32,5);
    }else if(trackId==='magnet'){
      b('#c93429',11,8,8,18);b('#c93429',29,8,8,18);b('#c93429',15,22,18,7);
      b('#dfe6ed',11,6,8,5);b('#dfe6ed',29,6,8,5);
      b('#ffd24a',21,10,6,3);b('#ffd24a',19,15,10,2);
    }else{
      b('#e6a22e',10,14,28,15);b('#ffd86b',12,16,24,11);
      b('#ffd86b',10,9,6,6);b('#ffd86b',21,7,6,8);b('#ffd86b',32,9,6,6);
      b('#d13829',22,19,4,4);
    }
    return c;
  }

  function drawScaledSprite(canvas,sprite,padW=8,padH=4){
    if(!canvas||typeof canvas.getContext!=='function'||!sprite)return;
    const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,canvas.width,canvas.height);
    const scale=Math.min(canvas.width/(sprite.width+padW),canvas.height/(sprite.height+padH));
    g.drawImage(sprite,(canvas.width-sprite.width*scale)/2,(canvas.height-sprite.height*scale)/2,sprite.width*scale,sprite.height*scale);
  }
  function drawAsset(canvas,type){
    let sprite=type==='bomb'?sprites.bomb[0]:type==='burnt'?sprites.burnt:sprites.golden[0];
    drawScaledSprite(canvas,sprite,8,4);
  }
  function renderWelcomeMascots(){
    const c1=$('mascot-art-p1'),c2=$('mascot-art-p2'),wrap=$('welcome-art');
    if(c1&&sprites.mascotP1)drawScaledSprite(c1,sprites.mascotP1[1],4,4);
    if(c2&&sprites.mascotP2){
      c2.hidden=!isTwoPlayer();
      if(isTwoPlayer())drawScaledSprite(c2,sprites.mascotP2[2],4,4);
    }
    if(wrap)wrap.classList.toggle('is-duo',isTwoPlayer());
    const bubble=$('mascot-bubble');
    if(bubble){
      if(playMode==='career'){
        bubble.innerHTML=careerSpec.stageIndex===0?'tiny spatula,<br/>big dreams!':`next stop:<br/>${careerSpec.stageName}!`;
      }else{
        bubble.innerHTML=avatars.p1.hex?(isTwoPlayer()?'ready to<br/>duel!':'looking<br/>extra crispy!'):(isTwoPlayer()?'two baskets!<br/>let\'s go!':'put your face<br/>on me!');
      }
    }
  }

  // Universal scene resolver (works identically on file:// double-click AND http:// server!)
  function setManualScene(value){manualSceneOverride=value;try{localStorage.setItem('crunch-manual-scene',String(value));}catch{}}

  function currentSceneAsset(){
    profile=E.load();
    if(playMode==='career'&&!manualSceneOverride){
      career=A.loadCareer();
      careerSpec=A.careerRuntimeSpec(career);
      return careerSpec.asset;
    }
    const entry=E.CATALOG.find(a=>a.id===profile.equipped.scene)||E.CATALOG[0];
    return entry?.asset||'assets/diner.png';
  }

  function applySceneNow(){
    const asset=currentSceneAsset();
    const pf=$('playfield');
    if(pf)pf.style.backgroundImage=`url("${asset}")`;
    if(sceneImgCache[asset]&&sceneImgCache[asset].complete&&sceneImgCache[asset].naturalWidth>0){
      bgImg=sceneImgCache[asset];
      return;
    }
    const im=new Image();
    im.onload=()=>{
      sceneImgCache[asset]=im;
      if(currentSceneAsset()===asset)bgImg=im;
    };
    im.onerror=()=>{
      if(currentSceneAsset()===asset)bgImg=null;
    };
    im.src=asset;
  }
  changeScene=applySceneNow;

  function refreshArt(){
    profile=E.load();
    avatars=A.loadAvatars();
    career=A.loadCareer();
    careerSpec=A.careerRuntimeSpec(career);
    const flavour=profile.equipped.flavour;
    const ghostEntry=E.CATALOG.find(a=>a.id===profile.equipped.ghost)||E.CATALOG.find(a=>a.category==='ghost');
    const ghostColor=profile.equipped.ghost==='custom'?profile.ghostColor:(ghostEntry?.color||'#fff8e7');
    sprites={
      goldenP1:[0,1,2,3].map(f=>makePotato(f,false,false,flavour,avatars.p1.hex)),
      goldenP2:[0,1,2,3].map(f=>makePotato(f,false,false,flavour,avatars.p2.hex)),
      mascotP1:[0,1,2,3].map(f=>makePotato(f,false,true,flavour,avatars.p1.hex)),
      mascotP2:[0,1,2,3].map(f=>makePotato(f,false,true,flavour,avatars.p2.hex)),
      burnt:makePotato(0,true),
      bomb:[0,1].map(f=>makeBomb(f,profile.equipped.bomb)),
      mash:makeMash(),
      ghost:[0,1].map(f=>makeGhost(f,ghostColor)),
      dog:[0,1,2].map(v=>[0,1].map(f=>makeDog(v,f))),
      clock:makePowerup('clock'),
      coffee:makePowerup('coffee'),
      cola:makePowerup('cola')
    };
    sprites.golden=sprites.goldenP1;
    sprites.mascot=sprites.mascotP1;
    for(const c of document.querySelectorAll('canvas[data-item]'))drawAsset(c,c.dataset.item);
    renderWelcomeMascots();
    applySceneNow();
  }

  window.CrunchArt={
    draw(canvas,category,id){
      let c;
      if(category==='flavour')c=makePotato(1,false,true,id,'');
      else if(category==='ghost'){
        const ge=E.CATALOG.find(a=>a.id===id);
        c=makeGhost(0,id==='custom'?E.load().ghostColor:(ge?.color||'#fff8e7'));
      }
      else if(category==='bomb')c=makeBomb(0,id);
      else if(category==='dog')c=makeDog(Number(id),1);
      else if(category==='avatar')c=makePotato(1,false,true,profile.equipped.flavour,id||'');
      else c=makePowerup(id);
      drawScaledSprite(canvas,c,10,8);
    },
    makePotato
  };

  window.addEventListener('crunch-manual-equip',e=>{
    initAudio();
    sound('catch');
    if(e.detail?.category==='scene')setManualScene(true);
    refreshArt();
  });
  window.addEventListener('crunch-profile-change',e=>{
    if(e.detail?.reason!=='credit')refreshArt();
    if($('upgrade-dialog')?.open)renderUpgradeModal();
  });
  window.addEventListener('crunch-avatar-change',()=>{refreshArt();renderMiniBoard();});
  window.addEventListener('crunch-career-change',()=>{
    career=A.loadCareer();
    careerSpec=A.careerRuntimeSpec(career);
    renderCareerPanel();
    if($('upgrade-dialog')?.open)renderUpgradeModal();
    if(mode==='menu')updateConfig();
  });
  refreshArt();

  // Web Audio synthesizer
  function initAudio(){try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
  function tone(freq,time,duration,volume=.04,type='square',endFreq){
    if(!audio||muted)return;
    const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+time;
    o.type=type;o.frequency.setValueAtTime(freq,t);
    if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,t+duration);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration+.02);
  }
  function noise(duration,cutoff=3500,volume=.08){
    if(!audio||muted)return;
    const n=Math.ceil(audio.sampleRate*duration),b=audio.createBuffer(1,n,audio.sampleRate),data=b.getChannelData(0);
    for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*(1-i/n)**2;
    const s=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();
    s.buffer=b;f.type='lowpass';f.frequency.value=cutoff;g.gain.value=volume;
    s.connect(f);f.connect(g);g.connect(audio.destination);s.start();
  }
  function sound(kind,step=1){
    if(muted)return;
    if(kind==='catch'){noise(.12,6500,.17);tone(1100,0,.06,.02,'triangle');tone(1500,.035,.06,.018,'triangle');}
    else if(kind==='relay'){tone(880,0,.07,.03,'triangle');tone(1175,.05,.08,.03,'triangle');tone(1568,.1,.12,.032,'triangle');}
    else if(kind==='promote'){[523,659,784,1046,1318,1568].forEach((f,i)=>tone(f,i*.06,.16,.042,'triangle'));}
    else if(kind==='upgrade'){[659,880,1175,1568].forEach((f,i)=>tone(f,i*.05,.12,.038,'triangle'));}
    else if(kind==='bump'){noise(.08,1800,.14);tone(260,0,.09,.045,'square',120);}
    else if(kind==='feverStart'){[659,784,988,1318,1568].forEach((f,i)=>tone(f,i*.055,.14,.04,'triangle'));}
    else if(kind==='feverTick'){const f=784+(6-Math.min(5,Math.max(1,step)))*110;tone(f,0,.09,.035,'triangle');tone(f*1.5,.04,.07,.02,'sine');}
    else if(kind==='finalTick'){tone(step===1?988:660,0,.11,.035,'square');}
    else if(kind==='miss'){noise(.18,280,.16);tone(170,0,.22,.045,'sine',65);}
    else if(kind==='bomb'){noise(.24,900,.17);tone(90,0,.25,.06,'triangle',35);}
    else if(kind==='burnt'){tone(180,0,.1,.035,'sawtooth',90);tone(110,.09,.13,.025,'triangle',70);}
    else if(kind==='start'){[523,659,784,1046].forEach((f,i)=>tone(f,i*.07,.13,.035,'triangle'));}
    else if(kind==='end'){[784,659,523,1046].forEach((f,i)=>tone(f,i*.13,.2,.035,'triangle'));}
    else tone(700,0,.045,.025,'triangle');
  }
  function refreshSound(){
    const b=$('sound-button');
    b.textContent=muted?'♫̸':'♪';
    b.setAttribute('aria-label',muted?'Enable sound':'Mute sound');
    b.setAttribute('aria-pressed',String(muted));
    b.title=muted?'Enable sound':'Mute sound';
  }
  $('sound-button').addEventListener('click',()=>{initAudio();muted=!muted;write(STAGE_MUTE_KEY,muted);refreshSound();if(!muted)sound('click');});
  refreshSound();

  function setupBaskets(){
    const by=H-100;
    const mScale=H>700?1.18:1;
    if(playMode==='career'){
      career=A.loadCareer();
      careerSpec=A.careerRuntimeSpec(career);
      const pw=Math.round(careerSpec.tool.width*mScale);
      baskets=[{
        id:1,
        x:careerSpec.bot.active?W*0.38:W/2,
        y:by,
        w:pw,
        toolId:careerSpec.tool.toolId,
        speedMult:careerSpec.tool.speedMult||1,
        isBot:false,
        vx:0,
        catches:[],
        shake:0,
        flash:0
      }];
      if(careerSpec.bot.active){
        baskets.push({
          id:3,
          x:W*0.70,
          y:by+4,
          w:Math.round(careerSpec.bot.width*mScale),
          toolId:careerSpec.bot.botTool||'spatula',
          speed:careerSpec.bot.speed*(H>700?1.15:1),
          chasePowerups:Boolean(careerSpec.bot.chasePowerups),
          isBot:true,
          vx:0,
          catches:[],
          shake:0,
          flash:0
        });
      }
      return;
    }
    const bw=isTwoPlayer()?(H>700?170:144):(H>700?200:162);
    if(isTwoPlayer()){
      baskets=[
        {id:1,x:W*0.31,y:by,w:bw,toolId:'basket',isBot:false,vx:0,catches:[],shake:0,flash:0},
        {id:2,x:W*0.69,y:by,w:bw,toolId:'basket',isBot:false,vx:0,catches:[],shake:0,flash:0}
      ];
    }else{
      baskets=[{id:1,x:W/2,y:by,w:bw,toolId:'basket',isBot:false,vx:0,catches:[],shake:0,flash:0}];
    }
  }

  function getCustom(){
    return {
      speed:Number($('speed-setting').value),
      rate:Number($('rate-setting').value),
      hazards:Number($('hazards-setting').value)/100,
      duration:Number($('duration-setting').value)
    };
  }

  function syncScoreboardLabels(){
    const p1Cell=$('primary-score-cell'),p2Cell=$('secondary-score-cell');
    p1Cell.classList.toggle('p1-accent',playMode==='2p-vs');
    p2Cell.classList.toggle('p2-accent',playMode==='2p-vs');
    p2Cell.classList.toggle('career-accent',playMode==='career');
    if(playMode==='career'){
      $('score-label').textContent='SHIFT SCORE';
      $('best-label').textContent='PROMOTE TARGET';
      $('score').textContent=pad(state.score||0);
      $('best').textContent=pad(careerSpec.targetScore||80);
    }else if(playMode==='2p-vs'){
      $('score-label').textContent=(avatars.p1.name||'P1').slice(0,8)+' (P1)';
      $('best-label').textContent=(avatars.p2.name||'P2').slice(0,8)+' (P2)';
      $('score').textContent=pad(state.players?.p1?.score||0);
      $('best').textContent=pad(state.players?.p2?.score||0);
    }else if(playMode==='2p-coop'){
      $('score-label').textContent='TEAM SCORE';
      $('best-label').textContent=mode==='playing'||mode==='paused'?'RELAY COMBOS':'TEAM BEST';
      $('score').textContent=pad(state.score||0);
      $('best').textContent=mode==='playing'||mode==='paused'?pad(state.relayCount||0):pad(best());
    }else{
      $('score-label').textContent='SCORE';
      $('best-label').textContent='PERSONAL BEST';
      $('score').textContent=pad(state.score||0);
      $('best').textContent=pad(best());
    }
  }

  function updateControlsHint(){
    const hint=$('controls-hint');
    if(!hint)return;
    if(isTwoPlayer()){
      hint.innerHTML='P1 <kbd>A</kbd><kbd>D</kbd> · P2 <kbd>←</kbd><kbd>→</kbd>/drag <span class="desktop-hint">· <kbd>SPACE</kbd> pause · <kbd>ESC</kbd> exit</span>';
    }else if(playMode==='career'&&careerSpec.bot.active){
      hint.innerHTML='You + <b>AUTO-BOT</b> twin catch! <kbd>←</kbd><kbd>→</kbd> / drag <span class="desktop-hint">· <kbd>SPACE</kbd> pause · <kbd>ESC</kbd> exit</span>';
    }else{
      hint.innerHTML='<kbd>←</kbd><kbd>→</kbd> / <kbd>A</kbd><kbd>D</kbd> or drag <span class="desktop-hint">· <kbd>SPACE</kbd> pause · <kbd>ESC</kbd> exit</span>';
    }
  }

  // ---------------- CAREER PANEL & UPGRADE LAB UI ----------------
  function renderCareerPanel(){
    career=A.loadCareer();
    careerSpec=A.careerRuntimeSpec(career);
    const list=$('career-stage-list');
    if(list){
      list.replaceChildren();
      for(const st of A.CAREER_STAGES){
        const unlocked=st.index<=career.unlockedStage;
        const active=st.index===career.selectedStage;
        const cleared=career.clearedStages.includes(st.id);
        const bestVal=career.stageBests[st.id]||0;
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='career-stage-btn'+(active?' active':'')+(cleared?' cleared':'');
        btn.disabled=!unlocked||mode==='playing'||mode==='paused';
        const num=document.createElement('span');
        num.className='career-step-num';
        num.textContent=cleared?'✓':unlocked?String(st.index+1):'🔒';
        const info=document.createElement('div');
        info.className='career-stage-info';
        info.innerHTML=`<strong>${st.name}</strong><small>${unlocked?st.title:'Clear previous stage to unlock'}</small>`;
        const meta=document.createElement('div');
        meta.className='career-stage-meta';
        meta.innerHTML=`<b>${st.targetScore} PTS</b><span>${bestVal?('BEST '+bestVal):(st.wageMult+'× COIN')}</span>`;
        btn.append(num,info,meta);
        btn.addEventListener('click',()=>{
          if(mode==='playing'||mode==='paused')return;
          setManualScene(false);
          A.selectCareerStage(st.index);
          if(E.CATALOG.some(a=>a.id===st.sceneId))E.grant(st.sceneId,true);
          updateConfig();
          applySceneNow();
          sound('click');
        });
        list.append(btn);
      }
    }
    if($('panel-gear-summary'))$('panel-gear-summary').textContent=careerSpec.tool.name.split(' · ')[0];
    const tags=$('panel-upgrade-tags');
    if(tags){
      tags.replaceChildren();
      const itemsTag=[
        `Tool Lv.${career.equippedTool+1}`,
        career.upgrades.bot?`Auto-Bot Lv.${career.upgrades.bot}`:'No Bot',
        career.upgrades.magnet?`Magnet Lv.${career.upgrades.magnet}`:'No Magnet',
        career.upgrades.chef?`Chef Lv.${career.upgrades.chef}`:'Trainee'
      ];
      for(const t of itemsTag){
        const s=document.createElement('span');
        s.className='loadout-chip';
        s.textContent=t;
        tags.append(s);
      }
    }
  }

  function renderUpgradeModal(){
    career=A.loadCareer();
    careerSpec=A.careerRuntimeSpec(career);
    const wallet=E.load().wallet;
    if($('upgrade-wallet'))$('upgrade-wallet').textContent=wallet.toLocaleString('en');

    const ribbon=$('dialog-career-ribbon');
    if(ribbon){
      ribbon.replaceChildren();
      for(const st of A.CAREER_STAGES){
        const unlocked=st.index<=career.unlockedStage;
        const active=st.index===career.selectedStage;
        const cleared=career.clearedStages.includes(st.id);
        const b=document.createElement('button');
        b.type='button';
        b.className='ribbon-stop'+(active?' active':'')+(cleared?' cleared':'');
        b.disabled=!unlocked;
        b.innerHTML=`<strong>${st.index+1}. ${st.name}</strong><small>${cleared?'✓ CLEARED':unlocked?(st.targetScore+' PTS'):'LOCKED'}</small>`;
        b.addEventListener('click',()=>{
          setManualScene(false);
          A.selectCareerStage(st.index);
          if(E.CATALOG.some(a=>a.id===st.sceneId))E.grant(st.sceneId,true);
          if(playMode!=='career')playMode='career';
          updateConfig();
          applySceneNow();
          renderUpgradeModal();
          sound('click');
        });
        ribbon.append(b);
      }
    }

    const grid=$('upgrade-tracks-grid');
    if(!grid)return;
    grid.replaceChildren();
    for(const key of ['tool','bot','magnet','chef']){
      const track=A.UPGRADE_TRACKS[key];
      const curLv=career.upgrades[key]||0;
      const maxLv=track.tiers.length-1;
      const curTier=track.tiers[curLv];
      const nextTier=curLv<maxLv?track.tiers[curLv+1]:null;

      const card=document.createElement('article');
      card.className='upgrade-card';

      const top=document.createElement('div');
      top.className='upgrade-card-top';
      const iconC=document.createElement('canvas');
      iconC.width=64;iconC.height=52;
      drawScaledSprite(iconC,makeUpgradeIcon(key,key==='tool'?career.equippedTool:(nextTier?curLv+1:curLv)),4,4);
      const titleWrap=document.createElement('div');
      titleWrap.className='upgrade-card-title';
      titleWrap.innerHTML=`<h3>${track.title}</h3><span>${track.subtitle}</span>`;
      top.append(iconC,titleWrap);

      const pips=document.createElement('div');
      pips.className='upgrade-pips';
      for(let i=1;i<=maxLv;i++){
        const pip=document.createElement('span');
        pip.className='upgrade-pip'+(i<=curLv?' on':'');
        pips.append(pip);
      }

      const curName=document.createElement('div');
      curName.className='upgrade-cur-name';
      curName.textContent=`Current: ${key==='tool'?track.tiers[career.equippedTool].name:curTier.name}`;

      const desc=document.createElement('p');
      desc.className='upgrade-desc';
      desc.textContent=nextTier?`Next (${nextTier.name}): ${nextTier.desc}`:`MAX LEVEL UNLOCKED! ${curTier.desc}`;

      const actions=document.createElement('div');
      actions.className='upgrade-card-actions';

      if(nextTier){
        const buyBtn=document.createElement('button');
        buyBtn.type='button';
        buyBtn.className='small-button';
        buyBtn.disabled=wallet<nextTier.cost;
        buyBtn.textContent=wallet>=nextTier.cost?`⚡ UPGRADE · ◈ ${nextTier.cost}`:`NEED ${nextTier.cost-wallet} MORE (◈ ${nextTier.cost})`;
        buyBtn.addEventListener('click',()=>{
          initAudio();
          const res=A.upgradeTrack(key,E);
          if($('upgrade-status'))$('upgrade-status').textContent=res.message;
          if(res.ok){
            sound('upgrade');
            setupBaskets();
            updateConfig();
            renderUpgradeModal();
          }
        });
        actions.append(buyBtn);
      }else{
        const maxTag=document.createElement('span');
        maxTag.className='loadout-chip';
        maxTag.textContent='✓ MAXED OUT';
        actions.append(maxTag);
      }

      if(key==='tool'&&curLv>0){
        const sw=document.createElement('div');
        sw.className='tool-switcher';
        for(let lv=0;lv<=curLv;lv++){
          const tb=document.createElement('button');
          tb.type='button';
          tb.className='tool-chip'+(career.equippedTool===lv?' active':'');
          tb.textContent=track.tiers[lv].name.split(' · ')[0];
          tb.addEventListener('click',()=>{
            A.selectCatcherTool(lv);
            setupBaskets();
            updateConfig();
            renderUpgradeModal();
            sound('click');
          });
          sw.append(tb);
        }
        actions.append(sw);
      }

      card.append(top,pips,curName,desc,actions);
      grid.append(card);
    }
  }

  function openUpgradeLab(){
    initAudio();
    confirmCareerReset=false;
    if($('reset-career-button'))$('reset-career-button').textContent='Reset career progress';
    renderUpgradeModal();
    openManagedDialog($('upgrade-dialog'));
  }

  for(const id of ['upgrade-button','welcome-upgrade-button','panel-upgrade-button','results-open-upgrades']){
    $(id)?.addEventListener('click',openUpgradeLab);
  }
  for(const id of ['close-upgrade','upgrade-done']){
    $(id)?.addEventListener('click',()=>$('upgrade-dialog').close());
  }
  $('demo-grant-button')?.addEventListener('click',()=>{
    initAudio();
    const txId='demo-grant-'+Date.now();
    E.bank(txId,800);
    const c=A.loadCareer();
    c.unlockedStage=A.CAREER_STAGES.length-1;
    A.saveCareer(c);
    for(const st of A.CAREER_STAGES){
      if(E.CATALOG.some(a=>a.id===st.sceneId))E.grant(st.sceneId,false);
    }
    if($('upgrade-status'))$('upgrade-status').textContent='✦ Tutor Demo Mode: +800 coins granted & all 6 restaurant kitchens unlocked!';
    sound('promote');
    updateConfig();
    renderUpgradeModal();
  });
  $('reset-career-button')?.addEventListener('click',()=>{
    if(!confirmCareerReset){
      confirmCareerReset=true;
      $('reset-career-button').textContent='Click again to reset stages & upgrades';
      return;
    }
    A.resetCareer();
    setManualScene(false);
    confirmCareerReset=false;
    $('reset-career-button').textContent='Reset career progress';
    setupBaskets();
    updateConfig();
    applySceneNow();
    renderUpgradeModal();
    sound('click');
  });

  function updateConfig(){
    career=A.loadCareer();
    careerSpec=A.careerRuntimeSpec(career);
    const isCareer=playMode==='career';
    cfg=isCareer?careerSpec.cfg:R.config(level,getCustom());
    const mInfo=R.PLAY_MODES[playMode];

    if($('career-panel'))$('career-panel').hidden=!isCareer;
    if($('arcade-difficulty-panel'))$('arcade-difficulty-panel').hidden=isCareer;
    if($('panel-order-tag'))$('panel-order-tag').textContent=isCareer?`STAGE 0${careerSpec.stageIndex+1}`:'ARCADE';

    if(!isCareer)$('custom-settings').hidden=level!=='custom';
    $('round-summary').textContent=cfg.duration+' SEC';
    $('speed-summary').textContent=cfg.speed.toFixed(2).replace(/\.00$/,'')+'×';
    $('hazard-summary').textContent=Math.round(cfg.hazards*100)+'%';
    $('difficulty-description').textContent=isCareer?careerSpec.cfg.description:(level==='custom'?'Your recipe, your rush. Drops gradually speed up during the round.':cfg.description);

    if($('mode-description'))$('mode-description').textContent=mInfo.description;
    if(isCareer){
      if($('welcome-mode-pill'))$('welcome-mode-pill').textContent=`${careerSpec.badge} · ${careerSpec.tool.name.split(' · ')[0]}`;
      if($('welcome-headline'))$('welcome-headline').innerHTML=`${careerSpec.enName.toUpperCase()}.<br/>AIM FOR ${careerSpec.targetScore} PTS!`;
      if($('welcome-desc'))$('welcome-desc').textContent=`Current kitchen: ${careerSpec.stageName}. Gear: ${careerSpec.tool.name}${careerSpec.bot.active?' + '+careerSpec.bot.name:''}. Earn ${Math.round(2*careerSpec.wageMult)} coins per catch.`;
      if($('start-button-label'))$('start-button-label').textContent=`START SHIFT · STAGE ${careerSpec.stageIndex+1}`;
      $('start-note').textContent=`${cfg.duration} SEC · TARGET ${careerSpec.targetScore} PTS · +${careerSpec.clearBonus} CLEAR BONUS · ESC EXIT`;
    }else{
      if($('welcome-mode-pill'))$('welcome-mode-pill').textContent='NOW SERVING · '+mInfo.label;
      if($('welcome-headline'))$('welcome-headline').innerHTML='A LITTLE CRUNCH.<br/>A LOT OF JOY.';
      if($('welcome-desc'))$('welcome-desc').textContent='Upload your selfie into a pixel potato, battle or co-op on one screen, and climb the Hall of Fame.';
      if($('start-button-label'))$('start-button-label').textContent="LET'S GET CRISPY";
      $('start-note').textContent=cfg.duration+' SEC · '+level.toUpperCase()+' · '+mInfo.label+' · ESC EXIT';
    }
    if($('welcome-mode-button'))$('welcome-mode-button').textContent='⇄ MODE: '+mInfo.short;
    $('timer').textContent=formatTime(cfg.duration);
    $('speed-value').textContent=getCustom().speed.toFixed(1)+'×';
    $('rate-value').textContent=getCustom().rate.toFixed(1);
    $('hazards-value').textContent=Math.round(getCustom().hazards*100)+'%';

    for(const b of document.querySelectorAll('.difficulty')){
      const selected=b.dataset.level===level;
      b.classList.toggle('selected',selected);
      b.setAttribute('aria-pressed',String(selected));
    }
    for(const b of document.querySelectorAll('.mode-tab')){
      const selected=b.dataset.playMode===playMode;
      b.classList.toggle('selected',selected);
      b.setAttribute('aria-pressed',String(selected));
    }
    renderCareerPanel();
    updateControlsHint();
    renderWelcomeMascots();
    syncScoreboardLabels();
    applySceneNow();
  }

  for(const b of document.querySelectorAll('.difficulty')){
    b.addEventListener('click',()=>{
      if(mode==='playing'||mode==='paused')return;
      level=b.dataset.level;
      if(mode==='results'){mode='menu';show('menu');}
      state=R.newState(R.config(level,getCustom()),playMode);
      updateConfig();
      sound('click');
    });
  }
  function setPlayMode(nextMode){
    if(mode==='playing'||mode==='paused')return;
    playMode=R.normalizeMode(nextMode);
    if(playMode==='career')setManualScene(false);
    if(mode==='results'){mode='menu';show('menu');}
    career=A.loadCareer();
    careerSpec=A.careerRuntimeSpec(career);
    cfg=playMode==='career'?careerSpec.cfg:R.config(level,getCustom());
    state=R.newState(cfg,playMode,careerSpec);
    setupBaskets();
    updateConfig();
    sound('click');
  }
  for(const b of document.querySelectorAll('.mode-tab')){
    b.addEventListener('click',()=>setPlayMode(b.dataset.playMode));
  }
  $('welcome-mode-button')?.addEventListener('click',()=>{
    const order=['career','1p','2p-vs','2p-coop'];
    setPlayMode(order[(order.indexOf(playMode)+1)%order.length]);
  });
  for(const id of ['speed-setting','rate-setting','hazards-setting','duration-setting']){
    $(id).addEventListener('input',()=>{
      if(mode==='playing'||mode==='paused')return;
      state=R.newState(R.config(level,getCustom()),playMode);
      updateConfig();
    });
  }

  function lockSettings(locked){
    for(const e of document.querySelectorAll('.difficulty,.mode-tab,.career-stage-btn,#panel-upgrade-button,.custom-settings input,.custom-settings select'))e.disabled=locked;
    if(!locked)renderCareerPanel();
    $('locked-note').hidden=!locked;
  }

  function show(next){
    $('start-screen').hidden=next!=='menu';
    $('pause-screen').hidden=next!=='paused';
    $('results-screen').hidden=next!=='results';
    $('live-badge').hidden=next!=='playing';
    $('pause-button').disabled=next==='menu'||next==='results';
    if($('exit-button'))$('exit-button').disabled=next==='menu';
    $('pause-button').textContent=next==='paused'?'▶':'Ⅱ';
    $('pause-button').setAttribute('aria-label',next==='paused'?'Resume game':'Pause game');
    $('pause-button').title=next==='paused'?'Resume game (SPACE)':'Pause game (SPACE)';
    $('game-status').textContent={
      menu:playMode==='career'?`READY AT ${careerSpec.stageName.toUpperCase()} · ${careerSpec.tool.name.split(' · ')[0].toUpperCase()}`:'YOUR BASKET IS READY',
      playing:(playMode==='career'?careerSpec.badge:R.PLAY_MODES[playMode].label)+' IN PROGRESS · ESC TO EXIT',
      paused:'COFFEE BREAK — TIMER PAUSED (ESC TO EXIT)',
      results:'SHIFT COMPLETE — PRESS R FOR NEXT SHIFT OR ESC FOR MENU'
    }[next];
  }

  function begin(){
    if(!sketch)return;
    initAudio();
    avatars=A.loadAvatars();
    career=A.loadCareer();
    careerSpec=A.careerRuntimeSpec(career);
    cfg=playMode==='career'?careerSpec.cfg:R.config(level,getCustom());
    state=R.newState(cfg,playMode,careerSpec);
    celebratedPromotion=false;
    roundId=window.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);
    currentRoundSavedId='';
    dogPlan=R.bonusPlan(cfg.duration);
    dogSpawned=false;
    items=[];particles=[];splats=[];ghosts=[];labels=[];relayArc=null;
    spawnTimer=.30;comboTime=0;bumpCooldown=0;spawnSeq=0;lastHUD='';lastCountdownKey='';
    lastBest=best();
    setupBaskets();
    applySceneNow();
    pointer=null;keyboard.clear();dragging=false;
    mode='playing';
    $('run-coins').textContent='000';
    $('power-status').textContent='';
    $('timer').textContent=formatTime(cfg.duration);
    $('timer').parentElement.classList.remove('low');
    $('combo-badge').hidden=true;
    $('live-badge').textContent=playMode==='career'?`${careerSpec.badge} · GOAL ${careerSpec.targetScore}`:(level.toUpperCase()+' · '+R.PLAY_MODES[playMode].short);
    syncScoreboardLabels();
    lockSettings(true);
    show(mode);
    sound('start');
    announce((playMode==='career'?careerSpec.badge:R.PLAY_MODES[playMode].label)+' started. Press Escape anytime to exit to the menu.');
    $('canvas-host').focus({preventScroll:true});
  }

  function pause(){
    if(mode==='playing'){
      mode='paused';keyboard.clear();dragging=false;
      show(mode);
      announce('Game paused. Timer stopped.');
      $('resume-button').focus({preventScroll:true});
    }else if(mode==='paused'){
      mode='playing';
      show(mode);
      $('canvas-host').focus({preventScroll:true});
      initAudio();
    }
  }

  function exitToMenu(){
    if(mode==='menu')return;
    initAudio();
    mode='menu';
    keyboard.clear();pointer=null;dragging=false;
    items=[];particles=[];splats=[];ghosts=[];labels=[];relayArc=null;
    career=A.loadCareer();
    careerSpec=A.careerRuntimeSpec(career);
    cfg=playMode==='career'?careerSpec.cfg:R.config(level,getCustom());
    state=R.newState(cfg,playMode,careerSpec);
    setupBaskets();
    lockSettings(false);
    $('combo-badge').hidden=true;
    $('run-coins').textContent='000';
    $('power-status').textContent='';
    $('timer').parentElement.classList.remove('low');
    updateConfig();
    show('menu');
    $('game-status').textContent='EXITED TO MENU · READY FOR NEXT ORDER';
    sound('click');
    announce('Exited current game and returned to the main menu.');
    $('start-button').focus({preventScroll:true});
  }

  function defaultEntryName(){
    if(playMode==='2p-vs'){
      const sum=R.winnerSummary(state);
      return sum.winner==='p2'?(avatars.p2.name||'PLAYER 2'):sum.winner==='p1'?(avatars.p1.name||'PLAYER 1'):'RIVAL DUO';
    }
    if(playMode==='2p-coop'){
      const n1=(avatars.p1.name||'P1').slice(0,5),n2=(avatars.p2.name||'P2').slice(0,5);
      return (n1+'&'+n2).slice(0,12);
    }
    return avatars.p1.name||'PLAYER 1';
  }

  function winningAvatarHex(){
    if(playMode==='2p-vs'&&R.winnerSummary(state).winner==='p2')return avatars.p2.hex||'';
    return avatars.p1.hex||'';
  }

  function saveCurrentRunToBoard(customName){
    const sum=R.winnerSummary(state);
    const name=(customName||$('board-name-input')?.value||defaultEntryName()).trim().slice(0,12);
    const entryId=currentRoundSavedId||('round-'+roundId);
    const res=A.submitScore({
      id:entryId,
      name,
      score:sum.bestScore,
      mode:playMode,
      level:playMode==='career'?(state.career?.stageId||'street'):level,
      caught:state.caught,
      streak:state.bestStreak,
      avatarHex:winningAvatarHex()
    });
    if(res.ok){
      currentRoundSavedId=res.entry.id;
      if($('board-save-status'))$('board-save-status').textContent=`♛ SAVED! RANK #${res.rank} ON HALL OF FAME (${res.entry.name})`;
      renderMiniBoard();
    }
    return res;
  }

  function refreshResultsCareerBox(shiftOutcome){
    const box=$('career-result-box');
    if(!box)return;
    if(playMode!=='career'){
      box.hidden=true;
      $('replay-button').textContent='↻ PLAY AGAIN · R';
      return;
    }
    box.hidden=false;
    const wallet=E.load().wallet;
    const rec=A.nextRecommendedUpgrade(A.loadCareer(),wallet);
    box.classList.toggle('promoted',Boolean(shiftOutcome.cleared));
    if(shiftOutcome.cleared){
      if(shiftOutcome.allCleared&&shiftOutcome.stage.id==='bluefrog'){
        $('career-result-headline').textContent='♛ BLUE FROG EXECUTIVE CHEF CROWNED!';
        $('career-result-sub').textContent=`All 6 kitchens conquered! ${shiftOutcome.firstClear?`+${shiftOutcome.bonusCoins} Clear Bonus banked! `:''}Keep upgrading to set a legendary record!`;
        $('replay-button').textContent='▶ DEFEND BLUE FROG CROWN · R';
      }else if(shiftOutcome.nextStage){
        $('career-result-headline').textContent=`★ PROMOTED TO ${shiftOutcome.nextStage.name}!`;
        $('career-result-sub').textContent=`${shiftOutcome.firstClear?`+${shiftOutcome.bonusCoins} Promotion Bonus banked & new restaurant backdrop unlocked! `:'Stage cleared! '}Next goal: ${shiftOutcome.nextStage.targetScore} pts!`;
        $('replay-button').textContent=`▶ START ${shiftOutcome.nextStage.name} · R`;
      }
    }else{
      const gap=Math.max(1,shiftOutcome.stage.targetScore-state.score);
      $('career-result-headline').textContent=`ONLY ${gap} PTS AWAY FROM PROMOTION!`;
      $('career-result-sub').textContent=`Upgrade your spatula, auto-bot, or magnet right here and crush ${shiftOutcome.stage.name} (${shiftOutcome.stage.targetScore} pts)!`;
      $('replay-button').textContent=`↻ RETRY ${shiftOutcome.stage.name} · R`;
    }

    const qBtn=$('results-quick-upgrade');
    if(qBtn){
      if(rec&&rec.affordable){
        qBtn.hidden=false;
        qBtn.disabled=false;
        qBtn.textContent=`⚡ 1-CLICK UPGRADE: ${rec.name.split(' · ')[0]} (◈ ${rec.cost})`;
        qBtn.onclick=()=>{
          initAudio();
          const up=A.upgradeTrack(rec.trackId,E);
          if(up.ok){
            sound('upgrade');
            $('result-wallet').textContent='WALLET '+E.load().wallet+' COINS';
            setupBaskets();
            updateConfig();
            refreshResultsCareerBox(shiftOutcome);
            $('career-result-sub').textContent=`✓ Upgraded to ${up.tier.name}! Hit START below to test your new gear!`;
          }
        };
      }else if(rec){
        qBtn.hidden=false;
        qBtn.disabled=false;
        qBtn.textContent=`⚡ UPGRADE LAB (NEXT: ${rec.name.split(' · ')[0]} · ◈ ${rec.cost})`;
        qBtn.onclick=openUpgradeLab;
      }else{
        qBtn.hidden=true;
      }
    }
  }

  function finish(early=false){
    if(mode!=='playing'&&mode!=='paused')return;
    mode='results';keyboard.clear();dragging=false;state.done=true;
    const sum=R.winnerSummary(state);

    let shiftOutcome=null;
    if(playMode==='career'&&state.career){
      setManualScene(false);
      shiftOutcome=A.completeCareerShift(state.career.stageIndex,state.score,E);
      career=A.loadCareer();
      careerSpec=A.careerRuntimeSpec(career);
      applySceneNow();
    }

    const totalRoundCoins=state.coins+(shiftOutcome?.bonusCoins||0);
    $('round-earnings').textContent='+'+totalRoundCoins+' COINS BANKED';
    const boostParts=[];
    if(state.dogCaught)boostParts.push('SPUD IMP ×2');
    if(state.tipCoins>0)boostParts.push(`STREAK TIPS +${state.tipCoins}`);
    if(shiftOutcome?.bonusCoins>0)boostParts.push(`PROMOTION BONUS +${shiftOutcome.bonusCoins}`);
    $('round-boost').textContent=boostParts.join(' · ');
    $('result-wallet').textContent='WALLET '+E.load().wallet+' COINS';
    $('timer').textContent=formatTime(state.remaining);

    const recordScore=sum.bestScore;
    const isRecord=recordScore>lastBest&&recordScore>0;
    if(isRecord&&playMode!=='career')write(R.recordKey(level,cfg,playMode),recordScore);

    if(shiftOutcome)refreshResultsCareerBox(shiftOutcome);
    else if($('career-result-box')){
      $('career-result-box').hidden=true;
      $('replay-button').textContent='↻ PLAY AGAIN · R';
    }

    const duelBox=$('duel-summary');
    if(duelBox){
      duelBox.hidden=!isTwoPlayer();
      if(isTwoPlayer()){
        drawScaledSprite($('duel-p1-canvas'),sprites.mascotP1[1],2,2);
        drawScaledSprite($('duel-p2-canvas'),sprites.mascotP2[1],2,2);
        $('duel-p1-name').textContent=avatars.p1.name||'PLAYER 1';
        $('duel-p2-name').textContent=avatars.p2.name||'PLAYER 2';
        $('duel-p1-score').textContent=playMode==='2p-vs'?pad(sum.p1Score):state.players.p1.caught+' CAUGHT';
        $('duel-p2-score').textContent=playMode==='2p-vs'?pad(sum.p2Score):state.players.p2.caught+' CAUGHT';
        $('duel-vs-label').textContent=playMode==='2p-vs'?'VS':'CO-OP';
        $('duel-p1-card').classList.toggle('winner',playMode==='2p-vs'&&sum.winner==='p1');
        $('duel-p2-card').classList.toggle('winner',playMode==='2p-vs'&&sum.winner==='p2');
      }
    }

    if($('result-score-caption')){
      $('result-score-caption').textContent=playMode==='career'?`SHIFT SCORE (GOAL ${sum.targetScore})`:playMode==='2p-vs'?'WINNING SCORE':playMode==='2p-coop'?'TEAM SCORE':'YOUR SCORE';
    }
    $('final-score').textContent=pad(recordScore);
    $('final-caught').textContent=state.caught;
    $('final-missed').textContent=state.missed;
    $('final-hazards').textContent=state.hazards;
    if(playMode==='career'&&state.botCaught>0){
      $('final-streak').textContent=state.botCaught;
      if($('final-fourth-label'))$('final-fourth-label').textContent='BOT CAUGHT';
    }else if(playMode==='2p-coop'){
      $('final-streak').textContent=state.relayCount;
      if($('final-fourth-label'))$('final-fourth-label').textContent='RELAYS';
    }else if(playMode==='2p-vs'){
      $('final-streak').textContent=state.bumpCount;
      if($('final-fourth-label'))$('final-fourth-label').textContent='BUMPS';
    }else{
      $('final-streak').textContent=state.bestStreak;
      if($('final-fourth-label'))$('final-fourth-label').textContent='BEST STREAK';
    }

    $('result-eyebrow').textContent=early?'SHIFT CLOSED EARLY':"TIME'S UP. ORDER UP!";
    if(playMode==='career'){
      $('result-heading').textContent=sum.headline;
      $('result-message').textContent=sum.cleared?'New restaurant unlocked! Spend your coins on bigger gear & keep climbing!':'Every coin stays in your wallet — upgrade your gear and smash the target!';
    }else if(playMode==='2p-vs'){
      $('result-heading').textContent=sum.headline;
      $('result-message').textContent=sum.winner==='tie'?'Neck and neck at the fryer! Run it back!':`${sum.winner==='p1'?(avatars.p1.name||'Player 1'):(avatars.p2.name||'Player 2')} claims the golden spatula!`;
    }else if(playMode==='2p-coop'){
      $('result-heading').textContent=sum.headline;
      $('result-message').textContent=`${state.relayCount} alternating relay passes! Teamwork makes the hash brown gleam.`;
    }else{
      $('result-heading').textContent=state.caught===0?'WELL, THAT HAPPENED.':state.missed>state.caught?'A LITTLE MASHED.':'STAY GOLDEN.';
      $('result-message').textContent=state.caught===0?'The potatoes will be here when you are ready.':state.missed>state.caught?'A few dramatic potatoes. Still a delicious effort.':'Small potato. Big achievement. Freshly served.';
    }

    $('record-message').textContent=isRecord?'✦ NEW RECORD ✦':'BEST · '+pad(Math.max(lastBest,recordScore));
    if($('board-name-input'))$('board-name-input').value=defaultEntryName();
    if(recordScore>0)saveCurrentRunToBoard(defaultEntryName());
    else if($('board-save-status'))$('board-save-status').textContent='Catch a golden potato to post a score on the board!';

    renderCareerPanel();
    syncScoreboardLabels();
    $('combo-badge').hidden=true;
    lockSettings(false);
    show(mode);
    sound(shiftOutcome?.cleared?'promote':'end');
    announce('Shift finished. '+$('result-heading').textContent+' Score '+recordScore+'.');
    $('replay-button').focus({preventScroll:true});
  }

  for(const id of ['start-button','replay-button'])$(id).addEventListener('click',begin);
  $('pause-button').addEventListener('click',pause);
  $('resume-button').addEventListener('click',pause);
  $('quit-button').addEventListener('click',()=>finish(true));
  $('exit-button')?.addEventListener('click',exitToMenu);
  $('pause-exit-button')?.addEventListener('click',exitToMenu);
  $('menu-button').addEventListener('click',exitToMenu);

  $('board-save-button')?.addEventListener('click',()=>{
    initAudio();sound('click');
    saveCurrentRunToBoard($('board-name-input')?.value);
  });
  $('board-name-input')?.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();saveCurrentRunToBoard($('board-name-input').value);sound('click');}
  });

  $('fullscreen-button').addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement)await document.exitFullscreen();
      else await document.querySelector('.game-shell').requestFullscreen();
    }catch{announce('Fullscreen is not available in this browser.');}
  });
  document.addEventListener('fullscreenchange',()=>{
    $('fullscreen-button').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');
  });

  function openManagedDialog(dlg){
    if(!dlg)return;
    overlayPaused=mode==='playing';
    if(overlayPaused)pause();
    dlg.showModal();
  }
  function bindManagedDialog(dlg,onCleanup){
    if(!dlg)return;
    dlg.addEventListener('cancel',()=>{dialogCloseStamp=performance.now();});
    dlg.addEventListener('close',()=>{
      dialogCloseStamp=performance.now();
      if(onCleanup)onCleanup();
      if(overlayPaused&&mode==='paused')pause();
      overlayPaused=false;
    });
  }

  window.addEventListener('crunch-shop-open',()=>{overlayPaused=mode==='playing';if(overlayPaused)pause();});
  window.addEventListener('crunch-shop-close',()=>{dialogCloseStamp=performance.now();if(overlayPaused&&mode==='paused')pause();overlayPaused=false;});
  $('shop-dialog')?.addEventListener('cancel',()=>{dialogCloseStamp=performance.now();});
  bindManagedDialog($('upgrade-dialog'));

  $('how-button').addEventListener('click',()=>openManagedDialog($('help-dialog')));
  const closeHelp=()=>$('help-dialog').close();
  $('close-help').addEventListener('click',closeHelp);
  $('help-got-it').addEventListener('click',closeHelp);
  bindManagedDialog($('help-dialog'));

  // ---------------- PIXEL POTATO AVATAR STUDIO ----------------
  let activeSlot='p1';
  let draftSlot={name:'PLAYER 1',preset:'classic',style:'crispy',hex:''};
  const slotRawImage={p1:null,p2:null};
  let webcamStream=null, studioPreviewTick=0;

  function stopWebcam(){
    if(webcamStream){
      for(const t of webcamStream.getTracks())t.stop();
      webcamStream=null;
    }
    if($('avatar-video'))$('avatar-video').srcObject=null;
    if($('avatar-cam-box'))$('avatar-cam-box').hidden=true;
  }

  function renderStudioPreview(){
    const potatoCanvas=$('avatar-potato-preview');
    const gridCanvas=$('avatar-grid-preview');
    if(potatoCanvas){
      const frame=Math.floor(studioPreviewTick)%4;
      const sp=makePotato(frame,false,true,profile.equipped.flavour,draftSlot.hex);
      drawScaledSprite(potatoCanvas,sp,4,4);
    }
    if(gridCanvas){
      const g=gridCanvas.getContext('2d');
      g.imageSmoothingEnabled=false;
      g.clearRect(0,0,gridCanvas.width,gridCanvas.height);
      const cell=gridCanvas.width/A.GRID;
      if(A.isHexStream(draftSlot.hex)){
        for(let y=0;y<A.GRID;y++){
          for(let x=0;x<A.GRID;x++){
            if(!A.insidePotatoMask(x,y))continue;
            const off=(y*A.GRID+x)*6;
            g.fillStyle='#'+draftSlot.hex.slice(off,off+6);
            g.fillRect(Math.floor(x*cell),Math.floor(y*cell),Math.ceil(cell),Math.ceil(cell));
          }
        }
      }else{
        const sp=makePotato(1,false,false,profile.equipped.flavour,'');
        drawScaledSprite(gridCanvas,sp,6,6);
      }
    }
    for(const b of document.querySelectorAll('[data-avatar-preset]')){
      b.classList.toggle('active',b.dataset.avatarPreset===draftSlot.preset);
    }
    for(const b of document.querySelectorAll('[data-avatar-style]')){
      b.classList.toggle('active',b.dataset.avatarStyle===draftSlot.style);
    }
    for(const b of document.querySelectorAll('[data-avatar-slot]')){
      b.setAttribute('aria-selected',String(b.dataset.avatarSlot===activeSlot));
    }
  }

  function reprocessSlotImage(){
    const raw=slotRawImage[activeSlot];
    if(!raw)return;
    const zoom=Number($('avatar-zoom').value)||1.2;
    const contrast=Number($('avatar-contrast').value)||1.2;
    $('avatar-zoom-val').textContent=zoom.toFixed(1)+'×';
    $('avatar-contrast-val').textContent=contrast.toFixed(2)+'×';
    draftSlot.preset='custom';
    draftSlot.hex=A.pixelateRgbaToHex(raw.rgba,raw.width,raw.height,{style:draftSlot.style,zoom,contrast});
    renderStudioPreview();
  }

  function loadSlotIntoStudio(slot){
    stopWebcam();
    activeSlot=slot==='p2'?'p2':'p1';
    avatars=A.loadAvatars();
    draftSlot={...avatars[activeSlot]};
    if($('avatar-player-name'))$('avatar-player-name').value=draftSlot.name;
    renderStudioPreview();
  }

  function ingestImageSource(drawable,w,h,label){
    const c=document.createElement('canvas');
    const maxDim=192;
    const scale=Math.min(1,maxDim/Math.max(w,h));
    c.width=Math.max(24,Math.round(w*scale));
    c.height=Math.max(24,Math.round(h*scale));
    const g=c.getContext('2d');
    g.drawImage(drawable,0,0,c.width,c.height);
    const data=g.getImageData(0,0,c.width,c.height);
    slotRawImage[activeSlot]={rgba:data.data,width:c.width,height:c.height};
    reprocessSlotImage();
    if($('avatar-status'))$('avatar-status').textContent=`✦ Pixelated "${label}" into a 24×24 ${draftSlot.style==='crispy'?'Crispy Gold':'16-Bit Color'} potato head! Click SAVE to apply.`;
    sound('catch');
  }

  function openAvatarStudio(){
    initAudio();
    loadSlotIntoStudio('p1');
    openManagedDialog($('avatar-dialog'));
  }

  for(const id of ['avatar-button','welcome-avatar-button']){
    $(id)?.addEventListener('click',openAvatarStudio);
  }
  $('close-avatar')?.addEventListener('click',()=>$('avatar-dialog').close());
  bindManagedDialog($('avatar-dialog'),stopWebcam);

  for(const b of document.querySelectorAll('[data-avatar-slot]')){
    b.addEventListener('click',()=>{loadSlotIntoStudio(b.dataset.avatarSlot);sound('click');});
  }
  for(const b of document.querySelectorAll('[data-avatar-preset]')){
    b.addEventListener('click',()=>{
      const p=b.dataset.avatarPreset;
      draftSlot.preset=p;
      draftSlot.hex=p==='classic'?'':(A.PRESETS[p]?.hex||'');
      slotRawImage[activeSlot]=null;
      renderStudioPreview();
      if($('avatar-status'))$('avatar-status').textContent=`Preset "${A.PRESETS[p]?.label||p}" selected. Click SAVE PIXEL POTATO to wear it!`;
      sound('click');
    });
  }
  for(const b of document.querySelectorAll('[data-avatar-style]')){
    b.addEventListener('click',()=>{
      draftSlot.style=b.dataset.avatarStyle==='arcade'?'arcade':'crispy';
      if(slotRawImage[activeSlot])reprocessSlotImage();
      else renderStudioPreview();
      sound('click');
    });
  }
  for(const id of ['avatar-zoom','avatar-contrast']){
    $(id)?.addEventListener('input',()=>{
      $('avatar-zoom-val').textContent=Number($('avatar-zoom').value).toFixed(1)+'×';
      $('avatar-contrast-val').textContent=Number($('avatar-contrast').value).toFixed(2)+'×';
      if(slotRawImage[activeSlot])reprocessSlotImage();
    });
  }
  $('avatar-file-input')?.addEventListener('change',e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      const im=new Image();
      im.onload=()=>ingestImageSource(im,im.naturalWidth||im.width,im.naturalHeight||im.height,file.name);
      im.onerror=()=>{if($('avatar-status'))$('avatar-status').textContent='Could not decode that image file. Try PNG, JPG, or WEBP.';};
      im.src=String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value='';
  });
  $('avatar-demo-button')?.addEventListener('click',()=>{
    const variant=activeSlot==='p2'?1:0;
    const rgba=A.createDemoSelfieRgba(96,96,variant);
    slotRawImage[activeSlot]={rgba,width:96,height:96};
    reprocessSlotImage();
    if($('avatar-status'))$('avatar-status').textContent='✦ Generated sample selfie & quantized into a 24×24 pixel hash brown! Click SAVE to equip.';
    sound('catch');
  });
  $('avatar-cam-button')?.addEventListener('click',async()=>{
    if(!navigator.mediaDevices?.getUserMedia){
      if($('avatar-status'))$('avatar-status').textContent='Camera access is unavailable in this browser. Use UPLOAD IMAGE instead!';
      return;
    }
    try{
      stopWebcam();
      webcamStream=await navigator.mediaDevices.getUserMedia({video:{width:256,height:256,facingMode:'user'},audio:false});
      $('avatar-video').srcObject=webcamStream;
      $('avatar-cam-box').hidden=false;
      if($('avatar-status'))$('avatar-status').textContent='Frame your face and click SNAP PIXEL FACE!';
    }catch{
      if($('avatar-status'))$('avatar-status').textContent='Camera permission was declined or unavailable. Try UPLOAD IMAGE!';
    }
  });
  $('avatar-snap-button')?.addEventListener('click',()=>{
    const v=$('avatar-video');
    if(v&&v.videoWidth>0){
      ingestImageSource(v,v.videoWidth,v.videoHeight,'Webcam Selfie');
      stopWebcam();
    }
  });
  $('avatar-cam-cancel')?.addEventListener('click',stopWebcam);
  $('avatar-save-button')?.addEventListener('click',()=>{
    const name=($('avatar-player-name')?.value||'').trim()||(activeSlot==='p2'?'PLAYER 2':'PLAYER 1');
    A.saveAvatar(activeSlot,{...draftSlot,name});
    avatars=A.loadAvatars();
    syncScoreboardLabels();
    if($('avatar-status'))$('avatar-status').textContent=`✓ Saved ${avatars[activeSlot].name}'s custom pixel potato!`;
    sound('start');
    setTimeout(()=>{if($('avatar-dialog')?.open)$('avatar-dialog').close();},320);
  });

  // ---------------- HALL OF FAME LEADERBOARD ----------------
  let boardFilter='all', confirmReset=false;

  function renderMiniBoard(){
    const host=$('mini-board-rows');
    if(!host)return;
    host.replaceChildren();
    const top=A.loadBoard().slice(0,3);
    top.forEach((entry,idx)=>{
      const row=document.createElement('div');
      row.className='mini-board-row';
      const rk=document.createElement('span');rk.className='mini-board-rank';rk.textContent='#'+(idx+1);
      const nm=document.createElement('span');nm.className='mini-board-name';if(!entry.house&&!/^PLAYER [12]$/.test(entry.name))nm.dataset.userText='true';nm.textContent=entry.name;
      const md=document.createElement('span');md.className='mini-board-mode';md.textContent=R.PLAY_MODES[entry.mode]?.short||'1P';
      const sc=document.createElement('span');sc.className='mini-board-score';sc.textContent=pad(entry.score);
      row.append(rk,nm,md,sc);
      host.append(row);
    });
  }

  function renderLeaderboardModal(){
    const list=$('leaderboard-list');
    if(!list)return;
    list.replaceChildren();
    const entries=A.filterBoard(A.loadBoard(),boardFilter);
    for(const b of document.querySelectorAll('[data-board-filter]')){
      b.setAttribute('aria-selected',String(b.dataset.boardFilter===boardFilter));
    }
    if(!entries.length){
      const empty=document.createElement('p');
      empty.textContent='No records in this mode yet — start a shift and claim #1!';
      list.append(empty);
      return;
    }
    entries.forEach((entry,i)=>{
      const item=document.createElement('article');
      item.className='board-item'+(i<3?' top-'+(i+1):'');
      const rank=document.createElement('div');
      rank.className='board-rank';
      rank.textContent=i===0?'♛ #1':'#'+(i+1);
      const av=document.createElement('canvas');
      av.width=40;av.height=52;av.className='board-avatar';
      drawScaledSprite(av,makePotato(1,false,true,profile.equipped.flavour,entry.avatarHex||''),2,2);
      const meta=document.createElement('div');
      meta.className='board-meta';
      const title=document.createElement('strong');
      if(!entry.house&&!/^PLAYER [12]$/.test(entry.name))title.dataset.userText='true';
      title.textContent=entry.name+(entry.house?' · HOUSE TARGET':'');
      const sub=document.createElement('small');
      sub.textContent=`${R.PLAY_MODES[entry.mode]?.label||'1P SOLO'} · ${entry.level.toUpperCase()} · ${entry.caught} caught`;
      meta.append(title,sub);
      const sc=document.createElement('div');
      sc.className='board-score';
      sc.innerHTML=`${pad(entry.score)}<span>PTS</span>`;
      item.append(rank,av,meta,sc);
      list.append(item);
    });
  }

  function openLeaderboard(){
    initAudio();
    confirmReset=false;
    if($('reset-board-button'))$('reset-board-button').textContent='Reset to house targets';
    renderLeaderboardModal();
    openManagedDialog($('leaderboard-dialog'));
  }

  for(const id of ['leaderboard-button','welcome-board-button','panel-board-button','results-board-button']){
    $(id)?.addEventListener('click',openLeaderboard);
  }
  for(const id of ['close-leaderboard','leaderboard-done']){
    $(id)?.addEventListener('click',()=>$('leaderboard-dialog').close());
  }
  bindManagedDialog($('leaderboard-dialog'));

  for(const b of document.querySelectorAll('[data-board-filter]')){
    b.addEventListener('click',()=>{boardFilter=b.dataset.boardFilter;renderLeaderboardModal();sound('click');});
  }
  $('reset-board-button')?.addEventListener('click',()=>{
    if(!confirmReset){
      confirmReset=true;
      $('reset-board-button').textContent='Click again to confirm reset';
      return;
    }
    A.resetBoard();
    confirmReset=false;
    $('reset-board-button').textContent='Reset to house targets';
    renderLeaderboardModal();
    renderMiniBoard();
    sound('click');
  });
  window.addEventListener('crunch-board-change',()=>{
    renderMiniBoard();
    if($('leaderboard-dialog')?.open)renderLeaderboardModal();
  });

  // ---------------- KEYBOARD & VISIBILITY HANDLERS ----------------
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
  window.addEventListener('blur',()=>{keyboard.clear();dragging=false;if(mode==='playing')pause();});

  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(anyDialogOpen()||performance.now()-dialogCloseStamp<140)return;
      if(mode==='playing'||mode==='paused'||mode==='results'){
        e.preventDefault();
        exitToMenu();
      }
    }
  },true);

  window.addEventListener('keydown',e=>{
    if(anyDialogOpen())return;
    const tag=document.activeElement?.tagName;
    if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;
    if(['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)&&mode==='playing'){
      e.preventDefault();
      const k=e.key.toLowerCase();
      keyboard.add(k);
      if(!isTwoPlayer()||k==='arrowleft'||k==='arrowright')pointer=null;
      return;
    }
    if(tag==='BUTTON')return;
    if((e.code==='Space'||e.key.toLowerCase()==='p')&&(mode==='playing'||mode==='paused')){
      e.preventDefault();
      if(!e.repeat)pause();
    }else if(e.key.toLowerCase()==='r'&&mode==='results'){
      e.preventDefault();
      begin();
    }
  });
  window.addEventListener('keyup',e=>keyboard.delete(e.key.toLowerCase()));

  // ---------------- COLLISION, SCORING & GAME LOOP ----------------
  function hit(item,caught,catcherId=1){
    const previousCoins=state.coins,previousClock=state.clockBonus;
    const targetBasket=baskets.find(b=>b.id===catcherId)||baskets[0];
    const playerIdx=catcherId===2?2:(catcherId===3?3:1);
    const hadShield=playMode==='2p-vs'?(state.players[playerIdx===2?'p2':'p1'].shield>0):(state.shield>0);
    const delta=R.resolve(state,item.type,caught,playerIdx);
    const earned=state.coins-previousCoins;
    if(earned>0)E.bank(roundId+':'+(item.type==='dog'?'double':'catch-'+state.caught+'-'+state.tipCoins),earned);
    $('run-coins').textContent=pad(state.coins)+(state.coinMultiplier===2?' ×2':'');

    if(playMode==='career'&&state.career?.promoted&&!celebratedPromotion){
      celebratedPromotion=true;
      sound('promote');
      comboTime=2.8;
      $('combo-badge').hidden=false;
      $('combo-badge').textContent=`★ TARGET HIT! ${careerSpec.stageName} CLEARED! ★`;
      burst(W/2,H*0.28,28,['#ffd966','#6ee7b7','#ff8a65','#fff8dc']);
      announce('Promotion target reached! Keep catching for extra upgrade coins!');
    }

    if(item.type==='dog'){
      if(caught){
        sound('start');comboTime=3;
        $('combo-badge').hidden=false;$('combo-badge').textContent='SPUD IMP! ALL ROUND COINS ×2';
        labels.push({x:item.x,y:targetBasket.y-45,text:'COINS ×2!',color:'#82599b',life:1.8});
        burst(item.x,targetBasket.y,22,['#ffd96b','#bb9be4','#fff0bb']);
      }else labels.push({x:item.x,y:H-90,text:'NEXT TIME, PUP!',color:'#977053',life:1});
    }else if(['clock','coffee','cola'].includes(item.type)){
      if(caught){
        if(item.type==='clock'){
          sound('feverStart');
          comboTime=2.8;
          $('combo-badge').hidden=false;
          $('combo-badge').textContent=`ALARM FEVER! ${Math.round(state.feverRemaining)}s GOLDEN RUSH!`;
          const clockText=previousClock>=15?'FEVER RUSH!':'+5s & FEVER!';
          labels.push({x:item.x,y:targetBasket.y-48,text:clockText,color:'#c84624',life:1.7});
          burst(item.x,targetBasket.y,24,['#ffe37a','#ff9a3c','#fff6cf']);
        }else{
          sound('click');
          const text=item.type==='coffee'?'SLOW FALL · 4s':'SHIELD READY';
          labels.push({x:item.x,y:targetBasket.y-45,text,color:'#52866b',life:1.4});
          burst(item.x,targetBasket.y,9,['#c4ead8','#fff0bb']);
        }
      }
    }else if(item.type==='golden'&&caught){
      targetBasket.flash=.14;
      targetBasket.catches.push({life:.6,slot:playerIdx===2?2:1});
      targetBasket.catches=targetBasket.catches.slice(-3);
      burst(item.x,targetBasket.y,state.lastRelayBonus?18:12,state.lastRelayBonus?['#8ef0e4','#ffe68d','#ffbc3d']:['#ffe68d','#ffbc3d','#ed9822']);
      if(state.lastRelayBonus){
        sound('relay');
        if(baskets.length===2)relayArc={x1:baskets[0].x,x2:baskets[1].x,y:targetBasket.y-24,life:.55};
        labels.push({x:item.x,y:targetBasket.y-44,text:`+${delta} RELAY!`,color:'#24726d',life:1.1});
      }else{
        sound('catch');
        const prefix=catcherId===3?'BOT ':isTwoPlayer()?`P${playerIdx} `:'';
        const tipTxt=state.lastTipBonus>0?` +${state.lastTipBonus}TIP!`:'';
        const tag=isTwoPlayer()?`${prefix}+${delta}`:`${prefix}+${delta} / +${earned}c${tipTxt}`;
        labels.push({x:item.x,y:targetBasket.y-35,text:tag,color:catcherId===3?'#1d7874':playerIdx===2?'#246c68':'#9e5319',life:.88});
      }
      if(state.streak>0&&state.streak%5===0&&comboTime<=0.2){
        comboTime=1.8;$('combo-badge').hidden=false;$('combo-badge').textContent=state.streak+' IN A ROW!';
      }
    }else if(item.type==='golden'){
      sound('miss');
      splats.push({x:item.x,y:H-48,age:0});
      ghosts.push({x:item.x+7,y:H-65,phase:Math.random()*6});
      labels.push({x:item.x,y:H-100,text:'−2',color:'#8c7460',life:.9});
      burst(item.x,H-40,6,['#c9b28b','#ddc7a0']);
    }else if(caught){
      if(hadShield){
        sound('click');
        labels.push({x:item.x,y:targetBasket.y-40,text:'SHIELDED!',color:'#528b95',life:1});
      }else{
        sound(item.type==='bomb'?'bomb':'burnt');
        targetBasket.shake=item.type==='bomb'?.38:.17;
        burst(item.x,targetBasket.y,item.type==='bomb'?20:10,item.type==='bomb'?['#d63c2c','#ffc160','#ff7651']:['#70513a','#ae7944']);
        labels.push({x:item.x,y:targetBasket.y-40,text:String(delta),color:'#bf3528',life:1});
      }
    }
    lastHUD='';
  }

  function burst(x,y,n,colors){
    for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*165,vy:-40-Math.random()*145,life:.35+Math.random()*.4,size:3+Math.random()*3,color:colors[i%colors.length]});
  }

  function spawn(difficulty){
    let type=(state.feverRemaining>0?null:R.bonusType(state,dogPlan,dogSpawned))||R.chooseType(cfg,Math.random,state);
    if(type==='dog')dogSpawned=true;
    const mobileScale=H>700?1.55:1;
    const w=(type==='dog'?65:type==='bomb'?48:46)*mobileScale;
    const h=(type==='dog'?70:type==='bomb'?56:64)*mobileScale;
    let x=45+Math.random()*(W-90);
    if(items.length&&Math.abs(items[items.length-1].x-x)<60)x=Math.max(40,Math.min(W-40,x+120));
    const faceSlot=isTwoPlayer()?(spawnSeq++%2===0?1:2):1;
    items.push({x,y:-h,w,h,type,faceSlot,magnetized:false,variant:dogPlan.variant,speed:difficulty.speed*56*(H/600)*(.88+Math.random()*.24),spin:(Math.random()-.5)*.26,phase:Math.random()*Math.PI*2});
  }

  function advance(dt,clockDt){
    const diff=R.difficultyAt(cfg,state.elapsed,state);
    R.tick(state,clockDt);
    if(state.done){finish();return;}

    const cd=R.bigCountdown(state);
    if(cd.active){
      const key=cd.kind+':'+cd.number;
      if(key!==lastCountdownKey){
        lastCountdownKey=key;
        sound(cd.kind==='fever'?'feverTick':'finalTick',cd.number);
      }
    }else lastCountdownKey='';

    const baseMove=W*1.08*dt;
    if(!isTwoPlayer()){
      const b=baskets[0];
      const sp=baseMove*(b.speedMult||1);
      if(keyboard.has('arrowleft')||keyboard.has('a'))b.x-=sp;
      if(keyboard.has('arrowright')||keyboard.has('d'))b.x+=sp;
      if(pointer!==null)b.x+=(pointer-b.x)*Math.min(1,dt*22);
      b.x=Math.max(b.w/2+12,Math.min(W-b.w/2-12,b.x));
      if(playMode==='career'&&baskets[1]?.isBot){
        R.stepAutoBot(baskets[1],items,W,dt);
      }
    }else{
      const [b1,b2]=baskets;
      if(keyboard.has('a'))b1.x-=baseMove;
      if(keyboard.has('d'))b1.x+=baseMove;
      if(keyboard.has('arrowleft'))b2.x-=baseMove;
      if(keyboard.has('arrowright'))b2.x+=baseMove;
      if(pointer!==null)b2.x+=(pointer-b2.x)*Math.min(1,dt*20);

      for(const b of baskets){
        if(Math.abs(b.vx)>1){
          b.x+=b.vx*dt;
          b.vx*=Math.pow(0.0012,dt);
        }else b.vx=0;
        b.x=Math.max(b.w/2+12,Math.min(W-b.w/2-12,b.x));
      }

      bumpCooldown=Math.max(0,bumpCooldown-dt);
      if(playMode==='2p-vs'){
        const col=R.collideBaskets(b1,b2,W);
        if(col.bumped&&bumpCooldown<=0){
          bumpCooldown=0.22;
          state.bumpCount++;
          b1.shake=.12;b2.shake=.12;
          sound('bump');
          burst(col.midX,b1.y,12,['#ffe28a','#ff7c5c','#8cebe0']);
          labels.push({x:col.midX,y:b1.y-42,text:'BUMP!',color:'#c63d28',life:.65});
        }
      }
    }

    spawnTimer-=dt;
    let spawned=0;
    while(spawnTimer<=0&&spawned++<8){
      spawn(diff);
      spawnTimer+=1/diff.rate*(.82+Math.random()*.36);
    }

    const magRadius=playMode==='career'?careerSpec.magnet.radius*(H>700?1.2:1):0;
    const magPull=playMode==='career'?careerSpec.magnet.pull:0;

    for(let i=items.length-1;i>=0;i--){
      const item=items[i],prev=item.y;
      if(magRadius>0){
        item.magnetized=R.applyMagnet(item,baskets[0],magRadius,magPull,dt,W);
      }
      item.y+=item.speed*dt*(state.slowRemaining>0?.5:1);
      let caughtBy=0;
      for(const b of baskets){
        if(R.overlaps(item,b,prev)){caughtBy=b.id;break;}
      }
      if(caughtBy){
        hit(item,true,caughtBy);
        items.splice(i,1);
      }else if(item.y+item.h/2>H-43){
        hit(item,false,1);
        items.splice(i,1);
      }
    }

    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=280*dt;p.life-=dt;}
    particles=particles.filter(p=>p.life>0);
    for(const s of splats)s.age+=dt;
    for(const g of ghosts){g.y-=H/6*dt;g.x+=Math.sin(g.y*.03+g.phase)*14*dt;}
    ghosts=ghosts.filter(g=>g.y>-65);
    for(const l of labels){l.y-=34*dt;l.life-=dt;}
    labels=labels.filter(l=>l.life>0);
    if(relayArc){relayArc.life-=dt;if(relayArc.life<=0)relayArc=null;}
    for(const b of baskets){
      for(const c of b.catches)c.life=Math.max(0,c.life-dt);
      b.flash=Math.max(0,b.flash-dt);
      b.shake=Math.max(0,b.shake-dt);
    }
    comboTime=Math.max(0,comboTime-dt);
    if(comboTime===0)$('combo-badge').hidden=true;

    $('power-status').textContent=[
      state.feverRemaining>0?'FEVER '+Math.ceil(state.feverRemaining)+'s':'',
      state.dogCaught?'COINS ×2':'',
      state.slowRemaining>0?'SLOW '+Math.ceil(state.slowRemaining)+'s':'',
      state.shield?'SHIELD ×'+state.shield:'',
      playMode==='career'&&careerSpec.bot.active?'AUTO-BOT ON':''
    ].filter(Boolean).join(' · ');

    const hudSnap=[Math.ceil(state.remaining),state.score,state.players.p1.score,state.players.p2.score,state.relayCount].join(':');
    if(hudSnap!==lastHUD){
      syncScoreboardLabels();
      $('timer').textContent=formatTime(state.remaining);
      $('timer').parentElement.classList.toggle('low',state.remaining<=10);
      lastHUD=hudSnap;
    }
  }

  updateConfig();
  renderMiniBoard();
  show('menu');

  function boot(){
    if(typeof window.p5==='undefined'){$('loading-error').hidden=false;return;}
    sketch=new p5(p=>{
      p.setup=()=>{
        const host=$('canvas-host'),rect=host.getBoundingClientRect();
        W=960;H=rect.width<500?1128:600;
        setupBaskets();
        const c=p.createCanvas(W,H);c.parent(host);p.pixelDensity(1);p.noSmooth();p.frameRate(60);
        applySceneNow();

        const position=e=>{const r=c.elt.getBoundingClientRect();return (e.clientX-r.left)/r.width*W;};
        c.elt.addEventListener('pointerdown',e=>{
          if(mode!=='playing')return;
          e.preventDefault();dragging=true;
          const px=position(e);
          if(isTwoPlayer()&&e.pointerType!=='mouse'&&px<W*0.48){
            baskets[0].x=Math.max(baskets[0].w/2+12,Math.min(W-baskets[0].w/2-12,px));
          }else{
            pointer=px;
          }
          c.elt.setPointerCapture(e.pointerId);
          host.focus({preventScroll:true});
          initAudio();
        });
        c.elt.addEventListener('pointermove',e=>{
          if(mode!=='playing')return;
          const px=position(e);
          if(isTwoPlayer()&&dragging&&e.pointerType!=='mouse'&&px<W*0.48){
            baskets[0].x=Math.max(baskets[0].w/2+12,Math.min(W-baskets[0].w/2-12,px));
          }else if(dragging||e.pointerType==='mouse'){
            pointer=px;
          }
        });
        c.elt.addEventListener('pointerup',()=>{dragging=false;});
        c.elt.addEventListener('pointercancel',()=>{dragging=false;});

        const resize=new ResizeObserver(()=>{
          const r=host.getBoundingClientRect(),height=r.width<500?1128:600;
          if(height!==H){
            const oldH=H;H=height;p.resizeCanvas(W,H);
            setupBaskets();
            for(const i of items){i.y*=H/oldH;i.speed*=H/oldH;}
          }
        });
        resize.observe(host);
      };

      function img(c,x,y,w,h){p.drawingContext.drawImage(c,Math.round(x),Math.round(y),Math.round(w),Math.round(h));}

      function plateDraw(){
        if(mode==='menu'||state.caught===0)return;
        const inBaskets=baskets.reduce((acc,b)=>acc+Math.min(b.catches.length,3),0);
        const plated=Math.max(0,state.caught-inBaskets);
        if(plated===0)return;
        const scale=H>700?1.3:1,px=W-117*scale,py=H-112;
        p.push();p.translate(Math.round(px),Math.round(py));p.scale(scale);p.noStroke();
        p.fill(98,61,34,30);p.ellipse(0,6,185,20);
        p.fill('#ad9980');p.rect(-84,-5,168,11);p.rect(-73,6,146,4);
        p.fill('#fff8df');p.rect(-89,-9,178,9);p.rect(-80,0,160,5);
        p.fill('#e2d5ba');p.rect(-70,-6,140,3);p.fill('#f7ecd2');p.rect(-67,-9,134,3);
        const visible=Math.min(plated,24),columns=4,rows=Math.ceil(visible/columns);
        for(let i=0;i<visible;i++){
          const row=Math.floor(i/columns),col=i%columns;
          const sp=isTwoPlayer()&&i%2===1?sprites.goldenP2[0]:sprites.goldenP1[0];
          p.push();p.translate(-58+col*38+(row%2)*3,-17-row*13);p.rotate(-Math.PI/2+(col%2?.06:-.06));
          img(sp,-20,-28,40,54);p.pop();
        }
        p.fill('#fff8e7');p.rect(-78,-52-rows*13,156,22);p.fill('#875024');
        p.textFont('monospace');p.textStyle(p.BOLD);p.textSize(12);p.textAlign(p.CENTER);
        p.text('SERVED '+String(plated).padStart(3,'0'),0,-37-rows*13);
        p.pop();
      }

      // Renders all 4 Catcher Gear silhouettes (Spatula / Paper Carton / Wire Basket / Jumbo Gold Tray) + AI Auto-Bot antenna
      function drawSingleBasket(b,time){
        const x=b.x,y=b.y,w=b.w;
        const tool=b.toolId||'basket';
        const dx=b.shake>0&&!reducedMotion?Math.sin(time*65)*6:0;
        const isP2=b.id===2,isBot=Boolean(b.isBot);
        const gripMain=isBot?'#1f7a73':isTwoPlayer()?(isP2?'#297a75':'#c93829'):'#ae6034';
        const gripLight=isBot?'#8ef2e8':isTwoPlayer()?(isP2?'#7de0d8':'#ff9776'):'#e0a15f';
        const playerShield=!isBot&&(playMode==='2p-vs'?(state.players[isP2?'p2':'p1'].shield>0):(state.shield>0));

        p.push();p.translate(Math.round(x+dx),Math.round(y));p.noStroke();

        // Magnet aroma aura when active on main catcher
        if(!isBot&&playMode==='career'&&careerSpec.magnet.radius>0&&mode==='playing'){
          const mr=careerSpec.magnet.radius*(H>700?1.2:1);
          p.noFill();
          p.stroke(`rgba(255,208,76,${0.22+0.12*Math.sin(time*5)})`);
          p.strokeWeight(3);
          p.arc(0,0,mr*1.55,mr*1.1,Math.PI*1.08,Math.PI*1.92);
          p.noStroke();
        }

        p.fill(60,34,16,38);p.ellipse(0,tool==='spatula'?34:64,w+24,15);

        // Stacked caught potatoes sitting inside/on the tool
        for(let i=0;i<b.catches.length;i++){
          const c=b.catches[i],count=b.catches.length,slot=(i-(count-1)/2)*w*.24;
          const size=H>700?1.16:0.98,bounce=c.life>0&&!reducedMotion?Math.sin(c.life/.6*Math.PI)*7:0;
          const pool=c.slot===2?sprites.goldenP2:sprites.goldenP1;
          const frame=pool[c.life>.35?1:0];
          const yOff=tool==='spatula'?-24:tool==='tray'?-18:-10;
          p.push();p.translate(slot,yOff-bounce);p.rotate((i%2?1:-1)*.08);
          img(frame,-23*size,-31*size,46*size,61*size);p.pop();
        }

        if(tool==='spatula'){
          // Tier 1: Slotted Stainless Iron Spatula + Red Wood Handle
          p.fill('#47525c');p.rect(-w/2,0,w,16,3);
          p.fill('#bcc8d4');p.rect(-w/2+3,2,w-6,10,2);
          p.fill('#eef5fc');p.rect(-w/2+5,3,w-14,3);
          p.fill('#47525c');
          for(let sx=-w/2+14;sx<=w/2-18;sx+=14)p.rect(sx,5,6,5,1);
          // Angled neck & chef handle
          p.stroke('#5c6873');p.strokeWeight(7);
          p.line(w/2-4,6,w/2+16,-14);
          p.noStroke();
          p.fill(isBot?'#1f7a73':'#b83224');p.rect(w/2+12,-22,34,13,4);
          p.fill(isBot?'#8ef2e8':'#ff9d82');p.rect(w/2+15,-20,26,4,2);
        }else if(tool==='carton'){
          // Tier 2: Red-and-White Striped Crispy Paper Fry Carton
          p.stroke('#7a1f18');p.strokeWeight(5);p.fill('#d63426');
          p.quad(-w/2,-2,w/2,-2,w/2-16,52,-w/2+16,52);
          p.noStroke();
          for(let sx=-w/2+18;sx<w/2-18;sx+=18){
            p.fill('#fff6e4');
            p.rect(sx,2,9,47);
          }
          p.fill('#ffd154');p.rect(-w/2-3,-5,w+6,7,3);
          p.fill('#8f241b');p.rect(-26,18,52,18,3);
          p.fill('#ffe699');p.textFont('Pixel,Arial,sans-serif');p.textSize(7);p.textAlign(p.CENTER,p.CENTER);
          p.text(isBot?'AUTO':'CRISP',0,27);
        }else if(tool==='tray'){
          // Tier 4: Jumbo Brushed-Gold & Velvet Chef Banquet Tray
          p.fill('#7c4b12');p.rect(-w/2-4,-2,w+8,26,6);
          p.fill('#ffd457');p.rect(-w/2,0,w,20,4);
          p.fill('#fff4b8');p.rect(-w/2+6,2,w-12,5,2);
          p.fill('#8f2024');p.rect(-w/2+10,8,w-20,9,2);
          // Brass side handles
          p.stroke('#d49022');p.strokeWeight(6);p.noFill();
          p.arc(-w/2-4,10,22,18,Math.PI*0.5,Math.PI*1.5);
          p.arc(w/2+4,10,22,18,-Math.PI*0.5,Math.PI*0.5);
          p.noStroke();
        }else{
          // Tier 3 / Default Arcade: Classic Commercial Wire Fry Basket
          p.stroke('#52473a');p.strokeWeight(6);p.noFill();
          p.beginShape();p.vertex(-w/2,-4);p.vertex(-w/2+19,54);p.vertex(w/2-19,54);p.vertex(w/2,-4);p.endShape();
          p.stroke('#b4b1a2');p.strokeWeight(3);
          for(let i=-w/2+13;i<w/2-9;i+=13){const t=(i+w/2)/w;p.line(i,3,i+(t<.5?9:-9),51);}
          for(let j=10;j<52;j+=11){const inset=j*.32;p.line(-w/2+inset,j,w/2-inset,j);}
          p.stroke('#4e443a');p.strokeWeight(7);p.line(-w/2,-1,w/2,-1);
          p.stroke('#dfded0');p.strokeWeight(3);p.line(-w/2,-3,w/2,-3);
          for(const dir of [-1,1]){
            p.stroke('#594a38');p.strokeWeight(7);
            p.line(dir*w/2,-2,dir*(w/2+12),-19);p.line(dir*(w/2+12),-19,dir*(w/2+31),-19);
            p.stroke('#d5c7a6');p.strokeWeight(3);p.line(dir*w/2,-4,dir*(w/2+12),-22);
            p.noStroke();p.fill(gripMain);p.rect(dir<0?-w/2-37:w/2+12,-27,26,12);
            p.fill(gripLight);p.rect(dir<0?-w/2-35:w/2+14,-26,22,4);
          }
        }

        // Auto Sous-Chef Bot antenna + badge
        if(isBot){
          p.stroke('#274c5e');p.strokeWeight(4);
          p.line(0,0,0,-30);
          p.noStroke();
          const pulse=Math.sin(time*9)>0;
          p.fill(pulse?'#6ef7e8':'#ffd454');
          p.ellipse(0,-34,13,13);
          p.fill('#1e4252');p.rect(-28,16,56,18,4);
          p.fill('#9ef5ec');p.textFont('Pixel,Arial,sans-serif');p.textSize(7);p.textAlign(p.CENTER,p.CENTER);
          p.text('AUTO BOT',0,25);
        }else if(isTwoPlayer()){
          p.noStroke();
          p.fill(gripMain);p.rect(-24,18,48,20,3);
          p.fill('#fff8e6');p.textFont('Pixel,Arial,sans-serif');p.textSize(9);p.textAlign(p.CENTER,p.CENTER);
          p.text(isP2?'P2':'P1',0,29);
        }

        if(b.flash>0){
          p.noStroke();p.fill('#ffe593');
          for(let i=0;i<5;i++){
            const xx=Math.sin(i*7)*w*.5,yy=-22-Math.cos(i*5)*22;
            p.rect(xx-2,yy-7,4,14);p.rect(xx-7,yy-2,14,4);
          }
        }
        if(playerShield){
          p.noFill();p.stroke('#9cdbda');p.strokeWeight(3);p.ellipse(0,12,w+40,95);
        }
        p.pop();
      }

      // Live Career Promotion Progress Pill at top-center of playfield
      function drawCareerProgressHUD(){
        if(playMode!=='career'||(mode!=='playing'&&mode!=='paused')||!state.career)return;
        const goal=state.career.targetScore||80;
        const pct=Math.min(1,state.score/goal);
        const cleared=state.score>=goal;
        const bw=300,bx=(W-bw)/2,by=12;
        p.push();
        p.noStroke();
        p.fill('rgba(58,28,18,0.82)');
        p.rect(bx,by,bw,28,5);
        p.fill(cleared?'#3fa368':'#f5b841');
        p.rect(bx+3,by+19,Math.max(4,(bw-6)*pct),6,3);
        p.fill(cleared?'#b8f7cb':'#fff4dc');
        p.textFont('Pixel,Arial,sans-serif');
        p.textSize(8);
        p.textAlign(p.CENTER,p.CENTER);
        const label=cleared?`★ ${careerSpec.stageName} CLEARED! BONUS COINS ★`:`${careerSpec.stageName} · ${state.score}/${goal} PTS TO PROMOTE`;
        p.text(label,W/2,by+10);
        p.pop();
      }

      function drawBigCountdown(){
        if(mode!=='playing'&&mode!=='paused')return;
        const cd=R.bigCountdown(state);
        if(!cd.active)return;
        const isFever=cd.kind==='fever';
        const pop=reducedMotion?1:(1+0.26*Math.pow(cd.pulse,2.2));
        const cy=H*0.40;

        p.push();
        p.noFill();
        p.stroke(isFever?'rgba(255,192,52,0.72)':'rgba(215,55,40,0.58)');
        p.strokeWeight(isFever?10:7);
        p.rect(5,5,W-10,H-10);

        p.translate(W/2,cy);
        p.noStroke();
        p.fill(isFever?'rgba(92,40,22,0.86)':'rgba(104,28,24,0.86)');
        p.rect(-190,-96,380,32,4);
        p.fill(isFever?'#ffd968':'#ffb89e');
        p.textFont('Pixel,Arial,sans-serif');
        p.textSize(10);
        p.textAlign(p.CENTER,p.CENTER);
        p.text(cd.title+' · '+cd.subtitle,0,-80);

        p.push();
        p.scale(pop);
        p.textFont('Pixel,Arial,sans-serif');
        p.textSize(H>700?128:108);
        p.textAlign(p.CENTER,p.CENTER);
        p.fill('rgba(72,30,16,0.55)');
        p.text(String(cd.number),6,8);
        p.stroke(isFever?'#7a3718':'#6e1d18');
        p.strokeWeight(10);
        p.fill(isFever?'#ffd447':'#ff6e4a');
        p.text(String(cd.number),0,0);
        p.noStroke();
        p.fill('rgba(255,250,224,0.45)');
        p.text(String(cd.number),-2,-3);
        p.pop();

        const barW=220;
        p.noStroke();
        p.fill('rgba(78,38,22,0.65)');
        p.rect(-barW/2,68,barW,10,3);
        p.fill(isFever?'#ffcf48':'#ff7654');
        p.rect(-barW/2+2,70,Math.max(0,(barW-4)*cd.progress),6,2);
        p.pop();
      }

      p.draw=()=>{
        const clockDt=p.deltaTime/1000,dt=Math.min(clockDt,1),time=p.millis()/1000;
        studioPreviewTick=time*3;
        if($('avatar-dialog')?.open&&!reducedMotion)renderStudioPreview();
        if(mode==='playing')advance(dt,clockDt);

        // Transparent clear first so CSS background-image ALWAYS shows even before Image decode completes!
        p.clear();
        if(bgImg&&bgImg.complete&&bgImg.naturalWidth>0){
          p.drawingContext.drawImage(bgImg,0,0,W,H);
        }
        p.noStroke();
        p.fill(255,state.feverRemaining>0?238:249,state.feverRemaining>0?180:227,mode==='menu'?8:state.feverRemaining>0?40:18);
        p.rect(0,0,W,H);

        plateDraw();
        drawCareerProgressHUD();

        if(splats.length){
          p.drawingContext.globalAlpha=.82;
          for(let i=0;i<Math.min(3,splats.length);i++)img(sprites.mash,46+i*33,H-48+(i%2)*5,65,30);
          p.drawingContext.globalAlpha=1;p.noStroke();p.fill('#fff0d1');
          p.textFont('monospace');p.textStyle(p.BOLD);p.textSize(H>700?15:11);p.textAlign(p.LEFT);
          p.text('MASHED '+String(splats.length).padStart(3,'0'),48,H-8);
        }
        for(const s of splats.slice(-3)){
          if(s.age<.65){p.drawingContext.globalAlpha=(.65-s.age)*.8;img(sprites.mash,s.x-29,s.y-7,58,27);p.drawingContext.globalAlpha=1;}
        }
        for(const g of ghosts){
          p.drawingContext.globalAlpha=.65;img(sprites.ghost[Math.floor(time*4)%2],g.x-14,g.y-32,28,42);p.drawingContext.globalAlpha=1;
        }

        if(mode==='menu'){
          for(let i=0;i<3;i++){
            const pool=isTwoPlayer()&&i===1?sprites.goldenP2:sprites.goldenP1;
            p.push();p.translate(100+i*(W-200)/2,110+Math.sin(time*.8+i*2)*25+(i%2)*70);
            p.rotate(Math.sin(time+i)*.12);p.drawingContext.globalAlpha=.92;
            img(pool[0],-22,-30,44,60);p.drawingContext.globalAlpha=1;p.pop();
          }
        }

        if(relayArc&&relayArc.life>0){
          p.push();
          p.noFill();
          p.stroke(`rgba(46,160,150,${Math.min(1,relayArc.life*2)})`);
          p.strokeWeight(5);
          const mid=(relayArc.x1+relayArc.x2)/2,span=Math.abs(relayArc.x2-relayArc.x1);
          p.arc(mid,relayArc.y,Math.max(40,span),90,Math.PI,0);
          p.pop();
        }

        drawBigCountdown();

        for(const item of items){
          p.push();p.translate(Math.round(item.x),Math.round(item.y));
          p.rotate(item.spin+Math.sin(time*3+item.phase)*.04);
          const goldPool=item.faceSlot===2?sprites.goldenP2:sprites.goldenP1;
          const c=item.type==='golden'?goldPool[Math.floor(time*3+item.phase)%4]:
            item.type==='burnt'?sprites.burnt:
            item.type==='bomb'?sprites.bomb[Math.floor(time*6)%2]:
            item.type==='dog'?sprites.dog[item.variant][Math.floor(time*4)%2]:sprites[item.type];
          if(item.type==='dog'||item.type==='clock'||item.magnetized){
            p.noStroke();p.fill(item.magnetized?'#ffe169':item.type==='clock'?'#ffcf56':'#ffe69a');
            p.rect(-item.w/2-4,-item.h/2-7,item.w+8,3);
          }
          img(c,-item.w/2,-item.h/2,item.w,item.h);
          p.pop();
        }

        for(const b of baskets)drawSingleBasket(b,time);

        for(const pt of particles){p.noStroke();p.fill(pt.color);p.rect(Math.round(pt.x),Math.round(pt.y),pt.size,pt.size);}
        for(const l of labels){
          p.push();p.drawingContext.globalAlpha=Math.min(1,l.life*2);
          p.textAlign(p.CENTER);p.textStyle(p.BOLD);p.textFont('monospace');p.textSize(H>700?28:22);
          p.stroke('#fff5db');p.strokeWeight(4);p.fill(l.color);p.text(l.text,l.x,l.y);p.pop();
        }

        if(mode==='playing'&&state.elapsed<4){
          p.fill('#fff8e6');p.stroke('#542918');p.strokeWeight(3);
          p.textFont('monospace');p.textStyle(p.BOLD);p.textSize(H>700?18:13);p.textAlign(p.CENTER);
          const msg=isTwoPlayer()?'P1 [A/D]  ·  P2 [←/→ OR MOUSE]  ·  [ESC] EXIT':
            (playMode==='career'&&careerSpec.bot.active)?'YOU + AUTO-BOT TWIN CATCHING! · [ESC] EXIT':'← DRAG OR KEYS TO MOVE · [ESC] TO EXIT →';
          p.text(msg,W/2,H-19);
          p.noStroke();
        }
      };
    });
  }
  boot();
})();
