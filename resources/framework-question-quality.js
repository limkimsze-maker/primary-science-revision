(()=>{
if(window.PSLE_FRAMEWORK_QUESTION_QUALITY)return;
const d=document,$=id=>d.getElementById(id);
const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9%]+/g,' ').trim().replace(/\s+/g,' ');
const BAD=/\b(structure or feature involved in|condition involved in|process involved in|records a clear result|this science concept|two similar cases differ in the condition related to|relevant variables or procedure)\b/i;
function classify(q){
 const raw=String(q||''),t=norm(raw);if(!t)return null;
 if(/\b(reliab|accurac|fair test|controlled variable|control variable|changed variable|measured variable|same starting|repeat(?:ed|ing)?|apparatus|instrument|range|precision|experiment|investigat)\b/.test(t))return'F6';
 if(/\b(results?|data|evidence|graph|table|reading|observed|observation|trend|shows that|showed that|according to)\b/.test(t))return'F3';
 if(/\b(compare|compared|difference|different from|than|whereas|while|both|similar plants|similar objects)\b/.test(t))return'F4';
 if(/\b(structure|feature|adaptation|advantage|shape|roots?|stem|leaves?|stomata|openings?|flowers?|fruits?|seeds?|gills?|lungs?|beak|wings?|hooks?|hairs?|fibrous|waterproof|thick|thin|sharp|broad|wide|narrow|hollow|spines?|thorns?|webbed|fat layer|body covering)\b/.test(t)&&/\b(role|function|help|helps|allow|allows|enable|enables|support|supports|protect|protects|absorb|absorbs|anchor|anchors|hold|holds|transport|carry|carries|exchange|trap|traps|float|floats|reduce|reduces|prevent|prevents|advantage)\b/.test(t))return'F5';
 if(/^\s*how\b/i.test(raw)||/\b(describe how|process|cycle|pathway|moves through|passes through|circulat|digest|photosynth|respirat|pollinat|fertilis|evaporat|condens|germinat|electromagnet|electric current|water cycle|energy conversion|transfer of)\b/.test(t))return'F2';
 if(/\b(explain|why|give a reason|affect|effect|cause|causes|reduce|reduces|increase|increases|decrease|decreases|block|blocks|damage|damaged|remove|removed|add|added|heat|heated|cool|cooled|more|less|fewer|weak|stops?|cannot|unable)\b/.test(t))return'F1';
 return null;
}
function candidates(e,id){
 const out=[];
 const push=(q,model,source)=>{q=String(q||'').trim();if(q)out.push({q,model:String(model||e?.modelApplicationAnswer||e?.phrase||'').trim(),source})};
 (window.APP_VARIANTS?.[id]||[]).forEach(v=>push(v?.q,v?.model,'Authored transfer question'));
 if(Array.isArray(e?.applicationVariants))e.applicationVariants.forEach(v=>push(v?.question,v?.modelApplicationAnswer,'PSLE-style application question'));
 if(e?.applicationQuestion&&!BAD.test(e.applicationQuestion))push(e.applicationQuestion,e.modelApplicationAnswer,'Existing linked application');
 const seen=new Set();return out.filter(x=>{const k=norm(x.q);if(!k||seen.has(k))return false;seen.add(k);return true});
}
function scoreCandidate(c,e){
 let s=0;const q=String(c.q||''),t=norm(q),topic=norm(e?.topic||''),phrase=norm(e?.phrase||'');
 if(!BAD.test(q))s+=80;
 topic.split(' ').filter(w=>w.length>4).forEach(w=>{if(t.includes(w))s+=5});
 phrase.split(' ').filter(w=>w.length>5).slice(0,8).forEach(w=>{if(t.includes(w))s+=2});
 const words=t.split(' ').length;if(words>=10&&words<=55)s+=20;if(/\b(pupil|plant|animal|object|material|water|light|air|leaf|root|stem|seed|bulb|circuit|experiment|results?)\b/.test(t))s+=8;
 return s;
}
function f5Fallback(e){
 const t=norm(`${e?.topic||''} ${e?.phrasePrompt||''}`),cue=String(e?.phrasePrompt||'').trim().replace(/\?$/,'');
 if(/leaves gaseous exchange|stomata/.test(t))return 'A pupil observes tiny openings called stomata on a leaf. Explain how the stomata allow gaseous exchange with the surroundings.';
 if(/roots anchorage/.test(t))return 'A plant has many roots growing through the soil. Explain how the roots help to keep the plant firmly in place.';
 if(/roots absorption/.test(t))return 'Roots are in contact with the soil. Explain how roots help the plant obtain water and mineral salts from the soil.';
 if(/stem support/.test(t))return 'The stem holds a plant upright. Explain how this helps the leaves receive light for food-making.';
 if(/stem water transport/.test(t))return 'The stem contains water-carrying tubes. Explain how this feature helps water and mineral salts move from the roots to other parts of the plant.';
 if(/stem food transport/.test(t))return 'The stem contains food-carrying tubes. Explain how this feature helps food made in the leaves reach other parts of the plant.';
 if(/flowers?/.test(t))return 'Explain how flowers help a flowering plant reproduce.';
 if(/fruits? and seeds?|fruit/.test(t))return 'A fruit contains seeds. Explain how the fruit and seeds help the flowering plant reproduce successfully.';
 if(/^how\b/i.test(cue))return `Explain ${cue.charAt(0).toLowerCase()+cue.slice(1)}.`;
 return `Explain how the feature described in ${String(e?.topic||'this concept').toLowerCase()} helps to carry out its function.`;
}
function choose(item,e){
 const cs=candidates(e,item.id).map(c=>({...c,f:classify(c.q)}));
 const exact=cs.filter(c=>c.f===item.framework).sort((a,b)=>scoreCandidate(b,e)-scoreCandidate(a,e));
 if(exact.length)return exact[0];
 if(item.framework==='F5')return{q:f5Fallback(e),model:e?.modelApplicationAnswer||e?.phrase||'',source:'Natural framework-linked question'};
 const natural=cs.filter(c=>!BAD.test(c.q)).sort((a,b)=>scoreCandidate(b,e)-scoreCandidate(a,e));
 if(natural.length)return natural[0];
 return null;
}
function patchCurrent(){
 const api=window.PSLE_FRAMEWORK_192;if(!api||typeof BANK==='undefined')return;
 try{
  if($('guidedFlow')?.dataset?.processMode==='1')return;
  const i=typeof current==='function'?current():-1,e=i>=0?BANK[i]:null,item=e?api.byScienceId(e.id):null;if(!e||!item)return;
  const p=d.querySelector('#gfBody .gf-prompt');if(p&&p.textContent.trim()!==item.question)p.textContent=item.question;
  const h=$('appQuestion');if(h&&h.textContent.trim()!==item.question)h.textContent=item.question;
  const note=$('variantNote');if(note&&api.meta?.[item.framework])note.textContent=`Framework ${api.meta[item.framework].n} · ${api.meta[item.framework].name} · linked question #${item.id}`;
  const card=$('frameworkCoach');if(card&&api.meta?.[item.framework]){
   const b=card.querySelector('.fc-best b'),build=card.querySelector('.fc-build');if(b)b.textContent=`${item.framework} — ${api.meta[item.framework].name}`;if(build)build.textContent=api.meta[item.framework].chain;card.dataset.fr=item.framework;
  }
 }catch(_e){}
}
function apply(){
 const api=window.PSLE_FRAMEWORK_192;if(!api||typeof BANK==='undefined'||!Array.isArray(BANK))return false;
 api.classifyQuestion=classify;
 for(let id=1;id<=180;id++){
  const item=api.byScienceId(id),e=BANK[id-1];if(!item||!e)continue;
  const pick=choose(item,e);if(!pick)continue;
  item.question=pick.q;item.model=pick.model||e.modelApplicationAnswer||e.phrase||'';item.source=pick.source;
  e.applicationQuestion=item.question;e.frameworkReviewQuestion=item.question;e.frameworkReview=item.framework;e.modelApplicationAnswer=item.model;
 }
 patchCurrent();
 d.dispatchEvent(new Event('psle-framework-question-quality-updated'));
 return true;
}
window.PSLE_FRAMEWORK_QUESTION_QUALITY={apply,classify};
// Do not poll while the pupil is studying. The trainer calls apply() once the
// authored Application variants are loaded, so this layer never blocks stage changes.
if(window.APP_VARIANTS)apply();
})();