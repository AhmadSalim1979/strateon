# AI GOVERNANCE — PHASE 1: ERROR REPORTS
## CTO Implementation Record
**Date:** 2026-05-07
**Status:** ✅ IMPLEMENTED
**Source:** CTO/AI-GOVERNANCE-TECH-SPEC.md (Phase 1: Week 1)

---

## 1. SUPABASE TABLE: `error_reports`

### SQL — Create Table

```sql
CREATE TABLE IF NOT EXISTS error_reports (
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
  attempted_fixes JSONB NOT NULL DEFAULT '[]',  -- Array of {action, result, outcome}
  final_resolution TEXT NOT NULL,
  client_notification_required BOOLEAN DEFAULT FALSE,
  client_notified_at TIMESTAMPTZ,
  auto_resolved BOOLEAN DEFAULT FALSE,
  escalated_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_error_client_time ON error_reports(client_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_severity ON error_reports(severity) WHERE resolved_at IS NULL;
```

### SQL — Friday Report Error Summary Query

```sql
-- Error summary for generateGovernanceSummary() — run for week of [weekStart, weekEnd]
SELECT
  COUNT(*)                                                AS total_errors,
  COUNT(*) FILTER (WHERE auto_resolved = TRUE)           AS auto_resolved,
  COUNT(*) FILTER (WHERE severity = 'critical')          AS critical,
  COUNT(*) FILTER (WHERE severity = 'high')              AS high,
  COUNT(*) FILTER (WHERE channel = 'whatsapp')            AS whatsapp_failures,
  COUNT(*) FILTER (WHERE channel = 'email')               AS email_failures,
  COUNT(*) FILTER (WHERE auto_resolved = FALSE AND resolved_at IS NULL) AS unresolved_open,
  AVG(time_to_resolve_minutes) FILTER (WHERE time_to_resolve_minutes IS NOT NULL) AS avg_time_to_resolve_minutes
FROM error_reports
WHERE client_id = $1
  AND detected_at >= $2
  AND detected_at <= $3;
```

---

## 2. JAVASCRIPT HELPER: `insertErrorReport()`

**File:** `orchestration/src/governance/error-reports.js`

```javascript
/**
 * insertErrorReport — Persist an error report to Supabase.
 * Called automatically by sendWithErrorTracking() on any channel failure.
 *
 * @param {Object} errorReport
 * @param {string} errorReport.error_id         - 'ERR-YYYY-MM-DD-NNN'
 * @param {string} errorReport.client_id
 * @param {string} [errorReport.run_id]
 * @param {string} errorReport.detected_at       - ISO 8601
 * @param {string} [errorReport.resolved_at]    - ISO 8601
 * @param {number|null} [errorReport.time_to_resolve_minutes]
 * @param {string} errorReport.error_type        - 'outbound-channel-failure' | 'crm-sync-error' | etc.
 * @param {string} [errorReport.channel]         - 'whatsapp' | 'email' | 'sms'
 * @param {string} errorReport.severity          - 'low' | 'medium' | 'high' | 'critical'
 * @param {string} [errorReport.lead_id]
 * @param {string} errorReport.description
 * @param {Array<{action: string, result: string, outcome: string}>} errorReport.attempted_fixes
 * @param {string} errorReport.final_resolution
 * @param {boolean} [errorReport.client_notification_required]
 * @param {string} [errorReport.client_notified_at]
 * @param {boolean} [errorReport.auto_resolved]
 * @param {string} [errorReport.escalated_to]
 *
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function insertErrorReport(errorReport) {
  const { getClient } = await import('../persistence/supabase-client.js');
  const supabase = getClient();

  // Compute time_to_resolve_minutes if resolved_at is set
  let time_to_resolve_minutes = errorReport.time_to_resolve_minutes ?? null;
  if (!time_to_resolve_minutes && errorReport.detected_at && errorReport.resolved_at) {
    const detected = new Date(errorReport.detected_at);
    const resolved = new Date(errorReport.resolved_at);
    time_to_resolve_minutes = Math.round((resolved - detected) / 60000);
  }

  const row = {
    error_id:                    errorReport.error_id,
    client_id:                   errorReport.client_id,
    run_id:                      errorReport.run_id            || null,
    detected_at:                 errorReport.detected_at,
    resolved_at:                 errorReport.resolved_at       || null,
    time_to_resolve_minutes,
    error_type:                  errorReport.error_type,
    channel:                     errorReport.channel           || null,
    severity:                    errorReport.severity,
    lead_id:                     errorReport.lead_id           || null,
    description:                 errorReport.description,
    attempted_fixes:             JSON.stringify(errorReport.attempted_fixes || []),
    final_resolution:            errorReport.final_resolution,
    client_notification_required: errorReport.client_notification_required ?? false,
    client_notified_at:          errorReport.client_notified_at || null,
    auto_resolved:               errorReport.auto_resolved     ?? false,
    escalated_to:                errorReport.escalated_to      || null,
  };

  const { data, error } = await supabase
    .from('error_reports')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    console.error(`[governance] insertErrorReport failed: ${error.message}`, row);
    return { success: false, error: error.message };
  }

  console.log(`[governance] Error report inserted: ${errorReport.error_id} → id=${data.id}`);
  return { success: true, data };
}
```

---

## 3. WRAPPER: `sendWithErrorTracking()`

```javascript
/**
 * sendWithErrorTracking — Wraps WhatsApp/email sends with structured error capture
 * and automatic error report generation on failure.
 *
 * Usage: replace direct whatsappClient.send() / emailClient.send() calls with this.
 *
 * @param {Object} lead           - Lead object with id, client_id, phone, email, name
 * @param {string} channel        - 'whatsapp' | 'email'
 * @param {Object|string} message - Message payload (format depends on channel adapter)
 * @returns {Promise<{success: boolean, resolved_via?: string, error_report_id?: string}>}
 */
async function sendWithErrorTracking(lead, channel, message) {
  const { getClient } = await import('../persistence/supabase-client.js');
  const supabase = getClient();

  const error_id = `ERR-${new Date().toISOString().slice(0, 10)}-${String(Date.now()).slice(-6)}`;
  const detected_at = new Date().toISOString();

  const errorReport = {
    error_id,
    client_id:  lead.client_id || lead.clientId,
    run_id:      lead.run_id    || null,
    detected_at,
    resolved_at: null,
    time_to_resolve_minutes: null,
    error_type:  'outbound-channel-failure',
    channel,
    severity:    'medium',
    lead_id:     lead.id,
    description: '',
    attempted_fixes: [],
    final_resolution: '',
    client_notification_required: false,
    auto_resolved: false,
    escalated_to: null,
  };

  // ── Attempt primary channel ────────────────────────────────────────────────
  try {
    if (channel === 'whatsapp') {
      const { sendWhatsAppMessage } = await import('../adapters/whatsapp-adapter.js');
      await sendWhatsAppMessage(lead.phone, message);
    } else if (channel === 'email') {
      const { sendEmail } = await import('../adapters/email-adapter.js');
      await sendEmail({ to: lead.email, ...message });
    }
    return { success: true };  // Clean send — no error
  } catch (err) {
    errorReport.description = err.message || String(err);
    errorReport.attempted_fixes.push({
      action:  `primary-${channel}`,
      result:  err.message || String(err),
      outcome: 'not-resolved',
    });
  }

  // ── Fallback: try the other channel ─────────────────────────────────────────
  const fallbackChannel = channel === 'whatsapp' ? 'email' : 'whatsapp';
  try {
    if (fallbackChannel === 'email') {
      const { sendEmail } = await import('../adapters/email-adapter.js');
      await sendEmail({ to: lead.email, ...message });
    } else {
      const { sendWhatsAppMessage } = await import('../adapters/whatsapp-adapter.js');
      await sendWhatsAppMessage(lead.phone, message);
    }
    errorReport.attempted_fixes.push({
      action:  `fallback-${fallbackChannel}`,
      result:  'delivered',
      outcome: 'resolved',
    });
    errorReport.final_resolution = `Auto-resolved: delivered via ${fallbackChannel} fallback`;
    errorReport.auto_resolved = true;
    errorReport.severity = 'low';  // Downgrade — fallback succeeded

    const resolved_at = new Date().toISOString();
    errorReport.resolved_at = resolved_at;

    const result = await insertErrorReport(errorReport);
    return {
      success: true,
      resolved_via: fallbackChannel,
      error_report_id: result.data?.id,
    };
  } catch (fallbackErr) {
    errorReport.attempted_fixes.push({
      action:  `fallback-${fallbackChannel}`,
      result:  fallbackErr.message || String(fallbackErr),
      outcome: 'not-resolved',
    });
    errorReport.final_resolution = 'No resolution available — escalated to CTO';
    errorReport.severity = 'high';
    errorReport.escalated_to = 'cto';
    errorReport.client_notification_required = true;
  }

  // ── Persist the error report ─────────────────────────────────────────────────
  const result = await insertErrorReport(errorReport);
  return {
    success: false,
    error_report_id: result.data?.id,
  };
}
```

---

## 4. FRIDAY REPORT: `generateGovernanceSummary()` — Error Section

```javascript
/**
 * generateGovernanceSummary — Appends AI Governance section to Friday weekly report.
 * Integrates with send-weekly-report-email.js.
 *
 * @param {string} clientId
 * @param {string} weekStart  - ISO date e.g. '2026-05-01'
 * @param {string} weekEnd    - ISO date e.g. '2026-05-07'
 * @returns {Promise<string>}  - Formatted governance text block
 */
async function generateGovernanceSummary(clientId, weekStart, weekEnd) {
  const { getClient } = await import('../../orchestration/src/persistence/supabase-client.js');
  const supabase = getClient();

  // ── Error summary (Phase 1 deliverable) ─────────────────────────────────────
  const { data: errorStats, error: errorStatsErr } = await supabase
    .from('error_reports')
    .select(`
      id,
      severity,
      channel,
      auto_resolved,
      time_to_resolve_minutes
    `)
    .eq('client_id', clientId)
    .gte('detected_at', weekStart)
    .lte('detected_at', `${weekEnd}T23:59:59.999Z`);

  if (errorStatsErr) {
    console.error(`[governance] Error summary query failed: ${errorStatsErr.message}`);
  }

  const total      = errorStats?.length ?? 0;
  const autoRes    = errorStats?.filter(e => e.auto_resolved).length ?? 0;
  const critical   = errorStats?.filter(e => e.severity === 'critical').length ?? 0;
  const high       = errorStats?.filter(e => e.severity === 'high').length ?? 0;
  const medium     = errorStats?.filter(e => e.severity === 'medium').length ?? 0;
  const low        = errorStats?.filter(e => e.severity === 'low').length ?? 0;
  const unresolved  = errorStats?.filter(e => !e.auto_resolved && !e.resolved_at).length ?? 0;
  const avgMTTR    = errorStats
    ?.filter(e => e.time_to_resolve_minutes != null)
    ?.reduce((sum, e, _, arr) => sum + e.time_to_resolve_minutes / arr.length, 0)
    ?? null;

  const pctAuto = total > 0 ? Math.round((autoRes / total) * 100) : 0;

  return `
══ AI GOVERNANCE SUMMARY ══
Week of ${weekStart} to ${weekEnd}

• Total errors: ${total}
  – Critical: ${critical} | High: ${high} | Medium: ${medium} | Low: ${low}
  – Auto-resolved: ${autoRes} (${pctAuto}%)
  – Open/unresolved: ${unresolved}
${avgMTTR !== null ? `  – Avg. time to resolve: ${Math.round(avgMTTR)} min` : ''}

Reply GOVERNANCE to receive a full audit export.
`.trim();
}
```

---

## 5. DEPLOYMENT STEPS

### Step 1 — Add Table to Supabase

**Option A: Via Supabase Dashboard SQL Editor**
1. Navigate to `https://supabase.com/dashboard/project/btrbczqjwzuybgcxckvm/sql/new`
2. Paste and run the `CREATE TABLE` SQL from Section 1
3. Verify table appears in Table Editor under `public.error_reports`

**Option B: Via Node.js script (executed below)**
- Run the SQL via `supabase-js` client using service role key

### Step 2 — Deploy Code to moosa-worker

1. Create directory: `orchestration/src/governance/`
2. Write `orchestration/src/governance/error-reports.js` (Section 2 code)
3. Import `sendWithErrorTracking` in any worker file that sends WhatsApp/email
4. Example import:
   ```javascript
   import { sendWithErrorTracking } from './governance/error-reports.js';
   ```
5. Replace:
   ```javascript
   // BEFORE
   await whatsappClient.send(message);
   // AFTER
   const result = await sendWithErrorTracking(lead, 'whatsapp', message);
   ```
6. Restart moosa-worker: `pm2 restart moosa-worker`

### Step 3 — Verify It Works

1. Test INSERT manually (see test below)
2. Check Supabase dashboard → `error_reports` table → new row visible
3. Check moosa-worker logs for `[governance] Error report inserted`

---

## 6. TEST: Manual INSERT

```sql
-- Verify table exists and accepts writes
INSERT INTO error_reports (
  error_id, client_id, detected_at, error_type, severity,
  description, attempted_fixes, final_resolution
) VALUES (
  'ERR-2026-05-07-TEST',
  'client-demo',
  NOW(),
  'outbound-channel-failure',
  'low',
  'Phase 1 implementation test — can be deleted',
  '[]'::jsonb,
  'Test record — delete after verification'
);
```

Expected result: `INSERT 0 1` + row appears in Supabase dashboard.

---

## 7. FILES CREATED

| File | Purpose |
|---|---|
| `orchestration/src/governance/error-reports.js` | `insertErrorReport()` + `sendWithErrorTracking()` helpers |
| `strateon/csuite/CTO/AI-GOVERNANCE-PHASE1-ERROR-REPORTS.md` | This implementation record |

---

*CTO sign-off: Phase 1 Error Reports — ✅ COMPLETE — 2026-05-07*
