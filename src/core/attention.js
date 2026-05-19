/**
 * Attention Formation Layer — MCAI Phase 5C
 * SHADOW-ONLY: Bounded observational attention without action authority.
 * 
 * This module models which cognitively salient conditions remain active
 * within constrained environmental attention capacity.
 * 
 * It observes attention — NOT what should be acted upon.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const ATTENTION_FILE = path.join(STATE_DIR, 'attention.json');
const ATTENTION_HISTORY_FILE = path.join(STATE_DIR, 'attention-history.jsonl');

const MAX_HISTORY = 30;
const MAX_ACTIVE_ATTENTION_REGIONS = 5;

// === ATTENTION STRENGTH CLASSIFICATIONS ===

const ATTENTION_LEVELS = {
    BACKGROUND: {
        level: 'BACKGROUND',
        description: 'Condition occupies minimal environmental attention. Present but does not compete for limited attention resources. May be observable but is not currently salient enough to influence cognitive processing.',
        requirements: 'Single observation or low-intensity signal with no recurrence'
    },
    ACTIVE: {
        level: 'ACTIVE',
        description: 'Condition occupies measurable environmental attention. Competing for limited attention resources but not dominating the attention landscape. Observable and tracked.',
        requirements: 'Clear recurrence with measurable intensity over observation window'
    },
    ELEVATED: {
        level: 'ELEVATED',
        description: 'Condition occupies significant environmental attention. Competing strongly for limited attention resources. Multiple concurrent signals indicate sustained attention demand.',
        requirements: '3+ observations across multiple signal types, strong recurrence'
    },
    DOMINANT: {
        level: 'DOMINANT',
        description: 'Condition occupies the majority of available environmental attention. Represents the primary focus of bounded cognitive attention. Other attention demands are suppressed or deferred.',
        requirements: '5+ observations, multiple concurrent signal types, sustained recurrence across all windows'
    }
};

// === ATTENTION TRANSITION PROFILES ===

const TRANSITION_PROFILES = {
    STRENGTHENING: {
        profile: 'STRENGTHENING',
        description: 'Attention is shifting toward this condition, occupying increasing cognitive resources.',
        interpretation: 'Attention demand is growing. Condition becoming more prominent in environmental awareness.'
    },
    WEAKENING: {
        profile: 'WEAKENING',
        description: 'Attention is receding from this condition, releasing cognitive resources.',
        interpretation: 'Attention demand is diminishing. Condition becoming less prominent.'
    },
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Attention is maintaining consistent focus on this condition.',
        interpretation: 'Attention has reached equilibrium. Stable cognitive resource allocation.'
    },
    FRAGMENTING: {
        profile: 'FRAGMENTING',
        description: 'Attention is dispersing across multiple competing conditions.',
        interpretation: 'Attention no longer concentrated. Environmental awareness is becoming diffuse.'
    },
    DISPERSING: {
        profile: 'DISPERSING',
        description: 'Attention is dispersing from concentrated state to distributed state.',
        interpretation: 'Attention demand decreasing. Condition no longer requires sustained focus.'
    },
    SATURATING: {
        profile: 'SATURATING',
        description: 'Attention capacity is approaching maximum. Multiple conditions competing for limited resources.',
        interpretation: 'Bounded attention capacity near limits. Some attention demands cannot be fully processed.'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Insufficient observation history to determine attention transition direction.',
        interpretation: 'More observations needed before transition can be classified.'
    }
};

// === ATTENTION CAPACITY CONSTRAINTS ===

const CAPACITY_STATES = {
    AVAILABLE: {
        state: 'AVAILABLE',
        description: 'Environmental attention capacity has room for additional active conditions.',
        interpretation: 'Bounded attention not yet saturated. Additional attention demands can be accommodated.'
    },
    PARTIAL: {
        state: 'PARTIAL',
        description: 'Environmental attention capacity is moderately utilized.',
        interpretation: 'Some attention capacity consumed. Room for additional demands exists.'
    },
    HIGH: {
        state: 'HIGH',
        description: 'Environmental attention capacity is substantially utilized.',
        interpretation: 'Attention capacity approaching saturation. Additional demands may be deferred.'
    },
    SATURATED: {
        state: 'SATURATED',
        description: 'Environmental attention capacity has reached or exceeded limits.',
        interpretation: 'Bounded attention fully consumed. Attention competition is high.'
    }
};

// === ATTENTION ACTIVATION ===

/**
 * Determine which salient conditions currently occupy environmental attention.
 * @param {Object} salienceRecord - Current salience record from Phase 5B
 * @param {Object} cognitivePressure - Current cognitive pressure mapping from Phase 5A
 * @param {Array} attentionHistory - Previous attention snapshots
 * @returns {Object} Attention activation data
 */
function determineAttentionActivation(salienceRecord, cognitivePressure, attentionHistory) {
    const activation = {
        active_entities: [],
        active_patterns: [],
        activation_strength: {},
        attention_signals: []
    };

    if (!salienceRecord) return activation;

    // Entity-level attention activation
    const salientEntities = salienceRecord.salient_entities || [];
    const salientPatterns = salienceRecord.salient_patterns || [];
    const persistenceTracking = salienceRecord.persistence_tracking || {};
    const clusters = salienceRecord.clusters || [];

    // Compute activation strength per entity based on salience severity
    for (const entity of salientEntities) {
        const entityPatterns = salientPatterns.filter(p => p.entities && p.entities.includes(entity));
        const highestSeverity = entityPatterns.reduce((max, p) => {
            const sevOrder = { high: 3, medium: 2, low: 1 };
            return sevOrder[p.highest_severity] > sevOrder[max] ? p.highest_severity : max;
        }, 'low');

        const patternCount = entityPatterns.length;
        const isPersistent = persistenceTracking.persistent_entities?.includes(entity);

        activation.active_entities.push({
            entity_id: entity,
            pattern_count: patternCount,
            highest_severity: highestSeverity,
            is_persistent: isPersistent,
            activation_level: computeEntityActivationLevel(patternCount, highestSeverity, isPersistent)
        });
    }

    // Pattern-level attention activation
    for (const pattern of salientPatterns) {
        if (pattern.instances >= 1 && pattern.highest_severity !== 'low') {
            activation.active_patterns.push({
                pattern_type: pattern.pattern_type,
                instances: pattern.instances,
                entity_count: pattern.entities?.length || 0,
                highest_severity: pattern.highest_severity,
                activation_level: computePatternActivationLevel(pattern.instances, pattern.highest_severity)
            });
        }
    }

    // Attention competition signals from clusters
    for (const cluster of clusters) {
        if (cluster.significance === 'high' || cluster.significance === 'medium') {
            activation.attention_signals.push({
                signal_type: 'cluster_competition',
                cluster_type: cluster.cluster_type,
                entity_count: cluster.entity_count,
                significance: cluster.significance
            });
        }
    }

    // Add cognitive pressure signals
    if (cognitivePressure) {
        const unresolvedCount = cognitivePressure.unresolved_pressure_count || 0;
        const chronicEntities = cognitivePressure.chronic_entities || [];
        const strainLevel = cognitivePressure.strain_level || 'LOW';

        if (unresolvedCount >= 3 || chronicEntities.length >= 2) {
            activation.attention_signals.push({
                signal_type: 'cognitive_pressure',
                unresolved_count: unresolvedCount,
                chronic_entity_count: chronicEntities.length,
                strain_level: strainLevel,
                significance: unresolvedCount >= 6 ? 'high' : 'medium'
            });
        }
    }

    return activation;
}

function computeEntityActivationLevel(patternCount, highestSeverity, isPersistent) {
    const severityScore = { low: 1, medium: 2, high: 3 }[highestSeverity] || 1;
    const persistenceBonus = isPersistent ? 1 : 0;
    const compositeScore = patternCount * severityScore + persistenceBonus;

    if (compositeScore >= 10) return 'DOMINANT';
    if (compositeScore >= 6) return 'ELEVATED';
    if (compositeScore >= 3) return 'ACTIVE';
    return 'BACKGROUND';
}

function computePatternActivationLevel(instances, highestSeverity) {
    const severityScore = { low: 1, medium: 2, high: 3 }[highestSeverity] || 1;
    const compositeScore = instances * severityScore;

    if (compositeScore >= 8) return 'DOMINANT';
    if (compositeScore >= 5) return 'ELEVATED';
    if (compositeScore >= 2) return 'ACTIVE';
    return 'BACKGROUND';
}

// === ATTENTION COMPETITION MODELING ===

/**
 * Model competition between multiple attention demands.
 * @param {Object} activation - Current attention activation
 * @param {Array} clusters - Salience clusters
 * @returns {Object} Competition modeling results
 */
function modelAttentionCompetition(activation, clusters) {
    const competition = {
        competing_entities: [],
        competing_patterns: [],
        overlapping_clusters: [],
        competition_intensity: 0,
        dominant_competitors: []
    };

    // Entity-level competition
    const elevatedEntities = activation.active_entities.filter(e => 
        e.activation_level === 'ELEVATED' || e.activation_level === 'DOMINANT'
    );
    competition.competing_entities = elevatedEntities.map(e => e.entity_id);
    competition.dominant_competitors = elevatedEntities
        .filter(e => e.activation_level === 'DOMINANT')
        .map(e => e.entity_id);

    // Pattern-level competition
    competition.competing_patterns = activation.active_patterns
        .filter(p => p.activation_level !== 'BACKGROUND')
        .map(p => p.pattern_type);

    // Cluster overlap detection
    const clusterEntities = clusters.map(c => new Set(c.entities || []));
    const overlappingPairs = [];
    for (let i = 0; i < clusterEntities.length; i++) {
        for (let j = i + 1; j < clusterEntities.length; j++) {
            const overlap = [...clusterEntities[i]].filter(e => clusterEntities[j].has(e));
            if (overlap.length >= 2) {
                overlappingPairs.push({
                    cluster_a: clusters[i].cluster_type,
                    cluster_b: clusters[j].cluster_type,
                    shared_entities: overlap.length,
                    entities: overlap
                });
            }
        }
    }
    competition.overlapping_clusters = overlappingPairs;

    // Competition intensity: ratio of competing entities to total active
    const totalActive = activation.active_entities.length;
    const competingCount = competition.competing_entities.length;
    competition.competition_intensity = totalActive > 0 
        ? Math.round(competingCount / totalActive * 1000) / 1000 
        : 0;

    return competition;
}

// === ATTENTION CAPACITY ASSESSMENT ===

/**
 * Assess bounded environmental attention capacity.
 * @param {Object} activation - Current attention activation
 * @param {number} maxCapacity - Maximum active attention regions
 * @returns {Object} Capacity assessment
 */
function assessAttentionCapacity(activation, maxCapacity = MAX_ACTIVE_ATTENTION_REGIONS) {
    const activeCount = activation.active_entities.filter(e => 
        e.activation_level !== 'BACKGROUND'
    ).length;
    
    const patternCount = activation.active_patterns.filter(p => 
        p.activation_level !== 'BACKGROUND'
    ).length;

    const signalCount = activation.attention_signals.length;

    // Compute saturation metrics
    const utilizationRatio = activeCount / maxCapacity;
    const saturationScore = (activeCount * 0.6 + patternCount * 0.3 + signalCount * 0.1) / maxCapacity;

    let capacityState;
    if (utilizationRatio <= 0.3) capacityState = CAPACITY_STATES.AVAILABLE;
    else if (utilizationRatio <= 0.6) capacityState = CAPACITY_STATES.PARTIAL;
    else if (utilizationRatio <= 0.9) capacityState = CAPACITY_STATES.HIGH;
    else capacityState = CAPACITY_STATES.SATURATED;

    const fragmentation = activeCount > maxCapacity
        ? Math.round((activeCount - maxCapacity) / activeCount * 1000) / 1000
        : 0;

    return {
        state: capacityState.state,
        state_description: capacityState.description,
        state_interpretation: capacityState.interpretation,
        active_count: activeCount,
        pattern_count: patternCount,
        signal_count: signalCount,
        max_capacity: maxCapacity,
        utilization_ratio: Math.round(utilizationRatio * 1000) / 1000,
        saturation_score: Math.round(saturationScore * 1000) / 1000,
        fragmentation,
        overload_indicator: saturationScore > 0.8
    };
}

// === ATTENTION PERSISTENCE TRACKING ===

/**
 * Track attention persistence across snapshots.
 * @param {Array} activeEntities - Current active attention entities
 * @param {Array} attentionHistory - Previous attention snapshots
 * @returns {Object} Persistence tracking data
 */
function trackAttentionPersistence(activeEntities, attentionHistory) {
    if (!attentionHistory || attentionHistory.length === 0) {
        return {
            persistent_attention_count: 0,
            recurring_attention_cycles: 0,
            attention_interruption_count: 0,
            sustained_presence_entities: [],
            new_attention_entities: activeEntities.map(e => e.entity_id || e),
            departed_attention_entities: []
        };
    }

    const currentEntitySet = new Set(activeEntities.map(e => e.entity_id || e));
    const previousEntities = new Set(
        attentionHistory[attentionHistory.length - 1]?.active_attention_entities || []
    );

    // Sustained presence: entities in current and at least one prior snapshot
    const sustainedEntities = [...currentEntitySet].filter(e => {
        const historyCount = attentionHistory.filter(h => 
            (h.active_attention_entities || []).includes(e)
        ).length;
        return historyCount >= 2;
    });

    // Recurring attention cycles: entities that appear, disappear, reappear
    const recurringEntities = [...currentEntitySet].filter(e => {
        const appearances = attentionHistory.filter(h => 
            (h.active_attention_entities || []).includes(e)
        ).length;
        return appearances >= 3 && appearances < attentionHistory.length;
    });

    // Interruptions: entities that were in previous but not current
    const interruptions = [...previousEntities].filter(e => !currentEntitySet.has(e));

    return {
        persistent_attention_count: sustainedEntities.length,
        recurring_attention_cycles: recurringEntities.length,
        attention_interruption_count: interruptions.length,
        sustained_presence_entities: sustainedEntities,
        new_attention_entities: [...currentEntitySet].filter(e => !previousEntities.has(e)),
        departed_attention_entities: interruptions
    };
}

// === ATTENTION TRANSITION ANALYSIS ===

/**
 * Analyze attention transition across snapshots.
 * @param {Array} attentionHistory - Previous attention snapshots
 * @param {Object} currentActivation - Current activation state
 * @returns {Object} Transition profile
 */
function analyzeAttentionTransition(attentionHistory, currentActivation) {
    if (!attentionHistory || attentionHistory.length < 2) {
        return {
            profile: 'INDETERMINATE',
            description: TRANSITION_PROFILES.INDETERMINATE.description,
            interpretation: TRANSITION_PROFILES.INDETERMINATE.interpretation,
            transition_strength: 0,
            confidence: 'low'
        };
    }

    // Compare active count trend
    const activeCounts = attentionHistory.map(h => h.active_attention_entities?.length || 0);
    activeCounts.push(currentActivation.active_entities?.length || 0);

    const midPoint = Math.floor(activeCounts.length / 2);
    const firstHalfAvg = activeCounts.slice(0, midPoint).reduce((s, v) => s + v, 0) / Math.max(midPoint, 1);
    const secondHalfAvg = activeCounts.slice(midPoint).reduce((s, v) => s + v, 0) / Math.max(activeCounts.length - midPoint, 1);
    const delta = secondHalfAvg - firstHalfAvg;

    // Count transitions to saturation
    const saturationHistory = attentionHistory.map(h => h.capacity_assessment?.state === 'SATURATED');
    const saturationChanges = saturationHistory.filter((v, i) => i > 0 && v !== saturationHistory[i - 1]).length;

    // Count interruptions
    const interruptHistory = attentionHistory.map(h => h.persistence_summary?.attention_interruption_count || 0);
    const avgInterrupts = interruptHistory.reduce((s, v) => s + v, 0) / attentionHistory.length;

    // Determine transition profile
    // Key: FRAGMENTING requires high interruptions throughout with entity set changing dramatically
    // DISPERSING: sustained decrease with consistent interruptions
    const lastInterrupts = attentionHistory[attentionHistory.length - 1]?.persistence_summary?.attention_interruption_count || 0;
    const hasFragmentationPattern = lastInterrupts > avgInterrupts && lastInterrupts >= 2;
    const highInterrupts = avgInterrupts > 2 && lastInterrupts >= 2;
    const dramaticEntityChurn = activeCounts.length >= 3 && 
        Math.abs(activeCounts[0] - activeCounts[activeCounts.length - 1]) >= 2;

    let profile;
    if (saturationChanges >= 2 && delta > 0) {
        profile = 'SATURATING';
    } else if (delta > 0.5 && activeCounts[activeCounts.length - 1] > activeCounts[0]) {
        profile = 'STRENGTHENING';
    } else if (highInterrupts && dramaticEntityChurn && delta < 0.5) {
        // FRAGMENTING: high consistent interruptions + entity set changing significantly
        profile = 'FRAGMENTING';
    } else if (delta < -1.0 && !hasFragmentationPattern) {
        // DISPERSING: dramatic decrease without fragmentation pattern
        profile = 'DISPERSING';
    } else if (Math.abs(delta) <= 0.5 && saturationChanges < 2) {
        profile = 'STABILIZING';
    } else if (delta < 0) {
        profile = 'WEAKENING';
    } else {
        profile = 'INDETERMINATE';
    }

    const transitionProfile = TRANSITION_PROFILES[profile] || TRANSITION_PROFILES.INDETERMINATE;

    return {
        profile,
        description: transitionProfile.description,
        interpretation: transitionProfile.interpretation,
        transition_strength: Math.round(Math.abs(delta) * 100) / 100,
        confidence: attentionHistory.length >= 4 ? 'high' : attentionHistory.length >= 2 ? 'medium' : 'low',
        active_count_trend: delta > 0 ? 'increasing' : delta < 0 ? 'decreasing' : 'stable',
        saturation_transitions: saturationChanges
    };
}

// === ATTENTION DISTRIBUTION ===

/**
 * Compute attention distribution across entities and patterns.
 * @param {Object} activation - Current activation state
 * @returns {Object} Attention distribution
 */
function computeAttentionDistribution(activation) {
    const entities = activation.active_entities || [];
    const patterns = activation.active_patterns || [];
    const signals = activation.attention_signals || [];

    // Entity attention distribution
    const entityLevels = { DOMINANT: 0, ELEVATED: 0, ACTIVE: 0, BACKGROUND: 0 };
    for (const e of entities) {
        const level = e.activation_level || 'BACKGROUND';
        entityLevels[level]++;
    }

    // Pattern attention distribution
    const patternLevels = { DOMINANT: 0, ELEVATED: 0, ACTIVE: 0, BACKGROUND: 0 };
    for (const p of patterns) {
        const level = p.activation_level || 'BACKGROUND';
        patternLevels[level]++;
    }

    // Signal types
    const signalTypes = signals.reduce((acc, s) => {
        acc[s.signal_type] = (acc[s.signal_type] || 0) + 1;
        return acc;
    }, {});

    const totalActive = entities.filter(e => e.activation_level !== 'BACKGROUND').length;
    const totalEntities = entities.length;

    return {
        entity_distribution: entityLevels,
        pattern_distribution: patternLevels,
        signal_type_breakdown: signalTypes,
        active_ratio: totalEntities > 0 ? Math.round(totalActive / totalEntities * 1000) / 1000 : 0,
        dominant_count: entityLevels.DOMINANT + patternLevels.DOMINANT,
        elevated_count: entityLevels.ELEVATED + patternLevels.ELEVATED,
        active_count: entityLevels.ACTIVE + patternLevels.ACTIVE
    };
}

// === UNCERTAINTY BOUNDARIES ===

function generateUncertaintyBoundaries(activation, competition, capacity, transition, history) {
    const boundaries = [];

    if (!history || history.length < 2) {
        boundaries.push({
            factor: 'insufficient_attention_history',
            impact: 'Transition analysis and persistence tracking have limited reliability with few snapshots',
            confidence_level: 'low'
        });
    }

    if (transition.confidence === 'low') {
        boundaries.push({
            factor: 'indeterminate_transition',
            impact: 'Attention transition profile cannot be reliably determined with current observation window',
            confidence_level: 'low'
        });
    }

    if (competition.overlapping_clusters.length === 0 && activation.active_entities.length > 2) {
        boundaries.push({
            factor: 'no_competition_detected',
            impact: 'Multiple active entities but no cluster overlap detected — attention may be isolated rather than competing',
            confidence_level: 'medium'
        });
    }

    if (capacity.utilization_ratio > 0.8 && competition.competition_intensity > 0.5) {
        boundaries.push({
            factor: 'attention_overload_uncertainty',
            impact: 'Capacity near saturation with high competition — attention assignment may be unreliable under stress',
            confidence_level: 'medium'
        });
    }

    if (activation.active_entities.length < 2 && history && history.length < 3) {
        boundaries.push({
            factor: 'limited_active_entities',
            impact: 'Single active entity makes competition modeling unreliable — may be noise rather than pattern',
            confidence_level: 'low'
        });
    }

    if (transition.profile === 'INDETERMINATE') {
        boundaries.push({
            factor: 'transition_indeterminate',
            impact: 'Attention transition direction cannot be determined — requires more snapshot data',
            confidence_level: 'low'
        });
    }

    if (boundaries.length === 0) {
        boundaries.push({
            factor: 'bounded_observation_window',
            impact: 'All attention observations are bounded by current snapshot window — future observations may alter classification',
            confidence_level: 'low'
        });
    }

    return boundaries;
}

// === ATTENTION MEMORY RETENTION ===

function loadAttentionHistory() {
    try {
        if (!fs.existsSync(ATTENTION_HISTORY_FILE)) return [];
        const lines = fs.readFileSync(ATTENTION_HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
        return lines.map(line => {
            try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
    } catch {
        return [];
    }
}

function saveAttentionSnapshot(attentionRecord) {
    // Save current attention
    fs.writeFileSync(ATTENTION_FILE, JSON.stringify(attentionRecord, null, 2));

    // Append to history (append-only)
    const historyLine = JSON.stringify(attentionRecord) + '\n';
    fs.appendFileSync(ATTENTION_HISTORY_FILE, historyLine);

    // Enforce bounded memory — keep last MAX_HISTORY entries
    const history = loadAttentionHistory();
    if (history.length > MAX_HISTORY) {
        const trimmed = history.slice(-MAX_HISTORY);
        fs.writeFileSync(ATTENTION_HISTORY_FILE, trimmed.map(h => JSON.stringify(h)).join('\n') + '\n');
    }

    // Audit log
    const auditEntry = {
        timestamp: new Date().toISOString(),
        phase: 'MCAI-5C',
        audit_action: 'attention_snapshot_generated',
        attention_level: attentionRecord.attention_level,
        active_entity_count: attentionRecord.active_attention_entities?.length || 0,
        dominant_pattern_count: attentionRecord.dominant_attention_patterns?.length || 0,
        competition_intensity: attentionRecord.attention_competition?.competition_intensity || 0,
        shadow_only: true
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === MAIN ATTENTION FORMATION RUNNER ===

/**
 * Run the complete attention formation pipeline.
 * @param {Object} context - { salienceRecord, cognitivePressure, attentionHistory? }
 * @returns {Object} Complete attention record
 */
function runAttentionFormation(context) {
    const { salienceRecord, cognitivePressure, attentionHistory = [] } = context;

    // Step 1: Determine attention activation
    const activation = determineAttentionActivation(salienceRecord, cognitivePressure, attentionHistory);

    // Step 2: Model attention competition
    const competition = modelAttentionCompetition(activation, salienceRecord?.clusters || []);

    // Step 3: Assess attention capacity
    const capacity = assessAttentionCapacity(activation);

    // Step 4: Compute attention distribution
    const distribution = computeAttentionDistribution(activation);

    // Step 5: Track attention persistence
    const persistence = trackAttentionPersistence(activation.active_entities, attentionHistory);

    // Step 6: Analyze attention transition
    const transition = analyzeAttentionTransition(attentionHistory, activation);

    // Step 7: Generate uncertainty boundaries
    const uncertaintyBoundaries = generateUncertaintyBoundaries(
        activation, competition, capacity, transition, attentionHistory
    );

    // Step 8: Classify overall attention level
    const attentionLevel = classifyOverallAttentionLevel(activation, competition, capacity);

    // Step 9: Generate environmental attention summary
    const envSummary = generateEnvironmentalSummary(activation, competition, capacity, transition);

    // Build complete attention record
    const attentionRecord = {
        attention_level: attentionLevel,
        active_attention_entities: activation.active_entities,
        dominant_attention_patterns: activation.active_patterns.filter(p => 
            p.activation_level === 'ELEVATED' || p.activation_level === 'DOMINANT'
        ),
        attention_distribution: distribution,
        attention_competition: {
            competing_entities: competition.competing_entities,
            competing_patterns: competition.competing_patterns,
            overlapping_clusters: competition.overlapping_clusters,
            competition_intensity: competition.competition_intensity,
            dominant_competitors: competition.dominant_competitors
        },
        capacity_assessment: capacity,
        persistence_summary: persistence,
        transition_profile: transition,
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_attention_summary: envSummary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };

    // Step 10: Save snapshot
    saveAttentionSnapshot(attentionRecord);

    return attentionRecord;
}

function classifyOverallAttentionLevel(activation, competition, capacity) {
    const elevatedEntities = activation.active_entities.filter(e => 
        e.activation_level === 'ELEVATED' || e.activation_level === 'DOMINANT'
    ).length;
    const elevatedPatterns = activation.active_patterns.filter(p => 
        p.activation_level === 'ELEVATED' || p.activation_level === 'DOMINANT'
    ).length;
    const dominantCompetitors = competition.dominant_competitors?.length || 0;
    const saturationScore = capacity.saturation_score || 0;

    const compositeScore = elevatedEntities * 2 + elevatedPatterns + dominantCompetitors * 3 + saturationScore * 5;

    if (compositeScore >= 15) return 'DOMINANT';
    if (compositeScore >= 8) return 'ELEVATED';
    if (compositeScore >= 3) return 'ACTIVE';
    return 'BACKGROUND';
}

function generateEnvironmentalSummary(activation, competition, capacity, transition) {
    const activeCount = activation.active_entities.filter(e => e.activation_level !== 'BACKGROUND').length;
    const totalEntities = activation.active_entities.length;
    const clusterCompetition = competition.overlapping_clusters.length;

    let summary;
    if (capacity.state === 'SATURATED') {
        summary = 'Environmental attention is saturated. Multiple conditions competing for limited capacity. Attention is fragmented across competing demands.';
    } else if (transition.profile === 'STRENGTHENING') {
        summary = 'Environmental attention is intensifying toward specific conditions. Attention demand is growing. Capacity being consumed rapidly.';
    } else if (transition.profile === 'FRAGMENTING') {
        summary = 'Environmental attention is fragmenting across multiple competing conditions. No single condition dominates. Attention is diffuse.';
    } else if (activeCount >= 4 && clusterCompetition >= 2) {
        summary = 'Multiple attention demands active with cluster overlap. Attention competition is high. Capacity is under pressure.';
    } else if (activeCount >= 2) {
        summary = 'Multiple attention demands active but capacity available. Competition is moderate. Some attention concentration observed.';
    } else {
        summary = 'Limited attention demands active. Environmental attention is available. No significant competition observed.';
    }

    return {
        summary,
        active_entity_ratio: totalEntities > 0 ? Math.round(activeCount / totalEntities * 1000) / 1000 : 0,
        cluster_competition_count: clusterCompetition,
        capacity_state: capacity.state,
        transition_direction: transition.profile
    };
}

// === EXPORTS ===

module.exports = {
    determineAttentionActivation,
    modelAttentionCompetition,
    assessAttentionCapacity,
    trackAttentionPersistence,
    analyzeAttentionTransition,
    computeAttentionDistribution,
    generateUncertaintyBoundaries,
    runAttentionFormation,
    loadAttentionHistory,
    ATTENTION_LEVELS,
    TRANSITION_PROFILES,
    CAPACITY_STATES,
    MAX_ACTIVE_ATTENTION_REGIONS,
    MAX_HISTORY
};