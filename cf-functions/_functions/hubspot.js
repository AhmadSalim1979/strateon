export async function onRequest({ request }) {
  const url = new URL(request.url);
  const targetUrl = `http://5.9.81.5:3003/hubspot${url.pathname === '/hubspot' ? '/auth' : ''}${url.search}`;
  return fetch(new Request(targetUrl, { method: 'GET', headers: request.headers, redirect: 'manual' }));
}
