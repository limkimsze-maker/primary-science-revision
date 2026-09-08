(()=>{
if(window.PSLE_FRAMEWORK_MARKER_POLICY)return;

const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const isExplain=q=>/\b(explain|why|give\s+(?:a\s+)?reason)\b/i.test(String(q||''));

const FRAMEWORKS={
  change:{n:1,name:'Change → Effect',chain:'CHANGE → AFFECTED PROCESS / FUNCTION → RESULT',rule:'Identify the changed condition; explain how that change affects the relevant Science process or function; link it to the exact result asked.'},
  mechanism:{n:2,name:'Mechanism / Process',chain:'START → SCIENCE MECHANISM → NEXT EFFECT → OUTCOME',rule:'State the starting event or condition when relevant; explain the Science mechanism in a logical sequence; finish with the outcome asked.'},
  evidence:{n:3,name:'Evidence / Data → Explanation',chain:'EVIDENCE → SCIENCE CONCEPT → CONCLUSION',rule:'Use the relevant result, observation, graph/table value or comparison; explain it with the Science concept; state what the evidence means or the conclusion.'},
  compare:{n:4,name:'Comparison → Explanation',chain:'RELEVANT DIFFERENCE → SCIENCE REASON → COMPARATIVE RESULT',rule:'State the relevant difference between A and B; explain the Science effect of that difference; link it to the greater/lower/different result.'},
  feature:{n:5,name:'Structure / Feature → Function',chain:'FEATURE → WHAT IT ENABLES → FUNCTION / ADVANTAGE',rule:'Identify the useful feature, structure, behaviour or property; explain what it enables or how it works; link it to the function, advantage or survival benefit.'},
  experiment:{n:6,name:'Experimental / Process-skill Explanation',chain:'SET-UP / PROCEDURE → WHY IT MATTERS → QUALITY / RESULT',rule:'Identify the relevant variable, procedure, repeated trial or apparatus; explain why it matters; link it to a fair test, reliability, accuracy, validity or the measured result as appropriate.'}
};

function classify(q){
 const t=norm(q);if(!isExplain(q))return null;
 if(/experiment|investigat|fair test|variable|kept same|keep .* same|repeat|reliab|accurac|apparatus|instrument|controlled/.test(t))return'experiment';
 if(/\bevidence\b|\bresults?\b|\bgraph\b|\btable\b|\bdata\b|what .* show|shows? about|observ(?:e|ed|ation)|using .* result|based on .* result|based on .* graph|based on .* observation|from .* result|conclusion/.test(t))return'evidence';
 if(/\bcompare\b|two (?:similar|identical)|plant a .* plant b|one .* while another|explain .* difference|\bthan\b.*\bexplain|explain .*\bthan\b|which .* (?:higher|lower|greater|faster|slower|stronger|more|less).*\bexplain/.test(t))return'compare';
 const feature=/feature|structure|adapt|body covering|beak|wing|hooks?|hairs?|webbed|camouflage|surface area|trapped air|material property|transparent|opaque|migration|hibernation|aerial roots?|suitable for|suited to|nest|thorn|fat layer/;
 const functionWord=/help|advantage|function|surviv|dispers|protect|support|suitable|suited|reduce .* chance|obtain food|cope|allows?|enables?|safe|predator/;
 if(feature.test(t)&&functionWord.test(t))return'feature';
 const changed=/block(?:s|ed|ing)?|damag(?:e|es|ed|ing)|remov(?:e|es|ed|ing)|injur(?:e|ed)|cover(?:s|ed|ing)?|fewer|\bfew\b|\bless\b|\bmore\b|increas(?:e|es|ed|ing)|decreas(?:e|es|ed|ing)|rises?|falls?|higher|lower|add(?:s|ed|ing)|lost|loses|stops?|cannot|unable|weak|moved closer|moved farther|hotter|cooler|rough|smooth|open(?:s|ed|ing)?|clos(?:e|es|ed|ing)|break|scarce|cleared|pollution|no light|without light|darkness|another battery|figurine|lubricant/;
 const effect=/affect|reduce|increase|decrease|may|eventually|predict|what happens|what may happen|what could happen|does not|cannot|difficulty|why .* die|why .* grow|why .* receive|why .* obtain|why .* absorb|why .* brighter|why .* dimmer|why .* important|why .* not|effect on|lead to|helps?|brighter|dimmer|goes out|stays lit|easier|slower|faster/;
 if(changed.test(t)&&effect.test(t))return'change';
 return'mechanism';
}

function rubricFor(question){
 const key=classify(question);if(!key)return null;
 const f=FRAMEWORKS[key];
 return {
   key,
   f,
   items:[
     `10-SCHOOL CALIBRATION + EXPLAIN FRAMEWORK — Type ${f.n}: ${f.name}. Required logical pattern: ${f.chain}. ${f.rule} Full credit requires every mark-bearing Science idea/link needed by the command word to be explicit enough; do not infer a missing causal link merely because the right keywords appear.`,
     'SEMANTIC + CONTEXT RULE: Accept scientifically equivalent wording, sentence order and connectors; minor grammar errors do not make correct Science wrong unless meaning changes. However, use the actual object/source/variable/observation from THIS question. Evidence must be what was observed/measured (or a valid comparison), not a restated conclusion. Comparative questions need the correct direction/comparative meaning (more/less, greater/lower, faster/slower, open/closed, can/cannot).',
     'PROCESS-SKILL + QUALITY RULE: Fair test answers must name the relevant variable/condition rather than give only generic wording. Reliability and accuracy are different; for improving reliability of numerical results, repeat trials and average them, while accuracy needs a suitable measurement/procedure. If the answer is correct AND every framework link is explicit, context-specific and unambiguous, start STRENGTHS with "FRAMEWORK-EXCELLENT:". If it is still sufficient for likely full credit but less explicit/polished, start STRENGTHS with "PSLE-ACCEPTABLE:". These are training labels, not official PSLE grades.'
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
  // The worker reads at most 12 rubric lines. Put the cross-school calibration first
  // so it can never be silently truncated by a long concept-specific rubric.
  body.rubric=[...policy.items,...existing].slice(0,12);
  body.frameworkType=policy.f.name;
  body.frameworkChain=policy.f.chain;

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
    ? `🌟 Excellent — Framework ${policy.f.n}: ${policy.f.name}. All required Science links are explicit and context-specific.`
    : psleAcceptable
      ? `✅ PSLE-acceptable — Framework ${policy.f.n}: ${policy.f.name}. The required mark-bearing Science meaning is present; exact wording is not required.`
      : `Use Framework ${policy.f.n} — ${policy.f.name}: ${policy.f.chain}.`;
  data.framework={number:policy.f.n,name:policy.f.name,chain:policy.f.chain};
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
 if(p)note.innerHTML=`AI uses the <b>10-school P6 prelim calibration</b> and marks this as <b>Framework ${p.f.n}: ${p.f.name}</b> — ${p.f.chain}. <b>Meaning and mark-bearing links matter; exact wording does not.</b> 🌟 Excellent = full chain explicit. ✅ PSLE-acceptable = likely full-credit Science with less polished expression.`;
}

const obs=new MutationObserver(()=>setTimeout(updateNote,20));
try{obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true})}catch(_e){}
window.addEventListener('load',updateNote,{once:true});setTimeout(updateNote,100);
window.PSLE_FRAMEWORK_MARKER_POLICY={FRAMEWORKS,classify,rubricFor,calibration:'10-school P6 prelim/mock 2026'};
})();
