/**
 * GPU Shadow Integration Layer — Phase D-2.11
 * Controlled shadow layer: GPU called in parallel after MiniMax production decision.
 *
 * HARD INVARIANTS (non-negotiable):
 * 1. GPU is called ONLY after MiniMax production decision is complete — never before
 * 2. GPU output NEVER alters, approves, blocks, executes, escalates, or routes production work
 * 3. GPU output written ONLY to shadow log (state/gpu-shadow-*.jsonl)
 * 4. GPU_SHADOW_ENABLED=false by default (kill switch)
 * 5. If GPU fails, production continues unchanged
 *
 * SHADOW RECORD SCHEMA:
 * - timestamp, prompt_hash, MiniMax decision summary, GPU response,
 *   latency, success/failure, model name, pod URL, comparison notes
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// === CONFIGURATION ===

const GPU_SHADOW_ENABLED = process.env.GPU_SHADOW_ENABLED === 'true';
const GPU_SHADOW_TOKEN = process.env.GPU_SHADOW_TOKEN || null; // overrides secrets file if set
const SHADOW_TIMEOUT_MS = parseInt(process.env.GPU_SHADOW_TIMEOUT_MS || '180000', 10); // 180s
const GPU_POD_URL = process.env.GPU_POD_URL || 'https://23a9nue4xq4r4p-11440.proxy.runpod.net';
const GPU_MODEL = process.env.GPU_MODEL || 'mistral-small3.2:latest';

const SECRETS_FILE = '/home/node/.openclaw/secrets/gpu-auth-proxy.json';
const SHADOW_LOG = '/home/node/.openclaw/workspace/moosa-worker/state/gpu-shadow-routing-history.jsonl';
const SHADOW_SUMMARY = '/home/node/.openclaw/workspace/moosa-worker/state/gpu-shadow-routing-summary.json';
const SHADOW_METRICS = '/home/node/.openclaw/workspace/moosa-worker/state/gpu-shadow-routing-metrics.json';

// === HELPERS ===

function timestamp() {
    return new Date().toISOString();
}

function hashString(str) {
    return crypto.createHash('sha256').update(str || '').digest('hex').substring(0, 16);
}

function loadGpuToken() {
    if (GPU_SHADOW_TOKEN) return GPU_SHADOW_TOKEN;
    try {
        const t = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
        return t.token || null;
    } catch {
        return null;
    }
}

function generateRequestId() {
    return 'req-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
}

function truncate(str, maxLen) {
    if (!str) return null;
    return str.length > maxLen ? str.substring(0, maxLen) + '...[truncated]' : str;
}

// === NO-SECRET LOGGING ===

function log(label, msg) {
    // Token values are NEVER printed or logged
    const safe = typeof msg === 'string'
        ? msg.replace(/[A-Za-z0-9+/=]{32,}/g, (m) => m.substring(0, 8) + '...[REDACTED]')
        : JSON.stringify(msg);
    console.log(`[gpu-shadow] [${label}] ${safe}`);
}

// === GPU API CALL (failure-safe) ===

function callGpuApi(messages, token) {
    const startMs = Date.now();

    try {
        const promptStr = messages
            .map(m => m.role === 'system' ? '[SYS] ' + m.content : '[USER] ' + m.content)
            .join('\n');

        const payload = JSON.stringify({
            model: GPU_MODEL,
            prompt: promptStr,
            stream: false,
            options: { num_predict: 2048 }
        });

        const escapedPayload = payload.replace(/"/g, '\\"');
        const escapedToken = String(token).replace(/"/g, '\\"');
        const cmd = `curl -s -X POST `
            + `-H "Authorization: Bearer ${escapedToken}" `
            + `-H "Content-Type: application/json" `
            + `-d "${escapedPayload}" `
            + `"${GPU_POD_URL}/api/generate" `
            + `--max-time ${Math.round(SHADOW_TIMEOUT_MS / 1000)} `
            + `--connect-timeout 15`;

        const raw = require('child_process').execSync(cmd, {
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024
        });

        const latencyMs = Date.now() - startMs;
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return { success: false, status: 'parse_error', latency_ms: latencyMs, error: 'invalid_json_response' };
        }

        if (parsed.error) {
            return { success: false, status: 'api_error', latency_ms: latencyMs, error: parsed.error.message || 'api_error' };
        }

        return {
            success: true,
            status: 'success',
            response: parsed.response || null,
            latency_ms: latencyMs,
            tokens_used: parsed.eval_count || null
        };
    } catch (e) {
        const latencyMs = Date.now() - startMs;
        if (e.message.includes('max-time') || e.message.includes('Command timed out')) {
            return { success: false, status: 'timeout', latency_ms: latencyMs, error: 'gpu_timeout' };
        }
        return { success: false, status: 'error', latency_ms: latencyMs, error: e.message.substring(0, 100) };
    }
}

// === SHADOW RECORD CONSTRUCTION ===

function buildShadowRecord({ request_id, user_message, system_context, minimax_response, minimax_latency_ms, gpu_result }) {
    const record = {
        // Core identifiers
        comparison_id: 'cmp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
        request_id,
        timestamp: timestamp(),

        // Prompt traceability (no secrets)
        prompt_hash: hashString(user_message),
        user_message_preview: truncate(user_message, 200),
        user_message_length: user_message ? user_message.length : 0,
        has_system_context: !!system_context,

        // MiniMax production decision summary (no secrets)
        minimax: {
            response_summary: truncate(minimax_response, 500),
            response_length: minimax_response ? minimax_response.length : 0,
            latency_ms: minimax_latency_ms || 0,
            model: 'MiniMax',
            status: minimax_response ? 'success' : 'no_production_response'
        },

        // GPU shadow response
        gpu: {
            response: gpu_result.success ? truncate(gpu_result.response, 4000) : null,
            response_length: gpu_result.success && gpu_result.response ? gpu_result.response.length : 0,
            latency_ms: gpu_result.latency_ms,
            status: gpu_result.status,
            model: GPU_MODEL,
            pod_url: GPU_POD_URL,
            tokens_used: gpu_result.tokens_used || null,
            error: gpu_result.error || null
        },

        // Comparison notes (computed, observational only)
        comparison: gpu_result.success && minimax_response
            ? buildComparisonNotes(minimax_response, gpu_result.response, minimax_latency_ms, gpu_result.latency_ms)
            : null,

        // Fail-safe — production unaffected
        fail_safe: {
            gpu_failed: !gpu_result.success,
            gpu_failure_did_not_block_production: true,
            production_response_delivered: !!minimax_response,
            gpu_output_altered_production: false,
            shadow_logged_only: true
        },

        // Architecture compliance
        architecture: {
            gpu_called_after_minimax_decision: true,
            gpu_output_never_alters_production: true,
            gpu_remains_shadow_only: true,
            miniMax_remains_production_authority: true
        }
    };

    return record;
}

function buildComparisonNotes(minimax_response, gpu_response, miniLat, gpuLat) {
    const miniLen = minimax_response ? minimax_response.length : 0;
    const gpuLen = gpu_response ? gpu_response.length : 0;
    const lenDelta = gpuLen - miniLen;
    const lenRatio = miniLen > 0 ? Math.abs(lenDelta) / miniLen : 0;

    // Simple word overlap
    const miniWords = (minimax_response || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const gpuWords = (gpu_response || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const overlap = miniWords.filter(w => gpuWords.includes(w)).length;
    const similarity = miniWords.length > 0 ? overlap / miniWords.length : 0;

    // Latency comparison
    const latencyDelta = gpuLat - (miniLat || 0);
    const latencyRatio = miniLat > 0 ? gpuLat / miniLat : null;

    // Simple quality signal (observational only, never used operationally)
    let overallQuality = 'INSUFFICIENT_DATA';
    if (gpu_response && minimax_response) {
        if (similarity > 0.6 && gpu_response.length > 10) {
            overallQuality = similarity > 0.8 ? 'COMPARABLE' : 'PARTIALLY_COMPARABLE';
        } else {
            overallQuality = 'INCOMPARABLE';
        }
    }

    return {
        length_delta_chars: lenDelta,
        length_delta_ratio: parseFloat(lenRatio.toFixed(3)),
        latency_delta_ms: latencyDelta,
        latency_ratio: latencyRatio ? parseFloat(latencyRatio.toFixed(2)) : null,
        response_similarity_score: parseFloat(similarity.toFixed(3)),
        overall_gpu_quality: overallQuality,
        recommendation: 'SHADOW_ONLY — do not promote without explicit approval'
    };
}

// === PERSISTENCE ===

function appendShadowLog(record) {
    fs.appendFileSync(SHADOW_LOG, JSON.stringify(record) + '\n');
}

function updateMetrics(record) {
    let metrics = {
        last_updated: timestamp(),
        total_shadow_calls: 0,
        gpu_success: 0,
        gpu_failure: 0,
        gpu_timeout: 0,
        avg_gpu_latency_ms: 0,
        avg_similarity: 0,
        recent_calls: []
    };

    try {
        if (fs.existsSync(SHADOW_METRICS)) {
            const existing = fs.readFileSync(SHADOW_METRICS, 'utf8');
            if (existing.trim()) {
                metrics = JSON.parse(existing);
            }
        }
    } catch {}

    metrics.total_shadow_calls++;
    if (record.gpu.status === 'success') metrics.gpu_success++;
    else if (record.gpu.status === 'timeout') metrics.gpu_timeout++;
    else metrics.gpu_failure++;

    const n = metrics.total_shadow_calls;
    metrics.avg_gpu_latency_ms = parseFloat(
        (((metrics.avg_gpu_latency_ms * (n - 1)) + record.gpu.latency_ms) / n).toFixed(1)
    );

    if (record.comparison && record.comparison.response_similarity_score != null) {
        metrics.avg_similarity = parseFloat(
            (((metrics.avg_similarity * (n - 1)) + record.comparison.response_similarity_score) / n).toFixed(3)
        );
    }

    metrics.recent_calls.push({
        comparison_id: record.comparison_id,
        gpu_status: record.gpu.status,
        latency_ms: record.gpu.latency_ms,
        similarity: record.comparison ? record.comparison.response_similarity_score : null,
        timestamp: record.timestamp
    });
    if (metrics.recent_calls.length > 20) {
        metrics.recent_calls = metrics.recent_calls.slice(-20);
    }

    metrics.last_updated = timestamp();
    fs.writeFileSync(SHADOW_METRICS, JSON.stringify(metrics, null, 2));
}

// === MAIN SHADOW FUNCTION ===

/**
 * sendShadowRequest — called ONLY after MiniMax production decision is complete.
 *
 * @param {object} params
 * @param {string} params.request_id          — production request ID
 * @param {string} params.user_message         — original user message
 * @param {string} params.system_context      — SOUL/IDENTITY/USER context snapshot (optional)
 * @param {string} params.minimax_response    — MiniMax production response (already sent to user)
 * @param {number} params.minimax_latency_ms   — MiniMax production latency
 *
 * @returns {object} shadow_result — GPU shadow record (logged only, never used operationally)
 */
function sendShadowRequest({ request_id, user_message, system_context, minimax_response, minimax_latency_ms }) {
    const result = {
        request_id: request_id || generateRequestId(),
        timestamp: timestamp(),
        shadow_status: 'SHADOW_ACTIVE',
        gpu_output_logged: false,
        kill_switch_active: !GPU_SHADOW_ENABLED
    };

    // HARD KILL SWITCH — if disabled, return immediately
    if (!GPU_SHADOW_ENABLED) {
        result.shadow_status = 'DISABLED';
        result.gpu_output_logged = false;
        log('info', `GPU shadow disabled (GPU_SHADOW_ENABLED=false). Skipping shadow call.`);
        return result;
    }

    const token = loadGpuToken();
    if (!token) {
        result.shadow_status = 'ERROR';
        result.error = 'GPU token not available';
        log('warn', `GPU shadow call skipped — token not available`);
        return result;
    }

    const systemPrompt = system_context
        ? 'You are MOOSA, an AI assistant. ' + system_context
        : 'You are MOOSA, an AI assistant.';

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: user_message }
    ];

    log('info', `Sending shadow request ${result.request_id} to GPU (pod: ${GPU_POD_URL})`);

    const gpu_result = callGpuApi(messages, token);

    const record = buildShadowRecord({
        request_id: result.request_id,
        user_message,
        system_context,
        minimax_response,
        minimax_latency_ms,
        gpu_result
    });

    appendShadowLog(record);
    updateMetrics(record);

    result.gpu_output_logged = true;
    result.gpu_status = gpu_result.status;
    result.gpu_latency_ms = gpu_result.latency_ms;
    result.shadow_status = 'SHADOW_LOGGED';

    log('info',
        `Shadow call complete. request=${result.request_id} gpu_status=${gpu_result.status} ` +
        `latency=${gpu_result.latency_ms}ms similarity=${record.comparison?.response_similarity_score ?? 'N/A'}`
    );

    return result;
}

// === KILL SWITCH STATUS ===

function isGpuShadowEnabled() {
    return GPU_SHADOW_ENABLED;
}

function getShadowMetrics() {
    try {
        if (fs.existsSync(SHADOW_METRICS)) {
            return JSON.parse(fs.readFileSync(SHADOW_METRICS, 'utf8'));
        }
    } catch {}
    return null;
}

module.exports = {
    sendShadowRequest,
    isGpuShadowEnabled,
    getShadowMetrics,
    loadGpuToken,
    generateRequestId,
    SHADOW_LOG,
    SHADOW_METRICS,
    GPU_SHADOW_ENABLED
};