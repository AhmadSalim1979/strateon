# MOOSA Runtime Governance & Authoritative Runtime Truth Specification

**Classification:** AUTHORITATIVE — Permanent Operational Document
**Version:** 1.0
**Date:** 2026-05-17
**Author:** Moosa (AI assistant)
**Based on:** MOOSA Runtime Reliability Incident Report — May 17 2026
**Phase:** Documentation only. No runtime modifications made.

---

## 1. Authoritative Runtime Truth Rules

### 1.1 Canonical Process Ownership (PM2)

Every PM2-managed process has exactly ONE canonical owner repo and ONE canonical working directory. No exceptions.

| PM2 Process Name | Canonical Repo | Canonical CWD | Canonical Script |
|---|---|---|---|
| `moosa-worker` | `/root/.openclaw/workspace/moosa-worker/` | `/root/.openclaw/workspace/moosa-worker/` | `src/index.js` |
| `moosa-watchdog` | `/root/.openclaw/workspace/moosa-worker/` | `/root/.openclaw/workspace/moosa-worker/` | `src/watchdog.js` |
| `openclaw-gateway` | system OpenClaw install | system path | system service |
| `qiyadon-audit-form` | `/home/node/.openclaw/workspace/` | `/home/node/.openclaw/workspace/` | `server.js` |
| `cloudflared-tunnel` | system install | `/tmp/` | cloudflared binary |

**Any PM2 process whose CWD does not match the above is NON-AUTHORITATIVE and must be investigated before use.**

### 1.2 Canonical Heartbeat Paths

| File | Writer (Owner) | Reader(s) | Canonical Path |
|---|---|---|---|
| `worker.json` | moosa-worker ONLY | moosa-watchdog | `/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json` |
| `watchdog-state.json` | moosa-watchdog ONLY | Moosa / human operators | `/root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json` |
| `self-check.json` | moosa-worker (self-check handler) | moosa-watchdog | `/root/.openclaw/workspace/moosa-worker/state/heartbeats/self-check.json` |

**Non-authoritative heartbeat paths (DO NOT USE):**
- `/home/node/.openclaw/workspace/state/heartbeats/worker.json` — WRONG REPO
- Any path referencing `process.cwd()` that resolves outside canonical repo

### 1.3 Canonical Repos

| Repo Path | Is Canonical? | Use For | Do NOT Use For |
|---|---|---|---|
| `/root/.openclaw/workspace/moosa-worker/` | ✅ YES — canonical | moosa-worker, moosa-watchdog deployment | Nothing else |
| `/home/node/.openclaw/workspace/` | ❌ NO — non-authoritative | Nothing in production | Deployment target for any PM2 process |
| `/root/.openclaw/workspace/` | ❌ NO — non-authoritative | OpenClaw system files | moosa-worker or watchdog code |

**Critical:** The running moosa-worker (PID 1002482) executes from `/home/node/.openclaw/workspace/` — this is a known structural hazard. It must be corrected in Phase Repo Consolidation.

### 1.4 How Runtime Truth Is Verified After Every Restart

After ANY PM2 process restart, immediately verify:

**moosa-worker restart verification:**
```bash
# Within 60 seconds of restart:
cat /root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json | python3 -c "
import sys, json
from datetime import datetime, timezone
hb = json.load(sys.stdin)
w = datetime.fromisoformat(hb.get('_written_at','2000-01-01').replace('Z','+00:00'))
age_s = (datetime.now(timezone.utc) - w).total_seconds()
print('schema_version:', hb.get('schema_version'))
print('pid:', hb.get('pid'))
print('_written_at age (s):', round(age_s, 1))
print('last_status:', hb.get('last_status'))
print('cycle_count:', hb.get('cycle_count'))
print('PASS' if age_s < 60 and hb.get('schema_version') == 2 else 'FAIL')
"
```

**moosa-watchdog restart verification:**
```bash
# Within 30 seconds of restart:
cat /root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json | python3 -c "
import sys, json
s = json.load(sys.stdin)
print('watchdog_version:', s.get('watchdog_version'))
print('cycle_count:', s.get('cycle_count'))
print('worker.status:', s.get('worker',{}).get('status'))
print('PASS' if s.get('watchdog_version') == 'R4B' else 'FAIL — check version')
"
```

**If either verification returns FAIL: treat deployment as FAILED. Rollback immediately.**

---

## 2. Permanent Governance Rules

### 2.1 PM2 Governance

| Rule | Requirement |
|---|---|
| `pm2 kill` | **BANNED.** All forms of `pm2 kill` are permanently prohibited. |
| `pm2 stop <name>` | Permitted for single process. Always use exact process name. |
| `pm2 stop all` | Requires explicit written Ahmad approval before execution. |
| `pm2 restart <name>` | Permitted only after verification gates pass (see Section 6). |
| `pm2 save` | Must be run after EVERY successful process start/restart. |
| `pm2 start <name>` | Use when process shows "Process not found" on restart attempt. |
| Pre-operation snapshot | Run `pm2 jlist > /tmp/pm2-before-<name>-<timestamp>.json` before any change. |
| Post-operation verify | Within 30 seconds of any start/restart, verify process state. |

### 2.2 Deployment Governance

| Rule | Requirement |
|---|---|
| Verify deployment target | Confirm canonical repo path BEFORE pushing code. |
| Clean repo only | `git status` must show clean working tree on target repo before deployment. |
| Test before production | New code must be validated in isolated test before production deployment. |
| One phase at a time | Only one major phase (R4A, R4B, R4C) may be in flight at any time. |
| Overlapping prohibited | Deploying R4B before R4A is verified active is a governance violation. |
| Heartbeat migration first | R4A must be confirmed active in worker before R4B is deployed. |

### 2.3 Repo Governance

| Rule | Requirement |
|---|---|
| Single canonical repo | Each PM2 process must map to exactly one git repo. |
| Dirty repo prohibited | Uncommitted changes = dirty repo. Dirty repos must NOT be deployment targets. |
| Path must match CWD | Code must be deployed to the repo the process actually uses as CWD. |
| Two-repo hazard | Existence of `moosa-worker` in both `/root/` and `/home/node/` is a structural hazard requiring mandatory resolution. |
| Pre-deploy git status | `git status --short` must return empty before any deployment. |

### 2.4 Heartbeat Governance

| Rule | Requirement |
|---|---|
| Schema versioning | All heartbeat files must carry `schema_version` field. |
| Writer exclusivity | `worker.json` is written by worker ONLY. Watchdog reads only. |
| Reader exclusivity | `watchdog-state.json` is written by watchdog ONLY. Worker reads only. |
| Freshness requirement | `_written_at` must be within 60 seconds of current time for active processes. |
| Stale threshold | Heartbeat older than 60 seconds = stale. Stale does not always mean failed (see STALE_IDLE rule). |
| STALE_IDLE | Stale heartbeat + `cycle.status: IDLE` = healthy quiet worker. Log only. Never alert on this combination. |

### 2.5 Rollback Governance

| Rule | Requirement |
|---|---|
| Pre-change snapshot | Before ANY deployment: snapshot `pm2 jlist`, heartbeat files, watchdog state. |
| Documented rollback | Every forward change must have a documented rollback command before execution. |
| Failed verification = rollback | If post-restart verification fails within 60s, execute rollback immediately. |
| Rollback before investigation | If a deployment causes unexpected behavior, rollback first, investigate second. |
| PM2 save after rollback | After any rollback, run `pm2 save` to persist recovered state. |

### 2.6 Verification-First Governance

| Rule | Requirement |
|---|---|
| Declare after verification | "Phase X activated" may only be declared AFTER verification passes. Not before. |
| Evidence required | Every activation claim must include file contents or command output proving activation. |
| No optimism | If verification data is ambiguous, treat as failed. Do not assume success. |
| Sequential gates | Each deployment phase must pass its verification gate before the next phase may begin. |

---

## 3. Runtime Recovery Protocol

### 3.1 Worker Restart Procedure

**Trigger:** Planned worker restart (deployments, config changes).

**Prerequisites:** None required (worker can always be restarted).

**Procedure:**
```
1. PRE-RESTART SNAPSHOT
   pm2 jlist > /tmp/pm2-worker-before-<date>.json
   cp /root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json /tmp/worker-before-<date>.json
   echo "Snapshot complete"

2. VERIFY CORRECT DEPLOYMENT TARGET
   # Confirm this is the repo the running worker actually uses
   ls /home/node/.openclaw/workspace/src/handlers/heartbeat-writer.js  # Must have R4A code
   # If file is missing R4A code (no WORKER_STATUS export), fix deployment FIRST

3. RESTART
   pm2 stop moosa-worker
   sleep 2
   pm2 start /root/.openclaw/workspace/moosa-worker/ecosystem.config.js --only moosa-worker

4. IMMEDIATE VERIFICATION (within 60 seconds)
   python3 -c "
import json
from datetime import datetime, timezone
hb = json.load(open('/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json'))
w = datetime.fromisoformat(hb.get('_written_at','2000-01-01').replace('Z','+00:00'))
age = (datetime.now(timezone.utc) - w).total_seconds()
assert age < 60, f'Heartbeat stale: {age:.0f}s'
assert hb.get('schema_version') == 2, f'No schema_version: {hb}'
assert hb.get('cycle',{}).get('status') in ['STARTING','HEALTHY','IDLE','BUSY','TASK_FAILED','DEGRADED','STOPPING'], f'Invalid cycle status'
print('VERIFIED: Worker heartbeat schema v2, age', round(age), 's')
"

5. SAVE PM2 STATE
   pm2 save

6. LOG COMPLETION
   echo "[WorkerRestart] Completed at $(date -u)" >> /tmp/runtime-operations.log
```

**Rollback (if verification fails):**
```
pm2 stop moosa-worker
# Restore old heartbeat if available
cp /tmp/worker-before-<date>.json /root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json
pm2 start /root/.openclaw/workspace/moosa-worker/ecosystem.config.js --only moosa-worker
```

### 3.2 Watchdog Restart Procedure

**Trigger:** Planned watchdog restart (R4B/R4C deployments).

**Prerequisites:** Worker must be online and cycling before watchdog restart.

**Procedure:**
```
1. PRE-RESTART SNAPSHOT
   pm2 jlist > /tmp/pm2-watchdog-before-<date>.json
   cp /root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json /tmp/watchdog-state-before-<date>.json

2. VERIFY WORKER HEALTHY BEFORE STOPPING WATCHDOG
   python3 -c "
import json
hb = json.load(open('/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json'))
from datetime import datetime, timezone
w = datetime.fromisoformat(hb.get('_written_at','2000-01-01').replace('Z','+00:00'))
age = (datetime.now(timezone.utc) - w).total_seconds()
assert age < 120, f'Worker stale: {age:.0f}s'
print('Worker OK, age:', round(age), 's')
"

3. RESTART
   pm2 stop moosa-watchdog
   sleep 2
   cd /root/.openclaw/workspace/moosa-worker && node src/watchdog.js &

4. IMMEDIATE VERIFICATION (within 30 seconds)
   sleep 5
   python3 -c "
import json
s = json.load(open('/root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json'))
print('watchdog_version:', s.get('watchdog_version'))
assert s.get('watchdog_version') == 'R4B', f'Wrong version: {s.get(\"watchdog_version\")}'
assert s.get('worker',{}).get('status') in ['HEALTHY','IDLE','STALE','STALE_IDLE','DEGRADED','STARTING','BUSY','TASK_FAILED','STOPPING','UNHEALTHY']
print('VERIFIED: Watchdog R4B active, worker.status:', s.get('worker',{}).get('status'))
"

5. SAVE PM2 STATE
   pm2 save

6. LOG COMPLETION
   echo "[WatchdogRestart] Completed at $(date -u)" >> /tmp/runtime-operations.log
```

**Rollback (if verification fails):**
```
pm2 stop moosa-watchdog
# Restore old state if available
cp /tmp/watchdog-state-before-<date>.json /root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json
cd /root/.openclaw/workspace/moosa-worker && node src/watchdog.js &
```

### 3.3 Gateway Restart Procedure

**Trigger:** Planned gateway restart (OpenClaw updates).

**Caution:** Gateway handles WhatsApp routing. Brief outage affects inbound/outbound.

**Prerequisites:** Ahmad approval recommended for production gateway restarts.

**Procedure:**
```
1. PRE-RESTART SNAPSHOT
   pm2 jlist > /tmp/pm2-gateway-before-<date>.json

2. RESTART
   pm2 stop openclaw-gateway
   sleep 3
   pm2 start openclaw-gateway

3. IMMEDIATE VERIFICATION (within 30 seconds)
   curl -s http://localhost:18789/health
   # Expect: {"ok":true,"status":"live"}

4. SAVE PM2 STATE
   pm2 save
```

### 3.4 PM2 Daemon Recovery Procedure

**Trigger:** PM2 daemon is dead or unresponsive (`pm2 list` returns empty/error).

**Caution:** This recovers the daemon, not individual processes.

**Procedure:**
```
1. DO NOT RUN pm2 kill
   # If daemon is partially alive, pm2 kill will make things worse

2. ATTEMPT DAEMON REPAIR
   pm2 ping
   # If pong: daemon alive, just refresh
   # If error: daemon dead

3. RESURRECT PROCESSES
   pm2 resurrect

4. VERIFY ALL ONLINE
   pm2 list
   # All expected processes should show "online"

5. SAVE RECOVERED STATE
   pm2 save

6. INVESTIGATE ROOT CAUSE
   # Why did daemon die? Check:
   # - System OOM
   # - Disk full
   # - Kernel OOM kill
   # - Manual pm2 kill (governance violation)
   dmesg | tail -20
   cat /var/log/syslog | tail -20
```

### 3.5 Stale Heartbeat Recovery Procedure

**Trigger:** `worker.json` has `_written_at` age > 60 seconds.

**Procedure:**
```
1. CHECK IF WORKER IS ACTUALLY CYCLING
   # Worker may be healthy but not writing heartbeats (R4A not active)
   tail /root/.pm2/logs/moosa-worker-out.log | grep "Starting cycle"
   # If cycles are running, this is R4A-not-active problem, not a dead worker

2. IF WORKER IS DEAD (no cycles in log):
   pm2 describe moosa-worker | grep status
   # If not online → restart worker (see 3.1)

3. IF WORKER IS ALIVE BUT HEARTBEAT STALE:
   # This means R4A is not active in the running worker
   # Worker IS healthy operationally but heartbeat system needs fixing
   #
   # IMMEDIATE ACTION: Deploy R4A to correct repo, restart worker
   # This requires escalation to Ahmad if it happens in production

4. LOG INCIDENT
   echo "[StaleHeartbeat] $(date -u) — worker.json age: $(stat -c '%y' /root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json)" >> /tmp/runtime-operations.log
```

### 3.6 Failed Deployment Rollback Procedure

**Trigger:** Post-deployment verification fails (schema_version wrong, wrong version, errors).

**Procedure:**
```
1. STOP — DO NOT INVESTIGATE FIRST
   # Rollback must happen immediately. Investigation after.

2. IDENTIFY WHAT TO ROLLBACK
   # If worker: stop worker, restore old heartbeat-writer.js, restart
   # If watchdog: stop watchdog, restore old watchdog.js, restart
   # If loop.js changed: stop worker, restore old loop.js, restart

3. ROLLBACK WORKER
   cd <canonical-repo>
   git checkout HEAD^1 -- src/handlers/heartbeat-writer.js  # or appropriate file
   pm2 stop moosa-worker
   pm2 start moosa-worker
   sleep 5
   # Verify old heartbeat
   cat /root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json
   # Must show old schema (no schema_version: 2)

4. ROLLBACK WATCHDOG
   cd <canonical-repo>
   git checkout HEAD^1 -- src/watchdog.js
   pm2 stop moosa-watchdog
   cd /root/.openclaw/workspace/moosa-worker && node src/watchdog.js &
   sleep 5
   # Verify old watchdog-state.json or new version detected

5. SAVE RECOVERED STATE
   pm2 save

6. DOCUMENT THE FAILURE
   echo "[Rollback] $(date -u) — phase: <name> — reason: verification failed" >> /tmp/runtime-operations.log
   # Then investigate separately, in a new session
```

---

## 4. Production Safety Rules

### 4.1 Forbidden Commands

| Command | Reason |替代 |
|---|---|---|
| `pm2 kill` | Destroys entire PM2 daemon, kills all processes | `pm2 stop <name>` |
| `pm2 kill all` | Same as above | `pm2 stop all` (with Ahmad approval) |
| `pkill -9 node` | Kills ALL node processes including gateway and exec handler | Identify specific PID, `pm2 stop <name>` |
| `kill -9 <pid>` on PM2-managed PIDs | Same as above | `pm2 stop <name>` |
| Any `kill` on gateway PID | Destroys WhatsApp routing | Never |

### 4.2 Forbidden Operational Patterns

| Pattern | Why Forbidden |
|---|---|
| Overlapping deployment waves (R4A + R4B simultaneously) | Creates entangled failure modes that cannot be distinguished |
| Deploying to non-canonical repo | Code deployed to wrong location = not used by running process |
| Declaring success before verification | Leads to cascade of incorrect assumptions |
| Running `pm2 restart` when `pm2 start` is needed | `restart` fails on transitional states, leading to `kill` attempt |
| Dirty repo deployment | Uncommitted state files may overwrite production configuration |
| Restarting without PM2 save | Daemon resurrection loads old state, overwriting changes |
| Deploying during an active incident | READ-ONLY mode must be strictly observed |
| Modifying runtime during READ-ONLY declaration | Governance violation |

### 4.3 Forbidden Deployment Sequences

```
❌ BAD: pm2 kill <process> → restart without save
❌ BAD: deploy R4B → restart watchdog → deploy R4A (wrong order)
❌ BAD: git push to /root/ repo → assume /home/node/ repo updated
❌ BAD: pm2 restart moosa-worker → proceed without verifying heartbeat
❌ BAD: restart watchdog → enable alerts → verify (alerts must be last)
```

```
✅ CORRECT: deploy R4A to correct repo → restart worker → verify schema v2 → deploy R4B → restart watchdog → verify R4B active → enable alerts (R4C)
```

### 4.4 Verification Gates (Must Pass Before Proceeding)

| Gate | Check | Pass Condition |
|---|---|---|
| G1: Pre-deployment | `git status --short` on target repo | Empty (clean) |
| G2: Post-restart worker | `worker.json` schema_version, _written_at age | schema_version=2, age<60s |
| G3: Post-restart watchdog | `watchdog-state.json` watchdog_version | Matches deployed version |
| G4: 3-cycle stability | Watchdog cycle count advances 3x | cycle_count increases |
| G5: Pre-alert enablement | No false alerts in 3 consecutive cycles | Alert count = 0 |

---

## 5. Canonical Runtime Topology

### 5.1 Exact Canonical Paths

```
AUTHORITATIVE PATHS (all R4A/R4B/Beyond):
  /root/.openclaw/workspace/moosa-worker/
    src/
      index.js                    ← moosa-worker entry point
      core/
        loop.js                   ← worker cycle orchestration
        startup.js                ← durable store initialization
      handlers/
        heartbeat-writer.js        ← R4A heartbeat emission (WORKER_STATUS, schema v2)
        self-check-scheduler.js
        send_whatsapp.js
        index.js
    state/
      heartbeats/
        worker.json               ← CANONICAL (worker writes, watchdog reads)
        watchdog-state.json       ← CANONICAL (watchdog writes, operators read)
        self-check.json
    ecosystem.config.js
    package.json

NON-AUTHORITATIVE (DO NOT USE FOR PRODUCTION):
  /home/node/.openclaw/workspace/
    src/core/loop.js              ← OLD version (Phase R1, no WORKER_STATUS)
    src/handlers/heartbeat-writer.js  ← Phase R1 version (no schema_version)
    state/heartbeats/worker.json  ← WRONG FILE (unrelated heartbeat, pid 1264123)
```

### 5.2 Exact PM2 Process Ownership

| PM2 Name | Script Path | CWD | Env Variables | Notes |
|---|---|---|---|---|
| `moosa-worker` | `/root/.openclaw/workspace/moosa-worker/src/index.js` | `/root/.openclaw/workspace/moosa-worker/` | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `DEBUG`, `FEATURE_PHASE_5D_ENABLED`, `PHASE_5D_SHADOW_MODE`, `EXECUTION_MODE` | **Currently running from wrong CWD** — structural hazard |
| `moosa-watchdog` | `/root/.openclaw/workspace/moosa-worker/src/watchdog.js` | `/root/.openclaw/workspace/moosa-worker/` | none | R4B deployed here |
| `openclaw-gateway` | system OpenClaw | system | system | Not managed by workspace repo |
| `qiyadon-audit-form` | `/home/node/.openclaw/workspace/server.js` | `/home/node/.openclaw/workspace/` | `PORT=3001`, `NODE_ENV=production` | Offline (incident freeze) |
| `cloudflared-tunnel` | `/opt/node24/.../cloudflared` | `/tmp/` | tunnel token in args | Port 20250 conflict |

### 5.3 Heartbeat Ownership Boundaries

```
worker.json
  WRITTEN BY: moosa-worker only (via heartbeat-writer.js → writeWorkerHeartbeat())
  READ BY:    moosa-watchdog only (via readWorkerHeartbeatV2())
  NEVER BY:  Moosa main session, human operators, any other process
  PATH:       /root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json

watchdog-state.json
  WRITTEN BY: moosa-watchdog only (via writeWatchdogState())
  READ BY:    Moosa, human operators
  NEVER BY:   moosa-worker
  PATH:       /root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json

self-check.json
  WRITTEN BY: moosa-worker (via self-check scheduler handler)
  READ BY:    moosa-watchdog only
  PATH:       /root/.openclaw/workspace/moosa-worker/state/heartbeats/self-check.json
```

### 5.4 Repo vs Process Mapping (Authoritative vs Actual)

| Process | Authoritative Repo | Actual Repo (Current) | Match? |
|---|---|---|---|
| moosa-worker | `/root/.openclaw/workspace/moosa-worker/` | `/home/node/.openclaw/workspace/` | ❌ MISMATCH |
| moosa-watchdog | `/root/.openclaw/workspace/moosa-worker/` | `/root/.openclaw/workspace/moosa-worker/` | ✅ MATCH |
| qiyadon-audit-form | `/home/node/.openclaw/workspace/` | `/home/node/.openclaw/workspace/` | ✅ MATCH |
| openclaw-gateway | system | system | N/A |

**The moosa-worker CWD mismatch is the single largest structural hazard in the system. Resolution is P0.**

---

## 6. R4 Recovery Readiness

### 6.1 Prerequisites Before R4 Work May Resume

| # | Prerequisite | Verification Command | Pass Condition |
|---|---|---|---|
| P0.1 | Repo consolidation complete | Worker CWD matches authoritative repo | `pm2 describe moosa-worker \| grep exec cwd` shows `/root/.openclaw/workspace/moosa-worker/` |
| P0.2 | R4A code deployed to correct repo | `heartbeat-writer.js` has `WORKER_STATUS` export | `grep WORKER_STATUS /root/.openclaw/workspace/moosa-worker/src/handlers/heartbeat-writer.js` returns 7 enum values |
| P0.3 | R4A verified active in running worker | `worker.json` schema_version | `python3 -c "import json; hb=json.load(open('/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json')); assert hb.get('schema_version')==2; print('PASS')"` |
| P0.4 | Worker restart produces fresh heartbeat | Worker restart test | After `pm2 restart moosa-worker`, `_written_at` age < 60s AND schema_version=2 |
| P1.1 | R4B watchdog deployed to correct repo | `watchdog.js` has `readWorkerHeartbeatV2()` | `grep readWorkerHeartbeatV2 /root/.openclaw/workspace/moosa-worker/src/watchdog.js` returns function |
| P1.2 | R4B watchdog path fixed | Absolute paths to worker.json | `grep '/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json' /root/.openclaw/workspace/moosa-worker/src/watchdog.js` |
| P1.3 | R4B watchdog verified active | `watchdog-state.json` watchdog_version | `grep watchdog_version /root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json` shows `R4B` |
| P1.4 | STALE_IDLE interpretation verified | Schema v2 + stale + IDLE = no alert | `python3` test simulating stale IDLE → alert_kind is null |
| P2.1 | 3 consecutive clean watchdog cycles | Watchdog cycle count advances | `watchdog-state.json` cycle_count increases over 3 readings 60s apart |
| P2.2 | No false UNHEALTHY alerts | Watchdog interpreting schema v2 correctly | `worker.status` in watchdog-state.json is IDLE/HEALTHY, not stale UNHEALTHY |
| P2.3 | Legacy schema fallback verified | Old worker.json → UNHEALTHY classification | `python3` test with legacy schema → alert_kind = L2_WORKER_DEGRADED |
| P3.1 | Ahmad approval for alert enablement | Written approval | Message from Ahmad explicitly approving `WATCHDOG_ALERTS_ENABLED=true` |
| P3.2 | Alert destination configured | WhatsApp/email handler present | `sendAlert()` function wired to WhatsApp in watchdog.js |

### 6.2 Exact Validation Gates

**Gate V1 — Worker R4A Activation:**
```bash
node -e "
const hb = JSON.parse(require('fs').readFileSync('/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json', 'utf8'));
const age_s = (Date.now() - new Date(hb._written_at).getTime()) / 1000;
const pass = hb.schema_version === 2 && age_s < 60;
console.log(pass ? 'PASS: R4A active (schema_version=2, age=' + Math.round(age_s) + 's)' : 'FAIL: schema=' + hb.schema_version + ', age=' + Math.round(age_s) + 's');
"
```

**Gate V2 — Watchdog R4B Path Correctness:**
```bash
grep -q '/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json' /root/.openclaw/workspace/moosa-worker/src/watchdog.js && echo "PASS: Watchdog reads correct path" || echo "FAIL: Watchdog reads wrong path"
```

**Gate V3 — Watchdog R4B Active:**
```bash
python3 -c "
import json
s = json.load(open('/root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json'))
v = s.get('watchdog_version')
print('PASS: R4B active (version=' + v + ')' if v == 'R4B' else 'FAIL: version=' + str(v))
"
```

**Gate V4 — 3-Cycle Stability:**
```bash
for i in 1 2 3; do sleep 60; python3 -c "import json; s=json.load(open('/root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json')); print('cycle', $i, ':', s.get('cycle_count'))"; done
# All three cycle_count values must be different (increasing)
```

### 6.3 Exact Runtime Verification Commands

**Full system health check (run after any restart):**
```bash
#!/bin/bash
echo "=== MOOSA Runtime Health Check ==="
echo ""

# Worker
echo "[1/5] moosa-worker"
HB=/root/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json
python3 -c "
import json, sys
from datetime import datetime, timezone
try:
    hb = json.load(open('$HB'))
    w = datetime.fromisoformat(hb.get('_written_at','2000-01-01').replace('Z','+00:00'))
    age = (datetime.now(timezone.utc) - w).total_seconds()
    sv = hb.get('schema_version')
    status = hb.get('cycle',{}).get('status') or hb.get('last_status')
    print(f'  schema_version: {sv}  |  _written_at age: {round(age)}s  |  status: {status}')
    print('  PASS' if sv == 2 and age < 60 else '  FAIL')
except Exception as e:
    print('  FAIL:', e.message)
"

# Watchdog
echo "[2/5] moosa-watchdog"
WD=/root/.openclaw/workspace/moosa-worker/state/heartbeats/watchdog-state.json
python3 -c "
import json
try:
    s = json.load(open('$WD'))
    print('  watchdog_version:', s.get('watchdog_version'))
    print('  cycle_count:', s.get('cycle_count'))
    print('  worker.status:', s.get('worker',{}).get('status'))
    print('  PASS' if s.get('watchdog_version') == 'R4B' else '  FAIL')
except Exception as e:
    print('  FAIL:', e.message)
"

# Gateway
echo "[3/5] openclaw-gateway"
GW=$(curl -s http://localhost:18789/health 2>/dev/null)
echo "  $GW"
echo "  PASS" if '"ok":true' in "$GW" else "  FAIL"

# PM2
echo "[4/5] PM2 processes"
pm2 list | grep -E "moosa-worker|moosa-watchdog|openclaw"

# Cloudflared (external)
echo "[5/5] Cloudflared tunnel"
curl -s -o /dev/null -w "  api.qiyadon.com: HTTP %{http_code}\n" https://api.qiyadon.com/ 2>/dev/null
echo "  Note: 502 may indicate audit-form offline, not cloudflared alone"
```

---

## Appendix: Change Log

| Date | Version | Author | Change |
|---|---|---|---|
| 2026-05-17 | 1.0 | Moosa | Initial version — extracted from May 17 incident report |

---

*End of MOOSA Runtime Governance & Authoritative Runtime Truth Specification v1.0*
*Moosa (AI assistant), generated 2026-05-17T12:50:00Z*