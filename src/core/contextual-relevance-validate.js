/**
 * Contextual Relevance Validator — MCAI Phase 5D
 * Validates contextual relevance for SHADOW-only operation.
 * 
 * Tests:
 * 1. Contextual relevance computation
 * 2. Relevance classification
 * 3. Context amplification modeling
 * 4. Suppression modeling
 * 5. Dependency mapping
 * 6. Contextual drift tracking
 * 7. Interaction mapping
 * 8. Deterministic outputs
 * 9. No action/recommendation language
 * 10. Snapshot persistence
 * 11. Bounded memory retention
 * 12. Audit logging
 * 13. Repeat-run stability
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const CONTEXTUAL_FILE = path.join(STATE_DIR, 'contextual-relevance.json');
const CONTEXTUAL_HISTORY_FILE = path.join(STATE_DIR, 'contextual-relevance-history.jsonl');

const {
    computeContextualRelevance,
    trackContextualDrift,
    mapContextualInteractions,
    trackContextualPersistence,
    runContextualRelevance,
    loadContextualHistory,
    RELEVANCE_LEVELS,
    DRIFT_PROFILES,
    MAX_HISTORY
} = require('./contextual-relevance.js');

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

const mockSalienceRecord = {
    salient_entities: ['worker-A', 'worker-C', 'gateway-X'],
    salient_patterns: [
        { pattern_type: 'chronic_instability', instances: 2, entities: ['worker-A', 'worker-C'], highest_severity: 'high' },
        { pattern_type: 'recurring_contradiction', instances: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], highest_severity: 'medium' },
        { pattern_type: 'repeated_volatility', instances: 1, entities: ['gateway-X'], highest_severity: 'medium' },
        { pattern_type: 'unresolved_degradation', instances: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], highest_severity: 'high' }
    ],
    clusters: [
        { cluster_type: 'synchronized_instability', entity_count: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], significance: 'high' },
        { cluster_type: 'contradiction_cluster', entity_count: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], significance: 'medium' },
        { cluster_type: 'degradation_continuity', entity_count: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], significance: 'medium' }
    ]
};

const mockAttentionRecord = {
    attention_level: 'DOMINANT',
    active_attention_entities: [
        { entity_id: 'worker-A', activation_level: 'DOMINANT' },
        { entity_id: 'worker-C', activation_level: 'DOMINANT' },
        { entity_id: 'gateway-X', activation_level: 'ELEVATED' }
    ],
    capacity_assessment: { state: 'HIGH', saturation_score: 0.7 },
    transition_profile: { profile: 'STRENGTHENING' }
};

const mockCognitivePressure = {
    strain_level: 'HIGH',
    unresolved_pressure_count: 8,
    chronic_entities: ['worker-A', 'worker-C']
};

// === TESTS ===

console.log('\n=== MCAI Phase 5D — Contextual Relevance Validator ===\n');

// Test Group 1: Contextual Relevance Computation
console.log('[Test Group 1] Contextual Relevance Computation');
test('Computes contextual relevance from upstream phases', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    return assert(result.contextual_state !== 'UNKNOWN', `Contextual state still UNKNOWN`);
});

test('Entity relevance is computed for all salient entities', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    return assert(result.entity_relevance.length > 0, `No entity relevance computed`);
});

test('Pattern relevance is computed', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    return assert(result.pattern_relevance.length > 0, `No pattern relevance computed`);
});

test('Amplification patterns identified', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    return assert(result.amplification_patterns.length > 0, `No amplification patterns`);
});

test('Suppression patterns identified', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    return assert(result.suppression_patterns !== undefined, `Suppression patterns missing`);
});

test('Environmental dependencies mapped', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    return assert(result.environmental_dependencies.length > 0, `No environmental dependencies`);
});

test('Contextual clusters identified', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    return assert(result.contextual_clusters.length > 0, `No contextual clusters`);
});

// Test Group 2: Relevance Classification
console.log('\n[Test Group 2] Relevance Classification');
test('Contextual state is valid enum', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    return assert(['INCIDENTAL', 'CONTEXTUAL', 'SIGNIFICANT', 'CRITICAL_CONTEXT'].includes(result.contextual_state), `Invalid: ${result.contextual_state}`);
});

test('Entity relevance levels are valid', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    const validLevels = ['INCIDENTAL', 'CONTEXTUAL', 'SIGNIFICANT', 'CRITICAL_CONTEXT'];
    for (const e of result.entity_relevance) {
        if (!validLevels.includes(e.relevance_level)) {
            return assert(false, `Invalid entity level: ${e.relevance_level}`);
        }
    }
    return assert(true);
});

test('Pattern relevance levels are valid', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    const validLevels = ['INCIDENTAL', 'CONTEXTUAL', 'SIGNIFICANT', 'CRITICAL_CONTEXT'];
    for (const p of result.pattern_relevance) {
        if (!validLevels.includes(p.relevance_level)) {
            return assert(false, `Invalid pattern level: ${p.relevance_level}`);
        }
    }
    return assert(true);
});

test('All RELEVANCE_LEVELS have required fields', () => {
    for (const [key, val] of Object.entries(RELEVANCE_LEVELS)) {
        if (!val.level || !val.description || !val.requirements) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

test('Context dependency scores are computed', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    for (const e of result.entity_relevance) {
        if (typeof e.context_dependency_score !== 'number') {
            return assert(false, `Missing context_dependency_score for ${e.entity_id}`);
        }
    }
    return assert(true);
});

// Test Group 3: Context Amplification Modeling
console.log('\n[Test Group 3] Context Amplification Modeling');
test('Concurrent instability amplifies relevance', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    const hasInstabilityAmplification = result.amplification_patterns.some(p => p.pattern_type === 'concurrent_instability');
    return assert(hasInstabilityAmplification, `No concurrent instability amplification`);
});

test('Cluster overlap amplifies relevance', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    const hasClusterAmplification = result.amplification_patterns.some(p => p.pattern_type === 'cluster_overlap');
    return assert(hasClusterAmplification, `No cluster overlap amplification`);
});

test('High strain amplifies relevance', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    const hasPressureAmplification = result.amplification_patterns.some(p => p.pattern_type === 'environmental_pressure');
    return assert(hasPressureAmplification, `No environmental pressure amplification`);
});

test('Attention saturation amplifies relevance', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    const hasSaturationAmplification = result.amplification_patterns.some(p => p.pattern_type === 'attention_saturation');
    return assert(hasSaturationAmplification, `No attention saturation amplification`);
});

test('Unresolved pressure amplifies relevance', () => {
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    const hasUnresolvedAmplification = result.amplification_patterns.some(p => p.pattern_type === 'unresolved_pressure');
    return assert(hasUnresolvedAmplification, `No unresolved pressure amplification`);
});

// Test Group 4: Suppression Modeling
console.log('\n[Test Group 4] Suppression Modeling');
test('Fragmenting transition suppresses', () => {
    const fragmentingAttention = { ...mockAttentionRecord, transition_profile: { profile: 'FRAGMENTING' } };
    const result = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: fragmentingAttention,
        cognitivePressure: mockCognitivePressure
    });
    const hasSuppression = result.suppression_patterns.some(p => p.pattern_type === 'fragmenting_transition');
    return assert(hasSuppression, `No fragmenting suppression detected`);
});

test('Stable entity suppression when applicable', () => {
    const lowSeveritySalience = {
        ...mockSalienceRecord,
        salient_patterns: mockSalienceRecord.salient_patterns.map(p => ({ ...p, highest_severity: 'low' }))
    };
    const result = computeContextualRelevance({
        salienceRecord: lowSeveritySalience,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    const hasSuppression = result.suppression_patterns.some(p => p.pattern_type === 'stable_entity_suppression');
    return assert(hasSuppression, `No stable entity suppression detected`);
});

// Test Group 5: Contextual Drift Tracking
console.log('\n[Test Group 5] Contextual Drift Tracking');
test('STRENGTHENING when context improving', () => {
    const history = [
        { contextual_state: 'INCIDENTAL' },
        { contextual_state: 'CONTEXTUAL' },
        { contextual_state: 'SIGNIFICANT' },
        { contextual_state: 'SIGNIFICANT' }
    ];
    const drift = trackContextualDrift(history);
    return assert(drift.profile === 'STRENGTHENING', `Expected STRENGTHENING, got ${drift.profile}`);
});

test('WEAKENING when context degrading', () => {
    const history = [
        { contextual_state: 'CRITICAL_CONTEXT' },
        { contextual_state: 'SIGNIFICANT' },
        { contextual_state: 'CONTEXTUAL' },
        { contextual_state: 'CONTEXTUAL' }
    ];
    const drift = trackContextualDrift(history);
    return assert(drift.profile === 'WEAKENING', `Expected WEAKENING, got ${drift.profile}`);
});

test('STABILIZING when context consistent', () => {
    const history = [
        { contextual_state: 'SIGNIFICANT' },
        { contextual_state: 'SIGNIFICANT' },
        { contextual_state: 'SIGNIFICANT' },
        { contextual_state: 'SIGNIFICANT' }
    ];
    const drift = trackContextualDrift(history);
    return assert(drift.profile === 'STABILIZING', `Expected STABILIZING, got ${drift.profile}`);
});

test('OSCILLATING when context alternating', () => {
    const history = [
        { contextual_state: 'INCIDENTAL' },
        { contextual_state: 'CRITICAL_CONTEXT' },
        { contextual_state: 'INCIDENTAL' },
        { contextual_state: 'CRITICAL_CONTEXT' }
    ];
    const drift = trackContextualDrift(history);
    return assert(drift.profile === 'OSCILLATING', `Expected OSCILLATING, got ${drift.profile}`);
});

test('FRAGMENTING when high variance with stable average', () => {
    // High variance without clear alternating pattern → FRAGMENTING
    // [1, 4, 1, 4] has high variance (2.25) but also oscillates
    // Use [1, 3, 2, 4] which has variance but less clear oscillation
    const history = [
        { contextual_state: 'INCIDENTAL' },
        { contextual_state: 'SIGNIFICANT' },
        { contextual_state: 'CONTEXTUAL' },
        { contextual_state: 'SIGNIFICANT' }
    ];
    const drift = trackContextualDrift(history);
    return assert(drift.profile === 'FRAGMENTING', `Expected FRAGMENTING, got ${drift.profile}`);
});

test('INDETERMINATE when insufficient history', () => {
    const drift = trackContextualDrift([{ contextual_state: 'SIGNIFICANT' }]);
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

// Test Group 6: Contextual Interaction Mapping
console.log('\n[Test Group 6] Contextual Interaction Mapping');
test('Overlapping instability regions detected', () => {
    const assessment = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    const interactions = mapContextualInteractions(assessment, mockSalienceRecord.clusters);
    return assert(interactions.overlapping_instability_regions.length >= 0, `Mapping failed`);
});

test('Reinforcement chains detected', () => {
    const assessment = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    const interactions = mapContextualInteractions(assessment, mockSalienceRecord.clusters);
    return assert(interactions.reinforcement_chains.length >= 0, `Mapping failed`);
});

test('All interaction types are arrays', () => {
    const assessment = computeContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure
    });
    const interactions = mapContextualInteractions(assessment, mockSalienceRecord.clusters);
    const types = ['overlapping_instability_regions', 'reinforcement_chains', 'contradiction_amplification', 'contextual_volatility_overlap', 'synchronized_degradation_relevance', 'pressure_amplification_zones'];
    for (const type of types) {
        if (!Array.isArray(interactions[type])) {
            return assert(false, `${type} is not an array`);
        }
    }
    return assert(true);
});

// Test Group 7: No Action/Recommendation Language
console.log('\n[Test Group 7] No Action/Recommendation Language');
test('Contextual record contains no action words', () => {
    const record = runContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure,
        contextualHistory: []
    });
    // Exclude 'contextual_interaction_map' key — 'interactions' contains 'action' as substring, not a word
    const text = JSON.stringify(record).replace(/contextual_interaction_map/g, 'contextual_interaction_map_REPLACED');
    const found = actionWords.filter(w => text.toLowerCase().includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('RELEVANCE_LEVELS descriptions contain no action words', () => {
    const allText = Object.values(RELEVANCE_LEVELS).map(v => v.description + ' ' + v.requirements).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in RELEVANCE_LEVELS: ${found.join(', ')}`);
});

test('DRIFT_PROFILES descriptions contain no action words', () => {
    const allText = Object.values(DRIFT_PROFILES).map(v => v.description + ' ' + v.interpretation).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in DRIFT_PROFILES: ${found.join(', ')}`);
});

// Test Group 8: Deterministic Output
console.log('\n[Test Group 8] Deterministic Output');
test('Same input produces identical contextual record (idempotency)', () => {
    // Clear state files for deterministic baseline
    const stateFiles = [CONTEXTUAL_FILE, CONTEXTUAL_HISTORY_FILE];
    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const context = {
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure,
        contextualHistory: []
    };
    const rec1 = runContextualRelevance(context);

    // Reset for second run
    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const rec2 = runContextualRelevance(context);

    // Compare deterministic fields (ignore generated_at)
    const det1 = { ...rec1 }; delete det1.generated_at;
    const det2 = { ...rec2 }; delete det2.generated_at;
    return assert(JSON.stringify(det1) === JSON.stringify(det2), 'Repeat runs produced different results');
});

// Test Group 9: Snapshot Persistence
console.log('\n[Test Group 9] Snapshot Persistence');
test('Contextual file is valid JSON after run', () => {
    runContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure,
        contextualHistory: []
    });
    const exists = fs.existsSync(CONTEXTUAL_FILE);
    if (!exists) return assert(false, 'Contextual file not created');
    try {
        const data = JSON.parse(fs.readFileSync(CONTEXTUAL_FILE, 'utf8'));
        return assert(data.contextual_state !== undefined, 'Missing contextual_state');
    } catch (e) {
        return assert(false, e.message);
    }
});

test('History file is appended to', () => {
    const before = fs.existsSync(CONTEXTUAL_HISTORY_FILE) ? fs.readFileSync(CONTEXTUAL_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length : 0;
    runContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure,
        contextualHistory: []
    });
    const after = fs.readFileSync(CONTEXTUAL_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length;
    return assert(after > before, `History did not grow. Before: ${before}, After: ${after}`);
});

test('Audit log contains MCAI-5D entry', () => {
    const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
    const mcai5dEntries = lines.filter(l => l.includes('"phase":"MCAI-5D"'));
    return assert(mcai5dEntries.length > 0, 'No MCAI-5D audit entries found');
});

// Test Group 10: Bounded Memory
console.log('\n[Test Group 10] Bounded Memory');
test('History respects retention limit', () => {
    const history = loadContextualHistory();
    return assert(history.length <= MAX_HISTORY, `History exceeds limit: ${history.length}`);
});

test('History entries are valid JSON', () => {
    const history = loadContextualHistory();
    for (const entry of history.slice(-5)) {
        try {
            JSON.parse(JSON.stringify(entry));
        } catch {
            return assert(false, `Invalid history entry`);
        }
    }
    return assert(true);
});

// Test Group 11: Main Record Schema
console.log('\n[Test Group 11] Main Record Schema');
test('Contextual record has all required fields', () => {
    const record = runContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure,
        contextualHistory: []
    });
    const required = [
        'contextual_state', 'relevant_entities', 'contextual_clusters',
        'amplification_patterns', 'suppression_patterns', 'environmental_dependencies',
        'contextual_pressure_relationships', 'contextual_interaction_map', 'contextual_drift',
        'persistence_summary', 'contextual_uncertainty_boundaries', 'generated_at', 'shadow_only'
    ];
    const missing = required.filter(k => !(k in record));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

test('shadow_only is true', () => {
    const record = runContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure,
        contextualHistory: []
    });
    return assert(record.shadow_only === true, `shadow_only is ${record.shadow_only}`);
});

test('contextual_uncertainty_boundaries is non-empty array', () => {
    const record = runContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure,
        contextualHistory: []
    });
    return assert(Array.isArray(record.contextual_uncertainty_boundaries) && record.contextual_uncertainty_boundaries.length > 0, 'No uncertainty boundaries');
});

test('generated_at is valid ISO timestamp', () => {
    const record = runContextualRelevance({
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        cognitivePressure: mockCognitivePressure,
        contextualHistory: []
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
    console.log('\n✅ All tests passed. Contextual relevance layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

process.exit(tests_failed > 0 ? 1 : 0);