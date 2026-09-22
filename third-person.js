/* Shared third-person camera and arena geometry. World x/y remain the hover plane. */
(()=>{'use strict';
const LIMIT=2400,NEAR=12,FAR=7000,FOCAL=650;
const pylons=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,r=i%2?1550:950;return {x:Math.cos(a)*r,y:Math.sin(a)*r,r:65,h:i%2?190:120};});
function camera(p){const a=Number.isFinite(p.cameraAngle)?p.cameraAngle:-Math.PI/2,c=Math.cos(a),s=Math.sin(a),pitch=.32,cp=Math.cos(pitch),sp=Math.sin(pitch);let back=270;while(back>90&&blocked(p,{x:p.x-c*back,y:p.y-s*back},8))back-=30;return {eye:[p.x-c*back,p.y-s*back,150*back/270],right:[-s,c,0],up:[c*sp,s*sp,cp],forward:[c*cp,s*cp,-sp]};}
function view(p,cam,h=0){const d=[p.x-cam.eye[0],p.y-cam.eye[1],h-cam.eye[2]],dot=a=>a[0]*d[0]+a[1]*d[1]+a[2]*d[2];return {x:dot(cam.right),y:dot(cam.up),z:dot(cam.forward)};}
function project(p,focus,h=0){const v=view(p,camera(focus),h);return {x:640+FOCAL*v.x/Math.max(NEAR,v.z),y:360-FOCAL*v.y/Math.max(NEAR,v.z),z:v.z,visible:v.z>=NEAR&&v.z<=FAR,scale:FOCAL/Math.max(NEAR,v.z)};}
function unproject(x,y,focus){const c=camera(focus),rx=(x-640)/FOCAL,ry=(360-y)/FOCAL,d=c.forward.map((v,i)=>v+c.right[i]*rx+c.up[i]*ry),t=d[2]<-.001?Math.min(2600,Math.max(0,-c.eye[2]/d[2])):2600;return {x:c.eye[0]+d[0]*t,y:c.eye[1]+d[1]*t};}
function resolve(p,r=15){p.x=Math.max(-LIMIT+r,Math.min(LIMIT-r,p.x));p.y=Math.max(-LIMIT+r,Math.min(LIMIT-r,p.y));for(const o of pylons){const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy),min=r+o.r;if(d<min){p.x=o.x+(d?dx/d:1)*min;p.y=o.y+(d?dy/d:0)*min;}}return p;}
function blocked(a,b,r=0){if(Math.abs(b.x)>LIMIT-r||Math.abs(b.y)>LIMIT-r)return true;const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;return pylons.some(o=>{const t=Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.y-a.y)*dy)/(len||1)));return Math.hypot(a.x+t*dx-o.x,a.y+t*dy-o.y)<o.r+r;});}
// Software fallback clips triangles at the camera near plane before perspective division.
function clip(points){let out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ai=a.z>=NEAR,bi=b.z>=NEAR;if(ai)out.push(a);if(ai!==bi){const t=(NEAR-a.z)/(b.z-a.z);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:NEAR});}}return out;}
const api={LIMIT,NEAR,FAR,FOCAL,pylons,camera,view,project,unproject,resolve,blocked,clip};if(typeof module!=='undefined')module.exports=api;else window.RRThird=api;
})();
