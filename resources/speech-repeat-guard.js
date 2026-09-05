(()=>{
const IDS=['phraseAnswer','appAnswer','processRecall','processAnswer'];
const wordCount=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean).length;
function install(id){
 const box=document.getElementById(id),row=document.getElementById(`speech-${id}`);if(!box||!row||box.dataset.repeatGuardInstalled==='1')return false;
 box.dataset.repeatGuardInstalled='1';
 const mic=row.querySelector('.speech-btn'),undo=row.querySelector('.speech-undo'),status=row.querySelector('.speech-status');
 if(!mic)return false;

 // A trusted input event means the pupil typed/edited the text manually.
 box.addEventListener('input',e=>{if(e.isTrusted)box.dataset.voiceUserEdited='1'},true);

 mic.addEventListener('click',()=>{
  box.dataset.guardBefore=box.value||'';
  box.dataset.guardReplace=(box.dataset.voiceUsed==='1'&&box.dataset.voiceUserEdited!=='1'&&box.value.trim())?'1':'0';
 },true);

 // speech-input-ai.js dispatches a synthetic input event after inserting the transcript.
 // At that moment we can safely remove the previous voice attempt if this is a retry.
 box.addEventListener('input',e=>{
  if(e.isTrusted)return;
  const before=box.dataset.guardBefore||'',replace=box.dataset.guardReplace==='1';
  const raw=box.dataset.rawTranscript||'',cleaned=box.dataset.cleanedTranscript||'';
  let rejectedAddition=false;

  // Extra safety: the AI clean-up may replace a misheard word, but it must not ADD
  // words/ideas to the pupil's spoken answer. If it does, keep the raw browser transcript.
  if(raw&&cleaned&&wordCount(cleaned)>wordCount(raw)){
   rejectedAddition=true;
  }

  if(replace){
   // "Speak Answer" is a retry, not "append another answer". Keep only the newest attempt.
   box.value=rejectedAddition?raw:(cleaned||raw||box.value.slice(before.length).trim());
  }else if(rejectedAddition){
   // Preserve genuinely typed text, but replace only the just-appended AI-cleaned chunk.
   box.value=before?`${before.trim()} ${raw}`.trim():raw;
  }

  if(replace||rejectedAddition){
   box.dispatchEvent(new Event('change',{bubbles:true}));
   setTimeout(()=>{
    box.dataset.lastRawBox=raw;
    box.dataset.voiceUserEdited='0';
    if(rejectedAddition){
     box.dataset.cleanupSource='client-safety-guard';
     box.dataset.cleanedTranscript=raw;
     if(undo)undo.classList.add('hide');
     if(status)status.textContent='🛡️ AI clean-up tried to add a word, so the raw speech transcript was kept.';
    }else if(status){
     const existing=status.textContent||'';
     status.textContent=(existing?existing+' ':'')+'New voice attempt replaced the previous voice attempt.';
    }
   },0);
  }
  delete box.dataset.guardBefore;delete box.dataset.guardReplace;
 },false);
 return true;
}
let tries=0;const timer=setInterval(()=>{
 tries++;let n=0;IDS.forEach(id=>{if(document.getElementById(id)?.dataset.repeatGuardInstalled==='1'||install(id))n++});
 if(n===IDS.length||tries>120)clearInterval(timer);
},100);
})();
