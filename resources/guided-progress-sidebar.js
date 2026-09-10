(()=>{
'use strict';
const BUILD='20260910q';
let tries=0,view='notdone',query='',timer=0;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9#]+/g,' ').trim().replace(/\s+/g,' ');
const api=()=>window.PSLE_PROCESS_MERGE||null;
const scienceKnown=i=>{try{return new Set(rec(i)?.appCorrectDates||[]).size>=1}catch(_e){return false}};
const processKnown=id=>{try{return !!api()?.isKnown?.(id)}catch(_e){return false}};
const currentScience=()=>{try{return typeof current==='function'?current():-1}catch(_e){return -1}};
const processActive=()=>{try{return !!api()?.isActive?.()}catch(_e){return false}};

function allItems(){
  const out=[];
  for(let i=0;i<BANK.length;i++){
    const e=BANK[i];
    out.push({kind:'science',idx:i,id:e.id,topic:e.topic||'Science concept',cue:e.phrasePrompt||'',category:e.category||'Science',known:scienceKnown(i)});
  }
  for(const s of (api()?.skills?.()||[]))out.push({kind:'process',id:s.id,topic:s.topic||`Process Skill ${s.id}`,cue:s.cue||'',category:'Process Skills',known:processKnown(s.id)});
  return out;
}
function shownItems(){
  let a=allItems();
  if(query){
    const q=norm(query),num=String(query).trim().match(/^#?(\d{1,3})$/),proc=String(query).trim().match(/^p\s*(\d{1,2})$/i);
    if(num){const n=Number(num[1]);a=a.filter(x=>x.kind==='science'&&Number(x.id)===n)}
    else if(proc){const n=Number(proc[1]);a=a.filter(x=>x.kind==='process'&&Number(x.id)===n)}
    else a=a.filter(x=>norm(`${x.kind==='science'?'#'+x.id:'P'+x.id} ${x.topic} ${x.cue} ${x.category}`).includes(q));
  }else a=a.filter(x=>view==='known'?x.known:!x.known);
  return a;
}
function setMessage(t){const m=$('gpsMessage');if(m)m.textContent=t||''}

function parentTrainerUrl(kind,id){
  try{
    const u=new URL(window.parent.location.href);
    const base=u.pathname.replace(/[^/]*$/,'');
    u.pathname=base+'trainer180-app.html';
    u.search='';
    u.searchParams.set('v',BUILD);
    u.searchParams.set('goto',`${kind}:${id}`);
    u.searchParams.set('nav',String(Date.now()));
    u.hash='';
    return u.href;
  }catch(_e){
    return `trainer180-app.html?v=${BUILD}&goto=${encodeURIComponent(kind+':'+id)}&nav=${Date.now()}`;
  }
}
function openItem(kind,id){
  const label=kind==='science'?(BANK?.[Number(id)]?`#${BANK[Number(id)].id}`:'concept'):`P${id}`;
  setMessage(`Opening ${label}…`);
  const url=parentTrainerUrl(kind,Number(id));
  try{window.parent.location.assign(url)}catch(_e){location.assign(url)}
}

function renderList(){
  const list=$('gpsList');if(!list)return;
  const oldTop=list.scrollTop,all=allItems(),known=all.filter(x=>x.known).length,notdone=all.length-known,show=shownItems();
  $('gpsKnown').textContent=`✓ Known ${known}`;$('gpsNotDone').textContent=`○ Not done ${notdone}`;
  $('gpsKnown').classList.toggle('on',!query&&view==='known');$('gpsNotDone').classList.toggle('on',!query&&view==='notdone');
  const hint=$('gpsFindHint');if(hint)hint.textContent=query?`${show.length} match${show.length===1?'':'es'} across all 192.`:'Find any concept by number, topic or question.';
  if(!show.length){list.innerHTML='<div class="gps-empty">No matching items.</div>';return}
  let last='',html=[];const pActive=processActive(),pId=api()?.getCurrentId?.(),sCur=currentScience();
  for(const x of show){
    if(x.category!==last){last=x.category;html.push(`<div class="gps-group">${esc(x.category)}</div>`)}
    const current=x.kind==='process'?(pActive&&Number(pId)===x.id):(!pActive&&sCur===x.idx);
    html.push(`<button type="button" class="gps-row ${current?'current':''}" data-kind="${x.kind}" data-id="${x.kind==='science'?x.idx:x.id}"><span class="gps-dot">${x.known?'✅':'○'}</span><span class="gps-text"><b>${x.kind==='science'?'#'+x.id:'P'+x.id} ${esc(x.topic)}</b><small>${esc(x.cue)}</small></span><span class="gps-state ${x.known?'known':''}">${x.known?'Known':'Not done'}</span></button>`);
  }
  list.innerHTML=html.join('');
  requestAnimationFrame(()=>{list.scrollTop=Math.min(oldTop,Math.max(0,list.scrollHeight-list.clientHeight))});
}
function install(){
  const flow=$('guidedFlow');if(!flow||$('guidedProgressSidebar'))return;
  const parent=flow.parentElement,layout=document.createElement('div');layout.id='guidedLayout';parent.insertBefore(layout,flow);layout.appendChild(flow);
  const side=document.createElement('aside');side.id='guidedProgressSidebar';side.innerHTML=`
    <div class="gps-head"><div><div class="gps-eyebrow">192-ITEM MASTERY</div><h3 id="gpsStudent">Science mastery</h3></div><button id="gpsCollapse" class="gps-icon" type="button" title="Hide mastery list">×</button></div>
    <div class="gps-find"><input id="gpsFind" type="search" autocomplete="off" placeholder="Find #56, roots, light…"><button id="gpsFindGo" type="button">Go</button></div>
    <div id="gpsFindHint" class="gps-findhint"></div>
    <div class="gps-tabs"><button id="gpsNotDone" type="button"></button><button id="gpsKnown" type="button"></button></div>
    <div id="gpsMessage" class="gps-message">Click any item to open it.</div>
    <div id="gpsList" class="gps-list"></div>
    <div class="gps-foot"><b>180 Science concepts + 12 Process Skills.</b><br>Click any item to move straight to it.</div>`;
  layout.appendChild(side);
  const style=document.createElement('style');style.id='guidedProgressSidebarStyle';style.textContent=`
  body.gf-on>.wrap{max-width:1380px!important}#guidedLayout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:14px;max-width:1360px;margin:0 auto 28px;align-items:start}#guidedLayout>#guidedFlow{max-width:none!important;margin:12px 0 0!important}
  #guidedProgressSidebar{margin-top:12px;background:#fff;border:1px solid #dbe3ee;border-radius:20px;box-shadow:0 12px 32px #0f172a10;position:sticky;top:12px;height:calc(100dvh - 24px);min-height:560px;display:flex;flex-direction:column;overflow:hidden;overscroll-behavior:contain}
  .gps-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:14px 12px 8px;flex:0 0 auto}.gps-eyebrow{font-size:10px;letter-spacing:.12em;font-weight:900;color:#4f46e5}.gps-head h3{margin:3px 0 0;font-size:18px}.gps-icon{border:1px solid #dbe3ee;background:#f8fafc;color:#64748b;border-radius:9px;width:30px;height:30px;font-weight:900;cursor:pointer}
  .gps-find{display:grid;grid-template-columns:minmax(0,1fr) 46px;gap:6px;padding:0 10px 4px;flex:0 0 auto}.gps-find input{min-width:0;border:2px solid #c7d2fe;border-radius:10px;padding:9px 10px;font-size:12px}.gps-find button{border:0;border-radius:9px;background:#4338ca;color:#fff;font-weight:900;cursor:pointer}.gps-findhint{padding:0 11px 7px;color:#64748b;font-size:9px;flex:0 0 auto}
  .gps-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 10px 7px;flex:0 0 auto}.gps-tabs button{border:1px solid #dbe3ee;background:#f8fafc;color:#475569;border-radius:9px;padding:8px 6px;font-size:11px;font-weight:900;cursor:pointer}.gps-tabs button.on{background:#4338ca;color:#fff;border-color:#4338ca}.gps-message{padding:0 11px 7px;color:#475569;font-size:10px;font-weight:800;min-height:15px;flex:0 0 auto}
  .gps-list{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;scroll-behavior:auto;padding:0 7px 10px}.gps-group{padding:9px 7px 4px;color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.gps-row{width:100%;display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:6px;align-items:start;text-align:left;border:1px solid transparent;background:transparent;border-radius:10px;padding:8px 6px;cursor:pointer;color:#334155}.gps-row:hover{background:#f8fafc;border-color:#e2e8f0}.gps-row.current{background:#eef2ff;border-color:#c7d2fe}.gps-text{min-width:0}.gps-row b{display:block;font-size:12px;line-height:1.25}.gps-row small{display:block;color:#64748b;font-size:9px;line-height:1.25;margin-top:2px}.gps-state{padding:3px 5px;border-radius:999px;background:#f1f5f9;color:#64748b;font-size:8px;font-weight:900;white-space:nowrap}.gps-state.known{background:#dcfce7;color:#166534}.gps-empty{padding:25px 10px;text-align:center;color:#64748b;font-size:12px}.gps-foot{border-top:1px solid #eef2f7;background:#f8fafc;padding:9px 10px;color:#64748b;font-size:9px;line-height:1.35;flex:0 0 auto}
  @media(max-width:1100px){#guidedLayout{grid-template-columns:1fr}#guidedProgressSidebar{position:static;order:-1;height:auto;min-height:0;max-height:55vh}.gps-list{max-height:38vh}}
  @media(max-width:520px){.gps-find input{font-size:16px}.gps-row{padding:10px 7px}.gps-row b{font-size:13px}}
  `;document.head.appendChild(style);
  $('gpsStudent').textContent=(window.PSLE_ACTIVE_STUDENT_NAME?window.PSLE_ACTIVE_STUDENT_NAME+"'s mastery":'Science mastery');
  $('gpsNotDone').onclick=()=>{view='notdone';query='';$('gpsFind').value='';renderList()};
  $('gpsKnown').onclick=()=>{view='known';query='';$('gpsFind').value='';renderList()};
  const searchNow=()=>{query=$('gpsFind').value.trim();renderList()};
  $('gpsFindGo').onclick=searchNow;
  $('gpsFind').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(searchNow,120)});
  $('gpsFind').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchNow();const first=$('gpsList .gps-row');if(first)openItem(first.dataset.kind,Number(first.dataset.id))}});
  $('gpsCollapse').onclick=()=>{side.style.display='none';document.getElementById('guidedLayout').style.gridTemplateColumns='minmax(0,1fr)'};
  $('gpsList').addEventListener('click',e=>{const row=e.target.closest('.gps-row');if(!row)return;e.preventDefault();e.stopPropagation();openItem(row.dataset.kind,Number(row.dataset.id))});
  document.addEventListener('psle-process-progress',()=>{clearTimeout(timer);timer=setTimeout(renderList,80)});
  document.addEventListener('psle-process-mode',()=>{clearTimeout(timer);timer=setTimeout(renderList,80)});
  renderList();
}
function boot(){tries++;if(!$('guidedFlow')||typeof BANK==='undefined'||!Array.isArray(BANK)||BANK.length!==180||!api()){if(tries<240)setTimeout(boot,80);return}install()}
boot();
})();