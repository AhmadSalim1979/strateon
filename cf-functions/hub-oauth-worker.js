/**
 * Cloudflare Worker — HubSpot OAuth Proxy
 * 
 * Proxies /hubspot/* requests from qiyadon.com to the local OAuth server on port 3003.
 * This is a Cloudflare Worker, NOT a Node.js HTTP server.
 * 
 * Routes:
 *   qiyadon.com/hubspot/auth       → HubSpot OAuth authorize URL (redirect)
 *   qiyadon.com/hubspot/callback   → OAuth token exchange callback
 *   qiyadon.com/hubspot/status     → Check connection status
 *   qiyadon.com/hubspot/disconnect → Revoke and disconnect
 */

const OAUTH_SERVER = 'http://5.9.81.5:3001';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Only handle /hubspot/* routes
    if (!path.startsWith('/hubspot')) {
      // Handle /submit-signature → proxy to port 3001
      if (path === '/submit-signature' && request.method === 'POST') {
        const body = await request.text();
        const headers = {};
        for (const [key, value] of request.headers.entries()) {
          const lk = key.toLowerCase();
          if (!lk.startsWith('cf-') && !lk.startsWith('x-forwarded') && lk !== 'host' && lk !== 'connection' && lk !== 'content-length') {
            headers[key] = value;
          }
        }
        headers['Content-Type'] = 'application/json';
        try {
          const response = await fetch('http://5.9.81.5:3001/submit-signature', {
            method: 'POST',
            headers,
            body
          });
          const data = await response.text();
          return new Response(data, {
            status: response.status,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://qiyadon.com' }
          });
        } catch (e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      return fetch(request); // Pass through to static site
    }

    const targetPath = path;
    const targetUrl = `${OAUTH_SERVER}${path}${url.search}`;

    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      const lk = key.toLowerCase();
      if (!lk.startsWith('cf-') && !lk.startsWith('x-forwarded') && lk !== 'host' && lk !== 'connection' && lk !== 'content-length') {
        headers.set(key, value);
      }
    }
    // Override Host to match OAuth server expectation
    headers.set('Host', 'qiyadon.com');

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(request.method) ? request.text() : undefined,
        redirect: 'manual',
      });

      const responseHeaders = new Headers();
      for (const [key, value] of response.headers.entries()) {
        const lk = key.toLowerCase();
        if (!lk.startsWith('cf-') && !['content-length', 'transfer-encoding', 'x-frame-options'].includes(lk)) {
          responseHeaders.set(key, value);
        }
      }
      responseHeaders.set('Access-Control-Allow-Origin', 'https://qiyadon.com');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Handle redirect responses from OAuth server
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          responseHeaders.set('Location', location);
          return new Response(null, { status: response.status, headers: responseHeaders });
        }
      }

      const body = await response.text();
      return new Response(body, { status: response.status, headers: responseHeaders });

    } catch (e) {
      return new Response('OAuth proxy error: ' + e.message, { status: 502 });
    }
  }
};
