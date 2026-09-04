const ALLOWED_ORIGINS = new Set([
  'https://limkimsze-maker.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://limkimsze-maker.github.io';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Cache-Control': 'no-store'
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...corsHeaders(request) }
  });
}

function cleanString(value, max = 3000) {
  return String(value ?? '').trim().slice(0, max);
}

function extractJson(text) {
  let s = String(text ?? '').trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(s); } catch (_) {}
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) return JSON.parse(s.slice(first, last + 1));
  throw new Error('Model did not return valid JSON.');
}

function normalizeRating(value) {
  const v = String(value || '').toLowerCase().trim();
  return ['correct', 'de', 'sr', 'lr', 'concept'].includes(v) ? v : 'concept';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (url.pathname === '/health') return json(request, { ok: true, service: 'PSLE Science AI Marker' });
    if (url.pathname !== '/mark' || request.method !== 'POST') return json(request, { error: 'Not found' }, 404);

    const origin = request.headers.get('Origin') || '';
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json(request, { error: 'Origin not allowed' }, 403);

    let body;
    try { body = await request.json(); } catch (_) { return json(request, { error: 'Invalid JSON body' }, 400); }

    const topic = cleanString(body.topic, 160);
    const question = cleanString(body.question, 2500);
    const answer = cleanString(body.answer, 2500);
    const verbatim = cleanString(body.verbatim, 2500);
    const modelAnswer = cleanString(body.modelAnswer, 3000);
    const rubric = Array.isArray(body.rubric) ? body.rubric.map(x => cleanString(x, 400)).filter(Boolean).slice(0, 8) : [];

    if (!question || !answer || !verbatim || rubric.length === 0) {
      return json(request, { error: 'Missing question, answer, verbatim explanation or rubric.' }, 400);
    }

    const system = `You are a strict but fair Singapore PSLE Science open-ended answer marker for a Primary 6 pupil.

Mark ONLY from the supplied question, scoring ideas, verbatim core explanation and model application answer. Do not introduce unrelated science.

Application answers DO NOT need to match the verbatim wording. Accept scientifically equivalent wording when the essential concept and cause-and-effect links are correct.

Classify the pupil's main issue using exactly ONE rating:
- correct = all essential scientific ideas/links needed by the question are present and there is no scientific contradiction.
- de = D/E (Data/Evidence) missing: the answer omits a required observation, comparison, changed condition or evidence from the question.
- sr = S/R (Science/Reasoning) missing or wrong: the scientific mechanism or causal explanation is missing, vague or incorrect.
- lr = L/R (Link/Result) missing: the science is mostly correct but the answer does not link back to the result/outcome asked.
- concept = the pupil shows a fundamental misconception or does not know the relevant concept.

Be PSLE-appropriate and concise. Do not penalise grammar unless it changes the science. Do not demand extra details beyond what the rubric/question requires. If the pupil gives a correct shorter answer that fully satisfies the rubric, mark it correct.

Return JSON ONLY, with this exact shape:
{
  "rating": "correct|de|sr|lr|concept",
  "verdict": "Correct|Almost there|Needs correction",
  "feedback": "One concise explanation of why the answer got this rating.",
  "strengths": "What the pupil did correctly, or an empty string.",
  "missing": "The most important missing/wrong scientific link, or an empty string.",
  "improvedAnswer": "A concise PSLE-style improved answer of 1-3 sentences."
}`;

    const user = `TOPIC: ${topic}\n\nQUESTION:\n${question}\n\nPUPIL ANSWER:\n${answer}\n\nVERBATIM CORE EXPLANATION:\n${verbatim}\n\nSCORING IDEAS:\n- ${rubric.join('\n- ')}\n\nMODEL APPLICATION ANSWER:\n${modelAnswer}`;

    try {
      const result = await env.AI.run('@cf/zai-org/glm-4.7-flash', {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.1,
        max_tokens: 650
      });
      const parsed = extractJson(result?.response ?? result);
      const rating = normalizeRating(parsed.rating);
      const verdict = rating === 'correct' ? 'Correct' : (rating === 'concept' || rating === 'sr' ? 'Needs correction' : 'Almost there');
      return json(request, {
        rating,
        verdict: cleanString(parsed.verdict || verdict, 80),
        feedback: cleanString(parsed.feedback, 700),
        strengths: cleanString(parsed.strengths, 500),
        missing: cleanString(parsed.missing, 500),
        improvedAnswer: cleanString(parsed.improvedAnswer, 1800)
      });
    } catch (err) {
      console.error(err);
      return json(request, { error: 'AI marking is temporarily unavailable. Please try again.' }, 502);
    }
  }
};
