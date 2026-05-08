# Stripe Payment Links — Starter / Growth / Scale
**Owner:** CFO (Moosa)
**Date:** 2026-05-08
**Status:** 🔴 AHMAD ACTION REQUIRED

---

## Summary

Stripe is NOT yet connected. This document provides Ahmad with exact steps to create payment links for all 3 tiers using the Stripe Dashboard (no code required). Estimated time: **15–20 minutes**.

**Tiers to configure:**
| Plan | Monthly Price | Payment Link |
|---|---|---|
| Starter | **$300/month** | Link needed |
| Growth | **$750/month** | Link needed |
| Scale | **$1,500+/month** | Use Stripe Invoice (custom) — no link |

---

## Step 1 — Create Stripe Account (If Not Already Done)

1. Go to **https://dashboard.stripe.com/register**
2. Use `ahmad@qiyadon.com` (or your preferred email)
3. Complete business verification — takes 15 minutes to 24 hours
4. Add your bank account for payouts (Business → Banking → Add bank account)
5. From the Dashboard, get your **Secret Key**:
   - Developers → API keys
   - Toggle to **"Test mode"** for initial setup
   - Secret key starts with `sk_test_`

> ⚠️ **Share the secret key ONLY with Moosa via secure channel** (not in a plain message). Store it in 1Password or similar.

---

## Step 2 — Create Payment Links via Stripe Dashboard

### 2a. Create the Starter Product

1. Go to Stripe Dashboard → **Products** → **+ Add product**
2. Name: `Starter Plan — Qiyadon Pipeline Execution`
3. Description: `Up to 50 active leads/month · Weekly Friday report · WhatsApp escalation · Email sequences · $300/month`
4. Price: **$300.00 USD** → select **Recurring** → **Monthly**
5. Click **Create product**
6. On the product page, click **"Create payment link"**
7. Copy the generated URL — save it below

### 2b. Create the Growth Product

1. Go to Stripe Dashboard → **Products** → **+ Add product**
2. Name: `Growth Plan — Qiyadon Pipeline Execution`
3. Description: `Up to 200 active leads/month · Daily tracking · Priority WhatsApp support · CRM integration · Monthly strategy call · $750/month`
4. Price: **$750.00 USD** → select **Recurring** → **Monthly**
5. Click **Create product**
6. On the product page, click **"Create payment link"**
7. Copy the generated URL — save it below

### 2c. Scale Plan — NO Payment Link

Scale is **custom-priced at $1,500+/month**. Do NOT create a payment link.
- For Scale clients: Dashboard → **Invoices** → **+ Create invoice** → enter custom amount
- Or send a Stripe Payment Link manually with the quoted amount

---

## Step 3 — Save Your Links Here

After creating the links, update this section:

```
STRIPE PAYMENT LINKS (Live Mode)
================================
Starter:  https://buy.stripe.com/XXXXXX   ($300/month)
Growth:   https://buy.stripe.com/XXXXXX   ($750/month)
Scale:    Use Stripe Invoice (custom $1,500+/month)

STRIPE TEST MODE LINKS
=======================
Starter:  https://buy.stripe.com/test_XXXXXX   ($300/month)
Growth:   https://buy.stripe.com/test_XXXXXX   ($750/month)

Stripe Secret Key (test):   REPLACE_WITH_YOUR_STRIPE_TEST_KEY
Stripe Secret Key (live):   REPLACE_WITH_YOUR_STRIPE_LIVE_KEY
```

---

## Step 4 — Test the Links

1. Open test-mode links in incognito browser
2. Complete a test purchase (use Stripe test card: `4242 4242 4242 4242`)
3. Confirm payment succeeds in test mode
4. Then switch to live mode and repeat

---

## Step 5 — Share Links with CTO

After links are live, share them with CTO to embed:
- `/pricing` page — add "Subscribe" or "Get Started" buttons linking to the appropriate Stripe payment link
- Trial-to-paid conversion flow at `/sign-trial` — add post-trial payment link

---

## Stripe Fees

| Transaction | Fee |
|---|---|
| Monthly fee | $0 |
| Per-transaction (card) | 2.9% + $0.30 |
| **On $300 (Starter)** | **~$9.00 fees → ~$291 net** |
| **On $750 (Growth)** | **~$22.05 fees → ~$728 net** |
| Failed payment | No charge |
| Refunds | Free (within 180 days) |

---

## Checklist

- [ ] Create Stripe account at stripe.com/register
- [ ] Complete business verification
- [ ] Add bank account for payouts
- [ ] Create Starter product + payment link
- [ ] Create Growth product + payment link
- [ ] Test in Stripe test mode
- [ ] Share links with Moosa and CTO

---

*Prepared by: CFO (Moosa) | 2026-05-08*