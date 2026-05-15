/**
 * state-machine.js — Phase 3: Silence Detection + Operational Continuity
 * 
 * File: /ops/state-machine.js
 * Purpose: Execution state definitions, transition logic, staleness rules
 * Owner: Moosa (CEO)
 * Validation: Import and call functions, verify state transitions
 * Last Modified: 2026-05-15
 * 
 * Constraints:
 * - Read-only to Supabase (no writes to tasks/instructions tables)
 * - No auto-restart, no auto-retry, no auto-fail
 * - Only observe, classify, persist state, and alert
 * - If unsure → DEGRADED or UNKNOWN, not FAILED
 */

const { createClient } = require('/home/node/.openclaw/workspace/orchestration/node_modules/@supabase/supabase-js');

// ============================================================================
// STATE DEFINITIONS
// ============================================================================

const STATES = {
  ACTIVE: 'active',           // Task being worked — last step confirmed < threshold
  WAITING: 'waiting',         // Task waiting for external input (API, human, event)
  BLOCKED: 'blocked',        // Task cannot proceed — missing approval/credential/info
  STALLED: 'stalled',         // Task exceeded expected duration — silent > threshold
  DEGRADED: 'degraded',       // Task running but producing degraded/uncertain results
  UNKNOWN: 'unknown',         // Cannot determine state — unclear or ambiguous
  COMPLETED: 'completed',     // Task finished successfully — terminal
  FAILED: 'failed'            // Task abandoned or errored — terminal (only as last resort)
};

const ESCALATION = {
  NONE: 0,      // Normal — no alert
  WARNING: 1,   // Watchdog tracks, no user alert yet
  ALERT: 2,    // WhatsApp alert to Ahmad
  CRITICAL: 3  // Immediate WhatsApp + priority flag to Ahmad
};

// ============================================================================
// TASK-TYPE-AWARE THRESHOLDS (milliseconds)
// ============================================================================

const THRESHOLDS = {
  execute: {
    active_max_ms:  5 * 60 * 1000,   // 5 min — no update → WAITING
    stall_ms:      10 * 60 * 1000,   // 10 min — no update → STALLED alert
    critical_ms:   15 * 60 * 1000,   // 15 min — STALLED → CRITICAL
    wait_max_ms:   30 * 60 * 1000,   // 30 min waiting → STALLED
    block_max_ms:  60 * 60 * 1000,   // 60 min blocked → escalate
    degraded_ms:   15 * 60 * 1000    // 15 min degraded → STALLED
  },
  review: {
    active_max_ms:  15 * 60 * 1000,   // 15 min — longer for analysis tasks
    stall_ms:      30 * 60 * 1000,
    critical_ms:   45 * 60 * 1000,
    wait_max_ms:   60 * 60 * 1000,
    block_max_ms:  60 * 60 * 1000,
    degraded_ms:   30 * 60 * 1000
  },
  inform: {
    active_max_ms:  2 * 60 * 1000,   // 2 min — informational tasks should be fast
    stall_ms:       5 * 60 * 1000,
    critical_ms:   10 * 60 * 1000,
    wait_max_ms:   10 * 60 * 1000,
    block_max_ms:  30 * 60 * 1000,
    degraded_ms:   5 * 60 * 1000
  },
  instruction_bridge: {
    active_max_ms:  30 * 1000,       // 30 sec — bridge should be fast
    stall_ms:       60 * 1000,
    critical_ms:    120 * 1000,
    wait_max_ms:    60 * 1000,
    block_max_ms:   60 * 1000,
    degraded_ms:    60 * 1000
  },
  default: {
    active_max_ms:  5 * 60 * 1000,
    stall_ms:      10 * 60 * 1000,
    critical_ms:   15 * 60 * 1000,
    wait_max_ms:   30 * 60 * 1000,
    block_max_ms:  60 * 60 * 1000,
    degraded_ms:   15 * 60 * 1000
  }
};

// ============================================================================
// HELPERS
// ============================================================================

function getThresholds(taskType) {
  return THRESHOLDS[taskType] || THRESHOLDS.default;
}

function elapsedMs(timestamp) {
  if (!timestamp) return Infinity;
  return Date.now() - new Date(timestamp).getTime();
}

function shouldTransitionToWaiting(task, thresholds) {
  return elapsedMs(task.last_update_at) > thresholds.active_max_ms;
}

function shouldTransitionToStalled(task, thresholds) {
  return elapsedMs(task.last_update_at) > thresholds.stall_ms;
}

function shouldEscalateToCritical(task, thresholds) {
  if (task.status !== STATES.STALLED) return false;
  return elapsedMs(task.stalled_since) > (thresholds.critical_ms - thresholds.stall_ms);
}

function shouldEscalateBlocked(task, thresholds) {
  if (task.status !== STATES.BLOCKED) return false;
  return elapsedMs(task.blocked_since) > thresholds.block_max_ms;
}

// ============================================================================
// STATE VALIDATION
// ============================================================================

/**
 * Classify current state from task data
 * Returns: { status, reason, confidence }
 * 
 * If unsure → DEGRADED or UNKNOWN, NOT FAILED
 */
function classifyState(task, thresholds) {
  const elapsed = elapsedMs(task.last_update_at);
  
  // If explicitly marked blocked in Supabase
  if (task.status === 'blocked' || task.failure_reason?.includes('blocked')) {
    return { status: STATES.BLOCKED, reason: 'explicit block reason', confidence: 'high' };
  }
  
  // If waiting for external input (API, human, event)
  if (task.metadata?.waiting_for) {
    return { status: STATES.WAITING, reason: `waiting for ${task.metadata.waiting_for}`, confidence: 'high' };
  }
  
  // If elapsed exceeds stall threshold
  if (elapsed > thresholds.stall_ms) {
    return { status: STATES.STALLED, reason: `silent for ${Math.round(elapsed/60000)}min`, confidence: 'high' };
  }
  
  // If elapsed exceeds active max but not stall yet
  if (elapsed > thresholds.active_max_ms) {
    return { status: STATES.WAITING, reason: `no update for ${Math.round(elapsed/60000)}min`, confidence: 'medium' };
  }
  
  // If task has error in recent output but still responding
  if (task.metadata?.has_error && elapsed < thresholds.stall_ms) {
    return { status: STATES.DEGRADED, reason: 'task has errors but is still responding', confidence: 'medium' };
  }
  
  // Normal active
  return { status: STATES.ACTIVE, reason: 'normal', confidence: 'high' };
}

// ============================================================================
// ALERT FORMATTING
// ============================================================================

function formatAlert(task, level, thresholds) {
  const elapsed = Math.round(elapsedMs(task.last_update_at) / 60000);
  const currentStep = task.metadata?.current_step || task.goal?.slice(0, 100) || 'unknown';
  const lastSuccessful = task.metadata?.last_successful_step || 'none';
  const blocker = task.blocker || task.failure_reason || 'unknown';
  const nextUpdate = task.metadata?.next_expected_update 
    ? `${task.metadata.next_expected_update}` 
    : `within ${Math.round(thresholds.active_max_ms / 60000)}min`;
  
  const prefix = level === ESCALATION.CRITICAL ? '🚨' : '⚠️';
  const levelLabel = level === ESCALATION.CRITICAL ? 'STALLED — CRITICAL' : 'TASK STALLED';
  
  return {
    level,
    message: `${prefix} ${levelLabel}\n` +
      `Task: ${task.goal?.slice(0, 80) || 'task'}\n` +
      `Step: ${currentStep}\n` +
      `Last good: ${lastSuccessful}\n` +
      `Blocker: ${blocker}\n` +
      `Elapsed: ${elapsed}min\n` +
      `Next update: ${nextUpdate}\n` +
      `Action: ${level === ESCALATION.CRITICAL ? 'IMMEDIATE — may be abandoned' : 'Resume or confirm'}`
  };
}

function formatBlockedAlert(task) {
  const elapsed = Math.round(elapsedMs(task.blocked_since || task.last_update_at) / 60000);
  return {
    level: ESCALATION.ALERT,
    message: `⚠️ TASK BLOCKED\n` +
      `Task: ${task.goal?.slice(0, 80) || 'task'}\n` +
      `Blocker: ${task.blocker || task.failure_reason || 'approval or info required'}\n` +
      `Elapsed: ${elapsed}min\n` +
      `Action: Resolve blocker or confirm abandonment`
  };
}

// ============================================================================
// STATE PERSISTENCE (operational-state.json)
// ============================================================================

const FS = require('fs');
const PATH = require('path');
const OPERATIONAL_STATE_PATH = '/home/node/.openclaw/workspace/state/operational-state.json';

function ensureDirectory() {
  const dir = PATH.dirname(OPERATIONAL_STATE_PATH);
  if (!FS.existsSync(dir)) {
    FS.mkdirSync(dir, { recursive: true });
  }
}

function readOperationalState() {
  try {
    if (!FS.existsSync(OPERATIONAL_STATE_PATH)) {
      return { version: 1, last_updated: null, worker_status: 'unknown', active_tasks: [], recent_alerts: [], restart_count_last_hour: 0 };
    }
    return JSON.parse(FS.readFileSync(OPERATIONAL_STATE_PATH, 'utf8'));
  } catch {
    return { version: 1, last_updated: null, worker_status: 'unknown', active_tasks: [], recent_alerts: [], restart_count_last_hour: 0 };
  }
}

function writeOperationalState(state) {
  ensureDirectory();
  const tempPath = OPERATIONAL_STATE_PATH + '.tmp';
  FS.writeFileSync(tempPath, JSON.stringify(state, null, 2));
  FS.renameSync(tempPath, OPERATIONAL_STATE_PATH);  // atomic
}

function updateTaskState(taskId, updates) {
  const state = readOperationalState();
  const idx = state.active_tasks.findIndex(t => t.task_id === taskId);
  if (idx >= 0) {
    state.active_tasks[idx] = { ...state.active_tasks[idx], ...updates, last_update_at: new Date().toISOString() };
  } else {
    state.active_tasks.push({
      task_id: taskId,
      status: 'active',
      current_step: null,
      last_successful_step: null,
      blocker: null,
      stalled_since: null,
      last_update_at: new Date().toISOString(),
      ...updates
    });
  }
  state.last_updated = new Date().toISOString();
  writeOperationalState(state);
}

function addAlert(level, message, taskId = null) {
  const state = readOperationalState();
  state.recent_alerts = state.recent_alerts || [];
  state.recent_alerts.push({ level, message, task_id: taskId, at: new Date().toISOString() });
  // Keep last 50 alerts
  if (state.recent_alerts.length > 50) {
    state.recent_alerts = state.recent_alerts.slice(-50);
  }
  state.last_updated = new Date().toISOString();
  writeOperationalState(state);
}

function setWorkerStatus(status) {
  const state = readOperationalState();
  state.worker_status = status;
  state.last_updated = new Date().toISOString();
  writeOperationalState(state);
}

function incrementRestartCount() {
  const state = readOperationalState();
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  // Reset if last restart was >1 hour ago
  if (state.last_restart_increment && new Date(state.last_restart_increment).getTime() < oneHourAgo) {
    state.restart_count_last_hour = 0;
  }
  state.restart_count_last_hour = (state.restart_count_last_hour || 0) + 1;
  state.last_restart_increment = new Date().toISOString();
  state.last_updated = new Date().toISOString();
  writeOperationalState(state);
}

// ============================================================================
// SUPABASE READ-ONLY CLIENT
// ============================================================================

let _supabase = null;

function getSupabaseClient() {
  if (!_supabase) {
    const { url, key } = getSupabaseCredentials();
    if (!url || !key) {
      console.log('[state-machine] Supabase credentials not found — running in observation-only mode');
      return null;
    }
    _supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return _supabase;
}

function getSupabaseCredentials() {
  try {
    const envContent = FS.readFileSync('/root/.openclaw/.env.supabase', 'utf8');
    const get = (key) => {
      for (const line of envContent.split('\n')) {
        const [k, ...v] = line.split('=');
        if (k === key) return v.join('=').trim();
      }
      return null;
    };
    return { url: get('SUPABASE_URL'), key: get('SUPABASE_SERVICE_KEY') };
  } catch {
    return { url: null, key: null };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  STATES,
  ESCALATION,
  THRESHOLDS,
  
  getThresholds,
  elapsedMs,
  shouldTransitionToWaiting,
  shouldTransitionToStalled,
  shouldEscalateToCritical,
  shouldEscalateBlocked,
  
  classifyState,
  formatAlert,
  formatBlockedAlert,
  
  readOperationalState,
  writeOperationalState,
  updateTaskState,
  addAlert,
  setWorkerStatus,
  incrementRestartCount,
  
  getSupabaseClient
};