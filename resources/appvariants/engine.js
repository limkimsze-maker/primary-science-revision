(()=>{
const V=window.APP_VARIANTS||{};
const PAPER_PROFILE_KEY='psleScience180_cckps_p6_prelim_2026_bookletB_profile_v2';
const PAPER_SOURCE='CCKPS P6 Science Prelim 2026 — Booklet B';
// Paper profile plus completed remediation: concepts previously marked Focus have now been practised
// and are promoted to green. Recall/application counters are preserved separately.
const PAPER_GREEN=new Set([13,14,45,46,50,62,65,70,102,106,107,140,141,143,145,149,150,166,169,174,176]);
const PAPER_RED=new Set([]);
const PAPER_EVIDENCE={
 13:'Q32a · remediation completed',14:'Q35b',45:'Q33b',46:'Q33b',50:'Q33c · remediation completed',62:'Q34b/d · remediation completed',65:'Q33a · remediation completed',70:'Q32d · remediation completed',
 102:'Q36',106:'Q37',107:'Q37',140:'Q38a',141:'Q38a',143:'Q38c',145:'Q38b',149:'Q40a',150:'Q40a',
 166:'Q41a/c · remediation completed',169:'Q41a/c · remediation completed',174:'Q39a',176:'Q39c'
};
function applyPaperProfile(){
 try{
  if(localStorage.getItem(PAPER_PROFILE_KEY)==='done'||typeof rec!=='function'||typeof save!=='function')return;
  PAPER_GREEN.forEach(id=>{if(id<1||id>BANK.length)return;let x=rec(id-1);if(x.prePaperOverride===undefined)x.prePaperOverride=x.override||'auto';x.override='green';x.paperProfile='strong';x.paperSource=PAPER_SOURCE;x.paperEvidence=PAPER_EVIDENCE[id]||''});
  PAPER_RED.forEach(id=>{if(id<1||id>BANK.length)return;let x=rec(id-1);if(x.prePaperOverride===undefined)x.prePaperOverride=x.override||'auto';x.override='red';x.paperProfile='focus';x.paperSource=PAPER_SOURCE;x.paperEvidence=PAPER_EVIDENCE[id]||''});
  save();localStorage.setItem(PAPER_PROFILE_KEY,'done');
 }catch(e){console.warn('Could not apply past-paper profile',e)}
}
applyPaperProfile();
function uq(a){let s=new Set;return a.filter(x=>{let k=(x.question||"").toLowerCase().trim();if(!k||s.has(k))return false;s.add(k);return true})}
BANK.forEach(e=>{
 const g=[
  {question:e.applicationQuestion,kind:"Core"},
  {question:`A pupil is answering a PSLE Science question about ${e.topic.toLowerCase()}. State the precise science idea that should be used.`,kind:"Reworded"},
  {question:`A pupil gives an incomplete explanation about ${e.topic.toLowerCase()}. Write a complete scientific statement that would earn the science-concept mark.`,kind:"Precision"}
 ];
 const sp=(V[e.id]||[]).map(x=>({question:x.q,kind:x.k||"Transfer"}));
 e.applicationVariants=uq([...g,...sp]).slice(0,6).map(x=>({question:x.question,kind:x.kind,rubric:e.rubric,modelApplicationAnswer:e.modelApplicationAnswer}));
});
const ST={};let last=null;
function deck(i){let n=BANK[i].applicationVariants.length,x=ST[i];if(!x||!x.deck||!x.deck.length)x=ST[i]={deck:shuffle([...Array(n).keys()]),current:null};return x}
function fresh(i){let x=deck(i),n=BANK[i].applicationVariants.length,k=x.deck.pop();if(n>1&&k===x.current){if(x.deck.length){let a=x.deck.pop();x.deck.unshift(k);k=a}else k=(k+1)%n}x.current=k;return k}
function vi(i){let x=ST[i]||deck(i);if(x.current==null)fresh(i);return x.current}
function vv(i){return BANK[i].applicationVariants[vi(i)]}
function ensurePaperBadge(){
 if($("paperProfileTag"))return;
 const strip=document.querySelector('.teacher-strip > div:first-child');if(!strip)return;
 const s=document.createElement('span');s.id='paperProfileTag';s.className='small';s.style.marginLeft='10px';s.style.fontWeight='700';strip.appendChild(s);
}
function updatePaperBadge(){
 ensurePaperBadge();let i=current(),id=BANK[i].id,t=$("paperProfileTag");if(!t)return;
 if(PAPER_GREEN.has(id)){t.textContent=`📄 Past paper/remediation: Strong (${PAPER_EVIDENCE[id]||''})`;t.style.color='#166534'}
 else if(PAPER_RED.has(id)){t.textContent=`📄 Past paper: Focus (${PAPER_EVIDENCE[id]||''})`;t.style.color='#991b1b'}
 else {t.textContent='📄 Past paper: Not specifically assessed';t.style.color='#64748b'}
}
const oldRender=render;
function ui(){
 let i=current(),e=BANK[i],v=vv(i),q=$("appQuestion"),n=$("variantNote"),src=$("appBookSource");
 if(q)q.textContent=v.question;
 if(n)n.textContent=`Question ${vi(i)+1} of ${e.applicationVariants.length} · ${v.kind}`;
 if(src)src.textContent=`📘 Audited science core: ${e.bookRef}`;
 updatePaperBadge();
 if(window.AUDIT180_UI)window.AUDIT180_UI();
}
render=function(){let i=current();if(i!==last){fresh(i);last=i}let r=oldRender.apply(this,arguments);ui();return r};
function newQ(){let i=current();fresh(i);$("appAnswer").value="";$("appFeedback").className="fb hide";$("rubricBox").classList.add("hide");$("modelAppBox").classList.add("hide");$("rubricBtn").textContent="Show Key Ideas";$("modelAppBtn").textContent="Show Science Core";ui();$("appAnswer").focus()}
function rubric(){let v=vv(current()),b=$("rubricBox");if(b.classList.contains("hide")){b.innerHTML="<b>Key ideas</b><ul>"+v.rubric.map(x=>`<li>${esc(x)}</li>`).join("")+"</ul>";b.classList.remove("hide");$("rubricBtn").textContent="Hide Key Ideas"}else{b.classList.add("hide");$("rubricBtn").textContent="Show Key Ideas"}}
function model(){let i=current(),e=BANK[i],v=vv(i),b=$("modelAppBox");if(b.classList.contains("hide")){b.innerHTML=`<b>Audited book-backed science core</b><br><strong>${esc(v.modelApplicationAnswer)}</strong><div class="small" style="margin-top:8px">Source: ${esc(e.bookRef)}. Adapt this core to the exact context. Add D/E and L/R only when the question requires them. Scientifically equivalent wording is acceptable.</div>`;b.classList.remove("hide");$("modelAppBtn").textContent="Hide Science Core"}else{b.classList.add("hide");$("modelAppBtn").textContent="Show Science Core"}}
let app=$("appPane"),a=app.querySelector(".actions"),row=document.createElement("div");row.className="actions";row.innerHTML='<button class="primary" id="freshAppBtn">🔄 New Application Question</button><span id="variantNote" class="small"></span>';a.before(row);$("freshAppBtn").onclick=newQ;$("rubricBtn").onclick=rubric;$("modelAppBtn").onclick=model;$("modelAppBtn").textContent="Show Science Core";
let sub=document.querySelector("header .sub");if(sub)sub.innerHTML='<b>180 re-audited Science concepts</b> · original 108-page book photos checked page by page · <b>4–6 application questions per concept</b> · past-paper/remediation profile applied';
let note=app.querySelector(".mode-note");if(note)note.innerHTML='<b>Written Application:</b> each concept has <b>4–6 fixed question variants</b>. Tap <b>New Application Question</b> for another context. Exact wording is not required. Start with the command word. Use <b>D/E → S/R → L/R only when the question actually requires those parts</b>. The displayed Science core has been audited against the original book photos.';

// Workflow improvement: after a correct Exact Recall attempt, move immediately to
// the Written Application question for the SAME concept. Learning/gaps/initials modes
// do not trigger this jump.
const baseCheckPhrase=checkPhrase;
checkPhrase=function(){
 const shouldJump=$("phraseMode").value==="exact" && norm($("phraseAnswer").value)===norm(BANK[current()].phrase);
 baseCheckPhrase();
 if(shouldJump){
  setPane("app");
  const box=$("appFeedback");
  if(box){box.className="fb good";box.innerHTML="<b>Exact recall correct ✅</b><br>Now answer the application question for the same concept."}
  $("appAnswer").focus();
  window.scrollTo({top:0,behavior:"smooth"});
 }
};
$("checkPhrase").onclick=checkPhrase;

render();
})();