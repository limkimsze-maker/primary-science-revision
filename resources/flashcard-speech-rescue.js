(()=>{
let tries=0,timer=0;
function install(){
 tries++;
 const tab=document.getElementById('flashcardTab'),card=document.getElementById('fcCard'),read=document.getElementById('fcRead');
 if(!tab||!card||!read){if(tries<120)setTimeout(install,100);return}
 if(card.dataset.speechRescue==='1')return;card.dataset.speechRescue='1';
 const synth=(()=>{try{return window.top&&window.top.speechSynthesis?window.top.speechSynthesis:window.speechSynthesis}catch(_e){return window.speechSynthesis}})();
 const Utter=(()=>{try{return window.top&&window.top.SpeechSynthesisUtterance?window.top.SpeechSynthesisUtterance:window.SpeechSynthesisUtterance}catch(_e){return window.SpeechSynthesisUtterance}})();
 function voice(){try{const vs=synth.getVoices?.()||[];return vs.find(v=>/^en[-_]GB$/i.test(v.lang||''))||vs.find(v=>/^en/i.test(v.lang||''))||null}catch(_e){return null}}
 function text(){const back=card.classList.contains('show-back');if(back)return String(document.getElementById('fcAnswer')?.textContent||'').trim();const topic=String(document.getElementById('fcTopic')?.textContent||'').trim(),q=String(document.getElementById('fcPrompt')?.textContent||'').trim();return `${topic}. ${q}`.trim()}
 function say(force=false){
  if(!synth||!Utter)return;
  if(!force&&String(document.getElementById('fcAutoRead')?.textContent||'').includes('Off'))return;
  const s=text();if(!s)return;
  try{synth.cancel();const u=new Utter(s);u.lang='en-GB';u.rate=.86;const v=voice();if(v)u.voice=v;synth.speak(u)}catch(_e){}
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(()=>{try{if(!synth.speaking)say(false)}catch(_e){say(false)}},180)}
 tab.addEventListener('click',schedule);
 card.addEventListener('click',schedule);
 ['fcNext','fcPrev','fcFlip'].forEach(id=>document.getElementById(id)?.addEventListener('click',schedule));
 read.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();say(true)},true);
}
install();
})();