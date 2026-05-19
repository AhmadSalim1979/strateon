/**
 * Cognitive Pressure Mapping Layer — MCAI Phase 5A
 * SHADOW-ONLY: Observational pressure mapping without action authority
 * 
 * This module maps persistent operational pressure patterns across the environment.
 * It observes strain and pressure concentration — NOT what should be acted upon.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations. NO prioritization.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');
const PRESSURE_FILE = path.join(STATE_DIR, 'cognitive-pressure.json');
const SNAPSHOT_RETENTION = 30; // Rolling 30-snapshot window

// === PRESSURE CONCENTRATION CLASSIFICATIONS ===

const CONCENTRATION = {
    LOCALIZED: {
        classification: 'LOCALIZED',
        summary: 'Pressure is concentrated in few isolated entities.',
        description: 'Environmental strain is confined to a small number of entities with no apparent spread to other parts of the system. Pressure does not appear to be propagating across entity relationships.',
        interpretation: 'Localized pressure suggests isolated incidents rather than systemic stress. Few entities are affected and pressure does not appear to spread horizontally.',
        uncertainty_note: 'Localized classification may miss subtle inter-entity relationships. Pressure may be more widespread than observed if entities share unobserved dependencies.'
    },
    DISTRIBUTED: {
        classification: 'DISTRIBUTED',
        summary: 'Pressure is spread broadly across many entities.',
        description: 'Environmental strain is present across a wide range of entities with no single focal point. Pressure appears to affect large portions of the observed environment simultaneously.',
        interpretation: 'Distributed pressure suggests environmental stress conditions affecting many entities concurrently. This pattern may indicate external environmental factors as root cause.',
        uncertainty_note: 'Distributed classification may indicate environmental stress but does not identify root cause. All entities may be affected by a common external factor or may share a common dependency.'
    },
    CONCENTRATED: {
        classification: 'CONCENTRATED',
        summary: 'Pressure is concentrated in a specific subset of entities.',
        description: 'Environmental strain is focused in a specific cluster of related entities. These entities share observable patterns that suggest mutual causation or shared stress factors.',
        interpretation: 'Concentrated pressure suggests a focal source of strain affecting a specific subset. This pattern is more actionable for root-cause analysis but does not constitute a recommendation.',
        uncertainty_note: 'Concentrated classification is based on observable patterns. The identified cluster may not represent the true pressure source — correlation does not imply causation.'
    },
    SYSTEMIC: {
        classification: 'SYSTEMIC',
        summary: 'Pressure is pervasive across the entire observed environment.',
        description: 'Environmental strain is present in nearly all observed entities. Pressure patterns are consistent across the environment with high overlap and temporal synchronization.',
        interpretation: 'Systemic pressure indicates environmental-wide stress. This pattern may reflect cascading failures, environmental conditions, or fundamental infrastructure strain.',
        uncertainty_note: 'Systemic classification is the most severe strain level. Root cause may be environmental, infrastructural, or a single initial failure that propagated. Does not indicate what caused the systemic condition.'
    }
};

// === PRESSURE TRAJECTORY CLASSIFICATIONS ===

const TRAJECTORY = {
    ACCUMULATING: {
        pattern: 'ACCUMULATING',
        summary: 'Environmental strain is increasing over time.',
        description: 'Pressure mapping shows a consistent upward trend across recent snapshots. Strain is accumulating — more entities are affected and pressure levels are rising.',
        interpretation: 'Environment is experiencing growing strain. The trend is measurably upward but the underlying cause is not identified by this layer.',
        uncertainty_note: 'Accumulating trajectory may reflect external conditions that are changing. Do not assume linear continuation — accumulation rate may change or reverse.'
    },
    STABILIZING: {
        pattern: 'STABILIZING',
        summary: 'Environmental strain is decreasing over time.',
        description: 'Pressure mapping shows a consistent downward trend across recent snapshots. Strain is reducing — fewer entities are affected and pressure levels are declining.',
        interpretation: 'Environment is recovering from prior strain. Stabilization is observable but may be interrupted by future events.',
        uncertainty_note: 'Stabilizing trajectory may reflect temporary conditions. Do not assume sustained recovery — environmental conditions may reverse.'
    },
    DISPERSING: {
        pattern: 'DISPERSING',
        summary: 'Pressure concentration is spreading to new entities over time.',
        description: 'Pressure patterns show expansion to new entities while resolving in previously affected ones. Strain is distributing rather than accumulating or resolving.',
        interpretation: 'Pressure is migrating across the environment. Previously affected entities may be recovering while new entities become stressed.',
        uncertainty_note: 'Dispersing trajectory suggests pressure migration rather than resolution or accumulation. May indicate complex feedback dynamics.'
    },
    OSCILLATING: {
        pattern: 'OSCILLATING',
        summary: 'Environmental strain alternates between improvement and deterioration.',
        description: 'Pressure mapping shows no clear directional trend. Strain oscillates — improving in some periods and deteriorating in others.',
        interpretation: 'Environment is in a cyclic strain pattern with alternating phases. No sustained improvement or deterioration is observable.',
        uncertainty_note: 'Oscillating trajectory does not indicate when the next cycle peak or trough will occur. Pattern may continue indefinitely or may transition to a directional trend.'
    },
    INDETERMINATE: {
        pattern: 'INDETERMINATE',
        summary: 'Insufficient snapshot history to determine trajectory.',
        description: 'Fewer than 3 pressure snapshots are available for trend analysis. Trajectory cannot be determined with current data.',
        interpretation: 'Trajectory analysis requires historical snapshots. Current data is insufficient for directional classification.',
        uncertainty_note: 'INDETERMINATE is a data limitation, not a stability statement. Trajectory may be any of the other patterns — cannot determine with available data.'
    }
};

// === PERSISTENT PRESSURE SIGNAL DETECTION ===

/**
 * Detect persistent pressure signals across entity observations.
 * @param {Array} perceptions - Array of perception records
 * @param {number} windowDays - Analysis window in days
 * @returns {Object} Persistent pressure signals
 */
function detectPersistentPressureSignals(perceptions, windowDays = 7) {
    const signals = {
        recurring_instability: [],
        chronic_degradation: [],
        verification_decay_accumulation: [],
        contradiction_clustering: [],
        repeated_state_volatility: [],
        unresolved_uncertainty_persistence: [],
        oscillation_concentration: [],
        stale_evidence_accumulation: []
    };

    // Recurring instability: entities with ESCALATING_INSTABILITY drift in multiple observations
    const driftByEntity = {};
    for (const p of perceptions) {
        if (!driftByEntity[p.entity_id]) driftByEntity[p.entity_id] = [];
        driftByEntity[p.entity_id].push(p.drift?.pattern);
    }

    for (const [entityId, drifts] of Object.entries(driftByEntity)) {
        const escalatingCount = drifts.filter(d => d === 'ESCALATING_INSTABILITY').length;
        if (escalatingCount >= 2) {
            signals.recurring_instability.push({
                entity_id: entityId,
                count: escalatingCount,
                description: `${entityId} shows ESCALATING_INSTABILITY in ${escalatingCount} of ${drifts.length} observations.`
            });
        }

        const oscillatingCount = drifts.filter(d => d === 'OSCILLATING').length;
        if (oscillatingCount >= 2) {
            signals.oscillation_concentration.push({
                entity_id: entityId,
                count: oscillatingCount,
                description: `${entityId} shows OSCILLATING drift in ${oscillatingCount} of ${drifts.length} observations.`
            });
        }
    }

    // Chronic degradation: entities in DEGRADED state with multiple degraded periods
    for (const p of perceptions) {
        if (p.category === 'DEGRADED' && (p.observation_counts?.degraded_periods || 0) >= 3) {
            signals.chronic_degradation.push({
                entity_id: p.entity_id,
                degraded_periods: p.observation_counts.degraded_periods,
                description: `${p.entity_id} has been in DEGRADED state for ${p.observation_counts.degraded_periods} periods.`
            });
        }
    }

    // Verification decay accumulation: entities with high verification failure rate
    for (const p of perceptions) {
        const failRate = p.observation_counts?.verification_failures || 0;
        const total = p.observation_counts?.occurrences || 1;
        if (failRate / total > 0.4 && failRate >= 2) {
            signals.verification_decay_accumulation.push({
                entity_id: p.entity_id,
                failure_rate: Math.round(failRate / total * 100),
                failures: failRate,
                description: `${p.entity_id} has ${failRate} verification failures (${Math.round(failRate/total*100)}% failure rate).`
            });
        }
    }

    // Contradiction clustering: entities with contradictions
    for (const p of perceptions) {
        if ((p.observation_counts?.contradictions || 0) >= 2) {
            signals.contradiction_clustering.push({
                entity_id: p.entity_id,
                contradictions: p.observation_counts.contradictions,
                description: `${p.entity_id} has ${p.observation_counts.contradictions} contradictions.`
            });
        }
    }

    // Repeated state volatility: entities with high status flip count
    for (const p of perceptions) {
        if ((p.observation_counts?.status_flips || 0) >= 3) {
            signals.repeated_state_volatility.push({
                entity_id: p.entity_id,
                flips: p.observation_counts.status_flips,
                description: `${p.entity_id} has ${p.observation_counts.status_flips} status flips.`
            });
        }
    }

    // Stale evidence accumulation: entities with stale verification
    for (const p of perceptions) {
        const staleCount = (p.observation_counts?.verification_failures || 0);
        if (staleCount >= 3) {
            signals.stale_evidence_accumulation.push({
                entity_id: p.entity_id,
                stale_count: staleCount,
                description: `${p.entity_id} has accumulated ${staleCount} stale verification events.`
            });
        }
    }

    return signals;
}

// === CLUSTER DETECTION ===

/**
 * Detect clusters of related instability.
 * @param {Array} perceptions - Array of perception records
 * @returns {Object} Detected clusters
 */
function detectClusters(perceptions) {
    const clusters = [];

    // Cluster 1: Shared drift patterns
    const driftClusters = {};
    for (const p of perceptions) {
        const pattern = p.drift?.pattern || 'UNKNOWN';
        if (!driftClusters[pattern]) driftClusters[pattern] = [];
        driftClusters[pattern].push(p.entity_id);
    }

    for (const [pattern, entities] of Object.entries(driftClusters)) {
        if (pattern === 'UNKNOWN' || pattern === 'INSUFFICIENT_DATA' || entities.length < 2) continue;
        clusters.push({
            cluster_type: 'shared_drift_pattern',
            pattern,
            entities,
            entity_count: entities.length,
            description: `${entities.length} entities share ${pattern} drift pattern. Examples: ${entities.slice(0, 3).join(', ')}`
        });
    }

    // Cluster 2: Synchronized degradation — same category and similar scores
    const categoryGroups = {};
    for (const p of perceptions) {
        if (!categoryGroups[p.category]) categoryGroups[p.category] = [];
        categoryGroups[p.category].push(p);
    }

    for (const [category, group] of Object.entries(categoryGroups)) {
        if (group.length >= 2 && ['DEGRADED', 'VOLATILE', 'CRITICAL_PATTERN'].includes(category)) {
            const scoreRange = Math.max(...group.map(p => p.score)) - Math.min(...group.map(p => p.score));
            if (scoreRange < 0.3) {
                clusters.push({
                    cluster_type: 'synchronized_degradation',
                    category,
                    entities: group.map(p => p.entity_id),
                    entity_count: group.length,
                    avg_score: Math.round(group.reduce((sum, p) => sum + p.score, 0) / group.length * 1000) / 1000,
                    description: `${group.length} entities in ${category} state with similar scores (avg: ${scoreRange.toFixed(3)} range).`
                });
            }
        }
    }

    // Cluster 3: Temporal overlap — entities with observation overlap
    const timeClusterEntities = perceptions.filter(p =>
        p.observation_counts?.degraded_periods >= 2 || p.observation_counts?.status_flips >= 2
    );
    if (timeClusterEntities.length >= 2) {
        clusters.push({
            cluster_type: 'temporal_overlap',
            entities: timeClusterEntities.map(p => p.entity_id),
            entity_count: timeClusterEntities.length,
            description: `${timeClusterEntities.length} entities show temporal instability overlap (degraded periods + status flips).`
        });
    }

    return clusters;
}

// === PRESSURE CONCENTRATION SCORING ===

/**
 * Score environmental pressure concentration.
 * @param {Array} perceptions - Array of perception records
 * @param {Object} signals - Persistent pressure signals
 * @param {Object} clusters - Detected clusters
 * @returns {Object} Concentration classification
 */
function scorePressureConcentration(perceptions, signals, clusters) {
    const totalEntities = perceptions.length || 1;

    // Count affected entities across all signals
    const allAffected = new Set([
        ...signals.recurring_instability.map(s => s.entity_id),
        ...signals.chronic_degradation.map(s => s.entity_id),
        ...signals.verification_decay_accumulation.map(s => s.entity_id),
        ...signals.contradiction_clustering.map(s => s.entity_id),
        ...signals.repeated_state_volatility.map(s => s.entity_id),
        ...signals.stale_evidence_accumulation.map(s => s.entity_id)
    ]);
    const affectedCount = allAffected.size || 1;

    // Check cluster count
    const clusterEntities = new Set(clusters.flatMap(c => c.entities || []));
    const clusterCount = clusters.length;

    // Check problem entity ratio
    const problemEntities = perceptions.filter(p =>
        ['DEGRADED', 'VOLATILE', 'CRITICAL_PATTERN'].includes(p.category)
    ).length;
    const problemRatio = problemEntities / totalEntities;

    // Determine concentration
    if (problemRatio >= 0.7 && clusterCount >= 3) {
        return { ...CONCENTRATION.SYSTEMIC, affected_ratio: Math.round(problemRatio * 100) / 100 };
    }
    if (problemRatio >= 0.4 && clusterCount >= 2) {
        return { ...CONCENTRATION.CONCENTRATED, affected_ratio: Math.round(problemRatio * 100) / 100 };
    }
    if (affectedCount >= totalEntities * 0.6) {
        return { ...CONCENTRATION.DISTRIBUTED, affected_ratio: Math.round(problemRatio * 100) / 100 };
    }
    return { ...CONCENTRATION.LOCALIZED, affected_ratio: Math.round(problemRatio * 100) / 100 };
}

// === PRESSURE TRAJECTORY ANALYSIS ===

/**
 * Analyze pressure trajectory from snapshot history.
 * @param {Array} snapshots - Array of previous pressure snapshots
 * @returns {Object} Trajectory classification
 */
function analyzePressureTrajectory(snapshots) {
    if (snapshots.length < 3) {
        return {
            ...TRAJECTORY.INDETERMINATE,
            snapshot_count: snapshots.length
        };
    }

    // Use last 7 snapshots for trajectory
    const recent = snapshots.slice(-7);
    const problemCounts = recent.map(s => {
        const dist = s.perception_metrics?.perception_distribution || {};
        return (dist.DEGRADED || 0) + (dist.VOLATILE || 0) + (dist.CRITICAL_PATTERN || 0);
    });

    // Compare first half to second half
    const mid = Math.floor(problemCounts.length / 2);
    const firstHalfAvg = problemCounts.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalfAvg = problemCounts.slice(mid).reduce((a, b) => a + b, 0) / (problemCounts.length - mid);

    const delta = secondHalfAvg - firstHalfAvg;

    // Check for oscillation (alternating direction changes)
    const directionChanges = countDirectionChanges(problemCounts);
    const variance = computeVariance(problemCounts);
    const mean = problemCounts.reduce((a, b) => a + b, 0) / problemCounts.length;
    const relStdDev = Math.sqrt(variance) / Math.max(mean, 1);

    // Oscillation: high variance with alternating directions
    if (relStdDev > 0.3 && directionChanges >= 3) {
        return {
            ...TRAJECTORY.OSCILLATING,
            delta: Math.round(delta * 100) / 100,
            direction_changes: directionChanges
        };
    }

    // Directional classification
    if (delta < -0.5) {
        return {
            ...TRAJECTORY.STABILIZING,
            delta: Math.round(delta * 100) / 100,
            direction_changes: directionChanges
        };
    }
    if (delta > 0.5) {
        return {
            ...TRAJECTORY.ACCUMULATING,
            delta: Math.round(delta * 100) / 100,
            direction_changes: directionChanges
        };
    }

    // Dispersing: variance is high but no clear direction
    if (relStdDev > 0.2) {
        return {
            ...TRAJECTORY.DISPERSING,
            delta: Math.round(delta * 100) / 100,
            direction_changes: directionChanges
        };
    }

    return {
        ...TRAJECTORY.INDETERMINATE,
        delta: Math.round(delta * 100) / 100,
        direction_changes: directionChanges
    };
}

function countDirectionChanges(arr) {
    if (arr.length < 3) return 0;
    let changes = 0, lastDir = null;
    for (let i = 1; i < arr.length; i++) {
        const diff = arr[i] - arr[i-1];
        const dir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
        if (dir !== 'flat' && lastDir !== null && dir !== lastDir) changes++;
        if (dir !== 'flat') lastDir = dir;
    }
    return changes;
}

function computeVariance(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length;
}

// === STRAIN MAP GENERATION ===

/**
 * Generate complete environmental strain map.
 * @param {Object} awarenessSnapshot - Current awareness snapshot
 * @param {Array} snapshotHistory - Previous pressure snapshots
 * @param {Object} persistentSignals - Persistent pressure signals
 * @param {Object} clusters - Detected clusters
 * @param {Object} concentration - Concentration classification
 * @param {Object} trajectory - Trajectory classification
 * @returns {Object} Complete strain map
 */
function generateStrainMap(awarenessSnapshot, snapshotHistory, persistentSignals, clusters, concentration, trajectory) {
    const dist = awarenessSnapshot.perception_metrics?.perception_distribution || {};

    // Identify chronic entities
    const chronicEntities = [
        ...persistentSignals.chronic_degradation.map(s => s.entity_id),
        ...persistentSignals.recurring_instability.map(s => s.entity_id),
        ...persistentSignals.verification_decay_accumulation.filter(s => s.failure_rate > 60).map(s => s.entity_id)
    ];

    // Identify unstable clusters
    const unstableClusters = clusters.filter(c =>
        ['synchronized_degradation', 'temporal_overlap'].includes(c.cluster_type)
    );

    // Identify recurring patterns
    const recurringPatterns = [
        ...persistentSignals.recurring_instability.map(s => ({ type: 'recurring_instability', entity: s.entity_id, count: s.count })),
        ...persistentSignals.oscillation_concentration.map(s => ({ type: 'oscillation_concentration', entity: s.entity_id, count: s.count }))
    ];

    // Count unresolved pressure
    const unresolvedCount =
        persistentSignals.recurring_instability.length +
        persistentSignals.chronic_degradation.length +
        persistentSignals.verification_decay_accumulation.length +
        persistentSignals.contradiction_clustering.length;

    // Generate assessment
    const problemCount = (dist.DEGRADED || 0) + (dist.VOLATILE || 0) + (dist.CRITICAL_PATTERN || 0);
    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
    const problemRatio = problemCount / total;

    let environmental_assessment;
    if (problemRatio >= 0.6) {
        environmental_assessment = 'Environment is under severe systemic strain. Widespread pressure affecting majority of entities. Trajectory indicates sustained stress conditions.';
    } else if (problemRatio >= 0.3) {
        environmental_assessment = 'Environment is under moderate to high strain. Significant pressure concentration in specific areas. Resolution requires observation of underlying patterns.';
    } else if (problemRatio >= 0.15) {
        environmental_assessment = 'Environment is under mild strain. Pressure is present but contained. Continued observation is warranted.';
    } else {
        environmental_assessment = 'Environment is under minimal strain. Most entities are stable. Pressure signals are isolated and non-critical.';
    }

    // Generate uncertainty boundaries
    const uncertainty_boundaries = [];

    if (snapshotHistory.length < 3) {
        uncertainty_boundaries.push({
            factor: 'insufficient_snapshot_history',
            impact: 'Trajectory analysis requires at least 3 snapshots. Current trajectory is INDETERMINATE due to insufficient history.'
        });
    }

    if (total < 3) {
        uncertainty_boundaries.push({
            factor: 'limited_entity_sample',
            impact: `Only ${total} entities observed. Pressure mapping confidence is reduced — may not reflect true environmental strain.`
        });
    }

    if (clusters.length === 0 && problemCount > 0) {
        uncertainty_boundaries.push({
            factor: 'no_cluster_detected',
            impact: 'No clusters detected despite pressure presence. Pressure may be distributed in ways not captured by current clustering logic.'
        });
    }

    if (trajectory.pattern === 'INDETERMINATE') {
        uncertainty_boundaries.push({
            factor: 'trajectory_indeterminate',
            impact: 'Pressure trajectory cannot be determined with current snapshot history. Additional snapshots needed for directional classification.'
        });
    }

    if (persistentSignals.contradiction_clustering.length > persistentSignals.recurring_instability.length * 2) {
        uncertainty_boundaries.push({
            factor: 'contradiction_dominance',
            impact: 'High contradiction density relative to other signals. May indicate information quality issues rather than operational strain.'
        });
    }

    return {
        strain_level: problemRatio >= 0.6 ? 'SEVERE' : problemRatio >= 0.3 ? 'HIGH' : problemRatio >= 0.15 ? 'MODERATE' : 'LOW',
        pressure_distribution: {
            stable_ratio: Math.round((dist.STABLE || 0) / total * 100) / 100,
            problem_ratio: Math.round(problemRatio * 100) / 100,
            problem_breakdown: {
                degraded: dist.DEGRADED || 0,
                volatile: dist.VOLATILE || 0,
                critical: dist.CRITICAL_PATTERN || 0
            }
        },
        chronic_entities: [...new Set(chronicEntities)],
        unstable_clusters: unstableClusters.map(c => ({
            type: c.cluster_type,
            entity_count: c.entity_count,
            description: c.description
        })),
        recurring_patterns,
        unresolved_pressure_count: unresolvedCount,
        environmental_assessment,
        uncertainty_boundaries,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };
}

// === PRESSURE PERSISTENCE TRACKING ===

/**
 * Track pressure persistence for specific entities.
 * @param {Array} perceptions - Current perceptions
 * @param {Array} snapshotHistory - Historical snapshots
 * @returns {Object} Persistence tracking
 */
function trackPressurePersistence(perceptions, snapshotHistory) {
    const persistence = {
        persistent_entities: [],
        stabilization_attempts: [],
        recovery_interruption_count: 0
    };

    if (snapshotHistory.length < 2) {
        return persistence;
    }

    // Track entity-level persistence
    const entityHistory = {};
    for (const snap of snapshotHistory.slice(-7)) {
        for (const p of (snap.perceptions || [])) {
            if (!entityHistory[p.entity_id]) entityHistory[p.entity_id] = [];
            entityHistory[p.entity_id].push({
                category: p.category,
                score: p.score,
                timestamp: snap.generated_at
            });
        }
    }

    for (const [entityId, history] of Object.entries(entityHistory)) {
        if (history.length < 3) continue;

        // Check for persistent degradation
        const problemHistory = history.filter(h => ['DEGRADED', 'VOLATILE', 'CRITICAL_PATTERN'].includes(h.category));
        if (problemHistory.length >= 3 && problemHistory.length / history.length >= 0.6) {
            persistence.persistent_entities.push({
                entity_id: entityId,
                persistence_duration: problemHistory.length,
                total_observations: history.length,
                persistence_ratio: Math.round(problemHistory.length / history.length * 100) / 100,
                description: `${entityId} has been in problem state for ${problemHistory.length} of ${history.length} observations (${Math.round(problemHistory.length/history.length*100)}% persistence).`
            });
        }

        // Check for stabilization attempts (improving then degrading again)
        if (history.length >= 4) {
            const categories = history.map(h => h.category);
            const degradesAt = categories.findIndex(c => ['DEGRADED', 'VOLATILE', 'CRITICAL_PATTERN'].includes(c));
            const recoversAt = degradesAt >= 0
                ? categories.slice(degradesAt + 1).findIndex(c => ['STABLE', 'WATCH'].includes(c))
                : -1;
            const degradesAgainAt = recoversAt >= 0
                ? categories.slice(degradesAt + recoversAt + 2).findIndex(c => ['DEGRADED', 'VOLATILE', 'CRITICAL_PATTERN'].includes(c))
                : -1;

            if (degradesAt >= 0 && degradesAgainAt >= 0) {
                persistence.stabilization_attempts.push({
                    entity_id: entityId,
                    degraded_at: degradesAt,
                    recovered_at: degradesAt + recoversAt + 1,
                    degraded_again_at: degradesAt + recoversAt + degradesAgainAt + 2,
                    description: `${entityId} attempted stabilization at observation ${degradesAt} but degraded again by observation ${degradesAt + recoversAt + degradesAgainAt + 2}.`
                });
                persistence.recovery_interruption_count++;
            }
        }
    }

    return persistence;
}

// === PERSISTENCE ===

const PRESSURE_HISTORY_FILE = path.join(STATE_DIR, 'cognitive-pressure-history.jsonl');

function loadPressureHistory() {
    try {
        if (!fs.existsSync(PRESSURE_HISTORY_FILE)) return [];
        const raw = fs.readFileSync(PRESSURE_HISTORY_FILE, 'utf8');
        return raw.trim().split('\n').filter(Boolean).map(l => {
            try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);
    } catch {
        return [];
    }
}

function appendPressureSnapshot(snapshot) {
    try {
        fs.appendFileSync(PRESSURE_HISTORY_FILE, JSON.stringify(snapshot) + '\n');

        // Enforce rolling retention
        const history = loadPressureHistory();
        if (history.length > SNAPSHOT_RETENTION) {
            const trimmed = history.slice(-SNAPSHOT_RETENTION);
            fs.writeFileSync(PRESSURE_HISTORY_FILE, trimmed.map(s => JSON.stringify(s)).join('\n') + '\n');
        }
    } catch (err) {
        console.error('[cognitive-pressure] Failed to append snapshot:', err.message);
    }
}

function saveStrainMap(strainMap) {
    try {
        fs.writeFileSync(PRESSURE_FILE, JSON.stringify(strainMap, null, 2));
    } catch (err) {
        console.error('[cognitive-pressure] Failed to save strain map:', err.message);
    }
}

function logAuditEvent(strainMap) {
    try {
        const entry = {
            timestamp: new Date().toISOString(),
            phase: 'MCAI-5A',
            audit_action: 'strain_map_generated',
            strain_level: strainMap.strain_level,
            unresolved_pressure_count: strainMap.unresolved_pressure_count,
            chronic_entity_count: strainMap.chronic_entities.length,
            ...strainMap
        };
        fs.appendFileSync(AUDIT_LOG, JSON.stringify(entry) + '\n');
    } catch (err) {
        console.error('[cognitive-pressure] Audit log failed:', err.message);
    }
}

// === FULL PIPELINE ===

/**
 * Run full cognitive pressure mapping pipeline.
 * @param {Object} awarenessSnapshot - Current awareness snapshot from Phase 4C
 * @returns {Object} Complete strain map
 */
function runCognitivePressureMapping(awarenessSnapshot) {
    const perceptions = awarenessSnapshot.perceptions || [];
    const snapshotHistory = loadPressureHistory();

    // Step 1: Detect persistent pressure signals
    const persistentSignals = detectPersistentPressureSignals(perceptions);

    // Step 2: Detect clusters
    const clusters = detectClusters(perceptions);

    // Step 3: Score pressure concentration
    const concentration = scorePressureConcentration(perceptions, persistentSignals, clusters);

    // Step 4: Analyze trajectory
    const trajectory = analyzePressureTrajectory(snapshotHistory);

    // Step 5: Track persistence
    const persistence = trackPressurePersistence(perceptions, snapshotHistory);

    // Step 6: Generate strain map
    const strainMap = generateStrainMap(
        awarenessSnapshot,
        snapshotHistory,
        persistentSignals,
        clusters,
        concentration,
        trajectory
    );

    // Add concentration and trajectory to strain map
    strainMap.pressure_concentration = {
        classification: concentration.classification,
        summary: concentration.summary,
        affected_ratio: concentration.affected_ratio
    };
    strainMap.pressure_trajectory = {
        pattern: trajectory.pattern,
        summary: trajectory.summary,
        delta: trajectory.delta,
        direction_changes: trajectory.direction_changes
    };
    strainMap.persistence_tracking = {
        persistent_entity_count: persistence.persistent_entities.length,
        stabilization_attempt_count: persistence.stabilization_attempts.length,
        recovery_interruption_count: persistence.recovery_interruption_count,
        persistent_entities: persistence.persistent_entities.slice(0, 10)
    };

    // Step 7: Persist
    saveStrainMap(strainMap);
    appendPressureSnapshot(strainMap);
    logAuditEvent(strainMap);

    return strainMap;
}

module.exports = {
    runCognitivePressureMapping,
    detectPersistentPressureSignals,
    detectClusters,
    scorePressureConcentration,
    analyzePressureTrajectory,
    generateStrainMap,
    trackPressurePersistence,
    loadPressureHistory,
    saveStrainMap,
    CONCENTRATION,
    TRAJECTORY
};