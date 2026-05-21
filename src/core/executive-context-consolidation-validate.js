/**
 * Executive Context Consolidation Validator — MCAI Phase 7B
 * Validates deterministic outputs, context classification, fragmentation detection.
 */

const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');

const {
    computeContextConsolidation,
    saveContextState,
    CONTEXT_STATES,
    DRIFT_PROFILES
} = require('./executive-context-consolidation.js');

// === TEST DATA ===

const TEST_CASES = {
    diffuse_state: {
        name: 'DIFFUSE — Low consolidation, high fragmentation',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.45 },
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
        consolidationHistory: [
            { consolidation_strength: 0.18 }, { consolidation_strength: 0.2 },
            { consolidation_strength: 0.22 }, { consolidation_strength: 0.19 }
        ],
        expected_state: 'DIFFUSE'
    },
    
    forming_state: {
        name: 'FORMING — Initial context forming, weak reinforcement',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.55 },
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' }
        ],
        consolidationHistory: [
            { consolidation_strength: 0.28 }, { consolidation_strength: 0.3 },
            { consolidation_strength: 0.32 }, { consolidation_strength: 0.35 }
        ],
        expected_state: 'FORMING'
    },
    
    consolidated_state: {
        name: 'CONSOLIDATED — Stable context regions, moderate reinforcement',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.72 },
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        consolidationHistory: [
            { consolidation_strength: 0.45 }, { consolidation_strength: 0.5 },
            { consolidation_strength: 0.55 }, { consolidation_strength: 0.58 },
            { consolidation_strength: 0.6 }, { consolidation_strength: 0.62 }
        ],
        expected_state: 'CONSOLIDATED'
    },
    
    entrenched_context: {
        name: 'ENTRENCHED_CONTEXT — Deep contextual stability, strong reinforcement, 15+ history',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.88 },
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        consolidationHistory: [
            { consolidation_strength: 0.5 }, { consolidation_strength: 0.58 },
            { consolidation_strength: 0.65 }, { consolidation_strength: 0.72 },
            { consolidation_strength: 0.75 }, { consolidation_strength: 0.78 },
            { consolidation_strength: 0.8 }, { consolidation_strength: 0.82 },
            { consolidation_strength: 0.84 }, { consolidation_strength: 0.85 }
        ],
        expected_state: 'ENTRENCHED_CONTEXT'
    },
    
    reinforcement_disruption: {
        name: 'FRAGMENTATION — Reinforcement disruption detected',
        executiveState: { dominant_region: 'DEVELOPER_PRODUCTIVITY', focus_strength: 0.5 },
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' },
            { context_region: 'QUALITY_GUARANTEE' },
            { context_region: 'QUALITY_GUARANTEE' },
            { context_region: 'DEVELOPER_PRODUCTIVITY' }
        ],
        consolidationHistory: [
            { consolidation_strength: 0.65 }, { consolidation_strength: 0.68 },
            { consolidation_strength: 0.6 }, { consolidation_strength: 0.52 },
            { consolidation_strength: 0.45 }, { consolidation_strength: 0.38 }
        ],
        expected_fragmentation_type: 'REINFORCEMENT_DISRUPTION'
    },
    
    drift_stabilizing: {
        name: 'DRIFT — Context consolidation strengthening',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.78 },
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        consolidationHistory: [
            { consolidation_strength: 0.4 }, { consolidation_strength: 0.45 },
            { consolidation_strength: 0.52 }, { consolidation_strength: 0.58 },
            { consolidation_strength: 0.65 }, { consolidation_strength: 0.7 },
            { consolidation_strength: 0.75 }, { consolidation_strength: 0.78 }
        ],
        expected_drift: 'STABILIZING'
    },
    
    no_recommendation_language: {
        name: 'CONSTRAINT — No recommendation/action language in output',
        executiveState: { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', focus_strength: 0.8 },
        contextHistory: [
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { context_region: 'CRITICAL_ERROR_RECOVERY' },
            { context_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        consolidationHistory: [
            { consolidation_strength: 0.55 }, { consolidation_strength: 0.58 },
            { consolidation_strength: 0.62 }, { consolidation_strength: 0.65 }
        ],
        expected_no_forbidden: true
    }
};

// === VALIDATORS ===

function validateDeterministic(testCase) {
    const result1 = computeContextConsolidation(testCase.executiveState, testCase.contextHistory, testCase.consolidationHistory);
    const result2 = computeContextConsolidation(testCase.executiveState, testCase.contextHistory, testCase.consolidationHistory);
    
    const { generated_at: t1, ...rest1 } = result1;
    const { generated_at: t2, ...rest2 } = result2;
    
    if (JSON.stringify(rest1) !== JSON.stringify(rest2)) {
        return { pass: false, reason: 'Non-deterministic output' };
    }
    return { pass: true, reason: 'Deterministic output confirmed' };
}

function validateContextClassification(testCase) {
    const result = computeContextConsolidation(testCase.executiveState, testCase.contextHistory, testCase.consolidationHistory);
    
    if (testCase.expected_state && result.context_state !== testCase.expected_state) {
        return {
            pass: false,
            reason: `State mismatch: expected ${testCase.expected_state}, got ${result.context_state}`,
            expected: testCase.expected_state,
            actual: result.context_state
        };
    }
    return { pass: true, reason: 'Context classification correct' };
}

function validateFragmentationDetection(testCase) {
    const result = computeContextConsolidation(testCase.executiveState, testCase.contextHistory, testCase.consolidationHistory);
    
    if (testCase.expected_fragmentation_type) {
        const found = result.context_fragmentation.find(f => f.type === testCase.expected_fragmentation_type);
        if (!found) {
            return {
                pass: false,
                reason: `Expected fragmentation ${testCase.expected_fragmentation_type} not found`,
                found: result.context_fragmentation.map(f => f.type)
            };
        }
    }
    return { pass: true, reason: 'Fragmentation detection correct' };
}

function validateDriftDetection(testCase) {
    const result = computeContextConsolidation(testCase.executiveState, testCase.contextHistory, testCase.consolidationHistory);
    
    if (testCase.expected_drift && result.context_drift_profile.profile !== testCase.expected_drift) {
        return {
            pass: false,
            reason: `Drift mismatch: expected ${testCase.expected_drift}, got ${result.context_drift_profile.profile}`
        };
    }
    return { pass: true, reason: 'Drift detection correct' };
}

function validateNoRecommendationLanguage(testCase) {
    const result = computeContextConsolidation(testCase.executiveState, testCase.contextHistory, testCase.consolidationHistory);
    
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
        'context_state', 'consolidation_strength', 'stable_context_regions',
        'fragmented_context_regions', 'context_fragmentation',
        'survivability_regions', 'context_stability_assessment',
        'context_drift_profile', 'uncertainty_boundaries',
        'environmental_context_summary', 'generated_at', 'shadow_only'
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
    console.log('=== MCAI Phase 7B — Executive Context Consolidation Validation ===\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const [key, testCase] of Object.entries(TEST_CASES)) {
        console.log(`Test: ${testCase.name}`);
        
        const validators = [
            { name: 'Deterministic Output', fn: () => validateDeterministic(testCase) },
            { name: 'Context Classification', fn: () => validateContextClassification(testCase) },
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
        const computed = computeContextConsolidation(testCase.executiveState, testCase.contextHistory, testCase.consolidationHistory);
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