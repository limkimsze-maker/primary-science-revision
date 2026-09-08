(()=>{
if(window.PSLE_CLOUD_PROGRESS)return;

const ENDPOINT='https://primary-science-ai-marker.limkimsze-maker.workers.dev/progress/sync';
const SCIENCE_KEY='psleScience180_book_master_v1';
const PROCESS_KEY='psleScience_process_skills_v1';
const SYNC_KEYS=new Set([SCIENCE_KEY,PROCESS_KEY]);
const student=String(window.PSLE_ACTIVE_STUDENT||localStorage.getItem('psleScience_active_student')||'').toLowerCase();
const rawGet=Storage.prototype.getItem;
const rawSet=Storage.prototype.setItem;
let syncing=false,timer=0,lastStatus='idle';

const validStudent=['jerry','javis'].includes(student);
const now=()=>Date.now();
const parse=s=>{try{return JSON.parse(String(s||''))||{}}catch(_e){return{}}};
function tokenKey(){return `psleScience_cloud_auth_token_${student}`}
function getToken(){return String(rawGet.call(localStorage,tokenKey())||'').trim()}
function profileRawKey(base){return `${base}__profile_${student}`}
function readProfile(base){return parse(rawGet.call(localStorage,profileRawKey(base)))}
function writeProfile(base,obj){rawSet.call(localStorage,profileRawKey(base),JSON.stringify(obj))}

function stampScience(next,prev){
  const out={...next};
  const ids=new Set([...Object.keys(next||{}),...Object.keys(prev||{})]);
  for(const id of ids){
    if(!next?.[id])continue;
    const a=JSON.stringify({...next[id],_syncUpdatedAt:undefined});
    const b=JSON.stringify({...prev?.[id],_syncUpdatedAt:undefined});
    out[id]={...next[id],_syncUpdatedAt:a!==b?now():(Number(prev?.[id]?._syncUpdatedAt)||Number(next[id]._syncUpdatedAt)||0)};
  }
  return out;
}

function stampProcess(next,prev){
  const out={...next,items:{...(next?.items||{})},variant:{...(next?.variant||{})}};
  const ids=new Set([...Object.keys(next?.items||{}),...Object.keys(prev?.items||{})]);
  for(const id of ids){
    if(!next?.items?.[id])continue;
    const a=JSON.stringify({...next.items[id],_syncUpdatedAt:undefined});
    const b=JSON.stringify({...prev?.items?.[id],_syncUpdatedAt:undefined});
    out.items[id]={...next.items[id],_syncUpdatedAt:a!==b?now():(Number(prev?.items?.[id]?._syncUpdatedAt)||Number(next.items[id]._syncUpdatedAt)||0)};
  }
  return out;
}

async function postSync(){
  if(!validStudent)return {ok:false,reason:'no-student'};
  const token=getToken();if(!token)return {ok:false,reason:'not-signed-in'};
  if(syncing)return {ok:false,reason:'busy'};
  syncing=true;lastStatus='syncing';
  try{
    const states={
      [SCIENCE_KEY]:readProfile(SCIENCE_KEY),
      [PROCESS_KEY]:readProfile(PROCESS_KEY)
    };
    const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),12000);
    let res;
    try{
      res=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${token}`},body:JSON.stringify({states}),signal:ctl.signal});
    }finally{clearTimeout(t)}
    const data=await res.json().catch(()=>({}));
    if(res.status===401){rawSet.call(localStorage,tokenKey(),'');throw new Error('Your cloud session expired. Please sign in again.');}
    if(!res.ok)throw new Error(data?.error||`Cloud sync HTTP ${res.status}`);
    if(data?.states?.[SCIENCE_KEY])writeProfile(SCIENCE_KEY,data.states[SCIENCE_KEY]);
    if(data?.states?.[PROCESS_KEY])writeProfile(PROCESS_KEY,data.states[PROCESS_KEY]);
    lastStatus='synced';
    document.dispatchEvent(new CustomEvent('psle-cloud-synced',{detail:{student,syncedAt:data?.syncedAt||now()}}));
    return {ok:true,data};
  }catch(err){
    lastStatus='offline';
    document.dispatchEvent(new CustomEvent('psle-cloud-sync-error',{detail:{student,error:String(err?.message||err)}}));
    return {ok:false,error:err};
  }finally{syncing=false}
}

function scheduleSync(delay=2500){
  if(!getToken()||!validStudent)return;
  clearTimeout(timer);timer=setTimeout(()=>postSync(),delay);
}

const previousSet=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){
  if(this===localStorage&&SYNC_KEYS.has(k)&&validStudent){
    try{
      const prev=readProfile(k),next=parse(v);
      const stamped=k===SCIENCE_KEY?stampScience(next,prev):stampProcess(next,prev);
      const result=previousSet.call(this,k,JSON.stringify(stamped));
      scheduleSync();return result;
    }catch(_e){}
  }
  return previousSet.call(this,k,v);
};

async function initialSync(){
  if(!getToken()||!validStudent)return {ok:false,reason:'not-signed-in'};
  return postSync();
}

window.PSLE_CLOUD_PROGRESS={endpoint:ENDPOINT,student,getToken,initialSync,syncNow:postSync,scheduleSync,get status(){return lastStatus}};
setTimeout(()=>initialSync(),180);
})();
