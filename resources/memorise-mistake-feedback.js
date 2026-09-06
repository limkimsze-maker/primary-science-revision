(()=>{
const $=id=>document.getElementById(id);
const h=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

// Restores the previous trainer's exact-recall behaviour:
// punctuation, apostrophes/quotes and capitalisation do not affect correctness.
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
  for(let i=A.length-1;i>=0;i--)for(let j=B.length-1;j>=0;j--)
    D[i][j]=A[i]===B[j]?1+D[i+1][j+1]:Math.max(D[i+1][j],D[i][j+1]);
  let i=0,j=0,o=[];
  while(i<A.length&&j<B.length){
    if(A[i]===B[j]){o.push(`<span class="mmf-same">${h(A[i])}</span>`);i++;j++}
    else if(D[i+1][j]>=D[i][j+1])o.push(`<del>${h(A[i++])}</del>`);
    else o.push(`<ins>${h(B[j++])}</ins>`);
  }
  while(i<A.length)o.push(`<del>${h(A[i++])}</del>`);
  while(j<B.length)o.push(`<ins>${h(B[j++])}</ins>`);
  return o.join(' ');
}
function feedbackHTML(actual,target){
  return `<div class="gf-feedback bad mmf-box"><b>Not exact yet — here is what changed:</b><div class="mmf-key"><span class="mmf-red">Red</span> = different / extra words · <span class="mmf-green">Green</span> = target words to add</div><div class="mmf-diff">${recallDiff(actual,target)}</div><small>Punctuation and capitalisation are ignored. Speech-recognition punctuation will not make an answer wrong.</small></div>`;
}
function installStyle(){
  if($('memoriseMistakeStyle'))return;
  const s=document.createElement('style');s.id='memoriseMistakeStyle';s.textContent=`
  .mmf-box{display:grid;gap:9px}.mmf-box small{display:block;color:#64748b;font-weight:700}.mmf-key{font-size:12px;color:#475569}.mmf-red{color:#991b1b;font-weight:900}.mmf-green{color:#166534;font-weight:900}.mmf-diff{font-size:17px;line-height:1.9;background:#fff;border:1px solid #fecaca;border-radius:12px;padding:12px}.mmf-diff del{background:#fee2e2;color:#991b1b;text-decoration:line-through;border-radius:5px;padding:2px 4px}.mmf-diff ins{background:#dcfce7;color:#166534;text-decoration:none;border-radius:5px;padding:2px 4px;font-weight:900}.mmf-same{color:#334155}`;document.head.appendChild(s);
}
function showAfterRender(html){
  let tries=0;const tick=()=>{const fb=$('gfMemFeedback');if(fb){fb.innerHTML=html;return}if(tries++<35)setTimeout(tick,20)};setTimeout(tick,0);
}
function onCheck(ev){
  const btn=ev.target.closest?.('#gfCheckRecall');if(!btn)return;
  const ta=$('gfRecall');if(!ta||typeof BANK==='undefined'||typeof current!=='function')return;
  const actual=ta.value,target=String(BANK[current()]?.phrase||'');
  if(!recallNorm(actual))return;
  // If wording matches once punctuation/capitalisation are ignored, let the existing
  // guided checker see the target itself so the pupil is credited immediately.
  if(recallNorm(actual)===recallNorm(target)){
    ta.value=target;ta.dispatchEvent(new Event('input',{bubbles:true}));return;
  }
  showAfterRender(feedbackHTML(actual,target));
}
function boot(){
  if(!$('guidedFlow')){setTimeout(boot,80);return}
  installStyle();document.addEventListener('click',onCheck,true);
}
boot();
})();