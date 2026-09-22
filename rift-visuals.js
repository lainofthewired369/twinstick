/* Shared procedural renderer for Riftbreak gameplay and its visual preview. */
(() => {
'use strict';
const TAU=Math.PI*2,colors={drone:'#ff6485',tank:'#ffc877',runner:'#ff9161',gunner:'#b497ff',charger:'#ff536b',splitter:'#bef784',swarm:'#c5ffb0',sentinel:'#78dfff',boss:'#fa8ee8'};
let backdrop=null;
function polygon(x,points,fill,stroke){x.beginPath();points.forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.closePath();if(fill){x.fillStyle=fill;x.fill();}if(stroke){x.strokeStyle=stroke;x.stroke();}}
function circle(x,a,b,r,color,width=1){x.strokeStyle=color;x.lineWidth=width;x.beginPath();x.arc(a,b,r,0,TAU);x.stroke();}
function background(x,W,H,t,reduced){
 if(!backdrop){backdrop=document.createElement('canvas');backdrop.width=W;backdrop.height=H;const b=backdrop.getContext('2d'),g=b.createLinearGradient(0,0,W,H);g.addColorStop(0,'#172c51');g.addColorStop(.45,'#11182f');g.addColorStop(1,'#311a46');b.fillStyle=g;b.fillRect(0,0,W,H);
  for(let n=0;n<120;n++){const px=(n*193.73)%W,py=(n*87.17)%H;b.fillStyle=n%3?'#86b4da45':'#ffffff9c';b.fillRect(px,py,n%7?1:2,n%7?1:2);}
  for(let y=32;y<H;y+=64)for(let a=32;a<W;a+=64){b.fillStyle=((a+y)/64)%2?'#22375338':'#344a6630';b.fillRect(a,y,59,59);b.strokeStyle='#96cef510';b.strokeRect(a,y,59,59);b.fillStyle='#7aeaff44';b.fillRect(a+2,y+2,2,2);}
  b.strokeStyle='#6dd9e766';b.lineWidth=2;b.strokeRect(20,20,W-40,H-40);b.strokeStyle='#aa89f344';b.strokeRect(27,27,W-54,H-54);
  for(let n=0;n<4;n++){b.save();b.translate(n%2?W-42:42,n<2?42:H-42);b.rotate(n%2?Math.PI:0);polygon(b,[[0,0],[80,0],[65,9],[9,9],[9,65],[0,80]],'#75eaff66');b.restore();}
 }
 x.drawImage(backdrop,0,0);x.save();x.translate(W/2,H/2);if(!reduced)x.rotate(t*.035);circle(x,0,0,235,'#92a9ff15',2);circle(x,0,0,247,'#92a9ff0c',1);for(let n=0;n<12;n++){x.rotate(TAU/12);x.fillStyle='#8bd8f21b';x.fillRect(233,-2,20,4);}x.restore();
}
function ship(x,p,t,reduced,refined=false){if(p.hp<=0)return;x.save();x.translate(p.x,p.y);x.rotate(p.angle);x.lineWidth=1.5;
 const flame=22+(reduced?0:Math.sin(t*24+p.id)*5);polygon(x,[[-14,-7],[-flame-18,0],[-14,7]],'#59bcff35');polygon(x,[[-14,-4],[-flame,0],[-14,4]],p.color);polygon(x,[[-15,-2],[-23,0],[-15,2]],'#efffff');
 // Preserve the original faceted Ranger; other ships use the same lit armor language.
 const original=[[29,0],[-16,-18],[-9,-5],[-16,18]],hull=p.character&&p.character!=='ranger'?(window.RRProgress?.hulls[p.character]||original):original;
 x.shadowColor=p.color;x.shadowBlur=13;polygon(x,hull,'#233f5c',p.color);x.shadowBlur=0;
 if(!p.character||p.character==='ranger'){polygon(x,[[24,0],[-8,-4],[-12,-13]],'#99d9e9');polygon(x,[[24,0],[-12,13],[-8,4]],'#3b6686');}
 else {for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length];polygon(x,[[0,0],a.map(v=>v*.88),b.map(v=>v*.88)],(a[1]+b[1])<0?'#99d9e9':'#3b6686');}polygon(x,[[18,0],[-12,-5],[-16,0],[-12,5]],'#233f5c');
  if(p.character==='bulwark'||p.character==='engineer'){for(const side of [-1,1]){polygon(x,[[-17,side*10],[-17,side*20],[-7,side*20],[-3,side*10]],'#294e6a',p.color);x.fillStyle='#d9ffff';x.fillRect(-20,side*15-2,6,4);}}
 }
 polygon(x,[[13,0],[-4,-5],[-8,0],[-4,5]],'#d9ffff',p.color);

 if(refined){x.strokeStyle='#e0fff599';x.lineWidth=.7;x.beginPath();x.moveTo(22,0);x.lineTo(-10,-13);x.moveTo(22,0);x.lineTo(-10,13);x.stroke();for(let k=0;k<3;k++){x.fillStyle=k%2?'#10202e':'#7bb7bc';x.fillRect(-13+k*5,-8,3,3);x.fillRect(-13+k*5,5,3,3);}x.fillStyle='#ffffff';x.fillRect(8,-1,7,2);}
 if(p.shield>0){x.globalAlpha=.3+.4*p.shield/Math.max(1,p.maxShield);circle(x,0,0,32,p.color,1.5);}x.restore();
 x.fillStyle='#060d19';x.fillRect(p.x-25,p.y+29,50,5);x.fillStyle=p.hp>30?p.color:'#ff718c';x.fillRect(p.x-25,p.y+29,50*p.hp/p.maxHp,5);
}
function enemy(x,e,t,reduced){if(e.hp<=0)return;const c=colors[e.type]||'#ff6485';x.save();
 if((e.type==='lancer'||e.beamAttack)&&e.windup>0||e.beamLeft>0){x.strokeStyle=e.beamLeft>0?'#fff1ff':'#71345d';x.lineWidth=e.beamLeft>0?12:2;x.beginPath();x.moveTo(e.x,e.y);x.lineTo(e.x+Math.cos(e.aim)*1000,e.y+Math.sin(e.aim)*1000);x.stroke();}
 x.translate(e.x,e.y);x.fillStyle='#02071588';x.beginPath();x.ellipse(3,10,e.r+6,e.r*.6,0,0,TAU);x.fill();x.rotate(e.aim||(!reduced?t*.25:0));x.lineWidth=2;
 const sides=e.type==='boss'?8:['tank','sentinel'].includes(e.type)?4:['runner','charger','gunner'].includes(e.type)?3:6,points=[];
 for(let n=0;n<sides;n++)points.push([Math.cos(n*TAU/sides)*e.r,Math.sin(n*TAU/sides)*e.r]);polygon(x,points,e.hit?'#e9f8ff':'#27344f',c);
 for(let n=0;n<sides;n++){const a=n*TAU/sides,b=(n+1)*TAU/sides;polygon(x,[[0,0],[Math.cos(a)*e.r,Math.sin(a)*e.r],[Math.cos(b)*e.r,Math.sin(b)*e.r]],n%2?'#02081855':'#cedcff13');}
 x.shadowColor=c;x.shadowBlur=10;circle(x,0,0,e.r*.43,c,2);x.fillStyle=e.hit?'#fff':c;x.fillRect(-4,-4,8,8);x.shadowBlur=0;
 if(e.type==='boss'||e.type==='sentinel'){if(!reduced)x.rotate(-t*.35);for(let n=0;n<6;n++){x.rotate(TAU/6);polygon(x,[[e.r+3,-5],[e.r+15,0],[e.r+3,5]],'#b2cfe0',c);}}
 if(e.slowTime>0)circle(x,0,0,e.r+5,'#a2efff',1);x.restore();
}
function draw(x,s){const {W=1280,H=720,t=0,reduced=false}=s;x.save();if(s.frontier&&window.RiftFrontier)window.RiftFrontier.background(x,s);else background(x,W,H,t,reduced);
 for(const d of s.drops){x.save();x.translate(d.x,d.y);x.rotate(Math.PI/4);x.shadowBlur=8;x.shadowColor=d.kind==='crate'?'#ffcf7e':'#7dffd0';polygon(x,[[-6,-6],[6,-6],[6,6],[-6,6]],'#1c4354',x.shadowColor);polygon(x,[[-3,-3],[3,-3],[3,3],[-3,3]],x.shadowColor);x.restore();}
 for(const b of s.shots){const a=Math.atan2(b.vy,b.vx);x.strokeStyle=b.color||'#7dffd0';x.lineWidth=(b.r||3)*1.5;x.globalAlpha=.35;x.beginPath();x.moveTo(b.x-Math.cos(a)*24,b.y-Math.sin(a)*24);x.lineTo(b.x,b.y);x.stroke();x.globalAlpha=1;x.fillStyle='#efffff';x.beginPath();x.arc(b.x,b.y,Math.max(2,(b.r||3)*.6),0,TAU);x.fill();}
 for(const b of s.enemyShots){x.fillStyle='#ff5f91';x.beginPath();x.arc(b.x,b.y,b.r,0,TAU);x.fill();circle(x,b.x,b.y,b.r+2,'#ffd1e380',1);}
 for(const f of s.effects){x.save();x.globalAlpha=Math.min(1,f.life*7);x.strokeStyle=f.color;x.lineWidth=5;x.beginPath();if(f.kind==='blast'){x.arc(f.x,f.y,f.r,0,TAU);x.stroke();circle(x,f.x,f.y,f.r*.78,'#eaf6ff',1);}else if(f.kind==='beam'){x.moveTo(f.x,f.y);x.lineTo(f.bx,f.by);x.stroke();x.strokeStyle='#fff';x.lineWidth=1;x.stroke();}else{x.arc(f.x,f.y,f.r,f.angle-f.arc/2,f.angle+f.arc/2);x.stroke();}x.restore();}
 for(const e of s.enemies){if(e.mirror)ship(x,{...e,angle:e.aim,color:e.hit?'#ffffff':e.color},t,reduced,s.frontier);else enemy(x,e,t,reduced);}for(const p of s.players)ship(x,p,t,reduced,s.frontier);
 for(const p of s.particles){x.globalAlpha=Math.max(0,Math.min(1,p.life*2));x.strokeStyle=p.color;x.lineWidth=2;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(p.x-p.vx*.025,p.y-p.vy*.025);x.stroke();}x.globalAlpha=1;
 if(s.paused){x.fillStyle='#040819aa';x.fillRect(0,0,W,H);x.textAlign='center';x.fillStyle='#e8f7ff';x.font='700 40px system-ui';x.fillText('PAUSED',W/2,H/2);}x.restore();
}
function fracture(x,left,reduced=false,W=1280,H=720,target=1){if(left<=0)return;if(target===1.5)window.RiftFrontier?.walls(x,left,reduced,W,H);const age=3-left,cx=W*.5,cy=H*.5;x.save();
 if(!reduced){const spread=Math.min(1,age/.85),fade=Math.min(1,left/.7);x.globalAlpha=fade;
  for(let n=0;n<13;n++){const a=n*TAU/13+.08*Math.sin(n*3),length=Math.hypot(W,H)*.7*spread;x.beginPath();x.moveTo(cx,cy);for(let j=1;j<=5;j++){const r=length*j/5,aa=a+Math.sin(n*7+j)*.04;x.lineTo(cx+Math.cos(aa)*r,cy+Math.sin(aa)*r);}x.strokeStyle='#01020be0';x.lineWidth=7;x.stroke();x.strokeStyle='#a5e7ff';x.lineWidth=1.4;x.stroke();
   if(age>.55){const r=80+(n%4)*55,px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r;polygon(x,[[px,py],[px+Math.cos(a+.4)*70,py+Math.sin(a+.4)*70],[px+Math.cos(a-.2)*110,py+Math.sin(a-.2)*110]],'#c4dcff14','#c2edff66');}
  }
  const light=Math.max(0,1-Math.abs(age-1.4)/.35)*.22;x.globalAlpha=light;x.fillStyle='#d4edff';x.fillRect(0,0,W,H);
 }
 x.globalAlpha=Math.min(1,age*3,left*2);x.fillStyle='#081224ed';x.fillRect(cx-320,cy-48,640,98);x.textAlign='center';x.fillStyle='#b4f7ff';x.font='700 32px system-ui';x.fillText(age<1.4?(target===3?'WORLD REFORGED':target===2?'DIMENSIONS FRACTURED':target===1.5?'CONTAINMENT SHATTERED':'REALITY FRACTURED'):(target===3?'LAYER V // PLANET ONLINE':target===2?'LAYER IV // ENTERING 3D':target===1.5?'LAYER III // ENDLESS FRONTIER':'RIFT LAYER II // UNLOCKED'),cx,cy-4);x.font='13px system-ui';x.fillStyle='#aec3de';x.fillText(target===3?'NO EDGES · FOLLOW THE CURVE · KEEP MOVING':target===2?'DEPTH RECONSTRUCTED · 3D WORLD ONLINE':target===1.5?'WALLS DESTROYED · EXPLORE IN EVERY DIRECTION':'SIGNAL RECONSTRUCTED · VISUAL SYSTEMS EVOLVED',cx,cy+24);x.restore();
}
window.RiftVisual={draw,fracture};
})();
