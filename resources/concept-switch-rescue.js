(()=>{
const VERSION='20260910h';
const TARGET_KEY='psleScience_exact_sidebar_target_v3';
let tries=0,busy=false;
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function student(){try{return (localStorage.getItem('psleScience_active_student')||'student').toLowerCase()}catch(_e){return 'student'}}
function proc(){return window.PSLE_PROCESS_MERGE||null}
function knownScience(i){try{return new Set(rec(i)?.appCorrectDates||[]).size>=1}catch(_e){return false}}
function setMessage(t){const m=$('gpsMessage');if(m)m.textContent=t||''}
function targetFromRow(row){const kind=row?.dataset?.kind,id=Number(row?.dataset?.id);if(!kind||!Number.isFinite(id))return null;return{kind,id,student:student(),at:Date.now()}}
function saveTarget(t){try{localStorage.setItem(TARGET_KEY,JSON.stringify(t))}catch(_e){}}
function reloadTarget(t){
  if(busy)return;busy=true;saveTarget(t);setMessage('Opening that exact concept…');
  try{speechSynthesis.cancel()}catch(_e){}
  const url=`trainer180-app.html?v=${VERSION}&nav=${Date.now()}`;
  try{window.parent.location.replace(url)}catch(_e){location.replace(url)}
}
function captureSidebarClick(e){
  const row=e.target?.closest?.('#gpsList .gps-row');if(!row)return;
  const t=targetFromRow(row);if(!t)return;
  e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
  reloadTarget(t);
}
async function openScience(i){
  if(!Number.isInteger(i)||i<0||typeof BANK==='undefined'||i>=BANK.length)return false;
  const e=BANK[i],topic=$('gfTopic'),status=$('gfStatus'),search=$('gfSearch'),sort=$('gfSort');
  if(!e||!topic||!status||!search||!sort)return false;

  // First synchronise the guided flow's own picker state.
  topic.disabled=status.disabled=search.disabled=sort.disabled=false;
  topic.value='all';topic.dispatchEvent(new Event('change',{bubbles:true}));
  status.value=knownScience(i)?'known':'notdone';status.dispatchEvent(new Event('change',{bubbles:true}));
  search.value=`${e.id} ${e.topic||''}`.trim();search.dispatchEvent(new Event('input',{bubbles:true}));

  // Search is debounced by 120 ms in guided-concept-flow-v5.
  await sleep(220);

  let ok=false;try{ok=typeof current==='function'&&current()===i}catch(_e){}
  if(!ok){
    try{
      // The core trainer keeps the current concept in shared order/pos.
      // Set those directly, then trigger Sort so the guided flow runs its
      // private applyPicker(true) + render() on the exact same concept.
      order=[i];pos=0;
      sort.dispatchEvent(new Event('change',{bubbles:true}));
      await sleep(70);
      ok=typeof current==='function'&&current()===i;
    }catch(_e){ok=false}
  }

  const meta=String($('gfMeta')?.textContent||'');
  if(ok&&!meta.includes(`Concept ${e.id} `)){
    try{sort.dispatchEvent(new Event('change',{bubbles:true}));await sleep(50)}catch(_e){}
  }
  try{ok=typeof current==='function'&&current()===i&&String($('gfMeta')?.textContent||'').includes(`Concept ${e.id} `)}catch(_e){ok=false}

  if(ok){
    setMessage(`Opened #${e.id} ${e.topic||''}. Tap any other concept to switch.`);
    // Leave the mastery sidebar on the same list, so Known → Known works immediately.
    const tab=$(knownScience(i)?'gpsKnown':'gpsNotDone');
    if(tab&&!tab.classList.contains('on'))tab.click();
    return true;
  }
  setMessage(`Could not open #${e.id}. Tap it again.`);return false;
}
async function openPending(){
  let t=null;try{t=JSON.parse(localStorage.getItem(TARGET_KEY)||'null')}catch(_e){}
  if(!t||t.student!==student())return;
  try{localStorage.removeItem(TARGET_KEY)}catch(_e){}
  if(t.kind==='process'){
    try{proc()?.enter?.(Number(t.id));setMessage(`Opened Process Skill P${t.id}.`)}catch(_e){setMessage(`Could not open Process Skill P${t.id}.`)}
    return;
  }
  await openScience(Number(t.id));
}
function enhance(){
  const foot=$('guidedProgressSidebar')?.querySelector('.gps-foot');
  if(foot&&!$('gpsExactSwitchNote')){
    const n=document.createElement('div');n.id='gpsExactSwitchNote';
    n.style.cssText='margin-top:7px;padding:8px 9px;border-radius:9px;background:#ecfdf5;color:#047857;font-weight:800;line-height:1.35';
    n.innerHTML='↔ <b>Switch anytime.</b> Tap any Known or Not done item to open it.';
    foot.appendChild(n);
  }
}
function boot(){
  tries++;
  if(!$('guidedFlow')||!$('guidedProgressSidebar')||typeof BANK==='undefined'||!Array.isArray(BANK)||!proc()){
    if(tries<240)setTimeout(boot,80);return;
  }
  document.addEventListener('click',captureSidebarClick,true);
  enhance();
  setTimeout(openPending,150);
}
boot();
})();
