import base from './process-hierarchy.js';

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

function text(v, max = 2500) {
  return String(v ?? '').trim().slice(0, max);
}

function norm(v) {
  return String(v ?? '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function words(v) {
  const n = norm(v);
  return n ? n.split(' ') : [];
}

function tokenEditDistance(a, b) {
  const A = words(a), B = words(b);
  const prev = Array.from({ length: B.length + 1 }, (_, i) => i);
  for (let i = 1; i <= A.length; i++) {
    const cur = [i];
    for (let j = 1; j <= B.length; j++) {
      cur[j] = Math.min(
        cur[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1)
      );
    }
    for (let j = 0; j < cur.length; j++) prev[j] = cur[j];
  }
  return prev[B.length];
}

const SPEECH_SCHEMA = {
  type: 'object',
  properties: {
    cleanedTranscript: { type: 'string' },
    changed: { type: 'boolean' },
    changes: { type: 'array', items: { type: 'string' } },
    note: { type: 'string' }
  },
  required: ['cleanedTranscript', 'changed', 'changes', 'note']
};

async function runStructured(env, messages, schema, maxTokens = 450) {
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

const SPEECH_CLEANUP_SYSTEM = `You are a CONSERVATIVE speech-to-text correction layer for a Singapore Primary 6 Science practice app.

Your job is NOT to answer the Science question and NOT to improve the pupil's reasoning. Preserve what the pupil actually said as closely as possible.

You may correct only highly likely automatic-speech-recognition (ASR) mistakes, for example:
- homophones or function-word confusions such as "an" versus "and", "to" versus "two", "is" versus "its" when context makes the intended spoken word clear;
- word-boundary errors such as "photo synthesis" -> "photosynthesis";
- a Science term that was very likely misheard phonetically, such as "mineral sauce" -> "mineral salts" or "route hair" -> "root hair", when the supplied question/topic supports that reading;
- choosing a better transcript from the supplied browser alternatives when it clearly fits the sentence context.

STRICT SAFETY RULES:
1. NEVER add a missing Science idea, fact, causal link, conclusion, subject or object.
2. NEVER remove or repair a scientifically wrong idea merely because you know the correct answer.
3. NEVER rewrite for style, fluency, grammar or PSLE quality unless the change is needed to fix an obvious ASR error.
4. For APPLICATION mode, use only the pupil's transcript, the question and topic. There is deliberately NO model answer.
5. For RECALL mode, a target sentence may be supplied only as a vocabulary/context reference. Do NOT fill in words that the transcript omitted and do NOT force the transcript to match the target.
6. If uncertain whether the pupil actually said the corrected word, KEEP THE RAW WORDING.
7. Punctuation and capitalisation do not matter.

Return a cleaned transcript that is as close as possible to the raw speech. Each item in "changes" should be short, e.g. "an -> and". If no safe correction is needed, return the raw transcript unchanged, changed=false, and an empty changes array.`;

function parseSpeechBody(body) {
  const contextType = text(body.contextType, 60);
  const isRecall = /recall/i.test(contextType);
  return {
    rawTranscript: text(body.rawTranscript, 2200),
    alternatives: Array.isArray(body.alternatives)
      ? body.alternatives.map(x => text(x, 2200)).filter(Boolean).slice(0, 3)
      : [],
    contextType,
    question: text(body.question, 1800),
    topic: text(body.topic, 300),
    targetSentence: isRecall ? text(body.targetSentence, 2200) : ''
  };
}

function mechanicallySafe(raw, cleaned, alternatives) {
  const rawWords = words(raw), cleanWords = words(cleaned);
  if (!rawWords.length || !cleanWords.length) return { ok: false, reason: 'empty transcript' };
  if (norm(raw) === norm(cleaned)) return { ok: true, identical: true, distance: 0 };

  // If the AI selected one of the browser's own alternatives, that is especially safe.
  const altMatch = (alternatives || []).some(a => norm(a) && norm(a) === norm(cleaned));
  const distance = tokenEditDistance(raw, cleaned);
  const maxDistance = Math.min(6, Math.max(2, Math.ceil(rawWords.length * 0.18)));
  const maxWordDelta = Math.max(1, Math.ceil(rawWords.length * 0.08));
  const wordDelta = Math.abs(cleanWords.length - rawWords.length);
  const charRatio = cleaned.length / Math.max(1, raw.length);

  if (altMatch && charRatio >= 0.70 && charRatio <= 1.35) {
    return { ok: true, fromAlternative: true, distance };
  }
  if (wordDelta > maxWordDelta) return { ok: false, reason: 'too many words added or removed', distance };
  if (distance > maxDistance) return { ok: false, reason: 'too much wording changed', distance };
  if (charRatio < 0.72 || charRatio > 1.30) return { ok: false, reason: 'transcript length changed too much', distance };
  return { ok: true, distance };
}

async function cleanSpeech(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (origin && !ALLOWED_ORIGINS.has(origin)) return reply(request, { error: 'Origin not allowed' }, 403);
  if (request.method !== 'POST') return reply(request, { error: 'Method not allowed' }, 405);

  let body;
  try { body = await request.json(); }
  catch { return reply(request, { error: 'Invalid JSON body' }, 400); }

  const data = parseSpeechBody(body);
  if (!data.rawTranscript) return reply(request, { error: 'Missing raw transcript' }, 400);

  const user = `MODE: ${data.contextType || 'unspecified'}\nTOPIC / CATEGORY:\n${data.topic || '(not supplied)'}\n\nQUESTION / PROMPT CONTEXT:\n${data.question || '(not supplied)'}\n\nPRIMARY BROWSER TRANSCRIPT:\n${data.rawTranscript}\n\nOTHER BROWSER TRANSCRIPT ALTERNATIVES:\n${data.alternatives.length ? data.alternatives.map((x, i) => `${i + 1}. ${x}`).join('\n') : '(none)'}\n\nTARGET SENTENCE FOR RECALL CONTEXT ONLY:\n${data.targetSentence || '(not supplied — do not infer an answer)'}`;

  try {
    const out = await runStructured(env, [
      { role: 'system', content: SPEECH_CLEANUP_SYSTEM },
      { role: 'user', content: user }
    ], SPEECH_SCHEMA, 500);

    const candidate = text(out.cleanedTranscript, 2200) || data.rawTranscript;
    const safety = mechanicallySafe(data.rawTranscript, candidate, data.alternatives);
    if (!safety.ok) {
      return reply(request, {
        cleanedTranscript: data.rawTranscript,
        changed: false,
        changes: [],
        applied: false,
        safetyFallback: true,
        note: `AI suggestion was rejected by the conservative safety check: ${safety.reason}. Raw transcript kept.`
      });
    }

    const changed = norm(candidate) !== norm(data.rawTranscript);
    return reply(request, {
      cleanedTranscript: changed ? candidate : data.rawTranscript,
      changed,
      changes: changed && Array.isArray(out.changes) ? out.changes.map(x => text(x, 120)).filter(Boolean).slice(0, 6) : [],
      applied: changed,
      safetyFallback: false,
      selectedBrowserAlternative: safety.fromAlternative === true,
      note: text(out.note, 300) || (changed ? 'Likely speech-recognition error corrected.' : 'No safe correction needed.')
    });
  } catch (err) {
    return reply(request, {
      error: 'Speech clean-up AI is temporarily unavailable.',
      diagnostic: text(err?.message || err, 250)
    }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/clean-speech') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
      return cleanSpeech(request, env);
    }
    return base.fetch(request, env);
  }
};
