-- APAC Phase 1: approvals + approval_audit_log tables
-- Run manually: psql $SUPABASE_CONN_STRING -f strateon/eel/src/apac-approvals.sql

CREATE TABLE IF NOT EXISTS approvals (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_message_id         TEXT UNIQUE NOT NULL,      -- WhatsApp MessageSid
  approval_message_id_full    TEXT NULL,                -- MessageSidFull if available
  operation_id                TEXT NOT NULL,
  dispatch_id                 TEXT NULL,
  action_hash                 TEXT NOT NULL,
  action_summary              TEXT NOT NULL,
  sender                      TEXT NOT NULL,            -- E.164: +923215139934
  channel                     TEXT NOT NULL DEFAULT 'whatsapp',
  keyword_match               TEXT NOT NULL,
  keyword_strength            TEXT NOT NULL,            -- 'STRONG' only for VERIFIED
  ambiguity_score             REAL NOT NULL DEFAULT 1.0,
  body_text                   TEXT NOT NULL,
  forward_detected            BOOLEAN NOT NULL DEFAULT false,
  status                      TEXT NOT NULL DEFAULT 'ACTIVE',
  expires_at                  TIMESTAMPTZ NOT NULL,
  revoked_at                  TIMESTAMPTZ NULL,
  revoked_by                  TEXT NULL,
  revocation_reason           TEXT NULL,
  used_at                     TIMESTAMPTZ NULL,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_duplicate_approval UNIQUE (approval_message_id),
  CONSTRAINT valid_status CHECK (status IN ('ACTIVE','USED','REVOKED','EXPIRED'))
);

CREATE INDEX IF NOT EXISTS idx_approvals_operation ON approvals(operation_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_message_id ON approvals(approval_message_id);
CREATE INDEX IF NOT EXISTS idx_approvals_expires ON approvals(expires_at);

CREATE TABLE IF NOT EXISTS approval_audit_log (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type           TEXT NOT NULL,
  approval_message_id  TEXT NOT NULL,
  operation_id         TEXT NOT NULL,
  event_data           JSONB NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_audit_created
ON approval_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_approval_audit_event ON approval_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_approval_audit_operation ON approval_audit_log(operation_id);