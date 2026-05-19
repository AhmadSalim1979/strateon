/**
 * Salience Formation Validator — MCAI Phase 5B
 * Validates salience detection for SHADOW-only operation.
 * 
 * Tests:
 * 1. Persistent salience detection
 * 2. Salience strength classification
 * 3. Salience clustering
 * 4. Temporal profile computation
 * 5. Salience memory formation
 * 6. Cross-snapshot continuity
 * 7. Uncertainty boundary generation
 * 8. Deterministic outputs
 * 9. No action/recommendation language
 * 10. Snapshot persistence
 * 11. Audit logging
 * 12. Bounded memory retention
 * 13. Repeat-run stability
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const SALIENCE_FILE = path.join(STATE_DIR, 'salience.json');
const SALIENCE_HISTORY_FILE = path.join(STATE_DIR, 'salience-history.jsonl');

const {
    detectPersistentSalience,
    classifySalienceStrength,
    detectSalienceClusters,
    computeTemporalProfile,
    generateSalienceRecord,
    trackSaliencePersistence,
    loadSalienceHistory,
    runSalienceFormation,
    SALIENCE_LEVELS,
    TEMPORAL_PROFILES
} = require('./salience.js');

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

const actionWords = ['should', 'must', 'recommend', 'action', 'remediate', 'fix', 'respond', 'escalate', 'deploy', 'restart', 'kill', 'remove', 'enable', 'disable', 'prioritize', 'schedule'];

// === TEST DATA ===

const mockPerceptions = [
    { entity_id: 'worker-A', category: 'DEGRADED', score: 0.55, drift: { pattern: 'ESCALATING_INSTABILITY' }, observation_counts: { occurrences: 8, contradictions: 2, status_flips: 3, commitment_expirations: 0, verification_failures: 3, degraded_periods: 4, unstable_state_changes: 6 } },
    { entity_id: 'worker-B', category: 'STABLE', score: 0.15, drift: { pattern: 'STABLE_TREND' }, observation_counts: { occurrences: 10, contradictions: 0, status_flips: 0, commitment_expirations: 0, verification_failures: 0, degraded_periods: 0, unstable_state_changes: 0 } },
    { entity_id: 'worker-C', category: 'DEGRADED', score: 0.62, drift: { pattern: 'ESCALATING_INSTABILITY' }, observation_counts: { occurrences: 9, contradictions: 3, status_flips: 4, commitment_expirations: 0, verification_failures: 5, degraded_periods: 5, unstable_state_changes: 7 } },
    { entity_id: 'gateway-X', category: 'VOLATILE', score: 0.78, drift: { pattern: 'OSCILLATING' }, observation_counts: { occurrences: 6, contradictions: 2, status_flips: 5, commitment_expirations: 1, verification_failures: 4, degraded_periods: 3, unstable_state_changes: 5 } },
    { entity_id: 'gateway-Y', category: 'WATCH', score: 0.28, drift: { pattern: 'RECOVERING_STABILITY' }, observation_counts: { occurrences: 5, contradictions: 0, status_flips: 1, commitment_expirations: 0, verification_failures: 0, degraded_periods: 1, unstable_state_changes: 1 } },
    { entity_id: 'db-primary', category: 'STABLE', score: 0.12, drift: { pattern: 'STABLE_TREND' }, observation_counts: { occurrences: 12, contradictions: 0, status_flips: 0, commitment_expirations: 0, verification_failures: 1, degraded_periods: 0, unstable_state_changes: 0 } }
];

const mockTemporalContext = {
    stability_trend: 'DEGRADING',
    oscillation_detected: true,
    oscillation_rate: 0.35,
    deltas: [{ delta_score: 0.1 }, { delta_score: 0.15 }]
};

const mockAwarenessSnapshots = [
    { chronic_entities: ['worker-A'], unstable_clusters: [], uncertainty_factors: ['observation_coverage'], generated_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    { chronic_entities: ['worker-A', 'worker-C'], unstable_clusters: [{ cluster_type: 'synchronized_degradation' }], uncertainty_factors: ['observation_coverage', 'oscillation_environment'], generated_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { chronic_entities: ['worker-A', 'worker-C'], unstable_clusters: [{ cluster_type: 'synchronized_degradation' }, { cluster_type: 'volatility_cluster' }], uncertainty_factors: ['observation_coverage', 'oscillation_environment', 'snapshot_comparison_limitation'], generated_at: new Date(Date.now() - 86400000).toISOString() }
];

// === TESTS ===

console.log('\n=== MCAI Phase 5B — Salience Formation Validator ===\n');

// Test Group 1: Persistent Salience Detection
console.log('[Test Group 1] Persistent Salience Detection');
test('Detect chronic instability signals', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const hasChronic = signals.chronic_instability.some(s => s.entity_id === 'worker-A' || s.entity_id === 'worker-C');
    return assert(hasChronic, `Expected chronic instability. Found: ${signals.chronic_instability.length}`);
});

test('Detect recurring contradiction signals', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    return assert(signals.recurring_contradiction.length > 0, `Expected contradiction signals. Found: ${signals.recurring_contradiction.length}`);
});

test('Detect repeated volatility signals', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    return assert(signals.repeated_volatility.length > 0, `Expected volatility. Found: ${signals.repeated_volatility.length}`);
});

test('Detect unresolved degradation signals', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    return assert(signals.unresolved_degradation.length > 0, `Expected degradation. Found: ${signals.unresolved_degradation.length}`);
});

test('Detect recurring verification decay signals', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    return assert(signals.recurring_verification_decay.length > 0, `Expected verification decay. Found: ${signals.recurring_verification_decay.length}`);
});

test('Detect temporal instability signals', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    return assert(signals.temporal_instability.length > 0, `Expected temporal instability. Found: ${signals.temporal_instability.length}`);
});

test('Detect repeated oscillation signals', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    return assert(signals.repeated_oscillation.length > 0, `Expected oscillation. Found: ${signals.repeated_oscillation.length}`);
});

test('All 8 salience signal categories present', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const required = ['chronic_instability', 'recurring_contradiction', 'repeated_volatility', 'unresolved_degradation', 'persistent_uncertainty', 'recurring_verification_decay', 'temporal_instability', 'repeated_oscillation'];
    const missing = required.filter(k => !Array.isArray(signals[k]));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

// Test Group 2: Salience Strength Classification
console.log('\n[Test Group 2] Salience Strength Classification');
test('TRANSIENT classification for low recurrence', () => {
    const result = classifySalienceStrength({ severity: 'low', recurrence_events: 1 }, 1, 1);
    return assert(result.level === 'TRANSIENT', `Got ${result.level}`);
});

test('EMERGING classification for moderate recurrence', () => {
    const result = classifySalienceStrength({ severity: 'medium', recurrence_events: 2 }, 2, 1);
    return assert(result.level === 'EMERGING', `Got ${result.level}`);
});

test('PERSISTENT classification for high recurrence', () => {
    const result = classifySalienceStrength({ severity: 'high', recurrence_events: 3 }, 3, 2);
    return assert(result.level === 'PERSISTENT', `Got ${result.level}`);
});

test('DOMINANT classification for very high recurrence', () => {
    const result = classifySalienceStrength({ severity: 'high', recurrence_events: 5 }, 5, 3);
    return assert(result.level === 'DOMINANT', `Got ${result.level}`);
});

test('All SALIENCE_LEVELS have required fields', () => {
    for (const [key, val] of Object.entries(SALIENCE_LEVELS)) {
        if (!val.level || !val.description || !val.requirements) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

// Test Group 3: Salience Clustering
console.log('\n[Test Group 3] Salience Clustering');
test('Detect synchronized instability cluster', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = {
                entity_id: p.entity_id,
                category_history: [p.category],
                score_history: [p.score],
                drift_patterns: [p.drift?.pattern || 'UNKNOWN'],
                observation_counts: [p.observation_counts],
                instability_events: [],
                contradiction_events: [],
                verification_failures: [],
                degraded_periods: [],
                oscillation_events: []
            };
        }
        if (p.observation_counts) {
            entitySalience[p.entity_id].instability_events.push(p.observation_counts.unstable_state_changes);
            entitySalience[p.entity_id].contradiction_events.push(p.observation_counts.contradictions);
            entitySalience[p.entity_id].verification_failures.push(p.observation_counts.verification_failures);
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
            if (p.drift?.pattern === 'OSCILLATING') entitySalience[p.entity_id].oscillation_events.push(1);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    const hasInstability = clusters.some(c => c.cluster_type === 'synchronized_instability');
    return assert(hasInstability, `Expected synchronized instability cluster. Found: ${clusters.map(c => c.cluster_type).join(', ')}`);
});

test('Cluster entities include expected entities', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = {
                entity_id: p.entity_id,
                category_history: [p.category],
                score_history: [p.score],
                drift_patterns: [],
                observation_counts: [],
                instability_events: [],
                contradiction_events: [],
                verification_failures: [],
                degraded_periods: [],
                oscillation_events: []
            };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    const instabilityCluster = clusters.find(c => c.cluster_type === 'synchronized_instability');
    return assert(instabilityCluster && instabilityCluster.entity_count >= 2, `Expected 2+ entities in cluster. Got ${instabilityCluster?.entity_count}`);
});

test('Clusters have required fields', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = { entity_id: p.entity_id, category_history: [p.category], score_history: [], drift_patterns: [], observation_counts: [], instability_events: [], contradiction_events: [], verification_failures: [], degraded_periods: [], oscillation_events: [] };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        entitySalience[p.entity_id].score_history.push(p.score);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    for (const c of clusters) {
        if (!c.cluster_type || !c.entity_count || !c.entities || !c.description || !c.significance) {
            return assert(false, `Missing fields in cluster: ${JSON.stringify(c)}`);
        }
    }
    return assert(true);
});

test('Detect multi-signal concentration cluster', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = { entity_id: p.entity_id, category_history: [p.category], score_history: [p.score], drift_patterns: [], observation_counts: [], instability_events: [], contradiction_events: [], verification_failures: [], degraded_periods: [], oscillation_events: [] };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        entitySalience[p.entity_id].score_history.push(p.score);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
            entitySalience[p.entity_id].contradiction_events.push(p.observation_counts.contradictions);
            entitySalience[p.entity_id].instability_events.push(p.observation_counts.unstable_state_changes);
            entitySalience[p.entity_id].verification_failures.push(p.observation_counts.verification_failures);
            if (p.drift?.pattern === 'OSCILLATING') entitySalience[p.entity_id].oscillation_events.push(1);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    return assert(clusters.length > 0, `Expected clusters. Found: ${clusters.length}`);
});

// Test Group 4: Temporal Profile Computation
console.log('\n[Test Group 4] Temporal Profile Computation');
test('INDETERMINATE when fewer than 2 snapshots', () => {
    const result = computeTemporalProfile([], {});
    return assert(result.profile === 'INDETERMINATE', `Got ${result.profile}`);
});

test('STRENGTHENING when second half has more salience', () => {
    const snapshots = [
        { chronic_entities: ['A'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: ['A', 'B'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: ['A', 'B', 'C'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: ['A', 'B', 'C', 'D'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() }
    ];
    const signals = { chronic_instability: [{ entity_id: 'A' }, { entity_id: 'B' }, { entity_id: 'C' }] };
    const result = computeTemporalProfile(snapshots, signals);
    return assert(result.profile === 'STRENGTHENING', `Got ${result.profile}`);
});

test('WEAKENING when second half has less salience', () => {
    const snapshots = [
        { chronic_entities: ['A', 'B', 'C'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: ['A', 'B'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: ['A'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: [], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() }
    ];
    const signals = { chronic_instability: [] };
    const result = computeTemporalProfile(snapshots, signals);
    return assert(result.profile === 'WEAKENING', `Got ${result.profile}`);
});

test('STABILIZING when salience is consistent', () => {
    const snapshots = [
        { chronic_entities: ['A', 'B'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: ['A', 'B'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: ['A', 'B'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: ['A', 'B'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() }
    ];
    const signals = { chronic_instability: [{ entity_id: 'A' }, { entity_id: 'B' }] };
    const result = computeTemporalProfile(snapshots, signals);
    return assert(result.profile === 'STABILIZING', `Got ${result.profile}`);
});

test('All TEMPORAL_PROFILES have required fields', () => {
    for (const [key, val] of Object.entries(TEMPORAL_PROFILES)) {
        if (!val.profile || !val.description || !val.interpretation) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

test('CYCLICAL when oscillating pattern detected', () => {
    const snapshots = [
        { chronic_entities: ['A'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: [], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: ['A', 'B'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: [], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() },
        { chronic_entities: ['A'], unstable_clusters: [], uncertainty_factors: [], generated_at: new Date().toISOString() }
    ];
    const signals = { repeated_oscillation: [{ pattern: 'OSCILLATION_DETECTED' }] };
    const result = computeTemporalProfile(snapshots, signals);
    return assert(result.profile === 'CYCLICAL', `Got ${result.profile}`);
});

// Test Group 5: Salience Memory Formation
console.log('\n[Test Group 5] Salience Memory Formation');
test('Salience record has all required fields', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = { entity_id: p.entity_id, category_history: [p.category], score_history: [p.score], drift_patterns: [], observation_counts: [], instability_events: [], contradiction_events: [], verification_failures: [], degraded_periods: [], oscillation_events: [] };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        entitySalience[p.entity_id].score_history.push(p.score);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
            entitySalience[p.entity_id].contradiction_events.push(p.observation_counts.contradictions);
            entitySalience[p.entity_id].instability_events.push(p.observation_counts.unstable_state_changes);
            entitySalience[p.entity_id].verification_failures.push(p.observation_counts.verification_failures);
            if (p.drift?.pattern === 'OSCILLATING') entitySalience[p.entity_id].oscillation_events.push(1);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    const temporalProfile = computeTemporalProfile(mockAwarenessSnapshots, signals);
    const record = generateSalienceRecord(mockPerceptions, mockAwarenessSnapshots[2], signals, clusters, temporalProfile, []);
    const required = ['salience_level', 'salient_entities', 'salient_patterns', 'persistence_summary', 'recurrence_summary', 'environmental_significance', 'uncertainty_boundaries', 'temporal_profile', 'clusters', 'generated_at', 'shadow_only'];
    const missing = required.filter(k => !(k in record));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

test('salience_level is valid enum', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = { entity_id: p.entity_id, category_history: [p.category], score_history: [p.score], drift_patterns: [], observation_counts: [], instability_events: [], contradiction_events: [], verification_failures: [], degraded_periods: [], oscillation_events: [] };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        entitySalience[p.entity_id].score_history.push(p.score);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
            entitySalience[p.entity_id].contradiction_events.push(p.observation_counts.contradictions);
            entitySalience[p.entity_id].instability_events.push(p.observation_counts.unstable_state_changes);
            entitySalience[p.entity_id].verification_failures.push(p.observation_counts.verification_failures);
            if (p.drift?.pattern === 'OSCILLATING') entitySalience[p.entity_id].oscillation_events.push(1);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    const temporalProfile = computeTemporalProfile(mockAwarenessSnapshots, signals);
    const record = generateSalienceRecord(mockPerceptions, mockAwarenessSnapshots[2], signals, clusters, temporalProfile, []);
    return assert(['TRANSIENT', 'EMERGING', 'PERSISTENT', 'DOMINANT'].includes(record.salience_level), `Invalid: ${record.salience_level}`);
});

test('shadow_only is true', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = { entity_id: p.entity_id, category_history: [p.category], score_history: [p.score], drift_patterns: [], observation_counts: [], instability_events: [], contradiction_events: [], verification_failures: [], degraded_periods: [], oscillation_events: [] };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        entitySalience[p.entity_id].score_history.push(p.score);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    const temporalProfile = computeTemporalProfile(mockAwarenessSnapshots, signals);
    const record = generateSalienceRecord(mockPerceptions, mockAwarenessSnapshots[2], signals, clusters, temporalProfile, []);
    return assert(record.shadow_only === true, `shadow_only is ${record.shadow_only}`);
});

test('salient_entities is array', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = { entity_id: p.entity_id, category_history: [p.category], score_history: [p.score], drift_patterns: [], observation_counts: [], instability_events: [], contradiction_events: [], verification_failures: [], degraded_periods: [], oscillation_events: [] };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        entitySalience[p.entity_id].score_history.push(p.score);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
            entitySalience[p.entity_id].contradiction_events.push(p.observation_counts.contradictions);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    const temporalProfile = computeTemporalProfile(mockAwarenessSnapshots, signals);
    const record = generateSalienceRecord(mockPerceptions, mockAwarenessSnapshots[2], signals, clusters, temporalProfile, []);
    return assert(Array.isArray(record.salient_entities), 'salient_entities not array');
});

test('uncertainty_boundaries is non-empty array', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = { entity_id: p.entity_id, category_history: [p.category], score_history: [p.score], drift_patterns: [], observation_counts: [], instability_events: [], contradiction_events: [], verification_failures: [], degraded_periods: [], oscillation_events: [] };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        entitySalience[p.entity_id].score_history.push(p.score);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    const temporalProfile = computeTemporalProfile(mockAwarenessSnapshots, signals);
    const record = generateSalienceRecord(mockPerceptions, mockAwarenessSnapshots[2], signals, clusters, temporalProfile, []);
    return assert(Array.isArray(record.uncertainty_boundaries) && record.uncertainty_boundaries.length > 0, 'No uncertainty boundaries');
});

test('generated_at is valid ISO timestamp', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = { entity_id: p.entity_id, category_history: [p.category], score_history: [p.score], drift_patterns: [], observation_counts: [], instability_events: [], contradiction_events: [], verification_failures: [], degraded_periods: [], oscillation_events: [] };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    const temporalProfile = computeTemporalProfile(mockAwarenessSnapshots, signals);
    const record = generateSalienceRecord(mockPerceptions, mockAwarenessSnapshots[2], signals, clusters, temporalProfile, []);
    const d = new Date(record.generated_at);
    return assert(!isNaN(d.getTime()), `Invalid timestamp: ${record.generated_at}`);
});

// Test Group 6: No Action/Recommendation Language
console.log('\n[Test Group 6] No Action/Recommendation Language');
test('Salience record contains no action words', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = { entity_id: p.entity_id, category_history: [p.category], score_history: [p.score], drift_patterns: [], observation_counts: [], instability_events: [], contradiction_events: [], verification_failures: [], degraded_periods: [], oscillation_events: [] };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    const temporalProfile = computeTemporalProfile(mockAwarenessSnapshots, signals);
    const record = generateSalienceRecord(mockPerceptions, mockAwarenessSnapshots[2], signals, clusters, temporalProfile, []);
    const text = record.environmental_significance?.interpretation + ' ' + record.uncertainty_boundaries.map(u => u.factor + ' ' + u.impact).join(' ') + ' ' + record.clusters.map(c => c.description).join(' ');
    const found = actionWords.filter(w => text.toLowerCase().includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('SALIENCE_LEVELS descriptions contain no action words', () => {
    const allText = Object.values(SALIENCE_LEVELS).map(v => v.description + ' ' + v.requirements).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in SALIENCE_LEVELS: ${found.join(', ')}`);
});

test('TEMPORAL_PROFILES descriptions contain no action words', () => {
    const allText = Object.values(TEMPORAL_PROFILES).map(v => v.description + ' ' + v.interpretation).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in TEMPORAL_PROFILES: ${found.join(', ')}`);
});

// Test Group 7: Deterministic Output
console.log('\n[Test Group 7] Deterministic Output');
test('Same input produces identical salience record (idempotency)', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = { entity_id: p.entity_id, category_history: [p.category], score_history: [p.score], drift_patterns: [], observation_counts: [], instability_events: [], contradiction_events: [], verification_failures: [], degraded_periods: [], oscillation_events: [] };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        entitySalience[p.entity_id].score_history.push(p.score);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
            entitySalience[p.entity_id].contradiction_events.push(p.observation_counts.contradictions);
            entitySalience[p.entity_id].instability_events.push(p.observation_counts.unstable_state_changes);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    const temporalProfile = computeTemporalProfile(mockAwarenessSnapshots, signals);
    const rec1 = generateSalienceRecord(mockPerceptions, mockAwarenessSnapshots[2], signals, clusters, temporalProfile, []);
    const rec2 = generateSalienceRecord(mockPerceptions, mockAwarenessSnapshots[2], signals, clusters, temporalProfile, []);
    return assert(JSON.stringify(rec1) === JSON.stringify(rec2), 'Records differ');
});

// Test Group 8: Snapshot Persistence
console.log('\n[Test Group 8] Snapshot Persistence');
test('Salience file is valid JSON after run', () => {
    const signals = detectPersistentSalience(mockPerceptions, mockTemporalContext, mockAwarenessSnapshots);
    const entitySalience = {};
    for (const p of mockPerceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = { entity_id: p.entity_id, category_history: [p.category], score_history: [p.score], drift_patterns: [], observation_counts: [], instability_events: [], contradiction_events: [], verification_failures: [], degraded_periods: [], oscillation_events: [] };
        }
        entitySalience[p.entity_id].category_history.push(p.category);
        if (p.observation_counts) {
            entitySalience[p.entity_id].degraded_periods.push(p.observation_counts.degraded_periods);
        }
    }
    const clusters = detectSalienceClusters(signals, entitySalience);
    const temporalProfile = computeTemporalProfile(mockAwarenessSnapshots, signals);
    const record = generateSalienceRecord(mockPerceptions, mockAwarenessSnapshots[2], signals, clusters, temporalProfile, []);

    // Save via runSalienceFormation
    runSalienceFormation({ perceptions: mockPerceptions, awarenessSnapshot: mockAwarenessSnapshots[2], temporalContext: mockTemporalContext, priorHistory: [] });

    const exists = fs.existsSync(SALIENCE_FILE);
    if (!exists) return assert(false, 'Salience file not created');
    try {
        const data = JSON.parse(fs.readFileSync(SALIENCE_FILE, 'utf8'));
        return assert(data.salience_level !== undefined, 'Missing salience_level');
    } catch (e) {
        return assert(false, e.message);
    }
});

test('History file is appended to', () => {
    const before = fs.existsSync(SALIENCE_HISTORY_FILE) ? fs.readFileSync(SALIENCE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length : 0;
    runSalienceFormation({ perceptions: mockPerceptions, awarenessSnapshot: mockAwarenessSnapshots[2], temporalContext: mockTemporalContext, priorHistory: [] });
    const after = fs.readFileSync(SALIENCE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length;
    return assert(after > before, `History did not grow. Before: ${before}, After: ${after}`);
});

test('Audit log contains MCAI-5B entry', () => {
    const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
    const mcai5bEntries = lines.filter(l => l.includes('"phase":"MCAI-5B"'));
    return assert(mcai5bEntries.length > 0, 'No MCAI-5B audit entries found');
});

// Test Group 9: Bounded Memory
console.log('\n[Test Group 9] Bounded Memory');
test('History respects retention limit', () => {
    const history = loadSalienceHistory();
    return assert(history.length <= 30, `History exceeds limit: ${history.length}`);
});

test('History entries are valid JSON', () => {
    const history = loadSalienceHistory();
    for (const entry of history.slice(-5)) {
        try {
            JSON.parse(JSON.stringify(entry));
        } catch {
            return assert(false, `Invalid history entry`);
        }
    }
    return assert(true);
});

// Test Group 10: Cross-Snapshot Continuity
console.log('\n[Test Group 10] Cross-Snapshot Continuity');
test('trackSaliencePersistence detects new entities', () => {
    // Need 2+ history entries for persistence tracking to work
    const current = { salient_entities: ['A', 'B', 'C'] };
    const history = [
        { salient_entities: ['A', 'B'], generated_at: new Date().toISOString() },
        { salient_entities: ['A', 'B', 'D'], generated_at: new Date().toISOString() }
    ];
    const result = trackSaliencePersistence(current, history);
    return assert(result.new_salient_entities.includes('C') && result.persistent_entities.includes('A'), `New: ${result.new_salient_entities}, Persistent: ${result.persistent_entities}`);
});

test('trackSaliencePersistence detects persistent entities', () => {
    const current = { salient_entities: ['A', 'B', 'C'] };
    const history = [
        { salient_entities: ['A', 'D'], generated_at: new Date().toISOString() },
        { salient_entities: ['A', 'B'], generated_at: new Date().toISOString() }
    ];
    const result = trackSaliencePersistence(current, history);
    return assert(result.persistent_entities.includes('A'), `Expected A persistent. Got: ${result.persistent_entities.join(', ')}`);
});

test('trackSaliencePersistence detects departed entities', () => {
    const current = { salient_entities: ['A', 'B'] };
    const history = [{ salient_entities: ['A', 'B', 'C'], generated_at: new Date().toISOString() }];
    const result = trackSaliencePersistence(current, history);
    return assert(result.departed_salient_entities.includes('C'), `Expected C departed. Got: ${result.departed_salient_entities.join(', ')}`);
});

// Test Group 11: Repeat-Run Stability
console.log('\n[Test Group 11] Repeat-Run Stability');
test('runSalienceFormation produces stable output on repeated runs', () => {
    const context = { perceptions: mockPerceptions, awarenessSnapshot: mockAwarenessSnapshots[2], temporalContext: mockTemporalContext, priorHistory: [] };
    const rec1 = runSalienceFormation(context);
    const rec2 = runSalienceFormation(context);
    return assert(rec1.salience_level === rec2.salience_level && rec1.salient_entities.length === rec2.salient_entities.length, 'Repeat runs produced different results');
});

// === SUMMARY ===

console.log('\n=== Validation Summary ===');
console.log(`Tests run:    ${tests_run}`);
console.log(`Tests passed: ${tests_passed}`);
console.log(`Tests failed: ${tests_failed}`);

if (tests_failed === 0) {
    console.log('\n✅ All tests passed. Salience formation layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

process.exit(tests_failed > 0 ? 1 : 0);