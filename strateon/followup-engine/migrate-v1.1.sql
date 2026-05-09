-- Qiyadon Supabase Schema Migration v1.1
-- Run this file via: psql $DATABASE_URL < migrate-v1.1.sql

BEGIN;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── CLIENTS (primary tenant table) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  tier              TEXT NOT NULL CHECK (tier IN ('starter', 'growth', 'scale')),
  hub_id            TEXT,
  stripe_customer_id TEXT,
  status            TEXT NOT NULL DEFAULT 'onboarding'
                    CHECK (status IN ('onboarding', 'active', 'paused', 'churned')),
  onboarding_started_at TIMESTAMPTZ DEFAULT NOW(),
  onboarded_at          TIMESTAMPTZ,
  paused_at            TIMESTAMPTZ,
  churned_at           TIMESTAMPTZ,
  cadence_config   JSONB DEFAULT '{"stalledDays": 14, "cadence": [{"day": 1, "bodyKey": "intro"}, {"day": 3, "bodyKey": "followup1"}, {"day": 7, "bodyKey": "valueadd"}, {"day": 14, "bodyKey": "checkin"}, {"day": 21, "bodyKey": "pivot"}, {"day": 30, "bodyKey": "final"}]}'::jsonb,
  owner_name       TEXT,
  owner_email      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients (status) WHERE status IN ('active', 'onboarding');
CREATE INDEX IF NOT EXISTS idx_clients_hub_id ON public.clients (hub_id);

-- ─── HUBSPOT_CONNECTIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hubspot_connections (
  id              SERIAL PRIMARY KEY,
  client_id       TEXT NOT NULL,
  hub_id          TEXT NOT NULL UNIQUE,
  access_token    TEXT NOT NULL,
  refresh_token   TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  connected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_refresh_at TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_hubspot_connections_hub_id ON public.hubspot_connections (hub_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_connections_client_id ON public.hubspot_connections (client_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_connections_expires_soon ON public.hubspot_connections (expires_at) WHERE status = 'active';

-- ─── PIPELINE_LEADS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_leads (
  id              SERIAL PRIMARY KEY,
  client_id       TEXT NOT NULL,
  hub_id          TEXT,
  contact_id      TEXT NOT NULL,
  name            TEXT,
  email           TEXT,
  company         TEXT,
  status          TEXT NOT NULL DEFAULT 'warm'
                  CHECK (status IN ('hot', 'warm', 'cold', 'dormant')),
  cadence_day     INTEGER NOT NULL DEFAULT 0,
  last_touch      TIMESTAMPTZ,
  next_followup   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_received BOOLEAN NOT NULL DEFAULT FALSE,
  escalated       BOOLEAN NOT NULL DEFAULT FALSE,
  converted       BOOLEAN NOT NULL DEFAULT FALSE,
  lost            BOOLEAN NOT NULL DEFAULT FALSE,
  source          TEXT CHECK (source IN ('import', 'manual', 'inbound', 'trial')),
  imported_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pipeline_leads_client_id ON public.pipeline_leads (client_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_leads_client_status ON public.pipeline_leads (client_id, status);
CREATE INDEX IF NOT EXISTS idx_pipeline_leads_needs_followup ON public.pipeline_leads (client_id, cadence_day, last_touch) WHERE response_received = FALSE AND escalated = FALSE;
CREATE INDEX IF NOT EXISTS idx_pipeline_leads_stalled ON public.pipeline_leads (client_id, last_touch) WHERE response_received = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_leads_unique_contact ON public.pipeline_leads (client_id, contact_id);

-- ─── PIPELINE_ACTIVITY ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_activity (
  id              SERIAL PRIMARY KEY,
  lead_id         TEXT NOT NULL,
  client_id       TEXT NOT NULL,
  activity_type   TEXT NOT NULL
                  CHECK (activity_type IN ('email_sent', 'reply_received', 'escalated', 'lead_hot', 'lead_cold', 'meeting_booked', 'lead_created')),
  description     TEXT,
  subject         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  channel         TEXT CHECK (channel IN ('email', 'linkedin', 'phone', 'sms')),
  triggered_by    TEXT NOT NULL DEFAULT 'engine'
                  CHECK (triggered_by IN ('engine', 'human', 'webhook', 'system')),
  outcome         TEXT
);

CREATE INDEX IF NOT EXISTS idx_pipeline_activity_client_recent ON public.pipeline_activity (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_activity_date_range ON public.pipeline_activity (client_id, created_at) WHERE activity_type IN ('email_sent', 'reply_received', 'escalated');
CREATE INDEX IF NOT EXISTS idx_pipeline_activity_lead_id ON public.pipeline_activity (lead_id, created_at DESC);

-- ─── REPORTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id              SERIAL PRIMARY KEY,
  client_id       TEXT NOT NULL,
  report_date     DATE NOT NULL,
  report_type     TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'ad-hoc')),
  html_content    TEXT,
  summary_text    TEXT,
  metrics         JSONB DEFAULT '{}'::jsonb,
  sent_at         TIMESTAMPTZ,
  delivered_to    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_client_date ON public.reports (client_id, report_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique_weekly ON public.reports (client_id, report_date) WHERE report_type = 'weekly';

-- ─── SUBSCRIPTIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              SERIAL PRIMARY KEY,
  client_id       TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier            TEXT NOT NULL CHECK (tier IN ('starter', 'growth', 'scale')),
  billing_cycle   TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status          TEXT NOT NULL DEFAULT 'trialing'
                  CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  trial_end_at          TIMESTAMPTZ,
  canceled_at     TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_past_due ON public.subscriptions (client_id, status) WHERE status = 'past_due';

-- ─── TRIGGERS ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON public.clients;
CREATE TRIGGER trigger_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- Verification
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;