/**
 * GPU Shadow Layer Wrapper — Phase D-2.11
 *
 * Safe wrapper for the moosa-worker to call GPU shadow in parallel after MiniMax.
 * Usage: after MiniMax production decision is complete, call:
 *
 *   const shadow = require('./gpu-shadow-layer');
 *   shadow.sendShadowRequest({
 *     request_id: currentRequestId,
 *     user_message: userInput,
 *     system_context: contextSnapshot,
 *     minimax_response: productionResponse,
 *     minimax_latency_ms: productionLatency
 *   });
 *
 * HARD INVARIANTS (enforced by gpu-shadow-layer.js):
 * 1. GPU called ONLY after MiniMax production decision — never before
 * 2. GPU output NEVER used operationally — logged to shadow log only
 * 3. GPU_SHADOW_ENABLED=false by default — kill switch must be explicitly set
 * 4. Failures do not block or alter production responses
 * 5. No secrets logged — only hashes and previews
 */

const shadowLayer = require('./gpu-shadow-layer');

/**
 * shadowCall — call GPU in shadow mode after MiniMax production response.
 *
 * This function is designed to be fire-and-forget from the worker's perspective.
 * The GPU result is appended to the shadow log. The worker continues.
 *
 * @param {object} params — same as gpu-shadow-layer.sendShadowRequest
 * @returns {object} — shadow call result (status only, not the GPU response)
 */
function shadowCall(params) {
    return shadowLayer.sendShadowRequest(params);
}

/**
 * shadowEnabled — returns true if GPU shadow is enabled via env var.
 */
function shadowEnabled() {
    return shadowLayer.isGpuShadowEnabled();
}

/**
 * shadowMetrics — returns current shadow metrics (last 20 calls).
 */
function shadowMetrics() {
    return shadowLayer.getShadowMetrics();
}

module.exports = {
    shadowCall,
    shadowEnabled,
    shadowMetrics
};