/**
 * functions/submit-diagnostic.js
 * Cloudflare Pages Function — ChargeGuard Detention & Accessorial Discovery
 * Diagnostic handler
 *
 * Handles POST /submit-diagnostic from the diagnostic.html form (a private
 * link sent to specific prospects, not linked from site navigation).
 * Proxies to the real backend at api.qiyadon.com (Cloudflare Tunnel ->
 * qiyadon-audit-form pm2 process, port 3001), which validates the
 * per-prospect token, scores/classifies the answers, and writes the result
 * directly into the prospect's Customer Discovery Tracker record in NocoDB.
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

async function sendDiagnosticSubmission(data) {
  const payload = JSON.stringify(data);
  const res = await fetch('https://api.qiyadon.com/submit-diagnostic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || `Diagnostic backend error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

const REQUIRED_ANSWER_KEYS = [
  'tms_eld_system',
  'monthly_loads',
  'monthly_detention_incidents',
  'detention_tracking_process',
  'claim_followup',
  'time_consuming_task',
  'error_cause',
  'trust_blockers',
  'pilot_interest'
];

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
  if (!token) return corsResponse(400, { error: 'This diagnostic link is missing its token.' });

  const answers = {};
  for (const key of REQUIRED_ANSWER_KEYS) {
    const value = String(data?.answers?.[key] || '').trim();
    if (!value) return corsResponse(400, { error: `Please answer: ${key.replace(/_/g, ' ')}` });
    if (value.length > 2000) return corsResponse(400, { error: `Answer too long: ${key.replace(/_/g, ' ')}` });
    answers[key] = value;
  }

  try {
    await sendDiagnosticSubmission({ token, answers, submitted_at: new Date().toISOString() });
    return corsResponse(200, { success: true, message: 'Diagnostic submitted' });
  } catch (err) {
    console.error('[submit-diagnostic] Submission error:', err.message);
    return corsResponse(err.status && err.status < 500 ? err.status : 500, {
      error: err.status && err.status < 500 ? err.message : 'Failed to submit. Please try again or email us directly.'
    });
  }
}
