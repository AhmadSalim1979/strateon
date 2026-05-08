/**
 * Governance Guard — Phase 4: Shadow Execution Constraint Enforcement
 *
 * This module is the last line of defense before any shadow execution.
 * It enforces ALL Phase 4 constraints:
 *
 * - Prevents shadow execution from touching production state
 * - Blocks RESTRICTED action execution in shadow mode
 * - Prevents shadow → production auto-promotion
 * - Ensures no hidden execution chains
 * - Maintains audit trail for all shadow executions
 *
 * Shadow executions must:
 *   - Remain observable (logged to shadow_events table)
 *   - Be reversible (all shadow state isolated)
 *   - Be isolated (separate from production execution paths)
 *   - Preserve auditability
 *   - Preserve governance boundaries
 */
export type RestrictedAction = 'whatsapp.send' | 'email.send' | 'hubspot.create' | 'hubspot.update' | 'database.write' | 'external_api.call' | 'file.delete' | 'webhook.trigger';
export interface GovernanceDecision {
    allowed: boolean;
    shadow_run_id: string;
    action: string;
    target: string;
    reason: string;
    blocked: boolean;
    timestamp: string;
}
export interface ShadowExecutionContext {
    shadow_run_id: string;
    shadow_execution: true;
    can_execute_live_actions: false;
    can_mutate_production_state: false;
    is_sandboxed: true;
}
/**
 * Check if an action is allowed to execute in the current mode.
 * Returns a GovernanceDecision with full audit trail.
 *
 * NEVER allows RESTRICTED actions in shadow mode.
 * NEVER allows shadow executions to mutate production state.
 * NEVER creates hidden execution chains.
 */
export declare function canExecuteAction(action: string, target: string, mode: 'shadow' | 'production'): GovernanceDecision;
/**
 * Guard: throw if action is not allowed.
 * Use at the top of every execution path.
 */
export declare function guardExecution(action: string, target: string): ShadowExecutionContext;
/**
 * Wrap any handler with governance guard.
 * Before executing, checks if action is allowed.
 * Logs all governance decisions to shadow_events table.
 */
export declare function withGovernance<T>(action: string, target: string, handler: () => Promise<T>, options?: {
    shadow_run_id?: string;
}): Promise<{
    result?: T;
    governance: GovernanceDecision;
}>;
/**
 * Validate that a shadow run context is legitimate.
 * Prevents spoofed shadow_run_ids.
 */
export declare function validateShadowContext(context: ShadowExecutionContext): boolean;
/**
 * Log a shadow execution event to shadow_events table.
 * Every shadow execution must be logged for auditability.
 */
export declare function logShadowExecution(params: {
    shadow_run_id: string;
    event_type: string;
    source: string;
    action: string;
    target: string;
    payload: object;
    simulated: boolean;
    result?: string;
}): Promise<void>;
/**
 * Get all shadow events for a given shadow_run_id.
 * Used for audit and replay verification.
 */
export declare function getShadowEvents(shadow_run_id: string): Promise<any[]>;
/**
 * Check if an action is RESTRICTED.
 */
export declare function isRestrictedAction(action: string): boolean;
/**
 * Get list of all restricted actions.
 */
export declare function getRestrictedActions(): string[];
/**
 * Get list of all safe shadow-mode actions.
 */
export declare function getSafeShadowActions(): string[];
/**
 * Create a no-op result for a blocked shadow execution.
 * Used when an action is blocked — returns a deterministic "blocked" result
 * instead of throwing, for better tracing.
 */
export declare function blockedResult(action: string, target: string, reason: string): any;
//# sourceMappingURL=governance-guard.d.ts.map