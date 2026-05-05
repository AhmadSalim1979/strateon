const http = require('http');
const nodemailer = require('/home/node/.openclaw/imap-worker/node_modules/nodemailer');
const fs = require('fs');

// Load email credentials
const creds = JSON.parse(fs.readFileSync('/home/node/.openclaw/secrets/qiyadon-email.json', 'utf8'));

const transporter = nodemailer.createTransport({
  host: creds.smtp.host,
  port: creds.smtp.port,
  secure: creds.smtp.secure,
  requireTLS: true,
  auth: { user: creds.user, pass: creds.password }
});

function buildAuditEmail(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #F6F3F1; margin: 0; padding: 24px; color: #171314; }
    .email-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 640px; margin: 0 auto; }
    .email-header { background: linear-gradient(135deg, #171314 0%, #5A0F18 100%); padding: 28px 32px; }
    .email-header .label { font-size: 11px; font-weight: 700; color: #FF6B6B; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .email-header h1 { font-size: 22px; font-weight: 850; color: #fff; letter-spacing: -0.03em; line-height: 1.15; margin: 0; }
    .email-header .sub { font-size: 13px; color: rgba(255,255,255,0.55); margin-top: 6px; }
    .email-body { padding: 28px 32px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 13px; font-weight: 700; color: #B11226; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
    .section p, .section li { font-size: 14px; color: #5F5A58; line-height: 1.6; }
    .stat-row { display: flex; gap: 12px; margin: 16px 0; }
    .stat-box { flex: 1; background: #F6F3F1; border-radius: 10px; padding: 14px; text-align: center; }
    .stat-box .num { font-size: 22px; font-weight: 800; color: #B11226; }
    .stat-box .lbl { font-size: 11px; color: #6E6A68; margin-top: 2px; }
    .leak-list { list-style: none; padding: 0; margin: 0; }
    .leak-list li { padding: 10px 0; border-bottom: 1px solid #E5DEDA; font-size: 14px; color: #171314; }
    .leak-list li:last-child { border-bottom: none; }
    .cta-box { background: rgba(177,18,38,0.06); border: 1px solid rgba(177,18,38,0.16); border-radius: 10px; padding: 20px; text-align: center; }
    .cta-box p { font-size: 14px; color: #171314; margin-bottom: 16px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #B11226, #E03131); color: #fff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px; text-decoration: none; }
    .email-footer { padding: 16px 32px; border-top: 1px solid #E5DEDA; font-size: 12px; color: #6E6A68; text-align: center; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="email-header">
      <div class="label">Your Free Pipeline Leak Audit</div>
      <h1>Here's What We Found for ${data.company || 'Your Pipeline'}</h1>
      <div class="sub">Qiyadon Pipeline Execution — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
    </div>
    <div class="email-body">
      <div class="section">
        <h2>Your Numbers at a Glance</h2>
        <div class="stat-row">
          <div class="stat-box"><div class="num">${data.leads_per_month || '—'}</div><div class="lbl">Leads/Month</div></div>
          <div class="stat-box"><div class="num">${data.close_rate || '—'}</div><div class="lbl">Close Rate</div></div>
          <div class="stat-box"><div class="num">${data.crm || '—'}</div><div class="lbl">CRM</div></div>
        </div>
      </div>
      <div class="section">
        <h2>Where Your Pipeline Is Leaking</h2>
        <ul class="leak-list">
          <li>• ${data.challenge || 'Unqualified leads going dark before first contact'}</li>
          <li>• Follow-up process: ${data.followup_process || 'No formal process detected'}</li>
          <li>• ${data.industry || 'Your market'} companies lose an average of 30–50% of inbound leads to slow follow-up</li>
        </ul>
      </div>
      <div class="section">
        <h2>What Every Silent Lead Is Costing You</h2>
        <p>If you're closing at ${data.close_rate || '10–15%'} and getting ${data.leads_per_month || '20'} leads/month — that's roughly ${Math.round((parseInt(data.leads_per_month) || 20) * (1 - (parseFloat(data.close_rate) || 0.1))) || '10–15'} leads that went dark this month alone.</p>
        <p>At your average deal size, that's significant revenue sitting untouched in your pipeline.</p>
      </div>
      <div class="section">
        <h2>What Qiyadon Would Do About It</h2>
        <p>We take over the follow-up layer of your pipeline. Every inbound lead contacted within your configured window. Every dormant lead revived through persistent, structured sequences. Every silence escalated to you.</p>
        <p>You own the close. We own the follow-up.</p>
      </div>
      <div class="cta-box">
        <p><strong>Ready to stop losing leads to silence?</strong></p>
        <a href="https://qiyadon.com/sign-trial" class="cta-btn">Start Your Free Trial →</a>
      </div>
    </div>
    <div class="email-footer">
      Qiyadon — No lead left behind.<br>
      contact@qiyadon.com
    </div>
  </div>
</body>
</html>
  `.trim();
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/formspree-webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('[webhook] Received submission from:', data.email);
        
        const emailHtml = buildAuditEmail(data);
        
        await transporter.sendMail({
          from: 'Ahmad Salim <ahmad.salim@qiyadon.com>',
          to: data.email,
          replyTo: 'ahmad.salim@qiyadon.com',
          subject: `Your Pipeline Leak Audit — ${data.company || data.name}`,
          html: emailHtml
        });
        
        console.log('[webhook] Audit email sent to:', data.email);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error('[webhook] Error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Qiyadon webhook receiver active');
  }
});

server.listen(3001, '0.0.0.0', () => {
  console.log('[webhook] Receiver active on port 3001');
});
