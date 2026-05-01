/**
 * Qiyadon Pipeline Leak Audit — Form Handler
 * Cloudflare Pages Function (auto-deployed at /submit-audit)
 */

import nodemailer from 'nodemailer';
import fs from 'fs';

// Load Qiyadon email credentials
const rawCreds = fs.readFileSync('/home/node/.openclaw/secrets/qiyadon-email.json', 'utf8');
const creds = JSON.parse(rawCreds);

const transporter = nodemailer.createTransport({
  host: 'smtp0001.neo.space',
  port: 587,
  secure: false,
  auth: { user: creds.user, pass: creds.password },
  requireTLS: true,
  tls: { rejectUnauthorized: false }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildAuditEmail(data) {
  const text = `PIPELINE LEAK AUDIT REQUEST
==========================
Name: ${data.name}
Company: ${data.company}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}

Industry: ${data.industry}
Leads per month: ${data.leads_per_month}
Close rate: ${data.close_rate}
CRM: ${data.crm}

Biggest pipeline frustration:
${data.challenge}

Current follow-up process:
${data.followup_process}

How they found Qiyadon: ${data.found_us || 'Not specified'}

Submitted: ${data.submitted_at}
  `.trim();

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body { font-family: Inter, Arial, sans-serif; background: #F6F3F1; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #171314; padding: 24px 32px; }
    .header h1 { color: #fff; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.03em; }
    .header p { color: rgba(255,255,255,0.6); font-size: 13px; margin: 6px 0 0; }
    .status-badge { display: inline-block; background: rgba(177,18,38,0.2); color: #FF6B6B; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 12px; }
    .body { padding: 28px 32px; }
    .field { margin-bottom: 20px; }
    .field-label { font-size: 11px; font-weight: 700; color: #6E6A68; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .field-value { font-size: 15px; color: #171314; font-weight: 500; }
    .field-value.textarea { font-weight: 400; color: #5F5A58; line-height: 1.6; white-space: pre-wrap; }
    .divider { border: none; border-top: 1px solid #E5DEDA; margin: 24px 0; }
    .footer { background: #F6F3F1; padding: 16px 32px; font-size: 12px; color: #6E6A68; }
    .cta { background: #B11226; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 999px; font-size: 13px; font-weight: 600; display: inline-block; margin-top: 8px; }
  </style></head><body>
  <div class="container">
    <div class="header">
      <div class="status-badge">NEW AUDIT REQUEST</div>
      <h1>Pipeline Leak Audit — ${escapeHtml(data.name)}</h1>
      <p>${escapeHtml(data.company)} · ${escapeHtml(data.email)}</p>
    </div>
    <div class="body">
      <div class="field"><div class="field-label">Phone / WhatsApp</div><div class="field-value">${data.phone ? escapeHtml(data.phone) : '<em>Not provided</em>'}</div></div>
      <div class="field"><div class="field-label">Industry</div><div class="field-value">${escapeHtml(data.industry)}</div></div>
      <table style="width:100%;border-collapse:collapse;"><tr>
        <td style="padding-right:16px;"><div class="field-label">Leads / Month</div><div class="field-value">${escapeHtml(data.leads_per_month)}</div></td>
        <td><div class="field-label">Close Rate</div><div class="field-value">${escapeHtml(data.close_rate)}</div></td>
      </tr></table>
      <div class="field" style="margin-top:20px;"><div class="field-label">CRM / Pipeline Tool</div><div class="field-value">${escapeHtml(data.crm)}</div></div>
      <hr class="divider">
      <div class="field"><div class="field-label">Biggest Pipeline Frustration</div><div class="field-value textarea">${escapeHtml(data.challenge)}</div></div>
      <div class="field"><div class="field-label">Current Follow-Up Process</div><div class="field-value">${escapeHtml(data.followup_process)}</div></div>
      ${data.found_us ? `<div class="field"><div class="field-label">How They Found Qiyadon</div><div class="field-value">${escapeHtml(data.found_us)}</div></div>` : ''}
      <hr class="divider">
      <a href="mailto:${escapeHtml(data.email)}?subject=Re:%20Pipeline%20Leak%20Audit" class="cta">Reply to ${escapeHtml(data.name)} →</a>
    </div>
    <div class="footer">Received: ${data.submitted_at ? new Date(data.submitted_at).toLocaleString('Europe/Berlin', {timeZone: 'Europe/Berlin'}) : 'just now'} (Berlin time) · Qiyadon Pipeline Execution</div>
  </div>
</body></html>`;

  return { text, html };
}

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  let data;
  try {
    data = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const required = ['name', 'company', 'email', 'industry', 'leads_per_month', 'close_rate', 'crm', 'challenge', 'followup_process'];
  for (const field of required) {
    if (!data[field] || !String(data[field]).trim()) {
      return new Response(JSON.stringify({ error: `Missing field: ${field}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  data.submitted_at = data.submitted_at || new Date().toISOString();
  const { html, text } = buildAuditEmail(data);

  try {
    const info = await transporter.sendMail({
      from: `Qiyadon Forms <${creds.user}>`,
      to: 'contact@qiyadon.com',
      subject: `Pipeline Leak Audit — ${data.name} / ${data.company}`,
      text,
      html
    });
    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Email send failed', details: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
