/**
 * GPU Primary Router — Mode B: GPU-primary with MiniMax fallback
 * 
 * Routing logic:
 * - GPU primary for all requests
 * - MiniMax ONLY when: GPU timeout, GPU failure, malformed response, WORSE quality, operational instability
 * - ALL calls logged to evidence + routing history (shadow mode preserved)
 */

const { sendShadowRequest } = require('./gpu-shadow-router.js');
const fs = require('fs');

// === CONFIG ===

const GPU_PRIMARY_CONFIG = {
    GOOD_QUALITIES: ['COMPARABLE', 'COMPARABLE_CORRECT', 'COMPARABLE_CORRECT_REFUSAL',
                     'COMPARABLE_REFINED', 'COMPARABLE_DIFFERENT', 'PARTIALLY_COMPARABLE'],
    GPU_TIMEOUT_MS: 180_000,
    METRICS_FILE: '/home/node/.openclaw/workspace/moosa-worker/state/gpu-primary-metrics.json'
};

// === RUNTIME METRICS ===

let runtimeMetrics = {
    total_requests: 0,
    gpu_primary_success: 0,
    fallback_minimax: 0,
    fallback_reason: { timeout: 0, failure: 0, malformed: 0, quality_worse: 0, operational: 0 },
    latency_gpu_ms: [],
    latency_minimax_ms: [],
    quality_distribution: {},
    start_time: Date.now()
};

function loadMetrics() {
    try {
        if (fs.existsSync(GPU_PRIMARY_CONFIG.METRICS_FILE)) {
            const saved = JSON.parse(fs.readFileSync(GPU_PRIMARY_CONFIG.METRICS_FILE, 'utf8'));
            runtimeMetrics = { ...runtimeMetrics, ...saved, start_time: runtimeMetrics.start_time };
        }
    } catch {}
}

function saveMetrics() {
    try {
        fs.writeFileSync(GPU_PRIMARY_CONFIG.METRICS_FILE, JSON.stringify(runtimeMetrics, null, 2));
    } catch {}
}

function recordMetric(metric) {
    runtimeMetrics.total_requests++;
    runtimeMetrics[metric.type]++;
    if (metric.latency_ms) runtimeMetrics.latency_gpu_ms.push(metric.latency_ms);
    if (metric.minimax_latency_ms) runtimeMetrics.latency_minimax_ms.push(metric.minimax_latency_ms);
    if (metric.quality) {
        runtimeMetrics.quality_distribution[metric.quality] = (runtimeMetrics.quality_distribution[metric.quality] || 0) + 1;
    }
    saveMetrics();
}

// === MALFORMED RESPONSE DETECTION ===

function isMalformedResponse(text) {
    if (!text || text.trim().length === 0) return true;
    const hasInvalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text);
    const isTruncated = /UTF-16 surrogate/.test(text) || text.includes('\ufffd');
    return hasInvalidChars || isTruncated;
}

// === MAIN PRIMARY ROUTE ===

function gpuPrimaryRoute({ userMessage, systemContext, minimax_response, minimax_latency_ms, requestId }) {
    loadMetrics();
    
    const startMs = Date.now();
    const result = {
        request_id: requestId || ('gpur-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6)),
        timestamp: new Date().toISOString(),
        mode: 'GPU_PRIMARY',
        source: null,
        quality: null,
        fallback_reason: null,
        gpu: null,
        latency_ms: 0
    };

    try {
        // Step 1: Call GPU shadow router (GPU call + comparison + logging)
        const gpuResult = sendShadowRequest({
            request_id: result.request_id,
            user_message: userMessage,
            system_context: systemContext,
            minimax_response: minimax_response || '',
            minimax_latency_ms: minimax_latency_ms || 0
        });

        const gpuLatency = gpuResult.gpu?.latency_ms || 0;
        const gpuStatus = gpuResult.gpu?.status || 'unknown';
        const gpuResponse = gpuResult.gpu?.response || null;
        const quality = gpuResult.comparison?.overall_gpu_quality || 'FAILED';
        const halScore = gpuResult.comparison?.hallucination_score || 0;
        const comparison = gpuResult.comparison;

        result.gpu = {
            response: gpuResponse,
            latency_ms: gpuLatency,
            status: gpuStatus,
            quality,
            hallucination_score: halScore,
            comparison_id: comparison?.comparison_id || null
        };

        // Step 2: Determine if fallback is needed
        let fallbackReason = null;

        if (gpuStatus === 'timeout') {
            fallbackReason = 'timeout';
        } else if (gpuStatus === 'api_error' || gpuStatus === 'parse_error' || gpuStatus === 'token_missing') {
            fallbackReason = 'failure';
        } else if (isMalformedResponse(gpuResponse)) {
            fallbackReason = 'malformed';
        } else if (quality === 'FAILED') {
            fallbackReason = 'failure';
        } else if (!GPU_PRIMARY_CONFIG.GOOD_QUALITIES.includes(quality)) {
            fallbackReason = 'quality_worse';
        }

        // Step 3: Make routing decision
        if (fallbackReason) {
            result.source = 'MiniMax';
            result.fallback_reason = fallbackReason;
            result.quality = quality;
            result.latency_ms = Date.now() - startMs;

            recordMetric({ type: 'fallback_minimax', latency_ms: gpuLatency, quality });
            runtimeMetrics.fallback_reason[fallbackReason]++;

            return result;
        } else {
            result.source = 'GPU';
            result.quality = quality;
            result.latency_ms = Date.now() - startMs;

            recordMetric({ type: 'gpu_primary_success', latency_ms: gpuLatency, quality });

            return result;
        }
    } catch (e) {
        result.source = 'MiniMax';
        result.fallback_reason = 'operational';
        result.quality = 'FAILED';
        result.latency_ms = Date.now() - startMs;
        result.error = e.message;

        recordMetric({ type: 'fallback_minimax', reason: 'operational', quality: 'FAILED' });
        runtimeMetrics.fallback_reason.operational++;

        return result;
    }
}

// === METRICS ===

function getGpuPrimaryMetrics() {
    loadMetrics();
    const lats = runtimeMetrics.latency_gpu_ms;
    const sorted = [...lats].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const avg = lats.length > 0 ? Math.round(lats.reduce((a, b) => a + b, 0) / lats.length) : 0;
    const total = runtimeMetrics.total_requests;
    const successRate = total > 0 ? (runtimeMetrics.gpu_primary_success / total * 100).toFixed(1) + '%' : 'N/A';
    const fallbackRate = total > 0 ? (runtimeMetrics.fallback_minimax / total * 100).toFixed(1) + '%' : 'N/A';

    return {
        ...runtimeMetrics,
        gpu_success_rate: successRate,
        fallback_rate: fallbackRate,
        avg_gpu_latency_ms: avg,
        p95_gpu_latency_ms: p95
    };
}

function resetGpuPrimaryMetrics() {
    runtimeMetrics = {
        total_requests: 0,
        gpu_primary_success: 0,
        fallback_minimax: 0,
        fallback_reason: { timeout: 0, failure: 0, malformed: 0, quality_worse: 0, operational: 0 },
        latency_gpu_ms: [],
        latency_minimax_ms: [],
        quality_distribution: {},
        start_time: Date.now()
    };
    saveMetrics();
}

// === CLI ===

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('Usage: node gpu-primary-router.js "<user_message>" [minimax_response]');
        console.log('Mode: GPU_PRIMARY');
        process.exit(1);
    }
    const [userMessage, minimaxResponse] = args;
    
    const result = gpuPrimaryRoute({
        userMessage,
        minimax_response: minimaxResponse || '',
        minimax_latency_ms: 0,
        requestId: 'cli-' + Date.now().toString(36)
    });
    
    console.log(JSON.stringify(result, null, 2));
    
    const m = getGpuPrimaryMetrics();
    console.log('\n=== RUNTIME METRICS ===');
    console.log('Total: ' + m.total_requests + ' | GPU ok: ' + m.gpu_primary_success + ' | Fallback: ' + m.fallback_minimax + ' (' + m.fallback_rate + ')');
    console.log('Avg latency: ' + m.avg_gpu_latency_ms + 'ms | P95: ' + m.p95_gpu_latency_ms + 'ms');
    console.log('Fallback reasons:', JSON.stringify(m.fallback_reason));
    console.log('Quality dist:', JSON.stringify(m.quality_distribution));
}

module.exports = { gpuPrimaryRoute, getGpuPrimaryMetrics, resetGpuPrimaryMetrics, GPU_PRIMARY_CONFIG };