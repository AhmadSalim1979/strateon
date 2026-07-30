/**
 * functions/submit-pilot-environment-intake.js
 * Cloudflare Pages Function — Qiyadon Pilot Environment Intake handler
 *
 * Handles POST /submit-pilot-environment-intake from
 * pilot-environment-intake.html (a private link sent only when Phase 6 of
 * the CMO daily pipeline finds a pilot application 'ready'). Proxies to
 * the real backend at api.qiyadon.com. This form (and this handler) never
 * accept a password/API-key/access-token field -- only non-secret
 * operational details, per Ahmad's explicit instruction.
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

async function sendIntakeSubmission(data) {
  const res = await fetch('https://api.qiyadon.com/submit-pilot-environment-intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || `Pilot environment intake backend error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

const REQUIRED_ANSWER_KEYS = ['tms_eld_platform', 'integration_method', 'load_data_format', 'coordination_contact'];

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

  const answers = {};
  for (const key of REQUIRED_ANSWER_KEYS) {
    const value = String(data?.answers?.[key] || '').trim();
    if (!value) return corsResponse(400, { error: `Please answer: ${key.replace(/_/g, ' ')}` });
    if (value.length > 2000) return corsResponse(400, { error: `Answer too long: ${key.replace(/_/g, ' ')}` });
    answers[key] = value;
  }
  answers.additional_notes = String(data?.answers?.additional_notes || '').trim().slice(0, 2000);

  try {
    await sendIntakeSubmission({ token, answers, submitted_at: new Date().toISOString() });
    return corsResponse(200, { success: true, message: 'Intake submitted' });
  } catch (err) {
    console.error('[submit-pilot-environment-intake] Submission error:', err.message);
    return corsResponse(err.status && err.status < 500 ? err.status : 500, {
      error: err.status && err.status < 500 ? err.message : 'Failed to submit. Please try again or email us directly.'
    });
  }
}
