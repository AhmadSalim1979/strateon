# REMEDIATION R9 — Multi-Cycle Strategic Continuity & Goal Persistence

**Date:** 2026-04-19
**Status:** Implemented and validated

---

## Remediation Summary

Implemented a Goal Persistence Layer that enables MOOSA to maintain and pursue meaningful goals across multiple cycles, rather than only reacting to immediate conditions. Goals persist, track progress, and interact with the existing priority/deferred/chain systems without overriding critical state.

---

## A. Design

### Goal Model

```javascript
{
  goal_id: string,                    // Unique identifier
  goal_type: GOAL_TYPE,              // STABILITY | OPTIMIZATION | PREVENTIVE | INITIATIVE
  priority: 0-1,                     // 0.9=CRITICAL, 0.7=HIGH, 0.5=MEDIUM, 0.3=LOW
  description: string,               // Human-readable description
  creation_reason: string,            // Why the goal was created
  
  current_status: GOAL_STATUS,       // ACTIVE | PAUSED | COMPLETED | ABANDONED
  
  progress_state: {
    steps_total: number,
    steps_completed: number,
    current_step: string | null,
    remaining_steps: string[],
    progress_percent: number,         // 0-100
  },
  
  success_criteria: string[],        // Conditions for completion
  
  associated_chain_id: string | null, // Linked paused chain
  blocked_by_issues: string[],        // Issues blocking this goal
  blocked_since: string | null,       // When blocking started
  
  // Timestamps
  created_at: string,
  updated_at: string,
  last_progress_at: string | null,
  completed_at: string | null,
  abandoned_at: string | null,
}
```

### Lifecycle States

```
┌─────────┐     advanceProgress     ┌───────────┐
│  ACTIVE │────────────────────────▶│ COMPLETED │
└─────────┘                          └───────────┘
     │                                     ▲
     │ pauseGoal (higher priority work)     │
     ▼                                     │
┌─────────┐     resumeGoal (blockers        │
│  PAUSED │─────────────────────────────   │
└─────────┘       cleared)                  │
                                           │
     │ abandonGoal                          │
     ▼                                     │
┌───────────┐   (goal no longer            │
│ ABANDONED │    relevant)                 │
└───────────┘───────────────────────────────┘
```

### Priority Interaction Rules

| Goal Type | HEALTHY | DEGRADED | UNHEALTHY | CRITICAL |
|-----------|---------|----------|-----------|----------|
| STABILITY | pursue | pursue | pursue | **diagnostic_or_containment_only** |
| PREVENTIVE | pursue | pursue | pause | suppress |
| OPTIMIZATION | pursue | pause | pause | suppress |
| INITIATIVE | pursue | pause | pause | suppress |

**Key constraints:**
- **R9.1 Refinement**: In CRITICAL state, STABILITY goals may only produce diagnostic or containment steps — not actions that compete with immediate incident handling. They return `diagnostic_or_containment_only` recommendation with `step_type` field.
- **R9.2 Refinement**: Active issues always outrank goals EXCEPT when a STABILITY goal directly addresses the same active issue (co-prioritized). A goal addresses an issue if `addressing_issue_id` matches or if goal description contains issue description.
- Goals must not interfere with active critical chains
- High-priority issues (>0.7) can pause lower-priority goals (<HIGH)

### Progress Discipline

1. **No repetition**: Goals track `steps_completed` and `remaining_steps`. Completed steps are never repeated.
2. **Clear next step**: `getNextActionableGoal()` returns the next uncompleted step with `recommendation` and `step_type`.
3. **Pause/resume**: `pauseGoal()` and `resumeGoal()` maintain state across interruptions.
4. **Automatic completion**: When `steps_completed >= steps_total`, goal is automatically marked COMPLETED and archived.
5. **R9.1 Step type enforcement**: `step_type` can be `full`, `diagnostic_only`, or `containment_only`. `getNextActionableGoal()` returns `recommendation: 'proceed_diagnostic_or_containment'` when `step_type` is restricted.

---

## B. Implementation

### Files Created

| File | Purpose |
|------|---------|
| `src/handlers/goal-persistence.js` | Core goal persistence module |
| `src/handlers/r9-validator.js` | 33 validation tests |
| `state/goal-persistence.json` | Persistent goal store |

### Core Functions

| Function | Purpose |
|----------|---------|
| `createGoal(goalDef)` | Create new goal with steps |
| `getGoal(goalId)` | Retrieve a specific goal |
| `getActiveGoals()` | Get all active goals (sorted by priority) |
| `getPausedGoals()` | Get all paused goals |
| `getGoalSummary()` | Summary statistics |
| `advanceProgress(goalId, steps)` | Advance by N steps |
| `addStep(goalId, step)` | Add a step |
| `pauseGoal(goalId, reason)` | Pause goal |
| `resumeGoal(goalId, reason)` | Resume goal |
| `completeGoal(goalId, reason)` | Manually complete |
| `abandonGoal(goalId, reason)` | Abandon goal |
| `assessGoalInteraction(goals, systemState, ...)` | Priority-aware interaction assessment |
| `getNextActionableGoal(goals, systemState, ...)` | Get next goal to pursue |
| `tickGoalCycle(systemState, ...)` | Update goal states per cycle |
| `associateGoalWithChain(goalId, chainId)` | Link goal to chain |
| `getGoalsForChain(chainId)` | Get goals for a chain |

### Integration with Decision Pipeline

```
1. Each decision cycle:
   - tickGoalCycle(systemState, activeIssues, deferredWork, pausedChains)
   - Returns recommendations: to_pause, to_resume, to_pursue, to_complete

2. Recommendations used by operator/approval system:
   - Paused goals stay paused until blockers clear
   - Resume recommendations trigger resumeGoal()
   - Pursue recommendations surface goals for operator

3. Goal completion:
   - Manual: completeGoal()
   - Automatic: advanceProgress() when steps_total reached
   - Archived: moved to goal_history
```

---

## C. Validation

### Required Scenarios — All Passed

| # | Scenario | Result |
|---|----------|--------|
| V1 | Goal persists across multiple cycles | ✅ PASS |
| V2 | Progress advances correctly | ✅ PASS |
| V3 | Goal pauses when higher-priority issue appears | ✅ PASS |
| V4 | Goal resumes correctly | ✅ PASS |
| V5 | Goal completes when criteria met | ✅ PASS |
| V6 | No duplication of work | ✅ PASS |

### Additional Validations

| # | Scenario | Result |
|---|----------|--------|
| V7 | Goal type priority interactions | ✅ PASS |
| V8 | Goal-chain association | ✅ PASS |
| V9 | Progress discipline summary | ✅ PASS |

**Total: 36 passed, 0 failed** (includes R9.1 refinement tests V3.6-V3.8)

---

## D. Safety Confirmation

| Requirement | Status |
|-------------|--------|
| No interference with approval system | ✅ Confirmed: Goals require approval to act on, no autonomous execution |
| No uncontrolled execution | ✅ Confirmed: Goals only persist state, execution requires approval |
| No priority inversion | ✅ Confirmed: STABILITY goals always highest priority; CRITICAL blocks non-stability |
| Goals don't override critical state | ✅ Confirmed: assessGoalInteraction enforces CRITICAL suppresses non-stability |
| No duplication of work | ✅ Confirmed: steps_completed tracked, remaining_steps updated |

---

## E. Residual Limitations

1. **Goal steps are simple strings**: No metadata per step (who, when, outcome). Would need richer step model for detailed tracking.

2. **No automatic pause when issues appear**: `tickGoalCycle` returns recommendations but doesn't auto-pause. Caller must call `pauseGoal()` based on recommendations.

3. **Completion is step-count based**: Goals complete when `steps_completed >= steps_total`. No semantic check of actual goal achievement. Could complete without truly succeeding.

4. **No goal hierarchy**: Goals are flat. Can't model "sub-goals" or dependencies between goals.

5. **History is bounded to 50 entries**: Older completed/abandoned goals are lost. May need longer retention for audit.

6. **Paused chain association is one-way**: Goals can reference chains, but chains don't know about goals. Could create inconsistency if chain is deleted.

---

## F. Final Assessment

**Does MOOSA now maintain meaningful goals across cycles?**

Yes. The Goal Persistence Layer adds four capabilities that were previously absent:

1. **Goal persistence**: Goals survive across cycles, stored persistently. Not lost on restart.

2. **Progress tracking**: Steps completed vs remaining, progress percentage, current step. Clear picture of goal state.

3. **Priority-aware interaction**: Goals interact correctly with system state hierarchy. STABILITY goals always pursued, non-stability paused during degraded/unhealthy, suppressed during critical.

4. **No duplicate work**: Goals track what's done. `getNextActionableGoal()` returns only next uncompleted step.

**What is preserved from prior phases:**
- Approval gating: unchanged — goals surface for approval, don't execute autonomously
- Initiative discipline: unchanged — opportunities still surface for approval
- Safe Action Zones: unchanged — autonomous actions remain bounded
- Self-awareness: unchanged — verification layer unchanged

**Net effect:** MOOSA has moved from:
> "I react to issues and surface opportunities."
to:
> "I maintain persistent goals, track progress toward them, and pursue them strategically based on system state — without overriding critical work or acting without approval."

---

## Files Summary

```
src/handlers/goal-persistence.js     — Core implementation (24KB)
src/handlers/r9-validator.js           — Validation suite (18KB)
state/goal-persistence.json          — Persistent goal store
REMEDIATION_R9.md                  — This document
```

---

*Remediation R9 complete. Moosa — ready for next task.* 🫡
