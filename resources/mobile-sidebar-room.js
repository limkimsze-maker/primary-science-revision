(()=>{
'use strict';
if(window.__PSLE_MOBILE_SIDEBAR_ROOM_V6__)return;
window.__PSLE_MOBILE_SIDEBAR_ROOM_V6__=true;
const d=document,$=id=>d.getElementById(id);
let tries=0;
const mobile=()=>matchMedia('(max-width:700px)').matches;

function patchRespirationClarity(){
  try{
    if(!Array.isArray(window.BANK))return;
    const respiratory=window.BANK.find(x=>Number(x?.id)===51);
    if(respiratory){
      respiratory.topic='Respiratory system and circulatory system';
      respiratory.phrasePrompt='What is the function of the respiratory system, and how does it work with the circulatory system?';
      respiratory.phrase='The respiratory system takes in oxygen and removes carbon dioxide through gaseous exchange at the lungs. The circulatory system then transports oxygen to body parts and carries carbon dioxide back to the lungs for removal.';
      respiratory.modelApplicationAnswer=respiratory.phrase;
      respiratory.rubric=['Respiratory system takes in oxygen','Respiratory system removes carbon dioxide','Gaseous exchange occurs at the lungs','Circulatory system transports oxygen to body parts','Circulatory system carries carbon dioxide back to the lungs'];
    }
    const respiration=window.BANK.find(x=>Number(x?.id)===65);
    if(respiration){
      respiration.topic='Respiration — definition';
      respiration.phrasePrompt='What is respiration?';
      respiration.phrase='Respiration is the process in living cells that releases energy from food. Oxygen is used, while carbon dioxide and water are produced. Respiration is not the same as breathing.';
      respiration.modelApplicationAnswer=respiration.phrase;
      respiration.rubric=['Respiration occurs in living cells','Energy is released from food','Oxygen is used','Carbon dioxide and water are produced','Respiration is different from breathing'];
    }
    if(typeof window.render==='function')window.render();
  }catch(_e){}
}

function installDebugEntry(){
  const side=$('guidedProgressSidebar');
  if(!side||$('gpsDebugProgress'))return;
  const tools=side.querySelector('.gps-tools');
  if(!tools)return;
  const btn=d.createElement('button');
  btn.id='gpsDebugProgress';
  btn.type='button';
  btn.textContent='🛠 Debug progress';
  btn.title='Teacher/debug: change Known items back to Not done';
  btn.style.marginTop='6px';
  btn.style.borderColor='#c7d2fe';
  btn.style.background='#eef2ff';
  btn.style.color='#3730a3';
  btn.onclick=e=>{
    e.preventDefault();
    e.stopPropagation();
    try{window.top.location.href='debug.html?v=20260910b'}catch(_e){window.location.href='debug.html?v=20260910b'}
  };
  tools.appendChild(btn);
}

function installStyle(){
  if($('mobileSidebarRoomStyleV6'))return;
  const s=d.createElement('style');
  s.id='mobileSidebarRoomStyleV6';
  s.textContent=`
  /* Framework codes stay available in the framework filter/coach, but are never
     rendered beside individual mastery-list rows. Keeping them out of the row
     layout prevents F1/F2 label flicker and reflow while the list is updated. */
  #guidedProgressSidebar .gps-row .fc-tag{display:none!important}
  #gpsDebugProgress{font-weight:900!important}

  @media(max-width:700px){
    #guidedProgressSidebar{
      top:max(6px,env(safe-area-inset-top))!important;
      right:6px!important;
      bottom:max(6px,env(safe-area-inset-bottom))!important;
      left:6px!important;
      height:auto!important;
      max-height:none!important;
      min-height:0!important;
      overflow:hidden!important;
      display:none!important;
      flex-direction:column!important;
      overscroll-behavior:contain!important;
    }
    .ud-list-open #guidedProgressSidebar{display:flex!important}
    #guidedProgressSidebar .gps-head,
    #guidedProgressSidebar .gps-find,
    #guidedProgressSidebar .gps-findhint,
    #guidedProgressSidebar .gps-tabs,
    #guidedProgressSidebar .gps-tools,
    #guidedProgressSidebar .gps-message{flex:0 0 auto!important}
    #guidedProgressSidebar .gps-list{
      position:relative!important;
      display:block!important;
      flex:1 1 auto!important;
      min-height:0!important;
      max-height:none!important;
      overflow-x:hidden!important;
      overflow-y:auto!important;
      -webkit-overflow-scrolling:touch!important;
      overscroll-behavior-y:contain!important;
      touch-action:pan-y!important;
      scroll-behavior:auto!important;
      scroll-padding-top:8px!important;
      scroll-padding-bottom:12px!important;
      padding:0 7px 14px!important;
    }
    #guidedProgressSidebar .gps-row{
      min-height:54px!important;
      touch-action:pan-y!important;
      scroll-margin-top:8px!important;
      scroll-margin-bottom:8px!important;
    }
    #guidedProgressSidebar .gps-foot{display:none!important}
    #fcMap{display:none!important}
  }`;
  d.head.appendChild(s);
}

function resetListTop(){
  const l=$('gpsList');
  if(!mobile()||!l)return;
  requestAnimationFrame(()=>{l.scrollTop=0;});
}

function wire(){
  const side=$('guidedProgressSidebar'),list=$('gpsList');
  if(!side||!list)return false;
  patchRespirationClarity();
  installDebugEntry();
  installStyle();
  if(side.dataset.mobileScrollFixReadyV6)return true;
  side.dataset.mobileScrollFixReadyV6='1';

  // Only reset after actions that replace the list. Never adjust scroll while the user is swiping.
  ['gpsNotDone','gpsKnown'].forEach(id=>$(id)?.addEventListener('click',()=>setTimeout(resetListTop,70)));
  $('gpsFind')?.addEventListener('input',()=>setTimeout(resetListTop,40));
  d.addEventListener('change',e=>{if(e.target?.id==='fcFrameworkFilter')setTimeout(resetListTop,70)});

  // Opening the mobile panel starts at the top without touching scroll position during a swipe.
  d.addEventListener('click',e=>{
    if(e.target?.closest?.('#udListToggle')&&!d.body.classList.contains('ud-list-open')){
      setTimeout(resetListTop,60);
    }
  },true);

  return true;
}

function boot(){tries++;patchRespirationClarity();installDebugEntry();if(wire())return;if(tries<240)setTimeout(boot,80)}
boot();
})();
