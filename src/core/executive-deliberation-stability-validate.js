/**
 * Executive Deliberation Stability Validator — MCAI Phase 6G
 * Validates deterministic outputs, deliberation classification, equilibrium modeling.
 */

const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');

const {
    computeDeliberationStability,
    saveDeliberationState,
    DELIBERATION_STATES,
    DRIFT_PROFILES
} = require('../executive-deliberation-stability.js');

// === TEST DATA ===

const TEST_CASES = {
    fragile_state: {
        name: 'FRAGILE — High oscillation, low equilibrium, fragmentation pressure',
        executiveFocus: {
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            focus_strength: 0.45
        },
        executiveTension: { tension_state: 'UNSTABLE', tension_strength: 0.4 },
        persistenceState: { persistence_strength: 0.35 },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        expected_state: 'FRAGILE'
    },
    
    developing_state: {
        name: 'DEVELOPING — Moderate coexistence, developing equilibrium',
        // Pattern: 3 INFRA + 2 CRITICAL in last 5 (indices 2-6), 2 switches
        // Last 5: INFRA, INFRA, INFRA, CRITICAL, CRITICAL = 2 switches
        // Osc = 2/4 = 0.5 (passes <=0.6 for non-FRAGILE)
        // Eq = 1 - (3/5 * 2/5 * 2) = 0.76
        // Stability = 0.76 × (1-0.5) × (1-0) = 0.38 → DEVELOPING (0.25-0.5 range)
        executiveFocus: {
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            focus_strength: 0.55
        },
        executiveTension: { tension_state: 'STABLE', tension_strength: 0.55 },
        persistenceState: { persistence_strength: 0.5 },
        history: [
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' }
        ],
        expected_state: 'DEVELOPING'
    },
    
    stable_state: {
        name: 'STABLE — Bounded coexistence, low fragmentation, stable equilibrium',
        executiveFocus: {
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            focus_strength: 0.7
        },
        executiveTension: { tension_state: 'STABLE', tension_strength: 0.7 },
        persistenceState: { persistence_strength: 0.65 },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        expected_state: 'STABLE'
    },
    
    entrenched_stability: {
        name: 'ENTRENCHED_STABILITY — Strong anti-monopoly, entrenched equilibrium, multiple coexisting regions',
        executiveFocus: {
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            focus_strength: 0.8
        },
        executiveTension: { tension_state: 'STABLE', tension_strength: 0.8 },
        persistenceState: { persistence_strength: 0.75 },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' }
        ],
        expected_state: 'ENTRENCHED_STABILITY'
    },
    
    oscillatory_fragmentation: {
        name: 'FRAGMENTATION — Oscillatory competition, no stable equilibrium',
        executiveFocus: {
            dominant_region: 'CRITICAL_ERROR_RECOVERY',
            focus_strength: 0.5
        },
        executiveTension: { tension_state: 'OSCILLATING', tension_strength: 0.5 },
        persistenceState: { persistence_strength: 0.4 },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'QUALITY_GUARANTEE' }
        ],
        expected_fragmentation_pressure: 'OSCILLATORY_COMPETITION'
    },
    
    monopolization_pressure: {
        name: 'MONOPOLIZATION — High dominance concentration, anti-monopoly at risk',
        executiveFocus: {
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            focus_strength: 0.92
        },
        executiveTension: { tension_state: 'STABLE', tension_strength: 0.9 },
        persistenceState: { persistence_strength: 0.88 },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        expected_fragmentation_pressure: 'CONVERGENCE_MONOPOLIZATION'
    },
    
    equilibrium_collapse: {
        name: 'COLLAPSE — Equilibrium collapse under fragmentation pressure',
        executiveFocus: {
            dominant_region: 'DEVELOPER_PRODUCTIVITY',
            focus_strength: 0.4
        },
        executiveTension: { tension_state: 'UNSTABLE', tension_strength: 0.35 },
        persistenceState: { persistence_strength: 0.3 },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'DEVELOPER_PRODUCTIVITY' },
            { dominant_region: 'QUALITY_GUARANTEE' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' }
        ],
        expected_fragmentation_pressure: 'EQUILIBRIUM_COLLAPSE'
    },
    
    drift_stabilizing: {
        name: 'DRIFT — Deliberation stability strengthening',
        executiveFocus: {
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            focus_strength: 0.75
        },
        executiveTension: { tension_state: 'STABLE', tension_strength: 0.72 },
        persistenceState: { persistence_strength: 0.7 },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        deliberationHistory: [
            { deliberation_strength: 0.4 }, { deliberation_strength: 0.45 },
            { deliberation_strength: 0.52 }, { deliberation_strength: 0.6 },
            { deliberation_strength: 0.68 }, { deliberation_strength: 0.75 },
            { deliberation_strength: 0.78 }, { deliberation_strength: 0.82 }
        ],
        expected_drift: 'STABILIZING'
    },
    
    anti_monopoly_preservation: {
        name: 'ANTI-MONOPOLY — Bounded coexistence without monopolization',
        executiveFocus: {
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            focus_strength: 0.68
        },
        executiveTension: { tension_state: 'STABLE', tension_strength: 0.65 },
        persistenceState: { persistence_strength: 0.62 },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' }
        ],
        deliberationHistory: [
            { deliberation_strength: 0.55 }, { deliberation_strength: 0.58 },
            { deliberation_strength: 0.6 }, { deliberation_strength: 0.62 },
            { deliberation_strength: 0.65 }, { deliberation_strength: 0.68 },
            { deliberation_strength: 0.7 }, { deliberation_strength: 0.72 }
        ],
        expected_anti_monopoly: true
    },
    
    no_recommendation_language: {
        name: 'CONSTRAINT — No recommendation/action language in output',
        executiveFocus: {
            dominant_region: 'INFRASTRUCTURE_TASK_SELECTION',
            focus_strength: 0.8
        },
        executiveTension: { tension_state: 'STABLE', tension_strength: 0.78 },
        persistenceState: { persistence_strength: 0.75 },
        history: [
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' },
            { dominant_region: 'CRITICAL_ERROR_RECOVERY' },
            { dominant_region: 'INFRASTRUCTURE_TASK_SELECTION' }
        ],
        expected_no_forbidden: true
    }
};

// === VALIDATORS ===

function validateDeterministic(testCase) {
    const result1 = computeDeliberationStability(
        testCase.executiveFocus, testCase.executiveTension, testCase.persistenceState,
        testCase.history, testCase.deliberationHistory || testCase.history
    );
    const result2 = computeDeliberationStability(
        testCase.executiveFocus, testCase.executiveTension, testCase.persistenceState,
        testCase.history, testCase.deliberationHistory || testCase.history
    );
    
    const { generated_at: t1, ...rest1 } = result1;
    const { generated_at: t2, ...rest2 } = result2;
    
    if (JSON.stringify(rest1) !== JSON.stringify(rest2)) {
        return { pass: false, reason: 'Non-deterministic output' };
    }
    return { pass: true, reason: 'Deterministic output confirmed' };
}

function validateDeliberationClassification(testCase) {
    const result = computeDeliberationStability(
        testCase.executiveFocus, testCase.executiveTension, testCase.persistenceState,
        testCase.history, testCase.deliberationHistory || testCase.history
    );
    
    if (testCase.expected_state && result.deliberation_state !== testCase.expected_state) {
        return {
            pass: false,
            reason: `State mismatch: expected ${testCase.expected_state}, got ${result.deliberation_state}`
        };
    }
    return { pass: true, reason: 'Deliberation classification correct' };
}

function validateFragmentationDetection(testCase) {
    const result = computeDeliberationStability(
        testCase.executiveFocus, testCase.executiveTension, testCase.persistenceState,
        testCase.history, testCase.deliberationHistory || testCase.history
    );
    
    if (testCase.expected_fragmentation_pressure) {
        const found = result.fragmentation_pressures.find(p => p.type === testCase.expected_fragmentation_pressure);
        if (!found) {
            return {
                pass: false,
                reason: `Expected pressure ${testCase.expected_fragmentation_pressure} not found`,
                found: result.fragmentation_pressures.map(p => p.type)
            };
        }
    }
    return { pass: true, reason: 'Fragmentation pressure detection correct' };
}

function validateDriftDetection(testCase) {
    const result = computeDeliberationStability(
        testCase.executiveFocus, testCase.executiveTension, testCase.persistenceState,
        testCase.history, testCase.deliberationHistory || testCase.history
    );
    
    if (testCase.expected_drift && result.deliberation_drift_profile.profile !== testCase.expected_drift) {
        return {
            pass: false,
            reason: `Drift mismatch: expected ${testCase.expected_drift}, got ${result.deliberation_drift_profile.profile}`
        };
    }
    return { pass: true, reason: 'Drift detection correct' };
}

function validateAntiMonopolyPreservation(testCase) {
    const result = computeDeliberationStability(
        testCase.executiveFocus, testCase.executiveTension, testCase.persistenceState,
        testCase.history, testCase.deliberationHistory || testCase.history
    );
    
    if (testCase.expected_anti_monopoly) {
        const antiMonopolyScore = result.deliberation_stability_assessment?.anti_monopoly_persistence || 0;
        if (antiMonopolyScore < 0.4) {
            return {
                pass: false,
                reason: `Anti-monopoly score too low: ${antiMonopolyScore}`,
                expected: '>= 0.4'
            };
        }
    }
    return { pass: true, reason: 'Anti-monopoly preservation confirmed' };
}

function validateNoRecommendationLanguage(testCase) {
    const result = computeDeliberationStability(
        testCase.executiveFocus, testCase.executiveTension, testCase.persistenceState,
        testCase.history, testCase.deliberationHistory || testCase.history
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
        'deliberation_state', 'deliberation_strength', 'stable_competition_regions',
        'unstable_competition_regions', 'equilibrium_regions', 'fragmentation_pressures',
        'survivability_regions', 'deliberation_stability_assessment',
        'deliberation_drift_profile', 'uncertainty_boundaries',
        'environmental_deliberation_summary', 'generated_at', 'shadow_only'
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
    console.log('=== MCAI Phase 6G — Executive Deliberation Stability Validation ===\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const [key, testCase] of Object.entries(TEST_CASES)) {
        console.log(`Test: ${testCase.name}`);
        
        const validators = [
            { name: 'Deterministic Output', fn: () => validateDeterministic(testCase) },
            { name: 'Deliberation Classification', fn: () => validateDeliberationClassification(testCase) },
            { name: 'Fragmentation Detection', fn: () => validateFragmentationDetection(testCase) },
            { name: 'Drift Detection', fn: () => validateDriftDetection(testCase) },
            { name: 'Anti-Monopoly Preservation', fn: () => validateAntiMonopolyPreservation(testCase) },
            { name: 'No Recommendation Language', fn: () => validateNoRecommendationLanguage(testCase) }
        ];
        
        for (const validator of validators) {
            const result = validator.fn();
            const status = result.pass ? '✅' : '❌';
            console.log(`  ${status} ${validator.name}: ${result.reason}`);
            if (result.pass) passed++; else failed++;
        }
        
        // Schema check
        const computed = computeDeliberationStability(
            testCase.executiveFocus, testCase.executiveTension, testCase.persistenceState,
            testCase.history, testCase.deliberationHistory || testCase.history
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