/**
 * APAC v3 — Approval Message Parsers
 * 
 * Phase 1 AUDIT_ONLY: These functions observe, parse, classify, and log.
 * They have ZERO execution authority and CANNOT mutate control flow.
 * 
 * All functions are pure utility functions for parsing WhatsApp approval messages.
 */

const EMOJI_ONLY_REGEX = /^[\u{1F300}-\u{1F9FF}\s]+$/u;
const ASCII_EMOJI_STRICT = /^(?:👍|✓|👌|😀|👍🏼)+$/u;
const OPERATION_ID_REGEX = /operation_id=([\w-]+)/i;
const ACTION_HASH_REGEX = /action_hash=([\w]+)/i;
const APPROVAL_KEYWORDS = {
  STRONG: ['approved', 'proceed', 'do it', 'go ahead'],
  MEDIUM: ['ok'],
};
const APPROVAL_KEYWORD_REGEX = /\b(approved|proceed|do it|go ahead|yes|ok)\b/i;

/**
 * Detect if a message body is emoji-only.
 * Emoji messages trigger clarification — never execution.
 * 
 * @param {string} body — Raw WhatsApp message body
 * @returns {boolean} true if body is emoji-only
 */
function isEmojiOnlyMessage(body) {
  if (!body || typeof body !== 'string') return false;
  const stripped = body.trim();
  if (!stripped) return false;
  return EMOJI_ONLY_REGEX.test(stripped) || ASCII_EMOJI_STRICT.test(stripped);
}

/**
 * Extract operation_id from message body.
 * Format: "operation_id=<value>"
 * 
 * @param {string} body — Raw message body
 * @returns {{ found: boolean, value: string|null, raw: string }}
 */
function parseOperationId(body) {
  if (!body || typeof body !== 'string') return { found: false, value: null, raw: null };
  const match = body.match(OPERATION_ID_REGEX);
  if (match && match[1]) {
    return { found: true, value: match[1], raw: match[0] };
  }
  return { found: false, value: null, raw: null };
}

/**
 * Extract action_hash from message body.
 * Format: "action_hash=<value>"
 * 
 * @param {string} body — Raw message body
 * @returns {{ found: boolean, value: string|null, raw: string }}
 */
function parseActionHash(body) {
  if (!body || typeof body !== 'string') return { found: false, value: null, raw: null };
  const match = body.match(ACTION_HASH_REGEX);
  if (match && match[1]) {
    return { found: true, value: match[1], raw: match[0] };
  }
  return { found: false, value: null, raw: null };
}

/**
 * Classify the keyword strength in an approval message.
 * 
 * @param {string} body — Raw message body
 * @returns {{ keyword: string|null, strength: 'STRONG'|'MEDIUM'|'WEAK'|null, score: number }}
 */
function classifyKeywordStrength(body) {
  if (!body || typeof body !== 'string') return { keyword: null, strength: null, score: 0 };
  const lower = body.toLowerCase();
  
  for (const kw of APPROVAL_KEYWORDS.STRONG) {
    if (lower.includes(kw)) {
      return { keyword: kw, strength: 'STRONG', score: 1.0 };
    }
  }
  
  for (const kw of APPROVAL_KEYWORDS.MEDIUM) {
    if (lower.includes(kw)) {
      return { keyword: kw, strength: 'MEDIUM', score: 0.5 };
    }
  }
  
  if (lower.includes('yes')) {
    return { keyword: 'yes', strength: 'WEAK', score: 0.4 };
  }
  
  return { keyword: null, strength: null, score: 0 };
}

/**
 * Extract approval_message_id from OpenClaw TemplateContext.
 * Uses ctx.MessageSid or ctx.MessageSidFull.
 * 
 * @param {object} ctx — OpenClaw TemplateContext
 * @returns {{ found: boolean, value: string|null, source: 'MessageSid'|'MessageSidFull'|null }}
 */
function extractApprovalMessageId(ctx) {
  if (!ctx || typeof ctx !== 'object') return { found: false, value: null, source: null };
  
  if (ctx.MessageSid && typeof ctx.MessageSid === 'string' && ctx.MessageSid.trim()) {
    return { found: true, value: ctx.MessageSid.trim(), source: 'MessageSid' };
  }
  if (ctx.MessageSidFull && typeof ctx.MessageSidFull === 'string' && ctx.MessageSidFull.trim()) {
    return { found: true, value: ctx.MessageSidFull.trim(), source: 'MessageSidFull' };
  }
  
  return { found: false, value: null, source: null };
}

/**
 * Extract sender E.164 from OpenClaw TemplateContext.
 * 
 * @param {object} ctx — OpenClaw TemplateContext
 * @returns {string|null}
 */
function extractSenderE164(ctx) {
  if (!ctx) return null;
  const sender = ctx.SenderE164 || ctx.SenderId;
  if (sender && typeof sender === 'string') {
    const trimmed = sender.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

/**
 * Extract timestamp from OpenClaw TemplateContext.
 * Returns ISO-8601 string or null.
 * 
 * @param {object} ctx — OpenClaw TemplateContext
 * @returns {{ found: boolean, value: string|null, unix_ms: number|null }}
 */
function extractTimestamp(ctx) {
  if (!ctx || typeof ctx !== 'object') return { found: false, value: null, unix_ms: null };
  
  const ts = ctx.Timestamp;
  if (typeof ts === 'number' && Number.isFinite(ts)) {
    return {
      found: true,
      value: new Date(ts).toISOString(),
      unix_ms: ts,
    };
  }
  
  return { found: false, value: null, unix_ms: null };
}

/**
 * Check if a message was forwarded.
 * 
 * @param {object} ctx — OpenClaw TemplateContext
 * @returns {boolean}
 */
function isForwardedMessage(ctx) {
  if (!ctx) return false;
  return ctx.ForwardedFrom === true || (typeof ctx.ForwardedFrom === 'string' && ctx.ForwardedFrom.trim().length > 0);
}

/**
 * Full approval message classification — AUDIT_ONLY.
 * This function OBSERVES and LOGS only.
 * It returns a classification result but has ZERO execution authority.
 * 
 * @param {object} ctx — OpenClaw TemplateContext
 * @param {string} body — Raw message body
 * @param {object} options — { approval_max_age_ms: 1800000 }
 * @returns {object} Classification result (informational only)
 */
function classifyApprovalMessage(ctx, body, options = {}) {
  const {
    approval_max_age_ms = 30 * 60 * 1000, // 30 minutes
    authoritative_sender = '+923215139934',
    authoritative_channel = 'whatsapp',
  } = options;

  const result = {
    // Extraction results
    approval_message_id: extractApprovalMessageId(ctx),
    sender: extractSenderE164(ctx),
    timestamp: extractTimestamp(ctx),
    forward_detected: isForwardedMessage(ctx),
    
    // Parsing results
    operation_id: parseOperationId(body),
    action_hash: parseActionHash(body),
    keyword: classifyKeywordStrength(body),
    emoji_only: isEmojiOnlyMessage(body),
    
    // Validation results (informational — no execution authority)
    is_valid: false,
    error_codes: [],
    warnings: [],
    classification: 'BLOCKED', // AUDIT_ONLY: everything is BLOCKED for info only
    
    // Audit info
    audit_type: 'APPROVAL_CLASSIFIED',
    classified_at: new Date().toISOString(),
  };

  // Validation checks — all informational in AUDIT_ONLY mode
  if (!result.approval_message_id.found) {
    result.error_codes.push('EEL_APPROVAL_ID_UNAVAILABLE');
  }
  
  if (!result.operation_id.found) {
    result.error_codes.push('EEL_APPROVAL_NO_OPERATION_LINK');
  }
  
  if (!result.action_hash.found) {
    result.error_codes.push('EEL_APPROVAL_NO_ACTION_HASH');
  }
  
  if (result.emoji_only) {
    result.error_codes.push('EEL_APPROVAL_EMOJI_BLOCKED');
  }
  
  if (result.forward_detected) {
    result.error_codes.push('EEL_APPROVAL_FORWARDED');
  }
  
  if (result.sender && result.sender !== authoritative_sender) {
    result.error_codes.push('EEL_APPROVAL_NOT_AUTHORITATIVE');
  }
  
  if (result.keyword.score < 0.85) {
    result.error_codes.push('EEL_APPROVAL_ESCALATED');
    result.warnings.push('Keyword ambiguous — escalation required');
  }
  
  if (result.keyword.strength === 'WEAK') {
    result.error_codes.push('EEL_APPROVAL_INSUFFICIENT_KEYWORD');
  }
  
  if (result.timestamp.found) {
    const age = Date.now() - result.timestamp.unix_ms;
    if (age > approval_max_age_ms) {
      result.error_codes.push('EEL_APPROVAL_EXPIRED');
      result.warnings.push(`Approval age ${Math.round(age / 60000)}min exceeds ${approval_max_age_ms / 60000}min max`);
    }
  } else {
    result.error_codes.push('EEL_APPROVAL_TIMESTAMP_MISSING');
  }

  // In AUDIT_ONLY: all validations are informational
  // classification BLOCKED means "would be blocked if enforced" — informational only
  result.is_valid = result.error_codes.length === 0;
  
  return result;
}

/**
 * Generate an audit log entry for an approval classification.
 * Returns a plain object suitable for JSON serialization.
 * 
 * @param {object} classification — Result from classifyApprovalMessage()
 * @param {object} context — { session_id?, operation_id?, source? }
 * @returns {object} Audit entry
 */
function createApprovalAuditEntry(classification, context = {}) {
  return {
    event_type: 'APPROVAL_CLASSIFIED',
    approval_message_id: classification.approval_message_id.value,
    operation_id: classification.operation_id.value,
    sender: classification.sender,
    channel: 'whatsapp',
    keyword: classification.keyword.keyword,
    keyword_strength: classification.keyword.strength,
    error_codes: classification.error_codes,
    is_valid: classification.is_valid,
    forward_detected: classification.forward_detected,
    emoji_only: classification.emoji_only,
    timestamp: classification.timestamp.value,
    classified_at: classification.classified_at,
    session_id: context.session_id || null,
    source: context.source || 'apac_audit',
  };
}

module.exports = {
  isEmojiOnlyMessage,
  parseOperationId,
  parseActionHash,
  classifyKeywordStrength,
  extractApprovalMessageId,
  extractSenderE164,
  extractTimestamp,
  isForwardedMessage,
  classifyApprovalMessage,
  createApprovalAuditEntry,
  // Constants for external use
  APPROVAL_KEYWORDS,
};