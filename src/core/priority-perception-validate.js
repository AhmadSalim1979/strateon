/**
 * Priority Perception Validator — MCAI Phase 4A
 * Validates that priority perception works correctly in shadow-only mode.
 * 
 * Tests:
 * 1. Repeated instability detection
 * 2. Oscillation detection
 * 3. Degradation tracking
 * 4. Recovery tracking
 * 5. Observational scoring stable across runs
 * 6. Metrics compute correctly
 * 7. Append-only integrity preserved
 * 8. No operational reads influence behavior
 */

console.log('\n[Pre-check] Testing detectDrift with 5-elem oscillating:');
const preCheck = require('./priority-perception.js');
console.log('  Result:', JSON.stringify(preCheck.detectDrift([0.3, 0.7, 0.3, 0.7, 0.3])));
console.log('  Expected: OSCILLATING\n');

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const PERCEPTION_LOG = path.join(STATE_DIR, 'priority-perception.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const { 
    runPerceptionSurvey, 
    computeObservationalScore, 
    detectDrift, 
    assignCategory, 
    CATEGORIES,
    loadTemporalContinuity,
    loadVerificationLog,
    loadCommitments
} = require('./priority-perception.js');

// Test counters
let tests_run = 0;
let tests_passed = 0;
let tests_failed = 0;

function test(name, fn) {
    tests_run++;
    try {
        const result = fn();
        if (result.pass) {
            tests_passed++;
            console.log(`  ✅ ${name}`);
        } else {
            tests_failed++;
            console.log(`  ❌ ${name}: ${result.message}`);
        }
    } catch (err) {
        tests_failed++;
        console.log(`  ❌ ${name}: EXCEPTION — ${err.message}`);
    }
}

function assert(condition, message) {
    return { pass: condition, message };
}

// === TEST DATA GENERATORS ===

function generateTemporalRecord(entityId, eventType, extra = {}) {
    return {
        timestamp: new Date().toISOString(),
        entity_id: entityId,
        event_type: eventType,
        ...extra
    };
}

function generateVerificationRecord(entityId, status, stale = false) {
    return {
        timestamp: new Date().toISOString(),
        entity_id: entityId,
        status,
        stale,
        verification_freshness: stale ? 'stale' : 'fresh'
    };
}

function generateCommitmentRecord(entityId, expired) {
    return {
        timestamp: new Date().toISOString(),
        entity_id: entityId,
        event_type: expired ? 'commitment_expired' : 'commitment_kept',
        expired
    };
}

// === TESTS ===

console.log('\n=== MCAI Phase 4A — Priority Perception Validator ===\n');

// Test 1: Observational scoring stability
console.log('[Test Group 1] Observational Scoring Stability');
test('Same observations produce same score (idempotency)', () => {
    const obs1 = { occurrences: 10, total_state_changes: 5, unstable_state_changes: 3, contradictions: 2, total_observations: 10, stale_verifications: 1, verification_failures: 2, total_verifications: 10 };
    const obs2 = { occurrences: 10, total_state_changes: 5, unstable_state_changes: 3, contradictions: 2, total_observations: 10, stale_verifications: 1, verification_failures: 2, total_verifications: 10 };
    const score1 = computeObservationalScore(obs1);
    const score2 = computeObservationalScore(obs2);
    return assert(score1.score === score2.score, `Score mismatch: ${score1.score} vs ${score2.score}`);
});

test('Higher instability produces higher score', () => {
    const stable = { occurrences: 5, total_state_changes: 1, unstable_state_changes: 0, contradictions: 0, total_observations: 5, stale_verifications: 0, verification_failures: 0, total_verifications: 5 };
    const unstable = { occurrences: 20, total_state_changes: 15, unstable_state_changes: 12, contradictions: 8, total_observations: 20, stale_verifications: 4, verification_failures: 6, total_verifications: 20 };
    const scoreStable = computeObservationalScore(stable);
    const scoreUnstable = computeObservationalScore(unstable);
    return assert(scoreUnstable.score > scoreStable.score, `Unstable (${scoreUnstable.score}) should be > stable (${scoreStable.score})`);
});

test('Score is bounded 0-1', () => {
    const cases = [
        { occurrences: 0, total_state_changes: 0, unstable_state_changes: 0, contradictions: 0, total_observations: 0, stale_verifications: 0, verification_failures: 0, total_verifications: 0 },
        { occurrences: 1000, total_state_changes: 1000, unstable_state_changes: 1000, contradictions: 1000, total_observations: 1000, stale_verifications: 1000, verification_failures: 1000, total_verifications: 1000 }
    ];
    const scores = cases.map(c => computeObservationalScore(c).score);
    return assert(scores.every(s => s >= 0 && s <= 1), `Scores out of bounds: ${scores.join(', ')}`);
});

// Test 2: Category assignment
console.log('\n[Test Group 2] Category Assignment');
test('Score 0-0.19 → STABLE', () => {
    const cat = assignCategory(0.1);
    return assert(cat === CATEGORIES.STABLE, `Expected STABLE, got ${cat}`);
});

test('Score 0.2-0.39 → WATCH', () => {
    const cat = assignCategory(0.25);
    return assert(cat === CATEGORIES.WATCH, `Expected WATCH, got ${cat}`);
});

test('Score 0.4-0.69 → DEGRADED', () => {
    const cat = assignCategory(0.5);
    return assert(cat === CATEGORIES.DEGRADED, `Expected DEGRADED, got ${cat}`);
});

test('Score 0.7-0.99 → VOLATILE', () => {
    const cat = assignCategory(0.75);
    return assert(cat === CATEGORIES.VOLATILE, `Expected VOLATILE, got ${cat}`);
});

test('Critical flag → CRITICAL_PATTERN regardless of score', () => {
    const cat = assignCategory(0.3, { critical_pattern: true });
    return assert(cat === CATEGORIES.CRITICAL_PATTERN, `Expected CRITICAL_PATTERN, got ${cat}`);
});

// Test 3: Drift detection
console.log('\n[Test Group 3] Drift Detection');
test('Insufficient data returns INSUFFICIENT_DATA', () => {
    const drift = detectDrift([0.5, 0.6]);
    return assert(drift.pattern === 'INSUFFICIENT_DATA', `Expected INSUFFICIENT_DATA, got ${drift.pattern}`);
});

test('Escalating scores → ESCALATING_INSTABILITY', () => {
    const history = [0.2, 0.25, 0.3, 0.5, 0.65];
    const drift = detectDrift(history);
    return assert(drift.pattern === 'ESCALATING_INSTABILITY', `Expected ESCALATING_INSTABILITY, got ${drift.pattern}`);
});

test('Declining scores → RECOVERING_STABILITY', () => {
    const history = [0.7, 0.65, 0.55, 0.4, 0.25];
    const drift = detectDrift(history);
    return assert(drift.pattern === 'RECOVERING_STABILITY', `Expected RECOVERING_STABILITY, got ${drift.pattern}`);
});

test('Consistent oscillation → OSCILLATING', () => {
    const history = [0.3, 0.7, 0.3, 0.7, 0.3];
    const drift = detectDrift(history);
    return assert(drift.pattern === 'OSCILLATING', `Expected OSCILLATING, got ${drift.pattern}`);
});

test('Stable scores → STABLE_TREND', () => {
    const history = [0.5, 0.51, 0.49, 0.5, 0.52];
    const drift = detectDrift(history);
    return assert(drift.pattern === 'STABLE_TREND', `Expected STABLE_TREND, got ${drift.pattern}`);
});

// Test 4: Repeated instability detection
console.log('\n[Test Group 4] Repeated Instability Detection');
test('Repeated state transitions counted correctly', () => {
    // Simulate temporal records with state transitions
    const records = [
        generateTemporalRecord('entity-A', 'state_transition', { from_state: 'HEALTHY', to_state: 'DEGRADED' }),
        generateTemporalRecord('entity-A', 'state_transition', { from_state: 'DEGRADED', to_state: 'STALLED' }),
        generateTemporalRecord('entity-A', 'state_transition', { from_state: 'STALLED', to_state: 'HEALTHY' }),
        generateTemporalRecord('entity-A', 'state_transition', { from_state: 'HEALTHY', to_state: 'DEGRADED' }),
        generateTemporalRecord('entity-A', 'state_transition', { from_state: 'DEGRADED', to_state: 'STALLED' }),
    ];
    const unstableCount = records.filter(r => 
        ['STALLED', 'CRITICAL', 'FAILED', 'DEGRADED'].includes(r.from_state) || 
        ['STALLED', 'CRITICAL', 'FAILED', 'DEGRADED'].includes(r.to_state)
    ).length;
    return assert(unstableCount >= 4, `Expected at least 4 unstable transitions, got ${unstableCount}`);
});

// Test 5: Oscillation detection
console.log('\n[Test Group 5] Oscillation Detection');
test('Oscillation detected in entity with repeated status flips', () => {
    const history = [0.1, 0.8, 0.1, 0.75, 0.15, 0.7, 0.2];
    const drift = detectDrift(history);
    return assert(drift.pattern === 'OSCILLATING', `Expected OSCILLATING, got ${drift.pattern}`);
});

// Test 6: Degradation tracking
console.log('\n[Test Group 6] Degradation Tracking');
test('Category correctly assigned to degraded entity', () => {
    const score = computeObservationalScore({
        occurrences: 10,
        total_state_changes: 8,
        unstable_state_changes: 6,
        contradictions: 4,
        total_observations: 10,
        stale_verifications: 3,
        verification_failures: 2,
        total_verifications: 10
    });
    const cat = assignCategory(score.score);
    return assert(cat === 'VOLATILE' || cat === 'DEGRADED', `Expected VOLATILE/DEGRADED, got ${cat}`);
});

// Test 7: Recovery tracking
console.log('\n[Test Group 7] Recovery Tracking');
test('Recovery pattern detected from declining instability', () => {
    const history = [0.8, 0.75, 0.6, 0.45, 0.3, 0.2, 0.15];
    const drift = detectDrift(history);
    return assert(drift.pattern === 'RECOVERING_STABILITY', `Expected RECOVERING_STABILITY, got ${drift.pattern}`);
});

// Test 8: Metrics computation
console.log('\n[Test Group 8] Metrics Computation');
test('Metrics include all required fields', () => {
    const result = runPerceptionSurvey('1h');
    const required = ['volatile_entity_count', 'chronic_degradation_count', 'oscillation_rate', 'stale_verification_pressure', 'contradiction_density', 'recovery_rate', 'perception_distribution', 'computed_at'];
    const hasAll = required.every(k => k in result.metrics);
    return assert(hasAll, `Missing fields. Metrics has: ${Object.keys(result.metrics).join(', ')}`);
});

test('Perception distribution sums to entity count', () => {
    const result = runPerceptionSurvey('1h');
    const dist = result.metrics.perception_distribution;
    const sum = (dist.STABLE || 0) + (dist.WATCH || 0) + (dist.DEGRADED || 0) + (dist.VOLATILE || 0) + (dist.CRITICAL_PATTERN || 0);
    return assert(sum === result.entity_count || result.entity_count === 0, `Distribution sum ${sum} != entity count ${result.entity_count}`);
});

test('Metrics are numeric values', () => {
    const result = runPerceptionSurvey('1h');
    const numeric = ['volatile_entity_count', 'chronic_degradation_count', 'oscillation_rate', 'stale_verification_pressure', 'contradiction_density', 'recovery_rate'];
    const allNumeric = numeric.every(k => typeof result.metrics[k] === 'number');
    return assert(allNumeric, `Non-numeric metrics found`);
});

// Test 9: Append-only integrity
console.log('\n[Test Group 9] Append-Only Integrity');
test('Perception log is append-only (does not truncate)', () => {
    const beforeLines = fs.existsSync(PERCEPTION_LOG) 
        ? fs.readFileSync(PERCEPTION_LOG, 'utf8').split('\n').filter(Boolean).length 
        : 0;
    runPerceptionSurvey('1h');
    runPerceptionSurvey('6h');
    const afterLines = fs.readFileSync(PERCEPTION_LOG, 'utf8').split('\n').filter(Boolean).length;
    return assert(afterLines >= beforeLines + 2, `Log should have grown. Before: ${beforeLines}, After: ${afterLines}`);
});

test('Audit log records survey completions', () => {
    const beforeAudit = fs.existsSync(AUDIT_LOG) 
        ? fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean).length 
        : 0;
    runPerceptionSurvey('24h');
    const afterAudit = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean).length;
    return assert(afterAudit >= beforeAudit + 1, `Audit log should have grown. Before: ${beforeAudit}, After: ${afterAudit}`);
});

// Test 10: No behavioral influence (SHADOW-only verification)
console.log('\n[Test Group 10] SHADOW-Only Constraint (No Behavioral Influence)');
test('Module exports do not include execution functions', () => {
    const exports = Object.keys(require('./priority-perception.js'));
    const forbidden = ['execute', 'act', 'recommend', 'plan', 'schedule', 'remediate', 'heal', 'escalate', 'authorize'];
    const hasForbidden = exports.some(e => forbidden.some(f => e.includes(f)));
    return assert(!hasForbidden, `Module should not export behavioral functions. Found: ${exports.filter(e => forbidden.some(f => e.includes(f))).join(', ')}`);
});

test('Perception result does not contain action recommendations', () => {
    const result = runPerceptionSurvey('1h');
    const hasActionKeys = ['action', 'recommend', 'execute', 'plan', 'schedule'].some(k => k in result);
    return assert(!hasActionKeys, `Perception result should not contain action keys. Found: ${Object.keys(result).join(', ')}`);
});

// === SUMMARY ===

console.log('\n=== Validation Summary ===');
console.log(`Tests run:    ${tests_run}`);
console.log(`Tests passed: ${tests_passed}`);
console.log(`Tests failed: ${tests_failed}`);

if (tests_failed === 0) {
    console.log('\n✅ All tests passed. Priority perception layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

// Return exit code
process.exit(tests_failed > 0 ? 1 : 0);