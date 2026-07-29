/**
 * functions/submit-waitlist.js
 * Cloudflare Pages Function — "Join the Waitlist" modal handler
 *
 * Handles POST /submit-waitlist from the shared waitlist modal (every
 * page's header CTA + homepage hero secondary CTA). Proxies to the real
 * backend at api.qiyadon.com (Cloudflare Tunnel -> qiyadon-audit-form pm2
 * process, port 3001), which sends two real emails via the same live
 * nodemailer/SMTP path already used by the other forms: one notifying
 * contact@qiyadon.com of the new lead, one confirming to the visitor.
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

async function sendWaitlistSignup(data) {
  const payload = JSON.stringify(data);
  const res = await fetch('https://api.qiyadon.com/submit-waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || `Waitlist backend error ${res.status}`);
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

  const name = String(data?.name || '').trim();
  const phone = String(data?.phone || '').trim();
  const email = String(data?.email || '').trim();
  const company = String(data?.company || '').trim();
  const industry = String(data?.industry || '').trim();
  const fleetSize = String(data?.fleet_size || '').trim();
  const notes = String(data?.notes || '').trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name) return corsResponse(400, { error: 'name is required' });
  if (!phone) return corsResponse(400, { error: 'phone is required' });
  if (!email || !emailPattern.test(email)) return corsResponse(400, { error: 'a valid email is required' });
  if (!company) return corsResponse(400, { error: 'company name is required' });
  if (notes.length > 3000) return corsResponse(400, { error: 'notes is too long' });

  const submittedAt = new Date().toISOString();

  try {
    await sendWaitlistSignup({ name, phone, email, company, industry, fleet_size: fleetSize, notes, submitted_at: submittedAt });
    return corsResponse(200, { success: true, message: 'Added to waitlist' });
  } catch (err) {
    console.error('[submit-waitlist] Submission error:', err.message);
    return corsResponse(err.status && err.status < 500 ? err.status : 500, { error: 'Failed to submit. Please try again or email us directly.' });
  }
}
