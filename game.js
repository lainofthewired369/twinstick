(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const C=$('#game'), X=C.getContext('2d'), W=1280,H=720,keys={},mouse={x:640,y:360,down:false,active:false};
let running=false,paused=false,last=0,mode='solo',wave=0,score=0,enemies=[],shots=[],particles=[],players=[],spawnLeft=0,spawnTimer=0,between=false;
let peer=null,conn=null,isHost=false,localId=0,netTick=0,session=0,netTimer,remoteAt=0,lastPacket=0,peerScript=null;
let choices=[],overlay='menu',lastUI='',dashPending=false,dash2=false,dashSeq=0,remoteDash=0;
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
let enemyScale={power:0,health:1,damage:1,attack:1};
let visualTier=0,fractureLeft=0,riftBroken=false,fractureTarget=0;
function breakRift(){
 const target=wave===5?1:wave===10?2:0;
 if(!target||target<=fractureTarget)return;
 fractureTarget=target;riftBroken=true;fractureLeft=3;paused=false;shots=[];enemyShots=[];enemies=enemies.filter(e=>e.hp>0);resetInput();sendState();
}
const blank=()=>({dx:0,dy:0,angle:0,fire:false,dash:0});
let remoteInput=blank(),enemySerial=0,effects=[],armoryPlayer=0,enemyShots=[],bossSpawned=false,shopTab='offers';
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
let guestConfig=P.config(),drops=[],shopPlayer=0,profile={best:0,characters:{}},saveWarning='',lastSaved='';
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
function collect(d){for(const p of players){if(d.kind==='crate')P.loot(p,d.weapon);else P.grant(p,d.value,d.value);}burst(d.x,d.y,d.kind==='crate'?'#ffc55c':'#68f7c2',5);}
function openShop(){for(const d of drops)collect(d);drops=[];shots=[];enemyShots=[];between=true;paused=false;shopPlayer=0;shopTab='offers';for(const p of players)P.open(p,wave,Object.keys(weapons));recordProgress();resetInput();lastUI='';sendState();}
function shopAction(action,uid,stat){
 const id=mode==='local'?shopPlayer:localId,p=players[id];if(!p)return;
 const m={t:'shop',action,uid,stat,wave,revision:p.revision};
 if(mode==='online'&&!isHost)send(m);else applyShop(id,m);
}
function applyShop(id,m){if(!running||!between||fractureLeft>0||!players[id]||!P.action(players[id],m,wave,Object.keys(weapons)))return;lastUI='';if(players.every(p=>p.ready)){nextWave();paused=false;resetInput();show('none');}sendState();}
function button(parent,label,fn,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=fn;parent.append(b);return b;}
function renderShop(){
 const p=players[mode==='local'?shopPlayer:localId];if(!p)return;
 $('#shopTitle').textContent=P.characters[p.character].name+' · '+(p.id?'Blue':'Green')+' ship';
 $('#shopStats').textContent=p.materials+' materials · Level '+p.level+' · XP '+p.xp+'/'+P.threshold(p)+' · HP '+Math.ceil(p.hp)+'/'+p.maxHp+' · Damage '+Math.round(p.damage/22*100)+'% · Armor '+p.armor+' · Regen '+p.regen.toFixed(1)+'/s · Luck '+p.luck+' · Harvest '+p.harvest+' · Crit '+Math.round(p.crit*100)+'%';
 $('#shopHint').textContent=p.ready?'Ready. Waiting for your teammate.':p.pending?'Choose '+p.pending+' level upgrade(s), then shop and mark Ready.':'Buy equipment, combine matching tiers, then mark Ready.';
 $('#levelChoices').replaceChildren();for(const stat of p.levelChoices)button($('#levelChoices'),P.stats[stat].name+' — '+P.stats[stat].desc,()=>shopAction('level',null,stat),p.ready);
 $('#offers').replaceChildren();
 for(const o of p.shop){const card=document.createElement('article');card.className='shop-card';$('#offers').append(card);if(!o){card.textContent='SOLD';continue;}const t=P.tiers[o.tier];card.style.borderColor=t.color;const label=o.kind==='weapon'?weapons[o.id]:(P.items[o.id]||P.stats[o.id]);const text=document.createElement('p');text.textContent=(label.icon?label.icon+' ':'')+t.name+' '+label.name+' · '+(o.kind==='weapon'?Math.round(t.power*100)+'% base damage':label.desc+' ×'+o.tier);card.append(text);const full=o.kind==='weapon'&&p.weapons.length>=6,merge=full&&p.weapons.some(w=>w.id===o.id&&w.tier===o.tier&&w.tier<4);button(card,(full&&!merge?'FULL · ':merge?'BUY + COMBINE · ':'BUY · ')+o.cost,()=>shopAction('buy',o.uid),p.ready||p.materials<o.cost||(full&&!merge));button(card,o.locked?'UNLOCK':'LOCK',()=>shopAction('lock',o.uid),p.ready);}
 $('#inventory').replaceChildren();for(const w of p.weapons){const row=document.createElement('article');row.className='shop-card';row.style.borderColor=P.tiers[w.tier].color;const text=document.createElement('p');text.textContent=P.tiers[w.tier].name+' '+weapons[w.id].name+' · '+Math.round(P.tiers[w.tier].power*100)+'% damage';row.append(text);button(row,'COMBINE → '+(P.tiers[w.tier+1]?.name||'MAX'),()=>shopAction('combine',w.uid),p.ready||!P.partner(p,w));button(row,'SELL · '+P.sellValue(w,wave),()=>shopAction('sell',w.uid),p.ready||p.weapons.length<=1);$('#inventory').append(row);}
 $('#itemList').replaceChildren();if(!p.items.length)$('#itemList').textContent='No augments yet. Buy one in the market.';
 for(const i of p.items){const def=P.items[i.id]||P.stats[i.id],card=document.createElement('article');card.className='shop-card';card.style.borderColor=P.tiers[i.tier].color;card.textContent=(def.icon||'◆')+' '+P.tiers[i.tier].name+' '+def.name+' — '+def.desc+' ×'+i.tier;$('#itemList').append(card);}
 $('#shopWallet').textContent=p.materials+' ◇';
 for(const tab of ['offers','inventory','items','stats']){$('#pane-'+tab).classList.toggle('hidden',shopTab!==tab);$('#tab-'+tab).classList.toggle('selected',shopTab===tab);}

 $('#reroll').textContent='REROLL · '+P.rerollCost(p,wave);$('#reroll').disabled=p.ready||p.materials<P.rerollCost(p,wave)||p.shop.every(o=>o?.locked);
 $('#readyShop').textContent=p.ready?'CANCEL READY':'READY · NEXT WAVE';$('#readyShop').disabled=!!p.pending;
 $('#switchShop').classList.toggle('hidden',mode!=='local');
 $('#teamReady').textContent=players.map(p=>(p.id?'Blue':'Green')+': '+(p.ready?'Ready':'Shopping')).join(' · ');
}
function hurt(e,damage,owner){if(e.hp<=0)return;const p=players[owner],actual=Math.min(e.hp,damage);if(p&&p.hp>0){p.hp=Math.min(p.maxHp,p.hp+actual*p.leech);if(p.slow){e.slow=p.slow;e.slowTime=1;}}e.hp-=damage;e.hit=.1;if(e.hp<=0){if(e.type==='boss')breakRift();if(p&&p.hp>0)p.hp=Math.min(p.maxHp,p.hp+p.killHeal);if(e.type==='splitter'&&enemies.length<140)for(let n=0;n<3;n++)spawnVariant('swarm',e.x+Math.cos(n*2.1)*22,e.y+Math.sin(n*2.1)*22);score+=e.type==='boss'?500:e.type==='tank'?50:20;drops.push({x:Math.max(20,Math.min(W-20,e.x)),y:Math.max(20,Math.min(H-20,e.y)),kind:'material',value:e.type==='boss'?35:e.type==='tank'?6:3});if(e.type==='boss'||(e.type==='tank'&&Math.random()<.15))drops.push({x:e.x,y:e.y,kind:'crate',weapon:Object.keys(weapons)[Math.floor(Math.random()*10)]});burst(e.x,e.y,e.type==='tank'?'#ffc55c':'#ff496c',14);}}
function distanceToSegment(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-ax-t*dx,y-ay-t*dy);}
function effect(f){effects.push({...f,life:.18});if(effects.length>100)effects.shift();}
function explode(s){effect({kind:'blast',x:s.x,y:s.y,r:s.blast,color:s.color});for(const e of enemies)if(Math.hypot(e.x-s.x,e.y-s.y)<s.blast+e.r)hurt(e,s.dmg,s.owner);s.life=0;}

const touch={move:{id:null,x:0,y:0},aim:{id:null,x:0,y:0}};
function player(x,color,id){return P.init({x,y:360,angle:0,hp:100,maxHp:100,color,id,speed:250,damage:22,rate:.18,cool:0,dash:0,dashTime:1.5,multi:1},id===1?(mode==='online'?guestConfig:configs[1]):configs[0]);}
function show(id){overlay=id;['menu','lobby','upgrade','gameover','armory','shop'].forEach(n=>$('#'+n).classList.toggle('hidden',n!==id));}
function resetInput(){
 Object.keys(keys).forEach(k=>delete keys[k]);mouse.down=false;dashPending=false;dash2=false;
 for(const [name,s] of Object.entries(touch)){const el=$('#'+(name==='move'?'moveStick':'aimStick'));if(s.id!==null&&el.hasPointerCapture(s.id))el.releasePointerCapture(s.id);s.id=null;s.x=s.y=0;el.querySelector('i').style.transform='';}
}
function start(m){
 resetInput();visualTier=0;fractureLeft=0;riftBroken=false;fractureTarget=0;mode=m;wave=0;score=0;enemies=[];shots=[];particles=[];effects=[];enemySerial=0;choices=[];drops=[];
 players=[player(448,'#68f7c2',0)];if(m!=='solo')players.push(player(832,'#54bfff',1));
 running=true;paused=false;between=false;remoteInput={...blank(),dash:remoteDash};lastUI='';nextWave();show('none');sendState();
}
function nextWave(){wave++;enemyScale=difficultyScale();spawnLeft=Math.min(100,5+wave*3);spawnTimer=.6;between=false;choices=[];bossSpawned=false;enemyShots=[];}
function teamPower(){
 const values=players.map(p=>{
  const dps=p.weapons.reduce((sum,s)=>{const w=weapons[s.id];return sum+w.damage*(w.pellets||1)/w.rate*P.tiers[s.tier].power;},0)*(p.damage/22)*(.18/p.rate)*(1+p.crit)*Math.min(2,1+(p.multi-1)*.25);
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
 bossSpawned=true;const power=bossPower(),hp=(1000+wave*150)*(players.length===2?1.8:1)*power.health*enemyScale.health;
 enemies.push({id:++enemySerial,type:'boss',power,reinforce:7,x:W/2,y:90,r:42,hp,maxHp:hp,speed:48+Math.min(30,wave),hit:0,burn:0,burnDamage:0,attack:1.8,windup:0,pattern:0,aim:0});
 burst(W/2,90,'#ff6bdd',40);
}
function hostileShot(e,a,speed,damage){if(enemyShots.length>=220)return;enemyShots.push({x:e.x+Math.cos(a)*(e.r+8),y:e.y+Math.sin(a)*(e.r+8),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:e.type==='boss'?7:5,life:4.5,damage:damage*enemyScale.damage});}
function bossAttack(e,target,dt){
 if(!target)return;
 e.reinforce-=dt;if(e.reinforce<=0&&enemies.length<65){e.reinforce=e.hp<e.maxHp/2?6:9;for(let n=0;n<2;n++)spawnVariant(n?'gunner':'runner',Math.max(30,Math.min(W-30,e.x+(n?100:-100))),Math.max(30,e.y+70));}
 if(e.windup>0){e.windup=Math.max(0,e.windup-dt);if(e.windup>0)return;
  const phase=e.pattern%3,angry=e.hp<e.maxHp/2,count=phase===1?(angry?20:16):phase===2?9:5,speed=Math.min(430,270+wave*7);
  for(let n=0;n<count;n++){const angle=phase===1?n*Math.PI*2/count+e.aim:phase===2?e.aim+(n-4)*.13:e.aim+(n-2)*.18;hostileShot(e,angle,speed*(phase===2?.8:1),(16+wave*.8)*e.power.damage);}
  e.pattern++;e.attack=(angry?.85:1.4)/(e.power.attack*enemyScale.attack);
 }else{e.attack-=dt;if(e.attack<=0){e.aim=Math.atan2(target.y-e.y,target.x-e.x);e.windup=.8;}}
}
const enemyTypes={
 drone:{color:'#ff597e',r:14,hp:35,speed:96},tank:{color:'#ffcb68',r:22,hp:95,speed:55},
 runner:{color:'#ff865b',r:11,hp:23,speed:174},gunner:{color:'#ac8fff',r:17,hp:52,speed:65},
 charger:{color:'#ff4d4d',r:18,hp:72,speed:78},splitter:{color:'#a9eb67',r:21,hp:100,speed:62},
 swarm:{color:'#c8f58a',r:9,hp:16,speed:150},sentinel:{color:'#66cffa',r:23,hp:155,speed:42}
};
function spawnVariant(type,x,y){const v=enemyTypes[type];enemies.push({id:++enemySerial,type,x,y,r:v.r,hp:(v.hp+wave*(type==='swarm'?2:7))*enemyScale.health,speed:Math.min(270,v.speed+wave*2),hit:0,burn:0,burnDamage:0,attack:(1+Math.random())/enemyScale.attack,windup:0,aim:0,charge:0,slow:0,slowTime:0});}
function spawn(){const side=Math.floor(Math.random()*4),pool=wave<2?['drone','drone','tank']:wave<4?['drone','tank','runner','gunner']:['drone','tank','runner','gunner','charger','splitter','sentinel'],type=pool[Math.floor(Math.random()*pool.length)];spawnVariant(type,side%2?Math.random()*W:side?W+30:-30,side%2?(side===1?-30:H+30):Math.random()*H);}
function enemyAttack(e,t,dt){
 if(!t)return;
 e.slowTime=Math.max(0,(e.slowTime||0)-dt);
 if(!['gunner','charger','sentinel'].includes(e.type))return;
 if(e.windup>0){e.windup=Math.max(0,e.windup-dt);if(e.windup<=0){if(e.type==='charger')e.charge=.45;else for(let n=0;n<(e.type==='sentinel'?3:1);n++)hostileShot(e,e.aim+(e.type==='sentinel'?(n-1)*.2:0),220+Math.min(90,wave*4),10+wave*.5);e.attack=(e.type==='charger'?2.3:2.0)/enemyScale.attack;}}
 else if(e.charge>0){e.charge=Math.max(0,e.charge-dt);e.x=Math.max(18,Math.min(W-18,e.x+Math.cos(e.aim)*520*dt));e.y=Math.max(18,Math.min(H-18,e.y+Math.sin(e.aim)*520*dt));}
 else{e.attack-=dt;if(e.attack<=0){e.aim=Math.atan2(t.y-e.y,t.x-e.x);e.windup=.65;}}
}
function damagePlayer(p,damage){p.shieldDelay=4;const absorbed=Math.min(p.shield,damage);p.shield-=absorbed;p.hp=Math.max(0,p.hp-(damage-absorbed)/(1+p.armor*.08));}
function burst(x,y,color,n=9){for(let i=0;i<n;i++){const a=Math.random()*7,s=Math.random()*150;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.4,color});}if(particles.length>500)particles.splice(0,particles.length-500);}
function shoot(p){
 if(p.hp<=0)return;
 for(const slot of p.weapons){
  if(slot.cool>0||shots.length>=600)continue;
  const w={...weapons[slot.id],reach:(weapons[slot.id].reach||0)*p.range},dmg=w.damage*p.damage/22*P.tiers[slot.tier].power*(Math.random()<p.crit?2:1)*(p.hp<p.maxHp/2?1+p.berserk:1);
  slot.cool=w.rate*(p.rate/.18)/(slot.id==='minigun'?1+slot.spin*2:1);
  if(w.reach){
   const bx=p.x+Math.cos(p.angle)*w.reach,by=p.y+Math.sin(p.angle)*w.reach;
   effect({kind:w.arc?'arc':'beam',x:p.x,y:p.y,bx,by,angle:p.angle,r:w.reach,arc:w.arc,color:w.color});
   for(const e of enemies){
    const a=Math.atan2(e.y-p.y,e.x-p.x)-p.angle;
    const hit=w.arc?Math.hypot(e.x-p.x,e.y-p.y)<w.reach+e.r&&Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<w.arc/2+e.r/Math.max(e.r,Math.hypot(e.x-p.x,e.y-p.y)):distanceToSegment(e.x,e.y,p.x,p.y,bx,by)<e.r+5;
    if(hit)hurt(e,dmg*(1+(p.multi-1)*.15),p.id);
   }
  }else{
   const count=Math.min(16,(w.pellets||1)+p.multi-1);
   for(let n=0;n<count&&shots.length<600;n++){
    const a=p.angle+(w.pellets?(n-(count-1)/2)*(w.spread/Math.max(1,count-1)):(Math.random()-.5)*(w.spread||0)+(n-(count-1)/2)*.10);
    shots.push({x:p.x+Math.cos(a)*20,y:p.y+Math.sin(a)*20,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,life:w.life*p.range,dmg,owner:p.id,color:w.color,r:w.blast?7:w.burn?9:3,blast:(w.blast||0)*p.blastScale,burn:!!w.burn,pierce:(w.pierce||1)+p.pierce,hitIds:[]});
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
  if(ax||ay){a=Math.atan2(ay,ax);fire=true;}dash=dash2;dash2=false;
 }else{
  dx=touch.move.id!==null?touch.move.x:Number(!!keys.KeyD)-Number(!!keys.KeyA);
  dy=touch.move.id!==null?touch.move.y:Number(!!keys.KeyS)-Number(!!keys.KeyW);
  if(touch.aim.id!==null){if(Math.hypot(touch.aim.x,touch.aim.y)>.15){a=Math.atan2(touch.aim.y,touch.aim.x);fire=true;}}
  else if(mouse.active){a=Math.atan2(mouse.y-p.y,mouse.x-p.x);fire=mouse.down;}
  dash=dashPending;dashPending=false;
 }
 const l=Math.max(1,Math.hypot(dx,dy));return{dx:dx/l,dy:dy/l,angle:a,fire,dash};
}
function move(p,i,dt){
 if(p.hp<=0)return;
 p.hp=Math.min(p.maxHp,p.hp+p.regen*dt);p.invuln=Math.max(0,(p.invuln||0)-dt);p.shieldDelay=Math.max(0,p.shieldDelay-dt);if(!p.shieldDelay)p.shield=Math.min(p.maxShield,p.shield+p.maxShield*.15*dt);
 for(const s of p.weapons){s.cool=Math.max(0,s.cool-dt);s.spin=i.fire?Math.min(1,s.spin+dt):0;}p.dash=Math.max(0,p.dash-dt);p.angle=i.angle;
 p.x+=i.dx*p.speed*dt;p.y+=i.dy*p.speed*dt;
 if(i.dash&&p.dash===0){let dx=i.dx,dy=i.dy;if(Math.hypot(dx,dy)<.1){dx=Math.cos(p.angle);dy=Math.sin(p.angle);}const l=Math.hypot(dx,dy);p.x+=dx/l*110;p.y+=dy/l*110;p.dash=p.dashTime;burst(p.x,p.y,p.color,14);}
 p.x=Math.max(18,Math.min(W-18,p.x));p.y=Math.max(18,Math.min(H-18,p.y));if(i.fire)shoot(p);
}
function simulate(dt){
 if(fractureLeft>0)return;
 move(players[0],localInput(),dt);
 if(players[1]){
  if(mode==='local')move(players[1],localInput(true),dt);
  else {const i=performance.now()-remoteAt<500?{...remoteInput}:blank();i.dash=remoteInput.dash>remoteDash;remoteDash=remoteInput.dash;move(players[1],i,dt);}
 }
 if(fractureLeft>0)return;
 spawnTimer-=dt;if(spawnLeft&&spawnTimer<=0){spawn();spawnLeft--;spawnTimer=Math.max(.12,.7-wave*.02);}
 if(wave%5===0&&!spawnLeft&&!bossSpawned)spawnBoss();
 for(const e of enemies){
  if(e.burn>0){e.burn-=dt;hurt(e,e.burnDamage*dt,e.burnOwner);}if(fractureLeft>0)return;if(e.hp<=0)continue;
  const t=players.filter(p=>p.hp>0).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
  if(e.type==='boss'){e.slowTime=Math.max(0,(e.slowTime||0)-dt);bossAttack(e,t,dt);}else enemyAttack(e,t,dt);
  if(t){const a=Math.atan2(t.y-e.y,t.x-e.x),moving=!e.windup&&!e.charge&&(!['boss','gunner','sentinel'].includes(e.type)||Math.hypot(t.x-e.x,t.y-e.y)>260);if(moving){e.x+=Math.cos(a)*e.speed*(e.slowTime>0?1-e.slow:1)*dt;e.y+=Math.sin(a)*e.speed*(e.slowTime>0?1-e.slow:1)*dt;}if(Math.hypot(t.x-e.x,t.y-e.y)<e.r+15&&t.dash<t.dashTime-.15&&!t.invuln){damagePlayer(t,24*dt*enemyScale.damage);e.hit=.08;}}
  e.hit=Math.max(0,e.hit-dt);
 }
 for(const s of shots){
  const ax=s.x,ay=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
  const hits=enemies.filter(e=>e.hp>0&&!s.hitIds.includes(e.id)&&distanceToSegment(e.x,e.y,ax,ay,s.x,s.y)<e.r+s.r).sort((a,b)=>Math.hypot(a.x-ax,a.y-ay)-Math.hypot(b.x-ax,b.y-ay));
  for(const e of hits){
   if(s.blast){s.x=e.x;s.y=e.y;explode(s);break;}
   hurt(e,s.dmg,s.owner);s.hitIds.push(e.id);if(s.burn){e.burn=2;e.burnOwner=s.owner;e.burnDamage=Math.max(e.burnDamage,s.dmg*3);}
   if(--s.pierce<=0){s.life=0;break;}
  }
  if(s.blast&&s.life<=0&&!hits.length)explode(s);
 }
 if(fractureLeft>0)return;
 for(const s of enemyShots){const ax=s.x,ay=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;for(const p of players){if(p.hp<=0||distanceToSegment(p.x,p.y,ax,ay,s.x,s.y)>s.r+15)continue;s.life=0;if(!p.invuln&&p.dash<p.dashTime-.15){damagePlayer(p,s.damage);p.invuln=.6;burst(p.x,p.y,'#ff496c',8);}break;}}
 enemyShots=enemyShots.filter(s=>s.life>0&&s.x>-30&&s.x<W+30&&s.y>-30&&s.y<H+30);
 enemies=enemies.filter(e=>e.hp>0);shots=shots.filter(s=>s.life>0);
 drops=drops.filter(d=>{const t=players.filter(p=>p.hp>0).sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y))[0];if(!t)return true;const dist=Math.hypot(t.x-d.x,t.y-d.y);if(dist<24){collect(d);return false;}if(dist<t.pickup){d.x+=(t.x-d.x)/dist*320*dt;d.y+=(t.y-d.y)/dist*320*dt;}return true;});
 if(players.every(p=>p.hp<=0)){running=false;between=false;recordProgress();sendState();}
 else if(!spawnLeft&&!enemies.length)openShop();
}
function ui(){
 if(mode==='online'||running||overlay==='gameover'||overlay==='shop'){
  $('#wave').textContent=wave;$('#hostiles').textContent=enemies.length+spawnLeft;$('#score').textContent=score;
  $('#mode').textContent=mode==='online'?(isHost?'HOST · GREEN':'GUEST · BLUE'):mode.toUpperCase();
 }
 const boss=enemies.find(e=>e.type==='boss'&&e.hp>0);$('#bossHud').classList.toggle('hidden',!boss||!running||between);if(boss){$('#bossName').textContent='WARDEN · W'+wave+' · POWER ×'+(boss.power.health*enemyScale.health).toFixed(1)+(boss.windup?' · INCOMING '+(['VOLLEY','RING','FAN'][boss.pattern%3]):'');$('#bossBar').value=boss.hp;$('#bossBar').max=boss.maxHp;}
 $('main').classList.toggle('rift-evolved',visualTier>=1);
 const active=running&&!paused&&!between&&fractureLeft<=0&&overlay==='none';
 $('#touch').classList.toggle('active',active);
 $('#pauseBtn').textContent=paused?'▶':'Ⅱ';$('#pauseBtn').disabled=!(running||paused)||fractureLeft>0;
 const p=players[localId];$('#loadoutHud').textContent=running&&p?'Lv '+p.level+' · XP '+p.xp+'/'+P.threshold(p)+' · '+p.materials+' ◇ · HP '+Math.ceil(p.hp)+'/'+p.maxHp+(p.maxShield?' · SH '+Math.ceil(p.shield):'')+' · '+p.weapons.length+'/6 · THREAT ×'+enemyScale.health.toFixed(2)+(visualTier===2?' · LAYER III · 3D':visualTier?' · LAYER II':''):'';$('#dashTouch').textContent=p?.dash>0?p.dash.toFixed(1)+'s':'DASH';
 if(['menu','lobby','armory'].includes(overlay))return;
 const key=[running,between,players.map(p=>p.revision).join(','),shopPlayer,shopTab,isHost,mode].join('|');if(key===lastUI)return;lastUI=key;
 if(!running){$('#finalScore').textContent='Wave '+wave+' · '+score+' points';show('gameover');$('[data-action="restart"]').disabled=mode==='online'&&!isHost;return;}
 if(between){show('shop');renderShop();}else show('none');
}
function update(dt){
 if(fractureLeft>0){fractureLeft=Math.max(0,fractureLeft-dt);if(fractureLeft<=1.6)visualTier=fractureTarget;}
 if(mode==='online'&&conn?.open){
  if(performance.now()-lastPacket>12000){fail('Connection lost. Host a new room to reconnect.');return;}
  netTick+=dt;if(!isHost&&netTick>=1/30){
   netTick=0;const i=running&&!paused&&!between&&fractureLeft<=0?localInput():blank();if(i.dash)dashSeq++;send({t:'input',...i,dash:dashSeq});
  }
 }
 if(running&&!paused&&!between&&fractureLeft<=0&&(mode!=='online'||isHost))simulate(dt);
 if(mode==='online'&&isHost&&netTick>=1/20){netTick=0;sendState();}
 for(const f of effects)f.life-=dt;effects=effects.filter(f=>f.life>0);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);ui();
}
function draw(){
 const state={W,H,t:performance.now()/1000,reduced:!!reducedMotion?.matches,players,enemies,shots,enemyShots,effects,drops,particles,paused};
 if(visualTier&&window.RiftVisual){
  const rendered3D=visualTier===2&&window.Rift3D?.draw(X,state);
  if(!rendered3D)window.RiftVisual.draw(X,state);
  if(visualTier===2&&!rendered3D){X.fillStyle='#d7eaff';X.font='12px system-ui';X.textAlign='left';X.fillText('3D unavailable on this device · enhanced 2D active',24,H-18);}
 }else drawClassic();
 if(fractureLeft>0)window.RiftVisual?.fracture(X,fractureLeft,!!reducedMotion?.matches,W,H,fractureTarget);
}
function drawClassic(){X.fillStyle='#0a1018';X.fillRect(0,0,W,H);X.strokeStyle='#172333';X.lineWidth=1;for(let x=0;x<W;x+=64){X.beginPath();X.moveTo(x,0);X.lineTo(x,H);X.stroke()}for(let y=0;y<H;y+=64){X.beginPath();X.moveTo(0,y);X.lineTo(W,y);X.stroke()}X.strokeStyle='#20364b';X.lineWidth=3;X.strokeRect(18,18,W-36,H-36);drops.forEach(d=>{X.fillStyle=d.kind==='crate'?'#ffc55c':'#68f7c2';X.save();X.translate(d.x,d.y);X.rotate(Math.PI/4);X.fillRect(-5,-5,10,10);if(d.kind==='crate'){X.strokeStyle='#fff';X.strokeRect(-7,-7,14,14);}X.restore();});shots.forEach(s=>{X.fillStyle=s.color||(s.owner?'#54bfff':'#68f7c2');X.shadowBlur=12;X.shadowColor=X.fillStyle;X.beginPath();X.arc(s.x,s.y,s.r||4,0,7);X.fill()});X.shadowBlur=0;enemyShots.forEach(s=>{X.fillStyle='#ff547d';X.beginPath();X.arc(s.x,s.y,s.r,0,Math.PI*2);X.fill();X.strokeStyle='#ffd7e1';X.lineWidth=2;X.stroke();});effects.forEach(f=>{X.save();X.globalAlpha=Math.min(1,f.life*8);X.strokeStyle=f.color;X.lineWidth=5;X.beginPath();if(f.kind==='blast')X.arc(f.x,f.y,f.r,0,Math.PI*2);else if(f.kind==='beam'){X.moveTo(f.x,f.y);X.lineTo(f.bx,f.by);}else{X.moveTo(f.x,f.y);X.arc(f.x,f.y,f.r,f.angle-f.arc/2,f.angle+f.arc/2);X.closePath();}X.stroke();X.restore();});enemies.forEach(e=>{if(e.windup>0){X.save();X.strokeStyle='#ff6bdd';X.globalAlpha=.35+.4*(1-e.windup/.85);X.lineWidth=3;X.beginPath();if(e.type==='boss'&&e.pattern%3===1)X.arc(e.x,e.y,90+(1-e.windup/.85)*40,0,Math.PI*2);else for(let n=-1;n<=1;n++){X.moveTo(e.x,e.y);X.lineTo(e.x+Math.cos(e.aim+n*.2)*800,e.y+Math.sin(e.aim+n*.2)*800);}X.stroke();X.restore();}X.save();X.translate(e.x,e.y);X.rotate(performance.now()/900);X.fillStyle=e.hit?'#fff':e.type==='boss'?'#ff6bdd':(enemyTypes[e.type]?.color||'#ff496c');X.strokeStyle=X.fillStyle;X.lineWidth=3;if(e.type==='boss'){X.beginPath();X.arc(0,0,e.r,0,Math.PI*2);X.stroke();X.rotate(-performance.now()/900);X.fillRect(-18,-18,36,36);for(let n=0;n<6;n++){X.rotate(Math.PI/3);X.fillRect(30,-5,20,10);}}else if(['runner','charger','gunner'].includes(e.type)){X.rotate(e.aim-performance.now()/900);X.beginPath();X.moveTo(e.r+5,0);X.lineTo(-e.r,-e.r);X.lineTo(-e.r,e.r);X.closePath();X.stroke();X.fillRect(-4,-4,8,8);}else if(['tank','sentinel'].includes(e.type)){X.strokeRect(-e.r,-e.r,e.r*2,e.r*2);X.rotate(.7);X.fillRect(-9,-9,18,18)}else{X.beginPath();for(let i=0;i<6;i++){let a=i*Math.PI/3;X.lineTo(Math.cos(a)*e.r,Math.sin(a)*e.r)}X.closePath();X.fill()}X.restore()});players.forEach(p=>{if(p.hp<=0)return;X.save();X.translate(p.x,p.y);X.rotate(p.angle);X.shadowBlur=20;X.shadowColor=p.color;X.strokeStyle=p.color;X.fillStyle='#0d1721';X.lineWidth=4;X.beginPath();X.arc(0,0,15,0,7);X.fill();X.stroke();X.fillStyle=p.color;X.fillRect(5,-4,23,8);X.restore();X.fillStyle='#1d2937';X.fillRect(p.x-22,p.y+25,44,5);X.fillStyle=p.hp>30?p.color:'#ff496c';X.fillRect(p.x-22,p.y+25,44*Math.max(0,p.hp/p.maxHp),5)});particles.forEach(p=>{X.globalAlpha=Math.max(0,p.life*2);X.fillStyle=p.color;X.fillRect(p.x,p.y,3,3)});X.globalAlpha=1;if(paused){X.fillStyle='#080b12aa';X.fillRect(0,0,W,H);X.fillStyle='#fff';X.font='700 42px system-ui';X.textAlign='center';X.fillText('PAUSED',W/2,H/2)}}

function send(m){if(conn?.open&&conn.bufferSize<3)conn.send(m);}
function sendState(){if(isHost&&mode==='online')send({t:'state',v:9,players,enemies,shots,effects,drops,enemyShots,visualTier,fractureLeft,riftBroken,fractureTarget,enemyScale,wave,score,spawnLeft,running,paused,between,choices});}
function netStatus(s){$('#netStatus').textContent=s;}
function cleanup(){
 session++;clearTimeout(netTimer);const old=peer;peer=null;conn=null;old?.destroy();remoteInput=blank();remoteDash=0;dashSeq=0;resetInput();running=false;paused=false;between=false;mode='solo';enemyScale=difficultyScale(0);visualTier=0;fractureLeft=0;riftBroken=false;fractureTarget=0;
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
function randomPassword(){const bytes=crypto.getRandomValues(new Uint8Array(12));return Array.from(bytes,b=>'abcdefghjkmnpqrstuvwxyz23456789'[b%29]).join('');}
async function roomId(password){
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('rift-runners-v9:'+password));
 return 'rr7-'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
async function connect(host){
 cleanup();const token=session;isHost=host;localId=host?0:1;show('lobby');
 let password=$('#roomPassword').value.trim().toLowerCase();
 if(host&&!password)password=randomPassword();
 if(password.length<8||password.length>64){netStatus('Use a game-only password of 8–64 characters. Host can generate one if the field is blank.');return;}
 $('#roomPassword').value=password;netStatus('Contacting matchmaking…');
 netTimer=setTimeout(()=>{if(token===session)fail('Matchmaking timed out. Check your connection and retry.');},22000);
 try{
  await loadPeer();const id=await roomId(password);if(token!==session)return;
  const p=new Peer(host?id:undefined,{debug:0});peer=p;
  p.on('open',()=>{
   if(token!==session)return;clearTimeout(netTimer);
   if(host)netStatus('Room ready. Share the password above and keep this tab open.');
   else {netStatus('Connecting to host…');wire(p.connect(id,{reliable:true,serialization:'json',metadata:{v:9}}),token);}
  });
  p.on('connection',c=>{
   if(token!==session||!host||conn){c.on('open',()=>{c.send({t:'reject',reason:'Room full. Only two players can join.'});setTimeout(()=>c.close(),500);});return;}
   wire(c,token);
  });
  p.on('error',e=>{
   if(token!==session)return;
   const messages={'unavailable-id':'That room password is already in use. Choose Join, or use a different password.','peer-unavailable':'Room not found. Check the password and ask your friend to host first.','network':'Matchmaking is unavailable. Check your connection and retry.','webrtc':'WebRTC could not connect. Try another network; a TURN relay may be required.'};
   if(conn?.open){netStatus('Matchmaking disconnected; existing game link remains active.');return;}
   fail(messages[e.type]||'Connection failed. Please retry hosting or joining.');
  });
  p.on('disconnected',()=>{if(token===session&&!conn?.open)fail('Matchmaking disconnected. Please host or join again.');});
 }catch(e){if(token===session)fail('Could not load matchmaking. Check your Internet connection and retry.');}
}
function wire(c,token){
 conn=c;clearTimeout(netTimer);
 netTimer=setTimeout(()=>{if(token===session)fail('Could not reach your teammate. Check the room password; some networks require a TURN relay.');},20000);
 c.on('open',()=>{if(token!==session)return;lastPacket=performance.now();if(!isHost)send({t:'ready',v:9,config:P.config(configs[0])});});
 c.on('data',m=>{
  if(token!==session||!m||typeof m!=='object')return;lastPacket=performance.now();
  if(m.t==='reject'){fail(m.reason||'Room unavailable.');return;}
  if(isHost&&m.t==='ready'&&m.v===9&&!running){guestConfig=P.config(m.config);clearTimeout(netTimer);mode='online';start('online');return;}
  if(isHost&&m.t==='shop'){applyShop(1,m);return;}
  if(isHost&&m.t==='input'){
   if(![m.dx,m.dy,m.angle,m.dash].every(Number.isFinite))return;
   const l=Math.max(1,Math.hypot(m.dx,m.dy));remoteInput={dx:m.dx/l,dy:m.dy/l,angle:m.angle,fire:m.fire===true,dash:Math.max(0,Math.min(1e9,Math.floor(m.dash)))};
   remoteAt=performance.now();return;
  }
  if(isHost&&m.t==='pause'&&fractureLeft<=0){paused=!paused;resetInput();sendState();return;}
  if(!isHost&&m.t==='state'&&m.v===9){
   if(!Array.isArray(m.players)||m.players.length!==2||!Array.isArray(m.enemies)||!Array.isArray(m.shots))return;
   clearTimeout(netTimer);enemyScale=difficultyScale(m.enemyScale?.power??0);visualTier=[1,2].includes(m.visualTier)?m.visualTier:0;fractureTarget=[1,2].includes(m.fractureTarget)?m.fractureTarget:visualTier;fractureLeft=Number.isFinite(m.fractureLeft)?Math.max(0,Math.min(3,m.fractureLeft)):0;riftBroken=m.riftBroken===true;mode='online';players=m.players;enemies=m.enemies;shots=m.shots;effects=Array.isArray(m.effects)?m.effects:[];drops=Array.isArray(m.drops)?m.drops:[];enemyShots=Array.isArray(m.enemyShots)?m.enemyShots:[];wave=m.wave;score=m.score;spawnLeft=m.spawnLeft;running=m.running;paused=m.paused;between=m.between;choices=m.choices;
   if(between||!running)recordProgress();if(overlay==='lobby')show('none');ui();
  }
 });
 c.on('close',()=>{if(token===session)fail('Your teammate disconnected. Host a new room to play again.');});
 c.on('error',()=>{if(token===session)fail('Game connection failed. Retry or try another network.');});
}
function pointerStick(name,selector){
 const el=$(selector),s=touch[name];
 const update=e=>{
  const r=el.getBoundingClientRect(),radius=r.width*.35,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=Math.max(radius,Math.hypot(dx,dy));
  s.x=dx/l;s.y=dy/l;el.querySelector('i').style.transform='translate('+s.x*radius+'px,'+s.y*radius+'px)';
 };
 el.addEventListener('pointerdown',e=>{if(s.id!==null)return;e.preventDefault();s.id=e.pointerId;el.setPointerCapture(e.pointerId);update(e);});
 el.addEventListener('pointermove',e=>{if(s.id===e.pointerId){e.preventDefault();update(e);}});
 const end=e=>{if(s.id!==e.pointerId)return;s.id=null;s.x=s.y=0;el.querySelector('i').style.transform='';};
 ['pointerup','pointercancel','lostpointercapture'].forEach(n=>el.addEventListener(n,end));
}
pointerStick('move','#moveStick');pointerStick('aim','#aimStick');
$('#dashTouch').addEventListener('pointerdown',e=>{e.preventDefault();dashPending=true;});
addEventListener('blur',resetInput);
document.addEventListener('visibilitychange',()=>{resetInput();if(document.hidden&&running&&(mode!=='online'||isHost)){paused=true;sendState();}});
addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,button'))return;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 keys[e.code]=true;if(!e.repeat&&e.code==='Space')dashPending=true;if(!e.repeat&&e.code==='Enter')dash2=true;
});
addEventListener('keyup',e=>{keys[e.code]=false;});
function mousePos(e){
 const r=C.getBoundingClientRect(),scale=Math.min(r.width/W,r.height/H),ox=(r.width-W*scale)/2,oy=(r.height-H*scale)/2;
 mouse.x=(e.clientX-r.left-ox)/scale;mouse.y=(e.clientY-r.top-oy)/scale;mouse.active=true;
}
C.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')mousePos(e);});
C.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0){mousePos(e);mouse.down=true;}});
addEventListener('pointerup',e=>{if(e.pointerType==='mouse')mouse.down=false;});
$('#pauseBtn').onclick=()=>{if(fractureLeft>0)return;if(mode==='online'&&!isHost)send({t:'pause'});else {paused=!paused;resetInput();sendState();}};
$$('[data-action]').forEach(b=>b.onclick=async()=>{
 const a=b.dataset.action;
 if(a==='solo'||a==='local'){cleanup();localId=0;start(a);}
 if(a==='armory'){show('armory');armory();}
 if(a==='armory-done')show('menu');
 if(a==='armory-player'){armoryPlayer=1-armoryPlayer;armory();}
 if(a==='online'){cleanup();show('lobby');netStatus('Choose Host or Join.');}
 if(a==='back'){cleanup();show('menu');}
 if(a==='host')connect(true);if(a==='join')connect(false);
 if(a==='restart'&&(mode!=='online'||isHost))start(mode);
 if(a==='copy'){try{if(!$('#roomPassword').value)return;await navigator.clipboard.writeText($('#roomPassword').value);netStatus('Password copied. Send it to your teammate.');}catch(e){$('#roomPassword').select();netStatus('Select and copy the password above.');}}
});
$('#reroll').onclick=()=>shopAction('reroll');
$('#readyShop').onclick=()=>shopAction('ready');
$('#switchShop').onclick=()=>{shopPlayer=1-shopPlayer;lastUI='';ui();};
for(const tab of ['offers','inventory','items','stats'])$('#tab-'+tab).onclick=()=>{shopTab=tab;lastUI='';ui();};
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop);}
requestAnimationFrame(loop);
})();
