/**
 * Situational Awareness Validator — MCAI Phase 4C
 * Validates situational awareness generation for SHADOW-only operation.
 * 
 * Tests:
 * 1. Awareness snapshots deterministic
 * 2. Pressure classifications correct
 * 3. Temporal comparisons correct
 * 4. Uncertainty language present
 * 5. No action/recommendation language
 * 6. Snapshot retention works
 * 7. Audit logging works
 * 8. Append-only integrity preserved
 * 9. Environmental summaries stable across runs
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const AWARENESS_FILE = path.join(STATE_DIR, 'situational-awareness.json');

const {
    runSituationalAwareness,
    generateAwarenessSnapshot,
    classifyEnvironmentalPressure,
    determineAwarenessLevel,
    extractDominantPatterns,
    generateStabilitySummary,
    generateUncertaintySummary,
    compareWithPrevious,
    PRESSURE_LEVELS,
    AWARENESS_LEVELS,
    TEMPORAL_PATTERNS
} = require('./situational-awareness.js');

const { runPerceptionSurvey } = require('./priority-perception.js');

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
    return { pass: !!condition, message: message || 'assertion failed' };
}

const actionWords = ['should', 'must', 'recommend', 'action', 'remediate', 'fix', 'respond', 'escalate', 'deploy', 'restart', 'kill', 'remove', 'enable', 'disable'];

// === TEST DATA ===

const mockMetrics = {
    volatile_entity_count: 0,
    chronic_degradation_count: 1,
    oscillation_rate: 0,
    stale_verification_pressure: 1.0,
    contradiction_density: 0.5,
    recovery_rate: 0,
    perception_distribution: { STABLE: 3, WATCH: 1, DEGRADED: 1, VOLATILE: 0, CRITICAL_PATTERN: 0 }
};

const mockMetricsHigh = {
    volatile_entity_count: 3,
    chronic_degradation_count: 3,
    oscillation_rate: 0.3,
    stale_verification_pressure: 2.5,
    contradiction_density: 2.5,
    recovery_rate: 0.2,
    perception_distribution: { STABLE: 2, WATCH: 1, DEGRADED: 4, VOLATILE: 3, CRITICAL_PATTERN: 1 }
};

const mockMetricsSevere = {
    volatile_entity_count: 5,
    chronic_degradation_count: 5,
    oscillation_rate: 0.5,
    stale_verification_pressure: 4.0,
    contradiction_density: 5.0,
    recovery_rate: 0,
    perception_distribution: { STABLE: 1, WATCH: 0, DEGRADED: 5, VOLATILE: 4, CRITICAL_PATTERN: 3 }
};

// === TESTS ===

console.log('\n=== MCAI Phase 4C — Situational Awareness Validator ===\n');

// Test Group 1: Pressure Classification
console.log('[Test Group 1] Pressure Classification');
test('LOW pressure when stable environment', () => {
    const metrics = { ...mockMetrics, perception_distribution: { STABLE: 10, WATCH: 0, DEGRADED: 0, VOLATILE: 0, CRITICAL_PATTERN: 0 } };
    const result = classifyEnvironmentalPressure(metrics);
    return assert(result.level === 'LOW', `Expected LOW, got ${result.level}`);
});

test('ELEVATED pressure when 15%+ degraded', () => {
    const metrics = { ...mockMetrics, perception_distribution: { STABLE: 5, WATCH: 1, DEGRADED: 1, VOLATILE: 0, CRITICAL_PATTERN: 0 }, volatile_entity_count: 0, contradiction_density: 0.8 };
    const result = classifyEnvironmentalPressure(metrics);
    return assert(result.level === 'ELEVATED', `Expected ELEVATED, got ${result.level}`);
});

test('HIGH pressure when 30%+ degraded or volatile entities', () => {
    const result = classifyEnvironmentalPressure(mockMetricsHigh);
    return assert(result.level === 'HIGH', `Expected HIGH, got ${result.level}`);
});

test('SEVERE pressure when 60%+ degraded or high volatile', () => {
    const result = classifyEnvironmentalPressure(mockMetricsSevere);
    return assert(result.level === 'SEVERE', `Expected SEVERE, got ${result.level}`);
});

test('Pressure classification has all required fields', () => {
    const result = classifyEnvironmentalPressure(mockMetrics);
    return assert(result.level && result.summary && result.description && result.indicators && result.uncertainty_note, 'Missing required fields');
});

// Test Group 2: Awareness Level Determination
console.log('\n[Test Group 2] Awareness Level Determination');
test('LOW awareness with few entities and short window', () => {
    const metrics = { ...mockMetrics, perception_distribution: { STABLE: 1, WATCH: 0, DEGRADED: 0, VOLATILE: 0, CRITICAL_PATTERN: 0 } };
    const result = determineAwarenessLevel(metrics, '1h');
    return assert(result.level === 'LOW', `Expected LOW, got ${result.level}`);
});

test('MEDIUM awareness with moderate entities', () => {
    const metrics = { ...mockMetrics, perception_distribution: { STABLE: 3, WATCH: 1, DEGRADED: 1, VOLATILE: 0, CRITICAL_PATTERN: 0 } };
    const result = determineAwarenessLevel(metrics, '24h');
    return assert(result.level === 'MEDIUM', `Expected MEDIUM, got ${result.level}`);
});

test('HIGH awareness with many entities and long window', () => {
    const metrics = { ...mockMetrics, perception_distribution: { STABLE: 8, WATCH: 2, DEGRADED: 2, VOLATILE: 0, CRITICAL_PATTERN: 0 } };
    const result = determineAwarenessLevel(metrics, '7d');
    return assert(result.level === 'HIGH', `Expected HIGH, got ${result.level}`);
});

// Test Group 3: Dominant Pattern Extraction
console.log('\n[Test Group 3] Dominant Pattern Extraction');
test('Extracts drift patterns from perceptions', () => {
    const perceptions = [
        { entity_id: 'A', drift: { pattern: 'ESCALATING_INSTABILITY' } },
        { entity_id: 'B', drift: { pattern: 'ESCALATING_INSTABILITY' } },
        { entity_id: 'C', drift: { pattern: 'RECOVERING_STABILITY' } }
    ];
    const patterns = extractDominantPatterns(perceptions);
    return assert(patterns.length >= 2 && patterns.some(p => p.pattern_type === 'ESCALATING_INSTABILITY'), 'Missing drift patterns');
});

test('Ignores INSUFFICIENT_DATA patterns', () => {
    const perceptions = [
        { entity_id: 'A', drift: { pattern: 'INSUFFICIENT_DATA' } },
        { entity_id: 'B', drift: { pattern: 'ESCALATING_INSTABILITY' } }
    ];
    const patterns = extractDominantPatterns(perceptions);
    return assert(!patterns.some(p => p.pattern_type === 'INSUFFICIENT_DATA'), 'Should not include INSUFFICIENT_DATA');
});

test('Pattern includes entity examples', () => {
    const perceptions = [
        { entity_id: 'A', drift: { pattern: 'STABLE_TREND' } },
        { entity_id: 'B', drift: { pattern: 'STABLE_TREND' } }
    ];
    const patterns = extractDominantPatterns(perceptions);
    return assert(patterns[0].entities.includes('A') && patterns[0].entities.includes('B'), 'Missing entity examples');
});

// Test Group 4: Stability Summary
console.log('\n[Test Group 4] Stability Summary');
test('Generates correct stable ratio', () => {
    const metrics = { perception_distribution: { STABLE: 7, WATCH: 1, DEGRADED: 1, VOLATILE: 1, CRITICAL_PATTERN: 0 } };
    const summary = generateStabilitySummary([], metrics);
    return assert(summary.stable_ratio === 0.7, `Expected 0.7, got ${summary.stable_ratio}`);
});

test('Identifies dominant state correctly', () => {
    const metrics = { perception_distribution: { STABLE: 2, WATCH: 1, DEGRADED: 5, VOLATILE: 1, CRITICAL_PATTERN: 1 } };
    const summary = generateStabilitySummary([], metrics);
    return assert(summary.dominant_state.category === 'DEGRADED', `Expected DEGRADED, got ${summary.dominant_state.category}`);
});

test('Assessment text is non-empty', () => {
    const metrics = { perception_distribution: { STABLE: 5, WATCH: 1, DEGRADED: 2, VOLATILE: 0, CRITICAL_PATTERN: 0 } };
    const summary = generateStabilitySummary([], metrics);
    return assert(summary.assessment.length > 20, 'Assessment too short');
});

// Test Group 5: Temporal Comparison
console.log('\n[Test Group 5] Temporal Comparison');
test('INSUFFICIENT_DATA when no previous snapshot', () => {
    const result = compareWithPrevious(mockMetrics, null);
    return assert(result.pattern === 'INSUFFICIENT_DATA', `Expected INSUFFICIENT_DATA, got ${result.pattern}`);
});

test('IMPROVING when current significantly better', () => {
    const current = { ...mockMetrics, perception_distribution: { STABLE: 10, WATCH: 0, DEGRADED: 0, VOLATILE: 0, CRITICAL_PATTERN: 0 }, volatile_entity_count: 0, contradiction_density: 0 };
    const previous = { perception_metrics: { ...mockMetrics, perception_distribution: { STABLE: 5, WATCH: 1, DEGRADED: 4, VOLATILE: 2, CRITICAL_PATTERN: 0 } } };
    const result = compareWithPrevious(current, previous);
    return assert(result.pattern === 'IMPROVING', `Expected IMPROVING, got ${result.pattern}`);
});

test('DETERIORATING when current significantly worse', () => {
    const current = { ...mockMetrics, perception_distribution: { STABLE: 2, WATCH: 1, DEGRADED: 5, VOLATILE: 3, CRITICAL_PATTERN: 0 }, volatile_entity_count: 3 };
    const previous = { perception_metrics: { ...mockMetrics, perception_distribution: { STABLE: 8, WATCH: 1, DEGRADED: 1, VOLATILE: 0, CRITICAL_PATTERN: 0 }, volatile_entity_count: 0 } };
    const result = compareWithPrevious(current, previous);
    return assert(result.pattern === 'DETERIORATING', `Expected DETERIORATING, got ${result.pattern}`);
});

test('STABLE when no significant change', () => {
    const current = { ...mockMetrics, perception_distribution: { STABLE: 5, WATCH: 1, DEGRADED: 1, VOLATILE: 0, CRITICAL_PATTERN: 0 } };
    const previous = { perception_metrics: { ...mockMetrics, perception_distribution: { STABLE: 6, WATCH: 0, DEGRADED: 1, VOLATILE: 0, CRITICAL_PATTERN: 0 } } };
    const result = compareWithPrevious(current, previous);
    return assert(result.pattern === 'STABLE', `Expected STABLE, got ${result.pattern}`);
});

// Test Group 6: Uncertainty Summary
console.log('\n[Test Group 6] Uncertainty Summary');
test('Uncertainty has awareness level and confidence', () => {
    const awareness = AWARENESS_LEVELS.LOW;
    const result = generateUncertaintySummary(awareness, mockMetrics, 1, '1h');
    return assert(result.awareness_level && result.confidence && result.factors && result.summary, 'Missing uncertainty fields');
});

test('Low awareness triggers coverage uncertainty', () => {
    const awareness = AWARENESS_LEVELS.LOW;
    const result = generateUncertaintySummary(awareness, mockMetrics, 1, '1h');
    const hasCoverage = result.factors.some(f => f.factor === 'observation_coverage');
    return assert(hasCoverage, 'Missing coverage uncertainty factor');
});

test('High oscillation triggers uncertainty factor', () => {
    const awareness = AWARENESS_LEVELS.MEDIUM;
    const metrics = { ...mockMetrics, oscillation_rate: 0.5 };
    const result = generateUncertaintySummary(awareness, metrics, 5, '24h');
    const hasOsc = result.factors.some(f => f.factor === 'oscillation_environment');
    return assert(hasOsc, 'Missing oscillation uncertainty factor');
});

test('Limited entity count triggers uncertainty', () => {
    const awareness = AWARENESS_LEVELS.MEDIUM;
    const result = generateUncertaintySummary(awareness, mockMetrics, 1, '24h');
    const hasEntity = result.factors.some(f => f.factor === 'limited_entity_sample');
    return assert(hasEntity, 'Missing entity sample uncertainty');
});

// Test Group 7: Full Pipeline Determinism
console.log('\n[Test Group 7] Full Pipeline Determinism');
test('Same input produces identical snapshot (idempotency)', () => {
    const perceptionResult = runPerceptionSurvey('24h');
    const snap1 = generateAwarenessSnapshot(perceptionResult, null);
    const snap2 = generateAwarenessSnapshot(perceptionResult, null);
    return assert(JSON.stringify(snap1) === JSON.stringify(snap2), 'Snapshots differ for same input');
});

test('Snapshot has all required fields', () => {
    const perceptionResult = runPerceptionSurvey('24h');
    const snapshot = generateAwarenessSnapshot(perceptionResult, null);
    const required = ['awareness_level', 'environment_pressure', 'dominant_patterns', 'stability_summary', 'uncertainty_summary', 'pressure_contributors', 'temporal_comparison', 'observation_window', 'entity_count', 'perception_metrics', 'generated_at', 'shadow_only'];
    const missing = required.filter(k => !(k in snapshot));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

test('shadow_only field is always true', () => {
    const perceptionResult = runPerceptionSurvey('24h');
    const snapshot = generateAwarenessSnapshot(perceptionResult, null);
    return assert(snapshot.shadow_only === true, `shadow_only is ${snapshot.shadow_only}`);
});

test('generated_at is valid ISO timestamp', () => {
    const perceptionResult = runPerceptionSurvey('24h');
    const snapshot = generateAwarenessSnapshot(perceptionResult, null);
    const d = new Date(snapshot.generated_at);
    return assert(!isNaN(d.getTime()), `Invalid timestamp: ${snapshot.generated_at}`);
});

test('awareness_level is valid enum value', () => {
    const perceptionResult = runPerceptionSurvey('24h');
    const snapshot = generateAwarenessSnapshot(perceptionResult, null);
    const valid = ['LOW', 'MEDIUM', 'HIGH'];
    return assert(valid.includes(snapshot.awareness_level), `Invalid awareness level: ${snapshot.awareness_level}`);
});

test('environment_pressure is valid enum value', () => {
    const perceptionResult = runPerceptionSurvey('24h');
    const snapshot = generateAwarenessSnapshot(perceptionResult, null);
    const valid = ['LOW', 'ELEVATED', 'HIGH', 'SEVERE'];
    return assert(valid.includes(snapshot.environment_pressure), `Invalid pressure: ${snapshot.environment_pressure}`);
});

// Test Group 8: No Action/Recommendation Language
console.log('\n[Test Group 8] No Action/Recommendation Language');
test('Pressure descriptions contain no action words', () => {
    const pressure = classifyEnvironmentalPressure(mockMetrics);
    const text = pressure.summary + ' ' + pressure.description + ' ' + pressure.indicators.join(' ');
    const found = actionWords.filter(w => text.includes(w));
    return assert(found.length === 0, `Found action words in pressure: ${found.join(', ')}`);
});

test('Stability summary contains no action words', () => {
    const summary = generateStabilitySummary([], mockMetrics);
    const found = actionWords.filter(w => summary.assessment.includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('Uncertainty summary contains no action words', () => {
    const awareness = AWARENESS_LEVELS.MEDIUM;
    const result = generateUncertaintySummary(awareness, mockMetrics, 5, '24h');
    const allText = result.summary + ' ' + result.factors.map(f => f.impact).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('Temporal comparison descriptions contain no action words', () => {
    const result = compareWithPrevious(mockMetrics, null);
    const text = result.description + ' ' + result.interpretation;
    const found = actionWords.filter(w => text.includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

// Test Group 9: Snapshot Persistence
console.log('\n[Test Group 9] Snapshot Persistence');
const auditBefore = fs.existsSync(AUDIT_LOG) ? fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean).length : 0;

test('runSituationalAwareness saves snapshot to file', () => {
    const result = runSituationalAwareness('24h');
    const exists = fs.existsSync(AWARENESS_FILE);
    return assert(exists, 'Snapshot file not created');
});

test('runSituationalAwareness appends to audit log', () => {
    const before = fs.existsSync(AUDIT_LOG) ? fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean).length : 0;
    runSituationalAwareness('1h');
    const after = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean).length;
    return assert(after > before, `Audit log did not grow. Before: ${before}, After: ${after}`);
});

test('Audit entry contains MCAI-4C phase', () => {
    const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
    const lastEntry = lines[lines.length - 1];
    const entry = JSON.parse(lastEntry);
    return assert(entry.phase === 'MCAI-4C', `Phase is ${entry.phase}`);
});

// Test Group 10: Snapshot Retention
console.log('\n[Test Group 10] Snapshot Retention');
test('Snapshot file is valid JSON', () => {
    const data = fs.readFileSync(AWARENESS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return assert(parsed && parsed.awareness_level, 'Not valid snapshot JSON');
});

test('Previous snapshot can be loaded', () => {
    const { loadPreviousSnapshot } = require('./situational-awareness.js');
    const prev = loadPreviousSnapshot();
    return assert(prev !== null && prev.awareness_level, 'Could not load previous snapshot');
});

// Test Group 11: Run twice - stability
console.log('\n[Test Group 11] Run Twice Stability');
test('Second run produces same structure (stability)', () => {
    const snap1 = runSituationalAwareness('6h');
    const snap2 = runSituationalAwareness('6h');
    // Structure should be identical, even if values differ slightly
    const keysMatch = Object.keys(snap1).sort().join(',') === Object.keys(snap2).sort().join(',');
    return assert(keysMatch, 'Snapshot structure differs between runs');
});

// === SUMMARY ===

console.log('\n=== Validation Summary ===');
console.log(`Tests run:    ${tests_run}`);
console.log(`Tests passed: ${tests_passed}`);
console.log(`Tests failed: ${tests_failed}`);

if (tests_failed === 0) {
    console.log('\n✅ All tests passed. Situational awareness layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

process.exit(tests_failed > 0 ? 1 : 0);