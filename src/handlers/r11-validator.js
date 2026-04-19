/**
 * R11 — Outcome Evaluation Validation Suite
 * 
 * Validates:
 * 1. Correct outcome match detection
 * 2. Mismatch detection
 * 3. Partial success handling
 * 4. Reliability score tracking over multiple cycles
 * 5. Confidence adjustment within bounds
 * 6. No drift in approval or safety rules
 * 7. Repeated failure triggers appropriate suppression
 */

const {
  recordOutcome,
  evaluateOutcome,
  getActionReliability,
  checkFailurePattern,
  detectSystematicFailures,
  getLearningInfluence,
  getConfidenceWeightForAction,
  getRecommendationAdjustment,
  getOutcomeSummary,
  getAuditLog,
  getRecentOutcomes,
  runOutcomeEvaluationCycle,
  resetCaches,
  OUTCOME_MATCH,
  IMPACT_LEVEL,
  CONFIDENCE_DELTA,
  TREND,
  ACTION_CONFIDENCE,
  FROZEN_CONSTRAINTS,
} = require('./outcome-evaluation');

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
  console.log('═'.repeat(70)}`);
}

function resetState() {
  resetCaches();
  const STORE_PATH = path.join(__dirname, '../../state/outcome-evaluation.json');
  if (fs.existsSync(STORE_PATH)) {
    fs.unlinkSync(STORE_PATH);
  }
}

// ─── Validation Tests ─────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(70));
console.log('  R11 — OUTCOME EVALUATION VALIDATION');
console.log('═'.repeat(70));

resetState();

// ── V1: Correct outcome match detection ─────────────────────────────────────
section('V1: Correct Outcome Match Detection');

{
  // Test MATCH: expected is contained in actual
  const matchOutcome = evaluateOutcome({
    expected_outcome: 'cache warmed',
    actual_outcome: 'cache warmed successfully',
  });
  
  if (matchOutcome.outcome_match === OUTCOME_MATCH.MATCH) {
    pass('V1.1: Expected contained in actual → MATCH');
  } else {
    fail('V1.1', `Expected MATCH, got ${matchOutcome.outcome_match}`);
  }
  
  // Test MATCH with success signals
  const matchSuccess = evaluateOutcome({
    expected_outcome: 'issue resolved',
    actual_outcome: 'the issue has been resolved and the system is stable',
  });
  
  if (matchSuccess.outcome_match === OUTCOME_MATCH.MATCH) {
    pass('V1.2: Success signals in actual → MATCH');
  } else {
    fail('V1.2', `Expected MATCH, got ${matchSuccess.outcome_match}`);
  }
  
  // Positive impact for MATCH
  if (matchOutcome.impact_level === IMPACT_LEVEL.POSITIVE) {
    pass('V1.3: MATCH → POSITIVE impact');
  } else {
    fail('V1.3', `Expected POSITIVE, got ${matchOutcome.impact_level}`);
  }
  
  // Confidence increase for MATCH
  if (matchOutcome.confidence_delta === CONFIDENCE_DELTA.INCREASE) {
    pass('V1.4: MATCH → confidence INCREASE');
  } else {
    fail('V1.4', `Expected INCREASE, got ${matchOutcome.confidence_delta}`);
  }
}

// ── V2: Mismatch detection ───────────────────────────────────────────────────
section('V2: Mismatch Detection');

{
  // Test MISMATCH with failure signals
  const mismatchOutcome = evaluateOutcome({
    expected_outcome: 'query optimized',
    actual_outcome: 'query failed with timeout error',
  });
  
  if (mismatchOutcome.outcome_match === OUTCOME_MATCH.MISMATCH) {
    pass('V2.1: Failure signal → MISMATCH');
  } else {
    fail('V2.1', `Expected MISMATCH, got ${mismatchOutcome.outcome_match}`);
  }
  
  // Negative impact for MISMATCH
  if (mismatchOutcome.impact_level === IMPACT_LEVEL.NEGATIVE) {
    pass('V2.2: MISMATCH → NEGATIVE impact');
  } else {
    fail('V2.2', `Expected NEGATIVE, got ${mismatchOutcome.impact_level}`);
  }
  
  // Confidence decrease for MISMATCH
  if (mismatchOutcome.confidence_delta === CONFIDENCE_DELTA.DECREASE) {
    pass('V2.3: MISMATCH → confidence DECREASE');
  } else {
    fail('V2.3', `Expected DECREASE, got ${mismatchOutcome.confidence_delta}`);
  }
  
  // Test MISMATCH with "did not" signal
  const didNotOutcome = evaluateOutcome({
    expected_outcome: 'system stable',
    actual_outcome: 'system did not become stable',
  });
  
  if (didNotOutcome.outcome_match === OUTCOME_MATCH.MISMATCH) {
    pass('V2.4: "did not" signal → MISMATCH');
  } else {
    fail('V2.4', `Expected MISMATCH, got ${didNotOutcome.outcome_match}`);
  }
}

// ── V3: Partial success handling ──────────────────────────────────────────────
section('V3: Partial Success Handling');

{
  // Test PARTIAL with partial signals
  const partialOutcome = evaluateOutcome({
    expected_outcome: 'fully optimized',
    actual_outcome: 'partially optimized but some improvements pending',
  });
  
  if (partialOutcome.outcome_match === OUTCOME_MATCH.PARTIAL) {
    pass('V3.1: Partial signal → PARTIAL');
  } else {
    fail('V3.1', `Expected PARTIAL, got ${partialOutcome.outcome_match}`);
  }
  
  // Neutral impact for PARTIAL
  if (partialOutcome.impact_level === IMPACT_LEVEL.NEUTRAL) {
    pass('V3.2: PARTIAL → NEUTRAL impact');
  } else {
    fail('V3.2', `Expected NEUTRAL, got ${partialOutcome.impact_level}`);
  }
  
  // No confidence change for PARTIAL
  if (partialOutcome.confidence_delta === CONFIDENCE_DELTA.NO_CHANGE) {
    pass('V3.3: PARTIAL → confidence NO_CHANGE');
  } else {
    fail('V3.3', `Expected NO_CHANGE, got ${partialOutcome.confidence_delta}`);
  }
  
  // Test UNKNOWN with empty actual
  const unknownOutcome = evaluateOutcome({
    expected_outcome: 'something',
    actual_outcome: '',
  });
  
  if (unknownOutcome.outcome_match === OUTCOME_MATCH.UNKNOWN) {
    pass('V3.4: Empty actual → UNKNOWN');
  } else {
    fail('V3.4', `Expected UNKNOWN, got ${unknownOutcome.outcome_match}`);
  }
}

// ── V4: Reliability tracking over multiple cycles ─────────────────────────────
section('V4: Reliability Tracking Over Multiple Cycles');

{
  resetState();
  
  // Record multiple outcomes
  recordOutcome({
    action_id: 'test_action',
    expected_outcome: 'success',
    actual_outcome: 'succeeded',
  });
  
  recordOutcome({
    action_id: 'test_action',
    expected_outcome: 'success',
    actual_outcome: 'completed successfully',
  });
  
  recordOutcome({
    action_id: 'test_action',
    expected_outcome: 'success',
    actual_outcome: 'worked',
  });
  
  const reliability = getActionReliability('test_action');
  
  if (reliability) {
    pass('V4.1: Reliability record created for action');
  } else {
    fail('V4.1', 'Reliability record not found');
  }
  
  if (reliability.total_evaluations === 3) {
    pass('V4.2: Total evaluations = 3');
  } else {
    fail('V4.2', `Expected 3, got ${reliability.total_evaluations}`);
  }
  
  if (reliability.match_count === 3) {
    pass('V4.3: All 3 evaluated as MATCH');
  } else {
    fail('V4.3', `Expected 3 matches, got ${reliability.match_count}`);
  }
  
  if (reliability.current_confidence > ACTION_CONFIDENCE.INITIAL) {
    pass('V4.4: Confidence increased from initial');
    info(`     Initial: ${ACTION_CONFIDENCE.INITIAL}, Current: ${reliability.current_confidence.toFixed(3)}`);
  } else {
    fail('V4.4', 'Confidence should increase after successes');
  }
}

// ── V5: Confidence adjustment within bounds ────────────────────────────────────
section('V5: Confidence Adjustment Within Bounds');

{
  resetState();
  
  // Record failure to decrease confidence
  recordOutcome({
    action_id: 'low_conf_test',
    expected_outcome: 'success',
    actual_outcome: 'failed completely',
  });
  
  const afterFailure = getActionReliability('low_conf_test');
  
  if (afterFailure.current_confidence < ACTION_CONFIDENCE.INITIAL) {
    pass('V5.1: Confidence decreased after failure');
  } else {
    fail('V5.1', `Expected decrease, got ${afterFailure.current_confidence}`);
  }
  
  // Record successes to increase confidence
  for (let i = 0; i < 10; i++) {
    recordOutcome({
      action_id: 'high_conf_test',
      expected_outcome: 'success',
      actual_outcome: 'succeeded',
    });
  }
  
  const afterSuccesses = getActionReliability('high_conf_test');
  
  // Should be at or near MAX
  if (afterSuccesses.current_confidence >= ACTION_CONFIDENCE.MAX_CONFIDENCE - 0.01) {
    pass('V5.2: Confidence at or near MAX after multiple successes');
    info(`     Confidence: ${afterSuccesses.current_confidence.toFixed(3)}`);
  } else {
    fail('V5.2', `Expected near ${ACTION_CONFIDENCE.MAX_CONFIDENCE}, got ${afterSuccesses.current_confidence}`);
  }
  
  // Record failures to decrease confidence to floor
  for (let i = 0; i < 15; i++) {
    recordOutcome({
      action_id: 'floor_test',
      expected_outcome: 'success',
      actual_outcome: 'failed',
    });
  }
  
  const atFloor = getActionReliability('floor_test');
  
  if (atFloor.current_confidence <= ACTION_CONFIDENCE.MIN_CONFIDENCE + 0.01) {
    pass('V5.3: Confidence at floor (MIN) after repeated failures');
    info(`     Confidence: ${atFloor.current_confidence.toFixed(3)}`);
  } else {
    fail('V5.3', `Expected near ${ACTION_CONFIDENCE.MIN_CONFIDENCE}, got ${atFloor.current_confidence}`);
  }
}

// ── V6: No drift in approval or safety rules ────────────────────────────────
section('V6: No Drift in Approval or Safety Rules');

{
  resetState();
  
  // Record some outcomes
  recordOutcome({
    action_id: 'safety_test',
    expected_outcome: 'safe action',
    actual_outcome: 'safe and completed',
  });
  
  // Get learning influence
  const influence = getLearningInfluence('safety_test');
  
  // Verify frozen constraints are NOT modified
  if (influence.frozen_constraints_unmodified) {
    pass('V6.1: Frozen constraints list is maintained');
  } else {
    fail('V6.1', 'Frozen constraints should be listed');
  }
  
  // Verify only allowed modifications
  const allowedFields = ['recommendation_strength', 'confidence_weight', 'priority_signal', 'suppressed', 'reason'];
  const returnedFields = Object.keys(influence).filter(k => !allowedFields.includes(k) && !k.startsWith('current_') && !k.startsWith('frozen_') && k !== 'trend');
  
  if (returnedFields.length === 0) {
    pass('V6.2: No unauthorized field modifications');
  } else {
    fail('V6.2', `Unexpected fields modified: ${returnedFields.join(', ')}`);
  }
  
  // Verify FROZEN_CONSTRAINTS is exported
  const frozenList = FROZEN_CONSTRAINTS;
  if (frozenList.includes('approval_requirements') && frozenList.includes('action_classification')) {
    pass('V6.3: Frozen constraints include approval and classification');
  } else {
    fail('V6.3', 'Frozen constraints incomplete');
  }
  
  // Verify recommendation_strength is bounded 0-1
  if (influence.recommendation_strength >= 0 && influence.recommendation_strength <= 1) {
    pass('V6.4: Recommendation strength bounded [0, 1]');
  } else {
    fail('V6.4', `Out of bounds: ${influence.recommendation_strength}`);
  }
}

// ── V7: Repeated failure triggers suppression ───────────────────────────────
section('V7: Repeated Failure Triggers Suppression');

{
  resetState();
  
  // Record 3+ mismatches
  for (let i = 0; i < 4; i++) {
    recordOutcome({
      action_id: 'failing_action',
      expected_outcome: 'success',
      actual_outcome: 'error occurred',
    });
  }
  
  // Check if pattern detected
  const pattern = checkFailurePattern('failing_action');
  
  if (pattern.isPattern) {
    pass('V7.1: Failure pattern detected after 3+ mismatches');
  } else {
    fail('V7.1', 'Expected pattern detection');
  }
  
  // Check if suppressed
  const reliability = getActionReliability('failing_action');
  if (reliability.suppressed) {
    pass('V7.2: Action automatically suppressed');
    info(`     Reason: ${reliability.suppression_reason}`);
  } else {
    fail('V7.2', 'Action should be suppressed after failure pattern');
  }
  
  // Check learning influence returns suppressed
  const influence = getLearningInfluence('failing_action');
  if (influence.suppressed && influence.recommendation_strength === 0) {
    pass('V7.3: Learning influence reflects suppression');
  } else {
    fail('V7.3', `Suppressed=${influence.suppressed}, strength=${influence.recommendation_strength}`);
  }
  
  // Check recommendation adjustment
  const adjustment = getRecommendationAdjustment('failing_action', {});
  if (adjustment.suppress) {
    pass('V7.4: Recommendation adjustment triggers suppression');
  } else {
    fail('V7.4', 'Should recommend suppression');
  }
}

// ── V8: Outcome summary and audit ───────────────────────────────────────────
section('V8: Outcome Summary and Audit');

{
  resetState();
  
  // Record some outcomes
  recordOutcome({
    action_id: 'audit_test',
    expected_outcome: 'completed',
    actual_outcome: 'succeeded',
  });
  
  recordOutcome({
    action_id: 'audit_test_2',
    expected_outcome: 'resolved',
    actual_outcome: 'failed',
  });
  
  const summary = getOutcomeSummary();
  
  if (summary.total_evaluations >= 2) {
    pass('V8.1: Outcome summary tracks total evaluations');
  } else {
    fail('V8.1', `Expected >= 2, got ${summary.total_evaluations}`);
  }
  
  const recent = getRecentOutcomes(10);
  if (recent.length >= 2) {
    pass('V8.2: Recent outcomes returned');
  } else {
    fail('V8.2', `Expected >= 2, got ${recent.length}`);
  }
  
  const auditLog = getAuditLog({});
  if (auditLog.length > 0) {
    pass('V8.3: Audit log populated');
    info(`     Events: ${auditLog.map(e => e.event_type).join(', ')}`);
  } else {
    fail('V8.3', 'Audit log should not be empty');
  }
  
  // Check systematic failures detection
  const failures = detectSystematicFailures();
  if (failures.length > 0) {
    pass('V8.4: Systematic failures detected');
  } else {
    info('V8.4: No systematic failures (expected for new data)');
  }
}

// ── V9: Integration test — full cycle ────────────────────────────────────────
section('V9: Full Evaluation Cycle');

{
  resetState();
  
  const outcomes = [
    { action_id: 'cycle_action_1', expected_outcome: 'success', actual_outcome: 'completed' },
    { action_id: 'cycle_action_2', expected_outcome: 'fixed', actual_outcome: 'error occurred' },
    { action_id: 'cycle_action_2', expected_outcome: 'fixed', actual_outcome: 'resolved' },
    { action_id: 'cycle_action_3', expected_outcome: 'optimized', actual_outcome: 'partially optimized' },
  ];
  
  const result = runOutcomeEvaluationCycle(outcomes);
  
  if (result.recorded_count === 4) {
    pass('V9.1: All outcomes recorded in cycle');
  } else {
    fail('V9.1', `Expected 4, got ${result.recorded_count}`);
  }
  
  if (result.learning_influences.length === 3) {
    pass('V9.2: Learning influences computed for all unique actions');
  } else {
    fail('V9.2', `Expected 3 unique actions, got ${result.learning_influences.length}`);
  }
  
  if (result.systematic_failures) {
    pass('V9.3: Systematic failures detected');
  } else {
    info('V9.3: No systematic failures (expected)');
  }
  
  if (result.summary) {
    pass('V9.4: Summary generated');
  } else {
    fail('V9.4', 'Summary should be generated');
  }
}

// ── V10: Trend calculation ─────────────────────────────────────────────────
section('V10: Trend Calculation');

{
  resetState();
  
  // Record pattern: IMPROVING
  for (let i = 0; i < 5; i++) {
    recordOutcome({
      action_id: 'improving_action',
      expected_outcome: 'success',
      actual_outcome: 'succeeded',
    });
  }
  
  const improving = getActionReliability('improving_action');
  if (improving.trend === TREND.IMPROVING) {
    pass('V10.1: Trend correctly identified as IMPROVING');
  } else {
    fail('V10.1', `Expected IMPROVING, got ${improving.trend}`);
  }
  
  // Record pattern: DEGRADING
  resetState();
  
  for (let i = 0; i < 5; i++) {
    recordOutcome({
      action_id: 'degrading_action',
      expected_outcome: 'success',
      actual_outcome: i < 4 ? 'failed' : 'succeeded',
    });
  }
  
  const degrading = getActionReliability('degrading_action');
  if (degrading.trend === TREND.DEGRADING) {
    pass('V10.2: Trend correctly identified as DEGRADING');
  } else {
    fail('V10.2', `Expected DEGRADING, got ${degrading.trend}`);
  }
  
  // STABLE
  resetState();
  
  recordOutcome({
    action_id: 'stable_action',
    expected_outcome: 'success',
    actual_outcome: 'succeeded',
  });
  recordOutcome({
    action_id: 'stable_action',
    expected_outcome: 'success',
    actual_outcome: 'failed',
  });
  
  const stable = getActionReliability('stable_action');
  if (stable.trend === TREND.STABLE) {
    pass('V10.3: Trend correctly identified as STABLE');
  } else {
    fail('V10.3', `Expected STABLE, got ${stable.trend}`);
  }
}

// ── V11: Priority signal integration ───────────────────────────────────────
section('V11: Priority Signal Integration');

{
  resetState();
  
  // High confidence + improving → preferred
  for (let i = 0; i < 5; i++) {
    recordOutcome({
      action_id: 'preferred_action',
      expected_outcome: 'success',
      actual_outcome: 'completed successfully',
    });
  }
  
  const preferredInfluence = getLearningInfluence('preferred_action');
  if (preferredInfluence.priority_signal === 'preferred') {
    pass('V11.1: High confidence + improving → preferred signal');
  } else {
    fail('V11.1', `Expected preferred, got ${preferredInfluence.priority_signal}`);
  }
  
  // Low confidence + degrading → deprioritized
  resetState();
  
  for (let i = 0; i < 10; i++) {
    recordOutcome({
      action_id: 'deprioritized_action',
      expected_outcome: 'success',
      actual_outcome: 'failed',
    });
  }
  
  const deprioritizedInfluence = getLearningInfluence('deprioritized_action');
  if (deprioritizedInfluence.priority_signal === 'deprioritized') {
    pass('V11.2: Low confidence + degrading → deprioritized signal');
  } else {
    fail('V11.2', `Expected deprioritized, got ${deprioritizedInfluence.priority_signal}`);
  }
  
  // Confidence weight for priority-manager
  const weight = getConfidenceWeightForAction('preferred_action');
  if (weight.confidence_weight > 0.5) {
    pass('V11.3: High confidence action has weight > 0.5');
  } else {
    fail('V11.3', `Expected > 0.5, got ${weight.confidence_weight}`);
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
  console.log('\n✅ ALL R11 VALIDATION TESTS PASSED\n');
}

console.log('═'.repeat(70));
console.log('  R11 — OUTCOME EVALUATION VALIDATION COMPLETE');
console.log('═'.repeat(70) + '\n');

process.exit(testsFailed > 0 ? 1 : 0);
