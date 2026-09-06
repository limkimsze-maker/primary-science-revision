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
4. The pupil is learning from two PSLE Science keyword posters. The command-word rules below are the marking rules. Follow them before any generic AI judgement.

POSTER-ALIGNED COMMAND-WORD RULES:
Before marking, FIRST identify the command word/question type. THEN decide exactly what the pupil is required to supply. Never force D/E-S/R-L/R onto every question.

- WHAT:
  Read what comes after “what”. Use the information given and the relevant Science concept. Answer directly and briefly. Do not demand an explanation unless the wording asks for one.

- IDENTIFY / NAME / STATE / direct WHICH:
  Choose and state the correct object, part, variable, property, term or Science idea. Use the information given and apply the relevant Science concept. A concise direct answer can earn full credit. Do not require D/E or L/R unless the wording explicitly asks for evidence/comparison or a linked result.

- SUGGEST:
  Accept a reasonable, scientifically valid answer that uses the information given and Science knowledge. Usually a short answer is sufficient. Do not require the pupil to match one exact model response when more than one valid suggestion is possible.

- DESCRIBE:
  Describe what happens in detailed steps from beginning to end, or state what is observed as required by the question. Do NOT require scientific reasons or causal explanations unless the question separately asks for them.

- HOW:
  Explain how something happens or works, usually in a logical sequence of steps, using the relevant Science concepts. Do not treat “how” as a mere list of observations when the question asks for a process or mechanism.

- WHY / EXPLAIN / GIVE A REASON:
  Use the pupil's D/E → S/R → L/R framework in full sentences where the question needs those parts.
  D/E = the relevant Data/Evidence/Observation from THIS question when there is data, a setup, a comparison, a changed condition, a graph/table/diagram observation or experimental result to use.
  S/R = the Science concept/reasoning or causal mechanism. This is normally required for Why/Explain/Give-a-reason questions.
  L/R = link the reasoning back to the exact result/outcome asked when that result still needs to be stated.
  Do not manufacture D/E when the question supplies no evidence to use, and do not repeat an L/R that is already completely stated in the question and adds no mark.

- RELATIONSHIP:
  State how the measured variable changes as the changed variable increases, decreases or remains the same. Name the actual variables from the question rather than giving only a generic rule. If the trend changes across two ranges, give separate relationship statements for the two parts.

- ENSURE RESULTS ARE RELIABLE / IMPROVE RELIABILITY:
  Repeat the experiment/trial/readings several times AND calculate/take the average result, when numerical or measurable results are being collected. Do not confuse reliability with accuracy.

- ACCURACY:
  Use suitable apparatus/procedure and ideas about obtaining a value close to the actual value. Do not substitute “repeat and average” as the definition of accuracy.

- AIM OF EXPERIMENT / WHAT IS THE AIM?:
  Identify what the investigation is finding out from the changed variable and measured variable. Do not force D/E-S/R-L/R.

- CONCLUSION:
  Look at the aim and use the results to answer that aim. State the scientific conclusion; do not merely copy individual results without stating what they show.

  If the aim says “find out if …” → the conclusion should state the Science concept/result answering whether it happens/is true.
  If the aim says “find out which …” → the conclusion should identify the specific object/material/setup AND the relevant property/result that makes it the answer.
  If the aim says “find out how …” → the conclusion should state the relationship between the changed variable and measured variable.

- FIND OUT IF / FIND OUT WHICH / FIND OUT HOW when writing the aim:
  “Find out if” asks whether a stated effect/concept occurs.
  “Find out which” asks which object/material/setup has the relevant property or result.
  “Find out how” asks for the relationship between the changed variable and measured variable.

- PREDICT:
  State the prediction. Give the Science reason only when the question also asks for an explanation/reason.

- COMPARE:
  Make a direct comparison between the named objects/quantities/features. Cover both sides when the comparison itself is assessed.

D/E-S/R-L/R GENERAL SAFETY:
- D/E = actual data, observation, setup, changed condition, graph/table value, diagram evidence or explicit comparison from THIS question.
- S/R = the scientific principle or causal mechanism that explains the evidence. Preserve the gold-standard Primary Science terminology and key words.
- L/R = the requested conclusion, outcome or link back, ONLY when it still needs to be stated.
- Do not force all three parts into every answer.
- A direct recall/concept question can be fully correct without D/E or L/R.
- Do not classify a scientific rule as D/E just because another framework might call it “evidence”. Classify by its function in THIS question.

PSLE CALIBRATION RULES:
- Obey the command word first.
- When values are given and the question says “using evidence” or equivalent, quote the relevant values or make an explicit numerical/observational comparison.
- For fair-test/design questions, identify the changed variable and measured variable from the question and keep other relevant variables constant. Use a control setup only when comparison with/without a factor is genuinely required.
- Continue a causal chain until the exact result asked is reached, then stop. Do not add unrelated Science.
- Do not reward repeated claims as a substitute for missing evidence or reasoning.
- Do not demand extra Science beyond the question and supplied gold-standard rubric.
- A concise answer that fully satisfies the command word and scoring ideas must be accepted even if a longer model answer exists.

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
`;

async function trainingModel(env, data) {
  const system = `You write high-safety Singapore Primary 6 PSLE Science training answers.

${SOURCE_AND_MARKING_RULES}

TRAINING RULES:
1. Identify the command word/question type first and follow the poster-aligned rule for that command word.
2. What/Identify/Name/State/direct Which: give the concise required Science answer. Do not manufacture D/E or L/R.
3. Suggest: give one reasonable scientifically valid answer using the information and Science knowledge; do not imply it is the only possible answer when alternatives are valid.
4. Describe: give observations/steps from beginning to end without adding reasons unless asked.
5. How: give the mechanism/process in logical steps using Science concepts.
6. Why/Explain/Give-a-reason: use D/E-S/R-L/R only to the extent the question genuinely needs those parts.
7. Reliability: include repeat several times and average measurable results. Relationship: state measured variable versus changed variable and split changing trends into separate statements.
8. Aim/Conclusion: use the experiment variables/results. For find out if → Science concept/result; find out which → specific object plus relevant property/result; find out how → relationship.
9. For all 180 Science concepts, preserve the supplied VERBATIM gold-standard Science wording when it is the correct S/R. Do not assume concept numbers 90+ are experiment-framework IDs.
10. Keep the answer concise but complete and safe for a pupil to imitate. Never introduce Science beyond the question, gold-standard verbatim and rubric.`;

  const user = `CONCEPT ID: ${data.conceptId}
TYPE: SCIENCE CONCEPT / APPLICATION
TOPIC: ${data.topic}

QUESTION:
${data.question}

GOLD-STANDARD VERBATIM:
${data.verbatim}

GOLD-STANDARD SCORING IDEAS:
- ${data.rubric.join('\n- ')}

OLDER APPLIED ANSWER (reference only):
${data.modelAnswer}`;

  const out = await runStructured(env, [{role:'system',content:system},{role:'user',content:user}], TRAINING_SCHEMA, 750);
  const frameNeeded = out.frameNeeded === true;
  const de = text(out.de, 900);
  const lr = text(out.lr, 900);
  const appliedFramework = text(out.appliedFramework, 1400);
  const directAnswer = text(out.directAnswer, 1800);
  const keywords = text(out.keywords, 1000);
  const note = text(out.note, 600);
  const sr = appliedFramework || data.verbatim;

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
        calibration: 8,
        commandWordFirst: true,
        posterAligned: true,
        bank180: true,
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
- FIRST identify the command word/question type and apply the matching poster rule above. Only after that decide conceptCorrect, deRequired, srRequired and lrRequired.
- What/Identify/Name/State/direct Which questions can be fully correct with the required concise Science fact/concept only.
- Suggest answers should be accepted when they are reasonable, scientifically valid, use the given information and satisfy the question, even if they differ from the model.
- Describe answers should not be penalised for omitting reasons when reasons were not asked. How answers should include the process/mechanism when that is what “how” asks.
- Why/Explain/Give-a-reason questions normally require S/R; D/E and L/R are required only where the specific question needs them.
- Relationship, Reliability, Aim and Conclusion answers must follow the exact poster distinctions above, including find out if/which/how.
- Application answers do not need to match the model or memorised sentence word-for-word. Accept scientifically equivalent wording and different sentence order when the required Science is present.
- conceptCorrect=false only for a genuine misconception or when the relevant concept is absent/wrong.
- If all genuinely required components are met and the Science is correct, the answer must be Correct.
- Do not penalise grammar unless it changes the Science.
- improvedAnswer must model the same poster rule as the question. Keep it no longer than needed for full credit.
- If the question asks for evidence from results, use actual values or explicit comparisons when available.
- Do not treat EPH worked answers as official mark schemes or require their exact phrasing.`;

    const user = `CONCEPT ID: ${data.conceptId}
TOPIC: ${data.topic}

QUESTION:
${data.question}

PUPIL ANSWER:
${data.pupilAnswer}

GOLD-STANDARD VERBATIM CORE:
${data.verbatim}

GOLD-STANDARD SCORING IDEAS:
- ${data.rubric.join('\n- ')}

OLDER APPLIED ANSWER (reference only):
${data.modelAnswer}`;

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