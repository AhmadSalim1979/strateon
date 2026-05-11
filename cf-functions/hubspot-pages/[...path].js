export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const search = url.search;

  // Call the OAuth server directly by IP on port 3003
  const targetUrl = `http://5.9.81.5:3003${path}${search}`;

  const headers = new Headers();
  for (const [key, value] of context.request.headers.entries()) {
    const lk = key.toLowerCase();
    if (!lk.startsWith('cf-') && !lk.startsWith('x-forwarded') &&
        lk !== 'host' && lk !== 'connection' && lk !== 'content-length') {
      headers.set(key, value);
    }
  }
  headers.set('Host', 'oauth.qiyadon.com');
  headers.set('X-Forwarded-Proto', 'https');

  try {
    const response = await context.waitUntil(
      fetch(targetUrl, {
        method: context.request.method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(context.request.method) 
          ? context.request.text() 
          : undefined,
        redirect: 'manual',
      })
    );

    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      const lk = key.toLowerCase();
      if (!lk.startsWith('cf-') && !['content-length', 'transfer-encoding'].includes(lk)) {
        responseHeaders.set(key, value);
      }
    }
    responseHeaders.set('Access-Control-Allow-Origin', 'https://qiyadon.com');

    const body = await response.text();
    return new Response(body, { status: response.status, headers: responseHeaders });
  } catch (e) {
    return new Response('Proxy error: ' + e.message, { 
      status: 502, 
      headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': 'https://qiyadon.com' }
    });
  }
}
