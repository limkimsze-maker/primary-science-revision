(()=>{
  const CORE='https://raw.githubusercontent.com/limkimsze-maker/primary-science-revision/ead2f3b9acee165ac275e8168491317b99604210/enhancements.js';
  const CER_CACHE_FLAG='psleScience97_cer_structure_version';
  const CER_CACHE_VERSION='cer-slides-v1';

  function invalidateOldTrainingModels(){
    try{
      if(localStorage.getItem(CER_CACHE_FLAG)!==CER_CACHE_VERSION){
        localStorage.removeItem('psleScience97_gold_training_models_v1');
        localStorage.setItem(CER_CACHE_FLAG,CER_CACHE_VERSION);
      }
    }catch(_){ }
  }

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

  function addCerClarification(){
    const appNote=document.querySelector('#appPane .mode-note');
    if(appNote){
      appNote.innerHTML='<b>Important:</b> Use <b>D/E → S/R → L/R only when required</b>. D/E is the observation, result, setup or comparison. S/R is the Science principle or causal explanation. Add L/R only when the question still needs the final result or conclusion. <b>If the claim/result is already stated in the question and repeating it earns no content mark, do not repeat it mechanically.</b> The gold-standard book remains the authority for Science wording.';
    }
  }

  invalidateOldTrainingModels();

  fetch(CORE,{cache:'force-cache'})
    .then(r=>{if(!r.ok)throw new Error('Could not load gold-standard enhancements');return r.text()})
    .then(code=>{
      (0,eval)(code);
      makeFocusRowsDarkRed();
      addCerClarification();
    })
    .catch(err=>{
      console.error(err);
      makeFocusRowsDarkRed();
      addCerClarification();
    });
})();