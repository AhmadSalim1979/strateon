export async function onRequest({ request }) {
  try {
    // Test: can we fetch an external HTTPS URL from a Cloudflare Pages Function?
    const resp = await fetch('https://example.com/', {
      method: 'GET',
    });
    const text = await resp.text();
    return new Response(JSON.stringify({
      test: 'outbound-https-fetch',
      status: resp.status,
      bodyLength: text.length,
      ok: resp.ok
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({
      test: 'outbound-https-fetch',
      error: err.message
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
