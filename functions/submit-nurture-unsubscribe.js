/**
 * functions/submit-nurture-unsubscribe.js
 * Cloudflare Pages Function — Nurture sequence unsubscribe handler
 *
 * Handles POST /submit-nurture-unsubscribe from nurture-unsubscribe.html
 * (the one-click link in every nurture-sequence email). Proxies to the
 * real backend at api.qiyadon.com, which stops the sequence for that
 * prospect immediately -- "the prospect opts out" is one of the explicit
 * stop conditions for the nurture sequence (Daily Marketing Action 6).
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function corsResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

async function sendUnsubscribe(data) {
  const res = await fetch('https://api.qiyadon.com/submit-nurture-unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || `Nurture unsubscribe backend error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'POST') {
    return corsResponse(405, { error: 'Method not allowed' });
  }

  let data;
  try {
    data = await request.json();
  } catch (err) {
    return corsResponse(400, { error: 'Invalid JSON' });
  }

  const token = String(data?.token || '').trim();
  if (!token) return corsResponse(400, { error: 'This link is missing its token.' });

  try {
    await sendUnsubscribe({ token });
    return corsResponse(200, { success: true, message: 'Unsubscribed' });
  } catch (err) {
    console.error('[submit-nurture-unsubscribe] Submission error:', err.message);
    return corsResponse(err.status && err.status < 500 ? err.status : 500, {
      error: err.status && err.status < 500 ? err.message : 'Failed to process your request. Please try again.'
    });
  }
}
