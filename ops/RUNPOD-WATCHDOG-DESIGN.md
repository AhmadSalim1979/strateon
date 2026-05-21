# GPU Startup Watchdog Design — Phase D-2.1

**Date:** 2026-05-21
**Status:** DESIGN COMPLETE — IMPLEMENTATION PENDING

---

## 1. Recommended Watchdog Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WATCHDOG FLOW                          │
│  Hetzner (PM2 worker) or isolated session                  │
│  Triggered by cron OR manual Ahmad invocation              │
└──────────────────────┬────────────────────────────────────┘
                       │
         ┌─────────────▼──────────────────┐
         │  STEP 1: POD ACQUISITION         │
         │  RunPod API /pods/{id}/start    │
         │  → Validate desiredStatus=RUNNING│
         │  → Sync endpoint state           │
         │  → Alert: pod start failure    │
         └─────────────┬──────────────────┘
                       │ if RUNNING
         ┌─────────────▼──────────────────┐
         │  STEP 2: WORKSPACE VALIDATION    │
         │  HTTP GET /workspace/health     │
         │  → Validate /workspace exists   │
         │  → Validate start-all.sh present│
         │  → Alert: workspace missing     │
         └─────────────┬──────────────────┘
                       │ if valid
         ┌─────────────▼──────────────────┐
         │  STEP 3: SERVICE HEALTH WAIT     │
         │  Wait 30s for start-all.sh     │
         │  (bootstrap hook fires first)  │
         └─────────────┬──────────────────┘
                       │ after wait
         ┌─────────────▼──────────────────┐
         │  STEP 4: OLLAMA HEALTH         │
         │  HTTP GET 127.0.0.1:11434     │
         │  → Alert: Ollama not responding│
         └─────────────┬──────────────────┘
                       │ if responding
         ┌─────────────▼──────────────────┐
         │  STEP 5: AUTH PROXY HEALTH       │
         │  HTTP GET 0.0.0.0:11440/health  │
         │  → Alert: auth proxy down       │
         └─────────────┬──────────────────┘
                       │ if responding
         ┌─────────────▼──────────────────┐
         │  STEP 6: TOKEN VALIDATION        │
         │  invalid token → 401?          │
         │  valid token → model list?     │
         │  → Alert: token auth broken     │
         └─────────────┬──────────────────┘
                       │ if valid
         ┌─────────────▼──────────────────┐
         │  STEP 7: MODEL CHECK              │
         │  GET /v1/models via proxy        │
         │  → Validate mistral-small3.2     │
         │  → Alert: model missing          │
         └─────────────┬──────────────────┘
                       │ if all pass
         ┌─────────────▼──────────────────┐
         │  STEP 8: READINESS REPORT       │
         │  WhatsApp: GPU_READY + IP     │
         └───────────────────────────────┘
```

---

## 2. Files/Modules to Create or Modify

| File | Action | Purpose |
|---|---|---|
| `src/core/runpod-gpu-watchdog.js` | **CREATE** | Main watchdog orchestrator |
| `src/core/runpod-pod-health.js` | **CREATE** | Pod status + acquisition via REST |
| `src/core/runpod-workspace-health.js` | **CREATE** | Workspace validation |
| `src/core/ollama-proxy-health.js` | **CREATE** | Ollama + proxy + token validation |
| `src/core/alert-router.js` | **CREATE** | Unified alert routing (WhatsApp + log) |
| `state/runpod-watchdog-state.json` | **CREATE** | Last run state + outcomes per check |
| `ops/RUNPOD-WATCHDOG.md` | **CREATE** | Operational runbook |

**Watchdog file:** `src/core/runpod-gpu-watchdog.js`
```javascript
/**
 * RunPod GPU Watchdog — Phase D-2.1
 * SHADOW-ONLY: Observational health monitoring + alert routing
 * 
 * Triggers on cron or manual invocation.
 * Validates full GPU startup sequence.
 * Alerts via WhatsApp on any failure.
 * Reports readiness when all checks pass.
 * 
 * NO autonomous execution of start/stop (requires Ahmad approval per cycle)
 * NO routing changes
 * NO cron activation in this phase
 */
```

---

## 3. Health-Check Sequence

```
SEQUENCE: runWatchdog()
├── 1. acquirePod()          — POST /pods/{id}/start (if not RUNNING)
├── 2. waitForBootstrap()     — sleep 30s (bootstrap hook fires)
├── 3. validateWorkspace()   — HTTP GET /workspace/health
├── 4. checkOllama()         — HTTP GET 127.0.0.1:11434/api/tags
├── 5. checkAuthProxy()       — HTTP GET 0.0.0.0:11440/health
├── 6. checkTokenAuth()      — invalid token → 401, valid token → 200
├── 7. checkModel()           — GET /v1/models → mistral-small3.2:latest present
├── 8. reportReadiness()      — WhatsApp GPU_READY + IP
└── ALERT on any failure     — WhatsApp: failure type + step + action
```

**Check parameters:**
- HTTP timeout per check: 15s
- Retry before alert: 2 attempts with 10s delay
- Wait between checks: 5s (service startup buffer)

---

## 4. Alert Escalation Rules

### Severity Levels

| Level | Condition | Action |
|---|---|---|
| **CRITICAL** | Pod start failure after 3 retries | WhatsApp: "GPU START FAILED — manual intervention required" |
| **CRITICAL** | /workspace missing or invalid | WhatsApp: "GPU workspace lost — pod may need rebuild" |
| **HIGH** | Ollama not responding (30s timeout) | WhatsApp: "Ollama not responding on GPU — retry initiated" |
| **HIGH** | Auth proxy not responding | WhatsApp: "Auth proxy down on GPU — retry initiated" |
| **HIGH** | Model missing after Ollama ready | WhatsApp: "mistral-small3.2 missing — reinstall required" |
| **MEDIUM** | Token auth broken (401 or model list fails) | WhatsApp: "Token auth validation failed" |
| **LOW** | Any check passes on retry | Log: "GPU watchLog recovered at [time]" |

### Alert Message Format (WhatsApp)
```
🔴 GPU WATCHDOG ALERT

Step: [step name]
Failure: [failure description]
Pod: [pod_id]
IP: [public IP]
Time: [ISO timestamp]
Retry: [attempt # / max]

Action: [what needs human intervention]
```

### Readiness Message Format
```
🟢 GPU READY

Pod: c1as99lq8xtphy
IP: 157.157.221.29
SSH: 32426
Proxy: 11440
Model: mistral-small3.2:latest ✅
Validated: [ISO timestamp]
```

---

## 5. Alert Destination

**Primary:** WhatsApp (direct message to Ahmad)
- All CRITICAL and HIGH alerts go immediately to WhatsApp
- Watchdog runs silently on LOW checks (log only)

**Secondary:** Log file
- `ops/gpu-watchdog.log` — all events (pass, fail, retry, alert sent)
- Append-only, no rotation deletion
- Last line always = most recent event

**No other destinations** until explicitly approved.

---

## 6. What Can Be Implemented Now

Without routing changes, without MiniMax changes, without cron activation:

✅ `src/core/runpod-pod-health.js` — pod status + acquisition
✅ `src/core/runpod-workspace-health.js` — workspace validation
✅ `src/core/ollama-proxy-health.js` — Ollama + proxy + token validation
✅ `src/core/alert-router.js` — WhatsApp alert + log routing
✅ `src/core/runpod-gpu-watchdog.js` — orchestrator (without cron trigger)
✅ `state/runpod-watchdog-state.json` — state tracking
✅ `ops/RUNPOD-WATCHDOG.md` — operational runbook

**All of the above can be built, tested via isolated session, and committed.**

The only thing not yet activatable: the cron trigger. That requires explicit Ahmad approval per-cycle until the watchdog is proven stable.

---

## 7. What Should Wait

| Feature | Wait Until |
|---|---|
| Full routing through proxy (11440 as primary) | Proxy fully hardened + latency tested |
| MiniMax demotion to GPU fallback | GPU proxy latency < 200ms + reliability confirmed |
| PM2 process manager on RunPod | Auth proxy fully hardened |
| Automatic stop at 2 AM PKT | Watchdog validated + readiness confirmed |
| Cron activation | All checks pass in manual mode first |

---

## 8. Implementation Sequence

```
Phase D-2.1a: Build pod-health.js (API-only, no SSH)
Phase D-2.1b: Build workspace-health.js (HTTP-only, no SSH)
Phase D-2.1c: Build ollama-proxy-health.js (HTTP-only, no SSH)
Phase D-2.1d: Build alert-router.js (WhatsApp + log)
Phase D-2.1e: Build runpod-gpu-watchdog.js (orchestrator)
Phase D-2.1f: Run isolated full-sequence validation
Phase D-2.1g: Manual cron trigger test (one-shot)
Phase D-2.2:  Activation with Ahmad approval
```

---

## 9. Key Design Decisions

1. **Hetzner as control plane, RunPod pod as execution plane** — Hetzner cannot SSH to RunPod, but Hetzner can reach RunPod's HTTP endpoints. Watchdog runs on Hetzner, validates via HTTP.

2. **Idempotent health checks** — Every check is safe to run multiple times. No destructive operations in the watchdog itself.

3. **Token auth validation as a check** — Not just "does the proxy respond?" but "does invalid token return 401 AND valid token return models?" This is the actual security contract.

4. **Bootstrap wait is a feature, not a bug** — The 30s wait after pod start gives the `/etc/profile.d/` bootstrap hook time to fire. The watchdog waits for the system to be ready, rather than assuming it's ready immediately.

5. **Alert before action on CRITICAL** — Pod start failures, workspace loss — these alert immediately without retry. Human decision required.

6. **Retry before alert on HIGH** — Ollama not responding, auth proxy down — retry twice with 10s delay before alerting. Transient startup delays shouldn't page Ahmad.

7. **State persistence** — `runpod-watchdog-state.json` tracks last run outcomes, enabling next-session recovery and pattern detection.