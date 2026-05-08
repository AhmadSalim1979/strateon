/**
 * Drift Detector — Phase 4: Detect Differences Between N8N and Orchestration
 *
 * Drift detection compares N8N workflow execution behavior against
 * orchestration runtime behavior. When drift is detected, it indicates
 * that the orchestration runtime is not faithfully replicating N8N behavior.
 *
 * Drift can be:
 * - Output mismatch: same input produces different output
 * - Missing nodes: orchestration skips nodes that N8N executes
 * - Extra nodes: orchestration executes nodes that N8N doesn't
 * - Status mismatch: node succeeds in one but fails in the other
 * - Ordering mismatch: nodes execute in different order
 * - Timing drift: execution takes significantly different time
 *
 * Drift detection is:
 * - Non-intrusive: does not modify N8N or orchestration behavior
 * - Shadow-only: operates on shadow events, not production events
 * - Comparative: always compares N8N (reference) against orchestration (test)
 */
export interface DriftReport {
    report_id: string;
    shadow_run_id: string;
    compared_at: string;
    workflow_id: string;
    execution_id: string;
    drift_detected: boolean;
    overall_severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    total_drift_points: number;
    drift_points: DriftPoint[];
    execution_comparison: ExecutionComparison;
    recommendation: string;
}
export interface DriftPoint {
    node_name: string;
    drift_type: DriftType;
    n8n_value: string;
    orchestration_value: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
}
export type DriftType = 'output_mismatch' | 'missing_node' | 'extra_node' | 'status_mismatch' | 'ordering_mismatch' | 'timing_drift' | 'payload_drift';
export interface ExecutionComparison {
    n8n_duration_ms: number;
    orchestration_duration_ms: number;
    n8n_node_count: number;
    orchestration_node_count: number;
    duration_ratio: number;
    timing_significant: boolean;
}
export interface NodeExecution {
    node_name: string;
    node_type: string;
    input: object;
    output: object;
    status: 'success' | 'error' | 'pending';
    start_time: string;
    end_time?: string;
    duration_ms?: number;
    error?: string;
}
/**
 * Compare N8N execution against orchestration execution.
 * Returns a full DriftReport with all drift points.
 */
export declare function detectDrift(n8nExecution: NodeExecution[], orchestrationExecution: NodeExecution[], options?: {
    workflow_id?: string;
    execution_id?: string;
    shadow_run_id?: string;
}): DriftReport;
/**
 * Save a drift report to Supabase shadow_events table.
 */
export declare function saveDriftReport(report: DriftReport): Promise<void>;
/**
 * Load drift reports for a given shadow_run_id.
 */
export declare function loadDriftReports(shadow_run_id: string): Promise<DriftReport[]>;
/**
 * Get aggregate drift statistics across all reports.
 */
export declare function getDriftStatistics(): Promise<{
    total_reports: number;
    reports_with_drift: number;
    average_drift_points: number;
    severity_distribution: Record<string, number>;
}>;
//# sourceMappingURL=drift-detector.d.ts.map