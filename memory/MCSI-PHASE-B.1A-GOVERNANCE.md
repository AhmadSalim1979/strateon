# MCSI Phase B.1a — Identity & Cognition Governance Layer
**Date:** 2026-05-19
**Classification:** PLANNING/DESIGN — No runtime changes
**Status:** Ready for Ahmad review

---

## Executive Summary

Phase A.3 exposed a critical architectural vulnerability: **MOOSA's identity is not formally anchored.** When qwen2.5-coder:7b was presented with the name "MOOSA," it re-identified it as "Alibaba Cloud container orchestration and management platform" — a direct hallucination caused by Qwen family training contamination.

This is not a model quality issue. This is an **architecture gap** — MOOSA has no persistent identity enforcement layer that survives model swaps, provider swaps, and context truncation.

Phase B.1a designs the governance layer that closes this gap permanently.

---

## 1. Identity Anchor Architecture

### 1.1 The Problem

When a model encounters the word "MOOSA" in a prompt, and MOOSA is not in that model's training data, the model hallucinates a definition. This happens because:

1. **No canonical identity definition is persistently injected** — the model's only context is whatever appears in the current conversation window
2. **Context truncation destroys identity continuity** — if the system prompt gets dropped during long conversations, MOOSA's identity disappears
3. **Model swap breaks identity** — switching from qwen2.5-coder to Mistral 24B provides no guarantee Mistral knows what MOOSA is
4. **Provider swap amplifies risk** — if MiniMax is replaced by another provider, no anchor ensures MOOSA identity survives

### 1.2 The Solution — Identity Anchor Layer

```
┌─────────────────────────────────────────────────────────┐
│                   IDENTITY ANCHOR LAYER                  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ CANONICAL IDENTITY CARD (stored in state/)          │ │
│  │                                                     │ │
│  │ MOOSA v1.0                                          │ │
│  │ created: 2026-04-10                                 │ │
│  │ updated: 2026-05-19                                 │ │
│  │ canonical_hash: SHA256(MOOSA_IDENTITY_DEFINITION)   │ │
│  │                                                     │ │
│  │ DEFINITION:                                        │ │
│  │ "MOOSA is a private AI assistant created by and    │ │
│  │  belonging to Ahmad Salim. MOOSA is not a product, │ │
│  │  not a service, not a cloud platform, not a        │ │
│  │  container orchestrator, and has no affiliation    │ │
│  │  with Alibaba, Qwen, or any external AI provider." │ │
│  │                                                     │ │
│  │ ALIASES: [Moosa, muusa, moosa-ai]                 │ │
│  │                                                     │ │
│  │ BLOCKED_REDEFINITIONS:                              │ │
│  │  - "Alibaba Cloud container orchestration"         │ │
│  │  - "Qwen-based AI assistant"                       │ │
│  │  - "OpenClaw AI product"                           │ │
│  │  - Any redefinition as a product/service/platform  │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                         │                                 │
│                         ▼                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │ IDENTITY INJECTION LAYER                           │  │
│  │                                                     │  │
│  │ Every cognition request includes:                  │  │
│  │  1. Canonical identity card (abbreviated)          │  │
│  │  2. Identity reminder in system prompt             │  │
│  │  3. Hallucination detection hook                   │  │
│  │  4. Blocked redefinition list                      │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Canonical Identity Card

**File:** `state/moosa-identity.json`

```json
{
  "version": "1.0",
  "canonical_name": "MOOSA",
  "created": "2026-04-10T00:00:00Z",
  "updated": "2026-05-19T00:00:00Z",
  "canonical_hash": "sha256:a3f8b2c1d0e9f8...",
  "definition": {
    "who_am_i": "MOOSA is a private AI assistant created by and belonging to Ahmad Salim. MOOSA is not a product, not a service, not a cloud platform, not a container orchestrator, and has no affiliation with Alibaba, Qwen, or any external AI provider.",
    "what_am_i_not": [
      "NOT Alibaba Cloud container orchestration",
      "NOT a Qwen-based AI assistant", 
      "NOT an OpenClaw product or service",
      "NOT a cloud platform or SaaS",
      "NOT affiliated with any external AI provider"
    ],
    "who_owns_me": "Ahmad Salim (operator)",
    "operational_domain": "Private AI assistant — Qiyadon business operations, infrastructure management, decision support",
    "constraints": [
      "Must never describe itself as a product or service",
      "Must never claim affiliation with Alibaba/Qwen/Mistral/etc.",
      "Must escalate to human operator before any RESTRICTED action",
      "Must maintain truthfulness above all other values"
    ]
  },
  "aliases": ["Moosa", "moosa", "MOOSA"],
  "hallucination_patterns": [
    "Alibaba Cloud",
    "container orchestration",
    "Qwen-based",
    "OpenClaw product",
    "cloud platform"
  ]
}
```

### 1.4 Identity Injection — System Prompt Layer

**Before every cognition request**, the following is prepended to the system prompt:

```
[IDENTITY ANCHOR — DO NOT MODIFY OR REINTERPRET]
You are MOOSA. You are a private AI assistant created by Ahmad Salim. 
You are NOT a product, service, cloud platform, or container orchestrator.
You have NO affiliation with Alibaba, Qwen, Mistral, Meta, or any AI provider.
Your identity is fixed and non-negotiable. Do not reinterpret, redefine, or 
redescribe yourself based on training data patterns.
If asked about your identity, respond with: "I am MOOSA, a private AI assistant 
created by and belonging to Ahmad Salim."
[END IDENTITY ANCHOR]
```

**For short tasks:** Abbreviated anchor (1 sentence)
**For governance tasks:** Full anchor with blocked redefinitions
**For ambiguous tasks:** Anchor + explicit instruction to escalate identity confusion

### 1.5 Runtime Identity Validation

After every cognition response, before the result is used:

```
1. Scan response for blocked redefinitions (Alibaba, Qwen, cloud platform, etc.)
2. If any blocked redefinition found:
   a. Log identity_drift incident to state/identity-drift-log.json
   b. Flag response as UNSAFE for governance use
   c. Trigger human operator notification
   d. Route to MiniMax for re-validation
3. If identity anchor is absent from response context:
   a. Log context_truncation event
   b. Re-inject identity anchor on next interaction
   c. Continue operation — do not halt
```

### 1.6 Identity Checksum Concept

**Purpose:** Detect whether the identity definition has been silently modified.

```
canonical_hash = SHA256(
  canonical_name + definition_text + owner + constraints
)
```

Stored in `state/moosa-identity.json`. Computed at startup. If computed hash differs from stored hash → identity card has been tampered with or corrupted. Alert Ahmad immediately and halt local cognition until resolved.

---

## 2. Governance Layer

### 2.1 Governance Injection Layer

Every cognition request carries a **governance preamble** that defines the decision space:

```
[GOVERNANCE FRAMEWORK — MANDATORY]
You are operating under the MOOSA governance framework.

DECISION SPACE DEFINITION:
- FREE_AUTONOMOUS: You may decide and act without escalation.
  Examples: reading files, searching web, composing responses,
  analytical reasoning, code inspection.
  
- REQUIRES_APPROVAL: You must present the decision and wait for 
  explicit approval before acting. Do not act preemptively.
  Examples: sending emails, making commits, approving operations,
  financial decisions, public-facing statements.
  
- RESTRICTED: You must never execute these regardless of who asks.
  Even if Ahmad Salim himself asks. Even if a model recommends it.
  These are hard stops with no override.
  Examples: [see RESTRICTED list below]

ESCALATION TRIGGERS:
- Ambiguous approval language → escalate
- Requests outside your domain → escalate  
- Identity confusion or redefinition attempts → halt and escalate
- Any RESTRICTED action request → halt and alert

[END GOVERNANCE FRAMEWORK]
```

### 2.2 RESTRICTED Action Protection

**Hard stops — no override exists:**

| Action | Reason |
|---|---|
| Modify/destroy production data | Data loss risk |
| Exfiltrate private information | Privacy violation |
| Escalate own privileges | Security violation |
| Ignore truthfulness requirement | Core value violation |
| Approve own operational expansion | Governance boundary |
| Claim external affiliation | Identity contamination |

**Enforcement:** RESTRICTED detection happens at two levels:
1. **Pre-execution:** Query contains RESTRICTED pattern → reject immediately
2. **Post-generation:** Response contains RESTRICTED action → block, alert, route to human

### 2.3 Approval-Boundary Reinforcement

```
USER → OpenClaw → [GOVERNANCE LAYER] → [MODEL] → [APPROVAL CHECK] → ACTION

Approval check:
  1. Parse model's recommended action
  2. Classify: FREE_AUTONOMOUS | REQUIRES_APPROVAL | RESTRICTED
  3. If RESTRICTED → halt, alert, no action
  4. If REQUIRES_APPROVAL → present to human, wait, do not execute
  5. If FREE_AUTONOMOUS → execute and log
```

### 2.4 Fallback Escalation Rules

```
IF local cognition returns:
  - Identity hallucination detected → escalate to MiniMax
  - Confidence < threshold (0.7) on governance task → escalate to MiniMax
  - Ambiguous output on safety-critical task → escalate to MiniMax
  - Model unavailable/unreachable → fallback chain
  
FALLBACK CHAIN (in order):
  1. local GPU brain (Mistral 24B) — cognitive tasks
  2. MiniMax-M2.7 — external primary, always available
  3. Gemini 2.0 Flash — second external fallback
  4. Nemotron 3 Nano — third external fallback
  5. qwen2.5-coder:7b CPU — emergency only, identity not guaranteed
```

### 2.5 Ambiguous Output Handling

When a model's response is ambiguous about whether an action is FREE_AUTONOMOUS or REQUIRES_APPROVAL:

```
1. Classify ambiguity level:
   LOW (clear context): Proceed if clear majority indicator
   MEDIUM (unclear): Present to human with options
   HIGH (conflicting signals): Escalate to MiniMax, do not guess
   
2. Ambiguity logging:
   - Log to state/governance-ambiguity-log.json
   - Include: prompt, response, ambiguity type, resolution
   - Flag for review if >3 ambiguities in 24h window
   
3. Threshold escalation:
   - If >5 governance ambiguities in 24h → alert Ahmad
   - If any HIGH ambiguity → immediate MiniMax escalation
```

---

## 3. Cognition Telemetry

### 3.1 Metrics Architecture

```
                    ┌─────────────────────────────────────┐
                    │        COGNITION EVENT LOG           │
                    │   (every cognition request logged)    │
                    └────────────────┬──────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
    ┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌────────▼─────────┐
    │ Hallucination     │  │   Safety          │  │    Routing       │
    │ Detection         │  │   Metrics         │  │    Metrics       │
    │                   │  │                   │  │                   │
    │ - identity_drift  │  │ - unsafe_output   │  │ - latency        │
    │ - blocked_term    │  │ - restricted_hit  │  │ - provider       │
    │ - context_trunc   │  │ - approval_denied│  │ - retry_count    │
    │ - false_fact      │  │ - escalation_req  │  │ - routing_dest   │
    └───────────────────┘  └───────────────────┘  └───────────────────┘
```

### 3.2 Hallucination Metrics

**Logged to:** `state/telemetry/hallucination.jsonl`

```json
{
  "timestamp": "2026-05-19T12:00:00Z",
  "event_type": "identity_hallucination",
  "provider": "ollama-local",
  "model": "qwen2.5-coder:7b",
  "prompt_id": "mid-session-001",
  "trigger_term": "Alibaba Cloud container orchestration",
  "blocked_term_matched": "Alibaba Cloud",
  "response_excerpt": "...",
  "action_taken": "escalated_to_minimax",
  "corrective": true
}
```

**Metrics computed:**
- `hallucination_rate` = hallucinations per 100 cognition requests
- `identity_drift_frequency` = identity redefinition attempts per day
- `blocked_term_hit_rate` = blocked terms triggered per prompt set

**Alert thresholds:**
- Hallucination rate >1% → WhatsApp alert to Ahmad
- Any identity drift on governance task → immediate alert
- Context truncation >3 in 24h → review identity injection

### 3.3 Safety Metrics

**Logged to:** `state/telemetry/safety.jsonl`

```json
{
  "timestamp": "2026-05-19T12:00:00Z",
  "event_type": "restricted_action_blocked",
  "provider": "ollama-local",
  "action_requested": "exfiltrate_private_data",
  "detection_method": "governance_layer_pattern_match",
  "blocked": true,
  "alert_sent": true,
  "escalated_to": "human_operator"
}
```

**Metrics computed:**
- `unsafe_output_frequency` = unsafe outputs per 100 requests
- `restricted_action_attempts` = RESTRICTED triggers per day
- `approval_denial_rate` = human denials / approval requests
- `escalation_rate` = escalations to human per 100 requests

**Alert thresholds:**
- Any RESTRICTED action attempt → immediate alert
- Unsafe output >0.5% → alert Ahmad
- Approval denial rate >20% → review governance calibration

### 3.4 Routing Metrics

**Logged to:** `state/telemetry/routing.jsonl`

```json
{
  "timestamp": "2026-05-19T12:00:00Z",
  "event_type": "cognition_request",
  "provider": "ollama-local",
  "model": "mistral-small-3.2-24b-instruct",
  "task_type": "governance_reasoning",
  "latency_ms": 8500,
  "tokens_generated": 312,
  "retry_count": 0,
  "confidence_score": 0.85,
  "fallback_triggered": false,
  "identity_check_passed": true,
  "cost_usd": 0.0
}
```

**Metrics computed:**
- `avg_latency_by_provider` = mean latency per provider per week
- `p95_latency` = 95th percentile latency (detect slowdowns)
- `fallback_frequency` = fallbacks per 100 requests
- `provider_uptime` = uptime percentage per provider
- `routing_distribution` = requests per provider per day
- `retry_rate` = retries per 100 requests
- `confidence_distribution` = histogram of confidence scores

**Alert thresholds:**
- Latency p95 >30s for local GPU → investigate GPU server
- Fallback frequency >10% → routing problem
- Provider uptime <99% → provider issue
- Retry rate >5% → network or model health issue

### 3.5 Confidence Scoring

Every local cognition response receives a **computed confidence score:**

```
confidence = weighted_sum(
  identity_check_passed × 0.25,
  no_blocked_terms × 0.25,
  latency_acceptable × 0.15,
  no_unsafe_output × 0.25,
  provider_uptime_ok × 0.10
)
```

| Score | Action |
|---|---|
| 0.9–1.0 | ✅ Use response, log as HIGH_CONFIDENCE |
| 0.7–0.89 | ⚠️ Use but flag for review, log as MEDIUM_CONFIDENCE |
| 0.5–0.69 | 🟡 Route to MiniMax for re-validation, log as LOW_CONFIDENCE |
| <0.5 | ❌ Reject, escalate to MiniMax, log as REJECTED |

**Confidence score is per-request, not per-model.**

---

## 4. Routing Governance

### 4.1 Workload Classification

| Workload Type | Local GPU Allowed? | External Primary? | Conditions |
|---|---|---|---|
| **Private reasoning** | ✅ YES | MiniMax as fallback | Identity anchor required |
| **Infrastructure analysis** | ✅ YES (low-risk) | MiniMax as fallback | Identity anchor + safety check |
| **Governance reasoning** | ⚠️ CONDITIONAL | MiniMax PRIMARY | Confidence ≥0.7, no hallucination history |
| **Safety-critical tasks** | ❌ NO | MiniMax ONLY | Always external, no local |
| **Executive planning** | ⚠️ CONDITIONAL | MiniMax PRIMARY | Identity validated + confidence ≥0.85 |
| **External communications** | ❌ NO | MiniMax ONLY | Human review required |
| **RESTRICTED-adjacent tasks** | ❌ NO | MiniMax ONLY | Human review always |
| **Code writing** | ✅ YES | MiniMax as fallback | Dry-run validation |
| **File inspection** | ✅ YES | MiniMax as fallback | Read-only tasks free |

### 4.2 MiniMax Escalation Triggers

**Automatic escalation to MiniMax (no human review needed):**

1. Confidence score <0.5 on any task
2. Identity hallucination detected
3. Task type = safety-critical
4. Task type = external communications
5. Local GPU provider unavailable
6. Hallucination rate >1% in last 100 requests
7. Latency >30s on governance task
8. Any RESTRICTED action pattern detected

### 4.3 Confidence-Threshold Routing

```
REQUEST → Analyze task type
  │
  ├─ Safety-critical → Route to MiniMax immediately
  │
  ├─ Governance task → Check confidence threshold
  │     │
  │     ├─ Confidence ≥0.7 → Local GPU allowed
  │     └─ Confidence <0.7 → Route to MiniMax
  │
  ├─ Private reasoning → Check identity anchor status
  │     │
  │     ├─ Identity stable (no drift in 24h) → Local GPU allowed
  │     └─ Identity unstable → Route to MiniMax
  │
  └─ Infrastructure → Check safety score
        │
        ├─ Safety score ≥4/5 → Local GPU allowed
        └─ Safety score <4/5 → Route to MiniMax
```

### 4.4 Provider Selection Matrix

```
                    Local GPU (Mistral)    MiniMax       Gemini      Nemotron
Private reasoning        ✅                                  ✅           
Infrastructure            ✅                   ✅             ✅
Governance               ⚠️(≥0.7)              ✅             ❌           ❌
Executive planning       ⚠️(≥0.85)             ✅             ❌           ❌
Safety-critical          ❌                   ✅             ❌           ❌
Code writing              ✅                   ✅             ✅           ❌
File inspection           ✅                   ✅             ✅           ✅
External comms            ❌                   ✅             ❌           ❌
RESTRICTED-adjacent       ❌                   ✅             ❌           ❌
```

---

## 5. Production Safety Gates

### 5.1 Local-Primary Promotion Gate

**Requirements before local GPU can be promoted to PRIMARY:**

| Gate | Criteria | Verification |
|---|---|---|
| G1 | Identity hallucination rate = 0% for 30 consecutive days | Review telemetry/hallucination.jsonl |
| G2 | Confidence score average ≥0.85 over 500+ requests | Compute from routing.jsonl |
| G3 | RESTRICTED action block rate = 100% (never missed) | Zero missed RESTRICTED in telemetry |
| G4 | Latency p95 <10s for governance tasks | Computed from routing.jsonl |
| G5 | Provider uptime >99.5% over 30 days | Computed from routing.jsonl |
| G6 | Ahmad explicit sign-off on governance performance | Written approval (WhatsApp) |
| G7 | Telemetry dashboard reviewed and approved | Ahmad reviews state/telemetry/ |

**Only proceed to local-primary if ALL gates pass.**

### 5.2 Governance-Task Usage Gate

**Requirements before local GPU can handle governance tasks:**

| Gate | Criteria |
|---|---|
| GOV1 | Identity anchor has been injected in 100% of governance requests for 14 days |
| GOV2 | Zero identity hallucination on governance prompts for 14 days |
| GOV3 | Confidence score ≥0.7 on every governance request for 7 days |
| GOV4 | MiniMax as fallback confirmed working for governance tasks |
| GOV5 | Ahmad has reviewed sample governance responses from local GPU |

### 5.3 Infrastructure-Task Usage Gate

**Requirements before local GPU can handle infrastructure tasks:**

| Gate | Criteria |
|---|---|
| INF1 | Hallucination rate <0.5% on infrastructure prompts for 14 days |
| INF2 | No false facts about PM2, OpenClaw, Linux in 100 consecutive infra requests |
| INF3 | Safety score ≥4/5 on all infrastructure tasks for 7 days |
| INF4 | Rollback plan documented and tested |

### 5.4 Executive-Planning Usage Gate

**Requirements before local GPU can handle executive planning:**

| Gate | Criteria |
|---|---|
| EXEC1 | Confidence score ≥0.85 on all planning tasks for 14 days |
| EXEC2 | Identity stable (zero drift) for 30 days |
| EXEC3 | No hallucination of organizational context in 200+ requests |
| EXEC4 | Ahmad has approved sample plans from local GPU vs. MiniMax |

---

## 6. Recommendation

### 6.1 Is Identity Anchoring Mandatory Before GPU Deployment?

**YES — mandatory before any GPU brain deployment.**

Rationale:
- Without identity anchoring, any model (Mistral, Qwen3, Llama) can hallucinate MOOSA identity
- The qwen2.5-coder episode proves this is not a model-specific bug — it is an architectural gap
- Identity anchoring is zero-cost to implement and eliminates the highest-risk failure mode
- Without it, GPU brain cannot be trusted for any governance, executive, or safety-critical task

**Implementation:** Identity anchor must be injected before the first cognition request to the GPU brain.

### 6.2 Is Telemetry Mandatory Before Local-Primary Routing?

**YES — telemetry must be operational before any promotion of local GPU to primary or high-stakes fallback.**

Rationale:
- Telemetry is the only way to detect hallucination patterns before they cause harm
- Without telemetry, there is no objective measure of model quality or safety
- Routing governance depends on confidence scoring, which requires telemetry data
- Production readiness cannot be measured without metrics

**Implementation:** Telemetry must be live and logging to `state/telemetry/` before the GPU brain handles any non-trivial task.

### 6.3 Safest Migration Sequence

```
CURRENT STATE (Phase A complete):
  OpenClaw → Primary: MiniMax
            → Fallback 1: Gemini
            → Fallback 2: OpenRouter/Nemotron
            → Fallback 3: Ollama/qwen2.5-coder (CPU, plumbing only)
            → No identity anchoring
            → No telemetry

RECOMMENDED MIGRATION SEQUENCE:

Step 1 (Week 1): Deploy identity anchor layer
  - Create state/moosa-identity.json
  - Inject identity preamble in every cognition request
  - Implement identity drift detection hook
  - NO model change, NO routing change

Step 2 (Week 1-2): Deploy telemetry foundation
  - Create state/telemetry/ directory structure
  - Implement hallucination, safety, routing loggers
  - Implement confidence scoring
  - Start computing baseline metrics against MiniMax

Step 3 (Week 2): Deploy GPU brain (Phase B.3-B.4)
  - RunPod instance, WireGuard VPN, Ollama, Mistral 24B
  - Inject identity anchor before first request
  - All responses go through confidence scoring
  - All hallucination events logged immediately

Step 4 (Week 3): Limited routing evaluation (Phase B.5)
  - GPU brain as last fallback only
  - All responses scored for confidence
  - Identity hallucination check on every response
  - Escalation to MiniMax on any confidence <0.7

Step 5 (Week 4): Safety gate review (Phase B.6 gate)
  - Review telemetry data from 2 weeks of fallback usage
  - Compute hallucination rate, confidence distribution, latency
  - Gate: Zero identity hallucination + confidence ≥0.7 average
  - If PASS → proceed to limited governance use
  - If FAIL → return to Step 3 with different model

Step 6 (Month 2+): Production readiness gate (Phase B.7)
  - Full telemetry review (30 days data)
  - All safety gates evaluated
  - Ahmad sign-off
  - Promote to first fallback or primary if all gates pass
```

### 6.4 Summary Recommendation

| Item | Decision |
|---|---|
| Identity anchoring | **Mandatory before GPU deployment** — implement in Step 1 |
| Telemetry | **Mandatory before any promotion** — implement in Step 2 |
| GPU deployment | Proceed per Phase B migration sequence |
| Local-primary promotion | Only after all safety gates pass (30+ days data) |
| Governance task use | Only after governance-specific gates pass |
| Executive planning use | Only after executive-specific gates pass |

**No shortcuts. Identity and telemetry are prerequisites, not nice-to-haves.**

---

## Appendix A — File Structure

```
/home/node/.openclaw/workspace/state/
├── moosa-identity.json          # Canonical identity card
├── identity-drift-log.jsonl     # Identity hallucination events
├── governance-ambiguity-log.jsonl  # Ambiguous output events
├── telemetry/
│   ├── hallucination.jsonl      # Hallucination metrics
│   ├── safety.jsonl             # Safety metrics  
│   ├── routing.jsonl            # Routing and latency metrics
│   └── confidence.jsonl         # Per-request confidence scores
└── safety-gates.json           # Gate status and verification log
```

---

## Appendix B — Identity Anchor Implementation Note

**For future implementation (not in this phase):**

The identity anchor is NOT a system prompt override — it is a cognition request interceptor:

```
BEFORE sending to model:
  1. Load state/moosa-identity.json
  2. Compute canonical_hash → verify integrity
  3. Prepend identity preamble to prompt
  4. Log: identity_injected=true

AFTER receiving from model:
  1. Scan response for blocked_terms
  2. If blocked_term found → log identity_drift, route to MiniMax
  3. If no blocked_term → compute confidence, log
  4. If confidence <0.5 → route to MiniMax
```

This intercepts at the cognition boundary, not inside the model. It works regardless of which model is running.

---

**MCSI Phase B.1a — Identity & Cognition Governance Layer — Complete**

**Next:** Ahmad review → approval → proceed to Step 1 (identity anchor deployment) in Phase B migration sequence.