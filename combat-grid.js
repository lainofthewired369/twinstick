/* Conservative broad phase; existing swept collision remains the final authority. */
(() => {
'use strict';
function create(entities,Sphere,spherical=false){
 const cells=new Map(),size=80;let radius=0;
 const point=p=>spherical?Sphere.basis(p).n.map(v=>v*Sphere.R):[p.x,p.y,0];
 const key=(x,y,z)=>x+','+y+','+z;
 for(const e of entities){if(e.hp<=0)continue;radius=Math.max(radius,e.r||0);const p=point(e),k=key(...p.map(v=>Math.floor(v/size)));if(!cells.has(k))cells.set(k,[]);cells.get(k).push(e);}
 function query(a,b,padding=0,travel=0){
  if(spherical&&travel>Sphere.R*.2)return entities;
  const p=point(a),q=point(b),margin=radius+padding+2+(spherical?travel*travel/(8*Sphere.R):0),low=p.map((v,i)=>Math.floor((Math.min(v,q[i])-margin)/size)),high=p.map((v,i)=>Math.floor((Math.max(v,q[i])+margin)/size));
  if(!spherical)low[2]=high[2]=0;
  if((high[0]-low[0]+1)*(high[1]-low[1]+1)*(high[2]-low[2]+1)>512)return entities;
  const out=[];for(let x=low[0];x<=high[0];x++)for(let y=low[1];y<=high[1];y++)for(let z=low[2];z<=high[2];z++){const cell=cells.get(key(x,y,z));if(cell)out.push(...cell);}return out;
 }
 return {query};
}
const api={create};if(typeof module!=='undefined')module.exports=api;else window.RRCombatGrid=api;
})();
