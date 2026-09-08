(()=>{
const $=id=>document.getElementById(id);
const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const waitFor=(fn,ms=20000)=>new Promise(resolve=>{const st=Date.now();const tick=()=>{let ok=false;try{ok=!!fn()}catch(_e){}if(ok)return resolve(true);if(Date.now()-st>=ms)return resolve(false);setTimeout(tick,70)};tick()});
let tries=0,busy=false,timer=0,lastSig='';
function nav(){return window.PSLE_GUIDED_NAV||null}
function proc(){return window.PSLE_PROCESS_MERGE||null}
function processMode(){try{return !!proc()?.isActive?.()}catch(_e){return false}}
function sciIndex(){try{return typeof current==='function'?current():-1}catch(_e){return -1}}
function stage(){if(processMode())return 'process-'+(proc()?.getStage?.()||'flash');return $('guidedFlow')?.dataset?.stage||nav()?.getStage?.()||'flash'}
function cloneRecord(i){try{return JSON.parse(JSON.stringify(rec(i)||{}))}catch(_e){return null}}
function restoreRecord(i,snap){if(!snap)return;try{const x=rec(i);Object.keys(x).forEach(k=>delete x[k]);Object.assign(x,snap);save()}catch(_e){}}
function prettyKey(k){const s=String(k||'').trim();if(!s)return 'Previous Application question';return s.charAt(0).toUpperCase()+s.slice(1)+(s.endsWith('?')?'':'…')}
function history(i=sciIndex()){
  if(i<0)return[];const x=rec(i)||{},map=new Map();
  for(const h of (Array.isArray(x.guidedTriedAppQuestions)?x.guidedTriedAppQuestions:[])){
    const key=norm(h?.key||h?.q);if(!key)continue;map.set(key,{key,q:String(h.q||prettyKey(key)),answer:String(h.answer||''),lastAt:Number(h.lastAt||0),count:Number(h.count||1),source:'tried'});
  }
  for(const key0 of (Array.isArray(x.guidedAppHistory)?x.guidedAppHistory:[])){
    const key=norm(key0);if(!key||map.has(key))continue;map.set(key,{key,q:prettyKey(key0),answer:'',lastAt:0,count:1,source:'legacy'});
  }
  return [...map.values()].sort((a,b)=>(b.lastAt||0)-(a.lastAt||0));
}
function rememberAttempt(){
  if(processMode())return;
  const i=sciIndex();if(i<0)return;const q=String($('gfBody')?.querySelector('.gf-prompt')?.textContent||$('appQuestion')?.textContent||'').trim();if(!q)return;
  const answer=String($('gfAppAnswer')?.value||'').trim(),key=norm(q),x=rec(i);x.guidedTriedAppQuestions=Array.isArray(x.guidedTriedAppQuestions)?x.guidedTriedAppQuestions:[];
  const old=x.guidedTriedAppQuestions.find(v=>norm(v?.key||v?.q)===key);if(old){old.q=q;old.answer=answer||old.answer||'';old.lastAt=Date.now();old.count=Number(old.count||0)+1}else x.guidedTriedAppQuestions.push({key,q,answer,lastAt:Date.now(),count:1});
  x.guidedTriedAppQuestions=x.guidedTriedAppQuestions.slice(-30);try{save()}catch(_e){}
}
function install(){
  const flow=$('guidedFlow');if(!flow||$('reviewJumpBar'))return;
  const bar=document.createElement('div');bar.id='reviewJumpBar';bar.innerHTML=`<div class="rj-title"><b>Jump within this concept</b><span id="rjContext"></span></div><div class="rj-controls"><button id="rjFlash" type="button">🃏 Flashcard</button><button id="rjMem" type="button">🧠 Memorise</button><select id="rjApps" aria-label="Previously tried Application questions"></select><button id="rjOpenApp" type="button">Open</button></div><div id="rjMsg" class="rj-msg"></div>`;
  const note=$('gfFilterNote');if(note)note.insertAdjacentElement('afterend',bar);else flow.querySelector('.gf-steps')?.insertAdjacentElement('beforebegin',bar);
  const st=document.createElement('style');st.id='reviewJumpStyle';st.textContent=`#reviewJumpBar{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px 12px;align-items:center;margin:0 0 10px;padding:9px 11px;border:1px solid #dbe3ee;border-radius:14px;background:#fff;box-shadow:0 5px 18px #0f172a08}.rj-title{display:flex;gap:7px;align-items:baseline;min-width:0}.rj-title b{font-size:12px;color:#334155}.rj-title span{font-size:10px;color:#64748b;font-weight:800;white-space:nowrap}.rj-controls{display:grid;grid-template-columns:auto auto minmax(180px,1fr) auto;gap:6px;min-width:0}.rj-controls button,.rj-controls select{min-height:38px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#334155;padding:7px 9px;font:800 11px Arial;min-width:0}.rj-controls button{cursor:pointer}.rj-controls button.active{background:#4338ca;color:#fff;border-color:#4338ca}.rj-controls button:disabled,.rj-controls select:disabled{opacity:.5;cursor:not-allowed}.rj-msg{grid-column:1/-1;min-height:0;color:#64748b;font-size:10px;font-weight:800;line-height:1.3}.rj-msg:empty{display:none}body.gf-classic #reviewJumpBar{display:none!important}@media(max-width:800px){#reviewJumpBar{grid-template-columns:1fr}.rj-controls{grid-template-columns:1fr 1fr}.rj-controls select{grid-column:1/-1}.rj-controls #rjOpenApp{grid-column:1/-1}.rj-title{justify-content:space-between}}@media(max-width:480px){.rj-controls{grid-template-columns:1fr}.rj-controls select,.rj-controls #rjOpenApp{grid-column:auto}.rj-title{display:grid;gap:2px}.rj-title span{white-space:normal}}`;
  document.head.appendChild(st);
  $('rjFlash').onclick=()=>jumpFlash();$('rjMem').onclick=()=>jumpMem();$('rjOpenApp').onclick=()=>openSelectedApp();$('rjApps').addEventListener('change',()=>{if($('rjApps').value)msg('Press Open to return to this exact Application question.')});
  document.addEventListener('click',e=>{if(e.target?.closest?.('#gfMarkApp'))rememberAttempt()},{capture:true});
  new MutationObserver(schedule).observe(flow,{childList:true,subtree:true,attributes:true,attributeFilter:['data-stage','data-process-mode','data-process-skill']});
  refresh();
}
function msg(t){const m=$('rjMsg');if(m)m.textContent=t||''}
function schedule(){clearTimeout(timer);timer=setTimeout(refresh,45)}
function refresh(){
  const bar=$('reviewJumpBar');if(!bar)return;
  if(processMode()){bar.classList.add('rj-process');$('rjContext').textContent='Process Skill';$('rjApps').innerHTML='<option value="">Application history is available for Science concepts</option>';$('rjApps').disabled=true;$('rjOpenApp').disabled=true;const s=stage();$('rjFlash').classList.toggle('active',s.endsWith('flash'));$('rjMem').classList.toggle('active',s.endsWith('mem'));return}
  bar.classList.remove('rj-process');const i=sciIndex(),e=(typeof BANK!=='undefined'&&i>=0)?BANK[i]:null;if(!e)return;$('rjContext').textContent=`#${e.id} ${e.topic||''}`;
  const h=history(i),select=$('rjApps'),old=select.value;select.disabled=!h.length;$('rjOpenApp').disabled=!h.length;select.innerHTML=h.length?`<option value="">Applications tried / shown (${h.length})</option>`+h.map((x,n)=>`<option value="${esc(x.key)}">${n+1}. ${esc(x.q.length>105?x.q.slice(0,102)+'…':x.q)}</option>`).join(''):'<option value="">No previous Application questions yet</option>';if(h.some(x=>x.key===old))select.value=old;
  const s=stage();$('rjFlash').classList.toggle('active',s==='flash');$('rjMem').classList.toggle('active',s==='mem');const sig=`${i}|${s}|${h.length}`;if(sig!==lastSig){lastSig=sig;msg('Flashcard and Memorise can be reopened without changing mastery. Choose any previous Application question to revisit it.')}
}
async function jumpFlash(){if(busy)return;if(processMode()){const s=stage();if(s.endsWith('mem'))$('gpmBackFlash')?.click();else if(s.endsWith('app'))$('gpmAppBackFlash')?.click();msg('Opened Flashcard. Existing progress is unchanged.');return}busy=true;try{const s=stage();if(s==='mem'||s==='app')nav()?.backToFlash?.();await waitFor(()=>stage()==='flash',2500);msg('Opened Flashcard. Existing progress is unchanged.')}finally{busy=false;refresh()}}
async function ensureMem(){
  if(processMode()){const s=stage();if(s.endsWith('app'))$('gpmAppBackMem')?.click();else if(s.endsWith('flash'))$('gpmToMem')?.click();return waitFor(()=>stage().endsWith('mem'),2500)}
  let s=stage();if(s==='mem')return true;if(s==='app'){nav()?.backToMem?.();return waitFor(()=>stage()==='mem',2500)}
  if(s!=='flash')return false;const rr=nav()?.getReviewReturn?.();if(rr==='mem'){nav()?.returnFromFlash?.();return waitFor(()=>stage()==='mem',2500)}if(rr==='app'){nav()?.returnFromFlash?.();if(await waitFor(()=>stage()==='app',2500)){nav()?.backToMem?.();return waitFor(()=>stage()==='mem',2500)}return false}
  const i=sciIndex(),snap=cloneRecord(i),go=$('gfFlashConfident');if(!go)return false;go.click();const ok=await waitFor(()=>stage()==='mem',3000);restoreRecord(i,snap);return ok;
}
async function jumpMem(){if(busy)return;busy=true;try{const ok=await ensureMem();msg(ok?'Opened Memorise directly. Existing progress is unchanged.':'Could not open Memorise yet. Try again after the current screen finishes loading.')}finally{busy=false;refresh()}}
async function ensureAppPreservingProgress(){
  if(stage()==='app'&&$('gfAppAnswer'))return true;const i=sciIndex(),snap=cloneRecord(i);if(!await ensureMem())return false;const ta=$('gfRecall'),check=$('gfCheckRecall'),e=BANK[i];if(!ta||!check||!e)return false;ta.value=e.phrase||'';ta.dispatchEvent(new Event('input',{bubbles:true}));check.click();const ok=await waitFor(()=>stage()==='app'&&!!$('gfAppAnswer'),25000);restoreRecord(i,snap);return ok;
}
async function setHiddenQuestion(key){
  const fresh=$('freshAppBtn'),q=$('appQuestion');if(!fresh||!q)return false;for(let n=0;n<24;n++){if(norm(q.textContent)===key)return true;fresh.click();await sleep(35)}return norm(q.textContent)===key;
}
async function refreshGuidedApp(){const n=nav();if(!n)return false;n.backToFlash?.();if(!await waitFor(()=>stage()==='flash',2500))return false;n.returnFromFlash?.();return waitFor(()=>stage()==='app'&&!!$('gfAppAnswer'),3000)}
async function openSelectedApp(){
  if(busy||processMode())return;const key=$('rjApps')?.value;if(!key){msg('Choose a previous Application question first.');return}busy=true;$('rjOpenApp').disabled=true;msg('Opening that exact Application question…');
  try{
    const i=sciIndex(),item=history(i).find(x=>x.key===key);if(!await ensureAppPreservingProgress()){msg('Could not prepare Application mode. Try again once the page finishes loading.');return}
    if(!await setHiddenQuestion(key)){msg('That older question is no longer in the current question bank. Your progress is still safe.');return}
    const currentQ=norm($('gfBody')?.querySelector('.gf-prompt')?.textContent||'');if(currentQ!==key)await refreshGuidedApp();
    const ta=$('gfAppAnswer');if(ta){ta.value=item?.answer||'';ta.dispatchEvent(new Event('input',{bubbles:true}));ta.focus()}
    msg(item?.answer?'Opened the exact question with your last submitted answer. You can edit and try it again.':'Opened the exact question. Your previous mastery/progress has not been changed.');
  }finally{busy=false;refresh()}
}
function boot(){tries++;if(!$('guidedFlow')||typeof BANK==='undefined'||!Array.isArray(BANK)||typeof rec!=='function'||typeof save!=='function'||!nav()||!proc()){if(tries<240)setTimeout(boot,80);return}install()}
boot();
})();