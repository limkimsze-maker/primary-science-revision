(()=>{
  const CORE='https://raw.githubusercontent.com/limkimsze-maker/primary-science-revision/ead2f3b9acee165ac275e8168491317b99604210/enhancements.js';
  const CER_CACHE_FLAG='psleScience97_cer_structure_version';
  const CER_CACHE_VERSION='cer-slides-v1';
  const PSLE_CACHE_FLAG='psleScience97_psle_calibration_version';
  const PSLE_CACHE_VERSION='psle-2013-2019-specimen-v1';
  const BOOK_PATCH_KEY='psleScience97_book_verbatim_patch_v2';

  function invalidateOldTrainingModels(){
    try{
      if(localStorage.getItem(CER_CACHE_FLAG)!==CER_CACHE_VERSION || localStorage.getItem(PSLE_CACHE_FLAG)!==PSLE_CACHE_VERSION){
        localStorage.removeItem('psleScience97_gold_training_models_v1');
        localStorage.setItem(CER_CACHE_FLAG,CER_CACHE_VERSION);
        localStorage.setItem(PSLE_CACHE_FLAG,PSLE_CACHE_VERSION);
      }
    }catch(_){ }
  }

  function applyBookVerbatimPatch(){
    try{
      if(typeof BANK!=='undefined' && BANK[28]){
        BANK[28].phrase='Respiration is the breaking down of glucose/sugar with the release of energy in living cells.';
        BANK[28].rubric=['Glucose/sugar is broken down','Energy is released','Respiration takes place in living cells'];
        BANK[28].modelApplicationAnswer='Respiration is the breaking down of glucose/sugar with the release of energy in living cells. The released energy is used for life processes.';
      }
      if(localStorage.getItem(BOOK_PATCH_KEY)!=='done' && typeof rec==='function' && typeof save==='function'){
        const x=rec(28);
        const old=Array.isArray(x.phraseDates)?x.phraseDates.slice():[];
        if(old.length){
          x.bookVerbatimLegacyPhraseDates=Array.from(new Set([...(x.bookVerbatimLegacyPhraseDates||[]),...old]));
          x.phraseDates=[];
          x.phraseLast='';
        }
        save();
        localStorage.setItem(BOOK_PATCH_KEY,'done');
      }
    }catch(e){console.warn('Book-verbatim patch skipped',e)}
  }

  function makeFocusRowsDarkRed(){
    const s=document.createElement('style');
    s.textContent=`
      .row.redrow,.row.redrow.currentrow{border-left:7px solid #450a0a !important;background:#991b1b !important;box-shadow:none !important}
      .row.redrow .rownum,.row.redrow .topicname{color:#ffffff !important;font-weight:800 !important}
      .row.redrow:hover,.row.redrow.currentrow:hover{background:#7f1d1d !important}
      .pill.red{background:#991b1b !important;color:#ffffff !important;border:1px solid #7f1d1d !important}
      .btn-red{background:#991b1b !important;color:#ffffff !important;border-color:#7f1d1d !important;font-weight:800}
    `;
    document.head.appendChild(s);
  }

  function addCerClarification(){
    const appNote=document.querySelector('#appPane .mode-note');
    if(appNote){
      appNote.innerHTML='<b>Important:</b> Use <b>D/E → S/R → L/R only when required</b>. D/E is the observation, result, setup or comparison. S/R is the Science principle or causal explanation. Add L/R only when the question still needs the final result or conclusion. <b>If the claim/result is already stated in the question and repeating it earns no content mark, do not repeat it mechanically.</b> Application marking is calibrated against PSLE 2013–2019 + specimen question patterns, while the gold-standard book remains the authority for Science wording.';
    }
  }

  invalidateOldTrainingModels();
  applyBookVerbatimPatch();

  fetch(CORE,{cache:'force-cache'})
    .then(r=>{if(!r.ok)throw new Error('Could not load gold-standard enhancements');return r.text()})
    .then(code=>{
      (0,eval)(code);
      applyBookVerbatimPatch();
      makeFocusRowsDarkRed();
      addCerClarification();
      if(typeof render==='function')render();
    })
    .catch(err=>{
      console.error(err);
      applyBookVerbatimPatch();
      makeFocusRowsDarkRed();
      addCerClarification();
      if(typeof render==='function')render();
    });
})();