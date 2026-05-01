# Qiyadon — Stripe Setup Guide
**Owner:** CFO  
**Date:** 2026-05-01  
**Status:** ✅ Final — Ready for Ahmad to Execute  

---

## Overview

This guide walks Ahmad Salim through setting up Stripe for Qiyadon from scratch. By the end, you'll have a working payment page and be able to accept card payments from clients.

**Estimated time:** 2–3 hours for full setup (most of it is waiting for verification)  
**Cost to start:** Free — no monthly fees, only per-transaction fees  
**Transaction fee:** 2.9% + €0.30 per successful payment  

---

## Step 1 — Create Your Stripe Account

**Time:** 15 minutes  
**URL:** https://dashboard.stripe.com/register

### What to do:
1. Go to https://dashboard.stripe.com/register
2. Enter your business email (use ahmad@qiyadon.com or personal — your choice)
3. Create a password
4. Click **"Activate account"**
5. Stripe will email you a confirmation — click the link in the email

### What you'll need:
- Business name: **Qiyadon** (or your legal name if sole proprietor)
- Website: **https://qiyadon.com**
- Industry: **Business Consulting Services**
- Expected volume: Start with ~10 transactions/month, $2,000–$5,000/month

### Important:
- Use your **real legal name** as the account holder if you're a sole proprietor
- Business account vs. personal: if Qiyadon is registered as a company (GmbH, Ltd, etc.), use that legal name
- You can add the company name later in Settings → Account Details

---

## Step 2 — Complete Business Verification

**Time:** 1–24 hours (Stripe reviews manually)  
**This is required before you can accept real payments.**

### What to do:
1. After activating, Stripe will prompt you to verify your identity
2. If you're a sole proprietor: you'll need to upload ID (passport or driver's license)
3. If you're a company: you'll need company registration documents
4. Add your **bank account** for payouts (where the money goes)

### Where to enter bank details:
- Dashboard → **Settings** → **Bank accounts** (or "Payouts")
- Enter your IBAN — money will be transferred here after each payment

### ⚠️ Important:
- Stripe holds funds for **2 business days** for your first few payments (risk review)
- After 3–6 months of good history, payouts become instant
- Minimum payout threshold: **€1.00**

---

## Step 3 — Create Payment Links (No Code Required)

**Time:** 30 minutes  
**This is the easiest way to start accepting payments.**

Payment Links let you create a URL — send it to a client, they click, they pay, done.

### How to create a Payment Link:

1. In your Stripe Dashboard, go to: **Products** → **+ Add product**
2. Click **"Create payment link"** (or go directly to **Payment Links** in the left menu)

3. **For the Starter plan ($300/month):**
   - Product name: `Starter Plan — Qiyadon`
   - Amount: `300.00` USD (or EUR — pick one and stick to it)
   - Currency: **USD** (recommended for international clients)
   - Description: `Up to 50 active leads, weekly reporting, WhatsApp follow-up`
   - Click **Create**
   - Copy the generated **Payment Link**

4. **For the Growth plan ($750/month):**
   - Product name: `Growth Plan — Qiyadon`
   - Amount: `750.00` USD
   - Description: `Up to 200 active leads, daily tracking, priority support`
   - Click **Create**
   - Copy the generated **Payment Link**

5. **For the Scale plan ($1,500+/month):**
   - DO NOT create a payment link for Scale — this is a custom quote
   - Send a manual invoice instead (see Step 5)

### Where to find your Payment Links:
- Dashboard → **Payment Links**
- Each link looks like: `https://buy.stripe.com/xxxxxx`

---

## Step 4 — Add Payment Links to Your Website

**Time:** 15–30 minutes (with help from your developer/CTO)

### Option A — Direct Links (Simplest)
Send the Stripe Payment Link directly to clients via email or WhatsApp. No website changes needed.

### Option B — Embed as Buttons on qiyadon.com/pay
Your CTO can embed the links as styled buttons:

```html
<!-- Example button code for CTO -->
<a href="https://buy.stripe.com/xxxxxx" class="btn-primary">
  Pay Starter — $300/mo
</a>
<a href="https://buy.stripe.com/xxxxxx" class="btn-primary">
  Pay Growth — $750/mo
</a>
```

### Option C — Add to Pricing Page
The simplest integration: add the Payment Links as buttons on your pricing page under each plan's "Get Started" CTA.

---

## Step 5 — For Scale Clients: Manual Invoices

For Scale clients ($1,500+/mo), Stripe Payment Links aren't suitable because the price is custom.

**Process:**
1. Create an invoice in Stripe (Dashboard → **Invoices** → **+ Create invoice**)
2. Enter the client's details and agreed amount
3. Send the invoice via Stripe (it emails the client a payment link)
4. Client pays via the Stripe invoice link

**Alternative:** Use the invoice template already built in `/strateon/csuite/CTO/INVOICE-TEMPLATE.md` and add the Stripe payment link to it manually.

---

## Step 6 — Test It (Before Real Clients)

**Time:** 10 minutes

### Use Stripe's test mode:
- Everything in Stripe has a test mode by default (toggle in top-right: "Test mode")
- Use Stripe's test card: `4242 4242 4242 4242` (Visa), any future expiry, any 3-digit CVV
- No real money moves in test mode

### Test the full flow:
1. Click your own Payment Link
2. Enter test card details
3. Confirm payment
4. Check your Stripe Dashboard → Payments — the test payment should appear

---

## Step 7 — Go Live

**Time:** 5 minutes — just flip the switch

1. Make sure you've completed business verification (Step 2)
2. In the top-right of Stripe Dashboard, toggle **"Test mode"** OFF
3. Your Payment Links now accept real money

---

## Cost Summary

| Item | Cost |
|---|---|
| Stripe account | Free |
| Monthly fee | $0 |
| Per-transaction fee | 2.9% + €0.30 |
| Failed payment fee | None |
| Refunds | Free (you control this) |
| Chargebacks | $15 per dispute (fight it if legitimate) |

**Example revenue/cost:**
- 1 Growth client ($750/mo): Stripe takes ~$22.20, you receive ~$727.80
- 3 Growth clients ($2,250/mo): Stripe takes ~$66.60, you receive ~$2,183.40

---

## Alternatives Worth Knowing

| Provider | Pros | Cons |
|---|---|---|
| **Stripe** (recommended) | Professional, widely trusted, great dashboard | Slightly higher fees than some |
| **PayPal** | Clients may already have it | Less professional, higher friction |
| **Wise (formerly TransferWise)** | Good for EU/International, lower fees | Less known in B2B context |
| **Bank transfer only** | Zero fees | Slow, no guarantee of payment, poor client experience |

**Recommendation:** Start with Stripe. Add PayPal only if clients specifically request it.

---

## Timeline Summary

| Step | Time Required | Blocking? |
|---|---|---|
| 1. Create Stripe account | 15 min | No |
| 2. Business verification | 1–24 hrs | **Yes — cannot accept real payments until done** |
| 3. Create Payment Links | 30 min | No |
| 4. Add to website | 15–30 min | No |
| 5. Test in sandbox | 10 min | No |
| 6. Go live | 5 min | No (only after Step 2) |

**Realistic total time to accepting your first payment: 2–3 days** (mostly waiting for Stripe verification).

---

## Checklist — What Ahmad Needs to Do

- [ ] Go to https://dashboard.stripe.com/register and create an account
- [ ] Complete business verification (upload ID / company docs)
- [ ] Add bank account for payouts (IBAN)
- [ ] Create Product + Payment Link for **Starter ($300/mo)**
- [ ] Create Product + Payment Link for **Growth ($750/mo)**
- [ ] Test both Payment Links in Stripe test mode
- [ ] Share Payment Links with CTO to embed on qiyadon.com
- [ ] Flip to live mode once verified
- [ ] For Scale clients: use manual Stripe invoices

---

*Prepared by: CFO (Moosa) | 2026-05-01*