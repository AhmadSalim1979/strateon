# REMEDIATION R1 — Externalized Watchdog Monitoring

**Date:** 2026-04-18
**Status:** Complete

---

## Remediation Summary

Fixed the critical blind spot where MOOSA's self-check ran inside the same worker environment it monitored. Implemented an independent watchdog process that reads heartbeat files written by monitored components and raises alerts via the existing WhatsApp notification path when staleness thresholds are breached.

---

## Architecture Decision

**Watchdog mechanism:** PM2 companion process (`moosa-watchdog`) separate from `moosa-worker`. Runs on a 3-minute cron schedule (`*/3 * * * *`). Completely independent — if moosa-worker dies, the watchdog continues running and detects the missing heartbeat.

**Why this is sufficiently independent:**
- moosa-worker and moosa-watchdog are separate PM2 processes
- moosa-worker writes heartbeat files; moosa-watchdog reads them
- moosa-watchdog does not import any moosa-worker code
- Worker death → no new heartbeats → watchdog detects stale → alerts
- Watchdog survives worker death with no dependency path to the worker

---

## Files Changed / Created

| File | Change |
|------|--------|
| `src/watchdog.js` | **Created** — standalone watchdog process |
| `src/handlers/heartbeat-writer.js` | **Created** — heartbeat signal writer |
| `state/heartbeats/` | **Created** — heartbeat signal directory |
| `ecosystem.config.cjs` | **Modified** — added moosa-watchdog PM2 app |
| `src/handlers/run_self_check_and_decide.js` | **Modified** — writes worker + self-check heartbeats |
| `src/handlers/thinking-loop.js` | **Modified** — writes thinking-loop heartbeat on completion |
| `src/handlers/continuity-store.js` | **Modified** — added CHAIN_PAUSED status |

---

## Heartbeat Model

Three independent heartbeat files written to `state/heartbeats/`:

| File | Written by | Contains | Stale threshold |
|------|-----------|----------|----------------|
| `worker.json` | run_self_check_and_decide each cycle | last_cycle_at, pid, last_status, cycle_count | >10 minutes |
| `thinking-loop.json` | thinking-loop.js on completion | last_run_at, last_decision, guard_blocked | >60 minutes |
| `self-check.json` | run_self_check_and_decide (same cycle as worker) | last_run_at, last_status, alert_sent | >60 minutes |

All three written with `writeFileSync` — synchronous, atomic within the Node process.

---

## Detection Rules

| Failure state | Detection method | Threshold |
|--------------|-----------------|-----------|
| Worker not running | `worker.json` missing or age > stale | >10 min |
| Worker heartbeat stale | age > 10 min | >10 min |
| Thinking loop stale | `thinking-loop.json` missing or age > 60 min | >60 min |
| Self-check stale | `self-check.json` missing or age > 60 min | >60 min |
| Crashloop | `last_status === 'restarting'` AND `cycle_count` low | immediate |

---

## Alert Discipline

**Cooldown:** 4 watchdog cycles (~12 minutes at 3-min interval) must pass before a repeat alert fires for the same `alertKind`.

**Behavior:**
- First occurrence of any alertKind → fires immediately (alertCount=0 condition)
- Subsequent occurrences → require `consecutive_failures >= 4` before firing again
- System returns to HEALTHY → `consecutive_failures` resets to 0
- After cooldown fires → `consecutive_failures` resets to 0 for next cycle

**Alert path:** `sendWhatsApp()` via existing send_whatsapp.js + Supabase task record for audit trail.

---

## Validation Results

| # | Check | Result |
|---|-------|--------|
| V1 | Worker stopped → heartbeat missing → stale | ✅ PASS |
| V2 | Worker alive but heartbeat stale (15min > 10min threshold) | ✅ PASS |
| V3 | Thinking loop stale (70min > 60min) while worker is fresh | ✅ PASS |
| V4 | Self-check path stale (scheduler stopped, file missing) | ✅ PASS |
| V5 | All healthy — no false positives | ✅ PASS |
| V6 | Cooldown discipline correct (first fires + every 4 cycles) | ✅ PASS |
| V7 | Crashloop detection (restarting status + low cycle_count) | ✅ PASS |

---

## Overlap Safety

**Overlap scenario:** Could two watchdog runs overlap (first takes >3min)?

**Analysis:**
- `evaluate()` reads 3 JSON files + writes watchdog-state.json — completes in ~2-4 seconds
- PM2 cron behavior: cron_restart fires at scheduled time; if previous instance is still running, PM2 allows it to complete before firing again (no kill-on-cron)
- Worst case from overlap: one extra `consecutive_failures` increment in a 3-min window — harmless
- Stale detection: a single extra increment is within normal variance and doesn't affect correctness

**Conclusion:** No lock/guard mechanism needed. Overlap is practically impossible given execution time, and the harm from an extra increment is zero.

---

## Residual Limitations

1. Watchdog cannot distinguish between "worker is in a slow GC pause" vs "worker is dead" — both produce stale heartbeat. Operator judgment required in both cases.
2. Alert path uses sendWhatsApp which depends on OpenClaw gateway being alive — if gateway is also down, alert won't deliver. Noted as acceptable scope constraint.
3. Heartbeat files are written by the worker itself — a compromised worker could theoretically corrupt its own heartbeat. Not within R1 scope to address.

---

## Final Statement

**R1 complete.**