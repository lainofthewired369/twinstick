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

function harness(){const elements={},events={},stored={};const el=()=>({textContent:'',classList:{toggle(){}},style:{},addEventListener(){},querySelector:()=>el(),getContext:()=>({}),hasPointerCapture:()=>false,replaceChildren(){},append(){},dataset:{}});const c={crypto:require('node:crypto').webcrypto,sessionStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},window:{RRProgress:P,RRSphere:require('./sphere-world.js')},document:{querySelector:s=>elements[s]??=el(),querySelectorAll:()=>[],addEventListener(){},createElement:el},localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},performance:{now:()=>1000},requestAnimationFrame(){},addEventListener(){},setTimeout:()=>0,clearTimeout(){}};vm.createContext(c);let src=fs.readFileSync(__dirname+'/game.js','utf8');src=src.replace('requestAnimationFrame(loop);\n})();',`this.test={start,openShop,applyShop,tickAbilities,distance,travel,send,sendState,beginRecovery,retryJoin,promoteHost,finishMigration,roomTest:(p,t,id=0)=>{peer=p;roomToken=t;localId=id;},difficultyScale,teamPower,hostileShot,simulate,update,ui,shoot,collect,wire,breakRift,bossAttack,bossPower,spawnVariant,enemyAttack,damagePlayer,move,hurt,bossWave:n=>{wave=n-1;nextWave();spawnLeft=0;},setBullets:a=>{enemyShots=a;},host:()=>{isHost=true;},setEnemies:a=>{enemies=a;spawnLeft=1;spawnTimer=999;},state:()=>({players,wave,between,shots,enemies,profile,enemyShots,bossSpawned,visualTier,fractureLeft,riftBroken,enemyScale,localId,isHost,migrating,hostId,roster:[...seats.values()],connections:links.size})};})();`);vm.runInContext(src,c);return c.test;}
const t=harness();t.start('local');t.openShop();let state=t.state();const [a,b]=state.players;a.pending=0;b.pending=0;const request=(p,action,extra={})=>({action,wave:t.state().wave,revision:p.revision,...extra});t.applyShop(0,request(a,'ready'));assert(t.state().between);t.applyShop(1,request(b,'ready'));assert.equal(t.state().wave,2);assert.equal(t.state().between,false);
t.collect({x:0,y:0,kind:'material',value:30});assert.equal(a.materials,b.materials);assert(a.pending>0);t.openShop();t.ui();assert.equal(t.state().profile.best,2);
for(const id of ids){t.start('solo');const p=t.state().players[0];p.crit=0;p.weapons=[P.weapon(id)];p.angle=0;t.setEnemies([{id:1,x:500,y:360,r:14,hp:1000,speed:0,type:'drone',burn:0,burnDamage:0,hit:0}]);t.shoot(p);for(let i=0;i<20;i++)t.simulate(.016);assert(t.state().enemies[0].hp<1000,id+' damage');}
const host=harness(),handlers={},packets=[];host.host();host.wire({open:true,bufferSize:0,on:(n,fn)=>handlers[n]=fn,send:m=>packets.push(m)},0);handlers.data({t:'ready',v:12,token:'test-token-000000',config:{character:'scout',starter:'smg'}});host.start('online');host.openShop();const guest=host.state().players[1],owner=host.state().players[0];assert.equal(guest.character,'scout');guest.materials=100;const o=guest.shop[0];handlers.data({t:'shop',...{action:'buy',uid:o.uid,wave:1,revision:guest.revision},id:0});assert.equal(guest.weapons.length,2);assert.equal(owner.weapons.length,1);handlers.data({t:'shop',action:'ready',wave:0,revision:guest.revision});assert.equal(guest.ready,false);assert.equal(packets.at(-1).v,12);
console.log('PASS integration: all weapons, shared loot, per-player wallets, two-player readiness, saved records and authoritative guest purchases.');

const bossTest=harness();bossTest.start('solo');bossTest.bossWave(4);bossTest.simulate(.016);assert.equal(bossTest.state().enemies.length,0);
bossTest.bossWave(5);bossTest.simulate(.016);let boss=bossTest.state().enemies.find(e=>e.type==='boss');assert(boss);assert.equal(bossTest.state().between,false);const target=bossTest.state().players[0],soloHP=boss.hp;
boss.attack=0;bossTest.bossAttack(boss,target,.01);assert(boss.windup>0);assert.equal(bossTest.state().enemyShots.length,0);bossTest.bossAttack(boss,target,.9);assert.equal(bossTest.state().enemyShots.length,5);
boss.attack=0;bossTest.bossAttack(boss,target,.01);bossTest.bossAttack(boss,target,.9);assert.equal(bossTest.state().enemyShots.length,21);
bossTest.setBullets([{x:target.x-30,y:target.y,vx:1000,vy:0,r:7,life:1,damage:20}]);bossTest.simulate(.03);assert.equal(target.hp,80);
target.dash=target.dashTime;target.invuln=0;bossTest.setBullets([{x:target.x-30,y:target.y,vx:1000,vy:0,r:7,life:1,damage:20}]);bossTest.simulate(.03);assert.equal(target.hp,80);
bossTest.hurt(boss,99999);bossTest.update(3.1);assert(bossTest.state().between);assert.equal(bossTest.state().enemyShots.length,0);assert.equal(target.weapons.length,2);
bossTest.start('local');bossTest.bossWave(5);bossTest.simulate(.016);assert(bossTest.state().enemies.find(e=>e.type==='boss').hp>soloHP);
bossTest.start('solo');bossTest.bossWave(10);bossTest.simulate(.016);assert(bossTest.state().enemies.find(e=>e.type==='boss').hp>soloHP);
console.log('PASS bosses: every fifth wave, telegraphs, aimed/radial shots, projectile damage, dash immunity, guaranteed loot and scaling.');

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
const riftHost=harness(),riftEvents={},riftPackets=[];riftHost.host();riftHost.wire({open:true,bufferSize:0,on:(n,f)=>riftEvents[n]=f,send:m=>riftPackets.push(JSON.parse(JSON.stringify(m)))},0);riftEvents.data({t:'ready',v:12,token:'test-token-000000',config:{starter:'pistol'}});riftHost.start('online');riftHost.bossWave(5);riftHost.simulate(.01);riftHost.hurt(riftHost.state().enemies.find(e=>e.type==='boss'),999999);assert.equal(riftPackets.at(-1).fractureLeft,3);assert.equal(riftPackets.at(-1).riftBroken,true);riftHost.update(1.5);assert.equal(riftPackets.at(-1).visualTier,1);
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
scaled.simulate(.001);const scaledBoss=scaled.state().enemies.find(e=>e.type==='boss');assert.equal(scaledBoss.hp,(1000+5*150)*scaledBoss.power.health*shared.health);
const duo=harness();duo.start('local');const beforePower=duo.teamPower();duo.state().players[1].damage*=10;assert(duo.teamPower()>beforePower);const injuredPower=duo.teamPower();duo.state().players[1].hp=0;assert.equal(duo.teamPower(),injuredPower);
const sharedHost=harness(),sharedEvents={},sharedPackets=[];sharedHost.host();sharedHost.wire({open:true,bufferSize:0,on:(n,f)=>sharedEvents[n]=f,send:m=>sharedPackets.push(JSON.parse(JSON.stringify(m)))},0);sharedEvents.data({t:'ready',v:12,token:'test-token-000000',config:{starter:'pistol'}});sharedHost.start('online');
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
const S=require('./sphere-world.js');let journey={x:400,y:360,angle:0,vx:100,vy:0};for(let i=0;i<128;i++)journey=S.step(journey,journey.vx,journey.vy,.1);assert(S.delta(journey,{x:400,y:360}).distance<1e-4);
let polar={x:400,y:360,vx:0,vy:-100};for(let i=0;i<128;i++)polar=S.step(polar,polar.vx,polar.vy,.1);assert(S.delta(polar,{x:400,y:360}).distance<1e-4);assert(Math.abs(S.delta({x:1279,y:360},{x:1,y:360}).distance-2)<1e-5);
const planet=harness();planet.start('solo');planet.bossWave(15);planet.simulate(.01);planet.hurt(planet.state().enemies.find(e=>e.type==='boss'),1e9);planet.update(1.5);assert.equal(planet.state().visualTier,3);planet.update(1.6);planet.bossWave(16);
const walker=planet.state().players[0];walker.x=1279;walker.y=360;planet.move(walker,{dx:1,dy:0,angle:0,fire:false,dash:false},.02);assert(walker.x<15);assert(Math.abs(walker.y-360)<1e-5);
walker.x=1270;walker.y=360;walker.weapons=[P.weapon('pistol')];walker.angle=0;planet.setEnemies([{id:900,x:30,y:360,r:14,hp:1000,speed:0,type:'drone',burn:0,burnDamage:0,hit:0}]);planet.shoot(walker);planet.simulate(.01);assert(planet.state().enemies[0].hp<1000);
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
