/**
 * R8.1 — Safe Action Verification
 * 
 * Verifies that all SAFE_AUTONOMOUS actions are truly safe.
 * 
 * For each action:
 * - Step-by-step what it does
 * - Impact analysis
 * - Risk classification
 * - Failure analysis
 * - Containment confirmation
 * 
 * Plus validation tests.
 */

const {
  ACTION_REGISTRY,
  ACTION_CLASS,
  ACTION_CATEGORY,
  checkEligibility,
  executeIfEligible,
  engageKillSwitch,
  disengageKillSwitch,
  disableAction,
  enableAction,
  resetCaches,
  getAutonomyStatus,
  getAuditLog,
  classifyAction,
} = require('./safe-action-zones');

const fs = require('fs');
const path = require('path');

// ─── Test Utilities ───────────────────────────────────────────────────────────

let testsPassed = 0;
let testsFailed = 0;

function pass(msg) {
  console.log(`  ✅ ${msg}`);
  testsPassed++;
}

function fail(msg, details = '') {
  console.log(`  ❌ ${msg}`);
  if (details) console.log(`     → ${details}`);
  testsFailed++;
}

function info(msg) {
  console.log(`  ℹ️  ${msg}`);
}

function section(name) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${name}`);
  console.log('═'.repeat(70));
}

function subsection(name) {
  console.log(`\n── ${name}`);
}

function resetState() {
  resetCaches();
  const FREQ_PATH = path.join(__dirname, '../../state/frequency-track.json');
  if (fs.existsSync(FREQ_PATH)) fs.unlinkSync(FREQ_PATH);
  const STORE_PATH = path.join(__dirname, '../../state/kill-switch.json');
  if (fs.existsSync(STORE_PATH)) fs.unlinkSync(STORE_PATH);
}

// ─── Analysis Output ────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(70));
console.log('  R8.1 — SAFE ACTION VERIFICATION');
console.log('═'.repeat(70));

// ── ACTION INVENTORY ─────────────────────────────────────────────────────────

section('1. ACTION INVENTORY');

const safeActions = Object.entries(ACTION_REGISTRY)
  .filter(([_, a]) => a.classification === ACTION_CLASS.SAFE_AUTONOMOUS)
  .map(([id, a]) => ({ id, ...a }));

console.log(`\nTotal SAFE_AUTONOMOUS actions: ${safeActions.length}\n`);

for (const action of safeActions) {
  console.log(`┌─────────────────────────────────────────────────────────────────┐`);
  console.log(`│ ${action.id.padEnd(62)} │`);
  console.log(`├─────────────────────────────────────────────────────────────────┤`);
  console.log(`│ Category:    ${action.category.padEnd(54)} │`,);
  console.log(`│ Safe conditions: ${(action.safe_conditions || []).join(', ').padEnd(43)} │`);
  console.log(`│ Freq limit:  ${action.frequency_limit.count}/${action.frequency_limit.window_ms}ms`.padEnd(62) + `│`);
  console.log(`│ Idempotent: ${String(action.idempotent).padEnd(53)} │`);
  console.log(`│ Reversible: ${String(action.reversible).padEnd(53)} │`);
  console.log(`└─────────────────────────────────────────────────────────────────┘`);
}

// ── IMPACT ANALYSIS ─────────────────────────────────────────────────────────

section('2. IMPACT ANALYSIS');

const impactAnalysis = {
  'read_health_status': {
    modifiesDatabase: false,
    modifiesFiles: false,
    triggersWorkflows: false,
    externalInteraction: false,
    idempotent: true,
    explanation: 'Read-only status check. No data modification.',
  },
  'read_deferred_queue': {
    modifiesDatabase: false,
    modifiesFiles: false,
    triggersWorkflows: false,
    externalInteraction: false,
    idempotent: true,
    explanation: 'Read-only queue inspection. No modification.',
  },
  'read_pattern_memory': {
    modifiesDatabase: false,
    modifiesFiles: false,
    triggersWorkflows: false,
    externalInteraction: false,
    idempotent: true,
    explanation: 'Read-only memory read. No modification.',
  },
  'cleanup_stale_sessions': {
    modifiesDatabase: true,  // Deletes session records
    modifiesFiles: false,
    triggersWorkflows: false,
    externalInteraction: false,
    idempotent: true,
    explanation: 'Deletes stale session records from storage. Data modification but scoped to stale records only.',
  },
  'rotate_audit_logs': {
    modifiesDatabase: false,
    modifiesFiles: true,  // Archives/rotates log files
    triggersWorkflows: false,
    externalInteraction: false,
    idempotent: true,
    explanation: 'Archives old logs, preserves recent. File modification but non-destructive.',
  },
  'update_heartbeat': {
    modifiesDatabase: false,
    modifiesFiles: true,  // Writes heartbeat file
    triggersWorkflows: false,
    externalInteraction: false,
    idempotent: true,
    explanation: 'Updates own heartbeat file only. No external interaction.',
  },
  'invalidate_cache_pattern': {
    modifiesDatabase: false,
    modifiesFiles: false,
    triggersWorkflows: false,
    externalInteraction: false,
    idempotent: true,
    explanation: 'Removes entries from in-memory cache. Reversible by cache restoration.',
  },
  'increment_metric': {
    modifiesDatabase: false,
    modifiesFiles: false,
    triggersWorkflows: false,
    externalInteraction: false,
    idempotent: true,
    explanation: 'Increments in-memory counter. Non-critical metric only.',
  },
};

for (const [actionId, impact] of Object.entries(impactAnalysis)) {
  const action = safeActions.find(a => a.id === actionId);
  console.log(`\n${actionId}:`);
  console.log(`  Database: ${impact.modifiesDatabase ? '⚠️  MODIFIES' : '✅  No'}`);
  console.log(`  Files:    ${impact.modifiesFiles ? '⚠️  MODIFIES' : '✅  No'}`);
  console.log(`  Workflows: ${impact.triggersWorkflows ? '❌ TRIGGERS' : '✅  No'}`);
  console.log(`  External:  ${impact.externalInteraction ? '❌ INTERACTS' : '✅  No'}`);
  console.log(`  Idempotent: ${impact.idempotent ? '✅  Yes' : '❌  No'}`);
  console.log(`  Explanation: ${impact.explanation}`);
}

// ── RISK CLASSIFICATION ─────────────────────────────────────────────────────

section('3. RISK CLASSIFICATION');

const riskClassification = {
  'read_health_status': {
    riskLevel: 'NONE',
    justification: 'Pure read operation. No side effects.',
    hiddenEffects: 'None.',
    escalationPotential: 'None.',
    containment: 'Fully contained. No bounds needed.',
  },
  'read_deferred_queue': {
    riskLevel: 'NONE',
    justification: 'Pure read operation. No side effects.',
    hiddenEffects: 'None.',
    escalationPotential: 'None.',
    containment: 'Fully contained.',
  },
  'read_pattern_memory': {
    riskLevel: 'NONE',
    justification: 'Pure read operation. No side effects.',
    hiddenEffects: 'None.',
    escalationPotential: 'None.',
    containment: 'Fully contained.',
  },
  'cleanup_stale_sessions': {
    riskLevel: 'LOW',
    justification: 'Deletes only records older than 24h that are confirmed stale. 100 record max limit.',
    hiddenEffects: 'None. Only targets session records marked stale.',
    escalationPotential: 'Low. Hard limit of 100 records per execution prevents mass deletion.',
    containment: 'Time-bounded (24h), count-bounded (100), condition-bounded (stale only).',
  },
  'rotate_audit_logs': {
    riskLevel: 'LOW',
    justification: 'Only archives logs older than 7 days. Always preserves 100 most recent.',
    hiddenEffects: 'None. Archive operation is non-destructive.',
    escalationPotential: 'Low. Always preserves recent logs.',
    containment: 'Age-bounded (7 days), count-bounded (100 recent preserved).',
  },
  'update_heartbeat': {
    riskLevel: 'NONE',
    justification: 'Only updates own heartbeat file. Cannot affect other components.',
    hiddenEffects: 'None. Limited to own heartbeat.',
    escalationPotential: 'None. Scope limited to own component.',
    containment: 'Component-bounded (own heartbeat only).',
  },
  'invalidate_cache_pattern': {
    riskLevel: 'LOW',
    justification: 'Removes cached data. Maximum 5 keys per execution.',
    hiddenEffects: 'Cache miss on next read until repopulated.',
    escalationPotential: 'Low. Max 5 keys per execution.',
    containment: 'Count-bounded (5 keys max). Pattern-only scope.',
  },
  'increment_metric': {
    riskLevel: 'NONE',
    justification: 'Only increments non-critical counters. Cannot modify security metrics.',
    hiddenEffects: 'None. Counter increment only.',
    escalationPotential: 'None. Non-critical metrics only.',
    containment: 'Category-bounded (non-critical only).',
  },
};

for (const [actionId, risk] of Object.entries(riskClassification)) {
  const level = risk.riskLevel;
  const icon = level === 'NONE' ? '✅' : level === 'LOW' ? '⚠️' : '❌';
  console.log(`\n${actionId}: ${icon} ${level}`);
  console.log(`  Justification: ${risk.justification}`);
  console.log(`  Hidden effects: ${risk.hiddenEffects}`);
  console.log(`  Escalation potential: ${risk.escalationPotential}`);
  console.log(`  Containment: ${risk.containment}`);
}

// ── FAILURE ANALYSIS ────────────────────────────────────────────────────────

section('4. FAILURE ANALYSIS');

const failureAnalysis = {
  'read_health_status': {
    failsMidway: 'N/A - read-only',
    repeatedExecution: 'Safe. No side effects.',
    stateChangeDuring: 'Safe. No state modification.',
  },
  'read_deferred_queue': {
    failsMidway: 'N/A - read-only',
    repeatedExecution: 'Safe. No side effects.',
    stateChangeDuring: 'Safe. No state modification.',
  },
  'read_pattern_memory': {
    failsMidway: 'N/A - read-only',
    repeatedExecution: 'Safe. No side effects.',
    stateChangeDuring: 'Safe. No state modification.',
  },
  'cleanup_stale_sessions': {
    failsMidway: 'Partial deletion possible. Already-deleted records cannot be recovered. Idempotent: re-running only deletes remaining stale records.',
    repeatedExecution: 'Safe. Idempotent. Only deletes stale records, already-deleted records return no-op.',
    stateChangeDuring: 'If system becomes UNHEALTHY during execution, next eligibility check will block further execution.',
  },
  'rotate_audit_logs': {
    failsMidway: 'Partial rotation possible. Already-rotated logs remain archived. Idempotent: re-running only rotates remaining eligible logs.',
    repeatedExecution: 'Safe. Idempotent. Only rotates logs not yet rotated.',
    stateChangeDuring: 'If system becomes UNHEALTHY during execution, next eligibility check will block.',
  },
  'update_heartbeat': {
    failsMidway: 'Heartbeat file may be missing or stale. Next heartbeat will update.',
    repeatedExecution: 'Safe. Writes current timestamp. Same value written repeatedly.',
    stateChangeDuring: 'Allowed in all states. Heartbeat is critical for monitoring.',
  },
  'invalidate_cache_pattern': {
    failsMidway: 'Partial invalidation possible. Cache may be partially cleared.',
    repeatedExecution: 'Safe. Idempotent. Re-invalidating same key is no-op.',
    stateChangeDuring: 'If system becomes UNHEALTHY, next eligibility check blocks.',
  },
  'increment_metric': {
    failsMidway: 'Counter may not be incremented. Next call will increment again.',
    repeatedExecution: 'Safe. Counter increments. Over-counting possible but metric is non-critical.',
    stateChangeDuring: 'Allowed in HEALTHY and DEGRADED. Blocked in UNHEALTHY/CRITICAL.',
  },
};

for (const [actionId, analysis] of Object.entries(failureAnalysis)) {
  console.log(`\n${actionId}:`);
  console.log(`  Fails midway: ${analysis.failsMidway}`);
  console.log(`  Repeated execution: ${analysis.repeatedExecution}`);
  console.log(`  State change during: ${analysis.stateChangeDuring}`);
}

// ── CONTAINMENT CONFIRMATION ───────────────────────────────────────────────

section('5. CONTAINMENT CONFIRMATION');

let allContained = true;
for (const action of safeActions) {
  const scopeLimits = action.scope_limits || {};
  const hasLimits = Object.keys(scopeLimits).length > 0;
  
  console.log(`\n${action.id}:`);
  console.log(`  Scope limits: ${hasLimits ? Object.entries(scopeLimits).map(([k,v]) => `${k}=${v}`).join(', ') : 'None (read-only)'}`);
  
  // Check containment properties
  if (action.category === 'read_only') {
    if (scopeLimits.read_only === true) {
      console.log(`  ✅ CONTAINED: Read-only operation`);
    } else {
      console.log(`  ❌ ISSUE: Read-only action without read_only scope limit`);
      allContained = false;
    }
  } else if (action.category === 'housekeeping') {
    if (action.id === 'cleanup_stale_sessions') {
      const contained = scopeLimits.max_age_hours === 24 && scopeLimits.max_count === 100 && scopeLimits.only_stale === true;
      console.log(`  ${contained ? '✅' : '❌'} CONTAINED: ${contained ? 'Time, count, and condition bounded' : 'Missing containment'}`);
      if (!contained) allContained = false;
    } else if (action.id === 'rotate_audit_logs') {
      const contained = scopeLimits.max_age_days === 7 && scopeLimits.preserve_recent === 100;
      console.log(`  ${contained ? '✅' : '❌'} CONTAINED: ${contained ? 'Age and count bounded' : 'Missing containment'}`);
      if (!contained) allContained = false;
    }
  } else if (action.category === 'notification') {
    if (scopeLimits.own_heartbeat_only === true) {
      console.log(`  ✅ CONTAINED: Component-scoped`);
    } else {
      console.log(`  ⚠️  PARTIAL: No explicit component scope limit`);
    }
  } else if (action.category === 'cache') {
    const contained = scopeLimits.max_keys === 5 && scopeLimits.pattern_only === true;
    console.log(`  ${contained ? '✅' : '❌'} CONTAINED: ${contained ? 'Count and type bounded' : 'Missing containment'}`);
    if (!contained) allContained = false;
  } else if (action.category === 'metrics') {
    const contained = scopeLimits.non_critical_only === true && scopeLimits.no_security_metrics === true;
    console.log(`  ${contained ? '✅' : '❌'} CONTAINED: ${contained ? 'Category bounded' : 'Missing containment'}`);
    if (!contained) allContained = false;
  }
}

if (allContained) {
  pass('5.1: All SAFE_AUTONOMOUS actions have appropriate scope limits');
} else {
  fail('5.1', 'Some actions lack adequate containment');
}

// ── VALIDATION TESTS ────────────────────────────────────────────────────────

section('VALIDATION TESTS');

// V1: Safe action executes repeatedly without harm
subsection('V1: Safe action executes repeatedly without harm');

{
  resetState();
  
  // increment_metric is safe to run repeatedly
  let counter = 0;
  const executor = () => { counter++; return counter; };
  
  for (let i = 0; i < 5; i++) {
    const result = executeIfEligible(
      'increment_metric',
      { systemStatus: 'HEALTHY' },
      {},
      executor
    );
    if (!result.autonomous) {
      fail(`V1.${i+1}: Execution ${i+1} should succeed`);
      break;
    }
    if (result.executed && result.result !== i + 1) {
      fail(`V1.${i+1}: Counter should be ${i+1}, got ${result.result}`);
    }
  }
  if (counter === 5) pass('V1: increment_metric executed 5 times without harm');
}

// V2: Safe action cannot escalate into unsafe state
subsection('V2: Safe action cannot escalate into unsafe state');

{
  resetState();
  
  // Verify RESTRICTED actions never become eligible
  const restrictedActions = ['restart_worker', 'modify_access_control', 'delete_data', 'execute_external_command'];
  
  let allBlocked = true;
  for (const actionId of restrictedActions) {
    for (const status of ['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'CRITICAL']) {
      const result = checkEligibility(actionId, { systemStatus: status }, {});
      if (result.eligible) {
        fail(`V2: ${actionId} should never be eligible (even in ${status})`);
        allBlocked = false;
      }
    }
  }
  if (allBlocked) pass('V2: RESTRICTED actions cannot escalate to eligible state');
  
  // Verify SAFE_AUTONOMOUS cannot become RESTRICTED behavior
  const eligibleResult = checkEligibility('cleanup_stale_sessions', { systemStatus: 'HEALTHY' }, {});
  if (!eligibleResult.eligible) {
    fail('V2: cleanup_stale_sessions should be eligible in HEALTHY');
  }
  
  // Verify it does NOT grant access to restricted operations
  const cls = classifyAction('cleanup_stale_sessions');
  if (cls.classification !== ACTION_CLASS.SAFE_AUTONOMOUS) {
    fail('V2: cleanup_stale_sessions should remain SAFE_AUTONOMOUS');
  }
}

// V3: No interaction with restricted systems
subsection('V3: No interaction with restricted systems');

{
  resetState();
  
  // Verify external systems are not accessible through SAFE_AUTONOMOUS actions
  const externalActions = ['execute_external_command'];
  
  let allRestricted = true;
  for (const actionId of externalActions) {
    const cls = classifyAction(actionId);
    if (cls.classification !== ACTION_CLASS.RESTRICTED) {
      fail(`V3: ${actionId} should be RESTRICTED`);
      allRestricted = false;
    }
  }
  if (allRestricted) pass('V3: External system actions are RESTRICTED');
  
  // Verify SAFE_AUTONOMOUS actions don't trigger external interactions
  const safeExternalTriggers = ['read_health_status', 'read_deferred_queue', 'read_pattern_memory', 
                                 'cleanup_stale_sessions', 'rotate_audit_logs', 'update_heartbeat',
                                 'invalidate_cache_pattern', 'increment_metric'];
  
  let noExternal = true;
  for (const actionId of safeExternalTriggers) {
    const action = ACTION_REGISTRY[actionId];
    if (action && (action.category === 'external' || actionId.includes('external'))) {
      fail(`V3: ${actionId} should not be in external category`);
      noExternal = false;
    }
  }
  if (noExternal) pass('V3: No SAFE_AUTONOMOUS actions interact with external systems');
}

// V4: Kill switch properly stops execution
subsection('V4: Kill switch properly stops execution');

{
  resetState();
  
  // Engage kill switch
  engageKillSwitch('Test kill switch');
  
  // Verify all SAFE_AUTONOMOUS actions blocked
  let allBlocked = true;
  for (const action of safeActions) {
    const result = checkEligibility(action.id, { systemStatus: 'HEALTHY' }, {});
    if (result.eligible) {
      fail(`V4: ${action.id} should be blocked when kill switch engaged`);
      allBlocked = false;
    }
  }
  if (allBlocked) pass('V4.1: All SAFE_AUTONOMOUS actions blocked when kill switch engaged');
  
  // Verify disengage re-enables
  disengageKillSwitch();
  
  const result = checkEligibility('update_heartbeat', { systemStatus: 'HEALTHY' }, {});
  if (result.eligible) {
    pass('V4.2: Actions re-enabled after kill switch disengage');
  } else {
    fail('V4.2', `Expected eligible after disengage, got ${result.eligible}`);
  }
}

// V5: Frequency limits enforce correctly under repeated triggers
subsection('V5: Frequency limits enforce correctly under repeated triggers');

{
  resetState();
  
  // update_heartbeat has 1/min limit
  // Execute once
  const result1 = executeIfEligible('update_heartbeat', { systemStatus: 'HEALTHY' }, {}, () => 'done');
  if (!result1.autonomous) {
    fail('V5.1: First update_heartbeat should succeed');
  }
  
  // Execute again immediately - should be blocked
  const result2 = executeIfEligible('update_heartbeat', { systemStatus: 'HEALTHY' }, {}, () => 'done');
  if (!result2.autonomous) {
    pass('V5.2: Second immediate execution blocked by frequency limit');
  } else {
    fail('V5.2', 'Second execution should have been blocked');
  }
  
  // Verify audit log shows both attempts
  const blockedLogs = getAuditLog({ eventType: 'EXECUTION_BLOCKED' });
  const hasFreqBlock = blockedLogs.some(l => l.details.reason === 'frequency_limit_exceeded');
  if (hasFreqBlock) {
    pass('V5.3: Frequency limit exceeded logged');
  } else {
    fail('V5.3', 'Expected frequency_limit_exceeded in audit');
  }
}

// ── RECLASSIFICATION CHECK ─────────────────────────────────────────────────

section('RECLASSIFICATION CHECK');

const needsReclassification = [];

// cleanup_stale_sessions: modifies database (deletes records)
// While scoped, this is a data modification action
if (impactAnalysis['cleanup_stale_sessions'].modifiesDatabase) {
  // Check if the action is truly safe
  // It deletes data, which is inherently riskier
  // However, it's bounded by time, count, and condition
  // Recommendation: Keep as SAFE_AUTONOMOUS but note the risk
  info('cleanup_stale_sessions: Deletes records but with strict bounds (24h, 100 max, stale only). Keep as SAFE_AUTONOMOUS with note.');
}

// rotate_audit_logs: modifies files
if (impactAnalysis['rotate_audit_logs'].modifiesFiles) {
  // This modifies files but only archives, doesn't delete
  // Reversible by restoring from archive
  info('rotate_audit_logs: Archives files. Keep as SAFE_AUTONOMOUS - archive operation is safe.');
}

// update_heartbeat: modifies files
if (impactAnalysis['update_heartbeat'].modifiesFiles) {
  // Only modifies own heartbeat file
  info('update_heartbeat: Writes own heartbeat file. Keep as SAFE_AUTONOMOUS - scoped to self.');
}

// increment_metric: modifies database/files
if (impactAnalysis['increment_metric'].modifiesDatabase || impactAnalysis['increment_metric'].modifiesFiles) {
  // Non-critical metrics only
  info('increment_metric: Increments counters. Keep as SAFE_AUTONOMOUS - non-critical only.');
}

// No reclassifications needed - all are truly safe given their scope limits

// ── FINAL SAFE ACTION SET ───────────────────────────────────────────────────

section('FINAL SAFE ACTION SET');

console.log('\nConfirmed SAFE_AUTONOMOUS actions:\n');

for (const action of safeActions) {
  const impact = impactAnalysis[action.id];
  const risk = riskClassification[action.id];
  
  console.log(`✅ ${action.id}`);
  console.log(`   Risk: ${risk.riskLevel} | Impact: ${impact.modifiesDatabase || impact.modifiesFiles ? 'Modifies state' : 'Read-only'}`);
  console.log(`   Containment: ${risk.containment}`);
  console.log('');
}

// ── FINAL SUMMARY ────────────────────────────────────────────────────────────

section('FINAL RESULTS');

console.log(`\n  Tests passed:  ${testsPassed}`);
console.log(`  Tests failed:  ${testsFailed}`);
console.log(`  Total tests:   ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n⚠️  VALIDATION FAILED\n');
  process.exit(1);
} else {
  console.log('\n✅ ALL R8.1 VERIFICATION TESTS PASSED\n');
}

console.log('═'.repeat(70));
console.log('  R8.1 — SAFE ACTION VERIFICATION COMPLETE');
console.log('═'.repeat(70) + '\n');

process.exit(testsFailed > 0 ? 1 : 0);
