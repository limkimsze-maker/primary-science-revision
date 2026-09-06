(()=>{
let tries=0;
function install(){
 tries++;
 const app=document.getElementById('appPane'),q=document.getElementById('appQuestion'),fresh=document.getElementById('freshAppBtn'),next=document.getElementById('nextApp'),answer=document.getElementById('appAnswer');
 if(!app||!q||!fresh||!next||!answer||typeof current!=='function'||typeof BANK==='undefined'){
  if(tries<120)setTimeout(install,100);return;
 }
 if(document.getElementById('appLiteModeBar'))return;
 const originalFresh=fresh.onclick,originalNext=next.onclick;
 let mode='all';
 const labels={all:'All',recall:'Recall',compare:'Compare',explain:'Explain / Why',describe:'Describe / How',suggest:'Suggest / Predict',experiment:'Experiment / Relationship'};
 const qText=()=>String(q.textContent||'').trim();
 const kindText=()=>String(document.getElementById('variantNote')?.textContent||'').toLowerCase();
 function category(){
  const t=qText().toLowerCase(),k=kindText();
  if(/^\s*compare\b/.test(t)||/\bcompare\b/.test(k))return'compare';
  if(/\b(explain|why|give\s+(?:a\s+)?reason)\b/.test(t))return'explain';
  if(/\b(suggest|predict)\b/.test(t)||/prediction|suggest|inference/.test(k))return'suggest';
  if(/^\s*(describe|how)\b/.test(t)||/describe|sequence|process/.test(k))return'describe';
  if(/relationship|aim|conclusion|reliab|accurac|fair test|investigat|experiment|results?|data|evidence/.test(t+' '+k))return'experiment';
  if(/^\s*(state|name|identify|what|which)\b/.test(t)||/recall/.test(k))return'recall';
  return'other';
 }
 function tip(){
  const b=document.getElementById('appLiteTip');if(!b)return;
  const c=category();
  const m={
   recall:'Answer directly. A correct Science concept or term may be enough.',
   compare:'Compare directly: state the relevant similarity and/or difference asked. No D/E, S/R or L/R is required unless the question also asks you to explain or give a reason.',
   explain:'Use S/R. Add D/E and L/R only when this exact question needs them.',
   describe:'Describe observations/steps. For How, give the process in logical Science steps.',
   suggest:'Give a reasonable scientifically valid suggestion, or a prediction and reason if asked.',
   experiment:'Use the exact process skill asked: relationship, aim, conclusion, reliability, evidence or fair test.',
   other:'Read the command word first and answer only what is asked.'
  };b.textContent=m[c]||m.other;
 }
 function workload(){
  const b=document.getElementById('appLiteWork');if(!b)return;
  let done=false;try{const d=new Date(),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;done=(rec(current()).appCorrectDates||[]).includes(key)}catch(_e){}
  b.className='app-lite-work'+(done?' done':'');
  b.innerHTML=done?'<b>✅ Enough for this concept today</b> Move to Next. Other questions are optional.':'<b>🎯 Target: 1 correct application for this concept today.</b> If wrong, repair and try one more.';
 }
 function refresh(){tip();workload();}
 function findCurrentMode(max=6){
  if(mode==='all')return true;
  if(category()===mode)return true;
  const seen=new Set([qText()]);
  for(let n=0;n<max;n++){
   if(typeof originalFresh!=='function')break;
   originalFresh.call(fresh);
   const text=qText();
   if(category()===mode)return true;
   if(seen.has(text))break;seen.add(text);
  }
  return category()===mode;
 }
 function setMode(v){
  mode=labels[v]?v:'all';
  document.querySelectorAll('[data-app-lite-mode]').forEach(b=>b.classList.toggle('active',b.dataset.appLiteMode===mode));
  if(mode!=='all'&&!findCurrentMode()){
   const fb=document.getElementById('appFeedback');if(fb){fb.className='fb warnbox';fb.textContent=`No ${labels[mode]} question for this concept. Choose All or move to Next.`}
  }
  refresh();
 }
 const bar=document.createElement('div');bar.id='appLiteModeBar';bar.className='app-lite-bar';bar.innerHTML='<b>Question type</b>'+Object.entries(labels).map(([k,v])=>`<button type="button" data-app-lite-mode="${k}" class="${k==='all'?'active':''}">${v}</button>`).join('');
 q.insertAdjacentElement('beforebegin',bar);
 const tipBox=document.createElement('div');tipBox.id='appLiteTip';tipBox.className='app-lite-tip';q.insertAdjacentElement('beforebegin',tipBox);
 const work=document.createElement('div');work.id='appLiteWork';work.className='app-lite-work';q.insertAdjacentElement('beforebegin',work);
 bar.querySelectorAll('[data-app-lite-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.appLiteMode));
 fresh.onclick=function(){
  if(typeof originalFresh==='function')originalFresh.call(fresh);
  if(mode!=='all')findCurrentMode(5);
  refresh();answer.focus();
 };
 next.onclick=function(){
  if(typeof originalNext==='function')originalNext.call(next);
  if(mode!=='all')findCurrentMode(6);
  refresh();
 };
 const observer=document.getElementById('appFeedback');if(observer)new MutationObserver(refresh).observe(observer,{childList:true,subtree:true});
 const note=app.querySelector('.mode-note');if(note)note.innerHTML='<b>Written Application:</b> choose a question family or use <b>All</b>. Aim for <b>one correct application per concept today</b>; you do not need to finish every variant.';
 const style=document.createElement('style');style.textContent=`.app-lite-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:7px 0;padding:9px 10px;background:#fff;border:1px solid #dbe3ee;border-radius:12px}.app-lite-bar>b{font-size:12px;color:#475569}.app-lite-bar button{padding:7px 9px;font-weight:800;font-size:12px}.app-lite-bar button.active{background:#4338ca;color:#fff;border-color:#4338ca}.app-lite-tip,.app-lite-work{margin:7px 0;padding:9px 11px;border-radius:11px;font-size:12px;line-height:1.4}.app-lite-tip{background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3;font-weight:700}.app-lite-work{background:#fffbeb;border:1px solid #fde68a;color:#92400e}.app-lite-work.done{background:#ecfdf5;border-color:#a7f3d0;color:#047857}@media(max-width:720px){.app-lite-bar{display:grid;grid-template-columns:1fr 1fr}.app-lite-bar>b{grid-column:1/-1}.app-lite-bar button:first-of-type{grid-column:1/-1}}`;
 document.head.appendChild(style);
 refresh();
}
install();
})();