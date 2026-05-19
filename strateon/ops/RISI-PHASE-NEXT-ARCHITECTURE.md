# RISI — Post-Stabilization Architecture Planning
**Document:** RISI-PHASE-NEXT-ARCHITECTURE.md
**Version:** 1.0
**Date:** 2026-05-19
**Mode:** READ-ONLY — Planning only
**Author:** Moosa (MCAI Architecture Layer)
**Status:** APPROVED FOR PLANNING

---

## Vision

Convert RISI from emergency incident recovery into **disciplined systems engineering governance**. Every future change is intentional, auditable, and governed. No more reactive patching. No more assumptions from stale logs. No more mixed-path deployments.

---

## Section 1: Current Stable Runtime Baseline

### 1.1 Authoritative Operational Topology

```
INVESTIGATED WORKER PROCESS
├── PID:          1051495
├── Started:      2026-05-18T09:34:39.970Z
├── Uptime:       22h 37m
├── Restarts:     0 (this instance, clean)
├── Entry:        node /root/.openclaw/workspace/moosa-worker/src/index.js
├── Working dir:  /root/.openclaw/workspace/moosa-worker
└── Errors:      NONE — 22h 37m clean

SOURCE TREE ACTIVE
/root/.openclaw/workspace/moosa-worker/
├── src/
│   ├── index.js                  (inode 4587733, modified 2026-05-18T11:37)
│   ├── core/
│   │   ├── loop.js               (inode 4587732, modified 2026-05-18T11:34)
│   │   ├── world-model.js        (inode 4587732, same file)
│   │   └── beliefs.js            (inode 4587732, same file)
│   └── handlers/
│       └── heartbeat-writer.js    (inode 4648055, modified 2026-05-17T14:20)

STATE TREE ACTIVE (worker writes)
 /root/.openclaw/workspace/moosa-worker/state/
├── heartbeats/
│   └── moosa-worker.json        ← active, updated <1h ago
├── world-model-events.jsonl      ← event log (append-only)
└── [world-model.json]           ← exists but NEVER WRITTEN by updateAllEntities()

STATE TREE OBSERVATIONAL (external readers)
/home/node/.openclaw/workspace/state/
├── heartbeats/
│   ├── moosa-worker.json        ← active heartbeat (symlink or copy)
│   ├── worker.json              ← STALE LEGACY artifact (Apr 19)
│   ├── self-check.json          ← STALE LEGACY artifact (Apr 19)
│   └── watchdog.json            ← last updated May 18
└── [operational-state.json]     ← STALE — not being written by worker
```

### 1.2 Active PM2 Processes

| Process | Status | Uptime | Restarts | Authority |
|---|---|---|---|---|
| moosa-worker | ✅ online | 22h 37m | 0 | PID 1051495 |
| moosa-watchdog | ✅ online | ~27h | 0 | PID 1049133 |
| openclaw-gateway | ✅ online | ~37h | 0 | — |
| qiyadon-audit-form | ✅ online | ~36h | 0 | — |
| cloudflared-tunnel | ⚠️ stopped | 0 | 0 | Ambiguous governance |

### 1.3 Heartbeat Architecture (Active)

```
moosa-worker cycle (every 10s)
└── writeHeartbeatToFile() [Option B semantics]
    └── state/heartbeats/moosa-worker.json
        ├── process_name: "worker"
        ├── pid: 1051495
        ├── last_cycle_at: <ISO>
        ├── last_status: IDLE | BUSY | STARTING
        └── _written_at: <ISO>

Worker-down Level 3 alert:        ✅ ENABLED
Self-check stale Level 0/1 alert: 🔇 DISABLED / informational
```

### 1.4 Watchdog Architecture (Active)

```
moosa-watchdog (PID 1049133)
├── Self-check trigger check:  DISABLED
│   └── Alert fired: "ℹ️ MOOSA self-check heartbeat STALE"
│       └── Category: informational (disabled=true)
│       └── NO escalation, NO restart, NO WhatsApp
├── Worker-down check:           ENABLED
│   └── Reads state/heartbeats/moosa-worker.json
│   └── Level 3 alert fires if stale > 60s
└── Orphan/zombie check:         DISABLED
```

### 1.5 PM2 Governance State

```
Daemon status:       HEALTHY — 22h+ daemon stability
Process restarts:    ZERO on all active processes
Poison events:       NONE since May 18 06:24 (dead process)
Zombie processes:    NONE
Orphan processes:    NONE
Error log residue:   STALE — May 18 06:24 (dead process, 3h pre-restart)
Current errors:       ZERO — 22h 37m clean
```

### 1.6 Known-Safe Invariants

| Invariant | Status |
|---|---|
| Worker PID stable across restarts | ✅ |
| Worker heartbeat advances every cycle | ✅ |
| All active source inodes match disk | ✅ |
| Error log file is stale (pre-restart artifact) | ✅ Confirmed |
| No active "iterations is not defined" error | ✅ |
| No new errors in last 30 minutes | ✅ |
| Worker source tree consistent with runtime | ✅ |

---

## Section 2: Remaining Operational Defects

### Critical

| ID | Defect | Impact | Evidence |
|---|---|---|---|
| **C-01** | EEL Supabase path bug in `apac-whatsapp-hook.js` — relative path `../../../secrets/supabase.json` resolves incorrectly | **Silent data loss on ALL APAC WhatsApp events.** APAC WhatsApp messages received between May 15–19 were not recorded to Supabase. | Confirmed in architecture audit |
| **C-02** | MCAI commitment and verification logs outside worker path | Phases 3A/3B/3C exist in `/home/node/.openclaw/workspace/src/core/` — worker cannot write to them. All MCAI bookkeeping is isolated from worker state. | File path confirmed |

### Medium

| ID | Defect | Impact | Evidence |
|---|---|---|---|
| **M-01** | `stale-task-detector.js` queries `last_update_at` column | Column does not exist in `tasks` table. Stale task detection is non-functional. All tasks appear non-stale regardless of actual age. | Schema check confirmed |
| **M-02** | Self-check scheduler has not run since 2026-04-19 | ~30-day gap. Self-check trigger mechanism is dead. No self-checks firing, no alert scheduling. | `self-check.json` last_run: 2026-04-19T05:36Z |
| **M-03** | `operational-state.json` is stale since May 18 | Worker is not writing operational state. Active alerts array is empty but stale. External monitors may read false state. | Last written: May 18 |

### Low

| ID | Defect | Impact | Evidence |
|---|---|---|---|
| **L-01** | Legacy heartbeat artifacts (`worker.json`, `self-check.json`) dated April 19 | Harmless to worker. Could cause stale-state false positives if read by external monitoring tools. Safe to archive. | File timestamps confirmed |
| **L-02** | `cloudflared-tunnel` stopped — governance ambiguity | May be intentional (local-only setup). Governance status unclear. No alerts fired. |
| **L-03** | `world-model.json` never written by `updateAllEntities()` | Entity state exists in `world-model-events.jsonl` as event log. Core entity state file is empty. No data loss, but world model entity states are not queryable as JSON. | Code inspection confirmed |
| **L-04** | Watchdog fires disabled self-check stale alerts (log noise) | Informational only. Log spam but no downstream action. Low priority. | Log confirmed `(disabled)` flag |

### Cosmetic

| ID | Defect | Impact | Evidence |
|---|---|---|---|
| **O-01** | PM2 error log contains stale crash artifacts from dead process (May 18 06:24) | Observational confusion. File not cleared on restart. No runtime impact. PM2 does not truncate log files on restart. | Error log last modified: May 18 06:24 |

---

## Section 3: Architectural Gaps

### 3.1 Implemented

| Component | Status | Notes |
|---|---|---|
| Poll-cycle heartbeat writes (Option B) | ✅ ACTIVE | `writeHeartbeatToFile()` fires every 10s IDLE or BUSY |
| Worker IDLE/BUSY status in heartbeat | ✅ ACTIVE | `last_status` field updates correctly |
| PM2 daemon stability | ✅ ACTIVE | 22h+ daemon, zero restarts |
| Watchdog alert category isolation | ✅ ACTIVE | Level 3 worker-down enabled, Level 0 suppressed |
| Worker uptime self-healing | ✅ ACTIVE | PM2 auto-restart on crash |
| Option B heartbeat semantics | ✅ ACTIVE | Same code, correct behavior |

### 3.2 Partially Implemented

| Component | Status | Gap |
|---|---|---|
| `world-model.js` | ⚠️ PARTIAL | `updateAllEntities()` logs events to `world-model-events.jsonl` but NEVER writes entity state to `world-model.json`. Core entity states (PM2 processes, cloudflared) are tracked as events only — not as persistent JSON. |
| `beliefs.js` | ⚠️ PARTIAL | Fully implemented belief tracking with TTL, confidence bands, source hierarchy. But has **no bootstrap function** — no initial beliefs seeded on startup, no `initializeBeliefs()` call. |
| MCAI Phase 3A commitment system | ⚠️ PARTIAL | Module built in `/home/node/.openclaw/workspace/src/core/commitments.js` — validated 13/13 tests pass. **Not wired into worker.** Worker cannot create or track commitments. Isolated from operational state. |
| MCAI Phase 3B verification system | ⚠️ PARTIAL | Module built in `verification.js` — validated 15/15 tests pass. **Not wired into worker.** Verification cannot be triggered from worker commitment lifecycle. |
| MCAI Phase 3C temporal continuity | ⚠️ PARTIAL | Module built in `temporal-continuity.js` — validated 16/16 tests pass. **Not wired into worker.** Temporal records not being generated from worker state changes. |

### 3.3 Designed But Inactive

| Component | Status | Gap |
|---|---|---|
| world-model.js 5-entity bootstrap | ❌ INACTIVE | `updateAllEntities()` exists but has no `seedWorldModelEntities()` call. No initial entity population on startup. |
| beliefs.js bootstrap | ❌ INACTIVE | No `seedBeliefs()`, `initializeBeliefs()`, or bootstrap function exists in `beliefs.js`. No initial belief population. |
| self-check scheduler | ❌ INACTIVE | Has not run since April 19. Trigger file mechanism exists (`/home/node/.openclaw/workspace/state/self-check-trigger.json`) but WhatsApp cron has stopped writing it. |
| BCDR Phase 4 | ⚠️ BUILT, INACTIVE | Bootstrap files exist in `strateon/bcdr/`. Wiring to worker and deployment pending. |

### 3.4 Missing Entirely

| Component | Gap |
|---|---|
| world-model.json persistence | No function exists to write entity state from `updateAllEntities()` to `world-model.json`. The file remains empty/never-written. |
| beliefs.js seed function | No bootstrap function designed or implemented. |
| MCAI-worker integration layer | No bridge between worker task lifecycle events and MCAI bookkeeping systems. |
| stale-task-detector column repair | The column `last_update_at` does not exist. The `updated_at` column exists but is not queried. |
| operational-state.json writer | Worker is not writing to `operational-state.json`. The file is stale. |
| cloudflared-tunnel governance policy | No explicit governance record for cloudflared-tunnel — whether it should run, be monitored, or be decommissioned. |

---

## Section 4: Recommended Next Major Workstreams

### Workstream 1: C-01 — EEL Supabase Path Bug Repair

**Objective:** Fix the relative path in `apac-whatsapp-hook.js` so APAC WhatsApp events are recorded to Supabase.

**Risk Level:** 🔴 Critical (silently losing data)

**Runtime Impact:**
- Temporary disruption to WhatsApp event ingestion during fix
- No data loss if fix is deployed with zero-downtime approach
- APAC messages queued during window recover after restart

**Restart Required:** YES — worker restart needed to activate fixed code

**Dependency Order:** 1 (first — data loss is ongoing)

**Steps:**
1. Identify correct absolute path to `secrets/supabase.json` from `apac-whatsapp-hook.js` location
2. Replace relative path `../../../secrets/supabase.json` with absolute path using `path.resolve()`
3. Test locally
4. Deploy with `pm2 restart moosa-worker`
5. Verify Supabase events recording after restart

**Why now:** This is the only defect causing **active silent data loss**. Every APAC WhatsApp message received since May 15 is not in Supabase. The longer it runs, the more events are lost.

---

### Workstream 2: M-01 — stale-task-detector Column Repair

**Objective:** Make stale task detection functional by querying the correct column.

**Risk Level:** 🟡 Medium

**Runtime Impact:** None — schema query fix only.

**Restart Required:** YES

**Dependency Order:** 2

**Steps:**
1. Confirm actual column name in `tasks` table (`updated_at` vs `last_update_at`)
2. Update `stale-task-detector.js` to query correct column
3. Deploy and verify stale tasks are correctly identified
4. Validate against known stale task sample

**Why after C-01:** C-01 has active data loss. M-01 is non-functional but no data is being lost — just wrong detection logic.

---

### Workstream 3: M-02 — Self-Check Scheduler Recovery

**Objective:** Restore self-check execution to regular cadence.

**Risk Level:** 🟡 Medium

**Runtime Impact:** Low — adds scheduling load every 15 minutes.

**Restart Required:** YES (to activate fix)

**Dependency Order:** 3

**Steps:**
1. Investigate why WhatsApp cron stopped writing trigger file (Apr 19 — ~30 days ago)
2. Determine if trigger file path is correct (`/home/node/.openclaw/workspace/state/self-check-trigger.json`)
3. Restore cron job or implement alternative self-check trigger mechanism
4. Verify self-check fires after restoration
5. Enable alerts only after semantic validation confirmed

**Why after M-01:** Self-check has been silent for 30 days with no active data loss. M-01 is also non-functional but precedes this in dependency chain.

---

### Workstream 4: Phase 1A — world-model.js Persistence Repair

**Objective:** Make `updateAllEntities()` write entity state to `world-model.json`, not just log events.

**Risk Level:** 🟡 Medium

**Runtime Impact:** Low — entity state writes on every cycle.

**Restart Required:** YES

**Dependency Order:** 4

**Steps:**
1. Write `writeWorldModelState()` function in `world-model.js` — writes live entity map to `world-model.json`
2. Call `writeWorldModelState()` at end of `updateAllEntities()`
3. Add `loadWorldModel()` call on worker startup to initialize state
4. Test entity state persistence across cycles
5. Verify `world-model.json` is queryable

**Why after M-02:** Phase 1A is bootstrap infrastructure. No data is lost while it is incomplete. Lower operational priority than scheduler recovery.

---

### Workstream 5: Phase 1B — beliefs.js Bootstrap

**Objective:** Design and implement initial belief seeding on worker startup.

**Risk Level:** 🟡 Medium

**Runtime Impact:** Low — initial belief population on startup.

**Restart Required:** YES

**Dependency Order:** 5

**Steps:**
1. Design initial belief set: 5 seed entities × belief predicates (status, health, reliability)
2. Write `seedInitialBeliefs()` function in `beliefs.js`
3. Call from `initializeDurableStores()` chain in `startup.js`
4. Verify beliefs.json populated on first startup
5. Verify subsequent cycles maintain belief TTL discipline

**Why after Phase 1A:** Phase 1B depends on entity state being correctly populated (from world-model persistence repair).

---

### Workstream 6: L-01 + O-01 — Heartbeat Artifact Retirement + Log Cleanup

**Objective:** Archive legacy heartbeat files and clear stale error logs.

**Risk Level:** 🟢 Low (observational only)

**Runtime Impact:** NONE — no code changes, no restart.

**Restart Required:** NO

**Dependency Order:** Any (independent)

**Steps:**
1. Confirm all external heartbeat readers have migrated to `moosa-worker.json`
2. Move `worker.json` and `self-check.json` to `/home/node/.openclaw/workspace/state/heartbeats/archive/`
3. Execute `pm2 flush moosa-worker` to clear stale error logs
4. Document archived files with timestamps

**Why here:** Safe to do anytime. No dependencies. Reduces observational confusion.

---

### Workstream 7: MCAI Integration Strategy

**Objective:** Determine how MCAI Phases 3A/3B/3C connect to worker lifecycle.

**Risk Level:** 🟡 Medium (design decision required)

**Runtime Impact:** Depends on integration approach chosen.

**Restart Required:** TBD based on integration design.

**Dependency Order:** 6 (after Phase 1A/1B complete)

**Design options to evaluate:**

| Option | Approach | Pros | Cons |
|---|---|---|---|
| **A — Worker bridge** | Worker calls MCAI modules via IPC/event bridge | Single source of truth, automatic lifecycle events | Coupling, worker complexity |
| **B — Sidecar observer** | MCAI modules read worker state logs externally | Loose coupling, worker unchanged | Latency, polling required |
| **C — Shared state dir** | Worker and MCAI share `/home/node/.openclaw/workspace/state/` | Simple, shared filesystem | Race conditions, coordination |
| **D — Keep isolated** | Maintain MCAI as completely separate bookkeeping layer | Maximum isolation, no coupling risk | Manual coordination |

**Recommendation:** Option B (Sidecar observer) initially — MCAI modules are already built and tested. A lightweight observer process reads worker state and feeds MCAI bookkeeping. Upgrade to Option A only if automatic lifecycle triggers are proven necessary.

---

### Workstream 8: BCDR Phase 4 Completion

**Objective:** Complete BCDR bootstrap and deploy to worker.

**Risk Level:** 🟡 Medium

**Runtime Impact:** Adds backup/BCDR cycle load.

**Restart Required:** YES

**Dependency Order:** 7 (after integration strategy defined)

---

## Section 5: Governance Rules Learned from RISI

### Permanent RISI Governance Protocol

These rules are **binding on all future RISI work**. They are not guidelines — they are enforcement criteria.

---

**Rule 1: No Restart Without Truth Audit**

> Before any worker restart, a runtime-vs-disk consistency audit must be performed and the result documented.

**Rationale:** The "R4A not active" note was a stale static comment — not a dynamic check. A restart was recommended based on it, which would have been ineffective. Source code on disk was correct; runtime was already healthy.

**Enforcement:** All restart requests must include:
- Current PID and uptime
- Last error timestamp
- Runtime vs disk inode comparison
- Source consistency verdict (CONSISTENT / INCONSISTENT / INCONCLUSIVE)

---

**Rule 2: No Mixed-Path Deployments**

> All source files for a running process must exist at a single canonical path. No deployment of partial updates to one path while a process reads from another.

**Rationale:** `/root/.openclaw/` and `/home/node/.openclaw/` were confirmed to be the same filesystem via bind mount. But mixed deployments (some files updated in one path, some in another) create unpredictable version divergence. The source tree is now unified at `/root/.openclaw/workspace/moosa-worker`.

**Enforcement:**
- All future code changes deploy to `/root/.openclaw/workspace/moosa-worker/src/`
- PM2 working directory must match source tree path
- Post-deployment verification: compare inodes of key files before and after

---

**Rule 3: No Runtime Assumptions from Stale Logs**

> Log files that have not been actively written to by the current process instance are presumed stale. No operational conclusions may be drawn from stale log entries.

**Rationale:** The `moosa-worker-error.log` contained crash logs from a dead process (May 18 06:24) that were 3h 10m old. Reading the file without checking timestamps led to the false conclusion that "iterations is not defined" errors were still occurring. The current process had been error-free for 22+ hours.

**Enforcement:**
- Every log analysis must compare log file modification time against process start time
- If log modified BEFORE current process started → all entries are stale
- Active errors: output log shows errors in last 30 minutes with recent timestamps
- Stale errors: error log modified before current process start time

---

**Rule 4: No Alert Enablement Before Semantic Validation**

> No alert category may be enabled at Level 2 or above until its semantic correctness has been validated against live runtime state.

**Rationale:** The self-check stale alert fired at Level 1/Level 0 but was never semantically validated. The alert condition (self-check not firing) was never confirmed as correct before enablement. After the May 15–18 incidents, the alert was suppressed — but the underlying cause (scheduler stopped Apr 19) remained undetected for 30 days.

**Enforcement:**
- Before any alert is enabled: trigger the condition manually and confirm expected behavior
- Alert must detect a real condition, not an artifact
- Alert threshold must be set based on observed runtime behavior, not assumed

---

**Rule 5: No PM2 Kill During Unstable State**

> `pm2 kill` or any daemon-level termination is prohibited while any process shows unstable restart behavior.

**Rationale:** `pm2 kill` terminates the ENTIRE daemon — all 4 supervised processes die simultaneously. If the daemon is in a poisoned state (self-kill loops, zombie resurrections), killing it without first isolating the cause perpetuates the damage. The correct response is to identify and fix the poison source before daemon-level operations.

**Enforcement:**
- Before `pm2 kill`: document all process states, confirm no restart loops are active
- Use `pm2 stop <process>` for individual process isolation
- Use `pm2 kill` only when daemon-wide shutdown is explicitly intended and all processes are stable

---

**Rule 6: Mandatory Backup Before Runtime Edits**

> Before any change to a running worker's source files, a configuration backup must be captured and a runtime snapshot recorded.

**Rationale:** The May 15–18 incidents involved multiple concurrent changes (Option B deployment, PM2 configuration edits, cron modifications). When multiple changes converge on an unstable runtime, pinpointing the cause of degradation becomes impossible. Single-change deployments with pre-deployment snapshots enable surgical rollback.

**Enforcement:**
- Before any runtime edit: `pm2 save` + file-level backup of changed files
- Record pre-edit state: PID, uptime, error log status, last heartbeat timestamp
- Post-edit verification: confirm PID unchanged, error log clean, heartbeat advancing

---

**Rule 7: Mandatory Runtime-vs-Disk Verification**

> After any deployment or configuration change, an active source consistency audit must be performed and the result documented before the session ends.

**Rationale:** After Option B deployment, the error log was not cleared. PM2 does not truncate log files on restart. When the process later crashed, the error log contained old errors that created the false impression of ongoing instability. Only by comparing error log timestamp against process start time was the staleness detected.

**Enforcement:**
- Post-deployment checklist:
  - [ ] Compare error log last-modified vs process start time
  - [ ] Confirm active PID has not changed (or documented if it has)
  - [ ] Inode check on key files (loop.js, index.js, heartbeat-writer.js)
  - [ ] Confirm no new errors in output log
  - [ ] Confirm heartbeat advancing

---

## Section 6: Recommended Next Immediate Action

### Immediate Action: Fix C-01 (EEL Supabase Path Bug)

**Single safest next implementation target.**

**Why C-01 first:**

1. **It is the only defect causing active silent data loss.** Every WhatsApp message received on APAC channels since May 15 is not in Supabase. The data loss is ongoing and irreversible — messages are gone forever.
2. **It has zero ambiguity.** The fix is a single absolute path replacement in one file. The correct path is determinable. The fix is surgical.
3. **It does not require architectural decisions.** Unlike MCAI integration (which requires design choices) or Phase 1B bootstrap (which requires designing a seed belief set), C-01 is a straightforward path correction.
4. **It can be verified immediately.** After the fix and restart, a single WhatsApp message sent to APAC channel will confirm Supabase recording.
5. **It has a clear rollback path.** If the fix breaks, revert the file and restart — back to current state.

**Why not another tempting action:**

| Alternative | Why Wait |
|---|---|
| Worker restart for Phase 1A/1B | Would activate no new functionality. Phase 1A/1B bootstrap functions don't exist yet. Restarting now changes nothing. |
| MCAI integration | Requires design decision (Option A/B/C/D). Must be designed before implemented. C-01 is a pure bug fix. |
| Alert enablement | Semantic validation required first. Alert conditions may be wrong. C-01 is safer to fix first. |
| PM2 flush | Cosmetic only. Doesn't affect runtime. Can be done anytime. |
| BCDR deployment | BCDR Phase 4 is built but not wired. Wiring requires Phase 1A/1B to be functional first. |

**C-01 fix sequence:**
1. Determine correct absolute path for `secrets/supabase.json` from `apac-whatsapp-hook.js` location
2. Edit `apac-whatsapp-hook.js` — replace relative path with absolute path
3. `pm2 save` current state
4. `pm2 restart moosa-worker`
5. Send test WhatsApp message to APAC channel
6. Query Supabase — confirm event recorded
7. Document fix in runtime log

**Post-C-01 state:** APAC WhatsApp events resume recording to Supabase. Silent data loss stops. System truthfulness is restored for the event sourcing layer.

---

## Appendix: RISI Stabilization Timeline (Reference)

| Date | Event | Status |
|---|---|---|
| 2026-05-15 | Runtime collapse begins | ❌ INCIDENT START |
| 2026-05-15–18 | PM2 daemon poison, zombie processes, restart loops | ❌ ACTIVE DAMAGE |
| 2026-05-18 06:24 | Last error from dead process (iterations crash) | ❌ DEAD PROCESS |
| 2026-05-18 09:34 | Worker restarted by PM2, clean runtime begins | ✅ RECOVERY START |
| 2026-05-18 09:34–19 | Option B heartbeat deployed, watchdog alert categories isolated | ✅ STABILIZATION |
| 2026-05-19 | RISI audits conducted, runtime baseline established | ✅ AUDIT COMPLETE |
| 2026-05-19 | C-01 identified, EEL path bug confirmed | 🔴 ACTIVE DATA LOSS |
| 2026-05-19 | This document written | 📋 THIS DOCUMENT |

---

**Document Status:** COMPLETE
**Next Review:** After C-01 fix deployment
**Classification:** INTERNAL — MCAI Architecture Layer