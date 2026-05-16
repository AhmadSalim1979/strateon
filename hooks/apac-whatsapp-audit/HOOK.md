---
name: apac-whatsapp-audit
description: "APAC AUDIT_ONLY WhatsApp observation hook — classifies approval-like messages and writes audit entries without execution authority"
homepage: https://docs.openclaw.ai/automation/hooks#apac-whatsapp-audit
metadata:
  { "openclaw": { "emoji": "🔍", "events": ["message:received"], "requires": {} } }
---

# APAC WhatsApp Audit Hook

AUDIT_ONLY observation hook for the APAC (Approval Provenance & Authority Chain) system.

## What It Does

- Listens for `message:received` events (inbound WhatsApp messages)
- Classifies approval-like messages using APAC v3 parsers
- Writes audit entries to Supabase `approval_audit_log` table
- Writes fallback local audit entries to `memory/EEL-APAC-AUDIT-YYYY-MM-DD.md`
- **ZERO execution authority** — cannot authorize, deny, or block any operation

## Feature Flag

Controlled by environment variable `APAC_ENABLED`:

- `APAC_ENABLED=true` (default) — hook is active
- `APAC_ENABLED=false` — hook is disabled, messages pass through without audit

To disable immediately without restart: set `APAC_ENABLED=false` in `.env` and restart moosa-worker.

## Safety Guarantees

1. **Non-blocking**: Hook failures are caught and logged — never propagate
2. **No execution authority**: Cannot authorize, deny, block, or mutate dispatches
3. **Original flow preserved**: Message handling continues unchanged regardless of hook outcome
4. **Observational only**: Classification results are telemetry, not commands

## Audit Destination

- Primary: Supabase `approval_audit_log` table
- Fallback: `memory/EEL-APAC-AUDIT-YYYY-MM-DD.md`