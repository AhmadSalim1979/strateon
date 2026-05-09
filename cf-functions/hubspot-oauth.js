/**
 * Cloudflare Pages Function — HubSpot OAuth Proxy
 * Proxies /hubspot/* requests to the local hub-oauth server on port 3003.
 * 
 * Required because:
 * - hub-oauth runs on internal port 3003
 * - Cloudflare Pages serves qiyadon.com static site
 * - HubSpot redirect_uri is https://qiyadon.com/hubspot/callback
 * - This function proxies that traffic to the OAuth server
 */
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only proxy HubSpot OAuth endpoints
  if (!path.startsWith('/hubspot')) {
    return fetch(request);
  }

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
      redirect: 'manual', // Server handles redirects
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

    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (e) {
    return new Response('OAuth proxy error: ' + e.message, { status: 502 });
  }
}
