/**
 * Executive Deliberation Stability Layer — MCAI Phase 6G
 * SHADOW-ONLY: Observational deliberation stability without action authority.
 * 
 * This module observes whether competing executive-focus regions can coexist
 * stably over time without collapsing into fragmentation, oscillation,
 * authority drift, or destabilization.
 * 
 * The system may observe deliberative stability.
 * It may NOT prioritize, decide, recommend, plan, execute, or assign authority.
 * 
 * NO prioritization. NO recommendations. NO planning. NO decisions. NO actions.
 * NO remediation. NO enforcement. NO intervention. NO behavioral adaptation.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const DELIBERATION_FILE = path.join(STATE_DIR, 'executive-deliberation-stability.json');
const DELIBERATION_HISTORY_FILE = path.join(STATE_DIR, 'executive-deliberation-stability-history.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const MAX_HISTORY = 30;
const FRAGILE_THRESHOLD = 0.25;
const DEVELOPING_THRESHOLD = 0.5;
const STABLE_THRESHOLD = 0.5;
const ENTRENCHED_STABILITY_THRESHOLD = 0.65;
const MONOPOLIZATION_THRESHOLD = 0.85;
const FRAGMENTATION_PRESSURE_THRESHOLD = 0.6;
const OSCILLATION_INDEX_THRESHOLD = 0.45;
const COEXISTENCE_WINDOW = 5;
const EQUILIBRIUM_WINDOW = 8;

// === DELIBERATION STATES ===

const DELIBERATION_STATES = {
    FRAGILE: {
        state: 'FRAGILE',
        description: 'Executive deliberation is fragile. Competing regions cannot coexist stably. High risk of collapse into fragmentation or monopolization.',
        requirements: 'Stability score < 0.3 OR fragmentation pressure > 0.7 OR oscillation index > 0.6'
    },
    DEVELOPING: {
        state: 'DEVELOPING',
        description: 'Executive deliberation is developing. Regions are exploring coexistence but stability is not established. Moderate fragmentation risk.',
        requirements: 'Stability score >= 0.3 AND < 0.5 AND fragmentation pressure < 0.7 AND oscillation < 0.6'
    },
    STABLE: {
        state: 'STABLE',
        description: 'Executive deliberation is stable. Competing regions coexist with bounded competition. Fragmentation risk is low. Equilibrium is maintained.',
        requirements: 'Stability score >= 0.5 AND < 0.75 AND fragmentation pressure < 0.5 AND oscillation < 0.45'
    },
    ENTRENCHED_STABILITY: {
        state: 'ENTRENCHED_STABILITY',
        description: 'Executive deliberation is entrenched in stable equilibrium. Multiple regions coexist sustainably. Fragmentation resistance is high. Anti-monopoly enforcement is strong.',
        requirements: 'Stability score >= 0.75 AND fragmentation pressure < 0.3 AND oscillation < 0.3 AND coexistence_history > EQUILIBRIUM_WINDOW'
    }
};

// === DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STABILIZING: { profile: 'STABILIZING', description: 'Deliberation stability is strengthening. Equilibrium is consolidating.', direction: 'POSITIVE' },
    WEAKENING: { profile: 'WEAKENING', description: 'Deliberation stability is weakening. Coexistence is becoming more fragile.', direction: 'NEGATIVE' },
    OSCILLATING: { profile: 'OSCILLATING', description: 'Deliberation stability is oscillating. No stable equilibrium has formed.', direction: 'UNSTABLE' },
    FRAGMENTING: { profile: 'FRAGMENTING', description: 'Deliberation stability is fragmenting. Competing regions are diverging.', direction: 'DISPERSED' },
    CONCENTRATING: { profile: 'CONCENTRATING', description: 'Deliberation is concentrating. Single region is becoming dominant.', direction: 'MONOPOLIZING' },
    DISPERSING: { profile: 'DISPERSING', description: 'Deliberation is dispersing. Competition is becoming more evenly distributed.', direction: 'BALANCED' },
    RECOVERING: { profile: 'RECOVERING', description: 'Deliberation stability is recovering from previous weakening.', direction: 'POSITIVE_RECOVERY' },
    ADAPTING: { profile: 'ADAPTING', description: 'Deliberation is adapting. Equilibrium is shifting in response to pressure.', direction: 'TRANSITIONAL' },
    INDETERMINATE: { profile: 'INDETERMINATE', description: 'Deliberation drift cannot be determined. Insufficient history or conflicting signals.', direction: 'UNKNOWN' }
};

// === FRAGMENTATION PRESSURE DEFINITIONS ===

const FRAGMENTATION_PRESSURES = {
    CONVERGENCE_MONOPOLIZATION: {
        type: 'CONVERGENCE_MONOPOLIZATION',
        severity: 'HIGH',
        description: 'Convergence is monopolizing deliberation. Single region is capturing executive attention.',
        detection: 'dominant_region_share > 0.8 AND competition_fragmentation > 0.4'
    },
    OSCILLATORY_COMPETITION: {
        type: 'OSCILLATORY_COMPETITION',
        severity: 'MEDIUM',
        description: 'Competition is oscillatory. Regions alternate dominance without equilibrium.',
        detection: 'oscillation_index > 0.5 AND no_stable_dominant_region_in_window'
    },
    COHERENCE_COLLAPSE: {
        type: 'COHERENCE_COLLAPSE',
        severity: 'HIGH',
        description: 'Coherence is collapsing under competition. No region can maintain convergence.',
        detection: 'coherence_score < 0.4 AND competition_intensity > 0.6'
    },
    UNSTABLE_DOMINANCE_CYCLING: {
        type: 'UNSTABLE_DOMINANCE_CYCLING',
        severity: 'MEDIUM',
        description: 'Dominance is cycling unstably. No region holds focus long enough for stability.',
        detection: 'region_switch_rate > 0.4 AND average_dominance_duration < 3'
    },
    EQUILIBRIUM_COLLAPSE: {
        type: 'EQUILIBRIUM_COLLAPSE',
        severity: 'HIGH',
        description: 'Equilibrium has collapsed. Competition is now unstable.',
        detection: 'equilibrium_strength < 0.3 AND fragmentation_pressure > 0.6'
    },
    PERSISTENT_INSTABILITY_ESCALATION: {
        type: 'PERSISTENT_INSTABILITY_ESCALATION',
        severity: 'MEDIUM',
        description: 'Instability is escalating. Each cycle brings more fragmentation.',
        detection: 'instability_trend increasing AND fragmentation_pressure > 0.5'
    }
};

// === COMPUTE DOMAIN METRICS ===

function computeCoexistenceMetrics(executiveFocus, executiveTension, persistenceState, history) {
    const dominance_history = history.slice(-COEXISTENCE_WINDOW).map(h => h.dominant_region).filter(Boolean);
    const unique_regions = [...new Set(dominance_history)];
    
    // Coexistence durability: how many regions have maintained presence
    const coexistence_durability = unique_regions.length > 1 ? Math.min(1, 0.3 + (unique_regions.length * 0.15)) : 0.2;
    
    // Dominance concentration
    const region_counts = {};
    dominance_history.forEach(r => { region_counts[r] = (region_counts[r] || 0) + 1; });
    const max_dominance = Math.max(...Object.values(region_counts), 1);
    const dominance_concentration = max_dominance / dominance_history.length;
    
    // Anti-monopoly score (inverse of concentration)
    const anti_monopoly_score = 1 - dominance_concentration;
    
    // Competition fragmentation
    const competition_fragmentation = unique_regions.length > 2 ? Math.min(1, (unique_regions.length - 1) * 0.25) : 0;
    
    // Oscillation index
    let oscillations = 0;
    for (let i = 1; i < dominance_history.length; i++) {
        if (dominance_history[i] !== dominance_history[i - 1]) oscillations++;
    }
    const oscillation_index = dominance_history.length > 1 ? oscillations / (dominance_history.length - 1) : 0;
    
    // Equilibrium strength (balance across regions)
    const equilibrium_strength = unique_regions.length > 1
        ? 1 - (Math.max(...Object.values(region_counts)) / dominance_history.length) * (unique_regions.length / dominance_history.length)
        : 0.5;
    
    return {
        coexistence_durability,
        dominance_concentration,
        anti_monopoly_score,
        competition_fragmentation,
        oscillation_index,
        equilibrium_strength,
        unique_region_count: unique_regions.length,
        region_counts
    };
}

// === DETECT FRAGMENTATION PRESSURES ===

function detectFragmentationPressures(metrics, executiveState, tensionState, persistenceState) {
    const pressures = [];
    
    // Convergence monopolization
    if (metrics.dominance_concentration > 0.8 && metrics.competition_fragmentation > 0.4) {
        pressures.push({
            ...FRAGMENTATION_PRESSURES.CONVERGENCE_MONOPOLIZATION,
            evidence: {
                dominance_concentration: metrics.dominance_concentration,
                competition_fragmentation: metrics.competition_fragmentation
            }
        });
    }
    
    // Oscillatory competition
    if (metrics.oscillation_index > 0.5) {
        pressures.push({
            ...FRAGMENTATION_PRESSURES.OSCILLATORY_COMPETITION,
            evidence: { oscillation_index: metrics.oscillation_index }
        });
    }
    
    // Unstable dominance cycling
    if (metrics.oscillation_index > 0.4 && metrics.unique_region_count > 2) {
        pressures.push({
            ...FRAGMENTATION_PRESSURES.UNSTABLE_DOMINANCE_CYCLING,
            evidence: {
                oscillation_index: metrics.oscillation_index,
                unique_regions: metrics.unique_region_count
            }
        });
    }
    
    // Equilibrium collapse
    if (metrics.equilibrium_strength < 0.3 && metrics.competition_fragmentation > 0.6) {
        pressures.push({
            ...FRAGMENTATION_PRESSURES.EQUILIBRIUM_COLLAPSE,
            evidence: {
                equilibrium_strength: metrics.equilibrium_strength,
                fragmentation_pressure: metrics.competition_fragmentation
            }
        });
    }
    
    return pressures;
}

// === CLASSIFY DELIBERATION STATE ===

function classifyDeliberationState(metrics, pressures, history) {
    const { equilibrium_strength, oscillation_index, competition_fragmentation, anti_monopoly_score } = metrics;
    const stability_score = equilibrium_strength * (1 - oscillation_index) * (1 - competition_fragmentation);
    
    const highSeverityPressure = pressures.filter(p => p.severity === 'HIGH').length;
    const mediumPressure = pressures.filter(p => p.severity === 'MEDIUM').length;
    
    // Compromised: high-severity pressures dominate
    if (highSeverityPressure >= 2 || (highSeverityPressure >= 1 && mediumPressure >= 2)) {
        return { state: DELIBERATION_STATES.FRAGILE.state, reason: 'Dominant high-severity fragmentation pressures', stability_score };
    }
    
    if (stability_score < FRAGILE_THRESHOLD || oscillation_index > 0.6) {
        return { state: DELIBERATION_STATES.FRAGILE.state, reason: 'Stability below fragile threshold', stability_score };
    }
    
    if (stability_score >= FRAGILE_THRESHOLD && stability_score < DEVELOPING_THRESHOLD) {
        return { state: DELIBERATION_STATES.DEVELOPING.state, reason: 'Stability in developing range', stability_score };
    }
    
    if (stability_score >= DEVELOPING_THRESHOLD && stability_score < STABLE_THRESHOLD) {
        return { state: DELIBERATION_STATES.STABLE.state, reason: 'Stability in stable range', stability_score };
    }
    
    if (stability_score >= STABLE_THRESHOLD && anti_monopoly_score > 0.3 && history.length >= EQUILIBRIUM_WINDOW) {
        return { state: DELIBERATION_STATES.ENTRENCHED_STABILITY.state, reason: 'Stability entrenched with anti-monopoly enforcement', stability_score };
    }
    
    if (stability_score >= STABLE_THRESHOLD) {
        return { state: DELIBERATION_STATES.STABLE.state, reason: 'Stability meets stable threshold', stability_score };
    }
    
    return { state: DELIBERATION_STATES.FRAGILE.state, reason: 'Default to fragile', stability_score };
}

// === COMPUTE STABILITY ASSESSMENT ===

function computeStabilityAssessment(metrics, pressures, history) {
    const { equilibrium_strength, oscillation_index, competition_fragmentation, anti_monopoly_score, coexistence_durability } = metrics;
    
    return {
        resilience_under_competition: Math.round((equilibrium_strength * (1 - competition_fragmentation)) * 100) / 100,
        interruption_recovery: Math.round(coexistence_durability * 100) / 100,
        sustained_bounded_coexistence: Math.round((coexistence_durability + anti_monopoly_score) / 2 * 100) / 100,
        coherence_survivability: Math.round((equilibrium_strength * (1 - oscillation_index)) * 100) / 100,
        anti_monopoly_persistence: Math.round(anti_monopoly_score * 100) / 100,
        executive_balance_retention: Math.round((1 - competition_fragmentation) * 100) / 100,
        oscillation_resistance: Math.round((1 - oscillation_index) * 100) / 100,
        equilibrium_continuity: Math.round(equilibrium_strength * 100) / 100
    };
}

// === DETECT REGIONS ===

function detectRegions(metrics, executiveState, history) {
    const stable_regions = [];
    const unstable_regions = [];
    const equilibrium_regions = [];
    
    // Stable regions: high anti-monopoly score, good equilibrium
    if (metrics.anti_monopoly_score > 0.5 && metrics.equilibrium_strength > 0.5) {
        stable_regions.push('BOUNDED_COMPETITION_ZONE');
    }
    
    if (metrics.coexistence_durability > 0.6) {
        stable_regions.push('COEXISTENCE_DURABILITY_ZONE');
    }
    
    // Unstable regions: high oscillation or fragmentation
    if (metrics.oscillation_index > 0.4) {
        unstable_regions.push('OSCILLATORY_ZONE');
    }
    
    if (metrics.competition_fragmentation > 0.5) {
        unstable_regions.push('FRAGMENTATION_ZONE');
    }
    
    if (metrics.dominance_concentration > 0.75) {
        equilibrium_regions.push('MONOPOLIZATION_RISK_ZONE');
    }
    
    return { stable_regions, unstable_regions, equilibrium_regions };
}

// === COMPUTE DRIFT ===

function computeDrift(history, deliberationHistory) {
    if (history.length < 3 || deliberationHistory.length < 3) {
        return { ...DRIFT_PROFILES.INDETERMINATE, reason: 'INSUFFICIENT_HISTORY' };
    }
    
    const recentScores = deliberationHistory.slice(-5).map(h => h.deliberation_strength || 0.5);
    const earlyAvg = recentScores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const lateAvg = recentScores.slice(-2).reduce((a, b) => a + b, 0) / 2;
    const drift = lateAvg - earlyAvg;
    
    const oscillations = recentScores.filter((v, i) => i > 0 && Math.abs(v - recentScores[i - 1]) > 0.12).length;
    
    if (oscillations >= 3) {
        return { ...DRIFT_PROFILES.OSCILLATING, oscillation_count: oscillations };
    }
    
    if (drift > 0.08) {
        const firstHalfAvg = recentScores.slice(0, Math.floor(recentScores.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(recentScores.length / 2);
        if (firstHalfAvg < 0.4 && drift > 0.1) {
            return { ...DRIFT_PROFILES.RECOVERING, drift_magnitude: drift };
        }
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: drift };
    } else if (drift < -0.08) {
        return { ...DRIFT_PROFILES.WEAKENING, drift_magnitude: Math.abs(drift) };
    } else {
        // Check for concentrating or dispersing
        const lateUniqueRegions = history.slice(-3).filter(h => h.dominant_region).map(h => h.dominant_region);
        const uniqueCount = new Set(lateUniqueRegions).size;
        if (uniqueCount <= 2 && lateUniqueRegions.length >= 3) {
            return { ...DRIFT_PROFILES.CONCENTRATING, drift_magnitude: Math.abs(drift) };
        }
        if (uniqueCount >= 4) {
            return { ...DRIFT_PROFILES.DISPERSING, drift_magnitude: Math.abs(drift) };
        }
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
    }
}

// === COMPUTE UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(metrics, history) {
    const boundaries = [];
    
    if (history.length < EQUILIBRIUM_WINDOW) {
        boundaries.push({
            type: 'COEXISTENCE_INSUFFICIENT_HISTORY',
            description: 'Coexistence history is insufficient to establish stable equilibrium.',
            confidence: 'LOW',
            caveat: 'Early classifications may shift significantly as deliberation history accumulates.'
        });
    }
    
    if (metrics.oscillation_index > 0.35 && metrics.oscillation_index < 0.5) {
        boundaries.push({
            type: 'OSCILLATION_AMBIGUITY',
            description: 'Oscillation is present but not dominant. Stability confidence is moderate.',
            confidence: 'MEDIUM',
            caveat: 'Oscillation may resolve or escalate as deliberation continues.'
        });
    }
    
    if (metrics.equilibrium_strength > 0.6 && metrics.dominance_concentration > 0.6) {
        boundaries.push({
            type: 'EQUILIBRIUM_TEMPORARY',
            description: 'Equilibrium may be temporary. High concentration coexists with apparent balance.',
            confidence: 'MEDIUM',
            caveat: 'Convergence may collapse into monopolization as pressure accumulates.'
        });
    }
    
    if (metrics.unique_region_count > 4) {
        boundaries.push({
            type: 'FRAGMENTATION_RISK_ELEVATED',
            description: 'Fragmentation risk is elevated. Multiple competing regions with no clear equilibrium.',
            confidence: 'HIGH',
            caveat: 'Fragmentation may accelerate if no region achieves dominance.'
        });
    }
    
    if (metrics.anti_monopoly_score < 0.3 && metrics.equilibrium_strength > 0.5) {
        boundaries.push({
            type: 'MONOPOLIZATION_POTENTIAL',
            description: 'Anti-monopoly enforcement is weak. Single region may capture deliberation.',
            confidence: 'MEDIUM',
            caveat: 'Convergence monopolization risk remains elevated despite apparent stability.'
        });
    }
    
    return boundaries;
}

// === MAIN COMPUTATION ===

function computeDeliberationStability(executiveFocus, executiveTension, persistenceState, history = [], deliberationHistory = []) {
    // Step 1: Compute coexistence metrics
    const metrics = computeCoexistenceMetrics(executiveFocus, executiveTension, persistenceState, history);
    
    // Step 2: Detect fragmentation pressures
    const fragmentationPressures = detectFragmentationPressures(
        metrics,
        executiveFocus,
        executiveTension?.tension_state,
        persistenceState
    );
    
    // Step 3: Classify deliberation state
    const classification = classifyDeliberationState(metrics, fragmentationPressures, history);
    
    // Step 4: Detect regions
    const regions = detectRegions(metrics, executiveFocus, history);
    
    // Step 5: Compute stability assessment
    const stabilityAssessment = computeStabilityAssessment(metrics, fragmentationPressures, history);
    
    // Step 6: Compute drift profile
    const driftProfile = computeDrift(history, deliberationHistory);
    
    // Step 7: Compute uncertainty boundaries
    const uncertaintyBoundaries = computeUncertaintyBoundaries(metrics, history);
    
    // Step 8: Environmental summary
    const environmental_deliberation_summary = {
        unique_region_count: metrics.unique_region_count,
        dominance_concentration: Math.round(metrics.dominance_concentration * 100) / 100,
        anti_monopoly_score: Math.round(metrics.anti_monopoly_score * 100) / 100,
        competition_fragmentation: Math.round(metrics.competition_fragmentation * 100) / 100,
        oscillation_index: Math.round(metrics.oscillation_index * 100) / 100,
        equilibrium_strength: Math.round(metrics.equilibrium_strength * 100) / 100,
        fragmentation_pressure_count: fragmentationPressures.length,
        high_severity_pressure_count: fragmentationPressures.filter(p => p.severity === 'HIGH').length
    };
    
    // Step 9: Build result
    const result = {
        deliberation_state: classification.state,
        deliberation_strength: Math.round(classification.stability_score * 100) / 100,
        stable_competition_regions: regions.stable_regions,
        unstable_competition_regions: regions.unstable_regions,
        equilibrium_regions: regions.equilibrium_regions,
        fragmentation_pressures: fragmentationPressures,
        survivability_regions: [
            ...regions.stable_regions.map(r => ({ region: r, status: 'SURVIVABLE' })),
            ...regions.unstable_regions.map(r => ({ region: r, status: 'AT_RISK' }))
        ],
        deliberation_stability_assessment: stabilityAssessment,
        deliberation_drift_profile: {
            profile: driftProfile.profile,
            description: driftProfile.description,
            direction: driftProfile.direction,
            drift_magnitude: driftProfile.drift_magnitude || null
        },
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_deliberation_summary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };
    
    return result;
}

// === PERSISTENCE ===

function saveDeliberationState(deliberationState) {
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    
    fs.writeFileSync(DELIBERATION_FILE, JSON.stringify(deliberationState, null, 2));
    
    const historyEntry = {
        timestamp: deliberationState.generated_at,
        deliberation_state: deliberationState.deliberation_state,
        deliberation_strength: deliberationState.deliberation_strength,
        unique_region_count: deliberationState.environmental_deliberation_summary?.unique_region_count || 0,
        fragmentation_pressure_count: deliberationState.fragmentation_pressures?.length || 0
    };
    
    try {
        const existingHistory = fs.existsSync(DELIBERATION_HISTORY_FILE)
            ? fs.readFileSync(DELIBERATION_HISTORY_FILE, 'utf8').trim().split('\n').map(line => JSON.parse(line))
            : [];
        
        const updatedHistory = [...existingHistory, historyEntry].slice(-MAX_HISTORY);
        fs.writeFileSync(DELIBERATION_HISTORY_FILE, updatedHistory.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch (e) {
        fs.appendFileSync(DELIBERATION_HISTORY_FILE, JSON.stringify(historyEntry) + '\n');
    }
    
    const auditEntry = {
        timestamp: deliberationState.generated_at,
        type: 'EXECUTIVE_DELIBERATION_STABILITY_COMPUTED',
        state: deliberationState.deliberation_state,
        strength: deliberationState.deliberation_strength,
        fragmentation_pressures: deliberationState.fragmentation_pressures.length,
        drift: deliberationState.deliberation_drift_profile?.profile
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === CLI ===

if (require.main === module) {
    try {
        const execFocusFile = path.join(STATE_DIR, 'executive-focus.json');
        const execTensionFile = path.join(STATE_DIR, 'executive-selection-tension.json');
        const execPersistFile = path.join(STATE_DIR, 'executive-persistence.json');
        
        const executiveFocus = fs.existsSync(execFocusFile) ? JSON.parse(fs.readFileSync(execFocusFile, 'utf8')) : {};
        const executiveTension = fs.existsSync(execTensionFile) ? JSON.parse(fs.readFileSync(execTensionFile, 'utf8')) : {};
        const persistenceState = fs.existsSync(execPersistFile) ? JSON.parse(fs.readFileSync(execPersistFile, 'utf8')) : {};
        
        let history = [];
        if (fs.existsSync(DELIBERATION_HISTORY_FILE)) {
            history = fs.readFileSync(DELIBERATION_HISTORY_FILE, 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }
        
        const result = computeDeliberationStability(executiveFocus, executiveTension, persistenceState, history, history);
        saveDeliberationState(result);
        
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = {
    computeDeliberationStability,
    saveDeliberationState,
    DELIBERATION_STATES,
    DRIFT_PROFILES,
    FRAGMENTATION_PRESSURES
};