(()=>{
let tries=0;
function start(){
  tries++;
  try{
    if(typeof BANK==='undefined'||typeof rec!=='function'||typeof save!=='function'||typeof shuffle!=='function'){
      if(tries<120)setTimeout(start,100);return;
    }

    const style=document.createElement('style');
    style.textContent=`
      #bank .row{grid-template-columns:38px minmax(0,1fr) 68px!important;position:relative}
      #bank .row.whiterow{background:#fff!important;border-left-color:#cbd5e1!important}
      #bank .row.whiterow .rownum,#bank .row.whiterow .topicname{color:#172033!important}
      #bank .row.whiterow .catname{color:#64748b!important}
      #bank .priority-colors{display:flex!important;gap:5px;justify-content:flex-end;align-items:center}
      #bank .priority-colors button{width:17px!important;height:17px!important;min-width:17px!important;padding:0!important;border-radius:50%!important;cursor:pointer!important}
      #bank .pc-white{background:#fff!important;border:1px solid #64748b!important}
      #bank .pc-green{background:#22c55e!important;border:1px solid #15803d!important}
      #bank .pc-red{background:#dc2626!important;border:1px solid #991b1b!important}
      #bank .priority-colors button.selected{outline:2px solid #312e81!important;outline-offset:2px!important}
      .pill.notstudied{background:#fff!important;color:#172033!important;border:1px solid #cbd5e1!important}
    `;
    document.head.appendChild(style);

    function group(i){
      const x=rec(i)||{};
      if(x.userColour==='red'||x.override==='red')return 'red';
      if(x.userColour==='green'||x.override==='green')return 'green';
      if(x.userColour==='white')return 'white';
      if(['de','sr','lr','concept'].includes(x.appLast)||x.phraseLast==='wrong')return 'red';
      if(typeof phraseIsSecure==='function'&&typeof appIsSecure==='function'&&phraseIsSecure(i)&&appIsSecure(i))return 'green';
      return 'white';
    }
    priority=function(i){const g=group(i);return g==='red'?'red':g==='green'?'green':'amber'};
    labelPriority=function(p){return p==='red'?'🔴 Focus':p==='green'?'🟢 Already Good':'⚪ Not Studied Yet'};

    function setGroup(i,g){
      const x=rec(i);
      x.userColour=g;
      if(g==='red')x.override='red';
      else if(g==='green')x.override='green';
      else x.override='auto';
      save();
    }
    setOverride=function(v){setGroup(current(),v==='red'?'red':v==='green'?'green':'white');render()};

    const qm=document.getElementById('queueMode');
    if(qm)qm.innerHTML='<option value="red">🔴 Focus only</option><option value="amber">⚪ Not Studied Yet only</option><option value="green">🟢 Already Good only</option><option value="all">All 180</option>';
    const bf=document.getElementById('bankFilter');
    if(bf)bf.innerHTML='<option value="all">All 180 — Focus → Not Studied Yet → Already Good</option><option value="red">🔴 Focus only</option><option value="white">⚪ Not Studied Yet only</option><option value="green">🟢 Already Good only</option>';

    const amberLabel=document.getElementById('amberCount')?.previousElementSibling;if(amberLabel)amberLabel.textContent='⚪ Not Studied Yet';
    const greenLabel=document.getElementById('greenCount')?.previousElementSibling;if(greenLabel)greenLabel.textContent='🟢 Already Good';
    const autoBtn=document.getElementById('markAuto');if(autoBtn)autoBtn.textContent='⚪ Not Studied Yet';
    const goodBtn=document.getElementById('markGood');if(goodBtn)goodBtn.textContent='🟢 Already Good';
    const legend=document.querySelector('.priority-legend');if(legend)legend.innerHTML='🔴 Focus · ⚪ Not Studied Yet · 🟢 Already Good<br>All 180 is ranked in this order. Use the dots to change a concept.';

    stats=function(){
      const c={red:0,white:0,green:0};let ps=0,as=0;
      for(let i=0;i<BANK.length;i++){c[group(i)]++;if(phraseIsSecure(i))ps++;if(appIsSecure(i))as++}
      document.getElementById('redCount').textContent=c.red;
      document.getElementById('amberCount').textContent=c.white;
      document.getElementById('greenCount').textContent=c.green;
      document.getElementById('phraseSecure').textContent=ps;
      document.getElementById('appSecure').textContent=as;
      document.getElementById('phraseBar').style.width=(ps/BANK.length*100)+'%';
      document.getElementById('appBar').style.width=(as/BANK.length*100)+'%';
    };

    function emptyQueue(label){
      const qn=document.getElementById('queueNote');if(qn)qn.textContent='0 concepts in this queue';
      const count=document.getElementById('count');if(count)count.textContent='0 / 0';
      const tp=document.getElementById('topicPill');if(tp)tp.textContent=label;
      const pp=document.getElementById('priorityPill');if(pp){pp.className='pill notstudied';pp.textContent='No concepts'}
      const prompt=document.getElementById('phrasePrompt');if(prompt)prompt.textContent='There are no concepts in this group.';
      const src=document.getElementById('bookSource');if(src)src.textContent='Choose another group or change a concept colour in the Priority List.';
      stats();bank();
    }

    buildQueue=function(){
      const mode=qm.value,cat=document.getElementById('categoryMode').value;
      const all=[...Array(BANK.length).keys()].filter(i=>cat==='all'||BANK[i].category===cat);
      let q=mode==='all'?shuffle(all):shuffle(all.filter(i=>group(i)===(mode==='red'?'red':mode==='green'?'green':'white')));
      order=q;pos=0;
      document.getElementById('queueNote').textContent=`${q.length} concept${q.length===1?'':'s'} in this queue`;
      if(q.length)render();else emptyQueue(mode==='red'?'Focus only':mode==='green'?'Already Good only':'Not Studied Yet only');
    };

    function rowHtml(i,cur){
      const e=BANK[i],g=group(i),rc=g==='red'?'redrow':g==='green'?'greenrow':'whiterow',ef=typeof esc==='function'?esc:(s=>String(s));
      return `<div class="row ${rc}${i===cur?' currentrow':''}" data-i="${i}"><div class="rownum">${e.id}</div><div class="topicname">${ef(e.topic)}<span class="catname">${ef(e.category)}</span></div><div class="priority-colors"><button class="pc-white ${g==='white'?'selected':''}" data-colour="white" title="Not Studied Yet"></button><button class="pc-green ${g==='green'?'selected':''}" data-colour="green" title="Already Good"></button><button class="pc-red ${g==='red'?'selected':''}" data-colour="red" title="Focus"></button></div></div>`;
    }

    bank=function(){
      const f=bf?.value||'all',q=(document.getElementById('bankSearch')?.value||'').trim().toLowerCase(),rank={red:0,white:1,green:2},cur=order.length?current():-1;
      let ids=[...Array(BANK.length).keys()];
      if(f!=='all')ids=ids.filter(i=>group(i)===f);
      if(q)ids=ids.filter(i=>`${BANK[i].id} ${BANK[i].topic} ${BANK[i].category} ${BANK[i].phrase}`.toLowerCase().includes(q));
      ids.sort((a,b)=>rank[group(a)]-rank[group(b)]||BANK[a].id-BANK[b].id);
      const el=document.getElementById('bank');
      el.innerHTML=ids.length?ids.map(i=>rowHtml(i,cur)).join(''):'<div class="small" style="padding:16px">No concepts in this group.</div>';
      el.querySelectorAll('.row[data-i]').forEach(r=>r.onclick=ev=>{if(ev.target.closest('.priority-colors'))return;const i=Number(r.dataset.i),idx=order.indexOf(i);if(idx<0){order=[i];pos=0}else pos=idx;render()});
      el.querySelectorAll('button[data-colour]').forEach(b=>b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();const i=Number(b.closest('.row').dataset.i);setGroup(i,b.dataset.colour);stats();bank();if(order.length&&i===current())renderPriorityOnly()});
    };

    renderPriorityOnly=function(){
      if(!order.length)return;
      const g=group(current()),p=document.getElementById('priorityPill'),ot=document.getElementById('overrideText');
      if(g==='red'){p.className='pill red';p.textContent='🔴 Focus'}else if(g==='green'){p.className='pill green';p.textContent='🟢 Already Good'}else{p.className='pill notstudied';p.textContent='⚪ Not Studied Yet'}
      if(ot)ot.textContent=g==='red'?'Focus':g==='green'?'Already Good':'Not Studied Yet';
    };

    const baseRender=render;render=function(){const out=baseRender.apply(this,arguments);renderPriorityOnly();return out};
    document.getElementById('buildQueue').onclick=buildQueue;
    qm.onchange=buildQueue;
    const cm=document.getElementById('categoryMode');if(cm)cm.onchange=buildQueue;
    bf.onchange=bank;
    const bs=document.getElementById('bankSearch');if(bs)bs.oninput=bank;
    document.getElementById('markFocus').onclick=()=>{setGroup(current(),'red');render()};
    document.getElementById('markAuto').onclick=()=>{setGroup(current(),'white');render()};
    document.getElementById('markGood').onclick=()=>{setGroup(current(),'green');render()};

    stats();bank();renderPriorityOnly();
  }catch(err){console.error('priority system',err);if(tries<120)setTimeout(start,100)}
}
start();
})();