/* Original constellation skill tree; run-local rules shared with tests. */
(() => {
'use strict';
const nodes=[{id:'core',name:'Pilot Core',icon:'✦',x:600,y:460,cost:0,requires:[],desc:'Your starting point. Earn one skill point per level. Follow connected paths to unlock abilities.'}];
const branches=[
 {id:'arc',name:'Storm',icon:'ϟ',color:'#79cfff',passives:[['damage','Charged Cells','+15% damage'],['crit','Precision Circuit','+5% critical chance']],ability:'chain',title:'Arc Relay',desc:'Hits chain to two nearby enemies for 35% damage. 0.45 second cooldown.',master:'targeting'},
 {id:'blade',name:'Orbit',icon:'✧',color:'#e3b4ff',passives:[['rate','Gyro Bearings','+12% firing speed'],['armor','Reinforced Hull','+2 armor']],ability:'blades',title:'Orbiting Blades',desc:'Two blades orbit your ship and strike nearby enemies every 0.3 seconds.',master:'drill'},
 {id:'dash',name:'Impulse',icon:'»',color:'#ffbd79',passives:[['speed','Vector Drive','+8% movement speed'],['damage','Impact Core','+15% damage']],ability:'nova',title:'Shockwave Ram',desc:'Every ram releases a 110-radius shockwave for twice your damage stat.',master:'thruster'},
 {id:'repair',name:'Guardian',icon:'✚',color:'#7dffd0',passives:[['health','Living Hull','+15 maximum HP'],['regen','Nanite Channels','+0.5 HP per second']],ability:'repair',title:'Repair Drone',desc:'Every 4 seconds, heal you and nearby teammates for 8 HP within 160 units.',master:'shield'},
 {id:'drone',name:'Arsenal',icon:'⌖',color:'#ff8aaa',passives:[['harvest','Salvage Network','+4 materials each wave'],['damage','Payload Link','+15% damage']],ability:'missiles',title:'Missile Drone',desc:'Launch a homing-at-fire missile at the nearest enemy every 2 seconds. Explodes in an 80-radius blast.',master:'lens'}
];
for(let i=0;i<branches.length;i++){
 const b=branches[i],angle=-Math.PI/2+i*Math.PI*2/5,point=r=>({x:600+Math.cos(angle)*r,y:460+Math.sin(angle)*r});
 b.passives.forEach(([stat,name,desc],n)=>nodes.push({id:b.id+(n+1),name,desc,stat,icon:b.icon,color:b.color,cost:1,requires:[n?b.id+'1':'core'],...point(115+n*110)}));
 nodes.push({id:b.id+'3',name:b.title,desc:b.desc,ability:b.ability,icon:b.icon,color:b.color,cost:2,requires:[b.id+'2'],...point(335)});
 nodes.push({id:b.id+'4',name:b.name+' Mastery',desc:'Install a free '+({targeting:'Hunter Chip (+7% crit)',drill:'Phase Drill (+1 pierce)',thruster:'Vector Thrusters (+5% speed, +3 armor)',shield:'Aegis Battery (+15 shield)',lens:'Blast Lens (+20% blast radius)'}[b.master])+'.',item:b.master,icon:'◆',color:b.color,cost:2,requires:[b.id+'3'],...point(435)});
 const next=branches[(i+1)%5],a=angle+Math.PI/5;
 nodes.push({id:'bridge'+i,name:'Crosslink '+(i+1),desc:'+10 luck. Opens a route between adjacent branches.',stat:'luck',icon:'◇',cost:1,color:'#c4d6e8',requires:[b.id+'2',next.id+'2'],x:600+Math.cos(a)*235,y:460+Math.sin(a)*235});
}
for(let i=0;i<5;i++)nodes.find(n=>n.id===branches[i].id+'2').requires.push('bridge'+i,'bridge'+((i+4)%5));
// Preserve original IDs and paths; extend each branch with four passives and a capstone.
for(const n of nodes){n.x+=500;n.y+=590;}
const capstones=[
 ['chainLightning','Chain Lightning','Every 3 seconds, automatically strike up to five enemies in a jumping lightning chain for 90% damage each. First target within 500; jumps within 240.','ϟ'],
 ['freezeRay','Freeze Ray','Every 4 seconds, fire a 650-range ray along your aim for 160% damage. Freeze ordinary enemies for 0.65 seconds and slow them 65% for 2 seconds. Bosses briefly stagger and slow 25%.','❄'],
 ['gravityWell','Gravity Well','Every 6 seconds, pull enemies within 240 toward a target within 500 and deal 120% damage. Bosses take damage but resist the pull.','◎'],
 ['aegisPulse','Aegis Pulse','Every 10 seconds, erase hostile bullets within 180 and protect nearby living teammates with 0.6 seconds of invulnerability.','⬡'],
 ['clusterBarrage','Cluster Barrage','Every 5 seconds, launch five explosive rockets in a fan toward the nearest enemy within 650. Each deals 70% damage with a 65-radius blast.','✹']
];
for(let i=0;i<branches.length;i++){
 const b=branches[i],angle=-Math.PI/2+i*Math.PI*2/5;
 for(let j=0;j<5;j++){
  const r=535+j*100,cap=capstones[i],passive=b.passives[j%2];
  nodes.push({id:b.id+(j+5),name:j===4?cap[1]:passive[1]+' '+(j<2?'II':'III'),desc:j===4?cap[2]:passive[2],...(j===4?{ability:cap[0]}:{stat:passive[0]}),icon:j===4?cap[3]:b.icon,color:b.color,cost:j===4?3:1,requires:[b.id+(j+4)],x:1100+Math.cos(angle)*r,y:1050+Math.sin(angle)*r});
 }
}
nodes.push({id:'nexus',name:'Fortune Nexus',desc:'+10 luck. A bonus path from any branch mastery.',stat:'luck',icon:'◇',cost:1,color:'#c4d6e8',requires:branches.map(b=>b.id+'4'),x:1100,y:1140});
const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
function available(p,id){const n=byId[id];return !!n&&!p.skills.includes(id)&&p.skillPoints>=n.cost&&n.requires.some(parent=>p.skills.includes(parent));}
function unlock(p,id,apply){if(!available(p,id))return false;const n=byId[id];p.skillPoints-=n.cost;p.skills.push(id);if(n.ability)p.abilities[n.ability]=true;apply(p,n);return true;}
const api={nodes,byId,available,unlock,width:2200,height:2100,center:{x:1100,y:1050}};if(typeof module!=='undefined')module.exports=api;else window.RRSkills=api;
})();
