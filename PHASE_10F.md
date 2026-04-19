# PHASE 10F — Interrupt Handling & Priority Preemption

**Date:** 2026-04-18
**Status:** Implemented and validated

---

## A. Interrupt / Preemption Model

**New file:** `src/handlers/interrupt-handler.js`

**Core function:** `assessInterrupt(currentCycleResult, priorCycleContext, activePatterns, prioritizationResult)`

**Interrupt assessment output:**
```javascript
{
  interrupt_detected: boolean,
  interrupting_issue: {
    issue: string,
    status: string,
    priority_score: number,
    pattern_severity: number,
    is_worsening: boolean,
    is_new_breakdown: boolean,
  } | null,
  preemption_decision: PREEMPTION_DECISION,
  preemption_reason: string,
  paused_work_item: {
    paused_chain_id: string,
    paused_issue: string,
    paused_plan_steps: [],
    paused_at: string,
    paused_reason: string,
    resume_condition: string,
    completed_steps_before_pause: number,
    total_steps_in_plan: number,
    preemption_decision: string,
  } | null,
  priority_delta: { delta, magnitude, direction },
  interrupt_severity: { status_delta, status_escalation, new_status, prior_status, pattern_severity, is_new_breakdown, is_worsening },
  noise_filtered: boolean,
  resume_condition: string | null,
  proceed_with_new_issue: boolean,
  preserve_chain_for_resume: boolean,
}
```

**Preemption decisions:**

| Decision | Meaning |
|----------|---------|
| `none` | No active work to interrupt — new cycle starts fresh |
| `ignore_noise` | Weak signal — current work continues, no interrupt |
| `queue_new_issue` | New issue queued — not severe enough to preempt |
| `preempt_and_pause_current` | New issue outranks current — pause and switch |
| `escalate_interrupt` | Reserved for CRITICAL situations requiring immediate operator involvement |

---

## B. Preemption Rules

1. **CRITICAL / UNHEALTHY always preempts** non-critical active work — critical instability has absolute precedence
2. **Worsening persistent/chronic pattern (severity ≥ 3) preempts** current work
3. **Large priority delta** (new issue materially outranks current) preempts
4. **DEGRADED alone does NOT preempt** if the underlying pattern is weak (first-seen + stable + low score) — noise filter takes precedence
5. **Weak signals (first-seen, stable, low score) are filtered** — no preemption regardless of status change
6. **No active chain** — no preemption possible, cycle starts fresh

**Preemption never auto-executes** — the decision is recorded and surfaced, but execution still requires operator approval.

---

## C. Work Preservation Model

When `preempt_and_pause` is triggered:

1. `savePausedWork(pausedWorkItem, currentCycle)` is called
2. The chain's `continuity_status` is set to `chain_paused`
3. `preemption` object is attached to the chain:
   - `paused_at`: timestamp
   - `paused_reason`: explicit human-readable reason for the pause
   - `resume_condition`: condition that must be met before the plan can resume
   - `preemption_decision`: the decision made
   - `interrupting_issue`: the issue that caused the preemption
4. `completed_steps` and `remaining_steps` are preserved as-is (not modified)
5. The chain remains in `state/continuity-store.json` with full audit trail

**Resume eligibility** (`canResumeChain(chainId, currentStatus)`):
- `HEALTHY` → can resume
- `DEGRADED` → cannot resume
- `CRITICAL` / `UNHEALTHY` → cannot resume

---

## D. Output Requirements

Decision output extended with:
```javascript
{
  interrupt_assessment: {
    interrupt_detected: boolean,
    preemption_decision: string,
    preemption_reason: string,
    paused_work_item: { ... } | null,
    noise_filtered: boolean,
    resume_condition: string | null,
  },
  interrupt_detected: boolean,
  preemption_decision: string,
  preemption_reason: string,
  paused_work_item: { ... } | null,
  resume_condition: string | null,
}
```

Example output (from validation):
```
interrupt_detected: true
preemption_decision: preempt_and_pause_current
preemption_reason: "System is UNHEALTHY. Critical instability takes absolute precedence over any ongoing work. Current chain will be paused."
paused_work_item: {
  paused_chain_id: "chain_v1",
  paused_issue: "Deep diagnostic investigation of worker health",
  paused_at: "2026-04-18T...",
  completed_steps: 1,
  total_steps: 3,
  resume_condition: "Cannot resume while system is UNHEALTHY. Escalation required..."
}
noise_filtered: false
```

---

## E. Validation Results

| # | Requirement | Result |
|---|-------------|--------|
| V1 | High-priority reactive issue preempts lower-priority work | ✅ UNHEALTHY + persistent+worsening → `PREEMPT_AND_PAUSE` |
| V2 | Weak/noisy signal does not preempt active work | ✅ `first_seen+stable+low` → `IGNORE_NOISE` even with DEGRADED status |
| V3 | Interrupted work is preserved, not lost | ✅ `chain_paused` + preemption object + completed_steps/remaining_steps preserved |
| V4 | Preemption reasoning is explicit | ✅ `preemption_reason` contains status, pattern, priority delta |
| V5 | Resume condition is recorded | ✅ `canResumeChain(HEALTHY)→true`, `canResumeChain(DEGRADED)→false`, stored in preemption.resume_condition |
| V6 | No approval-gating changes occur | ✅ `assessInterrupt()` is pure reasoning — no execution, no token modification |
| V7 | No autonomous execution introduced | ✅ All functions are reasoning-only; `savePausedWork()` only writes JSON |

---

## F. Example: Valid Preemption

**Scenario:** Active chain_v1 is running a deep diagnostic investigation (step 1/3 completed, step 2: `inspect_failed_dispatches` pending). Prior cycle status was DEGRADED. New cycle shows UNHEALTHY + persistent+worsening pattern (severity 4).

**Decision:** `PREEMPT_AND_PAUSE`

**Reason:** "System is UNHEALTHY. Critical instability takes absolute precedence over any ongoing work. Current chain will be paused."

**What happens:**
1. `assessInterrupt()` detects `interrupt_detected: true` and returns `preemption_decision: preempt_and_pause_current`
2. `savePausedWork()` writes `chain_paused` status to continuity-store
3. Chain preserved: 1/3 steps completed, 2 remaining, preemption metadata attached
4. New cycle proceeds with the UNHEALTHY issue as top priority
5. Resume condition: "Cannot resume while system is UNHEALTHY. Escalation required before paused work can continue."

---

## G. Example: Correct Non-Preemption

**Scenario:** Active chain is running a low-priority housekeeping task. Prior cycle status DEGRADED. New cycle shows HEALTHY + first-seen+stable+low score pattern (no worsening).

**Decision:** `IGNORE_NOISE`

**Reason:** "Signal is weak (first-seen, stable, low score). Current work continues without interruption."

**What happens:**
- No preemption — active chain continues uninterrupted
- The weak signal is noted as noise but does not displace active work
- Note: Even with DEGRADED status in the prior cycle, a first-seen+stable pattern does NOT trigger preemption — the noise filter is stronger than the status-based urgency signal

---

## Final Assessment

**Does MOOSA handle interruptions like a disciplined operator?**

Yes. Phase 10F adds three disciplines:

1. **Explicit preemption reasoning** — every preemption decision is accompanied by a human-readable reason that explains why the interruption was warranted and what the priority delta was

2. **Noise filtering before preemption** — weak signals (first-seen, stable, low score) are explicitly filtered, preventing noisy/flaky issues from displacing stable ongoing work even when status appears concerning

3. **Work preservation with resume conditions** — when preemption occurs, the chain is stored as `chain_paused` with complete state and an explicit `resume_condition`; the work cannot silently disappear

**What is preserved from prior phases:**
- Approval gating: unchanged — preemption reasoning does not bypass approval
- Token enforcement: unchanged
- Deferred work queue: unchanged
- Pattern memory: unchanged

**Net effect:** MOOSA has moved from:
> "I can manage work over time."
to:
> "I can safely change focus when something more important appears, without losing control of what was already in progress."

---

## Files Added / Modified

- `src/handlers/interrupt-handler.js` — new
- `src/handlers/run_self_check_and_decide.js` — imports interrupt-handler, calls `assessInterrupt()` and `savePausedWork()` at start of each cycle, emits interrupt assessment in output

## State File

- `state/continuity-store.json` — now includes `chain_paused` chains with preemption metadata