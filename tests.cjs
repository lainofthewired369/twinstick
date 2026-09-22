const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('./progression.js'),ids=['pistol','shotgun','smg','minigun','sniper','rocket','flame','laser','knife','spear'];
const make=c=>P.init({hp:100,maxHp:100,speed:250,damage:22,rate:.18},c);
const act=(p,action,extra={})=>P.action(p,{action,wave:1,revision:p.revision,...extra},1,ids);
let p=make();assert.equal(p.weapons.length,1);assert.equal(p.materials,0);
P.grant(p,40,40);assert.equal(p.level,3);assert.equal(p.pending,2);assert.equal(p.xp,9);
assert.equal(act(p,'ready'),false);while(p.pending)assert(act(p,'level',{stat:p.levelChoices[0]}));
P.open(p,1,ids);assert.equal(p.shop.length,4);assert(p.shop.slice(0,2).every(o=>o.kind==='weapon'));
p.materials=1000;let offer=p.shop[0],rev=p.revision;assert(act(p,'buy',{uid:offer.uid}));
assert.equal(P.action(p,{action:'buy',uid:offer.uid,wave:1,revision:rev},1,ids),false);
assert.equal(act(p,'buy',{uid:offer.uid}),false);assert.equal(p.weapons.length,2);
offer=p.shop[1];assert(act(p,'lock',{uid:offer.uid}));assert(act(p,'reroll'));assert.equal(p.shop[1].uid,offer.uid);
P.open(p,2,ids);assert.equal(p.shop[1].uid,offer.uid);
p=make();p.weapons=[P.weapon('pistol'),P.weapon('pistol')];const uid=p.weapons[0].uid;assert(act(p,'combine',{uid}));assert.equal(p.weapons.length,1);assert.equal(p.weapons[0].tier,2);assert.equal(act(p,'sell',{uid}),false);
p.weapons.push(P.weapon('pistol',1));assert.equal(act(p,'combine',{uid}),false);
p.weapons=[P.weapon('pistol',4),P.weapon('pistol',4)];assert.equal(act(p,'combine',{uid:p.weapons[0].uid}),false);
p=make();p.materials=100;p.weapons=Array.from({length:6},()=>P.weapon('pistol'));p.shop=[{uid:999,id:'pistol',kind:'weapon',tier:1,cost:20}];assert(act(p,'buy',{uid:999}));assert.equal(p.weapons.length,6);assert.equal(p.weapons[0].tier,2);assert.equal(p.materials,80);
p.shop=[{uid:1000,id:'rocket',kind:'weapon',tier:1,cost:20}];assert.equal(act(p,'buy',{uid:1000}),false);assert.equal(p.materials,80);
p.shop=[{uid:1001,id:'armor',kind:'item',tier:3,cost:20}];assert(act(p,'buy',{uid:1001}));assert.equal(p.armor,6);
assert(act(p,'ready'));assert.equal(act(p,'reroll'),false);assert(act(p,'ready'));
P.loot(p,'rocket');assert.equal(p.materials,72);assert.equal(p.weapons.length,6);
assert.deepEqual(P.config({character:'bad',starter:'rocket'}),{character:'ranger',starter:'pistol'});
assert.equal(make({character:'bulwark'}).maxHp,140);assert.equal(P.rarity(20,0,()=>0),4);
console.log('PASS economy: XP, purchases, replay rejection, locks, combining, capacity, items, readiness, loot and character stats.');

function harness(){const elements={},events={},stored={},numberDraws=[];const el=()=>({textContent:'',classList:{toggle(){}},style:{},addEventListener(){},querySelector:()=>el(),getContext:()=>({save(){},restore(){},strokeText(label,x,y){numberDraws.push({label,x,y,color:this.fillStyle});},fillText(){}}),hasPointerCapture:()=>false,replaceChildren(){},append(){},dataset:{}});const c={numberDraws,crypto:require('node:crypto').webcrypto,sessionStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},window:{RRNetworkVisuals:require('./network-visuals.js'),RRProgress:P,RRSphere:require('./sphere-world.js')},document:{querySelector:s=>elements[s]??=el(),querySelectorAll:()=>[],addEventListener(){},createElement:el},localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},performance:{now:()=>1000},requestAnimationFrame(){},addEventListener(){},setTimeout:()=>0,clearTimeout(){}};vm.createContext(c);let src=fs.readFileSync(__dirname+'/game.js','utf8');src=src.replace('requestAnimationFrame(loop);\n})();',`this.test={draw,switchVisualTier,screenTarget,screenEntity,fieldSpawn,openField,spawnBoss,spawn,mergeDamageNumbers,startRam,tickRam,bossRam,frontGuard,turnAim,numberDraws,damageNumber,damageLabel,tickDamageNumbers,drawDamageNumbers,combatPower,buildMirror,mirrorCombat,mirrorFire,mirrorHit,latePressure,waveDamage,healingEfficiency,attackPressure,rivalThink,restoreState,setTier:v=>{visualTier=v;},start,openShop,applyShop,tickAbilities,distance,travel,send,sendState,beginRecovery,retryJoin,promoteHost,finishMigration,roomTest:(p,t,id=0)=>{peer=p;roomToken=t;localId=id;},difficultyScale,teamPower,hostileShot,simulate,update,ui,shoot,collect,wire,breakRift,bossAttack,bossPower,spawnVariant,enemyAttack,damagePlayer,move,hurt,bossWave:n=>{wave=n-1;nextWave();spawnLeft=0;},setBullets:a=>{enemyShots=a;},host:()=>{isHost=true;},setEnemies:a=>{enemies=a;spawnLeft=1;spawnTimer=999;},state:()=>({worldSeed,damageNumbers,damageSerial,netStatus:document.querySelector('#netStatus').textContent,players,wave,between,shots,enemies,profile,enemyShots,bossSpawned,visualTier,fractureLeft,riftBroken,enemyScale,localId,isHost,migrating,hostId,roster:[...seats.values()],connections:links.size})};})();`);vm.runInContext(src,c);return c.test;}
const t=harness();t.start('local');t.openShop();let state=t.state();const [a,b]=state.players;a.pending=0;b.pending=0;const request=(p,action,extra={})=>({action,wave:t.state().wave,revision:p.revision,...extra});t.applyShop(0,request(a,'ready'));assert(t.state().between);t.applyShop(1,request(b,'ready'));assert.equal(t.state().wave,2);assert.equal(t.state().between,false);
t.collect({x:0,y:0,kind:'material',value:30});assert.equal(a.materials,b.materials);assert(a.pending>0);t.openShop();t.ui();assert.equal(t.state().profile.best,2);
for(const id of ids){t.start('solo');const p=t.state().players[0];p.crit=0;p.weapons=[P.weapon(id)];p.angle=0;t.setEnemies([{id:1,x:500,y:360,r:14,hp:1000,speed:0,type:'drone',burn:0,burnDamage:0,hit:0}]);t.shoot(p);for(let i=0;i<20;i++)t.simulate(.016);assert(t.state().enemies[0].hp<1000,id+' damage');}
const host=harness(),handlers={},packets=[];host.host();host.wire({open:true,bufferSize:0,on:(n,fn)=>handlers[n]=fn,send:m=>packets.push(m)},0);handlers.data({t:'ready',v:16,token:'test-token-000000',config:{character:'scout',starter:'smg'}});host.start('online');host.openShop();const guest=host.state().players[1],owner=host.state().players[0];assert.equal(guest.character,'scout');guest.materials=100;const o=guest.shop[0];handlers.data({t:'shop',...{action:'buy',uid:o.uid,wave:1,revision:guest.revision},id:0});assert.equal(guest.weapons.length,2);assert.equal(owner.weapons.length,1);handlers.data({t:'shop',action:'ready',wave:0,revision:guest.revision});assert.equal(guest.ready,false);assert.equal(packets.at(-1).v,16);
console.log('PASS integration: all weapons, shared loot, per-player wallets, two-player readiness, saved records and authoritative guest purchases.');

const bossTest=harness();bossTest.start('solo');bossTest.bossWave(1);bossTest.simulate(.016);assert.equal(bossTest.state().enemies[0].mirror,undefined);
bossTest.start('solo');bossTest.bossWave(2);bossTest.simulate(.016);let boss=bossTest.state().enemies.find(e=>e.type==='boss');assert(boss);assert.equal(bossTest.state().between,false);const target=bossTest.state().players[0],soloHP=boss.hp;boss.dash=30;boss.ramWarning=0;
boss.attack=0;bossTest.bossAttack(boss,target,.01);assert(boss.windup>0);assert.equal(bossTest.state().enemyShots.length,0);bossTest.bossAttack(boss,target,.9);assert.equal(bossTest.state().enemyShots.length,5);
boss.attack=0;bossTest.bossAttack(boss,target,.01);bossTest.bossAttack(boss,target,.9);assert.equal(bossTest.state().enemyShots.length,21);
bossTest.setBullets([{x:target.x-30,y:target.y,vx:1000,vy:0,r:7,life:1,damage:20}]);bossTest.simulate(.03);assert.equal(target.hp,80);
target.dash=target.dashTime;target.invuln=0;bossTest.setBullets([{x:target.x-30,y:target.y,vx:1000,vy:0,r:7,life:1,damage:20}]);bossTest.simulate(.03);assert.equal(target.hp,80);
bossTest.hurt(boss,99999);bossTest.update(3.1);assert(bossTest.state().between);assert.equal(bossTest.state().enemyShots.length,0);assert.equal(target.weapons.length,2);
bossTest.start('local');bossTest.bossWave(2);bossTest.simulate(.016);assert(bossTest.state().enemies.find(e=>e.type==='boss').hp>soloHP);
bossTest.start('solo');bossTest.bossWave(10);bossTest.simulate(.016);assert(bossTest.state().enemies.find(e=>e.type==='boss').hp>soloHP);
console.log('PASS bosses: early Warden waves, telegraphs, aimed/radial shots, projectile damage, dash immunity, guaranteed loot and scaling.');

for(const [id,item] of Object.entries(P.items)){const p=make();const before=JSON.stringify(p);P.applyItem(p,id,2);assert.notEqual(JSON.stringify(p),before,id+' applies');assert(Number.isFinite(p.hp)&&p.hp>0);assert.equal(p.items.length,0);}
const itemP=make();itemP.materials=200;itemP.shop=[{uid:8080,kind:'item',id:'shield',tier:2,cost:40}];assert(act(itemP,'buy',{uid:8080}));assert.equal(itemP.maxShield,30);assert.equal(itemP.items[0].id,'shield');
const adaptive=harness();adaptive.start('solo');adaptive.bossWave(5);const weak=adaptive.bossPower();const strong=adaptive.state().players[0];strong.weapons=ids.slice(0,6).map(id=>P.weapon(id,4));strong.damage*=4;strong.rate/=2;strong.armor=20;strong.maxHp=400;strong.maxShield=100;const powerful=adaptive.bossPower();assert(powerful.health>weak.health);assert(powerful.health<=4&&powerful.attack<=1.3&&powerful.damage<=1.35);adaptive.simulate(.01);const frozen=JSON.stringify(adaptive.state().enemies.find(e=>e.type==='boss').power);strong.damage*=10;assert.equal(JSON.stringify(adaptive.state().enemies.find(e=>e.type==='boss').power),frozen);
const variants=harness();variants.start('solo');for(const type of ['runner','gunner','charger','splitter','sentinel'])variants.spawnVariant(type,100,100);const gunner=variants.state().enemies.find(e=>e.type==='gunner'),victim=variants.state().players[0];gunner.attack=0;variants.enemyAttack(gunner,victim,.01);assert(gunner.windup>0);variants.enemyAttack(gunner,victim,.7);assert(variants.state().enemyShots.length>0);
const charger=variants.state().enemies.find(e=>e.type==='charger');charger.attack=0;variants.enemyAttack(charger,victim,.01);variants.enemyAttack(charger,victim,.7);const ox=charger.x;variants.enemyAttack(charger,victim,.1);assert.notEqual(charger.x,ox);variants.enemyAttack(charger,victim,1);assert.equal(charger.charge,0);
const splitter=variants.state().enemies.find(e=>e.type==='splitter');variants.hurt(splitter,99999);assert.equal(variants.state().enemies.filter(e=>e.type==='swarm').length,3);
P.applyItem(victim,'shield');variants.damagePlayer(victim,10);assert.equal(victim.hp,100);assert.equal(victim.shield,5);P.applyItem(victim,'vampire');P.applyItem(victim,'cryo');victim.hp=50;variants.hurt(gunner,10,0);assert(victim.hp>50);assert(gunner.slow>0);
console.log('PASS v1.4: 20 augments, item purchases, shield absorption, leech, slow, new enemy behaviors, capped team power scaling and fixed encounter scaling.');

const reveal=harness();reveal.start('solo');reveal.bossWave(5);reveal.simulate(.01);const warden=reveal.state().enemies.find(e=>e.type==='boss'),pilot=reveal.state().players[0],hpBefore=pilot.hp;reveal.hurt(warden,999999);assert.equal(reveal.state().fractureLeft,3);assert.equal(reveal.state().riftBroken,true);assert.equal(reveal.state().visualTier,0);assert.equal(reveal.state().between,false);const px=pilot.x;reveal.simulate(1);assert.equal(pilot.x,px);assert.equal(pilot.hp,hpBefore);reveal.update(1.5);assert.equal(reveal.state().visualTier,1);assert.equal(reveal.state().between,false);reveal.update(1.6);assert.equal(reveal.state().fractureLeft,0);assert.equal(reveal.state().between,true);assert.equal(reveal.state().visualTier,1);reveal.breakRift();assert.equal(reveal.state().fractureLeft,0);reveal.start('solo');assert.equal(reveal.state().visualTier,0);assert.equal(reveal.state().riftBroken,false);
const earlyRun=harness();earlyRun.start('solo');earlyRun.breakRift();assert.equal(earlyRun.state().fractureLeft,0);
const mainPage=fs.readFileSync(__dirname+'/index.html','utf8');assert(mainPage.includes('rift-visuals.js?'));assert(mainPage.indexOf('rift-visuals.js?')<mainPage.indexOf('game.js?'));assert(!mainPage.includes('data-edition'));assert(mainPage.includes('rift-3d.js?'));
const riftHost=harness(),riftEvents={},riftPackets=[];riftHost.host();riftHost.wire({open:true,bufferSize:0,on:(n,f)=>riftEvents[n]=f,send:m=>riftPackets.push(JSON.parse(JSON.stringify(m)))},0);riftEvents.data({t:'ready',v:16,token:'test-token-000000',config:{starter:'pistol'}});riftHost.start('online');riftHost.bossWave(5);riftHost.simulate(.01);riftHost.hurt(riftHost.state().enemies.find(e=>e.type==='boss'),999999);assert.equal(riftPackets.at(-1).fractureLeft,3);assert.equal(riftPackets.at(-1).riftBroken,true);riftHost.update(1.5);assert.equal(riftPackets.at(-1).visualTier,1);
console.log('PASS Riftbreak: wave-5 trigger, safe combat freeze, timed graphics swap, delayed shop, one-shot reveal, restart reset, main-page renderer loading and replicated phase.');

// Both milestones happen in the same run, including replicated 3D and restart reset.
riftHost.update(1.6);riftHost.bossWave(10);riftHost.simulate(.01);
const tenBoss=riftHost.state().enemies.find(e=>e.type==='boss');assert(tenBoss);
riftHost.hurt(tenBoss,999999);assert.equal(riftHost.state().visualTier,1);assert.equal(riftHost.state().fractureLeft,3);
assert.equal(riftPackets.at(-1).fractureTarget,2);riftHost.update(1.5);assert.equal(riftHost.state().visualTier,2);
const guest3D=harness(),guestEvents={};guest3D.wire({open:true,bufferSize:0,on:(n,f)=>guestEvents[n]=f,send(){}},0);
guestEvents.data(riftPackets.at(-1));assert.equal(guest3D.state().visualTier,2);guest3D.update(.1);assert.equal(guest3D.state().visualTier,2);
riftHost.update(1.6);assert.equal(riftHost.state().between,true);riftHost.breakRift();assert.equal(riftHost.state().fractureLeft,0);
riftHost.bossWave(15);riftHost.breakRift();assert.equal(riftHost.state().fractureLeft,3);riftHost.update(1.5);assert.equal(riftHost.state().visualTier,3);
riftHost.start('solo');assert.equal(riftHost.state().visualTier,0);riftHost.bossWave(5);riftHost.breakRift();assert.equal(riftHost.state().fractureLeft,3);
console.log('PASS unified game: wave 5 then wave 10, 3D guest state, wave-15 planet transition, both transitions reset on restart.');

// A device without WebGL still displays the 3D mesh through Canvas 2D.
let faceCount=0,imageCount=0;
const softContext={setTransform(){},fillRect(){},beginPath(){},moveTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));},lineTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));},closePath(){},fill(){faceCount++;}};
const softVM={window:{},document:{createElement:()=>({getContext:type=>type==='2d'?softContext:null})}};vm.createContext(softVM);vm.runInContext(fs.readFileSync(__dirname+'/rift-3d.js','utf8'),softVM);
assert(softVM.window.Rift3D.draw({drawImage(){imageCount++;},fillRect(){}},{t:1,reduced:true,players:[{x:400,y:300,angle:1,color:'#68f7c2',hp:100,maxHp:100,weapons:[1]}],enemies:[{x:800,y:200,type:'boss',r:42,hp:100,aim:1}],shots:[],enemyShots:[],drops:[],effects:[],particles:[]}));
assert.equal(softVM.window.Rift3D.backend,'software');assert(faceCount>100);assert.equal(imageCount,1);
console.log('PASS software 3D: no WebGL still renders finite projected geometry and displays the frame.');

const scaled=harness();scaled.start('solo');
assert.equal(scaled.state().enemyScale.health,1);
assert.equal(scaled.difficultyScale(1).health,1);
assert.equal(scaled.difficultyScale(3).health,2);
assert.equal(scaled.difficultyScale(5).health,4);
assert.equal(scaled.difficultyScale(1e200).health,4);
const build=scaled.state().players[0];build.weapons=ids.slice(0,6).map(id=>P.weapon(id,4));build.damage*=3;build.rate/=2;build.maxHp=350;build.armor=10;
assert.equal(scaled.state().enemyScale.health,1); // Purchases/crates affect the NEXT wave.
scaled.bossWave(5);const shared=scaled.state().enemyScale;assert.equal(shared.health,4);
scaled.spawnVariant('gunner',100,100);const scaledGunner=scaled.state().enemies.at(-1);assert.equal(scaledGunner.hp,(52+5*7)*shared.health);
scaled.hostileShot(scaledGunner,0,200,10);assert.equal(scaled.state().enemyShots.at(-1).damage,10*shared.damage);
scaledGunner.attack=0;scaled.enemyAttack(scaledGunner,build,.01);assert.equal(scaledGunner.windup,.65);scaled.enemyAttack(scaledGunner,build,.7);assert.equal(scaledGunner.attack,2/shared.attack);
build.hp=1;build.damage=1;scaled.spawnVariant('swarm',100,100);assert.equal(scaled.state().enemies.at(-1).hp,(16+5*2)*shared.health);assert.equal(scaled.state().enemyScale.health,4);
scaled.state().enemies.forEach(e=>e.hp=0);scaled.simulate(.001);const scaledBoss=scaled.state().enemies.find(e=>e.type==='boss');assert(scaledBoss.hp>=(1000+5*150)*scaledBoss.power.health*shared.health);
const duo=harness();duo.start('local');const beforePower=duo.teamPower();duo.state().players[1].damage*=10;assert(duo.teamPower()>beforePower);const injuredPower=duo.teamPower();duo.state().players[1].hp=0;assert.equal(duo.teamPower(),injuredPower);
const sharedHost=harness(),sharedEvents={},sharedPackets=[];sharedHost.host();sharedHost.wire({open:true,bufferSize:0,on:(n,f)=>sharedEvents[n]=f,send:m=>sharedPackets.push(JSON.parse(JSON.stringify(m)))},0);sharedEvents.data({t:'ready',v:16,token:'test-token-000000',config:{starter:'pistol'}});sharedHost.start('online');
for(const p of sharedHost.state().players){p.weapons=ids.slice(0,6).map(id=>P.weapon(id,4));p.damage*=5;}
sharedHost.bossWave(5);sharedHost.update(.1);assert.equal(sharedPackets.at(-1).enemyScale.health,4);
const sharedGuest=harness(),sharedGuestEvents={};sharedGuest.wire({open:true,bufferSize:0,on:(n,f)=>sharedGuestEvents[n]=f,send(){}},0);sharedGuestEvents.data(sharedPackets.at(-1));assert.equal(sharedGuest.state().enemyScale.health,4);
sharedHost.start('solo');assert.equal(sharedHost.state().enemyScale.health,1);
console.log('PASS shared exponential difficulty: curve, caps, all spawn types, shot damage, attack rate, unchanged warnings, fixed wave snapshot, both players, replication and reset.');

// Exercise real message handlers across eight isolated game instances.
const network={nodes:new Map(),pending:[],pairs:[],flush(){while(this.pending.length)this.pending.shift()();},add(name,api,token){
 this.nodes.set(name,api);const peer={id:name,connect:target=>{
  const a={peer:target,open:false,bufferSize:0,handlers:{},on(n,f){this.handlers[n]=f;}},b={peer:name,open:false,bufferSize:0,handlers:{},on(n,f){this.handlers[n]=f;}};
  a.send=m=>{if(a.open)b.handlers.data?.(JSON.parse(JSON.stringify(m)));};b.send=m=>{if(b.open)a.handlers.data?.(JSON.parse(JSON.stringify(m)));};
  a.close=b.close=()=>{const was=a.open||b.open;a.open=b.open=false;if(was){a.handlers.close?.();b.handlers.close?.();}};
  const other=this.nodes.get(target);if(other){other.wire(b,0);this.pairs.push({name,target,a,b});this.pending.push(()=>{a.open=b.open=true;b.handlers.open?.();a.handlers.open?.();});}return a;
 },destroy(){}};api.roomTest(peer,token,name==='captain'?0:-1);return peer;
},kill(name){this.nodes.delete(name);for(const pair of this.pairs.filter(p=>p.target===name)){pair.a.open=pair.b.open=false;pair.a.handlers.close?.();}}};
const captain=harness();captain.host();const captainPeer=network.add('captain',captain,'captain-token-000000');
const crew=Array.from({length:7},(_,i)=>{const api=harness(),name='crew-'+(i+1),token='crew-token-00000'+(i+1),peer=network.add(name,api,token);api.wire(peer.connect('captain'),0);network.flush();return {api,peer,token};});
assert.equal(captain.state().connections,7);assert.equal(captain.state().roster.length,8);
const ninth=harness(),ninthPeer=network.add('ninth',ninth,'ninth-token-00000');ninth.wire(ninthPeer.connect('captain'),0);network.flush();assert.equal(captain.state().connections,7);
captain.start('online');assert.equal(captain.state().players.length,8);assert.equal(new Set(captain.state().players.map(p=>p.color)).size,8);
for(let i=0;i<7;i++){assert.equal(crew[i].api.state().localId,i+1);assert.equal(crew[i].api.state().players.length,8);}
const ownX=captain.state().players[0].x,lastX=captain.state().players[7].x;
crew[6].api.send({t:'input',id:0,dx:1,dy:0,angle:0,fire:true,dash:0});captain.simulate(.016);
assert.equal(captain.state().players[0].x,ownX);assert(captain.state().players[7].x>lastX);assert(captain.state().shots.some(s=>s.owner===7));
captain.collect({kind:'material',value:10});assert(captain.state().players.every(p=>p.materials===10));captain.openShop();
const buyer=captain.state().players[7];buyer.materials=200;const personalOffer=buyer.shop[0],ownerWeapons=captain.state().players[0].weapons.length;
crew[6].api.send({t:'shop',id:0,action:'buy',uid:personalOffer.uid,wave:1,revision:buyer.revision});assert.equal(buyer.weapons.length,2);assert.equal(captain.state().players[0].weapons.length,ownerWeapons);
buyer.skillPoints=4;for(const stat of ['arc1','arc2','arc3'])crew[6].api.send({t:'shop',action:'skill',stat,wave:1,revision:buyer.revision});assert(buyer.abilities.chain);
for(const p of captain.state().players)p.pending=0;
for(let i=0;i<7;i++){const p=captain.state().players[i];captain.applyShop(i,{action:'ready',wave:1,revision:p.revision});}assert(captain.state().between);
const lastPilot=captain.state().players[7];crew[6].api.send({t:'shop',action:'ready',wave:1,revision:lastPilot.revision});assert.equal(captain.state().wave,2);
// Preserve the full simulation, ship ownership and purchases when the host disappears.
captain.shoot(lastPilot);captain.sendState();const savedBuild=JSON.stringify(captain.state().players[7].weapons),savedWallet=lastPilot.materials,savedShots=captain.state().shots.length;
network.kill('captain');assert(crew[0].api.state().migrating);crew[0].api.retryJoin();assert(crew[0].api.state().isHost);assert.equal(crew[0].api.state().localId,1);
for(const member of crew.slice(1)){member.api.retryJoin();network.flush();}
const successor=crew[0].api;assert.equal(successor.state().connections,6);assert.equal(successor.state().shots.length,savedShots);assert.equal(JSON.stringify(successor.state().players[7].weapons),savedBuild);assert.equal(successor.state().players[7].materials,savedWallet);assert(successor.state().players[7].abilities.chain);assert(successor.state().players[7].skills.includes('arc3'));successor.finishMigration();assert(!successor.state().migrating);
for(const member of crew.slice(1)){assert.equal(member.api.state().hostId,1);assert(!member.api.state().migrating);}
const returning=harness(),returnPeer=network.add('returning-captain',returning,'captain-token-000000');returning.wire(returnPeer.connect('crew-1'),0);network.flush();
assert.equal(returning.state().localId,0);assert.equal(successor.state().connections,7);assert(successor.state().players[0].connected);assert.equal(successor.state().players.length,8);
const restoredX=successor.state().players[0].x;returning.send({t:'input',dx:1,dy:0,angle:0,fire:false,dash:0});successor.simulate(.01);assert(successor.state().players[0].x>restoredX);
// A stranger cannot replace a reserved ship after the run starts.
const stranger=harness(),strangerPeer=network.add('stranger',stranger,'stranger-token-000');stranger.wire(strangerPeer.connect('crew-1'),0);network.flush();assert.equal(successor.state().connections,7);
console.log('PASS eight-player network: capacity, distinct ships, input/shop ownership, shared loot, all-player readiness, full checkpoint migration, surviving host control, original-host rejoin and reserved-seat protection.');

const treePilot=make();P.grant(treePilot,0,100);assert.equal(treePilot.skillPoints,treePilot.level-1);assert.equal(P.skills.nodes.length,26);
assert.equal(act(treePilot,'skill',{stat:'arc3'}),false);
for(const id of ['arc1','arc2','arc3'])assert(act(treePilot,'skill',{stat:id}));assert(treePilot.abilities.chain);assert.equal(treePilot.skillPoints,0);assert.equal(act(treePilot,'skill',{stat:'arc3'}),false);assert.equal(act(treePilot,'skill',{stat:'arc4'}),false);
assert.deepEqual(make().skills,['core']);assert.equal(make().skillPoints,0);
P.syncSerial([{weapons:[{uid:999999}],shop:[]}]);assert(P.weapon('pistol').uid>999999);
const abilities=harness();abilities.start('solo');const caster=abilities.state().players[0];
caster.abilities={chain:true};abilities.spawnVariant('tank',caster.x+80,caster.y);abilities.spawnVariant('tank',caster.x+110,caster.y);const [firstTarget,secondTarget]=abilities.state().enemies,beforeChain=secondTarget.hp;abilities.hurt(firstTarget,20,0);assert.equal(secondTarget.hp,beforeChain-7);
caster.abilities={repair:true,missiles:true};caster.hp=50;abilities.tickAbilities(caster,.1);assert.equal(caster.hp,58);assert(abilities.state().shots.some(s=>s.owner===0&&s.blast===80));
caster.abilities={blades:true};caster.orbitTime=0;abilities.spawnVariant('tank',caster.x+58,caster.y);const orbitTarget=abilities.state().enemies.at(-1),beforeOrbit=orbitTarget.hp;abilities.tickAbilities(caster,.001);assert(orbitTarget.hp<beforeOrbit);
caster.abilities={nova:true};caster.dash=0;abilities.spawnVariant('tank',caster.x+110,caster.y);const dashTarget=abilities.state().enemies.at(-1),beforeDash=dashTarget.hp;abilities.move(caster,{dx:1,dy:0,angle:0,fire:false,dash:true},.001);assert(dashTarget.hp<beforeDash);
const S=require('./sphere-world.js');let journey={x:400,y:360,angle:0,vx:100,vy:0};for(let i=0;i<256;i++)journey=S.step(journey,journey.vx,journey.vy,.1);assert(S.delta(journey,{x:400,y:360}).distance<1e-4);
let polar={x:400,y:360,vx:0,vy:-100};for(let i=0;i<256;i++)polar=S.step(polar,polar.vx,polar.vy,.1);assert(S.delta(polar,{x:400,y:360}).distance<1e-4);assert(Math.abs(S.delta({x:1279,y:360},{x:1,y:360}).distance-4)<1e-5);
const planet=harness();planet.start('solo');planet.bossWave(15);planet.simulate(.01);planet.hurt(planet.state().enemies.find(e=>e.type==='boss'),1e9);planet.update(1.5);assert.equal(planet.state().visualTier,3);planet.update(1.6);planet.bossWave(16);
const walker=planet.state().players[0];walker.x=1279;walker.y=360;planet.move(walker,{dx:1,dy:0,angle:0,fire:false,dash:false},.02);assert(walker.x<15);assert(Math.abs(walker.y-360)<1e-5);
walker.x=1270;walker.y=360;walker.weapons=[P.weapon('pistol')];walker.angle=0;planet.setEnemies([{id:900,x:30,y:360,r:14,hp:1000,speed:0,type:'drone',burn:0,burnDamage:0,hit:0}]);planet.shoot(walker);planet.simulate(.1);assert(planet.state().enemies[0].hp<1000);
console.log('PASS skill tree and planet: point economy, connected paths, all five abilities, UID recovery, seam/pole circumnavigation, wave-15 transition and cross-seam projectile hits.');

softVM.window.RRSphere=S;const planetFrame={drawImage(){imageCount++;},fillRect(){},save(){},restore(){},beginPath(){},arc(){},stroke(){},fillText(){}};
assert(softVM.window.Rift3D.draw(planetFrame,{sphere:true,focus:{x:640,y:360},t:1,reduced:true,players:[{id:0,x:640,y:360,angle:0,color:'#68f7c2',hp:100,maxHp:100,weapons:[1]}],enemies:[],shots:[],enemyShots:[],drops:[],effects:[],particles:[]}));
console.log('PASS planet renderer: software 3D projects a finite globe mesh and ship; skill unlocks survive host migration.');
{
// Continuous screen-relative controls across both poles and repeated orbits.
const steering=harness();steering.start('solo');steering.bossWave(15);steering.breakRift();steering.update(1.5);steering.update(1.6);
const pilot=steering.state().players[0];pilot.x=640;pilot.y=5;pilot.cameraAngle=0;
for(let n=0;n<900;n++){
 steering.move(pilot,{dx:0,dy:-1,angle:0,fire:false,dash:false},.02);
 const forward=S.step(pilot,Math.sin(pilot.cameraAngle)*10,-Math.cos(pilot.cameraAngle)*10,1);
 const visible=S.project(forward,pilot);assert(visible.y<360);assert(Math.abs(visible.x-640)<1e-6);
 const mapped=S.unproject(visible.x,visible.y,pilot);assert(S.delta(mapped,forward).distance<.001);
}
const beams=harness();beams.start('solo');beams.bossWave(15);const bp=beams.state().players[0];bp.x=400;bp.y=300;bp.invuln=0;
beams.spawnVariant('lancer',100,300);const lancer=beams.state().enemies.at(-1);lancer.attack=0;const beforeBeam=bp.hp;
beams.enemyAttack(lancer,bp,.01);assert.equal(lancer.windup,1.15);beams.enemyAttack(lancer,bp,.5);assert.equal(bp.hp,beforeBeam);beams.enemyAttack(lancer,bp,.7);assert(lancer.beamLeft>0);assert.equal(beams.state().enemyShots.length,0);
beams.enemyAttack(lancer,bp,.1);assert(bp.hp<beforeBeam);bp.y=400;const safeHP=bp.hp;beams.enemyAttack(lancer,bp,.1);assert.equal(bp.hp,safeHP);
console.log('PASS v1.10: stable screen controls across poles, rotated picking, beam warnings harmless and active beam dodgeable.');

}

{
 const padVM={window:{},navigator:{getGamepads:()=>devices}};let devices=[];vm.createContext(padVM);vm.runInContext(fs.readFileSync(__dirname+'/gamepad.js','utf8'),padVM);
 const padAPI=padVM.window.RRPad,controller={index:0,connected:true,mapping:'standard',axes:[.1,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};devices=[controller];let pauses=0,nav=[];
 const context={playing:true,onActive(){},onPause(){pauses++;},onNavigate:a=>nav.push(a)};
 padAPI.frame(context,0);assert.equal(padAPI.read().dx,0);controller.axes=[1,1,1,0];controller.buttons[4].pressed=true;padAPI.frame(context,20);const input=padAPI.read();assert(Math.abs(Math.hypot(input.dx,input.dy)-1)<1e-8);assert(input.fire&&input.dash);assert(!padAPI.read().dash);
 padAPI.frame(context,40);assert(!padAPI.read().dash);controller.buttons[9].pressed=true;padAPI.frame(context,60);padAPI.frame(context,80);assert.equal(pauses,1);
 assert.equal(padAPI.read(false,true),null);assert(padAPI.read(true,true));devices.push({...controller,index:1});padAPI.frame(context,100);assert(padAPI.read(false,true));assert(padAPI.read(true,true));
 devices=[controller];context.playing=false;controller.buttons[0].pressed=true;padAPI.frame(context,120);assert(nav.includes('confirm'));assert(!padAPI.read().dash);devices=[];padAPI.frame(context,140);assert.equal(padAPI.read(),null);
 console.log('PASS v1.11 controllers: radial deadzone, analog normalization, firing, dash edges, pause edges, local assignment, menu confirm and disconnect.');
}

{
 const client=harness(),events={};client.wire({open:true,bufferSize:0,on:(n,fn)=>events[n]=fn,send(){}},0);
 events.data({t:'reject',reason:'Run in progress. Only returning players can rejoin.'});events.close();
 assert.equal(client.state().netStatus,'Run in progress. Only returning players can rejoin.');
 console.log('PASS connection rejection: closing rejected channel preserves the specific host response.');
}

const rivalTest=harness();rivalTest.start('solo');rivalTest.bossWave(10);rivalTest.simulate(.01);
let rival=rivalTest.state().enemies.find(e=>e.type==='boss'),rp=rivalTest.state().players[0];
assert(rival.rival);assert.equal(rival.brain.target,null);assert.equal(rivalTest.state().enemyShots.length,0);
for(let n=0;n<25;n++)rivalTest.rivalThink(rival,.36);
assert.equal(rival.tactic,'PRESSURE');assert(rp.rivalHabits.samples>=24);
const remembered=rp.rivalHabits.samples;rival.windup=1;rival.speed=0;
for(let n=0;n<30;n++){const a=n*.18;rp.x=rival.x+Math.cos(a)*280;rp.y=rival.y+Math.sin(a)*280;rivalTest.rivalThink(rival,.36);}
assert(Math.abs(rp.rivalHabits.orbit)>.35);assert.equal(rival.tactic,'INTERCEPT');
const locked=JSON.stringify(rival.brain.target);rp.x+=100;rivalTest.rivalThink(rival,.01);assert.equal(JSON.stringify(rival.brain.target),locked);
rival.windup=0;rival.attack=0;for(let n=0;n<40;n++)rivalTest.bossAttack(rival,rp,.05);assert(rivalTest.state().enemyShots.length>0);
assert.doesNotThrow(()=>JSON.parse(JSON.stringify(rival.brain)));
rivalTest.setEnemies([]);rivalTest.bossWave(15);rivalTest.simulate(.01);assert(rp.rivalHabits.samples>remembered);
rivalTest.start('solo');assert.equal(rivalTest.state().players[0].rivalHabits,undefined);
console.log('PASS adaptive rival: wave 10, learned camping/circling, delayed decisions, tracking aim, shots, serializable memory, later-boss retention and new-run reset.');

const sphereRival=harness();sphereRival.start('solo');sphereRival.setTier(3);sphereRival.bossWave(20);sphereRival.simulate(.01);
const sr=sphereRival.state().enemies.find(e=>e.rival),sp=sphereRival.state().players[0];sr.x=1275;sp.x=5;
for(let n=0;n<100;n++){sphereRival.travel(sp,150,80,.05);sphereRival.rivalThink(sr,.05);assert(Number.isFinite(sr.x)&&Number.isFinite(sr.y));}
const restored=harness();restored.start('solo');restored.restoreState(JSON.parse(JSON.stringify(sphereRival.state())));
assert.equal(restored.state().players[0].rivalHabits.samples,sp.rivalHabits.samples);assert.equal(restored.state().enemies[0].brain.clock,sr.brain.clock);
console.log('PASS rival sphere travel and snapshot restoration.');

{
// Mirror loadouts are deep copies and outscale the combined team on paper.
const mirror=harness();mirror.start('local');const [m0,m1]=mirror.state().players;
m0.weapons=[P.weapon('laser',4),P.weapon('rocket',3)];m0.damage=110;m0.armor=12;m0.abilities.chain=true;m0.abilities.blades=true;
m1.speed=400;m1.dashTime=.8;m1.abilities.nova=true;m1.abilities.repair=true;m1.abilities.missiles=true;
const combined=mirror.combatPower(m0).dps+mirror.combatPower(m1).dps;
mirror.bossWave(10);mirror.simulate(.01);const copy=mirror.state().enemies.find(e=>e.mirror);
assert.equal(copy.sourceId,0);assert.equal(copy.weapons[0].tier,4);assert.equal(copy.speed,400);assert.equal(copy.dashTime,30);assert(Object.values(copy.abilities).every(Boolean));assert(copy.nominalDps>combined);assert((copy.hp+copy.shield)*(1+copy.armor*.08)>copy.teamEhp);
copy.weapons[0].tier=1;assert.equal(m0.weapons[0].tier,4);copy.weapons[0].tier=4;
// Beam aim locks throughout the visible, harmless warning.
copy.attack=0;copy.weapons=[{...P.weapon('laser'),cool:0,pending:0}];copy.abilities={};copy.speed=0;
mirror.mirrorCombat(copy,.36);mirror.mirrorCombat(copy,.36);const hpBefore=m0.hp,aimBefore=copy.weapons[0].shotAim;assert(copy.weapons[0].pending>0);
m0.x+=100;mirror.mirrorCombat(copy,.1);assert.notEqual(copy.weapons[0].shotAim,aimBefore);assert.equal(m0.hp,hpBefore);
// All ten cloned weapons have hostile damage paths (including melee and beams).
for(const id of ids){const g=harness();g.start('solo');g.bossWave(10);g.simulate(.01);const e=g.state().enemies.find(e=>e.mirror),p=g.state().players[0];e.x=300;e.y=300;e.speed=0;e.crit=0;e.abilities={};e.weapons.forEach(w=>w.cool=999);p.x=360;p.y=300;p.hp=p.maxHp=100000;p.invuln=0;const old=p.hp;
g.mirrorFire(e,{id,tier:1},0);for(let n=0;n<20;n++)g.simulate(.016);assert(p.hp<old,id+' mirror damages player');if(id==='flame')assert(p.enemyBurn>0);}
// Armor penetration and recovery pressure ramp; early waves retain full healing.
const pressure=harness();pressure.start('solo');assert.equal(pressure.healingEfficiency(),1);pressure.bossWave(10);const d10=pressure.waveDamage(),h10=pressure.latePressure(),heal10=pressure.healingEfficiency();pressure.bossWave(20);assert(pressure.waveDamage()>d10*2);assert(pressure.latePressure()>h10*3);assert(pressure.healingEfficiency()<heal10);assert(pressure.attackPressure()<=3.5);
// Larger surface preserves screen-relative controls but needs twice the travel.
assert(Math.abs(S.R*2*Math.PI-2560)<1e-6);const near=S.step({x:640,y:360},20,0);assert(S.project(near,{x:640,y:360}).x-640<23);
const mirrorRestore=harness();mirrorRestore.start('solo');mirrorRestore.restoreState(JSON.parse(JSON.stringify(mirror.state())));assert.equal(mirrorRestore.state().enemies[0].sourceId,0);assert.equal(mirrorRestore.state().enemies[0].weapons[0].pending,copy.weapons[0].pending);
assert(softVM.window.Rift3D.draw(planetFrame,{sphere:true,focus:{x:640,y:360},t:1,reduced:true,players:[],enemies:[{...copy,x:640,y:360}],shots:[],enemyShots:[],drops:[],effects:[],particles:[]}));
console.log('PASS v1.13: strongest build, team ability union, combined power, isolated inventory, tracking laser warnings, all hostile weapons, late pressure, larger sphere and mirror restore/render.');

}

{
const g=harness();g.start('local');g.bossWave(10);g.simulate(.01);const e=g.state().enemies.find(e=>e.mirror),[p,q]=g.state().players;e.abilities={chain:true,repair:true,missiles:true,blades:true,nova:true};e.speed=0;e.attack=0;e.weapons.forEach(s=>s.cool=999);p.x=e.x+70;p.y=e.y;q.x=p.x+30;q.y=p.y;p.invuln=q.invuln=0;
const qhp=q.hp;g.mirrorHit(e,p,10);assert(q.hp<qhp,'chain reaches a nearby teammate');
e.hp-=100;e.healBudget=8;e.regen=100;g.mirrorCombat(e,.4);g.mirrorCombat(e,.4);assert.equal(e.healBudget,0);assert(g.state().enemyShots.some(s=>s.blast>0),'missile ability');
e.brain.target={id:p.id,x:p.x,y:p.y,vx:0,vy:0,habits:{samples:20,speed:150,range:200,orbit:0}};e.brain.scan=1;e.dash=0;g.startRam(e,e.aim);const before={x:e.x,y:e.y};g.mirrorCombat(e,.01);assert(g.distance(before,e)>8,'continuous ram displacement');assert(e.evade>0);assert(e.novaWarning>0);const ehp=e.hp;g.hurt(e,500);assert.equal(e.hp,ehp,'brief dash immunity');
console.log('PASS mirror abilities: chain, missile, finite healing, dash movement, nova warning and dash immunity.');
}

{
const g=harness();g.start('solo');g.spawnVariant('drone',100,100);g.bossWave(1);g.simulate(.01);assert(!g.state().bossSpawned,'regular enemies must be cleared');assert(!g.state().between);
g.hurt(g.state().enemies[0],99999);g.simulate(.01);const boss=g.state().enemies.find(e=>e.type==='boss');assert(boss&&!boss.mirror);assert(!g.state().between);g.simulate(.01);assert.equal(g.state().enemies.filter(e=>e.type==='boss').length,1);g.hurt(boss,999999);g.simulate(.01);assert(g.state().between,'shop opens only after boss dies');
for(let wave=2;wave<=8;wave++){g.start('solo');g.bossWave(wave);g.simulate(.01);const b=g.state().enemies.find(e=>e.type==='boss');assert(b,'boss on wave '+wave);assert.equal(!!b.mirror,wave>=3);if(wave>=3){assert(b.brain);assert(b.weapons.length>0);}g.simulate(.01);assert.equal(g.state().enemies.filter(e=>e.type==='boss').length,1);}
const n=harness();n.start('solo');const p=n.state().players[0];p.shield=10;p.armor=10;n.damagePlayer(p,28);assert.equal(p.hp,90);assert.deepEqual(Array.from(n.state().damageNumbers,x=>[x.kind,x.amount]),[['shield',10],['hurt',10]]);
const enemy={id:900,x:400,y:300,hp:100,maxHp:100,type:'drone',mirror:true,shield:8,armor:5};n.hurt(enemy,36);assert.equal(enemy.hp,80);assert(n.state().damageNumbers.some(x=>x.kind==='hit'&&x.amount===20));n.hurt(enemy,14);assert(n.state().damageNumbers.some(x=>x.kind==='hit'&&x.amount===30));
const tiny={id:901,x:500,y:300,hp:5,type:'drone'};n.hurt(tiny,99999);assert.equal(n.state().damageNumbers.find(x=>x.key==='enemy:901:hit').amount,5,'no overkill inflation');
const before=n.state().damageNumbers.length;enemy.evade=.1;n.hurt(enemy,100);assert.equal(n.state().damageNumbers.length,before,'no number on immune hit');
n.drawDamageNumbers();assert(n.numberDraws.length>0);assert(n.numberDraws.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));assert(n.numberDraws.some(x=>x.label==='SH 10'));
const copy=harness();copy.start('solo');copy.restoreState(JSON.parse(JSON.stringify(n.state())));assert.equal(copy.state().damageNumbers.length,n.state().damageNumbers.length);copy.setTier(3);copy.drawDamageNumbers();assert(copy.numberDraws.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));copy.tickDamageNumbers(1);assert.equal(copy.state().damageNumbers.length,0);
for(let id=0;id<100;id++)n.damageNumber({id,x:1,y:1},1,'hit','enemy');assert.equal(n.state().damageNumbers.length,64);n.start('solo');assert.equal(n.state().damageNumbers.length,0);
console.log('PASS v1.14: end-of-wave boss gate, mirror from wave 3, single spawn, post-mitigation damage, tick grouping, overkill, immunity, text rendering, sphere projection, replication, expiry and cap.');
}

{
const g=harness();g.start('solo');const p=g.state().players[0];p.x=200;p.y=300;p.angle=0;p.armor=0;p.crit=0;
g.spawnVariant('tank',350,300);const t=g.state().enemies[0];t.hp=t.maxHp=1000;const old=t.hp;
assert(g.startRam(p,0));assert.equal(p.dash,30);assert(!g.startRam(p,0));g.move(p,{dx:-1,dy:0,angle:0,fire:false,dash:false},.1);assert(Math.abs(p.x-290)<.01,'continuous forward movement ignores reverse input');
g.move(p,{dx:0,dy:0,angle:0,fire:false,dash:false},.1);assert(t.hp<old,'swept ram hit');const dealt=t.hp;g.tickRam(p,.01);assert.equal(t.hp,dealt,'one ram hit per target');
const hp=p.hp;g.damagePlayer(p,20,{x:p.x+100,y:p.y});assert(Math.abs(hp-p.hp-6)<.001,'front shield reduces 70%');const rear=p.hp;g.damagePlayer(p,20,{x:p.x-100,y:p.y});assert.equal(rear-p.hp,20,'rear vulnerable after initial frames');
g.tickRam(p,1);assert.equal(p.ramLeft,0);assert.equal(g.frontGuard(p,{x:p.x+100,y:p.y}),1);assert(!g.startRam(p,0));P.applyItem(p,'thruster',4);assert.equal(p.dashTime,30);
const restored=harness();restored.start('solo');restored.restoreState(JSON.parse(JSON.stringify(g.state())));assert.equal(restored.state().players[0].dash,p.dash);
const planet=g;planet.setTier(3);p.x=1270;p.y=360;p.dash=0;assert(planet.startRam(p,0));const origin={x:p.x,y:p.y};planet.tickRam(p,.2);assert(Math.abs(planet.distance(origin,p)-180)<.01);assert(Number.isFinite(p.ramAngle));
// Staggered lasers used to pin both movement and aim permanently.
const ai=harness();ai.start('solo');ai.bossWave(3);ai.simulate(.01);const e=ai.state().enemies.find(x=>x.mirror),pilot=ai.state().players[0];e.x=600;e.y=300;e.dash=30;e.attack=0;e.weapons=[{...P.weapon('laser'),pending:.8,shotAim:0,cool:.9},{...P.weapon('spear'),pending:.3,shotAim:0,cool:.4}];pilot.x=600;pilot.y=550;e.brain.seen={};let moving=0,previous={x:e.x,y:e.y};
for(let n=0;n<80;n++){ai.mirrorCombat(e,.025);moving+=ai.distance(previous,e);previous={x:e.x,y:e.y};}assert(moving>30,'keeps moving with overlapping windups');assert(Math.abs(e.aim)>.5,'turns toward target');assert(e.weapons.some(w=>Math.abs(w.shotAim)>.5),'warnings track updated aim');
e.x=e.r;e.y=360;e.brain.target={id:0,x:0,y:360,vx:0,vy:0,habits:{samples:30,speed:120,range:120,orbit:0}};e.brain.scan=1;ai.rivalThink(e,.1);assert(e.x>e.r,'escapes wall');
e.dash=0;e.ramLeft=0;assert(ai.startRam(e,0));assert.equal(e.dash,30);const ehp=e.hp;ai.hurt(e,20);assert.equal(e.hp,ehp);ai.bossRam(e,null,.2);ai.hurt(e,20,undefined,false,{x:e.x-50,y:e.y});assert(e.hp<ehp,'boss invulnerability ends before ram ends');
console.log('PASS v1.15: forward ram, collision, front/rear shield, fixed cooldown, sphere travel, restoration, overlapping-windup movement/aim, wall recovery and partial boss immunity.');
}

{
const Net=require('./network-visuals.js'),sphere=require('./sphere-world.js');
const visual=Net.create(sphere),state=(x,other={})=>({wave:1,visualTier:0,running:true,players:[{id:0,x,y:360,angle:0,speed:250,hp:100},{id:1,x:x+50,y:360,angle:0}],enemies:[{id:1,x:x+100,y:100,aim:0}],shots:[{netId:'a',x:x+200,y:100}],enemyShots:[],...other});
for(let t=0;t<=200;t+=50)visual.receive(state(t),t);
const steps=[];for(let t=200;t<=250;t+=10)steps.push(visual.render(state(200),t,0).players[1].x);
assert.deepEqual(steps,[150,160,170,180,190,200],'remote moves smoothly between packets at rendering rate');
const source=state(200);const before=JSON.stringify(source);visual.render(source,225,0);assert.equal(JSON.stringify(source),before,'drawing never mutates combat truth');
assert.equal(visual.render(source,225,0).shots[0].x,325,'stable projectile IDs interpolate');
visual.receive(state(200,{shots:[{netId:'b',x:999,y:100}]}),250);assert.equal(visual.render(state(200,{shots:[{netId:'b',x:999,y:100}]}),275,0).shots[0].x,999,'new projectile never morphs from a removed one');
visual.predict(source.players[0],{dx:1,dy:0,angle:1},.016,260,true);const response=visual.render(source,260,0).players[0];assert(response.x>200,'local movement responds before another packet');assert.equal(response.angle,1);assert.equal(source.players[0].x,200);
visual.predict(source.players[0],{dx:1,dy:0,angle:1},.016,600,true);assert.equal(visual.render(source,600,0).players[0].x,200,'stale connection stops prediction');
visual.receive(state(800,{wave:2}),650);assert.equal(visual.render(state(800,{wave:2}),650,0).players[0].x,800,'wave transitions clear stale poses');
const globe=Net.create(sphere),a={id:0,x:1270,y:360,angle:0,cameraAngle:0},b={...a,...sphere.step(a,40,0)};
globe.receive(state(0,{visualTier:3,players:[a]}),0);globe.receive(state(0,{visualTier:3,players:[b]}),100);const midpoint=globe.render(state(0,{visualTier:3,players:[b]}),150,0).players[0];assert(Math.abs(sphere.delta(a,midpoint).distance-20)<.001,'sphere interpolation crosses seam on the short path');
const n=harness();n.start('local');const target={id:987,x:300,y:300,hp:1000,type:'drone'};n.hurt(target,10,0);n.hurt(target,20,1);assert.deepEqual(Array.from(n.state().damageNumbers,x=>x.owner),[0,1],'teammate hits retain attribution');
const guest=harness();guest.start('solo');const shared=JSON.parse(JSON.stringify(n.state().damageNumbers));guest.mergeDamageNumbers(shared);assert.equal(guest.state().damageNumbers.length,2);guest.tickDamageNumbers(.3);const life=guest.state().damageNumbers[0].life;shared[0].amount=15;guest.mergeDamageNumbers(shared);assert.equal(guest.state().damageNumbers[0].amount,15);assert.equal(guest.state().damageNumbers[0].life,life,'packets never restart a floating label');guest.tickDamageNumbers(1);guest.mergeDamageNumbers(shared);assert.equal(guest.state().damageNumbers.length,0,'late packets cannot resurrect old numbers');
const labels=harness();labels.restoreState(JSON.parse(JSON.stringify(n.state())));labels.drawDamageNumbers();assert(labels.numberDraws.some(x=>x.label==='10'));assert(labels.numberDraws.some(x=>x.label==='20'));assert.equal(labels.numberDraws[0].color,'#68f7c2');assert.equal(labels.numberDraws[1].color,'#54bfff');assert(!labels.numberDraws.some(n=>/P[1-8]/.test(n.label)));assert.notEqual(labels.numberDraws[0].y,labels.numberDraws[1].y,'simultaneous teammate labels do not overlap');
console.log('PASS v1.16: render-rate interpolation, projectile identity, immediate local presentation, stale stop, wave reset, sphere seam, shared per-player damage and deduplicated fading.');
}

{
const g=harness();g.start('solo');g.setTier(1);g.bossWave(7);g.simulate(.01);const b=g.state().enemies.find(e=>e.type==='boss');g.hurt(b,1e9);assert.equal(g.state().fractureLeft,3);g.update(1.5);assert.equal(g.state().visualTier,1.5);g.update(1.6);assert(g.state().between,'shop waits for wall break');
const p=g.state().players[0];p.x=1270;p.y=710;g.move(p,{dx:1,dy:1,angle:0,fire:false},1);assert(p.x>1280&&p.y>720,'free travel beyond old walls');p.x=-5000;p.y=8000;p.dash=0;g.startRam(p,Math.PI);g.tickRam(p,.2);assert(p.x<-5100,'ram is unbounded');
const target=g.screenTarget(740,360);assert(Math.abs(target.x-p.x-100)<1e-6);assert.equal(target.y,p.y,'mouse aim follows world camera');
const drawn=g.screenEntity({x:p.x+20,y:p.y+10,bx:p.x+100,by:p.y},p);assert.equal(drawn.x,660);assert.equal(drawn.y,370);assert.equal(drawn.bx,740,'beam endpoint translated with origin');
g.spawn();assert(g.state().enemies.some(e=>Math.abs(g.distance(e,p)-760)<.01),'spawns follow far-away player');g.spawnBoss();assert(Math.abs(g.distance(g.state().enemies.at(-1),p)-760)<.01,'boss follows exploration');
const dead={id:10000,x:-5200,y:8050,hp:1,type:'drone'};g.hurt(dead,2,0);const hit=g.state().damageNumbers.find(n=>n.key==='enemy:10000:hit:p0');assert.equal(hit.x,-5200);assert.equal(hit.owner,0);
const clone=harness();clone.restoreState(JSON.parse(JSON.stringify(g.state())));assert.equal(clone.state().visualTier,1.5);assert.equal(clone.state().worldSeed,g.state().worldSeed);assert.equal(clone.state().players[0].x,p.x);
g.switchVisualTier(2);assert(g.openField(),'following camera continues in 3D');g.switchVisualTier(3);assert.equal(p.x,640);assert.equal(p.y,360,'world folds safely into sphere');g.start('solo');assert.equal(g.state().visualTier,0);
const F=require('./rift-frontier.js');assert.deepEqual(F.chunk(-12,64,77),F.chunk(-12,64,77));assert.notDeepEqual(F.chunk(-12,64,77),F.chunk(-12,64,78));assert.equal(F.chunk(-12,64,77).length,18);
const net=require('./network-visuals.js').create(S),state={wave:8,visualTier:1.5,running:true,players:[{id:0,x:-5000,y:8000,speed:250,hp:100,angle:0}],enemies:[],shots:[],enemyShots:[]};net.receive(state,0);net.predict(state.players[0],{dx:-1,dy:0,angle:Math.PI},.02,20,true);assert(net.render(state,20,0).players[0].x<-5000,'guest prediction has no old arena clamp');
assert(softVM.window.Rift3D.draw(planetFrame,{frontier:true,fieldCamera:{x:-5000,y:8000},worldSeed:77,sphere:false,t:1,reduced:true,players:[],enemies:[],shots:[],enemyShots:[],drops:[],effects:[],particles:[]}));
console.log('PASS v1.17: wave-7 wall break, unbounded movement and ram, mouse/world camera, beam transforms, roaming spawns, seed restoration, 3D continuity, sphere folding and procedural determinism.');
}
