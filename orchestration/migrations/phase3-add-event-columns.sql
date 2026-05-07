-- Phase 3 Migration: Add Phase 3 columns to existing events table
-- Target: events (Phase 1 orchestration table)
-- Authority: Ahmad Salim — approved 2026-05-07

-- 1. Add Phase 3 columns (additive, non-destructive)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_id TEXT,
  ADD COLUMN IF NOT EXISTS correlation_id TEXT,
  ADD COLUMN IF NOT EXISTS caused_by_job_id TEXT,
  ADD COLUMN IF NOT EXISTS hop_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_duration_ms INTEGER;

-- 2. Backfill existing rows with generated event_id
-- Each existing row gets a UUID so no event_id is ever truly NULL
-- This is non-destructive: existing business data preserved, only event_id populated
UPDATE events SET event_id = gen_random_uuid()::text WHERE event_id IS NULL;

-- 3. Set NOT NULL on event_id (safe now that all rows are backfilled)
ALTER TABLE events ALTER COLUMN event_id SET NOT NULL;

-- 4. Partial unique index — valid PostgreSQL syntax (replaces invalid ALTER TABLE ADD CONSTRAINT ... WHERE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_event_id_unique 
  ON events (event_id) 
  WHERE event_id IS NOT NULL;

-- 5. Standard indexes
CREATE INDEX IF NOT EXISTS idx_events_type_correlation 
  ON events (event_type, correlation_id);

CREATE INDEX IF NOT EXISTS idx_events_created 
  ON events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_unprocessed 
  ON events (processed_at) WHERE processed_at IS NULL;