# AI GOVERNANCE REPORTING — TECHNICAL ARCHITECTURE
## CTO Implementation Plan

**Owner:** CTO
**Status:** DRAFT — for implementation
**Date:** 2026-05-07
**Sourced from:** CPO/AI-GOVERNANCE-REPORTING-SPEC.md + CTO/SESSION-STATES/2026-05-07-001.md

---

## 1. INFRASTRUCTURE OVERVIEW

**Current Stack:**
- Worker: moosa-worker at `/root/.openclaw/workspace/`
- Supabase Project A: `https://btrbczqjwzuybgcxckvm.supabase.co` (22 tables, orchestration tables added)
- Redis: queue and pub/sub
- PM2: process management
- File storage: workspace filesystem (`clients/` directories)

**Governance storage strategy:** Hybrid — Supabase for queryable structured data + filesystem for JSONL append-only audit logs (per CPO spec). This balances fast lookups with tamper-evident append-only requirements.

---

## 2. DATA MODEL — SUPABASE TABLES

### Table: `audit_trail_events`

```sql
CREATE TABLE audit_trail_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor TEXT NOT NULL,
  actor_type TEXT NOT NULL,  -- 'ai-agent' | 'human' | 'automated-system'
  action_type TEXT NOT NULL, -- 'lead-contacted' | 'email-sent' | 'escalation-triggered' | etc.
  lead_id TEXT,
  channel TEXT,             -- 'whatsapp' | 'email' | 'sms' | 'system'
  details TEXT NOT NULL,
  context JSONB,             -- AI decision context
  result TEXT NOT NULL,      -- 'sent' | 'failed' | 'bounced' | 'pending'
  prev_hash TEXT,            -- SHA-256 of previous entry in chain
  hash TEXT NOT NULL,        -- SHA-256 of this entry
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_client_time ON audit_trail_events(client_id, timestamp DESC);
CREATE INDEX idx_audit_run_id ON audit_trail_events(run_id);
CREATE INDEX idx_audit_lead ON audit_trail_events(lead_id) WHERE lead_id IS NOT NULL;
```

### Table: `session_logs`

```sql
CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  run_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  actor TEXT NOT NULL,
  actions_taken JSONB NOT NULL,  -- Array of action objects
  decisions_summary JSONB NOT NULL,
  errors JSONB DEFAULT '[]',
  escalations_triggered INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  whatsapp_sent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_client_time ON session_logs(client_id, started_at DESC);
CREATE INDEX idx_session_run ON session_logs(run_id);
```

### Table: `error_reports`

```sql
CREATE TABLE error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id TEXT NOT NULL UNIQUE,  -- 'ERR-YYYY-MM-DD-NNN'
  client_id TEXT NOT NULL,
  run_id TEXT,
  detected_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  time_to_resolve_minutes INTEGER,
  error_type TEXT NOT NULL,     -- 'outbound-channel-failure' | 'crm-sync-error' | etc.
  channel TEXT,
  severity TEXT NOT NULL,       -- 'low' | 'medium' | 'high' | 'critical'
  lead_id TEXT,
  description TEXT NOT NULL,
  attempted_fixes JSONB NOT NULL,  -- Array of {action, result, outcome}
  final_resolution TEXT NOT NULL,
  client_notification_required BOOLEAN DEFAULT FALSE,
  client_notified_at TIMESTAMPTZ,
  auto_resolved BOOLEAN DEFAULT FALSE,
  escalated_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_client_time ON error_reports(client_id, detected_at DESC);
CREATE INDEX idx_error_severity ON error_reports(severity) WHERE resolved_at IS NULL;
```

### Retention Policy

| Table | Starter/Growth | Scale |
|---|---|---|
| audit_trail_events | 24 months | 60 months |
| session_logs | 90 days | 24 months |
| error_reports | 24 months | 60 months |

Implement via Supabase cron job (`pg_cron`) or application-level cleanup.

---

## 3. INTEGRATION WITH MOOSA-WORKER

### 3.1 Audit Trail Emission

In `moosa-worker/src/core/loop.js` (or equivalent), wrap every pipeline action:

```javascript
// After each action completes
await emitAuditEvent({
  actor: 'moosa-ai',
  actor_type: 'ai-agent',
  action_type: 'email-sent',
  lead_id: lead.id,
  channel: 'email',
  details: `Follow-up sent to ${lead.email} via email`,
  context: { lead_score: lead.score, cadence_day: day, template: 'follow-up-v1' },
  result: 'sent'
});
```

The `emitAuditEvent` helper:
1. Computes `prev_hash` from last audit entry for this client
2. Computes `hash` = SHA-256(prev_hash + timestamp + action_type + actor + details)
3. Inserts into `audit_trail_events`
4. Also appends to `clients/{client_id}/logs/audit/{YYYY-MM}.jsonl`

### 3.2 Session Log Capture

Each engine run wraps in a session context:

```javascript
const session = {
  session_id: `session-${Date.now()}`,
  run_id: `run-${Date.now()}`,
  client_id: clientId,
  started_at: new Date().toISOString(),
  actions_taken: []
};

// During run — for each decision
session.actions_taken.push({
  sequence: n,
  type: 'follow-up-sent',
  input: '...',
  decision: '...',
  output: '...',
  result: 'sent'
});

// On run complete
session.ended_at = new Date().toISOString();
session.duration_seconds = (new Date(session.ended_at) - new Date(session.started_at)) / 1000;
session.decisions_summary = summarizeDecisions(session.actions_taken);
await insertSessionLog(session);
```

### 3.3 Error Report Generation

Wrap all outbound channel calls:

```javascript
async function sendWithErrorTracking(lead, channel, message) {
  const errorReport = {
    error_id: `ERR-${Date.now()}`,
    client_id: lead.client_id,
    detected_at: new Date().toISOString(),
    error_type: 'outbound-channel-failure',
    channel,
    lead_id: lead.id,
    attempted_fixes: []
  };

  try {
    if (channel === 'whatsapp') {
      await whatsappClient.send(message);
    } else if (channel === 'email') {
      await emailClient.send(message);
    }
    return { success: true };
  } catch (err) {
    errorReport.description = err.message;
    errorReport.attempted_fixes.push({ action: 'primary-channel', result: err.message, outcome: 'not-resolved' });
    
    // Try fallback
    const fallbackChannel = channel === 'whatsapp' ? 'email' : 'whatsapp';
    try {
      if (fallbackChannel === 'email') {
        await emailClient.send(message);
      }
      errorReport.attempted_fixes.push({ action: 'fallback-via-email', result: 'success', outcome: 'resolved' });
      errorReport.final_resolution = `Delivered via ${fallbackChannel} fallback`;
      errorReport.auto_resolved = true;
      errorReport.resolved_at = new Date().toISOString();
    } catch (fallbackErr) {
      errorReport.attempted_fixes.push({ action: 'fallback', result: fallbackErr.message, outcome: 'not-resolved' });
      errorReport.final_resolution = 'No resolution — escalated';
      errorReport.severity = 'high';
      errorReport.escalated_to = 'cto';
    }

    await insertErrorReport(errorReport);
    return { success: false, error_report: errorReport };
  }
}
```

---

## 4. FRIDAY REPORT INTEGRATION

**File:** `strateon-site/send-weekly-report-email.js`

Add new function:

```javascript
async function generateGovernanceSummary(clientId, weekStart, weekEnd) {
  // Get audit event count
  const { count: actionCount } = await supabase
    .from('audit_trail_events')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('timestamp', weekStart)
    .lte('timestamp', weekEnd);

  // Get session summary
  const { data: sessions } = await supabase
    .from('session_logs')
    .select('decisions_summary, leads_contacted, emails_sent, whatsapp_sent')
    .eq('client_id', clientId)
    .gte('started_at', weekStart)
    .lte('started_at', weekEnd);

  const totalDecisions = sessions.reduce((sum, s) => sum + s.decisions_summary.total, 0);
  const aiDecisions = sessions.reduce((sum, s) => sum + s.decisions_summary.auto, 0);

  // Get error summary
  const { data: errors } = await supabase
    .from('error_reports')
    .select('severity, auto_resolved')
    .eq('client_id', clientId)
    .gte('detected_at', weekStart)
    .lte('detected_at', weekEnd);

  const totalErrors = errors.length;
  const autoResolved = errors.filter(e => e.auto_resolved).length;

  // Verify audit chain integrity
  const chainIntact = await verifyAuditChain(clientId, weekStart, weekEnd);

  return {
    actionsLogged: actionCount,
    sessionsRun: sessions.length,
    decisionsMade: totalDecisions,
    aiDecisions,
    errors: totalErrors,
    errorsAutoResolved: autoResolved,
    auditChain: chainIntact ? '✅ intact' : '❌ BROKEN — investigate'
  };
}
```

Append to Friday report output:

```javascript
const governance = await generateGovernanceSummary(clientId, weekStart, weekEnd);
const governanceSection = `
══ AI GOVERNANCE SUMMARY ══
• Actions logged: ${governance.actionsLogged}
• Sessions run: ${governance.sessionsRun}
• Decisions made: ${governance.decisionsMade} (AI: ${governance.aiDecisions})
• Errors: ${governance.errors} (${governance.errorsAutoResolved} auto-resolved)
• Audit chain: ${governance.auditChain}

Reply GOVERNANCE to receive a full audit export.
`;
```

---

## 5. ACCESS CONTROL

### File-based logs (JSONL append-only)
- Directory structure: `clients/{client_id}/logs/{audit|sessions|errors}/`
- OS-level: `chmod 700 clients/` (only moosa-worker process owner can read/write)
- Export: generate temporary signed URL (48h expiry), deliver via WhatsApp or email

### Supabase RLS
```sql
-- Enable RLS on all governance tables
ALTER TABLE audit_trail_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- Policy: clients can only see their own data
CREATE POLICY client_isolation_audit ON audit_trail_events
  USING (client_id = current_setting('app.client_id', true));
```

### Scale tier live dashboard
- Separate read-only Supabase connection for dashboard
- RLS enforced on connection level

---

## 6. IMPLEMENTATION ORDER

### Phase 1: Error Reports (Week 1) — HIGHEST PRIORITY
- Add `error_reports` Supabase table
- Wrap WhatsApp and email sends in try-catch with structured error capture
- Error report auto-insert on resolution
- Friday report shows error count + resolution rate
- **Why first:** Lowest risk, highest immediate client value. Shows "something failed and here's how it was fixed." Visible proof of governance in week 1.

### Phase 2: Audit Trail (Week 2)
- Add `audit_trail_events` Supabase table + JSONL filesystem append
- Add `emitAuditEvent()` to every pipeline action
- Add SHA-256 chain hash to each entry
- Weekly chain verification script

### Phase 3: Session Logs (Week 3)
- Add `session_logs` Supabase table
- Wrap engine runs in session context capture
- Session summary in Friday report

### Phase 4: Friday Integration + Export (Week 4)
- `generateGovernanceSummary()` function in weekly-report.js
- New GOVERNANCE section in Friday output
- `GOVERNANCE` reply handler → generate secure export link
- Scale: live dashboard scaffolding

---

## 7. DEPENDENCIES

| Dependency | Owner | Status |
|---|---|---|
| Supabase `audit_trail_events` table | CTO | Pending |
| Supabase `session_logs` table | CTO | Pending |
| Supabase `error_reports` table | CTO | Pending |
| `emitAuditEvent()` helper | CTO | Pending |
| Session context wrapper | CTO | Pending |
| Error tracking wrapper | CTO | Pending |
| `generateGovernanceSummary()` | CTO | Pending |
| Chain verification script | CTO | Pending |
| RLS policies | CTO | Pending |
| Retention cron jobs | CTO | Pending |

---

## 8. OUTSTANDING QUESTIONS (CPO requests answers)

1. **Orchestration framework session capture** — does existing `orchestration/` system capture decision chains? The event schemas from orchestration framework (event-schemas.ts) define `plan.*`, `step.*`, `job.*` events — can these be reused or extended for governance session logs?

2. **Client data directories** — where are `clients/{client_id}/` directories stored currently? Are they in the workspace? Can we add `logs/` subdirectories with existing infra?

3. **Friday report generator** — is `send-weekly-report-email.js` the right place to add governance, or should it be a separate module?

4. **Error capture** — are existing outbound calls (WhatsApp, email) already wrapped in error handling? If yes, what's the pattern? If no, this is the first implementation priority.

5. **Data isolation confirmation** — confirm per-client RLS on Supabase governance tables prevents cross-client visibility.

---

## 9. TECHNICAL RISKS

| Risk | Likelihood | Mitigation |
|---|---|---|
| moosa-worker modification too invasive | Medium | Phase 1 targets only error wrapping — minimal change, highest value |
| JSONL append performance at scale | Low | JSONL is append-only — O(1) writes. Query via Supabase, not file scan |
| Audit chain hash conflicts | Very Low | SHA-256 has 2^256 search space; UUID collision negligible |
| Supabase cost increase | Low | Retention limits control data volume; index on (client_id, timestamp) keeps queries fast |

---

*Document Status:* DRAFT — Ready for CTO implementation
*Prepared by:* CTO (with CEO synthesis from CPO spec) — 2026-05-07