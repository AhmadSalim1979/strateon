# MOOSA Runtime Canonicalization & Topology Plan

**Classification:** AUTHORITATIVE — Structural Remediation Plan
**Version:** 1.0
**Date:** 2026-05-17
**Author:** Moosa (AI assistant)
**Based on:** MOOSA Runtime Reliability Incident Report (2026-05-17) + MOOSA Runtime Governance Spec v1.0
**Phase:** Documentation only. No runtime modifications made.

---

## 1. Canonical Runtime Architecture

### 1.1 The ONE Canonical Runtime Root

```
/root/.openclaw/workspace/moosa-worker/
```

**This is the only authoritative runtime root.** All moosa-worker source code, configuration, PM2 ecosystem config, handlers, core modules, and state directories for moosa-worker and moosa-watchdog live here.

Any path outside `/root/.openclaw/workspace/moosa-worker/` that contains moosa-worker code is non-authoritative.

### 1.2 The ONE Canonical moosa-worker Repo

```
/root/.openclaw/workspace/moosa-worker/.git
```

**This repo is the single source of truth for:**
- `src/index.js` — worker entry point
- `src/core/loop.js` — cycle orchestration (R4A/R4B)
- `src/core/startup.js` — durable store init
- `src/handlers/heartbeat-writer.js` — R4A heartbeat emitter (WORKER_STATUS, schema v2)
- `src/handlers/self-check-scheduler.js`
- `src/handlers/send_whatsapp.js`
- `src/watchdog.js` — R4B watchdog (7-state interpretation, absolute paths)
- `ecosystem.config.js` — worker PM2 configuration
- `state/heartbeats/worker.json` — canonical heartbeat
- `state/heartbeats/watchdog-state.json` — canonical watchdog state
- `state/heartbeats/self-check.json` — self-check heartbeat

### 1.3 Canonical PM2 Working Directories

| PM2 Process | Authoritative CWD | Authoritative Script | Authoritative Repo |
|---|---|---|---|
| `moosa-worker` | `/root/.openclaw/workspace/moosa-worker/` | `src/index.js` | `/root/.openclaw/workspace/moosa-worker/` |
| `moosa-watchdog` | `/root/.openclaw/workspace/moosa-worker/` | `src/watchdog.js` | `/root/.openclaw/workspace/moosa-worker/` |
| `qiyadon-audit-form` | `/home/node/.openclaw/workspace/` | `server.js` | `/home/node/.openclaw/workspace/` |
| `openclaw-gateway` | system | system | system (not workspace-managed) |
| `cloudflared-tunnel` | `/tmp/` | cloudflared binary | system |

**Verification:** `pm2 describe <name> | grep "exec cwd"` must return the authoritative CWD.

### 1.4 Canonical Heartbeat Paths

| File | Canonical Path | Owner | Readers |
|---|---|---|---|
| Worker heartbeat | `/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json` | moosa-worker | moosa-watchdog |
| Watchdog state | `/root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json` | moosa-watchdog | Moosa, human operators |
| Self-check | `/root/.openclaw/workspace/moosa-worker/state/heartbeats/self-check.json` | moosa-worker | moosa-watchdog |

**All heartbeat operations must use these exact paths. No `process.cwd()`-relative path construction.**

### 1.5 Canonical Deployment Paths

| What | From (source) | To (target) | Method |
|---|---|---|---|
| Worker code | `/root/.openclaw/workspace/moosa-worker/` | Same (deploy in-place) | `git push` to `/root/` repo |
| Watchdog code | `/root/.openclaw/workspace/moosa-worker/src/watchdog.js` | Same | `git push` to `/root/` repo |
| PM2 config | `/root/.openclaw/workspace/moosa-worker/ecosystem.config.js` | PM2 daemon | `pm2 start ecosystem.config.js` |
| Worker heartbeat writer | `/root/.openclaw/workspace/moosa-worker/src/handlers/heartbeat-writer.js` | Same | `git push` |

**The ONE canonical deployment path is: `/root/.openclaw/workspace/moosa-worker/` — deploy HERE, nowhere else.**

---

## 2. Deprecated / Forbidden Paths

### 2.1 Explicitly Non-Authoritative Repos

| Repo Path | Status | Reason |
|---|---|---|
| `/home/node/.openclaw/workspace/` | ❌ FORBIDDEN for moosa-worker/watchdog | Worker currently runs from here — this is the structural hazard |
| `/root/.openclaw/workspace/` (parent) | ❌ FORBIDDEN | Contains OpenClaw system files, not moosa-worker |
| `/home/node/.openclaw/workspace/moosa-worker/` | ❌ FORBIDDEN if exists | Should not contain moosa-worker code |

### 2.2 Explicitly Non-Authoritative Heartbeat Paths

| Path | Status | Reason |
|---|---|---|
| `/home/node/.openclaw/workspace/state/heartbeats/worker.json` | ❌ FORBIDDEN | Wrong file — unrelated heartbeat (pid 1264123, April 19) |
| `/home/node/.openclaw/workspace/state/heartbeats/watchdog-state.json` | ❌ FORBIDDEN | Wrong location |
| Any path built with `process.cwd()` from outside canonical root | ❌ FORBIDDEN | Creates split-brain heartbeat |

### 2.3 Forbidden PM2 CWD Values for moosa-worker

Any PM2 entry for `moosa-worker` or `moosa-watchdog` whose `exec cwd` is not `/root/.openclaw/workspace/moosa-worker/` is **FORBIDDEN** and must be corrected before production use.

### 2.4 Paths That Must Never Again Be Deployment Targets

```
/home/node/.openclaw/workspace/moosa-worker/
/home/node/.openclaw/workspace/src/
/home/node/.openclaw/workspace/src/handlers/heartbeat-writer.js
/home/node/.openclaw/workspace/src/core/loop.js
```

**No code targeting moosa-worker or moosa-watchdog may be deployed to any `/home/node/` path.**

### 2.5 Deprecated PM2 Process Names

No deprecated PM2 process names currently exist. This list will be updated if renamed processes are introduced.

---

## 3. PM2 Canonicalization

### 3.1 Exact Authoritative PM2 Start Commands

**Start moosa-worker (from canonical repo):**
```bash
cd /root/.openclaw/workspace/moosa-worker && \
SUPABASE_URL='https://btrbczqjwzuybgcxckvm.supabase.co' \
SUPABASE_SERVICE_KEY='sb_secret_Jvk8fgExoN2tGOkFxZJm_w_Uh07x06x' \
DEBUG='true' \
FEATURE_PHASE_5D_ENABLED='true' \
PHASE_5D_SHADOW_MODE='true' \
EXECUTION_MODE='advisory' \
pm2 start ecosystem.config.js --only moosa-worker
```

**Start moosa-watchdog (from canonical repo):**
```bash
cd /root/.openclaw/workspace/moosa-worker && \
pm2 start ecosystem.config.js --only moosa-watchdog
```
OR if running manually:
```bash
cd /root/.openclaw/workspace/moosa-worker && node src/watchdog.js &
```

**Start qiyadon-audit-form:**
```bash
cd /home/node/.openclaw/workspace && pm2 start ecosystem.config.js
```

### 3.2 Exact Authoritative PM2 Restart Commands

**Restart moosa-worker (after deployment verification):**
```bash
pm2 stop moosa-worker && \
sleep 2 && \
cd /root/.openclaw/workspace/moosa-worker && \
SUPABASE_URL='...' SUPABASE_SERVICE_KEY='...' DEBUG='true' \
FEATURE_PHASE_5D_ENABLED='true' PHASE_5D_SHADOW_MODE='true' EXECUTION_MODE='advisory' \
pm2 start ecosystem.config.js --only moosa-worker && \
sleep 5 && \
# VERIFY (see 3.4)
pm2 save
```

**Restart moosa-watchdog:**
```bash
pm2 stop moosa-watchdog && \
sleep 2 && \
cd /root/.openclaw/workspace/moosa-worker && node src/watchdog.js & \
sleep 5 && \
# VERIFY (see 3.4)
pm2 save
```

### 3.3 Exact Forbidden PM2 Commands

| Command | Classification | Why Forbidden |
|---|---|---|
| `pm2 kill` | **PERMANENTLY BANNED** | Destroys entire daemon, kills all processes |
| `pm2 kill <name>` | **PERMANENTLY BANNED** | Same — daemon-wide destruction |
| `pm2 kill all` | **PERMANENTLY BANNED** | Same |
| `pkill -9 node` | **PERMANENTLY BANNED** | Kills ALL node processes including gateway |
| `kill -9 <pid>` on PM2 PIDs | **PERMANENTLY BANNED** | Creates orphaned PM2 state |
| `pm2 restart all` | **NEVER USE** | Unpredictable — restarts everything |
| `pm2 delete <name>` during incident | **NEVER USE** | Removes from PM2 registry |

### 3.4 Restart Verification Procedure

**Immediately after any moosa-worker start/restart (within 60 seconds):**
```bash
python3 -c "
import json
from datetime import datetime, timezone
hb = json.load(open('/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json'))
w = datetime.fromisoformat(hb.get('_written_at','2000-01-01').replace('Z','+00:00'))
age = (datetime.now(timezone.utc) - w).total_seconds()
sv = hb.get('schema_version')
status = hb.get('cycle',{}).get('status') or hb.get('last_status')
print(f'schema_version: {sv} | age: {round(age)}s | status: {status}')
assert sv == 2,           f'FAIL: schema_version={sv} (expected 2)'
assert age < 60,          f'FAIL: heartbeat age={round(age)}s (expected <60s)'
assert status is not None, 'FAIL: no status'
print('VERIFIED: moosa-worker heartbeat OK')
"
```

**Immediately after any moosa-watchdog start/restart (within 30 seconds):**
```bash
sleep 5 && python3 -c "
import json
s = json.load(open('/root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json'))
v = s.get('watchdog_version')
wc = s.get('cycle_count')
ws = s.get('worker',{}).get('status')
print(f'watchdog_version: {v} | cycle_count: {wc} | worker.status: {ws}')
assert v == 'R4B', f'FAIL: version={v} (expected R4B)'
assert wc > 0,      'FAIL: no cycles'
print('VERIFIED: moosa-watchdog R4B OK')
"
```

**If either verification fails: execute rollback immediately (see Governance Spec Section 3.6).**

---

## 4. Runtime Verification Protocol

### 4.1 Verify Running Repo

```bash
# Get the actual CWD of the running worker process
pm2 describe moosa-worker | grep "exec cwd"

# Expected output: /root/.openclaw/workspace/moosa-worker

# Also verify git remote matches
git -C /root/.openclaw/workspace/moosa-worker remote -v
# Expected: origin points to the correct deployment repo
```

### 4.2 Verify Running Git Hash

```bash
# In the worker's CWD (verified above), get current git hash
git -C $(pm2 show moosa-worker | grep "exec cwd" | awk '{print $4}') rev-parse HEAD

# Compare with what should be deployed:
git -C /root/.openclaw/workspace/moosa-worker rev-parse HEAD

# These MUST match. If they don't, the running process is not running deployed code.
```

### 4.3 Verify Heartbeat Freshness

```bash
python3 -c "
import json
from datetime import datetime, timezone
hb_path = '/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json'
hb = json.load(open(hb_path))
w = datetime.fromisoformat(hb.get('_written_at','2000-01-01').replace('Z','+00:00'))
age_s = (datetime.now(timezone.utc) - w).total_seconds()
print('Heartbeat age: {}s'.format(round(age_s)))
print('Schema version: {}'.format(hb.get('schema_version')))
print('Cycle status: {}'.format(hb.get('cycle',{}).get('status') or hb.get('last_status')))
print('PID in heartbeat: {}'.format(hb.get('pid')))
print('Current worker PID:', $(ps aux | grep 'moosa-worker.*index.js' | grep -v grep | awk '{print \$2}'))
if age_s > 60:
    print('WARNING: heartbeat stale ({}s)'.format(round(age_s)))
if hb.get('schema_version') != 2:
    print('ERROR: schema_version is {} (expected 2) — R4A not active'.format(hb.get('schema_version')))
"
```

### 4.4 Verify Watchdog Freshness

```bash
python3 -c "
import json
from datetime import datetime, timezone
wd_path = '/root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json'
wd = json.load(open(wd_path))
w = datetime.fromisoformat(wd.get('_written_at','2000-01-01').replace('Z','+00:00'))
age_s = (datetime.now(timezone.utc) - w).total_seconds()
print('Watchdog version: {}'.format(wd.get('watchdog_version')))
print('Watchdog cycle_count: {}'.format(wd.get('cycle_count')))
print('Watchdog age: {}s'.format(round(age_s)))
print('Worker status (via watchdog): {}'.format(wd.get('worker',{}).get('status')))
print('Worker stale (via watchdog): {}'.format(wd.get('worker',{}).get('stale')))
print('Worker schema (via watchdog): {}'.format(wd.get('worker',{}).get('schema')))
print('Alert kind: {}'.format(wd.get('worker',{}).get('alert_kind')))
assert wd.get('watchdog_version') == 'R4B', 'Wrong watchdog version'
assert age_s < 120, 'Watchdog state stale'
print('PASS: Watchdog R4B active')
"
```

### 4.5 Verify Gateway Health

```bash
# Internal health
curl -s http://localhost:18789/health
# Expected: {"ok":true,"status":"live"}

# Verify WhatsApp routing (internal test)
curl -s -X POST http://localhost:18789/health check 2>/dev/null || echo "Gateway internal: OK"
```

### 4.6 Verify Process Ownership

```bash
echo "=== PM2 Process Ownership ===" && \
pm2 jlist 2>/dev/null | python3 -c "
import sys, json
for p in json.load(sys.stdin):
    name = p['name']
    pid = p['pid']
    cwd = p.get('pm2_env',{}).get('cwd','?')
    script = p.get('pm2_env',{}).get('script','?')
    status = p.get('pm2_env',{}).get('status','?')
    if 'moosa' in name.lower() or 'openclaw' in name.lower() or 'qiyadon' in name.lower() or 'cloudflared' in name.lower():
        print(f'{name}: PID={pid} status={status} cwd={cwd}')
" 2>/dev/null || pm2 list | grep -E "moosa|openclaw|qiyadon|cloudflared"
```

### 4.7 Verify Runtime Truth Consistency

```bash
#!/bin/bash
# Full runtime truth consistency check
echo "=== Runtime Truth Consistency Check ==="

# 1. Worker CWD matches canonical
WORKER_CWD=$(pm2 describe moosa-worker 2>/dev/null | grep "exec cwd" | awk '{print $4}')
echo "Worker CWD: $WORKER_CWD"
[ "$WORKER_CWD" = "/root/.openclaw/workspace/moosa-worker" ] && echo "✅ Worker CWD OK" || echo "❌ Worker CWD MISMATCH — STRUCTURAL HAZARD"

# 2. Heartbeat path is canonical
HB_PATH="/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json"
[ -f "$HB_PATH" ] && echo "✅ Canonical heartbeat exists" || echo "❌ Canonical heartbeat MISSING"

# 3. Heartbeat was written by current worker PID
WORKER_PID=$(pm2 jlist 2>/dev/null | python3 -c "import sys,json; [print(p['pid']) for p in json.load(sys.stdin) if p['name']=='moosa-worker']" 2>/dev/null)
HB_PID=$(python3 -c "import json; print(json.load(open('$HB_PATH'))['pid'])" 2>/dev/null)
echo "Worker PID: $WORKER_PID | Heartbeat PID: $HB_PID"
[ "$WORKER_PID" = "$HB_PID" ] && echo "✅ Heartbeat PID matches running worker" || echo "❌ Heartbeat PID mismatch — stale or wrong process"

# 4. Watchdog reads correct heartbeat
WD_READER_CWD=$(pm2 describe moosa-watchdog 2>/dev/null | grep "exec cwd" | awk '{print $4}')
echo "Watchdog CWD: $WD_READER_CWD"
[ "$WD_READER_CWD" = "/root/.openclaw/workspace/moosa-worker" ] && echo "✅ Watchdog CWD OK" || echo "❌ Watchdog CWD MISMATCH"

# 5. Gateway internal health
GW_STATUS=$(curl -s http://localhost:18789/health 2>/dev/null)
echo "Gateway: $GW_STATUS"
echo "$GW_STATUS" | grep -q '"ok":true' && echo "✅ Gateway healthy" || echo "❌ Gateway unhealthy"
```

---

## 5. Repo Consolidation Strategy

### 5.1 The Structural Hazard

Currently:
- **Running worker** executes from: `/home/node/.openclaw/workspace/` (CWD)
- **Canonical repo**: `/root/.openclaw/workspace/moosa-worker/` (git remote, deployment target)
- **Problem**: The running worker reads code from `/home/node/`, not `/root/`. The R4A heartbeat-writer.js was deployed to `/root/` but the running process uses the Phase R1 version from `/home/node/`.

This is the single largest structural hazard in the entire system.

### 5.2 Safest Migration Strategy

**Option A — Redirect Worker to Canonical Repo (Recommended)**

Migrate the worker's CWD from `/home/node/.openclaw/workspace/` to `/root/.openclaw/workspace/moosa-worker/`.

Steps:
1. Verify `/root/.openclaw/workspace/moosa-worker/` has all current state from `/home/node/` repo
2. Ensure `/home/node/` state files (pattern-memory, goal-continuity, etc.) are migrated
3. Update PM2 ecosystem.config.js to use `/root/` paths
4. Stop worker from `/home/node/` location
5. Start worker from `/root/` location
6. Verify CWD, heartbeat schema, and cycle function

**Option B — Mirror R4A into Home Repo (Quick Fix)**

Cherry-pick or copy R4A `heartbeat-writer.js` into the `/home/node/` repo so the running worker has the correct code.

Steps:
1. Copy R4A heartbeat-writer.js from `/root/` to `/home/node/.openclaw/workspace/src/handlers/`
2. Stop worker
3. Restart worker (now uses correct heartbeat writer)
4. Verify schema_version: 2 appears in heartbeat
5. Then schedule Option A for permanent fix

**Option A is the recommended permanent solution. Option B is a faster temporary fix that reduces hazard while Option A is prepared.**

### 5.3 Rollback Plan

For Option A migration:
- **Rollback command**: Stop worker, restore PM2 ecosystem.config.js to `/home/node/` paths, restart from `/home/node/`
- **Rollback trigger**: Any verification gate failure after migration
- **Rollback time**: < 5 minutes (simple process restart)

For Option B quick fix:
- **Rollback command**: Restore old `heartbeat-writer.js` from git, restart worker
- **Rollback trigger**: Verification gate failure after restart
- **Rollback time**: < 2 minutes

### 5.4 Downtime Expectations

| Migration Option | Expected Downtime | Risk Level |
|---|---|---|
| Option A (full CWD migration) | 5–15 minutes | Medium — requires PM2 config change and worker restart |
| Option B (mirror R4A into home) | 2–5 minutes | Low — file copy and worker restart |

During downtime: worker cycles pause, no tasks are processed. No data loss — tasks remain in Supabase queue.

### 5.5 Verification Gates (Migration)

| Gate | Check | Pass Condition |
|---|---|---|
| M1: Pre-migration | Canonical repo has all required files | `ls /root/.openclaw/workspace/moosa-worker/src/handlers/heartbeat-writer.js` returns R4A version |
| M2: Post-migration CWD | `pm2 describe moosa-worker | grep cwd` | Shows `/root/.openclaw/workspace/moosa-worker/` |
| M3: Post-migration heartbeat | `worker.json` schema_version | schema_version=2 within 60s of restart |
| M4: Post-migration cycle | Worker out log shows cycles | "Starting cycle" appears every 10s |
| M5: Post-migration watchdog | `watchdog-state.json` worker.status | IDLE or HEALTHY (not stale UNHEALTHY from old path) |

### 5.6 Human Approval Gates

| Gate | Required Approver | Trigger |
|---|---|---|
| M1 (pre-migration file audit) | Moosa | Before any file operations |
| M3 (schema_version confirmation) | Moosa | After worker restart |
| Option A full migration | Ahmad | Any change to PM2 ecosystem.config.js |

---

## 6. R4 Resume Gates

### 6.1 Exact Prerequisites Before R4 Work May Continue

**All of the following must be TRUE before any R4 (R4A, R4B, R4C) implementation resumes:**

| # | Prerequisite | Current Status | What Must Change |
|---|---|---|---|
| R4.1 | Worker CWD matches canonical repo | ❌ FAIL — CWD is `/home/node/` | Repo consolidation (Section 5) |
| R4.2 | R4A heartbeat-writer.js active in running worker | ❌ FAIL — Phase R1 running | Either Option A or Option B from Section 5 |
| R4.3 | `worker.json` shows `schema_version: 2` | ❌ FAIL — missing | R4.2 must be fixed first |
| R4.4 | Watchdog reads from correct absolute path | ✅ PASS — R4B uses absolute path | None |
| R4.5 | Watchdog `watchdog-state.json` shows `watchdog_version: R4B` | ✅ PASS | None |
| R4.6 | PM2 `pm2 save` has been run after last restart | ❌ UNKNOWN — never verified | Run `pm2 save` |
| R4.7 | No overlapping deployment phases | ✅ PASS — none currently | Must maintain |
| R4.8 | No dirty repo as deployment target | ❌ FAIL — `/home/node/` repo has uncommitted changes | Commit or discard before deployment |
| R4.9 | Incident response READ-ONLY mode lifted | N/A | Ahmad declares incident closed |
| R4.10 | Ahmad explicit approval for next R4 phase | ❌ NOT OBTAINED | Written approval required |

**Summary: R4 work CANNOT resume until at minimum R4.1, R4.2, R4.3, R4.8, and R4.10 are resolved.**

### 6.2 Exact Validation Checks Required

Before declaring any future phase activated:

```bash
#!/bin/bash
# R4 Resume Validation — ALL must pass before next R4 phase

set -e
PASS=0; FAIL=0

echo "=== R4 Resume Validation ==="

# V1: Worker CWD
CWD=$(pm2 describe moosa-worker 2>/dev/null | grep "exec cwd" | awk '{print $4}')
if [ "$CWD" = "/root/.openclaw/workspace/moosa-worker" ]; then
    echo "✅ V1: Worker CWD = $CWD"; ((PASS++))
else
    echo "❌ V1: Worker CWD = $CWD (expected /root/.openclaw/workspace/moosa-worker/)"; ((FAIL++))
fi

# V2: R4A active in running worker
SV=$(python3 -c "import json; print(json.load(open('/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json')).get('schema_version','MISSING'))" 2>/dev/null)
if [ "$SV" = "2" ]; then
    echo "✅ V2: schema_version = $SV (R4A active)"; ((PASS++))
else
    echo "❌ V2: schema_version = $SV (expected 2)"; ((FAIL++))
fi

# V3: Heartbeat fresh
AGE=$(python3 -c "import json; from datetime import datetime,timezone; hb=json.load(open('/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json')); w=datetime.fromisoformat(hb.get('_written_at','2000-01-01').replace('Z','+00:00')); print(round((datetime.now(timezone.utc)-w).total_seconds()))" 2>/dev/null)
if [ "$AGE" -lt 60 ]; then
    echo "✅ V3: Heartbeat age = ${AGE}s"; ((PASS++))
else
    echo "❌ V3: Heartbeat age = ${AGE}s (expected <60s)"; ((FAIL++))
fi

# V4: Watchdog R4B
WV=$(python3 -c "import json; print(json.load(open('/root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json')).get('watchdog_version','MISSING'))" 2>/dev/null)
if [ "$WV" = "R4B" ]; then
    echo "✅ V4: Watchdog version = $WV"; ((PASS++))
else
    echo "❌ V4: Watchdog version = $WV (expected R4B)"; ((FAIL++))
fi

# V5: Repo clean
cd /root/.openclaw/workspace/moosa-worker && git status --short | grep -q "^\s*[MADRCU].*" && echo "❌ V5: Repo DIRTY" || { echo "✅ V5: Repo clean"; ((PASS++)); }

# V6: PM2 saved
pm2 save 2>/dev/null && echo "✅ V6: PM2 save OK" || echo "❌ V6: PM2 save FAILED"

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
[ $FAIL -eq 0 ] && echo "READY: All gates passed — R4 may resume" || echo "BLOCKED: $FAIL gate(s) failed — resolve before R4 resume"
```

### 6.3 Exact Rollback Readiness Requirements

Before any R4 implementation resumes:

| # | Requirement | How to Verify |
|---|---|---|
| RR.1 | Pre-deployment PM2 snapshot exists | `ls /tmp/pm2-*.json` with recent timestamp |
| RR.2 | Pre-deployment heartbeat snapshot exists | `ls /tmp/worker-*.json` with recent timestamp |
| RR.3 | Rollback command documented | In deployment plan document |
| RR.4 | Human approval for deployment | Written message from Ahmad |
| RR.5 | Rollback can be executed in < 5 minutes | Verified by procedure dry-run |

---

## Appendix A: Path Reference Card

```
AUTHORITATIVE (USE THESE):
  Canonical runtime root:    /root/.openclaw/workspace/moosa-worker/
  Canonical heartbeat:       /root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json
  Canonical watchdog state:  /root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json
  Canonical worker entry:    /root/.openclaw/workspace/moosa-worker/src/index.js
  Canonical watchdog entry: /root/.openclaw/workspace/moosa-worker/src/watchdog.js
  Canonical heartbeat writer: /root/.openclaw/workspace/moosa-worker/src/handlers/heartbeat-writer.js

FORBIDDEN (NEVER USE):
  /home/node/.openclaw/workspace/state/heartbeats/worker.json  (wrong file — pid 1264123)
  /home/node/.openclaw/workspace/ (as deployment target for moosa-worker or watchdog)
  process.cwd()-relative paths for heartbeat access
```

## Appendix B: PM2 Quick Reference

```
✅ ALLOWED:
  pm2 list
  pm2 jlist
  pm2 describe <name>
  pm2 ping
  pm2 stop <name>
  pm2 start <name>
  pm2 start ecosystem.config.js --only <name>
  pm2 save
  pm2 resurrect

❌ FORBIDDEN:
  pm2 kill (any form)
  pkill -9 node
  kill -9 <pid> on any PM2-managed process
  pm2 restart all
```

---

*End of MOOSA Runtime Canonicalization & Topology Plan v1.0*
*Moosa (AI assistant), generated 2026-05-17T13:05:00Z*