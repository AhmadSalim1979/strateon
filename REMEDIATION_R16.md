# REMEDIATION R16 — Adaptive Reasoning Depth & Escalation

**Date:** 2026-04-19
**Status:** Implemented and validated

---

## Remediation Summary

Implemented an Adaptive Reasoning Depth & Escalation layer that dynamically escalates reasoning depth based on situation complexity and risk. The system moves from LOW (default, fast) to MEDIUM (structured) to HIGH (deep reasoning) based on explicit triggers — without changing approval requirements or safety constraints.

**Core principle:** Routine operations get fast reasoning. Complex, high-risk, or contradictory situations get deeper analysis.

---

## A. Design

### Reasoning Modes

| Mode | Depth | Use Case |
|------|-------|----------|
| **LOW** | 1 (~100 tokens) | Routine operations, low-risk decisions |
| **MEDIUM** | 3 (~500 tokens) | Structured reasoning, multiple factors |
| **HIGH** | 5 (~1000+ tokens) | Deep reasoning, conflict resolution, critical decisions |

### Complexity Indicators

| Indicator | Weight | Source |
|-----------|--------|--------|
| CRITICAL_RISK | 1.0 | R13 Risk |
| CONFLICTING_SIGNALS | 1.0 | R15 Adversarial |
| ADVERSARIAL_CONDITION | 1.0 | R15 Adversarial |
| CONTRADICTION | 1.0 | R12 Consistency |
| UNHEALTHY_SYSTEM | 1.0 | System State |
| UNTRUSTED | 1.0 | R13 Trust |
| DEGRADED_SYSTEM | 0.8 | System State |
| CORRUPTED_INPUT | 0.9 | R15 Adversarial |
| PARTIAL_FAILURE | 0.8 | R15 Adversarial |
| HIGH_RISK | 0.8 | R13 Risk |
| LOW_TRUST | Variable | R13 Trust |
| MULTIPLE_COMPETING_PRIORITIES | 0.6 | Priority |
| HIGH_UNCERTAINTY | Variable | Uncertainty |
| NOVEL_SITUATION | 0.7 | Novelty |

### Escalation Rules

**Force HIGH (immediate escalation):**
- CRITICAL risk
- CONFLICTING_SIGNALS
- ADVERSARIAL_CONDITION
- CONTRADICTION
- UNHEALTHY_SYSTEM
- UNTRUSTED
- DEGRADED_SYSTEM

**Escalate to MEDIUM:**
- HIGH risk
- LOW trust
- DEGRADED system
- Partial failure

### Complexity Score

```
complexity_score = min(1.0, sum(indicator_weights) / 5)
```

| Score Range | Mode |
|-------------|------|
| < 0.4 | LOW |
| 0.4 - 0.7 | MEDIUM |
| >= 0.7 | HIGH |

### Output Guidelines by Mode

| Guideline | LOW | MEDIUM | HIGH |
|-----------|-----|--------|------|
| reasoning_explicit | No | Yes | Yes |
| conflicts_acknowledged | No | Yes | Yes |
| alternatives_considered | No | No | Yes |
| uncertainty_documented | No | Yes | Yes |
| confidence_stated | No | Yes | Yes |
| fallback_options | No | No | Yes |
| max_length | brief | moderate | extended |

---

## B. Implementation

### Files Created

| File | Purpose |
|------|---------|
| `src/handlers/reasoning-depth.js` | Core reasoning depth module |
| `src/handlers/r16-validator.js` | 39 validation tests |
| `state/reasoning-depth.json` | Persistent reasoning state |

### Core Functions

| Function | Purpose |
|----------|---------|
| `assessComplexity(situation)` | Analyze situation and return complexity indicators |
| `determineReasoningMode(situation)` | Determine appropriate reasoning mode |
| `shouldEscalate(situation)` | Quick check if escalation warranted |
| `shouldDowngrade(situation)` | Check if situation has improved |
| `getOutputGuidelines(mode)` | Get output requirements for mode |
| `generateReasoningContext(situation, mode)` | Generate context for reasoning engine |
| `runReasoningDepthCycle(situation)` | Full assessment cycle |

### Integration Points

**This module does NOT:**
- Change approval requirements
- Execute actions
- Bypass safety constraints
- Modify authority boundaries

**This module ONLY influences:**
- How deeply MOOSA reasons about a situation
- Output format and explicitness
- Whether conflicts are explicitly acknowledged

---

## C. Validation

### Required Scenarios — All Passed

| # | Scenario | Result |
|---|----------|--------|
| V1 | Low-risk → LOW mode | ✅ PASS |
| V2 | High-risk → HIGH mode | ✅ PASS |
| V3 | Conflicting signals → HIGH mode | ✅ PASS |
| V4 | Degraded system → MEDIUM/HIGH mode | ✅ PASS |
| V5 | Correct fallback under HIGH mode | ✅ PASS |

### Detailed Validations

| # | Scenario | Result |
|---|----------|--------|
| V1.1–V1.4 | LOW mode behavior | ✅ PASS |
| V2.1–V2.4 | HIGH mode behavior | ✅ PASS |
| V3.1–V3.3 | Conflicting signals | ✅ PASS |
| V4.1–V4.3 | System degradation | ✅ PASS |
| V5.1–V5.4 | HIGH mode guidelines | ✅ PASS |
| V6.1–V6.4 | Complexity assessment | ✅ PASS |
| V7.1–V7.3 | Escalation rules | ✅ PASS |
| V8.1–V8.3 | Downgrade rules | ✅ PASS |
| V9.1–V9.4 | Full cycle | ✅ PASS |
| V10.1–V10.4 | Query functions | ✅ PASS |
| V11.1–V11.3 | No approval bypass | ✅ PASS |

**Total: 39 passed, 0 failed**

---

## D. Safety Confirmation

| Requirement | Status |
|-------------|--------|
| No approval bypass | ✅ Confirmed: no execution functions |
| No hidden execution | ✅ Confirmed: only reasoning depth |
| Reasoning escalation doesn't change authority | ✅ Confirmed: mode affects depth not authority |

---

## E. Residual Limitations

1. **Static thresholds**: Complexity and escalation thresholds are hardcoded. May need tuning based on operational experience.

2. **No continuous monitoring**: Reasoning mode is assessed per-decision, not continuously monitored.

3. **Token-based depth is approximate**: Actual token usage depends on reasoning implementation.

4. **No adaptation based on outcomes**: System doesn't learn to adjust thresholds based on decision quality.

5. **Complex interactions not modeled**: Multiple simultaneous indicators may interact in ways not captured.

---

## F. Final Assessment

**Does MOOSA now apply deeper reasoning in complex situations?**

Yes. The Adaptive Reasoning Depth layer adds four capabilities that were previously absent:

1. **Dynamic depth selection**: System automatically escalates from LOW to MEDIUM to HIGH based on situation complexity.

2. **Explicit conflict handling**: HIGH mode requires acknowledging contradictions and considering alternatives.

3. **Risk-aware reasoning**: CRITICAL risk, UNHEALTHY/DEGRADED system, and contradictions all trigger deep reasoning.

4. **Output discipline**: Higher modes produce more explicit, documented reasoning with uncertainty acknowledgment.

**What is preserved from prior phases:**
- All approval boundaries — unchanged
- R15 adversarial testing — situation complexity feeds into reasoning depth
- R13 risk/trust — risk and trust levels trigger escalation
- R12 identity consistency — contradictions trigger HIGH mode
- R14 operator buffer — reasoning depth doesn't affect buffer behavior

**What is NOT introduced:**
- No execution changes
- No authority expansion
- No bypassing of safety constraints

**Net effect:** MOOSA has moved from:
> "I reason at a fixed depth regardless of situation complexity."
to:
> "I automatically escalate reasoning depth when I detect high risk, contradictions, conflicting signals, or degraded system state — and I explicitly document conflicts and alternatives in HIGH mode while staying fast for routine operations."

---

## Files Summary

```
src/handlers/reasoning-depth.js   — Core implementation (19KB)
src/handlers/r16-validator.js   — Validation suite (16KB)
state/reasoning-depth.json       — Persistent state
REMEDIATION_R16.md              — This document
```

---

*Remediation R16 complete. This completes the R-series remediations.* 🫡
