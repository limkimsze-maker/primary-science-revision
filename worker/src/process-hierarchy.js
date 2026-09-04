import base from './calibrated.js';

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

function norm(v) {
  return String(v ?? '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function parseRequiredConcepts(v) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 10).map(g => ({
    label: text(g?.label, 180),
    any: Array.isArray(g?.any) ? g.any.map(x => text(x, 160)).filter(Boolean).slice(0, 12) : []
  })).filter(g => g.label && g.any.length);
}

function checkRequiredConcepts(answer, groups) {
  const a = norm(answer);
  const missing = [];
  for (const g of groups) {
    const ok = g.any.some(p => a.includes(norm(p)));
    if (!ok) missing.push(g.label);
  }
  return { ok: missing.length === 0, missing };
}

function parseBody(body) {
  return {
    skillId: Number(body.skillId || 0),
    topic: text(body.topic, 180),
    question: text(body.question, 2500),
    answer: text(body.answer, 2500),
    bookRule: text(body.bookRule, 2500),
    modelAnswer: text(body.modelAnswer, 3000),
    rubric: Array.isArray(body.rubric) ? body.rubric.map(x => text(x, 500)).filter(Boolean).slice(0, 12) : [],
    psleCalibration: text(body.psleCalibration, 2500),
    requiredConcepts: parseRequiredConcepts(body.requiredConcepts)
  };
}

const PROCESS_SCHEMA = {
  type: 'object',
  properties: {
    rubricSatisfied: { type: 'boolean' },
    bookAligned: { type: 'boolean' },
    psleAcceptable: { type: 'boolean' },
    correct: { type: 'boolean' },
    strengths: { type: 'string' },
    missing: { type: 'string' },
    feedback: { type: 'string' },
    improvedAnswer: { type: 'string' }
  },
  required: ['rubricSatisfied','bookAligned','psleAcceptable','correct','strengths','missing','feedback','improvedAnswer']
};

async function runStructured(env, messages, schema, maxTokens = 750) {
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

const PROCESS_MARKING_SYSTEM = `You are marking a Singapore Primary 6 PSLE Science PROCESS-SKILL answer.

Use this hierarchy strictly, in this exact order:

1. PSLE / PROCESS-SKILL RUBRIC — DECISIVE
   - First check the supplied scoring ideas against the pupil's actual answer.
   - If every required idea for THIS question is present and correct, rubricSatisfied=true.
   - For an APPLICATION question, merely stating a generic memorised process-skill rule is not enough if the question asks the pupil to apply that rule to named variables, apparatus, data or an experimental context.
   - The answer must address the actual variables/context named in THIS question when those are part of the scoring ideas.
   - Do not add an unstated requirement merely because a fuller model answer contains it.
   - Do not require technical labels such as "changed variable", "measured variable" or "controlled variable" when the pupil has expressed the same relationship clearly in ordinary words, unless the question specifically asks for those labels.
   - Do not penalise extra correct information.

2. BOOK BENCHMARK — CONTENT AUTHORITY
   - Use the supplied book-backed rule to check the process-skill meaning.
   - The pupil does NOT need to reproduce the book rule word-for-word.
   - Equivalent concise wording is acceptable.
   - Do not make the book rule stricter than the question's own demand.

3. PSLE ANSWER-PATTERN CALIBRATION — ACCEPTANCE STANDARD
   - Accept concise, direct answers that would earn the intended mark in a Primary 6 paper.
   - Obey the command word.
   - Do not force D/E -> S/R -> L/R onto process-skill questions when the specific process-skill rubric is already satisfied.
   - Do not require repetition of information already explicit in the question unless needed for the scoring idea.
   - Grammar is not penalised unless it changes the meaning.

4. AI JUDGEMENT — LAST, NOT FIRST
   - correct=true only when the rubric is satisfied, the answer is compatible with the book benchmark, and it is acceptable by PSLE answer-pattern standards.
   - Your AI judgement may explain the mark but must not invent a new criterion after the first three levels are satisfied.

IMPORTANT FAIR-TEST CALIBRATION:
- Generic recall such as "A fair test changes only one variable while all other relevant variables are kept constant" shows knowledge of the rule but does NOT answer a question asking why a particular variable in a named experiment must be kept the same.
- For "Why must the type of plant be kept the same?" in an investigation of amount of light versus plant growth, this is sufficient for full credit:
  "The type of plant must be kept the same so that only the amount of light affects plant growth."
- The pupil does NOT have to separately say "measured variable = plant growth" when the answer already states that only the amount of light affects plant growth.
- "To make it a fair test" alone is insufficient because it does not identify the causal control.

RELIABILITY CALIBRATION:
- Repeat trials and use repeated results to improve reliability. Averaging is expected when appropriate to the measurement/data context, but do not demand an average for a question that only asks why repetition improves reliability unless the supplied rubric makes it required.

ACCURACY CALIBRATION:
- Accuracy and reliability are different. Accuracy concerns closeness to the actual value and suitable apparatus/procedure; reliability concerns consistency of repeated results.

Return "missing" as "None" when no required scoring idea is missing. The improved answer should be concise and PSLE-safe, not longer merely for style.`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname === '/mark-process') {
      return new Response(null, { status: 204, headers: cors(request) });
    }

    if (url.pathname !== '/mark-process') {
      return base.fetch(request, env);
    }

    if (request.method !== 'POST') return reply(request, { error: 'Method not allowed' }, 405);

    const origin = request.headers.get('Origin') || '';
    if (origin && !ALLOWED_ORIGINS.has(origin)) return reply(request, { error: 'Origin not allowed' }, 403);

    let body;
    try { body = await request.json(); }
    catch { return reply(request, { error: 'Invalid JSON body' }, 400); }

    const data = parseBody(body);
    if (!data.question || !data.answer || !data.bookRule || data.rubric.length === 0) {
      return reply(request, { error: 'Missing question, answer, book rule or rubric.' }, 400);
    }

    // Mechanical Level-1 gate. If the client supplies question-specific required concepts,
    // the AI is not allowed to overrule their absence. This prevents generic recall from being
    // mistaken for successful application.
    if (data.requiredConcepts.length) {
      const gate = checkRequiredConcepts(data.answer, data.requiredConcepts);
      if (!gate.ok) {
        return reply(request, {
          correct: false,
          verdict: 'Needs work',
          hierarchy: 'PSLE/process-skill rubric -> book benchmark -> PSLE answer-pattern calibration -> AI judgement',
          rubricSatisfied: false,
          bookAligned: true,
          psleAcceptable: false,
          mechanicalRubricGate: true,
          strengths: 'The pupil may know the general process-skill rule.',
          missing: gate.missing.join('; '),
          feedback: 'Apply the rule to the actual variables or context in this question. A generic process-skill definition alone is not enough for an application question.',
          improvedAnswer: data.modelAnswer
        });
      }
    }

    const user = `PROCESS SKILL ID: ${data.skillId}\nTOPIC: ${data.topic}\n\nQUESTION:\n${data.question}\n\nPUPIL ANSWER:\n${data.answer}\n\nLEVEL 1 — PSLE / PROCESS-SKILL RUBRIC (DECISIVE):\n- ${data.rubric.join('\n- ')}\n\nLEVEL 2 — BOOK-BACKED RULE:\n${data.bookRule}\n\nLEVEL 3 — PSLE ANSWER-PATTERN CALIBRATION:\n${data.psleCalibration || 'Accept concise Primary 6 wording that satisfies the scoring ideas; do not require exact model wording.'}\n\nREFERENCE MODEL ANSWER (illustrative, not an extra rubric):\n${data.modelAnswer}`;

    try {
      const out = await runStructured(env, [
        { role: 'system', content: PROCESS_MARKING_SYSTEM },
        { role: 'user', content: user }
      ], PROCESS_SCHEMA, 850);

      const correct = out.rubricSatisfied === true && out.bookAligned === true && out.psleAcceptable === true;
      return reply(request, {
        correct,
        verdict: correct ? 'Correct' : 'Needs work',
        hierarchy: 'PSLE/process-skill rubric -> book benchmark -> PSLE answer-pattern calibration -> AI judgement',
        rubricSatisfied: out.rubricSatisfied === true,
        bookAligned: out.bookAligned === true,
        psleAcceptable: out.psleAcceptable === true,
        strengths: text(out.strengths, 1200),
        missing: correct ? 'None' : text(out.missing, 1200),
        feedback: text(out.feedback, 1600),
        improvedAnswer: text(out.improvedAnswer, 2000)
      });
    } catch (err) {
      return reply(request, {
        error: 'Process-skill AI marker is temporarily unavailable. Please try again.',
        diagnostic: text(err?.message || err, 300)
      }, 502);
    }
  }
};
