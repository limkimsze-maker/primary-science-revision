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
  required: [
    'conceptCorrect','deRequired','deMet','srRequired','srMet','lrRequired','lrMet',
    'feedback','strengths','missing','improvedAnswer'
  ]
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
  properties: {
    ok: { type: 'boolean' },
    message: { type: 'string' }
  },
  required: ['ok', 'message']
};

async function runStructured(env, messages, schema, maxTokens = 500) {
  const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
    messages,
    response_format: {
      type: 'json_schema',
      json_schema: schema
    },
    temperature: 0,
    max_tokens: maxTokens
  });

  let out = result?.response ?? result;
  if (typeof out === 'string') out = JSON.parse(out);
  if (!out || typeof out !== 'object') throw new Error('Invalid structured response');
  return out;
}

function deriveRating(out) {
  if (out.conceptCorrect !== true) return 'concept';
  if (out.deRequired === true && out.deMet !== true) return 'de';
  if (out.srRequired === true && out.srMet !== true) return 'sr';
  if (out.lrRequired === true && out.lrMet !== true) return 'lr';
  return 'correct';
}

function parseBody(body) {
  const conceptId = Number(body.conceptId || 0);
  const topic = text(body.topic, 160);
  const question = text(body.question, 2500);
  const pupilAnswer = text(body.answer, 2500);
  const verbatim = text(body.verbatim, 2500);
  const modelAnswer = text(body.modelAnswer, 3000);
  const rubric = Array.isArray(body.rubric)
    ? body.rubric.map(x => text(x, 400)).filter(Boolean).slice(0, 12)
    : [];
  return { conceptId, topic, question, pupilAnswer, verbatim, modelAnswer, rubric };
}

const GOLD_RULES = `
GOLD-STANDARD SOURCE RULES:
- The supplied VERBATIM explanation/framework and SCORING IDEAS come from the pupil's designated gold-standard Primary Science revision book/database. Treat them as the content authority for this task.
- Preserve the book's Primary Science terminology and level. Do not silently replace it with secondary-school particle theory or other extra science when the supplied gold-standard wording does not use it.
- The teacher's CER slides are a SECONDARY STRUCTURE SOURCE, not the scientific-content authority. Use them to understand how evidence and reasoning earn marks, but the gold-standard revision book still controls memorised Science wording.
- Map CER functionally, not mechanically: observable result/setup/comparison = D/E; scientific principle or causal mechanism = S/R; requested conclusion/outcome = L/R only when it still needs to be stated.
- If a Claim/result is already explicitly supplied by the question and merely repeating it would add no scientific content or mark, do NOT require an extra L/R sentence. A complete D/E + S/R explanation can be fully correct.
- Do not classify a scientific rule as D/E merely because a CER slide happened to place it under an Evidence label. Classify by what the sentence actually does in the answer.
- For magnets, observations such as an object moving away are D/E; 'like poles repel' is S/R.
- For condensation, contact with a cooler surface/air is D/E and losing heat then condensing into water droplets is S/R.
- For matter, what air enters/pushes/changes is D/E and 'air occupies space' is S/R.
- For electrical systems, whether the circuit is open/closed is D/E and whether electric current can/cannot flow is S/R.
- For adaptations, use feature/behaviour -> effect -> survival advantage; the final survival result is L/R only when the question still requires it.
- For photosynthesis, protect terms such as chlorophyll, traps light energy, carbon dioxide, water, food/sugar and oxygen when the question/rubric needs them.
- For germination, use the gold-standard conditions and wording supplied in the rubric; do not invent extra conditions.
- For plant transport, distinguish water-carrying tubes from food-carrying tubes and use the actual substance being transported.
- For state changes, distinguish evaporation from boiling. Evaporation occurs at the surface and can occur at any temperature; boiling takes place throughout the liquid at a fixed temperature/boiling point when the supplied rubric requires this.
- For matter, use mass, occupies space, definite shape/volume and compressibility as supplied. Do not demand particle explanations unless the supplied rubric explicitly includes them.
- For electricity, follow the supplied gold-standard current-based relationships for bulb brightness. Do not replace them with an 'energy is shared' explanation when the rubric instead requires electric current.
- Reliability and accuracy are different. Reliability concerns repeated, consistent/similar results and averaging repeated results when appropriate. Accuracy concerns closeness to the actual value and correct measuring procedure/apparatus.
- For relationship questions, state the changed variable against the measured variable and the direction of the relationship. If the trend changes, separate the relationships.
- For comparison questions, compare both subjects explicitly when the question calls for a comparison.
`;

async function trainingModel(env, data) {
  const isExperiment = data.conceptId >= 90;
  const system = `You write HIGH-SAFETY training model answers for Singapore Primary 6 PSLE Science.

The pupil has been explicitly taught D/E -> S/R -> L/R:
D/E = Data / Evidence / observation / comparison from the question.
S/R = Science / Reasoning: the scientific concept or causal mechanism.
L/R = Link / Result: explicitly answer the result or outcome asked, only when it is genuinely needed.

The purpose is TEACHING, not minimum marking. The training model should be fuller and safer than the shortest answer a marker might accept.

${GOLD_RULES}

Rules:
1. First obey the command word. Do not force D/E-S/R-L/R into State / Name / Identify / simple relationship questions when that would be artificial.
2. For Explain / Why / Give a reason / Evidence / Compare questions, normally set frameNeeded=true when the question requires a causal explanation, evidence or comparison.
3. A frameNeeded=true answer does NOT automatically need all three boxes populated. If the result/claim is already supplied by the question and repeating it adds no mark, leave lr empty rather than manufacturing a repetitive L/R.
4. For ordinary Science concepts (conceptId 1-89), DO NOT rewrite or paraphrase the supplied gold-standard memorised explanation. The server will insert that exact sentence as S/R. Write D/E and, only when needed, L/R around it without repeating it unnecessarily.
5. For experiment frameworks (conceptId 90-97), the supplied VERBATIM text is the framework to memorise. Fill it with the actual variables/results in appliedFramework; do not leave blanks.
6. Use actual values, observations, comparisons, changed variable and measured variable when provided.
7. Keep each component concise but complete. Use precise scientific nouns instead of vague words such as 'it', 'things', 'better' or 'affected'.
8. keywords must be a comma-separated list of the key words/phrases the pupil should protect.
9. Do not introduce science beyond the supplied gold-standard rubric and memorised explanation.
10. If the supplied older applied answer conflicts with the gold-standard verbatim/rubric, follow the gold-standard verbatim/rubric.
11. The final answer must be safe for a pupil to imitate in an examination.`;

  const user = `CONCEPT ID: ${data.conceptId}\nTYPE: ${isExperiment ? 'EXPERIMENT FRAMEWORK' : 'SCIENCE EXPLANATION'}\nTOPIC: ${data.topic}\n\nQUESTION:\n${data.question}\n\nGOLD-STANDARD VERBATIM MEMORISED EXPLANATION / FRAMEWORK:\n${data.verbatim}\n\nGOLD-STANDARD SCORING IDEAS:\n- ${data.rubric.join('\n- ')}\n\nOLDER APPLIED ANSWER (reference only):\n${data.modelAnswer}`;

  const out = await runStructured(env, [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ], TRAINING_SCHEMA, 700);

  const frameNeeded = out.frameNeeded === true;
  const de = text(out.de, 900);
  const lr = text(out.lr, 900);
  const appliedFramework = text(out.appliedFramework, 1400);
  const directAnswer = text(out.directAnswer, 1800);
  const keywords = text(out.keywords, 1000);
  const note = text(out.note, 500);

  if (isExperiment) {
    const sr = appliedFramework || data.verbatim;
    const fullAnswer = frameNeeded
      ? [de, sr, lr].filter(Boolean).join(' ')
      : (directAnswer || sr || data.modelAnswer);
    return {
      frameNeeded,
      isExperiment: true,
      de,
      sr,
      lr,
      verbatimFramework: data.verbatim,
      fullAnswer: text(fullAnswer, 3000),
      keywords,
      note
    };
  }

  const sr = data.verbatim;
  const fullAnswer = frameNeeded
    ? [de, sr, lr].filter(Boolean).join(' ')
    : (directAnswer || data.modelAnswer || sr);

  return {
    frameNeeded,
    isExperiment: false,
    de,
    sr,
    lr,
    fullAnswer: text(fullAnswer, 3000),
    keywords,
    note
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(request) });
    }

    if (url.pathname === '/health') {
      return reply(request, {
        ok: true,
        service: 'PSLE Science AI Marker',
        model: 'llama-3.1-8b-instruct-fast-json',
        calibration: 5,
        trainingModels: true,
        goldStandardBook: true,
        cerStructureIntegrated: true
      });
    }

    if (url.pathname === '/selftest') {
      try {
        const out = await runStructured(env, [
          { role: 'system', content: 'Return the requested JSON only.' },
          { role: 'user', content: 'Set ok to true and message to Workers AI is working.' }
        ], SELFTEST_SCHEMA, 80);
        return reply(request, { ok: out.ok === true, message: text(out.message, 120), model: 'llama-3.1-8b-instruct-fast' });
      } catch (err) {
        return reply(request, { ok: false, error: 'Workers AI self-test failed', diagnostic: text(err?.message || err, 300) }, 502);
      }
    }

    if (!['/mark','/training-model'].includes(url.pathname) || request.method !== 'POST') {
      return reply(request, { error: 'Not found' }, 404);
    }

    const origin = request.headers.get('Origin') || '';
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return reply(request, { error: 'Origin not allowed' }, 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return reply(request, { error: 'Invalid JSON body' }, 400);
    }

    const data = parseBody(body);
    if (!data.question || !data.verbatim || data.rubric.length === 0) {
      return reply(request, { error: 'Missing question, gold-standard verbatim explanation/framework or rubric.' }, 400);
    }

    if (url.pathname === '/training-model') {
      try {
        const model = await trainingModel(env, data);
        return reply(request, model);
      } catch (err) {
        console.error('Training model error', err);
        return reply(request, {
          error: 'Full training model is temporarily unavailable. Please try again.',
          diagnostic: text(err?.message || err, 300)
        }, 502);
      }
    }

    if (!data.pupilAnswer) {
      return reply(request, { error: 'Missing pupil answer.' }, 400);
    }

    const system = `You are a strict but fair Singapore PSLE Science open-ended answer marker for a Primary 6 pupil.

Your job is to judge whether the pupil supplied the SCIENCE THAT THE QUESTION ACTUALLY REQUIRES. Mark from the supplied question and the gold-standard verbatim explanation/framework and scoring ideas.

APPLICATION ANSWERS DO NOT NEED TO MATCH THE MODEL OR VERBATIM WORDING. Accept scientifically equivalent wording, different sentence order and concise answers when the required science is present. The gold-standard memorised sentence is a teaching target, not a requirement for word-for-word application answers.

${GOLD_RULES}

Use D/E -> S/R -> L/R only as the pupil's DIAGNOSTIC framework:
- D/E (Data/Evidence) is required when the question depends on an observation, comparison, changed condition, graph/table result or experimental evidence. If the pupil clearly states the relevant observation/comparison/change in ordinary words, D/E is met.
- S/R (Science/Reasoning) is required for an explain/reason question when a scientific concept or causal mechanism is needed. Equivalent science wording is acceptable, but essential scientific ideas and causal links must be present.
- L/R (Link/Result) is required only when the pupil must still connect the science to a result/conclusion that is not already adequately supplied by the question or answer context. If the claim/result is already in the question and repeating it adds no scientific content, set lrRequired=false.
- conceptCorrect is false only for a genuine scientific misconception or when the relevant concept is absent/wrong.

CRITICAL MARKING RULES:
1. Obey the command word first. For State / Name / Identify, do not invent D/E, S/R or L/R requirements.
2. Do not require extra details not demanded by the question or gold-standard rubric.
3. Do not penalise grammar unless it changes the science.
4. Do not penalise a different valid order.
5. Do NOT require a pupil to repeat a claim/result that is already explicitly stated in the question when the CER-style source shows that the claim itself carries no content mark. In such cases, D/E + S/R can be a complete answer and lrRequired must be false.
6. If the pupil states the exact result asked and it genuinely needs to be stated, L/R is met.
7. If all required components are met and the science is correct, the answer must be Correct.
8. For Explain / Why / Evidence / Compare questions, identify a genuinely missing key scientific idea or missing causal link rather than demanding a stock phrase.
9. Classify by function: observation/setup/result belongs in D/E; the scientific principle/mechanism belongs in S/R. Never move a scientific principle into D/E merely because a teaching slide labelled it 'Evidence'.
10. For compare questions, if both subjects must be compared, an answer that describes only one side is incomplete.
11. For experiment reliability, accept repeated trials + consistent/similar results and averaging repeated results when appropriate; do not insist on the phrase 'random error'.
12. For matter, do not require particle theory unless it is explicitly in the supplied gold-standard scoring ideas.
13. improvedAnswer is a TEACHING answer: include required D/E, the precise gold-standard S/R wording whenever it fits, and L/R only where it genuinely adds the needed result/conclusion. Do not teach pupils to repeat a zero-mark claim mechanically.

CALIBRATION EXAMPLE — CORRECT WITH D/E + S/R + L/R:
Question: Two identical green plants were given the same amount of water. Plant A was placed in light while Plant B was kept in darkness. Explain why Plant A could make food but Plant B could not.
Pupil answer: 'As Plant A was placed in light unlike Plant B, Plant B could not photosynthesise as light is needed for green plants to make food during photosynthesis. Thus, Plant B could not make food while Plant A could make food.'
Judge: conceptCorrect=true, deRequired=true, deMet=true, srRequired=true, srMet=true, lrRequired=true, lrMet=true.

CALIBRATION EXAMPLE — CLAIM ALREADY IN QUESTION, NO EXTRA L/R REQUIRED:
Question: The door stopper did not work. Explain why.
Pupil answer: 'The strip was made of plastic. Plastic is a non-magnetic material and is not attracted to the magnet.'
Judge: conceptCorrect=true, deRequired=true, deMet=true, srRequired=true, srMet=true, lrRequired=false, lrMet=true. Do not demand 'therefore the door stopper did not work' again.

CALIBRATION EXAMPLE — CER FUNCTIONAL MAPPING:
Question context: water vapour comes into contact with a cooler surface and water droplets form.
D/E is the contact with the cooler surface; S/R is that the water vapour loses heat and condenses into water droplets. Do not label 'loses heat and condenses' as D/E.

CALIBRATION EXAMPLE — STATE QUESTION:
If the question only asks 'State the process', a correct process name is enough. Do not demand D/E, S/R or L/R.

Keep feedback concise, encouraging and PSLE-appropriate. If the answer is fully correct, missing must be an empty string.`;

    const user = `CONCEPT ID: ${data.conceptId}\nTOPIC: ${data.topic}\n\nQUESTION:\n${data.question}\n\nPUPIL ANSWER:\n${data.pupilAnswer}\n\nGOLD-STANDARD VERBATIM CORE EXPLANATION / FRAMEWORK:\n${data.verbatim}\n\nGOLD-STANDARD SCORING IDEAS:\n- ${data.rubric.join('\n- ')}\n\nOLDER APPLIED ANSWER (reference only):\n${data.modelAnswer}`;

    try {
      const out = await runStructured(env, [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ], EVAL_SCHEMA, 850);

      const r = deriveRating(out);
      const verdict = r === 'correct' ? 'Correct' : (r === 'de' || r === 'lr' ? 'Almost there' : 'Needs correction');
      const missing = r === 'correct' ? '' : text(out.missing, 500);
      const feedback = r === 'correct'
        ? text(out.feedback || 'Your answer contains the required science and answers the question.', 700)
        : text(out.feedback, 700);

      return reply(request, {
        rating: r,
        verdict,
        feedback,
        strengths: text(out.strengths, 500),
        missing,
        improvedAnswer: text(out.improvedAnswer, 2400),
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
      console.error('AI marker error', err);
      return reply(request, {
        error: 'AI marking is temporarily unavailable. Please try again.',
        diagnostic: text(err?.message || err, 300)
      }, 502);
    }
  }
};