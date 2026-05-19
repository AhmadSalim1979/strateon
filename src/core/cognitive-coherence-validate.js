/**
 * Cognitive Coherence Validator — MCAI Phase 5E
 * Validates cognitive coherence for SHADOW-only operation.
 * 
 * Tests:
 * 1. Coherence computation from upstream layers
 * 2. Coherence state classification
 * 3. Fragmentation detection
 * 4. Contradiction zone detection
 * 5. Layer alignment tracking
 * 6. Coherence drift tracking
 * 7. Deterministic outputs
 * 8. No action/recommendation language
 * 9. Snapshot persistence
 * 10. Bounded memory retention
 * 11. Audit logging
 * 12. Repeat-run stability
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const COHERENCE_FILE = path.join(STATE_DIR, 'cognitive-coherence.json');
const COHERENCE_HISTORY_FILE = path.join(STATE_DIR, 'cognitive-coherence-history.jsonl');

const {
    computeCognitiveCoherence,
    trackCoherenceDrift,
    trackCoherencePersistence,
    runCognitiveCoherence,
    loadCoherenceHistory,
    COHERENCE_STATES,
    DRIFT_PROFILES,
    MAX_HISTORY
} = require('./cognitive-coherence.js');

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

const mockPressureMapping = {
    strain_level: 'HIGH',
    unresolved_pressure_count: 8,
    chronic_entities: ['worker-A', 'worker-C'],
    pressure_concentration: { classification: 'CONCENTRATED' },
    pressure_trajectory: { pattern: 'INDETERMINATE' }
};

const mockSalienceRecord = {
    salience_level: 'PERSISTENT',
    salient_entities: ['worker-A', 'worker-C', 'gateway-X'],
    salient_patterns: [
        { pattern_type: 'chronic_instability', instances: 2, entities: ['worker-A', 'worker-C'], highest_severity: 'high' },
        { pattern_type: 'recurring_contradiction', instances: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], highest_severity: 'medium' }
    ],
    clusters: [
        { cluster_type: 'synchronized_instability', entity_count: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], significance: 'high' },
        { cluster_type: 'contradiction_cluster', entity_count: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], significance: 'medium' }
    ],
    temporal_profile: { current_profile: 'STRENGTHENING' }
};

const mockAttentionRecord = {
    attention_level: 'ELEVATED',
    active_attention_entities: [
        { entity_id: 'worker-A', activation_level: 'DOMINANT' },
        { entity_id: 'worker-C', activation_level: 'ELEVATED' },
        { entity_id: 'gateway-X', activation_level: 'ACTIVE' }
    ],
    capacity_assessment: { state: 'PARTIAL', saturation_score: 0.6, fragmentation: 0 },
    attention_competition: { competition_intensity: 0.7 },
    transition_profile: { profile: 'STABILIZING' }
};

const mockContextualRelevance = {
    contextual_state: 'SIGNIFICANT',
    amplification_patterns: [
        { pattern_type: 'concurrent_instability', context_weight: 2 },
        { pattern_type: 'cluster_overlap', context_weight: 2 }
    ],
    suppression_patterns: [],
    contextual_pressure_relationships: { amplification_score: 4, suppression_score: 0, net_context_score: 4 },
    contextual_drift: { profile: 'STABILIZING' }
};

const mockTemporalContext = {
    stability_trend: 'STABLE',
    current_profile: 'STABLE',
    temporal_profile: { current_profile: 'STABLE' }
};

const mockCoherenceHistory = [
    { coherence_state: 'TENSIONED', contradiction_zones: [{ zone_type: 'pressure_salience_mismatch' }] },
    { coherence_state: 'TENSIONED', contradiction_zones: [{ zone_type: 'attention_context_mismatch' }] },
    { coherence_state: 'FRAGMENTED', contradiction_zones: [{ zone_type: 'pressure_salience_mismatch' }, { zone_type: 'attention_context_mismatch' }] }
];

// === TESTS ===

console.log('\n=== MCAI Phase 5E — Cognitive Coherence Validator ===\n');

// Test Group 1: Coherence Computation
console.log('[Test Group 1] Coherence Computation');
test('Computes coherence from all upstream layers', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext
    });
    return assert(result.coherence_state !== undefined, `Coherence state is undefined`);
});

test('Computes coherence strength', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext
    });
    return assert(typeof result.coherence_strength === 'number', `coherence_strength not a number`);
});

test('Identifies aligned layers', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext
    });
    return assert(Array.isArray(result.aligned_layers), `aligned_layers not an array`);
});

test('Identifies fragmented layers', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext
    });
    return assert(Array.isArray(result.fragmented_layers), `fragmented_layers not an array`);
});

test('Detects contradiction zones', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext
    });
    return assert(Array.isArray(result.contradiction_zones), `contradiction_zones not an array`);
});

test('Computes layer alignments', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext
    });
    return assert(typeof result.layer_alignments === 'object' && result.layer_alignments !== null, `layer_alignments not an object`);
});

test('Computes coherence pressures', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext
    });
    return assert(Array.isArray(result.coherence_pressures), `coherence_pressures not an array`);
});

// Test Group 2: Coherence State Classification
console.log('\n[Test Group 2] Coherence State Classification');
test('Coherence state is valid enum', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext
    });
    return assert(['COHERENT', 'TENSIONED', 'FRAGMENTED', 'DISSONANT'].includes(result.coherence_state), `Invalid: ${result.coherence_state}`);
});

test('All COHERENCE_STATES have required fields', () => {
    for (const [key, val] of Object.entries(COHERENCE_STATES)) {
        if (!val.state || !val.description || !val.requirements) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

test('High strain with low salience creates contradiction', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: { strain_level: 'SEVERE', unresolved_pressure_count: 10, pressure_trajectory: { pattern: 'INDETERMINATE' } },
        salienceRecord: { salience_level: 'TRANSIENT', clusters: [], temporal_profile: { current_profile: 'STABLE' } },
        attentionRecord: { attention_level: 'ACTIVE', capacity_assessment: { state: 'AVAILABLE' }, transition_profile: { profile: 'STABILIZING' }, attention_competition: { competition_intensity: 0.3 } },
        contextualRelevance: { contextual_state: 'CONTEXTUAL', contextual_pressure_relationships: { net_context_score: 2 }, contextual_drift: { profile: 'STABILIZING' } },
        temporalContext: { stability_trend: 'STABLE', current_profile: 'STABLE', temporal_profile: { current_profile: 'STABLE' } }
    });
    return assert(result.contradiction_zones.some(z => z.zone_type === 'pressure_salience_mismatch'), `No pressure_salience_mismatch detected`);
});

test('Elevated attention with low context creates contradiction', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: { strain_level: 'LOW', unresolved_pressure_count: 1, pressure_trajectory: { pattern: 'INDETERMINATE' } },
        salienceRecord: { salience_level: 'EMERGING', clusters: [{ significance: 'low' }], temporal_profile: { current_profile: 'STABLE' } },
        attentionRecord: { attention_level: 'DOMINANT', capacity_assessment: { state: 'HIGH' }, transition_profile: { profile: 'STRENGTHENING' }, attention_competition: { competition_intensity: 0.9 } },
        contextualRelevance: { contextual_state: 'INCIDENTAL', contextual_pressure_relationships: { net_context_score: 1 }, contextual_drift: { profile: 'STABILIZING' } },
        temporalContext: { stability_trend: 'STABLE', current_profile: 'STABLE', temporal_profile: { current_profile: 'STABLE' } }
    });
    return assert(result.contradiction_zones.some(z => z.zone_type === 'attention_context_mismatch'), `No attention_context_mismatch detected`);
});

// Test Group 3: Fragmentation Detection
console.log('\n[Test Group 3] Fragmentation Detection');
test('Multiple high-significance clusters create contradiction', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: { strain_level: 'LOW', unresolved_pressure_count: 2, pressure_trajectory: { pattern: 'INDETERMINATE' } },
        salienceRecord: {
            salience_level: 'PERSISTENT',
            clusters: [
                { significance: 'high' },
                { significance: 'high' },
                { significance: 'high' }
            ],
            temporal_profile: { current_profile: 'STABLE' }
        },
        attentionRecord: { attention_level: 'ACTIVE', capacity_assessment: { state: 'AVAILABLE', fragmentation: 0 }, transition_profile: { profile: 'STABILIZING' }, attention_competition: { competition_intensity: 0.3 } },
        contextualRelevance: { contextual_state: 'CONTEXTUAL', contextual_pressure_relationships: { net_context_score: 2 }, contextual_drift: { profile: 'STABILIZING' } },
        temporalContext: { stability_trend: 'STABLE', current_profile: 'STABLE', temporal_profile: { current_profile: 'STABLE' } }
    });
    return assert(result.contradiction_zones.some(z => z.zone_type === 'competing_dominant_clusters'), `No competing_dominant_clusters detected`);
});

test('Attention overload creates fragmentation signal', () => {
    const result = computeCognitiveCoherence({
        pressureMapping: { strain_level: 'LOW', unresolved_pressure_count: 2, pressure_trajectory: { pattern: 'INDETERMINATE' } },
        salienceRecord: { salience_level: 'EMERGING', clusters: [], temporal_profile: { current_profile: 'STABLE' } },
        attentionRecord: { attention_level: 'DOMINANT', capacity_assessment: { state: 'SATURATED', overload_indicator: true, fragmentation: 0.7 }, transition_profile: { profile: 'SATURATING' }, attention_competition: { competition_intensity: 1.0 } },
        contextualRelevance: { contextual_state: 'SIGNIFICANT', contextual_pressure_relationships: { net_context_score: 3 }, contextual_drift: { profile: 'STABILIZING' } },
        temporalContext: { stability_trend: 'STABLE', current_profile: 'STABLE', temporal_profile: { current_profile: 'STABLE' } }
    });
    return assert(result.fragmentation_signals.some(s => s.signal_type === 'attention_overload_fragmentation'), `No attention_overload_fragmentation detected`);
});

// Test Group 4: Coherence Drift Tracking
console.log('\n[Test Group 4] Coherence Drift Tracking');
test('STRENGTHENING when coherence improving', () => {
    const history = [
        { coherence_state: 'FRAGMENTED' },
        { coherence_state: 'TENSIONED' },
        { coherence_state: 'TENSIONED' },
        { coherence_state: 'COHERENT' }
    ];
    const drift = trackCoherenceDrift(history);
    return assert(drift.profile === 'STRENGTHENING', `Expected STRENGTHENING, got ${drift.profile}`);
});

test('WEAKENING when coherence degrading', () => {
    const history = [
        { coherence_state: 'COHERENT' },
        { coherence_state: 'TENSIONED' },
        { coherence_state: 'FRAGMENTED' },
        { coherence_state: 'FRAGMENTED' }
    ];
    const drift = trackCoherenceDrift(history);
    return assert(drift.profile === 'WEAKENING', `Expected WEAKENING, got ${drift.profile}`);
});

test('STABILIZING when coherence consistent', () => {
    const history = [
        { coherence_state: 'TENSIONED' },
        { coherence_state: 'TENSIONED' },
        { coherence_state: 'TENSIONED' },
        { coherence_state: 'TENSIONED' }
    ];
    const drift = trackCoherenceDrift(history);
    return assert(drift.profile === 'STABILIZING', `Expected STABILIZING, got ${drift.profile}`);
});

test('OSCILLATING when coherence alternating', () => {
    const history = [
        { coherence_state: 'COHERENT' },
        { coherence_state: 'FRAGMENTED' },
        { coherence_state: 'COHERENT' },
        { coherence_state: 'FRAGMENTED' }
    ];
    const drift = trackCoherenceDrift(history);
    return assert(drift.profile === 'OSCILLATING', `Expected OSCILLATING, got ${drift.profile}`);
});

test('FRAGMENTING when variance high with low oscillation (does not trigger OSCILLATING)', () => {
    // For FRAGMENTING: variance >= 1.5, delta small, oscillationCount >= 1
    // But must NOT trigger OSCILLATING first: oscillationCount >= 2 AND oscillationCount >= length * 0.3
    // Use [4,4,1,4]: variance=2.25, delta=0, oscillationCount=1 (between pos 2-3: 4->1 breaks threshold)
    // This avoids OSCILLATING but meets FRAGMENTING conditions
    const history = [
        { coherence_state: 'COHERENT' },
        { coherence_state: 'COHERENT' },
        { coherence_state: 'DISSONANT' },
        { coherence_state: 'COHERENT' }
    ];
    const drift = trackCoherenceDrift(history);
    return assert(drift.profile === 'FRAGMENTING', `Expected FRAGMENTING, got ${drift.profile}`);
});

test('RECOVERING when fragmented improving to coherent', () => {
    const history = [
        { coherence_state: 'DISSONANT' },
        { coherence_state: 'FRAGMENTED' },
        { coherence_state: 'TENSIONED' },
        { coherence_state: 'COHERENT' }
    ];
    const drift = trackCoherenceDrift(history);
    return assert(drift.profile === 'RECOVERING', `Expected RECOVERING, got ${drift.profile}`);
});

test('INDETERMINATE when insufficient history', () => {
    const drift = trackCoherenceDrift([{ coherence_state: 'COHERENT' }]);
    return assert(drift.profile === 'INDETERMINATE', `Expected INDETERMINATE, got ${drift.profile}`);
});

test('All DRIFT_PROFILES have required fields', () => {
    for (const [key, val] of Object.entries(DRIFT_PROFILES)) {
        if (!val.profile || !val.description || !val.interpretation) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

// Test Group 5: No Action/Recommendation Language
console.log('\n[Test Group 5] No Action/Recommendation Language');
test('Coherence record contains no action words', () => {
    const record = runCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext,
        coherenceHistory: mockCoherenceHistory
    });
    const text = JSON.stringify(record);
    const found = actionWords.filter(w => text.toLowerCase().includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('COHERENCE_STATES descriptions contain no action words', () => {
    const allText = Object.values(COHERENCE_STATES).map(v => v.description + ' ' + v.requirements).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in COHERENCE_STATES: ${found.join(', ')}`);
});

test('DRIFT_PROFILES descriptions contain no action words', () => {
    const allText = Object.values(DRIFT_PROFILES).map(v => v.description + ' ' + v.interpretation).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in DRIFT_PROFILES: ${found.join(', ')}`);
});

// Test Group 6: Deterministic Output
console.log('\n[Test Group 6] Deterministic Output');
test('Same input produces identical coherence record (idempotency)', () => {
    // Clear state files for deterministic baseline
    const stateFiles = [COHERENCE_FILE, COHERENCE_HISTORY_FILE];
    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const context = {
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext,
        coherenceHistory: mockCoherenceHistory
    };
    const rec1 = runCognitiveCoherence(context);

    // Reset for second run
    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const rec2 = runCognitiveCoherence(context);

    // Compare deterministic fields (ignore generated_at)
    const det1 = { ...rec1 }; delete det1.generated_at;
    const det2 = { ...rec2 }; delete det2.generated_at;
    return assert(JSON.stringify(det1) === JSON.stringify(det2), 'Repeat runs produced different results');
});

// Test Group 7: Snapshot Persistence
console.log('\n[Test Group 7] Snapshot Persistence');
test('Coherence file is valid JSON after run', () => {
    runCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext,
        coherenceHistory: mockCoherenceHistory
    });
    const exists = fs.existsSync(COHERENCE_FILE);
    if (!exists) return assert(false, 'Coherence file not created');
    try {
        const data = JSON.parse(fs.readFileSync(COHERENCE_FILE, 'utf8'));
        return assert(data.coherence_state !== undefined, 'Missing coherence_state');
    } catch (e) {
        return assert(false, e.message);
    }
});

test('History file is appended to', () => {
    const before = fs.existsSync(COHERENCE_HISTORY_FILE) ? fs.readFileSync(COHERENCE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length : 0;
    runCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext,
        coherenceHistory: mockCoherenceHistory
    });
    const after = fs.readFileSync(COHERENCE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length;
    return assert(after > before, `History did not grow. Before: ${before}, After: ${after}`);
});

test('Audit log contains MCAI-5E entry', () => {
    const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
    const mcai5eEntries = lines.filter(l => l.includes('"phase":"MCAI-5E"'));
    return assert(mcai5eEntries.length > 0, 'No MCAI-5E audit entries found');
});

// Test Group 8: Bounded Memory
console.log('\n[Test Group 8] Bounded Memory');
test('History respects retention limit', () => {
    const history = loadCoherenceHistory();
    return assert(history.length <= MAX_HISTORY, `History exceeds limit: ${history.length}`);
});

test('History entries are valid JSON', () => {
    const history = loadCoherenceHistory();
    for (const entry of history.slice(-5)) {
        try {
            JSON.parse(JSON.stringify(entry));
        } catch {
            return assert(false, `Invalid history entry`);
        }
    }
    return assert(true);
});

// Test Group 9: Main Record Schema
console.log('\n[Test Group 9] Main Record Schema');
test('Coherence record has all required fields', () => {
    const record = runCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext,
        coherenceHistory: mockCoherenceHistory
    });
    const required = [
        'coherence_state', 'coherence_strength', 'aligned_layers', 'fragmented_layers',
        'contradiction_zones', 'coherence_pressures', 'layer_alignments', 'fragmentation_signals',
        'coherence_drift_profile', 'persistence_summary', 'uncertainty_boundaries',
        'environmental_consistency_summary', 'generated_at', 'shadow_only'
    ];
    const missing = required.filter(k => !(k in record));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

test('shadow_only is true', () => {
    const record = runCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext,
        coherenceHistory: mockCoherenceHistory
    });
    return assert(record.shadow_only === true, `shadow_only is ${record.shadow_only}`);
});

test('uncertainty_boundaries is non-empty array', () => {
    const record = runCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext,
        coherenceHistory: mockCoherenceHistory
    });
    return assert(Array.isArray(record.uncertainty_boundaries) && record.uncertainty_boundaries.length > 0, 'No uncertainty boundaries');
});

test('generated_at is valid ISO timestamp', () => {
    const record = runCognitiveCoherence({
        pressureMapping: mockPressureMapping,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRelevance: mockContextualRelevance,
        temporalContext: mockTemporalContext,
        coherenceHistory: mockCoherenceHistory
    });
    const d = new Date(record.generated_at);
    return assert(!isNaN(d.getTime()), `Invalid timestamp: ${record.generated_at}`);
});

// === SUMMARY ===

console.log('\n=== Validation Summary ===');
console.log(`Tests run:    ${tests_run}`);
console.log(`Tests passed: ${tests_passed}`);
console.log(`Tests failed: ${tests_failed}`);

if (tests_failed === 0) {
    console.log('\n✅ All tests passed. Cognitive coherence layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

process.exit(tests_failed > 0 ? 1 : 0);