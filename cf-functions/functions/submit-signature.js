export async function onRequest({ request }) {
  const url = new URL(request.url);
  
  // Only handle POST to /submit-signature
  if (request.method !== 'POST' || !url.pathname.endsWith('/submit-signature')) {
    return new Response('Not found', { status: 404 });
  }
  
  const body = await request.text();
  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    const lk = key.toLowerCase();
    if (!lk.startsWith('cf-') && !lk.startsWith('x-forwarded') && lk !== 'host' && lk !== 'content-length' && lk !== 'connection') {
      headers[key] = value;
    }
  }
  headers['Content-Type'] = 'application/json';
  
  try {
    const response = await fetch('https://api.qiyadon.com/submit-signature', {
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
