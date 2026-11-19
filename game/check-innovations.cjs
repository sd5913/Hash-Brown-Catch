const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const R=require('./game-core.js');
const E=require('./economy.js');
const A=require('./arcade.js');

const stagePath=path.join(__dirname,'check-stage.cjs');
const stageMatch=fs.existsSync(stagePath)?(fs.readFileSync(stagePath,'utf8').match(/const stage=(\d+)/)||[])[1]:'5';
const stage=Number(stageMatch)||5;
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name);}

test('2P VS tracks independent player scores, hazards, and winner summary',()=>{
  const s=R.newState(R.config('medium'),'2p-vs');
  R.resolve(s,'golden',true,1);
  R.resolve(s,'golden',true,2);
  R.resolve(s,'golden',true,2);
  assert.equal(s.players.p1.score,10);
  assert.equal(s.players.p2.score,20);
  R.resolve(s,'burnt',true,2);
  assert.equal(s.players.p2.score,10);
  R.resolve(s,'golden',true,1);
  const sum=R.winnerSummary(s);
  assert.equal(sum.winner,'p1');
  assert.equal(sum.p1Score,20);
  assert.equal(sum.p2Score,10);
});

test('2P VS basket bump physics separates overlapping baskets and applies knockback',()=>{
  const b1={x:460,w:144,vx:0},b2={x:500,w:144,vx:0};
  const res=R.collideBaskets(b1,b2,960);
  assert.equal(res.bumped,true);
  assert.ok(b2.x-b1.x>=144*0.88);
  assert.ok(b1.vx<0&&b2.vx>0);
});

test('2P Co-op awards +5 alternating relay bonus when P1 and P2 pass catches',()=>{
  const s=R.newState(R.config('medium'),'2p-coop');
  assert.equal(R.resolve(s,'golden',true,1),10);
  assert.equal(R.resolve(s,'golden',true,2),15);
  assert.equal(s.lastRelayBonus,true);
  assert.equal(s.relayCount,1);
  assert.equal(R.resolve(s,'golden',true,2),10);
  assert.equal(R.resolve(s,'golden',true,1),15);
  assert.equal(s.relayCount,2);
  assert.equal(s.score,50);
});

test('Pixel Potato Avatar quantizer converts raw RGBA photo into valid 24x24 hex stream in both styles',()=>{
  const demo=A.createDemoSelfieRgba(64,64,0);
  const crispyHex=A.pixelateRgbaToHex(demo,64,64,{style:'crispy',zoom:1.2,contrast:1.2});
  const arcadeHex=A.pixelateRgbaToHex(demo,64,64,{style:'arcade',zoom:1.2,contrast:1.2});
  assert.equal(A.isHexStream(crispyHex),true);
  assert.equal(A.isHexStream(arcadeHex),true);
  assert.notEqual(crispyHex,arcadeHex);
  const saved=A.saveAvatar('p1',{name:'max',preset:'custom',style:'crispy',hex:crispyHex});
  assert.equal(saved.name,'MAX');
  assert.equal(saved.hex,crispyHex);
});

test('Hall of Fame leaderboard ranks scores, embeds pixel portraits, and filters by play mode',()=>{
  A.resetBoard();
  const demoHex=A.PRESETS.scholar.hex;
  const sub=A.submitScore({id:'test-top',name:'team ace',score:990,mode:'2p-coop',level:'hard',caught:62,streak:18,avatarHex:demoHex});
  assert.equal(sub.ok,true);
  assert.equal(sub.rank,1);
  assert.equal(sub.entry.avatarHex,demoHex);
  const coopOnly=A.filterBoard(A.loadBoard(),'2p-coop');
  assert.ok(coopOnly.length>=1&&coopOnly.every(e=>e.mode==='2p-coop'));
  A.resetBoard();
});

test('Final 5-second countdown and (Stage >= 4) Alarm Clock 5-4-3-2-1 Fever Big Countdown work accurately',()=>{
  const s=R.newState(R.config('easy'),'1p');
  s.remaining=4.4;
  let cd=R.bigCountdown(s);
  assert.equal(cd.active,true);
  assert.equal(cd.kind,'final');
  assert.equal(cd.number,5);
  if(stage>=4){
    s.remaining=30;
    R.resolve(s,'clock',true,1);
    assert.equal(s.remaining,35);
    assert.equal(s.feverRemaining,5);
    cd=R.bigCountdown(s);
    assert.equal(cd.active,true);
    assert.equal(cd.kind,'fever');
    assert.equal(cd.number,5);
    for(let i=0;i<30;i++)assert.equal(R.chooseType(R.config('hell'),()=>0.01,s),'golden');
    assert.equal(R.resolve(s,'golden',true,1),15);
    R.tick(s,5.1);
    assert.equal(s.feverRemaining,0);
  }
});

test('6-Stage Career ladder progresses from Street Cart through Wallace, BK, McD, KFC to Blue Frog',()=>{
  A.resetCareer();
  assert.deepEqual(A.CAREER_STAGES.map(s=>s.id),['street','wallace','burgerking','mcd','kfc','bluefrog']);
  for(const st of A.CAREER_STAGES){
    assert.equal(fs.existsSync(path.join(__dirname,st.asset)),true,'missing scene asset '+st.asset);
  }
  const spec0=A.careerRuntimeSpec(A.loadCareer());
  assert.equal(spec0.tool.toolId,'spatula');
  assert.equal(spec0.targetScore,80);
  const s=R.newState(spec0.cfg,'career',spec0);
  for(let i=0;i<8;i++)R.resolve(s,'golden',true,1);
  assert.equal(s.score,80);
  assert.equal(s.career.promoted,true);
  const out=A.completeCareerShift(0,s.score,null);
  assert.equal(out.cleared,true);
  assert.equal(out.firstClear,true);
  assert.equal(out.bonusCoins,35);
  assert.equal(out.nextStage.id,'wallace');
  assert.equal(A.loadCareer().unlockedStage,1);
  A.resetCareer();
});

test('Upgrade Lab upgrades Spatula -> Paper Carton, Auto Sous-Chef Bot dodges bombs, and Crispy Magnet pulls only good items',()=>{
  A.resetCareer();
  const mockWallet={coins:300,debit(cost){if(this.coins<cost)return {ok:false,message:'short'};this.coins-=cost;return {ok:true};}};
  const upTool=A.upgradeTrack('tool',mockWallet);
  assert.equal(upTool.ok,true);
  assert.equal(upTool.tier.toolId,'carton');
  assert.equal(mockWallet.coins,255);
  const upBot=A.upgradeTrack('bot',mockWallet);
  assert.equal(upBot.ok,true);
  assert.equal(upBot.tier.active,true);

  // Magnet pulls golden item toward catcher, never pulls bomb
  const catcher={x:500,y:485,w:136};
  const gold={x:420,y:410,type:'golden'};
  const bomb={x:420,y:410,type:'bomb'};
  assert.equal(R.applyMagnet(gold,catcher,160,300,0.1,960),true);
  assert.ok(gold.x>420);
  assert.equal(R.applyMagnet(bomb,catcher,160,300,0.1,960),false);
  assert.equal(bomb.x,420);

  // Auto-Bot steers toward golden item while evading imminent bomb
  const bot={x:500,y:485,w:100,speed:400,chasePowerups:true};
  R.stepAutoBot(bot,[{x:650,y:380,w:46,speed:180,type:'golden'}],960,0.2);
  assert.ok(bot.x>500);
  const beforeDodge=bot.x;
  R.stepAutoBot(bot,[{x:beforeDodge,y:400,w:48,speed:220,type:'bomb'}],960,0.2);
  assert.notEqual(bot.x,beforeDodge);
  A.resetCareer();
});

test('Universal scene loader, upgrade dialog, and ESC exit handler are wired cleanly',()=>{
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  const js=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
  for(const id of ['upgrade-dialog','avatar-dialog','leaderboard-dialog','exit-button','career-stage-list'])assert.ok(html.includes(id),'missing '+id);
  assert.ok(js.includes("e.key==='Escape'")&&js.includes('exitToMenu'),'missing Escape exit handler');
  assert.ok(js.includes('new Image()')&&js.includes('p.clear()')&&js.includes("canvas[data-item]"),'missing universal scene loader or safe canvas[data-item] selector');
});

console.log(`${passed} innovation checks passed (Stage ${stage}).`);
