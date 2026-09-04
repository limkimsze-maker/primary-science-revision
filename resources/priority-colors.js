(()=>{
let tries=0;
function start(){
  tries++;
  try{
    if(typeof BANK==='undefined'||typeof rec!=='function'||typeof save!=='function'||typeof shuffle!=='function'){
      if(tries<120)setTimeout(start,100);return;
    }
    if(window.__threePrioritySystemInstalled)return;
    window.__threePrioritySystemInstalled=true;

    const style=document.createElement('style');
    style.textContent=`
      #bank .row{grid-template-columns:38px minmax(0,1fr) 68px!important;position:relative}
      #bank .row.whiterow{background:#fff!important;border-left-color:#cbd5e1!important}
      #bank .row.whiterow .rownum,#bank .row.whiterow .topicname{color:#172033!important}
      #bank .row.whiterow .catname{color:#64748b!important}
      #bank .priority-colors{display:flex!important;gap:5px;justify-content:flex-end;align-items:center;z-index:5}
      #bank .priority-colors button{display:block!important;width:17px!important;height:17px!important;min-width:17px!important;padding:0!important;border-radius:50%!important;box-shadow:none!important;cursor:pointer!important}
      #bank .priority-colors .pc-white{background:#fff!important;border:1px solid #64748b!important}
      #bank .priority-colors .pc-green{background:#22c55e!important;border:1px solid #15803d!important}
      #bank .priority-colors .pc-red{background:#dc2626!important;border:1px solid #991b1b!important}
      #bank .priority-colors button.selected{outline:2px solid #312e81!important;outline-offset:2px!important}
      .pill.notstudied{background:#fff!important;color:#172033!important;border:1px solid #cbd5e1!important}
    `;
    document.head.appendChild(style);

    function group(i){
      const x=rec(i)||{};
      if(x.userColour==='red'||x.override==='red')return 'red';
      if(x.userColour==='green'||x.override==='green')return 'green';
      return 'white';
    }
    function priorityCode(i){const g=group(i);return g==='red'?'red':g==='green'?'green':'amber'}

    // Make the displayed priority and every queue/filter use the same three groups.
    priority=function(i){return priorityCode(i)};
    labelPriority=function(p){return p==='red'?'🔴 Focus':p==='green'?'🟢 Already Good':'⚪ Not Studied Yet'};

    function setGroup(i,g){
      const x=rec(i);
      if(g==='red'){x.override='red';x.userColour='red'}
      else if(g==='green'){x.override='green';x.userColour='green'}
      else{x.override='auto';x.userColour='white'}
      save();
    }
    setOverride=function(v){
      const g=v==='red'?'red':v==='green'?'green':'white';
      setGroup(current(),g);render();
    };

    // Rename all visible terminology.
    const qm=document.getElementById('queueMode');
    if(qm){
      qm.innerHTML='<option value="smart">Smart 20 — 60% Focus · 30% Not Studied Yet · 10% Already Good</option><option value="red">Focus only</option><option value="amber">Not Studied Yet only</option><option value="green">Already Good only</option><option value="all">All 180</option>';
    }
    const bf=document.getElementById('bankFilter');
    if(bf){
      bf.innerHTML='<option value="all">All 180 — Focus → Not Studied Yet → Already Good</option><option value="red">🔴 Focus only</option><option value="white">⚪ Not Studied Yet only</option><option value="green">🟢 Already Good only</option>';
    }
    const amberLabel=document.getElementById('amberCount')?.previousElementSibling;
    const greenLabel=document.getElementById('greenCount')?.previousElementSibling;
    if(amberLabel)amberLabel.textContent='⚪ Not Studied Yet';
    if(greenLabel)greenLabel.textContent='🟢 Already Good';
    const autoBtn=document.getElementById('markAuto');if(autoBtn)autoBtn.textContent='⚪ Not Studied Yet';
    const goodBtn=document.getElementById('markGood');if(goodBtn)goodBtn.textContent='🟢 Already Good';
    const legend=document.querySelector('.priority-legend');
    if(legend)legend.innerHTML='🔴 Focus · ⚪ Not Studied Yet · 🟢 Already Good<br>Use the three dots to classify each concept. All view is ranked in that order.';

    stats=function(){
      const c={red:0,white:0,green:0};let ps=0,as=0;
      for(let i=0;i<BANK.length;i++){
        c[group(i)]++;
        if(typeof phraseIsSecure==='function'&&phraseIsSecure(i))ps++;
        if(typeof appIsSecure==='function'&&appIsSecure(i))as++;
      }
      document.getElementById('redCount').textContent=c.red;
      document.getElementById('amberCount').textContent=c.white;
      document.getElementById('greenCount').textContent=c.green;
      document.getElementById('phraseSecure').textContent=ps;
      document.getElementById('appSecure').textContent=as;
      document.getElementById('phraseBar').style.width=(ps/BANK.length*100)+'%';
      document.getElementById('appBar').style.width=(as/BANK.length*100)+'%';
    };

    function renderEmptyQueue(label){
      const qn=document.getElementById('queueNote');if(qn)qn.textContent='0 concepts in this queue';
      const count=document.getElementById('count');if(count)count.textContent='0 / 0';
      const pp=document.getElementById('priorityPill');if(pp){pp.className='pill notstudied';pp.textContent='No concepts'}
      const tp=document.getElementById('topicPill');if(tp)tp.textContent=label||'Empty queue';
      const cp=document.getElementById('categoryPill');if(cp)cp.textContent='';
      const prompt=document.getElementById('phrasePrompt');if(prompt)prompt.textContent='There are no concepts in this group.';
      const src=document.getElementById('bookSource');if(src)src.textContent='Choose another queue or change a concept colour in the Priority List.';
      const pa=document.getElementById('phraseAnswer');if(pa)pa.value='';
      stats();bank();
    }

    buildQueue=function(){
      const mode=document.getElementById('queueMode').value;
      const cat=document.getElementById('categoryMode').value;
      const all=[...Array(BANK.length).keys()].filter(i=>cat==='all'||BANK[i].category===cat);
      const groups={
        red:shuffle(all.filter(i=>group(i)==='red')),
        amber:shuffle(all.filter(i=>group(i)==='white')),
        green:shuffle(all.filter(i=>group(i)==='green'))
      };
      let q=[];
      if(mode==='all')q=shuffle(all);
      else if(mode==='red')q=groups.red.slice();
      else if(mode==='amber')q=groups.amber.slice();
      else if(mode==='green')q=groups.green.slice();
      else{
        const take=(arr,n)=>arr.splice(0,Math.min(n,arr.length));
        q=[...take(groups.red,12),...take(groups.amber,6),...take(groups.green,2)];
        let remain=20-q.length;
        while(remain>0){
          const pool=shuffle([...groups.red,...groups.amber,...groups.green].filter(i=>!q.includes(i)));
          if(!pool.length)break;
          q.push(...pool.slice(0,remain));remain=20-q.length;
        }
        q=shuffle(q);
      }
      order=q;pos=0;
      const qn=document.getElementById('queueNote');
      if(qn)qn.textContent=`${order.length} concept${order.length===1?'':'s'} in this queue`;
      if(order.length)render();else renderEmptyQueue(mode==='red'?'Focus only':mode==='amber'?'Not Studied Yet only':mode==='green'?'Already Good only':'No concepts');
    };

    function rowHtml(i,cur){
      const e=BANK[i],g=group(i),rowClass=g==='red'?'redrow':g==='green'?'greenrow':'whiterow';
      const currentClass=i===cur?' currentrow':'';
      const ef=typeof esc==='function'?esc:(s=>String(s));
      return `<div class="row ${rowClass}${currentClass}" data-i="${i}">
        <div class="rownum">${e.id}</div>
        <div class="topicname">${ef(e.topic)}<span class="catname">${ef(e.category)}</span></div>
        <div class="priority-colors" title="Choose priority">
          <button class="pc-white ${g==='white'?'selected':''}" data-colour="white" title="Not Studied Yet" aria-label="Set Not Studied Yet"></button>
          <button class="pc-green ${g==='green'?'selected':''}" data-colour="green" title="Already Good" aria-label="Set Already Good"></button>
          <button class="pc-red ${g==='red'?'selected':''}" data-colour="red" title="Focus" aria-label="Set Focus"></button>
        </div>
      </div>`;
    }

    bank=function(){
      const f=document.getElementById('bankFilter')?.value||'all';
      const q=(document.getElementById('bankSearch')?.value||'').trim().toLowerCase();
      const cur=typeof current==='function'?current():-1;
      const rank={red:0,white:1,green:2};
      let ids=[...Array(BANK.length).keys()];
      if(f!=='all')ids=ids.filter(i=>group(i)===f);
      if(q)ids=ids.filter(i=>`${BANK[i].id} ${BANK[i].topic} ${BANK[i].category} ${BANK[i].phrase}`.toLowerCase().includes(q));
      ids.sort((a,b)=>rank[group(a)]-rank[group(b)]||BANK[a].id-BANK[b].id);
      const bankEl=document.getElementById('bank');if(!bankEl)return;
      bankEl.innerHTML=ids.length?ids.map(i=>rowHtml(i,cur)).join(''):'<div class="small" style="padding:16px">No concepts in this group.</div>';
      bankEl.querySelectorAll('.row[data-i]').forEach(r=>{
        r.onclick=ev=>{
          if(ev.target.closest('.priority-colors'))return;
          const i=Number(r.dataset.i),idx=order.indexOf(i);
          if(idx<0){order=[i,...order];pos=0}else pos=idx;
          render();if(window.innerWidth<1031)window.scrollTo({top:0,behavior:'smooth'});
        };
      });
      bankEl.querySelectorAll('.priority-colors button[data-colour]').forEach(b=>{
        b.onclick=ev=>{
          ev.preventDefault();ev.stopPropagation();
          const i=Number(b.closest('.row[data-i]').dataset.i);
          setGroup(i,b.dataset.colour);
          stats();bank();
          if(order.length&&i===current())renderPriorityOnly();
        };
      });
    };

    renderPriorityOnly=function(){
      if(!order.length)return;
      const i=current(),g=group(i),p=document.getElementById('priorityPill'),ot=document.getElementById('overrideText');
      if(p){
        if(g==='red'){p.className='pill red';p.textContent='🔴 Focus'}
        else if(g==='green'){p.className='pill green';p.textContent='🟢 Already Good'}
        else{p.className='pill notstudied';p.textContent='⚪ Not Studied Yet'}
      }
      if(ot)ot.textContent=g==='red'?'Focus':g==='green'?'Already Good':'Not Studied Yet';
    };

    const baseRender=render;
    render=function(){
      const out=baseRender.apply(this,arguments);
      renderPriorityOnly();
      return out;
    };

    // Rebind controls so changes happen immediately and exactly match the selected group.
    document.getElementById('buildQueue').onclick=buildQueue;
    if(qm)qm.onchange=buildQueue;
    const cm=document.getElementById('categoryMode');if(cm)cm.onchange=buildQueue;
    if(bf)bf.onchange=bank;
    const bs=document.getElementById('bankSearch');if(bs)bs.oninput=bank;
    document.getElementById('markFocus').onclick=()=>{setGroup(current(),'red');render()};
    document.getElementById('markAuto').onclick=()=>{setGroup(current(),'white');render()};
    document.getElementById('markGood').onclick=()=>{setGroup(current(),'green');render()};

    stats();bank();renderPriorityOnly();
  }catch(err){
    console.error('three-priority system',err);
    if(tries<120)setTimeout(start,100);
  }
}
start();
})();