const ALLOWED_ORIGINS = new Set([
  'https://limkimsze-maker.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
]);

function cors(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://limkimsze-maker.github.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Cache-Control': 'no-store'
  };
}

function reply(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cors(request) }
  });
}

function text(v, max = 3000) {
  return String(v ?? '').trim().slice(0, max);
}

const EVAL_SCHEMA = {
  type: 'object',
  properties: {
    conceptCorrect: { type: 'boolean' },
    deRequired: { type: 'boolean' },
    deMet: { type: 'boolean' },
    srRequired: { type: 'boolean' },
    srMet: { type: 'boolean' },
    lrRequired: { type: 'boolean' },
    lrMet: { type: 'boolean' },
    feedback: { type: 'string' },
    strengths: { type: 'string' },
    missing: { type: 'string' },
    improvedAnswer: { type: 'string' }
  },
  required: ['conceptCorrect','deRequired','deMet','srRequired','srMet','lrRequired','lrMet','feedback','strengths','missing','improvedAnswer']
};

const TRAINING_SCHEMA = {
  type: 'object',
  properties: {
    frameNeeded: { type: 'boolean' },
    de: { type: 'string' },
    lr: { type: 'string' },
    appliedFramework: { type: 'string' },
    directAnswer: { type: 'string' },
    keywords: { type: 'string' },
    note: { type: 'string' }
  },
  required: ['frameNeeded','de','lr','appliedFramework','directAnswer','keywords','note']
};

const SELFTEST_SCHEMA = {
  type: 'object',
  properties: { ok: { type: 'boolean' }, message: { type: 'string' } },
  required: ['ok','message']
};

async function runStructured(env, messages, schema, maxTokens = 600) {
  const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
    messages,
    response_format: { type: 'json_schema', json_schema: schema },
    temperature: 0,
    max_tokens: maxTokens
  });
  let out = result?.response ?? result;
  if (typeof out === 'string') out = JSON.parse(out);
  if (!out || typeof out !== 'object') throw new Error('Invalid structured response');
  return out;
}

function parseBody(body) {
  const conceptId = Number(body.conceptId || 0);
  const topic = text(body.topic, 160);
  const question = text(body.question, 2500);
  const pupilAnswer = text(body.answer, 2500);
  const verbatim = text(body.verbatim, 2500);
  const modelAnswer = text(body.modelAnswer, 3000);
  const rubric = Array.isArray(body.rubric) ? body.rubric.map(x => text(x, 400)).filter(Boolean).slice(0, 12) : [];
  return { conceptId, topic, question, pupilAnswer, verbatim, modelAnswer, rubric };
}

function deriveRating(out) {
  if (out.conceptCorrect !== true) return 'concept';
  if (out.deRequired && !out.deMet) return 'de';
  if (out.srRequired && !out.srMet) return 'sr';
  if (out.lrRequired && !out.lrMet) return 'lr';
  return 'correct';
}

const SOURCE_AND_MARKING_RULES = `
SOURCE HIERARCHY:
1. The supplied VERBATIM explanation/framework and SCORING IDEAS come from the pupil's designated gold-standard Primary Science revision bank. They are the scientific-content authority for this task.
2. Authentic PSLE Science papers from 2013-2019 plus a specimen paper are calibration for real question structure, command words, diagrams, tables, experimental contexts and the level of causal linking expected.
3. The worked answer pages packaged with the uploaded papers are from Educational Publishing House (EPH), not official SEAB marking schemes. Treat them only as secondary structural calibration. Never let publisher wording override the gold-standard revision bank.
4. The teacher's CER slides are also a secondary structure source. Map their function into D/E-S/R-L/R without teaching a second framework to the pupil.

D/E-S/R-L/R:
- D/E = actual data, observation, setup, changed condition, graph/table value, diagram evidence or explicit comparison from THIS question.
- S/R = the scientific principle or causal mechanism that explains the evidence. Preserve the gold-standard Primary Science terminology and key words.
- L/R = the requested conclusion, outcome or link back, ONLY when it still needs to be stated.
- Do not force all three parts into every answer.
- If the claim/result is already explicitly supplied in the question and merely repeating it adds no scientific content, set lrRequired=false. D/E + S/R can be a complete answer.
- Do not classify a scientific rule as D/E just because a CER slide labelled it Evidence. Classify by function.

PSLE CALIBRATION RULES:
- Obey the command word first. State/Name/Identify can be direct. Explain/Why normally needs S/R. Evidence/data questions require question-specific D/E. Compare questions must cover both sides when the comparison itself is assessed.
- When values are given and the question says 'using evidence' or equivalent, quote the relevant values or make an explicit numerical/observational comparison.
- For relationship questions, state changed variable versus measured variable and the direction. If the trend changes, state separate relationships.
- For fair-test/design questions, identify the changed variable and measured variable from the question and keep other relevant variables constant. Use a control setup only when comparison with/without a factor is genuinely required.
- Continue a causal chain until the exact result asked is reached, then stop. Do not add unrelated science.
- Compare both subjects explicitly when asked to compare; a one-sided description is incomplete unless the wording itself makes the comparison unambiguous.
- Do not reward repeated claims as a substitute for missing evidence or reasoning.
- Do not demand extra science beyond the question and supplied gold-standard rubric.

TOPIC CALIBRATION:
- Magnets: movement/attraction/repulsion observed = D/E; like poles repel/unlike poles attract or magnetic-material rule = S/R.
- Condensation: water vapour contacting cooler surface/air = D/E; loses heat and condenses to water droplets = S/R.
- Matter: what air enters/pushes/changes = D/E; air occupies space / gas can be compressed = S/R.
- Electricity: open/closed/complete circuit from setup = D/E; whether electric current can/cannot flow = S/R. For electromagnets, link current to magnetic effect.
- Photosynthesis: use actual light/carbon-dioxide/water condition as D/E; preserve gold-standard photosynthesis wording in S/R; link to food/oxygen/growth only when asked.
- Plant transport: distinguish water-carrying from food-carrying tubes and state the actual substance/direction. For cut/ring-removal questions, state what can no longer reach which part before the consequence.
- Respiration/body systems: when activity is involved, more energy needed -> faster respiration -> more oxygen/digested food needed -> breathing/heart/transport outcome as required.
- Ecosystems: event/change -> food/predator/prey/resource relationship -> population effect.
- Heat: identify hotter/cooler objects or insulating material and direction/rate of heat transfer. Do not confuse heat with temperature.
- Evaporation: use exposed surface area, temperature or moving air only when that factor is actually relevant in the question.
- Forces: identify actual forces and their effects/directions. Use friction, gravity, elastic force or balance/unbalance only when supported by the setup.
- Energy: name starting and ending energy forms in context; include transfer/conversion steps only as far as required.
- Adaptations: feature/behaviour -> immediate effect -> survival/reproduction advantage, using the actual habitat condition.
- Matter: stay at Primary Science level; do not require particle theory unless explicitly supplied by the gold-standard rubric.
- Reliability and accuracy are different. Reliability concerns repeated, consistent/similar results and averaging repeated results when appropriate. Accuracy concerns closeness to actual value and correct apparatus/procedure.
`;

async function trainingModel(env, data) {
  const isExperiment = data.conceptId >= 90;
  const system = `You write high-safety Singapore Primary 6 PSLE Science training answers.

${SOURCE_AND_MARKING_RULES}

TRAINING RULES:
1. First decide whether a D/E-S/R-L/R frame is genuinely useful. Do not force it into State/Name/Identify/simple relationship questions.
2. For Explain/Why/Evidence/Compare questions, frameNeeded is usually true when evidence/comparison plus scientific reasoning is needed.
3. frameNeeded=true does NOT mean all three boxes must be filled. If the claim/result is already in the question and repetition adds no mark, leave lr empty.
4. For ordinary Science concepts 1-89, DO NOT paraphrase the supplied VERBATIM memorised explanation. The server will use it unchanged as S/R. Generate D/E and only the L/R that is genuinely needed.
5. For experiment frameworks 90-97, fill the supplied framework with the actual variables/results. Do not leave blanks.
6. Use actual values/observations/comparisons where the question provides them.
7. Keep the answer concise but complete and safe for a pupil to imitate.
8. keywords must be a comma-separated list of important scientific words/phrases to protect.
9. Never introduce science beyond the question, gold-standard verbatim and rubric.`;

  const user = `CONCEPT ID: ${data.conceptId}\nTYPE: ${isExperiment ? 'EXPERIMENT FRAMEWORK' : 'SCIENCE EXPLANATION'}\nTOPIC: ${data.topic}\n\nQUESTION:\n${data.question}\n\nGOLD-STANDARD VERBATIM:\n${data.verbatim}\n\nGOLD-STANDARD SCORING IDEAS:\n- ${data.rubric.join('\n- ')}\n\nOLDER APPLIED ANSWER (reference only):\n${data.modelAnswer}`;

  const out = await runStructured(env, [{role:'system',content:system},{role:'user',content:user}], TRAINING_SCHEMA, 750);
  const frameNeeded = out.frameNeeded === true;
  const de = text(out.de, 900);
  const lr = text(out.lr, 900);
  const appliedFramework = text(out.appliedFramework, 1400);
  const directAnswer = text(out.directAnswer, 1800);
  const keywords = text(out.keywords, 1000);
  const note = text(out.note, 600);

  if (isExperiment) {
    const sr = appliedFramework || data.verbatim;
    return {
      frameNeeded,
      isExperiment: true,
      de,
      sr,
      lr,
      verbatimFramework: data.verbatim,
      fullAnswer: text(frameNeeded ? [de,sr,lr].filter(Boolean).join(' ') : (directAnswer || sr || data.modelAnswer), 3000),
      keywords,
      note
    };
  }

  const sr = data.verbatim;
  return {
    frameNeeded,
    isExperiment: false,
    de,
    sr,
    lr,
    fullAnswer: text(frameNeeded ? [de,sr,lr].filter(Boolean).join(' ') : (directAnswer || data.modelAnswer || sr), 3000),
    keywords,
    note
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });

    if (url.pathname === '/health') {
      return reply(request, {
        ok: true,
        service: 'PSLE Science AI Marker',
        model: 'llama-3.1-8b-instruct-fast-json',
        calibration: 6,
        trainingModels: true,
        goldStandardBook: true,
        cerStructureIntegrated: true,
        pslePapersCalibrated: true,
        pslePaperYears: '2013-2019 + specimen',
        publisherAnswersAreSecondary: true
      });
    }

    if (url.pathname === '/selftest') {
      try {
        const out = await runStructured(env, [
          {role:'system',content:'Return the requested JSON only.'},
          {role:'user',content:'Set ok to true and message to Workers AI is working.'}
        ], SELFTEST_SCHEMA, 80);
        return reply(request, {ok:out.ok===true,message:text(out.message,120),model:'llama-3.1-8b-instruct-fast'});
      } catch (err) {
        return reply(request, {ok:false,error:'Workers AI self-test failed',diagnostic:text(err?.message||err,300)}, 502);
      }
    }

    if (!['/mark','/training-model'].includes(url.pathname) || request.method !== 'POST') return reply(request, {error:'Not found'}, 404);

    const origin = request.headers.get('Origin') || '';
    if (origin && !ALLOWED_ORIGINS.has(origin)) return reply(request, {error:'Origin not allowed'}, 403);

    let body;
    try { body = await request.json(); } catch { return reply(request, {error:'Invalid JSON body'}, 400); }
    const data = parseBody(body);
    if (!data.question || !data.verbatim || data.rubric.length === 0) return reply(request, {error:'Missing question, gold-standard verbatim explanation/framework or rubric.'}, 400);

    if (url.pathname === '/training-model') {
      try { return reply(request, await trainingModel(env, data)); }
      catch (err) { return reply(request, {error:'Full training model is temporarily unavailable. Please try again.',diagnostic:text(err?.message||err,300)}, 502); }
    }

    if (!data.pupilAnswer) return reply(request, {error:'Missing pupil answer.'}, 400);

    const system = `You are a strict but fair Singapore PSLE Science open-ended answer marker for a Primary 6 pupil.

${SOURCE_AND_MARKING_RULES}

APPLICATION MARKING:
- Application answers do not need to match the model or memorised sentence word-for-word. Accept scientifically equivalent wording and different sentence order when the required science is present.
- conceptCorrect=false only for a genuine misconception or when the relevant concept is absent/wrong.
- Set deRequired=true only when the question genuinely depends on observation/data/comparison/setup evidence. If required, deMet=true when the pupil clearly states the relevant evidence in ordinary words.
- Set srRequired=true for Explain/Why when a scientific concept or causal mechanism is genuinely needed. Equivalent wording is acceptable but the essential scientific idea/cause-effect link must be present.
- Set lrRequired=true only when the result/conclusion still needs to be stated. If the claim/result is already explicitly in the question and repeating it adds no content, lrRequired=false.
- If all genuinely required components are met and the science is correct, the answer must be Correct.
- Do not penalise grammar unless it changes the science.
- improvedAnswer is a teaching answer: use question-specific D/E, the precise gold-standard S/R wording whenever it fits, and L/R only when needed.
- If the question asks for evidence from results, use actual values or explicit comparisons when available.
- If the question asks to compare, cover both sides.
- Do not treat the EPH worked answers as official mark schemes or require their exact phrasing.`;

    const user = `CONCEPT ID: ${data.conceptId}\nTOPIC: ${data.topic}\n\nQUESTION:\n${data.question}\n\nPUPIL ANSWER:\n${data.pupilAnswer}\n\nGOLD-STANDARD VERBATIM CORE:\n${data.verbatim}\n\nGOLD-STANDARD SCORING IDEAS:\n- ${data.rubric.join('\n- ')}\n\nOLDER APPLIED ANSWER (reference only):\n${data.modelAnswer}`;

    try {
      const out = await runStructured(env, [{role:'system',content:system},{role:'user',content:user}], EVAL_SCHEMA, 900);
      const r = deriveRating(out);
      return reply(request, {
        rating: r,
        verdict: r === 'correct' ? 'Correct' : (r === 'de' || r === 'lr' ? 'Almost there' : 'Needs correction'),
        feedback: text(out.feedback,700),
        strengths: text(out.strengths,500),
        missing: r === 'correct' ? '' : text(out.missing,500),
        improvedAnswer: text(out.improvedAnswer,2400),
        criteria: {
          conceptCorrect: out.conceptCorrect === true,
          deRequired: out.deRequired === true,
          deMet: out.deMet === true,
          srRequired: out.srRequired === true,
          srMet: out.srMet === true,
          lrRequired: out.lrRequired === true,
          lrMet: out.lrMet === true
        }
      });
    } catch (err) {
      return reply(request, {error:'AI marking is temporarily unavailable. Please try again.',diagnostic:text(err?.message||err,300)}, 502);
    }
  }
};
