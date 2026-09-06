(()=>{
let tries=0,flashTries=0;
const DAY=86400000,SPACING=[1,3,7,14];
const student=()=>((localStorage.getItem('psleScience_active_student')||'student').toLowerCase());
const storeKey=()=>`psleScience_learning_cycle_v1__profile_${student()}`;
const dateKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const readStore=()=>{try{return JSON.parse(localStorage.getItem(storeKey())||'{}')||{}}catch(_e){return{}}};
const writeStore=s=>{try{localStorage.setItem(storeKey(),JSON.stringify(s))}catch(_e){}};
const uniqPush=(a,v)=>{a=Array.isArray(a)?a:[];if(!a.includes(v))a.push(v);return a};
function dayRec(){const s=readStore(),d=dateKey();s.days=s.days||{};s.days[d]=Object.assign({flashRight:[],flashWrong:[],recall:[],app:[],repaired:[],mastered:[],rewards:[],attempts:0},s.days[d]||{});return{s,d,r:s.days[d]}}
function saveDay(ctx){ctx.s.days[ctx.d]=ctx.r;writeStore(ctx.s)}
function log(kind,i){const c=dayRec();if(Array.isArray(c.r[kind]))c.r[kind]=uniqPush(c.r[kind],i);else c.r[kind]=[i];saveDay(c);refreshDashboard();return c}
function logAttempt(){const c=dayRec();c.r.attempts=(c.r.attempts||0)+1;saveDay(c);refreshDashboard()}
function allWins(r){return new Set([...(r.flashRight||[]),...(r.recall||[]),...(r.app||[])]).size}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function name(){const s=student();return s==='jerry'?'Jerry':s==='javis'?'Javis':''}
function toast(title,text,kind='good'){
 const box=document.getElementById('lcToast');if(!box)return;
 box.className=`lc-toast ${kind}`;box.innerHTML=`<div class="lc-toast-icon">${kind==='master'?'🏆':kind==='repair'?'💪':kind==='try'?'🌱':'✨'}</div><div><b>${esc(title)}</b><span>${esc(text)}</span></div>`;box.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>box.classList.remove('show'),3600);
}
function rewardCheck(){
 const c=dayRec(),wins=allWins(c.r),marks=[[3,'Momentum!','3 concepts strengthened today.'],[5,'Five-win streak!','Your retrieval practice is adding up.'],[10,'Strong study session!','10 concepts strengthened — a good point to rest and let memory consolidate.']];
 for(const [n,t,m] of marks){if(wins>=n&&!c.r.rewards.includes(n)){c.r.rewards.push(n);saveDay(c);toast(t,m,n===10?'master':'good');break}}
}
function dueIndices(){
 if(typeof BANK==='undefined'||typeof rec!=='function')return[];
 const now=Date.now();return [...Array(BANK.length).keys()].filter(i=>{const x=rec(i)||{};return Number(x.due)>0&&Number(x.due)<=now});
}
function counts(){
 const c=dayRec().r;return{wins:allWins(c),repair:(c.repaired||[]).length,app:(c.app||[]).length,mastered:(c.mastered||[]).length,due:dueIndices().length,attempts:c.attempts||0};
}
function refreshDashboard(){
 const z=counts();
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
 set('lcWins',z.wins);set('lcRepairs',z.repair);set('lcApps',z.app);set('lcMastered',z.mastered);set('lcDue',z.due);
 const n=name(),msg=document.getElementById('lcMotivate');if(msg){
   if(z.mastered>0)msg.textContent=`${n?n+', ':''}${z.mastered} concept${z.mastered===1?' is':'s are'} now stronger. Keep the next step small and steady.`;
   else if(z.wins>=5)msg.textContent=`${n?n+', ':''}good work. Retrieval is effortful because your brain is rebuilding the memory.`;
   else if(z.attempts>=3)msg.textContent='Mistakes are useful here: check the gap, correct it, then retrieve again.';
   else msg.textContent='Try to recall before you reveal. Effortful retrieval is the part that strengthens memory.';
 }
 rewardCheck();
}
function setStage(stage){
 document.querySelectorAll('.lc-step').forEach(b=>b.classList.toggle('active',b.dataset.stage===stage));
 const tip=document.getElementById('lcStageTip');if(!tip)return;
 const tips={flash:'Recall first — say the answer before you flip the card.',phrase:'Rebuild the exact science idea. Use less help as recall gets stronger.',app:'Use the remembered idea in a new PSLE-style situation.',review:'Return later. Spacing forces the brain to retrieve after some forgetting.'};tip.textContent=tips[stage]||tips.flash;
}
function syncStage(){
 const fc=document.getElementById('flashcardPanel');
 if(fc&&!fc.classList.contains('hide'))return setStage('flash');
 const app=document.getElementById('appPane');if(app&&!app.classList.contains('hide'))return setStage('app');
 const phr=document.getElementById('phrasePane');if(phr&&!phr.classList.contains('hide'))return setStage('phrase');
}
function jumpConcept(i,which='phrase',exact=false){
 try{
   const idx=order.indexOf(i);if(idx<0){order=[i,...order];pos=0}else pos=idx;
   render();setPane(which==='app'?'app':'phrase');
   if(exact){setTimeout(()=>{const s=document.getElementById('phraseMode');if(s){s.value='exact';s.dispatchEvent(new Event('change',{bubbles:true}))}},20)}
   window.scrollTo({top:0,behavior:'smooth'});
 }catch(_e){}
}
function enterFlashcards(){document.getElementById('flashcardTab')?.click();setTimeout(syncStage,30)}
function startDueReview(){
 const due=dueIndices();if(!due.length){toast('Nothing due right now','Use Flashcards for a quick retrieval warm-up, or come back later.','good');enterFlashcards();return}
 try{order=due.slice();pos=0;render();setPane('phrase');setTimeout(()=>{const s=document.getElementById('phraseMode');if(s){s.value='exact';s.dispatchEvent(new Event('change',{bubbles:true}))}},30);toast('Spaced review started',`${due.length} concept${due.length===1?' is':'s are'} due. Recall before using a hint.`,'good');window.scrollTo({top:0,behavior:'smooth'})}catch(_e){}
}
function coach(boxId,html,buttons=[]){
 const box=document.getElementById(boxId);if(!box)return;box.innerHTML=`<div class="lc-coach-text">${html}</div><div class="lc-coach-actions"></div>`;box.classList.add('show');const a=box.querySelector('.lc-coach-actions');buttons.forEach(x=>{const b=document.createElement('button');b.type='button';b.className=x.primary?'lc-coach-primary':'';b.textContent=x.label;b.addEventListener('click',x.fn);a.appendChild(b)})
}
function clearCoach(id){document.getElementById(id)?.classList.remove('show')}
function maybeMastered(i,before){
 if(typeof phraseIsSecure!=='function'||typeof appIsSecure!=='function')return false;
 const now=phraseIsSecure(i)&&appIsSecure(i);if(now&&!before){log('mastered',i);toast('Mastery unlocked!','You have recalled this concept accurately and applied it correctly across different days.','master');return true}return false;
}
function advanceSpacing(i){
 const x=rec(i),d=dateKey();if(x.cycleLastAdvancedDate===d)return;
 const phraseToday=(x.phraseDates||[]).includes(d),appToday=(x.appCorrectDates||[]).includes(d);if(!phraseToday||!appToday)return;
 x.cycleStage=Math.min(4,(Number(x.cycleStage)||0)+1);x.cycleLastAdvancedDate=d;x.due=Date.now()+SPACING[Math.max(0,x.cycleStage-1)]*DAY;save();refreshDashboard();
}
function installCore(){
 tries++;
 if(typeof BANK==='undefined'||typeof rec!=='function'||typeof current!=='function'||typeof render!=='function'||!document.querySelector('body>.wrap>header')){if(tries<180)setTimeout(installCore,100);return}
 if(document.getElementById('learningCycle'))return;
 const header=document.querySelector('body>.wrap>header');
 const panel=document.createElement('section');panel.id='learningCycle';panel.className='lc-panel';panel.innerHTML=`
   <div class="lc-top"><div><b class="lc-kicker">MEMORY PATH</b><h2>Recall → Memorise → Apply → Review</h2><p id="lcMotivate"></p></div><button type="button" id="lcStart">Start with flashcards</button></div>
   <div class="lc-steps" aria-label="Learning path">
    <button type="button" class="lc-step" data-stage="flash"><span>1</span><b>🃏 Recall</b><small>Try before flipping</small></button>
    <span class="lc-arrow">→</span>
    <button type="button" class="lc-step" data-stage="phrase"><span>2</span><b>🧠 Memorise</b><small>Reduce the hints</small></button>
    <span class="lc-arrow">→</span>
    <button type="button" class="lc-step" data-stage="app"><span>3</span><b>🎓 Apply</b><small>Use it in context</small></button>
    <span class="lc-arrow">→</span>
    <button type="button" class="lc-step" data-stage="review"><span>4</span><b>📅 Review later</b><small><strong id="lcDue">0</strong> due now</small></button>
   </div>
   <div class="lc-stage-tip" id="lcStageTip"></div>
   <div class="lc-today"><span class="lc-today-label">Today</span><span>🧠 <b id="lcWins">0</b> retrieval wins</span><span>💪 <b id="lcRepairs">0</b> repaired</span><span>🎓 <b id="lcApps">0</b> applications</span><span>🏆 <b id="lcMastered">0</b> mastered</span></div>`;
 header.insertAdjacentElement('afterend',panel);
 const phraseFb=document.getElementById('phraseFeedback'),appFb=document.getElementById('appFeedback');
 if(phraseFb){const c=document.createElement('div');c.id='lcPhraseCoach';c.className='lc-coach';phraseFb.insertAdjacentElement('afterend',c)}
 if(appFb){const c=document.createElement('div');c.id='lcAppCoach';c.className='lc-coach';appFb.insertAdjacentElement('afterend',c)}
 const toastBox=document.createElement('div');toastBox.id='lcToast';toastBox.className='lc-toast';toastBox.setAttribute('role','status');toastBox.setAttribute('aria-live','polite');document.body.appendChild(toastBox);
 const style=document.createElement('style');style.textContent=`
 .lc-panel{margin:14px 0 8px;padding:15px 16px;background:#fff;border:1px solid #dbe3ee;border-radius:18px;box-shadow:0 3px 14px #0f172a08}
 .lc-top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.lc-top h2{font-size:clamp(20px,3vw,27px);margin:2px 0 3px}.lc-top p{margin:0;color:#64748b;font-size:13px;line-height:1.45}.lc-kicker{font-size:11px;letter-spacing:.12em;color:#4338ca}.lc-top>button{background:#4338ca;color:#fff;border-color:#4338ca;font-weight:900}
 .lc-steps{display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;gap:7px;align-items:center;margin-top:13px}.lc-step{min-width:0;display:grid;grid-template-columns:30px 1fr;text-align:left;column-gap:8px;row-gap:1px;align-items:center;padding:10px;background:#f8fafc;border:2px solid #e2e8f0}.lc-step>span{grid-row:1/3;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#e2e8f0;font-weight:900;color:#475569}.lc-step b{font-size:14px}.lc-step small{color:#64748b;font-size:11px}.lc-step.active{background:#eef2ff;border-color:#6366f1}.lc-step.active>span{background:#4338ca;color:#fff}.lc-arrow{font-weight:900;color:#94a3b8}.lc-stage-tip{margin-top:9px;padding:9px 11px;border-radius:11px;background:#f8fafc;color:#475569;font-size:13px;font-weight:700}.lc-today{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}.lc-today>span{padding:6px 9px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;color:#475569}.lc-today .lc-today-label{background:#172033;color:#fff;border-color:#172033;font-weight:900}
 .lc-coach{display:none;margin-top:10px;padding:12px 13px;border-radius:13px;background:#eef2ff;border:1px solid #c7d2fe}.lc-coach.show{display:block}.lc-coach-text{font-weight:800;line-height:1.45;color:#3730a3}.lc-coach-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}.lc-coach-actions button{font-weight:800}.lc-coach-actions .lc-coach-primary{background:#4338ca;color:#fff;border-color:#4338ca}
 .lc-toast{position:fixed;left:50%;bottom:20px;transform:translate(-50%,20px);z-index:99999;display:flex;gap:10px;align-items:center;width:min(520px,calc(100% - 28px));padding:12px 14px;border:1px solid #bbf7d0;border-radius:15px;background:#f0fdf4;box-shadow:0 14px 45px #0f172a30;opacity:0;pointer-events:none;transition:.2s ease}.lc-toast.show{opacity:1;transform:translate(-50%,0)}.lc-toast.try{background:#fffbeb;border-color:#fde68a}.lc-toast.repair{background:#eef2ff;border-color:#c7d2fe}.lc-toast.master{background:#fff7ed;border-color:#fed7aa}.lc-toast-icon{font-size:27px}.lc-toast b{display:block}.lc-toast span{display:block;color:#475569;font-size:12px;line-height:1.35;margin-top:2px}
 @media(max-width:760px){.lc-steps{grid-template-columns:1fr 1fr}.lc-arrow{display:none}.lc-step{width:100%}.lc-top>button{width:100%}.lc-today{display:grid;grid-template-columns:1fr 1fr}.lc-today>span{text-align:center}.lc-today .lc-today-label{grid-column:1/3}.lc-panel{padding:13px}}
 @media(prefers-reduced-motion:reduce){.lc-toast{transition:none}}
 `;document.head.appendChild(style);
 document.getElementById('lcStart').onclick=enterFlashcards;
 panel.querySelector('[data-stage="flash"]').onclick=enterFlashcards;
 panel.querySelector('[data-stage="phrase"]').onclick=()=>{try{setPane('phrase');window.scrollTo({top:0,behavior:'smooth'})}catch(_e){}};
 panel.querySelector('[data-stage="app"]').onclick=()=>{try{setPane('app');window.scrollTo({top:0,behavior:'smooth'})}catch(_e){}};
 panel.querySelector('[data-stage="review"]').onclick=startDueReview;
 document.getElementById('phraseTab')?.addEventListener('click',()=>setTimeout(syncStage,0));document.getElementById('appTab')?.addEventListener('click',()=>setTimeout(syncStage,0));
 const check=document.getElementById('checkPhrase');if(check)check.addEventListener('click',()=>{
   const i=current(),before=phraseIsSecure(i)&&appIsSecure(i),mode=document.getElementById('phraseMode')?.value||'',u=document.getElementById('phraseAnswer')?.value||'',target=BANK[i]?.phrase||'',exact=typeof norm==='function'?norm(u)===norm(target):u.trim()===target.trim();logAttempt();setTimeout(()=>{
    if(mode==='exact'&&exact){log('recall',i);advanceSpacing(i);coach('lcPhraseCoach','<b>Exact recall!</b> Now make the memory flexible by using the idea in a new question.',[{label:'Apply this concept →',primary:true,fn:()=>jumpConcept(i,'app')}]);toast('Exact recall!','You retrieved the science idea without seeing it. Now transfer it to a new context.','good');maybeMastered(i,before)}
    else if(mode==='exact'&&!exact&&u.trim()){coach('lcPhraseCoach','Not exact yet. Compare the gap, correct it, then retrieve the sentence again. <b>The correction attempt is valuable learning.</b>',[{label:'Try exact recall again',primary:true,fn:()=>document.getElementById('retryPhrase')?.click()}]);toast('Keep going','Finding the missing words now makes the next retrieval stronger.','try')}
    else if(exact){coach('lcPhraseCoach','Good learning-stage recall. Reduce the support and work towards <b>Exact recall</b>.',[{label:'Move to Exact Recall',primary:true,fn:()=>{const s=document.getElementById('phraseMode');if(s){s.value='exact';s.dispatchEvent(new Event('change',{bubbles:true}))}}}])}
    refreshDashboard();
   },20)
 });
 document.querySelectorAll('button[data-rate]').forEach(b=>b.addEventListener('click',()=>{
   const i=current(),rate=b.dataset.rate,before=phraseIsSecure(i)&&appIsSecure(i),hadError=['de','sr','lr','concept'].includes(rec(i).appLast);logAttempt();setTimeout(()=>{
    if(rate==='correct'){log('app',i);if(hadError){log('repaired',i);toast('Comeback!','You repaired a weak application instead of avoiding it.','repair')}else toast('PSLE transfer!','You used the remembered science idea in a new situation.','good');advanceSpacing(i);const mastered=maybeMastered(i,before);coach('lcAppCoach',mastered?'<b>Mastery unlocked.</b> This concept has both recall and application evidence across different days.':'<b>Application correct.</b> The idea is becoming usable, not just familiar.',[{label:'Next concept →',primary:true,fn:()=>document.getElementById('nextApp')?.click()},{label:'Review this explanation',fn:()=>jumpConcept(i,'phrase',true)}])}
    else{const msg=rate==='concept'?'You found the science-concept gap. Rebuild the core explanation, then come back to application.':'Almost there. Repair the missing part, then try the application again.';coach('lcAppCoach',msg,[{label:'Repair in Memorisation →',primary:true,fn:()=>jumpConcept(i,'phrase')},{label:'Try application again',fn:()=>document.getElementById('retryApp')?.click()}]);toast('Useful mistake','The gap is now visible. Repair it, then retrieve again.','try')}
    refreshDashboard();
   },20)
 }));
 const obs=new MutationObserver(syncStage);['phrasePane','appPane','flashcardPanel'].forEach(id=>{const e=document.getElementById(id);if(e)obs.observe(e,{attributes:true,attributeFilter:['class']})});
 refreshDashboard();syncStage();installFlashHooks();
}
function installFlashHooks(){
 flashTries++;
 const card=document.getElementById('fcCard'),right=document.getElementById('fcMarkRight'),wrong=document.getElementById('fcMarkWrong'),panel=document.getElementById('flashcardPanel');
 if(!card||!right||!wrong||!panel){if(flashTries<200)setTimeout(installFlashHooks,100);return}
 if(panel.dataset.learningCycle==='1')return;panel.dataset.learningCycle='1';
 let coachBox=document.getElementById('lcFlashCoach');if(!coachBox){coachBox=document.createElement('div');coachBox.id='lcFlashCoach';coachBox.className='lc-coach';const resultRow=document.querySelector('#flashcardPanel .fc-result-row');(resultRow||document.querySelector('#flashcardPanel .fc-nav'))?.insertAdjacentElement('afterend',coachBox)}
 const mark=(value)=>{
   const i=Number(card.dataset.cardIndex);if(!Number.isInteger(i)||i<0)return;const prev=rec(i)?.flashcardResult||'';logAttempt();setTimeout(()=>{
    if(value==='wrong'){log('flashWrong',i);coach('lcFlashCoach','Good catch. This card is now a <b>high-value practice target</b>. Rebuild it before moving on.',[{label:'Practise this concept →',primary:true,fn:()=>jumpConcept(i,'phrase')}]);toast('Weak spot found','That is useful information. Repair it now while the gap is clear.','try')}
    else{log('flashRight',i);if(prev==='wrong'){log('repaired',i);coach('lcFlashCoach','<b>Comeback!</b> You retrieved a card that was previously wrong. That correction is worth more than an easy repeat.',[{label:'Strengthen with Exact Recall',primary:true,fn:()=>jumpConcept(i,'phrase',true)}]);toast('Comeback!','You repaired a weak memory.','repair')}else{coach('lcFlashCoach','Nice retrieval. To deepen it, move to exact recall or continue through the cards.',[{label:'Strengthen with Memorisation',fn:()=>jumpConcept(i,'phrase')}]);toast('Retrieved!','You brought the answer back before rereading it.','good')}}refreshDashboard();
   },30)
 };
 right.addEventListener('click',()=>mark('right'));wrong.addEventListener('click',()=>mark('wrong'));
 document.getElementById('flashcardTab')?.addEventListener('click',()=>{clearCoach('lcFlashCoach');setTimeout(syncStage,20)});
}
installCore();
})();