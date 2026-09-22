/* Seeded, streamed scenery: no terrain network traffic or unbounded world cache. */
(() => {
'use strict';
const SIZE=384,cache=new Map();
function hash(x,y,seed){let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^(seed|0);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
function chunk(cx,cy,seed){return Array.from({length:18},(_,i)=>({x:48+hash(cx*19+i,cy,seed)*288,y:48+hash(cx,cy*23+i,seed+1)*288,r:6+hash(cx+i,cy-i,seed+2)*28,type:Math.floor(hash(cx-i,cy+i,seed+3)*4),turn:hash(cx+i,cy+i,seed+4)*6.28}));}
function tile(cx,cy,seed){const key=seed+':'+cx+':'+cy;if(cache.has(key)){const found=cache.get(key);cache.delete(key);cache.set(key,found);return found;}
 const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;const c=canvas.getContext('2d');
 c.fillStyle='#142a30';c.fillRect(0,0,SIZE,SIZE);
 for(let y=0;y<SIZE;y+=24)for(let x=0;x<SIZE;x+=24){const n=hash(cx*16+x/24,cy*16+y/24,seed);c.fillStyle=n>.65?'#193338':n>.3?'#162e33':'#12272e';c.fillRect(x,y,24,24);c.fillStyle='#80b7a516';c.fillRect(x+n*18,y+6,2,1);}
 // Long buried conduits line up exactly across chunk boundaries.
 c.fillStyle='#0d2027';c.fillRect(0,184,SIZE,16);c.fillRect(184,0,16,SIZE);c.fillStyle='#417371';c.fillRect(0,186,SIZE,1);c.fillRect(186,0,1,SIZE);
 for(const p of chunk(cx,cy,seed)){c.save();c.translate(p.x,p.y);c.rotate(p.turn);const r=p.r;
  c.fillStyle='#06151b99';c.beginPath();c.ellipse(5,8,r+5,r*.6,0,0,Math.PI*2);c.fill();
  if(p.type===0){c.fillStyle='#38565b';c.fillRect(-r,-r*.45,r*2,r*.9);c.fillStyle='#6b8585';c.fillRect(-r,-r*.45,r*2,3);c.strokeStyle='#a2c6ba50';c.strokeRect(-r+5,-r*.45+6,r*2-10,r*.9-12);c.fillStyle='#70e1c6';c.fillRect(-r+5,-3,7,2);}
  else if(p.type===1){for(let k=0;k<3;k++){c.save();c.translate(k*7-7,k%2*6);c.beginPath();c.moveTo(0,-r);c.lineTo(8,0);c.lineTo(0,10);c.lineTo(-6,0);c.closePath();c.fillStyle=k%2?'#427f88':'#5fa9ae';c.fill();c.strokeStyle='#9ce8d4';c.lineWidth=1;c.stroke();c.beginPath();c.moveTo(0,-r);c.lineTo(0,10);c.stroke();c.restore();}}
  else if(p.type===2){c.fillStyle='#234348';c.beginPath();c.moveTo(-r,0);c.lineTo(-r*.5,-r*.6);c.lineTo(r*.6,-r*.5);c.lineTo(r,r*.3);c.lineTo(0,r*.6);c.closePath();c.fill();c.strokeStyle='#46676b';c.stroke();c.beginPath();c.moveTo(-r*.5,-r*.6);c.lineTo(0,0);c.lineTo(r,r*.3);c.stroke();}
  else{c.strokeStyle='#335556';c.lineWidth=3;for(let k=0;k<5;k++){c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(k*6-12,-r*.3,k*7-14,-r);c.stroke();}c.fillStyle='#89c5a880';c.fillRect(-2,-r,3,3);}
  c.restore();
 }
 cache.set(key,canvas);while(cache.size>32)cache.delete(cache.keys().next().value);return canvas;
}
function background(c,s){const {W=1280,H=720,fieldCamera={x:640,y:360},worldSeed=1}=s,left=fieldCamera.x-W/2,top=fieldCamera.y-H/2;
 c.fillStyle='#142a30';c.fillRect(0,0,W,H);const minX=Math.floor(left/SIZE),minY=Math.floor(top/SIZE);
 for(let y=minY;y<=Math.floor((top+H)/SIZE);y++)for(let x=minX;x<=Math.floor((left+W)/SIZE);x++)c.drawImage(tile(x,y,worldSeed),Math.round(x*SIZE-left),Math.round(y*SIZE-top));
 const light=c.createRadialGradient(W*.5,H*.5,80,W*.5,H*.5,W*.65);light.addColorStop(0,'#b3ffe209');light.addColorStop(1,'#020e244f');c.fillStyle=light;c.fillRect(0,0,W,H);
}
function walls(c,left,reduced,W,H){const age=3-left,t=Math.min(1,age/1.4),fade=Math.max(0,1-age/2.5);c.save();c.globalAlpha=fade;c.strokeStyle='#bbfff0';c.lineWidth=3;
 for(let i=0;i<32;i++){const horizontal=i<20,side=i%2?1:-1,along=horizontal?(i/2+.5)*W/10:(Math.floor((i-20)/2)+.5)*H/6;
 const x=horizontal?along:(side<0?18:W-18),y=horizontal?(side<0?18:H-18):along;
 c.save();c.translate(x+(horizontal?0:side*t*120),y+(horizontal?side*t*120:0));if(!reduced)c.rotate(side*t*(.2+i%3*.2));c.fillStyle='#498c8e';c.fillRect(horizontal?-W/22:-6,horizontal?-6:-H/14,horizontal?W/11:12,horizontal?12:H/7);c.strokeRect(horizontal?-W/22:-6,horizontal?-6:-H/14,horizontal?W/11:12,horizontal?12:H/7);c.restore();}
 c.restore();
}
const api={chunk,hash,background,walls};if(typeof module!=='undefined')module.exports=api;else window.RiftFrontier=api;
})();
