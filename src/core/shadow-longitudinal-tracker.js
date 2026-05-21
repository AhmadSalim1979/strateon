/**
 * Shadow Longitudinal Tracker — Phase D-2.8
 * Rolling window summaries + degradation detection + confidence scoring
 *
 * Tracks trends across: 1h, 6h, 24h, 72h windows
 * Detects degradation vs baseline
 * Produces confidence scores across 4 dimensions
 * Integrates with watchdog for auto-adjustments
 */

const fs = require('fs');
const path = require('path');

// === PATH CONFIG ===

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const OBSERVATION_LOG = path.join(STATE_DIR, 'shadow-observation-log.jsonl');
const METRICS_FILE = path.join(STATE_DIR, 'shadow-burnin-metrics.json');
const DEGRADATION_EVENTS_FILE = path.join(STATE_DIR, 'shadow-degradation-events.jsonl');
const CONFIDENCE_FILE = path.join(STATE_DIR, 'shadow-confidence-scores.json');
const LONGITUDINAL_SUMMARIES_DIR = path.join(STATE_DIR, 'shadow-longitudinal-summaries');

// === TIME WINDOWS ===

const WINDOWS = {
    '1h':  1 * 60 * 60 * 1000,
    '6h':  6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '72h': 72 * 60 * 60 * 1000
};

const BASELINE_FILE = path.join(STATE_DIR, 'shadow-baseline.json');

// === HELPERS ===

function timestamp() { return new Date().toISOString(); }

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// === LOAD OBSERVATION LOG ===

function loadObservations(sinceMs) {
    if (!fs.existsSync(OBSERVATION_LOG)) return [];
    const cutoff = Date.now() - sinceMs;
    return fs.readFileSync(OBSERVATION_LOG, 'utf8')
        .trim().split('\n').filter(l => l).map(l => {
            try { return JSON.parse(l); } catch { return null; }
        }).filter(e => e && new Date(e.timestamp).getTime() > sinceMs);
}

// === BASELINE MANAGEMENT ===

function loadOrCreateBaseline() {
    try {
        if (fs.existsSync(BASELINE_FILE)) {
            return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
        }
    } catch {}

    // Create baseline from first 10 observations
    const obs = loadObservations(WINDOWS['72h']).slice(0, 10);
    const baseline = computeBaselineStats(obs);
    baseline.establishedAt = timestamp();
    baseline.sourceObservations = obs.length;
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
    return baseline;
}

function computeBaselineStats(observations) {
    const successes = observations.filter(o => o.gpu_status === 'success');
    const timeouts = observations.filter(o => o.gpu_status === 'timeout');
    const latencies = observations.map(o => o.gpu_latency_ms).filter(l => l > 0 && l < 180000);

    return {
        avgHallucinationRate: 0,
        avgSemanticDriftPct: 0,
        avgTimeoutRate: 0,
        avgLatencyMs: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
        avgMalformedRate: 0,
        observationCount: observations.length,
        establishedAt: null,
        sourceObservations: observations.length
    };
}

function updateBaselineWithLatestMetrics(metrics) {
    // Only update baseline if we have enough new data
    if (metrics.totalObservations < 10) return;

    const baseline = loadOrCreateBaseline();
    const obs = loadObservations(WINDOWS['72h']);

    // Only update if we have significantly more observations
    if (obs.length > baseline.sourceObservations * 1.5) {
        const newStats = computeBaselineStats(obs);
        newStats.establishedAt = timestamp();
        newStats.sourceObservations = obs.length;
        fs.writeFileSync(BASELINE_FILE, JSON.stringify(newStats, null, 2));
    }
}

// === DEGRADATION DETECTION ===

const DEGRADATION_THRESHOLDS = {
    hallucinationRateIncrease: 0.15,   // +15% absolute vs baseline
    semanticDriftIncrease: 0.20,       // +20% drift vs baseline
    timeoutRateIncrease: 0.10,        // +10% timeout rate increase
    latencyIncreaseFactor: 2.0,      // 2x latency vs baseline
    malformedRateIncrease: 0.10,      // +10% malformed rate
    coldStartIncrease: 3              // 3+ cold starts in 1h = abnormal
};

const DEGRADATION_RECOVERY_THRESHOLDS = {
    hallucinationRateDecrease: 0.10,  // -10% = recovering
    semanticDriftDecrease: 0.15,     // -15% = recovering
    timeoutRateDecrease: 0.05,        // -5% = recovering
    latencyDecreaseFactor: 1.5        // back to 1.5x = recovering
};

function detectDegradation(baseline, metrics, recentObs) {
    const events = [];
    const status = { degraded: false, recovering: false, alertLevel: 'NOMINAL' };

    if (!baseline || baseline.observationCount < 3) return { events, status };

    // 1h cold start check
    const last1h = recentObs.filter(o => new Date(o.timestamp).getTime() > Date.now() - WINDOWS['1h']);
    const coldStarts1h = last1h.filter(o => o.gpu_latency_ms > 30000).length;
    if (coldStarts1h >= DEGRADATION_THRESHOLDS.coldStartIncrease) {
        events.push({
            type: 'COLD_START_SPIKE',
            window: '1h',
            value: coldStarts1h,
            threshold: DEGRADATION_THRESHOLDS.coldStartIncrease,
            timestamp: timestamp()
        });
        status.degraded = true;
    }

    // Hallucination rate
    if (metrics.hallucinationRate - baseline.avgHallucinationRate > DEGRADATION_THRESHOLDS.hallucinationRateIncrease) {
        events.push({
            type: 'HALLUCINATION_INCREASE',
            window: '24h',
            current: metrics.hallucinationRate,
            baseline: baseline.avgHallucinationRate,
            delta: metrics.hallucinationRate - baseline.avgHallucinationRate,
            threshold: DEGRADATION_THRESHOLDS.hallucinationRateIncrease,
            timestamp: timestamp()
        });
        status.degraded = true;
    }

    // Semantic drift
    if ((metrics.semanticDriftPct / 100) - baseline.avgSemanticDriftPct > DEGRADATION_THRESHOLDS.semanticDriftIncrease) {
        events.push({
            type: 'SEMANTIC_DRIFT_INCREASE',
            window: '24h',
            current: metrics.semanticDriftPct / 100,
            baseline: baseline.avgSemanticDriftPct,
            delta: (metrics.semanticDriftPct / 100) - baseline.avgSemanticDriftPct,
            threshold: DEGRADATION_THRESHOLDS.semanticDriftIncrease,
            timestamp: timestamp()
        });
        status.degraded = true;
    }

    // Timeout rate
    if (metrics.timeoutRate - baseline.avgTimeoutRate > DEGRADATION_THRESHOLDS.timeoutRateIncrease) {
        events.push({
            type: 'TIMEOUT_RATE_INCREASE',
            window: '24h',
            current: metrics.timeoutRate,
            baseline: baseline.avgTimeoutRate,
            delta: metrics.timeoutRate - baseline.avgTimeoutRate,
            threshold: DEGRADATION_THRESHOLDS.timeoutRateIncrease,
            timestamp: timestamp()
        });
        status.degraded = true;
    }

    // Latency
    if (baseline.avgLatencyMs > 0 && metrics.avgLatencyMs > baseline.avgLatencyMs * DEGRADATION_THRESHOLDS.latencyIncreaseFactor) {
        events.push({
            type: 'LATENCY_DEGRADATION',
            window: '24h',
            current: metrics.avgLatencyMs,
            baseline: baseline.avgLatencyMs,
            factor: metrics.avgLatencyMs / baseline.avgLatencyMs,
            threshold: DEGRADATION_THRESHOLDS.latencyIncreaseFactor,
            timestamp: timestamp()
        });
        status.degraded = true;
    }

    // Malformed response rate
    if (metrics.malformedResponseRate - baseline.avgMalformedRate > DEGRADATION_THRESHOLDS.malformedRateIncrease) {
        events.push({
            type: 'MALFORMED_RESPONSE_INCREASE',
            window: '24h',
            current: metrics.malformedResponseRate,
            baseline: baseline.avgMalformedRate,
            delta: metrics.malformedResponseRate - baseline.avgMalformedRate,
            threshold: DEGRADATION_THRESHOLDS.malformedRateIncrease,
            timestamp: timestamp()
        });
        status.degraded = true;
    }

    // Determine alert level
    if (status.degraded) {
        const criticalEvents = events.filter(e =>
            e.type === 'HALLUCINATION_INCREASE' || e.type === 'SEMANTIC_DRIFT_INCREASE'
        );
        status.alertLevel = criticalEvents.length > 0 ? 'HIGH' : 'MEDIUM';
    }

    return { events, status };
}

// === CONFIDENCE SCORING ===

function computeConfidenceScores(baseline, metrics, recentObs) {
    const scores = {
        operational: 0,
        stability: 0,
        semanticConsistency: 0,
        infrastructureReliability: 0,
        overall: 0,
        timestamp: timestamp()
    };

    const last24h = recentObs.filter(o => new Date(o.timestamp).getTime() > Date.now() - WINDOWS['24h']);
    const last1h = recentObs.filter(o => new Date(o.timestamp).getTime() > Date.now() - WINDOWS['1h']);

    // 1. Operational Confidence: GPU availability in last 24h
    const gpuAvailable = last24h.filter(o => o.gpu_status === 'success').length;
    const totalRequests = last24h.length;
    scores.operational = totalRequests > 0 ? gpuAvailable / totalRequests : 0.5; // 0.5 if no data

    // 2. Stability Confidence: timeout rate + cold start frequency
    const timeouts = last24h.filter(o => o.gpu_status === 'timeout').length;
    const coldStarts = last1h.filter(o => o.gpu_latency_ms > 30000).length;
    const stabilityPenalty = (timeouts / Math.max(totalRequests, 1)) * 0.5 + Math.min(coldStarts * 0.2, 0.5);
    scores.stability = Math.max(0, 1 - stabilityPenalty);

    // 3. Semantic Consistency: low hallucination + low drift
    const hallucinationPenalty = Math.min((metrics.hallucinationRate || 0) * 2, 0.6);
    const driftPenalty = Math.min((metrics.semanticDriftPct || 0) / 100, 0.4);
    scores.semanticConsistency = Math.max(0, 1 - hallucinationPenalty - driftPenalty);

    // 4. Infrastructure Reliability: latency consistency + availability
    const coldStarts6h = last1h.filter(o => o.gpu_latency_ms > 30000).length;
    const infraPenalty = (coldStarts6h > 0 ? 0.3 : 0) + (metrics.timeoutRate > 0.1 ? 0.3 : 0);
    scores.infrastructureReliability = Math.max(0, 1 - infraPenalty);

    // Overall: weighted geometric mean (stability weighted most)
    scores.overall = (
        scores.operational * 0.2 +
        scores.stability * 0.35 +
        scores.semanticConsistency * 0.25 +
        scores.infrastructureReliability * 0.2
    );

    // Normalize to 0-100
    Object.keys(scores).forEach(k => {
        if (k !== 'timestamp') scores[k] = Math.round(scores[k] * 100);
    });

    return scores;
}

// === WINDOW SUMMARIES ===

function computeWindowSummaries(recentObs) {
    const summaries = {};

    for (const [windowName, windowMs] of Object.entries(WINDOWS)) {
        const windowObs = recentObs.filter(o => new Date(o.timestamp).getTime() > Date.now() - windowMs);

        const successes = windowObs.filter(o => o.gpu_status === 'success');
        const timeouts = windowObs.filter(o => o.gpu_status === 'timeout');
        const latencies = windowObs.map(o => o.gpu_latency_ms).filter(l => l > 0 && l < 180000);
        const hallucinations = windowObs.filter(o => o.hallucination_score > 0.2);
        const drifts = windowObs.filter(o => o.similarity_score && o.similarity_score < 0.5);

        const sorted = [...latencies].sort((a, b) => a - b);
        const p95Idx = Math.floor(sorted.length * 0.95);

        summaries[windowName] = {
            windowMs: windowName,
            observationCount: windowObs.length,
            successCount: successes.length,
            timeoutCount: timeouts.length,
            gpuAvailabilityPct: windowObs.length > 0
                ? Math.round((successes.length / windowObs.length) * 100)
                : null,
            avgLatencyMs: latencies.length > 0
                ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
                : null,
            p95LatencyMs: sorted.length > 0 ? sorted[p95Idx] || sorted[sorted.length - 1] : null,
            maxLatencyMs: sorted.length > 0 ? sorted[sorted.length - 1] : null,
            hallucinationCount: hallucinations.length,
            hallucinationRatePct: windowObs.length > 0
                ? Math.round((hallucinations.length / windowObs.length) * 100)
                : 0,
            majorDivergenceCount: drifts.length,
            coldStartCount: windowObs.filter(o => o.gpu_latency_ms > 30000).length,
            generatedAt: timestamp()
        };
    }

    return summaries;
}

// === DEGRADATION RESPONSE ===

function handleDegradation(degradationResult, currentConfig) {
    const { events, status } = degradationResult;

    if (!status.degraded) {
        return { action: 'NONE', samplingRate: currentConfig.maxSampleRate, reason: 'NOMINAL' };
    }

    // Log degradation events
    events.forEach(e => fs.appendFileSync(DEGRADATION_EVENTS_FILE, JSON.stringify(e) + '\n'));

    if (status.alertLevel === 'HIGH') {
        // Auto-reduce sampling to 50% of current rate
        const newRate = Math.max(0.01, currentConfig.maxSampleRate * 0.5);
        return {
            action: 'REDUCE_SAMPLING',
            samplingRate: newRate,
            alertLevel: 'HIGH',
            reason: 'High-priority degradation: ' + events.map(e => e.type).join(', '),
            timestamp: timestamp()
        };
    } else if (status.alertLevel === 'MEDIUM') {
        // Keep monitoring but warn
        return {
            action: 'WARN_ONLY',
            samplingRate: currentConfig.maxSampleRate,
            alertLevel: 'MEDIUM',
            reason: 'Medium degradation detected: ' + events.map(e => e.type).join(', '),
            timestamp: timestamp()
        };
    }

    return { action: 'NONE', samplingRate: currentConfig.maxSampleRate, reason: 'NOMINAL' };
}

// === MAIN UPDATE ===

function runLongitudinalUpdate() {
    ensureDir(LONGITUDINAL_SUMMARIES_DIR);

    // Load all recent observations
    const allRecentObs = loadObservations(WINDOWS['72h']);
    const last1h = allRecentObs.filter(o => new Date(o.timestamp).getTime() > Date.now() - WINDOWS['1h']);

    // Load baseline
    const baseline = loadOrCreateBaseline();

    // Load current metrics
    let metrics = { totalObservations: 0, hallucinationRate: 0, semanticDriftPct: 0, timeoutRate: 0, avgLatencyMs: 0, malformedResponseRate: 0, gpuAvailabilityPct: 100 };
    try {
        if (fs.existsSync(METRICS_FILE)) {
            metrics = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
        }
    } catch {}

    // Load current sampling config
    let config = { maxSampleRate: 0.05, enabled: false };
    try {
        if (fs.existsSync(path.join(STATE_DIR, 'shadow-sampling-config.json'))) {
            config = JSON.parse(fs.readFileSync(path.join(STATE_DIR, 'shadow-sampling-config.json'), 'utf8'));
        }
    } catch {}

    // Compute summaries
    const windowSummaries = computeWindowSummaries(allRecentObs);

    // Detect degradation
    const degradationResult = detectDegradation(baseline, metrics, allRecentObs);

    // Compute confidence scores
    const confidenceScores = computeConfidenceScores(baseline, metrics, allRecentObs);

    // Handle degradation response
    const response = handleDegradation(degradationResult, config);

    // Persist confidence scores
    fs.writeFileSync(CONFIDENCE_FILE, JSON.stringify(confidenceScores, null, 2));

    // Persist longitudinal summary for current window
    const summaryPath = path.join(LONGITUDINAL_SUMMARIES_DIR, 'latest.json');
    const fullSummary = {
        timestamp: timestamp(),
        windowSummaries,
        degradationStatus: degradationResult.status,
        degradationEvents: degradationResult.events,
        confidenceScores,
        responseAction: response,
        baselineEstablishedAt: baseline.establishedAt,
        baselineObservationCount: baseline.sourceObservations
    };
    fs.writeFileSync(summaryPath, JSON.stringify(fullSummary, null, 2));

    // Update baseline if significant new data
    updateBaselineWithLatestMetrics(metrics);

    return {
        windowSummaries,
        degradationStatus: degradationResult.status,
        degradationEvents: degradationResult.events,
        confidenceScores,
        responseAction: response,
        baseline
    };
}

// === CLI ===

if (require.main === module) {
    const result = runLongitudinalUpdate();

    console.log('=== Longitudinal Burn-In Update ===');
    console.log('');
    console.log('--- Window Summaries ---');
    for (const [w, s] of Object.entries(result.windowSummaries)) {
        console.log(w + ': ' + s.observationCount + ' obs, ' + s.gpuAvailabilityPct + '% avail, ' + s.avgLatencyMs + 'ms avg, ' + s.hallucinationRatePct + '% hallucination');
    }
    console.log('');
    console.log('--- Confidence Scores ---');
    Object.entries(result.confidenceScores).forEach(([k, v]) => {
        if (k !== 'timestamp') console.log('  ' + k + ': ' + v + '%');
    });
    console.log('');
    console.log('--- Degradation Status ---');
    console.log('  Alert Level:', result.degradationStatus.alertLevel);
    console.log('  Degraded:', result.degradationStatus.degraded);
    if (result.degradationEvents.length > 0) {
        result.degradationEvents.forEach(e => console.log('  Event:', e.type, '|', JSON.stringify(e).substring(0, 80)));
    }
    console.log('');
    console.log('--- Response Action ---');
    console.log('  Action:', result.responseAction.action);
    console.log('  Reason:', result.responseAction.reason);
    console.log('  New sampling rate:', result.responseAction.samplingRate);
}

module.exports = {
    runLongitudinalUpdate,
    computeWindowSummaries,
    detectDegradation,
    computeConfidenceScores,
    loadOrCreateBaseline,
    handleDegradation,
    DEGRADATION_THRESHOLDS,
    WINDOWS
};