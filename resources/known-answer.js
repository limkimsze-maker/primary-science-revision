(()=>{
const d=document,$=id=>d.getElementById(id),ENDPOINT='https://primary-science-ai-marker.limkimsze-maker.workers.dev/mark';
let tries=0,timer=0;
const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function processMode(){try{return !!window.PSLE_PROCESS_MERGE?.isActive?.()}catch(_e){return false}}
function idx(){try{return typeof current==='function'?current():-1}catch(_e){return -1}}
function known(){try{const i=idx();return i>=0&&new Set(rec(i)?.appCorrectDates||[]).size>=1}catch(_e){return false}}
function q(){return String(d.querySelector('#gfBody .gf-prompt')?.textContent||'').trim()}
function qkey(x){return norm(x).slice(0,220)}
function entry(){const i=idx();try{return i>=0?BANK[i]:null}catch(_e){return null}}
function record(){const i=idx();try{return i>=0?rec(i):null}catch(_e){return null}}
function savedAnswer(question){const r=record(),k=qkey(question);return String(r?.guidedShownAnswerByQuestion?.[k]||r?.guidedImprovedByQuestion?.[k]||'').trim()}
function remember(question,answer){if(!question||!answer)return;try{const r=record(),k=qkey(question);if(!r||!k)return;r.guidedShownAnswerByQuestion=r.guidedShownAnswerByQuestion||{};r.guidedShownAnswerByQuestion[k]=answer;const keys=Object.keys(r.guidedShownAnswerByQuestion);if(keys.length>30)keys.slice(0,keys.length-30).forEach(x=>delete r.guidedShownAnswerByQuestion[x]);save()}catch(_e){}}
function installStyle(){if($('knownAnswerStyle'))return;const s=d.createElement('style');s.id='knownAnswerStyle';s.textContent=`
#gfShowKnownAnswer{background:#fff;color:#047857;border:2px solid #86efac}.ka-box{margin-top:13px;padding:14px 16px;border-radius:14px;border:2px solid #86efac;background:#ecfdf5;color:#14532d;line-height:1.55}.ka-box b{display:block;margin-bottom:5px}.ka-box .ka-answer{font-size:16px;font-weight:800}.ka-box small{display:block;margin-top:8px;color:#475569;font-weight:700}.ka-loading{color:#475569;background:#f8fafc;border-color:#cbd5e1}
`;d.head.appendChild(s)}
function payload(question,e,seed){return{conceptId:Number(e?.id||idx()+1),topic:e?.topic||'',question,answer:seed,verbatim:e?.phrase||'',modelAnswer:e?.modelApplicationAnswer||e?.phrase||'',rubric:Array.isArray(e?.rubric)?e.rubric:[]}}
async function generate(question,e){
 const core=String(e?.modelApplicationAnswer||e?.phrase||'').trim();if(!core)return'';
 if(norm(question)===norm(e?.phrasePrompt||''))return core;
 const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),25000);
 try{const res=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload(question,e,core)),signal:ctl.signal});const raw=await res.text();let data={};try{data=JSON.parse(raw)}catch(_e){};if(!res.ok)throw new Error('AI answer guide unavailable');return String(data?.improvedAnswer||'').trim()||core}finally{clearTimeout(to)}
}
async function toggle(){const btn=$('gfShowKnownAnswer'),box=$('gfKnownAnswerBox'),question=q(),e=entry();if(!btn||!box||!question||!e)return;if(!box.hidden){box.hidden=true;btn.textContent='👁 Show answer';return}box.hidden=false;btn.textContent='🙈 Hide answer';let ans=savedAnswer(question);if(ans){box.className='ka-box';box.innerHTML=`<b>Suggested PSLE answer</b><div class="ka-answer">${esc(ans)}</div><small>Review only. Showing this answer does not change Known progress.</small>`;return}box.className='ka-box ka-loading';box.innerHTML='<b>Preparing a question-specific answer…</b><small>Using the book-backed Science concept and the exact question.</small>';btn.disabled=true;try{ans=await generate(question,e);if(ans){remember(question,ans);box.className='ka-box';box.innerHTML=`<b>Suggested PSLE answer</b><div class="ka-answer">${esc(ans)}</div><small>Review only. Scientifically equivalent wording may also be correct. Showing this answer does not change Known progress.</small>`}else box.innerHTML='<b>Answer guide unavailable.</b><small>Use the Flashcard Science concept and the Explain frame for this question.</small>'}catch(_e){const core=String(e?.modelApplicationAnswer||e?.phrase||'').trim();box.className='ka-box';box.innerHTML=core?`<b>Book-backed Science core</b><div class="ka-answer">${esc(core)}</div><small>Adapt this core to the exact question. The question-specific answer could not be prepared just now.</small>`:'<b>Answer guide unavailable.</b>'}finally{btn.disabled=false}}
function render(){const body=$('gfBody'),ta=$('gfAppAnswer');if(!body||!ta||processMode()||!known()){$('gfShowKnownAnswer')?.remove();$('gfKnownAnswerBox')?.remove();return}const question=q();if(!question)return;let btn=$('gfShowKnownAnswer'),box=$('gfKnownAnswerBox');const sig=qkey(question);if(btn&&btn.dataset.q!==sig){btn.remove();box?.remove();btn=null;box=null}if(!btn){const actions=ta.nextElementSibling?.classList?.contains('gf-actions')?ta.nextElementSibling:body.querySelector('.gf-actions');if(!actions)return;btn=d.createElement('button');btn.id='gfShowKnownAnswer';btn.type='button';btn.className='gf-btn';btn.dataset.q=sig;btn.textContent='👁 Show answer';const mark=$('gfMarkApp');if(mark&&mark.parentElement===actions)actions.insertBefore(btn,mark);else actions.appendChild(btn);box=d.createElement('div');box.id='gfKnownAnswerBox';box.hidden=true;actions.insertAdjacentElement('afterend',box);btn.onclick=toggle}}
function schedule(){clearTimeout(timer);timer=setTimeout(render,50)}
function boot(){tries++;const f=$('guidedFlow');if(!f){if(tries<240)setTimeout(boot,80);return}installStyle();new MutationObserver(schedule).observe(f,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-stage']});render()}
boot();
})();