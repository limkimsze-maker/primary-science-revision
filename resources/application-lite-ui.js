(()=>{
let tries=0;
function install(){
 tries++;
 const app=document.getElementById('appPane'),q=document.getElementById('appQuestion'),fresh=document.getElementById('freshAppBtn'),next=document.getElementById('nextApp'),answer=document.getElementById('appAnswer');
 if(!app||!q||!fresh||!next||!answer||typeof current!=='function'||typeof BANK==='undefined'){
  if(tries<120)setTimeout(install,100);return;
 }
 if(document.getElementById('appLiteModeBar'))return;
 const originalFresh=fresh.onclick,originalNext=next.onclick;
 let mode='all';
 const labels={all:'All',recall:'What / Identify / State',compare:'Compare',explain:'Explain / Why',describe:'Describe / How',suggest:'Suggest / Predict',experiment:'Experiment / Relationship'};
 const qText=()=>String(q.textContent||'').trim();
 const kindText=()=>String(document.getElementById('variantNote')?.textContent||'').toLowerCase();
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const hasReason=t=>/\b(explain|why|give\s+(?:a\s+)?reason)\b/i.test(t);

 function profile(){
  const raw=qText(),t=raw.toLowerCase(),k=kindText(),reason=hasReason(raw);
  if(/\brelationship\b/.test(t+' '+k)||/state the relationship/.test(t))return{type:'relationship',group:'experiment',label:'Relationship',reason:false};
  if(/\baim\b/.test(t+' '+k)||/what (?:is|was) the .*aim/.test(t))return{type:'aim',group:'experiment',label:'Aim of experiment',reason:false};
  if(/\bconclusion\b/.test(t+' '+k)||/what can .*conclude/.test(t)||/what does .*show/.test(t))return{type:'conclusion',group:'experiment',label:'Conclusion',reason:false};
  if(/reliab/.test(t+' '+k))return{type:'reliability',group:'experiment',label:'Reliability',reason:false};
  if(/accurac/.test(t+' '+k))return{type:'accuracy',group:'experiment',label:'Accuracy',reason:false};
  if(/fair test|keep .*same|kept .*same|control variable|controlled variable/.test(t+' '+k))return{type:'fairtest',group:'experiment',label:'Fair test',reason:reason};
  if(/^\s*compare\b/.test(t)||/\bcompare\b/.test(k))return{type:'compare',group:'compare',label:reason?'Compare + explain':'Compare',reason};
  if(/^\s*suggest\b/.test(t)||/\bsuggest|inference\b/.test(k))return{type:'suggest',group:'suggest',label:reason?'Suggest + reason':'Suggest',reason};
  if(/^\s*predict\b/.test(t)||/\bprediction\b/.test(k))return{type:'predict',group:'suggest',label:reason?'Predict + explain':'Predict',reason};
  if(/^\s*describe\b/.test(t)||/\bdescribe\b/.test(k))return{type:'describe',group:'describe',label:reason?'Describe + explain':'Describe',reason};
  if(/^\s*how\b/.test(t)||/\bsequence|process\b/.test(k))return{type:'how',group:'describe',label:'How',reason:true};
  if(/^\s*identify\b/.test(t))return{type:'identify',group:'recall',label:'Identify',reason};
  if(/^\s*name\b/.test(t))return{type:'name',group:'recall',label:'Name',reason};
  if(/^\s*state\b/.test(t))return{type:'state',group:'recall',label:reason?'State + explain':'State',reason};
  if(/^\s*which\b/.test(t))return{type:'which',group:'recall',label:reason?'Which + explain':'Which',reason};
  if(/^\s*what\b/.test(t))return{type:'what',group:'recall',label:reason?'What + explain':'What',reason};
  if(reason)return{type:'explain',group:'explain',label:/\bwhy\b/.test(t)?'Why / Explain':'Explain',reason:true};
  if(/experiment|investigat|results?|data|evidence/.test(t+' '+k))return{type:'evidence',group:'experiment',label:'Evidence / experiment',reason:false};
  return{type:'other',group:'other',label:'Read the command word',reason:false};
 }
 function category(){return profile().group}

 function guideHtml(p){
  const badge=`<span class="cmd-badge">${esc(p.label)}</span>`;
  const head=`<b>Answering frame ${badge}</b>`;
  const noExtra='<div class="cmd-note">Do not add D/E, S/R or L/R unless the wording separately asks for explanation, evidence or a linked result.</div>';
  const reasonBox=p.reason?'<div class="frame-box"><b>Science reason</b>Because… / Explain using the relevant Science concept.</div>':'';
  if(p.type==='explain')return `${head}<div class="frame-grid"><div class="frame-box"><b>D/E — if needed</b>Use the relevant observation, data, comparison or changed condition from this question.</div><div class="frame-box"><b>S/R — Science reasoning</b>State the Science idea or causal mechanism that explains what happened.</div><div class="frame-box"><b>L/R — if needed</b>Link the reasoning to the exact result asked.</div></div><div class="cmd-note"><b>Explain/Why:</b> S/R is the core. D/E and L/R are included only when this exact question needs them.</div>`;
  if(['what','identify','name','state','which'].includes(p.type))return `${head}<div class="frame-grid cmd-grid-2"><div class="frame-box"><b>1. Find exactly what is asked</b>Object? Part? Property? Variable? Process? Science idea?</div><div class="frame-box"><b>2. Answer directly</b>Give the precise Science term, object, property or statement.</div>${reasonBox}</div>${p.reason?'<div class="cmd-note">Because this question also asks for a reason/explanation, add the Science reasoning after the direct answer.</div>':noExtra}`;
  if(p.type==='suggest')return `${head}<div class="frame-grid cmd-grid-2"><div class="frame-box"><b>Suggestion</b>Give one reasonable, scientifically valid answer using the information in the question.</div>${reasonBox||'<div class="frame-box"><b>More than one answer may work</b>You do not need to match one exact model answer if your suggestion is scientifically valid.</div>'}</div>${p.reason?'<div class="cmd-note">A reason is required only because this question also asks why/explain.</div>':noExtra}`;
  if(p.type==='predict')return `${head}<div class="frame-grid cmd-grid-2"><div class="frame-box"><b>Prediction</b>State what will happen.</div>${reasonBox||'<div class="frame-box"><b>Stop there if that is all it asks</b>Do not invent a reason when the question only says Predict.</div>'}</div>${p.reason?'<div class="cmd-note">This question also asks for explanation, so add the Science reason after the prediction.</div>':noExtra}`;
  if(p.type==='compare')return `${head}<div class="frame-grid cmd-grid-2"><div class="frame-box"><b>Thing A</b>State the relevant feature/value for the first thing.</div><div class="frame-box"><b>Thing B</b>State the matching feature/value for the second thing, using words such as greater/lower, more/less, same/different.</div>${reasonBox}</div>${p.reason?'<div class="cmd-note">First make the direct comparison. Then explain only because the question separately asks for a reason.</div>':noExtra}`;
  if(p.type==='describe')return `${head}<div class="frame-grid cmd-grid-2"><div class="frame-box"><b>What is observed / happens first?</b>State the relevant observation or first step.</div><div class="frame-box"><b>What happens next / at the end?</b>Describe the change or sequence clearly.</div>${reasonBox}</div>${p.reason?'<div class="cmd-note">Describe first; explain only because this question also asks for a reason.</div>':'<div class="cmd-note"><b>Describe:</b> say what happens or what is observed. Do not explain why unless asked.</div>'}`;
  if(p.type==='how')return `${head}<div class="frame-grid"><div class="frame-box"><b>Start</b>What begins the process?</div><div class="frame-box"><b>Science mechanism</b>How does the relevant Science process work?</div><div class="frame-box"><b>End result</b>What does the process lead to?</div></div><div class="cmd-note"><b>How:</b> give the mechanism/process in logical Science steps. This is not automatically a D/E → S/R → L/R question.</div>`;
  if(p.type==='relationship')return `${head}<div class="frame-grid cmd-grid-2"><div class="frame-box"><b>Changed variable</b>As ______ increases/decreases…</div><div class="frame-box"><b>Measured variable</b>… ______ increases/decreases/remains the same.</div></div><div class="cmd-note">If the trend changes, write a separate relationship statement for each range.</div>`;
  if(p.type==='aim')return `${head}<div class="frame-grid cmd-grid-2"><div class="frame-box"><b>Changed variable</b>What is deliberately changed?</div><div class="frame-box"><b>Measured variable</b>What is observed or measured?</div></div><div class="cmd-note">State what the experiment is finding out. Use <b>find out if / which / how</b> according to the investigation.</div>`;
  if(p.type==='conclusion')return `${head}<div class="frame-grid"><div class="frame-box"><b>Find out if</b>State whether the effect/concept occurs or is true.</div><div class="frame-box"><b>Find out which</b>Identify the object/material/setup <u>and</u> the relevant property/result.</div><div class="frame-box"><b>Find out how</b>State the relationship between changed and measured variables.</div></div><div class="cmd-note">Use the results to answer the aim. Do not merely copy the results.</div>`;
  if(p.type==='reliability')return `${head}<div class="frame-grid cmd-grid-2"><div class="frame-box"><b>Repeat</b>Repeat the experiment/trial/readings several times.</div><div class="frame-box"><b>Average</b>Calculate/take the average when measurable numerical results are collected.</div></div><div class="cmd-note">Reliability is about consistency of repeated results, not closeness to the actual value.</div>`;
  if(p.type==='accuracy')return `${head}<div class="frame-grid cmd-grid-2"><div class="frame-box"><b>Suitable apparatus</b>Choose a more suitable/precise measuring instrument where relevant.</div><div class="frame-box"><b>Better procedure</b>Read or measure correctly so the value is closer to the actual value.</div></div><div class="cmd-note">Do not automatically write “repeat and average”; that is reliability, not accuracy.</div>`;
  if(p.type==='fairtest')return `${head}<div class="frame-grid"><div class="frame-box"><b>Changed variable</b>Only the factor being investigated should change.</div><div class="frame-box"><b>Measured variable</b>State what is measured/observed.</div><div class="frame-box"><b>Other relevant variables</b>Keep them the same so they do not affect the result.</div></div>`;
  if(p.type==='evidence')return `${head}<div class="frame-grid cmd-grid-2"><div class="frame-box"><b>Evidence from this question</b>Quote the relevant observation, value or comparison.</div><div class="frame-box"><b>What it shows</b>State the conclusion only if the question asks what the evidence shows.</div></div>`;
  return `${head}<div class="cmd-note">Read the exact command word and answer only what is asked.</div>`;
 }

 function tip(){
  const b=document.getElementById('appLiteTip');if(!b)return;
  const p=profile();
  const tips={
   what:'Answer exactly what comes after “What”. A concise Science answer may be enough.',identify:'Identify only what is asked. Do not add a reason unless asked.',name:'Name the correct term/part/process directly.',state:'State the required fact or Science idea directly.',which:'Choose the correct option/object and state it directly.',
   compare:'Compare both sides directly. No reason unless the question also says explain/why.',
   suggest:'Give a reasonable scientifically valid suggestion. A reason is needed only if asked.',predict:'State the prediction. A reason is needed only if asked.',
   describe:'Describe observations/steps; do not explain why unless asked.',how:'Give the process or mechanism in logical Science steps.',
   explain:'Use Science reasoning. Add D/E and L/R only where the exact question needs them.',relationship:'State measured variable versus changed variable.',aim:'State what is being investigated using the changed and measured variables.',conclusion:'Use the results to answer the aim.',reliability:'Repeat several times and average measurable results.',accuracy:'Improve apparatus/procedure to get closer to the actual value.',fairtest:'Change one factor, measure the outcome, keep other relevant factors the same.',evidence:'Use the actual observation/data from this question.',other:'Read the command word first and answer only what is asked.'
  };
  b.innerHTML=`<b>Detected: ${esc(p.label)}</b> — ${esc(tips[p.type]||tips.other)}`;
 }
 function dynamicFrame(){const f=app.querySelector('.frame');if(f)f.innerHTML=guideHtml(profile())}
 function manualButtons(){
  const p=profile(),rating=app.querySelector('.rating');if(!rating)return;
  const de=rating.querySelector('.r-de'),sr=rating.querySelector('.r-sr'),lr=rating.querySelector('.r-lr'),correct=rating.querySelector('.r-correct'),concept=rating.querySelector('.r-concept');
  [de,sr,lr,correct,concept].forEach(x=>{if(x)x.style.display='' });
  if(p.type==='explain')return;
  if(p.type==='how'){if(de)de.style.display='none';if(lr)lr.style.display='none';if(sr)sr.textContent='🟧 Process / reasoning missing';return}
  [de,sr,lr].forEach(x=>{if(x)x.style.display='none'});
 }
 function friendlyFeedback(){
  const box=document.getElementById('appFeedback');if(!box||box.classList.contains('hide'))return;
  const p=profile();if(p.type==='explain'||p.type==='how')return;
  const title=box.querySelector('b');if(!title)return;
  if(!/D\/E missing|S\/R missing|L\/R missing/i.test(title.textContent||''))return;
  const names={compare:'🟦 Comparison incomplete',suggest:'🟦 Suggestion incomplete',predict:'🟦 Prediction incomplete',describe:'🟦 Description incomplete',relationship:'🟦 Relationship incomplete',aim:'🟦 Aim incomplete',conclusion:'🟦 Conclusion incomplete',reliability:'🟦 Reliability answer incomplete',accuracy:'🟦 Accuracy answer incomplete',fairtest:'🟦 Fair-test answer incomplete',evidence:'🟦 Evidence answer incomplete',what:'🟦 Answer incomplete',identify:'🟦 Identification incomplete',name:'🟦 Answer incomplete',state:'🟦 Statement incomplete',which:'🟦 Answer incomplete'};
  title.textContent=names[p.type]||'🟦 Answer incomplete';
 }
 function workload(){
  const b=document.getElementById('appLiteWork');if(!b)return;
  let done=false;try{const d=new Date(),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;done=(rec(current()).appCorrectDates||[]).includes(key)}catch(_e){}
  b.className='app-lite-work'+(done?' done':'');
  b.innerHTML=done?'<b>✅ Enough for this concept today</b> Move to Next. Other questions are optional.':'<b>🎯 Target: 1 correct application for this concept today.</b> If wrong, repair and try one more.';
 }
 function refresh(){tip();dynamicFrame();manualButtons();friendlyFeedback();workload()}
 function findCurrentMode(max=6){
  if(mode==='all')return true;if(category()===mode)return true;
  const seen=new Set([qText()]);
  for(let n=0;n<max;n++){
   if(typeof originalFresh!=='function')break;originalFresh.call(fresh);
   const text=qText();if(category()===mode)return true;if(seen.has(text))break;seen.add(text);
  }
  return category()===mode;
 }
 function setMode(v){
  mode=labels[v]?v:'all';document.querySelectorAll('[data-app-lite-mode]').forEach(b=>b.classList.toggle('active',b.dataset.appLiteMode===mode));
  if(mode!=='all'&&!findCurrentMode()){
   const fb=document.getElementById('appFeedback');if(fb){fb.className='fb warnbox';fb.textContent=`No ${labels[mode]} question for this concept. Choose All or move to Next.`}
  }
  refresh();
 }
 const bar=document.createElement('div');bar.id='appLiteModeBar';bar.className='app-lite-bar';bar.innerHTML='<b>Question type</b>'+Object.entries(labels).map(([k,v])=>`<button type="button" data-app-lite-mode="${k}" class="${k==='all'?'active':''}">${v}</button>`).join('');
 q.insertAdjacentElement('beforebegin',bar);
 const tipBox=document.createElement('div');tipBox.id='appLiteTip';tipBox.className='app-lite-tip';q.insertAdjacentElement('beforebegin',tipBox);
 const work=document.createElement('div');work.id='appLiteWork';work.className='app-lite-work';q.insertAdjacentElement('beforebegin',work);
 bar.querySelectorAll('[data-app-lite-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.appLiteMode));
 fresh.onclick=function(){if(typeof originalFresh==='function')originalFresh.call(fresh);if(mode!=='all')findCurrentMode(5);refresh();answer.focus()};
 next.onclick=function(){if(typeof originalNext==='function')originalNext.call(next);if(mode!=='all')findCurrentMode(6);refresh()};
 const fb=document.getElementById('appFeedback');if(fb)new MutationObserver(refresh).observe(fb,{childList:true,subtree:true});
 new MutationObserver(()=>setTimeout(refresh,0)).observe(q,{childList:true,subtree:true,characterData:true});
 const note=app.querySelector('.mode-note');if(note)note.innerHTML='<b>Written Application:</b> the answering frame now changes with the <b>actual command word</b>. D/E → S/R → L/R is shown mainly for Explain/Why, not forced onto What, Identify, State, Suggest, Describe, How, Compare, Predict, Relationship, Aim, Conclusion, Reliability or Accuracy.';
 const style=document.createElement('style');style.textContent=`.app-lite-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:7px 0;padding:9px 10px;background:#fff;border:1px solid #dbe3ee;border-radius:12px}.app-lite-bar>b{font-size:12px;color:#475569}.app-lite-bar button{padding:7px 9px;font-weight:800;font-size:12px}.app-lite-bar button.active{background:#4338ca;color:#fff;border-color:#4338ca}.app-lite-tip,.app-lite-work{margin:7px 0;padding:9px 11px;border-radius:11px;font-size:12px;line-height:1.4}.app-lite-tip{background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3;font-weight:700}.app-lite-work{background:#fffbeb;border:1px solid #fde68a;color:#92400e}.app-lite-work.done{background:#ecfdf5;border-color:#a7f3d0;color:#047857}.cmd-badge{display:inline-block;margin-left:6px;padding:4px 8px;border-radius:999px;background:#4338ca;color:#fff;font-size:12px}.cmd-note{margin-top:9px;font-size:13px;line-height:1.45;color:#334155}.cmd-grid-2{grid-template-columns:repeat(2,1fr)}@media(max-width:720px){.app-lite-bar{display:grid;grid-template-columns:1fr 1fr}.app-lite-bar>b{grid-column:1/-1}.app-lite-bar button:first-of-type{grid-column:1/-1}.cmd-grid-2{grid-template-columns:1fr}}`;
 document.head.appendChild(style);
 refresh();
}
install();
})();