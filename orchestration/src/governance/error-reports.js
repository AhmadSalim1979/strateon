/**
 * AI Governance — Phase 1: Error Reports
 * File: orchestration/src/governance/error-reports.js
 *
 * Provides:
 *   - insertErrorReport(errorReport)    → persists error report to Supabase
 *   - sendWithErrorTracking(lead, channel, message) → wraps WhatsApp/email sends
 *
 * Usage in moosa-worker:
 *   import { sendWithErrorTracking } from './governance/error-reports.js';
 *   const result = await sendWithErrorTracking(lead, 'whatsapp', message);
 */

// ─── insertErrorReport ────────────────────────────────────────────────────────

/**
 * Persist an error report to Supabase.
 *
 * @param {Object} errorReport
 * @param {string} errorReport.error_id
 * @param {string} errorReport.client_id
 * @param {string} [errorReport.run_id]
 * @param {string} errorReport.detected_at              - ISO 8601
 * @param {string} [errorReport.resolved_at]             - ISO 8601
 * @param {number|null} [errorReport.time_to_resolve_minutes]
 * @param {string} errorReport.error_type               - 'outbound-channel-failure' | 'crm-sync-error' | etc.
 * @param {string} [errorReport.channel]                - 'whatsapp' | 'email' | 'sms'
 * @param {string} errorReport.severity                 - 'low' | 'medium' | 'high' | 'critical'
 * @param {string} [errorReport.lead_id]
 * @param {string} errorReport.description
 * @param {Array<{action:string, result:string, outcome:string}>} errorReport.attempted_fixes
 * @param {string} errorReport.final_resolution
 * @param {boolean} [errorReport.client_notification_required]
 * @param {string} [errorReport.client_notified_at]
 * @param {boolean} [errorReport.auto_resolved]
 * @param {string} [errorReport.escalated_to]
 * @returns {Promise<{success:boolean, data?:any, error?:string}>}
 */
async function insertErrorReport(errorReport) {
  const { getClient } = await import('../persistence/supabase-client.js');
  const supabase = getClient();

  // Compute time_to_resolve_minutes if resolved_at is set but MTTR wasn't provided
  let time_to_resolve_minutes = errorReport.time_to_resolve_minutes ?? null;
  if (time_to_resolve_minutes === null && errorReport.detected_at && errorReport.resolved_at) {
    const detected = new Date(errorReport.detected_at);
    const resolved = new Date(errorReport.resolved_at);
    time_to_resolve_minutes = Math.round((resolved - detected) / 60000);
  }

  const row = {
    error_id:                       errorReport.error_id,
    client_id:                      errorReport.client_id,
    run_id:                         errorReport.run_id                       || null,
    detected_at:                    errorReport.detected_at,
    resolved_at:                    errorReport.resolved_at                  || null,
    time_to_resolve_minutes,
    error_type:                     errorReport.error_type,
    channel:                        errorReport.channel                       || null,
    severity:                       errorReport.severity,
    lead_id:                        errorReport.lead_id                       || null,
    description:                    errorReport.description,
    attempted_fixes:                JSON.stringify(errorReport.attempted_fixes || []),
    final_resolution:               errorReport.final_resolution,
    client_notification_required:   errorReport.client_notification_required  ?? false,
    client_notified_at:             errorReport.client_notified_at            || null,
    auto_resolved:                  errorReport.auto_resolved                  ?? false,
    escalated_to:                   errorReport.escalated_to                  || null,
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

// ─── sendWithErrorTracking ────────────────────────────────────────────────────

/**
 * Wraps WhatsApp/email sends with structured error capture and auto-generated
 * error reports on failure. Fallback to the other channel is attempted automatically.
 *
 * Replace direct whatsappClient.send() / emailClient.send() calls with this.
 *
 * @param {Object} lead              - Lead object with id, client_id, phone, email
 * @param {string} channel           - 'whatsapp' | 'email'
 * @param {Object|string} message    - Message payload (format per channel adapter)
 * @returns {Promise<{success:boolean, resolved_via?:string, error_report_id?:string}>}
 */
async function sendWithErrorTracking(lead, channel, message) {
  const error_id     = `ERR-${new Date().toISOString().slice(0, 10)}-${String(Date.now()).slice(-6)}`;
  const detected_at  = new Date().toISOString();

  const errorReport = {
    error_id,
    client_id:          lead.client_id || lead.clientId,
    run_id:             lead.run_id     || null,
    detected_at,
    resolved_at:        null,
    time_to_resolve_minutes: null,
    error_type:         'outbound-channel-failure',
    channel,
    severity:           'medium',
    lead_id:            lead.id,
    description:        '',
    attempted_fixes:    [],
    final_resolution:   '',
    client_notification_required: false,
    auto_resolved:      false,
    escalated_to:       null,
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
    return { success: true };  // Clean send
  } catch (err) {
    errorReport.description = err.message || String(err);
    errorReport.attempted_fixes.push({
      action:  `primary-${channel}`,
      result:  err.message || String(err),
      outcome: 'not-resolved',
    });
  }

  // ── Attempt fallback channel ───────────────────────────────────────────────
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
    errorReport.final_resolution    = `Auto-resolved: delivered via ${fallbackChannel} fallback`;
    errorReport.auto_resolved         = true;
    errorReport.severity             = 'low';  // Downgrade — fallback succeeded
    errorReport.resolved_at          = new Date().toISOString();

    const result = await insertErrorReport(errorReport);
    return {
      success:       true,
      resolved_via:  fallbackChannel,
      error_report_id: result.data?.id,
    };
  } catch (fallbackErr) {
    errorReport.attempted_fixes.push({
      action:  `fallback-${fallbackChannel}`,
      result:  fallbackErr.message || String(fallbackErr),
      outcome: 'not-resolved',
    });
    errorReport.final_resolution          = 'No resolution available — escalated to CTO';
    errorReport.severity                  = 'high';
    errorReport.escalated_to              = 'cto';
    errorReport.client_notification_required = true;
  }

  // ── Persist unresolved error report ─────────────────────────────────────────
  const result = await insertErrorReport(errorReport);
  return {
    success:        false,
    error_report_id: result.data?.id,
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export { insertErrorReport, sendWithErrorTracking };
