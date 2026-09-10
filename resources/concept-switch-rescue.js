(()=>{
const VERSION='20260910f';
const TARGET_KEY='psleScience_exact_sidebar_target_v1';
let tries=0,busy=false;
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const waitFor=(fn,ms=5000)=>new Promise(resolve=>{const st=Date.now();const tick=()=>{let ok=false;try{ok=!!fn()}catch(_e){}if(ok)return resolve(true);if(Date.now()-st>=ms)return resolve(false);setTimeout(tick,60)};tick()});
function student(){try{return (localStorage.getItem('psleScience_active_student')||'student').toLowerCase()}catch(_e){return 'student'}}
function proc(){return window.PSLE_PROCESS_MERGE||null}
function nav(){return window.PSLE_GUIDED_NAV||null}
function knownScience(i){try{return new Set(rec(i)?.appCorrectDates||[]).size>=1}catch(_e){return false}}
function setMessage(t){const m=$('gpsMessage');if(m)m.textContent=t||''}
function targetFromRow(row){const kind=row?.dataset?.kind,id=Number(row?.dataset?.id);if(!kind||!Number.isFinite(id))return null;return{kind,id,student:student(),at:Date.now()}}
function saveTarget(t){try{localStorage.setItem(TARGET_KEY,JSON.stringify(t))}catch(_e){}}
function reloadTarget(t){saveTarget(t);try{window.parent.location.replace(`trainer180-app.html?v=${VERSION}&nav=${Date.now()}`)}catch(_e){location.reload()}}
function scienceStageIsPlainFlash(){const f=$('guidedFlow');if(!f||proc()?.isActive?.())return false;const stage=String(f.dataset.stage||nav()?.getStage?.()||'flash');const back=String(f.dataset.reviewReturn||nav()?.getReviewReturn?.()||'');return stage==='flash'&&!back}
async function settleExactScience(i){
  const e=typeof BANK!=='undefined'?BANK[i]:null,topic=$('gfTopic'),status=$('gfStatus'),search=$('gfSearch'),sort=$('gfSort');
  if(!e||!topic||!status||!search||!sort)return false;
  try{speechSynthesis.cancel()}catch(_e){}
  topic.disabled=status.disabled=search.disabled=sort.disabled=false;
  topic.value='all';topic.dispatchEvent(new Event('change',{bubbles:true}));
  status.value=knownScience(i)?'known':'notdone';status.dispatchEvent(new Event('change',{bubbles:true}));
  search.value=`${e.id} ${e.topic||''}`.trim();search.dispatchEvent(new Event('input',{bubbles:true}));
  // guided-concept-flow-v5 debounces search for 120 ms. Let that finish first.
  await sleep(190);
  try{
    if(typeof current==='function'&&current()!==i){
      // order and pos are the trainer's shared lexical navigation state.
      // Put the requested concept in that state, then use the guided Sort change
      // to make its private render() position itself on the same concept.
      order=[i];pos=0;
      sort.dispatchEvent(new Event('change',{bubbles:true}));
      await sleep(45);
    }
  }catch(_e){}
  let ok=false;try{ok=typeof current==='function'&&current()===i}catch(_e){}
  if(ok){
    setMessage(`Opened #${e.id} ${e.topic||''}. Tap another item to switch.`);
    // Keep the sidebar on the same status list so Known → Known switching is easy.
    const tab=$(knownScience(i)?'gpsKnown':'gpsNotDone');
    if(tab&&!tab.classList.contains('on'))tab.click();
  }
  return ok;
}
async function openScience(i,fromReload=false){
  if(!Number.isInteger(i)||i<0||typeof BANK==='undefined'||i>=BANK.length)return;
  if(!scienceStageIsPlainFlash()){
    if(!fromReload){setMessage('Switching to that exact concept…');reloadTarget({kind:'science',id:i,student:student(),at:Date.now()})}
    return;
  }
  const ok=await settleExactScience(i);
  if(!ok&&!fromReload){setMessage('Reloading that exact concept…');reloadTarget({kind:'science',id:i,student:student(),at:Date.now()})}
}
async function openProcess(id,fromReload=false){
  const p=proc(),f=$('guidedFlow');if(!p||!f)return;
  const scienceStage=String(f.dataset.stage||'flash');
  if(!p.isActive?.()&&scienceStage!=='flash'){
    if(!fromReload)reloadTarget({kind:'process',id,student:student(),at:Date.now()});
    return;
  }
  try{p.enter?.(id);setMessage(`Opened Process Skill P${id}.`)}catch(_e){if(!fromReload)reloadTarget({kind:'process',id,student:student(),at:Date.now()})}
}
function captureSidebarClick(e){
  const row=e.target?.closest?.('#gpsList .gps-row');if(!row)return;
  const t=targetFromRow(row);if(!t)return;
  e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
  if(busy)return;busy=true;
  Promise.resolve(t.kind==='science'?openScience(t.id,false):openProcess(t.id,false)).finally(()=>{busy=false});
}
async function openPending(){
  let t=null;try{t=JSON.parse(localStorage.getItem(TARGET_KEY)||'null')}catch(_e){}
  if(!t||t.student!==student())return;
  try{localStorage.removeItem(TARGET_KEY)}catch(_e){}
  if(t.kind==='science'){
    await waitFor(()=>scienceStageIsPlainFlash(),5000);
    const ok=await settleExactScience(Number(t.id));
    if(!ok)setMessage('Could not open that concept. Tap it once more.');
  }else{
    await waitFor(()=>!!proc(),5000);await openProcess(Number(t.id),true);
  }
}
function enhance(){
  const foot=$('guidedProgressSidebar')?.querySelector('.gps-foot');
  if(foot&&!$('gpsExactSwitchNote')){
    const n=document.createElement('div');n.id='gpsExactSwitchNote';
    n.style.cssText='margin-top:7px;padding:8px 9px;border-radius:9px;background:#ecfdf5;color:#047857;font-weight:800;line-height:1.35';
    n.innerHTML='↔ <b>Direct switch enabled.</b> Tap any item in Known or Not done to open that exact item.';
    foot.appendChild(n);
  }
}
function boot(){
  tries++;
  if(!$('guidedFlow')||!$('guidedProgressSidebar')||typeof BANK==='undefined'||!Array.isArray(BANK)||!proc()){
    if(tries<240)setTimeout(boot,80);return;
  }
  // Register before older sidebar/revisit handlers and own the click completely.
  document.addEventListener('click',captureSidebarClick,true);
  enhance();
  setTimeout(openPending,120);
}
boot();
})();
