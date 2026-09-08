(()=>{
  const rawGet=Storage.prototype.getItem;
  const rawSet=Storage.prototype.setItem;
  const rawRemove=Storage.prototype.removeItem;
  const rawClear=Storage.prototype.clear;
  const active=(rawGet.call(localStorage,'psleScience_active_student')||'').toLowerCase();
  const valid=new Set(['jerry','javis']);
  if(!valid.has(active))return;

  const scopedKeys=new Set([
    'psleScience180_book_master_v1',
    'psleScience89_structured_master_v3',
    'psleScience_process_skills_v1'
  ]);
  const paperKeys=new Set([
    'psleScience180_cckps_p6_prelim_2026_bookletB_profile_v1',
    'psleScience180_cckps_p6_prelim_2026_bookletB_profile_v2'
  ]);
  const paperOwner=(rawGet.call(localStorage,'psleScience_paper_owner')||'').toLowerCase();
  const scoped=k=>`${k}__profile_${active}`;

  Storage.prototype.getItem=function(k){
    if(this===localStorage){
      if(scopedKeys.has(k))return rawGet.call(this,scoped(k));
      if(paperKeys.has(k)){
        if(paperOwner!==active)return 'done';
        return rawGet.call(this,scoped(k))||'done';
      }
    }
    return rawGet.call(this,k);
  };
  Storage.prototype.setItem=function(k,v){
    if(this===localStorage){
      if(scopedKeys.has(k))return rawSet.call(this,scoped(k),v);
      if(paperKeys.has(k)){
        if(paperOwner!==active)return;
        return rawSet.call(this,scoped(k),v);
      }
    }
    return rawSet.call(this,k,v);
  };
  Storage.prototype.removeItem=function(k){
    if(this===localStorage){
      if(scopedKeys.has(k)||paperKeys.has(k))return rawRemove.call(this,scoped(k));
    }
    return rawRemove.call(this,k);
  };
  Storage.prototype.clear=function(){
    const keep=[];
    for(let i=0;i<this.length;i++){
      const k=this.key(i);
      if(k&&k.includes('__profile_')&&!k.endsWith(`__profile_${active}`))keep.push([k,rawGet.call(this,k)]);
    }
    rawClear.call(this);
    keep.forEach(([k,v])=>rawSet.call(this,k,v));
  };

  window.PSLE_ACTIVE_STUDENT=active;
  window.PSLE_ACTIVE_STUDENT_NAME=active==='jerry'?'Jerry':'Javis';

  // After the cloud has merged this device with the server copy, reload the
  // trainer's in-memory state so the combined progress is visible immediately.
  document.addEventListener('psle-cloud-synced',()=>{
    try{
      if(typeof loadState==='function')window.S=loadState();
      if(typeof buildQueue==='function')buildQueue();
      if(typeof render==='function')render();
    }catch(_e){}
    try{
      let b=document.getElementById('cloudSyncBadge');
      if(!b){b=document.createElement('div');b.id='cloudSyncBadge';b.style.cssText='position:fixed;left:10px;bottom:10px;z-index:99999;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;border-radius:999px;padding:6px 9px;font:800 11px Arial;box-shadow:0 3px 12px #0001';document.body.appendChild(b)}
      b.textContent='☁ Cloud progress synced';setTimeout(()=>{if(b)b.style.opacity='.55'},1800);
    }catch(_e){}
  });
  document.addEventListener('psle-cloud-sync-error',e=>{
    try{
      let b=document.getElementById('cloudSyncBadge');
      if(!b){b=document.createElement('div');b.id='cloudSyncBadge';b.style.cssText='position:fixed;left:10px;bottom:10px;z-index:99999;border-radius:999px;padding:6px 9px;font:800 11px Arial;box-shadow:0 3px 12px #0001';document.body.appendChild(b)}
      b.style.background='#fff7ed';b.style.color='#9a3412';b.style.border='1px solid #fed7aa';b.textContent='☁ Local save active · cloud unavailable';
    }catch(_e){}
  });

  // The sync layer is intentionally loaded after profile scoping. It reads and
  // writes only this child's scoped records and merges them with D1.
  try{
    const s=document.createElement('script');
    s.src='resources/cloud-progress-sync.js?v=20260908p';
    s.async=false;
    document.head.appendChild(s);
  }catch(_e){}
})();