/**
 * Cognitive Coherence Layer — MCAI Phase 5E
 * SHADOW-ONLY: Bounded observational cognitive coherence without action authority.
 * 
 * This module models whether the overall environmental cognitive landscape
 * remains internally coherent, stable, and structurally consistent.
 * 
 * It observes cognitive coherence — NOT what should be acted upon.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const COHERENCE_FILE = path.join(STATE_DIR, 'cognitive-coherence.json');
const COHERENCE_HISTORY_FILE = path.join(STATE_DIR, 'cognitive-coherence-history.jsonl');

const MAX_HISTORY = 30;

// === COHERENCE CLASSIFICATIONS ===

const COHERENCE_STATES = {
    COHERENT: {
        state: 'COHERENT',
        description: 'Environmental cognitive landscape exhibits strong internal alignment. All observed layers point in consistent directions. Pressure, salience, attention, and context form a coherent picture. No significant contradictions or fragmentation.',
        requirements: 'High alignment across all layers, low contradiction, stable trajectories'
    },
    TENSIONED: {
        state: 'TENSIONED',
        description: 'Environmental cognitive landscape shows moderate internal tension. Some layers align while others show conflicting signals. Pressure and salience may be consistent while attention and context show strain. Contradictions are present but manageable.',
        requirements: 'Mixed alignment signals, moderate contradictions, some layer tension'
    },
    FRAGMENTED: {
        state: 'FRAGMENTED',
        description: 'Environmental cognitive landscape exhibits significant fragmentation. Multiple layers point in conflicting directions. Attention competition is high, salience is scattered, and contextual amplification is incoherent. Clear evidence of cognitive dissonance.',
        requirements: 'Conflicting layer signals, high fragmentation, multiple contradictions'
    },
    DISSONANT: {
        state: 'DISSONANT',
        description: 'Environmental cognitive landscape exhibits severe internal dissonance. All or most layers are in conflict. Pressure trajectories contradict salience, attention is scattered across competing demands, and contextual amplification shows severe incoherence. Critical cognitive fragmentation.',
        requirements: 'Severe contradiction across all layers, critical fragmentation, contradictory trajectories'
    }
};

// === COHERENCE DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: {
        profile: 'STRENGTHENING',
        description: 'Environmental cognitive coherence is strengthening. Layers are increasingly aligning. Fragmentation is decreasing. Coherence is improving.',
        interpretation: 'Coherence trend is positive. Environmental cognitive state becoming more aligned.'
    },
    WEAKENING: {
        profile: 'WEAKENING',
        description: 'Environmental cognitive coherence is weakening. Layers are increasingly misaligned. Fragmentation is increasing. Coherence is degrading.',
        interpretation: 'Coherence trend is negative. Environmental cognitive state becoming less aligned.'
    },
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Environmental cognitive coherence is maintaining consistent levels. No significant drift in either direction.',
        interpretation: 'Coherence trend is stable. Environmental cognitive state is in equilibrium.'
    },
    FRAGMENTING: {
        profile: 'FRAGMENTING',
        description: 'Environmental cognitive coherence is fragmenting. Previously aligned layers are diverging. Fragmentation is increasing.',
        interpretation: 'Coherence trend is fragmenting. Previously coherent layers are becoming misaligned.'
    },
    OSCILLATING: {
        profile: 'OSCILLATING',
        description: 'Environmental cognitive coherence is oscillating between coherence and fragmentation.',
        interpretation: 'Coherence trend is unstable. Alternating between coherent and fragmented states.'
    },
    RECOVERING: {
        profile: 'RECOVERING',
        description: 'Environmental cognitive coherence is recovering from fragmentation. Previously fragmented state is improving.',
        interpretation: 'Coherence trend is positive. Fragmented state is resolving toward coherence.'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Insufficient observation history to determine coherence drift direction.',
        interpretation: 'More observations needed before coherence drift can be classified.'
    }
};

// === COHERENCE COMPUTATION ===

/**
 * Compute cognitive coherence from all upstream MCAI layers.
 * @param {Object} context - { pressureMapping, salienceRecord, attentionRecord, contextualRelevance, temporalContext, coherenceHistory }
 * @returns {Object} Coherence assessment
 */
function computeCognitiveCoherence(context) {
    const {
        pressureMapping,
        salienceRecord,
        attentionRecord,
        contextualRelevance,
        temporalContext,
        coherenceHistory = []
    } = context;

    const assessment = {
        coherence_state: 'COHERENT',
        coherence_strength: 0,
        aligned_layers: [],
        fragmented_layers: [],
        contradiction_zones: [],
        coherence_pressures: [],
        layer_alignments: {},
        fragmentation_signals: [],
        coherence_score: 0
    };

    // === LAYER ALIGNMENT ANALYSIS ===

    const layerAlignments = {};

    // Pressure alignment (Phase 5A)
    if (pressureMapping) {
        const strainLevel = pressureMapping.strain_level || 'LOW';
        const concentration = pressureMapping.pressure_concentration?.classification || 'DISTRIBUTED';
        const trajectory = pressureMapping.pressure_trajectory?.pattern || 'INDETERMINATE';

        const pressureCoherence = (
            (strainLevel === 'LOW' || strainLevel === 'MODERATE' ? 1 : strainLevel === 'HIGH' ? 0.5 : 0) +
            (concentration === 'DISTRIBUTED' || concentration === 'LOCALIZED' ? 1 : 0) +
            (trajectory !== 'ACCUMULATING' ? 1 : 0)
        ) / 3;

        layerAlignments.pressure = {
            strain_level: strainLevel,
            concentration,
            trajectory,
            coherence_score: Math.round(pressureCoherence * 100) / 100,
            aligned: pressureCoherence >= 0.6,
            fragmented: pressureCoherence < 0.4
        };

        if (pressureCoherence >= 0.6) assessment.aligned_layers.push('pressure');
        else if (pressureCoherence < 0.4) assessment.fragmented_layers.push('pressure');

        // Pressure coherence contribution to overall
        assessment.coherence_score += pressureCoherence * 0.15;
    }

    // Salience alignment (Phase 5B)
    if (salienceRecord) {
        const salienceLevel = salienceRecord.salience_level || 'TRANSIENT';
        const entityCount = salienceRecord.salient_entities?.length || 0;
        const patternCount = salienceRecord.salient_patterns?.length || 0;
        const clusterCount = salienceRecord.clusters?.length || 0;
        const temporalProfile = salienceRecord.temporal_profile?.current_profile || 'INDETERMINATE';

        const salienceCoherence = (
            (salienceLevel === 'TRANSIENT' || salienceLevel === 'EMERGING' ? 1 : salienceLevel === 'PERSISTENT' ? 0.8 : 0.5) +
            (entityCount <= 2 ? 1 : entityCount <= 4 ? 0.7 : 0.4) +
            (temporalProfile !== 'FRAGMENTING' && temporalProfile !== 'INDETERMINATE' ? 1 : 0.5)
        ) / 3;

        layerAlignments.salience = {
            salience_level: salienceLevel,
            entity_count: entityCount,
            cluster_count: clusterCount,
            temporal_profile: temporalProfile,
            coherence_score: Math.round(salienceCoherence * 100) / 100,
            aligned: salienceCoherence >= 0.6,
            fragmented: salienceCoherence < 0.4
        };

        if (salienceCoherence >= 0.6) assessment.aligned_layers.push('salience');
        else if (salienceCoherence < 0.4) assessment.fragmented_layers.push('salience');

        assessment.coherence_score += salienceCoherence * 0.2;
    }

    // Attention alignment (Phase 5C)
    if (attentionRecord) {
        const attentionLevel = attentionRecord.attention_level || 'BACKGROUND';
        const capacityState = attentionRecord.capacity_assessment?.state || 'AVAILABLE';
        const transitionProfile = attentionRecord.transition_profile?.profile || 'INDETERMINATE';
        const competitionIntensity = attentionRecord.attention_competition?.competition_intensity || 0;

        const attentionCoherence = (
            (attentionLevel === 'BACKGROUND' || attentionLevel === 'ACTIVE' ? 1 : attentionLevel === 'ELEVATED' ? 0.7 : 0.5) +
            (capacityState === 'AVAILABLE' || capacityState === 'PARTIAL' ? 1 : capacityState === 'HIGH' ? 0.6 : 0.3) +
            (transitionProfile !== 'FRAGMENTING' && transitionProfile !== 'SATURATING' ? 1 : 0.4) +
            (competitionIntensity < 0.8 ? 1 : competitionIntensity < 1.0 ? 0.6 : 0.3)
        ) / 4;

        layerAlignments.attention = {
            attention_level: attentionLevel,
            capacity_state: capacityState,
            transition_profile: transitionProfile,
            competition_intensity: competitionIntensity,
            coherence_score: Math.round(attentionCoherence * 100) / 100,
            aligned: attentionCoherence >= 0.6,
            fragmented: attentionCoherence < 0.4
        };

        if (attentionCoherence >= 0.6) assessment.aligned_layers.push('attention');
        else if (attentionCoherence < 0.4) assessment.fragmented_layers.push('attention');

        assessment.coherence_score += attentionCoherence * 0.25;
    }

    // Contextual relevance alignment (Phase 5D)
    if (contextualRelevance) {
        const contextualState = contextualRelevance.contextual_state || 'INCIDENTAL';
        const netContextScore = contextualRelevance.contextual_pressure_relationships?.net_context_score || 0;
        const driftProfile = contextualRelevance.contextual_drift?.profile || 'INDETERMINATE';
        const ampCount = contextualRelevance.amplification_patterns?.length || 0;
        const supCount = contextualRelevance.suppression_patterns?.length || 0;

        const contextCoherence = (
            (contextualState === 'INCIDENTAL' || contextualState === 'CONTEXTUAL' ? 1 : contextualState === 'SIGNIFICANT' ? 0.8 : 0.4) +
            (Math.abs(netContextScore) < 5 ? 1 : Math.abs(netContextScore) < 8 ? 0.7 : 0.4) +
            (driftProfile !== 'OSCILLATING' && driftProfile !== 'FRAGMENTING' ? 1 : 0.4)
        ) / 3;

        layerAlignments.contextual = {
            contextual_state: contextualState,
            net_context_score: netContextScore,
            drift_profile: driftProfile,
            amplification_count: ampCount,
            suppression_count: supCount,
            coherence_score: Math.round(contextCoherence * 100) / 100,
            aligned: contextCoherence >= 0.6,
            fragmented: contextCoherence < 0.4
        };

        if (contextCoherence >= 0.6) assessment.aligned_layers.push('contextual');
        else if (contextCoherence < 0.4) assessment.fragmented_layers.push('contextual');

        assessment.coherence_score += contextCoherence * 0.2;
    }

    // Temporal alignment (from Phase 4C / temporal-continuity.js)
    if (temporalContext) {
        const temporalProfile = temporalContext.current_profile || temporalContext.profile || 'STABLE';
        const stabilityTrend = temporalContext.stability_trend || 'STABLE';

        const temporalCoherence = (
            (temporalProfile === 'STABLE' || temporalProfile === 'IMPROVING' ? 1 : temporalProfile === 'DETERIORATING' ? 0.5 : 0.7) +
            (stabilityTrend === 'STABLE' || stabilityTrend === 'IMPROVING' ? 1 : 0.5)
        ) / 2;

        layerAlignments.temporal = {
            temporal_profile: temporalProfile,
            stability_trend: stabilityTrend,
            coherence_score: Math.round(temporalCoherence * 100) / 100,
            aligned: temporalCoherence >= 0.6,
            fragmented: temporalCoherence < 0.4
        };

        if (temporalCoherence >= 0.6) assessment.aligned_layers.push('temporal');
        else if (temporalCoherence < 0.4) assessment.fragmented_layers.push('temporal');

        assessment.coherence_score += temporalCoherence * 0.1;
    } else {
        layerAlignments.temporal = {
            temporal_profile: 'INDETERMINATE',
            stability_trend: 'UNKNOWN',
            coherence_score: 0.5,
            aligned: true,
            fragmented: false
        };
        assessment.coherence_score += 0.05;
    }

    assessment.layer_alignments = layerAlignments;

    // === CONTRADICTION ZONE DETECTION ===

    const contradictionZones = [];

    // Pressure vs Salience contradiction
    if (pressureMapping && salienceRecord) {
        const highStrain = pressureMapping.strain_level === 'HIGH' || pressureMapping.strain_level === 'SEVERE';
        const lowSalience = salienceRecord.salience_level === 'TRANSIENT' || salienceRecord.salience_level === 'EMERGING';
        if (highStrain && lowSalience) {
            contradictionZones.push({
                zone_type: 'pressure_salience_mismatch',
                description: 'High environmental pressure with low salience — pressure and salience signals are contradictory',
                severity: 'high',
                layers: ['pressure', 'salience']
            });
        }
    }

    // Attention vs Contextual contradiction
    if (attentionRecord && contextualRelevance) {
        const elevatedAttention = attentionRecord.attention_level === 'ELEVATED' || attentionRecord.attention_level === 'DOMINANT';
        const lowContext = contextualRelevance.contextual_state === 'INCIDENTAL';
        if (elevatedAttention && lowContext) {
            contradictionZones.push({
                zone_type: 'attention_context_mismatch',
                description: 'Elevated attention with low contextual relevance — attention and context signals are contradictory',
                severity: 'medium',
                layers: ['attention', 'contextual']
            });
        }
    }

    // Competing dominant clusters
    if (salienceRecord) {
        const highSigClusters = salienceRecord.clusters?.filter(c => c.significance === 'high') || [];
        if (highSigClusters.length >= 3) {
            contradictionZones.push({
                zone_type: 'competing_dominant_clusters',
                description: `${highSigClusters.length} high-significance clusters competing — fragmentation risk`,
                severity: 'medium',
                layers: ['salience']
            });
        }
    }

    // Attention fragmentation
    if (attentionRecord) {
        const fragmentation = attentionRecord.capacity_assessment?.fragmentation || 0;
        const saturating = attentionRecord.capacity_assessment?.state === 'SATURATED';
        if (fragmentation > 0.3 || saturating) {
            contradictionZones.push({
                zone_type: 'attention_fragmentation',
                description: 'Attention capacity is fragmented or saturated — cognitive resources competing',
                severity: fragmentation > 0.5 ? 'high' : 'medium',
                layers: ['attention']
            });
        }
    }

    // Temporal instability contradiction
    if (temporalContext && salienceRecord) {
        const unstableTemporal = temporalContext.stability_trend === 'DEGRADING';
        const stableSalience = salienceRecord.salience_level === 'STABLE' || salienceRecord.salience_level === 'TRANSIENT';
        if (unstableTemporal && stableSalience) {
            contradictionZones.push({
                zone_type: 'temporal_salience_mismatch',
                description: 'Temporal instability with stable salience — time-based signals contradict salience signals',
                severity: 'medium',
                layers: ['temporal', 'salience']
            });
        }
    }

    assessment.contradiction_zones = contradictionZones;

    // === FRAGMENTATION SIGNALS ===

    const fragmentationSignals = [];

    // Multiple fragmented layers
    if (assessment.fragmented_layers.length >= 2) {
        fragmentationSignals.push({
            signal_type: 'multi_layer_fragmentation',
            fragmented_count: assessment.fragmented_layers.length,
            description: `${assessment.fragmented_layers.length} layers showing fragmentation — environmental cognitive state is incoherent`,
            severity: assessment.fragmented_layers.length >= 3 ? 'high' : 'medium'
        });
    }

    // High contradiction density
    if (contradictionZones.length >= 2) {
        const highSeverityCount = contradictionZones.filter(z => z.severity === 'high').length;
        fragmentationSignals.push({
            signal_type: 'contradiction_concentration',
            contradiction_count: contradictionZones.length,
            high_severity_count: highSeverityCount,
            description: `${contradictionZones.length} contradiction zones detected — fragmentation risk elevated`,
            severity: highSeverityCount >= 2 ? 'high' : 'medium'
        });
    }

    // Attention saturation fragmentation
    if (attentionRecord?.capacity_assessment?.overload_indicator) {
        fragmentationSignals.push({
            signal_type: 'attention_overload_fragmentation',
            description: 'Attention capacity overloaded — fragmentation signal',
            severity: 'high'
        });
    }

    // Coherence pressure computation
    assessment.coherence_pressures = computeCoherencePressures(assessment, pressureMapping, salienceRecord, attentionRecord, contextualRelevance);

    // === COHERENCE STATE DETERMINATION ===

    const contradictionPenalty = Math.min(contradictionZones.length * 0.1, 0.4);
    const fragmentationPenalty = assessment.fragmented_layers.length * 0.1;
    const adjustedCoherenceScore = Math.max(0, assessment.coherence_score - contradictionPenalty - fragmentationPenalty);

    assessment.coherence_strength = Math.round(adjustedCoherenceScore * 100) / 100;

    // Determine coherence state
    if (adjustedCoherenceScore >= 0.7 && contradictionZones.length <= 1 && assessment.fragmented_layers.length <= 1) {
        assessment.coherence_state = 'COHERENT';
    } else if (adjustedCoherenceScore >= 0.5 && contradictionZones.length <= 2) {
        assessment.coherence_state = 'TENSIONED';
    } else if (adjustedCoherenceScore >= 0.3 || contradictionZones.length >= 3) {
        assessment.coherence_state = 'FRAGMENTED';
    } else {
        assessment.coherence_state = 'DISSONANT';
    }

    return assessment;
}

function computeCoherencePressures(assessment, pressureMapping, salienceRecord, attentionRecord, contextualRelevance) {
    const pressures = [];

    // Pressure from fragmented layers
    if (assessment.fragmented_layers.length > 0) {
        pressures.push({
            pressure_type: 'layer_fragmentation',
            intensity: assessment.fragmented_layers.length * 0.2,
            description: `Fragmentation pressure from ${assessment.fragmented_layers.length} incoherent layers`,
            source_layers: assessment.fragmented_layers
        });
    }

    // Pressure from contradictions
    if (assessment.contradiction_zones.length > 0) {
        const highSevCount = assessment.contradiction_zones.filter(z => z.severity === 'high').length;
        pressures.push({
            pressure_type: 'contradiction_pressure',
            intensity: assessment.contradiction_zones.length * 0.15 + highSevCount * 0.1,
            description: `Contradiction pressure: ${assessment.contradiction_zones.length} zones, ${highSevCount} high-severity`,
            zones: assessment.contradiction_zones.map(z => z.zone_type)
        });
    }

    // Pressure from competing attention
    if (attentionRecord) {
        const competitionIntensity = attentionRecord.attention_competition?.competition_intensity || 0;
        if (competitionIntensity >= 0.7) {
            pressures.push({
                pressure_type: 'attention_competition',
                intensity: competitionIntensity * 0.3,
                description: `Attention competition pressure: ${Math.round(competitionIntensity * 100)}% intensity`,
                source_layers: ['attention']
            });
        }
    }

    // Pressure from contextual instability
    if (contextualRelevance) {
        const driftProfile = contextualRelevance.contextual_drift?.profile;
        if (driftProfile === 'FRAGMENTING' || driftProfile === 'OSCILLATING') {
            pressures.push({
                pressure_type: 'contextual_instability',
                intensity: 0.3,
                description: `Contextual drift instability: ${driftProfile}`,
                source_layers: ['contextual']
            });
        }
    }

    // Pressure from unresolved pressure accumulation
    if (pressureMapping) {
        const unresolvedCount = pressureMapping.unresolved_pressure_count || 0;
        if (unresolvedCount >= 5) {
            pressures.push({
                pressure_type: 'unresolved_pressure_accumulation',
                intensity: Math.min(unresolvedCount * 0.03, 0.4),
                description: `${unresolvedCount} unresolved pressure items accumulating`,
                source_layers: ['pressure']
            });
        }
    }

    return pressures;
}

// === COHERENCE DRIFT TRACKING ===

function trackCoherenceDrift(coherenceHistory) {
    if (!coherenceHistory || coherenceHistory.length < 2) {
        return {
            profile: 'INDETERMINATE',
            description: DRIFT_PROFILES.INDETERMINATE.description,
            interpretation: DRIFT_PROFILES.INDETERMINATE.interpretation,
            drift_strength: 0,
            confidence: 'low'
        };
    }

    // Map coherence states to numeric values
    const stateMap = { 'COHERENT': 4, 'TENSIONED': 3, 'FRAGMENTED': 2, 'DISSONANT': 1 };
    const stateHistory = coherenceHistory.map(c => stateMap[c.coherence_state] || 2);

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

    // Check for recovering pattern (fragmented → improving)
    let recovering = false;
    if (stateHistory[0] <= 2 && stateHistory[stateHistory.length - 1] >= 3 && delta > 0.5) {
        recovering = true;
    }

    let profile;
    if (recovering) {
        profile = 'RECOVERING';
    } else if (oscillationCount >= 2 && oscillationCount >= stateHistory.length * 0.3) {
        profile = 'OSCILLATING';
    } else if (variance >= 1.5 && Math.abs(delta) < 0.5 && oscillationCount >= 1) {
        profile = 'FRAGMENTING';
    } else if (delta > 0.8 && variance < 1.0) {
        profile = 'STRENGTHENING';
    } else if (delta < -0.8 && variance < 1.0) {
        profile = 'WEAKENING';
    } else if (Math.abs(delta) <= 0.5 && variance < 1.0) {
        profile = 'STABILIZING';
    } else {
        profile = 'INDETERMINATE';
    }

    const driftProfile = DRIFT_PROFILES[profile] || DRIFT_PROFILES.INDETERMINATE;

    return {
        profile,
        description: driftProfile.description,
        interpretation: driftProfile.interpretation,
        drift_strength: Math.round(Math.abs(delta) * 100) / 100,
        confidence: coherenceHistory.length >= 4 ? 'high' : coherenceHistory.length >= 2 ? 'medium' : 'low',
        coherence_state_history: stateHistory,
        oscillation_count: oscillationCount
    };
}

// === PERSISTENCE TRACKING ===

function trackCoherencePersistence(assessment, history) {
    if (!history || history.length === 0) {
        return {
            coherent_snapshots: assessment.coherence_state === 'COHERENT' ? 1 : 0,
            fragmented_snapshots: ['FRAGMENTED', 'DISSONANT'].includes(assessment.coherence_state) ? 1 : 0,
            persistent_contradiction_zones: assessment.contradiction_zones?.length || 0,
            coherence_recovery_count: 0,
            new_contradiction_zones: assessment.contradiction_zones?.length || 0,
            resolved_contradiction_zones: 0
        };
    }

    const prevSnapshot = history[history.length - 1];
    const prevZones = new Set((prevSnapshot?.contradiction_zones || []).map(z => z.zone_type));
    const currZones = new Set((assessment.contradiction_zones || []).map(z => z.zone_type));

    // Persistent contradictions (in both current and previous)
    const persistentZones = [...prevZones].filter(z => currZones.has(z));

    // New contradictions
    const newZones = [...currZones].filter(z => !prevZones.has(z));

    // Resolved contradictions (in previous but not current)
    const resolvedZones = [...prevZones].filter(z => !currZones.has(z));

    // Coherent snapshots count
    const coherentCount = history.filter(h => h.coherence_state === 'COHERENT').length +
        (assessment.coherence_state === 'COHERENT' ? 1 : 0);

    // Fragmented snapshots count
    const fragmentedCount = history.filter(h => ['FRAGMENTED', 'DISSONANT'].includes(h.coherence_state)).length +
        (['FRAGMENTED', 'DISSONANT'].includes(assessment.coherence_state) ? 1 : 0);

    return {
        coherent_snapshots: coherentCount,
        fragmented_snapshots: fragmentedCount,
        persistent_contradiction_zones: persistentZones.length,
        coherence_recovery_count: persistentZones.length > 0 && !['FRAGMENTED', 'DISSONANT'].includes(assessment.coherence_state) ? 1 : 0,
        new_contradiction_zones: newZones.length,
        resolved_contradiction_zones: resolvedZones.length,
        persistent_zone_types: persistentZones
    };
}

// === UNCERTAINTY BOUNDARIES ===

function generateUncertaintyBoundaries(assessment, coherenceHistory) {
    const boundaries = [];

    // Insufficient history
    if (!coherenceHistory || coherenceHistory.length < 3) {
        boundaries.push({
            factor: 'insufficient_coherence_history',
            impact: 'Limited coherence history — drift classification and persistence tracking may be unreliable',
            confidence_level: 'low'
        });
    }

    // No baseline coherence comparison
    if (coherenceHistory && coherenceHistory.length < 2) {
        boundaries.push({
            factor: 'no_baseline_comparison',
            impact: 'Cannot determine coherence drift without at least 2 historical snapshots',
            confidence_level: 'low'
        });
    }

    // High fragmentation without contradiction
    if (assessment.fragmented_layers.length >= 2 && assessment.contradiction_zones.length === 0) {
        boundaries.push({
            factor: 'fragmentation_without_contradiction',
            impact: 'Multiple layers fragmented but no contradictions detected — fragmentation may be transient or misdetected',
            confidence_level: 'medium'
        });
    }

    // No aligned layers
    if (assessment.aligned_layers.length === 0 && assessment.fragmented_layers.length >= 2) {
        boundaries.push({
            factor: 'total_alignment_failure',
            impact: 'No layers aligned and multiple layers fragmented — coherence assessment may be unreliable',
            confidence_level: 'medium'
        });
    }

    // New contradictions emerging
    if (assessment.contradiction_zones?.some(z => z.severity === 'high')) {
        const prevZones = coherenceHistory?.[coherenceHistory.length - 1]?.contradiction_zones || [];
        const prevHighSev = prevZones.filter(z => z.severity === 'high').length;
        const currHighSev = assessment.contradiction_zones.filter(z => z.severity === 'high').length;
        if (currHighSev > prevHighSev) {
            boundaries.push({
                factor: 'emerging_high_severity_contradictions',
                impact: 'High-severity contradictions increasing — coherence may be degrading',
                confidence_level: 'medium'
            });
        }
    }

    // Dissonant state
    if (assessment.coherence_state === 'DISSONANT') {
        boundaries.push({
            factor: 'dissonant_coherence_state',
            impact: 'Coherence state is DISSONANT — environmental cognitive landscape is severely incoherent',
            confidence_level: 'high'
        });
    }

    if (boundaries.length === 0) {
        boundaries.push({
            factor: 'bounded_observation_window',
            impact: 'All coherence observations bounded by current snapshot window — future observations may alter classification',
            confidence_level: 'low'
        });
    }

    return boundaries;
}

// === COHERENCE MEMORY RETENTION ===

function loadCoherenceHistory() {
    try {
        if (!fs.existsSync(COHERENCE_HISTORY_FILE)) return [];
        const lines = fs.readFileSync(COHERENCE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
        return lines.map(line => {
            try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
    } catch {
        return [];
    }
}

function saveCoherenceSnapshot(coherenceRecord) {
    // Save current coherence
    fs.writeFileSync(COHERENCE_FILE, JSON.stringify(coherenceRecord, null, 2));

    // Append to history (append-only)
    const historyLine = JSON.stringify(coherenceRecord) + '\n';
    fs.appendFileSync(COHERENCE_HISTORY_FILE, historyLine);

    // Enforce bounded memory — keep last MAX_HISTORY entries
    const history = loadCoherenceHistory();
    if (history.length > MAX_HISTORY) {
        const trimmed = history.slice(-MAX_HISTORY);
        fs.writeFileSync(COHERENCE_HISTORY_FILE, trimmed.map(h => JSON.stringify(h)).join('\n') + '\n');
    }

    // Audit log
    const auditEntry = {
        timestamp: new Date().toISOString(),
        phase: 'MCAI-5E',
        audit_action: 'cognitive_coherence_snapshot_generated',
        coherence_state: coherenceRecord.coherence_state,
        coherence_strength: coherenceRecord.coherence_strength,
        aligned_layer_count: coherenceRecord.aligned_layers?.length || 0,
        fragmented_layer_count: coherenceRecord.fragmented_layers?.length || 0,
        contradiction_zone_count: coherenceRecord.contradiction_zones?.length || 0,
        shadow_only: true
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === MAIN COHERENCE RUNNER ===

function runCognitiveCoherence(context) {
    const { pressureMapping, salienceRecord, attentionRecord, contextualRelevance, temporalContext, coherenceHistory = [] } = context;

    // Step 1: Compute cognitive coherence
    const assessment = computeCognitiveCoherence(context);

    // Step 2: Track coherence drift
    const coherenceDrift = trackCoherenceDrift(coherenceHistory);

    // Step 3: Track persistence
    const persistence = trackCoherencePersistence(assessment, coherenceHistory);

    // Step 4: Generate uncertainty boundaries
    const uncertaintyBoundaries = generateUncertaintyBoundaries(assessment, coherenceHistory);

    // Build complete coherence record
    const coherenceRecord = {
        coherence_state: assessment.coherence_state,
        coherence_strength: assessment.coherence_strength,
        aligned_layers: assessment.aligned_layers,
        fragmented_layers: assessment.fragmented_layers,
        contradiction_zones: assessment.contradiction_zones,
        coherence_pressures: assessment.coherence_pressures,
        layer_alignments: assessment.layer_alignments,
        fragmentation_signals: assessment.fragmentation_signals,
        coherence_drift_profile: coherenceDrift,
        persistence_summary: persistence,
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_consistency_summary: generateEnvironmentalSummary(assessment),
        generated_at: new Date().toISOString(),
        shadow_only: true
    };

    // Step 5: Save snapshot
    saveCoherenceSnapshot(coherenceRecord);

    return coherenceRecord;
}

function generateEnvironmentalSummary(assessment) {
    const alignedCount = assessment.aligned_layers?.length || 0;
    const fragmentedCount = assessment.fragmented_layers?.length || 0;
    const contradictionCount = assessment.contradiction_zones?.length || 0;
    const state = assessment.coherence_state;

    let summary;
    if (state === 'COHERENT') {
        summary = 'Environmental cognitive landscape is coherent. All observed layers align consistently. No significant contradictions or fragmentation detected.';
    } else if (state === 'TENSIONED') {
        summary = `Environmental cognitive landscape shows tension. ${alignedCount} aligned layers and ${fragmentedCount} fragmented layers. ${contradictionCount} contradiction zones present but manageable.`;
    } else if (state === 'FRAGMENTED') {
        summary = `Environmental cognitive landscape is fragmented. ${fragmentedCount} layers misaligned, ${contradictionCount} contradiction zones, fragmentation signals active.`;
    } else {
        summary = `Environmental cognitive landscape exhibits severe dissonance. ${contradictionCount} high-severity contradictions, ${fragmentedCount} fragmented layers, critical incoherence across all cognitive dimensions.`;
    }

    return {
        summary,
        aligned_layer_count: alignedCount,
        fragmented_layer_count: fragmentedCount,
        contradiction_zone_count: contradictionCount,
        coherence_state: state
    };
}

// === EXPORTS ===

module.exports = {
    computeCognitiveCoherence,
    trackCoherenceDrift,
    trackCoherencePersistence,
    runCognitiveCoherence,
    loadCoherenceHistory,
    COHERENCE_STATES,
    DRIFT_PROFILES,
    MAX_HISTORY
};