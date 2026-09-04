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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(request) });
    }

    if (url.pathname === '/health') {
      return reply(request, { ok: true, service: 'PSLE Science AI Marker', model: 'llama-3.1-8b-instruct-fast-json', calibration: 2 });
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

    if (url.pathname !== '/mark' || request.method !== 'POST') {
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

    const topic = text(body.topic, 160);
    const question = text(body.question, 2500);
    const pupilAnswer = text(body.answer, 2500);
    const verbatim = text(body.verbatim, 2500);
    const modelAnswer = text(body.modelAnswer, 3000);
    const rubric = Array.isArray(body.rubric)
      ? body.rubric.map(x => text(x, 400)).filter(Boolean).slice(0, 8)
      : [];

    if (!question || !pupilAnswer || !verbatim || rubric.length === 0) {
      return reply(request, { error: 'Missing question, answer, verbatim explanation or rubric.' }, 400);
    }

    const system = `You are a strict but fair Singapore PSLE Science open-ended answer marker for a Primary 6 pupil.

Your job is to judge whether the pupil has supplied the SCIENCE THAT THE QUESTION ACTUALLY REQUIRES. Mark only from the supplied question, scoring ideas, verbatim core explanation and model application answer.

APPLICATION ANSWERS DO NOT NEED TO MATCH THE MODEL OR VERBATIM WORDING. Accept scientifically equivalent wording, different sentence order and concise answers when the required science is present.

Use D/E -> S/R -> L/R as a DIAGNOSTIC framework, not as a rule that every answer must contain all three parts.
- D/E (Data/Evidence) is required only when the question depends on an observation, comparison, changed condition, graph/table result or experimental evidence. If the pupil clearly states the relevant comparison/change in ordinary words, D/E is met.
- S/R (Science/Reasoning) is required for an explain/reason question when a scientific concept or causal mechanism is needed. Equivalent science wording is acceptable.
- L/R (Link/Result) is required only when the answer must connect the science back to a specific outcome asked. If the pupil explicitly states that outcome, L/R IS MET. Never mark L/R missing merely because the wording differs from the model answer.
- conceptCorrect is false only for a real scientific misconception or when the relevant concept is absent/wrong. Minor phrasing or grammar is not a misconception.

CRITICAL MARKING RULES:
1. Do not require extra details that are not demanded by the question or rubric.
2. Do not penalise grammar unless it changes the science.
3. Do not penalise a pupil for explaining from Plant B then Plant A, or vice versa, if the causal relationship is correct.
4. If the pupil states the exact result asked in the question (for example, 'Plant B could not make food while Plant A could'), L/R is met.
5. If all required components are met and the science is correct, the answer must be treated as correct.
6. When marking a 'State' question, do not invent D/E, S/R or L/R requirements that the question does not ask for.

CALIBRATION EXAMPLE — THIS ANSWER IS CORRECT:
Question: Two identical green plants were given the same amount of water. Plant A was placed in light while Plant B was kept in darkness. Explain why Plant A could make food but Plant B could not.
Pupil answer: 'As Plant A was placed in light unlike Plant B, Plant B could not photosynthesise as light is needed for green plants to make food during photosynthesis. Thus, Plant B could not make food while Plant A could make food.'
Judge this as: conceptCorrect=true, deRequired=true, deMet=true, srRequired=true, srMet=true, lrRequired=true, lrMet=true.
Reason: the comparison is present, the science concept is correct, and the final outcome is explicitly linked back.

Keep feedback concise, encouraging and PSLE-appropriate. If the answer is fully correct, missing must be an empty string.`;

    const user = `TOPIC: ${topic}\n\nQUESTION:\n${question}\n\nPUPIL ANSWER:\n${pupilAnswer}\n\nVERBATIM CORE EXPLANATION:\n${verbatim}\n\nSCORING IDEAS:\n- ${rubric.join('\n- ')}\n\nMODEL APPLICATION ANSWER:\n${modelAnswer}`;

    try {
      const out = await runStructured(env, [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ], EVAL_SCHEMA, 650);

      const r = deriveRating(out);
      const verdict = r === 'correct' ? 'Correct' : (r === 'de' || r === 'lr' ? 'Almost there' : 'Needs correction');
      const missing = r === 'correct' ? '' : text(out.missing, 500);
      const feedback = r === 'correct'
        ? text(out.feedback || 'Your answer contains the required science and links back to the question.', 700)
        : text(out.feedback, 700);

      return reply(request, {
        rating: r,
        verdict,
        feedback,
        strengths: text(out.strengths, 500),
        missing,
        improvedAnswer: text(out.improvedAnswer, 1800),
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
