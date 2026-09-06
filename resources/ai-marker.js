(()=>{
const ENDPOINT='https://primary-science-ai-marker.limkimsze-maker.workers.dev/mark';
const $id=id=>document.getElementById(id);
const escHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lastResult=null;

function installUI(){
  const app=$id('appPane'); if(!app||$id('aiMarkBtn'))return;
  const answer=$id('appAnswer'); if(!answer)return;
  const row=document.createElement('div');
  row.className='actions'; row.id='aiMarkRow';
  row.innerHTML='<button class="primary" id="aiMarkBtn">🤖 AI Mark My Answer</button><span id="aiStatus" class="small" style="font-weight:700;color:#166534">● AI ready</span>';
  answer.insertAdjacentElement('afterend',row);
  const note=document.createElement('div'); note.className='small'; note.id='aiMarkNote'; note.style.marginTop='6px';
  note.innerHTML='AI first follows the <b>command word</b>. Recall questions are marked on the required Science concept; <b>D/E → S/R → L/R</b> is used only when the question needs those parts. Scientifically equivalent wording is accepted.';
  row.insertAdjacentElement('afterend',note);
  const rating=app.querySelector('.rating');
  if(rating){const label=document.createElement('div');label.className='small';label.style.marginTop='10px';label.style.fontWeight='700';label.textContent='Manual override (use only if you disagree with the AI mark):';rating.parentNode.insertBefore(label,rating)}
  $id('aiMarkBtn').onclick=markWithAI;
}
function setStatus(text,color){const s=$id('aiStatus');if(s){s.textContent=text;s.style.color=color||'#64748b'}}
function textValue(obj,keys){for(const k of keys){const v=obj&&obj[k];if(typeof v==='string'&&v.trim())return v.trim()}return ''}
function normalizeRating(v){
  if(v==null)return null; let s=String(v).toLowerCase().trim(); if(!s)return null;
  if(s==='correct'||s==='full'||s==='pass'||s==='accepted')return 'correct';
  if(s==='de'||s.includes('d/e')||s.includes('evidence')||s.includes('data'))return 'de';
  if(s==='sr'||s.includes('s/r')||s.includes('reasoning'))return 'sr';
  if(s==='lr'||s.includes('l/r')||s.includes('link'))return 'lr';
  if(s==='concept'||s.includes('concept'))return 'concept';
  return null;
}
function extractRating(d){if(!d)return null;for(const x of [d.rating,d.verdict,d.result,d.category,d.classification,d.status,d.label]){const r=normalizeRating(x);if(r)return r}return null}
function collectFeedback(d){if(!d)return '';let parts=[];for(const k of ['feedback','missing','strengths','reason','explanation','message']){const v=d[k];if(typeof v==='string'&&v.trim())parts.push(v.trim())}if(d.improvedAnswer)parts.push('Improved answer: '+d.improvedAnswer);return [...new Set(parts)].join(' ')}
function ratingTitle(rate){return {correct:'✅ Correct',de:'🟨 D/E missing',sr:'🟧 S/R missing / wrong',lr:'🟪 L/R missing',concept:'❌ Concept not known'}[rate]||'AI result'}
function currentPayload(studentAnswer){
  const i=typeof current==='function'?current():0; const e=(typeof BANK!=='undefined'&&BANK[i])?BANK[i]:{};
  const question=($id('appQuestion')&&$id('appQuestion').textContent||e.applicationQuestion||'').trim();
  return {
    conceptId:Number(e.id||i+1),
    topic:e.topic||'',
    question,
    answer:studentAnswer,
    verbatim:e.phrase||'',
    modelAnswer:e.modelApplicationAnswer||e.phrase||'',
    rubric:Array.isArray(e.rubric)?e.rubric:[]
  };
}
function sameRequest(payload){return !!(lastResult&&lastResult.question===payload.question&&lastResult.answer===payload.answer&&lastResult.conceptId===payload.conceptId&&lastResult.data)}
async function requestAI(payload){
  if(sameRequest(payload))return lastResult.data;
  const ctl=new AbortController(); const timer=setTimeout(()=>ctl.abort(),30000);
  try{
    const res=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:ctl.signal});
    const raw=await res.text(); let data; try{data=JSON.parse(raw)}catch(_e){data={message:raw}}
    if(!res.ok)throw new Error(textValue(data,['error','message'])||`HTTP ${res.status}`);
    lastResult={conceptId:payload.conceptId,question:payload.question,answer:payload.answer,data};
    window.PSLE_AI_LAST_RESULT=lastResult;
    return data;
  }finally{clearTimeout(timer)}
}
function recordAIRating(rate,detail){
  if(typeof rateApp==='function')rateApp(rate);
  const box=$id('appFeedback'); if(!box)return;
  const cls=rate==='correct'?'good':rate==='lr'?'purplebox':'wrong';
  const i=typeof current==='function'?current():0; let mastery='';
  try{const x=typeof rec==='function'?rec(i):null;if(x&&rate==='correct')mastery=`<br><span class="small">Application mastery: ${new Set(x.appCorrectDates||[]).size}/2 different days.</span>`}catch(_e){}
  box.className=`fb ${cls}`; box.innerHTML=`<b>🤖 ${ratingTitle(rate)}</b>${detail?`<br>${escHtml(detail)}`:''}${mastery}`;
}
async function markWithAI(){
  const ans=$id('appAnswer'); const student=(ans&&ans.value||'').trim();
  if(!student){const b=$id('appFeedback');if(b){b.className='fb warnbox';b.textContent='Write your answer first.'}return}
  const btn=$id('aiMarkBtn'); btn.disabled=true; btn.textContent='🤖 AI marking…'; setStatus('● AI marking…','#b45309');
  const payload=currentPayload(student);
  try{
    const data=await requestAI(payload); const rate=extractRating(data); const detail=collectFeedback(data);
    if(!rate){const b=$id('appFeedback');if(b){b.className='fb warnbox';b.innerHTML='<b>AI replied, but the mark could not be read.</b><br><span class="small">'+escHtml(detail||'Please try again.')+'</span>'};setStatus('● AI response received','#b45309')}
    else{recordAIRating(rate,detail);setStatus('● AI ready','#166534')}
  }catch(err){
    const msg=err&&err.name==='AbortError'?'AI marking timed out. Please try again.':`AI marker unavailable: ${err&&err.message?err.message:err}`;
    const b=$id('appFeedback');if(b){b.className='fb wrong';b.innerHTML='<b>Could not reach the AI marker.</b><br><span class="small">'+escHtml(msg)+'</span>'};setStatus('● AI unavailable','#991b1b')
  }finally{btn.disabled=false;btn.textContent='🤖 AI Mark My Answer'}
}
async function previewModel(){
  const ans=$id('appAnswer'); const student=(ans&&ans.value||'').trim();
  if(!student)throw new Error('Write your answer first.');
  const payload=currentPayload(student);
  const data=await requestAI(payload);
  return {data,payload};
}
window.PSLE_AI_PREVIEW_MODEL=previewModel;
window.PSLE_AI_GET_LAST=()=>lastResult;
installUI();window.addEventListener('load',installUI,{once:true});
})();