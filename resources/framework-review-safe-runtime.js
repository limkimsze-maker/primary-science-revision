(()=>{
if(window.__PSLE_FW192_SAFE_RUNTIME__)return;
window.__PSLE_FW192_SAFE_RUNTIME__=true;
try{window.__PSLE_FW192_RESTORE__?.()}catch(_e){}
const realSet=window.__PSLE_FW192_REAL_SET_INTERVAL__||window.setInterval.bind(window);
let lastKey='',busy=false;
function key(){
  try{const flow=document.getElementById('guidedFlow'),proc=flow?.dataset?.processMode==='1'?'p':'s',idx=typeof current==='function'?current():-1,stage=flow?.dataset?.stage||'';return `${proc}:${idx}:${stage}`}catch(_e){return''}
}
function light(){
  if(busy)return;busy=true;
  try{window.PSLE_FRAMEWORK_QUESTION_QUALITY?.patchCurrent?.()}catch(_e){}
  finally{setTimeout(()=>busy=false,40)}
}
function sidebar(){
  if(busy)return;busy=true;
  try{
    window.PSLE_FRAMEWORK_192?.refresh?.();
    window.PSLE_FRAMEWORK_QUESTION_QUALITY?.patchCurrent?.();
    window.PSLE_FRAMEWORK_QUESTION_QUALITY?.patchCountUI?.(window.PSLE_FRAMEWORK_192);
  }catch(_e){}
  finally{setTimeout(()=>busy=false,60)}
}
// Normal Recall/Memorise/Application movement only patches the visible question.
// The expensive 180-item audit runs once after authored variants load in trainer180-app.html.
realSet(()=>{const k=key();if(k&&k!==lastKey){lastKey=k;setTimeout(light,50)}},700);
document.addEventListener('click',e=>{
  if(e.target.closest('.gps-row,#gfNextConcept,#gfAppBackFlash,#gfAppBackMem,#freshAppBtn,#appTab,#phraseTab'))setTimeout(light,120);
});
document.addEventListener('change',e=>{
  if(['fcFrameworkFilter','gfStatus','gfTopic','gfSort'].includes(e.target?.id))setTimeout(sidebar,80);
});
document.addEventListener('psle-cloud-progress-updated',()=>setTimeout(light,100));
document.addEventListener('psle-framework-192-updated',()=>setTimeout(light,40));
setTimeout(sidebar,120);
})();