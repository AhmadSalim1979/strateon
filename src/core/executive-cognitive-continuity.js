/**
 * Executive Cognitive Continuity Layer — MCAI Phase 7A
 * SHADOW-ONLY: Observational cognitive continuity without action authority.
 * 
 * This module observes whether the same executive cognitive regions persist
 * across long observation windows, whether dominant regions re-emerge after
 * interruption, and how much cognitive state survives environmental drift.
 * 
 * The system may observe continuity — it may NOT plan, decide, recommend,
 * execute, or assign authority.
 * 
 * NO prioritization. NO recommendations. NO planning. NO decisions. NO actions.
 * NO remediation. NO enforcement. NO intervention. NO behavioral adaptation.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const CONTINUITY_FILE = path.join(STATE_DIR, 'executive-cognitive-continuity.json');
const CONTINUITY_HISTORY_FILE = path.join(STATE_DIR, 'executive-cognitive-continuity-history.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const MAX_HISTORY = 30;
const SHORT_WINDOW = 5;        // Short window for interruption detection
const MEDIUM_WINDOW = 10;       // Medium window for stability assessment
const LONG_WINDOW = 15;        // Long window for continuity assessment
const FRAGMENTED_STRENGTH = 0.25;
const TRANSITIONAL_STRENGTH = 0.5;
const CONTINUOUS_STRENGTH = 0.75;
const ENTRENCHED_CONTINUITY_STRENGTH = 0.85;

// === CONTINUITY STATES ===

const CONTINUITY_STATES = {
    FRAGMENTED: {
        state: 'FRAGMENTED',
        description: 'Executive cognitive continuity is fragmented. No stable cognitive regions persist across observation windows. Continuity breaks are frequent.',
        requirements: 'Continuity strength < 0.25 OR fragmentation_score > 0.7'
    },
    TRANSITIONAL: {
        state: 'TRANSITIONAL',
        description: 'Executive cognitive continuity is transitional. Cognitive regions are establishing but not yet stable. Continuity is uncertain.',
        requirements: 'Continuity strength >= 0.25 AND < 0.5 AND fragmentation_score <= 0.7'
    },
    CONTINUOUS: {
        state: 'CONTINUOUS',
        description: 'Executive cognitive continuity is established. Cognitive regions persist across observation windows. Drift is slow and bounded.',
        requirements: 'Continuity strength >= 0.5 AND < 0.85 AND fragmentation_score <= 0.4'
    },
    ENTRENCHED_CONTINUITY: {
        state: 'ENTRENCHED_CONTINUITY',
        description: 'Executive cognitive continuity is entrenched. Deep cognitive stability established. Regions persist through environmental change. Interruption resistance is high.',
        requirements: 'Continuity strength >= 0.85 AND fragmentation_score <= 0.25 AND history.length >= LONG_WINDOW'
    }
};

// === DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: { profile: 'STRENGTHENING', description: 'Continuity is strengthening. Regions are becoming more persistent.', direction: 'POSITIVE' },
    WEAKENING: { profile: 'WEAKENING', description: 'Continuity is weakening. Regions are becoming less persistent.', direction: 'NEGATIVE' },
    STABILIZING: { profile: 'STABILIZING', description: 'Continuity is stable. No significant drift in either direction.', direction: 'NEUTRAL' },
    OSCILLATING: { profile: 'OSCILLATING', description: 'Continuity is oscillating. Persistence alternates between strong and weak.', direction: 'UNSTABLE' },
    FRAGMENTING: { profile: 'FRAGMENTING', description: 'Continuity is fragmenting. Regions are diverging and losing coherence.', direction: 'DISPERSED' },
    RECOVERING: { profile: 'RECOVERING', description: 'Continuity is recovering from previous fragmentation.', direction: 'POSITIVE_RECOVERY' },
    ENTRENCHING: { profile: 'ENTRENCHING', description: 'Continuity is deepening. Regions are becoming more entrenched.', direction: 'ENTRENCHING' },
    ADAPTING: { profile: 'ADAPTING', description: 'Continuity is adapting to environmental change while maintaining core regions.', direction: 'TRANSITIONAL' },
    INDETERMINATE: { profile: 'INDETERMINATE', description: 'Continuity drift cannot be determined. Insufficient history or conflicting signals.', direction: 'UNKNOWN' }
};

// === CONTINUITY FRAGMENTATION TYPES ===

const FRAGMENTATION_TYPES = {
    CONTINUITY_BREAK: {
        type: 'CONTINUITY_BREAK',
        severity: 'HIGH',
        description: 'A continuity break has occurred. Previously dominant region failed to re-emerge.',
        detection: 'dominant_region changed AND not recovered within SHORT_WINDOW'
    },
    UNSTABLE_TRANSITION: {
        type: 'UNSTABLE_TRANSITION',
        severity: 'MEDIUM',
        description: 'Transition between regions is unstable. Multiple changes in succession.',
        detection: 'region_switches >= 3 within MEDIUM_WINDOW'
    },
    CONTINUITY_COLLAPSE: {
        type: 'CONTINUITY_COLLAPSE',
        severity: 'CRITICAL',
        description: 'Continuity has collapsed. No stable region persists across windows.',
        detection: 'all_regions appear_once OR fragmentation_score > 0.8'
    },
    OSCILLATORY_CONTINUITY: {
        type: 'OSCILLATORY_CONTINUITY',
        severity: 'MEDIUM',
        description: 'Continuity is oscillatory. Regions alternate without stabilization.',
        detection: 'oscillation_index > 0.6 AND no_region_appears_more_than_twice'
    },
    DRIFT_DISRUPTION: {
        type: 'DRIFT_DISRUPTION',
        severity: 'LOW',
        description: 'Environmental drift is disrupting established continuity.',
        detection: 'context_change_rate > 0.5 AND continuity_strength_declining'
    }
};

// === COMPUTE CONTINUITY METRICS ===

function computeContinuityMetrics(executiveState, longHistory, mediumHistory, shortHistory) {
    const all_domains = longHistory.map(h => h.dominant_region).filter(Boolean);
    const medium_domains = mediumHistory.map(h => h.dominant_region).filter(Boolean);
    const short_domains = shortHistory.map(h => h.dominant_region).filter(Boolean);
    
    // Long-horizon persistence: how consistently does the same region dominate
    const region_counts = {};
    all_domains.forEach(r => { region_counts[r] = (region_counts[r] || 0) + 1; });
    const max_count = Math.max(...Object.values(region_counts), 1);
    const persistence_score = max_count / all_domains.length;
    
    // Continuity fragmentation: how distributed is the dominance
    const unique_regions = Object.keys(region_counts);
    const fragmentation_score = unique_regions.length > 1 
        ? (unique_regions.length - 1) / (all_domains.length - 1) 
        : 0;
    
    // Region carryover: does the dominant region from long history persist in recent history?
    const long_dominant = Object.entries(region_counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const recent_domains = shortHistory.slice(-SHORT_WINDOW).map(h => h.dominant_region).filter(Boolean);
    const carryover_count = recent_domains.filter(r => r === long_dominant).length;
    const carryover_score = recent_domains.length > 0 ? carryover_count / recent_domains.length : 0;
    
    // Interruption recovery: does dominant region re-emerge after being displaced?
    let interruption_recovery_count = 0;
    let interruption_count = 0;
    for (let i = 1; i < all_domains.length; i++) {
        if (all_domains[i] !== all_domains[i - 1]) {
            interruption_count++;
            const displaced_region = all_domains[i - 1];
            const future = all_domains.slice(i + 1, i + 4);
            if (future.includes(displaced_region)) interruption_recovery_count++;
        }
    }
    const interruption_recovery_score = interruption_count > 0 
        ? interruption_recovery_count / interruption_count 
        : 1;
    
    // Oscillation index
    let oscillations = 0;
    for (let i = 1; i < all_domains.length; i++) {
        if (all_domains[i] !== all_domains[i - 1]) oscillations++;
    }
    const oscillation_index = all_domains.length > 1 
        ? oscillations / (all_domains.length - 1) 
        : 0;
    
    // Context change rate
    const context_change_count = oscillations;
    const context_change_rate = all_domains.length > 1 
        ? context_change_count / all_domains.length 
        : 0;
    
    // Continuity strength composite
    const continuity_strength = (
        persistence_score * 0.35 +
        carryover_score * 0.25 +
        interruption_recovery_score * 0.25 +
        (1 - fragmentation_score) * 0.15
    );
    
    return {
        persistence_score,
        fragmentation_score: Math.min(1, fragmentation_score),
        carryover_score,
        interruption_recovery_score,
        oscillation_index,
        context_change_rate,
        continuity_strength: Math.max(0, Math.min(1, continuity_strength)),
        unique_region_count: unique_regions.length,
        dominant_region: long_dominant,
        region_counts
    };
}

// === DETECT FRAGMENTATION ===

function detectFragmentation(metrics, longHistory, mediumHistory, shortHistory) {
    const fragmentation = [];
    
    // Continuity break
    if (metrics.carryover_score < 0.3 && metrics.unique_region_count > 1) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.CONTINUITY_BREAK,
            evidence: {
                carryover_score: metrics.carryover_score,
                dominant_region: metrics.dominant_region,
                recent_regions: shortHistory.slice(-SHORT_WINDOW).map(h => h.dominant_region)
            }
        });
    }
    
    // Unstable transition
    const medium_switches = mediumHistory.filter((h, i) => i > 0 && h.dominant_region !== mediumHistory[i - 1].dominant_region).length;
    if (medium_switches >= 3) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.UNSTABLE_TRANSITION,
            evidence: { region_switches: medium_switches, window: MEDIUM_WINDOW }
        });
    }
    
    // Continuity collapse
    if (metrics.fragmentation_score > 0.8 || (metrics.unique_region_count >= metrics.region_counts && Object.values(metrics.region_counts).every(c => c === 1))) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.CONTINUITY_COLLAPSE,
            evidence: { fragmentation_score: metrics.fragmentation_score, unique_regions: metrics.unique_region_count }
        });
    }
    
    // Oscillatory continuity
    if (metrics.oscillation_index > 0.6 && Object.values(metrics.region_counts).every(c => c <= 2)) {
        fragmentation.push({
            ...FRAGMENTATION_TYPES.OSCILLATORY_CONTINUITY,
            evidence: { oscillation_index: metrics.oscillation_index }
        });
    }
    
    return fragmentation;
}

// === CLASSIFY CONTINUITY STATE ===

function classifyContinuityState(metrics, fragmentation, history) {
    const highSeverity = fragmentation.filter(f => f.severity === 'HIGH' || f.severity === 'CRITICAL').length;
    
    // Critical fragmentation blocks higher states
    if (highSeverity >= 2 || metrics.fragmentation_score > 0.8) {
        return { state: CONTINUITY_STATES.FRAGMENTED.state, continuity_strength: metrics.continuity_strength };
    }
    
    if (highSeverity >= 1 && metrics.continuity_strength < TRANSITIONAL_STRENGTH) {
        return { state: CONTINUITY_STATES.FRAGMENTED.state, continuity_strength: metrics.continuity_strength };
    }
    
    if (metrics.continuity_strength < FRAGMENTED_STRENGTH) {
        return { state: CONTINUITY_STATES.FRAGMENTED.state, continuity_strength: metrics.continuity_strength };
    }
    
    if (metrics.continuity_strength >= FRAGMENTED_STRENGTH && metrics.continuity_strength < TRANSITIONAL_STRENGTH) {
        return { state: CONTINUITY_STATES.TRANSITIONAL.state, continuity_strength: metrics.continuity_strength };
    }
    
    if (metrics.continuity_strength >= TRANSITIONAL_STRENGTH && metrics.continuity_strength < CONTINUOUS_STRENGTH) {
        return { state: CONTINUITY_STATES.CONTINUOUS.state, continuity_strength: metrics.continuity_strength };
    }
    
    if (metrics.continuity_strength >= ENTRENCHED_CONTINUITY_STRENGTH && 
        metrics.fragmentation_score <= 0.25 && 
        history.length >= LONG_WINDOW) {
        return { state: CONTINUITY_STATES.ENTRENCHED_CONTINUITY.state, continuity_strength: metrics.continuity_strength };
    }
    
    if (metrics.continuity_strength >= CONTINUOUS_STRENGTH) {
        return { state: CONTINUITY_STATES.CONTINUOUS.state, continuity_strength: metrics.continuity_strength };
    }
    
    return { state: CONTINUITY_STATES.FRAGMENTED.state, continuity_strength: metrics.continuity_strength };
}

// === COMPUTE STABILITY ASSESSMENT ===

function computeStabilityAssessment(metrics) {
    return {
        continuity_resilience: Math.round((metrics.persistence_score * metrics.carryover_score) * 100) / 100,
        continuity_survivability: Math.round(metrics.continuity_strength * 100) / 100,
        interruption_resistance: Math.round(metrics.interruption_recovery_score * 100) / 100,
        transition_stability: Math.round((1 - metrics.oscillation_index) * 100) / 100,
        continuity_recovery_strength: Math.round(metrics.interruption_recovery_score * (1 - metrics.fragmentation_score) * 100) / 100,
        carryover_stability: Math.round(metrics.carryover_score * 100) / 100,
        fragmentation_resistance: Math.round((1 - metrics.fragmentation_score) * 100) / 100,
        persistence_continuity: Math.round(metrics.persistence_score * 100) / 100
    };
}

// === COMPUTE DRIFT ===

function computeDrift(history, continuityHistory) {
    if (history.length < 5 || continuityHistory.length < 3) {
        return { ...DRIFT_PROFILES.INDETERMINATE, reason: 'INSUFFICIENT_HISTORY' };
    }
    
    const recentScores = continuityHistory.slice(-7).map(h => h.continuity_strength || 0.5);
    const earlyAvg = recentScores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const lateAvg = recentScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const drift = lateAvg - earlyAvg;
    
    const oscillations = recentScores.filter((v, i) => i > 0 && Math.abs(v - recentScores[i - 1]) > 0.12).length;
    
    if (oscillations >= 3) {
        return { ...DRIFT_PROFILES.OSCILLATING, oscillation_count: oscillations };
    }
    
    if (drift > 0.08) {
        const firstHalfAvg = recentScores.slice(0, Math.floor(recentScores.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(recentScores.length / 2);
        if (firstHalfAvg < 0.5 && drift > 0.12) {
            return { ...DRIFT_PROFILES.RECOVERING, drift_magnitude: drift };
        }
        if (lateAvg > 0.8) {
            return { ...DRIFT_PROFILES.ENTRENCHING, drift_magnitude: drift };
        }
        return { ...DRIFT_PROFILES.STRENGTHENING, drift_magnitude: drift };
    } else if (drift < -0.08) {
        return { ...DRIFT_PROFILES.WEAKENING, drift_magnitude: Math.abs(drift) };
    } else {
        if (metrics?.fragmentation_score > 0.5) {
            return { ...DRIFT_PROFILES.FRAGMENTING, drift_magnitude: Math.abs(drift) };
        }
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
    }
}

// === COMPUTE UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(metrics, history) {
    const boundaries = [];
    
    if (history.length < LONG_WINDOW) {
        boundaries.push({
            type: 'LONG_HORIZON_INSUFFICIENT',
            description: 'Long-horizon continuity classification requires more history.',
            confidence: 'LOW',
            caveat: 'Early classifications may not reflect stable long-term patterns.'
        });
    }
    
    if (metrics.oscillation_index > 0.4 && metrics.oscillation_index < 0.6) {
        boundaries.push({
            type: 'OSCILLATION_AMBIGUITY',
            description: 'Oscillation is present but not dominant. Continuity confidence is moderate.',
            confidence: 'MEDIUM',
            caveat: 'Oscillation may resolve or intensify as more data accumulates.'
        });
    }
    
    if (metrics.carryover_score < 0.5 && metrics.persistence_score > 0.6) {
        boundaries.push({
            type: 'CARRYOVER_INSTABILITY',
            description: 'Long-horizon persistence exists but recent carryover is weak.',
            confidence: 'MEDIUM',
            caveat: 'Historically dominant region may not maintain current dominance.'
        });
    }
    
    if (metrics.fragmentation_score > 0.5 && metrics.continuity_strength > 0.6) {
        boundaries.push({
            type: 'FRAGMENTATION_CONFIDENCE_CONFLICT',
            description: 'High fragmentation with high continuity strength — confidence is reduced.',
            confidence: 'LOW',
            caveat: 'Classification may shift as fragmentation and strength metrics diverge.'
        });
    }
    
    return boundaries;
}

// === MAIN COMPUTATION ===

function computeCognitiveContinuity(executiveState, longHistory = [], mediumHistory = [], shortHistory = [], continuityHistory = []) {
    // Step 1: Compute continuity metrics
    const metrics = computeContinuityMetrics(executiveState, longHistory, mediumHistory, shortHistory);
    
    // Step 2: Detect fragmentation
    const fragmentation = detectFragmentation(metrics, longHistory, mediumHistory, shortHistory);
    
    // Step 3: Classify continuity state
    const classification = classifyContinuityState(metrics, fragmentation, longHistory);
    
    // Step 4: Compute stability assessment
    const stabilityAssessment = computeStabilityAssessment(metrics);
    
    // Step 5: Compute drift profile
    const driftProfile = computeDrift(longHistory, continuityHistory);
    
    // Step 6: Compute uncertainty boundaries
    const uncertaintyBoundaries = computeUncertaintyBoundaries(metrics, longHistory);
    
    // Step 7: Environmental summary
    const environmental_continuity_summary = {
        unique_region_count: metrics.unique_region_count,
        dominant_region: metrics.dominant_region,
        persistence_score: Math.round(metrics.persistence_score * 100) / 100,
        fragmentation_score: Math.round(metrics.fragmentation_score * 100) / 100,
        carryover_score: Math.round(metrics.carryover_score * 100) / 100,
        interruption_recovery_score: Math.round(metrics.interruption_recovery_score * 100) / 100,
        oscillation_index: Math.round(metrics.oscillation_index * 100) / 100,
        context_change_rate: Math.round(metrics.context_change_rate * 100) / 100,
        fragmentation_count: fragmentation.length
    };
    
    // Step 8: Build result
    const result = {
        continuity_state: classification.state,
        continuity_strength: Math.round(classification.continuity_strength * 100) / 100,
        stable_continuity_regions: metrics.persistence_score >= 0.6 ? [metrics.dominant_region].filter(Boolean) : [],
        fragmented_continuity_regions: metrics.fragmentation_score > 0.5 
            ? Object.entries(metrics.region_counts).map(([region]) => region) 
            : [],
        continuity_fragmentation: fragmentation,
        survivability_regions: [
            ...(metrics.interruption_recovery_score >= 0.6 ? [{ region: metrics.dominant_region, status: 'RESILIENT' }] : []),
            ...(metrics.carryover_score >= 0.6 ? [{ region: metrics.dominant_region, status: 'PERSISTENT' }] : []),
            ...(metrics.fragmentation_score > 0.5 ? [{ region: 'FRAGMENTATION_ZONE', status: 'AT_RISK' }] : [])
        ],
        continuity_stability_assessment: stabilityAssessment,
        continuity_drift_profile: {
            profile: driftProfile.profile,
            description: driftProfile.description,
            direction: driftProfile.direction,
            drift_magnitude: driftProfile.drift_magnitude || null
        },
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_continuity_summary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };
    
    return result;
}

// === PERSISTENCE ===

function saveContinuityState(continuityState) {
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    
    fs.writeFileSync(CONTINUITY_FILE, JSON.stringify(continuityState, null, 2));
    
    const historyEntry = {
        timestamp: continuityState.generated_at,
        continuity_state: continuityState.continuity_state,
        continuity_strength: continuityState.continuity_strength,
        fragmentation_count: continuityState.continuity_fragmentation.length,
        dominant_region: continuityState.environmental_continuity_summary?.dominant_region
    };
    
    try {
        const existingHistory = fs.existsSync(CONTINUITY_HISTORY_FILE)
            ? fs.readFileSync(CONTINUITY_HISTORY_FILE, 'utf8').trim().split('\n').map(line => JSON.parse(line))
            : [];
        
        const updatedHistory = [...existingHistory, historyEntry].slice(-MAX_HISTORY);
        fs.writeFileSync(CONTINUITY_HISTORY_FILE, updatedHistory.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch (e) {
        fs.appendFileSync(CONTINUITY_HISTORY_FILE, JSON.stringify(historyEntry) + '\n');
    }
    
    const auditEntry = {
        timestamp: continuityState.generated_at,
        type: 'EXECUTIVE_COGNITIVE_CONTINUITY_COMPUTED',
        state: continuityState.continuity_state,
        strength: continuityState.continuity_strength,
        fragmentation: continuityState.continuity_fragmentation.length,
        drift: continuityState.continuity_drift_profile?.profile
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === CLI ===

if (require.main === module) {
    try {
        const execFocusFile = path.join(STATE_DIR, 'executive-focus.json');
        const execFocus = fs.existsSync(execFocusFile) ? JSON.parse(fs.readFileSync(execFocusFile, 'utf8')) : {};
        
        let longHistory = [];
        if (fs.existsSync(CONTINUITY_HISTORY_FILE)) {
            longHistory = fs.readFileSync(CONTINUITY_HISTORY_FILE, 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }
        
        const mediumHistory = longHistory.slice(-MEDIUM_WINDOW);
        const shortHistory = longHistory.slice(-SHORT_WINDOW);
        
        const result = computeCognitiveContinuity(execFocus, longHistory, mediumHistory, shortHistory, longHistory);
        saveContinuityState(result);
        
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = {
    computeCognitiveContinuity,
    saveContinuityState,
    CONTINUITY_STATES,
    DRIFT_PROFILES,
    FRAGMENTATION_TYPES
};