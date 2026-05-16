# APAC v3 — Approval Provenance & Authority Chain Design
**Version:** 3.0 (Evidence-Revised)
**Date:** 2026-05-16
**Supersedes:** APAC v2 (2026-05-16, earlier same day)
**Status:** APPROVED — Architecture Baseline, Not Implemented
**Supersedes document:** EPISTEMIC-ENFORCEMENT-LAYER.md (EEL design — APAC is its approval sub-system)

---

## Relationship to EEL

APAC v3 is the **approval authority sub-system** of the Epistemic Enforcement Layer (EEL). It defines:

- What constitutes a VERIFIED approval for EEL's `eelClassify()` function
- How EEL classifies approval facts (category: `approval`)
- The authoritative registry and schema for approval provenance
- The lifecycle rules for the `approval` category in EEL truth classification

EEL E1 covers the gate, fact model, and classification engine.
EEL E2 covers the output sanitizer and operator-facing labeling.
**APAC v3 covers the `approval` category — the most sensitive category in EEL.**

EEL `eelClassify()` for `category = 'approval'` implements APAC v3 rules.

---

## Core Principle

**EEL classifies an approval as VERIFIED only when every element of the provenance chain is independently verifiable, traceable to an authoritative WhatsApp message, and freshly present in the incoming message. There is no ASSUMED path to execution authorization. There is no emergency bypass of verification.**

The only valid EEL classification states for an approval are:
- **VERIFIED** — all 14 conditions met, execution authorized
- **BLOCKED** — one or more conditions failed, execution denied

There is no third path. ASSUMED does not authorize execution.

---

## APPROVAL_SCHEMA (v3)

```typescript
APPROVAL_SCHEMA = {
  approval_message_id:      string,          // WhatsApp MessageSid — required
  approval_message_id_full: string | null,   // MessageSidFull if available — optional
  operation_id:              string,          // Required — links to specific operation
  dispatch_id:               string | null,    // If applicable
  action_hash:              string,           // SHA-256 of exact action — required
  channel:                 'whatsapp',       // Fixed — only WhatsApp is authoritative
  sender:                  string,           // +923215139934 in E.164
  timestamp:               ISO-8601,          // Message send time
  keyword_match:            string,           // Matched keyword from message body
  forward_detected:        boolean,          // true if ForwardedFrom flag present
  body_text:               string,           // Raw message body for action_hash verification
}
```

**Key change from v2:** `approval_id` (UUID) → `approval_message_id` (TEXT, WhatsApp MessageSid).

---

## Required Approval Message Format (Operator Instructions)

The operator sends approvals via WhatsApp using this format:

```
approved operation_id=<id> action_hash=<hash>
```

**Example:**
```
approved operation_id=abc-123 action_hash=3f2e1d0c9b8a7f6e5d4c3b2a1
```

**Rules:**
- `operation_id` is **required** — no operation_id = BLOCKED
- `action_hash` is **required** — no action_hash = BLOCKED
- Keyword must be `approved`, `proceed`, `do it`, or `go ahead` — `yes` alone is insufficient
- `yes operation_id=abc action_hash=xyz` → BLOCKED (keyword must be unambiguous)

**Rejected formats:**
- `yes` → BLOCKED (no operation_id)
- `yes operation_id=abc-123` → BLOCKED (no action_hash)
- `👍` → BLOCKED (emoji-only, clarification trigger only)
- `approved operation_id=abc-123` → BLOCKED (no action_hash)
- `approved action_hash=3f2e1d` → BLOCKED (no operation_id)

---

## Authoritative Channels

| Channel | Authoritative? | Rationale |
|---|---|---|
| WhatsApp (+923215139934) | ✅ YES | Primary operator channel |
| Telegram (if linked, explicitly approved) | ✅ Conditional | Requires explicit written approval |
| OpenClaw `/approve` command | ✅ YES | Session-bound, timestamp-verified |
| Email | ❌ NO | Not real-time, can be spoofed |
| Slack/Discord | ❌ NO | Third-party, message editable |
| Log files | ❌ NO | Evidence only, not authority |
| Memory files | ❌ NO | Historical context only |
| File writes | ❌ NO | Editable after the fact |

---

## Authoritative Operators

| Operator | Authority | Scope |
|---|---|---|
| Ahmad Salim (+923215139934) | ✅ YES | ALL operations — unrestricted |
| Designated backup operator | ⚠️ CONDITIONAL | Explicit scope only, written designation required |
| moosa-worker / watchdog / C-suite | ❌ NO | Cannot approve — system entities only |

---

## Keyword Strength Rules

| Keyword | Strength | Standalone sufficient? |
|---|---|---|
| `approved` | STRONG | YES — but requires operation_id + action_hash |
| `proceed` | STRONG | YES — but requires operation_id + action_hash |
| `do it` | STRONG | YES — but requires operation_id + action_hash |
| `go ahead` | STRONG | YES — but requires operation_id + action_hash |
| `yes` | STRONG | NO — requires operation_id + action_hash (but still BLOCKED — insufficient keyword) |
| `ok` | MEDIUM | NO — requires context, will ESCALATE |
| Emoji (`👍`, `✓`, `👌`, etc.) | WEAK | NEVER — triggers clarification only |

**Key change:** Even with operation_id and action_hash present, `yes` alone is BLOCKED because the keyword must be one of the four unambiguous STRONG keywords. This prevents ambiguous confirmations.

---

## Approval Expiration

| Parameter | Value |
|---|---|
| APPROVAL_MAX_AGE_MS | 30 minutes (1,800,000ms) |
| APPROVAL_GRACE_MS | 60 seconds |
| APPROVAL_CRITICAL_MAX_AGE_MS | 5 minutes for CRITICAL operations |

---

## Approval Replay Prevention

**Key:** `approval_message_id` (WhatsApp MessageSid) is used as the replay prevention key — stored as TEXT in `APPROVAL_REPLAY_SET`.

```
On approval receipt:
  1. approval_message_id = ctx.MessageSid || ctx.MessageSidFull
  2. IF approval_message_id missing → BLOCK (EEL_APPROVAL_ID_UNAVAILABLE)
  3. IF approval_message_id IN APPROVAL_REPLAY_SET → BLOCK (EEL_APPROVAL_REPLAYED)
  4. ELSE → Add to APPROVAL_REPLAY_SET → Proceed
```

**If neither MessageSid nor MessageSidFull is available:**
- EEL returns `state: BLOCKED, error_code: 'EEL_APPROVAL_ID_UNAVAILABLE'`
- No fallback ID generation — approval cannot be VERIFIED

---

## Emoji Handling

**Rule:** Emoji-only messages trigger clarification only. They never authorize execution.

**Detection:** Body-content analysis (no reaction metadata required — not exposed by OpenClaw).

```javascript
const EMOJI_ONLY_REGEX = /^[\u{1F300}-\u{1F9FF}\s]+$/u;
const ASCII_EMOJI_STRICT = /^(?:👍|✓|👌|😀|👍🏼)+$/;

function isEmojiOnlyMessage(body) {
  return EMOJI_ONLY_REGEX.test(body.trim()) || ASCII_EMOJI_STRICT.test(body.trim());
}
```

**Behavior:**
```
EEL receives "👍" → isEmojiOnlyMessage() = true
→ state: BLOCKED
→ error_code: 'EEL_APPROVAL_EMOJI_BLOCKED'
→ message: "Approvals cannot be sent as emoji reactions. Reply with: 'approved operation_id=<id> action_hash=<hash>'"
→ Logged, not executed
```

---

## Forwarded Content Handling

**Rule:** Forwarded messages can NEVER be VERIFIED.

Signal: `ctx.ForwardedFrom` is set (boolean flag in OpenClaw TemplateContext).

```
IF forward_detected = true → BLOCK (EEL_APPROVAL_FORWARDED)
```

Even with a valid approval_id, forwarded content loses WhatsApp channel authority.

---

## No Memory / History / Logs as Approval Authority

**Hard rule — no exceptions.**

```
APPROVAL_CAN NEVER_BE_DERIVED_FROM:
  - Chat history (current or prior sessions)
  - Memory files (memory/*.md, MEMORY.md)
  - Summaries (daily notes, session states)
  - Log files (moosa-worker.log, any *.log)
  - Email files (sent items, inbox)
  - File content (approvals.md, any workspace file)
  - Previous operator behavior patterns
  - Implied consent from inaction
```

Implementation: `isNonAuthority()` in EEL authority-registry includes all memory, log, summary, and history paths.

---

## Emergency Override

**Emergency mode shortens the workflow but does NOT bypass verification.**

```
EMERGENCY DECLARED:
  1. Operator sends: "EMERGENCY: [operation_id]"
  2. System responds: "Emergency acknowledged. Reply with: 'approved operation_id=<id> action_hash=<hash>' within 60s."
  3. Operator sends approval in required format
  4. EEL verifies ALL 14 conditions
  5. IF VERIFIED → execute
  6. Post-execution: operator must confirm within 60s
  7. IF no confirmation → FLAG incident for review, mark UNCONFIRMED
```

**No pre-authorized restarts.** All pm2 restart commands require individual verified approval.

**No retroactive VERIFIED.** Emergency does not result in "deemed VERIFIED retroactively."

---

## Supabase Approval Schema

```sql
CREATE TABLE approvals (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_message_id       TEXT UNIQUE NOT NULL,           -- WhatsApp MessageSid
  approval_message_id_full  TEXT NULL,                      -- MessageSidFull if available
  operation_id              TEXT NOT NULL,
  dispatch_id              TEXT NULL,
  action_hash              TEXT NOT NULL,
  action_summary           TEXT NOT NULL,
  sender                   TEXT NOT NULL,
  channel                  TEXT NOT NULL DEFAULT 'whatsapp',
  keyword_match            TEXT NOT NULL,
  keyword_strength         TEXT NOT NULL,
  ambiguity_score          REAL NOT NULL DEFAULT 1.0,
  body_text                TEXT NOT NULL,
  forward_detected         BOOLEAN NOT NULL DEFAULT false,
  status                   TEXT NOT NULL DEFAULT 'ACTIVE',
  expires_at              TIMESTAMPTZ NOT NULL,
  revoked_at              TIMESTAMPTZ NULL,
  revoked_by              TEXT NULL,
  revocation_reason        TEXT NULL,
  used_at                 TIMESTAMPTZ NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT no_duplicate_approval UNIQUE (approval_message_id),
  CONSTRAINT valid_status CHECK (status IN ('ACTIVE','USED','REVOKED','EXPIRED'))
);

CREATE INDEX idx_approvals_operation ON approvals(operation_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_message_id ON approvals(approval_message_id);
CREATE INDEX idx_approvals_expires ON approvals(expires_at);

CREATE TABLE approval_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,
  approval_message_id TEXT TEXT NOT NULL,
  operation_id    TEXT NOT NULL,
  event_data      JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Note:** `approval_message_id` is TEXT (not UUID). MessageSid is a string identifier assigned by WhatsApp's server — unique per message and stable.

---

## Approval State Machine

```
                    ┌─────────────┐
                    │  RECEIVED   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌──────────┐  ┌─────────┐
        │ ACTIVE  │  │ REJECTED │  │ EXPIRED │
        └───┬─────┘  └──────────┘  └─────────┘
      ┌─────┼─────┐
      ▼     ▼     ▼
  ┌───────┐ │ ┌────────┐
  │ USED  │ │ │REVOKED │
  └───────┘ │ └────────┘
            │
            ▼
      ┌───────────┐
      │ CORRUPTED │ ← integrity failure
      └───────────┘
```

**Valid transitions:**
- RECEIVED → ACTIVE (all validations passed)
- RECEIVED → REJECTED (validation failed)
- RECEIVED → EXPIRED (timestamp too old at receipt)
- ACTIVE → USED (consumed by operation execution)
- ACTIVE → REVOKED (operator revoked)
- ACTIVE → EXPIRED (aged past max_age while ACTIVE)
- ANY → CORRUPTED (integrity failure detected)

---

## EEL Error Codes for Approval

| Condition | Error Code |
|---|---|
| Approval message ID (MessageSid) unavailable | `EEL_APPROVAL_ID_UNAVAILABLE` |
| Approval not in Supabase | `EEL_APPROVAL_NOT_FOUND` |
| Approval expired | `EEL_APPROVAL_EXPIRED` |
| Approval revoked | `EEL_APPROVAL_REVOKED` |
| Approval replayed | `EEL_APPROVAL_REPLAYED` |
| Wrong channel | `EEL_APPROVAL_WRONG_CHANNEL` |
| Non-authoritative sender | `EEL_APPROVAL_NOT_AUTHORITATIVE` |
| No operation linkage | `EEL_APPROVAL_NO_OPERATION_LINK` |
| No action_hash | `EEL_APPROVAL_NO_ACTION_HASH` |
| Action hash mismatch | `EEL_APPROVAL_ACTION_MISMATCH` |
| Forwarded content | `EEL_APPROVAL_FORWARDED` |
| Emoji-only message | `EEL_APPROVAL_EMOJI_BLOCKED` |
| Insufficient keyword | `EEL_APPROVAL_INSUFFICIENT_KEYWORD` |
| Ambiguous (escalated) | `EEL_APPROVAL_ESCALATED` |
| Missing fields | `EEL_APPROVAL_INCOMPLETE` |

---

## Revocation After Execution

**Rule:** Revocation does not retroactively change historical execution records.

```
ON REVOCATION OF APPROVAL:
  1. Mark status = 'REVOKED' in approvals table
  2. Write REVOKED event to approval_audit_log
  3. Check dependent operations:
     - Not executed: BLOCK pending execution
     - Already executed: FLAG for review, do not reverse
  4. Original execution record remains historically accurate
  5. Notify operator of revocation + dependent actions requiring review
```

---

## 14 Conditions for VERIFIED Approval

All 14 must be met simultaneously:

```
□ approval_message_id (MessageSid) present in TemplateContext
□ operation_id present in message body (operation_id=<value>)
□ action_hash present in message body (action_hash=<value>)
□ keyword is 'approved' | 'proceed' | 'do it' | 'go ahead'
□ body is NOT emoji-only
□ forward_detected = false
□ sender = '+923215139934'
□ channel = 'whatsapp'
□ timestamp within APPROVAL_MAX_AGE_MS (30 minutes)
□ approval_message_id NOT in APPROVAL_REPLAY_SET
□ operation_id NOT in APPROVAL_REVOCATION_SET
□ operation_id + action_hash links to ACTIVE record in approvals table
□ approved action_hash matches proposed action_hash
□ no integrity contradictions in approval record
```

**Any single failure = BLOCKED.**

---

## Pre-Requisites Before Implementation

| # | Prerequisite | Status |
|---|---|---|
| 1 | Supabase `approvals` table (TEXT approval_message_id) | Not created |
| 2 | Supabase `approval_audit_log` table | Not created |
| 3 | `approval_message_id` extraction from TemplateContext | Verified available via ctx.MessageSid |
| 4 | `approval_message_id_full` fallback extraction | Verified available via ctx.MessageSidFull |
| 5 | `EEL_APPROVAL_ID_UNAVAILABLE` error code | Designed, not coded |
| 6 | `EEL_APPROVAL_EMOJI_BLOCKED` error code | Designed, not coded |
| 7 | `isEmojiOnlyMessage()` body-content detector | Designed, not coded |
| 8 | Body parser for `operation_id=` and `action_hash=` | Designed, not coded |
| 9 | `APPROVAL-AUTHORITY-REGISTRY.md` | Not created |
| 10 | OpenClaw `ForwardedFrom` flag handling | Confirmed in TemplateContext |
| 11 | OpenClaw `SenderE164` handling | Confirmed in TemplateContext |
| 12 | `approval_replay_set` reload on startup | Not coded |
| 13 | `approval_revocation_set` reload on startup | Not coded |
| 14 | Full lifecycle wired into moosa-worker | Not wired |
| 15 | AUDIT_ONLY mode test | Not performed |

**Total:** 0 implemented, 15 blocking prerequisites.

---

## Relationship to Other EEL Documents

| Document | Relationship |
|---|---|
| `strateon/EPISTEMIC-ENFORCEMENT-LAYER.md` | Parent design — APAC v3 is the approval sub-system |
| `strateon/eel/src/authority-registry.js` | Will include `ops/APPROVAL-AUTHORITY-REGISTRY.md` when created |
| `strateon/eel/src/fact-classification.js` | `approval` category defined here; APAC v3 provides the complete category spec |
| `strateon/eel/src/eel-gate.js` | Will call approval verification lifecycle for `category='approval'` |
| `strateon/eel/src/eel-output-sanitizer.js` | Approval claims in output are labeled/blocked per APAC v3 rules |
| `strateon/eel/tests/eel-phase-e1-tests.js` | E1 tests unaffected by APAC v3 (category-level tests only) |
| `strateon/eel/tests/eel-phase-e2-tests.js` | E2 tests unaffected by APAC v3 (output layer tests only) |

---

## Design Integrity Statement

APAC v3 makes the following assertions verified during Evidence Validation Step 1:

| Assertion | Confidence | Evidence |
|---|---|---|
| OpenClaw exposes WhatsApp MessageSid in TemplateContext | ✅ VERIFIED | `ctx.MessageSid` in `inbound-meta.ts` line 89 |
| OpenClaw exposes MessageSidFull as fallback | ✅ VERIFIED | `ctx.MessageSidFull` in `inbound-meta.ts` line 90 |
| Sender E.164 is available for +923215139934 | ✅ VERIFIED | `ctx.SenderE164` in `inbound-meta.ts` line 116 |
| Timestamp (Unix ms) is available | ✅ VERIFIED | `ctx.Timestamp` in `inbound-meta.ts` line 31 |
| ForwardedFrom flag is available | ✅ VERIFIED | `ctx.ForwardedFrom` in `inbound-meta.ts` line 138 |
| ReplyToId is available | ✅ VERIFIED | `ctx.ReplyToId` in `inbound-meta.ts` line 91 |
| Emoji reactions not available as metadata | ✅ VERIFIED | No ReactionMessage parsing found in monitor.ts or extract.ts |
| Moosa sees metadata every turn | ✅ VERIFIED | `buildInboundUserContextPrefix()` called in `get-reply-run.ts` |

---

## Hardening Commitments Preserved from v2

| Commitment | Status |
|---|---|
| ASSUMED cannot authorize execution | ✅ Preserved — no ASSUMED path for approvals |
| Emergency override cannot bypass verification | ✅ Preserved — workflow shortens, VERIFIED still required |
| Pre-authorized restarts removed | ✅ Preserved — none in v3 |
| Standalone "yes" is insufficient | ✅ Preserved — keyword must be one of four specific STRONG keywords |
| Emoji never authorizes execution | ✅ Preserved — emoji-only blocked via body detection |
| Session/time-bounded approvals disabled | ✅ Preserved — excluded from v3 |
| Revocation preserves history | ✅ Preserved — execution record unchanged |
| Memory/logs cannot authorize | ✅ Preserved — isNonAuthority() covers all |
| No action_hash = BLOCKED | ✅ Preserved — mandatory field |
| No operation_id = BLOCKED | ✅ Preserved — mandatory field |
| No MessageSid = BLOCKED | ✅ Preserved — explicit rule added |

---

## Document History

| Version | Date | Changes |
|---|---|---|
| v1 | 2026-05-16 (earlier) | Initial design — UUID-only approval_id, ASSUMED path, pre-authorized restarts |
| v2 | 2026-05-16 (same day) | Hardened — removed ASSUMED path, removed pre-authorized restarts, tightened emoji rules, disabled session-scoped approvals |
| **v3** | **2026-05-16 (current)** | **Evidence-revised — MessageSid replaces UUID, practical operator format, emoji body detection, ForwardedFrom confirmed, no reaction metadata** |