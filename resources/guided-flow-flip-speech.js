(()=>{
let advancing=false;
let scheduled=false;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function installStyle(){
  if(document.getElementById('gfFlipSpeechStyle'))return;
  const s=document.createElement('style');s.id='gfFlipSpeechStyle';s.textContent=`
  .gf-freeflip{min-height:285px;border:2px solid #c7d2fe;border-radius:22px;background:linear-gradient(180deg,#fff,#f8faff);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:28px;cursor:pointer;user-select:none;box-shadow:0 12px 30px #4338ca10;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}.gf-freeflip:hover{transform:translateY(-1px);box-shadow:0 16px 34px #4338ca16;border-color:#818cf8}.gf-freeflip.answer{background:linear-gradient(180deg,#f0fdf4,#ecfdf5);border-color:#86efac}.gf-freeflip-tag{font-size:11px;font-weight:900;letter-spacing:.13em;color:#6366f1;margin-bottom:18px}.gf-freeflip.answer .gf-freeflip-tag{color:#047857}.gf-freeflip-text{font-size:clamp(27px,4vw,41px);font-weight:900;line-height:1.34;max-width:850px}.gf-freeflip.answer .gf-freeflip-text{color:#14532d}.gf-freeflip-note{margin-top:14px;color:#64748b;font-size:13px;font-weight:800}.gf-confident{background:#047857!important;color:#fff!important;border-color:#047857!important;padding:14px 22px!important;font-size:16px!important}.gf-speech-btn{display:inline-flex;align-items:center;gap:7px}.gf-speech-btn.listening{background:#fee2e2!important;color:#991b1b!important;border-color:#fecaca!important}.gf-speech-status{text-align:center;min-height:20px;margin-top:8px;color:#64748b;font-size:12px;font-weight:800}.gf-speech-status.live{color:#991b1b}.gf-speech-status.ok{color:#047857}.gf-speech-status.bad{color:#991b1b}
  `;document.head.appendChild(s);
}

function chooseVoice(){
  try{const vs=speechSynthesis.getVoices?.()||[];return vs.find(v=>/^en[-_]GB$/i.test(v.lang||''))||vs.find(v=>/^en/i.test(v.lang||''))||null}catch(_e){return null}
}
function speakCard(text){
  const t=String(text||'').trim();if(!t||typeof speechSynthesis==='undefined'||typeof SpeechSynthesisUtterance==='undefined')return;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-GB';u.rate=.86;u.pitch=1;const v=chooseVoice();if(v)u.voice=v;speechSynthesis.speak(u)}catch(_e){}
}
function cardMarkup(e,side){
  const answer=side==='answer';
  return `<div class="gf-freeflip-tag">${answer?'ANSWER':'QUESTION'}</div><div class="gf-freeflip-text">${esc(answer?e.phrase:e.phrasePrompt)}</div><div class="gf-freeflip-note">Click the card anytime to see the ${answer?'question':'answer'}.</div>`;
}
function wireFreeFlip(body,advance,label){
  if(body.querySelector('.gf-freeflip'))return;
  const e=(typeof BANK!=='undefined'&&typeof current==='function')?BANK[current()]:null;if(!e)return;
  const pills=body.querySelector('.gf-pillrow')?.outerHTML||'';
  body.innerHTML=pills+`<div id="gfFreeFlip" class="gf-freeflip" role="button" tabindex="0" aria-label="Flashcard question. Click to show answer."></div><div class="gf-hint">Refer to the question and answer as many times as you need. Move on only when you feel confident.</div><div class="gf-actions"><button id="gfFlashConfident" class="gf-btn gf-confident">${esc(label||"I'm confident — Memorise →")}</button></div>`;
  const card=$('gfFreeFlip');let side='question';
  const draw=()=>{card.classList.toggle('answer',side==='answer');card.innerHTML=cardMarkup(e,side);card.setAttribute('aria-label',side==='answer'?'Flashcard answer. Click to show question.':'Flashcard question. Click to show answer.')};
  const readSide=()=>speakCard(side==='answer'?e.phrase:`${e.topic||''}. ${e.phrasePrompt||''}`);
  const flip=()=>{side=side==='question'?'answer':'question';draw();readSide()};
  card.onclick=flip;card.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();flip()}};draw();setTimeout(readSide,80);
  $('gfFlashConfident').onclick=()=>{try{speechSynthesis.cancel()}catch(_e){}advance()};
}
function advanceFromFront(reveal,revealAction){
  if(advancing)return;advancing=true;
  try{revealAction.call(reveal)}catch(_e){try{reveal.click()}catch(__e){advancing=false;return}}
  try{speechSynthesis.cancel()}catch(_e){}
  let n=0;const finish=()=>{const right=$('gfRight');if(right){try{const fn=right.onclick;if(typeof fn==='function')fn.call(right);else right.click()}catch(_e){try{right.click()}catch(__e){}}advancing=false;schedule();return}if(n++<25)setTimeout(finish,20);else{advancing=false;schedule()}};setTimeout(finish,0);
}
function enhanceFlash(body){
  if(advancing||body.querySelector('.gf-freeflip'))return;
  const review=$('guidedFlow')?.dataset?.reviewReturn||'';
  if(review&&window.PSLE_GUIDED_NAV?.returnFromFlash){
    wireFreeFlip(body,()=>window.PSLE_GUIDED_NAV.returnFromFlash(),review==='app'?'Return to Application →':'Return to Memorise →');return;
  }
  const reveal=$('gfReveal');
  if(reveal){const fn=reveal.onclick;wireFreeFlip(body,()=>advanceFromFront(reveal,fn));return}
  const right=$('gfRight');
  if(right){const fn=right.onclick;wireFreeFlip(body,()=>{if(advancing)return;advancing=true;try{if(typeof fn==='function')fn.call(right);else right.click()}finally{advancing=false;schedule()}})}
}

function addRecognition(textareaId,buttonId,statusId,checkId,contextLabel){
  const ta=$(textareaId);if(!ta||$(buttonId))return;
  const actions=ta.nextElementSibling?.classList?.contains('gf-actions')?ta.nextElementSibling:ta.parentElement?.querySelector('.gf-actions');if(!actions)return;
  const btn=document.createElement('button');btn.id=buttonId;btn.type='button';btn.className='gf-btn gf-muted gf-speech-btn';btn.textContent='🎤 Speak answer';
  const check=$(checkId);if(check&&check.parentElement===actions)actions.insertBefore(btn,check);else actions.insertBefore(btn,actions.firstChild);
  const status=document.createElement('div');status.id=statusId;status.className='gf-speech-status';status.textContent='You can type or use speech recognition.';actions.insertAdjacentElement('afterend',status);
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){btn.disabled=true;btn.textContent='🎤 Speech unavailable';status.textContent='Speech recognition is not supported in this browser. You can still type your answer.';return}
  let recognition=null,listening=false,stopTimer=null,base='',committed='';
  const setIdle=()=>{listening=false;btn.classList.remove('listening');btn.textContent='🎤 Speak answer';if(stopTimer){clearTimeout(stopTimer);stopTimer=null}};
  const stop=()=>{try{recognition?.stop()}catch(_e){}setIdle()};
  btn.onclick=()=>{
    if(listening){stop();return}
    try{speechSynthesis.cancel()}catch(_e){}
    base=ta.value.trim();committed='';
    recognition=new SR();recognition.lang='en-SG';recognition.continuous=true;recognition.interimResults=true;recognition.maxAlternatives=1;
    recognition.onstart=()=>{listening=true;btn.classList.add('listening');btn.textContent='⏹ Stop listening';status.className='gf-speech-status live';status.textContent=`Listening… speak your ${contextLabel} answer.`};
    recognition.onresult=ev=>{
      let interim='';
      for(let i=ev.resultIndex;i<ev.results.length;i++){
        const t=String(ev.results[i][0]?.transcript||'').trim();if(!t)continue;
        if(ev.results[i].isFinal)committed+=(committed?' ':'')+t;else interim+=(interim?' ':'')+t;
      }
      ta.value=[base,committed,interim].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();ta.dispatchEvent(new Event('input',{bubbles:true}));
      status.className='gf-speech-status live';status.textContent=interim?'Listening…':'Speech entered. Continue speaking or press Stop listening.';
    };
    recognition.onerror=ev=>{setIdle();status.className='gf-speech-status bad';status.textContent=ev.error==='not-allowed'||ev.error==='service-not-allowed'?'Microphone permission is blocked. Allow microphone access for this site and try again.':ev.error==='no-speech'?'I did not hear anything. Tap Speak answer and try again.':'Speech recognition stopped. Tap Speak answer to try again.'};
    recognition.onend=()=>{const hadText=ta.value.trim().length>0;setIdle();if(!status.classList.contains('bad')){status.className='gf-speech-status '+(hadText?'ok':'');status.textContent=hadText?'Speech entered. Check your answer, then continue.':'Tap Speak answer when you are ready.'}};
    try{recognition.start();stopTimer=setTimeout(()=>{if(listening)stop()},45000)}catch(_e){setIdle();status.className='gf-speech-status bad';status.textContent='Could not start the microphone. Allow microphone access and try again.'}
  };
  if(check)check.addEventListener('click',()=>{if(listening)stop()},{capture:true});
}
function enhanceSpeech(){addRecognition('gfRecall','gfSpeechRecall','gfSpeechStatus','gfCheckRecall','Science sentence')}
function enhanceAppSpeech(){addRecognition('gfAppAnswer','gfSpeechApp','gfSpeechAppStatus','gfMarkApp','PSLE Science')}
function enhance(){
  scheduled=false;if(advancing)return;installStyle();const body=$('gfBody');if(!body)return;
  if($('gfReveal')||$('gfRight')||($('guidedFlow')?.dataset?.stage==='flash'))enhanceFlash(body);
  if($('gfRecall'))enhanceSpeech();
  if($('gfAppAnswer'))enhanceAppSpeech();
}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(enhance,0)}
function boot(){const body=$('gfBody');if(!body){setTimeout(boot,80);return}installStyle();new MutationObserver(schedule).observe(body,{childList:true,subtree:true});enhance()}
boot();
})();