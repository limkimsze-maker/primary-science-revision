(()=>{
if(window.PSLE_FRAMEWORK_MARKER_POLICY)return;

const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const reasoningCommand=q=>/\b(explain|why|give\s+(?:a\s+)?reason|how|compare|predict|describe|suggest|conclude|conclusion|what\s+.*show|using\s+.*(?:result|data|graph|table|observation))\b/i.test(String(q||''));

const FRAMEWORKS={
  change:{code:'F1',n:1,name:'Change → Effect',chain:'CHANGE → AFFECTED PROCESS / FUNCTION → RESULT',rule:'Identify the changed condition; explain how that change affects the relevant Science process or function; link it to the exact result asked.'},
  mechanism:{code:'F2',n:2,name:'Mechanism / Process',chain:'START → SCIENCE MECHANISM → NEXT EFFECT → OUTCOME',rule:'State the starting event or condition when relevant; explain the Science mechanism in a logical sequence; finish with the outcome asked.'},
  evidence:{code:'F3',n:3,name:'Evidence / Data → Explanation',chain:'EVIDENCE → SCIENCE CONCEPT → CONCLUSION',rule:'Use the relevant result, observation, graph/table value or comparison; explain it with the Science concept; state what the evidence means or the conclusion.'},
  compare:{code:'F4',n:4,name:'Comparison → Explanation',chain:'RELEVANT DIFFERENCE → SCIENCE REASON → COMPARATIVE RESULT',rule:'State the relevant difference between A and B; explain the Science effect of that difference; link it to the greater/lower/different result.'},
  feature:{code:'F5',n:5,name:'Structure / Feature → Function',chain:'FEATURE → WHAT IT ENABLES → FUNCTION / ADVANTAGE',rule:'Identify the useful feature, structure, behaviour or property; explain what it enables or how it works; link it to the function, advantage or survival benefit.'},
  experiment:{code:'F6',n:6,name:'Experimental / Process-skill Explanation',chain:'SET-UP / PROCEDURE → WHY IT MATTERS → QUALITY / RESULT',rule:'Identify the relevant variable, procedure, repeated trial or apparatus; explain why it matters; link it to a fair test, reliability, accuracy, validity or the measured result as appropriate.'}
};
const CODE_TO_KEY={F1:'change',F2:'mechanism',F3:'evidence',F4:'compare',F5:'feature',F6:'experiment'};

function classify(q){
 const t=norm(q);if(!t)return null;
 if(/experiment|investigat|fair test|variable|kept same|keep .* same|repeat|reliab|accurac|apparatus|instrument|controlled|precision|range/.test(t))return'experiment';
 if(/\bevidence\b|\bresults?\b|\bgraph\b|\btable\b|\bdata\b|what .* show|shows? about|observ(?:e|ed|ation)|using .* result|based on .* result|based on .* graph|based on .* observation|from .* result|conclusion/.test(t))return'evidence';
 if(/\bcompare\b|two (?:similar|identical)|plant a .* plant b|one .* while another|difference|different from|\bthan\b|whereas|while/.test(t))return'compare';
 const feature=/feature|structure|adapt|body covering|beak|wing|hooks?|hairs?|webbed|camouflage|surface area|trapped air|material property|transparent|translucent|opaque|migration|hibernation|aerial roots?|suitable for|suited to|nest|thorn|fat layer|stomata|openings?|roots?|leaves?|claws?/;
 const functionWord=/help|advantage|function|role|surviv|dispers|protect|support|suitable|suited|reduce .* chance|obtain food|cope|allows?|enables?|safe|predator|exchange|absorb|anchor|grip/;
 if(feature.test(t)&&functionWord.test(t))return'feature';
 if(/^how\b/.test(t)||/describe how|process|pathway|sequence|moves through|passes through|circulat|digest|photosynth|respirat|pollinat|fertilis|pollen tube|evaporat|condens|germinat|electromagnet|electric current|water cycle|energy conversion|converted into|transfer of/.test(t))return'mechanism';
 const changed=/block(?:s|ed|ing)?|damag(?:e|es|ed|ing)|remov(?:e|es|ed|ing)|injur(?:e|ed)|cover(?:s|ed|ing)?|fewer|\bfew\b|\bless\b|\bmore\b|increas(?:e|es|ed|ing)|decreas(?:e|es|ed|ing)|rises?|falls?|higher|lower|add(?:s|ed|ing)|lost|loses|stops?|cannot|unable|weak|moved closer|moved farther|hotter|cooler|rough|smooth|open(?:s|ed|ing)?|clos(?:e|es|ed|ing)|break|scarce|cleared|pollution|no light|without light|darkness|another battery|figurine|lubricant/;
 const effect=/affect|reduce|increase|decrease|may|eventually|predict|what happens|what may happen|what could happen|does not|cannot|difficulty|lead to|helps?|brighter|dimmer|goes out|stays lit|easier|slower|faster|why/;
 if(changed.test(t)&&effect.test(t))return'change';
 return reasoningCommand(q)?'mechanism':null;
}

function assignedKeyForQuestion(question){
 const qn=norm(question);if(!qn)return null;
 try{
  const api=window.PSLE_FRAMEWORK_192;
  if(api&&typeof api.allItems==='function'){
   const hit=api.allItems().find(x=>norm(x?.question)===qn&&CODE_TO_KEY[x?.framework]);
   if(hit)return CODE_TO_KEY[hit.framework];
  }
 }catch(_e){}
 try{
  if(Array.isArray(window.BANK)){
   const cur=typeof window.current==='function'?window.current():-1;
   const ordered=[];
   if(cur>=0&&window.BANK[cur])ordered.push(window.BANK[cur]);
   for(const e of window.BANK)if(e!==ordered[0])ordered.push(e);
   for(const e of ordered){
    const code=String(e?.frameworkReview||'').toUpperCase();
    if(!CODE_TO_KEY[code])continue;
    if(norm(e?.frameworkReviewQuestion)===qn||norm(e?.applicationQuestion)===qn)return CODE_TO_KEY[code];
   }
  }
 }catch(_e){}
 return null;
}

function rubricFor(question,forcedKey){
 const assigned=forcedKey||assignedKeyForQuestion(question);
 const key=assigned||classify(question);if(!key)return null;
 const f=FRAMEWORKS[key];
 const assignedRule=assigned
   ? `LINKED-FRAMEWORK RULE: This Application question is assigned to ${f.code} (${f.name}). Use this assigned framework as the reasoning lens even if the command word is How, Compare, Predict, Describe, Suggest, State or another PSLE command form.`
   : `QUESTION-CLASSIFIED FRAMEWORK: This question is best treated as ${f.code} (${f.name}).`;
 return {
   key,f,assigned:!!assigned,
   items:[
     `${assignedRule} Core reasoning pattern: ${f.chain}. ${f.rule}`,
     'COMMAND-WORD RULE: The command word controls what the pupil must actually write. For Explain/Why/How/Compare/Predict-with-reason, require the mark-bearing links needed by that question. For State/Name/Identify or another direct command, do NOT demand extra explanatory links merely to fill every box in the framework. The framework guides reasoning; it must never manufacture requirements that the question did not ask for.',
     '10-SCHOOL CALIBRATION: Full credit requires the scientifically necessary ideas and relationships for THIS exact context. Do not award full credit merely because keywords are present, but do not reject a complete meaning simply because it is compressed into fewer sentences or uses different connectors.',
     'SEMANTIC + CONTEXT RULE: Accept scientifically equivalent wording, sentence order and connectors; minor grammar errors do not make correct Science wrong unless meaning changes. Use the actual object/source/variable/observation from THIS question. Evidence must be what was observed/measured, not a restated conclusion. Comparative questions need the correct direction (more/less, greater/lower, faster/slower, open/closed, can/cannot).',
     'PROCESS-SKILL RULE: Fair-test answers must name the relevant variable/condition rather than give only generic wording. Reliability and accuracy are different: improving reliability normally involves repeated trials and a representative/average result; accuracy requires a suitable apparatus, reading or procedure.',
     'TRAINING LABEL: If the answer is scientifically correct and gives all mark-bearing ideas/links actually required by the command word, start STRENGTHS with "FRAMEWORK-EXCELLENT:" when the reasoning is explicit and context-specific, or "PSLE-ACCEPTABLE:" when it is sufficient for likely full credit but more compressed. These are training labels, not official PSLE grades.'
   ]
 };
}

const originalFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch(_e){}
  const isMark=/primary-science-ai-marker\.limkimsze-maker\.workers\.dev\/mark(?:$|\?)/.test(url);
  if(!isMark||String(init?.method||'GET').toUpperCase()!=='POST'||!init?.body)return originalFetch(input,init);

  let body;try{body=JSON.parse(String(init.body))}catch(_e){return originalFetch(input,init)}
  const policy=rubricFor(body.question);
  if(!policy)return originalFetch(input,init);

  const existing=Array.isArray(body.rubric)?body.rubric.slice():[];
  body.rubric=[...policy.items,...existing].slice(0,12);
  body.frameworkCode=policy.f.code;
  body.frameworkType=policy.f.name;
  body.frameworkChain=policy.f.chain;
  body.frameworkAssigned=policy.assigned;

  const res=await originalFetch(input,{...init,body:JSON.stringify(body)});
  let raw;try{raw=await res.clone().text()}catch(_e){return res}
  let data;try{data=JSON.parse(raw)}catch(_e){return res}
  if(!data||typeof data!=='object')return res;

  const rating=String(data.rating||data.verdict||'').toLowerCase();
  const accepted=rating==='correct'||rating==='accepted'||rating==='pass'||rating==='full';
  const strengths=String(data.strengths||'');
  const excellent=accepted&&/FRAMEWORK-EXCELLENT:/i.test(strengths);
  const psleAcceptable=accepted&&!excellent;
  data.frameworkQuality=excellent?'excellent':psleAcceptable?'acceptable':'needs-work';
  const prefix=excellent
    ? `🌟 Excellent — ${policy.f.code}: ${policy.f.name}. All mark-bearing Science links required by this question are explicit and context-specific.`
    : psleAcceptable
      ? `✅ PSLE-acceptable — ${policy.f.code}: ${policy.f.name}. The required Science meaning is present; exact wording is not required.`
      : `Use ${policy.f.code} — ${policy.f.name}: ${policy.f.chain}.`;
  data.framework={code:policy.f.code,number:policy.f.n,name:policy.f.name,chain:policy.f.chain,assigned:policy.assigned};
  data.feedback=[prefix,String(data.feedback||'').trim()].filter(Boolean).join(' ');

  return new Response(JSON.stringify(data),{
    status:res.status,
    statusText:res.statusText,
    headers:res.headers
  });
};

function updateNote(){
 const note=document.getElementById('aiMarkNote');if(!note)return;
 const q=String(document.getElementById('appQuestion')?.textContent||document.querySelector('#gfBody .gf-prompt')?.textContent||'').trim();
 const p=rubricFor(q);
 if(p)note.innerHTML=`AI marks this linked question using <b>${p.f.code}: ${p.f.name}</b> — ${p.f.chain}, with the <b>10-school P6 prelim calibration</b>. The command word still decides which links must actually be written. <b>Meaning and mark-bearing Science matter; exact wording does not.</b>`;
}

const obs=new MutationObserver(()=>setTimeout(updateNote,20));
try{obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true})}catch(_e){}
window.addEventListener('load',updateNote,{once:true});setTimeout(updateNote,100);
window.PSLE_FRAMEWORK_MARKER_POLICY={FRAMEWORKS,CODE_TO_KEY,classify,assignedKeyForQuestion,rubricFor,calibration:'10-school P6 prelim/mock 2026',version:'20260909a'};
})();