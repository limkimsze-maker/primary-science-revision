(()=>{
  const CORE='https://raw.githubusercontent.com/limkimsze-maker/primary-science-revision/ead2f3b9acee165ac275e8168491317b99604210/enhancements.js';

  function makeFocusRedder(){
    const s=document.createElement('style');
    s.textContent=`
      :root{--redbg:#fee2e2;--bad:#b91c1c}
      .row.redrow{
        border-left:7px solid #dc2626 !important;
        background:#fecaca !important;
      }
      .row.redrow .rownum,.row.redrow .topicname{
        color:#991b1b !important;
        font-weight:800;
      }
      .row.redrow:hover{background:#fca5a5 !important}
      .pill.red{
        background:#fecaca !important;
        color:#991b1b !important;
        border:1px solid #ef4444 !important;
      }
      .btn-red{
        background:#fecaca !important;
        color:#991b1b !important;
        border-color:#ef4444 !important;
        font-weight:800;
      }
    `;
    document.head.appendChild(s);
  }

  fetch(CORE,{cache:'force-cache'})
    .then(r=>{if(!r.ok)throw new Error('Could not load gold-standard enhancements');return r.text()})
    .then(code=>{
      (0,eval)(code);
      makeFocusRedder();
    })
    .catch(err=>{
      console.error(err);
      makeFocusRedder();
    });
})();