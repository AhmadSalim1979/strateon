/**
 * functions/submit-contact.js
 * Cloudflare Pages Function — Contact Page Form Handler
 *
 * Handles POST /submit-contact from the new genesis contact page's form.
 * Proxies to the real backend at api.qiyadon.com (Cloudflare Tunnel ->
 * qiyadon-audit-form pm2 process, port 3001), which sends the message via
 * the same real nodemailer/SMTP path already used for the pipeline-leak
 * audit form -- no new email infrastructure, just a new route on it.
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

async function sendContactMessage(data) {
  const payload = JSON.stringify({
    name: data.name,
    email: data.email,
    message: data.message,
    submitted_at: data.submitted_at
  });

  const res = await fetch('https://api.qiyadon.com/submit-contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || `Contact backend error ${res.status}`);
    err.status = res.ok ? 502 : res.status;
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

  const name = String(data?.name || '').trim();
  const email = String(data?.email || '').trim();
  const message = String(data?.message || '').trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name) return corsResponse(400, { error: 'name is required' });
  if (!email || !emailPattern.test(email)) return corsResponse(400, { error: 'a valid email is required' });
  if (!message) return corsResponse(400, { error: 'a message is required' });
  if (message.length > 5000) return corsResponse(400, { error: 'message is too long' });

  data.submitted_at = new Date().toISOString();

  try {
    await sendContactMessage({ name, email, message, submitted_at: data.submitted_at });
    return corsResponse(200, { success: true, message: 'Message sent' });
  } catch (err) {
    console.error('[submit-contact] Submission error:', err.message);
    return corsResponse(err.status && err.status < 500 ? err.status : 500, { error: 'Failed to send message. Please try again or email us directly.' });
  }
}
