(()=>{
if(window.__PSLE_FW192_SAFE_RUNTIME__)return;
window.__PSLE_FW192_SAFE_RUNTIME__=true;
try{window.__PSLE_FW192_RESTORE__?.()}catch(_e){}
const realSet=window.__PSLE_FW192_REAL_SET_INTERVAL__||window.setInterval.bind(window);
let lastKey='',busy=false;
function key(){
  try{const flow=document.getElementById('guidedFlow'),proc=flow?.dataset?.processMode==='1'?'p':'s',idx=typeof current==='function'?current():-1,stage=flow?.dataset?.stage||'';return `${proc}:${idx}:${stage}`}catch(_e){return''}
}
function light(){
  if(busy)return;busy=true;
  try{window.PSLE_FRAMEWORK_QUESTION_QUALITY?.patchCurrent?.()}catch(_e){}
  finally{setTimeout(()=>busy=false,40)}
}
function sidebar(){
  if(busy)return;busy=true;
  try{
    window.PSLE_FRAMEWORK_192?.refresh?.();
    window.PSLE_FRAMEWORK_QUESTION_QUALITY?.patchCurrent?.();
    window.PSLE_FRAMEWORK_QUESTION_QUALITY?.patchCountUI?.(window.PSLE_FRAMEWORK_192);
  }catch(_e){}
  finally{setTimeout(()=>busy=false,60)}
}
// Normal Recall/Memorise/Application movement only patches the visible question.
// The expensive 180-item audit runs once after authored variants load in trainer180-app.html.
realSet(()=>{const k=key();if(k&&k!==lastKey){lastKey=k;setTimeout(light,50)}},700);
document.addEventListener('click',e=>{
  if(e.target.closest('.gps-row,#gfNextConcept,#gfAppBackFlash,#gfAppBackMem,#freshAppBtn,#appTab,#phraseTab'))setTimeout(light,120);
});
document.addEventListener('change',e=>{
  if(['fcFrameworkFilter','gfStatus','gfTopic','gfSort'].includes(e.target?.id))setTimeout(sidebar,80);
});
document.addEventListener('psle-cloud-progress-updated',()=>setTimeout(light,100));
document.addEventListener('psle-framework-192-updated',()=>setTimeout(light,40));

// Teacher/debug viewer: shows the Application question for the currently selected
// flashcard without changing Known status, recall history or cloud progress.
const DBG_VERSION='20260909c';
const DBG_Q_FILES=[
 'resources/appvariants/01-diversity-classification.js',
 'resources/appvariants/02-plant-structures-functions.js',
 'resources/appvariants/03-life-cycles-reproduction.js',
 'resources/appvariants/04-human-animal-systems.js',
 'resources/appvariants/05-plant-transport-photosynthesis-respiration.js',
 'resources/appvariants/06-ecology-adaptations-environment.js',
 'resources/appvariants/07-matter-materials-changes-of-state.js',
 'resources/appvariants/08-light.js',
 'resources/appvariants/09-heat-thermal-expansion.js',
 'resources/appvariants/10-electricity-electromagnets-magnets.js',
 'resources/appvariants/11-energy-forces.js',
 'resources/appvariants/audited-framework-overrides.js',
 'resources/appvariants/prelim2026-source-overrides.js'
];
let dbgLoadPromise=null;
function dbgLoadScript(src){
  const bare=src.split('?')[0];
  if([...document.scripts].some(s=>String(s.src||'').includes(bare)))return Promise.resolve(true);
  return new Promise(resolve=>{const s=document.createElement('script');s.src=`${src}?v=${DBG_VERSION}`;s.async=false;s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.head.appendChild(s)});
}
async function dbgEnsureQuestions(){
  if(window.PSLE_PRELIM2026_SOURCE_OVERRIDES&&window.APP_VARIANTS)return true;
  if(dbgLoadPromise)return dbgLoadPromise;
  dbgLoadPromise=(async()=>{
    for(const src of DBG_Q_FILES)await dbgLoadScript(src);
    try{window.PSLE_FRAMEWORK_192?.refresh?.()}catch(_e){}
    try{window.PSLE_FRAMEWORK_QUESTION_QUALITY?.apply?.()}catch(_e){}
    try{window.PSLE_FRAMEWORK_192_VARIANTS?.apply?.()}catch(_e){}
    try{window.PSLE_FRAMEWORK_QUESTION_QUALITY?.apply?.()}catch(_e){}
    return true;
  })();
  return dbgLoadPromise;
}
function dbgEsc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function dbgInstall(){
  if(document.getElementById('psleDebugQuestionBtn'))return;
  const style=document.createElement('style');style.textContent=`
   #psleDebugQuestionBtn{position:fixed;left:10px;bottom:10px;z-index:100000;border:1px solid #94a3b8;background:#fff;color:#334155;border-radius:12px;padding:9px 12px;font:800 12px Arial;box-shadow:0 5px 18px #0f172a26;cursor:pointer}
   #psleDebugQuestionBtn:disabled{opacity:.6;cursor:wait}
   #psleDebugQuestionModal{position:fixed;inset:0;z-index:100001;background:#0f172abf;display:grid;place-items:center;padding:16px}
   #psleDebugQuestionModal .dq-card{width:min(760px,96vw);max-height:88vh;overflow:auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 24px 70px #0005;font-family:Arial,sans-serif;color:#172033}
   #psleDebugQuestionModal h3{margin:0 0 8px;font-size:22px}#psleDebugQuestionModal .dq-meta{font-size:12px;color:#64748b;font-weight:700;margin-bottom:14px;line-height:1.5}
   #psleDebugQuestionModal .dq-q{font-size:20px;line-height:1.5;font-weight:800;padding:16px;border:1px solid #c7d2fe;background:#eef2ff;border-radius:14px}
   #psleDebugQuestionModal details{margin-top:12px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}#psleDebugQuestionModal summary{cursor:pointer;font-weight:800}
   #psleDebugQuestionModal .dq-model{margin-top:9px;line-height:1.5;color:#334155}#psleDebugQuestionModal .dq-actions{display:flex;justify-content:flex-end;margin-top:14px}
   #psleDebugQuestionModal button{border:0;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer;background:#334155;color:#fff}
  `;document.head.appendChild(style);
  const btn=document.createElement('button');btn.id='psleDebugQuestionBtn';btn.type='button';btn.textContent='🔧 Debug App Q';document.body.appendChild(btn);
  btn.onclick=async()=>{
    const entered=window.prompt('Teacher password');
    if(entered===null)return;
    if(String(entered).trim()!=='67'){window.alert('Incorrect password.');return}
    btn.disabled=true;const old=btn.textContent;btn.textContent='Loading question…';
    try{
      await dbgEnsureQuestions();
      const flow=document.getElementById('guidedFlow');let id='',topic='',framework='',question='',source='',model='';
      if(flow?.dataset?.processMode==='1'){
        id=Number(flow.dataset.processSkill||0);const s=(window.PROCESS_SKILLS||[]).find(x=>Number(x.id)===id);const v=s?.variants?.[0]||{};
        topic=s?.topic||'Process Skill';framework='F6 · Experimental / Process-skill';question=v.q||s?.cue||'No Application question found.';source=s?.source||'Process Skills';model=v.model||s?.target||'';
      }else{
        const i=typeof current==='function'?current():-1,e=i>=0?BANK?.[i]:null,item=e?window.PSLE_FRAMEWORK_192?.byScienceId?.(e.id):null;
        if(item)try{window.PSLE_FRAMEWORK_192?.refresh?.()}catch(_e){}
        id=e?.id||'';topic=e?.topic||e?.category||'Science';framework=item?.framework?`${item.framework} · ${window.PSLE_FRAMEWORK_192?.meta?.[item.framework]?.name||''}`:'';question=item?.question||e?.applicationQuestion||e?.phrasePrompt||'No Application question found.';source=item?.source||'';model=item?.model||e?.modelApplicationAnswer||e?.phrase||'';
      }
      document.getElementById('psleDebugQuestionModal')?.remove();
      const modal=document.createElement('div');modal.id='psleDebugQuestionModal';modal.innerHTML=`<div class="dq-card"><h3>🔧 Application Question Debug</h3><div class="dq-meta">${id?`Linked item #${dbgEsc(id)} · `:''}${dbgEsc(topic)}${framework?`<br>${dbgEsc(framework)}`:''}${source?`<br>Source: ${dbgEsc(source)}`:''}<br><b>Progress is not changed by this viewer.</b></div><div class="dq-q">${dbgEsc(question)}</div>${model?`<details><summary>Show model answer</summary><div class="dq-model">${dbgEsc(model)}</div></details>`:''}<div class="dq-actions"><button id="dqClose" type="button">Close</button></div></div>`;document.body.appendChild(modal);modal.querySelector('#dqClose').onclick=()=>modal.remove();modal.onclick=e=>{if(e.target===modal)modal.remove()};
    }catch(e){alert('Could not load the Application question: '+(e?.message||e))}
    finally{btn.disabled=false;btn.textContent=old}
  };
}
setTimeout(dbgInstall,180);
setTimeout(sidebar,120);
})();