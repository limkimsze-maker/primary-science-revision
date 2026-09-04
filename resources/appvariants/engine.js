(()=>{
const V=window.APP_VARIANTS||{};
const PAPER_PROFILE_KEY='psleScience180_cckps_p6_prelim_2026_bookletB_profile_v1';
const PAPER_SOURCE='CCKPS P6 Science Prelim 2026 — Booklet B';
// Conservative paper-based profile: only concepts clearly demonstrated as strong or clearly needing focus.
// Unassessed or mixed concepts remain Auto/amber.
const PAPER_GREEN=new Set([14,45,46,102,106,107,140,141,143,145,149,150,174,176]);
const PAPER_RED=new Set([13,50,62,65,70,166,169]);
const PAPER_EVIDENCE={
 13:'Q32a',14:'Q35b',45:'Q33b',46:'Q33b',50:'Q33c',62:'Q34b/d',65:'Q33a',70:'Q32d',
 102:'Q36',106:'Q37',107:'Q37',140:'Q38a',141:'Q38a',143:'Q38c',145:'Q38b',149:'Q40a',150:'Q40a',
 166:'Q41a/c',169:'Q41a/c',174:'Q39a',176:'Q39c'
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
 if(PAPER_GREEN.has(id)){t.textContent=`📄 Past paper: Strong (${PAPER_EVIDENCE[id]||''})`;t.style.color='#166534'}
 else if(PAPER_RED.has(id)){t.textContent=`📄 Past paper: Focus (${PAPER_EVIDENCE[id]||''})`;t.style.color='#991b1b'}
 else {t.textContent='📄 Past paper: Not specifically assessed';t.style.color='#64748b'}
}
const oldRender=render;
function ui(){
 let i=current(),e=BANK[i],v=vv(i),q=$("appQuestion"),n=$("variantNote"),src=$("appBookSource");
 if(q)q.textContent=v.question;
 if(n)n.textContent=`Question ${vi(i)+1} of ${e.applicationVariants.length} · ${v.kind}`;
 if(src)src.textContent=`📘 Science core backed by: ${e.bookRef}`;
 updatePaperBadge();
}
render=function(){let i=current();if(i!==last){fresh(i);last=i}let r=oldRender.apply(this,arguments);ui();return r};
function newQ(){let i=current();fresh(i);$("appAnswer").value="";$("appFeedback").className="fb hide";$("rubricBox").classList.add("hide");$("modelAppBox").classList.add("hide");$("rubricBtn").textContent="Show Key Ideas";$("modelAppBtn").textContent="Show Science Core";ui();$("appAnswer").focus()}
function rubric(){let v=vv(current()),b=$("rubricBox");if(b.classList.contains("hide")){b.innerHTML="<b>Key ideas</b><ul>"+v.rubric.map(x=>`<li>${esc(x)}</li>`).join("")+"</ul>";b.classList.remove("hide");$("rubricBtn").textContent="Hide Key Ideas"}else{b.classList.add("hide");$("rubricBtn").textContent="Show Key Ideas"}}
function model(){let i=current(),e=BANK[i],v=vv(i),b=$("modelAppBox");if(b.classList.contains("hide")){b.innerHTML=`<b>Book-backed science core</b><br><strong>${esc(v.modelApplicationAnswer)}</strong><div class="small" style="margin-top:8px">Source: ${esc(e.bookRef)}. Adapt this core to the exact context. Add D/E and L/R only when the question requires them. Scientifically equivalent wording is acceptable.</div>`;b.classList.remove("hide");$("modelAppBtn").textContent="Hide Science Core"}else{b.classList.add("hide");$("modelAppBtn").textContent="Show Science Core"}}
let app=$("appPane"),a=app.querySelector(".actions"),row=document.createElement("div");row.className="actions";row.innerHTML='<button class="primary" id="freshAppBtn">🔄 New Application Question</button><span id="variantNote" class="small"></span>';a.before(row);$("freshAppBtn").onclick=newQ;$("rubricBtn").onclick=rubric;$("modelAppBtn").onclick=model;$("modelAppBtn").textContent="Show Science Core";
let sub=document.querySelector("header .sub");if(sub)sub.innerHTML='<b>180 book-backed Science concepts</b> · <b>4–6 application questions per concept</b> · <b>past-paper strong/focus profile applied</b> · no-repeat question cycling';
let note=app.querySelector(".mode-note");if(note)note.innerHTML='<b>Written Application:</b> each concept has <b>4–6 fixed question variants</b>. Tap <b>New Application Question</b> for another context. The local deck cycles without repeating until all variants have been used. Exact wording is not required. Start with the command word. Use <b>D/E → S/R → L/R only when the question actually requires those parts</b>.';
render();
})();