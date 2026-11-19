/* Pixel Potato Avatar Synthesis, Hall-of-Fame Leaderboard, & 6-Stage Fast-Food Career + Upgrade Engine.
 * Usable in both browser and Node unit checks.
 */
(function(root){
  'use strict';
  const STAGE_PREFIX='crunch-course-stage-05';
  const AVATAR_KEY=STAGE_PREFIX+'-avatars';
  const BOARD_KEY=STAGE_PREFIX+'-leaderboard';
  const CAREER_KEY=STAGE_PREFIX+'-career';
  for(const suffix of ['avatars','leaderboard']){try{const key=STAGE_PREFIX+'-'+suffix;if(!root.localStorage?.getItem(key)){const legacy=root.localStorage?.getItem('crunch-course-stage-03-'+suffix);if(legacy){JSON.parse(legacy);root.localStorage.setItem(key,legacy);}}}catch{}}
  const GRID=24;

  // 6-tone warm fried hash-brown ramp (dark espresso roast -> sunny butter highlight)
  const CRISPY_PALETTE=[
    [70,36,14],    // #46240e deep roast
    [118,62,23],   // #763e17 toasted crust
    [173,100,28],  // #ad641c golden brown
    [225,150,40],  // #e19628 crispy fry
    [255,202,82],  // #ffca52 sunny potato
    [255,243,188]  // #fff3bc butter highlight
  ];

  const BAYER_4X4=[
    [0,8,2,10],
    [12,4,14,6],
    [3,11,1,9],
    [15,7,13,5]
  ];

  function clamp(v,lo,hi){return v<lo?lo:v>hi?hi:v;}
  function rgbToHex(r,g,b){
    return [r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
  }
  function isHexStream(s){
    return typeof s==='string'&&s.length===GRID*GRID*6&&/^[0-9a-fA-F]+$/.test(s);
  }
  function insidePotatoMask(gx,gy){
    const nx=(gx+0.5-GRID/2)/(GRID/2);
    const ny=(gy+0.5-GRID/2)/(GRID/2);
    return (nx*nx)/0.92+(ny*ny)/0.98<=1;
  }

  function makePresetHex(paintFn){
    const out=new Array(GRID*GRID);
    for(let y=0;y<GRID;y++){
      for(let x=0;x<GRID;x++){
        const edge=Math.hypot((x-11.5)/12,(y-11.5)/12);
        let hex=edge>0.78?'e19628':edge>0.52?'ffca52':'ffe082';
        const custom=paintFn(x,y);
        if(custom)hex=custom;
        out[y*GRID+x]=hex;
      }
    }
    return out.join('');
  }

  const PRESETS={
    classic:{
      id:'classic',
      label:'Classic Crispy',
      hex:makePresetHex((x,y)=>{
        if((x>=6&&x<=8||x>=15&&x<=17)&&y>=9&&y<=12)return (x===6||x===15)&&y===9?'fff3bc':'46240e';
        if((x>=4&&x<=7||x>=16&&x<=19)&&y>=13&&y<=14)return 'f08c68';
        if(x>=10&&x<=13&&y>=15&&y<=17)return y===17?'e87a64':'763e17';
        return null;
      })
    },
    scholar:{
      id:'scholar',
      label:'Prof Specs',
      hex:makePresetHex((x,y)=>{
        if(y>=2&&y<=6&&x>=4&&x<=19)return y===2&&(x<7||x>16)?null:'46240e';
        if(y>=8&&y<=13&&((x>=4&&x<=10)||(x>=13&&x<=19))){
          if(y===8||y===13||x===4||x===10||x===13||x===19)return '46240e';
          if((x===7||x===16)&&y>=10&&y<=11)return '46240e';
          return 'fff3bc';
        }
        if(y===10&&x>=11&&x<=12)return '46240e';
        if(y===17&&x>=9&&x<=14)return '763e17';
        if(y===16&&(x===8||x===15))return '763e17';
        return null;
      })
    },
    chef:{
      id:'chef',
      label:'Diner Chef',
      hex:makePresetHex((x,y)=>{
        if(y>=1&&y<=5&&x>=5&&x<=18)return y===5?'d8c39e':'fff8ea';
        if((x>=7&&x<=8||x>=15&&x<=16)&&y>=9&&y<=11)return '46240e';
        if(y===14&&((x>=6&&x<=10)||(x>=13&&x<=17)))return '763e17';
        if(y===15&&(x===5||x===18||x===11||x===12))return '763e17';
        if(y===17&&x>=10&&x<=13)return 'ad641c';
        return null;
      })
    },
    cool:{
      id:'cool',
      label:'Arcade Shades',
      hex:makePresetHex((x,y)=>{
        if(y>=3&&y<=5&&x>=5&&x<=18)return 'ad641c';
        if(y===8&&x>=3&&x<=20)return '46240e';
        if(y>=9&&y<=12&&((x>=4&&x<=10)||(x>=13&&x<=19))){
          if((x===5||x===6||x===14||x===15)&&y===9)return 'fff3bc';
          return '46240e';
        }
        if(y===16&&x>=9&&x<=15)return '763e17';
        if(y===15&&x===15)return '763e17';
        return null;
      })
    }
  };

  function pixelateRgbaToHex(rgba,width,height,options={}){
    const style=options.style==='arcade'?'arcade':'crispy';
    const zoom=clamp(Number(options.zoom)||1.18,1,2.4);
    const contrast=clamp(Number(options.contrast)||1.15,0.75,1.85);
    const side=Math.max(4,Math.min(width,height)/zoom);
    const cx=width*0.5;
    const cy=height*0.45;
    const x0=clamp(cx-side/2,0,Math.max(0,width-side));
    const y0=clamp(cy-side/2,0,Math.max(0,height-side));

    const samples=new Array(GRID*GRID);
    const lumas=[];
    for(let gy=0;gy<GRID;gy++){
      for(let gx=0;gx<GRID;gx++){
        const sx0=Math.floor(x0+(gx*side)/GRID);
        const sx1=Math.max(sx0+1,Math.floor(x0+((gx+1)*side)/GRID));
        const sy0=Math.floor(y0+(gy*side)/GRID);
        const sy1=Math.max(sy0+1,Math.floor(y0+((gy+1)*side)/GRID));
        let rSum=0,gSum=0,bSum=0,count=0;
        for(let py=sy0;py<sy1&&py<height;py++){
          for(let px=sx0;px<sx1&&px<width;px++){
            const idx=(py*width+px)*4;
            const a=(rgba[idx+3]??255)/255;
            const r=rgba[idx]*a+248*(1-a);
            const g=rgba[idx+1]*a+222*(1-a);
            const b=rgba[idx+2]*a+172*(1-a);
            rSum+=r;gSum+=g;bSum+=b;count++;
          }
        }
        const r=count?rSum/count:235;
        const g=count?gSum/count:190;
        const b=count?bSum/count:110;
        const luma=0.299*r+0.587*g+0.114*b;
        samples[gy*GRID+gx]={r,g,b,luma};
        if(insidePotatoMask(gx,gy))lumas.push(luma);
      }
    }

    const sorted=[...lumas].sort((a,b)=>a-b);
    const lo=sorted.length?sorted[Math.floor(sorted.length*0.08)]:30;
    const hi=sorted.length?sorted[Math.floor(sorted.length*0.92)]:225;
    const span=Math.max(24,hi-lo);

    const stretched=new Float32Array(GRID*GRID);
    for(let i=0;i<GRID*GRID;i++){
      let norm=((samples[i].luma-lo)/span)*255;
      norm=(norm-128)*contrast+128;
      stretched[i]=clamp(norm,0,255);
    }

    const sharpened=new Float32Array(GRID*GRID);
    for(let gy=0;gy<GRID;gy++){
      for(let gx=0;gx<GRID;gx++){
        let sum=0,n=0;
        for(let dy=-1;dy<=1;dy++){
          for(let dx=-1;dx<=1;dx++){
            const nx=gx+dx,ny=gy+dy;
            if(nx>=0&&nx<GRID&&ny>=0&&ny<GRID){sum+=stretched[ny*GRID+nx];n++;}
          }
        }
        const cur=stretched[gy*GRID+gx];
        const avg=sum/n;
        sharpened[gy*GRID+gx]=clamp(cur+(cur-avg)*0.48,0,255);
      }
    }

    const out=new Array(GRID*GRID);
    for(let gy=0;gy<GRID;gy++){
      for(let gx=0;gx<GRID;gx++){
        const i=gy*GRID+gx;
        const bayer=(BAYER_4X4[gy%4][gx%4]/15-0.5);
        const lum=sharpened[i];
        if(style==='crispy'){
          const dithered=clamp(lum+bayer*34,0,255);
          const idx=clamp(Math.floor((dithered/256)*CRISPY_PALETTE.length),0,CRISPY_PALETTE.length-1);
          const [pr,pg,pb]=CRISPY_PALETTE[idx];
          out[i]=rgbToHex(pr,pg,pb);
        }else{
          const s=samples[i];
          const gain=(lum+12)/(s.luma+12);
          let r=clamp(s.r*gain*0.82+255*0.18+bayer*26,0,255);
          let g=clamp(s.g*gain*0.82+205*0.18+bayer*26,0,255);
          let b=clamp(s.b*gain*0.78+120*0.22+bayer*26,0,255);
          if(lum<48){r=70;g=36;b=16;}
          else{
            r=Math.round(r/42)*42;
            g=Math.round(g/42)*42;
            b=Math.round(b/42)*42;
          }
          out[i]=rgbToHex(r,g,b);
        }
      }
    }
    return out.join('');
  }

  function createDemoSelfieRgba(width=64,height=64,variant=0){
    const buf=new Uint8ClampedArray(width*height*4);
    for(let y=0;y<height;y++){
      for(let x=0;x<width;x++){
        const idx=(y*width+x)*4;
        const dx=(x-width/2)/(width*0.34),dy=(y-height*0.52)/(height*0.38);
        const inFace=dx*dx+dy*dy<=1;
        const inHair=dx*dx+((y-height*0.3)/(height*0.26))**2<=1.08&&y<height*0.42;
        let r=245,g=232,b=205;
        if(inHair){r=variant===1?135:45;g=variant===1?65:30;b=22;}
        else if(inFace){
          r=238;g=198;b=162;
          const eyeY=Math.abs(y-height*0.46)<height*0.045;
          const leftEye=Math.abs(x-width*0.39)<width*0.055;
          const rightEye=Math.abs(x-width*0.61)<width*0.055;
          if(eyeY&&(leftEye||rightEye)){r=32;g=22;b=18;}
          const smile=y>height*0.60&&y<height*0.67&&Math.abs(x-width*0.5)<width*0.13;
          if(smile){r=140;g=52;b=42;}
        }
        buf[idx]=r;buf[idx+1]=g;buf[idx+2]=b;buf[idx+3]=255;
      }
    }
    return buf;
  }

  function sanitizeAvatarSlot(raw,fallbackName){
    const preset=PRESETS[raw?.preset]?raw.preset:(isHexStream(raw?.hex)?'custom':'classic');
    const clean={
      name:typeof raw?.name==='string'&&raw.name.trim()?raw.name.trim().slice(0,12).toUpperCase():fallbackName,
      preset,
      style:raw?.style==='arcade'?'arcade':'crispy',
      hex:''
    };
    if(preset==='custom'&&isHexStream(raw?.hex))clean.hex=raw.hex.toLowerCase();
    else if(preset!=='classic'&&PRESETS[preset])clean.hex=PRESETS[preset].hex;
    return clean;
  }

  function freshAvatars(){
    return {
      version:2,
      p1:sanitizeAvatarSlot({name:'PLAYER 1',preset:'classic'},'PLAYER 1'),
      p2:sanitizeAvatarSlot({name:'PLAYER 2',preset:'cool'},'PLAYER 2')
    };
  }

  function sanitizeAvatars(raw){
    const base=freshAvatars();
    if(!raw||typeof raw!=='object')return base;
    base.p1=sanitizeAvatarSlot(raw.p1,'PLAYER 1');
    base.p2=sanitizeAvatarSlot(raw.p2,'PLAYER 2');
    return base;
  }

  let avatarMem=freshAvatars();
  function loadAvatars(){
    try{
      const s=root.localStorage?.getItem(AVATAR_KEY);
      if(s)avatarMem=sanitizeAvatars(JSON.parse(s));
    }catch{}
    return sanitizeAvatars(avatarMem);
  }
  function saveAvatar(slot,patch){
    const key=slot==='p2'?'p2':'p1';
    const cur=loadAvatars();
    cur[key]=sanitizeAvatarSlot({...cur[key],...patch},key==='p2'?'PLAYER 2':'PLAYER 1');
    avatarMem=cur;
    try{root.localStorage?.setItem(AVATAR_KEY,JSON.stringify(cur));}catch{}
    root.dispatchEvent?.(new CustomEvent('crunch-avatar-change',{detail:{slot:key,avatar:cur[key]}}));
    return cur[key];
  }

  // ---------------- 6-STAGE FAST-FOOD CAREER & UPGRADE LAB ----------------
  const CAREER_STAGES=[
    {
      index:0,id:'street',sceneId:'street',asset:'assets/scene-street.png',
      name:'Street Stall',enName:'Street Fry Cart',title:'Rookie Cook',
      badge:'STAGE 1 · Street Stall',color:'#3d5a73',accent:'#ffd166',
      targetScore:80,duration:45,speed:1.55,rate:1.05,hazards:0.06,bombShare:0,ramp:0.30,
      wageMult:1.0,clearBonus:35,
      pitch:'Start with a tiny iron spatula under a late-night tarp. Hit 80 pts to jump to Wallace!'
    },
    {
      index:1,id:'wallace',sceneId:'wallace',asset:'assets/scene-wallace.png',
      name:'Wallace',enName:'Wallace Express',title:'Combo Crew',
      badge:'STAGE 2 · Wallace',color:'#c8431b',accent:'#ffe066',
      targetScore:160,duration:50,speed:2.05,rate:1.38,hazards:0.13,bombShare:0.25,ramp:0.38,
      wageMult:1.5,clearBonus:60,
      pitch:'Value-combo rush! Upgrade to a Paper Fry Box or Aroma Magnet and hit 160 pts!'
    },
    {
      index:2,id:'burgerking',sceneId:'burgerking',asset:'assets/scene-burgerking.png',
      name:'Burger King',enName:'Burger King Grill',title:'Flame Specialist',
      badge:'STAGE 3 · Burger King',color:'#1c4b82',accent:'#ff922b',
      targetScore:260,duration:55,speed:2.55,rate:1.72,hazards:0.18,bombShare:0.35,ramp:0.42,
      wageMult:2.0,clearBonus:90,
      pitch:'Open-flame heat! Hire an Auto Sous-Chef Bot so two catchers work the counter together!'
    },
    {
      index:3,id:'mcd',sceneId:'mcd',asset:'assets/scene-mcd.png',
      name:'McD',enName:'McD Golden Morning',title:'Arches Manager',
      badge:'STAGE 4 · McD Breakfast',color:'#bd2626',accent:'#fcc419',
      targetScore:380,duration:60,speed:3.05,rate:2.15,hazards:0.22,bombShare:0.40,ramp:0.45,
      wageMult:2.5,clearBonus:130,
      pitch:'Peak breakfast drive-thru! Hash browns rain fast — equip the Pro Wire Basket!'
    },
    {
      index:4,id:'kfc',sceneId:'kfc',asset:'assets/scene-kfc.png',
      name:'KFC',enName:'KFC Stripe Kitchen',title:'Bucket Commander',
      badge:'STAGE 5 · KFC',color:'#a51e22',accent:'#fff3df',
      targetScore:520,duration:60,speed:3.60,rate:2.55,hazards:0.27,bombShare:0.45,ramp:0.48,
      wageMult:3.0,clearBonus:180,
      pitch:'Crazy Thursday storm! Twin catchers + Golden Vortex magnet turn chaos into pure gold!'
    },
    {
      index:5,id:'bluefrog',sceneId:'bluefrog',asset:'assets/scene-bluefrog.png',
      name:'Blue Frog',enName:'Blue Frog Bistro',title:'Executive Chef',
      badge:'STAGE 6 · BLUE FROG',color:'#163b5c',accent:'#f3c669',
      targetScore:680,duration:60,speed:4.15,rate:3.00,hazards:0.30,bombShare:0.50,ramp:0.50,
      wageMult:4.0,clearBonus:260,
      pitch:'Upscale sapphire bistro finale! 4× wages — hit 680 pts to claim the Executive Potato Crown!'
    }
  ];

  const UPGRADE_TRACKS={
    tool:{
      id:'tool',
      title:'CATCHER GEAR',
      subtitle:'Grow your catcher: Mini Spatula → Paper Fry Box → Pro Wire Basket → Jumbo Chef Tray',
      tiers:[
        {level:0,cost:0,toolId:'spatula',name:'Mini Spatula',width:96,speedMult:1.14,desc:'Narrow 96px iron spatula. Nimble starter gear!'},
        {level:1,cost:45,toolId:'carton',name:'Paper Fry Box',width:136,speedMult:1.08,desc:'Red-white striped carton! Catch width +42% (136px).'},
        {level:2,cost:110,toolId:'basket',name:'Pro Wire Basket',width:176,speedMult:1.03,desc:'Wide commercial wire fry basket (176px).'},
        {level:3,cost:220,toolId:'tray',name:'Jumbo Chef Tray',width:224,speedMult:1.00,desc:'Massive 224px golden banquet tray — sweeps half the counter!'}
      ]
    },
    bot:{
      id:'bot',
      title:'AUTO SOUS-CHEF',
      subtitle:'Add a second automated catcher to work alongside you.',
      tiers:[
        {level:0,cost:0,active:false,botTool:'spatula',name:'Solo Hand',width:0,speed:0,chasePowerups:false,desc:'Unlock an AI robo-catcher so TWO catchers work together!'},
        {level:1,cost:80,active:true,botTool:'spatula',name:'Rookie Bot',width:88,speed:320,chasePowerups:false,desc:'Spawns a 2nd AI robo-spatula (88px) that catches gold & dodges bombs!'},
        {level:2,cost:170,active:true,botTool:'carton',name:'Turbo Bot',width:116,speed:480,chasePowerups:true,desc:'Faster 116px AI carton bot — also grabs Clocks, Coffee & Cola!'},
        {level:3,cost:290,active:true,botTool:'tray',name:'Master Robo-Tray',width:148,speed:660,chasePowerups:true,desc:'Blazing 148px golden robo-tray — twin-catcher money printer!'}
      ]
    },
    magnet:{
      id:'magnet',
      title:'CRISPY MAGNET',
      subtitle:'Pull nearby golden bites toward your catcher.',
      tiers:[
        {level:0,cost:0,name:'No Magnet',radius:0,pull:0,desc:'Upgrade to pull nearby golden hash browns into your catcher.'},
        {level:1,cost:45,name:'Warm Aroma',radius:115,pull:210,desc:'Gently curves golden bites within 115px toward your rim.'},
        {level:2,cost:105,name:'Golden Vortex',radius:170,pull:330,desc:'Strong 170px aroma vortex pulls golden bites & power-ups.'},
        {level:3,cost:200,name:'Crisp Magnet MAX',radius:235,pull:470,desc:'Huge 235px magnetic funnel — edge drops snap right in!'}
      ]
    },
    chef:{
      id:'chef',
      title:'CHEF PRESTIGE',
      subtitle:'Earn more points, streak tips and a starting shield.',
      tiers:[
        {level:0,cost:0,name:'Trainee',bonusScore:0,tipEvery5:0,startShield:false,feverDuration:5,desc:'Upgrade for higher points per catch, streak tips & starting shield.'},
        {level:1,cost:55,name:'Streak Tipper',bonusScore:2,tipEvery5:3,startShield:false,feverDuration:5,desc:'+2 pts per catch & +3 bonus coins every 5-streak!'},
        {level:2,cost:130,name:'Shift Shield',bonusScore:4,tipEvery5:5,startShield:true,feverDuration:5.5,desc:'+4 pts/catch, +5 streak tip, AND start every shift with a Cola Shield!'},
        {level:3,cost:240,name:'Bistro Partner',bonusScore:6,tipEvery5:8,startShield:true,feverDuration:6.5,desc:'+6 pts/catch, +8 tip, starting shield & 6.5s Alarm Clock Fever!'}
      ]
    }
  };

  function freshCareer(){
    return {
      version:1,
      unlockedStage:0,
      selectedStage:0,
      clearedStages:[],
      stageBests:{},
      upgrades:{tool:0,bot:0,magnet:0,chef:0},
      equippedTool:0
    };
  }

  function sanitizeCareer(raw){
    const c=freshCareer();
    if(!raw||typeof raw!=='object')return c;
    const maxIdx=CAREER_STAGES.length-1;
    const int=(v,hi)=>Number.isInteger(v)?clamp(v,0,hi):0;
    c.unlockedStage=int(raw.unlockedStage,maxIdx);
    c.selectedStage=int(raw.selectedStage,c.unlockedStage);
    if(Array.isArray(raw.clearedStages)){
      c.clearedStages=[...new Set(raw.clearedStages.filter(id=>CAREER_STAGES.some(s=>s.id===id)))];
    }
    if(raw.stageBests&&typeof raw.stageBests==='object'){
      for(const st of CAREER_STAGES){
        const val=Math.floor(Number(raw.stageBests[st.id])||0);
        if(val>0)c.stageBests[st.id]=val;
      }
    }
    for(const k of Object.keys(UPGRADE_TRACKS)){
      const maxLv=UPGRADE_TRACKS[k].tiers.length-1;
      c.upgrades[k]=int(raw.upgrades?.[k],maxLv);
    }
    c.equippedTool=clamp(Number.isInteger(raw.equippedTool)?raw.equippedTool:c.upgrades.tool,0,c.upgrades.tool);
    return c;
  }

  let careerMem=freshCareer();
  function loadCareer(){
    try{
      const s=root.localStorage?.getItem(CAREER_KEY);
      if(s)careerMem=sanitizeCareer(JSON.parse(s));
    }catch{}
    return sanitizeCareer(careerMem);
  }

  function saveCareer(next){
    careerMem=sanitizeCareer(next);
    try{root.localStorage?.setItem(CAREER_KEY,JSON.stringify(careerMem));}catch{}
    root.dispatchEvent?.(new CustomEvent('crunch-career-change',{detail:{career:careerMem}}));
    return careerMem;
  }

  function selectCareerStage(index){
    const c=loadCareer();
    if(!Number.isInteger(index)||index<0||index>c.unlockedStage)return {ok:false,career:c};
    c.selectedStage=index;
    return {ok:true,career:saveCareer(c),stage:CAREER_STAGES[c.selectedStage]};
  }

  function selectCatcherTool(level){
    const c=loadCareer();
    if(!Number.isInteger(level)||level<0||level>c.upgrades.tool)return {ok:false,career:c};
    c.equippedTool=level;
    return {ok:true,career:saveCareer(c),tier:UPGRADE_TRACKS.tool.tiers[level]};
  }

  function upgradeTrack(trackId,economyApi){
    const track=UPGRADE_TRACKS[trackId];
    if(!track)return {ok:false,message:'Unknown upgrade track.'};
    const c=loadCareer();
    const curLv=c.upgrades[trackId]||0;
    if(curLv>=track.tiers.length-1)return {ok:false,message:'Already at MAX level!'};
    const nextTier=track.tiers[curLv+1];
    if(economyApi&&typeof economyApi.debit==='function'){
      const paid=economyApi.debit(nextTier.cost,nextTier.name);
      if(!paid.ok)return {ok:false,message:paid.message,cost:nextTier.cost};
    }
    c.upgrades[trackId]=curLv+1;
    if(trackId==='tool')c.equippedTool=curLv+1;
    const saved=saveCareer(c);
    return {ok:true,trackId,level:curLv+1,tier:nextTier,career:saved,message:`✓ Upgraded to ${nextTier.name}!`};
  }

  function careerRuntimeSpec(careerState){
    const c=sanitizeCareer(careerState||loadCareer());
    const stage=CAREER_STAGES[c.selectedStage]||CAREER_STAGES[0];
    const tool=UPGRADE_TRACKS.tool.tiers[c.equippedTool]||UPGRADE_TRACKS.tool.tiers[0];
    const bot=UPGRADE_TRACKS.bot.tiers[c.upgrades.bot]||UPGRADE_TRACKS.bot.tiers[0];
    const magnet=UPGRADE_TRACKS.magnet.tiers[c.upgrades.magnet]||UPGRADE_TRACKS.magnet.tiers[0];
    const chef=UPGRADE_TRACKS.chef.tiers[c.upgrades.chef]||UPGRADE_TRACKS.chef.tiers[0];
    return {
      stageIndex:stage.index,
      stageId:stage.id,
      stageName:stage.name,
      enName:stage.enName,
      badge:stage.badge,
      asset:stage.asset,
      sceneId:stage.sceneId,
      targetScore:stage.targetScore,
      wageMult:stage.wageMult,
      clearBonus:stage.clearBonus,
      cfg:{
        stageId:stage.id,
        speed:stage.speed,
        rate:stage.rate,
        hazards:stage.hazards,
        bombShare:stage.bombShare,
        duration:stage.duration,
        ramp:stage.ramp,
        description:stage.pitch
      },
      tool,
      bot,
      magnet,
      chef,
      bonusScore:chef.bonusScore,
      tipEvery5:chef.tipEvery5,
      startShield:chef.startShield,
      feverDuration:chef.feverDuration
    };
  }

  function completeCareerShift(stageIndex,score,economyApi){
    const c=loadCareer();
    const st=CAREER_STAGES[clamp(stageIndex,0,CAREER_STAGES.length-1)];
    const prevBest=c.stageBests[st.id]||0;
    const isNewBest=score>prevBest;
    if(isNewBest)c.stageBests[st.id]=score;
    const cleared=score>=st.targetScore;
    const firstClear=cleared&&!c.clearedStages.includes(st.id);
    let bonusCoins=0;
    let unlockedNextStage=null;
    if(cleared){
      if(firstClear){
        c.clearedStages.push(st.id);
        bonusCoins=st.clearBonus;
        if(economyApi?.bank)economyApi.bank('career-clear:'+st.id,bonusCoins);
      }
      if(economyApi?.grant)economyApi.grant(st.sceneId,false);
      if(st.index+1<CAREER_STAGES.length){
        if(c.unlockedStage<st.index+1){
          c.unlockedStage=st.index+1;
          unlockedNextStage=CAREER_STAGES[st.index+1];
        }
        c.selectedStage=st.index+1;
        if(economyApi?.grant)economyApi.grant(CAREER_STAGES[st.index+1].sceneId,true);
      }
    }
    const saved=saveCareer(c);
    return {
      cleared,
      firstClear,
      bonusCoins,
      isNewBest,
      stage:st,
      nextStage:st.index+1<CAREER_STAGES.length?CAREER_STAGES[st.index+1]:null,
      unlockedNextStage,
      allCleared:saved.clearedStages.length===CAREER_STAGES.length,
      career:saved
    };
  }

  function nextRecommendedUpgrade(careerState,wallet=0){
    const c=sanitizeCareer(careerState||loadCareer());
    const candidates=[];
    for(const key of ['tool','bot','magnet','chef']){
      const lv=c.upgrades[key]||0;
      const tiers=UPGRADE_TRACKS[key].tiers;
      if(lv<tiers.length-1){
        const next=tiers[lv+1];
        candidates.push({trackId:key,level:lv+1,cost:next.cost,name:next.name,desc:next.desc,affordable:wallet>=next.cost});
      }
    }
    candidates.sort((a,b)=>(b.affordable-a.affordable)||a.cost-b.cost);
    return candidates[0]||null;
  }

  function resetCareer(){
    return saveCareer(freshCareer());
  }

  // ---------------- HALL-OF-FAME LEADERBOARD ----------------
  const HOUSE_SEED=[
    {id:'house-1',name:'FRYER DUO',score:210,mode:'2p-coop',level:'medium',caught:16,streak:9,avatarHex:PRESETS.chef.hex,house:true,createdAt:'2026-11-15'},
    {id:'house-2',name:'CHEF CRISPY',score:170,mode:'1p',level:'medium',caught:18,streak:8,avatarHex:'',house:true,createdAt:'2026-11-15'},
    {id:'house-3',name:'SPUD RIVAL',score:140,mode:'2p-vs',level:'medium',caught:14,streak:6,avatarHex:PRESETS.scholar.hex,house:true,createdAt:'2026-11-15'}
  ];

  function sanitizeEntry(e,idx=0){
    if(!e||typeof e!=='object')return null;
    const score=Number.isFinite(Number(e.score))?Math.max(0,Math.floor(Number(e.score))):0;
    const mode=['career','1p','2p-vs','2p-coop'].includes(e.mode)?e.mode:'1p';
    const level=typeof e.level==='string'&&e.level?e.level.slice(0,16):'medium';
    const rawName=typeof e.name==='string'?e.name.replace(/[^\w\s\-\u4e00-\u9fa5]/g,'').trim():'';
    return {
      id:typeof e.id==='string'&&e.id?e.id.slice(0,40):'entry-'+idx,
      name:(rawName||'CRISPY').slice(0,12).toUpperCase(),
      score,
      mode,
      level,
      caught:Math.max(0,Math.floor(Number(e.caught)||0)),
      streak:Math.max(0,Math.floor(Number(e.streak)||0)),
      avatarHex:isHexStream(e.avatarHex)?e.avatarHex.toLowerCase():'',
      house:Boolean(e.house),
      createdAt:typeof e.createdAt==='string'?e.createdAt.slice(0,10):'2026-11-15'
    };
  }

  function sortEntries(list){
    return [...list].sort((a,b)=>b.score-a.score||b.caught-a.caught||(a.house===b.house?0:a.house?1:-1));
  }

  let boardMem=sortEntries(HOUSE_SEED.map(sanitizeEntry));
  function loadBoard(){
    try{
      const s=root.localStorage?.getItem(BOARD_KEY);
      if(s){
        const parsed=JSON.parse(s);
        if(Array.isArray(parsed)){
          const cleaned=parsed.map(sanitizeEntry).filter(Boolean);
          boardMem=cleaned.length?sortEntries(cleaned).slice(0,30):sortEntries(HOUSE_SEED.map(sanitizeEntry));
        }
      }
    }catch{}
    return sortEntries(boardMem);
  }

  function saveBoardList(list){
    boardMem=sortEntries(list.map(sanitizeEntry).filter(Boolean)).slice(0,30);
    try{root.localStorage?.setItem(BOARD_KEY,JSON.stringify(boardMem));}catch{}
    root.dispatchEvent?.(new CustomEvent('crunch-board-change'));
    return boardMem;
  }

  function submitScore(entry){
    const current=loadBoard().filter(x=>x.id!==entry?.id);
    const item=sanitizeEntry({
      ...entry,
      id:entry?.id||('run-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)),
      house:false,
      createdAt:entry?.createdAt||new Date().toISOString().slice(0,10)
    });
    if(!item)return {ok:false,rank:0,entries:current};
    const updated=saveBoardList([...current,item]);
    const rank=updated.findIndex(x=>x.id===item.id)+1;
    return {ok:true,entry:item,rank,entries:updated};
  }

  function filterBoard(entries,modeFilter='all'){
    if(!modeFilter||modeFilter==='all')return entries;
    return entries.filter(e=>e.mode===modeFilter);
  }

  function resetBoard(){
    return saveBoardList(HOUSE_SEED);
  }

  const api={
    GRID,
    AVATAR_KEY,
    BOARD_KEY,
    CAREER_KEY,
    PRESETS,
    CRISPY_PALETTE,
    CAREER_STAGES,
    UPGRADE_TRACKS,
    insidePotatoMask,
    isHexStream,
    pixelateRgbaToHex,
    createDemoSelfieRgba,
    freshAvatars,
    sanitizeAvatars,
    loadAvatars,
    saveAvatar,
    freshCareer,
    sanitizeCareer,
    loadCareer,
    saveCareer,
    selectCareerStage,
    selectCatcherTool,
    upgradeTrack,
    careerRuntimeSpec,
    completeCareerShift,
    nextRecommendedUpgrade,
    resetCareer,
    loadBoard,
    submitScore,
    filterBoard,
    resetBoard
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.CrunchArcade=api;
})(typeof window!=='undefined'?window:globalThis);
