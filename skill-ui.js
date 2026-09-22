(() => {
'use strict';
const S=window.RRSkills,$=s=>document.querySelector(s);
let current=null,buy=null,selected='core',zoom=.8,key='',built=false;
function size(center=false){const map=$('#treeMap'),world=$('#treeWorld');world.style.transform='scale('+zoom+')';$('#treeSpace').style.width=S.width*zoom+'px';$('#treeSpace').style.height=S.height*zoom+'px';$('#treeZoomOut').disabled=zoom<=.06;$('#treeZoomIn').disabled=zoom>=1.4;if(center){map.scrollLeft=S.center.x*zoom-map.clientWidth/2;map.scrollTop=S.center.y*zoom-map.clientHeight/2;}}
function setZoom(value){const map=$('#treeMap'),cx=(map.scrollLeft+map.clientWidth/2)/zoom,cy=(map.scrollTop+map.clientHeight/2)/zoom;zoom=Math.max(.06,Math.min(1.4,value));size();map.scrollLeft=cx*zoom-map.clientWidth/2;map.scrollTop=cy*zoom-map.clientHeight/2;}
function fit(){const map=$('#treeMap');zoom=Math.max(.06,Math.min(.8,Math.min(map.clientWidth/S.width,map.clientHeight/S.height)));size(true);}
function build(){if(built)return;built=true;const world=$('#treeWorld'),svg=$('#treeLines'),seen=new Set();
 for(const n of S.nodes){for(const parent of n.requires){const edge=[n.id,parent].sort().join(':');if(seen.has(edge))continue;seen.add(edge);const p=S.byId[parent],line=document.createElementNS('http://www.w3.org/2000/svg','line');for(const [k,v]of Object.entries({x1:n.x,y1:n.y,x2:p.x,y2:p.y}))line.setAttribute(k,v);line.dataset.ends=edge;svg.append(line);}
  const b=document.createElement('button');b.className='tree-node';b.id='node-'+n.id;b.style.left=(n.x-32)+'px';b.style.top=(n.y-32)+'px';b.style.setProperty('--node-color',n.color||'#ffffff');b.textContent=n.icon;b.title=n.name;b.setAttribute('aria-label',n.name);b.onclick=()=>{selected=n.id;key='';render(current,buy);};world.append(b);
 }
 $('#treeZoomOut').onclick=()=>setZoom(zoom/1.25);$('#treeZoomIn').onclick=()=>setZoom(zoom*1.25);$('#treeCenter').onclick=fit;
 $('#treeUnlock').onclick=()=>{if(current&&S.available(current,selected))buy(selected);};
}
function render(p,onBuy){if(!p)return;current=p;buy=onBuy;build();const next=p.id+':'+p.revision+':'+selected;if(next===key)return;key=next;
 $('#treePoints').textContent=p.skillPoints+' POINT'+(p.skillPoints===1?'':'S')+' · P'+(p.id+1);
 for(const n of S.nodes){const b=$('#node-'+n.id),owned=p.skills.includes(n.id);b.classList.toggle('owned',owned);b.classList.toggle('available',S.available(p,n.id));b.classList.toggle('ability',!!n.ability);b.classList.toggle('chosen',selected===n.id);b.setAttribute('aria-label',n.name+' · '+(owned?'Unlocked':n.cost+' points'));}
 for(const line of $('#treeLines').children){const ends=line.dataset.ends.split(':');line.classList.toggle('owned',ends.every(id=>p.skills.includes(id)));}
 const n=S.byId[selected],owned=p.skills.includes(selected),connected=n.requires.some(id=>p.skills.includes(id));$('#treeName').textContent=n.name;$('#treeDescription').textContent=n.desc;
 $('#treeRequirement').textContent=owned?'Unlocked for this run.':connected?'Cost: '+n.cost+' skill points.':'Connect through '+n.requires.map(id=>S.byId[id].name).join(' or ')+'.';
 $('#treeUnlock').textContent=owned?'UNLOCKED':'UNLOCK · '+n.cost+' POINTS';$('#treeUnlock').disabled=owned||p.ready||!S.available(p,selected);
 $('#treeHint').textContent=p.ready?'Cancel Ready in the shop to spend points.':'One point per level. Pan the map; choose a connected node. Use − to zoom out or FIT to see the branches. Your tree resets with a new run.';
}
function open(p,onBuy){key='';render(p,onBuy);size(true);}
window.RRSkillUI={open,render};
})();
