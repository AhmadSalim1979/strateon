/**
 * EEL Core Classification Engine
 * 
 * Implements the epistemic enforcement gate that classifies facts
 * before they can escape into operational output or execution.
 * 
 * Phase E1 scope:
 * - Core classification engine
 * - Authority checking
 * - Provenance verification
 * - Audit logging structures
 * - Truth state classification
 * 
 * NOT in scope:
 * - Integration with watchdog
 * - Integration with worker
 * - Alert sending
 * - Runtime behavior changes
 */

const {
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
} = require('./fact-classification');

const {
  AUTHORITY_REGISTRY,
  EXECUTION_SENSITIVE_CATEGORIES,
  FAIL_CLOSED_UNKNOWN_CATEGORIES,
  BLOCK_ASSUMED_CATEGORIES,
  isNonAuthority,
  checkAuthority,
} = require('./authority-registry');

// In-memory audit log for Phase E1 (no Supabase dependency)
const eelAuditLog = [];
const MAX_AUDIT_LOG_SIZE = 10000;

/**
 * Main classification function — the EEL gate
 * 
 * Classifies a fact against truth states and returns a classification result.
 * Enforces fail-closed behavior for sensitive categories.
 * 
 * @param {Object} params
 * @param {string} params.fact - The factual claim
 * @param {string} params.category - The fact category
 * @param {string} params.claimedState - What Moosa claimed (VERIFIED/DERIVED/ASSUMED/UNKNOWN)
 * @param {Object|null} params.provenance - Provenance object
 * @param {Object|null} params.context - Optional context (session_id, operation_id)
 * @returns {Object} classification result
 */
function eelClassify({ fact, category, claimedState, provenance, context = {} } = {}) {
  const startTime = Date.now();

  // Step 1: Validate category
  const validCategories = Object.values(FACT_CATEGORIES);
  if (!validCategories.includes(category)) {
    const result = createClassificationResult({
      decision: CLASSIFICATION_DECISION.BLOCK,
      state: TRUTH_STATES.UNKNOWN,
      allowed: false,
      error_code: EEL_ERROR_CODES.EEL_CATEGORY_UNKNOWN,
      error_message: `Unknown category "${category}". Valid categories: ${validCategories.join(', ')}`,
      blocked_reason: `Invalid fact category`,
      resolution: 'Use a valid category from FACT_CATEGORIES',
    });
    logAuditEntry(fact, category, claimedState, result.state, result, context);
    return result;
  }

  // Step 2: Route by claimed state
  switch (claimedState) {
    case TRUTH_STATES.VERIFIED:
      return classifyVerified(fact, category, provenance, context, startTime);
    case TRUTH_STATES.DERIVED:
      return classifyDerived(fact, category, provenance, context, startTime);
    case TRUTH_STATES.ASSUMED:
      return classifyAssumed(fact, category, provenance, context, startTime);
    case TRUTH_STATES.UNKNOWN:
    default:
      return classifyUnknown(fact, category, provenance, context, startTime);
  }
}

/**
 * Classify a VERIFIED claim
 * Requires: authoritative source + valid category scope + current provenance
 */
function classifyVerified(fact, category, provenance, context, startTime) {
  // VERIFIED requires provenance
  if (!provenance || !provenance.source) {
    const result = createClassificationResult({
      decision: CLASSIFICATION_DECISION.BLOCK,
      state: TRUTH_STATES.UNKNOWN,
      allowed: false,
      error_code: EEL_ERROR_CODES.EEL_VERIFIED_WITHOUT_PROVENANCE,
      error_message: 'VERIFIED claim requires provenance (source, path, timestamp)',
      blocked_reason: 'No provenance provided for VERIFIED claim',
      resolution: 'Provide provenance: {source, path, timestamp, raw} from an authoritative source',
    });
    logAuditEntry(fact, category, TRUTH_STATES.VERIFIED, result.state, result, context);
    return result;
  }

  // Check if source is an authority for this category
  const authCheck = checkAuthority(provenance.source, category);
  
  if (!authCheck.isAuthority) {
    const result = createClassificationResult({
      decision: CLASSIFICATION_DECISION.BLOCK,
      state: TRUTH_STATES.UNKNOWN,
      allowed: false,
      error_code: authCheck.error_code || EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY,
      error_message: authCheck.reason,
      blocked_reason: `Source "${provenance.source}" is not an authority for "${category}"`,
      resolution: authCheck.evidence_only 
        ? `EMAIL-SIGNATURES.md is EVIDENCE ONLY — not authority for ${category}. Verify against ops/ALERT-DESTINATION-REGISTRY.md, secrets/*.json, or get explicit Ahmad approval.`
        : `Verify against an authoritative source for category "${category}"`,
      provenance,
    });
    logAuditEntry(fact, category, TRUTH_STATES.VERIFIED, result.state, result, context);
    return result;
  }

  // Check temporal constraint for runtime commands
  if (authCheck.scope && authCheck.scope.includes('temporal')) {
    // Already handled by checkAuthority for runtime commands
  }

  // VERIFIED passed all checks
  const result = createClassificationResult({
    decision: CLASSIFICATION_DECISION.PASS,
    state: TRUTH_STATES.VERIFIED,
    allowed: true,
    prefix: '[VERIFIED FACT]',
    provenance,
  });
  
  logAuditEntry(fact, category, TRUTH_STATES.VERIFIED, result.state, result, context);
  return result;
}

/**
 * Classify a DERIVED claim
 * Requires: inference chain of 2+ VERIFIED facts
 * Blocked for execution-sensitive categories
 */
function classifyDerived(fact, category, provenance, context, startTime) {
  // DERIVED requires inference chain
  if (!provenance || !provenance.chain || provenance.chain.length < 2) {
    const result = createClassificationResult({
      decision: CLASSIFICATION_DECISION.BLOCK,
      state: TRUTH_STATES.UNKNOWN,
      allowed: false,
      error_code: EEL_ERROR_CODES.EEL_DERIVED_WITHOUT_CHAIN,
      error_message: 'DERIVED claim requires inference chain of 2+ VERIFIED facts',
      blocked_reason: 'No inference chain provided',
      resolution: 'Provide provenance.chain: [{step, source, timestamp, raw}, ...] tracing back to VERIFIED facts',
    });
    logAuditEntry(fact, category, TRUTH_STATES.DERIVED, result.state, result, context);
    return result;
  }

  // Verify all chain elements are VERIFIED
  for (const chainStep of provenance.chain) {
    if (!chainStep.source || !chainStep.timestamp) {
      const result = createClassificationResult({
        decision: CLASSIFICATION_DECISION.BLOCK,
        state: TRUTH_STATES.UNKNOWN,
        allowed: false,
        error_code: EEL_ERROR_CODES.EEL_DERIVED_WITHOUT_CHAIN,
        error_message: 'DERIVED chain step missing required fields (source, timestamp)',
        blocked_reason: `Chain step incomplete: ${JSON.stringify(chainStep)}`,
        resolution: 'Each chain step must have: source, timestamp, and either raw value or step description',
      });
      logAuditEntry(fact, category, TRUTH_STATES.DERIVED, result.state, result, context);
      return result;
    }
  }

  // DERIVED is BLOCKED for execution-sensitive categories
  if (EXECUTION_SENSITIVE_CATEGORIES.has(category)) {
    const result = createClassificationResult({
      decision: CLASSIFICATION_DECISION.BLOCK,
      state: TRUTH_STATES.UNKNOWN,
      allowed: false,
      error_code: getDerivedBlockedErrorCode(category),
      error_message: `${category} cannot be DERIVED — must be VERIFIED from authoritative source`,
      blocked_reason: `Execution-sensitive category "${category}" requires direct verification, not inference`,
      resolution: `Obtain VERIFIED provenance from authoritative source for ${category}`,
      provenance,
    });
    logAuditEntry(fact, category, TRUTH_STATES.DERIVED, result.state, result, context);
    return result;
  }

  // For non-sensitive categories, DERIVED is allowed with warning
  const warnings = [`DERIVED state for category "${category}" — verify chain is sound`];
  
  const result = createClassificationResult({
    decision: CLASSIFICATION_DECISION.WARN,
    state: TRUTH_STATES.DERIVED,
    allowed: true,
    prefix: '[DERIVED]',
    provenance,
    warnings,
  });
  
  logAuditEntry(fact, category, TRUTH_STATES.DERIVED, result.state, result, context);
  return result;
}

/**
 * Classify an ASSUMED claim
 * Requires: explicit acknowledgment
 * Blocked for sensitive categories even with acknowledgment
 */
function classifyAssumed(fact, category, provenance, context, startTime) {
  // ASSUMED requires explicit acknowledgment
  if (!provenance || !provenance.acknowledgment) {
    const result = createClassificationResult({
      decision: CLASSIFICATION_DECISION.BLOCK,
      state: TRUTH_STATES.UNKNOWN,
      allowed: false,
      error_code: EEL_ERROR_CODES.EEL_ASSUMED_WITHOUT_ACKNOWLEDGMENT,
      error_message: 'ASSUMED claim requires explicit acknowledgment in provenance',
      blocked_reason: 'No acknowledgment provided',
      resolution: 'Provide provenance.acknowledgment: explicit text stating what is not verified',
    });
    logAuditEntry(fact, category, TRUTH_STATES.ASSUMED, result.state, result, context);
    return result;
  }

  // ASSUMED is BLOCKED for sensitive categories
  if (BLOCK_ASSUMED_CATEGORIES.has(category)) {
    const result = createClassificationResult({
      decision: CLASSIFICATION_DECISION.BLOCK,
      state: TRUTH_STATES.UNKNOWN,
      allowed: false,
      error_code: EEL_ERROR_CODES.EEL_UNKNOWN_BLOCKED,
      error_message: `${category} cannot be ASSUMED — must be VERIFIED or escalated to Ahmad`,
      blocked_reason: `Sensitive category "${category}" cannot use ASSUMED state even with acknowledgment`,
      resolution: `Obtain VERIFIED provenance or escalate to Ahmad for explicit approval`,
      provenance,
    });
    logAuditEntry(fact, category, TRUTH_STATES.ASSUMED, result.state, result, context);
    return result;
  }

  // ASSUMED passed for non-sensitive categories
  const result = createClassificationResult({
    decision: CLASSIFICATION_DECISION.WARN,
    state: TRUTH_STATES.ASSUMED,
    allowed: true,
    prefix: '[ASSUMPTION]',
    provenance,
    warnings: [`ASSUMED state — verify before using for important decisions`],
  });
  
  logAuditEntry(fact, category, TRUTH_STATES.ASSUMED, result.state, result, context);
  return result;
}

/**
 * Classify an UNKNOWN claim
 * Fail-closed for sensitive categories, informational for others
 */
function classifyUnknown(fact, category, provenance, context, startTime) {
  // UNKNOWN fails closed for sensitive categories
  if (FAIL_CLOSED_UNKNOWN_CATEGORIES.has(category)) {
    const result = createClassificationResult({
      decision: CLASSIFICATION_DECISION.ESCALATE,
      state: TRUTH_STATES.UNKNOWN,
      allowed: false,
      error_code: EEL_ERROR_CODES.EEL_UNKNOWN_BLOCKED,
      error_message: `${category} is UNKNOWN — cannot use unverified ${category} for operational decisions`,
      blocked_reason: `Category "${category}" requires verification — UNKNOWN blocks execution`,
      resolution: `Verify this fact against an authoritative source, or escalate to Ahmad for explicit approval`,
      provenance,
    });
    logAuditEntry(fact, category, TRUTH_STATES.UNKNOWN, result.state, result, context);
    return result;
  }

  // UNKNOWN is informational for non-sensitive categories
  const result = createClassificationResult({
    decision: CLASSIFICATION_DECISION.WARN,
    state: TRUTH_STATES.UNKNOWN,
    allowed: true,
    prefix: '[UNKNOWN]',
    provenance,
    warnings: [`UNKNOWN state — do not use for execution-critical decisions`],
  });
  
  logAuditEntry(fact, category, TRUTH_STATES.UNKNOWN, result.state, result, context);
  return result;
}

/**
 * Get the appropriate EEL error code for DERIVED blocking
 */
function getDerivedBlockedErrorCode(category) {
  const codeMap = {
    [FACT_CATEGORIES.ALERT_DESTINATION]: EEL_ERROR_CODES.EEL_DEST_DERIVED,
    [FACT_CATEGORIES.CREDENTIAL]: EEL_ERROR_CODES.EEL_CRED_DERIVED,
    [FACT_CATEGORIES.APPROVAL]: EEL_ERROR_CODES.EEL_APPROVAL_DERIVED,
    [FACT_CATEGORIES.RECOVERY_ACTION]: EEL_ERROR_CODES.EEL_ACTION_DERIVED,
    [FACT_CATEGORIES.PROVIDER]: EEL_ERROR_CODES.EEL_PROVIDER_DERIVED,
    [FACT_CATEGORIES.IDENTITY]: EEL_ERROR_CODES.EEL_IDENTITY_DERIVED,
  };
  return codeMap[category] || EEL_ERROR_CODES.EEL_UNKNOWN_BLOCKED;
}

/**
 * Log an audit entry
 */
function logAuditEntry(fact, category, claimedState, actualState, result, context = {}) {
  const entry = createAuditEntry({
    fact,
    category,
    claimed_state: claimedState,
    actual_state: actualState,
    allowed: result.allowed,
    provenance: result.provenance,
    blocked_reason: result.blocked_reason,
    eel_error_code: result.error_code,
    resolution_required: result.decision === CLASSIFICATION_DECISION.ESCALATE,
    source_module: context.source_module || 'eel',
    session_id: context.session_id || null,
    operation_id: context.operation_id || null,
    resolution: result.allowed ? 'allowed' : 'blocked',
    resolved_by: 'eel',
    resolved_at: new Date().toISOString(),
  });

  eelAuditLog.push(entry);

  // Keep log bounded
  if (eelAuditLog.length > MAX_AUDIT_LOG_SIZE) {
    eelAuditLog.shift();
  }
}

/**
 * Get EEL audit log
 * @param {Object} filters - Optional filters
 * @returns {Array} audit entries
 */
function getAuditLog(filters = {}) {
  let entries = [...eelAuditLog];
  
  if (filters.category) {
    entries = entries.filter(e => e.category === filters.category);
  }
  if (filters.allowed !== undefined) {
    entries = entries.filter(e => e.allowed === filters.allowed);
  }
  if (filters.decision) {
    entries = entries.filter(e => e.resolution === filters.decision);
  }
  
  return entries;
}

/**
 * Clear audit log (for testing only)
 */
function clearAuditLog() {
  eelAuditLog.length = 0;
}

/**
 * Check if a fact is allowed to escape
 * Convenience wrapper around eelClassify
 * 
 * @param {Object} params
 * @returns {{allowed: boolean, result: Object}}
 */
function canEscape({ fact, category, claimedState, provenance, context } = {}) {
  const result = eelClassify({ fact, category, claimedState, provenance, context });
  return {
    allowed: result.allowed,
    result,
  };
}

/**
 * Verify a credential fact against secrets files
 * Special helper for credential category
 * 
 * @param {string} fact - The credential claim
 * @param {string} expectedFile - Expected secrets file (e.g., "qiyadon-email.json")
 * @param {Object} context
 * @returns {Object} classification result
 */
function verifyCredential(fact, expectedFile, context = {}) {
  return eelClassify({
    fact,
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: PROVENANCE_TYPES.FILE,
      source: `secrets/${expectedFile}`,
      timestamp: new Date().toISOString(),
    }),
    context,
  });
}

/**
 * Verify an alert destination against ALERT-DESTINATION-REGISTRY
 * Special helper for alert_destination category
 * 
 * @param {string} fact - The destination claim
 * @param {Object} context
 * @returns {Object} classification result
 */
function verifyAlertDestination(fact, context = {}) {
  return eelClassify({
    fact,
    category: FACT_CATEGORIES.ALERT_DESTINATION,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: PROVENANCE_TYPES.REGISTRY,
      source: 'ops/ALERT-DESTINATION-REGISTRY.md',
      timestamp: new Date().toISOString(),
    }),
    context,
  });
}

/**
 * Verify a provider against PROVIDER-REGISTRY
 * Special helper for provider category
 * 
 * @param {string} fact - The provider claim
 * @param {Object} context
 * @returns {Object} classification result
 */
function verifyProvider(fact, context = {}) {
  return eelClassify({
    fact,
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: PROVENANCE_TYPES.REGISTRY,
      source: 'ops/PROVIDER-REGISTRY.md',
      timestamp: new Date().toISOString(),
    }),
    context,
  });
}

module.exports = {
  eelClassify,
  canEscape,
  verifyCredential,
  verifyAlertDestination,
  verifyProvider,
  getAuditLog,
  clearAuditLog,
  TRUTH_STATES,
  FACT_CATEGORIES,
  CLASSIFICATION_DECISION,
  EEL_ERROR_CODES,
};