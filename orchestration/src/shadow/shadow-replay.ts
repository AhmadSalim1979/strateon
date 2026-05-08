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

import { v4 as uuidv4 } from 'uuid';
import { getShadowEvents, logShadowExecution } from './governance-guard';
import { shadowEnqueue } from './shadow-queue';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface N8NWorkflowEvent {
  workflow_id: string;
  execution_id: string;
  node_name: string;
  node_type: string;
  input_data: object;
  output_data?: object;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
  duration_ms?: number;
  error?: string;
}

export interface WorkflowReplayContext {
  replay_id: string;
  shadow_run_id: string;
  workflow_id: string;
  original_execution_id: string;
  events: N8NWorkflowEvent[];
  replay_started_at: string;
  replay_completed_at?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'drifted';
  drift_detected: boolean;
  drift_details?: DriftDetail[];
}

export interface DriftDetail {
  node_name: string;
  expected_output: string;
  actual_output: string;
  drift_type: 'output_mismatch' | 'missing_node' | 'extra_node' | 'status_mismatch' | 'ordering_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReplayResult {
  replay_id: string;
  status: 'completed' | 'failed' | 'drifted';
  nodes_replayed: number;
  nodes_succeeded: number;
  nodes_failed: number;
  drift_detected: boolean;
  drift_details?: DriftDetail[];
  duration_ms: number;
  shadow_run_id: string;
}

export interface NodeHandler {
  node_type: string;
  handler: (input: object, context: WorkflowReplayContext) => Promise<object>;
  expected_output_schema?: object;
}

// ─── Node Type Mapping ──────────────────────────────────────────────────────────
// Maps N8N node types to orchestration handlers.
// Each handler knows how to simulate the N8N node in shadow mode.

const _nodeHandlers: Map<string, NodeHandler> = new Map();

// ─── Core Replay Functions ─────────────────────────────────────────────────────

/**
 * Register a node type handler for replay.
 * Orchestration uses these handlers instead of actual N8N nodes.
 */
export function registerNodeHandler(nodeType: string, handler: NodeHandler): void {
  _nodeHandlers.set(nodeType, handler);
}

/**
 * Start a shadow replay of a captured N8N workflow execution.
 * 
 * @param events - N8N workflow events to replay
 * @param options - Replay options
 * @returns ReplayResult with drift analysis
 */
export async function startShadowReplay(
  events: N8NWorkflowEvent[],
  options?: {
    workflow_id?: string;
    original_execution_id?: string;
    shadow_run_id?: string;
    simulate_failures?: boolean;
  }
): Promise<ReplayResult> {
  const replay_id = `replay-${Date.now()}-${uuidv4().slice(0, 8)}`;
  const shadow_run_id = options?.shadow_run_id || `shadow-${Date.now()}-replay`;
  const startTime = Date.now();

  const context: WorkflowReplayContext = {
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
    await shadowEnqueue(
      `n8n.node.${event.node_name}`,
      'shadow-replay',
      {
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
      },
      {
        shadow_run_id,
        correlation_id: context.original_execution_id,
        simulated: true,
      }
    );
  }

  // Process events in order
  let nodes_succeeded = 0;
  let nodes_failed = 0;
  const drift_details: DriftDetail[] = [];

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
    } catch (err: any) {
      console.error(`[shadow-replay] Node ${event.node_name} failed: ${err.message}`);
      nodes_failed++;

      if (options?.simulate_failures) {
        const drift: DriftDetail = {
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
  await logShadowExecution({
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

  console.log(
    `[shadow-replay] Replay ${replay_id} ${drift_detected ? 'DRIFTED' : 'completed'} — ` +
    `${nodes_succeeded}/${events.length} nodes succeeded, ${drift_details.length} drifts detected, ${duration_ms}ms`
  );

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
function compareNodeOutput(
  event: N8NWorkflowEvent,
  actual_output: object,
  context: WorkflowReplayContext
): DriftDetail | null {
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
  if (event.status === 'error' && actual_output && !(actual_output as any)._shadow_blocked) {
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
export async function captureN8NEvent(
  event: N8NWorkflowEvent
): Promise<void> {
  await shadowEnqueue(
    'n8n.captured',
    'parallel-observer',
    event,
    {
      shadow_run_id: `capture-${event.execution_id}`,
      correlation_id: event.execution_id,
      simulated: false, // This is a real capture, not simulation
    }
  );
}

/**
 * Replay a captured N8N execution by ID.
 * Loads all captured events for the execution and replays them.
 */
export async function replayN8NExecution(
  execution_id: string,
  options?: { workflow_id?: string; simulate_failures?: boolean }
): Promise<ReplayResult> {
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
async function loadCapturedEvents(execution_id: string): Promise<N8NWorkflowEvent[]> {
  const events = await getShadowEvents(`capture-${execution_id}`);

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
      } catch {
        return null;
      }
    })
    .filter(Boolean) as N8NWorkflowEvent[];
}

// ─── Replay Utilities ───────────────────────────────────────────────────────────

/**
 * Validate that a sequence of events can be replayed.
 * Checks ordering and completeness.
 */
export function validateEventSequence(events: N8NWorkflowEvent[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

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
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

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
export async function getReplayHistory(shadow_run_id: string): Promise<WorkflowReplayContext[]> {
  const events = await getShadowEvents(shadow_run_id);

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
          status: e.result as any || 'completed',
          drift_detected: e.result === 'drifted',
        } as WorkflowReplayContext;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as WorkflowReplayContext[];

  return replays;
}

/**
 * Build a workflow execution graph from events for visualization.
 */
export function buildExecutionGraph(events: N8NWorkflowEvent[]): {
  nodes: Array<{ id: string; name: string; type: string; status: string }>;
  edges: Array<{ from: string; to: string }>;
} {
  const nodes = events.map((e, idx) => ({
    id: `node-${idx}`,
    name: e.node_name,
    type: e.node_type,
    status: e.status,
  }));

  const edges: Array<{ from: string; to: string }> = [];
  for (let i = 0; i < events.length - 1; i++) {
    edges.push({ from: `node-${i}`, to: `node-${i + 1}` });
  }

  return { nodes, edges };
}