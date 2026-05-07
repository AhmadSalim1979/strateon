# AI GOVERNANCE REPORTING — FEATURE SPEC
## Pipeline Execution Service — Native Feature

**Owner:** CPO (Chief Product Development Officer)
**Status:** DRAFT — for CTO coordination
**Date:** 2026-05-07

---

## 1. WHY THIS FEATURE

AI accountability is the #1 enterprise procurement criterion (47% of buyers, per GIR #033). Enterprise players can't serve SMBs affordably. SMB tools skip governance entirely. Qiyadon wins by being the only pipeline execution service that gives SMBs the same audit and governance capability enterprises pay millions for.

This is not an add-on. It is a native, built-in feature of the pipeline execution service — available to all tiers (with differentiation), always running, always recording.

---

## 2. WHAT WE BUILD — THE THREE COMPONENTS

### 2A. AUDIT TRAIL — "Every Action, Every Client, Every Time"

**Purpose:** A tamper-evident, append-only log of every action taken on a client's pipeline. Who did what, when, why, and against which lead/contact.

**What gets logged:**

| Field | Description | Example |
|---|---|---|
| `timestamp` | ISO 8601 UTC time of the action | `2026-05-07T09:14:22Z` |
| `actor` | Who or what performed the action | `moosa-ai`, `system`, `ahmad-salim` |
| `actor_type` | Category of actor | `ai-agent`, `human`, `automated-system` |
| `client_id` | Which client's pipeline | `client-demo` |
| `action_type` | Categorical classification | `lead-contacted`, `email-sent`, `escalation-triggered`, `cadence-modified` |
| `lead_id` | Which lead was affected (if applicable) | `lead-001` or null |
| `channel` | Which channel was used | `whatsapp`, `email`, `sms`, `system` |
| `details` | Human-readable description of what happened | `"First outreach sent to john@company.com via WhatsApp"` |
| `context` | AI decision context (why this action was taken) | `"Lead score 8 — Hot. Cadence day 1. Template: first-touch-v1"` |
| `result` | Outcome of the action | `sent`, `failed`, `bounced`, `pending` |
| `run_id` | Which engine run triggered this | `run-2026-05-07-001` |

**Storage:** Per-client JSONL file in the client's data directory:
```
clients/{client_id}/logs/audit/{YYYY-MM}.jsonl
```
One line per action. Never overwritten. Never deleted (retention: 24 months standard, 60 months Scale tier).

**Access:** 
- Friday report includes a summary excerpt (last 7 days, top 20 actions)
- Full log accessible on-demand via request
- Scale tier: live append-only log viewer

**Audit Integrity:**
- Each entry includes a hash of the previous entry (`prev_hash`) — creating a chain that makes tampering detectable
- Hash algorithm: SHA-256 of (previous_hash + timestamp + action_type + actor + details)
- If the chain is broken, it's flagged immediately

---

### 2B. SESSION LOGS — "The AI's Working Memory"

**Purpose:** Structured logs of every AI decision and action cycle — including reasoning, context, and what was decided and why. This is the difference between "we sent a follow-up" and "we decided to send a follow-up because X, using Y approach, and the result was Z."

**Log Entry Structure:**

```json
{
  "session_id": "session-2026-05-07-001",
  "run_id": "run-2026-05-07-001",
  "client_id": "client-demo",
  "started_at": "2026-05-07T08:00:00Z",
  "ended_at": "2026-05-07T08:45:00Z",
  "duration_seconds": 2700,
  "actor": "moosa-worker",
  "actions_taken": [
    {
      "sequence": 1,
      "type": "lead-ingestion",
      "timestamp": "2026-05-07T08:01:00Z",
      "input": "3 new leads submitted via WhatsApp",
      "decision": "Score each lead using hot-warm-cold model, assign cadence day 0 for hot leads, day 1 for warm, day 2 for cold",
      "output": "3 leads scored and queued: lead-042 (Hot, day 0), lead-043 (Warm, day 1), lead-044 (Cold, day 2)",
      "result": "success"
    },
    {
      "sequence": 2,
      "type": "follow-up-sent",
      "timestamp": "2026-05-07T08:15:00Z",
      "input": "lead-042 due for day 0 first touch",
      "decision": "Send first outreach via WhatsApp using first-touch-v1 template. Lead is Hot (score 9), company is Series A SaaS. Language: direct, value-first.",
      "output": "WhatsApp message sent to +1-555-0123. Message: 'Hi John — [company] came up in our pipeline review. Happy to sync on what's working in your pipeline.'",
      "result": "sent"
    },
    {
      "sequence": 3,
      "type": "dormancy-check",
      "timestamp": "2026-05-07T08:30:00Z",
      "input": "7 leads past dormancy threshold (5 days)",
      "decision": "Trigger recovery sequence for all 7 leads. Recovery angle: value reminder (day 1), social proof (day 2), direct ask (day 3). No client decision needed until after day 3.",
      "output": "Recovery sequence initiated for 7 leads. First recovery message scheduled for today 2pm.",
      "result": "initiated"
    }
  ],
  "decisions_summary": {
    "total": 3,
    "auto": 3,
    "human_escalated": 0,
    "overridden": 0
  },
  "errors": [],
  "escalations_triggered": 0,
  "leads_contacted": 10,
  "emails_sent": 4,
  "whatsapp_sent": 6
}
```

**Storage:** Per-session JSON file:
```
clients/{client_id}/logs/sessions/{YYYY-MM-DD}-{session_id}.json
```

**Retention:** 90 days (Starter/Growth), 24 months (Scale).

**Access:**
- Weekly report includes session count and decision summary
- On-demand: full session logs available for any date range
- Scale tier: session log archive with search (by lead, by action type, by date)

**Why this matters for SMB governance:**
SMBs don't have a VP of Sales with deep pipeline oversight. They trust Moosa to run their pipeline. Session logs prove Moosa is making good decisions — not just that the right emails were sent, but that the right reasoning was applied. When a client asks "why did we follow up with this lead again?", we can show them the full decision chain.

---

### 2C. ERROR REPORTS — "What Happened, What We Tried, What Fixed It"

**Purpose:** When something fails in the pipeline execution (email bounced, WhatsApp message undelivered, CRM sync error), the error report documents exactly what failed, what was attempted to fix it, and how it was resolved. This turns every failure into a closed loop with a paper trail.

**Error Report Structure:**

```json
{
  "error_id": "ERR-2026-05-07-001",
  "client_id": "client-demo",
  "run_id": "run-2026-05-07-001",
  "detected_at": "2026-05-07T09:14:22Z",
  "resolved_at": "2026-05-07T09:22:05Z",
  "time_to_resolve_minutes": 8,
  "error_type": "outbound-channel-failure",
  "channel": "whatsapp",
  "severity": "medium",
  "lead_id": "lead-042",
  "lead_phone": "+1-555-0123",
  "description": "WhatsApp message delivery failed — phone number not on WhatsApp",
  "attempted_fix_1": {
    "action": "Validate phone number format",
    "result": "Number format is valid: +1-555-0123",
    "outcome": "not-resolved"
  },
  "attempted_fix_2": {
    "action": "Retry via WhatsApp Business API",
    "result": "Second delivery attempt failed with same error",
    "outcome": "not-resolved"
  },
  "attempted_fix_3": {
    "action": "Switch to email channel as fallback",
    "result": "Email sent successfully to john@company.com",
    "outcome": "resolved"
  },
  "final_resolution": "Delivered via email fallback. WhatsApp delivery marked as permanently failed for this number. Lead flagged as 'email-preferred'.",
  "client_notification_required": true,
  "client_notified_at": "2026-05-07T09:25:00Z",
  "auto_resolved": true,
  "escalated_to": null
}
```

**Severity Levels:**
- `low` — Non-critical, auto-resolved, no client impact (e.g., CRM field formatting issue)
- `medium` — Action failed but fallback succeeded, client may need to know (e.g., WhatsApp failed but email worked)
- `high` — Action failed with no resolution, client impact (e.g., entire follow-up sequence halted)
- `critical` — Service-level failure, immediate escalation (e.g., CRM credentials invalid, all sequences paused)

**Storage:** Per-error JSON file + aggregated monthly report:
```
clients/{client_id}/logs/errors/{YYYY-MM-DD}-{error_id}.json
clients/{client_id}/reports/errors/{YYYY-MM}.json  (aggregated)
```

**Error Report Summary (Monthly, delivered in Friday Report):**
```
══ ERRORS THIS MONTH ══
• Total errors: [X]
• Auto-resolved: [X] | [Y%] 
• Required client action: [X]
• Mean time to resolve: [X] minutes
• Critical errors: [X]

══ ERROR BREAKDOWN ══
• WhatsApp failures: [X] (email fallback: [Y] succeeded)
• Email bounces: [X] (retried: [Y] succeeded)
• CRM sync errors: [X] (auto-fixed: [Y])
• Rate limit hits: [X]

══ CURRENTLY OPEN ══
• [Error] — [Lead] — [Status] — [Since DATE]
```

**Access:**
- Friday report includes error summary (errors this week)
- Error detail accessible on-demand
- Scale tier: real-time error alerting to client dashboard

---

## 3. INTEGRATION WITH FRIDAY REPORT

The Friday Weekly Pipeline Report gains a new section:

```
══ AI GOVERNANCE SUMMARY ══
Week of 2026-05-01 to 2026-05-07

• Actions logged: [X]
• Sessions run: [X]
• Decisions made: [X] (AI: [X] | Human: [X])
• Errors: [X] (all auto-resolved)
• Audit chain: ✅ intact

══ ACCESS FULL LOGS ══
Audit trail: /clients/{client_id}/logs/audit/2026-05.json
Session logs: /clients/{client_id}/logs/sessions/
Error reports: /clients/{client_id}/logs/errors/

—or reply GOVERNANCE to receive a full export
```

This section is included in all tiers. Scale tier clients get a live link to their governance dashboard.

---

## 4. DELIVERY FORMATS

| Format | When | Who Receives | Content |
|---|---|---|---|
| **Friday Report Section** | Every Friday | Client (via WhatsApp) | Governance summary — actions, errors, audit integrity |
| **Full Audit Export** | On-demand (reply GOVERNANCE) | Client | Last 7 days of audit trail, session logs, error reports as JSONL + markdown |
| **Monthly Governance Report** | 1st of month | Client + internal | Full month error analysis, AI decision quality review, audit chain verification |
| **Live Dashboard** (Scale only) | Always available | Client | Real-time audit trail, active sessions, open errors |

**Export format (on-demand):**
- ZIP file containing:
  - `audit-{YYYY-MM}.jsonl` — full audit trail for the period
  - `sessions-{YYYY-MM}.json` — all session logs
  - `errors-{YYYY-MM}.json` — all error reports
  - `governance-report.md` — human-readable summary
- Delivered via secure link (expires in 48 hours)

---

## 5. TECHNICAL REQUIREMENTS (CTO to implement)

The CTO must address the following in technical implementation:

### 5.1 Storage Architecture
- Each client gets a dedicated data directory: `clients/{client_id}/`
- Subdirectories: `logs/audit/`, `logs/sessions/`, `logs/errors/`, `reports/`
- JSONL for audit trail (append-only), JSON for sessions and errors
- Retention enforcement: automated cleanup of files older than retention period

### 5.2 Audit Chain Integrity
- Each audit entry includes `prev_hash` — chain must be verifiable
- Hash verification script runs weekly (can be part of Friday report generation)
- If chain is broken, flag immediately to CTO + CEO

### 5.3 Session Log Capture
- Moosa worker (main execution engine) must emit structured session logs
- This requires modification to the existing orchestration framework to include session context tracking
- Each session should have a unique `run_id` that ties back to audit trail entries

### 5.4 Error Detection + Reporting
- Error detection: wrap all outbound channel calls (WhatsApp, email) in try-catch with structured error capture
- Error report auto-generated on resolution
- Critical errors: immediate alert to CTO + CEO

### 5.5 Friday Report Integration
- `weekly-report.js` needs a new function: `generateGovernanceSummary(clientId, weekStart, weekEnd)`
- Output appended to the existing Friday report as a new section
- Both WhatsApp-friendly text format and JSON for Scale dashboard

### 5.6 Access Control
- Audit/session/error logs: client can only access their own client directory
- Internal access: all logs accessible to Qiyadon team (Moosa, CTO, COO)
- Export: authenticated via session token, expires in 48 hours

---

## 6. TIER DIFFERENTIATION

| Feature | Starter | Growth | Scale |
|---|---|---|---|
| Audit trail (7-day rolling) | ✅ | ✅ | ✅ |
| Session logs (90-day retention) | ✅ | ✅ | ✅ |
| Error reports | ✅ | ✅ | ✅ |
| Friday report governance section | ✅ | ✅ | ✅ |
| Full audit export (on-demand) | ✅ | ✅ | ✅ |
| Monthly governance report | — | — | ✅ |
| Session logs retention | 90 days | 90 days | 24 months |
| Audit trail retention | 24 months | 24 months | 60 months |
| Live governance dashboard | — | — | ✅ |
| Real-time error alerting | — | — | ✅ |
| Audit chain hash verification | — | — | ✅ |

---

## 7. PRODUCT DECISIONS TO CONFIRM

| Decision | Recommendation | Rationale |
|---|---|---|
| Retention period | Starter/Growth: 90 days sessions / 24 months audit. Scale: 24 months sessions / 60 months audit | Balance storage cost with compliance needs |
| Chain hash algorithm | SHA-256 | Sufficient for tamper detection at SMB scale |
| Error severity threshold for client notification | Medium and above | Low severity errors are auto-resolved; clients don't need to know |
| On-demand export delivery | Secure link, 48-hour expiry | Security without adding friction |
| Monthly governance report | 1st of month, delivered in Friday report channel | Built into existing rhythm, no new deliverable |
| Audit log format | JSONL (append-only) | Easy to stream, grep, and process without loading full file |

---

## 8. OUTSTANDING QUESTIONS FOR CTO

1. **Current orchestration framework** — does the existing `orchestration/` system capture session context and decision chains? If not, what modification is needed?
2. **Storage** — where are client data directories currently stored? Can we add `logs/` subdirectories with the existing infrastructure?
3. **Friday report generator** — is `weekly-report.js` the right place to add governance summary, or should it be a separate module?
4. **Error capture** — are existing outbound channel calls (WhatsApp, email) wrapped in structured error handling? If not, that's the first implementation priority.
5. **Client data isolation** — confirm that file-based storage with per-client directories maintains proper isolation.

---

## 9. RELATIONSHIP TO EXISTING SPEC

This feature is native to the Pipeline Execution Service (v1.0 spec, finalized 2026-05-01). It extends:
- **Workflow A (Onboarding):** Audit trail starts from Day 1 of client onboarding
- **Workflow B (Daily Cycle):** Every action in the daily cycle emits audit + session log entries
- **Workflow C (Weekly Reporting):** Friday report gains a new section (Section 3 above)
- **Success Metrics:** Add "audit log completeness rate" as a service health metric

This feature does NOT change pricing, tiers, or scope boundaries. It enhances the product's accountability story.

---

## 10. SUCCESS METRICS FOR THIS FEATURE

| Metric | Definition | Target |
|---|---|---|
| Audit trail completeness | % of pipeline actions with audit entry | 100% |
| Session log coverage | % of engine runs with session log | 100% |
| Error report resolution rate | % of errors with resolution documented | 100% |
| Audit chain integrity | % of weekly checks with intact chain | 100% |
| Client governance report engagement | % of clients who request full export or view dashboard (Scale) | Measured at 90 days post-launch |

---

**Document Status:** DRAFT — Pending CTO technical coordination and CEO sign-off

**Next Steps:**
1. CPO + CTO review session — align on technical approach (this document as agenda)
2. CTO writes technical implementation plan (separate document)
3. CEO approves feature spec
4. CTO implements incrementally: Error Reports → Audit Trail → Session Logs → Friday Report Integration

---

*Prepared by: CPO, Qiyadon*
*Date: 2026-05-07*