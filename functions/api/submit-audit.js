export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  const port = 3001;
  const forwardUrl = `http://localhost:${port}/submit-audit`;
  const body = await context.request.text();
  
  const headers = {};
  for (const [key, value] of context.request.headers.entries()) {
    if (!['host', 'cf-', 'x-forwarded'].some(p => key.toLowerCase().startsWith(p))) {
      headers[key] = value;
    }
  }
  headers['Content-Type'] = 'application/json';
  
  try {
    const response = await fetch(forwardUrl, {
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
