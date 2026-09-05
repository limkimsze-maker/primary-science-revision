(()=>{
let tries=0;
function start(){
  tries++;
  if(typeof render!=='function'||typeof current!=='function'||typeof BANK==='undefined'||!document.getElementById('phraseMode')){
    if(tries<120)setTimeout(start,100);return;
  }
  const $=id=>document.getElementById(id);
  const sel=$('phraseMode');
  let lastConcept=null;

  function modeGuide(mode,phrase){
    if(mode==='gaps') return typeof gaps==='function'?gaps(phrase):phrase;
    if(mode==='initials') return typeof initials==='function'?initials(phrase):phrase;
    return phrase;
  }
  function placeholder(mode){
    if(mode==='learn')return 'Read and study the full target sentence shown above. You may type it here to practise.';
    if(mode==='gaps')return 'Complete the sentence using the fill-in-the-blank guide shown above.';
    if(mode==='initials')return 'Recall the full sentence using the first-letter guide shown above.';
    return 'Type the exact book-backed target sentence from memory...';
  }
  function applyGuide(){
    if(!BANK.length)return;
    const i=current(),e=BANK[i]; if(!e)return;
    const mode=sel.value||'learn',phrase=e.phrase||'';
    const model=$('phraseModel'),hint=$('phraseHint'),answer=$('phraseAnswer'),show=$('showPhrase'),hintBtn=$('hintBtn');
    if(model){
      model.textContent=modeGuide(mode,phrase);
      if(mode==='exact')model.classList.add('blur');else model.classList.remove('blur');
      model.classList.remove('hide');
    }
    if(hint)hint.classList.add('hide');
    if(answer)answer.placeholder=placeholder(mode);
    if(show)show.style.display=mode==='exact'?'':'none';
    if(hintBtn)hintBtn.style.display=mode==='exact'?'':'none';
  }

  const baseRender=render;
  render=function(){
    let id=null;
    try{id=BANK[current()]?.id??current()}catch(_e){}
    if(id!==lastConcept){sel.value='learn';lastConcept=id}
    const out=baseRender.apply(this,arguments);
    applyGuide();
    return out;
  };

  sel.addEventListener('change',()=>setTimeout(applyGuide,0));
  $('phraseTab')?.addEventListener('click',()=>{
    sel.value='learn';
    setTimeout(()=>{applyGuide();},0);
  });

  // Initial entry always begins with Learn, never Exact Recall.
  sel.value='learn';
  lastConcept=null;
  render();
}
start();
})();