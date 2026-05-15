# MEMORY.md Archive — Guarded-Exec + Execution-Guard Implementation
## Archived from: MEMORY.md
## Date archived: 2026-05-15
## Reason: Implementation details in code files; preserved for inspection

---

## EXECUTION GUARD — Runtime Coding Governance (2026-05-09, 17:55 Berlin)

### Implementation Complete

**File:** `execution-guard.js` at `/root/.openclaw/workspace/moosa-worker/src/handlers/execution-guard.js`

**What it does:**
- Pre-classifies every exec command before routing
- SAFE commands: git status, git diff, pm2 status, pm2 logs, cat/grep (no redirect), ls, find, sed -n, head, tail, etc.
- CODING commands: node -e, python -c, cat > file, sed -i, tee, CREATE/DROP/ALTER TABLE, code dir paths, SQL DDL, etc.
- EMERGENCY OVERRIDE: Only if Ahmad writes "EMERGENCY DIRECT CODING OVERRIDE APPROVED"

**CLI validator:** `exec-guard.js` + `test-guard-classify.mjs` (11/11 tests passing)

**Key exports:**
- `classifyCommand(cmd)` → { classification, reason, safeToExec, routeToSidecar }
- `isSafeToExec(cmd)` → boolean
- `shouldRouteToSidecar(task)` → boolean
- `executionGuard({ task, command })` → { action, safeToExec, result, governance_log }
- `validateGuard()` → full self-test

**Classification results (11/11 passing):**
- git status → SAFE ✅
- pm2 status → SAFE ✅
- cat /tmp/file.txt | grep hello → SAFE ✅
- node -e "console.log(1)" → CODING ✅
- cat > /tmp/test.js → CODING ✅
- cat >> /tmp/test.js → CODING ✅
- sed -i "s/foo/bar/g" file.txt → CODING ✅
- CREATE TABLE public.clients → CODING ✅
- cat > strateon/followup-engine/test.js → CODING ✅
- tee /tmp/out.txt → CODING ✅
- EMERGENCY DIRECT CODING OVERRIDE APPROVED → EMERGENCY_OVERRIDE ✅

**Commit:** `19dee2c7` — feat: execution-guard.js — runtime coding governance, all 11 classification tests pass

---

## GUARDED-EXEC — Mandatory Execution Wrapper (2026-05-09, 18:05 Berlin)

### Implementation

**guarded-exec.js:** `/root/.openclaw/workspace/moosa-worker/src/handlers/guarded-exec.js`
- ALL exec from Moosa MUST route through `guardedExec()` — not direct `exec`
- `guardedExec({ command })` → classify → SAFE exec direct, CODING route to sidecar
- Emergency override: "EMERGENCY DIRECT CODING OVERRIDE APPROVED" → exec anyway

**guarded-exec-test.mjs:** `/root/.openclaw/workspace/moosa-worker/guarded-exec-test.mjs` — full validation
**guard-test-no-sidecar.mjs:** 33 tests, all passing

**Test results (33/33):**
- Safe commands: git status/diff, pm2 status/logs, cat, ls, find, echo, whoami, ps aux → SAFE ✅
- Coding commands: node -e, python -c, cat >, sed -i, tee, CREATE/DROP/ALTER TABLE → CODING ✅
- UNKNOWN default: blocks by default (safeToExec=false, routeToSidecar=true) ✅
- EMERGENCY OVERRIDE: detected and allowed through ✅

**Commit:** `19dee2c7` — feat: execution-guard.js — runtime coding governance, all 11 classification tests pass

---

## SIDE CAR-CODING ENFORCEMENT — CLOSED (2026-05-09, 18:10 Berlin)

### Implementation Summary

1. **Sidecar-only coding enforcement is implemented at workspace-wrapper level.**
   `guardedExec()` in `guarded-exec.js` is the mandatory execution path. All Moosa exec calls must route through it. CODING commands route to `qwen2.5-coder:7b` via Ollama. 33/33 classification tests passing.

2. **`guardedExec()` is the mandatory execution path.**
   Not advisory. Every shell command from Moosa goes through `guardedExec({ command })` or `guardedExec({ task })`. Bypassing it = governance violation.

3. **OpenClaw tool-level interception remains outside current workspace scope.**
   No `tools.deny` or sandboxing config is accessible via workspace files. The guard is a JavaScript wrapper, not a tool-level block. Residual risk: raw `exec` tool can still be called directly in-session. Addressed by policy + accountability logging, not technical enforcement.

4. **Item is CLOSED unless future OpenClaw-level tool policy becomes available.**
   No further work on this item unless Ahmad requests it or OpenClaw exposes tool-level deny/allow configuration.

### Emergency Override
Ahmad may declare: `EMERGENCY DIRECT CODING OVERRIDE APPROVED` — allows direct exec for critical fixes only, post-incident review required.
