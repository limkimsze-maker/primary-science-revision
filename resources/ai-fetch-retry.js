(()=>{
if(window.__PSLE_AI_FETCH_RETRY__)return;
window.__PSLE_AI_FETCH_RETRY__=true;
const nativeFetch=window.fetch.bind(window);
const target='https://primary-science-ai-marker.limkimsze-maker.workers.dev/mark';
const retryable=new Set([429,500,502,503,504]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
window.fetch=async function(input,init){
 const url=typeof input==='string'?input:(input&&input.url)||'';
 if(url!==target)return nativeFetch(input,init);
 let lastErr=null,lastRes=null;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const res=await nativeFetch(input,init);
   lastRes=res;
   if(!retryable.has(res.status))return res;
  }catch(err){lastErr=err}
  if(attempt<2)await sleep(400*(attempt+1));
 }
 if(lastRes)return lastRes;
 throw lastErr||new Error('AI marker request failed');
};
})();
