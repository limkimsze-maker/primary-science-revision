(()=>{
function recallNorm(s){
  return String(s??'')
    .toLowerCase()
    .replace(/[’'"“”‘`]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .trim()
    .replace(/\s+/g,' ');
}
function recallDiff(a,b){
  const A=recallNorm(a).split(' ').filter(Boolean),B=recallNorm(b).split(' ').filter(Boolean);
  const D=Array.from({length:A.length+1},()=>Array(B.length+1).fill(0));
  for(let i=A.length-1;i>=0;i--)for(let j=B.length-1;j>=0;j--)D[i][j]=A[i]===B[j]?1+D[i+1][j+1]:Math.max(D[i+1][j],D[i][j+1]);
  let i=0,j=0,o=[];
  const h=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  while(i<A.length&&j<B.length){
    if(A[i]===B[j]){o.push(h(A[i]));i++;j++}
    else if(D[i+1][j]>=D[i][j+1])o.push('<del>'+h(A[i++])+'</del>');
    else o.push('<ins>'+h(B[j++])+'</ins>');
  }
  while(i<A.length)o.push('<del>'+h(A[i++])+'</del>');
  while(j<B.length)o.push('<ins>'+h(B[j++])+'</ins>');
  return o.join(' ');
}
function install(){
  if(typeof checkPhrase!=='function'||typeof current!=='function'||typeof BANK==='undefined'||!document.getElementById('checkPhrase'))return false;
  checkPhrase=function(){
    const i=current(),e=BANK[i],u=document.getElementById('phraseAnswer').value,pm=document.getElementById('phraseMode').value;
    if(!recallNorm(u)){
      feedback('phraseFeedback','warnbox','Type or say an answer first.');
      return;
    }
    const exact=recallNorm(u)===recallNorm(e.phrase);
    if(exact){
      if(pm==='exact'){
        const x=rec(i),d=today();
        if(!x.phraseDates.includes(d))x.phraseDates.push(d);
        x.phraseLast='correct';
        x.due=Date.now()+(phraseIsSecure(i)?7:1)*86400000;
        save();
        feedback('phraseFeedback','good',`<b>Exact words correct ✅</b><br><span class="small">Punctuation and capitalisation are ignored.</span><br>Phrase mastery: ${new Set(x.phraseDates).size}/3 different days.`);
      }else{
        feedback('phraseFeedback','good','<b>Correct ✅</b><br><span class="small">Punctuation and capitalisation are ignored.</span><br>This learning-stage attempt does not count towards mastery. Switch to <b>Exact recall</b> for mastery credit.');
      }
      document.getElementById('retryPhrase')?.classList.add('hide');
    }else{
      if(pm==='exact'){
        const x=rec(i);x.phraseWrong=(x.phraseWrong||0)+1;x.phraseLast='wrong';x.due=Date.now()+3*3600000;save();
      }
      feedback('phraseFeedback','wrong',`<b>Not exact yet.</b><div class="small">Punctuation and capitalisation do not matter. Red = different/extra words. Green = target words.</div><div class="diff">${recallDiff(u,e.phrase)}</div>`);
      document.getElementById('retryPhrase')?.classList.remove('hide');
    }
    stats();bank();renderPriorityOnly();
    if(exact&&pm==='exact'&&typeof setPane==='function'){
      setPane('app');
      const box=document.getElementById('appFeedback');
      if(box){box.className='fb good';box.innerHTML='<b>Exact recall correct ✅</b><br>Punctuation and capitalisation were ignored. Now answer the application question for the same concept.'}
      document.getElementById('appAnswer')?.focus();
      window.scrollTo({top:0,behavior:'smooth'});
    }
  };
  document.getElementById('checkPhrase').onclick=checkPhrase;
  const note=document.querySelector('#phrasePane .mode-note');
  if(note&&!note.dataset.punctuationNote){note.dataset.punctuationNote='1';note.insertAdjacentHTML('beforeend','<br><b>Marking:</b> punctuation and capitalisation are ignored; the Science words and word order still matter for exact recall.');}
  return true;
}
if(!install()){
  let n=0;const t=setInterval(()=>{n++;if(install()||n>120)clearInterval(t)},100);
}
})();