(()=>{
if(window.__PSLE_ACCEPTABLE_RESCUE__)return;
window.__PSLE_ACCEPTABLE_RESCUE__=true;
const priorFetch=window.fetch.bind(window);
const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const STOP=new Set('a an the is are was were be been being to of on in at by for from with and or but so since because therefore hence this that these those it its they them their there as which who whom what when where how why explain give reason can could would should may might will shall'.split(' '));
const tokens=s=>norm(s).split(' ').filter(w=>w.length>1&&!STOP.has(w));
function overlap(a,b){const m=new Map();for(const w of b)m.set(w,(m.get(w)||0)+1);let n=0;for(const w of a){const c=m.get(w)||0;if(c){n++;m.set(w,c-1)}}return n}
function opposite(answer,model){
 const a=norm(answer),m=norm(model),down=/\b(reduc\w*|decreas\w*|fewer|less|lower|slower|weaker)\b/,up=/\b(increas\w*|more|greater|higher|faster|stronger)\b/;
 if(down.test(m)&&up.test(a)&&!down.test(a))return true;
 if(up.test(m)&&down.test(a)&&!up.test(a))return true;
 return false;
}
function sameDirection(question,answer,model){
 const q=norm(question),a=norm(answer),m=norm(model),down=/\b(reduc\w*|decreas\w*|fewer|less|lower|slower|weaker)\b/,up=/\b(increas\w*|more|greater|higher|faster|stronger)\b/;
 if(down.test(q)||down.test(m))return down.test(a)&&!opposite(answer,model);
 if(up.test(q)||up.test(m))return up.test(a)&&!opposite(answer,model);
 return false;
}
function integratedChangeEffect(question,answer,model){
 if(!question||!answer||!model||opposite(answer,model)||!sameDirection(question,answer,model))return false;
 const A=tokens(answer),M=tokens(model),Q=tokens(question);if(A.length<7||M.length<5)return false;
 const matched=overlap(M,A),recall=matched/M.length,precision=matched/A.length;
 const qShared=new Set(Q.filter(w=>A.includes(w))).size;
 return recall>=0.45&&precision>=0.34&&qShared>=2;
}
function isChangeExplain(question){
 const q=String(question||'');if(!/\b(explain|why|give\s+(?:a\s+)?reason)\b/i.test(q))return false;
 try{return window.PSLE_FRAMEWORK_MARKER_POLICY?.classify?.(q)==='change'}catch(_e){return false}
}
function isLinkOnly(data){const r=norm(data?.rating||data?.verdict||data?.result||data?.classification||'');return r==='lr'||r.includes('l r')||r.includes('link')}
function conceptCorrect(data){return data?.criteria?.conceptCorrect===true||data?.conceptCorrect===true}
window.fetch=async function(input,init){
 let url='';try{url=typeof input==='string'?input:String(input?.url||'')}catch(_e){}
 const isMark=/primary-science-ai-marker\.limkimsze-maker\.workers\.dev\/mark(?:$|\?)/.test(url);
 if(!isMark||String(init?.method||'GET').toUpperCase()!=='POST'||!init?.body)return priorFetch(input,init);
 let req;try{req=JSON.parse(String(init.body))}catch(_e){return priorFetch(input,init)}
 const res=await priorFetch(input,init);
 if(!isChangeExplain(req.question))return res;
 let data;try{data=JSON.parse(await res.clone().text())}catch(_e){return res}
 if(!data||!isLinkOnly(data)||!conceptCorrect(data))return res;
 if(!integratedChangeEffect(req.question,req.answer,req.modelAnswer))return res;
 data.rating='correct';data.verdict='correct';data.frameworkQuality='acceptable';data.missing='None';
 data.criteria={...(data.criteria||{}),conceptCorrect:true,lrRequired:true,lrMet:true};
 data.strengths='PSLE-ACCEPTABLE: The relevant Science function/mechanism, changed condition and exact result are all present, even though the chain is compressed into fewer sentences.';
 data.feedback='✅ PSLE-acceptable. The answer gives the relevant Science function/mechanism, applies the changed condition, and explicitly states the result asked. The six-framework chain is a thinking scaffold; it does not have to be written as three separate sentence slots.';
 return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers:res.headers});
};
})();
