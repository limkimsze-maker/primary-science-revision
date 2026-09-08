import base from './speech-and-process.js';
import { handleProgressSync } from './progress-sync.js';
import { handleAuth } from './auth.js';

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const FALLBACK_SCHEMA = {
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

function text(v, max = 2400) {
  return String(v ?? '').trim().slice(0, max);
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = new Set([
    'https://limkimsze-maker.github.io',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
  ]);
  return {
    'content-type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': allowed.has(origin) ? origin : 'https://limkimsze-maker.github.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Cache-Control': 'no-store'
  };
}

function deriveRating(out) {
  if (out.conceptCorrect !== true) return 'concept';
  if (out.deRequired && !out.deMet) return 'de';
  if (out.srRequired && !out.srMet) return 'sr';
  if (out.lrRequired && !out.lrMet) return 'lr';
  return 'correct';
}

async function fallbackMark(request, env) {
  const body = await request.clone().json();
  const question = text(body.question, 2500);
  const answer = text(body.answer, 2500);
  const verbatim = text(body.verbatim, 2500);
  const modelAnswer = text(body.modelAnswer, 3000);
  const topic = text(body.topic, 180);
  const rubric = Array.isArray(body.rubric) ? body.rubric.map(x => text(x, 450)).filter(Boolean).slice(0, 12) : [];
  if (!question || !answer || !verbatim || !rubric.length) return null;

  const system = `You are a strict but fair Singapore Primary 6 PSLE Science marker used only as a backup when the main marker is unavailable.

MARKING RULES:
- Obey the command word first.
- Accept scientifically equivalent wording. Do not penalise minor grammar, punctuation, connectors or sentence order unless meaning changes.
- Do not force one exact sentence template.
- For Explain/Why/Give a reason, require the scientific causal idea. Require Data/Evidence only when the question actually supplies or asks for evidence/data/results/setup/comparison. Require the final Link/Result only when it is still needed to answer the exact outcome asked.
- A concise answer can be fully correct when it contains all mark-bearing Science ideas.
- For State/Name/Identify/What, do not demand an explanation unless asked.
- For Compare, make sure the comparison is explicit. For experiments, distinguish fair test, reliability and accuracy.
- Treat the supplied GOLD-STANDARD VERBATIM and RUBRIC as the content authority. The older model answer is supporting context only.
- conceptCorrect=false only for a genuine misconception or missing/wrong core Science.
- improvedAnswer must be short, PSLE-appropriate and answer the same question.
- Return only the requested JSON fields.`;

  const user = `TOPIC: ${topic}\n\nQUESTION:\n${question}\n\nPUPIL ANSWER:\n${answer}\n\nGOLD-STANDARD VERBATIM:\n${verbatim}\n\nGOLD-STANDARD RUBRIC:\n- ${rubric.join('\n- ')}\n\nOLDER MODEL ANSWER:\n${modelAnswer}`;

  const result = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    response_format: { type: 'json_schema', json_schema: FALLBACK_SCHEMA },
    temperature: 0,
    max_tokens: 900
  });
  let out = result?.response ?? result;
  if (typeof out === 'string') out = JSON.parse(out);
  if (!out || typeof out !== 'object') throw new Error('Fallback marker returned an invalid response.');

  const r = deriveRating(out);
  return new Response(JSON.stringify({
    rating: r,
    verdict: r === 'correct' ? 'Correct' : (r === 'de' || r === 'lr' ? 'Almost there' : 'Needs correction'),
    feedback: text(out.feedback, 700),
    strengths: text(out.strengths, 500),
    missing: r === 'correct' ? '' : text(out.missing, 500),
    improvedAnswer: text(out.improvedAnswer, 2400),
    criteria: {
      conceptCorrect: out.conceptCorrect === true,
      deRequired: out.deRequired === true,
      deMet: out.deMet === true,
      srRequired: out.srRequired === true,
      srMet: out.srMet === true,
      lrRequired: out.lrRequired === true,
      lrMet: out.lrMet === true
    },
    fallbackModel: true
  }), { status: 200, headers: corsHeaders(request) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/auth/')) {
      const authResponse = await handleAuth(request, env);
      if (authResponse) return authResponse;
    }

    if (url.pathname === '/progress/sync') {
      const progressResponse = await handleProgressSync(request, env);
      if (progressResponse) return progressResponse;
    }

    if (url.pathname === '/health') {
      const response = await base.fetch(request, env);
      try {
        const data = await response.clone().json();
        return new Response(JSON.stringify({ ...data, resilientMarker: true, markerRetries: 2, fallbackModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' }), {
          status: response.status,
          headers: response.headers
        });
      } catch (_err) {
        return response;
      }
    }

    // Only add resilience to the Science answer marker. Other endpoints keep their existing behaviour.
    if (url.pathname !== '/mark' || request.method !== 'POST') {
      return base.fetch(request, env);
    }

    let lastResponse;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await base.fetch(request.clone(), env);
        lastResponse = response;
        if (!RETRYABLE.has(response.status)) return response;
      } catch (_err) {
        // Try the main marker once more, then use the independent backup model.
      }
      if (attempt === 0) await sleep(250);
    }

    try {
      const fallback = await fallbackMark(request.clone(), env);
      if (fallback) return fallback;
    } catch (_err) {
      // Preserve the main marker's diagnostic response if the backup model also fails.
    }

    if (lastResponse) return lastResponse;
    return new Response(JSON.stringify({
      error: 'AI marking is temporarily unavailable. Please try again.'
    }), {
      status: 502,
      headers: corsHeaders(request)
    });
  }
};
