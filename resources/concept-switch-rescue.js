(()=>{
'use strict';
if(window.__PSLE_GOTO_ROUTER_V3__)return;
window.__PSLE_GOTO_ROUTER_V3__=true;
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const proc=()=>window.PSLE_PROCESS_MERGE||null;
const scienceIndex=()=>{try{return typeof current==='function'?current():-1}catch(_e){return -1}};

function getGoto(){
  try{return new URL(window.parent.location.href).searchParams.get('goto')||''}catch(_e){return ''}
}
function clearGoto(){
  try{
    const u=new URL(window.parent.location.href);u.searchParams.delete('goto');u.searchParams.delete('nav');
    window.parent.history.replaceState(null,'',u.pathname+u.search+u.hash);
  }catch(_e){}
}
function message(t){const m=$('gpsMessage');if(m)m.textContent=t||''}

async function openScience(idx){
  idx=Number(idx);if(!Number.isInteger(idx)||idx<0||!Array.isArray(window.BANK)||idx>=BANK.length)return false;
  const e=BANK[idx];
  if(proc()?.isActive?.())try{proc().exitToScience(idx)}catch(_e){}
  const exactQuery=`${e.id} ${e.topic||''} ${e.category||''} ${e.phrasePrompt||''}`.trim();
  for(let attempt=0;attempt<12;attempt++){
    const topic=$('gfTopic'),status=$('gfStatus'),search=$('gfSearch'),sort=$('gfSort');
    if(topic&&status&&search){
      topic.disabled=false;status.disabled=false;search.disabled=false;if(sort)sort.disabled=false;
      topic.value='all';topic.dispatchEvent(new Event('change',{bubbles:true}));
      status.value='all';status.dispatchEvent(new Event('change',{bubbles:true}));
      if(sort){sort.value='book';sort.dispatchEvent(new Event('change',{bubbles:true}))}
      search.value=exactQuery;search.dispatchEvent(new Event('input',{bubbles:true}));
      await sleep(220);
      if(scienceIndex()===idx){message(`Opened #${e.id} ${e.topic||''}.`);return true}
    }
    await sleep(100);
  }
  message(`Could not open #${e.id}.`);return false;
}
async function openProcess(id){
  id=Number(id);for(let attempt=0;attempt<15;attempt++){
    const p=proc();
    if(p?.enter){
      try{p.enter(id)}catch(_e){}
      await sleep(120);
      if(p.isActive?.()&&Number(p.getCurrentId?.())===id){message(`Opened Process Skill P${id}.`);return true}
    }
    await sleep(100);
  }
  message(`Could not open Process Skill P${id}.`);return false;
}

async function boot(){
  const raw=getGoto();if(!raw)return;
  const m=raw.match(/^(science|process):(\d+)$/);if(!m)return;
  message('Opening selected concept…');
  const ok=m[1]==='science'?await openScience(Number(m[2])):await openProcess(Number(m[2]));
  if(ok)clearGoto();
}
setTimeout(boot,120);
})();
