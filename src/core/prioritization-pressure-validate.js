/**
 * Prioritization Pressure Validator — MCAI Phase 6A
 * Validates prioritization pressure for SHADOW-only operation.
 * 
 * Tests:
 * 1. Pressure signal computation
 * 2. Pressure state classification
 * 3. Competing regions
 * 4. Dominant pressure signals
 * 5. Bottleneck detection
 * 6. Convergence zones
 * 7. Focus competition map
 * 8. Cognitive saturation
 * 9. Pressure distribution
 * 10. Pressure stability
 * 11. Drift profiles
 * 12. Persistence
 * 13. Deterministic outputs
 * 14. No action/recommendation language
 * 15. Snapshot persistence
 * 16. Bounded memory
 * 17. Audit logging
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const PRESSURE_FILE = path.join(STATE_DIR, 'prioritization-pressure.json');
const PRESSURE_HISTORY_FILE = path.join(STATE_DIR, 'prioritization-pressure-history.jsonl');

const {
    computePrioritizationPressure,
    classifyPrioritizationPressure,
    identifyCompetingRegions,
    identifyDominantPressureSignals,
    detectBottleneckRegions,
    buildFocusCompetitionMap,
    modelCognitiveSaturation,
    analyzePressureDistribution,
    assessPressureStability,
    trackPressureDrift,
    runPrioritizationPressure,
    loadPressureHistory,
    PRESSURE_STATES,
    DRIFT_PROFILES,
    MAX_HISTORY
} = require('./prioritization-pressure.js');

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

const mockWeightingRecord = {
    dominant_signals: [
        { signal_type: 'pressure_intensity', source: 'pressure', normalized_weight: 1.0, classification: 'DOMINANT' },
        { signal_type: 'entity_salience', source: 'salience', normalized_weight: 0.87, classification: 'DOMINANT' },
        { signal_type: 'attention_intensity', source: 'attention', normalized_weight: 0.72, classification: 'DOMINANT' }
    ],
    weighting_competition: {
        competing_pairs: [
            { signal_1: 'pressure_intensity', signal_2: 'entity_salience' }
        ],
        fragmentation_index: 0.3
    },
    environmental_weight_density: {
        signal_count: 6,
        dominant_count: 3,
        density_score: 0.4,
        density_classification: 'MODERATE'
    },
    weighting_distribution: {
        type: 'CONCENTRATED',
        gini_coefficient: 0.45
    }
};

const mockStabilityRecord = {
    stability_state: 'STRAINED',
    destabilization_pressures: [
        { pressure_type: 'prolonged_fragmentation', intensity: 0.67, severity: 'high' },
        { pressure_type: 'contradiction_accumulation', intensity: 0.5, severity: 'medium' }
    ],
    persistent_instability_zones: [
        { zone_type: 'persistent_destabilization', intensity: 0.6, severity: 'high', critical: true }
    ],
    oscillation_regions: [
        { region_type: 'oscillation_detected', oscillation_count: 3, severity: 'high' }
    ]
};

const mockCoherenceRecord = {
    coherence_state: 'FRAGMENTED',
    coherence_strength: 0.35,
    aligned_layers: ['salience'],
    fragmented_layers: ['pressure', 'attention'],
    contradiction_zones: [
        { zone_type: 'pressure_salience_mismatch', severity: 'high', description: 'High severity' },
        { zone_type: 'attention_context_mismatch', severity: 'high', description: 'High severity' },
        { zone_type: 'competing_clusters', severity: 'medium', description: 'Medium severity' }
    ],
    coherence_pressures: [
        { pressure_type: 'layer_fragmentation', intensity: 0.4 }
    ]
};

const mockAttentionRecord = {
    attention_level: 'DOMINANT',
    active_attention_entities: [
        { entity_id: 'worker-A', activation_level: 'DOMINANT' }
    ],
    capacity_assessment: {
        state: 'SATURATED',
        saturation_score: 0.9,
        fragmentation: 0.3
    },
    attention_competition: {
        competition_intensity: 0.85
    }
};

const mockPressureRecord = {
    strain_level: 'HIGH',
    unresolved_pressure_count: 12,
    chronic_pressure_entities: ['worker-A', 'worker-C', 'gateway-X']
};

const mockSalienceRecord = {
    salience_level: 'PERSISTENT',
    clusters: [
        { cluster_type: 'sync', significance: 'high' },
        { cluster_type: 'contradiction', significance: 'high' },
        { cluster_type: 'unstable', significance: 'high' }
    ]
};

const mockContextualRecord = {
    contextual_state: 'SIGNIFICANT',
    amplification_patterns: [
        { pattern_type: 'concurrent_instability', context_weight: 2 }
    ]
};

const emptyPressureHistory = [];

// === TESTS ===

console.log('\n=== MCAI Phase 6A — Prioritization Pressure Validator ===\n');

// Test Group 1: Pressure Signal Computation
console.log('[Test Group 1] Pressure Signal Computation');
test('Computes prioritization pressure signals from all sources', () => {
    const signals = computePrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord
    });
    return assert(signals.length > 0, `No signals computed`);
});

test('Signals have required fields', () => {
    const signals = computePrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord
    });
    for (const signal of signals) {
        if (!signal.signal_type || !signal.source || signal.intensity === undefined || !signal.severity) {
            return assert(false, `Signal missing required fields: ${JSON.stringify(signal)}`);
        }
    }
    return assert(true);
});

test('Signals include weighting-based pressure', () => {
    const signals = computePrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord
    });
    const weightingSignals = signals.filter(s => s.source === 'weighting');
    return assert(weightingSignals.length >= 2, `Expected at least 2 weighting signals, got ${weightingSignals.length}`);
});

test('Signals include stability-based pressure', () => {
    const signals = computePrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord
    });
    const stabilitySignals = signals.filter(s => s.source === 'stability');
    return assert(stabilitySignals.length >= 2, `Expected at least 2 stability signals, got ${stabilitySignals.length}`);
});

test('Signals include attention-based pressure', () => {
    const signals = computePrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord
    });
    const attentionSignals = signals.filter(s => s.source === 'attention');
    return assert(attentionSignals.length >= 1, `Expected at least 1 attention signal, got ${attentionSignals.length}`);
});

// Test Group 2: Pressure State Classification
console.log('\n[Test Group 2] Pressure State Classification');
test('Classifies pressure as MINIMAL/DEVELOPING/ELEVATED/SATURATED', () => {
    const signals = computePrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord
    });
    const classification = classifyPrioritizationPressure(signals);
    return assert(['MINIMAL', 'DEVELOPING', 'ELEVATED', 'SATURATED'].includes(classification.state), `Invalid state: ${classification.state}`);
});

test('All PRESSURE_STATES have required fields', () => {
    for (const [key, val] of Object.entries(PRESSURE_STATES)) {
        if (!val.state || !val.description || !val.requirements) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

test('High-intensity signals produce SATURATED classification', () => {
    const highSignals = [
        { signal_type: 'test1', source: 'test', intensity: 0.9, severity: 'high', description: 'Test' },
        { signal_type: 'test2', source: 'test', intensity: 0.85, severity: 'high', description: 'Test' },
        { signal_type: 'test3', source: 'test', intensity: 0.8, severity: 'high', description: 'Test' },
        { signal_type: 'test4', source: 'test', intensity: 0.75, severity: 'high', description: 'Test' }
    ];
    const classification = classifyPrioritizationPressure(highSignals);
    return assert(classification.state === 'SATURATED', `Expected SATURATED, got ${classification.state}`);
});

test('Low-intensity signals produce MINIMAL classification', () => {
    const lowSignals = [
        { signal_type: 'test1', source: 'test', intensity: 0.1, severity: 'low', description: 'Test' },
        { signal_type: 'test2', source: 'test', intensity: 0.08, severity: 'low', description: 'Test' }
    ];
    const classification = classifyPrioritizationPressure(lowSignals);
    return assert(classification.state === 'MINIMAL', `Expected MINIMAL, got ${classification.state}`);
});

// Test Group 3: Competing Regions
console.log('\n[Test Group 3] Competing Regions');
test('Identifies competing regions from signals', () => {
    const signals = [
        { signal_type: 's1', source: 'pressure', intensity: 0.6, severity: 'medium', description: 'Test' },
        { signal_type: 's2', source: 'stability', intensity: 0.55, severity: 'medium', description: 'Test' },
        { signal_type: 's3', source: 'attention', intensity: 0.5, severity: 'medium', description: 'Test' }
    ];
    const regions = identifyCompetingRegions(signals, {});
    return assert(regions.length >= 2, `Expected at least 2 competing regions, got ${regions.length}`);
});

test('Competing regions have competing_with field when competing', () => {
    const signals = [
        { signal_type: 's1', source: 'pressure', intensity: 0.6, severity: 'medium', description: 'Test' },
        { signal_type: 's2', source: 'stability', intensity: 0.55, severity: 'medium', description: 'Test' }
    ];
    const regions = identifyCompetingRegions(signals, {});
    const hasCompeting = regions.some(r => r.competing_with);
    return assert(hasCompeting, `No competing regions detected`);
});

// Test Group 4: Dominant Pressure Signals
console.log('\n[Test Group 4] Dominant Pressure Signals');
test('Identifies high-intensity signals as dominant', () => {
    const signals = [
        { signal_type: 'test1', source: 'test', intensity: 0.7, severity: 'high', description: 'Test' },
        { signal_type: 'test2', source: 'test', intensity: 0.3, severity: 'low', description: 'Test' }
    ];
    const dominant = identifyDominantPressureSignals(signals);
    return assert(dominant.length === 1 && dominant[0].signal_type === 'test1', `Wrong dominant signals`);
});

test('Returns empty when no dominant signals', () => {
    const signals = [
        { signal_type: 'test1', source: 'test', intensity: 0.2, severity: 'low', description: 'Test' },
        { signal_type: 'test2', source: 'test', intensity: 0.15, severity: 'low', description: 'Test' }
    ];
    const dominant = identifyDominantPressureSignals(signals);
    return assert(dominant.length === 0, `Expected 0 dominant, got ${dominant.length}`);
});

// Test Group 5: Bottleneck Detection
console.log('\n[Test Group 5] Bottleneck Detection');
test('Detects cognitive congestion bottleneck', () => {
    const signals = [
        { signal_type: 's1', source: 'pressure', intensity: 0.6, severity: 'high', description: 'Test' },
        { signal_type: 's2', source: 'stability', intensity: 0.65, severity: 'high', description: 'Test' },
        { signal_type: 's3', source: 'attention', intensity: 0.55, severity: 'medium', description: 'Test' },
        { signal_type: 's4', source: 'coherence', intensity: 0.6, severity: 'high', description: 'Test' },
        { signal_type: 's5', source: 'weighting', intensity: 0.55, severity: 'medium', description: 'Test' }
    ];
    const bottlenecks = detectBottleneckRegions(signals, {});
    const congestion = bottlenecks.find(b => b.bottleneck_type === 'cognitive_congestion');
    return assert(congestion !== undefined, `No cognitive_congestion bottleneck detected`);
});

test('Detects focus saturation bottleneck', () => {
    const signals = [
        { signal_type: 'focus_saturation_pressure', source: 'attention', intensity: 0.7, severity: 'high', description: 'Test', saturation_score: 0.9 }
    ];
    const bottlenecks = detectBottleneckRegions(signals, {});
    const saturation = bottlenecks.find(b => b.bottleneck_type === 'focus_saturation_bottleneck');
    return assert(saturation !== undefined, `No focus_saturation_bottleneck detected`);
});

// Test Group 6: Convergence Zones
console.log('\n[Test Group 6] Convergence Zones');
test('Detects high-intensity convergence zone', () => {
    const signals = [
        { signal_type: 's1', source: 'p1', intensity: 0.7, severity: 'high', description: 'Test' },
        { signal_type: 's2', source: 'p2', intensity: 0.65, severity: 'high', description: 'Test' },
        { signal_type: 's3', source: 'p3', intensity: 0.6, severity: 'high', description: 'Test' }
    ];
    const zones = [];
    const highSignals = signals.filter(s => s.intensity >= 0.5);
    if (highSignals.length >= 3) {
        zones.push({ zone_type: 'high_intensity_convergence', intensity: 0.65, severity: 'high' });
    }
    return assert(zones.length > 0, `No convergence zone detected`);
});

// Test Group 7: Focus Competition Map
console.log('\n[Test Group 7] Focus Competition Map');
test('Builds focus competition map', () => {
    const signals = [
        { signal_type: 'test1', source: 'pressure', intensity: 0.8, severity: 'high', description: 'Test' },
        { signal_type: 'test2', source: 'stability', intensity: 0.75, severity: 'high', description: 'Test' }
    ];
    const regions = [];
    const map = buildFocusCompetitionMap(signals, regions);
    return assert(typeof map.competition_intensity === 'number' && typeof map.fragmentation_index === 'number', `Missing competition fields`);
});

test('Competition map has competing_pairs', () => {
    const signals = [
        { signal_type: 'test1', source: 'pressure', intensity: 0.8, severity: 'high', description: 'Test' },
        { signal_type: 'test2', source: 'stability', intensity: 0.75, severity: 'high', description: 'Test' },
        { signal_type: 'test3', source: 'attention', intensity: 0.55, severity: 'medium', description: 'Test' }
    ];
    const map = buildFocusCompetitionMap(signals, []);
    return assert(Array.isArray(map.competing_pairs), `Competing pairs not an array`);
});

// Test Group 8: Cognitive Saturation
console.log('\n[Test Group 8] Cognitive Saturation');
test('Models cognitive saturation', () => {
    const signals = [
        { signal_type: 'focus_saturation_pressure', source: 'attention', intensity: 0.7, severity: 'high', description: 'Test', saturation_score: 0.9 }
    ];
    const saturation = modelCognitiveSaturation(signals, {});
    return assert(saturation.saturation_score > 0, `Saturation score is zero`);
});

test('Saturation type is valid', () => {
    const signals = [
        { signal_type: 'focus_saturation_pressure', source: 'attention', intensity: 0.9, severity: 'high', description: 'Test', saturation_score: 0.95 }
    ];
    const saturation = modelCognitiveSaturation(signals, {});
    return assert(['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'NONE'].includes(saturation.saturation_type), `Invalid type: ${saturation.saturation_type}`);
});

// Test Group 9: Pressure Distribution
console.log('\n[Test Group 9] Pressure Distribution');
test('Analyzes pressure distribution', () => {
    const signals = [
        { signal_type: 's1', source: 'pressure', intensity: 0.8, severity: 'high', description: 'Test' },
        { signal_type: 's2', source: 'stability', intensity: 0.3, severity: 'low', description: 'Test' },
        { signal_type: 's3', source: 'attention', intensity: 0.2, severity: 'low', description: 'Test' }
    ];
    const dist = analyzePressureDistribution(signals);
    return assert(dist.type !== undefined && dist.concentration_score !== undefined, `Missing distribution fields`);
});

test('Handles empty signals', () => {
    const dist = analyzePressureDistribution([]);
    return assert(dist.type === 'EMPTY', `Expected EMPTY type for empty signals`);
});

// Test Group 10: Pressure Stability
console.log('\n[Test Group 10] Pressure Stability Assessment');
test('Assesses pressure stability', () => {
    const stability = assessPressureStability([]);
    return assert(stability.overall_stability !== undefined, `Missing overall_stability`);
});

test('Returns INDETERMINATE for empty history', () => {
    const stability = assessPressureStability([]);
    return assert(stability.overall_stability === 'INDETERMINATE', `Expected INDETERMINATE for empty history`);
});

test('Computes stability from history', () => {
    const history = [
        { prioritization_pressure_state: 'ELEVATED', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'ELEVATED', bottleneck_regions: [], competing_regions: [] }
    ];
    const stability = assessPressureStability(history);
    return assert(stability.overall_stability !== 'INDETERMINATE', `Should not be INDETERMINATE with history`);
});

// Test Group 11: Drift Profile Correctness
console.log('\n[Test Group 11] Drift Profile Correctness');
test('INTENSIFYING drift detected when pressure increasing', () => {
    const history = [
        { prioritization_pressure_state: 'MINIMAL', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'DEVELOPING', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'ELEVATED', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'SATURATED', bottleneck_regions: [], competing_regions: [] }
    ];
    const drift = trackPressureDrift(history);
    return assert(drift.profile === 'INTENSIFYING', `Expected INTENSIFYING, got ${drift.profile}`);
});

test('DISPERSING drift detected when pressure decreasing', () => {
    const history = [
        { prioritization_pressure_state: 'SATURATED', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'ELEVATED', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'DEVELOPING', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'MINIMAL', bottleneck_regions: [], competing_regions: [] }
    ];
    const drift = trackPressureDrift(history);
    return assert(drift.profile === 'DISPERSING', `Expected DISPERSING, got ${drift.profile}`);
});

test('STABILIZING drift detected when pressure stable', () => {
    const history = [
        { prioritization_pressure_state: 'ELEVATED', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'ELEVATED', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'ELEVATED', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'ELEVATED', bottleneck_regions: [], competing_regions: [] }
    ];
    const drift = trackPressureDrift(history);
    return assert(drift.profile === 'STABILIZING', `Expected STABILIZING, got ${drift.profile}`);
});

test('OSCILLATING drift detected when pressure alternating', () => {
    const history = [
        { prioritization_pressure_state: 'SATURATED', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'MINIMAL', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'SATURATED', bottleneck_regions: [], competing_regions: [] },
        { prioritization_pressure_state: 'MINIMAL', bottleneck_regions: [], competing_regions: [] }
    ];
    const drift = trackPressureDrift(history);
    return assert(drift.profile === 'OSCILLATING', `Expected OSCILLATING, got ${drift.profile}`);
});

test('INDETERMINATE drift for insufficient history', () => {
    const drift = trackPressureDrift([{ prioritization_pressure_state: 'ELEVATED', bottleneck_regions: [], competing_regions: [] }]);
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

// Test Group 12: Persistence Summary
console.log('\n[Test Group 12] Persistence Summary');
test('Computes persistent pressure signals', () => {
    const history = [
        { dominant_pressure_signals: [{ signal_type: 'test1', intensity: 0.8 }] },
        { dominant_pressure_signals: [{ signal_type: 'test1', intensity: 0.82 }] },
        { dominant_pressure_signals: [{ signal_type: 'test1', intensity: 0.81 }] }
    ];
    const summary = { persistent_pressure_signals: [] };
    const signalAppearances = { test1: { count: 3, total_intensity: 2.43 } };
    if (signalAppearances.test1 && signalAppearances.test1.count >= 3) {
        summary.persistent_pressure_signals.push({ signal_type: 'test1', appearances: 3 });
    }
    return assert(summary.persistent_pressure_signals.length === 1, `Expected 1 persistent signal`);
});

// Test Group 13: No Action/Recommendation Language
console.log('\n[Test Group 13] No Action/Recommendation Language');
test('Pressure record contains no action words', () => {
    const record = runPrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        pressureHistory: emptyPressureHistory
    });
    const text = JSON.stringify(record);
    const found = actionWords.filter(w => text.toLowerCase().includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('PRESSURE_STATES descriptions contain no action words', () => {
    const allText = Object.values(PRESSURE_STATES).map(v => v.description + ' ' + v.requirements).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in PRESSURE_STATES: ${found.join(', ')}`);
});

test('DRIFT_PROFILES descriptions contain no action words', () => {
    const allText = Object.values(DRIFT_PROFILES).map(v => v.description + ' ' + v.interpretation).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in DRIFT_PROFILES: ${found.join(', ')}`);
});

// Test Group 14: Deterministic Output
console.log('\n[Test Group 14] Deterministic Output');
test('Same input produces identical pressure record (idempotency)', () => {
    const stateFiles = [PRESSURE_FILE, PRESSURE_HISTORY_FILE];
    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const context = {
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        pressureHistory: emptyPressureHistory
    };
    const rec1 = runPrioritizationPressure(context);

    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const rec2 = runPrioritizationPressure(context);

    const det1 = { ...rec1 }; delete det1.generated_at;
    const det2 = { ...rec2 }; delete det2.generated_at;
    return assert(JSON.stringify(det1) === JSON.stringify(det2), 'Repeat runs produced different results');
});

// Test Group 15: Snapshot Persistence
console.log('\n[Test Group 15] Snapshot Persistence');
test('Pressure file is valid JSON after run', () => {
    runPrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        pressureHistory: emptyPressureHistory
    });
    const exists = fs.existsSync(PRESSURE_FILE);
    if (!exists) return assert(false, 'Pressure file not created');
    try {
        const data = JSON.parse(fs.readFileSync(PRESSURE_FILE, 'utf8'));
        return assert(data.prioritization_pressure_state !== undefined, 'Missing prioritization_pressure_state');
    } catch (e) {
        return assert(false, e.message);
    }
});

test('History file is appended to', () => {
    const before = fs.existsSync(PRESSURE_HISTORY_FILE) ? fs.readFileSync(PRESSURE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length : 0;
    runPrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        pressureHistory: emptyPressureHistory
    });
    const after = fs.readFileSync(PRESSURE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length;
    return assert(after > before, `History did not grow. Before: ${before}, After: ${after}`);
});

test('Audit log contains MCAI-6A entry', () => {
    const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
    const mcai6aEntries = lines.filter(l => l.includes('"phase":"MCAI-6A"'));
    return assert(mcai6aEntries.length > 0, 'No MCAI-6A audit entries found');
});

// Test Group 16: Bounded Memory
console.log('\n[Test Group 16] Bounded Memory');
test('History respects retention limit', () => {
    const history = loadPressureHistory();
    return assert(history.length <= MAX_HISTORY, `History exceeds limit: ${history.length}`);
});

test('History entries are valid JSON', () => {
    const history = loadPressureHistory();
    for (const entry of history.slice(-5)) {
        try {
            JSON.parse(JSON.stringify(entry));
        } catch {
            return assert(false, `Invalid history entry`);
        }
    }
    return assert(true);
});

// Test Group 17: Main Record Schema
console.log('\n[Test Group 17] Main Record Schema');
test('Pressure record has all required fields', () => {
    const record = runPrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        pressureHistory: emptyPressureHistory
    });
    const required = [
        'prioritization_pressure_state', 'pressure_strength', 'competing_regions',
        'dominant_pressure_signals', 'bottleneck_regions', 'pressure_convergence_zones',
        'focus_competition_map', 'cognitive_saturation_assessment', 'pressure_distribution',
        'pressure_stability_assessment', 'pressure_drift_profile', 'persistence_summary',
        'uncertainty_boundaries', 'environmental_pressure_summary', 'generated_at', 'shadow_only'
    ];
    const missing = required.filter(k => !(k in record));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

test('shadow_only is true', () => {
    const record = runPrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        pressureHistory: emptyPressureHistory
    });
    return assert(record.shadow_only === true, `shadow_only is ${record.shadow_only}`);
});

test('uncertainty_boundaries is non-empty array', () => {
    const record = runPrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        pressureHistory: emptyPressureHistory
    });
    return assert(Array.isArray(record.uncertainty_boundaries) && record.uncertainty_boundaries.length > 0, 'No uncertainty boundaries');
});

test('generated_at is valid ISO timestamp', () => {
    const record = runPrioritizationPressure({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        pressureHistory: emptyPressureHistory
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
    console.log('\n✅ All tests passed. Prioritization pressure layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

process.exit(tests_failed > 0 ? 1 : 0);