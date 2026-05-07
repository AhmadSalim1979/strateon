-- Phase 2 Migration: Create audit_trail_events table
-- Target: audit_trail_events (AI Governance Phase 2)
-- Authority: CTO (Qiyadon) — 2026-05-07
-- Depends on: error_reports table (Phase 1)
-- Part of: AI Governance audit trail with SHA-256 chain integrity

CREATE TABLE IF NOT EXISTS audit_trail_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor TEXT NOT NULL,
  actor_type TEXT NOT NULL,  -- 'ai-agent' | 'human' | 'automated-system'
  action_type TEXT NOT NULL, -- 'lead-contacted' | 'email-sent' | 'escalation-triggered' | etc.
  lead_id TEXT,
  channel TEXT,             -- 'whatsapp' | 'email' | 'sms' | 'system'
  details TEXT NOT NULL,
  context JSONB,            -- AI decision context (lead_score, cadence_day, etc.)
  result TEXT NOT NULL,     -- 'sent' | 'failed' | 'bounced' | 'pending' | 'skipped'
  prev_hash TEXT,           -- SHA-256 of previous entry in chain (null for first entry)
  hash TEXT NOT NULL,       -- SHA-256 of this entry
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_client_time ON audit_trail_events(client_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_run_id ON audit_trail_events(run_id);
CREATE INDEX IF NOT EXISTS idx_audit_lead ON audit_trail_events(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_hash ON audit_trail_events(hash);