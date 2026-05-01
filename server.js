/**
 * Qiyadon Pipeline Leak Audit — HTTP Form Handler
 * Listens on PORT, handles POST /submit-audit
 */
const http = require('http');
const fs = require('fs');

// Inline minimal nodemailer to avoid module issues
const nodemailer = require('/home/node/.openclaw/imap-worker/node_modules/nodemailer');

const creds = JSON.parse(fs.readFileSync('/home/node/.openclaw/secrets/qiyadon-email.json', 'utf8'));

const transporter = nodemailer.createTransport({
  host: 'smtp0001.neo.space',
  port: 587,
  secure: false,
  auth: { user: creds.user, pass: creds.password },
  requireTLS: true,
  tls: { rejectUnauthorized: false }
});

function buildEmailHtml(data) {
  const escape = (s) => !s ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Inter,Arial,sans-serif;background:#F6F3F1;margin:0;padding:20px}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
.header{background:#171314;padding:24px 32px}
.header h1{color:#fff;font-size:20px;font-weight:800;margin:0}
.header p{color:rgba(255,255,255,0.6);font-size:13px;margin:6px 0 0}
.status-badge{display:inline-block;background:rgba(177,18,38,0.2);color:#FF6B6B;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:12px}
.body{padding:28px 32px}
.field{margin-bottom:20px}
.field-label{font-size:11px;font-weight:700;color:#6E6A68;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px}
.field-value{font-size:15px;color:#171314;font-weight:500}
.field-value.ta{font-weight:400;color:#5F5A58;line-height:1.6;white-space:pre-wrap}
hr{margin:24px 0;border:none;border-top:1px solid #E5DEDA}
.cta{background:#B11226;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:600;display:inline-block;margin-top:8px}
.footer{background:#F6F3F1;padding:16px 32px;font-size:12px;color:#6E6A68}
</style></head><body><div class="container"><div class="header">
<div class="status-badge">NEW AUDIT REQUEST</div>
<h1>Pipeline Leak Audit — ${escape(data.name)}</h1>
<p>${escape(data.company)} · ${escape(data.email)}</p>
</div><div class="body">
<div class="field"><div class="field-label">Phone</div><div class="field-value">${data.phone?escape(data.phone):'<em>Not provided</em>'}</div></div>
<div class="field"><div class="field-label">Industry</div><div class="field-value">${escape(data.industry)}</div></div>
<table style="width:100%;border-collapse:collapse"><tr>
<td style="padding-right:16px"><div class="field-label">Leads/Month</div><div class="field-value">${escape(data.leads_per_month)}</div></td>
<td><div class="field-label">Close Rate</div><div class="field-value">${escape(data.close_rate)}</div></td>
</tr></table>
<div class="field" style="margin-top:20px"><div class="field-label">CRM</div><div class="field-value">${escape(data.crm)}</div></div>
<hr>
<div class="field"><div class="field-label">Biggest Pipeline Frustration</div><div class="field-value ta">${escape(data.challenge)}</div></div>
<div class="field"><div class="field-label">Current Follow-Up Process</div><div class="field-value">${escape(data.followup_process)}</div></div>
${data.found_us?`<div class="field"><div class="field-label">How Found Qiyadon</div><div class="field-value">${escape(data.found_us)}</div></div>`:''}
<hr>
<a href="mailto:${escape(data.email)}?subject=Re:%20Pipeline%20Leak%20Audit" class="cta">Reply to ${escape(data.name)} →</a>
</div><div class="footer">Received: ${new Date().toUTCString()} · Qiyadon Pipeline Execution</div></div></body></html>`;
}

const server = http.createServer((req, res) => {
  const t = Date.now();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }
  if (req.method !== 'POST' || req.url !== '/submit-audit') {
    res.writeHead(404, {'Content-Type':'application/json'});
    res.end('{}'); return;
  }

  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    let data;
    try { data = JSON.parse(body); } catch (e) {
      res.writeHead(400, {'Content-Type':'application/json'});
      res.end(JSON.stringify({error:'Invalid JSON'})); return;
    }

    const required = ['name','company','email','industry','leads_per_month','close_rate','crm','challenge','followup_process'];
    for (const f of required) {
      if (!data[f]?.toString().trim()) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({error:'Missing: '+f})); return;
      }
    }

    console.log('[' + new Date().toISOString() + '] Sending email for:', data.name, data.company);

    transporter.sendMail({
      from: `Qiyadon Forms <${creds.user}>`,
      to: 'contact@qiyadon.com',
      subject: `Pipeline Leak Audit — ${data.name} / ${data.company}`,
      text: `Pipeline Leak Audit Request\n===========================\nName: ${data.name}\nCompany: ${data.company}\nEmail: ${data.email}\nPhone: ${data.phone||'N/A'}\nIndustry: ${data.industry}\nLeads/month: ${data.leads_per_month}\nClose rate: ${data.close_rate}\nCRM: ${data.crm}\nChallenge: ${data.challenge}\nFollow-up: ${data.followup_process}\nFound us: ${data.found_us||'N/A'}`,
      html: buildEmailHtml(data)
    }, (err, info) => {
      const ms = Date.now() - t;
      if (err) {
        console.log('[' + new Date().toISOString() + '] ERR', err.message, ms+'ms');
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({error: err.message}));
      } else {
        console.log('[' + new Date().toISOString() + '] OK', info.messageId, ms+'ms');
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({success: true, id: info.messageId}));
      }
    });
  });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log('[' + new Date().toISOString() + '] Server listening on http://0.0.0.0:' + PORT);
});
