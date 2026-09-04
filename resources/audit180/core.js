(()=>{
window.AUDIT180_VERSION='book-photo-audit-20260904-v2';
window.AUDIT180_APPLY=window.AUDIT180_APPLY||function(rows){
  if(typeof BANK==='undefined')return;
  const m=new Map(rows.map(x=>[x.id,x]));
  BANK.forEach(e=>{
    const a=m.get(e.id); if(!a)return;
    if(a.topic)e.topic=a.topic;
    if(a.cue)e.phrasePrompt=a.cue;
    if(a.phrase)e.phrase=a.phrase;
    if(a.bookRef)e.bookRef=a.bookRef;
    e.auditType=a.audit||'faithful';
    e.auditVersion=window.AUDIT180_VERSION;
    if(typeof keyIdeas==='function')e.rubric=keyIdeas(e.phrase);
    else e.rubric=[e.phrase];
    e.modelApplicationAnswer=e.phrase;
  });
};
window.AUDIT180_UI=function(){
  try{
    if(typeof current!=='function'||typeof BANK==='undefined')return;
    const e=BANK[current()]; if(!e)return;
    const label=e.auditType==='direct'?'📗 Direct book anchor':'📘 Book-faithful PSLE core';
    const p=document.getElementById('bookSource');
    if(p)p.textContent=`${label} · ${e.bookRef} · audited against original 108-page book photos`;
    const a=document.getElementById('appBookSource');
    if(a)a.textContent=`${label} · ${e.bookRef} · adapt this science core to the exact question`;
    let badge=document.getElementById('auditBadge');
    if(!badge){
      badge=document.createElement('span'); badge.id='auditBadge'; badge.className='pill blue';
      const meta=document.querySelector('.meta > div'); if(meta)meta.appendChild(badge);
    }
    if(badge)badge.textContent=e.auditType==='direct'?'Book anchor':'Book-faithful';
  }catch(err){console.warn('audit UI',err)}
};
const note=document.querySelector('#phrasePane .mode-note');
if(note)note.innerHTML='<b>Phrase mastery:</b> all 180 targets were re-audited against the <b>original 108-page book photos</b>. <b>Direct book anchor</b> means the idea is directly stated in the book. <b>Book-faithful PSLE core</b> means the book gives the idea through bullets, diagrams or examples, so the target is a conservative sentence using only those book-backed ideas. These are study targets, not official SEAB model answers. Secure = exact recall on 3 different days.';
const sub=document.querySelector('header .sub');
if(sub)sub.innerHTML='<b>180 re-audited Science concepts</b> · original 108-page book photos checked page by page · direct book anchors + conservative book-faithful cores · flexible written application';
})();