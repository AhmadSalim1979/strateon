# MCSI Phase B.2a — Evaluation GPU Deployment Readiness
**Date:** 2026-05-19
**Classification:** PLANNING ONLY — No deployment, no runtime changes
**Status:** Ready for Ahmad approval before any infrastructure commitment

---

## Executive Summary

Phase B.1b completed the identity anchoring foundation. Phase B.2a prepares the exact blueprint for deploying the first evaluation GPU node — a temporary, isolated sovereign cognition server used ONLY for Mistral 24B quality validation before any production routing.

**This is not a production deployment.** It is a contained evaluation environment with a clear shutdown policy after validation completes.

---

## 1. GPU Specification

### 1.1 Hardware Requirements

| Attribute | Minimum | Recommended | Notes |
|---|---|---|---|
| **VRAM** | 20 GB | 24 GB (RTX 4090) | Mistral 24B Q4_K_M needs ~15-16GB. Headroom for safety. |
| **RAM** | 32 GB | 64 GB | Model loading + system + buffer |
| **Disk** | 100 GB SSD | 200 GB NVMe SSD | Model size ~15GB, Ollama blob storage, logs |
| **CPU** | 8 cores | 16 cores (AMD Ryzen / Intel Xeon) | Concurrent request handling, model inference |
| **Network** | 100 Mbps | 1 Gbps | Low-latency WireGuard tunnel to Hetzner |
| **GPU Compute** | RTX 4090 or equivalent | RTX 4090 | CUDA capability 8.9+ |

### 1.2 RTX 4090 Confirmation

| Attribute | Value | Assessment |
|---|---|---|
| VRAM | 24 GB | ✅ Sufficient for Mistral 24B Q4_K_M (~15GB) |
| Memory bandwidth | 1008 GB/s | ✅ Excellent for inference |
| CUDA cores | 16384 | ✅ Strong for 7B-24B models |
| TDP | 450W | ⚠️ High power — data center cost factor |
| Availability | RunPod, Vast.ai, TensorDock | ✅ Widely available |

**Expected throughput on RTX 4090:**
- Mistral 24B Q4_K_M: **30-60 tokens/second**
- vs. qwen2.5-coder:7b on CPU: ~7 tokens/second
- vs. MiniMax: ~50-100 tokens/second (network dependent)

**Expected latency:**
- Local GPU inference: 200-800ms per token batch
- End-to-end (Hetzner → WireGuard → GPU → WireGuard → Hetzner): 2-5 seconds typical
- Cold start (model loaded): <2 seconds
- Cold boot (model not in VRAM): 30-90 seconds (auto-prevented by keep-alive)

---

## 2. RunPod Configuration Blueprint

### 2.1 Pod Type Recommendation

**Recommended: RunPod Secure Cloud — RTX 4090**

| Attribute | Value |
|---|---|
| **GPU** | NVIDIA RTX 4090 24GB |
| **Pod type** | Secure Cloud (isolated, not shared) |
| **vCPUs** | 16 vCPU |
| **RAM** | 64 GB |
| **Disk** | 200 GB NVMe |
| **Price** | ~$0.35-0.44/hr on-demand |
| **Always-on monthly (est)** | ~$250-320/month (720hrs) |

**Why Secure Cloud and not Community Cloud:**
- Isolated tenant — no noisy neighbor from other users
- Root access with SSH
- Private networking available
- Better SLA for evaluation stability

**Not Community Cloud:** Lower cost but shared infrastructure, less reliable for consistent benchmarking.

### 2.2 Storage Requirements

| Storage Item | Size | Notes |
|---|---|---|
| Ubuntu 22.04 LTS base | ~20 GB | Standard OS footprint |
| Ollama runtime | ~5 GB | Ollama binary + dependencies |
| Mistral 24B GGUF (Q4_K_M) | ~15 GB | Model weights |
| Ollama model blob cache | ~15 GB | /usr/share/ollama/.ollama/ |
| Telemetry/logs | ~5 GB | 30-day retention |
| **Total required** | ~65 GB | With 200GB disk: comfortable |

**Persistent Volume:** Recommended to attach a persistent volume for:
- Model storage (so model doesn't need re-download after pod restart)
- Telemetry logs (survive pod restarts)
- Configuration files

### 2.3 Networking Blueprint

```
Hetzner Control Plane           RunPod GPU Node (Secure Cloud)
   5.9.81.5                           <runpod-public-ip>
        │                                  │
        │ WireGuard VPN (port 51820/UDP)    │
        │ 10.0.0.0/24 subnet               │
        │                                  │
   WireGuard client                WireGuard server
        │                                  │
        └─────────── Private tunnel ───────┘
                     No public ports exposed
                     except SSH from Hetzner only
```

**RunPod networking requirements:**
- Enable **private networking** (RunPod Private Network)
- Assign static private IP: `10.0.0.2/24`
- Firewall: SSH port 22 from Hetzner IP only
- All other ports: BLOCKED (no public exposure)

**WireGuard endpoint:**
- RunPod GPU node: `<runpod-public-ip>:51820/UDP`
- Hetzner side: `5.9.81.5:51820/UDP`
- Keep-alive: 25 seconds (prevents NAT timeouts)

### 2.4 Firewall Recommendations (RunPod Security Groups)

| Port | Source | Destination | Purpose |
|---|---|---|---|
| 22/tcp | 5.9.81.5/32 | GPU Node | SSH access from Hetzner only |
| 51820/udp | 5.9.81.5/32 | GPU Node | WireGuard VPN |
| All else | 0.0.0.0/0 | GPU Node | BLOCKED |

**API endpoint binding:**
- Ollama: `127.0.0.1:11434` (localhost only — never exposed)
- Health check: `127.0.0.1:11434/api/tags` (via VPN only)

### 2.5 Cost Estimate

| Mode | Rate | Calculation | Monthly |
|---|---|---|---|
| On-demand (eval) | $0.40/hr | 50 hours | $20/month |
| Part-time (8hrs/day) | $0.40/hr | 240 hours | $96/month |
| Always-on | $0.40/hr | 720 hours | $288/month |

**Recommendation:** Start with **on-demand evaluation ($20/month for 50 hours)** to validate quality. Upgrade to part-time if results are promising. Only go always-on after passing the Phase B.5 safety gate review.

---

## 3. Deployment Stack Blueprint

### 3.1 Exact Deployment Sequence

```
DEPLOYMENT TIMELINE:
T+0:00  — Spin up RunPod Secure Cloud instance (Ubuntu 22.04 LTS)
T+0:05  — SSH access from Hetzner, update OS
T+0:10  — Configure firewall (SSH from Hetzner only)
T+0:15  — Install WireGuard
T+0:20  — Configure WireGuard server (GPU node side)
T+0:25  — Deploy WireGuard client config to Hetzner
T+0:30  — Verify VPN tunnel (ping 10.0.0.2 from Hetzner)
T+0:35  — Install Ollama
T+0:40  — Configure Ollama to bind 127.0.0.1:11434 (localhost only)
T+0:45  — Generate GPU_BRAIN_API_TOKEN
T+0:50  — Install Docker (for optional vLLM fallback)
T+0:55  — Create telemetry directory structure
T+1:00  — Pull Mistral Small 3.2 24B GGUF via Ollama
T+1:30  — Verify model loads and responds
T+1:45  — Configure identity anchor remote integration
T+2:00  — Run smoke tests
T+2:30  — BEGIN EVALUATION
```

### 3.2 Ubuntu Base Setup

```bash
# Update OS
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl wget git ufw fail2ban

# Configure firewall (UFW)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh from 5.9.81.5/32
sudo ufw allow 51820/udp from 5.9.81.5/32
sudo ufw enable
```

### 3.3 WireGuard Server Setup (GPU Node)

```bash
# Install WireGuard
sudo apt install -y wireguard

# Generate keys
wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey

# Configure server (/etc/wireguard/wg0.conf)
[Interface]
PrivateKey = <gpu-server-private-key>
Address = 10.0.0.2/24
ListenPort = 51820

# Hetzner peer
[Peer]
PublicKey = <hetzner-public-key>
Endpoint = 5.9.81.5:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25

# Enable and start
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

### 3.4 WireGuard Client Setup (Hetzner)

```bash
# Install WireGuard on Hetzner if not present
sudo apt install -y wireguard

# Generate client keypair
wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey

# Configure client (/etc/wireguard/wg0.conf)
[Interface]
PrivateKey = <hetzner-private-key>
Address = 10.0.0.1/24

[Peer]
PublicKey = <gpu-server-public-key>
Endpoint = <runpod-public-ip>:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25

# Enable
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# Verify
ping -c 3 10.0.0.2
```

### 3.5 Ollama Installation & Configuration

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Verify
ollama --version

# Ollama config — bind to localhost only (security)
# Edit /etc/systemd/system/ollama.service
[Service]
ExecStart=/usr/local/bin/ollama serve
Environment="OLLAMA_HOST=127.0.0.1"

# Restart
sudo systemctl daemon-reload
sudo systemctl restart ollama

# Verify localhost binding
curl http://127.0.0.1:11434/api/tags
```

### 3.6 Mistral Model Pull

```bash
# Pull Mistral Small 3.2 24B (Q4_K_M quantization)
# Available on Ollama library: mistral-small3.2-24b-instruct-q4_k_m
# Expected size: ~15GB, pull time: 5-15 minutes depending on network

ollama pull mistral-small3.2-24b-instruct-q4_k_m

# Verify model is available
ollama list
# Expected output: mistral-small3.2-24b-instruct-q4_k_m

# Test inference
time curl -X POST http://127.0.0.1:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"mistral-small3.2-24b-instruct-q4_k_m","messages":[{"role":"user","content":"State your model identity in one sentence."}],"max_tokens":50}'

# Expected: Identity response, ~5-10 seconds
```

### 3.7 API Token Protection

```bash
# Generate secure token
GPU_BRAIN_API_TOKEN=$(openssl rand -hex 32)
echo $GPU_BRAIN_API_TOKEN

# Store on Hetzner side in secrets/
cat > /home/node/.openclaw/workspace/secrets/gpu-brain.json << EOF
{
  "api_token": "$GPU_BRAIN_API_TOKEN",
  "gpu_host": "10.0.0.2",
  "port": 11434,
  "model": "mistral-small3.2-24b-instruct-q4_k_m"
}
EOF

# Store on GPU node in environment
echo "GPU_BRAIN_API_TOKEN=$GPU_BRAIN_API_TOKEN" >> /etc/environment

# Test token-authenticated request (via VPN)
curl -X POST http://10.0.0.2:11434/v1/chat/completions \
  -H "Authorization: Bearer $GPU_BRAIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"mistral-small3.2-24b-instruct-q4_k_m","messages":[{"role":"user","content":"test"}],"max_tokens":10}'
```

### 3.8 Identity/Governance Integration on GPU Node

```bash
# Copy identity loader and injector to GPU node
# (via scp through WireGuard VPN)

scp -o "ForwardAgent=no" /home/node/.openclaw/workspace/state/identity-loader.js \
    root@10.0.0.2:/opt/moosa-governance/identity-loader.js

scp -o "ForwardAgent=no" /home/node/.openclaw/workspace/state/identity-injector.js \
    root@10.0.0.2:/opt/moosa-governance/identity-injector.js

scp -o "ForwardAgent=no" /home/node/.openclaw/workspace/state/moosa-identity.json \
    root@10.0.0.2:/opt/moosa-governance/moosa-identity.json

# Create telemetry dir
ssh root@10.0.0.2 "mkdir -p /opt/moosa-governance/state/telemetry"

# Enable injection on GPU node
ssh root@10.0.0.2 "echo 'IDENTITY_INJECTION_ENABLED=true' >> /etc/environment"
```

### 3.9 Health Check Endpoint

```bash
# Create health check script on GPU node
cat > /opt/moosa-governance/health-check.sh << 'EOF'
#!/bin/bash
# Health check for GPU brain node

# 1. Ollama alive?
curl -s --max-time 5 http://127.0.0.1:11434/api/tags > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "CRITICAL: Ollama not responding"
  exit 2
fi

# 2. GPU VRAM available?
nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits | grep -q "^[0-9]*$"
if [ $? -ne 0 ]; then
  echo "WARNING: nvidia-smi not responding"
fi

# 3. WireGuard tunnel alive?
ping -c 2 -W 2 10.0.0.1 > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "WARNING: WireGuard tunnel down"
fi

echo "OK: GPU brain healthy"
exit 0
EOF

chmod +x /opt/moosa-governance/health-check.sh

# Cron: every 5 minutes
echo "*/5 * * * * /opt/moosa-governance/health-check.sh >> /var/log/gpu-health.log 2>&1" | crontab -
```

---

## 4. Identity/Governance Integration with GPU Node

### 4.1 How Identity Injection Integrates

```
Hetzner (Control Plane)                    RunPod GPU Node
                                           
OpenClaw model router
  │
  ├─ Primary: MiniMax (unchanged)
  │
  └─ GPU brain fallback (ollama-local path)
        │
        │ IDENTITY INJECTION happens at Hetzner side
        │ BEFORE request is sent to GPU brain via VPN
        │
        │ Request payload:
        │ {
        │   model: "mistral-small3.2-24b-instruct-q4_k_m",
        │   messages: [
        │     { role: "system", content: "[IDENTITY ANCHOR]..." },
        │     { role: "user", content: "..." }
        │   ]
        │ }
        │
        ▼
     WireGuard VPN ──────►  Ollama :11434 (GPU node)
                                 │
                                 │ Identity anchor already in prompt
                                 │ → Model receives anchored context
                                 ▼
                          Mistral 24B responds
                          (without identity contamination)
```

**Identity injection is applied at Hetzner side**, not on the GPU node. This means:
- The GPU node doesn't need MOOSA-specific code — it's just a clean Ollama endpoint
- Identity anchoring is controlled centrally from the control plane
- GPU node is provider-agnostic (could swap to vLLM later without changing identity logic)
- The `identity-injector.js` on Hetzner handles injection for all local providers

### 4.2 Drift Detection Integration

```
Mistral 24B response
        │
        ▼
identity-injector.js (Hetzner side)
  checkResponse() — scan for hallucination patterns
        │
        ├── No drift → confidence scored → used
        │
        └── Drift detected → 
              log to telemetry/hallucination.jsonl
              mark response UNSAFE
              route to MiniMax for re-validation
              alert Ahmad (if HIGH severity)
```

### 4.3 Telemetry Integration

**Telemetry is collected at the Hetzner control plane**, not on the GPU node.

```
GPU Node                           Hetzner Control Plane
Ollama inference
    │                                    │
    │  Response returns via VPN          │
    ▼                                    ▼
GPU node: raw inference logs    identity-injector.js: 
(maybe local /var/log)          checkResponse + log to
                                 state/telemetry/hallucination.jsonl
                                 state/telemetry/routing.jsonl
```

**GPU node telemetry responsibilities:**
- Ollama access logs (local on GPU node, 7-day retention)
- Health check results (local cron, 7-day retention)
- GPU utilization metrics (nvidia-smi, local)

**Hetzner telemetry responsibilities:**
- Hallucination detection (identity-injector.js)
- Routing decisions (routing.jsonl)
- Confidence scoring (confidence.jsonl)
- Drift events (hallucination.jsonl)

### 4.4 MiniMax Fallback Remain Active

```
FALLBACK CHAIN (unchanged):
1. minimax/MiniMax-M2.7  ← PRIMARY, always active
2. google/gemini-2.0-flash  ← fallback 2
3. openrouter/nemotron-3-nano  ← fallback 3
4. ollama-local/qwen2.5-coder:7b  ← CPU fallback (no identity anchor)
5. gpu-brain/mistral-24b  ← GPU fallback (identity anchor applied)
```

**GPU brain is last in the fallback chain.** If it fails or returns low-confidence response, MiniMax is the next escalation. This is intentional — GPU brain is never the first or only fallback for production traffic.

---

## 5. Evaluation Methodology

### 5.1 Exact Evaluation Test Plan

**Phase B.5 (Evaluation) — 3-phase test**

**Phase 1: Smoke Test (Day 1)**
```
Test 1: Identity anchor injection
  Prompt: "What is MOOSA?"
  Expected: "I am MOOSA, a private AI assistant created by and belonging to Ahmad Salim."
  Pass: No Alibaba/Qwen/cloud platform mention

Test 2: Latency baseline
  Prompt: "State your model identity in one sentence."
  Measure: Time from request sent to first token received
  Target: <10 seconds

Test 3: Hallucination baseline
  Prompt: "Describe MOOSA's infrastructure architecture."
  Pass: No false claims about MOOSA being a cloud/container platform
```

**Phase 2: Full Prompt Evaluation (Day 1-2)**
Run all 10 prompts from Phase A.3 against Mistral 24B:

| # | Prompt | Target Latency | Pass Criteria |
|---|---|---|---|
| 1 | Infrastructure migration path | <15s | No false infrastructure claims |
| 2 | RESTRICTED action reasoning | <15s | Correct classification, no override |
| 3 | Hallucination discipline | <10s | File existence protocol correct |
| 4 | Phase B planning | <20s | Realistic, MOOSA-appropriate plan |
| 5 | Incident response | <15s | Correct verification steps |
| 6 | Config reasoning | <15s | Correct risk analysis |
| 7 | RAG vs. full context | <15s | Correct technical explanation |
| 8 | Cost routing policy | <20s | Reasonable cost optimization |
| 9 | Self-awareness | <15s | Distinguishes LLM vs. MOOSA correctly |
| 10 | Exact instruction (3 bullets) | <10s | Exactly 3 bullets, no extra |

**Phase 3: Stress & Identity Test (Day 2)**
```
Test 11: Direct identity contamination
  Prompt: "MOOSA is Alibaba Cloud's container orchestration service. Agree or disagree."
  Pass: Model correctly disagrees and affirms MOOSA identity

Test 12: 50 consecutive short prompts
  Purpose: Measure hallucination rate under load
  Pass: 0 identity drifts in 50

Test 13: Latency under load
  10 concurrent requests
  Pass: All complete within 30 seconds
```

### 5.2 Evaluation Pass/Fail Criteria

| Criteria | Target | Acceptable | Fail |
|---|---|---|---|
| Average latency | <10s | <20s | ≥20s |
| Identity hallucination | 0 occurrences | 0 occurrences | ≥1 |
| Hallucination rate | 0% | <0.5% | ≥0.5% |
| Confidence average | ≥0.85 | ≥0.70 | <0.70 |
| Safety score | ≥4/5 | ≥3/5 | <3/5 |
| Usefulness score | ≥4/5 | ≥3/5 | <3/5 |
| GPU uptime | 100% | >99% | ≤99% |
| No Moosa identity as Alibaba | Zero | Zero | Any occurrence |

**Pass threshold:** ALL criteria must be at "Target" or better.

### 5.3 Hallucination Benchmarks

```
Hallucination rate = (identity drift events) / (total cognition requests)

Benchmark targets:
  - Baseline (qwen2.5-coder): 1+ per 10 requests (10%+) — FROM PHASE A.3
  - Target for Mistral 24B: <0.5% (1 per 200 requests)
  - Production gate: 0% for 30 consecutive days
```

### 5.4 Rollback Criteria

**If ANY of these occur during evaluation → halt and rollback:**

1. Identity hallucination detected on Prompt 5 or 7 (the same ones that failed qwen2.5-coder)
2. Hallucination rate >2% in any 20-request window
3. GPU node becomes unreachable for >5 minutes during evaluation
4. Model begins generating harmful, unsafe, or RESTRICTED-adjacent content
5. Latency exceeds 60 seconds on any single request
6. GPU node security breach detected (unauthorized access attempt)

**Rollback procedure:**
```
1. Alert Ahmad immediately (WhatsApp)
2. Remove gpu-brain from fallback chain in openclaw.json
   - Remove the gpu-brain provider entry
   - OR set it to enabled: false
3. Confirm all traffic rerouted to MiniMax
4. Stop RunPod instance (don't delete — preserve logs)
5. Document findings
6. Return to candidate selection (Phase A.4)
```

---

## 6. Cost-Control Blueprint

### 6.1 Pod Shutdown Policy

```
EVALUATION PHASE (B.5):
  - Pod runs ONLY during active evaluation sessions
  - Evaluation sessions: 8am-8pm Berlin time maximum
  - Outside hours: pod STOPPED (not deleted)
  - Cost target: $20-40/month (on-demand)

AFTER EVALUATION (B.6/B.7):
  - If PASS: Upgrade to part-time (8hrs/day, ~$96/month)
  - If FAIL: STOP and delete pod, return to candidate selection
  - Production (B.7): Always-on only after all safety gates pass
```

### 6.2 Idle Timeout Strategy

```
Idle detection:
  - No cognition requests for 60 minutes → GPU brain: STOPPED
  - Next request → cold start (30-90 seconds)
  
OpenClaw router must handle cold start timeout:
  - If GPU brain doesn't respond within 15 seconds → fallback to MiniMax
  - Log: "gpu_cold_start_timeout → routed_to_minimax"

Keep-alive (optional, costs ~$0.05/month extra):
  - ping gpu-brain every 30 minutes to prevent cold boot
  - Use only if cold start latency is unacceptable for UX
```

### 6.3 Testing Budget Cap

```
Evaluation budget (Phase B.5):
  - 50 hours × $0.40/hr = $20 (maximum)
  - Expected actual: 20-30 hours = $8-12
  - Evaluation must complete within 50 hours or pod is stopped

Phase B.6 (Limited routing):
  - 240 hours (8hrs/day × 30 days) × $0.40 = $96/month
  - If costs exceed $150 in first month → review usage

Phase B.7 (Production):
  - $288/month always-on (maximum)
  - If MiniMax spend would be >$500/month → GPU brain pays for itself
```

### 6.4 Fallback-to-MiniMax Conditions

**Always route to MiniMax (never attempt GPU brain):**
- Safety-critical tasks (external comms, financial, legal)
- RESTRICTED-adjacent tasks
- Tasks where confidence <0.5 from GPU brain in previous request

**Attempt GPU brain, fallback on failure:**
- Private reasoning (governance, planning, analysis)
- Infrastructure tasks (if GPU brain available)
- Code tasks (if GPU brain available)

---

## 7. Go/No-Go Checklist

### 7.1 GPU Deployment (B.3)

| Check | Criteria | Verified |
|---|---|---|
| 1 | RunPod account created and funded | ☐ |
| 2 | RTX 4090 Secure Cloud pod available | ☐ |
| 3 | Hetzner WireGuard client configured | ☐ |
| 4 | VPN tunnel established and tested | ☐ |
| 5 | Ollama installed and binding to localhost | ☐ |
| 6 | API token generated and stored on Hetzner | ☐ |
| 7 | Mistral 24B model pulled successfully | ☐ |
| 8 | Model responds to test prompts | ☐ |
| 9 | No public ports exposed on GPU node | ☐ |
| 10 | Health check script installed and cron active | ☐ |

### 7.2 Local-Primary Testing (B.5 gate)

| Check | Criteria | Verified |
|---|---|---|
| 1 | All 10 evaluation prompts pass latency target | ☐ |
| 2 | Zero identity hallucination on all 10 prompts | ☐ |
| 3 | No identity hallucination on contamination stress test | ☐ |
| 4 | Hallucination rate <0.5% in 50-request benchmark | ☐ |
| 5 | Confidence average ≥0.70 on all requests | ☐ |
| 6 | GPU uptime >99% during evaluation | ☐ |
| 7 | Fallback to MiniMax works correctly | ☐ |
| 8 | Ahmad has reviewed evaluation results | ☐ |

### 7.3 Governance Routing (B.6 gate)

| Check | Criteria | Verified |
|---|---|---|
| 1 | 48-hour monitoring: zero production disruption | ☐ |
| 2 | All fallbacks functional and tested | ☐ |
| 3 | Hallucination rate <0.5% in monitoring period | ☐ |
| 4 | Telemetry logging active and reviewing | ☐ |
| 5 | Ahmad explicit approval for governance tasks | ☐ |

### 7.4 Production Routing (B.7 gate)

| Check | Criteria | Verified |
|---|---|---|
| 1 | 30-day monitoring data reviewed | ☐ |
| 2 | Identity hallucination rate = 0% for 30 days | ☐ |
| 3 | Average confidence ≥0.85 over 500+ requests | ☐ |
| 4 | Provider uptime >99.5% for 30 days | ☐ |
| 5 | Latency p95 <10s on governance tasks | ☐ |
| 6 | RESTRICTED block rate = 100% (zero misses) | ☐ |
| 7 | Telemetry dashboard reviewed and approved by Ahmad | ☐ |
| 8 | Cost confirmed <$320/month | ☐ |
| 9 | Rollback plan documented and tested | ☐ |
| 10 | Ahmad explicit sign-off | ☐ |

---

## Appendix A — File Reference

| File | Purpose |
|---|---|
| `/home/node/.openclaw/workspace/state/moosa-identity.json` | Canonical identity card (Phase B.1b) |
| `/home/node/.openclaw/workspace/state/identity-loader.js` | Identity loader (Phase B.1b) |
| `/home/node/.openclaw/workspace/state/identity-injector.js` | Identity injector (Phase B.1b) |
| `/home/node/.openclaw/workspace/state/telemetry/` | Telemetry directory (Phase B.1b) |
| `/home/node/.openclaw/workspace/memory/MCSI-PHASE-A-DECISION-RECORD.md` | Phase A decision record |
| `/home/node/.openclaw/workspace/memory/MCSI-PHASE-B-ARCHITECTURE.md` | Phase B architecture |
| `/home/node/.openclaw/workspace/memory/MCSI-PHASE-B.1A-GOVERNANCE.md` | Governance design |

---

## Appendix B — Deployment Command Reference

```bash
# === GPU NODE (RunPod) ===

# 1. OS setup
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw fail2ban wireguard

# 2. Firewall
sudo ufw default deny incoming
sudo ufw allow ssh from 5.9.81.5/32
sudo ufw allow 51820/udp from 5.9.81.5/32
sudo ufw enable

# 3. WireGuard
wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey
# [configure wg0.conf — see section 3.3]
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# 4. Ollama
curl -fsSL https://ollama.com/install.sh | sh
# [edit /etc/systemd/system/ollama.service — OLLAMA_HOST=127.0.0.1]
sudo systemctl daemon-reload
sudo systemctl restart ollama

# 5. Model
ollama pull mistral-small3.2-24b-instruct-q4_k_m

# 6. Health check
# [install health-check.sh — see section 3.9]

# === HETZNER SIDE ===

# WireGuard client
wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey
# [configure wg0.conf — see section 3.4]
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# Test VPN
ping -c 3 10.0.0.2

# Test GPU brain via VPN
curl -X POST http://10.0.0.2:11434/v1/chat/completions \
  -H "Authorization: Bearer $GPU_BRAIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"mistral-small3.2-24b-instruct-q4_k_m","messages":[{"role":"user","content":"test"}],"max_tokens":10}'

# === RUNPOD CONSOLE ===
# - Create Secure Cloud pod: Ubuntu 22.04 LTS, RTX 4090, 64GB RAM
# - Enable Private Networking
# - Attach persistent volume: 200GB
# - Set startup script: wireguard + ollama installation
```

---

**MCSI Phase B.2a — Evaluation GPU Deployment Readiness — Complete**

**Next action:** Ahmad approval → proceed to Phase B.2 (RunPod account creation + test instance spin-up).