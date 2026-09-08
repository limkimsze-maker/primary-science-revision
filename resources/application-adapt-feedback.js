(()=>{
const d=document,$=id=>d.getElementById(id);
let tries=0,timer=0;
const stop=new Set('the a an and or of to in on at for with from into through this that these those is are was were be been being has have had can could may might will would should it its their there where which who what when how why other parts part called allow allows'.split(' '));
const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sciIndex(){try{return typeof current==='function'?current():-1}catch(_e){return -1}}
function processMode(){try{return !!window.PSLE_PROCESS_MERGE?.isActive?.()}catch(_e){return false}}
function isExplain(q){return /\b(explain|why|give\s+(?:a\s+)?reason)\b/i.test(String(q||''))}
function question(){return String(d.querySelector('#gfBody .gf-prompt')?.textContent||$('appQuestion')?.textContent||'').trim()}
function answer(){return String($('gfAppAnswer')?.value||$('appAnswer')?.value||'').trim()}
function core(){const i=sciIndex();try{return i>=0?String(BANK[i]?.phrase||''):''}catch(_e){return ''}}
function keywords(s){return [...new Set(norm(s).split(' ').filter(w=>w.length>=4&&!stop.has(w)))];}
function recallLikely(a,c){const ks=keywords(c),aw=new Set(norm(a).split(' '));if(!ks.length)return false;const hit=ks.filter(k=>aw.has(k)).length;return hit>=Math.min(2,ks.length)&&hit/ks.length>=.28}
function rating(text){const t=norm(text);if(/correct/.test(t)&&!/not correct|incorrect/.test(t))return'correct';if(/s r missing|science reasoning missing|reasoning missing/.test(t))return'sr';if(/l r missing|link missing/.test(t))return'lr';if(/d e missing|evidence missing|data missing/.test(t))return'de';if(/concept not known|concept missing|concept wrong/.test(t))return'concept';return'other'}
function badge(label,state,note){const icon=state==='ok'?'✓':state==='warn'?'!':'•',cls=state==='ok'?'raf-ok':state==='warn'?'raf-warn':'raf-next';return `<div class="raf-step ${cls}"><span>${icon}</span><div><b>${esc(label)}</b><small>${esc(note)}</small></div></div>`}
function coaching(rate,a,c){const recall=recallLikely(a,c);
 let rState='next',aState='next',lState='next',rNote='Bring in the relevant memorised Science concept.',aNote='Change the concept to fit what happened in this question.',lNote='Finish by answering the exact result asked.';
 if(rate==='correct'){rState=aState=lState='ok';rNote='Relevant Science concept used.';aNote='Concept was adapted to this situation.';lNote='Reasoning was linked to the asked result.'}
 else if(rate==='lr'){rState='ok';aState='ok';lState='warn';rNote='Relevant Science concept is present.';aNote='The concept has been applied to the situation.';lNote='State the exact outcome asked in the question.'}
 else if(rate==='sr'){
   if(recall){rState='ok';aState='warn';rNote='You appear to know the Science concept.';aNote='Do not stop at recall — explain what the changed condition does to the process.'}
   else{rState='warn';aState='next';rNote='Bring in the key Science idea first.';aNote='After recalling it, change it to fit this situation.'}
 }
 else if(rate==='concept'){rState='warn';aState='next';lState='next';rNote='The key Science concept is missing or incorrect.'}
 else if(rate==='de'){rState=recall?'ok':'next';aState='next';lState='next';rNote=recall?'The Science concept appears to be present.':'Bring in the relevant Science concept.'}
 else if(recall){rState='ok';rNote='Relevant Science vocabulary is present.'}
 return {rState,aState,lState,rNote,aNote,lNote};
}
function installStyle(){if($('recallAdaptFeedbackStyle'))return;const s=d.createElement('style');s.id='recallAdaptFeedbackStyle';s.textContent=`
.raf-coach{margin-top:12px;padding:13px;border:1px solid #c7d2fe;border-radius:14px;background:#f8faff;color:#334155}.raf-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}.raf-head b{font-size:13px;color:#3730a3}.raf-head span{font-size:10px;font-weight:900;color:#64748b}.raf-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.raf-step{display:flex;gap:7px;align-items:flex-start;border:1px solid #e2e8f0;border-radius:10px;background:#fff;padding:9px;min-width:0}.raf-step>span{width:22px;height:22px;flex:0 0 22px;border-radius:50%;display:grid;place-items:center;font-weight:900}.raf-step b{display:block;font-size:11px}.raf-step small{display:block;margin-top:2px;font-size:10px;line-height:1.35;color:#64748b}.raf-ok>span{background:#dcfce7;color:#047857}.raf-warn>span{background:#fef3c7;color:#92400e}.raf-next>span{background:#e2e8f0;color:#64748b}.raf-frame{margin-top:9px;padding:9px 10px;border-radius:10px;background:#eef2ff;color:#3730a3;font-size:11px;font-weight:800;line-height:1.45}.raf-words{margin-top:6px;font-size:10px;color:#64748b;line-height:1.45}.raf-words b{color:#475569}.raf-correct .raf-frame,.raf-correct .raf-words{display:none}
@media(max-width:650px){.raf-grid{grid-template-columns:1fr}.raf-step{padding:8px}.raf-coach{padding:11px}}
`;d.head.appendChild(s)}
function enhanceFrame(){
 const boxes=[...d.querySelectorAll('#gfBody .gf-guide .frame-box')];
 for(const box of boxes){const b=box.querySelector('b');if(!b||box.dataset.recallAdapt)return;const txt=norm(b.textContent);if(txt.includes('s r')&&txt.includes('science reasoning')){box.dataset.recallAdapt='1';b.textContent='S/R — Recall → Adapt';const nodes=[...box.childNodes].filter(n=>n.nodeType===3&&String(n.textContent).trim());if(nodes[0])nodes[0].textContent=' Recall the Science idea, then change it to explain this exact situation.'}}
}
function renderCoach(){
 if(processMode())return;const fb=$('gfAppFeedback');if(!fb||!String(fb.textContent||'').trim())return;if(fb.querySelector('.raf-coach'))return;
 const q=question();if(!isExplain(q))return;const a=answer(),c=core(),rate=rating(fb.textContent),x=coaching(rate,a,c);
 const coach=d.createElement('div');coach.className='raf-coach'+(rate==='correct'?' raf-correct':'');coach.innerHTML=`<div class="raf-head"><b>🧠 Application coach</b><span>S/R = RECALL → ADAPT</span></div><div class="raf-grid">${badge('1. Recall',x.rState,x.rNote)}${badge('2. Adapt',x.aState,x.aNote)}${badge('3. Link',x.lState,x.lNote)}</div><div class="raf-frame"><b>Useful frame:</b> Since/Because <u>[change in this question]</u>, fewer/less/more <u>[important thing]</u> can <u>[process]</u>. Therefore/Hence, <u>[exact result asked]</u>.</div><div class="raf-words"><b>Useful words:</b> since · because · fewer · less · more · unable to · cannot · reduced · increased · therefore · hence</div>`;fb.appendChild(coach)
}
function run(){enhanceFrame();renderCoach()}
function schedule(){clearTimeout(timer);timer=setTimeout(run,45)}
function boot(){tries++;const flow=$('guidedFlow');if(!flow){if(tries<240)setTimeout(boot,80);return}installStyle();new MutationObserver(schedule).observe(flow,{childList:true,subtree:true,characterData:true});run()}
boot();
})();