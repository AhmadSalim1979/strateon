-- Migration: 001_initial_schema
-- Moosa Orchestration Framework — Phase 1
-- Date: 2026-05-06

BEGIN;

-- ─── Executions: Execution Plans and Steps ────────────────────────────────────

CREATE TABLE IF NOT EXISTS executions (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  plan_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (plan_status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED', 'ABANDONED')),
  current_step_index INTEGER DEFAULT 0,
  context JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Terminal state
  terminal_reason TEXT,
  is_terminal BOOLEAN DEFAULT false
);

COMMENT ON TABLE executions IS 'Execution plans — the top-level orchestration unit';
CREATE INDEX idx_executions_status ON executions(plan_status) WHERE plan_status != 'COMPLETED' AND plan_status != 'ABANDONED';
CREATE INDEX idx_executions_created ON executions(created_at DESC);
CREATE INDEX idx_executions_active ON executions(plan_status) WHERE plan_status = 'ACTIVE';

-- ─── Execution Steps ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS execution_steps (
  step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES executions(plan_id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  description TEXT NOT NULL,
  
  -- Action classification
  action_type TEXT NOT NULL CHECK (action_type IN ('SAFE_AUTONOMOUS', 'SUPERVISED', 'RESTRICTED')),
  action_category TEXT NOT NULL,  -- e.g., read_only, housekeeping, notification, critical, security, data, external
  action_payload JSONB NOT NULL DEFAULT '{}',  -- the actual execution payload
  
  -- Dependencies
  dependencies UUID[] DEFAULT '{}',
  conditions JSONB,  -- conditional logic for step execution { field, operator, value }
  
  -- Status
  step_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (step_status IN ('PENDING', 'READY', 'AWAITING_APPROVAL', 'APPROVED', 'EXECUTING', 'COMPLETED', 'FAILED', 'BLOCKED')),
  
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
  
  UNIQUE(plan_id, step_index)
);

COMMENT ON TABLE execution_steps IS 'Individual steps within an execution plan';
CREATE INDEX idx_steps_plan ON execution_steps(plan_id);
CREATE INDEX idx_steps_status ON execution_steps(step_status);
CREATE INDEX idx_steps_plan_status ON execution_steps(plan_id, step_status) WHERE step_status IN ('READY', 'AWAITING_APPROVAL');

-- ─── Jobs: Queue Items ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- Execution state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'dead_letter', 'cancelled')),
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
  
  -- Idempotency key (prevents double execution)
  idempotency_key TEXT UNIQUE
);

COMMENT ON TABLE jobs IS 'Job queue — all work items processed by workers';
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_priority ON jobs(priority, created_at);
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_jobs_pending_priority ON jobs(status, priority, created_at) WHERE status = 'pending';
CREATE INDEX idx_jobs_executing_worker ON jobs(status, worker_id) WHERE status = 'executing';
CREATE INDEX idx_jobs_type ON jobs(job_type);

-- ─── Events: Immutable Event Log ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  correlation_id UUID,  -- links events in a single execution flow
  
  -- Causality chain
  caused_by_job_id UUID REFERENCES jobs(job_id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE events IS 'Immutable event log — append-only, no updates or deletes allowed';
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created ON events(created_at DESC);
CREATE INDEX idx_events_correlation ON events(correlation_id);
CREATE INDEX idx_events_source ON events(source);

-- Prevent updates/deletes on events table (immutable log)
CREATE OR REPLACE FUNCTION prevent_events_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Events table is immutable — updates and deletes are not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_immutable
  BEFORE UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION prevent_events_modification();

-- ─── Policy Decisions: Audit Log ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS policy_decisions (
  decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type TEXT NOT NULL,  -- STEP_APPROVAL, JOB_DISPATCH, JOB_COMPLETE, etc.
  action_type TEXT NOT NULL,  -- SAFE_AUTONOMOUS | SUPERVISED | RESTRICTED
  action_category TEXT NOT NULL,
  
  -- Context
  plan_id UUID REFERENCES executions(plan_id),
  step_id UUID REFERENCES execution_steps(step_id),
  job_id UUID REFERENCES jobs(job_id),
  
  -- Decision
  decision TEXT NOT NULL CHECK (decision IN ('ALLOWED', 'BLOCKED', 'APPROVED', 'REJECTED')),
  reason TEXT,
  system_status TEXT,  -- HEALTHY | DEGRADED | UNHEALTHY | CRITICAL
  workload_state TEXT,  -- NORMAL | ELEVATED | SATURATED
  
  -- Operator input
  operator_id TEXT,
  operator_decision TEXT,
  operator_decided_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE policy_decisions IS 'Audit log of all policy decisions — immutable';
CREATE INDEX idx_policy_plan ON policy_decisions(plan_id) WHERE plan_id IS NOT NULL;
CREATE INDEX idx_policy_step ON policy_decisions(step_id) WHERE step_id IS NOT NULL;
CREATE INDEX idx_policy_created ON policy_decisions(created_at DESC);
CREATE INDEX idx_policy_decision ON policy_decisions(decision, created_at DESC);

-- Prevent updates/deletes on policy_decisions (immutable audit)
CREATE OR REPLACE FUNCTION prevent_policy_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Policy decisions table is immutable — updates and deletes are not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER policy_decisions_immutable
  BEFORE UPDATE OR DELETE ON policy_decisions
  FOR EACH ROW EXECUTE FUNCTION prevent_policy_modification();

-- ─── Operator Approvals: Human Checkpoint Queue ───────────────────────────────

CREATE TABLE IF NOT EXISTS operator_approvals (
  approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES executions(plan_id),
  step_id UUID REFERENCES execution_steps(step_id),
  job_id UUID REFERENCES jobs(job_id),
  
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  action_payload JSONB DEFAULT '{}',
  
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  
  operator_id TEXT,
  operator_comment TEXT,
  
  -- Correlation for event tracing
  correlation_id UUID
);

COMMENT ON TABLE operator_approvals IS 'Human approval queue — blocks execution until operator approves';
CREATE INDEX idx_approvals_pending ON operator_approvals(status, requested_at) WHERE status = 'PENDING';
CREATE INDEX idx_approvals_plan ON operator_approvals(plan_id) WHERE plan_id IS NOT NULL;
CREATE INDEX idx_approvals_correlation ON operator_approvals(correlation_id) WHERE correlation_id IS NOT NULL;

-- ─── Worker Health ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS worker_health (
  worker_id TEXT PRIMARY KEY,
  worker_type TEXT DEFAULT 'generic',
  last_heartbeat TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'alive' CHECK (status IN ('alive', 'dead', 'unknown')),
  current_job_id UUID REFERENCES jobs(job_id),
  started_job_at TIMESTAMPTZ,
  jobs_completed_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE worker_health IS 'Worker heartbeat and health tracking';
CREATE INDEX idx_worker_heartbeat ON worker_health(last_heartbeat DESC);
CREATE INDEX idx_worker_status ON worker_health(status) WHERE status = 'alive';

-- ─── Trigger Configurations ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trigger_configs (
  trigger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('webhook', 'cron', 'event', 'queue_threshold', 'manual')),
  trigger_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  
  -- Configuration (JSON for flexibility)
  config JSONB NOT NULL DEFAULT '{}',
  
  -- Associated workflows (execution plans triggered by this config)
  target_plan_ids UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE trigger_configs IS 'Trigger configurations — webhooks, cron schedules, event listeners';
CREATE INDEX idx_trigger_type ON trigger_configs(trigger_type);
CREATE INDEX idx_trigger_enabled ON trigger_configs(enabled) WHERE enabled = true;

-- ─── Execution Traces ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS execution_traces (
  trace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES executions(plan_id) ON DELETE CASCADE,
  correlation_id UUID,
  
  -- Step execution records
  steps JSONB NOT NULL DEFAULT '[]',  -- Array of step execution records
  
  -- Outcome
  outcome TEXT CHECK (outcome IN ('completed', 'failed', 'abandoned', 'in_progress')),
  total_duration_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE execution_traces IS 'Complete execution traces for debugging and analysis';
CREATE INDEX idx_traces_plan ON execution_traces(plan_id);
CREATE INDEX idx_traces_correlation ON execution_traces(correlation_id);
CREATE INDEX idx_traces_created ON execution_traces(created_at DESC);
CREATE INDEX idx_traces_outcome ON execution_traces(outcome, created_at DESC);

-- ─── Dead Letter Jobs Archive ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dead_letter_jobs (
  job_id UUID PRIMARY KEY,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  error TEXT NOT NULL,
  retry_count INTEGER NOT NULL,
  first_created_at TIMESTAMPTZ NOT NULL,
  dead_lettered_at TIMESTAMPTZ DEFAULT now(),
  last_worker_id TEXT
);

COMMENT ON TABLE dead_letter_jobs IS 'Archive of jobs that failed after all retries — for debugging and manual review';
CREATE INDEX idx_dead_letter_created ON dead_letter_jobs(dead_lettered_at DESC);
CREATE INDEX idx_dead_letter_type ON dead_letter_jobs(job_type);

COMMIT;

-- ─── Post-Migration Notes ──────────────────────────────────────────────────────
-- After running this migration:
-- 1. Verify all tables exist: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- 2. Verify indexes: SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
-- 3. Test RLS if needed: ALTER TABLE executions ENABLE ROW LEVEL SECURITY;