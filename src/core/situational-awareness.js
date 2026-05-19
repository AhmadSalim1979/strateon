/**
 * Situational Awareness Layer — MCAI Phase 4C
 * SHADOW-ONLY: Environmental observation without action authority
 * 
 * This module generates bounded observational snapshots of the operational environment.
 * It observes relative operational pressure — NOT what should be acted upon.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations. NO prioritization.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const PERCEPTION_LOG = path.join(STATE_DIR, 'priority-perception.jsonl');
const AWARENESS_FILE = path.join(STATE_DIR, 'situational-awareness.json');
const SNAPSHOT_RETENTION = 30; // Keep last 30 snapshots

// === PRESSURE CLASSIFICATION ===

const PRESSURE_LEVELS = {
    LOW: {
        level: 'LOW',
        summary: 'Operational environment appears stable with minimal observed instabilities.',
        description: 'Few entities are degraded or volatile. Contradictions and verification failures are at low levels. No significant instability patterns are detected across the monitored environment.',
        indicators: [
            'Stable entities dominate (>70% of observed entities)',
            'Low contradiction density across environment',
            'Minimal stale verification pressure',
            'No volatility clustering observed'
        ],
        uncertainty_note: 'LOW pressure classification is based on current observation window. Absence of instability signals may not guarantee stable underlying conditions.'
    },
    ELEVATED: {
        level: 'ELEVATED',
        summary: 'Operational environment shows elevated instabilities across multiple entities.',
        description: 'A measurable subset of entities show degraded or volatile behavior. Contradiction density and verification failures are above baseline but not at critical levels. Patterns suggest emerging pressure that warrants passive observation.',
        indicators: [
            'Degraded entities present (10-30% of observed)',
            'Elevated contradiction density across environment',
            'Some stale verification pressure observed',
            'No acute volatility clustering'
        ],
        uncertainty_note: 'ELEVATED classification may reflect temporary conditions. Does not indicate that corrective action is required — only that observation intensity should be maintained.'
    },
    HIGH: {
        level: 'HIGH',
        summary: 'Operational environment exhibits significant instability across multiple entities.',
        description: 'A substantial portion of observed entities are degraded or volatile. Contradictions and verification failures are persistently elevated. Instability patterns appear across multiple dimensions with measurable clustering.',
        indicators: [
            'Degraded or volatile entities exceed 30% of observed',
            'High contradiction density across environment',
            'Significant stale verification pressure',
            'Volatility clustering observed across entity types'
        ],
        uncertainty_note: 'HIGH pressure indicates measurable environmental stress. This classification describes observed instability, not the appropriate response. Underlying cause is not determined by this layer.'
    },
    SEVERE: {
        level: 'SEVERE',
        summary: 'Operational environment exhibits critical instability across majority of entities.',
        description: 'Most or all observed entities show degraded or volatile behavior. Contradictions, verification failures, and stale evidence are at maximum levels. Instability patterns are widespread and consistent across the monitored environment.',
        indicators: [
            'Majority of observed entities in degraded or volatile state',
            'Critical contradiction density across environment',
            'Widespread stale verification pressure',
            'Systemic volatility clustering observed'
        ],
        uncertainty_note: 'SEVERE classification is based on threshold crossings. Environmental stress may have identifiable root cause or may reflect cascading effects from a single failure point. This layer does not determine cause — only describes observed severity.'
    }
};

// === AWARENESS LEVELS ===

const AWARENESS_LEVELS = {
    LOW: {
        level: 'LOW',
        description: 'Limited observation data available. Environmental assessment has high uncertainty due to insufficient historical coverage or recent observation window.',
        requirements: 'More observations needed to establish reliable environmental awareness.'
    },
    MEDIUM: {
        level: 'MEDIUM',
        description: 'Moderate observation density available. Environmental assessment is plausible but may miss subtle patterns or short-duration instabilities.',
        requirements: 'Additional observation time would improve confidence in assessment.'
    },
    HIGH: {
        level: 'HIGH',
        description: 'Sufficient observation density available. Environmental assessment reflects a well-populated data sample with measurable confidence.',
        requirements: 'Assessment is reliable given current observation density.'
    }
};

// === TEMPORAL COMPARISON ===

const TEMPORAL_PATTERNS = {
    IMPROVING: {
        pattern: 'IMPROVING',
        description: 'Current environment shows measurably lower instability than previous snapshot. Stability indicators have improved, degraded entities have reduced, and contradictions have decreased.',
        interpretation: 'Environment is trending toward better operational conditions compared to previous observation period.'
    },
    DETERIORATING: {
        pattern: 'DETERIORATING',
        description: 'Current environment shows measurably higher instability than previous snapshot. Stability indicators have declined, degraded entities have increased, and contradictions have risen.',
        interpretation: 'Environment is trending toward worse operational conditions compared to previous observation period.'
    },
    STABLE: {
        pattern: 'STABLE',
        description: 'Current environment shows no significant change from previous snapshot. Stability indicators remain within normal variation range with no meaningful directional shift.',
        interpretation: 'Environment is maintaining consistent operational conditions compared to previous observation period.'
    },
    OSCILLATING: {
        pattern: 'OSCILLATING',
        description: 'Environment shows alternating improvement and deterioration patterns over successive snapshots. No clear directional trend is present but cyclical behavior is measurable based on snapshot comparison.',
        interpretation: 'Environment is in a cyclic state with alternating pressure phases. The cyclic pattern suggests feedback-driven oscillations or the presence of unresolved instability drivers affecting entity behavior over time.'
    },
    INSUFFICIENT_DATA: {
        pattern: 'INSUFFICIENT_DATA',
        description: 'Not enough historical snapshots available to determine a temporal trend. At least two complete snapshots are needed to compare environmental states.',
        interpretation: 'Trend cannot be determined with current data. Additional snapshots required.'
    }
};

// === PRESSURE CONTRIBUTOR ANALYSIS ===

/**
 * Analyze which factors contribute most to environmental instability.
 * @param {Object} metrics - Metrics from perception survey
 * @param {Array} perceptions - Array of perception records
 * @returns {Array} Contributors sorted by severity
 */
function analyzePressureContributors(metrics, perceptions) {
    const contributors = [];

    // Contradiction accumulation
    const totalContradictions = perceptions.reduce((sum, p) => sum + (p.observation_counts?.contradictions || 0), 0);
    const avgContradictionDensity = metrics.contradiction_density || 0;
    if (avgContradictionDensity > 0.5) {
        contributors.push({
            factor: 'contradiction_accumulation',
            severity: avgContradictionDensity > 1.0 ? 'HIGH' : 'MEDIUM',
            value: avgContradictionDensity,
            description: `Average contradiction density is ${avgContradictionDensity.toFixed(1)} per entity. Total contradictions observed: ${totalContradictions}.`,
            entity_count: perceptions.filter(p => (p.observation_counts?.contradictions || 0) > 0).length
        });
    }

    // Degraded entity persistence
    const degradedCount = (metrics.perception_distribution?.DEGRADED || 0);
    if (degradedCount > 0) {
        const degradedWithMultiple = perceptions.filter(p =>
            p.category === 'DEGRADED' && (p.observation_counts?.degraded_periods || 0) > 2
        ).length;
        contributors.push({
            factor: 'degraded_entity_persistence',
            severity: degradedWithMultiple > degradedCount * 0.5 ? 'HIGH' : 'MEDIUM',
            value: degradedCount,
            description: `${degradedCount} entity(ies) in DEGRADED state. ${degradedWithMultiple} have multiple degraded periods, indicating persistent degradation.`,
            entity_count: degradedCount
        });
    }

    // Stale evidence accumulation
    const avgStalePressure = metrics.stale_verification_pressure || 0;
    if (avgStalePressure > 0.5) {
        contributors.push({
            factor: 'stale_evidence_accumulation',
            severity: avgStalePressure > 1.5 ? 'HIGH' : 'MEDIUM',
            value: avgStalePressure,
            description: `Average stale verification pressure is ${avgStalePressure.toFixed(1)} per entity. Verification freshness is frequently compromised.`,
            entity_count: perceptions.filter(p => (p.observation_counts?.verification_failures || 0) > 0).length
        });
    }

    // Volatility clustering
    const volatileCount = metrics.volatile_entity_count || 0;
    if (volatileCount > 0) {
        contributors.push({
            factor: 'volatility_clustering',
            severity: volatileCount > 2 ? 'HIGH' : 'MEDIUM',
            value: volatileCount,
            description: `${volatileCount} entity(ies) in VOLATILE or CRITICAL_PATTERN state. Volatility clustering indicates environmental stress concentration.`,
            entity_count: volatileCount
        });
    }

    // Verification decay
    const totalVerificationFailures = perceptions.reduce((sum, p) =>
        sum + (p.observation_counts?.verification_failures || 0), 0);
    const totalVerifications = perceptions.reduce((sum, p) =>
        sum + (p.observation_counts?.occurrences || 0), 0);
    if (totalVerifications > 0 && totalVerificationFailures / totalVerifications > 0.3) {
        const failureRate = totalVerificationFailures / totalVerifications;
        contributors.push({
            factor: 'verification_decay',
            severity: failureRate > 0.5 ? 'HIGH' : 'MEDIUM',
            value: failureRate,
            description: `${Math.round(failureRate * 100)}% of verification attempts failed. Verification reliability is significantly compromised.`,
            entity_count: perceptions.filter(p => (p.observation_counts?.verification_failures || 0) > 0).length
        });
    }

    // Repeated state flips
    const totalFlips = perceptions.reduce((sum, p) =>
        sum + (p.observation_counts?.status_flips || 0), 0);
    if (totalFlips > 5) {
        contributors.push({
            factor: 'repeated_state_flips',
            severity: totalFlips > 15 ? 'HIGH' : 'MEDIUM',
            value: totalFlips,
            description: `${totalFlips} status flip(s) observed across environment. High flip rate indicates instability in entity state management.`,
            entity_count: perceptions.filter(p => (p.observation_counts?.status_flips || 0) > 0).length
        });
    }

    // Sort by severity
    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    contributors.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    return contributors;
}

// === ENVIRONMENTAL PRESSURE CLASSIFICATION ===

/**
 * Classify environmental pressure level from metrics.
 * @param {Object} metrics - Metrics from perception survey
 * @returns {Object} Pressure classification
 */
function classifyEnvironmentalPressure(metrics) {
    const volatileRatio = metrics.volatile_entity_count || 0;
    const degradedCount = (metrics.perception_distribution?.DEGRADED || 0) + (metrics.perception_distribution?.VOLATILE || 0) + (metrics.perception_distribution?.CRITICAL_PATTERN || 0);
    const totalEntities = Object.values(metrics.perception_distribution || {}).reduce((a, b) => a + b, 0) || 1;
    const problemRatio = degradedCount / totalEntities;
    const oscillationRate = metrics.oscillation_rate || 0;
    const contradictionDensity = metrics.contradiction_density || 0;
    const stalePressure = metrics.stale_verification_pressure || 0;

    // SEVERE conditions
    if (problemRatio >= 0.6 || volatileRatio >= 3 || (volatileRatio >= 2 && contradictionDensity >= 2.0)) {
        return { ...PRESSURE_LEVELS.SEVERE, raw_values: { problemRatio, volatileRatio, contradictionDensity } };
    }

    // HIGH conditions
    if (problemRatio >= 0.3 || volatileRatio >= 2 || contradictionDensity >= 1.5 || stalePressure >= 2.0) {
        return { ...PRESSURE_LEVELS.HIGH, raw_values: { problemRatio, volatileRatio, contradictionDensity } };
    }

    // ELEVATED conditions
    if (problemRatio >= 0.15 || volatileRatio >= 1 || contradictionDensity >= 0.8 || oscillationRate >= 0.3) {
        return { ...PRESSURE_LEVELS.ELEVATED, raw_values: { problemRatio, volatileRatio, contradictionDensity } };
    }

    // LOW — default
    return { ...PRESSURE_LEVELS.LOW, raw_values: { problemRatio, volatileRatio, contradictionDensity } };
}

// === AWARENESS LEVEL DETERMINATION ===

/**
 * Determine awareness level based on observation density.
 * @param {Object} metrics - Metrics from perception survey
 * @param {string} window - Observation window
 * @returns {Object} Awareness level
 */
function determineAwarenessLevel(metrics, window) {
    const entityCount = Object.values(metrics.perception_distribution || {}).reduce((a, b) => a + b, 0) || 0;
    const windowMs = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000 };
    const windowDuration = windowMs[window] || windowMs['24h'];

    // Awareness level based on coverage and observation density
    // More entities + longer window = higher awareness
    const coverageScore = Math.min(1, (entityCount / 10) * (windowDuration / windowMs['24h']));

    if (coverageScore >= 0.7 && entityCount >= 5) {
        return { ...AWARENESS_LEVELS.HIGH, coverage_score: coverageScore, entity_count: entityCount };
    }
    if (coverageScore >= 0.3 && entityCount >= 2) {
        return { ...AWARENESS_LEVELS.MEDIUM, coverage_score: coverageScore, entity_count: entityCount };
    }
    return { ...AWARENESS_LEVELS.LOW, coverage_score: coverageScore, entity_count: entityCount };
}

// === DOMINANT PATTERN EXTRACTION ===

/**
 * Extract dominant patterns from perceptions.
 * @param {Array} perceptions - Array of perception records
 * @returns {Array} Dominant patterns
 */
function extractDominantPatterns(perceptions) {
    const patterns = [];

    // Cluster by drift pattern
    const driftClusters = {};
    for (const p of perceptions) {
        const pattern = p.drift?.pattern || 'UNKNOWN';
        if (!driftClusters[pattern]) driftClusters[pattern] = [];
        driftClusters[pattern].push(p);
    }

    for (const [pattern, entities] of Object.entries(driftClusters)) {
        if (pattern === 'UNKNOWN' || pattern === 'INSUFFICIENT_DATA') continue;
        if (entities.length >= 1) {
            patterns.push({
                pattern_type: pattern,
                entity_count: entities.length,
                entities: entities.map(e => e.entity_id),
                description: `${pattern} affects ${entities.length} entity(ies). Examples: ${entities.slice(0, 2).map(e => e.entity_id).join(', ')}${entities.length > 2 ? '...' : ''}`
            });
        }
    }

    return patterns;
}

// === STABILITY SUMMARY ===

/**
 * Generate stability summary from perceptions and metrics.
 * @param {Array} perceptions - Array of perception records
 * @param {Object} metrics - Metrics from perception survey
 * @returns {Object} Stability summary
 */
function generateStabilitySummary(perceptions, metrics) {
    const dist = metrics.perception_distribution || {};
    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;

    const stableRatio = (dist.STABLE || 0) / total;
    const problemRatio = ((dist.DEGRADED || 0) + (dist.VOLATILE || 0) + (dist.CRITICAL_PATTERN || 0)) / total;

    const summary = {
        stable_ratio: Math.round(stableRatio * 100) / 100,
        problem_ratio: Math.round(problemRatio * 100) / 100,
        distribution: dist,
        dominant_state: getDominantCategory(dist),
        assessment: stableRatio >= 0.7 ? 'environment appears stable' :
                    stableRatio >= 0.4 ? 'environment is mixed — stable and unstable entities coexist' :
                    problemRatio >= 0.5 ? 'environment is predominantly unstable' :
                    'environment shows moderate instability'
    };

    return summary;
}

function getDominantCategory(dist) {
    let maxCat = 'STABLE';
    let maxCount = 0;
    for (const [cat, count] of Object.entries(dist)) {
        if (count > maxCount) {
            maxCount = count;
            maxCat = cat;
        }
    }
    return { category: maxCat, count: maxCount };
}

// === MAIN AWARENESS SNAPSHOT GENERATION ===

/**
 * Generate complete situational awareness snapshot.
 * @param {Object} perceptionResult - Result from runPerceptionSurvey()
 * @param {Object} previousSnapshot - Previous awareness snapshot (optional)
 * @returns {Object} Complete awareness snapshot
 */
function generateAwarenessSnapshot(perceptionResult, previousSnapshot = null) {
    const { window, entity_count, perceptions, metrics } = perceptionResult;

    // Classify pressure
    const pressure = classifyEnvironmentalPressure(metrics);

    // Determine awareness level
    const awarenessLevel = determineAwarenessLevel(metrics, window);

    // Extract dominant patterns
    const dominantPatterns = extractDominantPatterns(perceptions);

    // Generate stability summary
    const stabilitySummary = generateStabilitySummary(perceptions, metrics);

    // Analyze pressure contributors
    const pressureContributors = analyzePressureContributors(metrics, perceptions);

    // Compute temporal comparison
    const temporalComparison = compareWithPrevious(metrics, previousSnapshot);

    // Generate uncertainty summary
    const uncertaintySummary = generateUncertaintySummary(awarenessLevel, metrics, entity_count, window);

    // Build snapshot
    const snapshot = {
        awareness_level: awarenessLevel.level,
        environment_pressure: pressure.level,
        dominant_patterns: dominantPatterns,
        stability_summary: stabilitySummary,
        uncertainty_summary: uncertaintySummary,
        pressure_contributors: pressureContributors,
        temporal_comparison: temporalComparison,
        observation_window: window,
        entity_count,
        perception_metrics: {
            volatile_entity_count: metrics.volatile_entity_count,
            chronic_degradation_count: metrics.chronic_degradation_count,
            oscillation_rate: metrics.oscillation_rate,
            stale_verification_pressure: metrics.stale_verification_pressure,
            contradiction_density: metrics.contradiction_density,
            recovery_rate: metrics.recovery_rate,
            perception_distribution: metrics.perception_distribution
        },
        generated_at: new Date().toISOString(),
        shadow_only: true
    };

    return snapshot;
}

// === TEMPORAL COMPARISON ===

/**
 * Compare current metrics with previous snapshot.
 * @param {Object} currentMetrics - Current metrics
 * @param {Object} previousSnapshot - Previous awareness snapshot
 * @returns {Object} Temporal comparison result
 */
function compareWithPrevious(currentMetrics, previousSnapshot) {
    if (!previousSnapshot) {
        return {
            pattern: 'INSUFFICIENT_DATA',
            description: TEMPORAL_PATTERNS.INSUFFICIENT_DATA.description,
            interpretation: TEMPORAL_PATTERNS.INSUFFICIENT_DATA.interpretation
        };
    }

    const prevMetrics = previousSnapshot.perception_metrics;
    if (!prevMetrics) {
        return {
            pattern: 'INSUFFICIENT_DATA',
            description: TEMPORAL_PATTERNS.INSUFFICIENT_DATA.description,
            interpretation: TEMPORAL_PATTERNS.INSUFFICIENT_DATA.interpretation
        };
    }

    // Compute delta scores
    const currentProblemEntities = (currentMetrics.perception_distribution?.DEGRADED || 0) +
                                   (currentMetrics.perception_distribution?.VOLATILE || 0) +
                                   (currentMetrics.perception_distribution?.CRITICAL_PATTERN || 0);
    const prevProblemEntities = (prevMetrics.perception_distribution?.DEGRADED || 0) +
                                  (prevMetrics.perception_distribution?.VOLATILE || 0) +
                                  (prevMetrics.perception_distribution?.CRITICAL_PATTERN || 0);

    const currentVolatile = currentMetrics.volatile_entity_count || 0;
    const prevVolatile = prevMetrics.volatile_entity_count || 0;

    const currentContradictions = currentMetrics.contradiction_density || 0;
    const prevContradictions = prevMetrics.contradiction_density || 0;

    // Compare
    const entityDelta = currentProblemEntities - prevProblemEntities;
    const volatileDelta = currentVolatile - prevVolatile;
    const contradictionDelta = currentContradictions - prevContradictions;

    const totalDelta = entityDelta + volatileDelta * 0.5 + contradictionDelta * 0.3;

    // Check for oscillation (improving then deteriorating or vice versa)
    if (previousSnapshot.temporal_comparison &&
        ['IMPROVING', 'DETERIORATING'].includes(previousSnapshot.temporal_comparison.pattern)) {
        const prevTrend = previousSnapshot.temporal_comparison.pattern;
        if ((prevTrend === 'IMPROVING' && totalDelta > 0.2) ||
            (prevTrend === 'DETERIORATING' && totalDelta < -0.2)) {
            return {
                pattern: 'OSCILLATING',
                description: TEMPORAL_PATTERNS.OSCILLATING.description,
                interpretation: TEMPORAL_PATTERNS.OSCILLATING.interpretation,
                deltas: { entityDelta, volatileDelta, contradictionDelta }
            };
        }
    }

    // Directional assessment — require meaningful delta to classify
    // If deltas are all near zero, environment is effectively stable even if
    // a previous snapshot existed with different classification
    if (totalDelta < -0.5 && Math.abs(entityDelta) >= 1) {
        return {
            pattern: 'IMPROVING',
            description: TEMPORAL_PATTERNS.IMPROVING.description,
            interpretation: TEMPORAL_PATTERNS.IMPROVING.interpretation,
            deltas: { entityDelta, volatileDelta, contradictionDelta }
        };
    }
    if (totalDelta > 0.5 && Math.abs(entityDelta) >= 1) {
        return {
            pattern: 'DETERIORATING',
            description: TEMPORAL_PATTERNS.DETERIORATING.description,
            interpretation: TEMPORAL_PATTERNS.DETERIORATING.interpretation,
            deltas: { entityDelta, volatileDelta, contradictionDelta }
        };
    }

    // Near-zero deltas: environment is stable relative to previous snapshot
    return {
        pattern: 'STABLE',
        description: TEMPORAL_PATTERNS.STABLE.description,
        interpretation: TEMPORAL_PATTERNS.STABLE.interpretation,
        deltas: { entityDelta, volatileDelta, contradictionDelta }
    };
}

// === UNCERTAINTY SUMMARY ===

/**
 * Generate uncertainty summary for awareness snapshot.
 * @param {Object} awarenessLevel - Awareness level object
 * @param {Object} metrics - Metrics
 * @param {number} entityCount - Number of observed entities
 * @param {string} window - Observation window
 * @returns {Object} Uncertainty summary
 */
function generateUncertaintySummary(awarenessLevel, metrics, entityCount, window) {
    const factors = [];

    // Low coverage uncertainty
    if (awarenessLevel.level !== 'HIGH') {
        factors.push({
            factor: 'observation_coverage',
            impact: `${awarenessLevel.level} awareness level — only ${entityCount} entity(ies) observed in ${window} window. Confidence in environmental assessment is reduced.`
        });
    }

    // High oscillation uncertainty
    if (oscillationRate > 0.3) {
        factors.push({
            factor: 'oscillation_environment',
            impact: `Oscillation rate of ${metrics.oscillation_rate} indicates non-stable environment. Current snapshot may not represent typical conditions.`
        });
    }

    // High recovery uncertainty
    if ((metrics.recovery_rate || 0) > 0.3) {
        factors.push({
            factor: 'recovery_transient',
            impact: `${metrics.recovery_rate} of entities showing recovery patterns. Snapshot may reflect transient state rather than sustained conditions.`
        });
    }

    // Low entity count uncertainty
    if (entityCount < 3) {
        factors.push({
            factor: 'limited_entity_sample',
            impact: `Only ${entityCount} entities observed — insufficient sample for confident environmental classification. Results may not generalize to unobserved entities.`
        });
    }

    // No previous snapshot uncertainty
    factors.push({
        factor: 'snapshot_comparison_limitation',
        impact: 'Temporal comparison requires at least two snapshots. Current comparison capability is limited until snapshot history accumulates.'
    });

    return {
        awareness_level: awarenessLevel.level,
        confidence: awarenessLevel.level === 'HIGH' ? 'HIGH' : awarenessLevel.level === 'MEDIUM' ? 'MEDIUM' : 'LOW',
        factors,
        summary: awarenessLevel.level === 'HIGH'
            ? 'Environmental awareness is based on sufficient observation density. Confidence is high for current snapshot.'
            : awarenessLevel.level === 'MEDIUM'
            ? 'Environmental awareness is plausible but based on limited data. Confidence is moderate — additional observations would improve assessment.'
            : 'Environmental awareness is significantly limited by insufficient observation data. Confidence is low — current snapshot may not reliably represent true environmental state.'
    };
}

// === PERSISTENCE ===

/**
 * Load previous awareness snapshot.
 * @returns {Object|null} Previous snapshot or null
 */
function loadPreviousSnapshot() {
    try {
        if (!fs.existsSync(AWARENESS_FILE)) return null;
        const data = fs.readFileSync(AWARENESS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return null;
    }
}

/**
 * Save awareness snapshot with rolling retention.
 * @param {Object} snapshot - Awareness snapshot
 */
function saveSnapshot(snapshot) {
    try {
        // Write current snapshot
        fs.writeFileSync(AWARENESS_FILE, JSON.stringify(snapshot, null, 2));

        // Append to audit log
        const auditEntry = {
            timestamp: new Date().toISOString(),
            phase: 'MCAI-4C',
            audit_action: 'awareness_snapshot_generated',
            awareness_level: snapshot.awareness_level,
            environment_pressure: snapshot.environment_pressure,
            entity_count: snapshot.entity_count,
            window: snapshot.observation_window,
            temporal_pattern: snapshot.temporal_comparison?.pattern,
            ...snapshot
        };
        fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
    } catch (err) {
        console.error('[situational-awareness] Failed to save snapshot:', err.message);
    }
}

// === FULL PIPELINE ===

/**
 * Run full situational awareness pipeline.
 * @param {string} windowKey - Observation window (default: '24h')
 * @returns {Object} Complete awareness snapshot
 */
function runSituationalAwareness(windowKey = '24h') {
    // Import perception module (lazy to avoid circular)
    const { runPerceptionSurvey } = require('./priority-perception.js');

    // Generate perception data
    const perceptionResult = runPerceptionSurvey(windowKey);

    // Load previous snapshot
    const previousSnapshot = loadPreviousSnapshot();

    // Generate awareness snapshot
    const snapshot = generateAwarenessSnapshot(perceptionResult, previousSnapshot);

    // Persist
    saveSnapshot(snapshot);

    return snapshot;
}

module.exports = {
    runSituationalAwareness,
    generateAwarenessSnapshot,
    analyzePressureContributors,
    classifyEnvironmentalPressure,
    determineAwarenessLevel,
    extractDominantPatterns,
    generateStabilitySummary,
    generateUncertaintySummary,
    compareWithPrevious,
    loadPreviousSnapshot,
    saveSnapshot,
    PRESSURE_LEVELS,
    AWARENESS_LEVELS,
    TEMPORAL_PATTERNS
};