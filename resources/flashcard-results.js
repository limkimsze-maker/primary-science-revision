(()=>{
let tries=0;
function start(){
 tries++;
 if(typeof BANK==='undefined'||!Array.isArray(BANK)||!BANK.length||typeof rec!=='function'||typeof save!=='function'||!document.getElementById('flashcardPanel')||!document.getElementById('fcCard')){
  if(tries<160)setTimeout(start,100);
  return;
 }
 if(window.PSLE_FLASHCARD_RESULTS?.installed)return;
 const $=id=>document.getElementById(id);
 const card=$('fcCard'),tools=document.querySelector('#flashcardPanel .fc-tools'),nav=document.querySelector('#flashcardPanel .fc-nav');
 if(!card||!tools||!nav)return;
 let reviewList=[],reviewPos=0,savedSearch='',programmatic=false;
 const resultOf=i=>{const v=rec(i)?.flashcardResult;return v==='right'||v==='wrong'?v:''};
 const state=i=>{try{return typeof priority==='function'?priority(i):'amber'}catch(_e){return'amber'}};
 function currentIndex(){const n=Number(card.dataset.cardIndex);return Number.isInteger(n)&&n>=0?n:null}
 function activeFilter(){return $('fcResultFilter')?.value||'all'}
 function baseEligible(qOverride){
  const cat=$('fcCategory')?.value||'all',pri=$('fcPriority')?.value||'all';
  const q=String(qOverride??$('fcSearch')?.value??'').trim().toLowerCase();
  return [...Array(BANK.length).keys()].filter(i=>{
   const e=BANK[i];
   if(cat!=='all'&&e.category!==cat)return false;
   if(pri!=='all'&&state(i)!==pri)return false;
   if(q&&!`${e.id} ${e.topic} ${e.category} ${e.phrasePrompt} ${e.phrase}`.toLowerCase().includes(q))return false;
   return true;
  });
 }
 function filterList(){
  const f=activeFilter(),base=baseEligible(f==='all'?undefined:savedSearch);
  if(f==='all')return base;
  if(f==='unmarked')return base.filter(i=>!resultOf(i));
  return base.filter(i=>resultOf(i)===f);
 }
 function updateFilterCounts(){
  const f=activeFilter(),base=baseEligible(f==='all'?undefined:savedSearch);
  const c={right:0,wrong:0,unmarked:0};
  base.forEach(i=>{const r=resultOf(i);if(r)c[r]++;else c.unmarked++});
  const sel=$('fcResultFilter');if(!sel)return;
  const labels={all:`All results (${base.length})`,wrong:`✕ Wrong (${c.wrong})`,right:`✓ Right (${c.right})`,unmarked:`Unmarked (${c.unmarked})`};
  [...sel.options].forEach(o=>{if(labels[o.value])o.textContent=labels[o.value]});
  const s=$('fcResultSummary');if(s)s.textContent=`✓ ${c.right} right · ✕ ${c.wrong} wrong · ${c.unmarked} unmarked`;
 }
 function updateCurrent(){
  const i=currentIndex(),badge=$('fcSelfBadge'),status=$('fcResultStatus'),right=$('fcMarkRight'),wrong=$('fcMarkWrong');
  if(i==null)return;
  const r=resultOf(i);
  if(badge){badge.textContent=r==='right'?'✓ Right':r==='wrong'?'✕ Wrong':'Not marked';badge.className='fc-self-badge '+(r||'unmarked')}
  if(status){status.textContent=r==='right'?'✓ You marked this card Right':r==='wrong'?'✕ You marked this card Wrong':'Not marked yet';status.className='fc-result-status '+(r||'unmarked')}
  if(right)right.classList.toggle('selected',r==='right');
  if(wrong)wrong.classList.toggle('selected',r==='wrong');
  updateFilterCounts();
  if(activeFilter()!=='all'){
   const k=reviewList.indexOf(i);if(k>=0)reviewPos=k;
   const counter=$('fcResultReviewCounter');if(counter)counter.textContent=reviewList.length?`${reviewPos+1} / ${reviewList.length} in ${activeFilter()} review`:`0 cards in ${activeFilter()} review`;
  }else{const counter=$('fcResultReviewCounter');if(counter)counter.textContent=''}
 }
 function setProgrammaticSearch(value){
  const s=$('fcSearch');if(!s)return;
  programmatic=true;s.value=value;s.dispatchEvent(new Event('input',{bubbles:true}));programmatic=false;
 }
 function showReviewCard(){
  const empty=$('fcResultEmpty');
  if(!reviewList.length){
   if(empty){empty.classList.remove('hide');empty.textContent=`No ${activeFilter()} flashcards match the current category/study filters.`}
   setProgrammaticSearch('__no_flashcard_result_match__');
   const counter=$('fcResultReviewCounter');if(counter)counter.textContent=`0 cards in ${activeFilter()} review`;
   return;
  }
  if(empty)empty.classList.add('hide');
  reviewPos=(reviewPos+reviewList.length)%reviewList.length;
  const i=reviewList[reviewPos],e=BANK[i];
  setProgrammaticSearch(`${e.id} ${e.topic}`);
  setTimeout(()=>{const counter=$('fcResultReviewCounter');if(counter)counter.textContent=`${reviewPos+1} / ${reviewList.length} in ${activeFilter()} review`;updateCurrent()},0);
 }
 function refreshReview(preferCurrent=true){
  if(activeFilter()==='all')return;
  const cur=currentIndex();reviewList=filterList();
  if(preferCurrent&&cur!=null){const k=reviewList.indexOf(cur);reviewPos=k>=0?k:Math.min(reviewPos,Math.max(0,reviewList.length-1))}
  else reviewPos=Math.min(reviewPos,Math.max(0,reviewList.length-1));
  showReviewCard();
 }
 function changeFilter(){
  const f=activeFilter(),search=$('fcSearch');
  if(f==='all'){
   if(search){search.disabled=false;search.placeholder='Search topic or explanation…'}
   const empty=$('fcResultEmpty');if(empty)empty.classList.add('hide');
   setProgrammaticSearch(savedSearch);
   reviewList=[];reviewPos=0;
   updateCurrent();
   return;
  }
  savedSearch=search?.value||savedSearch||'';
  if(search){search.disabled=true;search.placeholder='Search paused during Right/Wrong review'}
  reviewPos=0;refreshReview(false);updateFilterCounts();
 }
 function setResult(value){
  const i=currentIndex();if(i==null)return;
  const x=rec(i);x.flashcardResult=value;x.flashcardResultAt=Date.now();save();
  const f=activeFilter();
  if(f!=='all'&&((f==='right'&&value!=='right')||(f==='wrong'&&value!=='wrong')||(f==='unmarked'))){
   const oldPos=reviewPos;reviewList=filterList();reviewPos=Math.min(oldPos,Math.max(0,reviewList.length-1));showReviewCard();
  }else updateCurrent();
 }
 function moveReview(d){
  if(activeFilter()==='all'||!reviewList.length)return false;
  reviewPos=(reviewPos+d+reviewList.length)%reviewList.length;showReviewCard();return true;
 }
 const filterWrap=document.createElement('label');filterWrap.innerHTML='Flashcard result<select id="fcResultFilter"><option value="all">All results</option><option value="wrong">✕ Wrong</option><option value="right">✓ Right</option><option value="unmarked">Unmarked</option></select>';
 const summary=document.createElement('span');summary.id='fcResultSummary';summary.className='fc-result-summary';
 tools.appendChild(filterWrap);tools.appendChild(summary);
 const row=document.createElement('div');row.className='fc-result-row';row.innerHTML='<button type="button" id="fcMarkWrong" class="fc-mark wrong">✕ Wrong</button><span id="fcResultStatus" class="fc-result-status unmarked">Not marked yet</span><button type="button" id="fcMarkRight" class="fc-mark right">✓ Right</button>';
 nav.insertAdjacentElement('beforebegin',row);
 const reviewCounter=document.createElement('div');reviewCounter.id='fcResultReviewCounter';reviewCounter.className='fc-result-review-counter';row.insertAdjacentElement('afterend',reviewCounter);
 const empty=document.createElement('div');empty.id='fcResultEmpty';empty.className='fc-result-empty hide';reviewCounter.insertAdjacentElement('afterend',empty);
 const meta=card.querySelector('.fc-meta');if(meta){const b=document.createElement('span');b.id='fcSelfBadge';b.className='fc-self-badge unmarked';b.textContent='Not marked';meta.appendChild(b)}
 const style=document.createElement('style');style.textContent=`
 .fc-result-summary{font-size:12px;font-weight:800;color:#475569;padding:10px 2px;align-self:center}
 .fc-result-row{display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0 2px}
 .fc-mark{min-width:150px;font-size:18px;font-weight:900;border-width:2px!important}
 .fc-mark.wrong{background:#fff1f2;color:#991b1b;border-color:#fecaca}.fc-mark.wrong.selected{background:#991b1b;color:#fff;border-color:#991b1b;box-shadow:0 0 0 3px #fecdd3}
 .fc-mark.right{background:#ecfdf5;color:#166534;border-color:#bbf7d0}.fc-mark.right.selected{background:#166534;color:#fff;border-color:#166534;box-shadow:0 0 0 3px #bbf7d0}
 .fc-result-status{min-width:210px;text-align:center;font-weight:900;padding:9px 12px;border-radius:999px;font-size:13px}.fc-result-status.unmarked{background:#f8fafc;color:#64748b}.fc-result-status.right{background:#dcfce7;color:#166534}.fc-result-status.wrong{background:#fee2e2;color:#991b1b}
 .fc-self-badge{padding:5px 8px;border-radius:999px;font-weight:900}.fc-self-badge.unmarked{background:#f8fafc;color:#64748b}.fc-self-badge.right{background:#dcfce7;color:#166534}.fc-self-badge.wrong{background:#fee2e2;color:#991b1b}
 .fc-result-review-counter{text-align:center;font-size:13px;font-weight:900;color:#4338ca;margin:7px 0}
 .fc-result-empty{margin:10px auto;padding:14px;border-radius:13px;border:1px solid #fde68a;background:#fffbeb;color:#92400e;text-align:center;font-weight:800;max-width:720px}
 @media(max-width:650px){.fc-result-row .fc-mark{flex:1 1 40%;min-width:0}.fc-result-status{order:-1;width:100%}.fc-result-summary{width:100%;text-align:center}}
 `;document.head.appendChild(style);
 $('fcMarkRight').onclick=e=>{e.preventDefault();e.stopPropagation();setResult('right')};
 $('fcMarkWrong').onclick=e=>{e.preventDefault();e.stopPropagation();setResult('wrong')};
 $('fcResultFilter').onchange=changeFilter;
 $('fcCategory')?.addEventListener('change',()=>{if(activeFilter()!=='all')setTimeout(()=>refreshReview(false),0);else setTimeout(updateFilterCounts,0)});
 $('fcPriority')?.addEventListener('change',()=>{if(activeFilter()!=='all')setTimeout(()=>refreshReview(false),0);else setTimeout(updateFilterCounts,0)});
 $('fcSearch')?.addEventListener('input',()=>{if(!programmatic&&activeFilter()==='all'){savedSearch=$('fcSearch').value;setTimeout(updateFilterCounts,0)}});
 $('fcNext')?.addEventListener('click',e=>{if(activeFilter()!=='all'){e.preventDefault();e.stopImmediatePropagation();moveReview(1)}},true);
 $('fcPrev')?.addEventListener('click',e=>{if(activeFilter()!=='all'){e.preventDefault();e.stopImmediatePropagation();moveReview(-1)}},true);
 $('fcCard')?.addEventListener('click',e=>{if(activeFilter()!=='all'&&card.dataset.side==='answer'){e.preventDefault();e.stopImmediatePropagation();moveReview(1)}},true);
 $('fcFlip')?.addEventListener('click',e=>{if(activeFilter()!=='all'&&card.dataset.side==='answer'){e.preventDefault();e.stopImmediatePropagation();moveReview(1)}},true);
 const obs=new MutationObserver(()=>setTimeout(updateCurrent,0));obs.observe(card,{attributes:true,attributeFilter:['data-card-index','data-side']});
 savedSearch=$('fcSearch')?.value||'';updateCurrent();
 window.PSLE_FLASHCARD_RESULTS={installed:true,resultOf,setResult,refresh:updateCurrent};
}
start();
})();
