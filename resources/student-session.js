(()=>{
const active=(window.PSLE_ACTIVE_STUDENT||localStorage.getItem('psleScience_active_student')||'').toLowerCase();
if(!['jerry','javis'].includes(active))return;
const name=active==='jerry'?'Jerry':'Javis';
const SCI_KEY='psleScience180_book_master_v1';
const PROC_KEY='psleScience_process_skills_v1';
const HIST_KEY=`psleScience_sessions_${active}`;
const OPEN_KEY=`psleScience_open_session_${active}`;
const PAPER_OWNER=(localStorage.getItem('psleScience_paper_owner')||'').toLowerCase();
const STALE_MS=30*60*1000;
const $=id=>document.getElementById(id);
const safeParse=(s,f)=>{try{return JSON.parse(s||'')||f}catch(_e){return f}};
const uniq=a=>new Set(Array.isArray(a)?a:[]).size;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function scienceState(){return safeParse(localStorage.getItem(SCI_KEY),{})}
function processState(){return safeParse(localStorage.getItem(PROC_KEY),{items:{}})}
function sciGroup(r){
 r=r||{};
 if(r.userColour==='red'||r.override==='red')return'red';
 if(r.userColour==='green'||r.override==='green')return'green';
 if(r.userColour==='white')return'white';
 if(['de','sr','lr','concept'].includes(r.appLast)||r.phraseLast==='wrong')return'red';
 if(uniq(r.phraseDates)>=3&&uniq(r.appCorrectDates)>=2)return'green';
 return'white';
}
function snapshot(){
 const s=scienceState(),p=processState(),sc={red:0,white:0,green:0,phraseSecure:0,appSecure:0,recallMarks:0,appMarks:0};
 for(let i=0;i<180;i++){
  const r=s[i]||{};sc[sciGroup(r)]++;if(uniq(r.phraseDates)>=3)sc.phraseSecure++;if(uniq(r.appCorrectDates)>=2)sc.appSecure++;sc.recallMarks+=uniq(r.phraseDates);sc.appMarks+=uniq(r.appCorrectDates);
 }
 const pc={red:0,white:0,green:0,recallSecure:0,appSecure:0,recallMarks:0,appMarks:0};
 const items=(p&&p.items)||{};
 for(let id=1;id<=12;id++){
  const r=items[id]||{},g=r.priority==='red'?'red':r.priority==='green'?'green':'white';pc[g]++;if(uniq(r.recallDates)>=3)pc.recallSecure++;if(uniq(r.appDates)>=2)pc.appSecure++;pc.recallMarks+=uniq(r.recallDates);pc.appMarks+=uniq(r.appDates);
 }
 return{science:sc,process:pc};
}
function rawPack(){return{science:scienceState(),process:processState()}}
function changedConcepts(start,end){
 const out=[];for(let i=0;i<180;i++)if(JSON.stringify(start.science?.[i]||{})!==JSON.stringify(end.science?.[i]||{}))out.push({type:'science',id:i+1,topic:(window.BANK&&BANK[i]?.topic)||`Concept ${i+1}`});
 for(let id=1;id<=12;id++)if(JSON.stringify(start.process?.items?.[id]||{})!==JSON.stringify(end.process?.items?.[id]||{}))out.push({type:'process',id,topic:(window.PROCESS_SKILLS&&PROCESS_SKILLS[id-1]?.topic)||`Process skill ${id}`});
 return out;
}
function delta(a,b){return Number(b||0)-Number(a||0)}
function loadHist(){return safeParse(localStorage.getItem(HIST_KEY),[])}
function saveHist(h){localStorage.setItem(HIST_KEY,JSON.stringify(h.slice(0,200)))}
function finalize(open,endedAt,reason){
 if(!open||open.finalized)return null;
 const endSnap=snapshot(),endRaw=rawPack(),changes=changedConcepts(open.startRaw||{science:{},process:{items:{}}},endRaw),st=open.startSnapshot||snapshot();
 const end=endedAt||Date.now(),mins=Math.max(1,Math.round((end-open.startedAt)/60000));
 const rec={id:open.id,student:active,startedAt:open.startedAt,endedAt:end,durationMinutes:mins,reason:reason||'finished',start:st,end:endSnap,changes:changes.slice(0,80),delta:{
  scienceRecall:delta(st.science?.recallMarks,endSnap.science.recallMarks),scienceApp:delta(st.science?.appMarks,endSnap.science.appMarks),scienceGreen:delta(st.science?.green,endSnap.science.green),
  processRecall:delta(st.process?.recallMarks,endSnap.process.recallMarks),processApp:delta(st.process?.appMarks,endSnap.process.appMarks),processGreen:delta(st.process?.green,endSnap.process.green)
 }};
 const h=loadHist();if(!h.some(x=>x.id===rec.id)){h.unshift(rec);saveHist(h)}
 localStorage.removeItem(OPEN_KEY);return rec;
}
let open=safeParse(localStorage.getItem(OPEN_KEY),null);
if(open&&Date.now()-(open.lastSeen||open.startedAt)>STALE_MS){finalize(open,open.lastSeen||Date.now(),'auto-closed after inactivity');open=null}
if(!open){open={id:`${active}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,student:active,startedAt:Date.now(),lastSeen:Date.now(),startSnapshot:snapshot(),startRaw:rawPack()};localStorage.setItem(OPEN_KEY,JSON.stringify(open))}
function touch(){open.lastSeen=Date.now();localStorage.setItem(OPEN_KEY,JSON.stringify(open));updateTimer()}

const style=document.createElement('style');style.textContent=`
.studentbar{margin:12px 0 0;padding:10px 12px;border:1px solid #cbd5e1;border-radius:13px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;box-shadow:0 2px 10px #0f172a0a}.studentbar .who{font-weight:800}.studentbar .sessionmeta{font-size:12px;color:#64748b}.studentbar button{padding:8px 10px;font-size:13px}.studentbar .finish{background:#0f766e;color:#fff;border-color:#0f766e;font-weight:700}
.sessionmodal{position:fixed;inset:0;background:#0f172acc;z-index:9999;display:grid;place-items:center;padding:16px}.sessionbox{width:min(980px,96vw);max-height:90vh;overflow:auto;background:#fff;border-radius:18px;padding:18px;box-shadow:0 20px 60px #0004}.sessionhead{display:flex;justify-content:space-between;gap:10px;align-items:center}.sessioncards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.sessioncard{border:1px solid #dbe3ee;border-radius:12px;padding:10px;background:#f8fafc}.sessioncard b{font-size:20px;display:block}.histrow{border-top:1px solid #e2e8f0;padding:11px 2px}.histrow:first-child{border-top:0}.histrow .date{font-weight:800}.histrow .mini{font-size:12px;color:#64748b;margin-top:3px}.histrow .chg{font-size:12px;margin-top:5px;line-height:1.45}.emptyhist{padding:20px;text-align:center;color:#64748b}
@media(max-width:700px){.sessioncards{grid-template-columns:repeat(2,1fr)}}
${PAPER_OWNER&&PAPER_OWNER!==active?'#paperProfileTag{display:none!important}':''}
`;document.head.appendChild(style);

const header=document.querySelector('header');
if(header){
 const bar=document.createElement('div');bar.className='studentbar';bar.innerHTML=`<div><span class="who">👤 ${name}</span> <span class="sessionmeta" id="sittingTimer"></span></div><div class="actions" style="margin:0"><button id="historyBtn">📊 Sitting History</button><button class="finish" id="finishSitting">Finish Sitting / Sign out</button></div>`;
 header.insertAdjacentElement('afterend',bar);
}
function updateTimer(){const el=$('sittingTimer');if(el){const m=Math.max(0,Math.floor((Date.now()-open.startedAt)/60000));el.textContent=`· current sitting ${m<1?'<1':m} min`}}
function fmt(ts){try{return new Date(ts).toLocaleString('en-SG',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(_e){return''}}
function signed(n){return n>0?`+${n}`:String(n)}
function historyHtml(){
 const s=snapshot(),h=loadHist();return `<div class="sessionhead"><div><h2 style="margin:0">${name}'s Progress & Sitting History</h2><div class="small">Records are stored on this browser/device.</div></div><button id="closeHistory">Close</button></div>
 <div class="sessioncards"><div class="sessioncard"><span class="small">Science Already Good</span><b>${s.science.green}/180</b></div><div class="sessioncard"><span class="small">Exact recall secure</span><b>${s.science.phraseSecure}/180</b></div><div class="sessioncard"><span class="small">Application secure</span><b>${s.science.appSecure}/180</b></div><div class="sessioncard"><span class="small">Process skills Already Good</span><b>${s.process.green}/12</b></div></div>
 <h3>Completed sittings</h3>${h.length?h.slice(0,30).map(x=>{const d=x.delta||{},names=(x.changes||[]).slice(0,8).map(c=>esc(c.topic)).join(', ');return `<div class="histrow"><div class="date">${fmt(x.startedAt)} · ${x.durationMinutes} min</div><div class="mini">Science recall ${signed(d.scienceRecall||0)} · application ${signed(d.scienceApp||0)} · Already Good ${signed(d.scienceGreen||0)} · Process recall ${signed(d.processRecall||0)} · process application ${signed(d.processApp||0)}</div><div class="chg"><b>${(x.changes||[]).length} item${(x.changes||[]).length===1?'':'s'} changed:</b> ${names||'No recorded progress change'}${(x.changes||[]).length>8?' …':''}</div></div>`}).join(''):'<div class="emptyhist">No completed sitting yet. Use “Finish Sitting / Sign out” when a study session ends.</div>'}`;
}
function showHistory(){let m=$('sessionModal');if(!m){m=document.createElement('div');m.id='sessionModal';m.className='sessionmodal';m.innerHTML='<div class="sessionbox" id="sessionBox"></div>';document.body.appendChild(m)}$('sessionBox').innerHTML=historyHtml();m.classList.remove('hide');$('closeHistory').onclick=()=>m.classList.add('hide');m.onclick=e=>{if(e.target===m)m.classList.add('hide')}}
$('historyBtn')?.addEventListener('click',showHistory);
$('finishSitting')?.addEventListener('click',()=>{touch();finalize(open,Date.now(),'finished');localStorage.removeItem('psleScience_active_student');location.replace('signin.html')});
['click','input','keydown'].forEach(ev=>document.addEventListener(ev,touch,{passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')touch()});
window.addEventListener('pagehide',touch);
setInterval(touch,30000);setInterval(updateTimer,30000);updateTimer();
})();