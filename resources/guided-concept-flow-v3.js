(()=>{
let tries=0;
function boot(){
  tries++;
  if(typeof BANK==='undefined'||!Array.isArray(BANK)||BANK.length!==180||typeof current!=='function'||typeof rec!=='function'||typeof save!=='function'){
    if(tries<180)setTimeout(boot,80);return;
  }
  if(document.getElementById('guidedFlow'))return;

  const $=id=>document.getElementById(id);
  const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const waitFor=(fn,ms=15000)=>new Promise(resolve=>{const st=Date.now();const tick=()=>{let ok=false;try{ok=!!fn()}catch(_e){}if(ok)return resolve(true);if(Date.now()-st>=ms)return resolve(false);setTimeout(tick,90)};tick()});

  function firstLetterCue(text){
    return String(text||'').split(/\s+/).filter(Boolean).map(w=>{
      const m=w.match(/[A-Za-z]/);if(!m)return w;
      const first=m[0];const tail=(w.match(/[^A-Za-z]+$/)||[''])[0];return first+tail;
    }).join(' ');
  }
  function gapCue(text){
    const words=String(text||'').split(/\s+/);let wordNo=0;
    return words.map((w,i)=>{
      const letters=w.match(/[A-Za-z]+/);if(!letters)return w;
      wordNo++;const important=/photosynthesis|oxygen|respiration|energy|heat|evaporation|condensation|friction|current|circuit|absorb|transport|competition|continuity|potential|kinetic|germination|fertilisation|pollination|stomata|nutrient|blood|umbilical|light|water|temperature|force/i.test(w);
      if(important||wordNo%3===0){const tail=(w.match(/[^A-Za-z]+$/)||[''])[0];return '________'+tail}
      return w;
    }).join(' ');
  }

  let stage='flash',flashBack=false,memMode='exact',memNotice='',classic=false,appPreparedFor=-1,lastChosen=null,empty=false;
  const picker={search:'',topic:'all',status:'notdone',sort:'book'};
  const categories=[...new Set(BANK.map(e=>e.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b));

  function known(i){try{return new Set(rec(i).appCorrectDates||[]).size>=1}catch(_e){return false}}
  function statusLabel(i){return known(i)?'✅ Known':'○ Not done'}
  function counts(){let k=0;for(let i=0;i<BANK.length;i++)if(known(i))k++;return{known:k,notdone:BANK.length-k}}
  function matches(){
    const q=norm(picker.search);let a=[...Array(BANK.length).keys()].filter(i=>{
      const e=BANK[i];
      if(picker.topic!=='all'&&e.category!==picker.topic)return false;
      if(picker.status==='known'&&!known(i))return false;
      if(picker.status==='notdone'&&known(i))return false;
      if(q&&!norm(`${e.id} ${e.topic} ${e.category} ${e.phrasePrompt} ${e.phrase}`).includes(q))return false;
      return true;
    });
    if(picker.sort==='topic')a.sort((i,j)=>(BANK[i].category||'').localeCompare(BANK[j].category||'')||(BANK[i].topic||'').localeCompare(BANK[j].topic||'')||BANK[i].id-BANK[j].id);
    else if(picker.sort==='az')a.sort((i,j)=>(BANK[i].topic||'').localeCompare(BANK[j].topic||'')||BANK[i].id-BANK[j].id);
    else if(picker.sort==='status')a.sort((i,j)=>Number(known(i))-Number(known(j))||(BANK[i].category||'').localeCompare(BANK[j].category||'')||BANK[i].id-BANK[j].id);
    else a.sort((i,j)=>BANK[i].id-BANK[j].id);
    return a;
  }
  function resetCycle(){stage='flash';flashBack=false;memMode='exact';memNotice='';appPreparedFor=-1;lastChosen=null}
  function applyPicker(keepCurrent=true){
    if(stage!=='flash'||flashBack)return;
    const cur=current(),a=matches();empty=!a.length;
    if(empty){order=[];pos=0;render();return}
    order=a;const at=keepCurrent?a.indexOf(cur):-1;pos=at>=0?at:0;resetCycle();render();
  }

  const header=document.querySelector('body>.wrap>header');
  if(!header)return;
  const flow=document.createElement('section');flow.id='guidedFlow';
  flow.innerHTML=`
    <div class="gf-top"><div><div class="gf-eyebrow">ONE CONCEPT AT A TIME</div><h2 id="gfTitle">Science Memory Path</h2><div id="gfMeta" class="gf-meta"></div></div><button id="gfClassic" class="gf-ghost">More practice options</button></div>
    <div class="gf-picker">
      <div class="gf-searchwrap"><span>⌕</span><input id="gfSearch" type="search" autocomplete="off" placeholder="Search concept, question or Science idea…"></div>
      <select id="gfTopic"><option value="all">All topics</option>${categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
      <select id="gfStatus"><option value="notdone">○ Not done</option><option value="known">✅ Known</option><option value="all">All concepts</option></select>
      <select id="gfSort"><option value="book">Book order</option><option value="topic">Sort by topic</option><option value="az">Concept A–Z</option><option value="status">Not done first</option></select>
      <div id="gfCounts" class="gf-counts"></div>
    </div>
    <div id="gfFilterNote" class="gf-filter-note"></div>
    <div class="gf-steps">
      <div id="gfStepFlash" class="gf-step"><span>1</span><b>Recall</b><small>Flashcard</small></div><div class="gf-line"></div>
      <div id="gfStepMem" class="gf-step"><span>2</span><b>Memorise</b><small>Support only if needed</small></div><div class="gf-line"></div>
      <div id="gfStepApp" class="gf-step"><span>3</span><b>Apply</b><small>1 question</small></div>
    </div>
    <div id="gfBody" class="gf-card"></div>`;
  header.insertAdjacentElement('afterend',flow);

  const style=document.createElement('style');style.id='guidedFlowStyle';style.textContent=`
  body.gf-on{background:linear-gradient(180deg,#eef2ff 0,#f8fafc 38%,#f4f7fb 100%)}
  body.gf-on> .wrap>header .tabs,body.gf-on> .wrap>.controls,body.gf-on> .wrap>.stats,body.gf-on> .wrap>.main-grid,body.gf-on #flashcardPanel{display:none!important}
  body.gf-on> .wrap{max-width:1120px;padding-top:18px}body.gf-on> .wrap>header{margin-bottom:8px}#guidedFlow{margin:12px auto 28px;max-width:1020px}
  .gf-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:12px}.gf-eyebrow{font-size:12px;letter-spacing:.13em;font-weight:900;color:#4f46e5}.gf-top h2{font-size:clamp(26px,4vw,38px);margin:3px 0}.gf-meta{color:#64748b;font-weight:700;line-height:1.5}.gf-ghost{background:#fff;color:#475569;border:1px solid #dbe3ee;font-size:12px;padding:8px 10px;border-radius:11px}
  .gf-picker{display:grid;grid-template-columns:minmax(260px,1.7fr) 1fr .85fr .9fr auto;gap:8px;background:#fff;border:1px solid #dbe3ee;border-radius:16px;padding:10px;box-shadow:0 7px 22px #0f172a0b;margin-bottom:6px}.gf-picker input,.gf-picker select{width:100%;border:1px solid #dbe3ee;border-radius:11px;padding:10px;background:#fff}.gf-searchwrap{position:relative}.gf-searchwrap span{position:absolute;left:10px;top:8px;color:#64748b;font-size:20px}.gf-searchwrap input{padding-left:34px}.gf-counts{white-space:nowrap;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#475569;padding:0 5px}.gf-filter-note{min-height:18px;color:#64748b;font-size:11px;font-weight:700;margin:0 4px 8px}.gf-picker.locked{opacity:.58}.gf-picker.locked input,.gf-picker.locked select{cursor:not-allowed}
  .gf-steps{display:flex;align-items:center;background:#fff;border:1px solid #dbe3ee;border-radius:18px;padding:12px 16px;box-shadow:0 8px 28px #0f172a0b;margin-bottom:14px}.gf-step{display:grid;grid-template-columns:34px auto;column-gap:9px;align-items:center;min-width:145px;color:#94a3b8}.gf-step span{grid-row:1/3;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#e2e8f0;color:#64748b;font-weight:900}.gf-step b{font-size:14px}.gf-step small{font-size:11px}.gf-step.active{color:#3730a3}.gf-step.active span{background:#4f46e5;color:#fff;box-shadow:0 0 0 5px #eef2ff}.gf-step.done{color:#047857}.gf-step.done span{background:#10b981;color:#fff}.gf-line{height:3px;flex:1;background:#e2e8f0;border-radius:999px;margin:0 8px}.gf-line.done{background:#86efac}
  .gf-card{background:#fff;border:1px solid #dbe3ee;border-radius:24px;box-shadow:0 18px 50px #0f172a12;padding:clamp(20px,4vw,38px);min-height:440px}.gf-pillrow{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px}.gf-pill{padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;background:#eef2ff;color:#3730a3}.gf-pill.status.done{background:#dcfce7;color:#166534}.gf-pill.status.todo{background:#f8fafc;color:#475569}.gf-prompt{font-size:clamp(28px,4.5vw,45px);font-weight:900;line-height:1.22;text-align:center;margin:42px auto 22px;max-width:850px}.gf-answer{font-size:clamp(27px,4vw,40px);font-weight:900;line-height:1.35;text-align:center;margin:32px auto;max-width:850px;color:#14532d}.gf-hint{text-align:center;color:#64748b;font-weight:700;margin:18px 0}.gf-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:22px}.gf-btn{border:0;border-radius:14px;padding:13px 18px;font-weight:900;font-size:15px;cursor:pointer}.gf-primary{background:#4f46e5;color:#fff}.gf-good{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}.gf-warn{background:#fff1f2;color:#991b1b;border:1px solid #fecdd3}.gf-next{background:#047857;color:#fff}.gf-muted{background:#f8fafc;color:#475569;border:1px solid #dbe3ee}.gf-textarea{width:100%;min-height:150px;border:2px solid #cbd5e1;border-radius:16px;padding:16px;font:inherit;font-size:18px;line-height:1.55;resize:vertical}.gf-textarea:focus{outline:none;border-color:#4f46e5;box-shadow:0 0 0 4px #eef2ff}.gf-feedback{margin-top:16px;padding:14px 16px;border-radius:14px;line-height:1.5;font-weight:700}.gf-feedback.good{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}.gf-feedback.bad{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}.gf-feedback.info{background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3}.gf-guide{margin:14px 0;background:#f8fafc;border:1px solid #dbe3ee;border-radius:16px;padding:14px;color:#334155;line-height:1.45}.gf-guide .frame-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.gf-guide .frame-box{border:1px solid #dbe3ee;border-radius:11px;background:#fff;padding:10px}.gf-guide .frame-box b{display:block;margin-bottom:4px}.gf-source{text-align:center;color:#166534;font-weight:800;font-size:12px;margin-top:12px}.gf-loading{display:grid;place-items:center;min-height:310px;text-align:center;color:#475569;font-weight:800}.gf-spinner{width:38px;height:38px;border:4px solid #e2e8f0;border-top-color:#4f46e5;border-radius:50%;animation:gfspin .8s linear infinite;margin:0 auto 12px}@keyframes gfspin{to{transform:rotate(360deg)}}
  .gf-ladder{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 18px}.gf-ladder div{padding:10px;border-radius:12px;border:1px solid #e2e8f0;background:#f8fafc;color:#94a3b8;text-align:center;font-size:11px;font-weight:900}.gf-ladder .active{background:#eef2ff;border-color:#818cf8;color:#3730a3;box-shadow:0 0 0 2px #eef2ff}.gf-ladder .passed{background:#ecfdf5;border-color:#a7f3d0;color:#047857}.gf-cue{margin:16px 0;padding:20px;border-radius:17px;border:2px solid #c7d2fe;background:#f8faff;text-align:center;font-size:clamp(21px,3vw,29px);font-weight:900;line-height:1.55}.gf-cue.learn{background:#ecfdf5;border-color:#86efac;color:#14532d}.gf-mode{font-size:clamp(20px,3vw,27px);font-weight:900;text-align:center;margin:10px 0 4px}.gf-empty{text-align:center;padding:70px 15px}.gf-empty h3{font-size:27px;margin:0 0 8px}.gf-empty p{color:#64748b}
  body.gf-classic #guidedFlow{display:none!important}body.gf-classic> .wrap>header .tabs,body.gf-classic> .wrap>.controls,body.gf-classic> .wrap>.stats,body.gf-classic> .wrap>.main-grid{display:flex}body.gf-classic> .wrap>.stats{display:grid}body.gf-classic> .wrap>.main-grid{display:grid}
  @media(max-width:850px){.gf-picker{grid-template-columns:1fr 1fr}.gf-searchwrap,.gf-counts{grid-column:1/-1}.gf-counts{justify-content:flex-start}.gf-steps{overflow-x:auto}.gf-step{min-width:110px}.gf-ladder{grid-template-columns:1fr 1fr}.gf-guide .frame-grid{grid-template-columns:1fr}}
  @media(max-width:520px){.gf-picker{grid-template-columns:1fr}.gf-searchwrap,.gf-counts{grid-column:auto}.gf-card{padding:18px}.gf-top h2{font-size:26px}}
  `;document.head.appendChild(style);

  function concept(){return BANK[current()]||BANK[0]}
  function syncPicker(){$('gfSearch').value=picker.search;$('gfTopic').value=picker.topic;$('gfStatus').value=picker.status;$('gfSort').value=picker.sort}
  function updatePicker(){const locked=stage!=='flash'||flashBack;flow.querySelector('.gf-picker').classList.toggle('locked',locked);['gfSearch','gfTopic','gfStatus','gfSort'].forEach(id=>$(id).disabled=locked);$('gfFilterNote').textContent=locked?'Finish this concept first. Filters unlock before the next concept.':'Choose a topic, search, or show only Known / Not done.';const c=counts();$('gfCounts').textContent=`✅ ${c.known} known · ○ ${c.notdone} not done`}
  function setSteps(){const a=['flash','mem','app'],at=a.indexOf(stage);a.forEach((s,i)=>{const el=$(s==='flash'?'gfStepFlash':s==='mem'?'gfStepMem':'gfStepApp');el.classList.toggle('active',i===at);el.classList.toggle('done',i<at)});document.querySelectorAll('#guidedFlow .gf-line').forEach((el,i)=>el.classList.toggle('done',i<at))}
  function meta(){if(empty){$('gfTitle').textContent='Science Memory Path';$('gfMeta').textContent='No concepts match the current selection.';return}const e=concept();$('gfTitle').textContent=e.topic||'Science concept';$('gfMeta').textContent=`Concept ${e.id} · ${e.category} · ${pos+1} of ${order.length} selected · ${statusLabel(current())}`}
  function speak(text){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text||''));u.lang='en-GB';u.rate=.86;speechSynthesis.speak(u)}catch(_e){}}
  function pills(e){const d=known(current());return `<div class="gf-pillrow"><span class="gf-pill">#${e.id}</span><span class="gf-pill">${esc(e.category)}</span><span class="gf-pill status ${d?'done':'todo'}">${d?'✅ Known':'○ Not done'}</span></div>`}
  function render(){document.body.classList.add('gf-on');document.body.classList.toggle('gf-classic',classic);if(classic)return;updatePicker();meta();setSteps();if(empty){$('gfBody').innerHTML='<div class="gf-empty"><h3>No matching concepts</h3><p>Change the topic, search or Known / Not done filter.</p></div>';return}if(stage==='flash')renderFlash();else if(stage==='mem')renderMem();else renderApp()}

  function renderFlash(){const e=concept(),b=$('gfBody');b.innerHTML=pills(e)+(flashBack?`<div class="gf-answer">${esc(e.phrase)}</div><div class="gf-source">📘 ${esc(e.bookRef||'Book-backed Science core')}</div><div class="gf-hint">Did you know this explanation?</div><div class="gf-actions"><button id="gfWrong" class="gf-btn gf-warn">✕ Need practice</button><button id="gfRight" class="gf-btn gf-good">✓ I knew it</button></div>`:`<div class="gf-prompt">${esc(e.phrasePrompt)}</div><div class="gf-hint">Answer in your head first.</div><div class="gf-actions"><button id="gfReveal" class="gf-btn gf-primary">Show answer</button></div>`);if(!flashBack)$('gfReveal').onclick=()=>{flashBack=true;render();speak(e.phrase)};else{$('gfWrong').onclick=()=>finishFlash('wrong');$('gfRight').onclick=()=>finishFlash('right')}}
  function finishFlash(result){try{const x=rec(current());x.flashcardResult=result;save()}catch(_e){}stage='mem';memMode='exact';memNotice='';flashBack=false;render();setTimeout(()=>$('gfRecall')?.focus(),40)}

  function ladder(){const modes=['exact','initials','gaps','learn'],labels=['Exact recall','First letters','Fill blanks','Learn / copy'],at=modes.indexOf(memMode);return `<div class="gf-ladder">${labels.map((l,i)=>`<div class="${i===at?'active':i<at?'passed':''}">${i+1}. ${l}</div>`).join('')}</div>`}
  function renderMem(){
    const e=concept(),b=$('gfBody');let cue='',title='',help='';
    if(memMode==='exact'){title='Exact recall — no hints';help='Type the full Science sentence from memory.'}
    if(memMode==='initials'){title='First-letter cues';help='Use the first letter of each word to reconstruct the full sentence.';cue=`<div class="gf-cue">${esc(firstLetterCue(e.phrase))}</div>`}
    if(memMode==='gaps'){title='Fill in the blanks';help='Use the partly-completed sentence to reconstruct the full sentence.';cue=`<div class="gf-cue">${esc(gapCue(e.phrase))}</div>`}
    if(memMode==='learn'){title='Learn — exact copy';help='The full sentence is shown. Copy it exactly once.';cue=`<div class="gf-cue learn">${esc(e.phrase)}</div>`}
    const notice=memNotice?`<div class="gf-feedback info" style="margin:0 0 14px">${esc(memNotice)}</div>`:'';
    b.innerHTML=pills(e)+ladder()+notice+`<div class="gf-mode">${title}</div><div class="gf-hint">${help}</div>${cue}<textarea id="gfRecall" class="gf-textarea" spellcheck="false" placeholder="Type the full Science sentence..."></textarea><div class="gf-actions"><button id="gfCheckRecall" class="gf-btn gf-primary">${memMode==='learn'?'Check exact copy':'Check answer'}</button></div><div id="gfMemFeedback"></div>`;
    $('gfCheckRecall').onclick=checkRecall;
  }
  function checkRecall(){
    const e=concept(),u=$('gfRecall').value,fb=$('gfMemFeedback');if(!norm(u)){fb.innerHTML='<div class="gf-feedback info">Type your answer first.</div>';return}
    const mode=memMode,correct=norm(u)===norm(e.phrase);
    if(correct){
      try{const x=rec(current()),d=today();x.phraseLast='correct';x.guidedRecallSupport=mode;x.guidedRecallCompletedAt=Date.now();if(mode==='exact'){x.phraseDates=Array.isArray(x.phraseDates)?x.phraseDates:[];if(!x.phraseDates.includes(d))x.phraseDates.push(d);x.guidedExactRecallAt=Date.now()}save()}catch(_e){}
      fb.innerHTML=`<div class="gf-feedback good">✅ ${mode==='exact'?'Exact recall':'Memorisation'} complete. Moving to one Application question.</div>`;$('gfCheckRecall').disabled=true;setTimeout(prepareApp,450);return;
    }
    try{const x=rec(current());x.phraseWrong=(x.phraseWrong||0)+1;x.phraseLast='wrong';x.guidedRecallLastFailMode=mode;save()}catch(_e){}
    if(mode==='learn'){fb.innerHTML='<div class="gf-feedback bad"><b>Not an exact copy yet.</b> Compare with the visible sentence and copy it exactly.</div>';return}
    const next=mode==='exact'?'initials':mode==='initials'?'gaps':'learn';const label=next==='initials'?'First-letter cues':next==='gaps'?'Fill in the blanks':'Learn — exact copy';memMode=next;memNotice=`Not correct yet — support increased automatically to ${label}.`;render();if(next==='learn')speak(e.phrase);setTimeout(()=>$('gfRecall')?.focus(),40);
  }

  function candidate(){const q=String($('appQuestion')?.textContent||'').trim(),note=String($('variantNote')?.textContent||'').trim(),key=norm(q);const explain=/\b(explain|why|give\s+(?:a\s+)?reason)\b/i.test(q);return{q,note,key,explain,recall:/recall/i.test(note)}}
  async function chooseApplication(i){
    const fresh=$('freshAppBtn'),found=new Map();for(let n=0;n<10;n++){const c=candidate();if(c.q&&!found.has(c.key))found.set(c.key,c);fresh?.click();await sleep(25)}
    let pool=[...found.values()];const nonRecall=pool.filter(c=>!c.recall);if(nonRecall.length)pool=nonRecall;if(!pool.length)return candidate();
    const x=rec(i),history=Array.isArray(x.guidedAppHistory)?x.guidedAppHistory:[],first=history.length===0;let target;
    if(first)target=pool.find(c=>c.explain)||pool[0];
    else{const unseen=pool.filter(c=>!history.includes(c.key));target=unseen[0]||pool.slice().sort((a,b)=>history.indexOf(a.key)-history.indexOf(b.key))[0]}
    for(let n=0;n<12;n++){const c=candidate();if(c.key===target.key)break;fresh?.click();await sleep(25)}
    const chosen=candidate(),h=history.filter(k=>k!==chosen.key);h.push(chosen.key);x.guidedAppHistory=h.slice(-30);x.guidedLastAppQuestion=chosen.key;save();return chosen;
  }
  async function prepareApp(){stage='app';appPreparedFor=-1;lastChosen=null;render();const i=current();try{$('appTab')?.click();const ready=await waitFor(()=>$('aiMarkBtn')&&$('freshAppBtn')&&$('variantNote')&&$('appLiteTip'));if(!ready)throw new Error('Application tools are still loading.');lastChosen=await chooseApplication(i);appPreparedFor=i;render();setTimeout(()=>$('gfAppAnswer')?.focus(),40)}catch(err){$('gfBody').innerHTML=`<div class="gf-feedback bad">Could not prepare the Application question yet.<br><small>${esc(err.message||err)}</small></div><div class="gf-actions"><button id="gfRetryApp" class="gf-btn gf-primary">Try again</button></div>`;$('gfRetryApp').onclick=prepareApp}}
  function renderApp(){const b=$('gfBody'),e=concept();if(appPreparedFor!==current()){b.innerHTML=`<div class="gf-loading"><div><div class="gf-spinner"></div>Preparing one Application question for <b>${esc(e.topic)}</b>…</div></div>`;return}const q=String($('appQuestion')?.textContent||e.applicationQuestion||'').trim(),tip=$('appLiteTip')?.innerHTML||'Read the command word first and answer only what is asked.',frame=$('appPane')?.querySelector('.frame')?.innerHTML||'',firstNote=(rec(current()).guidedAppHistory||[]).length===1&&lastChosen?.explain?'<div class="gf-feedback info" style="margin:0 0 12px"><b>First Application round:</b> practise D/E → S/R → L/R where this Explain/Why question requires them.</div>':'';b.innerHTML=pills(e)+firstNote+`<div class="gf-guide">${tip}</div><div class="gf-prompt" style="text-align:left;font-size:clamp(24px,3.5vw,34px);margin:22px 0">${esc(q)}</div>${frame?`<div class="gf-guide">${frame}</div>`:''}<textarea id="gfAppAnswer" class="gf-textarea" spellcheck="false" placeholder="Write your PSLE Science answer..."></textarea><div class="gf-actions"><button id="gfMarkApp" class="gf-btn gf-primary">🤖 Check my answer</button></div><div id="gfAppFeedback"></div>`;$('gfMarkApp').onclick=markApp}
  async function markApp(){const u=$('gfAppAnswer').value.trim(),fb=$('gfAppFeedback'),btn=$('gfMarkApp');if(!u){fb.innerHTML='<div class="gf-feedback info">Write your answer first.</div>';return}const hidden=$('appAnswer'),ai=$('aiMarkBtn');if(!hidden||!ai){fb.innerHTML='<div class="gf-feedback bad">AI marker is still loading. Try again shortly.</div>';return}hidden.value=u;hidden.dispatchEvent(new Event('input',{bubbles:true}));let before=0;try{before=rec(current()).appAttempts||0}catch(_e){}btn.disabled=true;btn.textContent='🤖 Checking…';fb.innerHTML='<div class="gf-feedback info">AI is checking the Science and command word…</div>';ai.click();const done=await waitFor(()=>{try{return (rec(current()).appAttempts||0)>before||(!ai.disabled&&String($('aiStatus')?.textContent||'').includes('unavailable'))}catch(_e){return false}},35000);btn.disabled=false;btn.textContent='🤖 Check my answer';if(!done){fb.innerHTML='<div class="gf-feedback bad">The AI marker took too long. Please try again.</div>';return}const source=$('appFeedback'),text=source?source.textContent.trim():'Answer checked.';let correct=false;try{correct=rec(current()).appLast==='correct'}catch(_e){}if(correct){try{const x=rec(current());x.guidedCycleCompletedAt=Date.now();x.guidedCycles=(x.guidedCycles||0)+1;save()}catch(_e){}fb.innerHTML=`<div class="gf-feedback good">${esc(text||'✅ Correct')}<br><b>Cycle complete — this concept is now Known.</b> One Application question is enough.</div><div class="gf-actions"><button id="gfNextConcept" class="gf-btn gf-next">Next concept →</button></div>`;$('gfNextConcept').onclick=advance}else fb.innerHTML=`<div class="gf-feedback bad">${esc(text||'Not correct yet.')}<br>Repair this same question and try again. The concept remains Not done until this Application question is correct.</div>`}
  function advance(){const old=Array.isArray(order)?order.slice():[],oldPos=Number(pos)||0,cur=current(),avail=matches();resetCycle();empty=!avail.length;if(empty){order=[];pos=0;render();return}let nextIdx=null;for(let n=1;n<=old.length;n++){const v=old[(oldPos+n)%old.length];if(v!==cur&&avail.includes(v)){nextIdx=v;break}}if(nextIdx==null)nextIdx=avail.find(v=>v!==cur)??avail[0];order=avail;pos=Math.max(0,avail.indexOf(nextIdx));render();speak(`${concept().topic}. ${concept().phrasePrompt}`)}

  let timer=null;$('gfSearch').addEventListener('input',e=>{picker.search=e.target.value;clearTimeout(timer);timer=setTimeout(()=>applyPicker(false),120)});$('gfTopic').addEventListener('change',e=>{picker.topic=e.target.value;applyPicker(false)});$('gfStatus').addEventListener('change',e=>{picker.status=e.target.value;applyPicker(false)});$('gfSort').addEventListener('change',e=>{picker.sort=e.target.value;applyPicker(true)});$('gfClassic').onclick=()=>{classic=!classic;document.body.classList.toggle('gf-classic',classic);$('gfClassic').textContent=classic?'Return to guided flow':'More practice options';if(!classic)render()};

  syncPicker();order=matches();pos=0;empty=!order.length;document.body.classList.add('gf-on');render();if(!empty)setTimeout(()=>speak(`${concept().topic}. ${concept().phrasePrompt}`),220);
}
boot();
})();