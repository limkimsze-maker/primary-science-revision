(()=>{
if(window.PSLE_FRAMEWORK_192)return;
const d=document;
const $=id=>d.getElementById(id);
const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9%]+/g,' ').trim().replace(/\s+/g,' ');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const META={
 F1:{n:1,name:'Change → Effect',chain:'Change → affected process/function → result'},
 F2:{n:2,name:'Mechanism / Process',chain:'Start → mechanism → next effect → outcome'},
 F3:{n:3,name:'Evidence / Data → Explanation',chain:'Evidence → Science concept → conclusion'},
 F4:{n:4,name:'Comparison → Explanation',chain:'Relevant difference → Science reason → comparative result'},
 F5:{n:5,name:'Structure / Feature → Function',chain:'Feature → what it enables → function/advantage'},
 F6:{n:6,name:'Experimental / Process-skill',chain:'Setup/procedure → why it matters → quality/result'}
};
const SCI_TARGET={F1:43,F2:56,F3:20,F4:18,F5:40,F6:3};
const TOTAL_TARGET={F1:43,F2:56,F3:20,F4:18,F5:40,F6:15};
const used=new Set();
let ready=false,lastApplied=-1,observer=null;
const science=new Map(),process=new Map();

function classifyQuestion(q){
 const raw=String(q||''),t=norm(raw);
 if(!t)return null;
 if(/\b(reliab|accurac|fair test|controlled variable|control variable|changed variable|measured variable|same starting|repeat(?:ed|ing)?|apparatus|instrument|range|precision|experiment|investigat)\b/.test(t))return'F6';
 if(/\b(results?|data|evidence|graph|table|reading|observed|observation|trend|shows that|showed that|according to)\b/.test(t))return'F3';
 if(/\b(compare|compared|difference|different from|than|whereas|while|both|similar plants|similar objects)\b/.test(t))return'F4';
 if(/\b(structure|feature|adaptation|advantage|shape|thick|thin|sharp|broad|wide|narrow|hollow|hairy|spines?|thorns?|hooks?|wing like|feathery|fibrous|webbed|fat layer)\b/.test(t)&&/\b(help|helps|allow|allows|enable|enables|support|supports|protect|protects|absorb|absorbs|anchor|anchors|hold|holds|reduce|reduces|prevent|prevents|function|advantage)\b/.test(t))return'F5';
 if(/^\s*how\b/i.test(raw)||/\b(describe how|process|cycle|pathway|moves through|passes through|circulat|digest|photosynth|respirat|pollinat|fertilis|evaporat|condens|germinat|electromagnet|electric current|water cycle|energy conversion|transfer of)\b/.test(t))return'F2';
 if(/\b(explain|why|give a reason|affect|effect|cause|causes|reduce|reduces|increase|increases|decrease|decreases|block|blocks|damage|damaged|remove|removed|add|added|heat|heated|cool|cooled|more|less|fewer|weak|stops?|cannot|unable)\b/.test(t))return'F1';
 return null;
}

function textOf(e){return norm(`${e?.topic||''} ${e?.category||''} ${e?.phrasePrompt||''} ${e?.applicationQuestion||''} ${e?.phrase||''}`)}
function has(t,re){return re.test(t)}
function score(e,f){
 const t=textOf(e),existing=classifyQuestion(e?.applicationQuestion||'');let s=existing===f?160:0;
 if(f==='F6'){
  if(has(t,/experiment|investigat|fair test|variable|apparatus|instrument|measure|accuracy|reliability|precision|range|reading|control setup|controlled/))s+=120;
  if(has(t,/volume|mass|temperature|length|time taken|distance/))s+=16;
 }
 if(f==='F3'){
  if(has(t,/data|evidence|result|graph|table|observation|relationship|trend|reading/))s+=120;
  if(has(t,/germination|photosynthesis|light|heat|temperature|electric|force|friction|energy|growth|rate|bubble/))s+=22;
 }
 if(f==='F4'){
  if(has(t,/compare|difference|different|young and adult|inherited and acquired|three stage|four stage|conductor|insulator|transparent|translucent|opaque|series|parallel|more than|less than/))s+=120;
  if(has(t,/materials?|properties|life cycle|seed dispersal|animal|plant/))s+=18;
 }
 if(f==='F5'){
  if(has(t,/structure|function|adapt|root|stem|leaf|stomata|seed dispersal|hook|hair|wing|feather|fibrous|waterproof|flower|fruit|seed|beak|body covering|camouflage|thick|thin|sharp|broad|webbed|fat layer|material property/))s+=92;
  if(has(t,/help|allow|enable|support|protect|absorb|anchor|hold|advantage|suitable/))s+=36;
 }
 if(f==='F1'){
  if(has(t,/damage|remove|block|less|fewer|more|increase|decrease|change|effect|affect|heated|cooled|heat|cold|competition|pollution|without|no light|weak|injur|stops|unable/))s+=105;
  if(has(t,/stomata|roots|stem|leaves|photosynthesis|respiration|circulation|friction|force|electric|heat|water cycle|food chain/))s+=20;
 }
 if(f==='F2'){
  if(has(t,/process|cycle|pathway|transport|germination|pollination|fertilisation|pollen tube|digestion|circulation|respiration|photosynthesis|water cycle|evaporation|condensation|melting|freezing|current|circuit|electromagnet|energy conversion|transfer/))s+=112;
  if(has(t,/how|what happens|moves|passes|develops|changes into|produces|flows/))s+=34;
 }
 return s+(200-Number(e?.id||0))/1000;
}
function assignTop(entries,f,n){
 const ranked=entries.filter(e=>!used.has(e.id)).map(e=>({e,s:score(e,f)})).sort((a,b)=>b.s-a.s||a.e.id-b.e.id);
 ranked.slice(0,n).forEach(({e})=>{used.add(e.id);science.set(e.id,{id:e.id,kind:'science',framework:f,question:'',model:'',source:'PSLE-style · 10-school prelim pattern'})});
}
function buildAssignments(){
 if(ready||typeof BANK==='undefined'||!Array.isArray(BANK)||BANK.length!==180)return false;
 const entries=BANK.slice().sort((a,b)=>a.id-b.id);
 assignTop(entries,'F6',SCI_TARGET.F6);
 assignTop(entries,'F3',SCI_TARGET.F3);
 assignTop(entries,'F4',SCI_TARGET.F4);
 assignTop(entries,'F5',SCI_TARGET.F5);
 assignTop(entries,'F1',SCI_TARGET.F1);
 entries.filter(e=>!used.has(e.id)).forEach(e=>{used.add(e.id);science.set(e.id,{id:e.id,kind:'science',framework:'F2',question:'',model:'',source:'PSLE-style · 10-school prelim pattern'})});
 // 12 Process Skills stay linked to their 12 existing process flashcards and are all F6.
 if(Array.isArray(window.PROCESS_SKILLS))window.PROCESS_SKILLS.forEach(s=>{
  const v=(s.variants||[])[0]||{};
  process.set(s.id,{id:s.id,kind:'process',framework:'F6',question:v.q||s.cue||'',model:v.model||s.target||'',source:s.source||'Process Skills'});
 });
 ready=true;
 primeScienceQuestions();
 return true;
}

function preferredCandidates(e){
 const a=[];
 if(e?.applicationQuestion)a.push({q:e.applicationQuestion,model:e.modelApplicationAnswer||e.phrase||'',source:'Existing linked application'});
 const raw=window.APP_VARIANTS?.[e?.id]||[];
 raw.forEach(v=>{if(v?.q)a.push({q:v.q,model:v.model||e.modelApplicationAnswer||e.phrase||'',source:'PSLE-style transfer question'})});
 if(Array.isArray(e?.applicationVariants))e.applicationVariants.forEach(v=>{if(v?.question)a.push({q:v.question,model:v.modelApplicationAnswer||e.modelApplicationAnswer||e.phrase||'',source:'PSLE-style transfer question'})});
 const seen=new Set();return a.filter(x=>{const k=norm(x.q);if(!k||seen.has(k))return false;seen.add(k);return true});
}
function cleanTopic(e){return String(e?.topic||'this Science concept').replace(/\s*[-–—]\s*/g,' ').trim().toLowerCase()}
function synth(e,f){
 const topic=cleanTopic(e),cue=String(e?.phrasePrompt||'').trim().replace(/\?$/,'');
 if(f==='F1')return `A change causes the condition involved in ${topic} to become less effective. Explain how this change can affect the final result.`;
 if(f==='F2'){
  if(/^how\b/i.test(cue))return `Explain ${cue.charAt(0).toLowerCase()+cue.slice(1)}.`;
  if(/^what happens\b/i.test(cue))return `Explain ${cue.charAt(0).toLowerCase()+cue.slice(1)}.`;
  return `Explain how the process involved in ${topic} occurs, from the starting event to the final outcome.`;
 }
 if(f==='F3')return `A pupil carries out an investigation on ${topic} and records a clear result. Using the result as evidence, explain what conclusion the pupil should make about this Science concept.`;
 if(f==='F4')return `Two similar cases differ in the condition related to ${topic}. Compare the two cases and explain why their results are different.`;
 if(f==='F5')return `A structure or feature involved in ${topic} helps it carry out its function. Explain how the feature enables that function or advantage.`;
 return `A pupil carries out an experiment involving ${topic}. Explain why the relevant variables or procedure must be controlled so that the result is fair, reliable or accurate.`;
}
function resolveScience(id){
 const item=science.get(id),e=Array.isArray(BANK)?BANK[id-1]:null;if(!item||!e)return item;
 const candidates=preferredCandidates(e),match=candidates.find(x=>classifyQuestion(x.q)===item.framework);
 const pick=match||{q:synth(e,item.framework),model:e.modelApplicationAnswer||e.phrase||'',source:'PSLE-style question generated from linked flashcard concept'};
 item.question=pick.q;item.model=pick.model||e.modelApplicationAnswer||e.phrase||'';item.source=pick.source||item.source;
 // Set the linked default question so every 192-item sidebar row has a stable F1-F6 identity.
 e.applicationQuestion=item.question;
 e.frameworkReviewQuestion=item.question;e.frameworkReview=item.framework;
 return item;
}
function primeScienceQuestions(){if(!ready)return;science.forEach((_,id)=>resolveScience(id));}
function refreshFromVariants(){if(!ready)return;science.forEach((_,id)=>resolveScience(id));patchSidebar(true);applyCurrentQuestion(true)}

function currentScienceItem(){
 try{if($('guidedFlow')?.dataset?.processMode==='1')return null;const i=typeof current==='function'?current():-1;return i>=0?science.get((BANK[i]?.id)||i+1):null}catch(_e){return null}
}
function applyCurrentQuestion(force=false){
 if(!ready)return;
 const ta=$('gfAppAnswer');if(!ta)return;
 const item=currentScienceItem();if(!item)return;
 const e=BANK[item.id-1];resolveScience(item.id);
 const prompt=d.querySelector('#gfBody .gf-prompt'),hidden=$('appQuestion');
 if(prompt&&(force||prompt.textContent.trim()!==item.question))prompt.textContent=item.question;
 if(hidden&&(force||hidden.textContent.trim()!==item.question))hidden.textContent=item.question;
 if(e){e.applicationQuestion=item.question;e.modelApplicationAnswer=item.model||e.modelApplicationAnswer||e.phrase}
 const note=$('variantNote');if(note)note.textContent=`Framework ${META[item.framework].n} · ${META[item.framework].name} · linked question #${item.id}`;
 patchCoach(item);
}
function patchCoach(item){
 const card=$('frameworkCoach');if(!card||!item)return;const m=META[item.framework];
 const best=card.querySelector('.fc-best b'),build=card.querySelector('.fc-build'),why=card.querySelector('.fc-why');
 if(best)best.textContent=`${item.framework} — ${m.name}`;
 if(build)build.textContent=m.chain;
 if(why)why.textContent='Use this framework for the linked PSLE-style question. The framework guides the reasoning; equivalent scientifically correct wording is accepted.';
 card.dataset.fr=item.framework;
}
function updateFrameworkSelect(){
 const sel=$('fcFrameworkFilter');if(!sel)return;
 const keep=/^F[1-6]$/.test(sel.value)?sel.value:'all';
 sel.innerHTML=`<option value="all">All 6 frameworks — 192</option>`+Object.keys(TOTAL_TARGET).map(f=>`<option value="${f}">${f} ${META[f].name} — ${TOTAL_TARGET[f]}</option>`).join('');
 sel.value=keep;
}
function patchSidebar(force=false){
 if(!ready)return;const list=$('gpsList');if(!list)return;
 list.querySelectorAll('.gps-row').forEach(row=>{
  const kind=row.dataset.kind,id=Number(row.dataset.id);let item=null;
  if(kind==='process')item=process.get(id);else{const e=BANK[id];if(e)item=science.get(e.id)}
  if(!item)return;row.dataset.framework=item.framework;
  const b=row.querySelector('b');if(b){let tag=b.querySelector('.fc-tag');if(!tag){tag=d.createElement('em');tag.className='fc-tag';b.appendChild(tag)}tag.textContent=item.framework;tag.title=META[item.framework].name}
 });
 updateFrameworkSelect();
 const map=$('fcMap');if(map)map.innerHTML=`<b>192 linked PSLE-style framework questions</b><br>F1 ${TOTAL_TARGET.F1} · F2 ${TOTAL_TARGET.F2} · F3 ${TOTAL_TARGET.F3} · F4 ${TOTAL_TARGET.F4} · F5 ${TOTAL_TARGET.F5} · F6 ${TOTAL_TARGET.F6}<br><small>Every question stays linked one-to-one with its flashcard. Existing Known progress is not reset.</small>`;
 const sel=$('fcFrameworkFilter'),v=sel?.value||'all';
 list.querySelectorAll('.gps-row').forEach(r=>r.style.display=(v==='all'||r.dataset.framework===v)?'':'none');
 list.querySelectorAll('.gps-group').forEach(g=>{let n=g.nextElementSibling,any=false;while(n&&!n.classList.contains('gps-group')){if(n.classList.contains('gps-row')&&n.style.display!=='none'){any=true;break}n=n.nextElementSibling}g.style.display=any?'':'none'});
}
function counts(){return {...TOTAL_TARGET}}
function allItems(){return [...science.values()].sort((a,b)=>a.id-b.id).concat([...process.values()].sort((a,b)=>a.id-b.id))}
function byScienceId(id){return science.get(Number(id))||null}
function byProcessId(id){return process.get(Number(id))||null}

function install(){
 if(!buildAssignments())return false;
 window.PSLE_FRAMEWORK_192={meta:META,scienceTarget:{...SCI_TARGET},counts,allItems,byScienceId,byProcessId,classifyQuestion,refresh:refreshFromVariants};
 patchSidebar(true);applyCurrentQuestion(true);
 const root=d.documentElement;
 observer=new MutationObserver(()=>{patchSidebar();applyCurrentQuestion()});
 observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-stage','data-process-mode','class']});
 // APP_VARIANTS and AI application tools are loaded lazily. When they appear,
 // resolve each linked question again and prefer an authored PSLE-style transfer
 // question that matches its assigned framework.
 let n=0;const wait=()=>{n++;if(window.APP_VARIANTS&&Object.keys(window.APP_VARIANTS).length){refreshFromVariants();return}if(n<240)setTimeout(wait,250)};wait();
 setInterval(()=>{patchSidebar();applyCurrentQuestion()},700);
 return true;
}
let tries=0;const boot=()=>{tries++;if(install())return;if(tries<240)setTimeout(boot,100)};boot();
})();