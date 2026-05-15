-- Phase 1: Instruction Bridge Schema
-- File: /ops/instruction-bridge.sql
-- Purpose: Create instructions table for durable instruction intake and lifecycle tracking
-- Owner: Moosa (CEO)
-- Validation: SELECT * FROM instructions LIMIT 1; should return empty or row
-- Last Modified: 2026-05-15

CREATE TABLE IF NOT EXISTS instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID REFERENCES instructions(id),     -- links child instructions to parent
  source_channel TEXT NOT NULL,                        -- 'whatsapp' | 'cron' | 'webhook' | 'internal'
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  original_message TEXT NOT NULL,                      -- immutable original snapshot — never mutated
  normalized_instruction TEXT,                        -- parsed/normalized version
  instruction_type TEXT NOT NULL,                     -- 'execute' | 'review' | 'approve' | 'inform'
  priority TEXT NOT NULL DEFAULT 'medium',            -- 'low' | 'medium' | 'high' | 'critical'
  status TEXT NOT NULL DEFAULT 'received',             -- 'received' | 'received_only' | 'queued' | 'acknowledged' | 'executed' | 'blocked' | 'needs-clarification' | 'stalled' | 'completed'
  execution_mode TEXT,                                 -- 'direct' | 'task-queue' | 'subagent'
  assigned_worker TEXT,                                -- 'moosa' | 'cto' | 'cmo' | etc.
  acknowledgement_state TEXT DEFAULT 'pending',       -- 'pending' | 'sent' | 'failed'
  last_update_at TIMESTAMPTZ DEFAULT now(),
  retry_count INT DEFAULT 0,
  failure_reason TEXT,
  state_transitions JSONB DEFAULT '[]',                -- [{from, to, at, by, note}]
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_instructions_status ON instructions(status);
CREATE INDEX IF NOT EXISTS idx_instructions_correlation_id ON instructions(correlation_id);
CREATE INDEX IF NOT EXISTS idx_instructions_source_channel ON instructions(source_channel);
CREATE INDEX IF NOT EXISTS idx_instructions_created_at ON instructions(created_at);
CREATE INDEX IF NOT EXISTS idx_instructions_received_at ON instructions(received_at);

-- Comments for documentation
COMMENT ON TABLE instructions IS 'Durable instruction intake log — every instruction creates a row here before execution';
COMMENT ON COLUMN instructions.original_message IS 'Immutable — never updated after insert. True record of what was received.';
COMMENT ON COLUMN instructions.state_transitions IS 'Auditable array of {from, to, at, by, note} — tracks every status change';
COMMENT ON COLUMN instructions.acknowledgement_state IS 'Tracks whether acknowledgement was successfully emitted to sender';
COMMENT ON COLUMN instructions.received_only IS 'Status when instruction received but task queue write failed — NOT queued';