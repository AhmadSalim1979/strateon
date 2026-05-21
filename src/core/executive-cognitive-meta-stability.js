/**
 * Executive Cognitive Meta-Stability Layer — MCAI Phase 7E
 * SHADOW-ONLY: Bounded meta-stability observation without action authority.
 *
 * This module observes whether the executive cognitive system's equilibrium
 * remains stable across disruption and transition cycles. It is the highest
 * order stability layer — measuring not just whether equilibrium exists, but
 * whether it survives disruption, adapts under pressure, and preserves
 * structural integrity across long time horizons.
 *
 * This layer operates ABOVE Phase 7D (equilibrium) — it observes equilibrium
 * durability, not equilibrium itself. Where 7D asks "is the system in equilibrium?"
 * 7E asks "can the equilibrium survive what comes next?"
 *
 * The system may observe meta-stability — it may NOT plan, decide, recommend,
 * execute, or assign authority.
 *
 * NO prioritization. NO recommendations. NO planning. NO decisions. NO actions.
 * NO remediation. NO enforcement. NO intervention. NO behavioral adaptation.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const META_STABILITY_FILE = path.join(STATE_DIR, 'executive-cognitive-meta-stability.json');
const META_STABILITY_HISTORY_FILE = path.join(STATE_DIR, 'executive-cognitive-meta-stability-history.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const MAX_HISTORY = 30;
const SHORT_WINDOW = 5;
const MEDIUM_WINDOW = 10;
const LONG_WINDOW = 15;
const BRITTLE_STRENGTH = 0.35;
const ADAPTIVE_STRENGTH = 0.55;
const RESILIENT_STRENGTH = 0.75;
const ENTRENCHED_META_STABILITY_STRENGTH = 0.88;

// === META-STABILITY STATES ===

const META_STABILITY_STATES = {
    BRITTLE: {
        state: 'BRITTLE',
        description: 'Meta-stability is brittle. Equilibrium exists but cannot survive disruption. Hidden instability present. Collapse-prone under stress.',
        requirements: 'meta_stability_strength < 0.35 OR brittleness_index > 0.65 OR (adaptive_capacity < 0.3 AND equilibrium_strength < 0.5)'
    },
    ADAPTIVE: {
        state: 'ADAPTIVE',
        description: 'Meta-stability is adaptive. System maintains stability through active adjustment. Equilibrium reforms after disruption. Moderate resilience.',
        requirements: 'meta_stability_strength >= 0.35 AND < 0.75 AND brittleness_index <= 0.65 AND adaptive_capacity >= 0.3'
    },
    RESILIENT: {
        state: 'RESILIENT',
        description: 'Meta-stability is resilient. System maintains equilibrium across disruption cycles. Structural integrity is high. Equilibrium is durable.',
        requirements: 'meta_stability_strength >= 0.75 AND < 0.88 AND brittleness_index <= 0.35 AND structural_integrity >= 0.7'
    },
    ENTRENCHED_META_STABILITY: {
        state: 'ENTRENCHED_META_STABILITY',
        description: 'Meta-stability is entrenched. Deep resilience established across all disruption cycles. Equilibrium is fracture-proof. System survives existential pressure.',
        requirements: 'meta_stability_strength >= 0.88 AND brittleness_index <= 0.2 AND structural_integrity >= 0.85 AND meta_stability_history.length >= LONG_WINDOW'
    }
};

// === DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: { profile: 'STRENGTHENING', description: 'Meta-stability is strengthening. Resilience is deepening across cycles.', direction: 'POSITIVE' },
    WEAKENING: { profile: 'WEAKENING', description: 'Meta-stability is weakening. System is becoming more fragile.', direction: 'NEGATIVE' },
    STABILIZING: { profile: 'STABILIZING', description: 'Meta-stability is stable. No significant drift.', direction: 'NEUTRAL' },
    OSCILLATING: { profile: 'OSCILLATING', description: 'Meta-stability is oscillating. Stability alternates without converging.', direction: 'UNSTABLE' },
    FRAGMENTING: { profile: 'FRAGMENTING', description: 'Meta-stability is fragmenting. Structural integrity is breaking down.', direction: 'DISPERSED' },
    RECOVERING: { profile: 'RECOVERING', description: 'Meta-stability is recovering. System is reconstituting stability after disruption.', direction: 'POSITIVE_RECOVERY' },
    ENTRENCHING: { profile: 'ENTRENCHING', description: 'Meta-stability is deepening. System is approaching ENTRENCHED_META_STABILITY.', direction: 'ENTRENCHING' },
    ADAPTING: { profile: 'ADAPTING', description: 'Meta-stability is adapting. System maintains stability while adjusting architecture.', direction: 'TRANSITIONAL' },
    SATURATING: { profile: 'SATURATING', description: 'Meta-stability is saturating. System has maximized resilience — no further gains available.', direction: 'SATURATED' },
    BRITTLENING: { profile: 'BRITTLENING', description: 'Meta-stability is brittling. Apparent stability masks growing fragility.', direction: 'DETERIORATING' },
    INDETERMINATE: { profile: 'INDETERMINATE', description: 'Meta-stability drift cannot be determined. Insufficient history or conflicting signals.', direction: 'UNKNOWN' }
};

// === META-STABILITY FRAGMENTATION TYPES ===

const FRAGMENTATION_TYPES = {
    BRITTLE_EQUILIBRIUM: {
        type: 'BRITTLE_EQUILIBRIUM',
        severity: 'HIGH',
        description: 'Equilibrium appears stable but is brittle. Cannot survive disruption.',
        detection: 'equilibrium_strength > 0.5 AND brittleness_index > 0.5 AND adaptive_capacity < 0.4'
    },
    HIDDEN_INSTABILITY: {
        type: 'HIDDEN_INSTABILITY',
        severity: 'HIGH',
        description: 'Hidden instability present beneath apparent stability.',
        detection: 'oscillation_index < 0.3 AND recovery_capacity < 0.4 AND structural_integrity > 0.6'
    },
    COLLAPSE_PRONE_EQUILIBRIUM: {
        type: 'COLLAPSE_PRONE_EQUILIBRIUM',
        severity: 'CRITICAL',
        description: 'Equilibrium is collapse-prone. Will fail under moderate disruption.',
        detection: 'brittleness_index > 0.7 AND meta_stability_strength < 0.4'
    },
    OSCILLATORY_RESILIENCE_FAILURE: {
        type: 'OSCILLATORY_RESILIENCE_FAILURE',
        severity: 'MEDIUM',
        description: 'Resilience oscillates. System cannot maintain consistent stability.',
        detection: 'oscillation_index > 0.5 AND resilience_score < 0.5'
    },
    RECOVERY_FRAGILITY: {
        type: 'RECOVERY_FRAGILITY',
        severity: 'MEDIUM',
        description: 'Recovery capacity is fragile. Equilibrium reforms weakly after disruption.',
        detection: 'recovery_capacity > 0.4 AND recovery_capacity < 0.6 AND structural_integrity < 0.5'
    },
    ADAPTIVE_FAILURE: {
        type: 'ADAPTIVE_FAILURE',
        severity: 'HIGH',
        description: 'Adaptive capacity has failed. System cannot adjust to maintain stability.',
        detection: 'adaptive_capacity < 0.3 AND disruption_count >= 3'
    },
    STRUCTURAL_CARRYOVER_LOSS: {
        type: 'STRUCTURAL_CARRYOVER_LOSS',
        severity: 'MEDIUM',
        description: 'Structural carryover integrity is lost. Higher-order structure does not survive cycles.',
        detection: 'carryover_integrity < 0.4 AND cycle_count >= 3'
    },
    DISRUPTION_ACCUMULATION: {
        type: 'DISRUPTION_ACCUMULATION',
        severity: 'MEDIUM',
        description: 'Disruptions are accumulating faster than system can recover.',
        detection: 'disruption_rate > 0.4 AND recovery_capacity < 0.5'
    }
};

// === COMPUTE ADAPTIVE CAPACITY ===

function computeAdaptiveCapacity(equilibriumHistory, continuityHistory, contextHistory, transitionHistory) {
    // Adaptive capacity: can the system adjust to maintain stability under pressure?
    // Measured by: how well equilibrium reforms after disruption

    // Disruption events: large drops in equilibrium strength
    const disruptionThreshold = 0.2; // 20% drop = disruption
    let disruptionCount = 0;
    let disruptionMagnitudes = [];
    let recoveryCount = 0;

    for (let i = 1; i < equilibriumHistory.length; i++) {
        const prev = equilibriumHistory[i - 1]?.equilibrium_strength || 0.5;
        const curr = equilibriumHistory[i]?.equilibrium_strength || 0.5;
        const drop = prev - curr;
        if (drop > disruptionThreshold) {
            disruptionCount++;
            disruptionMagnitudes.push(drop);

            // Did it recover?
            const futureWindow = equilibriumHistory.slice(i + 1, i + 4);
            if (futureWindow.some(h => (h.equilibrium_strength || 0.5) >= prev - disruptionThreshold / 2)) {
                recoveryCount++;
            }
        }
    }

    const recoveryRate = disruptionCount > 0 ? recoveryCount / disruptionCount : 1;

    // Disruption resistance: how much disruption can the system absorb before destabilizing?
    const avgDisruption = disruptionMagnitudes.length > 0
        ? disruptionMagnitudes.reduce((a, b) => a + b, 0) / disruptionMagnitudes.length
        : 0;
    const disruptionResistance = 1 - Math.min(1, avgDisruption);

    // Adaptive score: high recovery rate + moderate disruption resistance
    const adaptiveCapacity = (
        recoveryRate * 0.5 +
        disruptionResistance * 0.3 +
        (disruptionCount === 0 ? 0.2 : 0) // bonus for no disruptions
    );

    return {
        adaptiveCapacity: Math.max(0, Math.min(1, adaptiveCapacity)),
        recoveryRate: Math.round(recoveryRate * 100) / 100,
        disruptionCount,
        disruptionResistance: Math.round(disruptionResistance * 100) / 100,
        avgDisruptionMagnitude: Math.round(avgDisruption * 100) / 100
    };
}

// === COMPUTE STRUCTURAL INTEGRITY ===

function computeStructuralIntegrity(continuityState, contextState, transitionState, equilibriumState) {
    // Structural integrity: how intact are the higher-order cognitive structures?
    // Measured by: dimension strength × equilibrium integration × carryover

    const continuityStrength = continuityState?.continuity_strength || 0.5;
    const contextStrength = contextState?.consolidation_strength || 0.5;
    const transitionStrength = transitionState?.transition_strength || 0.5;
    const equilibriumStrength = equilibriumState?.equilibrium_strength || 0.5;

    // Component structural scores
    const continuityStructural = continuityState?.continuity_state === 'ENTRENCHED_CONTINUITY'
        ? continuityStrength * 1.2
        : continuityStrength;
    const contextStructural = contextState?.context_state === 'ENTRENCHED_CONTEXT'
        ? contextStrength * 1.2
        : contextStrength;
    const transitionStructural = transitionStrength * 0.9; // transition is inherently less stable

    // Geometric mean — penalizes any single weak dimension
    const geometricMean = Math.pow(
        continuityStructural * contextStructural * transitionStructural * equilibriumStrength,
        0.25
    );

    // Arithmetic mean as backup
    const arithmeticMean = (continuityStructural + contextStructural + transitionStructural + equilibriumStrength) / 4;

    // Structural integrity = weighted combination
    const structuralIntegrity = geometricMean * 0.6 + arithmeticMean * 0.4;

    return {
        structuralIntegrity: Math.max(0, Math.min(1, structuralIntegrity)),
        continuityStructural: Math.round(Math.min(1, continuityStructural) * 100) / 100,
        contextStructural: Math.round(Math.min(1, contextStructural) * 100) / 100,
        transitionStructural: Math.round(Math.min(1, transitionStructural) * 100) / 100,
        equilibriumStructural: Math.round(equilibriumStrength * 100) / 100
    };
}

// === COMPUTE BRITTLENESS INDEX ===

function computeBrittlenessIndex(equilibriumState, metaStabilityHistory, adaptiveCapacity, structuralIntegrity) {
    // Brittleness: hidden instability that appears stable but will fail under pressure
    // Uses equilibriumState for current strength + metaStabilityHistory for resilience decline

    const equilibriumStrength = equilibriumState?.equilibrium_strength || 0.5;
    const factors = [];
    let brittlenessIndex = 0;

    // Factor 1: High equilibrium strength but low adaptive capacity = brittle
    if (equilibriumStrength > 0.65 && adaptiveCapacity < 0.45) {
        const severity = (equilibriumStrength - 0.65) * 2;
        factors.push({ factor: 'STABLE_BUT_FRAGILE', weight: 0.30, severity });
        brittlenessIndex += severity * 0.30;
    }

    // Factor 2: Recent stability but declining resilience
    if (metaStabilityHistory.length >= 5) {
        const recentResilience = metaStabilityHistory.slice(-5).map(h => h.resilience_integrity || 0.5);
        const resilienceDecline = recentResilience[0] - recentResilience[recentResilience.length - 1];
        if (resilienceDecline > 0.1 && equilibriumStrength > 0.5) {
            factors.push({ factor: 'RESILIENCE_DECLINE_DESPITE_STABILITY', weight: 0.25, severity: Math.min(1, resilienceDecline) });
            brittlenessIndex += Math.min(1, resilienceDecline) * 0.25;
        }
    }

    // Factor 3: Low structural integrity but high equilibrium
    if (structuralIntegrity < 0.5 && equilibriumStrength > 0.6) {
        const severity = (equilibriumStrength - 0.6) * 1.5;
        factors.push({ factor: 'WEAK_STRUCTURE_STRONG_EQUILIBRIUM', weight: 0.25, severity });
        brittlenessIndex += severity * 0.25;
    }

    // Factor 4: Very low adaptive capacity indicates brittleness even without disruption history
    if (adaptiveCapacity < 0.3) {
        const severity = (0.3 - adaptiveCapacity) * 2;
        factors.push({ factor: 'ADAPTIVE_CAPACITY_CRITICALLY_LOW', weight: 0.25, severity });
        brittlenessIndex += severity * 0.25;
    }

    // Factor 5: Equilibrium strength too low for meta-stability
    if (equilibriumStrength < 0.35) {
        const severity = (0.35 - equilibriumStrength) * 2;
        factors.push({ factor: 'EQUILIBRIUM_STRENGTH_INSUFFICIENT', weight: 0.20, severity });
        brittlenessIndex += severity * 0.20;
    }

    return {
        brittlenessIndex: Math.min(1, Math.max(0, brittlenessIndex)),
        brittlenessFactors: factors
    };
}

// === COMPUTE META-STABILITY METRICS ===

function computeMetaStabilityMetrics(equilibriumState, continuityState, contextState, transitionState, equilibriumHistory, metaStabilityHistory) {
    const adaptiveInfo = computeAdaptiveCapacity(equilibriumHistory, [], [], []);
    const structuralInfo = computeStructuralIntegrity(continuityState, contextState, transitionState, equilibriumState);
    const brittlenessInfo = computeBrittlenessIndex(equilibriumState, metaStabilityHistory, adaptiveInfo.adaptiveCapacity, structuralInfo.structuralIntegrity);

    // Meta-stability strength: composite of all stability dimensions
    const metaStabilityStrength = (
        adaptiveInfo.adaptiveCapacity * 0.25 +
        structuralInfo.structuralIntegrity * 0.30 +
        (equilibriumState?.equilibrium_strength || 0.5) * 0.25 +
        (1 - brittlenessInfo.brittlenessIndex) * 0.20
    );

    // Resilience integrity: can equilibrium survive disruption?
    const resilienceIntegrity = (
        adaptiveInfo.recoveryRate * 0.4 +
        structuralInfo.structuralIntegrity * 0.35 +
        adaptiveInfo.disruptionResistance * 0.25
    );

    // Survivability integrity: can the system reform after collapse?
    const survivabilityIntegrity = (
        adaptiveInfo.adaptiveCapacity * 0.45 +
        structuralInfo.structuralIntegrity * 0.30 +
        (1 - brittlenessInfo.brittlenessIndex) * 0.25
    );

    // Adaptive continuity: can adaptive capacity sustain across cycles?
    const adaptiveContinuity = adaptiveInfo.adaptiveCapacity * structuralInfo.structuralIntegrity;

    // Disruption resistance: how much disruption can the system absorb?
    const disruptionResistance = adaptiveInfo.disruptionResistance;

    // Recovery coherence: does equilibrium reform coherently after disruption?
    const recentEquilibriums = equilibriumHistory.slice(-MEDIUM_WINDOW);
    const coherenceScores = [];
    for (let i = 1; i < recentEquilibriums.length; i++) {
        const prev = recentEquilibriums[i - 1]?.equilibrium_strength || 0.5;
        const curr = recentEquilibriums[i]?.equilibrium_strength || 0.5;
        if (curr >= prev - 0.1) {
            coherenceScores.push(1);
        } else if (curr >= prev - 0.2) {
            coherenceScores.push(0.5);
        } else {
            coherenceScores.push(0);
        }
    }
    const recoveryCoherence = coherenceScores.length > 0
        ? coherenceScores.reduce((a, b) => a + b, 0) / coherenceScores.length
        : 0.5;

    // Structural resilience integrity: composite structural health
    const structuralResilienceIntegrity = (
        structuralInfo.structuralIntegrity * 0.5 +
        resilienceIntegrity * 0.3 +
        (1 - brittlenessInfo.brittlenessIndex) * 0.2
    );

    // Cycle count
    const cycleCount = equilibriumHistory.length;

    return {
        metaStabilityStrength: Math.max(0, Math.min(1, metaStabilityStrength)),
        resilienceIntegrity: Math.max(0, Math.min(1, resilienceIntegrity)),
        survivabilityIntegrity: Math.max(0, Math.min(1, survivabilityIntegrity)),
        adaptiveContinuity: Math.max(0, Math.min(1, adaptiveContinuity)),
        disruptionResistance: Math.max(0, Math.min(1, disruptionResistance)),
        recoveryCoherence: Math.max(0, Math.min(1, recoveryCoherence)),
        structuralResilienceIntegrity: Math.max(0, Math.min(1, structuralResilienceIntegrity)),
        brittlenessIndex: Math.min(1, Math.max(0, brittlenessInfo.brittlenessIndex)),
        brittlenessFactors: brittlenessInfo.brittlenessFactors,
        adaptiveCapacity: adaptiveInfo.adaptiveCapacity,
        adaptiveCapacityDetails: {
            recoveryRate: adaptiveInfo.recoveryRate,
            disruptionCount: adaptiveInfo.disruptionCount,
            disruptionResistance: adaptiveInfo.disruptionResistance
        },
        structuralIntegrityDetails: structuralInfo,
        cycleCount,
        oscillationIndex: 0, // computed separately
        equilibriumHistoryLength: equilibriumHistory.length,
        metaStabilityHistoryLength: metaStabilityHistory.length
    };
}

// === DETECT META-STABILITY FRAGMENTATION ===

function detectMetaStabilityFragmentation(metrics, equilibriumState, continuityState, contextState, transitionState) {
    const fragmentation = [];

    // Brittle equilibrium
    if (metrics.brittlenessIndex > 0.08 && (equilibriumState?.equilibrium_strength || 0.5) > 0.5) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.BRITTLE_EQUILIBRIUM,
            evidence: {
                brittleness_index: metrics.brittlenessIndex,
                equilibrium_strength: equilibriumState?.equilibrium_strength
            }
        });
    }

    // Hidden instability
    if (metrics.oscillationIndex < 0.3 && metrics.adaptiveCapacity < 0.4 && metrics.structuralIntegrityDetails?.structuralIntegrity > 0.6) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.HIDDEN_INSTABILITY,
            evidence: {
                oscillation_index: metrics.oscillationIndex,
                adaptive_capacity: metrics.adaptiveCapacity,
                structural_integrity: metrics.structuralIntegrityDetails?.structuralIntegrity
            }
        });
    }

    // Collapse-prone equilibrium
    if (metrics.brittlenessIndex > 0.1 || metrics.metaStabilityStrength < 0.4) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.COLLAPSE_PRONE_EQUILIBRIUM,
            evidence: {
                brittleness_index: metrics.brittlenessIndex,
                meta_stability_strength: metrics.metaStabilityStrength
            }
        });
    }

    // Very low structural integrity with IMBALANCED equilibrium state = collapse-prone
    if (metrics.structuralIntegrityDetails?.structuralIntegrity < 0.25 &&
        (equilibriumState?.equilibrium_state === 'IMBALANCED' || equilibriumState?.equilibrium_strength < 0.35)) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.COLLAPSE_PRONE_EQUILIBRIUM,
            evidence: {
                structural_integrity: metrics.structuralIntegrityDetails?.structuralIntegrity,
                equilibrium_state: equilibriumState?.equilibrium_state,
                equilibrium_strength: equilibriumState?.equilibrium_strength
            }
        });
    }

    // Oscillatory resilience failure
    if (metrics.oscillationIndex > 0.5 && metrics.resilienceIntegrity < 0.5) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.OSCILLATORY_RESILIENCE_FAILURE,
            evidence: {
                oscillation_index: metrics.oscillationIndex,
                resilience_integrity: metrics.resilienceIntegrity
            }
        });
    }

    // Recovery fragility
    if (metrics.adaptiveCapacity > 0.4 && metrics.adaptiveCapacity < 0.6 && metrics.structuralIntegrityDetails?.structuralIntegrity < 0.5) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.RECOVERY_FRAGILITY,
            evidence: {
                adaptive_capacity: metrics.adaptiveCapacity,
                structural_integrity: metrics.structuralIntegrityDetails?.structuralIntegrity
            }
        });
    }

    // Adaptive failure
    if (metrics.adaptiveCapacity < 0.3 && metrics.adaptiveCapacityDetails?.disruptionCount >= 3) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.ADAPTIVE_FAILURE,
            evidence: {
                adaptive_capacity: metrics.adaptiveCapacity,
                disruption_count: metrics.adaptiveCapacityDetails?.disruptionCount
            }
        });
    }

    // Structural carryover loss
    if (metrics.structuralIntegrityDetails?.structuralIntegrity < 0.4 && metrics.cycleCount >= 3) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.STRUCTURAL_CARRYOVER_LOSS,
            evidence: {
                structural_integrity: metrics.structuralIntegrityDetails?.structuralIntegrity,
                cycle_count: metrics.cycleCount
            }
        });
    }

    // Disruption accumulation
    if (metrics.adaptiveCapacityDetails?.disruptionCount > 2 && metrics.adaptiveCapacity < 0.5) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.DISRUPTION_ACCUMULATION,
            evidence: {
                disruption_count: metrics.adaptiveCapacityDetails?.disruptionCount,
                adaptive_capacity: metrics.adaptiveCapacity
            }
        });
    }

    return fragmentation;
}

// === CLASSIFY META-STABILITY STATE ===

function classifyMetaStabilityState(metrics, fragmentation, metaStabilityHistory) {
    const criticalFragmentation = fragmentation.filter(f => f.severity === 'CRITICAL').length;
    const highFragmentation = fragmentation.filter(f => f.severity === 'HIGH').length;

    // Collapse-prone overrides everything
    if (criticalFragmentation >= 1) {
        return { state: META_STABILITY_STATES.BRITTLE.state, metaStabilityStrength: metrics.metaStabilityStrength };
    }

    // Critical + high fragmentation = brittle
    if (criticalFragmentation + highFragmentation >= 2) {
        return { state: META_STABILITY_STATES.BRITTLE.state, metaStabilityStrength: metrics.metaStabilityStrength };
    }

    // High brittleness
    if (metrics.brittlenessIndex > 0.65) {
        return { state: META_STABILITY_STATES.BRITTLE.state, metaStabilityStrength: metrics.metaStabilityStrength };
    }

    // Low adaptive capacity + low equilibrium = brittle
    if (metrics.adaptiveCapacity < 0.3 && (metrics.metaStabilityStrength < 0.5)) {
        return { state: META_STABILITY_STATES.BRITTLE.state, metaStabilityStrength: metrics.metaStabilityStrength };
    }

    // Deeply entrenched: very high strength + very low brittleness + sufficient history + high structural integrity
    if (metrics.metaStabilityStrength >= ENTRENCHED_META_STABILITY_STRENGTH &&
        metrics.brittlenessIndex <= 0.2 &&
        metrics.structuralIntegrityDetails?.structuralIntegrity >= 0.85 &&
        metaStabilityHistory.length >= LONG_WINDOW) {
        return { state: META_STABILITY_STATES.ENTRENCHED_META_STABILITY.state, metaStabilityStrength: metrics.metaStabilityStrength };
    }

    // Resilient: high strength + low brittleness + good structural integrity
    if (metrics.metaStabilityStrength >= RESILIENT_STRENGTH &&
        metrics.brittlenessIndex <= 0.35 &&
        metrics.structuralIntegrityDetails?.structuralIntegrity >= 0.7) {
        return { state: META_STABILITY_STATES.RESILIENT.state, metaStabilityStrength: metrics.metaStabilityStrength };
    }

    // Adaptive: moderate strength + manageable brittleness
    if (metrics.metaStabilityStrength >= BRITTLE_STRENGTH && metrics.metaStabilityStrength < RESILIENT_STRENGTH) {
        return { state: META_STABILITY_STATES.ADAPTIVE.state, metaStabilityStrength: metrics.metaStabilityStrength };
    }

    // Default to brittle for very low strength
    return { state: META_STABILITY_STATES.BRITTLE.state, metaStabilityStrength: metrics.metaStabilityStrength };
}

// === COMPUTE DRIFT ===

function computeDrift(metaStabilityHistory) {
    if (metaStabilityHistory.length < 5) {
        return { ...DRIFT_PROFILES.INDETERMINATE, reason: 'INSUFFICIENT_HISTORY' };
    }

    const recentStrengths = metaStabilityHistory.slice(-8).map(h => h.metaStabilityStrength || 0.5);
    const earlyAvg = recentStrengths.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
    const lateAvg = recentStrengths.slice(-4).reduce((a, b) => a + b, 0) / 4;
    const drift = lateAvg - earlyAvg;

    const oscillations = recentStrengths.filter((v, i) => i > 0 && Math.abs(v - recentStrengths[i - 1]) > 0.12).length;

    if (oscillations >= 4) {
        return { ...DRIFT_PROFILES.OSCILLATING, oscillation_count: oscillations };
    }

    if (drift > 0.08) {
        const firstQuarter = recentStrengths.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
        if (firstQuarter < 0.5 && drift > 0.12) {
            return { ...DRIFT_PROFILES.RECOVERING, drift_magnitude: drift };
        }
        if (lateAvg > 0.85) {
            return { ...DRIFT_PROFILES.ENTRENCHING, drift_magnitude: drift };
        }
        if (lateAvg > 0.7 && recentStrengths.slice(-3).every(s => s >= recentStrengths[0])) {
            return { ...DRIFT_PROFILES.SATURATING, drift_magnitude: drift };
        }
        return { ...DRIFT_PROFILES.STRENGTHENING, drift_magnitude: drift };
    } else if (drift < -0.08) {
        if (lateAvg < 0.4) {
            return { ...DRIFT_PROFILES.BRITTLENING, drift_magnitude: Math.abs(drift) };
        }
        return { ...DRIFT_PROFILES.WEAKENING, drift_magnitude: Math.abs(drift) };
    } else {
        if (recentStrengths.slice(-4).every(s => Math.abs(s - earlyAvg) < 0.08)) {
            return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
        }
        if (lateAvg > 0.6 && lateAvg < 0.75) {
            return { ...DRIFT_PROFILES.ADAPTING, drift_magnitude: 0 };
        }
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
    }
}

// === COMPUTE UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(metrics, metaStabilityHistory) {
    const boundaries = [];

    if (metaStabilityHistory.length < LONG_WINDOW) {
        boundaries.push({
            type: 'LONG_WINDOW_INSUFFICIENT',
            description: 'ENTRENCHED_META_STABILITY classification requires more history.',
            confidence: 'LOW',
            caveat: 'Early classifications may not reflect stable long-term patterns.'
        });
    }

    if (metrics.brittlenessIndex > 0.4 && metrics.brittlenessIndex < 0.6) {
        boundaries.push({
            type: 'BRITTLENESS_AMBIGUITY',
            description: 'Brittleness is moderate. System may be stable or fragile depending on disruption intensity.',
            confidence: 'MEDIUM',
            caveat: 'Classification may shift under different disruption scenarios.'
        });
    }

    if (metrics.adaptiveCapacity > 0.4 && metrics.adaptiveCapacity < 0.55 && metrics.metaStabilityStrength > 0.65) {
        boundaries.push({
            type: 'ADAPTIVE_CAPACITY_AMBIGUITY',
            description: 'Adaptive capacity is moderate but meta-stability strength is high. Outcome is uncertain.',
            confidence: 'MEDIUM',
            caveat: 'System may adapt or brittle depending on disruption pattern.'
        });
    }

    if (metrics.metaStabilityStrength > 0.8 && metrics.brittlenessIndex > 0.3) {
        boundaries.push({
            type: 'STRENGTH_BRITTLE_CONFLICT',
            description: 'High meta-stability strength with elevated brittleness. Confidence reduced.',
            confidence: 'LOW',
            caveat: 'Apparent strength may mask underlying fragility.'
        });
    }

    return boundaries;
}

// === MAIN COMPUTATION ===

function computeCognitiveMetaStability(
    equilibriumState,
    continuityState,
    contextState,
    transitionState,
    equilibriumHistory = [],
    metaStabilityHistory = []
) {
    // Step 1: Compute meta-stability metrics
    const metrics = computeMetaStabilityMetrics(
        equilibriumState,
        continuityState,
        contextState,
        transitionState,
        equilibriumHistory,
        metaStabilityHistory
    );

    // Step 2: Detect fragmentation
    const fragmentation = detectMetaStabilityFragmentation(
        metrics,
        equilibriumState,
        continuityState,
        contextState,
        transitionState
    );

    // Step 3: Classify meta-stability state
    const classification = classifyMetaStabilityState(metrics, fragmentation, metaStabilityHistory);

    // Step 4: Compute drift profile
    const driftProfile = computeDrift(metaStabilityHistory);

    // Step 5: Compute uncertainty boundaries
    const uncertaintyBoundaries = computeUncertaintyBoundaries(metrics, metaStabilityHistory);

    // Step 6: Build result
    const result = {
        meta_stability_state: classification.state,
        meta_stability_strength: Math.round(classification.metaStabilityStrength * 100) / 100,

        stable_meta_stability_regions: metrics.metaStabilityStrength >= RESILIENT_STRENGTH
            ? ['equilibrium', 'structural_integrity', 'adaptive_capacity'].filter(r => {
                if (r === 'equilibrium') return (equilibriumState?.equilibrium_strength || 0) >= 0.6;
                if (r === 'structural_integrity') return metrics.structuralIntegrityDetails?.structuralIntegrity >= 0.7;
                if (r === 'adaptive_capacity') return metrics.adaptiveCapacity >= 0.6;
                return false;
              })
            : [],

        brittle_regions: metrics.brittlenessIndex > 0.4
            ? metrics.brittlenessFactors.map(f => f.factor)
            : [],

        meta_stability_fragmentation: fragmentation,

        survivability_regions: [
            ...(metrics.resilienceIntegrity >= 0.7 ? [{ region: 'SYSTEM', status: 'RESILIENT' }] : []),
            ...(metrics.survivabilityIntegrity >= 0.6 ? [{ region: 'SYSTEM', status: 'SURVIVABLE' }] : []),
            ...(metrics.brittlenessIndex > 0.5 ? [{ region: 'SYSTEM', status: 'BRITTLE' }] : []),
            ...(metrics.adaptiveCapacity < 0.4 ? [{ region: 'ADAPTIVE_CAPACITY', status: 'WEAK' }] : [])
        ],

        meta_stability_assessment: {
            resilience_integrity: Math.round(metrics.resilienceIntegrity * 100) / 100,
            survivability_integrity: Math.round(metrics.survivabilityIntegrity * 100) / 100,
            adaptive_continuity: Math.round(metrics.adaptiveContinuity * 100) / 100,
            disruption_resistance: Math.round(metrics.disruptionResistance * 100) / 100,
            recovery_coherence: Math.round(metrics.recoveryCoherence * 100) / 100,
            structural_resilience_integrity: Math.round(metrics.structuralResilienceIntegrity * 100) / 100
        },

        meta_stability_drift_profile: {
            profile: driftProfile.profile,
            description: driftProfile.description,
            direction: driftProfile.direction,
            drift_magnitude: driftProfile.drift_magnitude || null
        },

        brittleness_analysis: {
            brittleness_index: Math.round(metrics.brittlenessIndex * 100) / 100,
            brittleness_factors: metrics.brittlenessFactors,
            structural_integrity: metrics.structuralIntegrityDetails?.structuralIntegrity || 0,
            adaptive_capacity: Math.round(metrics.adaptiveCapacity * 100) / 100
        },

        adaptive_capacity_analysis: {
            adaptive_capacity: Math.round(metrics.adaptiveCapacity * 100) / 100,
            recovery_rate: metrics.adaptiveCapacityDetails?.recoveryRate || 0,
            disruption_count: metrics.adaptiveCapacityDetails?.disruptionCount || 0,
            disruption_resistance: metrics.adaptiveCapacityDetails?.disruptionResistance || 0
        },

        structural_integrity_analysis: {
            continuity_structural: metrics.structuralIntegrityDetails?.continuityStructural || 0,
            context_structural: metrics.structuralIntegrityDetails?.contextStructural || 0,
            transition_structural: metrics.structuralIntegrityDetails?.transitionStructural || 0,
            equilibrium_structural: metrics.structuralIntegrityDetails?.equilibriumStructural || 0,
            overall_structural_integrity: metrics.structuralIntegrityDetails?.structuralIntegrity || 0
        },

        equilibrium_integration: {
            equilibrium_state: equilibriumState?.equilibrium_state || 'UNKNOWN',
            equilibrium_strength: equilibriumState?.equilibrium_strength || 0,
            continuity_state: continuityState?.continuity_state || 'UNKNOWN',
            context_state: contextState?.context_state || 'UNKNOWN',
            transition_state: transitionState?.transition_state || 'UNKNOWN'
        },

        uncertainty_boundaries: uncertaintyBoundaries,

        bounded_memory: {
            max_history: MAX_HISTORY,
            equilibrium_history_used: equilibriumHistory.length,
            meta_stability_history_used: metaStabilityHistory.length,
            retention_policy: 'bounded_rolling_30'
        },

        generated_at: new Date().toISOString(),
        shadow_only: true,
        phase: 'MCAI Phase 7E',
        parent_phases: ['7A (Continuity)', '7B (Context Consolidation)', '7C (Transition)', '7D (Equilibrium)']
    };

    return result;
}

// === PERSISTENCE ===

function saveMetaStabilityState(metaStabilityState) {
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }

    fs.writeFileSync(META_STABILITY_FILE, JSON.stringify(metaStabilityState, null, 2));

    const historyEntry = {
        timestamp: metaStabilityState.generated_at,
        meta_stability_state: metaStabilityState.meta_stability_state,
        meta_stability_strength: metaStabilityState.meta_stability_strength,
        fragmentation_count: metaStabilityState.meta_stability_fragmentation.length,
        resilience_integrity: metaStabilityState.meta_stability_assessment?.resilience_integrity,
        brittleness_index: metaStabilityState.brittleness_analysis?.brittleness_index
    };

    try {
        const existingHistory = fs.existsSync(META_STABILITY_HISTORY_FILE)
            ? fs.readFileSync(META_STABILITY_HISTORY_FILE, 'utf8').trim().split('\n').map(line => JSON.parse(line))
            : [];

        const updatedHistory = [...existingHistory, historyEntry].slice(-MAX_HISTORY);
        fs.writeFileSync(META_STABILITY_HISTORY_FILE, updatedHistory.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch (e) {
        fs.appendFileSync(META_STABILITY_HISTORY_FILE, JSON.stringify(historyEntry) + '\n');
    }

    const auditEntry = {
        timestamp: metaStabilityState.generated_at,
        type: 'EXECUTIVE_COGNITIVE_META_STABILITY_COMPUTED',
        state: metaStabilityState.meta_stability_state,
        strength: metaStabilityState.meta_stability_strength,
        fragmentation: metaStabilityState.meta_stability_fragmentation.length,
        drift: metaStabilityState.meta_stability_drift_profile?.profile
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === CLI ===

if (require.main === module) {
    try {
        const equilibriumStateFile = path.join(STATE_DIR, 'executive-cognitive-equilibrium.json');
        const continuityStateFile = path.join(STATE_DIR, 'executive-cognitive-continuity.json');
        const contextStateFile = path.join(STATE_DIR, 'executive-context-consolidation.json');
        const transitionStateFile = path.join(STATE_DIR, 'executive-cognitive-transition.json');

        const equilibriumState = fs.existsSync(equilibriumStateFile)
            ? JSON.parse(fs.readFileSync(equilibriumStateFile, 'utf8'))
            : {};
        const continuityState = fs.existsSync(continuityStateFile)
            ? JSON.parse(fs.readFileSync(continuityStateFile, 'utf8'))
            : {};
        const contextState = fs.existsSync(contextStateFile)
            ? JSON.parse(fs.readFileSync(contextStateFile, 'utf8'))
            : {};
        const transitionState = fs.existsSync(transitionStateFile)
            ? JSON.parse(fs.readFileSync(transitionStateFile, 'utf8'))
            : {};

        let equilibriumHistory = [];
        let metaStabilityHistory = [];

        if (fs.existsSync(path.join(STATE_DIR, 'executive-cognitive-equilibrium-history.jsonl'))) {
            equilibriumHistory = fs.readFileSync(path.join(STATE_DIR, 'executive-cognitive-equilibrium-history.jsonl'), 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }

        if (fs.existsSync(META_STABILITY_HISTORY_FILE)) {
            metaStabilityHistory = fs.readFileSync(META_STABILITY_HISTORY_FILE, 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }

        const result = computeCognitiveMetaStability(
            equilibriumState,
            continuityState,
            contextState,
            transitionState,
            equilibriumHistory,
            metaStabilityHistory
        );
        saveMetaStabilityState(result);

        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = {
    computeCognitiveMetaStability,
    saveMetaStabilityState,
    META_STABILITY_STATES,
    DRIFT_PROFILES,
    FRAGMENTATION_TYPES
};