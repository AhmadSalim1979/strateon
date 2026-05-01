# Qiyadon — Website Payment Setup
**Owner:** CFO (Moosa, subagent)  
**Date:** 2026-05-01  
**Status:** ✅ Final — Ready for Implementation  

---

## 1. Where Does This Live?

**URL:** `qiyadon.com/pay` or `qiyadon.com/pricing#payment`  
**Access:** Visible to leads after they receive a proposal, or as part of the pricing page.  
**Goal:** Make it frictionless for clients to pay — one click if possible.

---

## 2. Payment Section Design Concept

### Visual Layout

The payment section should be clean, trust-building, and action-oriented.

**Recommended layout (3-step or single-page):**

```
┌─────────────────────────────────────────────────────┐
│  Secure Payment — Qiyadon                           │
│                                                     │
│  You've chosen: [GROWTH PLAN] — $750/month          │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  PAY NOW                                     │  │
│  │  ┌─────────────────────────────────────────┐ │  │
│  │  │  💳  Pay by Card (Stripe)   ← PRIMARY   │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────┐ │  │
│  │  │  🏦  Pay by Bank Transfer (SEPA)         │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────┐ │  │
│  │  │  📱  Pay with PayPal                    │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  🔒 256-bit SSL encryption. Your data is safe.     │
└─────────────────────────────────────────────────────┘
```

### Color Scheme
- Use Qiyadon's brand colors (deep navy/blue from brand guidelines)
- Stripe card button: primary CTA — use brand accent color
- Secondary options: outlined/secondary style

---

## 3. The Copy — How People Pay

### Section Headline
> **"Simple, Secure Payments"**

### Subheadline
> **"Choose how you'd like to pay. All major methods accepted."**

### Body Copy
> We want to make paying as easy as possible. You can pay using:
>
> **💳 Credit or Debit Card (Visa, Mastercard, American Express)**
> The fastest option. Powered by Stripe — industry-standard security. Your card details never touch our servers.
>
> **🏦 Bank Transfer (SEPA / Wire Transfer)**
> Ideal for EU clients or companies that prefer paying by invoice. Transfer directly to our account. Please include your invoice number as the payment reference.
>
> **📱 PayPal**
> If you prefer to pay through your PayPal account, select this option at checkout.

### Trust Signals (add near payment buttons)
> 🔒 **Secure payments** — powered by Stripe. 256-bit encryption.  
> 📄 **Monthly invoices** — issued on the 1st of each month  
> ⏱ **30-day payment terms** — we work with your finance team

---

## 4. What Needs to Be Built

### Option A — Stripe Checkout (Recommended, Primary)
**What it is:** Stripe's hosted payment page — you generate a link, client clicks, pays, done.

**What to build:**
1. Create a Stripe account (see `STRIPE-SETUP-GUIDE.md`)
2. Create Payment Links for each plan tier in Stripe Dashboard:
   - Starter ($300/mo) → Payment Link
   - Growth ($750/mo) → Payment Link
   - Scale ($1,500+/mo) → custom invoice (no link needed)
3. Embed links as buttons on qiyadon.com/pay
4. Optionally: build a lightweight "Client Portal" to let clients manage their plan and update card details

**Cost:** 2.9% + €0.30 per transaction (Stripe standard). Qiyadon pays this, not the client.

**Alternatives for lower fees:**
- Stripe Europe/SEPA: 1.9% + €0.30 (if eligible)
- PayPal: 2.9% + $0.30 (similar to Stripe)

### Option B — PayPal Button
- Create PayPal business account
- Generate PayPal.Me link or embed PayPal buttons
- Simpler but less professional-looking than Stripe

### Option C — Bank Transfer as Default + Stripe/PayPal as Backup
- Primary: clients pay via bank transfer on the invoice (Net 30)
- Add a Stripe/PayPal link on the invoice for clients who want to pay by card
- This is the lowest-effort starting point

---

## 5. Recommended Implementation Path

### Phase 1 — Launch Day (Do this first)
1. Set up Stripe account
2. Create Payment Links for Starter and Growth tiers
3. Add payment section to website pointing to Stripe links
4. Include bank transfer details on invoices
5. For Scale clients: manual invoice only

### Phase 2 — After First 5 Clients
1. Evaluate which payment method clients actually use
2. Consider PayPal as backup if some clients ask for it
3. Look at Stripe Dashboard analytics

### Phase 3 — Scale (After $5K+ MRR)
1. Build a lightweight client portal (Notion + Stripe integration or simple web app)
2. Consider subscription billing via Stripe Subscriptions (automatic monthly charges)
3. Explore invoicing tools like Debitoor or SumUp invoicing for EU compliance

---

## 6. Payment Page Sections to Include on qiyadon.com

| Section | Content |
|---|---|
| **Hero** | "Simple, Secure Payments" + chosen plan details |
| **Payment Methods** | Card (Stripe), Bank Transfer, PayPal — with icons |
| **Trust signals** | SSL badge, Stripe logo, security copy |
| **FAQ** | "What currencies do you accept?" / "Do you offer Net 30 terms?" / "Can I change my plan?" |
| **Support** | "Questions? Email billing@qiyadon.com" |

---

## 7. What Ahmad Needs to Do

1. **Sign up for Stripe** → stripe.com (see STRIPE-SETUP-GUIDE.md)
2. **Create Payment Links** for Starter and Growth plans
3. **Send the links to the CTO** to embed on the website
4. **Decide on PayPal** — is it worth setting up, or skip for now?
5. **Confirm bank details** for wire transfers (needed for invoices)

---

*Prepared by: CFO (Moosa) | 2026-05-01*