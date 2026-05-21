/**
 * Executive Cognitive Reflection Layer — MCAI Phase 8A
 * SHADOW-ONLY: Bounded reflective observation without action authority.
 *
 * This module observes how the executive cognitive system itself changes over time —
 * tracking patterns of evolution, drift, fragmentation, recovery, and adaptation
 * across all Phase 7 layers (Continuity, Context, Transition, Equilibrium, Meta-Stability).
 *
 * Reflection is the system's ability to observe its own patterns of change.
 * It is NOT self-awareness. It is NOT autonomy. It is NOT decision-making.
 * It is the same analytical observation applied to the cognitive system itself,
 * in the same way the cognitive system observes environmental inputs.
 *
 * This layer reads Phase 7 state/history and produces reflective patterns,
 * recurring cycles, and evolutionary trajectory analysis.
 *
 * The system may observe its own patterns — it may NOT plan, decide,
 * recommend, execute, or assign authority.
 *
 * NO prioritization. NO recommendations. NO planning. NO decisions. NO actions.
 * NO remediation. NO enforcement. NO intervention. NO behavioral adaptation.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const REFLECTION_FILE = path.join(STATE_DIR, 'executive-cognitive-reflection.json');
const REFLECTION_HISTORY_FILE = path.join(STATE_DIR, 'executive-cognitive-reflection-history.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const MAX_HISTORY = 30;
const PATTERN_WINDOW = 8;
const RECURRENCE_WINDOW = 12;
const EVOLUTION_WINDOW = 10;
const FRAGMENTED_STRENGTH = 0.30;
const DRIFTING_STRENGTH = 0.45;
const FORMING_STRENGTH = 0.60;
const INTEGRATED_STRENGTH = 0.75;
const ENTRENCHED_REFLECTION_STRENGTH = 0.88;

// === REFLECTION STATES ===

const REFLECTION_STATES = {
    FRAGMENTED: {
        state: 'FRAGMENTED',
        description: 'Reflection is fragmented. No coherent patterns detected. System lacks stable self-observation trajectory.',
        requirements: 'reflection_strength < 0.30 OR (recurring_fragmentation_cycles >= 3 AND reflection_patterns.length < 2)'
    },
    DRIFTING: {
        state: 'DRIFTING',
        description: 'Reflection is drifting. Patterns exist but are not coherent. Drift persistence is high.',
        requirements: 'reflection_strength >= 0.30 AND < 0.45 AND drift_persistence > 0.5'
    },
    FORMING: {
        state: 'FORMING',
        description: 'Reflection is forming. Pattern coherence is emerging. Self-observation trajectory is taking shape.',
        requirements: 'reflection_strength >= 0.45 AND < 0.60 AND pattern_coherence >= 0.4'
    },
    INTEGRATED: {
        state: 'INTEGRATED',
        description: 'Reflection is integrated. Multiple layers show coherent reflective patterns. Self-observation is stable.',
        requirements: 'reflection_strength >= 0.60 AND < 0.88 AND recurring_reflection_cycles >= 2 AND pattern_coherence >= 0.6'
    },
    ENTRENCHED_REFLECTION: {
        state: 'ENTRENCHED_REFLECTION',
        description: 'Reflection is deeply entrenched. Patterns are stable, recurring, and deeply embedded. Self-observation is fracture-proof.',
        requirements: 'reflection_strength >= 0.88 AND recurring_reflection_cycles >= 3 AND reflection_history.length >= LONG_WINDOW'
    }
};

// === DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: { profile: 'STRENGTHENING', description: 'Reflective coherence is strengthening. Patterns deepening.', direction: 'POSITIVE' },
    WEAKENING: { profile: 'WEAKENING', description: 'Reflective coherence is weakening. Patterns fragmenting.', direction: 'NEGATIVE' },
    STABILIZING: { profile: 'STABILIZING', description: 'Reflective patterns are stable. No significant drift.', direction: 'NEUTRAL' },
    OSCILLATING: { profile: 'OSCILLATING', description: 'Reflective patterns are oscillating. No convergence.', direction: 'UNSTABLE' },
    FRAGMENTING: { profile: 'FRAGMENTING', description: 'Reflective patterns are fragmenting. Loss of coherence.', direction: 'DISPERSED' },
    RECOVERING: { profile: 'RECOVERING', description: 'Reflective patterns are recovering. Reconstitution in progress.', direction: 'POSITIVE_RECOVERY' },
    ENTRENCHING: { profile: 'ENTRENCHING', description: 'Reflective patterns are deepening. Moving toward entrenched.', direction: 'ENTRENCHING' },
    ADAPTING: { profile: 'ADAPTING', description: 'Reflective patterns are adapting. Architectural adjustment active.', direction: 'TRANSITIONAL' },
    SATURATING: { profile: 'SATURATING', description: 'Reflective patterns are saturating. No further gains available.', direction: 'SATURATED' },
    DISSOLVING: { profile: 'DISSOLVING', description: 'Reflective patterns are dissolving. Pattern integrity lost.', direction: 'DISSOLVING' },
    INDETERMINATE: { profile: 'INDETERMINATE', description: 'Reflection drift cannot be determined. Insufficient history.', direction: 'UNKNOWN' }
};

// === REFLECTION FRAGMENTATION TYPES ===

const FRAGMENTATION_TYPES = {
    NO_COHERENT_PATTERN: {
        type: 'NO_COHERENT_PATTERN',
        severity: 'HIGH',
        description: 'No coherent reflective pattern detected. System cannot track its own evolution.',
        detection: 'pattern_coherence < 0.2 AND reflection_strength < 0.4'
    },
    PERSISTENT_DRIFT_LOSS: {
        type: 'PERSISTENT_DRIFT_LOSS',
        severity: 'HIGH',
        description: 'Persistent drift without recovery. Pattern trajectory is lost.',
        detection: 'drift_persistence > 0.7 AND reflection_strength < 0.5'
    },
    RECURRING_FRAGMENTATION_CYCLE: {
        type: 'RECURRING_FRAGMENTATION_CYCLE',
        severity: 'MEDIUM',
        description: 'Fragmentation recurs in similar patterns. System unable to break cycle.',
        detection: 'recurring_fragmentation_cycles >= 3 AND pattern_variance > 0.3'
    },
    RECOVERY_FAILURE: {
        type: 'RECOVERY_FAILURE',
        severity: 'MEDIUM',
        description: 'Recovery attempts fail repeatedly. Pattern cannot reconstitute.',
        detection: 'recovery_attempts >= 3 AND recovery_success_rate < 0.3'
    },
    ADAPTATION_CYCLE_BREAKDOWN: {
        type: 'ADAPTATION_CYCLE_BREAKDOWN',
        severity: 'MEDIUM',
        description: 'Adaptation cycle breaks down. System cannot modify patterns.',
        detection: 'adaptation_attempts >= 3 AND adaptation_success_rate < 0.3'
    },
    PATTERN_ECHO_COLLAPSE: {
        type: 'PATTERN_ECHO_COLLAPSE',
        severity: 'CRITICAL',
        description: 'Pattern echo collapses. Prior patterns do not survive repetition.',
        detection: 'pattern_echo_strength < 0.2 AND recurring_reflection_cycles >= 2'
    }
};

// === COMPUTE PATTERN METRICS ===

function computePatternMetrics(continuityHistory, contextHistory, transitionHistory, equilibriumHistory, metaStabilityHistory, reflectionHistory) {
    // Combine all layer histories to detect cross-layer reflective patterns

    // 1. Pattern coherence: do states align across layers?
    const layerHistories = [continuityHistory, contextHistory, transitionHistory, equilibriumHistory, metaStabilityHistory];
    const layerNames = ['continuity', 'context', 'transition', 'equilibrium', 'metaStability'];

    // Get dominant states in recent window for each layer
    function getDominantState(history, stateField, defaultState = 'UNKNOWN') {
        const recent = history.slice(-PATTERN_WINDOW);
        if (recent.length === 0) return { state: defaultState, strength: 0.5, count: 0 };
        const stateCounts = {};
        const strengthSum = {};
        recent.forEach(h => {
            const s = h[stateField] || defaultState;
            stateCounts[s] = (stateCounts[s] || 0) + 1;
            strengthSum[s] = (strengthSum[s] || 0) + (h[strengthField(history[0])] || 0.5);
        });
        const dominant = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0];
        return {
            state: dominant[0],
            count: dominant[1],
            strength: strengthSum[dominant[0]] / dominant[1]
        };
    }

    function strengthField(firstEntry) {
        if (firstEntry === undefined) return 'continuity_strength';
        if ('continuity_strength' in firstEntry) return 'continuity_strength';
        if ('consolidation_strength' in firstEntry) return 'consolidation_strength';
        if ('transition_strength' in firstEntry) return 'transition_strength';
        if ('equilibrium_strength' in firstEntry) return 'equilibrium_strength';
        if ('metaStabilityStrength' in firstEntry) return 'metaStabilityStrength';
        return 'strength';
    }

    function stateField(firstEntry) {
        if (firstEntry === undefined) return 'continuity_state';
        if ('continuity_state' in firstEntry) return 'continuity_state';
        if ('context_state' in firstEntry) return 'context_state';
        if ('transition_state' in firstEntry) return 'transition_state';
        if ('equilibrium_state' in firstEntry) return 'equilibrium_state';
        if ('meta_stability_state' in firstEntry) return 'meta_stability_state';
        return 'state';
    }

    const layerStates = layerHistories.map((h, i) => {
        const first = h[0] || {};
        return getDominantState(h, stateField(first), 'UNKNOWN');
    });

    // Pattern coherence: what fraction of layers share the same dominant state?
    const dominantStates = layerStates.map(l => l.state);
    const uniqueStates = [...new Set(dominantStates.filter(s => s !== 'UNKNOWN'))];
    const patternCoherence = uniqueStates.length === 1
        ? layerStates.filter(l => l.state === uniqueStates[0]).length / layerStates.length
        : 0;

    // 2. Drift persistence: does drift direction persist across layers?
    let driftDirections = [];
    for (let li = 0; li < layerHistories.length; li++) {
        const h = layerHistories[li];
        if (h.length < 3) continue;
        const first = h[0] || {};
        const last = h[h.length - 1] || {};
        const sf = strengthField(first);
        const firstStr = h.slice(0, 3).reduce((sum, x) => sum + (x[sf] || 0.5), 0) / 3;
        const lastStr = h.slice(-3).reduce((sum, x) => sum + (x[sf] || 0.5), 0) / 3;
        if (firstStr < lastStr - 0.05) driftDirections.push('POSITIVE');
        else if (firstStr > lastStr + 0.05) driftDirections.push('NEGATIVE');
        else driftDirections.push('NEUTRAL');
    }
    const dominantDrift = driftDirections.filter(d => d !== 'NEUTRAL');
    const driftPersistence = dominantDrift.length > 0
        ? dominantDrift.filter(d => d === dominantDrift[0]).length / dominantDrift.length
        : 1.0;

    // 3. Recurring reflection cycles: do patterns repeat over time?
    const reflectionRecent = reflectionHistory.slice(-RECURRENCE_WINDOW);
    const reflectionStates = reflectionRecent.map(h => h.reflection_state).filter(Boolean);
    const stateCycleCounts = {};
    reflectionStates.forEach(s => { stateCycleCounts[s] = (stateCycleCounts[s] || 0) + 1; });
    const recurringCycles = Object.values(stateCycleCounts).filter(c => c >= 2).length;

    // 4. Pattern echo: do patterns survive across observation windows?
    const recentPatterns = reflectionHistory.slice(-PATTERN_WINDOW);
    const olderPatterns = reflectionHistory.slice(-RECURRENCE_WINDOW, -PATTERN_WINDOW);
    let echoMatches = 0;
    recentPatterns.forEach(rp => {
        if (olderPatterns.some(op =>
            op.reflection_state === rp.reflection_state &&
            Math.abs((op.reflection_strength || 0.5) - (rp.reflection_strength || 0.5)) < 0.15
        )) echoMatches++;
    });
    const patternEchoStrength = recentPatterns.length > 0
        ? echoMatches / recentPatterns.length
        : 0;

    // 5. Adaptation score: how much do patterns change over cycles?
    let adaptationCount = 0;
    let adaptationSuccess = 0;
    for (let i = 1; i < reflectionHistory.length; i++) {
        const prev = reflectionHistory[i - 1]?.reflection_strength || 0.5;
        const curr = reflectionHistory[i]?.reflection_strength || 0.5;
        if (Math.abs(curr - prev) > 0.05) {
            adaptationCount++;
            if (curr > prev) adaptationSuccess++;
        }
    }
    const adaptationRate = adaptationCount > 0 ? adaptationSuccess / adaptationCount : 0.5;

    // 6. Recovery continuity: does system recover after fragmentation?
    let recoveryAttempts = 0;
    let recoverySuccesses = 0;
    let fragmented = false;
    for (let i = 0; i < reflectionHistory.length; i++) {
        const state = reflectionHistory[i]?.reflection_state;
        if (state === 'FRAGMENTED') fragmented = true;
        else if (fragmented && (state === 'FORMING' || state === 'INTEGRATED' || state === 'ENTRENCHED_REFLECTION')) {
            recoveryAttempts++;
            if (state !== 'FRAGMENTED') recoverySuccesses++;
            fragmented = false;
        }
    }
    const recoveryContinuity = recoveryAttempts > 0 ? recoverySuccesses / recoveryAttempts : 0.5;

    // 7. Pattern variance across layers
    const layerStrengths = layerStates.map(l => l.strength);
    const avgStrength = layerStrengths.reduce((a, b) => a + b, 0) / layerStrengths.length;
    const variance = layerStrengths.reduce((sum, s) => sum + Math.pow(s - avgStrength, 2), 0) / layerStrengths.length;
    const patternVariance = Math.sqrt(variance);

    // 8. Cross-layer alignment score
    const alignedLayers = layerStates.filter(l => {
        const normalizedStrength = l.strength / 1.0; // normalize to 0-1
        return normalizedStrength >= 0.6;
    }).length;
    const alignmentScore = alignedLayers / layerStates.length;

    return {
        patternCoherence: Math.max(0, Math.min(1, patternCoherence)),
        driftPersistence: Math.max(0, Math.min(1, driftPersistence)),
        recurringReflectionCycles: recurringCycles,
        patternEchoStrength: Math.max(0, Math.min(1, patternEchoStrength)),
        adaptationRate: Math.max(0, Math.min(1, adaptationRate)),
        recoveryContinuity: Math.max(0, Math.min(1, recoveryContinuity)),
        patternVariance: Math.round(patternVariance * 100) / 100,
        alignmentScore: Math.max(0, Math.min(1, alignmentScore)),
        layerStates,
        dominantLayerState: uniqueStates[0] || 'UNKNOWN',
        driftDirection: dominantDrift.length > 0 ? dominantDrift[0] : 'NEUTRAL',
        layerHistoryLengths: layerHistories.map(h => h.length)
    };
}

// === DETECT REFLECTION FRAGMENTATION ===

function detectReflectionFragmentation(metrics, reflectionHistory, continuityHistory, equilibriumHistory) {
    const fragmentation = [];

    // No coherent pattern
    if (metrics.patternCoherence < 0.2 && metrics.patternEchoStrength < 0.4) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.NO_COHERENT_PATTERN,
            evidence: {
                pattern_coherence: metrics.patternCoherence,
                pattern_echo_strength: metrics.patternEchoStrength
            }
        });
    }

    // Persistent drift loss
    if (metrics.driftPersistence > 0.7 && metrics.patternEchoStrength < 0.5) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.PERSISTENT_DRIFT_LOSS,
            evidence: {
                drift_persistence: metrics.driftPersistence,
                pattern_echo_strength: metrics.patternEchoStrength
            }
        });
    }

    // Recurring fragmentation cycles
    if (reflectionHistory.filter(h => h.reflection_state === 'FRAGMENTED').length >= 3 && metrics.patternVariance > 0.3) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.RECURRING_FRAGMENTATION_CYCLE,
            evidence: {
                fragmentation_count: reflectionHistory.filter(h => h.reflection_state === 'FRAGMENTED').length,
                pattern_variance: metrics.patternVariance
            }
        });
    }

    // Recovery failure
    const recoveryAttempts = reflectionHistory.filter((h, i) => {
        if (i === 0) return false;
        return reflectionHistory[i - 1]?.reflection_state === 'FRAGMENTED';
    }).length;
    const recoveryFailures = reflectionHistory.filter((h, i) => {
        if (i === 0) return false;
        const wasFragmented = reflectionHistory[i - 1]?.reflection_state === 'FRAGMENTED';
        const isStillFragmented = h.reflection_state === 'FRAGMENTED';
        return wasFragmented && isStillFragmented;
    }).length;
    if (recoveryAttempts >= 2) {
        const rate = 1 - (recoveryFailures / recoveryAttempts);
        if (rate < 0.3) {
            fragmentation.push({
                ...FRAGMENTATION_TYPES.RECOVERY_FAILURE,
                evidence: {
                    recovery_attempts: recoveryAttempts,
                    recovery_success_rate: rate
                }
            });
        }
    }

    // Pattern echo collapse
    if (metrics.patternEchoStrength < 0.2 && metrics.recurringReflectionCycles >= 2) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.PATTERN_ECHO_COLLAPSE,
            evidence: {
                pattern_echo_strength: metrics.patternEchoStrength,
                recurring_cycles: metrics.recurringReflectionCycles
            }
        });
    }

    return fragmentation;
}

// === CLASSIFY REFLECTION STATE ===

function classifyReflectionState(metrics, fragmentation, reflectionHistory) {
    const criticalFragmentation = fragmentation.filter(f => f.severity === 'CRITICAL').length;
    const highFragmentation = fragmentation.filter(f => f.severity === 'HIGH').length;

    // Critical fragmentation forces FRAGMENTED
    if (criticalFragmentation >= 1) {
        return { state: REFLECTION_STATES.FRAGMENTED.state, reflectionStrength: metrics.patternCoherence * metrics.patternEchoStrength };
    }

    // High fragmentation
    if (highFragmentation >= 2) {
        return { state: REFLECTION_STATES.FRAGMENTED.state, reflectionStrength: metrics.patternCoherence * metrics.patternEchoStrength };
    }

    // Very low coherence
    if (metrics.patternCoherence < 0.2) {
        return { state: REFLECTION_STATES.FRAGMENTED.state, reflectionStrength: metrics.patternCoherence * metrics.patternEchoStrength };
    }

    // Entrenched reflection: very high strength + multiple cycles + sufficient history
    if (metrics.patternCoherence >= ENTRENCHED_REFLECTION_STRENGTH &&
        metrics.recurringReflectionCycles >= 3 &&
        reflectionHistory.length >= EVOLUTION_WINDOW) {
        return { state: REFLECTION_STATES.ENTRENCHED_REFLECTION.state, reflectionStrength: metrics.patternCoherence };
    }

    // Integrated: high coherence + multiple cycles + good alignment
    if (metrics.patternCoherence >= INTEGRATED_STRENGTH &&
        metrics.recurringReflectionCycles >= 2 &&
        metrics.alignmentScore >= 0.6) {
        return { state: REFLECTION_STATES.INTEGRATED.state, reflectionStrength: metrics.patternCoherence };
    }

    // Forming: moderate coherence
    if (metrics.patternCoherence >= FORMING_STRENGTH && metrics.patternCoherence < INTEGRATED_STRENGTH) {
        return { state: REFLECTION_STATES.FORMING.state, reflectionStrength: metrics.patternCoherence };
    }

    // Drifting: low coherence but some drift persistence
    if (metrics.patternCoherence >= DRIFTING_STRENGTH && metrics.patternCoherence < FORMING_STRENGTH) {
        return { state: REFLECTION_STATES.DRIFTING.state, reflectionStrength: metrics.patternCoherence };
    }

    // Default to fragmented for very low strength
    return { state: REFLECTION_STATES.FRAGMENTED.state, reflectionStrength: metrics.patternCoherence };
}

// === COMPUTE DRIFT ===

function computeDrift(reflectionHistory) {
    if (reflectionHistory.length < 5) {
        return { ...DRIFT_PROFILES.INDETERMINATE, reason: 'INSUFFICIENT_HISTORY' };
    }

    const recentStrengths = reflectionHistory.slice(-8).map(h => h.reflection_strength || 0.5);
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
        if (lateAvg < 0.35) {
            return { ...DRIFT_PROFILES.DISSOLVING, drift_magnitude: Math.abs(drift) };
        }
        return { ...DRIFT_PROFILES.WEAKENING, drift_magnitude: Math.abs(drift) };
    } else {
        if (recentStrengths.slice(-4).every(s => Math.abs(s - earlyAvg) < 0.08)) {
            return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
        }
        if (lateAvg > 0.5 && lateAvg < 0.7) {
            return { ...DRIFT_PROFILES.ADAPTING, drift_magnitude: 0 };
        }
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
    }
}

// === COMPUTE UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(metrics, reflectionHistory) {
    const boundaries = [];

    if (reflectionHistory.length < PATTERN_WINDOW) {
        boundaries.push({
            type: 'PATTERN_WINDOW_INSUFFICIENT',
            description: 'Pattern classification requires more reflection history.',
            confidence: 'LOW',
            caveat: 'Early classifications may not reflect stable reflective patterns.'
        });
    }

    if (metrics.patternVariance > 0.25 && metrics.patternCoherence < 0.5) {
        boundaries.push({
            type: 'HIGH_VARIANCE_LOW_COHERENCE',
            description: 'High pattern variance with low coherence. Pattern trajectory is uncertain.',
            confidence: 'MEDIUM',
            caveat: 'System may be in a transition state with unclear reflective direction.'
        });
    }

    if (metrics.patternEchoStrength < 0.4 && metrics.recurringReflectionCycles < 2) {
        boundaries.push({
            type: 'NO_RECURRENT_PATTERN',
            description: 'No recurring reflection cycles detected. Long-term pattern stability unknown.',
            confidence: 'LOW',
            caveat: 'Pattern coherence may be transient rather than structural.'
        });
    }

    if (metrics.driftPersistence > 0.8 && metrics.patternEchoStrength > 0.7) {
        boundaries.push({
            type: 'PERSISTENT_DRIFT_WITH_STRONG_ECHO',
            description: 'Persistent drift coexists with strong pattern echo. Outcome uncertain.',
            confidence: 'MEDIUM',
            caveat: 'System may be adapting or fragmenting — direction ambiguous.'
        });
    }

    return boundaries;
}

// === COMPUTE STABILITY EVOLUTION ANALYSIS ===

function computeStabilityEvolution(continuityHistory, contextHistory, transitionHistory, equilibriumHistory, metaStabilityHistory) {
    // Track how stability evolves across all layers
    const layers = [
        { name: 'continuity', history: continuityHistory, strengthField: 'continuity_strength', stateField: 'continuity_state' },
        { name: 'context', history: contextHistory, strengthField: 'consolidation_strength', stateField: 'context_state' },
        { name: 'transition', history: transitionHistory, strengthField: 'transition_strength', stateField: 'transition_state' },
        { name: 'equilibrium', history: equilibriumHistory, strengthField: 'equilibrium_strength', stateField: 'equilibrium_state' },
        { name: 'metaStability', history: metaStabilityHistory, strengthField: 'metaStabilityStrength', stateField: 'meta_stability_state' }
    ];

    const evolution = layers.map(layer => {
        if (layer.history.length < 3) {
            return { layer: layer.name, trajectory: 'UNKNOWN', trend: 0, history_length: layer.history.length };
        }
        const strengths = layer.history.map(h => h[layer.strengthField] || 0.5);
        const earlyAvg = strengths.slice(0, Math.ceil(strengths.length / 3)).reduce((a, b) => a + b, 0) / Math.ceil(strengths.length / 3);
        const lateAvg = strengths.slice(-Math.ceil(strengths.length / 3)).reduce((a, b) => a + b, 0) / Math.ceil(strengths.length / 3);
        const trend = lateAvg - earlyAvg;
        const trajectory = trend > 0.08 ? 'IMPROVING' : trend < -0.08 ? 'DEGRADING' : 'STABLE';
        return { layer: layer.name, trajectory, trend: Math.round(trend * 100) / 100, history_length: layer.history.length };
    });

    const stableLayers = evolution.filter(e => e.trajectory === 'STABLE').length;
    const improvingLayers = evolution.filter(e => e.trajectory === 'IMPROVING').length;
    const degradingLayers = evolution.filter(e => e.trajectory === 'DEGRADING').length;

    return {
        layer_trajectories: evolution,
        system_trajectory: improvingLayers > degradingLayers ? 'IMPROVING' : degradingLayers > improvingLayers ? 'DEGRADING' : 'STABLE',
        stability_score: Math.max(0, Math.min(1, stableLayers / layers.length))
    };
}

// === COMPUTE FRAGMENTATION EVOLUTION ANALYSIS ===

function computeFragmentationEvolution(continuityHistory, contextHistory, transitionHistory, equilibriumHistory, metaStabilityHistory) {
    // Track fragmentation patterns across layers
    const layers = [
        { name: 'continuity', history: continuityHistory, stateField: 'continuity_state' },
        { name: 'context', history: contextHistory, stateField: 'context_state' },
        { name: 'transition', history: transitionHistory, stateField: 'transition_state' },
        { name: 'equilibrium', history: equilibriumHistory, stateField: 'equilibrium_state' },
        { name: 'metaStability', history: metaStabilityHistory, stateField: 'meta_stability_state' }
    ];

    const fragmentedStates = ['FRAGMENTED', 'DIFFUSE', 'IMBALANCED', 'BRITTLE'];
    const fragmentationByLayer = layers.map(layer => {
        const historyLength = layer.history.length;
        const fragmentedCount = layer.history.filter(h =>
            fragmentedStates.includes(h[layer.stateField])
        ).length;
        return {
            layer: layer.name,
            fragmentation_count: fragmentedCount,
            fragmentation_rate: historyLength > 0 ? fragmentedCount / historyLength : 0
        };
    });

    const totalFragmentation = fragmentationByLayer.reduce((sum, l) => sum + l.fragmentation_count, 0);
    const maxFragmentation = layers.length * (Math.max(...layers.map(l => l.history.length)) || 1);
    const overallFragmentationRate = maxFragmentation > 0 ? totalFragmentation / maxFragmentation : 0;

    return {
        fragmentation_by_layer: fragmentationByLayer,
        overall_fragmentation_rate: Math.round(overallFragmentationRate * 100) / 100,
        most_fragmented_layer: fragmentationByLayer.sort((a, b) => b.fragmentation_rate - a.fragmentation_rate)[0]?.layer || 'NONE'
    };
}

// === COMPUTE ADAPTATION PATTERNS ===

function computeAdaptationPatterns(reflectionHistory) {
    // Detect adaptation patterns: when reflection strength changes, what direction?
    if (reflectionHistory.length < 5) return { patterns: [], adaptation_trend: 'UNKNOWN' };

    const patterns = [];
    let increasingCount = 0;
    let decreasingCount = 0;

    for (let i = 2; i < reflectionHistory.length; i++) {
        const prev = reflectionHistory[i - 2]?.reflection_strength || 0.5;
        const curr = reflectionHistory[i]?.reflection_strength || 0.5;
        const delta = curr - prev;
        if (delta > 0.08) {
            patterns.push({ type: 'INCREASE', delta: Math.round(delta * 100) / 100, position: i });
            increasingCount++;
        } else if (delta < -0.08) {
            patterns.push({ type: 'DECREASE', delta: Math.round(delta * 100) / 100, position: i });
            decreasingCount++;
        }
    }

    const adaptationTrend = increasingCount > decreasingCount ? 'INCREASING'
        : decreasingCount > increasingCount ? 'DECREASING'
        : 'STABLE';

    return {
        patterns: patterns.slice(-10), // keep last 10
        adaptation_trend: adaptationTrend,
        increase_count: increasingCount,
        decrease_count: decreasingCount
    };
}

// === COMPUTE RECOVERY PROGRESSION ANALYSIS ===

function computeRecoveryProgression(reflectionHistory) {
    if (reflectionHistory.length < 3) {
        return { recovery_episodes: [], overall_recovery_rate: 0, recovery_trend: 'UNKNOWN' };
    }

    const recoveryEpisodes = [];
    let inFragmentation = false;
    let fragStart = -1;

    for (let i = 0; i < reflectionHistory.length; i++) {
        const state = reflectionHistory[i]?.reflection_state;
        if (state === 'FRAGMENTED' && !inFragmentation) {
            inFragmentation = true;
            fragStart = i;
        } else if (state !== 'FRAGMENTED' && inFragmentation) {
            inFragmentation = false;
            const fragEnd = i;
            const fragDuration = fragEnd - fragStart;
            const recoveryStrength = reflectionHistory[i]?.reflection_strength || 0.5;
            recoveryEpisodes.push({
                fragmentation_start: fragStart,
                fragmentation_end: fragEnd,
                duration: fragDuration,
                post_recovery_strength: recoveryStrength
            });
        }
    }

    const successfulRecoveries = recoveryEpisodes.filter(e => e.post_recovery_strength > 0.5).length;
    const overallRecoveryRate = recoveryEpisodes.length > 0 ? successfulRecoveries / recoveryEpisodes.length : 0.5;

    const recentEpisodes = recoveryEpisodes.slice(-5);
    let recoveryTrend = 'STABLE';
    if (recentEpisodes.length >= 2) {
        const recentDurations = recentEpisodes.map(e => e.duration);
        const earlyDur = recentDurations.slice(0, Math.ceil(recentDurations.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(recentDurations.length / 2);
        const lateDur = recentDurations.slice(-Math.ceil(recentDurations.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(recentDurations.length / 2);
        recoveryTrend = lateDur < earlyDur - 0.5 ? 'IMPROVING' : lateDur > earlyDur + 0.5 ? 'DEGRADING' : 'STABLE';
    }

    return {
        recovery_episodes: recoveryEpisodes.slice(-10),
        overall_recovery_rate: Math.round(overallRecoveryRate * 100) / 100,
        recovery_trend: recoveryTrend,
        total_fragmentation_events: recoveryEpisodes.length
    };
}

// === COMPUTE SURVIVABILITY TRACKING ===

function computeSurvivabilityTracking(continuityHistory, contextHistory, transitionHistory, equilibriumHistory, metaStabilityHistory, reflectionHistory) {
    // Track survivability: can the system survive disruptions across all layers?
    const layers = [
        { name: 'continuity', history: continuityHistory, strengthField: 'continuity_strength' },
        { name: 'context', history: contextHistory, strengthField: 'consolidation_strength' },
        { name: 'transition', history: transitionHistory, strengthField: 'transition_strength' },
        { name: 'equilibrium', history: equilibriumHistory, strengthField: 'equilibrium_strength' },
        { name: 'metaStability', history: metaStabilityHistory, strengthField: 'metaStabilityStrength' }
    ];

    const survivability = layers.map(layer => {
        if (layer.history.length < 3) return { region: layer.name, survivable: true, lowest_strength: 0.5, disruption_count: 0 };
        const strengths = layer.history.map(h => h[layer.strengthField] || 0.5);
        const lowest = Math.min(...strengths);
        const disruptions = strengths.filter((s, i) => i > 0 && s < strengths[i - 1] - 0.15).length;
        const survivable = lowest > 0.3;
        return { region: layer.name, survivable, lowest_strength: Math.round(lowest * 100) / 100, disruption_count: disruptions };
    });

    const survivableRegions = survivability.filter(s => s.survivable);
    const systemSurvivable = survivableRegions.length >= layers.length / 2;

    return {
        layer_survivability: survivability,
        system_survivable: systemSurvivable,
        survivable_regions: survivableRegions.map(s => s.region)
    };
}

// === COMPUTE RECURRING REFLECTION CYCLES ===

function computeRecurringCycles(reflectionHistory) {
    if (reflectionHistory.length < 4) return { cycles: [], cycle_pattern: 'NONE' };

    const states = reflectionHistory.map(h => h.reflection_state).filter(Boolean);
    const cycles = [];

    // Find repeating state sequences
    for (let windowSize = 2; windowSize <= 4; windowSize++) {
        for (let i = 0; i <= states.length - windowSize * 2; i++) {
            const seq1 = states.slice(i, i + windowSize).join('|');
            for (let j = i + windowSize; j <= states.length - windowSize; j++) {
                const seq2 = states.slice(j, j + windowSize).join('|');
                if (seq1 === seq2) {
                    cycles.push({
                        sequence: seq1,
                        first_position: i,
                        repeated_position: j,
                        window_size: windowSize
                    });
                }
            }
        }
    }

    const uniqueCycles = [];
    const seen = new Set();
    cycles.forEach(c => {
        const key = c.sequence + '|' + c.window_size;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueCycles.push(c);
        }
    });

    return {
        cycles: uniqueCycles.slice(0, 10),
        cycle_pattern: uniqueCycles.length > 0 ? 'REPEATING' : 'NONE',
        cycle_count: uniqueCycles.length
    };
}

// === MAIN COMPUTATION ===

function computeCognitiveReflection(
    continuityState, continuityHistory,
    contextState, contextHistory,
    transitionState, transitionHistory,
    equilibriumState, equilibriumHistory,
    metaStabilityState, metaStabilityHistory,
    reflectionHistory = []
) {
    // Step 1: Compute pattern metrics across all layers
    const patternMetrics = computePatternMetrics(
        continuityHistory, contextHistory, transitionHistory,
        equilibriumHistory, metaStabilityHistory, reflectionHistory
    );

    // Step 2: Detect reflection fragmentation
    const fragmentation = detectReflectionFragmentation(
        patternMetrics, reflectionHistory, continuityHistory, equilibriumHistory
    );

    // Step 3: Classify reflection state
    const classification = classifyReflectionState(patternMetrics, fragmentation, reflectionHistory);

    // Step 4: Compute drift profile
    const driftProfile = computeDrift(reflectionHistory);

    // Step 5: Compute uncertainty boundaries
    const uncertaintyBoundaries = computeUncertaintyBoundaries(patternMetrics, reflectionHistory);

    // Step 6: Compute stability evolution
    const stabilityEvolution = computeStabilityEvolution(
        continuityHistory, contextHistory, transitionHistory, equilibriumHistory, metaStabilityHistory
    );

    // Step 7: Compute fragmentation evolution
    const fragmentationEvolution = computeFragmentationEvolution(
        continuityHistory, contextHistory, transitionHistory, equilibriumHistory, metaStabilityHistory
    );

    // Step 8: Compute adaptation patterns
    const adaptationPatterns = computeAdaptationPatterns(reflectionHistory);

    // Step 9: Compute recovery progression
    const recoveryProgression = computeRecoveryProgression(reflectionHistory);

    // Step 10: Compute survivability tracking
    const survivabilityTracking = computeSurvivabilityTracking(
        continuityHistory, contextHistory, transitionHistory, equilibriumHistory, metaStabilityHistory, reflectionHistory
    );

    // Step 11: Compute recurring cycles
    const recurringCycles = computeRecurringCycles(reflectionHistory);

    // Step 12: Build reflective patterns array
    const reflectivePatterns = [];
    if (patternMetrics.patternCoherence >= 0.6) reflectivePatterns.push('HIGH_COHERENCE');
    if (patternMetrics.patternEchoStrength >= 0.6) reflectivePatterns.push('STRONG_PATTERN_ECHO');
    if (patternMetrics.driftPersistence >= 0.7) reflectivePatterns.push('PERSISTENT_DRIFT');
    if (patternMetrics.recurringReflectionCycles >= 2) reflectivePatterns.push('RECURRING_CYCLES');
    if (patternMetrics.alignmentScore >= 0.6) reflectivePatterns.push('LAYER_ALIGNMENT');
    if (adaptationPatterns.adaptation_trend === 'INCREASING') reflectivePatterns.push('ADAPTATION_GROWTH');
    if (adaptationPatterns.adaptation_trend === 'DECREASING') reflectivePatterns.push('ADAPTATION_DECAY');
    if (survivabilityTracking.system_survivable) reflectivePatterns.push('SYSTEM_SURVIVABLE');
    if (recoveryProgression.overall_recovery_rate >= 0.6) reflectivePatterns.push('RECOVERY_CAPABLE');
    if (stabilityEvolution.system_trajectory === 'IMPROVING') reflectivePatterns.push('STABILITY_IMPROVING');

    // Step 13: Build result
    const result = {
        reflection_state: classification.state,
        reflection_strength: Math.round(classification.reflectionStrength * 100) / 100,

        stable_reflection_regions: patternMetrics.patternCoherence >= 0.6
            ? patternMetrics.layerStates.filter(l => l.strength >= 0.6).map(l => l.state)
            : [],

        reflective_patterns: reflectivePatterns,

        recurring_reflection_cycles: recurringCycles.cycles.map(c => ({
            pattern: c.sequence,
            positions: [c.first_position, c.repeated_position],
            window_size: c.window_size
        })),

        stability_evolution_analysis: stabilityEvolution,

        fragmentation_evolution_analysis: fragmentationEvolution,

        adaptation_patterns: {
            detected_patterns: adaptationPatterns.patterns,
            adaptation_trend: adaptationPatterns.adaptation_trend,
            increase_count: adaptationPatterns.increase_count,
            decrease_count: adaptationPatterns.decrease_count
        },

        recovery_progression_analysis: recoveryProgression,

        survivability_tracking: survivabilityTracking,

        reflection_drift_profile: {
            profile: driftProfile.profile,
            description: driftProfile.description,
            direction: driftProfile.direction,
            drift_magnitude: driftProfile.drift_magnitude || null
        },

        environmental_reflection_summary: {
            pattern_coherence: Math.round(patternMetrics.patternCoherence * 100) / 100,
            drift_persistence: Math.round(patternMetrics.driftPersistence * 100) / 100,
            pattern_echo_strength: Math.round(patternMetrics.patternEchoStrength * 100) / 100,
            adaptation_rate: Math.round(patternMetrics.adaptationRate * 100) / 100,
            recovery_continuity: Math.round(patternMetrics.recoveryContinuity * 100) / 100,
            alignment_score: Math.round(patternMetrics.alignmentScore * 100) / 100,
            pattern_variance: patternMetrics.patternVariance,
            dominant_layer_state: patternMetrics.dominantLayerState,
            drift_direction: patternMetrics.driftDirection,
            layer_history_lengths: patternMetrics.layerHistoryLengths,
            recurring_cycle_count: recurringCycles.cycle_count,
            fragmentation_count: fragmentation.length
        },

        uncertainty_boundaries: uncertaintyBoundaries,

        reflection_fragmentation: fragmentation,

        bounded_memory: {
            max_history: MAX_HISTORY,
            reflection_history_used: reflectionHistory.length,
            retention_policy: 'bounded_rolling_30'
        },

        generated_at: new Date().toISOString(),
        shadow_only: true,
        phase: 'MCAI Phase 8A',
        parent_phases: ['7A (Continuity)', '7B (Context)', '7C (Transition)', '7D (Equilibrium)', '7E (Meta-Stability)']
    };

    return result;
}

// === PERSISTENCE ===

function saveReflectionState(reflectionState) {
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }

    fs.writeFileSync(REFLECTION_FILE, JSON.stringify(reflectionState, null, 2));

    const historyEntry = {
        timestamp: reflectionState.generated_at,
        reflection_state: reflectionState.reflection_state,
        reflection_strength: reflectionState.reflection_strength,
        pattern_coherence: reflectionState.environmental_reflection_summary?.pattern_coherence,
        dominant_layer_state: reflectionState.environmental_reflection_summary?.dominant_layer_state
    };

    try {
        const existingHistory = fs.existsSync(REFLECTION_HISTORY_FILE)
            ? fs.readFileSync(REFLECTION_HISTORY_FILE, 'utf8').trim().split('\n').map(line => JSON.parse(line))
            : [];

        const updatedHistory = [...existingHistory, historyEntry].slice(-MAX_HISTORY);
        fs.writeFileSync(REFLECTION_HISTORY_FILE, updatedHistory.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch (e) {
        fs.appendFileSync(REFLECTION_HISTORY_FILE, JSON.stringify(historyEntry) + '\n');
    }

    const auditEntry = {
        timestamp: reflectionState.generated_at,
        type: 'EXECUTIVE_COGNITIVE_REFLECTION_COMPUTED',
        state: reflectionState.reflection_state,
        strength: reflectionState.reflection_strength,
        patterns: reflectionState.reflective_patterns?.length || 0,
        drift: reflectionState.reflection_drift_profile?.profile
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === CLI ===

if (require.main === module) {
    try {
        const loadLayer = (file) => {
            const fp = path.join(STATE_DIR, file);
            if (!fs.existsSync(fp)) return {};
            try {
                const content = fs.readFileSync(fp, 'utf8').trim();
                if (!content) return {};
                const parsed = JSON.parse(content);
                // Determine if this is a state file or history
                if (parsed.generated_at && parsed.phase) return parsed;
                return parsed;
            } catch { return {}; }
        };

        const loadHistory = (file, defaultState = {}) => {
            const fp = path.join(STATE_DIR, file);
            if (!fs.existsSync(fp)) return [];
            try {
                const content = fs.readFileSync(fp, 'utf8').trim();
                if (!content) return [];
                return content.split('\n').filter(l => l.trim()).map(line => {
                    try { return JSON.parse(line); } catch { return defaultState; }
                });
            } catch { return []; }
        };

        const continuityState = loadLayer('executive-cognitive-continuity.json');
        const contextState = loadLayer('executive-context-consolidation.json');
        const transitionState = loadLayer('executive-cognitive-transition.json');
        const equilibriumState = loadLayer('executive-cognitive-equilibrium.json');
        const metaStabilityState = loadLayer('executive-cognitive-meta-stability.json');

        const continuityHistory = loadHistory('executive-cognitive-continuity-history.jsonl');
        const contextHistory = loadHistory('executive-context-consolidation-history.jsonl');
        const transitionHistory = loadHistory('executive-cognitive-transition-history.jsonl');
        const equilibriumHistory = loadHistory('executive-cognitive-equilibrium-history.jsonl');
        const metaStabilityHistory = loadHistory('executive-cognitive-meta-stability-history.jsonl');
        const reflectionHistory = loadHistory('executive-cognitive-reflection-history.jsonl');

        const result = computeCognitiveReflection(
            continuityState, continuityHistory,
            contextState, contextHistory,
            transitionState, transitionHistory,
            equilibriumState, equilibriumHistory,
            metaStabilityState, metaStabilityHistory,
            reflectionHistory
        );
        saveReflectionState(result);

        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = {
    computeCognitiveReflection,
    saveReflectionState,
    REFLECTION_STATES,
    DRIFT_PROFILES,
    FRAGMENTATION_TYPES
};