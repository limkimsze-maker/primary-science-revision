(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Memorisation comparison deliberately ignores capitalisation and punctuation.
// Apostrophes are removed so "mother's" and speech-recognised "mothers" match.
function clean(s){
  return String(s??'').toLowerCase().replace(/[’‘']/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
function words(s){const x=clean(s);return x?x.split(' '):[]}

function diffWords(actualText,targetText){
  const a=words(actualText),b=words(targetText),m=a.length,n=b.length;
  const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++)dp[i][0]=i;
  for(let j=0;j<=n;j++)dp[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){
    if(a[i-1]===b[j-1])dp[i][j]=dp[i-1][j-1];
    else dp[i][j]=Math.min(dp[i-1][j-1]+1,dp[i-1][j]+1,dp[i][j-1]+1);
  }
  const ops=[];let i=m,j=n;
  while(i||j){
    if(i&&j&&a[i-1]===b[j-1]){ops.push({t:'same',a:a[i-1],b:b[j-1]});i--;j--;continue}
    const rep=i&&j?dp[i-1][j-1]:Infinity,del=i?dp[i-1][j]:Infinity,ins=j?dp[i][j-1]:Infinity;
    const best=Math.min(rep,del,ins);
    if(best===rep){ops.push({t:'change',a:a[i-1],b:b[j-1]});i--;j--}
    else if(best===del){ops.push({t:'extra',a:a[i-1]});i--}
    else{ops.push({t:'missing',b:b[j-1]});j--}
  }
  return ops.reverse();
}
function mistakeHTML(actual,target){
  const ops=diffWords(actual,target),missing=[],extra=[],change=[];
  for(const o of ops){
    if(o.t==='missing')missing.push(o.b);
    else if(o.t==='extra')extra.push(o.a);
    else if(o.t==='change')change.push([o.a,o.b]);
  }
  const bits=[];
  if(change.length)bits.push(`<div><b>Change:</b> ${change.slice(0,6).map(x=>`<span class="mmf-bad">${esc(x[0])}</span> → <span class="mmf-good">${esc(x[1])}</span>`).join(' · ')}</div>`);
  if(missing.length)bits.push(`<div><b>Missing:</b> ${missing.slice(0,8).map(x=>`<span class="mmf-good">${esc(x)}</span>`).join(' · ')}</div>`);
  if(extra.length)bits.push(`<div><b>Extra:</b> ${extra.slice(0,8).map(x=>`<span class="mmf-bad">${esc(x)}</span>`).join(' · ')}</div>`);
  if(!bits.length)bits.push('<div>The words are very close. Check the word order carefully.</div>');
  return `<div class="gf-feedback bad mmf-box"><b>Almost — check these word differences:</b>${bits.join('')}<small>Punctuation and capital letters are ignored, including speech-recognition punctuation.</small></div>`;
}
function installStyle(){
  if($('memoriseMistakeStyle'))return;
  const s=document.createElement('style');s.id='memoriseMistakeStyle';s.textContent=`.mmf-box{display:grid;gap:7px}.mmf-box small{display:block;color:#64748b;font-weight:700;margin-top:3px}.mmf-good{display:inline-block;background:#dcfce7;color:#166534;border-radius:7px;padding:2px 6px}.mmf-bad{display:inline-block;background:#fee2e2;color:#991b1b;border-radius:7px;padding:2px 6px;text-decoration:line-through}`;document.head.appendChild(s);
}
function showAfterRender(html){
  let tries=0;const tick=()=>{const fb=$('gfMemFeedback');if(fb){fb.innerHTML=html;return}if(tries++<30)setTimeout(tick,20)};setTimeout(tick,0);
}
function onCheck(ev){
  const btn=ev.target.closest?.('#gfCheckRecall');if(!btn)return;
  const ta=$('gfRecall');if(!ta||typeof BANK==='undefined'||typeof current!=='function')return;
  const actual=ta.value,target=String(BANK[current()]?.phrase||'');
  if(!clean(actual))return;
  // If only punctuation/capitalisation differs, feed the exact target to the existing
  // checker so it is accepted rather than wrongly escalating support.
  if(clean(actual)===clean(target)){
    ta.value=target;ta.dispatchEvent(new Event('input',{bubbles:true}));return;
  }
  showAfterRender(mistakeHTML(actual,target));
}
function boot(){
  if(!$('guidedFlow')){setTimeout(boot,80);return}
  installStyle();document.addEventListener('click',onCheck,true);
}
boot();
})();