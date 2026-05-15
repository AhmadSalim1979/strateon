# Infrastructure Registry

**Purpose:** Classify all infrastructure components by environment and status.
**Owner:** Moosa (CEO)
**Validation:** Review quarterly or after any infrastructure change.
**Last Modified:** 2026-05-15

---

## Classification Definitions

| Class | Definition |
|-------|------------|
| `production` | Live, revenue-critical, customer-facing systems |
| `staging` | Pre-production, used for validation before going live |
| `local` | Development-only, not used in production |
| `deprecated` | Retired, replaced, or migrated away from |
| `unknown` | Cannot determine classification — must investigate |

---

## Infrastructure Components

### Email / SMTP

| Component | Class | Credential Location | Operational Owner | Notes |
|-----------|-------|-------------------|------------------|-------|
| Neo SMTP (smtp0001.neo.space:587) | `production` | `/home/node/.openclaw/secrets/qiyadon-email.json` | Moosa | Primary transactional email |
| Neo IMAP (imap0001.neo.space:993) | `production` | `/home/node/.openclaw/secrets/qiyadon-email.json` | Moosa | Email receive |
| Zoho SMTP | `deprecated` | None — credential removed after Zoho incident | N/A | Was attempted without approval; never in secrets; now explicitly deprecated |
| Mailchannels SPF | `production` | DNS TXT record (no secrets file) | Moosa | SPF for email deliverability |

### Database

| Component | Class | Credential Location | Operational Owner | Notes |
|-----------|-------|-------------------|------------------|-------|
| Supabase (qiyadon-db) | `production` | `/home/node/.openclaw/secrets/supabase.json` | Moosa | Primary data store — PostgreSQL |

### CRM

| Component | Class | Credential Location | Operational Owner | Notes |
|-----------|-------|-------------------|------------------|-------|
| HubSpot | `production` | `/home/node/.openclaw/secrets/hubspot.json` (OAuth tokens) | Moosa | CRM integration |

### DNS / CDN / Pages

| Component | Class | Credential Location | Operational Owner | Notes |
|-----------|-------|-------------------|------------------|-------|
| Cloudflare Pages (qiyadon.com) | `production` | `/home/node/.openclaw/secrets/cloudflare-api-token.json` | Moosa | Website hosting + DNS |
| Cloudflare Tunnel (cloudflared) | `production` | PM2 managed — no secrets file | Moosa | Tunnel for api.qiyadon.com |

### Application Servers

| Component | Class | Credential Location | Operational Owner | Notes |
|-----------|-------|-------------------|------------------|-------|
| qiyadon-audit-form (port 3001) | `production` | No secrets — uses qiyadon-email.json + supabase.json | Moosa | Form submission handler |
| hub-oauth-v2 (port 3003) | `production` | No secrets — uses hubspot-oauth.json | Moosa | HubSpot OAuth handler |

### Messaging / Operational Core

| Component | Class | Credential Location | Operational Owner | Notes |
|-----------|-------|-------------------|------------------|-------|
| OpenClaw Gateway | `production` | OpenClaw built-in | OpenClaw | WhatsApp + operational messaging |
| moosa-worker | `production` | No additional secrets | Moosa | Main AI worker process |
| moosa-watchdog | `production` | No additional secrets | Moosa | Independent watchdog process |
| strateon-followup-engine | `staging` | No secrets — not active (0 clients) | Moosa | Follow-up cadence engine — disabled until first client |

### Configuration Files

| File | Class | Credential Location | Operational Owner | Notes |
|-------|-------|-------------------|------------------|-------|
| `ecosystem.config.js` | `production` | None (no secrets) | Moosa | PM2 ecosystem — all services |
| `ecosystem.followup.config.js` | `staging` | None (no secrets) | Moosa | Follow-up engine cron config |
| `ecosystem.hub-oauth.config.js` | `production` | None (no secrets) | Moosa | HubSpot OAuth PM2 config |
| `ecosystem.cloudflared.config.js` | `production` | None (no secrets) | Moosa | Cloudflare tunnel PM2 config |

### Local / Development Only

| Component | Class | Notes |
|-----------|-------|-------|
| server.js | `local` | Main form handler — same binary as qiyadon-audit-form in PM2 |
| submit-audit.js | `local` | Standalone audit form server (not used in production) |
| email-worker.js | `local` | Email worker (not running as PM2 process) |
| orchestration/ | `staging` | Phase 3+ orchestration framework — not yet live |

---

## Classification Rules

1. Anything customer-facing = `production`
2. Anything receiving money = `production`
3. Anything that, if broken, stops pipeline execution = `production`
4. `unknown` classification must be resolved within 48 hours of discovery
5. Deprecated components must be marked `deprecated` with removal date tracked

---

## Change Log

| Date | Who | What Changed | Classification |
|------|----|--------------|----------------|
| 2026-05-15 | Moosa | Initial registry created — all components classified | All |

---

*This registry must be updated before any infrastructure change is made.*
*No unclassified infrastructure may be used in production.*