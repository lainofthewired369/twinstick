(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const C=$('#game'), X=C.getContext('2d'), W=1280,H=720,keys={},mouse={x:640,y:360,down:false,active:false};
let running=false,paused=false,last=0,mode='solo',wave=0,score=0,enemies=[],shots=[],particles=[],players=[],spawnLeft=0,spawnTimer=0,between=false;
let peer=null,conn=null,isHost=false,localId=0,netTick=0,session=0,netTimer,remoteAt=0,lastPacket=0,peerScript=null;
let choices=[],overlay='menu',lastUI='',dashPending=false,dash2=false,dashSeq=0,remoteDash=0;
const blank=()=>({dx:0,dy:0,angle:0,fire:false,dash:0});
let remoteInput=blank(),enemySerial=0,effects=[],guestLoadout=['pistol'],armoryPlayer=0,armorySlot=0;
const loadouts=[['pistol'],['pistol']];
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
function validLoadout(a){const ids=Array.isArray(a)?a.slice(0,6).map(k=>Object.hasOwn(weapons,k)?k:null):[];return ids.some(Boolean)?ids:['pistol'];}
function armory(){
 $('#armoryTitle').textContent=armoryPlayer?'Local player 2':'Your ship';
 $('#slots').replaceChildren();$('#weaponCards').replaceChildren();
 for(let n=0;n<6;n++){const b=document.createElement('button');b.textContent=(n+1)+': '+(weapons[loadouts[armoryPlayer][n]]?.name||'Empty');b.className=n===armorySlot?'selected':'';b.onclick=()=>{armorySlot=n;armory();};$('#slots').append(b);}
 for(const [id,w] of Object.entries(weapons)){const b=document.createElement('button');b.innerHTML='<b>'+w.name+'</b><span>'+w.desc+'</span>';b.onclick=()=>{loadouts[armoryPlayer][armorySlot]=id;armorySlot=(armorySlot+1)%6;armory();};$('#weaponCards').append(b);}
}
function hurt(e,damage){if(e.hp<=0)return;e.hp-=damage;e.hit=.1;if(e.hp<=0){score+=e.type==='tank'?50:20;burst(e.x,e.y,e.type==='tank'?'#ffc55c':'#ff496c',14);}}
function distanceToSegment(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-ax-t*dx,y-ay-t*dy);}
function effect(f){effects.push({...f,life:.18});if(effects.length>100)effects.shift();}
function explode(s){effect({kind:'blast',x:s.x,y:s.y,r:s.blast,color:s.color});for(const e of enemies)if(Math.hypot(e.x-s.x,e.y-s.y)<s.blast+e.r)hurt(e,s.dmg);s.life=0;}

const touch={move:{id:null,x:0,y:0},aim:{id:null,x:0,y:0}};
const upgrades=[['OVERCLOCK','25% faster firing','rate'],['HEAVY ROUNDS','+35% damage','damage'],['PHASE BOOTS','+18% speed','speed'],['NANOFIBER','More maximum health','health'],['TWIN SHOT','One extra projectile','multi'],['QUICKSHIFT','25% faster dash recharge','dash']];
function player(x,color,id){return{x,y:360,angle:0,hp:100,maxHp:100,color,id,speed:250,damage:22,rate:.18,cool:0,dash:0,dashTime:1.5,multi:1,weapons:validLoadout(id===1?(mode==='online'?guestLoadout:loadouts[1]):loadouts[0]).filter(Boolean).map(id=>({id,cool:0,spin:0}))};}
function show(id){overlay=id;['menu','lobby','upgrade','gameover','armory'].forEach(n=>$('#'+n).classList.toggle('hidden',n!==id));}
function resetInput(){
 Object.keys(keys).forEach(k=>delete keys[k]);mouse.down=false;dashPending=false;dash2=false;
 for(const [name,s] of Object.entries(touch)){const el=$('#'+(name==='move'?'moveStick':'aimStick'));if(s.id!==null&&el.hasPointerCapture(s.id))el.releasePointerCapture(s.id);s.id=null;s.x=s.y=0;el.querySelector('i').style.transform='';}
}
function start(m){
 resetInput();mode=m;wave=0;score=0;enemies=[];shots=[];particles=[];effects=[];enemySerial=0;choices=[];
 players=[player(448,'#68f7c2',0)];if(m!=='solo')players.push(player(832,'#54bfff',1));
 running=true;paused=false;between=false;remoteInput={...blank(),dash:remoteDash};lastUI='';nextWave();show('none');sendState();
}
function nextWave(){wave++;spawnLeft=Math.min(100,5+wave*3);spawnTimer=.6;between=false;choices=[];}
function spawn(){const side=Math.floor(Math.random()*4),tank=Math.random()<Math.min(.12+wave*.02,.42);enemies.push({id:++enemySerial,burn:0,burnDamage:0,x:side%2?Math.random()*W:side?W+30:-30,y:side%2?(side===1?-30:H+30):Math.random()*H,r:tank?22:14,hp:tank?80+wave*12:35+wave*6,speed:tank?55:Math.min(240,90+wave*3),type:tank?'tank':'drone',hit:0});}
function burst(x,y,color,n=9){for(let i=0;i<n;i++){const a=Math.random()*7,s=Math.random()*150;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.4,color});}if(particles.length>500)particles.splice(0,particles.length-500);}
function shoot(p){
 if(p.hp<=0)return;
 for(const slot of p.weapons){
  if(slot.cool>0||shots.length>=600)continue;
  const w=weapons[slot.id],dmg=w.damage*p.damage/22;
  slot.cool=w.rate*(p.rate/.18)/(slot.id==='minigun'?1+slot.spin*2:1);
  if(w.reach){
   const bx=p.x+Math.cos(p.angle)*w.reach,by=p.y+Math.sin(p.angle)*w.reach;
   effect({kind:w.arc?'arc':'beam',x:p.x,y:p.y,bx,by,angle:p.angle,r:w.reach,arc:w.arc,color:w.color});
   for(const e of enemies){
    const a=Math.atan2(e.y-p.y,e.x-p.x)-p.angle;
    const hit=w.arc?Math.hypot(e.x-p.x,e.y-p.y)<w.reach+e.r&&Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<w.arc/2+e.r/Math.max(e.r,Math.hypot(e.x-p.x,e.y-p.y)):distanceToSegment(e.x,e.y,p.x,p.y,bx,by)<e.r+5;
    if(hit)hurt(e,dmg*(1+(p.multi-1)*.15));
   }
  }else{
   const count=Math.min(16,(w.pellets||1)+p.multi-1);
   for(let n=0;n<count&&shots.length<600;n++){
    const a=p.angle+(w.pellets?(n-(count-1)/2)*(w.spread/Math.max(1,count-1)):(Math.random()-.5)*(w.spread||0)+(n-(count-1)/2)*.10);
    shots.push({x:p.x+Math.cos(a)*20,y:p.y+Math.sin(a)*20,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,life:w.life,dmg,owner:p.id,color:w.color,r:w.blast?7:w.burn?9:3,blast:w.blast||0,burn:!!w.burn,pierce:w.pierce||1,hitIds:[]});
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
 for(const s of p.weapons){s.cool=Math.max(0,s.cool-dt);s.spin=i.fire?Math.min(1,s.spin+dt):0;}p.dash=Math.max(0,p.dash-dt);p.angle=i.angle;
 p.x+=i.dx*p.speed*dt;p.y+=i.dy*p.speed*dt;
 if(i.dash&&p.dash===0){let dx=i.dx,dy=i.dy;if(Math.hypot(dx,dy)<.1){dx=Math.cos(p.angle);dy=Math.sin(p.angle);}const l=Math.hypot(dx,dy);p.x+=dx/l*110;p.y+=dy/l*110;p.dash=p.dashTime;burst(p.x,p.y,p.color,14);}
 p.x=Math.max(18,Math.min(W-18,p.x));p.y=Math.max(18,Math.min(H-18,p.y));if(i.fire)shoot(p);
}
function simulate(dt){
 move(players[0],localInput(),dt);
 if(players[1]){
  if(mode==='local')move(players[1],localInput(true),dt);
  else {const i=performance.now()-remoteAt<500?{...remoteInput}:blank();i.dash=remoteInput.dash>remoteDash;remoteDash=remoteInput.dash;move(players[1],i,dt);}
 }
 spawnTimer-=dt;if(spawnLeft&&spawnTimer<=0){spawn();spawnLeft--;spawnTimer=Math.max(.12,.7-wave*.02);}
 for(const e of enemies){
  if(e.burn>0){e.burn-=dt;hurt(e,e.burnDamage*dt);}if(e.hp<=0)continue;
  const t=players.filter(p=>p.hp>0).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
  if(t){const a=Math.atan2(t.y-e.y,t.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;if(Math.hypot(t.x-e.x,t.y-e.y)<e.r+15&&t.dash<t.dashTime-.15){t.hp=Math.max(0,t.hp-24*dt);e.hit=.08;}}
  e.hit=Math.max(0,e.hit-dt);
 }
 for(const s of shots){
  const ax=s.x,ay=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
  const hits=enemies.filter(e=>e.hp>0&&!s.hitIds.includes(e.id)&&distanceToSegment(e.x,e.y,ax,ay,s.x,s.y)<e.r+s.r).sort((a,b)=>Math.hypot(a.x-ax,a.y-ay)-Math.hypot(b.x-ax,b.y-ay));
  for(const e of hits){
   if(s.blast){s.x=e.x;s.y=e.y;explode(s);break;}
   hurt(e,s.dmg);s.hitIds.push(e.id);if(s.burn){e.burn=2;e.burnDamage=Math.max(e.burnDamage,s.dmg*3);}
   if(--s.pierce<=0){s.life=0;break;}
  }
  if(s.blast&&s.life<=0&&!hits.length)explode(s);
 }
 enemies=enemies.filter(e=>e.hp>0);shots=shots.filter(s=>s.life>0);
 if(players.every(p=>p.hp<=0)){running=false;between=false;sendState();}
 else if(!spawnLeft&&!enemies.length){between=true;choices=[...upgrades].sort(()=>Math.random()-.5).slice(0,3).map(u=>u[2]);sendState();}
}
function choose(k){
 if((mode==='online'&&!isHost)||!between||!choices.includes(k))return;
 for(const p of players){
  if(k==='rate')p.rate=Math.max(.055,p.rate*.8);if(k==='damage')p.damage*=1.35;
  if(k==='speed')p.speed=Math.min(480,p.speed*1.18);if(k==='health')p.maxHp+=25;
  if(k==='multi')p.multi=Math.min(7,p.multi+1);if(k==='dash')p.dashTime=Math.max(.4,p.dashTime*.75);
  p.hp=Math.min(p.maxHp,Math.max(p.hp,p.maxHp*.5)+20);
 }
 nextWave();resetInput();sendState();
}
function ui(){
 if(mode==='online'||running||overlay==='gameover'||overlay==='upgrade'){
  $('#wave').textContent=wave;$('#hostiles').textContent=enemies.length+spawnLeft;$('#score').textContent=score;
  $('#mode').textContent=mode==='online'?(isHost?'HOST · GREEN':'GUEST · BLUE'):mode.toUpperCase();
 }
 const active=running&&!paused&&!between&&overlay==='none';
 $('#touch').classList.toggle('active',active);
 $('#pauseBtn').textContent=paused?'▶':'Ⅱ';$('#pauseBtn').disabled=!(running||paused);
 const p=players[localId];$('#loadoutHud').textContent=running?(p?.weapons||[]).map(s=>weapons[s.id]?.name).join(' · '):'';$('#dashTouch').textContent=p?.dash>0?p.dash.toFixed(1)+'s':'DASH';
 if(['menu','lobby','armory'].includes(overlay))return;
 const key=[running,between,choices.join(','),isHost,mode].join('|');if(key===lastUI)return;lastUI=key;
 if(!running){$('#finalScore').textContent='Wave '+wave+' · '+score+' points';show('gameover');$('[data-action="restart"]').disabled=mode==='online'&&!isHost;return;}
 if(between){
  show('upgrade');$('#upgradeHint').textContent=mode==='online'?(isHost?'Choose for both players.':'Host is choosing your team upgrade…'):'';
  $('#cards').replaceChildren();
  for(const k of choices){const u=upgrades.find(u=>u[2]===k);if(!u)continue;const b=document.createElement('button');b.className='upgrade-card';b.innerHTML='<b>'+u[0]+'</b><span>'+u[1]+'</span>';b.disabled=mode==='online'&&!isHost;b.onclick=()=>choose(k);$('#cards').append(b);}
 }else show('none');
}
function update(dt){
 if(mode==='online'&&conn?.open){
  if(performance.now()-lastPacket>12000){fail('Connection lost. Host a new room to reconnect.');return;}
  netTick+=dt;if(!isHost&&netTick>=1/30){
   netTick=0;const i=running&&!paused&&!between?localInput():blank();if(i.dash)dashSeq++;send({t:'input',...i,dash:dashSeq});
  }
 }
 if(running&&!paused&&!between&&(mode!=='online'||isHost))simulate(dt);
 if(mode==='online'&&isHost&&netTick>=1/20){netTick=0;sendState();}
 for(const f of effects)f.life-=dt;effects=effects.filter(f=>f.life>0);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);ui();
}
function draw(){X.fillStyle='#0a1018';X.fillRect(0,0,W,H);X.strokeStyle='#172333';X.lineWidth=1;for(let x=0;x<W;x+=64){X.beginPath();X.moveTo(x,0);X.lineTo(x,H);X.stroke()}for(let y=0;y<H;y+=64){X.beginPath();X.moveTo(0,y);X.lineTo(W,y);X.stroke()}X.strokeStyle='#20364b';X.lineWidth=3;X.strokeRect(18,18,W-36,H-36);shots.forEach(s=>{X.fillStyle=s.color||(s.owner?'#54bfff':'#68f7c2');X.shadowBlur=12;X.shadowColor=X.fillStyle;X.beginPath();X.arc(s.x,s.y,s.r||4,0,7);X.fill()});X.shadowBlur=0;effects.forEach(f=>{X.save();X.globalAlpha=Math.min(1,f.life*8);X.strokeStyle=f.color;X.lineWidth=5;X.beginPath();if(f.kind==='blast')X.arc(f.x,f.y,f.r,0,Math.PI*2);else if(f.kind==='beam'){X.moveTo(f.x,f.y);X.lineTo(f.bx,f.by);}else{X.moveTo(f.x,f.y);X.arc(f.x,f.y,f.r,f.angle-f.arc/2,f.angle+f.arc/2);X.closePath();}X.stroke();X.restore();});enemies.forEach(e=>{X.save();X.translate(e.x,e.y);X.rotate(performance.now()/900);X.fillStyle=e.hit?'#fff':e.type==='tank'?'#ffc55c':'#ff496c';X.strokeStyle=X.fillStyle;X.lineWidth=3;if(e.type==='tank'){X.strokeRect(-e.r,-e.r,e.r*2,e.r*2);X.rotate(.7);X.fillRect(-9,-9,18,18)}else{X.beginPath();for(let i=0;i<6;i++){let a=i*Math.PI/3;X.lineTo(Math.cos(a)*e.r,Math.sin(a)*e.r)}X.closePath();X.fill()}X.restore()});players.forEach(p=>{if(p.hp<=0)return;X.save();X.translate(p.x,p.y);X.rotate(p.angle);X.shadowBlur=20;X.shadowColor=p.color;X.strokeStyle=p.color;X.fillStyle='#0d1721';X.lineWidth=4;X.beginPath();X.arc(0,0,15,0,7);X.fill();X.stroke();X.fillStyle=p.color;X.fillRect(5,-4,23,8);X.restore();X.fillStyle='#1d2937';X.fillRect(p.x-22,p.y+25,44,5);X.fillStyle=p.hp>30?p.color:'#ff496c';X.fillRect(p.x-22,p.y+25,44*Math.max(0,p.hp/p.maxHp),5)});particles.forEach(p=>{X.globalAlpha=Math.max(0,p.life*2);X.fillStyle=p.color;X.fillRect(p.x,p.y,3,3)});X.globalAlpha=1;if(paused){X.fillStyle='#080b12aa';X.fillRect(0,0,W,H);X.fillStyle='#fff';X.font='700 42px system-ui';X.textAlign='center';X.fillText('PAUSED',W/2,H/2)}}

function send(m){if(conn?.open&&conn.bufferSize<3)conn.send(m);}
function sendState(){if(isHost&&mode==='online')send({t:'state',v:3,players,enemies,shots,effects,wave,score,spawnLeft,running,paused,between,choices});}
function netStatus(s){$('#netStatus').textContent=s;}
function cleanup(){
 session++;clearTimeout(netTimer);const old=peer;peer=null;conn=null;old?.destroy();remoteInput=blank();remoteDash=0;dashSeq=0;resetInput();running=false;paused=false;between=false;mode='solo';
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
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('rift-runners-v3:'+password));
 return 'rr3-'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
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
   else {netStatus('Connecting to host…');wire(p.connect(id,{reliable:true,serialization:'json',metadata:{v:3}}),token);}
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
 c.on('open',()=>{if(token!==session)return;lastPacket=performance.now();if(!isHost)send({t:'ready',v:3,loadout:validLoadout(loadouts[0])});});
 c.on('data',m=>{
  if(token!==session||!m||typeof m!=='object')return;lastPacket=performance.now();
  if(m.t==='reject'){fail(m.reason||'Room unavailable.');return;}
  if(isHost&&m.t==='ready'&&m.v===3){guestLoadout=validLoadout(m.loadout);clearTimeout(netTimer);mode='online';start('online');return;}
  if(isHost&&m.t==='input'){
   if(![m.dx,m.dy,m.angle,m.dash].every(Number.isFinite))return;
   const l=Math.max(1,Math.hypot(m.dx,m.dy));remoteInput={dx:m.dx/l,dy:m.dy/l,angle:m.angle,fire:m.fire===true,dash:Math.max(0,Math.min(1e9,Math.floor(m.dash)))};
   remoteAt=performance.now();return;
  }
  if(isHost&&m.t==='pause'){paused=!paused;resetInput();sendState();return;}
  if(!isHost&&m.t==='state'&&m.v===3){
   if(!Array.isArray(m.players)||m.players.length!==2||!Array.isArray(m.enemies)||!Array.isArray(m.shots))return;
   clearTimeout(netTimer);mode='online';players=m.players;enemies=m.enemies;shots=m.shots;effects=Array.isArray(m.effects)?m.effects:[];wave=m.wave;score=m.score;spawnLeft=m.spawnLeft;running=m.running;paused=m.paused;between=m.between;choices=m.choices;
   if(overlay==='lobby')show('none');ui();
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
$('#pauseBtn').onclick=()=>{if(mode==='online'&&!isHost)send({t:'pause'});else {paused=!paused;resetInput();sendState();}};
$$('[data-action]').forEach(b=>b.onclick=async()=>{
 const a=b.dataset.action;
 if(a==='solo'||a==='local'){cleanup();localId=0;start(a);}
 if(a==='armory'){show('armory');armory();}
 if(a==='armory-done')show('menu');
 if(a==='armory-player'){armoryPlayer=1-armoryPlayer;armorySlot=0;armory();}
 if(a==='unequip'){loadouts[armoryPlayer][armorySlot]=null;loadouts[armoryPlayer]=validLoadout(loadouts[armoryPlayer]);armory();}
 if(a==='online'){cleanup();show('lobby');netStatus('Choose Host or Join.');}
 if(a==='back'){cleanup();show('menu');}
 if(a==='host')connect(true);if(a==='join')connect(false);
 if(a==='restart'&&(mode!=='online'||isHost))start(mode);
 if(a==='copy'){try{if(!$('#roomPassword').value)return;await navigator.clipboard.writeText($('#roomPassword').value);netStatus('Password copied. Send it to your teammate.');}catch(e){$('#roomPassword').select();netStatus('Select and copy the password above.');}}
});
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop);}
requestAnimationFrame(loop);
})();
