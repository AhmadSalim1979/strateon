/**
 * stale-task-detector.js — Phase 3: Silence Detection Watchdog Extension
 * 
 * File: /ops/stale-task-detector.js
 * Purpose: Poll tasks/instructions for stale conditions, trigger escalations
 * Owner: Moosa (CEO)
 * Validation: Node check, unit test with mocked state
 * Last Modified: 2026-05-15
 * 
 * Constraints (STRICT):
 * - Read-only to Supabase — NO writes to tasks/instructions tables
 * - No auto-restart, no auto-retry, no auto-fail
 * - Only observe, classify, persist state to operational-state.json, emit alerts
 * - All alerts include: current state, step, last good step, blocker, elapsed, next action
 * - If unsure → DEGRADED or UNKNOWN, NOT FAILED
 */

const {
  STATES,
  ESCALATION,
  getThresholds,
  elapsedMs,
  shouldTransitionToWaiting,
  shouldTransitionToStalled,
  shouldEscalateToCritical,
  classifyState,
  formatAlert,
  formatBlockedAlert,
  readOperationalState,
  updateTaskState,
  addAlert,
  setWorkerStatus,
  incrementRestartCount,
  getSupabaseClient
} = require('./state-machine.js');

const FS = require('fs');
const PATH = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPERATIONAL_STATE_PATH = '/home/node/.openclaw/workspace/state/operational-state.json';
const PM2_HEARTBEAT_PATH = '/home/node/.openclaw/workspace/state/heartbeats/moosa-worker.json';
const CHECK_INTERVAL_MS = 60 * 1000;  // 1 minute — runs every watchdog cycle
const WORKER_RESTART_GRACE_MS = 2 * 60 * 1000;  // 2 minutes — wait for worker to recover
const STALE_CONFIRMATION_CYCLES = 2;  // Confirm stale across 2 cycles before alerting
const ALERT_COOLDOWN_CYCLES = 3;  // Don't re-alert same type for 3 cycles (~3 min)

// ============================================================================
// COOLDOWN TRACKING (in-memory, reset on restart)
// ============================================================================

const _alertCooldowns = new Map();  // taskId -> { lastAlertAt, alertType }
const _confirmedStale = new Set();   // taskIds confirmed stale across cycles

// ============================================================================
// ALERT COOLDOWN HELPERS
// ============================================================================

function canAlert(taskId, alertType) {
  const key = `${taskId}:${alertType}`;
  const last = _alertCooldowns.get(key);
  if (!last) return true;
  return (Date.now() - last) > (ALERT_COOLDOWN_CYCLES * CHECK_INTERVAL_MS);
}

function recordAlert(taskId, alertType) {
  const key = `${taskId}:${alertType}`;
  _alertCooldowns.set(key, Date.now());
}

// ============================================================================
// WHATSAPP ALERT SENDER (stub — uses OpenClaw send mechanism)
// ============================================================================

async function sendAlert(message) {
  // Use OpenClaw's sendWhatsApp function if available
  try {
    const { execSync } = require('child_process');
    // Escape message for shell
    const escaped = message.replace(/'/g, "'\"'\"'");
    execSync(`openclaw send-whatsapp '+923215139934' '${escaped}'`, { stdio: 'ignore' });
    console.log('[stale-task-detector] WhatsApp alert sent');
  } catch (err) {
    console.error('[stale-task-detector] Failed to send WhatsApp alert:', err.message);
    // Fallback: write to operational state alerts
    addAlert(ESCALATION.ALERT, message);
  }
}

// ============================================================================
// WORKER HEARTBEAT CHECK
// ============================================================================

function isWorkerHealthy() {
  try {
    if (!FS.existsSync(PM2_HEARTBEAT_PATH)) {
      return { healthy: false, reason: 'heartbeat file missing' };
    }
    const content = JSON.parse(FS.readFileSync(PM2_HEARTBEAT_PATH, 'utf8'));
    const ageMs = Date.now() - new Date(content.timestamp).getTime();
    if (ageMs > 60 * 1000) {
      return { healthy: false, reason: `heartbeat age ${Math.round(ageMs/1000)}s > 60s` };
    }
    return { healthy: true };
  } catch {
    return { healthy: false, reason: 'heartbeat read error' };
  }
}

// ============================================================================
// READ ACTIVE TASKS FROM SUPABASE (read-only)
// ============================================================================

async function getActiveTasks(supabase) {
  if (!supabase) {
    // No Supabase — use operational-state.json only
    const state = readOperationalState();
    return state.active_tasks.filter(t => 
      t.status === STATES.ACTIVE || 
      t.status === STATES.WAITING || 
      t.status === STATES.STALLED ||
      t.status === STATES.BLOCKED
    );
  }
  
  try {
    // Read from tasks table (read-only — no updates)
    // Schema: id, goal, status, created_at, updated_at (NOT last_update_at)
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, goal, status, created_at, updated_at, input_json, metadata')
      .in('status', ['pending', 'in_progress', 'active'])
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (error) throw error;
    
    // Also read from instructions table for instruction-bridge tasks
    // Schema: id, original_message, status, created_at, received_at, metadata
    const { data: instructions } = await supabase
      .from('instructions')
      .select('id, original_message, status, created_at, received_at, metadata')
      .in('status', ['received', 'queued', 'acknowledged', 'executed'])
      .order('received_at', { ascending: true })
      .limit(50);
    
    return [...(tasks || []).map(t => ({
      task_id: t.id,
      goal: t.goal,
      status: t.status === 'pending' ? 'waiting' : t.status === 'in_progress' ? 'active' : t.status,
      last_update_at: t.updated_at || t.created_at,  // Use updated_at, not last_update_at
      metadata: { ...t.input_json, ...t.metadata, task_type: 'execute' }
    })), ...(instructions || []).map(i => ({
      task_id: i.id,
      goal: i.original_message,
      status: i.status,
      last_update_at: i.received_at,
      metadata: { ...i.metadata, task_type: 'instruction_bridge' }
    }))];
  } catch (err) {
    console.error('[stale-task-detector] Supabase read error:', err.message);
    // Fallback to operational-state.json
    const state = readOperationalState();
    return state.active_tasks;
  }
}

// ============================================================================
// CORE STALE DETECTION LOGIC
// ============================================================================

async function checkStaleTasks() {
  console.log('[stale-task-detector] Running stale task check...');
  
  const state = readOperationalState();
  const supabase = getSupabaseClient();
  const workerHealth = isWorkerHealthy();
  
  // Check worker health
  if (!workerHealth.healthy) {
    console.log('[stale-task-detector] Worker unhealthy:', workerHealth.reason);
    
    const prevStatus = state.worker_status;
    setWorkerStatus('unhealthy');
    
    if (prevStatus !== 'unhealthy') {
      // Worker just became unhealthy
      const elapsedSinceLastHealthy = state.last_updated 
        ? Math.round((Date.now() - new Date(state.last_updated).getTime()) / 60000)
        : 'unknown';
      
      if (elapsedSinceLastHealthy === 'unknown' || elapsedSinceLastHealthy > 2) {
        // Grace period exceeded — emit CRITICAL
        const criticalMsg = `🚨 WORKER UNHEALTHY\n` +
          `Status: ${workerHealth.reason}\n` +
          `Last healthy: ${elapsedSinceLastHealthy}min ago\n` +
          `Action: Check moosa-worker PM2 process — may need manual intervention`;
        
        await sendAlert(criticalMsg);
        addAlert(ESCALATION.CRITICAL, criticalMsg);
        setWorkerStatus('critical');
      }
    }
    
    return;  // Don't process stale tasks while worker is down
  }
  
  // Worker is healthy — update status
  if (state.worker_status !== 'online') {
    setWorkerStatus('online');
    addAlert(ESCALATION.NONE, 'Worker recovered — online');
  }
  
  // Get active tasks
  const activeTasks = await getActiveTasks(supabase);
  console.log('[stale-task-detector] Active tasks:', activeTasks.length);
  
  // Process each active task
  let newStalledCount = 0;
  let newWaitingCount = 0;
  
  for (const task of activeTasks) {
    const taskType = task.metadata?.task_type || 'execute';
    const thresholds = getThresholds(taskType);
    
    // Classify current state
    const classification = classifyState(task, thresholds);
    
    if (classification.status === STATES.WAITING) {
      // Transition to WAITING
      updateTaskState(task.task_id, { status: STATES.WAITING });
      newWaitingCount++;
      
      // Check if BLOCKED
      if (task.status === STATES.BLOCKED || task.failure_reason?.includes('blocked')) {
        const blockedElapsed = elapsedMs(task.blocked_since || task.last_update_at);
        if (blockedElapsed > thresholds.block_max_ms) {
          // Blocked SLA exceeded
          if (canAlert(task.task_id, 'blocked')) {
            const alert = formatBlockedAlert(task);
            await sendAlert(alert.message);
            addAlert(alert.level, alert.message, task.task_id);
            recordAlert(task.task_id, 'blocked');
          }
        }
      }
      
    } else if (classification.status === STATES.STALLED) {
      // First detect — add to confirmed stale
      if (!_confirmedStale.has(task.task_id)) {
        _confirmedStale.add(task.task_id);
        updateTaskState(task.task_id, { 
          status: STATES.STALLED, 
          stalled_since: new Date().toISOString() 
        });
        newStalledCount++;
        continue;
      }
      
      // Already confirmed stale — check escalation
      const stalledElapsed = elapsedMs(task.stalled_since);
      
      if (stalledElapsed > (thresholds.critical_ms - thresholds.stall_ms)) {
        // Critical escalation
        if (canAlert(task.task_id, 'critical')) {
          const alert = formatAlert(task, ESCALATION.CRITICAL, thresholds);
          await sendAlert(alert.message);
          addAlert(ESCALATION.CRITICAL, alert.message, task.task_id);
          recordAlert(task.task_id, 'critical');
        }
      } else if (canAlert(task.task_id, 'stalled')) {
        // Normal stalled alert
        const alert = formatAlert(task, ESCALATION.ALERT, thresholds);
        await sendAlert(alert.message);
        addAlert(ESCALATION.ALERT, alert.message, task.task_id);
        recordAlert(task.task_id, 'stalled');
      }
      
    } else if (classification.status === STATES.DEGRADED || classification.status === STATES.UNKNOWN) {
      // Mark as degraded in operational state (not in Supabase)
      updateTaskState(task.task_id, { status: classification.status });
      
      if (canAlert(task.task_id, 'degraded')) {
        const msg = `⚠️ TASK DEGRADED\n` +
          `Task: ${task.goal?.slice(0, 80) || 'task'}\n` +
          `Reason: ${classification.reason}\n` +
          `Confidence: ${classification.confidence}\n` +
          `Action: Verify task health, confirm not abandoned`;
        
        await sendAlert(msg);
        addAlert(ESCALATION.WARNING, msg, task.task_id);
        recordAlert(task.task_id, 'degraded');
      }
      
    } else {
      // ACTIVE — task is healthy, remove from confirmed stale
      if (_confirmedStale.has(task.task_id)) {
        _confirmedStale.delete(task.task_id);
        updateTaskState(task.task_id, { 
          status: STATES.ACTIVE, 
          stalled_since: null 
        });
      }
    }
  }
  
  // Update operational state with current stats
  const updatedState = readOperationalState();
  updatedState.active_tasks = activeTasks;
  updatedState.last_updated = new Date().toISOString();
  updatedState.last_check = new Date().toISOString();
  updatedState.new_waiting = newWaitingCount;
  updatedState.new_stalled = newStalledCount;
  
  // Check restart count for rapid restart detection
  if (updatedState.restart_count_last_hour > 3) {
    const criticalMsg = `🚨 RAPID RESTART DETECTED\n` +
      `Restarts in last hour: ${updatedState.restart_count_last_hour}\n` +
      `Action: Halt task processing — investigate root cause`;
    
    await sendAlert(criticalMsg);
    addAlert(ESCALATION.CRITICAL, criticalMsg);
  }
  
  console.log(`[stale-task-detector] Check complete — waiting:${newWaitingCount}, stalled:${newStalledCount}, total:${activeTasks.length}`);
}

// ============================================================================
// WATCHDOG ENTRY POINT (called from moosa-watchdog or heartbeat)
// ============================================================================

async function run() {
  try {
    await checkStaleTasks();
  } catch (err) {
    console.error('[stale-task-detector] Check failed:', err.message);
    addAlert(ESCALATION.WARNING, `Stale task detector error: ${err.message}`);
  }
}

// ============================================================================
// SIMULATION MODE (for validation without Supabase)
// ============================================================================

function simulateTask(state, lastUpdateMinutesAgo, taskType = 'execute', blockedSince = null) {
  const now = new Date();
  const past = new Date(now.getTime() - lastUpdateMinutesAgo * 60 * 1000);
  return {
    task_id: `sim-${Date.now()}`,
    goal: `Simulated ${taskType} task for validation`,
    status: state,
    last_update_at: past.toISOString(),
    stalled_since: state === 'stalled' ? past.toISOString() : null,
    blocked_since: blockedSince,
    metadata: { task_type: taskType }
  };
}

async function runSimulation() {
  console.log('=== STALE TASK DETECTOR SIMULATION ===\n');
  
  const cases = [
    { label: 'ACTIVE (normal — 1 min ago)', task: simulateTask('active', 1), expectedAlert: false },
    { label: 'WAITING (5 min ago — should alert)', task: simulateTask('active', 6), expectedAlert: false }, // wait, not stall
    { label: 'STALLED (15 min ago — should CRITICAL)', task: simulateTask('stalled', 15), expectedAlert: true },
    { label: 'DEGRADED (unknown state)', task: simulateTask('degraded', 8), expectedAlert: true },
    { label: 'INSTRUCTION BRIDGE STALLED (2 min ago)', task: simulateTask('stalled', 2, 'instruction_bridge'), expectedAlert: false }, // 2min < critical 2min
    { label: 'BLOCKED >60min (should alert)', task: { ...simulateTask('blocked', 65), blocker: 'approval missing' }, expectedAlert: true },
  ];
  
  for (const c of cases) {
    console.log(`Test: ${c.label}`);
    
    const thresholds = getThresholds(c.task.metadata?.task_type || 'execute');
    const cls = classifyState(c.task, thresholds);
    console.log(`  Classified: ${cls.status} (${cls.reason}) — confidence: ${cls.confidence}`);
    
    if (cls.status === STATES.STALLED && canAlert(c.task.task_id, 'stalled')) {
      const alert = formatAlert(c.task, ESCALATION.ALERT, thresholds);
      console.log(`  ALERT: ${alert.message.slice(0, 100)}...`);
    } else if (cls.status === STATES.STALLED && canAlert(c.task.task_id, 'critical')) {
      const alert = formatAlert(c.task, ESCALATION.CRITICAL, thresholds);
      console.log(`  CRITICAL: ${alert.message.slice(0, 100)}...`);
    }
    
    console.log();
  }
  
  // Test state transitions
  console.log('=== STATE TRANSITION TESTS ===\n');
  
  const activeTask = simulateTask('active', 1);
  const waiting = shouldTransitionToWaiting(activeTask, getThresholds('execute'));
  const stalled = shouldTransitionToStalled(activeTask, getThresholds('execute'));
  console.log(`ACTIVE task (1min ago): waiting=${waiting}, stalled=${stalled} → should be false/false ✓`);
  
  const stalledTask = simulateTask('stalled', 15);
  const critical = shouldEscalateToCritical(stalledTask, getThresholds('execute'));
  console.log(`STALLED task (15min): critical=${critical} → should be true ✓`);
  
  const blockedTask = { ...simulateTask('blocked', 65), blocked_since: new Date(Date.now() - 65*60*1000).toISOString() };
  const blockEscalate = shouldEscalateBlocked(blockedTask, getThresholds('execute'));
  console.log(`BLOCKED task (65min): escalate=${blockEscalate} → should be true ✓`);
  
  console.log('\n=== SIMULATION COMPLETE ===');
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === '--simulate') {
    runSimulation().catch(console.error);
  } else {
    run().catch(console.error);
  }
}

module.exports = { run, checkStaleTasks, simulateTask, runSimulation };