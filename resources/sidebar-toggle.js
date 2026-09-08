(()=>{
const KEY='psleScience_sidebar_visible_v2';
let tries=0;
const d=document,$=id=>d.getElementById(id);
function wanted(){try{return localStorage.getItem(KEY)==='1'}catch(_e){return false}}
function save(v){try{localStorage.setItem(KEY,v?'1':'0')}catch(_e){}}
function mobile(){return matchMedia('(max-width:700px)').matches}
function installStabilityFix(){
  if(window.__PSLE_GPS_SCROLL_STABILITY__)return;
  window.__PSLE_GPS_SCROLL_STABILITY__=true;
  const nativeScrollIntoView=Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView=function(...args){
    try{
      if(this?.classList?.contains('gps-row')&&this.closest?.('#gpsList'))return;
    }catch(_e){}
    return nativeScrollIntoView.apply(this,args);
  };
}
function showAllFrameworkRows(){
  const sel=$('fcFrameworkFilter');if(sel)sel.value='all';
  const list=$('gpsList');if(list){
    list.querySelectorAll('.gps-row,.gps-group').forEach(el=>el.style.display='');
  }
  const first=$('gpsOpenFirst');if(first)first.style.display='';
}
function installKnownListFix(){
  if(window.__PSLE_KNOWN_LIST_FRAMEWORK_FIX__)return;
  window.__PSLE_KNOWN_LIST_FRAMEWORK_FIX__=true;
  const reset=()=>setTimeout(showAllFrameworkRows,90);
  $('gpsKnown')?.addEventListener('click',reset);
  $('gpsNotDone')?.addEventListener('click',reset);
  showAllFrameworkRows();
}
function installMobilePanelFix(){
  if($('gpsMobilePanelFix'))return;
  const s=d.createElement('style');s.id='gpsMobilePanelFix';s.textContent=`
  @media(max-width:700px){
    #guidedProgressSidebar{
      top:max(6px,env(safe-area-inset-top))!important;
      bottom:max(6px,env(safe-area-inset-bottom))!important;
      left:6px!important;right:6px!important;
      height:auto!important;max-height:none!important;min-height:0!important;
      border-radius:18px!important;
    }
    .ud-list-open #guidedProgressSidebar{display:flex!important}
    #guidedProgressSidebar .gps-head{flex:0 0 auto!important;padding:10px 12px 7px!important}
    #guidedProgressSidebar .gps-find{flex:0 0 auto!important;padding:0 10px 4px!important}
    #guidedProgressSidebar .gps-findhint{flex:0 0 auto!important;padding:0 11px 5px!important}
    #guidedProgressSidebar .gps-tabs{flex:0 0 auto!important;padding:0 10px 6px!important}
    #guidedProgressSidebar .gps-tools{flex:0 0 auto!important;padding:0 10px 6px!important}
    #guidedProgressSidebar .gps-message{flex:0 0 auto!important;padding:0 11px 4px!important}
    #guidedProgressSidebar .gps-list{
      display:block!important;flex:1 1 0!important;min-height:0!important;max-height:none!important;
      overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding:0 7px 12px!important;
    }
    #guidedProgressSidebar .gps-row{display:grid!important;min-height:54px!important;padding:10px 8px!important}
    #guidedProgressSidebar .gps-row b{font-size:13px!important}
    #guidedProgressSidebar .gps-row small{font-size:10px!important}
    #guidedProgressSidebar .gps-foot{display:none!important}
    #fcMap{display:none!important}
    #fcFrameworkFilter{min-height:40px!important;font-size:12px!important}
  }
  `;d.head.appendChild(s);
}
function boot(){
  tries++;
  const layout=$('guidedLayout'),side=$('guidedProgressSidebar'),flow=$('guidedFlow');
  if(!layout||!side||!flow){if(tries<240)setTimeout(boot,80);return}
  installStabilityFix();
  installMobilePanelFix();
  installDesktop(layout,side,flow);
  wireMobile();
  installKnownListFix();
  addEventListener('resize',()=>{syncDesktop(layout);wireMobile()},{passive:true});
}
function installDesktop(layout,side,flow){
  if(!$('gpsSidebarToggleStyle')){
    const s=d.createElement('style');s.id='gpsSidebarToggleStyle';s.textContent=`
    #gfClassic{display:none!important}
    #gpsMasteryToggle{border:1px solid #c7d2fe;border-radius:11px;background:#fff;color:#3730a3;padding:8px 11px;min-height:40px;font:900 12px Arial;cursor:pointer;white-space:nowrap;box-shadow:0 3px 10px #0f172a0b}
    #gpsMasteryToggle:hover{background:#eef2ff}
    #gpsMasteryToggle[aria-expanded="true"]{background:#4338ca;color:#fff;border-color:#4338ca}
    #guidedLayout.gps-sidebar-hidden{grid-template-columns:minmax(0,1fr)!important}
    #guidedLayout.gps-sidebar-hidden #guidedProgressSidebar{display:none!important}
    #guidedLayout.gps-sidebar-hidden #guidedFlow{max-width:1100px!important;margin-left:auto!important;margin-right:auto!important;width:100%}
    @media(max-width:1100px) and (min-width:701px){#gpsMasteryToggle{min-height:42px}}
    @media(max-width:700px){#gpsMasteryToggle{display:none!important}}
    `;d.head.appendChild(s);
  }
  if(!$('gpsMasteryToggle')){
    const b=d.createElement('button');b.id='gpsMasteryToggle';b.type='button';b.setAttribute('aria-controls','guidedProgressSidebar');
    const top=flow.querySelector('.gf-top');const classic=$('gfClassic');
    if(classic)classic.style.display='none';
    if(classic)classic.insertAdjacentElement('beforebegin',b);else top?.appendChild(b);
    b.onclick=()=>{
      const show=layout.classList.contains('gps-sidebar-hidden');
      setDesktop(layout,show);save(show);
      if(show)setTimeout(()=>$('gpsFind')?.focus(),80);
    };
  }
  const collapse=$('gpsCollapse');
  if(collapse){
    collapse.textContent='×';collapse.title='Hide sidebar';collapse.setAttribute('aria-label','Hide sidebar');
    collapse.onclick=()=>{setDesktop(layout,false);save(false)};
  }
  setDesktop(layout,wanted());
}
function setDesktop(layout,show){
  if(mobile())return;
  layout.classList.remove('gps-collapsed');
  layout.classList.toggle('gps-sidebar-hidden',!show);
  const b=$('gpsMasteryToggle');if(b){b.setAttribute('aria-expanded',show?'true':'false');b.textContent=show?'✕ Hide sidebar':'☰ Show sidebar'}
}
function syncDesktop(layout){if(!mobile())setDesktop(layout,wanted())}
function wireMobile(){
  if(!mobile())return;
  let n=0;const tick=()=>{
    n++;const b=$('udListToggle');if(!b){if(n<80)setTimeout(tick,80);return}
    if(b.dataset.showHideReady)return;b.dataset.showHideReady='1';
    const update=()=>{
      const open=d.body.classList.contains('ud-list-open'),badge=$('udListBadge')?.textContent||'';
      b.innerHTML=`<span>${open?'✕ Hide sidebar':'☰ Show sidebar'}</span>${badge?`<span class="ud-badge" id="udListBadge">${badge}</span>`:''}`;
      b.setAttribute('aria-expanded',open?'true':'false');b.setAttribute('aria-controls','guidedProgressSidebar');
    };
    b.addEventListener('click',()=>setTimeout(update,0));
    $('udCloseList')?.addEventListener('click',()=>setTimeout(update,0));
    new MutationObserver(update).observe(d.body,{attributes:true,attributeFilter:['class']});
    update();
  };tick();
}
boot();
})();