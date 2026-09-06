(()=>{
  let tries=0;

  function parseCounterText(text){
    const m=String(text||'').match(/(\d+)\s*\/\s*(\d+)/);
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
    if(card.dataset.navFix==='2')return true;
    if(typeof card.onclick!=='function'||typeof prev.onclick!=='function'||typeof next.onclick!=='function')return false;

    card.dataset.navFix='2';
    const originalCardTap=card.onclick;
    const originalPrev=prev.onclick;
    const originalNext=next.onclick;

    function navPosition(){
      const resultSel=document.getElementById('fcResultFilter');
      if(resultSel&&(resultSel.value||'all')!=='all'){
        const reviewCounter=document.getElementById('fcResultReviewCounter');
        const review=parseCounterText(reviewCounter?.textContent||'');
        if(review.total>0)return review;
        return {pos:0,total:0};
      }
      return parseCounterText(counter.textContent||'');
    }

    function sync(){
      const {pos,total}=navPosition();
      const showingAnswer=card.classList.contains('show-back');
      prev.disabled=total===0||pos<=1;
      next.disabled=total===0||pos>=total;
      flip.textContent=showingAnswer?'Show Question ←':'Show Answer →';
      if(tapHint)tapHint.textContent=showingAnswer?'Tap card to show the question again.':'Tap card to show the answer.';
    }

    function flipSameCard(e){
      if(!card.classList.contains('show-back')){
        originalCardTap.call(card,e);
      }else{
        // Restore the front of the SAME card without advancing the list.
        originalPrev.call(prev,e);
        originalNext.call(next,e);
      }
      setTimeout(sync,0);
    }

    card.onclick=flipSameCard;
    flip.onclick=flipSameCard;

    prev.onclick=function(e){
      const resultSel=document.getElementById('fcResultFilter');
      if(resultSel&&(resultSel.value||'all')!=='all')return;
      const {pos}=navPosition();
      if(pos<=1)return;
      originalPrev.call(prev,e);
      setTimeout(sync,0);
    };

    next.onclick=function(e){
      const resultSel=document.getElementById('fcResultFilter');
      if(resultSel&&(resultSel.value||'all')!=='all')return;
      const {pos,total}=navPosition();
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
    observer.observe(card,{attributes:true,attributeFilter:['class','data-side','data-card-index']});
    observer.observe(counter,{childList:true,characterData:true,subtree:true});
    observer.observe(panel,{childList:true,subtree:true});
    panel.addEventListener('change',e=>{
      if(e.target?.id==='fcResultFilter'||e.target?.id==='fcCategory'||e.target?.id==='fcPriority')setTimeout(sync,0);
    });
    panel.addEventListener('click',e=>{
      if(e.target?.id==='fcNext'||e.target?.id==='fcPrev'||e.target?.id==='fcMarkRight'||e.target?.id==='fcMarkWrong')setTimeout(sync,0);
    });
    sync();
    return true;
  }

  const timer=setInterval(()=>{
    tries++;
    if(install()||tries>150)clearInterval(timer);
  },100);
})();
