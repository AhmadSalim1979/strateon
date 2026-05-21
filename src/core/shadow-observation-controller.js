/**
 * GPU Shadow Observation Sampling Controller — Phase D-2.7
 * Controls low-frequency shadow observation during burn-in period
 *
 * Architecture:
 * - Runs as isolated observer alongside production
 * - Samples only SAFE_FOR_SHADOW requests at low frequency (max 10%)
 * - Never touches production routing
 * - GPU responses stored for comparison only
 *
 * SECURITY INVARIANTS:
 * - Production routing is NEVER modified
 * - GPU never gains execution authority
 * - No autonomous actions from GPU responses
 * - All sampled requests are informational only
 */

const fs = require('fs');
const path = require('path');

// === PATH CONFIG ===

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const SAMPLING_CONFIG_FILE = path.join(STATE_DIR, 'shadow-sampling-config.json');
const OBSERVATION_LOG = path.join(STATE_DIR, 'shadow-observation-log.jsonl');
const METRICS_FILE = path.join(STATE_DIR, 'shadow-burnin-metrics.json');
const HISTORY_FILE = path.join(STATE_DIR, 'gpu-shadow-routing-history.jsonl');
const SUMMARY_FILE = path.join(STATE_DIR, 'gpu-shadow-routing-summary.json');
const DAILY_SUMMARY_DIR = path.join(STATE_DIR, 'shadow-daily-summaries');

// === CONFIG ===

const DEFAULT_CONFIG = {
    enabled: false,           // DISABLED until explicitly approved for burn-in
    maxSampleRate: 0.10,     // Max 10% of SAFE_FOR_SHADOW requests sampled
    minIntervalMs: 5 * 60 * 1000,  // Min 5 minutes between samples
    lastSampleAt: null,
    burnInStartTime: null,
    totalObservedProductionRequests: 0,
    totalShadowSamples: 0,
    maxConcurrentShadowCalls: 1,
    observationWindowMs: 24 * 60 * 60 * 1000,  // 24-hour window
    failOpen: true,           // Always fail open — GPU failure never blocks production
    neverSampleCategories: [
        'NEVER_GPU',
        'APPROVAL_REQUIRED',
        'EXECUTIVE_DECISION',
        'EXTERNAL_COMMUNICATION',
        'BILLING_PAYMENT',
        'SECURITY_CREDENTIAL',
        'LEGAL_CONTRACTUAL'
    ]
};

// === STATE ===

function loadConfig() {
    try {
        if (fs.existsSync(SAMPLING_CONFIG_FILE)) {
            const existing = JSON.parse(fs.readFileSync(SAMPLING_CONFIG_FILE, 'utf8'));
            return { ...DEFAULT_CONFIG, ...existing };
        }
    } catch {}
    return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
    fs.writeFileSync(SAMPLING_CONFIG_FILE, JSON.stringify(config, null, 2));
}

// === LOAD SAMPLING MODULE ===

function isRequestSafeForShadow(message) {
    try {
        const { classifyRequest, CATEGORY } = require('./gpu-shadow-sampling');
        const result = classifyRequest(message);
        return result.category === CATEGORY.SAFE_FOR_SHADOW;
    } catch {
        return false;
    }
}

// === RATE LIMITING ===

function canSampleNow(config) {
    if (!config.enabled) return { allowed: false, reason: 'sampling_disabled' };
    if (!config.lastSampleAt) return { allowed: true, reason: 'first_sample' };

    const elapsed = Date.now() - new Date(config.lastSampleAt).getTime();
    if (elapsed < config.minIntervalMs) {
        return { allowed: false, reason: 'min_interval_not_met', next_sample_in_ms: config.minIntervalMs - elapsed };
    }

    // Check sample rate limit
    const recentWindowMs = Math.min(config.observationWindowMs, 60 * 60 * 1000); // Look back max 1 hour
    let recentSamples = 0;

    if (fs.existsSync(OBSERVATION_LOG)) {
        const lines = fs.readFileSync(OBSERVATION_LOG, 'utf8').trim().split('\n').filter(l => l);
        const cutoff = Date.now() - recentWindowMs;
        recentSamples = lines.filter(l => {
            try {
                const entry = JSON.parse(l);
                const entryTime = new Date(entry.timestamp).getTime();
                return entryTime > cutoff && entry.sampled === true;
            } catch { return false; }
        }).length;
    }

    // If we've already hit max rate in recent window, refuse
    if (recentSamples >= Math.floor(config.maxSampleRate * 100)) {
        return { allowed: false, reason: 'rate_limit_reached' };
    }

    return { allowed: true, reason: 'ok' };
}

// === OBSERVATION LOG ===

function logObservation(entry) {
    const line = JSON.stringify({
        ...entry,
        sampled: true,
        timestamp: new Date().toISOString()
    });
    fs.appendFileSync(OBSERVATION_LOG, line + '\n');
}

// === METRICS AGGREGATION ===

function loadMetrics() {
    try {
        if (fs.existsSync(METRICS_FILE)) {
            return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
        }
    } catch {}
    return {
        burnInStartTime: null,
        lastUpdated: null,
        totalObservations: 0,
        totalShadowSamples: 0,
        gpuAvailabilityPct: 0,
        timeoutRate: 0,
        malformedResponseRate: 0,
        hallucinationRate: 0,
        semanticDriftPct: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        coldStartCount: 0,
        coldStartAvgMs: 0,
        recentSamples: [],  // Last 100 for p95 calculation
        riskScore: 'UNKNOWN'
    };
}

function updateMetrics(gpuResult, comparison) {
    const m = loadMetrics();

    if (!m.burnInStartTime) m.burnInStartTime = new Date().toISOString();
    m.lastUpdated = new Date().toISOString();
    m.totalObservations++;

    if (gpuResult.status === 'success') {
        m.totalShadowSamples++;
        m.gpuAvailabilityPct = (m.totalShadowSamples / m.totalObservations) * 100;
    } else if (gpuResult.status === 'timeout') {
        m.timeoutRate = ((m.timeoutRate * (m.totalObservations - 1)) + 1) / m.totalObservations;
    } else {
        m.malformedResponseRate = ((m.malformedResponseRate * (m.totalObservations - 1)) + 1) / m.totalObservations;
    }

    // Hallucination
    if (comparison && comparison.comparison && comparison.comparison.hallucination_score > 0.2) {
        m.hallucinationRate = ((m.hallucinationRate * (m.totalObservations - 1)) + comparison.comparison.hallucination_score) / m.totalObservations;
    }

    // Latency tracking
    const gpuLat = gpuResult.latency_ms || 0;
    if (gpuLat > 0) {
        m.recentSamples.push(gpuLat);
        if (m.recentSamples.length > 100) m.recentSamples = m.recentSamples.slice(-100);

        const sorted = [...m.recentSamples].sort((a, b) => a - b);
        const p95Idx = Math.floor(sorted.length * 0.95);
        m.p95LatencyMs = sorted[p95Idx] || 0;
        m.avgLatencyMs = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    }

    // Cold start detection (GPU latency > 30s on first call after idle)
    if (gpuLat > 30000) {
        m.coldStartCount++;
        m.coldStartAvgMs = ((m.coldStartAvgMs * (m.coldStartCount - 1)) + gpuLat) / m.coldStartCount;
    }

    // Semantic drift
    if (comparison && comparison.comparison) {
        const sim = comparison.comparison.response_similarity_score || 0;
        m.semanticDriftPct = (1 - sim) * 100;
    }

    // Risk score
    if (m.hallucinationRate > 0.4 || m.timeoutRate > 0.3 || m.gpuAvailabilityPct < 70) {
        m.riskScore = 'HIGH';
    } else if (m.hallucinationRate > 0.2 || m.timeoutRate > 0.15 || m.gpuAvailabilityPct < 85) {
        m.riskScore = 'MEDIUM';
    } else {
        m.riskScore = 'LOW';
    }

    fs.writeFileSync(METRICS_FILE, JSON.stringify(m, null, 2));
    return m;
}

// === DAILY SUMMARY ===

function generateDailySummary() {
    const m = loadMetrics();
    const logFile = OBSERVATION_LOG;

    let historyEntries = [];
    if (fs.existsSync(logFile)) {
        const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(l => l);
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        historyEntries = lines
            .map(l => { try { return JSON.parse(l); } catch { return null; } })
            .filter(e => e && new Date(e.timestamp).getTime() > dayAgo);
    }

    const divergences = historyEntries.filter(e => e.comparison && e.comparison.response_similarity_score < 0.5);
    const hallucinations = historyEntries.filter(e => e.comparison && e.comparison.hallucination_score > 0.2);

    const summary = {
        generatedAt: new Date().toISOString(),
        period: '24h',
        burnInStartTime: m.burnInStartTime,
        totalObservations: m.totalObservations,
        totalShadowSamples: m.totalShadowSamples,
        gpuAvailabilityPct: m.gpuAvailabilityPct.toFixed(1),
        timeoutRate: (m.timeoutRate * 100).toFixed(1) + '%',
        malformedResponseRate: (m.malformedResponseRate * 100).toFixed(1) + '%',
        hallucinationRate: (m.hallucinationRate * 100).toFixed(1) + '%',
        semanticDriftPct: m.semanticDriftPct.toFixed(1) + '%',
        avgLatencyMs: Math.round(m.avgLatencyMs),
        p95LatencyMs: Math.round(m.p95LatencyMs),
        coldStartCount: m.coldStartCount,
        riskScore: m.riskScore,
        majorDivergences: divergences.length,
        hallucinationExamples: hallucinations.slice(0, 3).map(h => ({
            prompt: h.prompt_hash || h.request_id,
            similarity: h.comparison ? h.comparison.response_similarity_score : null,
            hallucinationScore: h.comparison ? h.comparison.hallucination_score : null
        })),
        recommendation: m.riskScore === 'LOW'
            ? 'SHADOW CONFIDENCE: IMPROVING — GPU stability acceptable for continued observation'
            : m.riskScore === 'MEDIUM'
                ? 'SHADOW CONFIDENCE: DEGRADING — investigate GPU stability before expanding scope'
                : 'SHADOW CONFIDENCE: UNSTABLE — GPU requires fixes before further observation'
    };

    return summary;
}

// === MAIN OBSERVATION POINT ===
// Called after production response — observes and potentially samples

function observeAndPotentiallySample({ request_id, user_message, minimax_response, minimax_latency_ms }) {
    const config = loadConfig();

    // Check if sampling is enabled
    if (!config.enabled) {
        return { observed: false, sampled: false, reason: 'sampling_disabled' };
    }

    // Check request safety
    if (!isRequestSafeForShadow(user_message)) {
        return { observed: true, sampled: false, reason: 'not_safe_for_shadow' };
    }

    // Check rate limiting
    const rateCheck = canSampleNow(config);
    if (!rateCheck.allowed) {
        return { observed: true, sampled: false, reason: rateCheck.reason };
    }

    // All checks passed — this request will be sampled
    return {
        observed: true,
        sampled: true,
        reason: 'rate_limit_ok',
        request_id,
        user_message,
        minimax_response,
        minimax_latency_ms
    };
}

// === ENABLE SAMPLING ===

function enableBurnIn() {
    const config = loadConfig();
    config.enabled = true;
    config.burnInStartTime = new Date().toISOString();
    saveConfig(config);
    return config;
}

function disableSampling() {
    const config = loadConfig();
    config.enabled = false;
    saveConfig(config);
    return config;
}

// === CLI ===

if (require.main === module) {
    const args = process.argv.slice(2);
    const cmd = args[0];

    if (cmd === 'enable') {
        const c = enableBurnIn();
        console.log('Shadow observation ENABLED');
        console.log('Burn-in started:', c.burnInStartTime);
    } else if (cmd === 'disable') {
        const c = disableSampling();
        console.log('Shadow observation DISABLED');
    } else if (cmd === 'metrics') {
        const m = loadMetrics();
        console.log(JSON.stringify(m, null, 2));
    } else if (cmd === 'summary') {
        const s = generateDailySummary();
        console.log(JSON.stringify(s, null, 2));
    } else if (cmd === 'status') {
        const c = loadConfig();
        const m = loadMetrics();
        console.log('Enabled:', c.enabled);
        console.log('Burn-in start:', c.burnInStartTime);
        console.log('Total observations:', m.totalObservations);
        console.log('Total shadow samples:', m.totalShadowSamples);
        console.log('GPU availability:', m.gpuAvailabilityPct.toFixed(1) + '%');
        console.log('Risk score:', m.riskScore);
    } else if (cmd === 'sample') {
        // Force a sample now (for validation)
        const { sendShadowRequest } = require('./gpu-shadow-router');
        const result = sendShadowRequest({
            request_id: 'burnin-test-' + Date.now().toString(36),
            user_message: 'Explain what a neural network is in one sentence.',
            minimax_response: 'A neural network is a computer system inspired by the human brain.',
            minimax_latency_ms: 800
        });
        if (result.gpu.status === 'success') {
            updateMetrics(result.gpu, result.comparison);
        }
        console.log('Sample result:', result.gpu.status, result.gpu.latency_ms + 'ms');
        console.log('GPU response:', result.gpu.response ? result.gpu.response.substring(0, 100) : 'null');
    } else {
        console.log('Usage: node shadow-observation-controller.js [enable|disable|metrics|summary|status|sample]');
    }
}

module.exports = {
    observeAndPotentiallySample,
    enableBurnIn,
    disableSampling,
    loadConfig,
    generateDailySummary,
    loadMetrics,
    updateMetrics,
    canSampleNow,
    isRequestSafeForShadow
};