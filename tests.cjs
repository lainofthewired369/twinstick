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

function harness(){const elements={},events={},stored={};const el=()=>({textContent:'',classList:{toggle(){}},style:{},addEventListener(){},querySelector:()=>el(),getContext:()=>({}),hasPointerCapture:()=>false,replaceChildren(){},append(){},dataset:{}});const c={window:{RRProgress:P},document:{querySelector:s=>elements[s]??=el(),querySelectorAll:()=>[],addEventListener(){},createElement:el},localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},performance:{now:()=>1000},requestAnimationFrame(){},addEventListener(){},setTimeout:()=>0,clearTimeout(){}};vm.createContext(c);let src=fs.readFileSync(__dirname+'/game.js','utf8');src=src.replace('requestAnimationFrame(loop);\n})();',`this.test={start,openShop,applyShop,simulate,ui,shoot,collect,wire,bossAttack,bossPower,spawnVariant,enemyAttack,damagePlayer,move,hurt,bossWave:n=>{wave=n-1;nextWave();spawnLeft=0;},setBullets:a=>{enemyShots=a;},host:()=>{isHost=true;},setEnemies:a=>{enemies=a;spawnLeft=1;spawnTimer=999;},state:()=>({players,wave,between,shots,enemies,profile,enemyShots,bossSpawned})};})();`);vm.runInContext(src,c);return c.test;}
const t=harness();t.start('local');t.openShop();let state=t.state();const [a,b]=state.players;a.pending=0;b.pending=0;const request=(p,action,extra={})=>({action,wave:t.state().wave,revision:p.revision,...extra});t.applyShop(0,request(a,'ready'));assert(t.state().between);t.applyShop(1,request(b,'ready'));assert.equal(t.state().wave,2);assert.equal(t.state().between,false);
t.collect({x:0,y:0,kind:'material',value:30});assert.equal(a.materials,b.materials);assert(a.pending>0);t.openShop();t.ui();assert.equal(t.state().profile.best,2);
for(const id of ids){t.start('solo');const p=t.state().players[0];p.crit=0;p.weapons=[P.weapon(id)];p.angle=0;t.setEnemies([{id:1,x:500,y:360,r:14,hp:1000,speed:0,type:'drone',burn:0,burnDamage:0,hit:0}]);t.shoot(p);for(let i=0;i<20;i++)t.simulate(.016);assert(t.state().enemies[0].hp<1000,id+' damage');}
const host=harness(),handlers={},packets=[];host.host();host.wire({open:true,bufferSize:0,on:(n,fn)=>handlers[n]=fn,send:m=>packets.push(m)},0);handlers.data({t:'ready',v:6,config:{character:'scout',starter:'smg'}});host.openShop();const guest=host.state().players[1],owner=host.state().players[0];assert.equal(guest.character,'scout');guest.materials=100;const o=guest.shop[0];handlers.data({t:'shop',...{action:'buy',uid:o.uid,wave:1,revision:guest.revision},id:0});assert.equal(guest.weapons.length,2);assert.equal(owner.weapons.length,1);handlers.data({t:'shop',action:'ready',wave:0,revision:guest.revision});assert.equal(guest.ready,false);assert.equal(packets.at(-1).v,6);
console.log('PASS integration: all weapons, shared loot, per-player wallets, two-player readiness, saved records and authoritative guest purchases.');

const bossTest=harness();bossTest.start('solo');bossTest.bossWave(4);bossTest.simulate(.016);assert.equal(bossTest.state().enemies.length,0);
bossTest.bossWave(5);bossTest.simulate(.016);let boss=bossTest.state().enemies.find(e=>e.type==='boss');assert(boss);assert.equal(bossTest.state().between,false);const target=bossTest.state().players[0],soloHP=boss.hp;
boss.attack=0;bossTest.bossAttack(boss,target,.01);assert(boss.windup>0);assert.equal(bossTest.state().enemyShots.length,0);bossTest.bossAttack(boss,target,.9);assert.equal(bossTest.state().enemyShots.length,5);
boss.attack=0;bossTest.bossAttack(boss,target,.01);bossTest.bossAttack(boss,target,.9);assert.equal(bossTest.state().enemyShots.length,21);
bossTest.setBullets([{x:target.x-30,y:target.y,vx:1000,vy:0,r:7,life:1,damage:20}]);bossTest.simulate(.03);assert.equal(target.hp,80);
target.dash=target.dashTime;target.invuln=0;bossTest.setBullets([{x:target.x-30,y:target.y,vx:1000,vy:0,r:7,life:1,damage:20}]);bossTest.simulate(.03);assert.equal(target.hp,80);
bossTest.hurt(boss,99999);bossTest.simulate(.016);assert(bossTest.state().between);assert.equal(bossTest.state().enemyShots.length,0);assert.equal(target.weapons.length,2);
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
