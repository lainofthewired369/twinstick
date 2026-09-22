/* Original indexed low-poly models, built once and reused. Local +X is forward, +Z is up. */
(() => {
'use strict';
const cache=new Map();
function build(type,low=false){
 const vertices=[],faces=[],segments=low?4:8;
 function tube(stations,y=0,z=0,material='hull',count=segments){
  if(low&&stations.length>3)stations=[stations[0],stations[Math.floor(stations.length/2)],stations.at(-1)];
  if(stations[0][0]>stations.at(-1)[0])stations=[...stations].reverse();
  const start=vertices.length;
  for(const [x,ry,rz] of stations)for(let j=0;j<count;j++){const a=j*Math.PI*2/count;vertices.push([x,y+Math.cos(a)*ry,z+Math.sin(a)*rz]);}
  for(let i=0;i<stations.length-1;i++)for(let j=0;j<count;j++){const a=start+i*count+j,b=start+i*count+(j+1)%count,c=b+count,d=a+count;faces.push([a,b,c,material],[a,c,d,material]);}
  for(let j=1;j<count-1;j++){faces.push([start,start+j+1,start+j,material]);const end=start+(stations.length-1)*count;faces.push([end,end+j,end+j+1,material]);}
 }
 function wing(points,material='trim',depth=2){
  if(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-p[1]*q[0];},0)<0)points=[...points].reverse();
  const start=vertices.length,n=points.length;vertices.push(...points,...points.map(([x,y,z])=>[x,y,z-depth]));
  for(let j=1;j<n-1;j++)faces.push([start,start+j,start+j+1,material],[start+n,start+n+j+1,start+n+j,'dark']);
  for(let j=0;j<n;j++){const k=(j+1)%n;faces.push([start+j,start+n+j,start+n+k,material],[start+j,start+n+k,start+k,material]);}
 }
 const hull=(length=28,width=8)=>tube([[-23,3,3],[-16,width*.8,5],[0,width,7],[length*.65,4,4],[length,.3,.3]],0,10);
 const engine=y=>{tube([[-14,3.5,3.5],[-24,4,4],[-27,3,3]],y,8,'dark');tube([[-27,2.4,2.4],[-28,1.8,1.8]],y,8,'engine');};
 const gun=(y,x=0)=>tube([[x-8,2,2],[x+12,2,2],[x+17,1,1]],y,10,'weapon',low?4:6);
 if(type==='ship'||type==='runner'||type==='charger'||type==='gunner'||type==='swarm'){
  hull(type==='charger'?34:28,type==='swarm'?5:8);
  for(const side of [-1,1])wing([[10,side*5,9],[-11,side*(type==='runner'?14:24),5],[-23,side*19,4],[-10,side*4,9]]);
  tube([[-9,1,1],[-4,4,3],[6,3,3],[13,.2,.2]],0,17,'glass');
  if(!low){for(const side of [-1,1])engine(side*10);wing([[-8,0,15],[-24,0,25],[-23,2,10],[-8,2,10]],'hull',1);}
  if(type==='gunner'){gun(-16,5);gun(16,5);}else if(type==='ship'&&!low){gun(-15);gun(15);}
 }else if(type==='tank'||type==='sentinel'||type==='boss'||type==='lancer'){
  tube([[-21,9,4],[-13,17,7],[10,16,7],[20,8,3]],0,9);
  for(const side of [-1,1]){tube([[-23,3,4],[-18,5,6],[16,5,6],[22,3,4]],side*18,7,'dark');if(!low)engine(side*18);}
  tube([[-11,5,3],[-4,10,5],[7,7,5],[12,3,2]],0,20,'trim');gun(0,type==='lancer'?18:9);
  tube([[-4,1,1],[0,4,3],[4,1,1]],0,26,'glass');
  if(type==='boss'||type==='sentinel'){gun(-12,7);gun(12,7);for(const side of [-1,1])wing([[5,side*12,10],[-5,side*31,14],[-24,side*26,9],[-18,side*12,9]]);}
 }else{
  tube([[-17,1,1],[-12,10,7],[0,15,11],[12,10,7],[17,1,1]],0,13);
  tube([[-5,1,1],[0,6,4],[5,1,1]],0,25,'glass');
  for(const side of [-1,1]){wing([[9,side*8,14],[-2,side*25,8],[-16,side*21,5],[-12,side*7,12]]);if(type==='splitter')tube([[-11,1,1],[0,7,6],[11,1,1]],side*18,12,'trim');}
  if(!low)engine(0);
 }
 return {vertices,faces,type,low};
}
function get(type='ship',low=false){const key=type+':'+low;if(!cache.has(key))cache.set(key,build(type,low));return cache.get(key);}
const api={get};if(typeof module!=='undefined')module.exports=api;else window.RiftModels=api;
})();
