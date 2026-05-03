# Qiyadon — Stripe Payment Links
**Owner:** CFO (Moosa)
**Date:** 2026-05-03
**Status:** ⚠️ STRIPE NOT YET CONNECTED — ACTION REQUIRED FROM AHMAD

---

## Current Status

**Stripe is NOT yet set up.** There are no Stripe API keys or configured payment links in the workspace.

Ahmad needs to complete the one-time Stripe setup (estimated 2–3 hours, mostly waiting for verification) before payment links are live.

---

## Pricing Being Linked

| Plan | Monthly Price | Payment Link Target |
|---|---|---|
| **Grow** | **$750/month** | Stripe Payment Link |
| **Scale** | **$1,500/month** | Custom invoice (no link — custom pricing) |

> **Note:** Scale is minimum $1,500/mo with custom pricing. Payment links are not suitable. Use Stripe Invoices for Scale clients.

---

## Step 1 — Ahmad's Immediate Action: Create Stripe Account

**URL:** https://dashboard.stripe.com/register

Estimated time: 15 minutes

What to do:
1. Go to https://dashboard.stripe.com/register
2. Use ahmad@qiyadon.com or your preferred email
3. Complete business verification (1–24 hours)
4. Add your bank account (IBAN) for payouts
5. From the Dashboard, get your **Secret Key** from: Developers → API keys
   - Test mode key starts with `sk_test_`
   - Live mode key starts with `sk_live_`

---

## Step 2 — Create Payment Links via Stripe API

Once Ahmad has his Stripe secret key, run these two commands to generate payment links for Grow and Scale (Scale = custom invoice only, see below):

### Grow Plan — $750/month

```bash
curl https://api.stripe.com/v1/payment_links \
  -u sk_test_YOUR_SECRET_KEY: \
  -d "line_items[0][price_data][currency]=usd" \
  -d "line_items[0][price_data][unit_amount]=75000" \
  -d "line_items[0][price_data][product_data][name]=Grow Plan — Qiyadon" \
  -d "line_items[0][price_data][product_data][description]=Up to 200 active leads, daily tracking, priority WhatsApp support" \
  -d "line_items[0][quantity]=1" \
  -d "after_completion[type]=redirect" \
  -d "after_completion[redirect][url]=https://qiyadon.com/payment-success"
```

### Scale Plan — $1,500/month (Custom Invoice — NO Payment Link)

Scale pricing is custom-quoted. Do NOT create a payment link for Scale. Instead:
- Create a Stripe Invoice manually for each Scale client
- Dashboard → Invoices → + Create invoice → enter agreed custom amount

---

## Step 3 — After Running the Commands

The API will return a JSON response containing:

```json
{
  "id": "pl_xxxxxx",
  "url": "https://buy.stripe.com/xxxxxx",
  ...
}
```

**The `url` field is your payment link.** Copy it and save it below.

---

## Generated Payment Links (To Be Filled In After Setup)

| Plan | Price | Payment Link | Status |
|---|---|---|---|
| **Grow** | $750/mo | `TBD — run API command above` | ⏳ Awaiting Stripe setup |
| **Scale** | $1,500+/mo | N/A — use Stripe Invoice | Custom quote |

---

## How to Create New Payment Links (Documentation for Future Reference)

### Option A — Via Stripe Dashboard (No Code)

1. Go to Stripe Dashboard → **Products** → **+ Add product**
2. Name the product (e.g., "Grow Plan — Qiyadon")
3. Set price: $750.00 USD, one-time
4. Click **Create product**
5. On the product page, click **"Create payment link"**
6. Copy the generated URL

### Option B — Via Stripe API (Programmatic)

```bash
curl https://api.stripe.com/v1/payment_links \
  -u sk_test_YOUR_KEY: \
  -d "line_items[0][price_data][currency]=usd" \
  -d "line_items[0][price_data][unit_amount]=75000" \
  -d "line_items[0][price_data][product_data][name]=Grow Plan — Qiyadon" \
  -d "line_items[0][price_data][product_data][description]=Your plan description here" \
  -d "line_items[0][quantity]=1"
```

**Key parameters:**
- `unit_amount`: Price in cents ($750.00 = 75000)
- `currency`: Use `usd` for international clients
- `product_data[name]`: What appears on the payment page
- `product_data[description]`: Plan details shown to customer

---

## Stripe Fees

| Item | Cost |
|---|---|
| Account | Free |
| Monthly fee | $0 |
| Per-transaction fee | 2.9% + €0.30 |
| **On $750 (Grow)** | **~€22.20 fees → you receive ~€727.80** |
| Failed payment | None |
| Refunds | Free |

---

## Checklist — What Ahmad Needs to Do

- [ ] Go to https://dashboard.stripe.com/register → create Stripe account
- [ ] Complete business verification (upload ID or company docs)
- [ ] Add bank account (IBAN) for payouts
- [ ] Get secret key from: Developers → API keys
- [ ] Run the Grow Plan API command above
- [ ] Verify payment link works in test mode
- [ ] For Scale clients: use Stripe Invoices (not Payment Links)
- [ ] Share payment links with CTO to embed on qiyadon.com

---

## Once Complete — Update This File

When Ahmad runs the API commands and gets the payment link URLs, update this file with the actual links:

```
Grow Plan: https://buy.stripe.com/xxxxxx
Scale: Use Stripe Invoice (custom amount)
```

---

*Prepared by: CFO (Moosa) | 2026-05-03*