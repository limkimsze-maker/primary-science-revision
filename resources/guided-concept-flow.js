(()=>{
let tries=0;
function boot(){
  tries++;
  if(typeof BANK==='undefined'||!Array.isArray(BANK)||!BANK.length||typeof current!=='function'||typeof rec!=='function'||typeof save!=='function'||typeof next!=='function'){
    if(tries<150)setTimeout(boot,80);return;
  }
  if(document.getElementById('guidedFlow'))return;

  const $=id=>document.getElementById(id);
  const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const waitFor=(fn,ms=12000)=>new Promise(resolve=>{const st=Date.now();const tick=()=>{let ok=false;try{ok=!!fn()}catch(_e){}if(ok)return resolve(true);if(Date.now()-st>=ms)return resolve(false);setTimeout(tick,90)};tick()});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let stage='flash',flashBack=false,memMode='study',classic=false,appPreparedFor=-1;

  const header=document.querySelector('body>.wrap>header');
  const flow=document.createElement('section');flow.id='guidedFlow';
  flow.innerHTML=`
    <div class="gf-top">
      <div>
        <div class="gf-eyebrow">ONE CONCEPT AT A TIME</div>
        <h2 id="gfTitle">Science Memory Path</h2>
        <div id="gfMeta" class="gf-meta"></div>
      </div>
      <button id="gfClassic" class="gf-ghost">More practice options</button>
    </div>
    <div class="gf-steps" aria-label="learning path">
      <div id="gfStepFlash" class="gf-step"><span>1</span><b>Recall</b><small>Flashcard</small></div>
      <div class="gf-line"></div>
      <div id="gfStepMem" class="gf-step"><span>2</span><b>Memorise</b><small>Exact sentence</small></div>
      <div class="gf-line"></div>
      <div id="gfStepApp" class="gf-step"><span>3</span><b>Apply</b><small>1 question</small></div>
    </div>
    <div id="gfBody" class="gf-card"></div>`;
  header.insertAdjacentElement('afterend',flow);

  const style=document.createElement('style');style.id='guidedFlowStyle';style.textContent=`
  body.gf-on{background:linear-gradient(180deg,#eef2ff 0,#f8fafc 38%,#f4f7fb 100%)}
  body.gf-on> .wrap>header .tabs,body.gf-on> .wrap>.controls,body.gf-on> .wrap>.stats,body.gf-on> .wrap>.main-grid,body.gf-on #flashcardPanel{display:none!important}
  body.gf-on> .wrap{max-width:1120px;padding-top:18px}
  body.gf-on> .wrap>header{margin-bottom:8px}
  body.gf-on> .wrap>header .sub{max-width:850px}
  #guidedFlow{margin:12px auto 28px;max-width:1020px}
  .gf-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:14px}.gf-eyebrow{font-size:12px;letter-spacing:.13em;font-weight:900;color:#4f46e5}.gf-top h2{font-size:clamp(26px,4vw,38px);margin:3px 0}.gf-meta{color:#64748b;font-weight:700;line-height:1.5}.gf-ghost{background:#fff;color:#475569;border:1px solid #dbe3ee;font-size:12px;padding:8px 10px}
  .gf-steps{display:flex;align-items:center;background:#fff;border:1px solid #dbe3ee;border-radius:18px;padding:12px 16px;box-shadow:0 8px 28px #0f172a0b;margin-bottom:14px}.gf-step{display:grid;grid-template-columns:34px auto;column-gap:9px;align-items:center;min-width:145px;color:#94a3b8}.gf-step span{grid-row:1/3;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#e2e8f0;color:#64748b;font-weight:900}.gf-step b{font-size:14px}.gf-step small{font-size:11px}.gf-step.active{color:#3730a3}.gf-step.active span{background:#4f46e5;color:#fff;box-shadow:0 0 0 5px #eef2ff}.gf-step.done{color:#047857}.gf-step.done span{background:#10b981;color:#fff}.gf-line{height:3px;flex:1;background:#e2e8f0;border-radius:999px;margin:0 8px}.gf-line.done{background:#86efac}
  .gf-card{background:#fff;border:1px solid #dbe3ee;border-radius:24px;box-shadow:0 18px 50px #0f172a12;padding:clamp(20px,4vw,38px);min-height:460px}.gf-pillrow{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px}.gf-pill{padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;background:#eef2ff;color:#3730a3}.gf-pill.status{background:#f8fafc;color:#475569}.gf-prompt{font-size:clamp(28px,4.5vw,45px);font-weight:900;line-height:1.22;text-align:center;margin:42px auto 22px;max-width:850px}.gf-answer{font-size:clamp(27px,4vw,40px);font-weight:900;line-height:1.35;text-align:center;margin:32px auto;max-width:850px;color:#14532d}.gf-hint{text-align:center;color:#64748b;font-weight:700;margin:18px 0}.gf-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:22px}.gf-btn{border:0;border-radius:14px;padding:13px 18px;font-weight:900;font-size:15px;cursor:pointer}.gf-primary{background:#4f46e5;color:#fff}.gf-good{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}.gf-warn{background:#fff1f2;color:#991b1b;border:1px solid #fecdd3}.gf-next{background:#047857;color:#fff}.gf-muted{background:#f8fafc;color:#475569;border:1px solid #dbe3ee}.gf-study{background:linear-gradient(180deg,#f8fafc,#eef2ff);border:1px solid #c7d2fe;border-radius:18px;padding:24px;text-align:center}.gf-study .gf-answer{margin:8px auto 2px}.gf-textarea{width:100%;min-height:150px;border:2px solid #cbd5e1;border-radius:16px;padding:16px;font:inherit;font-size:18px;line-height:1.55;resize:vertical}.gf-textarea:focus{outline:none;border-color:#4f46e5;box-shadow:0 0 0 4px #eef2ff}.gf-feedback{margin-top:16px;padding:14px 16px;border-radius:14px;line-height:1.5;font-weight:700}.gf-feedback.good{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}.gf-feedback.bad{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}.gf-feedback.info{background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3}.gf-guide{margin:14px 0;background:#f8fafc;border:1px solid #dbe3ee;border-radius:16px;padding:14px;color:#334155;line-height:1.45}.gf-guide .frame-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.gf-guide .frame-box{border:1px solid #dbe3ee;border-radius:11px;background:#fff;padding:10px}.gf-guide .frame-box b{display:block;margin-bottom:4px}.gf-source{text-align:center;color:#166534;font-weight:800;font-size:12px;margin-top:12px}.gf-loading{display:grid;place-items:center;min-height:330px;text-align:center;color:#475569;font-weight:800}.gf-spinner{width:38px;height:38px;border:4px solid #e2e8f0;border-top-color:#4f46e5;border-radius:50%;animation:gfspin .8s linear infinite;margin-bottom:12px}@keyframes gfspin{to{transform:rotate(360deg)}}
  body.gf-classic #guidedFlow{display:none!important}body.gf-classic> .wrap>header .tabs,body.gf-classic> .wrap>.controls,body.gf-classic> .wrap>.stats,body.gf-classic> .wrap>.main-grid{display:flex}body.gf-classic> .wrap>.stats{display:grid}body.gf-classic> .wrap>.main-grid{display:grid}
  @media(max-width:720px){.gf-top{align-items:center}.gf-ghost{font-size:11px}.gf-steps{padding:10px;overflow-x:auto}.gf-step{min-width:110px;grid-template-columns:30px auto}.gf-step span{width:30px;height:30px}.gf-line{min-width:22px}.gf-card{padding:18px;min-height:420px}.gf-guide .frame-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(style);

  function concept(){return BANK[current()]||BANK[0]}
  function statusLabel(i){try{const p=priority(i);return p==='red'?'🔴 Focus':p==='green'?'🟢 Already Good':'⚪ Learning'}catch(_e){return'⚪ Learning'}}
  function setSteps(){
    const orderStage=['flash','mem','app'];const at=orderStage.indexOf(stage);
    orderStage.forEach((s,idx)=>{const el=$(s==='flash'?'gfStepFlash':s==='mem'?'gfStepMem':'gfStepApp');el.classList.toggle('active',idx===at);el.classList.toggle('done',idx<at)});
    document.querySelectorAll('#guidedFlow .gf-line').forEach((el,idx)=>el.classList.toggle('done',idx<at));
  }
  function meta(){
    const i=current(),e=concept();
    $('gfTitle').textContent=e.topic||'Science concept';
    $('gfMeta').textContent=`Concept ${e.id} · ${e.category} · ${typeof pos==='number'&&Array.isArray(order)?`${pos+1} of ${order.length} in today’s queue · `:''}${statusLabel(i)}`;
  }
  function speak(text){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text||''));u.lang='en-GB';u.rate=.86;speechSynthesis.speak(u)}catch(_e){}}
  function render(){document.body.classList.add('gf-on');document.body.classList.toggle('gf-classic',classic);if(classic)return;meta();setSteps();if(stage==='flash')renderFlash();else if(stage==='mem')renderMem();else renderAppShell()}

  function pills(e){return `<div class="gf-pillrow"><span class="gf-pill">#${e.id}</span><span class="gf-pill">${esc(e.category)}</span><span class="gf-pill status">${esc(statusLabel(current()))}</span></div>`}
  function renderFlash(){
    const e=concept(),b=$('gfBody');
    b.innerHTML=pills(e)+(flashBack?`<div class="gf-answer">${esc(e.phrase)}</div><div class="gf-source">📘 ${esc(e.bookRef||'Book-backed Science core')}</div><div class="gf-hint">How did that compare with what you recalled?</div><div class="gf-actions"><button id="gfWrong" class="gf-btn gf-warn">✕ Need practice</button><button id="gfRight" class="gf-btn gf-good">✓ I knew it</button></div>`:`<div class="gf-prompt">${esc(e.phrasePrompt)}</div><div class="gf-hint">Try to answer in your head first.</div><div class="gf-actions"><button id="gfReveal" class="gf-btn gf-primary">Show answer</button></div>`);
    if(!flashBack){$('gfReveal').onclick=()=>{flashBack=true;renderFlash();speak(e.phrase)}}
    else{
      $('gfWrong').onclick=()=>finishFlash('wrong');$('gfRight').onclick=()=>finishFlash('right');
    }
  }
  function finishFlash(result){
    const i=current();try{const x=rec(i);x.flashcardResult=result;save()}catch(_e){}
    stage='mem';memMode='study';flashBack=false;render();speak(concept().phrase);
  }

  function renderMem(feedback=''){
    const e=concept(),b=$('gfBody');
    if(memMode==='study'){
      b.innerHTML=pills(e)+`<div class="gf-study"><div class="gf-hint">Study this exact Science sentence</div><div class="gf-answer">${esc(e.phrase)}</div></div><div class="gf-actions"><button id="gfTestMe" class="gf-btn gf-primary">I'm ready — test me</button></div>`;
      $('gfTestMe').onclick=()=>{memMode='recall';renderMem();setTimeout(()=>$('gfRecall')?.focus(),50)};return;
    }
    b.innerHTML=pills(e)+`<div class="gf-hint">Type the exact Science sentence from memory.</div><textarea id="gfRecall" class="gf-textarea" spellcheck="false" placeholder="Type the sentence from memory..."></textarea><div class="gf-actions"><button id="gfCheckRecall" class="gf-btn gf-primary">Check recall</button></div><div id="gfMemFeedback">${feedback}</div>`;
    $('gfCheckRecall').onclick=checkRecall;
  }
  function checkRecall(){
    const e=concept(),ta=$('gfRecall'),u=ta.value;
    if(!norm(u)){ $('gfMemFeedback').innerHTML='<div class="gf-feedback info">Type your answer first.</div>';return }
    if(norm(u)===norm(e.phrase)){
      try{const i=current(),x=rec(i),d=today();x.phraseDates=Array.isArray(x.phraseDates)?x.phraseDates:[];if(!x.phraseDates.includes(d))x.phraseDates.push(d);x.phraseLast='correct';const secure=new Set(x.phraseDates).size>=3;x.due=Date.now()+(secure?7:1)*86400000;save()}catch(_e){}
      $('gfMemFeedback').innerHTML='<div class="gf-feedback good">✅ Exact recall. Now use the same concept in one application question.</div>';$('gfCheckRecall').disabled=true;
      setTimeout(prepareApp,650);
    }else{
      try{const i=current(),x=rec(i);x.phraseWrong=(x.phraseWrong||0)+1;x.phraseLast='wrong';x.due=Date.now()+3*3600000;save()}catch(_e){}
      const comparison=typeof diff==='function'?`<div style="margin-top:8px;background:#fff;padding:9px;border-radius:10px">${diff(u,e.phrase)}</div>`:'';
      $('gfMemFeedback').innerHTML=`<div class="gf-feedback bad">Not exact yet. Study the target once, then try again.${comparison}</div><div class="gf-study" style="margin-top:10px"><div class="gf-answer" style="font-size:24px">${esc(e.phrase)}</div></div><div class="gf-actions"><button id="gfRetryMem" class="gf-btn gf-muted">Try again</button></div>`;
      $('gfRetryMem').onclick=()=>{renderMem();setTimeout(()=>$('gfRecall')?.focus(),50)};
    }
  }

  async function prepareApp(){
    stage='app';renderAppShell(true);
    const i=current();
    try{
      const tab=$('appTab');if(tab)tab.click();
      const ready=await waitFor(()=>$('aiMarkBtn')&&$('freshAppBtn')&&$('variantNote')&&$('appLiteTip'),15000);
      if(!ready)throw new Error('Application question tools are still loading.');
      // Prefer one transfer/application item over the direct recall variant.
      for(let n=0;n<6;n++){
        const note=String($('variantNote')?.textContent||'').toLowerCase();
        if(!note.includes('recall'))break;
        $('freshAppBtn')?.click();await sleep(30);
      }
      appPreparedFor=i;renderAppShell(false);setTimeout(()=>$('gfAppAnswer')?.focus(),50);
    }catch(err){
      $('gfBody').innerHTML=`<div class="gf-feedback bad">Could not prepare the application question yet.<br><small>${esc(err.message||err)}</small></div><div class="gf-actions"><button id="gfRetryAppLoad" class="gf-btn gf-primary">Try again</button></div>`;
      $('gfRetryAppLoad').onclick=prepareApp;
    }
  }
  function renderAppShell(loading=false){
    const b=$('gfBody'),e=concept();
    if(loading||appPreparedFor!==current()){
      b.innerHTML=`<div class="gf-loading"><div><div class="gf-spinner"></div>Preparing one application question for <b>${esc(e.topic)}</b>…</div></div>`;return;
    }
    const q=String($('appQuestion')?.textContent||e.applicationQuestion||'').trim();
    const tip=$('appLiteTip')?.innerHTML||'Read the command word first and answer only what is asked.';
    const frame=$('appPane')?.querySelector('.frame')?.innerHTML||'';
    b.innerHTML=pills(e)+`<div class="gf-guide">${tip}</div><div class="gf-prompt" style="text-align:left;font-size:clamp(24px,3.5vw,34px);margin:22px 0">${esc(q)}</div>${frame?`<div class="gf-guide">${frame}</div>`:''}<textarea id="gfAppAnswer" class="gf-textarea" spellcheck="false" placeholder="Write your PSLE Science answer..."></textarea><div class="gf-actions"><button id="gfMarkApp" class="gf-btn gf-primary">🤖 Check my answer</button></div><div id="gfAppFeedback"></div>`;
    $('gfMarkApp').onclick=markApplication;
  }
  async function markApplication(){
    const ta=$('gfAppAnswer'),u=ta.value.trim(),fb=$('gfAppFeedback'),btn=$('gfMarkApp');
    if(!u){fb.innerHTML='<div class="gf-feedback info">Write your answer first.</div>';return}
    const hiddenAns=$('appAnswer'),ai=$('aiMarkBtn');if(!hiddenAns||!ai){fb.innerHTML='<div class="gf-feedback bad">AI marker is still loading. Try again in a moment.</div>';return}
    hiddenAns.value=u;hiddenAns.dispatchEvent(new Event('input',{bubbles:true}));
    let before=0;try{before=rec(current()).appAttempts||0}catch(_e){}
    btn.disabled=true;btn.textContent='🤖 Checking…';fb.innerHTML='<div class="gf-feedback info">AI is checking the Science and the command word…</div>';
    ai.click();
    const done=await waitFor(()=>{try{return (rec(current()).appAttempts||0)>before || (!ai.disabled&&String($('aiStatus')?.textContent||'').includes('unavailable'))}catch(_e){return false}},35000);
    btn.disabled=false;btn.textContent='🤖 Check my answer';
    if(!done){fb.innerHTML='<div class="gf-feedback bad">The AI marker took too long. Please try again.</div>';return}
    const source=$('appFeedback');const text=source?source.textContent.trim():'Answer checked.';let correct=false;try{correct=rec(current()).appLast==='correct'}catch(_e){}
    if(correct){
      fb.innerHTML=`<div class="gf-feedback good">${esc(text||'✅ Correct')}</div><div class="gf-actions"><button id="gfNextConcept" class="gf-btn gf-next">Next concept →</button></div>`;
      $('gfNextConcept').onclick=advanceConcept;
    }else{
      fb.innerHTML=`<div class="gf-feedback bad">${esc(text||'Not correct yet. Use the feedback, edit your answer and try again.')}</div>`;
    }
  }
  function advanceConcept(){
    try{next()}catch(_e){}
    stage='flash';flashBack=false;memMode='study';appPreparedFor=-1;render();speak(`${concept().topic}. ${concept().phrasePrompt}`);
  }

  $('gfClassic').onclick=()=>{
    classic=!classic;document.body.classList.toggle('gf-classic',classic);$('gfClassic').textContent=classic?'Return to guided flow':'More practice options';
    if(classic){document.querySelector('header .tabs')?.style.removeProperty('display')}else render();
  };

  document.body.classList.add('gf-on');render();setTimeout(()=>speak(`${concept().topic}. ${concept().phrasePrompt}`),250);
}
boot();
})();