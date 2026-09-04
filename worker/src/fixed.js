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

function rating(v) {
  v = String(v || '').toLowerCase().trim();
  return ['correct', 'de', 'sr', 'lr', 'concept'].includes(v) ? v : 'concept';
}

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    rating: { type: 'string', enum: ['correct', 'de', 'sr', 'lr', 'concept'] },
    verdict: { type: 'string' },
    feedback: { type: 'string' },
    strengths: { type: 'string' },
    missing: { type: 'string' },
    improvedAnswer: { type: 'string' }
  },
  required: ['rating', 'verdict', 'feedback', 'strengths', 'missing', 'improvedAnswer']
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(request) });
    }

    if (url.pathname === '/health') {
      return reply(request, { ok: true, service: 'PSLE Science AI Marker', model: 'llama-3.1-8b-instruct-fast-json' });
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
Mark only from the supplied question, scoring ideas, verbatim core explanation and model application answer.
Application answers do NOT need to match the verbatim wording. Accept scientifically equivalent wording when the essential concept and cause-and-effect links are correct.
Choose exactly one rating:
correct = all essential scientific ideas and links required by the question are present, with no scientific contradiction.
de = required Data/Evidence or comparison from the question is missing.
sr = Science/Reasoning mechanism or causal explanation is missing, vague or scientifically wrong.
lr = the science is mostly correct but the final Link/Result back to what was asked is missing.
concept = a fundamental misconception or the relevant concept is not known.
Do not penalise grammar unless it changes the science. Do not demand extra details beyond the rubric. A shorter answer that fully satisfies the rubric is correct.
Keep feedback concise and PSLE-appropriate.`;

    const user = `TOPIC: ${topic}\n\nQUESTION:\n${question}\n\nPUPIL ANSWER:\n${pupilAnswer}\n\nVERBATIM CORE EXPLANATION:\n${verbatim}\n\nSCORING IDEAS:\n- ${rubric.join('\n- ')}\n\nMODEL APPLICATION ANSWER:\n${modelAnswer}`;

    try {
      const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: OUTPUT_SCHEMA
        },
        temperature: 0.1,
        max_tokens: 500
      });

      let out = result?.response ?? result;
      if (typeof out === 'string') out = JSON.parse(out);
      if (!out || typeof out !== 'object') throw new Error('Invalid structured response');

      const r = rating(out.rating);
      const defaultVerdict = r === 'correct' ? 'Correct' : (r === 'de' || r === 'lr' ? 'Almost there' : 'Needs correction');

      return reply(request, {
        rating: r,
        verdict: text(out.verdict || defaultVerdict, 80),
        feedback: text(out.feedback, 700),
        strengths: text(out.strengths, 500),
        missing: text(out.missing, 500),
        improvedAnswer: text(out.improvedAnswer, 1800)
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
