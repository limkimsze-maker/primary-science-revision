(()=>{
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let list=[],pos=0,back=false,font=42,mode=false,speaking=false,currentUtterance=null;
function cats(){return [...new Set(BANK.map(x=>x.category).filter(Boolean))]}
function state(i){try{return typeof priority==='function'?priority(i):'amber'}catch(_e){return'amber'}}
function label(p){return p==='red'?'🔴 Focus':p==='green'?'🟢 Already Good':'⚪ Not Studied Yet'}
function filters(){
 const cat=$('fcCategory')?.value||'all',pri=$('fcPriority')?.value||'all',q=($('fcSearch')?.value||'').trim().toLowerCase();
 let a=[...Array(BANK.length).keys()];
 if(cat!=='all')a=a.filter(i=>BANK[i].category===cat);
 if(pri!=='all')a=a.filter(i=>state(i)===pri);
 if(q)a=a.filter(i=>`${BANK[i].id} ${BANK[i].topic} ${BANK[i].category} ${BANK[i].phrasePrompt} ${BANK[i].phrase}`.toLowerCase().includes(q));
 return a;
}
function renderChips(){
 const box=$('fcChips');if(!box)return;const selected=$('fcCategory')?.value||'all';
 box.innerHTML=`<button data-cat="all" class="fc-chip ${selected==='all'?'on':''}">All <b>${BANK.length}</b></button>`+cats().map(c=>`<button data-cat="${esc(c)}" class="fc-chip ${selected===c?'on':''}">${esc(c)} <b>${BANK.filter(x=>x.category===c).length}</b></button>`).join('');
 box.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{$('fcCategory').value=b.dataset.cat;rebuild()});
}
function stopRead(){
 try{speechSynthesis.cancel()}catch(_e){}
 speaking=false;currentUtterance=null;
 const b=$('fcRead');if(b)b.textContent=back?'🔊 Read Explanation':'🔊 Read Question';
}
function currentCard(){return list.length?BANK[list[pos]]:null}
function preferredVoice(){
 const voices=typeof speechSynthesis!=='undefined'?speechSynthesis.getVoices():[];
 const uk=voices.filter(v=>/^en-GB$/i.test(v.lang||''));
 const femaleHints=['Sonia','Serena','Hazel','Libby','Susan','Martha','Kate','Emma','Amy','Female'];
 return uk.find(v=>femaleHints.some(n=>(v.name||'').toLowerCase().includes(n.toLowerCase())))||uk[0]||voices.find(v=>/^en/i.test(v.lang||''))||null;
}
function readCurrent(){
 if(!list.length||typeof speechSynthesis==='undefined'||typeof SpeechSynthesisUtterance==='undefined')return;
 if(speaking){stopRead();return}
 const e=currentCard();if(!e)return;
 const text=back?e.phrase:e.phrasePrompt;if(!text)return;
 try{speechSynthesis.cancel()}catch(_e){}
 const u=new SpeechSynthesisUtterance(text);currentUtterance=u;u.lang='en-GB';u.rate=.88;u.pitch=1;
 const v=preferredVoice();if(v)u.voice=v;
 u.onstart=()=>{speaking=true;const b=$('fcRead');if(b)b.textContent='⏹ Stop Reading'};
 u.onend=u.onerror=()=>{speaking=false;currentUtterance=null;const b=$('fcRead');if(b)b.textContent=back?'🔊 Read Explanation':'🔊 Read Question'};
 speechSynthesis.speak(u);
}
function rebuild(){stopRead();list=filters();pos=0;back=false;renderChips();render()}
function render(){
 const card=$('fcCard'),empty=$('fcEmpty');$('fcSetCount').textContent=`${list.length} card${list.length===1?'':'s'}`;
 if(!list.length){card.classList.add('hide');empty.classList.remove('hide');$('fcCounter').textContent='0 / 0';return}
 card.classList.remove('hide');empty.classList.add('hide');pos=(pos+list.length)%list.length;
 const i=list[pos],e=BANK[i],p=state(i);$('fcCounter').textContent=`${pos+1} / ${list.length}`;$('fcNumber').textContent=`#${e.id}`;$('fcTopic').textContent=e.topic;$('fcPrompt').textContent=e.phrasePrompt;$('fcAnswer').textContent=e.phrase;$('fcSource').textContent=`📘 ${e.bookRef}`;$('fcCategoryBadge').textContent=e.category;$('fcPriorityBadge').textContent=label(p);$('fcPriorityBadge').className=`fc-priority ${p}`;$('fcFace').textContent=back?'EXPLANATION':'QUESTION';card.classList.toggle('show-back',back);$('fcFlip').textContent=back?'↩ Show Question':'✨ Reveal Explanation';if(!speaking&&$('fcRead'))$('fcRead').textContent=back?'🔊 Read Explanation':'🔊 Read Question';
}
function flip(){if(!list.length)return;stopRead();back=!back;render()}
function move(d){if(!list.length)return;stopRead();pos=(pos+d+list.length)%list.length;back=false;render()}
function shuffle(){stopRead();for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}pos=0;back=false;render()}
function setFont(n){font=Math.max(28,Math.min(64,n));$('flashcardPanel').style.setProperty('--fc-font',font+'px');$('fcFont').textContent=font+'px'}
function existing(show){document.querySelectorAll('body>.wrap>.controls,body>.wrap>.stats,body>.wrap>.main-grid').forEach(x=>x.classList.toggle('fc-hide',!show))}
function enter(){mode=true;existing(false);$('flashcardPanel').classList.remove('hide');document.querySelectorAll('header .tab').forEach(x=>x.classList.remove('active'));$('flashcardTab').classList.add('active');rebuild();window.scrollTo({top:0,behavior:'smooth'})}
function leave(){if(!mode)return;stopRead();mode=false;existing(true);$('flashcardPanel').classList.add('hide');$('flashcardTab').classList.remove('active')}
function install(){
 if(typeof BANK==='undefined'||!BANK.length)return false;const tabs=document.querySelector('header .tabs'),header=document.querySelector('body>.wrap>header');if(!tabs||!header)return false;if($('flashcardTab'))return true;
 const tab=document.createElement('button');tab.id='flashcardTab';tab.className='tab';tab.textContent='🃏 Flashcards';tabs.appendChild(tab);
 const panel=document.createElement('section');panel.id='flashcardPanel';panel.className='fc-panel hide';panel.innerHTML=`
 <div class="fc-head"><div><h2>🃏 Explanation Flashcards</h2><p>Large-print study cards using the same 180 book-backed explanations. This mode does not change mastery scores.</p></div><b id="fcSetCount"></b></div>
 <div id="fcChips" class="fc-chips"></div>
 <div class="fc-tools"><label>Category<select id="fcCategory"><option value="all">All categories</option>${cats().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label><label>Study set<select id="fcPriority"><option value="all">All statuses</option><option value="red">🔴 Focus</option><option value="amber">⚪ Not Studied Yet</option><option value="green">🟢 Already Good</option></select></label><input id="fcSearch" type="search" placeholder="Search topic or explanation…"><button id="fcShuffle">🔀 Shuffle</button><span class="fc-size"><button id="fcMinus">A−</button><b id="fcFont">42px</b><button id="fcPlus">A+</button></span></div>
 <div id="fcEmpty" class="fc-empty hide">No flashcards match this selection.</div>
 <div id="fcCard" class="fc-card" tabindex="0"><div class="fc-meta"><b id="fcFace">QUESTION</b><span id="fcNumber"></span><span id="fcPriorityBadge"></span><span id="fcCategoryBadge" class="fc-category"></span></div><div id="fcTopic" class="fc-topic"></div><div class="fc-front"><div id="fcPrompt" class="fc-prompt"></div><small>Tap the card to reveal the explanation.</small></div><div class="fc-back"><div id="fcAnswer" class="fc-answer"></div><div id="fcSource" class="fc-source"></div></div></div>
 <div class="fc-nav"><button id="fcPrev">← Previous</button><b id="fcCounter"></b><button id="fcRead">🔊 Read Question</button><button id="fcFlip" class="primary">✨ Reveal Explanation</button><button id="fcNext" class="next">Next →</button></div>
 <div class="fc-tip"><b>Study idea:</b> say the explanation aloud before flipping the card, then use Read Explanation to hear the model wording. Use Category or Study set to concentrate on one area.</div>`;header.insertAdjacentElement('afterend',panel);
 const style=document.createElement('style');style.textContent=`.fc-hide{display:none!important}.fc-panel{margin-top:14px;--fc-font:42px}.fc-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.fc-head h2{font-size:clamp(28px,4vw,40px);margin:0}.fc-head p{color:#64748b;margin:5px 0}.fc-head>b{background:#eef2ff;color:#3730a3;border-radius:999px;padding:8px 12px}.fc-chips{display:flex;gap:7px;overflow-x:auto;padding:12px 0 5px}.fc-chip{white-space:nowrap;padding:8px 10px;font-size:12px}.fc-chip.on{background:#4338ca;color:#fff;border-color:#4338ca}.fc-tools{display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin:12px 0}.fc-tools label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:800;color:#475569}.fc-tools input{flex:1;min-width:240px}.fc-size{display:flex;align-items:center;gap:4px}.fc-size button{padding:8px 10px}.fc-size b{font-size:12px}.fc-card{min-height:430px;background:#fff;border:2px solid #c7d2fe;border-radius:26px;box-shadow:0 12px 35px #0f172a18;padding:62px clamp(20px,4vw,48px) 36px;display:flex;flex-direction:column;justify-content:center;position:relative;cursor:pointer}.fc-meta{position:absolute;top:18px;left:20px;right:20px;display:flex;gap:7px;flex-wrap:wrap;align-items:center;color:#64748b;font-size:12px}.fc-meta>b{color:#4338ca;letter-spacing:.1em}.fc-category,.fc-priority{padding:5px 8px;border-radius:999px;font-weight:800}.fc-category{background:#eef2ff;color:#3730a3}.fc-priority.red{background:#fee2e2;color:#991b1b}.fc-priority.amber{background:#f8fafc;color:#475569}.fc-priority.green{background:#dcfce7;color:#166534}.fc-topic{text-align:center;font-size:clamp(20px,3vw,30px);font-weight:900;color:#334155;margin-bottom:18px}.fc-front,.fc-back{text-align:center}.fc-prompt{font-size:clamp(30px,5vw,58px);font-weight:900;line-height:1.22}.fc-front small{display:block;color:#64748b;margin-top:28px}.fc-back{display:none}.show-back .fc-front{display:none}.show-back .fc-back{display:block}.show-back{border-color:#86efac;background:linear-gradient(180deg,#fff,#f0fdf4)}.fc-answer{font-size:var(--fc-font);font-weight:900;line-height:1.32}.fc-source{margin-top:24px;color:#166534;font-size:14px;font-weight:700}.fc-nav{display:flex;justify-content:center;align-items:center;gap:9px;flex-wrap:wrap;margin-top:14px}.fc-nav>b{min-width:75px;text-align:center}.fc-tip{text-align:center;color:#64748b;font-size:13px;margin:16px auto}.fc-empty{background:#fff;border:1px solid #dbe3ee;border-radius:18px;padding:40px;text-align:center;font-weight:800}@media(max-width:650px){.fc-card{min-height:390px;padding:62px 18px 28px}.fc-answer{font-size:min(var(--fc-font),10vw)}.fc-tools>*{width:100%}.fc-tools input{min-width:0}.fc-size{width:auto}.fc-nav button{flex:1 1 40%}.fc-nav>b{width:100%;order:-1}}`;document.head.appendChild(style);
 tab.onclick=enter;$('phraseTab')?.addEventListener('click',leave);$('appTab')?.addEventListener('click',leave);$('fcCategory').onchange=rebuild;$('fcPriority').onchange=rebuild;$('fcSearch').oninput=rebuild;$('fcShuffle').onclick=()=>{list=filters();shuffle()};$('fcMinus').onclick=()=>setFont(font-4);$('fcPlus').onclick=()=>setFont(font+4);$('fcCard').onclick=flip;$('fcPrev').onclick=()=>move(-1);$('fcNext').onclick=()=>move(1);$('fcRead').onclick=readCurrent;$('fcFlip').onclick=flip;$('fcCard').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)};renderChips();rebuild();setFont(font);return true;
}
let tries=0,t=setInterval(()=>{tries++;if(install()||tries>120)clearInterval(t)},100);
})();