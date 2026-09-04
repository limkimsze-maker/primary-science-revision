(()=>{
  const CORE='https://raw.githubusercontent.com/limkimsze-maker/primary-science-revision/ead2f3b9acee165ac275e8168491317b99604210/enhancements.js';

  function makeFocusRowsNormalRed(){
    const s=document.createElement('style');
    s.textContent=`
      /* Priority List — normal light red for Focus rows, comparable to the green Secure rows */
      .row.redrow,
      .row.redrow.currentrow{
        border-left:7px solid #dc2626 !important;
        background:#fecaca !important;
        box-shadow:none !important;
      }
      .row.redrow .rownum,
      .row.redrow .topicname{
        color:#991b1b !important;
        font-weight:800 !important;
      }
      .row.redrow:hover,
      .row.redrow.currentrow:hover{
        background:#fca5a5 !important;
      }

      .pill.red{
        background:#fee2e2 !important;
        color:#991b1b !important;
        border:1px solid #ef4444 !important;
      }
      .btn-red{
        background:#fee2e2 !important;
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
      makeFocusRowsNormalRed();
    })
    .catch(err=>{
      console.error(err);
      makeFocusRowsNormalRed();
    });
})();