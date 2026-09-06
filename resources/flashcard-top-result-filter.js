(()=>{
let tries=0;
function install(){
  tries++;
  const panel=document.getElementById('flashcardPanel');
  const head=panel?.querySelector('.fc-head');
  const chips=document.getElementById('fcChips');
  const sel=document.getElementById('fcResultFilter');
  const card=document.getElementById('fcCard');
  const flip=document.getElementById('fcFlip');
  const prev=document.getElementById('fcPrev');
  const next=document.getElementById('fcNext');
  const reviewCounter=document.getElementById('fcResultReviewCounter');
  if(!panel||!head||!chips||!sel||!card||!flip||!prev||!next||!reviewCounter){
    if(tries<180)setTimeout(install,100);
    return;
  }
  if(document.getElementById('fcTopResultFilter'))return;

  const bar=document.createElement('div');
  bar.id='fcTopResultFilter';
  bar.className='fc-top-result-filter';
  bar.setAttribute('aria-label','Filter flashcards by result');
  bar.innerHTML=`
    <span class="fc-top-filter-title">Review cards:</span>
    <div class="fc-top-filter-buttons" role="group" aria-label="Flashcard result filter">
      <button type="button" data-result="all">All</button>
      <button type="button" data-result="right">✓ Right</button>
      <button type="button" data-result="wrong">✕ Wrong</button>
      <button type="button" data-result="unmarked">○ Unmarked</button>
    </div>`;
  head.insertAdjacentElement('afterend',bar);

  const oldLabel=sel.closest('label');
  if(oldLabel)oldLabel.classList.add('fc-old-result-filter');

  const style=document.createElement('style');
  style.textContent=`
    .fc-top-result-filter{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin:12px 0 4px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:15px;background:#fff}
    .fc-top-filter-title{font-size:13px;font-weight:900;color:#334155}
    .fc-top-filter-buttons{display:flex;gap:7px;flex-wrap:wrap;justify-content:center}
    .fc-top-filter-buttons button{min-height:42px;padding:9px 13px;font-weight:900;border:2px solid #dbe3ee;background:#fff}
    .fc-top-filter-buttons button[data-result="right"]{color:#166534}
    .fc-top-filter-buttons button[data-result="wrong"]{color:#991b1b}
    .fc-top-filter-buttons button[data-result="unmarked"]{color:#475569}
    .fc-top-filter-buttons button.active{border-color:#4338ca;background:#eef2ff;color:#3730a3;box-shadow:0 0 0 2px #c7d2fe}
    .fc-top-filter-buttons button[data-result="right"].active{background:#dcfce7;border-color:#16a34a;color:#166534;box-shadow:0 0 0 2px #bbf7d0}
    .fc-top-filter-buttons button[data-result="wrong"].active{background:#fee2e2;border-color:#dc2626;color:#991b1b;box-shadow:0 0 0 2px #fecaca}
    .fc-top-filter-buttons button[data-result="unmarked"].active{background:#f1f5f9;border-color:#64748b;color:#334155;box-shadow:0 0 0 2px #cbd5e1}
    .fc-old-result-filter{display:none!important}
    @media(max-width:650px){.fc-top-result-filter{align-items:stretch}.fc-top-filter-title{width:100%;text-align:center}.fc-top-filter-buttons{display:grid;grid-template-columns:1fr 1fr;width:100%}.fc-top-filter-buttons button{width:100%}}
  `;
  document.head.appendChild(style);

  const optionCount=value=>{
    const o=[...sel.options].find(x=>x.value===value);
    const m=(o?.textContent||'').match(/\((\d+)\)/);
    return m?Number(m[1]):null;
  };

  function syncTop(){
    const active=sel.value||'all';
    bar.querySelectorAll('[data-result]').forEach(b=>{
      const value=b.dataset.result;
      const count=optionCount(value);
      const base=value==='all'?'All':value==='right'?'✓ Right':value==='wrong'?'✕ Wrong':'○ Unmarked';
      b.textContent=count==null?base:`${base} (${count})`;
      const on=value===active;
      b.classList.toggle('active',on);
      b.setAttribute('aria-pressed',on?'true':'false');
    });
    syncNav();
  }

  function syncNav(){
    if((sel.value||'all')==='all')return;
    const m=(reviewCounter.textContent||'').match(/(\d+)\s*\/\s*(\d+)\s+in\s+/i);
    if(!m)return;
    const p=Number(m[1]),total=Number(m[2]);
    prev.disabled=total===0||p<=1;
    next.disabled=total===0||p>=total;
  }

  bar.querySelectorAll('[data-result]').forEach(b=>b.addEventListener('click',()=>{
    const value=b.dataset.result;
    if(sel.value===value){syncTop();return;}
    sel.value=value;
    sel.dispatchEvent(new Event('change',{bubbles:true}));
    setTimeout(syncTop,0);
    requestAnimationFrame(syncTop);
  }));

  // In a filtered review, tapping an answer must flip back to the SAME question.
  // It must never advance the review list; only Previous / Next may change cards.
  panel.addEventListener('click',e=>{
    if((sel.value||'all')==='all')return;
    const showingAnswer=card.classList.contains('show-back')||card.dataset.side==='answer';
    if(!showingAnswer)return;
    const onCard=e.target===card||card.contains(e.target);
    const onFlip=e.target===flip||flip.contains(e.target);
    if(!onCard&&!onFlip)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if(onFlip&&typeof flip.onclick==='function')flip.onclick.call(flip,e);
    else if(typeof card.onclick==='function')card.onclick.call(card,e);
    setTimeout(syncTop,0);
    requestAnimationFrame(syncTop);
  },true);

  ['fcMarkRight','fcMarkWrong','fcNext','fcPrev'].forEach(id=>{
    document.getElementById(id)?.addEventListener('click',()=>{
      setTimeout(syncTop,0);
      setTimeout(syncTop,40);
    });
  });
  ['fcCategory','fcPriority'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>setTimeout(syncTop,0)));

  const obs=new MutationObserver(()=>{
    setTimeout(syncTop,0);
    requestAnimationFrame(syncTop);
  });
  obs.observe(sel,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['value']});
  obs.observe(reviewCounter,{childList:true,subtree:true,characterData:true});
  obs.observe(card,{attributes:true,attributeFilter:['class','data-card-index','data-side']});
  syncTop();
}
install();
})();
