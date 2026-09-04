(()=>{
let tries=0;
function moveFilter(){
  tries++;
  const search=document.getElementById('bankSearch');
  const filter=document.getElementById('bankFilter');
  if(!search||!filter){if(tries<120)setTimeout(moveFilter,100);return}

  const style=document.createElement('style');
  style.textContent=`
    #bankFilter.priority-filter-top{
      display:block!important;
      width:100%!important;
      box-sizing:border-box!important;
      margin:7px 0 6px!important;
      padding:7px 10px!important;
      border:1px solid #cbd5e1!important;
      border-radius:9px!important;
      background:#fff!important;
      color:#172033!important;
      font-size:12px!important;
      font-weight:700!important;
    }
    .smart-search .search-chips{display:none!important}
  `;
  document.head.appendChild(style);

  filter.classList.add('priority-filter-top');
  filter.style.setProperty('display','block','important');

  const smart=search.closest('.smart-search');
  const box=search.closest('.smart-search-box');
  if(smart&&box){
    box.insertAdjacentElement('afterend',filter);
  }else{
    search.insertAdjacentElement('afterend',filter);
  }

  filter.onchange=()=>{if(typeof bank==='function')bank()};
}
moveFilter();
})();