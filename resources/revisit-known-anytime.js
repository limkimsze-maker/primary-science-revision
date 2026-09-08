(()=>{
const VERSION='20260908f';
const TARGET_KEY='psleScience_revisit_known_target_v1';
const DRAFT_KEY='psleScience_revisit_drafts_v1';
let tries=0,observer=null;
const $=id=>document.getElementById(id);
const parse=(v,f)=>{try{return JSON.parse(v||'')||f}catch(_e){return f}};
function student(){try{return (localStorage.getItem('psleScience_active_student')||'student').toLowerCase()}catch(_e){return 'student'}}
function api(){return window.PSLE_PROCESS_MERGE||null}
function flow(){return $('guidedFlow')}
function scienceIndex(){try{return typeof current==='function'?current():-1}catch(_e){return -1}}
function scienceKnown(){try{const i=scienceIndex();return i>=0&&new Set(rec(i)?.appCorrectDates||[]).size>=1}catch(_e){return false}}
function currentKnown(){try{return api()?.isActive?.()?!!api()?.isKnown?.(api()?.getCurrentId?.()):scienceKnown()}catch(_e){return false}}
function draftStore(){return parse(sessionStorage.getItem(DRAFT_KEY),{})}
function draftId(type){if(api()?.isActive?.())return `${student()}:process:${api()?.getCurrentId?.()||0}:${type}`;return `${student()}:science:${scienceIndex()}:${type}`}
function saveDraft(el,type){if(!el)return;const all=draftStore(),key=draftId(type);if(!key)return;const value=String(el.value||'');if(value)all[key]=value;else delete all[key];sessionStorage.setItem(DRAFT_KEY,JSON.stringify(all))}
function restoreDraft(el,type){if(!el||el.value)return;const value=draftStore()[draftId(type)];if(typeof value==='string'&&value){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))}}
function wireDrafts(){
 const recall=$('gfRecall');if(recall&&!recall.dataset.revisitDraft){recall.dataset.revisitDraft='1';restoreDraft(recall,'recall');recall.addEventListener('input',()=>saveDraft(recall,'recall'))}
 const app=$('gfAppAnswer');if(app&&!app.dataset.revisitDraft){app.dataset.revisitDraft='1';restoreDraft(app,'app');app.addEventListener('input',()=>saveDraft(app,'app'))}
}
function fixKnownReviewFeedback(){
 if(!currentKnown())return;
 const box=$('gfAppFeedback');if(!box)return;
 let h=box.innerHTML;
 const next=h
  .replace(/Cycle complete — this concept is now Known\./g,'Review complete — this concept remains Known.')
  .replace(/The concept remains Not done until this Application question is correct\./g,'This review attempt does not remove your existing Known progress.')
  .replace(/The item remains Not done until this Application question is correct\./g,'This review attempt does not remove your existing Known progress.');
 if(next!==h)box.innerHTML=next;
}
function isKnownRow(row){return !!row&&String(row.querySelector('.gps-dot')?.textContent||'').includes('✅')}
function saveVisibleDraft(){const r=$('gfRecall'),a=$('gfAppAnswer');if(r)saveDraft(r,'recall');if(a)saveDraft(a,'app')}
function targetFromRow(row){const kind=row?.dataset?.kind,id=Number(row?.dataset?.id);if(!kind||!Number.isFinite(id))return null;return{kind,id,student:student(),at:Date.now()}}
function hardOpen(target){
 saveVisibleDraft();sessionStorage.setItem(TARGET_KEY,JSON.stringify(target));
 try{window.parent.location.replace(`trainer180-app.html?v=${VERSION}&reviewKnown=1`)}catch(_e){location.reload()}
}
function captureKnownClick(e){
 const row=e.target?.closest?.('#gpsList .gps-row');if(!row||!isKnownRow(row))return;
 if(!row.classList.contains('locked'))return;
 const target=targetFromRow(row);if(!target)return;
 e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
 const m=$('gpsMessage');if(m)m.textContent='Opening this exact Known item for review… your mastery progress is preserved.';
 hardOpen(target);
}
function openTarget(){
 const t=parse(sessionStorage.getItem(TARGET_KEY),null);if(!t||t.student!==student())return false;
 sessionStorage.removeItem(TARGET_KEY);
 if(t.kind==='process'){
  const a=api();if(a?.enter){a.enter(t.id);const m=$('gpsMessage');if(m)m.textContent=`Reviewing Known Process Skill P${t.id}. Existing mastery remains Known.`;return true}return false;
 }
 const e=typeof BANK!=='undefined'?BANK[t.id]:null,status=$('gfStatus'),topic=$('gfTopic'),search=$('gfSearch');
 if(!e||!status||!topic||!search)return false;
 topic.value='all';topic.dispatchEvent(new Event('change',{bubbles:true}));
 status.value='known';status.dispatchEvent(new Event('change',{bubbles:true}));
 search.value=`${e.id} ${e.topic||''}`.trim();search.dispatchEvent(new Event('input',{bubbles:true}));
 const m=$('gpsMessage');if(m)m.textContent=`Reviewing Known item #${e.id}. Existing mastery remains Known; practise as much as you want.`;
 return true;
}
function enhanceSidebar(){
 const side=$('guidedProgressSidebar');if(!side)return;
 const foot=side.querySelector('.gps-foot');if(foot&&!$('gpsReviewKnownNote')){
  const n=document.createElement('div');n.id='gpsReviewKnownNote';n.style.cssText='margin-top:7px;padding:8px 9px;border-radius:9px;background:#ecfdf5;color:#047857;font-weight:800;line-height:1.35';n.innerHTML='🔁 <b>Known items stay available.</b> Use the finder above to jump to the exact concept you want. Review attempts never remove your Known progress.';foot.appendChild(n)
 }
 const known=$('gpsKnown');if(known&&!known.title)known.title='Open this list anytime to revisit mastered concepts';
}
function boot(){
 tries++;if(!flow()||!$('guidedProgressSidebar')||typeof BANK==='undefined'||!api()){if(tries<240)setTimeout(boot,80);return}
 document.addEventListener('click',captureKnownClick,true);
 enhanceSidebar();wireDrafts();fixKnownReviewFeedback();
 observer=new MutationObserver(()=>{enhanceSidebar();wireDrafts();fixKnownReviewFeedback()});observer.observe(flow(),{childList:true,subtree:true,characterData:true});
 setTimeout(openTarget,120);
}
boot();
})();