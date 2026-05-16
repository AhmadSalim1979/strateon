# APPROVAL AUTHORITY REGISTRY

**Version:** 1.0
**Date:** 2026-05-16
**Status:** ACTIVE — AUDIT_ONLY Phase 1

---

## Authoritative Channels

| Channel | Authority | Notes |
|---|---|---|
| WhatsApp (+923215139934) | ✅ YES | Primary — only authoritative channel |
| OpenClaw `/approve` command | ✅ YES | Session-bound only |
| Telegram | ❌ NO | Not configured |
| Email | ❌ NO | Not real-time |
| Slack/Discord | ❌ NO | Third-party |

---

## Authoritative Operators

| Operator | E.164 | Authority | Scope |
|---|---|---|---|
| Ahmad Salim | +923215139934 | ✅ YES | ALL operations — unrestricted |

---

## Approval Parameters

| Parameter | Value |
|---|---|
| APPROVAL_MAX_AGE_MS | 1,800,000 (30 minutes) |
| APPROVAL_CRITICAL_MAX_AGE_MS | 300,000 (5 minutes) |
| AMBIGUITY_THRESHOLD | 0.85 |
| Keyword: STRONG | approved, proceed, do it, go ahead |
| Keyword: MEDIUM | ok (escalates) |
| Keyword: BLOCKED | yes alone — insufficient |
| Emoji | NEVER authorize execution |

---

## Required Message Format

Approval messages must include:

```
approved operation_id=<id> action_hash=<hash>
```

**operation_id** — required, identifies the operation
**action_hash** — required, SHA-256 of exact action

**Rejected formats:**
- `yes` → BLOCKED (no operation_id)
- `👍` → BLOCKED (clarification only)
- `approved` → BLOCKED (no operation_id)
- `approved operation_id=abc` → BLOCKED (no action_hash)

---

## Non-Authority Sources (Evidence Only)

The following sources are **NEVER** authoritative for approval:

- `memory/*.md` — historical context only
- `strateon/business/EMAIL-SIGNATURES.md` — evidence only
- `moosa-worker.log` — log file, not authority
- Any `.log` file — evidence only
- Any workspace file — editable after the fact

---

## Pre-Authorized Operations

**NONE in Phase 1.**

No pm2 restart or other operations are pre-authorized.
Every operation requires individual verified approval in the required format.

---

## Status

**AUDIT_ONLY Phase 1:** APAC observes and logs only.
No approval can authorize, deny, or modify execution.