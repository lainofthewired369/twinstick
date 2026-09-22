(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const C=$('#game'), X=C.getContext('2d'), W=1280,H=720,keys={},mouse={x:640,y:360,down:false,active:false};
let running=false,paused=false,last=0,mode='solo',wave=0,score=0,enemies=[],shots=[],particles=[],players=[],spawnLeft=0,spawnTimer=0,between=false;
let peer=null,conn=null,isHost=false,localId=0,netTick=0,session=0,netTimer,lastPacket=0,peerScript=null;
let choices=[],overlay='menu',lastUI='',dashPending=false,dash2=false,dashSeq=0;
const MAX_PLAYERS=8,links=new Map();
const shipColors=['#68f7c2','#54bfff','#ffc55c','#e9b7ff','#ff8b66','#ff6bdd','#e8faff','#ff597e'];
const shipNames=['Green','Blue','Gold','Violet','Orange','Pink','Silver','Red'];
let roomOpen=false,roomStarted=false,roster=[],lobbyTick=0;
const seats=new Map();
let roomKey='',roomToken='',hostId=0,hostPeerId='',epoch=0,checkpoint=null,migrating=false,recoveryTimer=null,beacon=null,checkpointTick=0,joinTargets=[],migrationQueue=[],recovering=false,triedPeers=new Set();

const activePlayers=()=>players.filter(p=>p.connected!==false);
const shipName=id=>'P'+(id+1)+' '+shipNames[id];
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
let enemyScale={power:0,health:1,damage:1,attack:1};
let worldSeed=1,fieldCamera={x:640,y:360};
let visualTier=0,fractureLeft=0,riftBroken=false,fractureTarget=0;
function breakRift(){
 const target=wave===5?1:wave===7?1.5:wave===10?2:wave===15?3:0;
 if(!target||target<=fractureTarget)return;
 fractureTarget=target;riftBroken=true;fractureLeft=3;paused=false;shots=[];enemyShots=[];enemies=enemies.filter(e=>e.hp>0);resetInput();sendState();
}
const Sphere=window.RRSphere;
const netVisual=window.RRNetworkVisuals?.create(Sphere);
let projectileSerial=0,clientInput=blankInput(),savedRoomData="";
function blankInput(){return {dx:0,dy:0,angle:0,fire:false,dash:false};}
const onSphere=()=>visualTier===3;
const openField=()=>visualTier===1.5||visualTier===2;
const boundedArena=()=>!onSphere()&&!openField();
function switchVisualTier(target){
 if(target===3&&visualTier!==3&&(mode!=='online'||isHost)){
  const origin={...cameraFocus()};
  for(const p of players){const q=Sphere.step({x:640,y:360,angle:p.angle},p.x-origin.x,p.y-origin.y);p.x=q.x;p.y=q.y;p.angle=q.angle;p.cameraAngle=0;}
 }
 visualTier=target;
}
function screenTarget(x,y){const focus=cameraFocus();return openField()?{x:x+focus.x-W/2,y:y+focus.y-H/2}:{x,y};}
function fieldSpawn(){const live=activePlayers().filter(p=>p.hp>0),p=live[Math.floor(Math.random()*live.length)]||{x:640,y:360};return offset(p,Math.random()*Math.PI*2,760);}
function screenEntity(p,focus){const q={...p,x:p.x-focus.x+W/2,y:p.y-focus.y+H/2};if(Number.isFinite(p.bx)){q.bx=p.bx-focus.x+W/2;q.by=p.by-focus.y+H/2;}return q;}
function delta(a,b){return onSphere()?Sphere.delta(a,b):{x:b.x-a.x,y:b.y-a.y,distance:Math.hypot(b.x-a.x,b.y-a.y)};}
function distance(a,b){return delta(a,b).distance;}
function aimAt(a,b){const d=delta(a,b);return Math.atan2(d.y,d.x);}
function offset(p,a,d){return onSphere()?Sphere.step({...p,angle:a},Math.cos(a)*d,Math.sin(a)*d):{x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,angle:a};}
function travel(p,vx,vy,dt,projectile=false){if(onSphere()){const enemyAim=Number.isFinite(p.aim)&&!Number.isFinite(p.angle),n=Sphere.step(enemyAim?{...p,angle:p.aim}:p,vx,vy,dt);if(p.id!==undefined&&p.weapons){p.cameraAngle=Sphere.step({...p,angle:p.cameraAngle||0},vx,vy,dt).angle;}p.x=n.x;p.y=n.y;if(projectile){p.vx=n.vx;p.vy=n.vy;}else if(Number.isFinite(n.angle)){if(enemyAim)p.aim=n.angle;else p.angle=n.angle;}}else{p.x+=vx*dt;p.y+=vy*dt;}}
function cameraFocus(){return players[localId]?.hp>0?players[localId]:activePlayers().find(p=>p.hp>0)||players[localId]||{x:640,y:360};}
function controlAngle(p){if(!onSphere())return 0;if(mode==='local'&&p.id!==localId){const focus=cameraFocus(),d=Sphere.delta(focus,p);return Sphere.step({...focus,angle:focus.cameraAngle||0},d.x,d.y,1).angle||0;}return p.cameraAngle||0;}
let treePreview=null;
let inputDevice='';
function inputMode(device){if(inputDevice===device)return;inputDevice=device;document.documentElement?.setAttribute('data-input',device);const hint=$('#inputHint');if(hint)hint.textContent=device==='gamepad'?'CONTROLLER · Left stick move · Right stick aim/fire · RT fire · A / LB ram · Start pause · D-pad + A menus':device==='touch'?'TOUCH · Left thumb move · Right thumb aim/fire · RAM forward · 30s cooldown':'KEYBOARD · WASD move · Mouse aim/fire · Space / Shift ram · Esc pause';}
function padNavigate(action){
 if(action==='confirm'&&players[localId]?.downed){requestRespawn();return;}
 if(action==='back'){const back=$('#'+overlay+' .back')||$('#'+overlay+' [data-action="skill-close"]');back?.click();return;}
 const buttons=[...document.querySelectorAll('button,input')].filter(b=>!b.disabled&&!b.hidden&&b.getClientRects().length);
 if(!buttons.length)return;let current=buttons.indexOf(document.activeElement);
 if(action==='confirm'){(buttons[current]||buttons[0]).click();return;}
 current=(current+(action==='left'||action==='up'?-1:1)+buttons.length)%buttons.length;buttons[current].focus();buttons[current].scrollIntoView({block:'nearest',inline:'nearest'});
}
function pollPads(){window.RRPad?.frame({playing:running&&!players[localId]?.downed&&!paused&&!between&&fractureLeft<=0&&!migrating&&overlay==='none',local:mode==='local',onPause:()=>$('#pauseBtn').onclick(),onNavigate:padNavigate,onActive:()=>inputMode('gamepad')},performance.now());}

function openTree(preview=false){treePreview=preview?player(0,shipColors[0],0):null;show('skills');window.RRSkillUI?.open(treePreview||players[mode==='local'?shopPlayer:localId],id=>shopAction('skill',null,id));}
const blank=()=>({dx:0,dy:0,angle:0,fire:false,dash:0});
let damageNumbers=[],damageSerial=0;
let enemySerial=0,effects=[],armoryPlayer=0,enemyShots=[],bossSpawned=false,shopTab='offers';
const weapons={
 pistol:{name:'Pistol',desc:'Reliable single shots',rate:.24,damage:26,speed:700,life:1.1,color:'#68f7c2'},
 shotgun:{name:'Shotgun',desc:'Six pellets in a wide cone',rate:.85,damage:13,speed:560,life:.55,pellets:6,spread:.65,color:'#ffc55c'},
 smg:{name:'SMG',desc:'Rapid fire with light spread',rate:.10,damage:9,speed:720,life:.9,spread:.16,color:'#54bfff'},
 minigun:{name:'Minigun',desc:'Spins up while firing',rate:.18,damage:8,speed:800,life:.9,spread:.22,color:'#ffe78a'},
 sniper:{name:'Sniper',desc:'High damage; pierces four targets',rate:1.1,damage:100,speed:1500,life:1,pierce:4,color:'#e9b7ff'},
 rocket:{name:'Rocket launcher',desc:'Explodes in a 100-unit radius',rate:1.4,damage:70,speed:370,life:1.8,blast:100,color:'#ff8b66'},
 flame:{name:'Flamethrower',desc:'Short range; burns for two seconds',rate:.09,damage:4,speed:340,life:.42,spread:.5,burn:true,color:'#ffad48'},
 laser:{name:'Laser',desc:'Instant beam through every target',rate:.8,damage:38,reach:680,color:'#ff6bdd'},
 knife:{name:'Knife',desc:'Broad close-range slash',rate:.4,damage:45,reach:85,arc:1.8,color:'#e8faff'},
 spear:{name:'Spear',desc:'Long narrow piercing thrust',rate:.7,damage:65,reach:170,arc:.34,color:'#92dfff'}
};
const P=window.RRProgress,configs=[{character:'ranger',starter:'pistol'},{character:'ranger',starter:'pistol'}];
let drops=[],shopPlayer=0,profile={best:0,characters:{}},saveWarning='',lastSaved='';
try{const saved=JSON.parse(localStorage.getItem('rift-profile-v1')||'{}');if(Number.isFinite(saved.best))profile.best=Math.max(0,saved.best);if(saved.characters&&typeof saved.characters==='object')profile.characters=saved.characters;}catch(e){saveWarning='Progress saving is unavailable in this browser.';}
function recordProgress(){
 const ids=mode==='local'?[0,1]:[localId];
 for(const id of ids){const p=players[id];if(!p)continue;const completed=between?wave:Math.max(0,wave-1);profile.best=Math.max(profile.best,completed);const previous=profile.characters[p.character]||{};profile.characters[p.character]={best:Math.max(previous.best||0,completed),level:Math.max(previous.level||1,p.level)};}
 const serialized=JSON.stringify(profile);if(serialized===lastSaved)return;
 try{localStorage.setItem('rift-profile-v1',serialized);lastSaved=serialized;}catch(e){saveWarning='Progress saving is unavailable in this browser.';}
}
function armory(){
 $('#armoryTitle').textContent=armoryPlayer?'Local player 2':'Your character';
 $('#slots').replaceChildren();$('#weaponCards').replaceChildren();
 $('#profileInfo').textContent='Best cleared wave: '+profile.best+' · Character unlocks are saved on this device. '+saveWarning;
 for(const [id,c] of Object.entries(P.characters)){const locked=profile.best<c.unlock,b=document.createElement('button'),best=profile.characters[id];b.innerHTML='<b>'+c.name+(locked?' · Clear wave '+c.unlock:'')+'</b><span>'+c.desc+'</span><small>Best wave '+(best?.best||0)+' · Best level '+(best?.level||1)+'</small>';b.disabled=locked;b.className=configs[armoryPlayer].character===id?'selected':'';b.onclick=()=>{configs[armoryPlayer].character=id;armory();};$('#slots').append(b);}
 for(const id of P.starters){const w=weapons[id],b=document.createElement('button');b.innerHTML='<b>'+w.name+'</b><span>'+w.desc+'</span>';b.className=configs[armoryPlayer].starter===id?'selected':'';b.onclick=()=>{configs[armoryPlayer].starter=id;armory();};$('#weaponCards').append(b);}
}
function collect(d){for(const p of activePlayers()){if(d.kind==='crate')P.loot(p,d.weapon);else P.grant(p,d.value,d.value);}burst(d.x,d.y,d.kind==='crate'?'#ffc55c':'#68f7c2',5);}
function openShop(){for(const d of drops)collect(d);drops=[];shots=[];enemyShots=[];between=true;paused=false;shopPlayer=0;shopTab='offers';for(const p of activePlayers()){P.open(p,wave,Object.keys(weapons));p.shopWave=wave;if(p.hp<=0)p.ready=true;}recordProgress();resetInput();lastUI='';sendState();}
function shopAction(action,uid,stat){
 const id=mode==='local'?shopPlayer:localId,p=players[id];if(!p)return;
 const m={t:'shop',action,uid,stat,wave,revision:p.revision};
 if(mode==='online'&&!isHost)send(m);else applyShop(id,m);
}
function applyShop(id,m){if(!running||!between||fractureLeft>0||migrating||!players[id]||players[id].hp<=0||players[id].connected===false||!P.action(players[id],m,wave,Object.keys(weapons)))return;lastUI='';if(activePlayers().every(p=>p.ready)){nextWave();paused=false;resetInput();show('none');}sendState();}
function button(parent,label,fn,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=fn;parent.append(b);return b;}
function renderShop(){
 const p=players[mode==='local'?shopPlayer:localId];if(!p)return;
 $('#shopTitle').textContent=P.characters[p.character].name+' · '+shipName(p.id)+' ship';
 $('#shopStats').textContent=p.materials+' materials · Level '+p.level+' · XP '+p.xp+'/'+P.threshold(p)+' · HP '+Math.ceil(p.hp)+'/'+p.maxHp+' · LIVES '+(p.lives??10)+(p.downed?' · DOWN · REVIVE '+(10-(p.reviveProgress||0)).toFixed(1)+'s':p.hp<=0?' · ELIMINATED':'')+' · Damage '+Math.round(p.damage/22*100)+'% · Armor '+p.armor+' · Regen '+p.regen.toFixed(1)+'/s · Luck '+p.luck+' · Harvest '+p.harvest+' · Crit '+Math.round(p.crit*100)+'%';
 $('#shopHint').textContent=p.hp<=0?(p.downed?'Downed · automatically ready. Teammates can finish reviving you next wave.':'Eliminated · watching the team.') :p.ready?'Ready. Waiting for the rest of the team.':p.pending?'Choose '+p.pending+' level upgrade(s), then shop and mark Ready.':'Buy equipment, combine matching tiers, then mark Ready.';
 $('#shop').classList.toggle('level-pending',p.pending>0);$('#levelChoices').replaceChildren();for(const stat of p.levelChoices)button($('#levelChoices'),P.stats[stat].name+' — '+P.stats[stat].desc,()=>shopAction('level',null,stat),p.ready);
 $('#offers').replaceChildren();
 for(const o of p.shop){const card=document.createElement('article');card.className='shop-card';$('#offers').append(card);if(!o){card.textContent='SOLD';continue;}const t=P.tiers[o.tier];card.style.borderColor=t.color;const label=o.kind==='weapon'?weapons[o.id]:(P.items[o.id]||P.stats[o.id]);const text=document.createElement('p');text.textContent=(label.icon?label.icon+' ':'')+t.name+' '+label.name+' · '+(o.kind==='weapon'?Math.round(t.power*100)+'% base damage':label.desc+' ×'+o.tier);card.append(text);const full=o.kind==='weapon'&&p.weapons.length>=6,merge=full&&p.weapons.some(w=>w.id===o.id&&w.tier===o.tier&&w.tier<4);button(card,(full&&!merge?'FULL · ':merge?'BUY + COMBINE · ':'BUY · ')+o.cost,()=>shopAction('buy',o.uid),p.ready||p.materials<o.cost||(full&&!merge));button(card,o.locked?'UNLOCK':'LOCK',()=>shopAction('lock',o.uid),p.ready);}
 $('#inventory').replaceChildren();for(const w of p.weapons){const row=document.createElement('article');row.className='shop-card';row.style.borderColor=P.tiers[w.tier].color;const text=document.createElement('p');text.textContent=P.tiers[w.tier].name+' '+weapons[w.id].name+' · '+Math.round(P.tiers[w.tier].power*100)+'% damage';row.append(text);button(row,'COMBINE → '+(P.tiers[w.tier+1]?.name||'MAX'),()=>shopAction('combine',w.uid),p.ready||!P.partner(p,w));button(row,'SELL · '+P.sellValue(w,wave),()=>shopAction('sell',w.uid),p.ready||p.weapons.length<=1);$('#inventory').append(row);}
 $('#itemList').replaceChildren();if(!p.items.length)$('#itemList').textContent='No augments yet. Buy one in the market.';
 for(const i of p.items){const def=P.items[i.id]||P.stats[i.id],card=document.createElement('article');card.className='shop-card';card.style.borderColor=P.tiers[i.tier].color;card.textContent=(def.icon||'◆')+' '+P.tiers[i.tier].name+' '+def.name+' — '+def.desc+' ×'+i.tier;$('#itemList').append(card);}
 $('#shopWallet').textContent=p.materials+' ◇';
 for(const tab of ['offers','inventory','items','stats']){$('#pane-'+tab).classList.toggle('hidden',shopTab!==tab);$('#tab-'+tab).classList.toggle('selected',shopTab===tab);}

 $('#reroll').textContent='REROLL · '+P.rerollCost(p,wave);$('#reroll').disabled=p.ready||p.materials<P.rerollCost(p,wave)||p.shop.every(o=>o?.locked);
 $('#readyShop').textContent=p.hp<=0?'AUTO READY':p.ready?'CANCEL READY':'READY · NEXT WAVE';$('#readyShop').disabled=p.hp<=0||!!p.pending;
 $('#switchShop').classList.toggle('hidden',mode!=='local');
 $('#teamReady').textContent=activePlayers().filter(p=>p.ready).length+'/'+activePlayers().length+' ready · '+activePlayers().filter(p=>!p.ready).map(p=>'P'+(p.id+1)).join(', ');
}
const RAM_COOLDOWN=30,RAM_TIME=.45,RAM_IFRAMES=.15,RAM_SPEED=900;
function turnAim(current,target,dt){const d=Math.atan2(Math.sin(target-current),Math.cos(target-current));return current+Math.max(-3*dt,Math.min(3*dt,d));}
function frontGuard(p,source){if(!(p.ramLeft>0)||!source)return 1;const a=aimAt(p,source)-(p.ramAngle||0);return Math.cos(a)>.5?.3:1;}
function startRam(p,angle){
 if(p.hp<=0||(p.dash||0)>0||p.ramLeft>0)return false;
 p.dashTime=RAM_COOLDOWN;p.dash=RAM_COOLDOWN;p.ramLeft=RAM_TIME;p.ramAngle=angle;p.ramHits=[];
 if(p.type==='boss'){p.evade=RAM_IFRAMES;if(p.abilities?.nova)p.novaWarning=.65;}
 else if(p.abilities?.nova){effect({kind:'blast',x:p.x,y:p.y,r:110,color:p.color});for(const e of enemies)if(distance(p,e)<110+e.r)hurt(e,p.damage*2,p.id);}
 return true;
}
function tickRam(p,dt){
 if(!(p.ramLeft>0))return false;
 const ramSpeed=RAM_SPEED*(p.type==='boss'?.65:1),step=Math.min(dt,p.ramLeft),from={x:p.x,y:p.y},a=p.ramAngle;
 const next=onSphere()?Sphere.step({...p,angle:a},Math.cos(a)*ramSpeed,Math.sin(a)*ramSpeed,step):null;
 travel(p,Math.cos(a)*ramSpeed,Math.sin(a)*ramSpeed,step);if(next)p.ramAngle=next.angle;
 if(boundedArena()){p.x=Math.max(18,Math.min(W-18,p.x));p.y=Math.max(18,Math.min(H-18,p.y));}
 const targets=p.type==='boss'?activePlayers():enemies;
 for(const t of targets){if(t.hp<=0||p.ramHits.includes(t.id)||distanceToSegment(t.x,t.y,from.x,from.y,p.x,p.y)>(t.r||15)+20)continue;
  p.ramHits.push(t.id);if(p.type==='boss')mirrorHit(p.mirror?p:null,t,(p.damage||22)*3,{source:p});else hurt(t,p.damage*3,p.id,false,p);
 }
 p.ramLeft=Math.max(0,p.ramLeft-step);return true;
}
function bossRam(e,target,dt){
 e.dash=Math.max(0,(e.dash||0)-dt);e.evade=Math.max(0,(e.evade||0)-dt);
 if(e.ramWarning>0){e.ramWarning=Math.max(0,e.ramWarning-dt);if(!e.ramWarning)startRam(e,e.aim);}
 else if(target&&!e.ramLeft&&!e.dash&&(e.brain?.clock??4)>2&&distance(e,target)>100&&distance(e,target)<420)e.ramWarning=.65;
 return tickRam(e,dt);
}
function hurt(e,damage,owner,chained=false,source=null){if(e.hp<=0||e.evade>0)return;damage*=frontGuard(e,source||players[owner]);if(e.mirror){e.shieldDelay=4;const absorbed=Math.min(e.shield||0,damage);e.shield-=absorbed;damageNumber(e,absorbed,'shield','enemy',owner);damage=(damage-absorbed)/(1+(e.armor||0)*.08);}const p=players[owner],actual=Math.min(e.hp,damage);damageNumber(e,actual,'hit','enemy',owner);if(p&&p.hp>0){p.hp=Math.min(p.maxHp,p.hp+actual*p.leech*healingEfficiency());if(p.slow){e.slow=p.slow;e.slowTime=1;}}e.hp-=damage;e.hit=.1;if(p?.abilities?.chain&&!chained&&(p.abilityTimers.chain||0)<=0){p.abilityTimers.chain=.45;let from=e;const visited=new Set([e.id]);for(let n=0;n<2;n++){const target=enemies.filter(t=>t.hp>0&&!visited.has(t.id)&&distance(from,t)<170).sort((a,b)=>distance(from,a)-distance(from,b))[0];if(!target)break;visited.add(target.id);effect({kind:'beam',x:from.x,y:from.y,bx:target.x,by:target.y,color:'#83dfff'});hurt(target,damage*.35,owner,true);from=target;}}if(e.hp<=0){if(e.type==='boss')breakRift();if(p&&p.hp>0)p.hp=Math.min(p.maxHp,p.hp+p.killHeal*healingEfficiency());if(e.type==='splitter'&&enemies.length<140)for(let n=0;n<3;n++)spawnVariant('swarm',e.x+Math.cos(n*2.1)*22,e.y+Math.sin(n*2.1)*22);score+=e.type==='boss'?500:e.type==='tank'?50:20;drops.push({x:boundedArena()?Math.max(20,Math.min(W-20,e.x)):e.x,y:boundedArena()?Math.max(20,Math.min(H-20,e.y)):e.y,kind:'material',value:e.type==='boss'?35:e.type==='tank'?6:3});if(e.type==='boss'||(e.type==='tank'&&Math.random()<.15))drops.push({x:e.x,y:e.y,kind:'crate',weapon:Object.keys(weapons)[Math.floor(Math.random()*10)]});burst(e.x,e.y,e.type==='tank'?'#ffc55c':'#ff496c',14);}}
function distanceToSegment(x,y,ax,ay,bx,by){if(onSphere()){const origin={x:ax,y:ay},p=delta(origin,{x,y}),end=delta(origin,{x:bx,y:by}),u=Math.max(0,Math.min(1,(p.x*end.x+p.y*end.y)/(end.x**2+end.y**2||1)));return Math.hypot(p.x-end.x*u,p.y-end.y*u);}const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-ax-t*dx,y-ay-t*dy);}
// Group rapid damage ticks by target and type; bounded for mobile and network use.
function damageNumber(target,amount,kind,team,owner=null){
 if(!Number.isFinite(amount)||amount<=0)return;
 const key=team+':'+target.id+':'+kind+(Number.isInteger(owner)?':p'+owner:'');
 const recent=damageNumbers.find(n=>n.key===key&&n.life>.8);
 if(recent){recent.amount+=amount;return;}
 damageNumbers.push({id:++damageSerial,key,x:target.x,y:target.y,amount,kind,owner,life:.95});
 if(damageNumbers.length>64)damageNumbers.shift();
}
const seenDamage=new Set();
function mergeDamageNumbers(incoming){
 for(const n of incoming||[]){const existing=damageNumbers.find(x=>x.id===n.id);if(existing){existing.amount=n.amount;continue;}if(seenDamage.has(n.id))continue;seenDamage.add(n.id);damageNumbers.push({...n,life:Math.max(.45,n.life||.95)});}
 damageNumbers=damageNumbers.slice(-64);while(seenDamage.size>512)seenDamage.delete(seenDamage.values().next().value);
}
function tickDamageNumbers(dt){damageNumbers.forEach(n=>n.life-=dt);damageNumbers=damageNumbers.filter(n=>n.life>0);}
function damageLabel(n){const value=n.amount>=1e6?(n.amount/1e6).toFixed(1)+'M':n.amount>=1e3?(n.amount/1e3).toFixed(1)+'K':n.amount<1?Math.max(.1,n.amount).toFixed(1):String(Math.round(n.amount));return (n.kind==='shield'?'SH ':n.kind==='hurt'?'−':'')+value;}
function drawDamageNumbers(){
 X.save();X.textAlign='center';X.textBaseline='middle';X.font='bold 24px system-ui';X.lineWidth=4;X.strokeStyle='#070c16';X.lineJoin='round';
 for(const n of damageNumbers){
  const point=onSphere()?Sphere.project(n,cameraFocus(),25):{x:n.x+(visualTier>=2?9:0),y:n.y-(visualTier>=2?13:0)};
  if(point.visible===false)continue;
  const credited=Number.isInteger(n.owner),age=.95-n.life,x=point.x+(credited?(n.owner<4?-35:65):-7)+(n.kind==='shield'?25:0),y=point.y-30-(credited?n.owner%4*24:0)-(n.kind==='shield'?16:0)-(reducedMotion?.matches?0:age*32);
  X.globalAlpha=Math.min(1,n.life/.25);X.fillStyle=n.kind==='shield'?'#73d9ff':n.kind==='hurt'?'#ff7185':'#fff4be';
  const label=damageLabel(n);
  if(Number.isInteger(n.owner))X.fillStyle=shipColors[n.owner]||'#fff4be';X.strokeText(label,x,y);X.fillText(label,x,y);
 }
 X.restore();
}
function effect(f){effects.push({...f,life:.18});if(effects.length>100)effects.shift();}
function explode(s){effect({kind:'blast',x:s.x,y:s.y,r:s.blast,color:s.color});for(const e of enemies)if(distance(s,e)<s.blast+e.r)hurt(e,s.dmg,s.owner,false,s);s.life=0;}

const touch={move:{id:null,x:0,y:0},aim:{id:null,x:0,y:0}};
function player(x,color,id){
 const config=mode==='online'?seats.get(id)?.config||configs[0]:configs[id]||configs[0];
 return P.init({x,y:360,angle:0,hp:100,maxHp:100,lives:10,downed:false,reviveProgress:0,color,id,connected:true,speed:250,damage:22,rate:.18,cool:0,dash:0,dashTime:30,multi:1},config);
}
function show(id){overlay=id;['menu','lobby','upgrade','gameover','armory','shop','skills'].forEach(n=>$('#'+n).classList.toggle('hidden',n!==id));}
function resetInput(){
 Object.keys(keys).forEach(k=>delete keys[k]);for(const link of links.values())link.input={...blank(),dash:link.dash};mouse.down=false;dashPending=false;dash2=false;
 for(const [name,s] of Object.entries(touch)){const el=$('#'+(name==='move'?'moveStick':'aimStick'));if(s.id!==null&&el.hasPointerCapture(s.id))el.releasePointerCapture(s.id);s.id=null;s.x=s.y=0;el.querySelector('i').style.transform='';}
}
function start(m){
 migrating=false;recovering=false;clearTimeout(recoveryTimer);recoveryStatus('');netVisual?.reset();seenDamage.clear();
 resetInput();worldSeed=(Math.random()*2147483647)|0;visualTier=0;fractureLeft=0;riftBroken=false;fractureTarget=0;mode=m;wave=0;score=0;enemies=[];shots=[];particles=[];effects=[];damageNumbers=[];damageSerial=0;enemySerial=0;choices=[];drops=[];
 if(m!=='online')localId=0;
 if(m==='online'){
  for(const [id,seat] of seats)if(seat.connected===false)seats.delete(id);
  roomStarted=true;const ids=[localId,...[...links].filter(([,l])=>l.ready).map(([id])=>id)].sort((a,b)=>a-b),count=ids.length;
  players=Array.from({length:Math.max(...ids)+1},(_,id)=>{
   const p=player(640,shipColors[id],id),index=ids.indexOf(id);
   if(index<0){p.connected=false;p.hp=0;p.ready=true;}
   else {const angle=index*Math.PI*2/count;p.x=640+Math.cos(angle)*170;p.y=360+Math.sin(angle)*125;}
   return p;
  });
 }else{players=[player(448,shipColors[0],0)];if(m==='local')players.push(player(832,shipColors[1],1));}
 running=true;paused=false;between=false;lastUI='';nextWave();show('none');sendState();
}
function nextWave(){wave++;enemyScale=difficultyScale();spawnLeft=Math.min(160,Math.ceil((5+wave*3)*(1+Math.max(0,activePlayers().length-2)*.35)));spawnTimer=.6;between=false;choices=[];bossSpawned=false;enemyShots=[];}
function teamPower(){
 const values=activePlayers().map(p=>{
  const abilityPower=1+Object.values(p.abilities||{}).filter(Boolean).length*.18;
  const dps=abilityPower*p.weapons.reduce((sum,s)=>{const w=weapons[s.id];return sum+w.damage*(w.pellets||1)/w.rate*P.tiers[s.tier].power;},0)*(p.damage/22)*(.18/p.rate)*(1+p.crit)*Math.min(2,1+(p.multi-1)*.25);
  const defense=(p.maxHp+p.maxShield)*(1+p.armor*.08)+p.regen*15+p.leech*150;
  return .8*dps/(180+wave*65)+.2*defense/(110+wave*12);
 });
 return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
}
function difficultyScale(power=teamPower()){
 // Double the shared health multiplier for every two excess power units.
 // Snapshot at wave start; temporary HP loss cannot lower difficulty.
 power=Number.isFinite(power)?Math.max(0,power):0;
 const health=2**Math.min(2,Math.max(0,power-1)*.5);
 return {power,health,damage:health**.25,attack:health**.15};
}
function bossPower(){
 const pressure=teamPower();
 return {health:Math.max(1,Math.min(4,.8+pressure*.65)),attack:Math.max(1,Math.min(1.3,.95+pressure*.1)),damage:Math.max(1,Math.min(1.35,.95+pressure*.1))};
}
function spawnBoss(){
 bossSpawned=true;const power=bossPower(),hp=(wave<6?220+wave*100:1000+wave*150)*(1+.8*Math.max(0,activePlayers().length-1))*power.health*enemyScale.health*latePressure();
 enemies.push({id:++enemySerial,type:'boss',rival:wave>=6,brain:wave>=6?{clock:0,scan:0,seen:{},target:null,turn:1,dodge:0}:null,power,reinforce:7,x:W/2,y:90,r:42,hp,maxHp:hp,speed:48+Math.min(30,wave),hit:0,burn:0,burnDamage:0,attack:1.8,windup:0,pattern:0,aim:0});
 const boss=enemies[enemies.length-1];if(openField()){const at=fieldSpawn();boss.x=at.x;boss.y=at.y;}else if(onSphere()){const at=offset(cameraFocus(),0,300);boss.x=at.x;boss.y=at.y;}
 if(wave>=6)buildMirror(boss);else if(wave>=3){boss.hp*=.8;boss.maxHp*=.8;boss.power.damage*=.85;boss.damage=22*.85;}
 boss.speed*=.7;
 burst(boss.x,boss.y,'#ff6bdd',40);
}
// Mirror bosses snapshot a combat build, not wallets, shop state or live inputs.
function combatPower(p,mirror=false){
 const dps=p.weapons.reduce((sum,slot)=>{const w=weapons[slot.id];return sum+w.damage*P.tiers[slot.tier].power*(w.pellets?Math.min(16,w.pellets+p.multi-1):w.reach?1+(p.multi-1)*.15:p.multi)/(mirror?Math.max(w.reach?(w.arc?.67:1.02):.06,w.rate*p.rate/.18):w.rate*p.rate/.18);},0)*p.damage/22*(1+p.crit);
 const ehp=(p.maxHp+p.maxShield)*(1+p.armor*.08)+p.regen*10;
 return {dps,ehp,rating:dps+ehp*.3};
}
function buildMirror(e){
 const team=activePlayers(),source=team.reduce((best,p)=>!best||combatPower(p).rating>combatPower(best).rating?p:best,null);if(!source)return;
 const stats=team.map(p=>combatPower(p)),dps=stats.reduce((n,p)=>n+p.dps,0),ehp=stats.reduce((n,p)=>n+p.ehp,0);
 const advantage=1.35+Math.min(.85,Math.max(0,wave-10)*.025);
 e.mirror=true;e.sourceId=source.id;e.character=source.character;e.color='#ff6bdd';e.r=18;
 for(const key of ['speed','rate','damage','crit','multi','range','blastScale','pierce','armor','regen','leech','slow','berserk','dashTime'])e[key]=source[key];
 e.speed=Math.max(...team.map(p=>p.speed));e.dashTime=RAM_COOLDOWN;e.dash=0;
 e.weapons=source.weapons.map(w=>({...w,cool:.9,spin:0,pending:0}));
 e.abilities=Object.fromEntries(['chain','blades','nova','repair','missiles'].map(k=>[k,team.some(p=>p.abilities?.[k])]));e.abilityTimers={};
 e.shield=source.maxShield;e.maxShield=e.shield;
 e.damage*=dps/Math.max(1,combatPower(source,true).dps)*advantage;
 e.teamDps=dps;e.teamEhp=ehp;e.nominalDps=dps*advantage;e.advantage=advantage;
 e.hp=e.maxHp=Math.max(e.hp,(ehp*advantage+dps*(9+wave*.2))/(1+e.armor*.08));
 // A modest early/mid-run relief; later bosses keep the full scaling curve.
 if(wave>=3&&wave<=15){e.hp*=.8;e.maxHp*=.8;e.shield*=.8;e.maxShield*=.8;e.damage*=.85;e.nominalDps*=.85;e.advantage*=.85;}
 e.healBudget=e.maxHp*.2;e.attack=.9;e.evade=0;e.novaWarning=0;e.orbitTime=0;
 e.preferredRange=Math.min(...e.weapons.map(s=>{const w=weapons[s.id];return w.arc?w.reach*.8:w.burn?110:300;}));
}
function healMirror(e,amount){const heal=Math.min(Math.max(0,amount),e.healBudget,e.maxHp-e.hp);e.hp+=heal;e.healBudget-=heal;}
function mirrorHit(e,p,damage,extra={}){
 if(p.hp<=0||p.invuln>0||p.dash>=p.dashTime-.15)return false;
 const before=p.hp;damagePlayer(p,damage,extra.source||e);p.invuln=.2;
 if(extra.burn){p.enemyBurn=2;p.enemyBurnDamage=damage*.2;}
 if(e){healMirror(e,Math.max(0,before-p.hp)*(e.leech||0));if(e.slow){p.enemySlow=e.slow;p.enemySlowTime=1;}}
 if(e?.abilities.chain&&(e.abilityTimers.chain||0)<=0){e.abilityTimers.chain=.45;const others=activePlayers().filter(q=>q!==p&&q.hp>0&&distance(q,p)<170).slice(0,2);for(const q of others){effect({kind:'beam',x:p.x,y:p.y,bx:q.x,by:q.y,color:e.color});mirrorHit(e,q,damage*.35);}}
 return true;
}
function mirrorProjectile(e,a,w,damage){
 if(enemyShots.length>=220)return;
 const at=offset(e,a,24),speed=Math.min(850,w.speed||370);
 enemyShots.push({x:at.x,y:at.y,vx:Math.cos(at.angle)*speed,vy:Math.sin(at.angle)*speed,r:w.blast?7:w.burn?8:4,life:(w.life||2)*e.range,damage,source:e.id,blast:(w.blast||0)*e.blastScale,burn:!!w.burn,pierce:(w.pierce||1)+e.pierce,hitIds:[],mirror:true});
}
function mirrorFire(e,slot,angle){
 const w=weapons[slot.id],damage=w.damage*e.damage/22*P.tiers[slot.tier].power*(Math.random()<e.crit?2:1)*(e.hp<e.maxHp/2?1+e.berserk:1);
 if(w.reach){
  const reach=w.reach*e.range,end=offset(e,angle,Math.min(onSphere()?Math.PI*Sphere.R*.9:1400,reach));
  effect({kind:w.arc?'arc':'beam',x:e.x,y:e.y,bx:end.x,by:end.y,angle,r:reach,arc:w.arc,color:e.color});
  for(const p of activePlayers()){const d=distance(e,p),a=aimAt(e,p)-angle,hit=w.arc?d<reach+15&&Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<w.arc/2+15/Math.max(15,d):distanceToSegment(p.x,p.y,e.x,e.y,end.x,end.y)<20;if(hit)mirrorHit(e,p,damage*(1+(e.multi-1)*.15));}
 }else{
  const count=Math.min(16,(w.pellets||1)+e.multi-1);
  for(let n=0;n<count;n++)mirrorProjectile(e,angle+(n-(count-1)/2)*(w.pellets?w.spread/Math.max(1,count-1):.1)+(Math.random()-.5)*(w.pellets?0:w.spread||0),w,damage);
 }
}
function mirrorCombat(e,dt){
 e.windup=Math.max(0,...e.weapons.map(s=>s.pending||0));e.abilityTimers.chain=Math.max(0,(e.abilityTimers.chain||0)-dt);e.attack=Math.max(0,e.attack-dt);e.orbitTime+=dt*2.8;
 const target=rivalThink(e,dt);bossRam(e,target,dt);healMirror(e,e.regen*dt);e.shieldDelay=Math.max(0,(e.shieldDelay||0)-dt);if(!e.shieldDelay){const recharge=Math.min(e.healBudget,e.maxShield-e.shield,e.maxShield*.15*dt);e.shield+=recharge;e.healBudget-=recharge;}if(!target||e.attack>0)return;
 e.aim=turnAim(e.aim,aimAt(e,target),dt);
 for(const slot of e.weapons){
  const w=weapons[slot.id];slot.cool=Math.max(0,slot.cool-dt);
  if(slot.pending>0){slot.shotAim=e.aim;slot.pending=Math.max(0,slot.pending-dt);if(slot.pending===0)mirrorFire(e,slot,slot.shotAim);continue;}
  if(slot.cool>0)continue;
  slot.spin=Math.min(1,slot.spin+dt);const rate=w.rate*e.rate/.18/(slot.id==='minigun'?1+slot.spin*2:1);
  if(w.reach){slot.pending=w.arc?.55:.9;slot.shotAim=e.aim;slot.cool=Math.max(rate,slot.pending+.12);}else {mirrorFire(e,slot,e.aim);slot.cool=Math.max(.06,rate);}
 }
 if(e.novaWarning>0){e.novaWarning=Math.max(0,e.novaWarning-dt);if(!e.novaWarning){effect({kind:'blast',x:e.x,y:e.y,r:110,color:e.color});for(const p of activePlayers())if(distance(e,p)<125)mirrorHit(e,p,e.damage*2);}}
 for(const k of ['blades','repair','missiles']){if(!e.abilities[k])continue;e.abilityTimers[k]=Math.max(0,(e.abilityTimers[k]||0)-dt);if(e.abilityTimers[k]>0)continue;
  if(k==='repair'){e.abilityTimers[k]=4;healMirror(e,8);for(const ally of enemies)if(ally!==e&&ally.hp>0&&distance(e,ally)<160&&ally.maxHp)ally.hp=Math.min(ally.maxHp,ally.hp+8);effect({kind:'blast',x:e.x,y:e.y,r:80,color:e.color});}
  if(k==='missiles'){e.abilityTimers[k]=2;mirrorProjectile(e,e.aim,{speed:370,life:2.5,blast:80},32*e.damage/22);}
  if(k==='blades'){e.abilityTimers[k]=.3;for(let n=0;n<2;n++){const at=offset(e,e.orbitTime+n*Math.PI,58);for(const p of activePlayers())if(distance(at,p)<28)mirrorHit(e,p,e.damage*.7);}}
  
 }
}
function hostileShot(e,a,speed,damage){if(enemyShots.length>=220)return;const at=offset(e,a,e.r+8);enemyShots.push({x:at.x,y:at.y,vx:Math.cos(at.angle)*speed,vy:Math.sin(at.angle)*speed,r:e.type==='boss'?7:5,life:4.5,damage:damage*enemyScale.damage*waveDamage()});}
// Bounded online habit learning from visible positions only. Brain and player
// habits are plain snapshot data, so reconnects and host migration preserve them.
function rivalThink(e,dt){
 const b=e.brain;b.clock+=dt;b.scan-=dt;b.dodge=Math.max(0,b.dodge-dt);
 if(b.scan<=0){
  b.scan=.35;if(b.threat&&b.dodge===0){b.turn*=-1;b.dodge=e.mirror?e.dashTime:2.4;}b.threat=shots.some(q=>distance(e,q)<145);const visible=activePlayers().filter(p=>p.hp>0);let best=null,bestScore=-Infinity;
  for(const p of visible){
   const old=b.seen[p.id],now={x:p.x,y:p.y,time:b.clock};
   if(old){
    const elapsed=Math.max(.01,b.clock-old.time),motion=delta(old,p),speed=motion.distance/elapsed;
    const h=p.rivalHabits||(p.rivalHabits={samples:0,speed:0,range:280,orbit:0,dashes:0});
    const radial=delta(e,p),cross=(radial.x*motion.y-radial.y*motion.x)/(Math.max(1,radial.distance*motion.distance));
    h.samples=Math.min(1000,h.samples+1);h.speed+=.12*(Math.min(400,speed)-h.speed);h.range+=.08*(distance(e,p)-h.range);h.orbit+=.12*(cross-h.orbit);
    // A sudden visible displacement is a dash observation, never an input read.
    if(speed>420){h.dashes++;b.dashObserved=b.clock;}
    const isolation=Math.min(350,...visible.filter(q=>q!==p).map(q=>distance(p,q)));
    const score=isolation*.5-distance(e,p)*.2+(b.target?.id===p.id?75:0);
    if(score>bestScore){bestScore=score;best={id:p.id,x:old.x,y:old.y,vx:Math.max(-300,Math.min(300,motion.x/elapsed)),vy:Math.max(-300,Math.min(300,motion.y/elapsed)),habits:{...h}};}
   }
   b.seen[p.id]=now;
  }
  // Decisions use the previous sample: at least 350 ms reaction delay.
  b.target=best;
 }
 const t=b.target;if(!t)return null;
 const h=t.habits,confidence=Math.min(1,h.samples/18),a=aimAt(e,t),d=distance(e,t);
 e.tactic=h.speed<60?'PRESSURE':Math.abs(h.orbit)>.35?'INTERCEPT':h.range<220?'KEEP DISTANCE':'FLANK';
 if(!e.ramLeft&&(e.mirror||(!e.windup&&!e.beamLeft))){
  const preferred=e.mirror?Math.max(65,Math.min(330,e.preferredRange+(h.speed<60?-50:h.range<180?50:0))):h.range<220?330:h.speed<60?170:250;
  const radial=Math.max(-1,Math.min(1,(d-preferred)/100));
  const strafe=(Math.abs(h.orbit)>.25?-Math.sign(h.orbit):b.turn)*(.6+.25*confidence);
  // React to an already-visible bullet, with a cooldown rather than invulnerability.
  const boost=b.dodge>2.15?1.8:1,speed=(e.mirror?e.speed:115+Math.min(45,wave*2))*(e.mirror?1:boost)*(e.slowTime>0?1-e.slow:1);
  const length=Math.max(1,Math.hypot(radial,strafe));let vx=(Math.cos(a)*radial-Math.sin(a)*strafe)*speed/length,vy=(Math.sin(a)*radial+Math.cos(a)*strafe)*speed/length;
  if(boundedArena()){if(e.x<e.r+25&&vx<0||e.x>W-e.r-25&&vx>0)vx=-vx;if(e.y<e.r+25&&vy<0||e.y>H-e.r-25&&vy>0)vy=-vy;}
  travel(e,vx,vy,dt);

  if(boundedArena()){e.x=Math.max(e.r,Math.min(W-e.r,e.x));e.y=Math.max(e.r,Math.min(H-e.r,e.y));}
 }
 // Limited prediction; locked at windup start, never steers a fired attack.
 const lead=Math.min(.6,d/340)*confidence;
 const predicted=offset(t,Math.atan2(t.vy,t.vx),Math.hypot(t.vx,t.vy)*lead);
 return predicted;
}
function bossAttack(e,target,dt){
 if(e.mirror){mirrorCombat(e,dt);return;}
 if(e.rival)target=rivalThink(e,dt);
 if(!target)return;
 e.aim=turnAim(e.aim,aimAt(e,target),dt);bossRam(e,target,dt);
 if(e.beamLeft>0){tickBeam(e,dt);return;}
 e.reinforce-=dt;if(e.reinforce<=0&&enemies.length<65){e.reinforce=e.hp<e.maxHp/2?6:9;for(let n=0;n<2;n++)spawnVariant(n?'gunner':'runner',boundedArena()?Math.max(30,Math.min(W-30,e.x+(n?100:-100))):e.x+(n?100:-100),boundedArena()?Math.max(30,e.y+70):e.y+70);}
 if(e.windup>0){e.windup=Math.max(0,e.windup-dt);if(e.windup>0)return;
  if(e.beamAttack){e.beamLeft=.85;e.beamAttack=false;e.pattern++;e.attack=1.2/attackPressure();return;}
  const phase=e.pattern%3,angry=e.hp<e.maxHp/2,count=phase===1?(angry?20:16):phase===2?9:5,speed=Math.min(430,270+wave*7);
  for(let n=0;n<count;n++){const angle=phase===1?n*Math.PI*2/count+e.aim:phase===2?e.aim+(n-4)*.13:e.aim+(n-2)*.18;hostileShot(e,angle,speed*(phase===2?.8:1),(16+wave*.8)*e.power.damage);}
  if(wave>=15)for(let n=0;n<12;n++)hostileShot(e,n*Math.PI/6+e.aim,190,(12+wave*.5)*e.power.damage);
  e.pattern++;e.attack=(angry?.85:1.4)/(e.power.attack*enemyScale.attack*attackPressure());
 }else{e.attack-=dt;if(e.attack<=0){e.aim=aimAt(e,target);if(e.rival&&e.brain.clock-(e.brain.dashObserved??-99)<.8)e.pattern=0;e.beamAttack=wave>=15&&e.pattern%4===3;e.windup=e.beamAttack?1.2:.8;}}
}
const enemyTypes={
 drone:{color:'#ff597e',r:14,hp:35,speed:96},tank:{color:'#ffcb68',r:22,hp:95,speed:55},
 runner:{color:'#ff865b',r:11,hp:23,speed:174},gunner:{color:'#ac8fff',r:17,hp:52,speed:65},
 charger:{color:'#ff4d4d',r:18,hp:72,speed:78},splitter:{color:'#a9eb67',r:21,hp:100,speed:62},
 lancer:{color:'#ff3be0',r:23,hp:210,speed:45},swarm:{color:'#c8f58a',r:9,hp:16,speed:150},sentinel:{color:'#66cffa',r:23,hp:155,speed:42}
};
function latePressure(){return Math.pow(1.14,Math.min(80,Math.max(0,wave-7)));}
function waveDamage(){return Math.pow(1.085,Math.min(80,Math.max(0,wave-7)));}
function attackPressure(){return Math.min(3.5,Math.pow(1.045,Math.max(0,wave-7)));}
function healingEfficiency(){return Math.max(.3,1/(1+Math.max(0,wave-7)*.065));}
function tickBeam(e,dt){
 e.beamLeft=Math.max(0,(e.beamLeft||0)-dt);
 const length=onSphere()?600:1000;
 for(const p of activePlayers()){const d=delta(e,p),along=d.x*Math.cos(e.aim)+d.y*Math.sin(e.aim),across=Math.abs(d.y*Math.cos(e.aim)-d.x*Math.sin(e.aim));if(p.hp>0&&along>0&&along<length&&across<21&&!p.invuln&&p.dash<p.dashTime-.15)damagePlayer(p,(40+wave*2)*enemyScale.damage*waveDamage()*dt,e);}
}
function spawnVariant(type,x,y){const v=enemyTypes[type];enemies.push({id:++enemySerial,type,x,y,r:v.r,hp:(v.hp+wave*(type==='swarm'?2:7))*enemyScale.health*latePressure(),maxHp:(v.hp+wave*(type==='swarm'?2:7))*enemyScale.health*latePressure(),speed:Math.min(350,v.speed+wave*3),hit:0,burn:0,burnDamage:0,attack:(1+Math.random())/enemyScale.attack,windup:0,aim:0,charge:0,slow:0,slowTime:0});}
function spawn(){const side=Math.floor(Math.random()*4),pool=wave<2?['drone','drone','tank']:wave<4?['drone','tank','runner','gunner']:['drone','tank','runner','gunner','charger','splitter','sentinel'],type=wave>=10&&Math.random()<(wave>=15?.28:.16)?'lancer':pool[Math.floor(Math.random()*pool.length)];if(openField()){const at=fieldSpawn();spawnVariant(type,at.x,at.y);}else if(onSphere()){const at=offset(activePlayers().find(p=>p.hp>0)||{x:640,y:360},Math.random()*Math.PI*2,300);spawnVariant(type,at.x,at.y);}else spawnVariant(type,side%2?Math.random()*W:side?W+30:-30,side%2?(side===1?-30:H+30):Math.random()*H);}
function enemyAttack(e,t,dt){
 if(!t)return;
 e.slowTime=Math.max(0,(e.slowTime||0)-dt);
 if(e.beamLeft>0){tickBeam(e,dt);return;}
 if(!['gunner','charger','sentinel','lancer'].includes(e.type)&&!(wave>=12&&['tank','splitter'].includes(e.type)))return;
 if(e.windup>0){e.windup=Math.max(0,e.windup-dt);if(e.windup<=0){if(e.type==='lancer'){e.beamLeft=.65;e.attack=3/attackPressure();return;}if(e.type==='charger')e.charge=.45;else for(let n=0;n<(e.type==='sentinel'?(wave>=15?5:3):wave>=12?3:1);n++)hostileShot(e,e.aim+((e.type==='sentinel'||wave>=12)?(n-(e.type==='sentinel'&&wave>=15?2:1))*.2:0),220+Math.min(90,wave*4),10+wave*.5);e.attack=(e.type==='charger'?2.3:2.0)/(enemyScale.attack*attackPressure());}}
 else if(e.charge>0){e.charge=Math.max(0,e.charge-dt);travel(e,Math.cos(e.aim)*520,Math.sin(e.aim)*520,dt);if(boundedArena()){e.x=Math.max(18,Math.min(W-18,e.x));e.y=Math.max(18,Math.min(H-18,e.y));}}
 else{e.attack-=dt;if(e.attack<=0){e.aim=aimAt(e,t);e.windup=e.type==='lancer'?1.15:.65;}}
}
function damagePlayer(p,damage,source=null){
 if(p.hp<=0||p.invuln>0||!Number.isFinite(damage)||damage<=0)return;
 damage*=frontGuard(p,source);p.shieldDelay=4;const absorbed=Math.min(p.shield,damage);p.shield-=absorbed;
 const actual=Math.min(p.hp,(damage-absorbed)/(1+p.armor*.08/(1+Math.max(0,wave-7)*.045)));
 p.hp=Math.max(0,p.hp-actual);if(p.hp===0){p.lives=p.lives??10;p.downed=true;p.reviveProgress=0;p.ramLeft=0;p.enemyBurn=0;p.enemySlowTime=0;}damageNumber(p,absorbed,'shield','player');damageNumber(p,actual,'hurt','player');
}
const REVIVE_RADIUS=100,REVIVE_TIME=10;
function restorePlayer(p){p.hp=p.maxHp;p.shield=0;p.downed=false;p.reviveProgress=0;p.invuln=4;p.enemyBurn=0;p.enemySlowTime=0;p.ramLeft=0;p.revision++;burst(p.x,p.y,p.color,18);}
function respawnPlayer(id){
 const p=players[id];if(!running||paused||migrating||fractureLeft>0||!p||p.connected===false||!p.downed||p.hp>0||!(p.lives>0))return false;
 p.lives--;restorePlayer(p);if(between){p.ready=false;lastUI='';}sendState();return true;
}
function requestRespawn(id=localId){if(mode==='online'&&!isHost){if(id===localId)send({t:'respawn'});}else respawnPlayer(id);}
let respawnUIKey='';
function respawnUI(){
 const list=(mode==='local'?activePlayers():[players[localId]]).filter(p=>p?.downed&&p.hp<=0),visible=running&&!paused&&!migrating&&fractureLeft<=0;
 const key=visible+':'+list.map(p=>p.id+':'+p.lives).join(',');if(key===respawnUIKey)return;respawnUIKey=key;const panel=$('#respawnControls');panel.replaceChildren();panel.classList.toggle('hidden',!visible||!list.length);if(!visible)return;
 for(const p of list){const b=document.createElement('button');b.textContent='P'+(p.id+1)+' · RESPAWN NOW · '+p.lives+' lives · R / A';b.disabled=p.lives<=0;b.onclick=()=>requestRespawn(p.id);panel.append(b);}
 const hint=document.createElement('span');hint.textContent=mode==='solo'?'Instant respawn costs one life and gives 4 seconds of protection.':'Or wait for a teammate: 10 seconds nearby revives you free.';panel.append(hint);
}
function tickRevives(dt){
 const live=activePlayers().filter(p=>p.hp>0);
 for(const p of activePlayers())if(p.downed&&p.hp<=0){
  if(live.some(q=>q.id!==p.id&&distance(p,q)<=REVIVE_RADIUS))p.reviveProgress=Math.min(REVIVE_TIME,(p.reviveProgress||0)+dt);
  if(p.reviveProgress>=REVIVE_TIME)restorePlayer(p);
 }
}
function drawRevives(){
 for(const p of activePlayers())if(p.hp>0&&p.invuln>0){const q=onSphere()?Sphere.project(p,cameraFocus(),12):p;if(q.visible===false)continue;X.save();X.strokeStyle='#fff4a8';X.lineWidth=3;X.beginPath();X.arc(q.x,q.y,35,0,Math.PI*2);X.stroke();X.restore();}

 for(const p of activePlayers())if(p.hp<=0){
  const point=onSphere()?Sphere.project(p,cameraFocus(),12):p;if(point.visible===false)continue;
  X.save();X.strokeStyle=p.downed?p.color:'#687585';X.lineWidth=2;X.globalAlpha=.35;
  if(p.downed){X.beginPath();let started=false;for(let i=0;i<=48;i++){const at=offset(p,i*Math.PI/24,REVIVE_RADIUS),q=onSphere()?Sphere.project(at,cameraFocus(),2):at;if(q.visible===false){started=false;continue;}if(started)X.lineTo(q.x,q.y);else X.moveTo(q.x,q.y);started=true;}X.stroke();}
  X.globalAlpha=1;X.beginPath();X.arc(point.x,point.y,23,0,Math.PI*2);X.stroke();X.lineWidth=5;X.beginPath();X.arc(point.x,point.y,29,-Math.PI/2,-Math.PI/2+Math.PI*2*(p.reviveProgress||0)/REVIVE_TIME);X.stroke();
  X.fillStyle=p.downed?p.color:'#8794a5';X.fillRect(point.x-9,point.y-2,18,4);X.fillRect(point.x-2,point.y-9,4,18);X.font='bold 16px system-ui';X.textAlign='center';X.fillText(p.downed?(mode==='solo'?'RESPAWN READY':'FREE REVIVE '+(REVIVE_TIME-(p.reviveProgress||0)).toFixed(1)+'s'):'ELIMINATED',point.x,point.y+53);X.restore();
 }
}
function burst(x,y,color,n=9){for(let i=0;i<n;i++){const a=Math.random()*7,s=Math.random()*150;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.4,color});}if(particles.length>500)particles.splice(0,particles.length-500);}
function tickAbilities(p,dt){
 if(fractureLeft>0||migrating)return;
 const timers=p.abilityTimers||(p.abilityTimers={});for(const k of Object.keys(timers))timers[k]=Math.max(0,timers[k]-dt);
 p.orbitTime=(p.orbitTime||0)+dt*2.8;
 if(p.abilities?.blades&&(timers.blades||0)<=0){timers.blades=.3;for(let n=0;n<2;n++){const at=offset(p,p.orbitTime+n*Math.PI,58);for(const e of enemies)if(e.hp>0&&distance(at,e)<e.r+13)hurt(e,p.damage*.7,p.id);}}
 if(p.abilities?.repair&&(timers.repair||0)<=0){timers.repair=4;for(const ally of activePlayers())if(ally.hp>0&&distance(p,ally)<=160)ally.hp=Math.min(ally.maxHp,ally.hp+8*healingEfficiency());effect({kind:'blast',x:p.x,y:p.y,r:160,color:'#7dffd0'});}
 if(p.abilities?.missiles&&(timers.missiles||0)<=0&&shots.length<600){
  const target=enemies.filter(e=>e.hp>0).sort((a,b)=>distance(p,a)-distance(p,b))[0];
  if(target){timers.missiles=2;const at=offset(p,aimAt(p,target),22);shots.push({x:at.x,y:at.y,vx:Math.cos(at.angle)*370,vy:Math.sin(at.angle)*370,life:2.5,dmg:32*p.damage/22,owner:p.id,color:'#ffba8b',r:7,blast:80*p.blastScale,burn:false,pierce:1,hitIds:[]});}
 }
}
function drawRams(){
 X.save();X.lineWidth=5;X.strokeStyle='#ff334f';X.fillStyle='#ff334f';
 for(const p of [...activePlayers(),...enemies.filter(e=>e.type==='boss')]){
  if(p.hp<=0||(!(p.ramLeft>0)&&!(p.ramWarning>0)))continue;
  X.globalAlpha=p.ramLeft>0?1:.35;X.beginPath();let started=false;const a=p.ramLeft>0?p.ramAngle:p.aim;
  for(let i=0;i<=20;i++){const at=offset(p,a-Math.PI/3+i*Math.PI/30,34),q=onSphere()?Sphere.project(at,cameraFocus(),12):{x:at.x+(visualTier>=2?5:0),y:at.y-(visualTier>=2?8:0)};if(q.visible===false){started=false;continue;}if(started)X.lineTo(q.x,q.y);else X.moveTo(q.x,q.y);started=true;}X.closePath();X.globalAlpha=p.ramLeft>0?.22:.08;X.fill();X.globalAlpha=p.ramLeft>0?1:.35;X.stroke();
 }
 X.restore();
}
function drawMirrorWarnings(){
 const point=p=>onSphere()?Sphere.project(p,cameraFocus(),6):p;
 const ring=(e,r,color)=>{X.strokeStyle=color;X.lineWidth=2;X.beginPath();let started=false;for(let i=0;i<=48;i++){const q=point(offset(e,i*Math.PI/24,r));if(q.visible===false){started=false;continue;}if(started)X.lineTo(q.x,q.y);else X.moveTo(q.x,q.y);started=true;}X.stroke();};
 X.save();
 for(const e of enemies.filter(e=>e.mirror&&e.hp>0)){
  for(const slot of e.weapons){if(!(slot.pending>0))continue;const w=weapons[slot.id];if(w.arc){ring(e,w.reach*e.range,'#9d567f');continue;}
   X.strokeStyle='#71345d';X.lineWidth=2;X.beginPath();let started=false;const reach=Math.min(w.reach*e.range,onSphere()?Math.PI*Sphere.R*.9:1400);
   for(let d=0;d<=reach;d+=20){const q=point(offset(e,slot.shotAim,d));if(q.visible===false){started=false;continue;}if(started)X.lineTo(q.x,q.y);else X.moveTo(q.x,q.y);started=true;}X.stroke();
  }
  if(e.novaWarning>0)ring(e,110,'#ac5a89');
  if(e.abilities.blades)for(let n=0;n<2;n++){const q=point(offset(e,e.orbitTime+n*Math.PI,58));if(q.visible===false)continue;X.fillStyle='#ff6bdd';X.beginPath();X.arc(q.x,q.y,onSphere()?5:7,0,Math.PI*2);X.fill();}
 }
 X.restore();
}
function drawAbilities(){
 X.save();
 for(const p of activePlayers()){
  if(p.hp<=0)continue;
  if(p.abilities?.blades)for(let n=0;n<2;n++){const at=offset(p,(p.orbitTime||0)+n*Math.PI,58),point=onSphere()?Sphere.project(at,cameraFocus(),8):at;if(point.visible===false)continue;X.strokeStyle='#e6c6ff';X.fillStyle='#b487ee';X.lineWidth=2;X.beginPath();X.arc(point.x,point.y,7,0,Math.PI*2);X.fill();X.stroke();}
 }
 X.restore();
}
function shoot(p){
 if(p.hp<=0)return;
 let budget=Math.max(0,Math.floor(600/Math.max(1,activePlayers().length))-shots.filter(s=>s.owner===p.id).length);
 for(const slot of p.weapons){
  if(slot.cool>0||shots.length>=600||budget<=0)continue;
  const w={...weapons[slot.id],reach:(weapons[slot.id].reach||0)*p.range},dmg=w.damage*p.damage/22*P.tiers[slot.tier].power*(Math.random()<p.crit?2:1)*(p.hp<p.maxHp/2?1+p.berserk:1);
  slot.cool=w.rate*(p.rate/.18)/(slot.id==='minigun'?1+slot.spin*2:1);
  if(w.reach){
   const end=offset(p,p.angle,onSphere()?Math.min(600,w.reach):w.reach),bx=end.x,by=end.y;
   effect({kind:w.arc?'arc':'beam',x:p.x,y:p.y,bx,by,angle:p.angle,r:w.reach,arc:w.arc,color:w.color});
   for(const e of enemies){
    const a=aimAt(p,e)-p.angle;
    const hit=w.arc?distance(p,e)<w.reach+e.r&&Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<w.arc/2+e.r/Math.max(e.r,distance(p,e)):distanceToSegment(e.x,e.y,p.x,p.y,bx,by)<e.r+5;
    if(hit)hurt(e,dmg*(1+(p.multi-1)*.15),p.id);
   }
  }else{
   const count=Math.min(16,(w.pellets||1)+p.multi-1);
   for(let n=0;n<count&&shots.length<600&&budget>0;n++,budget--){
    const a=p.angle+(w.pellets?(n-(count-1)/2)*(w.spread/Math.max(1,count-1)):(Math.random()-.5)*(w.spread||0)+(n-(count-1)/2)*.10);
    const at=offset(p,a,20);shots.push({x:at.x,y:at.y,vx:Math.cos(at.angle)*w.speed,vy:Math.sin(at.angle)*w.speed,life:w.life*p.range,dmg,owner:p.id,color:w.color,r:w.blast?7:w.burn?9:3,blast:(w.blast||0)*p.blastScale,burn:!!w.burn,pierce:(w.pierce||1)+p.pierce,hitIds:[]});
   }
  }
 }
}
function localInput(second=false){
 const p=players[second?1:localId];if(!p)return blank();
 let dx,dy,a=p.angle,fire=false,dash=false;
 if(second){
  dx=Number(!!keys.ArrowRight)-Number(!!keys.ArrowLeft);dy=Number(!!keys.ArrowDown)-Number(!!keys.ArrowUp);
  const ax=Number(!!keys.Numpad6)-Number(!!keys.Numpad4),ay=Number(!!keys.Numpad2)-Number(!!keys.Numpad8);
  if(ax||ay){a=Math.atan2(ay,ax)+controlAngle(p);fire=true;}dash=dash2;dash2=false;
 }else{
  dx=touch.move.id!==null?touch.move.x:Number(!!keys.KeyD)-Number(!!keys.KeyA);
  dy=touch.move.id!==null?touch.move.y:Number(!!keys.KeyS)-Number(!!keys.KeyW);
  if(touch.aim.id!==null){if(Math.hypot(touch.aim.x,touch.aim.y)>.15){a=Math.atan2(touch.aim.y,touch.aim.x)+controlAngle(p);fire=true;}}
  else if(mouse.active){const target=onSphere()?Sphere.unproject(mouse.screenX??640,mouse.screenY??360,cameraFocus()):screenTarget(mouse.x,mouse.y);a=aimAt(p,target);fire=mouse.down;}
  dash=dashPending;dashPending=false;
 }
 const pad=window.RRPad?.read(second,mode==='local');
 if(pad&&(inputDevice==='gamepad'||second)){
  dx=pad.dx;dy=pad.dy;fire=pad.fire;dash=pad.dash;a=p.angle;
  if(Math.hypot(pad.ax,pad.ay)>.05)a=Math.atan2(pad.ay,pad.ax)+controlAngle(p);
 }
 const l=Math.max(1,Math.hypot(dx,dy));return{dx:dx/l,dy:dy/l,angle:a,fire,dash};
}
function move(p,i,dt){
 if(p.hp<=0){if(mode==='local'&&i.dash)respawnPlayer(p.id);return;}
 p.hp=Math.min(p.maxHp,p.hp+p.regen*dt*healingEfficiency());p.invuln=Math.max(0,(p.invuln||0)-dt);p.shieldDelay=Math.max(0,p.shieldDelay-dt);if(!p.shieldDelay)p.shield=Math.min(p.maxShield,p.shield+p.maxShield*.15*dt*healingEfficiency());
 for(const s of p.weapons){s.cool=Math.max(0,s.cool-dt);s.spin=i.fire?Math.min(1,s.spin+dt):0;}p.dash=Math.max(0,p.dash-dt);p.angle=i.angle;if(i.dash)startRam(p,p.angle);
 const frame=controlAngle(p),c=Math.cos(frame),s=Math.sin(frame),mx=i.dx*c-i.dy*s,my=i.dx*s+i.dy*c;
 p.enemySlowTime=Math.max(0,(p.enemySlowTime||0)-dt);const moveScale=p.enemySlowTime>0?1-(p.enemySlow||0):1;if(!tickRam(p,dt))travel(p,mx*p.speed*moveScale,my*p.speed*moveScale,dt);if(p.enemyBurn>0){p.enemyBurn=Math.max(0,p.enemyBurn-dt);if(!p.invuln&&p.dash<p.dashTime-.15)damagePlayer(p,p.enemyBurnDamage*dt);}

 if(boundedArena()){p.x=Math.max(18,Math.min(W-18,p.x));p.y=Math.max(18,Math.min(H-18,p.y));}if(i.fire)shoot(p);tickAbilities(p,dt);
}
function simulate(dt){
 if(fractureLeft>0||migrating)return;
 tickRevives(dt);if(mode==='solo'&&players[0]?.downed&&players[0].lives>0)return;
 move(players[localId],localInput(),dt);
 for(const p of players.filter(p=>p.id!==localId)){
  if(p.connected===false)continue;
  if(mode==='local')move(p,localInput(true),dt);
  else {const link=links.get(p.id);if(!link)continue;const fresh=performance.now()-link.inputAt<500,i=fresh?{...link.input}:blank();i.dash=fresh&&link.input.dash>link.dash;link.dash=link.input.dash;move(p,i,dt);}
 }
 if(fractureLeft>0)return;
 spawnTimer-=dt;if(spawnLeft&&spawnTimer<=0){spawn();spawnLeft--;spawnTimer=Math.max(.12,.7-wave*.02);}
 if(!spawnLeft&&!bossSpawned&&!enemies.some(e=>e.hp>0))spawnBoss();
 for(const e of enemies){
  if(e.burn>0){e.burn-=dt;hurt(e,e.burnDamage*dt,e.burnOwner);}if(fractureLeft>0)return;if(e.hp<=0)continue;
  const t=activePlayers().filter(p=>p.hp>0).sort((a,b)=>distance(e,a)-distance(e,b))[0];
  if(e.type==='boss'){e.slowTime=Math.max(0,(e.slowTime||0)-dt);bossAttack(e,t,dt);}else enemyAttack(e,t,dt);
  if(t&&openField()&&activePlayers().filter(p=>p.hp>0).every(p=>distance(e,p)>1900)){const at=offset(t,Math.random()*Math.PI*2,900);e.x=at.x;e.y=at.y;}
  if(t){const a=aimAt(e,t),moving=!e.rival&&!e.ramLeft&&(!e.windup||e.type==='boss')&&!e.beamLeft&&!e.charge&&(!['boss','gunner','sentinel','lancer'].includes(e.type)||distance(e,t)>260);if(moving){travel(e,Math.cos(a)*e.speed*(e.slowTime>0?1-e.slow:1),Math.sin(a)*e.speed*(e.slowTime>0?1-e.slow:1),dt);}if(distance(e,t)<e.r+15&&t.dash<t.dashTime-.15&&!t.invuln){damagePlayer(t,24*dt*enemyScale.damage*waveDamage(),e);e.hit=.08;}}
  e.hit=Math.max(0,e.hit-dt);
 }
 for(const s of shots){
  const ax=s.x,ay=s.y;travel(s,s.vx,s.vy,dt,true);s.life-=dt;
  const hits=enemies.filter(e=>e.hp>0&&!s.hitIds.includes(e.id)&&distanceToSegment(e.x,e.y,ax,ay,s.x,s.y)<e.r+s.r).sort((a,b)=>distance({x:ax,y:ay},a)-distance({x:ax,y:ay},b));
  for(const e of hits){
   if(s.blast){s.x=e.x;s.y=e.y;explode(s);break;}
   hurt(e,s.dmg,s.owner,false,{x:ax,y:ay});s.hitIds.push(e.id);if(s.burn){e.burn=2;e.burnOwner=s.owner;e.burnDamage=Math.max(e.burnDamage,s.dmg*3);}
   if(--s.pierce<=0){s.life=0;break;}
  }
  if(s.blast&&s.life<=0&&!hits.length)explode(s);
 }
 if(fractureLeft>0)return;
 for(const s of enemyShots){const ax=s.x,ay=s.y;travel(s,s.vx,s.vy,dt,true);s.life-=dt;for(const p of activePlayers()){
  if(p.hp<=0||s.hitIds?.includes(p.id)||distanceToSegment(p.x,p.y,ax,ay,s.x,s.y)>s.r+15)continue;
  const source=s.source?enemies.find(e=>e.id===s.source):null;
  if(s.mirror){s.hitIds.push(p.id);if(s.blast){effect({kind:'blast',x:s.x,y:s.y,r:s.blast,color:'#ff6bdd'});for(const q of activePlayers())if(distance(s,q)<s.blast+15)mirrorHit(source,q,s.damage,{burn:s.burn,source:{x:ax,y:ay}});s.life=0;}else{mirrorHit(source,p,s.damage,{burn:s.burn,source:{x:ax,y:ay}});if(--s.pierce<=0)s.life=0;}}
  else{s.life=0;if(!p.invuln&&p.dash<p.dashTime-.15){damagePlayer(p,s.damage,{x:ax,y:ay});p.invuln=wave>7?.2:.6;burst(p.x,p.y,'#ff496c',8);}}
  if(s.life<=0)break;
 }}
 enemyShots=enemyShots.filter(s=>s.life>0&&(!boundedArena()||(s.x>-30&&s.x<W+30&&s.y>-30&&s.y<H+30)));
 enemies=enemies.filter(e=>e.hp>0);shots=shots.filter(s=>s.life>0);
 drops=drops.filter(d=>{const t=activePlayers().filter(p=>p.hp>0).sort((a,b)=>distance(d,a)-distance(d,b))[0];if(!t)return true;const dist=distance(d,t);if(dist<24){collect(d);return false;}if(dist<t.pickup){const v=delta(d,t);travel(d,v.x/dist*320,v.y/dist*320,dt);}return true;});
 if(activePlayers().every(p=>p.hp<=0)&&!activePlayers().some(p=>p.downed&&p.lives>0)){running=false;between=false;recordProgress();sendState();}
 else if(!spawnLeft&&bossSpawned&&!enemies.length)openShop();
}
function ui(){
 respawnUI();
 if(mode==='online'||running||overlay==='gameover'||overlay==='shop'){
  $('#wave').textContent=wave;$('#hostiles').textContent=enemies.length+spawnLeft;$('#score').textContent=score;
  $('#mode').textContent=mode==='online'?((isHost?'HOST · ':'')+shipName(localId)+' · '+activePlayers().length+'/8'):mode.toUpperCase();
 }
 const boss=enemies.find(e=>e.type==='boss'&&e.hp>0);$('#bossHud').classList.toggle('hidden',!boss||!running||between);if(boss){$('#bossName').textContent=(boss.mirror?'MIRROR P'+(boss.sourceId+1)+' · '+(boss.tactic||'OBSERVING'):boss.rival?'RIVAL · '+(boss.tactic||'OBSERVING'):'WARDEN')+' · W'+wave+(boss.mirror?' · TEAM ×'+boss.advantage.toFixed(2):' · POWER ×'+(boss.power.health*enemyScale.health).toFixed(1))+(boss.ramWarning>0?' · RAM INCOMING':boss.windup?' · INCOMING':'');$('#bossBar').value=boss.hp;$('#bossBar').max=boss.maxHp;}
 $('main').classList.toggle('rift-evolved',visualTier>=1);
 const active=running&&!paused&&!between&&!migrating&&fractureLeft<=0&&overlay==='none';
 $('#touch').classList.toggle('active',active);
 $('#pauseBtn').textContent=paused?'▶':'Ⅱ';$('#pauseBtn').disabled=!(running||paused)||fractureLeft>0||migrating;
 const p=players[localId];$('#loadoutHud').textContent=running&&p?'Lv '+p.level+' · XP '+p.xp+'/'+P.threshold(p)+' · '+p.materials+' ◇ · HP '+Math.ceil(p.hp)+'/'+p.maxHp+' · LIVES '+(p.lives??10)+(p.downed?' · REVIVE '+(10-(p.reviveProgress||0)).toFixed(1)+'s':p.hp<=0?' · ELIMINATED':'')+(p.maxShield?' · SH '+Math.ceil(p.shield):'')+' · '+p.weapons.length+'/6 · THREAT ×'+(enemyScale.health*latePressure()).toFixed(2)+' · RECOVERY '+Math.round(healingEfficiency()*100)+'% · RAM '+(p.dash>0?Math.ceil(p.dash)+'s':'READY')+(visualTier===3?' · LAYER V · SPHERE':visualTier===2?' · LAYER IV · 3D':visualTier===1.5?' · LAYER III · FRONTIER':visualTier?' · LAYER II':''):'';$('#dashTouch').textContent=p?.dash>0?'RAM '+Math.ceil(p.dash)+'s':'RAM';
 if(overlay==='skills'&&!between&&!treePreview)show('none');
 if(overlay==='skills'){window.RRSkillUI?.render(treePreview||players[mode==='local'?shopPlayer:localId],id=>shopAction('skill',null,id));return;}
 if(['menu','lobby','armory'].includes(overlay))return;
 const key=[running,between,players.map(p=>p.revision).join(','),shopPlayer,shopTab,isHost,mode].join('|');if(key===lastUI)return;lastUI=key;
 if(!running){$('#finalScore').textContent='Wave '+wave+' · '+score+' points';show('gameover');$('[data-action="restart"]').disabled=mode==='online'&&!isHost;return;}
 if(between){show('shop');renderShop();}else show('none');
}
function update(dt){
 if(fractureLeft>0&&!migrating){fractureLeft=Math.max(0,fractureLeft-dt);if(fractureLeft<=1.6)switchVisualTier(fractureTarget);}
 if(mode==='online'){
  const now=performance.now();netTick+=dt;lobbyTick+=dt;checkpointTick+=dt;
  if(isHost){
   for(const [id,link] of links)if(now-link.lastPacket>20000)dropGuest(id,link);
   if(!roomStarted&&lobbyTick>=1){lobbyTick=0;send({t:'ping',v:18});}
  }else if(conn?.open){
   if(now-lastPacket>12000&&!recovering){beginRecovery();return;}
   const active=running&&!paused&&!between&&!migrating&&fractureLeft<=0;clientInput=active?localInput():blank();if(clientInput.dash)dashSeq++;netVisual?.predict(players[localId],clientInput,dt,now,active);
   if(netTick>=(roomStarted?1/30:1)){netTick=0;send({t:'input',...clientInput,dash:dashSeq});}
  }
 }
 if(running&&!paused&&!between&&fractureLeft<=0&&(mode!=='online'||isHost))simulate(dt);
 if(mode==='online'&&isHost&&roomStarted&&netTick>=1/(links.size>3?15:20)){netTick=0;sendState(checkpointTick>=.5);}
 tickDamageNumbers(dt);
 for(const f of effects)f.life-=dt;effects=effects.filter(f=>f.life>0);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);ui();
}
function draw(){
 const original={players,enemies,shots,enemyShots,effects,drops,particles,damageNumbers};
 if(mode==='online'&&!isHost&&netVisual){const smooth=netVisual.render(original,performance.now(),localId);players=smooth.players;enemies=smooth.enemies;shots=smooth.shots;enemyShots=smooth.enemyShots;}
 fieldCamera={...cameraFocus()};
 if(openField()){
  const transform=list=>list.map(p=>screenEntity(p,fieldCamera));
  players=transform(players);enemies=transform(enemies);shots=transform(shots);enemyShots=transform(enemyShots);effects=transform(effects);drops=transform(drops);particles=transform(particles);damageNumbers=transform(damageNumbers);
 }
 try{drawFrame();}finally{players=original.players;enemies=original.enemies;shots=original.shots;enemyShots=original.enemyShots;effects=original.effects;drops=original.drops;particles=original.particles;damageNumbers=original.damageNumbers;}
}
function drawFrame(){
 const state={W,H,frontier:openField(),fieldCamera,worldSeed,t:performance.now()/1000,reduced:!!reducedMotion?.matches,players:activePlayers(),enemies,shots,enemyShots,effects,drops,particles,paused,sphere:onSphere(),focus:cameraFocus()};
 if(visualTier&&window.RiftVisual){
  const rendered3D=visualTier>=2&&window.Rift3D?.draw(X,state);
  if(!rendered3D)window.RiftVisual.draw(X,state);
  if(visualTier>=2&&!rendered3D){X.fillStyle='#d7eaff';X.font='12px system-ui';X.textAlign='left';X.fillText('3D unavailable on this device · enhanced 2D active',24,H-18);}
 }else drawClassic();
 drawAbilities();drawMirrorWarnings();drawRams();drawDamageNumbers();drawRevives();
 if(openField())for(const p of activePlayers())if(p.id!==localId&&(p.hp>0||p.downed)&&(p.x<20||p.x>W-20||p.y<20||p.y>H-20)){
  const dx=p.x-W/2,dy=p.y-H/2,scale=Math.min((W/2-38)/Math.max(1,Math.abs(dx)),(H/2-38)/Math.max(1,Math.abs(dy))),x=W/2+dx*scale,y=H/2+dy*scale;
  X.save();X.translate(x,y);X.rotate(Math.atan2(dy,dx));X.fillStyle=p.color;X.beginPath();X.moveTo(10,0);X.lineTo(-8,-7);X.lineTo(-8,7);X.closePath();X.fill();X.restore();X.fillStyle=p.color;X.font='bold 13px system-ui';X.textAlign='center';X.fillText('P'+(p.id+1),x,y+21);
 }
 if(mode==='online'&&!onSphere()){X.font='bold 11px system-ui';X.textAlign='center';for(const p of activePlayers()){if(p.hp<=0)continue;X.fillStyle=p.color;X.fillText('P'+(p.id+1)+(p.id===localId?' · YOU':''),p.x,p.y+47);}}
 if(fractureLeft>0)window.RiftVisual?.fracture(X,fractureLeft,!!reducedMotion?.matches,W,H,fractureTarget);
}
function drawClassic(){X.fillStyle='#0a1018';X.fillRect(0,0,W,H);X.strokeStyle='#172333';X.lineWidth=1;for(let x=0;x<W;x+=64){X.beginPath();X.moveTo(x,0);X.lineTo(x,H);X.stroke()}for(let y=0;y<H;y+=64){X.beginPath();X.moveTo(0,y);X.lineTo(W,y);X.stroke()}X.strokeStyle='#20364b';X.lineWidth=3;X.strokeRect(18,18,W-36,H-36);drops.forEach(d=>{X.fillStyle=d.kind==='crate'?'#ffc55c':'#68f7c2';X.save();X.translate(d.x,d.y);X.rotate(Math.PI/4);X.fillRect(-5,-5,10,10);if(d.kind==='crate'){X.strokeStyle='#fff';X.strokeRect(-7,-7,14,14);}X.restore();});shots.forEach(s=>{X.fillStyle=s.color||(s.owner?'#54bfff':'#68f7c2');X.shadowBlur=12;X.shadowColor=X.fillStyle;X.beginPath();X.arc(s.x,s.y,s.r||4,0,7);X.fill()});X.shadowBlur=0;enemyShots.forEach(s=>{X.fillStyle='#ff547d';X.beginPath();X.arc(s.x,s.y,s.r,0,Math.PI*2);X.fill();X.strokeStyle='#ffd7e1';X.lineWidth=2;X.stroke();});effects.forEach(f=>{X.save();X.globalAlpha=Math.min(1,f.life*8);X.strokeStyle=f.color;X.lineWidth=5;X.beginPath();if(f.kind==='blast')X.arc(f.x,f.y,f.r,0,Math.PI*2);else if(f.kind==='beam'){X.moveTo(f.x,f.y);X.lineTo(f.bx,f.by);}else{X.moveTo(f.x,f.y);X.arc(f.x,f.y,f.r,f.angle-f.arc/2,f.angle+f.arc/2);X.closePath();}X.stroke();X.restore();});enemies.forEach(e=>{if((e.type==='lancer'||e.beamAttack)&&e.windup>0||e.beamLeft>0){X.save();X.strokeStyle=e.beamLeft>0?'#fff3ff':'#71345d';X.lineWidth=e.beamLeft>0?12:2;X.beginPath();X.moveTo(e.x,e.y);X.lineTo(e.x+Math.cos(e.aim)*1000,e.y+Math.sin(e.aim)*1000);X.stroke();X.restore();}X.save();X.translate(e.x,e.y);X.rotate(performance.now()/900);X.fillStyle=e.hit?'#fff':e.type==='boss'?'#ff6bdd':(enemyTypes[e.type]?.color||'#ff496c');X.strokeStyle=X.fillStyle;X.lineWidth=3;if(e.mirror){X.rotate((e.aim||0)-performance.now()/900);X.beginPath();X.moveTo(28,0);X.lineTo(-17,-18);X.lineTo(-9,0);X.lineTo(-17,18);X.closePath();X.stroke();X.fillRect(2,-3,20,6);}else if(e.type==='boss'){X.beginPath();X.arc(0,0,e.r,0,Math.PI*2);X.stroke();X.rotate(-performance.now()/900);X.fillRect(-18,-18,36,36);for(let n=0;n<6;n++){X.rotate(Math.PI/3);X.fillRect(30,-5,20,10);}}else if(['runner','charger','gunner'].includes(e.type)){X.rotate(e.aim-performance.now()/900);X.beginPath();X.moveTo(e.r+5,0);X.lineTo(-e.r,-e.r);X.lineTo(-e.r,e.r);X.closePath();X.stroke();X.fillRect(-4,-4,8,8);}else if(['tank','sentinel'].includes(e.type)){X.strokeRect(-e.r,-e.r,e.r*2,e.r*2);X.rotate(.7);X.fillRect(-9,-9,18,18)}else{X.beginPath();for(let i=0;i<6;i++){let a=i*Math.PI/3;X.lineTo(Math.cos(a)*e.r,Math.sin(a)*e.r)}X.closePath();X.fill()}X.restore()});players.forEach(p=>{if(p.hp<=0||p.connected===false)return;X.save();X.translate(p.x,p.y);X.rotate(p.angle);X.shadowBlur=20;X.shadowColor=p.color;X.strokeStyle=p.color;X.fillStyle='#0d1721';X.lineWidth=4;X.beginPath();X.arc(0,0,15,0,7);X.fill();X.stroke();X.fillStyle=p.color;X.fillRect(5,-4,23,8);X.restore();X.fillStyle='#1d2937';X.fillRect(p.x-22,p.y+25,44,5);X.fillStyle=p.hp>30?p.color:'#ff496c';X.fillRect(p.x-22,p.y+25,44*Math.max(0,p.hp/p.maxHp),5)});particles.forEach(p=>{X.globalAlpha=Math.max(0,p.life*2);X.fillStyle=p.color;X.fillRect(p.x,p.y,3,3)});X.globalAlpha=1;if(paused){X.fillStyle='#080b12aa';X.fillRect(0,0,W,H);X.fillStyle='#fff';X.font='700 42px system-ui';X.textAlign='center';X.fillText('PAUSED',W/2,H/2)}}

function sendTo(c,m){if(c?.open&&c.bufferSize<3)c.send(m);}
function send(m){if(isHost){for(const link of links.values())if(link.ready)sendTo(link.c,m);}else sendTo(conn,m);}
function saveRoom(){
 if(!roomKey)return;
 try{const data=JSON.stringify({token:roomToken,hostPeerId,roster,epoch}),key='rr-room:'+roomKey;if(savedRoomData!==key+data){sessionStorage.setItem(key,data);savedRoomData=key+data;}}catch(e){}
}
let joinFailure='',netEvents=[];
function netTrace(s){netEvents.push(s);netEvents=netEvents.slice(-8);const el=$('#netDetails');if(el)el.textContent=netEvents.join('\n');}
function netStatus(s){$('#netStatus').textContent=s;}
function recoveryStatus(s){netStatus(s);$('#toast').textContent=s;$('#toast').classList.toggle('hidden',!s);}
function roomMeta(){return {hostId,hostPeerId:peer?.id||hostPeerId,epoch,roster:[...seats.values()]};}
function sendState(full=true){
 if(!isHost||mode!=='online'||!roomStarted)return;
 if(full)checkpointTick=0;
 roster=[...seats.values()];
 for(const s of [...shots,...enemyShots])if(!s.netId)s.netId=epoch+':'+hostId+':'+(++projectileSerial);
 const state={t:'state',v:18,full,...roomMeta(),migrating,enemies:full?enemies:enemies.map(({brain,...visible})=>visible),shots:full?shots:shots.map(({netId,x,y,vx,vy,r,color})=>({netId,x,y,vx,vy,r,color})),effects,damageNumbers,damageSerial,drops,enemyShots,worldSeed,visualTier,fractureLeft,riftBroken,fractureTarget,enemyScale,wave,score,spawnLeft,spawnTimer,bossSpawned,enemySerial,running,paused,between,choices};
 if(full)checkpoint=JSON.parse(JSON.stringify({...state,players}));
 for(const [id,link] of links)if(link.ready)sendTo(link.c,{...state,players:full?players:players.map(p=>p.id===id?p:{...p,shop:[],items:[],levelChoices:[]})});
 saveRoom();
}
function acceptMeta(m){
 if(Array.isArray(m.roster)&&m.roster.length<=MAX_PLAYERS){
  roster=m.roster.filter(p=>p&&Number.isInteger(p.id)&&p.id>=0&&p.id<MAX_PLAYERS&&typeof p.token==='string').map(p=>({...p,config:P.config(p.config)}));
  seats.clear();for(const p of roster)seats.set(p.id,p);
 }
 if(Number.isInteger(m.hostId))hostId=m.hostId;
 if(typeof m.hostPeerId==='string')hostPeerId=m.hostPeerId;
 if(Number.isInteger(m.epoch))epoch=Math.max(epoch,m.epoch);
 saveRoom();
}
function restoreState(m,presentation=false){
 if(!presentation){netVisual?.reset();seenDamage.clear();}
 worldSeed=Number.isInteger(m.worldSeed)?m.worldSeed:1;
 P.syncSerial(m.players);
 enemyScale=difficultyScale(m.enemyScale?.power??0);visualTier=[1,1.5,2,3].includes(m.visualTier)?m.visualTier:0;fractureTarget=[1,1.5,2,3].includes(m.fractureTarget)?m.fractureTarget:visualTier;fractureLeft=Number.isFinite(m.fractureLeft)?Math.max(0,Math.min(3,m.fractureLeft)):0;riftBroken=m.riftBroken===true;
 mode='online';roomStarted=true;players=m.players;enemies=m.enemies;shots=m.shots;effects=Array.isArray(m.effects)?m.effects:[];if(presentation){if((m.damageSerial||0)<damageSerial){damageNumbers=[];seenDamage.clear();}mergeDamageNumbers(m.damageNumbers);}else damageNumbers=Array.isArray(m.damageNumbers)?m.damageNumbers.slice(-64):[];damageSerial=m.damageSerial||0;drops=Array.isArray(m.drops)?m.drops:[];enemyShots=Array.isArray(m.enemyShots)?m.enemyShots:[];wave=m.wave;score=m.score;spawnLeft=m.spawnLeft;spawnTimer=m.spawnTimer??.6;bossSpawned=!!m.bossSpawned;enemySerial=m.enemySerial||0;running=m.running;paused=m.paused;between=m.between;choices=m.choices||[];
}
function renderLobby(){
 $('#startRoom').classList.toggle('hidden',!isHost||!roomOpen||roomStarted);
 $('#startRoom').disabled=false;
 const present=roster.filter(p=>p.connected!==false);
 $('#crewList').textContent=present.length?present.length+'/8 connected · '+present.map(p=>shipName(p.id)+' / '+P.characters[p.config.character].name).join(' · '):'';
}
function broadcastLobby(){
 if(!isHost)return;roster=[...seats.values()];renderLobby();send({t:'lobby',v:18,...roomMeta()});saveRoom();
 if(!roomStarted)netStatus('Room ready · '+roster.filter(p=>p.connected!==false).length+'/8 connected. Share the password, then tap START RUN.');
}
function dropGuest(id,link){
 if(links.get(id)!==link)return;links.delete(id);link.c.close?.();
 const seat=seats.get(id);if(seat){seat.connected=false;if(!roomStarted)seats.delete(id);}
 if(roomStarted&&players[id]){
  const p=players[id];p.connected=false;p.revision++;lastUI='';
  if(!migrating&&between&&activePlayers().every(p=>p.ready)){nextWave();paused=false;resetInput();show('none');}
  sendState();
 }else broadcastLobby();
}
function cleanup(){
 triedPeers.clear();
 session++;clearTimeout(netTimer);clearTimeout(recoveryTimer);for(const link of links.values())link.c.close?.();links.clear();seats.clear();
 const old=peer;peer=null;const oldConn=conn;conn=null;oldConn?.close?.();old?.destroy();beacon?.destroy();beacon=null;
 dashSeq=0;resetInput();running=false;paused=false;between=false;mode='solo';localId=0;isHost=false;roomOpen=false;roomStarted=false;roster=[];netTick=0;lobbyTick=0;checkpointTick=0;checkpoint=null;migrating=false;recovering=false;joinTargets=[];migrationQueue=[];epoch=0;hostId=0;hostPeerId='';roomKey='';roomToken='';
 enemyScale=difficultyScale(0);visualTier=0;fractureLeft=0;riftBroken=false;fractureTarget=0;renderLobby();recoveryStatus('');
}
function fail(s){cleanup();show('lobby');netStatus(s);}
function loadPeer(){
 if(window.Peer)return Promise.resolve();
 if(peerScript)return peerScript;
 peerScript=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
  const timer=setTimeout(()=>{s.remove();reject(new Error('timeout'));},15000);
  s.onload=()=>{clearTimeout(timer);resolve();};s.onerror=()=>{clearTimeout(timer);s.remove();reject(new Error('load'));};document.head.append(s);
 }).catch(e=>{peerScript=null;throw e;});return peerScript;
}
function peerOptions(){return {debug:1,config:{iceServers:[
 {urls:['stun:stun.l.google.com:19302','stun:stun.cloudflare.com:3478']},
 {urls:['turn:eu-0.turn.peerjs.com:3478?transport=udp','turn:us-0.turn.peerjs.com:3478?transport=udp','turn:eu-0.turn.peerjs.com:3478?transport=tcp','turn:us-0.turn.peerjs.com:3478?transport=tcp'],username:'peerjs',credential:'peerjsp'}
 ],iceTransportPolicy:'all'}};}
function randomPassword(){const bytes=crypto.getRandomValues(new Uint8Array(12));return Array.from(bytes,b=>'abcdefghjkmnpqrstuvwxyz23456789'[b%29]).join('');}


async function roomId(password){
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('rift-runners-v18:'+password));
 return 'rr18-'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
function redirect(c){
 const reply=()=>{sendTo(c,{t:'redirect',v:18,peerId:hostPeerId});setTimeout(()=>c.close?.(),500);};
 if(c.open)reply();else c.on('open',reply);
}
function attachPeer(p,token){
 p.on('connection',c=>{if(token!==session){c.close();return;}if(isHost)wire(c,token);else redirect(c);});
 p.on('error',e=>{
  if(token!==session)return;
  netTrace('Matchmaking error: '+e.type);
  if(['peer-unavailable','webrtc'].includes(e.type)&&!isHost){joinFailure=e.type==='peer-unavailable'?'Host not registered for this password. Ask the host to keep the room open.':'Peer connection failed while negotiating WebRTC.';if(e.type==='peer-unavailable')retryJoin();return;}
  if((isHost&&roomOpen)||conn?.open){netStatus('Matchmaking interrupted; existing player connections remain active.');return;}
  fail(e.type==='unavailable-id'?'That room exists. Choose JOIN ROOM to rejoin, or use a new password.':'Connection failed. Retry hosting or joining.');
 });
 p.on('disconnected',()=>{if(token===session&&!p.destroyed){try{p.reconnect();}catch(e){netStatus('Matchmaking disconnected; existing player connections remain active.');}}});
}
async function connect(host){
 cleanup();joinFailure='';netEvents=[];netTrace('Connecting to matchmaking');const token=session;isHost=host;localId=host?0:-1;mode='online';show('lobby');
 let password=$('#roomPassword').value.trim().toLowerCase();if(host&&!password)password=randomPassword();
 if(password.length<8||password.length>64){netStatus('Use a game-only password of 8–64 characters. Host can generate one if blank.');return;}
 $('#roomPassword').value=password;netStatus('Contacting matchmaking…');
 netTimer=setTimeout(()=>{if(token===session)fail('Matchmaking timed out. Check your connection and retry.');},22000);
 try{
  await loadPeer();const id=await roomId(password);if(token!==session)return;roomKey=id;
  let saved=null;try{saved=JSON.parse(sessionStorage.getItem('rr-room:'+id)||'null');}catch(e){}
  roomToken=!host&&saved?.token?saved.token:randomPassword()+randomPassword();
  const p=new Peer(host?id:undefined,peerOptions());peer=p;attachPeer(p,token);
  p.on('open',()=>{
   if(token!==session)return;clearTimeout(netTimer);
   netTrace('Matchmaking connected');if(host){hostPeerId=p.id;roomOpen=true;seats.set(0,{id:0,token:roomToken,config:P.config(configs[0]),peerId:p.id,connected:true});broadcastLobby();}
   else {
    joinTargets=[...new Set([id,saved?.hostPeerId,...(saved?.roster||[]).map(s=>s.peerId)].filter(Boolean))];
    netStatus('Finding the room…');tryJoin();
   }
  });
 }catch(e){if(token===session)fail('Could not load matchmaking. Check your Internet connection and retry.');}
}
function tryJoin(){
 clearTimeout(netTimer);const old=conn;conn=null;old?.close?.();
 if(recovering){
  const candidate=migrationQueue.shift();
  if(!candidate){recovering=false;recoveryStatus('Could not reach a surviving host. Refresh and JOIN ROOM to retry.');return;}
  if(candidate.id===localId){promoteHost();return;}
  hostPeerId=candidate.peerId;
 }else{
  hostPeerId=joinTargets.shift();
  if(!hostPeerId){netStatus(joinFailure||'Host connection timed out after 20 seconds. Check the host is online; the network may be blocking WebRTC.');return;}
 }
 if(triedPeers.has(hostPeerId)){tryJoin();return;}triedPeers.add(hostPeerId);
 if(!peer)return;
 wire(peer.connect(hostPeerId,{reliable:true,serialization:'binary',metadata:{v:18}}),session);
 netTimer=setTimeout(()=>{if(!isHost)retryJoin();},recovering?8000:20000);
}
function retryJoin(){if(isHost)return;tryJoin();}
function beginRecovery(){
 if(isHost||recovering||(!checkpoint&&!roster.length))return;
 triedPeers.clear();
 recovering=true;migrating=true;resetInput();recoveryStatus('Host connection lost · finding a new host…');
 const old=conn;conn=null;old?.close?.();
 // Try the original host first to recover a transient link failure, then elect by slot.
 migrationQueue=[{id:hostId,peerId:hostPeerId},...roster.filter(p=>p.id!==hostId&&p.connected!==false&&p.peerId).sort((a,b)=>a.id-b.id)];
 tryJoin();
}
function promoteHost(){
 if(checkpoint){restoreState(JSON.parse(JSON.stringify(checkpoint)));acceptMeta(checkpoint);}
 isHost=true;hostId=localId;hostPeerId=peer?.id||seats.get(localId)?.peerId||'';epoch++;links.clear();conn=null;roomOpen=true;migrating=true;recovering=false;netTick=0;
 for(const seat of seats.values())seat.connected=seat.id===localId;
 const own=seats.get(localId);if(own)own.peerId=hostPeerId;
 for(const p of players)p.connected=p.id===localId;
 resetInput();recoveryStatus('You are the new host · reconnecting the team…');
 const token=session;clearTimeout(recoveryTimer);recoveryTimer=setTimeout(()=>{if(token!==session||!isHost)return;finishMigration();},3500);
 claimDirectory(token);broadcastLobby();sendState();
}
function finishMigration(){
 migrating=false;recoveryStatus('');lastUI='';
 if(between&&activePlayers().every(p=>p.ready)){nextWave();paused=false;resetInput();show('none');}
 sendState();
}
function claimDirectory(token,attempt=0){
 if(!peer||!window.Peer||!roomKey||peer.id===roomKey||attempt>=12||token!==session||!isHost)return;
 const b=new Peer(roomKey,peerOptions());beacon=b;
 b.on('connection',redirect);
 b.on('error',()=>{b.destroy();if(token===session&&isHost)setTimeout(()=>claimDirectory(token,attempt+1),5000);});
}
function rejectConnection(c,reason){
 const reject=()=>{sendTo(c,{t:'reject',reason});setTimeout(()=>c.close?.(),500);};
 if(c.open)reject();else c.on('open',reject);
}
function wire(c,token){
 const accepting=isHost;let id=-1,link=null,handshakeTimer=null,rejected=false;
 netTrace(accepting?'Incoming connection offer':'Opening peer connection');
 const pc=c.peerConnection;
 if(pc?.addEventListener){
  netTrace('Signalling: '+pc.signalingState);
  pc.addEventListener('signalingstatechange',()=>{if(token===session)netTrace('Signalling: '+pc.signalingState);});
  pc.addEventListener('icegatheringstatechange',()=>{if(token===session)netTrace('Finding routes: '+pc.iceGatheringState);});
  const candidates=new Set();pc.addEventListener('icecandidate',e=>{if(token!==session)return;if(e.candidate){const kind=e.candidate.type||'unknown';if(!candidates.has(kind)){candidates.add(kind);netTrace('Route available: '+kind);}}else if(!candidates.size)netTrace('No network routes found by this browser');});
  pc.addEventListener('icecandidateerror',e=>{if(token===session)netTrace('Route server error '+e.errorCode);});
  pc.addEventListener('iceconnectionstatechange',()=>{if(token===session){netTrace('Network path: '+pc.iceConnectionState);if(pc.iceConnectionState==='failed')joinFailure='WebRTC network path failed. Try another network; a relay connection may be needed.';}});pc.addEventListener('connectionstatechange',()=>{if(token===session)netTrace('Peer transport: '+pc.connectionState);});}
 if(accepting){
  // The production host creates this seat on open; this also supports offline harnesses.
  if(!seats.has(localId)){roomToken||=randomPassword()+randomPassword();seats.set(localId,{id:localId,token:roomToken,config:P.config(configs[0]),peerId:peer?.id||'host',connected:true});}
  handshakeTimer=setTimeout(()=>c.close?.(),30000);
 }else conn=c;
 c.on('open',()=>{if(token!==session)return;netTrace('Data channel open');lastPacket=performance.now();if(!accepting)sendTo(c,{t:'ready',v:18,token:roomToken,config:P.config(configs[0])});});
 c.on('data',m=>{
  if(token!==session||!m||typeof m!=='object')return;
  if(accepting){
   if(!isHost)return;
   if(m.t==='ready'&&!link){
    if(m.v!==18||typeof m.token!=='string'||m.token.length<16||m.token.length>128){rejectConnection(c,'Refresh to v1.19.0 and join again.');return;}
    let seat=[...seats.values()].find(s=>s.token===m.token);
    if(seat&&seat.id===localId){rejectConnection(c,'This ship is currently the host.');return;}
    if(!seat){
     if(roomStarted){rejectConnection(c,'Run in progress. Only returning players can rejoin; new players join the next room.');return;}
     for(let n=0;n<MAX_PLAYERS;n++)if(!seats.has(n)){id=n;break;}
     if(id<0){rejectConnection(c,'Room full: maximum eight players.');return;}
     seat={id,token:m.token,config:P.config(m.config)};
    }
    id=seat.id;const previous=links.get(id);if(previous){links.delete(id);previous.c.close?.();}
    seat.connected=true;seat.peerId=c.peer||('guest-'+id);seats.set(id,seat);
    link={c,ready:true,config:seat.config,input:blank(),inputAt:0,dash:0,lastPacket:performance.now()};links.set(id,link);clearTimeout(handshakeTimer);mode='online';
    if(roomStarted&&players[id]){
     const p=players[id];p.connected=true;p.invuln=3;p.revision++;
     if(between&&p.shopWave!==wave){P.open(p,wave,Object.keys(weapons));p.shopWave=wave;if(p.hp<=0)p.ready=true;}
     lastUI='';
    }
    sendTo(c,{t:'welcome',v:18,id,...roomMeta()});broadcastLobby();sendState();return;
   }
   if(!link||links.get(id)!==link)return;link.lastPacket=performance.now();
   if(m.t==='respawn'&&roomStarted&&!migrating){respawnPlayer(id);return;}
   if(m.t==='shop'){applyShop(id,m);return;}
   if(m.t==='input'){
    if(![m.dx,m.dy,m.angle,m.dash].every(Number.isFinite))return;
    const l=Math.max(1,Math.hypot(m.dx,m.dy));link.input={dx:m.dx/l,dy:m.dy/l,angle:m.angle,fire:m.fire===true,dash:Math.max(0,Math.min(1e9,Math.floor(m.dash)))};
    link.inputAt=performance.now();return;
   }
   if(m.t==='pause'&&roomStarted&&!migrating&&fractureLeft<=0){paused=!paused;resetInput();sendState();return;}
   return;
  }
  if(conn!==c||isHost)return;lastPacket=performance.now();
  if(m.t==='redirect'&&typeof m.peerId==='string'&&m.peerId!==c.peer){
   clearTimeout(netTimer);if(recovering)migrationQueue.unshift({id:-1,peerId:m.peerId});else joinTargets.unshift(m.peerId);tryJoin();return;
  }
  if(m.t==='reject'){rejected=true;netTrace('Host response: '+m.reason);clearTimeout(netTimer);recovering=false;netStatus(m.reason||'Room unavailable.');if(!roomStarted)show('lobby');return;}
  if(m.v!==18)return;
  if(m.t==='welcome'&&Number.isInteger(m.id)&&m.id>=0&&m.id<MAX_PLAYERS){
   localId=m.id;clearTimeout(netTimer);recovering=false;acceptMeta(m);mode='online';netStatus('Connected as '+shipName(localId)+'. Waiting for the host to start.');return;
  }
  if(m.t==='lobby'){acceptMeta(m);renderLobby();return;}
  if(m.t==='state'){
   if(!Array.isArray(m.players)||m.players.length<1||m.players.length>MAX_PLAYERS||!m.players.every((p,i)=>p&&p.id===i)||!m.players[localId]||!Array.isArray(m.enemies)||!Array.isArray(m.shots))return;
   clearTimeout(netTimer);acceptMeta(m);if(m.full)checkpoint=JSON.parse(JSON.stringify(m));netVisual?.receive(m,performance.now());restoreState(m,true);migrating=!!m.migrating;recovering=false;recoveryStatus(migrating?'New host connected · waiting for the team…':'');
   if(between||!running)recordProgress();if(overlay==='lobby')show('none');ui();
  }
 });
 const ended=()=>{
  clearTimeout(handshakeTimer);if(token!==session||rejected)return;
  if(accepting){if(link)dropGuest(id,link);}
  else if(conn===c&&!isHost){if(recovering)retryJoin();else if(roomStarted||roster.length)beginRecovery();else{conn=null;netStatus('Connection lost. Tap JOIN ROOM to retry.');}}
 };
 c.on('close',ended);c.on('error',e=>{netTrace('Data channel error: '+(e.type||e.message||'unknown'));ended();});
}
function pointerStick(name,selector){
 const el=$(selector),s=touch[name];
 const update=e=>{
  const r=el.getBoundingClientRect(),radius=r.width*.35,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=Math.max(radius,Math.hypot(dx,dy));
  s.x=dx/l;s.y=dy/l;el.querySelector('i').style.transform='translate('+s.x*radius+'px,'+s.y*radius+'px)';
 };
 el.addEventListener('pointerdown',e=>{if(s.id!==null)return;inputMode('touch');e.preventDefault();s.id=e.pointerId;el.setPointerCapture(e.pointerId);update(e);});
 el.addEventListener('pointermove',e=>{if(s.id===e.pointerId){e.preventDefault();update(e);}});
 const end=e=>{if(s.id!==e.pointerId)return;s.id=null;s.x=s.y=0;el.querySelector('i').style.transform='';};
 ['pointerup','pointercancel','lostpointercapture'].forEach(n=>el.addEventListener(n,end));
}
pointerStick('move','#moveStick');pointerStick('aim','#aimStick');
$('#dashTouch').addEventListener('pointerdown',e=>{e.preventDefault();dashPending=true;});
document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')inputMode('touch');else if(e.pointerType==='mouse')inputMode('keyboard');});
addEventListener('blur',resetInput);
document.addEventListener('visibilitychange',()=>{resetInput();if(document.hidden&&running&&(mode!=='online'||isHost)){paused=true;sendState();}});
addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,select,[contenteditable]'))return;
 inputMode('keyboard');if(!e.repeat&&(e.code==='Escape'||e.code==='KeyP')){$('#pauseBtn').onclick();return;}
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Enter'&&running&&!between)e.preventDefault();
 if(e.code==='KeyR'&&!e.repeat&&running){requestRespawn();e.preventDefault();return;}
 keys[e.code]=true;if(!e.repeat&&['Space','ShiftLeft','ShiftRight'].includes(e.code))dashPending=true;if(!e.repeat&&e.code==='Enter')dash2=true;
});
addEventListener('keyup',e=>{keys[e.code]=false;});
function mousePos(e){
 const r=C.getBoundingClientRect(),scale=Math.min(r.width/W,r.height/H),ox=(r.width-W*scale)/2,oy=(r.height-H*scale)/2;
 mouse.x=mouse.screenX=(e.clientX-r.left-ox)/scale;mouse.y=mouse.screenY=(e.clientY-r.top-oy)/scale;mouse.active=true;inputMode('keyboard');
}
C.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')mousePos(e);});
C.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0){mousePos(e);mouse.down=true;}});
addEventListener('pointerup',e=>{if(e.pointerType==='mouse')mouse.down=false;});
$('#pauseBtn').onclick=()=>{if(!running||between||fractureLeft>0||migrating)return;if(mode==='online'&&!isHost)send({t:'pause'});else {paused=!paused;resetInput();sendState();}};
$$('[data-action]').forEach(b=>b.onclick=async()=>{
 const a=b.dataset.action;
 if(a==='solo'||a==='local'){cleanup();localId=0;start(a);}
 if(a==='armory'){show('armory');armory();}
 if(a==='skills'&&between)openTree();if(a==='skills-preview')openTree(true);if(a==='skill-close'){show(treePreview?'armory':'shop');treePreview=null;lastUI='';ui();}
 if(a==='armory-done')show('menu');
 if(a==='armory-player'){armoryPlayer=1-armoryPlayer;armory();}
 if(a==='online'){cleanup();show('lobby');netStatus('Choose Host or Join.');}
 if(a==='back'){cleanup();show('menu');}
 if(a==='host')connect(true);if(a==='join')connect(false);if(a==='start-room'&&isHost&&roomOpen&&!roomStarted&&[...links.values()].every(l=>l.ready))start('online');
 if(a==='restart'&&(mode!=='online'||isHost))start(mode);
 if(a==='copy'){try{if(!$('#roomPassword').value)return;await navigator.clipboard.writeText($('#roomPassword').value);netStatus('Password copied. Send it to your teammates.');}catch(e){$('#roomPassword').select();netStatus('Select and copy the password above.');}}
});
$('#reroll').onclick=()=>shopAction('reroll');
$('#readyShop').onclick=()=>shopAction('ready');
$('#switchShop').onclick=()=>{shopPlayer=1-shopPlayer;lastUI='';ui();};
for(const tab of ['offers','inventory','items','stats'])$('#tab-'+tab).onclick=()=>{shopTab=tab;lastUI='';ui();};
function loop(t){pollPads();const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop);}
requestAnimationFrame(loop);
})();
