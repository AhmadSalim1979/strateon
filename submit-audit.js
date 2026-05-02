/**
 * submit-audit.js — Pipeline Leak Audit Form Handler
 * 
 * Run as: node submit-audit.js
 * Starts an HTTP server that receives form submissions from pipeline-leak-audit.html
 * and emails the results to contact@qiyadon.com
 *
 * Credentials: /home/node/.openclaw/secrets/qiyadon-email.json
 * 
 * Uses the same email credentials as email-worker.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Qiyadon Email Signature ───────────────────────────────────────────────
// Signature image now served from file path (not inline base64)

// Load HubSpot token from secrets
const hubspotcredsPath = '/home/node/.openclaw/secrets/hubspot.json';
let HUBSPOT_API_KEY = '';
try {
  const hsCreds = JSON.parse(fs.readFileSync(hubspotcredsPath, 'utf8'));
  HUBSPOT_API_KEY = hsCreds.accessToken || '';
} catch (err) {
  console.error('Could not load HubSpot credentials from', hubspotcredsPath, '-', err.message);
}

function createHubSpotContact(data) {
  // Build notes from extra form fields
  const notes = [];
  if (data.lead_count) notes.push(`Lead count: ${data.lead_count}`);
  if (data.leads_per_month) notes.push(`Leads/month: ${data.leads_per_month}`);
  if (data.industry) notes.push(`Industry: ${data.industry}`);
  if (data.crm) notes.push(`CRM: ${data.crm}`);
  if (data.close_rate) notes.push(`Close rate: ${data.close_rate}`);
  if (data.challenge) notes.push(`Challenge: ${data.challenge}`);
  if (data.followup_process) notes.push(`Follow-up process: ${data.followup_process}`);
  if (data.found_us) notes.push(`Found us via: ${data.found_us}`);

  const properties = {
    email: data.email || '',
    company: data.company || '',
    firstname: data.name || ''
  };

  // Only include message if notes is non-empty
  if (notes.length > 0) {
    properties.message = notes.join(' | ');
  }

  const payload = JSON.stringify({ properties });

  const options = {
    hostname: 'api.hubapi.com',
    path: '/crm/v3/objects/contacts',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('[submit-audit] HubSpot contact created:', data.email);
      } else {
        console.error('[submit-audit] HubSpot API error:', res.statusCode, body);
      }
    });
  });

  req.on('error', (err) => {
    console.error('[submit-audit] HubSpot request failed:', err.message);
  });

  req.write(payload);
  req.end();
}

// Load secrets (same as email-worker.js)
const credsPath = '/home/node/.openclaw/secrets/qiyadon-email.json';
let creds = null;
try {
  creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
} catch (err) {
  console.error('Could not load credentials from', credsPath, '-', err.message);
  process.exit(1);
}

// ── Email via nodemailer ──────────────────────────────────────────────────────
const nodemailer = require('/home/node/.openclaw/imap-worker/node_modules/nodemailer');

const transporter = nodemailer.createTransport({
  host: creds.smtp.host,
  port: creds.smtp.port,
  secure: creds.smtp.secure,
  auth: {
    user: creds.user,
    pass: creds.password
  },
  tls: { rejectUnauthorized: false }
});

function buildAuditEmail(data) {
  const submittedAt = new Date(data.submitted_at).toLocaleString('en-GB', {
    timeZone: 'Europe/Berlin',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const html = `
<!DOCTYPE html>
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
      <img src="cid:signature@qiyadon" alt="Qiyadon" style="width:100%;display:block;max-width:620px" />
      <div class="email-header">
        <div class="label">New Lead — Pipeline Leak Audit Request</div>
        <h1>Pipeline Leak Audit</h1>
        <div class="sub">Received ${submittedAt} (Europe/Berlin)</div>
      </div>
      <div class="email-body">

        <!-- Key meta -->
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

        <!-- Pipeline profile -->
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

        <!-- Biggest challenge -->
        <div class="section">
          <div class="section-title">Biggest Pipeline Frustration</div>
          ${data.challenge ? `<div class="challenge-box"><p>${esc(data.challenge)}</p></div>` : '<p class="no-data">Not provided</p>'}
        </div>

        <!-- Follow-up process -->
        <div class="section">
          <div class="section-title">Current Follow-Up Process</div>
          <div class="field-row">
            <div class="field" style="flex: 1;">
              <div class="value">${esc(data.followup_process) || '<span class="no-data">Not specified</span>'}</div>
            </div>
          </div>
        </div>

        <!-- Source -->
        ${data.found_us ? `<div class="section">
          <div class="section-title">Source</div>
          <div class="field-row">
            <div class="field">
              <div class="value">${esc(data.found_us)}</div>
            </div>
          </div>
        </div>` : ''}

        <!-- Next step CTA -->
        <div class="cta-row">
          <p>Respond within 1 business day</p>
          <a href="mailto:contact@qiyadon.com?subject=Re%3A%20Pipeline%20Leak%20Audit%20-%20${encodeURIComponent(data.name)}">contact@qiyadon.com</a>
        </div>
      </div>
      <div class="email-footer">
        <p>This form was submitted via qiyadon.com/pipeline-leak-audit.html · ${submittedAt}</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

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
    This form was submitted via qiyadon.com/pipeline-leak-audit.html
    Respond to: ahmad.salim@qiyadon.com`
  ].join('\n');

  return { html, text };
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sendAuditEmail(data, callback) {
  const { html, text } = buildAuditEmail(data);
  const mailOptions = {
    from: creds.user,
    to: 'contact@qiyadon.com',
    subject: `Pipeline Leak Audit Request — ${data.name} / ${data.company}`,
    text: text,
    html: html,
    attachments: [{
      filename: 'qiyadon-email-signature.jpg',
      path: '/home/node/.openclaw/workspace/strateon-site/public/assets/qiyadon-email-signature.jpg',
      cid: 'signature@qiyadon',
      contentType: 'image/jpeg'
    }]
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('[submit-audit] Email send error:', err.message);
    } else {
      console.log('[submit-audit] Email sent:', info.messageId, 'accepted:', info.accepted);
    }
    callback(err, info);
  });
}

// ── HTTP Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // listen on all interfaces

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  // Only accept POST to /submit-audit.js
  if (req.method !== 'POST' || !req.url.includes('submit-audit')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let data;
    try {
      data = JSON.parse(body);
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    sendAuditEmail(data, (err, info) => {
      if (err) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'Failed to send email' }));
        return;
      }

      // Fire HubSpot contact creation (non-blocking; email is more important)
      createHubSpotContact(data);

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ success: true, messageId: info.messageId }));
    });
  });

  req.on('error', (err) => {
    console.error('[submit-audit] Request error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error' }));
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[submit-audit] Pipeline Leak Audit server running on http://${HOST}:${PORT}`);
  console.log(`[submit-audit] Email destination: ahmad.salim@qiyadon.com`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[submit-audit] SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('[submit-audit] SIGINT received, shutting down...');
  server.close(() => process.exit(0));
});
