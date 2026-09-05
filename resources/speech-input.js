(()=>{
const active=(window.PSLE_ACTIVE_STUDENT||localStorage.getItem('psleScience_active_student')||'').toLowerCase();
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
const LOG_KEY=`psleScience_input_attempts_${active||'unknown'}`;
const TARGETS=[
 {id:'phraseAnswer',label:'Speak Answer',area:'Science recall',submit:['checkPhrase']},
 {id:'appAnswer',label:'Speak Answer',area:'Science application',submit:['aiMarkBtn']},
 {id:'processRecall',label:'Speak Answer',area:'Process recall',submit:['processCheck']},
 {id:'processAnswer',label:'Speak Answer',area:'Process application',submit:['processAIMarkBtn']}
];
let currentRec=null;
const safeParse=(s,f)=>{try{return JSON.parse(s||'')||f}catch(_e){return f}};
const wordNorm=s=>String(s||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const words=s=>wordNorm(s).split(' ').filter(Boolean);
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function logAttempt(area,box){
 const text=(box?.value||'').trim();if(!text)return;
 const method=box.dataset.voiceUsed==='1'?'voice':'typed';
 const rows=safeParse(localStorage.getItem(LOG_KEY),[]);
 rows.unshift({ts:Date.now(),method,area,textLength:text.length,contextCorrections:Number(box.dataset.contextCorrections||0)});
 localStorage.setItem(LOG_KEY,JSON.stringify(rows.slice(0,1500)));
}
function setIdle(btn,status,msg){
 if(btn){btn.textContent='🎤 Speak Answer';btn.classList.remove('speech-listening');btn.disabled=false}
 if(status)status.textContent=msg||'Speak → context clean-up → check/edit → submit.';
 currentRec=null;
}
function stopCurrent(){try{currentRec?.stop()}catch(_e){}}

function currentScienceTarget(box){
 try{
  if(box.id!=='phraseAnswer'||typeof BANK==='undefined'||typeof current!=='function')return'';
  return BANK[current()]?.phrase||'';
 }catch(_e){return''}
}
function currentProcessTarget(box){
 try{
  if(box.id!=='processRecall')return'';
  const n=parseInt((document.getElementById('processCount')?.textContent||'1').split(' ')[0],10)||1;
  return (window.PROCESS_SKILLS||[]).find(x=>x.id===n)?.target||'';
 }catch(_e){return''}
}
function contextText(box){
 const parts=[];
 try{
  if(box.id==='phraseAnswer'){
   parts.push(document.getElementById('phrasePrompt')?.textContent||'',currentScienceTarget(box));
  }else if(box.id==='appAnswer'){
   parts.push(document.getElementById('appQuestion')?.textContent||'',document.getElementById('topicPill')?.textContent||'',document.getElementById('categoryPill')?.textContent||'');
  }else if(box.id==='processRecall'){
   parts.push(document.getElementById('processCue')?.textContent||'',currentProcessTarget(box));
  }else if(box.id==='processAnswer'){
   parts.push(document.getElementById('processQuestion')?.textContent||'',document.getElementById('processTopic')?.textContent||'');
  }
 }catch(_e){}
 return wordNorm(parts.join(' '));
}
function targetGuidedFunctionWords(raw,target){
 const a=words(raw),b=words(target);if(!target||a.length!==b.length)return{txt:raw,changes:[]};
 const conf=new Set(['and','an','a','the','is','are','was','were','to','too','two','of','off']);
 const out=a.slice(),changes=[];
 for(let i=0;i<a.length;i++){
  if(a[i]!==b[i]&&conf.has(a[i])&&conf.has(b[i])){changes.push(`${a[i]} → ${b[i]}`);out[i]=b[i]}
 }
 return{txt:out.join(' '),changes};
}
function grammarAndAn(raw){
 const a=words(raw);if(!a.length)return{txt:raw,changes:[]};
 const out=a.slice(),changes=[];
 const articlePrev=new Set(['is','was','as','be','becomes','became','of','for','with','without','into','from','to','by','has','have','had','needs','need','requires','require']);
 const vowel=/^[aeiou]/;
 for(let i=0;i<a.length;i++){
  if(a[i]!=='an'&&a[i]!=='and')continue;
  const prev=a[i-1]||'',next=a[i+1]||'';
  let want=a[i];
  if(a[i]==='an'){
   if(next&&!vowel.test(next))want='and';
  }else if(a[i]==='and'){
   if(next&&vowel.test(next)&&(i===0||articlePrev.has(prev)))want='an';
  }
  if(want!==a[i]){changes.push(`${a[i]} → ${want}`);out[i]=want}
 }
 return{txt:out.join(' '),changes};
}
const PHRASE_FIXES=[
 {bad:/\bmineral\s+(?:sauce|source|sorts)\b/gi,good:'mineral salts',needs:['mineral','plant','root','transport']},
 {bad:/\bcarbon\s+(?:die\s*oxide|di\s*oxide|dioxidee)\b/gi,good:'carbon dioxide',needs:['carbon','respiration','photosynthesis','gas']},
 {bad:/\bphoto\s+synthesis\b/gi,good:'photosynthesis',needs:['photo','plant','light','food']},
 {bad:/\broot\s+hairs?\b/gi,good:m=>/hair\b/i.test(m)?'root hair':'root hairs',needs:['root','plant','water','mineral']},
 {bad:/\broute\s+hairs?\b/gi,good:m=>/hair\b/i.test(m)?'root hair':'root hairs',needs:['root','plant','water','mineral']},
 {bad:/\bdigestive\s+food\b/gi,good:'digested food',needs:['digest','food','blood','small intestine']},
 {bad:/\bfood\s+carrying\s+tubes?\b/gi,good:m=>m.toLowerCase().endsWith('s')?'food-carrying tubes':'food-carrying tube',needs:['plant','transport','food']},
 {bad:/\bwater\s+carrying\s+tubes?\b/gi,good:m=>m.toLowerCase().endsWith('s')?'water-carrying tubes':'water-carrying tube',needs:['plant','transport','water']},
 {bad:/\belectric\s+current\s+flows?\b/gi,good:m=>m,needs:['electric','circuit','current']}
];
function phraseCleanup(raw,ctx){
 let txt=raw,changes=[];
 PHRASE_FIXES.forEach(f=>{
  if(f.needs.length&&!f.needs.some(k=>ctx.includes(k))&&!f.needs.some(k=>wordNorm(txt).includes(k)))return;
  txt=txt.replace(f.bad,(...args)=>{
   const before=args[0],after=typeof f.good==='function'?f.good(before):f.good;
   if(wordNorm(before)!==wordNorm(after))changes.push(`${before} → ${after}`);
   return after;
  });
 });
 return{txt,changes};
}
function conservativeContextCleanup(raw,box){
 const target=currentScienceTarget(box)||currentProcessTarget(box),ctx=contextText(box);
 let txt=raw,changes=[];
 // In recall modes, use the known sentence only to resolve tiny function-word ASR confusions.
 // It never inserts missing Science ideas or rewrites the pupil's reasoning.
 if(target){const r=targetGuidedFunctionWords(txt,target);txt=r.txt;changes.push(...r.changes)}
 const g=grammarAndAn(txt);txt=g.txt;changes.push(...g.changes);
 const p=phraseCleanup(txt,ctx);txt=p.txt;changes.push(...p.changes);
 return{raw,cleaned:txt.trim(),changes:[...new Set(changes)]};
}
function showCorrection(row,status,result,before,box){
 const undo=row.querySelector('.speech-undo');
 if(result.changes.length){
  box.dataset.contextCorrections=String((Number(box.dataset.contextCorrections||0)+result.changes.length));
  box.dataset.lastRawBox=before?`${before} ${result.raw}`:result.raw;
  undo.classList.remove('hide');
  status.innerHTML=`Context clean-up: <b>${esc(result.changes.slice(0,3).join(', '))}</b>${result.changes.length>3?' …':''}. Check it before submitting.`;
 }else{
  undo.classList.add('hide');
  status.textContent='Voice transcribed. No context correction was needed. Check it before submitting.';
 }
}
function startRecognition(box,btn,status,row){
 if(!SpeechRecognition){status.textContent='Speech recognition is not available in this browser.';btn.disabled=true;return}
 if(currentRec){stopCurrent();return}
 const rec=new SpeechRecognition();currentRec=rec;
 rec.lang='en-SG';rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=3;
 rec.onstart=()=>{btn.textContent='⏹ Stop Listening';btn.classList.add('speech-listening');status.textContent='Listening… Speak clearly.'};
 rec.onresult=e=>{
  const raw=Array.from(e.results).map(r=>r[0]?.transcript||'').join(' ').trim();
  if(raw){
   const result=conservativeContextCleanup(raw,box),before=(box.value||'').trim();
   box.value=before?`${before} ${result.cleaned}`:result.cleaned;
   box.dataset.voiceUsed='1';box.dataset.rawTranscript=raw;box.dataset.cleanedTranscript=result.cleaned;
   box.dispatchEvent(new Event('input',{bubbles:true}));
   showCorrection(row,status,result,before,box);box.focus();
  }
 };
 rec.onerror=e=>{
  const map={
   'not-allowed':'Microphone permission was blocked. Allow microphone access, then try again.',
   'service-not-allowed':'Speech recognition is blocked by this browser/device.',
   'no-speech':'No speech was detected. Tap the microphone and try again.',
   'audio-capture':'No microphone was detected.',
   'network':'Speech recognition could not connect. Check the internet connection and try again.'
  };
  status.textContent=map[e.error]||`Speech recognition error: ${e.error||'unknown error'}`;
 };
 rec.onend=()=>{
  const keep=status.textContent&&status.textContent!=='Listening… Speak clearly.'?status.textContent:null;
  setIdle(btn,status,keep);
 };
 try{rec.start()}catch(_e){setIdle(btn,status,'Could not start speech recognition. Try again.')}
}
function prepareVoiceExact(box){
 try{
  if(box.id!=='phraseAnswer'||box.dataset.voiceUsed!=='1'||document.getElementById('phraseMode')?.value!=='exact')return;
  if(typeof BANK==='undefined'||typeof current!=='function')return;
  const target=BANK[current()]?.phrase||'';
  if(target&&wordNorm(box.value)===wordNorm(target))box.value=target;
 }catch(_e){}
}
function installOne(t){
 const box=document.getElementById(t.id);if(!box||document.getElementById(`speech-${t.id}`))return false;
 const row=document.createElement('div');row.className='speech-row';row.id=`speech-${t.id}`;
 row.innerHTML=`<button type="button" class="speech-btn" aria-label="${esc(t.label)}">🎤 ${esc(t.label)}</button><button type="button" class="speech-undo hide">↶ Use raw transcript</button><span class="speech-status small"></span>`;
 box.insertAdjacentElement('afterend',row);
 const btn=row.querySelector('.speech-btn'),undo=row.querySelector('.speech-undo'),status=row.querySelector('.speech-status');
 if(!SpeechRecognition){btn.disabled=true;btn.textContent='🎤 Speech unavailable';status.textContent='Use typing on this browser.'}
 else status.textContent='Speak → context clean-up → check/edit → submit.';
 btn.onclick=()=>startRecognition(box,btn,status,row);
 undo.onclick=()=>{const raw=box.dataset.lastRawBox;if(raw!=null){box.value=raw;box.dispatchEvent(new Event('input',{bubbles:true}));status.textContent='Raw browser transcript restored. You can edit it before submitting.';undo.classList.add('hide');box.focus()}};
 box.addEventListener('focus',()=>{if(!(box.value||'').trim()){delete box.dataset.voiceUsed;delete box.dataset.contextCorrections}});
 t.submit.forEach(id=>{
  const hook=()=>{
   const b=document.getElementById(id);if(!b||b.dataset.speechLogBound==='1')return false;
   b.dataset.speechLogBound='1';
   b.addEventListener('click',()=>{prepareVoiceExact(box);logAttempt(t.area,box)},true);
   return true;
  };
  if(!hook()){let n=0;const timer=setInterval(()=>{n++;if(hook()||n>100)clearInterval(timer)},100)}
 });
 return true;
}
function enhanceHistory(){
 const modal=document.getElementById('sessionModal');if(!modal||modal.classList.contains('hide'))return;
 const rows=modal.querySelectorAll('.histrow');if(!rows.length)return;
 const hist=safeParse(localStorage.getItem(`psleScience_sessions_${active}`),[]);
 const logs=safeParse(localStorage.getItem(LOG_KEY),[]);
 rows.forEach((row,i)=>{
  if(row.querySelector('.inputmethod'))return;
  const s=hist[i];if(!s)return;
  const inside=logs.filter(x=>x.ts>=s.startedAt&&x.ts<=s.endedAt),voice=inside.filter(x=>x.method==='voice').length,typed=inside.filter(x=>x.method==='typed').length,fixes=inside.reduce((n,x)=>n+Number(x.contextCorrections||0),0);
  const d=document.createElement('div');d.className='mini inputmethod';d.innerHTML=`🎤 Voice ${voice} · ⌨️ Typed ${typed}${fixes?` · 🧠 Context fixes ${fixes}`:''}`;row.appendChild(d);
 });
}
const style=document.createElement('style');style.textContent=`
.speech-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:7px}.speech-btn{border:1px solid #c7d2fe!important;background:#eef2ff!important;color:#3730a3!important;font-weight:800!important;padding:9px 12px!important;border-radius:11px!important}.speech-btn.speech-listening{background:#fee2e2!important;color:#991b1b!important;border-color:#fecaca!important}.speech-undo{padding:7px 10px!important;font-size:12px!important;background:#fff!important;color:#475569!important;border:1px solid #cbd5e1!important}.speech-status{line-height:1.35}.speech-btn:disabled{opacity:.6;cursor:not-allowed!important}
`;document.head.appendChild(style);
let tries=0;const timer=setInterval(()=>{tries++;let installed=0;TARGETS.forEach(t=>{if(document.getElementById(`speech-${t.id}`)||installOne(t))installed++});if(installed===TARGETS.length||tries>120)clearInterval(timer)},100);
document.addEventListener('click',e=>{if(e.target.closest('#historyBtn'))setTimeout(enhanceHistory,80)});
})();