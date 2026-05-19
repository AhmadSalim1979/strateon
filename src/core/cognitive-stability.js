/**
 * Cognitive Stability Regulation Layer — MCAI Phase 5F
 * SHADOW-ONLY: Bounded observational cognitive stability without action authority.
 * 
 * This module models whether the cognitive landscape remains structurally stable
 * over time under changing environmental conditions.
 * 
 * It observes cognitive stability — NOT what should be acted upon.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const STABILITY_FILE = path.join(STATE_DIR, 'cognitive-stability.json');
const STABILITY_HISTORY_FILE = path.join(STATE_DIR, 'cognitive-stability-history.jsonl');

const MAX_HISTORY = 30;

// === STABILITY STATES ===

const STABILITY_STATES = {
    STABLE: {
        state: 'STABLE',
        description: 'Environmental cognitive landscape exhibits strong structural stability. Recovery mechanisms are effective, resilience is high, and destabilization pressure is minimal. No significant fragmentation or oscillation observed.',
        requirements: 'High resilience, low destabilization pressure, effective recovery, no oscillation'
    },
    STRAINED: {
        state: 'STRAINED',
        description: 'Environmental cognitive landscape shows moderate strain. Destabilization pressure is present but manageable. Recovery mechanisms are active but showing signs of fatigue. Fragmentation or oscillation may be present intermittently.',
        requirements: 'Moderate destabilization pressure, recovery active but strained, some fragmentation'
    },
    UNSTABLE: {
        state: 'UNSTABLE',
        description: 'Environmental cognitive landscape is structurally unstable. Destabilization pressure is high and persistent. Recovery mechanisms are failing or overwhelmed. Significant fragmentation, oscillation, or recurring instability cycles observed.',
        requirements: 'High destabilization pressure, failing recovery, persistent fragmentation or oscillation'
    },
    COLLAPSING: {
        state: 'COLLAPSING',
        description: 'Environmental cognitive landscape is approaching structural collapse. Destabilization pressure is overwhelming. Recovery mechanisms have failed. Coherence is severely degraded. Critical intervention would be required to prevent total cognitive fragmentation.',
        requirements: 'Overwhelming destabilization, failed recovery, critical coherence degradation'
    }
};

// === STABILITY DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Cognitive landscape stability is improving. Destabilization pressure is decreasing. Recovery mechanisms are gaining effectiveness.',
        interpretation: 'Stability trend is positive. Environmental cognitive structure becoming more resilient.'
    },
    DESTABILIZING: {
        profile: 'DESTABILIZING',
        description: 'Cognitive landscape stability is degrading. Destabilization pressure is increasing. Recovery mechanisms are losing effectiveness.',
        interpretation: 'Stability trend is negative. Environmental cognitive structure becoming less resilient.'
    },
    OSCILLATING: {
        profile: 'OSCILLATING',
        description: 'Cognitive landscape stability is oscillating. Alternating between stable and unstable periods.',
        interpretation: 'Stability trend is unstable. Repeated cycles between stabilization and destabilization.'
    },
    RECOVERING: {
        profile: 'RECOVERING',
        description: 'Cognitive landscape stability is recovering from prior destabilization. Recovery mechanisms are restoring coherence.',
        interpretation: 'Stability trend is positive after destabilization. Recovery mechanisms are effective.'
    },
    SATURATING: {
        profile: 'SATURATING',
        description: 'Cognitive landscape stability is saturating at current levels. No significant change in either direction.',
        interpretation: 'Stability has reached equilibrium at current level. No clear improvement or degradation.'
    },
    FRAGMENTING: {
        profile: 'FRAGMENTING',
        description: 'Cognitive landscape stability is fragmenting. Previously stable structures are breaking apart.',
        interpretation: 'Stability trend is fragmenting. Previously coherent structures are degrading.'
    },
    ADAPTING: {
        profile: 'ADAPTING',
        description: 'Cognitive landscape stability is adapting to changing conditions. New equilibrium forming.',
        interpretation: 'Stability is in transition. Environmental adaptation is reshaping cognitive structure.'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Insufficient observation history to determine stability drift direction.',
        interpretation: 'More observations needed before stability drift can be classified.'
    }
};

// === STABILITY COMPUTATION ===

/**
 * Compute cognitive stability from all upstream MCAI layers.
 * @param {Object} context - { coherenceRecord, pressureMapping, attentionRecord, salienceRecord, stabilityHistory }
 * @returns {Object} Stability assessment
 */
function computeStabilityRegulation(context) {
    const {
        coherenceRecord,
        pressureMapping,
        attentionRecord,
        salienceRecord,
        stabilityHistory = []
    } = context;

    const assessment = {
        stability_state: 'STABLE',
        stability_strength: 0,
        resilience_profile: {},
        destabilization_pressures: [],
        recovery_regions: [],
        persistent_instability_zones: [],
        oscillation_regions: [],
        recovery_continuity_summary: {},
        resilience_assessment: {},
        stabilization_tracking: {},
        stability_score: 0
    };

    // === RESILIENCE ASSESSMENT ===

    const resilienceScore = computeResilienceScore(coherenceRecord, pressureMapping, attentionRecord, salienceRecord, stabilityHistory);
    assessment.resilience_assessment = resilienceScore;

    // === DESTABILIZATION PRESSURE DETECTION ===

    const destabilizationPressures = [];

    // Prolonged fragmentation pressure
    if (stabilityHistory.length >= 3) {
        const recentHistory = stabilityHistory.slice(-3);
        const fragmentedCount = recentHistory.filter(h =>
            h.stability_state === 'UNSTABLE' || h.stability_state === 'COLLAPSING'
        ).length;
        if (fragmentedCount >= 2) {
            destabilizationPressures.push({
                pressure_type: 'prolonged_fragmentation',
                intensity: fragmentedCount / recentHistory.length,
                description: `${fragmentedCount} of last ${recentHistory.length} snapshots show instability — fragmentation is persistent`,
                severity: fragmentedCount >= 3 ? 'high' : 'medium',
                window: `${recentHistory.length} snapshots`
            });
        }
    }

    // Repeated coherence degradation
    if (coherenceRecord) {
        const coherenceState = coherenceRecord.coherence_state || 'COHERENT';
        if (coherenceState === 'FRAGMENTED' || coherenceState === 'DISSONANT') {
            const coherenceStrength = coherenceRecord.coherence_strength || 0;
            if (coherenceStrength < 0.4) {
                destabilizationPressures.push({
                    pressure_type: 'coherence_degradation',
                    intensity: Math.max(0, (0.4 - coherenceStrength) * 2.5),
                    description: `Coherence is severely degraded (strength: ${Math.round(coherenceStrength * 100)}%) — structural integrity compromised`,
                    severity: coherenceStrength < 0.25 ? 'high' : 'medium',
                    source: 'cognitive_coherence'
                });
            }
        }
    }

    // Unresolved contradiction accumulation
    if (coherenceRecord?.contradiction_zones) {
        const highSeverityZones = coherenceRecord.contradiction_zones.filter(z => z.severity === 'high');
        if (highSeverityZones.length >= 2) {
            destabilizationPressures.push({
                pressure_type: 'contradiction_accumulation',
                intensity: highSeverityZones.length * 0.2,
                description: `${highSeverityZones.length} high-severity contradiction zones accumulating — destabilization pressure elevated`,
                severity: highSeverityZones.length >= 3 ? 'high' : 'medium',
                zones: highSeverityZones.map(z => z.zone_type)
            });
        }
    }

    // Attention saturation persistence
    if (attentionRecord) {
        const capacityState = attentionRecord.capacity_assessment?.state || 'AVAILABLE';
        const saturationScore = attentionRecord.capacity_assessment?.saturation_score || 0;
        if (capacityState === 'SATURATED' || saturationScore > 0.8) {
            destabilizationPressures.push({
                pressure_type: 'attention_saturation_persistence',
                intensity: saturationScore,
                description: `Attention capacity persistently saturated (${Math.round(saturationScore * 100)}%) — cognitive resources strained`,
                severity: saturationScore > 0.9 ? 'high' : 'medium',
                source: 'attention'
            });
        }
    }

    // Recurring instability cycles
    if (stabilityHistory.length >= 4) {
        const recentStates = stabilityHistory.slice(-4).map(h => h.stability_state);
        const unstableCount = recentStates.filter(s => s === 'UNSTABLE' || s === 'COLLAPSING').length;
        const oscillatingPattern = detectOscillatingPattern(recentStates);
        if (oscillatingPattern && unstableCount >= 2) {
            destabilizationPressures.push({
                pressure_type: 'recurring_instability_cycles',
                intensity: 0.6,
                description: `Recurring instability cycles detected — pattern suggests systemic instability`,
                severity: 'high',
                pattern: recentStates.join(' -> ')
            });
        }
    }

    assessment.destabilization_pressures = destabilizationPressures;

    // === RECOVERY MODELING ===

    const recoveryRegions = [];
    const persistenceTracking = trackStabilityPersistence(coherenceRecord, stabilityHistory);

    // Recovery intervals
    if (stabilityHistory.length >= 2) {
        // Find recovery transitions: unstable -> stable
        for (let i = 1; i < stabilityHistory.length; i++) {
            const prev = stabilityHistory[i - 1];
            const curr = stabilityHistory[i];
            if ((prev.stability_state === 'UNSTABLE' || prev.stability_state === 'COLLAPSING') &&
                (curr.stability_state === 'STABLE' || curr.stability_state === 'STRAINED')) {
                recoveryRegions.push({
                    region_type: 'recovery_interval',
                    from_state: prev.stability_state,
                    to_state: curr.stability_state,
                    transition_index: i,
                    duration_snapshots: 1,
                    description: 'Recovery from destabilized to stable'
                });
            }
        }
    }

    // Stabilization duration
    if (stabilityHistory.length >= 3) {
        const stableSnapshots = stabilityHistory.filter(h => h.stability_state === 'STABLE');
        if (stableSnapshots.length >= 2) {
            const lastStableIndex = stabilityHistory.map(h => h.stability_state).lastIndexOf('STABLE');
            const firstStableIndex = stabilityHistory.map(h => h.stability_state).indexOf('STABLE');
            const stableDuration = lastStableIndex - firstStableIndex + 1;
            recoveryRegions.push({
                region_type: 'stabilization_duration',
                from_index: firstStableIndex,
                to_index: lastStableIndex,
                duration_snapshots: stableDuration,
                description: `${stableDuration} consecutive stable snapshots — stabilization active`
            });
        }
    }

    assessment.recovery_regions = recoveryRegions;
    assessment.recovery_continuity_summary = persistenceTracking;

    // === OSCILLATION REGION DETECTION ===

    if (stabilityHistory.length >= 3) {
        const recentHistory = stabilityHistory.slice(-5);
        const stabilityScores = recentHistory.map(h => {
            if (h.stability_state === 'STABLE') return 4;
            if (h.stability_state === 'STRAINED') return 3;
            if (h.stability_state === 'UNSTABLE') return 2;
            if (h.stability_state === 'COLLAPSING') return 1;
            return 2.5;
        });

        // Detect alternating pattern
        let oscillationCount = 0;
        for (let i = 1; i < stabilityScores.length; i++) {
            if ((stabilityScores[i] >= 3 && stabilityScores[i - 1] <= 2) ||
                (stabilityScores[i] <= 2 && stabilityScores[i - 1] >= 3)) {
                oscillationCount++;
            }
        }

        if (oscillationCount >= 2 && oscillationCount >= stabilityScores.length * 0.3) {
            assessment.oscillation_regions = [{
                region_type: 'oscillation_detected',
                oscillation_count: oscillationCount,
                pattern: stabilityScores.map(s => s >= 3 ? 'stable' : 'unstable').join(' -> '),
                description: `${oscillationCount} oscillation transitions detected — cognitive stability is oscillating`,
                severity: oscillationCount >= 3 ? 'high' : 'medium'
            }];
        }
    }

    // === PERSISTENT INSTABILITY ZONES ===

    const persistentInstabilityZones = [];

    if (coherenceRecord?.contradiction_zones) {
        const highSeverityZones = coherenceRecord.contradiction_zones.filter(z => z.severity === 'high');
        for (const zone of highSeverityZones) {
            const prevZones = stabilityHistory.length > 0
                ? (stabilityHistory[stabilityHistory.length - 1]?.contradiction_zones || [])
                : [];
            const wasPresent = prevZones.some(z => z.zone_type === zone.zone_type);
            if (wasPresent) {
                persistentInstabilityZones.push({
                    zone_type: zone.zone_type,
                    description: zone.description,
                    persistence_snapshots: 2,
                    severity: zone.severity,
                    critical: true
                });
            }
        }
    }

    // Check for persistent destabilization across history
    if (stabilityHistory.length >= 3) {
        const unstableHistory = stabilityHistory.slice(-3);
        const allUnstable = unstableHistory.every(h => h.stability_state === 'UNSTABLE' || h.stability_state === 'COLLAPSING');
        if (allUnstable && persistentInstabilityZones.length === 0) {
            persistentInstabilityZones.push({
                zone_type: 'persistent_destabilization',
                description: 'Three consecutive unstable snapshots — persistent destabilization zone',
                persistence_snapshots: 3,
                severity: 'high',
                critical: true
            });
        }
    }

    assessment.persistent_instability_zones = persistentInstabilityZones;

    // === STABILIZATION TRACKING ===

    const stabilizationTracking = trackStabilization(stabilityHistory, destabilizationPressures);
    assessment.stabilization_tracking = stabilizationTracking;

    // === COMPUTE OVERALL STABILITY SCORE ===

    let stabilityScore = 0;

    // Resilience contribution (0.3 weight)
    stabilityScore += resilienceScore.resilience_strength * 0.3;

    // Destabilization penalty
    const destabilPenalty = destabilizationPressures.reduce((sum, p) => sum + p.intensity * 0.15, 0);
    stabilityScore -= Math.min(destabilPenalty, 0.4);

    // Coherence contribution (0.25 weight)
    if (coherenceRecord) {
        stabilityScore += (coherenceRecord.coherence_strength || 0.5) * 0.25;
    }

    // Recovery contribution (0.15 weight)
    const recoveryScore = persistenceTracking.recovery_success_rate || 0;
    stabilityScore += recoveryScore * 0.15;

    // Oscillation penalty
    if (assessment.oscillation_regions?.length > 0) {
        stabilityScore -= 0.1;
    }

    assessment.stability_score = Math.max(0, Math.min(1, Math.round(stabilityScore * 100) / 100));
    assessment.stability_strength = assessment.stability_score;

    // === DETERMINE STABILITY STATE ===

    if (assessment.stability_score >= 0.75 && destabilizationPressures.filter(p => p.severity === 'high').length === 0) {
        assessment.stability_state = 'STABLE';
    } else if (assessment.stability_score >= 0.5 && destabilizationPressures.filter(p => p.severity === 'high').length <= 1) {
        assessment.stability_state = 'STRAINED';
    } else if (assessment.stability_score >= 0.25) {
        assessment.stability_state = 'UNSTABLE';
    } else {
        assessment.stability_state = 'COLLAPSING';
    }

    // Override if critical pressures present
    if (persistentInstabilityZones.some(z => z.critical) && assessment.stability_score < 0.5) {
        assessment.stability_state = 'COLLAPSING';
    }

    return assessment;
}

function computeResilienceScore(coherenceRecord, pressureMapping, attentionRecord, salienceRecord, stabilityHistory) {
    let score = 0.5; // Base score

    // Coherence contribution
    if (coherenceRecord) {
        const cs = coherenceRecord.coherence_strength || 0.5;
        score += cs * 0.2;
    }

    // Low destabilization pressure contribution
    if (pressureMapping) {
        const strain = pressureMapping.strain_level || 'LOW';
        if (strain === 'LOW') score += 0.1;
        else if (strain === 'MODERATE') score += 0.05;
        else if (strain === 'HIGH') score -= 0.05;
        else score -= 0.1;
    }

    // Attention capacity contribution
    if (attentionRecord) {
        const state = attentionRecord.capacity_assessment?.state || 'AVAILABLE';
        const fragmentation = attentionRecord.capacity_assessment?.fragmentation || 0;
        if (state === 'AVAILABLE') score += 0.1;
        else if (state === 'PARTIAL') score += 0.05;
        else if (state === 'HIGH') score -= 0.05;
        else score -= 0.1;
        if (fragmentation > 0.3) score -= 0.1;
    }

    // Recovery history contribution
    if (stabilityHistory.length >= 3) {
        const recentHistory = stabilityHistory.slice(-3);
        const recoveryCount = recentHistory.filter(h =>
            h.stability_state === 'STABLE' || h.stability_state === 'STRAINED'
        ).length;
        const recoveryRate = recoveryCount / recentHistory.length;
        score += recoveryRate * 0.15;
    }

    score = Math.max(0, Math.min(1, score));

    // Determine resilience profile
    let resilienceLevel;
    if (score >= 0.8) resilienceLevel = 'high';
    else if (score >= 0.6) resilienceLevel = 'moderate';
    else if (score >= 0.4) resilienceLevel = 'low';
    else resilienceLevel = 'critical';

    return {
        resilience_strength: Math.round(score * 100) / 100,
        resilience_level: resilienceLevel,
        recovery_contribution: stabilityHistory.length >= 3 ? Math.round((stabilityHistory.slice(-3).filter(h => h.stability_state !== 'UNSTABLE' && h.stability_state !== 'COLLAPSING').length / 3) * 100) / 100 : 0.5,
        coherence_contribution: coherenceRecord ? coherenceRecord.coherence_strength || 0.5 : 0.5
    };
}

function detectOscillatingPattern(states) {
    if (states.length < 3) return false;
    let alternations = 0;
    for (let i = 1; i < states.length; i++) {
        const prev = states[i - 1];
        const curr = states[i];
        if ((prev === 'STABLE' && (curr === 'UNSTABLE' || curr === 'COLLAPSING')) ||
            (prev === 'UNSTABLE' || prev === 'COLLAPSING') && (curr === 'STABLE' || curr === 'STRAINED') ||
            (prev === 'STRAINED' && curr === 'UNSTABLE') ||
            (prev === 'UNSTABLE' && curr === 'STRAINED')) {
            alternations++;
        }
    }
    return alternations >= 2;
}

function trackStabilityPersistence(coherenceRecord, stabilityHistory) {
    if (stabilityHistory.length === 0) {
        return {
            recovery_success_rate: 0.5,
            stabilization_attempts: 0,
            successful_stabilizations: 0,
            failed_stabilizations: 0,
            resilience_cycles: 0
        };
    }

    // Count stabilization attempts and successes
    let stabilizationAttempts = 0;
    let successfulStabilizations = 0;
    let failedStabilizations = 0;

    for (let i = 1; i < stabilityHistory.length; i++) {
        const prev = stabilityHistory[i - 1];
        const curr = stabilityHistory[i];
        if ((prev.stability_state === 'UNSTABLE' || prev.stability_state === 'COLLAPSING')) {
            stabilizationAttempts++;
            if (curr.stability_state === 'STABLE' || curr.stability_state === 'STRAINED') {
                successfulStabilizations++;
            } else if (curr.stability_state === 'UNSTABLE' || curr.stability_state === 'COLLAPSING') {
                failedStabilizations++;
            }
        }
    }

    const recoverySuccessRate = stabilizationAttempts > 0
        ? successfulStabilizations / stabilizationAttempts
        : 1.0; // No destabilizations = perfect stability

    return {
        recovery_success_rate: Math.round(recoverySuccessRate * 100) / 100,
        stabilization_attempts: stabilizationAttempts,
        successful_stabilizations: successfulStabilizations,
        failed_stabilizations: failedStabilizations,
        resilience_cycles: stabilizationAttempts,
        perfect_stability: stabilizationAttempts === 0 // No destabilization events detected
    };
}

function trackStabilization(stabilityHistory, destabilizationPressures) {
    if (stabilityHistory.length === 0) {
        return {
            stabilization_duration: 0,
            destabilization_duration: 0,
            net_stabilization: 0,
            stabilization_rate: 0.5
        };
    }

    const stableSnapshots = stabilityHistory.filter(h => h.stability_state === 'STABLE' || h.stability_state === 'STRAINED').length;
    const unstableSnapshots = stabilityHistory.filter(h => h.stability_state === 'UNSTABLE' || h.stability_state === 'COLLAPSING').length;
    const total = stabilityHistory.length;

    return {
        stabilization_duration: stableSnapshots,
        destabilization_duration: unstableSnapshots,
        net_stabilization: stableSnapshots - unstableSnapshots,
        stabilization_rate: Math.round(stableSnapshots / total * 100) / 100,
        current_stability_trend: stableSnapshots > unstableSnapshots ? 'stabilizing' : unstableSnapshots > stableSnapshots ? 'destabilizing' : 'neutral'
    };
}

// === STABILITY DRIFT TRACKING ===

function trackStabilityDrift(stabilityHistory) {
    if (!stabilityHistory || stabilityHistory.length < 2) {
        return {
            profile: 'INDETERMINATE',
            description: DRIFT_PROFILES.INDETERMINATE.description,
            interpretation: DRIFT_PROFILES.INDETERMINATE.interpretation,
            drift_strength: 0,
            confidence: 'low'
        };
    }

    // Map stability states to numeric values
    const stateMap = { 'STABLE': 4, 'STRAINED': 3, 'UNSTABLE': 2, 'COLLAPSING': 1 };
    const stateHistory = stabilityHistory.map(h => stateMap[h.stability_state] || 2);

    // Compare first half vs second half
    const midPoint = Math.floor(stateHistory.length / 2);
    const firstHalf = stateHistory.slice(0, midPoint);
    const secondHalf = stateHistory.slice(midPoint);
    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / Math.max(firstHalf.length, 1);
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / Math.max(secondHalf.length, 1);
    const delta = secondAvg - firstAvg;

    // Compute variance
    const mean = stateHistory.reduce((s, v) => s + v, 0) / stateHistory.length;
    const variance = stateHistory.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / stateHistory.length;

    // Count oscillations
    let oscillationCount = 0;
    for (let i = 1; i < stateHistory.length; i++) {
        if ((stateHistory[i] >= 3 && stateHistory[i - 1] <= 2) || (stateHistory[i] <= 2 && stateHistory[i - 1] >= 3)) {
            oscillationCount++;
        }
    }

    // Check for recovery pattern
    let recovering = false;
    if (stateHistory[0] <= 2 && stateHistory[stateHistory.length - 1] >= 3 && delta > 0.5) {
        recovering = true;
    }

    // Check for saturating pattern
    let saturating = false;
    if (Math.abs(delta) < 0.3 && variance < 0.5 && oscillationCount < 2) {
        saturating = true;
    }

    let profile;
    if (recovering) {
        profile = 'RECOVERING';
    } else if (oscillationCount >= 2 && oscillationCount >= stateHistory.length * 0.3) {
        profile = 'OSCILLATING';
    } else if (delta > 0.8 && variance < 1.5) {
        profile = 'STABILIZING';
    } else if (delta < -0.8 && variance < 1.5) {
        profile = 'DESTABILIZING';
    } else if (saturating) {
        profile = 'SATURATING';
    } else if (variance >= 1.2 && Math.abs(delta) < 0.5) {
        profile = 'FRAGMENTING';
    } else if (delta > 0.3 && variance >= 0.8) {
        profile = 'ADAPTING';
    } else {
        profile = 'INDETERMINATE';
    }

    const driftProfile = DRIFT_PROFILES[profile] || DRIFT_PROFILES.INDETERMINATE;

    return {
        profile,
        description: driftProfile.description,
        interpretation: driftProfile.interpretation,
        drift_strength: Math.round(Math.abs(delta) * 100) / 100,
        confidence: stabilityHistory.length >= 4 ? 'high' : stabilityHistory.length >= 2 ? 'medium' : 'low',
        stability_state_history: stateHistory,
        oscillation_count: oscillationCount
    };
}

// === UNCERTAINTY BOUNDARIES ===

function generateUncertaintyBoundaries(assessment, stabilityHistory) {
    const boundaries = [];

    if (!stabilityHistory || stabilityHistory.length < 3) {
        boundaries.push({
            factor: 'insufficient_stability_history',
            impact: 'Limited stability history — drift classification and resilience assessment may be unreliable',
            confidence_level: 'low'
        });
    }

    if (assessment.oscillation_regions?.length > 0 && stabilityHistory.length < 5) {
        boundaries.push({
            factor: 'oscillation_classification_uncertain',
            impact: 'Oscillation detected but limited history — pattern may be transient or premature classification',
            confidence_level: 'medium'
        });
    }

    if (assessment.stability_state === 'COLLAPSING') {
        boundaries.push({
            factor: 'collapsing_stability_state',
            impact: 'Stability state is COLLAPSING — environmental cognitive landscape is critically unstable',
            confidence_level: 'high'
        });
    }

    if (assessment.destabilization_pressures?.some(p => p.severity === 'high') && stabilityHistory.length < 3) {
        boundaries.push({
            factor: 'high_destabilization_pressure_without_history',
            impact: 'High destabilization pressure detected but insufficient history to assess persistence',
            confidence_level: 'medium'
        });
    }

    if (assessment.persistence_summary?.recovery_success_rate === 0 && stabilityHistory.length >= 5) {
        boundaries.push({
            factor: 'zero_recovery_success',
            impact: 'No successful recoveries in extended history — resilience may be exhausted',
            confidence_level: 'medium'
        });
    }

    if (boundaries.length === 0) {
        boundaries.push({
            factor: 'bounded_observation_window',
            impact: 'All stability observations bounded by current window — future conditions may alter stability classification',
            confidence_level: 'low'
        });
    }

    return boundaries;
}

// === STABILITY MEMORY RETENTION ===

function loadStabilityHistory() {
    try {
        if (!fs.existsSync(STABILITY_HISTORY_FILE)) return [];
        const lines = fs.readFileSync(STABILITY_HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
        return lines.map(line => {
            try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
    } catch {
        return [];
    }
}

function saveStabilitySnapshot(stabilityRecord) {
    // Save current stability
    fs.writeFileSync(STABILITY_FILE, JSON.stringify(stabilityRecord, null, 2));

    // Append to history (append-only)
    const historyLine = JSON.stringify(stabilityRecord) + '\n';
    fs.appendFileSync(STABILITY_HISTORY_FILE, historyLine);

    // Enforce bounded memory — keep last MAX_HISTORY entries
    const history = loadStabilityHistory();
    if (history.length > MAX_HISTORY) {
        const trimmed = history.slice(-MAX_HISTORY);
        fs.writeFileSync(STABILITY_HISTORY_FILE, trimmed.map(h => JSON.stringify(h)).join('\n') + '\n');
    }

    // Audit log
    const auditEntry = {
        timestamp: new Date().toISOString(),
        phase: 'MCAI-5F',
        audit_action: 'cognitive_stability_snapshot_generated',
        stability_state: stabilityRecord.stability_state,
        stability_strength: stabilityRecord.stability_strength,
        resilience_level: stabilityRecord.resilience_assessment?.resilience_level,
        destabilization_pressure_count: stabilityRecord.destabilization_pressures?.length || 0,
        shadow_only: true
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === MAIN STABILITY RUNNER ===

function runCognitiveStability(context) {
    const { coherenceRecord, pressureMapping, attentionRecord, salienceRecord, stabilityHistory = [] } = context;

    // Step 1: Compute stability regulation
    const assessment = computeStabilityRegulation(context);

    // Step 2: Track stability drift
    const stabilityDrift = trackStabilityDrift(stabilityHistory);

    // Step 3: Generate uncertainty boundaries
    const uncertaintyBoundaries = generateUncertaintyBoundaries(assessment, stabilityHistory);

    // Build complete stability record
    const stabilityRecord = {
        stability_state: assessment.stability_state,
        stability_strength: assessment.stability_strength,
        resilience_profile: assessment.resilience_assessment,
        destabilization_pressures: assessment.destabilization_pressures,
        recovery_regions: assessment.recovery_regions,
        persistent_instability_zones: assessment.persistent_instability_zones,
        oscillation_regions: assessment.oscillation_regions || [],
        recovery_continuity_summary: assessment.recovery_continuity_summary,
        resilience_assessment: assessment.resilience_assessment,
        stabilization_tracking: assessment.stabilization_tracking,
        stability_drift_profile: stabilityDrift,
        stability_score: assessment.stability_score,
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_stability_summary: generateStabilitySummary(assessment),
        generated_at: new Date().toISOString(),
        shadow_only: true
    };

    // Step 4: Save snapshot
    saveStabilitySnapshot(stabilityRecord);

    return stabilityRecord;
}

function generateStabilitySummary(assessment) {
    const state = assessment.stability_state;
    const resilience = assessment.resilience_assessment;
    const destabPressure = assessment.destabilization_pressures?.length || 0;
    const persistentZones = assessment.persistent_instability_zones?.length || 0;
    const oscillationRegions = assessment.oscillation_regions?.length || 0;

    let summary;
    if (state === 'STABLE') {
        summary = 'Environmental cognitive landscape is structurally stable. High resilience, low destabilization pressure. Recovery mechanisms are effective. No significant fragmentation or oscillation.';
    } else if (state === 'STRAINED') {
        summary = `Environmental cognitive landscape is strained. Moderate destabilization pressure (${destabPressure} sources). Recovery is active but showing fatigue. Some fragmentation present.`;
    } else if (state === 'UNSTABLE') {
        summary = `Environmental cognitive landscape is structurally unstable. High destabilization pressure (${destabPressure} sources), ${persistentZones} persistent zones. Recovery mechanisms are strained.`;
    } else {
        summary = `Environmental cognitive landscape is collapsing. Overwhelming destabilization pressure (${destabPressure} sources), ${persistentZones} persistent zones, ${oscillationRegions} oscillation regions. Critical intervention required to prevent total fragmentation.`;
    }

    return {
        summary,
        stability_state: state,
        resilience_level: resilience?.resilience_level || 'unknown',
        destabilization_source_count: destabPressure,
        persistent_instability_count: persistentZones,
        oscillation_regions: oscillationRegions
    };
}

// === EXPORTS ===

module.exports = {
    computeStabilityRegulation,
    trackStabilityDrift,
    trackStabilityPersistence,
    trackStabilization,
    runCognitiveStability,
    loadStabilityHistory,
    STABILITY_STATES,
    DRIFT_PROFILES,
    MAX_HISTORY
};