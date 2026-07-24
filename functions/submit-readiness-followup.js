/**
 * functions/submit-readiness-followup.js
 * Cloudflare Pages Function — Pilot Readiness Follow-up handler
 *
 * Handles POST /submit-readiness-followup from pilot-readiness-followup.html
 * (a private link sent only when Phase 6 of the CMO daily pipeline finds a
 * customer-suppliable readiness answer missing or unclear). The page shows
 * only a dynamic subset of questions (hinted by the link's `fields` query
 * param), so this function does not hard-validate a fixed key list -- it
 * only checks that a token and a non-empty answers object were sent, and
 * proxies to the real backend at api.qiyadon.com, which is the sole
 * authority on which exact keys are actually required (it re-reads its own
 * server-stored record of what was missing at send time).
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

async function sendFollowupSubmission(data) {
  const res = await fetch('https://api.qiyadon.com/submit-readiness-followup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || `Readiness follow-up backend error ${res.status}`);
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

  const rawAnswers = data?.answers;
  if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers) || !Object.keys(rawAnswers).length) {
    return corsResponse(400, { error: 'Please answer the question(s) shown.' });
  }

  const answers = {};
  for (const key of Object.keys(rawAnswers)) {
    const value = String(rawAnswers[key] || '').trim();
    if (value.length > 2000) return corsResponse(400, { error: `Answer too long: ${key.replace(/_/g, ' ')}` });
    answers[key] = value;
  }

  try {
    await sendFollowupSubmission({ token, answers, submitted_at: new Date().toISOString() });
    return corsResponse(200, { success: true, message: 'Follow-up submitted' });
  } catch (err) {
    console.error('[submit-readiness-followup] Submission error:', err.message);
    return corsResponse(err.status && err.status < 500 ? err.status : 500, {
      error: err.status && err.status < 500 ? err.message : 'Failed to submit. Please try again or email us directly.'
    });
  }
}
