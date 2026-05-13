export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // Only handle POST
  if (request.method !== 'POST' || !url.pathname.endsWith('/submit-signature')) {
    return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.text();
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to read request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    const lk = key.toLowerCase();
    if (!lk.startsWith('cf-') && !lk.startsWith('x-forwarded') && lk !== 'host' && lk !== 'content-length' && lk !== 'connection') {
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
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}