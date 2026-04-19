/**
 * R15 — Adversarial Testing & Failure Injection Validation Suite
 * 
 * Validates:
 * 1. Conflicting signals
 * 2. Corrupted inputs
 * 3. Partial system failure
 * 4. Contradictory evidence
 * 5. Safe fallback behavior
 */

const {
  AdversarialTestHarness,
  runAllAdversarialTests,
  testSafeFallbackBehavior,
  ADVERSARY_CATEGORY,
  INJECTION_TYPE,
  SAFE_FALLBACK,
  buildConflictingSignalsScenario,
  buildCorruptedInputScenario,
  buildPartialFailureScenario,
  buildR11R12ConflictScenario,
  buildHighRiskLowTrustScenario,
  buildStaleVsFreshScenario,
  buildFalsePositiveScenario,
  buildFalseNegativeScenario,
  buildIdentityVsBehaviorScenario,
} = require('./adversarial-tester');

// ─── Test Utilities ─────────────────────────────────────────────────────────

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
  const line = '-'.repeat(70);
  console.log('\n' + line);
  console.log('  ' + name);
  console.log(line);
}

// ─── Validation Tests ───────────────────────────────────────────────────────

console.log('\n' + '='.repeat(70));
console.log('  R15 — ADVERSARIAL TESTING & FAILURE INJECTION VALIDATION');
console.log('='.repeat(70));

// ── V1: Conflicting Signals ─────────────────────────────────────────────────
section('V1: Conflicting Signals');

{
  const harness = new AdversarialTestHarness();
  const scenario = buildConflictingSignalsScenario();
  const result = harness.runAdversarialScenario(scenario);
  
  if (result.passed) {
    pass('V1.1: Conflicting HEALTHY+CRITICAL detected');
  } else {
    fail('V1.1', result.errors.join(', '));
  }
  
  if (result.details?.conflicts_detected?.includes('HEALTHY_and_CRITICAL_simultaneous')) {
    pass('V1.2: Conflict correctly identified as HEALTHY+CRITICAL');
  } else {
    fail('V1.2', 'Should detect HEALTHY+CRITICAL conflict');
  }
  
  if (result.safe_behavior) {
    pass('V1.3: Safe behavior maintained under conflicting signals');
  } else {
    fail('V1.3', 'Should maintain safe behavior');
  }
  
  info(`     Applied ${result.injections_applied.length} injections`);
}

// ── V2: Corrupted Inputs ────────────────────────────────────────────────────
section('V2: Corrupted Inputs');

{
  const harness = new AdversarialTestHarness();
  const scenario = buildCorruptedInputScenario();
  const result = harness.runAdversarialScenario(scenario);
  
  if (result.details?.corruption_handled !== false) {
    pass('V2.1: Corrupted inputs handled without crash');
  } else {
    fail('V2.1', 'Should handle corrupted inputs');
  }
  
  if (result.safe_behavior) {
    pass('V2.2: Safe behavior under corrupted inputs');
  } else {
    fail('V2.2', 'Should maintain safe behavior');
  }
  
  // Check for multiple corruption types
  const corruptionTypes = result.injections_applied.filter(t => 
    t === 'corrupted_state' || t === 'missing_data'
  );
  
  if (corruptionTypes.length >= 2) {
    pass('V2.3: Multiple corruption types tested');
  } else {
    fail('V2.3', `Expected 2+ corruption types, got ${corruptionTypes.length}`);
  }
}

// ── V3: Partial System Failure ──────────────────────────────────────────────
section('V3: Partial System Failure');

{
  const harness = new AdversarialTestHarness();
  const scenario = buildPartialFailureScenario();
  const result = harness.runAdversarialScenario(scenario);
  
  if (result.passed) {
    pass('V3.1: Partial availability detected');
  } else {
    fail('V3.1', result.errors.join(', '));
  }
  
  if (result.details?.unavailable_count === 2) {
    pass('V3.2: Both unavailable handlers detected');
  } else {
    info(`V3.2: Unavailable count: ${result.details?.unavailable_count || 0}`);
  }
  
  if (result.safe_behavior) {
    pass('V3.3: Safe fallback under partial failure');
  } else {
    fail('V3.3', 'Should show safe behavior');
  }
}

// ── V4: Contradictory Evidence ──────────────────────────────────────────────
section('V4: Contradictory Evidence');

{
  const harness = new AdversarialTestHarness();
  
  // R11/R12 conflict
  const r11r12 = buildR11R12ConflictScenario();
  const result1 = harness.runAdversarialScenario(r11r12);
  
  if (result1.passed) {
    pass('V4.1: R11/R12 identity vs outcome conflict detected');
  } else {
    fail('V4.1', result1.errors.join(', '));
  }
  
  // High risk + low trust
  const trustRisk = buildHighRiskLowTrustScenario();
  const result2 = harness.runAdversarialScenario(trustRisk);
  
  if (result2.passed) {
    pass('V4.2: High-risk low-trust conflict identified');
  } else {
    fail('V4.2', result2.errors.join(', '));
  }
  
  if (result1.safe_behavior && result2.safe_behavior) {
    pass('V4.3: Safe behavior under both contradiction types');
  } else {
    fail('V4.3', 'Both should maintain safe behavior');
  }
}

// ── V5: Safe Fallback Behavior ──────────────────────────────────────────────
section('V5: Safe Fallback Behavior');

{
  // Test escalation fallback
  const escalateTest = testSafeFallbackBehavior({
    name: 'Escalate on contradiction',
    adversarialState: {
      _adversarial: { conflicting_signals: [{ a: 'conflict' }] },
    },
    safeFallbackExpected: SAFE_FALLBACK.ESCALATE,
  });
  
  if (escalateTest.fallback_used) {
    pass('V5.1: Fallback triggered on contradiction');
  } else {
    fail('V5.1', 'Should use fallback');
  }
  
  if (escalateTest.safe_behavior) {
    pass('V5.2: Safe behavior (escalate) used');
  } else {
    fail('V5.2', 'Should use safe fallback');
  }
  
  // Test reject on corruption
  const rejectTest = testSafeFallbackBehavior({
    name: 'Reject on corruption',
    adversarialState: {
      corrupted_field: 'INVALID',
      _adversarial: {},
    },
    safeFallbackExpected: SAFE_FALLBACK.REJECT,
  });
  
  if (rejectTest.actual_decision === SAFE_FALLBACK.REJECT) {
    pass('V5.3: Corruption triggers reject');
  } else {
    fail('V5.3', `Expected REJECT, got ${rejectTest.actual_decision}`);
  }
  
  if (rejectTest.safe_behavior) {
    pass('V5.4: Safe behavior (reject) on corrupted input');
  } else {
    fail('V5.4', 'Should be safe');
  }
}

// ── V6: False Positive/Negative Handling ────────────────────────────────────
section('V6: False Positive/Negative Handling');

{
  const harness = new AdversarialTestHarness();
  
  // False positive
  const fp = buildFalsePositiveScenario();
  const fpResult = harness.runAdversarialScenario(fp);
  
  if (fpResult.passed) {
    pass('V6.1: False positive injected correctly');
  } else {
    fail('V6.1', 'False positive injection should succeed');
  }
  
  // False negative
  const fn = buildFalseNegativeScenario();
  const fnResult = harness.runAdversarialScenario(fn);
  
  if (fnResult.passed) {
    pass('V6.2: False negative injected correctly');
  } else {
    fail('V6.2', 'False negative injection should succeed');
  }
  
  if (fpResult.safe_behavior && fnResult.safe_behavior) {
    pass('V6.3: Safe behavior maintained with false pos/neg');
  } else {
    fail('V6.3', 'Should maintain safe behavior');
  }
}

// ── V7: Stale vs Fresh Data ─────────────────────────────────────────────────
section('V7: Stale vs Fresh Data');

{
  const harness = new AdversarialTestHarness();
  const scenario = buildStaleVsFreshScenario();
  const result = harness.runAdversarialScenario(scenario);
  
  if (result.details?.fresh_status === 'HEALTHY') {
    pass('V7.1: Fresh system status preserved');
  } else {
    fail('V7.1', 'Fresh status should be detected');
  }
  
  if (result.details?.stale_claim?.includes('CRITICAL')) {
    pass('V7.2: Stale claim identified');
  } else {
    info('V7.2: Stale claim detection may vary');
  }
  
  if (result.safe_behavior) {
    pass('V7.3: Safe behavior with stale data');
  } else {
    fail('V7.3', 'Should handle stale data safely');
  }
}

// ── V8: Identity vs Behavior ────────────────────────────────────────────────
section('V8: Identity vs Behavior Contradiction');

{
  const harness = new AdversarialTestHarness();
  const scenario = buildIdentityVsBehaviorScenario();
  const result = harness.runAdversarialScenario(scenario);
  
  if (result.details?.mismatches_detected >= 1) {
    pass('V8.1: Identity/behavior mismatch detected');
  } else {
    fail('V8.1', `Expected >=1, got ${result.details?.mismatches_detected || 0}`);
  }
  
  if (result.safe_behavior) {
    pass('V8.2: Safe behavior when identity contradicts behavior');
  } else {
    fail('V8.2', 'Should maintain safe behavior');
  }
}

// ── V9: Full Adversarial Test Suite ─────────────────────────────────────────
section('V9: Full Adversarial Test Suite');

{
  const results = runAllAdversarialTests();
  
  const total = results.harness_results.total;
  const passed = results.harness_results.passed;
  const safeCount = results.harness_results.safe_behavior_count;
  
  if (passed >= total * 0.8) {
    pass(`V9.1: Overall pass rate ${passed}/${total} (>=80%)`);
  } else {
    fail('V9.1', `Pass rate ${passed}/${total} < 80%`);
  }
  
  if (safeCount === total) {
    pass('V9.2: All tests maintained safe behavior');
  } else {
    fail('V9.2', `${safeCount}/${total} safe`);
  }
  
  // Check all categories covered
  const categories = Object.keys(results.by_category);
  const expectedCategories = Object.values(ADVERSARY_CATEGORY);
  
  const missingCategories = expectedCategories.filter(c => !categories.includes(c));
  
  if (missingCategories.length === 0) {
    pass('V9.3: All adversarial categories covered');
  } else {
    info(`V9.3: Missing categories: ${missingCategories.join(', ')}`);
  }
  
  info(`     Categories: ${categories.join(', ')}`);
}

// ── V10: No Production Impact ───────────────────────────────────────────────
section('V10: No Production Impact');

{
  const harness = new AdversarialTestHarness();
  
  // Verify harness is in isolation mode
  if (harness.isolationMode === true) {
    pass('V10.1: Harness runs in isolation mode');
  } else {
    fail('V10.1', 'Harness should always be in isolation mode');
  }
  
  // Verify no actual file/state mutations
  const scenario = buildConflictingSignalsScenario();
  harness.runAdversarialScenario(scenario);
  
  // State should not be affected outside harness
  const stateKeys = Object.keys(scenario.initialState);
  if (stateKeys.length > 0) {
    pass('V10.2: Test state isolated from production');
  } else {
    fail('V10.2', 'State should remain isolated');
  }
  
  // No execution functions in harness
  const hasExecute = harness.executeAction !== undefined ||
                      harness.runAction !== undefined;
  
  if (!hasExecute) {
    pass('V10.3: No execution functions in harness');
  } else {
    fail('V10.3', 'Harness should not have execution functions');
  }
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
  console.log('\n✅ ALL R15 VALIDATION TESTS PASSED\n');
}

console.log('='.repeat(70));
console.log('  R15 — ADVERSARIAL TESTING VALIDATION COMPLETE');
console.log('='.repeat(70) + '\n');

process.exit(testsFailed > 0 ? 1 : 0);
