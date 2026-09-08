(()=>{
if(window.__PSLE_FW192_GUARD__)return;
window.__PSLE_FW192_GUARD__=true;
const RealMO=window.MutationObserver;
const realSetInterval=window.setInterval.bind(window);
window.__PSLE_FW192_REAL_MO__=RealMO;
window.__PSLE_FW192_REAL_SET_INTERVAL__=realSetInterval;
window.MutationObserver=function(){return{observe(){},disconnect(){},takeRecords(){return[]}}};
window.setInterval=function(fn,ms,...args){
  const text=String(fn||'');
  if(Number(ms)===700&&(text.includes('patchSidebar')||text.includes('applyCurrentQuestion')))return -192;
  return realSetInterval(fn,ms,...args);
};
window.__PSLE_FW192_RESTORE__=()=>{
  if(window.__PSLE_FW192_REAL_MO__)window.MutationObserver=window.__PSLE_FW192_REAL_MO__;
  if(window.__PSLE_FW192_REAL_SET_INTERVAL__)window.setInterval=window.__PSLE_FW192_REAL_SET_INTERVAL__;
};
})();