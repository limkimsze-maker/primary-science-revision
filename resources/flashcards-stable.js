(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let list=[],pos=0,back=false,mode=false,font=42,autoRead=true,speaking=false;

function pstate(i){try{return typeof priority==='function'?priority(i):'amber'}catch(_e){return'amber'}}
function rstate(i){try{return rec(i)?.flashcardResult||''}catch(_e){return''}}
function cats(){return [...new Set(BANK.map(x=>x.category).filter(Boolean))]}
function currentIndex(){return list.length?list[pos]:-1}
function currentCard(){const i=currentIndex();return i>=0?BANK[i]:null}

function filterList(){
 const cat=$('fcCategory')?.value||'all';
 const pri=$('fcPriority')?.value||'all';
 const res=$('fcResultFilter')?.value||'all';
 const q=($('fcSearch')?.value||'').trim().toLowerCase();
 let a=[...Array(BANK.length).keys()];
 if(cat!=='all')a=a.filter(i=>BANK[i].category===cat);
 if(pri!=='all')a=a.filter(i=>pstate(i)===pri);
 if(res!=='all')a=a.filter(i=>res==='unmarked'?!rstate(i):rstate(i)===res);
 if(q)a=a.filter(i=>`${BANK[i].id} ${BANK[i].topic} ${BANK[i].category} ${BANK[i].phrasePrompt} ${BANK[i].phrase}`.toLowerCase().includes(q));
 return a;
}

function resultCounts(){
 let right=0,wrong=0,unmarked=0;
 for(let i=0;i<BANK.length;i++){
  const r=rstate(i);if(r==='right')right++;else if(r==='wrong')wrong++;else unmarked++;
 }
 return{right,wrong,unmarked};
}

function renderTopFilters(){
 const box=$('fcTopFilters');if(!box)return;
 const c=resultCounts(),v=$('fcResultFilter')?.value||'all';
 box.innerHTML=`<button data-r="all" class="${v==='all'?'on':''}">All ${BANK.length}</button><button data-r="right" class="${v==='right'?'on':''}">✓ Right ${c.right}</button><button data-r="wrong" class="${v==='wrong'?'on':''}">✕ Wrong ${c.wrong}</button><button data-r="unmarked" class="${v==='unmarked'?'on':''}">○ Unmarked ${c.unmarked}</button>`;
 box.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{$('fcResultFilter').value=b.dataset.r;rebuild(false,false)});
}

function renderChips(){
 const box=$('fcChips');if(!box)return;const selected=$('fcCategory')?.value||'all';
 box.innerHTML=`<button data-cat="all" class="fc-chip ${selected==='all'?'on':''}">All <b>${BANK.length}</b></button>`+cats().map(c=>`<button data-cat="${esc(c)}" class="fc-chip ${selected===c?'on':''}">${esc(c)} <b>${BANK.filter(x=>x.category===c).length}</b></button>`).join('');
 box.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{$('fcCategory').value=b.dataset.cat;rebuild(false,false)});
}

function resultLabel(r){return r==='right'?'✓ Right':r==='wrong'?'✕ Wrong':'○ Unmarked'}
function stopSpeech(){
 speaking=false;
 try{if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel()}catch(_e){}
 const b=$('fcRead');if(b)b.textContent='🔊 Read';
}
function chooseVoice(){
 try{
  const vs=speechSynthesis.getVoices?.()||[];
  return vs.find(v=>/^en[-_]GB$/i.test(v.lang||''))||vs.find(v=>/^en/i.test(v.lang||''))||null;
 }catch(_e){return null}
}
function visibleSpeechText(){
 const e=currentCard();if(!e)return'';
 return back?String(e.phrase||''):`${e.topic||''}. ${e.phrasePrompt||''}`;
}
function speakVisible(){
 if(!mode||!list.length||typeof speechSynthesis==='undefined'||typeof SpeechSynthesisUtterance==='undefined')return;
 stopSpeech();
 const text=visibleSpeechText().trim();if(!text)return;
 try{
  const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=.86;u.pitch=1;const v=chooseVoice();if(v)u.voice=v;
  u.onstart=()=>{speaking=true;const b=$('fcRead');if(b)b.textContent='⏹ Stop'};
  const done=()=>{speaking=false;const b=$('fcRead');if(b)b.textContent='🔊 Read'};u.onend=done;u.onerror=done;
  speechSynthesis.speak(u);
 }catch(_e){speaking=false}
}
function maybeAutoRead(){if(autoRead)setTimeout(()=>{if(mode)speakVisible()},50)}

function render(){
 const card=$('fcCard'),empty=$('fcEmpty');if(!card||!empty)return;
 $('fcSetCount').textContent=`${list.length} card${list.length===1?'':'s'}`;
 if(!list.length){card.classList.add('hide');empty.classList.remove('hide');$('fcCounter').textContent='0 / 0';renderTopFilters();return}
 card.classList.remove('hide');empty.classList.add('hide');pos=Math.max(0,Math.min(pos,list.length-1));
 const i=list[pos],e=BANK[i],p=pstate(i),r=rstate(i);card.dataset.cardIndex=String(i);card.dataset.side=back?'answer':'question';
 $('fcCounter').textContent=`${pos+1} / ${list.length}`;
 $('fcNumber').textContent=`#${e.id}`;
 $('fcTopic').textContent=e.topic;
 $('fcPrompt').textContent=e.phrasePrompt;
 $('fcAnswer').textContent=e.phrase;
 $('fcSource').textContent=`📘 ${e.bookRef}`;
 $('fcCategoryBadge').textContent=e.category;
 $('fcPriorityBadge').textContent=p==='red'?'🔴 Focus':p==='green'?'🟢 Already Good':'⚪ Not Studied Yet';
 $('fcPriorityBadge').className=`fc-priority ${p}`;
 $('fcResultBadge').textContent=resultLabel(r);$('fcResultBadge').className=`fc-result-badge ${r||'unmarked'}`;
 $('fcFace').textContent=back?'ANSWER':'QUESTION';card.classList.toggle('show-back',back);
 $('fcFlip').textContent=back?'Show Question':'Show Answer';
 $('fcTapHint').textContent=back?'Tap to return to the question. Use Next when ready.':'Try to answer first, then tap to reveal.';
 renderTopFilters();
}

function rebuild(keep=false,read=true){
 stopSpeech();const old=currentIndex();list=filterList();
 if(keep&&old>=0){const n=list.indexOf(old);pos=n>=0?n:0}else pos=0;
 back=false;renderChips();render();if(read)maybeAutoRead();
}
function flip(){if(!list.length)return;stopSpeech();back=!back;render();maybeAutoRead()}
function move(d){if(!list.length)return;const n=pos+d;if(n<0||n>=list.length)return;stopSpeech();pos=n;back=false;render();maybeAutoRead()}
function shuffle(){stopSpeech();for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}pos=0;back=false;render();maybeAutoRead()}
function mark(v){
 const i=currentIndex();if(i<0)return;
 try{const x=rec(i);x.flashcardResult=v;save()}catch(_e){}
 render();
 if($('fcResultFilter').value!=='all')setTimeout(()=>rebuild(true,false),0);
}
function toggleRead(){if(speaking)stopSpeech();else speakVisible()}
function toggleAuto(){autoRead=!autoRead;const b=$('fcAutoRead');if(b)b.textContent=autoRead?'🔊 Auto-read: On':'🔇 Auto-read: Off';if(autoRead)maybeAutoRead();else stopSpeech()}
function setFont(n){font=Math.max(28,Math.min(64,n));$('flashcardPanel').style.setProperty('--fc-font',font+'px');$('fcFont').textContent=font+'px'}
function hideBase(hide){document.querySelectorAll('body>.wrap>.controls,body>.wrap>.stats,body>.wrap>.main-grid').forEach(x=>x.classList.toggle('fc-hide',hide));const lc=$('learningCycle');if(lc)lc.classList.toggle('fc-path-visible',hide)}
function enter(){mode=true;hideBase(true);$('flashcardPanel').classList.remove('hide');document.querySelectorAll('header .tab').forEach(x=>x.classList.remove('active'));$('flashcardTab').classList.add('active');rebuild(true,false);window.scrollTo({top:0,behavior:'smooth'});maybeAutoRead()}
function leave(){if(!mode)return;stopSpeech();mode=false;hideBase(false);$('flashcardPanel').classList.add('hide');$('flashcardTab').classList.remove('active')}

function install(){
 if(typeof BANK==='undefined'||!Array.isArray(BANK)||!BANK.length||typeof rec!=='function'||typeof save!=='function')return false;
 const tabs=document.querySelector('header .tabs'),header=document.querySelector('body>.wrap>header');if(!tabs||!header)return false;if($('flashcardTab'))return true;
 const tab=document.createElement('button');tab.id='flashcardTab';tab.className='tab';tab.textContent='🃏 Flashcards';tabs.insertBefore(tab,tabs.firstChild);
 const panel=document.createElement('section');panel.id='flashcardPanel';panel.className='fc-panel hide';
 panel.innerHTML=`<div class="fc-head"><div><h2>🃏 Explanation Flashcards</h2><p>Try to recall first. The question and answer are read aloud automatically.</p></div><b id="fcSetCount"></b></div><div id="fcTopFilters" class="fc-top-filters"></div><div id="fcChips" class="fc-chips"></div><div class="fc-tools"><label>Category<select id="fcCategory"><option value="all">All categories</option>${cats().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label><label>Priority<select id="fcPriority"><option value="all">All statuses</option><option value="red">🔴 Focus</option><option value="amber">⚪ Not Studied Yet</option><option value="green">🟢 Already Good</option></select></label><select id="fcResultFilter" class="hide"><option value="all">All</option><option value="right">Right</option><option value="wrong">Wrong</option><option value="unmarked">Unmarked</option></select><input id="fcSearch" type="search" placeholder="Search topic or explanation…"><button id="fcShuffle">🔀 Shuffle</button><button id="fcAutoRead">🔊 Auto-read: On</button><span class="fc-size"><button id="fcMinus">A−</button><b id="fcFont">42px</b><button id="fcPlus">A+</button></span></div><div id="fcEmpty" class="fc-empty hide">No flashcards match this selection.</div><div id="fcCard" class="fc-card" tabindex="0"><div class="fc-meta"><b id="fcFace">QUESTION</b><span id="fcNumber"></span><span id="fcPriorityBadge"></span><span id="fcResultBadge"></span><span id="fcCategoryBadge" class="fc-category"></span></div><div id="fcTopic" class="fc-topic"></div><div class="fc-front"><div id="fcPrompt" class="fc-prompt"></div></div><div class="fc-back"><div id="fcAnswer" class="fc-answer"></div><div id="fcSource" class="fc-source"></div></div><div id="fcTapHint" class="fc-taphint"></div></div><div class="fc-result-row"><button id="fcMarkWrong" class="fc-wrong">✕ Wrong</button><button id="fcMarkRight" class="fc-right">✓ Right</button></div><div class="fc-nav"><button id="fcPrev">← Previous</button><b id="fcCounter"></b><button id="fcRead">🔊 Read</button><button id="fcFlip" class="primary">Show Answer</button><button id="fcNext" class="next">Next →</button></div><div class="fc-tip">Tap only flips the same card. <b>Next</b> moves on. Right/Wrong marks are saved for this pupil.</div>`;
 header.insertAdjacentElement('afterend',panel);
 const style=document.createElement('style');style.textContent=`.fc-hide{display:none!important}.fc-panel{margin:14px 0;--fc-font:42px}.fc-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.fc-head h2{font-size:clamp(28px,4vw,40px);margin:0}.fc-head p{color:#64748b;margin:5px 0;font-weight:700}.fc-head>b{background:#eef2ff;color:#3730a3;border-radius:999px;padding:8px 12px}.fc-top-filters{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0 6px}.fc-top-filters button{font-weight:900}.fc-top-filters button.on{background:#4338ca;color:#fff;border-color:#4338ca}.fc-chips{display:flex;gap:7px;overflow-x:auto;padding:7px 0 5px}.fc-chip{white-space:nowrap;padding:8px 10px;font-size:12px}.fc-chip.on{background:#4338ca;color:#fff;border-color:#4338ca}.fc-tools{display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin:10px 0}.fc-tools label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:800;color:#475569}.fc-tools input{flex:1;min-width:220px}.fc-size{display:flex;align-items:center;gap:4px}.fc-card{min-height:390px;background:#fff;border:2px solid #c7d2fe;border-radius:24px;box-shadow:0 10px 30px #0f172a16;padding:60px clamp(20px,4vw,46px);display:flex;flex-direction:column;justify-content:center;position:relative;cursor:pointer}.fc-meta{position:absolute;top:16px;left:18px;right:18px;display:flex;gap:7px;flex-wrap:wrap;align-items:center;color:#64748b;font-size:12px}.fc-meta>b{color:#4338ca;letter-spacing:.08em}.fc-category,.fc-priority,.fc-result-badge{padding:5px 8px;border-radius:999px;font-weight:800}.fc-category{background:#eef2ff;color:#3730a3}.fc-priority.red{background:#fee2e2;color:#991b1b}.fc-priority.amber{background:#f8fafc;color:#475569}.fc-priority.green{background:#dcfce7;color:#166534}.fc-result-badge.right{background:#dcfce7;color:#166534}.fc-result-badge.wrong{background:#fee2e2;color:#991b1b}.fc-result-badge.unmarked{background:#f1f5f9;color:#475569}.fc-topic{text-align:center;font-size:clamp(20px,3vw,28px);font-weight:900;color:#334155;margin-bottom:16px}.fc-front,.fc-back{text-align:center}.fc-prompt{font-size:clamp(29px,4.8vw,54px);font-weight:900;line-height:1.22}.fc-back{display:none}.show-back .fc-front{display:none}.show-back .fc-back{display:block}.show-back{border-color:#86efac;background:linear-gradient(180deg,#fff,#f0fdf4)}.fc-answer{font-size:var(--fc-font);font-weight:900;line-height:1.32}.fc-source{margin-top:22px;color:#166534;font-size:14px;font-weight:700}.fc-taphint{position:absolute;left:18px;right:18px;bottom:17px;text-align:center;color:#64748b;font-weight:800;font-size:13px}.fc-result-row,.fc-nav{display:flex;justify-content:center;align-items:center;gap:9px;flex-wrap:wrap;margin-top:12px}.fc-result-row button{min-width:130px;font-weight:900}.fc-wrong{background:#fff1f2;color:#991b1b;border-color:#fecdd3}.fc-right{background:#ecfdf5;color:#047857;border-color:#a7f3d0}.fc-nav>b{min-width:75px;text-align:center}.fc-tip{text-align:center;color:#64748b;font-size:13px;margin:14px auto}.fc-empty{background:#fff;border:1px solid #dbe3ee;border-radius:18px;padding:40px;text-align:center;font-weight:800}@media(max-width:700px){.fc-top-filters{grid-template-columns:1fr 1fr}.fc-card{min-height:360px;padding:60px 16px}.fc-answer{font-size:min(var(--fc-font),10vw)}.fc-tools>*{width:100%}.fc-tools input{min-width:0}.fc-size{width:auto}.fc-nav button{flex:1 1 40%}.fc-nav>b{width:100%;order:-1}}`;document.head.appendChild(style);
 tab.onclick=enter;
 $('phraseTab')?.addEventListener('click',leave);$('appTab')?.addEventListener('click',leave);
 $('fcCategory').onchange=()=>rebuild(false,false);$('fcPriority').onchange=()=>rebuild(false,false);$('fcSearch').oninput=()=>rebuild(false,false);$('fcShuffle').onclick=shuffle;
 $('fcAutoRead').onclick=toggleAuto;$('fcMinus').onclick=()=>setFont(font-4);$('fcPlus').onclick=()=>setFont(font+4);
 $('fcCard').onclick=flip;$('fcPrev').onclick=()=>move(-1);$('fcNext').onclick=()=>move(1);$('fcRead').onclick=toggleRead;
 $('fcFlip').onclick=e=>{e.stopPropagation();flip()};$('fcMarkRight').onclick=e=>{e.stopPropagation();mark('right')};$('fcMarkWrong').onclick=e=>{e.stopPropagation();mark('wrong')};
 $('fcCard').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)};
 renderChips();rebuild(false,false);setFont(font);return true;
}
window.PSLE_INSTALL_FLASHCARDS=install;
setTimeout(install,0);
})();