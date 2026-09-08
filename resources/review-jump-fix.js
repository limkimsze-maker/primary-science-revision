(()=>{
const $=id=>document.getElementById(id);
let tries=0,timer=0;
function firstAppOption(select){
  if(!select)return null;
  return [...select.options].find(o=>String(o.value||'').trim())||null;
}
function sync(){
  const bar=$('reviewJumpBar'),select=$('rjApps'),open=$('rjOpenApp');
  if(!bar||!select||!open)return;
  const first=firstAppOption(select);
  if(first&&!select.value)select.value=first.value;
  open.textContent='Open Application';
  open.disabled=!first;
  if(first){
    open.setAttribute('aria-label','Open selected Application question');
    select.setAttribute('aria-label','Application questions already tried for this Known concept');
  }
}
function schedule(){clearTimeout(timer);timer=setTimeout(sync,25)}
function install(){
  const bar=$('reviewJumpBar');
  if(!bar){if(tries++<240)setTimeout(install,80);return}
  // Capture phase: if the pupil taps Open before choosing from the dropdown,
  // automatically choose the most recent tried question first.
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#rjOpenApp');if(!btn)return;
    const select=$('rjApps'),first=firstAppOption(select);
    if(select&&first&&!select.value){select.value=first.value;select.dispatchEvent(new Event('change',{bubbles:true}))}
  },true);
  new MutationObserver(schedule).observe(bar,{childList:true,subtree:true,attributes:true,attributeFilter:['style','disabled']});
  sync();
}
install();
})();