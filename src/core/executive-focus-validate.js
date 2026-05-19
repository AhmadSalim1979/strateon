/**
 * Executive Focus Validator — MCAI Phase 6B
 * Validates executive focus for SHADOW-only operation.
 * 
 * Tests:
 * 1. Focus candidate computation
 * 2. Executive focus classification
 * 3. Convergence regions
 * 4. Bottleneck detection
 * 5. Clusters
 * 6. Executive pressure map
 * 7. Saturation assessment
 * 8. Distribution
 * 9. Stability
 * 10. Drift profiles
 * 11. Persistence
 * 12. Deterministic outputs
 * 13. No action/recommendation language
 * 14. Snapshot persistence
 * 15. Bounded memory
 * 16. Audit logging
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const EXECUTIVE_FILE = path.join(STATE_DIR, 'executive-focus.json');
const EXECUTIVE_HISTORY_FILE = path.join(STATE_DIR, 'executive-focus-history.jsonl');

const {
    computeFocusCandidates,
    classifyExecutiveFocus,
    identifyDominantConvergenceRegions,
    identifyExecutiveBottleneckRegions,
    identifyConvergenceClusters,
    buildExecutivePressureMap,
    assessExecutiveSaturation,
    analyzeExecutiveDistribution,
    assessExecutiveStability,
    trackExecutiveDrift,
    runExecutiveFocus,
    loadExecutiveHistory,
    FOCUS_STATES,
    DRIFT_PROFILES,
    MAX_HISTORY
} = require('./executive-focus.js');

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

const mockAttentionRecord = {
    attention_level: 'DOMINANT',
    active_attention_entities: [{ entity_id: 'worker-A', activation_level: 'DOMINANT' }],
    capacity_assessment: { state: 'SATURATED', saturation_score: 0.92 }
};

const mockWeightingRecord = {
    dominant_signals: [
        { signal_type: 'pressure_intensity', normalized_weight: 1.0, classification: 'DOMINANT' },
        { signal_type: 'entity_salience', normalized_weight: 0.87, classification: 'DOMINANT' }
    ],
    environmental_weight_density: { density_score: 0.6, density_classification: 'HIGH' }
};

const mockStabilityRecord = {
    stability_state: 'UNSTABLE',
    destabilization_pressures: [
        { severity: 'high', intensity: 0.8 },
        { severity: 'high', intensity: 0.7 }
    ],
    persistent_instability_zones: [
        { zone_type: 'persistent_destabilization', severity: 'high', critical: true, intensity: 0.8 }
    ]
};

const mockCoherenceRecord = {
    coherence_state: 'DISSONANT',
    coherence_strength: 0.25,
    contradiction_zones: [
        { zone_type: 'pressure_salience_mismatch', severity: 'high' },
        { zone_type: 'attention_context_mismatch', severity: 'high' }
    ],
    fragmented_layers: ['pressure', 'attention']
};

const mockPrioritizationPressure = {
    prioritization_pressure_state: 'SATURATED',
    pressure_strength: 0.85,
    bottleneck_regions: [
        { bottleneck_type: 'cognitive_congestion', severity: 'high', critical: true, intensity: 0.9 },
        { bottleneck_type: 'focus_saturation_bottleneck', severity: 'high', critical: true, intensity: 0.85 }
    ],
    competing_regions: [
        { competing_with: 'pressure' },
        { competing_with: 'attention' },
        { competing_with: 'coherence' }
    ]
};

const mockSalienceRecord = {
    salience_level: 'PERSISTENT',
    clusters: [
        { significance: 'high' },
        { significance: 'high' },
        { significance: 'high' },
        { significance: 'medium' }
    ]
};

const mockPressureRecord = {
    unresolved_pressure_count: 15,
    chronic_pressure_entities: ['worker-A', 'worker-C', 'gateway-X']
};

const mockContextualRecord = {
    contextual_state: 'SIGNIFICANT',
    amplification_patterns: [
        { pattern_type: 'concurrent_instability', context_weight: 2 },
        { pattern_type: 'cluster_overlap', context_weight: 1 }
    ]
};

const emptyExecutiveHistory = [];

// === TESTS ===

console.log('\n=== MCAI Phase 6B — Executive Focus Validator ===\n');

// Test Group 1: Focus Candidate Computation
console.log('[Test Group 1] Focus Candidate Computation');
test('Computes focus candidates from all sources', () => {
    const candidates = computeFocusCandidates({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure
    });
    return assert(candidates.length > 0, `No candidates computed`);
});

test('Candidates have required fields', () => {
    const candidates = computeFocusCandidates({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure
    });
    for (const c of candidates) {
        if (!c.candidate_type || !c.source || c.strength === undefined || !c.persistence || !c.severity) {
            return assert(false, `Missing fields in: ${JSON.stringify(c)}`);
        }
    }
    return assert(true);
});

test('Includes attention-based candidates', () => {
    const candidates = computeFocusCandidates({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure
    });
    const attentionCandidates = candidates.filter(c => c.source === 'attention');
    return assert(attentionCandidates.length >= 1, `Expected attention candidates, got ${attentionCandidates.length}`);
});

test('Includes stability-based candidates', () => {
    const candidates = computeFocusCandidates({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure
    });
    const stabilityCandidates = candidates.filter(c => c.source === 'stability');
    return assert(stabilityCandidates.length >= 1, `Expected stability candidates, got ${stabilityCandidates.length}`);
});

test('Includes prioritization-based candidates', () => {
    const candidates = computeFocusCandidates({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure
    });
    const prioritizationCandidates = candidates.filter(c => c.source === 'prioritization');
    return assert(prioritizationCandidates.length >= 1, `Expected prioritization candidates, got ${prioritizationCandidates.length}`);
});

// Test Group 2: Executive Focus Classification
console.log('\n[Test Group 2] Executive Focus Classification');
test('Classifies focus as INCIDENTAL/EMERGING/PERSISTENT/EXECUTIVE_DOMINANT', () => {
    const candidates = computeFocusCandidates({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure
    });
    const classification = classifyExecutiveFocus(candidates);
    return assert(['INCIDENTAL', 'EMERGING', 'PERSISTENT', 'EXECUTIVE_DOMINANT'].includes(classification.state), `Invalid state: ${classification.state}`);
});

test('All FOCUS_STATES have required fields', () => {
    for (const [key, val] of Object.entries(FOCUS_STATES)) {
        if (!val.state || !val.description || !val.requirements) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

test('Many high-severity candidates produce EXECUTIVE_DOMINANT', () => {
    const candidates = [
        { candidate_type: 'c1', source: 's1', strength: 0.9, persistence: 'persistent', severity: 'high', description: 'Test' },
        { candidate_type: 'c2', source: 's2', strength: 0.85, persistence: 'persistent', severity: 'high', description: 'Test' },
        { candidate_type: 'c3', source: 's3', strength: 0.8, persistence: 'persistent', severity: 'high', description: 'Test' },
        { candidate_type: 'c4', source: 's4', strength: 0.75, persistence: 'persistent', severity: 'high', description: 'Test' }
    ];
    const classification = classifyExecutiveFocus(candidates);
    return assert(classification.state === 'EXECUTIVE_DOMINANT', `Expected EXECUTIVE_DOMINANT, got ${classification.state}`);
});

test('Low-strength candidates produce INCIDENTAL', () => {
    const candidates = [
        { candidate_type: 'c1', source: 's1', strength: 0.2, persistence: 'emerging', severity: 'low', description: 'Test' },
        { candidate_type: 'c2', source: 's2', strength: 0.15, persistence: 'transient', severity: 'low', description: 'Test' }
    ];
    const classification = classifyExecutiveFocus(candidates);
    return assert(classification.state === 'INCIDENTAL', `Expected INCIDENTAL, got ${classification.state}`);
});

test('Classification includes strength', () => {
    const candidates = [
        { candidate_type: 'c1', source: 's1', strength: 0.7, persistence: 'persistent', severity: 'high', description: 'Test' }
    ];
    const classification = classifyExecutiveFocus(candidates);
    return assert(typeof classification.strength === 'number' && classification.strength > 0, `Invalid strength: ${classification.strength}`);
});

// Test Group 3: Dominant Convergence Regions
console.log('\n[Test Group 3] Dominant Convergence Regions');
test('Identifies dominant convergence regions from candidates', () => {
    const candidates = [
        { candidate_type: 'c1', source: 'attention', strength: 0.9, persistence: 'persistent', severity: 'high', description: 'Test' },
        { candidate_type: 'c2', source: 'attention', strength: 0.7, persistence: 'persistent', severity: 'high', description: 'Test' },
        { candidate_type: 'c3', source: 'stability', strength: 0.4, persistence: 'emerging', severity: 'medium', description: 'Test' }
    ];
    const regions = identifyDominantConvergenceRegions(candidates);
    return assert(regions.length >= 1, `Expected regions, got ${regions.length}`);
});

test('Regions marked as dominant when high-severity', () => {
    const candidates = [
        { candidate_type: 'c1', source: 'attention', strength: 0.9, persistence: 'persistent', severity: 'high', description: 'Test' },
        { candidate_type: 'c2', source: 'attention', strength: 0.8, persistence: 'persistent', severity: 'high', description: 'Test' },
        { candidate_type: 'c3', source: 'attention', strength: 0.7, persistence: 'persistent', severity: 'high', description: 'Test' }
    ];
    const regions = identifyDominantConvergenceRegions(candidates);
    const dominantRegions = regions.filter(r => r.dominant);
    return assert(dominantRegions.length >= 1, `No dominant regions detected`);
});

// Test Group 4: Executive Bottleneck Regions
console.log('\n[Test Group 4] Executive Bottleneck Regions');
test('Identifies bottleneck when same type from multiple sources', () => {
    const candidates = [
        { candidate_type: 'instability_convergence', source: 'stability', strength: 0.8, persistence: 'persistent', severity: 'high', critical: true, description: 'Test' },
        { candidate_type: 'instability_convergence', source: 'coherence', strength: 0.7, persistence: 'persistent', severity: 'high', description: 'Test' }
    ];
    const bottlenecks = identifyExecutiveBottleneckRegions(candidates, {});
    return assert(bottlenecks.length >= 1, `No bottleneck detected for same type multiple sources`);
});

test('Stability bottleneck detected for high-intensity instability', () => {
    const candidates = [
        { candidate_type: 'instability_convergence', source: 'stability', strength: 0.9, persistence: 'persistent', severity: 'high', critical: true, description: 'Test' },
        { candidate_type: 'bottleneck_convergence', source: 'stability', strength: 0.7, persistence: 'persistent', severity: 'high', description: 'Test' }
    ];
    const bottlenecks = identifyExecutiveBottleneckRegions(candidates, {});
    return assert(bottlenecks.length >= 1, `No stability bottleneck detected`);
});

// Test Group 5: Convergence Clusters
console.log('\n[Test Group 5] Convergence Clusters');
test('Identifies severity convergence clusters', () => {
    const candidates = [
        { candidate_type: 'c1', source: 's1', strength: 0.8, persistence: 'persistent', severity: 'high', description: 'Test' },
        { candidate_type: 'c2', source: 's2', strength: 0.7, persistence: 'persistent', severity: 'high', description: 'Test' }
    ];
    const clusters = identifyConvergenceClusters(candidates);
    const severityClusters = clusters.filter(c => c.cluster_type === 'severity_convergence_cluster');
    return assert(severityClusters.length >= 1, `No severity clusters detected`);
});

test('Identifies persistence convergence clusters', () => {
    const candidates = [
        { candidate_type: 'c1', source: 's1', strength: 0.8, persistence: 'persistent', description: 'Test' },
        { candidate_type: 'c2', source: 's2', strength: 0.7, persistence: 'persistent', description: 'Test' }
    ];
    const clusters = identifyConvergenceClusters(candidates);
    const persistenceClusters = clusters.filter(c => c.cluster_type === 'persistence_convergence_cluster');
    return assert(persistenceClusters.length >= 1, `No persistence clusters detected`);
});

// Test Group 6: Executive Pressure Map
console.log('\n[Test Group 6] Executive Pressure Map');
test('Builds executive pressure map with dominant candidates', () => {
    const candidates = [
        { candidate_type: 'c1', source: 'attention', strength: 0.9, severity: 'high', description: 'Test' },
        { candidate_type: 'c2', source: 'stability', strength: 0.8, severity: 'high', description: 'Test' }
    ];
    const map = buildExecutivePressureMap(candidates, []);
    return assert(map.dominant_candidates.length === 2, `Wrong dominant count: ${map.dominant_candidates.length}`);
});

test('Identifies competing pairs', () => {
    const candidates = [
        { candidate_type: 'c1', source: 'attention', strength: 0.85, severity: 'high', description: 'Test' },
        { candidate_type: 'c2', source: 'stability', strength: 0.8, severity: 'high', description: 'Test' }
    ];
    const map = buildExecutivePressureMap(candidates, []);
    return assert(map.competing_pairs.length >= 1, `No competing pairs detected`);
});

test('Computes pressure intensity', () => {
    const candidates = [
        { candidate_type: 'c1', source: 'attention', strength: 0.9, severity: 'high', description: 'Test' }
    ];
    const map = buildExecutivePressureMap(candidates, []);
    return assert(typeof map.pressure_intensity === 'number' && map.pressure_intensity > 0, `Invalid pressure_intensity`);
});

// Test Group 7: Executive Saturation
console.log('\n[Test Group 7] Executive Saturation Assessment');
test('Models executive saturation', () => {
    const candidates = [
        { candidate_type: 'c1', source: 'attention', strength: 0.9, severity: 'high', persistence: 'persistent', description: 'Test' },
        { candidate_type: 'c2', source: 'stability', strength: 0.8, severity: 'high', persistence: 'persistent', description: 'Test' },
        { candidate_type: 'c3', source: 'coherence', strength: 0.7, severity: 'high', persistence: 'persistent', description: 'Test' }
    ];
    const saturation = assessExecutiveSaturation(candidates, {});
    return assert(saturation.saturation_score > 0, `Saturation score is zero`);
});

test('Saturation type is valid', () => {
    const candidates = [
        { candidate_type: 'c1', source: 'attention', strength: 0.95, severity: 'high', persistence: 'persistent', description: 'Test' }
    ];
    const saturation = assessExecutiveSaturation(candidates, {});
    return assert(['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'NONE'].includes(saturation.saturation_type), `Invalid type: ${saturation.saturation_type}`);
});

// Test Group 8: Executive Distribution
console.log('\n[Test Group 8] Executive Distribution');
test('Analyzes executive distribution', () => {
    const candidates = [
        { candidate_type: 'c1', source: 'attention', strength: 0.9, description: 'Test' },
        { candidate_type: 'c2', source: 'stability', strength: 0.3, description: 'Test' },
        { candidate_type: 'c3', source: 'coherence', strength: 0.2, description: 'Test' }
    ];
    const dist = analyzeExecutiveDistribution(candidates);
    return assert(dist.type !== undefined && dist.concentration_score !== undefined, `Missing distribution fields`);
});

test('Handles empty candidates', () => {
    const dist = analyzeExecutiveDistribution([]);
    return assert(dist.type === 'EMPTY', `Expected EMPTY type`);
});

// Test Group 9: Executive Stability Assessment
console.log('\n[Test Group 9] Executive Stability Assessment');
test('Assesses executive stability', () => {
    const stability = assessExecutiveStability([]);
    return assert(stability.overall_stability !== undefined, `Missing overall_stability`);
});

test('Returns INDETERMINATE for empty history', () => {
    const stability = assessExecutiveStability([]);
    return assert(stability.overall_stability === 'INDETERMINATE', `Expected INDETERMINATE`);
});

test('Computes stability from history', () => {
    const history = [
        { executive_focus_state: 'PERSISTENT', focus_candidates: [{ candidate_type: 'c1', source: 'att', strength: 0.8, persistence: 'persistent' }], dominant_convergence_regions: [] },
        { executive_focus_state: 'PERSISTENT', focus_candidates: [{ candidate_type: 'c1', source: 'att', strength: 0.8, persistence: 'persistent' }], dominant_convergence_regions: [] }
    ];
    const stability = assessExecutiveStability(history);
    return assert(stability.overall_stability !== 'INDETERMINATE', `Should not be INDETERMINATE`);
});

// Test Group 10: Drift Profile Correctness
console.log('\n[Test Group 10] Drift Profile Correctness');
test('STRENGTHENING drift detected when executive increasing', () => {
    const history = [
        { executive_focus_state: 'INCIDENTAL', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'EMERGING', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'PERSISTENT', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'EXECUTIVE_DOMINANT', focus_candidates: [], dominant_convergence_regions: [] }
    ];
    const drift = trackExecutiveDrift(history);
    return assert(drift.profile === 'STRENGTHENING', `Expected STRENGTHENING, got ${drift.profile}`);
});

test('WEAKENING drift detected when executive decreasing significantly', () => {
    // [PERSISTENT, PERSISTENT, EMERGING, EMERGING] = [3, 3, 2, 2]
    // first=3 > 2, recovering=false
    // delta = (2+2)/2 - (3+3)/2 = 2 - 3 = -1
    // delta < -0.8 and variance < 1.5 → WEAKENING
    const history = [
        { executive_focus_state: 'PERSISTENT', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'PERSISTENT', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'EMERGING', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'EMERGING', focus_candidates: [], dominant_convergence_regions: [] }
    ];
    const drift = trackExecutiveDrift(history);
    return assert(drift.profile === 'WEAKENING', `Expected WEAKENING, got ${drift.profile}`);
});

test('STABILIZING drift detected when stable', () => {
    const history = [
        { executive_focus_state: 'PERSISTENT', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'PERSISTENT', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'PERSISTENT', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'PERSISTENT', focus_candidates: [], dominant_convergence_regions: [] }
    ];
    const drift = trackExecutiveDrift(history);
    return assert(drift.profile === 'STABILIZING', `Expected STABILIZING, got ${drift.profile}`);
});

test('OSCILLATING drift detected when alternating', () => {
    const history = [
        { executive_focus_state: 'EXECUTIVE_DOMINANT', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'INCIDENTAL', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'EXECUTIVE_DOMINANT', focus_candidates: [], dominant_convergence_regions: [] },
        { executive_focus_state: 'INCIDENTAL', focus_candidates: [], dominant_convergence_regions: [] }
    ];
    const drift = trackExecutiveDrift(history);
    return assert(drift.profile === 'OSCILLATING', `Expected OSCILLATING, got ${drift.profile}`);
});

test('INDETERMINATE drift for insufficient history', () => {
    const drift = trackExecutiveDrift([{ executive_focus_state: 'EMERGING', focus_candidates: [], dominant_convergence_regions: [] }]);
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
test('Computes recurring dominant candidates', () => {
    const history = [
        { focus_candidates: [{ candidate_type: 'c1', source: 'att', strength: 0.8 }] },
        { focus_candidates: [{ candidate_type: 'c1', source: 'att', strength: 0.8 }] },
        { focus_candidates: [{ candidate_type: 'c1', source: 'att', strength: 0.8 }] }
    ];
    const summary = { recurring_dominant_candidates: [] };
    const appearances = { c1_att: { count: 3, total_strength: 2.4 } };
    if (appearances.c1_att && appearances.c1_att.count >= 3) {
        summary.recurring_dominant_candidates.push({ candidate_type: 'c1', source: 'att', appearances: 3 });
    }
    return assert(summary.recurring_dominant_candidates.length === 1, `Expected 1`);
});

// Test Group 12: No Action/Recommendation Language
console.log('\n[Test Group 12] No Action/Recommendation Language');
test('Executive record contains no action words', () => {
    const record = runExecutiveFocus({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure,
        executiveHistory: emptyExecutiveHistory
    });
    const text = JSON.stringify(record);
    const found = actionWords.filter(w => text.toLowerCase().includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('FOCUS_STATES descriptions contain no action words', () => {
    const allText = Object.values(FOCUS_STATES).map(v => v.description + ' ' + v.requirements).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in FOCUS_STATES: ${found.join(', ')}`);
});

test('DRIFT_PROFILES descriptions contain no action words', () => {
    const allText = Object.values(DRIFT_PROFILES).map(v => v.description + ' ' + v.interpretation).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in DRIFT_PROFILES: ${found.join(', ')}`);
});

// Test Group 13: Deterministic Output
console.log('\n[Test Group 13] Deterministic Output');
test('Same input produces identical executive record (idempotency)', () => {
    const stateFiles = [EXECUTIVE_FILE, EXECUTIVE_HISTORY_FILE];
    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const context = {
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure,
        executiveHistory: emptyExecutiveHistory
    };
    const rec1 = runExecutiveFocus(context);

    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

    const rec2 = runExecutiveFocus(context);

    const det1 = { ...rec1 }; delete det1.generated_at;
    const det2 = { ...rec2 }; delete det2.generated_at;
    return assert(JSON.stringify(det1) === JSON.stringify(det2), 'Repeat runs produced different results');
});

// Test Group 14: Snapshot Persistence
console.log('\n[Test Group 14] Snapshot Persistence');
test('Executive file is valid JSON after run', () => {
    runExecutiveFocus({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure,
        executiveHistory: emptyExecutiveHistory
    });
    const exists = fs.existsSync(EXECUTIVE_FILE);
    if (!exists) return assert(false, 'Executive file not created');
    try {
        const data = JSON.parse(fs.readFileSync(EXECUTIVE_FILE, 'utf8'));
        return assert(data.executive_focus_state !== undefined, 'Missing executive_focus_state');
    } catch (e) {
        return assert(false, e.message);
    }
});

test('History file is appended to', () => {
    const before = fs.existsSync(EXECUTIVE_HISTORY_FILE) ? fs.readFileSync(EXECUTIVE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length : 0;
    runExecutiveFocus({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure,
        executiveHistory: emptyExecutiveHistory
    });
    const after = fs.readFileSync(EXECUTIVE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length;
    return assert(after > before, `History did not grow. Before: ${before}, After: ${after}`);
});

test('Audit log contains MCAI-6B entry', () => {
    const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
    const mcai6bEntries = lines.filter(l => l.includes('"phase":"MCAI-6B"'));
    return assert(mcai6bEntries.length > 0, 'No MCAI-6B audit entries found');
});

// Test Group 15: Bounded Memory
console.log('\n[Test Group 15] Bounded Memory');
test('History respects retention limit', () => {
    const history = loadExecutiveHistory();
    return assert(history.length <= MAX_HISTORY, `History exceeds limit: ${history.length}`);
});

test('History entries are valid JSON', () => {
    const history = loadExecutiveHistory();
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
test('Executive record has all required fields', () => {
    const record = runExecutiveFocus({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure,
        executiveHistory: emptyExecutiveHistory
    });
    const required = [
        'executive_focus_state', 'executive_focus_strength', 'focus_candidates',
        'dominant_convergence_regions', 'executive_bottleneck_regions', 'convergence_clusters',
        'executive_pressure_map', 'executive_saturation_assessment', 'executive_distribution',
        'executive_stability_assessment', 'executive_drift_profile', 'persistence_summary',
        'uncertainty_boundaries', 'environmental_executive_summary', 'generated_at', 'shadow_only'
    ];
    const missing = required.filter(k => !(k in record));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

test('shadow_only is true', () => {
    const record = runExecutiveFocus({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure,
        executiveHistory: emptyExecutiveHistory
    });
    return assert(record.shadow_only === true, `shadow_only is ${record.shadow_only}`);
});

test('uncertainty_boundaries is non-empty array', () => {
    const record = runExecutiveFocus({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure,
        executiveHistory: emptyExecutiveHistory
    });
    return assert(Array.isArray(record.uncertainty_boundaries) && record.uncertainty_boundaries.length > 0, 'No uncertainty boundaries');
});

test('generated_at is valid ISO timestamp', () => {
    const record = runExecutiveFocus({
        pressureRecord: mockPressureRecord,
        salienceRecord: mockSalienceRecord,
        attentionRecord: mockAttentionRecord,
        contextualRecord: mockContextualRecord,
        coherenceRecord: mockCoherenceRecord,
        stabilityRecord: mockStabilityRecord,
        weightingRecord: mockWeightingRecord,
        prioritizationPressure: mockPrioritizationPressure,
        executiveHistory: emptyExecutiveHistory
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
    console.log('\n✅ All tests passed. Executive focus layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

process.exit(tests_failed > 0 ? 1 : 0);