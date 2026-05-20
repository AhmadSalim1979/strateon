/**
 * Executive Context Consolidation Layer — MCAI Phase 7B
 * SHADOW-ONLY: Observational context consolidation without action authority.
 * 
 * This module observes whether recurring context regions develop deeper
 * contextual structure over time, whether context regions survive interruption,
 * and how much contextual stability strengthens or weakens.
 * 
 * This builds on Phase 7A (continuity) by measuring whether persistent
 * executive regions develop stronger contextual grounding.
 * 
 * The system may observe context consolidation — it may NOT plan, decide,
 * recommend, execute, or assign authority.
 * 
 * NO prioritization. NO recommendations. NO planning. NO decisions. NO actions.
 * NO remediation. NO enforcement. NO intervention. NO behavioral adaptation.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const CONTEXT_FILE = path.join(STATE_DIR, 'executive-context-consolidation.json');
const CONTEXT_HISTORY_FILE = path.join(STATE_DIR, 'executive-context-consolidation-history.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const MAX_HISTORY = 30;
const REINFORCEMENT_WINDOW = 8;
const CONSOLIDATION_WINDOW = 12;
const ENTRENCHED_CONTEXT_WINDOW = 15;
const DIFFUSE_STRENGTH = 0.2;
const FORMING_STRENGTH = 0.4;
const CONSOLIDATED_STRENGTH = 0.65;
const ENTRENCHED_CONTEXT_STRENGTH = 0.8;

// === CONTEXT CONSOLIDATION STATES ===

const CONTEXT_STATES = {
    DIFFUSE: {
        state: 'DIFFUSE',
        description: 'Executive context is diffuse. No stable contextual regions have formed. Context is scattered across many regions without consolidation.',
        requirements: 'Consolidation strength < 0.2 OR fragmentation_score > 0.75'
    },
    FORMING: {
        state: 'FORMING',
        description: 'Executive context is forming. Initial contextual regions are emerging but not yet stable. Reinforcement is weak.',
        requirements: 'Consolidation strength >= 0.2 AND < 0.4 AND fragmentation_score <= 0.75'
    },
    CONSOLIDATED: {
        state: 'CONSOLIDATED',
        description: 'Executive context is consolidated. Stable contextual regions have formed. Reinforcement is moderate and growing.',
        requirements: 'Consolidation strength >= 0.4 AND < 0.8 AND fragmentation_score <= 0.5 AND context_history.length >= REINFORCEMENT_WINDOW'
    },
    ENTRENCHED_CONTEXT: {
        state: 'ENTRENCHED_CONTEXT',
        description: 'Executive context is entrenched. Deep contextual stability achieved. Context regions are deeply reinforced and resistant to disruption.',
        requirements: 'Consolidation strength >= 0.8 AND fragmentation_score <= 0.25 AND context_history.length >= ENTRENCHED_CONTEXT_WINDOW'
    }
};

// === DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: { profile: 'STRENGTHENING', description: 'Context consolidation is strengthening. Reinforcement is increasing.', direction: 'POSITIVE' },
    WEAKENING: { profile: 'WEAKENING', description: 'Context consolidation is weakening. Reinforcement is decreasing.', direction: 'NEGATIVE' },
    STABILIZING: { profile: 'STABILIZING', description: 'Context consolidation is stable. No significant drift.', direction: 'NEUTRAL' },
    OSCILLATING: { profile: 'OSCILLATING', description: 'Context consolidation is oscillating. Reinforcement alternates between strong and weak.', direction: 'UNSTABLE' },
    FRAGMENTING: { profile: 'FRAGMENTING', description: 'Context consolidation is fragmenting. Context regions are losing coherence.', direction: 'DISPERSED' },
    RECOVERING: { profile: 'RECOVERING', description: 'Context consolidation is recovering from previous weakening.', direction: 'POSITIVE_RECOVERY' },
    ENTRENCHING: { profile: 'ENTRENCHING', description: 'Context consolidation is deepening. Regions are becoming more entrenched.', direction: 'ENTRENCHING' },
    ADAPTING: { profile: 'ADAPTING', description: 'Context consolidation is adapting. Core context is maintained while peripheral regions shift.', direction: 'TRANSITIONAL' },
    INDETERMINATE: { profile: 'INDETERMINATE', description: 'Context drift cannot be determined. Insufficient history or conflicting signals.', direction: 'UNKNOWN' }
};

// === CONTEXT FRAGMENTATION TYPES ===

const FRAGMENTATION_TYPES = {
    CONTEXTUAL_FRAGMENTATION: {
        type: 'CONTEXTUAL_FRAGMENTATION',
        severity: 'MEDIUM',
        description: 'Contextual fragmentation is occurring. Previously stable context regions are losing coherence.',
        detection: 'fragmentation_score > 0.5 AND consolidation_strength_declining'
    },
    UNSTABLE_CONTEXT_TRANSITION: {
        type: 'UNSTABLE_CONTEXT_TRANSITION',
        severity: 'MEDIUM',
        description: 'Context transitions are unstable. Multiple context shifts without stabilization.',
        detection: 'context_transition_count >= 4 within CONSOLIDATION_WINDOW'
    },
    CONTEXT_COLLAPSE: {
        type: 'CONTEXT_COLLAPSE',
        severity: 'HIGH',
        description: 'Context has collapsed. No stable contextual structure remains.',
        detection: 'consolidation_strength < 0.2 AND fragmentation_score > 0.8'
    },
    OSCILLATORY_CONTEXT: {
        type: 'OSCILLATORY_CONTEXT',
        severity: 'LOW',
        description: 'Context behavior is oscillatory. Context regions alternate without stabilizing.',
        detection: 'context_oscillation_index > 0.5'
    },
    REINFORCEMENT_DISRUPTION: {
        type: 'REINFORCEMENT_DISRUPTION',
        severity: 'MEDIUM',
        description: 'Context reinforcement has been disrupted. Previously strengthening context is weakening.',
        detection: 'reinforcement_trend negative AND recent_reinforcement < previous_reinforcement'
    }
};

// === COMPUTE CONTEXT METRICS ===

function computeContextMetrics(executiveState, contextHistory, consolidationHistory) {
    // Reinforcement: how consistently does context strengthen over time
    const reinforcement_values = consolidationHistory.slice(-REINFORCEMENT_WINDOW).map(h => h.consolidation_strength || 0.5);
    const current_reinforcement = reinforcement_values.length > 0 
        ? reinforcement_values[reinforcement_values.length - 1] 
        : 0.5;
    const previous_reinforcement = reinforcement_values.length > 1 
        ? reinforcement_values[reinforcement_values.length - 2] 
        : current_reinforcement;
    
    const reinforcement_trend = reinforcement_values.length >= 3
        ? (reinforcement_values[reinforcement_values.length - 1] - reinforcement_values[0]) / reinforcement_values.length
        : 0;
    
    // Context persistence: do the same context regions appear across windows?
    const context_regions = contextHistory.slice(-CONSOLIDATION_WINDOW).map(h => h.context_region).filter(Boolean);
    const region_counts = {};
    context_regions.forEach(r => { region_counts[r] = (region_counts[r] || 0) + 1; });
    
    // Dominant context region
    const dominant_context = Object.entries(region_counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const dominant_count = Object.values(region_counts)[0] || 0;
    
    // Context fragmentation
    const unique_regions = Object.keys(region_counts);
    const fragmentation_score = unique_regions.length > 1
        ? (unique_regions.length - 1) / (context_regions.length - 1)
        : 0;
    
    // Context stability: how consistently does the dominant context hold
    const stability_score = context_regions.length > 0 
        ? dominant_count / context_regions.length 
        : 0;
    
    // Context carryover: does context persist across environmental change?
    const recent_contexts = contextHistory.slice(-5).map(h => h.context_region).filter(Boolean);
    const carryover_regions = contextHistory.slice(-10, -5).map(h => h.context_region).filter(Boolean);
    const carryover_count = recent_contexts.filter(r => carryover_regions.includes(r)).length;
    const carryover_score = recent_contexts.length > 0 
        ? carryover_count / recent_contexts.length 
        : 0;
    
    // Context transition rate
    let transitions = 0;
    for (let i = 1; i < context_regions.length; i++) {
        if (context_regions[i] !== context_regions[i - 1]) transitions++;
    }
    const context_transition_rate = context_regions.length > 1 
        ? transitions / (context_regions.length - 1) 
        : 0;
    
    // Context oscillation index
    const context_oscillation_index = context_transition_rate;
    
    // Consolidation strength composite
    const consolidation_strength = (
        stability_score * 0.30 +
        carryover_score * 0.25 +
        (1 - fragmentation_score) * 0.20 +
        current_reinforcement * 0.25
    );
    
    return {
        stability_score,
        fragmentation_score: Math.min(1, fragmentation_score),
        carryover_score,
        reinforcement_trend,
        context_transition_rate,
        context_oscillation_index,
        consolidation_strength: Math.max(0, Math.min(1, consolidation_strength)),
        current_reinforcement,
        previous_reinforcement,
        dominant_context,
        unique_region_count: unique_regions.length,
        region_counts
    };
}

// === DETECT CONTEXT FRAGMENTATION ===

function detectContextFragmentation(metrics, contextHistory) {
    const fragmentation = [];
    
    // Contextual fragmentation
    if (metrics.fragmentation_score > 0.5 && metrics.reinforcement_trend < -0.05) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.CONTEXTUAL_FRAGMENTATION,
            evidence: {
                fragmentation_score: metrics.fragmentation_score,
                reinforcement_trend: metrics.reinforcement_trend
            }
        });
    }
    
    // Unstable context transition
    const recent_contexts = contextHistory.slice(-CONSOLIDATION_WINDOW).map(h => h.context_region).filter(Boolean);
    const transition_count = recent_contexts.filter((r, i) => i > 0 && r !== recent_contexts[i - 1]).length;
    if (transition_count >= 4) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.UNSTABLE_CONTEXT_TRANSITION,
            evidence: { transition_count, window: CONSOLIDATION_WINDOW }
        });
    }
    
    // Context collapse
    if (metrics.consolidation_strength < DIFFUSE_STRENGTH && metrics.fragmentation_score > 0.8) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.CONTEXT_COLLAPSE,
            evidence: {
                consolidation_strength: metrics.consolidation_strength,
                fragmentation_score: metrics.fragmentation_score
            }
        });
    }
    
    // Oscillatory context
    if (metrics.context_oscillation_index > 0.5) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.OSCILLATORY_CONTEXT,
            evidence: { context_oscillation_index: metrics.context_oscillation_index }
        });
    }
    
    // Reinforcement disruption
    if (metrics.current_reinforcement < metrics.previous_reinforcement - 0.1 && metrics.reinforcement_trend < -0.03) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.REINFORCEMENT_DISRUPTION,
            evidence: {
                current_reinforcement: metrics.current_reinforcement,
                previous_reinforcement: metrics.previous_reinforcement,
                reinforcement_trend: metrics.reinforcement_trend
            }
        });
    }
    
    return fragmentation;
}

// === CLASSIFY CONTEXT STATE ===

function classifyContextState(metrics, fragmentation, contextHistory) {
    const criticalFragmentation = fragmentation.filter(f => f.severity === 'CRITICAL').length;
    const highFragmentation = fragmentation.filter(f => f.severity === 'HIGH').length;
    
    // Collapse or critical fragmentation
    if (criticalFragmentation >= 1 || (highFragmentation >= 1 && metrics.consolidation_strength < FORMING_STRENGTH)) {
        return { state: CONTEXT_STATES.DIFFUSE.state, consolidation_strength: metrics.consolidation_strength };
    }
    
    if (metrics.consolidation_strength < DIFFUSE_STRENGTH) {
        return { state: CONTEXT_STATES.DIFFUSE.state, consolidation_strength: metrics.consolidation_strength };
    }
    
    if (metrics.consolidation_strength >= DIFFUSE_STRENGTH && metrics.consolidation_strength < FORMING_STRENGTH) {
        return { state: CONTEXT_STATES.FORMING.state, consolidation_strength: metrics.consolidation_strength };
    }
    
    if (metrics.consolidation_strength >= FORMING_STRENGTH && metrics.consolidation_strength < CONSOLIDATED_STRENGTH) {
        return { state: CONTEXT_STATES.CONSOLIDATED.state, consolidation_strength: metrics.consolidation_strength };
    }
    
    if (metrics.consolidation_strength >= ENTRENCHED_CONTEXT_STRENGTH && 
        metrics.fragmentation_score <= 0.25 && 
        contextHistory.length >= ENTRENCHED_CONTEXT_WINDOW) {
        return { state: CONTEXT_STATES.ENTRENCHED_CONTEXT.state, consolidation_strength: metrics.consolidation_strength };
    }
    
    if (metrics.consolidation_strength >= CONSOLIDATED_STRENGTH) {
        return { state: CONTEXT_STATES.CONSOLIDATED.state, consolidation_strength: metrics.consolidation_strength };
    }
    
    return { state: CONTEXT_STATES.DIFFUSE.state, consolidation_strength: metrics.consolidation_strength };
}

// === COMPUTE STABILITY ASSESSMENT ===

function computeStabilityAssessment(metrics) {
    return {
        context_resilience: Math.round((metrics.stability_score * metrics.carryover_score) * 100) / 100,
        reinforcement_continuity: Math.round((1 - Math.abs(metrics.reinforcement_trend)) * 100) / 100,
        interruption_resistance: Math.round(metrics.carryover_score * 100) / 100,
        fragmentation_resistance: Math.round((1 - metrics.fragmentation_score) * 100) / 100,
        consolidation_stability: Math.round(metrics.consolidation_strength * 100) / 100,
        context_survivability: Math.round(metrics.carryover_score * (1 - metrics.context_oscillation_index) * 100) / 100,
        stability_score: Math.round(metrics.stability_score * 100) / 100,
        transition_stability: Math.round((1 - metrics.context_transition_rate) * 100) / 100
    };
}

// === COMPUTE DRIFT ===

function computeDrift(contextHistory, consolidationHistory) {
    if (contextHistory.length < 5 || consolidationHistory.length < 3) {
        return { ...DRIFT_PROFILES.INDETERMINATE, reason: 'INSUFFICIENT_HISTORY' };
    }
    
    const recentStrengths = consolidationHistory.slice(-6).map(h => h.consolidation_strength || 0.5);
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
        if (lateAvg > 0.75) {
            return { ...DRIFT_PROFILES.ENTRENCHING, drift_magnitude: drift };
        }
        return { ...DRIFT_PROFILES.STRENGTHENING, drift_magnitude: drift };
    } else if (drift < -0.08) {
        return { ...DRIFT_PROFILES.WEAKENING, drift_magnitude: Math.abs(drift) };
    } else {
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
    }
}

// === COMPUTE UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(metrics, contextHistory) {
    const boundaries = [];
    
    if (contextHistory.length < REINFORCEMENT_WINDOW) {
        boundaries.push({
            type: 'REINFORCEMENT_WINDOW_INSUFFICIENT',
            description: 'Context reinforcement classification requires more history.',
            confidence: 'LOW',
            caveat: 'Early classifications may not reflect stable reinforcement patterns.'
        });
    }
    
    if (metrics.fragmentation_score > 0.4 && metrics.consolidation_strength > 0.5) {
        boundaries.push({
            type: 'FRAGMENTATION_CONFIDENCE_CONFLICT',
            description: 'High fragmentation with moderate consolidation. Confidence is reduced.',
            confidence: 'MEDIUM',
            caveat: 'Context state may shift as fragmentation and consolidation diverge.'
        });
    }
    
    if (metrics.reinforcement_trend < -0.05 && metrics.current_reinforcement > 0.6) {
        boundaries.push({
            type: 'REINFORCEMENT_DECLINE_DESPITE_STRENGTH',
            description: 'Reinforcement is declining despite high consolidation strength.',
            confidence: 'MEDIUM',
            caveat: 'Current strength may not persist as reinforcement weakens.'
        });
    }
    
    if (metrics.context_oscillation_index > 0.35 && metrics.context_oscillation_index < 0.5) {
        boundaries.push({
            type: 'CONTEXT_OSCILLATION_AMBIGUITY',
            description: 'Context oscillation is moderate. Stability is uncertain.',
            confidence: 'MEDIUM',
            caveat: 'Oscillation may resolve or intensify with more data.'
        });
    }
    
    return boundaries;
}

// === MAIN COMPUTATION ===

function computeContextConsolidation(executiveState, contextHistory = [], consolidationHistory = []) {
    // Step 1: Compute context metrics
    const metrics = computeContextMetrics(executiveState, contextHistory, consolidationHistory);
    
    // Step 2: Detect fragmentation
    const fragmentation = detectContextFragmentation(metrics, contextHistory);
    
    // Step 3: Classify context state
    const classification = classifyContextState(metrics, fragmentation, contextHistory);
    
    // Step 4: Compute stability assessment
    const stabilityAssessment = computeStabilityAssessment(metrics);
    
    // Step 5: Compute drift profile
    const driftProfile = computeDrift(contextHistory, consolidationHistory);
    
    // Step 6: Compute uncertainty boundaries
    const uncertaintyBoundaries = computeUncertaintyBoundaries(metrics, contextHistory);
    
    // Step 7: Environmental summary
    const environmental_context_summary = {
        dominant_context: metrics.dominant_context,
        unique_context_count: metrics.unique_region_count,
        stability_score: Math.round(metrics.stability_score * 100) / 100,
        fragmentation_score: Math.round(metrics.fragmentation_score * 100) / 100,
        carryover_score: Math.round(metrics.carryover_score * 100) / 100,
        reinforcement_trend: Math.round(metrics.reinforcement_trend * 100) / 100,
        context_transition_rate: Math.round(metrics.context_transition_rate * 100) / 100,
        context_oscillation_index: Math.round(metrics.context_oscillation_index * 100) / 100,
        current_reinforcement: Math.round(metrics.current_reinforcement * 100) / 100,
        fragmentation_count: fragmentation.length
    };
    
    // Step 8: Build result
    const result = {
        context_state: classification.state,
        consolidation_strength: Math.round(classification.consolidation_strength * 100) / 100,
        stable_context_regions: metrics.stability_score >= 0.6 ? [metrics.dominant_context].filter(Boolean) : [],
        fragmented_context_regions: metrics.fragmentation_score > 0.5 
            ? Object.keys(metrics.region_counts) 
            : [],
        context_fragmentation: fragmentation,
        survivability_regions: [
            ...(metrics.carryover_score >= 0.6 ? [{ region: metrics.dominant_context, status: 'RESILIENT' }] : []),
            ...(metrics.reinforcement_trend > 0.02 ? [{ region: metrics.dominant_context, status: 'STRENGTHENING' }] : []),
            ...(metrics.fragmentation_score > 0.5 ? [{ region: 'FRAGMENTATION_ZONE', status: 'AT_RISK' }] : [])
        ],
        context_stability_assessment: stabilityAssessment,
        context_drift_profile: {
            profile: driftProfile.profile,
            description: driftProfile.description,
            direction: driftProfile.direction,
            drift_magnitude: driftProfile.drift_magnitude || null
        },
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_context_summary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };
    
    return result;
}

// === PERSISTENCE ===

function saveContextState(contextState) {
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    
    fs.writeFileSync(CONTEXT_FILE, JSON.stringify(contextState, null, 2));
    
    const historyEntry = {
        timestamp: contextState.generated_at,
        context_state: contextState.context_state,
        consolidation_strength: contextState.consolidation_strength,
        fragmentation_count: contextState.context_fragmentation.length,
        dominant_context: contextState.environmental_context_summary?.dominant_context
    };
    
    try {
        const existingHistory = fs.existsSync(CONTEXT_HISTORY_FILE)
            ? fs.readFileSync(CONTEXT_HISTORY_FILE, 'utf8').trim().split('\n').map(line => JSON.parse(line))
            : [];
        
        const updatedHistory = [...existingHistory, historyEntry].slice(-MAX_HISTORY);
        fs.writeFileSync(CONTEXT_HISTORY_FILE, updatedHistory.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch (e) {
        fs.appendFileSync(CONTEXT_HISTORY_FILE, JSON.stringify(historyEntry) + '\n');
    }
    
    const auditEntry = {
        timestamp: contextState.generated_at,
        type: 'EXECUTIVE_CONTEXT_CONSOLIDATION_COMPUTED',
        state: contextState.context_state,
        strength: contextState.consolidation_strength,
        fragmentation: contextState.context_fragmentation.length,
        drift: contextState.context_drift_profile?.profile
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === CLI ===

if (require.main === module) {
    try {
        const execFocusFile = path.join(STATE_DIR, 'executive-focus.json');
        const execFocus = fs.existsSync(execFocusFile) ? JSON.parse(fs.readFileSync(execFocusFile, 'utf8')) : {};
        
        let contextHistory = [];
        let consolidationHistory = [];
        
        if (fs.existsSync(CONTEXT_HISTORY_FILE)) {
            const rawHistory = fs.readFileSync(CONTEXT_HISTORY_FILE, 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
            contextHistory = rawHistory.map(h => ({ context_region: h.dominant_context }));
            consolidationHistory = rawHistory;
        }
        
        const result = computeContextConsolidation(execFocus, contextHistory, consolidationHistory);
        saveContextState(result);
        
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = {
    computeContextConsolidation,
    saveContextState,
    CONTEXT_STATES,
    DRIFT_PROFILES,
    FRAGMENTATION_TYPES
};