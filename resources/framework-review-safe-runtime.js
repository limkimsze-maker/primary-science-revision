(()=>{
if(window.__PSLE_FW192_SAFE_RUNTIME__)return;
window.__PSLE_FW192_SAFE_RUNTIME__=true;
try{window.__PSLE_FW192_RESTORE__?.()}catch(_e){}
const realSet=window.__PSLE_FW192_REAL_SET_INTERVAL__||window.setInterval.bind(window);
let lastKey='',busy=false;
function key(){
  try{
    const flow=document.getElementById('guidedFlow');
    const proc=flow?.dataset?.processMode==='1'?'p':'s';
    const idx=typeof current==='function'?current():-1;
    const stage=flow?.dataset?.stage||'';
    return `${proc}:${idx}:${stage}`;
  }catch(_e){return''}
}
function refresh(){
  if(busy)return;busy=true;
  try{window.PSLE_FRAMEWORK_192?.refresh?.()}catch(_e){}
  finally{setTimeout(()=>busy=false,80)}
}
realSet(()=>{const k=key();if(k&&k!==lastKey){lastKey=k;refresh()}},650);
document.addEventListener('click',e=>{
  if(e.target.closest('.gps-row,#gfNextConcept,#gfAppBackFlash,#gfAppBackMem,#freshAppBtn,#appTab,#phraseTab'))setTimeout(refresh,120);
});
document.addEventListener('change',e=>{
  if(['fcFrameworkFilter','gfStatus','gfTopic','gfSort'].includes(e.target?.id))setTimeout(refresh,80);
});
document.addEventListener('psle-cloud-progress-updated',()=>setTimeout(refresh,100));
setTimeout(refresh,100);
})();