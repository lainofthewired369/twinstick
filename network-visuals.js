/* Presentation only: host snapshots remain the source of combat truth. */
(() => {
'use strict';
const headings=['angle','aim','cameraAngle','ramAngle'];
const angle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
function create(Sphere){
 let frames=[],local=null,signature='';
 const reset=()=>{frames=[];local=null;signature='';};
 function blend(a,b,t,sphere){
  const out={...b};
  if(sphere){const d=Sphere.delta(a,b),p=Sphere.step(a,d.x,d.y,t);out.x=p.x;out.y=p.y;
   for(const k of headings)if(Number.isFinite(a[k])&&Number.isFinite(b[k])){const left=Sphere.step({...a,angle:a[k]},d.x,d.y,t).angle,back=Sphere.delta(b,out),right=Sphere.step({...b,angle:b[k]},back.x,back.y).angle;out[k]=angle(left,right,t);}
  }else{out.x=a.x+(b.x-a.x)*t;out.y=a.y+(b.y-a.y)*t;for(const k of headings)if(Number.isFinite(a[k])&&Number.isFinite(b[k]))out[k]=angle(a[k],b[k],t);}
  return out;
 }
 function receive(state,now){
  const key=[state.wave,state.visualTier,state.running,state.paused,state.between,state.migrating,state.fractureLeft>0,state.epoch].join(':');
  if(key!==signature){reset();signature=key;}
  const frame={time:now,sphere:state.visualTier===3,open:state.visualTier===1.5||state.visualTier===2};
  for(const group of ['players','enemies','shots','enemyShots'])frame[group]=new Map((state[group]||[]).map(p=>[p.netId??p.id,{...p}]));
  frames.push(frame);if(frames.length>12)frames.shift();
 }
 function sample(group,entities,now){
  if(!frames.length)return entities;
  const time=now-100;let a=frames[0],b=a;
  for(const f of frames){b=f;if(f.time>=time)break;a=f;}
  const t=a===b?1:Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time||1)));
  return entities.map(p=>{const id=p.netId??p.id,x=a[group].get(id),y=b[group].get(id);if(!x||!y||id===undefined)return p;const pose=blend(x,y,t,b.sphere);return {...p,...Object.fromEntries(['x','y',...headings].filter(k=>Number.isFinite(pose[k])).map(k=>[k,pose[k]]))};});
 }
 function predict(p,input,dt,now,active){
  if(!p||!frames.length)return;
  if(!active||p.hp<=0||now-frames.at(-1).time>250){local=null;return;}
  const sphere=frames.at(-1).sphere;
  if(!local||local.id!==p.id)local={...p};
  const facing=sphere?(local.cameraAngle||0):0,c=Math.cos(facing),s=Math.sin(facing),slow=p.enemySlowTime>0?1-(p.enemySlow||0):1;
  const vx=p.ramLeft>0?Math.cos(p.ramAngle)*900:(input.dx*c-input.dy*s)*p.speed*slow;
  const vy=p.ramLeft>0?Math.sin(p.ramAngle)*900:(input.dx*s+input.dy*c)*p.speed*slow;
  function advance(q,seconds){if(sphere){const n=Sphere.step(q,vx,vy,seconds);return {...q,...n,cameraAngle:Sphere.step({...q,angle:q.cameraAngle||0},vx,vy,seconds).angle};}return {...q,x:frames.at(-1).open?q.x+vx*seconds:Math.max(18,Math.min(1262,q.x+vx*seconds)),y:frames.at(-1).open?q.y+vy*seconds:Math.max(18,Math.min(702,q.y+vy*seconds))};}
  local=advance(local,dt);
  const target=advance(p,Math.min(.1,Math.max(0,(now-frames.at(-1).time)/1000)+.05));
  const distance=sphere?Sphere.delta(local,target).distance:Math.hypot(local.x-target.x,local.y-target.y);
  local=distance>180?target:blend(local,target,1-Math.exp(-10*dt),sphere);
  local.angle=input.angle;
 }
 function render(state,now,id){const out={};for(const group of ['players','enemies','shots','enemyShots'])out[group]=sample(group,state[group],now);if(local&&now-frames.at(-1).time<=250)out.players=out.players.map(p=>p.id===id?{...p,x:local.x,y:local.y,angle:local.angle,cameraAngle:local.cameraAngle}:p);return out;}
 return {receive,render,predict,reset};
}
const api={create};if(typeof module!=='undefined')module.exports=api;else window.RRNetworkVisuals=api;
})();
