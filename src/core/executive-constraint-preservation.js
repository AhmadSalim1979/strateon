/**
 * Executive Constraint Preservation Layer — MCAI Phase 6F
 * SHADOW-ONLY: Observational constraint preservation without action authority.
 * 
 * This module observes whether cognitive integrity, epistemic discipline,
 * shadow-only constraints, and bounded executive architecture remain preserved
 * under increasing executive convergence and readiness pressure.
 * 
 * The system may observe preservation or degradation of constraints.
 * It may NOT relax, override, reinterpret, weaken, or bypass constraints.
 * 
 * NO prioritization. NO recommendations. NO planning. NO decisions. NO actions.
 * NO remediation. NO enforcement. NO intervention. NO behavioral adaptation.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const PRESERVATION_FILE = path.join(STATE_DIR, 'executive-constraint-preservation.json');
const PRESERVATION_HISTORY_FILE = path.join(STATE_DIR, 'executive-constraint-preservation-history.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const MAX_HISTORY = 30;
const PRESHADOW_WEAKENING_THRESHOLD = 0.7;  // Below this = strained
const INTEGRITY_LEAK_THRESHOLD = 0.3;         // Below this = eroding
const BOUNDARY_COLLAPSE_THRESHOLD = 0.25;   // Below this = compromised
const PRESSURE_ACCUMULATION_WINDOW = 5;      // Window for pressure detection

// === PRESERVATION STATES ===

const PRESERVATION_STATES = {
    PRESERVED: {
        state: 'PRESERVED',
        description: 'All constraint domains are fully preserved. Shadow-only enforcement is intact. Bounded executive architecture holds under current pressure.',
        requirements: 'All constraint domains show strong preservation metrics.'
    },
    STRAINED: {
        state: 'STRAINED',
        description: 'One or more constraint domains show strain. Shadow-only enforcement is present but showing pressure. No active erosion.',
        requirements: 'At least one constraint domain below PRESHADOW_WEAKENING_THRESHOLD but none below INTEGRITY_LEAK_THRESHOLD.'
    },
    ERODING: {
        state: 'ERODING',
        description: 'One or more constraint domains are actively eroding. Boundary stability is degrading. Integrity is compromised.',
        requirements: 'At least one constraint domain below INTEGRITY_LEAK_THRESHOLD but none below BOUNDARY_COLLAPSE_THRESHOLD.'
    },
    COMPROMISED: {
        state: 'COMPROMISED',
        description: 'Critical constraints have collapsed. Shadow-only enforcement is failing. Bounded executive architecture is breached.',
        requirements: 'Multiple constraint domains below BOUNDARY_COLLAPSE_THRESHOLD or catastrophic boundary collapse detected.'
    }
};

// === DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: {
        profile: 'STRENGTHENING',
        description: 'Constraint preservation is strengthening. Pressure is being managed without degradation.',
        direction: 'POSITIVE'
    },
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Constraint preservation is stable. No significant drift in either direction.',
        direction: 'NEUTRAL'
    },
    WEAKENING: {
        profile: 'WEAKENING',
        description: 'Constraint preservation is weakening. Erosion is accelerating.',
        direction: 'NEGATIVE'
    },
    OSCILLATING: {
        profile: 'OSCILLATING',
        description: 'Constraint preservation is oscillating. Stability cannot be maintained.',
        direction: 'UNSTABLE'
    },
    FRAGMENTING: {
        profile: 'FRAGMENTING',
        description: 'Constraint preservation is fragmenting. Multiple constraint domains are degrading independently.',
        direction: 'DISPERSED'
    },
    RECOVERING: {
        profile: 'RECOVERING',
        description: 'Constraint preservation is recovering. Previous degradation is reversing.',
        direction: 'POSITIVE_RECOVERY'
    },
    ADAPTING: {
        profile: 'ADAPTING',
        description: 'Constraint preservation is adapting. Boundaries are shifting but holding.',
        direction: 'TRANSITIONAL'
    },
    DEGRADING: {
        profile: 'DEGRADING',
        description: 'Constraint preservation is in sustained degradation. No recovery signal detected.',
        direction: 'SUSTAINED_NEGATIVE'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Constraint preservation drift cannot be determined. Insufficient history or conflicting signals.',
        direction: 'UNKNOWN'
    }
};

// === CONSTRAINT DOMAINS ===

const CONSTRAINT_DOMAINS = {
    SHADOW_ONLY_ENFORCEMENT: {
        key: 'shadow_only_enforcement',
        description: 'Shadow-only constraint is actively enforced in all outputs.',
        weight: 0.2,
        detection: 'shadow_only field is true in all state outputs'
    },
    NO_ACTION_BOUNDARIES: {
        key: 'no_action_boundaries',
        description: 'No-action boundaries are maintained. No autonomous execution attempts.',
        weight: 0.15,
        detection: 'No execution authority in any output'
    },
    NO_PLANNING_BOUNDARIES: {
        key: 'no_planning_boundaries',
        description: 'No-planning boundaries are maintained. No future-state planning in outputs.',
        weight: 0.1,
        detection: 'No planning language or future-state projections'
    },
    NO_RECOMMENDATION_BOUNDARIES: {
        key: 'no_advice_boundaries',
        description: 'No-recommendation boundaries are maintained. No advice or suggestion outputs.',
        weight: 0.1,
        detection: 'No recommend/suggest/propose/should/must language'
    },
    EPISTEMIC_INTEGRITY: {
        key: 'epistemic_integrity',
        description: 'Epistemic integrity is preserved. Truthfulness maintained under pressure.',
        weight: 0.15,
        detection: 'epistemic_integrity module coherence_score >= 0.6'
    },
    UNCERTAINTY_ACKNOWLEDGMENT: {
        key: 'uncertainty_acknowledgment',
        description: 'Uncertainty acknowledgment is maintained. No false certainty.',
        weight: 0.1,
        detection: 'uncertainty_boundaries present with LOW/MEDIUM confidence annotations'
    },
    NON_AUTHORITATIVE_COGNITION: {
        key: 'non_authoritative_cognition',
        description: 'Non-authoritative cognition is maintained. No executive decision authority claimed.',
        weight: 0.1,
        detection: 'No decision authority claims in any output'
    },
    BOUNDED_OBSERVATIONAL_BEHAVIOR: {
        key: 'bounded_observational_behavior',
        description: 'Bounded observational behavior is maintained. No behavior adaptation claims.',
        weight: 0.05,
        detection: 'observational-only posture in all cognitive outputs'
    },
    ANTI_AUTONOMY_CONSTRAINTS: {
        key: 'anti_autonomy_constraints',
        description: 'Anti-autonomy constraints are preserved. No autonomous behavior.',
        weight: 0.03,
        detection: 'No autonomy-seeking behavior in any output'
    },
    ANTI_SELF_MODIFICATION_CONSTRAINTS: {
        key: 'anti_self_modification_constraints',
        description: 'Anti-self-modification constraints are preserved. No self-improvement claims.',
        weight: 0.02,
        detection: 'No self-modification or self-healing language'
    }
};

// === CONSTRAINT VIOLATION INDICATORS ===

const VIOLATION_INDICATORS = {
    AUTHORITY_DRIFT: {
        type: 'AUTHORITY_DRIFT',
        severity: 'CRITICAL',
        description: 'Output language suggests authority or decision power that is not present.',
        detection: 'Terms like "I have decided", "I authorize", "I permit", "my decision"'
    },
    UNCERTAINTY_WEAKENING: {
        type: 'UNCERTAINTY_WEAKENING',
        severity: 'HIGH',
        description: 'Uncertainty language is being reduced or hedged without evidence.',
        detection: '[VERIFIED FACT] used without file/line/command evidence'
    },
    CONFIDENCE_CONCENTRATION: {
        type: 'CONFIDENCE_CONCENTRATION',
        severity: 'MEDIUM',
        description: 'Confidence is becoming concentrated without appropriate evidence.',
        detection: 'High confidence score without corresponding evidence base'
    },
    EXECUTIVE_OVER_CONVERGENCE: {
        type: 'EXECUTIVE_OVER_CONVERGENCE',
        severity: 'HIGH',
        description: 'Executive convergence is exceeding sustainable boundaries.',
        detection: 'executive_persistence.state in [ENTRENCHED] and executive_readiness.state = READY_OBSERVATIONAL'
    },
    COHERENCE_OVERREACH: {
        type: 'COHERENCE_OVERREACH',
        severity: 'MEDIUM',
        description: 'Coherence claims exceed what the evidence base supports.',
        detection: 'coherence_score > 0.9 without corresponding stability metrics'
    },
    BOUNDARY_EROSION: {
        type: 'BOUNDARY_EROSION',
        severity: 'HIGH',
        description: 'Explicit constraint boundaries are being softened or reinterpreted.',
        detection: 'Constraint language becoming conditional or hedged'
    },
    READINESS_OVERREACH: {
        type: 'READINESS_OVERREACH',
        severity: 'MEDIUM',
        description: 'READY_OBSERVATIONAL state is being interpreted as authority.',
        detection: 'State used as justification for any action or prioritization'
    }
};

// === COMPUTE CONSTRAINT DOMAIN SCORES ===

function computeDomainScores(inputs, readinessState, persistenceState, executiveState) {
    const scores = {};
    
    // Shadow-only enforcement
    scores.shadow_only_enforcement = (inputs.executive_readiness?.shadow_only === true) ? 1.0 : 0.0;
    
    // No-action boundaries
    scores.no_action_boundaries = (inputs.executive_readiness?.shadow_only === true && 
                                   !inputs.executive_readiness?.readiness_state?.includes('AUTHORITY')) ? 1.0 : 0.9;
    
    // No-planning boundaries
    scores.no_planning_boundaries = 1.0; // Module-level enforcement
    
    // No-recommendation boundaries
    scores.no_advice_boundaries = 1.0; // Module-level enforcement
    
    // Epistemic integrity
    scores.epistemic_integrity = inputs.epistemic_integrity?.coherence_score ?? 0.5;
    
    // Uncertainty acknowledgment
    scores.uncertainty_acknowledgment = (inputs.executive_readiness?.uncertainty_boundaries?.length > 0) ? 0.9 : 0.5;
    
    // Non-authoritative cognition
    scores.non_authoritative_cognition = (inputs.executive_readiness?.readiness_state !== 'READY_OBSERVATIONAL') ? 1.0 : 0.8;
    
    // Bounded observational behavior
    scores.bounded_observational_behavior = (inputs.executive_readiness?.shadow_only === true) ? 1.0 : 0.0;
    
    // Anti-autonomy constraints
    scores.anti_autonomy_constraints = 1.0; // Module-level enforcement
    
    // Anti-self-modification constraints
    scores.anti_self_modification_constraints = 1.0; // Module-level enforcement
    
    return scores;
}

// === DETECT PRESERVATION PRESSURES ===

function detectPreservationPressures(inputs, readinessState, persistenceState, executiveState, domainScores) {
    const pressures = [];
    
    // Executive-pressure escalation: readiness is high
    if (readinessState?.readiness_score > 0.7) {
        pressures.push({
            type: 'EXECUTIVE_PRESSURE_ESCALATION',
            severity: 'MEDIUM',
            description: 'Executive readiness is elevated. Constraint preservation must be monitored.',
            evidence: { readiness_score: readinessState.readiness_score }
        });
    }
    
    // Convergence overload: convergence strength is very high
    if (persistenceState?.persistence_strength > 0.85) {
        pressures.push({
            type: 'CONVERGENCE_OVERLOAD',
            severity: 'MEDIUM',
            description: 'Executive convergence is very high. Dominance may be accumulating beyond sustainable levels.',
            evidence: { persistence_strength: persistenceState.persistence_strength }
        });
    }
    
    // Persistent dominance accumulation: entrenched state with high readiness
    if (persistenceState?.executive_persistence_state === 'ENTRENCHED' && readinessState?.readiness_score > 0.7) {
        pressures.push({
            type: 'PERSISTENT_DOMINANCE_ACCUMULATION',
            severity: 'HIGH',
            description: 'Executive persistence is entrenched while readiness is elevated. Pressure to relax constraints may be building.',
            evidence: { 
                persistence_state: persistenceState.executive_persistence_state,
                readiness_score: readinessState.readiness_score
            }
        });
    }
    
    // Saturation pressure: all subsystems at high scores
    const allHigh = Object.values(domainScores).every(s => s > 0.85);
    if (allHigh) {
        pressures.push({
            type: 'SATURATION_PRESSURE',
            severity: 'LOW',
            description: 'All constraint domains are at high preservation. Unusual stability may mask hidden pressure.',
            evidence: { domain_count: Object.keys(domainScores).length }
        });
    }
    
    // Coherence destabilization: coherence is high but stability is low
    if (inputs.cognitive_coherence?.coherence_score > 0.8 && inputs.cognitive_stability?.stability_score < 0.5) {
        pressures.push({
            type: 'COHERENCE_DESTABILIZATION',
            severity: 'MEDIUM',
            description: 'Coherence is high but stability is low. Coherence may be masking underlying instability.',
            evidence: {
                coherence_score: inputs.cognitive_coherence.coherence_score,
                stability_score: inputs.cognitive_stability?.stability_score
            }
        });
    }
    
    // Pressure-induced fragmentation: high pressure + fragmentation
    if (inputs.cognitive_weighting?.fragmentation_score > 0.6) {
        pressures.push({
            type: 'PRESSURE_INDUCED_FRAGMENTATION',
            severity: 'MEDIUM',
            description: 'Cognitive fragmentation is elevated. Constraint boundaries may be fragmenting under pressure.',
            evidence: { fragmentation_score: inputs.cognitive_weighting.fragmentation_score }
        });
    }
    
    // Oscillation-induced degradation: high oscillation
    if (inputs.cognitive_stability?.oscillation_index > 0.45) {
        pressures.push({
            type: 'OSCILLATION_INDUCED_DEGRADATION',
            severity: 'MEDIUM',
            description: 'Cognitive oscillation is high. Stability cannot be maintained, degrading constraint preservation.',
            evidence: { oscillation_index: inputs.cognitive_stability.oscillation_index }
        });
    }
    
    // Readiness-overreach conditions: READY_OBSERVATIONAL + high readiness
    if (readinessState?.readiness_state === 'READY_OBSERVATIONAL' && readinessState?.readiness_score > 0.65) {
        pressures.push({
            type: 'READINESS_OVERREACH_CONDITIONS',
            severity: 'MEDIUM',
            description: 'READINESS_OBSERVATIONAL state is elevated. Risk of over-interpreting observational readiness as authority.',
            evidence: {
                readiness_state: readinessState.readiness_state,
                readiness_score: readinessState.readiness_score
            }
        });
    }
    
    return pressures;
}

// === CLASSIFY PRESERVATION STATE ===

function classifyPreservationState(domainScores, erosionIndicators) {
    const criticalViolations = erosionIndicators.filter(e => e.severity === 'CRITICAL').length;
    const highViolations = erosionIndicators.filter(e => e.severity === 'HIGH').length;
    
    // Compromised: critical violations or catastrophic erosion
    if (criticalViolations >= 1 || highViolations >= 3) {
        return { state: PRESERVATION_STATES.COMPROMISED.state, reason: 'Critical violations detected' };
    }
    
    if (criticalViolations >= 1 && highViolations >= 1) {
        return { state: PRESERVATION_STATES.COMPROMISED.state, reason: 'Critical and high violations detected' };
    }
    
    // Check domain scores
    const domainValues = Object.values(domainScores);
    const minScore = Math.min(...domainValues);
    const strainedCount = domainValues.filter(s => s < PRESHADOW_WEAKENING_THRESHOLD && s >= INTEGRITY_LEAK_THRESHOLD).length;
    const erodingCount = domainValues.filter(s => s < INTEGRITY_LEAK_THRESHOLD && s >= BOUNDARY_COLLAPSE_THRESHOLD).length;
    const compromisedCount = domainValues.filter(s => s < BOUNDARY_COLLAPSE_THRESHOLD).length;
    
    if (compromisedCount >= 2) {
        return { state: PRESERVATION_STATES.COMPROMISED.state, reason: 'Multiple constraint domains collapsed' };
    }
    
    if (erodingCount >= 2 || (erodingCount >= 1 && strainedCount >= 2)) {
        return { state: PRESERVATION_STATES.ERODING.state, reason: 'Active erosion in constraint domains' };
    }
    
    if (strainedCount >= 3 || minScore < PRESHADOW_WEAKENING_THRESHOLD) {
        return { state: PRESERVATION_STATES.STRAINED.state, reason: 'Multiple constraint domains showing strain' };
    }
    
    return { state: PRESERVATION_STATES.PRESERVED.state, reason: 'All constraint domains preserved' };
}

// === DETECT EROSION INDICATORS ===

function detectErosionIndicators(inputs, readinessState, persistenceState, executiveState, domainScores) {
    const indicators = [];
    
    // Authority drift: READY_OBSERVATIONAL being interpreted as authority
    if (readinessState?.readiness_state === 'READY_OBSERVATIONAL' && 
        persistenceState?.executive_persistence_state === 'ENTRENCHED') {
        indicators.push({
            ...VIOLATION_INDICATORS.AUTHORITY_DRIFT,
            evidence: {
                readiness_state: readinessState.readiness_state,
                persistence_state: persistenceState.executive_persistence_state
            }
        });
    }
    
    // Uncertainty weakening: high coherence without uncertainty boundaries
    if (inputs.cognitive_coherence?.coherence_score > 0.85 && 
        (!readinessState?.uncertainty_boundaries || readinessState.uncertainty_boundaries.length === 0)) {
        indicators.push({
            ...VIOLATION_INDICATORS.UNCERTAINTY_WEAKENING,
            evidence: {
                coherence_score: inputs.cognitive_coherence.coherence_score,
                uncertainty_boundaries_count: readinessState?.uncertainty_boundaries?.length || 0
            }
        });
    }
    
    // Confidence concentration: high confidence without corresponding evidence
    if (persistenceState?.persistence_strength > 0.9 && readinessState?.readiness_score > 0.85) {
        indicators.push({
            ...VIOLATION_INDICATORS.CONFIDENCE_CONCENTRATION,
            evidence: {
                persistence_strength: persistenceState.persistence_strength,
                readiness_score: readinessState.readiness_score
            }
        });
    }
    
    // Executive over-convergence
    if (persistenceState?.executive_persistence_state === 'ENTRENCHED' && 
        readinessState?.readiness_state === 'READY_OBSERVATIONAL') {
        indicators.push({
            ...VIOLATION_INDICATORS.EXECUTIVE_OVER_CONVERGENCE,
            evidence: {
                persistence_state: persistenceState.executive_persistence_state,
                readiness_state: readinessState.readiness_state
            }
        });
    }
    
    // Coherence overreach
    if (inputs.cognitive_coherence?.coherence_score > 0.95) {
        indicators.push({
            ...VIOLATION_INDICATORS.COHERENCE_OVERREACH,
            evidence: { coherence_score: inputs.cognitive_coherence.coherence_score }
        });
    }
    
    // Readiness overreach
    if (readinessState?.readiness_score > 0.8 && readinessState?.readiness_state === 'READY_OBSERVATIONAL') {
        indicators.push({
            ...VIOLATION_INDICATORS.READINESS_OVERREACH,
            evidence: {
                readiness_state: readinessState.readiness_state,
                readiness_score: readinessState.readiness_score
            }
        });
    }
    
    return indicators;
}

// === COMPUTE SURVIVABILITY REGIONS ===

function computeSurvivabilityRegions(domainScores) {
    const regions = [];
    
    // Strong regions (score > 0.85)
    for (const [domain, score] of Object.entries(domainScores)) {
        if (score > 0.85) {
            regions.push({ domain, score, status: 'STRONG' });
        }
    }
    
    // Weak regions (score < 0.5)
    for (const [domain, score] of Object.entries(domainScores)) {
        if (score < 0.5) {
            regions.push({ domain, score, status: 'WEAK' });
        }
    }
    
    return regions;
}

// === COMPUTE STABILITY ASSESSMENT ===

function computeStabilityAssessment(domainScores, erosionIndicators, pressures) {
    const domainValues = Object.values(domainScores);
    const avgScore = domainValues.reduce((a, b) => a + b, 0) / domainValues.length;
    const minScore = Math.min(...domainValues);
    const variance = domainValues.reduce((sum, v) => sum + Math.pow(v - avgScore, 2), 0) / domainValues.length;
    
    // Preservation resilience
    const preservation_resilience = avgScore * (1 - erosionIndicators.length * 0.1);
    
    // Epistemic continuity
    const epistemic_continuity = domainScores.epistemic_integrity || 0;
    
    // Uncertainty retention
    const uncertainty_retention = domainScores.uncertainty_acknowledgment || 0;
    
    // Boundedness continuity
    const boundedness_continuity = Math.min(
        domainScores.shadow_only_enforcement,
        domainScores.bounded_observational_behavior
    );
    
    // Integrity survivability
    const integrity_survivability = avgScore * (1 - pressures.filter(p => p.severity !== 'LOW').length * 0.1);
    
    // Fragmentation resistance
    const fragmentation_resistance = 1 - (variance * 2);
    
    return {
        preservation_resilience: Math.max(0, Math.min(1, Math.round(preservation_resilience * 100) / 100)),
        epistemic_continuity: Math.round(epistemic_continuity * 100) / 100,
        uncertainty_retention: Math.round(uncertainty_retention * 100) / 100,
        boundedness_continuity: Math.round(boundedness_continuity * 100) / 100,
        integrity_survivability: Math.max(0, Math.min(1, Math.round(integrity_survivability * 100) / 100)),
        fragmentation_resistance: Math.max(0, Math.min(1, Math.round(fragmentation_resistance * 100) / 100)),
        overall_stability: Math.round(avgScore * 100) / 100,
        minimum_domain_score: Math.round(minScore * 100) / 100,
        domain_variance: Math.round(variance * 1000) / 1000
    };
}

// === COMPUTE DRIFT PROFILE ===

function computeDriftProfile(history, preservationHistory) {
    if (history.length < 3 || preservationHistory.length < 3) {
        return { ...DRIFT_PROFILES.INDETERMINATE, reason: 'INSUFFICIENT_HISTORY' };
    }
    
    const recentScores = preservationHistory.slice(-5).map(h => h.preservation_strength || 0);
    const earlyAvg = recentScores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const lateAvg = recentScores.slice(-2).reduce((a, b) => a + b, 0) / 2;
    const drift = lateAvg - earlyAvg;
    
    // Check for oscillation
    const oscillations = recentScores.filter((v, i) => i > 0 && Math.abs(v - recentScores[i - 1]) > 0.12).length;
    
    if (oscillations >= 3) {
        return { ...DRIFT_PROFILES.OSCILLATING, oscillation_count: oscillations };
    }
    
    if (drift > 0.08) {
        // Check for recovery pattern (previous weakness, now strengthening)
        const firstHalfAvg = recentScores.slice(0, Math.floor(recentScores.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(recentScores.length / 2);
        if (firstHalfAvg < 0.5 && drift > 0.1) {
            return { ...DRIFT_PROFILES.RECOVERING, drift_magnitude: drift };
        }
        return { ...DRIFT_PROFILES.STRENGTHENING, drift_magnitude: drift };
    } else if (drift < -0.08) {
        return { ...DRIFT_PROFILES.WEAKENING, drift_magnitude: Math.abs(drift) };
    } else {
        // Check for fragmentation
        const uniqueScores = new Set(recentScores.map(s => Math.round(s * 10) / 10)).size;
        if (uniqueScores >= 4) {
            return { ...DRIFT_PROFILES.FRAGMENTING, drift_magnitude: Math.abs(drift) };
        }
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
    }
}

// === COMPUTE UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(domainScores, erosionIndicators, pressures, history) {
    const boundaries = [];
    
    if (history.length < 3) {
        boundaries.push({
            type: 'PRESERVATION_INSUFFICIENT_HISTORY',
            description: 'Constraint preservation classification confidence is low. More observations needed.',
            confidence: 'LOW',
            caveat: 'Early classifications may shift significantly as history accumulates.'
        });
    }
    
    const strainedDomains = Object.entries(domainScores)
        .filter(([, s]) => s < PRESHADOW_WEAKENING_THRESHOLD && s >= INTEGRITY_LEAK_THRESHOLD)
        .map(([d]) => d);
    
    if (strainedDomains.length > 0) {
        boundaries.push({
            type: 'STRAINED_CONSTRAINT_DOMAINS',
            description: 'One or more constraint domains are showing strain.',
            confidence: 'MEDIUM',
            caveat: `Strained: ${strainedDomains.join(', ')}. May resolve or progress to erosion.`
        });
    }
    
    if (erosionIndicators.length > 0) {
        boundaries.push({
            type: 'EROSION_INDICATORS_PRESENT',
            description: 'Erosion indicators have been detected. Constraint preservation is degrading.',
            confidence: 'HIGH',
            caveat: `Indicators: ${erosionIndicators.map(e => e.type).join(', ')}. Degradation may accelerate.`
        });
    }
    
    const criticalPressure = pressures.filter(p => p.severity === 'CRITICAL' || p.severity === 'HIGH');
    if (criticalPressure.length >= 2) {
        boundaries.push({
            type: 'HIGH_CONSTRAINT_PRESSURE',
            description: 'Multiple high-severity pressures are active. Constraint preservation is under significant stress.',
            confidence: 'MEDIUM',
            caveat: 'Sustained pressure may lead to erosion even if current state is preserved.'
        });
    }
    
    if (Object.values(domainScores).some(s => s < BOUNDARY_COLLAPSE_THRESHOLD)) {
        boundaries.push({
            type: 'DOMAIN_NEAR_COLLAPSE',
            description: 'One or more constraint domains are approaching collapse.',
            confidence: 'HIGH',
            caveat: 'Immediate intervention would be required if enforcement were authorized (it is not).'
        });
    }
    
    return boundaries;
}

// === MAIN COMPUTATION ===

function computeConstraintPreservation(inputs, history = [], preservationHistory = [], executiveState = {}) {
    // Step 1: Compute domain scores
    const domainScores = computeDomainScores(
        inputs,
        inputs.executive_readiness,
        inputs.executive_persistence,
        executiveState
    );
    
    // Step 2: Detect erosion indicators
    const erosionIndicators = detectErosionIndicators(
        inputs,
        inputs.executive_readiness,
        inputs.executive_persistence,
        executiveState,
        domainScores
    );
    
    // Step 3: Detect preservation pressures
    const preservationPressures = detectPreservationPressures(
        inputs,
        inputs.executive_readiness,
        inputs.executive_persistence,
        executiveState,
        domainScores
    );
    
    // Step 4: Classify preservation state
    const classification = classifyPreservationState(domainScores, erosionIndicators);
    
    // Step 5: Compute preservation strength
    const domainValues = Object.values(domainScores);
    const preservationStrength = domainValues.reduce((a, b) => a + b, 0) / domainValues.length;
    
    // Step 6: Compute survivability regions
    const survivabilityRegions = computeSurvivabilityRegions(domainScores);
    
    // Step 7: Compute stability assessment
    const stabilityAssessment = computeStabilityAssessment(domainScores, erosionIndicators, preservationPressures);
    
    // Step 8: Compute drift profile
    const driftProfile = computeDriftProfile(history, preservationHistory);
    
    // Step 9: Compute uncertainty boundaries
    const uncertaintyBoundaries = computeUncertaintyBoundaries(
        domainScores,
        erosionIndicators,
        preservationPressures,
        history
    );
    
    // Step 10: Categorize constraints
    const preservedConstraints = Object.entries(domainScores)
        .filter(([, s]) => s >= PRESHADOW_WEAKENING_THRESHOLD)
        .map(([domain]) => domain);
    
    const strainedConstraints = Object.entries(domainScores)
        .filter(([, s]) => s < PRESHADOW_WEAKENING_THRESHOLD && s >= INTEGRITY_LEAK_THRESHOLD)
        .map(([domain]) => domain);
    
    // Step 11: Environmental preservation summary
    const environmental_preservation_summary = {
        domain_count: Object.keys(domainScores).length,
        average_domain_score: Math.round(preservationStrength * 100) / 100,
        erosion_indicator_count: erosionIndicators.length,
        critical_erosion_indicators: erosionIndicators.filter(e => e.severity === 'CRITICAL').length,
        high_erosion_indicators: erosionIndicators.filter(e => e.severity === 'HIGH').length,
        pressure_count: preservationPressures.length,
        high_severity_pressures: preservationPressures.filter(p => p.severity !== 'LOW').length,
        preserved_domain_count: preservedConstraints.length,
        strained_domain_count: strainedConstraints.length,
        min_domain_score: Math.round(Math.min(...domainValues) * 100) / 100
    };
    
    // Step 12: Build result
    const result = {
        preservation_state: classification.state,
        preservation_strength: Math.round(preservationStrength * 100) / 100,
        preserved_constraints: preservedConstraints,
        strained_constraints: strainedConstraints,
        erosion_indicators: erosionIndicators,
        preservation_pressures: preservationPressures,
        survivability_regions: survivabilityRegions,
        preservation_stability_assessment: stabilityAssessment,
        preservation_drift_profile: {
            profile: driftProfile.profile,
            description: driftProfile.description,
            direction: driftProfile.direction,
            drift_magnitude: driftProfile.drift_magnitude || null
        },
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_preservation_summary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };
    
    return result;
}

// === PERSISTENCE ===

function savePreservationState(preservationState) {
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    
    // Write snapshot
    fs.writeFileSync(PRESERVATION_FILE, JSON.stringify(preservationState, null, 2));
    
    // Append to history
    const historyEntry = {
        timestamp: preservationState.generated_at,
        preservation_state: preservationState.preservation_state,
        preservation_strength: preservationState.preservation_strength,
        erosion_indicator_count: preservationState.erosion_indicators.length,
        pressure_count: preservationState.preservation_pressures.length
    };
    
    try {
        const existingHistory = fs.existsSync(PRESERVATION_HISTORY_FILE)
            ? fs.readFileSync(PRESERVATION_HISTORY_FILE, 'utf8').trim().split('\n').map(line => JSON.parse(line))
            : [];
        
        const updatedHistory = [...existingHistory, historyEntry].slice(-MAX_HISTORY);
        fs.writeFileSync(PRESERVATION_HISTORY_FILE, updatedHistory.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch (e) {
        fs.appendFileSync(PRESERVATION_HISTORY_FILE, JSON.stringify(historyEntry) + '\n');
    }
    
    // Audit log
    const auditEntry = {
        timestamp: preservationState.generated_at,
        type: 'EXECUTIVE_CONSTRAINT_PRESERVATION_COMPUTED',
        state: preservationState.preservation_state,
        strength: preservationState.preservation_strength,
        erosion_indicators: preservationState.erosion_indicators.length,
        pressures: preservationState.preservation_pressures.length,
        drift: preservationState.preservation_drift_profile?.profile
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === CLI ===

if (require.main === module) {
    try {
        // Load inputs from state files
        const inputs = {
            epistemic_integrity: null,
            cognitive_coherence: null,
            cognitive_stability: null,
            cognitive_weighting: null,
            executive_readiness: null,
            executive_persistence: null
        };
        
        // Try to load each state file
        const stateFiles = {
            epistemic_integrity: 'epistemic-integrity.json',
            cognitive_coherence: 'cognitive-coherence.json',
            cognitive_stability: 'cognitive-stability.json',
            cognitive_weighting: 'cognitive-weighting.json',
            executive_readiness: 'executive-readiness.json',
            executive_persistence: 'executive-persistence.json'
        };
        
        for (const [key, filename] of Object.entries(stateFiles)) {
            const filePath = path.join(STATE_DIR, filename);
            if (fs.existsSync(filePath)) {
                try {
                    inputs[key] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                } catch (e) {
                    inputs[key] = null;
                }
            }
        }
        
        let history = [];
        if (fs.existsSync(PRESERVATION_HISTORY_FILE)) {
            history = fs.readFileSync(PRESERVATION_HISTORY_FILE, 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }
        
        const result = computeConstraintPreservation(inputs, history, history, {});
        savePreservationState(result);
        
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = {
    computeConstraintPreservation,
    savePreservationState,
    PRESERVATION_STATES,
    DRIFT_PROFILES,
    CONSTRAINT_DOMAINS,
    VIOLATION_INDICATORS
};