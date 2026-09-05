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
let currentRec=null,currentBtn=null,currentStatus=null;
const safeParse=(s,f)=>{try{return JSON.parse(s||'')||f}catch(_e){return f}};
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function logAttempt(area,box){
 const text=(box?.value||'').trim();if(!text)return;
 const method=box.dataset.voiceUsed==='1'?'voice':'typed';
 const rows=safeParse(localStorage.getItem(LOG_KEY),[]);
 rows.unshift({ts:Date.now(),method,area,textLength:text.length});
 localStorage.setItem(LOG_KEY,JSON.stringify(rows.slice(0,1500)));
}
function setIdle(btn,status,msg){
 if(btn){btn.textContent='🎤 Speak Answer';btn.classList.remove('speech-listening');btn.disabled=false}
 if(status)status.textContent=msg||'Speak → check/edit the transcription → submit.';
 currentRec=null;currentBtn=null;currentStatus=null;
}
function stopCurrent(){try{currentRec?.stop()}catch(_e){}}
function startRecognition(box,btn,status){
 if(!SpeechRecognition){status.textContent='Speech recognition is not available in this browser.';btn.disabled=true;return}
 if(currentRec){stopCurrent();return}
 const rec=new SpeechRecognition();currentRec=rec;currentBtn=btn;currentStatus=status;
 rec.lang='en-SG';rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;
 rec.onstart=()=>{btn.textContent='⏹ Stop Listening';btn.classList.add('speech-listening');status.textContent='Listening… Speak clearly.'};
 rec.onresult=e=>{
  const transcript=Array.from(e.results).map(r=>r[0]?.transcript||'').join(' ').trim();
  if(transcript){
   const before=(box.value||'').trim();box.value=before?`${before} ${transcript}`:transcript;
   box.dataset.voiceUsed='1';box.dispatchEvent(new Event('input',{bubbles:true}));
   status.textContent='Voice transcribed. Check and correct any recognition mistakes before submitting.';
   box.focus();
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
 rec.onend=()=>setIdle(btn,status,status.textContent.includes('Voice transcribed')?status.textContent:null);
 try{rec.start()}catch(_e){setIdle(btn,status,'Could not start speech recognition. Try again.')}
}
function installOne(t){
 const box=document.getElementById(t.id);if(!box||document.getElementById(`speech-${t.id}`))return false;
 const row=document.createElement('div');row.className='speech-row';row.id=`speech-${t.id}`;
 row.innerHTML=`<button type="button" class="speech-btn" aria-label="${esc(t.label)}">🎤 ${esc(t.label)}</button><span class="speech-status small"></span>`;
 box.insertAdjacentElement('afterend',row);
 const btn=row.querySelector('.speech-btn'),status=row.querySelector('.speech-status');
 if(!SpeechRecognition){btn.disabled=true;btn.textContent='🎤 Speech unavailable';status.textContent='Use typing on this browser.'}
 else status.textContent='Speak → check/edit the transcription → submit.';
 btn.onclick=()=>startRecognition(box,btn,status);
 box.addEventListener('focus',()=>{if(!(box.value||'').trim())delete box.dataset.voiceUsed});
 t.submit.forEach(id=>{
  const hook=()=>{const b=document.getElementById(id);if(!b||b.dataset.speechLogBound==='1')return false;b.dataset.speechLogBound='1';b.addEventListener('click',()=>logAttempt(t.area,box),true);return true};
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
  const inside=logs.filter(x=>x.ts>=s.startedAt&&x.ts<=s.endedAt),voice=inside.filter(x=>x.method==='voice').length,typed=inside.filter(x=>x.method==='typed').length;
  const d=document.createElement('div');d.className='mini inputmethod';d.innerHTML=`🎤 Voice ${voice} · ⌨️ Typed ${typed}`;row.appendChild(d);
 });
}
const style=document.createElement('style');style.textContent=`
.speech-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:7px}.speech-btn{border:1px solid #c7d2fe!important;background:#eef2ff!important;color:#3730a3!important;font-weight:800!important;padding:9px 12px!important;border-radius:11px!important}.speech-btn.speech-listening{background:#fee2e2!important;color:#991b1b!important;border-color:#fecaca!important}.speech-status{line-height:1.35}.speech-btn:disabled{opacity:.6;cursor:not-allowed!important}
`;document.head.appendChild(style);
let tries=0;const timer=setInterval(()=>{tries++;let installed=0;TARGETS.forEach(t=>{if(document.getElementById(`speech-${t.id}`)||installOne(t))installed++});if(installed===TARGETS.length||tries>120)clearInterval(timer)},100);
document.addEventListener('click',e=>{if(e.target.closest('#historyBtn'))setTimeout(enhanceHistory,80)});
})();