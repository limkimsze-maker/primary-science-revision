(()=>{
const IDS=new Set(['phraseAnswer','appAnswer','processRecall','processAnswer']);
function british(s){
 return String(s??'')
  .replace(/\bfertilizations\b/gi,m=>matchCase(m,'fertilisations'))
  .replace(/\bfertilization\b/gi,m=>matchCase(m,'fertilisation'))
  .replace(/\bfertilizing\b/gi,m=>matchCase(m,'fertilising'))
  .replace(/\bfertilized\b/gi,m=>matchCase(m,'fertilised'))
  .replace(/\bfertilizes\b/gi,m=>matchCase(m,'fertilises'))
  .replace(/\bfertilize\b/gi,m=>matchCase(m,'fertilise'));
}
function matchCase(src,repl){
 if(src===src.toUpperCase())return repl.toUpperCase();
 if(src[0]===src[0].toUpperCase())return repl[0].toUpperCase()+repl.slice(1);
 return repl;
}
function normaliseBox(box){
 if(!box||!IDS.has(box.id)||box.dataset.voiceUsed!=='1')return;
 const out=british(box.value);
 if(out!==box.value)box.value=out;
 if(box.dataset.cleanedTranscript)box.dataset.cleanedTranscript=british(box.dataset.cleanedTranscript);
}
document.addEventListener('input',e=>normaliseBox(e.target),true);
document.addEventListener('change',e=>normaliseBox(e.target),true);
let tries=0,t=setInterval(()=>{
 tries++;
 IDS.forEach(id=>normaliseBox(document.getElementById(id)));
 if(tries>120)clearInterval(t);
},100);
})();