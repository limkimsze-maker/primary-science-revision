(()=>{
function install(){
 const check=document.getElementById('checkPhrase');
 const next=document.getElementById('nextPhrase');
 const answer=document.getElementById('phraseAnswer');
 if(!check||!next||!answer)return false;
 if(check.dataset.checkNextInstalled==='1')return true;
 check.dataset.checkNextInstalled='1';
 next.style.display='none';
 function toCheck(){
  check.dataset.phase='check';
  check.textContent='Check';
  check.classList.add('primary');
  check.classList.remove('next');
 }
 function toNext(){
  check.dataset.phase='next';
  check.textContent='Next →';
  check.classList.remove('primary');
  check.classList.add('next');
 }
 toCheck();
 check.addEventListener('click',e=>{
  if(check.dataset.phase!=='next')return;
  e.preventDefault();
  e.stopImmediatePropagation();
  toCheck();
  next.click();
 },true);
 check.addEventListener('click',()=>{
  if(check.dataset.phase==='next')return;
  setTimeout(()=>{
   const fb=document.getElementById('phraseFeedback');
   const hasAnswer=String(answer.value||'').trim().length>0;
   if(hasAnswer&&fb&&!fb.classList.contains('hide'))toNext();
  },0);
 });
 answer.addEventListener('input',e=>{if(e.isTrusted&&check.dataset.phase==='next')toCheck()},true);
 document.getElementById('retryPhrase')?.addEventListener('click',()=>setTimeout(toCheck,0));
 document.getElementById('phraseMode')?.addEventListener('change',()=>setTimeout(toCheck,0));
 document.getElementById('buildQueue')?.addEventListener('click',()=>setTimeout(toCheck,0));
 document.getElementById('shuffle')?.addEventListener('click',()=>setTimeout(toCheck,0));
 document.getElementById('phraseTab')?.addEventListener('click',()=>setTimeout(toCheck,0));
 document.addEventListener('click',e=>{
  if(e.target.closest('#bank .row'))setTimeout(toCheck,0);
 },true);
 return true;
}
let tries=0,t=setInterval(()=>{tries++;if(install()||tries>120)clearInterval(t)},100);
})();
