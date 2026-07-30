/**
 * functions/submit-pilot-application.js
 * Cloudflare Pages Function — Qiyadon Pilot Application form handler
 *
 * Handles POST /submit-pilot-application from pilot-application.html (a
 * private link sent to pilot_candidate diagnostic respondents, not linked
 * from site navigation). Proxies to the real backend at api.qiyadon.com
 * (Cloudflare Tunnel -> qiyadon-audit-form pm2 process, port 3001), which
 * validates the per-prospect diagnostic token, sends the same real
 * notify/confirmation emails used by the waitlist modal, and writes the
 * application directly onto that prospect's Customer Discovery Tracker
 * record in NocoDB.
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

async function sendPilotApplication(data) {
  const res = await fetch('https://api.qiyadon.com/submit-pilot-application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || `Pilot application backend error ${res.status}`);
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
  const name = String(data?.name || '').trim();
  const phone = String(data?.phone || '').trim();
  const email = String(data?.email || '').trim();
  const company = String(data?.company || '').trim();
  const industry = String(data?.industry || '').trim();
  const fleetSize = String(data?.fleet_size || '').trim();
  const notes = String(data?.notes || '').trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!token) return corsResponse(400, { error: 'This application link is missing its token.' });
  if (!name) return corsResponse(400, { error: 'name is required' });
  if (!phone) return corsResponse(400, { error: 'phone is required' });
  if (!email || !emailPattern.test(email)) return corsResponse(400, { error: 'a valid email is required' });
  if (!company) return corsResponse(400, { error: 'company name is required' });
  if (notes.length > 3000) return corsResponse(400, { error: 'notes is too long' });

  const submittedAt = new Date().toISOString();

  try {
    await sendPilotApplication({ token, name, phone, email, company, industry, fleet_size: fleetSize, notes, submitted_at: submittedAt });
    return corsResponse(200, { success: true, message: 'Application received' });
  } catch (err) {
    console.error('[submit-pilot-application] Submission error:', err.message);
    return corsResponse(err.status && err.status < 500 ? err.status : 500, {
      error: err.status && err.status < 500 ? err.message : 'Failed to submit. Please try again or email us directly.'
    });
  }
}
