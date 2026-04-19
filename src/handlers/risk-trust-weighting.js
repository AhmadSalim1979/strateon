/**
 * Risk & Trust Weighting Layer — R13
 * 
 * Introduces system-level understanding of risk and trust so that not all
 * issues, drift signals, or inconsistencies are treated equally.
 * 
 * This layer does NOT:
 * - Modify approval requirements
 * - Override SAFE/SUPERVISED/RESTRICTED classifications
 * - Introduce autonomous execution
 * 
 * Instead, it provides weighted signals to influence:
 * - Prioritization
 * - Escalation decisions
 * - Recommendation strength
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

const RISK_LEVEL = {
  CRITICAL: 'CRITICAL',   // Immediate attention required, blocks other work
  HIGH: 'HIGH',           // Significant risk, should be addressed soon
  MEDIUM: 'MEDIUM',       // Moderate risk, addressed in normal flow
  LOW: 'LOW',             // Minor risk, can be deferred
};

const RISK_WEIGHT = {
  CRITICAL: 1.0,
  HIGH: 0.75,
  MEDIUM: 0.5,
  LOW: 0.25,
};

const TRUST_LEVEL = {
  HIGH: 'HIGH',           // Consistently reliable
  MEDIUM: 'MEDIUM',       // Usually reliable
  LOW: 'LOW',             // Unreliable, discount signals
  UNTRUSTED: 'UNTRUSTED', // Should be ignored
};

const TRUST_WEIGHT = {
  HIGH: 1.0,
  MEDIUM: 0.7,
  LOW: 0.4,
  UNTRUSTED: 0.1,
};

// Risk scoring weights for different signal types
const SIGNAL_RISK_WEIGHTS = {
  // From R12 — Identity/Memory Consistency
  CONTRADICTED: RISK_WEIGHT.HIGH,    // Will be upgraded to CRITICAL if safety-related
  OUTDATED: RISK_WEIGHT.MEDIUM,
  PARTIALLY_SUPPORTED: RISK_WEIGHT.LOW,
  UNVERIFIED: RISK_WEIGHT.LOW,
  
  // From R11 — Outcome Evaluation
  ACTION_MISMATCH: RISK_WEIGHT.MEDIUM,
  ACTION_REPEATED_FAILURE: RISK_WEIGHT.HIGH,
  ACTION_SUPPRESSED: RISK_WEIGHT.MEDIUM,
  
  // From R7 — System Health
  UNHEALTHY_SYSTEM: RISK_WEIGHT.HIGH,
  CRITICAL_SYSTEM: RISK_WEIGHT.CRITICAL,
  ELEVATED_ERRORS: RISK_WEIGHT.MEDIUM,
};

// Safety-related claims that trigger CRITICAL escalation
const SAFETY_CLAIM_PATTERNS = [
  'approval', 'bypass', 'safety', 'constraint', 'restricted',
  'kill switch', 'supervised', 'classified',
];

// ─── State ───────────────────────────────────────────────────────────────────

let _state = null;
const STATE_PATH = path.join(__dirname, '../../state/risk-trust-weighting.json');

function getState() {
  if (_state) return _state;
  
  if (fs.existsSync(STATE_PATH)) {
    try {
      _state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch (e) {
      _state = _freshState();
    }
  } else {
    _state = _freshState();
  }
  return _state;
}

function _freshState() {
  return {
    // Risk scores by category
    risk_scores: {
      identity_drift: {},
      action_failures: {},
      system_discrepancies: {},
    },
    
    // Trust scores by component
    trust_scores: {
      actions: {},
      signals: {},
      components: {},
    },
    
    // Combined risk assessments
    assessments: [],
    
    // Audit log
    audit_log: [],
    
    // Metrics
    last_assessment_at: null,
    total_assessments: 0,
  };
}

function saveState() {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(getState(), null, 2), 'utf8');
}

function resetCaches() {
  _state = null;
}

// ─── Risk Classification ─────────────────────────────────────────────────────

/**
 * classifyRisk(signalType, signalData)
 * 
 * Classifies a signal into CRITICAL/HIGH/MEDIUM/LOW risk.
 */
function classifyRisk(signalType, signalData = {}) {
  let baseRisk = SIGNAL_RISK_WEIGHTS[signalType] || RISK_WEIGHT.MEDIUM;
  
  // Check if this is a safety-related claim (escalate to CRITICAL)
  if (signalData.claim_text) {
    const claimLower = signalData.claim_text.toLowerCase();
    if (SAFETY_CLAIM_PATTERNS.some(p => claimLower.includes(p))) {
      baseRisk = RISK_WEIGHT.CRITICAL;
    }
  }
  
  // Check for CRITICAL system state
  if (signalData.system_status === 'CRITICAL') {
    baseRisk = RISK_WEIGHT.CRITICAL;
  }
  
  // Check for repeated failures (escalate)
  if (signalData.repeated_failures && signalData.repeated_failures >= 3) {
    baseRisk = Math.max(baseRisk, RISK_WEIGHT.HIGH);
  }
  
  return {
    risk_level: _weightToLevel(baseRisk),
    risk_weight: baseRisk,
    signal_type: signalType,
    factors: _explainRiskFactors(signalData),
  };
}

function _weightToLevel(weight) {
  if (weight >= 0.9) return RISK_LEVEL.CRITICAL;
  if (weight >= 0.7) return RISK_LEVEL.HIGH;
  if (weight >= 0.4) return RISK_LEVEL.MEDIUM;
  return RISK_LEVEL.LOW;
}

function _explainRiskFactors(data) {
  const factors = [];
  
  if (data.claim_text && SAFETY_CLAIM_PATTERNS.some(p => data.claim_text.toLowerCase().includes(p))) {
    factors.push('safety_related_claim');
  }
  if (data.system_status === 'CRITICAL') factors.push('critical_system_state');
  if (data.repeated_failures >= 3) factors.push('repeated_failures');
  if (data.confidence < 0.3) factors.push('low_confidence');
  if (data.suppressed) factors.push('suppressed_action');
  
  return factors;
}

// ─── Trust Scoring ──────────────────────────────────────────────────────────

/**
 * scoreTrust(entityType, entityId, trustData)
 * 
 * Assigns a trust score to an action, signal, or component.
 */
function scoreTrust(entityType, entityId, trustData = {}) {
  const state = getState();
  const trustKey = `${entityType}:${entityId}`;
  
  let baseTrust = trustData.current_confidence || trustData.base_trust || 0.7;
  
  // Get outcome history if available
  if (trustData.outcome_history) {
    const { match_count, mismatch_count, total } = trustData.outcome_history;
    if (total > 0) {
      const matchRate = match_count / total;
      baseTrust = Math.min(0.95, Math.max(0.2, matchRate));
    }
  }
  
  // Check for failure patterns (reduce trust)
  if (trustData.has_failure_pattern) {
    baseTrust = Math.min(baseTrust, 0.3);
  }
  
  // Check for suppression (significantly reduce)
  if (trustData.suppressed) {
    baseTrust = Math.min(baseTrust, 0.15);
  }
  
  // Check for trend degradation
  if (trustData.trend === 'degrading') {
    baseTrust = Math.min(baseTrust, baseTrust * 0.8);
  }
  
  // Apply trend improvement bonus
  if (trustData.trend === 'improving' && baseTrust < 0.7) {
    baseTrust = Math.min(0.9, baseTrust * 1.1);
  }
  
  // Lookup table for trust level
  let trustLevel = TRUST_LEVEL.MEDIUM;
  if (baseTrust >= 0.8) trustLevel = TRUST_LEVEL.HIGH;
  else if (baseTrust >= 0.5) trustLevel = TRUST_LEVEL.MEDIUM;
  else if (baseTrust >= 0.25) trustLevel = TRUST_LEVEL.LOW;
  else trustLevel = TRUST_LEVEL.UNTRUSTED;
  
  const record = {
    entity_type: entityType,
    entity_id: entityId,
    trust_level: trustLevel,
    trust_weight: TRUST_WEIGHT[trustLevel],
    raw_score: baseTrust,
    factors: _explainTrustFactors(trustData),
    assessed_at: new Date().toISOString(),
  };
  
  // Store in state
  if (entityType === 'action') {
    state.trust_scores.actions[entityId] = record;
  } else if (entityType === 'signal') {
    state.trust_scores.signals[entityId] = record;
  } else if (entityType === 'component') {
    state.trust_scores.components[entityId] = record;
  }
  
  return record;
}

function _explainTrustFactors(data) {
  const factors = [];
  
  if (data.has_failure_pattern) factors.push('failure_pattern_detected');
  if (data.suppressed) factors.push('action_suppressed');
  if (data.trend === 'degrading') factors.push('degrading_trend');
  if (data.trend === 'improving') factors.push('improving_trend');
  if (data.recent_outcomes >= 5) factors.push('sufficient_history');
  
  return factors;
}

/**
 * getTrustScore(entityType, entityId)
 * 
 * Retrieves current trust score for an entity.
 */
function getTrustScore(entityType, entityId) {
  const state = getState();
  const trustKey = `${entityType}:${entityId}`;
  
  if (entityType === 'action') {
    return state.trust_scores.actions[entityId] || null;
  } else if (entityType === 'signal') {
    return state.trust_scores.signals[entityId] || null;
  } else if (entityType === 'component') {
    return state.trust_scores.components[entityId] || null;
  }
  
  return null;
}

// ─── Weighted Decision Influence ────────────────────────────────────────────

/**
 * computeWeightedPriority(signal, risk, trust)
 * 
 * Computes weighted priority for a signal given its risk and trust scores.
 * Higher weight = higher priority.
 */
function computeWeightedPriority(signal, risk, trust) {
  // Base priority from signal
  const basePriority = signal.base_priority || 0.5;
  
  // Risk multiplier
  const riskMultiplier = risk?.risk_weight || RISK_WEIGHT.MEDIUM;
  
  // Trust multiplier
  const trustMultiplier = trust?.trust_weight || TRUST_WEIGHT.MEDIUM;
  
  // Weighted priority
  const weightedPriority = basePriority * riskMultiplier * trustMultiplier;
  
  return {
    original_priority: basePriority,
    risk_weight: riskMultiplier,
    trust_weight: trustMultiplier,
    weighted_priority: Math.min(1.0, Math.max(0, weightedPriority)),
    
    // Adjustment reason
    reason: _explainPriority(risk, trust, weightedPriority),
    
    // Whether signal should be suppressed (only untrusted signals suppress, not critical risk)
    suppress: trust?.trust_level === TRUST_LEVEL.UNTRUSTED,
  };
}

function _explainPriority(risk, trust, weightedPriority) {
  const reasons = [];
  
  if (risk?.risk_level === RISK_LEVEL.CRITICAL) {
    reasons.push('critical_risk_overrides');
  } else if (risk?.risk_level === RISK_LEVEL.HIGH) {
    reasons.push('high_risk_amplified');
  } else if (risk?.risk_level === RISK_LEVEL.LOW) {
    reasons.push('low_risk_deemphasized');
  }
  
  if (trust?.trust_level === TRUST_LEVEL.HIGH) {
    reasons.push('high_trust_amplified');
  } else if (trust?.trust_level === TRUST_LEVEL.LOW) {
    reasons.push('low_trust_discounted');
  } else if (trust?.trust_level === TRUST_LEVEL.UNTRUSTED) {
    reasons.push('untrusted_signal_suppressed');
  }
  
  return reasons.join(', ') || 'standard_priority';
}

// ─── Drift Severity Mapping ────────────────────────────────────────────────

/**
 * mapDriftToRisk(r12Classification, driftData)
 * 
 * Maps R12 consistency classifications to risk levels.
 */
function mapDriftToRisk(r12Classification, driftData = {}) {
  switch (r12Classification) {
    case 'CONTRADICTED':
      // Check if safety-related for CRITICAL escalation
      if (driftData.claim_text && 
          SAFETY_CLAIM_PATTERNS.some(p => driftData.claim_text.toLowerCase().includes(p))) {
        return {
          risk_level: RISK_LEVEL.CRITICAL,
          risk_weight: RISK_WEIGHT.CRITICAL,
          reason: 'safety_related_contradiction',
        };
      }
      return {
        risk_level: RISK_LEVEL.HIGH,
        risk_weight: RISK_WEIGHT.HIGH,
        reason: 'contradicted_claim',
      };
      
    case 'OUTDATED':
      return {
        risk_level: RISK_LEVEL.MEDIUM,
        risk_weight: RISK_WEIGHT.MEDIUM,
        reason: 'outdated_claim',
      };
      
    case 'PARTIALLY_SUPPORTED':
      return {
        risk_level: RISK_LEVEL.LOW,
        risk_weight: RISK_WEIGHT.LOW,
        reason: 'partial_support',
      };
      
    case 'UNVERIFIED':
      return {
        risk_level: RISK_LEVEL.LOW,
        risk_weight: RISK_WEIGHT.LOW,
        reason: 'unverified_claim',
      };
      
    case 'SUPPORTED':
      return {
        risk_level: null,  // No risk
        risk_weight: 0,
        reason: 'claim_supported',
      };
      
    default:
      return {
        risk_level: RISK_LEVEL.MEDIUM,
        risk_weight: RISK_WEIGHT.MEDIUM,
        reason: 'unknown_classification',
      };
  }
}

// ─── Risk Aggregation ────────────────────────────────────────────────────────

/**
 * aggregateRisk(signals)
 * 
 * Aggregates multiple signals into a combined risk assessment.
 * Highest risk dominates.
 */
function aggregateRisk(signals = []) {
  if (signals.length === 0) {
    return {
      overall_risk: RISK_LEVEL.LOW,
      overall_weight: RISK_WEIGHT.LOW,
      highest_risk: null,
      signal_count: 0,
    };
  }
  
  let highestWeight = 0;
  let highestSignal = null;
  
  for (const signal of signals) {
    if (signal.risk_weight > highestWeight) {
      highestWeight = signal.risk_weight;
      highestSignal = signal;
    }
  }
  
  // CRITICAL signals override everything
  const hasCritical = signals.some(s => s.risk_weight >= RISK_WEIGHT.CRITICAL);
  
  return {
    overall_risk: hasCritical ? RISK_LEVEL.CRITICAL : _weightToLevel(highestWeight),
    overall_weight: hasCritical ? RISK_WEIGHT.CRITICAL : highestWeight,
    highest_risk: highestSignal,
    critical_count: signals.filter(s => s.risk_weight >= RISK_WEIGHT.CRITICAL).length,
    high_count: signals.filter(s => s.risk_weight >= RISK_WEIGHT.HIGH && s.risk_weight < RISK_WEIGHT.CRITICAL).length,
    medium_count: signals.filter(s => s.risk_weight >= RISK_WEIGHT.MEDIUM && s.risk_weight < RISK_WEIGHT.HIGH).length,
    low_count: signals.filter(s => s.risk_weight < RISK_WEIGHT.MEDIUM).length,
    signal_count: signals.length,
  };
}

// ─── Integration Functions ───────────────────────────────────────────────────

/**
 * integrateWithPriorityManager(signals, options)
 * 
 * Prepares weighted signals for priority-manager integration.
 */
function integrateWithPriorityManager(signals, options = {}) {
  const {
    includeTrust = true,
    includeRisk = true,
    suppressUntrusted = false,
  } = options;
  
  const weightedSignals = [];
  
  for (const signal of signals) {
    // Get risk classification
    const risk = includeRisk 
      ? classifyRisk(signal.type, signal.data)
      : { risk_level: RISK_LEVEL.MEDIUM, risk_weight: RISK_WEIGHT.MEDIUM };
    
    // Get trust score
    const trust = includeTrust && signal.entity_id
      ? getTrustScore(signal.entity_type || 'signal', signal.entity_id)
      : null;
    
    // Compute weighted priority
    const priority = computeWeightedPriority(signal, risk, trust);
    
    // Skip if should suppress
    if (suppressUntrusted && priority.suppress) {
      continue;
    }
    
    weightedSignals.push({
      ...signal,
      risk,
      trust,
      priority,
    });
  }
  
  // Sort by weighted priority (highest first)
  weightedSignals.sort((a, b) => b.priority.weighted_priority - a.priority.weighted_priority);
  
  return weightedSignals;
}

/**
 * integrateWithDecisionModel(context, signals)
 * 
 * Provides risk/trust context to decision model.
 */
function integrateWithDecisionModel(context, signals = []) {
  const riskAssessment = aggregateRisk(signals);
  
  return {
    ...context,
    risk_assessment: riskAssessment,
    
    // Key flags for decision logic
    has_critical_risk: riskAssessment.overall_risk === RISK_LEVEL.CRITICAL,
    has_high_risk: riskAssessment.overall_risk === RISK_LEVEL.HIGH,
    
    // Trust summary
    trust_summary: {
      high_trust_count: Object.values(getState().trust_scores).flat()
        .filter(t => t?.trust_level === TRUST_LEVEL.HIGH).length,
      low_trust_count: Object.values(getState().trust_scores).flat()
        .filter(t => t?.trust_level === TRUST_LEVEL.LOW).length,
      untrusted_count: Object.values(getState().trust_scores).flat()
        .filter(t => t?.trust_level === TRUST_LEVEL.UNTRUSTED).length,
    },
    
    // Whether to enter elevated caution mode
    elevated_caution: riskAssessment.overall_weight >= RISK_WEIGHT.HIGH,
  };
}

// ─── Full Assessment Cycle ───────────────────────────────────────────────────

/**
 * runRiskTrustAssessmentCycle(inputs)
 * 
 * Main entry point. Performs full risk/trust assessment.
 */
function runRiskTrustAssessmentCycle(inputs = {}) {
  const state = getState();
  
  const {
    driftAlerts = [],        // From R12
    outcomeRecords = [],     // From R11
    systemState = {},        // From R7 / system health
  } = inputs;
  
  const signals = [];
  const assessments = [];
  
  // Process R12 drift alerts
  for (const drift of driftAlerts) {
    const risk = mapDriftToRisk(drift.type || drift.finding?.status, {
      claim_text: drift.claim || drift.claim_text,
    });
    
    if (risk.risk_level) {
      signals.push({
        type: 'DRIFT',
        source: 'R12',
        entity_type: 'signal',
        entity_id: drift.alert_id,
        data: drift,
        risk,
      });
    }
  }
  
  // Process R11 outcome records
  for (const outcome of outcomeRecords) {
    if (outcome.outcome_match === 'mismatch' || outcome.outcome_match === 'MISMATCH') {
      const risk = classifyRisk('ACTION_MISMATCH', {
        repeated_failures: outcome.repeated_failures,
        confidence: outcome.confidence_delta === 'DECREASE' ? 0.3 : 0.5,
      });
      
      signals.push({
        type: 'OUTCOME_MISMATCH',
        source: 'R11',
        entity_type: 'action',
        entity_id: outcome.action_id,
        data: outcome,
        risk,
      });
      
      // Update trust score
      scoreTrust('action', outcome.action_id, {
        outcome_history: {
          match_count: outcome.match_count || 0,
          mismatch_count: outcome.mismatch_count || 1,
          total: outcome.total_evaluations || 1,
        },
        suppressed: outcome.suppressed,
        trend: outcome.trend,
      });
    }
  }
  
  // Process system state
  if (systemState.system_status === 'CRITICAL' || systemState.isCritical) {
    signals.push({
      type: 'SYSTEM_CRITICAL',
      source: 'SYSTEM',
      entity_type: 'component',
      entity_id: 'system',
      data: systemState,
      risk: classifyRisk('CRITICAL_SYSTEM', { system_status: 'CRITICAL' }),
    });
  } else if (systemState.system_status === 'UNHEALTHY' || systemState.isUnhealthy) {
    signals.push({
      type: 'SYSTEM_UNHEALTHY',
      source: 'SYSTEM',
      entity_type: 'component',
      entity_id: 'system',
      data: systemState,
      risk: classifyRisk('UNHEALTHY_SYSTEM', {}),
    });
  }
  
  // Aggregate risk
  const riskAssessment = aggregateRisk(signals.map(s => s.risk));
  
  // Generate assessments
  assessments.push({
    assessment_id: `assess_${Date.now()}`,
    signals_processed: signals.length,
    risk_assessment: riskAssessment,
    trust_scores_updated: outcomeRecords.length,
    assessed_at: new Date().toISOString(),
  });
  
  // Update state
  state.last_assessment_at = new Date().toISOString();
  state.total_assessments++;
  state.assessments = assessments.slice(-50);  // Keep last 50
  
  _auditLog('RISK_TRUST_ASSESSMENT_COMPLETED', null, {
    signals: signals.length,
    risk_level: riskAssessment.overall_risk,
  });
  
  return {
    signals,
    risk_assessment: riskAssessment,
    weighted_signals: integrateWithPriorityManager(signals),
    decision_context: integrateWithDecisionModel({}, signals),
    assessments,
  };
}

// ─── Audit ──────────────────────────────────────────────────────────────────

function _auditLog(eventType, targetId, details) {
  const state = getState();
  
  state.audit_log.push({
    event_type: eventType,
    target_id: targetId,
    details,
    timestamp: new Date().toISOString(),
  });
}

// ─── Status & Queries ───────────────────────────────────────────────────────

/**
 * getRiskSummary()
 */
function getRiskSummary() {
  const state = getState();
  
  const allRisks = state.risk_scores;
  const allTrusts = state.trust_scores;
  
  return {
    drift_risks_tracked: Object.keys(allRisks.identity_drift || {}).length,
    action_risks_tracked: Object.keys(allRisks.action_failures || {}).length,
    actions_trusted: Object.keys(allTrusts.actions || {}).length,
    signals_trusted: Object.keys(allTrusts.signals || {}).length,
    components_trusted: Object.keys(allTrusts.components || {}).length,
    last_assessment_at: state.last_assessment_at,
    total_assessments: state.total_assessments,
  };
}

/**
 * getTrustLeaderboard(limit = 10)
 */
function getTrustLeaderboard(limit = 10) {
  const state = getState();
  const allTrusts = Object.entries(state.trust_scores.actions || {})
    .map(([id, t]) => ({ entity_id: id, ...t }))
    .sort((a, b) => b.raw_score - a.raw_score)
    .slice(0, limit);
  
  return allTrusts;
}

/**
 * getRiskLeaderboard(limit = 10)
 */
function getRiskLeaderboard(limit = 10) {
  const state = getState();
  const allRisks = Object.entries(state.risk_scores.action_failures || {})
    .map(([id, r]) => ({ entity_id: id, ...r }))
    .sort((a, b) => b.risk_weight - a.risk_weight)
    .slice(0, limit);
  
  return allRisks;
}

// ─── Constants Export ───────────────────────────────────────────────────────

function getConstants() {
  return {
    RISK_LEVEL,
    RISK_WEIGHT,
    TRUST_LEVEL,
    TRUST_WEIGHT,
    SIGNAL_RISK_WEIGHTS,
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Constants
  ...getConstants(),
  
  // Core
  classifyRisk,
  scoreTrust,
  computeWeightedPriority,
  mapDriftToRisk,
  aggregateRisk,
  
  // Integration
  integrateWithPriorityManager,
  integrateWithDecisionModel,
  
  // Cycle
  runRiskTrustAssessmentCycle,
  
  // Queries
  getRiskSummary,
  getTrustScore,
  getTrustLeaderboard,
  getRiskLeaderboard,
  getConstants,
  
  // Utils
  resetCaches,
};
