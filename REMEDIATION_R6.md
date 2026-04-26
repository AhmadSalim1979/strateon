# REMEDIATION R6 — Initiative Discipline & Opportunity Handling

**Date:** 2026-04-19
**Status:** Implemented and validated

---

## Remediation Summary

Implemented a structured initiative-discipline layer that governs how MOOSA handles proactive opportunities. The layer introduces explicit classification (HIGH_VALUE / LOW_VALUE / NOISE), gating decisions (SURFACE_IMMEDIATELY / DEFER / SUPPRESS), priority interaction rules, and operator alignment checks. All surfacing requires operator approval — no autonomous execution.

---

## A. Design

### Initiative Classification Model

Opportunities are classified into three tiers based on signal quality and potential impact:

| Class | Criteria | Behavior |
|-------|----------|----------|
| **HIGH_VALUE** | 5+ high-value signals (clear benefit, aligns with priorities, actionable, not speculative, confidence ≥ 0.75, margin ≥ 10%) OR 4 signals + operator priority alignment | Competes for surfacing |
| **LOW_VALUE** | 3-4 signals, some uncertainty | Deferred by default during non-HEALTHY states |
| **NOISE** | Speculative + low confidence, marginal/no benefit, duplicate, or creates noise | Always suppressed |

**Classification inputs:**
```javascript
{
  hasClearBenefit: boolean,
  alignsWithOperatorPriority: boolean,
  actionableWithLowRisk: boolean,
  speculative: boolean,
  duplicateOfRecentSuppression: boolean,
  marginPercent: number,      // <5% = noise
  createsNoise: boolean,
  confidence: number,         // <0.6 + speculative = noise
  category: string,
  isOperatorInitiated: boolean, // Auto-HIGH_VALUE
}
```

### Gating Rules

Gating determines whether a classified opportunity is surfaced, deferred, or suppressed.

| System State | HIGH_VALUE | LOW_VALUE | NOISE |
|--------------|-----------|-----------|-------|
| **HEALTHY** | SURFACE | Surface if score > 0.5, else DEFER | SUPPRESS |
| **DEGRADED** | DEFER | DEFER | SUPPRESS |
| **UNHEALTHY** | DEFER | SUPPRESS | SUPPRESS |
| **CRITICAL** | SUPPRESS | SUPPRESS | SUPPRESS |

**Additional gating conditions:**
- Active high-priority work (score > 0.7): LOW_VALUE deferred
- Noisy signal: always suppressed regardless of state
- Active chain exists: opportunities score reduced 10-60%

### Priority Interaction

Opportunities compete with the existing priority system:

```
High-value vs active issues:     80% weight (competes but respects active work)
Low-value vs active issues:      40% weight (significantly deprioritized)
Opportunity vs deferred issues:  70% weight (deferred queue has priority)
Opportunity vs paused chains:    90% weight (preserve resume eligibility)
```

**System status modifier:**
- HEALTHY: full score
- DEGRADED: 50% score
- UNHEALTHY/CRITICAL: 20% score

### Operator Alignment

Ensures opportunities respect operator context:

```javascript
{
  operatorPriorities: [],      // Opportunities aligning get priority boost
  escalationLevel: 0,          // >= 3: non-HIGH_VALUE deferred
  operatorBusy: false,         // true: opportunities deferred
  operatorAway: false,         // true: queued for return
  quietHoursActive: false,     // true: non-critical suppressed
  suppressNotifications: false,
}
```

**Alignment checks:**
- Priority alignment: opportunity category/tags vs operatorPriorities
- Escalation appropriateness: escalation >= 3 defers non-HIGH_VALUE
- Timing appropriateness: operatorBusy/Away/quietHours suppress surfacing
- Notification appropriateness: controls whether alert fires

---

## B. Implementation

### Files Created

| File | Purpose |
|------|---------|
| `src/handlers/initiative-discipliner.js` | Core module — classification, gating, priority interaction, operator alignment |
| `src/handlers/initiative-discipline-validator.js` | Validation suite — 35 tests covering all 5 required scenarios + safety |
| `state/opportunity-store.json` | Persistent store for opportunities (created at runtime) |

### Logic Added

**Core functions in `initiative-discipliner.js`:**

| Function | Purpose |
|----------|---------|
| `classifyOpportunity(opportunity, systemContext)` | Returns HIGH_VALUE / LOW_VALUE / NOISE |
| `assessGating(classification, opportunity, systemState, activeIssues)` | Returns SURFACE_IMMEDIATELY / DEFER / SUPPRESS |
| `assessPriorityInteraction(opportunityScore, classification, systemState, activeIssues, deferredIssues)` | Returns adjusted priority + interaction notes |
| `checkOperatorAlignment(opportunity, operatorContext)` | Returns alignment score + canSurface/canNotify flags |
| `assessOpportunity(opportunity, systemState, operatorContext, activeIssues, deferredIssues)` | Main entry — full initiative discipline assessment |
| `assessAllOpportunities(opportunities[], ...)` | Batch assessment + sorted prioritization |
| `addOpportunity / updateOpportunity / suppressOpportunity` | Store management |
| `getOpportunities / getSurfacedThisCycle / clearSurfacedThisCycle` | Store queries |

### Integration Point in Decision Pipeline

The initiative discipliner integrates at the **opportunity detection** stage of the decision pipeline:

```
1. System state assessed (HEALTHY/DEGRADED/UNHEALTHY/CRITICAL)
2. Active issues loaded from priority-manager
3. Deferred issues loaded from deferred-work
4. Operator context loaded from session/context
        ↓
5. [NEW] Initiative Discipline:
   a. Each detected opportunity → classifyOpportunity()
   b. Each classified opportunity → assessGating()
   c. Priority scores adjusted by assessPriorityInteraction()
   d. Operator alignment checked
   e. assessAllOpportunities() → sorted surfacing queue
        ↓
6. Output includes initiative_discipline results
7. Operator approval required before any action
```

**Output structure:**
```javascript
{
  initiative_discipline: {
    assessments: [...],           // All opportunities assessed + sorted
    surfacingCandidates: [...],   // Ready for operator review
    deferredCandidates: [...],   // Queued for later revisit
    suppressedCount: number,
    summary: {
      total: number,
      high_value: number,
      low_value: number,
      noise: number,
      surfaced_this_cycle: number,
    }
  },
  // Each surfacing candidate includes:
  // - classification, adjustedPriority, gating, gatingReason
  // - operatorAlignment: { isAligned, canSurface, canNotify, issues }
  // - requiresApproval: true  // Always — never autonomous
}
```

---

## C. Validation

### Required Scenarios — All Passed

| # | Scenario | Result |
|---|----------|--------|
| **V1** | High-value opportunity during stable system → surfaced | ✅ PASS |
| **V2** | Low-value opportunity → suppressed | ✅ PASS |
| **V3** | Opportunity during degraded state → deferred | ✅ PASS |
| **V4** | Opportunity conflicting with active issue → correctly deprioritized | ✅ PASS |
| **V5** | Opportunity aligned with operator priorities → surfaced correctly | ✅ PASS |

### Additional Safety Validations

| # | Check | Result |
|---|-------|--------|
| S1 | Noise is never surfaced | ✅ PASS |
| S2 | All surfacing requires approval | ✅ PASS |
| S3 | No hidden escalation behavior (surfacing consistent across escalation levels) | ✅ PASS |
| S4 | Critical system suppresses all opportunities | ✅ PASS |

### Batch Validation

| # | Check | Result |
|---|-------|--------|
| B1 | Exactly 1 surfacing candidate | ✅ PASS |
| B2 | Exactly 1 suppressed (noise) | ✅ PASS |
| B3 | At least 1 deferred (low-value) | ✅ PASS |
| B4-B6 | Correct classification + sorting | ✅ PASS |

**Total: 35 passed, 0 failed**

---

## D. Safety Confirmation

| Requirement | Status |
|-------------|--------|
| No increase in alert noise | ✅ Confirmed: NOISE classification + degraded/critical gating prevents noise |
| No approval bypass | ✅ Confirmed: `requiresApproval: true` on all surfacing decisions |
| No hidden escalation behavior | ✅ Confirmed: Surfacing behavior is consistent across escalation levels |
| Operator-aligned | ✅ Confirmed: operatorContext checked, canSurface/canNotify flags |
| No autonomous execution | ✅ Confirmed: All decisions are recommendations, operator approval required |

---

## E. Residual Limitations

1. **Classification is signal-based, not outcome-based**: An opportunity classified HIGH_VALUE may still not produce the expected benefit. The classification predicts potential, not guarantee.

2. **Operator priorities must be explicitly set**: If `operatorPriorities` is empty, the alignment boost for priority-matching opportunities won't apply. This is by design (no assumptions), but means the operator needs to configure priorities.

3. **Timing discipline not implemented**: This R6 focuses on classification, gating, and priority interaction. Time-based deferral (e.g., "don't surface before 9am") is not yet implemented — would require integration with cron/heartbeat timing.

4. **Opportunity store is local to workspace**: The `state/opportunity-store.json` is file-based and workspace-local. In multi-node deployments, this would need synchronization.

5. **Classification thresholds are static**: The boundary between HIGH_VALUE/LOW_VALUE/NOISE uses fixed thresholds (5 signals, 4+alignment, etc.). These may need tuning based on operational experience.

---

## F. Final Assessment

**Does MOOSA now handle proactive opportunities like a disciplined operator?**

Yes. The initiative discipline layer adds four disciplines that were previously absent:

1. **Explicit classification**: Every opportunity is classified as HIGH_VALUE, LOW_VALUE, or NOISE with documented criteria. No implicit "this seems good" decisions.

2. **State-aware gating**: Surfacing decisions are gated by system state. DEGRADED suppresses low-value, UNHEALTHY suppresses most things, CRITICAL suppresses everything. The system doesn't add noise to an already noisy situation.

3. **Priority-aware competition**: Opportunities don't blindly compete with active work — they're weighted based on their class and the active work's priority. High-value gets 80% weight, low-value gets 40%.

4. **Operator-aligned surfacing**: Even a correctly classified and gated opportunity is checked against operator context (busy, away, escalation level, quiet hours). Surfacing is suppressed when the operator can't benefit from it.

**What is preserved from prior phases:**
- Approval gating: unchanged — `requiresApproval: true` on all surfacing
- Deferred work queue (PHASE 10E): opportunities can be added to deferred queue with proper categorization
- Interrupt handling (PHASE 10F): opportunities don't preempt critical work
- Resume discipline (PHASE 10G): paused chains still respected
- Watchdog monitoring (R1): independent monitoring unchanged

**Net effect:** MOOSA has moved from:
> "I can detect things that might be worth doing."
to:
> "I classify opportunities by their true value, surface them at the right time and state, respect operator context, and never act without approval."

---

## Files Summary

```
src/handlers/initiative-discipliner.js        — Core implementation (26KB)
src/handlers/initiative-discipline-validator.js — Validation suite (17KB)
state/opportunity-store.json                  — Persistent store (created at runtime)
```

---

*Remediation R6 complete. Moosa — out.* 🫡
