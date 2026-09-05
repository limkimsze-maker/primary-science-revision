(()=>{
const active=(window.PSLE_ACTIVE_STUDENT||localStorage.getItem('psleScience_active_student')||'').toLowerCase();
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
const CLEAN_ENDPOINT='https://primary-science-ai-marker.limkimsze-maker.workers.dev/clean-speech';
const LOG_KEY=`psleScience_input_attempts_${active||'unknown'}`;
const TARGETS=[
 {id:'phraseAnswer',label:'Speak Answer',area:'Science recall',submit:['checkPhrase']},
 {id:'appAnswer',label:'Speak Answer',area:'Science application',submit:['aiMarkBtn']},
 {id:'processRecall',label:'Speak Answer',area:'Process recall',submit:['processCheck']},
 {id:'processAnswer',label:'Speak Answer',area:'Process application',submit:['processAIMarkBtn']}
];
let currentRec=null,sessionSerial=0;
const safeParse=(s,f)=>{try{return JSON.parse(s||'')||f}catch(_e){return f}};
const tidy=s=>String(s||'').trim().replace(/\s+/g,' ');
const wordNorm=s=>tidy(s).toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const words=s=>wordNorm(s).split(' ').filter(Boolean);
const printableWords=s=>tidy(s).split(/\s+/).filter(Boolean);
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function sameWords(a,b){return a.length===b.length&&a.every((x,i)=>x===b[i])}
function isPrefix(a,b){return a.length<=b.length&&a.every((x,i)=>x===b[i])}

// Chrome/Edge can return progressive hypotheses as separate result entries, e.g.
// "Living things" + "Living things need" + "Living things need air".
// Joining those entries verbatim creates the repeated text the user saw.
// This merges progressive prefixes into the longest version while still joining
// genuinely sequential non-overlapping speech segments.
function collapseResultSegments(segments){
 let accText='',accNorm=[];
 for(const raw of segments.map(tidy).filter(Boolean)){
  const segText=raw,segNorm=words(segText);
  if(!segNorm.length)continue;
  if(!accNorm.length){accText=segText;accNorm=segNorm;continue}
  if(sameWords(accNorm,segNorm))continue;
  if(isPrefix(accNorm,segNorm)){
   // New result is a fuller version of the same utterance: replace, do not append.
   accText=segText;accNorm=segNorm;continue;
  }
  if(isPrefix(segNorm,accNorm)){
   // Shorter duplicate of wording we already have.
   continue;
  }
  let overlap=0,max=Math.min(accNorm.length,segNorm.length);
  for(let k=max;k>=1;k--){
   if(sameWords(accNorm.slice(-k),segNorm.slice(0,k))){overlap=k;break}
  }
  const segPrintable=printableWords(segText);
  if(overlap){
   const accPrintable=printableWords(accText);
   accText=tidy([...accPrintable,...segPrintable.slice(overlap)].join(' '));
  }else{
   accText=tidy(`${accText} ${segText}`);
  }
  accNorm=words(accText);
 }
 return accText;
}
function collectAlternatives(event){
 const results=Array.from(event.results||[]),out=[];
 for(let alt=0;alt<3;alt++){
  const segments=results.map(r=>(r[alt]||r[0])?.transcript||'');
  const merged=collapseResultSegments(segments);
  if(merged&&!out.some(x=>wordNorm(x)===wordNorm(merged)))out.push(merged);
 }
 return out;
}

function logAttempt(area,box){
 const text=(box?.value||'').trim();if(!text)return;
 const method=box.dataset.voiceUsed==='1'?'voice':'typed';
 const rows=safeParse(localStorage.getItem(LOG_KEY),[]);
 rows.unshift({ts:Date.now(),method,area,textLength:text.length,contextCorrections:Number(box.dataset.contextCorrections||0),cleanupSource:box.dataset.cleanupSource||''});
 localStorage.setItem(LOG_KEY,JSON.stringify(rows.slice(0,1500)));
}
function setIdle(btn,status,msg){
 if(btn){btn.textContent='🎤 Speak Answer';btn.classList.remove('speech-listening');if(btn.dataset.aiProcessing!=='1')btn.disabled=false}
 if(status&&msg)status.innerHTML=msg;
 currentRec=null;
}
function stopCurrent(){try{currentRec?.stop()}catch(_e){}}
function currentScienceTarget(box){
 try{return box.id==='phraseAnswer'&&typeof BANK!=='undefined'&&typeof current==='function'?(BANK[current()]?.phrase||''):''}catch(_e){return''}
}
function currentProcessTarget(box){
 try{
  if(box.id!=='processRecall')return'';
  const n=parseInt((document.getElementById('processCount')?.textContent||'1').split(' ')[0],10)||1;
  return (window.PROCESS_SKILLS||[]).find(x=>x.id===n)?.target||'';
 }catch(_e){return''}
}
function contextPayload(box){
 try{
  if(box.id==='phraseAnswer')return{contextType:'science-recall',question:document.getElementById('phrasePrompt')?.textContent||'',topic:[document.getElementById('topicPill')?.textContent||'',document.getElementById('categoryPill')?.textContent||''].filter(Boolean).join(' · '),targetSentence:currentScienceTarget(box)};
  if(box.id==='appAnswer')return{contextType:'science-application',question:document.getElementById('appQuestion')?.textContent||'',topic:[document.getElementById('topicPill')?.textContent||'',document.getElementById('categoryPill')?.textContent||''].filter(Boolean).join(' · '),targetSentence:''};
  if(box.id==='processRecall')return{contextType:'process-recall',question:document.getElementById('processCue')?.textContent||'',topic:document.getElementById('processTopic')?.textContent||'',targetSentence:currentProcessTarget(box)};
  if(box.id==='processAnswer')return{contextType:'process-application',question:document.getElementById('processQuestion')?.textContent||'',topic:document.getElementById('processTopic')?.textContent||'',targetSentence:''};
 }catch(_e){}
 return{contextType:'unknown',question:'',topic:'',targetSentence:''};
}

function targetGuidedFunctionWords(raw,target){
 const a=words(raw),b=words(target);if(!target||a.length!==b.length)return{txt:raw,changes:[]};
 const conf=new Set(['and','an','a','the','is','are','was','were','to','too','two','of','off']);
 const out=printableWords(raw),changes=[];
 for(let i=0;i<a.length;i++)if(a[i]!==b[i]&&conf.has(a[i])&&conf.has(b[i])){changes.push(`${a[i]} → ${b[i]}`);out[i]=b[i]}
 return{txt:out.join(' '),changes};
}
function localCleanup(raw,box){
 const target=currentScienceTarget(box)||currentProcessTarget(box);let txt=raw,changes=[];
 if(target){const r=targetGuidedFunctionWords(txt,target);txt=r.txt;changes.push(...r.changes)}
 const fixes=[
  [/\bmineral\s+(?:sauce|source|sorts)\b/gi,'mineral salts'],
  [/\bcarbon\s+(?:die\s*oxide|di\s*oxide|dioxidee)\b/gi,'carbon dioxide'],
  [/\bphoto\s+synthesis\b/gi,'photosynthesis'],
  [/\broute\s+hairs?\b/gi,'root hair'],
  [/\bdigestive\s+food\b/gi,'digested food']
 ];
 for(const [bad,good] of fixes)txt=txt.replace(bad,m=>{if(wordNorm(m)!==wordNorm(good))changes.push(`${m} → ${good}`);return good});
 return{raw,cleaned:tidy(txt),changes:[...new Set(changes)],source:'local-fallback',safetyFallback:false};
}
async function cloudflareCleanup(raw,alternatives,box){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
 try{
  const res=await fetch(CLEAN_ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rawTranscript:raw,alternatives,...contextPayload(box)}),signal:ctl.signal});
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data.cleanedTranscript)throw new Error(data.error||`HTTP ${res.status}`);
  let cleaned=tidy(data.cleanedTranscript)||raw,changes=Array.isArray(data.changes)?data.changes.filter(Boolean).slice(0,6):[],guarded=false;
  // Client-side guard: context clean-up may REPLACE a likely misheard word, but it may not
  // increase the number of words spoken. This prevents the AI from completing the answer.
  if(words(cleaned).length>words(raw).length){cleaned=raw;changes=[];guarded=true}
  return{raw,cleaned,changes,source:'cloudflare-ai',safetyFallback:data.safetyFallback===true||guarded,clientGuarded:guarded};
 }catch(_e){return localCleanup(raw,box)}finally{clearTimeout(timer)}
}
function showCorrection(row,status,result,baseBefore,box){
 const undo=row.querySelector('.speech-undo'),isAI=result.source==='cloudflare-ai';
 box.dataset.cleanupSource=result.source;
 box.dataset.lastRawBox=baseBefore?tidy(`${baseBefore} ${result.raw}`):result.raw;
 if(result.changes.length){
  box.dataset.contextCorrections=String(Number(box.dataset.contextCorrections||0)+result.changes.length);
  undo.classList.remove('hide');
  status.innerHTML=`${isAI?'🧠 Cloudflare AI':'🧠 Local fallback'} corrected: <b>${esc(result.changes.slice(0,3).join(', '))}</b>${result.changes.length>3?' …':''}. Check it before submitting.`;
 }else if(result.clientGuarded){
  undo.classList.add('hide');status.textContent='🛡️ AI tried to add a word, so the raw speech transcript was kept.';
 }else if(isAI&&result.safetyFallback){
  undo.classList.add('hide');status.textContent='🧠 AI suggestion was rejected by the safety guard. Raw transcript kept.';
 }else if(isAI){
  undo.classList.add('hide');status.textContent='🧠 Cloudflare AI checked the transcript. No safe correction was needed.';
 }else{
  undo.classList.add('hide');status.textContent='Voice transcribed. Cloudflare AI was unavailable; local fallback used.';
 }
}
function startRecognition(box,btn,status,row){
 if(!SpeechRecognition){status.textContent='Speech recognition is not available in this browser.';btn.disabled=true;return}
 if(currentRec){stopCurrent();return}
 const rec=new SpeechRecognition(),sessionId=++sessionSerial;
 currentRec=rec;
 const wasVoice=box.dataset.voiceUsed==='1',baseBefore=wasVoice?'':tidy(box.value||'');
 let eventSerial=0;
 rec.lang='en-SG';rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=3;
 rec.onstart=()=>{btn.textContent='⏹ Stop Listening';btn.classList.add('speech-listening');status.textContent='Listening… Speak clearly.'};
 rec.onresult=async e=>{
  const alternatives=collectAlternatives(e),raw=alternatives[0]||'';if(!raw)return;
  const requestToken=`${sessionId}:${++eventSerial}`;box.dataset.speechRequestToken=requestToken;
  btn.dataset.aiProcessing='1';btn.disabled=true;btn.textContent='🧠 Checking speech…';status.textContent='🧠 Cloudflare AI is checking the transcript…';
  const result=await cloudflareCleanup(raw,alternatives,box);
  // If a newer browser result arrived while AI was checking this one, discard the older result.
  if(box.dataset.speechRequestToken!==requestToken)return;
  const finalText=baseBefore?tidy(`${baseBefore} ${result.cleaned}`):result.cleaned;
  box.value=finalText;box.dataset.voiceUsed='1';box.dataset.rawTranscript=raw;box.dataset.cleanedTranscript=result.cleaned;box.dataset.voiceUserEdited='0';
  box.dispatchEvent(new Event('input',{bubbles:true}));showCorrection(row,status,result,baseBefore,box);box.focus();
  delete btn.dataset.aiProcessing;btn.disabled=false;btn.textContent='🎤 Speak Answer';btn.classList.remove('speech-listening');
 };
 rec.onerror=e=>{
  const map={'not-allowed':'Microphone permission was blocked. Allow microphone access, then try again.','service-not-allowed':'Speech recognition is blocked by this browser/device.','no-speech':'No speech was detected. Tap the microphone and try again.','audio-capture':'No microphone was detected.','network':'Speech recognition could not connect. Check the internet connection and try again.'};
  status.textContent=map[e.error]||`Speech recognition error: ${e.error||'unknown error'}`;
 };
 rec.onend=()=>{const keep=status.textContent&&status.textContent!=='Listening… Speak clearly.'?status.innerHTML:'Speak → AI context clean-up → check/edit → submit.';setIdle(btn,status,keep)};
 try{rec.start()}catch(_e){setIdle(btn,status,'Could not start speech recognition. Try again.')}
}
function prepareVoiceExact(box){
 try{
  if(box.id!=='phraseAnswer'||box.dataset.voiceUsed!=='1'||document.getElementById('phraseMode')?.value!=='exact')return;
  const target=typeof BANK!=='undefined'&&typeof current==='function'?(BANK[current()]?.phrase||''):'';
  if(target&&wordNorm(box.value)===wordNorm(target))box.value=target;
 }catch(_e){}
}
function installOne(t){
 const box=document.getElementById(t.id);if(!box||document.getElementById(`speech-${t.id}`))return false;
 const row=document.createElement('div');row.className='speech-row';row.id=`speech-${t.id}`;
 row.innerHTML=`<button type="button" class="speech-btn" aria-label="${esc(t.label)}">🎤 ${esc(t.label)}</button><button type="button" class="speech-undo hide">↶ Use raw transcript</button><span class="speech-status small"></span>`;
 box.insertAdjacentElement('afterend',row);
 const btn=row.querySelector('.speech-btn'),undo=row.querySelector('.speech-undo'),status=row.querySelector('.speech-status');
 if(!SpeechRecognition){btn.disabled=true;btn.textContent='🎤 Speech unavailable';status.textContent='Use typing on this browser.'}else status.textContent='Speak → AI context clean-up → check/edit → submit.';
 btn.onclick=()=>startRecognition(box,btn,status,row);
 undo.onclick=()=>{const raw=box.dataset.lastRawBox;if(raw!=null){box.value=raw;box.dataset.cleanedTranscript=box.dataset.rawTranscript||raw;box.dispatchEvent(new Event('input',{bubbles:true}));status.textContent='Raw browser transcript restored. You can edit it before submitting.';undo.classList.add('hide');box.focus()}};
 box.addEventListener('input',e=>{if(e.isTrusted)box.dataset.voiceUserEdited='1'},true);
 box.addEventListener('focus',()=>{if(!(box.value||'').trim()){delete box.dataset.voiceUsed;delete box.dataset.contextCorrections;delete box.dataset.cleanupSource}});
 t.submit.forEach(id=>{
  const hook=()=>{const b=document.getElementById(id);if(!b||b.dataset.speechLogBound==='1')return false;b.dataset.speechLogBound='1';b.addEventListener('click',()=>{prepareVoiceExact(box);logAttempt(t.area,box)},true);return true};
  if(!hook()){let n=0;const timer=setInterval(()=>{n++;if(hook()||n>100)clearInterval(timer)},100)}
 });
 return true;
}
function enhanceHistory(){
 const modal=document.getElementById('sessionModal');if(!modal||modal.classList.contains('hide'))return;
 const rows=modal.querySelectorAll('.histrow');if(!rows.length)return;
 const hist=safeParse(localStorage.getItem(`psleScience_sessions_${active}`),[]),logs=safeParse(localStorage.getItem(LOG_KEY),[]);
 rows.forEach((row,i)=>{if(row.querySelector('.inputmethod'))return;const s=hist[i];if(!s)return;const inside=logs.filter(x=>x.ts>=s.startedAt&&x.ts<=s.endedAt),voice=inside.filter(x=>x.method==='voice').length,typed=inside.filter(x=>x.method==='typed').length,fixes=inside.reduce((n,x)=>n+Number(x.contextCorrections||0),0),ai=inside.filter(x=>x.cleanupSource==='cloudflare-ai').length;const d=document.createElement('div');d.className='mini inputmethod';d.innerHTML=`🎤 Voice ${voice} · ⌨️ Typed ${typed}${ai?` · 🧠 AI checked ${ai}`:''}${fixes?` · Context fixes ${fixes}`:''}`;row.appendChild(d)});
}
const style=document.createElement('style');style.textContent=`.speech-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:7px}.speech-btn{border:1px solid #c7d2fe!important;background:#eef2ff!important;color:#3730a3!important;font-weight:800!important;padding:9px 12px!important;border-radius:11px!important}.speech-btn.speech-listening{background:#fee2e2!important;color:#991b1b!important;border-color:#fecaca!important}.speech-undo{padding:7px 10px!important;font-size:12px!important;background:#fff!important;color:#475569!important;border:1px solid #cbd5e1!important}.speech-status{line-height:1.35}.speech-btn:disabled{opacity:.65;cursor:not-allowed!important}`;document.head.appendChild(style);
let tries=0;const timer=setInterval(()=>{tries++;let installed=0;TARGETS.forEach(t=>{if(document.getElementById(`speech-${t.id}`)||installOne(t))installed++});if(installed===TARGETS.length||tries>120)clearInterval(timer)},100);
document.addEventListener('click',e=>{if(e.target.closest('#historyBtn'))setTimeout(enhanceHistory,80)});
})();
