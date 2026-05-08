# N8N RELIANCE REMOVAL — PHASE 3: WEBHOOK INTEGRATION & DUAL-WRITE

**Date:** 2026-05-08
**Status:** ✅ PHASE 3 INTEGRATION COMPLETE (not yet deployed)

---

## Phase 3 Objectives

1. ✅ Wire webhook receiver → event bus → event router
2. ⚠️ Override WEBHOOK_INTERNAL_SECRET via environment (must be done before deployment)
3. ✅ Event dual-write to Supabase for durability (Redis + Supabase)
4. ✅ Queue depth monitoring and alerting

---

## What Was Built

### 1. Webhook → Event Bus → Router Integration (`phase3-webhook-integration.ts`)

**The gap:** Phase 2's webhook receiver received events but didn't route them to the event router.
Events went into Redis pub/sub but had no subscribers wired up.

**The fix:** `phase3-webhook-integration.ts` bridges the gap:

```
HTTP POST /internal/event
  → receiver.ts validates payload
  → createEvent() creates OrchestrationEvent
  → publishEvent() → Redis pub/sub (Phase 2 behavior)
  → event bus delivers to router (Phase 3 NEW)
  → router matches pattern, calls handler
```

**Event flow after Phase 3:**
- Webhook receiver now calls `publishEvent()` which publishes to Redis
- Event bus subscriber receives the event and passes it to the router
- Router matches the event type pattern and calls the registered handler
- Handler processes the event

**Handlers registered:**
- `job.queued` — logs job enqueue events
- `job.dead_lettered` — logs and alerts on dead-lettered jobs
- `system.alert` — logs and alerts on system alerts
- `*` (catch-all) — logs all events for visibility (disable in production)

### 2. Event Dual-Write Strategy (`phase3-webhook-integration.ts` → `persistEventToSupabase()`)

**The gap:** Phase 2 events went only to Redis pub/sub. If Redis lost data (restart, crash), events were gone.
No durable audit trail existed.

**The fix:** Dual-write — every event goes to BOTH:
1. **Redis pub/sub** — fast path for real-time subscribers (low latency)
2. **Supabase `events` table** — durable path for audit, governance, replay

**Implementation:**
```
publishEvent(event) {
  1. redis.publish(channel, JSON.stringify(event))  // fast path
  2. supabase.from('events').insert({...})           // durable path (async, non-blocking)
}
```

**Error handling:**
- If Redis publish fails → event is lost (correct — we don't have Redis durability without pub/sub)
- If Supabase write fails → error is logged but event flow continues
- Reason: Supabase is for durability/audit; failing it doesn't break operational flow

**Supabase schema (PENDING FROM AHMAD):**
The `events` table is expected to have these columns:
- `event_id` UUID PRIMARY KEY
- `event_type` TEXT NOT NULL
- `source` TEXT NOT NULL
- `payload` JSONB NOT NULL
- `correlation_id` TEXT (nullable)
- `caused_by_job_id` TEXT (nullable)
- `hop_count` INTEGER DEFAULT 0 ← **PENDING FROM AHMAD**
- `processed_at` TIMESTAMPTZ ← **PENDING FROM AHMAD**
- `processed_by` TEXT ← **PENDING FROM AHMAD**
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Note on pending columns:** Code writes to the confirmed columns only. When Ahmad provides the SQL with `hop_count`, `processed_at`, `processed_by`, the insert in `persistEventToSupabase()` should be updated to include those columns.

### 3. Queue Depth Monitoring & Alerting (`monitoring/queue-monitor.ts`)

**What it does:**
- Every 30s (configurable), reads queue depth via `getQueueStats()`
- Emits `system.alert` events when thresholds exceeded
- Alert cooldown: 5 minutes between repeated alerts (prevents spam)

**Thresholds:**
- `warning` — QUEUE_DEPTH_WARNING env var (default 50)
- `critical` — QUEUE_DEPTH_CRITICAL env var (default 100)

**Alert format (system.alert event):**
```json
{
  "severity": "warning|critical",
  "component": "queue-monitor",
  "message": "Queue depth warning: 60 jobs pending (threshold: 50)",
  "details": {
    "queue_depth": 60,
    "active_jobs": 3,
    "dead_letter_count": 2,
    "retry_count": 1
  }
}
```

### 4. Phase 3 Integration Entry Point (`phase3-integration.ts`)

Starts the complete Phase 3 system:
- Config validation (fails if WEBHOOK_INTERNAL_SECRET is still default)
- Integration verification (Supabase, Redis, event routes)
- Event handler initialization
- Queue monitor start
- Webhook receiver on port 3003
- Status endpoint on port 3005 (for monitoring systems)

---

## Deployment Checklist

Before deploying Phase 3 to production:

### REQUIRED — Must do before deployment:
- [ ] Set `WEBHOOK_INTERNAL_SECRET` environment variable to a strong, unique secret
  - The app will refuse to start if the default dev value is detected
- [ ] Confirm Supabase `events` table exists with appropriate schema
  - If table doesn't exist yet, events will be logged but not persisted to Supabase
  - Once Ahmad provides the SQL, run it to enable full dual-write
- [ ] Verify Redis is accessible and has sufficient memory for queue depth

### OPTIONAL — Improve before production:
- [ ] Set `QUEUE_DEPTH_WARNING=50` (or appropriate value for your load)
- [ ] Set `QUEUE_DEPTH_CRITICAL=100` (or appropriate value for your load)
- [ ] Disable the catch-all logger handler (`*`) in production to reduce log noise
- [ ] Add a network-level firewall rule to ensure port 3003 is only accessible internally

---

## Files Created/Modified

| File | Action | Purpose |
|---|---|---|
| `src/phase3-webhook-integration.ts` | Created | Webhook integration, dual-write, handler initialization |
| `src/phase3-integration.ts` | Created | Phase 3 entry point, startup orchestration |
| `src/monitoring/queue-monitor.ts` | Created | Queue depth monitoring and alerting |
| `src/phase3.md` | Created | This documentation |
| `src/events/event-bus.ts` | Modified | Minor re-export to support phase3 module |
| `src/events/router.ts` | Modified | Minor re-export to support phase3 module |

---

## Phase 3 Verification

```bash
# Build
cd orchestration && npx tsc

# Run Phase 2 validation (still should pass 5/5)
node dist/phase2-validate.js

# Run Phase 3 integration (requires env vars set)
WEBHOOK_INTERNAL_SECRET=your-secret-here \
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_KEY=your-key \
node dist/phase3-integration.js
```

---

## Open Issues

1. **Phase 3 SQL columns pending from Ahmad:** `hop_count`, `processed_at`, `processed_by` — code is written to accommodate them once the schema is confirmed.

2. **Supabase events table:** needs to be created. The code currently tries to write to it; if the table doesn't exist, it logs a warning but doesn't fail. When Ahmad provides the SQL schema, run it to enable full dual-write.

3. **Catch-all handler:** the `*` catch-all route logs all events. In high-volume scenarios this could be noisy. Should be disabled or made configurable in production.

4. **No backpressure handling:** if queue fills faster than workers can process, Redis memory grows. The queue monitor alerts but doesn't take corrective action. Phase 4 could add automatic worker scaling or job rejection at high water mark.

---

*AI Architect (Moosa) — 2026-05-08*
*Phase 3 integration complete — awaiting deployment with WEBHOOK_INTERNAL_SECRET override*