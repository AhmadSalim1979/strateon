/**
 * APAC Phase 2 Step 2 — WhatsApp Inbound Hook (AUDIT_ONLY)
 * 
 * This module is the AUDIT_ONLY observation point for incoming WhatsApp messages.
 * It extracts metadata, classifies approval-like messages, and writes audit entries.
 * 
 * CRITICAL: This module has ZERO execution authority.
 * - It cannot authorize, deny, or mutate execution
 * - It cannot block, intercept, or change dispatch flow
 * - Its output is write-only (to Supabase + local file)
 * - No return value is used by callers
 * 
 * Integration point: orchestrator/receive.ts → receiveMessageHandler() → apacObserveMessage()
 */

const path = require('path');
const fs = require('fs');
const { classifyApprovalMessage, createApprovalAuditEntry } = require('./apac-parsers');
const { AUTHORITATIVE_OPERATORS, APPROVAL_MAX_AGE_MS } = require('./apac-authority-registry');

// Audit log path for local file fallback
const AUDIT_LOG_DIR = path.join(process.cwd(), 'memory');
const AUDIT_LOG_PREFIX = 'EEL-APAC-AUDIT';

/**
 * Get today's local APAC audit log path.
 * @returns {string}
 */
function getLocalAuditLogPath() {
  const today = new Date().toISOString().slice(0, 10);
  return path.join(AUDIT_LOG_DIR, `${AUDIT_LOG_PREFIX}-${today}.md`);
}

/**
 * Append an audit entry to the local APAC audit log file.
 * @param {object} entry
 */
function appendLocalAuditLog(entry) {
  if (!fs.existsSync(AUDIT_LOG_DIR)) {
    fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
  }
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${JSON.stringify(entry)}\n`;
  fs.appendFileSync(getLocalAuditLogPath(), logLine, 'utf8');
}

/**
 * Write an audit entry to Supabase approval_audit_log table.
 * @param {object} entry - The audit entry
 * @param {string|object} supabaseClientOrConn - Supabase client or connection string
 * @returns {Promise<void>}
 */
async function writeSupabaseAuditLog(entry, supabaseClientOrConn) {
  if (!entry || !entry.approval_message_id) return;
  
  try {
    let client;
    if (typeof supabaseClientOrConn === 'string') {
      // Connection string provided — create a minimal pg client
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: supabaseClientOrConn });
      client = pool;
    } else if (supabaseClientOrConn && typeof supabaseClientOrConn === 'object') {
      client = supabaseClientOrConn;
    } else {
      // Load from secrets
      const secrets = require('../../../secrets/supabase.json');
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: secrets.connectionString });
      client = pool;
    }
    
    const insertQuery = `
      INSERT INTO approval_audit_log (id, event_type, approval_message_id, operation_id, event_data, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
    `;
    const eventData = {
      sender: entry.sender,
      channel: entry.channel,
      keyword: entry.keyword,
      keyword_strength: entry.keyword_strength,
      error_codes: entry.error_codes,
      is_valid: entry.is_valid,
      forward_detected: entry.forward_detected,
      emoji_only: entry.emoji_only,
      timestamp: entry.timestamp,
      classified_at: entry.classified_at,
      session_id: entry.session_id,
    };
    
    await client.query(insertQuery, [
      entry.event_type,
      entry.approval_message_id,
      entry.operation_id || 'N/A',
      JSON.stringify(eventData),
    ]);
    
    if (typeof supabaseClientOrConn === 'string') {
      await client.end();
    }
  } catch (err) {
    // Supabase write failed — log to local file as fallback
    appendLocalAuditLog({
      ...entry,
      _supabase_write_failed: true,
      _error: err.message,
    });
  }
}

/**
 * Classify a message and write audit entries (AUDIT_ONLY).
 * 
 * This function:
 * - Extracts metadata from ctx
 * - Classifies the message (pure function — no execution authority)
 * - Writes to Supabase approval_audit_log
 * - Writes to local APAC audit log as fallback
 * - Returns classification result (never used by callers for execution decisions)
 * 
 * @param {object} ctx - OpenClaw TemplateContext
 * @param {string} body - Message body text
 * @param {object} options - { supabaseClient?, session_id? }
 * @returns {object} Classification result
 */
async function apacObserveMessage(ctx, body, options = {}) {
  if (!ctx || !body || typeof body !== 'string') {
    // Malformed input — log as unprocessable
    const entry = {
      event_type: 'APPROVAL_UNPROCESSABLE',
      ctx_missing: !ctx,
      body_missing: !body,
      classified_at: new Date().toISOString(),
      source: 'apac_whatsapp_hook',
    };
    appendLocalAuditLog(entry);
    return { error: 'INVALID_INPUT', classified: false };
  }
  
  // Classify the message — pure function, zero execution authority
  const classification = classifyApprovalMessage(ctx, body, {
    approval_max_age_ms: APPROVAL_MAX_AGE_MS,
    authoritative_sender: '+923215139934',
  });
  
  // Build audit entry
  const auditEntry = createApprovalAuditEntry(classification, {
    session_id: options.session_id || ctx.SessionId || null,
    source: 'apac_whatsapp_hook',
  });
  
  // Write to local audit log (always — even if Supabase fails)
  appendLocalAuditLog(auditEntry);
  
  // Write to Supabase if client available
  if (options.supabaseClient) {
    await writeSupabaseAuditLog(auditEntry, options.supabaseClient);
  } else if (options.useSecretsFallback !== false) {
    // Try using secrets/supabase.json
    await writeSupabaseAuditLog(auditEntry, 'secrets');
  }
  
  return classification;
}

/**
 * Check if a message is approval-like (for observation filtering).
 * Pure check — does not write or authorize.
 * 
 * @param {string} body - Message body
 * @returns {boolean}
 */
function isApprovalLikeMessage(body) {
  if (!body || typeof body !== 'string') return false;
  const lower = body.toLowerCase().trim();
  const approvalIndicators = [
    'approved', 'proceed', 'do it', 'go ahead',
    'yes', 'ok', 'confirm', 'allow',
    'operation_id=', 'action_hash=',
    '👍', '✓', '👌', '😀',
  ];
  return approvalIndicators.some(ind => lower.includes(ind));
}

module.exports = {
  apacObserveMessage,
  isApprovalLikeMessage,
  appendLocalAuditLog,
  writeSupabaseAuditLog,
  getLocalAuditLogPath,
};