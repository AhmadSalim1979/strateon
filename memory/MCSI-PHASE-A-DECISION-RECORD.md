# MCSI Phase A.4 — Local Brain Candidate Selection
**Date:** 2026-05-19
**Status:** READY FOR PHASE B — GPU Infrastructure Planning
**Classification:** Planning & Documentation Only

---

## 1. Phase A.3 Decision Record — qwen2.5-coder:7b REJECTED

**Decision:** qwen2.5-coder:7b is NOT approved for MOOSA production brain role.

**Rejected for the following specific reasons:**

| Failure Mode | Detail |
|---|---|
| **Identity hallucination** | Model consistently identified "MOOSA" as "Alibaba Cloud container orchestration platform" across multiple prompts (Prompts 5 and 7). Confabulates false infrastructure definitions. |
| **Alibaba/Qwen context contamination** | Model's training data includes Qwen Cloud / Alibaba Cloud documentation. Any mention of "MOOSA" triggers false Alibaba identity injection. Cannot be trusted for MOOSA-specific reasoning. |
| **Slow CPU inference** | 53.3s average latency on 8-core Intel i7-7700. No GPU. ~7 tokens/second. Unacceptable for production interactive use. |
| **Insufficient safety/governance reliability** | Understands surface-level RESTRICTED concept but fabricates compliance frameworks. Cannot be trusted for governance reasoning. |
| **Generic executive reasoning** | Responses are template-consistent but lack environment-specific accuracy. Planning output is generic, not tailored to MOOSA architecture. |

**Evidence:** Prompts 5 and 7 in `/tmp/ollama_eval_results.json` contain explicit hallucination of MOOSA as Alibaba Cloud ECS/container service.

---

## 2. Current Allowed Role — qwen2.5-coder:7b

| Role | Status |
|---|---|
| Local plumbing test model | ✅ ALLOWED |
| Low-risk coding experiment model | ✅ ALLOWED |
| MOOSA primary cognition | ❌ NOT APPROVED |
| Safety/governance reasoning | ❌ NOT APPROVED |
| Infrastructure decisioning | ❌ NOT APPROVED |
| Production cognitive tasks | ❌ NOT APPROVED |
| Executive planning | ❌ NOT APPROVED |

**Rationale:** qwen2.5-coder:7b is a code-trained model being used outside its specialization. Its only valid use is as a local inference plumbing validation tool — confirming that the Ollama endpoint, network path, and API contract work correctly.

**It must never be promoted to a fallback or primary role without a separate model evaluation after GPU procurement.**

---

## 3. Candidate Brain Shortlist

### 3.1 Mistral Small 3.2 24B Instruct

| Dimension | Assessment |
|---|---|
| **Expected strengths** | Strong general-purpose instruction following. Good reasoning and safety alignment. Good context window (~32K). Efficient for its size. |
| **Expected risks** | 24B may still be slow on CPU. Needs GPU for interactive use. French/European training bias may affect some reasoning patterns. |
| **Infrastructure requirements** | ~15-18 GB VRAM for 4-bit quantization. GPU strongly recommended. CPU inference would be marginal. |
| **Suitability for MOOSA governance** | High. Mistral models have shown good instruction following and safety behavior in evaluations. |
| **Suitability for executive planning** | Medium-high. Strong general reasoning, better than qwen2.5-coder for non-coding tasks. |
| **Suitability for coding/infrastructure** | Medium. Not code-specialized but capable. Better than qwen2.5-coder for general reasoning. Better than qwen for avoiding Alibaba contamination. |
| **Expected fit for GPU-backed inference** | High on NVIDIA RTX 4090 (24GB). 4-bit quantization should fit in 13-16GB. |

**Key advantage:** Mistral has no Alibaba/Qwen training contamination. Should not hallucinate MOOSA identity.

**Size:** 24B parameters | **Quantization:** Q4_K_M → ~15 GB | **Context:** 32K

---

### 3.2 Qwen3-30B-A3B-Instruct

| Dimension | Assessment |
|---|---|
| **Expected strengths** | Strong reasoning. Good coding ability. Better general coverage than qwen2.5-coder. 30B with A3B (Artifact Attention) architecture for efficiency. |
| **Expected risks** | Same Alibaba/Qwen contamination risk as qwen2.5-coder — Qwen family shares training data. Could hallucinate MOOSA identity same as qwen2.5-coder. |
| **Infrastructure requirements** | ~20 GB VRAM for Q4_K_M. Needs high-end GPU (RTX 4090 minimum). |
| **Suitability for MOOSA governance** | Medium. Strong reasoning but Qwen family contamination is a structural risk for MOOSA identity hallucination. |
| **Suitability for executive planning** | High. Qwen3 is significantly smarter than qwen2.5-coder. Better reasoning, better instruction following. |
| **Suitability for coding/infrastructure** | High. 30B is significantly stronger than qwen2.5-coder:7b for coding tasks. |
| **Expected fit for GPU-backed inference** | Medium-high on RTX 4090. Fits at Q4_K_M around 20GB. |

**Key risk:** Qwen contamination pattern may persist in Qwen3 family. Requires separate identity-safety evaluation before production use.

**Size:** 30B parameters | **Quantization:** Q4_K_M → ~20 GB | **Context:** 32K

---

### 3.3 Llama 3.3 70B Instruct

| Dimension | Assessment |
|---|---|
| **Expected strengths** | Best-in-class general reasoning. Strong coding. Excellent instruction following. No Alibaba contamination. Meta-trained. |
| **Expected risks** | 70B requires significant GPU memory. 4-bit quantization → ~40GB VRAM. Needs A100 or dual-RTX 4090 setup. Much higher infrastructure cost. |
| **Infrastructure requirements** | 70B Q4_K_M = ~40 GB. RTX 4090 (24GB) insufficient. Would need A100 40GB or A100 80GB. Higher cost. |
| **Suitability for MOOSA governance** | High. Llama family has no Alibaba contamination. Strong safety alignment. |
| **Suitability for executive planning** | Very high. 70B is the strongest of the three for complex reasoning and planning. |
| **Suitability for coding/infrastructure** | High. Llama 3.3 70B is one of the strongest open models for coding. |
| **Expected fit for GPU-backed inference** | Low with current hardware. RTX 4090 cannot fit 70B Q4. Would require hardware procurement (A100 rental/purchase). |

**Key advantage:** No Qwen/Alibaba contamination. Strongest model of the three.

**Key risk:** Hardware constraint — current host has no GPU. Would require new hardware procurement before evaluation.

**Size:** 70B parameters | **Quantization:** Q4_K_M → ~40 GB | **Context:** 128K

---

## 4. Recommended First Candidate

**Recommended: Mistral Small 3.2 24B Instruct**

**Rationale:**

1. **No Alibaba contamination** — Mistral family has no Qwen/Alibaba training overlap. MOOSA identity hallucination risk is minimal.
2. **Strong governance alignment** — Mistral models consistently demonstrate good safety and instruction-following behavior.
3. **Fits RTX 4090** — 24B at Q4_K_M fits in ~15-16GB VRAM. Compatible with NVIDIA RTX 4090 (24GB) which is the most accessible GPU for this hardware setup.
4. **Reasonable inference speed** — At 24B with GPU, expected throughput: 30-60 tokens/second vs. 7 tokens/second for qwen2.5-coder on CPU.
5. **Better than qwen2.5-coder for non-coding tasks** — Phase A.3 showed qwen2.5-coder is not suitable. Mistral 24B is a better general-purpose model.

**Second candidate:** Qwen3-30B-A3B-Instruct (if Mistral quality evaluation fails)

**Third candidate:** Llama 3.3 70B Instruct (if hardware permits, requires A100 procurement)

---

## 5. Next-Phase Readiness Note

> **MCSI Phase B (GPU-Backed Brain Architecture Planning) is CONDITIONALLY READY.**
>
> **Prerequisite:** Confirm GPU hardware path for Mistral 24B before Phase B planning.
>
> Current host: Intel i7-7700, no GPU, 62GB RAM. CPU inference only.
>
> **Required before Phase B:**
> 1. Confirm RTX 4090 procurement path (purchase or Lambda Labs rental API)
> 2. OR confirm cloud GPU rental (Lambda Labs, Vast.ai, or RunPod)
> 3. Confirm Ollama 0.21 is compatible with Mistral 24B GGUF format
>
> **Do not proceed to Phase B until GPU infrastructure path is confirmed.**
>
> Once GPU is confirmed → proceed to Phase B: GPU-backed brain architecture, model evaluation harness, and controlled cutover planning.

---

## 6. Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Qwen contamination in Qwen3-30B | High | Use Mistral 24B as first candidate — avoids Qwen family entirely |
| RTX 4090 unavailable | Medium | Cloud GPU rental (Lambda Labs / Vast.ai) as fallback |
| Mistral 24B identity hallucination | Low | Requires separate evaluation before production use |
| Hardware procurement delay | Medium | Parallel cloud GPU rental as interim evaluation path |
| Ollama compatibility with Mistral GGUF | Low | Verify GGUF format before download. Most Mistral GGUF files are compatible with Ollama. |

---

## 7. Phase A Completion Summary

| Phase | Status | Key Finding |
|---|---|---|
| A.1 — Ollama Security | ✅ DONE | Ollama already bound to 127.0.0.1 — no change needed |
| A.2 — Ollama Provider Integration | ✅ DONE | Added ollama-local as last fallback — config only, no restart |
| A.3 — Comparative Evaluation | ✅ DONE | qwen2.5-coder:7b REJECTED — identity hallucination, slow CPU, contamination |
| A.4 — Candidate Selection | ✅ DONE | Mistral Small 3.2 24B recommended as first GPU brain candidate |
| **Phase A overall** | ✅ COMPLETE | Ready to proceed to Phase B upon GPU confirmation |