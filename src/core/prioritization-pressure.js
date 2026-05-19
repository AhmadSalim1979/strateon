/**
 * Prioritization Pressure Formation Layer — MCAI Phase 6A
 * SHADOW-ONLY: Bounded observational prioritization pressure without action authority.
 * 
 * This module models competition for bounded cognitive focus, prioritization tension,
 * pressure convergence, cognitive bottleneck emergence, and focus saturation dynamics.
 * 
 * It observes prioritization pressure — NOT what should be prioritized.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const PRESSURE_FILE = path.join(STATE_DIR, 'prioritization-pressure.json');
const PRESSURE_HISTORY_FILE = path.join(STATE_DIR, 'prioritization-pressure-history.jsonl');

const MAX_HISTORY = 30;

// === PRESSURE STATES ===

const PRESSURE_STATES = {
    MINIMAL: {
        state: 'MINIMAL',
        description: 'Cognitive landscape shows minimal prioritization pressure. Focus is not contended. No significant competing regions or bottlenecks detected. Cognitive resources are available.',
        requirements: 'Low competing regions, no bottlenecks, high availability'
    },
    DEVELOPING: {
        state: 'DEVELOPING',
        description: 'Cognitive landscape shows developing prioritization pressure. Some competing regions emerging. Focus is moderately contended. Bottlenecks are not yet forming.',
        requirements: 'Moderate competition, some pressure regions, availability decreasing'
    },
    ELEVATED: {
        state: 'ELEVATED',
        description: 'Cognitive landscape shows significant prioritization pressure. Multiple competing regions detected. Focus is highly contended. Bottlenecks forming. Cognitive resources are strained.',
        requirements: 'High competition, multiple bottlenecks, strained resources'
    },
    SATURATED: {
        state: 'SATURATED',
        description: 'Cognitive landscape is saturated with prioritization pressure. Competing regions are overwhelming focus capacity. Bottlenecks are critical. Cognitive resources are overloaded. Competition is extreme.',
        requirements: 'Extreme competition, critical bottlenecks, overloaded capacity'
    }
};

// === PRESSURE DRIFT PROFILES ===

const DRIFT_PROFILES = {
    INTENSIFYING: {
        profile: 'INTENSIFYING',
        description: 'Prioritization pressure is intensifying. Competing regions are growing. Focus contention increasing.',
        interpretation: 'Pressure trend is negative. Cognitive landscape becoming more contested.'
    },
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Prioritization pressure is stabilizing. Competition levels are consistent. No significant drift in either direction.',
        interpretation: 'Pressure trend is neutral. Cognitive landscape in equilibrium.'
    },
    DISPERSING: {
        profile: 'DISPERSING',
        description: 'Prioritization pressure is dispersing. Competing regions are diminishing. Focus contention decreasing.',
        interpretation: 'Pressure trend is positive. Cognitive landscape becoming less contested.'
    },
    OSCILLATING: {
        profile: 'OSCILLATING',
        description: 'Prioritization pressure is oscillating. Competition alternating between high and low periods.',
        interpretation: 'Pressure trend is unstable. Repeated cycles of intensification and dispersal.'
    },
    FRAGMENTING: {
        profile: 'FRAGMENTING',
        description: 'Prioritization pressure is fragmenting. Previously concentrated pressure is breaking apart into distributed regions.',
        interpretation: 'Pressure landscape is breaking apart. Competition patterns becoming scattered.'
    },
    CONCENTRATING: {
        profile: 'CONCENTRATING',
        description: 'Prioritization pressure is concentrating. Distributed pressure is consolidating into fewer, more intense regions.',
        interpretation: 'Pressure is consolidating. Fewer regions carrying more pressure.'
    },
    SATURATING: {
        profile: 'SATURATING',
        description: 'Prioritization pressure is saturating. Focus capacity is reaching maximum contention with no relief in sight.',
        interpretation: 'Pressure has reached near-maximum levels. Stability at saturation point.'
    },
    ADAPTING: {
        profile: 'ADAPTING',
        description: 'Prioritization pressure is adapting. Pressure distribution is shifting as environmental conditions change.',
        interpretation: 'Pressure is in transition. Environmental shifts reshaping competition patterns.'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Insufficient observation history to determine prioritization pressure drift direction.',
        interpretation: 'More observations needed before pressure drift can be classified.'
    }
};

// === PRESSURE SIGNAL COMPUTATION ===

/**
 * Compute prioritization pressure signals from MCAI Phase 5 outputs.
 * @param {Object} context - { pressureRecord, salienceRecord, attentionRecord, contextualRecord, coherenceRecord, stabilityRecord, weightingRecord }
 * @returns {Object} Pressure signals and assessments
 */
function computePrioritizationPressure(context) {
    const {
        pressureRecord,
        salienceRecord,
        attentionRecord,
        contextualRecord,
        coherenceRecord,
        stabilityRecord,
        weightingRecord
    } = context;

    const signals = [];

    // === WEIGHTING-BASED PRESSURE SIGNALS ===
    if (weightingRecord) {
        const dominantSignals = weightingRecord.dominant_signals || [];
        const competition = weightingRecord.weighting_competition || {};
        const density = weightingRecord.environmental_weight_density || {};

        signals.push({
            signal_type: 'dominant_signal_competition',
            source: 'weighting',
            intensity: dominantSignals.length * 0.15 + (competition.fragmentation_index || 0) * 0.2,
            description: `${dominantSignals.length} dominant signals competing for cognitive focus`,
            severity: dominantSignals.length >= 4 ? 'high' : dominantSignals.length >= 2 ? 'medium' : 'low',
            competing_pairs: competition.competing_pairs?.length || 0,
            classification: dominantSignals.length >= 4 ? 'SATURATED' : dominantSignals.length >= 2 ? 'ELEVATED' : 'MINIMAL'
        });

        signals.push({
            signal_type: 'environmental_density_pressure',
            source: 'weighting',
            intensity: (density.density_score || 0) * 0.8,
            description: `Environmental density ${density.density_classification?.toLowerCase()} — ${density.signal_count || 0} signals active`,
            severity: density.density_classification === 'HIGH' ? 'high' : density.density_classification === 'MODERATE' ? 'medium' : 'low',
            density_classification: density.density_classification || 'LOW'
        });

        signals.push({
            signal_type: 'distribution_pressure',
            source: 'weighting',
            intensity: (weightingRecord.weighting_distribution?.gini_coefficient || 0) * 0.6,
            description: `Weight distribution ${weightingRecord.weighting_distribution?.type?.toLowerCase().replace('_', ' ')} — concentration creating pressure`,
            severity: weightingRecord.weighting_distribution?.gini_coefficient > 0.6 ? 'high' : weightingRecord.weighting_distribution?.gini_coefficient > 0.3 ? 'medium' : 'low',
            gini: weightingRecord.weighting_distribution?.gini_coefficient || 0
        });
    }

    // === STABILITY-BASED PRESSURE SIGNALS ===
    if (stabilityRecord) {
        const destabPressures = stabilityRecord.destabilization_pressures || [];
        const persistentZones = stabilityRecord.persistent_instability_zones || [];
        const oscillationRegions = stabilityRecord.oscillation_regions || [];

        signals.push({
            signal_type: 'destabilization_pressure',
            source: 'stability',
            intensity: destabPressures.reduce((sum, p) => sum + p.intensity * 0.4, 0),
            description: `${destabPressures.length} destabilization pressures creating prioritization strain`,
            severity: destabPressures.some(p => p.severity === 'high') ? 'high' : destabPressures.length >= 2 ? 'medium' : 'low',
            pressure_types: destabPressures.map(p => p.pressure_type)
        });

        signals.push({
            signal_type: 'persistent_instability_pressure',
            source: 'stability',
            intensity: persistentZones.length * 0.2,
            description: `${persistentZones.length} persistent instability zones maintaining pressure`,
            severity: persistentZones.some(z => z.critical) ? 'high' : persistentZones.length >= 2 ? 'medium' : 'low',
            critical_zones: persistentZones.filter(z => z.critical).length
        });

        signals.push({
            signal_type: 'oscillation_pressure',
            source: 'stability',
            intensity: oscillationRegions.length > 0 ? oscillationRegions.reduce((sum, r) => sum + (r.severity === 'high' ? 0.6 : 0.3), 0) : 0,
            description: oscillationRegions.length > 0 ? `${oscillationRegions.length} oscillation regions creating unpredictable pressure` : 'No oscillation pressure',
            severity: oscillationRegions.some(r => r.severity === 'high') ? 'high' : oscillationRegions.length >= 2 ? 'medium' : 'low',
            oscillation_count: oscillationRegions.reduce((sum, r) => sum + (r.oscillation_count || 0), 0)
        });
    }

    // === COHERENCE-BASED PRESSURE SIGNALS ===
    if (coherenceRecord) {
        const contradictionZones = coherenceRecord.contradiction_zones || [];
        const fragmentedLayers = coherenceRecord.fragmented_layers || [];
        const coherencePressures = coherenceRecord.coherence_pressures || [];

        signals.push({
            signal_type: 'contradiction_pressure',
            source: 'coherence',
            intensity: contradictionZones.length * 0.15 + coherencePressures.reduce((sum, p) => sum + p.intensity * 0.2, 0),
            description: `${contradictionZones.length} contradiction zones creating prioritization conflict`,
            severity: contradictionZones.some(z => z.severity === 'high') ? 'high' : contradictionZones.length >= 3 ? 'medium' : 'low',
            high_severity_count: contradictionZones.filter(z => z.severity === 'high').length
        });

        signals.push({
            signal_type: 'fragmentation_pressure',
            source: 'coherence',
            intensity: fragmentedLayers.length * 0.18,
            description: `${fragmentedLayers.length} fragmented layers dispersing cognitive focus`,
            severity: fragmentedLayers.length >= 3 ? 'high' : fragmentedLayers.length >= 2 ? 'medium' : 'low'
        });
    }

    // === ATTENTION-BASED PRESSURE SIGNALS ===
    if (attentionRecord) {
        const capacity = attentionRecord.capacity_assessment || {};
        const competition = attentionRecord.attention_competition || {};

        signals.push({
            signal_type: 'focus_saturation_pressure',
            source: 'attention',
            intensity: (capacity.saturation_score || 0) * 0.8 + (competition.competition_intensity || 0) * 0.4,
            description: `Focus saturation ${Math.round((capacity.saturation_score || 0) * 100)}% — competition intensity ${Math.round((competition.competition_intensity || 0) * 100)}%`,
            severity: (capacity.saturation_score || 0) > 0.85 ? 'high' : (capacity.saturation_score || 0) > 0.6 ? 'medium' : 'low',
            saturation_score: capacity.saturation_score || 0,
            competition_intensity: competition.competition_intensity || 0
        });

        signals.push({
            signal_type: 'attention_bottleneck_pressure',
            source: 'attention',
            intensity: attentionRecord.attention_level === 'DOMINANT' ? 0.8 : attentionRecord.attention_level === 'ELEVATED' ? 0.5 : 0.2,
            description: `Attention level ${attentionRecord.attention_level} creating bottleneck potential`,
            severity: attentionRecord.attention_level === 'DOMINANT' ? 'high' : attentionRecord.attention_level === 'ELEVATED' ? 'medium' : 'low',
            attention_level: attentionRecord.attention_level
        });
    }

    // === PRESSURE MAPPING SIGNALS ===
    if (pressureRecord) {
        const unresolvedCount = pressureRecord.unresolved_pressure_count || 0;
        const chronicEntities = pressureRecord.chronic_pressure_entities || [];

        signals.push({
            signal_type: 'unresolved_pressure_accumulation',
            source: 'pressure',
            intensity: Math.min(1, unresolvedCount * 0.08),
            description: `${unresolvedCount} unresolved pressure items accumulating`,
            severity: unresolvedCount >= 10 ? 'high' : unresolvedCount >= 5 ? 'medium' : 'low',
            unresolved_count: unresolvedCount
        });

        signals.push({
            signal_type: 'chronic_pressure_convergence',
            source: 'pressure',
            intensity: Math.min(1, chronicEntities.length * 0.25),
            description: `${chronicEntities.length} chronic pressure entities converging`,
            severity: chronicEntities.length >= 3 ? 'high' : chronicEntities.length >= 2 ? 'medium' : 'low',
            chronic_count: chronicEntities.length
        });
    }

    // === SALIENCE-BASED PRESSURE SIGNALS ===
    if (salienceRecord) {
        const clusters = salienceRecord.clusters || [];
        const highSignificanceClusters = clusters.filter(c => c.significance === 'high');

        signals.push({
            signal_type: 'salience_cluster_pressure',
            source: 'salience',
            intensity: highSignificanceClusters.length * 0.2,
            description: `${highSignificanceClusters.length} high-significance salience clusters creating pressure convergence`,
            severity: highSignificanceClusters.length >= 3 ? 'high' : highSignificanceClusters.length >= 2 ? 'medium' : 'low',
            cluster_count: highSignificanceClusters.length
        });
    }

    return signals;
}

// === PRESSURE CLASSIFICATION ===

function classifyPrioritizationPressure(signals) {
    if (!signals || signals.length === 0) return { state: 'MINIMAL', strength: 0 };

    // Sum all signal intensities
    const totalIntensity = signals.reduce((sum, s) => sum + s.intensity, 0);
    const avgIntensity = totalIntensity / signals.length;

    // Count high-severity signals
    const highSeverityCount = signals.filter(s => s.severity === 'high').length;
    const mediumSeverityCount = signals.filter(s => s.severity === 'medium').length;

    // Weighted intensity (high severity counts more)
    const weightedIntensity = signals.reduce((sum, s) => {
        const severityWeight = s.severity === 'high' ? 1.5 : s.severity === 'medium' ? 1.0 : 0.5;
        return sum + s.intensity * severityWeight;
    }, 0) / signals.length;

    let state;
    if (highSeverityCount >= 4 || weightedIntensity >= 0.75 || avgIntensity >= 0.7) {
        state = 'SATURATED';
    } else if (highSeverityCount >= 2 || weightedIntensity >= 0.5 || avgIntensity >= 0.5) {
        state = 'ELEVATED';
    } else if (mediumSeverityCount >= 2 || weightedIntensity >= 0.25 || avgIntensity >= 0.25) {
        state = 'DEVELOPING';
    } else {
        state = 'MINIMAL';
    }

    const strength = Math.min(1, weightedIntensity);

    return {
        state,
        strength: Math.round(strength * 100) / 100,
        high_severity_count: highSeverityCount,
        avg_intensity: Math.round(avgIntensity * 100) / 100
    };
}

// === COMPETING REGIONS ===

function identifyCompetingRegions(signals, context) {
    const regions = [];

    // Cluster signals by source to identify competing regions
    const bySource = {};
    for (const signal of signals) {
        if (!bySource[signal.source]) bySource[signal.source] = [];
        bySource[signal.source].push(signal);
    }

    // Each source becomes a potential competing region
    for (const [source, sourceSignals] of Object.entries(bySource)) {
        const totalIntensity = sourceSignals.reduce((sum, s) => sum + s.intensity, 0);
        const avgIntensity = totalIntensity / sourceSignals.length;

        if (avgIntensity >= 0.3) {
            regions.push({
                region_type: 'source_competition_region',
                source: source,
                signal_count: sourceSignals.length,
                total_intensity: Math.round(totalIntensity * 100) / 100,
                avg_intensity: Math.round(avgIntensity * 100) / 100,
                severity: avgIntensity >= 0.6 ? 'high' : avgIntensity >= 0.4 ? 'medium' : 'low',
                signals: sourceSignals.map(s => s.signal_type),
                dominant: sourceSignals.some(s => s.severity === 'high')
            });
        }
    }

    // Identify cross-source competition regions (signals with similar intensity)
    if (regions.length >= 2) {
        for (let i = 0; i < regions.length; i++) {
            for (let j = i + 1; j < regions.length; j++) {
                const diff = Math.abs(regions[i].avg_intensity - regions[j].avg_intensity);
                if (diff < 0.15) {
                    regions[i].competing_with = regions[j].source;
                    regions[j].competing_with = regions[i].source;
                }
            }
        }
    }

    return regions;
}

// === DOMINANT PRESSURE SIGNALS ===

function identifyDominantPressureSignals(signals) {
    return signals
        .filter(s => s.severity === 'high' || s.intensity >= 0.6)
        .sort((a, b) => b.intensity - a.intensity)
        .map(s => ({
            signal_type: s.signal_type,
            source: s.source,
            intensity: Math.round(s.intensity * 100) / 100,
            severity: s.severity,
            description: s.description
        }));
}

// === BOTTLENECK DETECTION ===

function detectBottleneckRegions(signals, context) {
    const bottlenecks = [];

    // High-intensity signals from multiple sources = bottleneck
    const highIntensityBySource = {};
    for (const signal of signals) {
        if (signal.intensity >= 0.5) {
            if (!highIntensityBySource[signal.source]) highIntensityBySource[signal.source] = [];
            highIntensityBySource[signal.source].push(signal);
        }
    }

    const sourceCount = Object.keys(highIntensityBySource).length;
    const totalHighIntensity = Object.values(highIntensityBySource).flat().length;

    // Bottleneck: multiple sources with high intensity in same region
    if (sourceCount >= 3 && totalHighIntensity >= 5) {
        bottlenecks.push({
            bottleneck_type: 'cognitive_congestion',
            intensity: Math.min(1, totalHighIntensity * 0.12),
            description: `Cognitive congestion — ${sourceCount} sources with ${totalHighIntensity} high-intensity signals converging`,
            severity: 'high',
            source_count: sourceCount,
            signal_count: totalHighIntensity,
            critical: sourceCount >= 5
        });
    }

    // Check for specific bottleneck patterns
    const saturationSignals = signals.filter(s => s.signal_type === 'focus_saturation_pressure' && s.intensity >= 0.6);
    if (saturationSignals.length >= 1) {
        bottlenecks.push({
            bottleneck_type: 'focus_saturation_bottleneck',
            intensity: saturationSignals[0].intensity,
            description: `Focus saturation bottleneck — ${saturationSignals[0].description}`,
            severity: saturationSignals[0].severity,
            saturation_score: saturationSignals[0].saturation_score,
            critical: saturationSignals[0].saturation_score > 0.85
        });
    }

    // Attention bottleneck
    const attentionBottlenecks = signals.filter(s => s.signal_type === 'attention_bottleneck_pressure' && s.severity === 'high');
    if (attentionBottlenecks.length >= 1) {
        bottlenecks.push({
            bottleneck_type: 'attention_bottleneck',
            intensity: attentionBottlenecks[0].intensity,
            description: attentionBottlenecks[0].description,
            severity: 'high',
            attention_level: attentionBottlenecks[0].attention_level,
            critical: attentionBottlenecks[0].attention_level === 'DOMINANT'
        });
    }

    // Stability bottleneck (persistent instability)
    const stabilityBottlenecks = signals.filter(s => s.signal_type === 'persistent_instability_pressure' && s.severity === 'high');
    if (stabilityBottlenecks.length >= 1) {
        bottlenecks.push({
            bottleneck_type: 'stability_bottleneck',
            intensity: stabilityBottlenecks[0].intensity,
            description: stabilityBottlenecks[0].description,
            severity: 'high',
            critical_zones: stabilityBottlenecks[0].critical_zones,
            critical: stabilityBottlenecks[0].critical_zones >= 2
        });
    }

    return bottlenecks;
}

// === PRESSURE CONVERGENCE ZONES ===

function detectPressureConvergenceZones(signals, context) {
    const zones = [];

    // Signals with overlapping intensity ranges
    const highSignals = signals.filter(s => s.intensity >= 0.5);
    if (highSignals.length >= 3) {
        zones.push({
            zone_type: 'high_intensity_convergence',
            intensity: highSignals.reduce((sum, s) => sum + s.intensity, 0) / highSignals.length,
            description: `${highSignals.length} high-intensity signals converging`,
            severity: highSignals.length >= 5 ? 'high' : 'medium',
            signal_count: highSignals.length,
            sources: [...new Set(highSignals.map(s => s.source))]
        });
    }

    // Contradiction + fragmentation convergence
    const contradictionPressure = signals.find(s => s.signal_type === 'contradiction_pressure');
    const fragmentationPressure = signals.find(s => s.signal_type === 'fragmentation_pressure');
    if (contradictionPressure && fragmentationPressure &&
        contradictionPressure.intensity >= 0.4 && fragmentationPressure.intensity >= 0.4) {
        zones.push({
            zone_type: 'coherence_fragmentation_convergence',
            intensity: (contradictionPressure.intensity + fragmentationPressure.intensity) / 2,
            description: 'Contradiction and fragmentation pressures converging — cognitive landscape torn',
            severity: 'high',
            sources: ['coherence']
        });
    }

    // Stability + saturation convergence
    const destabPressure = signals.find(s => s.signal_type === 'destabilization_pressure');
    const saturationPressure = signals.find(s => s.signal_type === 'focus_saturation_pressure');
    if (destabPressure && saturationPressure &&
        destabPressure.intensity >= 0.4 && saturationPressure.intensity >= 0.4) {
        zones.push({
            zone_type: 'stability_saturation_convergence',
            intensity: (destabPressure.intensity + saturationPressure.intensity) / 2,
            description: 'Destabilization and saturation pressures converging — instability meets overload',
            severity: 'high',
            sources: ['stability', 'attention']
        });
    }

    // Weighting + attention convergence
    const dominantComp = signals.find(s => s.signal_type === 'dominant_signal_competition');
    const focusSat = signals.find(s => s.signal_type === 'focus_saturation_pressure');
    if (dominantComp && focusSat && dominantComp.intensity >= 0.5 && focusSat.intensity >= 0.5) {
        zones.push({
            zone_type: 'competition_saturation_convergence',
            intensity: (dominantComp.intensity + focusSat.intensity) / 2,
            description: 'Dominant signal competition and focus saturation converging — overwhelming contention',
            severity: 'high',
            sources: ['weighting', 'attention']
        });
    }

    return zones;
}

// === FOCUS COMPETITION MAP ===

function buildFocusCompetitionMap(signals, competingRegions) {
    const competitionMap = {
        dominant_signals: [],
        competing_pairs: [],
        competition_intensity: 0,
        fragmentation_index: 0
    };

    // Get dominant signals
    competitionMap.dominant_signals = signals
        .filter(s => s.severity === 'high' || s.intensity >= 0.6)
        .map(s => ({ signal_type: s.signal_type, source: s.source, intensity: s.intensity }));

    // Identify competing pairs (same intensity, different sources)
    const highSignals = signals.filter(s => s.intensity >= 0.5);
    for (let i = 0; i < highSignals.length; i++) {
        for (let j = i + 1; j < highSignals.length; j++) {
            if (Math.abs(highSignals[i].intensity - highSignals[j].intensity) < 0.2) {
                competitionMap.competing_pairs.push({
                    signal_1: highSignals[i].signal_type,
                    signal_2: highSignals[j].signal_type,
                    sources: [highSignals[i].source, highSignals[j].source],
                    intensity_diff: Math.abs(highSignals[i].intensity - highSignals[j].intensity)
                });
            }
        }
    }

    // Competition intensity
    competitionMap.competition_intensity = Math.min(1, (
        competitionMap.dominant_signals.length * 0.15 +
        competitionMap.competing_pairs.length * 0.1
    ));

    // Fragmentation index
    const sources = [...new Set(signals.map(s => s.source))];
    const classifications = [...new Set(signals.map(s => s.severity))];
    competitionMap.fragmentation_index = Math.min(1, (
        (sources.length > 4 ? 0.2 : 0) +
        (classifications.includes('high') && classifications.includes('low') ? 0.3 : 0) +
        (competitionMap.competing_pairs.length > 2 ? 0.2 : 0)
    ));

    return competitionMap;
}

// === COGNITIVE SATURATION MODELING ===

function modelCognitiveSaturation(signals, context) {
    const saturation = {
        saturation_level: 0,
        saturation_type: 'NONE',
        overload_indicators: [],
        saturation_score: 0
    };

    // Get saturation signals
    const focusSatSignals = signals.filter(s => s.signal_type === 'focus_saturation_pressure');
    const destabSignals = signals.filter(s => s.signal_type === 'destabilization_pressure');
    const unresolvedSignals = signals.filter(s => s.signal_type === 'unresolved_pressure_accumulation');

    // Compute saturation score
    let saturationScore = 0;
    if (focusSatSignals.length > 0) {
        saturationScore += focusSatSignals[0].intensity * 0.5;
    }
    if (destabSignals.length > 0) {
        saturationScore += destabSignals.reduce((sum, s) => sum + s.intensity, 0) / destabSignals.length * 0.3;
    }
    if (unresolvedSignals.length > 0) {
        saturationScore += unresolvedSignals[0].intensity * 0.2;
    }

    saturation.saturation_score = Math.min(1, saturationScore);
    saturation.saturation_level = Math.round(saturationScore * 100) / 100;

    // Saturation type
    if (saturationScore >= 0.8) {
        saturation.saturation_type = 'CRITICAL';
        saturation.overload_indicators = ['focus_overload', 'cognitive_congestion', 'pressure_saturation'];
    } else if (saturationScore >= 0.6) {
        saturation.saturation_type = 'HIGH';
        saturation.overload_indicators = ['focus_strain', 'pressure_accumulation'];
    } else if (saturationScore >= 0.4) {
        saturation.saturation_type = 'MODERATE';
        saturation.overload_indicators = ['attention_contention', 'pressure_development'];
    } else if (saturationScore >= 0.2) {
        saturation.saturation_type = 'LOW';
        saturation.overload_indicators = ['minor_pressure'];
    } else {
        saturation.saturation_type = 'NONE';
    }

    // Get attention saturation score if available
    const attentionSat = focusSatSignals[0]?.saturation_score;
    if (attentionSat !== undefined) {
        saturation.direct_attention_saturation = attentionSat;
    }

    return saturation;
}

// === PRESSURE DISTRIBUTION ===

function analyzePressureDistribution(signals) {
    if (!signals || signals.length === 0) {
        return { type: 'EMPTY', concentration_score: 0, distribution均匀度: 0 };
    }

    const bySource = {};
    for (const signal of signals) {
        if (!bySource[signal.source]) bySource[signal.source] = [];
        bySource[signal.source].push(signal);
    }

    const sourceIntensities = Object.values(bySource).map(sourceSignals =>
        sourceSignals.reduce((sum, s) => sum + s.intensity, 0)
    );

    const totalIntensity = sourceIntensities.reduce((s, v) => s + v, 0);
    const meanIntensity = sourceIntensities.reduce((s, v) => s + v, 0) / Math.max(sourceIntensities.length, 1);

    // Concentration: how much pressure is in top sources
    const sortedIntensities = [...sourceIntensities].sort((a, b) => b - a);
    const topConcentration = sortedIntensities.slice(0, Math.ceil(sortedIntensities.length * 0.3))
        .reduce((s, v) => s + v, 0) / Math.max(totalIntensity, 0.01);

    // Distribution uniformity (inverse Gini)
    const n = sourceIntensities.length;
    if (n === 1) {
        return { type: 'CONCENTRATED', concentration_score: 1, distribution_uniformity: 0 };
    }

    let sumDiff = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            sumDiff += Math.abs(sourceIntensities[i] - sourceIntensities[j]);
        }
    }
    const gini = sumDiff / (2 * n * n * meanIntensity);
    const uniformity = 1 - gini;

    let type;
    if (topConcentration >= 0.7) type = 'CONCENTRATED';
    else if (topConcentration >= 0.5) type = 'MODERATE';
    else if (uniformity >= 0.7) type = 'DISTRIBUTED';
    else type = 'BALANCED';

    return {
        type,
        concentration_score: Math.round(topConcentration * 100) / 100,
        distribution_uniformity: Math.round(uniformity * 100) / 100,
        source_count: sourceIntensities.length,
        dominant_source_count: sortedIntensities.filter(i => i >= meanIntensity).length,
        distribution_summary: `${type} — ${Math.round(topConcentration * 100)}% pressure in top 30% sources`
    };
}

// === PRESSURE STABILITY ASSESSMENT ===

function assessPressureStability(pressureHistory = []) {
    const stability = {
        pressure_continuity: 0.5,
        pressure_volatility: 0,
        convergence_persistence: 0.5,
        competition_persistence: 0.5,
        pressure_oscillation: 0,
        bottleneck_stability: 0.5,
        overall_stability: 'MODERATE'
    };

    if (pressureHistory.length === 0) {
        stability.overall_stability = 'INDETERMINATE';
        return stability;
    }

    // Continuity: pressure states consistent over time
    const states = pressureHistory.map(h => h.prioritization_pressure_state);
    const stateMap = { 'MINIMAL': 1, 'DEVELOPING': 2, 'ELEVATED': 3, 'SATURATED': 4 };
    const stateScores = states.map(s => stateMap[s] || 2);

    const uniqueStates = new Set(states);
    stability.pressure_continuity = uniqueStates.size === 1 ? 1 : uniqueStates.size === 2 ? 0.6 : 0.3;

    // Volatility: pressure state changes
    let changes = 0;
    for (let i = 1; i < stateScores.length; i++) {
        if (Math.abs(stateScores[i] - stateScores[i - 1]) > 0) changes++;
    }
    stability.pressure_volatility = changes / Math.max(stateScores.length - 1, 1);

    // Oscillation detection
    let oscillations = 0;
    for (let i = 1; i < stateScores.length; i++) {
        if ((stateScores[i] >= 3 && stateScores[i - 1] <= 2) || (stateScores[i] <= 2 && stateScores[i - 1] >= 3)) {
            oscillations++;
        }
    }
    stability.pressure_oscillation = oscillations / Math.max(stateScores.length - 1, 1);

    // Convergence persistence
    const convergenceZones = pressureHistory.filter(h => (h.pressure_convergence_zones?.length || 0) > 0);
    stability.convergence_persistence = convergenceZones.length / pressureHistory.length;

    // Competition persistence
    const competingRegions = pressureHistory.filter(h => (h.competing_regions?.filter(r => r.competing_with)?.length || 0) > 0);
    stability.competition_persistence = competingRegions.length / pressureHistory.length;

    // Bottleneck stability
    const bottleneckHistory = pressureHistory.filter(h => (h.bottleneck_regions?.length || 0) > 0);
    stability.bottleneck_stability = bottleneckHistory.length / pressureHistory.length;

    // Overall
    const stabilityScore = (
        stability.pressure_continuity * 0.2 +
        (1 - stability.pressure_volatility) * 0.2 +
        stability.convergence_persistence * 0.15 +
        stability.competition_persistence * 0.15 +
        (1 - stability.pressure_oscillation) * 0.15 +
        stability.bottleneck_stability * 0.15
    );

    if (stabilityScore >= 0.7) stability.overall_stability = 'STABLE';
    else if (stabilityScore >= 0.4) stability.overall_stability = 'MODERATE';
    else stability.overall_stability = 'VOLATILE';

    return stability;
}

// === PRESSURE DRIFT TRACKING ===

function trackPressureDrift(pressureHistory) {
    if (!pressureHistory || pressureHistory.length < 2) {
        return {
            profile: 'INDETERMINATE',
            description: DRIFT_PROFILES.INDETERMINATE.description,
            interpretation: DRIFT_PROFILES.INDETERMINATE.interpretation,
            drift_strength: 0,
            confidence: 'low'
        };
    }

    const stateMap = { 'MINIMAL': 1, 'DEVELOPING': 2, 'ELEVATED': 3, 'SATURATED': 4 };
    const stateScores = pressureHistory.map(h => stateMap[h.prioritization_pressure_state] || 2);

    // Compare halves
    const midPoint = Math.floor(stateScores.length / 2);
    const firstHalf = stateScores.slice(0, midPoint);
    const secondHalf = stateScores.slice(midPoint);
    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / Math.max(firstHalf.length, 1);
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / Math.max(secondHalf.length, 1);
    const delta = secondAvg - firstAvg;

    // Variance
    const mean = stateScores.reduce((s, v) => s + v, 0) / stateScores.length;
    const variance = stateScores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / stateScores.length;

    // Oscillation
    let oscillationCount = 0;
    for (let i = 1; i < stateScores.length; i++) {
        if ((stateScores[i] >= 3 && stateScores[i - 1] <= 2) || (stateScores[i] <= 2 && stateScores[i - 1] >= 3)) {
            oscillationCount++;
        }
    }

    // Recovering pattern
    const recovering = stateScores[0] >= 3 && stateScores[stateScores.length - 1] <= 2 && delta < -0.5;

    // Dispersing pattern
    const dispersing = stateScores[stateScores.length - 1] < stateScores[0] && delta < -0.5;

    // Concentrating pattern
    const concentrating = stateScores[stateScores.length - 1] > stateScores[0] && delta > 0.5;

    let profile;
    if (recovering) {
        profile = 'DISPERSING';
    } else if (oscillationCount >= 2 && oscillationCount >= stateScores.length * 0.3) {
        profile = 'OSCILLATING';
    } else if (dispersing && variance < 1.0) {
        profile = 'DISPERSING';
    } else if (concentrating && variance < 1.0) {
        profile = 'CONCENTRATING';
    } else if (delta > 0.8 && variance < 1.5) {
        profile = 'INTENSIFYING';
    } else if (delta < -0.8 && variance < 1.5) {
        profile = 'DISPERSING';
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
        confidence: pressureHistory.length >= 4 ? 'high' : pressureHistory.length >= 2 ? 'medium' : 'low',
        oscillation_count: oscillationCount
    };
}

// === PERSISTENCE SUMMARY ===

function computePersistenceSummary(signals, pressureHistory = []) {
    const summary = {
        persistent_pressure_signals: [],
        recurring_bottleneck_regions: [],
        strengthening_pressures: [],
        weakening_pressures: []
    };

    if (pressureHistory.length === 0) return summary;

    // Track signal persistence across history
    const signalAppearances = {};
    for (const record of pressureHistory.slice(-5)) {
        if (record.dominant_pressure_signals) {
            for (const signal of record.dominant_pressure_signals) {
                if (!signalAppearances[signal.signal_type]) {
                    signalAppearances[signal.signal_type] = { count: 0, total_intensity: 0 };
                }
                signalAppearances[signal.signal_type].count++;
                signalAppearances[signal.signal_type].total_intensity += signal.intensity || 0;
            }
        }
    }

    for (const [signalType, data] of Object.entries(signalAppearances)) {
        if (data.count >= 3) {
            summary.persistent_pressure_signals.push({
                signal_type: signalType,
                appearances: data.count,
                avg_intensity: Math.round((data.total_intensity / data.count) * 100) / 100
            });
        }
    }

    // Track bottleneck persistence
    const bottleneckAppearances = {};
    for (const record of pressureHistory.slice(-5)) {
        if (record.bottleneck_regions) {
            for (const bn of record.bottleneck_regions) {
                if (!bottleneckAppearances[bn.bottleneck_type]) {
                    bottleneckAppearances[bn.bottleneck_type] = { count: 0, total_intensity: 0 };
                }
                bottleneckAppearances[bn.bottleneck_type].count++;
                bottleneckAppearances[bn.bottleneck_type].total_intensity += bn.intensity || 0;
            }
        }
    }

    for (const [bottleneckType, data] of Object.entries(bottleneckAppearances)) {
        if (data.count >= 3) {
            summary.recurring_bottleneck_regions.push({
                bottleneck_type: bottleneckType,
                appearances: data.count,
                avg_intensity: Math.round((data.total_intensity / data.count) * 100) / 100
            });
        }
    }

    return summary;
}

// === UNCERTAINTY BOUNDARIES ===

function generateUncertaintyBoundaries(signals, pressureHistory, classification) {
    const boundaries = [];

    if (!pressureHistory || pressureHistory.length < 3) {
        boundaries.push({
            factor: 'insufficient_pressure_history',
            impact: 'Limited prioritization pressure history — drift classification and stability assessment may be unreliable',
            confidence_level: 'low'
        });
    }

    if (classification.state === 'SATURATED' && pressureHistory.length < 5) {
        boundaries.push({
            factor: 'saturated_classification_uncertain',
            impact: 'SATURATED pressure state detected but limited history — saturation may be transient',
            confidence_level: 'medium'
        });
    }

    const bottleneckSignals = signals.filter(s => s.signal_type.includes('bottleneck'));
    if (bottleneckSignals.length >= 3 && pressureHistory.length < 3) {
        boundaries.push({
            factor: 'bottleneck_detection_uncertain',
            impact: 'Multiple bottleneck signals detected without sufficient history to confirm persistence',
            confidence_level: 'medium'
        });
    }

    const convergenceZones = signals.filter(s => s.intensity >= 0.5);
    if (convergenceZones.length >= 4 && pressureHistory.length < 3) {
        boundaries.push({
            factor: 'convergence_zone_transient',
            impact: 'High convergence detected but may be transient — insufficient history for confidence',
            confidence_level: 'medium'
        });
    }

    if (boundaries.length === 0) {
        boundaries.push({
            factor: 'bounded_observation_window',
            impact: 'All prioritization pressure observations bounded by current window — future conditions may alter pressure state',
            confidence_level: 'low'
        });
    }

    return boundaries;
}

// === ENVIRONMENTAL PRESSURE SUMMARY ===

function generateEnvironmentalPressureSummary(classification, signals, competingRegions, bottlenecks) {
    const highSeverityCount = signals.filter(s => s.severity === 'high').length;
    const bottleneckCount = bottlenecks.length;
    const competingCount = competingRegions.filter(r => r.competing_with).length;

    let summary;
    if (classification.state === 'SATURATED') {
        summary = `Cognitive landscape is saturated with prioritization pressure. ${highSeverityCount} high-severity signals, ${bottleneckCount} bottlenecks, ${competingCount} competing regions. Focus capacity is overloaded.`;
    } else if (classification.state === 'ELEVATED') {
        summary = `Cognitive landscape shows elevated prioritization pressure. ${highSeverityCount} high-severity signals, ${bottleneckCount} bottlenecks forming. Competition is significant.`;
    } else if (classification.state === 'DEVELOPING') {
        summary = `Cognitive landscape shows developing prioritization pressure. ${competingCount} competing regions emerging. Bottlenecks not yet significant.`;
    } else {
        summary = `Cognitive landscape shows minimal prioritization pressure. No significant competing regions or bottlenecks. Focus capacity is available.`;
    }

    return {
        summary,
        prioritization_pressure_state: classification.state,
        pressure_strength: classification.strength,
        high_severity_signal_count: highSeverityCount,
        bottleneck_count: bottleneckCount,
        competing_region_count: competingCount
    };
}

// === PRESSURE MEMORY RETENTION ===

function loadPressureHistory() {
    try {
        if (!fs.existsSync(PRESSURE_HISTORY_FILE)) return [];
        const lines = fs.readFileSync(PRESSURE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
        return lines.map(line => {
            try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
    } catch {
        return [];
    }
}

function savePressureSnapshot(pressureRecord) {
    // Save current pressure
    fs.writeFileSync(PRESSURE_FILE, JSON.stringify(pressureRecord, null, 2));

    // Append to history (append-only)
    const historyLine = JSON.stringify(pressureRecord) + '\n';
    fs.appendFileSync(PRESSURE_HISTORY_FILE, historyLine);

    // Enforce bounded memory
    const history = loadPressureHistory();
    if (history.length > MAX_HISTORY) {
        const trimmed = history.slice(-MAX_HISTORY);
        fs.writeFileSync(PRESSURE_HISTORY_FILE, trimmed.map(h => JSON.stringify(h)).join('\n') + '\n');
    }

    // Audit log
    const auditEntry = {
        timestamp: new Date().toISOString(),
        phase: 'MCAI-6A',
        audit_action: 'prioritization_pressure_snapshot_generated',
        prioritization_pressure_state: pressureRecord.prioritization_pressure_state,
        pressure_strength: pressureRecord.pressure_strength,
        bottleneck_count: pressureRecord.bottleneck_regions?.length || 0,
        competing_region_count: pressureRecord.competing_regions?.length || 0,
        shadow_only: true
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === MAIN PRESSURE RUNNER ===

function runPrioritizationPressure(context) {
    const { pressureRecord, salienceRecord, attentionRecord, contextualRecord, coherenceRecord, stabilityRecord, weightingRecord, pressureHistory = [] } = context;

    // Step 1: Compute prioritization pressure signals
    const signals = computePrioritizationPressure(context);

    // Step 2: Classify overall prioritization pressure
    const classification = classifyPrioritizationPressure(signals);

    // Step 3: Identify competing regions
    const competingRegions = identifyCompetingRegions(signals, context);

    // Step 4: Identify dominant pressure signals
    const dominantSignals = identifyDominantPressureSignals(signals);

    // Step 5: Detect bottleneck regions
    const bottleneckRegions = detectBottleneckRegions(signals, context);

    // Step 6: Detect pressure convergence zones
    const convergenceZones = detectPressureConvergenceZones(signals, context);

    // Step 7: Build focus competition map
    const focusCompetitionMap = buildFocusCompetitionMap(signals, competingRegions);

    // Step 8: Model cognitive saturation
    const saturation = modelCognitiveSaturation(signals, context);

    // Step 9: Analyze pressure distribution
    const distribution = analyzePressureDistribution(signals);

    // Step 10: Assess pressure stability
    const stabilityAssessment = assessPressureStability(pressureHistory);

    // Step 11: Track pressure drift
    const driftProfile = trackPressureDrift(pressureHistory);

    // Step 12: Compute persistence summary
    const persistenceSummary = computePersistenceSummary(signals, pressureHistory);

    // Step 13: Generate uncertainty boundaries
    const uncertaintyBoundaries = generateUncertaintyBoundaries(signals, pressureHistory, classification);

    // Step 14: Generate environmental summary
    const envSummary = generateEnvironmentalPressureSummary(classification, signals, competingRegions, bottleneckRegions);

    // Build complete pressure record
    const prioritizationPressureRecord = {
        prioritization_pressure_state: classification.state,
        pressure_strength: classification.strength,
        competing_regions: competingRegions,
        dominant_pressure_signals: dominantSignals,
        bottleneck_regions: bottleneckRegions,
        pressure_convergence_zones: convergenceZones,
        focus_competition_map: focusCompetitionMap,
        cognitive_saturation_assessment: saturation,
        pressure_distribution: distribution,
        pressure_stability_assessment: stabilityAssessment,
        pressure_drift_profile: driftProfile,
        persistence_summary: persistenceSummary,
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_pressure_summary: envSummary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };

    // Step 15: Save snapshot
    savePressureSnapshot(prioritizationPressureRecord);

    return prioritizationPressureRecord;
}

// === EXPORTS ===

module.exports = {
    computePrioritizationPressure,
    classifyPrioritizationPressure,
    identifyCompetingRegions,
    identifyDominantPressureSignals,
    detectBottleneckRegions,
    detectPressureConvergenceZones,
    buildFocusCompetitionMap,
    modelCognitiveSaturation,
    analyzePressureDistribution,
    assessPressureStability,
    trackPressureDrift,
    computePersistenceSummary,
    runPrioritizationPressure,
    loadPressureHistory,
    PRESSURE_STATES,
    DRIFT_PROFILES,
    MAX_HISTORY
};