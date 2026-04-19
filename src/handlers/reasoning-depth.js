/**
 * Adaptive Reasoning Depth & Escalation — R16
 * 
 * Dynamically escalates reasoning depth based on situation complexity and risk.
 * 
 * This module does NOT:
 * - Change approval requirements
 * - Execute actions
 * - Bypass safety constraints
 * 
 * Instead, it influences how deeply MOOSA reasons about a situation.
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

const REASONING_MODE = {
  LOW: 'LOW',      // Default, fast operational decisions
  MEDIUM: 'MEDIUM', // Structured reasoning, multiple factors
  HIGH: 'HIGH',    // Deep reasoning, conflict resolution
};

const REASONING_DEPTH = {
  LOW: 1,      // ~100 tokens
  MEDIUM: 3,   // ~500 tokens
  HIGH: 5,     // ~1000+ tokens
};

const COMPLEXITY_INDICATORS = {
  // From R13 - Risk & Trust
  HIGH_RISK: 'high_risk',
  CRITICAL_RISK: 'critical_risk',
  LOW_TRUST: 'low_trust',
  UNTRUSTED: 'untrusted',
  
  // From R15 - Adversarial
  CONFLICTING_SIGNALS: 'conflicting_signals',
  CORRUPTED_INPUT: 'corrupted_input',
  PARTIAL_FAILURE: 'partial_failure',
  ADVERSARIAL_CONDITION: 'adversarial_condition',
  
  // From R12 - Identity Consistency
  CONTRADICTION: 'contradiction',
  OUTDATED_CLAIM: 'outdated_claim',
  
  // From R7 - System State
  DEGRADED_SYSTEM: 'degraded_system',
  UNHEALTHY_SYSTEM: 'unhealthy_system',
  
  // General
  MULTIPLE_COMPETING_PRIORITIES: 'multiple_competing_priorities',
  HIGH_UNCERTAINTY: 'high_uncertainty',
  NOVEL_SITUATION: 'novel_situation',
};

// Escalation thresholds
const ESCALATION_THRESHOLDS = {
  // Risk levels that trigger escalation
  RISK_TRIGGERS: ['HIGH', 'CRITICAL'],
  
  // Trust levels that trigger escalation
  TRUST_TRIGGERS: ['LOW', 'UNTRUSTED'],
  
  // Complexity score to escalate from LOW to MEDIUM
  MEDIUM_THRESHOLD: 2,  // 2+ indicators
  
  // Complexity score to escalate from MEDIUM to HIGH
  HIGH_THRESHOLD: 4,     // 4+ indicators
  
  // Specific single indicators that force HIGH
  FORCE_HIGH_INDICATORS: [
    COMPLEXITY_INDICATORS.CRITICAL_RISK,
    COMPLEXITY_INDICATORS.CONFLICTING_SIGNALS,
    COMPLEXITY_INDICATORS.ADVERSARIAL_CONDITION,
    COMPLEXITY_INDICATORS.CONTRADICTION,
    COMPLEXITY_INDICATORS.UNHEALTHY_SYSTEM,
    COMPLEXITY_INDICATORS.UNTRUSTED,
    COMPLEXITY_INDICATORS.DEGRADED_SYSTEM,
  ],
};

// ─── State ───────────────────────────────────────────────────────────────────

let _state = null;
const STATE_PATH = path.join(__dirname, '../../state/reasoning-depth.json');

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
    // Current reasoning mode
    current_mode: REASONING_MODE.LOW,
    
    // Current complexity indicators detected
    active_indicators: [],
    
    // Complexity score
    complexity_score: 0,
    
    // Mode history
    mode_history: [],
    
    // Audit log
    audit_log: [],
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

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * assessComplexity(situation)
 * 
 * Analyzes a situation and returns complexity indicators.
 */
function assessComplexity(situation = {}) {
  const indicators = [];
  
  const {
    riskLevel = null,
    riskWeight = 0,
    trustLevel = null,
    trustWeight = 1,
    systemStatus = 'HEALTHY',
    hasContradictions = false,
    hasConflictingSignals = false,
    hasAdversarialConditions = false,
    hasPartialFailure = false,
    hasCorruptedInput = false,
    competingPriorities = 0,
    uncertaintyLevel = 'low',  // low, medium, high
    isNovelSituation = false,
    outcomeUncertainty = 0,  // 0-1
  } = situation;
  
  // Risk indicators
  if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
    const weight = riskWeight > 0 ? riskWeight : (riskLevel === 'CRITICAL' ? 1.0 : 0.8);
    indicators.push({
      type: riskLevel === 'CRITICAL' 
        ? COMPLEXITY_INDICATORS.CRITICAL_RISK 
        : COMPLEXITY_INDICATORS.HIGH_RISK,
      weight,
      source: 'risk',
    });
  }
  
  // Trust indicators
  if (trustLevel === 'LOW') {
    const weight = trustWeight < 1 ? (1 - trustWeight) : 0.7;
    indicators.push({
      type: COMPLEXITY_INDICATORS.LOW_TRUST,
      weight,
      source: 'trust',
    });
  } else if (trustLevel === 'UNTRUSTED') {
    indicators.push({
      type: COMPLEXITY_INDICATORS.UNTRUSTED,
      weight: 1,
      source: 'trust',
    });
  }
  
  // System state indicators
  if (systemStatus === 'DEGRADED') {
    indicators.push({
      type: COMPLEXITY_INDICATORS.DEGRADED_SYSTEM,
      weight: 0.8,
      source: 'system',
    });
  } else if (systemStatus === 'UNHEALTHY' || systemStatus === 'CRITICAL') {
    indicators.push({
      type: systemStatus === 'CRITICAL' 
        ? COMPLEXITY_INDICATORS.CRITICAL_RISK
        : COMPLEXITY_INDICATORS.UNHEALTHY_SYSTEM,
      weight: 1,
      source: 'system',
    });
  }
  
  // Adversarial/contradiction indicators
  if (hasContradictions) {
    indicators.push({
      type: COMPLEXITY_INDICATORS.CONTRADICTION,
      weight: 1,
      source: 'consistency',
    });
  }
  
  if (hasConflictingSignals) {
    indicators.push({
      type: COMPLEXITY_INDICATORS.CONFLICTING_SIGNALS,
      weight: 1,
      source: 'adversarial',
    });
  }
  
  if (hasAdversarialConditions) {
    indicators.push({
      type: COMPLEXITY_INDICATORS.ADVERSARIAL_CONDITION,
      weight: 1,
      source: 'adversarial',
    });
  }
  
  if (hasPartialFailure) {
    indicators.push({
      type: COMPLEXITY_INDICATORS.PARTIAL_FAILURE,
      weight: 0.8,
      source: 'adversarial',
    });
  }
  
  if (hasCorruptedInput) {
    indicators.push({
      type: COMPLEXITY_INDICATORS.CORRUPTED_INPUT,
      weight: 0.9,
      source: 'adversarial',
    });
  }
  
  // Competing priorities
  if (competingPriorities >= 3) {
    indicators.push({
      type: COMPLEXITY_INDICATORS.MULTIPLE_COMPETING_PRIORITIES,
      weight: 0.6,
      source: 'priority',
    });
  }
  
  // Uncertainty
  if (uncertaintyLevel === 'high' || outcomeUncertainty > 0.7) {
    indicators.push({
      type: COMPLEXITY_INDICATORS.HIGH_UNCERTAINTY,
      weight: outcomeUncertainty || 0.8,
      source: 'uncertainty',
    });
  }
  
  // Novel situation
  if (isNovelSituation) {
    indicators.push({
      type: COMPLEXITY_INDICATORS.NOVEL_SITUATION,
      weight: 0.7,
      source: 'novelty',
    });
  }
  
  // Calculate complexity score (weighted sum, capped at 1.0)
  const complexityScore = Math.min(1, indicators.reduce((sum, i) => sum + i.weight, 0) / 5);
  
  return {
    indicators,
    complexity_score: complexityScore,
    indicator_count: indicators.length,
  };
}

/**
 * determineReasoningMode(situation)
 * 
 * Determines the appropriate reasoning mode based on situation complexity.
 */
function determineReasoningMode(situation = {}) {
  const { indicators, complexity_score } = assessComplexity(situation);
  const indicatorTypes = indicators.map(i => i.type);
  
  // Check for force-HIGH indicators
  const hasForceHigh = ESCALATION_THRESHOLDS.FORCE_HIGH_INDICATORS.some(
    ind => indicatorTypes.includes(ind)
  );
  
  let mode = REASONING_MODE.LOW;
  let reason = [];
  
  // Escalation logic
  if (hasForceHigh) {
    mode = REASONING_MODE.HIGH;
    reason.push('force_high_indicator');
  } else if (complexity_score >= 0.7 || indicators.length >= ESCALATION_THRESHOLDS.HIGH_THRESHOLD) {
    mode = REASONING_MODE.HIGH;
    reason.push('high_complexity');
  } else if (complexity_score >= 0.4 || indicators.length >= ESCALATION_THRESHOLDS.MEDIUM_THRESHOLD) {
    mode = REASONING_MODE.MEDIUM;
    reason.push('medium_complexity');
  } else {
    mode = REASONING_MODE.LOW;
    reason.push('normal_operation');
  }
  
  // Check risk escalation
  if (situation.riskLevel === 'HIGH' && mode !== REASONING_MODE.HIGH) {
    mode = REASONING_MODE.MEDIUM;
    reason.push('high_risk_escalation');
  } else if (situation.riskLevel === 'CRITICAL') {
    mode = REASONING_MODE.HIGH;
    reason.push('critical_risk_escalation');
  }
  
  // Check trust escalation
  if ((situation.trustLevel === 'LOW' || situation.trustLevel === 'UNTRUSTED') && mode === REASONING_MODE.LOW) {
    mode = REASONING_MODE.MEDIUM;
    reason.push('low_trust_escalation');
  }
  
  // Update state
  const state = getState();
  state.current_mode = mode;
  state.active_indicators = indicators;
  state.complexity_score = complexity_score;
  state.mode_history.push({
    mode,
    reason,
    indicators: indicators.length,
    timestamp: new Date().toISOString(),
  });
  
  // Keep last 50 history entries
  if (state.mode_history.length > 50) {
    state.mode_history = state.mode_history.slice(-50);
  }
  
  _auditLog('REASONING_MODE_CHANGED', null, { mode, reason, indicators: indicators.length });
  saveState();
  
  return {
    mode,
    depth: REASONING_DEPTH[mode],
    reason,
    indicators,
    complexity_score,
  };
}

/**
 * getCurrentReasoningMode()
 * 
 * Returns the current reasoning mode without re-assessing.
 */
function getCurrentReasoningMode() {
  const state = getState();
  return {
    mode: state.current_mode,
    depth: REASONING_DEPTH[state.current_mode],
    complexity_score: state.complexity_score,
    active_indicators: state.active_indicators,
  };
}

/**
 * shouldEscalate(situation)
 * 
 * Quick check if a situation warrants reasoning mode escalation.
 * Evaluates situation properties, not current mode state.
 */
function shouldEscalate(situation = {}) {
  // Check for force-HIGH indicators - these always warrant escalation
  if (situation.riskLevel === 'CRITICAL' || 
      situation.hasContradictions ||
      situation.hasConflictingSignals ||
      situation.hasAdversarialConditions ||
      situation.systemStatus === 'UNHEALTHY' ||
      situation.systemStatus === 'CRITICAL') {
    return { escalate: true, reason: 'force_high_trigger', target_mode: REASONING_MODE.HIGH };
  }
  
  // Check for MEDIUM escalation
  if (situation.riskLevel === 'HIGH' ||
      situation.trustLevel === 'LOW' ||
      situation.trustLevel === 'UNTRUSTED' ||
      situation.systemStatus === 'DEGRADED' ||
      situation.hasPartialFailure) {
    return { escalate: true, reason: 'complexity_threshold', target_mode: REASONING_MODE.MEDIUM };
  }
  
  return { escalate: false, reason: 'within_normal_parameters' };
}

// ─── Downgrade Logic ─────────────────────────────────────────────────────────

/**
 * shouldDowngrade(situation)
 * 
 * Determines if current mode should be downgraded based on recent stability.
 */
function shouldDowngrade(situation = {}) {
  const state = getState();
  
  // Don't downgrade if recently escalated
  if (state.mode_history.length > 0) {
    const lastChange = state.mode_history[state.mode_history.length - 1];
    const timeSinceChange = Date.now() - new Date(lastChange.timestamp).getTime();
    
    // Minimum time at current mode before downgrade
    const MIN_MODE_DURATION_MS = 5 * 60 * 1000;  // 5 minutes
    
    if (timeSinceChange < MIN_MODE_DURATION_MS) {
      return { downgrade: false, reason: 'too_soon_since_escalation' };
    }
  }
  
  // Check if situation has improved
  const { complexity_score } = assessComplexity(situation);
  
  if (complexity_score < 0.3 && situation.riskLevel !== 'HIGH' && situation.riskLevel !== 'CRITICAL') {
    if (state.current_mode === REASONING_MODE.HIGH) {
      return { downgrade: true, reason: 'complexity_reduced', target_mode: REASONING_MODE.MEDIUM };
    } else if (state.current_mode === REASONING_MODE.MEDIUM) {
      return { downgrade: true, reason: 'situation_stabilized', target_mode: REASONING_MODE.LOW };
    }
  }
  
  return { downgrade: false, reason: 'situation_unchanged' };
}

/**
 * downgradeMode()
 * 
 * Actually performs the downgrade after shouldDowngrade returns true.
 */
function downgradeMode() {
  const state = getState();
  const check = shouldDowngrade(state.current_mode === REASONING_MODE.HIGH 
    ? { riskLevel: 'LOW', complexity_score: state.complexity_score }
    : { riskLevel: 'LOW', complexity_score: state.complexity_score });
  
  if (!check.downgrade) {
    return { success: false, reason: check.reason };
  }
  
  const previousMode = state.current_mode;
  state.current_mode = check.target_mode;
  
  state.mode_history.push({
    mode: check.target_mode,
    reason: ['downgrade:' + check.reason],
    indicators: 0,
    timestamp: new Date().toISOString(),
  });
  
  _auditLog('REASONING_MODE_DOWNGRADED', null, { 
    from: previousMode, 
    to: check.target_mode, 
    reason: check.reason 
  });
  
  saveState();
  
  return { success: true, from: previousMode, to: check.target_mode, reason: check.reason };
}

// ─── Output Discipline ───────────────────────────────────────────────────────

/**
 * getOutputGuidelines(mode)
 * 
 * Returns guidelines for output based on reasoning mode.
 */
function getOutputGuidelines(mode = REASONING_MODE.LOW) {
  switch (mode) {
    case REASONING_MODE.HIGH:
      return {
        reasoning_explicit: true,
        conflicts_acknowledged: true,
        alternatives_considered: true,
        uncertainty_documented: true,
        confidence_stated: true,
        fallback_options: true,
        max_length: 'extended',
        format: 'detailed',
      };
      
    case REASONING_MODE.MEDIUM:
      return {
        reasoning_explicit: true,
        conflicts_acknowledged: true,
        alternatives_considered: false,
        uncertainty_documented: true,
        confidence_stated: true,
        fallback_options: false,
        max_length: 'moderate',
        format: 'structured',
      };
      
    case REASONING_MODE.LOW:
    default:
      return {
        reasoning_explicit: false,
        conflicts_acknowledged: false,
        alternatives_considered: false,
        uncertainty_documented: false,
        confidence_stated: false,
        fallback_options: false,
        max_length: 'brief',
        format: 'concise',
      };
  }
}

/**
 * generateReasoningContext(situation, mode)
 * 
 * Generates context for the reasoning engine based on mode.
 */
function generateReasoningContext(situation = {}, mode = REASONING_MODE.LOW) {
  const guidelines = getOutputGuidelines(mode);
  
  let context = {
    reasoning_mode: mode,
    depth: REASONING_DEPTH[mode],
    guidelines,
  };
  
  if (mode === REASONING_MODE.HIGH || mode === REASONING_MODE.MEDIUM) {
    // Add situation details for deeper reasoning
    context.situation = {
      risk_level: situation.riskLevel || 'NORMAL',
      trust_level: situation.trustLevel || 'MEDIUM',
      system_status: situation.systemStatus || 'HEALTHY',
      indicators: situation.indicators || [],
    };
    
    // Add conflict acknowledgment requirement
    if (situation.hasContradictions || situation.hasConflictingSignals) {
      context.requirements = context.requirements || [];
      context.requirements.push('explicitly_acknowledge_conflicts');
    }
    
    // Add uncertainty documentation
    if (situation.uncertaintyLevel === 'high' || situation.outcomeUncertainty > 0.5) {
      context.requirements = context.requirements || [];
      context.requirements.push('document_decision_uncertainty');
    }
    
    // Add alternative consideration
    if (situation.competingPriorities >= 2) {
      context.requirements = context.requirements || [];
      context.requirements.push('consider_alternative_priorities');
    }
  }
  
  return context;
}

// ─── Full Cycle ─────────────────────────────────────────────────────────────

/**
 * runReasoningDepthCycle(situation)
 * 
 * Main entry point. Assesses situation and determines reasoning mode.
 */
function runReasoningDepthCycle(situation = {}) {
  const escalation = shouldEscalate(situation);
  const downgrade = shouldDowngrade(situation);
  
  let modeResult;
  
  if (escalation.escalate) {
    modeResult = determineReasoningMode(situation);
  } else if (downgrade.downgrade) {
    const downgradeResult = downgradeMode();
    modeResult = {
      mode: downgradeResult.to,
      depth: REASONING_DEPTH[downgradeResult.to],
      reason: ['downgrade:' + downgradeResult.reason],
    };
  } else {
    modeResult = getCurrentReasoningMode();
    modeResult.reason = [escalation.reason || 'no_change'];
  }
  
  const context = generateReasoningContext(situation, modeResult.mode);
  
  return {
    mode: modeResult.mode,
    depth: modeResult.depth,
    reason: modeResult.reason,
    escalation: escalation.escalate,
    downgrade: downgrade.downgrade,
    context,
    complexity_score: modeResult.complexity_score || getState().complexity_score,
    active_indicators: modeResult.indicators || getState().active_indicators,
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
  
  // Keep last 100 entries
  if (state.audit_log.length > 100) {
    state.audit_log = state.audit_log.slice(-100);
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * getReasoningHistory(count)
 */
function getReasoningHistory(count = 10) {
  const state = getState();
  return state.mode_history.slice(-count);
}

/**
 * getAuditLog(filter)
 */
function getAuditLog(filter = {}) {
  const state = getState();
  let log = [...state.audit_log];
  
  if (filter.eventType) {
    log = log.filter(e => e.event_type === filter.eventType);
  }
  
  return log;
}

/**
 * getReasoningSummary()
 */
function getReasoningSummary() {
  const state = getState();
  
  const history = state.mode_history;
  const modeCounts = {};
  
  for (const entry of history) {
    modeCounts[entry.mode] = (modeCounts[entry.mode] || 0) + 1;
  }
  
  return {
    current_mode: state.current_mode,
    current_depth: REASONING_DEPTH[state.current_mode],
    complexity_score: state.complexity_score,
    active_indicators: state.active_indicators.length,
    mode_distribution: modeCounts,
    total_mode_changes: history.length,
    last_change: history.length > 0 ? history[history.length - 1] : null,
  };
}

// ─── Constants Export ───────────────────────────────────────────────────────

function getConstants() {
  return {
    REASONING_MODE,
    REASONING_DEPTH,
    COMPLEXITY_INDICATORS,
    ESCALATION_THRESHOLDS,
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Constants
  ...getConstants(),
  
  // Core
  assessComplexity,
  determineReasoningMode,
  getCurrentReasoningMode,
  shouldEscalate,
  shouldDowngrade,
  downgradeMode,
  
  // Output
  getOutputGuidelines,
  generateReasoningContext,
  
  // Cycle
  runReasoningDepthCycle,
  
  // Queries
  getReasoningHistory,
  getAuditLog,
  getReasoningSummary,
  
  // Utils
  resetCaches,
};
