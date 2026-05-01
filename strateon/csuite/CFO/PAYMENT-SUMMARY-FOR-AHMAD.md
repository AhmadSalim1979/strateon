# Qiyadon — Payment Options Summary for Ahmad
**Owner:** CFO  
**Date:** 2026-05-01  
**Status:** ✅ Final  

---

## The Short Answer

**Use Stripe as your primary payment method.** Set up bank transfer as the fallback on invoices. Add PayPal only if clients specifically ask.

---

## How Can Clients Pay?

### 1. 💳 Credit or Debit Card — Stripe (RECOMMENDED — Do This First)

**What it is:** Clients click a link, enter their card details, pay instantly. Money lands in your Stripe account within 2 business days (eventually instant).

**Pros:**
- Industry standard — clients trust it
- Professional checkout experience
- You get paid immediately (no chasing)
- Very easy to set up — no code required (Payment Links)
- Works for Starter and Growth clients automatically

**Cons:**
- Fees: 2.9% + €0.30 per transaction (you pay this, not the client)
- Requires business verification with Stripe (takes 1–24 hours)

**Time to set up:** 2–3 hours total  
**Monthly cost:** $0 (no subscription, only per-transaction fees)  
**Example cost:** On a $750 Growth invoice, Stripe takes ~$22.20. You receive $727.80.

---

### 2. 🏦 Bank Transfer / Wire Transfer — Your Bank (PRIMARY BACKUP)

**What it is:** You put your IBAN on the invoice. Client transfers money manually. This is how most B2B companies pay.

**Pros:**
- Zero fees (or minimal flat fee) for SEPA transfers within EU
- No intermediary (Stripe, PayPal) — money goes directly to your account
- Clients who prefer invoice-based accounting will expect this

**Cons:**
- Slower — takes 1–5 business days to arrive
- No automatic tracking — you have to check your bank account manually
- Some clients need reminders to pay
- IBAN/SWIFT details need to be on every invoice

**What Ahmad needs to do:**
- Confirm your IBAN and SWIFT/BIC code with your bank
- Add these to the invoice template
- This should already be on file — verify it now

---

### 3. 📱 PayPal (OPTIONAL — Add Later Only If Needed)

**What it is:** Clients pay through their PayPal account.

**Pros:**
- Some clients prefer it, especially in North America
- Instant payment

**Cons:**
- Less professional in B2B context
- Similar fees to Stripe (2.9% + $0.30)
- Extra account to manage
- Most B2B clients expect card or bank transfer, not PayPal

**Recommendation:** Skip PayPal for now. Only set it up if 2+ clients specifically ask for it. You can always add it later.

---

## Which Should You Prioritize?

| Priority | Method | Why |
|---|---|---|
| **1st (Do immediately)** | Stripe Payment Links | Fast to set up, professional, widely trusted |
| **2nd (Also immediately)** | Bank transfer on invoice | Required as backup for clients who prefer wire |
| **3rd (Only if clients ask)** | PayPal | Nice-to-have, not essential |

---

## What Ahmad Needs to Do — Action List

**Today / This Week:**

- [ ] **Open a Stripe account** → https://dashboard.stripe.com/register
  - Takes 15 minutes
  - You'll need to verify your identity (or business registration)
  - Add your bank account for payouts

- [ ] **Create Stripe Payment Links** for Starter and Growth plans
  - Starter ($300/mo): Create a product + Payment Link in Stripe
  - Growth ($750/mo): Create a product + Payment Link in Stripe
  - Copy the links — you'll give these to your developer to embed

- [ ] **Confirm your bank details** for wire transfers
  - Bank name: _______________
  - Account name: _______________
  - IBAN: _______________
  - SWIFT/BIC: _______________
  - Add these to the invoice template

- [ ] **Add payment links to your website** (pass to CTO)
  - Put Stripe links as "Pay Now" buttons on qiyadon.com/pay
  - Include bank transfer details as secondary option

- [ ] **Test the full flow**
  - Use Stripe's test mode first
  - Pay yourself with a test card to confirm it works

**After First 3 Clients:**
- [ ] Review which payment method clients used
- [ ] Decide if you need PayPal based on client feedback

---

## Timeline

| Action | Time | Blocking? |
|---|---|---|
| Open Stripe account | 15 min | No |
| Complete Stripe verification | 1–24 hrs | **Yes — can't receive real payments** |
| Create Payment Links | 30 min | No |
| Confirm bank details | 30 min | No |
| Add to website | 30 min | No |
| Test | 10 min | No |
| Go live | 5 min | No |

**You could be accepting payments within 3 days.**

---

## Fees at a Glance

| Method | Per-Transaction Fee | Monthly Fee |
|---|---|---|
| Stripe (card) | 2.9% + €0.30 | $0 |
| PayPal | 2.9% + $0.30 | $0 |
| Bank transfer (SEPA) | €0–2 flat | $0 |
| Bank transfer (international wire) | $15–50 flat | $0 |

**Stripe is almost always the cheapest card-processing option for a business at this volume.**

---

## Key Takeaways

1. **Stripe first** — it handles card payments professionally and is the industry standard for B2B SaaS
2. **Bank transfer on every invoice** — some clients must pay by wire, and it's free
3. **PayPal later** — only if clients ask
4. **You don't need a developer** — Stripe Payment Links work without any code
5. **You're not locked in** — you can add/change payment methods at any time

---

*Prepared by: CFO (Moosa) | 2026-05-01*