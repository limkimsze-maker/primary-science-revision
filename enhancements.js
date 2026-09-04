(()=>{
  const CORE='https://raw.githubusercontent.com/limkimsze-maker/primary-science-revision/ead2f3b9acee165ac275e8168491317b99604210/enhancements.js';

  function makeFocusRowsDarkRed(){
    const s=document.createElement('style');
    s.textContent=`
      /* Priority List — dark red Focus rows for maximum visibility */
      .row.redrow,
      .row.redrow.currentrow{
        border-left:7px solid #450a0a !important;
        background:#991b1b !important;
        box-shadow:none !important;
      }
      .row.redrow .rownum,
      .row.redrow .topicname{
        color:#ffffff !important;
        font-weight:800 !important;
      }
      .row.redrow:hover,
      .row.redrow.currentrow:hover{
        background:#7f1d1d !important;
      }

      .pill.red{
        background:#991b1b !important;
        color:#ffffff !important;
        border:1px solid #7f1d1d !important;
      }
      .btn-red{
        background:#991b1b !important;
        color:#ffffff !important;
        border-color:#7f1d1d !important;
        font-weight:800;
      }
    `;
    document.head.appendChild(s);
  }

  fetch(CORE,{cache:'force-cache'})
    .then(r=>{if(!r.ok)throw new Error('Could not load gold-standard enhancements');return r.text()})
    .then(code=>{
      (0,eval)(code);
      makeFocusRowsDarkRed();
    })
    .catch(err=>{
      console.error(err);
      makeFocusRowsDarkRed();
    });
})();