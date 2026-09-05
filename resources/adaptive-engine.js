(()=>{
let tries=0;
function start(){
  tries++;
  if(typeof BANK==='undefined'||typeof rec!=='function'||typeof save!=='function'||typeof current!=='function'||typeof render!=='function'||typeof buildQueue!=='function'||typeof next!=='function'||typeof rateApp!=='function'||typeof checkPhrase!=='function'){
    if(tries<160)setTimeout(start,100);
    return;
  }
  if(window.PSLE_ADAPTIVE?.installed)return;

  const DAY=86400000;
  const HOUR=3600000;
  const RECALL_INTERVALS=[0,1,3,7,14,30];
  const APP_INTERVALS=[0,1,3,7,14,30];
  const recent=[];
  const $id=id=>document.getElementById(id);
  const dayKey=()=>typeof today==='function'?today():new Date().toISOString().slice(0,10);
  const unique=a=>new Set(Array.isArray(a)?a:[]).size;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const esc2=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function meta(i){
    const x=rec(i);
    if(!x.adaptive||typeof x.adaptive!=='object')x.adaptive={};
    const a=x.adaptive;
    if(!Number.isFinite(a.recallStage))a.recallStage=clamp(unique(x.phraseDates),0,RECALL_INTERVALS.length-1);
    if(!Number.isFinite(a.appStage))a.appStage=clamp(unique(x.appCorrectDates),0,APP_INTERVALS.length-1);
    if(typeof a.lastRecallSuccess!=='string')a.lastRecallSuccess=(Array.isArray(x.phraseDates)&&x.phraseDates.length?x.phraseDates.slice().sort().at(-1):'');
    if(typeof a.lastAppSuccess!=='string')a.lastAppSuccess=(Array.isArray(x.appCorrectDates)&&x.appCorrectDates.length?x.appCorrectDates.slice().sort().at(-1):'');
    if(!Number.isFinite(a.recallDue))a.recallDue=Number(x.due||0)||0;
    if(!Number.isFinite(a.appDue)){
      if(a.lastAppSuccess){const t=new Date(a.lastAppSuccess+'T12:00:00').getTime();a.appDue=Number.isFinite(t)?t+APP_INTERVALS[a.appStage]*DAY:0}else a.appDue=0;
    }
    if(!Array.isArray(a.history))a.history=[];
    if(a.pending===undefined)a.pending=null;
    return a;
  }

  function hasHistory(i){
    const x=rec(i),a=meta(i);
    return unique(x.phraseDates)>0||unique(x.appCorrectDates)>0||(x.phraseWrong||0)>0||(x.appAttempts||0)>0||a.history.length>0;
  }
  function isDue(i,now=Date.now()){
    const a=meta(i);
    return (a.recallDue>0&&a.recallDue<=now)||(a.appDue>0&&a.appDue<=now);
  }
  function earliestDue(i){
    const a=meta(i),ds=[a.recallDue,a.appDue].filter(v=>v>0);
    return ds.length?Math.min(...ds):0;
  }
  function unresolved(i){return !!meta(i).pending;}
  function remember(i){
    recent.unshift(i);
    while(recent.length>8)recent.pop();
  }
  function categoryEligible(i){
    const c=$id('categoryMode')?.value||'all';
    return c==='all'||BANK[i].category===c;
  }
  function weakness(i){
    const x=rec(i);
    let w=0;
    if(typeof priority==='function'&&priority(i)==='red')w+=5;
    if(['de','sr','lr','concept'].includes(x.appLast))w+=4;
    if(x.phraseLast==='wrong')w+=3;
    if(!phraseIsSecure(i))w+=2;
    if(!appIsSecure(i))w+=2;
    return w;
  }
  function score(i,now=Date.now()){
    const x=rec(i),a=meta(i);
    let s=0;
    if(a.pending)s+=1400;
    const d=earliestDue(i);
    if(d&&d<=now)s+=900+Math.min(220,Math.floor((now-d)/DAY)*18);
    const p=typeof priority==='function'?priority(i):'amber';
    if(p==='red')s+=430;
    if(['de','sr','lr','concept'].includes(x.appLast))s+=260;
    if(x.phraseLast==='wrong')s+=220;
    if(!appIsSecure(i))s+=130;
    if(!phraseIsSecure(i))s+=110;
    if(!hasHistory(i))s+=75;
    if(p==='green'&&!isDue(i,now)&&!a.pending)s-=240;
    const rp=recent.indexOf(i);
    if(rp===0)s-=1000;else if(rp===1)s-=520;else if(rp>=2)s-=160;
    return s;
  }
  function reason(i,now=Date.now()){
    const x=rec(i),a=meta(i),d=earliestDue(i);
    if(a.pending){
      const r=a.pending.reason;
      return r==='de'?'repair D/E evidence':r==='sr'?'repair Science reasoning':r==='lr'?'repair the link/result':r==='concept'?'relearn the Science concept':'repair exact recall';
    }
    if(d&&d<=now)return 'spaced review is due';
    if(['de','sr','lr','concept'].includes(x.appLast))return 'previous application error';
    if(x.phraseLast==='wrong')return 'previous exact-recall error';
    if(typeof priority==='function'&&priority(i)==='red')return 'Focus concept';
    if(!appIsSecure(i)&&unique(x.appCorrectDates)>0)return 'application needs another-day success';
    if(!phraseIsSecure(i)&&unique(x.phraseDates)>0)return 'exact recall needs another-day success';
    if(!hasHistory(i))return 'new concept';
    return 'mastery-strengthening review';
  }
  function ranked(exclude){
    const now=Date.now();
    return [...Array(BANK.length).keys()]
      .filter(i=>categoryEligible(i)&&i!==exclude)
      .map(i=>({i,s:score(i,now),j:Math.random()*8}))
      .sort((a,b)=>b.s-a.s||b.j-a.j)
      .map(o=>o.i);
  }
  function adaptiveQueue(limit=20){
    const ids=ranked(null).slice(0,limit);
    return ids.length?ids:[...Array(BANK.length).keys()].filter(categoryEligible).slice(0,limit);
  }
  function pickNext(){return ranked(current())[0]??current();}

  function scheduleSuccess(i,channel){
    const a=meta(i),d=dayKey(),now=Date.now();
    const lastKey=channel==='recall'?'lastRecallSuccess':'lastAppSuccess';
    const stageKey=channel==='recall'?'recallStage':'appStage';
    const dueKey=channel==='recall'?'recallDue':'appDue';
    const intervals=channel==='recall'?RECALL_INTERVALS:APP_INTERVALS;
    if(a[lastKey]!==d){a[stageKey]=clamp((Number(a[stageKey])||0)+1,1,intervals.length-1);a[lastKey]=d;}
    a[dueKey]=now+intervals[a[stageKey]]*DAY;
    a.lastOutcome=`${channel}:correct`;
    a.history.unshift({at:now,channel,outcome:'correct',stage:a[stageKey]});
    a.history=a.history.slice(0,40);
    if(channel==='app')a.pending=null;
    else if(a.pending?.reason==='phrase')a.pending=null;
    save();
  }
  function scheduleFailure(i,channel,why){
    const a=meta(i),now=Date.now();
    const stageKey=channel==='recall'?'recallStage':'appStage';
    const dueKey=channel==='recall'?'recallDue':'appDue';
    a[stageKey]=Math.max(0,(Number(a[stageKey])||0)-1);
    a[dueKey]=now+(channel==='recall'?3*HOUR:6*HOUR);
    a.lastOutcome=`${channel}:${why}`;
    a.pending={channel,reason:why,at:now};
    a.history.unshift({at:now,channel,outcome:why,stage:a[stageKey]});
    a.history=a.history.slice(0,40);
    save();
  }

  function dueText(ts){
    if(!ts)return 'not scheduled yet';
    const diff=ts-Date.now();
    if(diff<=0)return 'due now';
    if(diff<DAY)return `in ${Math.max(1,Math.round(diff/HOUR))} h`;
    return `in ${Math.max(1,Math.round(diff/DAY))} day${Math.round(diff/DAY)===1?'':'s'}`;
  }
  function counts(){
    const now=Date.now();let due=0,repair=0,weak=0;
    for(let i=0;i<BANK.length;i++){
      if(isDue(i,now))due++;
      if(unresolved(i))repair++;
      if(weakness(i)>=5)weak++;
    }
    return {due,repair,weak};
  }

  function installUI(){
    const qm=$id('queueMode');
    if(qm&&!qm.querySelector('option[value="adaptive"]')){
      const o=document.createElement('option');o.value='adaptive';o.textContent='🧠 Adaptive Tutor — due + weak + new';qm.insertBefore(o,qm.firstChild);qm.value='adaptive';
    }
    if(!$id('adaptiveTutorBar')){
      const controls=qm?.closest('.controls');
      if(controls){
        const bar=document.createElement('div');
        bar.id='adaptiveTutorBar';
        bar.style.cssText='margin:9px 0 14px;padding:11px 13px;border:1px solid #c7d2fe;background:#eef2ff;border-radius:13px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap';
        bar.innerHTML='<div><b>🧠 Adaptive Tutor</b><div id="adaptiveReason" class="small" style="margin-top:3px">Chooses what to practise next from due reviews, weak concepts and new learning.</div></div><div id="adaptiveCounts" class="small" style="font-weight:700"></div>';
        controls.insertAdjacentElement('afterend',bar);
      }
    }
    if(!$id('adaptiveRepairApp')){
      const fb=$id('appFeedback');if(fb){const d=document.createElement('div');d.id='adaptiveRepairApp';d.className='hide';fb.insertAdjacentElement('beforebegin',d);}
    }
    if(!$id('adaptiveRepairPhrase')){
      const fb=$id('phraseFeedback');if(fb){const d=document.createElement('div');d.id='adaptiveRepairPhrase';d.className='hide';fb.insertAdjacentElement('beforebegin',d);}
    }
  }

  function repairHtml(i,why,channel){
    const e=BANK[i],core=esc2(e.phrase||e.modelApplicationAnswer||'');
    const base='margin-top:12px;padding:13px;border-radius:13px;border:1px solid #f59e0b;background:#fffbeb;line-height:1.5';
    if(channel==='recall')return `<div style="${base}"><b>🛠 Automatic repair: exact recall</b><br><span class="small">The tutor has shortened the review interval and queued this concept again.</span><ol><li>Study the target idea once.</li><li>Practise with gaps or first-letter cues.</li><li>Return to Exact recall.</li></ol><div class="actions"><button type="button" data-adapt-act="gaps">Practise with gaps</button><button type="button" data-adapt-act="exact">Retry exact recall</button></div></div>`;
    let title='',body='';
    if(why==='de'){
      title='D/E — evidence is missing';
      body='<ol><li>Find the observation, comparison or changed variable in the question.</li><li>State that evidence explicitly.</li><li>Then add the Science reasoning only if the command word requires an explanation.</li></ol>';
    }else if(why==='sr'){
      title='S/R — Science reasoning needs repair';
      body=`<ol><li>Recall the Science core below.</li><li>Use it to explain <i>why</i> the evidence happened.</li><li>Do not merely repeat the data.</li></ol><div class="model"><b>Science core</b><br>${core}</div>`;
    }else if(why==='lr'){
      title='L/R — link back to the question is missing';
      body='<ol><li>Read the command word again.</li><li>Write one final sentence that directly answers what was asked.</li><li>Avoid adding a new Science idea at the end.</li></ol>';
    }else{
      title='Concept knowledge needs repair';
      body=`<ol><li>Relearn the book-backed target sentence.</li><li>Reconstruct it from memory.</li><li>Then return to the same application question.</li></ol><div class="model"><b>Target Science idea</b><br>${core}</div>`;
    }
    return `<div style="${base}"><b>🛠 Automatic repair: ${title}</b><br><span class="small">This concept is now prioritised for another review.</span>${body}<div class="actions"><button type="button" data-adapt-act="relearn">Relearn concept</button><button type="button" data-adapt-act="retryapp">Retry same application</button></div></div>`;
  }

  function bindRepair(container,i,why,channel){
    container.querySelectorAll('[data-adapt-act]').forEach(b=>b.onclick=()=>{
      const act=b.dataset.adaptAct;
      if(act==='gaps'||act==='exact'){
        setPane('phrase');
        const pm=$id('phraseMode');if(pm)pm.value=act==='gaps'?'gaps':'exact';
        render();$id('phraseAnswer')?.focus();
      }else if(act==='relearn'){
        setPane('phrase');
        const pm=$id('phraseMode');if(pm)pm.value='learn';
        render();$id('phraseAnswer')?.focus();
      }else if(act==='retryapp'){
        setPane('app');
        if($id('appAnswer'))$id('appAnswer').value='';
        if($id('appFeedback'))$id('appFeedback').className='fb hide';
        $id('appAnswer')?.focus();
      }
    });
  }
  function showRepair(i,why,channel){
    const id=channel==='recall'?'adaptiveRepairPhrase':'adaptiveRepairApp';
    const box=$id(id);if(!box)return;
    box.innerHTML=repairHtml(i,why,channel);box.classList.remove('hide');bindRepair(box,i,why,channel);
  }
  function hideRepairs(){['adaptiveRepairPhrase','adaptiveRepairApp'].forEach(id=>{const b=$id(id);if(b){b.classList.add('hide');b.innerHTML='';}});}
  function restorePending(){
    hideRepairs();
    const i=current(),p=meta(i).pending;
    if(p)showRepair(i,p.reason,p.channel);
  }
  function updateUI(){
    installUI();
    const c=counts(),i=current(),a=meta(i),d=earliestDue(i);
    const cnt=$id('adaptiveCounts');if(cnt)cnt.textContent=`${c.due} due now · ${c.repair} repair · ${c.weak} weak`;
    const why=$id('adaptiveReason');
    if(why){
      const adaptive=$id('queueMode')?.value==='adaptive';
      why.innerHTML=adaptive?`Current #${esc2(BANK[i].id)}: <b>${esc2(reason(i))}</b> · next review ${esc2(dueText(d))}`:'Adaptive scheduling continues in the background. Choose “Adaptive Tutor” to let it select the next concept.';
    }
  }

  const baseBuildQueue=buildQueue;
  buildQueue=function(){
    if($id('queueMode')?.value!=='adaptive')return baseBuildQueue.apply(this,arguments);
    order=adaptiveQueue(20);pos=0;
    const qn=$id('queueNote');if(qn)qn.textContent=`${order.length} adaptively selected concepts · due reviews first`;
    render();updateUI();
  };

  const baseNext=next;
  next=function(){
    if($id('queueMode')?.value!=='adaptive')return baseNext.apply(this,arguments);
    const old=current();remember(old);
    const chosen=pickNext();
    const rest=ranked(chosen).slice(0,19);
    order=[chosen,...rest];pos=0;
    render();
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const baseRateApp=rateApp;
  rateApp=function(rate){
    const i=current();meta(i);
    const out=baseRateApp.apply(this,arguments);
    if(rate==='correct'){
      scheduleSuccess(i,'app');
      const b=$id('adaptiveRepairApp');if(b){b.classList.add('hide');b.innerHTML='';}
    }else if(['de','sr','lr','concept'].includes(rate)){
      scheduleFailure(i,'app',rate);
      showRepair(i,rate,'app');
    }
    updateUI();
    return out;
  };

  const baseCheckPhrase=checkPhrase;
  checkPhrase=function(){
    const i=current(),pm=$id('phraseMode')?.value||'',ans=$id('phraseAnswer')?.value||'';meta(i);
    const attempted=String(ans).trim().length>0;
    const exact=attempted&&typeof norm==='function'&&norm(ans)===norm(BANK[i].phrase);
    const out=baseCheckPhrase.apply(this,arguments);
    if(pm==='exact'&&attempted){
      if(exact){scheduleSuccess(i,'recall');const b=$id('adaptiveRepairPhrase');if(b){b.classList.add('hide');b.innerHTML='';}}
      else{scheduleFailure(i,'recall','phrase');showRepair(i,'phrase','recall');}
      updateUI();
    }
    return out;
  };

  const baseRender=render;
  render=function(){
    const out=baseRender.apply(this,arguments);
    setTimeout(()=>{updateUI();restorePending();},0);
    return out;
  };

  if($id('buildQueue'))$id('buildQueue').onclick=buildQueue;
  if($id('categoryMode'))$id('categoryMode').onchange=buildQueue;
  if($id('nextPhrase'))$id('nextPhrase').onclick=next;
  if($id('nextApp'))$id('nextApp').onclick=next;
  if($id('checkPhrase'))$id('checkPhrase').onclick=checkPhrase;
  document.querySelectorAll('button[data-rate]').forEach(b=>b.onclick=()=>rateApp(b.dataset.rate));

  window.PSLE_ADAPTIVE={installed:true,score,reason,isDue,meta,buildQueue:()=>buildQueue(),next:()=>next()};
  installUI();
  save();
  buildQueue();
}
start();
})();
