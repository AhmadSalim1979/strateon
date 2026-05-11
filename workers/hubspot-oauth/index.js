/**
 * Cloudflare Worker: qiyadon-hubspot-oauth
 * Proxies /hubspot/* requests to the OAuth server on port 3003 (via TLS proxy)
 * 
 * FIX v3: Call origin by private IP directly, NOT through Cloudflare proxy
 * This avoids the routing loop where the Worker calls itself.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const search = url.search;

    // Use hostname approach - Cloudflare Workers CAN make outbound fetch() to
    // public hostnames (not private IPs) via Cloudflare's outbound routing
    const targetUrl = `https://oauth.qiyadon.com${path}${search}`;

    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      const lk = key.toLowerCase();
      // Pass through most headers, skip Cloudflare-internal ones
      if (!lk.startsWith('cf-') && !lk.startsWith('x-forwarded') &&
          lk !== 'host' && lk !== 'connection' && lk !== 'content-length' &&
          lk !== 'if-none-match' && lk !== 'if-modified-since') {
        headers.set(key, value);
      }
    }
    // Set proper Host so the origin knows which site this is for
    headers.set('Host', 'oauth.qiyadon.com');
    headers.set('X-Forwarded-Proto', 'https');
    headers.set('X-Forwarded-For', request.headers.get('cf-connecting-ip') || '');
    headers.delete('CF-Connecting-IP');

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(request.method) ? request.text() : undefined,
        redirect: 'manual',
      });

      // Handle redirects from the OAuth server (e.g., 302 to HubSpot)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          const responseHeaders = new Headers();
          responseHeaders.set('Location', location);
          responseHeaders.set('Access-Control-Allow-Origin', 'https://qiyadon.com');
          responseHeaders.set('Cache-Control', 'no-store');
          return new Response(null, { status: response.status, headers: responseHeaders });
        }
      }

      // Pass through response headers (except Cloudflare-internal)
      const responseHeaders = new Headers();
      for (const [key, value] of response.headers.entries()) {
        const lk = key.toLowerCase();
        if (!lk.startsWith('cf-') && !['content-length', 'transfer-encoding',
            'x-frame-options', 'x-content-type-options'].includes(lk)) {
          responseHeaders.set(key, value);
        }
      }
      responseHeaders.set('Access-Control-Allow-Origin', 'https://qiyadon.com');
      responseHeaders.set('Cache-Control', 'no-store');

      const body = await response.text();
      return new Response(body, { status: response.status, headers: responseHeaders });

    } catch (e) {
      // Return a JSON error instead of HTML to distinguish from OAuth errors
      return new Response(JSON.stringify({ error: 'worker_fetch_failed', message: e.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://qiyadon.com' }
      });
    }
  }
};