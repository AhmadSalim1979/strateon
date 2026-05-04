const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp0001.neo.space',
  port: 465,
  secure: true,
  auth: {
    user: 'contact@qiyadon.com',
    pass: '@iy@d0n.c0m'
  }
});

const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice — Qiyadon</title>
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #1a1a2e; background: #f4f4f9; padding: 40px 20px; }
  .invoice-wrapper { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
  .invoice-header { background: #1a1a2e; color: #ffffff; padding: 40px 48px 32px; display: flex; justify-content: space-between; }
  .brand-name { font-size: 28px; font-weight: 700; color: #ffffff; }
  .brand-tagline { font-size: 12px; color: #a0a8d8; margin-top: 4px; text-transform: uppercase; }
  .invoice-meta { text-align: right; }
  .invoice-meta .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a0a8d8; }
  .invoice-meta .value { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 14px; }
  .invoice-meta .meta-row { margin-bottom: 4px; color: #c8d0e8; }
  .invoice-meta .meta-row strong { color: #ffffff; }
  .addresses { display: flex; gap: 48px; padding: 36px 48px 24px; border-bottom: 1px solid #eef0f8; }
  .address-block .address-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9090b0; margin-bottom: 10px; font-weight: 600; }
  .address-block .company-name { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .address-block .contact-name { font-size: 13px; color: #3a3a5c; }
  .address-block .email { font-size: 13px; color: #5a5a8a; }
  .address-block .address-lines { font-size: 13px; color: #3a3a5c; line-height: 1.6; margin-top: 6px; }
  .service-period { background: #f0f1fb; padding: 14px 48px; border-bottom: 1px solid #eef0f8; font-size: 13px; color: #3a3a5c; }
  .service-period strong { color: #1a1a2e; }
  .line-items { padding: 28px 48px; }
  .line-items table { width: 100%; border-collapse: collapse; }
  .line-items thead tr { border-bottom: 2px solid #1a1a2e; }
  .line-items thead th { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9090b0; font-weight: 600; padding: 0 0 12px; text-align: left; }
  .line-items thead th:last-child { text-align: right; }
  .line-items tbody tr { border-bottom: 1px solid #eef0f8; }
  .line-items tbody td { padding: 16px 0; font-size: 14px; color: #1a1a2e; }
  .line-items tbody td:last-child { text-align: right; font-weight: 600; }
  .item-desc { color: #5a5a8a; font-size: 12px; margin-top: 4px; }
  .totals { padding: 0 48px 32px; display: flex; flex-direction: column; align-items: flex-end; }
  .totals table { width: 280px; border-collapse: collapse; }
  .totals .row-subtotal td, .totals .row-tax td { padding: 8px 0; font-size: 13px; color: #3a3a5c; border-bottom: 1px solid #eef0f8; }
  .totals .row-subtotal td:last-child, .totals .row-tax td:last-child { text-align: right; font-weight: 500; }
  .totals .row-total td { padding: 14px 0 4px; font-size: 18px; font-weight: 700; color: #1a1a2e; border-top: 2px solid #1a1a2e; }
  .totals .row-total td:last-child { text-align: right; }
  .payment-section { background: #f9fafc; padding: 28px 48px; border-top: 1px solid #eef0f8; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9090b0; font-weight: 600; margin-bottom: 14px; }
  .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .payment-terms-box { font-size: 13px; color: #3a3a5c; line-height: 1.7; }
  .payment-terms-box strong { color: #1a1a2e; }
  .terms-highlight { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px 14px; margin-top: 10px; }
  .bank-details-box { font-size: 13px; color: #3a3a5c; line-height: 1.7; }
  .bank-details-box .detail-row { display: flex; gap: 8px; margin-bottom: 4px; }
  .bank-details-box .detail-label { color: #9090b0; min-width: 100px; font-size: 12px; }
  .bank-details-box .detail-value { color: #1a1a2e; font-weight: 500; }
  .late-payment-notice { border-top: 1px solid #eef0f8; padding: 20px 48px; background: #fff5f5; }
  .late-payment-notice p { font-size: 12px; color: #8b0000; line-height: 1.6; }
  .invoice-footer { background: #1a1a2e; padding: 20px 48px; text-align: center; font-size: 11px; color: #7070a0; }
</style>
</head>
<body>
<div class="invoice-wrapper">
  <div class="invoice-header">
    <div>
      <div class="brand-name">Qiyadon</div>
      <div class="brand-tagline">Pipeline Execution, Done For You.</div>
      <div style="margin-top:16px; font-size:12px; color:#c8d0e8; line-height:1.7;">
        <div>ahmad@qiyadon.com</div><div>qiyadon.com</div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="label">Invoice</div>
      <div class="value">#QIY-0001</div>
      <div class="meta-row"><strong>Date:</strong> May 1, 2026</div>
      <div class="meta-row"><strong>Due:</strong> May 31, 2026</div>
      <div class="meta-row"><strong>Terms:</strong> Net 30</div>
    </div>
  </div>
  <div class="addresses">
    <div class="address-block">
      <div class="address-label">From</div>
      <div class="company-name">Qiyadon</div>
      <div class="contact-name">Ahmad Salim</div>
      <div class="email">ahmad@qiyadon.com</div>
      <div class="address-lines">qiyadon.com<br>[VERIFY: Full registered business address]</div>
    </div>
    <div class="address-block">
      <div class="address-label">Bill To</div>
      <div class="company-name">[VERIFY: Client Company Name]</div>
      <div class="contact-name">[VERIFY: Client Contact Name]</div>
      <div class="email">[VERIFY: Client billing email]</div>
      <div class="address-lines">[VERIFY: Client address]</div>
    </div>
  </div>
  <div class="service-period"><strong>Service Period:</strong> April 1, 2026 — April 30, 2026</div>
  <div class="line-items">
    <table>
      <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
      <tbody>
        <tr>
          <td>[PLAN_NAME] Plan — Qiyadon Pipeline Execution<div class="item-desc">[VERIFY: Plan description]</div></td>
          <td>1</td>
          <td>[VERIFY: Unit price]</td>
          <td>[VERIFY: Total]</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="totals">
    <table>
      <tbody>
        <tr class="row-subtotal"><td>Subtotal</td><td>[VERIFY: Subtotal]</td></tr>
        <tr class="row-tax"><td>Tax [VERIFY: Tax rate]%</td><td>[VERIFY: Tax amount]</td></tr>
        <tr class="row-total"><td>Total Due</td><td>[VERIFY: Grand total]</td></tr>
      </tbody>
    </table>
  </div>
  <div class="payment-section">
    <div class="section-title">Payment Information</div>
    <div class="payment-grid">
      <div class="payment-terms-box">
        <strong>Payment Terms</strong><br>
        Payment due within <strong>30 days</strong>. Include invoice #QIY-0001 in payment reference.<br>
        <div class="terms-highlight">⚠️ Late payments subject to <strong>2% monthly late fee</strong>.</div>
      </div>
      <div class="bank-details-box">
        <strong>Payment Methods</strong><br><br>
        <div class="detail-row"><span class="detail-label">Bank</span><span class="detail-value">[VERIFY: Bank name]</span></div>
        <div class="detail-row"><span class="detail-label">Account Name</span><span class="detail-value">[VERIFY: Account name]</span></div>
        <div class="detail-row"><span class="detail-label">IBAN</span><span class="detail-value">[VERIFY: IBAN]</span></div>
        <div class="detail-row"><span class="detail-label">SWIFT/BIC</span><span class="detail-value">[VERIFY: SWIFT/BIC]</span></div>
      </div>
    </div>
  </div>
  <div class="late-payment-notice">
    <p><strong>Late Payment Policy:</strong> Invoices not paid within 30 days are subject to 2% monthly late fee. Qiyadon reserves the right to suspend services for accounts overdue by more than 15 days, and to pursue collection for balances overdue by more than 60 days. All collection costs (including legal fees) borne by client.</p>
  </div>
  <div class="invoice-footer">Qiyadon &nbsp;|&nbsp; ahmad@qiyadon.com &nbsp;|&nbsp; qiyadon.com<br>This is a sample invoice with [VERIFY] placeholders. Replace before sending to clients.</div>
</div>
</body>
</html>`;

const paymentSummaryHtml = `
<h2>Qiyadon — Payment Options Summary</h2>
<p><strong>Use Stripe as primary payment method.</strong> Bank transfer as backup on invoices. PayPal only if clients specifically ask.</p>

<h3>1. Stripe (RECOMMENDED)</h3>
<ul>
  <li><strong>Pros:</strong> Industry standard, professional, instant payment, no code required (Payment Links)</li>
  <li><strong>Fees:</strong> 2.9% + €0.30 per transaction</li>
  <li><strong>Time to set up:</strong> 2–3 hours</li>
  <li><strong>Example:</strong> On a $750 invoice → ~$22.20 fees → you receive $727.80</li>
</ul>

<h3>2. Bank Transfer (PRIMARY BACKUP)</h3>
<ul>
  <li><strong>Pros:</strong> Zero fees for SEPA, direct to your account</li>
  <li><strong>Cons:</strong> 1–5 business days, no auto-tracking</li>
  <li><strong>What you need:</strong> IBAN, SWIFT/BIC, account name</li>
</ul>

<h3>3. PayPal (ONLY IF CLIENTS ASK)</h3>
<ul>
  <li><strong>Skip for now.</strong> Only set up if 2+ clients specifically request it.</li>
</ul>

<h3>Action List — Do This Week</h3>
<ol>
  <li>Open Stripe account → https://dashboard.stripe.com/register</li>
  <li>Complete Stripe verification (1–24 hours) — blocking before real payments</li>
  <li>Create Payment Links for Starter ($300) and Growth ($750) plans</li>
  <li>Confirm bank details (IBAN, SWIFT/BIC) and add to invoice template</li>
  <li>Add payment links to qiyadon.com/pay (pass to CTO)</li>
  <li>Test with Stripe test mode</li>
</ol>

<h3>Fees at a Glance</h3>
<table>
<tr><td><strong>Stripe (card)</strong></td><td>2.9% + €0.30</td></tr>
<tr><td><strong>PayPal</strong></td><td>2.9% + $0.30</td></tr>
<tr><td><strong>Bank transfer (SEPA)</strong></td><td>€0–2 flat</td></tr>
<tr><td><strong>International wire</strong></td><td>$15–50 flat</td></tr>
</table>

<p style="font-size:12px;color:#9090b0;">Prepared by: CFO (Moosa) | 2026-05-01 | For internal review</p>
`;

async function sendEmails() {
  try {
    console.log('Sending invoice template...');
    await transporter.sendMail({
      from: 'Qiyadon CFO <contact@qiyadon.com>',
      to: 'ahmad.salim@qiyadon.com',
      subject: 'SAMPLE: Qiyadon Invoice Template (#QIY-0001)',
      html: invoiceHtml
    });
    console.log('Invoice sent ✓');

    console.log('Sending payment summary...');
    await transporter.sendMail({
      from: 'Qiyadon CFO <contact@qiyadon.com>',
      to: 'ahmad.salim@qiyadon.com',
      subject: 'SAMPLE: Qiyadon Payment Options Summary',
      html: paymentSummaryHtml
    });
    console.log('Payment summary sent ✓');
    console.log('Both emails delivered successfully');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

sendEmails();