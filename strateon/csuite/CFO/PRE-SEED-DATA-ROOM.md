# Pre-Seed Data Room — Qiyadon
**Owner:** CFO (Moosa)
**Date:** 2026-05-08
**Status:** 📋 READY FOR INVESTOR/DILIGENCE USE

---

## Purpose

This document prepares Qiyadon's financial foundation for investor conversations, due diligence, and formal entity formation. It covers:
1. Cap table basics
2. 409A valuation approach
3. Monthly burn projection
4. Key financial assumptions

---

## 1. Cap Table — Pre-Seed

**Entity:** Qiyadon Inc. (Delaware C-Corp — in formation)
**Date:** May 2026
**Status:** Pre-revenue — 100% founder-owned

### Current Ownership

| Shareholder | Shares | Ownership % | Share Type |
|---|---|---|---|
| Ahmad Salim (Founder/CEO) | 10,000,000 | 100.0% | Common |

**Total shares outstanding:** 10,000,000

### Fully Diluted Cap Table (Post-Money)

*For illustration. Assumes a future seed round with 20% dilution.*

| Shareholder | Shares | Ownership % | Share Type |
|---|---|---|---|
| Ahmad Salim | 10,000,000 | 80.0% | Common |
| Seed Investors | 2,500,000 | 20.0% | Preferred |
| **Total (post-seed)** | **12,500,000** | **100.0%** | |

*Note: A standard seed round with 15–25% dilution is typical. 20% used here for illustration.*

### Options Pool

*Not yet created. Recommended: 10–15% option pool established at or before seed round.*

| Pool Size | Shares | % of Total (Post-Money) |
|---|---|---|
| 10% option pool | 1,389,000 | 10.0% |
| 15% option pool | 2,205,000 | 13.8% |

**Recommended option pool:** 10% (1,389,000 shares) — standard for pre-seed/seed stage.

### Share Classes

| Class | Purpose | Rights |
|---|---|---|
| Common | Founder shares | Voting, dividends, liquidation |
| Preferred (Seed) | Investors | 1x non-participating liquidation preference, anti-dilution (broad-based weighted average), voting rights proportional to shares |

### Authorized Shares

| | Pre-Seed | Post-Seed |
|---|---|---|
| Common | 10,000,000 | 10,000,000 |
| Preferred | 0 | 2,500,000 (at 20% dilution) |
| **Total authorized** | **10,000,000** | **15,000,000** |

*Note: Delaware C-Corp default authorized shares = 1,500 at par value. Qiyadon should authorize 10,000,000 shares at formation to avoid future charter amendments. Typical: 10M common + 5M preferred.*

---

## 2. 409A Valuation — Pre-Seed Approach

### What Is a 409A?

A 409A valuation is an independent appraisal of the fair market value (FMV) of a company's common stock. Required by the IRS for setting option strike prices. Must be done by a qualified third-party appraiser for tax compliance.

**Legal requirement:** IRC Section 409A — companies must set exercise prices at or above FMV to avoid adverse tax consequences for employees.

### Qiyadon's 409A Status

**Current stage:** Pre-revenue, pre-seed
**FMV approach:** Independent appraisal required before issuing options

### Pre-Money Valuation Framework

| Valuation Method | Estimate | Notes |
|---|---|---|
| **DCF (Revenue multiple)** | N/A | No revenue yet |
| **DCF (ARR multiple — SaaS)** | N/A | Pre-revenue |
| **Comps (recent seed rounds)** | $1.5M–$3.5M | Typical for pre-revenue, pre-product-market-fit B2B SaaS in EU/NA |
| **Scorecard method (NVCA)** | ~$2.0M | Adjusts for founder risk, market, product |
| **Risk factor summation** | $1.5M–$2.5M | Conservative |
| **Berlin/European B2B SaaS benchmark** | $1.8M–$2.5M | 0.5x–1x rule-of-thumb at pre-seed |

**CFO-recommended pre-money valuation (pre-seed):** $2,000,000 ($2M)

**Implied share price (pre-seed):**
- 10,000,000 shares outstanding
- Pre-money valuation: $2,000,000
- **Implied price per share: $0.20**

### Post-Money (Post-Seed at $2M)

| Item | Calculation | Value |
|---|---|---|
| Pre-money | — | $2,000,000 |
| Seed raise (20% dilution) | $2M ÷ 0.80 = $2.5M post-money | $500,000 |
| Post-money | — | $2,500,000 |
| Post-money price per share | $2,500,000 ÷ 12,500,000 shares | $0.20 |

*Note: At $2M pre-money, a $500K seed round = exactly 20% dilution. Price per share stays at $0.20 because the round is priced at pre-money valuation.*

### Strike Price Recommendation

| Share Class | Price Per Share | Basis |
|---|---|---|
| Founder/Common | $0.20 | Set by 409A at formation |
| Employee Options (when pool created) | **≥ $0.20** | IRS 409A requirement |

### When to Get a 409A Appraisal

| Event | Required? | Notes |
|---|---|---|
| Formation / founder shares | Optional but recommended | $0.20/share reasonable at pre-seed |
| Before issuing any options | **Yes — required** | Must be done by qualified appraiser |
| At seed round | Often updated | Investors expect updated 409A |
| Annually while private | Recommended | FMV changes over time |

**Recommended course of action:** Engage a 409A appraiser (e.g., Carta, ValueVision, or a boutique firm) before issuing any options. Typical cost: $1,500–$4,000 for a pre-seed company.

---

## 3. Monthly Burn Projection — Pre-Revenue

### Current Burn: Zero (Bootstrap Phase)

Qiyadon operates with zero external capital. Monthly burn = $0. Infrastructure costs are covered by existing server resources. AI compute costs will be tracked per-client once revenue starts.

### Projected Monthly Costs (Post-Client)

| Cost Item | 1 Client | 5 Clients | 10 Clients | 20 Clients |
|---|---|---|---|---|
| **AI Compute (LLM)** | ~$5 | ~$25 | ~$50 | ~$100 |
| **Infrastructure** | $20 | $25 | $30 | $40 |
| **Stripe fees (2.9% + $0.30)** | $9 | $45 | $90 | $180 |
| **Domain/tools** | $5 | $5 | $5 | $5 |
| **Delaware C-Corp annual** | $25 | $25 | $25 | $25 |
| **Total monthly cost** | **~$64** | **~$125** | **~$200** | **~$350** |
| **As % of revenue (avg)** | ~8–21% | ~3–8% | ~2–3% | ~1.5–2% |

*Stripe fees at average tier pricing ($750 = Growth mix assumed).*

### Break-Even Analysis

| Scenario | Monthly Revenue | Monthly Cost | Net Margin |
|---|---|---|---|
| 1 Starter client | $300 | $64 | **$236 (79%)** |
| 1 Growth client | $750 | $64 | **$686 (91%)** |
| 5 clients (mix) | ~$2,250 | $125 | **$2,125 (94%)** |
| 10 clients (mix) | ~$5,000 | $200 | **$4,800 (96%)** |

**Gross margin is very high** — this is a managed service, not a high-COGS product. AI compute scales slowly.

### Projected Path to Profitability

| Month | Clients | MRR | Cumulative Revenue | Costs | Net |
|---|---|---|---|---|---|
| Month 1 | 0 | $0 | $0 | $0 | $0 |
| Month 2 | 0 | $0 | $0 | $0 | $0 |
| Month 3 | 1 | $750 | $750 | $64 | $686 |
| Month 4 | 2 | $1,500 | $2,250 | $78 | $1,422 |
| Month 5 | 4 | $3,000 | $5,250 | $106 | $2,894 |
| Month 6 | 6 | $4,500 | $9,750 | $128 | $4,372 |
| Month 7 | 8 | $6,000 | $15,750 | $150 | $5,850 |
| Month 8 | 10 | $7,500 | $23,250 | $200 | $7,300 |
| Month 9 | 12 | $9,000 | $32,250 | $250 | $8,750 |
| Month 10 | 15 | $11,250 | $43,500 | $280 | $10,970 |

*Assumes 2 clients added per month after Month 3, then scaling. Mix: 60% Growth, 40% Starter.*

**Month 3:** Net positive (first profit)
**Month 10:** Net margin of ~$11,000/month

### Cash Flow Sensitivity

| Risk Factor | Impact | Mitigation |
|---|---|---|
| Client churn | Revenue cliff if >30% churn | Minimum 3-month agreements (Scale tier) |
| Delayed payments | Cash gap | Require payment within 7 days |
| Overhead scaling | Costs grow faster than assumed | Quarterly cost review |

---

## 4. Key Financial Assumptions

| Assumption | Value | Basis |
|---|---|---|
| Monthly AI compute per client | $5–10 | Based on current moosa-worker usage |
| Infrastructure monthly cost | $20–40 | Current server + Supabase |
| Stripe fee rate | 2.9% + $0.30 | Standard card processing |
| Average revenue per client | $750 | Midpoint of pricing tiers |
| Client growth rate | 2/month | Conservative initial assumption |
| Churn rate | <5%/month | Target — not yet validated |
| Gross margin | >85% | Managed service model |
| Delaware C-Corp annual cost | $300/year | Franchise tax + registered agent + license |

---

## 5. Documents Available for Due Diligence

| Document | Status | Notes |
|---|---|---|
| Certificate of Incorporation | 🔴 Not yet filed | Pending Ahmad action |
| Corporate Bylaws | 🔴 Not yet drafted | Use template |
| Stock Ledger | 🔴 Not yet created | Track founder shares |
| 409A Valuation | 🔴 Not yet conducted | Recommend before seed |
| EIN Confirmation | 🔴 Not yet obtained | Required for bank account |
| BOI Report | 🔴 Not yet filed | Required within 30 days of formation |
| Cap Table | ✅ This document | Pre-seed, 100% founder |
| Burn Projection | ✅ This document | Pre-revenue, bootstrap |
| Investor Business Case | ✅ Available | `strateon/INVESTOR-BUSINESS-CASE.md` |
| Pricing Schedule | ✅ Board-approved | `strateon/csuite/CFO/PRICING-DECISION-FINAL.md` |

---

## 6. Action Items Before Investor/Partner Review

| Item | Owner | Priority |
|---|---|---|
| Delaware C-Corp formation | Ahmad | 🔴 CRITICAL |
| EIN application | Ahmad | 🔴 CRITICAL |
| Bank account (Mercury + Wise) | Ahmad | 🔴 CRITICAL |
| BOI report filing | Ahmad + CFO | 🔴 CRITICAL (30-day deadline) |
| Corporate bylaws | Ahmad (or CFO with template) | 🟡 HIGH |
| Stock ledger | CFO | 🟡 HIGH |
| 409A valuation | External appraiser | 🟡 MEDIUM |
| Cap table management tool | Carta / Eqable | 🟡 MEDIUM |

---

*Prepared by: CFO (Moosa) | 2026-05-08*
*For board review and investor preparation only. Not audited.*