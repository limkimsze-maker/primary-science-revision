(()=>{
const d=document;
if(d.getElementById('mobileMasteryPanelFix'))return;
const s=d.createElement('style');
s.id='mobileMasteryPanelFix';
s.textContent=`
@media (max-width:700px){
  #guidedProgressSidebar{
    top:max(6px,env(safe-area-inset-top))!important;
    bottom:max(6px,env(safe-area-inset-bottom))!important;
    left:6px!important;
    right:6px!important;
    height:auto!important;
    max-height:none!important;
    min-height:0!important;
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
    display:block!important;
    flex:1 1 0!important;
    min-height:0!important;
    max-height:none!important;
    overflow-y:auto!important;
    -webkit-overflow-scrolling:touch!important;
    padding:0 7px 12px!important;
  }
  #guidedProgressSidebar .gps-row{display:grid!important;min-height:54px!important;padding:10px 8px!important}
  #guidedProgressSidebar .gps-row b{font-size:13px!important}
  #guidedProgressSidebar .gps-row small{font-size:10px!important}
  #guidedProgressSidebar .gps-foot{display:none!important}
  #fcMap{display:none!important}
  #fcFrameworkFilter{min-height:40px!important;font-size:12px!important}
}
`;
d.head.appendChild(s);
})();