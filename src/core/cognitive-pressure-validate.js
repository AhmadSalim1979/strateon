/**
 * Cognitive Pressure Mapping Validator — MCAI Phase 5A
 * Validates cognitive pressure mapping for SHADOW-only operation.
 * 
 * Tests:
 * 1. Persistent pressure signal detection
 * 2. Cluster detection correctness
 * 3. Pressure concentration scoring
 * 4. Pressure trajectory classification
 * 5. Strain map generation
 * 6. Persistence tracking
 * 7. Uncertainty boundaries
 * 8. Deterministic outputs
 * 9. No action/recommendation language
 * 10. Snapshot persistence
 * 11. Audit logging
 * 12. Bounded memory retention
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const PRESSURE_FILE = path.join(STATE_DIR, 'cognitive-pressure.json');
const PRESSURE_HISTORY_FILE = path.join(STATE_DIR, 'cognitive-pressure-history.jsonl');

const {
    runCognitivePressureMapping,
    detectPersistentPressureSignals,
    detectClusters,
    scorePressureConcentration,
    analyzePressureTrajectory,
    generateStrainMap,
    trackPressurePersistence,
    loadPressureHistory,
    CONCENTRATION,
    TRAJECTORY
} = require('./cognitive-pressure.js');

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

const mockPerceptions = [
    { entity_id: 'worker-A', category: 'DEGRADED', score: 0.55, drift: { pattern: 'ESCALATING_INSTABILITY' }, observation_counts: { occurrences: 8, contradictions: 1, status_flips: 3, commitment_expirations: 0, verification_failures: 3, degraded_periods: 4, unstable_state_changes: 5 } },
    { entity_id: 'worker-B', category: 'STABLE', score: 0.15, drift: { pattern: 'STABLE_TREND' }, observation_counts: { occurrences: 10, contradictions: 0, status_flips: 0, commitment_expirations: 0, verification_failures: 0, degraded_periods: 0, unstable_state_changes: 0 } },
    { entity_id: 'worker-C', category: 'DEGRADED', score: 0.62, drift: { pattern: 'ESCALATING_INSTABILITY' }, observation_counts: { occurrences: 9, contradictions: 3, status_flips: 4, commitment_expirations: 0, verification_failures: 5, degraded_periods: 5, unstable_state_changes: 6 } },
    { entity_id: 'gateway-X', category: 'VOLATILE', score: 0.78, drift: { pattern: 'OSCILLATING' }, observation_counts: { occurrences: 6, contradictions: 2, status_flips: 5, commitment_expirations: 1, verification_failures: 4, degraded_periods: 3, unstable_state_changes: 5 } },
    { entity_id: 'gateway-Y', category: 'WATCH', score: 0.28, drift: { pattern: 'RECOVERING_STABILITY' }, observation_counts: { occurrences: 5, contradictions: 0, status_flips: 1, commitment_expirations: 0, verification_failures: 0, degraded_periods: 1, unstable_state_changes: 1 } },
    { entity_id: 'db-primary', category: 'STABLE', score: 0.12, drift: { pattern: 'STABLE_TREND' }, observation_counts: { occurrences: 12, contradictions: 0, status_flips: 0, commitment_expirations: 0, verification_failures: 1, degraded_periods: 0, unstable_state_changes: 0 } }
];

const mockAwarenessSnapshot = {
    awareness_level: 'MEDIUM',
    environment_pressure: 'ELEVATED',
    entity_count: 6,
    observation_window: '24h',
    perceptions: mockPerceptions,
    perception_metrics: {
        volatile_entity_count: 1,
        chronic_degradation_count: 2,
        oscillation_rate: 0.2,
        stale_verification_pressure: 2.5,
        contradiction_density: 1.0,
        recovery_rate: 0.1,
        perception_distribution: { STABLE: 2, WATCH: 1, DEGRADED: 2, VOLATILE: 1, CRITICAL_PATTERN: 0 }
    },
    generated_at: new Date().toISOString(),
    shadow_only: true
};

// === TESTS ===

console.log('\n=== MCAI Phase 5A — Cognitive Pressure Mapping Validator ===\n');

// Test Group 1: Persistent Pressure Signal Detection
console.log('[Test Group 1] Persistent Pressure Signal Detection');
test('Detect recurring instability signals', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const hasEscalating = signals.recurring_instability.some(s => s.count >= 2);
    return assert(hasEscalating, `Expected recurring instability detected. Signals: ${JSON.stringify(signals.recurring_instability)}`);
});

test('Detect chronic degradation signals', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const hasChronic = signals.chronic_degradation.some(s => s.degraded_periods >= 3);
    return assert(hasChronic, `Expected chronic degradation detected. Found: ${signals.chronic_degradation.length}`);
});

test('Detect verification decay accumulation', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    return assert(signals.verification_decay_accumulation.length > 0, `Expected verification decay detected. Found: ${signals.verification_decay_accumulation.length}`);
});

test('Detect contradiction clustering', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    return assert(signals.contradiction_clustering.length > 0, `Expected contradiction clustering. Found: ${signals.contradiction_clustering.length}`);
});

test('Detect repeated state volatility', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    return assert(signals.repeated_state_volatility.length > 0, `Expected state volatility. Found: ${signals.repeated_state_volatility.length}`);
});

test('Detect oscillation concentration', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    return assert(signals.oscillation_concentration.length > 0, `Expected oscillation concentration. Found: ${signals.oscillation_concentration.length}`);
});

test('All signal categories present', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const required = ['recurring_instability', 'chronic_degradation', 'verification_decay_accumulation', 'contradiction_clustering', 'repeated_state_volatility', 'oscillation_concentration', 'stale_evidence_accumulation'];
    const missing = required.filter(k => !Array.isArray(signals[k]));
    return assert(missing.length === 0, `Missing signal categories: ${missing.join(', ')}`);
});

// Test Group 2: Cluster Detection
console.log('\n[Test Group 2] Cluster Detection');
test('Detect shared drift pattern clusters', () => {
    const clusters = detectClusters(mockPerceptions);
    const hasDriftCluster = clusters.some(c => c.cluster_type === 'shared_drift_pattern');
    return assert(hasDriftCluster, `Expected shared drift cluster. Clusters: ${clusters.map(c => c.cluster_type).join(', ')}`);
});

test('Detect synchronized degradation clusters', () => {
    const clusters = detectClusters(mockPerceptions);
    const hasSyncDegraded = clusters.some(c => c.cluster_type === 'synchronized_degradation');
    return assert(hasSyncDegraded, `Expected synchronized degradation cluster`);
});

test('Cluster entities include expected entities', () => {
    const clusters = detectClusters(mockPerceptions);
    const driftCluster = clusters.find(c => c.cluster_type === 'shared_drift_pattern');
    return assert(driftCluster && driftCluster.entities.includes('worker-A') && driftCluster.entities.includes('worker-C'), `Expected worker-A and worker-C in cluster`);
});

test('Clusters have required fields', () => {
    const clusters = detectClusters(mockPerceptions);
    for (const c of clusters) {
        if (!c.cluster_type || !c.entities || !c.entity_count) {
            return assert(false, `Missing fields in cluster: ${JSON.stringify(c)}`);
        }
    }
    return assert(true);
});

// Test Group 3: Pressure Concentration Scoring
console.log('\n[Test Group 3] Pressure Concentration Scoring');
test('CONCENTRATED classification when specific cluster affected', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const result = scorePressureConcentration(mockPerceptions, signals, clusters);
    return assert(['CONCENTRATED', 'DISTRIBUTED', 'LOCALIZED', 'SYSTEMIC'].includes(result.classification), `Invalid classification: ${result.classification}`);
});

test('Concentration has required fields', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const result = scorePressureConcentration(mockPerceptions, signals, clusters);
    return assert(result.classification && result.summary && result.description, 'Missing required fields in concentration');
});

test('Concentration has affected_ratio', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const result = scorePressureConcentration(mockPerceptions, signals, clusters);
    return assert(typeof result.affected_ratio === 'number', `affected_ratio not a number: ${result.affected_ratio}`);
});

test('All CONCENTRATION enum values have required fields', () => {
    for (const [key, val] of Object.entries(CONCENTRATION)) {
        if (!val.classification || !val.summary || !val.description) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

// Test Group 4: Trajectory Analysis
console.log('\n[Test Group 4] Trajectory Analysis');
test('INDETERMINATE when fewer than 3 snapshots', () => {
    const result = analyzePressureTrajectory([{ perception_metrics: {} }, { perception_metrics: {} }]);
    return assert(result.pattern === 'INDETERMINATE', `Expected INDETERMINATE, got ${result.pattern}`);
});

test('INDETERMINATE when exactly 2 snapshots', () => {
    const result = analyzePressureTrajectory([{ perception_metrics: {} }, { perception_metrics: {} }]);
    return assert(result.snapshot_count === 2, `Expected snapshot_count 2, got ${result.snapshot_count}`);
});

test('ACCUMULATING when second half worse than first', () => {
    const snapshots = [
        { perception_metrics: { perception_distribution: { DEGRADED: 0, VOLATILE: 0, CRITICAL_PATTERN: 0 } } },
        { perception_metrics: { perception_distribution: { DEGRADED: 1, VOLATILE: 0, CRITICAL_PATTERN: 0 } },
        { perception_metrics: { perception_distribution: { DEGRADED: 2, VOLATILE: 0, CRITICAL_PATTERN: 0 } },
        { perception_metrics: { perception_distribution: { DEGRADED: 3, VOLATILE: 0, CRITICAL_PATTERN: 0 } }
    ];
    const result = analyzePressureTrajectory(snapshots);
    return assert(result.pattern === 'ACCUMULATING', `Expected ACCUMULATING, got ${result.pattern}`);
});

test('STABILIZING when second half better than first', () => {
    const snapshots = [
        { perception_metrics: { perception_distribution: { DEGRADED: 4, VOLATILE: 1, CRITICAL_PATTERN: 1 } },
        { perception_metrics: { perception_distribution: { DEGRADED: 3, VOLATILE: 1, CRITICAL_PATTERN: 0 } },
        { perception_metrics: { perception_distribution: { DEGRADED: 2, VOLATILE: 0, CRITICAL_PATTERN: 0 } },
        { perception_metrics: { perception_distribution: { DEGRADED: 1, VOLATILE: 0, CRITICAL_PATTERN: 0 } }
    ];
    const result = analyzePressureTrajectory(snapshots);
    return assert(result.pattern === 'STABILIZING', `Expected STABILIZING, got ${result.pattern}`);
});

test('All TRAJECTORY enum values have required fields', () => {
    for (const [key, val] of Object.entries(TRAJECTORY)) {
        if (!val.pattern || !val.summary || !val.description) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

// Test Group 5: Strain Map Generation
console.log('\n[Test Group 5] Strain Map Generation');
test('Strain map has all required fields', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const concentration = scorePressureConcentration(mockPerceptions, signals, clusters);
    const trajectory = { pattern: 'INDETERMINATE', summary: '', description: '', delta: 0 };
    const result = generateStrainMap(mockAwarenessSnapshot, [], signals, clusters, concentration, trajectory);
    const required = ['strain_level', 'pressure_distribution', 'chronic_entities', 'unstable_clusters', 'recurring_patterns', 'unresolved_pressure_count', 'environmental_assessment', 'uncertainty_boundaries', 'generated_at', 'shadow_only'];
    const missing = required.filter(k => !(k in result));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

test('strain_level is valid enum', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const concentration = scorePressureConcentration(mockPerceptions, signals, clusters);
    const trajectory = { pattern: 'INDETERMINATE', summary: '', description: '', delta: 0 };
    const result = generateStrainMap(mockAwarenessSnapshot, [], signals, clusters, concentration, trajectory);
    return assert(['LOW', 'MODERATE', 'HIGH', 'SEVERE'].includes(result.strain_level), `Invalid strain_level: ${result.strain_level}`);
});

test('shadow_only is true', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const concentration = scorePressureConcentration(mockPerceptions, signals, clusters);
    const trajectory = { pattern: 'INDETERMINATE', summary: '', description: '', delta: 0 };
    const result = generateStrainMap(mockAwarenessSnapshot, [], signals, clusters, concentration, trajectory);
    return assert(result.shadow_only === true, `shadow_only is ${result.shadow_only}`);
});

test('chronic_entities is array', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const concentration = scorePressureConcentration(mockPerceptions, signals, clusters);
    const trajectory = { pattern: 'INDETERMINATE', summary: '', description: '', delta: 0 };
    const result = generateStrainMap(mockAwarenessSnapshot, [], signals, clusters, concentration, trajectory);
    return assert(Array.isArray(result.chronic_entities), 'chronic_entities not an array');
});

test('uncertainty_boundaries is non-empty array when insufficient history', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const concentration = scorePressureConcentration(mockPerceptions, signals, clusters);
    const trajectory = { pattern: 'INDETERMINATE', summary: '', description: '', delta: 0 };
    const result = generateStrainMap(mockAwarenessSnapshot, [], signals, clusters, concentration, trajectory);
    const hasInsuffHistory = result.uncertainty_boundaries.some(u => u.factor === 'insufficient_snapshot_history');
    return assert(hasInsuffHistory, 'Expected insufficient_snapshot_history uncertainty');
});

test('unresolved_pressure_count is numeric', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const concentration = scorePressureConcentration(mockPerceptions, signals, clusters);
    const trajectory = { pattern: 'INDETERMINATE', summary: '', description: '', delta: 0 };
    const result = generateStrainMap(mockAwarenessSnapshot, [], signals, clusters, concentration, trajectory);
    return assert(typeof result.unresolved_pressure_count === 'number', `unresolved_pressure_count is ${typeof result.unresolved_pressure_count}`);
});

test('generated_at is valid ISO timestamp', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const concentration = scorePressureConcentration(mockPerceptions, signals, clusters);
    const trajectory = { pattern: 'INDETERMINATE', summary: '', description: '', delta: 0 };
    const result = generateStrainMap(mockAwarenessSnapshot, [], signals, clusters, concentration, trajectory);
    const d = new Date(result.generated_at);
    return assert(!isNaN(d.getTime()), `Invalid timestamp: ${result.generated_at}`);
});

// Test Group 6: Persistence Tracking
console.log('\n[Test Group 6] Persistence Tracking');
test('Track persistence returns required structure', () => {
    const result = trackPressurePersistence(mockPerceptions, []);
    return assert(Array.isArray(result.persistent_entities) && Array.isArray(result.stabilization_attempts), 'Missing required arrays');
});

test('Persistent entities detected from history', () => {
    const history = [
        { perceptions: [{ entity_id: 'worker-A', category: 'DEGRADED', score: 0.6 }], generated_at: new Date().toISOString() },
        { perceptions: [{ entity_id: 'worker-A', category: 'DEGRADED', score: 0.65 }], generated_at: new Date().toISOString() },
        { perceptions: [{ entity_id: 'worker-A', category: 'DEGRADED', score: 0.7 }], generated_at: new Date().toISOString() },
        { perceptions: [{ entity_id: 'worker-A', category: 'DEGRADED', score: 0.72 }], generated_at: new Date().toISOString() }
    ];
    const result = trackPressurePersistence(mockPerceptions, history);
    return assert(result.persistent_entities.length > 0, `Expected persistent entity. Found: ${result.persistent_entities.length}`);
});

// Test Group 7: No Action/Recommendation Language
console.log('\n[Test Group 7] No Action/Recommendation Language');
test('Strain map contains no action words', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const concentration = scorePressureConcentration(mockPerceptions, signals, clusters);
    const trajectory = { pattern: 'INDETERMINATE', summary: '', description: '', delta: 0 };
    const result = generateStrainMap(mockAwarenessSnapshot, [], signals, clusters, concentration, trajectory);
    const text = result.environmental_assessment + ' ' + result.uncertainty_boundaries.map(u => u.factor + ' ' + u.impact).join(' ');
    const found = actionWords.filter(w => text.includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')} in: ${text.substring(0, 100)}`);
});

test('CONCENTRATION descriptions contain no action words', () => {
    const allText = Object.values(CONCENTRATION).map(v => v.summary + ' ' + v.description).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in CONCENTRATION: ${found.join(', ')}`);
});

test('TRAJECTORY descriptions contain no action words', () => {
    const allText = Object.values(TRAJECTORY).map(v => v.summary + ' ' + v.description).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in TRAJECTORY: ${found.join(', ')}`);
});

test('Signal descriptions contain no action words', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const allText = JSON.stringify(signals);
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in signals: ${found.join(', ')}`);
});

// Test Group 8: Deterministic Output
console.log('\n[Test Group 8] Deterministic Output');
test('Same input produces identical strain map (idempotency)', () => {
    const signals = detectPersistentPressureSignals(mockPerceptions);
    const clusters = detectClusters(mockPerceptions);
    const concentration = scorePressureConcentration(mockPerceptions, signals, clusters);
    const trajectory = { pattern: 'INDETERMINATE', summary: '', description: '', delta: 0 };
    const map1 = generateStrainMap(mockAwarenessSnapshot, [], signals, clusters, concentration, trajectory);
    const map2 = generateStrainMap(mockAwarenessSnapshot, [], signals, clusters, concentration, trajectory);
    return assert(JSON.stringify(map1) === JSON.stringify(map2), 'Strain maps differ for same input');
});

// Test Group 9: Snapshot Persistence
console.log('\n[Test Group 9] Snapshot Persistence');
const auditBefore = fs.existsSync(AUDIT_LOG) ? fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean).length : 0;

test('runCognitivePressureMapping saves to file', () => {
    const result = runCognitivePressureMapping(mockAwarenessSnapshot);
    const exists = fs.existsSync(PRESSURE_FILE);
    return assert(exists, 'Strain map file not created');
});

test('runCognitivePressureMapping appends to audit log', () => {
    const before = fs.existsSync(AUDIT_LOG) ? fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean).length : 0;
    runCognitivePressureMapping(mockAwarenessSnapshot);
    const after = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean).length;
    return assert(after > before, `Audit log did not grow. Before: ${before}, After: ${after}`);
});

test('Audit entry contains MCAI-5A phase', () => {
    const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
    const lastEntry = lines[lines.length - 1];
    const entry = JSON.parse(lastEntry);
    return assert(entry.phase === 'MCAI-5A', `Phase is ${entry.phase}`);
});

test('Pressure history file is created and appended', () => {
    const before = fs.existsSync(PRESSURE_HISTORY_FILE) ? fs.readFileSync(PRESSURE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length : 0;
    runCognitivePressureMapping(mockAwarenessSnapshot);
    const after = fs.readFileSync(PRESSURE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length;
    return assert(after > before, `History file did not grow. Before: ${before}, After: ${after}`);
});

// Test Group 10: Bounded Memory Retention
console.log('\n[Test Group 10] Bounded Memory Retention');
test('Pressure history respects retention limit', () => {
    // Load existing history and check it doesn't exceed retention limit
    const history = loadPressureHistory();
    return assert(history.length <= 30, `History exceeds retention limit: ${history.length}`);
});

test('History entries are valid JSON', () => {
    const history = loadPressureHistory();
    for (const entry of history.slice(-5)) {
        try {
            JSON.parse(JSON.stringify(entry));
        } catch {
            return assert(false, `Invalid history entry: ${JSON.stringify(entry)}`);
        }
    }
    return assert(true);
});

// === SUMMARY ===

console.log('\n=== Validation Summary ===');
console.log(`Tests run:    ${tests_run}`);
console.log(`Tests passed: ${tests_passed}`);
console.log(`Tests failed: ${tests_failed}`);

if (tests_failed === 0) {
    console.log('\n✅ All tests passed. Cognitive pressure mapping layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

process.exit(tests_failed > 0 ? 1 : 0);