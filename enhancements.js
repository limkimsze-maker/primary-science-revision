(()=>{
'use strict';
const AUDIT_VERSION='book-audit-2026-09-04-v3';
const BOOK_REFS={"1":"pp. 35–36","2":"pp. 35–36","3":"pp. 35–36","4":"pp. 3–5","5":"pp. 3–5","6":"pp. 3–5","7":"pp. 32–34","8":"pp. 32–34","9":"pp. 20–22","10":"pp. 11–16","11":"pp. 11–16","12":"pp. 11–16","13":"pp. 11–16","14":"pp. 11–16","15":"pp. 11–16","16":"pp. 11–16","17":"pp. 7–10","18":"pp. 7–10","19":"pp. 7–10","20":"pp. 7–10","21":"pp. 20–22","22":"pp. 23–31","23":"pp. 23–31","24":"pp. 23–31","25":"pp. 23–31","26":"pp. 23–31","27":"pp. 27–31","28":"pp. 27–31","29":"pp. 35–36, 99, 102+","30":"pp. 35–36, 99, 102+","31":"pp. 37–41","32":"pp. 37–41","33":"pp. 37–41","34":"pp. 37–41","35":"pp. 42–45","36":"pp. 42–45","37":"pp. 42–45","38":"pp. 84–89","39":"pp. 46–48, 102+","40":"pp. 46–48, 102+","41":"pp. 46–48, 102+","42":"pp. 46–48, 102+","43":"pp. 46–48, 102+","44":"pp. 49–56, 99, 102+","45":"pp. 49–56, 99, 102+","46":"pp. 49–56, 99, 102+","47":"pp. 49–56, 99, 102+","48":"pp. 49–56, 99, 102+","49":"pp. 49–56, 99, 102+","50":"pp. 49–56, 99, 102+","51":"pp. 49–56, 99, 102+","52":"pp. 49–56, 99, 102+","53":"pp. 49–56, 99, 102+","54":"pp. 49–56, 99, 102+","55":"pp. 62–66","56":"pp. 62–66","57":"pp. 62–66","58":"pp. 62–66","59":"pp. 62–66","60":"pp. 58–61","61":"pp. 58–61","62":"pp. 58–61","63":"pp. 58–61","64":"pp. 58–61","65":"pp. 58–61","66":"pp. 58–61","67":"pp. 58–61","68":"pp. 68–74","69":"pp. 68–74","70":"pp. 68–74","71":"pp. 68–74","72":"pp. 68–74","73":"pp. 68–74","74":"pp. 77–79","75":"pp. 77–79","76":"pp. 77–79","77":"pp. 84–89, 102+","78":"pp. 84–89, 102+","79":"pp. 84–89, 102+","80":"pp. 84–89, 102+","81":"pp. 84–89, 102+","82":"pp. 80–83, 102+","83":"pp. 80–83, 102+","84":"pp. 80–83, 102+","85":"pp. 80–83, 102+","86":"pp. 80–83, 102+","87":"pp. 80–83, 102+","88":"pp. 80–83, 102+","89":"pp. 80–83, 102+"};
const STRICT_PATCHES={"3":{"topic":"Photosynthesis – inputs and products","phrasePrompt":"What happens during photosynthesis?","phrase":"In the presence of light trapped by chlorophyll, a green plant uses water and carbon dioxide to make food and oxygen.","applicationQuestion":"A green plant receives light, water and carbon dioxide. Explain what happens during photosynthesis.","rubric":["Light is trapped by chlorophyll","Water and carbon dioxide are used","Food is made","Oxygen is produced"],"modelApplicationAnswer":"In the presence of light trapped by chlorophyll, the plant uses water and carbon dioxide to make food and oxygen."},"6":{"topic":"Stem – support","phrasePrompt":"How does the stem support the plant?","phrase":"The stem holds the plant upright so that its leaves can receive light.","applicationQuestion":"A plant has a strong upright stem. Explain one way this helps the plant make food.","rubric":["Stem holds the plant upright","Leaves can receive light","Light is needed for photosynthesis"],"modelApplicationAnswer":"The stem holds the plant upright so that its leaves can receive light for photosynthesis."},"9":{"topic":"Stomata – gaseous exchange","phrasePrompt":"What is the function of stomata?","phrase":"Stomata are tiny openings in leaves that allow gaseous exchange with the surroundings.","applicationQuestion":"A leaf has many tiny openings called stomata. State their main function.","rubric":["Stomata are tiny openings in leaves","They allow gaseous exchange","Exchange is with the surroundings"],"modelApplicationAnswer":"Stomata are tiny openings in leaves that allow gaseous exchange with the surroundings."},"10":{"topic":"Seed germination – conditions","phrasePrompt":"What conditions are needed for a seed to germinate?","phrase":"A seed needs water, oxygen and a suitable temperature to germinate.","applicationQuestion":"A seed has water and oxygen but is kept at an unsuitable temperature. Explain why it may not germinate.","rubric":["Water is needed","Oxygen is needed","A suitable temperature is needed","One required condition is missing"],"modelApplicationAnswer":"A seed needs water, oxygen and a suitable temperature to germinate. Since the temperature is unsuitable, the seed may not germinate."},"12":{"topic":"Seed germination – light","phrasePrompt":"Is light needed for a seed to germinate?","phrase":"Light is not needed for a seed to germinate.","applicationQuestion":"A seed has water and oxygen and is kept at a suitable temperature in darkness. Can it germinate? Explain.","rubric":["Light is not needed for germination","Water, oxygen and suitable temperature are the required conditions"],"modelApplicationAnswer":"Yes. Light is not needed for a seed to germinate, provided it has water, oxygen and a suitable temperature."},"19":{"topic":"Butterfly life cycle","phrasePrompt":"What are the stages in a butterfly's life cycle?","phrase":"A butterfly has four stages in its life cycle: egg, larva, pupa and adult.","applicationQuestion":"State the four stages in the life cycle of a butterfly in the correct order.","rubric":["Egg","Larva","Pupa","Adult","Correct order"],"modelApplicationAnswer":"The stages are egg, larva, pupa and adult."},"37":{"topic":"Adaptation – survival","phrasePrompt":"What is an adaptation?","phrase":"An adaptation is a structural feature or behaviour that helps an organism survive in its environment.","applicationQuestion":"An animal changes its behaviour to avoid very hot conditions. Explain why this behaviour can be an adaptation.","rubric":["Behaviour helps the animal cope with an environmental condition","It improves the organism's chance of survival"],"modelApplicationAnswer":"The behaviour helps the animal cope with the hot conditions and improves its chance of survival, so it is an adaptation."},"46":{"topic":"Faster evaporation – wind","phrasePrompt":"How does wind affect the rate of evaporation?","phrase":"Moving air or wind increases the rate of evaporation.","applicationQuestion":"Two identical wet towels are placed under the same conditions, but moving air blows over only Towel A. Explain why Towel A dries faster.","rubric":["Towel A is exposed to moving air","Moving air increases the rate of evaporation","Towel A dries faster"],"modelApplicationAnswer":"Towel A is exposed to moving air. Moving air increases the rate of evaporation, so Towel A dries faster."}};
const EXPERIMENT_V2=[{"id":90,"topic":"🧪 Experiment — variables","phrasePrompt":"What are the changed and measured variables?","phrase":"The changed variable is the factor deliberately changed; the measured variable is the outcome measured.","applicationQuestion":"A pupil changes the height of a ramp and measures the distance travelled by a toy car. Identify the changed and measured variables.","rubric":["Changed variable: height of ramp","Measured variable: distance travelled by toy car"],"modelApplicationAnswer":"The changed variable is the height of the ramp. The measured variable is the distance travelled by the toy car.","bookRef":"pp. 90–93, 102+"},{"id":91,"topic":"🧪 Experiment — fair test","phrasePrompt":"How do you make an experiment a fair test?","phrase":"Change only one variable and keep all other relevant variables the same.","applicationQuestion":"A pupil investigates how surface type affects the distance travelled by a toy car. What must be done to make the test fair?","rubric":["Change only the surface type","Keep all other relevant variables the same","Relevant examples may include the same toy car, starting point and release method"],"modelApplicationAnswer":"Only the surface type should be changed. Other relevant variables, such as the toy car, starting point and release method, should be kept the same.","bookRef":"pp. 90–93, 102+"},{"id":92,"topic":"🧪 Experiment — relationship","phrasePrompt":"How should a relationship from data be stated?","phrase":"State how the measured variable changes as the changed variable increases or decreases, naming both variables.","applicationQuestion":"As the height of a ramp increases, the distance travelled by a toy car increases. State the relationship.","rubric":["Name the changed variable: height of ramp","Name the measured variable: distance travelled","State the correct direction of change"],"modelApplicationAnswer":"As the height of the ramp increases, the distance travelled by the toy car increases.","bookRef":"pp. 90–93, 102+"},{"id":93,"topic":"🧪 Experiment — reliability","phrasePrompt":"How can reliability be improved?","phrase":"Repeat the experiment several times, check for consistent results and calculate an average when appropriate.","applicationQuestion":"A pupil takes only one numerical reading for each set-up. How can the reliability of the results be improved?","rubric":["Repeat the experiment/readings several times","Check for consistent or similar results","Calculate an average when appropriate"],"modelApplicationAnswer":"Repeat the experiment several times and calculate the average of the readings, checking that the repeated results are consistent.","bookRef":"pp. 90–92, 102+"},{"id":94,"topic":"🧪 Experiment — accuracy","phrasePrompt":"What is accuracy and how can it be improved?","phrase":"Accuracy means results are close to the actual value; use suitable apparatus and careful measuring procedures to improve it.","applicationQuestion":"A pupil needs an accurate liquid-volume reading. State two ways to improve accuracy.","rubric":["Use suitable precise apparatus","Read the scale correctly, such as at eye level when appropriate","Follow the procedure carefully"],"modelApplicationAnswer":"Use a suitable measuring cylinder with an appropriate scale and read the liquid level correctly at eye level.","bookRef":"pp. 90–98, 102+"},{"id":95,"topic":"🧪 Experiment — control set-up","phrasePrompt":"What is the purpose of a control set-up?","phrase":"A control set-up is kept the same as the experimental set-up except for the changed variable, so the effect of that variable can be compared.","applicationQuestion":"Why is a control set-up useful in an investigation?","rubric":["Same conditions except for the changed variable","Provides a comparison","Helps confirm whether the changed variable caused the measured effect"],"modelApplicationAnswer":"It provides a comparison because the conditions are the same except for the changed variable, helping to show whether that variable caused the measured effect.","bookRef":"p. 93, 102+"},{"id":96,"topic":"🧪 Experiment — evidence","phrasePrompt":"What should you do when a question asks for evidence?","phrase":"Use the relevant observation, value or comparison from the results before explaining the science when an explanation is required.","applicationQuestion":"A result table shows that Set-up A has a larger measured value than Set-up B. How should you use this as evidence in an explanation?","rubric":["State the relevant result or comparison","Use actual values if they are provided and useful","Then give the science reasoning if the command word requires explanation"],"modelApplicationAnswer":"State the relevant result or comparison from the data first, then explain the scientific reason for that result if the question asks for an explanation.","bookRef":"pp. 90–93, 100, 102+"},{"id":97,"topic":"🧪 Experiment — apparatus","phrasePrompt":"How should apparatus be chosen for measurement?","phrase":"Choose apparatus that suits what is measured and has an appropriate range and precision; take readings correctly.","applicationQuestion":"A pupil must measure 36 mL of water accurately. Which is more suitable: a beaker or a measuring cylinder? Explain.","rubric":["Measuring cylinder","More precise/suitable scale than a beaker","Used for measuring liquid volume accurately"],"modelApplicationAnswer":"A measuring cylinder is more suitable because it measures liquid volume more precisely than a beaker.","bookRef":"pp. 94–98"}];
const CHANGED_IDS=[3,6,9,10,12,19,37,46,90,91,92,93,94,95,96,97];

function applyBookAudit(){
  if(typeof BANK==='undefined')return;
  for(let i=0;i<Math.min(89,BANK.length);i++){
    const id=i+1;
    BANK[i].bookRef=BOOK_REFS[String(id)]||'108-page revision book';
    BANK[i].bookBacked=true;
  }
  Object.entries(STRICT_PATCHES).forEach(([id,patch])=>Object.assign(BANK[Number(id)-1],patch,{bookBacked:true,bookRef:BOOK_REFS[id]}));
  if(BANK.length>=97){
    EXPERIMENT_V2.forEach((item,j)=>Object.assign(BANK[89+j],item,{bookBacked:true,experimentSkill:true}));
  }
}

function preserveAndRevalidateChangedRecall(){
  try{
    if(localStorage.getItem(AUDIT_VERSION)==='done'||typeof rec!=='function'||typeof save!=='function')return;
    CHANGED_IDS.forEach(id=>{
      const idx=id-1;if(idx>=BANK.length)return;
      const x=rec(idx);
      const old=Array.isArray(x.phraseDates)?x.phraseDates.slice():[];
      if(old.length){
        x.bookAuditLegacyPhraseDates=Array.from(new Set([...(x.bookAuditLegacyPhraseDates||[]),...old]));
        x.phraseDates=[];
        x.phraseLast='';
      }
    });
    save();
    localStorage.setItem(AUDIT_VERSION,'done');
  }catch(e){console.warn('Could not archive revised-phrase mastery',e)}
}

function addSourceLine(){
  const prompt=document.getElementById('phrasePrompt');
  if(!prompt||document.getElementById('bookSourceLine'))return;
  const d=document.createElement('div');
  d.id='bookSourceLine';d.className='verbatim-line';
  d.style.marginTop='-8px';d.style.marginBottom='10px';d.style.fontWeight='700';
  prompt.insertAdjacentElement('afterend',d);
}

function updateSourceLine(){
  const d=document.getElementById('bookSourceLine');
  if(!d||typeof current!=='function'||typeof BANK==='undefined')return;
  const e=BANK[current()];
  if(!e)return;
  d.textContent=`📘 Book-backed: ${e.bookRef||'108-page revision book'}${e.experimentSkill?' · Experiment/process skill':''}`;
}

function wrapRender(){
  if(typeof render!=='function'||render.__bookAuditWrapped)return;
  const base=render;
  const wrapped=function(){const out=base.apply(this,arguments);updateSourceLine();return out};
  wrapped.__bookAuditWrapped=true;
  render=wrapped;
}

function addExperimentButton(){
  if(document.getElementById('experimentOnlyBtn'))return;
  const build=document.getElementById('buildQueue');
  if(!build)return;
  const b=document.createElement('button');
  b.id='experimentOnlyBtn';b.textContent='🧪 Experiments 90–97';b.title='Practise only the 8 experiment/process-skill frameworks';
  b.onclick=()=>{order=[89,90,91,92,93,94,95,96].filter(i=>i<BANK.length);pos=0;if(typeof setPane==='function')setPane('phrase');render();window.scrollTo({top:0,behavior:'smooth'})};
  build.insertAdjacentElement('afterend',b);
}

function clarifyApplication(){
  const appNote=document.querySelector('#appPane .mode-note');
  if(appNote)appNote.innerHTML='<b>Important:</b> Start with the <b>command word</b>. Use <b>D/E → S/R → L/R only when required</b>. D/E comes from the actual setup, observation, graph, table or comparison. S/R is the Science principle or causal reasoning. Add L/R only when the question still needs the final result. Experiment/design questions use the book-backed variable, fair-test, reliability, accuracy, control and measurement rules.';
}

function styleAudit(){
  const s=document.createElement('style');
  s.textContent=`
  #bookSourceLine{color:#166534;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:8px 10px}
  .row.redrow,.row.redrow.currentrow{border-left:7px solid #450a0a !important;background:#991b1b !important}
  .row.redrow .rownum,.row.redrow .topicname{color:#fff !important;font-weight:800 !important}
  .row.redrow:hover,.row.redrow.currentrow:hover{background:#7f1d1d !important}
  .pill.red{background:#991b1b !important;color:#fff !important;border:1px solid #7f1d1d !important}
  `;
  document.head.appendChild(s);
}

function updateHeader(){
  const sub=document.querySelector('header .sub');
  if(sub)sub.textContent='97 book-backed patterns · 89 Science explanations + 8 experiment/process-skill frameworks · memorisation + application';
}

applyBookAudit();
preserveAndRevalidateChangedRecall();
addSourceLine();
wrapRender();
addExperimentButton();
clarifyApplication();
styleAudit();
updateHeader();
if(typeof render==='function')render();
})();