/**
 * Structured Logger — Observability Hooks
 * Phase 3: Emits structured, machine-parseable log entries for every event
 *
 * Every event processed by the orchestration runtime generates a structured
 * log entry with consistent fields:
 *   { event_id, event_type, timestamp, source, correlation_id, duration_ms, success }
 *
 * This enables:
 * - Query-based log analysis (Elasticsearch, Grafana Loki, etc.)
 * - Event pipeline debugging and tracing
 * - Performance analysis and bottleneck identification
 * - Audit trails for governance
 *
 * Shadow-safe: logs what would have happened without making real calls.
 */
export interface StructuredLogEntry {
    event_id: string;
    event_type: string;
    timestamp: string;
    duration_ms: number;
    source: string;
    correlation_id: string | null;
    success: boolean;
    error?: string;
    hop_count?: number;
    mode?: 'shadow' | 'production';
    job_id?: string;
}
/**
 * Emit a structured log entry to console.
 *
 * In production, this would be routed to a log aggregation system.
 * Currently outputs as JSON to stdout for machine parsing.
 */
export declare function emitStructuredLog(entry: StructuredLogEntry): void;
/**
 * Log an event start — marks the beginning of event processing.
 */
export declare function logEventStart(params: {
    event_id: string;
    event_type: string;
    source: string;
    correlation_id?: string;
    hop_count?: number;
    mode?: 'shadow' | 'production';
    job_id?: string;
}): void;
/**
 * Log an event completion — marks the end of event processing.
 */
export declare function logEventComplete(params: {
    event_id: string;
    event_type: string;
    duration_ms: number;
    source: string;
    correlation_id?: string;
    success: boolean;
    error?: string;
    hop_count?: number;
    mode?: 'shadow' | 'production';
    job_id?: string;
}): void;
/**
 * Wrap a handler function to automatically emit structured logs.
 *
 * Usage:
 *   const wrappedHandler = withStructuredLogging(originalHandler, 'event-router');
 *   await registerRoute('job.*', wrappedHandler);
 */
export declare function withStructuredLogging<T extends {
    event_id: string;
    event_type: string;
    source: string;
    correlation_id?: string;
    hop_count?: number;
}>(handler: (event: T) => void | Promise<void>, source: string, mode?: 'shadow' | 'production'): (event: T) => void | Promise<void>;
/**
 * Create a timing helper for measuring operation duration.
 */
export declare function startTimer(): () => number;
/**
 * Emit a batch of structured logs for queue monitoring.
 */
export declare function logQueueMetrics(params: {
    pending: number;
    active: number;
    retry: number;
    dead_letter: number;
    timestamp?: string;
}): void;
//# sourceMappingURL=structured-logger.d.ts.map