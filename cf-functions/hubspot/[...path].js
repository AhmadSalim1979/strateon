/**
 * Cloudflare Pages Function — HubSpot OAuth Proxy
 * Handles: /hubspot/auth, /hubspot/callback, /hubspot/status, /hubspot/disconnect
 * Proxies all /hubspot/* requests to the local hub-oauth server on port 3003.
 */
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const path = url.pathname;
  const targetPath = path.replace(/^\/hubspot/, ''); // Remove /hubspot prefix

  const targetUrl = `http://5.9.81.5:3003${path}${url.search}`;

  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    const lk = key.toLowerCase();
    if (!lk.startsWith('cf-') && !lk.startsWith('x-forwarded') && lk !== 'host' && lk !== 'connection') {
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
    return new Response(body, { status: response.status, headers: responseHeaders });
  } catch (e) {
    return new Response('OAuth proxy error: ' + e.message, { status: 502 });
  }
}
