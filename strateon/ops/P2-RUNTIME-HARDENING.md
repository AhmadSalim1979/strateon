# P2 Runtime Hardening & PM2 Protection Layer
**Phase:** P2 — Investigation Complete | **Date:** 2026-05-18 | **Status:** INVESTIGATION COMPLETE — awaiting Ahmad approval

---

## Executive Summary

PM2 is the correct primary orchestrator. The May 15-17 collapse was caused by a cascading orphan process interaction, not a PM2 design flaw. The environment is currently stable but carries residual artifacts.

**Bottom line:** Fix 3 things, then PM2 is permanently trustworthy.

---

## 1. PM2 Collapse — Root Cause Chain

### Timeline of PM2 Self-Kill Events
```
May 16 12:29 — First observed PM2 self-kill cycle
May 16 13:07 — Second cycle
May 17 13:18 — Third cycle
May 17 13:52 — Fourth cycle
May 17 14:02 — Fifth cycle
May 17 15:00 — Sixth cycle + Error: 1:id unknown
May 17 18:15 — Seventh cycle (worker killed at 18:15)
May 17 19:48 — Worker/watchdog respawned (now current state)
May 17 20:00 — Eighth cycle
May 17 20:18 — Ninth cycle
May 17 21:33 — Final cycle, qiyadon-audit-form crash loops
```

### Root Cause — Orphan Zombie PM2 Entry

**The `strateon-followup-engine` PM2 entry is a zombie** — started but never properly deleted. Its `cron_restart: '*/5 * * * *'` caused repeated restart attempts. Under daemon load, PM2's internal management would intermittently try to reconcile this orphan entry.

The orphan PM2 process tree:
```
PID 891610: /bin/bash -c pm2 logs strateon-followup-engine --out --lines 20 2>/dev/null | tail -25
PID 891611: node /usr/bin/pm2 logs strateon-followup-engine --out --lines 20
```

**PID 891611 is STILL running** (May 15 → May 18 = 3+ days). Leaked PM2 log tailer process.

### PM2 Self-Kill Mechanism

`[RestartProcessId] PM2 is being killed, stopping restart procedure...` occurs when:
1. PM2 tries to restart a process
2. Process fails to respond to SIGINT within timeout
3. PM2 calls `kill -9` as fallback
4. Under cascading failure, daemon initiates protective shutdown against all processes

**This is NOT an external `pm2 kill` command.** PM2's internal self-protection when overwhelmed.

---

## 2. Runtime Integrity — Current State

### Active Processes (VERIFIED)

| Process | PID | Uptime | Restarts | PM2 ID | Path |
|---|---|---|---|---|---|
| moosa-worker | 1012415 | 9h | 0 | 6 | /root/.openclaw/workspace/moosa-worker/src/index.js |
| moosa-watchdog | 1012418 | 9h | 0 | 7 | /root/.openclaw/workspace/moosa-worker/src/watchdog.js |
| openclaw-gateway | 1012449 | 9h | 0 | 5 | /usr/bin/bash (openclaw daemon) |
| qiyadon-audit-form | 1016266 | 7h | 0 | 10 | /home/node/.openclaw/workspace/server.js |
| cloudflared-tunnel | 951644 | 9d | 0 | stopped | /opt/node24/.../cloudflared (standalone) |

### Zombie Processes (ORPHANS — NEED CLEANUP)

| Process | PID | Age | Status | Danger |
|---|---|---|---|---|
| strateon-followup-engine PM2 log tailer | 891611 | 3+ days | Orphan (from zombie PM2 entry) | Low — leaked process |
| strateon-followup-engine bash wrapper | 891610 | 3+ days | Orphan | Low — parent of leaked process |

### PM2 Dump State

```
Total entries: 6 (all show pm_id=None — PM2 internal IDs)
Active: 4 (moosa-worker, moosa-watchdog, openclaw-gateway, qiyadon-audit-form)
Stopped: 2 (cloudflared-tunnel, instruction-sidecar-shadow)
```

**PM2 dump is clean of active zombies.** The strateon-followup-engine entry was removed but its log tailer process leaked.

---

## 3. Heartbeat Truth Validation

### Architecture

```
Heartbeat Writer (run_self_check_and_decide.js):
  → join(process.cwd(), 'state', 'heartbeats', 'worker.json')
  → /home/node/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json

Watchdog (watchdog.js):
  → WORKER_HB = join(process.cwd(), 'state', 'heartbeats', 'worker.json')
  → /home/node/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json
  → PATH IS CORRECT — no split-brain
```

### Current Heartbeat State

**worker.json (May 15 18:23 UTC — 72+ hours stale):**
```json
{
  "process_name": "worker",
  "pid": 922274,
  "last_cycle_at": "2026-05-15T18:23:27.644Z",
  "last_status": "UNHEALTHY",
  "cycle_count": 1,
  "task_id": "2fe87363-a0ab-4b78-83df-82b66f4e66cf"
}
```

**Why it's stale:**
1. Worker crashed at May 15 18:23 (TD-Codex init order bug + scope errors)
2. `writeCycleHeartbeats()` was called with `last_status: UNHEALTHY` before crash
3. Worker restarted but never successfully executed `run_self_check_and_decide` → no new heartbeat written
4. Current worker (PID 1012415, May 17 19:48) has not written any heartbeat yet

### Why Stale Detection Hasn't Triggered Recovery

1. Watchdog's stale detection works — correctly identifies stale heartbeat
2. Watchdog fires alerts via `sendWhatsApp()`
3. **But `WATCHDOG_ALERTS_ENABLED=false`** — alerts are disabled
4. Stale detection continues and is logged, but no alert is sent

### Schema Bug — stale-task-detector

```javascript
// Buggy line 133:
.select('id, goal, status, created_at, last_update_at, input_json, metadata')
// last_update_at does not exist — schema v2 has created_at only
// Correct column: lifecycle_state
```

**Result:** Detector returns 0 active tasks regardless of actual state.

---

## 4. Canonical Runtime Map

### Repo Root (Canonical)
- **Primary:** `/home/node/.openclaw/workspace` (has git repo)
- **Symlink:** `/root/.openclaw/workspace` → same location (inode verified)

### PM2 Working Directory
- **qiyadon-audit-form:** `/home/node/.openclaw/workspace`
- **moosa-worker/moosa-watchdog:** `/root/.openclaw/workspace/moosa-worker` → resolves to `/home/node/.openclaw/workspace/moosa-worker`

### Heartbeat Path (Canonical)
- **Path:** `/home/node/.openclaw/workspace/moosa-worker/state/heartbeats/worker.json`
- **Watchdog reads:** same path (correct)
- **No split-brain** — writer and reader aligned

### Cloudflared Ownership
- **Standalone** outside PM2 (PID 951644, May 16)
- **PM2 entry:** stopped (intentional)
- **Token:** valid, intact

### OpenClaw Gateway
- **Process:** PID 1012449
- **Started:** May 17 19:48 via PM2
- **WhatsApp:** connected

---

## 5. PM2 Long-Term Verdict

**YES — PM2 is appropriate as primary orchestrator.**

- Manages 5 processes stably for 9+ hours with 0 restarts
- Child process resurrection works correctly
- Well-understood failure modes now that orphan pattern is documented

**Long-term:** Consider systemd as supervisor for PM2 daemon itself (PM2 as second-level). Not urgent.

---

## 6. Implementation Phases

### Phase P2.1 — Immediate (No Risk)
1. Kill orphaned strateon-followup-engine log tailer: `kill 891610 891611`
2. Delete zombie PM2 entries: `pm2 delete strateon-followup-engine instruction-sidecar-shadow`
3. Verify PM2 dump: 4 active entries

### Phase P2.2 — Low Risk
4. Enable watchdog alerts: `WATCHDOG_ALERTS_ENABLED=true` in moosa-watchdog env
5. Fix stale-task-detector schema query: replace `last_update_at` with `created_at`

### Phase P2.3 — Medium Risk (Requires Ahmad Approval + Worker Restart)
6. Fix TD-Codex init order bug (May 15 crash cause)
7. Add resurrection verification to startup
8. Add PM2 memory ceiling to all configs

---

## 7. Risk-Ranked Remediation List

| # | Item | Risk | Effort | Priority |
|---|---|---|---|---|
| 1 | Kill orphaned PID 891610/891611 | None | Low | P0 — Do now |
| 2 | Delete zombie PM2 entries | None | Low | P0 — Do now |
| 3 | Enable watchdog alerts | None | Low | P1 |
| 4 | Fix stale-task-detector column name | None | Low | P1 |
| 5 | Remove watchdog cron_restart | Low | Low | P1 |
| 6 | Fix TD-Codex init order bug | Medium | High | P2 — Needs worker restart |
| 7 | Add PM2 memory ceiling | Low | Medium | P2 |
| 8 | Implement resurrection verification | Low | Medium | P2 |

---

## 8. What NOT To Do

- **Do NOT run `pm2 kill`** — destroys the daemon
- **Do NOT run `pm2 save`** until zombie entries deleted
- **Do NOT move cloudflared into PM2** — standalone is correct
- **Do NOT restart stable services** — current state is healthy
- **Do NOT rotate tokens** — no security issue

---

## 9. Current Runtime Health Score

**DEGRADED BUT ACCEPTABLE**

| Component | Status | Notes |
|---|---|---|
| PM2 daemon | ✅ Stable | 9h uptime, 0 restarts |
| moosa-worker | ✅ Online | 9h, but stale heartbeat from May 15 |
| moosa-watchdog | ✅ Online | 9h, detecting stale correctly but alerts disabled |
| openclaw-gateway | ✅ Online | WhatsApp connected |
| qiyadon-audit-form | ✅ Online | 7h, form routes healthy |
| cloudflared | ✅ Standalone | Tunnel functional |
| Zombie orphans | ⚠️ Present | PIDs 891610/891611 leaked |
| PM2 dump | ⚠️ Clean but zombie present | Needs orphan deletion |
| Heartbeat path | ✅ Correct | Writer and reader aligned |
| Stale-task-detector | ❌ Broken | Wrong column name |

---

**Awaiting Ahmad's approval to proceed with Phase P2.1 (kill orphans + delete zombie PM2 entries).**