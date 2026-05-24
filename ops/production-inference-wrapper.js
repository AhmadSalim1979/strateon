/**
 * Production Inference Wrapper
 * 
 * Central production inference entry point for Mode B / AUTO operation.
 * Bridges GPU-primary routing with actual MiniMax inference.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// === CONFIG ===

const GPU_ROUTER = '/home/node/.openclaw/workspace/src/core/gpu-primary-router.js';
const MINIMAX_MODEL = 'MiniMax-M2.7';

// === LOAD MINIMAX API KEY FROM AUTH PROFILES ===

function loadMinimaxApiKey() {
    try {
        const authProfiles = JSON.parse(fs.readFileSync('/root/.openclaw/agents/main/agent/auth-profiles.json', 'utf8'));
        const profiles = authProfiles.providers || authProfiles.profiles || {};
        const minimaxProvider = profiles['minimax:global'] || profiles.minimax || profiles['minimax-portal'];
        return minimaxProvider?.key || minimaxProvider?.apiKey || null;
    } catch (e) {
        return process.env.MINIMAX_API_KEY || null;
    }
}

// === MINIMAX INFERENCE CALL ===

async function callMinimaxInference({ userMessage, systemContext, requestId }) {
    const apiKey = loadMinimaxApiKey();
    if (!apiKey) throw new Error('[production-inference] MINIMAX_API_KEY not found');

    const startMs = Date.now();
    const body = {
        model: MINIMAX_MODEL,
        max_tokens: 4096,
        messages: []
    };
    if (systemContext) body.messages.push({ role: 'system', content: systemContext });
    body.messages.push({ role: 'user', content: userMessage });

    const result = execSync(
        'curl -s --max-time 120 -X POST ' +
        '-H "Authorization: Bearer ' + apiKey + '" ' +
        '-H "Content-Type: application/json" ' +
        '-d @- "https://api.minimax.io/anthropic/v1/messages"',
        { input: JSON.stringify(body), encoding: 'utf8', timeout: 130_000, env: { ...process.env } }
    );

    const latencyMs = Date.now() - startMs;
    const parsed = JSON.parse(result);
    if (parsed.error) throw new Error('MiniMax API error: ' + parsed.error.message);

    const response = parsed.content?.[0]?.text || parsed.choices?.[0]?.message?.content || '';
    return { response, latency_ms: latencyMs, model: MINIMAX_MODEL, status: 'success', request_id: requestId };
}

// === PRODUCTION ROUTE ===

async function productionRoute({ userMessage, systemContext, minimaxResponse, requestId }) {
    const startMs = Date.now();

    let currentMode = 'MODE_A';
    try {
        currentMode = JSON.parse(fs.readFileSync('/home/node/.openclaw/workspace/state/operational-mode.json', 'utf8')).current_mode || 'MODE_A';
    } catch {}

    let gpuPrimaryRoute;
    try {
        gpuPrimaryRoute = require(GPU_ROUTER).gpuPrimaryRoute;
    } catch (e) {
        throw new Error('Failed to load gpu-primary-router: ' + e.message);
    }

    const result = {
        production_response: null, source: null, quality: null,
        fallback_reason: null, gpu_result: null, minimax_result: null,
        latency_ms: 0, mode: currentMode,
        request_id: requestId || ('prod-' + Date.now().toString(36))
    };

    try {
        const gpuRouteResult = gpuPrimaryRoute({
            userMessage,
            minimax_response: minimaxResponse || '',
            minimax_latency_ms: 0,
            requestId: result.request_id
        });

        result.gpu_result = gpuRouteResult.gpu;
        result.quality = gpuRouteResult.quality;
        result.fallback_reason = gpuRouteResult.fallback_reason;

        if (gpuRouteResult.source === 'GPU') {
            // GPU response is production quality
            result.production_response = gpuRouteResult.gpu.response;
            result.source = 'GPU';
        } else {
            // Fallback to MiniMax — always call actual API in production
            result.fallback_reason = gpuRouteResult.fallback_reason || 'mode_a';
            try {
                const mini = await callMinimaxInference({
                    userMessage, systemContext, requestId: result.request_id + '-mini'
                });
                result.minimax_result = mini;
                result.production_response = mini.response;
                result.source = 'Minimax';
            } catch (miniError) {
                // Emergency: use GPU even if marked WORSE
                console.error('[production-inference] MiniMax fallback failed:', miniError.message);
                result.production_response = gpuRouteResult.gpu.response;
                result.source = 'GPU';
                result.fallback_reason = 'minimax_failure';
                result.quality = 'FAILED';
            }
        }

        result.latency_ms = Date.now() - startMs;
        logProductionEvent(result);
        return result;

    } catch (e) {
        console.error('[production-inference] Production route error:', e.message);
        result.latency_ms = Date.now() - startMs;
        result.source = 'ERROR';
        result.quality = 'FAILED';
        result.fallback_reason = 'production_error';

        try {
            const mini = await callMinimaxInference({ userMessage, systemContext, requestId: result.request_id + '-emergency' });
            result.production_response = mini.response;
            result.source = 'Minimax';
            result.minimax_result = mini;
        } catch {
            if (result.gpu_result?.response) {
                result.production_response = result.gpu_result.response;
                result.source = 'GPU';
            } else {
                result.production_response = 'I apologize, but I encountered an error processing your request. Please try again.';
                result.source = 'FALLBACK_RESPONSE';
            }
        }

        logProductionEvent(result);
        return result;
    }
}

// === MODE A INFERENCE (MiniMax primary + GPU shadow) ===

async function productionRouteModeA({ userMessage, systemContext, requestId }) {
    const startMs = Date.now();
    const reqId = requestId || ('proda-' + Date.now().toString(36));

    let miniResult;
    try {
        miniResult = await callMinimaxInference({ userMessage, systemContext, requestId: reqId });
    } catch (e) {
        console.error('[production-route-MODE_A] MiniMax failed:', e.message);
        return {
            production_response: 'I apologize, but I encountered an error. Please try again.',
            source: 'Minimax', quality: 'FAILED', fallback_reason: 'minimax_failure',
            latency_ms: Date.now() - startMs, mode: 'MODE_A', request_id: reqId
        };
    }

    let gpuShadowResult = null;
    try {
        const { gpuPrimaryRoute } = require(GPU_ROUTER);
        gpuShadowResult = gpuPrimaryRoute({
            userMessage,
            minimax_response: miniResult.response,
            minimax_latency_ms: miniResult.latency_ms,
            requestId: reqId + '-shadow'
        });
    } catch (e) {
        console.warn('[production-route-MODE_A] GPU shadow failed (non-fatal):', e.message);
    }

    const entry = {
        production_response: miniResult.response,
        source: 'Minimax', quality: 'PRIMARY_MINIMAX', fallback_reason: null,
        latency_ms: Date.now() - startMs, mode: 'MODE_A',
        gpu_shadow: gpuShadowResult ? {
            quality: gpuShadowResult.quality,
            similarity: gpuShadowResult.gpu?.hallucination_score,
            latency_ms: gpuShadowResult.gpu?.latency_ms
        } : null,
        request_id: reqId
    };

    logProductionEvent(entry);
    return entry;
}

// === RUNTIME LOGGING ===

const PRODUCTION_LOG = '/home/node/.openclaw/workspace/state/production-inference-log.jsonl';

function logProductionEvent(event) {
    const entry = {
        timestamp: new Date().toISOString(),
        request_id: event.request_id, mode: event.mode,
        source: event.source, quality: event.quality,
        fallback_reason: event.fallback_reason,
        latency_ms: event.latency_ms,
        gpu_quality: event.gpu_result?.quality || null,
        gpu_latency_ms: event.gpu_result?.latency_ms || null,
        minimax_latency_ms: event.minimax_result?.latency_ms || null,
        response_length: event.production_response?.length || 0
    };
    try {
        const dir = path.dirname(PRODUCTION_LOG);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(PRODUCTION_LOG, JSON.stringify(entry) + '\n');
    } catch {}
}

// === CLI ===

if (require.main === module) {
    const args = process.argv.slice(2);
    const cmd = args[0];
    const userMessage = args.slice(1).join(' ');
    if (!userMessage) {
        console.log('Usage: node production-inference-wrapper.js [route|minimax-only|gpu-primary] "<msg>"');
        process.exit(1);
    }

    const reqId = 'cli-' + Date.now().toString(36);

    if (cmd === 'minimax-only') {
        productionRouteModeA({ userMessage, requestId: reqId })
            .then(r => { console.log('\nSource:', r.source, '| Quality:', r.quality, '| Latency:', r.latency_ms, 'ms'); console.log('\nResponse:\n' + r.production_response); process.exit(0); })
            .catch(e => { console.error(e.message); process.exit(1); });
    } else if (cmd === 'gpu-primary') {
        productionRoute({ userMessage, requestId: reqId })
            .then(r => { console.log('\nSource:', r.source, '| Quality:', r.quality, '| Fallback:', r.fallback_reason, '| Latency:', r.latency_ms, 'ms'); console.log('\nResponse:\n' + r.production_response); process.exit(0); })
            .catch(e => { console.error(e.message); process.exit(1); });
    } else {
        let currentMode = 'MODE_A';
        try { currentMode = JSON.parse(fs.readFileSync('/home/node/.openclaw/workspace/state/operational-mode.json', 'utf8')).current_mode || 'MODE_A'; } catch {}
        const routeFn = currentMode === 'MODE_A' ? productionRouteModeA : productionRoute;
        routeFn({ userMessage, requestId: reqId })
            .then(r => { console.log('\nMode:', currentMode, '\nSource:', r.source, '| Quality:', r.quality, '| Fallback:', r.fallback_reason, '| Latency:', r.latency_ms, 'ms'); console.log('\nResponse:\n' + r.production_response); process.exit(0); })
            .catch(e => { console.error(e.message); process.exit(1); });
    }
}

module.exports = { productionRoute, productionRouteModeA, callMinimaxInference };