/* Layer III: native WebGL meshes with lit, extruded geometry. No CDN dependency. */
(() => {
'use strict';
const W=1280,H=720,TAU=Math.PI*2;
const colors={drone:'#ff6485',tank:'#ffc877',runner:'#ff9161',gunner:'#b497ff',charger:'#ff536b',splitter:'#bef784',swarm:'#c5ffb0',sentinel:'#78dfff',boss:'#fa8ee8'};
let canvas,gl,program,buffer,failed=false,lost=false,used=0,data=new Float32Array(262144),palette={},sphereMode=false,focus={x:640,y:360},sphereUniform,software,softwareContext,backend='pending',reason='';
function init(){
 try{
  canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
  gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,preserveDrawingBuffer:false});
  if(!gl)throw Error('WebGL unavailable');
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;gl=null;failed=false;});
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const vs=shader(gl.VERTEX_SHADER,`attribute vec3 position;attribute vec3 normal;attribute vec3 color;varying vec3 tint;uniform float sphereMode;
   void main(){vec3 light=normalize(vec3(-0.5,-0.8,1.0));float shade=0.38+0.62*max(0.0,dot(normal,light));float gleam=pow(max(0.0,dot(normal,normalize(light+vec3(0.0,0.0,1.0)))),24.0)*0.3*sphereMode;tint=color*shade+vec3(gleam);
   // Oblique orthographic camera: the ground plane keeps exact input coordinates.
   gl_Position=vec4((position.x+position.z*0.45*(1.0-sphereMode))/640.0-1.0,1.0-(position.y-position.z*0.65*(1.0-sphereMode))/360.0,-position.z/1024.0,1.0);}`);
  const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 tint;void main(){gl_FragColor=vec4(tint,1.0);}`);
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  sphereUniform=gl.getUniformLocation(program,'sphereMode');gl.deleteShader(vs);gl.deleteShader(fs);buffer=gl.createBuffer();gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [i,name] of ['position','normal','color'].entries()){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,i*12);}
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.025,.035,.075,1);
  return true;
 }catch(e){reason=e.message;failed=true;return false;}
}
function rgb(c){return palette[c]||(palette[c]=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255));}
function triangle(a,b,c,color,projected=false){
 if(sphereMode&&!projected){const project=p=>{const q=window.RRSphere.project({x:p[0],y:p[1]},focus,p[2]);return [q.x,q.y,q.z];};a=project(a);b=project(b);c=project(c);}
 const u=b.map((v,i)=>v-a[i]),v=c.map((q,i)=>q-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n)||1,t=rgb(color);
 if(used+27>data.length){const larger=new Float32Array(data.length*2);larger.set(data);data=larger;}
 for(const p of [a,b,c]){for(const q of p)data[used++]=q;for(const q of n)data[used++]=q/len;for(const q of t)data[used++]=q;}
}
function prism(x,y,points,z,height,color,angle=0,scale=.82){
 const ca=Math.cos(angle),sa=Math.sin(angle),at=(p,h,s=1)=>{const dx=(p[0]*ca-p[1]*sa)*s,dy=(p[0]*sa+p[1]*ca)*s;if(sphereMode){const q=window.RRSphere.step({x,y},dx,dy);return [q.x,q.y,h];}return [x+dx,y+dy,h];};
 for(let n=0;n<points.length;n++){
  const p=points[n],q=points[(n+1)%points.length],a=at(p,z),b=at(q,z),c=at(q,z+height,scale),d=at(p,z+height,scale);
  triangle([x,y,z+height],d,c,color);triangle(a,b,c,color);triangle(a,c,d,color);
 }
}
const rectangle=(w,h)=>[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]];
function pointAt(x,y,dx,dy){return sphereMode?window.RRSphere.step({x,y},dx,dy):{x:x+dx,y:y+dy};}
function box(x,y,w,h,z,depth,color,angle=0){prism(x,y,rectangle(w,h),z,depth,color,angle,1);}
function polygon(r,sides=6){return Array.from({length:sides},(_,i)=>[Math.cos(i*TAU/sides)*r,Math.sin(i*TAU/sides)*r]);}
function line(ax,ay,bx,by,z,width,color){
 if(sphereMode){const S=window.RRSphere,start={x:ax,y:ay},d=S.delta(start,{x:bx,y:by}),count=Math.max(1,Math.ceil(d.distance/24));
 for(let i=0;i<count;i++){const mid=S.step(start,d.x,d.y,(i+.5)/count),end=S.step(start,d.x,d.y,(i+1)/count),t=S.delta(mid,end);box(mid.x,mid.y,d.distance/count,width,z,.8,color,Math.atan2(t.y,t.x));}return;}
 box((ax+bx)/2,(ay+by)/2,Math.hypot(bx-ax,by-ay),width,z,.8,color,Math.atan2(by-ay,bx-ax));
}
function ring(x,y,r,z,color,start=0,arc=TAU){for(let i=0;i<32;i++){const a=start+arc*i/32,b=start+arc*(i+1)/32;if(sphereMode){const p=window.RRSphere.step({x,y},Math.cos(a)*r,Math.sin(a)*r),q=window.RRSphere.step({x,y},Math.cos(b)*r,Math.sin(b)*r);line(p.x,p.y,q.x,q.y,z,2,color);}else line(x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(b)*r,y+Math.sin(b)*r,z,2,color);}}
function shadow(x,y,r){prism(x+7,y+9,polygon(r,10),.2,0,'#080d20',0,1);}
function model(type,p,angle,color,scale=1,low=false){
 const mesh=window.RiftModels?.get(type,low);if(!mesh)return false;
 const materials={hull:'#536c87',trim:color,dark:'#152639',glass:'#9aecff',engine:'#65eaff',weapon:'#afbed1'},ca=Math.cos(angle),sa=Math.sin(angle);
 const points=mesh.vertices.map(([vx,vy,vz])=>{const at=pointAt(p.x,p.y,(vx*ca-vy*sa)*scale,(vx*sa+vy*ca)*scale),q=window.RRSphere.project(at,focus,vz*scale);return [q.x,q.y,q.z];});
 for(const [a,b,c,material] of mesh.faces)triangle(points[a],points[b],points[c],p.hit?'#ffffff':materials[material],true);
 return true;
}
function softwareDraw(){
 if(!software){software=document.createElement('canvas');software.width=960;software.height=540;softwareContext=software.getContext('2d');}
 if(!softwareContext)return false;
 const x=softwareContext,faces=[],scale=sphereMode?1:.75;if(software.width!==W*scale){software.width=W*scale;software.height=H*scale;}x.setTransform(scale,0,0,scale,0,0);x.fillStyle='#060913';x.fillRect(0,0,W,H);
 for(let i=0;i<used;i+=27)faces.push(i);
 faces.sort((a,b)=>(data[a+2]+data[a+11]+data[a+20])-(data[b+2]+data[b+11]+data[b+20]));
 const lightLength=Math.hypot(.5,.8,1);
 for(const i of faces){
  const shade=.38+.62*Math.max(0,(-.5*data[i+3]-.8*data[i+4]+data[i+5])/lightLength);
  x.fillStyle='rgb('+[6,7,8].map(n=>Math.round(data[i+n]*shade*255)).join(',')+')';x.beginPath();
  for(let n=0;n<3;n++){const j=i+n*9,px=data[j]+(sphereMode?0:data[j+2]*.45),py=data[j+1]-(sphereMode?0:data[j+2]*.65);if(n)x.lineTo(px,py);else x.moveTo(px,py);}
  x.closePath();x.fill();
 }
 return true;
}
function draw(x,s){
 sphereMode=!!s.sphere&&!!window.RRSphere;focus=s.focus||s.players.find(p=>p.hp>0)||{x:640,y:360};
 const hardware=!failed&&!lost&&(gl||init());
 used=0;
 if(sphereMode){
  for(let iy=0;iy<30;iy++)for(let ix=0;ix<60;ix++){const ax=ix*W/60,bx=(ix+1)*W/60,ay=iy*H/30,by=(iy+1)*H/30,c=(ix+iy)%2?'#315b69':'#25414f';triangle([ax,ay,-10],[bx,ay,-10],[bx,by,-10],c);triangle([ax,ay,-10],[bx,by,-10],[ax,by,-10],c);}
 }else if(s.frontier){
 box(W/2,H/2,W+200,H+200,-18,17,'#142a30');
 const left=s.fieldCamera.x-W/2,top=s.fieldCamera.y-H/2;
 for(let iy=Math.floor(top/96);iy<=Math.ceil((top+H)/96);iy++)for(let ix=Math.floor(left/96);ix<=Math.ceil((left+W)/96);ix++){
  const px=ix*96-left,py=iy*96-top;box(px,py,93,93,-1,.8,(ix+iy)%2?'#234447':'#1b343c');
  const n=window.RiftFrontier?.hash(ix,iy,s.worldSeed)||0;if(n>.87)prism(px,py,polygon(10+n*12,5),0,18+n*12,'#51858a',n*6,.4);
 }
 }else{
 // Raised arena floor, recessed tiles, pylons and a luminous perimeter.
 box(W/2,H/2,W-18,H-18,-18,17,'#182a49');
 for(let py=40;py<H-20;py+=64)for(let px=40;px<W-20;px+=64){box(px,py,60,60,-1,.8,(Math.floor(px/64)+Math.floor(py/64))%2?'#233e59':'#1b304b');}
 for(const y of [13,H-13]){box(W/2,y,W-22,8,0,8,'#53648c');box(W/2,y,W-26,2,8,1,'#a8b8ff');}
 for(const a of [13,W-13]){box(a,H/2,8,H-22,0,8,'#53648c');box(a,H/2,2,H-26,8,1,'#87efff');}
 for(const a of [28,W-40])for(const b of [40,H-22]){box(a,b,18,18,0,30,'#476888');box(a,b,12,12,30,4,'#a5faff');}
 }
 for(const d of s.drops){const c=d.kind==='crate'?'#ffd180':'#7dffd0';shadow(d.x,d.y,8);prism(d.x,d.y,polygon(8,4),4,12,c,s.reduced?0:s.t*.6,.15);}
 let detailed=0;
 const visible=p=>!sphereMode||window.RRSphere.project(p,focus).visible;
 for(const e of s.enemies){
  if(e.hp<=0||e.mirror||!visible(e))continue;const c=e.hit?'#ffffff':colors[e.type]||colors.drone,h=e.type==='boss'?46:e.type==='tank'?26:18;
  shadow(e.x,e.y,e.r+4);
  if((e.type==='lancer'||e.beamAttack)&&e.windup>0||e.beamLeft>0){const end=pointAt(e.x,e.y,Math.cos(e.aim)*(sphereMode?600:1000),Math.sin(e.aim)*(sphereMode?600:1000));line(e.x,e.y,end.x,end.y,1,e.beamLeft>0?12:2,e.beamLeft>0?'#fff1ff':'#71345d');}
  if(sphereMode&&model(e.type,e,e.aim||0,c,e.r/25,!hardware||detailed++>=40)){if(e.slowTime>0)ring(e.x,e.y,e.r+5,3,'#a2efff');continue;}
  const sides=['runner','charger','gunner'].includes(e.type)?3:['tank','sentinel'].includes(e.type)?4:6;
  prism(e.x,e.y,polygon(e.r,sides),2,h,c,e.aim||0,.75);
  prism(e.x,e.y,polygon(e.r*.55,sides),h+2,6,'#20314e',e.aim||0,.6);
  prism(e.x,e.y,polygon(5,4),h+8,5,'#e9fcff',0,.25);
  if(e.type==='boss'||e.type==='sentinel')for(let n=0;n<6;n++){const a=n*TAU/6+(s.reduced?0:s.t*.35),at=pointAt(e.x,e.y,Math.cos(a)*(e.r+6),Math.sin(a)*(e.r+6));box(at.x,at.y,17,7,12,12,c,a);}
  if(e.slowTime>0)ring(e.x,e.y,e.r+5,3,'#a2efff');
 }
 for(const p of [...s.players,...s.enemies.filter(e=>e.mirror).map(e=>({...e,angle:e.aim,color:e.hit?'#ffffff':e.color}))]){
  if(p.hp<=0||!visible(p))continue;shadow(p.x,p.y,27);
  const modeled=sphereMode&&model('ship',p,p.angle,p.color,p.mirror?1.15:.85,!hardware);
  if(!modeled){
  prism(p.x,p.y,[[30,0],[-19,20],[-10,0],[-19,-20]],3,12,p.color,p.angle,.65);
  prism(p.x,p.y,[[16,0],[-8,7],[-8,-7]],15,8,'#d4f8ff',p.angle,.4);
  }
  for(let n=0;n<(p.weapons?.length||1);n++){const side=n%2?1:-1,px=-7-Math.floor(n/2)*5,py=side*(13+Math.floor(n/2)*4),ca=Math.cos(p.angle),sa=Math.sin(p.angle),at=pointAt(p.x,p.y,px*ca-py*sa,px*sa+py*ca);box(at.x,at.y,21,4,9,6,'#a7c3df',p.angle);}
  const length=s.reduced?19:19+Math.sin(s.t*24)*4;
  const engine=pointAt(p.x,p.y,-Math.cos(p.angle)*19,-Math.sin(p.angle)*19);prism(engine.x,engine.y,[[0,-6],[-length,0],[0,6]],5,4,'#7feeff',p.angle,.25);
  if(sphereMode&&!modeled){prism(p.x,p.y,polygon(6,8),22,5,'#88e8ff',0,.6);for(const side of [-1,1]){const at=pointAt(p.x,p.y,Math.cos(p.angle+side*1.7)*16,Math.sin(p.angle+side*1.7)*16);prism(at.x,at.y,polygon(4,6),13,5,'#f1ffff',0,.7);}}
  if(p.shield>0)ring(p.x,p.y,33,10,p.color);
 }
 for(const b of s.shots){const a=Math.atan2(b.vy,b.vx);box(b.x,b.y,Math.max(8,(b.r||3)*3),Math.max(3,b.r||3),6,4,b.color||'#7dffd0',a);}
 for(const b of s.enemyShots)prism(b.x,b.y,polygon(b.r,6),4,b.r*1.4,'#ff608d',0,.4);
 for(const f of s.effects){if(f.kind==='beam')line(f.x,f.y,f.bx,f.by,9,4,f.color);else ring(f.x,f.y,f.r,4,f.color,f.kind==='blast'?0:f.angle-f.arc/2,f.kind==='blast'?TAU:f.arc);}
 for(const p of s.particles.slice(-160))box(p.x,p.y,3,3,Math.max(2,p.life*18),3,p.color);
 if(hardware){const width=sphereMode?1280:960;if(canvas.width!==width){canvas.width=width;canvas.height=width*9/16;}gl.uniform1f(sphereUniform,sphereMode?1:0);gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data.subarray(0,used),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,used/9);backend='WebGL';}
 else if(softwareDraw())backend='software';else return false;
 x.drawImage(hardware?canvas:software,0,0,W,H);
 if(sphereMode){
  x.save();x.strokeStyle='#7feaff66';x.lineWidth=3;x.beginPath();x.arc(640,360,452,0,TAU);x.stroke();x.strokeStyle='#8ab8ff22';x.lineWidth=8;x.stroke();
  for(let i=0;i<75;i++){const a=(i*193.17)%1280,b=(i*79.3)%720;if(Math.hypot(a-640,b-360)>460){x.fillStyle=i%3?'#9ac4dc77':'#ffffff';x.fillRect(a,b,i%5?1:2,1);}}x.restore();
 }
 for(const p of s.players){if(p.hp<=0)continue;const q=sphereMode?window.RRSphere.project(p,focus,20):p;if(q.visible===false)continue;x.fillStyle='#060d19';x.fillRect(q.x-25,q.y+29,50,5);x.fillStyle=p.color;x.fillRect(q.x-25,q.y+29,50*Math.max(0,p.hp)/p.maxHp,5);if(sphereMode){x.font='bold 11px system-ui';x.textAlign='center';x.fillText('P'+(p.id+1),q.x,q.y+47);}}

 if(s.paused){x.fillStyle='#040819bb';x.fillRect(0,0,W,H);x.textAlign='center';x.fillStyle='#e8f7ff';x.font='700 40px system-ui';x.fillText('PAUSED',W/2,H/2);}
 return true;
}
window.Rift3D={draw,get backend(){return backend;},get reason(){return reason;}};
})();
