/**
 * Priority Explanation Validator — MCAI Phase 4B
 * Validates explanation generation for priority perception records.
 * 
 * Tests:
 * 1. Category explanations are correct and human-readable
 * 2. Score breakdown explanations are correct
 * 3. Drift explanations are correct
 * 4. Uncertainty language appears when evidence is insufficient
 * 5. No recommendations generated
 * 6. No action language generated
 * 7. Audit events appended
 * 8. Deterministic output for same input
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const {
    explainPerception,
    explainScoreComponent,
    explainPerceptions,
    logExplanation,
    generateNarrative,
    CATEGORY_EXPLANATIONS,
    DRIFT_EXPLANATIONS
} = require('./priority-explanation.js');

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

// === TEST DATA ===

const mockPerception = {
    entity_id: 'worker-alpha',
    category: 'DEGRADED',
    score: 0.525,
    score_breakdown: {
        recurrence_frequency: 0.5,
        instability_persistence: 0.7,
        contradiction_density: 0.4,
        stale_evidence_accumulation: 0.3,
        verification_failure_recurrence: 0.6
    },
    drift: { pattern: 'STABLE_TREND', trend: 'stable', delta: 0 },
    observation_counts: {
        occurrences: 10,
        contradictions: 4,
        status_flips: 2,
        commitment_expirations: 0,
        verification_failures: 6,
        degraded_periods: 3,
        unstable_state_changes: 7
    },
    window: '24h',
    surveyed_at: new Date().toISOString()
};

const mockPerceptionVolatile = {
    entity_id: 'gateway-beta',
    category: 'VOLATILE',
    score: 0.785,
    score_breakdown: {
        recurrence_frequency: 0.85,
        instability_persistence: 0.9,
        contradiction_density: 0.7,
        stale_evidence_accumulation: 0.8,
        verification_failure_recurrence: 0.9
    },
    drift: { pattern: 'ESCALATING_INSTABILITY', trend: 'up', delta: 0.18 },
    observation_counts: {
        occurrences: 20,
        contradictions: 14,
        status_flips: 8,
        commitment_expirations: 1,
        verification_failures: 18,
        degraded_periods: 12,
        unstable_state_changes: 18
    },
    window: '24h',
    surveyed_at: new Date().toISOString()
};

const mockPerceptionInsufficient = {
    entity_id: 'service-new',
    category: 'WATCH',
    score: 0.25,
    score_breakdown: {
        recurrence_frequency: 0.15,
        instability_persistence: 0.2,
        contradiction_density: 0.1,
        stale_evidence_accumulation: 0.0,
        verification_failure_recurrence: 0.0
    },
    drift: { pattern: 'INSUFFICIENT_DATA', trend: null, delta: 0 },
    observation_counts: {
        occurrences: 2,
        contradictions: 0,
        status_flips: 0,
        commitment_expirations: 0,
        verification_failures: 0,
        degraded_periods: 0,
        unstable_state_changes: 0
    },
    window: '1h',
    surveyed_at: new Date().toISOString()
};

// === TESTS ===

console.log('\n=== MCAI Phase 4B — Priority Explanation Validator ===\n');

// Test Group 1: Category explanations
console.log('[Test Group 1] Category Explanations');
test('STABLE explanation has summary, description, interpretation, uncertainty', () => {
    const e = CATEGORY_EXPLANATIONS.STABLE;
    return assert(
        e.summary && e.description && e.interpretation && e.uncertainty_note,
        'STABLE missing required fields'
    );
});

test('DEGRADED explanation has all required fields', () => {
    const e = CATEGORY_EXPLANATIONS.DEGRADED;
    return assert(
        e.summary && e.description && e.interpretation && e.uncertainty_note,
        'DEGRADED missing required fields'
    );
});

test('VOLATILE explanation references instability, not action', () => {
    const e = CATEGORY_EXPLANATIONS.VOLATILE;
    return assert(
        e.summary.includes('instability') && !e.summary.includes('should') && !e.summary.includes('must'),
        'VOLATILE explanation contains action language'
    );
});

test('CRITICAL_PATTERN explanation references thresholds, not response', () => {
    const e = CATEGORY_EXPLANATIONS.CRITICAL_PATTERN;
    return assert(
        e.summary.includes('critical') && !e.summary.includes('respond') && !e.summary.includes('fix'),
        'CRITICAL_PATTERN contains response language'
    );
});

// Test Group 2: Drift explanations
console.log('\n[Test Group 2] Drift Explanations');
test('INSUFFICIENT_DATA explanation acknowledges data limitation', () => {
    const e = DRIFT_EXPLANATIONS.INSUFFICIENT_DATA;
    return assert(
        e.summary.includes('Insufficient') && e.uncertainty_note.includes('not a stability statement'),
        'INSUFFICIENT_DATA does not acknowledge data limitation'
    );
});

test('ESCALATING_INSTABILITY explanation describes upward trend without action', () => {
    const e = DRIFT_EXPLANATIONS.ESCALATING_INSTABILITY;
    return assert(
        e.summary.includes('increasing') && !e.summary.includes('should') && !e.summary.includes('escalate'),
        'ESCALATING contains action language'
    );
});

test('RECOVERING_STABILITY explanation describes downward trend without prescription', () => {
    const e = DRIFT_EXPLANATIONS.RECOVERING_STABILITY;
    return assert(
        e.summary.includes('decreasing') && !e.summary.includes('should continue'),
        'RECOVERING contains prescription language'
    );
});

test('OSCILLATING explanation describes cycle without predicting', () => {
    const e = DRIFT_EXPLANATIONS.OSCILLATING;
    return assert(
        e.summary.includes('cycle') && !e.summary.includes('will continue'),
        'OSCILLATING contains prediction language'
    );
});

// Test Group 3: Explanation object structure
console.log('\n[Test Group 3] Explanation Object Structure');
test('explainPerception returns required fields', () => {
    const exp = explainPerception(mockPerception);
    const required = ['entity_id', 'category', 'score', 'explanation', 'contributing_factors', 'limiting_uncertainties', 'evidence_refs', 'generated_at', 'shadow_only'];
    const hasAll = required.every(k => k in exp);
    return assert(hasAll, `Missing: ${required.filter(k => !(k in exp)).join(', ')}`);
});

test('explanation field is non-empty string', () => {
    const exp = explainPerception(mockPerception);
    return assert(typeof exp.explanation === 'string' && exp.explanation.length > 20, 'explanation too short');
});

test('contributing_factors is array', () => {
    const exp = explainPerception(mockPerception);
    return assert(Array.isArray(exp.contributing_factors), 'contributing_factors not an array');
});

test('contributing_factors are sorted by component value', () => {
    const exp = explainPerception(mockPerception);
    const values = exp.contributing_factors.map(f => {
        const breakdown = mockPerception.score_breakdown;
        const key = f.factor.replace(/ /g, '_');
        return breakdown[key] || 0;
    });
    const sorted = [...values].sort((a, b) => b - a);
    return assert(JSON.stringify(values) === JSON.stringify(sorted), `Not sorted. Got: ${JSON.stringify(values)}`);
});

test('limiting_uncertainties is array', () => {
    const exp = explainPerception(mockPerception);
    return assert(Array.isArray(exp.limiting_uncertainties), 'limiting_uncertainties not an array');
});

test('evidence_refs is array', () => {
    const exp = explainPerception(mockPerception);
    return assert(Array.isArray(exp.evidence_refs), 'evidence_refs not an array');
});

test('shadow_only field is true', () => {
    const exp = explainPerception(mockPerception);
    return assert(exp.shadow_only === true, `shadow_only is ${exp.shadow_only}`);
});

test('generated_at is valid ISO timestamp', () => {
    const exp = explainPerception(mockPerception);
    const d = new Date(exp.generated_at);
    return assert(!isNaN(d.getTime()), `Invalid timestamp: ${exp.generated_at}`);
});

// Test Group 4: Uncertainty language
console.log('\n[Test Group 4] Uncertainty Language');
test('INSUFFICIENT_DATA perception triggers uncertainty note', () => {
    const exp = explainPerception(mockPerceptionInsufficient);
    const hasUncertainty = exp.limiting_uncertainties.some(u => 
        u.factor.includes('observation history') || u.factor.includes('Limited')
    );
    return assert(hasUncertainty, 'INSUFFICIENT_DATA should trigger uncertainty note');
});

test('Short window with few observations triggers uncertainty', () => {
    const exp = explainPerception(mockPerceptionInsufficient);
    const hasUncertainty = exp.limiting_uncertainties.some(u => 
        u.factor.includes('Short observation window')
    );
    return assert(hasUncertainty, 'Short window + few observations should trigger uncertainty');
});

test('Score near boundary triggers uncertainty', () => {
    const boundaryScore = { ...mockPerception, score: 0.40, score_breakdown: { recurrence_frequency: 0.4, instability_persistence: 0.4, contradiction_density: 0.4, stale_evidence_accumulation: 0.4, verification_failure_recurrence: 0.4 } };
    const exp = explainPerception(boundaryScore);
    const hasUncertainty = exp.limiting_uncertainties.some(u =>
        u.factor.includes('boundary')
    );
    return assert(hasUncertainty, 'Score near boundary should trigger uncertainty');
});

// Test Group 5: No action/recommendation language
console.log('\n[Test Group 5] No Action/Recommendation Language');
const actionWords = ['should', 'must', 'recommend', 'action', 'remediate', 'fix', 'respond', 'escalate', 'deploy', 'restart', 'kill', 'remove', 'enable', 'disable'];

test('Explanation contains no action words for DEGRADED entity', () => {
    const exp = explainPerception(mockPerception);
    const found = actionWords.filter(w => exp.explanation.includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('Explanation contains no action words for VOLATILE entity', () => {
    const exp = explainPerception(mockPerceptionVolatile);
    const found = actionWords.filter(w => exp.explanation.includes(w));
    return assert(found.length === 0, `Found action words: ${found.join(', ')}`);
});

test('Contributing factors contain no action words', () => {
    const exp = explainPerception(mockPerception);
    const allText = exp.contributing_factors.map(f => f.detail).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in factors: ${found.join(', ')}`);
});

test('Limiting uncertainties contain no action words', () => {
    const exp = explainPerception(mockPerception);
    const allText = exp.limiting_uncertainties.map(u => u.impact).join(' ');
    const found = actionWords.filter(w => allText.includes(w));
    return assert(found.length === 0, `Found action words in uncertainties: ${found.join(', ')}`);
});

test('All category explanations contain no action words', () => {
    const allExplanations = Object.values(CATEGORY_EXPLANATIONS).map(e => e.summary + ' ' + e.description);
    const found = actionWords.filter(w => allExplanations.some(t => t.includes(w)));
    return assert(found.length === 0, `Found action words in categories: ${found.join(', ')}`);
});

test('All drift explanations contain no action words', () => {
    const allExplanations = Object.values(DRIFT_EXPLANATIONS).map(e => e.summary + ' ' + e.description);
    const found = actionWords.filter(w => allExplanations.some(t => t.includes(w)));
    return assert(found.length === 0, `Found action words in drifts: ${found.join(', ')}`);
});

// Test Group 6: Deterministic output
console.log('\n[Test Group 6] Deterministic Output');
test('Same perception produces same explanation (idempotency)', () => {
    const exp1 = explainPerception(mockPerception);
    const exp2 = explainPerception(mockPerception);
    return assert(JSON.stringify(exp1) === JSON.stringify(exp2), 'Explanations differ for same input');
});

test('Same perception produces same explanation (run 2)', () => {
    const exp1 = explainPerception(mockPerceptionVolatile);
    const exp2 = explainPerception(mockPerceptionVolatile);
    return assert(JSON.stringify(exp1) === JSON.stringify(exp2), 'Explanations differ for volatile entity');
});

test('explainPerceptions batch produces correct count', () => {
    const perceptions = [mockPerception, mockPerceptionVolatile, mockPerceptionInsufficient];
    const explanations = explainPerceptions(perceptions);
    return assert(explanations.length === 3, `Expected 3, got ${explanations.length}`);
});

test('Batch explanations match individual explanations', () => {
    const perceptions = [mockPerception, mockPerceptionInsufficient];
    const batchResults = explainPerceptions(perceptions);
    const individualResults = perceptions.map(p => explainPerception(p));
    for (let i = 0; i < perceptions.length; i++) {
        if (JSON.stringify(batchResults[i]) !== JSON.stringify(individualResults[i])) {
            return { pass: false, message: `Batch differs from individual at index ${i}` };
        }
    }
    return { pass: true };
});

// Test Group 7: Audit logging
console.log('\n[Test Group 7] Audit Logging');
const auditBefore = fs.existsSync(AUDIT_LOG) ? fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean).length : 0;
test('logExplanation appends to audit log', () => {
    const exp = explainPerception(mockPerception);
    logExplanation(exp);
    const after = fs.existsSync(AUDIT_LOG) ? fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean).length : 0;
    return assert(after > auditBefore, `Audit log did not grow. Before: ${auditBefore}, After: ${after}`);
});

test('Audit entry contains phase MCAI-4B', () => {
    const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
    const lastEntry = lines[lines.length - 1];
    const entry = JSON.parse(lastEntry);
    return assert(entry.phase === 'MCAI-4B', `Phase is ${entry.phase}`);
});

// Test Group 8: Score component explanations
console.log('\n[Test Group 8] Score Component Explanations');
test('High recurrence_frequency explains high frequency', () => {
    const comp = explainScoreComponent('recurrence_frequency', 0.85);
    return assert(comp.explanation.includes('85%'), `Expected 85% in explanation: ${comp.explanation}`);
});

test('Medium instability_persistence explains moderate unstable states', () => {
    const comp = explainScoreComponent('instability_persistence', 0.5);
    return assert(comp.explanation.includes('50%'), `Expected 50% in explanation: ${comp.explanation}`);
});

test('Zero stale_evidence_accumulation explains no stale verifications', () => {
    const comp = explainScoreComponent('stale_evidence_accumulation', 0.0);
    return assert(comp.explanation.includes('0%'), `Expected 0% in explanation: ${comp.explanation}`);
});

test('Component explanation has value and percentage fields', () => {
    const comp = explainScoreComponent('verification_failure_recurrence', 0.75);
    return assert(typeof comp.value === 'number' && typeof comp.percentage === 'number', 'Missing value or percentage');
});

// Test Group 9: Narrative generation
console.log('\n[Test Group 9] Narrative Generation');
test('generateNarrative returns non-empty string', () => {
    const narrative = generateNarrative([mockPerception, mockPerceptionVolatile]);
    return assert(typeof narrative === 'string' && narrative.length > 50, 'Narrative too short');
});

test('generateNarrative contains entity count', () => {
    const narrative = generateNarrative([mockPerception]);
    return assert(narrative.includes('2') && narrative.includes('entity'), 'Missing entity count');
});

test('generateNarrative contains category distribution', () => {
    const narrative = generateNarrative([mockPerception, mockPerceptionInsufficient]);
    return assert(narrative.includes('DEGRADED') && narrative.includes('WATCH'), 'Missing category distribution');
});

test('generateNarrative does not contain action words', () => {
    const narrative = generateNarrative([mockPerception, mockPerceptionVolatile]);
    const found = actionWords.filter(w => narrative.includes(w));
    return assert(found.length === 0, `Found action words in narrative: ${found.join(', ')}`);
});

// === SUMMARY ===

console.log('\n=== Validation Summary ===');
console.log(`Tests run:    ${tests_run}`);
console.log(`Tests passed: ${tests_passed}`);
console.log(`Tests failed: ${tests_failed}`);

if (tests_failed === 0) {
    console.log('\n✅ All tests passed. Priority explanation layer validation complete.');
} else {
    console.log(`\n❌ ${tests_failed} test(s) failed. Review output above.`);
}

process.exit(tests_failed > 0 ? 1 : 0);