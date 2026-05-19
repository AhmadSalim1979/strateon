/**
 * Contextual Relevance Layer — MCAI Phase 5D
 * SHADOW-ONLY: Bounded observational contextual relevance without action authority.
 * 
 * This module models how environmental conditions gain or lose cognitive relevance
 * based on surrounding operational context.
 * 
 * It observes contextual relevance — NOT what should be acted upon.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const CONTEXTUAL_FILE = path.join(STATE_DIR, 'contextual-relevance.json');
const CONTEXTUAL_HISTORY_FILE = path.join(STATE_DIR, 'contextual-relevance-history.jsonl');

const MAX_HISTORY = 30;

// === RELEVANCE CLASSIFICATIONS ===

const RELEVANCE_LEVELS = {
    INCIDENTAL: {
        level: 'INCIDENTAL',
        description: 'Condition has minimal contextual relevance. May be observable but does not significantly relate to surrounding environmental context. Standalone occurrence with limited amplification or suppression.',
        requirements: 'Single occurrence, no cluster overlap, no environmental pressure amplification'
    },
    CONTEXTUAL: {
        level: 'CONTEXTUAL',
        description: 'Condition gains relevance through relationship with surrounding environmental context. Amplification or suppression patterns are observable but not dominant. Context dependency is measurable.',
        requirements: 'Cluster overlap present, contextual amplification or suppression observable'
    },
    SIGNIFICANT: {
        level: 'SIGNIFICANT',
        description: 'Condition has substantial contextual relevance shaped by multiple environmental factors. Strong context dependency, clear amplification or suppression patterns, significant relationship with surrounding conditions.',
        requirements: 'Multiple cluster overlaps, clear amplification patterns, significant context dependency'
    },
    CRITICAL_CONTEXT: {
        level: 'CRITICAL_CONTEXT',
        description: 'Condition represents critical contextual relevance. Surrounding environmental context dramatically amplifies significance. Multiple amplification patterns converge. Context dependency is maximum.',
        requirements: 'Maximum cluster overlap, dominant amplification chains, critical contextual pressure'
    }
};

// === CONTEXTUAL DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: {
        profile: 'STRENGTHENING',
        description: 'Contextual relevance is strengthening as surrounding conditions amplify this condition.',
        interpretation: 'Environmental context increasingly favors this condition. Amplification patterns growing stronger.'
    },
    WEAKENING: {
        profile: 'WEAKENING',
        description: 'Contextual relevance is weakening as surrounding conditions suppress or de-amplify this condition.',
        interpretation: 'Environmental context is diminishing this condition. Suppression patterns emerging.'
    },
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Contextual relevance is maintaining consistent levels across observation window.',
        interpretation: 'Contextual amplification and suppression are in equilibrium. Stable relevance.'
    },
    FRAGMENTING: {
        profile: 'FRAGMENTING',
        description: 'Contextual relevance is fragmenting as surrounding conditions become less coherent.',
        interpretation: 'Contextual amplification patterns are breaking apart. Less coherent environmental context.'
    },
    OSCILLATING: {
        profile: 'OSCILLATING',
        description: 'Contextual relevance oscillates between amplification and suppression across observation window.',
        interpretation: 'Context swings between amplifying and suppressing this condition. Unstable pattern.'
    },
    CONTEXT_DEPENDENT: {
        profile: 'CONTEXT_DEPENDENT',
        description: 'Contextual relevance is highly variable depending on which surrounding conditions are present.',
        interpretation: 'Amplification and suppression depend entirely on specific contextual combination.'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Insufficient observation history to determine contextual drift direction.',
        interpretation: 'More observations needed before contextual drift can be classified.'
    }
};

// === CONTEXTUAL RELEVANCE COMPUTATION ===

/**
 * Compute contextual relevance for entities based on surrounding conditions.
 * @param {Object} context - { salienceRecord, attentionRecord, cognitivePressure, priorContext }
 * @returns {Object} Contextual relevance assessment
 */
function computeContextualRelevance(context) {
    const { salienceRecord, attentionRecord, cognitivePressure, priorContext } = context;

    const relevanceAssessment = {
        contextual_state: 'UNKNOWN',
        entity_relevance: [],
        pattern_relevance: [],
        amplification_patterns: [],
        suppression_patterns: [],
        environmental_dependencies: []
    };

    if (!salienceRecord && !attentionRecord) return relevanceAssessment;

    // Extract relevant data from upstream phases
    const salientEntities = salienceRecord?.salient_entities || [];
    const salientPatterns = salienceRecord?.salient_patterns || [];
    const clusters = salienceRecord?.clusters || [];
    const activeEntities = attentionRecord?.active_attention_entities || [];
    const attentionLevel = attentionRecord?.attention_level || 'BACKGROUND';
    const capacityState = attentionRecord?.capacity_assessment?.state || 'AVAILABLE';
    const transitionProfile = attentionRecord?.transition_profile?.profile || 'INDETERMINATE';
    const cognitiveStrain = cognitivePressure?.strain_level || 'LOW';
    const unresolvedCount = cognitivePressure?.unresolved_pressure_count || 0;

    // === CONTEXTUAL STATE DETERMINATION ===
    // Determines overall environmental contextual pressure

    let contextAmplificationScore = 0;
    let contextSuppressionScore = 0;

    // Amplification factors (increase contextual relevance)
    const amplificationFactors = [];

    // Concurrent instability amplifies
    const degradedEntities = salientEntities.length;
    if (degradedEntities >= 3) {
        amplificationFactors.push({ factor: 'concurrent_instability', entities: degradedEntities, weight: 2 });
    } else if (degradedEntities >= 2) {
        amplificationFactors.push({ factor: 'concurrent_instability', entities: degradedEntities, weight: 1 });
    }

    // Cluster overlap amplifies
    const clusterOverlap = clusters.filter(c => c.significance === 'high').length;
    if (clusterOverlap >= 2) {
        amplificationFactors.push({ factor: 'cluster_overlap', clusters: clusterOverlap, weight: 2 });
    } else if (clusterOverlap >= 1) {
        amplificationFactors.push({ factor: 'cluster_overlap', clusters: clusterOverlap, weight: 1 });
    }

    // High environmental pressure amplifies
    if (cognitiveStrain === 'HIGH' || cognitiveStrain === 'SEVERE') {
        amplificationFactors.push({ factor: 'environmental_pressure', strain: cognitiveStrain, weight: 2 });
    } else if (cognitiveStrain === 'MODERATE') {
        amplificationFactors.push({ factor: 'environmental_pressure', strain: cognitiveStrain, weight: 1 });
    }

    // Attention saturation amplifies
    if (capacityState === 'SATURATED' || capacityState === 'HIGH') {
        amplificationFactors.push({ factor: 'attention_saturation', state: capacityState, weight: 1 });
    }

    // Unresolved pressure amplifies
    if (unresolvedCount >= 5) {
        amplificationFactors.push({ factor: 'unresolved_pressure', count: unresolvedCount, weight: 2 });
    } else if (unresolvedCount >= 3) {
        amplificationFactors.push({ factor: 'unresolved_pressure', count: unresolvedCount, weight: 1 });
    }

    // Suppression factors (decrease contextual relevance)
    const suppressionFactors = [];

    // Stable entities suppress overall context amplification
    const stableEntities = salientEntities.filter(e => {
        const pattern = salientPatterns.find(p => p.entities?.includes(e));
        return pattern?.highest_severity === 'low';
    }).length;
    if (stableEntities >= 2) {
        suppressionFactors.push({ factor: 'stable_entity_suppression', entities: stableEntities, weight: 1 });
    }

    // Fragmenting transition suppresses
    if (transitionProfile === 'FRAGMENTING') {
        suppressionFactors.push({ factor: 'fragmenting_transition', profile: transitionProfile, weight: 1 });
    }

    // Low attention level suppresses
    if (attentionLevel === 'BACKGROUND' || attentionLevel === 'ACTIVE') {
        suppressionFactors.push({ factor: 'low_attention', level: attentionLevel, weight: 1 });
    }

    // Compute net amplification score
    contextAmplificationScore = amplificationFactors.reduce((sum, f) => sum + f.weight, 0);
    contextSuppressionScore = suppressionFactors.reduce((sum, f) => sum + f.weight, 0);
    const netContextScore = contextAmplificationScore - contextSuppressionScore;

    // Determine contextual state
    if (netContextScore >= 5) relevanceAssessment.contextual_state = 'CRITICAL_CONTEXT';
    else if (netContextScore >= 3) relevanceAssessment.contextual_state = 'SIGNIFICANT';
    else if (netContextScore >= 1) relevanceAssessment.contextual_state = 'CONTEXTUAL';
    else relevanceAssessment.contextual_state = 'INCIDENTAL';

    // Store amplification and suppression patterns
    relevanceAssessment.amplification_patterns = amplificationFactors.map(f => ({
        pattern_type: f.factor,
        context_weight: f.weight,
        entities: f.entities || f.clusters || f.count || null,
        description: `Context amplification: ${f.factor} (weight: ${f.weight})`
    }));

    relevanceAssessment.suppression_patterns = suppressionFactors.map(f => ({
        pattern_type: f.factor,
        context_weight: f.weight,
        context_value: f.entities || f.clusters || f.count || null,
        description: `Context suppression: ${f.factor} (weight: ${f.weight})`
    }));

    // === ENTITY-LEVEL CONTEXTUAL RELEVANCE ===

    for (const entity of salientEntities) {
        const entityPatterns = salientPatterns.filter(p => p.entities?.includes(entity));
        const isActive = activeEntities.some(e => e.entity_id === entity);
        const activeLevel = activeEntities.find(e => e.entity_id === entity)?.activation_level || 'BACKGROUND';

        // Check cluster membership (multiple clusters = more contextual relevance)
        const entityClusters = clusters.filter(c => c.entities?.includes(entity));
        const clusterMembershipCount = entityClusters.length;
        const highSignificanceClusters = entityClusters.filter(c => c.significance === 'high').length;

        // Context dependency score
        const contextDependencyScore = (
            (entityPatterns.length * 0.3) +
            (clusterMembershipCount * 0.4) +
            (highSignificanceClusters * 0.5) +
            (isActive ? 0.3 : 0) +
            (contextAmplificationScore * 0.2)
        );

        // Amplification from surrounding conditions
        const surroundingAmplification = entityClusters.reduce((sum, c) => {
            if (c.significance === 'high') return sum + 2;
            if (c.significance === 'medium') return sum + 1;
            return sum;
        }, 0);

        // Suppression from stable entities
        const surroundingSuppression = stableEntities >= 2 ? 1 : 0;

        const netEntityScore = contextDependencyScore + surroundingAmplification - surroundingSuppression;

        let relevanceLevel;
        if (netEntityScore >= 6) relevanceLevel = 'CRITICAL_CONTEXT';
        else if (netEntityScore >= 4) relevanceLevel = 'SIGNIFICANT';
        else if (netEntityScore >= 2) relevanceLevel = 'CONTEXTUAL';
        else relevanceLevel = 'INCIDENTAL';

        relevanceAssessment.entity_relevance.push({
            entity_id: entity,
            relevance_level: relevanceLevel,
            context_dependency_score: Math.round(netEntityScore * 100) / 100,
            cluster_membership_count: clusterMembershipCount,
            high_significance_clusters: highSignificanceClusters,
            pattern_count: entityPatterns.length,
            is_active: isActive,
            activation_level: activeLevel,
            amplification_from_context: surroundingAmplification,
            suppression_from_context: surroundingSuppression
        });
    }

    // === PATTERN-LEVEL CONTEXTUAL RELEVANCE ===

    for (const pattern of salientPatterns) {
        const entitiesInPattern = pattern.entities?.length || 0;
        const patternSeverity = pattern.highest_severity === 'high' ? 3 : pattern.highest_severity === 'medium' ? 2 : 1;
        const instances = pattern.instances || 1;

        // Pattern amplifies when multiple entities affected and high severity
        const contextAmplification = (entitiesInPattern >= 2 ? 1 : 0) + (patternSeverity >= 2 ? 1 : 0);
        const clusterAmplification = clusters.filter(c =>
            pattern.pattern_type.includes(c.cluster_type) ||
            c.cluster_type.includes(pattern.pattern_type.replace('_', '_'))
        ).length;

        const netPatternScore = (
            (contextAmplification * 0.5) +
            (clusterAmplification * 0.6) +
            (instances * 0.3) +
            (contextAmplificationScore * 0.2)
        );

        let patternRelevance;
        if (netPatternScore >= 5) patternRelevance = 'CRITICAL_CONTEXT';
        else if (netPatternScore >= 3) patternRelevance = 'SIGNIFICANT';
        else if (netPatternScore >= 1) patternRelevance = 'CONTEXTUAL';
        else patternRelevance = 'INCIDENTAL';

        relevanceAssessment.pattern_relevance.push({
            pattern_type: pattern.pattern_type,
            relevance_level: patternRelevance,
            context_dependency_score: Math.round(netPatternScore * 100) / 100,
            entities_affected: entitiesInPattern,
            cluster_amplification: clusterAmplification,
            context_amplification: contextAmplification
        });
    }

    // === ENVIRONMENTAL DEPENDENCIES ===

    // Map dependency relationships between entities based on cluster co-occurrence
    const dependencyMap = [];
    for (const cluster of clusters) {
        const entities = cluster.entities || [];
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                dependencyMap.push({
                    entity_a: entities[i],
                    entity_b: entities[j],
                    cluster: cluster.cluster_type,
                    significance: cluster.significance,
                    dependency_type: 'synchronized_relevance'
                });
            }
        }
    }

    relevanceAssessment.environmental_dependencies = dependencyMap;

    // === CONTEXTUAL CLUSTERS ===

    const contextualClusters = clusters.map(c => ({
        cluster_type: c.cluster_type,
        entity_count: c.entity_count,
        entities: c.entities,
        significance: c.significance,
        relevance_contribution: c.significance === 'high' ? 'critical' : c.significance === 'medium' ? 'significant' : 'minor'
    }));

    relevanceAssessment.contextual_clusters = contextualClusters;

    // === CONTEXTUAL UNCERTAINTY BOUNDARIES ===

    relevanceAssessment.contextual_uncertainty_boundaries = generateUncertaintyBoundaries(
        relevanceAssessment, clusters, amplificationFactors, suppressionFactors, priorContext
    );

    return relevanceAssessment;
}

function generateUncertaintyBoundaries(assessment, clusters, amplificationFactors, suppressionFactors, priorContext) {
    const boundaries = [];

    // Limited cluster overlap uncertainty
    if (clusters.length === 0) {
        boundaries.push({
            factor: 'no_cluster_overlap',
            impact: 'Contextual relevance may be isolated without cluster amplification — relationships could be coincidental',
            confidence_level: 'low'
        });
    } else if (clusters.length < 2) {
        boundaries.push({
            factor: 'limited_cluster_overlap',
            impact: 'Few clusters detected — contextual amplification patterns may not be reliable',
            confidence_level: 'medium'
        });
    }

    // Amplification without suppression uncertainty
    if (amplificationFactors.length > 0 && suppressionFactors.length === 0) {
        boundaries.push({
            factor: 'unilateral_amplification',
            impact: 'Only amplification factors detected — no suppression patterns may indicate incomplete contextual picture',
            confidence_level: 'low'
        });
    }

    // Limited entity coverage
    if (assessment.entity_relevance?.length < 2) {
        boundaries.push({
            factor: 'limited_entity_coverage',
            impact: 'Single entity contextual relevance — cannot determine environmental patterns',
            confidence_level: 'low'
        });
    }

    // High variance in prior context
    if (priorContext && priorContext.length >= 2) {
        const scores = priorContext.map(p => p.contextual_state === 'CRITICAL_CONTEXT' ? 4 : p.contextual_state === 'SIGNIFICANT' ? 3 : p.contextual_state === 'CONTEXTUAL' ? 2 : 1);
        const variance = computeVariance(scores);
        if (variance > 1) {
            boundaries.push({
                factor: 'high_contextual_variance',
                impact: 'Contextual state varies significantly across snapshots — relationships may be unstable',
                confidence_level: 'medium'
            });
        }
    }

    // Insufficient history
    if (!priorContext || priorContext.length < 3) {
        boundaries.push({
            factor: 'insufficient_contextual_history',
            impact: 'Limited contextual history — drift classification may be unreliable',
            confidence_level: 'low'
        });
    }

    if (boundaries.length === 0) {
        boundaries.push({
            factor: 'bounded_observation_window',
            impact: 'All contextual observations bounded by current window — future context may alter relevance classification',
            confidence_level: 'low'
        });
    }

    return boundaries;
}

function computeVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((s, d) => s + d, 0) / values.length;
}

// === CONTEXTUAL DRIFT TRACKING ===

function trackContextualDrift(contextualHistory) {
    if (!contextualHistory || contextualHistory.length < 2) {
        return {
            profile: 'INDETERMINATE',
            description: DRIFT_PROFILES.INDETERMINATE.description,
            interpretation: DRIFT_PROFILES.INDETERMINATE.interpretation,
            drift_strength: 0,
            confidence: 'low',
            contextual_state_history: []
        };
    }

    // Map contextual states to numeric values
    const stateMap = { 'CRITICAL_CONTEXT': 4, 'SIGNIFICANT': 3, 'CONTEXTUAL': 2, 'INCIDENTAL': 1 };
    const stateHistory = contextualHistory.map(c => stateMap[c.contextual_state] || 0);

    // Compare first half vs second half
    const midPoint = Math.floor(stateHistory.length / 2);
    const firstHalf = stateHistory.slice(0, midPoint);
    const secondHalf = stateHistory.slice(midPoint);
    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / Math.max(firstHalf.length, 1);
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / Math.max(secondHalf.length, 1);
    const delta = secondAvg - firstAvg;

    // Detect oscillation (alternating high/low)
    let oscillationCount = 0;
    for (let i = 1; i < stateHistory.length; i++) {
        if ((stateHistory[i] > 2 && stateHistory[i - 1] <= 2) || (stateHistory[i] <= 2 && stateHistory[i - 1] > 2)) {
            oscillationCount++;
        }
    }

    // Detect variance
    const variance = computeVariance(stateHistory);

    let profile;
    if (oscillationCount >= 2 && oscillationCount >= stateHistory.length * 0.3) {
        profile = 'OSCILLATING';
    } else if (delta > 0.8 && variance < 1.5) {
        profile = 'STRENGTHENING';
    } else if (delta < -0.8 && variance < 1.5) {
        profile = 'WEAKENING';
    } else if (variance >= 1.5 && Math.abs(delta) < 0.5) {
        profile = 'FRAGMENTING';
    } else if (Math.abs(delta) <= 0.5 && oscillationCount < 2) {
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
        confidence: contextualHistory.length >= 4 ? 'high' : contextualHistory.length >= 2 ? 'medium' : 'low',
        contextual_state_history: stateHistory
    };
}

// === CONTEXTUAL INTERACTION MAPPING ===

function mapContextualInteractions(assessment, clusters) {
    const interactions = {
        overlapping_instability_regions: [],
        reinforcement_chains: [],
        contradiction_amplification: [],
        contextual_volatility_overlap: [],
        synchronized_degradation_relevance: [],
        pressure_amplification_zones: []
    };

    // Overlapping instability regions
    const instabilityClusters = clusters.filter(c =>
        c.cluster_type.includes('instability') || c.cluster_type.includes('degradation')
    );
    if (instabilityClusters.length >= 2) {
        const allEntities = [...new Set(instabilityClusters.flatMap(c => c.entities || []))];
        if (allEntities.length >= 2) {
            interactions.overlapping_instability_regions.push({
                entities: allEntities,
                clusters: instabilityClusters.map(c => c.cluster_type),
                overlap_degree: allEntities.length
            });
        }
    }

    // Reinforcement chains (entities that appear in multiple high-significance clusters)
    const highSigEntities = [...new Set(
        clusters.filter(c => c.significance === 'high').flatMap(c => c.entities || [])
    )];
    if (highSigEntities.length >= 2) {
        interactions.reinforcement_chains.push({
            entities: highSigEntities,
            chain_strength: highSigEntities.length,
            description: `${highSigEntities.length} entities appear in multiple high-significance clusters`
        });
    }

    // Contradiction amplification
    const contradictionClusters = clusters.filter(c => c.cluster_type.includes('contradiction'));
    if (contradictionClusters.length >= 1 && clusters.some(c => c.cluster_type.includes('instability'))) {
        const contradictionEntities = new Set(contradictionClusters.flatMap(c => c.entities || []));
        const instabilityEntities = new Set(clusters.filter(c => c.cluster_type.includes('instability')).flatMap(c => c.entities || []));
        const overlap = [...contradictionEntities].filter(e => instabilityEntities.has(e));
        if (overlap.length >= 2) {
            interactions.contradiction_amplification.push({
                entities: overlap,
                clusters_involved: contradictionClusters.length + 1,
                description: `Contradiction co-located with instability amplifies relevance`
            });
        }
    }

    // Contextual volatility overlap
    const volatilityClusters = clusters.filter(c => c.cluster_type.includes('volatility') || c.cluster_type.includes('oscillation'));
    if (volatilityClusters.length >= 1) {
        const volatilityEntities = [...new Set(volatilityClusters.flatMap(c => c.entities || []))];
        if (volatilityEntities.length >= 1) {
            interactions.contextual_volatility_overlap.push({
                entities: volatilityEntities,
                volatility_clusters: volatilityClusters.length,
                description: `${volatilityEntities.length} entities in volatility context`
            });
        }
    }

    // Pressure amplification zones (entities in high-significance clusters with high dependency scores)
    const pressureEntities = assessment.entity_relevance
        ?.filter(e => e.relevance_level === 'CRITICAL_CONTEXT' || e.relevance_level === 'SIGNIFICANT')
        .map(e => e.entity_id) || [];
    if (pressureEntities.length >= 2) {
        interactions.pressure_amplification_zones.push({
            entities: pressureEntities,
            zone_strength: pressureEntities.length,
            description: `Pressure amplification zone: ${pressureEntities.length} high-relevance entities`
        });
    }

    return interactions;
}

// === PERSISTENCE TRACKING ===

function trackContextualPersistence(assessment, history) {
    if (!history || history.length === 0) {
        return {
            persistent_relevance_count: 0,
            recurring_contextual_cycles: 0,
            new_relevant_entities: assessment.entity_relevance?.map(e => e.entity_id) || [],
            departed_relevant_entities: []
        };
    }

    const currentEntities = new Set(assessment.entity_relevance?.map(e => e.entity_id) || []);
    const previousEntities = new Set(
        history[history.length - 1]?.entity_relevance?.map(e => e.entity_id) || []
    );

    // Persistent entities (in current and at least 2 prior snapshots)
    const persistentEntities = [...currentEntities].filter(e => {
        const historyCount = history.filter(h => (h.entity_relevance || []).some(er => er.entity_id === e)).length;
        return historyCount >= 2;
    });

    // Recurring contextual cycles
    const recurringEntities = [...currentEntities].filter(e => {
        const appearances = history.filter(h => (h.entity_relevance || []).some(er => er.entity_id === e)).length;
        return appearances >= 3 && appearances < history.length;
    });

    return {
        persistent_relevance_count: persistentEntities.length,
        recurring_contextual_cycles: recurringEntities.length,
        new_relevant_entities: [...currentEntities].filter(e => !previousEntities.has(e)),
        departed_relevant_entities: [...previousEntities].filter(e => !currentEntities.has(e)),
        persistent_entities: persistentEntities
    };
}

// === CONTEXTUAL MEMORY RETENTION ===

function loadContextualHistory() {
    try {
        if (!fs.existsSync(CONTEXTUAL_HISTORY_FILE)) return [];
        const lines = fs.readFileSync(CONTEXTUAL_HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
        return lines.map(line => {
            try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
    } catch {
        return [];
    }
}

function saveContextualSnapshot(contextualRecord) {
    // Save current contextual relevance
    fs.writeFileSync(CONTEXTUAL_FILE, JSON.stringify(contextualRecord, null, 2));

    // Append to history (append-only)
    const historyLine = JSON.stringify(contextualRecord) + '\n';
    fs.appendFileSync(CONTEXTUAL_HISTORY_FILE, historyLine);

    // Enforce bounded memory — keep last MAX_HISTORY entries
    const history = loadContextualHistory();
    if (history.length > MAX_HISTORY) {
        const trimmed = history.slice(-MAX_HISTORY);
        fs.writeFileSync(CONTEXTUAL_HISTORY_FILE, trimmed.map(h => JSON.stringify(h)).join('\n') + '\n');
    }

    // Audit log
    const auditEntry = {
        timestamp: new Date().toISOString(),
        phase: 'MCAI-5D',
        audit_action: 'contextual_relevance_snapshot_generated',
        contextual_state: contextualRecord.contextual_state,
        entity_relevance_count: contextualRecord.entity_relevance?.length || 0,
        pattern_relevance_count: contextualRecord.pattern_relevance?.length || 0,
        amplification_pattern_count: contextualRecord.amplification_patterns?.length || 0,
        shadow_only: true
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === MAIN CONTEXTUAL RELEVANCE RUNNER ===

function runContextualRelevance(context) {
    const { salienceRecord, attentionRecord, cognitivePressure, contextualHistory = [] } = context;

    // Step 1: Compute contextual relevance
    const assessment = computeContextualRelevance({
        salienceRecord,
        attentionRecord,
        cognitivePressure,
        priorContext: contextualHistory
    });

    // Step 2: Track contextual drift
    const contextualDrift = trackContextualDrift(contextualHistory);

    // Step 3: Map contextual interactions
    const interactions = mapContextualInteractions(assessment, salienceRecord?.clusters || []);

    // Step 4: Track persistence
    const persistence = trackContextualPersistence(assessment, contextualHistory);

    // Build complete contextual record
    const contextualRecord = {
        contextual_state: assessment.contextual_state,
        relevant_entities: assessment.entity_relevance,
        contextual_clusters: assessment.contextual_clusters,
        amplification_patterns: assessment.amplification_patterns,
        suppression_patterns: assessment.suppression_patterns,
        environmental_dependencies: assessment.environmental_dependencies,
        contextual_pressure_relationships: {
            amplification_score: assessment.amplification_patterns.reduce((s, p) => s + p.context_weight, 0),
            suppression_score: assessment.suppression_patterns.reduce((s, p) => s + p.context_weight, 0),
            net_context_score: assessment.amplification_patterns.reduce((s, p) => s + p.context_weight, 0) -
                             assessment.suppression_patterns.reduce((s, p) => s + p.context_weight, 0)
        },
        contextual_interaction_map: interactions,
        contextual_drift: contextualDrift,
        persistence_summary: persistence,
        contextual_uncertainty_boundaries: assessment.contextual_uncertainty_boundaries,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };

    // Step 5: Save snapshot
    saveContextualSnapshot(contextualRecord);

    return contextualRecord;
}

// === EXPORTS ===

module.exports = {
    computeContextualRelevance,
    trackContextualDrift,
    mapContextualInteractions,
    trackContextualPersistence,
    runContextualRelevance,
    loadContextualHistory,
    RELEVANCE_LEVELS,
    DRIFT_PROFILES,
    MAX_HISTORY
};