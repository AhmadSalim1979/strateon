# TRIAL-FINANCIAL-IMPACT.md
## CFO Analysis: 14-Day Free Trial — Pipeline Execution-as-a-Service
**Date:** 2026-05-01  
**Prepared for:** Ahmad Salim  
**Role:** CFO, Qiyadon

---

## 1. REVENUE IMPLICATION: 10 TRIALS/MONTH @ 30% CONVERSION

| Metric | Monthly | Annual |
|---|---|---|
| New trials | 10 | 120 |
| Conversions (30%) | 3 | 36 |
| Revenue @ Starter ($300/mo) | **$900/mo** | **$10,800/yr** |
| Revenue @ Growth ($750/mo) | **$2,250/mo** | **$27,000/yr** |

### Baseline Without Trial
- 3 net new paid customers/month (organic, assuming no trial program)
- Trial program adds: **+3 paid customers/month** above organic baseline (assuming trial attracts same quality leads)

**Key assumption:** Trial users who convert sign up for minimum 3-month commitment (see Section 3).

---

## 2. COST OF GIVING AWAY 14 FREE DAYS

### Per-User Cost Calculation
- Monthly infrastructure cost per user: **~$50** (estimate — pipeline compute + API + storage)
- Daily cost: $50 ÷ 30 = **$1.67/day**
- 14 free days: **$23.33 per trial user**
- 10 trials/month → **$233/month** infrastructure cost given away
- Annual free trial infrastructure cost: **~$2,800**

### Revenue Foregone on Converted Users
If a converted user starts paying Month 2 (after 14 free days + ~16 billable days into Month 1):
- They pay for Month 1: ~16/30 × $300 = **$160** (first partial month)
- Or if billed monthly from Day 15: they get 14 free days then owe $300 from Day 15 onward

**Simplified model:** Offer 14 free days, then invoice on Day 15 for first full month. Revenue loss = 14 days × $300/30 = **$140 per converted user in Month 1**.

| Scenario | Monthly Trials | Conversion | Monthly Cost of Free Days |
|---|---|---|---|
| Infrastructure only | 10 | 3 | ~$70 ($23 × 3) |
| Revenue credit (Starter) | 10 | 3 | ~$420 ($140 × 3) |
| Revenue credit (Growth) | 10 | 3 | ~$350 ($140 × 3... wait, Growth is $750/mo → 14 days = $350) |

**Corrected table:**

| Scenario | 10 Trials/mo | 3 Convert | Monthly Cost |
|---|---|---|---|
| Infrastructure cost | 10 × $23.33 | — | **$233** |
| First-month revenue credit (Starter) | — | 3 × $140 | **$420** |
| First-month revenue credit (Growth) | — | 3 × $350 | **$1,050** |

**Bottom line:** Give away ~$233/month in infrastructure, absorb ~$140/customer first-month credit. Net first-month revenue for converted users = $0 for 14 days, then $300/mo.

---

## 3. MINIMUM COMMITMENT AFTER TRIAL

**Recommendation: 3-month minimum commitment after trial conversion.**

### Why 3 Months?
| Option | Pros | Cons |
|---|---|---|
| Month-to-month | Low barrier to conversion | High churn risk, no LTV guarantee |
| **3-month commitment** | **Filters for serious buyers, recovers CAC, reasonable** | **Some drop-off at conversion** |
| 6-month commitment | Strong LTV, strong signal | Higher friction, lower conversion rate |
| 12-month commitment | Maximum LTV, annual revenue recognition | Very high friction, may kill trial-to-paid conversion |

### 3-Month Math (Starter @ $300/mo)
- Revenue over 3 months: **$900 per customer**
- Cost to serve (3 months): $50 × 3 = **$150**
- Gross margin over commitment: **$750 per customer**
- Trial acquisition cost: ~$23 infrastructure + time
- **Net LTV (3 months): ~$727 per converted trial user**

### Churn Risk with Month-to-Month
If month-to-month, churn rate on trial converts could be **40-60% within 6 months**. With 3-month commitment:
- Forces at least 2 additional months of revenue
- Churn in Month 4+ still possible but reduced
- Net effect: **4-5 months of guaranteed revenue vs. 2-3**

**Recommendation: Require 3-month commitment. Do not allow month-to-month for trial converts.**

---

## 4. SETUP FEE & MINIMUM LEAD COUNT

### Partial Setup Fee: YES — Strongly Recommended

| Fee Component | Amount | Rationale |
|---|---|---|
| Implementation/onboarding fee | **$150–$200 one-time** | Signals seriousness, weeds out lookie-loos |
| Included with commitment | If 3-month commitment signed, **waive** setup fee | Converts commitment into a benefit |
| Without commitment | Setup fee **required** | Non-negotiable cost recovery |

**Rationale:** Setup/configure pipeline, CRM integration, and onboarding costs Qiyadon real time. A $150 fee is low enough not to block legitimate interest, high enough to deter casual tire-kickers.

### Minimum Lead Count: YES — Tiered Requirements

Trial users must meet **at least one** of:
| Tier | Lead Requirement | Trial Duration | Notes |
|---|---|---|---|
| Starter | ≥ 50 leads in pipeline | 14 days | Must show active pipeline |
| Growth | ≥ 200 leads in pipeline | 14 days | Must show active pipeline |

This prevents users from signing up, syncing an empty CRM, taking value, and leaving.

**Enforcement:** Check lead count at trial signup. If <50 leads, either decline trial or offer a shorter 7-day trial.

---

## 5. CHURN RISK — "FREE VALUE AND LEAVE"

### Risk Assessment

| Risk Type | Probability | Mitigation |
|---|---|---|
| Trial user extracts value (data, reports, insights) then leaves | **Medium-High (40%)** | Short trial window + onboarding cadence |
| User tries product, doesn't see value in 14 days, churns | **Medium (30%)** | Clear success metrics at signup; proactive check-in Day 7 |
| User converts but churns after Month 1 | **Medium (20%)** | 3-month commitment requirement |
| User converts, stays 3+ months, becomes long-term | **Low (10% real churn risk)** | Product stickiness is key |

### Net Churn Math (with mitigations in place)

Without mitigations, churn on trial converts could be **50%+ within 6 months**.

With 3-month commitment + onboarding fee:
- Month 1: Revenue earned (after free days)
- Months 2-3: Committed revenue — guaranteed
- Month 4+: Month-to-month after commitment → churn risk resumes

**Expected net revenue per trial (with mitigations, over 12 months):**
- 3 converted users/month × $300 × 3 months (committed) + 1.5 still active at Month 4 × $300 × 9 months = **$9,450** first year vs. $10,800 if all stay.

Churn-adjusted annual revenue: **~$8,500–$9,200** per cohort of 10 trials.

### Churn Mitigation Checklist
- [ ] Day 3 email: "Here's what's working for other users with your lead volume"
- [ ] Day 7 call: Live check-in, identify blockers, demonstrate specific value
- [ ] Day 12 email: "Your trial ends in 2 days — here's your report"
- [ ] Require pipeline screenshot at signup (proves intent)
- [ ] Limit trial to users with ≥50 active leads

---

## 6. PRICING TIER RECOMMENDATION FOR TRIAL ENROLLMENT

### Auto-Enroll in Starter ($300) vs. Growth ($750)?

**Recommendation: Auto-enroll in Starter. Upsell to Growth at Day 7-10 check-in.**

### Rationale

| Factor | Starter ($300) | Growth ($750) |
|---|---|---|
| Trial risk | Lower (less to lose) | Higher (more expensive to onboarding) |
| Conversion rate (trial → paid) | **Higher** (lower friction) | Lower (higher sticker shock) |
| Trial user expectations | Easier to delight | Harder to exceed |
| Churn if over-sold | Lower | Higher (buyers remorse) |
| Upsell motion | Natural (proven value → upgrade) | Requires strong用例 proof |

**The Playbook:**
1. **Enroll in Starter** ($300/mo) — 14 free days
2. Day 7-10: Success check-in → demonstrate value against their specific pipeline
3. If they have ≥200 leads + strong engagement → pitch Growth upgrade at conversion
4. If they have <200 leads → Starter is right tier, don't push Growth

### Pricing Tier Summary for Trial Program

| Tier | Monthly Price | Trial Duration | Commitment After Trial | Setup Fee |
|---|---|---|---|---|
| Starter | $300/mo | 14 days free | 3-month minimum | $150 (waived if commitment signed) |
| Growth | $750/mo | 14 days free | 3-month minimum | $200 (waived if commitment signed) |
| Scale | $1,500/mo | Case-by-case | Custom | Custom |

---

## 7. SUMMARY: KEY NUMBERS

| Metric | Value |
|---|---|
| Expected monthly trials | 10 |
| Expected conversions (30%) | 3/month |
| Monthly revenue (Starter, committed) | **$900/mo** |
| Annual revenue (churn-adjusted) | **~$8,500-9,200/yr** per 10-trial cohort |
| Cost of free days (infrastructure) | ~$233/month (10 trials) |
| First-month revenue credit per converted user | $140 (Starter) |
| Recommended post-trial commitment | **3 months minimum** |
| Recommended setup fee | **$150 one-time** (waived on commitment) |
| Minimum lead requirement | **≥50 leads for Starter, ≥200 for Growth** |
| Auto-enrollment tier | **Starter ($300)** — upsell to Growth at Day 7-10 |
| Churn risk without mitigations | 40-50% within 6 months |
| Churn risk WITH mitigations | **15-25% within 12 months** |

---

## RECOMMENDED TRIAL OFFER STRUCTURE

> **14-Day Free Trial — Pipeline Execution-as-a-Service**
> - Available to businesses with ≥50 active leads in pipeline
> - Trial converts to Starter ($300/mo) on Day 15 unless cancelled
> - 3-month minimum commitment upon conversion
> - $150 setup fee due at signup — **waived if 3-month commitment signed**
> - Day 7 success call included
> - Upgrade to Growth ($750/mo) available at Day 7-10 check-in for qualifying users

---

*Prepared by: CFO, Qiyadon*
*For questions: escalate to Ahmad Salim (C-Suite)*