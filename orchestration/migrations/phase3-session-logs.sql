-- Phase 3 Migration: Create session_logs table
-- Target: session_logs (AI Governance Phase 3)
-- Authority: CTO (Qiyadon) — 2026-05-07
-- Part of: AI Governance — Session Logs (the AI's working memory)

CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  model TEXT,                              -- e.g. "minimax/MiniMax-M2.7"
  prompt TEXT,                             -- the prompt that initiated this session
  context JSONB DEFAULT '{}',              -- lead_id, cadence_day, etc.
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'completed' | 'failed'
  events JSONB DEFAULT '[]',              -- array of session events [{step, thought, decision, action, duration_ms, metadata}]
  reasoning_text TEXT,                     -- full reasoning trace (filled on end)
  decisions_summary TEXT,                  -- condensed decisions made (filled on end)
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_duration_ms INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_client ON session_logs(client_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_run ON session_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_session_status ON session_logs(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_session_started ON session_logs(started_at DESC);