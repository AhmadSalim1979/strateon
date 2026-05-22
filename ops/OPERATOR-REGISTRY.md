# OPERATOR-REGISTRY.md — Authoritative Operator Identity

**Purpose:** Single source of truth for all operational contact identifiers.
**Rule:** No operational identifier (email, phone, domain) may be generated, inferred, or hardcoded outside this registry.
**Rule:** All email-sending code MUST validate destination against this registry before sending.

---

## Operator Identity

| Field | Value | Source |
|---|---|---|
| `operator_name` | Ahmad Salim | Direct — verified |
| `operator_email_primary` | ahmad.salim@qiyadon.com | EMAIL-SIGNATURES.md (PRIMARY), qiyadon-email-credentials.json (email_ahmad.address) |
| `operator_email_backup` | contact@qiyadon.com | OPERATIONAL-ASSETS.md, EMAIL-SIGNATURES.md (Asset 1 — contact signature) |
| `operator_whatsapp` | +923215139934 | OpenClaw authorized senders, USER.md |

---

## Source of Truth Note

**No email address in this system is valid unless it appears in this registry.**
Pattern-generated, memory-inferred, or hallucinated identifiers must be rejected.
The only approved alert destinations are the two listed above.

**SMTP credentials source:** `/home/node/.openclaw/secrets/qiyadon-email.json`
**SMTP auth user:** `contact@qiyadon.com` (SMTP auth — verified via Neo dashboard)
**SMTP host:** `smtp0001.neo.space`
**SMTP port:** `587` (STARTTLS)

---

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-22 | Initial creation — extracted from EMAIL-SIGNATURES.md, OPERATIONAL-ASSETS.md, qiyadon-email-credentials.json | Moosa |