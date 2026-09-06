(()=>{
let tries=0;
function install(){
 tries++;
 const app=document.getElementById('appPane'),answer=document.getElementById('appAnswer'),question=document.getElementById('appQuestion'),modelBtn=document.getElementById('modelAppBtn'),modelBox=document.getElementById('modelAppBox'),freshBtn=document.getElementById('freshAppBtn'),nextBtn=document.getElementById('nextApp');
 if(!app||!answer||!question||!modelBtn||!modelBox||!freshBtn||!nextBtn||typeof current!=='function'||typeof BANK==='undefined'){
  if(tries<180)setTimeout(install,100);return;
 }
 if(document.getElementById('appQuestionModeBar'))return;
 const originalFresh=freshBtn.onclick,originalNext=nextBtn.onclick;
 let mode='all';
 const isExplain=()=>/\b(explain|why|give\s+(?:a\s+)?reason)\b/i.test(question.textContent||'');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function framework(){
  const b=document.getElementById('appExplainFrame');if(!b)return;
  const on=isExplain();b.classList.toggle('hide',!on);
  if(on)b.innerHTML='<b>Explain / Why question</b><span><strong>Use only what the question needs:</strong> D/E if there is evidence/data to use → S/R science reasoning → L/R only if you still need to link back to the result asked.</span>';
 }
 function resetModel(){modelBox.classList.add('hide');syncUnlock()}
 function syncUnlock(){
  const tried=!!answer.value.trim();modelBtn.disabled=!tried;
  modelBtn.textContent=tried?'Show Model Answer':'🔒 Try first to unlock model answer';
  modelBtn.title=tried?'Compare your answer with a PSLE-style model answer.':'Write your own answer first.';
 }
 function afterQuestionChange(){resetModel();framework();setTimeout(framework,0)}
 function tryFreshExplain(max=8){
  const start=current(),seen=new Set();
  for(let n=0;n<max;n++){
   const q=(question.textContent||'').trim();if(isExplain()&&!seen.has(q))return true;seen.add(q);
   if(typeof originalFresh==='function')originalFresh.call(freshBtn);else freshBtn.click();
   if(current()!==start)break;
  }
  return isExplain();
 }
 function seekExplain(includeCurrent=true){
  if(includeCurrent&&tryFreshExplain())return true;
  const limit=Math.max(1,Array.isArray(window.order)?window.order.length:180);
  for(let c=0;c<limit;c++){
   if(typeof originalNext==='function')originalNext.call(nextBtn);else return false;
   if(tryFreshExplain())return true;
  }
  return false;
 }
 function setMode(v){
  mode=v==='explain'?'explain':'all';
  document.querySelectorAll('[data-app-question-mode]').forEach(b=>b.classList.toggle('active',b.dataset.appQuestionMode===mode));
  if(mode==='explain'){
   if(!seekExplain(true)){
    const fb=document.getElementById('appFeedback');if(fb){fb.className='fb warnbox';fb.textContent='No Explain / Why question was found in the current queue.'}
   }
  }
  afterQuestionChange();
 }
 const bar=document.createElement('div');bar.id='appQuestionModeBar';bar.className='app-question-mode';bar.innerHTML='<b>Question type</b><button type="button" data-app-question-mode="all" class="active">All questions</button><button type="button" data-app-question-mode="explain">Explain / Why</button>';
 question.insertAdjacentElement('beforebegin',bar);
 const frame=document.createElement('div');frame.id='appExplainFrame';frame.className='app-explain-frame hide';question.insertAdjacentElement('beforebegin',frame);
 bar.querySelectorAll('[data-app-question-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.appQuestionMode));
 freshBtn.onclick=function(){
  if(mode==='all'){if(typeof originalFresh==='function')originalFresh.call(freshBtn)}
  else{
   const start=current(),initial=(question.textContent||'').trim(),seen=new Set([initial]);let found=false;
   for(let n=0;n<8;n++){
    if(typeof originalFresh==='function')originalFresh.call(freshBtn);
    if(current()!==start)break;
    const q=(question.textContent||'').trim();
    if(isExplain()&&!seen.has(q)){found=true;break}seen.add(q);
   }
   if(!found)seekExplain(false);
  }
  afterQuestionChange();answer.focus();
 };
 nextBtn.onclick=function(){
  if(mode==='all'){if(typeof originalNext==='function')originalNext.call(nextBtn)}
  else seekExplain(false);
  afterQuestionChange();
 };
 answer.addEventListener('input',()=>{if(!modelBox.classList.contains('hide'))modelBox.classList.add('hide');syncUnlock()});
 modelBtn.onclick=async function(){
  const student=answer.value.trim();
  if(!student){syncUnlock();return}
  if(!modelBox.classList.contains('hide')){modelBox.classList.add('hide');modelBtn.textContent='Show Model Answer';return}
  modelBtn.disabled=true;modelBtn.textContent='Preparing Model Answer…';
  let model='',fallback=false;
  try{
   if(typeof window.PSLE_AI_PREVIEW_MODEL==='function'){
    const out=await window.PSLE_AI_PREVIEW_MODEL();model=String(out?.data?.improvedAnswer||'').trim();
   }
  }catch(_e){}
  if(!model){const e=BANK[current()]||{};model=String(e.modelApplicationAnswer||e.phrase||'').trim();fallback=true}
  modelBox.className='model app-answer-compare';
  modelBox.innerHTML=`<div class="app-answer-card your"><b>✍️ Your answer</b><div>${esc(student)}</div></div><div class="app-answer-card model"><b>✅ Model answer</b>${isExplain()?'<div class="app-mini-frame"><span>D/E if needed</span>→<span>S/R</span>→<span>L/R if needed</span></div>':''}<div><strong>${esc(model)}</strong></div><small>${fallback?'AI model could not be prepared, so the audited science core is shown. Adapt it to the question context.':'PSLE-style model for this exact question. Scientifically equivalent wording is acceptable.'}</small></div>`;
  modelBtn.disabled=false;modelBtn.textContent='Hide Model Answer';
 };
 const note=app.querySelector('.mode-note');if(note)note.innerHTML='<b>Written Application:</b> choose <b>All questions</b> or <b>Explain / Why</b>. Start with the command word. Recall questions need only the required concept. For explanations, use <b>D/E → S/R → L/R only where the question needs those parts</b>. Write your own answer first; then <b>Show Model Answer</b> compares your answer with a PSLE-style model.';
 const style=document.createElement('style');style.textContent=`
 .app-question-mode{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0 10px;padding:10px 12px;border:1px solid #dbe3ee;border-radius:13px;background:#fff}.app-question-mode>b{font-size:13px;color:#475569}.app-question-mode button{font-weight:800}.app-question-mode button.active{background:#4338ca;color:#fff;border-color:#4338ca}.app-explain-frame{margin:7px 0 11px;padding:10px 12px;border:1px solid #c7d2fe;border-radius:12px;background:#eef2ff;color:#3730a3}.app-explain-frame>b{display:block}.app-explain-frame span{display:block;margin-top:4px;font-size:12px;color:#475569}.app-answer-compare{display:grid!important;grid-template-columns:1fr 1fr;gap:10px;background:transparent!important;border:0!important;padding:0!important}.app-answer-card{padding:13px;border-radius:13px;border:1px solid #dbe3ee;background:#fff;line-height:1.55}.app-answer-card>b{display:block;margin-bottom:7px}.app-answer-card.your{background:#f8fafc}.app-answer-card.model{background:#f0fdf4;border-color:#bbf7d0}.app-answer-card small{display:block;margin-top:8px;color:#64748b}.app-mini-frame{display:flex;align-items:center;gap:5px;margin-bottom:8px;color:#64748b;font-size:12px;flex-wrap:wrap}.app-mini-frame span{background:#eef2ff;color:#3730a3;border-radius:999px;padding:3px 7px;font-weight:900}@media(max-width:720px){.app-answer-compare{grid-template-columns:1fr}.app-question-mode button{flex:1 1 100%}}
 `;document.head.appendChild(style);
 framework();syncUnlock();
}
install();
})();