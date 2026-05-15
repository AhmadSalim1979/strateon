# WORKER-RUN_SELF_CHECK_AND_DECIDE VALIDATION PLAN
## Forensics-Only Validation: `run_self_check_and_decide` Handler Execution

**Date:** 2026-05-15
**Objective:** Prove `run_self_check_and_decide` handler executes without `issueContext` or `final_decision_mode` errors
**Constraint:** Evidence and plan only — no implementation

---

## 1. BACKGROUND

### Why This Plan Exists

The previous validation used the `noop` handler, which:
- Does NOT require a dispatch record (but fails at quarantine check anyway)
- Does NOT invoke `run_self_check_and_decide` handler
- Does NOT exercise `decision-model.js` where `final_decision_mode` and `issueContext` exist

**The `noop` validation proves polling works, but NOT that the decision handler works.**

### What Must Be Validated

The `run_self_check_and_decide` handler (registered at `moosa-worker/src/handlers/index.js:126`):
```javascript
registerHandler('run_self_check_and_decide', async ({ taskId }) => {
  return runSelfCheckAndDecide({ taskId });
});
```

The handler calls `runSelfCheckAndDecide()` which:
1. Fetches the task from DB
2. Calls `executeSourcingStrategy()` in `decision-model.js`
3. Inside `executeSourcingStrategy`: `generateCandidates()` and `selectApprovalAwareAction()`
4. `issueContext` and `final_decision_mode` are used inside `decision-model.js`

**The bug would surface during step 3 — inside `executeSourcingStrategy`.**

---

## 2. ROOT CAUSE STATUS

### `issueContext` — Current State

```
FILE: moosa-worker/src/handlers/decision-model.js
DECLARED: line 1764 — `const issueContext = { judgment_score, severity_trend, ... }`
FIRST USE: line 1812 — `generateCandidates(issueContext)`
STATUS: Properly declared before use. No TDZ possible.
```

### `final_decision_mode` — Current State

```
FILE: moosa-worker/src/handlers/decision-model.js
DECLARED: line 2010 — `let final_decision_mode = decision_mode`
USES: lines 2014, 2023, 2038, 2039, 2040 (all AFTER line 2010)
STATUS: Properly declared before use. No TDZ possible.
```

### Historical Errors vs Current Code

| Error | Last Seen | Current Code | Status |
|-------|-----------|--------------|--------|
| `issueContext is not defined` | May 7 audit | Declared at line 1764 | ✅ FIXED or different deployment |
| `Cannot access 'final_decision_mode' before initialization` | May 7 audit | Declared at line 2010, uses after | ✅ FIXED or different deployment |

**Both errors are NOT reproducible in current codebase.** The variables are properly declared and ordered.

---

## 3. DISPATCH REQUIREMENT ANALYSIS

### Why Dispatch Is Required

`core/loop.js:processTask()` at line 66-89:
```javascript
const { data: linkedDispatch, error: dispatchLookupError } = await supabase
  .from('dispatches')
  .select('id, lifecycle_state, executor_ref, executor_claimed')
  .eq('task_id', taskId)
  .maybeSingle();

if (!linkedDispatch) {
  // Orphan quarantine — ALL tasks without dispatch fail here
  await failTask(taskId, `no_dispatch_record: ...`, 1);
  return { success: false, ... };
}
```

**Every task must have a linked dispatch record to reach the handler.**

### Dispatch Record Schema

```json
{
  "id": "uuid",
  "dispatch_ref": "string (human label)",
  "task_id": "uuid (FK to tasks.id)",
  "lifecycle_state": "execution_pending | completed | failed",
  "executor_ref": "moosa-worker",
  "executor_claimed": false,
  "created_at": "timestamp"
}
```

### Scheduler Pattern (Reference)

`moosa-worker/scripts/schedule-self-check.js` creates tasks with dispatch records:
```javascript
// Step 1: Create task
const { data: { id: taskId } } = await supabase.from('tasks').insert({...});

// Step 2: Create dispatch with task_id link
await supabase.from('dispatches').insert({
  id: dispatchId,
  task_id: taskId,
  lifecycle_state: 'execution_pending',
  executor_ref: 'moosa-worker',
  dispatch_ref: `dispatch/self_check/${dispatchId}`
});
```

---

## 4. VALIDATION PLAN

### Approach: Create Dispatch-Linked Validation Task

Create a `run_self_check_and_decide` task WITH a linked dispatch record, using `execution_pending` lifecycle_state. This is the exact pattern the scheduler uses.

### Step 1: Create Validation Task

```javascript
POST /rest/v1/tasks
{
  "goal": "WORKER_RUN_SELF_CHECK_VALIDATION_DO_NOT_EXECUTE_CUSTOMER_WORK: verify run_self_check_and_decide handler executes without issueContext/final_decision_mode errors",
  "status": "created",
  "action_type": "run_self_check_and_decide",
  "input_json": {
    "validation_marker": "WORKER_RUN_SELF_CHECK_VALIDATION_DO_NOT_EXECUTE_CUSTOMER_WORK",
    "validation_time": "<current UTC timestamp>",
    "created_by": "forensics-validation",
    "test_mode": true
  },
  "created_at": "<current UTC timestamp>"
}
```

**Response will include `id` — save as `TASK_ID`.**

### Step 2: Create Linked Dispatch Record

```javascript
POST /rest/v1/dispatches
{
  "id": "<new UUID>",
  "dispatch_ref": "dispatch/validation/<TASK_ID>",
  "task_id": "<TASK_ID>",
  "lifecycle_state": "execution_pending",
  "executor_ref": "moosa-worker",
  "executor_claimed": false,
  "created_at": "<current UTC timestamp>"
}
```

**This is the key difference from previous failed validations.**

### Step 3: Wait for Worker Polling

Worker polls every ~10 seconds. Wait 15-30 seconds.

```
PM2 log should show:
  "Found 1 pending tasks"  ← worker found the task
  "[OrphanQuarantine] ... no linked dispatch found."  ← SHOULD NOT APPEAR
  OR handler execution starting...
```

### Step 4: Verify Status Transition

```javascript
GET /rest/v1/tasks?id=eq.<TASK_ID>
```

Expected outcomes:

**SUCCESS (handler executes cleanly):**
```
status: "completed"
output_json: { action, status, decision_context, ... }
error_message: null
```

**HANDLER ERROR (if bug is active):**
```
status: "failed"
error_message: "issueContext is not defined"
     OR: "Cannot access 'final_decision_mode' before initialization"
output_json: null
```

**DISPATCH ERROR (task found but dispatch check fails):**
```
status: "failed"
error_message: "no_dispatch_record: ... Orphan quarantined..."
```
This would mean the dispatch insert didn't work.

### Step 5: Check PM2 Logs for Error Strings

```bash
pm2 logs moosa-worker --lines 50 --nostream 2>&1 | \
  grep -E "issueContext|final_decision_mode|TDZ|not defined|before initialization" || \
  echo "NO MATCHES FOUND"
```

### Step 6: Check error_reports Table

```javascript
GET /rest/v1/error_reports?order=created_at.desc&limit=5
```

Expected: 0 new error reports for this task.

### Step 7: Cleanup

**Option A (recommended):** Mark task as archived/completed via status update:
```javascript
PATCH /rest/v1/tasks?id=eq.<TASK_ID>
{ "status": "completed" }
```

**Option B:** Delete both records:
```javascript
DELETE /rest/v1/dispatches?task_id=eq.<TASK_ID>
DELETE /rest/v1/tasks?id=eq.<TASK_ID>
```

---

## 5. MINIMAL BLAST RADIUS

| Action | Risk | Blast Radius |
|--------|------|--------------|
| Insert validation task | **NONE** | New row in tasks table |
| Insert dispatch record | **NONE** | New row in dispatches table |
| Task processed by worker | **NONE** | Read-only decision cycle, no outbound |
| Cleanup delete | **LOW** | Removes only the 2 validation records |

**No customer data touched. No outbound messages. No operational actions.**

---

## 6. ROLLBACK PLAN

If validation corrupts state (unlikely):

```bash
# Delete validation records manually
DELETE /rest/v1/dispatches?dispatch_ref=like.%22dispatch/validation/%22
DELETE /rest/v1/tasks?goal=like.%22WORKER_RUN_SELF_CHECK_VALIDATION%22
```

If worker crashes:
```bash
pm2 restart moosa-worker
```

If dispatch insert somehow affects production:
- Dispatch records are independent rows
- Only the specific validation dispatch is affected
- Production tasks with dispatch records are untouched

---

## 7. VALIDATION SUCCESS CRITERIA

| Criterion | Pass Condition |
|-----------|----------------|
| Task created with `status=created` | Task row exists with correct goal marker |
| Dispatch record created with `task_id` link | Dispatch row exists with `task_id = TASK_ID` |
| Worker finds task within 30s | PM2 log shows "Found 1 pending tasks" |
| OrphanQuarantine does NOT fire | PM2 log does NOT show "no linked dispatch found" for this task |
| Handler starts | PM2 log shows handler execution starting |
| Task status changes to `completed` or `failed` | Task row status is no longer `created` |
| Zero `issueContext` error | No "issueContext is not defined" in PM2 logs |
| Zero `final_decision_mode` TDZ | No "Cannot access 'final_decision_mode'" in PM2 logs |
| Zero error_reports | No new error_reports row for this task |
| PM2 remains online | Worker PID unchanged, 0 restarts |
| Cleanup complete | Validation task/dispatch deleted or marked completed |

---

## 8. EVIDENCE OUTPUT FORMAT

Post-validation evidence report must include:

```
1. Task ID and creation timestamp
2. Dispatch record ID and creation timestamp
3. PM2 log excerpt showing task pickup (16:XX:XX Found 1 pending tasks)
4. PM2 log excerpt showing handler execution OR OrphanQuarantine
5. Final task status (completed/failed)
6. Final task output_json (if completed)
7. Final task error_message (if failed)
8. grep for issueContext/final_decision_mode in PM2 logs
9. error_reports table count post-validation
10. PM2 status (PID, uptime, restarts)
11. Cleanup confirmation
```

---

## 9. LIMITATIONS

### What This Plan Does NOT Prove

- It does NOT prove `generateCandidates()` or `selectApprovalAwareAction()` produce correct outputs
- It proves the handler STARTS and COMPLETES (or fails cleanly)
- It proves `issueContext` and `final_decision_mode` are NOT thrown as errors during execution

### Why This Is Sufficient

The historical errors were **synchronous JavaScript exceptions** during handler initialization:
- `ReferenceError: issueContext is not defined` — thrown when variable is accessed as undeclared
- `ReferenceError: Cannot access 'final_decision_mode' before initialization` — thrown by TDZ when `let` variable accessed before declaration line

These errors would occur at the **first line** of the handler that uses either variable. If the handler reaches completion (even with a failed status), it means those lines were executed without throwing.

**A clean handler completion = those errors are not present in current code.**

---

## 10. IMPLEMENTATION COMMAND SEQUENCE (Reference Only)

```bash
# Step 1: Create task (returns TASK_ID)
TASK_ID=$(curl -s -X POST .../rest/v1/tasks \
  -d '{"goal":"WORKER_RUN_SELF_CHECK_VALIDATION...","status":"created","action_type":"run_self_check_and_decide",...}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

# Step 2: Create dispatch
curl -s -X POST .../rest/v1/dispatches \
  -d '{"id":"<UUID>","task_id":"'$TASK_ID'","lifecycle_state":"execution_pending",...}'

# Step 3: Wait
sleep 20

# Step 4: Check result
curl -s .../rest/v1/tasks?id=eq.$TASK_ID | python3 -m json.tool

# Step 5: Check logs
pm2 logs moosa-worker --lines 30 --nostream 2>&1 | grep "TASK_ID\|issueContext\|final_decision_mode"

# Step 6: Cleanup
curl -s -X DELETE .../rest/v1/dispatches?task_id=eq.$TASK_ID
curl -s -X DELETE .../rest/v1/tasks?id=eq.$TASK_ID
```

---

*Plan complete. Awaiting Ahmad approval to proceed with implementation.*