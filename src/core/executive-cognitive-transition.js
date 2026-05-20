/**
 * Executive Cognitive Transition Layer — MCAI Phase 7C
 * SHADOW-ONLY: Observational cognitive transition modeling without action authority.
 * 
 * This module observes whether executive cognitive states transition coherently
 * or chaotically, whether prior cognitive structures survive transitions, and
 * whether regime shifts are stable or collapsing.
 * 
 * This builds on Phase 7A (continuity) and Phase 7B (context consolidation)
 * by modeling the TRANSITION dynamics between states.
 * 
 * The system may observe transitions — it may NOT plan, decide, recommend,
 * execute, or assign authority.
 * 
 * NO prioritization. NO recommendations. NO planning. NO decisions. NO actions.
 * NO remediation. NO enforcement. NO intervention. NO behavioral adaptation.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const TRANSITION_FILE = path.join(STATE_DIR, 'executive-cognitive-transition.json');
const TRANSITION_HISTORY_FILE = path.join(STATE_DIR, 'executive-cognitive-transition-history.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const MAX_HISTORY = 30;
const TRANSITION_WINDOW = 8;
const REGIME_WINDOW = 12;
const STATIC_THRESHOLD = 0.15;
const TRANSITIONING_STRENGTH = 0.35;
const STABILIZING_STRENGTH = 0.6;
const REGIME_SHIFT_STRENGTH = 0.70;

// === TRANSITION STATES ===

const TRANSITION_STATES = {
    STATIC: {
        state: 'STATIC',
        description: 'Executive cognitive state is static. No significant transitions occurring. Stability is high.',
        requirements: 'transition_rate < 0.15 AND transition_strength < TRANSITIONING_STRENGTH'
    },
    TRANSITIONING: {
        state: 'TRANSITIONING',
        description: 'Executive cognitive state is transitioning. Regime shift is in progress. Transition dynamics are active.',
        requirements: 'transition_rate >= 0.15 AND transition_rate < 0.5 AND transition_strength < STABILIZING_STRENGTH'
    },
    STABILIZING: {
        state: 'STABILIZING',
        description: 'Executive cognitive state is stabilizing after transition. New regime is consolidating. Transition has settled.',
        requirements: 'transition_strength >= STABILIZING_STRENGTH AND transition_rate < 0.5 AND carryover_score > 0.5'
    },
    REGIME_SHIFT: {
        state: 'REGIME_SHIFT',
        description: 'A regime shift has occurred. Prior cognitive structures have been displaced. New regime is dominant.',
        requirements: 'transition_strength >= REGIME_SHIFT_STRENGTH AND prior_regime_displaced AND transition_coherence > 0.6'
    }
};

// === DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: { profile: 'STRENGTHENING', description: 'Transition stability is strengthening. Regime is becoming more stable.', direction: 'POSITIVE' },
    WEAKENING: { profile: 'WEAKENING', description: 'Transition stability is weakening. Regime is becoming less stable.', direction: 'NEGATIVE' },
    STABILIZING: { profile: 'STABILIZING', description: 'Transition stability is stable. No significant drift.', direction: 'NEUTRAL' },
    OSCILLATING: { profile: 'OSCILLATING', description: 'Transition stability is oscillating. Regime alternates without stabilizing.', direction: 'UNSTABLE' },
    FRAGMENTING: { profile: 'FRAGMENTING', description: 'Transition stability is fragmenting. Regime coherence is breaking down.', direction: 'DISPERSED' },
    RECOVERING: { profile: 'RECOVERING', description: 'Transition stability is recovering from previous fragmentation.', direction: 'POSITIVE_RECOVERY' },
    ENTRENCHING: { profile: 'ENTRENCHING', description: 'Transition stability is deepening. New regime is becoming entrenched.', direction: 'ENTRENCHING' },
    ADAPTING: { profile: 'ADAPTING', description: 'Transition stability is adapting. Regime is shifting in response to pressure.', direction: 'TRANSITIONAL' },
    TRANSITIONAL: { profile: 'TRANSITIONAL', description: 'Transition is in progress. Regime is actively shifting.', direction: 'ACTIVE' },
    INDETERMINATE: { profile: 'INDETERMINATE', description: 'Transition drift cannot be determined. Insufficient history or conflicting signals.', direction: 'UNKNOWN' }
};

// === TRANSITION FRAGMENTATION TYPES ===

const FRAGMENTATION_TYPES = {
    UNSTABLE_TRANSITION: {
        type: 'UNSTABLE_TRANSITION',
        severity: 'HIGH',
        description: 'Transition is unstable. Multiple regime shifts without stabilization.',
        detection: 'transition_count >= 3 AND no_stable_regime_in_window'
    },
    TRANSITION_COLLAPSE: {
        type: 'TRANSITION_COLLAPSE',
        severity: 'CRITICAL',
        description: 'Transition has collapsed. No coherent regime structure remains.',
        detection: 'transition_coherence < 0.2 AND transition_rate > 0.6'
    },
    OSCILLATORY_TRANSITION: {
        type: 'OSCILLATORY_TRANSITION',
        severity: 'MEDIUM',
        description: 'Transition is oscillatory. Regime alternates between patterns without converging.',
        detection: 'oscillation_index > 0.5 AND regime_alternation_count >= 4'
    },
    FRAGMENTATION_DURING_TRANSITION: {
        type: 'FRAGMENTATION_DURING_TRANSITION',
        severity: 'MEDIUM',
        description: 'Fragmentation is occurring during transition. Regime is losing coherence while shifting.',
        detection: 'fragmentation_score > 0.5 AND transition_in_progress'
    },
    REINFORCEMENT_FAILURE: {
        type: 'REINFORCEMENT_FAILURE',
        severity: 'HIGH',
        description: 'Reinforcement failed during transition. New regime failed to stabilize.',
        detection: 'transition_completed BUT new_regime_strength < 0.4'
    },
    PRIOR_STRUCTURE_LOSS: {
        type: 'PRIOR_STRUCTURE_LOSS',
        severity: 'MEDIUM',
        description: 'Prior cognitive structure was lost during transition. No carryover detected.',
        detection: 'carryover_score < 0.3 AND transition_completed'
    }
};

// === COMPUTE TRANSITION METRICS ===

function computeTransitionMetrics(executiveState, transitionHistory, contextHistory) {
    const recent_transitions = transitionHistory.slice(-TRANSITION_WINDOW);
    const regime_transitions = transitionHistory.slice(-REGIME_WINDOW);
    
    // Transition rate: how often does the regime change?
    // Transition count: count across FULL history — tracks whether transitions have occurred
    // This distinguishes STABILIZING/REGIME_SHIFT (transitions occurred) from STATIC (no transitions ever)
    let transition_count_full = 0;
    let first_regime = transitionHistory[0]?.dominant_region;
    let last_regime = transitionHistory[transitionHistory.length - 1]?.dominant_region;
    for (let i = 1; i < transitionHistory.length; i++) {
        if (transitionHistory[i].dominant_region !== transitionHistory[i - 1].dominant_region) {
            transition_count_full++;
        }
    }
    const prior_regime_displaced = transition_count_full > 0 && first_regime && last_regime && first_regime !== last_regime;
    
    let transition_count = 0;
    for (let i = 1; i < recent_transitions.length; i++) {
        if (recent_transitions[i].dominant_region !== recent_transitions[i - 1].dominant_region) {
            transition_count++;
        }
    }
    const transition_rate = recent_transitions.length > 1 
        ? transition_count / (recent_transitions.length - 1) 
        : 0;
    
    // Transition strength: how significant is the current transition?
    // (prior_regime_displaced computed above using full history)
    
    // Regime dominance (recent window — represents established regime)
    const regime_counts_recent = {};
    recent_transitions.forEach(h => {
        if (h.dominant_region) regime_counts_recent[h.dominant_region] = (regime_counts_recent[h.dominant_region] || 0) + 1;
    });
    const dominant_regime_recent = Object.entries(regime_counts_recent).sort((a, b) => b[1] - a[1])[0]?.[0];
    const dominant_regime_count_recent = Object.values(regime_counts_recent)[0] || 0;
    const regime_dominance_recent = dominant_regime_count_recent / recent_transitions.length;
    
    // Regime dominance (full window)
    const regime_counts = {};
    regime_transitions.forEach(h => { 
        if (h.dominant_region) regime_counts[h.dominant_region] = (regime_counts[h.dominant_region] || 0) + 1;
    });
    const dominant_regime = Object.entries(regime_counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const dominant_regime_count = Object.values(regime_counts)[0] || 0;
    const regime_dominance = dominant_regime_count / regime_transitions.length;
    
    // Transition coherence: how coherent is the transition pattern?
    const transition_coherence = 1 - transition_rate;
    
    // Oscillation index
    let oscillations = 0;
    for (let i = 1; i < regime_transitions.length; i++) {
        if (regime_transitions[i].dominant_region !== regime_transitions[i - 1].dominant_region) {
            oscillations++;
        }
    }
    const oscillation_index = regime_transitions.length > 1 
        ? oscillations / (regime_transitions.length - 1) 
        : 0;
    
    // Regime alternation count
    const alternation_regions = Object.keys(regime_counts);
    const regime_alternation_count = alternation_regions.length;
    
    // Carryover: does prior structure survive transition?
    // Current window = last TRANSITION_WINDOW entries
    // Prior window = entries before current window (up to 10 entries before)
    const priorWindowSize = Math.min(10, transitionHistory.length - TRANSITION_WINDOW);
    const prior_contexts = contextHistory
        .slice(0, priorWindowSize)
        .map(h => h.context_region)
        .filter(Boolean);
    const current_contexts = transitionHistory
        .slice(-TRANSITION_WINDOW)
        .map(h => h.dominant_region)
        .filter(Boolean);
    const carryover_count = current_contexts.filter(r => prior_contexts.includes(r)).length;
    const carryover_score = current_contexts.length > 0
        ? carryover_count / current_contexts.length
        : 0;
    
    // Transition strength composite
    const transition_strength = (
        regime_dominance * 0.30 +
        carryover_score * 0.25 +
        (1 - oscillation_index) * 0.20 +
        (1 - transition_rate) * 0.25
    );
    
    return {
        transition_count,
        transition_rate: Math.min(1, transition_rate),
        prior_regime_displaced,
        regime_dominance,
        transition_coherence: Math.min(1, transition_coherence),
        oscillation_index,
        regime_alternation_count,
        carryover_score,
        transition_strength: Math.max(0, Math.min(1, transition_strength)),
        dominant_regime,
        dominant_regime_recent,
        regime_dominance_recent: Math.round(regime_dominance_recent * 100) / 100,
        transition_count_full,
        transition_in_progress: transition_count >= 2 && transition_rate > 0.2
    };
}

// === DETECT FRAGMENTATION ===

function detectFragmentation(metrics, transitionHistory, contextHistory) {
    const fragmentation = [];
    
    // Unstable transition
    if (metrics.transition_count >= 3 && metrics.regime_dominance < 0.5) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.UNSTABLE_TRANSITION,
            evidence: { transition_count: metrics.transition_count, regime_dominance: metrics.regime_dominance }
        });
    }
    
    // Transition collapse
    if (metrics.transition_coherence < 0.2 && metrics.transition_rate > 0.6) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.TRANSITION_COLLAPSE,
            evidence: { transition_coherence: metrics.transition_coherence, transition_rate: metrics.transition_rate }
        });
    }
    
    // Oscillatory transition
    if (metrics.oscillation_index > 0.5 && metrics.regime_alternation_count >= 4) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.OSCILLATORY_TRANSITION,
            evidence: { oscillation_index: metrics.oscillation_index, alternation_count: metrics.regime_alternation_count }
        });
    }
    
    // Fragmentation during transition
    if (metrics.transition_in_progress) {
        const recent_fragmentation = contextHistory.slice(-5).map(h => h.fragmentation_score || 0).reduce((a, b) => a + b, 0) / 5;
        if (recent_fragmentation > 0.5) {
            fragmentation.push({
                ...FRAGMENTATION_TYPES.FRAGMENTATION_DURING_TRANSITION,
                evidence: { transition_in_progress: true, recent_fragmentation }
            });
        }
    }
    
    // Reinforcement failure
    if (metrics.transition_count >= 1 && metrics.carryover_score < 0.4 && metrics.regime_dominance < 0.4) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.REINFORCEMENT_FAILURE,
            evidence: { carryover_score: metrics.carryover_score, regime_dominance: metrics.regime_dominance }
        });
    }
    
    // Prior structure loss
    if (metrics.carryover_score < 0.3 && metrics.transition_count >= 2) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.PRIOR_STRUCTURE_LOSS,
            evidence: { carryover_score: metrics.carryover_score, transition_count: metrics.transition_count }
        });
    }
    
    return fragmentation;
}

// === CLASSIFY TRANSITION STATE ===

function classifyTransitionState(metrics, fragmentation, transitionHistory) {
    const criticalFragmentation = fragmentation.filter(f => f.severity === 'CRITICAL').length;
    const prior_regime_displaced = metrics.prior_regime_displaced;
    
    // Transition collapse — critical fragmentation forces transitioning
    if (criticalFragmentation >= 1) {
        return { state: TRANSITION_STATES.TRANSITIONING.state, transition_strength: metrics.transition_strength };
    }
    
    // Static: No transitions have occurred in the FULL history (0 transitions = truly static)
    // This is the ONLY state that requires 0 transitions
    if (metrics.transition_count_full === 0) {
        return { state: TRANSITION_STATES.STATIC.state, transition_strength: metrics.transition_strength };
    }
    
    // Regime shift: prior regime displaced, strong new regime with dominance
    // Requires: transitions occurred (count_full > 0), prior displaced, strong coherence and dominance
    if (prior_regime_displaced && metrics.transition_strength >= REGIME_SHIFT_STRENGTH && metrics.transition_coherence > 0.6 && metrics.regime_dominance_recent >= 0.7) {
        return { state: TRANSITION_STATES.REGIME_SHIFT.state, transition_strength: metrics.transition_strength };
    }
    
    // Stabilizing: Transitions occurred, strength is high, carryover preserved
    // Distinguishes from STATIC (which has 0 transitions) and TRANSITIONING (which is less stable)
    if (metrics.transition_strength >= STABILIZING_STRENGTH && metrics.carryover_score > 0.5) {
        return { state: TRANSITION_STATES.STABILIZING.state, transition_strength: metrics.transition_strength };
    }
    
    // Transitioning: Default for states with transitions but not meeting other criteria
    if (metrics.transition_count_full > 0) {
        return { state: TRANSITION_STATES.TRANSITIONING.state, transition_strength: metrics.transition_strength };
    }
    
    // Transitioning: residual fallback
    return { state: TRANSITION_STATES.TRANSITIONING.state, transition_strength: metrics.transition_strength };
}

// === COMPUTE STABILITY ASSESSMENT ===

function computeStabilityAssessment(metrics) {
    return {
        transition_resilience: Math.round((metrics.transition_coherence * metrics.carryover_score) * 100) / 100,
        transition_survivability: Math.round(metrics.carryover_score * 100) / 100,
        interruption_resistance: Math.round((1 - metrics.oscillation_index) * metrics.carryover_score * 100) / 100,
        regime_stability: Math.round(metrics.regime_dominance * 100) / 100,
        transition_continuity: Math.round((1 - metrics.transition_rate) * 100) / 100,
        structural_carryover_integrity: Math.round(metrics.carryover_score * 100) / 100,
        coherence_under_transition: Math.round(metrics.transition_coherence * 100) / 100,
        oscillation_resistance: Math.round((1 - metrics.oscillation_index) * 100) / 100
    };
}

// === COMPUTE DRIFT ===

function computeDrift(transitionHistory) {
    if (transitionHistory.length < 5) {
        return { ...DRIFT_PROFILES.INDETERMINATE, reason: 'INSUFFICIENT_HISTORY' };
    }
    
    const recentStrengths = transitionHistory.slice(-6).map(h => h.transition_strength || 0.5);
    const earlyAvg = recentStrengths.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const lateAvg = recentStrengths.slice(-2).reduce((a, b) => a + b, 0) / 2;
    const drift = lateAvg - earlyAvg;
    
    const oscillations = recentStrengths.filter((v, i) => i > 0 && Math.abs(v - recentStrengths[i - 1]) > 0.1).length;
    
    if (oscillations >= 3) {
        return { ...DRIFT_PROFILES.OSCILLATING, oscillation_count: oscillations };
    }
    
    if (drift > 0.08) {
        const firstHalfAvg = recentStrengths.slice(0, Math.floor(recentStrengths.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(recentStrengths.length / 2);
        if (firstHalfAvg < 0.5 && drift > 0.12) {
            return { ...DRIFT_PROFILES.RECOVERING, drift_magnitude: drift };
        }
        if (lateAvg > 0.7) {
            return { ...DRIFT_PROFILES.ENTRENCHING, drift_magnitude: drift };
        }
        return { ...DRIFT_PROFILES.STRENGTHENING, drift_magnitude: drift };
    } else if (drift < -0.08) {
        return { ...DRIFT_PROFILES.WEAKENING, drift_magnitude: Math.abs(drift) };
    } else {
        if (transitionHistory.length >= 5 && transitionHistory.slice(-5).filter(h => h.transition_strength > 0.5).length >= 3) {
            return { ...DRIFT_PROFILES.ADAPTING, drift_magnitude: 0 };
        }
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
    }
}

// === COMPUTE UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(metrics, transitionHistory) {
    const boundaries = [];
    
    if (transitionHistory.length < TRANSITION_WINDOW) {
        boundaries.push({
            type: 'TRANSITION_WINDOW_INSUFFICIENT',
            description: 'Transition classification requires more history to establish patterns.',
            confidence: 'LOW',
            caveat: 'Early classifications may not reflect stable transition dynamics.'
        });
    }
    
    if (metrics.transition_in_progress && metrics.transition_coherence < 0.5) {
        boundaries.push({
            type: 'ACTIVE_TRANSITION_UNSTABLE',
            description: 'Transition is active but coherence is low. Outcome is uncertain.',
            confidence: 'MEDIUM',
            caveat: 'Regime may collapse or stabilize unpredictably.'
        });
    }
    
    if (metrics.oscillation_index > 0.4 && metrics.oscillation_index < 0.6) {
        boundaries.push({
            type: 'OSCILLATION_AMBIGUITY',
            description: 'Oscillation is moderate. Regime stability is uncertain.',
            confidence: 'MEDIUM',
            caveat: 'Oscillation may resolve into stability or escalate into fragmentation.'
        });
    }
    
    if (metrics.carryover_score < 0.4 && metrics.regime_dominance > 0.7) {
        boundaries.push({
            type: 'CARRYOVER_REGIME_CONFLICT',
            description: 'High regime dominance with weak carryover. Prior structure was displaced.',
            confidence: 'HIGH',
            caveat: 'Prior cognitive structure may not recover even if regime destabilizes.'
        });
    }
    
    return boundaries;
}

// === MAIN COMPUTATION ===

function computeCognitiveTransition(executiveState, transitionHistory = [], contextHistory = [], consolidationHistory = []) {
    // Step 1: Compute transition metrics
    const metrics = computeTransitionMetrics(executiveState, transitionHistory, contextHistory);
    
    // Step 2: Detect fragmentation
    const fragmentation = detectFragmentation(metrics, transitionHistory, contextHistory);
    
    // Step 3: Classify transition state
    const classification = classifyTransitionState(metrics, fragmentation, transitionHistory);
    
    // Step 4: Compute stability assessment
    const stabilityAssessment = computeStabilityAssessment(metrics);
    
    // Step 5: Compute drift profile
    const driftProfile = computeDrift(transitionHistory);
    
    // Step 6: Compute uncertainty boundaries
    const uncertaintyBoundaries = computeUncertaintyBoundaries(metrics, transitionHistory);
    
    // Step 7: Environmental summary
    const environmental_transition_summary = {
        transition_count: metrics.transition_count,
        transition_count_full: metrics.transition_count_full,
        transition_rate: Math.round(metrics.transition_rate * 100) / 100,
        prior_regime_displaced: metrics.prior_regime_displaced || false,
        regime_dominance_recent: metrics.regime_dominance_recent,
        transition_coherence: Math.round(metrics.transition_coherence * 100) / 100,
        oscillation_index: Math.round(metrics.oscillation_index * 100) / 100,
        carryover_score: Math.round(metrics.carryover_score * 100) / 100,
        transition_strength: Math.round(metrics.transition_strength * 100) / 100,
        dominant_regime: metrics.dominant_regime,
        transition_in_progress: metrics.transition_in_progress,
        fragmentation_count: fragmentation.length
    };
    
    // Step 8: Build result
    const result = {
        transition_state: classification.state,
        transition_strength: Math.round(classification.transition_strength * 100) / 100,
        stable_regime_regions: metrics.regime_dominance >= 0.6 ? [metrics.dominant_regime].filter(Boolean) : [],
        oscillatory_regime_regions: metrics.oscillation_index > 0.4 ? [metrics.dominant_regime].filter(Boolean) : [],
        transition_fragmentation: fragmentation,
        survivability_regions: [
            ...(metrics.carryover_score >= 0.6 ? [{ region: metrics.dominant_regime, status: 'CARRYOVER_PRESERVED' }] : []),
            ...(metrics.transition_coherence >= 0.7 ? [{ region: metrics.dominant_regime, status: 'COHERENT' }] : []),
            ...(metrics.transition_in_progress ? [{ region: 'TRANSITION_ZONE', status: 'ACTIVE' }] : [])
        ],
        transition_stability_assessment: stabilityAssessment,
        transition_drift_profile: {
            profile: driftProfile.profile,
            description: driftProfile.description,
            direction: driftProfile.direction,
            drift_magnitude: driftProfile.drift_magnitude || null
        },
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_transition_summary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };
    
    return result;
}

// === PERSISTENCE ===

function saveTransitionState(transitionState) {
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    
    fs.writeFileSync(TRANSITION_FILE, JSON.stringify(transitionState, null, 2));
    
    const historyEntry = {
        timestamp: transitionState.generated_at,
        transition_state: transitionState.transition_state,
        transition_strength: transitionState.transition_strength,
        transition_count: transitionState.environmental_transition_summary?.transition_count || 0,
        dominant_regime: transitionState.environmental_transition_summary?.dominant_regime
    };
    
    try {
        const existingHistory = fs.existsSync(TRANSITION_HISTORY_FILE)
            ? fs.readFileSync(TRANSITION_HISTORY_FILE, 'utf8').trim().split('\n').map(line => JSON.parse(line))
            : [];
        
        const updatedHistory = [...existingHistory, historyEntry].slice(-MAX_HISTORY);
        fs.writeFileSync(TRANSITION_HISTORY_FILE, updatedHistory.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch (e) {
        fs.appendFileSync(TRANSITION_HISTORY_FILE, JSON.stringify(historyEntry) + '\n');
    }
    
    const auditEntry = {
        timestamp: transitionState.generated_at,
        type: 'EXECUTIVE_COGNITIVE_TRANSITION_COMPUTED',
        state: transitionState.transition_state,
        strength: transitionState.transition_strength,
        transitions: transitionState.environmental_transition_summary?.transition_count || 0,
        drift: transitionState.transition_drift_profile?.profile
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === CLI ===

if (require.main === module) {
    try {
        const execFocusFile = path.join(STATE_DIR, 'executive-focus.json');
        const execFocus = fs.existsSync(execFocusFile) ? JSON.parse(fs.readFileSync(execFocusFile, 'utf8')) : {};
        
        let transitionHistory = [];
        let contextHistory = [];
        let consolidationHistory = [];
        
        if (fs.existsSync(TRANSITION_HISTORY_FILE)) {
            transitionHistory = fs.readFileSync(TRANSITION_HISTORY_FILE, 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }
        
        if (fs.existsSync(path.join(STATE_DIR, 'executive-context-consolidation-history.jsonl'))) {
            contextHistory = fs.readFileSync(path.join(STATE_DIR, 'executive-context-consolidation-history.jsonl'), 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }
        
        const result = computeCognitiveTransition(execFocus, transitionHistory, contextHistory, consolidationHistory);
        saveTransitionState(result);
        
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = {
    computeCognitiveTransition,
    saveTransitionState,
    TRANSITION_STATES,
    DRIFT_PROFILES,
    FRAGMENTATION_TYPES
};