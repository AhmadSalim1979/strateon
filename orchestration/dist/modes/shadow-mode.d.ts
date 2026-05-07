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
export type OrchestrationMode = 'shadow' | 'production';
/**
 * Get the current orchestration mode.
 * Defaults to 'production' if ORCHESTRATION_MODE is not set.
 */
export declare function getOrchestrationMode(): OrchestrationMode;
/**
 * Check if the orchestration runtime is in shadow mode.
 */
export declare function isShadowMode(): boolean;
/**
 * Check if the orchestration runtime is in production mode.
 */
export declare function isProductionMode(): boolean;
/**
 * Result of a shadow-mode action simulation.
 */
export interface ShadowResult {
    simulated: true;
    action_type: string;
    would_have_executed: boolean;
    target: string;
    params: object;
    reason: string;
    timestamp: string;
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
export declare function withShadowMode<T>(actionType: string, target: string, action: () => Promise<T>, params: object): Promise<T | ShadowResult>;
/**
 * Execute an action only if in production mode.
 * In shadow mode, returns undefined and logs the action.
 */
export declare function productionOnly<T>(actionType: string, target: string, action: () => Promise<T>, params: object): Promise<{
    executed: false;
    simulated: true;
} | {
    executed: true;
    result: T;
}>;
/**
 * Guard: throw if in shadow mode — use for actions that must never be simulated.
 * Useful for critical safety checks where shadow mode should not proceed.
 */
export declare function requireProductionMode(operation: string): void;
/**
 * Log the current mode and its implications.
 */
export declare function logModeInfo(): void;
/**
 * Get mode-specific configuration for handlers.
 */
export declare function getModeConfig(): {
    mode: OrchestrationMode;
    canExecuteExternalCalls: boolean;
    canModifyProductionData: boolean;
    canSendNotifications: boolean;
    shadowLog: boolean;
};
//# sourceMappingURL=shadow-mode.d.ts.map