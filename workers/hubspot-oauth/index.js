export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    // Use https://oauth.qiyadon.com as the upstream
    const targetUrl = `https://oauth.qiyadon.com${path}${url.search}`;
    
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      const lk = key.toLowerCase();
      if (!lk.startsWith('cf-') && !lk.startsWith('x-forwarded') && lk !== 'host' && lk !== 'connection' && lk !== 'content-length') {
        headers.set(key, value);
      }
    }
    headers.set('Host', 'oauth.qiyadon.com');
    headers.set('X-Forwarded-Proto', 'https');

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
