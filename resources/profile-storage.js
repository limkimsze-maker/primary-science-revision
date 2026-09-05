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
    // Do not allow the trainer to wipe the other child's records accidentally.
    // Current app reset buttons use removeItem/setItem rather than clear(), but this
    // defensive override preserves profile separation if clear() is ever called.
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
})();