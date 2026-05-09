export async function onRequest({ request }) {
  return new Response(JSON.stringify({ ok: true, path: new URL(request.url).pathname }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
