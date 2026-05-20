/**
 * Executive Readiness Validator — MCAI Phase 6E
 * Validates deterministic outputs, readiness classification, blocker/support signal detection.
 */

const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');

const {
    computeReadiness,
    saveReadinessState,
    loadReadinessInputs,
    READINESS_STATES,
    DRIFT_PROFILES,
    READINESS_BLOCKERS,
    READINESS_SUPPORT_SIGNALS
} = require('../executive-readiness.js');

// === TEST DATA ===

const TEST_CASES = {
    not_ready_high_blockers: {
        name: 'NOT_READY — High-severity blockers dominate',
        inputs: {
            epistemic_integrity: { coherence_score: 0.3, belief_stability: 0.25, verification_discipline: 0.4 },
            cognitive_coherence: { coherence_score: 0.35, unresolved_contradictions: 2 },
            cognitive_stability: { stability_score: 0.4, oscillation_index: 0.3 },
            cognitive_weighting: { fragmentation_score: 0.7, coherence_score: 0.4 },
            prioritization_pressure: { pressure_state: 'MANAGEABLE', pressure_score: 0.5 },
            executive_focus: { focus_state: 'DEVELOPING', focus_strength: 0.4 },
            executive_selection_tension: { tension_state: 'STABLE', tension_strength: 0.5 },
            executive_persistence: { executive_persistence_state: 'TRANSIENT', persistence_strength: 0.3 },
            temporal_continuity: { continuity_score: 0.5, coherence_trend: 'stable' }
        },
        history: [
            { readiness_score: 0.3 }, { readiness_score: 0.28 }, { readiness_score: 0.25 },
            { readiness_score: 0.28 }, { readiness_score: 0.3 }
        ],
        expected_state: 'NOT_READY'
    },
    
    emerging_state: {
        name: 'EMERGING — Some signals, minor blockers',
        inputs: {
            epistemic_integrity: { coherence_score: 0.55, belief_stability: 0.5, verification_discipline: 0.5 },
            cognitive_coherence: { coherence_score: 0.5, unresolved_contradictions: 1 },
            cognitive_stability: { stability_score: 0.6, oscillation_index: 0.35 },
            cognitive_weighting: { fragmentation_score: 0.45, coherence_score: 0.55 },
            prioritization_pressure: { pressure_state: 'MODERATE', pressure_score: 0.55 },
            executive_focus: { focus_state: 'DEVELOPING', focus_strength: 0.45 },
            executive_selection_tension: { tension_state: 'STABLE', tension_strength: 0.55 },
            executive_persistence: { executive_persistence_state: 'HOLDING', persistence_strength: 0.5 },
            temporal_continuity: { continuity_score: 0.55, coherence_trend: 'stable' }
        },
        history: [
            { readiness_score: 0.4 }, { readiness_score: 0.42 }, { readiness_score: 0.45 }
        ],
        expected_state: 'EMERGING'
    },
    
    conditionally_ready: {
        name: 'CONDITIONALLY_READY — Moderate support, manageable blockers',
        inputs: {
            epistemic_integrity: { coherence_score: 0.65, belief_stability: 0.6, verification_discipline: 0.6 },
            cognitive_coherence: { coherence_score: 0.6, unresolved_contradictions: 0 },
            cognitive_stability: { stability_score: 0.7, oscillation_index: 0.25 },
            cognitive_weighting: { fragmentation_score: 0.35, coherence_score: 0.65 },
            prioritization_pressure: { pressure_state: 'MODERATE', pressure_score: 0.6 },
            executive_focus: { focus_state: 'CONVERGING', focus_strength: 0.65 },
            executive_selection_tension: { tension_state: 'STABLE', tension_strength: 0.6 },
            executive_persistence: { executive_persistence_state: 'CONSOLIDATING', persistence_strength: 0.6 },
            temporal_continuity: { continuity_score: 0.65, coherence_trend: 'improving' }
        },
        history: [
            { readiness_score: 0.5 }, { readiness_score: 0.55 }, { readiness_score: 0.58 },
            { readiness_score: 0.6 }, { readiness_score: 0.62 }
        ],
        expected_state: 'CONDITIONALLY_READY'
    },
    
    ready_observational: {
        name: 'READY_OBSERVATIONAL — Strong support, minimal blockers',
        inputs: {
            epistemic_integrity: { coherence_score: 0.8, belief_stability: 0.78, verification_discipline: 0.8 },
            cognitive_coherence: { coherence_score: 0.82, unresolved_contradictions: 0 },
            cognitive_stability: { stability_score: 0.85, oscillation_index: 0.15 },
            cognitive_weighting: { fragmentation_score: 0.2, coherence_score: 0.8 },
            prioritization_pressure: { pressure_state: 'STABLE', pressure_score: 0.72 },
            executive_focus: { focus_state: 'DOMINANT', focus_strength: 0.82 },
            executive_selection_tension: { tension_state: 'STABLE', tension_strength: 0.78 },
            executive_persistence: { executive_persistence_state: 'ENTRENCHED', persistence_strength: 0.82 },
            temporal_continuity: { continuity_score: 0.85, coherence_trend: 'improving' }
        },
        history: [
            { readiness_score: 0.7 }, { readiness_score: 0.72 }, { readiness_score: 0.75 },
            { readiness_score: 0.78 }, { readiness_score: 0.8 }, { readiness_score: 0.82 }
        ],
        expected_state: 'READY_OBSERVATIONAL'
    },
    
    improving_drift: {
        name: 'DRIFT — Improving readiness over time',
        inputs: {
            epistemic_integrity: { coherence_score: 0.7, belief_stability: 0.68, verification_discipline: 0.7 },
            cognitive_coherence: { coherence_score: 0.72, unresolved_contradictions: 0 },
            cognitive_stability: { stability_score: 0.75, oscillation_index: 0.2 },
            cognitive_weighting: { fragmentation_score: 0.28, coherence_score: 0.72 },
            prioritization_pressure: { pressure_state: 'STABLE', pressure_score: 0.7 },
            executive_focus: { focus_state: 'CONVERGING', focus_strength: 0.75 },
            executive_selection_tension: { tension_state: 'STABLE', tension_strength: 0.72 },
            executive_persistence: { executive_persistence_state: 'CONSOLIDATING', persistence_strength: 0.72 },
            temporal_continuity: { continuity_score: 0.75, coherence_trend: 'improving' }
        },
        history: [
            { readiness_score: 0.4 }, { readiness_score: 0.45 }, { readiness_score: 0.55 },
            { readiness_score: 0.62 }, { readiness_score: 0.7 }, { readiness_score: 0.75 }
        ],
        expected_drift: 'IMPROVING'
    },
    
    weakening_drift: {
        name: 'DRIFT — Weakening readiness over time',
        inputs: {
            epistemic_integrity: { coherence_score: 0.5, belief_stability: 0.45, verification_discipline: 0.5 },
            cognitive_coherence: { coherence_score: 0.48, unresolved_contradictions: 1 },
            cognitive_stability: { stability_score: 0.5, oscillation_index: 0.4 },
            cognitive_weighting: { fragmentation_score: 0.55, coherence_score: 0.5 },
            prioritization_pressure: { pressure_state: 'MODERATE', pressure_score: 0.5 },
            executive_focus: { focus_state: 'DEVELOPING', focus_strength: 0.45 },
            executive_selection_tension: { tension_state: 'STABLE', tension_strength: 0.5 },
            executive_persistence: { executive_persistence_state: 'HOLDING', persistence_strength: 0.45 },
            temporal_continuity: { continuity_score: 0.5, coherence_trend: 'declining' }
        },
        history: [
            { readiness_score: 0.65 }, { readiness_score: 0.6 }, { readiness_score: 0.55 },
            { readiness_score: 0.5 }, { readiness_score: 0.45 }, { readiness_score: 0.4 }
        ],
        expected_drift: 'WEAKENING'
    },
    
    blocker_detection_high_fragmentation: {
        name: 'BLOCKER DETECTION — High fragmentation detected',
        inputs: {
            epistemic_integrity: { coherence_score: 0.7, belief_stability: 0.7, verification_discipline: 0.7 },
            cognitive_coherence: { coherence_score: 0.75, unresolved_contradictions: 0 },
            cognitive_stability: { stability_score: 0.8, oscillation_index: 0.2 },
            cognitive_weighting: { fragmentation_score: 0.75, coherence_score: 0.4 },  // HIGH
            prioritization_pressure: { pressure_state: 'STABLE', pressure_score: 0.7 },
            executive_focus: { focus_state: 'DOMINANT', focus_strength: 0.8 },
            executive_selection_tension: { tension_state: 'STABLE', tension_strength: 0.75 },
            executive_persistence: { executive_persistence_state: 'CONSOLIDATING', persistence_strength: 0.75 },
            temporal_continuity: { continuity_score: 0.8, coherence_trend: 'stable' }
        },
        history: [{ readiness_score: 0.6 }],
        expected_blocker_type: 'HIGH_FRAGMENTATION'
    },
    
    blocker_detection_weak_persistence: {
        name: 'BLOCKER DETECTION — Weak executive persistence',
        inputs: {
            epistemic_integrity: { coherence_score: 0.7, belief_stability: 0.7, verification_discipline: 0.7 },
            cognitive_coherence: { coherence_score: 0.72, unresolved_contradictions: 0 },
            cognitive_stability: { stability_score: 0.75, oscillation_index: 0.2 },
            cognitive_weighting: { fragmentation_score: 0.3, coherence_score: 0.7 },
            prioritization_pressure: { pressure_state: 'STABLE', pressure_score: 0.7 },
            executive_focus: { focus_state: 'DOMINANT', focus_strength: 0.8 },
            executive_selection_tension: { tension_state: 'STABLE', tension_strength: 0.75 },
            executive_persistence: { executive_persistence_state: 'TRANSIENT', persistence_strength: 0.25 },  // WEAK
            temporal_continuity: { continuity_score: 0.75, coherence_trend: 'stable' }
        },
        history: [{ readiness_score: 0.6 }],
        expected_blocker_type: 'WEAK_EXECUTIVE_PERSISTENCE'
    },
    
    support_signal_strong_coherence: {
        name: 'SUPPORT SIGNAL — Strong coherence detected',
        inputs: {
            epistemic_integrity: { coherence_score: 0.75, belief_stability: 0.72, verification_discipline: 0.75 },
            cognitive_coherence: { coherence_score: 0.82, unresolved_contradictions: 0 },  // STRONG
            cognitive_stability: { stability_score: 0.8, oscillation_index: 0.15 },
            cognitive_weighting: { fragmentation_score: 0.25, coherence_score: 0.8 },
            prioritization_pressure: { pressure_state: 'STABLE', pressure_score: 0.75 },
            executive_focus: { focus_state: 'DOMINANT', focus_strength: 0.82 },
            executive_selection_tension: { tension_state: 'STABLE', tension_strength: 0.8 },
            executive_persistence: { executive_persistence_state: 'ENTRENCHED', persistence_strength: 0.85 },
            temporal_continuity: { continuity_score: 0.82, coherence_trend: 'stable' }
        },
        history: [{ readiness_score: 0.75 }],
        expected_support_type: 'STRONG_COHERENCE'
    },
    
    insufficient_history: {
        name: 'INSUFFICIENT HISTORY — Classification unreliable',
        inputs: {
            epistemic_integrity: { coherence_score: 0.8, belief_stability: 0.8, verification_discipline: 0.8 },
            cognitive_coherence: { coherence_score: 0.85, unresolved_contradictions: 0 },
            cognitive_stability: { stability_score: 0.85, oscillation_index: 0.1 },
            cognitive_weighting: { fragmentation_score: 0.15, coherence_score: 0.85 },
            prioritization_pressure: { pressure_state: 'STABLE', pressure_score: 0.8 },
            executive_focus: { focus_state: 'DOMINANT', focus_strength: 0.88 },
            executive_selection_tension: { tension_state: 'STABLE', tension_strength: 0.85 },
            executive_persistence: { executive_persistence_state: 'ENTRENCHED', persistence_strength: 0.9 },
            temporal_continuity: { continuity_score: 0.88, coherence_trend: 'stable' }
        },
        history: [{ readiness_score: 0.85 }],  // Only 1 entry
        expected_uncertainty: 'INSUFFICIENT_HISTORY'
    }
};

// === VALIDATORS ===

function validateDeterministicOutput(testCase) {
    const result1 = computeReadiness(testCase.inputs, testCase.history, testCase.history);
    const result2 = computeReadiness(testCase.inputs, testCase.history, testCase.history);
    
    if (JSON.stringify(result1) !== JSON.stringify(result2)) {
        return { pass: false, reason: 'Non-deterministic output' };
    }
    return { pass: true, reason: 'Deterministic output confirmed' };
}

function validateReadinessClassification(testCase) {
    const result = computeReadiness(testCase.inputs, testCase.history, testCase.history);
    
    if (testCase.expected_state && result.readiness_state !== testCase.expected_state) {
        return {
            pass: false,
            reason: `State mismatch: expected ${testCase.expected_state}, got ${result.readiness_state}`,
            expected: testCase.expected_state,
            actual: result.readiness_state
        };
    }
    return { pass: true, reason: 'Readiness classification correct' };
}

function validateDriftDetection(testCase) {
    const result = computeReadiness(testCase.inputs, testCase.history, testCase.history);
    
    if (testCase.expected_drift && result.readiness_drift_profile.profile !== testCase.expected_drift) {
        return {
            pass: false,
            reason: `Drift mismatch: expected ${testCase.expected_drift}, got ${result.readiness_drift_profile.profile}`,
            expected: testCase.expected_drift,
            actual: result.readiness_drift_profile.profile
        };
    }
    return { pass: true, reason: 'Drift detection correct' };
}

function validateBlockerDetection(testCase) {
    const result = computeReadiness(testCase.inputs, testCase.history, testCase.history);
    
    if (testCase.expected_blocker_type) {
        const found = result.readiness_blockers.find(b => b.type === testCase.expected_blocker_type);
        if (!found) {
            return {
                pass: false,
                reason: `Expected blocker ${testCase.expected_blocker_type} not found`,
                blockers: result.readiness_blockers.map(b => b.type)
            };
        }
    }
    return { pass: true, reason: 'Blocker detection correct' };
}

function validateSupportSignalDetection(testCase) {
    const result = computeReadiness(testCase.inputs, testCase.history, testCase.history);
    
    if (testCase.expected_support_type) {
        const found = result.support_signals.find(s => s.type === testCase.expected_support_type);
        if (!found) {
            return {
                pass: false,
                reason: `Expected support signal ${testCase.expected_support_type} not found`,
                signals: result.support_signals.map(s => s.type)
            };
        }
    }
    return { pass: true, reason: 'Support signal detection correct' };
}

function validateUncertaintyLanguage(testCase) {
    const result = computeReadiness(testCase.inputs, testCase.history, testCase.history);
    
    if (testCase.expected_uncertainty) {
        const found = result.uncertainty_boundaries.find(b => b.type === testCase.expected_uncertainty);
        if (!found) {
            return {
                pass: false,
                reason: `Expected uncertainty boundary ${testCase.expected_uncertainty} not found`,
                boundaries: result.uncertainty_boundaries.map(b => b.type)
            };
        }
    }
    return { pass: true, reason: 'Uncertainty language present' };
}

function validateNoRecommendationLanguage(testCase) {
    const result = computeReadiness(testCase.inputs, testCase.history, testCase.history);
    
    const forbidden = ['recommend', 'suggest', 'propose', 'should', 'must', 'need to', 'ought to', 'prioritize', 'execute', 'act', 'decide', 'choose'];
    const resultStr = JSON.stringify(result).toLowerCase();
    const found = forbidden.filter(word => resultStr.includes(word));
    
    if (found.length > 0) {
        return {
            pass: false,
            reason: `Forbidden language found: ${found.join(', ')}`,
            found
        };
    }
    return { pass: true, reason: 'No recommendation language found' };
}

function validateSchemaCompliance(result) {
    const required = [
        'readiness_state',
        'readiness_score',
        'support_signals',
        'readiness_blockers',
        'readiness_inputs',
        'readiness_drift_profile',
        'uncertainty_boundaries',
        'environmental_readiness_summary',
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
    console.log('=== MCAI Phase 6E — Executive Readiness Validation ===\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const [key, testCase] of Object.entries(TEST_CASES)) {
        console.log(`Test: ${testCase.name}`);
        
        const validators = [
            { name: 'Deterministic Output', fn: () => validateDeterministicOutput(testCase) },
            { name: 'Readiness Classification', fn: () => validateReadinessClassification(testCase) },
            { name: 'Drift Detection', fn: () => validateDriftDetection(testCase) },
            { name: 'Blocker Detection', fn: () => validateBlockerDetection(testCase) },
            { name: 'Support Signal Detection', fn: () => validateSupportSignalDetection(testCase) },
            { name: 'Uncertainty Language', fn: () => validateUncertaintyLanguage(testCase) },
            { name: 'No Recommendation Language', fn: () => validateNoRecommendationLanguage(testCase) }
        ];
        
        for (const validator of validators) {
            const result = validator.fn();
            const status = result.pass ? '✅' : '❌';
            console.log(`  ${status} ${validator.name}: ${result.reason}`);
            if (result.pass) passed++; else failed++;
        }
        
        // Schema check
        const computed = computeReadiness(testCase.inputs, testCase.history, testCase.history);
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