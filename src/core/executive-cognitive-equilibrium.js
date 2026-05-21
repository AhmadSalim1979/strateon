/**
 * Executive Cognitive Equilibrium Layer — MCAI Phase 7D
 * SHADOW-ONLY: Observational cognitive equilibrium detection without action authority.
 *
 * This module observes whether the overall executive cognitive system is in
 * equilibrium — a state where continuity (7A), context consolidation (7B), and
 * transition dynamics (7C) are balanced and stable. Equilibrium is the highest
 * integration layer, synthesizing all three prior layers into a unified assessment.
 *
 * The system may observe equilibrium state — it may NOT plan, decide, recommend,
 * execute, or assign authority.
 *
 * NO prioritization. NO recommendations. NO planning. NO decisions. NO actions.
 * NO remediation. NO enforcement. NO intervention. NO behavioral adaptation.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const EQUILIBRIUM_FILE = path.join(STATE_DIR, 'executive-cognitive-equilibrium.json');
const EQUILIBRIUM_HISTORY_FILE = path.join(STATE_DIR, 'executive-cognitive-equilibrium-history.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const MAX_HISTORY = 30;
const EQUILIBRIUM_WINDOW = 10;
const STABILITY_WINDOW = 15;
const IMBALANCED_EQUILIBRIUM = 0.30;
const FORMING_EQUILIBRIUM = 0.50;
const ESTABLISHED_EQUILIBRIUM = 0.70;
const DEEP_EQUILIBRIUM = 0.85;

// === EQUILIBRIUM STATES ===

const EQUILIBRIUM_STATES = {
    IMBALANCED: {
        state: 'IMBALANCED',
        description: 'Executive cognitive equilibrium is absent. The system exhibits extreme oscillation, fragmentation, or collapse across continuity, context, and transition dimensions. No unified equilibrium exists.',
        requirements: 'Equilibrium strength < 0.30 OR (fragmentation_score > 0.75 AND oscillation_index > 0.6)'
    },
    FORMING: {
        state: 'FORMING',
        description: 'Executive cognitive equilibrium is forming. Partial integration across continuity, context, and transition dimensions. System is approaching stability but not yet balanced.',
        requirements: 'Equilibrium strength >= 0.30 AND < 0.50 AND fragmentation_score <= 0.75'
    },
    ESTABLISHED: {
        state: 'ESTABLISHED',
        description: 'Executive cognitive equilibrium is established. All three dimensions are balanced and mutually reinforcing. System exhibits stable equilibrium with moderate resilience.',
        requirements: 'Equilibrium strength >= 0.50 AND < 0.85 AND fragmentation_score <= 0.5 AND equilibrium_history.length >= EQUILIBRIUM_WINDOW'
    },
    DEEP_EQUILIBRIUM: {
        state: 'DEEP_EQUILIBRIUM',
        description: 'Executive cognitive equilibrium is deep and resilient. All dimensions are deeply integrated and mutually reinforcing. System maintains equilibrium through environmental disruption.',
        requirements: 'Equilibrium strength >= 0.85 AND fragmentation_score <= 0.25 AND equilibrium_history.length >= STABILITY_WINDOW'
    }
};

// === DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: { profile: 'STRENGTHENING', description: 'Equilibrium is strengthening. System is moving toward deeper balance.', direction: 'POSITIVE' },
    WEAKENING: { profile: 'WEAKENING', description: 'Equilibrium is weakening. System is drifting toward imbalance.', direction: 'NEGATIVE' },
    STABILIZING: { profile: 'STABILIZING', description: 'Equilibrium is stable. No significant drift in equilibrium state.', direction: 'NEUTRAL' },
    OSCILLATING: { profile: 'OSCILLATING', description: 'Equilibrium is oscillating. Balance fluctuates without convergence.', direction: 'UNSTABLE' },
    FRAGMENTING: { profile: 'FRAGMENTING', description: 'Equilibrium is fragmenting. Component dimensions are losing coherence.', direction: 'DISPERSED' },
    RECOVERING: { profile: 'RECOVERING', description: 'Equilibrium is recovering from previous imbalance.', direction: 'POSITIVE_RECOVERY' },
    DEEPENING: { profile: 'DEEPENING', description: 'Equilibrium is deepening. System is moving toward DEEP_EQUILIBRIUM.', direction: 'ENTRENCHING' },
    ADAPTING: { profile: 'ADAPTING', description: 'Equilibrium is adapting. System is adjusting to maintain balance under change.', direction: 'TRANSITIONAL' },
    IMBALANCED: { profile: 'IMBALANCED', description: 'Equilibrium is absent or critically weakened.', direction: 'ABSENT' },
    INDETERMINATE: { profile: 'INDETERMINATE', description: 'Equilibrium drift cannot be determined. Insufficient history or conflicting signals.', direction: 'UNKNOWN' }
};

// === EQUILIBRIUM FRAGMENTATION TYPES ===

const FRAGMENTATION_TYPES = {
    DIMENSIONAL_IMBALANCE: {
        type: 'DIMENSIONAL_IMBALANCE',
        severity: 'HIGH',
        description: 'Equilibrium is dimensionaly imbalanced. One or more dimensions (continuity, context, transition) are not aligned.',
        detection: 'One dimension strength differs from composite by > 0.3'
    },
    EQUILIBRIUM_COLLAPSE: {
        type: 'EQUILIBRIUM_COLLAPSE',
        severity: 'CRITICAL',
        description: 'Equilibrium has collapsed. No balanced state exists across any dimension.',
        detection: 'equilibrium_strength < 0.25 AND fragmentation_score > 0.8'
    },
    OSCILLATORY_EQUILIBRIUM: {
        type: 'OSCILLATORY_EQUILIBRIUM',
        severity: 'MEDIUM',
        description: 'Equilibrium is oscillatory. Balance alternates without stabilizing.',
        detection: 'equilibrium_oscillation_index > 0.5 AND equilibrium_strength > 0.4'
    },
    CONTINUITY_CONTEXT_DIVERGENCE: {
        type: 'CONTINUITY_CONTEXT_DIVERGENCE',
        severity: 'MEDIUM',
        description: 'Continuity and context dimensions are diverging. One strengthening while the other weakens.',
        detection: 'continuity_strength and context_strength drift in opposite directions by > 0.2'
    },
    TRANSITION_EQUILIBRIUM_CONFLICT: {
        type: 'TRANSITION_EQUILIBRIUM_CONFLICT',
        severity: 'MEDIUM',
        description: 'Transition dynamics conflict with equilibrium. Regime shifts disrupt established balance.',
        detection: 'transition_in_progress AND equilibrium_strength < 0.5'
    },
    REINFORCEMENT_FAILURE: {
        type: 'REINFORCEMENT_FAILURE',
        severity: 'HIGH',
        description: 'Equilibrium reinforcement failed. System cannot sustain balanced state.',
        detection: 'equilibrium_strength declining AND equilibrium_history.length > 5'
    }
};

// === CROSS-DIMENSIONAL ANALYSIS ===

function computeCrossDimensionalAnalysis(continuityState, contextState, transitionState) {
    const continuityStrength = continuityState?.continuity_strength || 0.5;
    const contextStrength = contextState?.consolidation_strength || 0.5;
    const transitionStrength = transitionState?.transition_strength || 0.5;

    // Dimension strengths
    const dimensionStrengths = {
        continuity: continuityStrength,
        context: contextStrength,
        transition: transitionStrength
    };

    // Balance score: how evenly distributed are the three dimensions?
    const strengths = [continuityStrength, contextStrength, transitionStrength];
    const avgStrength = strengths.reduce((a, b) => a + b, 0) / 3;
    const variance = strengths.reduce((sum, s) => sum + Math.pow(s - avgStrength, 2), 0) / 3;
    const balanceScore = 1 - Math.sqrt(variance); // 1 = perfectly balanced, 0 = maximally imbalanced

    // Alignment score: are all dimensions in compatible states?
    const compatibleStates = {
        continuity: ['FRAGMENTED', 'TRANSITIONAL', 'CONTINUOUS', 'ENTRENCHED_CONTINUITY'],
        context: ['DIFFUSE', 'FORMING', 'CONSOLIDATED', 'ENTRENCHED_CONTEXT'],
        transition: ['STATIC', 'TRANSITIONING', 'STABILIZING', 'REGIME_SHIFT']
    };

    const continuityIdx = compatibleStates.continuity.indexOf(continuityState?.continuity_state);
    const contextIdx = compatibleStates.context.indexOf(contextState?.context_state);
    const transitionIdx = compatibleStates.transition.indexOf(transitionState?.transition_state);

    // If all in lower half (< 2), system is struggling
    // If all in upper half (>= 2), system is strong
    const allIndices = [continuityIdx, contextIdx, transitionIdx].filter(i => i >= 0);
    const alignmentScore = allIndices.length === 3
        ? (allIndices.reduce((a, b) => a + b, 0) / 3 / 3) // normalize to 0-1
        : 0.5;

    // Mutual reinforcement: do dimensions reinforce each other?
    // Strong continuity + strong context = reinforced stability
    // Strong transition coherence + strong continuity = coherent evolution
    // Strong context + strong transition carryover = stable regime
    const mutualReinforcement = (
        (continuityStrength * contextStrength) * 0.35 +
        (transitionStrength * continuityStrength) * 0.35 +
        (contextStrength * transitionStrength) * 0.30
    );

    // Integration score: overall synthesis of all three dimensions
    const integrationScore = (
        balanceScore * 0.25 +
        alignmentScore * 0.25 +
        mutualReinforcement * 0.30 +
        Math.min(continuityStrength, contextStrength, transitionStrength) * 0.20 // weakest-link constraint
    );

    return {
        dimensionStrengths,
        balanceScore: Math.round(balanceScore * 100) / 100,
        alignmentScore: Math.round(alignmentScore * 100) / 100,
        mutualReinforcement: Math.round(mutualReinforcement * 100) / 100,
        integrationScore: Math.round(integrationScore * 100) / 100,
        weakestDimension: Object.entries(dimensionStrengths).sort((a, b) => a[1] - b[1])[0]?.[0],
        strongestDimension: Object.entries(dimensionStrengths).sort((a, b) => b[1] - a[1])[0]?.[0]
    };
}

// === COMPUTE EQUILIBRIUM METRICS ===

function computeEquilibriumMetrics(continuityState, contextState, transitionState, equilibriumHistory) {
    const crossDimensional = computeCrossDimensionalAnalysis(continuityState, contextState, transitionState);

    // Equilibrium strength: composite of integration and cross-dimensional analysis
    const equilibrium_strength = crossDimensional.integrationScore;

    // Fragmentation score: how fragmented is the equilibrium?
    // High fragmentation = dimensions out of balance
    const fragmentation_score = 1 - crossDimensional.balanceScore;

    // Oscillation index: how much does equilibrium fluctuate?
    const recentEquilibriums = equilibriumHistory.slice(-EQUILIBRIUM_WINDOW);
    let oscillationCount = 0;
    for (let i = 1; i < recentEquilibriums.length; i++) {
        const prev = recentEquilibriums[i - 1]?.equilibrium_strength || 0.5;
        const curr = recentEquilibriums[i]?.equilibrium_strength || 0.5;
        if (Math.abs(curr - prev) > 0.12) oscillationCount++;
    }
    const equilibrium_oscillation_index = recentEquilibriums.length > 1
        ? oscillationCount / (recentEquilibriums.length - 1)
        : 0;

    // Stability: how consistent is the equilibrium over time?
    const strengthValues = recentEquilibriums.map(h => h.equilibrium_strength || 0.5);
    const stability_score = strengthValues.length > 1
        ? 1 - (Math.max(...strengthValues) - Math.min(...strengthValues))
        : 1;

    // Resilience: can equilibrium survive disruption?
    // Computed as: strength of weakest dimension × integration score
    const weakestDimStrength = crossDimensional.dimensionStrengths[crossDimensional.weakestDimension] || 0.5;
    const resilience_score = weakestDimStrength * crossDimensional.integrationScore;

    // Equilibrium carryover: does equilibrium persist across observation windows?
    const priorEquilibriums = equilibriumHistory.slice(-STABILITY_WINDOW, -EQUILIBRIUM_WINDOW);
    const carryoverCount = recentEquilibriums.filter(r =>
        priorEquilibriums.some(p =>
            Math.abs((r.equilibrium_strength || 0.5) - (p.equilibrium_strength || 0.5)) < 0.15
        )
    ).length;
    const carryover_score = recentEquilibriums.length > 0
        ? carryoverCount / recentEquilibriums.length
        : 0;

    return {
        equilibrium_strength: Math.max(0, Math.min(1, equilibrium_strength)),
        fragmentation_score: Math.min(1, fragmentation_score),
        equilibrium_oscillation_index: Math.min(1, equilibrium_oscillation_index),
        stability_score: Math.max(0, Math.min(1, stability_score)),
        resilience_score: Math.max(0, Math.min(1, resilience_score)),
        carryover_score: Math.max(0, Math.min(1, carryover_score)),
        crossDimensional,
        oscillation_count: oscillationCount,
        equilibrium_history_length: equilibriumHistory.length
    };
}

// === DETECT FRAGMENTATION ===

function detectFragmentation(metrics, continuityState, contextState, transitionState, equilibriumHistory) {
    const fragmentation = [];

    // Dimensional imbalance
    const dims = metrics.crossDimensional.dimensionStrengths;
    const dimValues = Object.values(dims);
    const maxDiff = Math.max(...dimValues) - Math.min(...dimValues);
    if (maxDiff > 0.3) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.DIMENSIONAL_IMBALANCE,
            evidence: {
                dimension_strengths: dims,
                max_difference: Math.round(maxDiff * 100) / 100,
                weakest: metrics.crossDimensional.weakestDimension,
                strongest: metrics.crossDimensional.strongestDimension
            }
        });
    }

    // Equilibrium collapse
    if (metrics.equilibrium_strength < 0.25 && metrics.fragmentation_score > 0.8) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.EQUILIBRIUM_COLLAPSE,
            evidence: {
                equilibrium_strength: metrics.equilibrium_strength,
                fragmentation_score: metrics.fragmentation_score
            }
        });
    }

    // Oscillatory equilibrium
    if (metrics.equilibrium_oscillation_index > 0.5 && metrics.equilibrium_strength > 0.4) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.OSCILLATORY_EQUILIBRIUM,
            evidence: {
                oscillation_index: metrics.equilibrium_oscillation_index,
                equilibrium_strength: metrics.equilibrium_strength
            }
        });
    }

    // Continuity-context divergence
    const continuityStrength = continuityState?.continuity_strength || 0.5;
    const contextStrength = contextState?.consolidation_strength || 0.5;
    if (Math.abs(continuityStrength - contextStrength) > 0.2) {
        const dir = continuityStrength > contextStrength ? 'continuity_stronger' : 'context_stronger';
        fragmentation.push({
            ...FRAGMENTATION_TYPES.CONTINUITY_CONTEXT_DIVERGENCE,
            evidence: {
                continuity_strength: continuityStrength,
                context_strength: contextStrength,
                divergence_direction: dir
            }
        });
    }

    // Transition-equilibrium conflict
    if (transitionState?.transition_in_progress && metrics.equilibrium_strength < 0.5) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.TRANSITION_EQUILIBRIUM_CONFLICT,
            evidence: {
                transition_in_progress: true,
                equilibrium_strength: metrics.equilibrium_strength
            }
        });
    }

    // Reinforcement failure (equilibrium declining over time)
    const recentDecline = equilibriumHistory.slice(-6);
    if (recentDecline.length >= 3) {
        const first = recentDecline[0]?.equilibrium_strength || 0.5;
        const last = recentDecline[recentDecline.length - 1]?.equilibrium_strength || 0.5;
        if (last < first - 0.15) {
            fragmentation.push({
                ...FRAGMENTATION_TYPES.REINFORCEMENT_FAILURE,
                evidence: {
                    first_strength: first,
                    last_strength: last,
                    decline: Math.round((first - last) * 100) / 100
                }
            });
        }
    }

    return fragmentation;
}

// === CLASSIFY EQUILIBRIUM STATE ===

function classifyEquilibriumState(metrics, fragmentation, equilibriumHistory) {
    const criticalFragmentation = fragmentation.filter(f => f.severity === 'CRITICAL').length;
    const highFragmentation = fragmentation.filter(f => f.severity === 'HIGH').length;

    // Collapse — critical fragmentation
    if (criticalFragmentation >= 1 || (criticalFragmentation + highFragmentation >= 2)) {
        return { state: EQUILIBRIUM_STATES.IMBALANCED.state, equilibrium_strength: metrics.equilibrium_strength };
    }

    // Imbalanced: very low strength OR high combined fragmentation
    if (metrics.equilibrium_strength < IMBALANCED_EQUILIBRIUM ||
        (metrics.fragmentation_score > 0.75 && metrics.equilibrium_oscillation_index > 0.6)) {
        return { state: EQUILIBRIUM_STATES.IMBALANCED.state, equilibrium_strength: metrics.equilibrium_strength };
    }

    // Forming: moderate strength, not yet stable
    if (metrics.equilibrium_strength >= IMBALANCED_EQUILIBRIUM && metrics.equilibrium_strength < FORMING_EQUILIBRIUM) {
        return { state: EQUILIBRIUM_STATES.FORMING.state, equilibrium_strength: metrics.equilibrium_strength };
    }

    // Deep equilibrium: very high strength + sufficient history + low fragmentation
    if (metrics.equilibrium_strength >= DEEP_EQUILIBRIUM &&
        metrics.fragmentation_score <= 0.25 &&
        equilibriumHistory.length >= STABILITY_WINDOW) {
        return { state: EQUILIBRIUM_STATES.DEEP_EQUILIBRIUM.state, equilibrium_strength: metrics.equilibrium_strength };
    }

    // Established: moderate-to-high strength with sufficient history
    if (metrics.equilibrium_strength >= FORMING_EQUILIBRIUM && metrics.equilibrium_strength < DEEP_EQUILIBRIUM) {
        return { state: EQUILIBRIUM_STATES.ESTABLISHED.state, equilibrium_strength: metrics.equilibrium_strength };
    }

    // Forming: residual fallback
    return { state: EQUILIBRIUM_STATES.FORMING.state, equilibrium_strength: metrics.equilibrium_strength };
}

// === COMPUTE STABILITY ASSESSMENT ===

function computeStabilityAssessment(metrics) {
    return {
        equilibrium_resilience: Math.round(metrics.resilience_score * 100) / 100,
        equilibrium_stability: Math.round(metrics.stability_score * 100) / 100,
        equilibrium_continuity: Math.round(metrics.carryover_score * 100) / 100,
        dimensional_balance: Math.round(metrics.crossDimensional.balanceScore * 100) / 100,
        integration_coherence: Math.round(metrics.crossDimensional.integrationScore * 100) / 100,
        mutual_reinforcement: Math.round(metrics.crossDimensional.mutualReinforcement * 100) / 100,
        oscillation_resistance: Math.round((1 - metrics.equilibrium_oscillation_index) * 100) / 100,
        fragmentation_resistance: Math.round((1 - metrics.fragmentation_score) * 100) / 100
    };
}

// === COMPUTE DRIFT ===

function computeDrift(equilibriumHistory) {
    if (equilibriumHistory.length < 5) {
        return { ...DRIFT_PROFILES.INDETERMINATE, reason: 'INSUFFICIENT_HISTORY' };
    }

    const recentStrengths = equilibriumHistory.slice(-7).map(h => h.equilibrium_strength || 0.5);
    const earlyAvg = recentStrengths.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const lateAvg = recentStrengths.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const drift = lateAvg - earlyAvg;

    const oscillations = recentStrengths.filter((v, i) => i > 0 && Math.abs(v - recentStrengths[i - 1]) > 0.12).length;

    if (oscillations >= 3) {
        return { ...DRIFT_PROFILES.OSCILLATING, oscillation_count: oscillations };
    }

    if (drift > 0.08) {
        const firstHalfAvg = recentStrengths.slice(0, Math.floor(recentStrengths.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(recentStrengths.length / 2);
        if (firstHalfAvg < 0.5 && drift > 0.12) {
            return { ...DRIFT_PROFILES.RECOVERING, drift_magnitude: drift };
        }
        if (lateAvg > 0.8) {
            return { ...DRIFT_PROFILES.DEEPENING, drift_magnitude: drift };
        }
        return { ...DRIFT_PROFILES.STRENGTHENING, drift_magnitude: drift };
    } else if (drift < -0.08) {
        if (lateAvg < 0.35) {
            return { ...DRIFT_PROFILES.IMBALANCED, drift_magnitude: Math.abs(drift) };
        }
        return { ...DRIFT_PROFILES.WEAKENING, drift_magnitude: Math.abs(drift) };
    } else {
        if (equilibriumHistory.length >= 5 && equilibriumHistory.slice(-5).filter(h => h.equilibrium_strength > 0.6).length >= 3) {
            return { ...DRIFT_PROFILES.ADAPTING, drift_magnitude: 0 };
        }
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
    }
}

// === COMPUTE UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(metrics, equilibriumHistory) {
    const boundaries = [];

    if (equilibriumHistory.length < EQUILIBRIUM_WINDOW) {
        boundaries.push({
            type: 'EQUILIBRIUM_WINDOW_INSUFFICIENT',
            description: 'Equilibrium classification requires more history for stable assessment.',
            confidence: 'LOW',
            caveat: 'Early classifications may not reflect true equilibrium state.'
        });
    }

    if (metrics.equilibrium_oscillation_index > 0.4 && metrics.equilibrium_oscillation_index < 0.6) {
        boundaries.push({
            type: 'OSCILLATION_AMBIGUITY',
            description: 'Equilibrium oscillation is moderate. Stability is uncertain.',
            confidence: 'MEDIUM',
            caveat: 'Oscillation may resolve into stability or escalate into fragmentation.'
        });
    }

    if (metrics.crossDimensional.balanceScore < 0.5 && metrics.equilibrium_strength > 0.6) {
        boundaries.push({
            type: 'BALANCE_STRENGTH_CONFLICT',
            description: 'High equilibrium strength with low dimensional balance. Confidence is reduced.',
            confidence: 'MEDIUM',
            caveat: 'Equilibrium may be unstable despite high aggregate strength.'
        });
    }

    if (metrics.equilibrium_strength > 0.7 && metrics.fragmentation_score > 0.4) {
        boundaries.push({
            type: 'STRENGTH_FRAGMENTATION_DIVERGENCE',
            description: 'High strength coexists with high fragmentation. Long-term stability uncertain.',
            confidence: 'MEDIUM',
            caveat: 'Fragmentation may erode strength as more data accumulates.'
        });
    }

    return boundaries;
}

// === MAIN COMPUTATION ===

function computeCognitiveEquilibrium(continuityState, contextState, transitionState, equilibriumHistory = []) {
    // Step 1: Compute equilibrium metrics
    const metrics = computeEquilibriumMetrics(continuityState, contextState, transitionState, equilibriumHistory);

    // Step 2: Detect fragmentation
    const fragmentation = detectFragmentation(metrics, continuityState, contextState, transitionState, equilibriumHistory);

    // Step 3: Classify equilibrium state
    const classification = classifyEquilibriumState(metrics, fragmentation, equilibriumHistory);

    // Step 4: Compute stability assessment
    const stabilityAssessment = computeStabilityAssessment(metrics);

    // Step 5: Compute drift profile
    const driftProfile = computeDrift(equilibriumHistory);

    // Step 6: Compute uncertainty boundaries
    const uncertaintyBoundaries = computeUncertaintyBoundaries(metrics, equilibriumHistory);

    // Step 7: Component summaries
    const componentSummaries = {
        continuity: {
            state: continuityState?.continuity_state || 'UNKNOWN',
            strength: continuityState?.continuity_strength || 0,
            drift: continuityState?.continuity_drift_profile?.profile || 'UNKNOWN'
        },
        context: {
            state: contextState?.context_state || 'UNKNOWN',
            strength: contextState?.consolidation_strength || 0,
            drift: contextState?.context_drift_profile?.profile || 'UNKNOWN'
        },
        transition: {
            state: transitionState?.transition_state || 'UNKNOWN',
            strength: transitionState?.transition_strength || 0,
            drift: transitionState?.transition_drift_profile?.profile || 'UNKNOWN'
        }
    };

    // Step 8: Build result
    const result = {
        equilibrium_state: classification.state,
        equilibrium_strength: Math.round(classification.equilibrium_strength * 100) / 100,
        stable_equilibrium_regions: metrics.equilibrium_strength >= ESTABLISHED_EQUILIBRIUM
            ? Object.entries(metrics.crossDimensional.dimensionStrengths)
                .filter(([, s]) => s >= 0.6)
                .map(([dim]) => dim)
            : [],
        fragmented_equilibrium_regions: metrics.fragmentation_score > 0.5
            ? Object.entries(metrics.crossDimensional.dimensionStrengths)
                .filter(([, s]) => s < 0.5)
                .map(([dim]) => dim)
            : [],
        equilibrium_fragmentation: fragmentation,
        survivability_regions: [
            ...(metrics.resilience_score >= 0.6 ? [{ region: 'SYSTEM', status: 'RESILIENT' }] : []),
            ...(metrics.carryover_score >= 0.6 ? [{ region: 'SYSTEM', status: 'PERSISTENT' }] : []),
            ...(metrics.fragmentation_score > 0.5 ? [{ region: 'SYSTEM', status: 'FRAGMENTATION_RISK' }] : [])
        ],
        equilibrium_stability_assessment: stabilityAssessment,
        equilibrium_drift_profile: {
            profile: driftProfile.profile,
            description: driftProfile.description,
            direction: driftProfile.direction,
            drift_magnitude: driftProfile.drift_magnitude || null
        },
        uncertainty_boundaries: uncertaintyBoundaries,
        component_summaries: componentSummaries,
        dimensional_analysis: {
            dimension_strengths: {
                continuity: Math.round(metrics.crossDimensional.dimensionStrengths.continuity * 100) / 100,
                context: Math.round(metrics.crossDimensional.dimensionStrengths.context * 100) / 100,
                transition: Math.round(metrics.crossDimensional.dimensionStrengths.transition * 100) / 100
            },
            balance_score: metrics.crossDimensional.balanceScore,
            alignment_score: metrics.crossDimensional.alignmentScore,
            mutual_reinforcement: metrics.crossDimensional.mutualReinforcement,
            integration_score: metrics.crossDimensional.integrationScore,
            weakest_dimension: metrics.crossDimensional.weakestDimension,
            strongest_dimension: metrics.crossDimensional.strongestDimension
        },
        generated_at: new Date().toISOString(),
        shadow_only: true,
        phase: 'MCAI Phase 7D',
        parent_phases: ['7A (Continuity)', '7B (Context Consolidation)', '7C (Cognitive Transition)']
    };

    return result;
}

// === PERSISTENCE ===

function saveEquilibriumState(equilibriumState) {
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }

    fs.writeFileSync(EQUILIBRIUM_FILE, JSON.stringify(equilibriumState, null, 2));

    const historyEntry = {
        timestamp: equilibriumState.generated_at,
        equilibrium_state: equilibriumState.equilibrium_state,
        equilibrium_strength: equilibriumState.equilibrium_strength,
        fragmentation_count: equilibriumState.equilibrium_fragmentation.length,
        component_summaries: equilibriumState.component_summaries
    };

    try {
        const existingHistory = fs.existsSync(EQUILIBRIUM_HISTORY_FILE)
            ? fs.readFileSync(EQUILIBRIUM_HISTORY_FILE, 'utf8').trim().split('\n').map(line => JSON.parse(line))
            : [];

        const updatedHistory = [...existingHistory, historyEntry].slice(-MAX_HISTORY);
        fs.writeFileSync(EQUILIBRIUM_HISTORY_FILE, updatedHistory.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch (e) {
        fs.appendFileSync(EQUILIBRIUM_HISTORY_FILE, JSON.stringify(historyEntry) + '\n');
    }

    const auditEntry = {
        timestamp: equilibriumState.generated_at,
        type: 'EXECUTIVE_COGNITIVE_EQUILIBRIUM_COMPUTED',
        state: equilibriumState.equilibrium_state,
        strength: equilibriumState.equilibrium_strength,
        fragmentation: equilibriumState.equilibrium_fragmentation.length,
        drift: equilibriumState.equilibrium_drift_profile?.profile
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === CLI ===

if (require.main === module) {
    try {
        const continuityStateFile = path.join(STATE_DIR, 'executive-cognitive-continuity.json');
        const contextStateFile = path.join(STATE_DIR, 'executive-context-consolidation.json');
        const transitionStateFile = path.join(STATE_DIR, 'executive-cognitive-transition.json');

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
        if (fs.existsSync(EQUILIBRIUM_HISTORY_FILE)) {
            equilibriumHistory = fs.readFileSync(EQUILIBRIUM_HISTORY_FILE, 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }

        const result = computeCognitiveEquilibrium(continuityState, contextState, transitionState, equilibriumHistory);
        saveEquilibriumState(result);

        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = {
    computeCognitiveEquilibrium,
    saveEquilibriumState,
    EQUILIBRIUM_STATES,
    DRIFT_PROFILES,
    FRAGMENTATION_TYPES
};