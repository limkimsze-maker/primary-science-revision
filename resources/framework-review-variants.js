(()=>{
if(window.PSLE_FRAMEWORK_192_VARIANTS)return;
function apply(){
 const api=window.PSLE_FRAMEWORK_192;
 if(!api||!window.APP_VARIANTS||typeof api.refresh!=='function')return false;
 return api.refresh()!==false;
}
window.PSLE_FRAMEWORK_192_VARIANTS={apply};
let n=0;const wait=()=>{n++;if(apply())return;if(n<160)setTimeout(wait,150)};wait();
})();