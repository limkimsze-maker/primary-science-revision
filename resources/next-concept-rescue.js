(()=>{
'use strict';
if(window.__PSLE_NEXT_CONCEPT_RESCUE_V2__)return;
window.__PSLE_NEXT_CONCEPT_RESCUE_V2__=true;
const d=document,$=id=>d.getElementById(id),BUILD='20260910u';
function visibleScienceIndex(){
  try{
    const pill=[...d.querySelectorAll('#gfBody .gf-pill')].find(x=>/^#\d+$/.test(String(x.textContent||'').trim()));
    const id=Number(String(pill?.textContent||'').replace('#',''));
    if(id&&Array.isArray(BANK)){const i=BANK.findIndex(e=>Number(e?.id)===id);if(i>=0)return i}
    return typeof current==='function'?current():-1;
  }catch(_e){return -1}
}
function isKnown(i){try{return i>=0&&new Set(rec(i)?.appCorrectDates||[]).size>=1}catch(_e){return false}}
function nextNotDone(cur){
  if(!Array.isArray(BANK)||!BANK.length)return -1;
  for(let n=1;n<=BANK.length;n++){
    const i=(cur+n)%BANK.length;
    if(!isKnown(i))return i;
  }
  return -1;
}
function outerUrl(target){
  try{
    const u=new URL(window.parent.location.href);
    const base=u.pathname.replace(/[^/]*$/,'');
    u.pathname=base+'trainer180-app.html';
    u.search='';
    u.searchParams.set('v',BUILD);
    u.searchParams.set('goto',`science:${target}`);
    u.searchParams.set('nav',String(Date.now()));
    u.hash='';
    return u.href;
  }catch(_e){
    return `trainer180-app.html?v=${BUILD}&goto=${encodeURIComponent('science:'+target)}&nav=${Date.now()}`;
  }
}
function go(target){
  const e=BANK?.[target],btn=$('gfNextConcept'),msg=$('gpsMessage');
  if(btn){btn.disabled=true;btn.textContent='Opening next Not done…'}
  if(msg&&e)msg.textContent=`Opening next Not done: #${e.id} ${e.topic||''}…`;
  const url=outerUrl(target);
  try{
    if(window.parent&&window.parent!==window)window.parent.location.replace(url);
    else window.location.replace(url);
  }catch(_e){window.location.href=url}
}

d.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#gfNextConcept');
  if(!btn)return;
  const flow=$('guidedFlow');
  if(flow?.dataset?.processMode==='1')return;

  // The sidebar can open a concept by putting an exact-match search into the guided picker.
  // If the normal advance() runs with that search still active, the current concept is the only
  // match and the trainer appears to stay put. Intercept the completion button and explicitly
  // choose the next Science concept that is still Not done, in book order, wrapping at #180.
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  const cur=visibleScienceIndex(),target=nextNotDone(cur);
  if(target<0){
    btn.disabled=true;
    btn.textContent='All Science concepts Known ✓';
    const msg=$('gpsMessage');if(msg)msg.textContent='All 180 Science concepts are Known.';
    return;
  }
  go(target);
},true);
})();