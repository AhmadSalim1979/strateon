/**
 * Cloudflare Pages Function — HubSpot exact route handler
 * Handles: /hubspot
 * (/_functions/hubspot/index.js handles /hubspot/*)
 */
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Route /hubspot/* to the OAuth server
  const targetPath = path.replace(/^\/hubspot/, '') || '/auth';
  const targetUrl = `http://5.9.81.5:3003/hubspot${targetPath}${url.search}`;

  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    const lk = key.toLowerCase();
    if (!lk.startsWith('cf-') && !lk.startsWith('x-forwarded') && lk !== 'host' && lk !== 'connection' && lk !== 'content-length') {
      headers[key] = value;
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ['POST', 'PUT', 'PATCH'].includes(request.method) ? request.text() : undefined,
      redirect: 'manual',
    });

    const body = await response.text();
    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      const lk = key.toLowerCase();
      if (!lk.startsWith('cf-') && !['content-length', 'transfer-encoding'].includes(lk)) {
        responseHeaders.set(key, value);
      }
    }
    responseHeaders.set('Access-Control-Allow-Origin', 'https://qiyadon.com');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle 302 redirects with HTML meta-refresh (CDN-compatible)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${location}"><title>Redirecting...</title></head><body><p>Redirecting to authorization...</p></body></html>`;
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Location': location,
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': 'https://qiyadon.com',
          }
        });
      }
    }

    return new Response(body, { status: response.status, headers: responseHeaders });
  } catch (e) {
    return new Response('OAuth proxy error: ' + e.message, { status: 502 });
  }
}
