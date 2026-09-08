(()=>{
if(window.PSLE_FRAMEWORK_192_VARIANTS)return;
const $=id=>document.getElementById(id);
function apply(){
 const api=window.PSLE_FRAMEWORK_192,V=window.APP_VARIANTS;
 if(!api||!V||typeof BANK==='undefined'||!Array.isArray(BANK))return false;
 for(let id=1;id<=180;id++){
  const item=api.byScienceId(id),e=BANK[id-1];if(!item||!e)continue;
  const variants=[];
  (V[id]||[]).forEach(v=>{if(v?.q)variants.push({q:v.q,model:v.model||e.modelApplicationAnswer||e.phrase||''})});
  if(Array.isArray(e.applicationVariants))e.applicationVariants.forEach(v=>{if(v?.question)variants.push({q:v.question,model:v.modelApplicationAnswer||e.modelApplicationAnswer||e.phrase||''})});
  const hit=variants.find(v=>api.classifyQuestion(v.q)===item.framework);
  if(!hit)continue;
  item.question=hit.q;item.model=hit.model||e.modelApplicationAnswer||e.phrase||'';item.source='Authored PSLE-style transfer question';
  e.applicationQuestion=item.question;e.frameworkReviewQuestion=item.question;e.frameworkReview=item.framework;e.modelApplicationAnswer=item.model;
 }
 // If a Science Application card is already visible, keep the displayed question,
 // hidden AI question and model answer aligned to the same linked flashcard.
 try{
  if($('gfAppAnswer')&&$('guidedFlow')?.dataset?.processMode!=='1'){
   const i=typeof current==='function'?current():-1,e=i>=0?BANK[i]:null,item=e?api.byScienceId(e.id):null;
   if(item){
    const p=document.querySelector('#gfBody .gf-prompt');if(p)p.textContent=item.question;
    const h=$('appQuestion');if(h)h.textContent=item.question;
    const note=$('variantNote');if(note)note.textContent=`Framework ${api.meta[item.framework].n} · ${api.meta[item.framework].name} · linked question #${item.id}`;
   }
  }
 }catch(_e){}
 document.dispatchEvent(new Event('psle-framework-192-updated'));
 return true;
}
window.PSLE_FRAMEWORK_192_VARIANTS={apply};
let n=0;const wait=()=>{n++;if(apply())return;if(n<240)setTimeout(wait,250)};wait();
})();