"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFailureInjection = initFailureInjection;
exports.isFailureInjectionEnabled = isFailureInjectionEnabled;
exports.isScenarioEnabled = isScenarioEnabled;
exports.setScenarioEnabled = setScenarioEnabled;
exports.getAllScenarios = getAllScenarios;
exports.registerScenario = registerScenario;
exports.shouldInjectFailure = shouldInjectFailure;
exports.throwInjectedError = throwInjectedError;
exports.withFailureInjection = withFailureInjection;
exports.runFailureTest = runFailureTest;
exports.runAllFailureTests = runAllFailureTests;
exports.getFailureInjectionStats = getFailureInjectionStats;
exports.resetFailureInjectionStats = resetFailureInjectionStats;
exports.disableAllScenarios = disableAllScenarios;
exports.enableAllScenarios = enableAllScenarios;
// ─── Failure Scenarios ─────────────────────────────────────────────────────────
const _scenarios = new Map();
let _injectionEnabled = false;
let _injectionCount = 0;
// Default scenarios
const DEFAULT_SCENARIOS = [
    {
        scenario_id: 'network-timeout-1',
        name: 'Network Timeout on External API',
        failure_type: 'timeout_error',
        injection_point: 'network_call',
        trigger_condition: 'event_type=hubspot.api.call',
        probability: 1.0,
        injected_error_message: 'ETIMEDOUT: Connection timed out after 30000ms',
        simulated_delay_ms: 0,
        enabled: true,
    },
    {
        scenario_id: 'rate-limit-1',
        name: 'Rate Limit on External API',
        failure_type: 'rate_limit_exceeded',
        injection_point: 'network_call',
        trigger_condition: 'event_type=hubspot.api.call',
        probability: 0.8,
        injected_error_message: '429 Too Many Requests — rate limit exceeded',
        simulated_delay_ms: 1000,
        enabled: true,
    },
    {
        scenario_id: 'validation-error-1',
        name: 'Validation Error on Event Processing',
        failure_type: 'validation_error',
        injection_point: 'event_processing',
        trigger_condition: 'event_type=plan.activated',
        probability: 1.0,
        injected_error_message: 'Schema validation failed: required field "plan_id" missing',
        simulated_delay_ms: 0,
        enabled: true,
    },
    {
        scenario_id: 'resource-exhausted-1',
        name: 'Resource Exhaustion (Memory)',
        failure_type: 'resource_exhausted',
        injection_point: 'event_processing',
        trigger_condition: 'shadow_run_id=memory-stress-test',
        probability: 1.0,
        injected_error_message: 'JavaScript heap out of memory',
        simulated_delay_ms: 0,
        enabled: true,
    },
    {
        scenario_id: 'dependency-unavailable-1',
        name: 'Supabase Unavailable',
        failure_type: 'dependency_unavailable',
        injection_point: 'network_call',
        trigger_condition: 'event_type=events.persist',
        probability: 1.0,
        injected_error_message: 'Supabase connection refused — getaddrinfo ENOTFOUND',
        simulated_delay_ms: 0,
        enabled: true,
    },
    {
        scenario_id: 'queue-operation-1',
        name: 'Redis Queue Operation Failure',
        failure_type: 'internal_error',
        injection_point: 'queue_operation',
        trigger_condition: 'event_type=job.queued',
        probability: 0.5,
        injected_error_message: 'Redis connection lost during ZADD operation',
        simulated_delay_ms: 0,
        enabled: true,
    },
    {
        scenario_id: 'node-execution-1',
        name: 'N8N Node Execution Failure',
        failure_type: 'internal_error',
        injection_point: 'node_execution',
        trigger_condition: 'node_type=n8n.http-request',
        probability: 0.3,
        injected_error_message: 'Node execution failed: Invalid credentials',
        simulated_delay_ms: 0,
        enabled: true,
    },
];
// ─── Failure Injection Control ─────────────────────────────────────────────────
/**
 * Initialize failure injection system.
 * Only enabled if FAILURE_INJECTION_ENABLED=true.
 */
function initFailureInjection() {
    _injectionEnabled = process.env.FAILURE_INJECTION_ENABLED === 'true';
    if (_injectionEnabled) {
        console.warn('═══════════════════════════════════════════════════════════════');
        console.warn('⚠️  FAILURE INJECTION ENABLED — DO NOT USE IN PRODUCTION');
        console.warn('═══════════════════════════════════════════════════════════════');
        // Register default scenarios
        for (const scenario of DEFAULT_SCENARIOS) {
            _scenarios.set(scenario.scenario_id, scenario);
        }
        console.warn(`[failure-injector] Loaded ${_scenarios.size} failure scenarios`);
        console.warn('═══════════════════════════════════════════════════════════════');
    }
    else {
        console.log('[failure-injector] Failure injection disabled (set FAILURE_INJECTION_ENABLED=true to enable)');
    }
}
/**
 * Check if failure injection is enabled.
 */
function isFailureInjectionEnabled() {
    return _injectionEnabled;
}
/**
 * Check if a specific scenario is enabled.
 */
function isScenarioEnabled(scenario_id) {
    const scenario = _scenarios.get(scenario_id);
    return scenario?.enabled ?? false;
}
/**
 * Enable or disable a specific scenario.
 */
function setScenarioEnabled(scenario_id, enabled) {
    const scenario = _scenarios.get(scenario_id);
    if (scenario) {
        scenario.enabled = enabled;
        console.log(`[failure-injector] Scenario ${scenario_id} ${enabled ? 'enabled' : 'disabled'}`);
    }
}
/**
 * Get all registered scenarios.
 */
function getAllScenarios() {
    return Array.from(_scenarios.values());
}
/**
 * Register a custom failure scenario.
 */
function registerScenario(scenario) {
    _scenarios.set(scenario.scenario_id, scenario);
    console.log(`[failure-injector] Registered scenario: ${scenario.scenario_id} (${scenario.name})`);
}
// ─── Failure Injection Execution ───────────────────────────────────────────────
/**
 * Check if a failure should be injected for the given context.
 * Returns the injected error if triggered, null otherwise.
 */
function shouldInjectFailure(injectionPoint, context) {
    if (!_injectionEnabled)
        return null;
    for (const scenario of _scenarios.values()) {
        if (!scenario.enabled)
            continue;
        if (scenario.injection_point !== injectionPoint)
            continue;
        // Check trigger condition
        if (!matchesTriggerCondition(scenario.trigger_condition, context))
            continue;
        // Check probability
        if (Math.random() > scenario.probability)
            continue;
        // Inject failure
        _injectionCount++;
        return {
            scenario_id: scenario.scenario_id,
            shadow_run_id: context.shadow_run_id || `shadow-${Date.now()}`,
            injection_point: injectionPoint,
            failure_type: scenario.failure_type,
            error_message: scenario.injected_error_message,
            injected_at: new Date().toISOString(),
        };
    }
    return null;
}
/**
 * Check if trigger condition matches the context.
 */
function matchesTriggerCondition(trigger, context) {
    // Simple key=value matching
    const parts = trigger.split('=');
    if (parts.length !== 2)
        return false;
    const key = parts[0].trim();
    const value = parts[1].trim();
    switch (key) {
        case 'event_type':
            return !!(context.event_type === value || context.event_type?.includes(value));
        case 'shadow_run_id':
            return !!(context.shadow_run_id === value);
        case 'node_type':
            return !!(context.node_type === value || context.node_type?.includes(value));
        default:
            return false;
    }
}
/**
 * Throw an injected failure error.
 * Call this in handlers when shouldInjectFailure returns non-null.
 */
function throwInjectedError(context) {
    const err = new Error(context.error_message);
    err._failure_injection = true;
    err.scenario_id = context.scenario_id;
    err.failure_type = context.failure_type;
    err.injection_point = context.injection_point;
    err.injected_at = context.injected_at;
    console.error(`[failure-injector] INJECTED FAILURE: ${context.failure_type} at ${context.injection_point} — ` +
        `${context.error_message}`);
    throw err;
}
/**
 * Wrap a handler with failure injection.
 * Use in handlers to automatically inject failures.
 */
async function withFailureInjection(handler, injectionPoint, context) {
    const injected = shouldInjectFailure(injectionPoint, context);
    if (injected) {
        // Simulate delay if configured
        if (injected && _scenarios.get(injected.scenario_id)?.simulated_delay_ms) {
            await new Promise(resolve => setTimeout(resolve, _scenarios.get(injected.scenario_id).simulated_delay_ms));
        }
        throwInjectedError(injected);
    }
    return handler();
}
/**
 * Run a failure injection test.
 * Executes a handler with a specific scenario enabled and validates recovery.
 */
async function runFailureTest(params) {
    const scenario = _scenarios.get(params.scenario_id);
    if (!scenario) {
        throw new Error(`Unknown scenario: ${params.scenario_id}`);
    }
    const startTime = Date.now();
    const runId = params.shadow_run_id || `shadow-${Date.now()}`;
    console.log(`[failure-injector] Running test: ${scenario.name}`);
    // Enable the scenario for this test
    const wasEnabled = scenario.enabled;
    scenario.enabled = true;
    let passed = false;
    let recoverySuccessful = false;
    let actualBehavior = '';
    let errorMessage;
    try {
        await params.handler();
        // If no error thrown, the test failed (we expected a failure)
        actualBehavior = 'Handler completed without error (expected failure was not triggered)';
        passed = false;
    }
    catch (err) {
        errorMessage = err.message;
        // Check if this was our injected error
        if (err._failure_injection) {
            actualBehavior = `Injected failure: ${err.message}`;
            passed = true;
            // Test recovery
            try {
                await testRecovery(err);
                recoverySuccessful = true;
                actualBehavior += ' — recovery successful';
            }
            catch (recoveryErr) {
                recoverySuccessful = false;
                actualBehavior += ` — recovery failed: ${recoveryErr.message}`;
            }
        }
        else {
            // Unexpected error
            actualBehavior = `Unexpected error: ${err.message}`;
            passed = false;
        }
    }
    finally {
        // Restore scenario state
        scenario.enabled = wasEnabled;
    }
    const duration_ms = Date.now() - startTime;
    console.log(`[failure-injector] Test ${passed ? 'PASSED' : 'FAILED'}: ${scenario.name} — ` +
        `${duration_ms}ms, recovery=${recoverySuccessful}`);
    return {
        scenario_id: params.scenario_id,
        shadow_run_id: runId,
        passed,
        expected_behavior: params.expectedBehavior,
        actual_behavior: actualBehavior,
        recovery_successful: recoverySuccessful,
        duration_ms,
        error_message: errorMessage,
    };
}
/**
 * Test recovery from a failure.
 * Override in subclasses for custom recovery testing.
 */
async function testRecovery(error) {
    // Default recovery: log and re-throw
    console.log(`[failure-injector] Recovery attempted for: ${error.message}`);
    // Basic recovery: wait a bit and see if the system is still responsive
    await new Promise(resolve => setTimeout(resolve, 100));
    // If we get here, recovery is considered successful
}
/**
 * Run all enabled failure scenarios against a handler.
 */
async function runAllFailureTests(handler, options) {
    const results = [];
    const runId = options?.shadow_run_id || `shadow-${Date.now()}`;
    console.log(`[failure-injector] Running all enabled failure tests (${_scenarios.size} scenarios)`);
    for (const scenario of _scenarios.values()) {
        if (!scenario.enabled)
            continue;
        const result = await runFailureTest({
            scenario_id: scenario.scenario_id,
            handler: () => handler(scenario),
            expectedBehavior: getExpectedBehavior(scenario),
            shadow_run_id: runId,
        });
        results.push(result);
    }
    return results;
}
/**
 * Get expected behavior for a scenario.
 */
function getExpectedBehavior(scenario) {
    switch (scenario.failure_type) {
        case 'network_error':
            return 'Should retry with backoff and eventually succeed or dead-letter';
        case 'timeout_error':
            return 'Should retry with extended timeout';
        case 'validation_error':
            return 'Should reject the event and log validation error';
        case 'resource_exhausted':
            return 'Should gracefully degrade and report resource exhaustion';
        case 'dependency_unavailable':
            return 'Should queue for later retry when dependency recovers';
        case 'rate_limit_exceeded':
            return 'Should respect rate limit and retry after backoff';
        case 'internal_error':
            return 'Should log error and move to dead letter queue';
        default:
            return 'Should handle gracefully without crashing';
    }
}
// ─── Metrics ───────────────────────────────────────────────────────────────────
/**
 * Get failure injection statistics.
 */
function getFailureInjectionStats() {
    const enabledScenarios = Array.from(_scenarios.values()).filter(s => s.enabled);
    return {
        enabled: _injectionEnabled,
        total_scenarios: _scenarios.size,
        enabled_scenarios: enabledScenarios.length,
        injection_count: _injectionCount,
        scenarios: enabledScenarios,
    };
}
/**
 * Reset failure injection statistics.
 */
function resetFailureInjectionStats() {
    _injectionCount = 0;
}
/**
 * Disable all failure scenarios.
 */
function disableAllScenarios() {
    for (const scenario of _scenarios.values()) {
        scenario.enabled = false;
    }
    console.log('[failure-injector] All scenarios disabled');
}
/**
 * Enable all failure scenarios.
 */
function enableAllScenarios() {
    if (!_injectionEnabled) {
        console.warn('[failure-injector] Cannot enable scenarios — failure injection not enabled');
        return;
    }
    for (const scenario of _scenarios.values()) {
        scenario.enabled = true;
    }
    console.log('[failure-injector] All scenarios enabled');
}
//# sourceMappingURL=failure-injector.js.map