/**
 * Workload Governance Layer — R10
 * 
 * Ensures MOOSA governs its own workload responsibly across cycles,
 * avoiding overcommitment, queue thrash, and excessive simultaneous effort.
 * 
 * Governs:
 * - active goals count
 * - paused chains count
 * - deferred queue size
 * - active issue load
 * - opportunity backlog
 * - recent escalation rate
 * - execution/recommendation throughput
 * 
 * NO AUTONOMOUS EXECUTION. Governance affects what is recommended, not what executes.
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

const WORKLOAD_STATE = {
  NORMAL: 'NORMAL',
  ELEVATED: 'ELEVATED',
  SATURATED: 'SATURATED',
};

// Workload thresholds
const THRESHOLDS = {
  NORMAL: {
    max_active_goals: 5,
    max_paused_chains: 3,
    max_deferred_queue: 15,
    max_active_issues: 3,
    max_opportunity_backlog: 10,
    max_escalation_rate: 2,  // per cycle
    max_recent_actions: 10,  // per minute
  },
  ELEVATED: {
    max_active_goals: 3,
    max_paused_chains: 2,
    max_deferred_queue: 10,
    max_active_issues: 2,
    max_opportunity_backlog: 5,
    max_escalation_rate: 1,
    max_recent_actions: 5,
  },
  SATURATED: {
    max_active_goals: 1,
    max_paused_chains: 1,
    max_deferred_queue: 5,
    max_active_issues: 1,
    max_opportunity_backlog: 2,
    max_escalation_rate: 0,  // none allowed
    max_recent_actions: 2,
  },
};

// State transition rules
const STATE_TRANSITIONS = {
  // What triggers escalation NORMAL → ELEVATED
  ESCALATE_TO_ELEVATED: (metrics) => {
    return (
      metrics.activeGoals > THRESHOLDS.ELEVATED.max_active_goals ||
      metrics.pausedChains > THRESHOLDS.ELEVATED.max_paused_chains ||
      metrics.deferredQueueSize > THRESHOLDS.ELEVATED.max_deferred_queue ||
      metrics.activeIssueLoad > THRESHOLDS.ELEVATED.max_active_issues ||
      metrics.opportunityBacklog > THRESHOLDS.ELEVATED.max_opportunity_backlog ||
      metrics.recentEscalationRate > THRESHOLDS.ELEVATED.max_escalation_rate ||
      metrics.recentActionCount > THRESHOLDS.ELEVATED.max_recent_actions
    );
  },
  
  // What triggers escalation ELEVATED → SATURATED
  ESCALATE_TO_SATURATED: (metrics) => {
    return (
      metrics.activeGoals > THRESHOLDS.SATURATED.max_active_goals ||
      metrics.pausedChains > THRESHOLDS.SATURATED.max_paused_chains ||
      metrics.deferredQueueSize > THRESHOLDS.SATURATED.max_deferred_queue ||
      metrics.activeIssueLoad > THRESHOLDS.SATURATED.max_active_issues ||
      metrics.opportunityBacklog > THRESHOLDS.SATURATED.max_opportunity_backlog ||
      metrics.recentEscalationRate > THRESHOLDS.SATURATED.max_escalation_rate ||
      metrics.recentActionCount > THRESHOLDS.SATURATED.max_recent_actions
    );
  },
  
  // What triggers de-escalation SATURATED → ELEVATED
  DEESCALATE_TO_ELEVATED: (metrics) => {
    return (
      metrics.activeGoals <= THRESHOLDS.ELEVATED.max_active_goals &&
      metrics.pausedChains <= THRESHOLDS.ELEVATED.max_paused_chains &&
      metrics.deferredQueueSize <= THRESHOLDS.ELEVATED.max_deferred_queue &&
      metrics.activeIssueLoad <= THRESHOLDS.ELEVATED.max_active_issues &&
      metrics.opportunityBacklog <= THRESHOLDS.ELEVATED.max_opportunity_backlog &&
      metrics.recentEscalationRate <= THRESHOLDS.ELEVATED.max_escalation_rate
    );
  },
  
  // What triggers de-escalation ELEVATED → NORMAL
  DEESCALATE_TO_NORMAL: (metrics) => {
    return (
      metrics.activeGoals <= THRESHOLDS.NORMAL.max_active_goals &&
      metrics.pausedChains <= THRESHOLDS.NORMAL.max_paused_chains &&
      metrics.deferredQueueSize <= THRESHOLDS.NORMAL.max_deferred_queue &&
      metrics.activeIssueLoad <= THRESHOLDS.NORMAL.max_active_issues &&
      metrics.opportunityBacklog <= THRESHOLDS.NORMAL.max_opportunity_backlog &&
      metrics.recentEscalationRate <= THRESHOLDS.NORMAL.max_escalation_rate &&
      metrics.recentActionCount <= THRESHOLDS.NORMAL.max_recent_actions
    );
  },
};

// ─── State ───────────────────────────────────────────────────────────────────

let _governanceStore = null;
const STORE_PATH = path.join(__dirname, '../../state/workload-governance.json');

function getStore() {
  if (_governanceStore) return _governanceStore;
  
  if (fs.existsSync(STORE_PATH)) {
    try {
      _governanceStore = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (e) {
      _governanceStore = _freshStore();
    }
  } else {
    _governanceStore = _freshStore();
  }
  return _governanceStore;
}

function _freshStore() {
  return {
    current_state: WORKLOAD_STATE.NORMAL,
    previous_state: null,
    state_since: new Date().toISOString(),
    state_transitions: 0,
    last_updated: new Date().toISOString(),
    
    // Metrics history (rolling window)
    metrics_history: [],
    max_history: 20,
    
    // Recent actions tracking
    recent_actions: [],
    max_recent_actions: 100,
    
    // Governance decisions this cycle
    decisions_this_cycle: [],
  };
}

function saveStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const store = getStore();
  store.last_updated = new Date().toISOString();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function resetCaches() {
  _governanceStore = null;
}

// ─── Metrics Collection ───────────────────────────────────────────────────────

/**
 * collectWorkloadMetrics(inputMetrics)
 * 
 * Collects current workload metrics from various sources.
 */
function collectWorkloadMetrics(inputMetrics = {}) {
  const now = Date.now();
  const store = getStore();
  
  // Build metrics from input and store
  const metrics = {
    // From input parameters
    activeGoals: inputMetrics.activeGoals || 0,
    pausedChains: inputMetrics.pausedChains || 0,
    deferredQueueSize: inputMetrics.deferredQueueSize || 0,
    activeIssueLoad: inputMetrics.activeIssueLoad || 0,
    activeIssueHighSeverity: inputMetrics.activeIssueHighSeverity || 0,
    opportunityBacklog: inputMetrics.opportunityBacklog || 0,
    
    // Escalation rate (calculated from recent history)
    recentEscalationRate: _calculateEscalationRate(store),
    
    // Recent action throughput
    recentActionCount: _countRecentActions(store, now - 60000),  // Last minute
    recentHighSeverityCount: _countRecentHighSeverityActions(store, now - 60000),
    
    // Saturating signals
    hasCriticalIssues: inputMetrics.activeIssueHighSeverity >= 2,
    hasUnhealthySystem: inputMetrics.isUnhealthy || false,
    escalationSpike: false,
  };
  
  // Detect escalation spike (more than 2 escalations in last 5 minutes)
  metrics.escalationSpike = _detectEscalationSpike(store, now);
  if (metrics.escalationSpike) {
    metrics.recentEscalationRate = Math.max(metrics.recentEscalationRate, 3);
  }
  
  // Record to history
  store.metrics_history.push({
    timestamp: now,
    state: store.current_state,
    ...metrics,
  });
  
  // Prune old history
  if (store.metrics_history.length > store.max_history) {
    store.metrics_history = store.metrics_history.slice(-store.max_history);
  }
  
  saveStore();
  return metrics;
}

function _calculateEscalationRate(store) {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  return store.metrics_history.filter(m => 
    m.timestamp > fiveMinutesAgo && 
    (m.escalationSpike || m.recentEscalationRate > 0)
  ).length;
}

function _detectEscalationSpike(store, now) {
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  const recentEscalations = store.metrics_history.filter(m =>
    m.timestamp > fiveMinutesAgo &&
    (m.escalationSpike === true || m.state === WORKLOAD_STATE.SATURATED)
  );
  return recentEscalations.length >= 3;
}

function _countRecentActions(store, since) {
  return store.recent_actions.filter(a => a.timestamp > since).length;
}

function _countRecentHighSeverityActions(store, since) {
  return store.recent_actions.filter(a => 
    a.timestamp > since && a.severity === 'high'
  ).length;
}

// ─── State Assessment ───────────────────────────────────────────────────────

/**
 * assessWorkloadState(metrics)
 * 
 * Determines the current workload state based on metrics.
 * Returns { newState, reason, constraints }.
 */
function assessWorkloadState(metrics) {
  const store = getStore();
  const currentState = store.current_state;
  
  let newState = currentState;
  let reason = '';
  let constraints = {};
  
  // State machine transitions
  if (currentState === WORKLOAD_STATE.NORMAL) {
    if (STATE_TRANSITIONS.ESCALATE_TO_SATURATED(metrics)) {
      newState = WORKLOAD_STATE.SATURATED;
      reason = 'Multiple thresholds exceeded — jumping to SATURATED';
    } else if (STATE_TRANSITIONS.ESCALATE_TO_ELEVATED(metrics)) {
      newState = WORKLOAD_STATE.ELEVATED;
      reason = 'Workload thresholds exceeded — ELEVATED';
    }
  } else if (currentState === WORKLOAD_STATE.ELEVATED) {
    if (STATE_TRANSITIONS.ESCALATE_TO_SATURATED(metrics)) {
      newState = WORKLOAD_STATE.SATURATED;
      reason = 'Workload continues to grow — SATURATED';
    } else if (STATE_TRANSITIONS.DEESCALATE_TO_NORMAL(metrics)) {
      newState = WORKLOAD_STATE.NORMAL;
      reason = 'Workload returned to normal levels';
    }
  } else if (currentState === WORKLOAD_STATE.SATURATED) {
    if (STATE_TRANSITIONS.DEESCALATE_TO_ELEVATED(metrics)) {
      newState = WORKLOAD_STATE.ELEVATED;
      reason = 'Saturation reducing — ELEVATED';
    } else if (STATE_TRANSITIONS.DEESCALATE_TO_NORMAL(metrics)) {
      newState = WORKLOAD_STATE.NORMAL;
      reason = 'Workload returned to normal levels';
    }
  }
  
  // Generate constraints based on state
  constraints = _generateConstraints(newState, metrics);
  
  // Override if critical issues present (priority protection)
  if (metrics.hasCriticalIssues || metrics.hasUnhealthySystem) {
    // Force minimal state to protect critical work
    newState = WORKLOAD_STATE.SATURATED;
    reason = 'CRITICAL/UNHEALTHY detected — forcing SATURATED for protection';
    constraints = _generateConstraints(WORKLOAD_STATE.SATURATED, metrics);
    constraints.priorityProtection = true;
  }
  
  // Update store if state changed
  if (newState !== currentState) {
    store.previous_state = currentState;
    store.current_state = newState;
    store.state_since = new Date().toISOString();
    store.state_transitions++;
    saveStore();
  }
  
  return {
    current_state: newState,
    previous_state: store.previous_state,
    state_since: store.state_since,
    state_transitions: store.state_transitions,
    reason,
    constraints,
    metrics,
  };
}

function _generateConstraints(state, metrics) {
  const t = THRESHOLDS[state];
  
  return {
    state,
    max_active_goals: t.max_active_goals,
    max_paused_chains: t.max_paused_chains,
    max_deferred_queue: t.max_deferred_queue,
    max_active_issues: t.max_active_issues,
    max_opportunity_backlog: t.max_opportunity_backlog,
    max_escalation_rate: t.max_escalation_rate,
    max_recent_actions: t.max_recent_actions,
    
    // Behavioral directives
    suppress_opportunities: state === WORKLOAD_STATE.SATURATED,
    suppress_new_goals: state === WORKLOAD_STATE.SATURATED || state === WORKLOAD_STATE.ELEVATED,
    reduce_recommendations: state !== WORKLOAD_STATE.NORMAL,
    favor_stabilization: state === WORKLOAD_STATE.SATURATED || state === WORKLOAD_STATE.ELEVATED,
    priority_protection: false,  // Set by caller if critical issues present
  };
}

// ─── Governance Decisions ────────────────────────────────────────────────────

/**
 * getWorkloadGovernanceDecision(workloadState, context)
 * 
 * Returns governance decisions for the current cycle.
 * 
 * context = {
 *   opportunityClassification: 'high_value' | 'low_value' | 'noise',
 *   goalType: 'stability' | 'optimization' | 'preventive' | 'initiative',
 *   goalPriority: number,
 *   isCriticalSystem: boolean,
 *   isUnhealthySystem: boolean,
 * }
 */
function getWorkloadGovernanceDecision(workloadState, context = {}) {
  const store = getStore();
  const { current_state, constraints } = workloadState;
  const decisions = [];
  
  const {
    opportunityClassification = null,
    goalType = null,
    goalPriority = 0.5,
    isCriticalSystem = false,
    isUnhealthySystem = false,
  } = context;
  
  // CRITICAL/UNHEALTHY always prioritized (priority protection)
  if (isCriticalSystem || isUnhealthySystem) {
    return {
      decision: 'allow',
      reason: 'CRITICAL/UNHEALTHY — priority protection active',
      suppressed: [],
      state: current_state,
    };
  }
  
  // ── Opportunity decisions ───────────────────────────────────────────────
  if (opportunityClassification) {
    if (constraints.suppress_opportunities) {
      decisions.push({
        type: 'opportunity',
        classification: opportunityClassification,
        decision: 'suppress',
        reason: `SATURATED state — suppressing opportunity surfacing`,
      });
    } else if (constraints.reduce_recommendations) {
      if (opportunityClassification === 'low_value' || opportunityClassification === 'noise') {
        decisions.push({
          type: 'opportunity',
          classification: opportunityClassification,
          decision: 'suppress',
          reason: `ELEVATED state — suppressing low-value opportunities`,
        });
      } else if (opportunityClassification === 'high_value') {
        decisions.push({
          type: 'opportunity',
          classification: opportunityClassification,
          decision: 'allow_with_attention',
          reason: 'High-value opportunity — allow but flag for attention',
        });
      }
    }
  }
  
  // ── Goal decisions ─────────────────────────────────────────────────────
  if (goalType) {
    if (constraints.suppress_new_goals) {
      if (goalType !== 'stability') {
        decisions.push({
          type: 'goal',
          goal_type: goalType,
          decision: 'suppress_creation',
          reason: `${current_state} state — suppressing new non-stability goals`,
        });
      } else {
        decisions.push({
          type: 'goal',
          goal_type: goalType,
          decision: 'allow',
          reason: 'STABILITY goal — always allowed',
        });
      }
    }
    
    // Pausing lower-priority goals when saturated
    if (current_state === WORKLOAD_STATE.SATURATED && goalPriority < 0.7 && goalType !== 'stability') {
      decisions.push({
        type: 'goal',
        goal_type: goalType,
        decision: 'recommend_pause',
        reason: 'SATURATED state — recommend pausing lower-priority goals',
      });
    }
  }
  
  // ── Summary ────────────────────────────────────────────────────────────
  const suppressed = decisions.filter(d => d.decision === 'suppress' || d.decision === 'suppress_creation');
  const allowed = decisions.filter(d => d.decision === 'allow' || d.decision === 'allow_with_attention');
  const recommendsPause = decisions.filter(d => d.decision === 'recommend_pause');
  
  return {
    decision: suppressed.length > 0 ? 'suppress' : allowed.length > 0 ? 'allow' : 'allow',
    suppressed,
    allowed,
    recommendsPause,
    state: current_state,
    constraints,
    reason: suppressed.length > 0 
      ? `${suppressed.length} item(s) suppressed due to workload` 
      : 'Workload allows normal operation',
  };
}

// ─── Backlog Management ────────────────────────────────────────────────────

/**
 * getBacklogDrainRecommendations(workloadState, backlogItems)
 * 
 * Returns recommendations for safely draining backlog without thrash.
 * 
 * backlogItems = [{ id, priority, age_cycles, type }]
 */
function getBacklogDrainRecommendations(workloadState, backlogItems = []) {
  const { current_state, constraints } = workloadState;
  
  if (backlogItems.length === 0) {
    return {
      recommendations: [],
      drain_rate: 'normal',
      reason: 'No backlog items',
    };
  }
  
  // Sort by priority (high to low), then by age
  const sorted = [...backlogItems].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return (b.age_cycles || 0) - (a.age_cycles || 0);
  });
  
  // Limit drain rate based on state
  let maxDrain = sorted.length;
  if (current_state === WORKLOAD_STATE.SATURATED) {
    maxDrain = Math.min(1, Math.ceil(sorted.length * 0.1));  // 10% or 1
  } else if (current_state === WORKLOAD_STATE.ELEVATED) {
    maxDrain = Math.min(3, Math.ceil(sorted.length * 0.3));  // 30% or 3
  }
  
  const recommended = sorted.slice(0, maxDrain);
  const deferred = sorted.slice(maxDrain);
  
  return {
    recommendations: recommended.map(item => ({
      ...item,
      action: 'process_now',
      reason: `${current_state} state — processing ${item.type || 'item'}`,
    })),
    deferred: deferred.map(item => ({
      ...item,
      action: 'defer',
      reason: `${current_state} state — deferred to prevent thrash`,
    })),
    drain_rate: current_state,
    max_drain_per_cycle: maxDrain,
    total_items: sorted.length,
    reason: `${current_state}: processing ${recommended.length} of ${sorted.length} items`,
  };
}

// ─── Recent Actions Tracking ───────────────────────────────────────────────

/**
 * recordAction(action)
 * 
 * Records an action for throughput tracking.
 * 
 * action = { id, type, severity, timestamp }
 */
function recordAction(action) {
  const store = getStore();
  const now = Date.now();
  
  store.recent_actions.push({
    ...action,
    timestamp: action.timestamp || now,
  });
  
  // Prune old actions (older than 10 minutes)
  const tenMinutesAgo = now - (10 * 60 * 1000);
  store.recent_actions = store.recent_actions.filter(a => a.timestamp > tenMinutesAgo);
  
  saveStore();
  return true;
}

/**
 * getRecentActionCount(sinceMs = 60000)
 */
function getRecentActionCount(sinceMs = 60000) {
  const store = getStore();
  const since = Date.now() - sinceMs;
  return store.recent_actions.filter(a => a.timestamp > since).length;
}

// ─── Recovery Behavior ────────────────────────────────────────────────────

/**
 * getRecoveryRecommendations(workloadState)
 * 
 * Returns recommendations for recovering from SATURATED/ELEVATED state.
 */
function getRecoveryRecommendations(workloadState) {
  const { current_state, metrics, constraints } = workloadState;
  
  if (current_state === WORKLOAD_STATE.NORMAL) {
    return {
      state: WORKLOAD_STATE.NORMAL,
      recommendations: [],
      reason: 'System is in NORMAL state — no recovery needed',
    };
  }
  
  const recommendations = [];
  
  // What to resume first
  if (current_state === WORKLOAD_STATE.SATURATED) {
    recommendations.push({
      priority: 1,
      action: 'resume_stability_goals',
      reason: 'STABILITY goals have highest recovery priority',
    });
    recommendations.push({
      priority: 2,
      action: 'process_critical_deferred',
      reason: 'Process high-priority deferred items',
    });
  }
  
  // How to drain without thrash
  recommendations.push({
    priority: current_state === WORKLOAD_STATE.SATURATED ? 3 : 1,
    action: 'limit_new_goals',
    reason: 'Limit new goal creation until backlog drains',
  });
  
  recommendations.push({
    priority: current_state === WORKLOAD_STATE.SATURATED ? 4 : 2,
    action: 'suppress_low_value_opportunities',
    reason: 'Suppress low-value opportunities until stable',
  });
  
  // What metrics to watch
  recommendations.push({
    priority: 5,
    action: 'monitor_deferred_queue',
    metric: 'deferredQueueSize',
    threshold: THRESHOLDS[current_state].max_deferred_queue,
    reason: 'Watch deferred queue size during recovery',
  });
  
  return {
    state: current_state,
    target_state: WORKLOAD_STATE.NORMAL,
    recommendations,
    estimated_recovery_cycles: _estimateRecoveryCycles(workloadState),
    reason: `Recovering from ${current_state} — ${recommendations.length} recommendations`,
  };
}

function _estimateRecoveryCycles(workloadState) {
  const { metrics } = workloadState;
  
  if (!metrics) return 'unknown';
  
  // Rough estimate based on backlog
  const backlogItems = (metrics.deferredQueueSize || 0) + (metrics.opportunityBacklog || 0);
  
  if (workloadState.current_state === WORKLOAD_STATE.SATURATED) {
    return Math.ceil(backlogItems / 1);  // 1 per cycle
  } else {
    return Math.ceil(backlogItems / 3);  // 3 per cycle
  }
}

// ─── Status ────────────────────────────────────────────────────────────────

/**
 * getWorkloadStatus()
 */
function getWorkloadStatus() {
  const store = getStore();
  
  return {
    current_state: store.current_state,
    previous_state: store.previous_state,
    state_since: store.state_since,
    state_transitions: store.state_transitions,
    last_updated: store.last_updated,
    recent_action_count: store.recent_actions.length,
    metrics_history_count: store.metrics_history.length,
    constraints: _generateConstraints(store.current_state, {}),
  };
}

// ─── Full Governance Cycle ─────────────────────────────────────────────────

/**
 * runWorkloadGovernanceCycle(inputMetrics, context)
 * 
 * Main entry point. Runs full workload governance assessment.
 */
function runWorkloadGovernanceCycle(inputMetrics = {}, context = {}) {
  // 1. Collect metrics
  const metrics = collectWorkloadMetrics(inputMetrics);
  
  // 2. Assess state
  const workloadState = assessWorkloadState(metrics);
  
  // 3. Get governance decision
  const governanceDecision = getWorkloadGovernanceDecision(workloadState, context);
  
  // 4. Get recovery recommendations if not NORMAL
  const recovery = getRecoveryRecommendations(workloadState);
  
  return {
    metrics,
    workloadState,
    governanceDecision,
    recovery,
    status: getWorkloadStatus(),
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Constants
  WORKLOAD_STATE,
  THRESHOLDS,
  
  // Core functions
  collectWorkloadMetrics,
  assessWorkloadState,
  getWorkloadGovernanceDecision,
  getBacklogDrainRecommendations,
  getRecoveryRecommendations,
  runWorkloadGovernanceCycle,
  
  // Tracking
  recordAction,
  getRecentActionCount,
  
  // Status
  getWorkloadStatus,
  resetCaches,
};
