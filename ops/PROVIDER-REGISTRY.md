# Approved Provider Registry

**Purpose:** Enumerate all explicitly approved infrastructure providers. No provider may be used, tested, or assumed without being in this registry.
**Owner:** Moosa (CEO)
**Validation:** Review after any provider change or incident.
**Last Modified:** 2026-05-15

---

## Approval Policy

> No provider may be added to this registry without explicit written approval from Ahmad Salim.
> Providers NOT in this registry cannot be used, cannot be tested, cannot be assumed.
> Attempting to use an unapproved provider triggers an immediate block + alert to Ahmad.

---

## Approved Providers

### Neo (Primary Email/SMTP Provider)

| Field | Value |
|-------|-------|
| Provider | Neo (byONTICS) |
| Purpose | Transactional email (SMTP) + inbound email (IMAP) |
| Approval Date | 2026-05-14 (Ahmad Salim — direct instruction) |
| Credential Location | `/home/node/.openclaw/secrets/qiyadon-email.json` |
| Credential Location (backup) | `/home/node/.openclaw/secrets/qiyadon-email-credentials.json` |
| Operational Owner | Moosa |
| SMTP Host | smtp0001.neo.space |
| SMTP Port | 587 |
| IMAP Host | imap0001.neo.space |
| IMAP Port | 993 |
| Status | `approved` — active production |

### Supabase (Database)

| Field | Value |
|-------|-------|
| Provider | Supabase |
| Purpose | Primary data store — PostgreSQL + real-time + Auth |
| Approval Date | 2026-04-27 (implicit — system bootstrapped with Supabase) |
| Credential Location | `/home/node/.openclaw/secrets/supabase.json` |
| Operational Owner | Moosa |
| Status | `approved` — active production |

### Cloudflare (DNS + Pages + Tunnel)

| Field | Value |
|-------|-------|
| Provider | Cloudflare |
| Purpose | DNS management, website hosting (Cloudflare Pages), secure tunnel |
| Approval Date | 2026-04-27 (implicit — qiyadon.com hosted on Cloudflare Pages) |
| Credential Location | `/home/node/.openclaw/secrets/cloudflare-api-token.json` |
| Operational Owner | Moosa |
| Tunnel Managed By | cloudflared-tunnel PM2 process |
| Status | `approved` — active production |

### HubSpot (CRM)

| Field | Value |
|-------|-------|
| Provider | HubSpot |
| Purpose | CRM integration, pipeline leads, contact management |
| Approval Date | 2026-04-27 (implicit — HubSpot CRM connected) |
| Credential Location | `/home/node/.openclaw/secrets/hubspot.json` (OAuth tokens) |
| Operational Owner | Moosa |
| Status | `approved` — active production |

### OpenClaw (Messaging + AI Worker)

| Field | Value |
|-------|-------|
| Provider | OpenClaw |
| Purpose | WhatsApp messaging, AI worker runtime, session management |
| Approval Date | 2026-04-27 (system bootstrap) |
| Credential Location | OpenClaw built-in (not a secrets file) |
| Operational Owner | OpenClaw |
| Status | `approved` — active production |

### Mailchannels (SPF Only)

| Field | Value |
|-------|-------|
| Provider | Mailchannels |
| Purpose | SPF record only — email deliverability |
| Approval Date | 2026-05-15 (Moosa — DNS TXT record, no secrets file) |
| Credential Location | None — DNS-only, no authentication |
| Operational Owner | Moosa |
| Status | `approved` — active production |

---

## Explicitly Rejected Providers

| Provider | Reason for Rejection | Date |
|----------|---------------------|------|
| Zoho | Attempted to configure and test SMTP without approval, without reading from secrets, without evidence. Incident reported. | 2026-05-15 |
| SendGrid | Not applied for, not approved | N/A |
| AWS SES | Not applied for, not approved | N/A |
| Mailgun | Not applied for, not approved | N/A |
| Postmark | Not applied for, not approved | N/A |

---

## Provider Addition Request Process

To request a new provider be added:

1. State the provider name and intended use case
2. Wait for explicit Ahmad written approval (WhatsApp or document)
3. Do NOT test, configure, or assume the provider before approval
4. After approval, add to this registry with approval date and credential location

---

## Change Log

| Date | Who | What Changed |
|------|----|--------------|
| 2026-05-15 | Moosa | Initial registry created — all currently approved providers listed |
| 2026-05-15 | Moosa | Zoho explicitly marked rejected after Zoho incident |

---

*Providers not in this file are not approved. Do not use them. Do not test them. Do not assume them.*