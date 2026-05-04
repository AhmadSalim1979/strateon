# Qiyadon — Invoice Template (Credit Card)
**Owner:** CFO  
**Date:** 2026-05-04  
**Status:** 🆕 New — Credit Card Payment Version  
**Note:** This is a variant of `INVOICE-TEMPLATE-FINAL.md` adapted for credit card payments via Stripe. All placeholder fields marked [VERIFY] must be confirmed with Ahmad before use.

---

> **⚠️ IMPORTANT — Fields marked [VERIFY] MUST be confirmed with Ahmad before use.**
>
> This template uses Qiyadon details with credit card payment option added.
> - Invoice number: **#QIY-0002** (next sequential after #QIY-0001)
> - Credit card payment section added (Stripe)
> - Bank transfer section retained as [VERIFY] for clients who prefer wire
> - All placeholder values clearly marked [VERIFY]
>
> **Do not send this invoice without replacing every [VERIFY] field.**

---

## Filled Template (HTML)

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
  .payment-options-box {
    font-size: 13px;
    color: #3a3a5c;
    line-height: 1.7;
  }
  .payment-options-box .detail-row {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;
  }
  .payment-options-box .detail-label {
    color: #9090b0;
    min-width: 100px;
    font-size: 12px;
  }
  .payment-options-box .detail-value {
    color: #1a1a2e;
    font-weight: 500;
  }
  .stripe-box {
    background: #f0f4ff;
    border: 1px solid #c7d2ff;
    border-radius: 6px;
    padding: 14px 16px;
    margin-top: 12px;
  }
  .stripe-box strong {
    color: #1a1a2e;
    font-size: 13px;
  }
  .stripe-box .stripe-link {
    display: inline-block;
    margin-top: 8px;
    padding: 8px 16px;
    background: #635bff;
    color: #ffffff;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 600;
    font-size: 13px;
  }
  .stripe-box .stripe-link:hover {
    background: #5046e5;
  }
  .stripe-box .stripe-note {
    margin-top: 8px;
    font-size: 11px;
    color: #5a5a8a;
    line-height: 1.5;
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
      <div class="brand-tagline">Pipeline Execution, Done For You.</div>
      <div style="margin-top:16px; font-size:12px; color:#c8d0e8; line-height:1.7;">
        <div>ahmad@qiyadon.com</div>
        <div>qiyadon.com</div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="label">Invoice</div>
      <div class="value">#QIY-0002</div>
      <div class="meta-row"><strong>Date:</strong> May 1, 2026</div>
      <div class="meta-row"><strong>Due:</strong> May 31, 2026</div>
      <div class="meta-row"><strong>Terms:</strong> Net 30</div>
    </div>
  </div>

  <!-- ── Addresses ── -->
  <div class="addresses">
    <div class="address-block">
      <div class="address-label">From</div>
      <div class="company-name">Qiyadon</div>
      <div class="contact-name">Ahmad Salim</div>
      <div class="email">ahmad@qiyadon.com</div>
      <div class="address-lines">
        qiyadon.com<br>
        [VERIFY: Full registered business address — e.g. Berlin, Germany]
      </div>
    </div>
    <div class="address-block">
      <div class="address-label">Bill To</div>
      <div class="company-name">[VERIFY: Client Company Name]</div>
      <div class="contact-name">[VERIFY: Client Contact Name]</div>
      <div class="email">[VERIFY: Client billing email]</div>
      <div class="address-lines">
        [VERIFY: Client address line 1]<br>
        [VERIFY: Client city, country]
      </div>
    </div>
  </div>

  <!-- ── Service Period ── -->
  <div class="service-period">
    <strong>Service Period:</strong> April 1, 2026 — April 30, 2026
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
            [PLAN_NAME] Plan — Qiyadon Pipeline Execution
            <div class="item-desc">[VERIFY: Plan description — e.g. "Up to 50 active leads, weekly reporting, WhatsApp follow-up"]</div>
          </td>
          <td>1</td>
          <td>[VERIFY: Unit price — e.g. $300]</td>
          <td>[VERIFY: Line total — e.g. $300]</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ── Totals ── -->
  <div class="totals">
    <table>
      <tbody>
        <tr class="row-subtotal">
          <td>Subtotal</td>
          <td>[VERIFY: Subtotal]</td>
        </tr>
        <tr class="row-tax">
          <td>Tax [VERIFY: Tax rate]% [if applicable]</td>
          <td>[VERIFY: Tax amount — $0 if not VAT registered]</td>
        </tr>
        <tr class="row-total">
          <td>Total Due</td>
          <td>[VERIFY: Grand total]</td>
        </tr>
      </tbody>
    </table>
    <div class="tax-note" style="text-align:right; margin-top:6px;">
      *[VERIFY: VAT status — if VAT registered, show VAT number here. If not, delete this line or show "VAT not applicable"]
    </div>
  </div>

  <!-- ── Payment Section ── -->
  <div class="payment-section">
    <div class="section-title">Payment Information</div>
    <div class="payment-grid">
      <div class="payment-terms-box">
        <strong>Payment Terms</strong><br>
        Payment is due within <strong>30 days</strong> of the invoice date.<br>
        Please include the invoice number (#QIY-0002) in your payment reference.
        <div class="terms-highlight">
          ⚠️ Late payments are subject to a <strong>2% monthly late fee</strong> on overdue balances.
        </div>
      </div>
      <div class="payment-options-box">
        <strong>Payment Options</strong><br><br>

        <!-- Credit Card Option -->
        <div class="stripe-box">
          <strong>💳 Pay by Credit Card</strong><br>
          <a href="[VERIFY: Stripe Payment Link — e.g. https://buy.stripe.com/xxxxx]" class="stripe-link" target="_blank">
            Pay Now via Stripe
          </a>
          <div class="stripe-note">
            Pay securely via credit or debit card. 2.9% + €0.30 transaction fee applies per invoice.
          </div>
        </div>

        <br>

        <!-- Bank Transfer Option (retained for clients who prefer wire) -->
        <div class="detail-row">
          <span class="detail-label">Bank</span>
          <span class="detail-value">[VERIFY: Bank name — e.g. "Deutsche Bank"]</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Account Name</span>
          <span class="detail-value">[VERIFY: Exact name on bank account — e.g. "Qiyadon GmbH" or "Ahmad Salim"]</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">IBAN</span>
          <span class="detail-value">[VERIFY: Your IBAN — e.g. "DE89 3704 0044 0532 0130 00"]</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">SWIFT/BIC</span>
          <span class="detail-value">[VERIFY: SWIFT/BIC code — e.g. "COBADEFFXXX"]</span>
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
    Qiyadon &nbsp;|&nbsp; ahmad@qiyadon.com &nbsp;|&nbsp; qiyadon.com<br>
    This invoice was generated by Qiyadon. Thank you for your business.
  </div>

</div>

</body>
</html>
```

---

## Field Verification Checklist

**Before sending any invoice, confirm these [VERIFY] fields:**

| Field | Replace With | Status |
|---|---|---|
| `#QIY-0002` | Next sequential invoice number | ✅ Replace |
| Invoice date | Today's date | ✅ Replace |
| Due date | Invoice date + 30 days | ✅ Replace |
| From: Company name | Qiyadon | ✅ Confirmed |
| From: Address | [VERIFY: Full registered address] | ⏳ Pending |
| From: Email | ahmad@qiyadon.com | ✅ Confirmed |
| Bill To: Client details | From client onboarding form | ⏳ Per-client |
| Service Period | Billing month | ✅ Confirmed |
| Plan Name | Starter / Growth / Scale | ⏳ Per-client |
| Plan Description | Plan-specific description | ⏳ Per-client |
| Unit Price / Line Total | $300 / $750 / Custom | ⏳ Per-client |
| Subtotal / Grand Total | Calculated | ⏳ Per-client |
| Tax rate | 0 (unless VAT registered) | ⏳ Verify VAT status |
| **Stripe Payment Link** | [VERIFY: Stripe Payment Link — e.g. https://buy.stripe.com/xxxxx] | ⏳ **Required before use** |
| Bank name | [VERIFY: Your bank's name] | ⏳ Pending |
| Account Name | [VERIFY: Exact name on account] | ⏳ Pending |
| IBAN | [VERIFY: Your IBAN] | ⏳ Pending |
| SWIFT/BIC | [VERIFY: Your SWIFT] | ⏳ Pending |
| VAT number | [VERIFY: If VAT registered in EU] | ⏳ Pending |

---

## Invoice Numbering Scheme

Qiyadon invoices use the prefix **QIY-** followed by a 4-digit sequential number:
- First invoice: `QIY-0001`
- Second invoice: `QIY-0002`
- etc.

Keep a running log of invoice numbers in `FINANCIAL-TRACKING.md`.

---

## What Changed vs. INVOICE-TEMPLATE-FINAL.md

| Change | Details |
|---|---|
| Invoice Number | `#QIY-0002` (was `#QIY-0001`) |
| Payment Methods → Payment Options | Header changed |
| Credit Card Section Added | Stripe box with payment link + 2.9% + €0.30 fee note |
| Bank Transfer Retained | All bank fields kept as `[VERIFY]` for wire transfer clients |
| Payment Terms Reference | Updated to `#QIY-0002` |

---

*Prepared by: CFO (Moosa) | 2026-05-04 | Credit Card variant of INVOICE-TEMPLATE-FINAL.md*
