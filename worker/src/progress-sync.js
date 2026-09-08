const ALLOWED_ORIGINS = new Set([
  'https://limkimsze-maker.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
]);

const ALLOWED_STUDENTS = new Set(['jerry', 'javis']);
const SCIENCE_KEY = 'psleScience180_book_master_v1';
const PROCESS_KEY = 'psleScience_process_skills_v1';
const ALLOWED_NAMESPACES = new Set([SCIENCE_KEY, PROCESS_KEY]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://limkimsze-maker.github.io';
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function uniqDates(a, b) {
  return [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])].sort();
}

function maxNum(a, b) {
  return Math.max(Number(a) || 0, Number(b) || 0);
}

function latestRecord(a = {}, b = {}) {
  const ta = Number(a?._syncUpdatedAt) || 0;
  const tb = Number(b?._syncUpdatedAt) || 0;
  if (ta > tb) return [a, b];
  if (tb > ta) return [b, a];
  return [b, a];
}

function mergeOverride(a, b) {
  const ta = Number(a?._syncUpdatedAt) || 0;
  const tb = Number(b?._syncUpdatedAt) || 0;
  if (ta !== tb) return ta > tb ? (a.override || 'auto') : (b.override || 'auto');
  const rank = { red: 3, green: 2, auto: 1 };
  const av = a?.override || 'auto';
  const bv = b?.override || 'auto';
  return (rank[av] || 0) >= (rank[bv] || 0) ? av : bv;
}

function mergeDiag(a, b) {
  const out = {};
  for (const k of ['de', 'sr', 'lr', 'concept']) out[k] = maxNum(a?.[k], b?.[k]);
  return out;
}

function mergeScienceRecord(a = {}, b = {}) {
  const [newer, older] = latestRecord(a, b);
  const out = { ...older, ...newer };
  out.phraseDates = uniqDates(a.phraseDates, b.phraseDates);
  out.appCorrectDates = uniqDates(a.appCorrectDates, b.appCorrectDates);
  out.legacyPhraseDates = uniqDates(a.legacyPhraseDates, b.legacyPhraseDates);
  out.phraseWrong = maxNum(a.phraseWrong, b.phraseWrong);
  out.appAttempts = maxNum(a.appAttempts, b.appAttempts);
  out.diag = mergeDiag(a.diag, b.diag);
  out.override = mergeOverride(a, b);
  out.guidedImprovedByQuestion = {
    ...(a.guidedImprovedByQuestion || {}),
    ...(b.guidedImprovedByQuestion || {})
  };
  out._syncUpdatedAt = Math.max(Number(a._syncUpdatedAt) || 0, Number(b._syncUpdatedAt) || 0);
  return out;
}

function mergeScienceState(a = {}, b = {}) {
  const out = {};
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const key of keys) out[key] = mergeScienceRecord(a?.[key] || {}, b?.[key] || {});
  return out;
}

function mergeProcessItem(a = {}, b = {}) {
  const [newer, older] = latestRecord(a, b);
  const out = { ...older, ...newer };
  out.recallDates = uniqDates(a.recallDates, b.recallDates);
  out.appDates = uniqDates(a.appDates, b.appDates);
  const rank = { red: 3, green: 2, auto: 1 };
  if ((Number(a._syncUpdatedAt) || 0) === (Number(b._syncUpdatedAt) || 0)) {
    const av = a.priority || 'auto', bv = b.priority || 'auto';
    out.priority = (rank[av] || 0) >= (rank[bv] || 0) ? av : bv;
  }
  out._syncUpdatedAt = Math.max(Number(a._syncUpdatedAt) || 0, Number(b._syncUpdatedAt) || 0);
  return out;
}

function mergeProcessState(a = {}, b = {}) {
  const out = { ...a, ...b, items: {}, variant: { ...(a.variant || {}), ...(b.variant || {}) } };
  const ids = new Set([...Object.keys(a.items || {}), ...Object.keys(b.items || {})]);
  for (const id of ids) out.items[id] = mergeProcessItem(a.items?.[id] || {}, b.items?.[id] || {});
  return out;
}

function mergeNamespace(namespace, remote, local) {
  if (namespace === SCIENCE_KEY) return mergeScienceState(remote || {}, local || {});
  if (namespace === PROCESS_KEY) return mergeProcessState(remote || {}, local || {});
  return local || remote || {};
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(String(text));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}

export async function handleProgressSync(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/progress/sync') return null;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405);
  if (!env.PROGRESS_DB) return json(request, { error: 'Progress database is not configured yet.' }, 503);

  let body;
  try { body = await request.json(); }
  catch (_err) { return json(request, { error: 'Invalid JSON body.' }, 400); }

  const student = String(body?.student || '').toLowerCase();
  const syncCode = String(body?.syncCode || '');
  const states = body?.states && typeof body.states === 'object' ? body.states : {};
  if (!ALLOWED_STUDENTS.has(student)) return json(request, { error: 'Unknown student profile.' }, 400);
  if (syncCode.length < 16 || syncCode.length > 200) return json(request, { error: 'Sync code must be at least 16 characters.' }, 400);

  const syncHash = await sha256(syncCode);
  const mergedStates = {};
  const now = Date.now();

  for (const [namespace, localState] of Object.entries(states)) {
    if (!ALLOWED_NAMESPACES.has(namespace)) continue;
    const row = await env.PROGRESS_DB.prepare(
      'SELECT state_json FROM progress_snapshots WHERE sync_hash = ?1 AND student = ?2 AND namespace = ?3'
    ).bind(syncHash, student, namespace).first();

    let remoteState = {};
    if (row?.state_json) {
      try { remoteState = JSON.parse(row.state_json); } catch (_err) { remoteState = {}; }
    }

    const merged = mergeNamespace(namespace, remoteState, localState || {});
    mergedStates[namespace] = merged;

    await env.PROGRESS_DB.prepare(
      `INSERT INTO progress_snapshots (sync_hash, student, namespace, state_json, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(sync_hash, student, namespace)
       DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at`
    ).bind(syncHash, student, namespace, JSON.stringify(merged), now).run();
  }

  return json(request, { ok: true, student, states: mergedStates, syncedAt: now });
}
