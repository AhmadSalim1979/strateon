/**
 * Executive Focus Emergence Layer — MCAI Phase 6B
 * SHADOW-ONLY: Bounded observational executive-focus without action authority.
 * 
 * This module models the emergence of persistent executive-focus candidates,
 * focus convergence pressure, dominant cognitive convergence, and bounded
 * executive-selection formation.
 * 
 * It observes executive-focus emergence — NOT what should be prioritized.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const EXECUTIVE_FILE = path.join(STATE_DIR, 'executive-focus.json');
const EXECUTIVE_HISTORY_FILE = path.join(STATE_DIR, 'executive-focus-history.jsonl');

const MAX_HISTORY = 30;

// === EXECUTIVE FOCUS STATES ===

const FOCUS_STATES = {
    INCIDENTAL: {
        state: 'INCIDENTAL',
        description: 'No persistent executive-focus candidates detected. Cognitive regions showing only incidental convergence with no sustained dominance. No executive-level pressure forming.',
        requirements: 'No persistent candidates, no convergence chains, no executive dominance'
    },
    EMERGING: {
        state: 'EMERGING',
        description: 'Emerging executive-focus candidates detected. Some cognitive regions showing repeated convergence patterns. Executive-level pressure beginning to form. No single region clearly dominant.',
        requirements: 'Some repeated convergence, emerging candidates, no clear dominance'
    },
    PERSISTENT: {
        state: 'PERSISTENT',
        description: 'Persistent executive-focus candidates detected. Multiple cognitive regions showing sustained convergence toward executive significance. Executive-level pressure is established. Clear dominant regions emerging.',
        requirements: 'Sustained convergence, persistent candidates, clear dominance forming'
    },
    EXECUTIVE_DOMINANT: {
        state: 'EXECUTIVE_DOMINANT',
        description: 'Executive-dominant state achieved. One or more cognitive regions have achieved clear executive-level dominance. Convergence is overwhelming. Executive-level focus is monopolized by dominant regions.',
        requirements: 'Overwhelming convergence, dominant candidates, executive monopoly'
    }
};

// === EXECUTIVE DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: {
        profile: 'STRENGTHENING',
        description: 'Executive-focus is strengthening. Convergence toward dominant regions is increasing. More cognitive pressure aligning with executive candidates.',
        interpretation: 'Executive trend is toward dominance. Convergence intensity increasing.'
    },
    WEAKENING: {
        profile: 'WEAKENING',
        description: 'Executive-focus is weakening. Convergence toward previously dominant regions is decreasing. Executive candidates are losing prominence.',
        interpretation: 'Executive trend is toward diffusion. Convergence intensity decreasing.'
    },
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Executive-focus is stabilizing. Executive-level convergence is consistent. No significant drift in executive dominance.',
        interpretation: 'Executive trend is neutral. Stable executive configuration.'
    },
    OSCILLATING: {
        profile: 'OSCILLATING',
        description: 'Executive-focus is oscillating. Executive dominance alternating between regions. No stable executive candidate.',
        interpretation: 'Executive trend is unstable. Repeated alternation of dominance.'
    },
    FRAGMENTING: {
        profile: 'FRAGMENTING',
        description: 'Executive-focus is fragmenting. Previously unified executive convergence is breaking apart into multiple competing candidates.',
        interpretation: 'Executive landscape is fragmenting. New candidates emerging, old dominance weakening.'
    },
    CONCENTRATING: {
        profile: 'CONCENTRATING',
        description: 'Executive-focus is concentrating. Executive convergence is consolidating into fewer, more powerful candidates.',
        interpretation: 'Executive convergence is consolidating. Fewer candidates carrying more weight.'
    },
    DISPERSING: {
        profile: 'DISPERSING',
        description: 'Executive-focus is dispersing. Executive convergence is spreading across more candidates. No single region dominating.',
        interpretation: 'Executive convergence is spreading. More candidates sharing executive weight.'
    },
    ADAPTING: {
        profile: 'ADAPTING',
        description: 'Executive-focus is adapting. Executive configuration is shifting as environmental conditions change.',
        interpretation: 'Executive trend is in transition. Environmental shifts reshaping executive landscape.'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Insufficient observation history to determine executive-focus drift direction.',
        interpretation: 'More observations needed before executive drift can be classified.'
    }
};

// === FOCUS CANDIDATE COMPUTATION ===

/**
 * Compute executive focus candidates from all upstream MCAI layers.
 * @param {Object} context - { pressureRecord, salienceRecord, attentionRecord, contextualRecord, coherenceRecord, stabilityRecord, weightingRecord, prioritizationPressure }
 * @returns {Object} Focus candidates and assessments
 */
function computeFocusCandidates(context) {
    const {
        pressureRecord,
        salienceRecord,
        attentionRecord,
        contextualRecord,
        coherenceRecord,
        stabilityRecord,
        weightingRecord,
        prioritizationPressure
    } = context;

    const candidates = [];

    // === ATTENTION-BASED CANDIDATES ===
    if (attentionRecord) {
        const level = attentionRecord.attention_level || 'BACKGROUND';
        const saturation = attentionRecord.capacity_assessment?.saturation_score || 0;
        const activeEntities = attentionRecord.active_attention_entities || [];

        if (level === 'DOMINANT' || saturation > 0.7) {
            candidates.push({
                candidate_type: 'attention_dominance',
                source: 'attention',
                strength: level === 'DOMINANT' ? 0.9 : saturation * 0.8,
                persistence: level === 'DOMINANT' ? 'persistent' : 'emerging',
                description: `Attention ${level}${saturation > 0.7 ? ` with ${Math.round(saturation * 100)}% saturation` : ''}`,
                severity: level === 'DOMINANT' ? 'high' : 'medium',
                entities: activeEntities.map(e => e.entity_id)
            });
        }

        // Repeated saturation convergence
        if (saturation > 0.6) {
            candidates.push({
                candidate_type: 'saturation_convergence',
                source: 'attention',
                strength: saturation * 0.7,
                persistence: saturation > 0.85 ? 'persistent' : 'emerging',
                description: `Saturation convergence at ${Math.round(saturation * 100)}%`,
                severity: saturation > 0.85 ? 'high' : saturation > 0.7 ? 'medium' : 'low',
                saturation_score: saturation
            });
        }
    }

    // === WEIGHTING-BASED CANDIDATES ===
    if (weightingRecord) {
        const dominantSignals = weightingRecord.dominant_signals || [];
        const density = weightingRecord.environmental_weight_density || {};

        for (const signal of dominantSignals) {
            if (signal.classification === 'DOMINANT' || signal.normalized_weight >= 0.7) {
                candidates.push({
                    candidate_type: 'dominant_weight_convergence',
                    source: 'weighting',
                    strength: signal.normalized_weight * 0.85,
                    persistence: signal.normalized_weight >= 0.85 ? 'persistent' : 'emerging',
                    description: `Dominant weighting signal: ${signal.signal_type} (${Math.round(signal.normalized_weight * 100)}% normalized weight)`,
                    severity: signal.normalized_weight >= 0.9 ? 'high' : 'medium',
                    signal_type: signal.signal_type
                });
            }
        }

        // High density creates executive gravity
        if (density.density_classification === 'HIGH') {
            candidates.push({
                candidate_type: 'density_gravity',
                source: 'weighting',
                strength: density.density_score * 0.8,
                persistence: 'emerging',
                description: `Environmental density creating executive gravity (${Math.round(density.density_score * 100)}%)`,
                severity: density.density_score > 0.6 ? 'high' : 'medium',
                density_score: density.density_score
            });
        }
    }

    // === STABILITY-BASED CANDIDATES ===
    if (stabilityRecord) {
        const state = stabilityRecord.stability_state || 'STABLE';
        const destabPressures = stabilityRecord.destabilization_pressures || [];
        const persistentZones = stabilityRecord.persistent_instability_zones || [];

        if (state === 'UNSTABLE' || state === 'COLLAPSING') {
            candidates.push({
                candidate_type: 'instability_convergence',
                source: 'stability',
                strength: state === 'COLLAPSING' ? 0.95 : 0.75,
                persistence: 'persistent',
                description: `Instability convergence — stability state ${state}`,
                severity: 'high',
                stability_state: state
            });
        }

        // Persistent instability zones create bottleneck-centered convergence
        for (const zone of persistentZones) {
            if (zone.severity === 'high' || zone.critical) {
                candidates.push({
                    candidate_type: 'bottleneck_convergence',
                    source: 'stability',
                    strength: zone.intensity || 0.7,
                    persistence: zone.critical ? 'persistent' : 'emerging',
                    description: `Bottleneck-centered convergence: ${zone.zone_type}`,
                    severity: zone.severity,
                    zone_type: zone.zone_type,
                    critical: zone.critical
                });
            }
        }

        // Repeated destabilization pressure
        if (destabPressures.filter(p => p.severity === 'high').length >= 2) {
            candidates.push({
                candidate_type: 'pressure_convergence',
                source: 'stability',
                strength: 0.75,
                persistence: 'persistent',
                description: `High-severity destabilization pressure convergence (${destabPressures.filter(p => p.severity === 'high').length} high-severity pressures)`,
                severity: 'high',
                pressure_count: destabPressures.filter(p => p.severity === 'high').length
            });
        }
    }

    // === COHERENCE-BASED CANDIDATES ===
    if (coherenceRecord) {
        const state = coherenceRecord.coherence_state || 'COHERENT';
        const contradictions = coherenceRecord.contradiction_zones || [];
        const fragmentedLayers = coherenceRecord.fragmented_layers || [];

        if (state === 'FRAGMENTED' || state === 'DISSONANT') {
            candidates.push({
                candidate_type: 'fragmentation_convergence',
                source: 'coherence',
                strength: state === 'DISSONANT' ? 0.9 : 0.7,
                persistence: state === 'DISSONANT' ? 'persistent' : 'emerging',
                description: `Coherence fragmentation convergence — state: ${state}`,
                severity: state === 'DISSONANT' ? 'high' : 'medium',
                coherence_state: state
            });
        }

        // Contradiction zones create unresolved executive pressure
        for (const zone of contradictions) {
            if (zone.severity === 'high') {
                candidates.push({
                    candidate_type: 'contradiction_pressure',
                    source: 'coherence',
                    strength: 0.65,
                    persistence: 'emerging',
                    description: `Unresolved contradiction zone: ${zone.zone_type}`,
                    severity: 'medium',
                    zone_type: zone.zone_type
                });
            }
        }
    }

    // === PRIORITIZATION PRESSURE CANDIDATES ===
    if (prioritizationPressure) {
        const state = prioritizationPressure.prioritization_pressure_state || 'MINIMAL';
        const bottlenecks = prioritizationPressure.bottleneck_regions || [];
        const competingRegions = prioritizationPressure.competing_regions || [];

        if (state === 'SATURATED' || state === 'ELEVATED') {
            candidates.push({
                candidate_type: 'pressure_dominance',
                source: 'prioritization',
                strength: state === 'SATURATED' ? 0.95 : 0.7,
                persistence: state === 'SATURATED' ? 'persistent' : 'emerging',
                description: `Prioritization pressure dominance — state: ${state}`,
                severity: state === 'SATURATED' ? 'high' : 'medium'
            });
        }

        // Executive bottleneck regions
        for (const bottleneck of bottlenecks) {
            if (bottleneck.critical || bottleneck.severity === 'high') {
                candidates.push({
                    candidate_type: 'bottleneck_dominance',
                    source: 'prioritization',
                    strength: bottleneck.intensity,
                    persistence: bottleneck.critical ? 'persistent' : 'emerging',
                    description: `Executive bottleneck: ${bottleneck.bottleneck_type}`,
                    severity: bottleneck.severity,
                    bottleneck_type: bottleneck.bottleneck_type
                });
            }
        }

        // Competing regions with competing_with indicate unresolved executive convergence
        const competingPairs = competingRegions.filter(r => r.competing_with);
        if (competingPairs.length >= 2) {
            candidates.push({
                candidate_type: 'executive_competition',
                source: 'prioritization',
                strength: Math.min(1, competingPairs.length * 0.2 + 0.4),
                persistence: 'emerging',
                description: `${competingPairs.length} competing executive regions — unresolved convergence`,
                severity: competingPairs.length >= 3 ? 'high' : 'medium',
                competing_count: competingPairs.length
            });
        }
    }

    // === SALIENCE-BASED CANDIDATES ===
    if (salienceRecord) {
        const level = salienceRecord.salience_level || 'TRANSIENT';
        const clusters = salienceRecord.clusters || [];
        const highSignificanceClusters = clusters.filter(c => c.significance === 'high');

        if (level === 'PERSISTENT') {
            candidates.push({
                candidate_type: 'persistent_salience',
                source: 'salience',
                strength: 0.8,
                persistence: 'persistent',
                description: `Persistent salience dominance — level: ${level}`,
                severity: 'high',
                salience_level: level
            });
        }

        // Multiple high-significance clusters create cross-layer convergence
        if (highSignificanceClusters.length >= 3) {
            candidates.push({
                candidate_type: 'cluster_convergence',
                source: 'salience',
                strength: Math.min(1, highSignificanceClusters.length * 0.25),
                persistence: 'persistent',
                description: `Cross-layer convergence from ${highSignificanceClusters.length} high-significance clusters`,
                severity: highSignificanceClusters.length >= 4 ? 'high' : 'medium',
                cluster_count: highSignificanceClusters.length
            });
        }
    }

    // === PRESSURE MAPPING CANDIDATES ===
    if (pressureRecord) {
        const unresolvedCount = pressureRecord.unresolved_pressure_count || 0;
        const chronicEntities = pressureRecord.chronic_pressure_entities || [];

        if (unresolvedCount >= 8) {
            candidates.push({
                candidate_type: 'unresolved_pressure_dominance',
                source: 'pressure',
                strength: Math.min(1, unresolvedCount * 0.08),
                persistence: unresolvedCount >= 12 ? 'persistent' : 'emerging',
                description: `${unresolvedCount} unresolved pressure items creating executive-level dominance`,
                severity: unresolvedCount >= 15 ? 'high' : 'medium',
                unresolved_count: unresolvedCount
            });
        }

        // Chronic entities create persistent executive pressure
        if (chronicEntities.length >= 3) {
            candidates.push({
                candidate_type: 'chronic_pressure_convergence',
                source: 'pressure',
                strength: Math.min(1, chronicEntities.length * 0.25),
                persistence: 'persistent',
                description: `Chronic pressure convergence from ${chronicEntities.length} entities`,
                severity: 'high',
                chronic_count: chronicEntities.length
            });
        }
    }

    // === CONTEXTUAL CANDIDATES ===
    if (contextualRecord) {
        const state = contextualRecord.contextual_state || 'INCIDENTAL';
        const ampPatterns = contextualRecord.amplification_patterns || [];

        if (state === 'CRITICAL_CONTEXT' || state === 'SIGNIFICANT') {
            candidates.push({
                candidate_type: 'contextual_amplification',
                source: 'contextual',
                strength: state === 'CRITICAL_CONTEXT' ? 0.9 : 0.7,
                persistence: state === 'CRITICAL_CONTEXT' ? 'persistent' : 'emerging',
                description: `Contextual amplification dominance — state: ${state}`,
                severity: state === 'CRITICAL_CONTEXT' ? 'high' : 'medium',
                contextual_state: state
            });
        }

        // Amplification patterns create environmental executive clustering
        if (ampPatterns.length >= 3) {
            candidates.push({
                candidate_type: 'amplification_clustering',
                source: 'contextual',
                strength: Math.min(1, ampPatterns.length * 0.2),
                persistence: 'emerging',
                description: `Environmental executive clustering from ${ampPatterns.length} amplification patterns`,
                severity: 'medium',
                pattern_count: ampPatterns.length
            });
        }
    }

    return candidates;
}

// === FOCUS CLASSIFICATION ===

function classifyExecutiveFocus(candidates) {
    if (!candidates || candidates.length === 0) return { state: 'INCIDENTAL', strength: 0 };

    // Count by severity and persistence
    const highSeverity = candidates.filter(c => c.severity === 'high');
    const persistentCandidates = candidates.filter(c => c.persistence === 'persistent');
    const totalStrength = candidates.reduce((sum, c) => sum + c.strength, 0);
    const avgStrength = totalStrength / candidates.length;
    const maxStrength = Math.max(...candidates.map(c => c.strength));

    // Weighted strength
    const weightedStrength = candidates.reduce((sum, c) => {
        const severityWeight = c.severity === 'high' ? 1.5 : c.severity === 'medium' ? 1.0 : 0.5;
        const persistenceWeight = c.persistence === 'persistent' ? 1.3 : 1.0;
        return sum + c.strength * severityWeight * persistenceWeight;
    }, 0) / candidates.length;

    let state;
    if (highSeverity.length >= 4 || persistentCandidates.length >= 5 || maxStrength >= 0.9 || weightedStrength >= 0.75) {
        state = 'EXECUTIVE_DOMINANT';
    } else if (highSeverity.length >= 2 || persistentCandidates.length >= 3 || maxStrength >= 0.7 || weightedStrength >= 0.5) {
        state = 'PERSISTENT';
    } else if (highSeverity.length >= 1 || persistentCandidates.length >= 1 || maxStrength >= 0.5 || weightedStrength >= 0.3) {
        state = 'EMERGING';
    } else {
        state = 'INCIDENTAL';
    }

    return {
        state,
        strength: Math.min(1, Math.round(weightedStrength * 100) / 100),
        candidate_count: candidates.length,
        high_severity_count: highSeverity.length,
        persistent_count: persistentCandidates.length
    };
}

// === DOMINANT CONVERGENCE REGIONS ===

function identifyDominantConvergenceRegions(candidates) {
    const regions = [];

    // Group by source
    const bySource = {};
    for (const candidate of candidates) {
        if (!bySource[candidate.source]) bySource[candidate.source] = [];
        bySource[candidate.source].push(candidate);
    }

    // Sources with high combined strength
    for (const [source, sourceCandidates] of Object.entries(bySource)) {
        const combinedStrength = sourceCandidates.reduce((sum, c) => sum + c.strength, 0);
        const persistentCount = sourceCandidates.filter(c => c.persistence === 'persistent').length;
        const highSeverityCount = sourceCandidates.filter(c => c.severity === 'high').length;

        if (combinedStrength >= 0.5 || persistentCount >= 2 || highSeverityCount >= 2) {
            regions.push({
                region_type: 'source_convergence_region',
                source: source,
                candidate_count: sourceCandidates.length,
                combined_strength: Math.round(combinedStrength * 100) / 100,
                persistent_count: persistentCount,
                high_severity_count: highSeverityCount,
                severity: combinedStrength >= 1.0 ? 'high' : combinedStrength >= 0.7 ? 'medium' : 'low',
                candidates: sourceCandidates.map(c => c.candidate_type),
                dominant: highSeverityCount >= 2 || persistentCount >= 3
            });
        }
    }

    return regions;
}

// === EXECUTIVE BOTTLENECK REGIONS ===

function identifyExecutiveBottleneckRegions(candidates, context) {
    const bottlenecks = [];

    // Cluster by candidate_type
    const byType = {};
    for (const candidate of candidates) {
        if (!byType[candidate.candidate_type]) byType[candidate.candidate_type] = [];
        byType[candidate.candidate_type].push(candidate);
    }

    // Types with multiple occurrences across sources
    for (const [type, typeCandidates] of Object.entries(byType)) {
        if (typeCandidates.length >= 2) {
            const combinedStrength = typeCandidates.reduce((sum, c) => sum + c.strength, 0);
            bottlenecks.push({
                bottleneck_type: `${type}_bottleneck`,
                intensity: Math.min(1, combinedStrength * 0.8),
                description: `Executive bottleneck from ${typeCandidates.length} ${type} candidates converging`,
                severity: combinedStrength >= 1.2 ? 'high' : combinedStrength >= 0.8 ? 'medium' : 'low',
                candidate_count: typeCandidates.length,
                sources: [...new Set(typeCandidates.map(c => c.source))],
                critical: typeCandidates.some(c => c.critical)
            });
        }
    }

    // Bottleneck-centered convergence (from stability)
    const instabilityCandidates = candidates.filter(c => c.candidate_type === 'instability_convergence' || c.candidate_type === 'bottleneck_convergence');
    if (instabilityCandidates.length >= 2) {
        bottlenecks.push({
            bottleneck_type: 'stability_bottleneck_center',
            intensity: instabilityCandidates.reduce((sum, c) => sum + c.strength, 0) / instabilityCandidates.length,
            description: `Stability bottleneck-centered convergence — instability dominating executive focus`,
            severity: 'high',
            candidate_count: instabilityCandidates.length,
            critical: instabilityCandidates.some(c => c.critical)
        });
    }

    // Executive saturation bottleneck (from attention)
    const saturationCandidates = candidates.filter(c => c.candidate_type === 'saturation_convergence' || c.candidate_type === 'attention_dominance');
    if (saturationCandidates.length >= 1 && saturationCandidates[0].strength >= 0.7) {
        bottlenecks.push({
            bottleneck_type: 'saturation_executive_bottleneck',
            intensity: saturationCandidates[0].strength,
            description: saturationCandidates[0].description,
            severity: saturationCandidates[0].severity,
            saturation_score: saturationCandidates[0].saturation_score,
            critical: saturationCandidates[0].saturation_score > 0.85
        });
    }

    return bottlenecks;
}

// === CONVERGENCE CLUSTERS ===

function identifyConvergenceClusters(candidates) {
    const clusters = [];

    // Cluster by severity
    const bySeverity = {};
    for (const candidate of candidates) {
        if (!bySeverity[candidate.severity]) bySeverity[candidate.severity] = [];
        bySeverity[candidate.severity].push(candidate);
    }

    for (const [severity, severityCandidates] of Object.entries(bySeverity)) {
        if (severityCandidates.length >= 2) {
            clusters.push({
                cluster_type: 'severity_convergence_cluster',
                classification: severity,
                candidate_count: severityCandidates.length,
                combined_strength: Math.round(severityCandidates.reduce((sum, c) => sum + c.strength, 0) * 100) / 100,
                sources: [...new Set(severityCandidates.map(c => c.source))],
                candidate_types: severityCandidates.map(c => c.candidate_type)
            });
        }
    }

    // Cluster by persistence
    const byPersistence = {};
    for (const candidate of candidates) {
        if (!byPersistence[candidate.persistence]) byPersistence[candidate.persistence] = [];
        byPersistence[candidate.persistence].push(candidate);
    }

    for (const [persistence, persistenceCandidates] of Object.entries(byPersistence)) {
        if (persistenceCandidates.length >= 2) {
            clusters.push({
                cluster_type: 'persistence_convergence_cluster',
                persistence: persistence,
                candidate_count: persistenceCandidates.length,
                combined_strength: Math.round(persistenceCandidates.reduce((sum, c) => sum + c.strength, 0) * 100) / 100,
                sources: [...new Set(persistenceCandidates.map(c => c.source))],
                candidate_types: persistenceCandidates.map(c => c.candidate_type)
            });
        }
    }

    return clusters;
}

// === EXECUTIVE PRESSURE MAP ===

function buildExecutivePressureMap(candidates, convergenceRegions) {
    const pressureMap = {
        dominant_candidates: [],
        competing_pairs: [],
        convergence_chains: [],
        pressure_intensity: 0,
        fragmentation_index: 0
    };

    // Get dominant candidates
    pressureMap.dominant_candidates = candidates
        .filter(c => c.severity === 'high' || c.strength >= 0.7)
        .sort((a, b) => b.strength - a.strength)
        .map(c => ({
            candidate_type: c.candidate_type,
            source: c.source,
            strength: c.strength,
            severity: c.severity
        }));

    // Identify competing pairs (similar strength, different sources)
    const highStrengthCandidates = candidates.filter(c => c.strength >= 0.5);
    for (let i = 0; i < highStrengthCandidates.length; i++) {
        for (let j = i + 1; j < highStrengthCandidates.length; j++) {
            if (Math.abs(highStrengthCandidates[i].strength - highStrengthCandidates[j].strength) < 0.2) {
                pressureMap.competing_pairs.push({
                    candidate_1: highStrengthCandidates[i].candidate_type,
                    candidate_2: highStrengthCandidates[j].candidate_type,
                    sources: [highStrengthCandidates[i].source, highStrengthCandidates[j].source],
                    strength_diff: Math.abs(highStrengthCandidates[i].strength - highStrengthCandidates[j].strength)
                });
            }
        }
    }

    // Convergence chains (source -> candidate relationships)
    const sources = [...new Set(candidates.map(c => c.source))];
    for (const source of sources) {
        const sourceCandidates = candidates.filter(c => c.source === source);
        if (sourceCandidates.length >= 2) {
            pressureMap.convergence_chains.push({
                source: source,
                candidate_count: sourceCandidates.length,
                total_strength: sourceCandidates.reduce((sum, c) => sum + c.strength, 0)
            });
        }
    }

    // Pressure intensity
    pressureMap.pressure_intensity = Math.min(1, candidates.reduce((sum, c) => sum + c.strength, 0) / Math.max(candidates.length, 1));

    // Fragmentation index
    pressureMap.fragmentation_index = Math.min(1, (
        (sources.length > 5 ? 0.3 : 0) +
        (pressureMap.competing_pairs.length > 3 ? 0.2 : 0) +
        (candidates.filter(c => c.persistence === 'transient').length > candidates.length * 0.5 ? 0.2 : 0)
    ));

    return pressureMap;
}

// === EXECUTIVE SATURATION ASSESSMENT ===

function assessExecutiveSaturation(candidates, context) {
    const saturation = {
        saturation_level: 0,
        saturation_type: 'NONE',
        overload_indicators: [],
        saturation_score: 0
    };

    // Executive saturation when: many high-strength candidates + convergence
    const highStrengthCandidates = candidates.filter(c => c.strength >= 0.6);
    const persistentCandidates = candidates.filter(c => c.persistence === 'persistent');
    const highSeverityCandidates = candidates.filter(c => c.severity === 'high');

    let saturationScore = 0;
    saturationScore += highStrengthCandidates.length * 0.12;
    saturationScore += persistentCandidates.length * 0.1;
    saturationScore += highSeverityCandidates.length * 0.15;
    saturationScore += candidates.reduce((sum, c) => sum + c.strength, 0) / Math.max(candidates.length, 1) * 0.3;

    saturation.saturation_score = Math.min(1, saturationScore);
    saturation.saturation_level = Math.round(saturationScore * 100) / 100;

    if (saturationScore >= 0.8) {
        saturation.saturation_type = 'CRITICAL';
        saturation.overload_indicators = ['executive_congestion', 'convergence_overload', 'dominance_saturation'];
    } else if (saturationScore >= 0.6) {
        saturation.saturation_type = 'HIGH';
        saturation.overload_indicators = ['executive_pressure', 'candidate_saturation'];
    } else if (saturationScore >= 0.4) {
        saturation.saturation_type = 'MODERATE';
        saturation.overload_indicators = ['convergence_building', 'candidate_emergence'];
    } else if (saturationScore >= 0.2) {
        saturation.saturation_type = 'LOW';
        saturation.overload_indicators = ['minor_convergence'];
    } else {
        saturation.saturation_type = 'NONE';
    }

    return saturation;
}

// === EXECUTIVE DISTRIBUTION ===

function analyzeExecutiveDistribution(candidates) {
    if (!candidates || candidates.length === 0) {
        return { type: 'EMPTY', concentration_score: 0, uniformity_score: 0 };
    }

    // Group by source
    const bySource = {};
    for (const candidate of candidates) {
        if (!bySource[candidate.source]) bySource[candidate.source] = [];
        bySource[candidate.source].push(candidate);
    }

    const sourceStrengths = Object.values(bySource).map(sourceCandidates =>
        sourceCandidates.reduce((sum, c) => sum + c.strength, 0)
    );

    const totalStrength = sourceStrengths.reduce((s, v) => s + v, 0);
    const meanStrength = sourceStrengths.reduce((s, v) => s + v, 0) / Math.max(sourceStrengths.length, 1);

    // Concentration
    const sortedStrengths = [...sourceStrengths].sort((a, b) => b - a);
    const topConcentration = sortedStrengths.slice(0, Math.ceil(sortedStrengths.length * 0.3))
        .reduce((s, v) => s + v, 0) / Math.max(totalStrength, 0.01);

    // Uniformity
    const n = sourceStrengths.length;
    if (n === 1) {
        return { type: 'CONCENTRATED', concentration_score: 1, uniformity_score: 0 };
    }

    let sumDiff = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            sumDiff += Math.abs(sourceStrengths[i] - sourceStrengths[j]);
        }
    }
    const gini = sumDiff / (2 * n * n * meanStrength);
    const uniformity = 1 - gini;

    let type;
    if (topConcentration >= 0.7) type = 'CONCENTRATED';
    else if (topConcentration >= 0.5) type = 'MODERATE';
    else if (uniformity >= 0.7) type = 'DISTRIBUTED';
    else type = 'BALANCED';

    return {
        type,
        concentration_score: Math.round(topConcentration * 100) / 100,
        uniformity_score: Math.round(uniformity * 100) / 100,
        source_count: sourceStrengths.length,
        dominant_source_count: sortedStrengths.filter(s => s >= meanStrength).length
    };
}

// === EXECUTIVE STABILITY ASSESSMENT ===

function assessExecutiveStability(executiveHistory = []) {
    const stability = {
        convergence_continuity: 0.5,
        emergence_volatility: 0,
        persistence_continuity: 0.5,
        focus_oscillation: 0,
        fragmentation_persistence: 0.5,
        overall_stability: 'MODERATE'
    };

    if (executiveHistory.length === 0) {
        stability.overall_stability = 'INDETERMINATE';
        return stability;
    }

    // State continuity
    const states = executiveHistory.map(h => h.executive_focus_state);
    const stateMap = { 'INCIDENTAL': 1, 'EMERGING': 2, 'PERSISTENT': 3, 'EXECUTIVE_DOMINANT': 4 };
    const stateScores = states.map(s => stateMap[s] || 1);

    const uniqueStates = new Set(states);
    stability.convergence_continuity = uniqueStates.size === 1 ? 1 : uniqueStates.size === 2 ? 0.6 : 0.3;

    // Volatility
    let changes = 0;
    for (let i = 1; i < stateScores.length; i++) {
        if (Math.abs(stateScores[i] - stateScores[i - 1]) > 0) changes++;
    }
    stability.emergence_volatility = changes / Math.max(stateScores.length - 1, 1);

    // Oscillation
    let oscillations = 0;
    for (let i = 1; i < stateScores.length; i++) {
        if ((stateScores[i] >= 3 && stateScores[i - 1] <= 2) || (stateScores[i] <= 2 && stateScores[i - 1] >= 3)) {
            oscillations++;
        }
    }
    stability.focus_oscillation = oscillations / Math.max(stateScores.length - 1, 1);

    // Persistence continuity
    const persistentCandidates = executiveHistory.filter(h =>
        (h.focus_candidates?.filter(c => c.persistence === 'persistent').length || 0) >= 2
    );
    stability.persistence_continuity = persistentCandidates.length / executiveHistory.length;

    // Fragmentation persistence
    const fragmentationCandidates = executiveHistory.filter(h =>
        (h.focus_candidates?.filter(c => c.severity === 'low').length || 0) > (h.focus_candidates?.filter(c => c.severity === 'high').length || 0)
    );
    stability.fragmentation_persistence = fragmentationCandidates.length / executiveHistory.length;

    const stabilityScore = (
        stability.convergence_continuity * 0.25 +
        (1 - stability.emergence_volatility) * 0.2 +
        stability.persistence_continuity * 0.2 +
        (1 - stability.focus_oscillation) * 0.2 +
        (1 - stability.fragmentation_persistence) * 0.15
    );

    if (stabilityScore >= 0.7) stability.overall_stability = 'STABLE';
    else if (stabilityScore >= 0.4) stability.overall_stability = 'MODERATE';
    else stability.overall_stability = 'VOLATILE';

    return stability;
}

// === EXECUTIVE DRIFT TRACKING ===

function trackExecutiveDrift(executiveHistory) {
    if (!executiveHistory || executiveHistory.length < 2) {
        return {
            profile: 'INDETERMINATE',
            description: DRIFT_PROFILES.INDETERMINATE.description,
            interpretation: DRIFT_PROFILES.INDETERMINATE.interpretation,
            drift_strength: 0,
            confidence: 'low'
        };
    }

    const stateMap = { 'INCIDENTAL': 1, 'EMERGING': 2, 'PERSISTENT': 3, 'EXECUTIVE_DOMINANT': 4 };
    const stateScores = executiveHistory.map(h => stateMap[h.executive_focus_state] || 1);

    const midPoint = Math.floor(stateScores.length / 2);
    const firstHalf = stateScores.slice(0, midPoint);
    const secondHalf = stateScores.slice(midPoint);
    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / Math.max(firstHalf.length, 1);
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / Math.max(secondHalf.length, 1);
    const delta = secondAvg - firstAvg;

    const mean = stateScores.reduce((s, v) => s + v, 0) / stateScores.length;
    const variance = stateScores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / stateScores.length;

    let oscillationCount = 0;
    for (let i = 1; i < stateScores.length; i++) {
        if ((stateScores[i] >= 3 && stateScores[i - 1] <= 2) || (stateScores[i] <= 2 && stateScores[i - 1] >= 3)) {
            oscillationCount++;
        }
    }

    // Recovering pattern (only from EXECUTIVE_DOMINANT to lower)
    const recovering = stateScores[0] >= 4 && stateScores[stateScores.length - 1] <= 2 && delta < -0.5;

    // Dispersing pattern (more specific than WEAKENING — declining + top state declining)
    const dispersing = stateScores[stateScores.length - 1] < stateScores[0] && delta < -0.5;

    // Concentrating pattern (more specific than STRENGTHENING — rising + top state rising)
    const concentrating = stateScores[stateScores.length - 1] > stateScores[0] && delta > 0.5;

    let profile;
    if (recovering) {
        profile = 'DISPERSING';
    } else if (oscillationCount >= 2 && oscillationCount >= stateScores.length * 0.3) {
        profile = 'OSCILLATING';
    } else if (delta > 0.8 && variance < 1.5) {
        profile = 'STRENGTHENING';
    } else if (delta < -0.8 && variance < 1.5) {
        // WEAKENING when declining significantly (delta < -0.8, variance low)
        profile = 'WEAKENING';
    } else if (dispersing && variance < 1.0) {
        profile = 'DISPERSING';
    } else if (concentrating && variance < 1.0) {
        profile = 'CONCENTRATING';
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
        confidence: executiveHistory.length >= 4 ? 'high' : executiveHistory.length >= 2 ? 'medium' : 'low',
        oscillation_count: oscillationCount
    };
}

// === PERSISTENCE SUMMARY ===

function computePersistenceSummary(candidates, executiveHistory = []) {
    const summary = {
        recurring_dominant_candidates: [],
        persistent_convergence_regions: [],
        strengthening_candidates: [],
        weakening_candidates: []
    };

    if (executiveHistory.length === 0) return summary;

    // Track candidate persistence across history
    const candidateAppearances = {};
    for (const record of executiveHistory.slice(-5)) {
        if (record.focus_candidates) {
            for (const candidate of record.focus_candidates) {
                const key = `${candidate.candidate_type}_${candidate.source}`;
                if (!candidateAppearances[key]) {
                    candidateAppearances[key] = { count: 0, total_strength: 0 };
                }
                candidateAppearances[key].count++;
                candidateAppearances[key].total_strength += candidate.strength || 0;
            }
        }
    }

    for (const [key, data] of Object.entries(candidateAppearances)) {
        if (data.count >= 3) {
            const [candidate_type, source] = key.split('_');
            summary.recurring_dominant_candidates.push({
                candidate_type,
                source,
                appearances: data.count,
                avg_strength: Math.round((data.total_strength / data.count) * 100) / 100
            });
        }
    }

    // Track region persistence
    const regionAppearances = {};
    for (const record of executiveHistory.slice(-5)) {
        if (record.dominant_convergence_regions) {
            for (const region of record.dominant_convergence_regions) {
                if (!regionAppearances[region.source]) {
                    regionAppearances[region.source] = { count: 0, total_strength: 0 };
                }
                regionAppearances[region.source].count++;
                regionAppearances[region.source].total_strength += region.combined_strength || 0;
            }
        }
    }

    for (const [source, data] of Object.entries(regionAppearances)) {
        if (data.count >= 3) {
            summary.persistent_convergence_regions.push({
                source,
                appearances: data.count,
                avg_strength: Math.round((data.total_strength / data.count) * 100) / 100
            });
        }
    }

    return summary;
}

// === UNCERTAINTY BOUNDARIES ===

function generateUncertaintyBoundaries(candidates, executiveHistory, classification) {
    const boundaries = [];

    if (!executiveHistory || executiveHistory.length < 3) {
        boundaries.push({
            factor: 'insufficient_executive_history',
            impact: 'Limited executive-focus history — drift classification and stability assessment may be unreliable',
            confidence_level: 'low'
        });
    }

    if (classification.state === 'EXECUTIVE_DOMINANT' && executiveHistory.length < 5) {
        boundaries.push({
            factor: 'dominant_classification_uncertain',
            impact: 'EXECUTIVE_DOMINANT state detected but limited history — dominance may be transient',
            confidence_level: 'medium'
        });
    }

    const transientCandidates = candidates.filter(c => c.persistence !== 'persistent');
    if (transientCandidates.length > candidates.length * 0.7 && executiveHistory.length < 3) {
        boundaries.push({
            factor: 'transient_candidate_dominance',
            impact: 'Most candidates are transient without sufficient history — executive dominance may shift',
            confidence_level: 'medium'
        });
    }

    if (candidates.length >= 8 && executiveHistory.length < 3) {
        boundaries.push({
            factor: 'many_candidates_no_history',
            impact: 'Many executive candidates detected without history to confirm persistence',
            confidence_level: 'medium'
        });
    }

    if (boundaries.length === 0) {
        boundaries.push({
            factor: 'bounded_observation_window',
            impact: 'All executive-focus observations bounded by current window — future conditions may alter executive configuration',
            confidence_level: 'low'
        });
    }

    return boundaries;
}

// === ENVIRONMENTAL EXECUTIVE SUMMARY ===

function generateEnvironmentalExecutiveSummary(classification, candidates, regions, bottlenecks) {
    const highSeverityCount = candidates.filter(c => c.severity === 'high').length;
    const persistentCount = candidates.filter(c => c.persistence === 'persistent').length;
    const regionCount = regions.filter(r => r.dominant).length;
    const bottleneckCount = bottlenecks.filter(b => b.critical).length;

    let summary;
    if (classification.state === 'EXECUTIVE_DOMINANT') {
        summary = `Executive-dominant state. ${highSeverityCount} high-severity candidates, ${persistentCount} persistent. ${regionCount} dominant regions, ${bottleneckCount} critical bottlenecks. Executive focus is monopolized.`;
    } else if (classification.state === 'PERSISTENT') {
        summary = `Persistent executive-focus state. ${highSeverityCount} high-severity candidates, ${regionCount} dominant regions. Executive candidates are established.`;
    } else if (classification.state === 'EMERGING') {
        summary = `Emerging executive-focus. ${candidates.length} candidates, ${persistentCount} persistent. Executive convergence is forming but not yet dominant.`;
    } else {
        summary = `Incidental executive-focus. ${candidates.length} candidates, no persistent dominance. No clear executive-level pressure.`;
    }

    return {
        summary,
        executive_focus_state: classification.state,
        executive_focus_strength: classification.strength,
        candidate_count: candidates.length,
        persistent_candidate_count: persistentCount,
        dominant_region_count: regionCount,
        critical_bottleneck_count: bottleneckCount
    };
}

// === EXECUTIVE MEMORY RETENTION ===

function loadExecutiveHistory() {
    try {
        if (!fs.existsSync(EXECUTIVE_HISTORY_FILE)) return [];
        const lines = fs.readFileSync(EXECUTIVE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
        return lines.map(line => {
            try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
    } catch {
        return [];
    }
}

function saveExecutiveSnapshot(executiveRecord) {
    fs.writeFileSync(EXECUTIVE_FILE, JSON.stringify(executiveRecord, null, 2));

    const historyLine = JSON.stringify(executiveRecord) + '\n';
    fs.appendFileSync(EXECUTIVE_HISTORY_FILE, historyLine);

    const history = loadExecutiveHistory();
    if (history.length > MAX_HISTORY) {
        const trimmed = history.slice(-MAX_HISTORY);
        fs.writeFileSync(EXECUTIVE_HISTORY_FILE, trimmed.map(h => JSON.stringify(h)).join('\n') + '\n');
    }

    const auditEntry = {
        timestamp: new Date().toISOString(),
        phase: 'MCAI-6B',
        audit_action: 'executive_focus_snapshot_generated',
        executive_focus_state: executiveRecord.executive_focus_state,
        executive_focus_strength: executiveRecord.executive_focus_strength,
        candidate_count: executiveRecord.focus_candidates?.length || 0,
        dominant_region_count: executiveRecord.dominant_convergence_regions?.length || 0,
        shadow_only: true
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === MAIN EXECUTIVE RUNNER ===

function runExecutiveFocus(context) {
    const { pressureRecord, salienceRecord, attentionRecord, contextualRecord, coherenceRecord, stabilityRecord, weightingRecord, prioritizationPressure, executiveHistory = [] } = context;

    const fullContext = {
        pressureRecord: pressureRecord || {},
        salienceRecord: salienceRecord || {},
        attentionRecord: attentionRecord || {},
        contextualRecord: contextualRecord || {},
        coherenceRecord: coherenceRecord || {},
        stabilityRecord: stabilityRecord || {},
        weightingRecord: weightingRecord || {},
        prioritizationPressure: prioritizationPressure || {}
    };

    // Step 1: Compute focus candidates
    const candidates = computeFocusCandidates(fullContext);

    // Step 2: Classify executive focus
    const classification = classifyExecutiveFocus(candidates);

    // Step 3: Identify dominant convergence regions
    const dominantRegions = identifyDominantConvergenceRegions(candidates);

    // Step 4: Identify executive bottleneck regions
    const bottleneckRegions = identifyExecutiveBottleneckRegions(candidates, fullContext);

    // Step 5: Identify convergence clusters
    const convergenceClusters = identifyConvergenceClusters(candidates);

    // Step 6: Build executive pressure map
    const pressureMap = buildExecutivePressureMap(candidates, dominantRegions);

    // Step 7: Assess executive saturation
    const saturation = assessExecutiveSaturation(candidates, fullContext);

    // Step 8: Analyze executive distribution
    const distribution = analyzeExecutiveDistribution(candidates);

    // Step 9: Assess executive stability
    const stabilityAssessment = assessExecutiveStability(executiveHistory);

    // Step 10: Track executive drift
    const driftProfile = trackExecutiveDrift(executiveHistory);

    // Step 11: Compute persistence summary
    const persistenceSummary = computePersistenceSummary(candidates, executiveHistory);

    // Step 12: Generate uncertainty boundaries
    const uncertaintyBoundaries = generateUncertaintyBoundaries(candidates, executiveHistory, classification);

    // Step 13: Generate environmental summary
    const envSummary = generateEnvironmentalExecutiveSummary(classification, candidates, dominantRegions, bottleneckRegions);

    // Build complete executive record
    const executiveRecord = {
        executive_focus_state: classification.state,
        executive_focus_strength: classification.strength,
        focus_candidates: candidates.map(c => ({
            candidate_type: c.candidate_type,
            source: c.source,
            strength: Math.round(c.strength * 100) / 100,
            persistence: c.persistence,
            severity: c.severity,
            description: c.description
        })),
        dominant_convergence_regions: dominantRegions,
        executive_bottleneck_regions: bottleneckRegions,
        convergence_clusters: convergenceClusters,
        executive_pressure_map: pressureMap,
        executive_saturation_assessment: saturation,
        executive_distribution: distribution,
        executive_stability_assessment: stabilityAssessment,
        executive_drift_profile: driftProfile,
        persistence_summary: persistenceSummary,
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_executive_summary: envSummary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };

    // Step 14: Save snapshot
    saveExecutiveSnapshot(executiveRecord);

    return executiveRecord;
}

// === EXPORTS ===

module.exports = {
    computeFocusCandidates,
    classifyExecutiveFocus,
    identifyDominantConvergenceRegions,
    identifyExecutiveBottleneckRegions,
    identifyConvergenceClusters,
    buildExecutivePressureMap,
    assessExecutiveSaturation,
    analyzeExecutiveDistribution,
    assessExecutiveStability,
    trackExecutiveDrift,
    computePersistenceSummary,
    runExecutiveFocus,
    loadExecutiveHistory,
    FOCUS_STATES,
    DRIFT_PROFILES,
    MAX_HISTORY
};