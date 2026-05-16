/**
 * functions/submit-audit.js
 * Cloudflare Pages Function — Pipeline Leak Audit Form Handler
 *
 * Handles POST /submit-audit from pipeline-leak-audit.html
 * Sends formatted email via MailChannels Direct Sending API
 * Creates HubSpot contact
 *
 * Environment variables (set in Cloudflare Pages → Settings → Environment Variables):
 *   HUBSPOT_API_KEY   — HubSpot private app access token
 *   MAILCHANNELS_API_KEY — MailChannels authorization token (if required)
 *   CF_MAIL_FROM      — From address (contact@qiyadon.com)
 *   CF_MAIL_TO        — To address (ahmad.salim@qiyadon.com)
 *
 * Note: MailChannels Direct Sending API does NOT require an API key for the
 * destination address list (qiyadon.com is the verified domain).
 * The authorization header uses the domain's sending API key if configured.
 */

// ── CORS ─────────────────────────────────────────────────────────────────────
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

// ── HTML Escape ──────────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Email Builder ────────────────────────────────────────────────────────────
function buildAuditEmail(data) {
  const submittedAt = new Date(data.submitted_at).toLocaleString('en-GB', {
    timeZone: 'Europe/Berlin',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; color: #171314; background: #F6F3F1; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .email-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .email-header { background: linear-gradient(135deg, #171314 0%, #5A0F18 100%); padding: 28px 32px; }
    .email-header .label { font-size: 11px; font-weight: 700; color: #FF6B6B; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .email-header h1 { font-size: 22px; font-weight: 850; color: #fff; letter-spacing: -0.03em; line-height: 1.15; }
    .email-header .sub { font-size: 13px; color: rgba(255,255,255,0.55); margin-top: 6px; }
    .email-body { padding: 32px; }
    .meta-row { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .meta-item { background: #F6F3F1; border-radius: 10px; padding: 14px 16px; flex: 1; min-width: 140px; }
    .meta-item .meta-label { font-size: 10px; font-weight: 700; color: #B11226; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .meta-item .meta-value { font-size: 14px; font-weight: 700; color: #171314; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: 700; color: #B11226; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #E5DEDA; }
    .field-row { display: flex; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
    .field { flex: 1; min-width: 140px; }
    .field label { font-size: 11px; font-weight: 600; color: #6E6A68; display: block; margin-bottom: 4px; }
    .field .value { font-size: 14px; font-weight: 600; color: #171314; }
    .challenge-box { background: #F6F3F1; border-radius: 10px; padding: 16px; border-left: 3px solid #B11226; }
    .challenge-box p { font-size: 13px; color: #171314; line-height: 1.6; }
    .no-data { font-size: 13px; color: #B0ABA8; font-style: italic; }
    .cta-row { background: rgba(177,18,38,0.06); border: 1px solid rgba(177,18,38,0.16); border-radius: 10px; padding: 18px 20px; text-align: center; margin-top: 8px; }
    .cta-row p { font-size: 13px; color: #171314; font-weight: 600; margin-bottom: 4px; }
    .cta-row a { color: #B11226; text-decoration: none; font-weight: 700; }
    .email-footer { background: #F6F3F1; padding: 20px 32px; border-top: 1px solid #E5DEDA; }
    .email-footer p { font-size: 11px; color: #B0ABA8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="email-header">
        <div class="label">New Lead — Pipeline Leak Audit Request</div>
        <h1>Pipeline Leak Audit</h1>
        <div class="sub">Received ${submittedAt} (Europe/Berlin)</div>
      </div>
      <div class="email-body">
        <div class="meta-row">
          <div class="meta-item">
            <div class="meta-label">Name</div>
            <div class="meta-value">${esc(data.name)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Company</div>
            <div class="meta-value">${esc(data.company)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Email</div>
            <div class="meta-value"><a href="mailto:${esc(data.email)}" style="color:#B11226;">${esc(data.email)}</a></div>
          </div>
          ${data.phone ? `<div class="meta-item">
            <div class="meta-label">Phone / WhatsApp</div>
            <div class="meta-value">${esc(data.phone)}</div>
          </div>` : ''}
        </div>
        <div class="section">
          <div class="section-title">Pipeline Profile</div>
          <div class="field-row">
            <div class="field">
              <label>Industry</label>
              <div class="value">${esc(data.industry) || '<span class="no-data">Not specified</span>'}</div>
            </div>
            <div class="field">
              <label>CRM / Pipeline Tool</label>
              <div class="value">${esc(data.crm) || '<span class="no-data">Not specified</span>'}</div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Leads / Month</label>
              <div class="value">${esc(data.leads_per_month) || '<span class="no-data">Not specified</span>'}</div>
            </div>
            <div class="field">
              <label>Close Rate</label>
              <div class="value">${esc(data.close_rate) || '<span class="no-data">Not specified</span>'}</div>
            </div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Biggest Pipeline Frustration</div>
          ${data.challenge ? `<div class="challenge-box"><p>${esc(data.challenge)}</p></div>` : '<p class="no-data">Not provided</p>'}
        </div>
        <div class="section">
          <div class="section-title">Current Follow-Up Process</div>
          <div class="field-row">
            <div class="field" style="flex:1;">
              <div class="value">${esc(data.followup_process) || '<span class="no-data">Not specified</span>'}</div>
            </div>
          </div>
        </div>
        ${data.found_us ? `<div class="section">
          <div class="section-title">Source</div>
          <div class="field-row">
            <div class="field">
              <div class="value">${esc(data.found_us)}</div>
            </div>
          </div>
        </div>` : ''}
        <div class="cta-row">
          <p>Respond within 1 business day</p>
          <a href="mailto:ahmad.salim@qiyadon.com?subject=Re%3A%20Pipeline%20Leak%20Audit%20-%20${encodeURIComponent(data.name)}">ahmad.salim@qiyadon.com</a>
        </div>
      </div>
      <div class="email-footer">
        <p>Submitted via qiyadon.com/pipeline-leak-audit.html · ${submittedAt}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = [
    `PIPELINE LEAK AUDIT REQUEST`,
    `================================`,
    `Name:      ${data.name}`,
    `Company:   ${data.company}`,
    `Email:     ${data.email}`,
    data.phone ? `Phone:     ${data.phone}` : ``,
    ``,
    `PIPELINE PROFILE`,
    `----------------------------------------`,
    `Industry:        ${data.industry || 'Not specified'}`,
    `CRM:             ${data.crm || 'Not specified'}`,
    `Leads/month:     ${data.leads_per_month || 'Not specified'}`,
    `Close rate:      ${data.close_rate || 'Not specified'}`,
    ``,
    `BIGGEST CHALLENGE`,
    `----------------------------------------`,
    data.challenge || '(not provided)',
    ``,
    `FOLLOW-UP PROCESS`,
    `----------------------------------------`,
    data.followup_process || '(not provided)',
    ``,
    `Source: ${data.found_us || '(not specified)'}`,
    ``,
    `Received: ${submittedAt} (Europe/Berlin)`,
    ``,
    `---
    Submitted via qiyadon.com/pipeline-leak-audit.html
    Respond to: ahmad.salim@qiyadon.com`
  ].join('\n');

  return { html, text };
}

// ── Email via Cloudflare Tunnel Proxy ───────────────────────────────────────
// Proxies through api.qiyadon.com which routes via Cloudflare Tunnel → port 3001
async function sendAuditEmail(data) {
  const { html, text } = buildAuditEmail(data);

  const payload = JSON.stringify({
    name: data.name,
    company: data.company,
    email: data.email,
    phone: data.phone || '',
    industry: data.industry || '',
    leads_per_month: data.leads_per_month || '',
    close_rate: data.close_rate || '',
    crm: data.crm || '',
    challenge: data.challenge || '',
    followup_process: data.followup_process || '',
    found_us: data.found_us || '',
    submitted_at: data.submitted_at
  });

  const res = await fetch('https://api.qiyadon.com/submit-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Audit backend error ${res.status}: ${errText}`);
  }

  return { success: true };
}

// ── HubSpot Contact ──────────────────────────────────────────────────────────
async function createHubSpotContact(data, env) {
  const apiKey = env.HUBSPOT_API_KEY;
  if (!apiKey) {
    console.log('[submit-audit] HUBSPOT_API_KEY not set — skipping HubSpot');
    return;
  }

  const notes = [];
  if (data.leads_per_month) notes.push(`Leads/month: ${data.leads_per_month}`);
  if (data.industry) notes.push(`Industry: ${data.industry}`);
  if (data.crm) notes.push(`CRM: ${data.crm}`);
  if (data.close_rate) notes.push(`Close rate: ${data.close_rate}`);
  if (data.challenge) notes.push(`Challenge: ${data.challenge}`);
  if (data.followup_process) notes.push(`Follow-up process: ${data.followup_process}`);
  if (data.found_us) notes.push(`Found us: ${data.found_us}`);

  const properties = {
    email: data.email || '',
    company: data.company || '',
    firstname: data.name || ''
  };
  if (notes.length > 0) {
    properties.message = notes.join(' | ');
  }

  try {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    });
    const body = await res.text();
    if (res.status >= 200 && res.status < 300) {
      console.log('[submit-audit] HubSpot contact created:', data.email);
    } else {
      console.error('[submit-audit] HubSpot API error:', res.status, body);
    }
  } catch (err) {
    console.error('[submit-audit] HubSpot request failed:', err.message);
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request } = context;
  const env = context.env || {};

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Only handle POST /submit-audit
  if (request.method !== 'POST') {
    return corsResponse(405, { error: 'Method not allowed' });
  }

  let data;
  try {
    data = await request.json();
  } catch (err) {
    return corsResponse(400, { error: 'Invalid JSON' });
  }

  // Basic server-side validation
  if (!data.name || !data.email || !data.company) {
    return corsResponse(400, { error: 'Missing required fields: name, email, company' });
  }

  // Add server timestamp
  data.submitted_at = new Date().toISOString();

  try {
    // Send email — this is the critical path
    await sendAuditEmail(data);

    // Create HubSpot contact (non-blocking)
    createHubSpotContact(data, env).catch(err => {
      console.error('[submit-audit] HubSpot error:', err.message);
    });

    return corsResponse(200, { success: true, message: 'Audit request received' });

  } catch (err) {
    console.error('[submit-audit] Submission error:', err.message);
    return corsResponse(500, { error: 'Failed to process submission. Please try again.' });
  }
}