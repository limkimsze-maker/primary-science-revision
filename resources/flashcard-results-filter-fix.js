(()=>{
let tries=0;
function install(){
 tries++;
 const sel=document.getElementById('fcResultFilter');
 if(!sel||typeof sel.onchange!=='function'){if(tries<160)setTimeout(install,100);return}
 if(sel.dataset.resultSwitchFix==='1')return;
 sel.dataset.resultSwitchFix='1';
 const original=sel.onchange;let previous=sel.value||'all';
 sel.onchange=function(e){
  const next=sel.value||'all';
  if(previous!=='all'&&next!=='all'){
   sel.value='all';original.call(sel,e);
   sel.value=next;original.call(sel,e);
  }else original.call(sel,e);
  previous=next;
 };
}
install();
})();
