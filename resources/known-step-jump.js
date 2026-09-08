(()=>{
const d=document,$=id=>d.getElementById(id);
let tries=0,timer=0;
function proc(){return window.PSLE_PROCESS_MERGE||null}
function nav(){return window.PSLE_GUIDED_NAV||null}
function sciIndex(){try{return typeof current==='function'?current():-1}catch(_e){return -1}}
function known(){try{const i=sciIndex();return i>=0&&new Set(rec(i)?.appCorrectDates||[]).size>=1}catch(_e){return false}}
function processMode(){try{return !!proc()?.isActive?.()}catch(_e){return false}}
function msg(t){const m=$('rjMsg');if(m)m.textContent=t}
function isEnabled(){return !processMode()&&known()}
function sync(){
 const steps=d.querySelector('#guidedFlow .gf-steps');if(!steps)return;
 const on=isEnabled();steps.classList.toggle('known-step-nav',on);
 [['gfStepFlash','Review Flashcard'],['gfStepMem','Review Memorise'],['gfStepApp','Review Application']].forEach(([id,label])=>{const el=$(id);if(!el)return;if(on){el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',label+' — Known concept');el.title=label+' — tap to jump directly'}else{el.removeAttribute('role');el.removeAttribute('tabindex');el.removeAttribute('aria-label');el.removeAttribute('title')}});
}
function clickReviewButton(id,fallback){const b=$(id);if(b){b.click();return true}if(fallback)fallback();return false}
function jumpFlash(){if(!isEnabled())return;clickReviewButton('rjFlash',()=>nav()?.backToFlash?.());msg('Opened Flashcard. Known progress is unchanged.')}
function jumpMem(){if(!isEnabled())return;clickReviewButton('rjMem');msg('Opening Memorise directly. Known progress is unchanged.')}
function firstStoredApp(){const sel=$('rjApps');if(!sel)return'';const opt=[...sel.options].find(o=>String(o.value||'').trim());return opt?.value||''}
function directAppFallback(){
 if(!isEnabled())return;
 const stage=$('guidedFlow')?.dataset?.stage||nav()?.getStage?.()||'';
 if(stage==='app'&&$('gfAppAnswer')){$('gfAppAnswer').focus();msg('Application is already open.');return}
 const openFromMem=()=>{const ta=$('gfRecall'),check=$('gfCheckRecall'),i=sciIndex();if(!ta||!check||i<0||!BANK?.[i]){msg('Application is still preparing. Try again in a moment.');return}ta.value=BANK[i].phrase||'';ta.dispatchEvent(new Event('input',{bubbles:true}));check.click();msg('Opening Application directly. Known progress is unchanged.')};
 if(stage==='mem'){openFromMem();return}
 if(stage==='flash'){
   const go=$('gfFlashConfident');if(go){go.click();setTimeout(openFromMem,120);return}
 }
 msg('Application is still preparing. Try again in a moment.');
}
function jumpApp(){
 if(!isEnabled())return;
 const sel=$('rjApps'),key=firstStoredApp(),open=$('rjOpenApp');
 if(sel&&key&&open){sel.value=key;sel.dispatchEvent(new Event('change',{bubbles:true}));open.click();msg('Opening your most recently tried Application question…');return}
 directAppFallback();
}
function activate(e,id){if(!isEnabled())return;if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;if(e.type==='keydown')e.preventDefault();if(id==='gfStepFlash')jumpFlash();else if(id==='gfStepMem')jumpMem();else if(id==='gfStepApp')jumpApp()}
function install(){
 const flow=$('guidedFlow'),steps=flow?.querySelector('.gf-steps');if(!flow||!steps)return false;
 if(!$('knownStepJumpStyle')){const s=d.createElement('style');s.id='knownStepJumpStyle';s.textContent=`.gf-steps.known-step-nav .gf-step{cursor:pointer;border-radius:12px;padding:4px;transition:background .12s ease,transform .12s ease}.gf-steps.known-step-nav .gf-step:hover,.gf-steps.known-step-nav .gf-step:focus-visible{background:#ecfdf5;outline:2px solid #86efac;outline-offset:2px}.gf-steps.known-step-nav .gf-step:active{transform:scale(.98)}.gf-steps.known-step-nav #gfStepApp{color:#047857}.gf-steps.known-step-nav #gfStepApp span{background:#d1fae5;color:#047857}.gf-steps.known-step-nav #gfStepApp.active span{background:#10b981;color:#fff}`;d.head.appendChild(s)}
 ['gfStepFlash','gfStepMem','gfStepApp'].forEach(id=>{const el=$(id);if(!el||el.dataset.knownJump)return;el.dataset.knownJump='1';el.addEventListener('click',e=>activate(e,id));el.addEventListener('keydown',e=>activate(e,id))});
 new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(sync,35)}).observe(flow,{subtree:true,childList:true,attributes:true,attributeFilter:['data-stage','data-process-mode','class']});
 d.addEventListener('psle-process-mode',sync);d.addEventListener('psle-process-progress',sync);sync();return true;
}
function boot(){tries++;if(!install()&&tries<240)setTimeout(boot,80)}
boot();
})();