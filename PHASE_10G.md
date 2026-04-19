# PHASE 10G — Resume Discipline & Safe Return to Paused Work

**Date:** 2026-04-18
**Status:** Implemented and validated

---

## A. Resume Model

**New functions in `src/handlers/interrupt-handler.js`:**

**`assessResume(currentStatus, activePatterns, prioritizationResult)`**
Determines whether any paused chain is eligible to resume. Called at the start of each run_self_check_and_decide cycle alongside `assessInterrupt()`.

**Resume assessment output:**
```javascript
{
  resume_detected: boolean,           // whether any paused chains exist
  resume_candidate_chain: {          // the most-recently-paused chain
    chain_id: string,
    original_issue: string,
    paused_at: string,
    paused_reason: string,
    interrupting_issue: string,
    resume_condition: string,
    completed_steps: number,
    total_steps: number,
    remaining_steps_count: number,
    paused_age_cycles: number,
    is_stale: boolean,
  },
  resume_eligibility: 'pending' | 'ready' | 'blocked_by_status' | 'blocked_by_higher_priority' | 'blocked_by_interrupting_pattern' | 'stale',
  resume_decision: RESUME_DECISION,
  resume_reason: string,
  resume_next_step: {
    step_number: number,
    action_id: string,
    step_description: string,
    recommendation: string,       // "Resume step N: action_id. Fresh approval required."
    requires_approval: true,     // always true — no auto-resume
    is_valid: boolean,           // not in completed_steps
  } | null,
  paused_chain_status: {
    chain_id, continuity_status, completed_steps, remaining_steps
  },
  total_paused_chains: number,
}
```

**Resume decisions:**

| Decision | When |
|----------|-------|
| `remain_paused` | Resume condition not met (status not HEALTHY, or higher-priority issue active) |
| `eligible_to_resume` | HEALTHY + no higher-priority active + interrupting pattern cleared |
| `suppress_paused_chain` | Paused work is obsolete (triggered by operator call to `suppressPausedChain()`) |
| `require_fresh_replan` | Chain is stale (>24 cycles) — original plan may no longer be valid |

**`suppressPausedChain(chainId, suppression_reason)`**
Marks a paused chain as `chain_stopped` with an explicit `suppression_reason` and `suppressed_at` timestamp. Chain is preserved for audit but will not be resumed.

**`activatePausedChain(chainId)`**
Transitions `CHAIN_PAUSED` → `CHAIN_ACTIVE`. Makes the chain visible to the normal continuity flow. Does NOT execute anything — just changes the chain's status so the next supervised cycle can pick it up.

---

## B. Resume Rules

1. **Resume condition must be satisfied** — system must be HEALTHY and interrupting pattern must be cleared
2. **Higher-priority active work blocks resume** — even if HEALTHY, if a critical stability issue is active, paused work remains paused
3. **Stale chains require fresh re-plan** — if paused >24 cycles (~2 hours), the original plan may be outdated
4. **Suppression is permanent within a cycle** — `suppressPausedChain()` records the decision and the chain stops being a resume candidate
5. **Resume never auto-executes** — `resume_next_step.requires_approval` is always `true`
6. **Resume does not repeat completed steps** — `resume_next_step` is built from `remaining_steps`, not the full plan

---

## C. Resume Eligibility Logic

```
assessResume(currentStatus, activePatterns, prioritizationResult):

1. Load all chains with continuity_status === CHAIN_PAUSED
2. Sort by updated_at descending → take most-recent as candidate
3. Compute paused_age_cycles (now - updated_at / 5min)

4. if paused_age > 24 cycles:
     → REQUIRE_FRESH_REPLAN (stale)
   else if currentStatus !== HEALTHY:
     → REMAIN_PAUSED (blocked_by_status)
   else if top_priority_issue.score > 0.8 AND category !== housekeeping:
     → REMAIN_PAUSED (blocked_by_higher_priority)
   else if interrupting pattern still in activePatterns:
     → REMAIN_PAUSED (blocked_by_interrupting_pattern)
   else:
     → ELIGIBLE_TO_RESUME (ready)

5. buildResumeNextStep(chain, decision):
     if decision !== ELIGIBLE_TO_RESUME → return null
     next_step = chain.remaining_steps[0]
     return {
       step_number: next_step.step_number,
       action_id: next_step.action_id,
       requires_approval: true,
       is_valid: next_step not in chain.completed_steps
     }
```

---

## D. Validation Results

| # | Requirement | Result |
|---|-------------|--------|
| V1 | Paused work remains paused while interrupt condition persists | ✅ `status=UNHEALTHY` → `remain_paused` + `blocked_by_status`; `status=DEGRADED` → `remain_paused` |
| V2 | Paused work becomes eligible when resume condition satisfied | ✅ `status=HEALTHY` + no higher-priority → `eligible_to_resume` + `ready` |
| V3 | Resumed work recommends correct next step, not a repeated one | ✅ Step 2 (`inspect_failed_dispatches`) returned — step 1 is in `completed_steps`, not in `remaining_steps` |
| V4 | Obsolete paused work can be suppressed with explicit reason | ✅ `suppressPausedChain()` → `continuity_status: chain_stopped` + `suppression_reason` + `suppressed_at` |
| V5 | Fresh approval is still required for resumed step | ✅ `resume_next_step.requires_approval === true` always; step not in completed_steps |
| V6 | No autonomous execution introduced | ✅ Pure reasoning; `activatePausedChain()` only changes status |
| V7 | No approval-gating or execution changes occur | ✅ Token system unchanged; `requires_approval` always true |

---

## E. Example: Valid Resume

**Scenario:** Chain paused at step 1/3 due to UNHEALTHY. System returned to HEALTHY. No active stability issues. Operator approves resume.

**Decision:** `ELIGIBLE_TO_RESUME`
**Reason:** "System is HEALTHY and interrupting issue 'UNHEALTHY' has cleared. Paused chain 'chain_e1' is eligible to resume."
**Next step:** `resume_next_step` = `{ step_number: 2, action_id: 'inspect_failed_dispatches', requires_approval: true, is_valid: true }`

What happens:
1. `assessResume()` detects `resume_detected: true` and returns `resume_decision: eligible_to_resume`
2. `resume_next_step` identifies step 2 as the correct next action (step 1 is completed)
3. Chain status → `CHAIN_ACTIVE` (via `activatePausedChain()` when operator confirms)
4. Next supervised cycle picks up the chain via `getPriorCycleContext()` with remaining steps intact
5. **Approval required** before step 2 executes — no auto-execution

---

## F. Example: Correct Continued Pause

**Scenario:** Chain paused due to UNHEALTHY. System is now DEGRADED (not HEALTHY). Operator expects resume.

**Decision:** `REMAIN_PAUSED`
**Reason:** "System is DEGRADED. Resume condition: Cannot resume while system is UNHEALTHY."
**Eligibility:** `blocked_by_status`

Note: Even though DEGRADED is not UNHEALTHY, the resume condition requires HEALTHY status specifically. The condition is not "DEGRADED or better" — it is "HEALTHY". This is intentional: the stored condition was "Cannot resume while system is UNHEALTHY" — but it also implicitly requires the system to be stable enough to take on the remaining work.

---

## G. Example: Suppression of Obsolete Paused Work

**Scenario:** Chain paused at step 2/3 for worker instability. Worker instability resolved via automated recovery (PM2 auto-restart). Original plan's final step (restart_worker) is no longer needed.

**Action:** `suppressPausedChain('chain_e3', 'Worker instability resolved via automated recovery. Original 3-step plan is now obsolete — no need for manual inspection steps.')`

**Result:**
- `continuity_status: chain_stopped`
- `suppression_reason: 'Worker instability resolved via automated recovery...'`
- `suppressed_at: <timestamp>`
- Chain preserved in store for audit but no longer appears as resume candidate

---

## Final Assessment

**Does MOOSA now resume interrupted work like a disciplined operator?**

Yes. Phase 10G completes the interrupt/pause/resume loop that Phase 10F started. The full cycle is:

1. **Interrupt detected** → `assessInterrupt()` determines preemption or not
2. **Work paused** → `savePausedWork()` → `chain_paused` + `preemption` metadata + `resume_condition`
3. **Work resumes** → `assessResume()` checks condition, returns `eligible_to_resume` + `resume_next_step`
4. **Approval** → `resume_next_step.requires_approval = true` always — no auto-execute
5. **Chain activated** → `activatePausedChain()` → `chain_active` for next supervised cycle

Three key disciplines added:

1. **Resume is gated on explicit conditions** — not just "system is better" but "healthier than when it was paused AND no new critical work has appeared"
2. **Resume always recommends the correct step** — first remaining step, never repeats completed steps, always marks `requires_approval: true`
3. **Stale chains get fresh re-plan** — a paused chain older than 24 cycles is flagged for re-plan rather than blindly resumed

**What is preserved from prior phases:**
- Approval gating: unchanged — `requires_approval` is always `true` on resume
- Token enforcement: unchanged
- Interrupt handling: unchanged
- Deferred work queue: unchanged

**Net effect:** MOOSA has moved from:
> *"I can pause work safely when something more important appears."*
to:
> *"I can safely and correctly return to that paused work later, without losing continuity or overstepping authority."*

---

## Files Modified

- `src/handlers/continuity-store.js` — added `CHAIN_PAUSED` to `CONTINUITY_STATUS`
- `src/handlers/interrupt-handler.js` — added `assessResume()`, `suppressPausedChain()`, `activatePausedChain()`, `summarizeResume()`, `RESUME_DECISION`
- `src/handlers/run_self_check_and_decide.js` — calls `assessResume()` at start of each cycle, emits resume fields

## State File

- `state/continuity-store.json` — now includes `chain_paused` and `chain_stopped` (suppressed) chains