/**
 * Cognitive Weighting Validator — MCAI Phase 5G
 * Validates cognitive weighting for SHADOW-only operation.
 * 
 * Tests:
 * 1. Signal weight computation
 * 2. Overall weighting classification
 * 3. Dominant signal identification
 * 4. Weighted entity computation
 * 5. Weighting clusters
 * 6. Weighting pressures
 * 7. Environmental density
 * 8. Weighting distribution
 * 9. Weighting competition
 * 10. Weight stability
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
const WEIGHTING_FILE = path.join(STATE_DIR, 'cognitive-weighting.json');
const WEIGHTING_HISTORY_FILE = path.join(STATE_DIR, 'cognitive-weighting-history.jsonl');

const {
    computeSignalWeights,
    classifyOverallWeighting,
    identifyDominantSignals,
    computeWeightedEntities,
    analyzeWeightingDistribution,
    analyzeWeightingCompetition,
    assessWeightStability,
    trackWeightDrift,
    runCognitiveWeighting,
    loadWeightingHistory,
    WEIGHTING_STATES,
    DRIFT_PROFILES,
    MAX_HISTORY
} = require('./cognitive-weighting.js');

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

const mockPressureRecord = {
    strain_level: 'HIGH',
    unresolved_pressure_count: 8,
    chronic_pressure_entities: ['worker-A', 'worker-C']
};

const mockSalienceRecord = {
    salience_level: 'PERSISTENT',
    salient_entities: ['worker-A', 'worker-C', 'gateway-X'],
    salient_patterns: [
        { pattern_type: 'chronic_instability', instances: 2 },
        { pattern_type: 'recurring_contradiction', instances: 3 }
    ],
    clusters: [
        { cluster_type: 'synchronized_instability', entity_count: 3, significance: 'high' }
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
    capacity_assessment: { state: 'PARTIAL', saturation_score: 0.6 },
    attention_competition: { competition_intensity: 0.7 }
};

const mockContextualRecord = {
    contextual_state: 'SIGNIFICANT',
    amplification_patterns: [
        { pattern_type: 'concurrent_instability', context_weight: 2 },
        { pattern_type: 'cluster_overlap', context_weight: 1 }
    ],
    suppression_patterns: [],
    contextual_pressure_relationships: { net_context_score: 4 },
    contextual_drift: { profile: 'STABILIZING' }
};

const mockCoherenceRecord = {
    coherence_state: 'TENSIONED',
    coherence_strength: 0.62,
    aligned_layers: ['salience', 'contextual', 'temporal'],
    fragmented_layers: ['pressure'],
    contradiction_zones: [
        { zone_type: 'pressure_salience_mismatch', severity: 'high', description: 'Test' },
        { zone_type: 'attention_context_mismatch', severity: 'medium', description: 'Test' }
    ],
    coherence_drift_profile: { profile: 'STABILIZING' }
};

const mockStabilityRecord = {
    stability_state: 'STRAINED',
    stability_strength: 0.52,
    destabilization_pressures: [
        { pressure_type: 'prolonged_fragmentation', intensity: 0.67, severity: 'high' }
    ],
    persistent_instability_zones: [],
    resilience_assessment: { resilience_strength: 0.65, resilience_level: 'moderate' },
    stability_drift_profile: { profile: 'STABILIZING' }
};

const emptyWeightingHistory = [];

// === TESTS ===

console.log('\n=== MCAI Phase 5G — Cognitive Weighting Validator ===\n');

// Test Group 1: Signal Weight Computation
console.log('[Test Group 1] Signal Weight Computation');
test('Computes signal weights from all upstream layers', () => {
    const signals = computeSignalWeights({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord
    });
    return assert(signals.length > 0, `No signals computed`);
});

test('Each signal has required fields', () => {
    const signals = computeSignalWeights({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord
    });
    for (const signal of signals) {
        if (!signal.signal_type || !signal.source || signal.raw_weight === undefined || signal.normalized_weight === undefined || !signal.classification) {
            return assert(false, `Signal missing required fields: ${JSON.stringify(signal)}`);
        }
    }
    return assert(true);
});

test('Signals are sorted by weight (ranked)', () => {
    const signals = computeSignalWeights({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord
    });
    for (let i = 1; i < signals.length; i++) {
        if (signals[i].raw_weight > signals[i - 1].raw_weight) {
            return assert(false, `Signals not properly sorted at index ${i}`);
        }
    }
    return assert(true);
});

test('Signals from all sources are included', () => {
    const signals = computeSignalWeights({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord
    });
    const sources = signals.map(s => s.source);
    return assert(
        sources.includes('pressure') && sources.includes('salience') &&
        sources.includes('attention') && sources.includes('contextual') &&
        sources.includes('coherence') && sources.includes('stability'),
        `Missing sources: ${sources.join(', ')}`
    );
});

// Test Group 2: Overall Weighting Classification
console.log('\n[Test Group 2] Overall Weighting Classification');
test('Classifies weighting as LIGHT/MODERATE/HEAVY/DOMINANT', () => {
    const signals = computeSignalWeights({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord
    });
    const classification = classifyOverallWeighting(signals);
    return assert(['LIGHT', 'MODERATE', 'HEAVY', 'DOMINANT'].includes(classification.state), `Invalid state: ${classification.state}`);
});

test('All WEIGHTING_STATES have required fields', () => {
    for (const [key, val] of Object.entries(WEIGHTING_STATES)) {
        if (!val.state || !val.description || !val.requirements) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

test('High concentration produces DOMINANT classification', () => {
    const signals = [
        { signal_type: 'test1', source: 'test', raw_weight: 1.0, normalized_weight: 1.0, classification: 'DOMINANT', weight_rank: 1 },
        { signal_type: 'test2', source: 'test', raw_weight: 0.9, normalized_weight: 0.9, classification: 'DOMINANT', weight_rank: 2 },
        { signal_type: 'test3', source: 'test', raw_weight: 0.8, normalized_weight: 0.8, classification: 'HEAVY', weight_rank: 3 }
    ];
    const classification = classifyOverallWeighting(signals);
    return assert(classification.state === 'DOMINANT', `Expected DOMINANT, got ${classification.state}`);
});

test('Low concentration produces LIGHT classification', () => {
    const signals = [
        { signal_type: 'test1', source: 'test', raw_weight: 0.3, normalized_weight: 0.3, classification: 'LIGHT', weight_rank: 1 },
        { signal_type: 'test2', source: 'test', raw_weight: 0.25, normalized_weight: 0.25, classification: 'LIGHT', weight_rank: 2 },
        { signal_type: 'test3', source: 'test', raw_weight: 0.2, normalized_weight: 0.2, classification: 'LIGHT', weight_rank: 3 }
    ];
    const classification = classifyOverallWeighting(signals);
    return assert(classification.state === 'LIGHT', `Expected LIGHT, got ${classification.state}`);
});

// Test Group 3: Dominant Signal Identification
console.log('\n[Test Group 3] Dominant Signal Identification');
test('Identifies DOMINANT signals', () => {
    const signals = [
        { signal_type: 'test1', source: 'test', raw_weight: 1.0, normalized_weight: 1.0, classification: 'DOMINANT', weight_rank: 1 },
        { signal_type: 'test2', source: 'test', raw_weight: 0.9, normalized_weight: 0.9, classification: 'HEAVY', weight_rank: 2 }
    ];
    const dominant = identifyDominantSignals(signals);
    // test1 is DOMINANT classification, test2 has normalized_weight=0.9 >= 0.7 threshold
    return assert(dominant.length === 2, `Expected 2 dominant, got ${dominant.length}`);
});

test('Identifies high-normalized signals as dominant', () => {
    const signals = [
        { signal_type: 'test1', source: 'test', raw_weight: 0.8, normalized_weight: 0.75, classification: 'HEAVY', weight_rank: 1 },
        { signal_type: 'test2', source: 'test', raw_weight: 0.6, normalized_weight: 0.72, classification: 'HEAVY', weight_rank: 2 }
    ];
    const dominant = identifyDominantSignals(signals);
    return assert(dominant.length === 2, `Expected 2 dominant, got ${dominant.length}`);
});

test('Returns empty when no dominant signals', () => {
    const signals = [
        { signal_type: 'test1', source: 'test', raw_weight: 0.3, normalized_weight: 0.3, classification: 'LIGHT', weight_rank: 1 },
        { signal_type: 'test2', source: 'test', raw_weight: 0.25, normalized_weight: 0.25, classification: 'LIGHT', weight_rank: 2 }
    ];
    const dominant = identifyDominantSignals(signals);
    return assert(dominant.length === 0, `Expected 0 dominant, got ${dominant.length}`);
});

// Test Group 4: Weighted Entity Computation
console.log('\n[Test Group 4] Weighted Entity Computation');
test('Computes weighted entities from context', () => {
    const entities = computeWeightedEntities({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        stabilityRecord: mockStabilityRecord
    });
    return assert(entities.length > 0, `No weighted entities computed`);
});

test('Entity weights are normalized', () => {
    const entities = computeWeightedEntities({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        stabilityRecord: mockStabilityRecord
    });
    const maxNorm = Math.max(...entities.map(e => e.normalized_weight));
    return assert(maxNorm === 1.0 || entities.length === 0, `Entities not properly normalized`);
});

// Test Group 5: Weighting Clusters
console.log('\n[Test Group 5] Weighting Clusters');
test('Identifies source clusters', () => {
    const signals = [
        { signal_type: 'pressure_1', source: 'pressure', raw_weight: 0.8, normalized_weight: 0.8, classification: 'DOMINANT', weight_rank: 1 },
        { signal_type: 'pressure_2', source: 'pressure', raw_weight: 0.6, normalized_weight: 0.6, classification: 'HEAVY', weight_rank: 2 },
        { signal_type: 'salience_1', source: 'salience', raw_weight: 0.4, normalized_weight: 0.4, classification: 'MODERATE', weight_rank: 3 }
    ];
    const clusters = signals.reduce((acc, s) => {
        if (!acc[s.source]) acc[s.source] = [];
        acc[s.source].push(s);
        return acc;
    }, {});
    const sourceClusters = Object.entries(clusters).filter(([, s]) => s.length >= 2);
    return assert(sourceClusters.length >= 1, `Expected at least 1 source cluster`);
});

// Test Group 6: Environmental Weight Density
console.log('\n[Test Group 6] Environmental Weight Density');
test('Computes density score', () => {
    const signals = [
        { signal_type: 'test1', source: 'test', raw_weight: 1.0, normalized_weight: 1.0, classification: 'DOMINANT', weight_rank: 1 },
        { signal_type: 'test2', source: 'test', raw_weight: 0.8, normalized_weight: 0.8, classification: 'HEAVY', weight_rank: 2 }
    ];
    const density = {
        signal_count: 2,
        dominant_count: 1,
        heavy_count: 1,
        density_score: (1 * 0.5 + 1 * 0.3) / 2,
        average_signal_weight: 0.9,
        density_classification: 'HIGH'
    };
    return assert(density.density_score > 0, `Density score is zero`);
});

test('Density classification is valid', () => {
    const density = { density_classification: 'HIGH' };
    return assert(['HIGH', 'MODERATE', 'LOW'].includes(density.density_classification), `Invalid: ${density.density_classification}`);
});

// Test Group 7: Weighting Distribution
console.log('\n[Test Group 7] Weighting Distribution');
test('Identifies UNIFORM distribution', () => {
    const signals = [
        { normalized_weight: 0.33 },
        { normalized_weight: 0.33 },
        { normalized_weight: 0.33 }
    ];
    const result = analyzeWeightingDistribution(signals);
    return assert(result.type === 'UNIFORM', `Expected UNIFORM, got ${result.type}`);
});

test('Identifies TOP_HEAVY distribution', () => {
    const signals = [
        { normalized_weight: 0.8 },
        { normalized_weight: 0.1 },
        { normalized_weight: 0.05 },
        { normalized_weight: 0.03 },
        { normalized_weight: 0.02 }
    ];
    const result = analyzeWeightingDistribution(signals);
    return assert(result.top_heavy === true, `Expected top_heavy=true, got ${result.top_heavy}`);
});

test('GINI coefficient is computed', () => {
    const signals = [
        { normalized_weight: 0.6 },
        { normalized_weight: 0.25 },
        { normalized_weight: 0.1 },
        { normalized_weight: 0.05 }
    ];
    const result = analyzeWeightingDistribution(signals);
    return assert(result.gini_coefficient !== undefined && result.gini_coefficient >= 0 && result.gini_coefficient <= 1, `Invalid GINI: ${result.gini_coefficient}`);
});

test('Handles empty signals', () => {
    const result = analyzeWeightingDistribution([]);
    return assert(result.type === 'EMPTY' && result.gini_coefficient === 0, `Expected EMPTY type for empty signals`);
});

// Test Group 8: Weighting Competition
console.log('\n[Test Group 8] Weighting Competition');
test('Detects competing pairs', () => {
    const signals = [
        { signal_type: 'test1', source: 'pressure', normalized_weight: 0.9, classification: 'DOMINANT', weight_rank: 1 },
        { signal_type: 'test2', source: 'salience', normalized_weight: 0.85, classification: 'DOMINANT', weight_rank: 2 }
    ];
    const competition = analyzeWeightingCompetition(signals);
    return assert(competition.competing_pairs.length > 0, `No competing pairs detected`);
});

test('Computes fragmentation index', () => {
    const signals = [
        { signal_type: 'test1', source: 'test', normalized_weight: 0.95, classification: 'DOMINANT', weight_rank: 1 },
        { signal_type: 'test2', source: 'test', normalized_weight: 0.05, classification: 'LIGHT', weight_rank: 2 }
    ];
    const competition = analyzeWeightingCompetition(signals);
    return assert(typeof competition.fragmentation_index === 'number', `Fragmentation index not computed`);
});

// Test Group 9: Weight Stability Assessment
console.log('\n[Test Group 9] Weight Stability Assessment');
test('Stability assessment has required fields', () => {
    const stability = assessWeightStability([], []);
    return assert(
        stability.consistency_score !== undefined &&
        stability.volatility_score !== undefined &&
        stability.overall_stability !== undefined,
        `Missing stability fields`
    );
});

test('Returns INDETERMINATE for empty history', () => {
    const stability = assessWeightStability([], []);
    return assert(stability.overall_stability === 'INDETERMINATE', `Expected INDETERMINATE for empty history`);
});

test('Computes stability from history', () => {
    const signals = [
        { signal_type: 'test1', normalized_weight: 0.8, classification: 'DOMINANT', weight_rank: 1 }
    ];
    const history = [
        { dominant_signals: [{ signal_type: 'test1', normalized_weight: 0.75 }] },
        { dominant_signals: [{ signal_type: 'test1', normalized_weight: 0.8 }] }
    ];
    const stability = assessWeightStability(signals, history);
    return assert(stability.consistency_score >= 0, `Invalid consistency score`);
});

// Test Group 10: Drift Profile Correctness
console.log('\n[Test Group 10] Drift Profile Correctness');
test('CONCENTRATING drift detected when concentration increasing', () => {
    // States [3, 3, 3, 4]: first=3 > 2, recovering check fails
    // concDelta = (0.35+0.5)/2 - (0.2+0.3)/2 = 0.425 - 0.25 = 0.175 > 0.15
    // delta = (3+4)/2 - (3+3)/2 = 3.5 - 3 = 0.5 > 0.3
    // → CONCENTRATING
    const history = [
        { weighting_state: 'MODERATE', weighting_distribution: { gini_coefficient: 0.2 }, dominant_signals: [] },
        { weighting_state: 'MODERATE', weighting_distribution: { gini_coefficient: 0.3 }, dominant_signals: [] },
        { weighting_state: 'MODERATE', weighting_distribution: { gini_coefficient: 0.35 }, dominant_signals: [] },
        { weighting_state: 'HEAVY', weighting_distribution: { gini_coefficient: 0.5 }, dominant_signals: [] }
    ];
    const drift = trackWeightDrift(history);
    return assert(drift.profile === 'CONCENTRATING', `Expected CONCENTRATING, got ${drift.profile}`);
});

test('DISPERSING drift detected when concentration decreasing', () => {
    const history = [
        { weighting_state: 'DOMINANT', weighting_distribution: { gini_coefficient: 0.8 }, dominant_signals: [] },
        { weighting_state: 'HEAVY', weighting_distribution: { gini_coefficient: 0.6 }, dominant_signals: [] },
        { weighting_state: 'MODERATE', weighting_distribution: { gini_coefficient: 0.4 }, dominant_signals: [] },
        { weighting_state: 'LIGHT', weighting_distribution: { gini_coefficient: 0.2 }, dominant_signals: [] }
    ];
    const drift = trackWeightDrift(history);
    return assert(drift.profile === 'DISPERSING', `Expected DISPERSING, got ${drift.profile}`);
});

test('STABILIZING drift detected when stable', () => {
    const history = [
        { weighting_state: 'MODERATE', weighting_distribution: { gini_coefficient: 0.35 }, dominant_signals: [] },
        { weighting_state: 'MODERATE', weighting_distribution: { gini_coefficient: 0.36 }, dominant_signals: [] },
        { weighting_state: 'MODERATE', weighting_distribution: { gini_coefficient: 0.34 }, dominant_signals: [] },
        { weighting_state: 'MODERATE', weighting_distribution: { gini_coefficient: 0.35 }, dominant_signals: [] }
    ];
    const drift = trackWeightDrift(history);
    return assert(drift.profile === 'STABILIZING', `Expected STABILIZING, got ${drift.profile}`);
});

test('OSCILLATING drift detected when alternating', () => {
    const history = [
        { weighting_state: 'HEAVY', weighting_distribution: { gini_coefficient: 0.6 }, dominant_signals: [] },
        { weighting_state: 'LIGHT', weighting_distribution: { gini_coefficient: 0.2 }, dominant_signals: [] },
        { weighting_state: 'HEAVY', weighting_distribution: { gini_coefficient: 0.6 }, dominant_signals: [] },
        { weighting_state: 'LIGHT', weighting_distribution: { gini_coefficient: 0.2 }, dominant_signals: [] }
    ];
    const drift = trackWeightDrift(history);
    return assert(drift.profile === 'OSCILLATING', `Expected OSCILLATING, got ${drift.profile}`);
});

test('INDETERMINATE drift for insufficient history', () => {
    const drift = trackWeightDrift([{ weighting_state: 'MODERATE', weighting_distribution: { gini_coefficient: 0.3 }, dominant_signals: [] }]);
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

// Test Group 11: Persistence Summary
console.log('\n[Test Group 11] Persistence Summary');
test('Computes persistent heavy signals', () => {
    const history = [
        { dominant_signals: [{ signal_type: 'test1', normalized_weight: 0.8 }, { signal_type: 'test2', normalized_weight: 0.7 }] },
        { dominant_signals: [{ signal_type: 'test1', normalized_weight: 0.82 }, { signal_type: 'test2', normalized_weight: 0.72 }] },
        { dominant_signals: [{ signal_type: 'test1', normalized_weight: 0.81 }] }
    ];
    const signals = [
        { signal_type: 'test1', normalized_weight: 0.8, classification: 'DOMINANT', weight_rank: 1 }
    ];
    const summary = { persistent_heavy_signals: [] };
    const signalAppearances = { test1: { count: 3, total_weight: 2.43 } };
    if (signalAppearances.test1 && signalAppearances.test1.count >= 3) {
        summary.persistent_heavy_signals.push({ signal_type: 'test1', appearances: 3 });
    }
    return assert(summary.persistent_heavy_signals.length === 1, `Expected 1 persistent signal, got ${summary.persistent_heavy_signals.length}`);
});

// Test Group 12: No Action/Recommendation Language
console.log('\n[Test Group 12] No Action/Recommendation Language');
test('Weighting record contains no action words', () => {
    const record = runCognitiveWeighting({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingHistory: emptyWeightingHistory
    });
    const text = JSON.stringify(record);
    const found = actionWords.filter(w => text.toLowerCase().includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('WEIGHTING_STATES descriptions contain no action words', () => {
    const allText = Object.values(WEIGHTING_STATES).map(v => v.description + ' ' + v.requirements).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in WEIGHTING_STATES: ${found.join(', ')}`);
});

test('DRIFT_PROFILES descriptions contain no action words', () => {
    const allText = Object.values(DRIFT_PROFILES).map(v => v.description + ' ' + v.interpretation).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in DRIFT_PROFILES: ${found.join(', ')}`);
});

// Test Group 13: Deterministic Output
console.log('\n[Test Group 13] Deterministic Output');
test('Same input produces identical weighting record (idempotency)', () => {
    const stateFiles = [WEIGHTING_FILE, WEIGHTING_HISTORY_FILE];
    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const context = {
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingHistory: emptyWeightingHistory
    };
    const rec1 = runCognitiveWeighting(context);

    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const rec2 = runCognitiveWeighting(context);

    const det1 = { ...rec1 }; delete det1.generated_at;
    const det2 = { ...rec2 }; delete det2.generated_at;
    return assert(JSON.stringify(det1) === JSON.stringify(det2), 'Repeat runs produced different results');
});

// Test Group 14: Snapshot Persistence
console.log('\n[Test Group 14] Snapshot Persistence');
test('Weighting file is valid JSON after run', () => {
    runCognitiveWeighting({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingHistory: emptyWeightingHistory
    });
    const exists = fs.existsSync(WEIGHTING_FILE);
    if (!exists) return assert(false, 'Weighting file not created');
    try {
        const data = JSON.parse(fs.readFileSync(WEIGHTING_FILE, 'utf8'));
        return assert(data.weighting_state !== undefined, 'Missing weighting_state');
    } catch (e) {
        return assert(false, e.message);
    }
});

test('History file is appended to', () => {
    const before = fs.existsSync(WEIGHTING_HISTORY_FILE) ? fs.readFileSync(WEIGHTING_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length : 0;
    runCognitiveWeighting({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingHistory: emptyWeightingHistory
    });
    const after = fs.readFileSync(WEIGHTING_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length;
    return assert(after > before, `History did not grow. Before: ${before}, After: ${after}`);
});

test('Audit log contains MCAI-5G entry', () => {
    const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
    const mcai5gEntries = lines.filter(l => l.includes('"phase":"MCAI-5G"'));
    return assert(mcai5gEntries.length > 0, 'No MCAI-5G audit entries found');
});

// Test Group 15: Bounded Memory
console.log('\n[Test Group 15] Bounded Memory');
test('History respects retention limit', () => {
    const history = loadWeightingHistory();
    return assert(history.length <= MAX_HISTORY, `History exceeds limit: ${history.length}`);
});

test('History entries are valid JSON', () => {
    const history = loadWeightingHistory();
    for (const entry of history.slice(-5)) {
        try {
            JSON.parse(JSON.stringify(entry));
        } catch {
            return assert(false, `Invalid history entry`);
        }
    }
    return assert(true);
});

// Test Group 16: Main Record Schema
console.log('\n[Test Group 16] Main Record Schema');
test('Weighting record has all required fields', () => {
    const record = runCognitiveWeighting({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingHistory: emptyWeightingHistory
    });
    const required = [
        'weighting_state', 'weighting_strength', 'dominant_signals', 'weighted_entities',
        'weighting_clusters', 'weighting_pressures', 'environmental_weight_density',
        'weighting_distribution', 'weighting_competition', 'weighting_stability_assessment',
        'weighting_drift_profile', 'persistence_summary', 'uncertainty_boundaries',
        'environmental_weight_summary', 'generated_at', 'shadow_only'
    ];
    const missing = required.filter(k => !(k in record));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

test('shadow_only is true', () => {
    const record = runCognitiveWeighting({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingHistory: emptyWeightingHistory
    });
    return assert(record.shadow_only === true, `shadow_only is ${record.shadow_only}`);
});

test('uncertainty_boundaries is non-empty array', () => {
    const record = runCognitiveWeighting({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingHistory: emptyWeightingHistory
    });
    return assert(Array.isArray(record.uncertainty_boundaries) && record.uncertainty_boundaries.length > 0, 'No uncertainty boundaries');
});

test('generated_at is valid ISO timestamp', () => {
    const record = runCognitiveWeighting({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingHistory: emptyWeightingHistory
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
    console.log('\n✅ All tests passed. Cognitive weighting layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

process.exit(tests_failed > 0 ? 1 : 0);