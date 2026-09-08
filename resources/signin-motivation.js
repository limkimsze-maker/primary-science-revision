(()=>{
const AUTH='https://primary-science-ai-marker.limkimsze-maker.workers.dev';
let allowOnce='';
const tokenKey=s=>`psleScience_cloud_auth_token_${s}`;
const nameOf=s=>s==='jerry'?'Jerry':'Javis';

function ensureAuthStyle(){
 if(document.getElementById('psleAuthStyle'))return;
 const s=document.createElement('style');s.id='psleAuthStyle';s.textContent=`
 .psle-auth-overlay{position:fixed;inset:0;z-index:9999;background:#0f172acc;display:grid;place-items:center;padding:18px}
 .psle-auth-card{width:min(430px,96vw);background:#fff;border-radius:20px;padding:22px;box-shadow:0 24px 70px #0005}
 .psle-auth-card h3{margin:0 0 7px;font-size:24px}.psle-auth-card p{margin:0 0 14px;color:#475569;line-height:1.5}
 .psle-auth-card input{width:100%;border:2px solid #cbd5e1;border-radius:12px;padding:12px 13px;font:inherit;font-size:17px}
 .psle-auth-card input:focus{outline:none;border-color:#4338ca}.psle-auth-actions{display:flex;gap:9px;margin-top:12px}
 .psle-auth-actions button{border:1px solid #dbe3ee;border-radius:11px;padding:11px 14px;background:#fff;font-weight:800;cursor:pointer}
 .psle-auth-actions .go{background:#4338ca;border-color:#4338ca;color:#fff;flex:1}.psle-auth-msg{min-height:20px;margin-top:10px;font-size:12px;font-weight:800;color:#991b1b}
 .cloud-note{font-size:11px;color:#047857;font-weight:800;margin-top:5px}
 `;document.head.appendChild(s);
}

async function sessionValid(student){
 const token=localStorage.getItem(tokenKey(student))||'';
 if(!token)return false;
 try{
  const r=await fetch(AUTH+'/auth/session',{headers:{authorization:`Bearer ${token}`}});
  if(!r.ok){localStorage.removeItem(tokenKey(student));return false}
  const d=await r.json();return d?.ok&&d?.student===student;
 }catch(_e){return false}
}

function loginModal(student,button){
 ensureAuthStyle();
 document.querySelector('.psle-auth-overlay')?.remove();
 const o=document.createElement('div');o.className='psle-auth-overlay';
 o.innerHTML=`<form class="psle-auth-card"><h3>Sign in as ${nameOf(student)}</h3><p>Enter ${nameOf(student)}'s password. The password is checked securely by Cloudflare and is not stored in this browser.</p><input type="password" autocomplete="current-password" placeholder="Password" required><div class="psle-auth-actions"><button type="button" class="cancel">Cancel</button><button class="go" type="submit">Sign in</button></div><div class="psle-auth-msg"></div></form>`;
 document.body.appendChild(o);
 const form=o.querySelector('form'),input=o.querySelector('input'),msg=o.querySelector('.psle-auth-msg'),go=o.querySelector('.go');
 o.querySelector('.cancel').onclick=()=>o.remove();
 form.onsubmit=async e=>{
  e.preventDefault();const password=input.value;if(!password)return;
  go.disabled=true;go.textContent='Signing in…';msg.textContent='';
  try{
   const r=await fetch(AUTH+'/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({student,password})});
   const d=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(d?.error||'Could not sign in.');
   localStorage.setItem(tokenKey(student),d.token);
   o.remove();allowOnce=student;button.click();
  }catch(err){msg.textContent=String(err?.message||err);go.disabled=false;go.textContent='Sign in';input.select()}
 };
 setTimeout(()=>input.focus(),30);
}

// Capture the profile click before the original page handler. After successful
// authentication we replay the click once, allowing the existing migration/profile logic to run unchanged.
document.addEventListener('click',async e=>{
 const b=e.target.closest?.('[data-student]');if(!b)return;
 const student=String(b.dataset.student||'').toLowerCase();if(!['jerry','javis'].includes(student))return;
 if(allowOnce===student){allowOnce='';return}
 e.preventDefault();e.stopImmediatePropagation();
 b.disabled=true;const old=b.textContent;b.textContent='Checking sign-in…';
 const ok=await sessionValid(student);b.disabled=false;b.textContent=old;
 if(ok){allowOnce=student;b.click();return}
 loginModal(student,b);
},true);

function enhance(){const cards=[...document.querySelectorAll('.profile')];if(!cards.length)return;cards.forEach(card=>{if(!card.querySelector('.sm-progress')){const metrics=[...card.querySelectorAll('.metric')];const knownMetric=metrics.find(m=>/Total Known/i.test(m.textContent));const known=Number((knownMetric?.querySelector('b')?.textContent||'0').split('/')[0])||0;const next=[1,5,10,25,50,75,100,125,150,175,192].find(x=>x>known)||192;const title=known>=192?'Mastery Complete':known>=150?'PSLE Science Ace':known>=100?'Science Strategist':known>=60?'Science Specialist':known>=30?'Scientist':known>=15?'Investigator':known>=5?'Explorer':'Starter';const msg=known===0?'Start with one item. One correct Application question makes it Known.':known<10?'Each Known item is one less idea to worry about in revision.':known<50?'Momentum is building. Keep turning recall into application.':known<100?'Strong foundation. Keep converting Science ideas into PSLE answers.':known<150?'You have mastered a large part of the bank. Keep closing the remaining gaps.':known<192?'Final stretch. Focus on the Not done list and finish strongly.':'All 192 items are Known. Revisit weak areas whenever you want extra transfer practice.';const el=document.createElement('div');el.className='sm-progress';el.innerHTML=`<div class="sm-row"><b>${title}</b><span>${known*100} Mastery XP</span></div><div class="sm-track"><i style="width:${Math.min(100,known/192*100)}%"></i></div><div class="sm-copy">${msg}</div><div class="sm-next">${known>=192?'🏅 192/192 mastered':`${next-known} more to reach the ${next}-Known milestone`}</div>`;card.querySelector('.profile-actions')?.insertAdjacentElement('beforebegin',el)}if(!card.querySelector('.cloud-note')){const n=document.createElement('div');n.className='cloud-note';n.textContent='☁ Password-protected cloud progress';card.querySelector('.status')?.insertAdjacentElement('afterend',n)}});if(!document.getElementById('signinMotivationStyle')){const s=document.createElement('style');s.id='signinMotivationStyle';s.textContent=`.sm-progress{margin:14px 0;padding:12px;border-radius:14px;background:linear-gradient(135deg,#eef2ff,#ecfeff);border:1px solid #dbeafe}.sm-row{display:flex;justify-content:space-between;gap:8px;align-items:center}.sm-row b{font-size:14px;color:#172033}.sm-row span{font-size:10px;font-weight:900;color:#4338ca;background:#fff;border:1px solid #c7d2fe;padding:4px 7px;border-radius:999px}.sm-track{height:7px;background:#dbeafe;border-radius:999px;overflow:hidden;margin:9px 0}.sm-track i{display:block;height:100%;background:linear-gradient(90deg,#4f46e5,#0f766e);border-radius:inherit}.sm-copy{font-size:11px;line-height:1.45;color:#334155;font-weight:700}.sm-next{font-size:10px;color:#64748b;font-weight:800;margin-top:5px}`;document.head.appendChild(s)}}
function boot(){const p=document.getElementById('profiles');if(!p){setTimeout(boot,80);return}enhance();new MutationObserver(()=>enhance()).observe(p,{childList:true,subtree:false});window.addEventListener('psle-signin-render',enhance)}
boot();
})();