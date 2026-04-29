# Strateon — Invoice Process

**Owner:** CFO  
**Status:** Active  
**Effective:** 2026-04-29  

---

## Overview

This document describes how to generate, send, track, and collect Strateon invoices using the `INVOICE-TEMPLATE.md` provided by the CTO. Follow this process for every billing cycle.

---

## Before You Invoice (Prerequisites)

1. Client has signed the **Client Service Agreement (CSA)**
2. Client has signed the **Data Processing Agreement (DPA)**
3. Client has completed the **intake form** (leads received, contact details confirmed)
4. Bank details and payment preferences are on file

---

## Step 1 — Fill the Template

Open `INVOICE-TEMPLATE.md` (CTO folder) and replace all `{{PLACEHOLDERS}}`:

| Field | Where it appears | How to fill |
|---|---|---|
| `{{INVOICE_NUMBER}}` | Header, top right | Sequential: `STRT-0001`, `STRT-0002`, etc. |
| `{{INVOICE_DATE}}` | Header | Today's date, e.g. `April 29, 2026` |
| `{{DUE_DATE}}` | Header | Invoice date + 30 days, e.g. `May 29, 2026` |
| `{{CLIENT_COMPANY_NAME}}` | Bill To | From intake form |
| `{{CLIENT_CONTACT_NAME}}` | Bill To | From intake form |
| `{{CLIENT_EMAIL}}` | Bill To | From intake form |
| `{{CLIENT_ADDRESS_LINE_1}}` | Bill To | From intake form |
| `{{CLIENT_ADDRESS_LINE_2}}` | Bill To | City, Country |
| `{{SERVICE_PERIOD_START}}` | Service Period banner | First day of billing month |
| `{{SERVICE_PERIOD_END}}` | Service Period banner | Last day of billing month |
| `{{PLAN_NAME}}` | Line item | `Starter` / `Growth` / `Scale` |
| `{{PLAN_DESCRIPTION}}` | Line item detail | E.g. `Up to 50 active leads, weekly report, WhatsApp follow-up` |
| `{{UNIT_PRICE}}` | Line item | `$300` / `$750` / `$1,500` |
| `{{LINE_TOTAL}}` | Line item | Same as UNIT_PRICE (qty = 1) |
| `{{SUBTOTAL}}` | Totals | Same as LINE_TOTAL |
| `{{TAX_RATE}}` | Tax row | `0` unless VAT registered |
| `{{TAX_AMOUNT}}` | Tax row | `0` unless VAT registered |
| `{{VAT_REGISTERED}}` | Tax note | `false` — update when/if VAT registered |
| `{{GRAND_TOTAL}}` | Totals | Same as SUBTOTAL |
| `{{BANK_DETAILS}}` | Payment box | Your bank name |
| `{{ACCOUNT_NAME}}` | Payment box | Name on the bank account |
| `{{IBAN}}` | Payment box | Your IBAN |
| `{{SWIFT}}` | Payment box | Your SWIFT/BIC |
| `{{PAYMENT_LINK}}` | Payment box | Online payment URL (e.g. Wise, PayPal — if used) |

**Invoice numbering:** Keep a running counter. Never reuse a number. Log every invoice in the Revenue Log (see below).

---

## Step 2 — Convert to PDF or Send as HTML Email

**Option A — PDF (preferred for professionalism):**
1. Open the filled HTML in a browser
2. Print → Save as PDF (Chrome: Ctrl+P → Save as PDF)
3. Attach PDF to email

**Option B — HTML Email:**
1. Strip the `<style>` block or use a CSS inliner tool
2. Send as HTML email body (Gmail, Outlook, etc.)
3. Always include PDF as attachment as well

---

## Step 3 — Send the Invoice

**When to send:**
- Send on the **1st business day of each month** for the prior month's service
- Or on the **anniversary date** of the client's start date (if billing monthly in advance)

**Send via:** Email to the client's billing contact (from `{{CLIENT_EMAIL}}`)

**Email subject line:** `Invoice #STRT-XXXX — Strateon — [Month] [Year]`

**Email body (template):**
> Dear [CLIENT_CONTACT_NAME],
>
> Please find attached invoice #STRT-XXXX for Strateon's pipeline execution services covering [SERVICE_PERIOD_START] – [SERVICE_PERIOD_END].
>
> Amount due: $XXX
> Payment due by: [DUE_DATE]
>
> Please include invoice number #STRT-XXXX as your payment reference.
>
> Bank transfer details: [BANK_DETAILS]
> IBAN: [IBAN]
>
> Questions? Reply to this email.
>
> Best,
> Ahmad Salim
> Strateon | ahmad.salim@getstrateon.com

---

## Step 4 — Track in the Revenue Log

After sending, immediately update `FINANCIAL-TRACKING.md`:

1. Add row to **Invoice Log** table (invoice #, client, date sent, amount, due date, status)
2. Set status to `SENT`
3. When payment received → update status to `PAID`

---

## Step 5 — Payment Received

1. Mark invoice as `PAID` in Revenue Log
2. Record actual receipt date
3. File confirmation in email

---

## Step 6 — Non-Payment Protocol

| Days overdue | Action |
|---|---|
| **1–15 days** | Friendly reminder email (Day 5): `Hi [name], just a gentle reminder that invoice #STRT-XXXX is due [DUE_DATE]. Let us know if you need anything.` |
| **15–30 days** | Formal reminder email (Day 20): `Please note invoice #STRT-XXXX remains outstanding. Payment is required to maintain service continuity.` |
| **30–60 days** | Service suspension notice: `Your account is overdue. Service will be suspended if payment is not received within 10 business days.` |
| **60+ days** | Suspend service. Initiate collection. All legal costs borne by client. |

Late fee: **2% per month** on overdue balance (compounded), per invoice template.

---

## Record Keeping

- Save every invoice (HTML + PDF) in: `/strateon/finance/invoices/STRT-XXXX.html`
- Log every invoice in `FINANCIAL-TRACKING.md`
- Retain for minimum 7 years (standard for financial records)

---

## Quick Checklist (Per Invoice)

- [ ] CSA and DPA signed
- [ ] Intake form completed
- [ ] All placeholders filled correctly
- [ ] Invoice number is sequential and unique
- [ ] PDF generated and attached to email
- [ ] Email sent to correct billing contact
- [ ] Invoice logged in `FINANCIAL-TRACKING.md`
- [ ] Payment due date noted (30 days from invoice date)
