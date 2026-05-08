# Trial Agreement Flow — Status & Issues
**Owner:** CFO (Moosa)
**Date:** 2026-05-08
**Status:** ⚠️ ISSUES IDENTIFIED — Ahmad/CLA Action Required

---

## Current Live Flow

The trial page at **qiyadon.com/sign-trial** is live with a 14-day free trial agreement.

Key terms on the live page:
- 14 days free (no payment)
- Max 25 leads, WhatsApp + Email only
- Day 14 assessment: ≥3/5 criteria → paid offer valid 72 hours
- No auto-renewal
- Governing law: Delaware

---

## Issues Identified

### Issue 1: Starter Tier Missing from Conversion Path
**Severity:** HIGH

The trial's Day 14 conversion path only mentions Grow ($750) and Scale ($1,500+). The $300 Starter plan is completely absent.

**Current trial says:** *"Convert to a paid Grow ($750/mo) or Scale ($1,500/mo) plan"*

**Should also say:** *"or Starter ($300/mo)"*

**Impact:** Clients who only need 50 leads may not know Starter is an option, or may be pushed to a tier above their needs.

---

### Issue 2: Scale Minimum Commitment Not Disclosed
**Severity:** MEDIUM

The trial conversion offer (72-hour validity) leads to Scale ($1,500+/mo) which has a **3-month minimum commitment** per PRICING-DECISION-FINAL.md.

This is NOT disclosed in the trial agreement or on the sign-trial page.

**Impact:** A client who converts to Scale on the 72-hour window may be unaware of the 3-month lock-in.

**Fix needed:** Either (a) add 3-month minimum disclosure to trial agreement, or (b) only offer Starter/Growth in trial conversion (not Scale).

---

### Issue 3: Payment Link Gap After Trial
**Severity:** HIGH

The trial agreement says "Qiyadon sends an agreement and Stripe payment link" on conversion. **Stripe payment links do not exist yet.** Ahmad has not set up Stripe.

**Impact:** Even if a client converts today, there is no link to send.

**Fix needed:** Complete Stripe setup before any trial converts (see PAYMENT-LINKS.md).

---

### Issue 4: 72-Hour Conversion Window — Too Short?
**Severity:** MEDIUM

The trial gives 72 hours to decide after Day 14 report. A client who needs to get budget approval or discuss internally may not be able to decide in 72 hours.

**Consider:** 5 business days (more standard for B2B). However, this is a business decision — flagging only.

---

## What Works Well

✅ **No auto-renewal** — correctly protects the client
✅ **No payment during trial** — clear
✅ **Max 25 leads** — reasonable scope limitation
✅ **Day 14 assessment (3/5 criteria)** — objective and fair
✅ **One final follow-up after 72h close** — appropriately bounded
✅ **60-day no-contact after no-response** — good boundary setting

---

## Recommended Fixes

### Fix 1: Update Trial Agreement Text
Add Starter to conversion path and disclose Scale minimum commitment:

> **Decision at Day 14:**
> 1. **Go ahead** — Choose a paid plan:
>    - Starter: $300/month (up to 50 leads, week-to-week)
>    - Growth: $750/month (up to 200 leads, priority support)
>    - Scale: $1,500+/month (unlimited leads, dedicated account manager) — **minimum 3-month commitment**
> 2. **Walk away** — no fees

### Fix 2: Add Trial Flow to qiyadon.com/sign-trial
The current page is a text-only agreement. The "submit" flow (where the client actually signs) should:
1. Client fills in name, email, company
2. Client reads/agrees to trial terms (checkbox)
3. Client clicks "Start My 14-Day Trial"
4. System logs signed trial with timestamp + IP
5. Ahmad receives notification (email/WhatsApp)

*Currently unclear if this flow exists or is manual.*

### Fix 3: Add Post-Trial Payment Link to Onboarding Email
When trial converts, send:
- Signed Client Service Agreement (CSA)
- Stripe payment link for chosen plan
- Welcome/Onboarding form (CRM access, lead list submission)

---

## CLA Involvement Needed

The inconsistencies between:
- `TRIAL-AGREEMENT-TEMPLATE.html` (Pipeline Pilot Agreement, ~50 leads, Friday Report)
- Live page at qiyadon.com/sign-trial (25 leads, assessment criteria, 72h window)

...suggest the live page was updated independently of the template. CLA should reconcile these into a single coherent document that reflects the actual live terms.

---

## CFO Action Items

| Item | Owner | Status |
|---|---|---|
| Stripe setup | Ahmad | 🔴 PENDING |
| Add Starter to conversion path | CLA | 🟡 PENDING |
| Disclose Scale 3-month minimum in trial | CLA | 🟡 PENDING |
| Verify trial sign flow (form + signature) | CLA/CTO | 🟡 PENDING |
| Add post-trial payment onboarding email | CTO | 🟡 PENDING |

---

## Trial Agreement Version on File

- Template: `signed-agreements/TRIAL-AGREEMENT-TEMPLATE.html` — "Pipeline Pilot Agreement" — different from live page
- Live page: `qiyadon.com/sign-trial` — "14-Day Free Trial Agreement" — what clients actually sign

These two documents should be reconciled and the template updated to match the live version.

---

*Prepared by: CFO (Moosa) | 2026-05-08*