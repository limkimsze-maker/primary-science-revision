(()=>{
const ENDPOINT='https://primary-science-ai-marker.limkimsze-maker.workers.dev/mark';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RUBRICS={
  1:['Identify the exact variable that must be kept the same.','Explain that keeping it the same ensures only the changed variable affects the measured variable.','Do not accept a vague statement such as “to make it a fair test” on its own.'],
  2:['Correctly identify the changed variable.','Correctly identify the measured variable.','If asked, distinguish controlled variables as factors kept the same.'],
  3:['Name the changed variable and measured variable.','State the direction of change correctly.','If the trend changes, describe each section separately.'],
  4:['Make a prediction linking the changed variable to the measured variable.','State the expected direction of change clearly.'],
  5:['Repeat the experiment several times.','Check that repeated results are consistent or similar.','Calculate an average when appropriate.'],
  6:['Distinguish accuracy from reliability correctly.','For accuracy, refer to closeness to the actual value and suitable apparatus/procedure.','For reliability, refer to consistency of repeated results.'],
  7:['Keep the control set-up the same except for the factor being investigated.','Explain that it provides a comparison to confirm the effect of the changed factor.'],
  8:['Choose apparatus suitable for what is being measured.','Match the apparatus range and precision to the measurement required.'],
  9:['Choose a measuring cylinder when an accurate liquid-volume reading is required.','Explain that its finer graduations give a more precise reading than a beaker.'],
 10:['Take the reading at eye level where appropriate.','Explain that this avoids an incorrect reading caused by viewing angle.'],
 11:['Measure the initial water volume.','Fully submerge the irregular solid.','Measure the final water volume.','Subtract initial volume from final volume.'],
 12:['Follow the command word.','For observation, state what is actually seen or measured rather than an inference.','For comparison, refer explicitly to both items when required.']
};
function currentSkill(){
  const n=parseInt(($('processCount')?.textContent||'1').split(' ')[0],10)||1;
  return (window.PROCESS_SKILLS||[]).find(x=>x.id===n)||null;
}
function currentVariant(skill){
  const q=($('processQuestion')?.textContent||'').trim();
  return skill?.variants?.find(v=>v.q===q)||skill?.variants?.[0]||{q,model:''};
}
function emptyMissing(v){
  const s=String(v??'').trim().toLowerCase().replace(/[.!]/g,'');
  return !s||['none','nothing','n/a','na','nil','no','no missing points','nothing missing'].includes(s)||/^none\b/.test(s)||/^no\s+(important\s+)?(idea|point|concept|element).*(missing|omitted)/.test(s);
}
function detailFrom(data){
  const bits=[];
  for(const k of ['strengths','feedback']){const v=data?.[k];if(typeof v==='string'&&v.trim())bits.push(v.trim())}
  if(typeof data?.missing==='string'&&data.missing.trim()&&!emptyMissing(data.missing))bits.push('Missing: '+data.missing.trim());
  if(data?.improvedAnswer)bits.push('Improved PSLE answer: '+data.improvedAnswer.trim());
  return [...new Set(bits)].join(' ');
}
function genericCorrect(data){
  const r=String(data?.rating||data?.verdict||'').toLowerCase();
  return r==='correct'||r==='full'||r==='pass'||r.includes('correct');
}
function processCorrect(data){
  if(genericCorrect(data))return true;
  // Process-skill questions are not always naturally D/E-S/R-L/R questions. The shared Science
  // marker can occasionally attach a missing-component label even after judging the actual rubric
  // complete. For this tab, a correct concept judgment + no substantive missing rubric point wins.
  if(data?.conceptCorrect===true&&emptyMissing(data?.missing))return true;
  return false;
}
function install(){
  if(!$('processAnswer')||$('processAIMarkBtn'))return false;
  const row=document.createElement('div');row.className='actions';row.id='processAIRow';
  row.innerHTML='<button class="primary" id="processAIMarkBtn">🤖 AI Mark My Answer</button><span id="processAIStatus" class="small" style="font-weight:700;color:#166534">● AI ready</span>';
  $('processAnswer').insertAdjacentElement('afterend',row);
  const note=document.createElement('div');note.className='small';note.style.marginTop='6px';note.innerHTML='AI marks the <b>idea</b>, not exact wording. For fair-test questions it checks whether the exact controlled variable is linked to the changed and measured variables.';row.insertAdjacentElement('afterend',note);
  $('processAIMarkBtn').onclick=mark;
  return true;
}
function setStatus(t,c){const s=$('processAIStatus');if(s){s.textContent=t;s.style.color=c||'#64748b'}}
async function mark(){
  const answer=($('processAnswer')?.value||'').trim();
  const box=$('processAppFeedback');
  if(!answer){if(box){box.className='fb warnbox';box.textContent='Write your answer first.'}return}
  const skill=currentSkill(),variant=currentVariant(skill);if(!skill)return;
  const btn=$('processAIMarkBtn');btn.disabled=true;btn.textContent='🤖 AI marking…';setStatus('● AI marking…','#b45309');
  const payload={
    conceptId:190+skill.id,
    topic:'Process Skill — '+skill.topic,
    question:variant.q,
    answer,
    verbatim:skill.target,
    modelAnswer:variant.model||skill.target,
    rubric:RUBRICS[skill.id]||[skill.target]
  };
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),30000);
  try{
    const res=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:ctl.signal});
    const raw=await res.text();let data;try{data=JSON.parse(raw)}catch(_e){data={message:raw}}
    if(!res.ok)throw new Error(data?.error||data?.message||`HTTP ${res.status}`);
    const ok=processCorrect(data),detail=detailFrom(data)||data?.message||'';
    if(ok){$('processAppCorrect')?.click();setTimeout(()=>{if(box){box.className='fb good';box.innerHTML='<b>🤖 AI: Correct ✅</b>'+(detail?'<br>'+esc(detail):'')}},0)}
    else{$('processAppFocus')?.click();setTimeout(()=>{if(box){box.className='fb wrong';box.innerHTML='<b>🤖 AI: Needs work</b>'+(detail?'<br>'+esc(detail):'')}},0)}
    setStatus('● AI ready','#166534');
  }catch(err){
    const msg=err?.name==='AbortError'?'AI marking timed out. Please try again.':(err?.message||String(err));
    if(box){box.className='fb wrong';box.innerHTML='<b>Could not reach the AI marker.</b><br><span class="small">'+esc(msg)+'</span>'}
    setStatus('● AI unavailable','#991b1b');
  }finally{clearTimeout(timer);btn.disabled=false;btn.textContent='🤖 AI Mark My Answer'}
}
if(!install()){
  let tries=0;const t=setInterval(()=>{tries++;if(install()||tries>50)clearInterval(t)},100);
}
})();