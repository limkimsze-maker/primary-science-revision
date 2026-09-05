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
let currentSession=null,currentRec=null,sessionSeq=0;
const safeParse=(s,f)=>{try{return JSON.parse(s||'')||f}catch(_e){return f}};
const tidy=s=>String(s||'').trim().replace(/\s+/g,' ');
const norm=s=>tidy(s).toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const words=s=>norm(s).split(' ').filter(Boolean);
const printWords=s=>tidy(s).split(/\s+/).filter(Boolean);
const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
const prefix=(a,b)=>a.length<=b.length&&a.every((x,i)=>x===b[i]);
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function mergeText(a,b){
 a=tidy(a);b=tidy(b);if(!a)return b;if(!b)return a;
 const A=words(a),B=words(b);if(same(A,B))return b.length>=a.length?b:a;if(prefix(A,B))return b;if(prefix(B,A))return a;
 let overlap=0;for(let k=Math.min(A.length,B.length);k>=1;k--){if(same(A.slice(-k),B.slice(0,k))){overlap=k;break}}
 return overlap?tidy([...printWords(a),...printWords(b).slice(overlap)].join(' ')):tidy(`${a} ${b}`);
}
function collapseSegments(segs){let out='';for(const s of segs.map(tidy).filter(Boolean))out=mergeText(out,s);return out}
function collectAlternatives(e){
 const results=Array.from(e.results||[]),out=[];
 for(let alt=0;alt<3;alt++){
  const t=collapseSegments(results.map(r=>(r[alt]||r[0])?.transcript||''));
  if(t&&!out.some(x=>norm(x)===norm(t)))out.push(t);
 }
 return out;
}
function stripStalePrefix(candidate,previous){
 candidate=tidy(candidate);previous=tidy(previous);if(!candidate||!previous)return candidate;
 const A=words(previous),B=words(candidate);if(A.length<3)return candidate;
 if(same(A,B))return'';
 if(B.length>A.length&&same(B.slice(0,A.length),A))return printWords(candidate).slice(A.length).join(' ');
 return candidate;
}
function logAttempt(area,box){
 const text=tidy(box?.value||'');if(!text)return;
 const rows=safeParse(localStorage.getItem(LOG_KEY),[]);
 rows.unshift({ts:Date.now(),method:box.dataset.voiceUsed==='1'?'voice':'typed',area,textLength:text.length,contextCorrections:Number(box.dataset.contextCorrections||0),cleanupSource:box.dataset.cleanupSource||''});
 localStorage.setItem(LOG_KEY,JSON.stringify(rows.slice(0,1500)));
}
function currentScienceTarget(box){try{return box.id==='phraseAnswer'&&typeof BANK!=='undefined'&&typeof current==='function'?(BANK[current()]?.phrase||''):''}catch(_e){return''}}
function currentProcessTarget(box){try{if(box.id!=='processRecall')return'';const n=parseInt((document.getElementById('processCount')?.textContent||'1').split(' ')[0],10)||1;return (window.PROCESS_SKILLS||[]).find(x=>x.id===n)?.target||''}catch(_e){return''}}
function contextPayload(box){
 try{
  if(box.id==='phraseAnswer')return{contextType:'science-recall',question:document.getElementById('phrasePrompt')?.textContent||'',topic:[document.getElementById('topicPill')?.textContent||'',document.getElementById('categoryPill')?.textContent||''].filter(Boolean).join(' · '),targetSentence:currentScienceTarget(box)};
  if(box.id==='appAnswer')return{contextType:'science-application',question:document.getElementById('appQuestion')?.textContent||'',topic:[document.getElementById('topicPill')?.textContent||'',document.getElementById('categoryPill')?.textContent||''].filter(Boolean).join(' · '),targetSentence:''};
  if(box.id==='processRecall')return{contextType:'process-recall',question:document.getElementById('processCue')?.textContent||'',topic:document.getElementById('processTopic')?.textContent||'',targetSentence:currentProcessTarget(box)};
  if(box.id==='processAnswer')return{contextType:'process-application',question:document.getElementById('processQuestion')?.textContent||'',topic:document.getElementById('processTopic')?.textContent||'',targetSentence:''};
 }catch(_e){}
 return{contextType:'unknown',question:'',topic:'',targetSentence:''};
}
function targetGuided(raw,target){
 const A=words(raw),B=words(target);if(!target||A.length!==B.length)return{txt:raw,changes:[]};
 const conf=new Set(['and','an','a','the','is','are','was','were','to','too','two','of','off']),out=printWords(raw),changes=[];
 for(let i=0;i<A.length;i++)if(A[i]!==B[i]&&conf.has(A[i])&&conf.has(B[i])){changes.push(`${A[i]} → ${B[i]}`);out[i]=B[i]}
 return{txt:out.join(' '),changes};
}
function localCleanup(raw,box){
 let txt=raw,changes=[];const target=currentScienceTarget(box)||currentProcessTarget(box);if(target){const r=targetGuided(txt,target);txt=r.txt;changes.push(...r.changes)}
 for(const [bad,good] of [[/\bmineral\s+(?:sauce|source|sorts)\b/gi,'mineral salts'],[/\bcarbon\s+(?:die\s*oxide|di\s*oxide|dioxidee)\b/gi,'carbon dioxide'],[/\bphoto\s+synthesis\b/gi,'photosynthesis'],[/\broute\s+hairs?\b/gi,'root hair'],[/\bdigestive\s+food\b/gi,'digested food']])txt=txt.replace(bad,m=>{if(norm(m)!==norm(good))changes.push(`${m} → ${good}`);return good});
 return{raw,cleaned:tidy(txt),changes:[...new Set(changes)],source:'local-fallback',safetyFallback:false};
}
async function cloudflareCleanup(raw,alternatives,box){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
 try{
  const res=await fetch(CLEAN_ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rawTranscript:raw,alternatives,...contextPayload(box)}),signal:ctl.signal});
  const data=await res.json().catch(()=>({}));if(!res.ok||!data.cleanedTranscript)throw new Error(data.error||`HTTP ${res.status}`);
  let cleaned=tidy(data.cleanedTranscript)||raw,changes=Array.isArray(data.changes)?data.changes.filter(Boolean).slice(0,6):[],guarded=false;
  if(words(cleaned).length>words(raw).length){cleaned=raw;changes=[];guarded=true}
  return{raw,cleaned,changes,source:'cloudflare-ai',safetyFallback:data.safetyFallback===true||guarded,clientGuarded:guarded};
 }catch(_e){return localCleanup(raw,box)}finally{clearTimeout(timer)}
}
function renderStatus(s,result){
 const undo=s.row.querySelector('.speech-undo'),isAI=result.source==='cloudflare-ai';
 s.box.dataset.cleanupSource=result.source;s.box.dataset.lastRawBox=s.baseBefore?tidy(`${s.baseBefore} ${result.raw}`):result.raw;
 if(result.changes.length){s.box.dataset.contextCorrections=String(Number(s.box.dataset.contextCorrections||0)+result.changes.length);undo.classList.remove('hide');s.status.innerHTML=`${isAI?'🧠 Cloudflare AI':'🧠 Local fallback'} corrected: <b>${esc(result.changes.slice(0,3).join(', '))}</b>. Check it before submitting.`}
 else if(result.clientGuarded){undo.classList.add('hide');s.status.textContent='🛡️ AI tried to add a word, so the raw speech transcript was kept.'}
 else if(isAI&&result.safetyFallback){undo.classList.add('hide');s.status.textContent='🧠 AI suggestion was rejected by the safety guard. Raw transcript kept.'}
 else if(isAI){undo.classList.add('hide');s.status.textContent='🧠 Cloudflare AI checked the transcript. No safe correction was needed.'}
 else{undo.classList.add('hide');s.status.textContent='Voice transcribed. Cloudflare AI was unavailable; local fallback used.'}
}
function endUI(s,msg){
 clearTimeout(s.restartTimer);clearTimeout(s.maxTimer);s.btn.disabled=false;s.btn.textContent='🎤 Speak Answer';s.btn.classList.remove('speech-listening');if(msg)s.status.innerHTML=msg;
 if(currentSession===s)currentSession=null;if(currentRec===s.rec)currentRec=null;
}
function discardSession(s,msg){
 if(!s||s.finalizing)return;s.discard=true;s.manualStop=true;s.active=false;clearTimeout(s.restartTimer);clearTimeout(s.maxTimer);
 try{if(s.rec)s.rec.abort()}catch(_e){try{if(s.rec)s.rec.stop()}catch(_e2){}}
 endUI(s,msg||'Recording discarded. Start again when ready.');
}
function commitCycle(s){if(s.cycleText){s.accumulated=mergeText(s.accumulated,s.cycleText);s.cycleText=''}}
function livePreview(s){const raw=mergeText(s.accumulated,s.cycleText);if(!raw)return;s.box.value=s.baseBefore?tidy(`${s.baseBefore} ${raw}`):raw;s.box.dataset.voiceUsed='1';s.box.dataset.voiceUserEdited='0';s.box.dispatchEvent(new Event('input',{bubbles:true}))}
async function finalizeSession(s){
 if(!s||s.finalizing||s.discard)return;s.finalizing=true;s.active=false;s.manualStop=true;clearTimeout(s.restartTimer);clearTimeout(s.maxTimer);commitCycle(s);
 const raw=tidy(s.accumulated);if(!raw){endUI(s,'No new speech was captured. Tap the microphone and try again.');return}
 s.btn.disabled=true;s.btn.textContent='🧠 Checking speech…';s.btn.classList.remove('speech-listening');s.status.textContent='🧠 Cloudflare AI is checking the completed transcript…';
 const alternatives=[raw,...s.alternatives].filter(Boolean).filter((x,i,a)=>a.findIndex(y=>norm(y)===norm(x))===i).slice(0,3);
 const result=await cloudflareCleanup(raw,alternatives,s.box);const finalText=s.baseBefore?tidy(`${s.baseBefore} ${result.cleaned}`):result.cleaned;
 s.box.value=finalText;s.box.dataset.voiceUsed='1';s.box.dataset.rawTranscript=raw;s.box.dataset.cleanedTranscript=result.cleaned;s.box.dataset.lastVoiceSnapshot=raw;s.box.dataset.voiceUserEdited='0';delete s.box.dataset.voiceCleared;s.box.dispatchEvent(new Event('input',{bubbles:true}));renderStatus(s,result);s.box.focus();endUI(s,s.status.innerHTML);
}
function manualStop(s){
 if(!s||s.finalizing)return;s.manualStop=true;s.active=false;clearTimeout(s.restartTimer);clearTimeout(s.maxTimer);s.status.textContent='Stopping…';
 try{if(s.rec)s.rec.stop();else finalizeSession(s)}catch(_e){finalizeSession(s)}
}
function startCycle(s){
 if(!s.active||s.manualStop||s.finalizing||s.discard)return;
 const rec=new SpeechRecognition();s.rec=rec;currentRec=rec;s.cycleText='';
 rec.lang='en-SG';rec.continuous=false;rec.interimResults=true;rec.maxAlternatives=3;
 rec.onstart=()=>{if(s.active&&!s.manualStop){s.btn.textContent='⏹ Stop Listening';s.btn.classList.add('speech-listening');s.status.textContent='Listening in Singapore English… Tap Stop Listening when you are finished.'}};
 rec.onresult=e=>{
  if(!s.active||s.manualStop||s.discard)return;
  let alts=collectAlternatives(e);
  if(s.freshAfterClear&&s.previousRaw){alts=alts.map(x=>stripStalePrefix(x,s.previousRaw)).filter(Boolean).filter((x,i,a)=>a.findIndex(y=>norm(y)===norm(x))===i)}
  if(alts[0]){s.cycleText=alts[0];alts.slice(1).forEach(x=>s.alternatives.add(x));livePreview(s)}
  else if(s.freshAfterClear)s.status.textContent='Ignoring the previous deleted transcript… Keep speaking.';
 };
 rec.onerror=e=>{if(s.discard)return;if(e.error==='no-speech'&&s.active&&!s.manualStop)return;const map={'not-allowed':'Microphone permission was blocked. Allow microphone access, then try again.','service-not-allowed':'Speech recognition is blocked by this browser/device.','audio-capture':'No microphone was detected.','network':'Speech recognition could not connect. Check the internet connection and try again.'};s.errorMessage=map[e.error]||`Speech recognition error: ${e.error||'unknown error'}`};
 rec.onend=()=>{
  if(s.discard)return;
  commitCycle(s);if(s.manualStop||!s.active){finalizeSession(s);return}
  if(s.errorMessage){const m=s.errorMessage;s.errorMessage='';endUI(s,m);return}
  s.status.textContent='Still listening…';s.restartTimer=setTimeout(()=>startCycle(s),180);
 };
 try{rec.start()}catch(_e){s.restartTimer=setTimeout(()=>startCycle(s),250)}
}
function startSession(box,btn,status,row){
 if(!SpeechRecognition){status.textContent='Speech recognition is not available in this browser.';btn.disabled=true;return}
 if(currentSession&&currentSession.active){manualStop(currentSession);return}
 const value=tidy(box.value||''),wasVoice=box.dataset.voiceUsed==='1'&&box.dataset.voiceUserEdited!=='1';
 const previousRaw=tidy(box.dataset.lastVoiceSnapshot||box.dataset.rawTranscript||box.dataset.cleanedTranscript||box.dataset.lastRawBox||'');
 const freshAfterClear=box.dataset.voiceCleared==='1'&&!value;
 const s={id:++sessionSeq,box,btn,status,row,baseBefore:(!value||wasVoice)?'':value,previousRaw,freshAfterClear,accumulated:'',cycleText:'',alternatives:new Set(),active:true,manualStop:false,finalizing:false,discard:false,restartTimer:null,maxTimer:null,rec:null,errorMessage:''};
 row.querySelector('.speech-undo')?.classList.add('hide');
 currentSession=s;btn.textContent='⏹ Stop Listening';btn.classList.add('speech-listening');status.textContent=freshAfterClear?'Starting a fresh Singapore-English recording…':'Listening in Singapore English… Tap Stop Listening when you are finished.';
 s.maxTimer=setTimeout(()=>{if(s.active&&!s.manualStop){s.status.textContent='90-second limit reached. Processing your speech…';manualStop(s)}},90000);
 startCycle(s);
}
function prepareVoiceExact(box){try{if(box.id!=='phraseAnswer'||box.dataset.voiceUsed!=='1'||document.getElementById('phraseMode')?.value!=='exact')return;const target=typeof BANK!=='undefined'&&typeof current==='function'?(BANK[current()]?.phrase||''):'';if(target&&norm(box.value)===norm(target))box.value=target}catch(_e){}}
function installOne(t){
 const box=document.getElementById(t.id);if(!box||document.getElementById(`speech-${t.id}`))return false;
 const row=document.createElement('div');row.className='speech-row';row.id=`speech-${t.id}`;row.innerHTML=`<button type="button" class="speech-btn">🎤 ${esc(t.label)}</button><button type="button" class="speech-undo hide">↶ Use raw transcript</button><span class="speech-status small"></span>`;box.insertAdjacentElement('afterend',row);
 const btn=row.querySelector('.speech-btn'),undo=row.querySelector('.speech-undo'),status=row.querySelector('.speech-status');if(!SpeechRecognition){btn.disabled=true;btn.textContent='🎤 Speech unavailable';status.textContent='Use typing on this browser.'}else status.textContent='Tap Speak Answer, speak at your own pace, then tap Stop Listening.';
 btn.onclick=()=>{if(currentSession&&currentSession.box===box&&currentSession.active&&!currentSession.finalizing)manualStop(currentSession);else startSession(box,btn,status,row)};
 undo.onclick=()=>{const raw=box.dataset.lastRawBox;if(raw!=null){box.value=raw;box.dataset.cleanedTranscript=box.dataset.rawTranscript||raw;box.dataset.voiceCleared='0';box.dispatchEvent(new Event('input',{bubbles:true}));status.textContent='Raw browser transcript restored. You can edit it before submitting.';undo.classList.add('hide');box.focus()}};
 box.addEventListener('input',e=>{
  if(!e.isTrusted)return;
  if(currentSession&&currentSession.box===box&&currentSession.active&&!currentSession.finalizing)discardSession(currentSession,'You edited the answer, so the old recording was discarded.');
  box.dataset.voiceUserEdited='1';undo.classList.add('hide');
  if(!tidy(box.value)){
   const previous=tidy(box.dataset.rawTranscript||box.dataset.cleanedTranscript||box.dataset.lastRawBox||box.dataset.lastVoiceSnapshot||'');if(previous)box.dataset.lastVoiceSnapshot=previous;
   box.dataset.voiceCleared='1';delete box.dataset.voiceUsed;delete box.dataset.contextCorrections;delete box.dataset.cleanupSource;delete box.dataset.rawTranscript;delete box.dataset.cleanedTranscript;delete box.dataset.lastRawBox;
   status.textContent='Answer cleared. Your next recording will start completely fresh.';
  }
 },true);
 box.addEventListener('focus',()=>{if(!tidy(box.value)){delete box.dataset.voiceUsed;delete box.dataset.contextCorrections;delete box.dataset.cleanupSource}});
 t.submit.forEach(id=>{const hook=()=>{const b=document.getElementById(id);if(!b||b.dataset.speechLogBound==='1')return false;b.dataset.speechLogBound='1';b.addEventListener('click',()=>{prepareVoiceExact(box);logAttempt(t.area,box)},true);return true};if(!hook()){let n=0;const tm=setInterval(()=>{n++;if(hook()||n>100)clearInterval(tm)},100)}});
 return true;
}
function enhanceHistory(){
 const modal=document.getElementById('sessionModal');if(!modal||modal.classList.contains('hide'))return;const rows=modal.querySelectorAll('.histrow');if(!rows.length)return;
 const hist=safeParse(localStorage.getItem(`psleScience_sessions_${active}`),[]),logs=safeParse(localStorage.getItem(LOG_KEY),[]);
 rows.forEach((row,i)=>{if(row.querySelector('.inputmethod'))return;const s=hist[i];if(!s)return;const inside=logs.filter(x=>x.ts>=s.startedAt&&x.ts<=s.endedAt),voice=inside.filter(x=>x.method==='voice').length,typed=inside.filter(x=>x.method==='typed').length,fixes=inside.reduce((n,x)=>n+Number(x.contextCorrections||0),0),ai=inside.filter(x=>x.cleanupSource==='cloudflare-ai').length;const d=document.createElement('div');d.className='mini inputmethod';d.innerHTML=`🎤 Voice ${voice} · ⌨️ Typed ${typed}${ai?` · 🧠 AI checked ${ai}`:''}${fixes?` · Context fixes ${fixes}`:''}`;row.appendChild(d)})
}
const style=document.createElement('style');style.textContent=`.speech-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:7px}.speech-btn{border:1px solid #c7d2fe!important;background:#eef2ff!important;color:#3730a3!important;font-weight:800!important;padding:9px 12px!important;border-radius:11px!important}.speech-btn.speech-listening{background:#fee2e2!important;color:#991b1b!important;border-color:#fecaca!important}.speech-undo{padding:7px 10px!important;font-size:12px!important;background:#fff!important;color:#475569!important;border:1px solid #cbd5e1!important}.speech-status{line-height:1.35}.speech-btn:disabled{opacity:.65;cursor:not-allowed!important}`;document.head.appendChild(style);
let tries=0;const timer=setInterval(()=>{tries++;let n=0;TARGETS.forEach(t=>{if(document.getElementById(`speech-${t.id}`)||installOne(t))n++});if(n===TARGETS.length||tries>120)clearInterval(timer)},100);
document.addEventListener('click',e=>{if(e.target.closest('#historyBtn'))setTimeout(enhanceHistory,80)});
})();