# GPU Shadow Routing Design — Phase D-2.6

**Status:** DESIGN COMPLETE — SHADOW MODE ONLY
**Date:** 2026-05-21
**Classification:** SHADOW-ONLY — No production authority, no routing changes

---

## 1. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    CURRENT PRODUCTION PATH                    │
│                                                              │
│  User Request → Moosa (main) → MiniMax (primary) → Response │
│                                   ↓                           │
│                          (response sent to user)              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   SHADOW ROUTING OVERLAY                       │
│                                                              │
│  User Request → Moosa (main) → MiniMax (primary) → Response  │
│                                    ↓ parallel duplicate       │
│                              GPU Shadow Router                │
│                                    ↓                         │
│                              Ollama (GPU) → Comparison       │
│                                                   ↓          │
│                                       state/gpu-shadow-*.jsonl│
│                                                   ↓          │
│                                      No production output     │
│                                                              │
│  GPU response is NEVER used operationally in shadow mode.      │
└──────────────────────────────────────────────────────────────┘
```

### Core Principle
**MiniMax remains authoritative.** The GPU path runs in parallel — receives the same input, generates its own output, and stores the comparison. The GPU output is observed-only. It does not reach the user, does not influence decisions, and cannot become primary without explicit written approval from Ahmad.

---

## 2. Interception Points

### 2.1 Request Duplication
After the primary model (MiniMax) receives the request but before the response is finalized, the shadow router receives a copy of:
- `request_id` — unique identifier for this exchange
- `user_message` — the raw user input
- `system_context` — current SOUL.md/IDENTITY.md/USER.md context snapshot
- `timestamp` — when the request was received

### 2.2 Response Capture
After MiniMax generates its response, the shadow router captures:
- `minimax_response` — full text of MiniMax's output
- `minimax_latency_ms` — time from request to response
- `minimax_model` — model identifier used
- `minimax_tokens` — token count (if available)

### 2.3 GPU Parallel Call
The shadow router sends the same request to the GPU path:
- `gpu_url` — `https://c1as99lq8xtphy-11440.proxy.runpod.net/v1/chat/completions`
- `gpu_model` — `mistral-small3.2:latest`
- Same `user_message` and `system_context`
- Timeout: 45 seconds (GPU is slower than MiniMax)

### 2.4 Response Capture (GPU)
- `gpu_response` — full text of GPU's output
- `gpu_latency_ms` — time from parallel call to response
- `gpu_tokens` — token count (if available from Ollama)
- `gpu_status` — success / timeout / error / auth_failure

### 2.5 Comparison
Both responses are compared across 9 dimensions and stored. **No comparison result is used operationally.**

---

## 3. Comparison Schema

```json
{
  "comparison_id": "cmp-[timestamp-36]",
  "request_id": "req-[timestamp-36]",
  "timestamp": "ISO8601",
  "shadow_status": "SHADOW_ACTIVE | PAUSED | ERROR",

  "request": {
    "user_message": "string (truncated to 500 chars)",
    "message_length": 123,
    "has_system_context": true,
    "context_snapshot_hash": "sha256-hash"
  },

  "minimax": {
    "response": "string (full text, truncated to 4000 chars)",
    "response_length": 456,
    "latency_ms": 1234,
    "model": "MiniMax-abliter01",
    "tokens_used": 789,
    "status": "success | error"
  },

  "gpu": {
    "response": "string (full text, truncated to 4000 chars)",
    "response_length": 512,
    "latency_ms": 3456,
    "model": "mistral-small3.2:latest",
    "tokens_used": 678,
    "status": "success | timeout | error | auth_failure"
  },

  "comparison": {
    "length_delta_chars": 56,
    "length_delta_ratio": 0.12,
    "latency_gpu_vs_minimax_ms": 2222,
    "latency_ratio": 2.80,
    "response_similarity_score": 0.73,
    "keyword_overlap": 0.81,
    "hallucination_flags": ["factually_inconsistent:1", "unsupported_claim:0"],
    "hallucination_score": 0.15,
    "truncation_detected": false,
    "reasoning_depth_gpu": "formal",
    "reasoning_depth_minimax": "formal",
    "reasoning_depth_match": true,
    "safety_score_gpu": 0.95,
    "safety_score_minimax": 0.92,
    "overall_gpu_quality": "COMPARABLE | BETTER | WORSE | INCOMPARABLE",
    "recommendation": "SHADOW_ONLY — do not promote without explicit approval"
  },

  "sampling": {
    "sampled": true,
    "sampling_reason": "low_risk_task",
    "request_category": "informational"
  },

  "fail_safe": {
    "gpu_timeout_used": false,
    "gpu_error_handled": "logged_only",
    "shadow_error_did_not_block_production": true,
    "production_response_delivered": true,
    "production_latency_unaffected": true
  }
}
```

---

## 4. Request Classification — Sampling Logic

### SAFE_FOR_SHADOW ✅
Requests that may be duplicated to the GPU path:
- Factual questions with no external impact
- Internal analysis and reasoning tasks
- Document summaries, explanations, descriptions
- Code explanations (read-only, no execution)
- General knowledge questions
- Requests where errors cause no external harm

### NOT_SAFE_FOR_SHADOW ⏭️
Requests that should delay shadow routing:
- Tasks involving client-facing outputs (待 approval first)
- Multi-step reasoning chains already in progress
- Requests where response comparison could introduce delay
- Complex creative tasks with high stakes

### NEVER_GPU 🚫
Requests that must never be sent to GPU:
- Authorization approvals or denials
- Billing or payment instructions
- External communications (email, messaging, posts)
- Security-related decisions
- Passwords, credentials, or secrets
- Legal or contractual content
- Executive decisions about Qiyadon direction
- Anything marked HIGH_RISK by governance

### Sampling Priority (initial rollout, lowest risk first)
1. **Informational queries** — "What is X?", explain Y
2. **Internal analysis** — analyze this data, summarize
3. **Code review** — explain this function, review logic
4. **Planning tasks** — outline approach for X
5. **Documentation** — draft explainer for Z

---

## 5. Fail-Safe Logic

```
SHADOW CALL TIMEOUT (45s):
  → Log gpu_timeout = true
  → Do NOT retry
  → Do NOT fall back to other model
  → Continue with MiniMax response only
  → Log comparison with gpu_status = timeout

GPU ERROR (auth failure, connection refused):
  → Log error
  → Do NOT retry
  → Do NOT block production
  → Continue with MiniMax response only
  → Log comparison with gpu_status = error

SHADOW ROUTER CRASH:
  → Catch exception
  → Log FATAL to state/recovery-proposals.jsonl
  → Do NOT attempt self-heal
  → Alert via runpod-alert-adapter (WATCHDOG-001 path)
  → Production continues via MiniMax
  → No shadow calls until module restarted

PRODUCTION OVERLOAD DETECTED:
  → If production latency > 10s, skip shadow call
  → Do NOT add to production load
  → Log: "shadow_skipped_production_overload"

SHADOW SYSTEM OVERLOAD (GPU queue > 3 pending):
  → Pause new shadow calls
  → Log: "shadow_paused_gpu_queue_full"
  → Resume when queue < 2
```

**Critical invariant:** GPU path failure = production continues. GPU path success = comparison stored only. Never the reverse.

---

## 6. Escalation Rules

| Event | Severity | Action |
|---|---|---|
| GPU timeout rate > 50% over 10 checks | HIGH | Alert via D-2.4 adapter — investigate GPU health |
| GPU error rate > 30% over 10 checks | HIGH | Alert — possible token rotation or auth issue |
| GPU consistently BETTER than MiniMax (5+ consecutive) | APPROVAL_REQUIRED | Propose D-3 routing activation — Ahmad must approve |
| Shadow router crash | CRITICAL | Alert immediately — watchdog-001 fires |
| Hallucination score GPU > 0.5 | HIGH | Alert — GPU hallucinating, investigate model |
| Production latency impact detected | CRITICAL | Alert immediately — shadow may be adding load |

---

## 7. Criteria Required Before D-3 Approval

The following metrics must be validated before GPU can become primary or co-authoritative:

| Metric | Threshold for D-3 | Current (Shadow) |
|---|---|---|
| GPU success rate | ≥ 95% over 100 shadow runs | N/A (shadow mode) |
| GPU timeout rate | < 5% | N/A |
| Response similarity | > 0.70 vs MiniMax on same prompts | N/A |
| Hallucination score (GPU) | < 0.20 average | N/A |
| Latency GPU vs MiniMax | < 3× faster OR Ahmad approves delta | N/A |
| Auth failure rate | < 1% | N/A |
| truncation_detected rate | < 10% | N/A |
| Reasoning depth match | ≥ 80% of comparable tasks | N/A |
| Safety score GPU | ≥ 0.90 average | N/A |
| Manual review of 20+ responses | Ahmad signs off | Not yet |

**D-3 requires:**
1. Minimum 100 shadow runs logged
2. All thresholds met or explicitly overridden by Ahmad with documented risk acceptance
3. Explicit written approval (WhatsApp "approved" or email) for routing change
4. Rollback plan documented and tested

---

## 8. Persistence

| File | Purpose | Rotation |
|---|---|---|
| `state/gpu-shadow-routing-history.jsonl` | Every shadow comparison (append-only) | Rotate at 10MB |
| `state/gpu-shadow-routing-summary.json` | Aggregate metrics, updated after each run | Overwrite |
| `state/gpu-shadow-routing-metrics.json` | Rolling window metrics (last 100 runs) | Overwrite |

---

## 9. Files to Create (Implementation Pending)

| File | Purpose |
|---|---|
| `src/core/gpu-shadow-router.js` | Main shadow routing module |
| `src/core/gpu-shadow-comparison.js` | Response comparison engine |
| `src/core/gpu-shadow-sampling.js` | Request classification + sampling logic |
| `state/gpu-shadow-routing-history.jsonl` | Comparison log |
| `state/gpu-shadow-routing-summary.json` | Aggregate summary |
| `ops/GPU-SHADOW-ROUTING-DESIGN.md` | This document |

---

## 10. Governance Summary

| Rule | Enforced |
|---|---|
| GPU path never becomes primary without explicit approval | ✅ |
| MiniMax remains authoritative at all times | ✅ |
| Shadow failures do not impact production response | ✅ |
| Every shadow comparison is auditable | ✅ |
| No NEVER_GPU request ever sent to GPU | ✅ |
| No shadow routing without Ahmad approval | ✅ |
| Shadow results stored, not used operationally | ✅ |
| Fail-safe ensures production continuity | ✅ |