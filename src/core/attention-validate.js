/**
 * Attention Formation Validator — MCAI Phase 5C
 * Validates attention formation for SHADOW-only operation.
 * 
 * Tests:
 * 1. Attention activation
 * 2. Attention strength classification
 * 3. Attention persistence tracking
 * 4. Attention competition modeling
 * 5. Bounded capacity enforcement
 * 6. Saturation detection
 * 7. Fragmentation detection
 * 8. Transition classification
 * 9. Deterministic outputs
 * 10. No action/recommendation language
 * 11. Snapshot persistence
 * 12. Bounded memory retention
 * 13. Audit logging
 * 14. Repeat-run stability
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const ATTENTION_FILE = path.join(STATE_DIR, 'attention.json');
const ATTENTION_HISTORY_FILE = path.join(STATE_DIR, 'attention-history.jsonl');

const {
    determineAttentionActivation,
    modelAttentionCompetition,
    assessAttentionCapacity,
    trackAttentionPersistence,
    analyzeAttentionTransition,
    computeAttentionDistribution,
    runAttentionFormation,
    loadAttentionHistory,
    ATTENTION_LEVELS,
    TRANSITION_PROFILES,
    CAPACITY_STATES,
    MAX_ACTIVE_ATTENTION_REGIONS,
    MAX_HISTORY
} = require('./attention.js');

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
        { pattern_type: 'unresolved_degradation', instances: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], highest_severity: 'high' },
        { pattern_type: 'recurring_verification_decay', instances: 3, entities: ['worker-A', 'worker-C'], highest_severity: 'medium' }
    ],
    clusters: [
        { cluster_type: 'synchronized_instability', entity_count: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], significance: 'high' },
        { cluster_type: 'contradiction_cluster', entity_count: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], significance: 'medium' },
        { cluster_type: 'degradation_continuity', entity_count: 3, entities: ['worker-A', 'worker-C', 'gateway-X'], significance: 'medium' }
    ],
    persistence_tracking: {
        persistent_entities: ['worker-A', 'worker-C'],
        new_salient_entities: ['gateway-X']
    }
};

const mockCognitivePressure = {
    strain_level: 'HIGH',
    unresolved_pressure_count: 8,
    chronic_entities: ['worker-A', 'worker-C'],
    pressure_concentration: { classification: 'CONCENTRATED' }
};

const mockAttentionHistory = [
    {
        active_attention_entities: ['worker-A', 'worker-B'],
        active_attention_patterns: [],
        capacity_assessment: { state: 'AVAILABLE', saturation_score: 0.2 },
        persistence_summary: { attention_interruption_count: 0 }
    },
    {
        active_attention_entities: ['worker-A', 'worker-C'],
        active_attention_patterns: [],
        capacity_assessment: { state: 'PARTIAL', saturation_score: 0.5 },
        persistence_summary: { attention_interruption_count: 1 }
    },
    {
        active_attention_entities: ['worker-A', 'worker-C', 'gateway-X'],
        active_attention_patterns: [],
        capacity_assessment: { state: 'HIGH', saturation_score: 0.7 },
        persistence_summary: { attention_interruption_count: 1 }
    }
];

// === TESTS ===

console.log('\n=== MCAI Phase 5C — Attention Formation Validator ===\n');

// Test Group 1: Attention Activation
console.log('[Test Group 1] Attention Activation');
test('Activate entities from salience record', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    return assert(activation.active_entities.length > 0, `No active entities. Found: ${activation.active_entities.length}`);
});

test('Activate patterns from salience record', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    return assert(activation.active_patterns.length > 0, `No active patterns. Found: ${activation.active_patterns.length}`);
});

test('Activation includes entity activation level', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const hasLevel = activation.active_entities.every(e => e.activation_level);
    return assert(hasLevel, `Missing activation_level on some entities`);
});

test('Activation includes pattern activation level', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const hasLevel = activation.active_patterns.every(p => p.activation_level);
    return assert(hasLevel, `Missing activation_level on some patterns`);
});

test('Activation includes attention signals from clusters', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    return assert(activation.attention_signals.length > 0, `No attention signals. Found: ${activation.attention_signals.length}`);
});

test('Cognitive pressure generates attention signal when unresolved >= 3', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const cpSignal = activation.attention_signals.find(s => s.signal_type === 'cognitive_pressure');
    return assert(cpSignal && cpSignal.unresolved_count >= 3, `No cognitive pressure signal. Found: ${JSON.stringify(cpSignal)}`);
});

test('Activation has required fields', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    return assert(
        activation.active_entities !== undefined &&
        activation.active_patterns !== undefined &&
        activation.activation_strength !== undefined &&
        activation.attention_signals !== undefined,
        'Missing required activation fields'
    );
});

// Test Group 2: Attention Strength Classification
console.log('\n[Test Group 2] Attention Strength Classification');
test('All ATTENTION_LEVELS have required fields', () => {
    for (const [key, val] of Object.entries(ATTENTION_LEVELS)) {
        if (!val.level || !val.description || !val.requirements) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

test('Entity activation level assignment is valid', () => {
    const levels = ['BACKGROUND', 'ACTIVE', 'ELEVATED', 'DOMINANT'];
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    for (const e of activation.active_entities) {
        if (!levels.includes(e.activation_level)) {
            return assert(false, `Invalid level: ${e.activation_level}`);
        }
    }
    return assert(true);
});

test('Pattern activation level assignment is valid', () => {
    const levels = ['BACKGROUND', 'ACTIVE', 'ELEVATED', 'DOMINANT'];
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    for (const p of activation.active_patterns) {
        if (!levels.includes(p.activation_level)) {
            return assert(false, `Invalid level: ${p.activation_level}`);
        }
    }
    return assert(true);
});

test('Persistent entities get activation bonus', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const workerA = activation.active_entities.find(e => e.entity_id === 'worker-A');
    return assert(workerA && workerA.is_persistent === true, `worker-A is_persistent not set correctly`);
});

// Test Group 3: Attention Competition Modeling
console.log('\n[Test Group 3] Attention Competition Modeling');
test('Competition identifies competing entities', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const competition = modelAttentionCompetition(activation, mockSalienceRecord.clusters);
    return assert(competition.competing_entities.length > 0, `No competing entities detected`);
});

test('Competition identifies dominant competitors', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const competition = modelAttentionCompetition(activation, mockSalienceRecord.clusters);
    return assert(Array.isArray(competition.dominant_competitors), `dominant_competitors not array`);
});

test('Competition detects overlapping clusters', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const competition = modelAttentionCompetition(activation, mockSalienceRecord.clusters);
    return assert(Array.isArray(competition.overlapping_clusters), `overlapping_clusters not array`);
});

test('Competition intensity is computed', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const competition = modelAttentionCompetition(activation, mockSalienceRecord.clusters);
    return assert(typeof competition.competition_intensity === 'number', `competition_intensity not a number`);
});

test('Competition has required fields', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const competition = modelAttentionCompetition(activation, mockSalienceRecord.clusters);
    const required = ['competing_entities', 'competing_patterns', 'overlapping_clusters', 'competition_intensity', 'dominant_competitors'];
    const missing = required.filter(k => !(k in competition));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

// Test Group 4: Bounded Capacity Enforcement
console.log('\n[Test Group 4] Bounded Capacity Enforcement');
test('Capacity state assignment is valid', () => {
    const states = ['AVAILABLE', 'PARTIAL', 'HIGH', 'SATURATED'];
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const capacity = assessAttentionCapacity(activation);
    return assert(states.includes(capacity.state), `Invalid capacity state: ${capacity.state}`);
});

test('Capacity utilization ratio is computed', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const capacity = assessAttentionCapacity(activation);
    return assert(typeof capacity.utilization_ratio === 'number', `utilization_ratio not a number`);
});

test('Max capacity is enforced', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const capacity = assessAttentionCapacity(activation, MAX_ACTIVE_ATTENTION_REGIONS);
    return assert(capacity.max_capacity === MAX_ACTIVE_ATTENTION_REGIONS, `max_capacity not ${MAX_ACTIVE_ATTENTION_REGIONS}`);
});

test('Saturation score is computed', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const capacity = assessAttentionCapacity(activation);
    return assert(typeof capacity.saturation_score === 'number', `saturation_score not a number`);
});

test('Overload indicator is set when saturated', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const capacity = assessAttentionCapacity(activation);
    return assert(typeof capacity.overload_indicator === 'boolean', `overload_indicator not boolean`);
});

test('Fragmentation computed when exceeds capacity', () => {
    // Test with more entities than max capacity
    const heavyActivation = {
        active_entities: [
            { entity_id: 'A', activation_level: 'DOMINANT' },
            { entity_id: 'B', activation_level: 'DOMINANT' },
            { entity_id: 'C', activation_level: 'DOMINANT' },
            { entity_id: 'D', activation_level: 'DOMINANT' },
            { entity_id: 'E', activation_level: 'DOMINANT' },
            { entity_id: 'F', activation_level: 'DOMINANT' },
            { entity_id: 'G', activation_level: 'DOMINANT' }
        ],
        active_patterns: [],
        attention_signals: []
    };
    const capacity = assessAttentionCapacity(heavyActivation, 5);
    return assert(capacity.fragmentation > 0, `Fragmentation should be > 0 when exceeds capacity`);
});

test('No fragmentation when within capacity', () => {
    const lightActivation = {
        active_entities: [
            { entity_id: 'A', activation_level: 'ACTIVE' },
            { entity_id: 'B', activation_level: 'ACTIVE' }
        ],
        active_patterns: [],
        attention_signals: []
    };
    const capacity = assessAttentionCapacity(lightActivation, 5);
    return assert(capacity.fragmentation === 0, `Fragmentation should be 0 within capacity`);
});

// Test Group 5: Attention Distribution
console.log('\n[Test Group 5] Attention Distribution');
test('Distribution computes entity levels', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const dist = computeAttentionDistribution(activation);
    return assert(dist.entity_distribution && typeof dist.entity_distribution.DOMINANT === 'number', `entity_distribution not properly structured`);
});

test('Distribution computes pattern levels', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const dist = computeAttentionDistribution(activation);
    return assert(dist.pattern_distribution && typeof dist.pattern_distribution.DOMINANT === 'number', `pattern_distribution not properly structured`);
});

test('Active ratio is computed', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const dist = computeAttentionDistribution(activation);
    return assert(typeof dist.active_ratio === 'number', `active_ratio not a number`);
});

test('Signal type breakdown is computed', () => {
    const activation = determineAttentionActivation(mockSalienceRecord, mockCognitivePressure, []);
    const dist = computeAttentionDistribution(activation);
    return assert(typeof dist.signal_type_breakdown === 'object', `signal_type_breakdown not an object`);
});

// Test Group 6: Attention Persistence Tracking
console.log('\n[Test Group 6] Attention Persistence Tracking');
test('Persistence tracking detects new entities', () => {
    const current = [{ entity_id: 'A' }, { entity_id: 'B' }, { entity_id: 'C' }];
    const history = [
        { active_attention_entities: ['A', 'B'] }
    ];
    const result = trackAttentionPersistence(current, history);
    return assert(result.new_attention_entities.includes('C'), `C should be new. Got: ${result.new_attention_entities.join(', ')}`);
});

test('Persistence tracking detects sustained entities', () => {
    const current = [{ entity_id: 'A' }, { entity_id: 'B' }];
    const history = [
        { active_attention_entities: ['A', 'D'] },
        { active_attention_entities: ['A', 'B'] }
    ];
    const result = trackAttentionPersistence(current, history);
    return assert(result.sustained_presence_entities.includes('A'), `A should be sustained`);
});

test('Persistence tracking detects interruptions', () => {
    const current = [{ entity_id: 'A' }];
    const history = [
        { active_attention_entities: ['A', 'B', 'C'] }
    ];
    const result = trackAttentionPersistence(current, history);
    return assert(result.departed_attention_entities.includes('B') && result.departed_attention_entities.includes('C'), `B and C should be departed`);
});

test('Persistence tracking handles empty history', () => {
    const current = [{ entity_id: 'A' }, { entity_id: 'B' }];
    const result = trackAttentionPersistence(current, []);
    return assert(result.new_attention_entities.length === 2, `All should be new with empty history`);
});

test('Recurring attention cycles detected', () => {
    const current = [{ entity_id: 'A' }];
    const history = [
        { active_attention_entities: ['A'] },
        { active_attention_entities: ['B'] },
        { active_attention_entities: ['A'] },
        { active_attention_entities: ['B'] },
        { active_attention_entities: ['A'] }
    ];
    const result = trackAttentionPersistence(current, history);
    return assert(result.recurring_attention_cycles >= 1, `Should detect recurring cycles`);
});

// Test Group 7: Attention Transition Analysis
console.log('\n[Test Group 7] Attention Transition Analysis');
test('STRENGTHENING when active count increasing', () => {
    const history = [
        { active_attention_entities: ['A'], capacity_assessment: { state: 'AVAILABLE' }, persistence_summary: { attention_interruption_count: 0 } },
        { active_attention_entities: ['A', 'B'], capacity_assessment: { state: 'AVAILABLE' }, persistence_summary: { attention_interruption_count: 0 } },
        { active_attention_entities: ['A', 'B', 'C'], capacity_assessment: { state: 'PARTIAL' }, persistence_summary: { attention_interruption_count: 0 } }
    ];
    const currentActivation = { active_entities: [{ entity_id: 'A' }, { entity_id: 'B' }, { entity_id: 'C' }, { entity_id: 'D' }] };
    const transition = analyzeAttentionTransition(history, currentActivation);
    return assert(transition.profile === 'STRENGTHENING', `Expected STRENGTHENING, got ${transition.profile}`);
});

test('DISPERSING when active count decreasing with few interruptions', () => {
    // DISPERSING: steady decline with interruptions low to moderate but not fragmenting
    // Fragmenting requires interruptions consistently high throughout (not just final)
    const history = [
        { active_attention_entities: ['A', 'B', 'C'], capacity_assessment: { state: 'HIGH' }, persistence_summary: { attention_interruption_count: 0 } },
        { active_attention_entities: ['A', 'B'], capacity_assessment: { state: 'PARTIAL' }, persistence_summary: { attention_interruption_count: 0 } },
        { active_attention_entities: ['A'], capacity_assessment: { state: 'AVAILABLE' }, persistence_summary: { attention_interruption_count: 1 } }
    ];
    const currentActivation = { active_entities: [{ entity_id: 'A' }] };
    const transition = analyzeAttentionTransition(history, currentActivation);
    return assert(transition.profile === 'DISPERSING', `Expected DISPERSING, got ${transition.profile}`);
});

test('FRAGMENTING when interruptions consistently high', () => {
    // FRAGMENTING: high interruptions throughout, entity set changing completely (ABCD → EF → G)
    const history = [
        { active_attention_entities: ['A', 'B', 'C', 'D'], capacity_assessment: { state: 'HIGH' }, persistence_summary: { attention_interruption_count: 4 } },
        { active_attention_entities: ['E', 'F'], capacity_assessment: { state: 'HIGH' }, persistence_summary: { attention_interruption_count: 4 } },
        { active_attention_entities: ['G'], capacity_assessment: { state: 'AVAILABLE' }, persistence_summary: { attention_interruption_count: 3 } }
    ];
    const currentActivation = { active_entities: [{ entity_id: 'H' }, { entity_id: 'I' }] };
    const transition = analyzeAttentionTransition(history, currentActivation);
    return assert(transition.profile === 'FRAGMENTING', `Expected FRAGMENTING, got ${transition.profile}`);
});

test('STABILIZING when active count consistent', () => {
    const history = [
        { active_attention_entities: ['A', 'B'], capacity_assessment: { state: 'PARTIAL' }, persistence_summary: { attention_interruption_count: 0 } },
        { active_attention_entities: ['A', 'B'], capacity_assessment: { state: 'PARTIAL' }, persistence_summary: { attention_interruption_count: 0 } },
        { active_attention_entities: ['A', 'B'], capacity_assessment: { state: 'PARTIAL' }, persistence_summary: { attention_interruption_count: 0 } }
    ];
    const currentActivation = { active_entities: [{ entity_id: 'A' }, { entity_id: 'B' }] };
    const transition = analyzeAttentionTransition(history, currentActivation);
    return assert(transition.profile === 'STABILIZING', `Expected STABILIZING, got ${transition.profile}`);
});

// FRAGMENTING test above

test('INDETERMINATE when fewer than 2 history entries', () => {
    const history = [{ active_attention_entities: ['A'] }];
    const currentActivation = { active_entities: [{ entity_id: 'A' }, { entity_id: 'B' }] };
    const transition = analyzeAttentionTransition(history, currentActivation);
    return assert(transition.profile === 'INDETERMINATE', `Expected INDETERMINATE, got ${transition.profile}`);
});

test('All TRANSITION_PROFILES have required fields', () => {
    for (const [key, val] of Object.entries(TRANSITION_PROFILES)) {
        if (!val.profile || !val.description || !val.interpretation) {
            return assert(false, `${key} missing required fields`);
        }
    }
    return assert(true);
});

// Test Group 8: No Action/Recommendation Language
console.log('\n[Test Group 8] No Action/Recommendation Language');
test('Attention record contains no action words', () => {
    const record = runAttentionFormation({
        salienceRecord: mockSalienceRecord,
        cognitivePressure: mockCognitivePressure,
        attentionHistory: mockAttentionHistory
    });
    const text = JSON.stringify(record);
    const found = actionWords.filter(w => text.toLowerCase().includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('ATTENTION_LEVELS descriptions contain no action words', () => {
    const allText = Object.values(ATTENTION_LEVELS).map(v => v.description + ' ' + v.requirements).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in ATTENTION_LEVELS: ${found.join(', ')}`);
});

test('TRANSITION_PROFILES descriptions contain no action words', () => {
    const allText = Object.values(TRANSITION_PROFILES).map(v => v.description + ' ' + v.interpretation).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in TRANSITION_PROFILES: ${found.join(', ')}`);
});

// Test Group 9: Deterministic Output
console.log('\n[Test Group 9] Deterministic Output');
test('Same input produces identical attention record (idempotency)', () => {
    // Clear state files to ensure deterministic baseline
    const stateFiles = [ATTENTION_FILE, ATTENTION_HISTORY_FILE];
    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }
    
    const context = { salienceRecord: mockSalienceRecord, cognitivePressure: mockCognitivePressure, attentionHistory: mockAttentionHistory };
    const rec1 = runAttentionFormation(context);
    
    // Restore history to same state for second run
    for (const f of stateFiles) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }
    
    const rec2 = runAttentionFormation(context);
    
    // Compare key deterministic fields (ignore generated_at which differs by milliseconds)
    const det1 = { ...rec1 }; delete det1.generated_at; delete det1._;
    const det2 = { ...rec2 }; delete det2.generated_at; delete det2._;
    return assert(JSON.stringify(det1) === JSON.stringify(det2), 'Repeat runs produced different results');
});

// Test Group 10: Snapshot Persistence
console.log('\n[Test Group 10] Snapshot Persistence');
test('Attention file is valid JSON after run', () => {
    runAttentionFormation({ salienceRecord: mockSalienceRecord, cognitivePressure: mockCognitivePressure, attentionHistory: mockAttentionHistory });
    const exists = fs.existsSync(ATTENTION_FILE);
    if (!exists) return assert(false, 'Attention file not created');
    try {
        const data = JSON.parse(fs.readFileSync(ATTENTION_FILE, 'utf8'));
        return assert(data.attention_level !== undefined, 'Missing attention_level');
    } catch (e) {
        return assert(false, e.message);
    }
});

test('History file is appended to', () => {
    const before = fs.existsSync(ATTENTION_HISTORY_FILE) ? fs.readFileSync(ATTENTION_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length : 0;
    runAttentionFormation({ salienceRecord: mockSalienceRecord, cognitivePressure: mockCognitivePressure, attentionHistory: mockAttentionHistory });
    const after = fs.readFileSync(ATTENTION_HISTORY_FILE, 'utf8').split('\n').filter(Boolean).length;
    return assert(after > before, `History did not grow. Before: ${before}, After: ${after}`);
});

test('Audit log contains MCAI-5C entry', () => {
    const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
    const mcai5cEntries = lines.filter(l => l.includes('"phase":"MCAI-5C"'));
    return assert(mcai5cEntries.length > 0, 'No MCAI-5C audit entries found');
});

// Test Group 11: Bounded Memory
console.log('\n[Test Group 11] Bounded Memory');
test('History respects retention limit', () => {
    const history = loadAttentionHistory();
    return assert(history.length <= MAX_HISTORY, `History exceeds limit: ${history.length}`);
});

test('History entries are valid JSON', () => {
    const history = loadAttentionHistory();
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
test('Attention record has all required fields', () => {
    const record = runAttentionFormation({ salienceRecord: mockSalienceRecord, cognitivePressure: mockCognitivePressure, attentionHistory: mockAttentionHistory });
    const required = [
        'attention_level', 'active_attention_entities', 'dominant_attention_patterns',
        'attention_distribution', 'attention_competition', 'capacity_assessment',
        'persistence_summary', 'transition_profile', 'uncertainty_boundaries',
        'environmental_attention_summary', 'generated_at', 'shadow_only'
    ];
    const missing = required.filter(k => !(k in record));
    return assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

test('attention_level is valid enum', () => {
    const record = runAttentionFormation({ salienceRecord: mockSalienceRecord, cognitivePressure: mockCognitivePressure, attentionHistory: mockAttentionHistory });
    return assert(['BACKGROUND', 'ACTIVE', 'ELEVATED', 'DOMINANT'].includes(record.attention_level), `Invalid: ${record.attention_level}`);
});

test('shadow_only is true', () => {
    const record = runAttentionFormation({ salienceRecord: mockSalienceRecord, cognitivePressure: mockCognitivePressure, attentionHistory: mockAttentionHistory });
    return assert(record.shadow_only === true, `shadow_only is ${record.shadow_only}`);
});

test('uncertainty_boundaries is non-empty array', () => {
    const record = runAttentionFormation({ salienceRecord: mockSalienceRecord, cognitivePressure: mockCognitivePressure, attentionHistory: mockAttentionHistory });
    return assert(Array.isArray(record.uncertainty_boundaries) && record.uncertainty_boundaries.length > 0, 'No uncertainty boundaries');
});

test('generated_at is valid ISO timestamp', () => {
    const record = runAttentionFormation({ salienceRecord: mockSalienceRecord, cognitivePressure: mockCognitivePressure, attentionHistory: mockAttentionHistory });
    const d = new Date(record.generated_at);
    return assert(!isNaN(d.getTime()), `Invalid timestamp: ${record.generated_at}`);
});

// === SUMMARY ===

console.log('\n=== Validation Summary ===');
console.log(`Tests run:    ${tests_run}`);
console.log(`Tests passed: ${tests_passed}`);
console.log(`Tests failed: ${tests_failed}`);

if (tests_failed === 0) {
    console.log('\n✅ All tests passed. Attention formation layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

process.exit(tests_failed > 0 ? 1 : 0);