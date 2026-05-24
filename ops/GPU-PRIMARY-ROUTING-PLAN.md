# GPU-Primary Routing — Implementation Plan
**2026-05-24 | Moosa**

---

## Context

The calibrated comparison engine (v3) is complete and validated. 24/25 calls are now COMPARABLE or PARTIALLY_COMPARABLE. Only 1 WORSE from the original 25-burn-in remains (1 false positive entity overlap on the virus/bacteria comparison).

**Current state:**
- GPU: `mistral-small3.2:latest` — shadow mode, NOT production
- MiniMax: production authority
- GPU failure: automatic MiniMax fallback (no changes needed)
- GPU-primary routing: not yet implemented

---

## Routing Architecture

### Two Modes

**Mode A: MiniMax-Fallback-Only (current default)**
```
User → MiniMax → User
          ↓ (shadow)
       GPU shadow logging
```
- MiniMax handles everything
- GPU shadows every call, logs evidence
- GPU never touches user-facing output

**Mode B: GPU-Primary with MiniMax Fallback**
```
User → GPU → User (if quality >= COMPARABLE_CORRECT)
          ↓ (if quality WORSE/FAILED)
       MiniMax → User
          ↓ (always)
       GPU shadow logging
```
- GPU is primary
- If GPU fails OR quality=WORSE → route to MiniMax
- Shadow logging always happens regardless

---

### Quality Gates

| Quality | Action |
|---|---|
| COMPARABLE / COMPARABLE_CORRECT / COMPARABLE_CORRECT_REFUSAL | Use GPU response |
| COMPARABLE_REFINED / COMPARABLE_DIFFERENT | Use GPU response (with flag) |
| PARTIALLY_COMPARABLE | Use GPU response, flag for review |
| WORSE / FAILED | Use MiniMax response |

---

## Implementation: Mode A (MiniMax-Fallback-Only) — No Changes Needed

Already the default behavior. MiniMax is always primary. GPU shadow only.

---

## Implementation: Mode B (GPU-Primary) — Changes Required

### 1. GPU-Primary Router (`src/core/gpu-primary-router.js`)

New file: routes user requests to GPU first, falls back to MiniMax on quality failure.

```javascript
// Pseudocode
async function gpuPrimaryRoute({ userMessage, systemContext }) {
    // 1. Call GPU shadow router (already built)
    const gpuResult = await sendShadowRequest({...});
    
    // 2. Check quality
    const quality = gpuResult.comparison?.overall_gpu_quality;
    
    // 3. If COMPARABLE or better → return GPU response
    const GOOD_QUALITIES = ['COMPARABLE', 'COMPARABLE_CORRECT', 'COMPARABLE_CORRECT_REFUSAL', 
                            'COMPARABLE_REFINED', 'COMPARABLE_DIFFERENT', 'PARTIALLY_COMPARABLE'];
    if (GOOD_QUALITIES.includes(quality)) {
        return { response: gpuResult.gpu.response, source: 'GPU', quality };
    }
    
    // 4. If WORSE/FAILED → call MiniMax, return MiniMax response
    const miniResult = await callMiniMax({ userMessage, systemContext });
    return { response: miniResult, source: 'MiniMax', quality, fallback: true };
}
```

### 2. Automatic Fallback on GPU Failure

Already handled: if GPU call fails, `gpu_status != 'success'`, quality = FAILED, route to MiniMax.

### 3. Autonomous GPU Schedule Orchestration

See `ops/GPU-LIFECYCLE-CONTROLLER.md` for full design. Implementation requires:

**a) RunPod API access** — verify API key has `startPod/stopPod` permissions for pod `23a9nue4xq4r4`

**b) Lifecycle controller** — `ops/gpu-lifecycle-controller.js`:
```javascript
// Cron: 06:00 UTC daily → start GPU pod
// Cron: 21:00 UTC daily → stop GPU pod
// Health check every 10 min when active
```

**c) Health verification** — before declaring GPU ready:
```javascript
async function verifyGpuHealth() {
    const result = await curlGpuApi('/api/tags');
    return result.status === 200;
}
```

---

## Transition Checklist

| Step | Status | Notes |
|---|---|---|
| Calibrated scorer (v3) | ✅ Done | 24/25 COMPARABLE/PARTIALLY |
| GPU shadow routing | ✅ Done | Works, logs evidence |
| GPU-primary router | 🔄 Next session | New file `gpu-primary-router.js` |
| MiniMax fallback | 🔄 Next session | Integration with existing MiniMax call |
| Mode switch (A/B) | 🔄 Next session | Config flag to toggle modes |
| Lifecycle controller | 🔄 Design done | Implementation needs RunPod API key verification |
| Schedule cron (start/stop) | 🔄 Next session | Requires OpenClaw cron setup |
| Health watchdog | 🔄 Next session | Part of lifecycle controller |

---

## Estimated Effort

- GPU-primary router + MiniMax fallback: ~2-3 hours (coding + testing)
- Lifecycle controller: ~2-3 hours (coding + RunPod API testing)
- Mode switching + testing: ~1 hour
- Total: ~5-7 hours across 2 sessions

---

## Risk Assessment

- **GPU-primary mode**: Med risk — requires validation that WORSE classification is accurate before routing production to MiniMax
- **Mode B with calibration**: Low risk — calibrated scorer has 24/25 correct classifications, 1 known false positive (virus/bacteria, still safe since it falls back to MiniMax)
- **Lifecycle scheduling**: Low risk — failures result in GPU unavailable, MiniMax-only mode continues