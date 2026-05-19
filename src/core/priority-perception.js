/**
 * Priority Perception Layer — MCAI Phase 4A
 * SHADOW-ONLY: Observation without action authority
 * 
 * This module tracks perceived operational significance — NOT prioritization.
 * The system learns to NOTICE what appears important over time.
 * It does NOT decide what to do about it.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations.
 * 
 * Categories: STABLE | WATCH | DEGRADED | VOLATILE | CRITICAL_PATTERN
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');

// Perception log (append-only)
const PERCEPTION_LOG = path.join(STATE_DIR, 'priority-perception.jsonl');

// Audit log (append-only)
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

// Observation windows in milliseconds
const WINDOWS = {
    '1h':  3600000,
    '6h':  21600000,
    '24h': 86400000,
    '7d':  604800000
};

// Categories
const CATEGORIES = {
    STABLE: 'STABLE',
    WATCH: 'WATCH',
    DEGRADED: 'DEGRADED',
    VOLATILE: 'VOLATILE',
    CRITICAL_PATTERN: 'CRITICAL_PATTERN'
};

// Observation-only scoring weights (NOT influencing behavior — purely observational)
const SCORE_WEIGHTS = {
    recurrence_frequency: 0.25,
    instability_persistence: 0.30,
    contradiction_density: 0.20,
    stale_evidence_accumulation: 0.15,
    verification_failure_recurrence: 0.10
};

// === UTILITY FUNCTIONS ===

function now() {
    return Date.now();
}

function getWindowMs(windowKey) {
    return WINDOWS[windowKey] || WINDOWS['24h'];
}

function countDirectionChanges(arr) {
    if (arr.length < 3) return 0;
    let changes = 0;
    let lastDir = null;
    for (let i = 1; i < arr.length; i++) {
        const diff = arr[i] - arr[i-1];
        const dir = diff > 0 ? 'up' : (diff < 0 ? 'down' : 'flat');
        if (dir !== 'flat' && lastDir !== null && dir !== lastDir) {
            changes++;
        }
        if (dir !== 'flat') lastDir = dir;
    }
    return changes;
}

function isMonotoneIncreasing(arr) {
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] <= arr[i-1]) return false;
    }
    return true;
}

function isMonotoneDecreasing(arr) {
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] >= arr[i-1]) return false;
    }
    return true;
}

// === PERCEPTION LOG FUNCTIONS ===

function logPerception(record) {
    const entry = {
        timestamp: new Date().toISOString(),
        phase: 'MCAI-4A',
        source: 'priority-perception',
        ...record
    };
    try {
        fs.appendFileSync(PERCEPTION_LOG, JSON.stringify(entry) + '\n');
    } catch (err) {
        console.error('[priority-perception] Failed to log perception:', err.message);
    }
}

function logAudit(action, data) {
    const entry = {
        timestamp: new Date().toISOString(),
        phase: 'MCAI-4A',
        audit_action: action,
        ...data
    };
    try {
        fs.appendFileSync(AUDIT_LOG, JSON.stringify(entry) + '\n');
    } catch (err) {
        console.error('[priority-perception] Audit log failed:', err.message);
    }
}

function getWindow(windowKey) {
    const ms = getWindowMs(windowKey);
    const cutoff = now() - ms;
    return records => records.filter(r => new Date(r.timestamp).getTime() > cutoff);
}

// === CONTINUITY INTEGRATION (READ-ONLY) ===

function loadTemporalContinuity(windowKey) {
    const tcFile = path.join(STATE_DIR, 'temporal-continuity.jsonl');
    try {
        if (!fs.existsSync(tcFile)) return [];
        const raw = fs.readFileSync(tcFile, 'utf8');
        const records = raw.trim().split('\n').filter(Boolean).map(l => {
            try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);
        return getWindow(windowKey)(records);
    } catch {
        return [];
    }
}

function loadBeliefRegistry() {
    const beliefFile = path.join(STATE_DIR, 'belief-registry.jsonl');
    try {
        if (!fs.existsSync(beliefFile)) return { beliefs: {} };
        const raw = fs.readFileSync(beliefFile, 'utf8');
        return JSON.parse(raw);
    } catch {
        return { beliefs: {} };
    }
}

function loadVerificationLog(windowKey) {
    const verifyFile = path.join(STATE_DIR, 'verification-log.jsonl');
    try {
        if (!fs.existsSync(verifyFile)) return [];
        const raw = fs.readFileSync(verifyFile, 'utf8');
        const records = raw.trim().split('\n').filter(Boolean).map(l => {
            try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);
        return getWindow(windowKey)(records);
    } catch {
        return [];
    }
}

function loadCommitments(windowKey) {
    const commitFile = path.join(STATE_DIR, 'commitments.jsonl');
    try {
        if (!fs.existsSync(commitFile)) return [];
        const raw = fs.readFileSync(commitFile, 'utf8');
        const records = raw.trim().split('\n').filter(Boolean).map(l => {
            try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);
        return getWindow(windowKey)(records);
    } catch {
        return [];
    }
}

// === OBSERVATIONAL SCORING (NO BEHAVIORAL INFLUENCE) ===

function computeObservationalScore(entityObservations) {
    const breakdown = {
        recurrence_frequency: 0,
        instability_persistence: 0,
        contradiction_density: 0,
        stale_evidence_accumulation: 0,
        verification_failure_recurrence: 0
    };

    const obs = entityObservations;

    breakdown.recurrence_frequency = Math.min(1, (obs.occurrences || 0) / 20);
    breakdown.instability_persistence = obs.total_state_changes > 0
        ? Math.min(1, obs.unstable_state_changes / obs.total_state_changes)
        : 0;
    breakdown.contradiction_density = obs.total_observations > 0
        ? Math.min(1, obs.contradictions / obs.total_observations)
        : 0;
    breakdown.stale_evidence_accumulation = obs.total_verifications > 0
        ? Math.min(1, obs.stale_verifications / obs.total_verifications)
        : 0;
    breakdown.verification_failure_recurrence = obs.total_verifications > 0
        ? Math.min(1, obs.verification_failures / obs.total_verifications)
        : 0;

    const score = Object.keys(SCORE_WEIGHTS).reduce((sum, key) => {
        return sum + (breakdown[key] * SCORE_WEIGHTS[key]);
    }, 0);

    return {
        score: Math.round(score * 1000) / 1000,
        breakdown,
        computed_at: new Date().toISOString()
    };
}

function assignCategory(score, flags = {}) {
    if (flags.critical_pattern) return CATEGORIES.CRITICAL_PATTERN;
    if (score >= 0.7) return CATEGORIES.VOLATILE;
    if (score >= 0.4) return CATEGORIES.DEGRADED;
    if (score >= 0.2) return CATEGORIES.WATCH;
    return CATEGORIES.STABLE;
}

// === DRIFT DETECTION (OBSERVATIONAL ONLY) ===

function detectDrift(historicalScores) {
    if (!historicalScores || historicalScores.length === 0) {
        return { pattern: 'INSUFFICIENT_DATA', trend: null, delta: 0 };
    }

    const n = historicalScores.length;

    // Fewer than 3 points: no meaningful trend
    if (n < 3) {
        return { pattern: 'INSUFFICIENT_DATA', trend: null, delta: 0 };
    }

    // Short sequences (3-4 pts): use direct monotone analysis
    if (n === 3 || n === 4) {
        if (isMonotoneIncreasing(historicalScores)) {
            return { pattern: 'ESCALATING_INSTABILITY', trend: 'up',
                delta: Math.round((historicalScores[n-1] - historicalScores[0]) * 1000) / 1000 };
        }
        if (isMonotoneDecreasing(historicalScores)) {
            return { pattern: 'RECOVERING_STABILITY', trend: 'down',
                delta: Math.round((historicalScores[0] - historicalScores[n-1]) * 1000) / 1000 };
        }
        // Non-monotone short sequence — check for oscillation
        const oscWindow = historicalScores.slice(-Math.min(4, n));
        const avgOsc = oscWindow.reduce((a, b) => a + b, 0) / oscWindow.length;
        const stdDevOsc = Math.sqrt(oscWindow.reduce((s, v) => s + Math.pow(v - avgOsc, 2), 0) / oscWindow.length);
        const dcOsc = countDirectionChanges(oscWindow);
        if (stdDevOsc > 0.20 && dcOsc >= 2) {
            return { pattern: 'OSCILLATING', trend: 'oscillating', delta: 0 };
        }
        return { pattern: 'STABLE_TREND', trend: 'stable', delta: 0 };
    }

    // 5+ points: oscillation check using recent window
    const oscillWindow = historicalScores.slice(-Math.min(7, n));
    const avgOsc = oscillWindow.reduce((a, b) => a + b, 0) / oscillWindow.length;
    const varianceOsc = oscillWindow.reduce((s, v) => s + Math.pow(v - avgOsc, 2), 0) / oscillWindow.length;
    const stdDevOsc = Math.sqrt(varianceOsc);
    const dcOsc = countDirectionChanges(oscillWindow);

    // Oscillation: high variance AND actual direction changes (not monotone)
    // Monotone = direction changes < 2
    const isMonotone = dcOsc < 2;
    const isOscillating = !isMonotone && (
        (stdDevOsc > 0.12 && dcOsc >= 3) ||   // moderate variance, direction changes
        (stdDevOsc > 0.20 && dcOsc >= 2)        // higher variance, fewer changes
    );

    if (isOscillating) {
        return { pattern: 'OSCILLATING', trend: 'oscillating', delta: 0 };
    }

    // For 7+ points: compare first half average against second half average
    // More robust than window-at-edge when data spans several scores
    const mid = Math.floor(n / 2);
    const firstHalf = historicalScores.slice(0, mid);
    const secondHalf = historicalScores.slice(mid);
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const delta = avgSecond - avgFirst;

    if (delta > 0.10) {
        return { pattern: 'ESCALATING_INSTABILITY', trend: 'up', delta: Math.round(delta * 1000) / 1000 };
    }
    if (delta < -0.10) {
        return { pattern: 'RECOVERING_STABILITY', trend: 'down', delta: Math.round(Math.abs(delta) * 1000) / 1000 };
    }

    return { pattern: 'STABLE_TREND', trend: 'stable', delta: Math.round(delta * 1000) / 1000 };
}

// === METRICS COMPUTATION ===

function computeMetrics(perceptions) {
    const categories = { STABLE: 0, WATCH: 0, DEGRADED: 0, VOLATILE: 0, CRITICAL_PATTERN: 0 };
    for (const p of perceptions) {
        categories[p.category]++;
    }

    const volatile_entities = perceptions.filter(p => p.category === 'VOLATILE' || p.category === 'CRITICAL_PATTERN');
    const chronic_degradation = perceptions.filter(p => p.category === 'DEGRADED' && p.observation_counts.degraded_periods > 3);

    let oscillation_count = 0;
    for (const p of perceptions) {
        if (p.drift && p.drift.pattern === 'OSCILLATING') oscillation_count++;
    }

    return {
        volatile_entity_count: volatile_entities.length,
        chronic_degradation_count: chronic_degradation.length,
        oscillation_rate: Math.round((oscillation_count / Math.max(perceptions.length, 1)) * 1000) / 1000,
        stale_verification_pressure: Math.round(perceptions.reduce((sum, p) =>
            sum + (p.observation_counts.verification_failures || 0), 0) / Math.max(perceptions.length, 1) * 10) / 10,
        contradiction_density: Math.round(perceptions.reduce((sum, p) =>
            sum + (p.observation_counts.contradictions || 0), 0) / Math.max(perceptions.length, 1) * 10) / 10,
        recovery_rate: Math.round(perceptions.filter(p => p.drift && p.drift.pattern === 'RECOVERING_STABILITY').length
            / Math.max(perceptions.length, 1) * 1000) / 1000,
        perception_distribution: categories,
        computed_at: new Date().toISOString()
    };
}

// === PERCEPTION SURVEY (MAIN ENTRY POINT) ===

function runPerceptionSurvey(windowKey = '24h') {
    const surveyStart = Date.now();

    const temporalRecords = loadTemporalContinuity(windowKey);
    const verificationRecords = loadVerificationLog(windowKey);
    const commitmentRecords = loadCommitments(windowKey);
    const beliefRegistry = loadBeliefRegistry();

    const entityObservations = {};

    // Process temporal records
    for (const record of temporalRecords) {
        const entityId = record.entity_id || record.id || 'unknown';
        if (!entityObservations[entityId]) {
            entityObservations[entityId] = freshEntityObs(entityId);
        }
        const obs = entityObservations[entityId];
        obs.occurrences++;
        obs.total_observations++;

        if (record.event_type === 'state_transition' || record.change_type === 'state_transition') {
            obs.total_state_changes++;
            const unstableStates = ['STALLED', 'CRITICAL', 'FAILED', 'DEGRADED'];
            if (unstableStates.includes(record.from_state) || unstableStates.includes(record.to_state)) {
                obs.unstable_state_changes++;
            }
        }

        if (record.event_type === 'contradiction_detected' || record.contradiction) {
            obs.contradictions++;
        }

        if (record.event_type === 'status_flip' || record.flip) {
            obs.status_flips++;
        }

        if (record.state === 'DEGRADED' || record.status === 'DEGRADED') {
            obs.degraded_periods++;
        }
    }

    // Process verification records
    for (const record of verificationRecords) {
        const entityId = record.entity_id || record.id || 'unknown';
        if (!entityObservations[entityId]) {
            entityObservations[entityId] = freshEntityObs(entityId);
        }
        const obs = entityObservations[entityId];
        obs.total_verifications++;

        if (record.stale || record.verification_freshness === 'stale') {
            obs.stale_verifications++;
        }
        if (record.failed || record.status === 'FAILED') {
            obs.verification_failures++;
        }
    }

    // Process commitment records
    for (const record of commitmentRecords) {
        const entityId = record.entity_id || record.commitment_id || 'unknown';
        if (!entityObservations[entityId]) {
            entityObservations[entityId] = freshEntityObs(entityId);
        }
        if (record.expired || record.event_type === 'commitment_expired') {
            entityObservations[entityId].commitment_expirations++;
        }
    }

    // Compute scores and categories
    const perceptions = [];

    for (const entityId of Object.keys(entityObservations)) {
        const obs = entityObservations[entityId];
        const scoreResult = computeObservationalScore(obs);
        obs.scores_over_time.push(scoreResult.score);

        const flags = {
            critical_pattern: obs.commitment_expirations > 3 || obs.verification_failures > 5 || obs.status_flips > 4
        };

        const category = assignCategory(scoreResult.score, flags);
        const drift = detectDrift(obs.scores_over_time);

        perceptions.push({
            entity_id: entityId,
            category,
            score: scoreResult.score,
            score_breakdown: scoreResult.breakdown,
            drift,
            observation_counts: {
                occurrences: obs.occurrences,
                contradictions: obs.contradictions,
                status_flips: obs.status_flips,
                commitment_expirations: obs.commitment_expirations,
                verification_failures: obs.verification_failures,
                degraded_periods: obs.degraded_periods,
                unstable_state_changes: obs.unstable_state_changes
            },
            window: windowKey,
            surveyed_at: new Date().toISOString()
        });
    }

    // Sort by score descending (observation only)
    perceptions.sort((a, b) => b.score - a.score);

    const metrics = computeMetrics(perceptions);

    const result = {
        window: windowKey,
        survey_duration_ms: Date.now() - surveyStart,
        entity_count: perceptions.length,
        perceptions,
        metrics
    };

    logPerception({ event_type: 'perception_survey', ...result });
    logAudit('survey_completed', { window: windowKey, entity_count: perceptions.length });

    return result;
}

function freshEntityObs(entityId) {
    return {
        entity_id: entityId,
        occurrences: 0,
        total_state_changes: 0,
        unstable_state_changes: 0,
        contradictions: 0,
        total_observations: 0,
        stale_verifications: 0,
        verification_failures: 0,
        total_verifications: 0,
        status_flips: 0,
        commitment_expirations: 0,
        degraded_periods: 0,
        scores_over_time: []
    };
}

module.exports = {
    runPerceptionSurvey,
    computeObservationalScore,
    detectDrift,
    assignCategory,
    CATEGORIES,
    WINDOWS,
    logPerception,
    logAudit,
    loadTemporalContinuity,
    loadVerificationLog,
    loadCommitments,
    loadBeliefRegistry
};