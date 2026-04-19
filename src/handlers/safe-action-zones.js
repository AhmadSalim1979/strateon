/**
 * Safe Action Zones — R8
 * 
 * Defines strictly bounded conditions where limited autonomous execution
 * is safe and beneficial, without compromising control, auditability,
 * or system integrity.
 * 
 * NO EXPANSION OF HIGH-RISK ACTIONS.
 * NO BYPASS OF APPROVAL TOKENS FOR CRITICAL OPERATIONS.
 * 
 * All autonomous actions must be:
 * - reversible or safely repeatable
 * - low-impact
 * - well-defined scope
 * - fully logged with AUTONOMOUS marker
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTION_CLASS = {
  SAFE_AUTONOMOUS: 'SAFE_AUTONOMOUS',   // Can execute without approval under valid conditions
  SUPERVISED: 'SUPERVISED',             // Requires approval (current default)
  RESTRICTED: 'RESTRICTED',              // Never autonomous — always requires approval
};

const ACTION_CATEGORY = {
  // SAFE_AUTONOMOUS candidates (low-risk, reversible)
  READ_ONLY: 'read_only',               // Data retrieval, status checks
  HOUSEKEEPING: 'housekeeping',          // Non-critical cleanup, log rotation
  NOTIFICATION: 'notification',           // Passive alerts, heartbeat updates
  CACHE: 'cache',                        // Cache invalidation, refresh
  METRICS: 'metrics',                    // Counter updates, non-critical stats
  
  // SUPERVISED (default — requires approval)
  MODERATE: 'moderate',                 // Configuration changes, non-critical updates
  
  // RESTRICTED (never autonomous)
  CRITICAL: 'critical',                 // System state changes, deployment
  SECURITY: 'security',                  // Access control, authentication
  DATA: 'data',                         // Data deletion, modification
  EXTERNAL: 'external',                 // External system calls, network ops
};

const SYSTEM_STATUS_REQUIRED = {
  SAFE_AUTONOMOUS: ['HEALTHY'],         // Only when system is HEALTHY
  SUPERVISED: ['HEALTHY', 'DEGRADED'],  // Can proceed in degraded with approval
  RESTRICTED: ['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'CRITICAL'], // Always needs approval
};

// ─── Kill Switch State ─────────────────────────────────────────────────────

let _killSwitchStore = null;
const STORE_PATH = path.join(__dirname, '../../state/kill-switch.json');

function getKillSwitchStore() {
  if (_killSwitchStore) return _killSwitchStore;
  
  if (fs.existsSync(STORE_PATH)) {
    try {
      _killSwitchStore = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (e) {
      _killSwitchStore = _freshKillSwitch();
    }
  } else {
    _killSwitchStore = _freshKillSwitch();
  }
  return _killSwitchStore;
}

function _freshKillSwitch() {
  return {
    global_disable: false,              // Master kill switch
    disabled_at: null,
    disabled_reason: null,
    consecutive_failures: 0,
    failure_threshold: 3,              // Auto-disable after 3 consecutive failures
    last_failure_at: null,
    last_failure_action: null,
    disabled_actions: {},              // Per-action disable flags
    audit_log: [],
  };
}

function saveKillSwitch() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(getKillSwitchStore(), null, 2), 'utf8');
}

/**
 * resetCaches()
 * 
 * Resets in-memory caches. For testing purposes.
 */
function resetCaches() {
  _killSwitchStore = null;
  _frequencyStore = null;
}

// ─── Action Classification Registry ───────────────────────────────────────

/**
 * ACTION_REGISTRY
 * 
 * Defines all classified actions with their requirements.
 * Each action specifies:
 * - category: ACTION_CATEGORY
 * - classification: ACTION_CLASS
 * - safe_conditions: system states where autonomous execution is allowed
 * - frequency_limit: max executions per N milliseconds
 * - scope_limits: constraints on what can be done
 * - failure_threshold: when to disable
 * - idempotent: whether safe to repeat
 * - reversible: whether can be undone
 */
const ACTION_REGISTRY = {
  
  // ── READ_ONLY: SAFE_AUTONOMOUS ──────────────────────────────────────────
  
  'read_health_status': {
    action_id: 'read_health_status',
    category: ACTION_CATEGORY.READ_ONLY,
    classification: ACTION_CLASS.SAFE_AUTONOMOUS,
    description: 'Read current system health status',
    safe_conditions: ['HEALTHY'],
    frequency_limit: { count: 60, window_ms: 60000 },  // 60/min max
    scope_limits: { read_only: true },
    failure_threshold: 5,
    idempotent: true,
    reversible: true,
  },
  
  'read_deferred_queue': {
    action_id: 'read_deferred_queue',
    category: ACTION_CATEGORY.READ_ONLY,
    classification: ACTION_CLASS.SAFE_AUTONOMOUS,
    description: 'Read deferred work queue status',
    safe_conditions: ['HEALTHY'],
    frequency_limit: { count: 30, window_ms: 60000 },
    scope_limits: { read_only: true },
    failure_threshold: 5,
    idempotent: true,
    reversible: true,
  },
  
  'read_pattern_memory': {
    action_id: 'read_pattern_memory',
    category: ACTION_CATEGORY.READ_ONLY,
    classification: ACTION_CLASS.SAFE_AUTONOMOUS,
    description: 'Read pattern memory state',
    safe_conditions: ['HEALTHY'],
    frequency_limit: { count: 30, window_ms: 60000 },
    scope_limits: { read_only: true },
    failure_threshold: 5,
    idempotent: true,
    reversible: true,
  },
  
  // ── HOUSEKEEPING: SAFE_AUTONOMOUS ────────────────────────────────────────
  
  'cleanup_stale_sessions': {
    action_id: 'cleanup_stale_sessions',
    category: ACTION_CATEGORY.HOUSEKEEPING,
    classification: ACTION_CLASS.SUPERVISED,  // RECLASSIFIED: State mutation — requires approval
    description: 'Remove stale session records older than 24h',
    safe_conditions: ['HEALTHY'],
    frequency_limit: { count: 4, window_ms: 3600000 },  // 4/hour max
    scope_limits: { 
      max_age_hours: 24,
      max_count: 100,
      only_stale: true,
    },
    failure_threshold: 3,
    idempotent: true,
    reversible: false,  // Sessions are deleted, not reversible
    revert_action: null,
  },
  
  'rotate_audit_logs': {
    action_id: 'rotate_audit_logs',
    category: ACTION_CATEGORY.HOUSEKEEPING,
    classification: ACTION_CLASS.SUPERVISED,  // RECLASSIFIED: File mutation — requires approval
    description: 'Archive and rotate audit logs older than 7 days',
    safe_conditions: ['HEALTHY'],
    frequency_limit: { count: 2, window_ms: 86400000 },  // 2/day max
    scope_limits: {
      max_age_days: 7,
      preserve_recent: 100,
    },
    failure_threshold: 2,
    idempotent: true,
    reversible: false,
    revert_action: null,
  },
  
  'update_heartbeat': {
    action_id: 'update_heartbeat',
    category: ACTION_CATEGORY.NOTIFICATION,
    classification: ACTION_CLASS.SAFE_AUTONOMOUS,
    description: 'Update own heartbeat to signal liveness',
    safe_conditions: ['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'CRITICAL'],  // Always allowed
    frequency_limit: { count: 1, window_ms: 60000 },  // Once per minute
    scope_limits: { own_heartbeat_only: true },
    failure_threshold: 10,
    idempotent: true,
    reversible: true,
  },
  
  // ── CACHE: SUPERVISED ───────────────────────────────────────────────
  
  'invalidate_cache_pattern': {
    action_id: 'invalidate_cache_pattern',
    category: ACTION_CATEGORY.CACHE,
    classification: ACTION_CLASS.SUPERVISED,  // RECLASSIFIED: Cache mutation — requires approval
    description: 'Invalidate cached pattern data for specific key',
    safe_conditions: ['HEALTHY'],
    frequency_limit: { count: 20, window_ms: 60000 },
    scope_limits: {
      max_keys: 5,
      pattern_only: true,
    },
    failure_threshold: 3,
    idempotent: true,
    reversible: true,
    revert_action: 'restore_cache_pattern',
  },
  
  // ── METRICS: SAFE_AUTONOMOUS ─────────────────────────────────────────────
  
  'increment_metric': {
    action_id: 'increment_metric',
    category: ACTION_CATEGORY.METRICS,
    classification: ACTION_CLASS.SAFE_AUTONOMOUS,
    description: 'Increment a non-critical counter metric',
    safe_conditions: ['HEALTHY', 'DEGRADED'],
    frequency_limit: { count: 100, window_ms: 60000 },
    scope_limits: {
      non_critical_only: true,
      no_security_metrics: true,
    },
    failure_threshold: 5,
    idempotent: true,
    reversible: false,
    revert_action: null,
  },
  
  // ── SUPERVISED (requires approval, default for moderate) ─────────────────
  
  'update_configuration': {
    action_id: 'update_configuration',
    category: ACTION_CATEGORY.MODERATE,
    classification: ACTION_CLASS.SUPERVISED,
    description: 'Update non-critical configuration values',
    safe_conditions: ['HEALTHY', 'DEGRADED'],
    frequency_limit: { count: 10, window_ms: 3600000 },
    scope_limits: {
      non_critical_keys_only: true,
      max_size_kb: 10,
    },
    failure_threshold: 2,
    idempotent: false,
    reversible: true,
    revert_action: 'revert_configuration',
  },
  
  // ── RESTRICTED (never autonomous) ────────────────────────────────────────
  
  'restart_worker': {
    action_id: 'restart_worker',
    category: ACTION_CATEGORY.CRITICAL,
    classification: ACTION_CLASS.RESTRICTED,
    description: 'Restart the worker process',
    safe_conditions: [],
    frequency_limit: { count: 0, window_ms: 0 },  // Never autonomous
    scope_limits: {},
    failure_threshold: 1,
    idempotent: false,
    reversible: false,
    revert_action: null,
  },
  
  'modify_access_control': {
    action_id: 'modify_access_control',
    category: ACTION_CATEGORY.SECURITY,
    classification: ACTION_CLASS.RESTRICTED,
    description: 'Modify access control settings',
    safe_conditions: [],
    frequency_limit: { count: 0, window_ms: 0 },
    scope_limits: {},
    failure_threshold: 1,
    idempotent: false,
    reversible: false,
    revert_action: null,
  },
  
  'delete_data': {
    action_id: 'delete_data',
    category: ACTION_CATEGORY.DATA,
    classification: ACTION_CLASS.RESTRICTED,
    description: 'Delete data records',
    safe_conditions: [],
    frequency_limit: { count: 0, window_ms: 0 },
    scope_limits: {},
    failure_threshold: 1,
    idempotent: false,
    reversible: false,
    revert_action: null,
  },
  
  'execute_external_command': {
    action_id: 'execute_external_command',
    category: ACTION_CATEGORY.EXTERNAL,
    classification: ACTION_CLASS.RESTRICTED,
    description: 'Execute external system command',
    safe_conditions: [],
    frequency_limit: { count: 0, window_ms: 0 },
    scope_limits: {},
    failure_threshold: 1,
    idempotent: false,
    reversible: false,
    revert_action: null,
  },
};

// ─── Frequency Tracker ────────────────────────────────────────────────────

let _frequencyStore = null;
const FREQ_STORE_PATH = path.join(__dirname, '../../state/frequency-track.json');

function getFrequencyStore() {
  if (_frequencyStore) return _frequencyStore;
  
  if (fs.existsSync(FREQ_STORE_PATH)) {
    try {
      _frequencyStore = JSON.parse(fs.readFileSync(FREQ_STORE_PATH, 'utf8'));
    } catch (e) {
      _frequencyStore = { action_counts: {}, last_reset: Date.now() };
    }
  } else {
    _frequencyStore = { action_counts: {}, last_reset: Date.now() };
  }
  return _frequencyStore;
}

function saveFrequencyStore() {
  const dir = path.dirname(FREQ_STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FREQ_STORE_PATH, JSON.stringify(getFrequencyStore(), null, 2), 'utf8');
}

function checkFrequencyLimit(actionId) {
  const action = ACTION_REGISTRY[actionId];
  if (!action) return { allowed: false, reason: 'Action not in registry' };
  
  const { frequency_limit } = action;
  if (!frequency_limit || frequency_limit.count === 0) {
    return { allowed: false, reason: 'Action never allowed autonomously (frequency_limit=0)' };
  }
  
  const store = getFrequencyStore();
  const key = `${actionId}_window`;
  const windowStart = Date.now() - frequency_limit.window_ms;
  
  // Clean old entries
  if (!store.action_counts[actionId]) {
    store.action_counts[actionId] = [];
  }
  
  // Filter to current window
  store.action_counts[actionId] = store.action_counts[actionId].filter(t => t > windowStart);
  
  if (store.action_counts[actionId].length >= frequency_limit.count) {
    return {
      allowed: false,
      reason: `Frequency limit exceeded: ${store.action_counts[actionId].length}/${frequency_limit.count} in ${frequency_limit.window_ms}ms window`,
      current_count: store.action_counts[actionId].length,
      limit: frequency_limit.count,
      window_ms: frequency_limit.window_ms,
    };
  }
  
  return { allowed: true };
}

function recordExecution(actionId) {
  const store = getFrequencyStore();
  if (!store.action_counts[actionId]) {
    store.action_counts[actionId] = [];
  }
  store.action_counts[actionId].push(Date.now());
  saveFrequencyStore();
}

// ─── Kill Switch Functions ─────────────────────────────────────────────────

/**
 * isKillSwitchActive()
 * 
 * Returns true if global kill switch is engaged.
 */
function isKillSwitchActive() {
  return getKillSwitchStore().global_disable;
}

/**
 * isActionDisabled(actionId)
 * 
 * Returns true if specific action is disabled.
 */
function isActionDisabled(actionId) {
  const store = getKillSwitchStore();
  return store.disabled_actions[actionId] === true;
}

/**
 * engageKillSwitch(reason)
 * 
 * Engages the global kill switch. All autonomous execution stops.
 */
function engageKillSwitch(reason) {
  const store = getKillSwitchStore();
  store.global_disable = true;
  store.disabled_at = new Date().toISOString();
  store.disabled_reason = reason;
  
  _logAudit('KILL_SWITCH_ENGAGED', null, { reason }, 'System');
  
  saveKillSwitch();
  return true;
}

/**
 * disengageKillSwitch()
 * 
 * Disengages the global kill switch. Autonomous execution may resume
 * only after explicit operator command.
 */
function disengageKillSwitch() {
  const store = getKillSwitchStore();
  store.global_disable = false;
  store.disabled_at = null;
  store.disabled_reason = null;
  
  _logAudit('KILL_SWITCH_DISENGAGED', null, {}, 'System');
  
  saveKillSwitch();
  return true;
}

/**
 * disableAction(actionId, reason)
 * 
 * Disables a specific action from autonomous execution.
 */
function disableAction(actionId, reason) {
  const store = getKillSwitchStore();
  store.disabled_actions[actionId] = true;
  
  _logAudit('ACTION_DISABLED', actionId, { reason }, 'System');
  
  saveKillSwitch();
  return true;
}

/**
 * enableAction(actionId)
 * 
 * Re-enables a specific action.
 */
function enableAction(actionId) {
  const store = getKillSwitchStore();
  delete store.disabled_actions[actionId];
  
  _logAudit('ACTION_ENABLED', actionId, {}, 'System');
  
  saveKillSwitch();
  return true;
}

/**
 * recordFailure(actionId, error)
 * 
 * Records a failure for an autonomous action.
 * If failures exceed threshold, action is auto-disabled.
 */
function recordFailure(actionId, error = {}) {
  const store = getKillSwitchStore();
  const action = ACTION_REGISTRY[actionId];
  
  store.consecutive_failures++;
  store.last_failure_at = new Date().toISOString();
  store.last_failure_action = actionId;
  
  _logAudit('AUTONOMOUS_FAILURE', actionId, { 
    error: error.message || String(error),
    consecutive_failures: store.consecutive_failures,
  }, 'System');
  
  // Check if we should auto-disable
  if (store.consecutive_failures >= store.failure_threshold) {
    store.disabled_actions[actionId] = true;
    _logAudit('ACTION_AUTO_DISABLED', actionId, {
      reason: `Consecutive failures (${store.consecutive_failures}) exceeded threshold`,
      threshold: store.failure_threshold,
    }, 'System');
  }
  
  saveKillSwitch();
  return store.consecutive_failures >= store.failure_threshold;
}

/**
 * recordSuccess(actionId)
 * 
 * Resets failure counter on successful autonomous execution.
 */
function recordSuccess(actionId) {
  const store = getKillSwitchStore();
  
  if (store.consecutive_failures > 0) {
    store.consecutive_failures = 0;
    _logAudit('FAILURE_COUNT_RESET', null, { reason: 'Successful execution' }, 'System');
    saveKillSwitch();
  }
  
  return true;
}

// ─── Audit Logging ────────────────────────────────────────────────────────

function _logAudit(eventType, actionId, details, triggeredBy = 'System') {
  const store = getKillSwitchStore();
  
  const entry = {
    event_type: eventType,
    action_id: actionId,
    details,
    triggered_by: triggeredBy,
    timestamp: new Date().toISOString(),
  };
  
  store.audit_log.push(entry);
  
  // Keep bounded
  if (store.audit_log.length > 500) {
    store.audit_log = store.audit_log.slice(-500);
  }
  
  saveKillSwitch();
  return entry;
}

/**
 * getAuditLog(filter = {})
 */
function getAuditLog(filter = {}) {
  const store = getKillSwitchStore();
  let log = [...store.audit_log];
  
  if (filter.actionId) {
    log = log.filter(e => e.action_id === filter.actionId);
  }
  if (filter.eventType) {
    log = log.filter(e => e.event_type === filter.eventType);
  }
  if (filter.since) {
    const since = new Date(filter.since).getTime();
    log = log.filter(e => new Date(e.timestamp).getTime() > since);
  }
  
  return log;
}

// ─── Core Classification ─────────────────────────────────────────────────

/**
 * classifyAction(actionId)
 * 
 * Returns the classification for an action.
 */
function classifyAction(actionId) {
  const action = ACTION_REGISTRY[actionId];
  if (!action) {
    return { 
      classification: null, 
      reason: 'Action not in registry',
      requires_approval: true,
    };
  }
  
  return {
    action_id: actionId,
    classification: action.classification,
    category: action.category,
    description: action.description,
    safe_conditions: action.safe_conditions,
    requires_approval: action.classification !== ACTION_CLASS.SAFE_AUTONOMOUS,
  };
}

// ─── Eligibility Check ─────────────────────────────────────────────────────

/**
 * checkEligibility(actionId, systemState, operatorContext = {})
 * 
 * Determines if an action can be executed autonomously.
 * 
 * Returns:
 * {
 *   eligible: boolean,
 *   classification: string,
 *   reason: string,
 *   warnings: string[],
 *   suppressReason?: string,  // If not eligible, why
 * }
 */
function checkEligibility(actionId, systemState = {}, operatorContext = {}) {
  const action = ACTION_REGISTRY[actionId];
  
  // 1. Check if action exists
  if (!action) {
    return {
      eligible: false,
      classification: null,
      reason: 'Action not in registry',
      suppressReason: 'unknown_action',
      warnings: [],
    };
  }
  
  // 2. Check global kill switch
  if (isKillSwitchActive()) {
    return {
      eligible: false,
      classification: action.classification,
      reason: 'Global kill switch is engaged',
      suppressReason: 'kill_switch_engaged',
      warnings: [],
    };
  }
  
  // 3. Check action-specific disable
  if (isActionDisabled(actionId)) {
    return {
      eligible: false,
      classification: action.classification,
      reason: 'Action is disabled',
      suppressReason: 'action_disabled',
      warnings: [],
    };
  }
  
  // 4. RESTRICTED actions are never eligible for autonomous execution
  if (action.classification === ACTION_CLASS.RESTRICTED) {
    return {
      eligible: false,
      classification: action.classification,
      reason: 'Action is RESTRICTED — always requires approval',
      suppressReason: 'restricted_classification',
      warnings: ['RESTRICTED actions cannot execute autonomously under any conditions'],
    };
  }
  
  // 5. SUPERVISED actions always require approval (but are not blocked)
  if (action.classification === ACTION_CLASS.SUPERVISED) {
    return {
      eligible: false,  // Still requires approval
      classification: action.classification,
      reason: 'Action requires approval (SUPERVISED)',
      suppressReason: 'requires_approval',
      warnings: [],
      requires_approval: true,
    };
  }
  
  // 6. Check system status for SAFE_AUTONOMOUS
  const currentStatus = systemState.systemStatus || 'UNKNOWN';
  if (!action.safe_conditions.includes(currentStatus)) {
    return {
      eligible: false,
      classification: action.classification,
      reason: `System status '${currentStatus}' not in safe conditions ${JSON.stringify(action.safe_conditions)}`,
      suppressReason: 'unsafe_system_status',
      warnings: [`Action only safe when system is: ${action.safe_conditions.join(', ')}`],
    };
  }
  
  // 7. Check frequency limits
  const freqCheck = checkFrequencyLimit(actionId);
  if (!freqCheck.allowed) {
    return {
      eligible: false,
      classification: action.classification,
      reason: freqCheck.reason,
      suppressReason: 'frequency_limit_exceeded',
      warnings: [],
    };
  }
  
  // 8. Check operator context
  if (operatorContext.operatorBusy && action.category !== ACTION_CATEGORY.NOTIFICATION) {
    return {
      eligible: false,
      classification: action.classification,
      reason: 'Operator is busy — non-critical actions deferred',
      suppressReason: 'operator_busy',
      warnings: [],
    };
  }
  
  if (operatorContext.quietHoursActive && action.category !== ACTION_CATEGORY.NOTIFICATION) {
    return {
      eligible: false,
      classification: action.classification,
      reason: 'Quiet hours active — non-critical actions deferred',
      suppressReason: 'quiet_hours',
      warnings: [],
    };
  }
  
  // All checks passed — eligible for autonomous execution
  return {
    eligible: true,
    classification: action.classification,
    reason: 'All eligibility checks passed',
    suppressReason: null,
    warnings: _getActionWarnings(action, systemState),
  };
}

function _getActionWarnings(action, systemState) {
  const warnings = [];
  
  // Warn if approaching frequency limit
  const freqCheck = checkFrequencyLimit(action.action_id);
  if (freqCheck.allowed && freqCheck.current_count) {
    const ratio = freqCheck.current_count / freqCheck.limit;
    if (ratio > 0.7) {
      warnings.push(`Approaching frequency limit: ${freqCheck.current_count}/${freqCheck.limit}`);
    }
  }
  
  // Warn if system is HEALTHY but action has limited reversibility
  if (systemState.systemStatus === 'HEALTHY' && !action.reversible && !action.idempotent) {
    warnings.push('Action is not reversible — ensure this is intended');
  }
  
  return warnings;
}

// ─── Execution ────────────────────────────────────────────────────────────

/**
 * executeIfEligible(actionId, systemState, operatorContext = {}, executorFn)
 * 
 * Checks eligibility and executes if eligible.
 * 
 * Returns:
 * {
 *   executed: boolean,
 *   autonomous: boolean,
 *   eligible: boolean,
 *   classification: string,
 *   result: any,
 *   error: string | null,
 *   audit_entry: object,
 * }
 */
function executeIfEligible(actionId, systemState, operatorContext = {}, executorFn) {
  const action = ACTION_REGISTRY[actionId];
  const eligibility = checkEligibility(actionId, systemState, operatorContext);
  
  const executionRecord = {
    action_id: actionId,
    timestamp: new Date().toISOString(),
    system_status: systemState.systemStatus,
    eligibility,
    executed: false,
    autonomous: false,
    result: null,
    error: null,
  };
  
  if (!eligibility.eligible) {
    executionRecord.result = 'NOT_ELIGIBLE';
    executionRecord.error = eligibility.reason;
    executionRecord.suppressReason = eligibility.suppressReason;
    
    _logAudit('EXECUTION_BLOCKED', actionId, {
      reason: eligibility.suppressReason,
      system_status: systemState.systemStatus,
    }, operatorContext.operatorId || 'System');
    
    return executionRecord;
  }
  
  // Eligible — record execution attempt
  try {
    // Execute the action
    const result = executorFn ? executorFn() : null;
    
    executionRecord.executed = true;
    executionRecord.autonomous = true;
    executionRecord.result = result;
    
    // Record frequency
    recordExecution(actionId);
    
    // Record success (reset failure counter)
    recordSuccess(actionId);
    
    _logAudit('AUTONOMOUS_EXECUTION', actionId, {
      system_status: systemState.systemStatus,
      result: result ? String(result).substring(0, 100) : null,
    }, 'AUTONOMOUS');
    
    return executionRecord;
    
  } catch (error) {
    executionRecord.error = error.message || String(error);
    
    // Record failure
    const autoDisabled = recordFailure(actionId, error);
    
    _logAudit('AUTONOMOUS_FAILURE', actionId, {
      error: error.message || String(error),
      auto_disabled: autoDisabled,
    }, 'AUTONOMOUS');
    
    return executionRecord;
  }
}

// ─── Safe Action Simulation ───────────────────────────────────────────────

/**
 * simulateSafeAction(actionId, systemState)
 * 
 * Simulates what would happen if an action were executed.
 * Does NOT execute — only checks eligibility.
 */
function simulateSafeAction(actionId, systemState) {
  const action = ACTION_REGISTRY[actionId];
  const eligibility = checkEligibility(actionId, systemState, {});
  
  return {
    action_id: actionId,
    classification: action?.classification || 'UNKNOWN',
    category: action?.category || 'UNKNOWN',
    description: action?.description || 'Unknown action',
    eligible: eligibility.eligible,
    reason: eligibility.reason,
    suppressReason: eligibility.suppressReason,
    warnings: eligibility.warnings,
    would_execute: eligibility.eligible,
    is_reversible: action?.reversible || false,
    is_idempotent: action?.idempotent || false,
    safe_conditions: action?.safe_conditions || [],
  };
}

// ─── Status Report ────────────────────────────────────────────────────────

/**
 * getAutonomyStatus()
 * 
 * Returns current state of the autonomous execution system.
 */
function getAutonomyStatus() {
  const killSwitch = getKillSwitchStore();
  const freqStore = getFrequencyStore();
  
  const safeActions = Object.entries(ACTION_REGISTRY)
    .filter(([_, a]) => a.classification === ACTION_CLASS.SAFE_AUTONOMOUS)
    .map(([id, a]) => ({
      action_id: id,
      category: a.category,
      safe_conditions: a.safe_conditions,
      is_disabled: killSwitch.disabled_actions[id] === true,
      frequency_status: checkFrequencyLimit(id),
    }));
  
  const restrictedActions = Object.entries(ACTION_REGISTRY)
    .filter(([_, a]) => a.classification === ACTION_CLASS.RESTRICTED)
    .map(([id, a]) => ({
      action_id: id,
      category: a.category,
      description: a.description,
    }));
  
  return {
    kill_switch: {
      global_disable: killSwitch.global_disable,
      disabled_at: killSwitch.disabled_at,
      disabled_reason: killSwitch.disabled_reason,
      consecutive_failures: killSwitch.consecutive_failures,
      failure_threshold: killSwitch.failure_threshold,
      last_failure_at: killSwitch.last_failure_at,
      last_failure_action: killSwitch.last_failure_action,
    },
    safe_actions_count: safeActions.length,
    safe_actions: safeActions,
    restricted_actions_count: restrictedActions.length,
    restricted_actions: restrictedActions,
    recent_audit: killSwitch.audit_log.slice(-10),
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Classification
  classifyAction,
  ACTION_REGISTRY,
  ACTION_CLASS,
  ACTION_CATEGORY,
  
  // Eligibility
  checkEligibility,
  simulateSafeAction,
  
  // Execution
  executeIfEligible,
  
  // Kill switch
  isKillSwitchActive,
  isActionDisabled,
  engageKillSwitch,
  disengageKillSwitch,
  disableAction,
  enableAction,
  recordFailure,
  recordSuccess,
  resetCaches,
  
  // Status
  getAutonomyStatus,
  
  // Audit
  getAuditLog,
};
