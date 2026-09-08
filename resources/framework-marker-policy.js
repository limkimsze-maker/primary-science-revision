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
 if(/\bevidence\b|\bresults?\b|\bgraph\b|\btable\b|\bdata\b|what .* show|shows? about|observ(?:e|ed|ation)|using .* result|based on .* result|from .* result/.test(t))return'evidence';
 if(/\bcompare\b|two (?:similar|identical)|plant a .* plant b|one .* while another|explain .* difference|\bthan\b.*\bexplain|explain .*\bthan\b|which .* (?:higher|lower|greater|faster|slower|stronger|more|less).*\bexplain/.test(t))return'compare';
 const feature=/feature|structure|adapt|body covering|beak|wing|hooks?|hairs?|webbed|camouflage|surface area|trapped air|material property|transparent|opaque|migration|hibernation|aerial roots?|suitable for|suited to/;
 const functionWord=/help|advantage|function|surviv|dispers|protect|support|suitable|suited|reduce .* chance|obtain food|cope|allows?|enables?/;
 if(feature.test(t)&&functionWord.test(t))return'feature';
 const changed=/block(?:s|ed|ing)?|damag(?:e|es|ed|ing)|remov(?:e|es|ed|ing)|injur(?:e|ed)|cover(?:s|ed|ing)?|fewer|\bfew\b|\bless\b|\bmore\b|increas(?:e|es|ed|ing)|decreas(?:e|es|ed|ing)|rises?|falls?|higher|lower|add(?:s|ed|ing)|lost|loses|stops?|cannot|unable|weak|moved closer|moved farther|hotter|cooler|rough|smooth|open(?:s|ed|ing)?|clos(?:e|es|ed|ing)|break|scarce|cleared|pollution|no light|without light|darkness|another battery/;
 const effect=/affect|reduce|increase|decrease|may|eventually|predict|what happens|what may happen|what could happen|does not|cannot|difficulty|why .* die|why .* grow|why .* receive|why .* obtain|why .* absorb|why .* brighter|why .* dimmer|why .* important|why .* not|effect on|lead to|helps?|brighter|dimmer|goes out|stays lit|easier/;
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
     `EXPLAIN FRAMEWORK — Type ${f.n}: ${f.name}. Required logical pattern: ${f.chain}. ${f.rule}`,
     'SEMANTIC EQUIVALENCE: Mark Science ideas and links, not model wording. Accept scientifically equivalent vocabulary, sentence order and connectors. Minor grammar errors do not make correct Science wrong unless they change the meaning.',
     'AUDITED CONTEXT/EVIDENCE RULE: Use the actual object, variable, observation or data from this question. An observation must be what was seen/measured, not a restated conclusion. Do not accept generic fair-test/evidence wording when the specific variable or evidence is required. Direction/comparison such as more/less, greater/lower, open/closed and can/cannot must be correct.',
     'FULL-CREDIT/QUALITY RULE: Correct means every mark-bearing Science idea needed by the command word is explicit enough for likely full credit; do not infer a missing causal link from keywords. If correct AND every framework link is explicit, context-specific and unambiguous, begin STRENGTHS with "FRAMEWORK-EXCELLENT:". If correct but scientifically clear with a compressed/implicit non-mark-bearing link, begin STRENGTHS with "PSLE-ACCEPTABLE:". These are training labels, not official PSLE grades.'
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
  const merged=[...existing];
  for(const item of policy.items){if(!merged.includes(item))merged.push(item)}
  body.rubric=merged.slice(0,12);
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
      ? `✅ PSLE-acceptable — Framework ${policy.f.n}: ${policy.f.name}. The required Science meaning is present; exact wording is not required.`
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
 if(p)note.innerHTML=`AI marks this as <b>Framework ${p.f.n}: ${p.f.name}</b> — ${p.f.chain}. <b>Meaning and mark-bearing links matter; exact wording does not.</b> 🌟 Excellent means the full framework chain is explicit. ✅ PSLE-acceptable means the Science is still sufficient even if the expression is less polished.`;
}

const obs=new MutationObserver(()=>setTimeout(updateNote,20));
try{obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true})}catch(_e){}
window.addEventListener('load',updateNote,{once:true});setTimeout(updateNote,100);
window.PSLE_FRAMEWORK_MARKER_POLICY={FRAMEWORKS,classify,rubricFor};
})();
