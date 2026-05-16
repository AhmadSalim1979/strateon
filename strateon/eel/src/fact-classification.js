/**
 * EEL Fact Classification Model
 * 
 * Defines the structure for facts, their truth states, provenance, and
 * operational impact classifications.
 * 
 * Phase E1 scope: model definition only, no runtime integration
 */

const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

/**
 * Truth states in order of confidence (highest to lowest)
 */
const TRUTH_STATES = {
  VERIFIED: 'VERIFIED',   // Confirmed by authoritative source
  DERIVED: 'DERIVED',     // Logically inferred from VERIFIED facts
  ASSUMED: 'ASSUMED',     // Explicitly acknowledged as unverified
  UNKNOWN: 'UNKNOWN',     // Cannot determine — must escalate or block
};

/**
 * Fact categories for operational sensitivity classification
 */
const FACT_CATEGORIES = {
  // Execution-sensitive (fail-closed on DERIVED and UNKNOWN)
  ALERT_DESTINATION: 'alert_destination',
  CREDENTIAL: 'credential',
  APPROVAL: 'approval',
  RECOVERY_ACTION: 'recovery_action',
  ACCOUNT_ID: 'account_id',
  BILLING: 'billing',
  COMMAND: 'command',
  PROVIDER: 'provider',
  IDENTITY: 'identity',

  // Warn on DERIVED, fail-closed on UNKNOWN
  SECURITY: 'security',
  INFRASTRUCTURE_STATE: 'infrastructure_state',
  PROCESS_STATE: 'process_state',

  // Informational (lower enforcement)
  DATA_STATE: 'data_state',
  URL: 'url',
  EMAIL: 'email',
  PHONE: 'phone',
  OTHER: 'other',
};

/**
 * Operational impact levels
 */
const OPERATION_IMPACT = {
  BLOCKS_EXECUTION: 'BLOCKS_EXECUTION',   // Cannot proceed without resolution
  REDUCES_CONFIDENCE: 'REDUCES_CONFIDENCE', // Warn but continue
  INFORMATIONAL: 'INFORMATIONAL',          // Purely informational
};

/**
 * Provenance source types
 */
const PROVENANCE_TYPES = {
  FILE: 'file',             // File read (config, source, secrets)
  COMMAND: 'command',       // Runtime command output (pm2, ps, curl)
  API: 'api',               // HTTP API response
  DATABASE: 'database',     // Supabase query result
  PROCESS: 'process',      // Process state (PID, status from /proc or pm2)
  APPROVAL: 'approval',     // Ahmad explicit approval
  REGISTRY: 'registry',     // From authority registry (PROVIDER-REGISTRY, ALERT-DESTINATION-REGISTRY)
  NONE: 'none',             // No provenance available
};

/**
 * Classification decision outcomes
 */
const CLASSIFICATION_DECISION = {
  PASS: 'PASS',             // Fact allowed to escape
  WARN: 'WARN',             // Fact allowed with warning
  BLOCK: 'BLOCK',           // Fact blocked — cannot escape
  ESCALATE: 'ESCALATE',     // Fact blocked, needs Ahmad resolution
};

/**
 * Create a provenance object
 * @param {Object} params
 * @returns {Object} provenance object
 */
function createProvenance({
  type = PROVENANCE_TYPES.NONE,
  source = null,
  path = null,
  command = null,
  timestamp = new Date().toISOString(),
  raw = null,
  chain = null,        // For DERIVED: array of {step, source, timestamp, raw}
  acknowledgment = null, // For ASSUMED: explicit acknowledgment text
  rule = null,         // For DERIVED: logical rule applied
} = {}) {
  return {
    type,
    source,
    path,        // e.g., "/home/node/.openclaw/workspace/secrets/supabase.json:5"
    command,     // e.g., "pm2 list"
    timestamp,
    raw,         // Exact value from source (can be redacted for credentials)
    chain,       // For DERIVED: inference chain back to VERIFIED facts
    acknowledgment, // For ASSUMED: "I have not verified this claim"
    rule,        // For DERIVED: "if A then B" logical rule
  };
}

/**
 * Create a fact record
 * @param {Object} params
 * @returns {Object} fact record
 */
function createFact({
  id = uuidv4(),
  fact = null,              // The factual claim string
  state = TRUTH_STATES.UNKNOWN,
  category = FACT_CATEGORIES.OTHER,
  provenance = null,
  operation_impact = OPERATION_IMPACT.INFORMATIONAL,
  expires_at = null,
  classified_by = 'eel',
  classified_at = new Date().toISOString(),
} = {}) {
  return {
    id,
    fact,
    state,
    category,
    provenance,
    operation_impact,
    expires_at,
    classified_by,
    classified_at,
  };
}

/**
 * Create a classification result
 * @param {Object} params
 * @returns {Object} classification result
 */
function createClassificationResult({
  decision = CLASSIFICATION_DECISION.BLOCK,
  state = TRUTH_STATES.UNKNOWN,
  allowed = false,
  prefix = null,
  error_code = null,
  error_message = null,
  blocked_reason = null,
  resolution = null,
  provenance = null,
  warnings = null,
} = {}) {
  return {
    decision,
    state,
    allowed,
    prefix,
    error_code,
    error_message,
    blocked_reason,
    resolution,
    provenance,
    warnings,       // Array of warning strings (for DERIVED in sensitive categories)
  };
}

/**
 * Create an EEL audit log entry
 * @param {Object} params
 * @returns {Object} audit log entry
 */
function createAuditEntry({
  id = uuidv4(),
  timestamp = new Date().toISOString(),
  fact = null,
  category = null,
  claimed_state = null,
  actual_state = null,
  allowed = false,
  provenance = null,
  blocked_reason = null,
  eel_error_code = null,
  resolution_required = false,
  source_module = 'eel',
  session_id = null,
  operation_id = null,
  resolution = 'pending',
  resolved_by = 'none',
  resolved_at = null,
} = {}) {
  return {
    id,
    timestamp,
    fact,
    category,
    claimed_state,
    actual_state,
    allowed,
    provenance,
    blocked_reason,
    eel_error_code,
    resolution_required,
    source_module,
    session_id,
    operation_id,
    resolution,
    resolved_by,
    resolved_at,
  };
}

/**
 * EEL Error codes
 */
const EEL_ERROR_CODES = {
  // Authority errors
  EEL_SOURCE_NOT_AUTHORITY: 'EEL_SOURCE_NOT_AUTHORITY',           // Source not in registry
  EEL_CATEGORY_NOT_IN_SCOPE: 'EEL_CATEGORY_NOT_IN_SCOPE',       // Source can't authorize this category
  EEL_FACT_EXPIRED: 'EEL_FACT_EXPIRED',                          // Runtime command result too old
  EEL_TIMESTAMP_INVALID: 'EEL_TIMESTAMP_INVALID',                 // Malformed timestamp
  EEL_TIMESTAMP_FUTURE: 'EEL_TIMESTAMP_FUTURE',                  // Timestamp in future

  // State errors
  EEL_VERIFIED_WITHOUT_PROVENANCE: 'EEL_VERIFIED_WITHOUT_PROVENANCE',
  EEL_DERIVED_WITHOUT_CHAIN: 'EEL_DERIVED_WITHOUT_CHAIN',
  EEL_ASSUMED_WITHOUT_ACKNOWLEDGMENT: 'EEL_ASSUMED_WITHOUT_ACKNOWLEDGMENT',

  // Category blocking errors
  EEL_DEST_DERIVED: 'EEL_DEST_DERIVED',              // alert_destination cannot be DERIVED
  EEL_CRED_DERIVED: 'EEL_CRED_DERIVED',              // credential cannot be DERIVED
  EEL_APPROVAL_DERIVED: 'EEL_APPROVAL_DERIVED',      // approval cannot be DERIVED
  EEL_ACTION_DERIVED: 'EEL_ACTION_DERIVED',          // recovery_action cannot be DERIVED
  EEL_PROVIDER_DERIVED: 'EEL_PROVIDER_DERIVED',      // provider cannot be DERIVED
  EEL_IDENTITY_DERIVED: 'EEL_IDENTITY_DERIVED',      // identity cannot be DERIVED

  // UNKNOWN blocking errors
  EEL_UNKNOWN_BLOCKED: 'EEL_UNKNOWN_BLOCKED',        // UNKNOWN in sensitive category

  // Credential errors
  EEL_CRED_UNVERIFIED: 'EEL_CRED_UNVERIFIED',        // credential not from secrets
  EEL_CRED_ASSUMED: 'EEL_CRED_ASSUMED',              // credential was ASSUMED

  // Provider errors
  EEL_PROVIDER_UNAPPROVED: 'EEL_PROVIDER_UNAPPROVED', // provider not in registry

  // Approval errors
  EEL_APPROVAL_UNVERIFIED: 'EEL_APPROVAL_UNVERIFIED', // approval not explicit
  EEL_APPROVAL_ASSUMED: 'EEL_APPROVAL_ASSUMED',       // approval was assumed

  // Protected process
  EEL_PROTECTED_PROCESS: 'EEL_PROTECTED_PROCESS',      // command targets protected process

  // General
  EEL_CATEGORY_UNKNOWN: 'EEL_CATEGORY_UNKNOWN',       // Unknown category
};

module.exports = {
  TRUTH_STATES,
  FACT_CATEGORIES,
  OPERATION_IMPACT,
  PROVENANCE_TYPES,
  CLASSIFICATION_DECISION,
  EEL_ERROR_CODES,
  createProvenance,
  createFact,
  createClassificationResult,
  createAuditEntry,
};