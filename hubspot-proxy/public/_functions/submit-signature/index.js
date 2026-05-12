export async function onRequest({ request }) {
  const url = new URL(request.url);
  
  if (request.method !== 'POST' || !url.pathname.endsWith('/submit-signature')) {
    return new Response('Not found', { status: 404 });
  }
  
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
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}