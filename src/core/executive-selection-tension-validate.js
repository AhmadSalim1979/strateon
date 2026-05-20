/**
 * Executive Selection Tension Validator — MCAI Phase 6C
 * Validates deterministic outputs, classification correctness, and modeling.
 */

const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');

// Load the module
const {
    computeExecutiveSelectionTension,
    saveTensionState,
    TENSION_STATES,
    DRIFT_PROFILES
} = require('../executive-selection-tension.js');

// === TEST DATA ===

const TEST_CASES = {
    calm_state: {
        name: 'CALM — Single dominant candidate, stable convergence',
        executiveState: {
            state: 'DOMINANT',
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            stability_score: 0.95,
            convergence_strength: 0.92,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.92 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.08 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 }
        ],
        expected_tension_state: 'CALM',
        expected_max_tension: 0.2
    },
    
    developing_state: {
        name: 'DEVELOPING — Emerging competition, instability beginning',
        executiveState: {
            state: 'DEVELOPING',
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            stability_score: 0.7,
            convergence_strength: 0.65,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.68 },
                { region: 'CRITICAL_ERROR_RECOVERY', strength: 0.52 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.3 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.35 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.4 }
        ],
        expected_tension_state: 'DEVELOPING',
        expected_min_tension: 0.25
    },
    
    tensioned_state: {
        name: 'TENSIONED — Strong competition, unresolved dominance',
        executiveState: {
            state: 'TENSIONED',
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            stability_score: 0.55,
            convergence_strength: 0.5,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.65 },
                { region: 'CRITICAL_ERROR_RECOVERY', strength: 0.58 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.5 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.55 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.52 }
        ],
        expected_tension_state: 'TENSIONED',
        expected_min_tension: 0.45
    },
    
    fracturing_state: {
        name: 'FRACTURING — Fragmentation, convergence collapse',
        executiveState: {
            state: 'FRACTURING',
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            stability_score: 0.3,
            convergence_strength: 0.25,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.45 },
                { region: 'CRITICAL_ERROR_RECOVERY', strength: 0.43 },
                { region: 'DEVELOPER_PRODUCTIVITY', strength: 0.41 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.7 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.75 },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY', tension_strength: 0.72 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.7 }
        ],
        expected_tension_state: 'FRACTURING',
        expected_min_tension: 0.6
    },
    
    oscillation_detected: {
        name: 'OSCILLATION — Alternating dominance, unstable leadership',
        executiveState: {
            state: 'TENSIONED',
            dominant_region: 'CRITICAL_ERROR_RECOVERY',
            stability_score: 0.4,
            convergence_strength: 0.38,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.58 },
                { region: 'CRITICAL_ERROR_RECOVERY', strength: 0.55 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.5 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.52 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.48 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.51 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.49 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.5 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.48 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.52 }
        ],
        expected_tension_state: 'TENSIONED',
        expected_oscillation: true
    },
    
    fragmentation_detected: {
        name: 'FRAGMENTATION — Multiple competing regions, convergence break',
        executiveState: {
            state: 'FRACTURING',
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            stability_score: 0.25,
            convergence_strength: 0.22,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.42 },
                { region: 'CRITICAL_ERROR_RECOVERY', strength: 0.41 },
                { region: 'DEVELOPER_PRODUCTIVITY', strength: 0.39 },
                { region: 'QUALITY_GUARANTEE', strength: 0.38 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.65 },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY', tension_strength: 0.68 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.7 },
            { dominant_region: 'QUALITY_GUARANTEE', tension_strength: 0.72 }
        ],
        expected_tension_state: 'FRACTURING',
        expected_fragmentation: true
    },
    
    persistence_failure: {
        name: 'PERSISTENCE_FAILURE — Dominance keeps changing, convergence not holding',
        executiveState: {
            state: 'TENSIONED',
            dominant_region: 'CRITICAL_ERROR_RECOVERY',
            stability_score: 0.35,
            convergence_strength: 0.3,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.55 },
                { region: 'CRITICAL_ERROR_RECOVERY', strength: 0.52 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.55 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.53 },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY', tension_strength: 0.58 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.52 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.56 },
            { dominant_region: 'QUALITY_GUARANTEE', tension_strength: 0.5 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.54 }
        ],
        expected_tension_state: 'TENSIONED',
        expected_persistence_failure: true
    }
};

// === VALIDATORS ===

function validateDeterministicOutputs(testName, executiveState, history) {
    // Run twice with same input — should produce same output
    const result1 = computeExecutiveSelectionTension(executiveState, history);
    const result2 = computeExecutiveSelectionTension(executiveState, history);
    
    if (JSON.stringify(result1) !== JSON.stringify(result2)) {
        return { pass: false, reason: 'Non-deterministic output', result1, result2 };
    }
    
    return { pass: true, reason: 'Deterministic output confirmed' };
}

function validateTensionClassification(testCase) {
    const result = computeExecutiveSelectionTension(testCase.executiveState, testCase.history);
    
    if (testCase.expected_tension_state && result.executive_tension_state !== testCase.expected_tension_state) {
        return {
            pass: false,
            reason: `Tension state mismatch: expected ${testCase.expected_tension_state}, got ${result.executive_tension_state}`,
            result: result.executive_tension_state
        };
    }
    
    if (testCase.expected_min_tension && result.tension_strength < testCase.expected_min_tension) {
        return {
            pass: false,
            reason: `Tension strength too low: expected >= ${testCase.expected_min_tension}, got ${result.tension_strength}`,
            result: result.tension_strength
        };
    }
    
    if (testCase.expected_max_tension && result.tension_strength > testCase.expected_max_tension) {
        return {
            pass: false,
            reason: `Tension strength too high: expected <= ${testCase.expected_max_tension}, got ${result.tension_strength}`,
            result: result.tension_strength
        };
    }
    
    return { pass: true, reason: 'Tension classification correct' };
}

function validateCompetitionModeling(testCase) {
    const result = computeExecutiveSelectionTension(testCase.executiveState, testCase.history);
    
    // Check competition score is computed
    if (typeof result.executive_competition_map?.competition_score !== 'number') {
        return { pass: false, reason: 'Competition score not computed' };
    }
    
    // Check competing regions detected when expected
    if (testCase.expected_min_tension && result.executive_competition_map.competing_count < 1) {
        return { pass: false, reason: 'Competition not detected when expected' };
    }
    
    return { pass: true, reason: 'Competition modeling correct' };
}

function validateOscillationDetection(testCase) {
    const result = computeExecutiveSelectionTension(testCase.executiveState, testCase.history);
    
    if (testCase.expected_oscillation) {
        if (!result.oscillation_regions || result.oscillation_regions.length === 0) {
            return {
                pass: false,
                reason: 'Oscillation expected but not detected',
                oscillation_regions: result.oscillation_regions
            };
        }
        if (!result.oscillation_regions.includes(testCase.executiveState.dominant_region)) {
            // Check that oscillation includes the tracked regions
        }
    }
    
    return { pass: true, reason: 'Oscillation detection correct' };
}

function validateFragmentationDetection(testCase) {
    const result = computeExecutiveSelectionTension(testCase.executiveState, testCase.history);
    
    if (testCase.expected_fragmentation) {
        if (!result.executive_fragmentation_regions || result.executive_fragmentation_regions.length < 2) {
            return {
                pass: false,
                reason: 'Fragmentation expected but not detected',
                fragmentation_regions: result.executive_fragmentation_regions
            };
        }
    }
    
    return { pass: true, reason: 'Fragmentation detection correct' };
}

function validatePersistenceModeling(testCase) {
    const result = computeExecutiveSelectionTension(testCase.executiveState, testCase.history);
    
    if (testCase.expected_persistence_failure) {
        if (!result.executive_persistence_summary?.failure_detected) {
            return {
                pass: false,
                reason: 'Persistence failure expected but not detected',
                persistence_summary: result.executive_persistence_summary
            };
        }
    }
    
    return { pass: true, reason: 'Persistence modeling correct' };
}

function validateUncertaintyBoundaries(result) {
    // Should have uncertainty boundaries when classification is uncertain
    const hasUncertainty = result.uncertainty_boundaries && result.uncertainty_boundaries.length > 0;
    
    // When tension is DEVELOPING or higher, boundaries should exist
    if (result.tension_strength > 0.35 && !hasUncertainty) {
        return {
            pass: false,
            reason: 'High tension but no uncertainty boundaries computed'
        };
    }
    
    return { pass: true, reason: 'Uncertainty boundaries present' };
}

function validateSchemaCompliance(result) {
    const required = [
        'executive_tension_state',
        'tension_strength',
        'executive_competition_map',
        'executive_stability_assessment',
        'executive_drift_profile',
        'uncertainty_boundaries',
        'generated_at',
        'shadow_only'
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
    console.log('=== MCAI Phase 6C — Executive Selection Tension Validation ===\n');
    
    let passed = 0;
    let failed = 0;
    const results = [];
    
    for (const [key, testCase] of Object.entries(TEST_CASES)) {
        console.log(`Test: ${testCase.name}`);
        
        const validators = [
            { name: 'Deterministic Output', fn: () => validateDeterministicOutputs(key, testCase.executiveState, testCase.history) },
            { name: 'Tension Classification', fn: () => validateTensionClassification(testCase) },
            { name: 'Competition Modeling', fn: () => validateCompetitionModeling(testCase) },
            { name: 'Oscillation Detection', fn: () => validateOscillationDetection(testCase) },
            { name: 'Fragmentation Detection', fn: () => validateFragmentationDetection(testCase) },
            { name: 'Persistence Modeling', fn: () => validatePersistenceModeling(testCase) }
        ];
        
        for (const validator of validators) {
            const result = validator.fn();
            const status = result.pass ? '✅' : '❌';
            console.log(`  ${status} ${validator.name}: ${result.reason}`);
            if (result.pass) {
                passed++;
            } else {
                failed++;
            }
        }
        
        // Schema check on computed result
        const computed = computeExecutiveSelectionTension(testCase.executiveState, testCase.history);
        const schemaResult = validateSchemaCompliance(computed);
        const schemaStatus = schemaResult.pass ? '✅' : '❌';
        console.log(`  ${schemaStatus} Schema Compliance: ${schemaResult.reason}`);
        if (schemaResult.pass) passed++; else failed++;
        
        console.log('');
    }
    
    // Test uncertainty boundaries specifically
    console.log('Uncertainty Boundaries Check:');
    const calmTest = TEST_CASES.calm_state;
    const calmResult = computeExecutiveSelectionTension(calmTest.executiveState, calmTest.history);
    const tensionedTest = TEST_CASES.tensioned_state;
    const tensionedResult = computeExecutiveSelectionTension(tensionedTest.executiveState, tensionedTest.history);
    
    console.log(`  CALM state uncertainty count: ${calmResult.uncertainty_boundaries?.length || 0} (expect low or zero)`);
    console.log(`  TENSIONED state uncertainty count: ${tensionedResult.uncertainty_boundaries?.length || 0} (expect >0)`);
    
    console.log('\n=== SUMMARY ===');
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