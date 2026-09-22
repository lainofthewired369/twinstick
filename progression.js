/* Original run economy. Pure rules are shared by gameplay and simulation tests. */
(() => {
'use strict';
const S=typeof module!=='undefined'?require('./skill-tree.js'):window.RRSkills;
const tiers=[null,{name:'Common',color:'#b8c8d8',power:1},{name:'Uncommon',color:'#68f7c2',power:1.55},{name:'Rare',color:'#54bfff',power:2.3},{name:'Epic',color:'#d69cff',power:3.4}];
const characters={
 ranger:{name:'Ranger',unlock:0,desc:'Balanced ship · +10% damage',damage:1.1},
 scout:{name:'Scout',unlock:3,desc:'+20% speed · +50% pickup range · −20 HP',speed:1.2,hp:-20,pickup:1.5},
 bulwark:{name:'Bulwark',unlock:5,reach:true,desc:'+40 HP · +4 armor · −15% speed',hp:40,armor:4,speed:.85},
 vanguard:{name:'Vanguard',unlock:10,reach:true,desc:'+25% damage · +2 armor · −10% speed',damage:1.25,armor:2,speed:.9},
 spectre:{name:'Spectre',unlock:15,reach:true,desc:'+30% speed · +25 luck · −25 HP',speed:1.3,luck:25,hp:-25},
 engineer:{name:'Engineer',unlock:8,desc:'+8 harvesting · +20 luck · −10% damage',harvest:8,luck:20,damage:.9}
};
const hulls={ranger:[[29,0],[-16,-18],[-9,0],[-16,18]],scout:[[34,0],[-22,-11],[-13,0],[-22,11]],bulwark:[[24,-10],[24,10],[-18,24],[-25,12],[-25,-12],[-18,-24]],engineer:[[26,0],[8,-12],[-6,-24],[-24,-24],[-12,0],[-24,24],[-6,24],[8,12]],vanguard:[[32,0],[4,-12],[-22,-28],[-10,-5],[-18,0],[-10,5],[-22,28],[4,12]],spectre:[[36,0],[-26,-23],[-8,-5],[-20,0],[-8,5],[-26,23]]};
function mount(p,index,sphere){
 const a=p.angle||0,count=Math.max(1,p.weapons?.length||1),rad=count===1?a:a+Math.PI/2+index*Math.PI*2/count;
 const step=(q,angle,d)=>sphere?sphere.step({...q,angle},Math.cos(angle)*d,Math.sin(angle)*d):{x:q.x+Math.cos(angle)*d,y:q.y+Math.sin(angle)*d,angle};
 const base=step(p,rad,34),target=step(p,a,Math.max(60,Math.min(1200,p.aimDistance||550))),d=sphere?sphere.delta(base,target):{x:target.x-base.x,y:target.y-base.y};
 base.angle=Math.atan2(d.y,d.x);return {...base,tip:step(base,base.angle,17)};
}
const stats={damage:{name:'Damage',desc:'+15% damage'},rate:{name:'Attack speed',desc:'+12% firing speed'},health:{name:'Vitality',desc:'+15 maximum HP'},speed:{name:'Mobility',desc:'+8% movement speed'},armor:{name:'Armor',desc:'+2 armor'},regen:{name:'Regeneration',desc:'+0.5 HP per second'},luck:{name:'Luck',desc:'+10 luck: better shop rarities'},harvest:{name:'Harvesting',desc:'+4 materials each wave'},crit:{name:'Critical chance',desc:'+5% chance of double damage'}};
const items={
 scope:{name:'Longshot Scope',icon:'⌖',desc:'+15% weapon range',mods:{range:.15}},
 magnet:{name:'Tractor Coil',icon:'◎',desc:'+35 pickup range · +2 harvesting',mods:{pickup:35,harvest:2}},
 plating:{name:'Ceramic Plating',icon:'⬡',desc:'+3 armor · −4% speed',mods:{armor:3,speed:-.04}},
 reactor:{name:'Unstable Reactor',icon:'✹',desc:'+25% damage · −10 max HP',mods:{damage:.25,health:-10}},
 loader:{name:'Belt Loader',icon:'≋',desc:'+20% attack speed · −5% damage',mods:{rate:.20,damage:-.05}},
 medkit:{name:'Nanite Garden',icon:'✚',desc:'+10 max HP · +0.4 HP/s',mods:{health:10,regen:.4}},
 vampire:{name:'Vampire Circuit',icon:'◈',desc:'Heal 2% of hit damage (12% cap)',mods:{leech:.02}},
 cryo:{name:'Cryo Rounds',icon:'❄',desc:'Hits slow enemies 12% for 1s (50% cap)',mods:{slow:.12}},
 drill:{name:'Phase Drill',icon:'↠',desc:'+1 projectile penetration',mods:{pierce:1}},
 shield:{name:'Aegis Battery',icon:'◉',desc:'+15 shield · regenerates after 4s unharmed',mods:{shield:15}},
 thruster:{name:'Vector Thrusters',icon:'»',desc:'+5% speed · +3 armor for ramming',mods:{speed:.05,armor:3}},
 targeting:{name:'Hunter Chip',icon:'⌁',desc:'+7% critical chance (80% cap)',mods:{crit:.07}},
 biomass:{name:'Salvage Heart',icon:'♥',desc:'Heal 1 HP on each kill',mods:{killHeal:1}},
 prospector:{name:'Ore Scanner',icon:'◇',desc:'+15% pickup materials',mods:{materialBonus:.15}},
 neural:{name:'Neural Link',icon:'Ψ',desc:'+20% XP from pickups',mods:{xpBonus:.20}},
 lens:{name:'Blast Lens',icon:'◌',desc:'+20% rocket explosion radius',mods:{blastScale:.20}},
 recycler:{name:'Scrap Printer',icon:'▧',desc:'+6 harvesting per wave',mods:{harvest:6}},
 lucky:{name:'Lucky Comet',icon:'✦',desc:'+15 luck · +3 pickup range',mods:{luck:15,pickup:3}},
 splitter:{name:'Prism Splitter',icon:'⋔',desc:'+1 projectile (7 cap) · −12% damage',mods:{multi:1,damage:-.12}},
 berserker:{name:'Redline Core',icon:'⚡',desc:'+20% damage while below half HP',mods:{berserk:.20}}
};
function applyItem(p,id,tier=1){
 const item=items[id];if(!item){apply(p,id,tier);return;}
 for(const [k,v] of Object.entries(item.mods)){const n=v*tier;
  if(k==='health'){p.maxHp=Math.max(25,p.maxHp+n);if(p.hp>0)p.hp=Math.min(p.maxHp,p.hp+Math.max(0,n));}
  else if(k==='damage')p.damage*=Math.max(.35,1+n);
  else if(k==='speed')p.speed=Math.max(100,Math.min(480,p.speed*(1+n)));
  else if(k==='rate')p.rate=Math.max(.045,p.rate/(1+n));
  else if(k==='dash')p.dashTime=30;
  else if(k==='shield'){p.maxShield+=n;p.shield=Math.min(p.maxShield,p.shield+n);}
  else p[k]=(p[k]||0)+n;
 }
 p.crit=Math.min(.8,p.crit);p.leech=Math.min(.12,p.leech);p.slow=Math.min(.5,p.slow);p.multi=Math.min(7,p.multi);p.pierce=Math.min(8,p.pierce);p.range=Math.min(2.5,p.range);p.blastScale=Math.min(2.5,p.blastScale);
}
const starters=['pistol','smg','shotgun','knife','spear'];
let serial=0;
function weapon(id,tier=1,source='equipment'){return {uid:++serial,id,tier,cool:0,spin:0,source};}
function syncSerial(players){for(const p of players)for(const entry of [...(p.weapons||[]),...(p.shop||[])])if(Number.isFinite(entry?.uid))serial=Math.max(serial,entry.uid);}
function config(c){return {character:Object.hasOwn(characters,c?.character)?c.character:'ranger',starter:starters.includes(c?.starter)?c.starter:'pistol'};}
function init(p,c){c=config(c);const a=characters[c.character];Object.assign(p,{character:c.character,level:1,xp:0,skillPoints:0,skills:['core'],abilities:{},abilityTimers:{},orbitTime:0,materials:0,pending:0,levelChoices:[],armor:a.armor||0,regen:0,luck:a.luck||0,harvest:a.harvest||0,crit:.05,range:1,blastScale:1,leech:0,slow:0,pierce:0,killHeal:0,materialBonus:0,xpBonus:0,berserk:0,maxShield:0,shield:0,shieldDelay:0,multi:1,dashTime:30,pickup:90*(a.pickup||1),shop:[],rerolls:0,ready:false,revision:0,items:[],weapons:[weapon(c.starter,1,'starter')]});p.maxHp+=a.hp||0;p.hp=p.maxHp;p.speed*=a.speed||1;p.damage*=a.damage||1;return p;}
function threshold(p){return 8+p.level*5;}
function sample(keys,n,rng=Math.random){const a=[...keys],out=[];while(out.length<n&&a.length)out.push(a.splice(Math.floor(rng()*a.length),1)[0]);return out;}
function grant(p,materials,xp){const cash=materials*(1+p.materialBonus)+(p.materialCarry||0),experience=xp*(1+p.xpBonus)+(p.xpCarry||0);p.materials+=Math.floor(cash);p.materialCarry=cash-Math.floor(cash);p.xp+=Math.floor(experience);p.xpCarry=experience-Math.floor(experience);while(p.xp>=threshold(p)){p.xp-=threshold(p);p.level++;p.pending++;p.skillPoints++;}if(p.pending&&!p.levelChoices.length)p.levelChoices=sample(Object.keys(stats),3);}
function apply(p,id,tier=1){const n=tier;if(id==='damage')p.damage*=1+.15*n;if(id==='rate')p.rate=Math.max(.045,p.rate/(1+.12*n));if(id==='health'){p.maxHp+=15*n;if(p.hp>0)p.hp=Math.min(p.maxHp,p.hp+15*n);}if(id==='speed')p.speed=Math.min(480,p.speed*(1+.08*n));if(id==='armor')p.armor+=2*n;if(id==='regen')p.regen+=.5*n;if(id==='luck')p.luck+=10*n;if(id==='harvest')p.harvest+=4*n;if(id==='crit')p.crit=Math.min(.8,p.crit+.05*n);}
function rarity(wave,luck,rng=Math.random){const roll=rng(),bonus=wave*.008+luck*.001;return roll<Math.min(.12,Math.max(0,(wave-7)*.008+luck*.0004))?4:roll<Math.min(.35,.03+bonus)?3:roll<Math.min(.70,.22+bonus)?2:1;}
function price(id,tier,wave){return Math.round((['rocket','minigun','laser','sniper'].includes(id)?24:16)*(1+(tier-1)*.8)+wave*2);}
function restock(p,wave,weaponIds,rng=Math.random){p.shop=Array.from({length:4},(_,i)=>{if(p.shop[i]?.locked)return p.shop[i];const kind=i<2?'weapon':'item',id=sample(kind==='weapon'?weaponIds:Object.keys(items),1,rng)[0],tier=rarity(wave,p.luck,rng);return {uid:++serial,kind,id,tier,cost:price(id,tier,wave),locked:false};});}
function open(p,wave,weaponIds){p.materials+=10+wave*2+p.harvest;if(p.hp>0)p.hp=Math.min(p.maxHp,Math.max(p.hp,p.maxHp*.5)+20);p.ready=false;p.rerolls=0;p.revision++;restock(p,wave,weaponIds);}
function partner(p,w){return p.weapons.find(s=>s.uid!==w.uid&&s.id===w.id&&s.tier===w.tier&&s.tier<4);}
function sellValue(w,wave){return Math.max(1,Math.floor(price(w.id,w.tier,wave)*.4));}
function rerollCost(p,wave){return 3+wave+p.rerolls*3;}
function lifeCost(p){return 25+15*Math.max(0,p.lives??10);}
function action(p,m,wave,weaponIds){
 if(!m||m.wave!==wave||m.revision!==p.revision)return false;
 const w=p.weapons.find(w=>w.uid===m.uid),o=p.shop.find(o=>o?.uid===m.uid);
 if(m.action==='ready'){if(p.pending)return false;p.ready=!p.ready;}
 else {
  if(p.ready&&!(m.action==='life'&&p.hp<=0))return false;
  if(m.action==='life'){const cost=lifeCost(p);if(p.materials<cost)return false;p.materials-=cost;p.lives=(p.lives??10)+1;}
  else if(m.action==='buy'){if(!o||p.materials<o.cost)return false;const same=p.weapons.find(w=>w.id===o.id&&w.tier===o.tier&&w.tier<4);if(o.kind==='weapon'&&p.weapons.length>=6&&!same)return false;p.materials-=o.cost;if(o.kind==='weapon'){if(p.weapons.length>=6){same.tier++;same.source='shop';}else p.weapons.push(weapon(o.id,o.tier,'shop'));}else {applyItem(p,o.id,o.tier);p.items.push({id:o.id,tier:o.tier,source:'shop'});}p.shop[p.shop.indexOf(o)]=null;}
  else if(m.action==='shop-combine'){if(!o||o.kind!=='weapon'||o.tier>=4||p.materials<o.cost)return false;const match=p.weapons.find(w=>w.id===o.id&&w.tier===o.tier);if(!match)return false;p.materials-=o.cost;match.tier++;match.source='combined';p.shop[p.shop.indexOf(o)]=null;}
  else if(m.action==='combine'){const other=w&&partner(p,w);if(!other)return false;w.tier++;w.source='combined';p.weapons.splice(p.weapons.indexOf(other),1);}
  else if(m.action==='sell'){if(!w||p.weapons.length<=1)return false;p.materials+=sellValue(w,wave);p.weapons.splice(p.weapons.indexOf(w),1);}
  else if(m.action==='lock'){if(!o)return false;o.locked=!o.locked;}
  else if(m.action==='reroll'){const cost=rerollCost(p,wave);if(p.materials<cost||p.shop.every(o=>o?.locked))return false;p.materials-=cost;p.rerolls++;restock(p,wave,weaponIds);}
  else if(m.action==='skill'){if(!S.unlock(p,m.stat,(p,n)=>{if(n.stat)apply(p,n.stat);if(n.item)applyItem(p,n.item);}))return false;}
  else if(m.action==='level'){if(!p.pending||!p.levelChoices.includes(m.stat))return false;apply(p,m.stat);p.pending--;p.levelChoices=p.pending?sample(Object.keys(stats),3):[];}
  else return false;
 }
 p.revision++;return true;
}
function loot(p,id){if(p.weapons.length<6)p.weapons.push(weapon(id,1,'shared-crate'));else {const w=p.weapons.find(w=>w.id===id&&w.tier===1);if(w){w.tier++;w.source='shared-crate';}else p.materials+=12;}p.revision++;}
const api={hulls,mount,skills:S,syncSerial,tiers,characters,stats,items,applyItem,starters,weapon,config,init,threshold,grant,apply,rarity,price,restock,open,partner,sellValue,rerollCost,lifeCost,action,loot};
if(typeof module!=='undefined')module.exports=api;else window.RRProgress=api;
})();
