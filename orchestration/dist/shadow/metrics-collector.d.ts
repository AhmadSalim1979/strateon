/**
 * Metrics Collector — Phase 4: Runtime Metrics Collection
 *
 * Collects performance and operational metrics for the orchestration
 * runtime. Metrics are collected in shadow mode and do not affect
 * production systems.
 *
 * Metrics collected:
 * - Execution timing (event processing time, workflow duration)
 * - Queue depths (shadow queue, production queue comparison)
 * - Replay accuracy (shadow vs N8N behavior matching)
 * - Drift frequency and severity
 * - Error rates and types
 * - Governance enforcement (blocked actions, allowed actions)
 * - Resource utilization (memory, CPU proxy via timing)
 *
 * Metrics are stored in Redis (short-term) and Supabase shadow_events (long-term).
 */
export interface OrchestrationMetrics {
    collected_at: string;
    period_start: string;
    period_end: string;
    shadow_run_id: string;
    execution_metrics: ExecutionMetrics;
    queue_metrics: QueueMetrics;
    drift_metrics: DriftMetrics;
    governance_metrics: GovernanceMetrics;
    system_metrics: SystemMetrics;
}
export interface ExecutionMetrics {
    total_events_processed: number;
    shadow_events_processed: number;
    production_events_processed: number;
    events_by_type: Record<string, number>;
    average_event_processing_ms: number;
    max_event_processing_ms: number;
    min_event_processing_ms: number;
    total_workflow_duration_ms: number;
    workflows_completed: number;
    workflows_failed: number;
}
export interface QueueMetrics {
    shadow_queue_depth: number;
    shadow_queue_capacity: number;
    shadow_queue_utilization_pct: number;
    shadow_events_enqueued: number;
    shadow_events_dequeued: number;
    shadow_events_completed: number;
    shadow_events_failed: number;
    shadow_events_blocked: number;
}
export interface DriftMetrics {
    total_reports: number;
    reports_with_drift: number;
    drift_rate_pct: number;
    average_drift_points_per_report: number;
    severity_distribution: Record<string, number>;
    most_common_drift_type: string;
}
export interface GovernanceMetrics {
    total_decisions: number;
    actions_allowed: number;
    actions_blocked: number;
    blocked_by_type: Record<string, number>;
    shadow_enforcements: number;
    production_enforcements: number;
}
export interface SystemMetrics {
    memory_usage_mb: number;
    uptime_seconds: number;
    redis_connected: boolean;
    supabase_connected: boolean;
    errors_last_hour: number;
    warnings_last_hour: number;
}
export interface MetricsSnapshot {
    snapshot_id: string;
    timestamp: string;
    metrics: OrchestrationMetrics;
}
/**
 * Record an event processing timing.
 * Called after each event is processed (shadow or production).
 */
export declare function recordEventTiming(eventType: string, processingTimeMs: number): void;
/**
 * Record a governance decision.
 * Called whenever governance guard makes a decision.
 */
export declare function recordGovernanceDecision(action: string, allowed: boolean, blocked: boolean): void;
/**
 * Track a shadow run ID.
 */
export declare function trackShadowRun(shadow_run_id: string): void;
/**
 * Collect all metrics for the current period.
 */
export declare function collectMetrics(shadow_run_id?: string): Promise<OrchestrationMetrics>;
/**
 * Take a snapshot of current metrics.
 * Snapshots are stored for historical comparison.
 */
export declare function takeMetricsSnapshot(shadow_run_id?: string): Promise<MetricsSnapshot>;
/**
 * Save metrics snapshot to Supabase.
 */
export declare function saveMetricsSnapshot(snapshot: MetricsSnapshot): Promise<void>;
/**
 * Get metrics for a time range.
 */
export declare function getMetricsRange(from: string, to: string): Promise<OrchestrationMetrics[]>;
/**
 * Get real-time metrics summary.
 * Lightweight call for dashboards / health checks.
 */
export declare function getRealTimeMetrics(): {
    events_processed: number;
    avg_processing_ms: number;
    queue_depth: number;
    recent_errors: number;
    governance_blocked: number;
    redis_connected: boolean;
};
/**
 * Reset metrics collection (for testing).
 */
export declare function resetMetrics(): void;
/**
 * Get summary of all shadow run IDs.
 */
export declare function getTrackedShadowRuns(): string[];
//# sourceMappingURL=metrics-collector.d.ts.map