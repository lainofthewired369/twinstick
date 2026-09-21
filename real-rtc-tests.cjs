/* Runs production game handlers over real WebRTC, without browser mocks of transport.
 * DOM and frame scheduling are stubbed. PeerJS signalling/serialization and Safari
 * are not exercised by this test. See RTC-TESTS.md for the exact scope. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {spawn}=require('node:child_process'),{createInterface}=require('node:readline');
const P=require('./progression.js');
const source=fs.readFileSync(__dirname+'/tests.cjs','utf8');
const harnessSource=source.slice(source.indexOf('function harness(){'),source.indexOf('\nconst t=harness()'));
const harness=new Function('require','fs','vm','P','__dirname',harnessSource+';return harness;')(require,fs,vm,P,__dirname);
const host=harness(),guest=harness(),events={host:{},guest:{}};
const bridge=spawn(process.env.RR_RTC_PYTHON||'python3',[__dirname+'/rtc-bridge.py'],{stdio:['pipe','pipe','pipe']});
let ready=false,failure=null,received=0,largest=0;
bridge.stderr.on('data',data=>process.stderr.write(data));
bridge.on('error',error=>failure=error);
bridge.on('exit',code=>{if(code)failure=Error('RTC process exited '+code);});
createInterface({input:bridge.stdout}).on('line',line=>{
 try{const message=JSON.parse(line);if(message.event==='ready'){ready=true;console.log('PASS transport:',JSON.stringify(message));}
 else if(message.event==='message'){received++;events[message.side].data(message.data);}}catch(error){failure=error;}
});
function connection(side){return {open:true,bufferSize:0,peer:side==='host'?'guest-rtc':'host-rtc',on:(name,fn)=>events[side][name]=fn,send(data){const packet=JSON.stringify({side,data});largest=Math.max(largest,Buffer.byteLength(packet));bridge.stdin.write(packet+'\n');}};}
async function until(predicate,label){const end=Date.now()+10000;while(!predicate()){if(failure)throw failure;if(Date.now()>end)throw Error('Timed out: '+label);await new Promise(resolve=>setTimeout(resolve,10));}}
(async()=>{
 try{
  await until(()=>ready,'real RTC connection');
  host.host();host.roomTest({id:'host-rtc'},'host-token-0123456789');guest.roomTest(null,'guest-token-0123456789');
  host.wire(connection('host'),0);guest.wire(connection('guest'),0);events.host.open();events.guest.open();
  await until(()=>host.state().connections===1&&guest.state().localId===1,'join handshake');
  console.log('PASS host/join: production ready/welcome/lobby messages crossed real RTC');
  host.start('online');await until(()=>guest.state().players.length===2,'run start');
  assert.equal(guest.state().wave,1);assert.notEqual(guest.state().players[0].color,guest.state().players[1].color);
  const initialX=host.state().players[1].x;
  guest.send({t:'input',dx:1,dy:0,angle:0,fire:true,dash:0});
  await new Promise(resolve=>setTimeout(resolve,100));host.simulate(.05);host.sendState();
  await until(()=>guest.state().players[1].x>initialX,'remote movement');
  console.log('PASS play: two ships, remote input, authoritative movement and replicated state');
  host.openShop();host.state().players[1].materials=1000;host.sendState();
  await until(()=>guest.state().between&&guest.state().players[1].materials===1000,'shop');
  const shopper=guest.state().players[1],offer=shopper.shop[0],oldCount=host.state().players[1].weapons.length;
  guest.send({t:'shop',action:'buy',uid:offer.uid,wave:1,revision:shopper.revision});
  await until(()=>host.state().players[1].weapons.length===oldCount+1,'remote purchase');
  assert.equal(host.state().players[0].weapons.length,1);
  console.log('PASS shop: remote purchase reaches host and affects only the owning ship');
  host.setEnemies(Array.from({length:160},(_,id)=>({id,type:'tank',x:100+id,y:100,r:22,hp:300,maxHp:300,speed:80,hit:0,burn:0,burnDamage:0,attack:1,windup:0,aim:0,charge:0,slow:0,slowTime:0})));host.sendState(true);
  await until(()=>guest.state().enemies.length===160,'large checkpoint');assert(largest>16384);
  console.log('PASS large checkpoint:',largest,'bytes; messages received:',received);
  console.log('PASS real peer-to-peer game integration (local runtime, no relay)');
 }finally{bridge.stdin.write(JSON.stringify({stop:true})+'\n');bridge.stdin.end();}
})().catch(error=>{console.error(error);process.exitCode=1;bridge.kill();});
