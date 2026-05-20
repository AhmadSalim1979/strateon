/**
 * Executive Cognitive Transition Validator — MCAI Phase 7C
 * Validates deterministic outputs, transition classification, fragmentation detection.
 */

const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');

const {
    computeCognitiveTransition,
    saveTransitionState,
    TRANSITION_STATES,
    DRIFT_PROFILES
} = require('./executive-cognitive-transition.js');

// === TEST DATA ===

const TEST_CASES = {
    static_state: {
        name: 'STATIC — No significant transitions, high regime stability',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.85 },
        transitionHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        consolidationHistory: [],
        expected_state: 'STATIC'
    },
    
    transitioning_state: {
        name: 'TRANSITIONING — Active regime shift in progress',
        executiveState: { dominant_region: 'DEVELOPER_PRODUCTIVITY', focus_strength: 0.55 },
        transitionHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'QUALITY_GUARANTEE' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        consolidationHistory: [],
        expected_state: 'TRANSITIONING'
    },
    
    stabilizing_state: {
        name: 'STABILIZING — Transition settling, new regime consolidating',
        executiveState: { dominant_region: 'DEVELOPER_PRODUCTIVITY', focus_strength: 0.72 },
        transitionHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        consolidationHistory: [
            { consolidation_strength: 0.55 }, { consolidation_strength: 0.58 },
            { consolidation_strength: 0.62 }, { consolidation_strength: 0.65 }
        ],
        expected_state: 'REGIME_SHIFT'
    },
    
    regime_shift: {
        name: 'REGIME_SHIFT — Prior regime displaced, new regime dominant',
        executiveState: { dominant_region: 'DEVELOPER_PRODUCTIVITY', focus_strength: 0.88 },
        transitionHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        contextHistory: [
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        consolidationHistory: [
            { consolidation_strength: 0.6 }, { consolidation_strength: 0.65 },
            { consolidation_strength: 0.7 }, { consolidation_strength: 0.75 }
        ],
        expected_state: 'REGIME_SHIFT'
    },
    
    oscillatory_transition: {
        name: 'FRAGMENTATION — Oscillatory transition detected',
        executiveState: { dominant_region: 'QUALITY_GUARANTEE', focus_strength: 0.5 },
        transitionHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'QUALITY_GUARANTEE' }
        ],
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'QUALITY_GUARANTEE' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'QUALITY_GUARANTEE' }
        ],
        consolidationHistory: [],
        expected_fragmentation_type: 'OSCILLATORY_TRANSITION'
    },
    
    prior_structure_loss: {
        name: 'FRAGMENTATION — Prior structure loss during transition',
        executiveState: { dominant_region: 'QUALITY_GUARANTEE', focus_strength: 0.45 },
        transitionHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'QUALITY_GUARANTEE' }
        ],
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'QUALITY_GUARANTEE' },
            { context_region: 'QUALITY_GUARANTEE' },
            { context_region: 'QUALITY_GUARANTEE' },
            { context_region: 'QUALITY_GUARANTEE' }
        ],
        consolidationHistory: [],
        expected_fragmentation_type: 'PRIOR_STRUCTURE_LOSS'
    },
    
    drift_stabilizing: {
        name: 'DRIFT — Transition stability strengthening',
        executiveState: { dominant_region: 'DEVELOPER_PRODUCTIVITY', focus_strength: 0.78 },
        transitionHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        consolidationHistory: [
            { consolidation_strength: 0.4 }, { consolidation_strength: 0.48 },
            { consolidation_strength: 0.55 }, { consolidation_strength: 0.62 },
            { consolidation_strength: 0.68 }, { consolidation_strength: 0.75 }
        ],
        expected_drift: 'STABILIZING'
    },
    
    no_recommendation_language: {
        name: 'CONSTRAINT — No recommendation/action language in output',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.8 },
        transitionHistory: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        consolidationHistory: [
            { consolidation_strength: 0.65 }, { consolidation_strength: 0.68 },
            { consolidation_strength: 0.72 }, { consolidation_strength: 0.75 }
        ],
        expected_no_forbidden: true
    }
};

// === VALIDATORS ===

function validateDeterministic(testCase) {
    const result1 = computeCognitiveTransition(
        testCase.executiveState,
        testCase.transitionHistory,
        testCase.contextHistory,
        testCase.consolidationHistory
    );
    const result2 = computeCognitiveTransition(
        testCase.executiveState,
        testCase.transitionHistory,
        testCase.contextHistory,
        testCase.consolidationHistory
    );
    
    const { generated_at: t1, ...rest1 } = result1;
    const { generated_at: t2, ...rest2 } = result2;
    
    if (JSON.stringify(rest1) !== JSON.stringify(rest2)) {
        return { pass: false, reason: 'Non-deterministic output' };
    }
    return { pass: true, reason: 'Deterministic output confirmed' };
}

function validateTransitionClassification(testCase) {
    const result = computeCognitiveTransition(
        testCase.executiveState,
        testCase.transitionHistory,
        testCase.contextHistory,
        testCase.consolidationHistory
    );
    
    if (testCase.expected_state && result.transition_state !== testCase.expected_state) {
        return {
            pass: false,
            reason: `State mismatch: expected ${testCase.expected_state}, got ${result.transition_state}`,
            expected: testCase.expected_state,
            actual: result.transition_state
        };
    }
    return { pass: true, reason: 'Transition classification correct' };
}

function validateFragmentationDetection(testCase) {
    const result = computeCognitiveTransition(
        testCase.executiveState,
        testCase.transitionHistory,
        testCase.contextHistory,
        testCase.consolidationHistory
    );
    
    if (testCase.expected_fragmentation_type) {
        const found = result.transition_fragmentation.find(f => f.type === testCase.expected_fragmentation_type);
        if (!found) {
            return {
                pass: false,
                reason: `Expected fragmentation ${testCase.expected_fragmentation_type} not found`,
                found: result.transition_fragmentation.map(f => f.type)
            };
        }
    }
    return { pass: true, reason: 'Fragmentation detection correct' };
}

function validateDriftDetection(testCase) {
    const result = computeCognitiveTransition(
        testCase.executiveState,
        testCase.transitionHistory,
        testCase.contextHistory,
        testCase.consolidationHistory
    );
    
    if (testCase.expected_drift && result.transition_drift_profile.profile !== testCase.expected_drift) {
        return {
            pass: false,
            reason: `Drift mismatch: expected ${testCase.expected_drift}, got ${result.transition_drift_profile.profile}`
        };
    }
    return { pass: true, reason: 'Drift detection correct' };
}

function validateNoRecommendationLanguage(testCase) {
    const result = computeCognitiveTransition(
        testCase.executiveState,
        testCase.transitionHistory,
        testCase.contextHistory,
        testCase.consolidationHistory
    );
    
    const resultStr = JSON.stringify(result).toLowerCase();
    const forbidden = ['recommend', 'suggest', 'propose', 'should', 'must', 'prioritize', 'execute', 'decide', 'choose', 'act'];
    const found = forbidden.filter(w => {
        const regex = new RegExp(`\\b${w}\\b`, 'i');
        return regex.test(resultStr);
    });
    
    if (found.length > 0) {
        return { pass: false, reason: `Forbidden language: ${found.join(', ')}`, found };
    }
    return { pass: true, reason: 'No recommendation language found' };
}

function validateSchemaCompliance(result) {
    const required = [
        'transition_state', 'transition_strength', 'stable_regime_regions',
        'oscillatory_regime_regions', 'transition_fragmentation',
        'survivability_regions', 'transition_stability_assessment',
        'transition_drift_profile', 'uncertainty_boundaries',
        'environmental_transition_summary', 'generated_at', 'shadow_only'
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
    console.log('=== MCAI Phase 7C — Executive Cognitive Transition Validation ===\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const [key, testCase] of Object.entries(TEST_CASES)) {
        console.log(`Test: ${testCase.name}`);
        
        const validators = [
            { name: 'Deterministic Output', fn: () => validateDeterministic(testCase) },
            { name: 'Transition Classification', fn: () => validateTransitionClassification(testCase) },
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
        const computed = computeCognitiveTransition(
            testCase.executiveState,
            testCase.transitionHistory,
            testCase.contextHistory,
            testCase.consolidationHistory
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