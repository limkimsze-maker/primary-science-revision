(()=>{
if(window.__PSLE_NEXT_CONCEPT_RESCUE__)return;
window.__PSLE_NEXT_CONCEPT_RESCUE__=true;
const d=document,$=id=>d.getElementById(id),KEY='psleScience_next_concept_target_v1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
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
  for(let n=1;n<=BANK.length;n++){const i=(cur+n)%BANK.length;if(!isKnown(i))return i}
  return -1;
}
function saveTarget(i){try{sessionStorage.setItem(KEY,String(i))}catch(_e){}}
function getTarget(){try{const x=Number(sessionStorage.getItem(KEY));return Number.isInteger(x)&&x>=0?x:-1}catch(_e){return -1}}
function clearTarget(){try{sessionStorage.removeItem(KEY)}catch(_e){}}
async function openTarget(i){
  if(i<0||!BANK?.[i]){clearTarget();return false}
  for(let n=0;n<30;n++){
    const flow=$('guidedFlow'),status=$('gfStatus'),topic=$('gfTopic'),search=$('gfSearch');
    if(flow&&status&&topic&&search){
      // A fresh page starts on Recall, where the guided filters are allowed to move concepts.
      topic.value='all';topic.dispatchEvent(new Event('change',{bubbles:true}));
      status.value=isKnown(i)?'known':'notdone';status.dispatchEvent(new Event('change',{bubbles:true}));
      search.value=`${BANK[i].id} ${BANK[i].topic||''}`.trim();
      search.dispatchEvent(new Event('input',{bubbles:true}));
      await sleep(260);
      if(visibleScienceIndex()===i){clearTarget();return true}
    }
    await sleep(100);
  }
  return false;
}
async function recoverPending(){const target=getTarget();if(target>=0)await openTarget(target)}

d.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#gfNextConcept');if(!btn)return;
  const flow=$('guidedFlow');if(flow?.dataset?.processMode==='1')return;
  const before=visibleScienceIndex(),target=nextNotDone(before);
  if(target<0){clearTarget();return}
  saveTarget(target);
  // Let the normal guided-flow handler run first. Only intervene if it genuinely stayed put.
  setTimeout(()=>{
    const now=visibleScienceIndex(),stillOnCompletion=!!$('gfNextConcept');
    if(now!==before&&!stillOnCompletion){clearTarget();return}
    try{
      // Reload the outer trainer only as a fallback. Saved progress is already persisted,
      // and the pending target is reopened automatically on the fresh Recall screen.
      if(window.parent&&window.parent!==window)window.parent.location.reload();
      else window.location.reload();
    }catch(_e){window.location.reload()}
  },550);
},true);

setTimeout(recoverPending,220);
})();