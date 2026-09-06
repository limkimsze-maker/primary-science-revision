(()=>{
let tries=0,view='notdone',timer=0;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function boot(){
  tries++;
  const flow=$('guidedFlow');
  if(!flow||typeof BANK==='undefined'||!Array.isArray(BANK)||BANK.length!==180||typeof rec!=='function'||typeof current!=='function'){
    if(tries<180)setTimeout(boot,80);return;
  }
  if($('guidedProgressSidebar'))return;
  install(flow);
}
function known(i){try{return new Set(rec(i)?.appCorrectDates||[]).size>=1}catch(_e){return false}}
function currentIndex(){try{return current()}catch(_e){return -1}}
function stageOpen(){const f=$('guidedFlow');return (f?.dataset?.stage||'flash')==='flash'&&!(f?.dataset?.reviewReturn||'')}
function install(flow){
  const parent=flow.parentElement,layout=document.createElement('div');layout.id='guidedLayout';parent.insertBefore(layout,flow);layout.appendChild(flow);
  const side=document.createElement('aside');side.id='guidedProgressSidebar';side.innerHTML=`
    <div class="gps-head"><div><div class="gps-eyebrow">CONCEPT PROGRESS</div><h3 id="gpsStudent">Science concepts</h3></div><button id="gpsCollapse" class="gps-icon" title="Hide concept list">‹</button></div>
    <div class="gps-tabs"><button id="gpsNotDone" data-view="notdone"></button><button id="gpsKnown" data-view="known"></button></div>
    <div class="gps-tools"><button id="gpsShowAll">Show all in this group</button></div>
    <div id="gpsMessage" class="gps-message"></div>
    <div id="gpsList" class="gps-list"></div>
    <div class="gps-foot">A concept becomes <b>Known</b> after one Application question is completed correctly.</div>`;
  layout.appendChild(side);
  const style=document.createElement('style');style.id='guidedProgressSidebarStyle';style.textContent=`
  body.gf-on>.wrap{max-width:1380px!important}#guidedLayout{display:grid;grid-template-columns:minmax(0,1fr) 286px;gap:14px;max-width:1320px;margin:0 auto 28px;align-items:start}#guidedLayout>#guidedFlow{max-width:none!important;margin:12px 0 0!important}#guidedProgressSidebar{margin-top:12px;background:#fff;border:1px solid #dbe3ee;border-radius:20px;box-shadow:0 12px 32px #0f172a10;position:sticky;top:12px;max-height:calc(100vh - 24px);display:flex;flex-direction:column;overflow:hidden}.gps-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:16px 14px 10px}.gps-eyebrow{font-size:10px;letter-spacing:.12em;font-weight:900;color:#4f46e5}.gps-head h3{margin:3px 0 0;font-size:19px}.gps-icon{border:1px solid #dbe3ee;background:#f8fafc;color:#64748b;border-radius:9px;width:30px;height:30px;font-weight:900;cursor:pointer}.gps-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 12px 8px}.gps-tabs button,.gps-tools button{border:1px solid #dbe3ee;background:#f8fafc;color:#475569;border-radius:10px;padding:8px 7px;font-size:11px;font-weight:900;cursor:pointer}.gps-tabs button.on{background:#4338ca;color:#fff;border-color:#4338ca}.gps-tools{padding:0 12px 8px}.gps-tools button{width:100%;background:#fff}.gps-message{min-height:17px;padding:0 14px 6px;color:#64748b;font-size:10px;font-weight:800}.gps-list{overflow:auto;padding:0 8px 10px}.gps-group{padding:8px 7px 4px;color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.gps-row{width:100%;display:grid;grid-template-columns:23px 1fr;gap:7px;text-align:left;border:1px solid transparent;background:transparent;border-radius:11px;padding:8px 7px;cursor:pointer;color:#334155}.gps-row:hover{background:#f8fafc;border-color:#e2e8f0}.gps-row.current{background:#eef2ff;border-color:#c7d2fe}.gps-row .gps-dot{font-size:13px;line-height:1.25}.gps-row b{display:block;font-size:12px;line-height:1.25}.gps-row small{display:block;color:#64748b;font-size:9px;margin-top:2px;line-height:1.25}.gps-row.locked{opacity:.55;cursor:not-allowed}.gps-foot{border-top:1px solid #eef2f7;background:#f8fafc;padding:10px 12px;color:#64748b;font-size:10px;line-height:1.4}.gps-collapsed{grid-template-columns:minmax(0,1fr) 44px!important}.gps-collapsed #guidedProgressSidebar{min-height:120px}.gps-collapsed #guidedProgressSidebar>*:not(.gps-head){display:none}.gps-collapsed .gps-head{padding:9px 6px;justify-content:center}.gps-collapsed .gps-head>div{display:none}.gps-collapsed .gps-icon{transform:rotate(180deg)}body.gf-classic #guidedProgressSidebar{display:none!important}body.gf-classic #guidedLayout{display:block;max-width:none;margin:0}
  @media(max-width:1100px){#guidedLayout{grid-template-columns:1fr}.gps-collapsed{grid-template-columns:1fr!important}#guidedProgressSidebar{position:static;max-height:none;order:-1;margin-top:8px}.gps-list{max-height:260px}.gps-collapsed #guidedProgressSidebar{min-height:auto}.gps-collapsed .gps-head{justify-content:flex-end}}
  `;document.head.appendChild(style);
  side.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});
  $('gpsShowAll').onclick=showAll;
  $('gpsCollapse').onclick=()=>{layout.classList.toggle('gps-collapsed');$('gpsCollapse').title=layout.classList.contains('gps-collapsed')?'Show concept list':'Hide concept list'};
  $('gpsStudent').textContent=(window.PSLE_ACTIVE_STUDENT_NAME?window.PSLE_ACTIVE_STUDENT_NAME+"'s concepts":'Science concepts');
  new MutationObserver(schedule).observe(flow,{childList:true,subtree:true,attributes:true,attributeFilter:['data-stage','data-review-return','data-resume-app']});
  render();
}
function schedule(){clearTimeout(timer);timer=setTimeout(render,35)}
function render(){
  const list=$('gpsList');if(!list)return;
  const all=[...Array(BANK.length).keys()],k=all.filter(known),n=all.filter(i=>!known(i)),items=view==='known'?k:n,cur=currentIndex(),open=stageOpen();
  $('gpsNotDone').textContent=`○ Not done ${n.length}`;$('gpsKnown').textContent=`✓ Known ${k.length}`;
  $('gpsNotDone').classList.toggle('on',view==='notdone');$('gpsKnown').classList.toggle('on',view==='known');
  $('gpsMessage').textContent=open?'Click a concept to jump to it.':'Finish/review the current concept before jumping.';
  if(!items.length){list.innerHTML=`<div style="padding:25px 12px;text-align:center;color:#64748b;font-size:12px">${view==='known'?'No Known concepts yet.':'All concepts are Known ✓'}</div>`;return}
  let lastCat='';const html=[];
  for(const i of items){const e=BANK[i],cat=e.category||'Other';if(cat!==lastCat){lastCat=cat;html.push(`<div class="gps-group">${esc(cat)}</div>`)}html.push(`<button class="gps-row ${i===cur?'current':''} ${open?'':'locked'}" data-i="${i}"><span class="gps-dot">${view==='known'?'✅':'○'}</span><span><b>#${esc(e.id)} ${esc(e.topic||'Science concept')}</b><small>${esc(e.phrasePrompt||'')}</small></span></button>`)}
  list.innerHTML=html.join('');list.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>jump(Number(b.dataset.i)));
  const active=list.querySelector('.gps-row.current');if(active&&!list.dataset.initialScroll){list.dataset.initialScroll='1';setTimeout(()=>active.scrollIntoView({block:'nearest'}),0)}
}
function setMessage(t){const m=$('gpsMessage');if(m)m.textContent=t}
function jump(i){
  if(!stageOpen()){setMessage('Finish/review the current concept before jumping.');return}
  const e=BANK[i],status=$('gfStatus'),topic=$('gfTopic'),search=$('gfSearch');if(!e||!status||!topic||!search)return;
  topic.value='all';topic.dispatchEvent(new Event('change',{bubbles:true}));
  status.value=known(i)?'known':'notdone';status.dispatchEvent(new Event('change',{bubbles:true}));
  search.value=`${e.id} ${e.topic||''}`.trim();search.dispatchEvent(new Event('input',{bubbles:true}));
  setMessage(`Opening #${e.id} ${e.topic||''}…`);
}
function showAll(){
  if(!stageOpen()){setMessage('Finish/review the current concept before changing the list.');return}
  const status=$('gfStatus'),topic=$('gfTopic'),search=$('gfSearch');if(!status||!topic||!search)return;
  topic.value='all';topic.dispatchEvent(new Event('change',{bubbles:true}));status.value=view;status.dispatchEvent(new Event('change',{bubbles:true}));search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));setMessage(view==='known'?'Showing all Known concepts.':'Showing all Not done concepts.');
}
boot();
})();