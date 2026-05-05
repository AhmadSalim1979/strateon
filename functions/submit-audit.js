export function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname === '/submit-audit' && context.request.method === 'POST') {
    return new Response('submit-audit POST received', { status: 200 });
  }
  return new Response('submit-audit function', { status: 200 });
}
