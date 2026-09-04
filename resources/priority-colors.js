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

      #bankFilter{display:none!important}
      .smart-search{margin:10px 0 8px}
      .smart-search-box{position:relative;display:flex;align-items:center}
      .smart-search-icon{position:absolute;left:11px;font-size:15px;pointer-events:none;opacity:.72}
      #bankSearch.smart-input{width:100%!important;box-sizing:border-box!important;padding:10px 36px 10px 34px!important;border:1px solid #b9c7d9!important;border-radius:10px!important;font-size:13px!important;background:#fff!important;outline:none!important;transition:.15s border-color,.15s box-shadow}
      #bankSearch.smart-input:focus{border-color:#4f46e5!important;box-shadow:0 0 0 3px rgba(79,70,229,.12)!important}
      .smart-search-clear{position:absolute;right:7px;width:26px;height:26px;border:0!important;background:transparent!important;color:#64748b!important;padding:0!important;border-radius:50%!important;font-size:18px!important;line-height:26px!important;cursor:pointer!important;display:none}
      .smart-search-clear.show{display:block}
      .smart-search-clear:hover{background:#eef2ff!important;color:#312e81!important}
      .search-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
      .search-chip{padding:4px 8px!important;border-radius:999px!important;border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important;font-size:11px!important;font-weight:700!important;cursor:pointer!important}
      .search-chip.active{border-color:#4f46e5!important;background:#eef2ff!important;color:#3730a3!important;box-shadow:0 0 0 1px #4f46e5 inset!important}
      .search-meta{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:6px;font-size:10.5px;color:#64748b}
      .search-meta b{color:#334155}
      .search-tip{white-space:nowrap}
      .search-mark{background:#fef08a;border-radius:3px;padding:0 1px;color:inherit}
      @media(max-width:520px){.search-tip{display:none}}
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
    if(bf)bf.innerHTML='<option value="all">All 180</option><option value="red">Focus only</option><option value="white">Not Studied Yet only</option><option value="green">Already Good only</option>';

    const amberLabel=document.getElementById('amberCount')?.previousElementSibling;if(amberLabel)amberLabel.textContent='⚪ Not Studied Yet';
    const greenLabel=document.getElementById('greenCount')?.previousElementSibling;if(greenLabel)greenLabel.textContent='🟢 Already Good';
    const autoBtn=document.getElementById('markAuto');if(autoBtn)autoBtn.textContent='⚪ Not Studied Yet';
    const goodBtn=document.getElementById('markGood');if(goodBtn)goodBtn.textContent='🟢 Already Good';
    const legend=document.querySelector('.priority-legend');if(legend)legend.innerHTML='🔴 Focus · ⚪ Not Studied Yet · 🟢 Already Good<br>Search by concept, topic, keyword, number or book page.';

    const bs=document.getElementById('bankSearch');
    let searchCountEl=null,clearBtn=null;
    if(bs&&!bs.closest('.smart-search')){
      const wrap=document.createElement('div');wrap.className='smart-search';
      const box=document.createElement('div');box.className='smart-search-box';
      const icon=document.createElement('span');icon.className='smart-search-icon';icon.textContent='🔎';
      clearBtn=document.createElement('button');clearBtn.type='button';clearBtn.className='smart-search-clear';clearBtn.title='Clear search';clearBtn.setAttribute('aria-label','Clear search');clearBtn.textContent='×';
      bs.parentNode.insertBefore(wrap,bs);wrap.appendChild(box);box.appendChild(icon);box.appendChild(bs);box.appendChild(clearBtn);
      bs.classList.add('smart-input');
      bs.placeholder='Search: respiration, forces, #18, p.46…';
      bs.autocomplete='off';bs.spellcheck=false;
      const chips=document.createElement('div');chips.className='search-chips';
      chips.innerHTML='<button type="button" class="search-chip active" data-filter="all">All</button><button type="button" class="search-chip" data-filter="red">🔴 Focus</button><button type="button" class="search-chip" data-filter="white">⚪ Not Studied</button><button type="button" class="search-chip" data-filter="green">🟢 Already Good</button>';
      wrap.appendChild(chips);
      const meta=document.createElement('div');meta.className='search-meta';meta.innerHTML='<span class="search-count"><b>180</b> concepts</span><span class="search-tip">Enter = open first match · Esc = clear</span>';
      wrap.appendChild(meta);searchCountEl=meta.querySelector('.search-count');
      chips.querySelectorAll('.search-chip').forEach(ch=>ch.onclick=()=>{
        bf.value=ch.dataset.filter;
        chips.querySelectorAll('.search-chip').forEach(x=>x.classList.toggle('active',x===ch));
        bank();
      });
      clearBtn.onclick=()=>{bs.value='';clearBtn.classList.remove('show');bs.focus();bank()};
      bs.addEventListener('keydown',ev=>{
        if(ev.key==='Escape'){ev.preventDefault();bs.value='';clearBtn.classList.remove('show');bank();return}
        if(ev.key==='Enter'){
          const first=document.querySelector('#bank .row[data-i]');
          if(first){ev.preventDefault();first.click()}
        }
      });
    }else if(bs){
      searchCountEl=bs.closest('.smart-search')?.querySelector('.search-count')||null;
      clearBtn=bs.closest('.smart-search')?.querySelector('.smart-search-clear')||null;
    }

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

    function safe(s){return typeof esc==='function'?esc(String(s??'')):String(s??'')}
    function normSearch(s){return String(s??'').toLowerCase().replace(/[–—]/g,'-').replace(/[^a-z0-9#.+/-]+/g,' ').trim()}
    function tokens(q){return normSearch(q).split(/\s+/).filter(Boolean)}
    function searchable(e,i){
      return normSearch([
        e.id,'#'+e.id,'q'+e.id,e.topic,e.category,e.phrase,e.phrasePrompt,e.applicationQuestion,e.modelApplicationAnswer,e.bookRef,
        group(i)==='red'?'focus red':group(i)==='green'?'already good green strong':'not studied white'
      ].filter(Boolean).join(' '));
    }
    function matches(e,i,q){
      const ts=tokens(q);if(!ts.length)return true;
      const hay=searchable(e,i);
      return ts.every(t=>{
        if(/^#?\d+$/.test(t)){const n=t.replace('#','');if(String(e.id)===n)return true}
        if(/^q\d+$/.test(t)&&String(e.id)===t.slice(1))return true;
        if(/^p\.?\d+/.test(t)){const n=t.match(/\d+/)?.[0];if(n&&normSearch(e.bookRef||'').includes(n))return true}
        return hay.includes(t);
      });
    }
    function searchScore(e,i,q){
      const nq=normSearch(q),topic=normSearch(e.topic),cat=normSearch(e.category),phrase=normSearch(e.phrase),id=String(e.id);
      if(!nq)return 100;
      if(nq===id||nq==='#'+id||nq==='q'+id)return 0;
      if(topic===nq)return 1;
      if(topic.startsWith(nq))return 2;
      if(topic.includes(nq))return 3;
      if(cat.includes(nq))return 4;
      if(phrase.includes(nq))return 5;
      return 10;
    }
    function highlight(text,q){
      const raw=String(text??''),ts=tokens(q).filter(t=>t.length>=2&&!/^#?\d+$/.test(t)&&!/^q\d+$/.test(t)&&!/^p\.?\d+/.test(t));
      if(!ts.length)return safe(raw);
      let out=safe(raw);
      ts.sort((a,b)=>b.length-a.length).forEach(t=>{
        const re=new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
        out=out.replace(re,'<mark class="search-mark">$1</mark>');
      });
      return out;
    }

    function rowHtml(i,cur,q){
      const e=BANK[i],g=group(i),rc=g==='red'?'redrow':g==='green'?'greenrow':'whiterow';
      return `<div class="row ${rc}${i===cur?' currentrow':''}" data-i="${i}"><div class="rownum">${e.id}</div><div class="topicname">${highlight(e.topic,q)}<span class="catname">${highlight(e.category,q)}</span></div><div class="priority-colors"><button class="pc-white ${g==='white'?'selected':''}" data-colour="white" title="Not Studied Yet"></button><button class="pc-green ${g==='green'?'selected':''}" data-colour="green" title="Already Good"></button><button class="pc-red ${g==='red'?'selected':''}" data-colour="red" title="Focus"></button></div></div>`;
    }

    bank=function(){
      const f=bf?.value||'all',q=(document.getElementById('bankSearch')?.value||'').trim(),rank={red:0,white:1,green:2},cur=order.length?current():-1;
      let ids=[...Array(BANK.length).keys()];
      if(f!=='all')ids=ids.filter(i=>group(i)===f);
      if(q)ids=ids.filter(i=>matches(BANK[i],i,q));
      ids.sort((a,b)=>searchScore(BANK[a],a,q)-searchScore(BANK[b],b,q)||rank[group(a)]-rank[group(b)]||BANK[a].id-BANK[b].id);
      const el=document.getElementById('bank');
      el.innerHTML=ids.length?ids.map(i=>rowHtml(i,cur,q)).join(''):'<div class="small" style="padding:16px;line-height:1.45"><b>No match found.</b><br>Try a broader word such as <i>respiration</i>, <i>electricity</i>, <i>forces</i>, a concept number like <i>#18</i>, or a book page like <i>p.46</i>.</div>';
      if(searchCountEl)searchCountEl.innerHTML=`<b>${ids.length}</b> ${q?'match'+(ids.length===1?'':'es'):'concept'+(ids.length===1?'':'s')}`;
      if(clearBtn)clearBtn.classList.toggle('show',!!q);
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
    if(bf)bf.onchange=()=>{document.querySelectorAll('.search-chip').forEach(ch=>ch.classList.toggle('active',ch.dataset.filter===bf.value));bank()};
    if(bs)bs.oninput=bank;
    document.getElementById('markFocus').onclick=()=>{setGroup(current(),'red');render()};
    document.getElementById('markAuto').onclick=()=>{setGroup(current(),'white');render()};
    document.getElementById('markGood').onclick=()=>{setGroup(current(),'green');render()};

    stats();bank();renderPriorityOnly();
  }catch(err){console.error('priority system',err);if(tries<120)setTimeout(start,100)}
}
start();
})();