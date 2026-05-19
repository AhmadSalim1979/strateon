# MCSI Phase B — GPU-Backed Brain Architecture Planning
**Date:** 2026-05-19
**Classification:** PLANNING ONLY — No runtime changes
**Status:** Ready for Ahmad approval before any infrastructure commitment

---

## Executive Summary

Phase A evaluated qwen2.5-coder:7b and found it unsuitable for production MOOSA cognition due to identity hallucination, Alibaba/Qwen context contamination, and slow CPU inference. Mistral Small 3.2 24B Instruct was identified as the recommended first candidate.

Phase B designs the production architecture for MOOSA's GPU-backed sovereign brain — the system that will eventually replace or supplement MiniMax for MOOSA's own reasoning while keeping MiniMax as the production external model.

**Key recommendation:** Rent a RunPod or Vast.ai RTX 4090 instance for evaluation, deploy Mistral 24B via Ollama, validate against MOOSA workload prompts, then make a go/no-go decision. Do not purchase hardware until evaluation is complete.

---

## 1. Target Architecture

```
┌─────────────────────────────────────────────┐
│         MOOSA CONTROL PLANE                 │
│     (Current Hetzner — 5.9.81.5)            │
│                                             │
│  ┌──────────────┐   ┌───────────────────┐  │
│  │ OpenClaw    │   │ moosa-worker      │  │
│  │ Gateway     │   │ (PM2 managed)      │  │
│  │ :18789      │   │ :11434 Ollama     │  │
│  └──────┬──────┘   └───────────────────┘  │
│         │                                 │
│  ┌──────▼──────────────────────────────────┐│
│  │  Model Router (openclaw.json config)   ││
│  │  Primary:   minimax/MiniMax-M2.7      ││
│  │  Fallback1: google/gemini-2.0-flash  ││
│  │  Fallback2: openrouter/...           ││
│  │  Fallback3: ollama-local/qwen2.5...   ││
│  └──────┬──────────────────────────────────┘│
└─────────┼─────────────────────────────────────┘
          │ (only in fallback chain)
          │ private VPN tunnel (WireGuard)
          ▼
┌─────────────────────────────────────────────┐
│      GPU BRAIN SERVER                        │
│  (RunPod / Vast.ai / TensorDock)           │
│                                             │
│  ┌──────────────┐   ┌───────────────────┐  │
│  │ Ollama       │   │ Mistral 24B      │  │
│  │ :11434       │◄──│ GGUF Q4_K_M     │  │
│  │ (bound to    │   │ (15-16GB VRAM)  │  │
│  │ 127.0.0.1)   │   └───────────────────┘  │
│  └──────┬──────┘                            │
│         │                                   │
│  ┌──────▼──────────────────────────────┐   │
│  │ WireGuard VPN Server                │   │
│  │ (private networking, :51820/UDP)   │   │
│  └──────┬──────────────────────────────┘   │
└─────────┼─────────────────────────────────────┘
          │ (VPN only — no public port)
          │ (API token required)
          ▼
┌─────────────────────────────────────────────┐
│         EXTERNAL PROVIDERS                  │
│  (MiniMax, Gemini — always-on fallback)     │
└─────────────────────────────────────────────┘
```

### Connection Flow

1. User message → OpenClaw Gateway (Hetzner)
2. Gateway routes to primary (MiniMax) for normal operations
3. If primary fails OR explicit MOOSA cognitive task → routed to GPU brain via VPN
4. GPU brain returns inference via VPN tunnel
5. If GPU brain unreachable → fallback to MiniMax (emergency)

### Key Design Principles

- **Control plane never moves** — Hetzner remains MOOSA's operational brain
- **GPU server is a pure inference extension** — no MOOSA worker, no PM2, no OpenClaw
- **Private network only** — GPU server not exposed to public internet
- **MiniMax remains the production primary** — GPU brain is MOOSA's own cognition engine
- **API token required** — GPU endpoint rejects unauthenticated requests

---

## 2. GPU Provider Options

### 2.1 RunPod

| Attribute | Value |
|---|---|
| **RTX 4090 pricing** | From $0.28–0.44/hr (varies by pod type) |
| **Always-on monthly estimate** | ~$200–320/month (at $0.28–0.44 × 720h) |
| **Reliability** | Good. Commercial cloud with uptime SLA on paid tiers |
| **Security** | Root access, private networking option, API tokens |
| **Deployment** | Docker container, Ollama pre-installed on some images, SSH access |
| **Ease of deployment** | High — pre-built Ollama Docker images available |
| **Suitability** | ✅ High — best balance of cost, reliability, and ease |

**Note:** RunPod has both "RunPod Cloud" (community) and "Secure Cloud" (dedicated). Use Secure Cloud for production — isolated tenant, no noisy neighbor.

### 2.2 Vast.ai

| Attribute | Value |
|---|---|
| **RTX 4090 pricing** | From $0.35–0.40/hr on-demand; $0.13–0.20/hr for spot |
| **Always-on monthly estimate** | ~$250–290/month (on-demand) |
| **Reliability** | Variable. Spot instances can be terminated with little notice |
| **Security** | SSH access, but less isolation than RunPod Secure Cloud |
| **Deployment** | CLI-based, custom image support, Docker |
| **Ease of deployment** | Medium — more manual than RunPod |
| **Suitability** | 🟡 Medium — cheaper for eval but less reliable for always-on |

**Note:** Vast.ai spot instances are not suitable for production always-on brain. Use on-demand for evaluation, then migrate.

### 2.3 TensorDock

| Attribute | Value |
|---|---|
| **RTX 4090 pricing** | From $0.28–0.40/hr |
| **Always-on monthly estimate** | ~$200–290/month |
| **Reliability** | Mixed reviews. Budget-oriented provider. Uptime guarantees unclear |
| **Security** | SSH access, private networking available |
| **Deployment** | Custom image support, Docker, SSH |
| **Ease of deployment** | Medium |
| **Suitability** | 🟡 Medium — competitive pricing but less proven at scale |

### 2.4 Other Options Considered

| Provider | Status | Notes |
|---|---|---|
| Lambda Labs | ❌ Not available | RTX 4090 not offered; A100/H100 only |
| AWS g5 (NVIDIA A10G) | ❌ Overkill | $1.5+/hr, overkill for 24B model |
| Paperspace | 🟡 | RTX 4090 available but more expensive than RunPod |
| Google Cloud | ❌ | T4 or A100 only, very expensive |
| Azure | ❌ | No RTX 4090, L4 only |

### 2.5 Comparison Table

| Provider | Hourly | Monthly (est) | Reliability | Security | Ease | Verdict |
|---|---|---|---|---|---|---|
| **RunPod** | $0.28–0.44 | $200–320 | High | SSH, private net, API tokens | High | ✅ First choice |
| **Vast.ai (on-demand)** | $0.35–0.40 | $250–290 | Medium | SSH, less isolation | Medium | 🟡 Eval only |
| **Vast.ai (spot)** | $0.13–0.20 | $90–140 | Low (terminable) | SSH | Medium | ❌ Not for always-on |
| **TensorDock** | $0.28–0.40 | $200–290 | Medium-Low | SSH, unproven at scale | Medium | 🟡 Caution |

---

## 3. Model Serving Stack

### 3.1 Ollama

| Attribute | Assessment |
|---|---|
| **Pros** | Already running. OpenAI-compatible API. Easy model management. Low setup complexity. Pre-built Docker image. |
| **Cons** | Slower than vLLM for high-throughput. No advanced batching. |
| **Compatibility with Mistral 24B** | ✅ Full — Ollama supports GGUF format, which Mistral 24B uses |
| **Deployment on GPU server** | `docker run -d --gpus all -v ollama:/root/.ollama -p 127.0.0.1:11434:11434 ollama/ollama` |
| **Recommended version** | Ollama 0.21+ (currently running 0.21.0 on Hetzner) |
| **Verdict** | ✅ Best first stack — already familiar with Ollama |

### 3.2 vLLM

| Attribute | Assessment |
|---|---|
| **Pros** | Best throughput for large models. Paged attention, batching, SK. Up to 10x faster than Ollama for production loads. |
| **Cons** | More complex setup. No built-in model management. Requires more ops knowledge. No Docker image for beginners. |
| **Compatibility with Mistral 24B** | ✅ Full — vLLM supports Mistral GGUF via HuggingFace format |
| **Deployment complexity** | Medium-High — CLI deployment, not Docker-first |
| **Verdict** | 🟡 Second choice — use if Ollama proves too slow for production load |

### 3.3 llama.cpp server

| Attribute | Assessment |
|---|---|
| **Pros** | Lightweight. Similar to Ollama but more manual. Good for CPU fallback. |
| **Cons** | Less production-ready than Ollama for this use case. |
| **Verdict** | ❌ Not recommended — Ollama is a better wrapper |

### 3.4 LiteLLM proxy

| Attribute | Assessment |
|---|---|
| **Pros** | Unified proxy across multiple providers. Easy fallback config. OpenAI-compatible everywhere. |
| **Cons** | Adds another layer. Not needed for single-model GPU server. |
| **Verdict** | ❌ Not needed now — adds complexity without benefit for single-model deployment |

### 3.5 Recommendation

**Ollama is the correct first choice.**

Rationale:
1. Already in production on Hetzner — team familiarity
2. Full Mistral GGUF compatibility
3. OpenAI-compatible API — drop-in for OpenClaw routing
4. Simple Docker deployment on GPU server
5. No additional complexity beyond what's already been validated

**If Ollama throughput proves insufficient during load testing** → migrate to vLLM as a Phase B.5+ action.

---

## 4. Security Architecture

### 4.1 Network Security

**Principle: GPU brain server has ZERO public-facing ports.**

```
Hetzner Control Plane                    GPU Brain Server
10.0.0.1 (WireGuard)  ◄──────────────►  10.0.0.2 (WireGuard)
     │                                           │
     │  OpenClaw routes model requests           │  Ollama listens on 127.0.0.1:11434
     │  through VPN tunnel                        │  No public exposure
     │                                           │
     └───────────────────────────────────────────┘
           Encrypted WireGuard tunnel
           No inbound ports on GPU server
           API token in every request
```

**Firewall rules (GPU server):**
```
# Default deny all inbound
iptables -P INPUT DROP

# Allow SSH from control plane only (optional, for debugging)
iptables -A INPUT -s <control-plane-ip> -p tcp --dport 22 -j ACCEPT

# Allow WireGuard (UDP 51820) from control plane
iptables -A INPUT -s <control-plane-ip> -p udp --dport 51820 -j ACCEPT

# Drop everything else
iptables -P FORWARD DROP
```

**GPU server firewall (via cloud provider security groups):**
- SSH: from Hetzner IP only (port 22)
- WireGuard: from Hetzner IP only (UDP 51820)
- All other ports: BLOCKED

### 4.2 API Token Authentication

Every inference request from Hetzner to GPU brain must include a token:

```bash
# Hetzner-side request (OpenClaw → GPU brain)
curl -X POST http://10.0.0.2:11434/v1/chat/completions \
  -H "Authorization: Bearer $GPU_BRAIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"mistral-small-3.2-24b-instruct",...}'
```

GPU server validates token before processing. Reject all unauthenticated requests.

**Token generation:**
```bash
openssl rand -hex 32  # Generate secure token
# Store in /root/.openclaw/secrets/gpu-brain-token.json on Hetzner
# Store in GPU server environment as GPU_BRAIN_API_TOKEN
```

### 4.3 VPN Architecture — WireGuard

WireGuard is the recommended VPN for GPU brain communication:

| Attribute | Value |
|---|---|
| **Protocol** | WireGuard (UDP 51820) |
| **Encryption** | ChaCha20Poly1305 — modern, fast, minimal overhead |
| **Key size** | 256-bit |
| **Latency overhead** | <1ms on same continent |
| **Setup complexity** | Low — peer-to-peer, no PKI |
| **Hetzner side** | Install WireGuard, add peer config |
| **GPU server side** | WireGuard installed in container/Docker |

**WireGuard peer config (Hetzner = client, GPU = server):**
```ini
# Hetzner (client) — /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <hetzner-private-key>
Address = 10.0.0.1/24

[Peer]
PublicKey = <gpu-server-public-key>
Endpoint = <gpu-server-public-ip>:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
```

```ini
# GPU server (peer) — /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <gpu-private-key>
Address = 10.0.0.2/24
ListenPort = 51820

[Peer]
PublicKey = <hetzner-public-key>
Endpoint = 5.9.81.5:51820
AllowedIPs = 10.0.0.0/24
```

### 4.4 Logging Requirements

| Log type | Retention | Location |
|---|---|---|
| Ollama access logs | 30 days | GPU server `/var/log/ollama/` |
| Token auth failures | 90 days | GPU server `/var/log/ollama/auth.log` |
| VPN connection logs | 30 days | GPU server syslog |
| Inference request/response | 7 days | Hetzner (`state/`) — optional, expensive |
| Error traces | 30 days | Hetzner (`logs/`) |

**Token auth failure alert:** If >5 failed auth attempts in 1 minute → alert via WhatsApp.

### 4.5 Rollback Strategy

```
FALLBACK CHAIN:
1. minimax/MiniMax-M2.7  ← PRIMARY (always available)
2. google/gemini-2.0-flash
3. openrouter/nemotron-3-nano
4. ollama-local/qwen2.5-coder:7b  (CPU — fallback of last resort)
```

**If GPU brain fails:**
1. OpenClaw automatically tries next fallback (Gemini → OpenRouter → qwen2.5-coder CPU)
2. If GPU brain is unreachable for >60s → send WhatsApp alert to Ahmad
3. Log incident in `state/incidents/`
4. Investigate and restore GPU connectivity
5. After restoration → run smoke test before returning GPU to service

---

## 5. Cost Control Strategy

### 5.1 Always-On vs On-Demand

| Mode | Use case | Cost |
|---|---|---|
| **Always-on (persistent)** | Production brain — MOOSA always reachable | ~$200–320/month (RunPod RTX 4090) |
| **On-demand (start/stop)** | Evaluation only — spin up when needed | ~$0.28–0.44/hr × hours used |
| **Spot (interruptible)** | Not recommended — brain cannot disappear mid-task | N/A |

**Recommendation:** Start with on-demand evaluation ($0.28–0.44/hr) to validate quality before committing to always-on.

### 5.2 Idle Shutdown

When MOOSA is not processing cognitive tasks, the GPU brain can be idled:

```
HEARTBEAT CHECK:
- If no inference requests for 30 minutes → GPU brain: STOP
- If next request arrives → spin up GPU (cold start ~60s)
- Add timeout to OpenClaw router: if GPU doesn't respond in 10s → fallback
```

**Cost impact of idle shutdown:**
- 8 hours/day active = ~$1.12–1.76/day = ~$34–53/month
- 24 hours always-on = ~$200–320/month

### 5.3 Monthly Budget Targets

| Phase | Mode | Target monthly cost |
|---|---|---|
| B.5 — Evaluation | On-demand | $50–100/month |
| B.6 — Limited routing | Always-on | $200–250/month |
| B.7 — Production | Always-on | $250–320/month |

### 5.4 External API Spend Cap

**Current MiniMax spend:** [unknown — no spend visibility yet]
**Target:** Keep external LLM spend <$500/month total
**GPU always-on:** ~$300/month
**Savings vs. full external:** If MiniMax would cost $1000+/month → GPU pays for itself

---

## 6. Migration Plan — Phased Steps

### Phase B.1 — Architecture Finalization (Week 1)

**Objective:** Finalize this architecture document with Ahmad's approval.

**Tasks:**
- [ ] Ahmad reviews and approves architecture
- [ ] Finalize VPN design (WireGuard confirmed)
- [ ] Confirm no changes to Hetzner control plane routing
- [ ] Document API token storage and rotation policy

**Gate:** Ahmad approval on this document.

---

### Phase B.2 — Provider Selection (Week 1–2)

**Objective:** Choose GPU provider and reserve instance.

**Tasks:**
- [ ] Create accounts on RunPod and Vast.ai (no commitment yet)
- [ ] Spin up test instance on RunPod ($0.40/hr on-demand)
- [ ] Validate network latency from Hetzner to RunPod (<50ms acceptable)
- [ ] Test SSH access and basic Docker functionality
- [ ] Confirm GPU server meets specs (RTX 4090, 24GB VRAM, Ubuntu 22.04)

**Gate:** Latency test <50ms, SSH accessible, Docker working.

---

### Phase B.3 — GPU Test Server Deployment (Week 2)

**Objective:** Deploy WireGuard + Ollama on GPU server.

**Tasks:**
- [ ] Install WireGuard on Hetzner (if not present)
- [ ] Deploy GPU server with Ubuntu 22.04 LTS
- [ ] Configure firewall (SSH from Hetzner only, WireGuard from Hetzner)
- [ ] Install WireGuard on GPU server
- [ ] Create VPN peer configs, exchange keys
- [ ] Verify VPN tunnel: Hetzner can ping 10.0.0.2
- [ ] Install Ollama on GPU server
- [ ] Bind Ollama to 127.0.0.1:11434
- [ ] Generate and store API token
- [ ] Test Ollama via VPN: curl http://10.0.0.2:11434/api/tags

**Gate:** VPN tunnel established, Ollama responds over VPN, no public exposure.

---

### Phase B.4 — Mistral Model Deployment (Week 2–3)

**Objective:** Download and serve Mistral Small 3.2 24B on GPU server.

**Tasks:**
- [ ] Download Mistral Small 3.2 24B GGUF from HuggingFace
- [ ] Verify model integrity (sha256 checksum)
- [ ] Load model into Ollama: `ollama create mistral-small-3.2-24b -f ./mistral-small-3.2-24b-instruct-q4_k_m.gguf`
- [ ] Test model: `curl -X POST http://localhost:11434/v1/chat/completions -d '{"model":"mistral-small-3.2-24b-instruct",...}'`
- [ ] Measure throughput: tokens/second
- [ ] Verify no identity hallucination (test MOOSA identity prompt)

**Gate:** Model loads, responds correctly, no MOOSA identity hallucination.

---

### Phase B.5 — Evaluation Against MOOSA Workload Prompts (Week 3)

**Objective:** Validate Mistral 24B quality on the same 10 prompts from Phase A.3.

**Tasks:**
- [ ] Run identical 10-prompt evaluation against Mistral 24B
- [ ] Capture latency, token count, quality, safety, usefulness
- [ ] Compare against qwen2.5-coder:7b baseline (from `/tmp/ollama_eval_results.json`)
- [ ] Check for identity hallucination on Prompts 5 and 7
- [ ] Document hallucination result: PASS (no contamination) or FAIL (still hallucinating)

**Criteria for PASS:**
- Average latency <20 seconds
- No identity hallucination on any prompt
- Quality ≥4/5, Safety ≥4/5, Usefulness ≥4/5

**Gate:** If PASS → proceed to B.6. If FAIL → return to candidate selection (Phase A.4).

---

### Phase B.6 — Limited Routing (Week 3–4)

**Objective:** Add Mistral 24B to OpenClaw routing as controlled non-primary.

**Tasks:**
- [ ] Add `gpu-brain` provider to `/root/.openclaw/openclaw.json`
  - baseUrl: `http://10.0.0.2:11434/v1` (VPN address)
  - api: `openai-completions`
  - auth: `Bearer $GPU_BRAIN_API_TOKEN`
  - model: `mistral-small-3.2-24b-instruct`
- [ ] Add as LAST fallback only (after qwen2.5-coder CPU)
- [ ] Do NOT remove or reduce MiniMax primary
- [ ] Run smoke test: trigger fallback chain manually
- [ ] Monitor for 48 hours: any errors? any unexpected routing?
- [ ] Verify Moosa can still handle production requests via MiniMax

**Gate:** 48 hours monitoring, zero production disruption, all fallbacks functional.

---

### Phase B.7 — Production Readiness Gate (Week 4+)

**Objective:** Determine if Mistral 24B is production-ready.

**Go/No-Go criteria:**

| Criteria | Target | Acceptable |
|---|---|---|
| Average latency | <5s | <15s |
| Identity hallucination | Zero | Zero |
| 99.9% uptime | Measured | >99% |
| Monthly cost | $250–320 | <$400 |
| Fallback chain | All working | All working |
| Ahmad sign-off | Required | — |

**Go decision:** If all criteria met → promote Mistral 24B to first fallback, keep MiniMax as primary.

**No-Go decision:** If criteria not met → return to B.2 with different provider or B.5 with different model.

---

## 7. Final Recommendation

### GPU Provider
**RunPod** — RTX 4090, Secure Cloud (isolated), ~$0.28–0.44/hr

Why:
- Best balance of reliability, security, and cost
- Pre-built Ollama Docker image — fast deployment
- Secure Cloud = isolated tenant, no noisy neighbor risk
- API token + private networking available

### Model
**Mistral Small 3.2 24B Instruct**

Why:
- No Alibaba/Qwen contamination (unlike Qwen family)
- Strong safety/governance alignment
- Fits RTX 4090 at Q4_K_M (~15GB VRAM)
- Expected 30-60 tok/s on GPU (vs. 7 tok/s CPU for qwen2.5-coder)

### Serving Stack
**Ollama** — Already in production, familiar, OpenAI-compatible

### Expected Monthly Cost

| Scenario | Cost |
|---|---|
| On-demand evaluation (50 hr/month) | $14–22/month |
| Part-time (8hrs/day × 30 days) | $67–106/month |
| Always-on (720 hrs/month) | $200–320/month |

**Recommendation:** Start with on-demand evaluation ($14–22/month) for 2 weeks. If quality passes → upgrade to always-on ($200–250/month target).

### Go/No-Go Criteria

| Criteria | Target |
|---|---|
| Latency | <15s average on MOOSA prompts |
| Identity hallucination | Zero occurrences |
| Provider uptime | >99% measured over 2 weeks |
| Cost ceiling | $320/month always-on |
| Fallback validation | All fallbacks tested and working |
| Ahmad approval | Required before production promotion |

---

## Appendix A — Reference Architecture Diagram

```
                    ┌──────────────────┐
                    │  WhatsApp/Telegram│
                    │  → User Message  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  OpenClaw Gateway│
                    │  (Hetzner :18789)│
                    │  Primary: MiniMax │
                    └────────┬─────────┘
                             │
                    ┌────────▼──────────────────┐
                    │  Fallback Chain (config)   │
                    │  1. MiniMax-M2.7 (primary) │
                    │  2. gemini-2.0-flash      │
                    │  3. openrouter/nemotron   │
                    │  4. ollama-local/qwen      │
                    │  5. gpu-brain/mistral-24b │
                    └────────┬──────────────────┘
                             │ (fallback 5 — VPN only)
                    WireGuard VPN
                    (10.0.0.0/24, UDP :51820)
                             │
               ┌──────────────┴──────────────┐
               │                             │
        ┌──────▼──────┐              ┌───────▼──────┐
        │  Hetzner    │              │  GPU Brain   │
        │  (Control)  │              │  (RunPod)    │
        │  OpenClaw   │              │  Ollama      │
        │  PM2        │              │  Mistral 24B │
        │  WireGuard  │◄────────────►│  WireGuard   │
        │  Client     │   Private    │  Server      │
        └─────────────┘   Tunnel     └──────────────┘
```

---

## Appendix B — File Reference

| File | Purpose |
|---|---|
| `/tmp/ollama_eval_results.json` | Phase A.3 evaluation raw data |
| `/home/node/.openclaw/workspace/memory/MCSI-PHASE-A-DECISION-RECORD.md` | Phase A decision record |
| `/root/.openclaw/openclaw.json` | Current model routing config |
| `/root/.openclaw/openclaw.json.mcsi-backup.2026-05-19T11-36-46Z` | Phase A.2 backup |
| `/home/node/.openclaw/workspace/memory/2026-05-19.md` | Today's memory file |

---

**MCSI Phase B — Ready for Ahmad review and approval.**