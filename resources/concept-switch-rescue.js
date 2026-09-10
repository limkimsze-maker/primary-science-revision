(()=>{
'use strict';
if(window.__PSLE_SIDEBAR_DIRECT_OPEN_V1__)return;
window.__PSLE_SIDEBAR_DIRECT_OPEN_V1__=true;

const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const proc=()=>window.PSLE_PROCESS_MERGE||null;
const nav=()=>window.PSLE_GUIDED_NAV||null;
let busy=false;

function message(text){const m=$('gpsMessage');if(m)m.textContent=text||''}
function stage(){return $('guidedFlow')?.dataset?.stage||'flash'}
function scienceIndex(){try{return typeof current==='function'?current():-1}catch(_e){return -1}}

async function ensureScienceFlash(){
  const p=proc();
  if(p?.isActive?.()){
    try{p.exitToScience?.(scienceIndex()>=0?scienceIndex():0)}catch(_e){}
    for(let i=0;i<20&&p?.isActive?.();i++)await sleep(30);
  }
  if(stage()!=='flash'){
    try{nav()?.backToFlash?.()}catch(_e){}
    for(let i=0;i<30&&stage()!=='flash';i++)await sleep(30);
  }
  return stage()==='flash'&&!proc()?.isActive?.();
}

async function openScience(idx){
  if(!Number.isInteger(idx)||idx<0||!Array.isArray(window.BANK)||idx>=BANK.length)return false;
  const e=BANK[idx];
  if(!e)return false;

  await ensureScienceFlash();

  const topic=$('gfTopic'),status=$('gfStatus'),search=$('gfSearch');
  if(!topic||!status||!search)return false;
  topic.disabled=false;status.disabled=false;search.disabled=false;

  // Use the guided flow's own picker. The combined ID + topic is unique,
  // so applyPicker(false) must select this exact concept.
  topic.value='all';
  topic.dispatchEvent(new Event('change',{bubbles:true}));
  status.value='all';
  status.dispatchEvent(new Event('change',{bubbles:true}));
  search.value=`${e.id} ${e.topic||''}`.trim();
  search.dispatchEvent(new Event('input',{bubbles:true}));

  for(let i=0;i<20;i++){
    await sleep(30);
    if(scienceIndex()===idx){
      message(`Opened #${e.id} ${e.topic||''}.`);
      return true;
    }
  }

  // Retry once after clearing any stale picker state.
  search.value='';
  search.dispatchEvent(new Event('input',{bubbles:true}));
  await sleep(150);
  topic.value='all';topic.dispatchEvent(new Event('change',{bubbles:true}));
  status.value='all';status.dispatchEvent(new Event('change',{bubbles:true}));
  search.value=`${e.id} ${e.topic||''}`.trim();
  search.dispatchEvent(new Event('input',{bubbles:true}));
  await sleep(220);
  const ok=scienceIndex()===idx;
  message(ok?`Opened #${e.id} ${e.topic||''}.`:`Could not open #${e.id}.`);
  return ok;
}

async function openTarget(kind,id){
  if(busy)return;
  busy=true;
  try{
    if(kind==='process'){
      const p=proc();
      if(p?.enter){p.enter(id);message(`Opened Process Skill P${id}.`);return}
    }else{
      await openScience(id);
    }
  }finally{busy=false}
}

// Capture first so no older row handler can override the selection.
document.addEventListener('click',e=>{
  const row=e.target?.closest?.('#gpsList .gps-row');
  if(!row)return;
  const kind=row.dataset.kind,id=Number(row.dataset.id);
  if(!kind||!Number.isFinite(id))return;
  e.preventDefault();
  e.stopPropagation();
  if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
  message('Opening selected concept…');
  openTarget(kind,id);
},true);
})();
