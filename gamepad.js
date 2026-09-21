/* Standard-mapped Xbox/PlayStation-style controllers. No device-specific IDs. */
(() => {
 const previous=new Map(),inputs=new Map();let pads=[],nextNav=0;
 function stick(x=0,y=0){const length=Math.hypot(x,y);if(length<.18)return {x:0,y:0};const amount=Math.min(1,(length-.18)/.82);return {x:x/length*amount,y:y/length*amount};}
 function frame({playing,local,onPause,onNavigate,onActive},now=0){
  pads=Array.from(typeof navigator!=='undefined'&&navigator.getGamepads?navigator.getGamepads():[]).filter(p=>p&&p.connected&&p.mapping==='standard');
  for(const id of inputs.keys())if(!pads.some(p=>p.index===id)){inputs.delete(id);previous.delete(id);}
  for(const pad of pads){
   const buttons=pad.buttons.map(b=>b.pressed||b.value>.35),old=previous.get(pad.index)||[],pressed=n=>buttons[n]&&!old[n],move=stick(pad.axes[0],pad.axes[1]),aim=stick(pad.axes[2],pad.axes[3]);
   previous.set(pad.index,buttons);
   const active=Math.hypot(move.x,move.y)>0||Math.hypot(aim.x,aim.y)>0||buttons.some(Boolean);
   if(active)onActive();
   if(pressed(9))onPause();
   const before=inputs.get(pad.index);
   inputs.set(pad.index,{dx:move.x,dy:move.y,ax:aim.x,ay:aim.y,fire:Math.hypot(aim.x,aim.y)>.05||!!buttons[7],dash:playing&&(!!before?.dash||pressed(4)||pressed(0)),active});
   if(!playing){
    if(pressed(0))onNavigate('confirm');
    else if(pressed(1))onNavigate('back');
    else if(now>=nextNav){const direction=buttons[12]||move.y<-.5?'up':buttons[13]||move.y>.5?'down':buttons[14]||move.x<-.5?'left':buttons[15]||move.x>.5?'right':null;if(direction){onNavigate(direction);nextNav=now+220;}}
   }
  }
 }
 function read(second=false,local=false){const pad=local?(pads.length>1?pads[second?1:0]:second?pads[0]:null):pads[0];if(!pad)return null;const state=inputs.get(pad.index);if(!state)return null;const out={...state};state.dash=false;return out;}
 const api={frame,read,stick};if(typeof module!=='undefined')module.exports=api;else window.RRPad=api;
})();
