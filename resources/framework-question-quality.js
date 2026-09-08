(()=>{
if(window.PSLE_FRAMEWORK_QUESTION_QUALITY)return;
const d=document,$=id=>d.getElementById(id);
const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9%]+/g,' ').trim().replace(/\s+/g,' ');
const BAD=/\b(structure or feature involved in|condition involved in|process involved in|records a clear result|this science concept|two similar cases differ in the condition related to|relevant variables or procedure|write the explanation as|state the chain|link the change|link increased|link faster)\b/i;
const META={F1:{n:1,name:'Change → Effect'},F2:{n:2,name:'Mechanism / Process'},F3:{n:3,name:'Evidence / Data → Explanation'},F4:{n:4,name:'Comparison → Explanation'},F5:{n:5,name:'Structure / Feature → Function'},F6:{n:6,name:'Experimental / Process-skill'}};
let loadingOverrides=false;

function classify(q){
 const raw=String(q||''),t=norm(raw);if(!t)return null;
 if(/\b(reliab|accurac|fair test|controlled variable|control variable|changed variable|measured variable|keep .* same|kept .* same|repeat(?:ed|ing)?|apparatus|instrument|range|precision|experiment|investigat)\b/.test(t))return'F6';
 if(/\b(compare|compared|comparison|difference|different from|than|whereas|while|both|identical except|similar .* but|same .* but)\b/.test(t))return'F4';
 const feature=/\b(structure|feature|adaptation|advantage|shape|roots?|stem|leaves?|stomata|openings?|flowers?|fruits?|seeds?|gills?|lungs?|beak|wings?|hooks?|hairs?|fibrous|waterproof|thick|thin|sharp|broad|wide|narrow|hollow|spines?|thorns?|webbed|fat layer|body covering|fur|material|transparent|translucent|opaque|conductor|insulator|trapped air)\b/;
 const functionWord=/\b(role|function|help|helps|allow|allows|enable|enables|support|supports|protect|protects|absorb|absorbs|anchor|anchors|hold|holds|transport|carry|carries|exchange|trap|traps|float|floats|reduce|reduces|prevent|prevents|survive|survival|dispers|suitable|keeps?|blocks?)\b/;
 if(feature.test(t)&&functionWord.test(t))return'F5';
 if(/\b(results?|data|evidence|graph|table|reading|readings|observed|observation|trend|shows that|showed that|what .* show|what this shows|what these .* show|supports? your answer|using the observations?)\b/.test(t))return'F3';
 if(/^\s*(how|trace|describe how)\b/i.test(raw)||/\b(process|pathway|sequence|moves through|passes through|circulat|digest|photosynth|respirat|pollinat|fertilis|pollen tube|evaporat|condens|germinat|electromagnet|electric current|water cycle|energy conversion|converted into|transfer of|reaches? the)\b/.test(t))return'F2';
 if(/\b(explain|why|give a reason|predict|affect|effect|cause|causes|reduce|reduces|increase|increases|decrease|decreases|block|blocks|damage|damaged|remove|removed|add|added|heat|heated|cool|cooled|more|less|fewer|weak|stops?|cannot|unable|gains?|loses?|falls?|rises?|greater|smaller|larger)\b/.test(t))return'F1';
 return null;
}
function candidates(e,id){
 const out=[];const push=(q,model,source)=>{q=String(q||'').trim();if(!q||BAD.test(q))return;out.push({q,model:String(model||e?.phrase||'').trim(),source})};
 (window.APP_VARIANTS?.[id]||[]).forEach(v=>push(v?.q,v?.model,'Audited/authored transfer question'));
 if(Array.isArray(e?.applicationVariants))e.applicationVariants.forEach(v=>push(v?.question,v?.modelApplicationAnswer,'Linked application question'));
 if(e?.applicationQuestion)push(e.applicationQuestion,e.modelApplicationAnswer,'Existing linked application');
 const seen=new Set();return out.filter(x=>{const k=norm(x.q);if(!k||seen.has(k))return false;seen.add(k);return true});
}
function scoreCandidate(c,e){let s=0;const t=norm(c.q),topic=norm(e?.topic||''),phrase=norm(e?.phrase||'');topic.split(' ').filter(w=>w.length>4).forEach(w=>{if(t.includes(w))s+=7});phrase.split(' ').filter(w=>w.length>5).slice(0,10).forEach(w=>{if(t.includes(w))s+=2});const words=t.split(' ').length;if(words>=8&&words<=55)s+=20;if(/\b(explain|why|compare|using|predict|what .* show|trace|how)\b/.test(t))s+=12;if(c.source.startsWith('Audited'))s+=12;return s}
function fallbackFor(e,f){const topic=String(e?.topic||'the Science concept').replace(/[—–]/g,' ').replace(/\s+/g,' ').trim().toLowerCase(),cue=String(e?.phrasePrompt||'').trim().replace(/\?$/,'');if(f==='F2'&&/^(how|what happens)/i.test(cue))return`Explain ${cue.charAt(0).toLowerCase()+cue.slice(1)}.`;if(f==='F5'&&/^how/i.test(cue))return`Explain ${cue.charAt(0).toLowerCase()+cue.slice(1)}.`;if(f==='F3')return`A pupil makes an observation related to ${topic}. Explain what the observation would show using the Science idea in this concept.`;if(f==='F4')return`Compare two cases involving ${topic} and explain the relevant difference using the Science concept.`;if(f==='F6')return`A pupil investigates ${topic}. State what should be changed, what should be measured and one relevant variable that should be kept the same.`;if(f==='F5')return`Explain how the relevant feature in ${topic} helps it carry out its function.`;return`A condition affecting ${topic} changes. Explain how the change can affect the result.`}
function choose(item,e){const cs=candidates(e,item.id).map(c=>({...c,f:classify(c.q)})),exact=cs.filter(c=>c.f===item.framework).sort((a,b)=>scoreCandidate(b,e)-scoreCandidate(a,e));if(exact.length)return exact[0];const natural=cs.filter(c=>c.f).sort((a,b)=>scoreCandidate(b,e)-scoreCandidate(a,e));if(natural.length)return natural[0];return{q:fallbackFor(e,item.framework),model:e?.phrase||'',source:'Framework fallback',f:item.framework}}
function actualCounts(api){const c={F1:0,F2:0,F3:0,F4:0,F5:0,F6:0};for(let id=1;id<=180;id++){const f=api.byScienceId(id)?.framework;if(c[f]!=null)c[f]++}if(Array.isArray(window.PROCESS_SKILLS))c.F6+=window.PROCESS_SKILLS.length;return c}
function patchCountUI(api){const c=actualCounts(api),sel=$('fcFrameworkFilter');if(sel){const keep=/^F[1-6]$/.test(sel.value)?sel.value:'all';sel.innerHTML=`<option value="all">All 6 frameworks — 192</option>`+Object.keys(c).map(f=>`<option value="${f}">${f} ${META[f].name} — ${c[f]}</option>`).join('');sel.value=keep}const map=$('fcMap');if(map)map.innerHTML=`<b>192 linked PSLE-style framework questions</b><br>F1 ${c.F1} · F2 ${c.F2} · F3 ${c.F3} · F4 ${c.F4} · F5 ${c.F5} · F6 ${c.F6}<br><small>Each question remains linked to its flashcard. Existing Known progress is unchanged.</small>`;return c}
function patchCurrent(){const api=window.PSLE_FRAMEWORK_192;if(!api||typeof BANK==='undefined')return;try{if($('guidedFlow')?.dataset?.processMode==='1')return;const i=typeof current==='function'?current():-1,e=i>=0?BANK[i]:null,item=e?api.byScienceId(e.id):null;if(!e||!item)return;const p=d.querySelector('#gfBody .gf-prompt');if(p&&p.textContent.trim()!==item.question)p.textContent=item.question;const h=$('appQuestion');if(h&&h.textContent.trim()!==item.question)h.textContent=item.question;const note=$('variantNote');if(note)note.textContent=`Framework ${META[item.framework].n} · ${META[item.framework].name} · linked question #${item.id}`;const card=$('frameworkCoach');if(card){const b=card.querySelector('.fc-best b');if(b)b.textContent=`${item.framework} — ${META[item.framework].name}`;card.dataset.fr=item.framework}}catch(_e){}}
function ensureOverrides(){
 if(window.PSLE_AUDITED_FRAMEWORK_OVERRIDES)return true;if(loadingOverrides)return false;loadingOverrides=true;
 const s=d.createElement('script');s.src='resources/appvariants/audited-framework-overrides.js?v=20260908audit1';s.async=false;s.onload=()=>{loadingOverrides=false;try{apply()}catch(_e){}};s.onerror=()=>{loadingOverrides=false;try{apply(true)}catch(_e){}};d.head.appendChild(s);return false;
}
function apply(skipOverrideCheck=false){
 const api=window.PSLE_FRAMEWORK_192;if(!api||typeof BANK==='undefined'||!Array.isArray(BANK))return false;
 if(!skipOverrideCheck&&!ensureOverrides())return false;
 api.classifyQuestion=classify;
 for(let id=1;id<=180;id++){const item=api.byScienceId(id),e=BANK[id-1];if(!item||!e)continue;const pick=choose(item,e),f=pick.f||classify(pick.q)||item.framework;item.framework=f;item.question=pick.q;item.model=pick.model||e.phrase||'';item.source=pick.source;e.applicationQuestion=item.question;e.frameworkReviewQuestion=item.question;e.frameworkReview=item.framework;e.modelApplicationAnswer=item.model}
 const c=patchCountUI(api);api.auditedCounts=()=>({...c});patchCurrent();d.dispatchEvent(new Event('psle-framework-question-quality-updated'));return true;
}
window.PSLE_FRAMEWORK_QUESTION_QUALITY={apply,classify,patchCurrent,patchCountUI};
if(window.APP_VARIANTS)apply();
})();