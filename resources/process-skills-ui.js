(()=>{
const S=window.PROCESS_SKILLS||[]; if(!S.length)return;
const $=id=>document.getElementById(id);
const KEY='psleScience_process_skills_v1';
let state={items:{},current:0,variant:{}};
try{state=Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_e){}
state.items=state.items||{};state.variant=state.variant||{};
function today(){return new Date().toISOString().slice(0,10)}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function rec(id){if(!state.items[id])state.items[id]={priority:S[id-1]?.focus?'red':'auto',recallDates:[],appDates:[]};return state.items[id]}
S.forEach(x=>rec(x.id));save();
function norm(s){return String(s||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function addDate(arr,d){if(!arr.includes(d))arr.push(d)}
const tabs=document.querySelector('.tabs');
const btn=document.createElement('button');btn.id='processTab';btn.className='tab';btn.textContent='🧪 Fair Test & Process Skills';tabs.appendChild(btn);
const card=document.querySelector('.main-grid .card');
const pane=document.createElement('div');pane.id='processPane';pane.className='hide';
pane.innerHTML=`
<div class="mode-note" style="margin-bottom:12px"><b>12 book-backed process skills</b> from the revision-book experiment/process-skill pages. These are <b>separate from the 180 Science-content explanations</b>. Your son’s past paper showed particular weakness in <b>fair-test reasoning, observation/evidence and reliability</b>, so those start as Focus.</div>
<div class="teacher-strip" id="processTeacher"><div><span class="label">Process-skill priority:</span> <span class="small" id="processOverride">Not Studied Yet</span></div><div class="teacher-actions"><button id="processFocus" class="btn-red">🔴 Focus</button><button id="processAuto">⚪ Not Studied Yet</button><button id="processGood" class="btn-green">🟢 Already Good</button></div></div>
<div style="display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:14px" id="processGrid">
<div>
 <div class="meta"><div><span class="pill" id="processPill"></span> <span class="pill blue" id="processTopic"></span></div><div><span class="small" id="processCount"></span></div></div>
 <div class="prompt" id="processCue"></div>
 <div class="source" id="processSource"></div>
 <div class="model blur" id="processTarget">Target sentence hidden</div>
 <textarea id="processRecall" spellcheck="false" placeholder="Recall the process-skill rule here..."></textarea>
 <div class="actions"><button class="primary" id="processCheck">Check Recall</button><button id="processShow">Show Rule</button><button class="next" id="processNext">Next Skill</button></div>
 <div class="fb hide" id="processRecallFeedback"></div>
 <div class="mode-note"><b>Recall mastery:</b> 3 correct recalls on different days. The sentence is a standardised, book-backed rule, not claimed as a verbatim quotation.</div>
 <div style="height:1px;background:#dbe3ee;margin:18px 0"></div>
 <h3 style="margin:0 0 6px">Application practice</h3>
 <div class="prompt" style="font-size:21px;margin-top:10px" id="processQuestion"></div>
 <textarea id="processAnswer" spellcheck="false" placeholder="Write your answer using the exact variables/context in the question..."></textarea>
 <div class="actions"><button id="processModelBtn">Show Model Answer</button><button id="processNewQ">🔄 New Question</button><button class="btn-green" id="processAppCorrect">✅ Correct</button><button class="btn-red" id="processAppFocus">🔴 Needs Work</button></div>
 <div class="model hide" id="processModel" style="margin-top:8px"></div>
 <div class="fb hide" id="processAppFeedback"></div>
 <div class="mode-note"><b>Important:</b> for fair-test questions, name the <b>exact variable</b> kept the same and link it to the changed and measured variables. Avoid vague answers such as “to make it fair”.</div>
</div>
<div class="panel"><h3 style="margin:0">Process Skills — 12</h3><div class="priority-legend">🔴 Focus · ⚪ Not Studied Yet · 🟢 Already Good<br>Click a skill to practise it.</div><div id="processBank" class="bank" style="max-height:650px"></div></div>
</div>`;
card.appendChild(pane);
const mainAside=document.querySelector('.main-grid aside');
const baseMeta=card.querySelector(':scope > .meta');
const baseTeacher=card.querySelector(':scope > .teacher-strip');
const queueControls=$('queueMode')?.closest('.controls');
const phraseControls=$('phraseControls');
const stats=document.querySelector('.stats');
const mainGrid=document.querySelector('.main-grid');
const headerSub=document.querySelector('header .sub');
let oldSub=headerSub?headerSub.innerHTML:'';
function prLabel(p){return p==='red'?'🔴 Focus':p==='green'?'🟢 Already Good':'⚪ Not Studied Yet'}
function prClass(p){return p==='red'?'red':p==='green'?'green':'amber'}
function currentSkill(){return S[Math.max(0,Math.min(S.length-1,state.current||0))]}
function variantIndex(skill){let i=state.variant[skill.id]||0; if(i>=skill.variants.length)i=0;return i}
function renderBank(){const b=$('processBank');b.innerHTML='';S.forEach((s,i)=>{const r=rec(s.id),d=document.createElement('div');d.className=`row ${r.priority==='red'?'redrow':r.priority==='green'?'greenrow':'amberrow'} ${i===state.current?'currentrow':''}`;d.innerHTML=`<div class="rownum">${s.id}</div><div class="topicname">${esc(s.topic)}<span class="catname">Recall ${new Set(r.recallDates||[]).size}/3 · Application ${new Set(r.appDates||[]).size}/2</span></div>`;d.onclick=()=>{state.current=i;save();renderProcess()};b.appendChild(d)})}
function renderProcess(){
 const s=currentSkill(),r=rec(s.id),vi=variantIndex(s),v=s.variants[vi];
 $('processPill').className=`pill ${prClass(r.priority)}`;$('processPill').textContent=prLabel(r.priority);
 $('processTopic').textContent=s.topic;$('processCount').textContent=`${s.id} of ${S.length}`;$('processCue').textContent=s.cue;$('processSource').textContent=`📘 ${s.source}`;
 $('processTarget').textContent=s.target;$('processTarget').classList.add('blur');
 $('processRecall').value='';$('processRecallFeedback').className='fb hide';
 $('processQuestion').textContent=v.q;$('processAnswer').value='';$('processModel').className='model hide';$('processModel').innerHTML='';$('processModelBtn').textContent='Show Model Answer';$('processAppFeedback').className='fb hide';
 $('processOverride').textContent=prLabel(r.priority).replace(/^.. /,'');renderBank();
}
function enter(){
 pane.classList.remove('hide');$('phrasePane')?.classList.add('hide');$('appPane')?.classList.add('hide');
 baseMeta?.classList.add('hide');baseTeacher?.classList.add('hide');queueControls?.classList.add('hide');phraseControls?.classList.add('hide');stats?.classList.add('hide');mainAside?.classList.add('hide');
 if(mainGrid)mainGrid.style.gridTemplateColumns='1fr';document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
 if(headerSub)headerSub.innerHTML='<b>180 re-audited Science concepts</b> + <b>12 book-backed fair-test/process skills</b> · recall + application practice';
 renderProcess();window.scrollTo({top:0,behavior:'smooth'});
}
function leave(mode){
 pane.classList.add('hide');baseMeta?.classList.remove('hide');baseTeacher?.classList.remove('hide');queueControls?.classList.remove('hide');stats?.classList.remove('hide');mainAside?.classList.remove('hide');if(mainGrid)mainGrid.style.gridTemplateColumns='';
 if(mode==='phrase')phraseControls?.classList.remove('hide'); else phraseControls?.classList.add('hide');if(headerSub)headerSub.innerHTML=oldSub;
}
btn.onclick=enter;
$('phraseTab')?.addEventListener('click',()=>setTimeout(()=>leave('phrase'),0));
$('appTab')?.addEventListener('click',()=>setTimeout(()=>leave('app'),0));
$('processFocus').onclick=()=>{rec(currentSkill().id).priority='red';save();renderProcess()};
$('processAuto').onclick=()=>{rec(currentSkill().id).priority='auto';save();renderProcess()};
$('processGood').onclick=()=>{rec(currentSkill().id).priority='green';save();renderProcess()};
$('processShow').onclick=()=>{$('processTarget').classList.toggle('blur');$('processShow').textContent=$('processTarget').classList.contains('blur')?'Show Rule':'Hide Rule'};
$('processCheck').onclick=()=>{const s=currentSkill(),r=rec(s.id),ok=norm($('processRecall').value)===norm(s.target),f=$('processRecallFeedback');if(ok){addDate(r.recallDates,today());f.className='fb good';f.innerHTML=`<b>Correct ✅</b><br>Recall mastery: ${new Set(r.recallDates).size}/3 different days.`;if(new Set(r.recallDates).size>=3&&new Set(r.appDates||[]).size>=2)r.priority='green'}else{r.priority='red';f.className='fb wrong';f.innerHTML='<b>Not exact yet.</b><br>Compare with the target rule, then retry.';$('processTarget').classList.remove('blur')}save();renderBank()};
$('processNext').onclick=()=>{state.current=(state.current+1)%S.length;save();renderProcess()};
$('processModelBtn').onclick=()=>{const s=currentSkill(),v=s.variants[variantIndex(s)],m=$('processModel');if(m.classList.contains('hide')){m.innerHTML=`<b>Model answer</b><br>${esc(v.model)}`;m.classList.remove('hide');$('processModelBtn').textContent='Hide Model Answer'}else{m.classList.add('hide');$('processModelBtn').textContent='Show Model Answer'}};
$('processNewQ').onclick=()=>{const s=currentSkill();state.variant[s.id]=(variantIndex(s)+1)%s.variants.length;save();renderProcess()};
$('processAppCorrect').onclick=()=>{const s=currentSkill(),r=rec(s.id);addDate(r.appDates,today());if(new Set(r.recallDates||[]).size>=3&&new Set(r.appDates).size>=2)r.priority='green';save();$('processAppFeedback').className='fb good';$('processAppFeedback').innerHTML=`<b>Recorded as correct ✅</b><br>Application mastery: ${new Set(r.appDates).size}/2 different days.`;renderBank()};
$('processAppFocus').onclick=()=>{const r=rec(currentSkill().id);r.priority='red';save();$('processAppFeedback').className='fb wrong';$('processAppFeedback').innerHTML='<b>Marked for focus.</b><br>Review the rule and try another application question.';renderBank()};
const style=document.createElement('style');style.textContent='@media(max-width:850px){#processGrid{grid-template-columns:1fr!important}}';document.head.appendChild(style);
renderProcess();
})();