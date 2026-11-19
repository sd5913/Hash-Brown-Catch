const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {zh,dictionary}=require('./i18n.js');
const A=require('./arcade.js'),E=require('./economy.js'),R=require('./game-core.js');
let count=0;
function check(name,fn){fn();count++;console.log('PASS '+name);}
const noEnglish=s=>assert.equal(/[A-Za-z]{2,}/.test(zh(s)),false,JSON.stringify(s)+' -> '+zh(s));
check('all authored static screen text and accessibility labels have Chinese coverage',()=>{
 let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<!--[\s\S]*?-->/g,'');
 const decode=s=>s.replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
 for(const token of html.split(/<[^>]*>/)){const s=decode(token).trim();if(!s||/^(中文|VISUAL DIRECTION:)/.test(s))continue;noEnglish(s);}
 for(const m of html.matchAll(/(?:aria-label|title|placeholder|alt)="([^"]+)"/g))noEnglish(decode(m[1]));
});
check('all restaurant, gear, cosmetic and difficulty data are translated',()=>{
 for(const c of E.CATALOG)for(const k of ['name','description'])noEnglish(c[k]);
 for(const s of A.CAREER_STAGES)for(const k of ['name','enName','title','badge','pitch'])noEnglish(s[k]);
 for(const track of Object.values(A.UPGRADE_TRACKS)){noEnglish(track.title);noEnglish(track.subtitle);for(const tier of track.tiers){noEnglish(tier.name);noEnglish(tier.desc);}}
 for(const p of Object.values(R.PRESETS))noEnglish(p.description);
 for(const p of Object.values(R.PLAY_MODES)){noEnglish(p.label);noEnglish(p.description);}
});
check('dynamic shop, wallet, upgrade, promotion and Fever messages stay Chinese',()=>{
 for(const s of [
 'Current kitchen: Wallace. Gear: Paper Fry Box + Rookie Bot. Earn 3 coins per catch.',
 '✓ Strawberry Social unlocked and equipped! (Live behind this window!)',
 '✓ Midnight Munchies applied to your diner! (Live behind this window!)',
 'WALLET 123 COINS','+64 COINS BANKED','SAVE 222 MORE','NEED 12 MORE (◈ 45)',
 'Next (Rookie Bot): Spawns a 2nd AI robo-spatula (88px) that catches gold & dodges bombs!',
 '★ PROMOTED TO Burger King!','ONLY 25 PTS AWAY FROM PROMOTION!',
 '+60 Promotion Bonus banked & new restaurant backdrop unlocked! Next goal: 260 pts!',
 'All 6 kitchens conquered! +260 Clear Bonus banked! Keep upgrading to set a legendary record!',
 '✓ Upgraded to Pro Wire Basket! Hit START below to test your new gear!',
 'ALARM FEVER! 5s GOLDEN RUSH!','★ TARGET HIT! McD CLEARED! ★',
 '♛ SAVED! RANK #2 ON HALL OF FAME (PLAYER 1)','12 alternating relay passes! Teamwork makes the hash brown gleam.',
 'Preset "Classic Crispy" selected. Click SAVE PIXEL POTATO to wear it!',
 '✦ Pixelated "头像" into a 24×24 Crispy Gold potato head! Click SAVE to apply.',
 'STAGE 02 · Wallace · Paper Fry Box','Wallace · 160/160 PTS TO PROMOTE',
 'P1 [A/D]  ·  P2 [←/→ OR MOUSE]  ·  [ESC] EXIT'
 ])noEnglish(s);
});
check('translation matches whole words and Chinese punctuation does not corrupt decimals',()=>{
 assert.equal(zh('automation photo custom'),'automation photo custom');
 assert.equal(zh('FEVER 5s'),'狂热5秒');
 assert.ok(zh('Current: Mini Spatula').includes('：'));
 assert.ok(zh('6.5s Alarm Clock Fever').includes('6.5'));
 assert.equal(dictionary['CRUNCH CLUB'],'薯饼俱乐部');
});
check('all referenced local assets and bilingual runtime files exist',()=>{
 for(const s of A.CAREER_STAGES)assert.ok(fs.existsSync(path.join(__dirname,s.asset)));
 for(const item of E.CATALOG)if(item.asset)assert.ok(fs.existsSync(path.join(__dirname,item.asset)));
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 assert.ok(html.indexOf('i18n.js')<html.indexOf('game.js'));
 assert.ok(html.includes('language-toggle'));
 assert.ok(!html.includes('2026-12-03'));
});
check('live language changes restore English and preserve canvas drawing state',()=>{
 const vm=require('node:vm');
 const text={nodeType:3,nodeValue:'SHIFT SCORE',parentElement:{closest:()=>null}};
 const values={'aria-label':'Pause game'};
 const el={nodeType:1,closest:()=>null,getAttribute:k=>values[k],hasAttribute:k=>k in values,setAttribute:(k,v)=>{values[k]=v;}};
 const document={nodeType:9,documentElement:{lang:'en',classList:{add(){},remove(){}}},querySelectorAll:()=>[],addEventListener(){},createTreeWalker(){let i=0,nodes=[text,el];return {currentNode:null,nextNode(){this.currentNode=nodes[i++];return !!this.currentNode;}};}};
 class Canvas {constructor(){this.font='bold 20px Pixel';}fillText(value){this.drawn=value;this.drawnFont=this.font;}strokeText(value){this.drawn=value;}}
 const storage=new Map();
 const window={document,CanvasRenderingContext2D:Canvas,dispatchEvent(){}};
 const context={window,document,NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},URL,URLSearchParams,location:{search:'?lang=en',href:'https://example.test/game/'},history:{replaceState(){}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'i18n.js'),'utf8'),context);
 const service=window.CrunchI18n;
 service.setLanguage('zh');assert.equal(text.nodeValue,'本班得分');assert.equal(values['aria-label'],'暂停游戏');
 const canvas=new Canvas();canvas.fillText('SERVED 003');assert.equal(canvas.drawn,'已出餐 003');assert.equal(canvas.font,'bold 20px Pixel');assert.match(canvas.drawnFont,/PingFang/);
 text.nodeValue='WALLET 24 COINS';service.setLanguage('zh');assert.equal(text.nodeValue,'钱包 24 金币');
 service.setLanguage('en');assert.equal(text.nodeValue,'WALLET 24 COINS');assert.equal(values['aria-label'],'Pause game');
 canvas.fillText('SERVED 003');assert.equal(canvas.drawn,'SERVED 003');assert.equal(storage.get('crunch-language'),'en');
});
console.log(count+' localization checks passed. These are source/logic checks, not visual browser QA.');
