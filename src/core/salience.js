/**
 * Salience Formation Layer — MCAI Phase 5B
 * SHADOW-ONLY: Observational salience detection without action authority.
 * 
 * This module identifies conditions of persistent cognitive significance across time.
 * It observes salience — NOT what should be acted upon.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const SALIENCE_FILE = path.join(STATE_DIR, 'salience.json');
const SALIENCE_HISTORY_FILE = path.join(STATE_DIR, 'salience-history.jsonl');
const AWARENESS_FILE = path.join(STATE_DIR, 'situational-awareness.json');

const MAX_HISTORY = 30;
const MIN_SALIENCE_RECURRENCE = 2;
const PERSISTENCE_THRESHOLD_DAYS = 3;

// === SALIENCE STRENGTH CLASSIFICATIONS ===

const SALIENCE_LEVELS = {
    TRANSIENT: {
        level: 'TRANSIENT',
        description: 'Condition observed with limited temporal persistence. May be a single occurrence or brief sequence. Insufficient evidence to establish sustained significance.',
        requirements: '1-2 observations, <1 day persistence, no recurrence'
    },
    EMERGING: {
        level: 'EMERGING',
        description: 'Condition beginning to exhibit repeated significance. Patterns are forming but continuity is not yet established. Observation period insufficient for confident classification.',
        requirements: '2-3 observations, 1-2 day persistence, weak recurrence'
    },
    PERSISTENT: {
        level: 'PERSISTENT',
        description: 'Condition demonstrates sustained cognitive significance across multiple observation windows. Recurrence is established and continuity is measurable. Confidence is moderate to high.',
        requirements: '3+ observations, 2+ day persistence, clear recurrence'
    },
    DOMINANT: {
        level: 'DOMINANT',
        description: 'Condition represents the most significant cognitive pattern in the observed environment. Exhibits strong persistence, consistent recurrence, and overwhelming evidence of sustained importance.',
        requirements: '5+ observations, 3+ day persistence, strong recurrence, dominant in environment'
    }
};

// === TEMPORAL SALIENCE PROFILES ===

const TEMPORAL_PROFILES = {
    STRENGTHENING: {
        profile: 'STRENGTHENING',
        description: 'Salience is increasing in frequency and significance over the observation window. Each recurrence is more pronounced than the last.',
        interpretation: 'Pattern is accelerating. Requires continued observation.'
    },
    WEAKENING: {
        profile: 'WEAKENING',
        description: 'Salience is decreasing in frequency and significance over the observation window. Recurrence intervals are lengthening.',
        interpretation: 'Pattern is diminishing. May resolve without intervention.'
    },
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Salience is maintaining consistent levels across the observation window. Recurrence is regular and predictable.',
        interpretation: 'Pattern has reached equilibrium state.'
    },
    CYCLICAL: {
        profile: 'CYCLICAL',
        description: 'Salience exhibits regular oscillation between high and low significance periods. Pattern repeats with measurable periodicity.',
        interpretation: 'Pattern follows a cyclical trajectory. Recurrence intervals are consistent.'
    },
    FRAGMENTING: {
        profile: 'FRAGMENTING',
        description: 'Salience is losing coherence across the observation window. Recurrence is irregular and significance is diminishing.',
        interpretation: 'Pattern is breaking apart. Continuity is uncertain.'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Insufficient observation history to determine salience trajectory. Requires additional snapshot data.',
        interpretation: 'More observations needed before trajectory can be classified.'
    }
};

// === PERSISTENT SALIENCE DETECTION ===

/**
 * Detect persistent salience patterns across perception history.
 * @param {Array} perceptions - Array of perception records
 * @param {Object} temporalContext - Temporal continuity from Phase 4A
 * @param {Array} awarenessSnapshots - Previous awareness snapshots
 * @returns {Object} Salience detection results
 */
function detectPersistentSalience(perceptions, temporalContext, awarenessSnapshots) {
    const salienceSignals = {
        chronic_instability: [],
        recurring_contradiction: [],
        repeated_volatility: [],
        unresolved_degradation: [],
        persistent_uncertainty: [],
        recurring_verification_decay: [],
        temporal_instability: [],
        repeated_oscillation: []
    };

    // Build entity-level salience map
    const entitySalience = {};
    for (const p of perceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = {
                entity_id: p.entity_id,
                category_history: [],
                score_history: [],
                drift_patterns: [],
                observation_counts: [],
                instability_events: [],
                contradiction_events: [],
                verification_failures: [],
                degraded_periods: [],
                oscillation_events: []
            };
        }
        const e = entitySalience[p.entity_id];
        e.category_history.push(p.category);
        e.score_history.push(p.score);
        e.drift_patterns.push(p.drift?.pattern || 'UNKNOWN');
        if (p.observation_counts) {
            e.observation_counts.push(p.observation_counts);
            if (p.observation_counts.unstable_state_changes > 0) {
                e.instability_events.push(p.observation_counts.unstable_state_changes);
            }
            if (p.observation_counts.contradictions > 0) {
                e.contradiction_events.push(p.observation_counts.contradictions);
            }
            if (p.observation_counts.verification_failures > 0) {
                e.verification_failures.push(p.observation_counts.verification_failures);
            }
            if (p.observation_counts.degraded_periods > 0) {
                e.degraded_periods.push(p.observation_counts.degraded_periods);
            }
            if (p.drift?.pattern === 'OSCILLATING') {
                e.oscillation_events.push(1);
            }
        }
    }

    // Detect chronic instability
    // Threshold: single DEGRADED observation with elevated score and instability is sufficient
    for (const [entityId, data] of Object.entries(entitySalience)) {
        const degradedCount = data.category_history.filter(c => c === 'DEGRADED' || c === 'CRITICAL_PATTERN').length;
        const avgScore = data.score_history.reduce((s, v) => s + v, 0) / data.score_history.length;
        const instabilityAvg = data.instability_events.length > 0
            ? data.instability_events.reduce((s, v) => s + v, 0) / data.instability_events.length
            : 0;

        if (degradedCount >= 1 && avgScore > 0.4 && instabilityAvg > 2) {
            salienceSignals.chronic_instability.push({
                entity_id: entityId,
                degraded_occurrences: degradedCount,
                avg_score: Math.round(avgScore * 1000) / 1000,
                avg_instability: Math.round(instabilityAvg * 1000) / 1000,
                severity: instabilityAvg > 4 ? 'high' : instabilityAvg > 2 ? 'medium' : 'low'
            });
        }

        // Detect recurring contradiction — use total contradiction count, not event count
        const totalContradictions = data.contradiction_events.reduce((s, v) => s + v, 0);
        if (totalContradictions >= 2) {
            salienceSignals.recurring_contradiction.push({
                entity_id: entityId,
                contradiction_count: totalContradictions,
                recurrence_events: data.contradiction_events.length,
                density: data.contradiction_events.length > 0 ? Math.round(totalContradictions / data.contradiction_events.length * 1000) / 1000 : 0,
                severity: totalContradictions >= 4 ? 'high' : totalContradictions >= 2 ? 'medium' : 'low'
            });
        }

        // Detect repeated volatility — oscillating entities show the pattern
        // A single oscillation event with one observation is sufficient
        if (data.oscillation_events.length >= 1) {
            salienceSignals.repeated_volatility.push({
                entity_id: entityId,
                oscillation_count: data.oscillation_events.length,
                oscillation_ratio: Math.round(data.oscillation_events.length / data.category_history.length * 1000) / 1000,
                severity: data.oscillation_events.length >= 2 ? 'high' : 'medium'
            });
        }

        // Detect unresolved degradation — use sum of degraded periods, not count
        const totalDegraded = data.degraded_periods.reduce((s, v) => s + v, 0);
        if (totalDegraded >= 3) {
            salienceSignals.unresolved_degradation.push({
                entity_id: entityId,
                degraded_period_count: data.degraded_periods.length,
                total_degraded_periods: totalDegraded,
                avg_degraded_per_window: data.degraded_periods.length > 0 ? Math.round(totalDegraded / data.degraded_periods.length * 1000) / 1000 : 0,
                severity: totalDegraded >= 6 ? 'high' : totalDegraded >= 3 ? 'medium' : 'low'
            });
        }

        // Detect recurring verification decay — use total failures
        const totalFailures = data.verification_failures.reduce((s, v) => s + v, 0);
        if (totalFailures >= 2) {
            const failureRate = data.verification_failures.length > 0 ? totalFailures / (data.verification_failures.length * 3) : 0;
            if (failureRate > 0.3) {
                salienceSignals.recurring_verification_decay.push({
                    entity_id: entityId,
                    failure_count: totalFailures,
                    recurrence_events: data.verification_failures.length,
                    failure_rate: Math.round(failureRate * 1000) / 1000,
                    severity: failureRate > 0.6 ? 'high' : failureRate > 0.3 ? 'medium' : 'low'
                });
            }
        }
    }

    // Detect temporal instability recurrence from temporalContext
    if (temporalContext) {
        if (temporalContext.stability_trend === 'DEGRADING') {
            salienceSignals.temporal_instability.push({
                pattern: 'DEGRADING_STABILITY',
                trend: 'downward',
                evidence_count: temporalContext.deltas?.length || 0,
                severity: 'medium'
            });
        }
        if (temporalContext.oscillation_detected) {
            salienceSignals.repeated_oscillation.push({
                pattern: 'OSCILLATION_DETECTED',
                oscillation_rate: temporalContext.oscillation_rate || 0,
                severity: 'medium'
            });
        }
    }

    // Persistent uncertainty accumulation from awareness snapshots
    if (awarenessSnapshots && awarenessSnapshots.length >= 2) {
        const uncertaintySnapshots = awarenessSnapshots.filter(s => s.uncertainty_factors?.length > 0);
        if (uncertaintySnapshots.length >= 2) {
            const growingUncertainty = [];
            for (let i = 1; i < awarenessSnapshots.length; i++) {
                const prev = awarenessSnapshots[i - 1].uncertainty_factors?.length || 0;
                const curr = awarenessSnapshots[i].uncertainty_factors?.length || 0;
                if (curr > prev) growingUncertainty.push(i);
            }
            if (growingUncertainty.length >= 2) {
                salienceSignals.persistent_uncertainty.push({
                    pattern: 'GROWING_UNCERTAINTY',
                    growing_snapshots: growingUncertainty.length,
                    total_uncertainty_factors: uncertaintySnapshots.reduce((s, sn) => s + (sn.uncertainty_factors?.length || 0), 0),
                    severity: growingUncertainty.length >= 3 ? 'high' : 'medium'
                });
            }
        }
    }

    return salienceSignals;
}

// === SALIENCE STRENGTH CLASSIFICATION ===

/**
 * Classify the strength of a salience signal based on observation history.
 * @param {Object} signal - Salience signal record
 * @param {number} observationCount - Number of observations
 * @param {number} persistenceDays - Number of days with observations
 * @returns {Object} Salience level classification
 */
function classifySalienceStrength(signal, observationCount, persistenceDays) {
    const recurrenceScore = signal.recurrence_events || signal.degraded_occurrences || signal.contradiction_count || 1;
    const severityScore = signal.severity === 'high' ? 3 : signal.severity === 'medium' ? 2 : 1;
    const compositeScore = (recurrenceScore * 0.6) + (severityScore * 0.4);

    // Determine level based on observation count and recurrence
    if (observationCount >= 5 && persistenceDays >= 3 && recurrenceScore >= 3) {
        return SALIENCE_LEVELS.DOMINANT;
    } else if (observationCount >= 3 && persistenceDays >= 2 && recurrenceScore >= 2) {
        return SALIENCE_LEVELS.PERSISTENT;
    } else if (observationCount >= 2 && recurrenceScore >= 1) {
        return SALIENCE_LEVELS.EMERGING;
    } else {
        return SALIENCE_LEVELS.TRANSIENT;
    }
}

// === SALIENCE CLUSTERING ===

/**
 * Identify clusters of entities exhibiting synchronized salience.
 * @param {Array} salienceSignals - All detected salience signals
 * @param {Array} entitySalience - Per-entity salience data
 * @returns {Array} Salience clusters
 */
function detectSalienceClusters(salienceSignals, entitySalience) {
    const clusters = [];

    // Synchronized instability cluster — entities with significant degradation
    // Use degraded_periods sum as indicator (total degraded periods across observations)
    const degradedEntities = Object.entries(entitySalience)
        .filter(([, data]) => data.degraded_periods.reduce((s, v) => s + v, 0) >= 3)
        .map(([id]) => id);
    if (degradedEntities.length >= 2) {
        clusters.push({
            cluster_type: 'synchronized_instability',
            entity_count: degradedEntities.length,
            entities: degradedEntities,
            description: `${degradedEntities.length} entities exhibiting concurrent degraded states`,
            significance: degradedEntities.length >= 3 ? 'high' : 'medium'
        });
    }

    // Recurring contradiction cluster
    const contradictionEntities = salienceSignals.recurring_contradiction
        .filter(s => s.severity !== 'low')
        .map(s => s.entity_id);
    if (contradictionEntities.length >= 2) {
        clusters.push({
            cluster_type: 'contradiction_cluster',
            entity_count: contradictionEntities.length,
            entities: contradictionEntities,
            description: `${contradictionEntities.length} entities exhibiting recurring contradiction pressure`,
            significance: contradictionEntities.length >= 3 ? 'high' : 'medium'
        });
    }

    // Volatility cluster
    const volatileEntities = salienceSignals.repeated_volatility
        .filter(s => s.severity !== 'low')
        .map(s => s.entity_id);
    if (volatileEntities.length >= 2) {
        clusters.push({
            cluster_type: 'volatility_cluster',
            entity_count: volatileEntities.length,
            entities: volatileEntities,
            description: `${volatileEntities.length} entities exhibiting repeated volatility`,
            significance: volatileEntities.length >= 3 ? 'high' : 'medium'
        });
    }

    // Degradation continuity cluster
    const unresolvedEntities = salienceSignals.unresolved_degradation
        .filter(s => s.severity !== 'low')
        .map(s => s.entity_id);
    if (unresolvedEntities.length >= 2) {
        clusters.push({
            cluster_type: 'degradation_continuity',
            entity_count: unresolvedEntities.length,
            entities: unresolvedEntities,
            description: `${unresolvedEntities.length} entities with unresolved degradation continuity`,
            significance: unresolvedEntities.length >= 3 ? 'high' : 'medium'
        });
    }

    // Cross-signal cluster (entities appearing in multiple signal types)
    const entitySignalCounts = {};
    for (const [, signals] of Object.entries(salienceSignals)) {
        for (const s of signals) {
            if (s.entity_id) {
                entitySignalCounts[s.entity_id] = (entitySignalCounts[s.entity_id] || 0) + 1;
            }
        }
    }
    const multiSignalEntities = Object.entries(entitySignalCounts)
        .filter(([, count]) => count >= 2)
        .map(([id]) => id);
    if (multiSignalEntities.length >= 2) {
        clusters.push({
            cluster_type: 'multi_signal_concentration',
            entity_count: multiSignalEntities.length,
            entities: multiSignalEntities,
            description: `${multiSignalEntities.length} entities exhibiting multiple concurrent salience patterns`,
            significance: multiSignalEntities.length >= 3 ? 'high' : 'low'
        });
    }

    return clusters;
}

// === TEMPORAL SALIENCE PROFILE ===

/**
 * Compute the temporal profile of salience across snapshots.
 * @param {Array} awarenessSnapshots - Ordered awareness snapshots (oldest first)
 * @param {Array} salienceSignals - Detected salience signals
 * @returns {Object} Temporal profile with trajectory
 */
function computeTemporalProfile(awarenessSnapshots, salienceSignals) {
    if (awarenessSnapshots.length < 2) {
        return {
            profile: 'INDETERMINATE',
            description: TEMPORAL_PROFILES.INDETERMINATE.description,
            interpretation: TEMPORAL_PROFILES.INDETERMINATE.interpretation,
            strengthening_count: 0,
            weakening_count: 0,
            stable_count: 0,
            cyclical_indicators: [],
            snapshot_count: awarenessSnapshots.length,
            confidence: 'low'
        };
    }

    // Analyze salience density trend across snapshots
    const salienceCounts = awarenessSnapshots.map((s, i) => {
        const chronicCount = s.chronic_entities?.length || 0;
        const clusterCount = s.unstable_clusters?.length || 0;
        return chronicCount + clusterCount;
    });

    // Compare first half vs second half
    const midPoint = Math.floor(awarenessSnapshots.length / 2);
    const firstHalf = salienceCounts.slice(0, midPoint);
    const secondHalf = salienceCounts.slice(midPoint);

    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;

    const delta = secondAvg - firstAvg;

    // Detect cyclical patterns by checking for oscillation in salience counts
    let oscillationCount = 0;
    for (let i = 1; i < salienceCounts.length; i++) {
        if ((salienceCounts[i] > salienceCounts[i - 1] && salienceCounts[i - 1] < (salienceCounts[i - 2] || 0)) ||
            (salienceCounts[i] < salienceCounts[i - 1] && salienceCounts[i - 1] > (salienceCounts[i - 2] || 0))) {
            oscillationCount++;
        }
    }

    // Determine profile
    let profile, description, interpretation;
    if (oscillationCount >= 2 && oscillationCount >= salienceCounts.length * 0.3) {
        profile = 'CYCLICAL';
        description = TEMPORAL_PROFILES.CYCLICAL.description;
        interpretation = TEMPORAL_PROFILES.CYCLICAL.interpretation;
    } else if (delta > 0.5) {
        profile = 'STRENGTHENING';
        description = TEMPORAL_PROFILES.STRENGTHENING.description;
        interpretation = TEMPORAL_PROFILES.STRENGTHENING.interpretation;
    } else if (delta < -0.5) {
        profile = 'WEAKENING';
        description = TEMPORAL_PROFILES.WEAKENING.description;
        interpretation = TEMPORAL_PROFILES.WEAKENING.interpretation;
    } else if (Math.abs(delta) <= 0.5 && oscillationCount < 2) {
        profile = 'STABILIZING';
        description = TEMPORAL_PROFILES.STABILIZING.description;
        interpretation = TEMPORAL_PROFILES.STABILIZING.interpretation;
    } else {
        profile = 'FRAGMENTING';
        description = TEMPORAL_PROFILES.FRAGMENTING.description;
        interpretation = TEMPORAL_PROFILES.FRAGMENTING.interpretation;
    }

    return {
        profile,
        description,
        interpretation,
        strengthening_count: Math.max(0, Math.round(delta * 10)),
        weakening_count: Math.max(0, Math.round(-delta * 10)),
        stable_count: awarenessSnapshots.length - Math.abs(Math.round(delta * 10)),
        cyclical_indicators: oscillationCount >= 2 ? [`${oscillationCount} oscillation cycles detected`] : [],
        snapshot_count: awarenessSnapshots.length,
        confidence: awarenessSnapshots.length >= 4 ? 'high' : awarenessSnapshots.length >= 2 ? 'medium' : 'low',
        salience_trend: delta
    };
}

// === SALIENCE MEMORY FORMATION ===

/**
 * Generate a bounded salience record from current state.
 * @param {Array} perceptions - Current perception array
 * @param {Object} awarenessSnapshot - Current awareness snapshot
 * @param {Object} salienceSignals - Detected salience signals
 * @param {Array} clusters - Detected salience clusters
 * @param {Object} temporalProfile - Temporal profile analysis
 * @param {Array} history - Previous salience snapshots
 * @returns {Object} Salience record
 */
function generateSalienceRecord(perceptions, awarenessSnapshot, salienceSignals, clusters, temporalProfile, history) {
    // Collect all salient entities
    const salientEntities = new Set();
    for (const [, signals] of Object.entries(salienceSignals)) {
        for (const s of signals) {
            if (s.entity_id) salientEntities.add(s.entity_id);
        }
    }

    // Collect salient patterns
    const salientPatterns = [];
    for (const [signalType, signals] of Object.entries(salienceSignals)) {
        const filtered = signals.filter(s => s.severity !== 'low');
        if (filtered.length > 0) {
            salientPatterns.push({
                pattern_type: signalType,
                instances: filtered.length,
                entities: filtered.map(s => s.entity_id).filter(Boolean),
                highest_severity: filtered.reduce((max, s) => {
                    const sevOrder = { high: 3, medium: 2, low: 1 };
                    return sevOrder[s.severity] > sevOrder[max] ? s.severity : max;
                }, 'low')
            });
        }
    }

    // Compute persistence summary
    const persistenceSummary = {
        total_salient_entities: salientEntities.size,
        dominant_signals: salientPatterns.filter(p => p.highest_severity === 'high').map(p => p.pattern_type),
        emerging_signals: salientPatterns.filter(p => p.highest_severity === 'medium').map(p => p.pattern_type),
        transient_signals: salientPatterns.filter(p => p.highest_severity === 'low').map(p => p.pattern_type)
    };

    // Compute recurrence summary
    const recurrenceSummary = {
        recurring_entities: [...salientEntities].filter(e =>
            salientPatterns.some(p => p.entities.includes(e) && p.instances >= 2)
        ),
        cluster_count: clusters.length,
        cyclical_patterns: temporalProfile.profile === 'CYCLICAL' ? temporalProfile.cyclical_indicators : []
    };

    // Compute environmental significance
    const envSignificance = computeEnvironmentalSignificance(perceptions, salientEntities.size, clusters.length, temporalProfile);

    // Generate uncertainty boundaries
    const uncertaintyBoundaries = generateUncertaintyBoundaries(temporalProfile, history, salientEntities.size, clusters.length);

    // Compute temporal profile
    const temporal_profile = {
        current_profile: temporalProfile.profile,
        description: temporalProfile.description,
        interpretation: temporalProfile.interpretation,
        snapshot_count: temporalProfile.snapshot_count,
        confidence: temporalProfile.confidence,
        trend_delta: temporalProfile.salience_trend || 0
    };

    return {
        salience_level: determineOverallSalienceLevel(salientPatterns, clusters, temporalProfile),
        salient_entities: [...salientEntities],
        salient_patterns: salientPatterns,
        persistence_summary: persistenceSummary,
        recurrence_summary: recurrenceSummary,
        environmental_significance: envSignificance,
        uncertainty_boundaries: uncertaintyBoundaries,
        temporal_profile,
        clusters,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };
}

function determineOverallSalienceLevel(salientPatterns, clusters, temporalProfile) {
    const highSeverity = salientPatterns.filter(p => p.highest_severity === 'high').length;
    const mediumSeverity = salientPatterns.filter(p => p.highest_severity === 'medium').length;
    const dominantClusters = clusters.filter(c => c.significance === 'high').length;
    const isDominant = highSeverity >= 3 && dominantClusters >= 2 && temporalProfile.profile === 'STRENGTHENING';
    const isPersistent = highSeverity >= 1 || mediumSeverity >= 3 || dominantClusters >= 1;
    const isEmerging = mediumSeverity >= 1 || highSeverity >= 1;

    if (isDominant) return 'DOMINANT';
    if (isPersistent) return 'PERSISTENT';
    if (isEmerging) return 'EMERGING';
    return 'TRANSIENT';
}

function computeEnvironmentalSignificance(perceptions, salientEntityCount, clusterCount, temporalProfile) {
    const totalEntities = perceptions.length || 1;
    const affectedRatio = salientEntityCount / totalEntities;
    const clusterRatio = clusterCount / Math.max(totalEntities, 1);

    let significance;
    if (affectedRatio >= 0.5 && clusterCount >= 2) significance = 'environment-shaping';
    else if (affectedRatio >= 0.3 && clusterCount >= 1) significance = 'environment-significant';
    else if (affectedRatio >= 0.15) significance = 'environment-noticeable';
    else significance = 'environment-minimal';

    return {
        significance,
        affected_entity_ratio: Math.round(affectedRatio * 1000) / 1000,
        cluster_density: Math.round(clusterRatio * 1000) / 1000,
        trajectory_contribution: temporalProfile.profile,
        interpretation: `${affectedRatio >= 0.3 ? 'Multiple' : 'Limited'} entities exhibit persistent salience. ${clusterCount >= 2 ? 'Multiple clusters detected.' : 'Isolated signals.'}`
    };
}

function generateUncertaintyBoundaries(temporalProfile, history, salientEntityCount, clusterCount) {
    const boundaries = [];

    if (temporalProfile.confidence === 'low') {
        boundaries.push({
            factor: 'insufficient_snapshot_history',
            impact: 'Temporal profile classification may be unreliable with limited snapshots',
            confidence_level: 'low'
        });
    }

    if (temporalProfile.profile === 'INDETERMINATE') {
        boundaries.push({
            factor: 'indeterminate_trajectory',
            impact: 'Cannot determine whether salience is strengthening or weakening',
            confidence_level: 'low'
        });
    }

    if (history.length < 3) {
        boundaries.push({
            factor: 'limited_recurrence_evidence',
            impact: 'Salience recurrence patterns may be coincidental without sufficient history',
            confidence_level: 'low'
        });
    }

    if (salientEntityCount < 2) {
        boundaries.push({
            factor: 'insufficient_entity_coverage',
            impact: 'Salience may not represent environmental pattern with single entity',
            confidence_level: 'low'
        });
    }

    if (clusterCount === 0) {
        boundaries.push({
            factor: 'no_cluster_detected',
            impact: 'Salience patterns appear isolated — may not indicate environmental significance',
            confidence_level: 'medium'
        });
    }

    if (temporalProfile.profile === 'CYCLICAL' && temporalProfile.snapshot_count < 5) {
        boundaries.push({
            factor: 'cyclical_classification_premature',
            impact: 'Pattern may not be truly cyclical — more observations needed',
            confidence_level: 'medium'
        });
    }

    if (boundaries.length === 0) {
        boundaries.push({
            factor: 'bounded_observation',
            impact: 'All observations are bounded by the current snapshot window — future data may alter classification',
            confidence_level: 'low'
        });
    }

    return boundaries;
}

// === PERSISTENCE TRACKING ===

/**
 * Track persistence of salience across snapshots.
 * @param {Object} currentSalience - Current salience record
 * @param {Array} history - Previous salience records
 * @returns {Object} Persistence tracking data
 */
function trackSaliencePersistence(currentSalience, history) {
    const persistentEntities = [];
    const stabilizationAttempts = [];
    const recoveryInterruptions = [];

    if (history.length === 0) {
        return {
            persistent_entity_count: 0,
            stabilization_attempt_count: 0,
            recovery_interruption_count: 0,
            persistent_entities: [],
            new_salient_entities: currentSalience.salient_entities,
            departed_salient_entities: []
        };
    }

    const previousEntities = new Set(history[history.length - 1]?.salient_entities || []);
    const currentEntities = new Set(currentSalience.salient_entities || []);

    // Entities that persisted across snapshots
    for (const entity of previousEntities) {
        if (currentEntities.has(entity)) {
            const continuityHistory = history.filter(h => h.salient_entities?.includes(entity));
            if (continuityHistory.length >= 2) {
                persistentEntities.push({
                    entity_id: entity,
                    continuity_snapshots: continuityHistory.length,
                    first_observed: continuityHistory[0]?.generated_at,
                    last_observed: continuityHistory[continuityHistory.length - 1]?.generated_at
                });
            }
        }
    }

    // New entities not in previous snapshot
    const newEntities = [...currentEntities].filter(e => !previousEntities.has(e));

    // Entities that departed (in previous but not current)
    const departedEntities = [...previousEntities].filter(e => !currentEntities.has(e));

    return {
        persistent_entity_count: persistentEntities.length,
        stabilization_attempt_count: stabilizationAttempts.length,
        recovery_interruption_count: recoveryInterruptions.length,
        persistent_entities: persistentEntities.map(p => p.entity_id),
        new_salient_entities: newEntities,
        departed_salient_entities: departedEntities,
        continuity_details: persistentEntities
    };
}

// === BOUNDED MEMORY ===

function loadSalienceHistory() {
    try {
        if (!fs.existsSync(SALIENCE_HISTORY_FILE)) return [];
        const lines = fs.readFileSync(SALIENCE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
        return lines.map(line => {
            try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
    } catch {
        return [];
    }
}

function saveSalienceSnapshot(salienceRecord) {
    // Save current salience
    fs.writeFileSync(SALIENCE_FILE, JSON.stringify(salienceRecord, null, 2));

    // Append to history (append-only)
    const historyLine = JSON.stringify(salienceRecord) + '\n';
    fs.appendFileSync(SALIENCE_HISTORY_FILE, historyLine);

    // Enforce bounded memory — keep last MAX_HISTORY entries
    const history = loadSalienceHistory();
    if (history.length > MAX_HISTORY) {
        const trimmed = history.slice(-MAX_HISTORY);
        fs.writeFileSync(SALIENCE_HISTORY_FILE, trimmed.map(h => JSON.stringify(h)).join('\n') + '\n');
    }

    // Audit log
    const auditEntry = {
        timestamp: new Date().toISOString(),
        phase: 'MCAI-5B',
        audit_action: 'salience_snapshot_generated',
        salience_level: salienceRecord.salience_level,
        salient_entity_count: salienceRecord.salient_entities?.length || 0,
        pattern_count: salienceRecord.salient_patterns?.length || 0,
        cluster_count: salienceRecord.clusters?.length || 0,
        shadow_only: true
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === MAIN RUNNER ===

/**
 * Run the complete salience formation pipeline.
 * @param {Object} context - { perceptions, awarenessSnapshot, temporalContext, priorHistory? }
 * @returns {Object} Complete salience record
 */
function runSalienceFormation(context) {
    const { perceptions, awarenessSnapshot, temporalContext, priorHistory = [] } = context;

    // Step 1: Detect persistent salience signals
    const awarenessSnapshots = priorHistory.map(h => h.temporal_profile).filter(Boolean);
    const salienceSignals = detectPersistentSalience(perceptions, temporalContext, awarenessSnapshots);

    // Step 2: Build entity salience map
    const entitySalience = {};
    for (const p of perceptions) {
        if (!entitySalience[p.entity_id]) {
            entitySalience[p.entity_id] = {
                entity_id: p.entity_id,
                category_history: [],
                score_history: [],
                drift_patterns: [],
                observation_counts: [],
                instability_events: [],
                contradiction_events: [],
                verification_failures: [],
                degraded_periods: [],
                oscillation_events: []
            };
        }
        const e = entitySalience[p.entity_id];
        e.category_history.push(p.category);
        e.score_history.push(p.score);
        e.drift_patterns.push(p.drift?.pattern || 'UNKNOWN');
        if (p.observation_counts) {
            e.observation_counts.push(p.observation_counts);
            if (p.observation_counts.unstable_state_changes > 0) {
                e.instability_events.push(p.observation_counts.unstable_state_changes);
            }
            if (p.observation_counts.contradictions > 0) {
                e.contradiction_events.push(p.observation_counts.contradictions);
            }
            if (p.observation_counts.verification_failures > 0) {
                e.verification_failures.push(p.observation_counts.verification_failures);
            }
            if (p.observation_counts.degraded_periods > 0) {
                e.degraded_periods.push(p.observation_counts.degraded_periods);
            }
            if (p.drift?.pattern === 'OSCILLATING') {
                e.oscillation_events.push(1);
            }
        }
    }

    // Step 3: Detect salience clusters
    const clusters = detectSalienceClusters(salienceSignals, entitySalience);

    // Step 4: Compute temporal profile
    const temporalProfile = computeTemporalProfile(awarenessSnapshots, salienceSignals);

    // Step 5: Track persistence
    const persistence = trackSaliencePersistence(
        { salient_entities: Object.keys(entitySalience) },
        priorHistory
    );

    // Step 6: Generate salience record
    const salienceRecord = generateSalienceRecord(
        perceptions,
        awarenessSnapshot,
        salienceSignals,
        clusters,
        temporalProfile,
        priorHistory
    );

    // Add persistence tracking to record
    salienceRecord.persistence_tracking = persistence;

    // Step 7: Save snapshot
    saveSalienceSnapshot(salienceRecord);

    return salienceRecord;
}

// === EXPORTS ===

module.exports = {
    detectPersistentSalience,
    classifySalienceStrength,
    detectSalienceClusters,
    computeTemporalProfile,
    generateSalienceRecord,
    trackSaliencePersistence,
    loadSalienceHistory,
    runSalienceFormation,
    SALIENCE_LEVELS,
    TEMPORAL_PROFILES,
    MAX_HISTORY,
    SALIENCE_LEVELS_ENUM: ['TRANSIENT', 'EMERGING', 'PERSISTENT', 'DOMINANT'],
    TEMPORAL_PROFILES_ENUM: ['STRENGTHENING', 'WEAKENING', 'STABILIZING', 'CYCLICAL', 'FRAGMENTING', 'INDETERMINATE']
};