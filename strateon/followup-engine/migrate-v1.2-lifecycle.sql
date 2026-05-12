-- Qiyadon Lifecycle State + Audit Migration v1.2
-- Run this via: psql $DATABASE_URL < migrate-v1.2.sql
-- Requires: migrate-v1.1.sql already applied

BEGIN;

-- ─── ADD LIFECYCLE_STATE TO CLIENTS ─────────────────────────────────────────
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS lifecycle_state TEXT NOT NULL DEFAULT 'ACTIVATION_PENDING'
  CHECK (lifecycle_state IN (
    'ACTIVATION_PENDING',
    'ACTIVATION_ACTIVE',
    'EVALUATION_ACTIVE',
    'EVALUATION_COMPLETE',
    'SCALE_PENDING',
    'SCALE_ACTIVE',
    'CLOSED_NO_SCALE'
  ));

-- Lifecycle transition timestamps
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS activation_started_at TIMESTAMPTZ;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS evaluation_started_at TIMESTAMPTZ;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS evaluation_completed_at TIMESTAMPTZ;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS scale_started_at TIMESTAMPTZ;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_clients_lifecycle_state ON public.clients (lifecycle_state);

-- ─── CLIENT LIFECYCLE EVENTS (audit log) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_lifecycle_events (
  id              SERIAL PRIMARY KEY,
  client_id       TEXT NOT NULL,
  event_type      TEXT NOT NULL
    CHECK (event_type IN (
      'STATE_TRANSITION',
      'REMINDER_SENT',
      'ARTIFACT_DELIVERED',
      'ESCALATION_TRIGGERED',
      'QUALIFICATION_ASSESSED',
      'SCALE_OFFER_SENT',
      'SCALE_OFFER_EXPIRED',
      'MANUAL_INTERVENTION'
    )),
  from_state      TEXT,
  to_state        TEXT,
  event_data      JSONB DEFAULT '{}'::jsonb,
  triggered_by    TEXT NOT NULL DEFAULT 'system'
    CHECK (triggered_by IN ('system', 'engine', 'human', 'client')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_events_client ON public.client_lifecycle_events (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_type ON public.client_lifecycle_events (event_type, created_at DESC);

-- ─── PILOT TELEMETRY ─────────────────────────────────────────────────────────
ALTER TABLE public.pipeline_leads ADD COLUMN IF NOT EXISTS first_reply_at TIMESTAMPTZ;
ALTER TABLE public.pipeline_leads ADD COLUMN IF NOT EXISTS artifact_engaged BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.pipeline_leads ADD COLUMN IF NOT EXISTS trust_signals JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.pipeline_leads ADD COLUMN IF NOT EXISTS confusion_indicators JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.pipeline_leads ADD COLUMN IF NOT EXISTS suspicion_indicators JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.pipeline_leads ADD COLUMN IF NOT EXISTS async_engagement_score INTEGER;

CREATE INDEX IF NOT EXISTS idx_leads_telemetry ON public.pipeline_leads (client_id, first_reply_at) WHERE first_reply_at IS NOT NULL;

-- ─── REMINDER TRACKING ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id              SERIAL PRIMARY KEY,
  client_id       TEXT NOT NULL,
  reminder_type   TEXT NOT NULL
    CHECK (reminder_type IN ('ACTIVATION_COMPLETE', 'DAY_7_REVIEW', 'DAY_13_REMINDER', 'DAY_14_ASSESSMENT')),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  channel         TEXT CHECK (channel IN ('email', 'whatsapp', 'linkedin')),
  outcome         TEXT,
  acknowledged    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_client ON public.reminder_logs (client_id, reminder_type, sent_at DESC);

COMMIT;

-- Verification
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients' AND column_name LIKE '%lifecycle%' OR column_name LIKE '%_at' ORDER BY column_name;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;