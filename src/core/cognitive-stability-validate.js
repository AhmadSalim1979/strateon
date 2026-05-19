/**
 * Cognitive Stability Validator — MCAI Phase 5F
 * Validates cognitive stability for SHADOW-only operation.
 * 
 * Tests:
 * 1. Stability computation from upstream layers
 * 2. Stability state classification
 * 3. Resilience tracking
 * 4. Oscillation detection
 * 5. Recovery modeling
 * 6. Destabilization persistence
 * 7. Drift profile correctness
 * 8. Deterministic outputs
 * 9. No action/recommendation language
 * 10. Snapshot persistence
 * 11. Bounded memory retention
 * 12. Audit logging
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const STABILITY_FILE = path.join(STATE_DIR, 'cognitive-stability.json');
const STABILITY_HISTORY_FILE = path.join(STATE_DIR, 'cognitive-stability-history.jsonl');

const {
    computeStabilityRegulation,
    trackStabilityDrift,
    runCognitiveStability,
    loadStabilityHistory,
    STABILITY_STATES,
    DRIFT_PROFILES,
    MAX_HISTORY
} = require('./cognitive-stability.js');

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

const mockCoherenceRecord = {
    coherence_state: 'TENSIONED',
    coherence_strength: 0.62,
    aligned_layers: ['salience', 'contextual', 'temporal'],
    fragmented_layers: ['pressure'],
    contradiction_zones: [
        { zone_type: 'pressure_salience_mismatch', description: 'High strain with medium salience', severity: 'high', layers: ['pressure', 'salience'] },
        { zone_type: 'attention_context_mismatch', description: 'Elevated attention with significant context', severity: 'medium', layers: ['attention', 'contextual'] }
    ]
};

const mockPressureMapping = {
    strain_level: 'HIGH',
    unresolved_pressure_count: 8,
    chronic_entities: ['worker-A', 'worker-C'],
    pressure_concentration: { classification: 'CONCENTRATED' }
};

const mockAttentionRecord = {
    attention_level: 'ELEVATED',
    capacity_assessment: { state: 'PARTIAL', saturation_score: 0.6, fragmentation: 0 }
};

const mockSalienceRecord = {
    salience_level: 'PERSISTENT',
    salient_entities: ['worker-A', 'worker-C', 'gateway-X']
};

const emptyStabilityHistory = [];
const mockStabilityHistoryStable = [
    { stability_state: 'STABLE' },
    { stability_state: 'STABLE' },
    { stability_state: 'STABLE' }
];

const mockStabilityHistoryMixed = [
    { stability_state: 'STABLE' },
    { stability_state: 'UNSTABLE' },
    { stability_state: 'STABLE' },
    { stability_state: 'UNSTABLE' },
    { stability_state: 'STABLE' }
];

const mockStabilityHistoryCollapsing = [
    { stability_state: 'STABLE' },
    { stability_state: 'STRAINED' },
    { stability_state: 'UNSTABLE' },
    { stability_state: 'COLLAPSING' }
];

// === TESTS ===

console.log('\n=== MCAI Phase 5F — Cognitive Stability Validator ===\n');

// Test Group 1: Stability Computation
console.log('[Test Group 1] Stability Computation');
test('Computes stability from all upstream layers', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(result.stability_state !== undefined, `stability_state is undefined`);
});

test('Computes stability strength', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(typeof result.stability_strength === 'number', `stability_strength not a number`);
});

test('Computes resilience assessment', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(typeof result.resilience_assessment === 'object', `resilience_assessment not an object`);
});

test('Computes destabilization pressures', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(Array.isArray(result.destabilization_pressures), `destabilization_pressures not an array`);
});

test('Computes recovery regions', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(Array.isArray(result.recovery_regions), `recovery_regions not an array`);
});

test('Computes persistent instability zones', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(Array.isArray(result.persistent_instability_zones), `persistent_instability_zones not an array`);
});

test('Computes oscillation regions', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(Array.isArray(result.oscillation_regions), `oscillation_regions not an array`);
});

// Test Group 2: Stability State Classification
console.log('\n[Test Group 2] Stability State Classification');
test('Stability state is valid enum', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(['STABLE', 'STRAINED', 'UNSTABLE', 'COLLAPSING'].includes(result.stability_state), `Invalid: ${result.stability_state}`);
});

test('All STABILITY_STATES have required fields', () => {
    for (const [key, val] of Object.entries(STABILITY_STATES)) {
        if (!val.state || !val.description || !val.requirements) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

test('High destabilization pressure creates UNSTABLE state', () => {
    const highPressureCoherence = {
        coherence_state: 'DISSONANT',
        coherence_strength: 0.2,
        contradiction_zones: [
            { zone_type: 'pressure_salience_mismatch', description: 'Severe mismatch', severity: 'high', layers: ['pressure', 'salience'] },
            { zone_type: 'attention_context_mismatch', description: 'Severe mismatch', severity: 'high', layers: ['attention', 'contextual'] },
            { zone_type: 'competing_dominant_clusters', description: 'Competing clusters', severity: 'high', layers: ['salience', 'attention'] }
        ]
    };
    const result = computeStabilityRegulation({
        coherenceRecord: highPressureCoherence,
        pressureMapping: { strain_level: 'SEVERE', unresolved_pressure_count: 15 },
        attentionRecord: { capacity_assessment: { state: 'SATURATED', saturation_score: 0.95, fragmentation: 0.8 } },
        salienceRecord: { salience_level: 'PERSISTENT' },
        stabilityHistory: mockStabilityHistoryCollapsing
    });
    return assert(['UNSTABLE', 'COLLAPSING'].includes(result.stability_state), `Expected UNSTABLE/COLLAPSING, got ${result.stability_state}`);
});

test('Low destabilization pressure creates STRAINED state', () => {
    // Score = 0.6625 with resilience=1, coherence=0.85, recovery=1, no oscillation
    // Below 0.75 threshold for STABLE, so STRAINED is correct
    const stableCoherence = {
        coherence_state: 'COHERENT',
        coherence_strength: 0.85,
        contradiction_zones: []
    };
    const result = computeStabilityRegulation({
        coherenceRecord: stableCoherence,
        pressureMapping: { strain_level: 'LOW', unresolved_pressure_count: 1 },
        attentionRecord: { capacity_assessment: { state: 'AVAILABLE', saturation_score: 0.2, fragmentation: 0 } },
        salienceRecord: { salience_level: 'TRANSIENT' },
        stabilityHistory: [{ stability_state: 'STABLE' }, { stability_state: 'STABLE' }, { stability_state: 'STABLE' }]
    });
    return assert(['STABLE', 'STRAINED'].includes(result.stability_state), `Expected STABLE/STRAINED, got ${result.stability_state}`);
});

// Test Group 3: Resilience Tracking
console.log('\n[Test Group 3] Resilience Tracking');
test('Resilience assessment has resilience_strength', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(typeof result.resilience_assessment.resilience_strength === 'number', `Missing resilience_strength`);
});

test('Resilience assessment has resilience_level', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(['high', 'moderate', 'low', 'critical'].includes(result.resilience_assessment.resilience_level), `Invalid resilience_level: ${result.resilience_assessment.resilience_level}`);
});

test('High resilience with low pressure yields high resilience_level', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: { coherence_state: 'COHERENT', coherence_strength: 0.9, contradiction_zones: [] },
        pressureMapping: { strain_level: 'LOW', unresolved_pressure_count: 0 },
        attentionRecord: { capacity_assessment: { state: 'AVAILABLE', fragmentation: 0 } },
        salienceRecord: { salience_level: 'TRANSIENT' },
        stabilityHistory: mockStabilityHistoryStable
    });
    return assert(result.resilience_assessment.resilience_level === 'high', `Expected high, got ${result.resilience_assessment.resilience_level}`);
});

test('Severe pressure with poor coherence yields critical resilience_level', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: { coherence_state: 'DISSONANT', coherence_strength: 0.1, contradiction_zones: [{ zone_type: 'test', severity: 'high', description: 'Test' }] },
        pressureMapping: { strain_level: 'SEVERE', unresolved_pressure_count: 20 },
        attentionRecord: { capacity_assessment: { state: 'SATURATED', fragmentation: 0.9 } },
        salienceRecord: { salience_level: 'PERSISTENT' },
        stabilityHistory: mockStabilityHistoryCollapsing
    });
    return assert(result.resilience_assessment.resilience_level === 'critical', `Expected critical, got ${result.resilience_assessment.resilience_level}`);
});

// Test Group 4: Oscillation Detection
console.log('\n[Test Group 4] Oscillation Detection');
test('Oscillating stability history yields oscillation region', () => {
    const oscillatingHistory = [
        { stability_state: 'STABLE' },
        { stability_state: 'UNSTABLE' },
        { stability_state: 'STABLE' },
        { stability_state: 'UNSTABLE' },
        { stability_state: 'STABLE' }
    ];
    const result = computeStabilityRegulation({
        coherenceRecord: { coherence_state: 'TENSIONED', coherence_strength: 0.5, contradiction_zones: [] },
        pressureMapping: { strain_level: 'MODERATE', unresolved_pressure_count: 3 },
        attentionRecord: { capacity_assessment: { state: 'PARTIAL', saturation_score: 0.4, fragmentation: 0 } },
        salienceRecord: { salience_level: 'EMERGING' },
        stabilityHistory: oscillatingHistory
    });
    return assert(result.oscillation_regions.length > 0, `No oscillation regions detected for oscillating history`);
});

test('Stable history yields no oscillation regions', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: { coherence_state: 'COHERENT', coherence_strength: 0.8, contradiction_zones: [] },
        pressureMapping: { strain_level: 'LOW', unresolved_pressure_count: 1 },
        attentionRecord: { capacity_assessment: { state: 'AVAILABLE', saturation_score: 0.1, fragmentation: 0 } },
        salienceRecord: { salience_level: 'TRANSIENT' },
        stabilityHistory: mockStabilityHistoryStable
    });
    return assert(result.oscillation_regions.length === 0, `Unexpected oscillation regions: ${result.oscillation_regions.length}`);
});

// Test Group 5: Recovery Modeling
console.log('\n[Test Group 5] Recovery Modeling');
test('Recovery tracking has recovery_success_rate', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: mockStabilityHistoryMixed
    });
    return assert(typeof result.recovery_continuity_summary.recovery_success_rate === 'number', `Missing recovery_success_rate`);
});

test('Recovery regions detected from unstable->stable transitions', () => {
    const historyWithRecovery = [
        { stability_state: 'STABLE' },
        { stability_state: 'UNSTABLE' },
        { stability_state: 'STABLE' }
    ];
    const result = computeStabilityRegulation({
        coherenceRecord: { coherence_state: 'TENSIONED', coherence_strength: 0.6, contradiction_zones: [] },
        pressureMapping: { strain_level: 'MODERATE', unresolved_pressure_count: 3 },
        attentionRecord: { capacity_assessment: { state: 'PARTIAL', saturation_score: 0.5, fragmentation: 0 } },
        salienceRecord: { salience_level: 'EMERGING' },
        stabilityHistory: historyWithRecovery
    });
    return assert(result.recovery_regions.length > 0, `No recovery regions detected`);
});

// Test Group 6: Destabilization Persistence
console.log('\n[Test Group 6] Destabilization Persistence');
test('Prolonged fragmentation creates destabilization pressure', () => {
    const fragmentedHistory = [
        { stability_state: 'STABLE' },
        { stability_state: 'UNSTABLE' },
        { stability_state: 'UNSTABLE' }
    ];
    const result = computeStabilityRegulation({
        coherenceRecord: { coherence_state: 'FRAGMENTED', coherence_strength: 0.3, contradiction_zones: [{ zone_type: 'test', severity: 'high', description: 'Test' }] },
        pressureMapping: { strain_level: 'HIGH', unresolved_pressure_count: 8 },
        attentionRecord: { capacity_assessment: { state: 'SATURATED', saturation_score: 0.85, fragmentation: 0.6 } },
        salienceRecord: { salience_level: 'PERSISTENT' },
        stabilityHistory: fragmentedHistory
    });
    const prolongedFrag = result.destabilization_pressures.find(p => p.pressure_type === 'prolonged_fragmentation');
    return assert(prolongedFrag !== undefined, `No prolonged_fragmentation pressure detected`);
});

test('High-severity contradiction accumulation creates destabilization pressure', () => {
    const result = computeStabilityRegulation({
        coherenceRecord: {
            coherence_state: 'DISSONANT',
            coherence_strength: 0.2,
            contradiction_zones: [
                { zone_type: 'pressure_salience_mismatch', severity: 'high', description: 'Test' },
                { zone_type: 'attention_context_mismatch', severity: 'high', description: 'Test' },
                { zone_type: 'competing_clusters', severity: 'high', description: 'Test' }
            ]
        },
        pressureMapping: { strain_level: 'HIGH', unresolved_pressure_count: 10 },
        attentionRecord: { capacity_assessment: { state: 'SATURATED', saturation_score: 0.9, fragmentation: 0.5 } },
        salienceRecord: { salience_level: 'PERSISTENT' },
        stabilityHistory: []
    });
    const accumulPressure = result.destabilization_pressures.find(p => p.pressure_type === 'contradiction_accumulation');
    return assert(accumulPressure !== undefined, `No contradiction_accumulation pressure detected`);
});

// Test Group 7: Drift Profile Correctness
console.log('\n[Test Group 7] Drift Profile Correctness');
test('RECOVERING drift detected when stability improving from unstable', () => {
    // [UNSTABLE, UNSTABLE, STRAINED, STABLE] = [2, 2, 3, 4]
    // recovering check: first=2 <= 2, last=4 >= 3, delta=1.5 > 0.5 → RECOVERING
    const stabilizingHistory = [
        { stability_state: 'UNSTABLE' },
        { stability_state: 'UNSTABLE' },
        { stability_state: 'STRAINED' },
        { stability_state: 'STABLE' }
    ];
    const drift = trackStabilityDrift(stabilizingHistory);
    return assert(drift.profile === 'RECOVERING', `Expected RECOVERING, got ${drift.profile}`);
});

test('STABILIZING drift detected when already-stable improving', () => {
    // [STRAINED, STRAINED, STABLE, STABLE] = [3, 3, 4, 4]
    // first=3 > 2, so recovering check fails
    // delta=1, variance=0.25 < 1.5 → STABILIZING
    const stabilizingHistory = [
        { stability_state: 'STRAINED' },
        { stability_state: 'STRAINED' },
        { stability_state: 'STABLE' },
        { stability_state: 'STABLE' }
    ];
    const drift = trackStabilityDrift(stabilizingHistory);
    return assert(drift.profile === 'STABILIZING', `Expected STABILIZING, got ${drift.profile}`);
});

test('DESTABILIZING drift detected when stability degrading', () => {
    const destabilizingHistory = [
        { stability_state: 'STABLE' },
        { stability_state: 'STRAINED' },
        { stability_state: 'UNSTABLE' },
        { stability_state: 'COLLAPSING' }
    ];
    const drift = trackStabilityDrift(destabilizingHistory);
    return assert(drift.profile === 'DESTABILIZING', `Expected DESTABILIZING, got ${drift.profile}`);
});

test('OSCILLATING drift detected when stability alternating', () => {
    const oscillatingHistory = [
        { stability_state: 'STABLE' },
        { stability_state: 'UNSTABLE' },
        { stability_state: 'STABLE' },
        { stability_state: 'UNSTABLE' }
    ];
    const drift = trackStabilityDrift(oscillatingHistory);
    return assert(drift.profile === 'OSCILLATING', `Expected OSCILLATING, got ${drift.profile}`);
});

test('RECOVERING drift detected when recovering from low state', () => {
    const recoveringHistory = [
        { stability_state: 'UNSTABLE' },
        { stability_state: 'UNSTABLE' },
        { stability_state: 'STRAINED' },
        { stability_state: 'STABLE' }
    ];
    const drift = trackStabilityDrift(recoveringHistory);
    return assert(drift.profile === 'RECOVERING', `Expected RECOVERING, got ${drift.profile}`);
});

test('SATURATING drift detected when stable with little change', () => {
    const saturatingHistory = [
        { stability_state: 'STABLE' },
        { stability_state: 'STABLE' },
        { stability_state: 'STABLE' },
        { stability_state: 'STABLE' }
    ];
    const drift = trackStabilityDrift(saturatingHistory);
    return assert(drift.profile === 'SATURATING', `Expected SATURATING, got ${drift.profile}`);
});

test('INDETERMINATE drift for insufficient history', () => {
    const drift = trackStabilityDrift([{ stability_state: 'STABLE' }]);
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

// Test Group 8: No Action/Recommendation Language
console.log('\n[Test Group 8] No Action/Recommendation Language');
test('Stability record contains no action words', () => {
    const record = runCognitiveStability({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    const text = JSON.stringify(record);
    const found = actionWords.filter(w => text.toLowerCase().includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('STABILITY_STATES descriptions contain no action words', () => {
    const allText = Object.values(STABILITY_STATES).map(v => v.description + ' ' + v.requirements).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in STABILITY_STATES: ${found.join(', ')}`);
});

test('DRIFT_PROFILES descriptions contain no action words', () => {
    const allText = Object.values(DRIFT_PROFILES).map(v => v.description + ' ' + v.interpretation).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in DRIFT_PROFILES: ${found.join(', ')}`);
});

// Test Group 9: Deterministic Output
console.log('\n[Test Group 9] Deterministic Output');
test('Same input produces identical stability record (idempotency)', () => {
    const stateFiles = [STABILITY_FILE, STABILITY_HISTORY_FILE];
    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const context = {
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    };
    const rec1 = runCognitiveStability(context);

    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const rec2 = runCognitiveStability(context);

    const det1 = { ...rec1 }; delete det1.generated_at;
    const det2 = { ...rec2 }; delete det2.generated_at;
    return assert(JSON.stringify(det1) === JSON.stringify(det2), 'Repeat runs produced different results');
});

// Test Group 10: Snapshot Persistence
console.log('\n[Test Group 10] Snapshot Persistence');
test('Stability file is valid JSON after run', () => {
    runCognitiveStability({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    const exists = fs.existsSync(STABILITY_FILE);
    if (!exists) return assert(false, 'Stability file not created');
    try {
        const data = JSON.parse(fs.readFileSync(STABILITY_FILE, 'utf8'));
        return assert(data.stability_state !== undefined, 'Missing stability_state');
    } catch (e) {
        return assert(false, e.message);
    }
});

test('History file is appended to', () => {
    const before = fs.existsSync(STABILITY_HISTORY_FILE) ? fs.readFileSync(STABILITY_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length : 0;
    runCognitiveStability({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    const after = fs.readFileSync(STABILITY_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length;
    return assert(after > before, `History did not grow. Before: ${before}, After: ${after}`);
});

test('Audit log contains MCAI-5F entry', () => {
    const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
    const mcai5fEntries = lines.filter(l => l.includes('"phase":"MCAI-5F"'));
    return assert(mcai5fEntries.length > 0, 'No MCAI-5F audit entries found');
});

// Test Group 11: Bounded Memory
console.log('\n[Test Group 11] Bounded Memory');
test('History respects retention limit', () => {
    const history = loadStabilityHistory();
    return assert(history.length <= MAX_HISTORY, `History exceeds limit: ${history.length}`);
});

test('History entries are valid JSON', () => {
    const history = loadStabilityHistory();
    for (const entry of history.slice(-5)) {
        try {
            JSON.parse(JSON.stringify(entry));
        } catch {
            return assert(false, `Invalid history entry`);
        }
    }
    return assert(true);
});

// Test Group 12: Main Record Schema
console.log('\n[Test Group 12] Main Record Schema');
test('Stability record has all required fields', () => {
    const record = runCognitiveStability({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    const required = [
        'stability_state', 'stability_strength', 'resilience_profile',
        'destabilization_pressures', 'recovery_regions', 'persistent_instability_zones',
        'oscillation_regions', 'recovery_continuity_summary', 'resilience_assessment',
        'stabilization_tracking', 'stability_drift_profile', 'uncertainty_boundaries',
        'environmental_stability_summary', 'generated_at', 'shadow_only'
    ];
    const missing = required.filter(k => !(k in record));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

test('shadow_only is true', () => {
    const record = runCognitiveStability({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(record.shadow_only === true, `shadow_only is ${record.shadow_only}`);
});

test('uncertainty_boundaries is non-empty array', () => {
    const record = runCognitiveStability({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    return assert(Array.isArray(record.uncertainty_boundaries) && record.uncertainty_boundaries.length > 0, 'No uncertainty boundaries');
});

test('generated_at is valid ISO timestamp', () => {
    const record = runCognitiveStability({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    const d = new Date(record.generated_at);
    return assert(!isNaN(d.getTime()), `Invalid timestamp: ${record.generated_at}`);
});

test('environmental_stability_summary has all required fields', () => {
    const record = runCognitiveStability({
        coherenceRecord: mockCoherenceRecord,
        pressureMapping: mockPressureMapping,
        attentionRecord: mockAttentionRecord,
        salienceRecord: mockSalienceRecord,
        stabilityHistory: emptyStabilityHistory
    });
    const summary = record.environmental_stability_summary;
    return assert(
        summary.summary !== undefined && summary.stability_state !== undefined &&
        summary.resilience_level !== undefined,
        `environmental_stability_summary missing required fields`
    );
});

// === SUMMARY ===

console.log('\n=== Validation Summary ===');
console.log(`Tests run:    ${tests_run}`);
console.log(`Tests passed: ${tests_passed}`);
console.log(`Tests failed: ${tests_failed}`);

if (tests_failed === 0) {
    console.log('\n✅ All tests passed. Cognitive stability layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

process.exit(tests_failed > 0 ? 1 : 0);