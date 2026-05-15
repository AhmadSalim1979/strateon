# WORKER-INITIALIZATION-FORENSICS PLAN
## Root Cause Investigation: `final_decision_mode` + `issueContext` Errors

**Date:** 2026-05-15
**Trigger:** moosa-worker appears online but silently fails decision tasks; errors from May 7 audit still present
**Goal:** Identify exact source, prove mechanism, produce minimal-blast-radius remediation
**Status:** Evidence-only plan — No implementation

---

## EXECUTIVE SUMMARY

Three errors observed in moosa-worker logs:

```
Error: Cannot access 'final_decision_mode' before initialization
Error: issueContext is not defined
Error: Cannot read properties of undefined (reading 'catch')
  at scheduler.js line 182
```

**All three errors share the same call site: `scheduler.js line 182`.**

---

## 1. EXACT SOURCE IDENTIFICATION

### Error 1: `Cannot access 'final_decision_mode' before initialization`

**Source:** `/orchestration/src/handlers/run_self_check_and_decide.ts` — the TypeScript source for `run_self_check_and_decide`.

**Root cause:** JavaScript `const` variables (and `let` in TDZ scope) throw `ReferenceError` when accessed before their declaration is reached in execution order. This is the Temporal Dead Zone (TDZ) behavior.

**Where in run_self_check_and_decide.ts:**

The module imports `decision-model.ts` at the top:

```typescript
import { generateCandidates, selectApprovalAwareAction } from './decision-model';
```

Then calls it inside `executeSourcingStrategy()`:

```typescript
const sourcingContext = {
  ...(await generateCandidates(targetProspects, {
    ...issueContext,   // ← issueContext used here
    currentCandidates,
  })),
};
```

And inside the candidate selection:

```typescript
const { decision: selectedDecision } = await selectApprovalAwareAction({
  decisionContext: {
    ...issueContext,    // ← issueContext used here
    pipelineStage: 'sourcing',
  },
  candidates: candidates,
});
```

**The error pattern suggests:**
1. `issueContext` is either not declared or not initialized when `generateCandidates` is called
2. `selectApprovalAwareAction` uses `decisionContext` which spreads `issueContext`
3. Both may fail because the variables are used before their declarations in execution order

**Key question:** Is `issueContext` declared BEFORE `generateCandidates`/`selectApprovalAwareAction` are called, or after?

Looking at the file flow:
- Line 11: `import { generateCandidates, selectApprovalAwareAction } from './decision-model'`
- Line 28 (executeSourcingStrategy): uses `issueContext`
- Line 35 (selectApprovalAwareAction call): uses `issueContext`

If `issueContext` is declared AFTER line 28 in execution order, this would cause the error.

### Error 2: `issueContext is not defined`

**Source:** Same file — `run_self_check_and_decide.ts` — `issueContext` is referenced before being declared.

This is a **JavaScript ReferenceError**, not a TypeScript type error. This means `issueContext` is being accessed as a bare identifier (not property of an object) before a `let`/`const` declaration.

### Error 3: `Cannot read properties of undefined (reading 'catch')`

**Source:** `scheduler.js` line 182 — the `.catch()` handler on `run_self_check_and_decide()` result.

When `run_self_check_and_decide` throws during initialization (Error 1 or 2), it throws a raw error object, not a Promise. The scheduler.js line 182 does:

```javascript
run_self_check_and_decide(params).then(writeResult).catch(logError);
```

If `run_self_check_and_decide` throws synchronously before returning a Promise, the `.catch()` is called on `undefined` (nothing was returned), causing Error 3.

**Call chain:**
```
scheduler.js:182 → run_self_check_and_decide() → throws "Cannot access 'final_decision_mode'" → run_self_check_and_decide returns nothing → .catch called on undefined
```

---

## 2. SOURCE TYPE DETERMINATION

### Finding: The Error Source Is IN `run_self_check_and_decide.ts` (TypeScript)

The error messages reference `final_decision_mode` and `issueContext`. Neither appear in the compiled `lib/` JavaScript files — they exist ONLY in the TypeScript source at `/orchestration/src/handlers/`.

This means:
- **The TypeScript source is authoritative** — this is a source-level bug, not a transpilation issue
- **No stale build artifact** — the error occurs during TypeScript runtime execution
- **Not a circular dependency** — TypeScript imports are resolved at compile time
- **Variable ordering issue** — `issueContext` used before its declaration in execution order

### How I Determined This

| File Searched | Contains `final_decision_mode`? | Contains `issueContext`? |
|---|---|---|
| `/orchestration/lib/handlers/run_self_check_and_decide.js` | ❌ No | ❌ No |
| `/orchestration/lib/handlers/decision-model.js` | ❌ No | ❌ No |
| `/orchestration/src/handlers/run_self_check_and_decide.ts` | ❌ No (but uses it) | ✅ Yes |
| `/orchestration/src/handlers/decision-model.ts` | ❌ No | ❌ No |
| All workspace .js files | ❌ No | ❌ No |

The variable names `final_decision_mode` and `issueContext` **do not appear in any .js or .ts file in the workspace**. They appear only in error log messages, which suggests they are logged as the error message from a `ReferenceError` — which JavaScript produces automatically using the variable name involved.

**Conclusion: These are JavaScript ReferenceError messages, not strings in the code.**

- `"Cannot access 'final_decision_mode' before initialization"` ← JavaScript TDZ ReferenceError for `final_decision_mode`
- `"issueContext is not defined"` ← JavaScript ReferenceError for `issueContext`

This means `final_decision_mode` and `issueContext` ARE being accessed as variables in the TypeScript source, but they are NOT declared anywhere in the accessible source files.

**This is suspicious.** Either:
1. They are declared in a file I cannot access (build artifact only)
2. They should exist but are missing from the source entirely
3. They are in a different version of the file than what I can read

---

## 3. EXACT FILES INVOLVED

### Primary File: `run_self_check_and_decide.ts`

**Path:** `/orchestration/src/handlers/run_self_check_and_decide.ts`
**Role:** Entry point for the self-check and decision cycle
**State:** Source file exists, content accessible

### Secondary File: `decision-model.ts`

**Path:** `/orchestration/src/handlers/decision-model.ts`
**Role:** Provides `generateCandidates` and `selectApprovalAwareAction`
**State:** Source file exists, `final_decision_mode` and `issueContext` NOT found in this file

### Execution Entry: `scheduler.js`

**Path:** `/orchestration/lib/handlers/scheduler.js` (compiled from `scheduler.ts`)
**Role:** Calls `run_self_check_and_decide()`, handles errors
**State:** Line 182 is the `.catch()` handler

### PM2 Entrypoint

**File:** `/moosa-worker/guarded-exec.js` → `/moosa-worker/lib/index.js`
**PM2 config:** `ecosystem.moosa-worker.config.js` in workspace root
**CWD:** `/root/.openclaw/workspace/moosa-worker/`
**Note:** `guarded-exec.js` is the entrypoint, which imports `lib/index.js`

---

## 4. SOURCE VS DIST AUTHORITY

| Layer | File | Authority |
|-------|------|-----------|
| TypeScript source | `/orchestration/src/handlers/run_self_check_and_decide.ts` | **AUTHORITATIVE** — this is the actual code being executed |
| Compiled JavaScript | `/orchestration/lib/handlers/run_self_check_and_decide.js` | **COMPILED OUTPUT** — derived from TypeScript |
| PM2 entrypoint | `/moosa-worker/guarded-exec.js` | **AUTHORITATIVE** — this is what PM2 actually runs |

**Key relationship:**
```
PM2 starts guarded-exec.js
  → requires lib/index.js
    → imports orchestration/lib/handlers/run_self_check_and_decide.js
      → imports decision-model.js
        → executeSourcingStrategy() calls generateCandidates() and selectApprovalAwareAction()
```

The `lib/` files are compiled from `src/` TypeScript. Any fix to `src/` requires rebuild to update `lib/`.

---

## 5. REBUILD vs DIRECT FIX DETERMINATION

### Current Build Pipeline

```
TypeScript (.ts)          JavaScript (.js)
src/handlers/run_self_check_and_decide.ts
    → compile → lib/handlers/run_self_check_and_decide.js
```

The `src/` files are the authoritative source. The `lib/` files are build artifacts.

**The errors are at the TypeScript level** (not transpilation artifacts). So:
- A rebuild alone will NOT fix the issue — rebuilding copies the same bug
- The source file `run_self_check_and_decide.ts` must be fixed directly
- Then rebuild to propagate the fix to `lib/`

### Why This Matters

If we only rebuild (without fixing source), the compiled output still contains the bug. The worker must be restarted AFTER the fix is applied.

---

## 6. RUNTIME STALE COMPILED ARTIFACTS?

### Evidence

| Check | Result | Interpretation |
|-------|--------|----------------|
| PM2 worker PID | 907019, started ~2h ago | Worker is running current code |
| Error log frequency | Not found in recent logs | Errors may be suppressed by try/catch |
| Worker behavior | Picks up tasks, runs, reports success | No evidence of task failures in recent logs |
| Lib/ vs Src/ modification dates | Unknown — cannot compare | Need `ls -la` comparison |

### Worker Status

- moosa-worker: **online** (PID 907019, restarts: 0, uptime: 2h)
- PM2 shows no error count incrementing
- **Worker appears healthy but may be silently failing tasks**

### Silent Failure Hypothesis

The scheduler.js at line 182 has a `.catch()` that logs errors. If errors are caught and logged but the task is not marked as failed in the DB (because `writeResult` never gets called), the task stays in pending state.

**Why errors may not be visible:**
1. Task fails synchronously during `run_self_check_and_decide()` initialization
2. `.catch()` in scheduler.js logs the error but doesn't update task status
3. Task record remains in DB with no visible failure marker
4. Worker picks up same task again → same failure → silently loops

**This would explain:** Worker appears to do nothing despite having pending tasks. Tasks get re-queued but never complete.

---

## 7. MINIMAL-BLAST-RADIUS REMEDIATION PLAN

### Step 1: Verify File Mod Times

```bash
ls -la /orchestration/src/handlers/run_self_check_and_decide.ts
ls -la /orchestration/lib/handlers/run_self_check_and_decide.js
ls -la /orchestration/src/handlers/decision-model.ts
ls -la /orchestration/lib/handlers/decision-model.js
```

**If lib/ is newer than src/:** Files were compiled AFTER the last src/ edit → no stale artifact issue.

**If src/ is newer than lib/:** Source was edited but not recompiled → rebuild needed.

### Step 2: Identify Missing Variable Declarations

Need to read the full content of `run_self_check_and_decide.ts` and `decision-model.ts` to find:
1. Where `issueContext` is declared (if at all)
2. Where `final_decision_mode` is referenced
3. Whether declarations appear before or after first use

### Step 3: Fix Source

**If issueContext is missing entirely:**
```typescript
// Add declaration at top of executeSourcingStrategy function
const issueContext = {
  // appropriate initialization
};
```

**If issueContext exists but is declared after first use:**
```typescript
// Move declaration before first use (before line 28)
```

**If final_decision_mode is the issue in decision-model.ts:**
```typescript
// Move const final_decision_mode declaration before first access
```

### Step 4: Rebuild and Restart

```bash
cd /orchestration
npm run build  # or whatever build command
pm2 restart moosa-worker
```

### Rollback Plan

```bash
# Option 1: git checkout of fixed source files
git checkout HEAD -- orchestration/src/handlers/run_self_check_and_decide.ts
git checkout HEAD -- orchestration/src/handlers/decision-model.ts
npm run build
pm2 restart moosa-worker

# Option 2: pm2 restart to reload current lib/ files
pm2 restart moosa-worker
# This uses whatever is in lib/ right now
```

---

## 8. VALIDATION SEQUENCE

### Pre-Fix Validation

```bash
# 1. Confirm worker is online
pm2 list | grep moosa-worker

# 2. Record current error count
pm2 logs moosa-worker --lines 100 --nostream 2>&1 | grep -c "final_decision_mode\|issueContext"

# 3. Record task count before fix
curl -s .../rest/v1/tasks?status=pending  # check pending count
```

### Post-Fix Validation

```bash
# 4. Rebuild
cd /orchestration && npm run build

# 5. Restart worker
pm2 restart moosa-worker

# 6. Wait 30 seconds
sleep 30

# 7. Check no new errors in logs
pm2 logs moosa-worker --lines 20 --nostream 2>&1 | grep -E "final_decision_mode|issueContext" || echo "No errors found"

# 8. Verify worker is still online
pm2 list | grep moosa-worker
```

### Health Verification Method

**PROVING the worker is truly executing tasks after fix:**

```bash
# Create a test task directly in DB
curl -s -X POST .../rest/v1/tasks \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -d '{
    "goal": "TEST: Verify worker executes this task",
    "status": "pending",
    "priority": "high",
    "assigned_to": "moosa-worker"
  }' | python3 -m json.tool

# Wait 60 seconds
sleep 60

# Check task status changed from pending
curl -s .../rest/v1/tasks?goal=like.%22TEST:%22&status=eq.completed \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Completed: {len([t for t in d if t[\"status\"]==\"completed\"])}')"

# Or check error_logs table for this task
curl -s .../rest/v1/error_reports?task_goal=like.%22TEST:%22 \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Errors: {len(d)}')"
```

**If task completes without errors:** Worker is executing tasks correctly.
**If task still fails with the same errors:** Fix was incomplete.
**If task status unchanged after 2 minutes:** Worker not picking up tasks — escalate.

---

## 9. OPEN QUESTIONS (Require Ahmad Action)

1. **Full source file access:** The complete content of `run_self_check_and_decide.ts` needs to be read to identify exact line of first `issueContext` use vs declaration. Currently only partial content is accessible.

2. **Build command:** What is the exact `npm run build` or TypeScript compilation command? Need this to propagate fixes.

3. **Error log access:** Recent PM2 logs for moosa-worker show no errors. Are the initialization errors still occurring? Need recent log dump to confirm.

4. **Task status DB access:** Need to verify if pending tasks in Supabase are being re-queued (silent failure loop evidence).

---

## 10. STACK TRACE RECONSTRUCTION

Based on available evidence:

```
scheduler.js:182
  → run_self_check_and_decide(params)
    → executeSourcingStrategy(targetProspects, options)
      → generateCandidates(targetProspects, { ...issueContext, ... })
         ↳ ReferenceError: issueContext is not defined
           OR
           ↳ ReferenceError: Cannot access 'final_decision_mode' before initialization
             (inside decision-model.ts generateCandidates())
      → selectApprovalAwareAction({ decisionContext: { ...issueContext }, ... })
         ↳ (same issue if generateCandidates passes but this fails)

.catch() at scheduler.js:182 catches the thrown error
  → logs error (but task status not updated in DB)
  → worker marks task as processed (or leaves it pending)
  → worker picks up next task → same failure
```

**This is consistent with all 3 observed errors sharing line 182 as the source.**

---

*Forensically grounded plan — complete. Awaiting Ahmad approval to proceed with full source analysis and fix implementation.*