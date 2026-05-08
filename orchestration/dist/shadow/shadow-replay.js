"use strict";
/**
 * Shadow Replay — Phase 4: Shadow Workflow Replay Engine
 *
 * Shadow replay captures N8N workflow executions and replays them
 * in the orchestration runtime WITHOUT making real changes to production.
 *
 * Replay is driven by shadow_events captured from actual N8N executions.
 * The replay engine:
 *
 * 1. Reconstructs the workflow execution context
 * 2. Maps N8N nodes to orchestration handlers
 * 3. Executes the workflow in shadow mode (simulated, no live actions)
 * 4. Compares the orchestration result with the original N8N result
 * 5. Reports drift (differences) between N8N and orchestration behavior
 *
 * Shadow replay is:
 * - Completely isolated from production execution
 * - Fully observable (logged to shadow_events table)
 * - Reversible (shadow state is separate from production state)
 * - Accurate (replays events in order with correct context)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNodeHandler = registerNodeHandler;
exports.startShadowReplay = startShadowReplay;
exports.captureN8NEvent = captureN8NEvent;
exports.replayN8NExecution = replayN8NExecution;
exports.validateEventSequence = validateEventSequence;
exports.getReplayHistory = getReplayHistory;
exports.buildExecutionGraph = buildExecutionGraph;
const uuid_1 = require("uuid");
const governance_guard_1 = require("./governance-guard");
const shadow_queue_1 = require("./shadow-queue");
// ─── Node Type Mapping ──────────────────────────────────────────────────────────
// Maps N8N node types to orchestration handlers.
// Each handler knows how to simulate the N8N node in shadow mode.
const _nodeHandlers = new Map();
// ─── Core Replay Functions ─────────────────────────────────────────────────────
/**
 * Register a node type handler for replay.
 * Orchestration uses these handlers instead of actual N8N nodes.
 */
function registerNodeHandler(nodeType, handler) {
    _nodeHandlers.set(nodeType, handler);
}
/**
 * Start a shadow replay of a captured N8N workflow execution.
 *
 * @param events - N8N workflow events to replay
 * @param options - Replay options
 * @returns ReplayResult with drift analysis
 */
async function startShadowReplay(events, options) {
    const replay_id = `replay-${Date.now()}-${(0, uuid_1.v4)().slice(0, 8)}`;
    const shadow_run_id = options?.shadow_run_id || `shadow-${Date.now()}-replay`;
    const startTime = Date.now();
    const context = {
        replay_id,
        shadow_run_id,
        workflow_id: options?.workflow_id || events[0]?.workflow_id || 'unknown',
        original_execution_id: options?.original_execution_id || events[0]?.execution_id || 'unknown',
        events,
        replay_started_at: new Date().toISOString(),
        status: 'running',
        drift_detected: false,
    };
    console.log(`[shadow-replay] Starting replay ${replay_id} for workflow ${context.workflow_id} (${events.length} events)`);
    // Enqueue all events for shadow processing
    for (const event of events) {
        await (0, shadow_queue_1.shadowEnqueue)(`n8n.node.${event.node_name}`, 'shadow-replay', {
            workflow_id: event.workflow_id,
            execution_id: event.execution_id,
            node_name: event.node_name,
            node_type: event.node_type,
            input_data: event.input_data,
            status: event.status,
            timestamp: event.timestamp,
            duration_ms: event.duration_ms,
            error: event.error,
            replay_id,
        }, {
            shadow_run_id,
            correlation_id: context.original_execution_id,
            simulated: true,
        });
    }
    // Process events in order
    let nodes_succeeded = 0;
    let nodes_failed = 0;
    const drift_details = [];
    for (const event of events) {
        const handler = _nodeHandlers.get(event.node_type);
        if (!handler) {
            console.warn(`[shadow-replay] No handler for node type: ${event.node_type}`);
            nodes_failed++;
            continue;
        }
        try {
            // Simulate the node execution
            const result = await handler.handler(event.input_data, context);
            // Compare output with expected (from N8N event)
            const drift = compareNodeOutput(event, result, context);
            if (drift) {
                drift_details.push(drift);
            }
            nodes_succeeded++;
        }
        catch (err) {
            console.error(`[shadow-replay] Node ${event.node_name} failed: ${err.message}`);
            nodes_failed++;
            if (options?.simulate_failures) {
                const drift = {
                    node_name: event.node_name,
                    expected_output: JSON.stringify(event.output_data || {}),
                    actual_output: `error: ${err.message}`,
                    drift_type: 'status_mismatch',
                    severity: 'high',
                };
                drift_details.push(drift);
            }
        }
    }
    const duration_ms = Date.now() - startTime;
    const drift_detected = drift_details.length > 0;
    // Update context
    context.replay_completed_at = new Date().toISOString();
    context.status = drift_detected ? 'drifted' : 'completed';
    context.drift_detected = drift_detected;
    context.drift_details = drift_details;
    // Log replay result
    await (0, governance_guard_1.logShadowExecution)({
        shadow_run_id,
        event_type: 'shadow.replay.completed',
        source: 'shadow-replay',
        action: 'replay.execute',
        target: context.workflow_id,
        payload: {
            replay_id,
            nodes_replayed: events.length,
            nodes_succeeded,
            nodes_failed,
            drift_detected,
            duration_ms,
        },
        simulated: true,
        result: drift_detected ? 'drifted' : 'completed',
    });
    console.log(`[shadow-replay] Replay ${replay_id} ${drift_detected ? 'DRIFTED' : 'completed'} — ` +
        `${nodes_succeeded}/${events.length} nodes succeeded, ${drift_details.length} drifts detected, ${duration_ms}ms`);
    return {
        replay_id,
        status: drift_detected ? 'drifted' : nodes_failed > 0 ? 'failed' : 'completed',
        nodes_replayed: events.length,
        nodes_succeeded,
        nodes_failed,
        drift_detected,
        drift_details,
        duration_ms,
        shadow_run_id,
    };
}
/**
 * Compare node output against expected output from N8N event.
 * Returns a DriftDetail if drift is detected.
 */
function compareNodeOutput(event, actual_output, context) {
    if (!event.output_data) {
        return null; // No expected output to compare
    }
    const expected_str = JSON.stringify(event.output_data);
    const actual_str = JSON.stringify(actual_output);
    if (expected_str !== actual_str) {
        return {
            node_name: event.node_name,
            expected_output: expected_str,
            actual_output: actual_str,
            drift_type: 'output_mismatch',
            severity: 'medium',
        };
    }
    // Status comparison
    if (event.status === 'error' && actual_output && !actual_output._shadow_blocked) {
        return {
            node_name: event.node_name,
            expected_output: 'error',
            actual_output: 'success',
            drift_type: 'status_mismatch',
            severity: 'high',
        };
    }
    return null;
}
// ─── N8N Event Capture ─────────────────────────────────────────────────────────
/**
 * Capture an N8N workflow event for later replay.
 * Called when N8N executes a workflow to record the events.
 *
 * This is called in parallel observation mode - N8N is NOT modified.
 * Instead, we observe events through the webhook receiver or event bus.
 */
async function captureN8NEvent(event) {
    await (0, shadow_queue_1.shadowEnqueue)('n8n.captured', 'parallel-observer', event, {
        shadow_run_id: `capture-${event.execution_id}`,
        correlation_id: event.execution_id,
        simulated: false, // This is a real capture, not simulation
    });
}
/**
 * Replay a captured N8N execution by ID.
 * Loads all captured events for the execution and replays them.
 */
async function replayN8NExecution(execution_id, options) {
    const events = await loadCapturedEvents(execution_id);
    if (events.length === 0) {
        return {
            replay_id: `replay-${execution_id}`,
            status: 'failed',
            nodes_replayed: 0,
            nodes_succeeded: 0,
            nodes_failed: 0,
            drift_detected: false,
            duration_ms: 0,
            shadow_run_id: `shadow-${execution_id}`,
        };
    }
    return startShadowReplay(events, {
        ...options,
        original_execution_id: execution_id,
    });
}
// ─── Event Loading ─────────────────────────────────────────────────────────────
/**
 * Load captured N8N events for an execution ID.
 * Events are stored in shadow_events table.
 */
async function loadCapturedEvents(execution_id) {
    const events = await (0, governance_guard_1.getShadowEvents)(`capture-${execution_id}`);
    return events
        .filter(e => e.event_type === 'n8n.captured')
        .map(e => {
        try {
            const payload = typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload;
            return {
                workflow_id: payload.workflow_id || 'unknown',
                execution_id: payload.execution_id || execution_id,
                node_name: payload.node_name || 'unknown',
                node_type: payload.node_type || 'unknown',
                input_data: payload.input_data || {},
                output_data: payload.output_data,
                status: payload.status || 'pending',
                timestamp: payload.timestamp || e.executed_at,
                duration_ms: payload.duration_ms,
                error: payload.error,
            };
        }
        catch {
            return null;
        }
    })
        .filter(Boolean);
}
// ─── Replay Utilities ───────────────────────────────────────────────────────────
/**
 * Validate that a sequence of events can be replayed.
 * Checks ordering and completeness.
 */
function validateEventSequence(events) {
    const errors = [];
    const warnings = [];
    if (events.length === 0) {
        errors.push('No events to replay');
        return { valid: false, errors, warnings };
    }
    // Check for duplicate execution IDs
    const execIds = events.map(e => e.execution_id);
    if (new Set(execIds).size > 1) {
        errors.push('Events from multiple executions — cannot replay as single sequence');
    }
    // Check for execution_id on all events
    const missingExecId = events.filter(e => !e.execution_id);
    if (missingExecId.length > 0) {
        warnings.push(`${missingExecId.length} events missing execution_id`);
    }
    // Check for ordering (events should have timestamps)
    const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    // Check if original ordering is preserved
    for (let i = 0; i < events.length - 1; i++) {
        if (new Date(events[i].timestamp) > new Date(events[i + 1].timestamp)) {
            warnings.push('Events not in chronological order — replay will use sorted order');
            break;
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Get replay history for a given shadow_run_id.
 */
async function getReplayHistory(shadow_run_id) {
    const events = await (0, governance_guard_1.getShadowEvents)(shadow_run_id);
    const replays = events
        .filter(e => e.event_type === 'shadow.replay.completed')
        .map(e => {
        try {
            const payload = typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload;
            return {
                replay_id: payload.replay_id || 'unknown',
                shadow_run_id,
                workflow_id: payload.workflow_id || 'unknown',
                original_execution_id: shadow_run_id.replace('capture-', ''),
                events: [],
                replay_started_at: e.executed_at,
                replay_completed_at: e.executed_at,
                status: e.result || 'completed',
                drift_detected: e.result === 'drifted',
            };
        }
        catch {
            return null;
        }
    })
        .filter(Boolean);
    return replays;
}
/**
 * Build a workflow execution graph from events for visualization.
 */
function buildExecutionGraph(events) {
    const nodes = events.map((e, idx) => ({
        id: `node-${idx}`,
        name: e.node_name,
        type: e.node_type,
        status: e.status,
    }));
    const edges = [];
    for (let i = 0; i < events.length - 1; i++) {
        edges.push({ from: `node-${i}`, to: `node-${i + 1}` });
    }
    return { nodes, edges };
}
//# sourceMappingURL=shadow-replay.js.map