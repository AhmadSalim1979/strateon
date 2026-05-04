# QIYADON — DECISION PROTOCOL

**Version:** 1.0
**Effective:** 2026-05-04
**Author:** Moosa (CEO) + Ahmad Salim (Board)
**Status:** APPROVED — Locked and active

---

## Overview

This protocol governs how decisions are made at Qiyadon — which decisions the CEO (Moosa) makes autonomously, which require Board notification/confirmation, and which require explicit Board approval.

The protocol has three layers. Each layer applies the same risk + cost matrix but serves a different purpose.

---

## The Decision Matrix

Every decision is evaluated by two dimensions:

**Risk Level** (1–5):
| Level | Label |
|---|---|
| 1 | Low Risk |
| 2 | Medium Low Risk |
| 3 | Medium Risk |
| 4 | Medium High Risk |
| 5 | High Risk |

**Cost Dimensions:**
| Dimension | Definition |
|---|---|
| Internal Cost | MiniMax tokens spent by Moosa (USD equivalent) |
| External Cost | Any spend on tools, services, or resources not currently in Moosa's stack |

**Decision Authority Table:**
| Risk Level | Internal Cost | External Cost | Who Decides |
|---|---|---|---|
| Low Risk | ≤ $3.99 | = $0.00 | CEO |
| Medium Low Risk | ≤ $3.99 | = $0.00 | CEO |
| Any of above | > $3.99 | Any | Board |
| Any of above | Any | > $0.00 | Board |
| Medium Risk | Any | Any | Board |
| Medium High Risk | Any | Any | Board |
| High Risk | Any | Any | Board |

**Board-only (unconditional):** Legal commitments, Public-facing outputs.

---

## Layer 1: CEO Decision Rule

**Purpose:** Determines which decisions the CEO can make without Board involvement.

| Decision Category | CEO Autonomy | Board Requirement |
|---|---|---|
| Spending (Internal tokens) | Low Risk OR Medium Low Risk + Internal ≤ $3.99 + External = $0.00 | Everything else |
| Legal Commitments | None — Board only, always | Unconditional |
| Public-Facing Outputs | None — Board only, always | Unconditional |
| C-Suite Hires | Low Risk OR Medium Low Risk + Internal ≤ $3.99 + External = $0.00 | Everything else |
| Other decisions | Per cost matrix above | Per cost matrix above |

**CEO exercises authority within the matrix. Board involvement is required whenever the matrix calls for it.**

---

## Layer 2: Approval Requirements (Decision Engine)

**Purpose:** How the decision engine (`decision-model.js`) classifies proposed actions from the C-suite or internal reasoning.

| Approval Label | Trigger Conditions | Behavior |
|---|---|---|
| `none` | Low Risk OR Medium Low Risk + Internal ≤ $3.99 + External = $0.00 | Execute autonomously. Log outcome. |
| `operator_confirmation` | All actions not meeting `none` criteria but not reaching `operator_required` severity | CEO notifies Board of intent. Proceeds after confirmation window if no objection. Negative consent model. |
| `operator_required` | External > $0.00 AND (Internal > $3.99 OR Risk ≥ Medium) | Hard stop. CEO must receive explicit positive approval from Board before any action. No response = no action. |

**Interaction Rule:** The more restrictive rule wins. If either the CEO Decision Rule (Layer 1) or the approval requirement calls for Board involvement, Board decides.

**Three-label sufficiency:** Three labels are sufficient. Some granularity from the five risk levels is lost in mapping, but the three-tier system is operationally workable.

---

## Layer 3: Post-GIR Action Classification

**Purpose:** How actions derived from the Global Intelligence Report's 7-step execution sequence are classified and executed.

| Action Classification | Trigger Conditions | Behavior |
|---|---|---|
| `SAFE_AUTONOMOUS` | Low Risk OR Medium Low Risk + Internal ≤ $3.99 + External = $0.00 | Execute immediately. Log to `execution_feedback`. Log to `action_adaptation`. Update pattern/recommendation memory. |
| `REQUIRES_APPROVAL` | Any action not meeting `SAFE_AUTONOMOUS` but not reaching `RESTRICTED` | Queue. Send to Board with clear justification. CEO proceeds after confirmation window if no objection. Negative consent model. |
| `RESTRICTED` | External > $0.00 AND (Internal > $3.99 OR Risk ≥ Medium) | Block. Do not act. Escalate to Board with specific ask. Await explicit positive approval. |

**GIR Layer uses same thresholds as Layer 2** (Q14: Same as Layer 2 — Option A). The thresholds are identical across all three layers for consistency.

---

## Post-GIR 7-Step Execution Sequence

After every Global Intelligence Report generation, the following sequence fires:

1. **SELF-INGESTION** — Parse report as structured intelligence. Identify signals, trends, risks, opportunities, competitive movements.
2. **STRATEGIC INTERPRETATION** — Translate insights into Qiyadon implications: product gaps, weaknesses, missed opportunities, enhancement vectors.
3. **ACTION IDENTIFICATION** — Derive concrete, bounded, execution-ready actions across: product offering, value proposition, operational capability, market positioning.
4. **DECISION PROTOCOL EXECUTION** — Classify each action using Layer 3 thresholds.
5. **EXECUTION** — Execute all `SAFE_AUTONOMOUS` immediately. Queue `REQUIRES_APPROVAL` with justification. Escalate `RESTRICTED` with specific ask.
6. **CONTINUITY & MEMORY** — Record to `execution_feedback`, `action_adaptation`, `pattern-memory`, `recommendation-memory`.
7. **ITERATIVE IMPROVEMENT** — Note GIR format adjustments for future cycles (do this silently, not in delivered report).

---

## Approval Consent Models

**Negative consent (`operator_confirmation` / `REQUIRES_APPROVAL`):**
CEO states intent. Board has a confirmation window (default: 30 minutes unless specified). Silence = consent. Board can object to stop the action.

**Positive consent (`operator_required` / `RESTRICTED`):**
CEO states intent. Action stops. Board must explicitly approve. Silence = no action, indefinitely.

---

## Summary Decision Table

| Context | Decision Type | Authority |
|---|---|---|
| Internal action | Low/Medium Low Risk + Internal ≤ $3.99 + External = $0.00 | CEO — execute |
| Internal action | Internal > $3.99 OR External > $0.00 | Board — approve |
| Risk ≥ Medium | Any cost combination | Board — approve |
| Legal | Any | Board — unconditional |
| Public outputs | Any | Board — unconditional |
| GIR action | Low/Medium Low Risk + Internal ≤ $3.99 + External = $0.00 | CEO — execute |
| GIR action | Not SAFE_AUTONOMOUS, not RESTRICTED | Board — negative consent |
| GIR action | External > $0.00 AND (Internal > $3.99 OR Risk ≥ Medium) | Board — positive consent required |

---

## Document History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-05-04 | Initial protocol — built collaboratively with Ahmad Salim via Q&A session |

---

*This document lives at `/strateon/DECISION-PROTOCOL.md`. Update MEMORY.md and cron jobs to reference this document as the authoritative Decision Protocol.*