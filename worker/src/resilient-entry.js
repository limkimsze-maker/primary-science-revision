import base from './speech-and-process.js';
import { handleProgressSync } from './progress-sync.js';
import { handleAuth } from './auth.js';

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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
        return new Response(JSON.stringify({ ...data, resilientMarker: true, markerRetries: 3 }), {
          status: response.status,
          headers: response.headers
        });
      } catch (_err) {
        return response;
      }
    }

    // Only retry the Science answer marker. Other endpoints keep their existing behaviour.
    if (url.pathname !== '/mark' || request.method !== 'POST') {
      return base.fetch(request, env);
    }

    let lastResponse;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await base.fetch(request.clone(), env);
        lastResponse = response;
        if (!RETRYABLE.has(response.status)) return response;
      } catch (err) {
        if (attempt === 2) throw err;
      }
      if (attempt < 2) await sleep(250 * (attempt + 1));
    }

    return lastResponse || new Response(JSON.stringify({
      error: 'AI marking is temporarily unavailable. Please try again.'
    }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
};
