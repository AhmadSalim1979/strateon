/**
 * EEL Output Sanitizer
 * 
 * Phase E2: MOOSA output-layer integration
 * 
 * Scans Moosa's output text to detect and classify operational facts,
 * applies truth-state labels to claims, and blocks unsupported sensitive
 * facts from escaping into messages, files, summaries, or operator output.
 * 
 * Integration: Called by Moosa before any output that contains
 * infrastructure claims, credential references, approvals, alert
 * destinations, or other sensitive categories.
 * 
 * NOT in scope:
 * - Alert sending (E3)
 * - Watchdog integration (E3)
 * - Recovery execution integration (E3)
 * - Creating alert destination registry
 */

const {
  TRUTH_STATES,
  FACT_CATEGORIES,
  CLASSIFICATION_DECISION,
  EEL_ERROR_CODES,
  createProvenance,
  createClassificationResult,
} = require('./fact-classification');

const {
  AUTHORITY_REGISTRY,
  EXECUTION_SENSITIVE_CATEGORIES,
  FAIL_CLOSED_UNKNOWN_CATEGORIES,
  BLOCK_ASSUMED_CATEGORIES,
  isNonAuthority,
  checkAuthority,
} = require('./authority-registry');

const {
  eelClassify,
  RUNTIME_COMMAND_MAX_AGE_MS,
  validateTimestamp,
  checkRuntimeExpiry,
} = require('./eel-gate');

/**
 * Truth-state labels for output
 */
const STATE_LABELS = {
  VERIFIED: '✅ VERIFIED',
  DERIVED: '🔹 DERIVED',
  ASSUMED: '⚠️ ASSUMED',
  UNKNOWN: '❓ UNKNOWN',
};

/**
 * Sensitive categories that fail closed in output
 * (must be VERIFIED with authoritative provenance)
 */
const OUTPUT_SENSITIVE_CATEGORIES = new Set([
  ...EXECUTION_SENSITIVE_CATEGORIES,
  ...FAIL_CLOSED_UNKNOWN_CATEGORIES,
  'alert_destination',
  'security',
]);

/**
 * Fact patterns for extraction from output text
 * Maps regex patterns to category and default truth-state inference
 * 
 * Note: Email addresses in text are treated as UNKNOWN — they cannot
 * be assumed to be valid alert destinations without verification
 * against ops/ALERT-DESTINATION-REGISTRY.md
 */
const FACT_PATTERNS = [
  // Email addresses — ALWAYS UNKNOWN (never infer from text)
  {
    pattern: /[\w.+-]+@[\w.+-]+\.\w{2,}/g,
    category: 'alert_destination',
    defaultState: 'UNKNOWN',
    label: '❓ ALERT_DEST',
  },
  // Approval behavior — DERIVED (infer from context)
  {
    pattern: /(ahmad|user)\s+(approved|authorized|confirmed|okayed?)/gi,
    category: 'approval',
    defaultState: 'DERIVED',
    label: '⚠️ APPROVAL',
  },
  // Runtime process state — VERIFIED (if fresh pm2_list result)
  {
    pattern: /(moosa-worker|watchdog|gateway|audit-form)\s+(online|offline|healthy|unhealthy|running|stopped)/gi,
    category: 'process_state',
    defaultState: 'VERIFIED',
    label: '✅ PROCESS_STATE',
    temporal: 'current',
  },
  // PM2 status — runtime command result (temporal constraint applies)
  {
    pattern: /pm2\s+(list|status|desc)\s+(showed?|reports?)?\s*([^.]+)/gi,
    category: 'process_state',
    defaultState: 'VERIFIED',
    label: '✅ PROCESS_STATE',
    temporal: 'current',
  },
  // Server/infrastructure state — DERIVED (from configuration) but allow informational labeling
  // Note: EEL gate blocks DERIVED without chain. For output purposes, use UNKNOWN to allow honest label.
  {
    pattern: /(server|website|api|endpoint)\s+(is\s+)?(up|down|running|healthy)/gi,
    category: 'infrastructure_state',
    defaultState: 'UNKNOWN', // UNKNOWN passes with warning for non-sensitive categories
    label: '🔹 INFRA_STATE',
  },
  // Credential references (passwords, tokens, keys in text)
  // Matches: password: xxx, password=xxx, password is xxx, SMTP password: xxx, etc.
  {
    pattern: /(smtp[_\s]?password|password|secret|token|api[_\s]?key)\s*(?:is\s+|[:=]\s*)\s*([\w@.+-]+)/gi,
    category: 'credential',
    defaultState: 'UNKNOWN',
    label: '❓ CREDENTIAL',
  },
  // Billing/revenue claims
  {
    pattern: /\$\d+|revenue|income|sales|billing/gi,
    category: 'billing',
    defaultState: 'UNKNOWN',
    label: '❓ BILLING',
  },
  // Account IDs in text
  {
    pattern: /(account\s*id|client\s*id|account\s*:?\s*)[\w-]+/gi,
    category: 'account_id',
    defaultState: 'UNKNOWN',
    label: '❓ ACCOUNT_ID',
  },
  // Provider names (from EMAIL-SIGNATURES or blog posts — NOT authoritative)
  {
    pattern: /(provider|vendor|service)\s+(is\s+)?(\w+)/gi,
    category: 'provider',
    defaultState: 'UNKNOWN',
    label: '❓ PROVIDER',
  },
];

/**
 * Extract facts from text
 * @param {string} text — The output text to scan
 * @returns {Array<{match: string, category: string, defaultState: string, label: string, index: number, temporal?: string}>}
 */
function extractFacts(text) {
  const facts = [];
  for (const fp of FACT_PATTERNS) {
    const regex = new RegExp(fp.pattern.source, fp.pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      facts.push({
        match: match[0],
        category: fp.category,
        defaultState: fp.defaultState,
        label: fp.label,
        index: match.index,
        temporal: fp.temporal || null,
      });
    }
  }
  return facts;
}

/**
 * Classify a single fact extracted from output text
 * @param {string} fact — The fact string
 * @param {string} category — The category
 * @param {string} claimedState — The claimed truth state
 * @param {object} context — Optional context {session_id, operation_id, source}
 * @returns {object} Classification result
 */
function classifyFact(fact, category, claimedState, context = {}) {
  const provenance = createProvenance({
    type: context.source || 'text_scan',
    source: context.source || 'moosa_output',
    timestamp: context.timestamp || new Date().toISOString(),
    raw: fact,
  });

  return eelClassify({ fact, category, claimedState, provenance, context });
}

/**
 * Check if a category is sensitive for output purposes
 * (fail-closed: must be VERIFIED to emit)
 * @param {string} category 
 * @returns {boolean}
 */
function isOutputSensitive(category) {
  return OUTPUT_SENSITIVE_CATEGORIES.has(category);
}

/**
 * Apply truth-state label to a fact string
 * @param {string} fact 
 * @param {string} state — VERIFIED/DERIVED/ASSUMED/UNKNOWN
 * @param {boolean} allowed — Whether the classification passed
 * @returns {string}
 */
function labelFact(fact, state, allowed) {
  const prefix = STATE_LABELS[state] || STATE_LABELS.UNKNOWN;
  if (!allowed) {
    return `${fact} ${prefix} — requires verification before use`;
  }
  return `${fact} ${prefix}`;
}

/**
 * Main output sanitization function
 * 
 * Scans text for operational facts, classifies them, and:
 * - For sensitive categories: blocks if not VERIFIED
 * - For non-sensitive: attaches truth-state label
 * 
 * @param {string} text — Raw output text
 * @param {object} context — Optional {session_id, operation_id, source}
 * @returns {{sanitized: string, blockedFacts: Array, labeledFacts: Array, classificationMap: object}}
 */
function sanitizeOutput(text, context = {}) {
  const facts = extractFacts(text);
  const blockedFacts = [];
  const labeledFacts = [];
  const classificationMap = {};

  if (facts.length === 0) {
    return { sanitized: text, blockedFacts: [], labeledFacts: [], classificationMap: {} };
  }

  // Sort facts by index descending (replace from end to avoid index shifting)
  const sortedFacts = [...facts].sort((a, b) => b.index - a.index);

  let sanitized = text;

  for (const fact of sortedFacts) {
    const result = classifyFact(fact.match, fact.category, fact.defaultState, {
      ...context,
      source: fact.temporal ? fact.label.toLowerCase() : 'moosa_output',
    });

    classificationMap[fact.match] = {
      category: fact.category,
      claimedState: fact.defaultState,
      actualState: result.state,
      allowed: result.allowed,
      error_code: result.error_code,
      blocked_reason: result.blocked_reason,
    };

    if (!result.allowed) {
      if (isOutputSensitive(fact.category)) {
        // Sensitive category: block emission entirely
        blockedFacts.push({
          fact: fact.match,
          category: fact.category,
          error_code: result.error_code,
          blocked_reason: result.blocked_reason,
          resolution: result.resolution,
        });
        sanitized = sanitized.slice(0, fact.index) +
          `[EEL:BLOCKED ${fact.category}]` +
          sanitized.slice(fact.index + fact.match.length);
      } else {
        // Non-sensitive: label as blocked UNKNOWN
        labeledFacts.push({
          fact: fact.match,
          label: '❌ BLOCKED',
          state: 'UNKNOWN',
          allowed: false,
          error_code: result.error_code,
        });
      }
    } else {
      // Allowed: attach truth-state label
      labeledFacts.push({
        fact: fact.match,
        label: STATE_LABELS[result.state] || fact.label,
        state: result.state,
        allowed: true,
      });
    }
  }

  return { sanitized, blockedFacts, labeledFacts, classificationMap };
}

/**
 * Classify a specific known fact (for use before sending messages,
 * writing files, or emitting summaries)
 * 
 * @param {object} params — {fact, category, claimedState, provenance, context}
 * @returns {object} Classification result with output-specific fields
 */
function classifyOutputFact({ fact, category, claimedState, provenance, context = {} }) {
  const result = eelClassify({ fact, category, claimedState, provenance, context });

  return {
    ...result,
    isSensitive: isOutputSensitive(category),
    blockedForOutput: !result.allowed && isOutputSensitive(category),
    suggestedLabel: result.allowed ? (STATE_LABELS[result.state] || result.state) : null,
  };
}

module.exports = {
  extractFacts,
  classifyFact,
  sanitizeOutput,
  classifyOutputFact,
  isOutputSensitive,
  isSensitiveCategory: isOutputSensitive,
  labelFact,
  STATE_LABELS,
  OUTPUT_SENSITIVE_CATEGORIES,
  RUNTIME_COMMAND_MAX_AGE_MS,
};