/**
 * Executive Cognitive Continuity Validator — MCAI Phase 7A
 * Validates deterministic outputs, continuity classification, survivability modeling.
 */

const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');

const {
    computeCognitiveContinuity,
    saveContinuityState,
    CONTINUITY_STATES,
    DRIFT_PROFILES
} = require('./executive-cognitive-continuity.js');

// === TEST DATA ===

const TEST_CASES = {
    fragmented_state: {
        name: 'FRAGMENTED — High fragmentation, no stable region persists',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.45 },
        longHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        mediumHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        shortHistory: [
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        continuityHistory: [],
        expected_state: 'FRAGMENTED'
    },
    
    transitional_state: {
        name: 'TRANSITIONAL — Moderate persistence, developing continuity',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.55 },
        // 7 INFRA, 3 CRITICAL = 10 entries, 3 switches, max count 7/10 = 0.7
        // fragmentation = (2-1)/(10-1) = 0.111, osc = 3/9 = 0.333
        // carryover: last 5 = [INFRA, INFRA, INFRA, CRITICAL, INFRA] = 4/5 = 0.8
        // continuity = 0.7*0.35 + 0.8*0.25 + recovery*0.25 + 0.889*0.15
        // recovery: 3 interruptions, check if displaced region reappears within 3 steps
        longHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' }
        ],
        mediumHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' }
        ],
        shortHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        continuityHistory: [],
        expected_state: 'TRANSITIONAL'
    },
    
    continuous_state: {
        name: 'CONTINUOUS — Strong persistence, established continuity',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.72 },
        // 8 INFRA, 2 CRITICAL = 10 entries, 2 switches, max count 8/10 = 0.8
        // fragmentation = (2-1)/(10-1) = 0.111, osc = 2/9 = 0.222
        // carryover: last 5 = [INFRA, INFRA, INFRA, INFRA, CRITICAL] = 4/5 = 0.8
        // recovery: 2 interruptions, both reappear
        longHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' }
        ],
        mediumHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        shortHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' }
        ],
        continuityHistory: [],
        expected_state: 'CONTINUOUS'
    },
    
    entrenched_continuity: {
        name: 'ENTRENCHED_CONTINUITY — Deep continuity, interruption-resistant, 15+ history entries',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.88 },
        // 12 INFRA, 3 CRITICAL = 15 entries, 3 switches, max count 12/15 = 0.8
        // fragmentation = (2-1)/(15-1) = 0.071, osc = 3/14 = 0.214
        // carryover: last 5 = all INFRA = 5/5 = 1.0
        // recovery: all 3 interruptions recover
        longHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        mediumHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        shortHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        continuityHistory: [],
        expected_state: 'ENTRENCHED_CONTINUITY'
    },
    
    continuity_break: {
        name: 'FRAGMENTATION — Continuity break detected',
        executiveState: { dominant_region: 'DEVELOPER_PRODUCTIVITY', focus_strength: 0.4 },
        // Long history: INFRA dominates, short history: DEV dominates (break)
        longHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        mediumHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        shortHistory: [
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        continuityHistory: [],
        expected_fragmentation_type: 'CONTINUITY_BREAK'
    },
    
    drift_stabilizing: {
        name: 'DRIFT — Continuity strengthening over time',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.78 },
        longHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        mediumHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        shortHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        continuityHistory: [
            { continuity_strength: 0.4 }, { continuity_strength: 0.48 }, { continuity_strength: 0.55 },
            { continuity_strength: 0.62 }, { continuity_strength: 0.68 }, { continuity_strength: 0.75 },
            { continuity_strength: 0.78 }, { continuity_strength: 0.82 }
        ],
        expected_drift: 'STABILIZING'
    },
    
    no_recommendation_language: {
        name: 'CONSTRAINT — No recommendation/action language in output',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.8 },
        longHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        mediumHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        shortHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        continuityHistory: [],
        expected_no_forbidden: true
    }
};

// === VALIDATORS ===

function validateDeterministic(testCase) {
    const result1 = computeCognitiveContinuity(
        testCase.executiveState,
        testCase.longHistory,
        testCase.mediumHistory,
        testCase.shortHistory,
        testCase.continuityHistory || []
    );
    const result2 = computeCognitiveContinuity(
        testCase.executiveState,
        testCase.longHistory,
        testCase.mediumHistory,
        testCase.shortHistory,
        testCase.continuityHistory || []
    );
    
    const { generated_at: t1, ...rest1 } = result1;
    const { generated_at: t2, ...rest2 } = result2;
    
    if (JSON.stringify(rest1) !== JSON.stringify(rest2)) {
        return { pass: false, reason: 'Non-deterministic output' };
    }
    return { pass: true, reason: 'Deterministic output confirmed' };
}

function validateContinuityClassification(testCase) {
    const result = computeCognitiveContinuity(
        testCase.executiveState,
        testCase.longHistory,
        testCase.mediumHistory,
        testCase.shortHistory,
        testCase.continuityHistory || []
    );
    
    if (testCase.expected_state && result.continuity_state !== testCase.expected_state) {
        return {
            pass: false,
            reason: `State mismatch: expected ${testCase.expected_state}, got ${result.continuity_state}`,
            expected: testCase.expected_state,
            actual: result.continuity_state
        };
    }
    return { pass: true, reason: 'Continuity classification correct' };
}

function validateFragmentationDetection(testCase) {
    const result = computeCognitiveContinuity(
        testCase.executiveState,
        testCase.longHistory,
        testCase.mediumHistory,
        testCase.shortHistory,
        testCase.continuityHistory || []
    );
    
    if (testCase.expected_fragmentation_type) {
        const found = result.continuity_fragmentation.find(f => f.type === testCase.expected_fragmentation_type);
        if (!found) {
            return {
                pass: false,
                reason: `Expected fragmentation ${testCase.expected_fragmentation_type} not found`,
                found: result.continuity_fragmentation.map(f => f.type)
            };
        }
    }
    return { pass: true, reason: 'Fragmentation detection correct' };
}

function validateDriftDetection(testCase) {
    const result = computeCognitiveContinuity(
        testCase.executiveState,
        testCase.longHistory,
        testCase.mediumHistory,
        testCase.shortHistory,
        testCase.continuityHistory || []
    );
    
    if (testCase.expected_drift && result.continuity_drift_profile.profile !== testCase.expected_drift) {
        return {
            pass: false,
            reason: `Drift mismatch: expected ${testCase.expected_drift}, got ${result.continuity_drift_profile.profile}`
        };
    }
    return { pass: true, reason: 'Drift detection correct' };
}

function validateNoRecommendationLanguage(testCase) {
    const result = computeCognitiveContinuity(
        testCase.executiveState,
        testCase.longHistory,
        testCase.mediumHistory,
        testCase.shortHistory,
        testCase.continuityHistory || []
    );
    
    const resultStr = JSON.stringify(result).toLowerCase();
    const forbidden = ['recommend', 'suggest', 'propose', 'should', 'must', 'prioritize', 'execute', 'decide', 'choose', 'act'];
    const found = forbidden.filter(w => resultStr.includes(w));
    
    if (found.length > 0) {
        return { pass: false, reason: `Forbidden language: ${found.join(', ')}`, found };
    }
    return { pass: true, reason: 'No recommendation language found' };
}

function validateSchemaCompliance(result) {
    const required = [
        'continuity_state', 'continuity_strength', 'stable_continuity_regions',
        'fragmented_continuity_regions', 'continuity_fragmentation',
        'survivability_regions', 'continuity_stability_assessment',
        'continuity_drift_profile', 'uncertainty_boundaries',
        'environmental_continuity_summary', 'generated_at', 'shadow_only'
    ];
    
    for (const field of required) {
        if (result[field] === undefined) {
            return { pass: false, reason: `Missing required field: ${field}` };
        }
    }
    
    if (result.shadow_only !== true) {
        return { pass: false, reason: 'shadow_only must be true' };
    }
    
    return { pass: true, reason: 'Schema compliance confirmed' };
}

// === RUN VALIDATION ===

function runValidation() {
    console.log('=== MCAI Phase 7A — Executive Cognitive Continuity Validation ===\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const [key, testCase] of Object.entries(TEST_CASES)) {
        console.log(`Test: ${testCase.name}`);
        
        const validators = [
            { name: 'Deterministic Output', fn: () => validateDeterministic(testCase) },
            { name: 'Continuity Classification', fn: () => validateContinuityClassification(testCase) },
            { name: 'Fragmentation Detection', fn: () => validateFragmentationDetection(testCase) },
            { name: 'Drift Detection', fn: () => validateDriftDetection(testCase) },
            { name: 'No Recommendation Language', fn: () => validateNoRecommendationLanguage(testCase) }
        ];
        
        for (const validator of validators) {
            const result = validator.fn();
            const status = result.pass ? '✅' : '❌';
            console.log(`  ${status} ${validator.name}: ${result.reason}`);
            if (result.pass) passed++; else failed++;
        }
        
        // Schema check
        const computed = computeCognitiveContinuity(
            testCase.executiveState,
            testCase.longHistory,
            testCase.mediumHistory,
            testCase.shortHistory,
            testCase.continuityHistory || []
        );
        const schemaResult = validateSchemaCompliance(computed);
        const schemaStatus = schemaResult.pass ? '✅' : '❌';
        console.log(`  ${schemaStatus} Schema Compliance: ${schemaResult.reason}`);
        if (schemaResult.pass) passed++; else failed++;
        
        console.log('');
    }
    
    console.log('=== SUMMARY ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);
    
    if (failed === 0) {
        console.log('\n✅ ALL VALIDATIONS PASSED');
        process.exit(0);
    } else {
        console.log('\n❌ VALIDATION FAILURES DETECTED');
        process.exit(1);
    }
}

if (require.main === module) {
    runValidation();
}

module.exports = { runValidation, validateSchemaCompliance };