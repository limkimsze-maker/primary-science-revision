(()=>{
  let tries=0;

  function parseCounter(){
    const text=document.getElementById('fcCounter')?.textContent||'';
    const m=text.match(/(\d+)\s*\/\s*(\d+)/);
    return m?{pos:Number(m[1]),total:Number(m[2])}:{pos:0,total:0};
  }

  function install(){
    const card=document.getElementById('fcCard');
    const prev=document.getElementById('fcPrev');
    const next=document.getElementById('fcNext');
    const flip=document.getElementById('fcFlip');
    const counter=document.getElementById('fcCounter');
    const tapHint=document.getElementById('fcTapHint');
    const panel=document.getElementById('flashcardPanel');
    if(!card||!prev||!next||!flip||!counter||!panel)return false;
    if(card.dataset.navFix==='1')return true;
    if(typeof card.onclick!=='function'||typeof prev.onclick!=='function'||typeof next.onclick!=='function')return false;

    card.dataset.navFix='1';
    const originalCardTap=card.onclick;
    const originalPrev=prev.onclick;
    const originalNext=next.onclick;

    function sync(){
      const {pos,total}=parseCounter();
      const showingAnswer=card.classList.contains('show-back');
      prev.disabled=total>0&&pos<=1;
      next.disabled=total>0&&pos>=total;
      flip.textContent=showingAnswer?'Show Question ←':'Show Answer →';
      if(tapHint)tapHint.textContent=showingAnswer?'Tap card to show the question again.':'Tap card to show the answer.';
    }

    function flipSameCard(e){
      if(!card.classList.contains('show-back')){
        originalCardTap.call(card,e);
      }else{
        // Reset the flashcard engine to the front of the SAME card without advancing.
        // Moving back once and forward once leaves the list position unchanged while
        // restoring the engine's internal side state to "question".
        originalPrev.call(prev,e);
        originalNext.call(next,e);
      }
      setTimeout(sync,0);
    }

    card.onclick=flipSameCard;
    flip.onclick=flipSameCard;

    prev.onclick=function(e){
      const {pos}=parseCounter();
      if(pos<=1)return;
      originalPrev.call(prev,e);
      setTimeout(sync,0);
    };

    next.onclick=function(e){
      const {pos,total}=parseCounter();
      if(total&&pos>=total)return;
      originalNext.call(next,e);
      setTimeout(sync,0);
    };

    card.onkeydown=function(e){
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        flipSameCard(e);
      }else if(e.key==='ArrowLeft'){
        e.preventDefault();
        prev.click();
      }else if(e.key==='ArrowRight'){
        e.preventDefault();
        next.click();
      }
    };

    const headText=panel.querySelector('.fc-head p');
    if(headText)headText.textContent='See one question at a time → tap the card to flip → use Previous / Next to move between cards.';
    const tip=panel.querySelector('.fc-tip');
    if(tip)tip.innerHTML='<b>Simple flow:</b> Tap the card to flip question ↔ explanation. The card changes only when you press Previous or Next.';

    const observer=new MutationObserver(()=>requestAnimationFrame(sync));
    observer.observe(card,{attributes:true,attributeFilter:['class','data-side']});
    observer.observe(counter,{childList:true,characterData:true,subtree:true});
    sync();
    return true;
  }

  const timer=setInterval(()=>{
    tries++;
    if(install()||tries>150)clearInterval(timer);
  },100);
})();
