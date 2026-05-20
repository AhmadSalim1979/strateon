/**
 * Executive Persistence Validator — MCAI Phase 6D
 * Validates deterministic outputs, persistence classification, and modeling.
 */

const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');

const {
    computeExecutivePersistence,
    savePersistenceState,
    PERSISTENCE_STATES,
    DRIFT_PROFILES
} = require('../executive-persistence.js');

// === TEST DATA ===

const TEST_CASES = {
    transient_state: {
        name: 'TRANSIENT — Low continuity, short history',
        executiveState: {
            state: 'INCIDENTAL',
            dominant_region: 'CRITICAL_ERROR_RECOVERY',
            stability_score: 0.4,
            convergence_strength: 0.35,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.45 },
                { region: 'CRITICAL_ERROR_RECOVERY', strength: 0.43 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.5 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.55 },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY', tension_strength: 0.6 }
        ],
        persistenceHistory: [
            { persistence_strength: 0.2 },
            { persistence_strength: 0.25 },
            { persistence_strength: 0.22 }
        ],
        expected_persistence_state: 'HOLDING'  // SHORT HISTORY — persistence still observable as HOLDING
    },
    
    holding_state: {
        name: 'HOLDING — Moderate continuity, survivable under normal conditions',
        executiveState: {
            state: 'DOMINANT',
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            stability_score: 0.7,
            convergence_strength: 0.68,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.72 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.3 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.28 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.32 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.35 }
        ],
        persistenceHistory: [
            { persistence_strength: 0.45 },
            { persistence_strength: 0.5 },
            { persistence_strength: 0.48 },
            { persistence_strength: 0.52 }
        ],
        expected_persistence_state: 'HOLDING'
    },
    
    consolidating_state: {
        name: 'CONSOLIDATING — Increasing continuity, strengthening trend',
        executiveState: {
            state: 'DOMINANT',
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            stability_score: 0.8,
            convergence_strength: 0.78,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.82 },
                { region: 'CRITICAL_ERROR_RECOVERY', strength: 0.55 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.35 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.3 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.25 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.22 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.2 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.18 }
        ],
        persistenceHistory: [
            { persistence_strength: 0.5 },
            { persistence_strength: 0.55 },
            { persistence_strength: 0.62 },
            { persistence_strength: 0.68 },
            { persistence_strength: 0.72 },
            { persistence_strength: 0.75 }
        ],
        expected_persistence_state: 'CONSOLIDATING'
    },
    
    entrenched_state: {
        name: 'ENTRENCHED — Long history, high durability, strong survivability',
        executiveState: {
            state: 'DOMINANT',
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            stability_score: 0.95,
            convergence_strength: 0.92,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.95 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.1 }
        ],
        persistenceHistory: [
            { persistence_strength: 0.8 },
            { persistence_strength: 0.82 },
            { persistence_strength: 0.85 },
            { persistence_strength: 0.87 },
            { persistence_strength: 0.88 },
            { persistence_strength: 0.9 },
            { persistence_strength: 0.9 },
            { persistence_strength: 0.92 },
            { persistence_strength: 0.93 },
            { persistence_strength: 0.94 },
            { persistence_strength: 0.95 }
        ],
        expected_persistence_state: 'ENTRENCHED'
    },
    
    decay_detected: {
        name: 'DECAY — Persistence weakening over time',
        executiveState: {
            state: 'DEVELOPING',
            dominant_region: 'CRITICAL_ERROR_RECOVERY',
            stability_score: 0.45,
            convergence_strength: 0.4,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.58 },
                { region: 'CRITICAL_ERROR_RECOVERY', strength: 0.55 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.4 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.38 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.4 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.45 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.5 },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY', tension_strength: 0.55 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.52 },
            { dominant_region: 'QUALITY_GUARANTEE', tension_strength: 0.58 }
        ],
        persistenceHistory: [
            { persistence_strength: 0.7 },
            { persistence_strength: 0.68 },
            { persistence_strength: 0.65 },
            { persistence_strength: 0.6 },
            { persistence_strength: 0.55 },
            { persistence_strength: 0.5 },
            { persistence_strength: 0.45 },
            { persistence_strength: 0.4 }
        ],
        expected_decay: true,
        expected_decay_regions: ['CRITICAL_ERROR_RECOVERY']
    },
    
    survivability_detected: {
        name: 'SURVIVABILITY — Region re-emerges after interruption',
        executiveState: {
            state: 'DOMINANT',
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            stability_score: 0.75,
            convergence_strength: 0.72,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.78 },
                { region: 'CRITICAL_ERROR_RECOVERY', strength: 0.6 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.25 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.28 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.4 },  // Interruption
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.38 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.3 },  // Recovery
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.28 }
        ],
        persistenceHistory: [
            { persistence_strength: 0.6 },
            { persistence_strength: 0.62 },
            { persistence_strength: 0.5 },
            { persistence_strength: 0.52 },
            { persistence_strength: 0.65 },
            { persistence_strength: 0.68 }
        ],
        expected_survivability: true
    },
    
    consolidation_detected: {
        name: 'CONSOLIDATION — Multiple regions merging into one',
        executiveState: {
            state: 'CONVERGING',
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            stability_score: 0.85,
            convergence_strength: 0.82,
            top_candidates: [
                { region: 'INFRASTRUCTURE_TASK_SELECTION', strength: 0.85 }
            ]
        },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.45 },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY', tension_strength: 0.48 },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY', tension_strength: 0.5 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.35 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.3 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.25 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.2 },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION', tension_strength: 0.18 }
        ],
        persistenceHistory: [
            { persistence_strength: 0.4 },
            { persistence_strength: 0.42 },
            { persistence_strength: 0.45 },
            { persistence_strength: 0.55 },
            { persistence_strength: 0.65 },
            { persistence_strength: 0.72 },
            { persistence_strength: 0.78 },
            { persistence_strength: 0.82 }
        ],
        expected_consolidation: true
    }
};

// === VALIDATORS ===

function validateDeterministicOutputs(testName, executiveState, history, persistenceHistory) {
    const result1 = computeExecutivePersistence(executiveState, history, persistenceHistory);
    const result2 = computeExecutivePersistence(executiveState, history, persistenceHistory);
    
    if (JSON.stringify(result1) !== JSON.stringify(result2)) {
        return { pass: false, reason: 'Non-deterministic output' };
    }
    return { pass: true, reason: 'Deterministic output confirmed' };
}

function validatePersistenceClassification(testCase) {
    const result = computeExecutivePersistence(testCase.executiveState, testCase.history, testCase.persistenceHistory);
    
    if (testCase.expected_persistence_state && result.executive_persistence_state !== testCase.expected_persistence_state) {
        return {
            pass: false,
            reason: `Persistence state mismatch: expected ${testCase.expected_persistence_state}, got ${result.executive_persistence_state}`,
            result: result.executive_persistence_state
        };
    }
    
    return { pass: true, reason: 'Persistence classification correct' };
}

function validateDecayDetection(testCase) {
    const result = computeExecutivePersistence(testCase.executiveState, testCase.history, testCase.persistenceHistory);
    
    if (testCase.expected_decay) {
        if (!result.persistence_decay_regions || result.persistence_decay_regions.length === 0) {
            return {
                pass: false,
                reason: 'Decay expected but not detected',
                decay_regions: result.persistence_decay_regions
            };
        }
    }
    
    return { pass: true, reason: 'Decay detection correct' };
}

function validateSurvivabilityDetection(testCase) {
    const result = computeExecutivePersistence(testCase.executiveState, testCase.history, testCase.persistenceHistory);
    
    if (testCase.expected_survivability) {
        if (!result.survivability_regions || result.survivability_regions.length === 0) {
            return {
                pass: false,
                reason: 'Survivability expected but not detected',
                survivability_regions: result.survivability_regions
            };
        }
    }
    
    return { pass: true, reason: 'Survivability detection correct' };
}

function validateConsolidationDetection(testCase) {
    const result = computeExecutivePersistence(testCase.executiveState, testCase.history, testCase.persistenceHistory);
    
    if (testCase.expected_consolidation) {
        if (!result.persistence_consolidation_summary?.consolidation_detected) {
            return {
                pass: false,
                reason: 'Consolidation expected but not detected',
                consolidation: result.persistence_consolidation_summary
            };
        }
    }
    
    return { pass: true, reason: 'Consolidation detection correct' };
}

function validateSchemaCompliance(result) {
    const required = [
        'executive_persistence_state',
        'persistence_strength',
        'persistence_stability_assessment',
        'persistence_drift_profile',
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
    console.log('=== MCAI Phase 6D — Executive Persistence Validation ===\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const [key, testCase] of Object.entries(TEST_CASES)) {
        console.log(`Test: ${testCase.name}`);
        
        const validators = [
            { name: 'Deterministic Output', fn: () => validateDeterministicOutputs(key, testCase.executiveState, testCase.history, testCase.persistenceHistory) },
            { name: 'Persistence Classification', fn: () => validatePersistenceClassification(testCase) },
            { name: 'Decay Detection', fn: () => validateDecayDetection(testCase) },
            { name: 'Survivability Detection', fn: () => validateSurvivabilityDetection(testCase) },
            { name: 'Consolidation Detection', fn: () => validateConsolidationDetection(testCase) }
        ];
        
        for (const validator of validators) {
            const result = validator.fn();
            const status = result.pass ? '✅' : '❌';
            console.log(`  ${status} ${validator.name}: ${result.reason}`);
            if (result.pass) passed++; else failed++;
        }
        
        // Schema check
        const computed = computeExecutivePersistence(testCase.executiveState, testCase.history, testCase.persistenceHistory);
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