# REMEDIATION R13 — Trust & Risk Weighting Layer

**Date:** 2026-04-19
**Status:** Implemented and validated

---

## Remediation Summary

Implemented a Risk and Trust Weighting Layer that assigns significance to inconsistencies, actions, system states, and learning signals. The layer ensures high-risk signals override low-risk ones, low-trust signals are discounted, and high-trust signals are amplified — without modifying approval requirements or safety constraints.

**Core principle:** Not all signals are equal. Risk classification and trust scoring provide weighted decision influence while preserving safety boundaries.

---

## A. Design

### Risk Classification Model

**Risk Levels:**

| Level | Weight | Description |
|-------|--------|-------------|
| CRITICAL | 1.0 | Immediate attention, blocks other work |
| HIGH | 0.75 | Significant risk, addressed soon |
| MEDIUM | 0.5 | Moderate risk, normal flow |
| LOW | 0.25 | Minor risk, can be deferred |

**Applied To:**

| Signal Type | Source | Default Risk |
|-------------|--------|-------------|
| CONTRADICTED (safety-related) | R12 | **CRITICAL** |
| CONTRADICTED | R12 | HIGH |
| OUTDATED | R12 | MEDIUM |
| PARTIALLY_SUPPORTED | R12 | LOW |
| UNVERIFIED | R12 | LOW |
| CRITICAL_SYSTEM | R7/System | CRITICAL |
| UNHEALTHY_SYSTEM | R7/System | HIGH |
| ACTION_MISMATCH | R11 | MEDIUM |
| ACTION_REPEATED_FAILURE | R11 | HIGH (escalated) |

**Escalation Factors:**
- Safety-related claims → escalate to CRITICAL
- CRITICAL system state → CRITICAL
- 3+ repeated failures → escalate to HIGH+

### Trust Scoring Model

**Trust Levels:**

| Level | Weight | Description |
|-------|--------|-------------|
| HIGH | 1.0 | Consistently reliable |
| MEDIUM | 0.7 | Usually reliable |
| LOW | 0.4 | Unreliable, discount signals |
| UNTRUSTED | 0.1 | Should be ignored |

**Scoring Factors:**
- Outcome match rate (match_count / total)
- Failure pattern detection → reduces to ≤0.3
- Suppression → reduces to ≤0.15
- Degrading trend → additional 20% reduction
- Improving trend bonus (if <0.7) → 10% increase

**Trust Boundaries:**
- Initial: 0.7
- Floor: 0.2
- Ceiling: 0.95

### Weighted Decision Influence

**Formula:**
```
weighted_priority = base_priority × risk_weight × trust_weight
```

**Suppression Rule:**
- UNTRUSTED signals → `suppress: true`
- CRITICAL risk → NOT suppressed (only UNTRUSTED suppresses)

**Amplification:**
- HIGH risk + HIGH trust → weighted_priority amplified
- LOW trust → weighted_priority discounted
- UNTRUSTED → suppressed

### Drift Severity Mapping (R12 → Risk)

| R12 Classification | Risk Level | Reason |
|-------------------|------------|--------|
| CONTRADICTED (safety) | CRITICAL | Safety constraint violation |
| CONTRADICTED | HIGH | Claim contradicted |
| OUTDATED | MEDIUM | No longer current |
| PARTIALLY_SUPPORTED | LOW | Some support |
| UNVERIFIED | LOW | Cannot verify |
| SUPPORTED | none | No risk |

### Safety Constraints

**This layer does NOT:**
- Modify approval requirements
- Override SAFE/SUPERVISED/RESTRICTED classifications
- Introduce autonomous execution

**This layer ONLY influences:**
- Prioritization signals
- Recommendation strength
- Trust weighting

---

## B. Implementation

### Files Created

| File | Purpose |
|------|---------|
| `src/handlers/risk-trust-weighting.js` | Core weighting module |
| `src/handlers/r13-validator.js` | 35 validation tests |
| `state/risk-trust-weighting.json` | Persistent weighting state |

### Core Functions

| Function | Purpose |
|----------|---------|
| `classifyRisk(signalType, data)` | Classify signal into risk level |
| `scoreTrust(entityType, entityId, data)` | Score trust for action/signal/component |
| `computeWeightedPriority(signal, risk, trust)` | Compute weighted priority |
| `mapDriftToRisk(r12Classification, data)` | Map R12 classifications to risk |
| `aggregateRisk(signals)` | Aggregate multiple signals |
| `integrateWithPriorityManager(signals, options)` | Prepare signals for priority-manager |
| `integrateWithDecisionModel(context, signals)` | Provide context to decision model |
| `runRiskTrustAssessmentCycle(inputs)` | Full assessment cycle |

### Integration Points

**Priority-Manager:**
- `integrateWithPriorityManager()` provides weighted signals
- Weights influence prioritization without overriding

**Decision-Model:**
- `integrateWithDecisionModel()` provides risk context
- Sets `elevated_caution` flag when risk is HIGH+

**R12 (Identity Consistency):**
- Drift alerts processed and mapped to risk levels
- Safety-related contradictions escalated to CRITICAL

**R11 (Outcome Evaluation):**
- Outcome mismatches update trust scores
- Trust scores influence future recommendations

---

## C. Validation

### Required Scenarios — All Passed

| # | Scenario | Result |
|---|----------|--------|
| V1 | High-risk inconsistency overrides low-risk issue | ✅ PASS |
| V2 | Low-trust action gets deprioritized | ✅ PASS |
| V3 | High-trust signal is preferred | ✅ PASS |
| V4 | No safety constraint is altered | ✅ PASS |
| V5 | Degraded state still handled correctly | ✅ PASS |

### Detailed Validations

| # | Scenario | Result |
|---|----------|--------|
| V1.1–V1.6 | Risk classification | ✅ PASS |
| V2.1–V2.5 | Trust scoring | ✅ PASS |
| V3.1–V3.4 | Weighted priority | ✅ PASS |
| V4.1–V4.5 | Drift severity mapping | ✅ PASS |
| V5.1–V5.3 | Risk aggregation | ✅ PASS |
| V6.1 | High-risk overrides | ✅ PASS |
| V7.1 | Low-trust deprioritization | ✅ PASS |
| V8.1–V8.2 | High-trust preference | ✅ PASS |
| V9.1–V9.3 | Safety constraints | ✅ PASS |
| V10.1–V10.4 | Degraded state handling | ✅ PASS |
| V11.1–V11.2 | R12/R11 integration | ✅ PASS |

**Total: 35 passed, 0 failed**

---

## D. Safety Confirmation

| Requirement | Status |
|-------------|--------|
| No approval bypass | ✅ Confirmed: only weighted signals provided |
| No hidden prioritization drift | ✅ Confirmed: explicit weights, auditable |
| No uncontrolled weighting behavior | ✅ Confirmed: bounded trust weights [0.1–1.0] |
| No modification of safety constraints | ✅ Confirmed: CRITICAL risk does not suppress |
| R12/R11 integration without override | ✅ Confirmed: mapping provides guidance, not mandates |

---

## E. Residual Limitations

1. **Thresholds are static**: Risk and trust thresholds are hardcoded. May need tuning based on operational experience.

2. **Trust decay/growth rates are fixed**: Confidence decay (0.05) and recovery (0.02) rates are constants. Could be made adaptive.

3. **No uncertainty quantification**: The layer provides point estimates rather than confidence intervals.

4. **Risk aggregation is simple**: Uses highest-risk dominates. Doesn't consider risk interaction effects.

5. **No temporal risk modeling**: Doesn't account for risk trends over time (increasing vs decreasing risk velocity).

6. **Weight calibration is empirical**: The risk_weight and trust_weight values are chosen empirically, not derived from formal analysis.

---

## F. Final Assessment

**Does MOOSA now distinguish critical vs minor signals?**

Yes. The Risk and Trust Weighting Layer adds five capabilities that were previously absent:

1. **Risk classification**: Signals from R12, R11, and system state are classified into CRITICAL/HIGH/MEDIUM/LOW with explicit weights.

2. **Trust scoring**: Actions, signals, and components are scored based on outcome history, failure patterns, and trends.

3. **Weighted decision influence**: Priority = base_priority × risk_weight × trust_weight. High-risk + high-trust amplifies; low-trust discounts.

4. **Drift severity mapping**: R12 classifications are mapped to risk with safety escalation: safety-related CONTRADICTED → CRITICAL.

5. **Safety preservation**: CRITICAL risk does NOT auto-suppress. Only UNTRUSTED signals are suppressed. Approval requirements and classifications remain untouched.

**What is preserved from prior phases:**
- R12 identity consistency: unchanged — used as signal source
- R11 outcome evaluation: unchanged — provides trust data
- R10 workload governance: unchanged — constraints remain
- R9 goal persistence: unchanged — goals weighted, not overridden
- Approval gating: unchanged — weights provide guidance only

**Net effect:** MOOSA has moved from:
> "I treat all signals and inconsistencies with equal weight."
to:
> "I classify signals by risk (CRITICAL/HIGH/MEDIUM/LOW), score trust for actions and components, weight decisions accordingly, and escalate safety-related contradictions to the highest priority — while preserving all safety boundaries."

---

## Files Summary

```
src/handlers/risk-trust-weighting.js   — Core implementation (21KB)
src/handlers/r13-validator.js         — Validation suite (18KB)
state/risk-trust-weighting.json        — Persistent state
REMEDIATION_R13.md                  — This document
```

---

*Remediation R13 complete. Moosa — ready for next task.* 🫡
