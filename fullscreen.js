/* Fullscreen requires a real user gesture. Keep the control if entry fails. */
(() => {
 const button=document.querySelector('#fullscreenBtn'),root=document.documentElement;
 const active=()=>document.fullscreenElement||document.webkitFullscreenElement;
 const sync=()=>{button.hidden=!!active();};
 button.addEventListener('click',async()=>{
  try {
   const enter=root.requestFullscreen||root.webkitRequestFullscreen;
   if(!enter){button.textContent='Fullscreen unavailable';return;}
   await enter.call(root);sync();
  } catch {button.textContent='Retry fullscreen';}
 });
 document.addEventListener('fullscreenchange',sync);
 document.addEventListener('webkitfullscreenchange',sync);
 sync();
})();
