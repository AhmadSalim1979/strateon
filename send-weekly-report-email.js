/**
 * send-weekly-report-email.js
 * Sends the demo weekly report HTML to ahmad.salim as a test email
 */
const fs = require('fs');
const nodemailer = require('nodemailer');

const creds = JSON.parse(fs.readFileSync('/home/node/.openclaw/secrets/qiyadon-email.json', 'utf8'));
const reportHTML = fs.readFileSync('/home/node/.openclaw/workspace/strateon/clients/demo/WEEKLY-REPORT-2026-05-03.html', 'utf8');

const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pipeline Report — CloudSync Pro | Week Apr 27–May 3, 2026</title>
<style>
  :root { --bg: #F5F6FA; --card: #FFFFFF; --text: #1A1D29; --muted: #6B7280; --border: #E2E8F0; --accent: #4F46E5; --accent-light: #EEF2FF; --green: #059669; --green-light: #D1FAE5; --red: #DC2626; --red-light: #FEE2E2; --orange: #D97706; --orange-light: #FEF3C7; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; padding: 16px; max-width: 720px; margin: 0 auto; }
  .card { background: var(--card); border-radius: 16px; border: 1px solid var(--border); padding: 24px; margin-bottom: 16px; overflow: hidden; }
  .header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .brand { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; }
  .title { font-size: 22px; font-weight: 800; color: var(--text); line-height: 1.2; }
  .meta { font-size: 13px; color: var(--muted); margin-top: 2px; }
  .badge { display: inline-block; background: var(--accent); color: white; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
  .summary { font-size: 14px; color: var(--text); line-height: 1.65; background: var(--accent-light); border-left: 4px solid var(--accent); padding: 14px 16px; border-radius: 0 8px 8px 0; }
  .summary strong { color: var(--accent); }
  h2 { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); padding: 8px 10px; background: var(--bg); border-bottom: 2px solid var(--border); }
  td { padding: 9px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .change-pos { color: var(--green); font-weight: 600; }
  .change-neg { color: var(--red); font-weight: 600; }
  .tag { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 2px 7px; border-radius: 10px; }
  .tag-hot { background: var(--red-light); color: var(--red); }
  .tag-warm { background: var(--orange-light); color: var(--orange); }
  .tag-qualified { background: var(--green-light); color: var(--green); }
  .tag-contacted { background: var(--accent-light); color: var(--accent); }
  .tag-dormant { background: var(--bg); color: var(--muted); border: 1px solid var(--border); }
  .hot-grid { display: flex; flex-direction: column; gap: 10px; }
  .hot-item { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; border-left: 4px solid var(--red); }
  .hot-item-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
  .hot-item-name { font-weight: 700; font-size: 14px; }
  .hot-item-company { font-size: 12px; color: var(--muted); }
  .hot-item-why { font-size: 13px; color: var(--text); margin-bottom: 8px; }
  .hot-item-action { font-size: 12px; background: var(--red-light); color: var(--red); padding: 6px 10px; border-radius: 6px; font-weight: 600; }
  .dormant-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
  .dormant-item:last-child { border-bottom: none; }
  .dormant-days { font-weight: 700; color: var(--orange); min-width: 28px; text-align: right; }
  .escalation-card { background: #FEF9EE; border: 1px solid #F59E0B; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
  .escalation-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .escalation-title { font-weight: 700; font-size: 14px; }
  .escalation-desc { font-size: 13px; color: var(--text); margin-bottom: 8px; }
  .escalation-decision { font-size: 12px; font-weight: 600; background: #FEF3C7; color: #92400E; padding: 6px 10px; border-radius: 6px; display: inline-block; }
  .health-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 13px; border-bottom: 1px solid var(--border); }
  .health-row:last-child { border-bottom: none; }
  .health-check { color: var(--green); font-weight: 700; }
  .health-score { font-size: 28px; font-weight: 800; color: var(--green); text-align: center; padding: 16px 0 4px; }
  .health-label { font-size: 12px; color: var(--muted); text-align: center; padding-bottom: 12px; }
  .action-item { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
  .action-item:last-child { border-bottom: none; }
  .action-num { background: var(--accent); color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .action-text { flex: 1; }
  .action-lead { font-weight: 700; color: var(--accent); }
  .action-owner { color: var(--muted); font-size: 12px; }
  .trend-row { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
  .trend-row:last-child { border-bottom: none; }
  .trend-week { color: var(--muted); min-width: 130px; }
  .trend-val { font-weight: 600; min-width: 60px; text-align: right; }
  .trend-rate { min-width: 80px; text-align: right; }
  .footer { text-align: center; font-size: 11px; color: var(--muted); padding: 16px 0 8px; }
  .demo-banner { background: #fff8e8; border: 1px solid #d4b88b; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; color: #8a5a00; text-align: center; }
  @media (max-width: 480px) { body { padding: 10px; } .card { padding: 18px; } table { font-size: 12px; } }
</style>
</head>
<body>
<div class="demo-banner">📄 Demo Report — This is a sample report generated by Qiyadon's pipeline execution service. Client "CloudSync Pro" is fictional.</div>
${reportHTML}
</body>
</html>`;

const transporter = nodemailer.createTransport({
  host: creds.smtp.host,
  port: creds.smtp.port,
  secure: creds.smtp.secure,
  auth: { user: creds.user, pass: creds.password },
  tls: { rejectUnauthorized: false }
});

transporter.sendMail({
  from: { name: 'Qiyadon', address: 'contact@qiyadon.com' },
  to: 'ahmad.salim@qiyadon.com',
  subject: 'Pipeline Report — CloudSync Pro | Week Apr 27–May 3, 2026 [DEMO]',
  html: emailHtml
}, (err, info) => {
  if (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
  console.log('Sent:', info.messageId);
  process.exit(0);
});
