(()=>{
const ENDPOINT='https://primary-science-ai-marker.limkimsze-maker.workers.dev/mark-process';
const FALLBACK_ENDPOINT='https://primary-science-ai-marker.limkimsze-maker.workers.dev/mark';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const RUBRICS={
  1:['Identify the exact variable that must be kept the same.','Apply the fair-test rule to THIS experiment, not just state the generic fair-test definition.','Explain that keeping it the same ensures only the changed variable affects the measured result.','Do not accept a vague statement such as “to make it a fair test” on its own.'],
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
const PSLE_CALIBRATION={
  1:'For fair-test “why keep X the same?” questions, a generic definition of fair test alone earns no application credit. The pupil must apply the rule to the actual variables in THIS experiment: identify the variable kept the same and link it to the changed factor and measured result. Technical labels are unnecessary if the relationship is clear.',
  2:'Accept correct identification of changed/measured variables using either standard labels or clear equivalent wording.',
  3:'A relationship answer must link changed variable to measured variable and direction; split the description only if the trend changes.',
  4:'A hypothesis predicts the effect of the changed variable on the measured variable.',
  5:'Reliability concerns repeated consistent results; averaging is included when appropriate to the data context.',
  6:'Do not confuse reliability with accuracy. Accuracy concerns closeness to actual value and suitable apparatus/procedure.',
  7:'A control is a comparison set-up with the relevant changed factor absent/unchanged while other relevant conditions remain the same.',
  8:'Apparatus choice depends on quantity measured, suitable range and required precision.',
  9:'For accurate liquid volume, a measuring cylinder is preferred to a beaker because of finer graduations/greater precision.',
 10:'Accept eye-level reading as the key action; explanation about avoiding viewing-angle/parallax error is needed only when the question asks why.',
 11:'Water displacement requires initial reading, full submersion, final reading and subtraction.',
 12:'Obey the command word; observation is what is seen/measured, inference is a conclusion; comparison should cover both sides when asked.'
};
const FAIR_TEST_REQUIREMENTS={
 'A pupil investigates whether the amount of light affects plant growth. Why must the type of plant be kept the same?':[
  {label:'the variable kept the same (type/kind of plant)',any:['type of plant','kind of plant','same plant type','same type of plant','same kind of plant']},
  {label:'the changed factor (amount of light)',any:['amount of light','light amount','light intensity','intensity of light','light received']},
  {label:'the measured result (plant growth)',any:['plant growth','growth of the plant','growth of plants','growth']}
 ],
 'Two identical toy cars are tested on different surfaces. Explain why the same car should be used for both tests.':[
  {label:'the variable kept the same (same car)',any:['same car','identical car','same toy car','same vehicle']},
  {label:'the changed factor (type of surface)',any:['type of surface','different surfaces','surface type','surface']},
  {label:'the result/effect being compared',any:['result','results','outcome','difference','distance','speed','movement','travels','travelled']}
 ],
 'A pupil changes the temperature of water to investigate how fast sugar dissolves. Why must the amount of sugar be kept the same?':[
  {label:'the variable kept the same (amount of sugar)',any:['amount of sugar','same amount of sugar','quantity of sugar']},
  {label:'the changed factor (water temperature)',any:['temperature of water','water temperature','temperature']},
  {label:'the measured result (how fast/time taken to dissolve)',any:['time taken','dissolve','dissolves','dissolving','rate of dissolving','how fast']}
 ]
};
function currentSkill(){
  const n=parseInt(($('processCount')?.textContent||'1').split(' ')[0],10)||1;
  return (window.PROCESS_SKILLS||[]).find(x=>x.id===n)||null;
}
function currentVariant(skill){
  const q=($('processQuestion')?.textContent||'').trim();
  return skill?.variants?.find(v=>v.q===q)||skill?.variants?.[0]||{q,model:''};
}
function detailFrom(data){
  const bits=[];
  for(const k of ['strengths','feedback']){const v=data?.[k];if(typeof v==='string'&&v.trim())bits.push(v.trim())}
  if(typeof data?.missing==='string'&&data.missing.trim()&&!/^none\b/i.test(data.missing.trim()))bits.push('Missing: '+data.missing.trim());
  if(data?.improvedAnswer)bits.push('Improved PSLE answer: '+data.improvedAnswer.trim());
  return [...new Set(bits)].join(' ');
}
function checkRequiredConcepts(answer,requirements){
  const a=norm(answer);const missing=[];
  (requirements||[]).forEach(g=>{if(!(g.any||[]).some(p=>a.includes(norm(p))))missing.push(g.label)});
  return {ok:missing.length===0,missing};
}
function install(){
  if(!$('processAnswer')||$('processAIMarkBtn'))return false;
  const row=document.createElement('div');row.className='actions';row.id='processAIRow';
  row.innerHTML='<button class="primary" id="processAIMarkBtn">🤖 AI Mark My Answer</button><span id="processAIStatus" class="small" style="font-weight:700;color:#166534">● AI ready</span>';
  $('processAnswer').insertAdjacentElement('afterend',row);
  const note=document.createElement('div');note.className='small';note.style.marginTop='6px';note.innerHTML='<b>Marking hierarchy:</b> PSLE/process-skill rubric → book benchmark → PSLE answer-pattern calibration → AI judgement. For fair-test application questions, a generic fair-test rule alone is <b>not enough</b>; the answer must use the actual variables in the question.';row.insertAdjacentElement('afterend',note);
  $('processAIMarkBtn').onclick=mark;
  return true;
}
function setStatus(t,c){const s=$('processAIStatus');if(s){s.textContent=t;s.style.color=c||'#64748b'}}
function recordCorrect(box,msg){
  $('processAppCorrect')?.click();
  setTimeout(()=>{if(box){box.className='fb good';box.innerHTML='<b>🤖 Correct ✅</b>'+(msg?'<br>'+esc(msg):'')}},0);
}
function recordNeedsWork(box,msg){
  $('processAppFocus')?.click();
  setTimeout(()=>{if(box){box.className='fb wrong';box.innerHTML='<b>🤖 Needs work</b>'+(msg?'<br>'+esc(msg):'')}},0);
}
async function postJSON(url,payload,signal){
  const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal});
  const raw=await res.text();let data;try{data=JSON.parse(raw)}catch(_e){data={message:raw}}
  return {res,data,raw};
}
async function mark(){
  const answer=($('processAnswer')?.value||'').trim();
  const box=$('processAppFeedback');
  if(!answer){if(box){box.className='fb warnbox';box.textContent='Write your answer first.'}return}
  const skill=currentSkill(),variant=currentVariant(skill);if(!skill)return;

  // LEVEL 1 RUBRIC GATE for fair-test application questions.
  // A generic rule such as “A fair test changes only one variable...” is knowledge recall,
  // not an answer to a question asking why a particular variable must be kept the same.
  const requiredConcepts=skill.id===1?(FAIR_TEST_REQUIREMENTS[variant.q]||[]):[];
  if(requiredConcepts.length){
    const gate=checkRequiredConcepts(answer,requiredConcepts);
    if(!gate.ok){
      recordNeedsWork(box,'You know the general fair-test rule, but you have not applied it fully to this experiment. Include '+gate.missing.join('; ')+'. A safe answer is: '+(variant.model||''));
      setStatus('● Rubric check: application incomplete','#991b1b');
      return;
    }
  }

  // Reviewed-model safety: once the question-specific rubric gate has passed, an answer containing
  // the complete reviewed model cannot be rejected merely because it adds another correct sentence.
  const aNorm=norm(answer),mNorm=norm(variant.model||'');
  if(mNorm&&aNorm.includes(mNorm)){
    recordCorrect(box,'All required question-specific scoring ideas are present. Extra correct explanation is not penalised.');
    setStatus('● AI ready','#166534');
    return;
  }

  const btn=$('processAIMarkBtn');btn.disabled=true;btn.textContent='🤖 AI marking…';setStatus('● AI marking…','#b45309');
  const payload={
    skillId:skill.id,
    topic:skill.topic,
    question:variant.q,
    answer,
    bookRule:skill.target,
    modelAnswer:variant.model||skill.target,
    rubric:RUBRICS[skill.id]||[skill.target],
    psleCalibration:PSLE_CALIBRATION[skill.id]||'Accept concise Primary 6 wording that satisfies the scoring ideas; do not require exact model wording.',
    requiredConcepts
  };
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),30000);
  try{
    let {res,data}=await postJSON(ENDPOINT,payload,ctl.signal);
    if(res.status===404){
      const fallback={conceptId:190+skill.id,topic:'Process Skill — '+skill.topic,question:variant.q,answer,verbatim:skill.target,modelAnswer:variant.model||skill.target,rubric:RUBRICS[skill.id]||[skill.target]};
      ({res,data}=await postJSON(FALLBACK_ENDPOINT,fallback,ctl.signal));
      if(!res.ok)throw new Error(data?.error||data?.message||`HTTP ${res.status}`);
      const oldCorrect=String(data?.rating||data?.verdict||'').toLowerCase().includes('correct') || (data?.conceptCorrect===true && (!data?.missing || /^none\b/i.test(String(data.missing))));
      if(oldCorrect)recordCorrect(box,detailFrom(data)||'The required process-skill idea is present.');
      else recordNeedsWork(box,detailFrom(data)||'Review the specific process-skill scoring ideas.');
      setStatus('● AI ready (deployment fallback)','#b45309');
      return;
    }
    if(!res.ok)throw new Error(data?.error||data?.message||`HTTP ${res.status}`);
    const detail=detailFrom(data);
    if(data?.correct===true)recordCorrect(box,detail||'The PSLE/process-skill rubric is satisfied.');
    else recordNeedsWork(box,detail||'One or more required process-skill scoring ideas are missing or incorrect.');
    setStatus('● AI ready · process hierarchy','#166534');
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