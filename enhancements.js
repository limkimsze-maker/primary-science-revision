(()=>{
  const CORE='https://raw.githubusercontent.com/limkimsze-maker/primary-science-revision/ead2f3b9acee165ac275e8168491317b99604210/enhancements.js';

  function makeFocusRowsClearlyRed(){
    const s=document.createElement('style');
    s.textContent=`
      /* Priority List — make Focus rows clearly red, matching the green Secure rows */
      .row.redrow,
      .row.redrow.currentrow{
        border-left:7px solid #dc2626 !important;
        background:#fca5a5 !important;
        box-shadow:inset 0 0 0 1px #ef4444;
      }
      .row.redrow .rownum,
      .row.redrow .topicname{
        color:#7f1d1d !important;
        font-weight:800 !important;
      }
      .row.redrow:hover,
      .row.redrow.currentrow:hover{
        background:#f87171 !important;
      }

      /* Keep the other Focus indicators consistent, but the main change is the list-row fill above. */
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
      makeFocusRowsClearlyRed();
    })
    .catch(err=>{
      console.error(err);
      makeFocusRowsClearlyRed();
    });
})();