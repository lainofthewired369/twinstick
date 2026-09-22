/* Original procedural arcade audio. No sampled game assets. */
(() => {
'use strict';
const profiles={
 pistol:[900,180,.07,'square',.09],smg:[1100,330,.045,'square',.055],minigun:[660,120,.055,'sawtooth',.055],
 shotgun:[180,38,.18,'sawtooth',.18],sniper:[1600,70,.18,'triangle',.18],rocket:[160,32,.25,'sawtooth',.16],
 flame:[240,80,.09,'triangle',.06],laser:[1800,550,.13,'sawtooth',.07],knife:[650,160,.09,'triangle',.10],spear:[480,100,.12,'triangle',.10],
 hit:[580,200,.045,'triangle',.06],blast:[110,25,.42,'sawtooth',.24],kill:[420,90,.12,'square',.09],boss:[240,28,.7,'sawtooth',.22],
 hurt:[160,55,.18,'square',.15],pickup:[800,1400,.07,'sine',.07],ram:[100,450,.23,'sawtooth',.13]
};
const tiers=[0,1,1.5,2,3],names=['Chip arcade','Prism synth','Frontier echo','Spatial fusion','Orbital cinema'];
function voicePlan(kind,stage=0){
 const base=profiles[kind]||profiles.hit,heavy=['shotgun','rocket','blast','boss','ram'].includes(kind);
 return {from:base[0]*(stage?1+stage*.035:1),to:base[1],duration:base[2]*(1+stage*.12),type:stage>=2&&base[3]==='square'?'sawtooth':base[3],level:base[4]/(1+stage*.12),harmonic:stage>0,body:stage>=2&&heavy,echo:stage>=2,spatial:stage>=3,orbital:stage===4};
}
function create(env=window){
 let ctx,master,noise,echo,reverb,stage=0,voices=0,muted=false,freeze=0,rest=0,shake=0,amplitude=0;
 const limits=new Map(),seen=new Set();
 try{muted=env.localStorage?.getItem('rr-muted')==='1';}catch{}
 function unlock(){try{const Audio=env.AudioContext||env.webkitAudioContext;if(!Audio)return;if(!ctx){ctx=new Audio();master=ctx.createGain();master.gain.value=muted?0:.35;const compressor=ctx.createDynamicsCompressor();master.connect(compressor);compressor.connect(ctx.destination);noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}if(!echo&&ctx.createDelay){echo=ctx.createDelay(.5);echo.delayTime.value=.14;const wet=ctx.createGain();wet.gain.value=.18;echo.connect(wet);wet.connect(master);}if(!reverb&&ctx.createConvolver){reverb=ctx.createConvolver();const impulse=ctx.createBuffer(2,Math.floor(ctx.sampleRate*.8),ctx.sampleRate);for(let c=0;c<2;c++){const d=impulse.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);}reverb.buffer=impulse;const wet=ctx.createGain();wet.gain.value=.14;reverb.connect(wet);wet.connect(master);}if(ctx.state!=='running')ctx.resume()?.catch(()=>{});}catch{}}
 function sound(kind,gain=1,position={x:0,y:0}){
  if(muted||!ctx||ctx.state!=='running'||voices>=(stage>=3?16:24)||gain<.08)return;
  const now=ctx.currentTime,last=limits.get(kind)??-100;
  if(now-last<(kind==='pickup'?.09:kind==='hit'?.055:.035))return;
  limits.set(kind,now);
  const plan=voicePlan(kind,stage),{from,to,duration,type,level}=plan;
  let output=master,spatial;
  if(plan.orbital&&ctx.createPanner){spatial=ctx.createPanner();spatial.panningModel='HRTF';spatial.distanceModel='inverse';spatial.rolloffFactor=0;const px=position.x/220,pz=position.y/220-1;if(spatial.positionX){spatial.positionX.value=px;spatial.positionZ.value=pz;}else spatial.setPosition(px,0,pz);}
  else if(plan.spatial&&ctx.createStereoPanner){spatial=ctx.createStereoPanner();spatial.pan.value=Math.max(-.9,Math.min(.9,position.x/600));}
  if(spatial){spatial.connect(master);output=spatial;}
  const parts=[];

  const envelope=ctx.createGain(),osc=ctx.createOscillator();osc.type=type;
  osc.frequency.setValueAtTime(from,now);osc.frequency.exponentialRampToValueAtTime(to,now+duration);
  envelope.gain.setValueAtTime(.0001,now);envelope.gain.exponentialRampToValueAtTime(level*gain,now+.004);envelope.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(envelope);envelope.connect(output);if(plan.echo&&echo)envelope.connect(echo);if(plan.orbital&&reverb)envelope.connect(reverb);
  if(plan.harmonic){const harmonic=ctx.createOscillator(),level=ctx.createGain();harmonic.type='sine';harmonic.frequency.setValueAtTime(from*2,now);harmonic.frequency.exponentialRampToValueAtTime(to*1.5,now+duration);level.gain.value=.28;harmonic.connect(level);level.connect(envelope);harmonic.start(now);harmonic.stop(now+duration);parts.push(harmonic,level);}
  if(plan.body){const sub=ctx.createOscillator(),level=ctx.createGain();sub.type='sine';sub.frequency.setValueAtTime(90,now);sub.frequency.exponentialRampToValueAtTime(28,now+duration);level.gain.value=.6;sub.connect(level);level.connect(envelope);sub.start(now);sub.stop(now+duration);parts.push(sub,level);}
  voices++;osc.onended=()=>{voices--;osc.disconnect();envelope.disconnect();spatial?.disconnect();for(const part of parts)part.disconnect();};osc.start(now);osc.stop(now+duration+.01);
  if(['shotgun','rocket','blast','boss','flame','ram'].includes(kind)){
   const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();source.buffer=noise;filter.type='lowpass';filter.frequency.setValueAtTime(kind==='shotgun'?3500:1100,now);filter.frequency.exponentialRampToValueAtTime(90,now+duration);g.gain.setValueAtTime(level*gain*.65,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);source.connect(filter);filter.connect(g);g.connect(output);source.onended=()=>{source.disconnect();filter.disconnect();g.disconnect();};source.start(now);source.stop(now+duration);
  }
 }
 function event(e,gain=1,reduced=false,position={x:0,y:0}){
  if(seen.has(e.id))return false;seen.add(e.id);if(seen.size>512)seen.delete(seen.values().next().value);
  sound(e.kind,gain,position);
  if(reduced||gain<.15)return true;
  const heavy=e.kind==='blast'||e.kind==='boss',impact=heavy||e.kind==='sniperHit'||e.kind==='shotgunHit';
  if(impact&&rest<=0){freeze=heavy?.055:.022;rest=.3;}
  const strength=heavy?9:e.kind==='hurt'?4:e.kind==='shotgun'?2.5:e.kind==='sniperHit'?3:0;
  if(strength){shake=Math.max(shake,heavy?.42:.12);amplitude=Math.max(amplitude,strength*gain);}
  return true;
 }
 function tick(dt,reduced=false){freeze=Math.max(0,freeze-dt);rest=Math.max(0,rest-dt);shake=Math.max(0,shake-dt);amplitude*=Math.exp(-7*dt);if(reduced){freeze=shake=amplitude=0;}}
 function pose(){return {freeze:freeze>0,x:shake?(Math.random()-.5)*amplitude*2:0,y:shake?(Math.random()-.5)*amplitude*2:0};}
 function reset(){stage=0;seen.clear();freeze=rest=shake=amplitude=0;}
 function setMuted(value){muted=!!value;if(master)master.gain.setTargetAtTime(muted?0:.35,ctx.currentTime,.025);try{env.localStorage?.setItem('rr-muted',muted?'1':'0');}catch{}return muted;}
 function setTier(tier,announce=false){const next=Math.max(0,tiers.indexOf(tier===4?3:tier));if(next===stage)return false;stage=next;if(announce&&stage){const key='evolve'+stage;profiles[key]=[180+stage*80,720+stage*180,.6+stage*.08,'sine',.16];sound(key,1);}return true;}
 return {setTier,get active(){return ctx?.state==='running';},get stage(){return stage;},get name(){return names[stage];},unlock,event,tick,pose,reset,setMuted,isMuted:()=>muted};
}
const api={create,profiles,voicePlan,tiers,names};if(typeof module!=='undefined')module.exports=api;else window.RRFeedback=api;
})();
