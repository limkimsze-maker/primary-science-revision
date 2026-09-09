(()=>{
'use strict';
if(window.__PSLE_MOBILE_SIDEBAR_ROOM_V4__)return;
window.__PSLE_MOBILE_SIDEBAR_ROOM_V4__=true;
const d=document,$=id=>d.getElementById(id);
let tries=0;
const mobile=()=>matchMedia('(max-width:700px)').matches;

function installStyle(){
  if($('mobileSidebarRoomStyleV4'))return;
  const s=d.createElement('style');
  s.id='mobileSidebarRoomStyleV4';
  s.textContent=`
  /* Framework codes stay available in the framework filter/coach, but are never
     rendered beside individual mastery-list rows. Keeping them out of the row
     layout prevents F1/F2 label flicker and reflow while the list is updated. */
  #guidedProgressSidebar .gps-row .fc-tag{display:none!important}

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
  installStyle();
  if(side.dataset.mobileScrollFixReadyV4)return true;
  side.dataset.mobileScrollFixReadyV4='1';

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

function boot(){tries++;if(wire())return;if(tries<240)setTimeout(boot,80)}
boot();
})();
