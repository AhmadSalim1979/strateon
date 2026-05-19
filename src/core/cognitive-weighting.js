/**
 * Cognitive Weighting Layer — MCAI Phase 5G
 * SHADOW-ONLY: Bounded observational cognitive weighting without action authority.
 * 
 * This module models relative cognitive significance, environmental weighting,
 * competing signal gravity, and weighting stability.
 * 
 * It observes weighting — NOT what should be acted upon.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const WEIGHTING_FILE = path.join(STATE_DIR, 'cognitive-weighting.json');
const WEIGHTING_HISTORY_FILE = path.join(STATE_DIR, 'cognitive-weighting-history.jsonl');

const MAX_HISTORY = 30;

// === WEIGHTING STATES ===

const WEIGHTING_STATES = {
    LIGHT: {
        state: 'LIGHT',
        description: 'Cognitive weighting landscape is diffuse. No single signal dominates. Weight is distributed across multiple entities and conditions. Competition is low, influence is scattered.',
        requirements: 'Low concentration, no dominant signals, distributed weighting'
    },
    MODERATE: {
        state: 'MODERATE',
        description: 'Cognitive weighting landscape shows moderate concentration. Some signals carry more weight than others. Competition is present but not intense. Certain entities and conditions exert measurable influence.',
        requirements: 'Moderate concentration, some dominant signals, moderate competition'
    },
    HEAVY: {
        state: 'HEAVY',
        description: 'Cognitive weighting landscape shows significant concentration. Multiple signals carry substantial weight. Competition is intense. Certain entities and conditions dominate the cognitive landscape.',
        requirements: 'High concentration, multiple dominant signals, significant competition'
    },
    DOMINANT: {
        state: 'DOMINANT',
        description: 'Cognitive weighting landscape is heavily concentrated. A small number of signals carry overwhelming weight. Competition is extreme. Few entities or conditions dominate nearly all cognitive influence.',
        requirements: 'Very high concentration, dominant signals control weighting, extreme competition'
    }
};

// === WEIGHT DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: {
        profile: 'STRENGTHENING',
        description: 'Cognitive weighting is becoming more concentrated. Dominant signals are gaining weight. Concentration increasing.',
        interpretation: 'Weighting trend is toward dominance. Fewer signals carrying more influence.'
    },
    WEAKENING: {
        profile: 'WEAKENING',
        description: 'Cognitive weighting is becoming more diffuse. Dominant signals are losing weight. Distribution increasing.',
        interpretation: 'Weighting trend is toward diffusion. More signals sharing influence.'
    },
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Cognitive weighting is maintaining consistent levels. Concentration is stable. No significant drift in either direction.',
        interpretation: 'Weighting is in equilibrium. Stable concentration levels.'
    },
    OSCILLATING: {
        profile: 'OSCILLATING',
        description: 'Cognitive weighting is oscillating. Concentration alternating between high and low periods.',
        interpretation: 'Weighting trend is unstable. Repeated cycles of concentration and diffusion.'
    },
    FRAGMENTING: {
        profile: 'FRAGMENTING',
        description: 'Cognitive weighting is fragmenting. Previously concentrated weighting is breaking apart.',
        interpretation: 'Weighting landscape is breaking apart. New signals emerging, old dominant signals weakening.'
    },
    CONCENTRATING: {
        profile: 'CONCENTRATING',
        description: 'Cognitive weighting is concentrating into fewer, more powerful signals. Weight is consolidating.',
        interpretation: 'Weighting is consolidating. Dominant signals becoming more powerful.'
    },
    DISPERSING: {
        profile: 'DISPERSING',
        description: 'Cognitive weighting is dispersing across more signals. Weight is spreading out.',
        interpretation: 'Weighting is spreading. More signals gaining influence, dominant signals weakening.'
    },
    ADAPTING: {
        profile: 'ADAPTING',
        description: 'Cognitive weighting is adapting to changing conditions. New weighting patterns forming.',
        interpretation: 'Weighting is in transition. Environmental shifts reshaping influence distribution.'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Insufficient observation history to determine weighting drift direction.',
        interpretation: 'More observations needed before weighting drift can be classified.'
    }
};

// === SIGNAL WEIGHT COMPUTATION ===

/**
 * Compute raw signal weights from all upstream MCAI layers.
 * @param {Object} context - { pressureRecord, salienceRecord, attentionRecord, contextualRecord, coherenceRecord, stabilityRecord }
 * @returns {Object} Signal weights and classifications
 */
function computeSignalWeights(context) {
    const {
        pressureRecord,
        salienceRecord,
        attentionRecord,
        contextualRecord,
        coherenceRecord,
        stabilityRecord
    } = context;

    const signals = [];

    // === PRESSURE SIGNALS ===
    if (pressureRecord) {
        const unresolvedCount = pressureRecord.unresolved_pressure_count || 0;
        const chronicCount = pressureRecord.chronic_pressure_entities?.length || 0;
        const strainLevel = pressureRecord.strain_level || 'LOW';

        const strainMap = { 'LOW': 0.2, 'MODERATE': 0.4, 'HIGH': 0.7, 'SEVERE': 1.0 };
        const strainWeight = strainMap[strainLevel] || 0.2;

        signals.push({
            signal_type: 'pressure_intensity',
            source: 'pressure',
            raw_weight: unresolvedCount * 0.08 + chronicCount * 0.12 + strainWeight * 0.3,
            strain_level: strainLevel,
            unresolved_count: unresolvedCount,
            chronic_count: chronicCount,
            classification: unresolvedCount >= 10 ? 'DOMINANT' : unresolvedCount >= 5 ? 'HEAVY' : unresolvedCount >= 2 ? 'MODERATE' : 'LIGHT',
            stability_contribution: unresolvedCount > 8 ? 'destabilizing' : unresolvedCount > 3 ? 'straining' : 'stable'
        });
    }

    // === SALIENCE SIGNALS ===
    if (salienceRecord) {
        const entityCount = salienceRecord.salient_entities?.length || 0;
        const patternCount = salienceRecord.salient_patterns?.length || 0;
        const clusterCount = salienceRecord.clusters?.length || 0;
        const level = salienceRecord.salience_level || 'TRANSIENT';

        const levelMap = { 'PERSISTENT': 1.0, 'RECURRING': 0.7, 'EMERGING': 0.4, 'TRANSIENT': 0.2 };
        const levelWeight = levelMap[level] || 0.2;

        signals.push({
            signal_type: 'entity_salience',
            source: 'salience',
            raw_weight: entityCount * 0.15 + patternCount * 0.1 + levelWeight * 0.4,
            entity_count: entityCount,
            pattern_count: patternCount,
            salience_level: level,
            classification: entityCount >= 5 ? 'DOMINANT' : entityCount >= 3 ? 'HEAVY' : entityCount >= 1 ? 'MODERATE' : 'LIGHT',
            persistence: salienceRecord.temporal_profile?.current_profile === 'STRENGTHENING' ? 'strengthening' : salienceRecord.temporal_profile?.current_profile === 'WEAKENING' ? 'weakening' : 'stable'
        });
    }

    // === ATTENTION SIGNALS ===
    if (attentionRecord) {
        const activeCount = attentionRecord.active_attention_entities?.length || 0;
        const competition = attentionRecord.attention_competition?.competition_intensity || 0;
        const saturation = attentionRecord.capacity_assessment?.saturation_score || 0;
        const level = attentionRecord.attention_level || 'BACKGROUND';

        const levelMap = { 'DOMINANT': 1.0, 'ELEVATED': 0.75, 'ACTIVE': 0.5, 'BACKGROUND': 0.25 };
        const levelWeight = levelMap[level] || 0.25;

        signals.push({
            signal_type: 'attention_intensity',
            source: 'attention',
            raw_weight: activeCount * 0.12 + competition * 0.35 + saturation * 0.25 + levelWeight * 0.2,
            active_count: activeCount,
            competition: competition,
            saturation: saturation,
            attention_level: level,
            classification: saturation > 0.85 || level === 'DOMINANT' ? 'DOMINANT' : saturation > 0.6 || level === 'ELEVATED' ? 'HEAVY' : level === 'ACTIVE' ? 'MODERATE' : 'LIGHT',
            capacity_state: attentionRecord.capacity_assessment?.state || 'AVAILABLE'
        });
    }

    // === CONTEXTUAL SIGNALS ===
    if (contextualRecord) {
        const ampPatterns = contextualRecord.amplification_patterns?.length || 0;
        const suppPatterns = contextualRecord.suppression_patterns?.length || 0;
        const netScore = contextualRecord.contextual_pressure_relationships?.net_context_score || 0;
        const state = contextualRecord.contextual_state || 'INCIDENTAL';

        const stateMap = { 'CRITICAL_CONTEXT': 1.0, 'SIGNIFICANT': 0.75, 'CONTEXTUAL': 0.5, 'INCIDENTAL': 0.25 };
        const stateWeight = stateMap[state] || 0.25;

        signals.push({
            signal_type: 'contextual_relevance',
            source: 'contextual',
            raw_weight: ampPatterns * 0.1 + netScore * 0.08 + stateWeight * 0.35,
            amplification_count: ampPatterns,
            suppression_count: suppPatterns,
            net_context_score: netScore,
            contextual_state: state,
            classification: state === 'CRITICAL_CONTEXT' ? 'DOMINANT' : state === 'SIGNIFICANT' ? 'HEAVY' : state === 'CONTEXTUAL' ? 'MODERATE' : 'LIGHT',
            drift: contextualRecord.contextual_drift?.profile || 'INDETERMINATE'
        });
    }

    // === COHERENCE SIGNALS ===
    if (coherenceRecord) {
        const alignedCount = coherenceRecord.aligned_layers?.length || 0;
        const fragmentedCount = coherenceRecord.fragmented_layers?.length || 0;
        const contradictionCount = coherenceRecord.contradiction_zones?.length || 0;
        const strength = coherenceRecord.coherence_strength || 0.5;
        const state = coherenceRecord.coherence_state || 'COHERENT';

        signals.push({
            signal_type: 'coherence_influence',
            source: 'coherence',
            raw_weight: alignedCount * 0.08 + fragmentedCount * 0.15 + contradictionCount * 0.12 + (1 - strength) * 0.25,
            aligned_count: alignedCount,
            fragmented_count: fragmentedCount,
            contradiction_count: contradictionCount,
            coherence_strength: strength,
            coherence_state: state,
            classification: fragmentedCount >= 3 || contradictionCount >= 3 ? 'DOMINANT' : fragmentedCount >= 2 || contradictionCount >= 2 ? 'HEAVY' : fragmentedCount >= 1 ? 'MODERATE' : 'LIGHT',
            drift: coherenceRecord.coherence_drift_profile?.profile || 'INDETERMINATE'
        });
    }

    // === STABILITY SIGNALS ===
    if (stabilityRecord) {
        const destabPressureCount = stabilityRecord.destabilization_pressures?.length || 0;
        const persistenceZones = stabilityRecord.persistent_instability_zones?.length || 0;
        const resilience = stabilityRecord.resilience_assessment?.resilience_strength || 0.5;
        const state = stabilityRecord.stability_state || 'STABLE';

        const stateMap = { 'COLLAPSING': 1.0, 'UNSTABLE': 0.75, 'STRAINED': 0.5, 'STABLE': 0.2 };
        const stateWeight = stateMap[state] || 0.2;

        signals.push({
            signal_type: 'stability_influence',
            source: 'stability',
            raw_weight: destabPressureCount * 0.1 + persistenceZones * 0.15 + stateWeight * 0.3 + (1 - resilience) * 0.2,
            destab_pressure_count: destabPressureCount,
            persistence_zone_count: persistenceZones,
            resilience: resilience,
            stability_state: state,
            classification: state === 'COLLAPSING' || state === 'UNSTABLE' ? 'DOMINANT' : state === 'STRAINED' ? 'HEAVY' : 'MODERATE',
            drift: stabilityRecord.stability_drift_profile?.profile || 'INDETERMINATE'
        });
    }

    // === NORMALIZE WEIGHTS ===
    const maxRaw = Math.max(...signals.map(s => s.raw_weight), 0.01);
    for (const signal of signals) {
        signal.normalized_weight = signal.raw_weight / maxRaw;
        signal.weight_rank = 0;
    }

    // Rank signals
    signals.sort((a, b) => b.raw_weight - a.raw_weight);
    signals.forEach((s, i) => s.weight_rank = i + 1);

    return signals;
}

// === WEIGHT CLASSIFICATION ===

function classifyOverallWeighting(signals) {
    if (!signals || signals.length === 0) return { state: 'LIGHT', strength: 0, concentration_score: 0 };

    // Compute weighted average classification
    const classificationWeights = { 'DOMINANT': 4, 'HEAVY': 3, 'MODERATE': 2, 'LIGHT': 1 };
    let totalWeight = 0;
    let weightedSum = 0;

    for (const signal of signals) {
        const classWeight = classificationWeights[signal.classification] || 1;
        totalWeight += signal.normalized_weight;
        weightedSum += classWeight * signal.normalized_weight;
    }

    const avgClassification = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Compute concentration score
    const topSignals = signals.filter(s => s.weight_rank <= 3);
    const concentrationScore = topSignals.reduce((sum, s) => sum + s.normalized_weight, 0) / Math.max(signals.length, 1);

    let state;
    if (avgClassification >= 3.5 || concentrationScore >= 0.7) state = 'DOMINANT';
    else if (avgClassification >= 2.5 || concentrationScore >= 0.5) state = 'HEAVY';
    else if (avgClassification >= 1.5 || concentrationScore >= 0.3) state = 'MODERATE';
    else state = 'LIGHT';

    const strength = Math.min(1, avgClassification / 4 + concentrationScore * 0.5);

    return { state, strength: Math.round(strength * 100) / 100, concentration_score: Math.round(concentrationScore * 100) / 100 };
}

// === DOMINANT SIGNALS ===

function identifyDominantSignals(signals) {
    return signals
        .filter(s => s.classification === 'DOMINANT' || s.normalized_weight >= 0.7)
        .map(s => ({
            signal_type: s.signal_type,
            source: s.source,
            weight: Math.round(s.raw_weight * 100) / 100,
            normalized_weight: Math.round(s.normalized_weight * 100) / 100,
            rank: s.weight_rank,
            classification: s.classification
        }));
}

// === WEIGHTED ENTITIES ===

function computeWeightedEntities(context) {
    const { salienceRecord, attentionRecord, stabilityRecord } = context;
    const entityWeights = new Map();

    // Salience entities
    if (salienceRecord?.salient_entities) {
        for (const entity of salienceRecord.salient_entities) {
            const current = entityWeights.get(entity) || { entity_id: entity, sources: [], total_weight: 0 };
            current.sources.push('salience');
            current.total_weight += 0.4;
            entityWeights.set(entity, current);
        }
    }

    // Attention entities
    if (attentionRecord?.active_attention_entities) {
        for (const entity of attentionRecord.active_attention_entities) {
            const activationLevel = entity.activation_level || 'ACTIVE';
            const levelWeight = { 'DOMINANT': 0.9, 'ELEVATED': 0.7, 'ACTIVE': 0.5, 'BACKGROUND': 0.3 }[activationLevel] || 0.4;
            const current = entityWeights.get(entity.entity_id) || { entity_id: entity.entity_id, sources: [], total_weight: 0 };
            current.sources.push('attention');
            current.total_weight += levelWeight;
            entityWeights.set(entity.entity_id, current);
        }
    }

    // Stability entities (chronic pressure entities)
    if (stabilityRecord?.resilience_assessment) {
        // Add chronic entities from pressure mapping if available
    }

    // Convert to array and normalize
    const entries = Array.from(entityWeights.values());
    const maxWeight = Math.max(...entries.map(e => e.total_weight), 0.01);

    return entries
        .map(e => ({
            entity_id: e.entity_id,
            sources: e.sources,
            raw_weight: Math.round(e.total_weight * 100) / 100,
            normalized_weight: Math.round((e.total_weight / maxWeight) * 100) / 100
        }))
        .sort((a, b) => b.raw_weight - a.raw_weight);
}

// === WEIGHTING CLUSTERS ===

function identifyWeightingClusters(signals) {
    const clusters = [];

    // Cluster by source
    const bySource = {};
    for (const signal of signals) {
        if (!bySource[signal.source]) bySource[signal.source] = [];
        bySource[signal.source].push(signal);
    }

    for (const [source, sourceSignals] of Object.entries(bySource)) {
        if (sourceSignals.length >= 2) {
            clusters.push({
                cluster_type: 'source_cluster',
                source: source,
                signal_count: sourceSignals.length,
                combined_weight: Math.round(sourceSignals.reduce((s, sig) => s + sig.raw_weight, 0) * 100) / 100,
                signals: sourceSignals.map(s => s.signal_type),
                classification: sourceSignals[0].classification
            });
        }
    }

    // Cluster by classification
    const byClassification = {};
    for (const signal of signals) {
        if (!byClassification[signal.classification]) byClassification[signal.classification] = [];
        byClassification[signal.classification].push(signal);
    }

    for (const [classification, classSignals] of Object.entries(byClassification)) {
        if (classSignals.length >= 2) {
            clusters.push({
                cluster_type: 'classification_cluster',
                classification: classification,
                signal_count: classSignals.length,
                combined_weight: Math.round(classSignals.reduce((s, sig) => s + sig.raw_weight, 0) * 100) / 100,
                signals: classSignals.map(s => s.signal_type),
                sources: [...new Set(classSignals.map(s => s.source))]
            });
        }
    }

    return clusters;
}

// === WEIGHTING PRESSURES ===

function detectWeightingPressures(signals, weightingHistory = []) {
    const pressures = [];

    // Concentration pressure
    const dominantSignals = signals.filter(s => s.classification === 'DOMINANT');
    if (dominantSignals.length >= 2) {
        pressures.push({
            pressure_type: 'dominant_signal_competition',
            intensity: dominantSignals.length * 0.15,
            description: `${dominantSignals.length} dominant signals competing for cognitive weight`,
            severity: dominantSignals.length >= 3 ? 'high' : 'medium',
            signals: dominantSignals.map(s => s.signal_type)
        });
    }

    // Distributed weighting pressure
    const lightSignals = signals.filter(s => s.classification === 'LIGHT');
    if (lightSignals.length >= 4 && signals.length >= 6) {
        pressures.push({
            pressure_type: 'distributed_weighting',
            intensity: lightSignals.length * 0.05,
            description: `Weight is highly distributed across ${lightSignals.length} signals — no clear dominant`,
            severity: 'low',
            signal_count: lightSignals.length
        });
    }

    // Weight volatility detection
    if (weightingHistory.length >= 2) {
        const prevSignals = weightingHistory[weightingHistory.length - 1]?.dominant_signals || [];
        for (const currentSignal of signals.slice(0, 3)) {
            const prevSignal = prevSignals.find(p => p.signal_type === currentSignal.signal_type);
            if (prevSignal && Math.abs(currentSignal.normalized_weight - prevSignal.normalized_weight) > 0.3) {
                pressures.push({
                    pressure_type: 'weight_volatility',
                    intensity: Math.abs(currentSignal.normalized_weight - prevSignal.normalized_weight),
                    description: `Signal ${currentSignal.signal_type} shows significant weight change`,
                    severity: 'medium',
                    signal: currentSignal.signal_type,
                    change: Math.round((currentSignal.normalized_weight - prevSignal.normalized_weight) * 100) / 100
                });
            }
        }
    }

    return pressures;
}

// === ENVIRONMENTAL WEIGHT DENSITY ===

function computeEnvironmentalWeightDensity(signals) {
    const signalCount = signals.length;
    const dominantCount = signals.filter(s => s.classification === 'DOMINANT').length;
    const heavyCount = signals.filter(s => s.classification === 'HEAVY').length;

    const totalNormalizedWeight = signals.reduce((s, sig) => s + sig.normalized_weight, 0);
    const averageWeight = signalCount > 0 ? totalNormalizedWeight / signalCount : 0;

    // Density: how many significant signals are concentrated in the environment
    const densityScore = (dominantCount * 0.5 + heavyCount * 0.3) / Math.max(signalCount, 1);

    return {
        signal_count: signalCount,
        dominant_count: dominantCount,
        heavy_count: heavyCount,
        density_score: Math.round(densityScore * 100) / 100,
        average_signal_weight: Math.round(averageWeight * 100) / 100,
        density_classification: densityScore >= 0.6 ? 'HIGH' : densityScore >= 0.3 ? 'MODERATE' : 'LOW'
    };
}

// === WEIGHTING DISTRIBUTION ===

function analyzeWeightingDistribution(signals) {
    if (!signals || signals.length === 0) {
        return { type: 'EMPTY', gini_coefficient: 0, top_heavy: false };
    }

    const sortedWeights = signals.map(s => s.normalized_weight).sort((a, b) => b - a);

    // Compute Gini coefficient (0 = perfectly equal, 1 = maximally unequal)
    const n = sortedWeights.length;
    if (n === 1) {
        return { type: 'UNIFORM', gini_coefficient: 0, top_heavy: true };
    }

    let sumDiff = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            sumDiff += Math.abs(sortedWeights[i] - sortedWeights[j]);
        }
    }
    const mean = sortedWeights.reduce((s, v) => s + v, 0) / n;
    const gini = sumDiff / (2 * n * n * mean);

    // Top-heavy: top 20% of signals carry > 60% of total weight
    const topPercent = Math.ceil(n * 0.2);
    const topWeight = sortedWeights.slice(0, topPercent).reduce((s, v) => s + v, 0);
    const totalWeight = sortedWeights.reduce((s, v) => s + v, 0);
    const topHeavy = topWeight / totalWeight > 0.6;

    let type;
    if (gini < 0.2) type = 'UNIFORM';
    else if (gini < 0.4) type = 'BALANCED';
    else if (gini < 0.6) type = 'CONCENTRATED';
    else if (gini < 0.8) type = 'TOP_HEAVY';
    else type = 'EXTREMELY_CONCENTRATED';

    return {
        type,
        gini_coefficient: Math.round(gini * 100) / 100,
        top_heavy: topHeavy,
        top_20_pct_share: Math.round((topWeight / totalWeight) * 100) / 100,
        distribution_summary: `${type} — top ${topPercent} signals carry ${Math.round(topWeight / totalWeight * 100)}% of total weight`
    };
}

// === WEIGHTING COMPETITION ===

function analyzeWeightingCompetition(signals) {
    const dominantSignals = signals.filter(s => s.classification === 'DOMINANT' || s.normalized_weight >= 0.7);

    const competition = {
        dominant_signal_count: dominantSignals.length,
        competing_pairs: [],
        overlap_regions: [],
        fragmentation_index: 0
    };

    // Identify competing pairs (similar weight, different source)
    for (let i = 0; i < dominantSignals.length; i++) {
        for (let j = i + 1; j < dominantSignals.length; j++) {
            const s1 = dominantSignals[i];
            const s2 = dominantSignals[j];
            const weightDiff = Math.abs(s1.normalized_weight - s2.normalized_weight);
            if (weightDiff < 0.2) {
                competition.competing_pairs.push({
                    signal_1: s1.signal_type,
                    signal_2: s2.signal_type,
                    weight_diff: Math.round(weightDiff * 100) / 100,
                    source_1: s1.source,
                    source_2: s2.source
                });
            }
        }
    }

    // Compute fragmentation index (how fragmented is the weighting landscape)
    const classificationCounts = { DOMINANT: 0, HEAVY: 0, MODERATE: 0, LIGHT: 0 };
    for (const signal of signals) {
        classificationCounts[signal.classification]++;
    }

    // Fragmentation when all classifications are present and dominant/light both present
    competition.fragmentation_index = Math.min(1, (
        (classificationCounts.DOMINANT > 0 && classificationCounts.LIGHT > 0 ? 0.3 : 0) +
        (Math.abs(classificationCounts.DOMINANT - classificationCounts.LIGHT) <= 1 ? 0.2 : 0) +
        (classificationCounts.HEAVY >= 2 ? 0.1 : 0) +
        (classificationCounts.MODERATE >= 3 ? 0.1 : 0)
    ));

    return competition;
}

// === WEIGHT STABILITY ASSESSMENT ===

function assessWeightStability(signals, weightingHistory = []) {
    const stability = {
        consistency_score: 0.5,
        volatility_score: 0,
        continuity_score: 0.5,
        persistence_score: 0.5,
        overall_stability: 'MODERATE'
    };

    if (weightingHistory.length === 0) {
        stability.overall_stability = 'INDETERMINATE';
        return stability;
    }

    // Consistency: how similar are current weights to history
    const lastRecord = weightingHistory[weightingHistory.length - 1];
    if (lastRecord?.dominant_signals) {
        let matchCount = 0;
        for (const currentSignal of signals.slice(0, 5)) {
            const prevSignal = lastRecord.dominant_signals.find(p => p.signal_type === currentSignal.signal_type);
            if (prevSignal && Math.abs(currentSignal.normalized_weight - prevSignal.normalized_weight) < 0.15) {
                matchCount++;
            }
        }
        stability.consistency_score = matchCount / Math.max(signals.length, 5);
    }

    // Volatility: how much do weights change
    if (weightingHistory.length >= 2) {
        let totalChange = 0;
        let comparisons = 0;
        for (let i = weightingHistory.length - 1; i >= Math.max(0, weightingHistory.length - 3); i--) {
            const prev = weightingHistory[i];
            if (prev?.dominant_signals && signals.length > 0) {
                for (const currentSignal of signals.slice(0, 3)) {
                    const prevSignal = prev.dominant_signals.find(p => p.signal_type === currentSignal.signal_type);
                    if (prevSignal) {
                        totalChange += Math.abs(currentSignal.normalized_weight - prevSignal.normalized_weight);
                        comparisons++;
                    }
                }
            }
        }
        stability.volatility_score = comparisons > 0 ? Math.min(1, totalChange / comparisons) : 0.5;
    }

    // Continuity: are dominant signals persistent across history
    if (weightingHistory.length >= 3) {
        const dominantSignalTypes = signals.filter(s => s.classification === 'DOMINANT' || s.normalized_weight >= 0.7).map(s => s.signal_type);
        let continuityMatches = 0;
        for (const signalType of dominantSignalTypes) {
            const inHistory = weightingHistory.slice(-3).filter(h =>
                h.dominant_signals?.some(s => s.signal_type === signalType)
            ).length;
            if (inHistory >= 2) continuityMatches++;
        }
        stability.continuity_score = dominantSignalTypes.length > 0 ? continuityMatches / dominantSignalTypes.length : 0.5;
    }

    // Persistence score
    stability.persistence_score = (stability.consistency_score + (1 - stability.volatility_score) + stability.continuity_score) / 3;

    // Overall stability
    if (stability.persistence_score >= 0.7) stability.overall_stability = 'STABLE';
    else if (stability.persistence_score >= 0.4) stability.overall_stability = 'MODERATE';
    else stability.overall_stability = 'VOLATILE';

    return stability;
}

// === WEIGHT DRIFT TRACKING ===

function trackWeightDrift(weightingHistory) {
    if (!weightingHistory || weightingHistory.length < 2) {
        return {
            profile: 'INDETERMINATE',
            description: DRIFT_PROFILES.INDETERMINATE.description,
            interpretation: DRIFT_PROFILES.INDETERMINATE.interpretation,
            drift_strength: 0,
            confidence: 'low'
        };
    }

    // Extract concentration scores from history
    const concentrationScores = weightingHistory.map(h => h.weighting_distribution?.gini_coefficient || 0);
    const stateMap = { 'LIGHT': 1, 'MODERATE': 2, 'HEAVY': 3, 'DOMINANT': 4 };
    const stateScores = weightingHistory.map(h => stateMap[h.weighting_state] || 2);

    // Compare first half vs second half
    const midPoint = Math.floor(stateScores.length / 2);
    const firstHalf = stateScores.slice(0, midPoint);
    const secondHalf = stateScores.slice(midPoint);
    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / Math.max(firstHalf.length, 1);
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / Math.max(secondHalf.length, 1);
    const delta = secondAvg - firstAvg;

    // Concentration change
    const concFirstAvg = concentrationScores.slice(0, midPoint).reduce((s, v) => s + v, 0) / Math.max(midPoint, 1);
    const concSecondAvg = concentrationScores.slice(midPoint).reduce((s, v) => s + v, 0) / Math.max(concentrationScores.length - midPoint, 1);
    const concDelta = concSecondAvg - concFirstAvg;

    // Variance
    const mean = stateScores.reduce((s, v) => s + v, 0) / stateScores.length;
    const variance = stateScores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / stateScores.length;

    // Oscillation detection
    let oscillationCount = 0;
    for (let i = 1; i < stateScores.length; i++) {
        if ((stateScores[i] >= 3 && stateScores[i - 1] <= 2) || (stateScores[i] <= 2 && stateScores[i - 1] >= 3)) {
            oscillationCount++;
        }
    }

    // Recovering pattern
    const recovering = stateScores[0] <= 2 && stateScores[stateScores.length - 1] >= 3 && delta > 0.5;

    let profile;
    if (recovering) {
        profile = 'RECOVERING';
    } else if (oscillationCount >= 2 && oscillationCount >= stateScores.length * 0.3) {
        profile = 'OSCILLATING';
    } else if (concDelta > 0.15 && delta > 0.3) {
        profile = 'CONCENTRATING';
    } else if (concDelta < -0.15 && delta < -0.3) {
        profile = 'DISPERSING';
    } else if (delta > 0.8 && variance < 1.5) {
        profile = 'STRENGTHENING';
    } else if (delta < -0.8 && variance < 1.5) {
        profile = 'WEAKENING';
    } else if (Math.abs(delta) < 0.3 && variance < 0.5 && oscillationCount < 2) {
        profile = 'STABILIZING';
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
        concentration_drift: Math.round(concDelta * 100) / 100,
        confidence: weightingHistory.length >= 4 ? 'high' : weightingHistory.length >= 2 ? 'medium' : 'low',
        oscillation_count: oscillationCount
    };
}

// === PERSISTENCE SUMMARY ===

function computePersistenceSummary(signals, weightingHistory = []) {
    const summary = {
        persistent_heavy_signals: [],
        recurring_dominant_conditions: [],
        weakening_signals: [],
        strengthening_signals: [],
        stable_weighting_regions: []
    };

    if (weightingHistory.length === 0) return summary;

    // Identify persistent heavy signals
    const signalAppearances = {};
    for (const record of weightingHistory.slice(-5)) {
        if (record.dominant_signals) {
            for (const signal of record.dominant_signals) {
                if (!signalAppearances[signal.signal_type]) {
                    signalAppearances[signal.signal_type] = { count: 0, total_weight: 0 };
                }
                signalAppearances[signal.signal_type].count++;
                signalAppearances[signal.signal_type].total_weight += signal.normalized_weight || 0;
            }
        }
    }

    for (const [signalType, data] of Object.entries(signalAppearances)) {
        if (data.count >= 3) {
            summary.persistent_heavy_signals.push({
                signal_type: signalType,
                appearances: data.count,
                average_weight: Math.round((data.total_weight / data.count) * 100) / 100
            });
        }
    }

    // Compare first and last snapshots for strengthening/weakening
    if (weightingHistory.length >= 2) {
        const first = weightingHistory[0];
        const last = weightingHistory[weightingHistory.length - 1];

        if (first?.dominant_signals && last?.dominant_signals) {
            for (const currentSignal of signals.slice(0, 5)) {
                const firstSignal = first.dominant_signals.find(s => s.signal_type === currentSignal.signal_type);
                const lastSignal = last.dominant_signals.find(s => s.signal_type === currentSignal.signal_type);

                if (firstSignal && lastSignal) {
                    const change = currentSignal.normalized_weight - lastSignal.normalized_weight;
                    if (change > 0.15) {
                        summary.strengthening_signals.push({ signal_type: currentSignal.signal_type, change: Math.round(change * 100) / 100 });
                    } else if (change < -0.15) {
                        summary.weakening_signals.push({ signal_type: currentSignal.signal_type, change: Math.round(change * 100) / 100 });
                    }
                }
            }
        }
    }

    return summary;
}

// === UNCERTAINTY BOUNDARIES ===

function generateUncertaintyBoundaries(signals, weightingHistory, overallClassification) {
    const boundaries = [];

    if (!weightingHistory || weightingHistory.length < 3) {
        boundaries.push({
            factor: 'insufficient_weighting_history',
            impact: 'Limited weighting history — drift classification and stability assessment may be unreliable',
            confidence_level: 'low'
        });
    }

    if (overallClassification.state === 'DOMINANT' && weightingHistory.length < 5) {
        boundaries.push({
            factor: 'dominant_classification_uncertain',
            impact: 'DOMINANT weighting detected but limited history — dominance may be transient',
            confidence_level: 'medium'
        });
    }

    if (signals.some(s => s.normalized_weight > 0.9) && weightingHistory.length < 3) {
        boundaries.push({
            factor: 'extreme_weight_concentration',
            impact: 'Extreme weight concentration detected without sufficient history to confirm persistence',
            confidence_level: 'medium'
        });
    }

    if (signals.filter(s => s.classification === 'DOMINANT').length >= 3) {
        boundaries.push({
            factor: 'multiple_dominant_signals',
            impact: 'Multiple dominant signals competing — weighting may shift rapidly',
            confidence_level: 'medium'
        });
    }

    if (boundaries.length === 0) {
        boundaries.push({
            factor: 'bounded_observation_window',
            impact: 'All weighting observations bounded by current window — future conditions may alter weighting distribution',
            confidence_level: 'low'
        });
    }

    return boundaries;
}

// === ENVIRONMENTAL WEIGHT SUMMARY ===

function generateEnvironmentalWeightSummary(classification, signals, competition, density) {
    const dominantCount = signals.filter(s => s.classification === 'DOMINANT').length;
    const heavyCount = signals.filter(s => s.classification === 'HEAVY').length;

    let summary;
    if (classification.state === 'DOMINANT') {
        summary = `Environmental cognitive weighting is heavily concentrated. ${dominantCount} dominant signals controlling ${Math.round(density.density_score * 100)}% of weight. ${competition.competing_pairs.length} competing pairs detected.`;
    } else if (classification.state === 'HEAVY') {
        summary = `Environmental cognitive weighting is significantly concentrated. ${heavyCount} heavy signals with ${dominantCount} dominant. Competition is moderate.`;
    } else if (classification.state === 'MODERATE') {
        summary = `Environmental cognitive weighting is moderately distributed. ${dominantCount + heavyCount} significant signals. Balance between concentration and diffusion.`;
    } else {
        summary = `Environmental cognitive weighting is diffuse. Weight is distributed across ${signals.length} signals. No single signal dominates.`;
    }

    return {
        summary,
        weighting_state: classification.state,
        concentration_score: classification.concentration_score,
        dominant_signal_count: dominantCount,
        heavy_signal_count: heavyCount,
        competition_intensity: competition.competing_pairs.length,
        density_classification: density.density_classification
    };
}

// === WEIGHTING MEMORY RETENTION ===

function loadWeightingHistory() {
    try {
        if (!fs.existsSync(WEIGHTING_HISTORY_FILE)) return [];
        const lines = fs.readFileSync(WEIGHTING_HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
        return lines.map(line => {
            try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
    } catch {
        return [];
    }
}

function saveWeightingSnapshot(weightingRecord) {
    // Save current weighting
    fs.writeFileSync(WEIGHTING_FILE, JSON.stringify(weightingRecord, null, 2));

    // Append to history (append-only)
    const historyLine = JSON.stringify(weightingRecord) + '\n';
    fs.appendFileSync(WEIGHTING_HISTORY_FILE, historyLine);

    // Enforce bounded memory
    const history = loadWeightingHistory();
    if (history.length > MAX_HISTORY) {
        const trimmed = history.slice(-MAX_HISTORY);
        fs.writeFileSync(WEIGHTING_HISTORY_FILE, trimmed.map(h => JSON.stringify(h)).join('\n') + '\n');
    }

    // Audit log
    const auditEntry = {
        timestamp: new Date().toISOString(),
        phase: 'MCAI-5G',
        audit_action: 'cognitive_weighting_snapshot_generated',
        weighting_state: weightingRecord.weighting_state,
        weighting_strength: weightingRecord.weighting_strength,
        dominant_signal_count: weightingRecord.dominant_signals?.length || 0,
        concentration_score: weightingRecord.weighting_distribution?.gini_coefficient || 0,
        shadow_only: true
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === MAIN WEIGHTING RUNNER ===

function runCognitiveWeighting(context) {
    const { pressureRecord, salienceRecord, attentionRecord, contextualRecord, coherenceRecord, stabilityRecord, weightingHistory = [] } = context;

    // Step 1: Compute signal weights from all upstream layers
    const signals = computeSignalWeights(context);

    // Step 2: Classify overall weighting
    const overallClassification = classifyOverallWeighting(signals);

    // Step 3: Identify dominant signals
    const dominantSignals = identifyDominantSignals(signals);

    // Step 4: Compute weighted entities
    const weightedEntities = computeWeightedEntities(context);

    // Step 5: Identify weighting clusters
    const weightingClusters = identifyWeightingClusters(signals);

    // Step 6: Detect weighting pressures
    const weightingPressures = detectWeightingPressures(signals, weightingHistory);

    // Step 7: Compute environmental weight density
    const density = computeEnvironmentalWeightDensity(signals);

    // Step 8: Analyze weighting distribution
    const distribution = analyzeWeightingDistribution(signals);

    // Step 9: Analyze weighting competition
    const competition = analyzeWeightingCompetition(signals);

    // Step 10: Assess weight stability
    const stabilityAssessment = assessWeightStability(signals, weightingHistory);

    // Step 11: Track weight drift
    const driftProfile = trackWeightDrift(weightingHistory);

    // Step 12: Compute persistence summary
    const persistenceSummary = computePersistenceSummary(signals, weightingHistory);

    // Step 13: Generate uncertainty boundaries
    const uncertaintyBoundaries = generateUncertaintyBoundaries(signals, weightingHistory, overallClassification);

    // Step 14: Generate environmental summary
    const envSummary = generateEnvironmentalWeightSummary(overallClassification, signals, competition, density);

    // Build complete weighting record
    const weightingRecord = {
        weighting_state: overallClassification.state,
        weighting_strength: overallClassification.strength,
        dominant_signals: dominantSignals,
        weighted_entities: weightedEntities,
        weighting_clusters: weightingClusters,
        weighting_pressures: weightingPressures,
        environmental_weight_density: density,
        weighting_distribution: distribution,
        weighting_competition: competition,
        weighting_stability_assessment: stabilityAssessment,
        weighting_drift_profile: driftProfile,
        persistence_summary: persistenceSummary,
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_weight_summary: envSummary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };

    // Step 15: Save snapshot
    saveWeightingSnapshot(weightingRecord);

    return weightingRecord;
}

// === EXPORTS ===

module.exports = {
    computeSignalWeights,
    classifyOverallWeighting,
    identifyDominantSignals,
    computeWeightedEntities,
    identifyWeightingClusters,
    detectWeightingPressures,
    computeEnvironmentalWeightDensity,
    analyzeWeightingDistribution,
    analyzeWeightingCompetition,
    assessWeightStability,
    trackWeightDrift,
    computePersistenceSummary,
    runCognitiveWeighting,
    loadWeightingHistory,
    WEIGHTING_STATES,
    DRIFT_PROFILES,
    MAX_HISTORY
};