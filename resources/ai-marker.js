(()=>{
const ENDPOINT='https://primary-science-ai-marker.limkimsze-maker.workers.dev/mark';
const $id=id=>document.getElementById(id);
const escHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
let lastResult=null;

function installUI(){
  const app=$id('appPane'); if(!app||$id('aiMarkBtn'))return;
  const answer=$id('appAnswer'); if(!answer)return;
  const row=document.createElement('div');
  row.className='actions'; row.id='aiMarkRow';
  row.innerHTML='<button class="primary" id="aiMarkBtn">🤖 AI Mark My Answer</button><span id="aiStatus" class="small" style="font-weight:700;color:#166534">● AI ready</span>';
  answer.insertAdjacentElement('afterend',row);
  const note=document.createElement('div'); note.className='small'; note.id='aiMarkNote'; note.style.marginTop='6px';
  note.innerHTML='AI follows the <b>same command-word rules as the 2 PSLE posters</b>. A second local PSLE audit checks every AI result so a pupil is not penalised for D/E, S/R or L/R that the question did not actually require.';
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
function noMissing(v){
  const s=norm(v);
  return !s||s==='none'||s==='nothing'||s==='nil'||s==='no missing ideas'||s==='nothing missing'||s==='no required ideas are missing';
}
function questionPolicy(question){
  const q=String(question||'').trim(),t=q.toLowerCase();
  const reason=/\b(explain|why|give\s+(?:a\s+)?reason)\b/i.test(q);
  const evidence=/\busing (?:the )?(?:data|evidence|results?)\b|\bbased on (?:the )?(?:data|results?)\b|\bfrom (?:the )?(?:data|results?)\b|\bevidence supports?\b|\bgraph\b|\btable\b|\breadings?\b|\bresults? show\b|\bwhat does .* show\b/i.test(q);
  const direct=/\b(what|which|identify|name|state)\b/i.test(q)&&!evidence;
  const compare=/\bcompare\b/i.test(q);
  const predict=/\bpredict\b/i.test(q);
  const suggest=/\bsuggest\b/i.test(q);
  const describe=/\bdescribe\b/i.test(q);
  const relationship=/\bstate the relationship\b|\brelationship between\b/i.test(q);
  const experiment=/\bexperiment|investigat|fair test|variable|results?\b/i.test(q);
  const directOnly=direct&&!reason&&!compare&&!predict&&!suggest&&!describe&&!relationship;
  const compareOnly=compare&&!reason;
  const predictOnly=predict&&!reason;
  const suggestOnly=suggest&&!reason;
  const describeOnly=describe&&!reason;
  return {q,t,reason,directOnly,compareOnly,predictOnly,suggestOnly,describeOnly,relationship,evidence,experiment};
}
function internallySaysCorrect(d,payload){
  if(!d||!payload)return false;
  const improvedSame=norm(d.improvedAnswer)&&norm(d.improvedAnswer)===norm(payload.answer);
  if(improvedSame)return true;
  const conceptOK=d?.criteria?.conceptCorrect===true||d.conceptCorrect===true;
  if(!conceptOK||!noMissing(d.missing))return false;
  const wording=norm([d.feedback,d.strengths,d.message].filter(Boolean).join(' '));
  return /\b(correct and concise|fully correct|correct answer|directly addresses the question|all required|nothing missing|no required)\b/.test(wording);
}
function questionKey(payload){return norm(payload?.question).slice(0,220)}
function storedImproved(payload){
  try{const i=typeof current==='function'?current():0,x=typeof rec==='function'?rec(i):null,k=questionKey(payload);return x?.guidedImprovedByQuestion?.[k]||''}catch(_e){return ''}
}
function rememberImproved(payload,data){
  const improved=String(data?.improvedAnswer||'').trim();if(!improved)return;
  try{const i=typeof current==='function'?current():0,x=typeof rec==='function'?rec(i):null,k=questionKey(payload);if(!x||!k)return;x.guidedImprovedByQuestion=x.guidedImprovedByQuestion||{};x.guidedImprovedByQuestion[k]=improved;const keys=Object.keys(x.guidedImprovedByQuestion);if(keys.length>20)keys.slice(0,keys.length-20).forEach(a=>delete x.guidedImprovedByQuestion[a]);if(typeof save==='function')save()}catch(_e){}
}
function previousImprovedMatch(payload){
  const answer=norm(payload.answer);if(!answer)return false;
  if(lastResult&&lastResult.conceptId===payload.conceptId&&lastResult.question===payload.question){const improved=norm(lastResult.data?.improvedAnswer);if(improved&&improved===answer)return true}
  const saved=norm(storedImproved(payload));return !!(saved&&saved===answer);
}
function rawRating(d){
  if(!d)return null;
  for(const x of [d.rating,d.verdict,d.result,d.category,d.classification,d.status,d.label]){const r=normalizeRating(x);if(r)return r}
  return null;
}
function auditedRating(d,payload){
  if(previousImprovedMatch(payload))return {rate:'correct',reason:'previous-improved'};
  if(internallySaysCorrect(d,payload))return {rate:'correct',reason:'self-contradiction'};
  if(!d)return {rate:null,reason:''};
  const p=questionPolicy(payload.question),c=d.criteria||{},raw=rawRating(d);
  const conceptOK=c.conceptCorrect===true||d.conceptCorrect===true;
  const srOK=c.srRequired!==true||c.srMet===true;
  const lrOK=c.lrRequired!==true||c.lrMet===true;

  // Framework categories are not extra marks on questions whose command word does not ask for them.
  // Keep this conservative: an actual missing Science idea should still be returned as concept/S-R.
  if(conceptOK&&(p.directOnly||p.compareOnly||p.predictOnly||p.suggestOnly||p.describeOnly)&&['de','lr'].includes(raw)){
    return {rate:'correct',reason:'command-word'};
  }
  if(conceptOK&&p.relationship&&['de','sr','lr'].includes(raw))return {rate:'correct',reason:'command-word'};

  // For ordinary Explain/Why questions, S/R is the mark-bearing core. A scenario already printed
  // in the question does not create a separate D/E mark. Require D/E only when the wording really
  // calls for data/evidence/results/experimental evidence.
  if(raw==='de'&&p.reason&&!p.evidence&&!p.experiment){
    if(!srOK)return {rate:'sr',reason:'command-word'};
    if(!lrOK)return {rate:'lr',reason:'command-word'};
    if(conceptOK)return {rate:'correct',reason:'command-word'};
  }
  return {rate:raw,reason:''};
}
function collectFeedback(d){if(!d)return '';let parts=[];for(const k of ['feedback','missing','strengths','reason','explanation','message']){const v=d[k];if(typeof v==='string'&&v.trim()&&!noMissing(v))parts.push(v.trim())}if(d.improvedAnswer)parts.push('Improved answer: '+d.improvedAnswer);return [...new Set(parts)].join(' ')}
function ratingTitle(rate){return {correct:'✅ Correct',de:'🟨 D/E missing',sr:'🟧 S/R missing / wrong',lr:'🟪 L/R missing',concept:'❌ Concept not known'}[rate]||'AI result'}
function currentPayload(studentAnswer){
  const i=typeof current==='function'?current():0; const e=(typeof BANK!=='undefined'&&BANK[i])?BANK[i]:{};
  const question=($id('appQuestion')&&$id('appQuestion').textContent||e.applicationQuestion||'').trim();
  return {
    conceptId:Number(e.id||i+1),topic:e.topic||'',question,answer:studentAnswer,
    verbatim:e.phrase||'',modelAnswer:e.modelApplicationAnswer||e.phrase||'',rubric:Array.isArray(e.rubric)?e.rubric:[]
  };
}
function locallyCertainCorrect(payload){
  const q=norm(payload?.question),a=norm(payload?.answer),m=norm(payload?.modelAnswer);
  if(!a)return '';
  if(previousImprovedMatch(payload))return 'Correct. This is the improved PSLE answer that the marker itself gave. The app will not reject its own model answer.';
  if(m&&a===m&&q&&typeof BANK!=='undefined'){
    const i=typeof current==='function'?current():0,e=BANK[i]||{};
    if(q===norm(e.phrasePrompt||''))return 'Your answer matches the model answer. Punctuation and capitalisation are ignored.';
  }
  if(q.includes('coloured water')&&q.includes('leaves')){
    const hasTube=/\bwater carrying tubes?\b|\bxylem\b/.test(a),hasWater=/\bcoloured water\b|\bcolored water\b|\bwater\b/.test(a),hasLeaf=/\bleaf\b|\bleaves\b/.test(a),hasMove=/\btransport(?:ed|s|ing)?\b|\bcarried\b|\bcarry\b|\breach(?:es|ed|ing)?\b/.test(a);
    if(hasTube&&hasWater&&hasLeaf&&hasMove)return 'Correct. The required pathway is present: coloured water is carried through the water-carrying tubes to the leaves.';
  }
  if(q.includes('damaged roots')&&q.includes('water')&&q.includes('mineral salts')){
    const hasRoots=/\bdamaged roots?\b|\broot system\b/.test(a),hasAbsorb=/\babsorb(?:s|ed|ing|tion)?\b/.test(a),hasWater=/\bwater\b/.test(a),hasMineral=/\bmineral salts?\b/.test(a),hasSoil=/\bsoil\b/.test(a);
    if(hasRoots&&hasAbsorb&&hasWater&&hasMineral&&hasSoil)return 'Correct. You linked the damaged roots to reduced absorption of water and mineral salts from the soil, which fully answers the Explain question.';
  }
  return '';
}
function sameRequest(payload){return !!(lastResult&&lastResult.question===payload.question&&lastResult.answer===payload.answer&&lastResult.conceptId===payload.conceptId&&lastResult.data)}
async function requestAI(payload){
  if(sameRequest(payload))return lastResult.data;
  const ctl=new AbortController(); const timer=setTimeout(()=>ctl.abort(),30000);
  try{
    const res=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:ctl.signal});
    const raw=await res.text(); let data; try{data=JSON.parse(raw)}catch(_e){data={message:raw}}
    if(!res.ok)throw new Error(textValue(data,['error','message'])||`HTTP ${res.status}`);
    rememberImproved(payload,data);
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
    const certain=locallyCertainCorrect(payload);
    if(certain){recordAIRating('correct',certain);setStatus('● AI ready','#166534');return}
    const data=await requestAI(payload); const audit=auditedRating(data,payload); let detail=collectFeedback(data);
    if(audit.rate==='correct'&&audit.reason==='command-word')detail='Correct after PSLE command-word audit. The first AI pass asked for a D/E, S/R or L/R component that this exact question does not separately require.';
    if(audit.rate==='correct'&&audit.reason==='previous-improved')detail='Correct. This matches the improved PSLE answer previously supplied by the marker.';
    if(audit.rate==='correct'&&audit.reason==='self-contradiction')detail='Correct. The AI response was internally contradictory, so the app accepted the scientifically complete answer.';
    if(!audit.rate){const b=$id('appFeedback');if(b){b.className='fb warnbox';b.innerHTML='<b>AI replied, but the mark could not be read.</b><br><span class="small">'+escHtml(detail||'Please try again.')+'</span>'};setStatus('● AI response received','#b45309')}
    else{recordAIRating(audit.rate,detail);setStatus('● AI ready','#166534')}
  }catch(err){
    const msg=err&&err.name==='AbortError'?'AI marking timed out. Please try again.':`AI marker unavailable: ${err&&err.message?err.message:err}`;
    const b=$id('appFeedback');if(b){b.className='fb wrong';b.innerHTML='<b>Could not reach the AI marker.</b><br><span class="small">'+escHtml(msg)+'</span>'};setStatus('● AI unavailable','#991b1b')
  }finally{btn.disabled=false;btn.textContent='🤖 AI Mark My Answer'}
}
async function previewModel(){
  const ans=$id('appAnswer'); const student=(ans&&ans.value||'').trim();
  if(!student)throw new Error('Write your answer first.');
  const payload=currentPayload(student); const data=await requestAI(payload); return {data,payload};
}
window.PSLE_AI_PREVIEW_MODEL=previewModel;
window.PSLE_AI_GET_LAST=()=>lastResult;
window.PSLE_MARKING_AUDIT={questionPolicy,auditedRating,locallyCertainCorrect,storedImproved};
installUI();window.addEventListener('load',installUI,{once:true});
})();