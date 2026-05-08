"use strict";
/**
 * Shadow Engine — Phase 4: Main Shadow Execution Engine
 *
 * The shadow engine is the central coordinator for all shadow mode operations.
 * It provides the unified interface for:
 *
 * - Shadow event processing (isolated from production)
 * - Shadow workflow execution (replays N8N workflows)
 * - Drift detection and reporting
 * - Metrics collection and snapshotting
 * - Governance enforcement
 *
 * Shadow engine NEVER:
 * - Executes live actions (all simulated)
 * - Modifies production state
 * - Intercepts production webhooks
 * - Exposes internal services publicly
 * - Creates hidden execution chains
 *
 * All shadow operations are:
 * - Fully logged to shadow_events table
 * - Traced with shadow_run_id for auditability
 * - Reversible (shadow state is isolated)
 * - Observable (structured logging throughout)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initShadowEngine = initShadowEngine;
exports.isShadowEngineInitialized = isShadowEngineInitialized;
exports.getShadowEngineConfig = getShadowEngineConfig;
exports.executeShadowWorkflow = executeShadowWorkflow;
exports.executeShadowEvent = executeShadowEvent;
exports.replayN8NWorkflow = replayN8NWorkflow;
exports.startShadowProcessingLoop = startShadowProcessingLoop;
exports.stopShadowProcessingLoop = stopShadowProcessingLoop;
exports.getActiveShadowRuns = getActiveShadowRuns;
exports.getShadowRun = getShadowRun;
exports.getShadowRunHistory = getShadowRunHistory;
exports.clearCompletedShadowRuns = clearCompletedShadowRuns;
exports.getShadowEngineStatus = getShadowEngineStatus;
exports.simulateWorkflow = simulateWorkflow;
exports.shutdownShadowEngine = shutdownShadowEngine;
const uuid_1 = require("uuid");
const shadow_mode_1 = require("../modes/shadow-mode");
const governance_guard_1 = require("./governance-guard");
const shadow_queue_1 = require("./shadow-queue");
const shadow_replay_1 = require("./shadow-replay");
const drift_detector_1 = require("./drift-detector");
const metrics_collector_1 = require("./metrics-collector");
const failure_injector_1 = require("./failure-injector");
// ─── Shadow Engine State ────────────────────────────────────────────────────────
const _activeShadowRuns = new Map();
const _shadowEventLog = new Map();
let _engineConfig = {
    enableMetricsCollection: true,
    enableDriftDetection: true,
    enableFailureInjection: false,
    maxConcurrentShadowRuns: 10,
    shadowQueueCapacity: 1000,
};
let _engineInitialized = false;
// ─── Shadow Engine Initialization ─────────────────────────────────────────────
/**
 * Initialize the shadow engine.
 * Must be called before any shadow operations.
 */
async function initShadowEngine(config) {
    if (_engineInitialized) {
        console.log('[shadow-engine] Already initialized — skipping');
        return;
    }
    // Apply config overrides
    if (config) {
        _engineConfig = { ..._engineConfig, ...config };
    }
    // Verify we're in shadow mode
    if (!(0, shadow_mode_1.isShadowMode)()) {
        console.warn('[shadow-engine] WARNING: Initializing shadow engine in PRODUCTION mode');
        console.warn('[shadow-engine] Shadow engine should only run with ORCHESTRATION_MODE=shadow');
    }
    // Initialize failure injection if enabled
    if (_engineConfig.enableFailureInjection) {
        (0, failure_injector_1.initFailureInjection)();
    }
    _engineInitialized = true;
    console.log('[shadow-engine] Shadow engine initialized');
    console.log(`[shadow-engine]   metrics: ${_engineConfig.enableMetricsCollection ? 'enabled' : 'disabled'}`);
    console.log(`[shadow-engine]   drift detection: ${_engineConfig.enableDriftDetection ? 'enabled' : 'disabled'}`);
    console.log(`[shadow-engine]   failure injection: ${_engineConfig.enableFailureInjection ? 'enabled' : 'disabled'}`);
    console.log(`[shadow-engine]   max concurrent runs: ${_engineConfig.maxConcurrentShadowRuns}`);
}
/**
 * Check if shadow engine is initialized.
 */
function isShadowEngineInitialized() {
    return _engineInitialized;
}
/**
 * Get current engine configuration.
 */
function getShadowEngineConfig() {
    return { ..._engineConfig };
}
// ─── Shadow Execution ─────────────────────────────────────────────────────────
/**
 * Execute a shadow workflow.
 * This is the main entry point for shadow execution.
 *
 * @param events - Workflow events to execute in shadow mode
 * @param options - Execution options
 * @returns ShadowExecutionResult with full trace
 */
async function executeShadowWorkflow(events, options) {
    const shadow_run_id = `shadow-${Date.now()}-${(0, uuid_1.v4)().slice(0, 8)}`;
    const startTime = Date.now();
    console.log(`[shadow-engine] Starting shadow workflow: ${shadow_run_id} (${events.length} events)`);
    // Record governance decision for the run itself
    (0, metrics_collector_1.recordGovernanceDecision)('shadow.workflow.execute', true, false);
    const run = {
        shadow_run_id,
        status: 'running',
        started_at: new Date().toISOString(),
        events_processed: 0,
    };
    _activeShadowRuns.set(shadow_run_id, run);
    let eventsProcessed = 0;
    let governanceDecisions = 0;
    let driftReport;
    try {
        // Execute each event through shadow queue
        for (const event of events) {
            // Check for failure injection
            const injectedFailure = (0, failure_injector_1.shouldInjectFailure)('event_processing', {
                event_type: event.event_type,
                shadow_run_id,
            });
            if (injectedFailure) {
                // Log the failure and continue
                await (0, governance_guard_1.logShadowExecution)({
                    shadow_run_id,
                    event_type: event.event_type,
                    source: 'shadow-engine',
                    action: 'event.failed',
                    target: event.event_type,
                    payload: event.payload,
                    simulated: true,
                    result: `injected_failure: ${injectedFailure.error_message}`,
                });
                continue;
            }
            // Guard: check if action is allowed
            const action = event.event_type.split('.').pop() || event.event_type;
            if ((0, governance_guard_1.isRestrictedAction)(action)) {
                (0, governance_guard_1.guardExecution)(action, JSON.stringify(event.payload));
                governanceDecisions++;
            }
            // Enqueue for shadow processing
            await (0, shadow_queue_1.shadowEnqueue)(event.event_type, event.source, event.payload, {
                shadow_run_id,
                correlation_id: event.correlation_id,
                simulated: true,
            });
            eventsProcessed++;
            governanceDecisions++;
        }
        // Run shadow replay if drift detection is enabled
        if (_engineConfig.enableDriftDetection && options?.original_execution_id) {
            // Capture N8N events for comparison
            const n8nEvents = events.map((e, idx) => ({
                node_name: e.event_type,
                node_type: e.event_type,
                input: e.payload,
                output: { simulated: true, shadow_run_id },
                status: 'success',
                start_time: new Date().toISOString(),
                duration_ms: 10,
            }));
            // Simulate orchestration execution
            const orchEvents = events.map((e, idx) => ({
                node_name: e.event_type,
                node_type: e.event_type,
                input: e.payload,
                output: { simulated: true, shadow_run_id, replayed: true },
                status: 'success',
                start_time: new Date().toISOString(),
                duration_ms: 15,
            }));
            const detectedDrift = (0, drift_detector_1.detectDrift)(n8nEvents, orchEvents, {
                workflow_id: options.workflow_id,
                execution_id: options.original_execution_id,
                shadow_run_id,
            });
            if (detectedDrift.drift_detected) {
                driftReport = detectedDrift;
                await (0, drift_detector_1.saveDriftReport)(detectedDrift);
            }
        }
        const execution_time_ms = Date.now() - startTime;
        // Update run status
        run.status = driftReport?.drift_detected ? 'drifted' : 'completed';
        run.completed_at = new Date().toISOString();
        run.events_processed = eventsProcessed;
        run.drift_report = driftReport;
        // Collect metrics
        if (_engineConfig.enableMetricsCollection) {
            const metrics = await (0, metrics_collector_1.collectMetrics)(shadow_run_id);
            const snapshot = await (0, metrics_collector_1.takeMetricsSnapshot)(shadow_run_id);
            await (0, metrics_collector_1.saveMetricsSnapshot)(snapshot);
        }
        console.log(`[shadow-engine] Shadow workflow ${shadow_run_id} ${run.status} — ` +
            `${eventsProcessed} events, ${execution_time_ms}ms`);
        return {
            shadow_run_id,
            status: run.status,
            events_processed: eventsProcessed,
            drift_detected: driftReport?.drift_detected || false,
            drift_report: driftReport,
            execution_time_ms,
            governance_decisions: governanceDecisions,
        };
    }
    catch (err) {
        run.status = 'failed';
        run.error = err.message;
        run.completed_at = new Date().toISOString();
        console.error(`[shadow-engine] Shadow workflow ${shadow_run_id} failed: ${err.message}`);
        // Record governance decision for failure
        (0, metrics_collector_1.recordGovernanceDecision)('shadow.workflow.failed', false, true);
        throw err;
    }
}
/**
 * Execute a shadow event with full tracing.
 */
async function executeShadowEvent(eventType, source, payload, options) {
    const shadow_run_id = `shadow-${Date.now()}-${(0, uuid_1.v4)().slice(0, 8)}`;
    const startTime = Date.now();
    // Guard execution
    const action = eventType.split('.').pop() || eventType;
    if ((0, governance_guard_1.isRestrictedAction)(action)) {
        try {
            (0, governance_guard_1.guardExecution)(action, JSON.stringify(payload));
        }
        catch (err) {
            (0, metrics_collector_1.recordGovernanceDecision)(action, false, true);
            return {
                shadow_run_id,
                status: 'blocked',
                events_processed: 0,
                drift_detected: false,
                execution_time_ms: Date.now() - startTime,
                governance_decisions: 1,
            };
        }
    }
    (0, metrics_collector_1.recordGovernanceDecision)(action, true, false);
    // Enqueue and process
    const event = await (0, shadow_queue_1.shadowEnqueue)(eventType, source, payload, {
        shadow_run_id,
        correlation_id: options?.correlation_id,
        simulated: true,
    });
    return {
        shadow_run_id,
        status: 'completed',
        events_processed: 1,
        drift_detected: false,
        execution_time_ms: Date.now() - startTime,
        governance_decisions: 1,
    };
}
// ─── Shadow Replay ─────────────────────────────────────────────────────────────
/**
 * Replay an N8N workflow execution in shadow mode.
 */
async function replayN8NWorkflow(events, options) {
    const shadow_run_id = `replay-${Date.now()}`;
    console.log(`[shadow-engine] Replaying N8N workflow: ${shadow_run_id} (${events.length} nodes)`);
    const result = await (0, shadow_replay_1.startShadowReplay)(events, {
        ...options,
        shadow_run_id,
    });
    // Collect metrics after replay
    if (_engineConfig.enableMetricsCollection) {
        (0, metrics_collector_1.recordEventTiming)('shadow.replay.completed', result.duration_ms);
    }
    return result;
}
// ─── Shadow Queue Processing Loop ──────────────────────────────────────────────
let _processingLoopActive = false;
/**
 * Start the shadow queue processing loop.
 * Processes queued shadow events in order.
 */
async function startShadowProcessingLoop() {
    if (_processingLoopActive) {
        console.log('[shadow-engine] Processing loop already active');
        return;
    }
    _processingLoopActive = true;
    console.log('[shadow-engine] Starting shadow processing loop');
    while (_processingLoopActive) {
        const event = (0, shadow_queue_1.shadowDequeue)();
        if (!event) {
            // No events, wait before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }
        try {
            // Process event (simulated)
            await processShadowEvent(event);
            (0, shadow_queue_1.shadowComplete)(event.shadow_event_id, 'processed');
        }
        catch (err) {
            (0, shadow_queue_1.shadowFail)(event.shadow_event_id, err.message);
            console.error(`[shadow-engine] Event processing failed: ${err.message}`);
        }
    }
    console.log('[shadow-engine] Shadow processing loop stopped');
}
/**
 * Stop the shadow processing loop.
 */
function stopShadowProcessingLoop() {
    _processingLoopActive = false;
    console.log('[shadow-engine] Stopping shadow processing loop');
}
/**
 * Process a single shadow event.
 * Override in tests to add custom processing logic.
 */
async function processShadowEvent(event) {
    // Check failure injection
    const injected = (0, failure_injector_1.shouldInjectFailure)('event_processing', {
        event_type: event.event_type,
        shadow_run_id: event.shadow_run_id,
    });
    if (injected) {
        throw new Error(injected.error_message);
    }
    // Log event processing
    await (0, governance_guard_1.logShadowExecution)({
        shadow_run_id: event.shadow_run_id,
        event_type: event.event_type,
        source: event.source,
        action: 'event.processed',
        target: event.shadow_event_id,
        payload: event.payload,
        simulated: true,
        result: 'success',
    });
    (0, metrics_collector_1.recordEventTiming)(event.event_type, 10); // simulated 10ms processing
    // Small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 5));
}
// ─── Shadow Run Management ────────────────────────────────────────────────────
/**
 * Get all active shadow runs.
 */
function getActiveShadowRuns() {
    return Array.from(_activeShadowRuns.values()).filter(r => r.status === 'pending' || r.status === 'running');
}
/**
 * Get a specific shadow run by ID.
 */
function getShadowRun(shadow_run_id) {
    return _activeShadowRuns.get(shadow_run_id);
}
/**
 * Get shadow run history.
 */
function getShadowRunHistory(limit = 100) {
    return Array.from(_activeShadowRuns.values())
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
        .slice(0, limit);
}
/**
 * Clear completed shadow runs from memory.
 */
function clearCompletedShadowRuns() {
    for (const [id, run] of _activeShadowRuns) {
        if (run.status === 'completed' || run.status === 'failed' || run.status === 'drifted') {
            _activeShadowRuns.delete(id);
        }
    }
    console.log(`[shadow-engine] Cleared completed shadow runs (${_activeShadowRuns.size} remaining)`);
}
// ─── Shadow Engine Status ──────────────────────────────────────────────────────
/**
 * Get comprehensive shadow engine status.
 */
function getShadowEngineStatus() {
    const queueStats = (0, shadow_queue_1.getShadowQueueStats)();
    return {
        initialized: _engineInitialized,
        mode: (0, shadow_mode_1.getOrchestrationMode)(),
        active_runs: getActiveShadowRuns().length,
        queue_stats: queueStats,
        config: getShadowEngineConfig(),
        failure_injection_enabled: (0, failure_injector_1.isFailureInjectionEnabled)(),
        processing_loop_active: _processingLoopActive,
    };
}
// ─── Shadow Workflow Simulation ────────────────────────────────────────────────
/**
 * Simulate a complete workflow execution in shadow mode.
 * This validates workflow logic without making real changes.
 */
async function simulateWorkflow(workflowDef, inputData) {
    const shadow_run_id = `sim-${Date.now()}-${(0, uuid_1.v4)().slice(0, 8)}`;
    console.log(`[shadow-engine] Simulating workflow ${workflowDef.workflow_id} (${workflowDef.nodes.length} nodes)`);
    const executionTrace = [];
    const nodesExecuted = [];
    let currentData = inputData;
    for (const node of workflowDef.nodes) {
        const nodeStart = Date.now();
        try {
            // Simulate node execution
            // In production, this would call the actual node handler
            // In shadow mode, we just log the simulation
            await (0, governance_guard_1.logShadowExecution)({
                shadow_run_id,
                event_type: 'workflow.node.simulated',
                source: 'shadow-engine',
                action: `node.${node.node_type}`,
                target: node.node_id,
                payload: {
                    workflow_id: workflowDef.workflow_id,
                    node_id: node.node_id,
                    input: currentData,
                },
                simulated: true,
                result: 'simulated',
            });
            const duration_ms = Date.now() - nodeStart;
            executionTrace.push({ node_id: node.node_id, status: 'simulated', duration_ms });
            nodesExecuted.push(node.node_id);
            // Simulate output (pass through input for now)
            currentData = { ...currentData, _simulated_output_for: node.node_id };
            (0, metrics_collector_1.recordEventTiming)(`node.${node.node_type}`, duration_ms);
        }
        catch (err) {
            const duration_ms = Date.now() - nodeStart;
            executionTrace.push({ node_id: node.node_id, status: `error: ${err.message}`, duration_ms });
            await (0, governance_guard_1.logShadowExecution)({
                shadow_run_id,
                event_type: 'workflow.node.error',
                source: 'shadow-engine',
                action: `node.${node.node_type}`,
                target: node.node_id,
                payload: { error: err.message },
                simulated: true,
                result: 'error',
            });
        }
    }
    return {
        simulated: true,
        workflow_id: workflowDef.workflow_id,
        nodes_executed: nodesExecuted,
        output: currentData,
        execution_trace: executionTrace,
    };
}
// ─── Shutdown ─────────────────────────────────────────────────────────────────
/**
 * Gracefully shutdown the shadow engine.
 */
async function shutdownShadowEngine() {
    console.log('[shadow-engine] Shutting down...');
    // Stop processing loop
    stopShadowProcessingLoop();
    // Clear completed runs
    clearCompletedShadowRuns();
    // Log shutdown
    console.log('[shadow-engine] Shutdown complete');
}
//# sourceMappingURL=shadow-engine.js.map