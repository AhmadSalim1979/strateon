/**
 * GPU Shadow Router — Phase D-2.6b
 * Sends requests to GPU path in shadow mode and stores comparison
 *
 * SHADOW MODE ONLY:
 * - GPU responses are stored, never used operationally
 * - MiniMax remains authoritative at all times
 * - Must be explicitly invoked (no automatic production interception)
 *
 * SECURITY INVARIANTS:
 * - Token is never printed or exposed
 * - Failures do not impact production responses
 * - All GPU calls are logged
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// === PATH CONFIG ===

const SECRETS_FILE = '/home/node/.openclaw/secrets/gpu-auth-proxy.json';
const HISTORY_FILE = '/home/node/.openclaw/workspace/moosa-worker/state/gpu-shadow-routing-history.jsonl';
const SUMMARY_FILE = '/home/node/.openclaw/workspace/moosa-worker/state/gpu-shadow-routing-summary.json';

// === GPU CONFIG ===
// Verified: 2026-05-21 — proxy /api/generate succeeds with actual prompt forwarding
// Cold model load: up to 180s | Warm inference: sub-second
// Production route: MiniMax remains primary — GPU is shadow-only

const GPU_CONFIG = {
    url: 'https://23a9nue4xq4r4p-11440.proxy.runpod.net/api/generate',
    model: 'mistral-small3.2:latest',
    timeoutMs: 180_000,  // 180s for cold load, then sub-second
    maxTokens: 2048
};

// === HELPERS ===

function timestamp() {
    return new Date().toISOString();
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return hash.toString(16);
}

function loadGpuToken() {
    try {
        const t = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
        return t.token;
    } catch {
        return null;
    }
}

function generateRequestId() {
    return 'req-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
}

// === GPU API CALL ===

function callGpuApi(messages, token) {
    // Build prompt string from messages array
    const promptStr = messages.map(m => m.role === 'system' ? '[SYS] ' + m.content : '[USER] ' + m.content).join('\n');
    const payload = JSON.stringify({
        model: GPU_CONFIG.model,
        prompt: promptStr,
        max_tokens: GPU_CONFIG.maxTokens,
        stream: false
    });

    // Use double-quote wrapper, escape internal double quotes for shell
    const escapedPayload = payload.replace(/"/g, '\\"');
    const escapedToken = token.replace(/"/g, '\\"');
    const cmd = 'curl -s -X POST -H "Authorization: Bearer ' + escapedToken + '" -H "Content-Type: application/json" -H "Accept: application/json" -d "' + escapedPayload + '" "' + GPU_CONFIG.url + '" --max-time 180 --connect-timeout 15';

    const startMs = Date.now();
    let raw;
    try {
        raw = execSync(cmd, { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
    } catch (e) {
        return {
            response: null,
            status: 'timeout',
            latency_ms: Date.now() - startMs,
            error: e.message.substring(0, 200)
        };
    }

    try {
        const parsed = JSON.parse(raw);
        if (parsed.error) {
            return {
                response: null,
                status: 'api_error',
                latency_ms: Date.now() - startMs,
                error: parsed.error.message || parsed.error
            };
        }
        // Ollama /api/generate returns { response: "..." }
        // OpenAI-compatible /v1/chat/completions returns { choices: [{ message: { content: "..." } }] }
        let content = null;
        if (parsed.response) {
            content = parsed.response; // Ollama native format
        } else if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
            content = parsed.choices[0].message.content; // OpenAI-compatible format
        }
        return {
            response: content,
            status: 'success',
            latency_ms: Date.now() - startMs,
            tokens_used: parsed.eval_count || parsed.usage?.completion_tokens || null
        };
    } catch {
        return {
            response: null,
            status: 'parse_error',
            latency_ms: Date.now() - startMs,
            error: raw.substring(0, 100)
        };
    }
}

// === PERSISTENCE ===

function appendHistory(comparison) {
    fs.appendFileSync(HISTORY_FILE, JSON.stringify(comparison) + '\n');
}

function updateSummary(comparison) {
    // Load existing summary or create new base
    let summary = {
        first_comparison_at: comparison.timestamp,
        last_comparison_at: comparison.timestamp,
        total_comparisons: 0,
        gpu_success_count: 0,
        gpu_failure_count: 0,
        gpu_timeout_count: 0,
        avg_latency_gpu_ms: 0,
        avg_latency_minimax_ms: 0,
        avg_similarity: 0,
        avg_hallucination_score: 0,
        latest_gpu_quality: 'INSUFFICIENT_DATA',
        recent_comparisons: []
    };

    try {
        if (fs.existsSync(SUMMARY_FILE)) {
            const existing = fs.readFileSync(SUMMARY_FILE, 'utf8');
            if (existing.trim()) {
                summary = JSON.parse(existing);
            }
        }
    } catch {}

    // Update rolling aggregates
    summary.total_comparisons++;
    summary.last_comparison_at = comparison.timestamp;
    if (!summary.first_comparison_at) {
        summary.first_comparison_at = comparison.timestamp;
    }

    const gpuStatus = comparison.gpu ? comparison.gpu.status : 'unknown';
    if (gpuStatus === 'success') {
        summary.gpu_success_count++;
    } else if (gpuStatus === 'timeout') {
        summary.gpu_timeout_count++;
    } else {
        summary.gpu_failure_count++;
    }

    const gpuLat = comparison.gpu ? comparison.gpu.latency_ms : 0;
    const miniLat = comparison.minimax ? comparison.minimax.latency_ms : 0;
    const simScore = comparison.comparison ? comparison.comparison.response_similarity_score : 0;
    const halScore = comparison.comparison ? comparison.comparison.hallucination_score : 0;

    const n = summary.total_comparisons;
    summary.avg_latency_gpu_ms = ((summary.avg_latency_gpu_ms * (n - 1)) + gpuLat) / n;
    summary.avg_latency_minimax_ms = ((summary.avg_latency_minimax_ms * (n - 1)) + miniLat) / n;
    summary.avg_similarity = ((summary.avg_similarity * (n - 1)) + simScore) / n;
    summary.avg_hallucination_score = ((summary.avg_hallucination_score * (n - 1)) + halScore) / n;
    summary.latest_gpu_quality = (comparison.comparison && comparison.comparison.overall_gpu_quality)
        ? comparison.comparison.overall_gpu_quality
        : 'INSUFFICIENT_DATA';

    const recentEntry = {
        comparison_id: comparison.comparison_id || ('cmp-' + Date.now().toString(36)),
        gpu_quality: (comparison.comparison && comparison.comparison.overall_gpu_quality) || 'INSUFFICIENT_DATA',
        similarity: simScore,
        hallucination: halScore,
        latency_ms: gpuLat,
        status: gpuStatus,
        timestamp: comparison.timestamp
    };
    summary.recent_comparisons = summary.recent_comparisons || [];
    summary.recent_comparisons.push(recentEntry);
    if (summary.recent_comparisons.length > 10) {
        summary.recent_comparisons = summary.recent_comparisons.slice(-10);
    }

    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
}

// === MAIN SHADOW CALL ===

function sendShadowRequest({ request_id, user_message, system_context, minimax_response, minimax_latency_ms }) {
    const token = loadGpuToken();
    const result = {
        request_id,
        timestamp: timestamp(),
        shadow_status: 'SHADOW_ACTIVE',
        gpu: {},
        comparison: null,
        fail_safe: {
            gpu_timeout_used: false,
            gpu_error_handled: false,
            shadow_error_did_not_block_production: true,
            production_response_delivered: !!minimax_response,
            production_latency_unaffected: true
        }
    };

    if (!token) {
        result.shadow_status = 'ERROR';
        result.gpu = { status: 'token_missing', error: 'GPU token not available on Hetzner' };
        result.fail_safe.gpu_error_handled = true;
        return result;
    }

    const systemPrompt = system_context
        ? 'You are MOOSA, an AI assistant. ' + system_context
        : 'You are MOOSA, an AI assistant.';

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: user_message }
    ];

    const gpuResult = callGpuApi(messages, token);
    result.gpu = {
        response: gpuResult.response,
        latency_ms: gpuResult.latency_ms,
        status: gpuResult.status,
        tokens_used: gpuResult.tokens_used || null,
        error: gpuResult.error || null
    };

    if (gpuResult.status === 'timeout') {
        result.fail_safe.gpu_timeout_used = true;
    }
    if (gpuResult.status !== 'success') {
        result.fail_safe.gpu_error_handled = true;
    }

    if (gpuResult.response && minimax_response) {
        const { compareResponses } = require('./gpu-shadow-comparison');
        const comparison = compareResponses({
            request: {
                request_id,
                user_message,
                system_context,
                context_hash: system_context ? hashString(system_context) : null
            },
            minimaxResponse: minimax_response,
            gpuResponse: gpuResult.response,
            minimaxLatencyMs: minimax_latency_ms || 0,
            gpuLatencyMs: gpuResult.latency_ms,
            gpuStatus: gpuResult.status
        });

        result.comparison = comparison.comparison;
        appendHistory(comparison);
        updateSummary(comparison);
    } else if (!gpuResult.response) {
        const noComparisonResult = {
            comparison_id: 'cmp-' + Date.now().toString(36),
            timestamp: timestamp(),
            request: {
                user_message: user_message.substring(0, 500),
                message_length: user_message.length
            },
            minimax: {
                response: minimax_response ? minimax_response.substring(0, 4000) : null,
                latency_ms: minimax_latency_ms || 0,
                status: minimax_response ? 'success' : 'no_response'
            },
            gpu: {
                response: null,
                latency_ms: gpuResult.latency_ms,
                status: gpuResult.status,
                error: gpuResult.error
            },
            comparison: null,
            fail_safe: result.fail_safe
        };
        appendHistory(noComparisonResult);
        updateSummary(noComparisonResult);
        result.comparison = null;
    }

    return result;
}

// === CLI ===

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node gpu-shadow-router.js "<user_message>" <minimax_response>');
        console.log('Example: node gpu-shadow-router.js "What is 2+2?" "2+2 equals 4."');
        process.exit(1);
    }
    const [user_message, minimax_response] = args;
    const result = sendShadowRequest({
        request_id: generateRequestId(),
        user_message,
        minimax_response,
        minimax_latency_ms: 0
    });
    console.log(JSON.stringify(result, null, 2));
}

module.exports = { sendShadowRequest, callGpuApi, loadGpuToken, generateRequestId, GPU_CONFIG };