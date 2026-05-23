/**
 * submit-signature-worker.js
 * Cloudflare Worker — handles POST /submit-signature on api.qiyadon.com
 * Proxies to local server on port 3001
 */

const BACKEND = 'http://5.9.81.5:3001';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname !== '/submit-signature' || request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const headers = {};
    for (const [key, value] of request.headers.entries()) {
      const lk = key.toLowerCase();
      if (!lk.startsWith('cf-') && !lk.startsWith('x-forwarded') &&
          lk !== 'host' && lk !== 'content-length' && lk !== 'connection') {
        headers[key] = value;
      }
    }
    headers['Content-Type'] = 'application/json';

    try {
      const body = await request.text();
      const response = await fetch(`${BACKEND}/submit-signature`, {
        method: 'POST',
        headers,
        body
      });
      const data = await response.text();
      return new Response(data, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};