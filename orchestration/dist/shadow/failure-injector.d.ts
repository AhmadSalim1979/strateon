/**
 * Failure Injector — Phase 4: Failure Injection Testing
 *
 * Failure injection testing validates that the orchestration runtime
 * handles failures gracefully. It injects failures at various points
 * in the execution path and validates that:
 *
 * - Failures are properly detected and classified
 * - Error recovery mechanisms work correctly
 * - Dead letter queue handling is correct
 * - Retry backoff is properly enforced
 * - Shadow execution remains isolated even under failure
 *
 * Failure injection is ONLY for testing — never enabled in production.
 * Controlled via FAILURE_INJECTION_ENABLED=true environment variable.
 *
 * Injection points:
 * - Event processing: inject failures on specific event types
 * - Queue operations: inject failures on enqueue/dequeue
 * - Network calls: inject failures on external API calls
 * - Node execution: inject failures on specific workflow nodes
 */
export type FailureType = 'network_error' | 'timeout_error' | 'validation_error' | 'resource_exhausted' | 'dependency_unavailable' | 'rate_limit_exceeded' | 'internal_error';
export interface FailureScenario {
    scenario_id: string;
    name: string;
    failure_type: FailureType;
    injection_point: 'event_processing' | 'queue_operation' | 'network_call' | 'node_execution';
    trigger_condition: string;
    probability: number;
    injected_error_message: string;
    simulated_delay_ms: number;
    enabled: boolean;
}
export interface FailureInjectionContext {
    scenario_id: string;
    shadow_run_id: string;
    injection_point: string;
    failure_type: FailureType;
    error_message: string;
    injected_at: string;
}
export interface TestResult {
    scenario_id: string;
    shadow_run_id: string;
    passed: boolean;
    expected_behavior: string;
    actual_behavior: string;
    recovery_successful: boolean;
    duration_ms: number;
    error_message?: string;
}
/**
 * Initialize failure injection system.
 * Only enabled if FAILURE_INJECTION_ENABLED=true.
 */
export declare function initFailureInjection(): void;
/**
 * Check if failure injection is enabled.
 */
export declare function isFailureInjectionEnabled(): boolean;
/**
 * Check if a specific scenario is enabled.
 */
export declare function isScenarioEnabled(scenario_id: string): boolean;
/**
 * Enable or disable a specific scenario.
 */
export declare function setScenarioEnabled(scenario_id: string, enabled: boolean): void;
/**
 * Get all registered scenarios.
 */
export declare function getAllScenarios(): FailureScenario[];
/**
 * Register a custom failure scenario.
 */
export declare function registerScenario(scenario: FailureScenario): void;
/**
 * Check if a failure should be injected for the given context.
 * Returns the injected error if triggered, null otherwise.
 */
export declare function shouldInjectFailure(injectionPoint: string, context: {
    event_type?: string;
    shadow_run_id?: string;
    node_type?: string;
    extra?: string;
}): FailureInjectionContext | null;
/**
 * Throw an injected failure error.
 * Call this in handlers when shouldInjectFailure returns non-null.
 */
export declare function throwInjectedError(context: FailureInjectionContext): never;
/**
 * Wrap a handler with failure injection.
 * Use in handlers to automatically inject failures.
 */
export declare function withFailureInjection<T>(handler: () => Promise<T>, injectionPoint: string, context: {
    event_type?: string;
    shadow_run_id?: string;
    node_type?: string;
}): Promise<T>;
export interface FailureTestContext {
    shadow_run_id: string;
    scenario_id: string;
    start_time: string;
    end_time?: string;
    passed: boolean;
    recovery_successful: boolean;
    error_captured?: string;
    logs: string[];
}
/**
 * Run a failure injection test.
 * Executes a handler with a specific scenario enabled and validates recovery.
 */
export declare function runFailureTest(params: {
    scenario_id: string;
    handler: () => Promise<void>;
    expectedBehavior: string;
    shadow_run_id?: string;
}): Promise<TestResult>;
/**
 * Run all enabled failure scenarios against a handler.
 */
export declare function runAllFailureTests(handler: (scenario: FailureScenario) => Promise<void>, options?: {
    shadow_run_id?: string;
}): Promise<TestResult[]>;
/**
 * Get failure injection statistics.
 */
export declare function getFailureInjectionStats(): {
    enabled: boolean;
    total_scenarios: number;
    enabled_scenarios: number;
    injection_count: number;
    scenarios: FailureScenario[];
};
/**
 * Reset failure injection statistics.
 */
export declare function resetFailureInjectionStats(): void;
/**
 * Disable all failure scenarios.
 */
export declare function disableAllScenarios(): void;
/**
 * Enable all failure scenarios.
 */
export declare function enableAllScenarios(): void;
//# sourceMappingURL=failure-injector.d.ts.map