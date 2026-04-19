/**
 * Outcome Evaluation & Learning Discipline — R11
 * 
 * Enables MOOSA to systematically evaluate the outcomes of its actions
 * and recommendations, and learn from them in a controlled, auditable manner.
 * 
 * Learning constraints:
 * - NO automatic modification of approval requirements
 * - NO modification of action classification (SAFE/SUPERVISED/RESTRICTED)
 * - NO modification of safety constraints
 * - Learning may ONLY influence: recommendation strength, confidence scoring, prioritization signals
 * 
 * All learning is auditable and explainable.
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

const OUTCOME_MATCH = {
  MATCH: 'match',           // Expected and actual align
  PARTIAL: 'partial',       // Some overlap
  MISMATCH: 'mismatch',    // Expected and actual differ significantly
  UNKNOWN: 'unknown',       // Cannot determine (incomplete/ambiguous)
};

const IMPACT_LEVEL = {
  POSITIVE: 'positive',     // Outcome improved system state
  NEUTRAL: 'neutral',        // No significant change
  NEGATIVE: 'negative',      // Outcome degraded system state
};

const CONFIDENCE_DELTA = {
  INCREASE: 'increase',
  NO_CHANGE: 'no_change',
  DECREASE: 'decrease',
};

const TREND = {
  IMPROVING: 'improving',
  STABLE: 'stable',
  DEGRADING: 'degrading',
};

const ACTION_CONFIDENCE = {
  INITIAL: 0.7,            // Starting confidence for new actions
  MIN_CONFIDENCE: 0.2,     // Floor — never below this
  MAX_CONFIDENCE: 0.95,    // Ceiling — never above this
  DECAY_RATE: 0.05,         // Confidence decay per failure
  RECOVERY_RATE: 0.02,     // Confidence recovery per success
};

// Failure pattern detection
const FAILURE_PATTERN_THRESHOLD = 3;  // 3+ mismatches triggers pattern detection
const SUPPRESSION_THRESHOLD = 0.25; // Confidence below this suggests suppression

// ─── State ───────────────────────────────────────────────────────────────────

let _outcomeStore = null;
const STORE_PATH = path.join(__dirname, '../../state/outcome-evaluation.json');

function getStore() {
  if (_outcomeStore) return _outcomeStore;
  
  if (fs.existsSync(STORE_PATH)) {
    try {
      _outcomeStore = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (e) {
      _outcomeStore = _freshStore();
    }
  } else {
    _outcomeStore = _freshStore();
  }
  return _outcomeStore;
}

function _freshStore() {
  return {
    // Outcome history — all evaluations
    outcomes: [],
    max_outcomes: 500,  // Bounded history
    
    // Action reliability — computed from outcomes
    action_reliability: {},  // { action_id: reliability_record }
    
    // Pattern detections
    detected_patterns: [],
    max_patterns: 50,
    
    // Suppression recommendations
    suppressed_actions: {},  // { action_id: { suppressed_at, reason, confidence_at_suppression } }
    
    // Audit log
    audit_log: [],
    max_audit: 200,
    
    // Metrics
    total_evaluations: 0,
    last_evaluation_at: null,
  };
}

function saveStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(getStore(), null, 2), 'utf8');
}

function resetCaches() {
  _outcomeStore = null;
}

// ─── Outcome Model ─────────────────────────────────────────────────────────

/**
 * recordOutcome(outcome)
 * 
 * Records an outcome evaluation for an action.
 * 
 * outcome = {
 *   action_id: string,
 *   action_type: string,        // 'executed' | 'recommended' | 'approved'
 *   expected_outcome: string,   // What was expected
 *   actual_outcome: string,     // What was observed
 *   observed_effects: string[], // List of observed effects
 *   evaluation_notes: string,   // Optional notes
 *   context: { ... }            // Additional context
 * }
 */
function recordOutcome(outcome) {
  const store = getStore();
  const now = new Date().toISOString();
  
  // Evaluate the outcome
  const evaluation = evaluateOutcome(outcome);
  
  const record = {
    outcome_id: `outcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action_id: outcome.action_id,
    action_type: outcome.action_type || 'executed',
    
    // What was expected vs actual
    expected_outcome: outcome.expected_outcome,
    actual_outcome: outcome.actual_outcome,
    observed_effects: outcome.observed_effects || [],
    
    // Evaluation results
    outcome_match: evaluation.outcome_match,
    impact_level: evaluation.impact_level,
    confidence_delta: evaluation.confidence_delta,
    
    // Metadata
    evaluation_notes: outcome.evaluation_notes || '',
    context: outcome.context || {},
    evaluated_at: now,
    
    // Pattern detection
    triggered_pattern_detection: false,
  };
  
  // Check for failure patterns
  const patternCheck = checkFailurePattern(outcome.action_id);
  if (patternCheck.isPattern) {
    record.triggered_pattern_detection = true;
  }
  
  // Add to history
  store.outcomes.push(record);
  store.total_evaluations++;
  store.last_evaluation_at = now;
  
  // Update action reliability
  updateActionReliability(outcome.action_id, record);
  
  // Prune old outcomes
  if (store.outcomes.length > store.max_outcomes) {
    store.outcomes = store.outcomes.slice(-store.max_outcomes);
  }
  
  // Audit log
  _auditLog('OUTCOME_RECORDED', outcome.action_id, {
    match: record.outcome_match,
    impact: record.impact_level,
    pattern: record.triggered_pattern_detection,
  });
  
  saveStore();
  return record;
}

// ─── Evaluation Logic ─────────────────────────────────────────────────────

/**
 * evaluateOutcome(outcome)
 * 
 * Determines outcome_match, impact_level, and confidence_delta.
 * 
 * Rules:
 * - MATCH: actual contains expected (or expected describes actual)
 * - PARTIAL: some overlap but not complete
 * - MISMATCH: actual significantly differs from expected
 * - UNKNOWN: insufficient data to determine
 */
function evaluateOutcome(outcome) {
  const { expected, actual } = {
    expected: (outcome.expected_outcome || '').toLowerCase(),
    actual: (outcome.actual_outcome || '').toLowerCase(),
  };
  
  let outcome_match = OUTCOME_MATCH.UNKNOWN;
  let impact_level = IMPACT_LEVEL.NEUTRAL;
  let confidence_delta = CONFIDENCE_DELTA.NO_CHANGE;
  
  // Empty check
  if (!expected || !actual) {
    return {
      outcome_match: OUTCOME_MATCH.UNKNOWN,
      impact_level: IMPACT_LEVEL.NEUTRAL,
      confidence_delta: CONFIDENCE_DELTA.NO_CHANGE,
    };
  }
  
  // Check for mismatch signals in actual
  const mismatchSignals = ['failed', 'error', 'exception', 'worse', 'degraded', 'no change', 'did not'];
  const partialSignals = ['partially', 'somewhat', 'partly', 'limited', 'incomplete'];
  const successSignals = ['succeeded', 'completed', 'improved', 'resolved', 'fixed', 'success'];
  
  // Determine match
  const hasMismatchSignal = mismatchSignals.some(s => actual.includes(s));
  const hasPartialSignal = partialSignals.some(s => actual.includes(s));
  const hasSuccessSignal = successSignals.some(s => actual.includes(s));
  
  // Check if expected is contained in actual
  const expectedContained = actual.includes(expected) || expected.length === 0;
  const actualContainsExpected = expected.length > 0 && expectedContained;
  
  // Semantic overlap check
  const hasSemanticOverlap = _checkSemanticOverlap(expected, actual);
  
  if (hasMismatchSignal) {
    outcome_match = OUTCOME_MATCH.MISMATCH;
  } else if (actualContainsExpected || hasSemanticOverlap > 0.7) {
    outcome_match = OUTCOME_MATCH.MATCH;
  } else if (hasPartialSignal || hasSemanticOverlap > 0.3) {
    outcome_match = OUTCOME_MATCH.PARTIAL;
  } else if (hasSuccessSignal && expected.length > 0) {
    outcome_match = OUTCOME_MATCH.PARTIAL;  // Some success but not exact match
  } else {
    // Check observed effects
    const effects = outcome.observed_effects || [];
    if (effects.some(e => e.toLowerCase().includes('resolved') || e.toLowerCase().includes('success'))) {
      outcome_match = OUTCOME_MATCH.MATCH;
    } else if (effects.some(e => e.toLowerCase().includes('failed') || e.toLowerCase().includes('error'))) {
      outcome_match = OUTCOME_MATCH.MISMATCH;
    } else if (effects.length > 0) {
      outcome_match = OUTCOME_MATCH.PARTIAL;
    }
  }
  
  // Determine impact
  if (outcome_match === OUTCOME_MATCH.MATCH) {
    impact_level = IMPACT_LEVEL.POSITIVE;
  } else if (outcome_match === OUTCOME_MATCH.MISMATCH) {
    impact_level = IMPACT_LEVEL.NEGATIVE;
  } else if (outcome_match === OUTCOME_MATCH.PARTIAL) {
    impact_level = IMPACT_LEVEL.NEUTRAL;
  }
  
  // Determine confidence delta based on outcome
  if (outcome_match === OUTCOME_MATCH.MATCH) {
    confidence_delta = CONFIDENCE_DELTA.INCREASE;
  } else if (outcome_match === OUTCOME_MATCH.MISMATCH) {
    confidence_delta = CONFIDENCE_DELTA.DECREASE;
  } else {
    confidence_delta = CONFIDENCE_DELTA.NO_CHANGE;
  }
  
  return {
    outcome_match,
    impact_level,
    confidence_delta,
  };
}

function _checkSemanticOverlap(expected, actual) {
  // Simple word overlap check
  const expectedWords = new Set(expected.split(/\s+/).filter(w => w.length > 3));
  const actualWords = new Set(actual.split(/\s+/).filter(w => w.length > 3));
  
  if (expectedWords.size === 0) return 0;
  
  let overlap = 0;
  for (const word of expectedWords) {
    if (actualWords.has(word)) overlap++;
  }
  
  return overlap / expectedWords.size;
}

// ─── Reliability Tracking ───────────────────────────────────────────────────

/**
 * updateActionReliability(actionId, outcomeRecord)
 * 
 * Updates the reliability record for an action based on the outcome.
 */
function updateActionReliability(actionId, outcomeRecord) {
  const store = getStore();
  
  if (!store.action_reliability[actionId]) {
    store.action_reliability[actionId] = {
      action_id: actionId,
      total_evaluations: 0,
      match_count: 0,
      partial_count: 0,
      mismatch_count: 0,
      unknown_count: 0,
      current_confidence: ACTION_CONFIDENCE.INITIAL,
      first_evaluated_at: outcomeRecord.evaluated_at,
      last_evaluated_at: outcomeRecord.evaluated_at,
      recent_outcomes: [],  // Last 10 outcomes for trend
      trend: TREND.STABLE,
      suppressed: false,
      suppression_reason: null,
    };
  }
  
  const reliability = store.action_reliability[actionId];
  
  // Update counts
  reliability.total_evaluations++;
  
  switch (outcomeRecord.outcome_match) {
    case OUTCOME_MATCH.MATCH:
      reliability.match_count++;
      break;
    case OUTCOME_MATCH.PARTIAL:
      reliability.partial_count++;
      break;
    case OUTCOME_MATCH.MISMATCH:
      reliability.mismatch_count++;
      break;
    default:
      reliability.unknown_count++;
  }
  
  // Update confidence
  reliability.current_confidence = _adjustConfidence(
    reliability.current_confidence,
    outcomeRecord.confidence_delta
  );
  
  // Track recent outcomes (rolling window)
  reliability.recent_outcomes.push({
    match: outcomeRecord.outcome_match,
    impact: outcomeRecord.impact_level,
    at: outcomeRecord.evaluated_at,
  });
  
  if (reliability.recent_outcomes.length > 10) {
    reliability.recent_outcomes = reliability.recent_outcomes.slice(-10);
  }
  
  // Calculate trend
  reliability.trend = _calculateTrend(reliability.recent_outcomes);
  
  // Check if should recommend suppression
  if (reliability.mismatch_count >= FAILURE_PATTERN_THRESHOLD) {
    const mismatchRatio = reliability.mismatch_count / reliability.total_evaluations;
    if (mismatchRatio > 0.5 || reliability.current_confidence < SUPPRESSION_THRESHOLD) {
      if (!reliability.suppressed) {
        reliability.suppressed = true;
        reliability.suppression_reason = `Failure pattern detected: ${reliability.mismatch_count} mismatches, confidence ${reliability.current_confidence.toFixed(2)}`;
        store.suppressed_actions[actionId] = {
          suppressed_at: new Date().toISOString(),
          reason: reliability.suppression_reason,
          confidence_at_suppression: reliability.current_confidence,
        };
        _auditLog('ACTION_SUPPRESSED', actionId, {
          reason: reliability.suppression_reason,
          confidence: reliability.current_confidence,
        });
      }
    }
  }
  
  reliability.last_evaluated_at = outcomeRecord.evaluated_at;
  
  return reliability;
}

function _adjustConfidence(currentConfidence, delta) {
  let newConfidence = currentConfidence;
  
  if (delta === CONFIDENCE_DELTA.INCREASE) {
    newConfidence = Math.min(ACTION_CONFIDENCE.MAX_CONFIDENCE, currentConfidence + ACTION_CONFIDENCE.RECOVERY_RATE);
  } else if (delta === CONFIDENCE_DELTA.DECREASE) {
    newConfidence = Math.max(ACTION_CONFIDENCE.MIN_CONFIDENCE, currentConfidence - ACTION_CONFIDENCE.DECAY_RATE);
  }
  // NO_CHANGE leaves confidence unchanged
  
  return newConfidence;
}

function _calculateTrend(recentOutcomes) {
  if (recentOutcomes.length < 3) return TREND.STABLE;
  
  const last5 = recentOutcomes.slice(-5);
  const matches = last5.filter(o => o.match === OUTCOME_MATCH.MATCH).length;
  
  if (matches >= 4) return TREND.IMPROVING;
  if (matches <= 1) return TREND.DEGRADING;
  return TREND.STABLE;
}

// ─── Pattern Detection ─────────────────────────────────────────────────────

/**
 * checkFailurePattern(actionId)
 * 
 * Checks if an action has a detected failure pattern.
 */
function checkFailurePattern(actionId) {
  const store = getStore();
  const reliability = store.action_reliability[actionId];
  
  if (!reliability) {
    return { isPattern: false, reason: null };
  }
  
  // Check if already suppressed
  if (reliability.suppressed) {
    return {
      isPattern: true,
      reason: reliability.suppression_reason,
      suppressed: true,
    };
  }
  
  // Check failure threshold
  if (reliability.mismatch_count >= FAILURE_PATTERN_THRESHOLD) {
    const mismatchRatio = reliability.mismatch_count / reliability.total_evaluations;
    if (mismatchRatio > 0.5) {
      return {
        isPattern: true,
        reason: `${reliability.mismatch_count} mismatches (${(mismatchRatio * 100).toFixed(0)}% failure rate)`,
        suppressed: false,
      };
    }
  }
  
  return { isPattern: false, reason: null };
}

/**
 * detectSystematicFailures()
 * 
 * Scans all actions for systematic failure patterns.
 */
function detectSystematicFailures() {
  const store = getStore();
  const failures = [];
  
  for (const [actionId, reliability] of Object.entries(store.action_reliability)) {
    const patternCheck = checkFailurePattern(actionId);
    if (patternCheck.isPattern) {
      failures.push({
        action_id: actionId,
        ...patternCheck,
        reliability: {
          total_evaluations: reliability.total_evaluations,
          mismatch_count: reliability.mismatch_count,
          current_confidence: reliability.current_confidence,
          trend: reliability.trend,
        },
      });
    }
  }
  
  return failures;
}

// ─── Learning Constraints ─────────────────────────────────────────────────

/**
 * LEARNING CONSTRAINTS (hard limits)
 * 
 * These are NEVER modified by learning:
 * - Approval requirements
 * - Action classification (SAFE_AUTONOMOUS / SUPERVISED / RESTRICTED)
 * - Safety constraints
 * 
 * These MAY be influenced by learning:
 * - Recommendation strength (how strongly to recommend)
 * - Confidence scoring (action reliability weighting)
 * - Prioritization signals (preferred vs deprioritized)
 */

// These are intentionally NOT modifiable by the learning system
const FROZEN_CONSTRAINTS = [
  'approval_requirements',
  'action_classification',
  'safe_action_zone_boundaries',
  'kill_switch_settings',
  'frequency_limits',
  'priority_hierarchy',
];

/**
 * getLearningInfluence(actionId)
 * 
 * Returns what learning may influence for this action.
 * This is the ONLY thing that learning can modify.
 */
function getLearningInfluence(actionId) {
  const store = getStore();
  const reliability = store.action_reliability[actionId];
  
  if (!reliability) {
    return {
      recommendation_strength: 1.0,  // Full strength for new actions
      confidence_weight: 1.0,
      priority_signal: 'neutral',
      suppressed: false,
      reason: 'New action — no learning data yet',
    };
  }
  
  // Suppressed actions get zero recommendation strength
  if (reliability.suppressed) {
    return {
      recommendation_strength: 0,
      confidence_weight: 0,
      priority_signal: 'suppressed',
      suppressed: true,
      reason: reliability.suppression_reason,
    };
  }
  
  // Calculate recommendation strength based on confidence
  // MIN_CONFIDENCE (0.2) → strength 0.3
  // MAX_CONFIDENCE (0.95) → strength 1.0
  const confidenceRange = ACTION_CONFIDENCE.MAX_CONFIDENCE - ACTION_CONFIDENCE.MIN_CONFIDENCE;
  const normalizedConfidence = (reliability.current_confidence - ACTION_CONFIDENCE.MIN_CONFIDENCE) / confidenceRange;
  const recommendation_strength = 0.3 + (normalizedConfidence * 0.7);
  
  // Confidence weight for priority calculation
  const confidence_weight = reliability.current_confidence;
  
  // Priority signal based on trend and confidence
  let priority_signal = 'neutral';
  if (reliability.trend === TREND.IMPROVING && reliability.current_confidence > 0.6) {
    priority_signal = 'preferred';
  } else if (reliability.trend === TREND.DEGRADING || reliability.current_confidence < 0.4) {
    priority_signal = 'deprioritized';
  }
  
  return {
    recommendation_strength,
    confidence_weight,
    priority_signal,
    suppressed: false,
    trend: reliability.trend,
    current_confidence: reliability.current_confidence,
    reason: `Confidence: ${reliability.current_confidence.toFixed(2)}, Trend: ${reliability.trend}`,
    frozen_constraints_unmodified: FROZEN_CONSTRAINTS,
  };
}

// ─── Feedback Integration ─────────────────────────────────────────────────

/**
 * getConfidenceWeightForAction(actionId)
 * 
 * Returns confidence weight for priority-manager integration.
 * This is how learning feeds into priority calculation.
 */
function getConfidenceWeightForAction(actionId) {
  const influence = getLearningInfluence(actionId);
  return {
    action_id: actionId,
    confidence_weight: influence.confidence_weight,
    suppressed: influence.suppressed,
    recommendation_strength: influence.recommendation_strength,
    priority_signal: influence.priority_signal,
  };
}

/**
 * getRecommendationAdjustment(actionId, baseRecommendation)
 * 
 * Adjusts a recommendation based on learned reliability.
 * Returns { adjusted, reason, suppress }
 */
function getRecommendationAdjustment(actionId, baseRecommendation = {}) {
  const influence = getLearningInfluence(actionId);
  
  if (influence.suppressed) {
    return {
      adjusted: false,
      suppress: true,
      reason: `Action suppressed: ${influence.reason}`,
      recommendation_strength: 0,
    };
  }
  
  if (influence.recommendation_strength < 0.5) {
    return {
      adjusted: true,
      suppress: false,
      reason: `Low confidence (${influence.current_confidence?.toFixed(2)}) — reduced recommendation strength`,
      recommendation_strength: influence.recommendation_strength,
      priority_signal: influence.priority_signal,
    };
  }
  
  return {
    adjusted: false,
    suppress: false,
    reason: influence.reason,
    recommendation_strength: influence.recommendation_strength,
    priority_signal: influence.priority_signal,
  };
}

// ─── Audit ───────────────────────────────────────────────────────────────

function _auditLog(eventType, actionId, details) {
  const store = getStore();
  
  const entry = {
    event_type: eventType,
    action_id: actionId,
    details,
    timestamp: new Date().toISOString(),
  };
  
  store.audit_log.push(entry);
  
  if (store.audit_log.length > store.max_audit) {
    store.audit_log = store.audit_log.slice(-store.max_audit);
  }
  
  // Don't save here — caller will save
}

// ─── Status & Queries ─────────────────────────────────────────────────────

/**
 * getOutcomeSummary()
 */
function getOutcomeSummary() {
  const store = getStore();
  
  const outcomes = store.outcomes.slice(-20);  // Last 20
  const actionCount = Object.keys(store.action_reliability).length;
  const suppressedCount = Object.keys(store.suppressed_actions).length;
  
  let matchCount = 0, partialCount = 0, mismatchCount = 0;
  for (const r of Object.values(store.action_reliability)) {
    matchCount += r.match_count;
    partialCount += r.partial_count;
    mismatchCount += r.mismatch_count;
  }
  
  return {
    total_evaluations: store.total_evaluations,
    actions_tracked: actionCount,
    suppressed_actions: suppressedCount,
    match_rate: store.total_evaluations > 0 
      ? (matchCount / store.total_evaluations * 100).toFixed(1) + '%'
      : 'N/A',
    recent_outcomes: outcomes.length,
    last_evaluation_at: store.last_evaluation_at,
  };
}

/**
 * getActionReliability(actionId)
 */
function getActionReliability(actionId) {
  const store = getStore();
  return store.action_reliability[actionId] || null;
}

/**
 * getAuditLog(filter = {})
 */
function getAuditLog(filter = {}) {
  const store = getStore();
  let log = [...store.audit_log];
  
  if (filter.actionId) {
    log = log.filter(e => e.action_id === filter.actionId);
  }
  if (filter.eventType) {
    log = log.filter(e => e.event_type === filter.eventType);
  }
  
  return log;
}

/**
 * getRecentOutcomes(count = 10)
 */
function getRecentOutcomes(count = 10) {
  const store = getStore();
  return store.outcomes.slice(-count).reverse();
}

// ─── Full Evaluation Cycle ────────────────────────────────────────────────

/**
 * runOutcomeEvaluationCycle(outcomes)
 * 
 * Main entry point. Processes multiple outcomes and returns learning summary.
 */
function runOutcomeEvaluationCycle(outcomes = []) {
  const store = getStore();
  
  // Record each outcome
  const recorded = outcomes.map(o => recordOutcome(o));
  
  // Detect failures
  const systematicFailures = detectSystematicFailures();
  
  // Get suppressed actions
  const suppressed = Object.keys(store.suppressed_actions);
  
  // Get learning influences for recently evaluated actions
  const recentActions = [...new Set(outcomes.map(o => o.action_id))];
  const influences = recentActions.map(id => ({
    action_id: id,
    ...getLearningInfluence(id),
  }));
  
  return {
    recorded_count: recorded.length,
    outcomes: recorded,
    systematic_failures: systematicFailures,
    suppressed_actions: suppressed,
    learning_influences: influences,
    summary: getOutcomeSummary(),
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Constants
  OUTCOME_MATCH,
  IMPACT_LEVEL,
  CONFIDENCE_DELTA,
  TREND,
  ACTION_CONFIDENCE,
  FROZEN_CONSTRAINTS,
  
  // Core
  recordOutcome,
  evaluateOutcome,
  
  // Reliability
  updateActionReliability,
  getActionReliability,
  checkFailurePattern,
  detectSystematicFailures,
  
  // Learning
  getLearningInfluence,
  getConfidenceWeightForAction,
  getRecommendationAdjustment,
  
  // Constraints (for verification)
  getFrozenConstraints: () => [...FROZEN_CONSTRAINTS],
  
  // Status
  getOutcomeSummary,
  getAuditLog,
  getRecentOutcomes,
  
  // Cycle
  runOutcomeEvaluationCycle,
  
  // Utils
  resetCaches,
};
