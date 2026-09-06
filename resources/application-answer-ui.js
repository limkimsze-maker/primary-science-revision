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
 const baseFreshLabel='🔄 New Application Question';
 let mode='all';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const qText=()=>String(question.textContent||'').trim();
 const kindText=()=>String(document.getElementById('variantNote')?.textContent||'').toLowerCase();
 const isExplain=()=>/\b(explain|why|give\s+(?:a\s+)?reason)\b/i.test(qText());
 const dayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
 function correctToday(){
  try{
   const x=typeof rec==='function'?rec(current()):null;
   return !!(x&&Array.isArray(x.appCorrectDates)&&x.appCorrectDates.includes(dayKey()));
  }catch(_e){return false}
 }
 function categoryOf(){
  const q=qText().toLowerCase(),k=kindText();
  if(/\b(explain|why|give\s+(?:a\s+)?reason)\b/.test(q))return'explain';
  if(/\b(experiment|investigation|data|evidence|fair test|conclusion|relationship|reliab|accurac|aim|results?)\b/.test(k)||/\b(relationship|aim of the experiment|what is the aim|conclusion|reliable|reliability|accuracy|fair test|investigat|experiment|using (?:the )?(?:results|data|evidence)|from the results)\b/.test(q))return'experiment';
  if(/\b(prediction|inference|suggest)\b/.test(k)||/\b(suggest|predict)\b/.test(q))return'suggest';
  if(/\b(sequence|describe|process)\b/.test(k)||/^\s*(describe|how)\b/.test(q))return'describe';
  if(/\brecall\b/.test(k)||/^\s*(state|name|identify|what|which)\b/.test(q))return'recall';
  return'other';
 }
 const matches=target=>target==='all'||categoryOf()===target;
 const labels={all:'All questions',recall:'Recall',explain:'Explain / Why',describe:'Describe / How',suggest:'Suggest / Predict',experiment:'Experiment / Relationship'};
 const tips={
  recall:'<b>Recall / direct question</b><span>Answer exactly what is asked. A correct Science concept or term may be enough — do not add D/E or L/R unless the question asks for them.</span>',
  explain:'<b>Explain / Why</b><span><strong>Use only what the question needs:</strong> D/E if there is evidence/data to use → S/R Science reasoning → L/R only if you still need to link back to the result asked.</span>',
  describe:'<b>Describe / How</b><span><strong>Describe:</strong> give observations or steps from beginning to end. <strong>How:</strong> explain how the process works in a logical sequence using Science concepts.</span>',
  suggest:'<b>Suggest / Predict</b><span><strong>Suggest:</strong> give a reasonable scientifically valid answer using the information given. <strong>Predict:</strong> state what will happen; give a reason only when asked.</span>',
  experiment:'<b>Experiment / Relationship</b><span>Use the exact process skill asked: relationship, aim, conclusion, evidence, reliability, fair test or investigation. Do not force D/E → S/R → L/R unless it is an Explain question.</span>',
  other:'<b>Read the command word first</b><span>Answer only what the question asks and use the relevant Science concept.</span>'
 };
 function coach(){
  const b=document.getElementById('appCommandCoach');if(!b)return;
  const c=categoryOf();b.classList.remove('hide');b.innerHTML=tips[c]||tips.other;
 }
 function workload(){
  const b=document.getElementById('appWorkloadGuide');if(!b)return;
  if(correctToday()){
   b.className='app-workload-guide done';
   b.innerHTML='<b>✅ Enough for this concept today</b><span>You have one correct application today. <strong>Move to Next.</strong> The other variants are optional extra practice — you do not need to finish them all.</span>';
   freshBtn.textContent='➕ Optional extra question';
   freshBtn.classList.add('optional-extra');
  }else{
   b.className='app-workload-guide';
   b.innerHTML='<b>🎯 Today’s target: 1 application question for this concept</b><span>If it is correct, move on. If it is wrong, repair the idea and try one more. Long-term mastery comes from returning on another day, not from doing all the variants at once.</span>';
   freshBtn.textContent=baseFreshLabel;
   freshBtn.classList.remove('optional-extra');
  }
 }
 function resetModel(){modelBox.classList.add('hide');syncUnlock()}
 function syncUnlock(){
  const tried=!!answer.value.trim();modelBtn.disabled=!tried;
  modelBtn.textContent=tried?'Show Model Answer':'🔒 Try first to unlock model answer';
  modelBtn.title=tried?'Compare your answer with a PSLE-style model answer.':'Write your own answer first.';
 }
 function afterQuestionChange(){resetModel();coach();workload();setTimeout(()=>{coach();workload()},0)}
 function tryFreshMatch(target,max=8){
  const start=current(),seen=new Set();
  for(let n=0;n<max;n++){
   const q=qText();if(matches(target)&&!seen.has(q))return true;seen.add(q);
   if(typeof originalFresh==='function')originalFresh.call(freshBtn);else return false;
   if(current()!==start)break;
  }
  return matches(target);
 }
 function seek(target,includeCurrent=true){
  if(target==='all')return true;
  if(includeCurrent&&tryFreshMatch(target))return true;
  const limit=180;
  for(let c=0;c<limit;c++){
   if(typeof originalNext==='function')originalNext.call(nextBtn);else return false;
   if(tryFreshMatch(target))return true;
  }
  return false;
 }
 function setMode(v){
  mode=labels[v]?v:'all';
  document.querySelectorAll('[data-app-question-mode]').forEach(b=>b.classList.toggle('active',b.dataset.appQuestionMode===mode));
  if(mode!=='all'&&!seek(mode,true)){
   const fb=document.getElementById('appFeedback');if(fb){fb.className='fb warnbox';fb.textContent=`No ${labels[mode]} question was found in the current practice queue.`}
  }
  afterQuestionChange();
 }
 const bar=document.createElement('div');bar.id='appQuestionModeBar';bar.className='app-question-mode';bar.innerHTML='<b>Question type</b><button type="button" data-app-question-mode="all" class="active">All</button><button type="button" data-app-question-mode="recall">Recall</button><button type="button" data-app-question-mode="explain">Explain / Why</button><button type="button" data-app-question-mode="describe">Describe / How</button><button type="button" data-app-question-mode="suggest">Suggest / Predict</button><button type="button" data-app-question-mode="experiment">Experiment / Relationship</button>';
 question.insertAdjacentElement('beforebegin',bar);
 const coachBox=document.createElement('div');coachBox.id='appCommandCoach';coachBox.className='app-command-coach';question.insertAdjacentElement('beforebegin',coachBox);
 const workloadBox=document.createElement('div');workloadBox.id='appWorkloadGuide';workloadBox.className='app-workload-guide';question.insertAdjacentElement('beforebegin',workloadBox);
 bar.querySelectorAll('[data-app-question-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.appQuestionMode));
 freshBtn.onclick=function(){
  if(mode==='all'){if(typeof originalFresh==='function')originalFresh.call(freshBtn)}
  else{
   const start=current(),initial=qText(),seen=new Set([initial]);let found=false;
   for(let n=0;n<8;n++){
    if(typeof originalFresh==='function')originalFresh.call(freshBtn);else break;
    if(current()!==start)break;
    const q=qText();
    if(matches(mode)&&!seen.has(q)){found=true;break}seen.add(q);
   }
   if(!found)seek(mode,false);
  }
  afterQuestionChange();answer.focus();
 };
 nextBtn.onclick=function(){
  if(mode==='all'){if(typeof originalNext==='function')originalNext.call(nextBtn)}
  else seek(mode,false);
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
  modelBox.innerHTML=`<div class="app-answer-card your"><b>✍️ Your answer</b><div>${esc(student)}</div></div><div class="app-answer-card model"><b>✅ Model answer</b>${isExplain()?'<div class="app-mini-frame"><span>D/E if needed</span>→<span>S/R</span>→<span>L/R if needed</span></div>':''}<div><strong>${esc(model)}</strong></div><small>${fallback?'AI model could not be prepared, so the audited Science core is shown. Adapt it to the question context.':'PSLE-style model for this exact question. Scientifically equivalent wording is acceptable.'}</small></div>`;
  modelBtn.disabled=false;modelBtn.textContent='Hide Model Answer';
 };
 const note=app.querySelector('.mode-note');if(note)note.innerHTML='<b>Written Application:</b> practise by command-word family: <b>Recall · Explain/Why · Describe/How · Suggest/Predict · Experiment/Relationship</b>, or choose <b>All</b>. <strong>You do not need to finish every variant.</strong> Aim for one correct application for a concept today, then revisit it on another day for spaced mastery.';
 const feedback=document.getElementById('appFeedback');
 if(feedback)new MutationObserver(()=>setTimeout(workload,0)).observe(feedback,{childList:true,subtree:true,attributes:true,characterData:true});
 const style=document.createElement('style');style.textContent=`
 .app-question-mode{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:4px 0 9px;padding:10px 12px;border:1px solid #dbe3ee;border-radius:13px;background:#fff}.app-question-mode>b{font-size:13px;color:#475569;margin-right:2px}.app-question-mode button{font-weight:800;padding:8px 10px}.app-question-mode button.active{background:#4338ca;color:#fff;border-color:#4338ca}.app-command-coach{margin:7px 0 8px;padding:10px 12px;border:1px solid #c7d2fe;border-radius:12px;background:#eef2ff;color:#3730a3}.app-command-coach>b,.app-workload-guide>b{display:block}.app-command-coach span,.app-workload-guide span{display:block;margin-top:4px;font-size:12px;color:#475569;line-height:1.45}.app-workload-guide{margin:7px 0 11px;padding:10px 12px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;color:#92400e}.app-workload-guide.done{border-color:#a7f3d0;background:#ecfdf5;color:#047857}.optional-extra{background:#fff!important;color:#475569!important;border-color:#cbd5e1!important;font-weight:700!important}.app-answer-compare{display:grid!important;grid-template-columns:1fr 1fr;gap:10px;background:transparent!important;border:0!important;padding:0!important}.app-answer-card{padding:13px;border-radius:13px;border:1px solid #dbe3ee;background:#fff;line-height:1.55}.app-answer-card>b{display:block;margin-bottom:7px}.app-answer-card.your{background:#f8fafc}.app-answer-card.model{background:#f0fdf4;border-color:#bbf7d0}.app-answer-card small{display:block;margin-top:8px;color:#64748b}.app-mini-frame{display:flex;align-items:center;gap:5px;margin-bottom:8px;color:#64748b;font-size:12px;flex-wrap:wrap}.app-mini-frame span{background:#eef2ff;color:#3730a3;border-radius:999px;padding:3px 7px;font-weight:900}@media(max-width:720px){.app-answer-compare{grid-template-columns:1fr}.app-question-mode{display:grid;grid-template-columns:1fr 1fr}.app-question-mode>b{grid-column:1/-1}.app-question-mode button{width:100%;font-size:12px}.app-question-mode button:first-of-type{grid-column:1/-1}}
 `;document.head.appendChild(style);
 coach();workload();syncUnlock();
}
install();
})();