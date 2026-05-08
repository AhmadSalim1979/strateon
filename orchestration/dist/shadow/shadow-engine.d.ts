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
import { N8NWorkflowEvent, ReplayResult } from './shadow-replay';
import { DriftReport } from './drift-detector';
export interface ShadowEngineConfig {
    enableMetricsCollection: boolean;
    enableDriftDetection: boolean;
    enableFailureInjection: boolean;
    maxConcurrentShadowRuns: number;
    shadowQueueCapacity: number;
}
export interface ShadowRun {
    shadow_run_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'drifted';
    started_at: string;
    completed_at?: string;
    events_processed: number;
    drift_report?: DriftReport;
    error?: string;
}
export interface ShadowExecutionResult {
    shadow_run_id: string;
    status: 'completed' | 'failed' | 'drifted' | 'blocked';
    events_processed: number;
    drift_detected: boolean;
    drift_report?: DriftReport;
    execution_time_ms: number;
    governance_decisions: number;
}
/**
 * Initialize the shadow engine.
 * Must be called before any shadow operations.
 */
export declare function initShadowEngine(config?: Partial<ShadowEngineConfig>): Promise<void>;
/**
 * Check if shadow engine is initialized.
 */
export declare function isShadowEngineInitialized(): boolean;
/**
 * Get current engine configuration.
 */
export declare function getShadowEngineConfig(): ShadowEngineConfig;
/**
 * Execute a shadow workflow.
 * This is the main entry point for shadow execution.
 *
 * @param events - Workflow events to execute in shadow mode
 * @param options - Execution options
 * @returns ShadowExecutionResult with full trace
 */
export declare function executeShadowWorkflow(events: Array<{
    event_type: string;
    source: string;
    payload: object;
    correlation_id?: string;
}>, options?: {
    workflow_id?: string;
    original_execution_id?: string;
    simulate_failures?: boolean;
}): Promise<ShadowExecutionResult>;
/**
 * Execute a shadow event with full tracing.
 */
export declare function executeShadowEvent(eventType: string, source: string, payload: object, options?: {
    correlation_id?: string;
    caused_by_job_id?: string;
    parent_event_id?: string;
}): Promise<ShadowExecutionResult>;
/**
 * Replay an N8N workflow execution in shadow mode.
 */
export declare function replayN8NWorkflow(events: N8NWorkflowEvent[], options?: {
    workflow_id?: string;
    original_execution_id?: string;
    simulate_failures?: boolean;
}): Promise<ReplayResult>;
/**
 * Start the shadow queue processing loop.
 * Processes queued shadow events in order.
 */
export declare function startShadowProcessingLoop(): Promise<void>;
/**
 * Stop the shadow processing loop.
 */
export declare function stopShadowProcessingLoop(): void;
/**
 * Get all active shadow runs.
 */
export declare function getActiveShadowRuns(): ShadowRun[];
/**
 * Get a specific shadow run by ID.
 */
export declare function getShadowRun(shadow_run_id: string): ShadowRun | undefined;
/**
 * Get shadow run history.
 */
export declare function getShadowRunHistory(limit?: number): ShadowRun[];
/**
 * Clear completed shadow runs from memory.
 */
export declare function clearCompletedShadowRuns(): void;
/**
 * Get comprehensive shadow engine status.
 */
export declare function getShadowEngineStatus(): {
    initialized: boolean;
    mode: string;
    active_runs: number;
    queue_stats: {
        pending: number;
        processing: number;
        completed: number;
        blocked: number;
        failed: number;
        total: number;
    };
    config: ShadowEngineConfig;
    failure_injection_enabled: boolean;
    processing_loop_active: boolean;
};
/**
 * Simulate a complete workflow execution in shadow mode.
 * This validates workflow logic without making real changes.
 */
export declare function simulateWorkflow(workflowDef: {
    workflow_id: string;
    nodes: Array<{
        node_id: string;
        node_type: string;
        input_schema: object;
        output_schema: object;
        dependencies: string[];
    }>;
}, inputData: object): Promise<{
    simulated: true;
    workflow_id: string;
    nodes_executed: string[];
    output: object;
    execution_trace: Array<{
        node_id: string;
        status: string;
        duration_ms: number;
    }>;
}>;
/**
 * Gracefully shutdown the shadow engine.
 */
export declare function shutdownShadowEngine(): Promise<void>;
export interface ShadowEngineConfig {
    enableMetricsCollection: boolean;
    enableDriftDetection: boolean;
    enableFailureInjection: boolean;
    maxConcurrentShadowRuns: number;
    shadowQueueCapacity: number;
}
export interface ShadowRun {
    shadow_run_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'drifted';
    started_at: string;
    completed_at?: string;
    events_processed: number;
    drift_report?: import('./drift-detector').DriftReport;
    error?: string;
}
export interface ShadowExecutionResult {
    shadow_run_id: string;
    status: 'completed' | 'failed' | 'drifted' | 'blocked';
    events_processed: number;
    drift_detected: boolean;
    drift_report?: import('./drift-detector').DriftReport;
    execution_time_ms: number;
    governance_decisions: number;
}
export type { ShadowQueueEvent, ShadowQueueStats } from './shadow-queue';
export type { N8NWorkflowEvent, ReplayResult } from './shadow-replay';
export type { DriftReport, DriftPoint, NodeExecution } from './drift-detector';
export type { OrchestrationMetrics } from './metrics-collector';
//# sourceMappingURL=shadow-engine.d.ts.map