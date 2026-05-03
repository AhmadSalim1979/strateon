# Qiyadon Invoice Template

> This is an HTML invoice template. Use as a standalone HTML file, convert to PDF, or send as an HTML email.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice — Qiyadon</title>
<style>
  /* ── Reset & Base ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 14px;
    color: #1a1a2e;
    background: #f4f4f9;
    padding: 40px 20px;
  }

  /* ── Invoice Wrapper ── */
  .invoice-wrapper {
    max-width: 720px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    overflow: hidden;
  }

  /* ── Header ── */
  .invoice-header {
    background: #1a1a2e;
    color: #ffffff;
    padding: 40px 48px 32px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }
  .company-brand .brand-name {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: #ffffff;
  }
  .company-brand .brand-tagline {
    font-size: 12px;
    color: #a0a8d8;
    margin-top: 4px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .company-brand .logo-placeholder {
    width: 120px;
    height: 40px;
    background: rgba(255,255,255,0.1);
    border: 1px dashed rgba(255,255,255,0.3);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    margin-bottom: 12px;
  }
  .invoice-meta {
    text-align: right;
    font-size: 13px;
  }
  .invoice-meta .label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #a0a8d8;
    margin-bottom: 6px;
  }
  .invoice-meta .value {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 14px;
  }
  .invoice-meta .meta-row {
    margin-bottom: 4px;
    color: #c8d0e8;
  }
  .invoice-meta .meta-row strong {
    color: #ffffff;
    font-weight: 600;
  }

  /* ── Addresses ── */
  .addresses {
    display: flex;
    gap: 48px;
    padding: 36px 48px 24px;
    border-bottom: 1px solid #eef0f8;
  }
  .address-block .address-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9090b0;
    margin-bottom: 10px;
    font-weight: 600;
  }
  .address-block .company-name {
    font-size: 15px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 4px;
  }
  .address-block .contact-name {
    font-size: 13px;
    color: #3a3a5c;
    margin-bottom: 2px;
  }
  .address-block .email {
    font-size: 13px;
    color: #5a5a8a;
  }
  .address-block .address-lines {
    font-size: 13px;
    color: #3a3a5c;
    line-height: 1.6;
    margin-top: 6px;
  }

  /* ── Service Period Banner ── */
  .service-period {
    background: #f0f1fb;
    padding: 14px 48px;
    border-bottom: 1px solid #eef0f8;
    font-size: 13px;
    color: #3a3a5c;
  }
  .service-period strong {
    color: #1a1a2e;
    font-weight: 600;
  }

  /* ── Line Items Table ── */
  .line-items {
    padding: 28px 48px;
  }
  .line-items table {
    width: 100%;
    border-collapse: collapse;
  }
  .line-items thead tr {
    border-bottom: 2px solid #1a1a2e;
  }
  .line-items thead th {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9090b0;
    font-weight: 600;
    padding: 0 0 12px;
    text-align: left;
  }
  .line-items thead th:last-child,
  .line-items thead th:nth-child(3) {
    text-align: right;
  }
  .line-items thead th:nth-child(2) {
    text-align: center;
  }
  .line-items tbody tr {
    border-bottom: 1px solid #eef0f8;
  }
  .line-items tbody td {
    padding: 16px 0;
    font-size: 14px;
    color: #1a1a2e;
    vertical-align: top;
  }
  .line-items tbody td:last-child,
  .line-items tbody td:nth-child(3) {
    text-align: right;
    font-weight: 600;
  }
  .line-items tbody td:nth-child(2) {
    text-align: center;
    color: #5a5a8a;
  }
  .line-items .item-desc {
    color: #3a3a5c;
    font-size: 12px;
    margin-top: 4px;
  }

  /* ── Totals ── */
  .totals {
    padding: 0 48px 32px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .totals table {
    width: 280px;
    border-collapse: collapse;
  }
  .totals tr.row-subtotal td,
  .totals tr.row-tax td {
    padding: 8px 0;
    font-size: 13px;
    color: #3a3a5c;
    border-bottom: 1px solid #eef0f8;
  }
  .totals tr.row-subtotal td:last-child,
  .totals tr.row-tax td:last-child {
    text-align: right;
    font-weight: 500;
  }
  .totals tr.row-total td {
    padding: 14px 0 4px;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
    border-top: 2px solid #1a1a2e;
  }
  .totals tr.row-total td:last-child {
    text-align: right;
  }
  .totals .tax-note {
    font-size: 11px;
    color: #9090b0;
    margin-top: 4px;
  }

  /* ── Payment Terms ── */
  .payment-section {
    background: #f9fafc;
    padding: 28px 48px;
    border-top: 1px solid #eef0f8;
  }
  .section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9090b0;
    font-weight: 600;
    margin-bottom: 14px;
  }
  .payment-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .payment-terms-box {
    font-size: 13px;
    color: #3a3a5c;
    line-height: 1.7;
  }
  .payment-terms-box strong {
    color: #1a1a2e;
  }
  .payment-terms-box .terms-highlight {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    padding: 10px 14px;
    margin-top: 10px;
    font-size: 13px;
    color: #1a1a2e;
  }
  .bank-details-box {
    font-size: 13px;
    color: #3a3a5c;
    line-height: 1.7;
  }
  .bank-details-box .detail-row {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;
  }
  .bank-details-box .detail-label {
    color: #9090b0;
    min-width: 100px;
    font-size: 12px;
  }
  .bank-details-box .detail-value {
    color: #1a1a2e;
    font-weight: 500;
  }

  /* ── Late Payment Notice ── */
  .late-payment-notice {
    border-top: 1px solid #eef0f8;
    padding: 20px 48px;
    background: #fff5f5;
  }
  .late-payment-notice p {
    font-size: 12px;
    color: #8b0000;
    line-height: 1.6;
  }
  .late-payment-notice strong {
    font-weight: 700;
  }

  /* ── Footer ── */
  .invoice-footer {
    background: #1a1a2e;
    padding: 20px 48px;
    text-align: center;
    font-size: 11px;
    color: #7070a0;
    letter-spacing: 0.3px;
  }
  .invoice-footer a {
    color: #a0a8d8;
    text-decoration: none;
  }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    .addresses { flex-direction: column; gap: 24px; padding: 24px 24px 20px; }
    .invoice-header { padding: 28px 24px 20px; flex-direction: column; }
    .invoice-meta { text-align: left; }
    .service-period { padding: 12px 24px; }
    .line-items { padding: 20px 24px; }
    .totals { padding: 0 24px 24px; }
    .payment-section { padding: 24px; }
    .payment-grid { grid-template-columns: 1fr; gap: 20px; }
    .late-payment-notice { padding: 16px 24px; }
    .invoice-footer { padding: 16px 24px; }
  }
</style>
</head>
<body>

<div class="invoice-wrapper">

  <!-- ── Header ── -->
  <div class="invoice-header">
    <div class="company-brand">
      <!-- Replace with: <img src="https://qiyadon.com/logo.png" alt="Qiyadon" class="logo-img" style="max-width:140px;margin-bottom:12px;"> -->
      <div class="logo-placeholder"><!-- Qiyadon Logo --></div>
      <div class="brand-name">Qiyadon</div>
      <div class="brand-tagline">Strategy, Executed.</div>
      <div style="margin-top:16px; font-size:12px; color:#c8d0e8; line-height:1.7;">
        <div>ahmad.salim@qiyadon.com</div>
        <div>qiyadon.com</div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="label">Invoice</div>
      <div class="value">#{{INVOICE_NUMBER}}</div>
      <div class="meta-row"><strong>Date:</strong> {{INVOICE_DATE}}</div>
      <div class="meta-row"><strong>Due:</strong> {{DUE_DATE}}</div>
      <div class="meta-row"><strong>Terms:</strong> Net 30</div>
    </div>
  </div>

  <!-- ── Addresses ── -->
  <div class="addresses">
    <div class="address-block">
      <div class="address-label">From</div>
      <div class="company-name">Qiyadon</div>
      <div class="contact-name">Ahmad Salim</div>
      <div class="email">ahmad.salim@qiyadon.com</div>
      <div class="address-lines">
        qiyadon.com<br>
      </div>
    </div>
    <div class="address-block">
      <div class="address-label">Bill To</div>
      <div class="company-name">{{CLIENT_COMPANY_NAME}}</div>
      <div class="contact-name">{{CLIENT_CONTACT_NAME}}</div>
      <div class="email">{{CLIENT_EMAIL}}</div>
      <div class="address-lines">
        {{CLIENT_ADDRESS_LINE_1}}<br>
        {{CLIENT_ADDRESS_LINE_2}}
      </div>
    </div>
  </div>

  <!-- ── Service Period ── -->
  <div class="service-period">
    <strong>Service Period:</strong> {{SERVICE_PERIOD_START}} — {{SERVICE_PERIOD_END}}
  </div>

  <!-- ── Line Items ── -->
  <div class="line-items">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            {{PLAN_NAME}} Plan
            <div class="item-desc">{{PLAN_DESCRIPTION}}</div>
          </td>
          <td>1</td>
          <td>{{UNIT_PRICE}}</td>
          <td>{{LINE_TOTAL}}</td>
        </tr>
        <!-- Additional line items can be added here -->
        <!--
        <tr>
          <td>
            Additional Service
            <div class="item-desc">Description of add-on</div>
          </td>
          <td>1</td>
          <td>$XXX</td>
          <td>$XXX</td>
        </tr>
        -->
      </tbody>
    </table>
  </div>

  <!-- ── Totals ── -->
  <div class="totals">
    <table>
      <tbody>
        <tr class="row-subtotal">
          <td>Subtotal</td>
          <td>{{SUBTOTAL}}</td>
        </tr>
        <tr class="row-tax">
          <td>Tax {{TAX_RATE}}% {{#if VAT_REGISTERED}}(VAT){{/if}}</td>
          <td>{{TAX_AMOUNT}}</td>
        </tr>
        <tr class="row-total">
          <td>Total Due</td>
          <td>{{GRAND_TOTAL}}</td>
        </tr>
      </tbody>
    </table>
    <div class="tax-note" style="text-align:right; margin-top:6px;">
      {{#if VAT_REGISTERED}}* VAT registered — {{VAT_NUMBER}}{{else}}* VAT not applicable{{/if}}
    </div>
  </div>

  <!-- ── Payment Section ── -->
  <div class="payment-section">
    <div class="section-title">Payment Information</div>
    <div class="payment-grid">
      <div class="payment-terms-box">
        <strong>Payment Terms</strong><br>
        Payment is due within <strong>30 days</strong> of the invoice date.<br>
        Please include the invoice number (#{{INVOICE_NUMBER}}) in your payment reference.
        <div class="terms-highlight">
          ⚠️ Late payments are subject to a <strong>2% monthly late fee</strong> on overdue balances.
        </div>
      </div>
      <div class="bank-details-box">
        <strong>Payment Methods</strong><br><br>
        <div class="detail-row">
          <span class="detail-label">Bank Transfer</span>
          <span class="detail-value">{{BANK_DETAILS}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Account Name</span>
          <span class="detail-value">{{ACCOUNT_NAME}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">IBAN</span>
          <span class="detail-value">{{IBAN}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">SWIFT/BIC</span>
          <span class="detail-value">{{SWIFT}}</span>
        </div>
        <br>
        <div class="detail-row">
          <span class="detail-label">Online Pay</span>
          <span class="detail-value"><a href="{{PAYMENT_LINK}}">{{PAYMENT_LINK}}</a></span>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Late Payment Notice ── -->
  <div class="late-payment-notice">
    <p>
      <strong>Late Payment Policy:</strong> Invoices not paid within 30 days of the due date
      are subject to a monthly late fee of 2% on the outstanding balance, compounded monthly.
      Qiyadon reserves the right to suspend services for accounts with balances overdue by
      more than 15 days, and to pursue collection efforts for balances overdue by more than 60 days.
      All costs associated with collection (including legal fees) shall be borne by the client.
    </p>
  </div>

  <!-- ── Footer ── -->
  <div class="invoice-footer">
    Qiyadon &nbsp;|&nbsp; ahmad.salim@qiyadon.com &nbsp;|&nbsp; qiyadon.com<br>
    This invoice was generated by Qiyadon. Thank you for your business.
  </div>

</div>

</body>
</html>
```

---

## Placeholder Reference Table

| Placeholder | Description | Example |
|---|---|---|
| `{{INVOICE_NUMBER}}` | Sequential invoice number | `STRT-0001` |
| `{{INVOICE_DATE}}` | Invoice issue date | `April 28, 2026` |
| `{{DUE_DATE}}` | Payment due date (INVOICE_DATE + 30 days) | `May 28, 2026` |
| `{{CLIENT_COMPANY_NAME}}` | Client's company | `Acme Corp` |
| `{{CLIENT_CONTACT_NAME}}` | Client's billing contact | `Jane Doe` |
| `{{CLIENT_EMAIL}}` | Client's billing email | `jane@acme.com` |
| `{{CLIENT_ADDRESS_LINE_1}}` | Address line 1 | `123 Main St` |
| `{{CLIENT_ADDRESS_LINE_2}}` | Address line 2 (city, country) | `New York, NY` |
| `{{SERVICE_PERIOD_START}}` | Service period start | `April 1, 2026` |
| `{{SERVICE_PERIOD_END}}` | Service period end | `April 30, 2026` |
| `{{PLAN_NAME}}` | Starter / Growth / Scale | `Growth` |
| `{{PLAN_DESCRIPTION}}` | Plan descriptor | `Full-service strategic execution` |
| `{{UNIT_PRICE}}` | Monthly price | `$750` |
| `{{LINE_TOTAL}}` | Line total (qty × price) | `$750` |
| `{{SUBTOTAL}}` | Sum of all line items | `$750` |
| `{{TAX_RATE}}` | Tax rate % | `0` |
| `{{TAX_AMOUNT}}` | Tax amount | `$0` |
| `{{VAT_REGISTERED}}` | Whether VAT applies (boolean) | `false` |
| `{{VAT_NUMBER}}` | VAT registration number | `DE123456789` |
| `{{GRAND_TOTAL}}` | Subtotal + Tax | `$750` |
| `{{BANK_DETAILS}}` | Bank name | `Deutsche Bank` |
| `{{ACCOUNT_NAME}}` | Bank account holder name | `Qiyadon GmbH` |
| `{{IBAN}}` | IBAN | `DE89 3704 0044 0532 0130 00` |
| `{{SWIFT}}` | SWIFT/BIC code | `COBADEFFXXX` |
| `{{PAYMENT_LINK}}` | Online payment URL | `https://pay.qiyadon.com/invoice/…` |

---

## Notes

- **Invoice numbering scheme:** Use `STRT-0001`, `STRT-0002`, etc. (zero-padded, 4 digits minimum). Keep a running counter.
- **Pricing tiers as of 2026-04-28:**
  - Starter — $300/month
  - Growth — $750/month
  - Scale — $1,500+/month (custom quote)
- **VAT:** Update placeholders if you register for VAT in any EU jurisdiction.
- **PDF conversion:** Works with browser print-to-PDF, or tools like wkhtmltopdf, Puppeteer, and WeasyPrint.
- **HTML email:** Strip the `<style>` block and inlined styles (or use a CSS inliner) before sending via your email platform.
