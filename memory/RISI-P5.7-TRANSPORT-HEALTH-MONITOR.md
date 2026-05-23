# RISI-P5.7 — Transport Health Monitor

**Phase:** Monitor-only (Phase 1–4A complete, recovery authority deferred)
**Created:** 2026-05-23
**Status:** Active — running on `*/5 * * * *` cron schedule

---

## Problem Statement

`gateway-supervisor.sh` only watches PM2 state (`online`/`stopped`/`errored`). It does not detect the **hung-gateway failure mode**: PM2 reports "online" but the WhatsApp listener is deadlocked, stalled, or unable to process messages.

This can happen because:
- A long-running exec holds a session lock indefinitely
- WhatsApp Web socket disconnects silently
- The gateway enters a goroutine deadlock but PM2 keeps the process alive
- An unhandled exception leaves the gateway in a degraded but running state

**Goal:** Detect these conditions in the transport layer before they become critical outages.

---

## Phase 1 — Monitor-Only Design

Design accepted with one correction: `refresh-scheduler-16` and `refresh-scheduler-23` must NOT be `[PROTECTED]`.

### Signals Monitored

| Signal | Source | Threshold | Healthy | Degraded | Unhealthy |
|---|---|---|---|---|---|
| `pm2Status` | PM2 | — | online | — | not online |
| `gatewayLogFreshness` | PM2 out log (ANSI-stripped) | 120s/300s | <120s | 120–300s | >300s |
| `whatsAppListenerActive` | PM2 out log (whatsapp patterns) | 600s | <600s | — | ≥600s |
| `inboundActivity` | PM2 out log (Inbound message) | 1800s | <1800s | — | ≥1800s |
| `outboundActivity` | PM2 out log (Auto-replied/Sent) | 300s | <300s | — | ≥300s |
| `errorBurst` | PM2 out log (408/429/499/503) | 900s window | none | — | present |
| `sessionLock` | PM2 out log (session.*lock patterns) | 120s | free | — | ≥120s |

### State Machine

- **HEALTHY:** PM2 online + any of listener/inbound/outbound active
- **DEGRADED:** PM2 online + 1–2 unhealthy signals
- **UNHEALTHY:** PM2 online + ≥3 unhealthy signals
- **UNKNOWN:** PM2 not online

### Recovery Authority

**None in Phase 1.** The monitor is read-only. It writes state and emits `recommend_refresh` in the recommendation field, but takes no action.

---

## Phase 2 — ANSI / Log Source Fix

**Problem:** PM2 gateway out log contains ANSICSI color codes (`[35m`, `[39m`, `[36m]`) which create invalid grep regex char classes. Pattern `\[2026-` matches the literal string `[35m` as a broken character class, silently returning empty strings for every signal.

**Fix:**
- Added `strip_ansi()` helper: `sed 's/\x1b\[[0-9;]*m//g'`
- All `scan_log_for()` calls pipe through `strip_ansi` before pattern extraction
- `parse_log_timestamp()` changed from `grep -oP '^\[\[2026-...` (broken char class) to `grep -oP '^[0-9]{4}-[0-9]{2}-[0-9]{2}T...` (POSIX)

**Result:** All signals now read correctly. Log freshness, WhatsApp activity, and inbound/outbound activity all return valid timestamps and ages.

---

## Phase 3 — Repeated Manual Sampling

5 manual runs spaced ~60 seconds apart. No false positives. HEALTHY confirmed in all runs. Log freshness correctly transitioned from `fresh` (23s) to `stale` (140s) without triggering UNHEALTHY. Thresholds are correctly tuned.

### 5-Run Results

| Run | Time | Log | Listener | Inbound | Outbound | State |
|---|---|---|---|---|---|---|
| 1 | 15:06:57 | fresh (23s) | 24s ✅ | 24s ✅ | 23s ✅ | HEALTHY |
| 2 | 15:07:55 | fresh (81s) | 82s ✅ | 82s ✅ | 81s ✅ | HEALTHY |
| 3 | 15:08:54 | stale (140s) | 141s ✅ | 141s ✅ | 140s ✅ | HEALTHY |
| 4 | 15:09:53 | stale (199s) | 200s ✅ | 200s ✅ | 199s ✅ | HEALTHY |
| 5 | 15:10:51 | stale (257s) | 258s ✅ | 258s ✅ | 257s ✅ | HEALTHY |

---

## Phase 4 — Monitor-Only Cron Scheduling

**Added to `/ops/cron-registry.json`:**
```json
{
  "id": "transport-health-monitor",
  "command": "DRY_RUN=false /ops/transport-health-monitor.sh",
  "schedule": "*/5 * * * *",
  "label": "Transport Health Monitor (RISI-P5.7)",
  "protected": false,
  "enabled": true,
  "logRedirect": ">> /ops/transport-health-monitor.log 2>&1"
}
```

**Bug found and fixed during Phase 4:** `recovery-notifier` job had `envVars: ["DRY_RUN=false"]` in the registry. This prepended `DRY_RUN=false */1 * * * *` to the NEXT job's crontab line, corrupting the transport health monitor's command context. Fix: moved `DRY_RUN=false` into the `command` field, removed `envVars`.

**Bug found during monitoring:** DRY_RUN suppresses state writes. Cron was firing with `DRY_RUN=true` (inherited from default), leaving stale state. Fixed by changing cron command to `DRY_RUN=false /ops/transport-health-monitor.sh`.

### Current Crontab

```
*/5 * * * * /home/node/.openclaw/workspace/strateon/ops/uptime-monitor.sh >> ...
0,10,20,30,40,50 6-20 * * * /usr/bin/node ...runpod-watchdog-cron-wrapper.js
0 16 * * * /ops/refresh-scheduler.sh >> ...
0 23 * * * /ops/refresh-scheduler.sh >> ...
*/1 * * * * /root/.openclaw/workspace/ops/gateway-supervisor.sh >> ...  # [PROTECTED]
*/1 * * * * DRY_RUN=false /ops/recovery-notifier.sh >> ...                 # [PROTECTED]
*/5 * * * * DRY_RUN=false /ops/transport-health-monitor.sh >> ...         # RISI-P5.7 ✅
```

---

## Phase 4A — Healthy Counter Reset Patch

**Problem:** Script used `'\$state'` (literal string `"$state"`) instead of `$state` (expanded bash variable). The node comparison was always `false`, incrementing `consecutiveUnhealthyCount` on every run regardless of health state.

**Fix:** Intermediate const: `const st='$state';` then `if(st==='HEALTHY'){...}`.

**Before:** `consecutiveUnhealthyCount` grew indefinitely even on HEALTHY runs (14, 15, etc.)
**After:** Resets to 0 on HEALTHY, `lastHealthyAt` updated correctly.

---

## Current Safety Guarantees

| Guarantee | Enforced By |
|---|---|
| No automatic gateway restart | Phase 1: no restart code paths implemented |
| No PM2 mutation | No `pm2 restart` calls in monitor script |
| No WhatsApp alert | No notification code in monitor |
| No cron unless registered | All cron jobs go through registry |
| No recovery without explicit phase | Recovery authority deferred to future phase |
| Protected jobs immune to blanket removal | gateway-supervisor + recovery-notifier marked `[PROTECTED]` |

---

## Explicit Limitations

- Monitor reads PM2 logs — not a direct gateway health probe
- Silent WhatsApp gaps can be legitimate (no inbound messages)
- Log freshness threshold (300s frozen) requires 3+ other signals for UNHEALTHY
- Monitor does not detect: API timeout, network partition, auth token expiry
- State file can lag up to 5 minutes behind live gateway state (cron interval)
- Duplicate log lines in `/ops/transport-health-monitor.log` due to `tee -a` + stdout redirect (cosmetic only)

---

## Rollback Commands

```bash
# Remove transport-health-monitor from cron
node -e "
const fs=require('fs');
const reg=JSON.parse(fs.readFileSync('/ops/cron-registry.json','utf8'));
reg.jobs=reg.jobs.filter(j=>j.id!=='transport-health-monitor');
fs.writeFileSync('/ops/cron-registry.json',JSON.stringify(reg,null,2));
" && crontab /ops/generated-crontab.preview

# Restore previous crontab
crontab /ops/generated-crontab.preview.pre-p5.7-ph4.bak

# Restore pre-fix monitor script
cp /ops/transport-health-monitor.sh.p5.7-ph1.bak /ops/transport-health-monitor.sh 2>/dev/null || true
```

---

## Next Recommended Phase

**Phase 5 — Recovery Authority Addition (requires explicit approval)**

Before this phase: Ahmad must explicitly approve recovery authority scope. Options:
- `alert_only`: WhatsApp alert to Ahmad, no restart
- `gateway_restart`: graceful gateway restart via PM2
- `full_refresh`: gateway restart + session refresh + WhatsApp alert

This phase is intentionally deferred. Monitor-only mode must run stably before recovery is added.

---

## Files

| File | Role |
|---|---|
| `/ops/transport-health-monitor.sh` | Monitor script |
| `/ops/transport-health-state.json` | State file (live, updated every 5 min) |
| `/ops/transport-health-monitor.log` | Log file (NOT committed — transient) |
| `/ops/cron-registry.json` | Cron registry with transport-health-monitor entry |
| `/ops/generated-crontab.preview` | Active crontab (regenerated from registry) |
| `/ops/cron-registry.json.pre-p5.7-ph4.bak` | Pre-Phase 4 registry backup (do not commit) |
| `/ops/transport-health-monitor.sh.p5.7-ph1.bak` | Pre-Phase 2 script backup (do not commit) |
| `/home/node/.openclaw/workspace/memory/RISI-P5.7-TRANSPORT-HEALTH-MONITOR.md` | This document |