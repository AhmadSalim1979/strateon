# Moosa Orchestration Framework — Complete Architecture
**Version:** 2.0
**Date:** 2026-05-06
**Author:** Moosa (CEO + AI Architect)
**Status:** COMPLETE ARCHITECTURAL ASSESSMENT — AWAITING APPROVAL

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Complete Architectural Assessment](#2-complete-architectural-assessment)
3. [Recommended System Design](#3-recommended-system-design)
4. [Proposed Subsystem Map](#4-proposed-subsystem-map)
5. [Recommended Execution Phases](#5-recommended-execution-phases)
6. [Migration Strategy](#6-migration-strategy)
7. [Risk Analysis](#7-risk-analysis)
8. [Failure-Mode Analysis](#8-failure-mode-analysis)
9. [Security/Governance Considerations](#9-securitygovernance-considerations)
10. [Recommended Repository Structure](#10-recommended-repository-structure)
11. [Infrastructure Requirements](#11-infrastructure-requirements)
12. [Queue/Runtime Recommendations](#12-queueruntime-recommendations)
13. [State Management Strategy](#13-state-management-strategy)
14. [Observability Strategy](#14-observability-strategy)
15. [Initial Implementation Roadmap](#15-initial-implementation-roadmap)

---

## 1. Executive Summary

**What this document is:** A complete architectural assessment and implementation blueprint for Moosa's internal orchestration framework — a system designed to replace all external workflow orchestration (N8N) with fully native, self-owned, sovereign infrastructure.

**What this system is not:** A recreation of visual workflow builders. This is foundational executive operating system infrastructure — the kind that future autonomous AI agents run on.

**Current state:** We do not currently have N8N in production. The workspace has existing execution infrastructure (execution-planner.js, deferred-work.js, safe-action-zones.js, PM2, OpenClaw cron, followup-engine.js) that provides partial orchestration capabilities. This architecture builds on those foundations and adds what is missing.

**Technical direction:**
- **Runtime:** Node.js (TypeScript)
- **Persistence:** PostgreSQL via Supabase (replacing JSON file state)
- **Queue/Events:** Redis (durable queues, pub/sub event bus)
- **Process management:** PM2 (current) → native supervisor (future)
- **API:** Internal REST/gRPC
- **Architecture:** Event-driven, modular, contract-based

**Phased rollout:** No immediate production replacement. Shadow mode → parallel execution → gradual migration → full retirement.

---

## 2. Complete Architectural Assessment

### 2.1 Current Infrastructure Inventory

#### Process & Runtime Layer
| Component | Status | Notes |
|---|---|---|
| PM2 | ✅ Production | Manages moosa-worker, openclaw-gateway, qiyadon-audit-form, response-webhook |
| Node.js v24 | ✅ Production | Runtime for all workers |
| OpenClaw Gateway | ✅ Production | Daemon, manages sessions/channels |
| OpenClaw Cron | ✅ Production | Daily SoD reports, C-suite morning spawns |
| WhatsApp Integration | ✅ Working | Inbound/outbound functional |
| Email (SMTP 587) | ✅ Production | qiyadon-audit-form sends email |
| HubSpot CRM | ✅ Production | API connected, contact creation works |

#### Orchestration-Adjacent Handlers
| Handler | Purpose | Maturity |
|---|---|---|
| execution-planner.js | Multi-step execution plans | Partial — plan creation works, dispatch not wired |
| deferred-work.js | Deferred queue management | Partial — queue exists, trigger integration missing |
| safe-action-zones.js | Action classification (SAFE_AUTONOMOUS/SUPERVISED/RESTRICTED) | ✅ Complete |
| workload-governance.js | Workload state (NORMAL/ELEVATED/SATURATED) | ✅ Complete |
| priority-manager.js | System health classification | ✅ Complete |
| initiative-discipliner.js | Opportunity surfacing | Partial — classification works, event wiring missing |
| operator-buffer.json | Human approval checkpoints | Partial — exists, not wired to execution dispatch |
| kill-switch.json | Global/action disable | ✅ Complete |

#### Follow-up Engine
| Component | Status |
|---|---|
| followup-engine.js | ✅ Production — hourly HubSpot polling + cadence emails |
| response-webhook.js | ✅ Production — port 3002, marks HubSpot contacts alive |
| weekly-report.js | ✅ Production — generates reports |
| ecosystem.followup.config.js | ✅ PM2 config ready |

#### Form & Webhook Infrastructure
| Component | Status |
|---|---|
| submit-audit.js | ✅ Production — port 3001, form handler + HubSpot + email |
| sign-trial.html | ✅ Live — /sign-trial |
| sign-csa.html | ✅ Live — /sign-csa |
| pipeline-leak-audit.html | ✅ Live — /pipeline-leak-audit |

### 2.2 N8N Responsibilty Analysis

N8N responsibilities, mapped to Moosa's current capability:

| N8N Responsibility | Current Moosa Capability | Gap |
|---|---|---|
| Trigger handling (webhooks, cron) | Partial — OpenClaw cron, no webhook router | Gap: No structured webhook event routing |
| Workflow orchestration | Partial — execution-planner.js plans exist, no active dispatch | Gap: No runtime engine to execute plans |
| Task scheduling | Partial — OpenClaw cron, no scheduled job registry | Gap: No job scheduling beyond cron |
| Delayed execution | ❌ Not implemented | Gap: No delayed job support |
| Retry logic | ❌ Not implemented | Gap: No retry policies |
| State persistence | Partial — JSON files | Gap: No transactional state, no Supabase |
| Queue management | ❌ Not implemented | Gap: No durable job queue |
| Tool execution | Partial — subagents, exec | Gap: No standardized tool adapter pattern |
| External API integrations | Partial — HubSpot, SMTP, WhatsApp (ad-hoc) | Gap: No formal adapter framework |
| Conditional branching | Partial — execution-planner.js has step conditions | Gap: Not evaluated at runtime |
| Event-driven automation | ❌ Not implemented | Gap: No event bus |
| Human approval checkpoints | Partial — operator-buffer.json exists | Gap: Not enforced at step execution |
| Failure recovery | Partial — kill switch exists | Gap: No auto-recovery, no resume |
| Execution history | Partial — audit_log in execution-plans.json | Gap: No structured history, not immutable |
| Audit logging | Partial — scattered | Gap: No unified audit trail |
| Agent-to-agent coordination | Partial — subagent spawning | Gap: No coordination protocol, event-based |
| Background workers | Partial — PM2 processes | Gap: No job-level worker coordination |
| Long-running task management | ❌ Not implemented | Gap: No pause/resume |
| Notification routing | Partial — email/webhook | Gap: No centralized notification system |
| Webhook handling | Partial — response-webhook.js on port 3002 | Gap: No general webhook receiver |
| Cron execution | ✅ OpenClaw cron | Complete |
| Multi-step chains | Partial — execution-planner has them | Gap: Runtime execution not wired |
| Dependency-aware execution | Partial — step dependencies defined | Gap: Not evaluated at dispatch |
| Structured execution policies | ✅ safe-action-zones.js | Complete |
| Autonomous but governed | Partial — safe-action-zones classified | Gap: Governance not enforced at dispatch |

### 2.3 What Exists That We Build On

These existing components are production-ready and will be preserved/integrated:
- PM2 process management
- OpenClaw gateway + cron
- safe-action-zones.js (action classification)
- workload-governance.js (workload state)
- priority-manager.js (health classification)
- kill-switch.json (global kills)
- followup-engine.js (integration pattern reference)
- All existing handlers in src/handlers/

### 2.4 Gap Summary

| Category | Current | Target | Gap |
|---|---|---|---|
| State persistence | JSON files | Supabase PostgreSQL | Major |
| Job queue | None | Redis-backed durable queue | Major |
| Event bus | None | Redis pub/sub | Major |
| Workflow runtime | Plans exist, no execution | Full runtime engine | Major |
| Trigger system | OpenClaw cron only | Webhook + event + cron router | Major |
| Approval enforcement | operator-buffer exists | Wired to step dispatch | Medium |
| Observability | Scattered logs | Centralized metrics + traces | Medium |
| Integration adapters | Ad-hoc | Formal adapter pattern | Medium |
| Agent coordination | Subagent spawning | Event-based protocol | Medium |
| TypeScript | No | Yes | Medium |

---

## 3. Recommended System Design

### 3.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         MOOSA ORCHESTRATION FRAMEWORK                 │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐│
│  │   TRIGGER    │  │   WORKFLOW   │  │      INTEGRATION             ││
│  │   SYSTEM     │→ │   RUNTIME    │→ │      FRAMEWORK               ││
│  │              │  │              │  │                              ││
│  │ • Webhooks   │  │ • Plan Loader│  │ • HubSpot Adapter            ││
│  │ • Cron       │  │ • Step Gate  │  │ • SMTP Adapter               ││
│  │ • Events     │  │ • Dispatch   │  │ • WhatsApp Adapter           ││
│  │ • Manual     │  │ • Result Col │  │ • Cloudflare Adapter         ││
│  └──────────────┘  └──────────────┘  │ • Supabase Adapter           ││
│           │               │          │ • OpenClaw Adapter          ││
│           ▼               ▼          └──────────────────────────────┘│
│  ┌──────────────┐  ┌──────────────┐            │                       │
│  │   EVENT BUS  │  │   JOB QUEUE  │←───────────┘                       │
│  │              │  │              │                                    │
│  │ (Redis pub/  │  │ (Redis lists │                                    │
│  │  sub +       │  │  + Supabase  │                                    │
│  │  Supabase    │  │  persistence)│                                    │
│  │  event log)  │  │              │                                    │
│  └──────────────┘  └──────────────┘                                    │
│           │               │                                           │
│           ▼               ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                    PERSISTENCE LAYER (Supabase PostgreSQL)        ││
│  │                                                                      ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ ││
│  │  │ executions  │  │    jobs     │  │   events    │  │   audit   │ ││
│  │  │  (plans +   │  │  (queue +   │  │  (event     │  │   (all    │ ││
│  │  │   steps)    │  │   state)    │  │   history)  │  │ decisions)│ ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                    OBSERVABILITY LAYER                             ││
│  │  Health │ Metrics │ Traces │ Logs │ Dashboards │ Alerting          ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                    HUMAN OVERSIGHT LAYER                           ││
│  │  Operator Buffer │ Approval UI │ Execution Override │ Kill Switch ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Design Principles

1. **Supabase is the state backbone** — All durable state (executions, jobs, events, audit) lives in Supabase PostgreSQL. Redis handles queue operations and pub/sub events. JSON files are deprecated for orchestration state.

2. **Execution is event-driven** — Triggers emit events → Event bus routes → Orchestrator queues jobs → Workers consume → Results emit events → Cycle continues.

3. **Workers are stateless consumers** — Workers pull from Redis queue, execute, write results to Supabase, emit completion event. No in-memory state.

4. **Plans are durable** — Execution plans are stored in Supabase. On crash, the orchestrator reloads active plans and resumes from the last checkpoint.

5. **Governance is enforced at the gate** — Before any step executes, it passes through the Execution Policy Engine (safe-action-zones + operator-buffer + workload state). RESTRICTED actions never auto-execute.

6. **Modularity through contracts** — Every subsystem exposes a defined interface. Adapters, handlers, and workers communicate through events and structured payloads, not direct imports.

### 3.3 Event-Driven Execution Flow

```
[Trigger] → Event Bus → [Orchestrator] → Job Queue (Redis) → [Worker Pool]
                              ↓                                  ↓
                        Supabase                          Supabase
                      (execution                       (result write)
                       state update)                           ↓
                              ↓                           Event Bus
                        [Completion Handler] ←──────────────────┘
```

### 3.4 API Contract Pattern

All internal modules communicate through typed contracts:

```typescript
// Event contract
interface OrchestrationEvent {
  event_id: string;
  event_type: string;
  payload: object;
  source: string;
  timestamp: ISO8601;
  correlation_id?: string;
}

// Job contract
interface Job {
  job_id: string;
  job_type: string;
  priority: 1 | 2 | 3;
  payload: object;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'dead_letter';
  retry_count: number;
  max_retries: number;
  created_at: ISO8601;
  scheduled_at?: ISO8601;
  started_at?: ISO8601;
  completed_at?: ISO8601;
  error?: string;
  worker_id?: string;
  execution_plan_id?: string;
  step_id?: string;
}

// Execution plan contract
interface ExecutionPlan {
  plan_id: string;
  description: string;
  created_by: string;
  created_at: ISO8601;
  updated_at: ISO8601;
  plan_status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'ABANDONED';
  steps: ExecutionStep[];
  current_step_index: number;
  context: object;  // execution context, persisted at checkpoints
}

interface ExecutionStep {
  step_id: string;
  plan_id: string;
  description: string;
  action_type: 'SAFE_AUTONOMOUS' | 'SUPERVISED' | 'RESTRICTED';
  action_category: string;
  dependencies: string[];  // step_ids that must complete first
  conditions?: ConditionalLogic;
  approval_required: boolean;
  step_status: 'PENDING' | 'READY' | 'AWAITING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  executed_at?: ISO8601;
  execution_result?: object;
  failure_reason?: string;
}
```

---

## 4. Proposed Subsystem Map

### 4.1 Subsystem Overview

| # | Subsystem | Responsibility | Priority |
|---|---|---|---|
| 1 | Workflow Runtime Engine | Loads plans, evaluates dependencies, gates execution, dispatches steps | P0 |
| 2 | Trigger System | Webhook receiver, cron router, event listeners, manual triggers | P0 |
| 3 | Queue & Worker System | Durable Redis queue, worker pool, retry policies, dead letter | P0 |
| 4 | Execution Policy Engine | Action classification, approval gating, workload checks | P0 |
| 5 | State & Persistence Layer | Supabase schema, migrations, checkpoint/resume | P0 |
| 6 | Integration Framework | Typed adapters for all external systems | P1 |
| 7 | Event Bus | Redis pub/sub + Supabase event log, event routing | P1 |
| 8 | Observability Layer | Health, metrics, traces, logs, dashboards | P1 |
| 9 | Human Oversight Layer | Operator buffer, approval UI, kill switch, override | P1 |
| 10 | Autonomous Coordination Layer | Agent messaging, delegation, cross-agent execution | P2 |

### 4.2 Subsystem Detail

#### Subsystem 1: Workflow Runtime Engine

**Location:** `orchestration/runtime/`
**State:** Supabase `executions` table

**Responsibilities:**
- Load execution plans from Supabase on startup and after crash
- Evaluate step dependencies using directed acyclic graph (DAG) resolution
- Determine which steps are READY to execute (dependencies met, not blocked)
- Pass each step through Execution Policy Engine before dispatch
- Dispatch approved steps to job queue with correct priority
- Collect results from workers via event bus
- Update step status and plan status in Supabase
- Handle pause (mark plan PAUSED, persist context checkpoint)
- Handle resume (reload plan, continue from last incomplete step)
- Emit plan.completed, plan.failed events on terminal states

**Key functions:**
```
loadPlan(plan_id) → ExecutionPlan
evaluateReadySteps(plan) → ExecutionStep[]
dispatchStep(step, worker_pool) → job_id
collectResult(job_id) → step result
advancePlan(plan_id) → updated plan
checkpointPlan(plan_id) → persist context to Supabase
resumePlan(plan_id) → reload and continue
```

#### Subsystem 2: Trigger System

**Location:** `orchestration/triggers/`
**State:** Supabase `trigger_configs` table + Redis pub/sub channels

**Trigger Types:**

| Type | Source | Handler |
|---|---|---|
| `webhook` | External HTTP POST | WebhookReceiver (port 3003) |
| `cron` | OpenClaw cron | CronTrigger → event bus |
| `event` | Internal system events | EventRouter subscribes to event bus |
| `queue_threshold` | Job queue depth cross threshold | QueueMonitor |
| `manual` | Operator command via OpenClaw | ManualTrigger API |

**Webhook Receiver:**
- HTTP server on port 3003
- Validates incoming webhook signatures (per integration)
- Routes to correct handler based on event type
- Emits events to event bus
- Returns acknowledgment immediately (async processing)

**Event Routing:**
```
Incoming Event → Identify trigger type → Validate → Emit to event bus
                                                      ↓
                              EventRouter subscribes → matches workflow bindings
                                                      ↓
                              Orchestrator creates plan or queues job
```

#### Subsystem 3: Queue & Worker System

**Location:** `orchestration/queue/` + `orchestration/workers/`
**State:** Redis (queue) + Supabase `jobs` table (persistence)

**Queue Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                         REDIS                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ job:pending │  │ job:retry   │  │ job:dead_letter      │ │
│  │ (sorted set)│  │ (sorted set)│  │ (list)               │ │
│  │ priority +  │  │ score =     │  │ failed after max     │ │
│  │ timestamp   │  │ next_retry  │  │ retries              │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐│
│  │ events:*    │  │ workers:heartbeat (hash)                 ││
│  │ (pub/sub)   │  │ worker_id → last_heartbeat_ts            ││
│  └─────────────┘  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE (persistent)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ jobs                                                    │   │
│  │ job_id, job_type, payload, status, retry_count,        │   │
│  │ created_at, scheduled_at, started_at, completed_at,     │   │
│  │ error, worker_id, priority, max_retries                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Job Flow:**
1. Orchestrator enqueues job → Redis `job:pending` + Supabase `jobs` record
2. Worker pulls from Redis `job:pending` (blocking pop with BRPOP)
3. Worker updates Supabase `status=executing`, `started_at`, `worker_id`
4. Worker executes job
5. On success: Worker updates Supabase `status=completed`, writes result
6. On failure: Worker checks retry policy → if retries remain, requeue to `job:retry`; else → `job:dead_letter`
7. Worker emits `job.completed` or `job.failed` event to event bus

**Retry Policy (configurable per job_type):**
```javascript
const DEFAULT_RETRY_CONFIG = {
  max_attempts: 3,
  backoff_multiplier: 2,
  initial_delay_ms: 5000,
  max_delay_ms: 300000,  // 5 minutes
  // Retry at: 5s, 10s, 20s (exponential backoff)
};

const JOB_TYPE_RETRY_OVERRIDES = {
  'send_email': { max_attempts: 5, initial_delay_ms: 1000 },
  'hubspot_api': { max_attempts: 3, initial_delay_ms: 3000 },
  'spawn_subagent': { max_attempts: 2, initial_delay_ms: 10000 },
};
```

**Worker Pool:**
- Configurable worker count (default: 3 workers)
- Workers register heartbeat in Redis `workers:heartbeat` hash
- Health monitor checks heartbeat age; marks worker dead if >60s no heartbeat
- Dead worker jobs are re-queued (Supabase `status` still `executing` → needs recovery scan)
- Recovery scan runs on orchestrator startup: find `executing` jobs with dead workers → re-queue

#### Subsystem 4: Execution Policy Engine

**Location:** `orchestration/policy/` (wraps existing `src/handlers/safe-action-zones.js`)
**State:** Supabase `policy_decisions` table (audit log)

**Responsibilities:**
- Classify every action before execution (SAFE_AUTONOMOUS / SUPERVISED / RESTRICTED)
- Check system status (from priority-manager.js integration)
- Check workload state (from workload-governance.js integration)
- Check operator buffer (pending approvals)
- Enforce kill switch
- Log every policy decision to Supabase `policy_decisions` audit table

**Policy Gate Flow:**
```
Step dispatch request
        ↓
[Classify Action] → safe-action-zones.js
        ↓
[System Status Check] → priority-manager.js
        ↓
[Workload Check] → workload-governance.js
        ↓
[Kill Switch Check] → kill-switch.json
        ↓
[Approval Check] → operator-buffer.json (Supabase)
        ↓
   ┌────────────────────────────────────┐
   │         DECISION: ALLOWED?        │
   └────────────────────────────────────┘
        ↓              ↓
      YES              NO
        ↓              ↓
   Dispatch         Surface to operator
   to queue         (await approval)
        ↓              ↓
   Log policy       Log policy decision
   decision         + wait state
```

**Approval Integration:**
- When blocked: write to Supabase `operator_approvals` table
- Emit `approval.requested` event to event bus
- Operator (Ahmad) sees pending approvals via observability layer
- Operator approves via command → Supabase updated → event emitted → step re-evaluated

#### Subsystem 5: State & Persistence Layer

**Location:** `orchestration/persistence/`
**Database:** Supabase PostgreSQL

**Schema Design:**

```sql
-- Executions: execution plans and steps
CREATE TABLE executions (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  plan_status TEXT NOT NULL DEFAULT 'DRAFT',
  current_step_index INTEGER DEFAULT 0,
  context JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps for observability
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Terminal state info
  terminal_reason TEXT,
  is_terminal BOOLEAN DEFAULT false
);

CREATE TABLE execution_steps (
  step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES executions(plan_id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  description TEXT NOT NULL,
  
  -- Action classification
  action_type TEXT NOT NULL,  -- SAFE_AUTONOMOUS | SUPERVISED | RESTRICTED
  action_category TEXT NOT NULL,  -- read_only | housekeeping | notification | critical | ...
  action_payload JSONB NOT NULL,  -- the actual thing to execute
  
  -- Dependencies
  dependencies UUID[] DEFAULT '{}',
  conditions JSONB,  -- conditional logic for step execution
  
  -- Status
  step_status TEXT NOT NULL DEFAULT 'PENDING',
  
  -- Approval tracking
  approval_required BOOLEAN DEFAULT false,
  approval_token TEXT,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  
  -- Execution tracking
  executed_at TIMESTAMPTZ,
  execution_result JSONB,
  failure_reason TEXT,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(plan_id, step_id)
);

-- Jobs: queue items
CREATE TABLE jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 2,  -- 1=high, 2=medium, 3=low
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- Execution state
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  scheduled_at TIMESTAMPTZ,  -- for delayed jobs
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Result
  error TEXT,
  result JSONB,
  
  -- Worker assignment
  worker_id TEXT,
  
  -- Linking to execution plan/step
  execution_plan_id UUID REFERENCES executions(plan_id),
  step_id UUID REFERENCES execution_steps(step_id),
  
  -- Indexes
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_priority (priority),
  INDEX idx_jobs_scheduled (scheduled_at)
);

-- Events: immutable event log
CREATE TABLE events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  correlation_id UUID,
  caused_by_job_id UUID REFERENCES jobs(job_id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  INDEX idx_events_type (event_type),
  INDEX idx_events_created (created_at),
  INDEX idx_events_correlation (correlation_id)
);

-- Audit log: all policy decisions
CREATE TABLE policy_decisions (
  decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL,
  
  -- Context
  plan_id UUID REFERENCES executions(plan_id),
  step_id UUID REFERENCES execution_steps(step_id),
  job_id UUID REFERENCES jobs(job_id),
  
  -- Decision
  decision TEXT NOT NULL,  -- ALLOWED | BLOCKED | APPROVED | REJECTED
  reason TEXT,
  system_status TEXT,
  workload_state TEXT,
  
  -- Operator input (if blocked was approved later)
  operator_id TEXT,
  operator_decision TEXT,
  operator_decided_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  INDEX idx_policy_plan (plan_id),
  INDEX idx_policy_created (created_at)
);

-- Operator approvals: human checkpoint queue
CREATE TABLE operator_approvals (
  approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES executions(plan_id),
  step_id UUID REFERENCES execution_steps(step_id),
  job_id UUID REFERENCES jobs(job_id),
  
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | APPROVED | REJECTED | EXPIRED
  requested_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  
  operator_id TEXT,
  operator_comment TEXT,
  
  INDEX idx_approvals_pending (status, requested_at)
);

-- Worker health tracking
CREATE TABLE worker_health (
  worker_id TEXT PRIMARY KEY,
  last_heartbeat TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'alive',  -- alive | dead | unknown
  current_job_id UUID REFERENCES jobs(job_id),
  started_job_at TIMESTAMPTZ
);
```

**Checkpoint/Resume:**
- On every step completion: `context` field in `executions` table is updated with current execution state
- On crash: orchestrator reads all `ACTIVE` plans, reloads `context`, evaluates next steps
- Long-running jobs: context includes current position in multi-step operations

#### Subsystem 6: Integration Framework

**Location:** `orchestration/adapters/`
**Pattern:** All adapters implement a standard interface:

```typescript
interface IntegrationAdapter {
  name: string;
  
  // Execute an action through this integration
  send(action: AdapterAction): Promise<AdapterResult>;
  
  // Handle incoming webhook/event
  receive(event: RawEvent): void;
  
  // Health check
  healthCheck(): Promise<HealthStatus>;
  
  // Retry configuration for this adapter
  retryConfig(): RetryConfig;
  
  // Validate configuration
  validateConfig(): ValidationResult;
}
```

**Initial Adapters:**

| Adapter | Systems | Priority |
|---|---|---|
| HubSpotAdapter | HubSpot CRM API | P0 |
| SMTPAdapter | Email via port 587 STARTTLS | P0 |
| WhatsAppAdapter | OpenClaw WhatsApp (sessions_send) | P1 |
| CloudflareAdapter | Cloudflare API (DNS, Pages, Workers) | P1 |
| SupabaseAdapter | Supabase client + admin operations | P0 |
| OpenClawAdapter | Subagent spawning, cron, session messaging | P0 |
| GitHubAdapter | Repository operations | P2 |
| HttpAdapter | Generic HTTP requests (fallback for others) | P1 |

**Adapter Pattern for Follow-up Engine Refactor:**
- Current `followup-engine.js` calls HubSpot API directly with node-fetch
- New: `HubSpotAdapter.send({ action: 'search_contacts', params: {...} })`
- Adapter handles: auth refresh, rate limiting, error handling, retries
- Enables: swap HubSpot for another CRM by swapping adapter

#### Subsystem 7: Event Bus

**Location:** `orchestration/events/`
**Implementation:** Redis pub/sub + Supabase event persistence

**Event Bus Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                        EVENT BUS                                 │
│                                                                  │
│  Publishers → Channel routing → Subscriber matching              │
│                                                                  │
│  Redis Pub/Sub (real-time) + Supabase events table (persisted)   │
└─────────────────────────────────────────────────────────────────┘
```

**Channels/Topics:**
```
plan.created
plan.updated
plan.step.completed
plan.step.failed
plan.completed
plan.failed
plan.paused
plan.resumed

job.queued
job.started
job.completed
job.failed
job.retry_scheduled
job.dead_lettered

approval.requested
approval.received
approval.rejected
approval.expired

system.status_changed
system.health_check
system.alert

worker.registered
worker.heartbeat
worker.dead
worker.job_started
worker.job_completed
```

**Event Flow:**
1. Component emits event → EventBus.publish(topic, payload)
2. EventBus writes to Supabase `events` table (immutable log)
3. EventBus publishes to Redis channel `events:{topic}`
4. All subscribers to that channel receive the event
5. Subscribers process asynchronously (queue their own jobs)

**Subscriber Pattern:**
```javascript
eventBus.subscribe('plan.step.completed', async (event) => {
  // Handle: advance plan, check for next steps, emit next events
});
```

#### Subsystem 8: Observability Layer

**Location:** `orchestration/observability/`

**Components:**

| Component | Purpose | Endpoint/Interface |
|---|---|---|
| HealthServer | System health check | GET /health |
| MetricsCollector | Aggregate metrics | GET /metrics |
| ExecutionTracer | Per-step execution traces | Internal |
| LogAggregator | Structured log aggregation | Internal |
| AlertRouter | Forward critical alerts | Internal → WhatsApp/email |
| ExecutionDashboard | HTML dashboard (optional) | GET /observability |

**Metrics:**
```javascript
const METRICS = {
  // Job metrics
  'jobs.pending.count': gauge,
  'jobs.executing.count': gauge,
  'jobs.completed.total': counter,
  'jobs.failed.total': counter,
  'jobs.dead_letter.count': gauge,
  'jobs.average_duration_ms': histogram,
  
  // Plan metrics
  'plans.active.count': gauge,
  'plans.blocked.count': gauge,  // waiting on approval
  'plans.completed.total': counter,
  'plans.failed.total': counter,
  
  // Worker metrics
  'workers.alive.count': gauge,
  'workers.dead.count': gauge,
  'workers.average_job_duration_ms': histogram,
  
  // System metrics
  'system.health_score': gauge,
  'system.workload_state': gauge,
  'queue.oldest_job_age_seconds': gauge,
  
  // Policy metrics
  'policy.decisions.allowed': counter,
  'policy.decisions.blocked': counter,
  'policy.approvals.pending': gauge,
};
```

**Health Check Response:**
```json
{
  "status": "healthy|degraded|unhealthy|critical",
  "timestamp": "ISO8601",
  "checks": {
    "supabase": "ok|error",
    "redis": "ok|error",
    "workers_alive": 3,
    "jobs_pending": 5,
    "plans_active": 2
  },
  "health_score": 0.95,
  "workload_state": "NORMAL",
  "uptime_seconds": 86400
}
```

#### Subsystem 9: Human Oversight Layer

**Location:** `orchestration/oversight/`

**Components:**

1. **Operator Approval Queue** — Pending approvals from Supabase `operator_approvals` table
2. **Approval Notification** — When blocked, emit WhatsApp message to Ahmad with details
3. **Execution Override** — Ahmad can cancel, pause, or force-complete any plan via command
4. **Kill Switch UI** — Visual interface for global and per-action kill switches
5. **Execution Browser** — View any plan's execution history, step by step

**Approval Flow:**
```
Step blocked by policy
        ↓
Write to operator_approvals (status=PENDING)
        ↓
Emit approval.requested event
        ↓
AlertRouter → WhatsApp to Ahmad: "Plan [X] step [Y] needs approval: [description]"
        ↓
Ahmad replies "approve [token]" or reviews via dashboard
        ↓
Supabase updated (status=APPROVED/REJECTED)
        ↓
Event emitted → Orchestrator re-evaluates step
```

#### Subsystem 10: Autonomous Coordination Layer

**Location:** `orchestration/coordination/`
**Priority:** P2 — not in initial implementation

**Purpose:** Enable future Moosa instances to coordinate with each other or with sub-agents through the orchestration framework.

**Design:**
- Each agent (Moosa main, C-suite subagents) has an `agent_id`
- Agents communicate through event bus (not direct messaging)
- Delegation: main agent creates a sub-plan, emits `agent.task_assigned` → sub-agent picks up
- Cross-agent execution: plan spans multiple agents, orchestrated through event coordination

---

## 5. Recommended Execution Phases

### Phase 1: Discovery & Architecture (2 weeks)

**Objective:** Complete inventory, dependency mapping, architectural finalization

**Tasks:**
1. Full capability inventory of existing systems (completed in Section 2)
2. N8N workflow analysis — what would need to be replicated (not applicable — no N8N in production)
3. Dependency mapping — map all internal system dependencies
4. Supabase schema design — finalize PostgreSQL schema (Section 4, Subsystem 5)
5. Redis sizing and configuration
6. Architectural proposal finalization → this document
7. Risk analysis refinement (Section 7)
8. Implementation tooling setup (TypeScript, testing framework)

**Deliverables:**
- Finalized schema design
- Redis configuration
- TypeScript project scaffold
- Risk register updated

**Completion criteria:** Document approved, schema reviewed, tooling ready

---

### Phase 2: Core Runtime Architecture (2 weeks)

**Objective:** Build the foundational runtime — queue engine, trigger framework, persistence model

**Tasks:**
1. Set up TypeScript project with proper module structure
2. Configure Supabase client + connection pooling
3. Configure Redis client (node-redis)
4. Build `persistence/` layer — Supabase schema + migration scripts
5. Build `queue/` — job-enqueue, job-dequeue, job-complete, job-fail operations
6. Build `events/` — event bus with Redis pub/sub + Supabase persistence
7. Build `triggers/webhook-receiver.ts` — HTTP server on port 3003
8. Build `triggers/event-router.ts` — event routing to workflows
9. Build `triggers/cron-trigger.ts` — bridge OpenClaw cron → event bus

**Deliverables:**
- Working queue system (enqueue → dequeue → complete cycle)
- Event bus with persistence
- Webhook receiver running on port 3003
- Event routing working

**Completion criteria:** Can enqueue a job, have a worker pick it up, complete it, and see the event in the log

---

### Phase 3: Internal Workflow Engine MVP (2 weeks)

**Objective:** Execute a multi-step plan through the orchestration framework

**Tasks:**
1. Build `runtime/execution-engine.ts` — plan loader, step evaluator, dispatcher
2. Wire `safe-action-zones.js` into step dispatch gate (Execution Policy Engine)
3. Wire `operator-buffer.json` (Supabase-backed) for approval checkpoints
4. Build `workers/generic-worker.ts` — generic worker that pulls from queue and executes
5. Implement retry logic with exponential backoff
6. Implement crash recovery — on startup, reload active plans
7. Build dead letter queue handling
8. End-to-end test: create plan with 3 steps, execute through orchestrator, verify completion

**Deliverables:**
- Execution plan created → steps dispatched → executed → completed
- Policy gate enforced (SAFE_AUTONOMOUS vs SUPERVISED vs RESTRICTED)
- Approval checkpoint blocking/restoring flow working
- Retry and dead letter handling working

**Completion criteria:** A 3-step plan with mixed action types executes correctly, including one that requires approval, through the full cycle

---

### Phase 4: Shadow Mode + Validation (2 weeks)

**Objective:** Run orchestration framework in parallel with existing systems, validate correctness

**Tasks:**
1. Run orchestration framework in parallel (not replacing any existing systems)
2. Implement all integration adapters (HubSpot, SMTP, WhatsApp, Cloudflare)
3. Migrate followup-engine.js to use orchestration framework (via adapter)
4. Run followup-engine side-by-side: old (direct API calls) vs new (orchestration) → compare outputs
5. Run Business Disruptor report generation through orchestrator
6. Validate: identical outputs, no data loss, proper retry behavior
7. Load testing: simulate 10x normal job volume, verify queue holds

**Deliverables:**
- All integration adapters built and tested
- Follow-up engine migrated
- Shadow mode validation report
- Load test results

**Completion criteria:** Orchestration framework produces identical results to existing systems under shadow mode, passes load test

---

### Phase 5: Gradual Migration (2-4 weeks)

**Objective:** Begin migrating specific workflows to orchestration framework, with rollback capability

**Tasks:**
1. Migrate C-suite morning spawn cron to orchestration framework (replace OpenClaw cron trigger with webhook + orchestration)
   - OpenClaw cron still fires → triggers webhook → orchestration handles C-suite spawn
   - Rollback: revert to direct OpenClaw cron
2. Migrate daily SoD report generation to orchestration
3. Migrate LinkedIn post delivery workflow (CMO → approved post → publish) to orchestration
4. Migrate HubSpot contact creation workflow to orchestration
5. Monitor for 2 weeks: error rates, execution times, reliability

**Deliverables:**
- 3+ real workflows running on orchestration framework
- Monitoring dashboards showing execution quality
- Rollback procedures documented and tested

**Completion criteria:** Real production workflows running on orchestration with improved observability and no regression in reliability

---

### Phase 6: Full Retirement + Optimization (2 weeks)

**Objective:** Retire external orchestration dependencies (N8N), optimize, enhance

**Tasks:**
1. Verify no remaining N8N dependencies (none exist currently)
2. Optimize: identify bottlenecks, tune queue processing, worker count
3. Add: Autonomous Coordination Layer (agent messaging)
4. Add: advanced observability (distributed tracing if multiple workers)
5. Add: self-healing for stuck plans (auto-detect stuck → attempt repair)
6. Add: execution optimization advisor (analyze metrics → suggest improvements)
7. Document operational runbook for the orchestration framework
8. Propose future enhancements for Phase 7

**Deliverables:**
- Full N8N-free infrastructure (already achieved — no N8N in production)
- Optimized execution performance
- Self-healing capabilities
- Operational documentation

---

## 6. Migration Strategy

### 6.1 General Principles

1. **No big-bang migration** — Each workflow migrates individually, validated, then switched
2. **Parallel running** — Old and new systems run simultaneously during transition
3. **Rollback capability** — Every migration has a documented rollback procedure
4. **Observability first** — Can't migrate what you can't measure; ensure metrics are in place before migrating

### 6.2 Migration Priority Order

| Priority | Workflow | Reason |
|---|---|---|
| 1 | Follow-up Engine (hourly cadence) | Core product, well-understood, high value |
| 2 | C-suite Morning Spawn | Daily, critical, measurable |
| 3 | Daily SoD Report | Daily, measurable, low risk |
| 4 | LinkedIn Post Delivery | Frequent, measurable |
| 5 | HubSpot Contact Sync | Core integration |
| 6 | Business Disruptor Report | Weekly, lower priority |

### 6.3 Rollback Procedures

Each migration includes:
1. **Pre-migration snapshot** — Record current system state
2. **Feature flag** — New system off by default, enable per workflow
3. **Dual write** — During transition, both old and new systems receive events
4. **Comparison check** — Outputs compared; if mismatch, rollback
5. **Quick rollback command** — Single command to disable orchestration and revert to old system

---

## 7. Risk Analysis

### 7.1 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supabase connection failures cause execution delays | Medium | High | Redis queue remains available even if Supabase is slow; connection pooling + retries |
| Redis pub/sub event loss under high load | Low | Medium | Events also persisted to Supabase; consumers can replay from Supabase if missed |
| Worker crash leaves jobs in executing state | Medium | Medium | Recovery scan on startup; jobs stuck in executing >threshold → re-queue |
| Approval timeout blocks critical workflows | Low | High | Configurable approval timeout; expired approvals → auto-notify |
| Schema migration breaks existing state | Low | Critical | Migration scripts tested on copy; backward-compatible migrations only |
| Job queue grows faster than workers can process | Low | Medium | Auto-scaling worker pool (up to max configured); backpressure signaling |
| Integration adapter API changes break execution | Medium | Medium | Adapter version pinning; API version detection; fallback to cached behavior |
| Memory leaks in long-running worker processes | Medium | Medium | PM2 restart on memory threshold; worker recycling every 1000 jobs |
| Event bus circular dependency causes infinite loops | Low | Critical | Event emission depth limit (max 10 hops per correlation_id); dead-letter events |

### 7.2 Risk Mitigation Priority

1. **Data loss prevention** — Supabase persistence + event log means no data loss even on crash
2. **Execution continuity** — Workers auto-restart via PM2; recovery scan re-queues stuck jobs
3. **Approval unblocking** — Approval timeouts escalate automatically to prevent permanent blocks

---

## 8. Failure-Mode Analysis

### 8.1 Execution Failure Modes

| Failure Mode | Detection | Response |
|---|---|---|
| Step fails → retry available | Worker emits `job.failed`, retry count < max | Re-queue with backoff delay |
| Step fails → retries exhausted | Worker emits `job.dead_lettered` | Notify operator, halt plan execution, emit `plan.failed` |
| Plan execution reaches dead end | Plan has no READY steps and is not complete | Surface to operator as blocked plan |
| Worker dies mid-execution | Heartbeat timeout (60s no heartbeat) | Recovery scan: find jobs with dead worker, re-queue |
| Supabase writes fail | Database error thrown in worker | Retry with backoff; if persistent, queue job for manual review |
| Event bus subscriber crashes | Event emitted but not processed | Dead letter event created; re-emit after subscriber restart |
| Approval request times out | Configurable timeout (default 1h) | Notify operator, mark approval EXPIRED, surface as blocked |

### 8.2 Recovery Procedures

| Scenario | Recovery Procedure |
|---|---|
| Orchestrator crash | Restart process; recovery scan loads all ACTIVE plans; evaluates next steps |
| Worker crash mid-job | Job remains in `executing` state; heartbeat miss detected → recovery scan re-queues job |
| Redis restart | Redis is ephemeral; jobs also in Supabase; workers reconnect and continue |
| Supabase unavailable | Workers cannot update state but continue executing; queue builds in Redis; when Supabase returns, sync job states from queue |
| Network partition | Same as Supabase unavailable; continue with local queue; sync on reconnect |

### 8.3 Idempotency

All job types are designed to be safely retried:
- Jobs include a unique `job_id`
- Job handler checks if job already completed before re-executing
- Adapter calls are idempotent (HubSpot upsert vs create, SMTP deduplication by message-id)

---

## 9. Security/Governance Considerations

### 9.1 Security Model

1. **No external orchestration SaaS** — All execution is local; no third-party can trigger or access workflows
2. **Webhook signature validation** — All incoming webhooks validated with HMAC signatures per integration
3. **Secret management** — All API keys/tokens stored in `/home/node/.openclaw/secrets/`, never in code or state files
4. **Adapter credential scoping** — Each adapter has only the credentials it needs (principle of least privilege)
5. **Execution isolation** — Each job runs in isolated context; can't affect other jobs

### 9.2 Governance Preserved

| Requirement | Implementation |
|---|---|
| SAFE_AUTONOMOUS unchanged | Execution Policy Engine uses existing safe-action-zones.js |
| RESTRICTED never auto-executes | RESTRICTED actions always require operator approval |
| Approval discipline maintained | Operator buffer (Supabase) enforced before any SUPERVISED/RESTRICTED step |
| No silent execution widening | All policy decisions logged; audit trail immutable |
| Operator override always available | Kill switch, execution cancel, plan abandon all available |

### 9.3 Audit Trail

Every execution produces an immutable audit record:
```javascript
{
  decision_id: UUID,
  decision_type: 'STEP_APPROVAL | JOB_DISPATCH | JOB_COMPLETE | ...',
  action_type: 'SAFE_AUTONOMOUS | SUPERVISED | RESTRICTED',
  decision: 'ALLOWED | BLOCKED | APPROVED | REJECTED',
  reason: 'policy check details',
  system_status: 'HEALTHY',
  workload_state: 'NORMAL',
  operator_id: 'ahmad',
  timestamp: ISO8601,
  correlation_id: UUID  // links all events in a single execution flow
}
```

---

## 10. Recommended Repository Structure

```
/home/node/.openclaw/workspace/
├── orchestration/                          # Main orchestration framework
│   ├── package.json                        # TypeScript project
│   ├── tsconfig.json
│   ├── src/
│   │   ├── runtime/                        # Subsystem 1: Workflow Runtime
│   │   │   ├── execution-engine.ts
│   │   │   ├── plan-loader.ts
│   │   │   ├── step-evaluator.ts
│   │   │   ├── dispatch.ts
│   │   │   └── crash-recovery.ts
│   │   ├── queue/                          # Subsystem 3: Queue & Workers
│   │   │   ├── job-queue.ts
│   │   │   ├── retry-policy.ts
│   │   │   └── dead-letter.ts
│   │   ├── workers/                        # Worker implementation
│   │   │   ├── generic-worker.ts
│   │   │   ├── worker-pool.ts
│   │   │   └── worker-health.ts
│   │   ├── triggers/                       # Subsystem 2: Trigger System
│   │   │   ├── webhook-receiver.ts
│   │   │   ├── event-router.ts
│   │   │   ├── cron-trigger.ts
│   │   │   └── manual-trigger.ts
│   │   ├── policy/                         # Subsystem 4: Execution Policy
│   │   │   ├── execution-policy.ts         # Main gate
│   │   │   ├── action-classifier.ts        # Wraps safe-action-zones.js
│   │   │   ├── approval-checker.ts         # Wraps operator-buffer
│   │   │   └── policy-audit.ts             # Logs to policy_decisions
│   │   ├── events/                         # Subsystem 7: Event Bus
│   │   │   ├── event-bus.ts
│   │   │   ├── event-logger.ts
│   │   │   └── event-schemas.ts
│   │   ├── adapters/                       # Subsystem 6: Integration Framework
│   │   │   ├── adapter.interface.ts
│   │   │   ├── hubspot.adapter.ts
│   │   │   ├── smtp.adapter.ts
│   │   │   ├── whatsapp.adapter.ts
│   │   │   ├── cloudflare.adapter.ts
│   │   │   ├── supabase.adapter.ts
│   │   │   └── openclaw.adapter.ts
│   │   ├── persistence/                    # Subsystem 5: State & Persistence
│   │   │   ├── supabase-client.ts
│   │   │   ├── migrations/
│   │   │   │   └── 001_initial_schema.sql
│   │   │   ├── execution-repo.ts
│   │   │   ├── job-repo.ts
│   │   │   └── event-repo.ts
│   │   ├── observability/                  # Subsystem 8: Observability
│   │   │   ├── health-server.ts
│   │   │   ├── metrics-collector.ts
│   │   │   ├── execution-tracer.ts
│   │   │   ├── alert-router.ts
│   │   │   └── dashboard/
│   │   │       └── index.html
│   │   ├── oversight/                       # Subsystem 9: Human Oversight
│   │   │   ├── approval-queue.ts
│   │   │   ├── kill-switch-ui.ts
│   │   │   └── execution-browser.ts
│   │   ├── coordination/                   # Subsystem 10: Agent Coordination
│   │   │   ├── agent-messaging.ts
│   │   │   └── task-delegation.ts
│   │   └── index.ts                        # Main export
│   └── tests/
│       ├── runtime/
│       ├── queue/
│       └── integration/
│
├── src/handlers/                           # Existing handlers (unchanged)
│   ├── execution-planner.js                # Legacy — migration target
│   ├── deferred-work.js                    # Legacy — migration target
│   ├── safe-action-zones.js                # Consumed by policy engine
│   ├── workload-governance.js              # Consumed by policy engine
│   └── ...
│
├── state/                                  # Existing state (phasing out)
│   ├── execution-plans.json                # Replaced by Supabase executions
│   ├── operator-buffer.json                # Replaced by Supabase operator_approvals
│   ├── kill-switch.json                   # Kept (simple, working)
│   └── ...
│
└── secrets/                                # API keys (never in code)
    ├── hubspot.json
    ├── qiyadon-email.json
    └── cloudflare-api-token.json
```

---

## 11. Infrastructure Requirements

### 11.1 Required Services

| Service | Purpose | Provider |
|---|---|---|
| Supabase | PostgreSQL database (orchestration state) | Supabase (cloud or self-hosted) |
| Redis | Queue + pub/sub event bus | Redis Cloud or self-hosted |
| PM2 | Process management | Already installed |

### 11.2 Supabase Setup

**Option A: Supabase Cloud (recommended for bootstrap)**
- Project: qiyadon-orchestration
- Region: EU (if available, else closest)
- Tier: Free tier initially; scale as jobs grow
- Connection: Use connection string from Supabase dashboard

**Option B: Self-hosted PostgreSQL**
- If data sovereignty required
- Minimum: 2GB RAM, 10GB storage
- Configuration: WAL archiving enabled for point-in-time recovery

### 11.3 Redis Setup

**Option A: Redis Cloud (recommended)**
- Free tier: 30MB, 30 connections
- Database: 1 (orchestration)
- Enable persistence: AOF

**Option B: Self-hosted Redis**
- On same Hetzner server (already running)
- Port: 6379 (non-default port for security)
- Configuration: `appendonly yes`, `maxmemory 256mb`
- Persistence: AOF every 1 second

### 11.4 Resource Sizing

| Component | Initial | At Scale (100 jobs/day) |
|---|---|---|
| Supabase (cloud) | Free tier | $25/month (2GB RAM, 8GB storage) |
| Redis Cloud | Free tier | $30/month (1GB, connected clients) |
| Local Redis | 256MB RAM | 512MB RAM |
| Worker processes | 3 workers × 128MB | 5 workers × 128MB |
| Orchestrator | 1 × 256MB | 1 × 512MB |

### 11.5 Security Configuration

```
# Supabase
- IP allowlist: only Moosa server IP
- Connection encryption: TLS required
- API key: rotated quarterly

# Redis
- AUTH enabled (requirepass)
- TLS if cloud
- Port: non-standard (e.g., 6380)
- Firewall: only Moosa server IP

# OpenClaw/Gateway
- Already has authentication
- WhatsApp session: physical scan for re-auth
```

---

## 12. Queue/Runtime Recommendations

### 12.1 Queue Design

**Architecture choice: Redis + Supabase hybrid**

**Why not pure Redis:**
- Redis is fast but ephemeral — jobs would be lost on Redis restart
- Supabase provides durable state, audit trail, and queryability

**Why not pure Supabase:**
- Polling Supabase for queue would be expensive and slow
- Redis provides the real-time queue operations needed for workers

**Hybrid approach:**
- **Queue operations (enqueue, dequeue, ack):** Redis sorted sets (fast, low-latency)
- **Job state, audit, recovery:** Supabase (durable, queryable)
- **Event bus:** Redis pub/sub (real-time) + Supabase events table (persistence + replay)

### 12.2 Queue Operations

```typescript
// Enqueue: Add job to Redis sorted set + write Supabase record
async function enqueueJob(job: Job): Promise<string> {
  const jobId = await supabaseJobs.create(job);  // Supabase record
  await redis.zadd('job:pending', score(job), jobId);  // Redis queue
  await eventBus.publish('job.queued', { job_id: jobId, ... });
  return jobId;
}

// Dequeue (worker): Blocking pop from Redis, update Supabase status
async function dequeueJob(workerId: string): Promise<Job | null> {
  const result = await redis.bzpopmin('job:pending', 0);  // Block forever until job available
  if (!result) return null;
  
  const jobId = result.member;
  await supabaseJobs.update(jobId, { status: 'executing', worker_id: workerId, started_at: now() });
  return await supabaseJobs.get(jobId);
}

// Complete: Update Supabase, remove from Redis (if retry), emit event
async function completeJob(jobId: string, result: object): Promise<void> {
  await supabaseJobs.update(jobId, { status: 'completed', completed_at: now(), result });
  await eventBus.publish('job.completed', { job_id: jobId, result });
}

// Retry: Re-add to Redis with next retry time
async function retryJob(jobId: string, retryConfig: RetryConfig): Promise<void> {
  const job = await supabaseJobs.get(jobId);
  const nextRetryAt = calculateNextRetry(job.retry_count, retryConfig);
  await supabaseJobs.update(jobId, { status: 'pending', retry_count: job.retry_count + 1 });
  await redis.zadd('job:retry', nextRetryAt, jobId);
  await eventBus.publish('job.retry_scheduled', { job_id: jobId, next_retry_at: nextRetryAt });
}
```

### 12.3 Retry Configuration

```typescript
const RETRY_CONFIGS: Record<string, RetryConfig> = {
  default: { max_attempts: 3, backoff_multiplier: 2, initial_delay_ms: 5000, max_delay_ms: 300000 },
  'send_email': { max_attempts: 5, backoff_multiplier: 2, initial_delay_ms: 2000, max_delay_ms: 60000 },
  'hubspot_api': { max_attempts: 3, backoff_multiplier: 1.5, initial_delay_ms: 5000, max_delay_ms: 120000 },
  'spawn_subagent': { max_attempts: 2, backoff_multiplier: 1, initial_delay_ms: 10000, max_delay_ms: 30000 },
  'database_write': { max_attempts: 5, backoff_multiplier: 2, initial_delay_ms: 1000, max_delay_ms: 60000 },
};
```

### 12.4 Worker Configuration

```typescript
const WORKER_CONFIG = {
  pool_size: 3,                    // Number of concurrent workers
  heartbeat_interval_ms: 10000,   // Worker heartbeat every 10s
  heartbeat_timeout_ms: 60000,   // Worker marked dead if no heartbeat for 60s
  max_jobs_per_worker: 1000,     // Worker recycling after 1000 jobs (memory leak prevention)
  job_timeout_ms: 300000,         // Job killed if running > 5 minutes (except long-running)
  graceful_shutdown_timeout_ms: 30000,  // Wait 30s for in-flight jobs on shutdown
};
```

### 12.5 Job Types (Initial Set)

| job_type | Description | Priority | Retry Config |
|---|---|---|---|
| `execute_step` | Execute an execution plan step | 1 | default |
| `send_email` | Send email via SMTP | 2 | send_email |
| `hubspot_sync` | Sync to HubSpot CRM | 2 | hubspot_api |
| `spawn_subagent` | Spawn a sub-agent session | 1 | spawn_subagent |
| `emit_event` | Emit an event to event bus | 2 | default |
| `health_check` | Run health check on integration | 3 | default |
| `cleanup_job` | Cleanup old jobs/archives | 3 | default |

---

## 13. State Management Strategy

### 13.1 State Architecture

**Two-tier state:**

1. **Hot state (Redis):** Queue operations, heartbeat tracking, pub/sub. Lost on Redis restart — recoverable from Supabase.

2. **Cold state (Supabase):** All execution state, audit logs, event history. Persistent, queryable, source of truth for recovery.

### 13.2 State Transitions

```
[Plan Created]
  → executions table: plan_status=DRAFT
  
[Plan Activated]
  → executions table: plan_status=ACTIVE
  
[Step Ready]
  → execution_steps table: step_status=READY
  
[Step Gated (approval needed)]
  → execution_steps table: step_status=AWAITING_APPROVAL
  → operator_approvals table: inserted

[Step Approved]
  → execution_steps table: step_status=APPROVED
  → operator_approvals table: status=APPROVED

[Step Dispatched]
  → jobs table: job inserted
  → execution_steps table: step_status=EXECUTING

[Step Completed]
  → execution_steps table: step_status=COMPLETED, executed_at, execution_result
  → jobs table: status=completed
  → events table: event emitted

[Plan Completed]
  → executions table: plan_status=COMPLETED, completed_at, is_terminal=true
```

### 13.3 Context Continuity (Checkpoint/Resume)

For long-running plans with multi-step chains:
- Every step completion: persist current `context` to Supabase
- On crash: reload `context` from Supabase → resume execution from last checkpoint
- `context` is plan-specific JSON (e.g., for follow-up engine: `{last_lead_id_processed: 123, cadence_day: 7}`)

### 13.4 State Migration Path

**Phase out JSON files in favor of Supabase:**

| JSON File | Supabase Replacement | Migration |
|---|---|---|
| `execution-plans.json` | `executions` + `execution_steps` tables | Migrate on Phase 3 |
| `operator-buffer.json` | `operator_approvals` table | Migrate on Phase 3 |
| `deferred-work.json` | `executions` table (deferred plans) | Migrate on Phase 3 |
| `opportunity-store.json` | New `opportunities` table | Migrate on Phase 5 |

**Note:** `kill-switch.json` is simple and working — keep as file, no migration needed.

---

## 14. Observability Strategy

### 14.1 Metrics Framework

**Using Prometheus-compatible metrics structure:**

```typescript
// Counters (monotonically increase)
policy_decisions_allowed_total{action_type, action_category}
policy_decisions_blocked_total{action_type, action_category}
jobs_completed_total{job_type}
plans_completed_total{plan_id}
worker_jobs_completed_total{worker_id}

// Gauges (current value)
jobs_pending_count
jobs_executing_count
plans_active_count
plans_blocked_count
workers_alive_count
workers_dead_count

// Histograms (distribution)
job_duration_seconds{job_type}
step_duration_seconds{plan_id}
queue_age_seconds
```

### 14.2 Health Check Endpoint

**GET /health** returns:
```json
{
  "status": "healthy",
  "checks": {
    "supabase": "ok",
    "redis": "ok",
    "workers_alive": 3,
    "jobs_pending": 5,
    "plans_active": 2,
    "approvals_pending": 0
  },
  "health_score": 0.98,
  "workload_state": "NORMAL",
  "uptime_seconds": 86400,
  "version": "1.0.0"
}
```

**Status determination:**
- `healthy`: All checks pass, health_score > 0.8
- `degraded`: One or more checks warn, health_score 0.5-0.8
- `unhealthy`: Critical check failing, health_score 0.2-0.5
- `critical`: Supabase or Redis unreachable, health_score < 0.2

### 14.3 Execution Tracing

Every execution produces a trace:
```typescript
interface ExecutionTrace {
  trace_id: UUID;
  plan_id: UUID;
  steps: {
    step_id: UUID;
    step_index: number;
    status: string;
    started_at: ISO8601;
    completed_at: ISO8601;
    duration_ms: number;
    policy_decision: string;
    job_id: UUID;
    worker_id: string;
    result: object;
    failure_reason?: string;
  }[];
  outcome: 'completed' | 'failed' | 'abandoned';
  total_duration_ms: number;
}
```

Traces are stored in Supabase and queryable by plan_id, date range, outcome.

### 14.4 Failure Analysis

When a job or plan fails:
1. Capture failure context: error message, stack trace, system state, policy decision at time of failure
2. Store in `execution_traces` with `outcome: failed`
3. Alert operator via WhatsApp with failure summary + link to execution browser
4. Dead letter jobs notify operator with retry history

### 14.5 Dashboard (Optional Future)

Simple HTML dashboard served by observability layer:
- Queue depth over time (chart)
- Job success/fail ratio (chart)
- Active plans status (table)
- Worker health (table)
- Recent executions (list)

---

## 15. Initial Implementation Roadmap

### Phase 1: Discovery & Architecture
**Timeline:** Week 1-2
**Tasks:**
1. Set up TypeScript project scaffold
2. Configure Supabase project + connection
3. Configure Redis Cloud
4. Write SQL migration scripts (migrations/001_initial_schema.sql)
5. Verify tooling (TypeScript compiler, Jest, PM2)
6. Finalize this architecture document with Ahmad's input

**Deliverable:** Schema review + tooling verified, ready for Phase 2

---

### Phase 2: Core Runtime Architecture
**Timeline:** Week 3-4
**Tasks:**
1. Supabase client + connection pooling
2. Redis client configuration
3. Migration scripts tested (run against Supabase test DB)
4. Job queue operations (enqueue/dequeue/complete)
5. Event bus (Redis pub/sub + Supabase event log)
6. Webhook receiver on port 3003
7. Event router
8. OpenClaw cron trigger integration

**Deliverable:** Queue system working end-to-end, event bus functional

---

### Phase 3: Internal Workflow Engine MVP
**Timeline:** Week 5-6
**Tasks:**
1. Execution engine (plan loader, step evaluator, dispatcher)
2. Execution Policy Engine (safe-action-zones + operator-buffer integration)
3. Generic worker implementation
4. Retry + dead letter handling
5. Crash recovery (startup recovery scan)
6. End-to-end test: 3-step plan with approval checkpoint

**Deliverable:** Full execution cycle working, governance enforced, crash recovery tested

---

### Phase 4: Shadow Mode + Validation
**Timeline:** Week 7-8
**Tasks:**
1. Build all integration adapters (HubSpot, SMTP, WhatsApp, Cloudflare, OpenClaw)
2. Migrate follow-up engine to orchestration (shadow mode)
3. Validate outputs match
4. Load test (10x volume)
5. Fix any issues
6. Document shadow mode results

**Deliverable:** Adapters validated, follow-up engine migrated, shadow mode report

---

### Phase 5: Gradual Migration
**Timeline:** Week 9-12
**Tasks:**
1. Migrate C-suite morning spawn to orchestration
2. Migrate daily SoD report generation
3. Migrate LinkedIn post delivery workflow
4. Monitor for 2 weeks
5. Fine-tune based on real usage

**Deliverable:** 3+ real workflows on orchestration, stable for 2 weeks

---

### Phase 6: Full Retirement + Optimization
**Timeline:** Week 13-14
**Tasks:**
1. Verify no N8N dependencies remain
2. Optimize queue processing, worker count
3. Add self-healing for stuck plans
4. Add execution optimization advisor
5. Write operational runbook

**Deliverable:** Full internal orchestration, operational documentation

---

### Total Timeline: ~14 weeks (3.5 months)

### Immediate Next Step (Before Phase 1 begins):
Ahmad approves this architecture → I proceed to Phase 1 scaffolding (TypeScript project setup, Supabase configuration, Redis setup, migration script writing).

---

## Open Questions for Ahmad

1. **Supabase project:** Do you have an existing Supabase account, or should I create one? Preference for cloud or self-hosted?
2. **Redis:** Prefer Redis Cloud (free tier) or self-hosted on the Hetzner server?
3. **Existing N8N workflows:** Are there any N8N workflows currently running that I missed? (My analysis found none, but wanted to confirm)
4. **Approval UI:** For human oversight, do you prefer WhatsApp-based approvals (quick, native) or a web dashboard (more detail)?
5. **Worker count:** Default to 3 workers — adjust based on expected job volume?

---

*Document: ORCHESTRATION-FRAMEWORK.md v2.0*
*Author: Moosa — AI Architect + CEO*
*Status: COMPLETE — Awaiting Ahmad approval to proceed*
*Created: 2026-05-06*