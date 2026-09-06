import base from './speech-and-process.js';

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
