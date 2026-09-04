(()=>{
  const BASE='https://primary-science-ai-marker.limkimsze-maker.workers.dev';
  const AI_ENDPOINT=BASE+'/mark';
  const MODEL_ENDPOINT=BASE+'/training-model';
  const MODEL_CACHE_KEY='psleScience97_gold_training_models_v1';
  const GOLD_PROGRESS_VERSION='gold-book-v1';
  const GOLD_PROGRESS_KEY='psleScience97_gold_phrase_version';
  const CHANGED_IDS=[2,3,7,10,13,14,15,16,18,23,25,26,29,34,40,41,42,43,44,45,50,51,52,53,62,63,71,72,73,77,81,84,89,91,92];

  const style=document.createElement('style');
  style.textContent=`
  .ai-mark-wrap{margin-top:12px;padding:12px;border:1px solid #bfdbfe;border-radius:13px;background:#eff6ff}.ai-mark-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.ai-mark-title{font-weight:800;color:#1e3a8a}.ai-state{font-size:12px;font-weight:800;padding:5px 8px;border-radius:999px;background:#dcfce7;border:1px solid #86efac;color:#166534}.ai-mark-btn{background:#1d4ed8!important;color:#fff!important;border-color:#1d4ed8!important;font-weight:800}.ai-mark-btn:disabled{opacity:.6;cursor:wait}.ai-note{font-size:12px;color:#475569;margin-top:6px;line-height:1.4}.ai-result{margin-top:10px;padding:12px;border-radius:12px;border:1px solid #cbd5e1;background:#fff;line-height:1.5}.ai-result.correct{background:#ecfdf5;border-color:#86efac}.ai-result.partial{background:#fff7ed;border-color:#fdba74}.ai-result.wrongai{background:#fef2f2;border-color:#fca5a5}.ai-verdict{font-weight:900;font-size:17px;margin-bottom:5px}.ai-section{margin-top:7px}.ai-section b{display:block;margin-bottom:2px}.ai-improved{margin-top:8px;padding:9px 10px;border-left:4px solid #6366f1;background:#f8fafc;border-radius:8px}.manual-label{font-size:12px;font-weight:800;color:#64748b;margin:12px 0 4px}
  .exact-progress-box{margin-top:10px;padding:10px 12px;border:1px solid #c7d2fe;border-radius:12px;background:#eef2ff;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.exact-progress-box.mastered{background:#dcfce7;border-color:#86efac}.exact-progress-title{font-weight:800}.exact-progress-count{font-weight:900;font-size:17px}.exact-progress-dots{display:flex;gap:5px}.exact-dot{width:18px;height:18px;border-radius:50%;border:2px solid #a5b4fc;background:#fff}.exact-dot.done{background:#22c55e;border-color:#16a34a}
  .experiment-tag{display:inline-block;margin-left:5px;padding:2px 6px;border-radius:999px;background:#dbeafe;color:#1e40af;font-size:10px;font-weight:800}
  .training-banner{margin:10px 0;padding:10px 12px;border-radius:12px;background:#eef2ff;border:1px solid #c7d2fe;color:#312e81;font-size:13px;line-height:1.45}.training-model{line-height:1.5}.tm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.tm-box{padding:11px;border-radius:11px;border:1px solid #dbe3ee;background:#fff}.tm-box b{display:block;margin-bottom:5px}.tm-de{border-top:5px solid #f59e0b}.tm-sr{border-top:5px solid #f97316;background:#fff7ed}.tm-lr{border-top:5px solid #8b5cf6}.tm-full{margin-top:10px;padding:12px;border-radius:12px;background:#ecfdf5;border:1px solid #86efac}.tm-full b{display:block;margin-bottom:6px;color:#065f46}.tm-keywords{margin-top:10px;padding:9px 10px;border-radius:10px;background:#f8fafc;border:1px solid #cbd5e1}.tm-verbatim{margin-top:8px;padding:10px;border-radius:10px;background:#fff7ed;border:1px solid #fed7aa;font-weight:800}.tm-direct{margin-top:10px;padding:12px;border-radius:12px;background:#ecfdf5;border:1px solid #86efac}.criteria-strip{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.criterion{font-size:12px;font-weight:800;padding:5px 7px;border-radius:999px;border:1px solid #cbd5e1;background:#fff}.criterion.yes{background:#dcfce7;border-color:#86efac;color:#166534}.criterion.no{background:#fee2e2;border-color:#fca5a5;color:#991b1b}.criterion.na{background:#f1f5f9;color:#64748b}
  .gold-note{margin-top:8px;font-size:12px;color:#475569}.gold-badge{display:inline-block;padding:3px 7px;border-radius:999px;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;font-weight:800;font-size:11px}
  @media(max-width:760px){.tm-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const escHtml=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

  // Preserve old exact-recall dates in an archive field, but require re-mastery only where the gold-standard phrase changed.
  try{
    if(localStorage.getItem(GOLD_PROGRESS_KEY)!==GOLD_PROGRESS_VERSION){
      CHANGED_IDS.forEach(id=>{
        const x=rec(id-1);
        const old=Array.isArray(x.phraseDates)?x.phraseDates.slice():[];
        if(old.length){
          x.goldLegacyPhraseDates=Array.from(new Set([...(x.goldLegacyPhraseDates||[]),...old]));
          x.phraseDates=[];
          x.phraseLast='';
        }
      });
      save();
      localStorage.setItem(GOLD_PROGRESS_KEY,GOLD_PROGRESS_VERSION);
    }
  }catch(e){console.warn('Gold-standard progress migration skipped',e)}

  // Exact recall progress box.
  const teacherStrip=document.querySelector('.teacher-strip');
  let progressBox=null;
  if(teacherStrip){
    progressBox=document.createElement('div');
    progressBox.className='exact-progress-box';
    progressBox.innerHTML='<div><div class="exact-progress-title">Exact Recall Progress <span class="gold-badge">Gold standard</span></div><div class="small">1 correct Exact Recall per different day counts.</div></div><div class="exact-progress-dots"><span class="exact-dot"></span><span class="exact-dot"></span><span class="exact-dot"></span></div><div class="exact-progress-count">Correct: 0/3</div>';
    teacherStrip.insertAdjacentElement('afterend',progressBox);
  }
  function updateExactProgress(){
    if(!progressBox)return;
    const n=Math.min(3,new Set(rec(current()).phraseDates||[]).size);
    progressBox.querySelectorAll('.exact-dot').forEach((d,i)=>d.classList.toggle('done',i<n));
    const count=progressBox.querySelector('.exact-progress-count');
    if(n>=3){count.textContent='✅ MASTERED — 3 / 3';progressBox.classList.add('mastered')}else{count.textContent='Correct: '+n+'/3';progressBox.classList.remove('mastered')}
  }

  // Priority list: add experiment-only filter while preserving priority/search behaviour.
  const filter=document.getElementById('bankFilter');
  const search=document.getElementById('bankSearch');
  const bankEl=document.getElementById('bank');
  if(filter&&search&&bankEl){
    filter.innerHTML='<option value="all">All '+BANK.length+'</option><option value="red">🔴 Focus</option><option value="green">🟢 Already Good</option><option value="amber">🟠 Learning</option><option value="experiment">🧪 Experiment only</option>';
    filter.title='Filter by current priority';
    filter.style.cssText='width:100%;padding:9px 10px;border:2px solid #cbd5e1;border-radius:10px;font:inherit;font-size:13px;background:#fff';
    const filterRow=document.createElement('div');
    filterRow.style.cssText='display:grid;grid-template-columns:auto 1fr;gap:7px;align-items:center;margin-top:8px';
    const filterLabel=document.createElement('label');
    filterLabel.htmlFor='bankFilter';filterLabel.textContent='Show:';filterLabel.style.cssText='font-size:12px;font-weight:800;color:#475569';
    filterRow.append(filterLabel,filter);
    bankEl.parentNode.insertBefore(filterRow,bankEl);
    bank=function(){
      const f=filter.value||'all';
      const q=(search.value||'').trim().toLowerCase();
      const cur=current();
      const rows=BANK.map((e,i)=>{
        const p=priority(i),isExperiment=i>=89;
        if(f==='experiment'&&!isExperiment)return'';
        if(f!=='all'&&f!=='experiment'&&p!==f)return'';
        if(q){const num=String(i+1),topic=e.topic.toLowerCase();if(!num.includes(q)&&!topic.includes(q))return'';}
        let rowClass=p==='red'?'redrow':p==='green'?'greenrow':'amberrow';
        if(i===cur)rowClass+=' currentrow';
        const tag=isExperiment?'<span class="experiment-tag">EXP</span>':'';
        return '<div class="row '+rowClass+'" data-i="'+i+'" title="'+esc(labelPriority(p))+'"><div class="rownum">'+(i+1)+'</div><div class="topicname">'+esc(e.topic)+tag+'</div></div>';
      }).join('');
      bankEl.innerHTML=rows||'<div class="small" style="padding:16px">No concepts match this filter.</div>';
      bankEl.querySelectorAll('.row[data-i]').forEach(r=>r.onclick=()=>{
        const i=Number(r.dataset.i);let idx=order.indexOf(i);
        if(idx<0){order=[i,...order];idx=0;}
        pos=idx;render();
        if(window.innerWidth<981)window.scrollTo({top:0,behavior:'smooth'});
      });
    };
    filter.onchange=bank;
    search.oninput=bank;
  }

  // Clarify pupil-facing model-answer standard.
  const appNote=document.querySelector('#appPane .mode-note');
  if(appNote)appNote.innerHTML='<b>Important:</b> Your memorised Science sentence is the <b>S/R core</b>. For Explain / Why / Evidence / Compare questions, build a complete <b>D/E → S/R → L/R</b> answer when those parts are required. The gold-standard book determines the Science wording and key terms.';
  const modelBtn=document.getElementById('modelAppBtn');
  if(modelBtn)modelBtn.textContent='Show Full D/E → S/R → L/R Answer';

  const modelCache=(()=>{try{return JSON.parse(localStorage.getItem(MODEL_CACHE_KEY)||'{}')}catch(_){return{}}})();
  const saveModelCache=()=>{try{localStorage.setItem(MODEL_CACHE_KEY,JSON.stringify(modelCache))}catch(_){}};

  function fallbackModel(e){
    return `<div class="training-model"><div class="training-banner"><b>Gold-standard training model</b><br>The memorised sentence/framework is kept intact as the Science core.</div><div class="tm-verbatim"><b>Memorised S/R / framework:</b><br>${escHtml(e.phrase)}</div><div class="tm-full"><b>Applied answer</b>${escHtml(e.modelApplicationAnswer||e.phrase)}</div><div class="tm-keywords"><b>Key words to protect:</b> ${(e.rubric||[]).map(escHtml).join(' · ')}</div></div>`;
  }

  async function showTrainingModel(){
    const e=BANK[current()],box=document.getElementById('modelAppBox'),btn=document.getElementById('modelAppBtn');
    if(!box||!btn)return;
    if(!box.classList.contains('hide')){box.classList.add('hide');btn.textContent='Show Full D/E → S/R → L/R Answer';return;}
    const cacheKey=String(e.id)+'|'+e.phrase+'|'+e.applicationQuestion;
    if(modelCache[cacheKey]){renderTrainingModel(modelCache[cacheKey],e,box);box.classList.remove('hide');btn.textContent='Hide Full Answer';return;}
    box.innerHTML='<div class="training-banner">Building a complete gold-standard training answer…</div>';
    box.classList.remove('hide');btn.disabled=true;
    try{
      const res=await fetch(MODEL_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conceptId:e.id,topic:e.topic,question:e.applicationQuestion,verbatim:e.phrase,rubric:e.rubric,modelAnswer:e.modelApplicationAnswer})});
      if(!res.ok)throw new Error('Training model unavailable');
      const data=await res.json();
      modelCache[cacheKey]=data;saveModelCache();renderTrainingModel(data,e,box);btn.textContent='Hide Full Answer';
    }catch(err){box.innerHTML=fallbackModel(e);btn.textContent='Hide Full Answer'}finally{btn.disabled=false}
  }

  function renderTrainingModel(m,e,box){
    if(!m||m.error){box.innerHTML=fallbackModel(e);return;}
    if(m.frameNeeded){
      box.innerHTML=`<div class="training-model"><div class="training-banner"><b>Gold-standard training answer</b><br>D/E → S/R → L/R. The S/R uses the memorised Science explanation unchanged.</div><div class="tm-grid"><div class="tm-box tm-de"><b>D/E — Data / Evidence</b>${escHtml(m.de||'')}</div><div class="tm-box tm-sr"><b>S/R — Science / Reasoning</b>${escHtml(m.sr||e.phrase)}</div><div class="tm-box tm-lr"><b>L/R — Link / Result</b>${escHtml(m.lr||'')}</div></div><div class="tm-full"><b>Full PSLE-safe model answer</b>${escHtml(m.fullAnswer||e.modelApplicationAnswer)}</div>${m.keywords?'<div class="tm-keywords"><b>Key words to protect:</b> '+escHtml(m.keywords)+'</div>':''}</div>`;
    }else{
      box.innerHTML=`<div class="training-model"><div class="training-banner"><b>This question does not need D/E → S/R → L/R forced into it.</b><br>Answer the command word directly and precisely.</div><div class="tm-verbatim"><b>Memorised Science wording:</b><br>${escHtml(e.phrase)}</div><div class="tm-direct"><b>Direct model answer</b><br>${escHtml(m.fullAnswer||m.directAnswer||e.modelApplicationAnswer)}</div>${m.keywords?'<div class="tm-keywords"><b>Key words to protect:</b> '+escHtml(m.keywords)+'</div>':''}</div>`;
    }
  }
  if(modelBtn)modelBtn.onclick=showTrainingModel;

  // AI marker panel.
  const appAnswer=document.getElementById('appAnswer');
  let aiWrap=null,aiResult=null,aiBtn=null;
  if(appAnswer){
    aiWrap=document.createElement('div');aiWrap.className='ai-mark-wrap';
    aiWrap.innerHTML='<div class="ai-mark-head"><div class="ai-mark-title">🤖 AI Application Marker</div><span class="ai-state">● AI ready</span></div><div class="ai-note">Marks the answer using the question, gold-standard memorised explanation, scoring ideas and D/E → S/R → L/R only when required.</div><button class="ai-mark-btn" type="button" style="margin-top:9px">🤖 AI Mark My Answer</button><div class="ai-result hide"></div>';
    appAnswer.insertAdjacentElement('afterend',aiWrap);
    aiBtn=aiWrap.querySelector('.ai-mark-btn');aiResult=aiWrap.querySelector('.ai-result');
  }

  function criteriaHtml(c){
    if(!c)return'';
    const item=(label,required,met)=>`<span class="criterion ${!required?'na':met?'yes':'no'}">${label} ${!required?'— N/A':met?'✓':'✗'}</span>`;
    return '<div class="criteria-strip">'+item('D/E',c.deRequired,c.deMet)+item('S/R',c.srRequired,c.srMet)+item('L/R',c.lrRequired,c.lrMet)+'</div>';
  }

  async function markWithAI(){
    const e=BANK[current()],answer=(appAnswer.value||'').trim();
    if(!answer){aiResult.className='ai-result partial';aiResult.innerHTML='<div class="ai-verdict">Write an answer first.</div>';return;}
    aiBtn.disabled=true;aiBtn.textContent='Marking…';aiResult.className='ai-result';aiResult.innerHTML='Checking the Science and D/E → S/R → L/R…';
    try{
      const res=await fetch(AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conceptId:e.id,topic:e.topic,question:e.applicationQuestion,answer,verbatim:e.phrase,rubric:e.rubric,modelAnswer:e.modelApplicationAnswer})});
      const data=await res.json();if(!res.ok||data.error)throw new Error(data.error||'AI marker unavailable');
      const cls=data.rating==='correct'?'correct':data.rating==='de'||data.rating==='lr'?'partial':'wrongai';
      const icon=data.rating==='correct'?'✅':data.rating==='de'?'🟨':data.rating==='sr'?'🟧':data.rating==='lr'?'🟪':'❌';
      aiResult.className='ai-result '+cls;
      aiResult.innerHTML=`<div class="ai-verdict">${icon} ${escHtml(data.verdict||data.rating)}</div>${criteriaHtml(data.criteria)}${data.feedback?'<div class="ai-section"><b>Feedback</b>'+escHtml(data.feedback)+'</div>':''}${data.strengths?'<div class="ai-section"><b>What you did well</b>'+escHtml(data.strengths)+'</div>':''}${data.missing?'<div class="ai-section"><b>What is missing</b>'+escHtml(data.missing)+'</div>':''}${data.improvedAnswer?'<div class="ai-improved"><b>Gold-standard improved answer</b><br>'+escHtml(data.improvedAnswer)+'</div>':''}`;
      if(['correct','de','sr','lr','concept'].includes(data.rating))rateApp(data.rating);
      const x=rec(current());x.aiLast={date:today(),rating:data.rating,feedback:data.feedback||''};save();
    }catch(err){aiResult.className='ai-result wrongai';aiResult.innerHTML='<div class="ai-verdict">AI marker unavailable</div>Please use the rubric/manual buttons for this attempt and try again later.'}
    finally{aiBtn.disabled=false;aiBtn.textContent='🤖 AI Mark My Answer'}
  }
  if(aiBtn)aiBtn.onclick=markWithAI;

  const rating=document.querySelector('.rating');
  if(rating){const l=document.createElement('div');l.className='manual-label';l.textContent='Parent/teacher manual override (optional):';rating.insertAdjacentElement('beforebegin',l)}

  // Wrap render so the gold-standard indicators always stay in sync.
  const baseRender=render;
  render=function(){
    baseRender();
    updateExactProgress();
    if(modelBtn)modelBtn.textContent='Show Full D/E → S/R → L/R Answer';
    const box=document.getElementById('modelAppBox');if(box){box.classList.add('hide');box.innerHTML=''}
    if(aiResult){aiResult.className='ai-result hide';aiResult.innerHTML=''}
  };

  updateExactProgress();
  bank();
})();
