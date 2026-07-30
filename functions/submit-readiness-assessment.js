/**
 * functions/submit-readiness-assessment.js
 * Cloudflare Pages Function — Qiyadon Pilot Readiness Assessment handler
 *
 * Handles POST /submit-readiness-assessment from pilot-readiness-assessment.html
 * (a private link sent only to pilot applicants found 'eligible' by Phase 5
 * of the CMO daily pipeline). Proxies to the real backend at
 * api.qiyadon.com (Cloudflare Tunnel -> qiyadon-audit-form pm2 process,
 * port 3001), which validates the per-prospect readiness token and writes
 * the answers directly into that prospect's Customer Discovery Tracker
 * record in NocoDB. Does not trigger onboarding or any conversation step --
 * it only records the answers.
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

async function sendReadinessSubmission(data) {
  const res = await fetch('https://api.qiyadon.com/submit-readiness-assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || `Readiness assessment backend error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

const REQUIRED_ANSWER_KEYS = [
  'tms_eld_integration_pref',
  'historical_records_availability',
  'primary_point_of_contact',
  'monthly_loads_in_scope',
  'pilot_timeframe'
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
  if (!token) return corsResponse(400, { error: 'This assessment link is missing its token.' });

  const answers = {};
  for (const key of REQUIRED_ANSWER_KEYS) {
    const value = String(data?.answers?.[key] || '').trim();
    if (!value) return corsResponse(400, { error: `Please answer: ${key.replace(/_/g, ' ')}` });
    if (value.length > 2000) return corsResponse(400, { error: `Answer too long: ${key.replace(/_/g, ' ')}` });
    answers[key] = value;
  }
  answers.additional_notes = String(data?.answers?.additional_notes || '').trim().slice(0, 2000);

  try {
    await sendReadinessSubmission({ token, answers, submitted_at: new Date().toISOString() });
    return corsResponse(200, { success: true, message: 'Assessment submitted' });
  } catch (err) {
    console.error('[submit-readiness-assessment] Submission error:', err.message);
    return corsResponse(err.status && err.status < 500 ? err.status : 500, {
      error: err.status && err.status < 500 ? err.message : 'Failed to submit. Please try again or email us directly.'
    });
  }
}
