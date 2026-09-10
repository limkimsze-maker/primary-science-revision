(()=>{
const VERSION='20260910f';
const TARGET_KEY='psleScience_sidebar_target_v3';
let tries=0;
const $=id=>document.getElementById(id);
const parse=(v,f)=>{try{return JSON.parse(v||'')||f}catch(_e){return f}};
function student(){try{return (localStorage.getItem('psleScience_active_student')||'student').toLowerCase()}catch(_e){return 'student'}}
function api(){return window.PSLE_PROCESS_MERGE||null}
function flow(){return $('guidedFlow')}
function scienceKnown(i){try{return new Set(rec(i)?.appCorrectDates||[]).size>=1}catch(_e){return false}}
function currentScience(){try{return typeof current==='function'?current():-1}catch(_e){return -1}}
function targetFromRow(row){const kind=row?.dataset?.kind,id=Number(row?.dataset?.id);if(!kind||!Number.isFinite(id))return null;return{kind,id,student:student(),at:Date.now()}}
function sameTarget(t){try{if(t.kind==='process')return !!api()?.isActive?.()&&Number(api()?.getCurrentId?.())===t.id;return !api()?.isActive?.()&&currentScience()===t.id}catch(_e){return false}}
function hardOpen(target){
  try{speechSynthesis.cancel()}catch(_e){}
  localStorage.setItem(TARGET_KEY,JSON.stringify(target));
  const url=`trainer180-app.html?v=${VERSION}&nav=${Date.now()}`;
  try{window.parent.location.replace(url)}catch(_e){location.replace(url)}
}
function captureAnySidebarClick(e){
  const row=e.target?.closest?.('#gpsList .gps-row');if(!row)return;
  const target=targetFromRow(row);if(!target)return;
  e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
  if(sameTarget(target)){const m=$('gpsMessage');if(m)m.textContent='This concept is already open.';return}
  const m=$('gpsMessage');if(m)m.textContent='Opening the selected concept…';
  hardOpen(target);
}
function openTarget(){
  const t=parse(localStorage.getItem(TARGET_KEY),null);if(!t||t.student!==student())return false;
  if(t.kind==='process'){
    const a=api();if(!a?.enter)return false;
    localStorage.removeItem(TARGET_KEY);a.enter(t.id);
    const m=$('gpsMessage');if(m)m.textContent=`Opened Process Skill P${t.id}.`;
    return true;
  }
  const e=typeof BANK!=='undefined'?BANK[t.id]:null,status=$('gfStatus'),topic=$('gfTopic'),search=$('gfSearch'),f=flow();
  if(!e||!status||!topic||!search||!f)return false;
  localStorage.removeItem(TARGET_KEY);
  topic.disabled=false;status.disabled=false;search.disabled=false;
  topic.value='all';topic.dispatchEvent(new Event('change',{bubbles:true}));
  status.value=scienceKnown(t.id)?'known':'notdone';status.dispatchEvent(new Event('change',{bubbles:true}));
  search.value=`${e.id} ${e.topic||''}`.trim();search.dispatchEvent(new Event('input',{bubbles:true}));
  const m=$('gpsMessage');if(m)m.textContent=`Opened #${e.id} ${e.topic||''}. Tap any other concept to switch.`;
  setTimeout(()=>{
    const meta=String($('gfMeta')?.textContent||'');
    if(!meta.includes(`Concept ${e.id} `)){
      localStorage.setItem(TARGET_KEY,JSON.stringify(t));
      location.reload();
    }
  },350);
  return true;
}
function enhanceSidebar(){
  const side=$('guidedProgressSidebar');if(!side)return;
  const foot=side.querySelector('.gps-foot');if(foot&&!$('gpsSwitchNote')){
    const n=document.createElement('div');n.id='gpsSwitchNote';n.style.cssText='margin-top:7px;padding:8px 9px;border-radius:9px;background:#eef2ff;color:#3730a3;font-weight:800;line-height:1.35';
    n.innerHTML='↔ <b>Switch anytime.</b> Tap any Known or Not done concept to open it immediately.';foot.appendChild(n)
  }
}
function boot(){
  tries++;
  if(!flow()||!$('guidedProgressSidebar')||typeof BANK==='undefined'||!api()){if(tries<240)setTimeout(boot,80);return}
  document.addEventListener('click',captureAnySidebarClick,true);
  enhanceSidebar();
  new MutationObserver(enhanceSidebar).observe($('guidedProgressSidebar'),{childList:true,subtree:true});
  setTimeout(openTarget,120);
}
boot();
})();