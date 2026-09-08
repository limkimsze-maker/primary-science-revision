const ALLOWED_ORIGINS = new Set([
  'https://limkimsze-maker.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
]);

const ALLOWED_STUDENTS = new Set(['jerry', 'javis']);
const SESSION_DAYS = 30;

export function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://limkimsze-maker.github.io';
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}

export function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(String(text));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map(x => x.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  a = String(a || '');
  b = String(b || '');
  const n = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

function configuredPassword(student, env) {
  if (student === 'jerry') return String(env.JERRY_PASSWORD || '');
  if (student === 'javis') return String(env.JAVIS_PASSWORD || '');
  return '';
}

function bearerToken(request) {
  const h = request.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

export async function verifySession(request, env) {
  if (!env.PROGRESS_DB) return null;
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = Date.now();
  const row = await env.PROGRESS_DB.prepare(
    'SELECT student, expires_at FROM sessions WHERE token_hash = ?1'
  ).bind(tokenHash).first();
  if (!row) return null;
  if ((Number(row.expires_at) || 0) <= now) {
    await env.PROGRESS_DB.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(tokenHash).run();
    return null;
  }
  return { student: String(row.student), tokenHash, expiresAt: Number(row.expires_at) || 0 };
}

export async function handleAuth(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/auth/')) return null;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (!env.PROGRESS_DB) return json(request, { error: 'Progress database is not configured yet.' }, 503);

  if (url.pathname === '/auth/login') {
    if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405);
    let body;
    try { body = await request.json(); }
    catch (_err) { return json(request, { error: 'Invalid JSON body.' }, 400); }

    const student = String(body?.student || '').toLowerCase();
    const password = String(body?.password || '');
    if (!ALLOWED_STUDENTS.has(student)) return json(request, { error: 'Unknown student profile.' }, 400);
    const expected = configuredPassword(student, env);
    if (!expected) return json(request, { error: `Password for ${student} has not been configured in Cloudflare yet.` }, 503);
    if (!safeEqual(password, expected)) return json(request, { error: 'Incorrect password.' }, 401);

    const token = randomToken();
    const tokenHash = await sha256(token);
    const createdAt = Date.now();
    const expiresAt = createdAt + SESSION_DAYS * 24 * 60 * 60 * 1000;
    await env.PROGRESS_DB.prepare(
      `INSERT INTO sessions (token_hash, student, created_at, expires_at)
       VALUES (?1, ?2, ?3, ?4)`
    ).bind(tokenHash, student, createdAt, expiresAt).run();

    // Remove expired sessions opportunistically so the table stays tiny.
    await env.PROGRESS_DB.prepare('DELETE FROM sessions WHERE expires_at <= ?1').bind(createdAt).run();
    return json(request, { ok: true, student, token, expiresAt });
  }

  if (url.pathname === '/auth/session') {
    if (request.method !== 'GET') return json(request, { error: 'Method not allowed' }, 405);
    const session = await verifySession(request, env);
    if (!session) return json(request, { ok: false, error: 'Not signed in.' }, 401);
    return json(request, { ok: true, student: session.student, expiresAt: session.expiresAt });
  }

  if (url.pathname === '/auth/logout') {
    if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405);
    const session = await verifySession(request, env);
    if (!session) return json(request, { ok: true });
    await env.PROGRESS_DB.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(session.tokenHash).run();
    return json(request, { ok: true });
  }

  return json(request, { error: 'Unknown auth endpoint.' }, 404);
}
