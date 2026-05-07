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
export function getOrchestrationMode(): OrchestrationMode {
  const mode = process.env.ORCHESTRATION_MODE;
  
  if (mode === 'shadow') return 'shadow';
  if (mode === 'production') return 'production';
  
  // Default to production for safety
  return 'production';
}

/**
 * Check if the orchestration runtime is in shadow mode.
 */
export function isShadowMode(): boolean {
  return getOrchestrationMode() === 'shadow';
}

/**
 * Check if the orchestration runtime is in production mode.
 */
export function isProductionMode(): boolean {
  return getOrchestrationMode() === 'production';
}

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
export async function withShadowMode<T>(
  actionType: string,
  target: string,
  action: () => Promise<T>,
  params: object
): Promise<T | ShadowResult> {
  if (isShadowMode()) {
    const result: ShadowResult = {
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
    return result as any;
  }

  // Production mode — execute normally
  return await action();
}

/**
 * Execute an action only if in production mode.
 * In shadow mode, returns undefined and logs the action.
 */
export async function productionOnly<T>(
  actionType: string,
  target: string,
  action: () => Promise<T>,
  params: object
): Promise<{ executed: false; simulated: true } | { executed: true; result: T }> {
  if (isShadowMode()) {
    console.log(`[shadow-mode] SKIPPED: ${actionType} -> ${target} (shadow mode)`);
    return { executed: false, simulated: true } as any;
  }

  const result = await action();
  console.log(`[production] EXECUTED: ${actionType} -> ${target}`);
  return { executed: true, result } as any;
}

/**
 * Guard: throw if in shadow mode — use for actions that must never be simulated.
 * Useful for critical safety checks where shadow mode should not proceed.
 */
export function requireProductionMode(operation: string): void {
  if (isShadowMode()) {
    throw new Error(
      `Operation '${operation}' blocked in shadow mode. ` +
      `This operation cannot be simulated. Set ORCHESTRATION_MODE=production to execute.`
    );
  }
}

/**
 * Log the current mode and its implications.
 */
export function logModeInfo(): void {
  const mode = getOrchestrationMode();
  
  if (mode === 'shadow') {
    console.warn('═══════════════════════════════════════════════════════════════');
    console.warn('⚠️  SHADOW MODE ACTIVE — No real system calls will be made');
    console.warn('═══════════════════════════════════════════════════════════════');
    console.warn('  Actions will be simulated. Set ORCHESTRATION_MODE=production');
    console.warn('  to enable real execution.');
    console.warn('═══════════════════════════════════════════════════════════════');
  } else {
    console.log('[orchestration] Production mode — real execution enabled');
  }
}

/**
 * Get mode-specific configuration for handlers.
 */
export function getModeConfig(): {
  mode: OrchestrationMode;
  canExecuteExternalCalls: boolean;
  canModifyProductionData: boolean;
  canSendNotifications: boolean;
  shadowLog: boolean;
} {
  const mode = getOrchestrationMode();
  
  return {
    mode,
    canExecuteExternalCalls: mode === 'production',
    canModifyProductionData: mode === 'production',
    canSendNotifications: mode === 'production',
    shadowLog: mode === 'shadow',
  };
}