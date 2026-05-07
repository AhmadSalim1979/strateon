"use strict";
/**
 * Shadow Mode — Dry-Run Execution Wrapper
 * Phase 3: Simulates action execution without making real system calls
 *
 * When ORCHESTRATION_MODE=shadow:
 * - Events are processed through the full pipeline (event bus → router → handlers)
 * - BUT actual system calls (WhatsApp, email, HubSpot, etc.) are simulated
 * - All actions are logged as "would have executed" without being executed
 *
 * This enables:
 * - Safe testing of orchestration logic without side effects
 * - Validation of event flows before production deployment
 * - Replay and recovery testing without risk
 *
 * Shadow mode is configured via the ORCHESTRATION_MODE environment variable.
 * Default is 'production' (real execution).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrchestrationMode = getOrchestrationMode;
exports.isShadowMode = isShadowMode;
exports.isProductionMode = isProductionMode;
exports.withShadowMode = withShadowMode;
exports.productionOnly = productionOnly;
exports.requireProductionMode = requireProductionMode;
exports.logModeInfo = logModeInfo;
exports.getModeConfig = getModeConfig;
/**
 * Get the current orchestration mode.
 * Defaults to 'production' if ORCHESTRATION_MODE is not set.
 */
function getOrchestrationMode() {
    const mode = process.env.ORCHESTRATION_MODE;
    if (mode === 'shadow')
        return 'shadow';
    if (mode === 'production')
        return 'production';
    // Default to production for safety
    return 'production';
}
/**
 * Check if the orchestration runtime is in shadow mode.
 */
function isShadowMode() {
    return getOrchestrationMode() === 'shadow';
}
/**
 * Check if the orchestration runtime is in production mode.
 */
function isProductionMode() {
    return getOrchestrationMode() === 'production';
}
/**
 * Wrap an action function to make it shadow-mode aware.
 *
 * When in shadow mode:
 * - The action is NOT executed
 * - Instead, a ShadowResult is logged and returned
 *
 * When in production mode:
 * - The action IS executed normally
 * - The result is returned
 *
 * @param actionType - Descriptive name of the action (e.g., 'whatsapp.send', 'email.send')
 * @param target - What the action would operate on (e.g., phone number, email address)
 * @param action - The actual action function
 * @param params - Parameters that would be passed to the action
 */
async function withShadowMode(actionType, target, action, params) {
    if (isShadowMode()) {
        const result = {
            simulated: true,
            action_type: actionType,
            would_have_executed: true,
            target,
            params,
            reason: 'Shadow mode active — action simulated, not executed',
            timestamp: new Date().toISOString(),
        };
        console.log(`[shadow-mode] SIMULATED: ${actionType} -> ${target}`);
        console.log(`[shadow-mode]   params: ${JSON.stringify(params)}`);
        // Return a special marker instead of the actual result
        // The caller should handle ShadowResult appropriately
        return result;
    }
    // Production mode — execute normally
    return await action();
}
/**
 * Execute an action only if in production mode.
 * In shadow mode, returns undefined and logs the action.
 */
async function productionOnly(actionType, target, action, params) {
    if (isShadowMode()) {
        console.log(`[shadow-mode] SKIPPED: ${actionType} -> ${target} (shadow mode)`);
        return { executed: false, simulated: true };
    }
    const result = await action();
    console.log(`[production] EXECUTED: ${actionType} -> ${target}`);
    return { executed: true, result };
}
/**
 * Guard: throw if in shadow mode — use for actions that must never be simulated.
 * Useful for critical safety checks where shadow mode should not proceed.
 */
function requireProductionMode(operation) {
    if (isShadowMode()) {
        throw new Error(`Operation '${operation}' blocked in shadow mode. ` +
            `This operation cannot be simulated. Set ORCHESTRATION_MODE=production to execute.`);
    }
}
/**
 * Log the current mode and its implications.
 */
function logModeInfo() {
    const mode = getOrchestrationMode();
    if (mode === 'shadow') {
        console.warn('═══════════════════════════════════════════════════════════════');
        console.warn('⚠️  SHADOW MODE ACTIVE — No real system calls will be made');
        console.warn('═══════════════════════════════════════════════════════════════');
        console.warn('  Actions will be simulated. Set ORCHESTRATION_MODE=production');
        console.warn('  to enable real execution.');
        console.warn('═══════════════════════════════════════════════════════════════');
    }
    else {
        console.log('[orchestration] Production mode — real execution enabled');
    }
}
/**
 * Get mode-specific configuration for handlers.
 */
function getModeConfig() {
    const mode = getOrchestrationMode();
    return {
        mode,
        canExecuteExternalCalls: mode === 'production',
        canModifyProductionData: mode === 'production',
        canSendNotifications: mode === 'production',
        shadowLog: mode === 'shadow',
    };
}
//# sourceMappingURL=shadow-mode.js.map