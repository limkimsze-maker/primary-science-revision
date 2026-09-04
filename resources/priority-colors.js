(()=>{
if(typeof BANK==='undefined'||typeof rec!=='function'||typeof save!=='function'||typeof priority!=='function')return;
const style=document.createElement('style');
style.textContent=`
#bank .row{grid-template-columns:38px minmax(0,1fr) 54px;position:relative}
#bank .row.whiterow{background:#fff;border-left-color:#e2e8f0}
#bank .row.whiterow .rownum,#bank .row.whiterow .topicname{color:#172033}
#bank .row.whiterow .catname{color:#64748b}
.priority-colors{display:flex;gap:3px;justify-content:flex-end;align-items:center}
.priority-colors button{width:15px;height:15px;min-width:15px;padding:0;border-radius:50%;border:1px solid #94a3b8;box-shadow:none}
.priority-colors button:hover{transform:scale(1.15)}
.priority-colors .pc-white{background:#fff}
.priority-colors .pc-green{background:#22c55e;border-color:#15803d}
.priority-colors .pc-red{background:#dc2626;border-color:#991b1b}
.priority-colors button.selected{outline:2px solid #312e81;outline-offset:1px}
`;
document.head.appendChild(style);

function paintBank(){
 const f=document.getElementById('bankFilter')?.value||'all';
 const q=(document.getElementById('bankSearch')?.value||'').trim().toLowerCase();
 const cur=typeof current==='function'?current():-1;
 const html=BANK.map((e,i)=>{
   const x=rec(i),manual=x.override||'auto';
   if(f!=='all'&&manual!==f)return '';
   if(q){const hay=`${e.id} ${e.topic} ${e.category} ${e.phrase}`.toLowerCase();if(!hay.includes(q))return ''}
   const rowClass=manual==='red'?'redrow':manual==='green'?'greenrow':'whiterow';
   const currentClass=i===cur?' currentrow':'';
   const escFn=typeof esc==='function'?esc:(s=>String(s));
   return `<div class="row ${rowClass}${currentClass}" data-i="${i}">
     <div class="rownum">${e.id}</div>
     <div class="topicname">${escFn(e.topic)}<span class="catname">${escFn(e.category)}</span></div>
     <div class="priority-colors" title="Set priority colour">
       <button class="pc-white ${manual==='auto'?'selected':''}" data-colour="auto" aria-label="Set white"></button>
       <button class="pc-green ${manual==='green'?'selected':''}" data-colour="green" aria-label="Set green"></button>
       <button class="pc-red ${manual==='red'?'selected':''}" data-colour="red" aria-label="Set red"></button>
     </div>
   </div>`;
 }).join('');
 const bankEl=document.getElementById('bank');
 if(!bankEl)return;
 bankEl.innerHTML=html||'<div class="small" style="padding:16px">No concepts match this filter/search.</div>';
 bankEl.querySelectorAll('.row[data-i]').forEach(r=>{
   r.onclick=ev=>{
     if(ev.target.closest('.priority-colors'))return;
     const i=Number(r.dataset.i),idx=order.indexOf(i);
     if(idx<0){order=[i,...order];pos=0}else pos=idx;
     render();
     if(window.innerWidth<1031)window.scrollTo({top:0,behavior:'smooth'});
   };
 });
 bankEl.querySelectorAll('.priority-colors button[data-colour]').forEach(b=>{
   b.onclick=ev=>{
     ev.preventDefault();ev.stopPropagation();
     const row=b.closest('.row[data-i]');
     const i=Number(row.dataset.i); const v=b.dataset.colour;
     rec(i).override=v;
     // A manual choice takes precedence over the imported past-paper colour.
     rec(i).userColour=v;
     save();
     if(typeof stats==='function')stats();
     paintBank();
     if(i===cur&&typeof renderPriorityOnly==='function')renderPriorityOnly();
   };
 });
}

bank=paintBank;
const filter=document.getElementById('bankFilter');if(filter){filter.onchange=paintBank;for(const o of filter.options){if(o.value==='auto')o.textContent='⚪ White / Neutral'}}
const search=document.getElementById('bankSearch');if(search)search.oninput=paintBank;
const legend=document.querySelector('.priority-legend');if(legend)legend.innerHTML='🔴 Focus · ⚪ White / Neutral · 🟢 Strong<br>Click a colour dot to change it. Click the concept itself to practise.';
paintBank();
})();