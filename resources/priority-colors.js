(()=>{
let tries=0;
function start(){
  tries++;
  try{
    if(typeof rec!=='function'||typeof save!=='function'||typeof priority!=='function'){if(tries<100)setTimeout(start,100);return}
    if(window.__priorityColourControlsInstalled)return;
    window.__priorityColourControlsInstalled=true;

    const style=document.createElement('style');
    style.textContent=`
      #bank .row{grid-template-columns:38px minmax(0,1fr) 62px!important;position:relative}
      #bank .priority-colors{display:flex!important;gap:4px;justify-content:flex-end;align-items:center;z-index:5}
      #bank .priority-colors button{display:block!important;width:16px!important;height:16px!important;min-width:16px!important;padding:0!important;border-radius:50%!important;box-shadow:none!important;cursor:pointer!important}
      #bank .priority-colors .pc-white{background:#fff!important;border:1px solid #64748b!important}
      #bank .priority-colors .pc-green{background:#22c55e!important;border:1px solid #15803d!important}
      #bank .priority-colors .pc-red{background:#dc2626!important;border:1px solid #991b1b!important}
      #bank .priority-colors button.selected{outline:2px solid #312e81!important;outline-offset:2px!important}
      .pill.manual-white{background:#fff!important;color:#172033!important;border:1px solid #cbd5e1!important}
    `;
    document.head.appendChild(style);

    const basePriority=priority;
    priority=function(i){
      const x=rec(i);
      if(x&&x.userColour==='white')return 'amber';
      return basePriority(i);
    };

    if(typeof renderPriorityOnly==='function'){
      const baseRenderPriorityOnly=renderPriorityOnly;
      renderPriorityOnly=function(){
        const i=typeof current==='function'?current():0;
        const x=rec(i);
        if(x&&x.userColour==='white'){
          const p=document.getElementById('priorityPill');
          if(p){p.className='pill manual-white';p.textContent='⚪ Neutral'}
          return;
        }
        return baseRenderPriorityOnly();
      };
    }

    function effectiveColour(i){
      const x=rec(i)||{};
      if(x.userColour==='white')return 'white';
      if(x.override==='green')return 'green';
      if(x.override==='red')return 'red';
      const p=priority(i);
      return p==='green'?'green':p==='red'?'red':'white';
    }

    function applyRowStyle(row,i){
      const c=effectiveColour(i);
      const topic=row.querySelector('.topicname');
      const num=row.querySelector('.rownum');
      const cat=row.querySelector('.catname');
      if(c==='red'){
        row.style.background='#b91c1c';row.style.borderLeftColor='#991b1b';
        if(topic)topic.style.color='#fff';if(num)num.style.color='#fff';if(cat)cat.style.color='#fee2e2';
      }else if(c==='green'){
        row.style.background='#dcfce7';row.style.borderLeftColor='#16a34a';
        if(topic)topic.style.color='#14532d';if(num)num.style.color='#14532d';if(cat)cat.style.color='#166534';
      }else{
        row.style.background='#fff';row.style.borderLeftColor='#e2e8f0';
        if(topic)topic.style.color='#172033';if(num)num.style.color='#172033';if(cat)cat.style.color='#64748b';
      }
    }

    function decorate(){
      const bankEl=document.getElementById('bank');if(!bankEl)return;
      bankEl.querySelectorAll('.row[data-i]').forEach(row=>{
        const i=Number(row.dataset.i);if(!Number.isInteger(i))return;
        applyRowStyle(row,i);
        let controls=row.querySelector('.priority-colors');
        if(!controls){
          controls=document.createElement('div');controls.className='priority-colors';controls.title='Choose row colour: white, green or red';
          controls.innerHTML='<button class="pc-white" data-colour="white" title="White / Neutral" aria-label="Set white"></button><button class="pc-green" data-colour="green" title="Green / Strong" aria-label="Set green"></button><button class="pc-red" data-colour="red" title="Red / Focus" aria-label="Set red"></button>';
          row.appendChild(controls);
          controls.addEventListener('click',ev=>{
            const b=ev.target.closest('button[data-colour]');if(!b)return;
            ev.preventDefault();ev.stopPropagation();
            const v=b.dataset.colour,x=rec(i);
            if(v==='white'){x.override='auto';x.userColour='white'}
            else if(v==='green'){x.override='green';x.userColour='green'}
            else{x.override='red';x.userColour='red'}
            save();
            if(typeof stats==='function')stats();
            if(typeof renderPriorityOnly==='function'&&typeof current==='function'&&i===current())renderPriorityOnly();
            if(typeof bank==='function')bank(); else decorate();
          });
          controls.addEventListener('pointerdown',ev=>ev.stopPropagation());
        }
        const x=rec(i)||{};
        controls.querySelectorAll('button').forEach(b=>b.classList.remove('selected'));
        if(x.userColour==='white')controls.querySelector('.pc-white')?.classList.add('selected');
        else if(x.override==='green')controls.querySelector('.pc-green')?.classList.add('selected');
        else if(x.override==='red')controls.querySelector('.pc-red')?.classList.add('selected');
      });
    }

    const bankEl=document.getElementById('bank');
    if(bankEl)new MutationObserver(()=>decorate()).observe(bankEl,{childList:true,subtree:true});
    const legend=document.querySelector('.priority-legend');
    if(legend)legend.innerHTML='🔴 Focus · ⚪ White / Neutral · 🟢 Strong<br>Use the three dots on each row to set its colour. Click the concept name to practise.';
    const filter=document.getElementById('bankFilter');
    if(filter)for(const o of filter.options){if(o.value==='auto')o.textContent='⚪ White / Neutral'}
    decorate();
  }catch(err){console.error('priority colour controls',err);if(tries<100)setTimeout(start,100)}
}
start();
})();