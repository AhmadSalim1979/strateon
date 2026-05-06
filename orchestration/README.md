# Orchestration Framework — Phase 1

**Status:** In Progress
**Started:** 2026-05-06
**Objective:** Discovery, capability inventory, architectural foundation

---

## What Is This

This is the orchestration framework that will eventually replace all external workflow orchestration (N8N) with fully native, self-owned, sovereign infrastructure owned entirely by Moosa.

It is not a visual workflow builder. It is foundational executive operating system infrastructure — the kind that future autonomous AI agents run on.

---

## Repository Structure

```
orchestration/
├── package.json              # Node.js/TypeScript project
├── tsconfig.json             # TypeScript configuration
├── .env.example              # Environment variables template
├── README.md                 # This file
├── src/
│   ├── config.ts             # All configuration (env-driven, no hard-coding)
│   ├── index.ts              # Main entry point
│   ├── runtime/              # Workflow Runtime Engine (Phase 3)
│   ├── queue/                # Queue & Worker System
│   │   └── redis-queue.ts    # Redis-backed durable queue primitives
│   ├── workers/              # Worker implementation (Phase 3)
│   ├── triggers/             # Trigger System (Phase 2)
│   ├── policy/               # Execution Policy Engine (Phase 3)
│   ├── events/              # Event Bus
│   │   └── event-schemas.ts  # Event type definitions
│   ├── adapters/             # Integration Framework
│   ├── persistence/          # State & Persistence Layer
│   │   ├── supabase-client.ts # Supabase client
│   │   └── migrations/       # SQL migrations
│   │       └── 001_initial_schema.sql
│   ├── observability/        # Observability Layer
│   ├── oversight/            # Human Oversight Layer
│   └── coordination/         # Agent Coordination Layer
└── tests/                   # Test suite
```

---

## Phase 1 Deliverables

### ✅ Completed

#### 1. Infrastructure Discovery
- **Supabase**: Existing project confirmed — `https://btrbczqjwzuybgcxckvm.supabase.co`
  - Service role key: `***REMOVED***`
  - PostgreSQL 14.4, public schema
  - Connected ✅
  
- **Redis**: Local Hetzner installation, version 6.0.16
  - Installed via apt (redis-server, redis-tools)
  - Running on `127.0.0.1:6379` (no password, localhost-only)
  - Tested: `PONG` response confirmed
  - Status: ✅ Operational
  
- **N8N**: Found in environment — `N8N_TASK_ENDPOINT=https://strateonmoosa.app.n8n.cloud/webhook/task-payload`
  - This is an external N8N cloud endpoint (not self-hosted)
  - Noted as external dependency to be replaced

#### 2. TypeScript Project Scaffold
- `package.json` with dependencies: @supabase/supabase-js, ioredis, uuid, yaml, dotenv
- `tsconfig.json` targeting ES2022, strict mode enabled
- Dev dependencies: TypeScript, Jest, ESLint

#### 3. Configuration System (config.ts)
- All configuration environment-driven
- Worker pool size: configurable via `WORKER_COUNT` env var (default: 3)
- Worker scaling rules defined with safety bounds
- Retry configurations per job type
- Validation at startup

#### 4. PostgreSQL Schema (migrations/001_initial_schema.sql)
Tables created:
- `executions` — top-level execution plans
- `execution_steps` — individual steps with dependency tracking
- `jobs` — durable job queue with priority and retry state
- `events` — immutable event log (append-only, no updates/deletes)
- `policy_decisions` — audit log of all policy decisions (immutable)
- `operator_approvals` — human approval checkpoint queue
- `worker_health` — worker heartbeat tracking
- `trigger_configs` — webhook/cron/event trigger configurations
- `execution_traces` — complete execution traces for debugging
- `dead_letter_jobs` — archive of failed jobs for manual review

All tables have appropriate indexes and comments. Trigger prevents modification of immutable tables.

#### 5. Supabase Client (persistence/supabase-client.ts)
- Singleton Supabase client using service role key
- Connection pooling via @supabase/supabase-js
- Health check function for observability

#### 6. Redis Queue Layer (queue/redis-queue.ts)
- Queue primitives: enqueue, dequeue, requeue for retry, dead letter
- Worker heartbeat tracking via Redis hash
- Designed for migration: swap REDIS_HOST to Redis Cloud when needed
- All queue keys namespaced under `orchestration:` prefix

#### 7. Event Schemas (events/event-schemas.ts)
- Complete event type constants (execution, job, approval, system, worker, trigger)
- TypeScript interfaces for all event payloads
- Event creation helper with correlation_id and hop_count (loop prevention)
- Event type guards (isExecutionEvent, isJobEvent, etc.)

---

## Next Steps

### Pending (Requires Ahmad Action)

1. **Run Migration** — Execute `001_initial_schema.sql` against Supabase to create tables
2. **N8N Dependency Audit** — Need to understand: what calls `N8N_TASK_ENDPOINT`? What is the task payload webhook for?

### Phase 2 Tasks (After Migration Runs)

1. Build event bus (Redis pub/sub + Supabase event persistence)
2. Build webhook receiver (port 3003)
3. Build event router
4. Connect OpenClaw cron → event bus → orchestration
5. Write queue manager (periodic recovery scan, retry processing)

---

## Configuration Summary

| Variable | Value | Notes |
|---|---|---|
| `SUPABASE_URL` | `https://btrbczqjwzuybgcxckvm.supabase.co` | Existing project |
| `SUPABASE_SERVICE_KEY` | `sb_secret__...` | Service role, server-side only |
| `REDIS_HOST` | `127.0.0.1` | Local Hetzner |
| `REDIS_PORT` | `6379` | Default, localhost-only |
| `WORKER_COUNT` | `3` (default) | Configurable, 1-10 range |
| `N8N_TASK_ENDPOINT` | `https://strateonmoosa.app.n8n.cloud/webhook/task-payload` | External dependency found |

---

## Risk Register (Phase 1)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| N8N webhook dependency not fully mapped | Medium | Medium | Need Ahmad input on N8N usage |
| Redis persistence on local server (not HA) | Low | Medium | Supabase is backup for state; Redis is only queue |
| Supabase connection string in .env file | Low | Medium | .env is in .gitignore; never commit secrets |

---

## Open Questions

1. **N8N endpoint** — What system calls the N8N webhook endpoint? Is it critical? Can we replace it with direct orchestration?
2. **Migration execution** — Who runs the SQL migration against Supabase? (I can provide the command)
3. **Existing N8N workflows** — Are there any N8N workflows currently running that need to be replicated? (My analysis found no self-hosted N8N, but this external cloud endpoint needs clarification)

---

## Architecture Summary (For Reference)

The complete architecture is in `/workspace/ORCHESTRATION-FRAMEWORK.md` v2.0.

Key design decisions:
- **Supabase + Redis hybrid** — Redis for fast queue ops, Supabase for durable state
- **Event-driven** — All execution driven through event bus
- **Local-first** — Redis on Hetzner, can migrate to Redis Cloud later
- **Worker configurable** — `WORKER_COUNT` env var, safety bounds in place
- **Approval via WhatsApp** — When blocked, operator notified via WhatsApp message

---

*Phase 1 status: Infrastructure discovered, schema written, queue layer built.*
*Awaiting: Migration execution + N8N dependency clarification*