/**
 * APAC v3 — AUDIT_ONLY Logging Pipeline
 * 
 * Phase 1: APAC operates in AUDIT_ONLY mode.
 * This pipeline can observe, parse, classify, log, and warn.
 * It CANNOT authorize execution, deny execution, or influence runtime control flow.
 * 
 * All audit entries are written to:
 *   memory/EEL-APAC-AUDIT-YYYY-MM-DD.md
 * 
 * This file is separate from EEL runtime audit logs.
 */

const fs = require('fs');
const path = require('path');
const { classifyApprovalMessage, createApprovalAuditEntry } = require('./apac-parsers');

const AUDIT_LOG_DIR = path.join(process.cwd(), 'memory');
const AUDIT_LOG_PREFIX = 'EEL-APAC-AUDIT';

/**
 * Get today's audit log path.
 * @returns {string}
 */
function getAuditLogPath() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(AUDIT_LOG_DIR, `${AUDIT_LOG_PREFIX}-${today}.md`);
}

/**
 * Write an audit entry to the APAC audit log.
 * Entries are appended as JSON lines in a markdown code block.
 * 
 * @param {object} entry — Audit entry object
 */
function logApprovalAudit(entry) {
  const logPath = getAuditLogPath();
  
  // Ensure memory directory exists
  if (!fs.existsSync(AUDIT_LOG_DIR)) {
    fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${JSON.stringify(entry)}\n`;
  
  // Append to daily audit log
  fs.appendFileSync(logPath, logLine, 'utf8');
}

/**
 * Process a WhatsApp approval message in AUDIT_ONLY mode.
 * 
 * This function:
 * 1. Extracts metadata from TemplateContext
 * 2. Parses the message body
 * 3. Classifies the approval (informational only)
 * 4. Writes to audit log
 * 5. RETURNS the classification — does NOT block or authorize anything
 * 
 * @param {object} ctx — OpenClaw TemplateContext
 * @param {string} body — Raw WhatsApp message body
 * @param {object} options — classifyApprovalMessage options
 * @returns {object} Classification result (informational)
 */
function processApprovalAudit(ctx, body, options = {}) {
  // Classify (informational only — no execution authority)
  const classification = classifyApprovalMessage(ctx, body, options);
  
  // Create audit entry
  const auditEntry = createApprovalAuditEntry(classification, {
    session_id: ctx.SessionId || null,
    source: 'apac_audit_only',
  });
  
  // Write to APAC audit log
  logApprovalAudit(auditEntry);
  
  // Return classification — does NOT mutate control flow
  return classification;
}

/**
 * Check replay for an approval_message_id.
 * Checks against the APAC replay log file.
 * 
 * @param {string} approvalMessageId
 * @returns {{ replayed: boolean, first_seen_at: string|null }}
 */
function checkReplay(approvalMessageId) {
  const replayLogPath = path.join(AUDIT_LOG_DIR, `${AUDIT_LOG_PREFIX}-REPLAY.json`);
  
  if (!fs.existsSync(replayLogPath)) {
    return { replayed: false, first_seen_at: null };
  }
  
  try {
    const content = fs.readFileSync(replayLogPath, 'utf8');
    const replayLog = JSON.parse(content);
    const entry = replayLog[approvalMessageId];
    if (entry) {
      return { replayed: true, first_seen_at: entry.first_seen_at };
    }
  } catch (e) {
    // Log file corrupted or missing — treat as not replayed
  }
  
  return { replayed: false, first_seen_at: null };
}

/**
 * Record an approval_message_id in the replay log.
 * 
 * @param {string} approvalMessageId
 */
function recordReplay(approvalMessageId) {
  const replayLogPath = path.join(AUDIT_LOG_DIR, `${AUDIT_LOG_PREFIX}-REPLAY.json`);
  
  let replayLog = {};
  if (fs.existsSync(replayLogPath)) {
    try {
      replayLog = JSON.parse(fs.readFileSync(replayLogPath, 'utf8'));
    } catch (e) {
      replayLog = {};
    }
  }
  
  if (!replayLog[approvalMessageId]) {
    replayLog[approvalMessageId] = {
      first_seen_at: new Date().toISOString(),
    };
    fs.writeFileSync(replayLogPath, JSON.stringify(replayLog, null, 2), 'utf8');
  }
}

module.exports = {
  processApprovalAudit,
  checkReplay,
  recordReplay,
  logApprovalAudit,
  getAuditLogPath,
};