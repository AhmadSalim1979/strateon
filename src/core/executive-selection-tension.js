/**
 * Executive Selection Tension Layer — MCAI Phase 6C
 * SHADOW-ONLY: Bounded observational tension modeling without action authority.
 * 
 * This module observes executive-selection tension dynamics:
 * - Unresolved executive competition
 * - Convergence instability between candidates
 * - Executive oscillation pressure
 * - Executive fragmentation dynamics
 * - Executive persistence failure
 * 
 * It models tension — NOT priorities. NOT recommendations. NOT actions.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations.
 * NO prioritization. NO planning. NO remediation. NO scheduling.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const TENSION_FILE = path.join(STATE_DIR, 'executive-selection-tension.json');
const TENSION_HISTORY_FILE = path.join(STATE_DIR, 'executive-selection-tension-history.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const MAX_HISTORY = 30;
const OSCILLATION_WINDOW = 10;      // Last N snapshots to check for alternation
const FRAGMENTATION_THRESHOLD = 3; // Competing regions needed to flag fragmentation
const PERSISTENCE_CONFIDENCE_MIN = 3; // Min observations for persistence confidence

// === TENSION STATES ===

const TENSION_STATES = {
    CALM: {
        state: 'CALM',
        description: 'Executive-selection is stable. No competing candidates or convergence instability detected. Executive-focus candidates are clearly resolved with no tension.',
        requirements: 'Single dominant candidate, stable convergence, no rivalry'
    },
    DEVELOPING: {
        state: 'DEVELOPING',
        description: 'Executive-selection tension is developing. Emerging competition between candidates. Convergence instability beginning. No fragmentation yet.',
        requirements: 'Multiple candidates, some instability, no fragmentation'
    },
    TENSIONED: {
        state: 'TENSIONED',
        description: 'Executive-selection is tensioned. Significant competition between candidates. Convergence instability confirmed. Executive dominance not yet resolved.',
        requirements: 'Strong competition, instability, unresolved dominance'
    },
    FRACTURING: {
        state: 'FRACTURING',
        description: 'Executive-selection is fracturing. Executive fragmentation is occurring. Competing candidates are breaking convergence stability. Multiple unresolved regions.',
        requirements: 'Fragmentation detected, competing regions, convergence collapse'
    }
};

// === TENSION DRIFT PROFILES ===

const DRIFT_PROFILES = {
    INTENSIFYING: {
        profile: 'INTENSIFYING',
        description: 'Executive-selection tension is intensifying. Competing regions are growing more contested. Convergence instability increasing.',
        observation: 'Tension trend is toward escalation.'
    },
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Executive-selection tension is stabilizing. Competition is consistent without escalation. No significant drift.',
        observation: 'Tension trend is neutral.'
    },
    DISPERSING: {
        profile: 'DISPERSING',
        description: 'Executive-selection tension is dispersing. Competition is weakening. Candidates losing prominence.',
        observation: 'Tension trend is toward resolution.'
    },
    OSCILLATING: {
        profile: 'OSCILLATING',
        description: 'Executive-selection tension is oscillating. Dominance alternates between candidates. No stable leader.',
        observation: 'Tension trend is unstable alternation.'
    },
    FRAGMENTING: {
        profile: 'FRAGMENTING',
        description: 'Executive-selection tension is fragmenting. Executive convergence is breaking into multiple competing candidates.',
        observation: 'Tension trend is toward fragmentation.'
    },
    CONCENTRATING: {
        profile: 'CONCENTRATING',
        description: 'Executive-selection tension is concentrating. Competition is consolidating into fewer stronger candidates.',
        observation: 'Tension trend is toward consolidation.'
    },
    ADAPTING: {
        profile: 'ADAPTING',
        description: 'Executive-selection tension is adapting. Competition dynamics are shifting in response to unresolved pressure.',
        observation: 'Tension trend is in transition.'
    },
    RECOVERING: {
        profile: 'RECOVERING',
        description: 'Executive-selection tension is recovering. Previous instability is resolving into stable convergence.',
        observation: 'Tension trend is toward stability.'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Executive-selection tension drift cannot be determined. Insufficient history or conflicting signals.',
        observation: 'Drift classification requires more observations.'
    }
};

// === COMPETITION MODELING ===

/**
 * Compute competition metrics from executive-focus candidates
 */
function computeCompetitionMetrics(executiveState) {
    const candidates = executiveState.top_candidates || [];
    const stability_score = executiveState.stability_score || 0;
    const convergence_strength = executiveState.convergence_strength || 0;
    
    // Competition: multiple candidates with similar strength
    let competition_score = 0;
    let competing_regions = [];
    
    if (candidates.length >= 2) {
        // Calculate strength differential between top candidates
        const strengths = candidates.map(c => c.strength || 0).sort((a, b) => b - a);
        const top_diff = strengths[0] - strengths[1];
        
        if (top_diff < 0.15) {
            // Very close — high competition
            competition_score = 0.9;
            competing_regions = candidates.slice(0, Math.min(3, candidates.length)).map(c => c.region);
        } else if (top_diff < 0.30) {
            competition_score = 0.6;
            competing_regions = candidates.slice(0, 2).map(c => c.region);
        } else if (top_diff < 0.50) {
            competition_score = 0.3;
            competing_regions = [candidates[0].region];
        }
    }
    
    // Convergence instability: strength of top candidate vs convergence strength
    const top_strength = candidates[0]?.strength || 0;
    const instability_score = (top_strength < 0.7 && competition_score > 0.3) ? 0.7 : 0.2;
    
    return {
        competition_score,      // 0-1, how contested the executive selection is
        competing_regions,      // regions in competition
        instability_score,      // 0-1, how unstable convergence is
        convergence_integrity: stability_score * convergence_strength  // 0-1, overall convergence health
    };
}

/**
 * Detect oscillation — alternating dominance between candidates
 */
function detectOscillation(history) {
    if (history.length < 3) {
        return { detected: false, oscillation_regions: [], stability: 'UNKNOWN' };
    }
    
    const window = history.slice(-OSCILLATION_WINDOW);
    const alternation_count = {};
    
    // Track which candidate dominated each snapshot
    for (const snapshot of window) {
        const top_region = snapshot.dominant_region || 'unknown';
        alternation_count[top_region] = (alternation_count[top_region] || 0) + 1;
    }
    
    const regions = Object.keys(alternation_count);
    
    if (regions.length >= 3) {
        // Multiple regions alternating — clear oscillation
        return {
            detected: true,
            oscillation_regions: regions,
            stability: 'UNSTABLE',
            alternation_count
        };
    } else if (regions.length === 2) {
        // Two regions alternating — possible oscillation
        const counts = Object.values(alternation_count);
        const ratio = Math.min(...counts) / Math.max(...counts);
        if (ratio > 0.3) {
            return {
                detected: true,
                oscillation_regions: regions,
                stability: 'MARGINAL',
                alternation_count
            };
        }
    }
    
    return { detected: false, oscillation_regions: [], stability: 'STABLE' };
}

/**
 * Detect fragmentation — multiple competing regions without convergence
 */
function detectFragmentation(competitionMetrics, oscillationResult, executiveState) {
    const { competition_score, competing_regions, instability_score } = competitionMetrics;
    const { detected: oscillation_detected } = oscillationResult;
    
    // Fragmentation: high competition + high instability + possible oscillation
    const fragmentation_score = Math.min(1, (competition_score * 0.5) + (instability_score * 0.3) + (oscillation_detected ? 0.3 : 0));
    
    if (fragmentation_score > 0.6) {
        return {
            detected: true,
            fragmentation_regions: competing_regions,
            fragmentation_score,
            fragmentation_type: oscillation_detected ? 'OSCILLATION_FRAGMENTATION' : 'COMPETITION_FRAGMENTATION'
        };
    }
    
    return { detected: false, fragmentation_regions: [], fragmentation_score: 0, fragmentation_type: null };
}

/**
 * Detect persistence failure — convergence not holding over time
 */
function detectPersistenceFailure(history) {
    if (history.length < PERSISTENCE_CONFIDENCE_MIN) {
        return { failure_detected: false, confidence: 'LOW', reason: 'INSUFFICIENT_HISTORY' };
    }
    
    // Check if dominant region keeps changing
    const dominance_sequence = history.slice(-PERSISTENCE_CONFIDENCE_MIN).map(h => h.dominant_region);
    const unique_dominance = [...new Set(dominance_sequence)];
    
    if (unique_dominance.length >= 4) {
        // More than 4 different dominants in recent window — persistence failure
        return {
            failure_detected: true,
            confidence: 'HIGH',
            reason: 'EXECUTIVE_PERSISTENCE_FAILURE',
            unique_dominance_count: unique_dominance.length,
            persistent_regions: unique_dominance.slice(0, 2)  // top 2 that appear most
        };
    }
    
    if (unique_dominance.length >= 3) {
        return {
            failure_detected: true,
            confidence: 'MEDIUM',
            reason: 'WEAK_PERSISTENCE',
            unique_dominance_count: unique_dominance.length
        };
    }
    
    return { failure_detected: false, confidence: 'HIGH', reason: 'PERSISTENCE_STABLE' };
}

/**
 * Compute tension drift profile from history
 */
function computeDriftProfile(tensionHistory) {
    if (tensionHistory.length < 3) {
        return { ...DRIFT_PROFILES.INDETERMINATE, reason: 'INSUFFICIENT_HISTORY' };
    }
    
    const recent = tensionHistory.slice(-5);
    const tension_values = recent.map(h => h.tension_strength || 0.5);
    
    // Simple drift detection: compare early vs late tension strength
    const early_avg = tension_values.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const late_avg = tension_values.slice(-2).reduce((a, b) => a + b, 0) / 2;
    const drift = late_avg - early_avg;
    
    if (drift > 0.15) {
        return { ...DRIFT_PROFILES.INTENSIFYING, drift_magnitude: drift };
    } else if (drift < -0.15) {
        return { ...DRIFT_PROFILES.DISPERSING, drift_magnitude: Math.abs(drift) };
    } else if (Math.abs(drift) < 0.05) {
        // Check for oscillation pattern
        const oscillations = tension_values.filter((v, i) => i > 0 && Math.abs(v - tension_values[i - 1]) > 0.2).length;
        if (oscillations >= 3) {
            return { ...DRIFT_PROFILES.OSCILLATING };
        }
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
    } else {
        // Moderate drift — could be adapting or recovering
        if (drift > 0) {
            return { ...DRIFT_PROFILES.CONCENTRATING, drift_magnitude: drift };
        } else {
            return { ...DRIFT_PROFILES.RECOVERING, drift_magnitude: Math.abs(drift) };
        }
    }
}

// === EXPLICIT UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(competitionMetrics, oscillationResult, fragmentationResult, persistenceResult, history) {
    const boundaries = [];
    
    // Transient competition uncertainty
    if (competitionMetrics.competition_score < 0.5 && history.length < 5) {
        boundaries.push({
            type: 'TRANSIENT_COMPETITION',
            description: 'Competition classification may be transient. History is short and competition score is moderate.',
            confidence: 'LOW',
            caveat: 'Competition may resolve without fragmentation.'
        });
    }
    
    // Oscillation classification uncertainty
    if (!oscillationResult.detected && history.length < OSCILLATION_WINDOW) {
        boundaries.push({
            type: 'OSCILLATION_UNDERESTIMATED',
            description: 'Oscillation detection requires more history. Current window may not show full oscillation pattern.',
            confidence: 'LOW',
            caveat: 'Oscillation may be present but not yet detected.'
        });
    }
    
    // Fragmentation overestimation risk
    if (fragmentationResult.detected && fragmentationResult.fragmentation_score < 0.75) {
        boundaries.push({
            type: 'FRAGMENTATION_OVERESTIMATED',
            description: 'Fragmentation detection confidence is moderate. May be overestimating fragmentation severity.',
            confidence: 'MEDIUM',
            caveat: 'Fragmentation may be temporary competition, not true fragmentation.'
        });
    }
    
    // Convergence persistence confidence
    if (persistenceResult.confidence === 'LOW') {
        boundaries.push({
            type: 'PERSISTENCE_WEAK',
            description: 'Persistence failure detection has low confidence due to insufficient history.',
            confidence: 'LOW',
            caveat: 'Actual persistence may be different from observed pattern.'
        });
    }
    
    // Saturation-driven instability caveat
    if (competitionMetrics.instability_score > 0.5) {
        boundaries.push({
            type: 'SATURATION_INSTABILITY_TEMPORARY',
            description: 'High instability score may reflect saturation dynamics rather than structural fragmentation.',
            confidence: 'MEDIUM',
            caveat: 'Saturation-driven instability may be temporary, resolving as cognitive load normalizes.'
        });
    }
    
    return boundaries;
}

// === EXECUTIVE STABILITY ASSESSMENT ===

function computeStabilityAssessment(competitionMetrics, oscillationResult, fragmentationResult, persistenceResult) {
    const { competition_score, instability_score, convergence_integrity } = competitionMetrics;
    const { detected: oscillation_detected, stability: oscillation_stability } = oscillationResult;
    const { detected: fragmentation_detected, fragmentation_score } = fragmentationResult;
    const { failure_detected: persistence_failure, confidence: persistence_confidence } = persistenceResult;
    
    // Composite stability score
    let stability_score = 0.8; // Base
    
    if (fragmentation_detected) {
        stability_score -= 0.4;
        if (fragmentation_score > 0.8) stability_score -= 0.2;
    }
    
    if (oscillation_detected) {
        stability_score -= 0.25;
        if (oscillation_stability === 'UNSTABLE') stability_score -= 0.15;
    }
    
    if (persistence_failure) {
        stability_score -= 0.3;
    }
    
    stability_score -= (competition_score * 0.2);
    stability_score -= (instability_score * 0.15);
    stability_score = Math.max(0, Math.min(1, stability_score));
    
    // Compute sub-scores
    const competition_continuity = 1 - competition_score;
    const executive_volatility = oscillation_detected ? 0.7 : (instability_score * 0.5);
    const fragmentation_persistence = fragmentation_detected ? fragmentation_score : 0;
    const oscillation_persistence = oscillation_detected ? 0.6 : 0;
    const convergence_resilience = convergence_integrity * stability_score;
    const bounded_confidence = Math.min(1, persistence_confidence === 'HIGH' ? 0.9 : (persistence_confidence === 'MEDIUM' ? 0.6 : 0.3));
    
    return {
        stability_score: Math.round(stability_score * 100) / 100,
        competition_continuity: Math.round(competition_continuity * 100) / 100,
        executive_volatility: Math.round(executive_volatility * 100) / 100,
        fragmentation_persistence: Math.round(fragmentation_persistence * 100) / 100,
        oscillation_persistence: Math.round(oscillation_persistence * 100) / 100,
        convergence_resilience: Math.round(convergence_resilience * 100) / 100,
        bounded_confidence: Math.round(bounded_confidence * 100) / 100
    };
}

// === MAIN COMPUTATION ===

function computeExecutiveSelectionTension(executiveState, history = []) {
    // Load previous tension state for drift comparison
    let previousTension = null;
    try {
        if (fs.existsSync(TENSION_FILE)) {
            previousTension = JSON.parse(fs.readFileSync(TENSION_FILE, 'utf8'));
        }
    } catch (e) {
        // Ignore
    }
    
    // Step 1: Compute competition metrics
    const competitionMetrics = computeCompetitionMetrics(executiveState);
    
    // Step 2: Detect oscillation
    const oscillationResult = detectOscillation(history);
    
    // Step 3: Detect fragmentation
    const fragmentationResult = detectFragmentation(competitionMetrics, oscillationResult, executiveState);
    
    // Step 4: Detect persistence failure
    const persistenceResult = detectPersistenceFailure(history);
    
    // Step 5: Determine tension state
    let tension_state = TENSION_STATES.CALM.state;
    let tension_strength = 0;
    
    if (fragmentationResult.detected && fragmentationResult.fragmentation_score > 0.7) {
        tension_state = TENSION_STATES.FRACTURING.state;
        tension_strength = Math.min(1, 0.7 + (fragmentationResult.fragmentation_score - 0.7) * 0.5);
    } else if (competitionMetrics.competition_score > 0.6 || oscillationResult.detected) {
        tension_state = TENSION_STATES.TENSIONED.state;
        tension_strength = Math.min(1, 0.5 + (competitionMetrics.competition_score * 0.3) + (oscillationResult.detected ? 0.15 : 0));
    } else if (competitionMetrics.competition_score > 0.3 || competitionMetrics.instability_score > 0.4) {
        tension_state = TENSION_STATES.DEVELOPING.state;
        tension_strength = Math.min(1, 0.3 + (competitionMetrics.competition_score * 0.3));
    }
    
    // Step 6: Compute drift profile
    const tensionHistory = history.map(h => ({ tension_strength: h.tension_strength || 0.5 }));
    const driftProfile = computeDriftProfile(tensionHistory);
    
    // Step 7: Compute stability assessment
    const stabilityAssessment = computeStabilityAssessment(competitionMetrics, oscillationResult, fragmentationResult, persistenceResult);
    
    // Step 8: Compute uncertainty boundaries
    const uncertaintyBoundaries = computeUncertaintyBoundaries(competitionMetrics, oscillationResult, fragmentationResult, persistenceResult, history);
    
    // Step 9: Compute executive competition map
    const executiveCompetitionMap = {
        competing_count: competitionMetrics.competing_regions.length,
        competition_score: competitionMetrics.competition_score,
        competing_regions: competitionMetrics.competing_regions,
        convergence_integrity: competitionMetrics.convergence_integrity
    };
    
    // Step 10: Compute executive persistence summary
    const executivePersistenceSummary = {
        failure_detected: persistenceResult.failure_detected,
        persistence_confidence: persistenceResult.confidence,
        failure_reason: persistenceResult.reason,
        unique_dominance_count: persistenceResult.unique_dominance_count || null
    };
    
    // Step 11: Environmental tension summary
    const environmental_tension_summary = {
        saturation_pressure: executiveState.convergence_strength || 0,
        candidate_count: executiveState.top_candidates?.length || 0,
        top_candidate_strength: executiveState.top_candidates?.[0]?.strength || 0,
        stability_score: stabilityAssessment.stability_score
    };
    
    // Build result
    const result = {
        executive_tension_state: tension_state,
        tension_strength: Math.round(tension_strength * 100) / 100,
        competing_executive_regions: competitionMetrics.competing_regions,
        convergence_instability_regions: oscillationResult.detected ? oscillationResult.oscillation_regions : [],
        oscillation_regions: oscillationResult.detected ? oscillationResult.oscillation_regions : [],
        executive_fragmentation_regions: fragmentationResult.detected ? fragmentationResult.fragmentation_regions : [],
        executive_competition_map: executiveCompetitionMap,
        executive_persistence_summary: executivePersistenceSummary,
        executive_stability_assessment: stabilityAssessment,
        executive_drift_profile: {
            profile: driftProfile.profile,
            description: driftProfile.description,
            observation: driftProfile.observation,
            drift_magnitude: driftProfile.drift_magnitude || null
        },
        persistence_summary: {
            convergence_continuity: stabilityAssessment.competition_continuity,
            stable_regions: stabilityAssessment.competition_continuity > 0.7 ? [executiveState.dominant_region].filter(Boolean) : [],
            weakening_candidates: competitionMetrics.competition_score > 0.5 ? competitionMetrics.competing_regions.slice(1) : [],
            strengthening_candidates: competitionMetrics.competition_score > 0.3 ? [competitionMetrics.competing_regions[0]].filter(Boolean) : []
        },
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_tension_summary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };
    
    return result;
}

// === PERSISTENCE ===

function saveTensionState(tensionState) {
    // Ensure directory exists
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    
    // Write current state
    fs.writeFileSync(TENSION_FILE, JSON.stringify(tensionState, null, 2));
    
    // Append to history
    const historyEntry = {
        timestamp: tensionState.generated_at,
        executive_tension_state: tensionState.executive_tension_state,
        tension_strength: tensionState.tension_strength,
        dominant_region: null, // derived from competition map
        stability_score: tensionState.executive_stability_assessment?.stability_score
    };
    
    try {
        const existingHistory = fs.existsSync(TENSION_HISTORY_FILE)
            ? fs.readFileSync(TENSION_HISTORY_FILE, 'utf8').trim().split('\n').map(line => JSON.parse(line))
            : [];
        
        const updatedHistory = [...existingHistory, historyEntry].slice(-MAX_HISTORY);
        fs.writeFileSync(TENSION_HISTORY_FILE, updatedHistory.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch (e) {
        // If history read fails, just write single entry
        fs.appendFileSync(TENSION_HISTORY_FILE, JSON.stringify(historyEntry) + '\n');
    }
    
    // Audit log
    const auditEntry = {
        timestamp: tensionState.generated_at,
        type: 'EXECUTIVE_SELECTION_TENSION_COMPUTED',
        state: tensionState.executive_tension_state,
        strength: tensionState.tension_strength,
        drift: tensionState.executive_drift_profile?.profile
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === CLI ===

if (require.main === module) {
    const executiveFocusFile = path.join(STATE_DIR, 'executive-focus.json');
    const executiveHistoryFile = path.join(STATE_DIR, 'executive-focus-history.jsonl');
    
    try {
        const executiveState = fs.existsSync(executiveFocusFile)
            ? JSON.parse(fs.readFileSync(executiveFocusFile, 'utf8'))
            : { state: 'INCIDENTAL', top_candidates: [], stability_score: 0.5, convergence_strength: 0.5 };
        
        let history = [];
        if (fs.existsSync(executiveHistoryFile)) {
            history = fs.readFileSync(executiveHistoryFile, 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }
        
        const tensionState = computeExecutiveSelectionTension(executiveState, history);
        saveTensionState(tensionState);
        
        console.log(JSON.stringify(tensionState, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = {
    computeExecutiveSelectionTension,
    saveTensionState,
    TENSION_STATES,
    DRIFT_PROFILES
};