(()=>{
if(window.__PSLE_AI_UNAVAILABLE_NEUTRAL__)return;
window.__PSLE_AI_UNAVAILABLE_NEUTRAL__=true;
const d=document;
let timer=0;
const outage=/could not reach the ai marker|ai marker unavailable|ai marking is temporarily unavailable|ai marking timed out|ai unavailable/i;
function fix(){
  const fb=d.getElementById('gfAppFeedback');
  if(!fb)return;
  const text=String(fb.textContent||'');
  if(!outage.test(text))return;
  fb.querySelectorAll('.sef-after').forEach(x=>x.remove());
  const box=fb.querySelector('.gf-feedback');
  if(box){
    box.classList.remove('bad');
    box.classList.add('info');
    box.innerHTML='<b>☁ AI marker temporarily unavailable.</b><br>No mark was recorded and your existing progress is unchanged. Tap <b>Check my answer</b> again in a moment.';
  }
}
function schedule(){clearTimeout(timer);timer=setTimeout(fix,30)}
new MutationObserver(schedule).observe(d.documentElement,{subtree:true,childList:true,characterData:true});
d.addEventListener('click',e=>{if(e.target?.id==='gfMarkApp')setTimeout(fix,200)});
setTimeout(fix,100);
})();