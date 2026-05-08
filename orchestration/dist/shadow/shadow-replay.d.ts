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
/**
 * Register a node type handler for replay.
 * Orchestration uses these handlers instead of actual N8N nodes.
 */
export declare function registerNodeHandler(nodeType: string, handler: NodeHandler): void;
/**
 * Start a shadow replay of a captured N8N workflow execution.
 *
 * @param events - N8N workflow events to replay
 * @param options - Replay options
 * @returns ReplayResult with drift analysis
 */
export declare function startShadowReplay(events: N8NWorkflowEvent[], options?: {
    workflow_id?: string;
    original_execution_id?: string;
    shadow_run_id?: string;
    simulate_failures?: boolean;
}): Promise<ReplayResult>;
/**
 * Capture an N8N workflow event for later replay.
 * Called when N8N executes a workflow to record the events.
 *
 * This is called in parallel observation mode - N8N is NOT modified.
 * Instead, we observe events through the webhook receiver or event bus.
 */
export declare function captureN8NEvent(event: N8NWorkflowEvent): Promise<void>;
/**
 * Replay a captured N8N execution by ID.
 * Loads all captured events for the execution and replays them.
 */
export declare function replayN8NExecution(execution_id: string, options?: {
    workflow_id?: string;
    simulate_failures?: boolean;
}): Promise<ReplayResult>;
/**
 * Validate that a sequence of events can be replayed.
 * Checks ordering and completeness.
 */
export declare function validateEventSequence(events: N8NWorkflowEvent[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Get replay history for a given shadow_run_id.
 */
export declare function getReplayHistory(shadow_run_id: string): Promise<WorkflowReplayContext[]>;
/**
 * Build a workflow execution graph from events for visualization.
 */
export declare function buildExecutionGraph(events: N8NWorkflowEvent[]): {
    nodes: Array<{
        id: string;
        name: string;
        type: string;
        status: string;
    }>;
    edges: Array<{
        from: string;
        to: string;
    }>;
};
//# sourceMappingURL=shadow-replay.d.ts.map