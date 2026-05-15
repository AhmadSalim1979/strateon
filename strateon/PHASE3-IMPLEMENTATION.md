# PHASE 3 IMPLEMENTATION PLAN
## Silence Detection + Operational Continuity Hardening

**Status:** READY — Pending Ahmad Approval
**Date:** 2026-05-15
**Phase:** 3 of 5 (Foundation → Policy → Runtime Safety → BCDR → Go Live)
**Objective:** Detect stalled execution deterministically, prevent silent task abandonment, guarantee continuity visibility, ensure recovery state survives restart/crash

---

## PROBLEM STATEMENT

**"The system must NEVER go dark again without emitting explicit operational state."**

During the Zoho incident and session stall, the system went silent without:
- Status updates to Ahmad
- Explicit state declarations
- Recovery signals when tasks exceeded expected time

Phase 3 addresses this with:
1. Deterministic stale task detection
2. Explicit state machine for execution states
3. Guaranteed alert escalation when tasks stall
4. Persistent state that survives worker restart/crash

---

## EXACT FILES/MODULES TO CHANGE

### New Files

| File | Purpose | Risk |
|------|---------|------|
| `/ops/state-machine.js` | Execution state definitions, transition logic, staleness rules | Low |
| `/ops/stale-task-detector.js` | Polls tasks + instructions for stale conditions, triggers escalations | Medium |
| `/ops/operational-state.json` | Persistent operational state file — survives worker restart | Low |
| `state/operational-state.json` (workspace) | Runtime operational state | Low |

### Modified Files

| File | Change | Risk |
|------|--------|------|
| `HEARTBEAT.md` | Add operational state check, stale task detection, silence escalation | Low |
| `/ops/CHANGELOG.md` | Append Phase 3 entry | Low |
| `/ops/OPERATIONAL-GOVERNANCE.md` | Update governance index | Low |

### No Changes To

- moosa-worker code (not in scope)
- PM2 topology (no new services)
- OpenClaw config
- bootstrapMaxChars
- instruction-bridge.js (Phase 1 complete)
- coding sidecar

---

## EXACT STATE MODEL

### Execution States

| State | Definition | Transitions To |
|-------|------------|-----------------|
| `active` | Task is currently being worked — last step confirmed < 5 minutes ago | `waiting`, `stalled`, `completed`, `failed` |
| `waiting` | Task is waiting for external input (API response, human decision, system event) — expected | `active`, `stalled`, `blocked` |
| `blocked` | Task cannot proceed — missing approval, credential, info, or external dependency | `active` (if unblocked), `stalled` (if exceeded SLA), `failed` |
| `stalled` | Task exceeded expected duration without completing — silent for >10 minutes | `active` (if resumed), `failed` (if abandoned) |
| `degraded` | Task is running but producing degraded results or partial output | `active`, `stalled`, `failed` |
| `completed` | Task finished successfully — terminal state | None |
| `failed` | Task abandoned or errored — terminal state | None |

### State Transition Rules

```
ACTIVE:
  - Update received within 5 min → remain ACTIVE
  - No update for 5-10 min → emit WAITING alert, transition to WAITING
  - No update for >10 min → emit STALLED alert, transition to STALLED

WAITING:
  - External response received → transition to ACTIVE
  - No response for >30 min → emit STALLED alert, transition to STALLED
  - Explicit block reason identified → transition to BLOCKED

BLOCKED:
  - Blocker resolved → transition to ACTIVE
  - No resolution for >60 min → escalate to Ahmad, remain BLOCKED

STALLED:
  - Task resumed with update → transition to ACTIVE
  - No resume for >5 min after STALLED alert → escalate CRITICAL to Ahmad
  - Task abandoned → transition to FAILED

DEGRADED:
  - Issue resolved → transition to ACTIVE
  - Issue persists >15 min → transition to STALLED

COMPLETED / FAILED: terminal — no further transitions
```

### Required Fields Per Task State

```javascript
{
  task_id: UUID,
  status: 'active' | 'waiting' | 'blocked' | 'stalled' | 'degraded' | 'completed' | 'failed',
  current_step: String,           // what is happening now
  last_successful_step: String,   // last confirmed good step
  blocker: String | null,         // what's preventing progress
  stalled_since: ISO8601 | null, // when task entered STALLED
  last_update_at: ISO8601,       // last state change
  next_expected_update: ISO8601,  // when next update expected
  elapsed_ms: Number,             // time since last update
  escalation_level: 0-3,          // 0=none, 1=warning, 2=alert, 3=critical
  metadata: {
    task_type: String,
    assigned_worker: String,
    correlation_id: UUID,
    original_instruction_id: UUID
  }
}
```

---

## TIMEOUT THRESHOLDS

| Threshold | Value | Trigger |
|-----------|-------|---------|
| Active heartbeat max | 5 minutes | No update in 5 min → emit WAITING |
| Stall detection | 10 minutes | No update in 10 min → emit STALLED alert, mark STALLED |
| Critical escalation | 15 minutes | STALLED for >5 min → CRITICAL alert to Ahmad |
| Blocked SLA | 60 minutes | Blocked for >60 min → escalate to Ahmad |
| Degraded threshold | 15 minutes | Degraded for >15 min → transition to STALLED |
| Waiting response | 30 minutes | Waiting for >30 min → transition to STALLED |
| Restart recovery window | 2 minutes | Worker restart → must recover state within 2 min |

**Minimum update frequency:** Every task must emit a status update at least every 5 minutes during active execution.

---

## ESCALATION LOGIC

### Level 0 — No Alert (Normal)

```
Status: active | completed
Action: None — system operating normally
```

### Level 1 — Warning (Watchdog Tracks, No User Alert)

```
Status: waiting | degraded
Action: Log to operational-state.json, continue monitoring
Alert to user: None
```

### Level 2 — Alert (WhatsApp to Ahmad)

```
Status: stalled
Trigger: No update for >10 minutes
Message format:
  ⚠️ TASK STALLED
  Task: [task goal slice]
  Current step: [current_step]
  Last successful: [last_successful_step]
  Blocker: [blocker or 'unknown']
  Elapsed: [X] minutes
  Expected update: [next_expected_update]
  Action required: Resume or confirm
```

### Level 3 — Critical (Immediate WhatsApp + Priority Flag)

```
Status: stalled >5 minutes after STALLED alert
Trigger: STALLED for >15 minutes total, or repeated STALLED on same task
Message format:
  🚨 TASK STALLED — CRITICAL
  Task: [task goal slice]
  Stalled since: [stalled_since]
  Last successful: [last_successful_step]
  Blocker: [blocker or 'unknown']
  Elapsed: [X] minutes
  Repeated stall: YES/NO
  Action required: IMMEDIATE — task may be abandoned
```

### Escalation on Worker Restart

```
Event: moosa-worker restarts (detected via watchdog)
Window: 2 minutes to recover state
Action:
  1. Read last operational-state.json
  2. For each ACTIVE task: emit "Worker restarted — resuming task [ID]"
  3. If state cannot be recovered within 2 min → Level 3 alert to Ahmad
  4. If >3 restarts in 1 hour → Level 3 alert, halt task processing
```

---

## BLAST RADIUS ASSESSMENT

| Component | Impact | Notes |
|-----------|--------|-------|
| HEARTBEAT.md | Low — policy additions | No code changes, no service interruption |
| watchdog.js | Medium — new monitoring logic | Existing watchdog extended, not replaced |
| Operational state | Low — JSON file writes | Append-only state, no existing data modified |
| Supabase | Low — reads tasks/instructions table | No schema changes, no data loss |
| PM2 | None — no new processes | Watchdog already runs as PM2 process |
| moosa-worker | None — no code changes | Watchdog reads state files, does not modify worker |
| Coding sidecar | None | Unaffected |
| Email/SMTP | None | Unaffected |

**Blast radius: Low-Medium.** Additive monitoring, no existing behavior changed.

---

## ROLLBACK PLAN

```bash
# Stop Phase 3 monitoring (watchdog continues with existing rules)
# No changes to rollback — Phase 3 is additive monitoring
# Remove new files:
rm /ops/state-machine.js
rm /ops/stale-task-detector.js
rm /home/node/.openclaw/workspace/state/operational-state.json

# Revert HEARTBEAT.md:
git checkout -- HEARTBEAT.md

# Restart watchdog (back to Phase 2 state):
pm2 restart moosa-watchdog
```

**After rollback:** Worker continues normally. Stale task detection removed. No data loss — operational-state.json was informational only.

---

## FALSE-POSITIVE MITIGATION

### Problem: Normal long-running tasks (e.g., 30-min API calls) would trigger stall alerts

**Solution: Task-type-aware thresholds**

```javascript
const THRESHOLDS_BY_TYPE = {
  'execute': { active_max_ms: 5*60*1000, stall_ms: 10*60*1000, critical_ms: 15*60*1000 },
  'review':  { active_max_ms: 15*60*1000, stall_ms: 30*60*1000, critical_ms: 45*60*1000 },
  'inform':  { active_max_ms: 2*60*1000, stall_ms: 5*60*1000, critical_ms: 10*60*1000 },
  'instruction_bridge': { active_max_ms: 30*1000, stall_ms: 60*1000, critical_ms: 120*1000 }
};
```

### Problem: Heartbeat temporarily fails (network hiccup) → false stall alert

**Solution: Cooldown + confirmation**

- Stale detected → wait 1 minute, confirm still stale before alerting
- Cooldown: same alert type needs 3 watchdog cycles (~9 min) before re-alerting
- Alert includes "Confirmed stale after [X] checks"

### Problem: Task legitimately waiting for external response (HubSpot API, etc.)

**Solution: Explicit WAITING state**

- Task enters WAITING when: awaiting API response, human decision, external event
- WAITING → no stall alert until `waiting_timeout` exceeded
- When response received → transition to ACTIVE immediately

### Problem: Worker restart → spurious stall alerts during restart window

**Solution: Restart grace period**

- Worker restart detected (missing heartbeat) → 2 minute grace window
- During grace: no stall alerts for tasks that were ACTIVE before restart
- After grace: if state not recovered → Level 3 alert

---

## RESTART/RECOVERY BEHAVIOR

### Worker Restart Sequence

```
1. Watchdog detects: worker heartbeat missing for >60 seconds
2. Watchdog emits: "Worker restart detected — monitoring recovery"
3. Watchdog starts: 2-minute recovery window
4. Worker comes back online:
   a. Reads last operational-state.json
   b. For each ACTIVE task: emits status update
   c. Watchdog receives heartbeat → confirms recovery
5. If worker does not come back within 2 minutes:
   a. Level 3 alert: "Worker failed to restart — manual intervention required"
   b. Halt new task processing until worker confirmed healthy
```

### State Persistence Strategy

```
operational-state.json structure:
{
  version: 1,
  last_updated: ISO8601,
  worker_status: 'online' | 'restarting' | 'offline',
  active_tasks: [
    {
      task_id: UUID,
      status: 'active' | 'waiting' | 'blocked' | 'stalled',
      current_step: String,
      last_successful_step: String,
      last_update_at: ISO8601,
      stalled_since: ISO8601 | null
    }
  ],
  recent_alerts: [
    { level: 2, message: String, at: ISO8601, task_id: UUID }
  ],
  restart_count_last_hour: Number
}
```

**Persistence guarantee:** operational-state.json is written after every state transition. On worker restart, it reads the file and resumes tracking from last known state.

### Crash Recovery

```
If moosa-worker crashes mid-task:
1. Watchdog detects: heartbeat missing >60s
2. Watchdog: 2-minute recovery window
3. Worker comes back → reads operational-state.json → resumes tasks
4. Worker does not come back → Level 3 alert to Ahmad
5. Tasks that were ACTIVE at crash are marked STALLED
6. Ahmad receives: "Worker crashed during [task]. Recovered state: [state]. Manual intervention may be required."
```

---

## PERSISTENCE STRATEGY

### Primary: operational-state.json (file system)

```
Location: /home/node/.openclaw/workspace/state/operational-state.json
Written: After every state transition (active → waiting, etc.)
Read: On worker startup, on watchdog startup
Survives: Worker restart, watchdog restart
```

### Secondary: Supabase tasks table (existing)

```
Watchdog reads: tasks.status, tasks.last_update_at, tasks.input_json
No writes to tasks table — read-only
For correlation with instruction bridge
```

### Tertiary: Supabase instructions table (Phase 1)

```
instruction.status updated by bridge on state transitions
instruction.state_transitions appends on every change
No watchdog writes — read-only
```

### Write Order (Guaranteed Durability)

```
1. Write operational-state.json to disk (atomic write via temp + rename)
2. THEN update Supabase instruction status if applicable
3. THEN emit WhatsApp alert

Rollback: If Supabase write fails, operational-state.json already updated.
Alert continues to be sent. Supabase will catch up on next write.
```

---

## VALIDATION SEQUENCE

### Before Phase 3 Deployment

1. Verify `state/operational-state.json` does not exist (clean state)
2. Verify watchdog is running: `pm2 logs moosa-watchdog --lines 5`
3. Verify HEARTBEAT.md has current Phase 2 content

### After Phase 3 Deployment

1. **Send test instruction via WhatsApp:**
   ```
   Phase 3 validation test — checking silence detection
   ```

2. **Within 5 minutes, verify:**
   - `state/operational-state.json` created with task entry
   - `status = active` (task being worked)
   - `last_update_at` within 1 minute

3. **At 5-minute mark (stall threshold):**
   - Should see WAITING log in watchdog (no WhatsApp alert yet)
   - operational-state.json shows `status = waiting` or still `active`
   - No alert should fire yet (grace period)

4. **At 10-minute mark (stall alert threshold):**
   - Verify Level 2 alert sent to WhatsApp: "TASK STALLED"
   - operational-state.json shows `status = stalled`
   - `stalled_since` timestamp recorded

5. **Send resume update:**
   ```
   Continue Phase 3 validation — resuming
   ```
   - Verify operational-state.json updated to `status = active`
   - `stalled_since` cleared

6. **Verify worker restart recovery:**
   ```bash
   pm2 restart moosa-worker
   ```
   - Worker should restart within 30 seconds
   - operational-state.json should show `worker_status = online` within 2 minutes
   - No Level 3 alert should fire (grace window respected)

7. **Verify false-positive mitigation:**
   - Send instruction that takes >10 minutes (e.g., "check HubSpot API 10 times with delays")
   - Confirm WAITING state prevents false STALLED alert
   - Confirm alert fires only after task-type-specific thresholds exceeded

8. **Verify restart continuity:**
   - Worker restart recovery should appear in operational-state.json
   - No duplicate alerts for tasks that were ACTIVE before restart

---

## IMPLEMENTATION DETAIL

### state-machine.js — Core API

```javascript
// File: /ops/state-machine.js

exports.STATES = {
  ACTIVE: 'active',
  WAITING: 'waiting',
  BLOCKED: 'blocked',
  STALLED: 'stalled',
  DEGRADED: 'degraded',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

exports.ESCALATION = {
  NONE: 0,
  WARNING: 1,
  ALERT: 2,
  CRITICAL: 3
};

exports.transition(taskId, fromState, toState, metadata) → Promise<{success, newState}>
exports.shouldAlert(state, elapsedMs, taskType) → boolean
exports.getThresholds(taskType) → {active_max_ms, stall_ms, critical_ms}
exports.recordState(taskState) → Promise<void>  // writes to operational-state.json
```

### stale-task-detector.js — Watchdog Extension

```javascript
// File: /ops/stale-task-detector.js
// Called by watchdog every cycle

async function checkStaleTasks() {
  // 1. Read operational-state.json
  // 2. For each ACTIVE task:
  //    - Check elapsed time since last_update_at
  //    - Apply task-type-specific thresholds
  //    - If exceeded: transition to WAITING (5min) or STALLED (10min)
  // 3. For each STALLED task:
  //    - If >5min since stalled_since: escalate to CRITICAL
  //    - Send Level 3 alert to Ahmad
  // 4. Write updated operational-state.json
}
```

### HEARTBEAT.md Additions

```markdown
## Phase 3 — Operational State + Silence Detection

Every heartbeat (every ~30 min):

1. Read `state/operational-state.json`
2. For each ACTIVE task: check last_update_at
   - If >5 min: update status to WAITING, log it
   - If >10 min: update status to STALLED, emit Level 2 alert
   - If STALLED >5 min: emit Level 3 CRITICAL alert
3. For each BLOCKED task: check blocked_since
   - If >60 min: escalate to Ahmad
4. Check worker heartbeat
   - If missing >60s: emit "Worker may be down — monitoring recovery"
   - If missing >120s: Level 3 alert, halt task processing
5. Check restart_count_last_hour
   - If >3: Level 3 alert, halt task processing
```

---

## OPEN QUESTIONS

1. **Supabase tasks table** — watchdog reads but does not write. Is read-only sufficient for stale detection, or does watchdog need to write status to tasks table?

2. **Instruction bridge integration** — Phase 1 created `instructions` table with status. Should stale-task-detector update instruction status alongside task status, or leave instructions read-only?

3. **Alert channel** — WhatsApp is the primary channel. Is email backup required for Level 3 alerts?

---

## APPROVAL REQUIRED

Ahmad — this plan covers all 10 required items:
1. ✅ Exact files/modules — state-machine.js, stale-task-detector.js, HEARTBEAT.md updates
2. ✅ Exact state model — 7 states, transition rules, required fields
3. ✅ Timeout thresholds — 5/10/15/30/60 min by task type
4. ✅ Escalation logic — 4 levels, WhatsApp format, restart grace period
5. ✅ Blast radius — Low-Medium, additive only
6. ✅ Rollback — remove files, git checkout HEARTBEAT.md, restart watchdog
7. ✅ False-positive mitigation — task-type thresholds, cooldown, WAITING state, grace period
8. ✅ Restart/recovery behavior — 2-min window, operational-state.json persistence, crash recovery
9. ✅ Persistence strategy — file system primary, Supabase read-only, write order guaranteed
10. ✅ Validation sequence — 8-step end-to-end test

Please approve to begin implementation.

---

*Moosa — CEO — Phase 3 Implementation Plan*