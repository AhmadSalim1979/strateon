/**
 * Self-Awareness & Reliability Integrity — R7
 * 
 * Ensures MOOSA can accurately understand, represent, and report
 * its own internal state over time.
 * 
 * Verifies:
 * 1. Reported state matches actual runtime state
 * 2. Reports use live data, not stale assumptions
 * 3. Modules don't contradict each other
 * 4. Silent degradation is detected (parts stopping to update)
 * 
 * NO AUTONOMOUS CORRECTION. Discrepancies are surfaced, not auto-fixed.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '../../state');
const HEARTBEAT_DIR = path.join(STATE_DIR, 'heartbeats');

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LEVEL = {
  HEALTHY: 0,
  DEGRADED: 1,
  UNHEALTHY: 2,
  CRITICAL: 3,
};

const VERIFICATION_STATUS = {
  VERIFIED: 'verified',
  STALE: 'stale',
  MISMATCH: 'mismatch',
  UNREACHABLE: 'unreachable',
  UNKNOWN: 'unknown',
};

const STALE_THRESHOLDS = {
  heartbeat_ms: 3 * 60 * 1000,       // 3 minutes — component heartbeat
  self_check_ms: 10 * 60 * 1000,       // 10 minutes — self-check result
  decision_cycle_ms: 15 * 60 * 1000,   // 15 minutes — decision cycle
  critical_ms: 5 * 60 * 1000,          // 5 minutes — critical system
};

// ─── State ───────────────────────────────────────────────────────────────────

let _verificationStore = null;
const STORE_PATH = path.join(STATE_DIR, 'self-awareness-store.json');

function getStore() {
  if (_verificationStore) return _verificationStore;
  
  if (fs.existsSync(STORE_PATH)) {
    try {
      _verificationStore = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (e) {
      _verificationStore = _freshStore();
    }
  } else {
    _verificationStore = _freshStore();
  }
  return _verificationStore;
}

function _freshStore() {
  return {
    verifications: [],
    discrepancies: [],
    last_full_verification_at: null,
    last_verification_cycle: 0,
    consecutive_failures: 0,
    history: [],
  };
}

function saveStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(getStore(), null, 2), 'utf8');
}

/**
 * resetStore()
 * 
 * Resets the verification store. Used for clean test runs.
 */
function resetStore() {
  _verificationStore = _freshStore();
  saveStore();
}

// ─── Heartbeat Management ───────────────────────────────────────────────────

/**
 * writeHeartbeat(component, data)
 * 
 * Writes a heartbeat for a component. Used by monitored components
 * to signal they're alive and report their state.
 */
function writeHeartbeat(component, data = {}) {
  if (!fs.existsSync(HEARTBEAT_DIR)) {
    fs.mkdirSync(HEARTBEAT_DIR, { recursive: true });
  }
  
  const hbPath = path.join(HEARTBEAT_DIR, `${component}.json`);
  const heartbeat = {
    component,
    last_run_at: new Date().toISOString(),
    pid: process.pid,
    ...data,
  };
  
  fs.writeFileSync(hbPath, JSON.stringify(heartbeat, null, 2), 'utf8');
  return heartbeat;
}

/**
 * readHeartbeat(component)
 * 
 * Reads a heartbeat for a component. Returns null if missing.
 */
function readHeartbeat(component) {
  const hbPath = path.join(HEARTBEAT_DIR, `${component}.json`);
  
  if (!fs.existsSync(hbPath)) {
    return null;
  }
  
  try {
    return JSON.parse(fs.readFileSync(hbPath, 'utf8'));
  } catch (e) {
    return null;
  }
}

/**
 * getHeartbeatAge(component)
 * 
 * Returns age of heartbeat in milliseconds. Returns null if missing.
 */
function getHeartbeatAge(component) {
  const hb = readHeartbeat(component);
  if (!hb || !hb.last_run_at) return null;
  
  return Date.now() - new Date(hb.last_run_at).getTime();
}

/**
 * isHeartbeatStale(component, thresholdMs)
 * 
 * Returns true if heartbeat is older than threshold.
 */
function isHeartbeatStale(component, thresholdMs) {
  const age = getHeartbeatAge(component);
  if (age === null) return true; // Missing = stale
  return age > thresholdMs;
}

// ─── Source-of-Truth Registry ───────────────────────────────────────────────

/**
 * Component definitions with their verification requirements.
 * Each component:
 * - writesheartbeat: path it writes to
 * - readState: function to read current state
 * - thresholdMs: staleness threshold
 */
const COMPONENT_REGISTRY = {
  worker: {
    name: 'Worker Process',
    heartbeatFile: 'worker.json',
    readState: () => {
      const hb = readHeartbeat('worker');
      return {
        status: hb?.status || null,
        health_score: hb?.health_score || null,
        cycle_count: hb?.cycle_count || 0,
        pid: hb?.pid || null,
        last_cycle_at: hb?.last_run_at || null,
      };
    },
    thresholdMs: STALE_THRESHOLDS.self_check_ms,
  },
  'self-check': {
    name: 'Self-Check',
    heartbeatFile: 'self-check.json',
    readState: () => {
      const hb = readHeartbeat('self-check');
      return {
        status: hb?.status || null,
        last_run_at: hb?.last_run_at || null,
        alert_sent: hb?.alert_sent || false,
      };
    },
    thresholdMs: STALE_THRESHOLDS.self_check_ms,
  },
  'thinking-loop': {
    name: 'Thinking Loop',
    heartbeatFile: 'thinking-loop.json',
    readState: () => {
      const hb = readHeartbeat('thinking-loop');
      return {
        status: hb?.status || null,
        last_run_at: hb?.last_run_at || null,
        last_decision: hb?.last_decision || null,
        guard_blocked: hb?.guard_blocked || false,
      };
    },
    thresholdMs: STALE_THRESHOLDS.heartbeat_ms,
  },
  'decision-cycle': {
    name: 'Decision Cycle',
    heartbeatFile: 'decision-cycle.json',
    readState: () => {
      const hb = readHeartbeat('decision-cycle');
      return {
        status: hb?.status || null,
        last_cycle_at: hb?.last_run_at || null,
        active_issues: hb?.active_issues || [],
      };
    },
    thresholdMs: STALE_THRESHOLDS.decision_cycle_ms,
  },
};

// ─── Core Verification ─────────────────────────────────────────────────────

/**
 * verifyComponent(componentName)
 * 
 * Verifies a single component's heartbeat and state.
 */
function verifyComponent(componentName) {
  const component = COMPONENT_REGISTRY[componentName];
  if (!component) {
    return {
      component: componentName,
      status: VERIFICATION_STATUS.UNKNOWN,
      reason: 'Component not in registry',
    };
  }
  
  const hb = readHeartbeat(componentName);
  const now = Date.now();
  
  // Check if heartbeat exists
  if (!hb) {
    return {
      component: componentName,
      component_full_name: component.name,
      status: VERIFICATION_STATUS.UNREACHABLE,
      reason: 'No heartbeat file found',
      verified_at: new Date().toISOString(),
    };
  }
  
  // Check staleness
  const lastRunAt = hb.last_run_at ? new Date(hb.last_run_at).getTime() : null;
  const ageMs = lastRunAt ? now - lastRunAt : null;
  
  if (ageMs === null || ageMs > component.thresholdMs) {
    return {
      component: componentName,
      component_full_name: component.name,
      status: VERIFICATION_STATUS.STALE,
      age_ms: ageMs,
      threshold_ms: component.thresholdMs,
      last_run_at: hb.last_run_at,
      reason: ageMs === null ? 'No timestamp in heartbeat' : `Heartbeat age ${Math.round(ageMs/1000)}s exceeds threshold ${Math.round(component.thresholdMs/1000)}s`,
      verified_at: new Date().toISOString(),
    };
  }
  
  // Heartbeat is fresh — read actual state
  const actualState = component.readState();
  
  return {
    component: componentName,
    component_full_name: component.name,
    status: VERIFICATION_STATUS.VERIFIED,
    age_ms: ageMs,
    threshold_ms: component.thresholdMs,
    last_run_at: hb.last_run_at,
    actual_state: actualState,
    verified_at: new Date().toISOString(),
  };
}

/**
 * verifyAllComponents()
 * 
 * Verifies all registered components.
 */
function verifyAllComponents() {
  const results = {};
  const componentNames = Object.keys(COMPONENT_REGISTRY);
  
  for (const name of componentNames) {
    results[name] = verifyComponent(name);
  }
  
  return results;
}

/**
 * detectDiscrepancies(reportedState, actualStates)
 * 
 * Compares reported state against actual runtime state.
 * 
 * reportedState: what was reported (e.g. "system is HEALTHY")
 * actualStates: object of component results from verifyAllComponents()
 */
function detectDiscrepancies(reportedState = {}, actualStates = {}) {
  const discrepancies = [];
  const reportedStatus = reportedState.status || 'UNKNOWN';
  const reportedHealthScore = reportedState.health_score;
  
  // 1. Check if reported status matches component-reported status
  // Only consider components that report health-vocabulary statuses
  const HEALTH_VOCABULARY = Object.keys(STATUS_LEVEL);
  const componentStatuses = [];
  
  for (const [compName, result] of Object.entries(actualStates)) {
    if (result.actual_state?.status && HEALTH_VOCABULARY.includes(result.actual_state.status)) {
      componentStatuses.push({
        component: compName,
        status: result.actual_state.status,
      });
    }
  }
  
  // Find conflicting statuses between health-reporting components
  const uniqueStatuses = [...new Set(componentStatuses.map(c => c.status))].filter(s => s !== null);
  
  // Only flag as disagreement if there are multiple HEALTH vocabulary statuses that conflict
  // (Ignore 'active', 'idle', etc. — those are operational states, not health states)
  if (uniqueStatuses.length > 1) {
    discrepancies.push({
      type: 'module_disagreement',
      severity: 'high',
      description: `Modules report conflicting health statuses: ${uniqueStatuses.join(' vs ')}`,
      conflicting_modules: componentStatuses,
      reported_status: reportedStatus,
    });
  }
  
  // 2. Check if reported status is consistent with component states
  // If most components say DEGRADED but report says HEALTHY → discrepancy
  if (uniqueStatuses.length > 0) {
    const statusLevels = uniqueStatuses.map(s => STATUS_LEVEL[s] ?? 0);
    const highestComponentStatus = Object.entries(STATUS_LEVEL).find(([k]) => k === uniqueStatuses[statusLevels.indexOf(Math.max(...statusLevels))])?.[0];
    
    // If there's a significant mismatch between highest component status and reported
    const reportedLevel = STATUS_LEVEL[reportedStatus] ?? 0;
    const componentLevel = STATUS_LEVEL[highestComponentStatus] ?? 0;
    
    if (Math.abs(reportedLevel - componentLevel) >= 2) {
      discrepancies.push({
        type: 'status_mismatch',
        severity: 'high',
        description: `Reported status '${reportedStatus}' differs significantly from component-reported '${highestComponentStatus}'`,
        reported_status: reportedStatus,
        actual_status: highestComponentStatus,
        delta: Math.abs(reportedLevel - componentLevel),
      });
    }
  }
  
  // 3. Check for stale components when system claims healthy
  if (reportedStatus === 'HEALTHY') {
    const staleComponents = Object.entries(actualStates)
      .filter(([_, r]) => r.status === VERIFICATION_STATUS.STALE)
      .map(([k]) => k);
    
    if (staleComponents.length > 0) {
      discrepancies.push({
        type: 'stale_components_healthy_claim',
        severity: 'medium',
        description: `System claims HEALTHY but ${staleComponents.length} component(s) have stale heartbeats`,
        stale_components: staleComponents,
      });
    }
  }
  
  // 4. Check health score consistency
  if (reportedHealthScore !== undefined && reportedHealthScore !== null) {
    const componentScores = [];
    for (const [compName, result] of Object.entries(actualStates)) {
      if (result.actual_state?.health_score !== undefined && 
          result.actual_state?.health_score !== null) {
        componentScores.push({
          component: compName,
          health_score: result.actual_state.health_score,
        });
      }
    }
    
    if (componentScores.length > 0) {
      const avgComponentScore = componentScores.reduce((sum, c) => sum + c.health_score, 0) / componentScores.length;
      
      if (Math.abs(reportedHealthScore - avgComponentScore) > 0.2) {
        discrepancies.push({
          type: 'health_score_mismatch',
          severity: 'medium',
          description: `Reported health_score ${reportedHealthScore} differs from component average ${avgComponentScore.toFixed(2)}`,
          reported_health_score: reportedHealthScore,
          component_average_health_score: avgComponentScore,
          component_scores: componentScores,
        });
      }
    }
  }
  
  return discrepancies;
}

// ─── Self-Consistency Validation ───────────────────────────────────────────

/**
 * validateSelfConsistency(systemState, pipelineOutputs)
 * 
 * Checks for contradictions within the system state itself.
 * 
 * Example contradictions:
 * - systemStatus=HEALTHY but healthScore < 0.5
 * - isDegraded=true but systemStatus=HEALTHY
 * - activeIssueCount > 0 but systemStatus=HEALTHY
 */
function validateSelfConsistency(systemState = {}, pipelineOutputs = {}) {
  const inconsistencies = [];
  
  const {
    systemStatus = 'UNKNOWN',
    healthScore = null,
    isDegraded = false,
    isUnhealthy = false,
    isCritical = false,
    isHealthy = false,
    activeIssueCount = 0,
    activeIssues = [],
  } = systemState;
  
  // 1. Status vs health score contradiction
  if (healthScore !== null) {
    if (systemStatus === 'HEALTHY' && healthScore < 0.6) {
      inconsistencies.push({
        type: 'status_score_contradiction',
        severity: 'high',
        description: `systemStatus=HEALTHY but healthScore=${healthScore} (< 0.6)`,
        system_status: systemStatus,
        health_score: healthScore,
      });
    }
    if ((systemStatus === 'UNHEALTHY' || systemStatus === 'CRITICAL') && healthScore > 0.6) {
      inconsistencies.push({
        type: 'status_score_contradiction',
        severity: 'high',
        description: `systemStatus=${systemStatus} but healthScore=${healthScore} (> 0.6)`,
        system_status: systemStatus,
        health_score: healthScore,
      });
    }
  }
  
  // 2. Boolean flags vs status contradiction
  if (isDegraded && systemStatus === 'HEALTHY') {
    inconsistencies.push({
      type: 'flag_status_contradiction',
      severity: 'high',
      description: 'isDegraded=true but systemStatus=HEALTHY',
      system_status: systemStatus,
      is_degraded: isDegraded,
    });
  }
  if (isCritical && systemStatus !== 'CRITICAL') {
    inconsistencies.push({
      type: 'flag_status_contradiction',
      severity: 'high',
      description: `isCritical=true but systemStatus=${systemStatus}`,
      system_status: systemStatus,
      is_critical: isCritical,
    });
  }
  if (isUnhealthy && (systemStatus === 'HEALTHY' || systemStatus === 'DEGRADED')) {
    inconsistencies.push({
      type: 'flag_status_contradiction',
      severity: 'high',
      description: `isUnhealthy=true but systemStatus=${systemStatus}`,
      system_status: systemStatus,
      is_unhealthy: isUnhealthy,
    });
  }
  
  // 3. Active issues vs healthy status
  if (activeIssueCount > 2 && systemStatus === 'HEALTHY') {
    inconsistencies.push({
      type: 'active_issues_healthy_contradiction',
      severity: 'medium',
      description: `${activeIssueCount} active issues but systemStatus=HEALTHY`,
      active_issue_count: activeIssueCount,
      system_status: systemStatus,
      active_issues: activeIssues.slice(0, 5), // First 5
    });
  }
  
  // 4. Critical issue but not flagged as unhealthy/critical
  const criticalIssues = activeIssues.filter(i => i.severity >= 4);
  if (criticalIssues.length > 0 && !isCritical && systemStatus !== 'CRITICAL') {
    inconsistencies.push({
      type: 'critical_issue_unflagged',
      severity: 'high',
      description: `${criticalIssues.length} critical-severity issue(s) but system not flagged CRITICAL`,
      critical_issues: criticalIssues.map(i => i.description || i.pattern_key),
      system_status: systemStatus,
      is_critical: isCritical,
    });
  }
  
  // 5. Check pipeline output consistency (deferred vs priority)
  if (pipelineOutputs.deferredQueue && pipelineOutputs.prioritization) {
    const deferredCount = pipelineOutputs.deferredQueue.items?.length || 0;
    const activeCount = pipelineOutputs.prioritization.activeIssueCount || 0;
    
    // If we have many deferred items but also many active, is that consistent?
    // This is more of a "sanity check" than a hard inconsistency
    if (deferredCount > 10 && activeCount === 0 && systemStatus === 'HEALTHY') {
      // This is actually fine — could be legitimate housekeeping
    }
  }
  
  return inconsistencies;
}

// ─── Silent Degradation Detection ──────────────────────────────────────────

/**
 * detectSilentDegradation(componentResults)
 * 
 * Detects when components stop updating without explicit failure.
 * This is "silent" because no error is thrown — the component just stops reporting.
 */
function detectSilentDegradation(componentResults = {}) {
  const silentIssues = [];
  
  for (const [componentName, result] of Object.entries(componentResults)) {
    if (result.status === VERIFICATION_STATUS.STALE) {
      silentIssues.push({
        type: 'silent_degradation',
        component: componentName,
        component_full_name: result.component_full_name,
        severity: _getSeverityForComponent(componentName, result),
        description: `${result.component_full_name || componentName} heartbeat is stale`,
        age_ms: result.age_ms,
        threshold_ms: result.threshold_ms,
        last_run_at: result.last_run_at,
        reason: result.reason,
      });
    } else if (result.status === VERIFICATION_STATUS.UNREACHABLE) {
      silentIssues.push({
        type: 'component_unreachable',
        component: componentName,
        component_full_name: result.component_full_name,
        severity: 'high',
        description: `${result.component_full_name || componentName} is not reachable`,
        reason: result.reason,
      });
    }
  }
  
  // Sort by severity
  silentIssues.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9);
  });
  
  return silentIssues;
}

function _getSeverityForComponent(componentName, result) {
  // Critical components: worker, self-check
  // Important components: decision-cycle, thinking-loop
  // Standard: others
  const criticalComponents = ['worker', 'self-check'];
  const importantComponents = ['decision-cycle', 'thinking-loop'];
  
  if (criticalComponents.includes(componentName)) {
    return result.age_ms > (STALE_THRESHOLDS.critical_ms * 2) ? 'critical' : 'high';
  }
  if (importantComponents.includes(componentName)) {
    return 'medium';
  }
  return 'low';
}

// ─── Full Self-Awareness Check ──────────────────────────────────────────────

/**
 * runSelfAwarenessCheck(reportedState, pipelineOutputs)
 * 
 * Main entry point. Runs full self-awareness verification.
 * 
 * Returns:
 * {
 *   overall_status: VERIFIED | DISCREPANCIES_FOUND | STALE_SYSTEM | UNREACHABLE,
 *   component_verification: { ...component results },
 *   discrepancies: [ ... ],
 *   inconsistencies: [ ... ],
 *   silent_degradation: [ ... ],
 *   report_integrity: { ... },
 *   summary: string,
 * }
 */
function runSelfAwarenessCheck(reportedState = {}, pipelineOutputs = {}) {
  const now = new Date().toISOString();
  const cycleCount = getStore().last_verification_cycle + 1;
  
  // Step 1: Verify all components
  const componentResults = verifyAllComponents();
  
  // Step 2: Detect discrepancies between reported and actual
  const discrepancies = detectDiscrepancies(reportedState, componentResults);
  
  // Step 3: Validate self-consistency
  const inconsistencies = validateSelfConsistency(reportedState, pipelineOutputs);
  
  // Step 4: Detect silent degradation
  const silentDegradation = detectSilentDegradation(componentResults);
  
  // Step 5: Report integrity check
  const reportIntegrity = {
    has_reported_state: Object.keys(reportedState).length > 0,
    reported_state_age_ms: reportedState._verified_at 
      ? Date.now() - new Date(reportedState._verified_at).getTime() 
      : null,
    uses_live_data: !_usesHardcodedData(reportedState),
    all_components_responding: Object.values(componentResults).every(
      r => r.status === VERIFICATION_STATUS.VERIFIED
    ),
  };
  
  // Step 6: Determine overall status
  let overallStatus = VERIFICATION_STATUS.VERIFIED;
  
  if (silentDegradation.length > 0 || discrepancies.length > 0 || inconsistencies.length > 0) {
    const hasHighSeverity = 
      silentDegradation.some(d => d.severity === 'critical' || d.severity === 'high') ||
      discrepancies.some(d => d.severity === 'high') ||
      inconsistencies.some(i => i.severity === 'high');
    
    overallStatus = hasHighSeverity ? 'DISCREPANCIES_FOUND' : 'STALE_SYSTEM';
  }
  
  if (silentDegradation.some(d => d.type === 'component_unreachable')) {
    overallStatus = 'UNREACHABLE';
  }
  
  // Check if critical components are stale
  const criticalStale = silentDegradation.some(
    d => d.type === 'silent_degradation' && d.severity === 'critical'
  );
  if (criticalStale) {
    overallStatus = 'UNREACHABLE';
  }
  
  // Step 7: Build summary
  const summary = _buildSummary(overallStatus, discrepancies, inconsistencies, silentDegradation);
  
  // Step 8: Record in store
  const store = getStore();
  store.verifications.push({
    cycle: cycleCount,
    verified_at: now,
    overall_status: overallStatus,
    reported_state: reportedState,
    component_verification: componentResults,
    discrepancies_count: discrepancies.length,
    inconsistencies_count: inconsistencies.length,
    silent_degradation_count: silentDegradation.length,
  });
  store.last_verification_cycle = cycleCount;
  store.last_full_verification_at = now;
  
  if (discrepancies.length > 0 || inconsistencies.length > 0) {
    store.discrepancies.push(...discrepancies, ...inconsistencies);
    store.consecutive_failures++;
  } else {
    store.consecutive_failures = 0;
  }
  
  _pruneHistory(store);
  saveStore();
  
  return {
    overall_status: overallStatus,
    verification_cycle: cycleCount,
    verified_at: now,
    component_verification: componentResults,
    discrepancies,
    inconsistencies,
    silent_degradation: silentDegradation,
    report_integrity: reportIntegrity,
    summary,
    consecutive_failures: getStore().consecutive_failures,
  };
}

function _usesHardcodedData(reportedState) {
  // If reported state has _verified_at and it's recent (< 1 min), likely live
  if (reportedState._verified_at) {
    const age = Date.now() - new Date(reportedState._verified_at).getTime();
    return age > 60000; // > 1 minute = possibly stale/hardcoded
  }
  return false; // Assume live if no timestamp
}

function _buildSummary(overallStatus, discrepancies, inconsistencies, silentDegradation) {
  const parts = [];
  
  if (overallStatus === VERIFICATION_STATUS.VERIFIED) {
    return 'System self-awareness verified. All components reporting, no discrepancies detected.';
  }
  
  if (discrepancies.length > 0) {
    parts.push(`${discrepancies.length} discrepancy(ies)`);
  }
  if (inconsistencies.length > 0) {
    parts.push(`${inconsistencies.length} internal inconsistency(ies)`);
  }
  if (silentDegradation.length > 0) {
    parts.push(`${silentDegradation.length} silent degradation(s)`);
  }
  
  return `Self-awareness issues detected: ${parts.join(', ')}.`;
}

function _pruneHistory(store) {
  const MAX_HISTORY = 100;
  if (store.verifications.length > MAX_HISTORY) {
    store.verifications = store.verifications.slice(-MAX_HISTORY);
  }
  if (store.discrepancies.length > 200) {
    store.discrepancies = store.discrepancies.slice(-200);
  }
}

// ─── Report Generation ──────────────────────────────────────────────────────

/**
 * generateAwarenessReport(selfAwarenessResult)
 * 
 * Produces a human-readable self-awareness report.
 */
function generateAwarenessReport(result) {
  const lines = [];
  
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('  SYSTEM SELF-AWARENESS REPORT');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Overall Status: ${result.overall_status}`);
  lines.push(`Verification Cycle: ${result.verification_cycle}`);
  lines.push(`Verified At: ${result.verified_at}`);
  lines.push('');
  
  lines.push('── Component Verification ─────────────────────────────────────');
  for (const [comp, res] of Object.entries(result.component_verification)) {
    const icon = res.status === VERIFICATION_STATUS.VERIFIED ? '✅' 
               : res.status === VERIFICATION_STATUS.STALE ? '⚠️' 
               : res.status === VERIFICATION_STATUS.UNREACHABLE ? '❌' : '❓';
    lines.push(`  ${icon} ${comp}: ${res.status} (${res.status !== 'verified' ? res.reason : `age: ${Math.round((res.age_ms||0)/1000)}s`})`);
  }
  lines.push('');
  
  if (result.discrepancies.length > 0) {
    lines.push('── Discrepancies ───────────────────────────────────────────────');
    for (const d of result.discrepancies) {
      lines.push(`  ⚠️  [${d.severity}] ${d.type}: ${d.description}`);
    }
    lines.push('');
  }
  
  if (result.inconsistencies.length > 0) {
    lines.push('── Internal Inconsistencies ─────────────────────────────────────');
    for (const i of result.inconsistencies) {
      lines.push(`  ⚠️  [${i.severity}] ${i.type}: ${i.description}`);
    }
    lines.push('');
  }
  
  if (result.silent_degradation.length > 0) {
    lines.push('── Silent Degradation ─────────────────────────────────────────');
    for (const s of result.silent_degradation) {
      lines.push(`  ⚠️  [${s.severity}] ${s.type} (${s.component}): ${s.description}`);
    }
    lines.push('');
  }
  
  lines.push(`Report Integrity:`);
  lines.push(`  • Has reported state: ${result.report_integrity.has_reported_state}`);
  lines.push(`  • Uses live data: ${result.report_integrity.uses_live_data}`);
  lines.push(`  • All components responding: ${result.report_integrity.all_components_responding}`);
  lines.push('');
  lines.push(`Summary: ${result.summary}`);
  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Heartbeat management
  writeHeartbeat,
  readHeartbeat,
  getHeartbeatAge,
  isHeartbeatStale,
  
  // Core verification
  verifyComponent,
  verifyAllComponents,
  detectDiscrepancies,
  validateSelfConsistency,
  detectSilentDegradation,
  runSelfAwarenessCheck,
  resetStore,
  
  // Reporting
  generateAwarenessReport,
  
  // Constants
  VERIFICATION_STATUS,
  STATUS_LEVEL,
  STALE_THRESHOLDS,
  COMPONENT_REGISTRY,
};
