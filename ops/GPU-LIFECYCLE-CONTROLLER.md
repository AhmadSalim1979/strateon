# GPU Autonomous Lifecycle Controller
**Design Document — 2026-05-24**

## Concept

GPU pod operates as a scheduled, self-managed resource — started before Moosa's peak cognitive hours and stopped after, maximizing RunPod billing efficiency while ensuring Moosa never loses GPU capability during active windows.

---

## Schedule Specification

| Parameter | Value | Rationale |
|---|---|---|
| **Startup** | 11:00 AM Pakistan time (PKT) = 06:00 UTC | 1h warm-up before 12:00 PKT peak |
| **Shutdown** | 2:00 AM Pakistan time (PKT) = 21:00 UTC previous day | Stops before overnight to minimize idle RunPod charges |
| **Health check window** | 11:00–11:15 PKT (first 15 min) | Verify pod online before declaring ready |
| **Daily billable hours** | ~15 hours (11:00–02:00 PKT) | RunPod billed hourly, ~15h/day |
| **Weekend behavior** | Same schedule | No special handling needed |

**Pakistan time = UTC+5**  
11:00 PKT = 06:00 UTC  
02:00 PKT next day = 21:00 UTC same day

---

## Architecture

```
GPU Lifecycle Controller
├── CronScheduler — triggers at 06:00 UTC daily
├── PodStarter — issues RunPod API start command
├── HealthVerifier — polls /api/tags until 200 or timeout
├── PodStopper — issues RunPod API stop command  
├── AutoRecovery — handles failures with retry logic
└── GracefulFallback — if GPU unavailable, MiniMax remains primary
```

---

## State Machine

```
IDLE (no GPU pod running)
  → at 06:00 UTC: START_REQUESTED
  → after start API: STARTING
  → health check passes: ACTIVE
  → health check fails after 3 retries: DEGRADED

ACTIVE (GPU pod running)
  → continuous monitoring via watchdog cron (every 10 min)
  → if GPU health check fails: DEGRADED → auto-recovery
  → at 21:00 UTC: STOP_REQUESTED → STOPPING → IDLE

DEGRADED (GPU pod issues)
  → auto-recovery: restart pod
  → after 3 failed restarts: GPU_UNAVAILABLE (fallback to MiniMax)

GPU_UNAVAILABLE
  → MiniMax remains production authority
  → retry GPU start at next health check interval (10 min)
  → if recovers: ACTIVE
```

---

## Health Verification Protocol

**Startup verification sequence:**
1. Issue `startPod` API call to RunPod
2. Poll `https://{pod_id}-11440.proxy.runpod.net/api/tags` every 30s
3. On HTTP 200: emit `GPU_READY` event, start shadow mode
4. On HTTP 401/403: token invalid → emit `GPU_AUTH_FAILURE`, log, MiniMax fallback
5. On timeout (>15 min): emit `GPU_START_TIMEOUT`, retry once
6. After 2 failures: emit `GPU_START_FAILED`, mark DEGRADED, MiniMax fallback

**Active monitoring (10-min watchdog):**
- Ping `/api/tags` with Bearer token
- If fails 3 consecutive checks → DEGRADED
- Auto-restart via RunPod API
- After 3 restarts in 24h → flag for manual inspection

---

## RunPod API Integration

**Secrets required:**
- `secrets/runpod.json` — already exists with API key and old pod reference
- Need to update or verify pod ID for new pod

**API calls needed:**
1. `POST /v1/pods/{pod_id}/start` — start the pod
2. `GET /v1/pods/{pod_id}` — check status
3. `POST /v1/pods/{pod_id}/stop` — stop the pod (scheduled shutdown)
4. `GET /v1/pods/{pod_id}/health` — health verification

**Pod ID:** `23a9nue4xq4r4p` (A40 pod, current active)

---

## Graceful Fallback Behavior

If GPU is unavailable at startup or goes DEGRADED during operation:

```
Production route: MiniMax (unchanged — always primary)
Shadow route:     GPU shadow continues logging (no production impact)
Burn-in:          Deferred until GPU returns
Autonomous op:    MiniMax-only until GPU recovers
```

**Invariants that never change:**
- MiniMax remains production authority always
- GPU never blocks or delays user-facing responses
- GPU shadow output never reaches the user
- GPU failures never generate error reports to users

---

## File Locations

| File | Path |
|---|---|
| Lifecycle controller | `ops/gpu-lifecycle-controller.js` |
| RunPod API wrapper | `ops/runpod-api.js` |
| Health check cron | Via OpenClaw cron scheduler |
| Lifecycle state | `state/gpu-lifecycle-state.json` |
| Lifecycle log | `state/gpu-lifecycle-log.jsonl` |

---

## Startup/Shutdown Cron Jobs

**Startup cron (daily at 06:00 UTC):**
```javascript
{
  name: 'gpu-lifecycle-start',
  schedule: { kind: 'cron', expr: '0 6 * * *', tz: 'UTC' },
  payload: { kind: 'systemEvent', text: 'GPU_LIFECYCLE_START' },
  delivery: { mode: 'announce', channel: 'whatsapp', to: '+923215139934' }
}
```

**Shutdown cron (daily at 21:00 UTC):**
```javascript
{
  name: 'gpu-lifecycle-stop',
  schedule: { kind: 'cron', expr: '0 21 * * *', tz: 'UTC' },
  payload: { kind: 'systemEvent', text: 'GPU_LIFECYCLE_STOP' },
  delivery: { mode: 'announce', channel: 'whatsapp', to: '+923215139934' }
}
```

---

## Next Steps / Implementation

1. **Immediate:** Create `ops/gpu-lifecycle-controller.js` (core state machine)
2. **Immediate:** Create `ops/runpod-api.js` (RunPod API wrapper)
3. **Next session:** Register OpenClaw cron jobs for start/stop
4. **Next session:** Wire lifecycle controller into moosa-worker
5. **Before go-live:** Verify RunPod API key has pod start/stop permissions
6. **Before go-live:** Test full start→health→stop cycle without errors

---

## Readiness Assessment

| Mode | Status |
|---|---|
| GPU-primary mode | ⚠️ Not yet — requires scoring calibration (verbosity vs quality) |
| MiniMax fallback-only mode | ✅ Ready — always primary, GPU is shadow only |
| Scheduled autonomous GPU operation | 🔄 Design ready — needs implementation + cron wiring |
| GPU lifecycle controller | 🔄 Design complete — implementation pending |