/* Pixel Potato Avatar Synthesis Pipeline & Hall-of-Fame Leaderboard Store.
 * Pure image quantization + local persistence, usable in both browser and Node checks.
 */
(function(root){
  'use strict';
  const STAGE_PREFIX='crunch-course-stage-03';
  const AVATAR_KEY=STAGE_PREFIX+'-avatars';
  const BOARD_KEY=STAGE_PREFIX+'-leaderboard';
  const GRID=24;

  // 6-tone warm fried hash-brown ramp (dark espresso roast -> sunny butter highlight)
  const CRISPY_PALETTE=[
    [70,36,14],    // #46240e deep roast (eyes, glasses, dark hair)
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
  function isHexStream(s){return typeof s==='string'&&s.length===GRID*GRID*6&&/^[0-9a-f]+$/i.test(s);}

  // Elliptical mask matching the interior face zone of makePotato (24x24 inside 40x52)
  function insidePotatoMask(gx,gy){
    const nx=(gx-11.5)/12.2;
    const ny=(gy-11.5)/12.4;
    return nx*nx+ny*ny<=1.0;
  }

  // Procedural built-in pixel portraits (24x24 packed hex streams)
  function buildPresetHex(kind){
    if(kind==='classic')return '';
    const grid=new Array(GRID*GRID).fill('ffc24b');
    const set=(x,y,hex)=>{if(x>=0&&x<GRID&&y>=0&&y<GRID)grid[y*GRID+x]=hex.replace('#','');};
    const rect=(x,y,w,h,hex)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)set(i,j,hex);};
    // Warm potato base gradient
    for(let y=0;y<GRID;y++){
      for(let x=0;x<GRID;x++){
        set(x,y,y<6?'ffd463':y<18?'ffc24b':'f4ae38');
      }
    }
    if(kind==='scholar'){
      // Fluffy dark hair + pixel glasses + cheerful smile ("Prof / Scholar Spud")
      rect(3,1,18,4,'4a2510');rect(2,3,20,3,'5e3116');rect(5,0,14,2,'4a2510');
      // Glasses frames
      rect(3,8,8,6,'46240e');rect(13,8,8,6,'46240e');rect(11,10,2,2,'46240e');
      rect(4,9,6,4,'fff4be');rect(14,9,6,4,'fff4be');
      // Pupils + shine
      rect(6,10,2,2,'46240e');rect(16,10,2,2,'46240e');
      set(5,9,'ffffff');set(15,9,'ffffff');
      // Rosy cheeks + smile
      rect(3,15,3,2,'f08c69');rect(18,15,3,2,'f08c69');
      rect(8,16,8,2,'5e3116');set(7,15,'5e3116');set(16,15,'5e3116');
      rect(9,17,6,1,'f29279');
    }else if(kind==='chef'){
      // Diner chef toque + wink + curly mustache
      rect(4,0,16,5,'fff9eb');rect(3,2,18,3,'fff9eb');rect(4,5,16,2,'cf3f2c');
      // Left eye open, right eye wink
      rect(6,9,3,4,'46240e');set(6,9,'fff4be');
      rect(14,10,5,2,'46240e');set(13,11,'46240e');set(19,11,'46240e');
      // Curly chef mustache
      rect(6,15,12,2,'5c3014');rect(4,14,3,2,'5c3014');rect(17,14,3,2,'5c3014');
      rect(10,17,4,2,'d95a43');
    }else if(kind==='cool'){
      // Retro arcade headband + pixel sunglasses + smirk
      rect(2,3,20,3,'2a7b76');rect(4,2,16,1,'7de0d6');
      rect(2,8,20,2,'331b0e');
      rect(3,9,8,5,'331b0e');rect(13,9,8,5,'331b0e');
      rect(4,10,3,2,'ffd96b');rect(14,10,3,2,'ffd96b');
      rect(8,17,7,2,'5c3014');set(15,16,'5c3014');set(16,15,'5c3014');
    }
    return grid.join('');
  }

  const PRESETS={
    classic:{id:'classic',name:'Classic Crispy',hex:''},
    scholar:{id:'scholar',name:'Scholar Specs',hex:buildPresetHex('scholar')},
    chef:{id:'chef',name:'Chef Whiskers',hex:buildPresetHex('chef')},
    cool:{id:'cool',name:'Arcade Shades',hex:buildPresetHex('cool')}
  };

  /**
   * Converts raw RGBA pixel buffer into a 24x24 pixel-art hash-brown portrait hex stream.
   * Pipeline: Center-face square crop -> Box-area downsample -> Percentile contrast stretch
   * -> Local feature unsharp boost -> 4x4 Bayer ordered dithering -> Crispy / Arcade palette.
   */
  function pixelateRgbaToHex(rgba,width,height,options={}){
    if(!rgba||width<=0||height<=0)return '';
    const style=options.style==='arcade'?'arcade':'crispy';
    const zoom=clamp(Number(options.zoom)||1.18,1,2.4);
    const contrast=clamp(Number(options.contrast)||1.15,0.75,1.8);
    const offsetX=clamp(Number(options.offsetX)||0,-0.4,0.4);
    const offsetY=clamp(Number(options.offsetY)||-0.04,-0.4,0.4);

    const side=Math.max(1,Math.min(width,height)/zoom);
    const cx=clamp(width*(0.5+offsetX),side/2,width-side/2);
    const cy=clamp(height*(0.46+offsetY),side/2,height-side/2);
    const sx0=clamp(cx-side/2,0,Math.max(0,width-side));
    const sy0=clamp(cy-side/2,0,Math.max(0,height-side));

    const samples=new Array(GRID*GRID);
    const lumas=[];

    for(let gy=0;gy<GRID;gy++){
      const yStart=Math.floor(sy0+(gy/GRID)*side);
      const yEnd=Math.max(yStart+1,Math.floor(sy0+((gy+1)/GRID)*side));
      for(let gx=0;gx<GRID;gx++){
        const xStart=Math.floor(sx0+(gx/GRID)*side);
        const xEnd=Math.max(xStart+1,Math.floor(sx0+((gx+1)/GRID)*side));
        let rSum=0,gSum=0,bSum=0,count=0;
        for(let py=yStart;py<yEnd&&py<height;py++){
          for(let px=xStart;px<xEnd&&px<width;px++){
            const idx=(py*width+px)*4;
            const a=(rgba[idx+3]??255)/255;
            // Composite transparent pixels over warm potato cream
            const r=rgba[idx]*a+255*(1-a);
            const g=rgba[idx+1]*a+236*(1-a);
            const b=rgba[idx+2]*a+190*(1-a);
            rSum+=r;gSum+=g;bSum+=b;count++;
          }
        }
        const r=count?rSum/count:255;
        const g=count?gSum/count:194;
        const b=count?bSum/count:75;
        const luma=0.299*r+0.587*g+0.114*b;
        samples[gy*GRID+gx]={r,g,b,luma};
        if(insidePotatoMask(gx,gy))lumas.push(luma);
      }
    }

    // 8th-to-92nd percentile auto-contrast stretch
    const sorted=[...lumas].sort((a,b)=>a-b);
    const lo=sorted.length?sorted[Math.floor(sorted.length*0.08)]:25;
    const hi=sorted.length?sorted[Math.floor(sorted.length*0.92)]:230;
    const span=Math.max(28,hi-lo);

    const stretched=samples.map(s=>{
      const norm=((s.luma-lo)/span-0.5)*contrast+0.5;
      return clamp(norm*255,0,255);
    });

    // Gentle 3x3 unsharp mask so eyes, eyebrows, glasses, and smiles read clearly at 24x24
    const sharpened=new Array(GRID*GRID);
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
          // 16-bit Arcade Color: warm diner color harmony + dark roast contour crispness
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

  // Deterministic synthetic selfie generator for quick 1-click demo & automated tests
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
    const clean={
      name:typeof raw?.name==='string'&&raw.name.trim()?raw.name.trim().slice(0,12).toUpperCase():fallbackName,
      preset:PRESETS[raw?.preset]?raw.preset:(isHexStream(raw?.hex)?'custom':'classic'),
      style:raw?.style==='arcade'?'arcade':'crispy',
      hex:''
    };
    if(clean.preset==='custom'&&isHexStream(raw?.hex))clean.hex=raw.hex.toLowerCase();
    else if(PRESETS[clean.preset])clean.hex=PRESETS[clean.preset].hex;
    return clean;
  }

  function freshAvatars(){
    return {
      version:1,
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

  // Hall-of-Fame Leaderboard with embedded pixel potato portrait snapshots
  const HOUSE_SEED=[
    {id:'house-1',name:'FRYER DUO',score:210,mode:'2p-coop',level:'medium',caught:16,streak:9,avatarHex:PRESETS.chef.hex,house:true,createdAt:'2026-11-15'},
    {id:'house-2',name:'CHEF CRISPY',score:170,mode:'1p',level:'medium',caught:18,streak:8,avatarHex:'',house:true,createdAt:'2026-11-15'},
    {id:'house-3',name:'SPUD RIVAL',score:140,mode:'2p-vs',level:'medium',caught:14,streak:6,avatarHex:PRESETS.scholar.hex,house:true,createdAt:'2026-11-15'}
  ];

  function sanitizeEntry(e,idx=0){
    if(!e||typeof e!=='object')return null;
    const score=Number.isFinite(Number(e.score))?Math.max(0,Math.floor(Number(e.score))):0;
    const mode=['1p','2p-vs','2p-coop'].includes(e.mode)?e.mode:'1p';
    const level=['easy','medium','hard','hell','custom'].includes(e.level)?e.level:'medium';
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
    PRESETS,
    CRISPY_PALETTE,
    insidePotatoMask,
    isHexStream,
    pixelateRgbaToHex,
    createDemoSelfieRgba,
    freshAvatars,
    sanitizeAvatars,
    loadAvatars,
    saveAvatar,
    loadBoard,
    submitScore,
    filterBoard,
    resetBoard
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.CrunchArcade=api;
})(typeof window!=='undefined'?window:globalThis);
