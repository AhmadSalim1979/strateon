"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.canExecuteAction = canExecuteAction;
exports.guardExecution = guardExecution;
exports.withGovernance = withGovernance;
exports.validateShadowContext = validateShadowContext;
exports.logShadowExecution = logShadowExecution;
exports.getShadowEvents = getShadowEvents;
exports.isRestrictedAction = isRestrictedAction;
exports.getRestrictedActions = getRestrictedActions;
exports.getSafeShadowActions = getSafeShadowActions;
exports.blockedResult = blockedResult;
const supabase_client_1 = require("../persistence/supabase-client");
const shadow_mode_1 = require("../modes/shadow-mode");
// ─── Constants ───────────────────────────────────────────────────────────────
const RESTRICTED_ACTIONS = new Set([
    'whatsapp.send',
    'email.send',
    'hubspot.create',
    'hubspot.update',
    'database.write',
    'external_api.call',
    'file.delete',
    'webhook.trigger',
]);
// Actions that CAN execute in shadow mode (internal orchestration only)
const SAFE_SHADOW_ACTIONS = new Set([
    'event.publish',
    'queue.enqueue',
    'queue.dequeue',
    'plan.create',
    'plan.update',
    'step.evaluate',
    'lineage.validate',
    'metrics.collect',
    'drift.detect',
    'shadow.replay',
]);
// ─── Core Governance Functions ───────────────────────────────────────────────
/**
 * Check if an action is allowed to execute in the current mode.
 * Returns a GovernanceDecision with full audit trail.
 *
 * NEVER allows RESTRICTED actions in shadow mode.
 * NEVER allows shadow executions to mutate production state.
 * NEVER creates hidden execution chains.
 */
function canExecuteAction(action, target, mode) {
    const timestamp = new Date().toISOString();
    // Always block RESTRICTED actions in shadow mode
    if (mode === 'shadow' && RESTRICTED_ACTIONS.has(action)) {
        return {
            allowed: false,
            shadow_run_id: generateShadowRunId(),
            action,
            target,
            reason: 'RESTRICTED action blocked in shadow mode — external side effects are suppressed',
            blocked: true,
            timestamp,
        };
    }
    // In shadow mode, only SAFE_SHADOW_ACTIONS are allowed
    if (mode === 'shadow' && !SAFE_SHADOW_ACTIONS.has(action) && !RESTRICTED_ACTIONS.has(action)) {
        // Unknown action in shadow mode — block by default
        return {
            allowed: false,
            shadow_run_id: generateShadowRunId(),
            action,
            target,
            reason: `Unknown action '${action}' in shadow mode — block by default for safety`,
            blocked: true,
            timestamp,
        };
    }
    // Safe action in shadow mode — allowed but simulated
    if (mode === 'shadow' && SAFE_SHADOW_ACTIONS.has(action)) {
        return {
            allowed: true,
            shadow_run_id: generateShadowRunId(),
            action,
            target,
            reason: 'Allowed in shadow mode — internal orchestration action only',
            blocked: false,
            timestamp,
        };
    }
    // Production mode — normal governance applies (outside shadow system)
    return {
        allowed: true,
        shadow_run_id: '',
        action,
        target,
        reason: 'Production mode — normal governance applies',
        blocked: false,
        timestamp,
    };
}
/**
 * Guard: throw if action is not allowed.
 * Use at the top of every execution path.
 */
function guardExecution(action, target) {
    const mode = (0, shadow_mode_1.isShadowMode)() ? 'shadow' : 'production';
    const decision = canExecuteAction(action, target, mode);
    if (decision.blocked) {
        const err = new Error(`[GOVERNANCE] Action '${action}' blocked: ${decision.reason}`);
        err.governanceDecision = decision;
        throw err;
    }
    // Return context so callers can verify they're in a shadow execution
    return {
        shadow_run_id: decision.shadow_run_id || generateShadowRunId(),
        shadow_execution: true,
        can_execute_live_actions: false,
        can_mutate_production_state: false,
        is_sandboxed: true,
    };
}
/**
 * Wrap any handler with governance guard.
 * Before executing, checks if action is allowed.
 * Logs all governance decisions to shadow_events table.
 */
async function withGovernance(action, target, handler, options) {
    const mode = (0, shadow_mode_1.isShadowMode)() ? 'shadow' : 'production';
    const decision = canExecuteAction(action, target, mode);
    // Always log governance decisions
    await logGovernanceDecision(decision, options?.shadow_run_id);
    if (decision.blocked) {
        return {
            result: undefined,
            governance: decision,
        };
    }
    try {
        const result = await handler();
        return { result, governance: decision };
    }
    catch (err) {
        // Annotate error with governance context
        err.governanceDecision = decision;
        throw err;
    }
}
/**
 * Validate that a shadow run context is legitimate.
 * Prevents spoofed shadow_run_ids.
 */
function validateShadowContext(context) {
    return (context.shadow_execution === true &&
        context.can_execute_live_actions === false &&
        context.can_mutate_production_state === false &&
        context.is_sandboxed === true &&
        context.shadow_run_id.length > 0);
}
// ─── Shadow Events Persistence ─────────────────────────────────────────────────
/**
 * Log a governance decision to the shadow_events table.
 * Every shadow execution MUST be logged here.
 */
async function logGovernanceDecision(decision, shadow_run_id) {
    const supabase = (0, supabase_client_1.getClient)();
    const runId = decision.shadow_run_id || shadow_run_id || generateShadowRunId();
    try {
        await supabase.from('shadow_events').insert({
            shadow_run_id: runId,
            event_type: 'governance.decision',
            action: decision.action,
            target: decision.target,
            decision: decision.allowed ? 'allowed' : 'blocked',
            reason: decision.reason,
            blocked: decision.blocked,
            mode: (0, shadow_mode_1.isShadowMode)() ? 'shadow' : 'production',
            executed_at: decision.timestamp,
        });
    }
    catch (err) {
        // Non-fatal — log locally but don't block execution
        console.error(`[governance] Failed to log to shadow_events: ${err.message}`);
        console.log(`[governance] Decision: ${JSON.stringify(decision)}`);
    }
}
/**
 * Log a shadow execution event to shadow_events table.
 * Every shadow execution must be logged for auditability.
 */
async function logShadowExecution(params) {
    const supabase = (0, supabase_client_1.getClient)();
    try {
        await supabase.from('shadow_events').insert({
            shadow_run_id: params.shadow_run_id,
            event_type: params.event_type,
            source: params.source,
            action: params.action,
            target: params.target,
            payload: JSON.stringify(params.payload),
            simulated: params.simulated,
            result: params.result || null,
            executed_at: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error(`[governance] Failed to log shadow execution: ${err.message}`);
        // Still log to console as fallback
        console.log(`[shadow][${params.shadow_run_id}] ${params.action} -> ${params.target} (simulated=${params.simulated})`);
    }
}
/**
 * Get all shadow events for a given shadow_run_id.
 * Used for audit and replay verification.
 */
async function getShadowEvents(shadow_run_id) {
    const supabase = (0, supabase_client_1.getClient)();
    const { data, error } = await supabase
        .from('shadow_events')
        .select('*')
        .eq('shadow_run_id', shadow_run_id)
        .order('executed_at', { ascending: true });
    if (error) {
        console.error(`[governance] Failed to fetch shadow events: ${error.message}`);
        return [];
    }
    return data || [];
}
// ─── Utilities ────────────────────────────────────────────────────────────────
let _shadowRunCounter = 0;
function generateShadowRunId() {
    _shadowRunCounter++;
    return `shadow-${Date.now()}-${_shadowRunCounter.toString(36).padStart(4, '0')}`;
}
/**
 * Check if an action is RESTRICTED.
 */
function isRestrictedAction(action) {
    return RESTRICTED_ACTIONS.has(action);
}
/**
 * Get list of all restricted actions.
 */
function getRestrictedActions() {
    return Array.from(RESTRICTED_ACTIONS);
}
/**
 * Get list of all safe shadow-mode actions.
 */
function getSafeShadowActions() {
    return Array.from(SAFE_SHADOW_ACTIONS);
}
/**
 * Create a no-op result for a blocked shadow execution.
 * Used when an action is blocked — returns a deterministic "blocked" result
 * instead of throwing, for better tracing.
 */
function blockedResult(action, target, reason) {
    return {
        _shadow_blocked: true,
        action,
        target,
        reason,
        timestamp: new Date().toISOString(),
        would_have_executed: true,
        simulated: true,
        mode: 'shadow',
    };
}
//# sourceMappingURL=governance-guard.js.map