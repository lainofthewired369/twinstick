/* Great-circle movement and local tangent geometry for the looping planet. */
(() => {
'use strict';
const W=1280,H=720,R=W/Math.PI,dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function basis(p){const lon=p.x/W*Math.PI*2,lat=(.5-p.y/H)*Math.PI,c=Math.cos(lat),s=Math.sin(lat),a=Math.sin(lon),b=Math.cos(lon);return {n:[c*a,s,c*b],east:[b,0,-a],south:[s*a,-c,s*b]};}
function position(n){return {x:((Math.atan2(n[0],n[2])/(Math.PI*2)*W)%W+W)%W,y:(.5-Math.asin(Math.max(-1,Math.min(1,n[1])))/Math.PI)*H};}
function delta(a,b){const q=basis(a),n=basis(b).n,cos=Math.max(-1,Math.min(1,dot(q.n,n))),angle=Math.acos(cos),ex=dot(n,q.east),sy=dot(n,q.south),l=Math.hypot(ex,sy);if(angle<1e-8)return {x:0,y:0,distance:0};return {x:(l>1e-10?ex/l:1)*angle*R,y:(l>1e-10?sy/l:0)*angle*R,distance:angle*R};}
function step(p,vx,vy,dt=1){
 const speed=Math.hypot(vx,vy);if(!speed)return {...position(basis(p).n),vx,vy,angle:p.angle};
 const q=basis(p),t=q.east.map((v,i)=>(v*vx+q.south[i]*vy)/speed),a=speed*dt/R,c=Math.cos(a),s=Math.sin(a),n=q.n.map((v,i)=>v*c+t[i]*s),out=position(n),at=basis(out),velocity=t.map((v,i)=>(v*c-q.n[i]*s)*speed);
 out.vx=dot(velocity,at.east);out.vy=dot(velocity,at.south);
 if(Number.isFinite(p.angle)){const axis=cross(q.n,t),look=q.east.map((v,i)=>v*Math.cos(p.angle)+q.south[i]*Math.sin(p.angle)),turn=cross(axis,look),along=dot(axis,look),transport=look.map((v,i)=>v*c+turn[i]*s+axis[i]*along*(1-c));out.angle=Math.atan2(dot(transport,at.south),dot(transport,at.east));}
 return out;
}
function cameraBasis(focus){const q=basis(focus),a=focus.cameraAngle||0,c=Math.cos(a),s=Math.sin(a);return {n:q.n,east:q.east.map((v,i)=>v*c+q.south[i]*s),south:q.south.map((v,i)=>v*c-q.east[i]*s)};}
function project(p,focus,height=0){const q=cameraBasis(focus),n=basis(p).n,r=450+height*.225;return {x:640+dot(n,q.east)*r,y:360+dot(n,q.south)*r,z:dot(n,q.n)*r,visible:dot(n,q.n)>0};}
function unproject(x,y,focus){let a=(x-640)/450,b=(y-360)/450,l=Math.hypot(a,b);if(l>1){a/=l;b/=l;}const z=Math.sqrt(Math.max(0,1-a*a-b*b)),q=cameraBasis(focus);return position(q.east.map((v,i)=>v*a+q.south[i]*b+q.n[i]*z));}
const api={R,basis,position,delta,step,project,unproject};if(typeof module!=='undefined')module.exports=api;else window.RRSphere=api;
})();
