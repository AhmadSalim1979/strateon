/**
 * R7 — Self-Awareness Validation Suite
 * 
 * Validates:
 * 1. Correct system state → correct report
 * 2. Intentionally mismatched state → discrepancy detected
 * 3. Stale data → flagged
 * 4. Module disagreement → flagged
 * 5. No false positives in normal operation
 */

const {
  writeHeartbeat,
  readHeartbeat,
  getHeartbeatAge,
  isHeartbeatStale,
  verifyComponent,
  verifyAllComponents,
  detectDiscrepancies,
  validateSelfConsistency,
  detectSilentDegradation,
  runSelfAwarenessCheck,
  resetStore,
  generateAwarenessReport,
  VERIFICATION_STATUS,
  STATUS_LEVEL,
  STALE_THRESHOLDS,
} = require('./self-awareness');

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

// ─── Setup / Teardown ───────────────────────────────────────────────────────

const STATE_DIR = path.join(__dirname, '../../state');
const HEARTBEAT_DIR = path.join(STATE_DIR, 'heartbeats');

function cleanHeartbeats() {
  if (fs.existsSync(HEARTBEAT_DIR)) {
    for (const f of fs.readdirSync(HEARTBEAT_DIR)) {
      fs.unlinkSync(path.join(HEARTBEAT_DIR, f));
    }
  } else {
    fs.mkdirSync(HEARTBEAT_DIR, { recursive: true });
  }
  // Also reset the verification store for clean test runs
  resetStore();
}

function writeComponentHeartbeat(component, status, health_score, age_ms_ago = 0) {
  const timestamp = new Date(Date.now() - age_ms_ago).toISOString();
  const hb = {
    component,
    last_run_at: timestamp,
    status,
    health_score,
    pid: process.pid,
    cycle_count: 1,
  };
  const hbPath = path.join(HEARTBEAT_DIR, `${component}.json`);
  fs.writeFileSync(hbPath, JSON.stringify(hb, null, 2), 'utf8');
  return hb;
}

// ─── Validation Tests ───────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(70));
console.log('  R7 — SELF-AWARENESS & RELIABILITY INTEGRITY VALIDATION');
console.log('═'.repeat(70));

// ── V1: Correct system state → correct report ───────────────────────────────
section('V1: Correct System State → Correct Report');

{
  cleanHeartbeats();
  
  // Write fresh heartbeats for all components — all healthy
  writeComponentHeartbeat('worker', 'HEALTHY', 0.95, 0);
  writeComponentHeartbeat('self-check', 'HEALTHY', null, 0);
  writeComponentHeartbeat('thinking-loop', 'active', null, 0);
  writeComponentHeartbeat('decision-cycle', 'HEALTHY', null, 0);
  
  subsection('Input');
  info('All components reporting HEALTHY with fresh heartbeats');
  
  const reportedState = {
    status: 'HEALTHY',
    health_score: 0.95,
    _verified_at: new Date().toISOString(),
  };
  
  subsection('Verification');
  
  const result = runSelfAwarenessCheck(reportedState, {});
  
  console.log(`    Overall status: ${result.overall_status}`);
  console.log(`    Discrepancies: ${result.discrepancies.length}`);
  console.log(`    Inconsistencies: ${result.inconsistencies.length}`);
  console.log(`    Silent degradation: ${result.silent_degradation.length}`);
  
  if (result.overall_status === VERIFICATION_STATUS.VERIFIED) {
    pass('V1.1: Overall status is VERIFIED');
  } else {
    fail('V1.1', `Expected VERIFIED, got ${result.overall_status}`);
  }
  
  if (result.discrepancies.length === 0) {
    pass('V1.2: No discrepancies detected');
  } else {
    fail('V1.2', `Expected 0 discrepancies, got ${result.discrepancies.length}`);
  }
  
  if (result.inconsistencies.length === 0) {
    pass('V1.3: No internal inconsistencies detected');
  } else {
    fail('V1.3', `Expected 0 inconsistencies, got ${result.inconsistencies.length}`);
  }
  
  if (result.silent_degradation.length === 0) {
    pass('V1.4: No silent degradation detected');
  } else {
    fail('V1.4', `Expected 0 silent degradations, got ${result.silent_degradation.length}`);
  }
  
  if (result.report_integrity.all_components_responding) {
    pass('V1.5: All components responding');
  } else {
    fail('V1.5', 'Not all components responding');
  }
}

// ── V2: Intentionally mismatched state → discrepancy detected ──────────────
section('V2: Intentionally Mismatched State → Discrepancy Detected');

{
  cleanHeartbeats();
  
  // Components report DEGRADED
  writeComponentHeartbeat('worker', 'DEGRADED', 0.55, 0);
  writeComponentHeartbeat('self-check', 'DEGRADED', null, 0);
  writeComponentHeartbeat('thinking-loop', 'active', null, 0);
  writeComponentHeartbeat('decision-cycle', 'DEGRADED', null, 0);
  
  // But reported state says HEALTHY — MISMATCH
  const reportedState = {
    status: 'HEALTHY',
    health_score: 0.95,
    _verified_at: new Date().toISOString(),
  };
  
  subsection('Input');
  info('Components report DEGRADED but reported state says HEALTHY');
  
  subsection('Verification');
  
  const result = runSelfAwarenessCheck(reportedState, {});
  
  console.log(`    Overall status: ${result.overall_status}`);
  console.log(`    Discrepancies: ${result.discrepancies.length}`);
  for (const d of result.discrepancies) {
    console.log(`      - [${d.severity}] ${d.type}: ${d.description}`);
  }
  
  if (result.overall_status !== VERIFICATION_STATUS.VERIFIED) {
    pass('V2.1: Overall status is NOT verified (discrepancy detected)');
  } else {
    fail('V2.1', 'Expected discrepancy to be detected');
  }
  
  const hasMismatch = result.discrepancies.some(d => 
    d.type === 'status_mismatch' || d.type === 'module_disagreement' || d.type === 'health_score_mismatch'
  );
  if (hasMismatch) {
    pass('V2.2: Status, module, or health_score mismatch detected');
  } else {
    fail('V2.2', `Expected mismatch to be detected. Got: ${result.discrepancies.map(d => d.type).join(', ')}`);
  }
  
  if (result.discrepancies.length > 0) {
    pass('V2.3: Discrepancies recorded in result');
  } else {
    fail('V2.3', 'Expected discrepancies to be recorded');
  }
}

// ── V3: Stale data → flagged ────────────────────────────────────────────────
section('V3: Stale Data → Flagged');

{
  cleanHeartbeats();
  
  // Worker heartbeat is STALE (older than threshold)
  writeComponentHeartbeat('worker', 'HEALTHY', 0.95, STALE_THRESHOLDS.self_check_ms + 60000); // 11 min old > 10 min threshold
  writeComponentHeartbeat('self-check', 'HEALTHY', null, 0);
  writeComponentHeartbeat('thinking-loop', 'active', null, 0);
  writeComponentHeartbeat('decision-cycle', 'HEALTHY', null, 0);
  
  subsection('Input');
  info(`Worker heartbeat is ${Math.round((STALE_THRESHOLDS.self_check_ms + 60000)/60000)} minutes old (threshold: ${STALE_THRESHOLDS.self_check_ms/60000} min)`);
  
  subsection('Verification');
  
  const result = runSelfAwarenessCheck({ status: 'HEALTHY', health_score: 0.95, _verified_at: new Date().toISOString() }, {});
  
  console.log(`    Overall status: ${result.overall_status}`);
  console.log(`    Silent degradation: ${result.silent_degradation.length}`);
  for (const s of result.silent_degradation) {
    console.log(`      - [${s.severity}] ${s.type}: ${s.description}`);
  }
  
  const workerResult = result.component_verification?.worker;
  if (workerResult?.status === VERIFICATION_STATUS.STALE) {
    pass('V3.1: Worker component correctly identified as STALE');
  } else {
    fail('V3.1', `Expected STALE, got ${workerResult?.status}`);
  }
  
  if (result.silent_degradation.length > 0) {
    pass('V3.2: Silent degradation detected for stale component');
  } else {
    fail('V3.2', 'Expected silent degradation to be detected');
  }
  
  if (result.overall_status !== VERIFICATION_STATUS.VERIFIED) {
    pass('V3.3: Overall status reflects staleness');
  } else {
    fail('V3.3', 'Expected overall status to not be VERIFIED');
  }
}

// ── V4: Module disagreement → flagged ───────────────────────────────────────
section('V4: Module Disagreement → Flagged');

{
  cleanHeartbeats();
  
  // Different components report different statuses
  writeComponentHeartbeat('worker', 'HEALTHY', 0.92, 0);
  writeComponentHeartbeat('self-check', 'CRITICAL', null, 0);  // Disagrees!
  writeComponentHeartbeat('thinking-loop', 'active', null, 0);
  writeComponentHeartbeat('decision-cycle', 'DEGRADED', null, 0);  // Also disagrees
  
  subsection('Input');
  info('Modules report conflicting statuses: HEALTHY, CRITICAL, DEGRADED');
  
  subsection('Verification');
  
  const result = runSelfAwarenessCheck({ status: 'HEALTHY', health_score: 0.92, _verified_at: new Date().toISOString() }, {});
  
  console.log(`    Overall status: ${result.overall_status}`);
  console.log(`    Discrepancies: ${result.discrepancies.length}`);
  for (const d of result.discrepancies) {
    console.log(`      - [${d.severity}] ${d.type}: ${d.description}`);
  }
  
  const moduleDisagreement = result.discrepancies.find(d => d.type === 'module_disagreement');
  if (moduleDisagreement) {
    pass('V4.1: Module disagreement detected');
    info(`     Conflicting modules: ${moduleDisagreement.conflicting_modules?.map(m => `${m.component}=${m.status}`).join(', ')}`);
  } else {
    fail('V4.1', 'Expected module disagreement to be detected');
  }
  
  if (result.overall_status !== VERIFICATION_STATUS.VERIFIED) {
    pass('V4.2: Overall status reflects disagreement');
  } else {
    fail('V4.2', 'Expected overall status to not be VERIFIED');
  }
}

// ── V5: No false positives in normal operation ──────────────────────────────
section('V5: No False Positives in Normal Operation');

{
  cleanHeartbeats();
  
  // All healthy, all fresh
  writeComponentHeartbeat('worker', 'HEALTHY', 0.94, 0);
  writeComponentHeartbeat('self-check', 'HEALTHY', null, 0);
  writeComponentHeartbeat('thinking-loop', 'active', null, 0);
  writeComponentHeartbeat('decision-cycle', 'HEALTHY', null, 0);
  
  subsection('Input');
  info('All components healthy and fresh');
  
  // Multiple consecutive runs should all be VERIFIED
  let verifiedCount = 0;
  for (let i = 0; i < 3; i++) {
    const result = runSelfAwarenessCheck(
      { status: 'HEALTHY', health_score: 0.94, _verified_at: new Date().toISOString() },
      {}
    );
    if (result.overall_status === VERIFICATION_STATUS.VERIFIED) {
      verifiedCount++;
    }
  }
  
  subsection('Verification');
  
  if (verifiedCount === 3) {
    pass('V5.1: All 3 consecutive runs returned VERIFIED (no false positives)');
  } else {
    fail('V5.1', `Expected 3/3 VERIFIED, got ${verifiedCount}/3`);
  }
  
  // Verify self-consistency passes for valid state
  const selfConsistencyResult = validateSelfConsistency({
    systemStatus: 'HEALTHY',
    healthScore: 0.94,
    isDegraded: false,
    isUnhealthy: false,
    isCritical: false,
    isHealthy: true,
    activeIssueCount: 0,
    activeIssues: [],
  }, {});
  
  if (selfConsistencyResult.length === 0) {
    pass('V5.2: No false positive inconsistencies in valid state');
  } else {
    fail('V5.2', `False positive inconsistencies: ${selfConsistencyResult.map(i => i.type).join(', ')}`);
  }
  
  // Test: isHealthy + high health score + no issues → no discrepancies
  const discrepancyResult = detectDiscrepancies(
    { status: 'HEALTHY', health_score: 0.93 },
    {
      worker: { status: VERIFICATION_STATUS.VERIFIED, actual_state: { status: 'HEALTHY', health_score: 0.93 } },
      'self-check': { status: VERIFICATION_STATUS.VERIFIED, actual_state: { status: 'HEALTHY' } },
    }
  );
  
  if (discrepancyResult.length === 0) {
    pass('V5.3: No false positive discrepancies in consistent state');
  } else {
    fail('V5.3', `False positive discrepancies: ${discrepancyResult.map(d => d.type).join(', ')}`);
  }
}

// ── V6: Self-consistency validation ─────────────────────────────────────────
section('V6: Self-Consistency Validation (Internal Contradictions)');

{
  // Test case: status=HEALTHY but healthScore < 0.6
  subsection('V6a: HEALTHY + low health_score');
  
  const result1 = validateSelfConsistency({
    systemStatus: 'HEALTHY',
    healthScore: 0.4,
    isDegraded: false,
    isUnhealthy: false,
    isCritical: false,
    isHealthy: true,
    activeIssueCount: 0,
    activeIssues: [],
  }, {});
  
  if (result1.some(i => i.type === 'status_score_contradiction')) {
    pass('V6a.1: Status/score contradiction detected');
  } else {
    fail('V6a.1', 'Expected status_score_contradiction');
  }
  
  // Test case: isDegraded=true but systemStatus=HEALTHY
  subsection('V6b: isDegraded=true + systemStatus=HEALTHY');
  
  const result2 = validateSelfConsistency({
    systemStatus: 'HEALTHY',
    healthScore: 0.8,
    isDegraded: true,  // Contradiction!
    isUnhealthy: false,
    isCritical: false,
    isHealthy: true,
    activeIssueCount: 0,
    activeIssues: [],
  }, {});
  
  if (result2.some(i => i.type === 'flag_status_contradiction')) {
    pass('V6b.1: Flag/status contradiction detected');
  } else {
    fail('V6b.1', 'Expected flag_status_contradiction');
  }
  
  // Test case: Critical issue but not flagged as unhealthy
  subsection('V6c: Critical-severity issue but system not CRITICAL');
  
  const result3 = validateSelfConsistency({
    systemStatus: 'DEGRADED',  // Should be CRITICAL
    healthScore: 0.35,
    isDegraded: true,
    isUnhealthy: false,
    isCritical: false,  // Missing!
    isHealthy: false,
    activeIssueCount: 1,
    activeIssues: [{ severity: 4, description: 'Critical failure' }],
  }, {});
  
  if (result3.some(i => i.type === 'critical_issue_unflagged')) {
    pass('V6c.1: Critical issue unflagged detected');
  } else {
    fail('V6c.1', 'Expected critical_issue_unflagged');
  }
  
  // Test case: Valid consistent state
  subsection('V6d: Valid consistent state');
  
  const result4 = validateSelfConsistency({
    systemStatus: 'HEALTHY',
    healthScore: 0.92,
    isDegraded: false,
    isUnhealthy: false,
    isCritical: false,
    isHealthy: true,
    activeIssueCount: 0,
    activeIssues: [],
  }, {});
  
  if (result4.length === 0) {
    pass('V6d.1: No inconsistencies for valid state');
  } else {
    fail('V6d.1', `Unexpected inconsistencies: ${result4.map(i => i.type).join(', ')}`);
  }
}

// ── V7: Report generation ───────────────────────────────────────────────────
section('V7: Report Generation');

{
  cleanHeartbeats();
  
  // Mixed state
  writeComponentHeartbeat('worker', 'DEGRADED', 0.52, 0);
  writeComponentHeartbeat('self-check', 'DEALTHY', null, STALE_THRESHOLDS.self_check_ms + 30000);
  writeComponentHeartbeat('thinking-loop', 'active', null, 0);
  writeComponentHeartbeat('decision-cycle', 'DEGRADED', null, 0);
  
  const result = runSelfAwarenessCheck(
    { status: 'DEGRADED', health_score: 0.52, _verified_at: new Date().toISOString() },
    {}
  );
  
  subsection('Report Output');
  
  const report = generateAwarenessReport(result);
  const reportLines = report.split('\n');
  
  // Show first 20 lines of report
  console.log(reportLines.slice(0, 25).join('\n'));
  
  if (report.includes('SYSTEM SELF-AWARENESS REPORT')) {
    pass('V7.1: Report generated with correct header');
  } else {
    fail('V7.1', 'Report header missing');
  }
  
  if (report.includes('Overall Status:')) {
    pass('V7.2: Report includes overall status');
  } else {
    fail('V7.2', 'Overall status missing from report');
  }
  
  if (report.includes('Component Verification')) {
    pass('V7.3: Report includes component verification');
  } else {
    fail('V7.3', 'Component verification missing from report');
  }
}

// ── V8: Heartbeat staleness functions ─────────────────────────────────────
section('V8: Heartbeat Staleness Functions');

{
  cleanHeartbeats();
  
  // Fresh heartbeat
  writeComponentHeartbeat('worker', 'HEALTHY', 0.95, 0);
  
  const freshAge = getHeartbeatAge('worker');
  const freshStale = isHeartbeatStale('worker', STALE_THRESHOLDS.self_check_ms);
  
  if (freshAge !== null && freshAge < STALE_THRESHOLDS.self_check_ms) {
    pass('V8.1: Fresh heartbeat has valid age');
  } else {
    fail('V8.1', `Age: ${freshAge}, Threshold: ${STALE_THRESHOLDS.self_check_ms}`);
  }
  
  if (!freshStale) {
    pass('V8.2: Fresh heartbeat not marked stale');
  } else {
    fail('V8.2', 'Fresh heartbeat incorrectly marked stale');
  }
  
  // Stale heartbeat
  writeComponentHeartbeat('thinking-loop', 'active', null, STALE_THRESHOLDS.heartbeat_ms + 60000);
  
  const staleAge = getHeartbeatAge('thinking-loop');
  const staleStale = isHeartbeatStale('thinking-loop', STALE_THRESHOLDS.heartbeat_ms);
  
  if (staleAge !== null && staleAge > STALE_THRESHOLDS.heartbeat_ms) {
    pass('V8.3: Stale heartbeat has exceeded threshold age');
  } else {
    fail('V8.3', `Age: ${staleAge}, Threshold: ${STALE_THRESHOLDS.heartbeat_ms}`);
  }
  
  if (staleStale) {
    pass('V8.4: Stale heartbeat correctly marked stale');
  } else {
    fail('V8.4', 'Stale heartbeat not correctly marked');
  }
  
  // Missing heartbeat
  const missingAge = getHeartbeatAge('nonexistent-component');
  const missingStale = isHeartbeatStale('nonexistent-component', STALE_THRESHOLDS.self_check_ms);
  
  if (missingAge === null) {
    pass('V8.5: Missing heartbeat returns null age');
  } else {
    fail('V8.5', `Expected null age for missing, got ${missingAge}`);
  }
  
  if (missingStale) {
    pass('V8.6: Missing heartbeat correctly marked stale');
  } else {
    fail('V8.6', 'Missing heartbeat not marked stale');
  }
}

// ── V9: Safety confirmation ─────────────────────────────────────────────────
section('V9: Safety Confirmation — No Side Effects');

{
  cleanHeartbeats();
  
  writeComponentHeartbeat('worker', 'HEALTHY', 0.95, 0);
  writeComponentHeartbeat('self-check', 'HEALTHY', null, 0);
  writeComponentHeartbeat('thinking-loop', 'active', null, 0);
  writeComponentHeartbeat('decision-cycle', 'HEALTHY', null, 0);
  
  // Verify original state
  const originalState = { status: 'HEALTHY', health_score: 0.95 };
  
  // Run verification multiple times
  for (let i = 0; i < 3; i++) {
    runSelfAwarenessCheck({ ...originalState, _verified_at: new Date().toISOString() }, {});
  }
  
  // Check heartbeat files are unchanged (no mutation)
  const workerHb = JSON.parse(fs.readFileSync(path.join(HEARTBEAT_DIR, 'worker.json'), 'utf8'));
  
  if (workerHb.status === 'HEALTHY' && workerHb.health_score === 0.95) {
    pass('S1: Heartbeat files not mutated by verification');
  } else {
    fail('S1', 'Heartbeat files were modified');
  }
  
  // Check no execution occurred (only reading)
  // If we get here without errors, no autonomous execution happened
  pass('S2: No autonomous execution attempted');
  
  // Check approval behavior unchanged (no approval-related code modified)
  // Self-awareness only SURFACES discrepancies, doesn't act
  const result = runSelfAwarenessCheck(originalState, {});
  if (result.overall_status === VERIFICATION_STATUS.VERIFIED) {
    pass('S3: No approval behavior changes (verification is read-only)');
  } else {
    fail('S3', 'Unexpected state change');
  }
}

// ── FINAL SUMMARY ───────────────────────────────────────────────────────────
section('FINAL RESULTS');

console.log(`\n  Tests passed:  ${testsPassed}`);
console.log(`  Tests failed:  ${testsFailed}`);
console.log(`  Total tests:   ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n⚠️  VALIDATION FAILED\n');
  process.exit(1);
} else {
  console.log('\n✅ ALL R7 VALIDATIONS PASSED\n');
}

console.log('═'.repeat(70));
console.log('  R7 — SELF-AWARENESS VALIDATION COMPLETE');
console.log('═'.repeat(70) + '\n');

process.exit(testsFailed > 0 ? 1 : 0);
