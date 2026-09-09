(()=>{
'use strict';
if(window.__PSLE_MOBILE_SIDEBAR_ROOM__)return;
window.__PSLE_MOBILE_SIDEBAR_ROOM__=true;
const d=document,$=id=>d.getElementById(id);
let tries=0,observer=null;
const mobile=()=>matchMedia('(max-width:700px)').matches;
const visible=el=>!!el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
function afterLayout(fn){requestAnimationFrame(()=>requestAnimationFrame(fn));}
function list(){return $('gpsList')}
function resetTop(){const l=list();if(!l||!mobile())return;l.scrollTop=0;}
function alignFirstVisibleRow(){
  const l=list(),side=$('guidedProgressSidebar');
  if(!mobile()||!l||!side||!d.body.classList.contains('ud-list-open'))return;
  const box=l.getBoundingClientRect();
  if(box.height<20)return;
  if(l.scrollTop<=2){l.scrollTop=0;return;}
  const rows=[...l.querySelectorAll('.gps-row')].filter(visible);
  const first=rows.find(r=>r.getBoundingClientRect().bottom>box.top+1);
  if(!first)return;
  const r=first.getBoundingClientRect();
  /* Never leave the first visible concept chopped off under the controls. */
  if(r.top<box.top-0.5&&r.bottom>box.top+4){
    l.scrollTop=Math.max(0,l.scrollTop-(box.top-r.top)-7);
  }
}
function settle(){afterLayout(()=>{alignFirstVisibleRow();setTimeout(alignFirstVisibleRow,80)});}
function installStyle(){
  if($('mobileSidebarRoomStyle'))return;
  const s=d.createElement('style');s.id='mobileSidebarRoomStyle';s.textContent=`
  @media(max-width:700px){
    #guidedProgressSidebar .gps-list{scroll-padding-top:8px!important;scroll-padding-bottom:10px!important;overflow-anchor:none!important}
    #guidedProgressSidebar .gps-row{scroll-margin-top:8px!important;scroll-margin-bottom:8px!important}
    #guidedProgressSidebar .gps-message{position:relative!important;z-index:1!important;background:#fff!important}
  }`;
  d.head.appendChild(s);
}
function wire(){
  const side=$('guidedProgressSidebar'),l=list();
  if(!side||!l)return false;
  installStyle();
  if(!l.dataset.mobileRoomReady){
    l.dataset.mobileRoomReady='1';
    observer=new MutationObserver(()=>settle());
    observer.observe(l,{childList:true,subtree:true});
  }
  ['gpsNotDone','gpsKnown'].forEach(id=>$(id)?.addEventListener('click',()=>setTimeout(resetTop,120)));
  $('gpsFind')?.addEventListener('input',()=>setTimeout(resetTop,80));
  d.addEventListener('change',e=>{if(e.target?.id==='fcFrameworkFilter')setTimeout(resetTop,120)});
  d.addEventListener('click',e=>{
    if(e.target?.closest?.('#udListToggle'))setTimeout(settle,40);
    if(e.target?.closest?.('#gpsOpenFirst'))setTimeout(settle,80);
  });
  addEventListener('resize',settle,{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',settle,{passive:true});
  new MutationObserver(()=>{if(d.body.classList.contains('ud-list-open'))settle()}).observe(d.body,{attributes:true,attributeFilter:['class']});
  settle();
  return true;
}
function boot(){tries++;if(wire())return;if(tries<200)setTimeout(boot,80)}
boot();
})();
